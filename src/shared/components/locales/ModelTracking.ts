import { LocaleMessages } from "@/src/types/locale";

export const modelTrackingTranslations: LocaleMessages = {
    'ru': {
        title: 'Мониторинг продаж автомобилей',
        titleWithModel: 'Мониторинг продаж: {{modelName}}',
        wholesale: 'ОПТОВЫЕ ЗАКАЗЫ',
        retail: 'РОЗНИЧНЫЕ ЗАКАЗЫ',
        statusAndDistribution: 'СТАТУС И РАСПРЕДЕЛЕНИЕ',
        viewModes: {
            grid: 'Сетка',
            list: 'Список'
        },
        filters: {
            reset: 'Сбросить',
            region: 'Регион',
            model: 'Модель',
            allRegions: 'Все регионы',
            allModels: 'Все модели',
            currentView: 'Просмотр'
        },
        views: {
            general: 'Общий обзор',
            region: 'Регион: {{regionName}}',
            model: 'Модель: {{modelName}}',
            regionModel: '{{regionName}} > {{modelName}}'
        },
        statuses: {
            title: 'СТАТУС ЗАКАЗОВ',
            totalOrders: 'Всего заказов',
            chart: 'График',
            table: 'Таблица',
            paid: 'ОПЛАЧЕНО',
            unpaid: 'НЕ ОПЛАЧЕНО',
            partiallyPaid: 'НЕ/ЧАСТ. ОПЛАЧЕНО',
            inDistribution: 'НА РАСПРЕДЕЛЕНИИ',
            distributed: 'РАСПРЕДЕЛЁН',
            inTransit: 'В ПУТИ',
            atDealer: 'У ДИЛЕРА',
            reserved: 'БРОНЬ',
            total: 'ВСЕГО'
        },
        modelDetails: {
            title: 'МОДЕЛИ В РАЗРЕЗЕ',
            titleWholesale: 'ОПТОВЫЕ МОДЕЛИ В РАЗРЕЗЕ',
            titleRetail: 'РОЗНИЧНЫЕ МОДЕЛИ В РАЗРЕЗЕ',
            titleRegion: 'МОДЕЛИ В РЕГИОНЕ: {{regionName}}',
            titleModelRegion: 'ДЕТАЛЬНАЯ ИНФОРМАЦИЯ: {{modelName}} В {{regionName}}',
            titleModel: 'ДЕТАЛЬНАЯ ИНФОРМАЦИЯ: {{modelName}}',
            image: 'ИЗОБРАЖЕНИЕ',
            statusesTable: 'СТАТУС',
            quantityTable: 'КОЛИЧЕСТВО'
        },
        noData: 'Нет данных для отображения'
    },
    'uz': {
        title: 'Avtomobil savdosi monitoringi',
        titleWithModel: 'Savdo monitoringi: {{modelName}}',
        wholesale: 'ULGURJI BUYURTMALAR',
        retail: 'CHAKANA BUYURTMALAR',
        statusAndDistribution: 'HOLAT VA TAQSIMLASH',
        viewModes: {
            grid: 'Setka',
            list: 'Ro\'yxat'
        },
        filters: {
            reset: 'Qayta o\'rnatish',
            region: 'Viloyat',
            model: 'Model',
            allRegions: 'Barcha viloyatlar',
            allModels: 'Barcha modellar',
            currentView: 'Ko\'rish'
        },
        views: {
            general: 'Umumiy ko\'rinish',
            region: 'Viloyat: {{regionName}}',
            model: 'Model: {{modelName}}',
            regionModel: '{{regionName}} > {{modelName}}'
        },
        statuses: {
            title: 'BUYURTMALAR HOLATI',
            totalOrders: 'Jami buyurtmalar',
            chart: 'Grafik',
            table: 'Jadval',
            paid: 'TO\'LANGAN',
            unpaid: 'TO\'LANMAGAN',
            partiallyPaid: 'TO\'LANMAGAN/QISMAN',
            inDistribution: 'TAQSIMOTDA',
            distributed: 'TAQSIMLANGAN',
            inTransit: 'YO\'LDA',
            atDealer: 'DILERDA',
            reserved: 'BRON',
            total: 'JAMI'
        },
        modelDetails: {
            title: 'MODELLAR KO\'RINISHI',
            titleWholesale: 'ULGURJI MODELLAR KO\'RINISHI',
            titleRetail: 'CHAKANA MODELLAR KO\'RINISHI',
            titleRegion: 'VILOYATDAGI MODELLAR: {{regionName}}',
            titleModelRegion: 'BATAFSIL MA\'LUMOT: {{modelName}} {{regionName}} DA',
            titleModel: 'BATAFSIL MA\'LUMOT: {{modelName}}',
            image: 'RASM',
            statusesTable: 'HOLAT',
            quantityTable: 'MIQDOR'
        },
        noData: 'Ko\'rsatish uchun ma\'lumot yo\'q'
    }
};