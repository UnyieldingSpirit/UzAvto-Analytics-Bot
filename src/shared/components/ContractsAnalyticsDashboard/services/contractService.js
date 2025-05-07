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
    // Готовим данные для модели производительности
    const modelPerformance = {};

    // Для каждой модели вычисляем суммарные показатели
    data.forEach(model => {
        const modelAllContracts = model.filter_by_month || [];
        const modelRealizedContracts = model.filter_real_by_month || [];
        const modelCanceledContracts = model.filter_cancel_by_month || [];

        let totalContracts = 0;
        let totalRealization = 0;
        let totalCancellation = 0;

        // Фильтрация по региону, если выбран конкретный регион
        const filteredContracts = regionId === 'all'
            ? modelAllContracts
            : modelAllContracts.filter(region => region.region_id === regionId);

        const filteredRealizations = regionId === 'all'
            ? modelRealizedContracts
            : modelRealizedContracts.filter(region => region.region_id === regionId);

        const filteredCancellations = regionId === 'all'
            ? modelCanceledContracts
            : modelCanceledContracts.filter(region => region.region_id === regionId);

        // Суммируем данные по регионам и месяцам для каждой модели
        filteredContracts.forEach(region =>
            region.data.forEach(item => totalContracts += parseInt(item.order_count))
        );

        filteredRealizations.forEach(region =>
            region.data.forEach(item => totalRealization += parseInt(item.order_count))
        );

        filteredCancellations.forEach(region =>
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

    // Дальше идет код для выбора и обработки данных по выбранной модели/региону
    // и формирования periodData, detailedData, и т.д.

    // Выбираем данные в зависимости от выбранной модели и региона
    let filteredAllContracts = [];
    let filteredRealizedContracts = [];
    let filteredCanceledContracts = [];

    if (modelId === 'all') {
        // Объединяем данные по всем моделям
        data.forEach(model => {
            const modelContracts = model.filter_by_month || [];
            const modelRealizations = model.filter_real_by_month || [];
            const modelCancellations = model.filter_cancel_by_month || [];

            // Фильтруем по региону, если выбран конкретный регион
            if (regionId === 'all') {
                filteredAllContracts.push(...modelContracts);
                filteredRealizedContracts.push(...modelRealizations);
                filteredCanceledContracts.push(...modelCancellations);
            } else {
                const filteredRegionContracts = modelContracts.filter(region => region.region_id === regionId);
                const filteredRegionRealizations = modelRealizations.filter(region => region.region_id === regionId);
                const filteredRegionCancellations = modelCancellations.filter(region => region.region_id === regionId);

                filteredAllContracts.push(...filteredRegionContracts);
                filteredRealizedContracts.push(...filteredRegionRealizations);
                filteredCanceledContracts.push(...filteredRegionCancellations);
            }
        });
    } else {
        // Берем данные только для выбранной модели
        const selectedModel = data.find(model => model.model_id === modelId);

        if (selectedModel) {
            const modelContracts = selectedModel.filter_by_month || [];
            const modelRealizations = selectedModel.filter_real_by_month || [];
            const modelCancellations = selectedModel.filter_cancel_by_month || [];

            // Фильтруем по региону, если выбран конкретный регион
            if (regionId === 'all') {
                filteredAllContracts = modelContracts;
                filteredRealizedContracts = modelRealizations;
                filteredCanceledContracts = modelCancellations;
            } else {
                filteredAllContracts = modelContracts.filter(region => region.region_id === regionId);
                filteredRealizedContracts = modelRealizations.filter(region => region.region_id === regionId);
                filteredCanceledContracts = modelCancellations.filter(region => region.region_id === regionId);
            }
        }
    }

    // Собираем все уникальные месяцы
    const months = new Set();

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

    // Вычисляем суммарные показатели
    const totals = {
        contracts: 0,
        realization: 0,
        cancellation: 0
    };

    // Суммируем данные из всех месяцев
    periodData.forEach(month => {
        totals.contracts += month.contracts;
        totals.realization += month.realization;
        totals.cancellation += month.cancellation;
    });

    // Детализированные данные (для подробного графика)
    const detailedData = {
        label: periodData.length > 0 ? periodData[0].name : '',
        data: generateDetailedData(periodData),
        totals: totals,
        changes: calculateChanges(periodData)
    };

    return {
        periodData,
        detailedData,
        modelPerformance
    };
};

// Вспомогательная функция для обработки отфильтрованных данных
const processFilteredData = (filteredContracts, filteredRealizations, filteredCancellations) => {
    // Собираем все уникальные месяцы
    const months = new Set();

    filteredContracts.forEach(region =>
        region.data.forEach(item => months.add(item.order_month))
    );

    filteredRealizations.forEach(region =>
        region.data.forEach(item => months.add(item.order_month))
    );

    filteredCancellations.forEach(region =>
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
        filteredContracts.forEach(region => {
            const monthData = region.data.find(item => item.order_month === month);
            if (monthData) {
                monthlyData[month].contracts += parseInt(monthData.order_count);
            }
        });

        // Суммируем реализованные контракты по всем регионам для данного месяца
        filteredRealizations.forEach(region => {
            const monthData = region.data.find(item => item.order_month === month);
            if (monthData) {
                monthlyData[month].realization += parseInt(monthData.order_count);
            }
        });

        // Суммируем отмененные контракты по всем регионам для данного месяца
        filteredCancellations.forEach(region => {
            const monthData = region.data.find(item => item.order_month === month);
            if (monthData) {
                monthlyData[month].cancellation += parseInt(monthData.order_count);
            }
        });
    });

    // Конвертируем объект в массив для графиков
    const periodData = Object.values(monthlyData);

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
        modelPerformance: {} // Этот объект нужно заполнить отдельно
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