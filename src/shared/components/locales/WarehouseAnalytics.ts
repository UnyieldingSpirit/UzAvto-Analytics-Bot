import { LocaleMessages } from "../../../types/locale";

export const warehouseAnalyticsTranslations: LocaleMessages = {
    'ru': {
        'title': 'Аналитика автосклада',
        'subtitle': 'Мониторинг в реальном времени',
        'units': 'шт.',
        'car': 'авто',
        'metrics': {
            'total': 'Всего',
            'totalCars': 'Всего авто',
            'totalInWarehouses': 'Всего на складах',
            'available': 'Свободные',
            'reserved': 'Именные',
            'defective': 'Бракованные',
            'defectiveOk': 'Брак-ОК',
            'totalCarModels': 'Всего моделей автомобилей: {{count}}',
            'updatedAt': 'Обновлено:'
        },
        'status': {
            'available': 'Свободные',
            'availableShort': 'Своб',
            'reserved': 'Закрепленные',
            'reservedShort': 'Закр',
            'defective': 'Брак',
            'defectiveShort': 'Брак',
            'defectiveOk': 'Брак-ОК',
            'defectiveOkShort': 'Б-ОК',
            'free': 'Свободно',
            'maxCapacity': 'Макс. емкость'
        },
        'occupancyStatus': {
            'critical': 'критический',
            'high': 'высокий',
            'medium': 'средний',
            'low': 'низкий'
        },
        'charts': {
            'distribution': 'Распределение',
            'byWarehouse': 'По складам',
            'warehouseDistribution': 'Распределение по складам',
            'carsByWarehouse': 'Распределение автомобилей по складам',
            'carStatusInWarehouses': 'Статус автомобилей на складах',
            'colorDistribution': 'Распределение по цветам',
            'occupancy': 'Заполненность',
            'currentOccupancy': 'Показывает текущую заполненность',
            'status': 'Статус',
            'inventoryShare': 'Доли запасов',
            'interactive': 'Интерактивно',
            'percentageRatio': 'Процентное соотношение'
        },
        'sections': {
            'carModels': 'Модели автомобилей',
            'selectModelHint': 'Выберите модель для просмотра деталей'
        },
        'table': {
            'warehouseName': 'Название склада',
            'capacity': 'Емкость',
            'occupied': 'Заполнено',
            'available': 'Свободные',
            'reserved': 'Закрепленные',
            'defectiveOk': 'Брак-ОК',
            'defective': 'Брак',
            'actions': 'Действия'
        },
        'details': {
            'carModelDetails': 'Детальная информация о модели',
            'modelStatistics': 'Статистика по модели',
            'statusDistribution': 'Распределение по статусам',
            'colorDistribution': 'Распределение по цветам',
            'availableColors': '{{count}} доступных цветов',
            'modifications': 'Модификации {{model}}',
            'modificationsCount': '{{count}} модификаций',
            'modificationDetails': 'Детали модификации',
            'warehouseDistribution': 'Распределение по складам',
            'warehouseDetails': 'Детальная информация о складе',
            'occupancy': 'Заполнение',
            'warehouseInfo': 'Информация о складе',
            'warehouseOccupancy': 'Заполненность склада',
            'modelDistribution': 'Распределение по моделям',
            'inWarehouse': 'на складе',
            'allModifications': 'Все модификации {{model}}'
        },
        'tabs': {
            'modifications': 'Модификации',
            'colors': 'Цвета'
        },
        'buttons': {
            'exportWarehouses': 'Экспорт складов',
            'exportModels': 'Экспорт моделей'
        },
        'export': {
            'warehouse': 'Склад',
            'model': 'Модель',
            'category': 'Категория',
            'total': 'Всего',
            'available': 'Свободные',
            'reserved': 'Закрепленные',
            'defectiveOk': 'Брак-ОК',
            'defective': 'Брак',
            'occupancy': 'Заполненность'
        },
        'notifications': {
            'exportSuccessWarehouse': 'Данные успешно экспортированы в CSV',
            'exportSuccessModels': 'Данные о моделях экспортированы в CSV'
        },
        'errors': {
            'loadingData': 'Ошибка при загрузке данных',
            'loadingDataTitle': 'Ошибка загрузки данных',
            'failedToLoad': 'Не удалось загрузить данные. Пожалуйста, попробуйте позже.',
            'dataNotFound': 'Данные не найдены'
        },
        'categories': {
            'sedan': 'Седан',
            'suv': 'Внедорожник',
            'minivan': 'Минивэн',
            'other': 'Другое'
        }
    },
    'uz': {
        'title': 'Avtomobil ombori analitikasi',
        'subtitle': 'Real vaqt monitoringi',
        'units': 'dona',
        'car': 'avto',
        'metrics': {
            'total': 'Jami',
            'totalCars': 'Jami avto',
            'totalInWarehouses': 'Jami omborlarda',
            'available': 'Bo\'sh',
            'reserved': '',
            'defective': 'Nuqsonli',
            'defectiveOk': 'Nuqson-OK',
            'totalCarModels': 'Jami avtomobil modellari: {{count}}',
            'updatedAt': 'Yangilangan:'
        },
        'status': {
            'available': 'Bo\'sh',
            'availableShort': 'Bo\'sh',
            'reserved': 'Shaxsiylashtirilgan',
            'reservedShort': 'Birik',
            'defective': 'Nuqsonli',
            'defectiveShort': 'Nuqs',
            'defectiveOk': 'Nuqson-OK',
            'defectiveOkShort': 'N-OK',
            'free': 'Bo\'sh joy',
            'maxCapacity': 'Maks. sig\'im'
        },
        'occupancyStatus': {
            'critical': 'kritik',
            'high': 'yuqori',
            'medium': 'o\'rta',
            'low': 'past'
        },
        'charts': {
            'distribution': 'Taqsimlash',
            'byWarehouse': 'Omborlar bo\'yicha',
            'warehouseDistribution': 'Omborlar bo\'yicha taqsimlash',
            'carsByWarehouse': 'Avtomobillarni omborlar bo\'yicha taqsimlash',
            'carStatusInWarehouses': 'Ombordagi avtomobillar holati',
            'colorDistribution': 'Ranglar bo\'yicha taqsimlash',
            'occupancy': 'To\'ldirilganlik',
            'currentOccupancy': 'Joriy to\'ldirilganlikni ko\'rsatadi',
            'status': 'Holat',
            'inventoryShare': 'Zaxiralar ulushi',
            'interactive': 'Interaktiv',
            'percentageRatio': 'Foiz nisbati'
        },
        'sections': {
            'carModels': 'Avtomobil modellari',
            'selectModelHint': 'Tafsilotlarni ko\'rish uchun modelni tanlang'
        },
        'table': {
            'warehouseName': 'Ombor nomi',
            'capacity': 'Sig\'im',
            'occupied': 'To\'ldirilgan',
            'available': 'Bo\'sh',
            'reserved': 'Biriktirilgan',
            'defectiveOk': 'Nuqson-OK',
            'defective': 'Nuqsonli',
            'actions': 'Harakatlar'
        },
        'details': {
            'carModelDetails': 'Model haqida batafsil ma\'lumot',
            'modelStatistics': 'Model bo\'yicha statistika',
            'statusDistribution': 'Holatlar bo\'yicha taqsimlash',
            'colorDistribution': 'Ranglar bo\'yicha taqsimlash',
            'availableColors': '{{count}} mavjud ranglar',
            'modifications': '{{model}} modifikatsiyalari',
            'modificationsCount': '{{count}} modifikatsiyalar',
            'modificationDetails': 'Modifikatsiya tafsilotlari',
            'warehouseDistribution': 'Omborlar bo\'yicha taqsimlash',
            'warehouseDetails': 'Ombor haqida batafsil ma\'lumot',
            'occupancy': 'To\'ldirish',
            'warehouseInfo': 'Ombor haqida ma\'lumot',
            'warehouseOccupancy': 'Ombor to\'ldirilganligi',
            'modelDistribution': 'Modellar bo\'yicha taqsimlash',
            'inWarehouse': 'omborida',
            'allModifications': '{{model}} barcha modifikatsiyalari'
        },
        'tabs': {
            'modifications': 'Modifikatsiyalar',
            'colors': 'Ranglar'
        },
        'buttons': {
            'exportWarehouses': 'Omborlar eksporti',
            'exportModels': 'Modellar eksporti'
        },
        'export': {
            'warehouse': 'Ombor',
            'model': 'Model',
            'category': 'Kategoriya',
            'total': 'Jami',
            'available': 'Bo\'sh',
            'reserved': 'Biriktirilgan',
            'defectiveOk': 'Nuqson-OK',
            'defective': 'Nuqsonli',
            'occupancy': 'To\'ldirilganlik'
        },
        'notifications': {
            'exportSuccessWarehouse': 'Ma\'lumotlar muvaffaqiyatli CSV ga eksport qilindi',
            'exportSuccessModels': 'Modellar ma\'lumotlari CSV ga eksport qilindi'
        },
        'errors': {
            'loadingData': 'Ma\'lumotlarni yuklashda xatolik yuz berdi',
            'loadingDataTitle': 'Ma\'lumotlarni yuklash xatosi',
            'failedToLoad': 'Ma\'lumotlarni yuklab bo\'lmadi. Iltimos, keyinroq qayta urinib ko\'ring.',
            'dataNotFound': 'Ma\'lumotlar topilmadi'
        },
        'categories': {
            'sedan': 'Sedan',
            'suv': 'Yo\'l tanlamas',
            'minivan': 'Miniven',
            'other': 'Boshqa'
        }
    },
    'en': {
        'title': 'Warehouse Analytics',
        'subtitle': 'Real-time monitoring',
        'units': 'pcs',
        'car': 'car',
        'metrics': {
            'total': 'Total',
            'totalCars': 'Total cars',
            'totalInWarehouses': 'Total in warehouses',
            'available': 'Available',
            'reserved': 'Personalized',
            'defective': 'Defective',
            'defectiveOk': 'Defect-OK',
            'totalCarModels': 'Total car models: {{count}}',
            'updatedAt': 'Updated:'
        },
        'status': {
            'available': 'Available',
            'availableShort': 'Avail',
            'reserved': 'Reserved',
            'reservedShort': 'Resv',
            'defective': 'Defective',
            'defectiveShort': 'Def',
            'defectiveOk': 'Defect-OK',
            'defectiveOkShort': 'D-OK',
            'free': 'Free',
            'maxCapacity': 'Max capacity'
        },
        'occupancyStatus': {
            'critical': 'critical',
            'high': 'high',
            'medium': 'medium',
            'low': 'low'
        },
        'charts': {
            'distribution': 'Distribution',
            'byWarehouse': 'By warehouse',
            'warehouseDistribution': 'Warehouse distribution',
            'carsByWarehouse': 'Cars distribution by warehouses',
            'carStatusInWarehouses': 'Car status in warehouses',
            'colorDistribution': 'Color distribution',
            'occupancy': 'Occupancy',
            'currentOccupancy': 'Shows current occupancy',
            'status': 'Status',
            'inventoryShare': 'Inventory share',
            'interactive': 'Interactive',
            'percentageRatio': 'Percentage ratio'
        },
        'sections': {
            'carModels': 'Car models',
            'selectModelHint': 'Select model to view details'
        },
        'table': {
            'warehouseName': 'Warehouse name',
            'capacity': 'Capacity',
            'occupied': 'Occupied',
            'available': 'Available',
            'reserved': 'Reserved',
            'defectiveOk': 'Defect-OK',
            'defective': 'Defective',
            'actions': 'Actions'
        },
        'details': {
            'carModelDetails': 'Car model details',
            'modelStatistics': 'Model statistics',
            'statusDistribution': 'Status distribution',
            'colorDistribution': 'Color distribution',
            'availableColors': '{{count}} available colors',
            'modifications': '{{model}} modifications',
            'modificationsCount': '{{count}} modifications',
            'modificationDetails': 'Modification details',
            'warehouseDistribution': 'Warehouse distribution',
            'warehouseDetails': 'Warehouse details',
            'occupancy': 'Occupancy',
            'warehouseInfo': 'Warehouse information',
            'warehouseOccupancy': 'Warehouse occupancy',
            'modelDistribution': 'Model distribution',
            'inWarehouse': 'in warehouse',
            'allModifications': 'All {{model}} modifications'
        },
        'tabs': {
            'modifications': 'Modifications',
            'colors': 'Colors'
        },
        'buttons': {
            'exportWarehouses': 'Export warehouses',
            'exportModels': 'Export models'
        },
        'export': {
            'warehouse': 'Warehouse',
            'model': 'Model',
            'category': 'Category',
            'total': 'Total',
            'available': 'Available',
            'reserved': 'Reserved',
            'defectiveOk': 'Defect-OK',
            'defective': 'Defective',
            'occupancy': 'Occupancy'
        },
        'notifications': {
            'exportSuccessWarehouse': 'Data successfully exported to CSV',
            'exportSuccessModels': 'Model data exported to CSV'
        },
        'errors': {
            'loadingData': 'Error loading data',
            'loadingDataTitle': 'Data loading error',
            'failedToLoad': 'Failed to load data. Please try again later.',
            'dataNotFound': 'Data not found'
        },
        'categories': {
            'sedan': 'Sedan',
            'suv': 'SUV',
            'minivan': 'Minivan',
            'other': 'Other'
        }
    }
};