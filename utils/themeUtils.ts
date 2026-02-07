import { AccentColor } from "./types";

export const getAccentStyles = (color: AccentColor, isDarkMode: boolean) => {
    // Tailwind classes mapping
    const maps = {
        stone: {
            userBubble: isDarkMode ? 'bg-stone-200 text-stone-900' : 'bg-stone-800 text-stone-50',
            sendButton: isDarkMode ? 'bg-stone-200 text-stone-900 hover:bg-white' : 'bg-stone-900 text-stone-50 hover:bg-black',
            activeMode: isDarkMode ? 'bg-stone-700 text-white' : 'bg-white text-stone-900 shadow-sm',
            logo: isDarkMode ? 'bg-stone-100 text-stone-900' : 'bg-stone-900 text-white',
            text: 'text-stone-900 dark:text-stone-100',
            border: 'border-stone-200 dark:border-stone-800'
        },
        blue: {
            userBubble: 'bg-blue-600 text-white',
            sendButton: 'bg-blue-600 text-white hover:bg-blue-700',
            activeMode: isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200',
            logo: 'bg-blue-600 text-white',
            text: 'text-blue-600 dark:text-blue-400',
            border: 'border-blue-200 dark:border-blue-800'
        },
        emerald: {
            userBubble: 'bg-emerald-600 text-white',
            sendButton: 'bg-emerald-600 text-white hover:bg-emerald-700',
            activeMode: isDarkMode ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-200',
            logo: 'bg-emerald-600 text-white',
            text: 'text-emerald-600 dark:text-emerald-400',
            border: 'border-emerald-200 dark:border-emerald-800'
        },
        rose: {
            userBubble: 'bg-rose-600 text-white',
            sendButton: 'bg-rose-600 text-white hover:bg-rose-700',
            activeMode: isDarkMode ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 shadow-sm ring-1 ring-rose-200',
            logo: 'bg-rose-600 text-white',
            text: 'text-rose-600 dark:text-rose-400',
            border: 'border-rose-200 dark:border-rose-800'
        },
        amber: {
            userBubble: 'bg-amber-500 text-white',
            sendButton: 'bg-amber-500 text-white hover:bg-amber-600',
            activeMode: isDarkMode ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 shadow-sm ring-1 ring-amber-200',
            logo: 'bg-amber-500 text-white',
            text: 'text-amber-600 dark:text-amber-400',
            border: 'border-amber-200 dark:border-amber-800'
        },
        indigo: {
            userBubble: 'bg-indigo-600 text-white',
            sendButton: 'bg-indigo-600 text-white hover:bg-indigo-700',
            activeMode: isDarkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200',
            logo: 'bg-indigo-600 text-white',
            text: 'text-indigo-600 dark:text-indigo-400',
            border: 'border-indigo-200 dark:border-indigo-800'
        }
    };

    return maps[color];
};