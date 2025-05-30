import { LocaleMessages } from "../../../types/locale";

export const productionDashboardTranslations: LocaleMessages = {
    'ru': {
        // Заголовки
        title: 'Производства (event #700)',
        subtitle: 'Исследуйте данные производства автомобилей',

        // Фильтры и параметры
        filters: {
            title: 'Параметры анализа',
            expand: 'Развернуть',
            collapse: 'Свернуть',
        },
        periodAnalysis: {
            title: 'Период анализа',
            year: 'год'
        },
        marketType: {
            title: 'Тип рынка',
            all: 'Все рынки',
            domestic: 'Внутренний',
            export: 'Экспортный'
        },

        // Ключевые показатели
        metrics: {
            totalProduction: 'Общее производство',
            forYear: 'за {{year}} год',
            domesticMarket: 'Внутренний рынок',
            exportMarket: 'Экспортный рынок',
            ofTotal: '% от общего объема',
        },

        // График
        chart: {
            title: 'Динамика производства',
            hint: 'Нажмите на столбец месяца для просмотра детальной информации по моделям',
            noData: 'Нет данных для отображения за {{year}} год',
            productionForYear: 'Производство автомобилей - {{year}} год'
        },

        // Детализация по месяцу
        monthDetails: {
            title: 'Производство за {{month}} {{year}}',
            totalCars: 'авто',
            model: 'Модель',
            domesticMarket: 'Внутренний рынок',
            exportMarket: 'Экспортный рынок',
            total: 'Всего',
            ofTotal: '% от общего',
            noModelsData: 'Нет данных о моделях за выбранный месяц',
            totalRow: 'Итого:'
        },

        // Месяцы
        months: {
            '01': 'Январь',
            '02': 'Февраль',
            '03': 'Март',
            '04': 'Апрель',
            '05': 'Май',
            '06': 'Июнь',
            '07': 'Июль',
            '08': 'Август',
            '09': 'Сентябрь',
            '10': 'Октябрь',
            '11': 'Ноябрь',
            '12': 'Декабрь'
        },

        // Состояния
        loading: 'Загрузка данных...',
        error: {
            title: 'Ошибка загрузки данных',
            noDataToDisplay: 'Нет данных для отображения за выбранный период'
        }
    },
    'uz': {
        // Заголовки
        title: 'Ishlab chiqarish',
        subtitle: 'Avtomobil ishlab chiqarish ma\'lumotlarini o\'rganing',

        // Фильтры и параметры
        filters: {
            title: 'Tahlil parametrlari',
            expand: 'Kengaytirish',
            collapse: 'Yig\'ish',
        },
        periodAnalysis: {
            title: 'Tahlil davri',
            year: 'yil'
        },
        marketType: {
            title: 'Bozor turi',
            all: 'Barcha bozorlar',
            domestic: 'Ichki bozor',
            export: 'Eksport bozori'
        },

        // Ключевые показатели
        metrics: {
            totalProduction: 'Umumiy ishlab chiqarish',
            forYear: '{{year}} yil uchun',
            domesticMarket: 'Ichki bozor',
            exportMarket: 'Eksport bozori',
            ofTotal: '% umumiy hajmdan',
        },

        // График
        chart: {
            title: 'Ishlab chiqarish dinamikasi',
            hint: 'Modellar bo\'yicha batafsil ma\'lumotni ko\'rish uchun oy ustunini bosing',
            noData: '{{year}} yil uchun ko\'rsatish uchun ma\'lumot yo\'q',
            productionForYear: 'Avtomobil ishlab chiqarish - {{year}} yil'
        },

        // Детализация по месяцу
        monthDetails: {
            title: '{{month}} {{year}} uchun ishlab chiqarish',
            totalCars: 'avto',
            model: 'Model',
            domesticMarket: 'Ichki bozor',
            exportMarket: 'Eksport bozori',
            total: 'Jami',
            ofTotal: '% umumiydan',
            noModelsData: 'Tanlangan oy uchun modellar haqida ma\'lumot yo\'q',
            totalRow: 'Jami:'
        },

        // Месяцы
        months: {
            '01': 'Yanvar',
            '02': 'Fevral',
            '03': 'Mart',
            '04': 'Aprel',
            '05': 'May',
            '06': 'Iyun',
            '07': 'Iyul',
            '08': 'Avgust',
            '09': 'Sentabr',
            '10': 'Oktabr',
            '11': 'Noyabr',
            '12': 'Dekabr'
        },

        // Состояния
        loading: 'Ma\'lumotlar yuklanmoqda...',
        error: {
            title: 'Ma\'lumotlarni yuklashda xatolik',
            noDataToDisplay: 'Tanlangan davr uchun ko\'rsatish uchun ma\'lumot yo\'q'
        }
    },
    'en': {
        // Заголовки
        title: 'Production (event #700)',
        subtitle: 'Explore car production data',

        // Фильтры и параметры
        filters: {
            title: 'Analysis Parameters',
            expand: 'Expand',
            collapse: 'Collapse',
        },
        periodAnalysis: {
            title: 'Analysis Period',
            year: 'year'
        },
        marketType: {
            title: 'Market Type',
            all: 'All markets',
            domestic: 'Domestic',
            export: 'Export'
        },

        // Ключевые показатели
        metrics: {
            totalProduction: 'Total Production',
            forYear: 'for {{year}}',
            domesticMarket: 'Domestic Market',
            exportMarket: 'Export Market',
            ofTotal: '% of total',
        },

        // График
        chart: {
            title: 'Production Dynamics',
            hint: 'Click on month column to view detailed information by models',
            noData: 'No data to display for {{year}}',
            productionForYear: 'Car Production - {{year}}'
        },

        // Детализация по месяцу
        monthDetails: {
            title: 'Production for {{month}} {{year}}',
            totalCars: 'cars',
            model: 'Model',
            domesticMarket: 'Domestic Market',
            exportMarket: 'Export Market',
            total: 'Total',
            ofTotal: '% of total',
            noModelsData: 'No model data for selected month',
            totalRow: 'Total:'
        },

        // Месяцы
        months: {
            '01': 'January',
            '02': 'February',
            '03': 'March',
            '04': 'April',
            '05': 'May',
            '06': 'June',
            '07': 'July',
            '08': 'August',
            '09': 'September',
            '10': 'October',
            '11': 'November',
            '12': 'December'
        },

        // Состояния
        loading: 'Loading data...',
        error: {
            title: 'Error loading data',
            noDataToDisplay: 'No data to display for selected period'
        }
    }
};