// src/hooks/useTranslation.ts
import { useMemo, useCallback } from 'react';
import { useLanguageStore } from '../store/language';
import type { LocaleMessages } from '../types/locale';

interface TranslationOptions {
    returnObjects?: boolean;
    [key: string]: string | number | boolean | undefined;
}

// Функция для получения вложенных свойств объекта по пути
const getNestedProperty = (obj: any, path: string): any => {
    const keys = path.split('.');
    return keys.reduce((prev, curr) => (prev && prev[curr] !== undefined ? prev[curr] : undefined), obj);
};

// Функция для подстановки параметров в строку
const replaceParams = (message: string, params?: TranslationOptions): string => {
    if (!params) return message;

    // Заменяем {{param}} и {param}
    return message
        .replace(/\{\{(\w+)\}\}/g, (_, match) => {
            return params[match] !== undefined ? String(params[match]) : `{{${match}}}`;
        })
        .replace(/\{(\w+)\}/g, (_: unknown, match: string | number) => {
            return params[match] !== undefined ? String(params[match]) : `{${match}}`;
        });
};

export function useTranslation<T extends LocaleMessages>(localization: T) {
    const { currentLocale, availableLocales } = useLanguageStore();

    // Получаем сообщения для текущего языка или для запасного языка, если текущий недоступен
    const messages = useMemo(() => {
        const currentMessages = localization[currentLocale];

        // Если перевод для текущего языка отсутствует, используем русский
        if (!currentMessages && localization['ru']) {
            return localization['ru'];
        }

        // Если русский перевод тоже отсутствует, используем первый доступный
        if (!currentMessages) {
            const availableLocale = Object.keys(localization)[0];
            return availableLocale ? localization[availableLocale as keyof T] : {};
        }

        return currentMessages;
    }, [localization, currentLocale]);

    // Функция для получения перевода
    const t = useCallback(<R = string>(key: string, params?: TranslationOptions): R => {
        // Получаем сообщение по пути
        const message = getNestedProperty(messages, key);

        // Если сообщение не найдено, возвращаем ключ
        if (message === undefined) {
            return key as unknown as R;
        }

        // Если запрошены объекты, возвращаем их как есть
        if (params?.returnObjects) {
            return message as R;
        }

        // Если сообщение - строка и есть параметры, заменяем их
        if (typeof message === 'string' && params) {
            return replaceParams(message, params) as unknown as R;
        }

        // В остальных случаях возвращаем сообщение или ключ
        return (typeof message === 'string' ? message : key) as unknown as R;
    }, [messages]);

    return { t, messages, currentLocale };
}