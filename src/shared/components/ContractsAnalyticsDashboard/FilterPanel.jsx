import { useState } from 'react';
import { Calendar, MapPin, Car } from 'lucide-react';

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
  // Функции для применения фильтров
  applyDateFilter,
  handleModelChange,
  handleRegionChange
}) => {
  // Внутренние состояния для хранения дат до применения фильтра
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);
  
  // Обработчик сброса всех фильтров
  const handleResetFilters = () => {
    setSelectedModel('all');
    setSelectedRegion('all');
    
    // Устанавливаем последние 3 месяца вместо целого года
    const today = new Date();
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(today.getMonth() - 3);
    
    const newStartDate = threeMonthsAgo.toISOString().substring(0, 10);
    const newEndDate = today.toISOString().substring(0, 10);
    
    // Обновляем как внутренние временные даты, так и внешние
    setTempStartDate(newStartDate);
    setTempEndDate(newEndDate);
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    
    // Явно применяем фильтр после изменения дат
    setTimeout(() => applyDateFilter(), 100);
  };
  
  // Обработчик для временного изменения даты начала
  const handleTempStartDateChange = (e) => {
    setTempStartDate(e.target.value);
  };
  
  // Обработчик для временного изменения даты окончания
  const handleTempEndDateChange = (e) => {
    setTempEndDate(e.target.value);
  };
  
  // Обработчик для применения дат
  const handleApplyDates = () => {
    // Обновляем внешние даты только при нажатии кнопки "Применить"
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    
    // Вызываем функцию для применения фильтра
    applyDateFilter();
  };

  return (
    <div className="bg-gradient-to-b from-gray-800 to-gray-850 rounded-xl shadow-lg mb-6 overflow-hidden border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300">
      {/* Заголовок и кнопка сброса */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-5 py-4 border-b border-gray-700/70 flex items-center justify-between">
        <h3 className="text-lg font-medium text-white flex items-center">
          <div className="mr-3 w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <Calendar className="text-blue-400 w-5 h-5" />
          </div>
          Параметры аналитики
        </h3>
        
        <button
          onClick={handleResetFilters}
          className="text-sm px-3 py-1.5 rounded-md bg-gray-700/90 text-gray-300 hover:bg-blue-600 hover:text-white transition-all duration-200 flex items-center shadow-sm hover:shadow"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Сбросить фильтры
        </button>
      </div>
      
      <div className="p-5">
        {/* Все фильтры в одну строку */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Выбор периода */}
          <div className="bg-gray-750/60 rounded-lg p-3 border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300 hover:shadow-md">
            <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-blue-400" />
              Период
            </h4>
            
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <input 
                  type="date" 
                  value={tempStartDate}
                  onChange={handleTempStartDateChange}
                  className="w-full py-2 px-2 bg-gray-700 border border-gray-600/60 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-transparent transition-all"
                />
              </div>
              <div className="flex items-center">
                <span className="text-gray-400 mx-1">—</span>
              </div>
              <div className="flex-1">
                <input 
                  type="date" 
                  value={tempEndDate}
                  onChange={handleTempEndDateChange}
                  className="w-full py-2 px-2 bg-gray-700 border border-gray-600/60 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-transparent transition-all"
                />
              </div>
              
              <button 
                onClick={handleApplyDates}
                className="px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 shadow hover:shadow-md flex items-center justify-center"
              >
                <span>ОК</span>
              </button>
            </div>
          </div>
          
          {/* Выбор региона */}
          <div className="bg-gray-750/60 rounded-lg p-3 border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300 hover:shadow-md">
            <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center justify-between">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-blue-400" />
                Регион
              </div>
              {selectedRegion !== 'all' && (
                <button 
                  onClick={() => handleRegionChange('all')}
                  className="text-xs px-2 py-0.5 rounded bg-gray-700/70 text-gray-300 hover:bg-blue-600 hover:text-white transition-all"
                >
                  Сбросить
                </button>
              )}
            </h4>
            
            <div className="relative">
              <select 
                value={selectedRegion}
                onChange={(e) => handleRegionChange(e.target.value)}
                className="w-full py-2 px-3 bg-gray-700 border border-gray-600/60 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-transparent transition-all appearance-none"
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
          
          {/* Выбор модели автомобиля обычным select */}
          <div className="bg-gray-750/60 rounded-lg p-3 border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300 hover:shadow-md">
            <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center justify-between">
              <div className="flex items-center">
                <Car className="w-4 h-4 mr-2 text-blue-400" />
                Модель
              </div>
              {selectedModel !== 'all' && (
                <button 
                  onClick={() => handleModelChange('all')}
                  className="text-xs px-2 py-0.5 rounded bg-gray-700/70 text-gray-300 hover:bg-blue-600 hover:text-white transition-all"
                >
                  Сбросить
                </button>
              )}
            </h4>
            
            <div className="relative">
              <select 
                value={selectedModel}
                onChange={(e) => handleModelChange(e.target.value)}
                className="w-full py-2 px-3 bg-gray-700 border border-gray-600/60 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-transparent transition-all appearance-none"
              >
                <option value="all">Все модели</option>
                {carModels.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name}
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
      </div>
    </div>
  );
};

export default FilterPanel;