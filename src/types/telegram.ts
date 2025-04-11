// src/types/telegram.ts

// Расширяем глобальный тип Window для добавления Telegram WebApp
declare global {
    interface Window {
        Telegram?: {
            WebApp?: TelegramWebApp;
        };
    }
}

// Type definition for the Telegram context

export type HapticFeedbackType = 'impact' | 'notification' | 'selection';

export interface TelegramUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    is_premium?: boolean;
    [key: string]: any; // For any additional properties that might exist
}

export interface TelegramWebAppInitData {
    query_id?: string;
    user?: TelegramUser;
    auth_date?: number;
    hash?: string;
    start_param?: string;
    [key: string]: any; // For any additional properties
}

export interface HapticFeedback {
    impactOccurred: (style: string) => void;
    notificationOccurred: (type: string) => void;
    selectionChanged: () => void;
}

export interface TelegramWebApp {
    initData: string;
    initDataUnsafe: TelegramWebAppInitData;
    version: string;
    colorScheme: string;
    themeParams: any;
    isExpanded: boolean;
    viewportHeight: number;
    viewportStableHeight: number;
    headerColor: string;
    backgroundColor: string;
    ready: () => void;
    expand: () => void;
    close: () => void;
    showAlert: (message: string, callback?: () => void) => void;
    showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
    showPopup: (params: any, callback?: (id: string) => void) => void;
    sendData: (data: any) => void;
    openLink: (url: string, options?: any) => void;
    openTelegramLink: (url: string) => void;
    HapticFeedback?: HapticFeedback;
    [key: string]: any; // For any additional methods or properties
}

export interface TelegramContextType {
    telegramApp: TelegramWebApp | null;
    user: TelegramUser | null;
    isReady: boolean;
    isTelegram: boolean;
    sendData: (data: any) => boolean;
    showAlert: (message: string) => boolean;
    hapticFeedback: (type: HapticFeedbackType) => boolean;
}

// This should be the interface that the useTelegram hook returns
export interface UseTelegramReturn extends TelegramContextType { }