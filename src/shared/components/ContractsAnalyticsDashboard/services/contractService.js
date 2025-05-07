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
        // Получаем массивы данных для каждого типа контрактов
        const modelAllContracts = model.filter_by_month || [];
        const modelRealizedContracts = model.filter_real_by_month || [];
        const modelCanceledContracts = model.filter_cancel_by_month || [];

        console.log(`Обработка модели: ${model.model_name} (ID: ${model.model_id})`);

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

        // Суммируем контракты по всем регионам и месяцам
        filteredContracts.forEach(region => {
            if (region.data && Array.isArray(region.data)) {
                region.data.forEach(item => {
                    if (item.order_count) {
                        const count = parseInt(item.order_count);
                        if (!isNaN(count)) {
                            totalContracts += count;
                        }
                    }
                });
            }
        });

        // Суммируем реализованные контракты
        filteredRealizations.forEach(region => {
            if (region.data && Array.isArray(region.data)) {
                region.data.forEach(item => {
                    if (item.order_count) {
                        const count = parseInt(item.order_count);
                        if (!isNaN(count)) {
                            totalRealization += count;
                        }
                    }
                });
            }
        });

        // Суммируем отмененные контракты
        filteredCancellations.forEach(region => {
            if (region.data && Array.isArray(region.data)) {
                region.data.forEach(item => {
                    if (item.order_count) {
                        const count = parseInt(item.order_count);
                        if (!isNaN(count)) {
                            totalCancellation += count;
                        }
                    }
                });
            }
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
            // Сохраняем исходные данные по регионам для прямого доступа
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

    // Проверяем данные на наличие перед обработкой
    if (filteredAllContracts && filteredAllContracts.length > 0) {
        filteredAllContracts.forEach(region => {
            if (region.data && Array.isArray(region.data)) {
                region.data.forEach(item => {
                    if (item.order_month) {
                        months.add(item.order_month);
                    }
                });
            }
        });
    }

    if (filteredRealizedContracts && filteredRealizedContracts.length > 0) {
        filteredRealizedContracts.forEach(region => {
            if (region.data && Array.isArray(region.data)) {
                region.data.forEach(item => {
                    if (item.order_month) {
                        months.add(item.order_month);
                    }
                });
            }
        });
    }

    if (filteredCanceledContracts && filteredCanceledContracts.length > 0) {
        filteredCanceledContracts.forEach(region => {
            if (region.data && Array.isArray(region.data)) {
                region.data.forEach(item => {
                    if (item.order_month) {
                        months.add(item.order_month);
                    }
                });
            }
        });
    }

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
        if (filteredAllContracts && filteredAllContracts.length > 0) {
            filteredAllContracts.forEach(region => {
                if (region.data && Array.isArray(region.data)) {
                    const monthData = region.data.find(item => item.order_month === month);
                    if (monthData && monthData.order_count) {
                        const count = parseInt(monthData.order_count);
                        if (!isNaN(count)) {
                            monthlyData[month].contracts += count;
                        }
                    }
                }
            });
        }

        // Суммируем реализованные контракты
        if (filteredRealizedContracts && filteredRealizedContracts.length > 0) {
            filteredRealizedContracts.forEach(region => {
                if (region.data && Array.isArray(region.data)) {
                    const monthData = region.data.find(item => item.order_month === month);
                    if (monthData && monthData.order_count) {
                        const count = parseInt(monthData.order_count);
                        if (!isNaN(count)) {
                            monthlyData[month].realization += count;
                        }
                    }
                }
            });
        }

        // Суммируем отмененные контракты
        if (filteredCanceledContracts && filteredCanceledContracts.length > 0) {
            filteredCanceledContracts.forEach(region => {
                if (region.data && Array.isArray(region.data)) {
                    const monthData = region.data.find(item => item.order_month === month);
                    if (monthData && monthData.order_count) {
                        const count = parseInt(monthData.order_count);
                        if (!isNaN(count)) {
                            monthlyData[month].cancellation += count;
                        }
                    }
                }
            });
        }

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
        if (month.contracts) totals.contracts += month.contracts;
        if (month.realization) totals.realization += month.realization;
        if (month.cancellation) totals.cancellation += month.cancellation;
    });

    console.log("ИТОГОВЫЕ СУММЫ:", totals);

    // Детализированные данные (для подробного графика)
    const detailedData = {
        label: periodData.length > 0 ? periodData[0].name : '',
        data: [], // Пустой массив, будет заполнен реальными данными из API
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