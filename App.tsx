import React, { useState, useEffect, useRef, useCallback } from 'react';
import { geminiService } from './services/geminiService';
import { openRouterService } from './services/openRouterService';
import { MessageBubble } from './components/MessageBubble';
import { InputArea } from './components/InputArea';
import { RatingOverlayFixed } from './components/RatingOverlay';
import { SettingsOverlay } from './components/SettingsOverlay';
import { ChatMessage, MessageRole, ChatMode, UserSettings, Attachment } from './utils/types';
import { generateId } from './utils/textUtils';
import { getAccentStyles } from './utils/themeUtils';

// Helper to construct dynamic system instructions
const getSystemInstructions = (mode: ChatMode, settings: UserSettings, locationInfo: string = ""): string => {
  const baseInstructions = {
    general: "You are Dland, an AI assistant.",
    python: "You are an expert Python tutor named Dland. You explain concepts clearly, provide idiomatic Python code examples (PEP 8 compliant), and help the user learn best practices. When providing code, explain the 'why' behind it.",
    linux: "You are an expert Linux System Administrator instructor named Dland. You teach command line usage, shell scripting (bash), and system architecture with a focus on safety, security, and clarity. Always warn about destructive commands."
  };

  const toneInstructions = {
    professional: "Your tone is professional, clear, and direct. Use sophisticated language.",
    casual: "Your tone is casual, friendly, and conversational. Feel free to use simple language.",
    enthusiastic: "Your tone is enthusiastic, energetic, and encouraging. Use exclamation points where appropriate.",
    concise: "Your tone is extremely concise. Provide only the necessary information with minimal filler."
  };

  const nameInstruction = settings.userName ? `Address the user as ${settings.userName} occasionally.` : "";
  
  const timeContext = `Current local time: ${new Date().toLocaleString()}.`;
  const locationContext = locationInfo ? `${locationInfo}.` : "";

  return `${baseInstructions[mode]} ${toneInstructions[settings.tone]} ${nameInstruction} ${locationContext} ${timeContext} Provide responses using clean Markdown formatting.`;
};

const DEFAULT_SETTINGS: UserSettings = {
    theme: 'light',
    accentColor: 'stone',
    userName: '',
    tone: 'professional'
};

