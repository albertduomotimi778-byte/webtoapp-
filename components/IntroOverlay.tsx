import React, { useState, useEffect } from 'react';
import { Smartphone, Zap, Shield, ArrowRight, Command, Hexagon, Terminal, Globe, Info } from 'lucide-react';

interface IntroOverlayProps {
  onEnter: () => void;
}

const slides = [
  {
    id: 1,
    icon: <Smartphone size={48} strokeWidth={1} />,
    title: "Native Immersion",
    desc: "Transform web experiences into borderless, high-performance mobile applications."
  },
  {
    id: 2,
    icon: <Zap size={48} strokeWidth={1} />,
    title: "Instant Compilation",
    desc: "Serverless architecture delivers production-ready binaries in seconds."
  },
  {
    id: 3,
    icon: <Shield size={48} strokeWidth={1} />,
    title: "Enterprise Secure",
    desc: "Sandboxed execution environments ensuring maximum security and stability."
  }
];

const IntroOverlay: React.FC<IntroOverlayProps> = ({ onEnter }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(slideInterval);
  }, []);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsLoaded(true);
          return 100;
        }
        return prev + 1.5; 
      });
    }, 40);
    return () => clearInterval(progressInterval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#050505] text-white font-sans selection:bg-indigo-500/30">
      
      {/* --- Ambient Background (Fixed) --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-900/10 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-900/10 rounded-full blur-[100px]"></div>
        
        {/* Subtle Noise Texture */}
        <div className="absolute inset-0 opacity-[0.05] bg-noise mix-blend-overlay"></div>
        
        {/* Architectural Grid */}
        <div className="absolute inset-0 opacity-[0.03]" 
             style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '50px 50px' }}>
        </div>
      </div>

      {/* --- Scrollable Content Container --- */}
      <div className="absolute inset-0 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div className="min-h-full w-full flex flex-col items-center justify-center p-6 md:p-12 relative">
            
            {/* Top Bar */}
            <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center opacity-50 z-20">
                <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase">
                    <Terminal size={14} />
                    <span>System_Init</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Online</span>
                </div>
            </div>

            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center my-auto pt-16 pb-16">
                
                {/* --- Left Column: Visual Card --- */}
                <div className="w-full relative group perspective-1000 order-2 lg:order-1">
                    <div className="relative aspect-[4/5] md:aspect-square max-h-[500px] w-full mx-auto bg-gradient-to-br from-white/5 to-transparent rounded-[2rem] border border-white/10 backdrop-blur-md overflow-hidden transition-all duration-700 hover:border-white/20">
                        
                        {/* Card Interior */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 md:p-12 text-center">
                            
                            {/* Animated Hologram Container */}
                            <div className="relative w-32 h-32 md:w-40 md:h-40 mb-10 flex items-center justify-center">
                                <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
                                {/* Icon Transition */}
                                <div key={currentSlide} className="relative z-10 transition-all duration-700 animate-fade-in-up">
                                    {slides[currentSlide].icon}
                                </div>
                                {/* Technical Rings */}
                                <div className="absolute inset-0 border border-white/10 rounded-full animate-[spin_8s_linear_infinite]"></div>
                                <div className="absolute inset-4 border border-white/5 rounded-full animate-[spin_12s_linear_infinite_reverse] border-dashed"></div>
                            </div>

                            <div className="space-y-4 relative z-10 max-w-sm mx-auto">
                                <h2 key={`t-${currentSlide}`} className="text-2xl md:text-3xl font-light tracking-wide text-white animate-fade-in">
                                    {slides[currentSlide].title}
                                </h2>
                                <p key={`d-${currentSlide}`} className="text-sm md:text-base text-gray-400 leading-relaxed animate-fade-in delay-75">
                                    {slides[currentSlide].desc}
                                </p>
                            </div>

                            {/* Pagination Dots */}
                            <div className="absolute bottom-8 left-0 w-full flex justify-center space-x-3">
                                {slides.map((_, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => setCurrentSlide(idx)}
                                        className={`h-1 transition-all duration-500 rounded-full ${idx === currentSlide ? 'w-8 bg-indigo-500' : 'w-2 bg-white/20 hover:bg-white/40'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    {/* ABOUT EGELUO TECHNOLOGIES (Small Footnote under card) */}
                    <div className="mt-8 p-6 rounded-2xl bg-white/5 border border-white/10 text-left space-y-2 backdrop-blur-sm animate-fade-in opacity-80 hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest">
                            <Info size={14} />
                            <span>Powered By Egeluo Technologies</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Egeluo Technologies is a premier software engineering firm dedicated to bridging the gap between web and native ecosystems. We specialize in high-performance cloud compilers and next-gen development tools.
                        </p>
                    </div>
                </div>

                {/* --- Right Column: Text & Interaction --- */}
                <div className="space-y-10 text-center lg:text-left order-1 lg:order-2">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-900/10 text-indigo-300 text-[10px] font-bold tracking-[0.2em] uppercase mb-2">
                            <Globe size={10} />
                            <span>Global Edge Network</span>
                        </div>
                        
                        {/* 3D ROTATING TEXT LOGO */}
                        <div className="h-24 md:h-32 perspective-container relative flex items-center justify-center lg:justify-start">
                             <style>{`
                                .perspective-container { perspective: 1000px; }
                                .text-3d-hologram {
                                    transform-style: preserve-3d;
                                    animation: float-rotate-text 6s ease-in-out infinite;
                                }
                                @keyframes float-rotate-text {
                                    0% { transform: rotateY(-10deg) rotateX(5deg); }
                                    50% { transform: rotateY(10deg) rotateX(-5deg); }
                                    100% { transform: rotateY(-10deg) rotateX(5deg); }
                                }
                             `}</style>
                             <div className="text-3d-hologram">
                                 <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-slate-400 drop-shadow-2xl">
                                     WebToApp
                                 </h1>
                                 <div className="text-4xl md:text-5xl font-light text-indigo-500 tracking-widest opacity-80 mt-[-10px] transform translate-z-10">
                                     STUDIO
                                 </div>
                             </div>
                        </div>

                        <p className="text-gray-400 text-lg md:text-xl font-light leading-relaxed max-w-lg mx-auto lg:mx-0 pt-4">
                            The definitive platform for compiling high-performance, immersive native applications directly from the cloud.
                        </p>
                    </div>

                    <div className="pt-2 flex flex-col items-center lg:items-start">
                        {!isLoaded ? (
                            <div className="w-full max-w-md space-y-4">
                                <div className="flex justify-between text-xs font-mono text-gray-500">
                                    <span>SYSTEM_BOOT</span>
                                    <span>{Math.round(progress)}%</span>
                                </div>
                                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                     <div 
                                        className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-75 ease-out relative"
                                        style={{ width: `${progress}%` }}
                                     ></div>
                                </div>
                                <p className="text-center lg:text-left text-xs text-gray-600 animate-pulse">
                                    Loading modules...
                                </p>
                            </div>
                        ) : (
                            <button 
                                onClick={onEnter}
                                className="group relative overflow-hidden rounded-full bg-white text-black pl-8 pr-2 py-2 font-bold text-lg tracking-wide transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)] flex items-center gap-4"
                            >
                                <span>ENTER STUDIO</span>
                                <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white group-hover:rotate-45 transition-transform duration-300">
                                    <ArrowRight size={20} />
                                </div>
                            </button>
                        )}
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-8 gap-y-4 text-gray-600 text-[10px] font-bold tracking-widest uppercase pt-8">
                        <div className="flex items-center gap-2">
                            <Hexagon size={12} /> 
                            <span>V2.4.0 STABLE</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Command size={12} /> 
                            <span>IMMERSIVE MODE</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};

export default IntroOverlay;