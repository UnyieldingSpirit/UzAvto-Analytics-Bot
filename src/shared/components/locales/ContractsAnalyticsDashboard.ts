import { LocaleMessages } from "../../../types/locale";

export const contractsAnalyticsTranslations: LocaleMessages = {
    'ru': {
        title: 'Анализ контрактов',
        subtitle: '{period} по контрактам, реализации и отменам для всех моделей',
        subtitleSpecific: 'Детальная статистика {period} по модели {model}',
        period: {
            year: 'за год',
            quarter: 'за полгода',
            month: 'за месяц',
            week: 'за неделю',
            custom: 'за выбранный период'
        },
        periodDescription: {
            year: 'годовой отчет',
            quarter: 'отчет за полгода',
            month: 'отчет за последний месяц',
            week: 'отчет за последнюю неделю',
            custom: 'отчет за период {startDate} — {endDate}'
        },
        filters: {
            title: 'Параметры аналитики',
            resetFilters: 'Сбросить фильтры',
            period: 'Период',
            region: 'Регион',
            model: 'Модель',
            allRegions: 'Все регионы',
            allModels: 'Все модели',
            reset: 'Сбросить',
            apply: 'Применить',
            ok: 'ОК'
        },
        stats: {
            title: 'Статистика {period}',
            contracts: 'Контракты',
            realization: 'Реализация',
            cancellation: 'Отмена',
            pieces: 'шт'
        },
        details: {
            title: 'Детальная информация: {model} {period}',
            regionDistribution: 'Распределение по регионам',
            noRegionData: 'Нет данных о распределении по регионам',
            carCategories: {
                sedan: 'Седан',
                suv: 'Внедорожник',
                minivan: 'Минивэн',
                other: 'Другое'
            }
        },
        charts: {
            dynamics: 'Динамика показателей {period}',
            monthlyDetail: 'Детализация по дням месяца',
            heatmap: {
                title: 'Тепловая карта за {month}',
                week: 'Неделя {number}',
                monday: 'Пн',
                tuesday: 'Вт',
                wednesday: 'Ср',
                thursday: 'Чт',
                friday: 'Пт',
                saturday: 'Сб',
                sunday: 'Вс',
                low: 'Мало',
                medium: 'Средне',
                high: 'Много',
                veryHigh: 'Очень много'
            },
            comparison: {
                title: 'Сравнительный анализ моделей {period} {date}'
            },
            noData: 'Нет данных для отображения. Пожалуйста, выберите другой период или фильтры.',
            noDataPeriod: 'Нет данных для выбранного периода: {startDate} - {endDate}',
            applyToUpdate: 'Нажмите "Применить", чтобы обновить данные для выбранного периода.'
        }
    },
    'uz': {
        title: 'Shartnomalar tahlili',
        subtitle: 'Barcha modellar uchun shartnomalar, sotishlar va bekor qilishlar {period}',
        subtitleSpecific: '{model} modeli bo\'yicha {period} batafsil statistika',
        period: {
            year: 'yillik',
            quarter: 'yarim yillik',
            month: 'oylik',
            week: 'haftalik',
            custom: 'tanlangan davr uchun'
        },
        periodDescription: {
            year: 'yillik hisobot',
            quarter: 'yarim yillik hisobot',
            month: 'oxirgi oy uchun hisobot',
            week: 'oxirgi hafta uchun hisobot',
            custom: '{startDate} — {endDate} davri uchun hisobot'
        },
        filters: {
            title: 'Tahlil parametrlari',
            resetFilters: 'Filtrlarni tiklash',
            period: 'Davr',
            region: 'Hudud',
            model: 'Model',
            allRegions: 'Barcha hududlar',
            allModels: 'Barcha modellar',
            reset: 'Tiklash',
            apply: 'Qo\'llash',
            ok: 'OK'
        },
        stats: {
            title: '{period} statistikasi',
            contracts: 'Shartnomalar',
            realization: 'Sotish',
            cancellation: 'Bekor qilish',
            pieces: 'dona'
        },
        details: {
            title: 'Batafsil ma\'lumot: {model} {period}',
            regionDistribution: 'Hududlar bo\'yicha taqsimlash',
            noRegionData: 'Hududlar bo\'yicha taqsimlash haqida ma\'lumot yo\'q',
            carCategories: {
                sedan: 'Sedan',
                suv: 'Yo\'l tanlamas',
                minivan: 'Miniven',
                other: 'Boshqa'
            }
        },
        charts: {
            dynamics: '{period} ko\'rsatkichlar dinamikasi',
            monthlyDetail: 'Oy kunlari bo\'yicha tafsilotlar',
            heatmap: {
                title: '{month} uchun issiqlik xaritasi',
                week: 'Hafta {number}',
                monday: 'Du',
                tuesday: 'Se',
                wednesday: 'Ch',
                thursday: 'Pa',
                friday: 'Ju',
                saturday: 'Sh',
                sunday: 'Ya',
                low: 'Kam',
                medium: 'O\'rta',
                high: 'Ko\'p',
                veryHigh: 'Juda ko\'p'
            },
            comparison: {
                title: 'Modellar qiyosiy tahlili {period} {date}'
            },
            noData: 'Ko\'rsatish uchun ma\'lumot yo\'q. Iltimos, boshqa davr yoki filtrlarni tanlang.',
            noDataPeriod: 'Tanlangan davr uchun ma\'lumot yo\'q: {startDate} - {endDate}',
            applyToUpdate: 'Tanlangan davr uchun ma\'lumotlarni yangilash uchun "Qo\'llash" tugmasini bosing.'
        }
    },
    'en': {
        title: 'Contract Analysis',
        subtitle: '{period} for contracts, sales and cancellations for all models',
        subtitleSpecific: 'Detailed statistics {period} for model {model}',
        period: {
            year: 'annual',
            quarter: 'semi-annual',
            month: 'monthly',
            week: 'weekly',
            custom: 'for selected period'
        },
        periodDescription: {
            year: 'annual report',
            quarter: 'semi-annual report',
            month: 'last month report',
            week: 'last week report',
            custom: 'report for period {startDate} — {endDate}'
        },
        filters: {
            title: 'Analytics Parameters',
            resetFilters: 'Reset filters',
            period: 'Period',
            region: 'Region',
            model: 'Model',
            allRegions: 'All regions',
            allModels: 'All models',
            reset: 'Reset',
            apply: 'Apply',
            ok: 'OK'
        },
        stats: {
            title: '{period} statistics',
            contracts: 'Contracts',
            realization: 'Sales',
            cancellation: 'Cancellation',
            pieces: 'pcs'
        },
        details: {
            title: 'Detailed info: {model} {period}',
            regionDistribution: 'Distribution by regions',
            noRegionData: 'No data on regional distribution',
            carCategories: {
                sedan: 'Sedan',
                suv: 'SUV',
                minivan: 'Minivan',
                other: 'Other'
            }
        },
        charts: {
            dynamics: 'Indicators dynamics {period}',
            monthlyDetail: 'Daily breakdown',
            heatmap: {
                title: 'Heatmap for {month}',
                week: 'Week {number}',
                monday: 'Mon',
                tuesday: 'Tue',
                wednesday: 'Wed',
                thursday: 'Thu',
                friday: 'Fri',
                saturday: 'Sat',
                sunday: 'Sun',
                low: 'Low',
                medium: 'Medium',
                high: 'High',
                veryHigh: 'Very high'
            },
            comparison: {
                title: 'Comparative analysis of models {period} {date}'
            },
            noData: 'No data to display. Please select another period or filters.',
            noDataPeriod: 'No data for selected period: {startDate} - {endDate}',
            applyToUpdate: 'Click "Apply" to update data for selected period.'
        }
    }
};