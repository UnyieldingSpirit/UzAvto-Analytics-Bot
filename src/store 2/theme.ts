// src/store/theme.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeState {
    mode: ThemeMode
    isDark: boolean
    setMode: (mode: ThemeMode) => void
    setIsDark: (isDark: boolean) => void
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            mode: 'system',
            isDark: false, // Значение по умолчанию, будет обновлено при инициализации
            setMode: (mode: ThemeMode) => set({ mode }),
            setIsDark: (isDark: boolean) => set({ isDark })
        }),
        {
            name: 'theme-store',
        }
    )
)

// Инициализация состояния темной темы в браузере
if (typeof window !== 'undefined') {
    // Проверка системной темы
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const updateTheme = () => {
        const themeStore = useThemeStore.getState()
        const mode = themeStore.mode

        let isDark = false
        if (mode === 'system') {
            isDark = mediaQuery.matches
        } else {
            isDark = mode === 'dark'
        }

        // Обновляем состояние и DOM
        themeStore.setIsDark(isDark)

        // Применяем тему к HTML
        if (isDark) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }

    // Инициализация
    setTimeout(updateTheme, 0)

    // Слушаем изменения системной темы
    mediaQuery.addEventListener('change', updateTheme)
}