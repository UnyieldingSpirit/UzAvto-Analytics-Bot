// Функция для получения данных о контрактах
export const fetchContractData = async (beginDate, endDate) => {
    try {
        const response = await fetch('https://uzavtosalon.uz/b/dashboard/infos&get_all_contract_by_month', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                begin_date: beginDate,
                end_date: endDate
            })
        });

        if (!response.ok) {
            throw new Error(`Ошибка при получении данных: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Ошибка при запросе данных о контрактах:', error);
        throw error;
    }
};

// Функция для обработки и подготовки данных по контрактам
export const processContractData = (data, modelId, regionId, period) => {
    // Данные для обработки
    const modelData = data.find(model => model.model_id === (modelId === 'all' ? data[0].model_id : modelId)) || data[0];

    // Получаем данные по фильтрам
    const allContracts = modelData.filter_by_month || [];
    const realizedContracts = modelData.filter_real_by_month || [];
    const canceledContracts = modelData.filter_cancel_by_month || [];

    // Фильтруем по региону, если выбран конкретный регион
    const filteredAllContracts = regionId === 'all'
        ? allContracts
        : allContracts.filter(region => region.region_id === regionId);

    const filteredRealizedContracts = regionId === 'all'
        ? realizedContracts
        : realizedContracts.filter(region => region.region_id === regionId);

    const filteredCanceledContracts = regionId === 'all'
        ? canceledContracts
        : canceledContracts.filter(region => region.region_id === regionId);

    // Преобразуем данные для графиков
    const months = new Set();

    // Собираем все уникальные месяцы из всех наборов данных
    filteredAllContracts.forEach(region =>
        region.data.forEach(item => months.add(item.order_month))
    );

    filteredRealizedContracts.forEach(region =>
        region.data.forEach(item => months.add(item.order_month))
    );

    filteredCanceledContracts.forEach(region =>
        region.data.forEach(item => months.add(item.order_month))
    );

    // Сортируем месяцы
    const sortedMonths = Array.from(months).sort();

    // Создаем объект для хранения данных по каждому месяцу
    const monthlyData = {};

    sortedMonths.forEach(month => {
        // Инициализируем данные для месяца
        monthlyData[month] = {
            name: formatMonthName(month),
            month: month,
            contracts: 0,
            realization: 0,
            cancellation: 0
        };

        // Суммируем все контракты по всем регионам для данного месяца
        filteredAllContracts.forEach(region => {
            const monthData = region.data.find(item => item.order_month === month);
            if (monthData) {
                monthlyData[month].contracts += parseInt(monthData.order_count);
            }
        });

        // Суммируем реализованные контракты по всем регионам для данного месяца
        filteredRealizedContracts.forEach(region => {
            const monthData = region.data.find(item => item.order_month === month);
            if (monthData) {
                monthlyData[month].realization += parseInt(monthData.order_count);
            }
        });

        // Суммируем отмененные контракты по всем регионам для данного месяца
        filteredCanceledContracts.forEach(region => {
            const monthData = region.data.find(item => item.order_month === month);
            if (monthData) {
                monthlyData[month].cancellation += parseInt(monthData.order_count);
            }
        });
    });

    // Конвертируем объект в массив для графиков
    const periodData = Object.values(monthlyData);

    // Готовим данные для модели производительности (статистика по моделям)
    const modelPerformance = {};

    // Для каждой модели вычисляем суммарные показатели
    data.forEach(model => {
        const modelAllContracts = model.filter_by_month || [];
        const modelRealizedContracts = model.filter_real_by_month || [];
        const modelCanceledContracts = model.filter_cancel_by_month || [];

        let totalContracts = 0;
        let totalRealization = 0;
        let totalCancellation = 0;

        // Суммируем данные по регионам и месяцам для каждой модели
        modelAllContracts.forEach(region =>
            region.data.forEach(item => totalContracts += parseInt(item.order_count))
        );

        modelRealizedContracts.forEach(region =>
            region.data.forEach(item => totalRealization += parseInt(item.order_count))
        );

        modelCanceledContracts.forEach(region =>
            region.data.forEach(item => totalCancellation += parseInt(item.order_count))
        );

        // Вычисляем конверсию (процент реализованных контрактов)
        const conversion = totalContracts > 0
            ? Math.round((totalRealization / totalContracts) * 100)
            : 0;

        modelPerformance[model.model_id] = {
            contracts: totalContracts,
            realization: totalRealization,
            cancellation: totalCancellation,
            conversion
        };
    });

    // Детализированные данные (для подробного графика)
    const detailedData = {
        label: periodData.length > 0 ? periodData[0].name : '',
        data: generateDetailedData(periodData),
        totals: calculateTotals(periodData),
        changes: calculateChanges(periodData)
    };

    return {
        periodData,
        detailedData,
        modelPerformance
    };
};

// Вспомогательная функция для форматирования имени месяца из строки вида "2025-05"
const formatMonthName = (monthStr) => {
    const monthNames = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];

    try {
        const [year, month] = monthStr.split('-');
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    } catch (error) {
        return monthStr;
    }
};

// Вспомогательная функция для генерации детализированных данных по дням
const generateDetailedData = (periodData) => {
    if (periodData.length === 0) return [];

    // Берем последний месяц для детализации
    const latestMonth = periodData[periodData.length - 1];

    // Генерируем данные по дням (просто равномерно распределяем месячные данные)
    const daysInMonth = 30;
    const dayData = [];

    for (let day = 1; day <= daysInMonth; day++) {
        // Коэффициент для случайного распределения по дням
        const randomFactor = 0.5 + Math.random();
        const dayFactor = (day % 7 === 0 || day % 7 === 6) ? 0.7 : 1.0; // В выходные меньше

        const contracts = Math.max(1, Math.round((latestMonth.contracts / daysInMonth) * randomFactor * dayFactor));
        const realization = Math.max(1, Math.round((latestMonth.realization / daysInMonth) * randomFactor * dayFactor));
        const cancellation = Math.max(0, Math.round((latestMonth.cancellation / daysInMonth) * randomFactor * dayFactor));

        dayData.push({
            day,
            contracts,
            realization,
            cancellation
        });
    }

    return dayData;
};

// Расчет суммарных показателей
const calculateTotals = (periodData) => {
    if (periodData.length === 0) return { contracts: 0, realization: 0, cancellation: 0 };

    let totalContracts = 0;
    let totalRealization = 0;
    let totalCancellation = 0;

    periodData.forEach(month => {
        totalContracts += month.contracts;
        totalRealization += month.realization;
        totalCancellation += month.cancellation;
    });

    return {
        contracts: Math.round(totalContracts / periodData.length),
        realization: Math.round(totalRealization / periodData.length),
        cancellation: Math.round(totalCancellation / periodData.length)
    };
};

// Расчет изменений по сравнению с предыдущим периодом
const calculateChanges = (periodData) => {
    if (periodData.length < 2) return { contracts: 0, realization: 0, cancellation: 0 };

    const current = periodData[periodData.length - 1];
    const previous = periodData[periodData.length - 2];

    const contractChange = previous.contracts > 0
        ? Math.round(((current.contracts - previous.contracts) / previous.contracts) * 100)
        : 0;

    const realizationChange = previous.realization > 0
        ? Math.round(((current.realization - previous.realization) / previous.realization) * 100)
        : 0;

    const cancellationChange = previous.cancellation > 0
        ? Math.round(((current.cancellation - previous.cancellation) / previous.cancellation) * 100)
        : 0;

    return {
        contracts: contractChange,
        realization: realizationChange,
        cancellation: cancellationChange
    };
};