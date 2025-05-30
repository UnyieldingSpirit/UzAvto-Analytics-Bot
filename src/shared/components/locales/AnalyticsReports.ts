import { LocaleMessages } from "../../../types/locale";

export const analyticsReportsTranslations: LocaleMessages = {
    'ru': {
        title: 'Аналитические отчеты',
        subtitle: 'Комплексная аналитика продаж за {{year}} год',

        // Вкладки навигации
        tabs: {
            overview: '📊 Обзор',
            visualization: '📈 Визуализация',
            comparison: '📅 Сравнение по годам',
            details: '🔍 Детали'
        },

        // Метрики
        metrics: {
            totalSold: 'Всего продано',
            totalRevenue: 'Общая выручка',
            models: 'Моделей',
            colors: 'Цветов',
            units: 'шт',
            currency: 'сум'
        },

        // Фильтры и периоды
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

        // Отчеты
        reports: {
            bestSelling: {
                title: 'Самая продаваемая модель',
                subtitle: 'Лидер продаж',
                modelLeader: 'Модель-лидер:',
                result: 'Самая продаваемая модель за {{year}} год {{model}} {{modification}} {{color}} - {{quantity}} штук'
            },
            mostProfitable: {
                title: 'Самая прибыльная модель',
                subtitle: 'Максимальная прибыль',
                profitLeader: 'Лидер по прибыли:',
                result: 'Самая прибыльная модель за {{year}} год {{model}} {{modification}} {{color}} - {{amount}}'
            },
            bestSellingColor: {
                title: 'Самый популярный цвет',
                subtitle: 'Цветовые предпочтения',
                popularColor: 'Популярный цвет:',
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

        // Графики и визуализация
        charts: {
            topModels: 'Топ-5 моделей по продажам',
            colorDistribution: 'Распределение по цветам',
            modelRating: 'Рейтинг моделей',
            monthlySalesDynamics: 'Динамика продаж по месяцам',
            yearComparison: 'Сравнение показателей по годам',
            selectYears: 'Выберите годы для сравнения',
            totalSales: 'Всего продаж',
            totalRevenue: 'Общая выручка',
            salesDynamics: 'Динамика продаж по месяцам',
            year: 'год',
            growth: 'Рост',
            decline: 'Снижение',
            noChange: 'Без изменений',
            comparedTo: 'по сравнению с {{year}}',
            loading: 'Загрузка данных...'
        },

        // Таблица деталей
        table: {
            model: 'Модель',
            sales: 'Продажи',
            revenue: 'Выручка',
            avgPrice: 'Средняя цена',
            marketShare: 'Доля рынка',
            rank: 'Место'
        },

        // Состояния и сообщения
        states: {
            loading: 'Загружаем аналитику...',
            noData: 'Нет данных для отображения',
            error: 'Ошибка при загрузке данных'
        },

        // Действия
        actions: {
            exportReport: 'Экспортировать отчет',
            refreshData: 'Обновить данные',
            celebrate: 'Отпраздновать успех!'
        }
    },
    'uz': {
        title: 'Analitik hisobotlar',
        subtitle: '{{year}} yil uchun savdo tahlili',

        // Вкладки навигации
        tabs: {
            overview: '📊 Umumiy ko\'rinish',
            visualization: '📈 Vizualizatsiya',
            comparison: '📅 Yillar bo\'yicha taqqoslash',
            details: '🔍 Tafsilotlar'
        },

        // Метрики
        metrics: {
            totalSold: 'Jami sotilgan',
            totalRevenue: 'Umumiy daromad',
            models: 'Modellar',
            colors: 'Ranglar',
            units: 'dona',
            currency: 'so\'m'
        },

        // Фильтры и периоды
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

        // Отчеты
        reports: {
            bestSelling: {
                title: 'Eng ko\'p sotilgan model',
                subtitle: 'Savdo yetakchisi',
                modelLeader: 'Yetakchi model:',
                result: '{{year}} yilda eng ko\'p sotilgan model {{model}} {{modification}} {{color}} - {{quantity}} dona'
            },
            mostProfitable: {
                title: 'Eng foydali model',
                subtitle: 'Maksimal foyda',
                profitLeader: 'Foyda bo\'yicha yetakchi:',
                result: '{{year}} yilda eng foydali model {{model}} {{modification}} {{color}} - {{amount}}'
            },
            bestSellingColor: {
                title: 'Eng mashhur rang',
                subtitle: 'Rang tanlovi',
                popularColor: 'Mashhur rang:',
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

        // Графики и визуализация
        charts: {
            topModels: 'Savdo bo\'yicha top-5 modellar',
            colorDistribution: 'Ranglar bo\'yicha taqsimot',
            modelRating: 'Modellar reytingi',
            monthlySalesDynamics: 'Oylik savdo dinamikasi',
            yearComparison: 'Yillar bo\'yicha ko\'rsatkichlarni taqqoslash',
            selectYears: 'Taqqoslash uchun yillarni tanlang',
            totalSales: 'Jami savdo',
            totalRevenue: 'Umumiy daromad',
            salesDynamics: 'Oylik savdo dinamikasi',
            year: 'yil',
            growth: 'O\'sish',
            decline: 'Pasayish',
            noChange: 'O\'zgarishsiz',
            comparedTo: '{{year}} yilga nisbatan',
            loading: 'Ma\'lumotlar yuklanmoqda...'
        },

        // Таблица деталей
        table: {
            model: 'Model',
            sales: 'Savdo',
            revenue: 'Daromad',
            avgPrice: 'O\'rtacha narx',
            marketShare: 'Bozor ulushi',
            rank: 'O\'rin'
        },

        // Состояния и сообщения
        states: {
            loading: 'Tahlillar yuklanmoqda...',
            noData: 'Ko\'rsatish uchun ma\'lumot yo\'q',
            error: 'Ma\'lumotlarni yuklashda xatolik'
        },

        // Действия
        actions: {
            exportReport: 'Hisobotni eksport qilish',
            refreshData: 'Ma\'lumotlarni yangilash',
            celebrate: 'Muvaffaqiyatni nishonlash!'
        }
    },
    'en': {
        title: 'Analytics Reports',
        subtitle: 'Comprehensive sales analytics for {{year}}',

        // Вкладки навигации
        tabs: {
            overview: '📊 Overview',
            visualization: '📈 Visualization',
            comparison: '📅 Year Comparison',
            details: '🔍 Details'
        },

        // Метрики
        metrics: {
            totalSold: 'Total Sold',
            totalRevenue: 'Total Revenue',
            models: 'Models',
            colors: 'Colors',
            units: 'pcs',
            currency: 'UZS'
        },

        // Фильтры и периоды
        filters: {
            year: 'Year',
            modification: 'Modification',
            color: 'Color',
            period: 'Period',
            allColors: 'All colors',
            allModifications: 'All modifications',
            wholeYear: 'Whole year',
            quarter: 'Quarter',
            month: 'Month',
            reset: 'Reset filters'
        },

        // Отчеты
        reports: {
            bestSelling: {
                title: 'Best Selling Model',
                subtitle: 'Sales Leader',
                modelLeader: 'Leading model:',
                result: 'Best selling model in {{year}} {{model}} {{modification}} {{color}} - {{quantity}} units'
            },
            mostProfitable: {
                title: 'Most Profitable Model',
                subtitle: 'Maximum Profit',
                profitLeader: 'Profit leader:',
                result: 'Most profitable model in {{year}} {{model}} {{modification}} {{color}} - {{amount}}'
            },
            bestSellingColor: {
                title: 'Most Popular Color',
                subtitle: 'Color Preferences',
                popularColor: 'Popular color:',
                result: 'In {{year}} most cars sold in {{color}} color - {{quantity}} units'
            },
            color: 'Color',
            marketShare: 'of total volume',
            vsLastYear: 'vs last year',
            profitMargin: 'Profit margin',
            revenue: 'Revenue',
            allSales: 'of all sales',
            acrossAllModels: 'Across all models',
            byModel: 'By models'
        },

        // Графики и визуализация
        charts: {
            topModels: 'Top 5 Models by Sales',
            colorDistribution: 'Color Distribution',
            modelRating: 'Model Rating',
            monthlySalesDynamics: 'Monthly Sales Dynamics',
            yearComparison: 'Year-over-Year Comparison',
            selectYears: 'Select years to compare',
            totalSales: 'Total Sales',
            totalRevenue: 'Total Revenue',
            salesDynamics: 'Monthly Sales Dynamics',
            year: 'year',
            growth: 'Growth',
            decline: 'Decline',
            noChange: 'No change',
            comparedTo: 'compared to {{year}}',
            loading: 'Loading data...'
        },

        // Таблица деталей
        table: {
            model: 'Model',
            sales: 'Sales',
            revenue: 'Revenue',
            avgPrice: 'Average Price',
            marketShare: 'Market Share',
            rank: 'Rank'
        },

        // Состояния и сообщения
        states: {
            loading: 'Loading analytics...',
            noData: 'No data to display',
            error: 'Error loading data'
        },

        // Действия
        actions: {
            exportReport: 'Export Report',
            refreshData: 'Refresh Data',
            celebrate: 'Celebrate Success!'
        }
    }
};