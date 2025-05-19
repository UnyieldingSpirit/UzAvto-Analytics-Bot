import { LocaleMessages } from "@/src/types/locale";

export const settingsTranslations: LocaleMessages = {
    'ru': {
        title: 'Настройки',
        saveSettings: 'Сохранить',
        settingsSaved: 'Настройки успешно сохранены',
        language: {
            title: 'Язык интерфейса',
            description: 'Выберите предпочтительный язык для интерфейса приложения.',
            ruNative: 'Русский язык',
            enNative: 'English language',
            uzNative: 'O\'zbek tili'
        },
        theme: {
            title: 'Тема оформления',
            description: 'Выберите режим отображения интерфейса.',
            light: 'Светлая тема',
            dark: 'Тёмная тема',
            auto: 'Системная'
        },
        notifications: {
            title: 'Уведомления',
            description: 'Управление уведомлениями и оповещениями.',
            enableAll: 'Включить уведомления',
            enableAllDescription: 'Получать важные оповещения о статусе автомобилей.',
            sales: 'Уведомления о продажах',
            delivery: 'Статус поставок',
            system: 'Системные уведомления'
        },
        security: {
            title: 'Безопасность',
            description: 'Настройки безопасности и конфиденциальности.',
            low: 'Низкая',
            lowDescription: 'Базовая защита и длительное хранение сессии.',
            medium: 'Средняя',
            mediumDescription: 'Оптимальный баланс безопасности и удобства.',
            high: 'Высокая',
            highDescription: 'Максимальная защита с частой проверкой авторизации.'
        },
        footer: {
            about: 'UzAvtoSalon - мониторинг и управление продажами автомобилей',
            version: 'Версия: {{version}}'
        }
    },
    'uz': {
        title: 'Sozlamalar',
        saveSettings: 'Saqlash',
        settingsSaved: 'Sozlamalar muvaffaqiyatli saqlandi',
        language: {
            title: 'Interfeys tili',
            description: 'Ilova interfeysi uchun afzal tilni tanlang.',
            ruNative: 'Русский язык',
            enNative: 'English language',
            uzNative: 'O\'zbek tili'
        },
        theme: {
            title: 'Ko\'rinish mavzusi',
            description: 'Interfeys ko\'rinish rejimini tanlang.',
            light: 'Yorqin mavzu',
            dark: 'Qorong\'i mavzu',
            auto: 'Tizim'
        },
        notifications: {
            title: 'Bildirishnomalar',
            description: 'Bildirishnomalar va ogohlantirishlarni boshqarish.',
            enableAll: 'Bildirishnomalarni yoqish',
            enableAllDescription: 'Avtomobil holati haqida muhim ogohlantirishlarni qabul qiling.',
            sales: 'Sotish bildirishnomalari',
            delivery: 'Yetkazib berish holati',
            system: 'Tizim bildirishnomalari'
        },
        security: {
            title: 'Xavfsizlik',
            description: 'Xavfsizlik va maxfiylik sozlamalari.',
            low: 'Past',
            lowDescription: 'Asosiy himoya va uzoq davom etadigan seans.',
            medium: 'O\'rta',
            mediumDescription: 'Xavfsizlik va qulaylik o\'rtasidagi muvozanat.',
            high: 'Yuqori',
            highDescription: 'Tez-tez avtorizatsiya tekshiruvlari bilan maksimal himoya.'
        },
        footer: {
            about: 'UzAvtoSalon - avtomobil savdosini kuzatish va boshqarish',
            version: 'Versiya: {{version}}'
        }
    }
};