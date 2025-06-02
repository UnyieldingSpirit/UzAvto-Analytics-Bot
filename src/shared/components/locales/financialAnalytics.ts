import { LocaleMessages } from "../../../types/locale";

export const financialAnalyticsLocale: LocaleMessages = {
    ru: {
        title: 'Финансовая аналитика продаж автомобилей',
        subtitle: 'Анализ финансовых показателей и динамики продаж моделей',
        categories: {
            all: 'Все продажи',
            retail: 'Розница',
            wholesale: 'Опт'
        },
        buttons: {
            refresh: 'Обновить',
            loadData: 'Загрузить данные',
            reset: 'Сбросить'
        },
        infoCards: {
            totalAmount: 'Общая сумма',
            retailSales: 'Розничные продажи',
            wholesaleSales: 'Оптовые продажи',
            currentMonth: 'За текущий месяц',
            averageDaily: 'Средний доход в день',
            averageDailyRetail: 'Среднее в день (розница)',
            averageDailyWholesale: 'Среднее в день (опт)',
            basedOnDays: 'На основе {{count}} прошедших дней',
            expectedMonth: 'Ожидаемая сумма за месяц',
            expectedRetail: 'Прогноз розницы за месяц',
            expectedWholesale: 'Прогноз опта за месяц',
            monthProgress: '{{current}} / {{total}} дней месяца прошло'
        },
        table: {
            title: 'Детальная статистика продаж по дням',
            headers: {
                date: 'Дата',
                totalSales: 'Общие продажи',
                retailSales: 'Розничные продажи',
                wholesaleSales: 'Оптовые продажи',
                remaining: 'Остальные'
            },
            total: 'ИТОГО:',
            noData: 'Данные отсутствуют для выбранного периода',
            selectDifferentPeriod: 'Выберите другой диапазон дат или обновите данные',
            loading: 'Загрузка данных...'
        },
        months: {
            january: 'Январь',
            february: 'Февраль',
            march: 'Март',
            april: 'Апрель',
            may: 'Май',
            june: 'Июнь',
            july: 'Июль',
            august: 'Август',
            september: 'Сентябрь',
            october: 'Октябрь',
            november: 'Ноябрь',
            december: 'Декабрь'
        },
        weekdays: {
            sunday: 'Воскресенье',
            monday: 'Понедельник',
            tuesday: 'Вторник',
            wednesday: 'Среда',
            thursday: 'Четверг',
            friday: 'Пятница',
            saturday: 'Суббота'
        }
    },
    uz: {
        title: 'Avtomobil sotuvlari moliyaviy tahlili',
        subtitle: 'Moliyaviy ko\'rsatkichlar va modellar sotuv dinamikasini tahlil qilish',
        categories: {
            all: 'Barcha sotuvlar',
            retail: 'Chakana',
            wholesale: 'Ulgurji'
        },
        buttons: {
            refresh: 'Yangilash',
            loadData: 'Ma\'lumotlarni yuklash',
            reset: 'Tozalash'
        },
        infoCards: {
            totalAmount: 'Umumiy summa',
            retailSales: 'Chakana savdo',
            wholesaleSales: 'Ulgurji savdo',
            currentMonth: 'Joriy oy uchun',
            averageDaily: 'O\'rtacha kunlik daromad',
            averageDailyRetail: 'Kunlik o\'rtacha (chakana)',
            averageDailyWholesale: 'Kunlik o\'rtacha (ulgurji)',
            basedOnDays: '{{count}} o\'tgan kunlar asosida',
            expectedMonth: 'Oy uchun kutilayotgan summa',
            expectedRetail: 'Chakana savdo prognozi',
            expectedWholesale: 'Ulgurji savdo prognozi',
            monthProgress: 'Oyning {{current}} / {{total}} kuni o\'tdi'
        },
        table: {
            title: 'Kunlik savdo statistikasi',
            headers: {
                date: 'Sana',
                totalSales: 'Umumiy savdo',
                retailSales: 'Chakana savdo',
                wholesaleSales: 'Ulgurji savdo',
                remaining: 'Qolganlari'
            },
            total: 'JAMI:',
            noData: 'Tanlangan davr uchun ma\'lumot yo\'q',
            selectDifferentPeriod: 'Boshqa sanalar oralig\'ini tanlang yoki ma\'lumotlarni yangilang',
            loading: 'Ma\'lumotlar yuklanmoqda...'
        },
        months: {
            january: 'Yanvar',
            february: 'Fevral',
            march: 'Mart',
            april: 'Aprel',
            may: 'May',
            june: 'Iyun',
            july: 'Iyul',
            august: 'Avgust',
            september: 'Sentyabr',
            october: 'Oktyabr',
            november: 'Noyabr',
            december: 'Dekabr'
        },
        weekdays: {
            sunday: 'Yakshanba',
            monday: 'Dushanba',
            tuesday: 'Seshanba',
            wednesday: 'Chorshanba',
            thursday: 'Payshanba',
            friday: 'Juma',
            saturday: 'Shanba'
        }
    },
    en: {
        title: 'Car Sales Financial Analytics',
        subtitle: 'Analysis of financial indicators and model sales dynamics',
        categories: {
            all: 'All Sales',
            retail: 'Retail',
            wholesale: 'Wholesale'
        },
        buttons: {
            refresh: 'Refresh',
            loadData: 'Load Data',
            reset: 'Reset'
        },
        infoCards: {
            totalAmount: 'Total Amount',
            retailSales: 'Retail Sales',
            wholesaleSales: 'Wholesale Sales',
            currentMonth: 'For current month',
            averageDaily: 'Average daily income',
            averageDailyRetail: 'Daily average (retail)',
            averageDailyWholesale: 'Daily average (wholesale)',
            basedOnDays: 'Based on {{count}} days passed',
            expectedMonth: 'Expected amount for month',
            expectedRetail: 'Retail forecast for month',
            expectedWholesale: 'Wholesale forecast for month',
            monthProgress: '{{current}} / {{total}} days of month passed'
        },
        table: {
            title: 'Daily Sales Statistics',
            headers: {
                date: 'Date',
                totalSales: 'Total Sales',
                retailSales: 'Retail Sales',
                wholesaleSales: 'Wholesale Sales',
                remaining: 'Others'
            },
            total: 'TOTAL:',
            noData: 'No data for selected period',
            selectDifferentPeriod: 'Select different date range or refresh data',
            loading: 'Loading data...'
        },
        months: {
            january: 'January',
            february: 'February',
            march: 'March',
            april: 'April',
            may: 'May',
            june: 'June',
            july: 'July',
            august: 'August',
            september: 'September',
            october: 'October',
            november: 'November',
            december: 'December'
        },
        weekdays: {
            sunday: 'Sunday',
            monday: 'Monday',
            tuesday: 'Tuesday',
            wednesday: 'Wednesday',
            thursday: 'Thursday',
            friday: 'Friday',
            saturday: 'Saturday'
        }
    }
};