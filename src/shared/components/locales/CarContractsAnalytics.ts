// src/shared/components/locales/CarContractsAnalytics.ts
import { LocaleMessages } from "@/src/types/locale";

export const carContractsAnalyticsTranslations: LocaleMessages = {
    'ru': {
        title: 'Аналитика автомобилей',
        subtitle: 'Комплексный анализ данных по контрактам, продажам и остаткам',

        // Фильтры
        filters: {
            region: 'Регион',
            allRegions: 'Все регионы',
            model: 'Модель',
            allModels: 'Все модели',
            dateFrom: 'С',
            dateTo: 'По',
            apply: 'Применить',
            reset: 'Сбросить',
            activeFilters: 'Активные фильтры',
            resetFilters: 'Сбросить фильтры'
        },

        // Вкладки
        tabs: {
            contracts: 'Контракты',
            sales: 'Реализация',
            stock: 'Остаток',
            retail: 'Розница',
            wholesale: 'Оптовые',
            promotions: 'Акции'
        },

        // Статистические карточки
        stats: {
            totalContracts: 'Общее количество контрактов',
            totalSales: 'Общий объем продаж',
            totalStock: 'Общий остаток',
            totalRetail: 'Всего розничных продаж',
            totalWholesale: 'Всего оптовых продаж',
            totalPromotions: 'Всего акционных продаж',
            totalAmount: 'Общая сумма',
            periodData: 'За период',
            loading: 'Загрузка',
            noData: 'Нет данных'
        },

        // Модельный ряд
        modelRange: {
            title: 'Модельный ряд',
            viewModes: {
                cards: 'Плитка',
                list: 'Список'
            },
            sorting: {
                label: 'Сортировать',
                default: 'По умолчанию',
                priceHigh: 'По сумме (убывание)',
                priceLow: 'По сумме (возрастание)',
                contractsHigh: 'По количеству (убывание)',
                contractsLow: 'По количеству (возрастание)'
            },
            backToModels: 'Вернуться к модельному ряду',
            noModelsAvailable: 'Нет доступных моделей',
            selectPeriodMessage: 'Выберите период и нажмите "Применить"'
        },

        // Графики
        charts: {
            regionTitle: 'По регионам',
            modelTitle: 'По моделям',
            timelineTitle: 'Динамика',
            noData: 'Нет данных для отображения',
            loading: 'Загрузка данных...',
            yearComparison: 'Сравнение по годам',
            selectYear: 'Выберите год',
            currentMonth: 'Текущий месяц',
            futureMonth: 'Будущий период',
            dataNotAvailable: 'Данные еще не доступны'
        },

        // Возврат денежных средств
        moneyReturn: {
            title: 'Возврат денежных средств',
            subtitle: 'Отслеживание фактических и ожидаемых возвратов',
            financialAnalytics: 'Финансовая аналитика',
            analysisReturns: 'Анализ возвратов',
            regionData: 'Данные по региону',
            modelData: 'Модель',
            dynamicsTitle: 'Динамика возврата денежных средств',
            noDataPeriod: 'Нет данных о возврате для выбранного периода',
            loadError: 'Ошибка при загрузке данных о возврате',
            retryLoad: 'Повторить попытку',
            reloadData: 'Повторить запрос',
            currentMonthOnly: 'Данные доступны только по текущий месяц'
        },

        // Акции и промо
        promotions: {
            typesTitle: 'Типы акций',
            installmentOnixTracker: 'Рассрочка Onix & Tracker',
            employeeBenefits: 'Льготы для сотрудников',
            corporateProgram: 'Корпоративная программа',
            modelYear: 'Год выпуска',
            downPayment: 'Первоначальный взнос',
            installmentPeriod: 'Срок рассрочки',
            organization: 'Организация',
            model: 'Модель',
            months: 'месяцев'
        },

        // Информационная панель
        info: {
            title: 'Информация об аналитической панели',
            description: 'Эта панель показывает полную аналитику по контрактам, реализации, остаткам и типам продаж автомобилей. Используйте вкладки вверху для переключения между различными типами данных. Вы можете фильтровать данные по регионам и моделям используя соответствующие селекторы. При выборе конкретной модели отображается детальная статистика по модификациям и цветам.'
        },

        // Единицы измерения
        units: {
            pieces: 'шт.',
            currency: 'UZS',
            million: 'млн',
            thousand: 'тыс'
        },

        // Сообщения об ошибках
        errors: {
            loadingError: 'Ошибка при загрузке данных',
            noDataFound: 'Данные не найдены',
            tryAgain: 'Попробовать снова'
        }
    },
    'uz': {
        title: 'Avtomobil analitikasi',
        subtitle: 'Shartnomalar, savdolar va qoldiqlar bo\'yicha keng qamrovli tahlil',

        // Фильтры
        filters: {
            region: 'Viloyat',
            allRegions: 'Barcha viloyatlar',
            model: 'Model',
            allModels: 'Barcha modellar',
            dateFrom: 'Dan',
            dateTo: 'Gacha',
            apply: 'Qo\'llash',
            reset: 'Qayta o\'rnatish',
            activeFilters: 'Faol filtrlar',
            resetFilters: 'Filtrlarni qayta o\'rnatish'
        },

        // Вкладки
        tabs: {
            contracts: 'Shartnomalar',
            sales: 'Sotish',
            stock: 'Qoldiq',
            retail: 'Chakana',
            wholesale: 'Ulgurji',
            promotions: 'Aksiyalar'
        },

        // Статистические карточки
        stats: {
            totalContracts: 'Jami shartnomalar soni',
            totalSales: 'Jami savdo hajmi',
            totalStock: 'Jami qoldiq',
            totalRetail: 'Jami chakana savdo',
            totalWholesale: 'Jami ulgurji savdo',
            totalPromotions: 'Jami aksiya savdolari',
            totalAmount: 'Jami summa',
            periodData: 'Davr uchun',
            loading: 'Yuklanmoqda',
            noData: 'Ma\'lumot yo\'q'
        },

        // Модельный ряд
        modelRange: {
            title: 'Modellar qatori',
            viewModes: {
                cards: 'Kartalar',
                list: 'Ro\'yxat'
            },
            sorting: {
                label: 'Saralash',
                default: 'Standart',
                priceHigh: 'Summa bo\'yicha (kamayib)',
                priceLow: 'Summa bo\'yicha (ortib)',
                contractsHigh: 'Miqdor bo\'yicha (kamayib)',
                contractsLow: 'Miqdor bo\'yicha (ortib)'
            },
            backToModels: 'Modellar qatoriga qaytish',
            noModelsAvailable: 'Mavjud modellar yo\'q',
            selectPeriodMessage: 'Davrni tanlang va "Qo\'llash" tugmasini bosing'
        },

        // Графики
        charts: {
            regionTitle: 'Viloyatlar bo\'yicha',
            modelTitle: 'Modellar bo\'yicha',
            timelineTitle: 'Dinamika',
            noData: 'Ko\'rsatish uchun ma\'lumot yo\'q',
            loading: 'Ma\'lumotlar yuklanmoqda...',
            yearComparison: 'Yillar bo\'yicha solishtirish',
            selectYear: 'Yilni tanlang',
            currentMonth: 'Joriy oy',
            futureMonth: 'Kelajak davri',
            dataNotAvailable: 'Ma\'lumotlar hali mavjud emas'
        },

        // Возврат денежных средств
        moneyReturn: {
            title: 'Pul mablag\'larini qaytarish',
            subtitle: 'Haqiqiy va kutilayotgan qaytarishlarni kuzatish',
            financialAnalytics: 'Moliyaviy analitika',
            analysisReturns: 'Qaytarishlar tahlili',
            regionData: 'Viloyat bo\'yicha ma\'lumotlar',
            modelData: 'Model',
            dynamicsTitle: 'Pul mablag\'larini qaytarish dinamikasi',
            noDataPeriod: 'Tanlangan davr uchun qaytarish haqida ma\'lumot yo\'q',
            loadError: 'Qaytarish ma\'lumotlarini yuklashda xatolik',
            retryLoad: 'Qayta urinib ko\'ring',
            reloadData: 'So\'rovni takrorlash',
            currentMonthOnly: 'Ma\'lumotlar faqat joriy oygacha mavjud'
        },

        // Акции и промо
        promotions: {
            typesTitle: 'Aksiya turlari',
            installmentOnixTracker: 'Onix & Tracker bo\'lib to\'lash',
            employeeBenefits: 'Xodimlar uchun imtiyozlar',
            corporateProgram: 'Korporativ dastur',
            modelYear: 'Ishlab chiqarilgan yili',
            downPayment: 'Dastlabki to\'lov',
            installmentPeriod: 'Bo\'lib to\'lash muddati',
            organization: 'Tashkilot',
            model: 'Model',
            months: 'oy'
        },

        // Информационная панель
        info: {
            title: 'Analitik panel haqida ma\'lumot',
            description: 'Bu panel shartnomalar, savdolar, qoldiqlar va avtomobil savdolarining turlari bo\'yicha to\'liq analitikani ko\'rsatadi. Turli xil ma\'lumot turlari o\'rtasida almashtirish uchun yuqoridagi varaqlardan foydalaning. Mos ravishda selektorlardan foydalanib ma\'lumotlarni viloyatlar va modellar bo\'yicha filtrlashingiz mumkin. Aniq modelni tanlaganingizda, modifikatsiyalar va ranglar bo\'yicha batafsil statistika ko\'rsatiladi.'
        },

        // Единицы измерения
        units: {
            pieces: 'dona',
            currency: 'UZS',
            million: 'mln',
            thousand: 'ming'
        },

        // Сообщения об ошибках
        errors: {
            loadingError: 'Ma\'lumotlarni yuklashda xatolik',
            noDataFound: 'Ma\'lumotlar topilmadi',
            tryAgain: 'Qaytadan urinib ko\'ring'
        }
    }
};