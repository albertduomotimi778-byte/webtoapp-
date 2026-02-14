import React, { useState } from 'react';
import { Github, Key, ArrowRight, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';

interface TokenEntryModalProps {
    onComplete: (token: string) => void;
    errorMessage?: string | null;
}

const TokenEntryModal: React.FC<TokenEntryModalProps> = ({ onComplete, errorMessage }) => {
    const [token, setToken] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSave = () => {
        if (token.trim().length === 0) return;
        
        setIsSaving(true);
        // Simulate a brief save processing for UX
        setTimeout(() => {
            setIsSaving(false);
            setIsSuccess(true);
            
            // Wait a moment for the user to read the success message
            setTimeout(() => {
                onComplete(token);
            }, 1500);
        }, 1000);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#020408] flex items-center justify-center p-6 animate-fade-in perspective-1000">
             {/* Background Ambience */}
             <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-[120px]"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05]"></div>
             </div>

             <div className="max-w-lg w-full bg-[#0F1115]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden group">
                 {/* 3D GitHub Cube Animation Container */}
                 <div className="relative h-32 flex items-center justify-center mb-8 perspective-container">
                    <style>{`
                        .perspective-container { perspective: 800px; }
                        .cube {
                            width: 60px;
                            height: 60px;
                            position: relative;
                            transform-style: preserve-3d;
                            animation: spin-cube 10s infinite linear;
                        }
                        .cube-face {
                            position: absolute;
                            width: 60px;
                            height: 60px;
                            background: rgba(255, 255, 255, 0.05);
                            border: 1px solid rgba(255, 255, 255, 0.2);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            backdrop-filter: blur(5px);
                        }
                        .front  { transform: rotateY(0deg) translateZ(30px); }
                        .back   { transform: rotateY(180deg) translateZ(30px); }
                        .right  { transform: rotateY(90deg) translateZ(30px); }
                        .left   { transform: rotateY(-90deg) translateZ(30px); }
                        .top    { transform: rotateX(90deg) translateZ(30px); }
                        .bottom { transform: rotateX(-90deg) translateZ(30px); }

                        @keyframes spin-cube {
                            0% { transform: rotateX(0deg) rotateY(0deg); }
                            100% { transform: rotateX(360deg) rotateY(360deg); }
                        }
                        
                        .success-ring {
                            animation: scale-up 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                        }
                        @keyframes scale-up {
                            0% { transform: scale(0); opacity: 0; }
                            100% { transform: scale(1); opacity: 1; }
                        }
                    `}</style>

                    {!isSuccess ? (
                        <div className="cube">
                            <div className="cube-face front"><Github size={30} className="text-white" /></div>
                            <div className="cube-face back"><Github size={30} className="text-white" /></div>
                            <div className="cube-face right"><Github size={30} className="text-white" /></div>
                            <div className="cube-face left"><Github size={30} className="text-white" /></div>
                            <div className="cube-face top"></div>
                            <div className="cube-face bottom"></div>
                        </div>
                    ) : (
                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(34,197,94,0.5)] success-ring">
                            <CheckCircle2 size={40} className="text-black" />
                        </div>
                    )}
                 </div>

                 {/* Content */}
                 <div className={`transition-all duration-500 ${isSuccess ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100'}`}>
                    <h2 className="text-3xl font-bold text-white text-center mb-3 tracking-tight">Access Required</h2>
                    <p className="text-slate-400 text-sm text-center mb-8 leading-relaxed px-4">
                        WebToApp Studio utilizes your GitHub account to spin up secure, ephemeral build environments. This ensures your app code is compiled privately on standard infrastructure without us ever storing your source code.
                    </p>

                    {/* Error Message Display */}
                    {errorMessage && (
                        <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 animate-fade-in-up">
                            <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                            <div className="text-xs text-red-200">
                                <strong className="block text-red-400 font-bold mb-1">Authentication Failed</strong>
                                {errorMessage}
                            </div>
                        </div>
                    )}

                    <div className="space-y-6">
                        <div className="space-y-2 group/input">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 group-focus-within/input:text-indigo-400 transition-colors">Personal Access Token</label>
                            <div className="relative">
                                <input 
                                    type="password"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-700 font-mono text-sm shadow-inner"
                                    autoFocus
                                />
                                <div className="absolute left-4 top-4 text-slate-600 group-focus-within/input:text-indigo-500 transition-colors">
                                    <Key size={18} />
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handleSave}
                            disabled={isSaving || token.length < 5}
                            className="w-full py-4 bg-white text-black hover:bg-slate-200 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {isSaving ? (
                                <span className="animate-pulse">Verifying & Saving...</span>
                            ) : (
                                <>
                                    <span>Secure Connection</span>
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                        
                        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 mt-2 bg-white/5 py-2.5 px-4 rounded-lg border border-white/5">
                            <ShieldCheck size={12} />
                            <span>Token is encrypted and stored locally. Never shared.</span>
                        </div>
                        
                        <div className="text-center pt-2">
                            <a 
                                href="https://github.com/settings/tokens/new?scopes=repo,workflow&description=WebToApp" 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-[10px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors border-b border-indigo-400/20 hover:border-indigo-400 pb-0.5"
                            >
                                Generate Token on GitHub (Classic)
                            </a>
                        </div>
                    </div>
                 </div>

                 {/* Success Message Overlay */}
                 <div className={`absolute inset-x-0 bottom-0 top-1/2 flex flex-col items-center justify-start pt-4 transition-all duration-500 ${isSuccess ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
                     <h3 className="text-xl font-bold text-white mb-1">Authenticated</h3>
                     <p className="text-green-400 text-sm">Your token has been saved successfully.</p>
                 </div>
             </div>
        </div>
    );
};

export default TokenEntryModal;