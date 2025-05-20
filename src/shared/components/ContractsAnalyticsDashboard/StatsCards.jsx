// src/shared/components/ContractsAnalyticsDashboard/StatsCards.jsx
import { useRef, useEffect, useState } from 'react';
import { FileText, CheckCircle, XCircle } from 'lucide-react';

const StatsCards = ({ 
  t, // добавляем перевод
  currentLocale, // добавляем текущую локаль
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

  // Отслеживаем, были ли обновлены значения, чтобы избежать бесконечного цикла
  const hasUpdatedValues = useRef(false);
  
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
    
    // Только устанавливаем новые значения, если они отличаются от текущих
    if (
      totalValues.contracts !== newValues.contracts ||
      totalValues.realization !== newValues.realization ||
      totalValues.cancellation !== newValues.cancellation
    ) {
      setTotalValues(newValues);
      hasUpdatedValues.current = true; // Отмечаем, что значения были обновлены
    }
    
  }, [detailedData, selectedModel, modelPerformance]); // Зависимости для useEffect
  
  // Эффект для анимации чисел при изменении totalValues
  useEffect(() => {
    // Пропускаем анимацию при первом рендере или если значения не были обновлены
    if (!hasUpdatedValues.current) {
      return;
    }

    // Сбрасываем флаг, чтобы не запускать анимацию дважды для одних и тех же данных
    hasUpdatedValues.current = false;

    // Анимация для чисел
    Object.keys(valueRefs).forEach(key => {
      if (valueRefs[key].current) {
        const target = totalValues[key];
        const duration = 1500;
        const start = Date.now();
        const startValue = parseInt(valueRefs[key].current.textContent.replace(/[^0-9.-]/g, '')) || 0;
        
        // Функция анимации для одного числа
        const animate = () => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
          
          const currentValue = Math.floor(startValue + (target - startValue) * easedProgress);
          if (valueRefs[key].current) {
            valueRefs[key].current.textContent = currentValue.toLocaleString(currentLocale === 'uz' ? 'uz-UZ' : 'ru-RU');
          }
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        
        // Запуск анимации
        animate();
      }
    });
  }, [totalValues, currentLocale]);

  // Получаем формат периода в зависимости от локали
  const getFormattedPeriod = () => {
    return t(`period.${selectedPeriod}`);
  };

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 md:p-5 border border-gray-700/60 shadow-lg mb-4 md:mb-5 hover:shadow-xl transition-all duration-300">
      <h3 className="text-base md:text-lg font-bold text-white mb-3 md:mb-4 flex items-center">
        <div className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full bg-indigo-500/20 mr-2">
          <span className="text-indigo-400 text-base md:text-lg">📊</span>
        </div>
        <span>{t('stats.title', { period: getFormattedPeriod() })}</span>
        {selectedModel !== 'all' && carModels && (
          <span className="ml-2 text-indigo-400 text-xs md:text-sm font-medium">
            ({carModels.find(m => m.id === selectedModel)?.name})
          </span>
        )}
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        {/* Карточка Контракты */}
        <div 
          className={`rounded-xl p-3 md:p-4 border ${activeMetric === 'contracts' ? 'border-indigo-500' : 'border-gray-700/60'} ${activeMetric === 'contracts' ? 'bg-indigo-900/30' : 'bg-gray-800/60'} transition-all duration-300 cursor-pointer hover:shadow-md hover:translate-y-[-2px] group`}
          onClick={() => setActiveMetric('contracts')}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-indigo-500/30 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
              <FileText size={16} className="text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-bold text-indigo-400 mb-1">{t('stats.contracts')}</h3>
              <div className="flex items-baseline">
                <span ref={valueRefs.contracts} className="text-xl md:text-2xl font-bold text-white">
                  {totalValues.contracts.toLocaleString(currentLocale === 'uz' ? 'uz-UZ' : 'ru-RU')}
                </span>
                <span className="ml-1.5 text-xs font-medium text-gray-400">
                  {t('stats.pieces')}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Карточка Реализация */}
        <div 
          className={`rounded-xl p-3 md:p-4 border ${activeMetric === 'realization' ? 'border-emerald-500' : 'border-gray-700/60'} ${activeMetric === 'realization' ? 'bg-emerald-900/30' : 'bg-gray-800/60'} transition-all duration-300 cursor-pointer hover:shadow-md hover:translate-y-[-2px] group`}
          onClick={() => setActiveMetric('realization')}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-emerald-500/30 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
              <CheckCircle size={16} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-bold text-emerald-400 mb-1">{t('stats.realization')}</h3>
              <div className="flex items-baseline">
                <span ref={valueRefs.realization} className="text-xl md:text-2xl font-bold text-white">
                  {totalValues.realization.toLocaleString(currentLocale === 'uz' ? 'uz-UZ' : 'ru-RU')}
                </span>
                <span className="ml-1.5 text-xs font-medium text-gray-400">
                  {t('stats.pieces')}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Карточка Отмена */}
        <div 
          className={`rounded-xl p-3 md:p-4 border ${activeMetric === 'cancellation' ? 'border-red-500' : 'border-gray-700/60'} ${activeMetric === 'cancellation' ? 'bg-red-900/30' : 'bg-gray-800/60'} transition-all duration-300 cursor-pointer hover:shadow-md hover:translate-y-[-2px] group`}
          onClick={() => setActiveMetric('cancellation')}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-red-500/30 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
              <XCircle size={16} className="text-red-400" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-bold text-red-400 mb-1">{t('stats.cancellation')}</h3>
              <div className="flex items-baseline">
                <span ref={valueRefs.cancellation} className="text-xl md:text-2xl font-bold text-white">
                  {totalValues.cancellation.toLocaleString(currentLocale === 'uz' ? 'uz-UZ' : 'ru-RU')}
                </span>
                <span className="ml-1.5 text-xs font-medium text-gray-400">
                  {t('stats.pieces')}
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