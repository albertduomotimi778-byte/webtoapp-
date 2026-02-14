import React, { useState, useEffect } from 'react';
import { Fingerprint, Cpu, Code2 } from 'lucide-react';

interface DevModeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const DevModeModal: React.FC<DevModeModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [password, setPassword] = useState('');
    const [step, setStep] = useState<'LOGIN' | 'WELCOME'>('LOGIN');
    const [error, setError] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setStep('LOGIN');
            setPassword('');
            setError(false);
        }
    }, [isOpen]);

    const handleSubmit = () => {
        if (password === '17022005@787') {
            setStep('WELCOME');
            setTimeout(() => {
                onSuccess();
            }, 6000); 
        } else {
            setError(true);
            setTimeout(() => setError(false), 800);
        }
    };

    if (!isOpen) return null;

    if (step === 'WELCOME') {
        return (
            <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden font-sans">
                {/* Cinematic Background */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-amber-600/10 rounded-full blur-[150px] animate-pulse-slow"></div>
                
                <div className="relative z-10 w-full max-w-4xl px-8 flex flex-col items-center text-center space-y-12 animate-fade-in-up">
                    
                    {/* Animated Access Granted Badge */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full animate-ping-slow"></div>
                        <div className="relative px-6 py-2 rounded-full border border-green-500/30 bg-green-500/10 text-green-400 font-mono tracking-[0.3em] text-sm uppercase shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                            Access Granted
                        </div>
                    </div>

                    {/* Grand Welcome Text */}
                    <div className="space-y-6">
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white drop-shadow-2xl">
                            Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-500">Albert Samuel</span>
                        </h1>
                        
                        <div className="h-px w-32 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mx-auto"></div>

                        <div className="space-y-2">
                             <p className="text-xl md:text-2xl text-slate-300 font-light tracking-wide">
                                CEO of <span className="font-semibold text-white">Egeluo Technologies</span>
                             </p>
                             <p className="text-sm md:text-base text-amber-500/60 font-mono tracking-[0.2em] uppercase">
                                Root Administrator • System Creator
                             </p>
                        </div>
                    </div>

                    {/* Loading/Initializing Indicators */}
                    <div className="w-full max-w-md space-y-2 pt-12">
                         <div className="flex justify-between text-[10px] text-slate-600 font-mono uppercase">
                             <span>Unlocking Premium Modules</span>
                             <span>100%</span>
                         </div>
                         <div className="h-0.5 w-full bg-slate-800 rounded-full overflow-hidden">
                             <div className="h-full bg-amber-500 animate-[width_2s_ease-out_forwards]" style={{width: '100%'}}></div>
                         </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-[#050505]/95 backdrop-blur-2xl flex items-center justify-center p-4">
            
            <div className="w-full max-w-md bg-[#0A0C10] border border-white/5 rounded-2xl p-8 md:p-12 relative overflow-hidden group shadow-[0_0_50px_rgba(0,0,0,0.8)] perspective-1000">
                
                {/* 3D Text Container */}
                <div className="h-20 mb-10 flex items-center justify-center relative perspective-container">
                    <style>{`
                        .perspective-container { perspective: 500px; }
                        .text-3d-wrapper {
                            transform-style: preserve-3d;
                            animation: rotate-text 8s infinite linear;
                        }
                        .text-3d-wrapper span {
                            display: block;
                            font-weight: 900;
                            font-size: 2rem;
                            letter-spacing: 0.2em;
                            color: white;
                            text-shadow: 0 0 10px rgba(6,182,212,0.5);
                        }
                        @keyframes rotate-text {
                            0% { transform: rotateY(-20deg); }
                            50% { transform: rotateY(20deg); }
                            100% { transform: rotateY(-20deg); }
                        }
                    `}</style>
                    <div className="text-3d-wrapper text-center">
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500">DEVELOPER</span>
                    </div>
                </div>

                {/* Input Area */}
                <div className="space-y-8 relative z-10">
                    <div className="relative group">
                        <div className={`absolute -inset-0.5 rounded-lg blur opacity-30 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 ${error ? 'bg-red-600' : 'bg-gradient-to-r from-cyan-600 to-blue-600'}`}></div>
                        <input 
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                            className="relative w-full bg-black border border-white/10 rounded-lg py-4 px-4 text-center text-lg font-mono tracking-[0.5em] text-white placeholder:text-slate-800 focus:outline-none focus:ring-0 transition-all"
                            placeholder="••••••••"
                            autoFocus
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={onClose}
                            className="py-3 rounded-lg border border-white/10 text-slate-500 text-xs font-bold hover:bg-white/5 hover:text-white transition-colors"
                        >
                            CANCEL
                        </button>
                        <button 
                            onClick={handleSubmit}
                            className="py-3 rounded-lg bg-cyan-900/20 border border-cyan-500/30 text-cyan-400 text-xs font-bold hover:bg-cyan-500 hover:text-white transition-all shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                        >
                            AUTHENTICATE
                        </button>
                    </div>

                    <div className="text-center">
                        <p className="text-[10px] text-slate-600 font-mono">
                            Egeluo Technologies • Secure Terminal
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DevModeModal;