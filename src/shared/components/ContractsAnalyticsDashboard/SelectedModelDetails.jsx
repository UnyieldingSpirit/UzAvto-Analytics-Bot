import { formatNumber } from './utils/formatters';

const SelectedModelDetails = ({ selectedModel, selectedPeriod, carModels, modelPerformance, regions, getPeriodLabel }) => {
  if (selectedModel === 'all') return null;
  
  const model = carModels.find(m => m.id === selectedModel);
  if (!model) return null;
  
  const modelStats = modelPerformance[model.id] || {};
  
  return (
    <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/60 shadow-lg hover:shadow-xl transition-all duration-300 mb-6">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
        <span className="text-2xl mr-2">🔍</span> 
        Детальная информация: {model.name} {getPeriodLabel(selectedPeriod).toLowerCase()}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900/70 rounded-xl overflow-hidden border border-gray-700/50">
          <div className="h-48 flex items-center justify-center bg-gradient-to-b from-gray-800 to-gray-900">
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
          <div className="p-4">
            <h4 className="text-lg font-bold text-white">{model.name}</h4>
            <p className="text-gray-400 mb-3">{
              model.category === 'sedan' ? 'Седан' :
              model.category === 'suv' ? 'Внедорожник' :
              model.category === 'minivan' ? 'Минивэн' : 
              model.category
            }</p>
            
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-gray-800/80 rounded-lg p-3">
                <p className="text-xs text-gray-400">Контракты</p>
                <p className="text-lg font-bold text-indigo-400">{formatNumber(modelStats.contracts || 0)}</p>
              </div>
              <div className="bg-gray-800/80 rounded-lg p-3">
                <p className="text-xs text-gray-400">Реализация</p>
                <p className="text-lg font-bold text-emerald-400">{formatNumber(modelStats.realization || 0)}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Конверсия:</span>
              <span className="text-sm font-medium text-white">{modelStats.conversion || 0}%</span>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full mt-1 overflow-hidden">
              <div 
                className="h-full bg-indigo-500 rounded-full"
                style={{ width: `${modelStats.conversion || 0}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="bg-gray-900/70 rounded-xl p-4 border border-gray-700/50">
            <h4 className="text-lg font-bold text-white mb-3">Распределение по регионам</h4>
            
            <div className="space-y-3">
              {regions.slice(0, 4).map((region, index) => {
                const value = 20 + Math.floor(Math.random() * 60);
                return (
                  <div key={region.id} className="flex flex-col">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{region.name}</span>
                      <span className="text-gray-400">{value}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full"
                        style={{ 
                          width: `${value}%`,
                          background: index === 0 ? 'linear-gradient(90deg, #4f46e5, #6366f1)' :
                                    index === 1 ? 'linear-gradient(90deg, #8b5cf6, #a78bfa)' :
                                    index === 2 ? 'linear-gradient(90deg, #ec4899, #f472b6)' :
                                    'linear-gradient(90deg, #10b981, #34d399)'
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="bg-gray-900/70 rounded-xl p-4 border border-gray-700/50 flex-1">
            <h4 className="text-lg font-bold text-white mb-3">Характеристики контрактов</h4>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-800/60 p-3 rounded-lg">
                <p className="text-xs text-gray-400">Средний срок</p>
                <p className="text-lg font-bold text-white">{Math.floor(Math.random() * 12) + 12} мес.</p>
              </div>
              <div className="bg-gray-800/60 p-3 rounded-lg">
                <p className="text-xs text-gray-400">Ср. предоплата</p>
                <p className="text-lg font-bold text-white">{Math.floor(Math.random() * 20) + 20}%</p>
              </div>
            </div>
            
            <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-lg p-3">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center mr-3">
                  <span className="text-lg">📝</span>
                </div>
                <p className="text-indigo-300 text-sm">
                  Наиболее популярная комплектация: <span className="font-medium">Премиум</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectedModelDetails;