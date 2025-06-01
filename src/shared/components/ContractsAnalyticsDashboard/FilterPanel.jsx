// src/shared/components/ContractsAnalyticsDashboard/FilterPanel.jsx
import { useState } from 'react';
import { Calendar, MapPin, Car } from 'lucide-react';

const FilterPanel = ({ 
  t, // добавляем перевод
  currentLocale, // добавляем текущую локаль
  isDark, // добавляем поддержку темы
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
    <div className={`bg-gradient-to-b ${isDark ? 'from-gray-800 to-gray-850' : 'from-gray-50 to-gray-100'} rounded-xl shadow-lg mb-4 md:mb-6 overflow-hidden border ${isDark ? 'border-gray-700/50 hover:border-blue-500/30' : 'border-gray-200 hover:border-blue-500/50'} transition-all duration-300`}>
      {/* Заголовок и кнопка сброса */}
      <div className={`bg-gradient-to-r ${isDark ? 'from-gray-800 to-gray-700' : 'from-gray-100 to-gray-50'} px-4 md:px-5 py-3 md:py-4 border-b ${isDark ? 'border-gray-700/70' : 'border-gray-200'} flex flex-wrap md:flex-nowrap items-center justify-between gap-2`}>
        <h3 className={`text-base md:text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}>
          <div className={`mr-2 md:mr-3 w-7 h-7 md:w-8 md:h-8 ${isDark ? 'bg-blue-500/20' : 'bg-blue-500/10'} rounded-lg flex items-center justify-center`}>
            <Calendar className="text-blue-400 w-4 h-4 md:w-5 md:h-5" />
          </div>
          {t('filters.title')}
        </h3>
        
        <button
          onClick={handleResetFilters}
          className={`text-xs md:text-sm px-2 md:px-3 py-1 md:py-1.5 rounded-md ${isDark ? 'bg-gray-700/90 text-gray-300 hover:bg-blue-600 hover:text-white' : 'bg-gray-200 text-gray-700 hover:bg-blue-600 hover:text-white'} transition-all duration-200 flex items-center shadow-sm hover:shadow`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {t('filters.resetFilters')}
        </button>
      </div>
      
      <div className="p-4 md:p-5">
        {/* Все фильтры */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {/* Выбор периода - переработанный блок */}
          <div className={`${isDark ? 'bg-gray-750/60' : 'bg-white'} rounded-lg p-2 md:p-3 border ${isDark ? 'border-gray-700/50 hover:border-blue-500/30' : 'border-gray-200 hover:border-blue-500/50'} transition-all duration-300 hover:shadow-md`}>
            <h4 className={`text-xs md:text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2 flex items-center`}>
              <Calendar className={`w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2 text-blue-400`} />
              {t('filters.period')}
            </h4>
            
            {/* Мобильная версия (в столбик) */}
            <div className="flex flex-col space-y-2 md:hidden">
              <div className="w-full">
                <label className={`block text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>{currentLocale === 'uz' ? 'Boshlanish sanasi' : 'Начальная дата'}</label>
                <input 
                  type="date" 
                  value={tempStartDate}
                  onChange={handleTempStartDateChange}
                  className={`w-full py-1.5 px-2 ${isDark ? 'bg-gray-700 border-gray-600/60 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-transparent transition-all`}
                />
              </div>
              <div className="w-full">
                <label className={`block text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>{currentLocale === 'uz' ? 'Yakunlanish sanasi' : 'Конечная дата'}</label>
                <input 
                  type="date" 
                  value={tempEndDate}
                  onChange={handleTempEndDateChange}
                  className={`w-full py-1.5 px-2 ${isDark ? 'bg-gray-700 border-gray-600/60 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-transparent transition-all`}
                />
              </div>
              <button 
                onClick={handleApplyDates}
                className="w-full py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 shadow hover:shadow-md flex items-center justify-center text-xs"
              >
                <span>{t('filters.apply')}</span>
              </button>
            </div>

            {/* Десктопная версия (в строку) */}
            <div className="hidden md:flex md:flex-row md:gap-2 md:items-center">
              <div className="flex-1">
                <input 
                  type="date" 
                  value={tempStartDate}
                  onChange={handleTempStartDateChange}
                  className={`w-full py-2 px-2 ${isDark ? 'bg-gray-700 border-gray-600/60 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-transparent transition-all`}
                />
              </div>
              <div className="flex items-center">
                <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mx-1`}>—</span>
              </div>
              <div className="flex-1">
                <input 
                  type="date" 
                  value={tempEndDate}
                  onChange={handleTempEndDateChange}
                  className={`w-full py-2 px-2 ${isDark ? 'bg-gray-700 border-gray-600/60 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-transparent transition-all`}
                />
              </div>
              
              <button 
                onClick={handleApplyDates}
                className="px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 shadow hover:shadow-md flex items-center justify-center text-sm"
              >
                <span>{t('filters.apply')}</span>
              </button>
            </div>
          </div>
          
          {/* Выбор региона */}
          <div className={`${isDark ? 'bg-gray-750/60' : 'bg-white'} rounded-lg p-2 md:p-3 border ${isDark ? 'border-gray-700/50 hover:border-blue-500/30' : 'border-gray-200 hover:border-blue-500/50'} transition-all duration-300 hover:shadow-md`}>
            <h4 className={`text-xs md:text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2 flex items-center justify-between`}>
              <div className="flex items-center">
                <MapPin className={`w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2 text-blue-400`} />
                {t('filters.region')}
              </div>
              {selectedRegion !== 'all' && (
                <button 
                  onClick={() => handleRegionChange('all')}
                  className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded ${isDark ? 'bg-gray-700/70 text-gray-300 hover:bg-blue-600 hover:text-white' : 'bg-gray-200 text-gray-700 hover:bg-blue-600 hover:text-white'} transition-all`}
                >
                  {t('filters.reset')}
                </button>
              )}
            </h4>
            
            <div className="relative">
              <select 
                value={selectedRegion}
                onChange={(e) => handleRegionChange(e.target.value)}
                className={`w-full py-1.5 md:py-2 px-2 md:px-3 ${isDark ? 'bg-gray-700 border-gray-600/60 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-transparent transition-all appearance-none`}
              >
                <option value="all">{t('filters.allRegions')}</option>
                {regionsList.map(region => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
              <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <svg className="fill-current h-3.5 w-3.5 md:h-4 md:w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>
          
          {/* Выбор модели автомобиля */}
          <div className={`${isDark ? 'bg-gray-750/60' : 'bg-white'} rounded-lg p-2 md:p-3 border ${isDark ? 'border-gray-700/50 hover:border-blue-500/30' : 'border-gray-200 hover:border-blue-500/50'} transition-all duration-300 hover:shadow-md`}>
            <h4 className={`text-xs md:text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2 flex items-center justify-between`}>
              <div className="flex items-center">
                <Car className={`w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2 text-blue-400`} />
                {t('filters.model')}
              </div>
              {selectedModel !== 'all' && (
                <button 
                  onClick={() => handleModelChange('all')}
                  className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded ${isDark ? 'bg-gray-700/70 text-gray-300 hover:bg-blue-600 hover:text-white' : 'bg-gray-200 text-gray-700 hover:bg-blue-600 hover:text-white'} transition-all`}
                >
                  {t('filters.reset')}
                </button>
              )}
            </h4>
            
            <div className="relative">
              <select 
                value={selectedModel}
                onChange={(e) => handleModelChange(e.target.value)}
                className={`w-full py-1.5 md:py-2 px-2 md:px-3 ${isDark ? 'bg-gray-700 border-gray-600/60 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-transparent transition-all appearance-none`}
              >
                <option value="all">{t('filters.allModels')}</option>
                {carModels.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <svg className="fill-current h-3.5 w-3.5 md:h-4 md:w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
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