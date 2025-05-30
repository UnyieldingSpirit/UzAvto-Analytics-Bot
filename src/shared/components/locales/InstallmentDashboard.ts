import { LocaleMessages } from "../../../types/locale";

export const installmentDashboardTranslations: LocaleMessages = {
    'ru': {
        title: 'Таблица рассрочки',
        metrics: {
            contracts: 'Количество рассрочек',
            activeContracts: 'Активных договоров',
            paymentStatus: 'Процент оплаты',
            overdue: 'Просрочка платежей',
            fullPrice: 'Полная цена',
            remainder: 'Остаток',
            paid: 'Оплачено',
            overduePay: 'Просрочено',
            remaining: 'Остаток',
            totalContracts: 'Всего заказов',
            avgPrice: 'Средняя стоимость',
            outOf: 'из',
            total: 'Всего'
        },
        views: {
            byRegion: 'По регионам',
            byModel: 'По моделям',
            region: 'Регион',
            model: 'Модель',
            allRegions: 'Все регионы',
            unknownRegion: 'Неизвестный регион'
        },
        charts: {
            paymentDistribution: 'Распределение платежей',
            paymentsProgress: 'Прогресс оплаты',
            topModels: 'Топ моделей по количеству рассрочек',
            topRegions: 'Топ регионов по количеству рассрочек',
            paymentDynamics: 'Динамика платежей'
        },
        modelDetails: {
            detailedInfo: 'Детальная информация',
            category: 'Категория',
            categories: {
                sedan: 'Седан',
                suv: 'Внедорожник',
                minivan: 'Минивэн',
                other: 'Другое'
            },
            data: 'Данные по региону',
            totalInInstallment: 'Всего в рассрочке',
            fullPrice: 'Полная стоимость',
            compareByRegions: 'Сравнить по регионам',
            hideRegionComparison: 'Скрыть сравнение по регионам',
            backToList: 'К списку моделей',
            carCatalog: 'Модели автомобилей в рассрочке'
        },
        table: {
            region: 'Регион',
            count: 'Количество',
            paidPercent: 'Оплачено (%)',
            overduePercent: 'Просрочено (%)',
            remainingAmount: 'Сумма остатка'
        },
        units: {
            pieces: 'шт.',
            currency: 'UZS',
            trillion: 'трлн',
            billion: 'млрд',
            million: 'млн',
            thousand: 'тыс'
        },
        noData: 'Нет данных для отображения',
        clickToViewDetails: 'Нажмите на модель для подробной информации'
    },
    'uz': {
        title: 'Bo\'lib to\'lash jadvali',
        metrics: {
            contracts: 'Bo\'lib to\'lash soni',
            activeContracts: 'Faol shartnomalar',
            paymentStatus: 'To\'lov foizi',
            overdue: 'Kechiktirilgan to\'lovlar',
            fullPrice: 'To\'liq narx',
            remainder: 'Qoldiq',
            paid: 'To\'langan',
            overduePay: 'Kechiktirilgan',
            remaining: 'Qoldiq',
            totalContracts: 'Jami buyurtmalar',
            avgPrice: 'O\'rtacha qiymat',
            outOf: 'dan',
            total: 'Jami'
        },
        views: {
            byRegion: 'Viloyatlar bo\'yicha',
            byModel: 'Modellar bo\'yicha',
            region: 'Viloyat',
            model: 'Model',
            allRegions: 'Barcha viloyatlar',
            unknownRegion: 'Noma\'lum viloyat'
        },
        charts: {
            paymentDistribution: 'To\'lovlar taqsimoti',
            paymentsProgress: 'To\'lov jarayoni',
            topModels: 'Bo\'lib to\'lash soni bo\'yicha top modellar',
            topRegions: 'Bo\'lib to\'lash soni bo\'yicha top viloyatlar',
            paymentDynamics: 'To\'lovlar dinamikasi'
        },
        modelDetails: {
            detailedInfo: 'Batafsil ma\'lumot',
            category: 'Kategoriya',
            categories: {
                suv: 'Yo\'l tanlamas',
                sedan: 'Sedan',
                minivan: 'Miniven',
                other: 'Boshqa'
            },
            data: 'Viloyat bo\'yicha ma\'lumotlar',
            totalInInstallment: 'Jami bo\'lib to\'lashda',
            fullPrice: 'To\'liq qiymati',
            compareByRegions: 'Viloyatlar bo\'yicha solishtirish',
            hideRegionComparison: 'Viloyatlar bo\'yicha solishtirishni yashirish',
            backToList: 'Modellar ro\'yxatiga',
            carCatalog: 'Bo\'lib to\'lashdagi avtomobil modellari'
        },
        table: {
            region: 'Viloyat',
            count: 'Soni',
            paidPercent: 'To\'langan (%)',
            overduePercent: 'Kechiktirilgan (%)',
            remainingAmount: 'Qoldiq summa'
        },
        units: {
            pieces: 'dona',
            currency: 'UZS',
            trillion: 'trln',
            billion: 'mlrd',
            million: 'mln',
            thousand: 'ming'
        },
        noData: 'Ko\'rsatish uchun ma\'lumot yo\'q',
        clickToViewDetails: 'Batafsil ma\'lumot uchun modelni bosing'
    },
    'en': {
        title: 'Installment Table',
        metrics: {
            contracts: 'Number of installments',
            activeContracts: 'Active contracts',
            paymentStatus: 'Payment percentage',
            overdue: 'Overdue payments',
            fullPrice: 'Full price',
            remainder: 'Remainder',
            paid: 'Paid',
            overduePay: 'Overdue',
            remaining: 'Remaining',
            totalContracts: 'Total orders',
            avgPrice: 'Average price',
            outOf: 'out of',
            total: 'Total'
        },
        views: {
            byRegion: 'By regions',
            byModel: 'By models',
            region: 'Region',
            model: 'Model',
            allRegions: 'All regions',
            unknownRegion: 'Unknown region'
        },
        charts: {
            paymentDistribution: 'Payment distribution',
            paymentsProgress: 'Payment progress',
            topModels: 'Top models by installment count',
            topRegions: 'Top regions by installment count',
            paymentDynamics: 'Payment dynamics'
        },
        modelDetails: {
            detailedInfo: 'Detailed information',
            category: 'Category',
            categories: {
                sedan: 'Sedan',
                suv: 'SUV',
                minivan: 'Minivan',
                other: 'Other'
            },
            data: 'Regional data',
            totalInInstallment: 'Total in installment',
            fullPrice: 'Full price',
            compareByRegions: 'Compare by regions',
            hideRegionComparison: 'Hide regional comparison',
            backToList: 'Back to model list',
            carCatalog: 'Car models in installment'
        },
        table: {
            region: 'Region',
            count: 'Count',
            paidPercent: 'Paid (%)',
            overduePercent: 'Overdue (%)',
            remainingAmount: 'Remaining amount'
        },
        units: {
            pieces: 'pcs',
            currency: 'UZS',
            trillion: 'T',
            billion: 'B',
            million: 'M',
            thousand: 'K'
        },
        noData: 'No data to display',
        clickToViewDetails: 'Click on model for detailed information'
    }
};