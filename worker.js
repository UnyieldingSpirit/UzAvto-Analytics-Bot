// worker.js - создайте этот файл в src/
self.addEventListener('message', function (e) {
    const { type, data } = e.data;

    if (type === 'calculate_stats') {
        const { apiData, selectedRegion, selectedModel, activeTab } = data;
        const result = calculateStats(apiData, selectedRegion, selectedModel, activeTab);
        self.postMessage({ type: 'stats_result', data: result });
    }
});

function calculateStats(apiData, selectedRegion, selectedModel, activeTab) {
    if (!apiData || !Array.isArray(apiData)) {
        return { count: 0, amount: 0, average: 0 };
    }

    let totalContracts = 0;
    let totalAmount = 0;

    // Если выбрана конкретная модель, фильтруем только по ней
    if (selectedModel !== 'all') {
        const modelData = apiData.find(model => model.model_id === selectedModel);

        if (modelData) {
            // Если также выбран конкретный регион, фильтруем по региону
            if (selectedRegion !== 'all') {
                // Поиск данных выбранного региона для выбранной модели
                const regionData = modelData.filter_by_region?.find(r => r.region_id === selectedRegion);

                if (regionData) {
                    totalContracts = parseInt(regionData.total_contracts || 0);
                    totalAmount = parseInt(regionData.total_price || 0);
                }
            } else {
                // Суммируем по всем регионам для выбранной модели
                if (modelData.filter_by_region && Array.isArray(modelData.filter_by_region)) {
                    modelData.filter_by_region.forEach(region => {
                        totalContracts += parseInt(region.total_contracts || 0);
                        totalAmount += parseInt(region.total_price || 0);
                    });
                }
            }
        }
    } else if (selectedRegion !== 'all') {
        // Выбран только регион, суммируем по всем моделям для этого региона
        apiData.forEach(model => {
            if (model.filter_by_region && Array.isArray(model.filter_by_region)) {
                const regionData = model.filter_by_region.find(r => r.region_id === selectedRegion);
                if (regionData) {
                    totalContracts += parseInt(regionData.total_contracts || 0);
                    totalAmount += parseInt(regionData.total_price || 0);
                }
            }
        });
    } else {
        // Не выбраны ни модель, ни регион - суммируем всё
        apiData.forEach(model => {
            if (model.filter_by_region && Array.isArray(model.filter_by_region)) {
                model.filter_by_region.forEach(region => {
                    totalContracts += parseInt(region.total_contracts || 0);
                    totalAmount += parseInt(region.total_price || 0);
                });
            }
        });
    }

    // Вычисляем среднюю стоимость
    const average = totalContracts > 0 ? Math.round(totalAmount / totalContracts) : 0;

    // Коэффициенты модификации для разных табов
    const tabMultipliers = {
        contracts: { count: 1, amount: 1 },
        sales: { count: 1, amount: 1 },
        stock: { count: 0.2, amount: 0.2 },
        retail: { count: 0.7, amount: 0.7 },
        wholesale: { count: 0.3, amount: 0.3 },
        promotions: { count: 0.1, amount: 0.1 }
    };

    // Применяем модификатор в зависимости от активного таба
    const multiplier = tabMultipliers[activeTab] || tabMultipliers.contracts;

    // Возвращаем модифицированные значения
    return {
        count: Math.round(totalContracts * multiplier.count),
        amount: Math.round(totalAmount * multiplier.amount),
        average: average
    };
}

// В компоненте StatisticsCards:
