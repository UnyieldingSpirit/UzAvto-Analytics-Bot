import { useState } from 'react';
import { Calendar, MapPin, Car, ImageOff } from 'lucide-react';

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
  handleModelChange,     // Новый обработчик для изменения модели
  handleRegionChange     // Новый обработчик для изменения региона
}) => {
  // Состояния для отслеживания ошибок загрузки изображений
  const [failedImages, setFailedImages] = useState({});
  
  // Обработчик сброса всех фильтров
  const handleResetFilters = () => {
    setSelectedModel('all');
    setSelectedRegion('all');
    
    // Устанавливаем последние 3 месяца вместо целого года
    const today = new Date();
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(today.getMonth() - 3);
    
    setStartDate(threeMonthsAgo.toISOString().substring(0, 10));
    setEndDate(today.toISOString().substring(0, 10));
    
    // Явно применяем фильтр после изменения дат
    setTimeout(() => applyDateFilter(), 100);
  };
  
  // Обработчик ошибки загрузки изображения
  const handleImageError = (modelId) => {
    setFailedImages(prev => ({
      ...prev,
      [modelId]: true
    }));
  };

  return (
    <div className="bg-gradient-to-br from-gray-800/90 via-gray-900/95 to-gray-800/90 rounded-xl p-5 border border-gray-700/70 shadow-lg mb-5 backdrop-blur-sm hover:border-indigo-500/30 transition-all duration-500">
      {/* Заголовок и кнопка сброса */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-700/50">
        <h3 className="text-lg font-bold text-white flex items-center">
          <div className="mr-3 w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
            <Calendar className="text-indigo-400 w-5 h-5" />
          </div>
          Параметры аналитики
        </h3>
        
        <button
          onClick={handleResetFilters}
          className="text-xs px-3 py-1.5 rounded-lg bg-gray-700/80 text-gray-300 hover:bg-indigo-600/80 hover:text-white transition-all duration-300 flex items-center shadow-sm hover:shadow"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Сбросить фильтры
        </button>
      </div>
      
      {/* Верхняя часть: Период и Регион в одну строку */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* Выбор периода */}
        <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/60 hover:border-indigo-500/30 transition-all duration-300 shadow-sm hover:shadow">
          <h4 className="text-sm font-medium text-white mb-3 flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-indigo-400" />
            Выбор периода
          </h4>
          
          <div className="flex gap-3">
            <div className="flex-1">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full py-2.5 px-3 bg-gray-700/80 border border-gray-600/60 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex items-center">
              <span className="text-gray-400 mx-1">—</span>
            </div>
            <div className="flex-1">
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full py-2.5 px-3 bg-gray-700/80 border border-gray-600/60 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
              />
            </div>
            
            <button 
              onClick={applyDateFilter}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all duration-300 shadow hover:shadow-md hover:shadow-indigo-600/20 flex items-center justify-center"
            >
              <span>Применить</span>
            </button>
          </div>
        </div>
        
        {/* Выбор региона */}
        <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/60 hover:border-indigo-500/30 transition-all duration-300 shadow-sm hover:shadow">
          <h4 className="text-sm font-medium text-white mb-3 flex items-center justify-between">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-indigo-400" />
              Регион
            </div>
            {selectedRegion !== 'all' && (
              <button 
                onClick={() => handleRegionChange('all')}
                className="text-xs px-2 py-0.5 rounded bg-gray-700/70 text-gray-300 hover:bg-indigo-600/80 hover:text-white transition-all"
              >
                Сбросить
              </button>
            )}
          </h4>
          
          <div className="relative">
            <select 
              value={selectedRegion}
              onChange={(e) => handleRegionChange(e.target.value)}
              className="w-full py-2.5 pl-3 pr-10 bg-gray-700/80 border border-gray-600/60 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
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
      
      {/* Выбор модели автомобиля */}
      {carModels && carModels.length > 0 && (
        <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/60 hover:border-indigo-500/30 transition-all duration-300 shadow-sm hover:shadow">
          <h4 className="text-sm font-medium text-white mb-3 flex items-center justify-between">
            <div className="flex items-center">
              <Car className="w-4 h-4 mr-2 text-indigo-400" />
              Модель автомобиля
            </div>
            {selectedModel !== 'all' && (
              <button 
                onClick={() => handleModelChange('all')}
                className="text-xs px-2 py-0.5 rounded bg-gray-700/70 text-gray-300 hover:bg-indigo-600/80 hover:text-white transition-all"
              >
                Сбросить
              </button>
            )}
          </h4>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2">
            <button 
              className={`rounded-xl p-3 transition-all flex flex-col items-center justify-center ${
                selectedModel === 'all' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'bg-gray-700/70 text-gray-300 hover:bg-gray-700 hover:shadow-md'
              }`}
              onClick={() => handleModelChange('all')}
            >
              <div className="h-12 w-12 flex items-center justify-center bg-gray-800/70 rounded-lg mb-2">
                <Car className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium">Все модели</span>
            </button>
            
            {carModels.map(model => (
              <button 
                key={model.id}
                className={`rounded-xl p-3 transition-all flex flex-col items-center justify-center ${
                  selectedModel === model.id 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'bg-gray-700/70 text-gray-300 hover:bg-gray-700 hover:shadow-md'
                }`}
                onClick={() => handleModelChange(model.id)}
              >
                <div className="relative h-12 w-12 flex items-center justify-center bg-gray-800/70 rounded-lg mb-2 overflow-hidden">
                  {model.img && !failedImages[model.id] ? (
                    <img 
                      src={model.img}
                      alt={model.name} 
                      className="w-full h-full object-contain p-1" 
                      onError={() => handleImageError(model.id)}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full">
                      <ImageOff className="w-5 h-5 text-gray-500" />
                      <span className="text-xs text-gray-500">Нет фото</span>
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium truncate w-full text-center">{model.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;