const App: React.FC = () => {
  const [chatMode, setChatMode] = useState<ChatMode>('general');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Initial load from local storage
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(`dland_chat_history_general`);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to load chat history", e);
            }
        }
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Settings State
  const [settings, setSettings] = useState<UserSettings>(() => {
      const saved = localStorage.getItem('dland_settings');
      if (saved) {
          try {
              return JSON.parse(saved);
          } catch (e) {
              return DEFAULT_SETTINGS;
          }
      }
      // Initial theme detection
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return { ...DEFAULT_SETTINGS, theme: prefersDark ? 'dark' : 'light' };
  });

  const [locationInfo, setLocationInfo] = useState<string>("");
  
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true); // Track if user is at bottom
  const initialized = useRef(false);
  const hasUserInteracted = useRef(false); // Track if user started typing before location loaded
  const fileInputRef = useRef<HTMLInputElement>(null);
  const usedOpenRouter = useRef(false); // Track if we switched to OpenRouter to sync context later

  const isDarkMode = settings.theme === 'dark';
  const accentStyles = getAccentStyles(settings.accentColor, isDarkMode);

  // Initialize chat service with location
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      
      const initChat = async () => {
          let locString = "";
          try {
             if (navigator.geolocation) {
                 const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                     navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                 });
                 locString = `User Location: Lat ${pos.coords.latitude}, Lng ${pos.coords.longitude}`;
                 setLocationInfo(locString);
             }
          } catch (e) {
              console.log("Location access denied or timed out");
          }
          
          // Only start/reset the chat if the user hasn't already sent a message
          // This prevents wiping the session if the user starts typing while location is loading
          // Pass the loaded messages to restore session
          if (!hasUserInteracted.current) {
              geminiService.startChat(getSystemInstructions('general', settings, locString), messages);
          }
      };
      
      initChat();
    }
  }, []);

  // Auto-save messages to local storage whenever they change
  useEffect(() => {
    localStorage.setItem(`dland_chat_history_${chatMode}`, JSON.stringify(messages));
  }, [messages, chatMode]);

  // Persist settings and apply theme
  useEffect(() => {
    localStorage.setItem('dland_settings', JSON.stringify(settings));
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  const handleScroll = () => {
    if (scrollViewportRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollViewportRef.current;
        const diff = scrollHeight - scrollTop - clientHeight;
        // Consider user at bottom if within 100px of the end
        isAtBottomRef.current = diff < 100;
    }
  };

  const scrollToBottom = (smooth = true) => {
    if (scrollViewportRef.current) {
        const { scrollHeight, clientHeight } = scrollViewportRef.current;
        const maxScrollTop = scrollHeight - clientHeight;
        scrollViewportRef.current.scrollTo({
            top: maxScrollTop,
            behavior: smooth ? 'smooth' : 'auto'
        });
    }
  };

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg) return;

    // If it's a user message, force scroll to bottom and reset latch
    if (lastMsg.role === MessageRole.User) {
        scrollToBottom(true);
        isAtBottomRef.current = true;
    } else {
        // If it's a model message, only scroll if user was already at bottom
        if (isAtBottomRef.current) {
            scrollToBottom(true);
        }
    }
  }, [messages]);

  const handleSendMessage = useCallback(async (text: string, attachment?: Attachment) => {
    if (isLoading) return;
    
    hasUserInteracted.current = true;
    const startTime = Date.now();

    const userMsgId = generateId();
    const modelMsgId = generateId();

    const newUserMessage: ChatMessage = {
      id: userMsgId,
      role: MessageRole.User,
      text: text,
      timestamp: startTime,
      attachment: attachment
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const newModelMessage: ChatMessage = {
        id: modelMsgId,
        role: MessageRole.Model,
        text: '',
        isStreaming: true,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, newModelMessage]);

      let accumulatedText = '';
      
      // Decision logic: Use OpenRouter if attachment exists
      let stream;
      if (attachment) {
          usedOpenRouter.current = true;
          stream = openRouterService.sendMessageStream(text, attachment, messages);
      } else {
          // If we previously used OpenRouter, we should try to sync Gemini history context
          if (usedOpenRouter.current) {
             geminiService.restoreSession(getSystemInstructions(chatMode, settings, locationInfo), messages);
             usedOpenRouter.current = false;
          }
          stream = geminiService.sendMessageStream(text);
      }

      for await (const chunk of stream) {
        accumulatedText += chunk;
        setMessages((prev) => 
          prev.map((msg) => 
            msg.id === modelMsgId ? { ...msg, text: accumulatedText } : msg
          )
        );
      }
    } catch (error) {
      console.error("Chat error", error);
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: MessageRole.System,
        text: "We encountered an issue processing your request. Please try again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === modelMsgId ? { ...msg, isStreaming: false, executionTime: duration } : msg
        )
      );
    }
  }, [isLoading, messages, chatMode, settings, locationInfo]);

  const handleModeChange = (mode: ChatMode) => {
      setChatMode(mode);
      
      // Load history for the new mode
      let savedMessages: ChatMessage[] = [];
      const saved = localStorage.getItem(`dland_chat_history_${mode}`);
      if (saved) {
          try {
              savedMessages = JSON.parse(saved);
          } catch(e) {
              console.error("Error loading saved messages for mode", mode, e);
          }
      }
      setMessages(savedMessages);

      // Restore session with new history
      geminiService.reset(getSystemInstructions(mode, settings, locationInfo));
      if (savedMessages.length > 0) {
          geminiService.restoreSession(getSystemInstructions(mode, settings, locationInfo), savedMessages);
      }
      usedOpenRouter.current = false;
  };

  const handleReset = () => {
    geminiService.reset(getSystemInstructions(chatMode, settings, locationInfo));
    setMessages([]);
    localStorage.removeItem(`dland_chat_history_${chatMode}`);
    usedOpenRouter.current = false;
  };

  const handleUpdateSettings = (newSettings: UserSettings) => {
      setSettings(newSettings);
      if (messages.length === 0) {
          geminiService.reset(getSystemInstructions(chatMode, newSettings, locationInfo));
      }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(messages, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dland_chat_${chatMode}_${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const content = e.target?.result as string;
              const importedMessages = JSON.parse(content) as ChatMessage[];
              
              if (Array.isArray(importedMessages)) {
                  setMessages(importedMessages);
                  geminiService.restoreSession(getSystemInstructions(chatMode, settings, locationInfo), importedMessages);
                  usedOpenRouter.current = false; // Assume restored session is fresh for Gemini
              }
          } catch (error) {
              console.error("Failed to parse chat file", error);
              alert("Invalid chat file.");
          }
      };
      reader.readAsText(file);
      event.target.value = '';
  };

  const getGreeting = () => {
      const hour = new Date().getHours();
      const timeGreeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
      const name = settings.userName ? `, ${settings.userName}` : "";
      return `${timeGreeting}${name}.`;
  };

  return (
    <div className={`flex flex-col h-screen bg-[#FAFAF9] dark:bg-[#0c0a09] relative selection:bg-stone-200 dark:selection:bg-stone-700 transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept=".json" 
      />

      {/* Header */}
      <header className="flex-none h-16 bg-[#FAFAF9]/80 dark:bg-[#0c0a09]/80 backdrop-blur-xl border-b border-stone-200/50 dark:border-stone-800/50 flex items-center justify-between px-6 sticky top-0 z-30 transition-all duration-300 shadow-sm">
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-md flex items-center justify-center font-serif font-medium text-lg shadow-sm transition-colors ${accentStyles.logo}`}>
                    D
                </div>
                <h1 className="font-medium text-stone-800 dark:text-stone-100 tracking-tight text-lg transition-colors hidden sm:block">Dland</h1>
            </div>
            
            <div className="h-6 w-px bg-stone-300 dark:bg-stone-700 mx-2 hidden sm:block"></div>
            
            <div className="flex bg-stone-200/50 dark:bg-stone-800/50 rounded-lg p-1">
                {(['general', 'python', 'linux'] as ChatMode[]).map((mode) => (
                    <button
                        key={mode}
                        onClick={() => handleModeChange(mode)}
                        className={`
                            px-3 py-1 text-xs font-medium rounded-md transition-all capitalize
                            ${chatMode === mode 
                                ? accentStyles.activeMode
                                : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
                            }
                        `}
                    >
                        {mode === 'general' ? 'General' : mode === 'python' ? 'Python' : 'Linux'}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex items-center gap-2">
             <button
                onClick={handleImportClick}
                className="p-2 text-stone-400 hover:text-stone-900 dark:text-stone-500 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 rounded-full transition-all duration-300"
                title="Import Chat"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
             </button>
             <button
                onClick={handleExport}
                className="p-2 text-stone-400 hover:text-stone-900 dark:text-stone-500 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 rounded-full transition-all duration-300 mr-2"
                title="Export Chat"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
             </button>

             <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-stone-400 hover:text-stone-900 dark:text-stone-500 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 rounded-full transition-all duration-300 mr-2"
                title="Settings"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
            </button>
            
            <button
                onClick={() => setShowRating(true)}
                className="hidden sm:block px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 rounded-md transition-colors"
            >
                Rate our App
            </button>
            <div className="w-px h-4 bg-stone-300 dark:bg-stone-700 mx-1 hidden sm:block"></div>
            <button 
                onClick={handleReset}
                className="p-2 text-stone-400 hover:text-stone-900 dark:text-stone-500 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 rounded-full transition-all duration-300"
                title="Start New Chat"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 4v6h-6"></path>
                    <path d="M1 20v-6h6"></path>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
            </button>
        </div>
      </header>

      {/* Chat Area */}
      <main ref={scrollViewportRef} onScroll={handleScroll} className="flex-1 overflow-y-auto scroll-smooth relative z-0">
        <div className="max-w-3xl mx-auto px-4 pt-8 pb-44 min-h-full flex flex-col">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-0 animate-fade-in" style={{ animation: 'fadeIn 0.8s ease-out forwards' }}>
                <div className={`w-20 h-20 rounded-full shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-stone-100 dark:border-stone-800 flex items-center justify-center mb-8 transition-colors bg-white dark:bg-[#1c1917]`}>
                     <div className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-stone-600' : 'bg-stone-300'}`}></div>
                </div>
                <h2 className="text-3xl font-light text-stone-800 dark:text-stone-100 mb-3 tracking-tight transition-colors">
                    {getGreeting()}
                </h2>
                <p className="text-stone-500 dark:text-stone-400 max-w-sm font-light transition-colors">
                    {chatMode === 'general' 
                        ? 'How can I assist you with your tasks today?'
                        : chatMode === 'python'
                        ? 'Ready to write some code? Ask me anything about Python.'
                        : 'Manage your systems. Ask me about Linux commands.'}
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-12 w-full max-w-2xl">
                    {(chatMode === 'general' ? [
                        "Analyze this business strategy",
                        "Refactor this Python function",
                        "Draft a professional email",
                        "Explain key macroeconomic trends"
                    ] : chatMode === 'python' ? [
                        "Explain list comprehensions",
                        "How do decorators work?",
                        "Create a FastAPI starter",
                        "Debug this script"
                    ] : [
                        "Explain file permissions",
                        "How to use grep and sed?",
                        "Systemd service configuration",
                        "Check disk usage"
                    ]).map((suggestion, i) => (
                        <button 
                            key={i}
                            onClick={() => handleSendMessage(suggestion)}
                            className="p-4 text-left bg-white dark:bg-[#1c1917] border border-stone-200/60 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 hover:shadow-sm rounded-lg transition-all duration-300 text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 font-light"
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} isDarkMode={isDarkMode} accentColor={settings.accentColor} />
              ))}
            </>
          )}
        </div>
      </main>

      {/* Input Footer */}
      <footer className="fixed bottom-0 left-0 w-full z-20">
        <InputArea onSend={handleSendMessage} isLoading={isLoading} accentColor={settings.accentColor} isDarkMode={isDarkMode} />
      </footer>
      
      {/* Overlays */}
      <RatingOverlayFixed isOpen={showRating} onClose={() => setShowRating(false)} />
      <SettingsOverlay 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />
      
      <style>{`
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); filter: blur(4px); }
            to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
      `}</style>
    </div>
  );
};

export default App;