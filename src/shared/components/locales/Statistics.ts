import { LocaleMessages } from "../../../types/locale";

export const statisticsTranslations: LocaleMessages = {
    'ru': {
        title: 'Интерактивная панель продаж автомобилей',
        subtitle: 'Исследуйте данные о продажах от моделей до отдельных продавцов',
        periodData: 'Данные за период: {{period}}',
        chartTypes: {
            bar: 'Столбцы',
            pie: 'Круговая'
        },
        datePeriods: {
            last7Days: '7 дней',
            last30Days: '30 дней',
            last3Months: '3 месяца',
            last6Months: '6 месяцев',
            last12Months: '12 месяцев',
            thisYear: 'Этот год',
            lastYear: 'Прошлый год',
            custom: 'Произвольный период'
        },
        dateRangeSelector: {
            title: 'Выберите период',
            startDate: 'Начало периода',
            endDate: 'Конец периода',
            cancel: 'Отмена',
            apply: 'Применить'
        },
        models: {
            title: 'Каталог моделей автомобилей',
            sales: 'Продажи',
            totalSales: 'Общие продажи по моделям',
            category: 'Категория',
            categories: {
                sedan: 'Седан',
                suv: 'Внедорожник',
                minivan: 'Минивэн',
                other: 'Другое'
            }
        },
        dealers: {
            title: 'Дилеры',
            count: 'Всего дилеров: {{count}}',
            avgSales: 'Средние продажи на дилера',
            totalSales: 'Всего продаж',
            backToModels: 'Вернуться к моделям',
            pagination: {
                prev: 'Назад',
                next: 'Вперед',
                page: 'Страница {{current}} из {{total}}'
            }
        },
        salespeople: {
            title: 'Продавцы',
            count: 'Всего продавцов: {{count}}',
            avgSales: 'Средние продажи на продавца',
            topTitle: 'Топ-{{count}} продавцов {{dealer}}',
            bestSalesperson: '🏆 Лучший продавец',
            showAll: 'Показать всех продавцов ({{count}} ещё)',
            showTop: 'Показать только топ-{{count}} продавцов',
            backToDealer: 'Вернуться к дилерам',
            backToModels: 'К списку моделей',
            globalTop: 'Топ-10 продавцов по всем дилерам',
            moreDealers: 'ещё {{count}}',
            rank: {
                first: '🥇 Абсолютный лидер',
                second: '🥈 #2',
                third: '🥉 #3',
                other: '#{{position}}'
            },
            salesByRegion: 'Продажи по дилерам и регионам'
        },
        payments: {
            title: 'Платежи и возвраты',
            status: {
                title: 'Статус платежей',
                in: 'в',
                paid: 'Оплачено полностью',
                returned: 'Возвращено',
                pending: 'Частичная оплата'
            },
            amounts: {
                title: 'Суммы платежей'
            },
            transactions: {
                title: 'Детализация транзакций ({{count}})',
                id: 'ID',
                car: 'Автомобиль',
                status: 'Статус',
                amount: 'Сумма (UZS)',
                paymentDate: 'Дата платежа',
                returnInfo: 'Возврат',
                balance: 'Баланс'
            }
        },
        charts: {
            modelSales: 'Продажи по моделям ({{period}})',
            modelShare: 'Доля рынка по моделям ({{period}})',
            modelTimeline: 'Динамика продаж по месяцам ({{period}})',
            dealerSales: 'Топ-20 дилеров {{model}} по продажам ({{period}})',
            dealerShare: 'Доля продаж {{model}} по топ-20 дилерам ({{period}})',
            dealerEfficiency: 'Эффективность топ-10 дилеров {{model}} (продажи на продавца)',
            salesPersonSales: 'Топ-15 продавцов {{model}} в {{dealer}} ({{period}})',
            salesPersonShare: 'Доля продаж {{model}} в {{dealer}} ({{period}})',
            salesTimeline: 'Динамика продаж топ-5 продавцов за период: {{period}}',
            instructions: 'Нажмите на элемент для просмотра продаж по дилерам',
            salesTrend: 'Тренд продаж за период: {{period}}',
            month: 'Месяц',
            sales: 'Количество продаж',
            clickDot: 'Нажмите на точку для подробной информации',
            noMonthlyData: 'Недостаточно данных для отображения динамики продаж',
            changeDateRange: 'Используйте другой диапазон дат или обновите данные'
        },
        status: {
            online: 'Онлайн'
        },
        loading: 'Загрузка данных...'
    },
    'uz': {
        title: 'Avtomobil savdosi interaktiv paneli',
        subtitle: 'Modellardan alohida sotuvchilargacha bo\'lgan savdo ma\'lumotlarini o\'rganing',
        periodData: 'Davr uchun ma\'lumotlar: {{period}}',
        chartTypes: {
            bar: 'Ustunlar',
            pie: 'Doiraviy'
        },
        datePeriods: {
            last7Days: '7 kun',
            last30Days: '30 kun',
            last3Months: '3 oy',
            last6Months: '6 oy',
            last12Months: '12 oy',
            thisYear: 'Joriy yil',
            lastYear: 'O\'tgan yil',
            custom: 'Maxsus davr'
        },
        dateRangeSelector: {
            title: 'Davrni tanlang',
            startDate: 'Boshlanish sanasi',
            endDate: 'Tugash sanasi',
            cancel: 'Bekor qilish',
            apply: 'Qo\'llash'
        },
        models: {
            title: 'Avtomobil modellari katalogi',
            sales: 'Savdo',
            totalSales: 'Modellar bo\'yicha umumiy savdolar',
            category: 'Kategoriya',
            categories: {
                suv: 'Yo\'l tanlamas',
                sedan: 'Sedan',
                minivan: 'Miniven',
                other: 'Boshqa'
            }
        },
        dealers: {
            title: 'Dilerlar',
            count: 'Jami dilerlar: {{count}}',
            avgSales: 'Diler boshiga o\'rtacha savdo',
            totalSales: 'Jami savdo',
            backToModels: 'Modellarga qaytish',
            pagination: {
                prev: 'Orqaga',
                next: 'Keyingi',
                page: 'Sahifa {{current}} / {{total}}'
            }
        },
        salespeople: {
            title: 'Sotuvchilar',
            count: 'Jami sotuvchilar: {{count}}',
            avgSales: 'Sotuvchi boshiga o\'rtacha savdo',
            topTitle: '{{dealer}} bo\'yicha top-{{count}} sotuvchilar',
            bestSalesperson: '🏆 Eng yaxshi sotuvchi',
            showAll: 'Barcha sotuvchilarni ko\'rsatish (yana {{count}})',
            showTop: 'Faqat top-{{count}} sotuvchilarni ko\'rsatish',
            backToDealer: 'Dilerlarga qaytish',
            backToModels: 'Modellar ro\'yxatiga',
            globalTop: 'Barcha dilerlar bo\'yicha top-10 sotuvchilar',
            moreDealers: 'yana {{count}}',
            rank: {
                first: '🥇 Mutlaq lider',
                second: '🥈 #2',
                third: '🥉 #3',
                other: '#{{position}}'
            },
            salesByRegion: 'Dilerlar va hududlar bo\'yicha savdo'
        },
        payments: {
            title: 'To\'lovlar va qaytarishlar',
            status: {
                title: 'To\'lovlar holati',
                in: 'da',
                paid: 'To\'liq to\'langan',
                returned: 'Qaytarilgan',
                pending: 'Qisman to\'lov'
            },
            amounts: {
                title: 'To\'lov miqdorlari'
            },
            transactions: {
                title: 'Tranzaksiyalar tafsiloti ({{count}})',
                id: 'ID',
                car: 'Avtomobil',
                status: 'Holat',
                amount: 'Summa (UZS)',
                paymentDate: 'To\'lov sanasi',
                returnInfo: 'Qaytarish',
                balance: 'Balans'
            }
        },
        charts: {
            modelSales: 'Modellar bo\'yicha savdo ({{period}})',
            modelShare: 'Modellar bo\'yicha bozor ulushi ({{period}})',
            modelTimeline: 'Oylar bo\'yicha savdo dinamikasi ({{period}})',
            dealerSales: '{{model}} bo\'yicha top-20 dilerlar savdosi ({{period}})',
            dealerShare: 'Top-20 dilerlar bo\'yicha {{model}} savdo ulushi ({{period}})',
            dealerEfficiency: '{{model}} bo\'yicha top-10 dilerlar samaradorligi (sotuvchi boshiga savdo)',
            salesPersonSales: '{{dealer}}dagi {{model}} bo\'yicha top-15 sotuvchilar ({{period}})',
            salesPersonShare: '{{dealer}}dagi {{model}} savdo ulushi ({{period}})',
            salesTimeline: 'Top-5 sotuvchilar savdo dinamikasi davr uchun: {{period}}',
            instructions: 'Dilerlar bo\'yicha savdoni ko\'rish uchun elementni bosing',
            salesTrend: 'Davr uchun savdo trendi: {{period}}',
            month: 'Oy',
            sales: 'Savdo miqdori',
            clickDot: 'Batafsil ma\'lumot uchun nuqtani bosing',
            noMonthlyData: 'Savdo dinamikasini ko\'rsatish uchun ma\'lumotlar yetarli emas',
            changeDateRange: 'Boshqa davr oralig\'ini tanlang yoki ma\'lumotlarni yangilang'
        },
        status: {
            online: 'Onlayn'
        },
        loading: 'Ma\'lumotlar yuklanmoqda...'
    },
    'en': {
        title: 'Interactive Car Sales Dashboard',
        subtitle: 'Explore sales data from models to individual salespeople',
        periodData: 'Data for period: {{period}}',
        chartTypes: {
            bar: 'Bar',
            pie: 'Pie'
        },
        datePeriods: {
            last7Days: '7 days',
            last30Days: '30 days',
            last3Months: '3 months',
            last6Months: '6 months',
            last12Months: '12 months',
            thisYear: 'This year',
            lastYear: 'Last year',
            custom: 'Custom period'
        },
        dateRangeSelector: {
            title: 'Select period',
            startDate: 'Start date',
            endDate: 'End date',
            cancel: 'Cancel',
            apply: 'Apply'
        },
        models: {
            title: 'Car Model Catalog',
            sales: 'Sales',
            totalSales: 'Total sales by models',
            category: 'Category',
            categories: {
                sedan: 'Sedan',
                suv: 'SUV',
                minivan: 'Minivan',
                other: 'Other'
            }
        },
        dealers: {
            title: 'Dealers',
            count: 'Total dealers: {{count}}',
            avgSales: 'Average sales per dealer',
            totalSales: 'Total sales',
            backToModels: 'Back to models',
            pagination: {
                prev: 'Previous',
                next: 'Next',
                page: 'Page {{current}} of {{total}}'
            }
        },
        salespeople: {
            title: 'Salespeople',
            count: 'Total salespeople: {{count}}',
            avgSales: 'Average sales per salesperson',
            topTitle: 'Top {{count}} salespeople at {{dealer}}',
            bestSalesperson: '🏆 Best salesperson',
            showAll: 'Show all salespeople ({{count}} more)',
            showTop: 'Show only top {{count}} salespeople',
            backToDealer: 'Back to dealers',
            backToModels: 'Back to models',
            globalTop: 'Top 10 salespeople across all dealers',
            moreDealers: '{{count}} more',
            rank: {
                first: '🥇 Absolute leader',
                second: '🥈 #2',
                third: '🥉 #3',
                other: '#{{position}}'
            },
            salesByRegion: 'Sales by dealers and regions'
        },
        payments: {
            title: 'Payments and Returns',
            status: {
                title: 'Payment Status',
                in: 'in',
                paid: 'Fully paid',
                returned: 'Returned',
                pending: 'Partial payment'
            },
            amounts: {
                title: 'Payment Amounts'
            },
            transactions: {
                title: 'Transaction Details ({{count}})',
                id: 'ID',
                car: 'Car',
                status: 'Status',
                amount: 'Amount (UZS)',
                paymentDate: 'Payment Date',
                returnInfo: 'Return',
                balance: 'Balance'
            }
        },
        charts: {
            modelSales: 'Sales by models ({{period}})',
            modelShare: 'Market share by models ({{period}})',
            modelTimeline: 'Monthly sales dynamics ({{period}})',
            dealerSales: 'Top 20 {{model}} dealers by sales ({{period}})',
            dealerShare: '{{model}} sales share by top 20 dealers ({{period}})',
            dealerEfficiency: 'Top 10 {{model}} dealers efficiency (sales per salesperson)',
            salesPersonSales: 'Top 15 {{model}} salespeople at {{dealer}} ({{period}})',
            salesPersonShare: '{{model}} sales share at {{dealer}} ({{period}})',
            salesTimeline: 'Top 5 salespeople sales dynamics for period: {{period}}',
            instructions: 'Click on element to view sales by dealers',
            salesTrend: 'Sales trend for period: {{period}}',
            month: 'Month',
            sales: 'Sales amount',
            clickDot: 'Click on dot for detailed information',
            noMonthlyData: 'Insufficient data to display sales dynamics',
            changeDateRange: 'Use different date range or update data'
        },
        status: {
            online: 'Online'
        },
        loading: 'Loading data...'
    }
};