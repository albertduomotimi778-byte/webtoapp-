
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppConfig, GenerationStep, AppPermissions, Platform } from './types';
import PhonePreview from './components/PhonePreview';
import IntroOverlay from './components/IntroOverlay';
import PremiumModal from './components/PremiumModal';
import TokenEntryModal from './components/TokenEntryModal';
import DevModeModal from './components/DevModeModal';
import { createRepo, pushFilesToRepo, waitForBuildCompletion, getArtifactDownloadUrl, deleteRepo } from './services/githubService';
import * as AllIcons from 'lucide-react';
import { 
  Link as LinkIcon, 
  Loader2, 
  Zap, 
  Image as ImageIcon, 
  Type, 
  Palette, 
  Smartphone, 
  Camera, 
  Mic, 
  MapPin, 
  FolderOpen, 
  Monitor, 
  Apple, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  ExternalLink, 
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Download,
  Lock,
  Crown,
  Star,
  ShieldCheck,
  Cpu,
  ChevronDown,
  ChevronUp,
  Terminal,
  FileCode,
  Box,
  Share2,
  DollarSign,
  CreditCard,
  Bell,
  ShoppingCart,
  Timer,
  Grid,
  Video,
  Search,
  PaintBucket,
  PenTool,
  AlarmClock,
  CalendarDays,
  Clock
} from 'lucide-react';

