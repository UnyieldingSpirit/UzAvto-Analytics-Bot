import { useState } from 'react';

const FilterPanel = ({ 
  // Основные состояния
  selectedModel, 
  setSelectedModel,
  selectedRegion,
  setSelectedRegion,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  // Данные для выбора
  regionsList = [], 
  carModels = [],   
  // Функция для применения фильтров периода (только она делает запрос)
  applyDateFilter
}) => {
  // Обработчик сброса всех фильтров
  const handleResetFilters = () => {
    setSelectedModel('all');
    setSelectedRegion('all');
    
    // Установка дат по умолчанию (текущий год)
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    
    setStartDate(startOfYear.toISOString().substring(0, 10));
    setEndDate(today.toISOString().substring(0, 10));
    
    // Применяем фильтры после изменения дат (делаем запрос)
    setTimeout(() => applyDateFilter(), 100);
  };
  
  return (
    <div className="bg-gradient-to-b from-gray-800/90 to-gray-900/90 rounded-xl p-5 border border-gray-700/70 shadow-lg mb-6 backdrop-blur-sm">
      {/* Заголовок и кнопка сброса */}
      <div className="flex items-center justify-between mb-5 border-b border-gray-700/50 pb-4">
        <h3 className="text-lg font-bold text-white flex items-center">
          <span className="mr-2 text-xl bg-indigo-500/20 w-8 h-8 rounded-full flex items-center justify-center">🔍</span> 
          Параметры аналитики
        </h3>
        
        <button
          onClick={handleResetFilters}
          className="text-xs px-2.5 py-1.5 rounded-md bg-gray-700/70 text-gray-300 hover:bg-gray-600 transition-all flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Сбросить фильтры
        </button>
      </div>
      
      {/* Верхняя часть: Период и Регион в одну строку */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* Выбор периода */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
          <h4 className="text-sm text-gray-300 font-medium mb-3 flex items-center">
            <span className="mr-2 text-base bg-indigo-500/10 w-6 h-6 rounded-full flex items-center justify-center">📅</span>
            Период
          </h4>
          
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1.5">С</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full py-2 px-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1.5">По</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full py-2 px-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <button 
              onClick={applyDateFilter} // Эта кнопка делает запрос
              className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Выбор региона */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
          <h4 className="text-sm text-gray-300 font-medium mb-3 flex items-center justify-between">
            <div className="flex items-center">
              <span className="mr-2 text-base bg-indigo-500/10 w-6 h-6 rounded-full flex items-center justify-center">🌐</span>
              Регион
            </div>
            {selectedRegion !== 'all' && (
              <button 
                onClick={() => setSelectedRegion('all')} // Просто меняем состояние без запроса
                className="text-xs px-2 py-0.5 rounded bg-gray-700/70 text-gray-300 hover:bg-gray-600 transition-all"
              >
                Сбросить
              </button>
            )}
          </h4>
          
          <div className="relative">
            <select 
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)} // Просто меняем состояние без запроса
              className="w-full py-2.5 pl-3 pr-10 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
            >
              <option value="all">Все регионы</option>
              {regionsList.map(region => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* Выбор модели автомобиля - увеличенные карточки */}
      {carModels && carModels.length > 0 && (
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
          <h4 className="text-sm text-gray-300 font-medium mb-3 flex items-center justify-between">
            <div className="flex items-center">
              <span className="mr-2 text-base bg-indigo-500/10 w-6 h-6 rounded-full flex items-center justify-center">🚗</span>
              Модель автомобиля
            </div>
            {selectedModel !== 'all' && (
              <button 
                onClick={() => setSelectedModel('all')} // Просто меняем состояние без запроса
                className="text-xs px-2 py-0.5 rounded bg-gray-700/70 text-gray-300 hover:bg-gray-600 transition-all"
              >
                Сбросить
              </button>
            )}
          </h4>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            <button 
              className={`rounded-md p-3 transition-all flex flex-col items-center justify-center ${
                selectedModel === 'all' ? 'bg-indigo-600/80 text-white shadow-md' : 'bg-gray-700/60 text-gray-300 hover:bg-gray-700/90'
              }`}
              onClick={() => setSelectedModel('all')} // Просто меняем состояние без запроса
            >
              <div className="h-14 w-14 flex items-center justify-center bg-gray-800/50 rounded-full mb-2">
                <span className="text-2xl">🚗</span>
              </div>
              <span className="text-sm font-medium">Все модели</span>
            </button>
            
         {carModels.map(model => (
  <button 
    key={model.id}
    className={`rounded-md p-3 transition-all flex flex-col items-center justify-center ${
      selectedModel === model.id ? 'bg-indigo-600/80 text-white shadow-md' : 'bg-gray-700/60 text-gray-300 hover:bg-gray-700/90'
    }`}
    onClick={() => setSelectedModel(model.id)}
  >
    <div className="relative h-14 w-14 flex items-center justify-center bg-gray-800/50 rounded-full mb-2 overflow-hidden">
      {model.img && (
        <img 
          src={model.img}
          alt={model.name} 
          className="w-full h-full object-contain" 
        />
      )}
    </div>
    <span className="text-sm font-medium truncate w-full text-center">{model.name}</span>
  </button>
))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;