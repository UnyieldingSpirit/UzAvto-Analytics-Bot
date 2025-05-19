import { LocaleMessages } from "@/src/types/locale";

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
        car: 'Авто'
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
        car: 'Avto'
    }
};