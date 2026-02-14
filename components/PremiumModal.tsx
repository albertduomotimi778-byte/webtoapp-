import React, { useEffect, useState, useRef } from 'react';
import { 
  X, 
  Check, 
  Crown, 
  Zap, 
  CreditCard, 
  Image, 
  Shield, 
  Smartphone,
  Sparkles,
  Lock,
  Loader2,
  ExternalLink,
  CheckCircle2,
  Server,
  ArrowRight,
  AlertCircle,
  Globe
} from 'lucide-react';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

type CheckoutStep = 'OFFER' | 'PROCESSING' | 'PAYMENT' | 'SUCCESS' | 'FINAL';

const FeatureRow = ({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) => (
  <div className="flex items-start space-x-4 p-4 rounded-xl hover:bg-white/5 transition-colors group">
    <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg border border-indigo-500/30 text-indigo-400 group-hover:text-indigo-300 group-hover:border-indigo-400/50 transition-all">
      <Icon size={20} />
    </div>
    <div>
      <h4 className="text-slate-200 font-semibold text-sm tracking-wide">{title}</h4>
      <p className="text-slate-400 text-xs mt-1 leading-relaxed">{desc}</p>
    </div>
  </div>
);

const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose, onUpgrade }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('OFFER');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [successProgress, setSuccessProgress] = useState(0);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const popupRef = useRef<Window | null>(null);
  
  // Payment Config
  const PAYMENT_URL = "https://selar.com/71711537jt";

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      document.body.style.overflow = 'unset';
      // Reset after animation
      setTimeout(() => {
          setCheckoutStep('OFFER');
          setLoadingProgress(0);
          setSuccessProgress(0);
          setPopupBlocked(false);
          if (popupRef.current) popupRef.current.close();
      }, 500);
    }
  }, [isOpen]);

  // Handle Processing Timer (10 seconds)
  useEffect(() => {
      let interval: any;
      if (checkoutStep === 'PROCESSING') {
          setLoadingProgress(0);
          const totalTime = 4000; // Faster processing visual (4s)
          const tick = 100;
          const steps = totalTime / tick;
          let currentStep = 0;

          interval = setInterval(() => {
              currentStep++;
              const progress = Math.min((currentStep / steps) * 100, 100);
              setLoadingProgress(progress);

              if (currentStep >= steps) {
                  clearInterval(interval);
                  setCheckoutStep('PAYMENT');
              }
          }, tick);
      }
      return () => clearInterval(interval);
  }, [checkoutStep]);

  // Helper to open centered popup
  const openPaymentPopup = () => {
      const width = 500;
      const height = 800;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no,location=no`;
      
      try {
         const newWindow = window.open(PAYMENT_URL, 'SelarPayment', features);
         if (newWindow && !newWindow.closed && typeof newWindow.closed !== 'undefined') {
             popupRef.current = newWindow;
             newWindow.focus();
             setPopupBlocked(false);
             return true;
         } else {
             setPopupBlocked(true);
             return false;
         }
      } catch (e) {
         setPopupBlocked(true);
         return false;
      }
  };

  // Handle Payment Window Open & Polling
  useEffect(() => {
      let pollInterval: any;
      
      const handleSuccessTrigger = () => {
          if (checkoutStep === 'PAYMENT' || checkoutStep === 'PROCESSING') {
             if (popupRef.current) popupRef.current.close();
             setCheckoutStep('SUCCESS');
          }
      };
      
      // Native App Event Listener (Fallback)
      const onNativePremium = () => handleSuccessTrigger();
      window.addEventListener('native-premium-active', onNativePremium);
      
      if (checkoutStep === 'PAYMENT') {
          // Attempt to open popup automatically
          openPaymentPopup();

          // Poll for success
          pollInterval = setInterval(() => {
              // 1. Check Native Flag (in case logic runs inside the main window context)
              if ((window as any).isNativeAppPremium === true) {
                  handleSuccessTrigger();
                  return;
              }

              // 2. Check Popup URL
              try {
                  if (popupRef.current && !popupRef.current.closed) {
                      // Attempt to read the URL. 
                      // If the user is on "selar.com", this throws a SecurityError (Cross-Origin).
                      // If the user is redirected back to "our-website.com" (Same Origin), this SUCCEEDS.
                      const popupUrl = popupRef.current.location.href;
                      const appOrigin = window.location.origin;

                      // Check if we are back on the app's domain OR have a success flag
                      if (popupUrl.includes(appOrigin) || popupUrl.includes('congratulations') || popupUrl.includes('success')) {
                          window.dispatchEvent(new Event('native-premium-active'));
                          handleSuccessTrigger();
                      }
                  }
              } catch (e) {
                  // SecurityError is EXPECTED while the user is still on the payment gateway.
                  // We ignore it and keep polling until they are redirected back.
              }
          }, 1000);
      }
      return () => {
          clearInterval(pollInterval);
          window.removeEventListener('native-premium-active', onNativePremium);
      };
  }, [checkoutStep]);

  // Handle Success Timer (8 seconds)
  useEffect(() => {
      let interval: any;
      if (checkoutStep === 'SUCCESS') {
          const totalTime = 4000; // Faster success visual
          const tick = 100;
          const steps = totalTime / tick;
          let currentStep = 0;

          interval = setInterval(() => {
              currentStep++;
              const progress = Math.min((currentStep / steps) * 100, 100);
              setSuccessProgress(progress);

              if (currentStep >= steps) {
                  clearInterval(interval);
                  completePurchase();
              }
          }, tick);
      }
      return () => clearInterval(interval);
  }, [checkoutStep]);

  const completePurchase = () => {
      // Trigger internal expiry logic - 30 DAYS
      const now = new Date();
      const expiryDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
      
      localStorage.setItem('premium_expiry', expiryDate.toISOString());
      localStorage.setItem('is_premium_user', 'true');
      
      onUpgrade();
      // Do not close instantly. Show final thank you screen.
      setCheckoutStep('FINAL');
  };

  const handleStartProcess = () => {
    setCheckoutStep('PROCESSING');
  };

  const handleManualOpen = () => {
      openPaymentPopup();
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <style>{`
        .premium-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .premium-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .premium-scroll::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .premium-scroll::-webkit-scrollbar-thumb:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
        
        @keyframes float-rotate {
            0% { transform: translateY(0px) rotateY(0deg) rotateX(5deg); }
            50% { transform: translateY(-15px) rotateY(180deg) rotateX(-5deg); }
            100% { transform: translateY(0px) rotateY(360deg) rotateX(5deg); }
        }
        
        .card-3d-container {
            perspective: 1200px;
        }
        .card-3d {
            transform-style: preserve-3d;
            animation: float-rotate 8s infinite linear;
        }
        .card-face {
            backface-visibility: visible; 
        }
        .card-shine {
            background: linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.4) 25%, transparent 30%);
            animation: shine 3s infinite linear;
            background-size: 200% 100%;
        }
        @keyframes shine {
            0% { background-position: 100% 0; }
            100% { background-position: -100% 0; }
        }
      `}</style>
      
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#050505]/90 backdrop-blur-xl transition-opacity duration-500"
        onClick={checkoutStep === 'OFFER' ? onClose : undefined}
      ></div>

      {/* Main Modal Card */}
      <div className={`relative w-full max-w-4xl max-h-[90vh] bg-[#0F1115] rounded-[2rem] shadow-2xl overflow-hidden border border-white/5 flex flex-col transition-all duration-500 transform ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}>
        
        {/* Close Button */}
        {checkoutStep === 'OFFER' && (
            <button 
                onClick={onClose}
                className="absolute top-6 right-6 z-50 p-2 text-slate-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all backdrop-blur-sm"
            >
                <X size={20} />
            </button>
        )}

        {/* --- STEP 1: OFFER UI --- */}
        {checkoutStep === 'OFFER' && (
            <div className="premium-scroll flex-1 overflow-y-auto overflow-x-hidden flex flex-col md:flex-row relative z-10">
                {/* Decorative Gradients */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>

                {/* LEFT COLUMN: The Pitch */}
                <div className="flex-1 p-8 md:p-12 flex flex-col justify-between min-h-min">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px] font-bold tracking-[0.2em] uppercase mb-6 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                            <Crown size={12} fill="currentColor" />
                            <span>Pro Edition</span>
                        </div>
                        
                        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-[1.1] mb-4">
                            Unlock the full <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-amber-200">
                                Power of Native.
                            </span>
                        </h2>
                        
                        <p className="text-slate-400 text-lg leading-relaxed max-w-md">
                            Remove all restrictions. Build commercial-grade applications with advanced hardware access and monetization tools.
                        </p>
                    </div>

                    <div className="mt-8 space-y-4">
                        <div className="flex items-center gap-4 text-sm text-slate-300">
                            <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center border border-white/5">
                                <Lock size={20} className="text-slate-500" />
                            </div>
                            <div className="flex-1 h-px bg-gradient-to-r from-slate-800 to-transparent"></div>
                            <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/40 text-white">
                                <Sparkles size={20} fill="currentColor" />
                            </div>
                        </div>
                        <div className="flex justify-between text-xs font-mono uppercase tracking-widest text-slate-500">
                            <span>Current Plan</span>
                            <span className="text-indigo-400">Pro Plan</span>
                        </div>
                    </div>
                    
                    <div className="mt-10 pt-8 border-t border-white/5">
                        {/* Browser Limitation Disclaimer */}
                        <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-3">
                             <Globe size={16} className="text-amber-500 shrink-0 mt-0.5" />
                             <p className="text-[11px] text-amber-200/80 leading-relaxed">
                                 <strong className="text-amber-400">Important:</strong> Subscription is tied to this specific browser. 
                                 If you use Chrome now, your premium status will only be active on Chrome. 
                                 Switching browsers (e.g. to Brave) will require a separate login or purchase.
                             </p>
                        </div>

                        <div className="flex items-end gap-3 mb-6">
                            <span className="text-4xl font-bold text-white">$29</span>
                            <span className="text-slate-500 mb-1.5 line-through decoration-slate-600">$99</span>
                            <span className="text-sm font-medium text-green-400 mb-1.5 bg-green-400/10 px-2 py-0.5 rounded">
                                Limited Time
                            </span>
                        </div>

                        <button 
                            onClick={handleStartProcess}
                            className="group relative w-full py-4 bg-white text-black rounded-xl font-bold text-lg overflow-hidden transition-all hover:scale-[1.02] hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] active:scale-95"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent skew-x-[-20deg] translate-x-[-150%] group-hover:animate-shimmer"></div>
                            <span className="relative flex items-center justify-center gap-3">
                                <span>Get Instant Access</span>
                                <Zap size={20} fill="currentColor" className="text-amber-500" />
                            </span>
                        </button>
                        <p className="text-center text-[10px] text-slate-600 mt-4">
                            Monthly subscription. Cancel anytime.
                        </p>
                    </div>
                </div>

                {/* RIGHT COLUMN: The Features */}
                <div className="w-full md:w-[420px] bg-black/20 backdrop-blur-sm border-t md:border-t-0 md:border-l border-white/5 p-8 relative">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">
                        Included in Pro
                    </h3>

                    <div className="space-y-2">
                        <FeatureRow 
                            icon={Image} 
                            title="Custom App Icons" 
                            desc="Replace the default lock icon with your own brand identity. Upload high-res PNGs." 
                        />
                        <FeatureRow 
                            icon={CreditCard} 
                            title="Monetization Tools" 
                            desc="Integrate In-App Purchases, Subscriptions, and Paywalls directly into your build." 
                        />
                        <FeatureRow 
                            icon={Shield} 
                            title="Remove Branding" 
                            desc="Remove the 'Built with WebToApp' watermark from your application splash screen." 
                        />
                        <FeatureRow 
                            icon={Smartphone} 
                            title="Hardware Access" 
                            desc="Unlock full access to Camera, Microphone, File System, and Pop-up windows." 
                        />
                    </div>

                    {/* Satisfaction Badge */}
                    <div className="mt-8 p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-white/5 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center shrink-0">
                            <Check size={20} strokeWidth={3} />
                        </div>
                        <div>
                            <p className="text-xs text-white font-bold">100% Build Guarantee</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                                If your build fails, our engineers will fix it manually for you.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- STEP 2: PROCESSING (ANIMATION) --- */}
        {checkoutStep === 'PROCESSING' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden bg-gradient-to-b from-[#0F1115] to-[#050505]">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
                
                {/* 3D Card Container */}
                <div className="card-3d-container w-full max-w-[320px] h-[200px] mb-12 relative z-10">
                    <div className="card-3d w-full h-full relative shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)]">
                         {/* Front Face */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-900 via-[#1a1c24] to-slate-900 border border-white/10 overflow-hidden backface-hidden">
                             <div className="card-shine absolute inset-0 opacity-30 z-20"></div>
                             <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-amber-500/5 z-0"></div>
                             
                             {/* Chip */}
                             <div className="absolute top-6 left-6 w-12 h-9 rounded-md bg-gradient-to-br from-[#ffd700] via-[#bf953f] to-[#aa771c] shadow-inner border border-[#aa771c] z-30 flex items-center justify-center">
                                 <div className="w-8 h-px bg-black/20 rounded-full mb-1"></div>
                                 <div className="w-8 h-px bg-black/20 rounded-full"></div>
                             </div>

                             {/* Contactless */}
                             <div className="absolute top-6 right-6 z-30 opacity-50">
                                <Zap size={24} className="text-white rotate-90" />
                             </div>
                             
                             {/* Numbers */}
                             <div className="absolute bottom-16 left-6 right-6 flex justify-between z-30">
                                 <div className="h-4 w-full bg-white/5 rounded animate-pulse"></div>
                             </div>

                             <div className="absolute bottom-6 left-6 text-white/50 font-mono text-xs z-30">
                                 MEMBERSHIP ACCESS
                             </div>
                             
                             {/* Logo */}
                             <div className="absolute bottom-6 right-6 z-30">
                                 <div className="flex -space-x-3">
                                     <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm"></div>
                                     <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm"></div>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-md mx-auto space-y-8 relative z-10">
                    <div className="space-y-4">
                        <div className="inline-block p-3 rounded-full bg-amber-500/10 text-amber-500 mb-2 border border-amber-500/20">
                           <CreditCard size={24} />
                        </div>
                        <h3 className="text-2xl font-bold text-white">Initiating Secure Gateway</h3>
                        <p className="text-slate-400 text-sm leading-relaxed border-l-2 border-indigo-500 pl-4 text-left bg-white/5 p-4 rounded-r-lg">
                            <strong className="text-white block mb-1">Instruction:</strong>
                            Please use your <span className="text-indigo-400 font-bold">ATM Card</span> for payments in Selar to ensure quick and instant access to the Pro dashboard.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-mono text-slate-500 uppercase tracking-widest">
                            <span>Establishing Connection</span>
                            <span>{Math.round(loadingProgress)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <div 
                                className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-100 ease-linear"
                                style={{ width: `${loadingProgress}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-slate-600 animate-pulse">
                            {loadingProgress < 40 ? 'Verifying Device ID...' : loadingProgress < 80 ? 'Generating Session Key...' : 'Redirecting to Merchant...'}
                        </p>
                    </div>
                </div>
            </div>
        )}

        {/* --- STEP 3: CONFIRMATION LOADING (BACKGROUND) & POPUP TRIGGER --- */}
        {checkoutStep === 'PAYMENT' && (
             <div className="flex-1 flex flex-col relative bg-[#0F1115] items-center justify-center p-8 text-center">
                 
                 {/* Background Animation - Waiting/Loading Confirmation */}
                 <div className="absolute inset-0 overflow-hidden pointer-events-none">
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[100px] animate-pulse-slow"></div>
                 </div>

                 <div className="relative z-10 max-w-md w-full animate-fade-in-up space-y-8">
                     
                     <div className="relative w-24 h-24 mx-auto mb-6">
                         <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping"></div>
                         <div className="relative bg-[#15171C] rounded-full w-full h-full border border-indigo-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                             <Server size={32} className="text-indigo-400" />
                         </div>
                     </div>

                     <div className="space-y-3">
                         <h3 className="text-2xl font-bold text-white">Payment Window Active</h3>
                         <p className="text-slate-400 text-sm leading-relaxed">
                            A secure payment window has been opened. Please complete your transaction there.
                         </p>
                     </div>

                     <div className="bg-[#15171C] rounded-xl p-6 border border-white/5 text-left space-y-4 shadow-xl">
                         <div className="flex items-center gap-3 mb-2">
                             <Loader2 size={16} className="text-indigo-500 animate-spin" />
                             <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Transaction Status</span>
                         </div>
                         <div className="space-y-3">
                             <div className="flex items-center gap-3 text-xs text-slate-500">
                                 <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                 <span>Session Initialized</span>
                             </div>
                             <div className="flex items-center gap-3 text-xs text-slate-500">
                                 <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                 <span>Gateway Connected</span>
                             </div>
                             <div className="flex items-center gap-3 text-xs text-white animate-pulse">
                                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                 <span>Awaiting Confirmation...</span>
                             </div>
                         </div>
                     </div>

                     {/* Manual Controls - Prominent if blocked */}
                     <div className="flex flex-col gap-3 pt-4">
                        {popupBlocked && (
                            <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-xs mb-2 text-left">
                                <AlertCircle size={16} className="shrink-0" />
                                <span>Popup blocked by browser. Click button below.</span>
                            </div>
                        )}
                        <button 
                            onClick={handleManualOpen}
                            className={`w-full py-3 text-white rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                                popupBlocked 
                                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/20 animate-pulse' 
                                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20'
                            }`}
                        >
                            <span>Open Payment Window</span>
                            <ExternalLink size={16} />
                        </button>
                        <button 
                            onClick={onClose}
                            className="text-xs text-slate-500 hover:text-slate-300 py-2"
                        >
                            Cancel Transaction
                        </button>
                     </div>

                 </div>
             </div>
        )}

        {/* --- STEP 4: SUCCESS UI --- */}
        {checkoutStep === 'SUCCESS' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden bg-gradient-to-b from-[#0F1115] to-[#050505]">
                {/* Confetti / Shine Effects */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/10 rounded-full blur-[100px]"></div>
                </div>

                <div className="relative z-10 max-w-md w-full animate-fade-in-up">
                    <div className="w-20 h-20 mx-auto bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(34,197,94,0.4)] mb-8">
                        <CheckCircle2 size={40} className="text-black" strokeWidth={3} />
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-2">Payment Successful</h2>
                    <p className="text-slate-400 text-sm mb-8">Thanks for patronizing us.</p>

                    <div className="bg-[#15171C] rounded-xl p-6 border border-white/5 space-y-4">
                        <div className="flex items-center justify-between text-xs text-slate-500 uppercase tracking-widest">
                            <span>Activating License</span>
                            <span>{Math.round(successProgress)}%</span>
                        </div>
                        
                        <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden border border-white/5">
                            <div 
                                className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] transition-all duration-100 ease-linear"
                                style={{ width: `${successProgress}%` }}
                            ></div>
                        </div>

                        <p className="text-xs text-slate-600 font-mono">
                            Updating local configuration...
                        </p>
                    </div>
                </div>
            </div>
        )}

        {/* --- STEP 5: FINAL THANK YOU UI --- */}
        {checkoutStep === 'FINAL' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden bg-[#0F1115]">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05]"></div>
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-amber-500/10 rounded-full blur-[80px]"></div>
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px]"></div>

                <div className="relative z-10 w-full max-w-sm bg-[#15171C] border border-white/5 rounded-2xl p-8 shadow-2xl animate-fade-in-up">
                     {/* Premium Header Icon */}
                     <div className="w-16 h-16 mx-auto bg-gradient-to-br from-amber-300 to-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30 mb-6 p-1">
                         <div className="w-full h-full bg-[#15171C] rounded-full flex items-center justify-center border border-amber-500/50">
                             <Crown size={28} className="text-amber-500" fill="currentColor" />
                         </div>
                     </div>

                     <h2 className="text-2xl font-bold text-white mb-2">Welcome to Pro</h2>
                     <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                         Thank you for your subscription. Your account has been successfully upgraded to the premium tier.
                     </p>

                     {/* Receipt / Details Card */}
                     <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-4 mb-8">
                         <div className="flex items-center justify-between text-xs">
                             <span className="text-slate-500 uppercase tracking-wider font-bold">Plan</span>
                             <span className="text-white font-medium">Monthly Access</span>
                         </div>
                         <div className="h-px bg-white/5"></div>
                         <div className="flex items-center justify-between text-xs">
                             <span className="text-slate-500 uppercase tracking-wider font-bold">Status</span>
                             <span className="text-green-400 font-bold flex items-center gap-1">
                                 <CheckCircle2 size={12} /> Active
                             </span>
                         </div>
                         <div className="h-px bg-white/5"></div>
                         <div className="flex items-center justify-between text-xs">
                             <span className="text-slate-500 uppercase tracking-wider font-bold">Expires</span>
                             <span className="text-amber-400 font-mono">
                                 {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, {
                                     year: 'numeric',
                                     month: 'short',
                                     day: 'numeric'
                                 })}
                             </span>
                         </div>
                     </div>

                     <button 
                         onClick={onClose}
                         className="w-full py-3.5 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                     >
                         <span>Start Building</span>
                         <ArrowRight size={16} />
                     </button>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default PremiumModal;