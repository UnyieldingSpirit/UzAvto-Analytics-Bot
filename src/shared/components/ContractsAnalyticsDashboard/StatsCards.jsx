import { useRef, useEffect, useState } from 'react';
import { FileText, CheckCircle, XCircle } from 'lucide-react';

const StatsCards = ({ 
  selectedPeriod, 
  selectedDetailLabel, 
  selectedModel, 
  detailedData, 
  activeMetric, 
  setActiveMetric, 
  carModels,
  modelPerformance 
}) => {
  // Анимация для чисел
  const valueRefs = {
    contracts: useRef(null),
    realization: useRef(null),
    cancellation: useRef(null)
  };
  
  // Используем состояние вместо useRef для хранения значений, 
  // чтобы компонент перерисовывался при изменении данных
  const [totalValues, setTotalValues] = useState({
    contracts: 0,
    realization: 0,
    cancellation: 0
  });
  
  // Обновляем значения при изменении входных данных
  useEffect(() => {
    // Функция для получения актуальных значений
    const calculateValues = () => {
      // Если нет данных, возвращаем нули
      if (!detailedData || !detailedData.totals) {
        console.error("Отсутствуют данные для отображения", detailedData);
        return {
          contracts: 0,
          realization: 0,
          cancellation: 0
        };
      }

      // Если выбрана конкретная модель и есть данные о ее производительности
      if (selectedModel !== 'all' && modelPerformance && modelPerformance[selectedModel]) {
        console.log(`Используем данные для модели ${selectedModel}:`, modelPerformance[selectedModel]);
        return {
          contracts: modelPerformance[selectedModel].contracts || 0,
          realization: modelPerformance[selectedModel].realization || 0,
          cancellation: modelPerformance[selectedModel].cancellation || 0
        };
      }
      
      console.log("Используем общие данные detailedData.totals:", detailedData.totals);
      
      // В противном случае используем общие данные
      return {
        contracts: detailedData.totals.contracts || 0,
        realization: detailedData.totals.realization || 0,
        cancellation: detailedData.totals.cancellation || 0
      };
    };
    
    // Рассчитываем новые значения и обновляем состояние
    const newValues = calculateValues();
    console.log("Обновляем значения:", newValues);
    setTotalValues(newValues);
    
  }, [detailedData, selectedModel, modelPerformance]); // Зависимости для useEffect
  
  // Эффект для анимации чисел при изменении totalValues
  useEffect(() => {
    // Анимация для чисел
    Object.keys(valueRefs).forEach(key => {
      if (valueRefs[key].current) {
        const target = totalValues[key];
        const duration = 1500;
        const start = Date.now();
        const startValue = parseInt(valueRefs[key].current.textContent.replace(/[^0-9.-]/g, '')) || 0;
        
        const animate = () => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
          
          const currentValue = Math.floor(startValue + (target - startValue) * easedProgress);
          if (valueRefs[key].current) {
            valueRefs[key].current.textContent = currentValue.toLocaleString('ru-RU');
          }
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        
        animate();
      }
    });
  }, [totalValues]);

  // Форматируем период для заголовка
  const getFormattedPeriod = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // Выбираем тип периода
    if (selectedPeriod === 'year') {
      return `за ${currentYear} год`;
    } else if (selectedPeriod === 'quarter') {
      return 'за полгода';
    } else if (selectedPeriod === 'month') {
      const monthName = today.toLocaleString('ru-RU', { month: 'long' });
      return `за ${monthName}`;
    } else if (selectedPeriod === 'week') {
      return 'за текущую неделю';
    } else if (selectedPeriod === 'custom') {
      return 'за выбранный период';
    }
    
    return 'за выбранный период';
  };

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-5 border border-gray-700/60 shadow-lg mb-5 hover:shadow-xl transition-all duration-300">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 mr-2">
          <span className="text-indigo-400 text-lg">📊</span>
        </div>
        <span>Статистика {getFormattedPeriod()}</span>
        {selectedModel !== 'all' && carModels && (
          <span className="ml-2 text-indigo-400 text-sm font-medium">
            ({carModels.find(m => m.id === selectedModel)?.name})
          </span>
        )}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Карточка Контракты */}
        <div 
          className={`rounded-xl p-4 border ${activeMetric === 'contracts' ? 'border-indigo-500' : 'border-gray-700/60'} ${activeMetric === 'contracts' ? 'bg-indigo-900/30' : 'bg-gray-800/60'} transition-all duration-300 cursor-pointer hover:shadow-md hover:translate-y-[-2px] group`}
          onClick={() => setActiveMetric('contracts')}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-500/30 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
              <FileText size={18} className="text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-indigo-400 mb-1">Контракты</h3>
              <div className="flex items-baseline">
                <span ref={valueRefs.contracts} className="text-2xl font-bold text-white">
                  {totalValues.contracts.toLocaleString('ru-RU')}
                </span>
                <span className="ml-1.5 text-xs font-medium text-gray-400">
                  шт
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Карточка Реализация */}
        <div 
          className={`rounded-xl p-4 border ${activeMetric === 'realization' ? 'border-emerald-500' : 'border-gray-700/60'} ${activeMetric === 'realization' ? 'bg-emerald-900/30' : 'bg-gray-800/60'} transition-all duration-300 cursor-pointer hover:shadow-md hover:translate-y-[-2px] group`}
          onClick={() => setActiveMetric('realization')}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500/30 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
              <CheckCircle size={18} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-emerald-400 mb-1">Реализация</h3>
              <div className="flex items-baseline">
                <span ref={valueRefs.realization} className="text-2xl font-bold text-white">
                  {totalValues.realization.toLocaleString('ru-RU')}
                </span>
                <span className="ml-1.5 text-xs font-medium text-gray-400">
                  шт
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Карточка Отмена */}
        <div 
          className={`rounded-xl p-4 border ${activeMetric === 'cancellation' ? 'border-red-500' : 'border-gray-700/60'} ${activeMetric === 'cancellation' ? 'bg-red-900/30' : 'bg-gray-800/60'} transition-all duration-300 cursor-pointer hover:shadow-md hover:translate-y-[-2px] group`}
          onClick={() => setActiveMetric('cancellation')}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/30 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
              <XCircle size={18} className="text-red-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-red-400 mb-1">Отмена</h3>
              <div className="flex items-baseline">
                <span ref={valueRefs.cancellation} className="text-2xl font-bold text-white">
                  {totalValues.cancellation.toLocaleString('ru-RU')}
                </span>
                <span className="ml-1.5 text-xs font-medium text-gray-400">
                  шт
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;