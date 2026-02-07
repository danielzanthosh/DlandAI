import React from 'react';

interface RatingOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RatingOverlay: React.FC<RatingOverlayProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#FAFAF9] dark:bg-[#0c0a09] animate-fade-in transition-colors duration-300">
      <div className="flex-none h-16 bg-[#FAFAF9]/80 dark:bg-[#0c0a09]/80 backdrop-blur-xl border-b border-stone-200/50 dark:border-stone-800/50 flex items-center justify-between px-6">
        <h2 className="text-lg font-medium text-stone-800 dark:text-stone-200 tracking-tight">Feedback</h2>
        <button 
          onClick={onClose}
          className="p-2 text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 rounded-full transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div className="flex-1 w-full h-full relative overflow-hidden bg-white dark:bg-[#1c1917]">
        <iframe 
          src="https://docs.google.com/forms/d/e/1FAIpQLScJp75K1QO9K0XwW6Wb1b8X5Jp75K1QO9K0XwW6Wb1b8X5Jp/viewform?embedded=true" 
          className="w-full h-full border-none"
          title="Rate Dland"
        >
          Loading…
        </iframe>
      </div>
       <div className="absolute bottom-4 right-4 text-xs text-stone-400 dark:text-stone-600 pointer-events-none">
          Use the form above to rate us
       </div>
    </div>
  );
};

export const RatingOverlayFixed: React.FC<RatingOverlayProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#FAFAF9] dark:bg-[#0c0a09] animate-fade-in transition-colors duration-300">
       {/* Header */}
      <div className="flex-none h-16 bg-[#FAFAF9]/90 dark:bg-[#0c0a09]/90 backdrop-blur-xl border-b border-stone-200 dark:border-stone-800 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium text-stone-800 dark:text-stone-200">Rate Dland</h2>
        </div>
        <button 
          onClick={onClose}
          className="group flex items-center justify-center p-2 rounded-full text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800 transition-all"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 w-full bg-white dark:bg-[#1c1917] relative">
        <iframe 
          src="https://forms.gle/WGyTANw26yy58KTaA" 
          className="w-full h-full border-none"
          title="Rate Dland"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
        <div className="absolute inset-0 -z-10 flex flex-col items-center justify-center text-stone-500 dark:text-stone-400">
            <p>Loading form...</p>
            <p className="text-sm mt-2">If it doesn't appear, <a href="https://forms.gle/WGyTANw26yy58KTaA" target="_blank" className="underline hover:text-stone-800 dark:hover:text-stone-200">click here</a>.</p>
        </div>
      </div>
    </div>
  );
};