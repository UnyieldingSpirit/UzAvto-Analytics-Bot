// src/store/theme.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ThemeMode = 'light' | 'dark'

interface ThemeState {
    mode: ThemeMode
    setMode: (mode: ThemeMode) => void
    initializeTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            mode: 'light',
            setMode: (mode: ThemeMode) => {
                set({ mode });
                // Применяем тему к DOM
                if (mode === 'dark') {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            },
            initializeTheme: () => {
                const currentMode = get().mode;
                if (currentMode === 'dark') {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            }
        }),
        {
            name: 'theme-store',
        }
    )
)