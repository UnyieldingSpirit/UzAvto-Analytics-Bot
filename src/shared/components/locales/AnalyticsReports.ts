import { LocaleMessages } from "@/src/types/locale";

export const analyticsReportsTranslations: LocaleMessages = {
    'ru': {
        title: 'Аналитические отчеты',
        subtitle: 'Комплексная аналитика продаж за {{year}} год',

        filters: {
            year: 'Год',
            modification: 'Модификация',
            color: 'Цвет',
            period: 'Период',
            allColors: 'Все цвета',
            allModifications: 'Все модификации',
            wholeYear: 'Весь год',
            quarter: 'Квартал',
            month: 'Месяц',
            reset: 'Сбросить фильтры'
        },

        reports: {
            bestSelling: {
                title: 'Самая продаваемая модель',
                subtitle: 'Лидер продаж',
                result: 'Самая продаваемая модель за {{year}} год {{model}} {{modification}} {{color}} цвета - {{quantity}} штук'
            },
            mostProfitable: {
                title: 'Самая прибыльная модель',
                subtitle: 'Максимальная прибыль',
                result: 'Самая прибыльная модель за {{year}} год {{model}} {{modification}} {{color}} цвета - {{amount}}'
            },
            bestSellingColor: {
                title: 'Самый популярный цвет',
                subtitle: 'Цветовые предпочтения',
                result: 'В {{year}} году больше всего автомобилей продано {{color}} цвета - {{quantity}} штук'
            },
            color: 'Цвет',
            marketShare: 'от общего объема',
            vsLastYear: 'к прошлому году',
            profitMargin: 'Рентабельность',
            revenue: 'Выручка',
            allSales: 'от всех продаж',
            acrossAllModels: 'По всем моделям',
            byModel: 'По моделям'
        },

        analytics: {
            byModification: 'Разбивка по модификациям',
            byColor: 'Разбивка по цветам',
            monthlyBreakdown: 'Продажи по месяцам',
            profitByModification: 'Прибыль по модификациям',
            profitByColor: 'Прибыль по цветам',
            quarterlyBreakdown: 'Квартальная динамика',
            colorComparison: 'Сравнение всех цветов',
            yearOverYear: 'Динамика по годам',
            allModelsComparison: 'Сравнительный анализ всех моделей'
        },

        table: {
            model: 'Модель',
            sales: 'Продажи',
            revenue: 'Выручка',
            avgPrice: 'Средняя цена',
            performance: 'Эффективность'
        },

        units: 'шт.',

        actions: {
            exportReport: 'Экспортировать отчет',
            download: 'Скачать',
            print: 'Печать',
            share: 'Поделиться'
        }
    },
    'uz': {
        title: 'Analitik hisobotlar',
        subtitle: '{{year}} yil uchun savdo tahlili',

        filters: {
            year: 'Yil',
            modification: 'Modifikatsiya',
            color: 'Rang',
            period: 'Davr',
            allColors: 'Barcha ranglar',
            allModifications: 'Barcha modifikatsiyalar',
            wholeYear: 'Butun yil',
            quarter: 'Chorak',
            month: 'Oy',
            reset: 'Filtrlarni tozalash'
        },

        reports: {
            bestSelling: {
                title: 'Eng ko\'p sotilgan model',
                subtitle: 'Savdo yetakchisi',
                result: '{{year}} yilda eng ko\'p sotilgan model {{model}} {{modification}} {{color}} rang - {{quantity}} dona'
            },
            mostProfitable: {
                title: 'Eng foydali model',
                subtitle: 'Maksimal foyda',
                result: '{{year}} yilda eng foydali model {{model}} {{modification}} {{color}} rang - {{amount}}'
            },
            bestSellingColor: {
                title: 'Eng mashhur rang',
                subtitle: 'Rang tanlovi',
                result: '{{year}} yilda eng ko\'p {{color}} rangli avtomobillar sotilgan - {{quantity}} dona'
            },
            color: 'Rang',
            marketShare: 'umumiy hajmdan',
            vsLastYear: 'o\'tgan yilga nisbatan',
            profitMargin: 'Rentabellik',
            revenue: 'Daromad',
            allSales: 'barcha savdolardan',
            acrossAllModels: 'Barcha modellar bo\'yicha',
            byModel: 'Modellar bo\'yicha'
        },

        analytics: {
            byModification: 'Modifikatsiyalar bo\'yicha',
            byColor: 'Ranglar bo\'yicha',
            monthlyBreakdown: 'Oylik savdolar',
            profitByModification: 'Modifikatsiyalar bo\'yicha foyda',
            profitByColor: 'Ranglar bo\'yicha foyda',
            quarterlyBreakdown: 'Choraklik dinamika',
            colorComparison: 'Barcha ranglar taqqoslash',
            yearOverYear: 'Yillik dinamika',
            allModelsComparison: 'Barcha modellar qiyosiy tahlili'
        },

        table: {
            model: 'Model',
            sales: 'Savdo',
            revenue: 'Daromad',
            avgPrice: 'O\'rtacha narx',
            performance: 'Samaradorlik'
        },

        units: 'dona',

        actions: {
            exportReport: 'Hisobotni eksport qilish',
            download: 'Yuklab olish',
            print: 'Chop etish',
            share: 'Ulashish'
        }
    }
};  