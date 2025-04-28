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

    if (selectedModel !== 'all') {
        const modelData = apiData.find(model => model.model_id === selectedModel);

        if (modelData) {
            if (selectedRegion !== 'all') {
                const regionData = modelData.filter_by_region?.find(r => r.region_id === selectedRegion);

                if (regionData) {
                    totalContracts = parseInt(regionData.total_contracts || 0);
                    totalAmount = parseInt(regionData.total_price || 0);
                }
            } else {
                if (modelData.filter_by_region && Array.isArray(modelData.filter_by_region)) {
                    modelData.filter_by_region.forEach(region => {
                        totalContracts += parseInt(region.total_contracts || 0);
                        totalAmount += parseInt(region.total_price || 0);
                    });
                }
            }
        }
    } else if (selectedRegion !== 'all') {
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
        apiData.forEach(model => {
            if (model.filter_by_region && Array.isArray(model.filter_by_region)) {
                model.filter_by_region.forEach(region => {
                    totalContracts += parseInt(region.total_contracts || 0);
                    totalAmount += parseInt(region.total_price || 0);
                });
            }
        });
    }

    const average = totalContracts > 0 ? Math.round(totalAmount / totalContracts) : 0;

    const tabMultipliers = {
        contracts: { count: 1, amount: 1 },
        sales: { count: 1, amount: 1 },
        stock: { count: 1, amount: 1 },
        retail: { count: 1, amount: 1 },
        wholesale: { count: 1, amount: 1 },
        promotions: { count: 1, amount: 1 }
    };

    const multiplier = tabMultipliers[activeTab] || tabMultipliers.contracts;

    return {
        count: Math.round(totalContracts * multiplier.count),
        amount: Math.round(totalAmount * multiplier.amount),
        average: average
    };
}