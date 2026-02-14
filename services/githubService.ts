import { AppConfig } from "../types";
import { generateProjectFiles } from "../utils/projectGenerator";
import JSZip from "jszip";

const GITHUB_API = "https://api.github.com";

const ghFetch = async (url: string, token: string, options: RequestInit = {}) => {
  const headers = {
    "Authorization": `token ${token}`,
    "Accept": "application/vnd.github.v3+json",
    "Content-Type": "application/json",
    ...options.headers,
  };
  
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `GitHub API Error: ${res.status}`);
  }
  return res;
};

export const createRepo = async (token: string, name: string): Promise<string> => {
  // OPTIMIZATION: Removed separate GET /user call. 
  // We use the response from create repo to get the full name (owner/repo).
  const repoName = `app-builder-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;

  const res = await ghFetch(`${GITHUB_API}/user/repos`, token, {
    method: 'POST',
    body: JSON.stringify({
      name: repoName,
      private: true,
      auto_init: true, // Auto init creates a commit, which gives us a HEAD reference to start from
      description: "Auto-generated Android App"
    })
  });

  const data = await res.json();
  return data.full_name;
};

export const pushFilesToRepo = async (token: string, repoFullName: string, config: AppConfig) => {
  const files = generateProjectFiles(config);
  
  // OPTIMIZATION: Start uploading blobs immediately. 
  // File content uploading is the slowest part, so we do it in parallel 
  // while we fetch the necessary git references.
  const blobsPromise = Promise.all(files.map(async (file) => {
    const blobRes = await ghFetch(`${GITHUB_API}/repos/${repoFullName}/git/blobs`, token, {
      method: 'POST',
      body: JSON.stringify({
        content: file.content,
        encoding: file.encoding
      })
    });
    const blobData = await blobRes.json();
    return {
      path: file.path,
      mode: "100644",
      type: "blob",
      sha: blobData.sha
    };
  }));

  // OPTIMIZATION: Fetch the base tree SHA in parallel with blob uploads.
  const baseTreePromise = (async () => {
    // 1. Get the latest commit SHA from the auto-initialized repo
    const refRes = await ghFetch(`${GITHUB_API}/repos/${repoFullName}/git/ref/heads/main`, token);
    const refData = await refRes.json();
    const latestCommitSha = refData.object.sha;

    // 2. Get the tree of the latest commit
    const commitRes = await ghFetch(`${GITHUB_API}/repos/${repoFullName}/git/commits/${latestCommitSha}`, token);
    const commitData = await commitRes.json();
    
    return { latestCommitSha, baseTreeSha: commitData.tree.sha };
  })();

  // Wait for both parallel tasks (File Uploads & Git State Fetching)
  const [treeItems, { latestCommitSha, baseTreeSha }] = await Promise.all([blobsPromise, baseTreePromise]);

  // 4. Create a new Tree
  const treeRes = await ghFetch(`${GITHUB_API}/repos/${repoFullName}/git/trees`, token, {
    method: 'POST',
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: treeItems
    })
  });
  const treeData = await treeRes.json();

  // 5. Create a new Commit
  const newCommitRes = await ghFetch(`${GITHUB_API}/repos/${repoFullName}/git/commits`, token, {
    method: 'POST',
    body: JSON.stringify({
      message: "Initial App Generation",
      tree: treeData.sha,
      parents: [latestCommitSha]
    })
  });
  const newCommitData = await newCommitRes.json();

  // 6. Update the Reference (The Push)
  await ghFetch(`${GITHUB_API}/repos/${repoFullName}/git/refs/heads/main`, token, {
    method: 'PATCH',
    body: JSON.stringify({
      sha: newCommitData.sha
    })
  });
};

export const waitForBuildCompletion = async (token: string, repoFullName: string, onStatus?: (status: string) => void): Promise<number> => {
  const startTime = Date.now();
  let hasNotifiedActive = false;
  
  // ULTRA FAST: Initial wait reduced to 500ms.
  await new Promise(r => setTimeout(r, 500));

  // Polling every 1 second
  while (Date.now() - startTime < 1000 * 60 * 10) { 
    const runsRes = await ghFetch(`${GITHUB_API}/repos/${repoFullName}/actions/runs?event=push`, token);
    const runsData = await runsRes.json();
    
    if (runsData.workflow_runs && runsData.workflow_runs.length > 0) {
      const latestRun = runsData.workflow_runs[0];
      
      if (latestRun.status === "completed") {
        if (latestRun.conclusion === "success") {
          return latestRun.id;
        } else {
          const error: any = new Error(`Build failed with status: ${latestRun.conclusion}`);
          error.runId = latestRun.id;
          throw error;
        }
      } else if (!hasNotifiedActive && (latestRun.status === "queued" || latestRun.status === "in_progress")) {
          // Provide immediate feedback
          if (onStatus) onStatus(`Cloud Build Active (${latestRun.status})...`);
          hasNotifiedActive = true;
      }
    }
    // Very fast polling interval (1s)
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error("Build timed out");
};

export const getArtifactDownloadUrl = async (token: string, repoFullName: string, runId: number): Promise<string> => {
  const artifactsRes = await ghFetch(`${GITHUB_API}/repos/${repoFullName}/actions/runs/${runId}/artifacts`, token);
  const artifactsData = await artifactsRes.json();
  
  const artifact = artifactsData.artifacts.find((a: any) => a.name.includes('APK') || a.name.includes('Exe') || a.name.includes('Source'));
  if (!artifact) throw new Error("Build Artifact not found.");

  const downloadRes = await fetch(artifact.archive_download_url, {
    headers: { "Authorization": `token ${token}` }
  });
  
  if (!downloadRes.ok) throw new Error("Failed to download artifact blob");
  
  const blob = await downloadRes.blob();
  
  if (artifact.name.includes('APK')) {
      try {
        const zip = await JSZip.loadAsync(blob);
        const apkFile = Object.values(zip.files).find((f: any) => f.name.endsWith('.apk'));
        
        if (apkFile) {
            const apkBlob = await (apkFile as any).async('blob');
            return URL.createObjectURL(apkBlob);
        }
      } catch (e) {
        console.warn("Failed to extract APK from artifact, returning zip instead", e);
      }
  }
  
  return URL.createObjectURL(blob);
};

export const deleteRepo = async (token: string, repoFullName: string) => {
  await ghFetch(`${GITHUB_API}/repos/${repoFullName}`, token, {
    method: 'DELETE'
  });
};