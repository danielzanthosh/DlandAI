import React from 'react';
import { UserSettings, Tone, AccentColor } from '../utils/types';
import { getAccentStyles } from '../utils/themeUtils';

interface SettingsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
}

export const SettingsOverlay: React.FC<SettingsOverlayProps> = ({ isOpen, onClose, settings, onUpdateSettings }) => {
  if (!isOpen) return null;

  const isDarkMode = settings.theme === 'dark';
  const styles = getAccentStyles(settings.accentColor, isDarkMode);

  const colors: AccentColor[] = ['stone', 'blue', 'emerald', 'rose', 'amber', 'indigo'];
  const tones: Tone[] = ['professional', 'casual', 'enthusiastic', 'concise'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 dark:bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#1c1917] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-stone-200 dark:border-stone-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 dark:border-stone-800 flex-none">
            <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100">Settings</h2>
            <button 
                onClick={onClose}
                className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 transition-colors"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-8">
            
            {/* Appearance Section */}
            <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-4">Appearance</h3>
                
                {/* Theme Toggle */}
                <div className="flex items-center justify-between mb-6">
                    <span className="text-stone-700 dark:text-stone-300">Dark Mode</span>
                    <button 
                        onClick={() => onUpdateSettings({ ...settings, theme: isDarkMode ? 'light' : 'dark' })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2 dark:focus:ring-offset-stone-900 ${isDarkMode ? 'bg-stone-700' : 'bg-stone-200'}`}
                    >
                        <span className={`${isDarkMode ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                    </button>
                </div>

                {/* Accent Color */}
                <div className="space-y-3">
                    <label className="text-sm text-stone-700 dark:text-stone-300 block">Accent Color</label>
                    <div className="flex flex-wrap gap-3">
                        {colors.map((color) => (
                            <button
                                key={color}
                                onClick={() => onUpdateSettings({ ...settings, accentColor: color })}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${
                                    settings.accentColor === color 
                                    ? `border-stone-400 dark:border-stone-500 scale-110 shadow-sm` 
                                    : 'border-transparent hover:scale-105'
                                }`}
                                style={{ backgroundColor: color === 'stone' ? '#78716c' : `var(--color-${color}-500, ${getColorHex(color)})` }}
                                title={color.charAt(0).toUpperCase() + color.slice(1)}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Personalization Section */}
            <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-4">Personalization</h3>
                
                <div className="space-y-3">
                    <label className="text-sm text-stone-700 dark:text-stone-300 block">Your Name</label>
                    <input 
                        type="text" 
                        value={settings.userName}
                        onChange={(e) => onUpdateSettings({ ...settings, userName: e.target.value })}
                        placeholder="What should I call you?"
                        className="w-full px-4 py-2 rounded-lg bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 focus:ring-2 focus:ring-stone-400 focus:border-transparent outline-none text-stone-800 dark:text-stone-200 transition-all placeholder-stone-400"
                    />
                </div>
            </section>

            {/* AI Persona Section */}
            <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-4">AI Persona</h3>
                
                <div className="space-y-3">
                    <label className="text-sm text-stone-700 dark:text-stone-300 block">Tone</label>
                    <div className="grid grid-cols-2 gap-3">
                        {tones.map((tone) => (
                            <button
                                key={tone}
                                onClick={() => onUpdateSettings({ ...settings, tone })}
                                className={`px-3 py-2 text-sm rounded-lg border text-left transition-all ${
                                    settings.tone === tone
                                    ? 'bg-stone-100 dark:bg-stone-800 border-stone-400 dark:border-stone-500 text-stone-900 dark:text-stone-100'
                                    : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/50'
                                }`}
                            >
                                {tone.charAt(0).toUpperCase() + tone.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

             {/* Apps Section */}
             <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-4">More from Dland</h3>
                <a 
                    href="https://campfire-coral.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-800/30 border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 transition-all group"
                >
                    <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-lg bg-orange-500 text-white flex items-center justify-center shadow-sm">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.2-2.2.5-3.27.7.26 1.38.7 2 1.27z"></path></svg>
                         </div>
                         <div>
                             <h4 className="text-sm font-medium text-stone-900 dark:text-stone-100 group-hover:text-stone-700 dark:group-hover:text-stone-300 transition-colors">Campfire</h4>
                             <p className="text-xs text-stone-500 dark:text-stone-400">Join the conversation</p>
                         </div>
                    </div>
                    <svg className="text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </a>
            </section>

            {/* Privacy & About Section */}
            <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-4">Privacy & About</h3>
                
                <div className="bg-stone-50 dark:bg-stone-800/30 rounded-xl p-4 border border-stone-100 dark:border-stone-800 space-y-4">
                    <div>
                         <div className="flex items-center gap-2 mb-2">
                            <svg className="text-stone-600 dark:text-stone-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                            <h4 className="text-sm font-medium text-stone-800 dark:text-stone-200">Offline & Private</h4>
                         </div>
                        <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed text-justify">
                            All chat data is saved offline. You can download your chat history to your device and upload it back anytime. Your data remains encrypted on your device and is not stored on our servers.
                        </p>
                    </div>

                    <div className="border-t border-stone-200 dark:border-stone-700/50 pt-3">
                         <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3">Contact</h4>
                         <div className="space-y-2">
                             <a href="mailto:danielzanthosh@gmail.com" className="flex items-center gap-3 text-sm text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-colors p-2 hover:bg-stone-200/50 dark:hover:bg-stone-700/50 rounded-lg -mx-2">
                                <div className="p-1.5 bg-stone-200 dark:bg-stone-700 rounded-md">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                </div>
                                <span>danielzanthosh@gmail.com</span>
                             </a>
                             <a href="https://wa.me/918129680282" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-colors p-2 hover:bg-stone-200/50 dark:hover:bg-stone-700/50 rounded-lg -mx-2">
                                <div className="p-1.5 bg-stone-200 dark:bg-stone-700 rounded-md">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                </div>
                                <span>+91 81296 80282</span>
                             </a>
                         </div>
                    </div>

                    <div className="border-t border-stone-200 dark:border-stone-700/50 pt-3 text-center">
                        <p className="text-[10px] text-stone-400">
                             &copy; 2026 Daniel Santhosh<br/>App by Dland Group
                        </p>
                    </div>
                </div>
            </section>
        </div>
        
        {/* Footer */}
        <div className="p-6 pt-0 bg-transparent flex-none">
             <button 
                onClick={onClose}
                className={`w-full py-3 rounded-xl font-medium transition-all ${styles.sendButton} shadow-lg`}
             >
                 Done
             </button>
        </div>

      </div>
    </div>
  );
};

// Helper for inline styles
function getColorHex(color: string) {
    const map: Record<string, string> = {
        blue: '#2563eb',
        emerald: '#059669',
        rose: '#e11d48',
        amber: '#d97706',
        indigo: '#4f46e5'
    };
    return map[color] || '#78716c';
}