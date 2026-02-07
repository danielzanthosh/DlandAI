import React, { useMemo, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { toPng } from 'html-to-image';
import { ChatMessage, MessageRole, AccentColor } from '../utils/types';
import { getAccentStyles } from '../utils/themeUtils';

// Helper component for Code Blocks to manage Copy state independently
const CodeBlock = ({ language, children, className }: { language: string, children: React.ReactNode, className?: string }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    if (!children) return;
    try {
        await navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
        console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="my-4 rounded-md overflow-hidden border border-stone-700 bg-[#1c1c1c] shadow-sm">
        <div className="flex justify-between items-center px-4 py-1.5 bg-[#262626] text-xs text-stone-400 border-b border-stone-700 select-none">
            <span className="font-mono lowercase tracking-wide">{language}</span>
            <button 
                onClick={handleCopy}
                className="hover:text-stone-200 transition-colors flex items-center gap-1.5 min-w-[60px] justify-end"
                title="Copy code"
            >
                {isCopied ? (
                    <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span className="text-emerald-500 font-medium">Copied</span>
                    </>
                ) : (
                    <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        <span>Copy</span>
                    </>
                )}
            </button>
        </div>
        <div className="overflow-x-auto p-4">
            <code className={`font-mono text-sm text-stone-300 ${className}`}>
                {children}
            </code>
        </div>
    </div>
  );
};

interface MessageBubbleProps {
  message: ChatMessage;
  isDarkMode: boolean;
  accentColor: AccentColor;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isDarkMode, accentColor }) => {
  const isUser = message.role === MessageRole.User;
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const accentStyles = getAccentStyles(accentColor, isDarkMode);

  // Define components for ReactMarkdown based on user/model role to adapt colors
  const components = useMemo(() => {
    // Dynamic color logic based on mode and role
    const getTextColor = () => {
        if (isUser) {
             // For colored user bubbles, text is usually white unless in 'stone' light mode
             if (accentColor === 'stone' && !isDarkMode) return 'text-stone-50'; // Stone dark button uses stone-50
             if (accentColor === 'stone' && isDarkMode) return 'text-stone-900'; // Stone light button uses stone-900
             return 'text-white'; // Colored buttons are usually white text
        }
        return isDarkMode ? 'text-stone-300' : 'text-stone-900';
    };

    const getBoldColor = () => {
        if (isUser) return 'font-bold'; // Inherit color
        return isDarkMode ? 'text-stone-100' : 'text-stone-900';
    };
    
    const getLinkColor = () => {
        if (isUser) return 'underline'; // Inherit color
        return isDarkMode ? 'text-stone-200 hover:text-white' : 'text-stone-800 hover:text-stone-600';
    };

    const getBlockquoteColor = () => {
         if (isUser) return 'border-white/40 text-current opacity-90';
         return isDarkMode ? 'border-stone-700 text-stone-500' : 'border-stone-300 text-stone-500';
    };

    const getCodeInlineBg = () => {
        if (isUser) return 'bg-black/20 border-white/20';
        return isDarkMode ? 'bg-[#292524] text-stone-200 border-stone-700' : 'bg-stone-100 text-stone-800 border-stone-200';
    };

    return {
        p: ({children}: any) => <p className={`mb-3 last:mb-0 font-light leading-7 ${getTextColor()}`}>{children}</p>,
        strong: ({children}: any) => <strong className={`font-semibold ${getBoldColor()}`}>{children}</strong>,
        em: ({children}: any) => <em className="italic opacity-80">{children}</em>,
        ul: ({children}: any) => <ul className="list-disc pl-5 mb-4 space-y-1">{children}</ul>,
        ol: ({children}: any) => <ol className="list-decimal pl-5 mb-4 space-y-1">{children}</ol>,
        li: ({children}: any) => <li className={`pl-1 marker:opacity-50 ${getTextColor()}`}>{children}</li>,
        h1: ({children}: any) => <h1 className={`text-2xl font-medium mb-4 mt-6 first:mt-0 ${getBoldColor()}`}>{children}</h1>,
        h2: ({children}: any) => <h2 className={`text-xl font-medium mb-3 mt-5 first:mt-0 ${getBoldColor()}`}>{children}</h2>,
        h3: ({children}: any) => <h3 className={`text-lg font-medium mb-2 mt-4 first:mt-0 ${getBoldColor()}`}>{children}</h3>,
        blockquote: ({children}: any) => (
            <blockquote className={`border-l-2 pl-4 italic my-4 ${getBlockquoteColor()}`}>
                {children}
            </blockquote>
        ),
        a: ({href, children}: any) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className={`underline underline-offset-2 ${getLinkColor()}`}>
                {children}
            </a>
        ),
        code: ({node, inline, className, children, ...props}: any) => {
             const match = /language-(\w+)/.exec(className || '');
             const isBlock = !inline;
             const language = match ? match[1] : 'text';
             
             if (isBlock) {
                 return <CodeBlock language={language} className={className} children={children} />;
             }
             
             return (
                <code className={`font-mono text-sm rounded px-1.5 py-0.5 border ${getCodeInlineBg()}`} {...props}>
                    {children}
                </code>
             );
        }
    };
  }, [isUser, isDarkMode, accentColor]);

  // Bubble Styles
  const getBubbleStyles = () => {
    if (isUser) {
        return `${accentStyles.userBubble} rounded-2xl rounded-tr-sm shadow-sm`;
    } else {
        // Model Bubble
        return isDarkMode
            ? 'bg-transparent text-stone-300 rounded-2xl rounded-tl-sm border border-stone-800/60'
            : 'bg-white text-stone-800 rounded-2xl rounded-tl-sm border border-stone-200/60 shadow-sm';
    }
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setIsCopying(true);
      setTimeout(() => setIsCopying(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleShare = async () => {
    if (!bubbleRef.current || isSharing) return;
    setIsSharing(true);

    try {
        const node = bubbleRef.current;
        
        // Branding wrapper logic for share
        const branding = document.createElement('div');
        branding.innerHTML = `<div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid ${isDarkMode ? '#333' : '#ddd'}; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-family: serif; font-weight: 600; font-size: 16px; color: ${isDarkMode ? '#fff' : '#333'};">Dland</span>
            <span style="font-size: 12px; color: #888;">AI Assistant</span>
        </div>`;
        node.appendChild(branding);
        
        const brandedDataUrl = await toPng(node, {
             cacheBust: true,
             skipFonts: true,
             backgroundColor: isDarkMode ? '#0c0a09' : '#FAFAF9',
             style: { padding: '40px' },
             filter: (node) => {
                if (node instanceof HTMLElement && node.classList.contains('tools-container')) {
                    return false;
                }
                return true;
             }
        });
        
        node.removeChild(branding);

        const link = document.createElement('a');
        link.download = `dland-share-${Date.now()}.png`;
        link.href = brandedDataUrl;
        link.click();

    } catch (err) {
        console.error('Failed to share image', err);
    } finally {
        setIsSharing(false);
    }
  };

  return (
    <div className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'} mb-8 group`}>
      <div 
        ref={bubbleRef}
        className={`
          relative max-w-[85%] lg:max-w-[75%] 
          ${getBubbleStyles()}
          px-6 py-4 text-[15px] leading-7 overflow-hidden transition-colors duration-300
        `}
      >
        <div className="flex flex-col">
          {/* Attachment Display */}
          {message.attachment && (
            <div className="mb-4 rounded-lg overflow-hidden max-w-full">
              <img 
                src={`data:${message.attachment.mimeType};base64,${message.attachment.content}`} 
                alt="Uploaded content" 
                className="max-h-[300px] w-auto object-cover rounded-lg"
              />
            </div>
          )}

          {message.role === MessageRole.Model && message.text.length === 0 ? (
             <div className="flex space-x-1.5 h-6 items-center">
                <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s] ${isDarkMode ? 'bg-stone-600' : 'bg-stone-400'}`}></div>
                <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s] ${isDarkMode ? 'bg-stone-600' : 'bg-stone-400'}`}></div>
                <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDarkMode ? 'bg-stone-600' : 'bg-stone-400'}`}></div>
             </div>
          ) : (
             <ReactMarkdown 
                components={components}
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
             >
                {message.text}
             </ReactMarkdown>
          )}
        </div>
        
        {/* Tools (Copy/Share) - Visible on Hover */}
        {!message.isStreaming && message.text.length > 0 && (
            <div className={`tools-container flex items-center justify-end gap-3 mt-2 pt-2 border-t ${isUser ? 'border-white/20' : (isDarkMode ? 'border-stone-800' : 'border-stone-100')} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                {message.role === MessageRole.Model && message.executionTime !== undefined && (
                   <span className="text-[10px] opacity-50 mr-auto font-mono">
                      {(message.executionTime / 1000).toFixed(2)}s
                   </span>
                )}
                <button 
                    onClick={handleCopyMessage}
                    className="flex items-center gap-1.5 text-xs font-medium opacity-60 hover:opacity-100 transition-opacity"
                    title="Copy full message"
                >
                     {isCopying ? (
                        <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            Copied
                        </>
                     ) : (
                        <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            Copy
                        </>
                     )}
                </button>
                <button 
                    onClick={handleShare}
                    className="flex items-center gap-1.5 text-xs font-medium opacity-60 hover:opacity-100 transition-opacity"
                    title="Share as Image"
                    disabled={isSharing}
                >
                     {isSharing ? (
                        <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
                     ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                     )}
                     Share
                </button>
            </div>
        )}
      </div>
    </div>
  );
};