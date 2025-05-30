import { LocaleMessages } from "../../../types/locale";

export const contractsYearlyComparisonTranslations: LocaleMessages = {
    'ru': {
        // Месяцы
        months: {
            january: 'Янв',
            february: 'Фев',
            march: 'Мар',
            april: 'Апр',
            may: 'Май',
            june: 'Июн',
            july: 'Июл',
            august: 'Авг',
            september: 'Сен',
            october: 'Окт',
            november: 'Ноя',
            december: 'Дек'
        },

        // Ошибки
        errors: {
            loadDataError: 'Не удалось загрузить данные для сравнения',
            generalError: 'Ошибка при загрузке данных',
            loadingDataError: 'Ошибка при загрузке данных для сравнения:'
        },

        // Метрики
        metrics: {
            contracts: 'Контракты',
            sales: 'Продажи',
            stock: 'Остаток',
            retail: 'Розничные продажи',
            wholesale: 'Оптовые продажи',
            promotions: 'Акционные продажи'
        },

        // UI элементы
        ui: {
            currentMonth: 'Текущий месяц',
            year: 'год',
            retryButton: 'Загрузить данные'
        },

        // Консольные сообщения
        console: {
            requestData: 'Запрос данных для сравнения {{year}} года:',
            errorLoadingYear: 'Ошибка при запросе данных за {{year}} год:',
            dateFormatError: 'Ошибка форматирования даты:'
        }
    },
    'uz': {
        // Месяцы
        months: {
            january: 'Yan',
            february: 'Fev',
            march: 'Mar',
            april: 'Apr',
            may: 'May',
            june: 'Iyn',
            july: 'Iyl',
            august: 'Avg',
            september: 'Sen',
            october: 'Okt',
            november: 'Noy',
            december: 'Dek'
        },

        // Ошибки
        errors: {
            loadDataError: 'Taqqoslash uchun ma\'lumotlarni yuklab bo\'lmadi',
            generalError: 'Ma\'lumotlarni yuklashda xatolik',
            loadingDataError: 'Taqqoslash ma\'lumotlarini yuklashda xatolik:'
        },

        // Метрики
        metrics: {
            contracts: 'Shartnomalar',
            sales: 'Savdolar',
            stock: 'Qoldiq',
            retail: 'Chakana savdo',
            wholesale: 'Ulgurji savdo',
            promotions: 'Aksiya savdolari'
        },

        // UI элементы
        ui: {
            currentMonth: 'Joriy oy',
            year: 'yil',
            retryButton: 'Ma\'lumotlarni yuklash'
        },

        // Консольные сообщения
        console: {
            requestData: '{{year}} yil uchun taqqoslash ma\'lumotlari so\'rovi:',
            errorLoadingYear: '{{year}} yil ma\'lumotlarini so\'rashda xatolik:',
            dateFormatError: 'Sanani formatlashda xatolik:'
        }
    },
    'en': {
        // Месяцы
        months: {
            january: 'Jan',
            february: 'Feb',
            march: 'Mar',
            april: 'Apr',
            may: 'May',
            june: 'Jun',
            july: 'Jul',
            august: 'Aug',
            september: 'Sep',
            october: 'Oct',
            november: 'Nov',
            december: 'Dec'
        },

        // Ошибки
        errors: {
            loadDataError: 'Failed to load comparison data',
            generalError: 'Error loading data',
            loadingDataError: 'Error loading comparison data:'
        },

        // Метрики
        metrics: {
            contracts: 'Contracts',
            sales: 'Sales',
            stock: 'Stock',
            retail: 'Retail sales',
            wholesale: 'Wholesale sales',
            promotions: 'Promotional sales'
        },

        // UI элементы
        ui: {
            currentMonth: 'Current month',
            year: 'year',
            retryButton: 'Load data'
        },

        // Консольные сообщения
        console: {
            requestData: 'Requesting comparison data for {{year}}:',
            errorLoadingYear: 'Error requesting data for {{year}}:',
            dateFormatError: 'Date formatting error:'
        }
    }
};