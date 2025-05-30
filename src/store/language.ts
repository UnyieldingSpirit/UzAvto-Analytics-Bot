// src/store/language.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Locale } from '../types/locale'

interface LanguageState {
    currentLocale: Locale
    availableLocales: Record<Locale, string>
    setLocale: (locale: Locale) => void
    detectBrowserLocale: () => Locale
}

// Функция для определения языка браузера
const detectBrowserLocale = (): Locale => {
    if (typeof navigator === 'undefined') return 'ru';

    const browserLocale = navigator.language.split('-')[0].toLowerCase();

    // Проверяем поддерживаемые языки
    if (['ru', 'uz', 'en'].includes(browserLocale)) {
        return browserLocale as Locale;
    }

    // Возвращаем русский по умолчанию
    return 'ru';
};

export const useLanguageStore = create<LanguageState>()(
    persist(
        (set) => ({
            currentLocale: 'ru',
            availableLocales: {
                'ru': 'Русский',
                'uz': 'O\'zbekcha',
                'en': 'English'
            },
            setLocale: (locale: Locale) => set({
                currentLocale: locale
            }),
            detectBrowserLocale
        }),
        {
            name: 'language-store',
            onRehydrateStorage: () => (state) => {
                if (!state) return;

                if (!state.currentLocale || state.currentLocale === 'ru') {
                    const detectedLocale = state.detectBrowserLocale();
                    if (detectedLocale !== state.currentLocale) {
                        state.setLocale(detectedLocale);
                    }
                }
            }
        }
    )
);

// Инициализация языка на клиенте
if (typeof window !== 'undefined') {
    setTimeout(() => {
        const langStore = useLanguageStore.getState();
        const storedLocale = localStorage.getItem('language-store');

        if (!storedLocale || storedLocale.indexOf('"currentLocale":"ru"') > -1) {
            const detectedLocale = langStore.detectBrowserLocale();
            if (detectedLocale !== langStore.currentLocale) {
                langStore.setLocale(detectedLocale);
            }
        }
    }, 0);
}