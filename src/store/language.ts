// src/store/language.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Locale } from '../types/locale'

interface LanguageState {
    currentLocale: Locale
    availableLocales: Record<Locale, string>
    setLocale: (locale: Locale) => void
    // Добавляем функцию для определения языка браузера
    detectBrowserLocale: () => Locale
}

// Функция для определения языка браузера
const detectBrowserLocale = (): Locale => {
    if (typeof navigator === 'undefined') return 'ru'; // Возвращаем русский по умолчанию на сервере

    // Получаем язык браузера
    const browserLocale = navigator.language.split('-')[0].toLowerCase();

    // Проверяем, поддерживается ли язык
    if (['ru', 'en', 'uz'].includes(browserLocale)) {
        return browserLocale as Locale;
    }

    // Возвращаем русский по умолчанию
    return 'ru';
};

export const useLanguageStore = create<LanguageState>()(
    persist(
        (set) => ({
            currentLocale: 'ru', // Значение по умолчанию, будет перезаписано при гидратации
            availableLocales: {
                'ru': 'Русский',
                'en': 'English',
                'uz': 'O\'zbekcha'
            },
            setLocale: (locale: Locale) => set({
                currentLocale: locale
            }),
            detectBrowserLocale
        }),
        {
            name: 'language-store',
            // Функция onRehydrateStorage вызывается после восстановления из localStorage
            onRehydrateStorage: () => (state) => {
                if (!state) return;

                // Если язык не был установлен ранее, определяем язык браузера
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
    // Небольшая задержка, чтобы гарантировать, что гидратация состояния произошла
    setTimeout(() => {
        const langStore = useLanguageStore.getState();
        const storedLocale = localStorage.getItem('language-store');

        // Если язык не был установлен в localStorage, определяем язык браузера
        if (!storedLocale || storedLocale.indexOf('"currentLocale":"ru"') > -1) {
            const detectedLocale = langStore.detectBrowserLocale();
            if (detectedLocale !== langStore.currentLocale) {
                langStore.setLocale(detectedLocale);
            }
        }
    }, 0);
}