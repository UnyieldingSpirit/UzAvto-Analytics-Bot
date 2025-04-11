// src/hooks/useTelegram.ts
'use client';

import { useState, useEffect } from 'react';
import type { TelegramUser, TelegramWebApp, HapticFeedbackType } from '../types/telegram';

interface UseTelegramReturn {
    user: TelegramUser | null;
    isTelegram: boolean;
    hapticFeedback: (type: HapticFeedbackType) => boolean;
    showAlert: (message: string) => boolean;
    sendData: (data: any) => boolean;
    tg: TelegramWebApp | null;
    isReady: boolean;
}

export function useTelegram(): UseTelegramReturn {
    const [tg, setTg] = useState<TelegramWebApp | null>(null);
    const [user, setUser] = useState<TelegramUser | null>(null);
    const [isReady, setIsReady] = useState<boolean>(false);

    useEffect(() => {
        // Проверяем, есть ли доступ к WebApp API Telegram
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            const webApp = window.Telegram.WebApp;
            setTg(webApp);

            // Получаем данные пользователя из WebApp, если они есть
            if (webApp.initDataUnsafe?.user) {
                setUser(webApp.initDataUnsafe.user);
            }

            setIsReady(true);
        } else {
            setIsReady(true); // Приложение готово, но без Telegram
        }
    }, []);

    // Проверка, запущено ли приложение в Telegram
    const isTelegram = !!tg;

    // Функция для отправки данных в Telegram
    const sendData = (data: any): boolean => {
        if (tg) {
            try {
                const jsonData = typeof data === 'string' ? data : JSON.stringify(data);
                tg.sendData(jsonData);
                return true;
            } catch (error) {
                console.error('Ошибка при отправке данных:', error);
                return false;
            }
        }
        return false;
    };

    // Функция для показа встроенного уведомления Telegram
    const showAlert = (message: string): boolean => {
        if (tg) {
            tg.showAlert(message);
            return true;
        } else {
            // Fallback для тестирования вне Telegram
            alert(message);
            return false;
        }
    };

    // Функция для тактильной обратной связи
    const hapticFeedback = (type: HapticFeedbackType): boolean => {
        if (tg && tg.HapticFeedback) {
            switch (type) {
                case 'impact':
                    tg.HapticFeedback.impactOccurred('medium');
                    break;
                case 'notification':
                    tg.HapticFeedback.notificationOccurred('success');
                    break;
                case 'selection':
                    tg.HapticFeedback.selectionChanged();
                    break;
            }
            return true;
        }
        return false;
    };

    return {
        user,
        isTelegram,
        hapticFeedback,
        showAlert,
        sendData,
        tg,
        isReady
    };
}