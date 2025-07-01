import { LocaleMessages } from "../../../types/locale";

export const carContractsAnalyticsTranslations: LocaleMessages = {
    'ru': {
        // Заголовки
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
            resetFilters: 'Сбросить фильтры',
            selectDate: 'Пожалуйста, выберите период дат'
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
            periodData: 'За период с {{startDate}} по {{endDate}}',
            loading: 'Загрузка',
            noData: 'Нет данных',
            inRegion: 'в {{regionName}}',
            forModel: 'для {{modelName}}'
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
            selectPeriodMessage: 'Выберите период и нажмите "Применить"',
            contracts: 'Контрактов',
            sales: 'Продаж',
            inStock: 'В наличии',
            retail: 'Розница',
            wholesale: 'Опт',
            promotions: 'По акции',
            totalAmount: 'Общая сумма',
            auto: 'Авто'
        },

        // Графики
        charts: {
            regionTitle: '{{metric}} по регионам',
            modelTitle: '{{metric}} по моделям',
            timelineTitle: 'Динамика {{metric}}',
            modelRegionTitle: '{{metric}} {{modelName}} по регионам',
            regionModelTitle: '{{metric}} в {{regionName}} по моделям',
            modelDetailsTitle: '{{metric}} {{modelName}} по модификациям и цветам',
            noData: 'Нет данных для отображения',
            noDataAfterFilter: 'Нет данных для отображения после фильтрации',
            loading: 'Загрузка данных...',
            yearComparison: 'Сравнение по годам',
            selectYear: 'Выберите год',
            currentMonth: 'Текущий месяц',
            futureMonth: 'Будущий период',
            dataNotAvailable: 'Данные еще не доступны',
            retryLoad: 'Загрузить данные',
            monthData: {
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
            tooltips: {
                contracts: 'Контракты',
                sales: 'Продажи',
                stock: 'Остаток',
                retail: 'Розница',
                wholesale: 'Опт',
                promotions: 'Акции',
                amount: 'Сумма',
                selected: 'Выбрано'
            }
        },

        // Возврат денежных средств
        moneyReturn: {
            title: 'Возврат контрактов',
            subtitle: 'Отслеживание фактических и ожидаемых возвратов контрактов',
            financialAnalytics: 'Аналитика контрактов',
            analysisReturns: 'Анализ возвратов',
            regionLabel: 'Регион',
            modelLabel: 'Модель',
            dynamicsTitle: 'Динамика возврата контрактов {{year}}',
            noDataPeriod: 'Нет данных о возврате контрактов для выбранного периода',
            loadError: 'Ошибка при загрузке данных о возврате',
            retryLoad: 'Повторить попытку',
            reloadData: 'Повторить запрос',
            currentMonthOnly: '* Данные доступны только по текущий месяц',
            returnContracts: 'Количество возвратов' // Изменено с returnAmount
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
            months: 'месяцев',
            effectiveness: 'Эффективность акций',
            viewsConversion: 'Конверсия просмотров в продажи',
            averageDiscount: 'Средняя скидка',
            promotionsROI: 'ROI акций'
        },

        // Сравнение по годам
        yearComparison: {
            title: 'Сравнительный анализ {{metric}} по годам',
            subtitle: 'Визуализация динамики изменений за несколько лет',
            totalForYear: 'Всего {{metric}} за {{year}} год',
            growth: 'Рост',
            decline: 'Снижение',
            comparedTo: 'по сравнению с {{year}}',
            noChange: 'Без изменений',
            selectYears: 'Выберите годы для сравнения',
            year2023: '2023',
            year2024: '2024',
            year2025: '2025'
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
            million: 'M',
            thousand: 'K'
        },

        // Сообщения об ошибках
        errors: {
            loadingError: 'Ошибка при загрузке данных',
            noDataFound: 'Данные не найдены',
            tryAgain: 'Попробовать снова',
            incorrectFormat: 'Некорректный формат данных',
            continueWithTestData: 'Продолжаем с использованием тестовых данных'
        }
    },
    'uz': {
        // Заголовки
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
            resetFilters: 'Filtrlarni qayta o\'rnatish',
            selectDate: 'Iltimos, davrni tanlang'
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
            periodData: '{{startDate}} dan {{endDate}} gacha davr uchun',
            loading: 'Yuklanmoqda',
            noData: 'Ma\'lumot yo\'q',
            inRegion: '{{regionName}} da',
            forModel: '{{modelName}} uchun'
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
            selectPeriodMessage: 'Davrni tanlang va "Qo\'llash" tugmasini bosing',
            contracts: 'Shartnomalar',
            sales: 'Savdo',
            inStock: 'Mavjud',
            retail: 'Chakana',
            wholesale: 'Ulgurji',
            promotions: 'Aksiya',
            totalAmount: 'Jami summa',
            auto: 'Avto'
        },

        // Графики
        charts: {
            regionTitle: 'Viloyatlar bo\'yicha {{metric}}',
            modelTitle: 'Modellar bo\'yicha {{metric}}',
            timelineTitle: '{{metric}} dinamikasi',
            modelRegionTitle: '{{modelName}} {{metric}} viloyatlar bo\'yicha',
            regionModelTitle: '{{regionName}} da {{metric}} modellar bo\'yicha',
            modelDetailsTitle: '{{modelName}} {{metric}} modifikatsiyalar va ranglar bo\'yicha',
            noData: 'Ko\'rsatish uchun ma\'lumot yo\'q',
            noDataAfterFilter: 'Filtrlashdan keyin ko\'rsatish uchun ma\'lumot yo\'q',
            loading: 'Ma\'lumotlar yuklanmoqda...',
            yearComparison: 'Yillar bo\'yicha solishtirish',
            selectYear: 'Yilni tanlang',
            currentMonth: 'Joriy oy',
            futureMonth: 'Kelajak davri',
            dataNotAvailable: 'Ma\'lumotlar hali mavjud emas',
            retryLoad: 'Ma\'lumotlarni yuklash',
            monthData: {
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
            tooltips: {
                contracts: 'Shartnomalar',
                sales: 'Savdolar',
                stock: 'Qoldiq',
                retail: 'Chakana',
                wholesale: 'Ulgurji',
                promotions: 'Aksiyalar',
                amount: 'Summa',
                selected: 'Tanlangan'
            }
        },

        // Возврат денежных средств
        moneyReturn: {
            title: 'Shartnomalarni qaytarish',
            subtitle: 'Haqiqiy va kutilayotgan shartnoma qaytarishlarini kuzatish',
            financialAnalytics: 'Shartnomalar analitikasi',
            analysisReturns: 'Qaytarishlar tahlili',
            regionLabel: 'Viloyat',
            modelLabel: 'Model',
            dynamicsTitle: 'Shartnomalarni qaytarish dinamikasi {{year}}',
            noDataPeriod: 'Tanlangan davr uchun shartnoma qaytarishlari haqida ma\'lumot yo\'q',
            loadError: 'Qaytarish ma\'lumotlarini yuklashda xatolik',
            retryLoad: 'Qayta urinib ko\'ring',
            reloadData: 'So\'rovni takrorlash',
            currentMonthOnly: '* Ma\'lumotlar faqat joriy oygacha mavjud',
            returnAmount: 'Qaytarishlar soni'
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
            months: 'oy',
            effectiveness: 'Aksiyalar samaradorligi',
            viewsConversion: 'Ko\'rishlarni savdoga aylantirish',
            averageDiscount: 'O\'rtacha chegirma',
            promotionsROI: 'Aksiyalar ROI'
        },

        // Сравнение по годам
        yearComparison: {
            title: 'Yillar bo\'yicha {{metric}} qiyosiy tahlili',
            subtitle: 'Bir necha yil davomidagi o\'zgarishlar dinamikasini vizualizatsiya qilish',
            totalForYear: '{{year}} yil uchun jami {{metric}}',
            growth: 'O\'sish',
            decline: 'Pasayish',
            comparedTo: '{{year}} ga nisbatan',
            noChange: 'O\'zgarishsiz',
            selectYears: 'Solishtirish uchun yillarni tanlang',
            year2023: '2023',
            year2024: '2024',
            year2025: '2025'
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
            million: 'M',
            thousand: 'K'
        },

        // Сообщения об ошибках
        errors: {
            loadingError: 'Ma\'lumotlarni yuklashda xatolik',
            noDataFound: 'Ma\'lumotlar topilmadi',
            tryAgain: 'Qaytadan urinib ko\'ring',
            incorrectFormat: 'Noto\'g\'ri ma\'lumotlar formati',
            continueWithTestData: 'Test ma\'lumotlari bilan davom etamiz'
        }
    },
    'en': {
        // Заголовки
        title: 'Car Analytics',
        subtitle: 'Comprehensive analysis of contracts, sales and inventory data',

        // Фильтры
        filters: {
            region: 'Region',
            allRegions: 'All regions',
            model: 'Model',
            allModels: 'All models',
            dateFrom: 'From',
            dateTo: 'To',
            apply: 'Apply',
            reset: 'Reset',
            activeFilters: 'Active filters',
            resetFilters: 'Reset filters',
            selectDate: 'Please select date period'
        },

        // Вкладки
        tabs: {
            contracts: 'Contracts',
            sales: 'Sales',
            stock: 'Stock',
            retail: 'Retail',
            wholesale: 'Wholesale',
            promotions: 'Promotions'
        },

        // Статистические карточки
        stats: {
            totalContracts: 'Total contracts',
            totalSales: 'Total sales volume',
            totalStock: 'Total stock',
            totalRetail: 'Total retail sales',
            totalWholesale: 'Total wholesale sales',
            totalPromotions: 'Total promotional sales',
            totalAmount: 'Total amount',
            periodData: 'For period from {{startDate}} to {{endDate}}',
            loading: 'Loading',
            noData: 'No data',
            inRegion: 'in {{regionName}}',
            forModel: 'for {{modelName}}'
        },

        // Модельный ряд
        modelRange: {
            title: 'Model Range',
            viewModes: {
                cards: 'Cards',
                list: 'List'
            },
            sorting: {
                label: 'Sort',
                default: 'Default',
                priceHigh: 'By amount (high to low)',
                priceLow: 'By amount (low to high)',
                contractsHigh: 'By quantity (high to low)',
                contractsLow: 'By quantity (low to high)'
            },
            backToModels: 'Back to model range',
            noModelsAvailable: 'No models available',
            selectPeriodMessage: 'Select period and click "Apply"',
            contracts: 'Contracts',
            sales: 'Sales',
            inStock: 'In stock',
            retail: 'Retail',
            wholesale: 'Wholesale',
            promotions: 'Promotional',
            totalAmount: 'Total amount',
            auto: 'Car'
        },

        // Графики
        charts: {
            regionTitle: '{{metric}} by regions',
            modelTitle: '{{metric}} by models',
            timelineTitle: '{{metric}} timeline',
            modelRegionTitle: '{{metric}} {{modelName}} by regions',
            regionModelTitle: '{{metric}} in {{regionName}} by models',
            modelDetailsTitle: '{{metric}} {{modelName}} by modifications and colors',
            noData: 'No data to display',
            noDataAfterFilter: 'No data to display after filtering',
            loading: 'Loading data...',
            yearComparison: 'Year comparison',
            selectYear: 'Select year',
            currentMonth: 'Current month',
            futureMonth: 'Future period',
            dataNotAvailable: 'Data not yet available',
            retryLoad: 'Load data',
            monthData: {
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
            tooltips: {
                contracts: 'Contracts',
                sales: 'Sales',
                stock: 'Stock',
                retail: 'Retail',
                wholesale: 'Wholesale',
                promotions: 'Promotions',
                amount: 'Amount',
                selected: 'Selected'
            }
        },

        // Возврат денежных средств
        moneyReturn: {
            title: 'Contract Returns',
            subtitle: 'Tracking actual and expected contract returns',
            financialAnalytics: 'Contract Analytics',
            analysisReturns: 'Returns Analysis',
            regionLabel: 'Region',
            modelLabel: 'Model',
            dynamicsTitle: 'Contract returns dynamics {{year}}',
            noDataPeriod: 'No contract return data for selected period',
            loadError: 'Error loading return data',
            retryLoad: 'Try again',
            reloadData: 'Retry request',
            currentMonthOnly: '* Data available only up to current month',
            returnAmount: 'Returns count'
        },

        // Акции и промо
        promotions: {
            typesTitle: 'Promotion Types',
            installmentOnixTracker: 'Onix & Tracker Installment',
            employeeBenefits: 'Employee Benefits',
            corporateProgram: 'Corporate Program',
            modelYear: 'Model Year',
            downPayment: 'Down Payment',
            installmentPeriod: 'Installment Period',
            organization: 'Organization',
            model: 'Model',
            months: 'months',
            effectiveness: 'Promotions Effectiveness',
            viewsConversion: 'Views to Sales Conversion',
            averageDiscount: 'Average Discount',
            promotionsROI: 'Promotions ROI'
        },

        // Сравнение по годам
        yearComparison: {
            title: 'Comparative analysis of {{metric}} by years',
            subtitle: 'Visualization of changes dynamics over several years',
            totalForYear: 'Total {{metric}} for {{year}}',
            growth: 'Growth',
            decline: 'Decline',
            comparedTo: 'compared to {{year}}',
            noChange: 'No change',
            selectYears: 'Select years to compare',
            year2023: '2023',
            year2024: '2024',
            year2025: '2025'
        },

        // Информационная панель
        info: {
            title: 'About Analytics Dashboard',
            description: 'This dashboard shows complete analytics on contracts, sales, inventory and car sales types. Use the tabs at the top to switch between different data types. You can filter data by regions and models using the appropriate selectors. When selecting a specific model, detailed statistics by modifications and colors are displayed.'
        },

        // Единицы измерения
        units: {
            pieces: 'pcs',
            currency: 'UZS',
            million: 'M',
            thousand: 'K'
        },

        // Сообщения об ошибках
        errors: {
            loadingError: 'Error loading data',
            noDataFound: 'Data not found',
            tryAgain: 'Try again',
            incorrectFormat: 'Incorrect data format',
            continueWithTestData: 'Continuing with test data'
        }
    }
};