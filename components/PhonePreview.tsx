import React from 'react';
import { AppConfig } from '../types';
import { Loader2 } from 'lucide-react';

interface PhonePreviewProps {
  config: AppConfig;
  isLoading: boolean;
}

const PhonePreview: React.FC<PhonePreviewProps> = ({ config, isLoading }) => {
  const isDesktop = config.platform === 'desktop';
  const isIOS = config.platform === 'ios';

  // Helper to render the screen content (Iframe or Placeholder)
  const renderScreenContent = () => {
    if (isLoading) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white space-y-4">
           <Loader2 size={32} className="animate-spin text-indigo-500" />
           <p className="text-xs font-mono uppercase tracking-widest text-indigo-400">Building...</p>
        </div>
      );
    }

    if (config.url && config.url.startsWith('http')) {
       return (
         <div className="w-full h-full relative bg-white">
            <iframe 
              src={config.url} 
              title="App Preview"
              className="w-full h-full border-none"
              sandbox="allow-scripts allow-same-origin allow-forms"
              loading="lazy"
            />
         </div>
       );
    }

    // Default Placeholder if no URL entered yet
    return (
        <div className="relative w-full h-full bg-slate-50 overflow-hidden flex flex-col">
            {/* Fake Browser Bar/App Header */}
            <div className={`w-full h-16 shadow-sm z-20 relative flex items-end pb-3 px-4 justify-center ${isIOS ? 'pt-6' : ''}`} style={{ backgroundColor: config.themeColor }}>
                <span className="text-white font-semibold text-sm truncate">{config.name || 'App Name'}</span>
            </div>

            {/* Web Content Mock Skeleton */}
            <div className="p-4 space-y-4 flex-1 overflow-hidden">
                <div className="w-full h-32 bg-slate-200 rounded-lg animate-pulse flex items-center justify-center text-slate-400">
                    <span className="text-xs">Enter URL to Preview</span>
                </div>
                <div className="space-y-2">
                    <div className="w-3/4 h-4 bg-slate-200 rounded animate-pulse"></div>
                    <div className="w-full h-4 bg-slate-200 rounded animate-pulse"></div>
                    <div className="w-5/6 h-4 bg-slate-200 rounded animate-pulse"></div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-4">
                    <div className="h-20 bg-slate-100 rounded-lg border border-slate-200"></div>
                    <div className="h-20 bg-slate-100 rounded-lg border border-slate-200"></div>
                </div>
            </div>

            {/* Wallpaper Overlay for Home Screen Look when no URL */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-sm z-30 flex flex-col items-center justify-center space-y-4 pointer-events-none">
                <div className={`w-20 h-20 rounded-[1.2rem] shadow-xl flex items-center justify-center overflow-hidden bg-white`}>
                    {config.iconBase64 ? (
                        <img src={config.iconBase64} alt="App Icon" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-4xl text-gray-300 font-bold">{config.name ? config.name.charAt(0).toUpperCase() : 'A'}</span>
                    )}
                </div>
                <span className="text-gray-800 font-medium text-sm tracking-tight">{config.name || 'App Name'}</span>
            </div>
      </div>
    );
  };

  if (isDesktop) {
      return (
        <div className="flex justify-center w-full overflow-hidden">
            {/* Scale down on small screens */}
            <div className="relative transform origin-top scale-[0.45] sm:scale-75 md:scale-100 transition-transform duration-300">
                <div className="relative mx-auto bg-gray-800 rounded-lg p-2 shadow-2xl w-[640px] h-[400px] mt-2 md:mt-12 border-b-[16px] border-gray-900">
                    {/* Monitor Stand */}
                    <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-32 h-16 bg-gray-900 rounded-b-lg"></div>
                    <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-48 h-2 bg-gray-800 rounded shadow-md mt-[60px]"></div>

                    <div className="bg-white w-full h-full rounded overflow-hidden flex flex-col relative">
                        {/* Window Title Bar */}
                        <div className="h-8 bg-gray-100 border-b border-gray-200 flex items-center px-3 space-x-2 shrink-0">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                            <div className="flex-1 text-center text-xs text-gray-500 font-medium">{config.name || 'Application'}</div>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 relative bg-white overflow-hidden">
                            {renderScreenContent()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className={`relative mx-auto border-gray-900 bg-black shadow-2xl flex flex-col overflow-hidden ring-1 ring-gray-900/50 transition-all duration-300 ${isIOS ? 'rounded-[3rem] h-[600px] w-[300px] border-[12px]' : 'rounded-[2.5rem] h-[600px] w-[300px] border-[14px]'}`}>
      
      {/* Hardware Buttons */}
      {!isIOS ? (
          <>
            <div className="h-[32px] w-[3px] bg-gray-800 absolute -left-[17px] top-[72px] rounded-l-lg"></div>
            <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg"></div>
            <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[178px] rounded-l-lg"></div>
            <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg"></div>
          </>
      ) : (
          <>
            <div className="h-[24px] w-[3px] bg-gray-800 absolute -left-[15px] top-[80px] rounded-l-lg"></div>
            <div className="h-[40px] w-[3px] bg-gray-800 absolute -left-[15px] top-[130px] rounded-l-lg"></div>
            <div className="h-[40px] w-[3px] bg-gray-800 absolute -left-[15px] top-[180px] rounded-l-lg"></div>
            <div className="h-[50px] w-[3px] bg-gray-800 absolute -right-[15px] top-[140px] rounded-r-lg"></div>
          </>
      )}
      
      {/* Screen Content */}
      <div className="relative w-full h-full bg-white transition-colors duration-500 overflow-hidden flex flex-col">
        
        {/* Notch / Dynamic Island */}
        {isIOS && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-7 bg-black rounded-full z-50 pointer-events-none"></div>
        )}

        {/* The Actual Simulator Content */}
        <div className="flex-1 w-full h-full relative">
            {renderScreenContent()}
        </div>

        {/* Status Bar Overlay (Time/Battery) - Only visible if we don't have a full URL loading or to simulate OS overlay */}
        <div className="absolute top-0 w-full h-8 flex justify-between items-center px-6 text-black/50 text-[10px] font-medium z-40 pointer-events-none mix-blend-difference filter invert">
          <span className="text-white">9:41</span>
          <div className="flex space-x-1">
             <div className="w-4 h-2.5 bg-white rounded-[2px]"></div>
          </div>
        </div>

        {/* iOS Home Bar */}
        {isIOS && (
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-black/20 rounded-full z-50 pointer-events-none"></div>
        )}

      </div>
    </div>
  );
};

export default PhonePreview;