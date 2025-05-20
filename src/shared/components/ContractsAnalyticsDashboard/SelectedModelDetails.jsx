// src/shared/components/ContractsAnalyticsDashboard/SelectedModelDetails.jsx
import { formatNumber } from './utils/formatters';

const SelectedModelDetails = ({ t, currentLocale, selectedModel, selectedPeriod, carModels, modelPerformance, regions, getPeriodLabel }) => {
  if (selectedModel === 'all') return null;
  
  const model = carModels.find(m => m.id === selectedModel);
  if (!model) return null;
  
  const modelStats = modelPerformance[model.id] || {};
  
  // Получаем данные по регионам непосредственно из исходных данных API
  const getRegionsWithContracts = () => {
    // Проверяем, есть ли у модели данные filter_by_month
    if (!modelStats.filter_by_month || !Array.isArray(modelStats.filter_by_month)) {
      return [];
    }
    
    // Преобразуем данные по регионам
    return modelStats.filter_by_month.map(region => {
      // Вычисляем общее количество контрактов по всем месяцам
      const totalContracts = region.data.reduce((sum, month) => {
        return sum + parseInt(month.order_count || 0);
      }, 0);
      
      return {
        regionId: region.region_id,
        regionName: region.region_name,
        contracts: totalContracts
      };
    }).filter(region => region.contracts > 0) // Фильтруем только регионы с контрактами
     .sort((a, b) => b.contracts - a.contracts); // Сортируем по убыванию количества контрактов
  };
  
  const regionContracts = getRegionsWithContracts();
  
  return (
    <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-gray-700/60 shadow-lg hover:shadow-xl transition-all duration-300 mb-4 md:mb-6">
      <h3 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4 flex items-center">
        <span className="text-xl md:text-2xl mr-2">🔍</span> 
        {t('details.title', { 
          model: model.name,
          period: t(`period.${selectedPeriod}`)
        })}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-gray-900/70 rounded-xl overflow-hidden border border-gray-700/50">
          <div className="h-40 md:h-48 flex items-center justify-center bg-gradient-to-b from-gray-800 to-gray-900">
            <img 
              src={model.img} 
              alt={model.name} 
              className="h-full object-contain p-4"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://telegra.ph/file/e54ca862bac1f2187ddde.png';
              }}
            />
          </div>
          <div className="p-3 md:p-4">
            <h4 className="text-base md:text-lg font-bold text-white">{model.name}</h4>
            <p className="text-gray-400 mb-2 md:mb-3 text-sm md:text-base">{
              t(`details.carCategories.${model.category}`)
            }</p>
            
            <div className="grid grid-cols-1 gap-2 mb-2 md:mb-3">
              <div className="bg-gray-800/80 rounded-lg p-2 md:p-3">
                <p className="text-xs text-gray-400">{t('stats.contracts')}</p>
                <p className="text-base md:text-lg font-bold text-indigo-400">{modelStats.contracts || 0}</p>
              </div>
              <div className="bg-gray-800/80 rounded-lg p-2 md:p-3">
                <p className="text-xs text-gray-400">{t('stats.realization')}</p>
                <p className="text-base md:text-lg font-bold text-emerald-400">{modelStats.realization || 0}</p>
              </div>
              <div className="bg-gray-800/80 rounded-lg p-2 md:p-3">
                <p className="text-xs text-gray-400">{t('stats.cancellation')}</p>
                <p className="text-base md:text-lg font-bold text-red-400">{modelStats.cancellation || 0}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900/70 rounded-xl p-3 md:p-4 border border-gray-700/50">
          <h4 className="text-base md:text-lg font-bold text-white mb-2 md:mb-3">{t('details.regionDistribution')}</h4>
          
          {regionContracts.length > 0 ? (
            <div className="space-y-1.5 md:space-y-2 max-h-[300px] md:max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
              {regionContracts.map((region) => (
                <div key={region.regionId} className="flex justify-between items-center p-1.5 md:p-2 bg-gray-800/60 rounded-lg">
                  <span className="text-gray-300 text-xs md:text-sm">{region.regionName}</span>
                  <span className="text-indigo-400 font-medium text-xs md:text-sm">{region.contracts} {t('stats.pieces')}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm md:text-base">
              {t('details.noRegionData')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectedModelDetails;