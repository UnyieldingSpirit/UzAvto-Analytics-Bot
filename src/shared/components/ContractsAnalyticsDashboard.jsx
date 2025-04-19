'use client'
import { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { carModels, regions } from '../mocks/mock-data';

const FilterPanel = ({ 
  selectedModel, 
  setSelectedModel,
  selectedPeriod,
  setSelectedPeriod,
  isCustomPeriod,
  setIsCustomPeriod,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  handleCustomPeriodSelect,
  getPeriodLabel,
  carModels
}) => {
  const datePickerRef = useRef(null);
  const [showAllModels, setShowAllModels] = useState(false);
  const [showCustomPeriod, setShowCustomPeriod] = useState(false);
  
  // Создаем временные даты для произвольного периода
  const [tempStartDate, setTempStartDate] = useState(customStartDate);
  const [tempEndDate, setTempEndDate] = useState(customEndDate);
  
  // Обработчик быстрого выбора периода
  const handlePresetPeriod = (days) => {
    const end = new Date();
    const start = new Date();
    
    if (days === 7) {
      start.setDate(end.getDate() - 7);
    } else if (days === 30) {
      start.setDate(end.getDate() - 30);
    } else if (days === 90) { // 3 месяца
      start.setMonth(end.getMonth() - 3);
    } else if (days === 180) { // 6 месяцев
      start.setMonth(end.getMonth() - 6);
    } else if (days === 365) { // год
      start.setFullYear(end.getFullYear() - 1);
    }
    
    setCustomStartDate(start);
    setCustomEndDate(end);
    setIsCustomPeriod(true);
    setSelectedPeriod('custom');
    handleCustomPeriodSelect();
  };
  
  // Применение произвольного периода
  const applyCustomPeriod = () => {
    setCustomStartDate(tempStartDate);
    setCustomEndDate(tempEndDate);
    setIsCustomPeriod(true);
    setSelectedPeriod('custom');
    handleCustomPeriodSelect();
    setShowCustomPeriod(false);
  };
  
  return (
    <div className="bg-gradient-to-b from-gray-800/90 to-gray-900/90 rounded-xl p-5 border border-gray-700/70 shadow-lg mb-6 backdrop-blur-sm transition-all duration-300 hover:shadow-indigo-900/10">
      <div className="flex items-center justify-between mb-5 border-b border-gray-700/50 pb-4">
        <h3 className="text-lg font-bold text-white flex items-center">
          <span className="mr-2 text-xl bg-indigo-500/20 w-8 h-8 rounded-full flex items-center justify-center shadow-inner shadow-indigo-500/10">🔍</span> 
          Параметры аналитики
        </h3>
        
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedModel('all');
              setSelectedPeriod('year');
              setIsCustomPeriod(false);
              setShowCustomPeriod(false);
            }}
            className="text-xs px-2.5 py-1.5 rounded-md bg-gray-700/70 text-gray-300 hover:bg-gray-600 transition-all flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Сбросить фильтры
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Выбор модели */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
          <h4 className="text-sm text-gray-300 font-medium mb-3 flex items-center justify-between">
            <div className="flex items-center">
              <span className="mr-2 text-base bg-indigo-500/10 w-6 h-6 rounded-full flex items-center justify-center">🚗</span>
              Модель автомобиля
            </div>
            {selectedModel !== 'all' && (
              <button 
                onClick={() => setSelectedModel('all')}
                className="text-xs px-2 py-0.5 rounded bg-gray-700/70 text-gray-300 hover:bg-gray-600 transition-all"
              >
                Сбросить
              </button>
            )}
          </h4>
          
          <div className="grid grid-cols-3 gap-2 mb-2">
            <button 
              className={`rounded-md p-2 transition-all flex flex-col items-center justify-center ${
                selectedModel === 'all' ? 'bg-indigo-600/80 text-white shadow-md' : 'bg-gray-700/60 text-gray-300 hover:bg-gray-700/90'
              }`}
              onClick={() => setSelectedModel('all')}
            >
              <span className="text-lg mb-1">🔍</span>
              <span className="text-xs font-medium">Все модели</span>
            </button>
            
            {carModels.slice(0, 5).map(model => (
              <button 
                key={model.id}
                className={`rounded-md p-2 transition-all flex flex-col items-center justify-center ${
                  selectedModel === model.id ? 'bg-indigo-600/80 text-white shadow-md' : 'bg-gray-700/60 text-gray-300 hover:bg-gray-700/90'
                }`}
                onClick={() => setSelectedModel(model.id)}
              >
                <img 
                  src={model.img} 
                  alt={model.name} 
                  className="w-8 h-8 object-contain mb-1" 
                />
                <span className="text-xs font-medium truncate w-full text-center">{model.name}</span>
              </button>
            ))}
          </div>
          
          {carModels.length > 5 && (
            <>
              <button 
                onClick={() => setShowAllModels(!showAllModels)}
                className="w-full py-1.5 text-xs font-medium text-indigo-300 hover:text-indigo-200 transition-all flex items-center justify-center"
              >
                {showAllModels ? 'Скрыть' : 'Показать все модели'}
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-3.5 w-3.5 ml-1 transition-transform ${showAllModels ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showAllModels && (
                <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-gray-700/40">
                  {carModels.slice(5).map(model => (
                    <button 
                      key={model.id}
                      className={`rounded-md p-2 transition-all flex flex-col items-center justify-center ${
                        selectedModel === model.id ? 'bg-indigo-600/80 text-white shadow-md' : 'bg-gray-700/60 text-gray-300 hover:bg-gray-700/90'
                      }`}
                      onClick={() => setSelectedModel(model.id)}
                    >
                      <img 
                        src={model.img} 
                        alt={model.name} 
                        className="w-8 h-8 object-contain mb-1" 
                      />
                      <span className="text-xs font-medium truncate w-full text-center">{model.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Выбор периода - полностью переработанный блок */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
          <h4 className="text-sm text-gray-300 font-medium mb-3 flex items-center justify-between">
            <div className="flex items-center">
              <span className="mr-2 text-base bg-indigo-500/10 w-6 h-6 rounded-full flex items-center justify-center">📅</span>
              Период анализа
            </div>
            {(selectedPeriod !== 'year' || isCustomPeriod) && (
              <button 
                onClick={() => {
                  setIsCustomPeriod(false);
                  setSelectedPeriod('year');
                  setShowCustomPeriod(false);
                }}
                className="text-xs px-2 py-0.5 rounded bg-gray-700/70 text-gray-300 hover:bg-gray-600 transition-all"
              >
                Сбросить
              </button>
            )}
          </h4>
          
          {/* Основные предустановленные периоды */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <button 
              className={`rounded-md py-2 transition-all ${
                selectedPeriod === 'week' && !isCustomPeriod 
                  ? 'bg-indigo-600/80 text-white shadow-md' 
                  : 'bg-gray-700/60 text-gray-300 hover:bg-gray-700/90'
              }`}
              onClick={() => {
                setSelectedPeriod('week');
                setIsCustomPeriod(false);
                setShowCustomPeriod(false);
              }}
            >
              <div className="flex flex-col items-center">
                <span className="text-lg mb-0.5">📊</span>
                <span className="text-xs font-medium">Неделя</span>
              </div>
            </button>
            <button 
              className={`rounded-md py-2 transition-all ${
                selectedPeriod === 'month' && !isCustomPeriod 
                  ? 'bg-indigo-600/80 text-white shadow-md' 
                  : 'bg-gray-700/60 text-gray-300 hover:bg-gray-700/90'
              }`}
              onClick={() => {
                setSelectedPeriod('month');
                setIsCustomPeriod(false);
                setShowCustomPeriod(false);
              }}
            >
              <div className="flex flex-col items-center">
                <span className="text-lg mb-0.5">📆</span>
                <span className="text-xs font-medium">Месяц</span>
              </div>
            </button>
            <button 
              className={`rounded-md py-2 transition-all ${
                selectedPeriod === 'quarter' && !isCustomPeriod 
                  ? 'bg-indigo-600/80 text-white shadow-md' 
                  : 'bg-gray-700/60 text-gray-300 hover:bg-gray-700/90'
              }`}
              onClick={() => {
                setSelectedPeriod('quarter');
                setIsCustomPeriod(false);
                setShowCustomPeriod(false);
              }}
            >
              <div className="flex flex-col items-center">
                <span className="text-lg mb-0.5">📋</span>
                <span className="text-xs font-medium">Полгода</span>
              </div>
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-3">
            <button 
              className={`rounded-md py-2 transition-all ${
                selectedPeriod === 'year' && !isCustomPeriod 
                  ? 'bg-indigo-600/80 text-white shadow-md' 
                  : 'bg-gray-700/60 text-gray-300 hover:bg-gray-700/90'
              }`}
              onClick={() => {
                setSelectedPeriod('year');
                setIsCustomPeriod(false);
                setShowCustomPeriod(false);
              }}
            >
              <div className="flex flex-col items-center">
                <span className="text-lg mb-0.5">📈</span>
                <span className="text-xs font-medium">Год</span>
              </div>
            </button>
            <button 
              className={`rounded-md py-2 transition-all ${
                isCustomPeriod && (customEndDate.getTime() - customStartDate.getTime()) / (1000 * 60 * 60 * 24) <= 30
                  ? 'bg-indigo-600/80 text-white shadow-md' 
                  : 'bg-gray-700/60 text-gray-300 hover:bg-gray-700/90'
              }`}
              onClick={() => handlePresetPeriod(30)}
            >
              <div className="flex flex-col items-center">
                <span className="text-lg mb-0.5">🗓️</span>
                <span className="text-xs font-medium">30 дней</span>
              </div>
            </button>
            <button 
              className={`rounded-md py-2 transition-all ${
                isCustomPeriod && (customEndDate.getTime() - customStartDate.getTime()) / (1000 * 60 * 60 * 24) <= 7
                  ? 'bg-indigo-600/80 text-white shadow-md' 
                  : 'bg-gray-700/60 text-gray-300 hover:bg-gray-700/90'
              }`}
              onClick={() => handlePresetPeriod(7)}
            >
              <div className="flex flex-col items-center">
                <span className="text-lg mb-0.5">📅</span>
                <span className="text-xs font-medium">7 дней</span>
              </div>
            </button>
          </div>
          
          {/* Выбор произвольного периода - переключение по кнопке */}
          <div className="mt-2">
            <button
              onClick={() => setShowCustomPeriod(!showCustomPeriod)}
              className={`w-full py-2 px-3 rounded-lg flex items-center justify-between transition-all ${
                showCustomPeriod || (isCustomPeriod && !([7, 30, 90, 180, 365].some(days => 
                  Math.abs((customEndDate.getTime() - customStartDate.getTime()) / (1000 * 60 * 60 * 24) - days) < 2)))
                  ? 'bg-indigo-600/80 text-white' 
                  : 'bg-gray-700/60 text-gray-300 hover:bg-gray-700/90'
              }`}
            >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium">
                  {isCustomPeriod 
                    ? `${customStartDate.toLocaleDateString('ru-RU', {day: 'numeric', month: 'short'})} — ${customEndDate.toLocaleDateString('ru-RU', {day: 'numeric', month: 'short'})}`
                    : 'Произвольный период'}
                </span>
              </div>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-4 w-4 transition-transform ${showCustomPeriod ? 'rotate-180' : ''}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showCustomPeriod && (
              <div className="mt-3 p-3 bg-gray-900/50 rounded-lg border border-gray-700/50 animate-slideDown">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Начало периода</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input 
                        type="date" 
                        value={tempStartDate.toISOString().split('T')[0]}
                        onChange={(e) => setTempStartDate(new Date(e.target.value))}
                        className="w-full pl-10 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Конец периода</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input 
                        type="date" 
                        value={tempEndDate.toISOString().split('T')[0]}
                        onChange={(e) => setTempEndDate(new Date(e.target.value))}
                        className="w-full pl-10 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Дополнительные опции быстрого выбора */}
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      setTempStartDate(new Date(new Date().setMonth(new Date().getMonth() - 3)));
                      setTempEndDate(new Date());
                    }}
                    className="px-2 py-1.5 text-xs bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700 transition-all"
                  >
                    3 месяца
                  </button>
                  <button
                    onClick={() => {
                      setTempStartDate(new Date(new Date().setMonth(new Date().getMonth() - 6)));
                      setTempEndDate(new Date());
                    }}
                    className="px-2 py-1.5 text-xs bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700 transition-all"
                  >
                    6 месяцев
                  </button>
                  <button
                    onClick={() => {
                      setTempStartDate(new Date(new Date().setFullYear(new Date().getFullYear() - 1)));
                      setTempEndDate(new Date());
                    }}
                    className="px-2 py-1.5 text-xs bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700 transition-all"
                  >
                    1 год
                  </button>
                </div>
                
                {/* Информация о выбранном периоде */}
                {tempStartDate && tempEndDate && tempEndDate >= tempStartDate && (
                  <div className="mt-3 py-2 px-3 bg-indigo-900/20 rounded-lg border border-indigo-500/30">
                    <div className="flex items-center text-indigo-300 text-xs">
                      <span className="mr-1.5">ℹ️</span>
                      Период: {Math.ceil((tempEndDate.getTime() - tempStartDate.getTime()) / (1000 * 60 * 60 * 24))} дней
                    </div>
                  </div>
                )}
                
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={applyCustomPeriod}
                    disabled={!(tempStartDate && tempEndDate && tempEndDate >= tempStartDate)}
                    className={`px-3 py-1.5 rounded-md text-sm flex items-center ${
                      tempStartDate && tempEndDate && tempEndDate >= tempStartDate
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    } transition-all`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Применить
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Индикатор выбранных фильтров */}
      <div className="mt-4 bg-gray-900/40 rounded-lg p-3 border border-gray-700/50">
        <div className="text-gray-400 text-xs mb-2">Активные фильтры:</div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-indigo-900/30 text-indigo-300 text-sm flex items-center border border-indigo-500/30">
            <span className="mr-1.5 text-base">🚗</span>
            <span className="mr-1 font-medium">Модель:</span>
            {selectedModel === 'all' ? 
              'Все модели' : 
              carModels.find(m => m.id === selectedModel)?.name || 'Модель не выбрана'}
            {selectedModel !== 'all' && (
              <button 
                onClick={() => setSelectedModel('all')}
                className="ml-2 text-indigo-300 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
          
          <div className="px-3 py-1.5 rounded-lg bg-indigo-900/30 text-indigo-300 text-sm flex items-center border border-indigo-500/30">
            <span className="mr-1.5 text-base">📅</span>
            <span className="mr-1 font-medium">Период:</span>
            {isCustomPeriod ? 
              `${customStartDate.toLocaleDateString('ru-RU', {day: 'numeric', month: 'short'})} — ${customEndDate.toLocaleDateString('ru-RU', {day: 'numeric', month: 'short'})}` : 
              getPeriodLabel(selectedPeriod)}
            {(selectedPeriod !== 'year' || isCustomPeriod) && (
              <button 
                onClick={() => {
                  setIsCustomPeriod(false);
                  setSelectedPeriod('year');
                }}
                className="ml-2 text-indigo-300 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown {
          animation: slideDown 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

const generateContractData = (selectedModelId = 'all', period = 'year') => {
  const data = [];
  
  let timeLabels = [];
  const currentYear = new Date().getFullYear();
  
  // Определяем метки времени в зависимости от выбранного периода
  switch (period) {
    case 'year':
      timeLabels = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
      break;
    case 'quarter':
      timeLabels = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь'];
      break;
    case 'month':
      // Генерируем последние 30 дней
      timeLabels = Array.from({ length: 30 }, (_, i) => `${i + 1}`);
      break;
    case 'week':
      // Дни недели
      timeLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
      break;
    default:
      timeLabels = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  }
  
  // Создаем объект с базовыми значениями для каждой модели
  const modelBaseValues = {};
  carModels.forEach(model => {
    // Базовые значения зависят от периода
    const multiplier = period === 'year' ? 1 : 
                       period === 'quarter' ? 1.2 : 
                       period === 'month' ? 0.15 : 
                       period === 'week' ? 0.05 : 1;
                       
    const baseContractRate = (80 + Math.random() * 120) * multiplier; 
    const realizationRate = 0.7 + Math.random() * 0.2; 
    const cancellationRate = 0.05 + Math.random() * 0.15; 
    
    modelBaseValues[model.id] = {
      baseContractRate,
      realizationRate,
      cancellationRate
    };
  });
  
  // Если выбрана конкретная модель, генерируем данные только для неё
  const relevantModels = selectedModelId === 'all' 
    ? carModels.map(m => m.id) 
    : [selectedModelId];
  
  timeLabels.forEach((label, index) => {
    const periodData = {
      name: label,
      contracts: 0,
      realization: 0,
      cancellation: 0
    };
    
    // Сезонный фактор общий для всех моделей
    const seasonalFactor = period === 'year' || period === 'quarter' 
      ? 1 + Math.sin(index / (period === 'year' ? 3 : 1.5)) * 0.2
      : 1 + Math.sin(index / (period === 'month' ? 10 : 3.5)) * 0.3;
    
    // Для каждой релевантной модели добавляем её вклад в общие показатели
    relevantModels.forEach(modelId => {
      const { baseContractRate, realizationRate, cancellationRate } = modelBaseValues[modelId];
      
      // Добавляем случайные колебания
      const contractRandom = 0.9 + Math.random() * 0.2;
      const realizationRandom = 0.85 + Math.random() * 0.3;
      const cancellationRandom = 0.7 + Math.random() * 0.6;
      
      // Расчет значений для модели с учетом тренда и случайности
      let minValue = period === 'year' ? 30 : period === 'quarter' ? 20 : period === 'month' ? 2 : 1;
      let maxValue = period === 'year' ? 200 : period === 'quarter' ? 240 : period === 'month' ? 30 : 10;
      
      const contractValue = Math.max(minValue, Math.min(maxValue, baseContractRate * seasonalFactor * contractRandom));
      const realizationValue = contractValue * realizationRate * realizationRandom;
      const cancellationValue = contractValue * cancellationRate * cancellationRandom;
      
      // Добавляем вклад модели в общие показатели
      periodData.contracts += Math.round(contractValue);
      periodData.realization += Math.round(realizationValue);
      periodData.cancellation += Math.round(cancellationValue);
    });
    
    data.push(periodData);
  });
  
  return data;
};

// Генерация данных для "последнего месяца/недели" с учетом выбранной модели и периода
const generateDetailedData = (selectedLabel = 'Ноябрь', selectedModelId = 'all', period = 'year') => {
  // Определяем количество дней для детализации
  let daysCount = 30; // По умолчанию для месяца
  
  if (period === 'week') {
    daysCount = 7;
  } else if (period === 'quarter' || period === 'year') {
    daysCount = 30; // Для квартала или года показываем дни последнего месяца
  }
  
  // Объект с базовыми значениями для каждой модели
  const modelBaseValues = {};
  carModels.forEach(model => {
    // Базовые значения зависят от периода
    const multiplier = period === 'year' ? 1 : 
                       period === 'quarter' ? 1.2 : 
                       period === 'month' ? 0.15 : 
                       period === 'week' ? 0.05 : 1;
                       
    const baseContractRate = (4 + Math.random() * 6) * multiplier;
    const realizationRate = 0.7 + Math.random() * 0.2;
    const cancellationRate = 0.05 + Math.random() * 0.15;
    
    modelBaseValues[model.id] = {
      baseContractRate,
      realizationRate,
      cancellationRate
    };
  });
  
  // Если выбрана конкретная модель, учитываем только её
  const relevantModels = selectedModelId === 'all' 
    ? carModels.map(m => m.id) 
    : [selectedModelId];
  
  const data = [];
  
  // Сумматоры для расчета средних показателей
  let totalContracts = 0;
  let totalRealization = 0;
  let totalCancellation = 0;
  
  // Генерируем данные по дням
  for (let day = 1; day <= daysCount; day++) {
    const dayData = {
      day: day,
      contracts: 0,
      realization: 0,
      cancellation: 0
    };
    
    // Сезонный фактор дня (например, в выходные меньше контрактов)
    const dayOfWeek = day % 7;
    const dayFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.7 : 1.0;
    
    // Для каждой релевантной модели добавляем её вклад
    relevantModels.forEach(modelId => {
      const { baseContractRate, realizationRate, cancellationRate } = modelBaseValues[modelId];
      
      // Случайные колебания для дня
      const contractRandom = 0.7 + Math.random() * 0.6;
      const realizationRandom = 0.85 + Math.random() * 0.3;
      const cancellationRandom = 0.7 + Math.random() * 0.6;
      
      // Расчет значений для модели на этот день
      const contractValue = Math.max(1, Math.round(baseContractRate * dayFactor * contractRandom));
      const realizationValue = Math.round(contractValue * realizationRate * realizationRandom);
      const cancellationValue = Math.round(contractValue * cancellationRate * cancellationRandom);
      
      // Добавляем вклад модели в общие показатели дня
      dayData.contracts += contractValue;
      dayData.realization += realizationValue;
      dayData.cancellation += cancellationValue;
      
      // Добавляем в общие суммы для расчета средних
      totalContracts += contractValue;
      totalRealization += realizationValue;
      totalCancellation += cancellationValue;
    });
    
    data.push(dayData);
  }
  
  // Расчет изменения по сравнению с предыдущим периодом (случайные значения)
  const getRandomChange = () => Math.round((Math.random() * 40) - 15);
  
  return {
    label: selectedLabel,
    data: data,
    totals: {
      contracts: Math.round(totalContracts / daysCount),
      realization: Math.round(totalRealization / daysCount),
      cancellation: Math.round(totalCancellation / daysCount)
    },
    changes: {
      contracts: getRandomChange(),
      realization: getRandomChange(),
      cancellation: getRandomChange()
    }
  };
};

// Генерация тепловой карты с учетом выбранной модели и периода
const generateHeatmapData = (selectedModelId = 'all', period = 'year') => {
  const heatmap = [];
  
  // Базовое значение зависит от модели и периода
  let baseValue = selectedModelId === 'all' ? 80 : 40; // Меньше значения для одной модели
  
  // Корректируем базовое значение в зависимости от периода
  switch (period) {
    case 'quarter':
      baseValue *= 1.2;
      break;
    case 'month':
      baseValue *= 0.5;
      break;
    case 'week':
      baseValue *= 0.2;
      break;
  }
  
  // Количество недель для отображения
  const weeksCount = period === 'week' ? 1 : 4;
  
  for (let week = 0; week < weeksCount; week++) {
    const weekData = { week: `Неделя ${week + 1}` };
    
    for (let day = 1; day <= 7; day++) {
      // В выходные (6,7) меньше контрактов
      const dayFactor = (day === 6 || day === 7) ? 0.7 : 1.0;
      // Значение для тепловой карты
      weekData[`day${day}`] = Math.round(baseValue * dayFactor * (0.5 + Math.random()));
    }
    
    heatmap.push(weekData);
  }
  
  return heatmap;
};

// Функция форматирования чисел для отображения
const formatNumber = (num) => {
  if (num === undefined || num === null) return '—';
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num;
};

// Получаем названия периодов
// Добавьте новый кейс в функцию getPeriodLabel:
const getPeriodLabel = (period) => {
  switch (period) {
    case 'year':
      return 'За год';
    case 'quarter':
      return 'За полгода';
    case 'month':
      return 'За месяц';
    case 'week':
      return 'За неделю';
    case 'custom':
      return 'За выбранный период';
    default:
      return 'За год';
  }
};

// И также в функцию getPeriodDescription:

// Добавьте эту функцию рядом с другими функциями генерации данных
const generateCustomPeriodData = (selectedModelId = 'all', startDate, endDate) => {
  const data = [];
  
  // Рассчитываем разницу в днях между датами
  const diffTime = Math.abs(endDate - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  // Если период большой, группируем по неделям
  const isLargePeriod = diffDays > 31;
  
  if (isLargePeriod) {
    // Группируем по неделям
    const startWeek = new Date(startDate);
    let currentWeek = new Date(startWeek);
    let weekCount = 1;
    
    while (currentWeek <= endDate) {
      const weekEndDate = new Date(currentWeek);
      weekEndDate.setDate(weekEndDate.getDate() + 6);
      
      const periodData = {
        name: `Неделя ${weekCount}`,
        week: weekCount,
        startDate: new Date(currentWeek),
        endDate: new Date(weekEndDate > endDate ? endDate : weekEndDate),
        contracts: Math.round(50 + Math.random() * 150),
        realization: Math.round(30 + Math.random() * 100),
        cancellation: Math.round(5 + Math.random() * 30)
      };
      
      data.push(periodData);
      
      currentWeek.setDate(currentWeek.getDate() + 7);
      weekCount++;
    }
  } else {
    // Показываем данные по дням
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const periodData = {
        name: currentDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
        date: new Date(currentDate),
        contracts: Math.round(5 + Math.random() * 20),
        realization: Math.round(3 + Math.random() * 15),
        cancellation: Math.round(1 + Math.random() * 5)
      };
      
      data.push(periodData);
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
  
  return data;
};
export default function ContractsAnalyticsDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('year');
  const [periodData, setPeriodData] = useState([]);
  const [selectedModel, setSelectedModel] = useState('all');
  const [selectedDetailLabel, setSelectedDetailLabel] = useState('');
  const [detailedData, setDetailedData] = useState({});
  const [chartType, setChartType] = useState('line');
  const [activeMetric, setActiveMetric] = useState('contracts');
  const [isLoading, setIsLoading] = useState(true);
  const [heatmapData, setHeatmapData] = useState([]);
  const [modelPerformance, setModelPerformance] = useState({});
const [isCustomPeriod, setIsCustomPeriod] = useState(false);
const [customStartDate, setCustomStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
const [customEndDate, setCustomEndDate] = useState(new Date());
const [showDatePicker, setShowDatePicker] = useState(false);
const [dateRange, setDateRange] = useState({
  preset: 'last30Days',
  startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
  endDate: new Date()
});
  // Расширяем данные моделей дополнительной информацией
  const [enhancedModels, setEnhancedModels] = useState([]);
const getPeriodDescription = (period) => {
  switch (period) {
    case 'year':
      return 'годовой отчет';
    case 'quarter':
      return 'отчет за полгода';
    case 'month':
      return 'отчет за последний месяц';
    case 'week':
      return 'отчет за последнюю неделю';
    case 'custom':
      return `отчет за период ${customStartDate?.toLocaleDateString('ru-RU')} — ${customEndDate.toLocaleDateString('ru-RU')}`;
    default:
      return 'годовой отчет';
  }
};
const handleCustomPeriodSelect = () => {
  setIsLoading(true);
  setIsCustomPeriod(true);
  setSelectedPeriod('custom');
  
  setTimeout(() => {
    // Сгенерируйте данные для кастомного периода
    const newPeriodData = generateCustomPeriodData(selectedModel, customStartDate, customEndDate);
    setPeriodData(newPeriodData);
    
    // Устанавливаем выбранный детальный период на основе первого элемента из данных периода
    const firstLabel = newPeriodData.length > 0 ? newPeriodData[0].name : 'День 1';
    setSelectedDetailLabel(firstLabel);
    
    setDetailedData(generateDetailedData(firstLabel, selectedModel, 'custom'));
    setHeatmapData(generateHeatmapData(selectedModel, 'custom'));
    setIsLoading(false);
  }, 500);
};
  // Анимация для чисел
  const valueRefs = {
    contracts: useRef(null),
    realization: useRef(null),
    cancellation: useRef(null)
  };
  
  // Инициализация данных
  useEffect(() => {
    setIsLoading(true);
    
    // Генерация расширенной информации о моделях
    const enrichedModels = carModels.map(model => {
      const performance = Math.round(40 + Math.random() * 60); // Рейтинг производительности 40-100%
      const trend = Math.round((Math.random() * 40) - 15); // Тренд -15% до +25%
      const sales = Math.round(1000 + Math.random() * 9000); // Объем продаж за период
      
      return {
        ...model,
        performance,
        trend,
        sales
      };
    });
    
    setEnhancedModels(enrichedModels);
    
    // Симулируем загрузку данных
    setTimeout(() => {
      const newPeriodData = generateContractData(selectedModel, selectedPeriod);
      setPeriodData(newPeriodData);
      
      // Устанавливаем выбранный детальный период на основе первого элемента из данных периода
      const firstLabel = newPeriodData.length > 0 ? newPeriodData[0].name : 'Январь';
      setSelectedDetailLabel(firstLabel);
      
      setDetailedData(generateDetailedData(firstLabel, selectedModel, selectedPeriod));
      setHeatmapData(generateHeatmapData(selectedModel, selectedPeriod));
      
      // Генерируем сравнительную статистику по моделям
      const perfData = {};
      carModels.forEach(model => {
        // Масштабируем данные в зависимости от периода
        const periodMultiplier = 
          selectedPeriod === 'year' ? 1 : 
          selectedPeriod === 'quarter' ? 0.6 : 
          selectedPeriod === 'month' ? 0.2 : 0.05;
          
        perfData[model.id] = {
          contracts: Math.round((200 + Math.random() * 800) * periodMultiplier),
          realization: Math.round((150 + Math.random() * 600) * periodMultiplier),
          cancellation: Math.round((20 + Math.random() * 100) * periodMultiplier),
          conversion: Math.round(60 + Math.random() * 30) // % конверсии (не зависит от периода)
        };
      });
      setModelPerformance(perfData);
      
      setIsLoading(false);
    }, 800);
  }, []);
  
  // Обновление данных при изменении выбранного периода
useEffect(() => {
  if (!isLoading) {
    setIsLoading(true);
    
    setTimeout(() => {
      let newPeriodData;
      
      // Если период кастомный, используем специальную функцию генерации
      if (selectedPeriod === 'custom') {
        newPeriodData = generateCustomPeriodData(selectedModel, customStartDate, customEndDate);
      } else {
        newPeriodData = generateContractData(selectedModel, selectedPeriod);
      }
      
      setPeriodData(newPeriodData);
      
      // Если период поменялся, сбрасываем выбранный детальный период на первый элемент
      const firstLabel = newPeriodData.length > 0 ? newPeriodData[0].name : 'Январь';
      setSelectedDetailLabel(firstLabel);
      
      setDetailedData(generateDetailedData(firstLabel, selectedModel, selectedPeriod));
      setHeatmapData(generateHeatmapData(selectedModel, selectedPeriod));
      
      // Обновляем сравнительную статистику по моделям с учетом периода
      const perfData = {};
      carModels.forEach(model => {
        const periodMultiplier = 
          selectedPeriod === 'year' ? 1 : 
          selectedPeriod === 'quarter' ? 0.6 : 
          selectedPeriod === 'month' ? 0.2 : 
          selectedPeriod === 'custom' ? 0.5 :
          0.05;
          
        perfData[model.id] = {
          contracts: Math.round((200 + Math.random() * 800) * periodMultiplier),
          realization: Math.round((150 + Math.random() * 600) * periodMultiplier),
          cancellation: Math.round((20 + Math.random() * 100) * periodMultiplier),
          conversion: Math.round(60 + Math.random() * 30) // % конверсии (не зависит от периода)
        };
      });
      setModelPerformance(perfData);
      
      setIsLoading(false);
    }, 500);
  }
}, [selectedPeriod, isCustomPeriod, customStartDate, customEndDate]); // Добавьте зависимости
  
  // Обновление данных при изменении выбранной модели
  useEffect(() => {
    if (!isLoading) {
      setIsLoading(true);
      
      setTimeout(() => {
        const newPeriodData = generateContractData(selectedModel, selectedPeriod);
        setPeriodData(newPeriodData);
        setDetailedData(generateDetailedData(selectedDetailLabel, selectedModel, selectedPeriod));
        setHeatmapData(generateHeatmapData(selectedModel, selectedPeriod));
        setIsLoading(false);
      }, 500);
    }
  }, [selectedModel]);
  
  // Обновление данных при выборе детального периода
  useEffect(() => {
    if (periodData.length > 0 && !isLoading && selectedDetailLabel) {
      setDetailedData(generateDetailedData(selectedDetailLabel, selectedModel, selectedPeriod));
    }
  }, [selectedDetailLabel, periodData, isLoading]);
  
  // Анимация для чисел
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
  
  // Получение цвета активной метрики
  const getMetricColor = (metric) => {
    switch (metric) {
      case 'contracts': return 'indigo';
      case 'realization': return 'emerald';
      case 'cancellation': return 'red';
      default: return 'indigo';
    }
  };
  
  // Цвета для графиков
  const getChartColors = (metric) => {
    switch (metric) {
      case 'contracts':
        return { stroke: '#4f46e5', fill: 'url(#colorContractsGradient)' };
      case 'realization':
        return { stroke: '#10b981', fill: 'url(#colorRealizationGradient)' };
      case 'cancellation':
        return { stroke: '#ef4444', fill: 'url(#colorCancellationGradient)' };
      default:
        return { stroke: '#4f46e5', fill: 'url(#colorContractsGradient)' };
    }
  };
  
  // Кастомный Tooltip для графиков
  const renderCustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800/95 p-4 rounded-lg shadow-xl border border-gray-700/60 backdrop-blur-sm">
          <p className="text-gray-200 font-medium text-base mb-2">{payload[0]?.payload.name || payload[0]?.payload.day}</p>
          <p className="text-indigo-400 font-medium flex items-center gap-2 mb-1.5">
            <span className="text-lg">📝</span> Контракты: {formatNumber(payload[0]?.payload.contracts)}
          </p>
          <p className="text-emerald-400 font-medium flex items-center gap-2 mb-1.5">
            <span className="text-lg">✅</span> Реализация: {formatNumber(payload[0]?.payload.realization)}
          </p>
          <p className="text-red-400 font-medium flex items-center gap-2">
            <span className="text-lg">❌</span> Отмена: {formatNumber(payload[0]?.payload.cancellation)}
          </p>
        </div>
      );
    }
    return null;
  };
  
  // Компонент графика
  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <LineChart data={periodData}>
            <defs>
              <linearGradient id="colorContractsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.2}/>
              </linearGradient>
              <linearGradient id="colorRealizationGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
              </linearGradient>
              <linearGradient id="colorCancellationGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="name" 
              stroke="#9ca3af"
              // Если много данных, показываем не все тики
              interval={selectedPeriod === 'month' ? 4 : 'preserveEnd'}
              angle={selectedPeriod === 'month' ? -45 : 0}
              textAnchor={selectedPeriod === 'month' ? 'end' : 'middle'}
              height={selectedPeriod === 'month' ? 60 : 30}
            />
            <YAxis stroke="#9ca3af" tickFormatter={formatNumber}/>
            <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
            <Tooltip content={renderCustomTooltip} />
            <Legend 
              verticalAlign="top" 
              height={36} 
              formatter={(value) => {
                const labels = {
                  contracts: "Контракты",
                  realization: "Реализация",
                  cancellation: "Отмена"
                };
                return <span style={{color: '#d1d5db', fontSize: '0.9rem'}}>{labels[value]}</span>
              }}
            />
            <Line 
              type="monotone" 
              dataKey="contracts" 
              stroke="#4f46e5" 
              strokeWidth={3}
              dot={{ stroke: '#4f46e5', fill: '#1f2937', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, stroke: 'white', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="realization" 
              stroke="#10b981" 
              strokeWidth={3} 
              dot={{ stroke: '#10b981', fill: '#1f2937', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, stroke: 'white', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="cancellation" 
              stroke="#ef4444" 
              strokeWidth={3}
              dot={{ stroke: '#ef4444', fill: '#1f2937', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, stroke: 'white', strokeWidth: 2 }}
            />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart data={periodData}>
            <defs>
              <linearGradient id="colorContractsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorRealizationGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorCancellationGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="name" 
              stroke="#9ca3af"
              interval={selectedPeriod === 'month' ? 4 : 'preserveEnd'}
              angle={selectedPeriod === 'month' ? -45 : 0}
              textAnchor={selectedPeriod === 'month' ? 'end' : 'middle'}
              height={selectedPeriod === 'month' ? 60 : 30}
            />
            <YAxis stroke="#9ca3af" tickFormatter={formatNumber}/>
            <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
            <Tooltip content={renderCustomTooltip} />
            <Legend 
              verticalAlign="top" 
              height={36} 
              formatter={(value) => {
                const labels = {
                  contracts: "Контракты",
                  realization: "Реализация",
                  cancellation: "Отмена"
                };
                return <span style={{color: '#d1d5db', fontSize: '0.9rem'}}>{labels[value]}</span>
              }}
            />
            <Area 
              type="monotone" 
              dataKey="contracts" 
              fill="url(#colorContractsGradient)" 
              stroke="#4f46e5" 
              strokeWidth={2}
              activeDot={{ r: 8 }}
            />
            <Area 
              type="monotone" 
              dataKey="realization" 
              fill="url(#colorRealizationGradient)" 
              stroke="#10b981" 
              strokeWidth={2}
              activeDot={{ r: 8 }}
            />
            <Area 
              type="monotone" 
              dataKey="cancellation" 
              fill="url(#colorCancellationGradient)" 
              stroke="#ef4444" 
              strokeWidth={2}
              activeDot={{ r: 8 }}
            />
          </AreaChart>
        );
      case 'bar':
        return (
          <BarChart data={periodData}>
            <XAxis 
              dataKey="name" 
              stroke="#9ca3af"
              interval={selectedPeriod === 'month' ? 4 : 'preserveEnd'}
              angle={selectedPeriod === 'month' ? -45 : 0}
              textAnchor={selectedPeriod === 'month' ? 'end' : 'middle'}
              height={selectedPeriod === 'month' ? 60 : 30}
            />
            <YAxis stroke="#9ca3af" tickFormatter={formatNumber}/>
            <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
            <Tooltip content={renderCustomTooltip} />
            <Legend 
              verticalAlign="top" 
              height={36} 
              formatter={(value) => {
                const labels = {
                  contracts: "Контракты",
                  realization: "Реализация",
                  cancellation: "Отмена"
                };
                return <span style={{color: '#d1d5db', fontSize: '0.9rem'}}>{labels[value]}</span>
              }}
            />
            <defs>
              <linearGradient id="contractsBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity={1}/>
                <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.6}/>
              </linearGradient>
              <linearGradient id="realizationBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={1}/>
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.6}/>
              </linearGradient>
              <linearGradient id="cancellationBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={1}/>
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.6}/>
              </linearGradient>
            </defs>
            <Bar 
              dataKey="contracts" 
              fill="url(#contractsBar)" 
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="realization" 
              fill="url(#realizationBar)" 
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="cancellation" 
              fill="url(#cancellationBar)" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        );
      default:
        return (
          <LineChart data={periodData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="contracts" 
              stroke="#4f46e5"
            />
            <Line 
              type="monotone" 
              dataKey="realization" 
              stroke="#10b981"
            />
            <Line 
              type="monotone" 
              dataKey="cancellation" 
              stroke="#ef4444"
            />
          </LineChart>
        );
    }
  };
  
  // График для детализации по дням выбранного периода
  const renderDetailedChart = () => {
    if (!detailedData.data) return null;
    
    return (
      <LineChart data={detailedData.data}>
        <defs>
          <linearGradient id="colorContractsMonth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.2}/>
          </linearGradient>
          <linearGradient id="colorRealizationMonth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
          </linearGradient>
          <linearGradient id="colorCancellationMonth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2}/>
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="day" 
          stroke="#9ca3af"
          tick={{ fontSize: 12 }}
          // Корректируем показ тиков в зависимости от количества дней
          ticks={detailedData.data.length <= 7 
            ? detailedData.data.map(d => d.day)
            : [1, 5, 10, 15, 20, 25, 30].filter(d => d <= detailedData.data.length)}
        />
        <YAxis stroke="#9ca3af" tickFormatter={formatNumber}/>
        <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
        <Tooltip content={renderCustomTooltip} />
        <Line 
          type="monotone" 
          dataKey="contracts" 
          stroke="#4f46e5" 
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6, stroke: 'white', strokeWidth: 2 }}
        />
        <Line 
          type="monotone" 
          dataKey="realization" 
          stroke="#10b981" 
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6, stroke: 'white', strokeWidth: 2 }}
        />
        <Line 
          type="monotone" 
          dataKey="cancellation" 
          stroke="#ef4444" 
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6, stroke: 'white', strokeWidth: 2 }}
        />
      </LineChart>
    );
  };
  
  // Тепловая карта для визуализации интенсивности контрактов
  const renderHeatmap = () => {
    const colorScale = (value) => {
      // Адаптируем шкалу под периоды
      let minVal, maxVal;
      switch (selectedPeriod) {
        case 'year':
        case 'quarter':
          minVal = 20;
          maxVal = 140;
          break;
        case 'month':
          minVal = 10;
          maxVal = 70;
          break;
        case 'week':
          minVal = 2;
          maxVal = 20;
          break;
        default:
          minVal = 20;
          maxVal = 140;
      }
      
      const normalizedVal = Math.min(1, Math.max(0, (value - minVal) / (maxVal - minVal)));
      
      // Градиент от синего (холодный) к красному (горячий)
      if (normalizedVal < 0.25) {
        return `rgba(59, 130, 246, ${0.3 + normalizedVal * 0.7})`;
      } else if (normalizedVal < 0.5) {
        return `rgba(139, 92, 246, ${0.3 + normalizedVal * 0.7})`;
      } else if (normalizedVal < 0.75) {
        return `rgba(249, 115, 22, ${0.3 + normalizedVal * 0.7})`;
      } else {
        return `rgba(239, 68, 68, ${0.3 + normalizedVal * 0.7})`;
      }
    };
    
    // Адаптируем отображение тепловой карты для недельного вида
    if (selectedPeriod === 'week' && heatmapData.length === 1) {
      return (
        <div className="grid grid-cols-8 gap-1 w-full">
          <div className="col-span-1"></div>
          <div className="font-medium text-gray-400 text-center text-sm">Пн</div>
          <div className="font-medium text-gray-400 text-center text-sm">Вт</div>
          <div className="font-medium text-gray-400 text-center text-sm">Ср</div>
          <div className="font-medium text-gray-400 text-center text-sm">Чт</div>
          <div className="font-medium text-gray-400 text-center text-sm">Пт</div>
          <div className="font-medium text-gray-400 text-center text-sm">Сб</div>
          <div className="font-medium text-gray-400 text-center text-sm">Вс</div>
          
          <div className="font-medium text-gray-400 text-sm flex items-center">
            Неделя
          </div>
          {[1,2,3,4,5,6,7].map(day => (
            <div 
              key={`cell-week-${day}`}
              className="aspect-square rounded-md flex items-center justify-center text-xs font-medium text-white relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer group"
              style={{ backgroundColor: colorScale(heatmapData[0][`day${day}`]) }}
            >
              <span className="relative z-10">{heatmapData[0][`day${day}`]}</span>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300"></div>
            </div>
          ))}
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-8 gap-1 w-full">
        <div className="col-span-1"></div>
        <div className="font-medium text-gray-400 text-center text-sm">Пн</div>
        <div className="font-medium text-gray-400 text-center text-sm">Вт</div>
        <div className="font-medium text-gray-400 text-center text-sm">Ср</div>
        <div className="font-medium text-gray-400 text-center text-sm">Чт</div>
        <div className="font-medium text-gray-400 text-center text-sm">Пт</div>
        <div className="font-medium text-gray-400 text-center text-sm">Сб</div>
        <div className="font-medium text-gray-400 text-center text-sm">Вс</div>
        
        {heatmapData.map((week, weekIndex) => (
          <>
            <div key={`week-${weekIndex}`} className="font-medium text-gray-400 text-sm flex items-center">
              {week.week}
            </div>
            {[1,2,3,4,5,6,7].map(day => (
              <div 
                key={`cell-${weekIndex}-${day}`}
                className="aspect-square rounded-md flex items-center justify-center text-xs font-medium text-white relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer group"
                style={{ backgroundColor: colorScale(week[`day${day}`]) }}
              >
                <span className="relative z-10">{week[`day${day}`]}</span>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300"></div>
              </div>
            ))}
          </>
        ))}
      </div>
    );
  };
  
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
  
const DateRangePicker = () => {
  // Локальные состояния для хранения временных значений дат
  const [tempStartDate, setTempStartDate] = useState(
    customStartDate || new Date(new Date().setMonth(new Date().getMonth() - 1))
  );
  const [tempEndDate, setTempEndDate] = useState(
    customEndDate || new Date()
  );
  
  // Функция для форматирования даты в формате "15 апр. 2023"
  const formatDate = (date) => {
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Функция для применения выбранного периода
  const applyCustomPeriod = () => {
    if (tempStartDate > tempEndDate) {
      // Если начальная дата позже конечной, меняем их местами
      const temp = tempStartDate;
      setTempStartDate(tempEndDate);
      setTempEndDate(temp);
      
      setCustomStartDate(tempEndDate);
      setCustomEndDate(temp);
    } else {
      setCustomStartDate(tempStartDate);
      setCustomEndDate(tempEndDate);
    }
    
    handleCustomPeriodSelect();
  };

  // Функция сброса кастомного периода
const resetCustomPeriod = () => {
  setIsCustomPeriod(false);
  setSelectedPeriod('year'); // Возвращаемся к годовому периоду
};
  
  // Предустановленные периоды для быстрого выбора
  const presetPeriods = [
    { 
      name: 'Неделя', 
      icon: '📅',
      getDateRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 7);
        return { start, end };
      }
    },
    { 
      name: 'Месяц', 
      icon: '📆',
      getDateRange: () => {
        const end = new Date();
        const start = new Date();
        start.setMonth(end.getMonth() - 1);
        return { start, end };
      }
    },
    { 
      name: 'Квартал', 
      icon: '🗓️',
      getDateRange: () => {
        const end = new Date();
        const start = new Date();
        start.setMonth(end.getMonth() - 3);
        return { start, end };
      }
    },
    { 
      name: 'Полгода', 
      icon: '📊',
      getDateRange: () => {
        const end = new Date();
        const start = new Date();
        start.setMonth(end.getMonth() - 6);
        return { start, end };
      }
    },
    { 
      name: 'Год', 
      icon: '📈',
      getDateRange: () => {
        const end = new Date();
        const start = new Date();
        start.setFullYear(end.getFullYear() - 1);
        return { start, end };
      }
    }
  ];

  return (
    <div className="mt-5 bg-gradient-to-b from-gray-800/60 to-gray-900/60 border border-gray-700/60 rounded-xl p-5 shadow-lg transition-all duration-300 hover:shadow-indigo-900/20 hover:shadow-xl">
      <div className="flex flex-col gap-4">
        <h4 className="text-lg text-white font-medium flex items-center">
          <span className="mr-2 text-2xl bg-indigo-500/20 w-10 h-10 rounded-full flex items-center justify-center shadow-inner shadow-indigo-500/10">🔍</span>
          Выбрать произвольный период
        </h4>
        
        {/* Предустановленные периоды */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {presetPeriods.map((period, index) => (
            <button 
              key={`preset-${index}`}
              className="bg-gray-800/60 hover:bg-indigo-900/40 border border-gray-700/60 hover:border-indigo-500/40 rounded-lg p-3 transition-all duration-300 group"
              onClick={() => {
                const { start, end } = period.getDateRange();
                setTempStartDate(start);
                setTempEndDate(end);
              }}
            >
              <div className="flex flex-col items-center">
                <span className="text-2xl mb-1">{period.icon}</span>
                <span className="text-gray-300 group-hover:text-indigo-300 text-sm font-medium transition-all">
                  {period.name}
                </span>
              </div>
            </button>
          ))}
        </div>
        
        {/* Кастомный выбор */}
        <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg p-4 border border-gray-700/60">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
              <label className="text-gray-400 text-sm block mb-2">Начальная дата</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="date"
                  className="pl-10 w-full bg-gray-900/80 border border-gray-700 focus:border-indigo-500 rounded-lg py-2.5 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  value={tempStartDate.toISOString().split('T')[0]}
                  onChange={(e) => setTempStartDate(new Date(e.target.value))}
                />
              </div>
            </div>
            
            <div className="flex-1">
              <label className="text-gray-400 text-sm block mb-2">Конечная дата</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="date"
                  className="pl-10 w-full bg-gray-900/80 border border-gray-700 focus:border-indigo-500 rounded-lg py-2.5 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  value={tempEndDate.toISOString().split('T')[0]}
                  onChange={(e) => setTempEndDate(new Date(e.target.value))}
                />
              </div>
            </div>
            
            <button
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-2.5 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center"
              onClick={applyCustomPeriod}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Применить
            </button>
          </div>
        </div>
        
        {/* Индикатор активного кастомного периода */}
        {isCustomPeriod && (
          <div className="flex items-center justify-between bg-indigo-900/30 py-3 px-4 rounded-lg border border-indigo-600/30 shadow-inner shadow-indigo-500/5">
            <div className="flex items-center">
              <span className="text-lg mr-2">🔎</span>
              <div>
                <span className="text-gray-300 text-sm">Активен период:</span>
                <p className="text-indigo-300 font-medium">
                  {formatDate(customStartDate)} — {formatDate(customEndDate)}
                </p>
              </div>
            </div>
            <button 
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white py-1.5 px-4 rounded-lg text-sm transition-all duration-300 flex items-center"
              onClick={resetCustomPeriod}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Сбросить
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
  
  // Компонент карты показателей за месяц
  const StatsCards = () => {
    return (
      <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/60 shadow-lg mb-6 hover:shadow-xl transition-all duration-300">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
          <span className="text-2xl mr-2">📊</span> 
          Статистика {selectedPeriod === 'month' ? 'за месяц' : 
                       selectedPeriod === 'week' ? 'за неделю' : 
                       selectedPeriod === 'quarter' ? 'за полгода' : 'за год'}
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

  // Компонент для выбора модели с изображениями
  const ModelSelector = () => {
    return (
      <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/60 shadow-lg mb-6 hover:shadow-xl transition-all duration-300">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white flex items-center">
            <span className="text-2xl mr-2">🚗</span> 
            Выбор модели
          </h3>
          {selectedModel !== 'all' && (
            <button 
              onClick={() => setSelectedModel('all')} 
              className="px-3 py-1 bg-gray-700/80 hover:bg-gray-600/80 text-sm text-gray-300 rounded-md transition-all"
            >
              Сбросить фильтр
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <div 
            className={`bg-gray-900/90 p-4 rounded-lg border ${selectedModel === 'all' ? 'border-indigo-500/70 ring-2 ring-indigo-500/30' : 'border-gray-700/60 hover:border-indigo-500/40'} transition-all duration-300 flex flex-col items-center cursor-pointer`}
            onClick={() => setSelectedModel('all')}
          >
            <div className="w-14 h-14 rounded-full bg-indigo-500/20 flex items-center justify-center mb-2">
              <span className="text-2xl">🔍</span>
            </div>
            <p className="font-medium text-gray-200 text-center">Все модели</p>
            <p className="text-xs text-gray-400">Показать всё</p>
          </div>
          
          {carModels.map(model => (
            <div 
              key={model.id}
              className={`bg-gray-900/90 p-4 rounded-lg border ${selectedModel === model.id ? 'border-indigo-500/70 ring-2 ring-indigo-500/30' : 'border-gray-700/60 hover:border-indigo-500/40'} transition-all duration-300 flex flex-col items-center cursor-pointer`}
              onClick={() => setSelectedModel(model.id)}
            >
              <div className="w-16 h-16 bg-gray-800/80 rounded-lg flex items-center justify-center mb-2 overflow-hidden">
                <img 
                  src={model.img} 
                  alt={model.name} 
                  className="w-full h-full object-contain p-1"
                />
              </div>
              <p className="font-medium text-gray-200 text-center">{model.name}</p>
              <p className="text-xs text-gray-400">{
                model.category === 'sedan' ? 'Седан' :
                model.category === 'suv' ? 'Внедорожник' :
                model.category === 'minivan' ? 'Минивэн' : 
                model.category
              }</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Компонент сравнительного анализа моделей
  const ModelComparisonChart = () => {
    if (Object.keys(modelPerformance).length === 0) return null;
    
    // Подготовка данных для сравнительного графика
    const comparisonData = carModels.map(model => {
      const perfData = modelPerformance[model.id] || {};
      return {
        name: model.name,
        contracts: perfData.contracts || 0,
        realization: perfData.realization || 0,
        cancellation: perfData.cancellation || 0,
        conversion: perfData.conversion || 0
      };
    });
    
    return (
      <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/60 shadow-lg hover:shadow-xl transition-all duration-300 mb-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <span className="text-2xl mr-2">📊</span> 
          Сравнительный анализ моделей {getPeriodLabel(selectedPeriod).toLowerCase()}
        </h3>
        
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={comparisonData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <XAxis type="number" stroke="#9ca3af" tickFormatter={formatNumber} />
              <YAxis 
                dataKey="name" 
                type="category" 
                stroke="#9ca3af" 
                width={80}
                tick={{
                  fill: '#e5e7eb',
                  fontSize: 12
                }}
              />
              <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
              <Tooltip 
                formatter={(value, name) => {
                  const labels = {
                    contracts: "Контракты",
                    realization: "Реализация",
                    cancellation: "Отмена",
                    conversion: "Конверсия"
                  };
                  return [formatNumber(value), labels[name] || name];
                }}
                wrapperStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                itemStyle={{ color: '#e5e7eb' }}
                labelStyle={{ color: '#e5e7eb', fontWeight: 'bold' }}
              />
              <Legend 
                formatter={(value) => {
                  const labels = {
                    contracts: "Контракты",
                    realization: "Реализация",
                    cancellation: "Отмена",
                    conversion: "Конверсия (%)"
                  };
                  return <span style={{color: '#d1d5db', fontSize: '0.9rem'}}>{labels[value]}</span>
                }}
              />
              <Bar dataKey="contracts" fill="#4f46e5" radius={[0, 4, 4, 0]} />
              <Bar dataKey="realization" fill="#10b981" radius={[0, 4, 4, 0]} />
              <Bar dataKey="cancellation" fill="#ef4444" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };
  
  // Компонент с расширенной информацией о выбранной модели
  const SelectedModelDetails = () => {
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

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 rounded-xl shadow-2xl border border-gray-700/40 w-full mx-auto overflow-hidden">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400 text-lg">Загрузка данных...</p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Анализ контрактов {getPeriodLabel(selectedPeriod).toLowerCase()}
              {selectedModel !== 'all' && (
                <span className="ml-2 font-medium text-indigo-400 text-2xl">
                  — {carModels.find(m => m.id === selectedModel)?.name}
                </span>
              )}
            </h2>
            <p className="text-gray-400">
              {selectedModel === 'all' 
                ? `${getPeriodDescription(selectedPeriod)} по контрактам, реализации и отменам для всех моделей`
                : `Детальная статистика ${selectedPeriod === 'year' ? 'за год' : selectedPeriod === 'quarter' ? 'за полгода' : selectedPeriod === 'month' ? 'за месяц' : 'за неделю'} по модели ${carModels.find(m => m.id === selectedModel)?.name}`
              }
            </p>
          </div>
          
         <FilterPanel 
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
            isCustomPeriod={isCustomPeriod}
            setIsCustomPeriod={setIsCustomPeriod}
            customStartDate={customStartDate}
            setCustomStartDate={setCustomStartDate}
            customEndDate={customEndDate}
            setCustomEndDate={setCustomEndDate}
            handleCustomPeriodSelect={handleCustomPeriodSelect}
            getPeriodLabel={getPeriodLabel}
            carModels={carModels}
          />
          
          {/* Показатели за выбранный период */}
          <StatsCards />
          
          {/* Детали выбранной модели */}
          <SelectedModelDetails />
          
          {/* Основной график */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/60 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <span className="text-2xl mr-2">📈</span> 
                  Динамика показателей {getPeriodLabel(selectedPeriod).toLowerCase()}
                  {selectedModel !== 'all' && (
                    <span className="ml-2 text-indigo-400 text-base">
                      ({carModels.find(m => m.id === selectedModel)?.name})
                    </span>
                  )}
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button 
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${chartType === 'line' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-700/80 text-gray-300 hover:bg-gray-600/80'}`}
                    onClick={() => setChartType('line')}
                  >
                    Линия
                  </button>
                  <button 
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${chartType === 'area' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-700/80 text-gray-300 hover:bg-gray-600/80'}`}
                    onClick={() => setChartType('area')}
                  >
                    Область
                  </button>
                  <button 
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${chartType === 'bar' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-700/80 text-gray-300 hover:bg-gray-600/80'}`}
                    onClick={() => setChartType('bar')}
                  >
                    Столбцы
                  </button>
                </div>
              </div>
              
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  {renderChart()}
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Тепловая карта */}
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/60 shadow-lg hover:shadow-xl transition-all duration-300">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <span className="text-2xl mr-2">🗓️</span> 
                Тепловая карта контрактов
              </h3>
              {renderHeatmap()}
              <div className="mt-4 flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500/70 mr-1"></div>
                  <span className="text-xs text-gray-400">Мало</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-purple-500/70 mr-1"></div>
                  <span className="text-xs text-gray-400">Средне</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-orange-500/70 mr-1"></div>
                  <span className="text-xs text-gray-400">Много</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500/70 mr-1"></div>
                  <span className="text-xs text-gray-400">Очень много</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* График по дням детализации */}
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/60 shadow-lg hover:shadow-xl transition-all duration-300 mb-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <span className="text-2xl mr-2">📅</span> 
              Детализация {
                selectedPeriod === 'week' ? 'по дням недели' : 
                selectedPeriod === 'month' ? 'по дням месяца' : 
                `для ${selectedDetailLabel}`
              }
            </h3>
            
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                {renderDetailedChart()}
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Сравнительный анализ моделей */}
          {selectedModel === 'all' && <ModelComparisonChart />}
          
        </>
      )}
      
      <style jsx>{`
        .bg-clip-text {
          -webkit-background-clip: text;
          background-clip: text;
        }
        .text-transparent {
          color: transparent;
        }
      `}</style>
    </div>
  );
}