// --- ICON PICKER COMPONENT ---
const IconPickerModal = ({ isOpen, onClose, onSelect, isPremium, onUpgrade }: { 
    isOpen: boolean, 
    onClose: () => void, 
    onSelect: (base64: string) => void,
    isPremium: boolean,
    onUpgrade: () => void
}) => {
    const [selectedColor, setSelectedColor] = useState('#6366f1'); // Background
    const [iconColor, setIconColor] = useState('#ffffff'); // Icon/Text Foreground
    
    const [selectedLetter, setSelectedLetter] = useState('A');
    const [selectedEmoji, setSelectedEmoji] = useState('🚀');
    const [selectedIconName, setSelectedIconName] = useState<string>('Rocket');
    
    const [mode, setMode] = useState<'letter' | 'emoji' | 'icon'>('letter');
    const [searchTerm, setSearchTerm] = useState('');

    const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#0f172a', '#64748b'];
    const emojis = ['🚀', '⚡', '🔥', '💎', '🛒', '🎮', '🎵', '📷', '📅', '💬', '✨', '🏆', '🍔', '✈️', '💼', '🏠', '❤️', '⭐', '📱', '💻'];

    // Filter Lucide icons for the library
    const iconList = useMemo(() => {
        return Object.keys(AllIcons)
            .filter(key => key !== 'createLucideIcon' && key !== 'default' && key !== 'icons')
            .filter(key => key.toLowerCase().includes(searchTerm.toLowerCase()))
            .slice(0, 200); // Limit render for performance, search handles the rest
    }, [searchTerm]);

    const generateIcon = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 1. Draw Background
        ctx.fillStyle = selectedColor;
        ctx.fillRect(0, 0, 512, 512);

        // 2. Draw Content based on Mode
        if (mode === 'icon') {
            // Complex SVG Rendering Logic
            const iconSvgStr = renderIconToSvgString(selectedIconName, iconColor);
            const img = new Image();
            img.onload = () => {
                // Center the icon (256x256 size centered in 512x512)
                ctx.drawImage(img, 128, 128, 256, 256);
                onSelect(canvas.toDataURL('image/png'));
                onClose();
            };
            img.src = 'data:image/svg+xml;base64,' + btoa(iconSvgStr);
        } else {
            // Simple Text/Emoji Rendering
            ctx.fillStyle = iconColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            if (mode === 'letter') {
                ctx.font = 'bold 300px sans-serif';
                ctx.fillText(selectedLetter, 256, 256);
            } else {
                 ctx.font = '250px sans-serif';
                 ctx.fillText(selectedEmoji, 256, 270);
            }
            
            onSelect(canvas.toDataURL('image/png'));
            onClose();
        }
    };

    // Helper to generate SVG string from Lucide Icon name
    const renderIconToSvgString = (iconName: string, color: string) => {
        // We create a temporary SVG string. 
        const tempDiv = document.createElement('div');
        
        const previewSvg = document.getElementById('preview-icon-svg');
        if (previewSvg) {
            const serializer = new XMLSerializer();
            let source = serializer.serializeToString(previewSvg);
            
            // Inject the color and size for the high-res render
            source = source.replace(/width="[^"]*"/, 'width="512"');
            source = source.replace(/height="[^"]*"/, 'height="512"');
            // Ensure color is correct in the serialized string if not set by attributes
            return source;
        }
        return '';
    };

    if (!isOpen) return null;

    // Get the specific Icon component for preview
    const SelectedIconComponent = (AllIcons as any)[selectedIconName] || AllIcons.Rocket;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#0F1115] border border-white/10 rounded-2xl w-full max-w-lg p-0 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/5 bg-[#15171C]">
                    <div>
                        <h3 className="text-white font-bold text-lg flex items-center gap-2">
                            <Palette size={20} className="text-indigo-400" />
                            Icon Studio
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">Design your app's home screen presence</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    
                    {/* Preview Area */}
                    <div className="flex gap-6 items-start">
                        <div className="shrink-0 space-y-2">
                             <div className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Preview</div>
                             <div 
                                className="w-32 h-32 rounded-2xl shadow-2xl flex items-center justify-center shrink-0 ring-1 ring-white/10" 
                                style={{backgroundColor: selectedColor}}
                             >
                                {mode === 'icon' ? (
                                    <SelectedIconComponent 
                                        id="preview-icon-svg"
                                        size={64} 
                                        color={iconColor} 
                                        strokeWidth={1.5}
                                    />
                                ) : (
                                    <span className="text-6xl font-bold select-none" style={{color: iconColor}}>
                                        {mode === 'letter' ? selectedLetter : selectedEmoji}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 space-y-6">
                            {/* Mode Tabs */}
                            <div className="bg-black/30 p-1 rounded-lg flex border border-white/5">
                                 {(['letter', 'emoji', 'icon'] as const).map(m => (
                                     <button 
                                        key={m}
                                        onClick={() => setMode(m)}
                                        className={`flex-1 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${mode === m ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                                     >
                                         {m}
                                     </button>
                                 ))}
                            </div>

                            {/* Controls based on Mode */}
                            {mode === 'letter' && (
                                <div className="space-y-2">
                                    <label className="text-xs text-slate-400 font-bold uppercase">Character</label>
                                    <input 
                                        type="text" 
                                        maxLength={1} 
                                        value={selectedLetter} 
                                        onChange={(e) => setSelectedLetter(e.target.value.toUpperCase())}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center font-bold text-2xl uppercase focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            )}

                            {mode === 'emoji' && (
                                 <div className="grid grid-cols-5 gap-2 h-32 overflow-y-auto custom-scrollbar p-1">
                                     {emojis.map(e => (
                                         <button 
                                            key={e} 
                                            onClick={() => setSelectedEmoji(e)} 
                                            className={`hover:bg-white/10 rounded-lg text-2xl h-10 flex items-center justify-center transition-colors ${selectedEmoji === e ? 'bg-white/10 ring-1 ring-indigo-500' : ''}`}
                                         >
                                             {e}
                                         </button>
                                     ))}
                                 </div>
                            )}

                            {mode === 'icon' && (
                                <div className="space-y-3 relative">
                                    {/* Search */}
                                    <div className="relative">
                                        <input 
                                            type="text"
                                            placeholder="Search icons..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                        />
                                        <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
                                    </div>

                                    {/* Grid */}
                                    <div className="grid grid-cols-5 gap-2 h-32 overflow-y-auto custom-scrollbar p-1 relative">
                                        {iconList.map(name => {
                                            const Icon = (AllIcons as any)[name];
                                            if (!Icon) return null;
                                            return (
                                                <button
                                                    key={name}
                                                    onClick={() => setSelectedIconName(name)}
                                                    className={`hover:bg-white/10 rounded-lg h-10 flex items-center justify-center transition-colors ${selectedIconName === name ? 'bg-indigo-500 text-white' : 'text-slate-400'}`}
                                                    title={name}
                                                >
                                                    <Icon size={20} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="h-px bg-white/5"></div>

                    {/* Color Pickers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Background Color */}
                        <div className="space-y-3">
                            <label className="text-xs text-slate-400 font-bold uppercase flex items-center gap-2">
                                <PaintBucket size={12} />
                                Background
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {colors.slice(0, 5).map(c => (
                                    <button 
                                        key={c}
                                        onClick={() => setSelectedColor(c)}
                                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${selectedColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                                        style={{backgroundColor: c}}
                                    />
                                ))}
                                <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-white/20 hover:border-white transition-colors">
                                    <input 
                                        type="color" 
                                        value={selectedColor} 
                                        onChange={(e) => setSelectedColor(e.target.value)}
                                        className="absolute inset-[-50%] w-[200%] h-[200%] cursor-pointer p-0 m-0 border-0" 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Foreground Color */}
                        <div className="space-y-3">
                            <label className="text-xs text-slate-400 font-bold uppercase flex items-center gap-2">
                                <PenTool size={12} />
                                Icon / Text
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {['#ffffff', '#000000', ...colors.slice(2, 5)].map(c => (
                                    <button 
                                        key={c}
                                        onClick={() => setIconColor(c)}
                                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center ${iconColor === c ? 'border-indigo-400 scale-110' : 'border-white/10'}`}
                                        style={{backgroundColor: c === '#ffffff' ? '#15171C' : '#15171C'}} // Swatch background always dark
                                    >
                                        <div className="w-4 h-4 rounded-full shadow-sm" style={{backgroundColor: c}}></div>
                                    </button>
                                ))}
                                <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-white/20 hover:border-white transition-colors bg-[#15171C] flex items-center justify-center">
                                    <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-red-500 to-blue-500"></div>
                                    <input 
                                        type="color" 
                                        value={iconColor} 
                                        onChange={(e) => setIconColor(e.target.value)}
                                        className="absolute inset-[-50%] w-[200%] h-[200%] cursor-pointer opacity-0" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-[#15171C] border-t border-white/5">
                    <button 
                        onClick={generateIcon}
                        className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-colors shadow-lg shadow-white/5 flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 size={18} />
                        Apply Icon to Build
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- COLLAPSIBLE SECTION COMPONENT FOR MOBILE ---
const ConfigSection = ({ 
    title, 
    icon: Icon, 
    children, 
    isOpen, 
    onToggle, 
    className = "" 
}: { 
    title: string, 
    icon: any, 
    children?: React.ReactNode, 
    isOpen: boolean, 
    onToggle: () => void,
    className?: string
}) => {
    return (
        <div className={`bg-[#0F1115] md:rounded-[2rem] shadow-xl border border-white/5 overflow-hidden ring-1 ring-white/5 transition-all duration-300 ${className} ${isOpen ? 'rounded-[1.5rem] mb-4' : 'rounded-xl mb-2'}`}>
            <button 
                onClick={onToggle}
                className={`w-full flex items-center justify-between p-6 md:p-8 md:cursor-default ${isOpen ? 'border-b border-white/5' : ''}`}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg border transition-colors ${isOpen ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-white/5 text-slate-400 border-white/5'}`}>
                        <Icon size={18} />
                    </div>
                    <h3 className={`font-bold text-sm uppercase tracking-widest transition-colors ${isOpen ? 'text-white' : 'text-slate-400'}`}>{title}</h3>
                </div>
                <div className="md:hidden text-slate-500">
                    {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
            </button>
            <div className={`${isOpen ? 'block' : 'hidden'} md:block animate-fade-in`}>
                {children}
            </div>
        </div>
    );
};

const BuildTerminalOverlay = ({ 
    logs, 
    isVisible, 
    timeLeft 
}: { 
    logs: string[], 
    isVisible: boolean, 
    timeLeft: number 
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black text-green-500 font-mono text-sm flex flex-col p-6 md:p-12 overflow-hidden">
             {/* Matrix / Grid Background */}
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.1]"></div>
             <div className="absolute inset-0" 
                  style={{ backgroundImage: 'linear-gradient(rgba(0,255,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,0,0.03) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
             </div>

             <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col h-full border border-green-500/30 rounded-lg bg-black/90 shadow-[0_0_50px_rgba(34,197,94,0.1)]">
                  {/* Terminal Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-green-500/30 bg-green-900/10">
                       <div className="flex items-center gap-4">
                           <Terminal size={20} className="animate-pulse" />
                           <span className="font-bold tracking-widest uppercase text-xs">WebToApp Compiler v2.4.0</span>
                       </div>
                       <div className="flex gap-2">
                           <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                           <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                           <div className="w-3 h-3 rounded-full bg-green-500"></div>
                       </div>
                  </div>

                  {/* Terminal Output */}
                  <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-2 custom-scrollbar">
                       <div className="text-green-700 mb-4">
                           {`// Initializing secure build environment...`}
                           <br/>
                           {`// Connecting to cloud runner...`}
                       </div>
                       {logs.map((log, i) => (
                           <div key={i} className="flex gap-3 animate-fade-in">
                               <span className="text-green-800 shrink-0">{`>>`}</span>
                               <span className="text-green-400">{log}</span>
                           </div>
                       ))}
                       <div className="animate-pulse text-green-500">_</div>
                  </div>

                  {/* Progress Footer */}
                  <div className="p-6 border-t border-green-500/30 bg-green-900/5">
                       <div className="flex justify-between items-end mb-2">
                            <div className="flex flex-col">
                                <span className="text-xs uppercase tracking-widest text-green-700">Estimated Time Remaining</span>
                                <span className="text-3xl font-bold text-white tabular-nums">{timeLeft}s</span>
                            </div>
                            <div className="text-xs text-green-600 animate-pulse">
                                COMPILING SOURCE CODE
                            </div>
                       </div>
                       <div className="h-2 w-full bg-green-900/30 rounded-full overflow-hidden">
                           <div 
                                className="h-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)] transition-all duration-1000 ease-linear"
                                style={{ width: `${Math.max(0, 100 - (timeLeft / 45) * 100)}%` }}
                           ></div>
                       </div>
                  </div>
             </div>
        </div>
    );
};

const App: React.FC = () => {
  const [hasEntered, setHasEntered] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [step, setStep] = useState<GenerationStep>(GenerationStep.IDLE);
  
  // Platform selection state (null means selection screen)
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);

  // Premium State
  const [isPremium, setIsPremium] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [premiumExpired, setPremiumExpired] = useState(false); // To show specific message

  // Dev Mode State
  const [devMode, setDevMode] = useState(false);
  const [showDevModal, setShowDevModal] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  
  // Initial Token Entry State
  const [showTokenEntry, setShowTokenEntry] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Mobile Accordion State
  const [openSection, setOpenSection] = useState<'basic' | 'perms'>('basic');

  // Build Time Estimation
  const [timeLeft, setTimeLeft] = useState(45);

  const [config, setConfig] = useState<AppConfig>({
    platform: 'android',
    url: '',
    name: '',
    description: '',
    iconBase64: null,
    themeColor: '#6366f1',
    githubToken: '',
    permissions: {
        camera: false,
        microphone: false,
        location: false,
        fileUpload: true, // Default enabled for downloads
        popups: false,
        pushNotifications: false,
        screenRecording: false,
        alarmReminders: false
    },
    isPremium: false
  });

  const [error, setError] = useState<string | null>(null);
  const [buildLogs, setBuildLogs] = useState<string[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper: Expire Premium (Natural Expiration)
  const expirePremium = () => {
      setIsPremium(false);
      localStorage.removeItem('is_premium_user');
      localStorage.removeItem('premium_expiry');
      setPremiumExpired(true);
      setShowPremiumModal(true);
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  };
  
  // Helper: Reset to Free (Manual Action / Dev Mode Exit)
  const resetToFree = () => {
      setIsPremium(false);
      localStorage.removeItem('is_premium_user');
      localStorage.removeItem('premium_expiry');
      setPremiumExpired(false);
      setShowPremiumModal(false);
  };

  // Main Premium Activation Function
  const activatePremium = () => {
      const now = new Date();
      // 30 Days Expiration
      const expiryDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
      
      setIsPremium(true);
      localStorage.setItem('is_premium_user', 'true');
      localStorage.setItem('premium_expiry', expiryDate.toISOString());
      
      setPremiumExpired(false);
  };

  // Initialize Premium State & Listen for Native Events
  useEffect(() => {
    const savedToken = localStorage.getItem('gh_token');
    if (savedToken) setGithubToken(savedToken);

    // Check Premium Status from LocalStorage with Expiry
    const storedPremium = localStorage.getItem('is_premium_user');
    const expiryStr = localStorage.getItem('premium_expiry');
    
    if (storedPremium === 'true') {
         if (expiryStr) {
             const expiryDate = new Date(expiryStr);
             const now = new Date();
             
             if (now > expiryDate) {
                 // Expired
                 console.log("Premium subscription expired.");
                 expirePremium();
             } else {
                 // Valid
                 setIsPremium(true);
             }
         } else {
             // Legacy or valid without expiry (dev mode etc), assume valid or migrate
             setIsPremium(true);
         }
    }

    // Listen for NATIVE APP Injection
    const checkNativePremium = () => {
        if ((window as any).isNativeAppPremium) {
            console.log("Native Premium Detected via Flag");
            activatePremium();
            return;
        }
    };
    checkNativePremium();

    window.addEventListener('native-premium-active', activatePremium);
    return () => window.removeEventListener('native-premium-active', activatePremium);
  }, []);

  // --- PERIODIC EXPIRY CHECKER ---
  useEffect(() => {
      const checkExpiry = () => {
          if (!isPremium) return;
          if (devMode) return; // Dev mode bypasses expiry checks while active

          const expiryStr = localStorage.getItem('premium_expiry');
          if (expiryStr) {
              const expiryDate = new Date(expiryStr);
              const now = new Date();
              
              if (now > expiryDate) {
                  console.log("Subscription expired via interval check.");
                  expirePremium();
              }
          }
      };

      // Check every 5 seconds to be responsive to world time changes
      const interval = setInterval(checkExpiry, 5000); 

      return () => clearInterval(interval);
  }, [isPremium, devMode]);

  useEffect(() => {
    if (selectedPlatform) {
        setConfig(prev => ({ ...prev, platform: selectedPlatform }));
    }
  }, [selectedPlatform]);

  // Sync isPremium state with config
  useEffect(() => {
    setConfig(prev => ({ ...prev, isPremium }));
  }, [isPremium, devMode]);

  // Build Timer Countdown Logic (Visual only for build process)
  useEffect(() => {
      let interval: any;
      if (step !== GenerationStep.IDLE && step !== GenerationStep.FINISHED && step !== GenerationStep.ERROR) {
          interval = setInterval(() => {
              setTimeLeft((prev) => {
                  if (prev <= 1) return 1; // Hold at 1s until done
                  return prev - 1;
              });
          }, 1000);
      } else {
          setTimeLeft(45); // Reset
      }
      return () => clearInterval(interval);
  }, [step]);

  const handleEnterApp = async () => {
    try {
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) {
            await docEl.requestFullscreen();
        } else if ((docEl as any).webkitRequestFullscreen) {
            await (docEl as any).webkitRequestFullscreen();
        } else if ((docEl as any).msRequestFullscreen) {
            await (docEl as any).msRequestFullscreen();
        }
    } catch (e) {
        console.warn("Fullscreen request denied or not supported by browser:", e);
    }
    
    // Check if we have a token saved
    const savedToken = localStorage.getItem('gh_token');
    if (savedToken) {
        setHasEntered(true);
    } else {
        setShowTokenEntry(true);
    }
  };

  const handleTokenSubmit = (token: string) => {
    localStorage.setItem('gh_token', token);
    setGithubToken(token);
    setTokenError(null);
    setShowTokenEntry(false);
    setHasEntered(true);
  };

  const handleLogoClick = () => {
    const newCount = logoClicks + 1;
    setLogoClicks(newCount);
    
    if (newCount >= 5) {
        setLogoClicks(0);
        if (devMode) {
            setDevMode(false);
            // EXIT DEV MODE: Clear subscription and default to Free
            resetToFree();
        } else {
            setShowDevModal(true);
        }
    }
  };

  const handleDevSuccess = () => {
      setDevMode(true);
      activatePremium(); // Dev mode unlocks via same mechanism
      setShowDevModal(false);
  };

  const addLog = (msg: string) => setBuildLogs(prev => {
    if (prev[prev.length - 1] === msg) return prev;
    return [...prev, msg];
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig(prev => ({ ...prev, iconBase64: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const togglePermission = (key: keyof AppPermissions) => {
      setConfig(prev => ({
          ...prev,
          permissions: {
              ...prev.permissions,
              [key]: !prev.permissions[key]
          }
      }));
  };

  const resetBuild = () => {
      setStep(GenerationStep.IDLE);
      setBuildLogs([]);
      setError(null);
      setDownloadUrl(null);
  };

  const handleCloudBuild = async () => {
    // --- PREMIUM GATE ---
    if (!isPremium && !devMode) {
        setShowPremiumModal(true);
        return;
    }

    if (!githubToken) {
      const stored = localStorage.getItem('gh_token');
      if (stored) {
          setGithubToken(stored);
      } else {
          setShowTokenEntry(true);
          return;
      }
    }
    
    if (!config.url || !config.name) {
      setError("URL and App Name are required.");
      return;
    }
    
    setBuildLogs([]);
    setError(null);
    setDownloadUrl(null);
    setTimeLeft(45); // Start estimation

    let repoName = "";

    try {
      setStep(GenerationStep.CREATING_REPO);
      addLog(`Initializing ${config.platform} build environment...`);
      const tokenToUse = githubToken || localStorage.getItem('gh_token') || '';
      repoName = await createRepo(tokenToUse, config.name);
      addLog("Secure repository created.");

      setStep(GenerationStep.PUSHING_CODE);
      addLog("Fast-tracking code upload...");
      await pushFilesToRepo(tokenToUse, repoName, config);
      addLog("Code pushed successfully.");

      setStep(GenerationStep.WAITING_FOR_BUILD);
      addLog("Triggering Cloud Build Server...");
      
      const runId = await waitForBuildCompletion(tokenToUse, repoName, (status) => {
          addLog(status);
      });
      addLog("Build Successful.");

      setStep(GenerationStep.DOWNLOADING_ARTIFACT);
      addLog("Retrieving App Artifact...");
      const url = await getArtifactDownloadUrl(tokenToUse, repoName, runId);
      setDownloadUrl(url);

      setStep(GenerationStep.DELETING_REPO);
      addLog("Cleaning up secure resources...");
      try {
        await deleteRepo(tokenToUse, repoName);
      } catch (e) {
        console.warn("Cleanup warning", e);
      }
      
      setStep(GenerationStep.FINISHED);
      addLog("Ready to Install!");

    } catch (err: any) {
      console.error(err);
      
      // Handle Authentication Error specifically
      if (err.message.includes("Bad credentials") || err.message.includes("401")) {
          localStorage.removeItem('gh_token');
          setGithubToken('');
          setTokenError("Authentication Failed: The provided GitHub Token is invalid or expired. Please generate a new one.");
          setHasEntered(false); // Exit app view
          setShowTokenEntry(true); // Show token modal
          setStep(GenerationStep.IDLE); // Reset build step
          return;
      }

      addLog(`Error: ${err.message}`);
      setError(err.message);
      setStep(GenerationStep.ERROR);
    }
  };

  const handleDownloadArtifact = async () => {
      if (!downloadUrl) return;
      
      const fileName = `${config.name.replace(/\s+/g, '-').toLowerCase()}.${config.platform === 'android' ? 'apk' : 'zip'}`;
      
      // Feature detection for Web Share API Level 2 (File sharing)
      if (navigator.share && navigator.canShare) {
          try {
              const response = await fetch(downloadUrl);
              const blob = await response.blob();
              const file = new File([blob], fileName, { type: blob.type });
              
              if (navigator.canShare({ files: [file] })) {
                  await navigator.share({
                      files: [file],
                      title: `Install ${config.name}`,
                      text: 'Here is your compiled application.'
                  });
                  return;
              }
          } catch (err) {
              console.warn("Native sharing failed, falling back to direct download.", err);
          }
      }
      
      // Fallback
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };

  const isBuilding = step !== GenerationStep.IDLE && step !== GenerationStep.FINISHED && step !== GenerationStep.ERROR;

  // --- POST BUILD SUCCESS UI ---
  if (step === GenerationStep.FINISHED && downloadUrl) {
      return (
          <div className="fixed inset-0 z-[80] bg-[#020408] overflow-y-auto font-sans">
              <div className="min-h-screen flex flex-col items-center justify-center p-6 relative">
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] pointer-events-none"></div>
                  <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-green-500/10 rounded-full blur-[150px] pointer-events-none"></div>

                  <div className="relative z-10 w-full max-w-6xl flex flex-col lg:flex-row items-center gap-12 lg:gap-24 animate-fade-in-up my-auto">
                      {/* Left: Simulator */}
                      <div className="order-2 lg:order-1 scale-90 lg:scale-100 shrink-0">
                          <div className="relative">
                              <div className="absolute -inset-10 bg-gradient-to-tr from-green-500/20 to-emerald-500/20 rounded-full blur-3xl opacity-50 animate-pulse-slow"></div>
                              <PhonePreview config={config} isLoading={false} />
                          </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="order-1 lg:order-2 flex flex-col items-center lg:items-start text-center lg:text-left space-y-8 w-full">
                          <div className="space-y-4">
                              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-green-500/30 bg-green-500/10 text-green-400 text-[10px] font-bold tracking-[0.2em] uppercase mb-2">
                                  <CheckCircle2 size={12} />
                                  <span>Compilation Complete</span>
                              </div>
                              <h1 className="text-4xl md:text-5xl font-bold text-white">Your App is Ready.</h1>
                              <p className="text-slate-400 text-lg leading-relaxed max-w-md">
                                  We've successfully compiled your {config.platform} binary. It's signed and ready for distribution.
                              </p>
                          </div>

                          <div className="w-full max-w-md space-y-4">
                               {/* Primary Download Button with Share Support */}
                               <button 
                                    onClick={handleDownloadArtifact}
                                    className="w-full group relative overflow-hidden bg-white text-black py-4 rounded-xl font-bold text-lg hover:bg-slate-200 transition-all duration-300 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.4)] flex items-center justify-center gap-3"
                                 >
                                    <Download size={20} />
                                    <span>Download {config.platform === 'android' ? 'APK' : config.platform === 'ios' ? 'Project' : 'EXE'}</span>
                               </button>
                               
                               {/* Security Note / Safe Browsing Info */}
                               <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-3 text-left">
                                   <ShieldCheck size={18} className="text-amber-500 shrink-0 mt-0.5" />
                                   <div className="text-xs text-slate-300 leading-relaxed">
                                       <strong className="text-amber-400 block mb-1">Installation Guide</strong>
                                       Since this is a new app, your phone may ask for permission to install from "Unknown Sources". This is normal for apps outside the Play Store.
                                   </div>
                               </div>
                               
                               <div className="flex gap-4">
                                    <button 
                                        onClick={resetBuild}
                                        className="flex-1 py-3 bg-[#15171C] border border-white/10 hover:border-white/20 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
                                    >
                                        <RotateCcw size={16} />
                                        <span>Build Another</span>
                                    </button>
                               </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  if (!hasEntered) {
    if (showTokenEntry) {
        return <TokenEntryModal onComplete={handleTokenSubmit} errorMessage={tokenError} />;
    }
    return <IntroOverlay onEnter={handleEnterApp} />;
  }

  // --- SCREEN 1: PLATFORM SELECTION ---
  if (!selectedPlatform) {
      return (
        <div className="min-h-screen bg-[#020408] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
             
             {/* Cinematic Background */}
             <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60vw] h-[40vh] bg-indigo-600/10 rounded-full blur-[150px] mix-blend-screen"></div>
                <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-purple-600/5 rounded-full blur-[120px] mix-blend-screen"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
             </div>

             <div className="max-w-6xl w-full space-y-16 relative z-10">
                 <div className="text-center space-y-6">
                     <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/5 bg-white/5 text-slate-300 text-[10px] font-bold tracking-[0.2em] uppercase mb-4 backdrop-blur-md">
                        <Terminal size={10} />
                        <span>System_Ready</span>
                     </div>
                     <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-500">
                        Select Target Runtime.
                     </h1>
                     <p className="text-xl text-slate-400 font-light max-w-2xl mx-auto leading-relaxed">
                        Deploy your web core to a native environment. 
                        Choose a platform to initialize the build matrix.
                     </p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
                     {/* iOS Card */}
                     <button 
                        onClick={() => setSelectedPlatform('ios')}
                        className="group relative bg-[#0A0C10] rounded-[2rem] p-8 transition-all duration-500 border border-white/5 hover:border-white/10 text-left flex flex-col h-full hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] overflow-hidden"
                     >
                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        <div className="relative z-10">
                            <div className="w-14 h-14 bg-[#15171C] rounded-2xl flex items-center justify-center mb-8 border border-white/5 group-hover:bg-white/10 group-hover:scale-110 transition-all duration-500">
                                <Apple size={28} className="text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">iOS</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-8 min-h-[40px]">
                                Generate a Swift-based Xcode project. Ready for TestFlight and App Store submission.
                            </p>
                            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-indigo-400 opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                                <span>Initialize</span> <ArrowRight size={14} />
                            </div>
                        </div>
                     </button>

                     {/* Android Card */}
                     <button 
                        onClick={() => setSelectedPlatform('android')}
                        className="group relative bg-[#0A0C10] rounded-[2rem] p-8 transition-all duration-500 border border-white/5 hover:border-white/10 text-left flex flex-col h-full hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] overflow-hidden"
                     >
                        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                        <div className="relative z-10">
                            <div className="w-14 h-14 bg-[#15171C] rounded-2xl flex items-center justify-center mb-8 border border-white/5 group-hover:bg-white/10 group-hover:scale-110 transition-all duration-500">
                                <Smartphone size={28} className="text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">Android</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-8 min-h-[40px]">
                                Build a signed production APK instantly using Gradle in the cloud.
                            </p>
                            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-emerald-400 opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                                <span>Initialize</span> <ArrowRight size={14} />
                            </div>
                        </div>
                     </button>

                     {/* Desktop Card */}
                     <button 
                        onClick={() => setSelectedPlatform('desktop')}
                        className="group relative bg-[#0A0C10] rounded-[2rem] p-8 transition-all duration-500 border border-white/5 hover:border-white/10 text-left flex flex-col h-full hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] overflow-hidden"
                     >
                        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                        <div className="relative z-10">
                            <div className="w-14 h-14 bg-[#15171C] rounded-2xl flex items-center justify-center mb-8 border border-white/5 group-hover:bg-white/10 group-hover:scale-110 transition-all duration-500">
                                <Monitor size={28} className="text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">Windows</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-8 min-h-[40px]">
                                Package a WebView2 container into a standalone .exe executable.
                            </p>
                            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-blue-400 opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                                <span>Initialize</span> <ArrowRight size={14} />
                            </div>
                        </div>
                     </button>
                 </div>
             </div>
        </div>
      );
  }

  // --- SCREEN 2: MAIN CONFIGURATION UI ---
  return (
    <div className="min-h-screen bg-[#020408] text-slate-200 font-sans selection:bg-indigo-500/30 selection:text-white overflow-x-hidden">
      
      {/* MODALS */}
      <BuildTerminalOverlay logs={buildLogs} isVisible={isBuilding} timeLeft={timeLeft} />
      <PremiumModal 
        isOpen={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)}
        onUpgrade={() => {
             activatePremium();
        }}
      />
      <DevModeModal 
        isOpen={showDevModal}
        onClose={() => setShowDevModal(false)}
        onSuccess={handleDevSuccess}
      />
      <IconPickerModal 
        isOpen={showIconPicker} 
        onClose={() => setShowIconPicker(false)} 
        onSelect={(base64) => setConfig(prev => ({...prev, iconBase64: base64}))}
        isPremium={true} // Always allow full interaction in the modal, build is gated elsewhere
        onUpgrade={() => {
            setShowIconPicker(false);
            setShowPremiumModal(true);
        }}
      />

      {/* Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
         <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-900/10 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-900/5 rounded-full blur-[120px]"></div>
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02]"></div>
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b border-white/5 bg-[#020408]/80 backdrop-blur-xl">
          <div className="container mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
              <div className="flex items-center space-x-4 md:space-x-6">
                  <button 
                    onClick={() => setSelectedPlatform(null)} 
                    className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white group"
                    title="Back to Platform Selection"
                  >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                  </button>
                  <div 
                    className="flex items-center space-x-3 cursor-pointer select-none"
                    onClick={handleLogoClick}
                  >
                      <div className={`w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br ${devMode ? 'from-amber-500 to-yellow-600 shadow-amber-900/20' : 'from-indigo-600 to-violet-600 shadow-indigo-900/20'} rounded-lg flex items-center justify-center text-white shadow-lg transition-all duration-300`}>
                          {devMode ? <Crown size={18} fill="currentColor" /> : <Zap size={18} fill="currentColor" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-base md:text-lg tracking-tight text-white leading-none">WebToApp <span className={`${devMode ? 'text-amber-400' : 'text-indigo-400'}`}>Studio</span></span>
                        <span className={`text-[8px] md:text-[9px] font-bold uppercase tracking-widest mt-0.5 ${devMode ? 'text-amber-500 animate-pulse' : 'text-slate-500 animate-gradient bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-[length:200%_auto] bg-clip-text text-transparent'}`}>
                             {devMode ? 'Developer Mode Premium' : 'Egeluo Technologies'}
                        </span>
                      </div>
                  </div>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                  {!devMode && (
                      <button 
                        onClick={() => {
                            if(!isPremium) setShowPremiumModal(true);
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all border ${
                            isPremium 
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 cursor-default' 
                            : 'bg-white text-black border-white hover:bg-slate-200 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                        }`}
                      >
                         {isPremium ? <Crown size={12} fill="currentColor" /> : <Star size={12} />}
                         <span className="hidden md:inline">{isPremium ? 'Premium Active' : 'Upgrade to Pro'}</span>
                      </button>
                  )}
                  {devMode && (
                      <div className="px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                          <ShieldCheck size={12} />
                          <span className="hidden md:inline">System Override</span>
                      </div>
                  )}
              </div>
          </div>
      </nav>
      
      {/* Session Expired Alert */}
      {premiumExpired && (
          <div className="bg-red-500/10 border-b border-red-500/20 p-2 text-center relative z-50 animate-fade-in-down">
              <div className="flex items-center justify-center gap-2 text-red-400 text-xs font-bold uppercase tracking-widest">
                  <AlertCircle size={14} />
                  <span>Premium Session Expired</span>
              </div>
          </div>
      )}

      <main className="relative z-10 container mx-auto px-4 md:px-6 py-6 md:py-12 flex flex-col lg:flex-row gap-8 lg:gap-16 items-start justify-center">
        
        {/* Left Column: Configuration */}
        <div className="flex-1 w-full max-w-2xl space-y-6 md:space-y-8">
          
          <div className="space-y-2 md:space-y-3 px-1">
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-500">
                  {selectedPlatform === 'ios' ? 'iOS' : selectedPlatform === 'desktop' ? 'Windows' : 'Android'} Configuration
               </span>
            </h1>
            <p className="text-sm md:text-base text-slate-400 font-light leading-relaxed max-w-lg">
               Configure your application parameters.
            </p>
          </div>

          <div className="space-y-4 md:space-y-0 md:bg-[#0F1115] md:rounded-[2rem] md:shadow-2xl md:shadow-black/50 md:border md:border-white/5 md:overflow-hidden md:ring-1 md:ring-white/5 relative">
            
            {/* Glossy Header Effect (Desktop Only) */}
            <div className="hidden md:block absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

            {/* Section 1: Basic Info */}
            <ConfigSection 
                title="Application Manifest" 
                icon={Smartphone}
                isOpen={openSection === 'basic'}
                onToggle={() => setOpenSection('basic')}
                className="md:border-none md:shadow-none md:rounded-none md:ring-0 md:bg-transparent"
            >
                <div className="p-6 md:p-10 space-y-6 md:space-y-8 border-t border-white/5 md:border-none">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Target URL</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                    <LinkIcon size={16} />
                                </div>
                                <input
                                    type="url"
                                    placeholder="https://your-site.com"
                                    className="w-full bg-[#15171C] border border-white/10 text-white rounded-xl py-3.5 pl-11 pr-4 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600 font-mono text-sm shadow-inner"
                                    value={config.url}
                                    onChange={(e) => setConfig(prev => ({...prev, url: e.target.value}))}
                                    disabled={isBuilding}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Display Name</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                    <Type size={16} />
                                    </div>
                                    <input
                                    type="text"
                                    placeholder="My App"
                                    className="w-full bg-[#15171C] border border-white/10 text-white rounded-xl py-3.5 pl-11 pr-4 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600 shadow-inner text-sm"
                                    value={config.name}
                                    onChange={(e) => setConfig(prev => ({...prev, name: e.target.value}))}
                                    disabled={isBuilding}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Theme Tint</label>
                                <div className="flex items-center space-x-3 bg-[#15171C] border border-white/10 rounded-xl p-1.5 pr-4 shadow-inner">
                                    <input
                                    type="color"
                                    className="h-9 w-12 bg-transparent border-none cursor-pointer rounded-lg overflow-hidden"
                                    value={config.themeColor}
                                    onChange={(e) => setConfig(prev => ({...prev, themeColor: e.target.value}))}
                                    disabled={isBuilding}
                                    />
                                    <span className="text-xs font-mono text-slate-400 flex-1 uppercase">{config.themeColor}</span>
                                    <Palette size={16} className="text-slate-600" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">App Icon</label>
                            </div>
                            <div 
                                onClick={() => {
                                    fileInputRef.current?.click();
                                }}
                                className={`border border-dashed rounded-xl p-6 flex flex-col items-center justify-center space-y-3 transition-all duration-300 ${
                                    isPremium 
                                    ? 'border-white/20 hover:border-indigo-500 hover:bg-white/5 cursor-pointer' 
                                    : 'border-white/20 hover:border-indigo-500 hover:bg-white/5 cursor-pointer'
                                } ${isBuilding ? 'opacity-30 pointer-events-none' : ''}`}
                            >
                                {config.iconBase64 ? (
                                    <div className="flex items-center space-x-6">
                                        <img src={config.iconBase64} alt="Preview" className="w-16 h-16 rounded-xl object-cover shadow-lg shadow-black/50 ring-1 ring-white/10" />
                                        <div className="text-left">
                                            <p className="text-sm font-bold text-white">Icon Set</p>
                                            <p className="text-xs text-slate-400 mt-1">Ready for compilation</p>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); setConfig(prev => ({...prev, iconBase64: null})); }} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white">
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isPremium ? 'bg-white/5 text-slate-300 group-hover:bg-indigo-500/20 group-hover:text-indigo-300' : 'bg-[#0A0C10] text-slate-600'}`}>
                                            {isPremium ? <ImageIcon size={20} /> : <Grid size={20} />}
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm text-slate-300 font-medium">
                                                Click to Upload PNG
                                            </p>
                                            <p className="text-[10px] text-slate-500 mt-1">
                                                Recommended: 512x512px
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                            
                            <button 
                                onClick={() => setShowIconPicker(true)}
                                className="w-full py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 border border-white/5 transition-colors"
                            >
                                <Palette size={14} />
                                <span>Open Icon Studio</span>
                            </button>

                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                        </div>
                    </div>
                </div>
            </ConfigSection>

            {/* Section 2: Capabilities */}
            <div className="hidden md:block h-px bg-white/5 mx-10"></div>
            <ConfigSection 
                title="System Capabilities" 
                icon={Cpu}
                isOpen={openSection === 'perms'}
                onToggle={() => setOpenSection('perms')}
                className="md:border-none md:shadow-none md:rounded-none md:ring-0 md:bg-transparent"
            >
                <div className="p-6 md:p-10 space-y-6 md:space-y-8 border-t border-white/5 md:border-none bg-[#0F1115]">
                    <div className="flex items-center justify-between">
                         <p className="text-xs text-slate-500 md:hidden">Hardware Permissions</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { id: 'location', icon: MapPin, title: 'Geolocation', desc: 'GPS & Network Location', free: true },
                            { id: 'fileUpload', icon: FolderOpen, title: 'Files & Download', desc: 'Save/Upload Files', free: true },
                            { id: 'popups', icon: ExternalLink, title: 'Multi-Window', desc: 'Support OAuth Popups', free: false },
                            { id: 'camera', icon: Camera, title: 'Camera', desc: 'Capture Images/Video', free: false },
                            { id: 'microphone', icon: Mic, title: 'Microphone', desc: 'Audio Recording', free: false },
                            { id: 'pushNotifications', icon: Bell, title: 'Push Notifications', desc: 'Alerts & Status Updates', free: false },
                            { id: 'screenRecording', icon: Video, title: 'Screen Recording', desc: 'Screen Capture & Sharing', free: false },
                            { id: 'alarmReminders', icon: AlarmClock, title: 'Alarms & Reminders', desc: 'Schedule Events & Alerts', free: false }
                        ].map((perm: any) => (
                            <button 
                                key={perm.id}
                                onClick={() => {
                                    togglePermission(perm.id);
                                }}
                                className={`flex items-center space-x-4 p-4 rounded-xl border transition-all duration-300 group ${
                                    config.permissions[perm.id as keyof AppPermissions] 
                                        ? 'border-indigo-500/50 bg-indigo-500/5 shadow-[0_0_15px_-5px_rgba(99,102,241,0.2)]' 
                                        : 'border-white/10 bg-[#15171C] hover:bg-white/5 hover:border-white/20'
                                }`}
                                disabled={isBuilding}
                            >
                                <div className={`p-2.5 rounded-lg transition-colors ${
                                    config.permissions[perm.id as keyof AppPermissions] 
                                    ? 'bg-indigo-500 text-white shadow-sm' 
                                    : 'bg-white/5 text-slate-500 group-hover:bg-white/10'
                                }`}>
                                    <perm.icon size={18} />
                                </div>
                                <div className="text-left flex-1">
                                    <p className={`text-sm font-bold transition-colors ${
                                        config.permissions[perm.id as keyof AppPermissions] ? 'text-white' : 'text-slate-300'
                                    }`}>{perm.title}</p>
                                    <p className="text-xs text-slate-500">{perm.desc}</p>
                                </div>
                                {config.permissions[perm.id as keyof AppPermissions] && <CheckCircle2 size={16} className="text-indigo-400" />}
                            </button>
                        ))}
                    </div>
                </div>
            </ConfigSection>

            {/* Footer Action */}
            <div className="p-6 md:p-10 bg-[#0A0C10] md:border-t border-white/5 mt-4 md:mt-0 rounded-2xl md:rounded-none">
                 <button 
                    onClick={handleCloudBuild}
                    className="w-full group relative overflow-hidden bg-white text-black py-4 rounded-xl font-bold text-lg hover:bg-slate-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.4)] hover:scale-[1.01]"
                 >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent skew-x-[-20deg] translate-x-[-150%] group-hover:animate-shimmer"></div>
                    <span className="relative flex items-center justify-center gap-3">
                        <Zap size={20} fill="currentColor" />
                        <span>Initialize Cloud Compiler</span>
                    </span>
                 </button>
                 <p className="text-center text-xs text-slate-600 mt-4 font-mono">
                    Estimated Build Time: 45s • Secure GitHub Actions Runner
                 </p>
            </div>
          </div>
        </div>

        {/* Right Column: Preview */}
        <div className="w-full lg:w-auto flex flex-col items-center gap-8 sticky top-28 mb-12 lg:mb-0">
           
           {/* Phone Mockup */}
           <div className="relative">
                <div className="absolute -inset-10 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl pointer-events-none opacity-50"></div>
                <PhonePreview config={config} isLoading={isBuilding} />
           </div>
        </div>
      </main>
    </div>
  );
};

export default App;
