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

// Функция для получения данных о контрактах по датам
export const fetchContractDataByDate = async (beginDate, endDate) => {
    try {
        const response = await fetch('https://uzavtosalon.uz/b/dashboard/infos&get_all_contract_by_date', {
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
        console.error('Ошибка при запросе данных о контрактах по датам:', error);
        throw error;
    }
};

// Функция для обработки и подготовки данных по контрактам
export const processContractData = (data, modelId, regionId, period) => {
    console.log("INPUT DATA FROM API:", data);

    // Готовим данные для модели производительности
    const modelPerformance = {};

    // Для каждой модели вычисляем суммарные показатели
    data.forEach(model => {
        const modelAllContracts = model.filter_by_month || [];
        const modelRealizedContracts = model.filter_real_by_month || [];
        const modelCanceledContracts = model.filter_cancel_by_month || [];

        console.log(`Обработка модели: ${model.model_name} (ID: ${model.model_id})`);
        console.log(`filter_by_month:`, modelAllContracts);
        console.log(`filter_real_by_month:`, modelRealizedContracts);
        console.log(`filter_cancel_by_month:`, modelCanceledContracts);

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
        filteredContracts.forEach(region => {
            region.data.forEach(item => {
                const count = parseInt(item.order_count);
                totalContracts += count;
                console.log(`Контракты для региона ${region.region_name}, месяц ${item.order_month}: ${count}`);
            });
        });

        filteredRealizations.forEach(region => {
            region.data.forEach(item => {
                const count = parseInt(item.order_count);
                totalRealization += count;
                console.log(`Реализация для региона ${region.region_name}, месяц ${item.order_month}: ${count}`);
            });
        });

        filteredCancellations.forEach(region => {
            region.data.forEach(item => {
                const count = parseInt(item.order_count);
                totalCancellation += count;
                console.log(`Отмена для региона ${region.region_name}, месяц ${item.order_month}: ${count}`);
            });
        });

        console.log(`Итоги для модели ${model.model_name}:`, {
            contracts: totalContracts,
            realization: totalRealization,
            cancellation: totalCancellation
        });

        // Вычисляем конверсию (процент реализованных контрактов)
        const conversion = totalContracts > 0
            ? Math.round((totalRealization / totalContracts) * 100)
            : 0;

        modelPerformance[model.model_id] = {
            contracts: totalContracts,
            realization: totalRealization,
            cancellation: totalCancellation,
            conversion,
            // Сохраняем исходные данные по регионам для прямого доступа в компоненте SelectedModelDetails
            filter_by_month: filteredContracts,
            filter_real_by_month: filteredRealizations,
            filter_cancel_by_month: filteredCancellations
        };
    });

    console.log("Model Performance (все модели):", modelPerformance);

    // Выбираем данные в зависимости от выбранной модели и региона
    let filteredAllContracts = [];
    let filteredRealizedContracts = [];
    let filteredCanceledContracts = [];

    if (modelId === 'all') {
        console.log("Объединяем данные по всем моделям");
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
        console.log(`Обрабатываем только модель с ID ${modelId}`);
        // Берем данные только для выбранной модели
        const selectedModel = data.find(model => model.model_id === modelId);

        if (selectedModel) {
            console.log(`Найдена модель: ${selectedModel.model_name}`);
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
        } else {
            console.warn(`Модель с ID ${modelId} не найдена!`);
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
    console.log("Уникальные месяцы:", sortedMonths);

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

        console.log(`Данные за месяц ${month}:`, monthlyData[month]);
    });

    // Конвертируем объект в массив для графиков
    const periodData = Object.values(monthlyData);
    console.log("Period Data:", periodData);

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

        console.log(`Суммирование за ${month.name}:`, {
            contracts: month.contracts,
            realization: month.realization,
            cancellation: month.cancellation
        });
    });

    console.log("ИТОГОВЫЕ СУММЫ:", totals);

    // Детализированные данные (для подробного графика)
    const detailedData = {
        label: periodData.length > 0 ? periodData[0].name : '',
        data: generateDetailedData(periodData),
        totals: totals,
        changes: calculateChanges(periodData)
    };

    console.log("Detailed Data:", detailedData);

    return {
        periodData,
        detailedData,
        modelPerformance
    };
};

const formatMonthName = (monthStr) => {
    const monthNames = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];

    try {
        const [year, month] = monthStr.split('-');
        const monthIndex = parseInt(month) - 1;

        // Проверка валидности месяца
        if (monthIndex >= 0 && monthIndex < 12) {
            return `${monthNames[monthIndex]} ${year}`;
        }
        return monthStr; // Возвращаем исходную строку, если не удалось распарсить
    } catch (error) {
        console.error("Ошибка форматирования месяца:", error);
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
        contracts: totalContracts,
        realization: totalRealization,
        cancellation: totalCancellation
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