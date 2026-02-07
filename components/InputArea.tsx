import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { AccentColor, Attachment } from '../utils/types';
import { getAccentStyles } from '../utils/themeUtils';

interface InputAreaProps {
  onSend: (text: string, attachment?: Attachment) => void;
  isLoading: boolean;
  accentColor: AccentColor;
  isDarkMode: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ onSend, isLoading, accentColor, isDarkMode }) => {
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<Attachment | undefined>(undefined);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const styles = getAccentStyles(accentColor, isDarkMode);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSend = () => {
    if ((!input.trim() && !attachment) || isLoading) return;
    onSend(input, attachment);
    setInput('');
    setAttachment(undefined);
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        // result is "data:image/jpeg;base64,..."
        const [mimeTypePart, contentPart] = result.split(';base64,');
        const mimeType = mimeTypePart.split(':')[1];
        
        setAttachment({
          content: contentPart,
          mimeType: mimeType
        });
      };
      reader.readAsDataURL(file);
    }
    // Reset input so same file can be selected again if needed
    e.target.value = '';
  };

  const removeAttachment = () => {
    setAttachment(undefined);
  };

  return (
    <div className="w-full bg-gradient-to-t from-[#FAFAF9] via-[#FAFAF9] to-transparent dark:from-[#0c0a09] dark:via-[#0c0a09] pt-2 pb-6 px-4 transition-colors duration-300">
      <div className="max-w-3xl mx-auto relative">
        
        {/* Attachment Preview */}
        {attachment && (
          <div className="mb-2 relative inline-block">
             <div className="relative rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 shadow-md">
                 <img 
                    src={`data:${attachment.mimeType};base64,${attachment.content}`} 
                    alt="Attachment" 
                    className="h-20 w-auto object-cover"
                 />
                 <button 
                    onClick={removeAttachment}
                    className="absolute top-1 right-1 p-0.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                 >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                 </button>
             </div>
          </div>
        )}

        <div className="relative flex items-end gap-3 bg-white dark:bg-[#1c1917] border border-stone-200 dark:border-stone-800 shadow-xl hover:shadow-2xl hover:border-stone-300 dark:hover:border-stone-700 rounded-2xl px-4 py-3 focus-within:ring-1 focus-within:ring-stone-300 dark:focus-within:ring-stone-700 focus-within:border-stone-400 dark:focus-within:border-stone-600 transition-all duration-300">
          
          {/* File Input */}
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mb-2 p-2 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="Add image"
            disabled={isLoading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
            </svg>
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Dland..."
            className="w-full max-h-[200px] bg-transparent border-none focus:ring-0 resize-none py-2.5 text-stone-800 dark:text-stone-200 placeholder-stone-400 dark:placeholder-stone-500 font-light leading-relaxed custom-scrollbar"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={(!input.trim() && !attachment) || isLoading}
            className={`
              mb-1.5 p-2 rounded-xl flex-shrink-0 transition-all duration-200
              ${(!input.trim() && !attachment) || isLoading 
                ? 'bg-stone-100 dark:bg-stone-800 text-stone-300 dark:text-stone-600 cursor-not-allowed' 
                : `${styles.sendButton} shadow-md transform hover:scale-105 active:scale-95`
              }
            `}
          >
            {isLoading ? (
               <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
            ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
            )}
          </button>
        </div>
        <div className="text-center mt-3">
            <p className="text-[10px] uppercase tracking-widest text-stone-400 dark:text-stone-600 font-medium">
                Dland Intelligence
            </p>
        </div>
      </div>
    </div>
  );
};