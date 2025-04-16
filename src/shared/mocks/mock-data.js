// Модели автомобилей
export const carModels = [
    { id: 'damas2', name: 'DAMAS-2', img: 'https://i.imgur.com/uHFoiIO.png', category: 'minivan' },
    { id: 'tracker2', name: 'TRACKER-2', img: 'https://telegra.ph/file/e54ca862bac1f2187ddde.png', category: 'suv' },
    { id: 'captiva', name: 'Captiva 5T', img: 'https://telegra.ph/file/18ddc72f850ed84375c6a.png', category: 'suv' },
    { id: 'onix', name: 'ONIX', img: 'https://telegra.ph/file/dbcb8da73115e8e2c466f.png', category: 'sedan' }
];

// Регионы Узбекистана
export const regions = [
    { id: 'tashkent', name: 'Ташкент' },
    { id: 'samarkand', name: 'Самарканд' },
    { id: 'bukhara', name: 'Бухара' },
    { id: 'andijan', name: 'Андижан' },
    { id: 'namangan', name: 'Наманган' },
    { id: 'fergana', name: 'Фергана' },
    { id: 'nukus', name: 'Нукус' },
    { id: 'qarshi', name: 'Карши' }
];

// Склады автомобилей
export const warehouses = [
    {
        id: 'tashkent-main',
        name: 'Главный склад (Ташкент)',
        region: 'tashkent',
        address: 'г. Ташкент, Яшнабадский район, ул. Паркентская 13А',
        capacity: 1200,
        occupied: 820,
        managerId: 'manager-01',
        manager: 'Акбаров Т.К.',
        contact: '+998 71 123-45-67'
    },
    {
        id: 'samarkand-central',
        name: 'Центральный склад (Самарканд)',
        region: 'samarkand',
        address: 'г. Самарканд, Согдийская улица 45',
        capacity: 800,
        occupied: 540,
        managerId: 'manager-02',
        manager: 'Исмаилов Р.А.',
        contact: '+998 72 234-56-78'
    },
    {
        id: 'bukhara-north',
        name: 'Северный склад (Бухара)',
        region: 'bukhara',
        address: 'г. Бухара, ул. Промышленная 22',
        capacity: 500,
        occupied: 380,
        managerId: 'manager-03',
        manager: 'Каримов А.С.',
        contact: '+998 73 345-67-89'
    },
    {
        id: 'andijan-east',
        name: 'Восточный склад (Андижан)',
        region: 'andijan',
        address: 'г. Андижан, ул. Автомобилистов 5',
        capacity: 600,
        occupied: 410,
        managerId: 'manager-04',
        manager: 'Юсупов Б.М.',
        contact: '+998 74 456-78-90'
    },
    {
        id: 'tashkent-south',
        name: 'Южный склад (Ташкент)',
        region: 'tashkent',
        address: 'г. Ташкент, Чиланзарский район, ул. Бунёдкор 12',
        capacity: 850,
        occupied: 720,
        managerId: 'manager-05',
        manager: 'Рахимов У.Д.',
        contact: '+998 71 567-89-01'
    }
];