import { LocaleMessages } from "../../../types/locale";

export const dashboardTranslations: LocaleMessages = {
    'ru': {
        title: 'Мониторинг продаж автомобилей',
        titleWithModel: 'Мониторинг продаж: {{modelName}}',
        dealerCenter: 'Дилерский центр',
        region: 'Регион',
        carsStatus: 'Статус автомобилей',
        notShipped: {
            title: 'Не отгружены 48ч',
            shortTitle: 'Не отгружено >48ч'
        },
        inTransit: {
            title: 'В пути 3 дней',
            shortTitle: 'В пути >3 дней'
        },
        delivered: 'Доставлено',
        frozenContracts: 'Замороженые контракты',
        total: 'Общее количество',
        table: {
            modelName: 'Название модели',
            image: 'Изображение',
            quantity: 'Количество',
            status: 'Статус',
            total: 'Итого',
            noData: 'Нет данных для отображения',
            days: 'дней',
            day: 'день',
            days2to4: 'дня',
            allDays: 'Все > 5 дней'
        },
        sidebar: {
            totalRegions: 'Всего регионов',
            selectRegion: 'Выберите регион для детализации',
            dealers: 'Дилеров',
            model: 'модель',
            models2to4: 'модели',
            models: 'моделей',
            dealersList: 'Список дилеров в регионе'
        },
        unknown: {
            region: 'Неизвестный регион',
            dealer: 'Неизвестный дилер',
            model: 'Неизвестная модель'
        },
        car: 'Авто',
        dealer: {
            totalCars: 'Всего автомобилей',
            units: 'шт.',
            modelDistribution: 'Распределение по моделям'
        },
        dealers: {
            central: 'Центральный автосалон',
            premium: 'Премиум Авто',
            maximum: 'Максимум Моторс',
            samarkand: 'Самарканд Авто',
            autoSamarkand: 'АвтоСамарканд',
            samarkandMotors: 'Самарканд Моторс',
            bukhara: 'Бухара Авто',
            bukharaGM: 'Бухара GM'
        },
        status: {
            critical: 'критический',
            medium: 'средний',
            online: 'Онлайн'
        },
        logs: {
            dataLoaded: 'Данные успешно загружены',
            dataLoadError: 'Ошибка при загрузке данных:',
            modelDataLoaded: 'Данные по модели загружены:',
            modelDataLoadError: 'Ошибка при загрузке данных по модели:'
        }
    },
    'uz': {
        title: 'Avtomobil savdosi monitoringi',
        titleWithModel: 'Savdo monitoringi: {{modelName}}',
        dealerCenter: 'Dilerlik markazi',
        region: 'Viloyat',
        carsStatus: 'Avtomobillar holati',
        notShipped: {
            title: '48 soat jo\'natilmagan',
            shortTitle: '>48 soat jo\'natilmagan'
        },
        inTransit: {
            title: '3 kun yo\'lda',
            shortTitle: '>3 kun yo\'lda'
        },
        delivered: 'Yetkazilgan',
        frozenContracts: 'Muzlatilgan shartnomalar',
        total: 'Umumiy miqdor',
        table: {
            modelName: 'Model nomi',
            image: 'Rasm',
            quantity: 'Miqdor',
            status: 'Holat',
            total: 'Jami',
            noData: 'Ko\'rsatish uchun ma\'lumot yo\'q',
            days: 'kun',
            day: 'kun',
            days2to4: 'kun',
            allDays: 'Barchasi > 5 kun'
        },
        sidebar: {
            totalRegions: 'Jami viloyatlar',
            selectRegion: 'Tafsilotlar uchun hududni tanlang',
            dealers: 'Dilerlar',
            model: 'model',
            models2to4: 'modellar',
            models: 'modellar',
            dealersList: 'Hududdagi dilerlar ro\'yxati'
        },
        unknown: {
            region: 'Noma\'lum hudud',
            dealer: 'Noma\'lum diler',
            model: 'Noma\'lum model'
        },
        car: 'Avto',
        dealer: {
            totalCars: 'Jami avtomobillar',
            units: 'dona',
            modelDistribution: 'Modellar bo\'yicha taqsimot'
        },
        dealers: {
            central: 'Markaziy avtosalon',
            premium: 'Premium Avto',
            maximum: 'Maksimum Motors',
            samarkand: 'Samarqand Avto',
            autoSamarkand: 'AvtoSamarqand',
            samarkandMotors: 'Samarqand Motors',
            bukhara: 'Buxoro Avto',
            bukharaGM: 'Buxoro GM'
        },
        status: {
            critical: 'kritik',
            medium: 'o\'rta',
            online: 'Onlayn'
        },
        logs: {
            dataLoaded: 'Ma\'lumotlar muvaffaqiyatli yuklandi',
            dataLoadError: 'Ma\'lumotlarni yuklashda xatolik:',
            modelDataLoaded: 'Model ma\'lumotlari yuklandi:',
            modelDataLoadError: 'Model ma\'lumotlarini yuklashda xatolik:'
        }
    },
    'en': {
        title: 'Car Sales Monitoring',
        titleWithModel: 'Sales Monitoring: {{modelName}}',
        dealerCenter: 'Dealer Center',
        region: 'Region',
        carsStatus: 'Cars Status',
        notShipped: {
            title: 'Not shipped 48h',
            shortTitle: 'Not shipped >48h'
        },
        inTransit: {
            title: 'In transit 3 days',
            shortTitle: 'In transit >3 days'
        },
        delivered: 'Delivered',
        frozenContracts: 'Frozen contracts',
        total: 'Total amount',
        table: {
            modelName: 'Model name',
            image: 'Image',
            quantity: 'Quantity',
            status: 'Status',
            total: 'Total',
            noData: 'No data to display',
            days: 'days',
            day: 'day',
            days2to4: 'days',
            allDays: 'All > 5 days'
        },
        sidebar: {
            totalRegions: 'Total regions',
            selectRegion: 'Select region for details',
            dealers: 'Dealers',
            model: 'model',
            models2to4: 'models',
            models: 'models',
            dealersList: 'List of dealers in region'
        },
        unknown: {
            region: 'Unknown region',
            dealer: 'Unknown dealer',
            model: 'Unknown model'
        },
        car: 'Car',
        dealer: {
            totalCars: 'Total cars',
            units: 'pcs',
            modelDistribution: 'Model distribution'
        },
        dealers: {
            central: 'Central Dealership',
            premium: 'Premium Auto',
            maximum: 'Maximum Motors',
            samarkand: 'Samarkand Auto',
            autoSamarkand: 'AutoSamarkand',
            samarkandMotors: 'Samarkand Motors',
            bukhara: 'Bukhara Auto',
            bukharaGM: 'Bukhara GM'
        },
        status: {
            critical: 'critical',
            medium: 'medium',
            online: 'Online'
        },
        logs: {
            dataLoaded: 'Data loaded successfully',
            dataLoadError: 'Error loading data:',
            modelDataLoaded: 'Model data loaded:',
            modelDataLoadError: 'Error loading model data:'
        }
    }
};