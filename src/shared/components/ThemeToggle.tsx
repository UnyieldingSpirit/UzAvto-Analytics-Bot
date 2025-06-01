// src/shared/components/ThemeToggle.tsx
import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../store/theme';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
    const { mode, setMode } = useThemeStore();
    
    const toggleTheme = () => {
        setMode(mode === 'light' ? 'dark' : 'light');
    };
    
    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="relative p-2 rounded-lg bg-gray-200 dark:bg-gray-800 
                     hover:bg-gray-300 dark:hover:bg-gray-700
                     transition-colors duration-200"
            aria-label="Toggle theme"
        >
            <div className="relative w-6 h-6">
                <Sun 
                    className={`absolute inset-0 text-orange-500 transition-all duration-200 ${
                        mode === 'light' ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'
                    }`}
                    size={24}
                />
                <Moon 
                    className={`absolute inset-0 text-blue-400 transition-all duration-200 ${
                        mode === 'dark' ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'
                    }`}
                    size={24}
                />
            </div>
        </motion.button>
    );
}