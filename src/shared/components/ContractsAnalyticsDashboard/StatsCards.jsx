import { useRef, useEffect } from 'react';
import { formatNumber } from './utils/formatters';

const StatsCards = ({ 
  selectedPeriod, 
  selectedDetailLabel, 
  selectedModel, 
  detailedData, 
  activeMetric, 
  setActiveMetric, 
  carModels 
}) => {
  // Анимация для чисел
  const valueRefs = {
    contracts: useRef(null),
    realization: useRef(null),
    cancellation: useRef(null)
  };
  
  // Эффект для анимации чисел
  useEffect(() => {
    // Анимация для чисел
    Object.keys(valueRefs).forEach(key => {
      if (valueRefs[key].current && detailedData.totals) {
        const target = detailedData.totals[key];
        const duration = 1500;
        const start = Date.now();
        const startValue = parseInt(valueRefs[key].current.textContent.replace(/[^0-9.-]/g, '')) || 0;
        
        const animate = () => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
          
          const currentValue = Math.floor(startValue + (target - startValue) * easedProgress);
          if (valueRefs[key].current) {
            valueRefs[key].current.textContent = formatNumber(currentValue);
          }
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        
        animate();
      }
    });
  }, [detailedData]);
  
  // Получение цвета для отображения изменений
  const getChangeColor = (change) => {
    const changeNum = parseFloat(change);
    if (changeNum > 0) return 'text-emerald-500';
    if (changeNum < 0) return 'text-red-500';
    return 'text-gray-400';
  };
  
  // Получение стрелки для изменений
  const getChangeIcon = (change) => {
    const changeNum = parseFloat(change);
    if (changeNum > 0) return '↑';
    if (changeNum < 0) return '↓';
    return '—';
  };
  
  // Карточка метрики
  const MetricCard = ({ title, icon, value, change, color, isActive, onClick }) => {
    const borderClass = isActive ? `border-${color}-500` : 'border-gray-700';
    const bgClass = isActive ? `bg-${color}-900/30` : 'bg-gray-800/80';
    
    return (
      <div 
        className={`rounded-lg p-5 border ${borderClass} ${bgClass} transition-all duration-300 cursor-pointer hover:shadow-xl hover:scale-105`}
        onClick={onClick}
      >
        <div className="flex items-center">
          <div className={`w-14 h-14 rounded-full bg-${color}-500/30 flex items-center justify-center mr-4 shadow-lg`}>
            <span className="text-2xl">{icon}</span>
          </div>
          <div className="flex-1">
            <h3 className="text-sm text-gray-400 font-semibold">{title}</h3>
            <div className="flex items-baseline">
              <span ref={valueRefs[value.toLowerCase()]} className="text-2xl font-bold text-white">
                {detailedData.totals ? formatNumber(detailedData.totals[value.toLowerCase()]) : '—'}
              </span>
              <span className={`ml-2 text-sm font-medium ${getChangeColor(detailedData.changes?.[value.toLowerCase()])}`}>
                {getChangeIcon(detailedData.changes?.[value.toLowerCase()])} {Math.abs(detailedData.changes?.[value.toLowerCase()] || 0)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/60 shadow-lg mb-6 hover:shadow-xl transition-all duration-300">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center">
        <span className="text-2xl mr-2">📊</span> 
        Статистика {selectedPeriod === 'month' ? 'за месяц' : 
                    selectedPeriod === 'week' ? 'за неделю' : 
                    selectedPeriod === 'quarter' ? 'за полгода' : 
                    selectedPeriod === 'custom' ? 'за выбранный период' : 'за год'}
        {selectedDetailLabel && (
          <span className="ml-2 text-indigo-400">
            ({selectedDetailLabel})
          </span>
        )}
        {selectedModel !== 'all' && (
          <span className="ml-2 text-indigo-400">
            ({carModels.find(m => m.id === selectedModel)?.name})
          </span>
        )}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard 
          title="Контракты" 
          icon="📝"
          value="contracts"
          change={detailedData.changes?.contracts}
          color="indigo"
          isActive={activeMetric === 'contracts'}
          onClick={() => setActiveMetric('contracts')}
        />
        <MetricCard 
          title="Реализация" 
          icon="✅"
          value="realization"
          change={detailedData.changes?.realization}
          color="emerald"
          isActive={activeMetric === 'realization'}
          onClick={() => setActiveMetric('realization')}
        />
        <MetricCard 
          title="Отмена" 
          icon="❌"
          value="cancellation"
          change={detailedData.changes?.cancellation}
          color="red"
          isActive={activeMetric === 'cancellation'}
          onClick={() => setActiveMetric('cancellation')}
        />
      </div>
    </div>
  );
};

export default StatsCards;