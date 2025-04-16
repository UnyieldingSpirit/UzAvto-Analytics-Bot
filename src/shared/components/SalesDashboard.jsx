'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Package, Clock, Download, Info, Check, ChevronDown, AlertTriangle, Filter, Truck, MapPin, 
  Archive, ChevronLeft, BarChart3, Users, Activity, ChevronRight, Zap, Calendar, Car } from 'lucide-react';
import { carModels, regions } from '@/src/shared/mocks/mock-data';
import { useTelegram } from '@/src/hooks/useTelegram';

const SalesDashboard = () => {
  const [activeTab, setActiveTab] = useState('месяц');
  const [activeDetailLevel, setActiveDetailLevel] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showPeriodFilter, setShowPeriodFilter] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const { hapticFeedback } = useTelegram();
  
  const [period, setPeriod] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Данные продаж за прошлый год для сравнения
  const lastYearSalesData = [60, 70, 58, 82, 65, 75, 80, 68, 79, 85, 60, 70];
  const salesData = [75, 82, 65, 90, 70, 85, 92, 78, 88, 94, 65, 75];

  // Вычисляем максимальное значение для графика с учетом режима сравнения
  const maxValue = showComparison 
    ? Math.max(...salesData, ...lastYearSalesData) 
    : Math.max(...salesData);
  
  // Создаем маппинг моделей для быстрого доступа
  const carModelMap = useMemo(() => {
    return carModels.reduce((acc, model) => {
      acc[model.id] = model;
      return acc;
    }, {});
  }, []);

  // Данные о задолженностях по контрактам (переименовано)
  const contractDebtData = {
    notShipped: 64,  // Распределены, но не отгружены в течение 48 часов
    inTransit: 48,   // В пути более 3 дней
    delivered: 96    // Доставлены
  };

  // Данные продаж по месяцам
  const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

  // Функция для правильного склонения слова "день"
  const getDayWord = (days) => {
    if (days % 10 === 1 && days % 100 !== 11) {
      return 'день';
    } else if ([2, 3, 4].includes(days % 10) && ![12, 13, 14].includes(days % 100)) {
      return 'дня';
    } else {
      return 'дней';
    }
  };

  // Реалистичные данные о задолженностях
  const generateDebtData = () => {
    const clients = ['Ахмедов А.', 'Садыков М.', 'Каримова С.', 'Рахимов Т.', 'Исламов Д.'];
    
    return Array.from({ length: 5 }, (_, i) => {
      const modelIndex = i % carModels.length;
      const model = carModels[modelIndex];
      const days = i === 0 ? 8 : i === 1 ? 6 : i === 2 ? 5 : i === 3 ? 3 : 2;
      const status = days > 7 ? 'Критический' : days > 3 ? 'Средний' : 'Низкий';
      
      return {
        contractId: `7891${i}`,
        client: clients[i],
        modelId: model.id,
        modelName: model.name,
        modelImg: model.img,
        debt: Math.floor(Math.random() * 15000000) + 2500000,
        days,
        status
      };
    });
  };

  // Использование данных внутри компонента
  const debtData = useMemo(() => {
    const data = generateDebtData();
    return selectedModel 
      ? data.filter(item => item.modelId === selectedModel)
      : data;
  }, [selectedModel]);

  // Расчет статистики
  const totalDebtDays = debtData.reduce((sum, item) => sum + item.days, 0);
  const avgDebtDays = Math.round(totalDebtDays / (debtData.length || 1));
  const criticalCount = debtData.filter(item => item.status === 'Критический').length;
  const mediumCount = debtData.filter(item => item.status === 'Средний').length;
  const lowCount = debtData.filter(item => item.status === 'Низкий').length;

  // Данные для регионов
  const regionDebtData = [24700000, 10500000, 8700000, 4300000, 3600000];
  const regionContracts = [12, 8, 7, 5, 4];
  const totalRegionDebt = regionDebtData.reduce((sum, debt) => sum + debt, 0);
  const regionPercents = regionDebtData.map(debt => Math.round((debt / totalRegionDebt) * 100));
  const totalClients = new Set(debtData.map(item => item.client)).size;

  // Данные по регионам - переименовано в "Контрактация по регионам"
  const regionContractData = regions.slice(0, 5).map((region, index) => ({
    name: region.name,
    value: 648 - (index * 100)
  }));

  const maxCityValue = Math.max(...regionContractData.map(city => city.value));

  // Таблица автомобилей с просроченными контрактами
  const carDebtData = [
    { model: 'damas2', count: 12, days: 8, img: carModelMap['damas2']?.img },
    { model: 'tracker2', count: 8, days: 6, img: carModelMap['tracker2']?.img },
    { model: 'captiva', count: 5, days: 5, img: carModelMap['captiva']?.img }
  ];

  // Фильтрованные данные по выбранной модели
  const getFilteredData = (dataArray, modelId) => {
    if (!modelId) return dataArray;
    return dataArray.filter(item => item.model === modelId);
  };

  // Фильтрованные данные по просроченным контрактам
  const filteredCarDebtData = useMemo(() => {
    return getFilteredData(carDebtData, selectedModel);
  }, [carDebtData, selectedModel]);

  const totalCars = filteredCarDebtData.reduce((sum, car) => sum + car.count, 0);

  // Общее количество по всем моделям (для отображения в заголовке)
  const totalAllCars = carDebtData.reduce((sum, car) => sum + car.count, 0);

  // Данные последних заказов с поддержкой фильтрации по модели
  const allRecentOrders = [
    { id: '78912', client: 'Ахмедов А.', model: 'damas2', price: 32500000, status: 'Доставлен', img: carModelMap['damas2']?.img },
    { id: '78911', client: 'Садыков М.', model: 'tracker2', price: 28700000, status: 'В пути', img: carModelMap['tracker2']?.img },
    { id: '78910', client: 'Каримова С.', model: 'captiva', price: 14200000, status: 'Новый', img: carModelMap['captiva']?.img },
    { id: '78909', client: 'Рахимов Т.', model: 'onix', price: 15600000, status: 'В пути', img: carModelMap['onix']?.img },
    { id: '78908', client: 'Исламов Д.', model: 'damas2', price: 12900000, status: 'Новый', img: carModelMap['damas2']?.img }
  ];

  const recentOrders = useMemo(() => {
    return selectedModel ? allRecentOrders.filter(order => order.model === selectedModel) : allRecentOrders;
  }, [allRecentOrders, selectedModel]);

  // Данные по регионам для каждого статуса (с учетом фильтрации по модели)
  const getRegionData = (status, modelId) => {
    const baseData = regions.slice(0, 5).map((region, index) => {
      // Генерация значений с учетом выбранной модели
      let value;
      if (status === 'notShipped') {
        value = 24 - (index * 5);
      } else {
        value = 15 - (index * 3);
      }
      
      // Если выбрана модель, уменьшаем значения пропорционально
      if (modelId) {
        const modelIndex = carModels.findIndex(m => m.id === modelId);
        const factor = 0.7 - (modelIndex * 0.15); // Разные факторы для разных моделей
        value = Math.floor(value * factor);
      }
      
      return {
        name: region.name,
        value: value > 0 ? value : 1 // Минимальное значение 1
      };
    });
    
    return baseData;
  };

  const regionData = {
    notShipped: getRegionData('notShipped', selectedModel),
    inTransit: getRegionData('inTransit', selectedModel)
  };

  // Генерация моделей для дилеров с учетом выбранной модели
  const generateModelData = (count, selectedModelId) => {
    const result = [];
    
    if (selectedModelId) {
      // Если выбрана модель, включаем только её
      const model = carModels.find(m => m.id === selectedModelId);
      if (model) {
        result.push({
          id: model.id,
          name: model.name,
          count: Math.floor(Math.random() * 3) + 1,
          img: model.img
        });
      }
    } else {
      // Иначе генерируем случайные модели
      for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * carModels.length);
        result.push({
          id: carModels[randomIndex].id,
          name: carModels[randomIndex].name,
          count: Math.floor(Math.random() * 3) + 1,
          img: carModels[randomIndex].img
        });
      }
    }
    
    return result;
  };

  // Данные по дилерам для каждого региона и статуса
  const getDealerData = (status, regionName, selectedModelId) => {
    const baseDealers = {
      'Ташкент': [
        { name: 'Автосалон Центральный', value: 10, models: generateModelData(3, selectedModelId) },
        { name: 'GM Premium', value: 8, models: generateModelData(3, selectedModelId) },
        { name: 'Авто-Максимум', value: 6, models: generateModelData(3, selectedModelId) },
      ],
      'Самарканд': [
        { name: 'GM Самарканд', value: 9, models: generateModelData(3, selectedModelId) },
        { name: 'Авто-Самарканд', value: 6, models: generateModelData(3, selectedModelId) },
        { name: 'Самарканд-Моторс', value: 3, models: generateModelData(3, selectedModelId) },
      ],
      'Бухара': [
        { name: 'Бухара-Авто', value: 7, models: generateModelData(3, selectedModelId) },
        { name: 'GM Бухара', value: 5, models: generateModelData(3, selectedModelId) },
      ]
    };
    
    // Если выбрана модель, корректируем значения
    if (selectedModelId && baseDealers[regionName]) {
      return baseDealers[regionName].map(dealer => {
        const factor = 0.6 + (Math.random() * 0.3); // Случайный фактор между 0.6 и 0.9
        return {
          ...dealer,
          value: Math.max(1, Math.floor(dealer.value * factor)), // Минимум 1
        };
      });
    }
    
    return baseDealers[regionName] || [];
  };

  const dealerData = {
    notShipped: {
      'Ташкент': getDealerData('notShipped', 'Ташкент', selectedModel),
      'Самарканд': getDealerData('notShipped', 'Самарканд', selectedModel),
      'Бухара': getDealerData('notShipped', 'Бухара', selectedModel),
    },
    inTransit: {
      'Ташкент': getDealerData('inTransit', 'Ташкент', selectedModel),
      'Самарканд': getDealerData('inTransit', 'Самарканд', selectedModel),
      'Бухара': getDealerData('inTransit', 'Бухара', selectedModel),
    }
  };

  // Данные продаж по моделям
  const getModelSalesData = () => {
    return carModels.map(car => {
      const randomSales = Math.floor(Math.random() * 200) + 100;
      const randomPercent = Math.random() * 60 + 40;
      return {
        ...car,
        sales: randomSales,
        percent: randomPercent
      };
    });
  };

  const modelSalesData = useMemo(() => getModelSalesData(), []);

  // Обработчики для навигации и интерактивности
  const handleModelSelect = (modelId) => {
    hapticFeedback('selection');
    setSelectedModel(modelId === selectedModel ? null : modelId);
  };

  const handleStatusSelect = (status) => {
    hapticFeedback('selection');
    setSelectedStatus(status);
    setActiveDetailLevel(1);
    setSelectedRegion(null);
    setSelectedDealer(null);
    setShowSidebar(true);
  };

  const handleRegionSelect = (region) => {
    hapticFeedback('selection');
    setSelectedRegion(region);
    setActiveDetailLevel(2);
    setSelectedDealer(null);
  };

  const handleDealerSelect = (dealer) => {
    hapticFeedback('selection');
    setSelectedDealer(dealer);
    setActiveDetailLevel(3);
  };

  const handleBack = () => {
    hapticFeedback('impact');
    if (activeDetailLevel === 3) {
      setActiveDetailLevel(2);
      setSelectedDealer(null);
    } else if (activeDetailLevel === 2) {
      setActiveDetailLevel(1);
      setSelectedRegion(null);
    } else if (activeDetailLevel === 1) {
      setActiveDetailLevel(0);
      setSelectedStatus(null);
      setShowSidebar(false);
    }
  };

  // Получение максимального значения для прогрессбаров
  const getMaxValue = (dataArray) => {
    return Math.max(...dataArray.map(item => item.value));
  };

  // Эффект для обновления заголовка при смене модели
  useEffect(() => {
    const titleElement = document.getElementById('dashboard-title');
    if (titleElement && selectedModel) {
      const model = carModels.find(m => m.id === selectedModel);
      if (model) {
        titleElement.innerHTML = `Мониторинг продаж: ${model.name}`;
      }
    } else if (titleElement) {
      titleElement.innerHTML = 'Мониторинг продаж автомобилей';
    }
  }, [selectedModel]);

  // Рендеринг содержимого бокового окна
  const renderSidebarContent = () => {
    if (activeDetailLevel === 0 || !selectedStatus) return null;

    const statusTitle = selectedStatus === 'notShipped' ? 'Не отгружено >48ч' : 'В пути >3 дней';
    const statusColor = selectedStatus === 'notShipped' ? 'blue' : 'yellow';
    const statusIcon = selectedStatus === 'notShipped' ? <Archive size={20} /> : <Truck size={20} />;

    // Уровень 1: Список регионов
    if (activeDetailLevel === 1) {
      const regions = regionData[selectedStatus];
      const maxRegionValue = getMaxValue(regions);
      
      return (
        <div className="h-full flex flex-col">
          <div className="flex items-center gap-2 p-3 border-b border-gray-700 bg-gray-800/70">
            <div className={`text-${statusColor}-400`}>{statusIcon}</div>
            <h3 className="text-lg font-medium text-white">
              {statusTitle}
              {selectedModel && (
                <span className="ml-2 text-sm text-gray-400">
                  • {carModels.find(m => m.id === selectedModel)?.name}
                </span>
              )}
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            <div className="text-sm text-gray-400 mb-3 px-2">Выберите регион для детализации:</div>
            
            <div className="space-y-2">
              {regions.map((region, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg border ${selectedRegion === region.name ? `bg-${statusColor}-900/30 border-${statusColor}-700` : 'bg-gray-800/60 border-gray-700'} 
                    hover:bg-gray-700/70 cursor-pointer transition-all`}
                  onClick={() => handleRegionSelect(region.name)}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={16} className={`text-${statusColor}-400`} />
                      <span className="text-white font-medium">{region.name}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full bg-${statusColor}-900/40 text-${statusColor}-300`}>
                      {region.value}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full bg-${statusColor}-600`}
                        style={{ width: `${(region.value / maxRegionValue) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-400 w-12 text-right">
                      {Math.round((region.value / maxRegionValue) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    // Уровень 2: Список дилеров для выбранного региона
    if (activeDetailLevel === 2 && selectedRegion) {
      const dealers = dealerData[selectedStatus][selectedRegion] || [];
      const maxDealerValue = dealers.length > 0 ? getMaxValue(dealers) : 0;
      
      return (
        <div className="h-full flex flex-col">
          <div className="flex items-center gap-2 p-3 border-b border-gray-700 bg-gray-800/70">
            <button 
              onClick={handleBack}
              className="p-1 rounded-full hover:bg-gray-700"
            >
              <ChevronLeft size={18} />
            </button>
            <h3 className="text-lg font-medium text-white">
              <span className={`text-${statusColor}-400 text-sm mr-1`}>{statusTitle}</span>
              {selectedRegion}
              {selectedModel && (
                <span className="ml-2 text-sm text-gray-400">
                  • {carModels.find(m => m.id === selectedModel)?.name}
                </span>
              )}
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            <div className="text-sm text-gray-400 mb-3 px-2">Список дилеров:</div>
            
            <div className="space-y-2">
              {dealers.map((dealer, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg border ${selectedDealer === dealer.name ? `bg-${statusColor}-900/30 border-${statusColor}-700` : 'bg-gray-800/60 border-gray-700'} 
                    hover:bg-gray-700/70 cursor-pointer transition-all`}
                  onClick={() => handleDealerSelect(dealer.name)}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Users size={16} className="text-gray-400" />
                      <span className="text-white font-medium">{dealer.name}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full bg-${statusColor}-900/40 text-${statusColor}-300`}>
                      {dealer.value}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full bg-${statusColor}-600`}
                        style={{ width: `${(dealer.value / maxDealerValue) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-400 w-12 text-right">
                      {Math.round((dealer.value / maxDealerValue) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    // Уровень 3: Детализация по моделям для выбранного дилера
    if (activeDetailLevel === 3 && selectedDealer && selectedRegion) {
      const dealers = dealerData[selectedStatus][selectedRegion] || [];
      const dealer = dealers.find(d => d.name === selectedDealer);
      
      if (!dealer) return null;
      
      return (
        <div className="h-full flex flex-col">
          <div className="flex items-center gap-2 p-3 border-b border-gray-700 bg-gray-800/70">
            <button 
              onClick={handleBack}
              className="p-1 rounded-full hover:bg-gray-700"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex flex-col">
              <h3 className="text-lg font-medium text-white">{selectedDealer}</h3>
              <div className="flex items-center text-sm">
                <span className={`text-${statusColor}-400 mr-1`}>{statusTitle}</span>
                <span className="text-gray-400">• {selectedRegion}</span>
                {selectedModel && (
                  <span className="ml-2 text-gray-400">
                    • {carModels.find(m => m.id === selectedModel)?.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3">
            <div className="bg-gray-800/70 rounded-lg p-4 mb-4 border border-gray-700">
              <div className="flex justify-between items-center mb-3">
                <div className="text-sm text-gray-400">Всего автомобилей:</div>
                <div className="text-2xl font-bold text-white">{dealer.value}</div>
              </div>
              
              <div className="mb-2 text-sm text-gray-400">Распределение по моделям:</div>
              
              <div className="space-y-2">
                {dealer.models.map((model, idx) => {
                  const percentage = (model.count / dealer.value) * 100;
                  
                  return (
                    <div key={idx} className="bg-gray-700/50 rounded-lg p-2 border border-gray-600/50">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-md overflow-hidden bg-gray-600/30">
                            <img 
                              src={model.img} 
                              alt={model.name} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-white">{model.name}</span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full bg-${statusColor}-900/40 text-${statusColor}-300`}>
                          {model.count}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full bg-${statusColor}-600`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-400 w-10 text-right">
                          {Math.round(percentage)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="bg-gray-800/70 rounded-lg p-4 border border-gray-700">
              <h4 className="font-medium text-white mb-3">Рекомендуемые действия:</h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm">
                  <Clock size={16} className="text-gray-400 mt-0.5" />
                  <span className="text-gray-300">Запросить обновление статуса</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <AlertTriangle size={16} className="text-yellow-400 mt-0.5" />
                  <span className="text-gray-300">Проверить договоры на отложенные поставки</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Zap size={16} className="text-green-400 mt-0.5" />
                  <span className="text-gray-300">Связаться с менеджером дилерского центра</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  // Общий шаблон с интерактивной боковой панелью
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-950 p-4 font-sans text-gray-300 min-h-screen relative">
      {/* Плавающая боковая панель */}
      <div 
        className={`fixed top-0 right-0 h-full w-80 bg-gray-850 backdrop-blur-sm border-l border-gray-700 shadow-xl transform transition-transform duration-300 z-50 
        ${showSidebar ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ backgroundColor: 'rgba(17, 24, 39, 0.95)' }}
      >
        {renderSidebarContent()}
        
        {showSidebar && activeDetailLevel > 0 && (
          <button 
            className="absolute top-1/2 -left-10 transform -translate-y-1/2 bg-gray-800 text-gray-400 p-2 rounded-l-lg border border-r-0 border-gray-700"
            onClick={() => setShowSidebar(false)}
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>
      
      {/* Плавающая кнопка для возврата к сайдбару */}
      {!showSidebar && activeDetailLevel > 0 && (
        <button 
          className="fixed top-1/2 right-0 transform -translate-y-1/2 bg-gray-800 text-gray-400 p-2 rounded-l-lg border border-r-0 border-gray-700 z-50"
          onClick={() => setShowSidebar(true)}
        >
          <ChevronLeft size={18} />
        </button>
      )}
      
      {/* Главная панель - обновленный дизайн */}
      <div className="">
        {/* Шапка с индикатором пути */}
        <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg p-3 mb-5 border border-gray-700/50 shadow-md flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <BarChart3 size={20} className="text-white" />
            </div>
            <div>
              <h1 id="dashboard-title" className="text-xl font-bold text-white">
                {selectedModel 
                  ? `Мониторинг продаж: ${carModels.find(m => m.id === selectedModel)?.name}` 
                  : "Мониторинг продаж автомобилей"}
              </h1>
              <div className="text-sm text-gray-400 flex items-center gap-1">
                <span>Дилерский центр</span>
                <span>•</span>
                <span>Ташкент</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-gray-700/70 rounded-lg text-sm text-white flex items-center gap-1.5">
              <Calendar size={14} />
              <span>{new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
        
        {/* Информационная панель - переименовано в "Задолженность по общим контрактам" */}
        <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg mb-5 border border-gray-700/50 shadow-md overflow-hidden">
          <div className="flex justify-between items-center p-3 border-b border-gray-700">
            <h2 className="text-base font-medium text-white flex items-center gap-2">
              <Activity size={18} className="text-blue-400" />
              Задолженность по общим контрактам
              {selectedModel && (
                <span className="ml-2 text-sm text-gray-400">
                  • {carModels.find(m => m.id === selectedModel)?.name}
                </span>
              )}
            </h2>
            <span className="text-sm text-gray-400">Активные задачи: <span className="text-white font-medium">89</span>/276</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            <div 
             onClick={() => handleStatusSelect('notShipped')}
              className="relative p-4 border-r border-gray-700 cursor-pointer hover:bg-gray-700/30 transition-colors group"
            >
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-900/30"></div>
              <div className="absolute bottom-0 left-0 h-1 bg-blue-600" 
                   style={{ width: `${(contractDebtData.notShipped / (contractDebtData.notShipped + contractDebtData.inTransit + contractDebtData.delivered)) * 100}%` }}></div>
              
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-900/40 flex items-center justify-center">
                  <Archive size={22} className="text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-white mb-1">{contractDebtData.notShipped}</div>
                  <div className="text-sm text-blue-300 flex items-center justify-between">
                    <span>Не отгружены 48ч</span>
                    <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            </div>
            
            <div 
              onClick={() => handleStatusSelect('inTransit')}
              className="relative p-4 border-r border-gray-700 cursor-pointer hover:bg-gray-700/30 transition-colors group"
            >
              <div className="absolute bottom-0 left-0 w-full h-1 bg-yellow-900/30"></div>
              <div className="absolute bottom-0 left-0 h-1 bg-yellow-600" 
                   style={{ width: `${(contractDebtData.inTransit / (contractDebtData.notShipped + contractDebtData.inTransit + contractDebtData.delivered)) * 100}%` }}></div>
              
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-yellow-900/40 flex items-center justify-center">
                  <Truck size={22} className="text-yellow-400" />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-white mb-1">{contractDebtData.inTransit}</div>
                  <div className="text-sm text-yellow-300 flex items-center justify-between">
                    <span>В пути 3 дней</span>
                    <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative p-4 border-l-0 border-gray-700">
              <div className="absolute bottom-0 left-0 w-full h-1 bg-green-900/30"></div>
              <div className="absolute bottom-0 left-0 h-1 bg-green-600" 
                   style={{ width: `${(contractDebtData.delivered / (contractDebtData.notShipped + contractDebtData.inTransit + contractDebtData.delivered)) * 100}%` }}></div>
              
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-green-900/40 flex items-center justify-center">
                  <Check size={22} className="text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white mb-1">{contractDebtData.delivered}</div>
                  <div className="text-sm text-green-300">Доставлено</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Сетка отчетов */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          {/* Обновленный график продаж */}
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-700/50 shadow-lg overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <BarChart3 size={20} className="text-purple-400" />
                Продажи за {activeTab === 'месяц' ? 'последние 30 дней' : 'год'}
                {selectedModel && (
                  <span className="ml-2 text-sm text-gray-400">
                    • {carModels.find(m => m.id === selectedModel)?.name}
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">98,546</span>
                <span className="px-2 py-1 bg-green-900/50 text-green-400 text-sm rounded-md border border-green-800">
                  +26.7%
                </span>
              </div>
            </div>
            
            {/* Панель управления - крупнее и четче */}
            <div className="p-4 bg-gray-850 border-b border-gray-700">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-grow">
                  <div className="mb-2 text-sm font-medium text-gray-300">Период анализа:</div>
                  <div className="flex space-x-3">
                    <select 
                      className="bg-gray-700 border-2 border-gray-600 rounded-md px-4 py-2 text-sm text-white appearance-none pr-10 focus:outline-none focus:border-purple-500"
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          setShowPeriodFilter(true);
                        } else {
                          const now = new Date();
                          let start = new Date();
                          
                          switch(e.target.value) {
                            case '7days': start.setDate(now.getDate() - 7); break;
                            case '30days': start.setDate(now.getDate() - 30); break;
                            case '90days': start.setDate(now.getDate() - 90); break;
                            case '6months': start.setMonth(now.getMonth() - 6); break;
                            case '12months': start.setMonth(now.getMonth() - 12); break;
                          }
                          
                          setPeriod({
                            start: start.toISOString().split('T')[0],
                            end: now.toISOString().split('T')[0]
                          });
                        }
                      }}
                    >
                      <option value="30days">Последние 30 дней</option>
                      <option value="7days">Последние 7 дней</option>
                      <option value="90days">Последние 3 месяца</option>
                      <option value="6months">Последние 6 месяцев</option>
                      <option value="12months">Последние 12 месяцев</option>
                      <option value="custom">Произвольный период</option>
                    </select>
                    
                    <button
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors shadow-md"
                      onClick={() => setShowPeriodFilter(true)}
                    >
                      <Calendar size={16} />
                      <span>Выбрать даты</span>
                    </button>
                  </div>
                </div>
                
                <div className="flex-grow-0">
                  <div className="mb-2 text-sm font-medium text-gray-300">Дополнительно:</div>
                  <button 
                    className={`min-w-[180px] py-2 px-4 rounded-md text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
                      showComparison 
                        ? 'bg-purple-600 hover:bg-purple-500 text-white border-2 border-purple-500' 
                        : 'bg-gray-700 hover:bg-gray-600 text-white border-2 border-gray-600'
                    }`}
                    onClick={() => setShowComparison(!showComparison)}
                  >
                    <Activity size={16} />
                    <span>Сравнить с прошлым годом</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {/* НОВЫЙ ГРАФИК С ГАРАНТИРОВАННОЙ ВИДИМОСТЬЮ */}
              <div className="relative h-80 mb-8 bg-gray-900 rounded-lg p-3 border border-gray-700 shadow-inner">
                {/* Ось Y и горизонтальные линии */}
                <div className="absolute left-0 top-0 bottom-6 w-12 border-r border-gray-700 flex flex-col justify-between px-2">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center h-6 -translate-y-3">
                      <span className="text-xs font-medium text-gray-400">
                        {Math.round(maxValue - (i * (maxValue / 4)))}
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Горизонтальные линии для сетки */}
                <div className="absolute left-12 right-4 top-0 bottom-6 flex flex-col justify-between">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-full border-b border-gray-700/50 h-0"></div>
                  ))}
                </div>
                
                {/* Контейнер для столбцов */}
                <div className="absolute left-16 right-8 top-4 bottom-10 flex items-end justify-between">
                  {salesData.map((value, index) => {
                    // Высоты в процентах для текущего и прошлого года
                    const currentYearHeight = (value / maxValue) * 100;
                    const lastYearHeight = showComparison ? (lastYearSalesData[index] / maxValue) * 100 : 0;
                    const percentChange = lastYearSalesData[index] > 0 
                      ? ((value - lastYearSalesData[index]) / lastYearSalesData[index] * 100).toFixed(1) 
                      : 0;
                    
                    return (
                      <div key={index} className="group relative h-full" style={{ width: `${100 / salesData.length - 2}%` }}>
                        {/* ТУЛТИП С ИНФОРМАЦИЕЙ */}
                        <div className="opacity-0 group-hover:opacity-100 absolute bottom-[105%] left-1/2 -translate-x-1/2 bg-gray-800 text-white p-3 rounded-md text-sm min-w-[160px] transition-opacity shadow-xl z-20 border-2 border-gray-700">
                          <div className="font-bold text-center mb-2 text-purple-300">{months[index]}</div>
                          <table className="w-full">
                            <tbody>
                              <tr>
                                <td className="py-1 text-gray-300">Текущий год:</td>
                                <td className="py-1 font-bold text-right">{value.toLocaleString()}</td>
                              </tr>
                              {showComparison && (
                                <>
                                  <tr>
                                    <td className="py-1 text-gray-300">Прошлый год:</td>
                                    <td className="py-1 font-bold text-right">{lastYearSalesData[index].toLocaleString()}</td>
                                  </tr>
                                  <tr className="border-t border-gray-700">
                                    <td className="py-1 pt-2 text-gray-300">Изменение:</td>
                                    <td className={`py-1 pt-2 font-bold text-right ${percentChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                      {percentChange > 0 ? '+' : ''}{percentChange}%
                                    </td>
                                  </tr>
                                </>
                              )}
                            </tbody>
                          </table>
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-8 border-transparent border-t-gray-800"></div>
                        </div>
                        
                        {/* КОНТЕЙНЕР ДЛЯ СТОЛБЦОВ */}
                        <div className="relative h-full w-full flex justify-center items-end group">
                          {/* Область для интерактивности */}
                          <div className="absolute inset-0 z-10 cursor-pointer"></div>
                          
                          {/* СТОЛБЦЫ */}
                          <div className="relative flex items-end h-full">
                            {/* Столбец прошлого года */}
                            {showComparison && (
                              <div 
                                className="w-6 bg-blue-500 hover:bg-blue-400 transition-colors rounded-sm mx-0.5 transform group-hover:translate-x-1 shadow-lg"
                                style={{ 
                                  height: `${lastYearHeight}%`, 
                                  minHeight: lastYearHeight > 0 ? '4px' : '0',
                                  opacity: 0.7
                                }}
                              ></div>
                            )}
                            
                            {/* Столбец текущего года - ОЧЕНЬ ЯРКИЙ И ЗАМЕТНЫЙ */}
                            <div 
                              className={`w-10 bg-gradient-to-t from-purple-700 via-purple-600 to-purple-500 hover:from-purple-600 hover:via-purple-500 hover:to-purple-400 transition-all rounded-sm group-hover:scale-105 transform shadow-[0_0_15px_rgba(168,85,247,0.5)] z-20`}
                              style={{ 
                                height: `${currentYearHeight}%`, 
                                minHeight: currentYearHeight > 0 ? '4px' : '0',
                              }}
                            >
                              {/* Значение над столбцом */}
                              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-white">
                                {value}
                              </div>
                              
                              {/* Индикатор изменения */}
                              {showComparison && percentChange !== 0 && (
                                <div className={`absolute top-0 right-0 -mr-1 -mt-1 px-1 py-0.5 rounded-sm text-xs font-bold ${percentChange > 0 ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                                  {percentChange > 0 ? '↑' : '↓'}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Метка месяца */}
                          <div className="absolute bottom-0 left-0 right-0 text-center translate-y-6 text-xs font-medium text-white">
                            {months[index]}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Ось X */}
                <div className="absolute left-12 right-4 bottom-0 h-6 border-t border-gray-700"></div>
              </div>
              
              {/* ЛЕГЕНДА И СТАТИСТИКА */}
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 flex flex-wrap justify-between items-center">
                {/* Легенда */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-10 rounded-sm bg-gradient-to-t from-purple-700 via-purple-600 to-purple-500"></div>
                    <span className="text-sm font-medium text-white">Текущий год</span>
                  </div>
                  
                  {showComparison && (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-10 rounded-sm bg-blue-500 opacity-70"></div>
                      <span className="text-sm font-medium text-white">Прошлый год</span>
                    </div>
                  )}
                </div>
                
                {/* Общая статистика */}
                <div className="px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="text-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-300">Всего за период:</span>
                      <span className="text-xl font-bold text-white">{salesData.reduce((a, b) => a + b, 0).toLocaleString()}</span>
                      
                      {showComparison && (
                        <>
                          <span className="text-gray-400 mx-2">•</span>
                          <span className="text-gray-300">Рост:</span>
                          <span className="text-lg font-bold text-green-400">+12.3%</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Переключатель между месяцами и годами */}
              <div className="mt-4 flex justify-between items-center">
                <div className="inline-flex rounded-md shadow-sm">
                  <button
                    className={`px-4 py-2 text-sm font-medium rounded-l-md border-2 ${
                      activeTab === 'месяц' 
                        ? 'bg-purple-700 text-white border-purple-600' 
                        : 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600'
                    }`}
                    onClick={() => setActiveTab('месяц')}
                  >
                    МЕСЯЦЫ
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-medium rounded-r-md border-2 ${
                      activeTab === 'год' 
                        ? 'bg-purple-700 text-white border-purple-600' 
                        : 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600'
                    }`}
                    onClick={() => setActiveTab('год')}
                  >
                    ГОДЫ
                  </button>
                </div>
                
                <div className="flex gap-3">
                  <button className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-md flex items-center gap-2 border border-gray-600">
                    <Filter size={16} />
                    <span>Фильтры</span>
                  </button>
                  
                  <button className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-md flex items-center gap-2">
                    <Download size={16} />
                    <span>Экспорт CSV</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* УЛУЧШЕННАЯ ТАБЛИЦА ЗАДОЛЖЕННОСТИ ПО КОНТРАКТАМ */}
          <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg border border-gray-700/50 shadow-md overflow-hidden">
            <div className="flex justify-between items-center p-3 border-b border-gray-700">
              <h3 className="text-base font-medium text-white flex items-center gap-2">
                <AlertTriangle size={18} className="text-yellow-400" />
                Задолженность по контрактам
                {selectedModel && (
                  <span className="ml-2 text-sm text-gray-400">
                    • {carModels.find(m => m.id === selectedModel)?.name}
                  </span>
                )}
              </h3>
              <div className="text-sm text-yellow-300">
                Общая просрочка: <span className="font-bold">{totalDebtDays} {getDayWord(totalDebtDays)}</span>
              </div>
            </div>
            
            <div className="p-3">
              <div className="rounded-lg overflow-hidden border border-gray-700">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900/80">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-400 font-medium">№ Контракта</th>
                      <th className="px-3 py-2 text-left text-gray-400 font-medium">Клиент</th>
                      <th className="px-3 py-2 text-left text-gray-400 font-medium">Модель</th>
                      <th className="px-3 py-2 text-right text-gray-400 font-medium">Сумма долга (UZS)</th>
                      <th className="px-3 py-2 text-center text-gray-400 font-medium">Просрочка</th>
                      <th className="px-3 py-2 text-center text-gray-400 font-medium">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {debtData.map((item, index) => (
                      <tr key={index} className={`${index % 2 === 0 ? 'bg-gray-800/60' : 'bg-gray-850/70'} hover:bg-gray-700/70 cursor-pointer`}>
                        <td className="px-3 py-2 font-medium text-white">{item.contractId}</td>
                        <td className="px-3 py-2 text-gray-300">{item.client}</td>
                        <td className="px-3 py-2 text-gray-300">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-md overflow-hidden bg-gray-600/30">
                              <img 
                                src={item.modelImg} 
                                alt={item.modelName} 
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <span>{item.modelName}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right text-gray-300 font-medium">{item.debt.toLocaleString()}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                            item.days > 7 ? 'bg-red-900/30 text-red-400 border border-red-800/50' :
                            item.days > 3 ? 'bg-orange-900/30 text-orange-400 border border-orange-800/50' :
                            'bg-yellow-900/30 text-yellow-400 border border-yellow-800/50'
                          }`}>
                            {item.days} {getDayWord(item.days)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                            item.status === 'Критический' ? 'bg-red-900/30 text-red-400 border border-red-800/50' :
                            item.status === 'Средний' ? 'bg-orange-900/30 text-orange-400 border border-orange-800/50' :
                            'bg-yellow-900/30 text-yellow-400 border border-yellow-800/50'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-900/80">
                    <tr>
                      <td className="px-3 py-2 font-medium text-white">Итого</td>
                      <td className="px-3 py-2">{debtData.length} контрактов</td>
                      <td></td>
                      <td className="px-3 py-2 text-right font-medium text-white">
                        {debtData.reduce((sum, item) => sum + item.debt, 0).toLocaleString()} UZS
                      </td>
                      <td className="px-3 py-2 text-center text-red-400 text-xs font-medium">
                        В среднем: {avgDebtDays} {getDayWord(avgDebtDays)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              <div className="mt-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-xs text-gray-300">{`Критическая (>7 дней): ${criticalCount}`}</span>
                  
                  <div className="w-3 h-3 rounded-full bg-orange-500 ml-3"></div>
                  <span className="text-xs text-gray-300">Средняя (3-6 дней): {mediumCount}</span>
                  
                  <div className="w-3 h-3 rounded-full bg-yellow-500 ml-3"></div>
                  <span className="text-xs text-gray-300">{`Низкая (<3 дней): ${lowCount}`}</span>
                </div>
                
                <button className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300">
                  <span>Все задолженности</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* НОВЫЙ БЛОК ДЕТАЛИЗАЦИИ ПО РЕГИОНАМ */}
        <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg border border-gray-700/50 shadow-md overflow-hidden mb-5">
<div className="bg-gray-800/70 backdrop-blur-sm rounded-lg border border-gray-700/50 shadow-md overflow-hidden mt-5 mb-5">
  <div className="flex justify-between items-center p-3 border-b border-gray-700">
    <h3 className="text-base font-medium text-white flex items-center gap-2">
      <MapPin size={18} className="text-red-400" />
      Задолженность по регионам
      {selectedModel && (
        <span className="ml-2 text-sm text-gray-400">
          • {carModels.find(m => m.id === selectedModel)?.name}
        </span>
      )}
      {selectedRegion && (
        <span className="ml-2 text-sm text-blue-400">
          • {selectedRegion}
        </span>
      )}
    </h3>
    <div className="flex items-center gap-2">
      {selectedRegion && (
        <button 
          onClick={() => setSelectedRegion(null)}
          className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm text-white flex items-center gap-1.5 transition-colors"
        >
          <ChevronLeft size={14} />
          <span>Назад</span>
        </button>
      )}
      <button className="px-2.5 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white flex items-center gap-1.5 transition-colors">
        <Download size={14} />
        <span>Экспорт</span>
      </button>
    </div>
  </div>
  
  <div className="p-4">
    {!selectedRegion ? (
      // Список регионов - упрощенный
      <div>
        <div className="mb-4">
          <div className="bg-gray-750/60 rounded-lg border border-gray-700 p-3 mb-2">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white font-medium">Регион</span>
              <span className="text-white font-medium">Задолженность (UZS)</span>
            </div>
          </div>
          
          {regions.slice(0, 5).map((region, idx) => {
            // Определяем статус задолженности
            const statusColor = idx === 0 ? 'red' : idx === 1 ? 'orange' : 'yellow';
            const percentValue = Math.round((regionDebtData[idx] / regionDebtData.reduce((a, b) => a + b, 0)) * 100);
            
            return (
              <div 
                key={idx}
                className="bg-gray-800/60 hover:bg-gray-700/70 border border-gray-700 rounded-lg p-3 cursor-pointer transition-colors mb-2"
                onClick={() => setSelectedRegion(region.name)}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-${statusColor}-500`}></div>
                    <div className="text-white">{region.name}</div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-white font-medium">{regionDebtData[idx].toLocaleString()} UZS</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full bg-${statusColor}-600`}
                      style={{ width: `${percentValue}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-400 w-10 text-right">
                    {percentValue}%
                  </span>
                </div>
                
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>Контрактов: {regionContracts[idx]}</span>
                  <span>Статус: {idx === 0 ? 'Критический' : idx === 1 ? 'Средний' : 'Низкий'}</span>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="bg-gray-750/60 rounded-lg border border-gray-700 p-3">
          <div className="text-sm text-white mb-2 flex justify-between">
            <span>Общая задолженность:</span>
            <span className="font-bold">{regionDebtData.reduce((a, b) => a + b, 0).toLocaleString()} UZS</span>
          </div>
          <div className="text-xs text-gray-400 mb-3">
            Нажмите на регион для просмотра детальной информации
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-xs text-gray-300">Критический</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-xs text-gray-300">Средний</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-xs text-gray-300">Низкий</span>
            </div>
          </div>
        </div>
      </div>
    ) : (
      // Детальная информация по выбранному региону - упрощенная
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="bg-gray-750/60 rounded-lg border border-gray-700 p-3">
            <div className="text-xs text-gray-400 mb-1">Общая задолженность</div>
            <div className="text-lg font-bold text-white mb-1">
              {regionDebtData[regions.findIndex(r => r.name === selectedRegion)].toLocaleString()} UZS
            </div>
            <div className="text-xs text-red-400">+12.4% к прошлому месяцу</div>
          </div>
          
          <div className="bg-gray-750/60 rounded-lg border border-gray-700 p-3">
            <div className="text-xs text-gray-400 mb-1">Активных контрактов</div>
            <div className="text-lg font-bold text-white mb-1">
              {regionContracts[regions.findIndex(r => r.name === selectedRegion)]}
            </div>
            <div className="text-xs text-blue-400">+3 за последнюю неделю</div>
          </div>
          
          <div className="bg-gray-750/60 rounded-lg border border-gray-700 p-3">
            <div className="text-xs text-gray-400 mb-1">Средний срок просрочки</div>
            <div className="text-lg font-bold text-white mb-1">7 дней</div>
            <div className="text-xs text-green-400">-2 дня к прошлой неделе</div>
          </div>
        </div>
        
        {/* ПРОСТОЙ ГРАФИК ДИНАМИКИ ЗАДОЛЖЕННОСТИ */}
        <div className="bg-gray-750/60 rounded-lg border border-gray-700 p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-white text-sm font-medium">
              Динамика задолженности в регионе {selectedRegion}
            </h4>
            
            <div className="flex gap-2">
              <button className="px-2 py-1 bg-blue-600 rounded text-xs text-white">6М</button>
              <button className="px-2 py-1 bg-gray-700 rounded text-xs text-white">1Г</button>
            </div>
          </div>
          
          <div className="h-56 bg-gray-800/60 rounded-lg border border-gray-700 p-3 relative">
            {/* Простой SVG график */}
            <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
              {/* Горизонтальные линии */}
              <line x1="0" y1="0" x2="600" y2="0" stroke="#374151" strokeWidth="1" />
              <line x1="0" y1="50" x2="600" y2="50" stroke="#374151" strokeWidth="1" />
              <line x1="0" y1="100" x2="600" y2="100" stroke="#374151" strokeWidth="1" />
              <line x1="0" y1="150" x2="600" y2="150" stroke="#374151" strokeWidth="1" />
              <line x1="0" y1="200" x2="600" y2="200" stroke="#374151" strokeWidth="1" />
              
              {/* Линия тренда */}
              <path 
                d="M0,150 L100,160 L200,120 L300,135 L400,90 L500,70 L600,40" 
                fill="none" 
                stroke="#3b82f6" 
                strokeWidth="3"
              />
              
              {/* Точки данных */}
              <circle cx="0" cy="150" r="4" fill="#3b82f6" />
              <circle cx="100" cy="160" r="4" fill="#3b82f6" />
              <circle cx="200" cy="120" r="4" fill="#3b82f6" />
              <circle cx="300" cy="135" r="4" fill="#3b82f6" />
              <circle cx="400" cy="90" r="4" fill="#3b82f6" />
              <circle cx="500" cy="70" r="4" fill="#3b82f6" />
              <circle cx="600" cy="40" r="4" fill="#3b82f6" />
            </svg>
            
            {/* Метки по оси X и Y */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-400 px-2">
              <span>Янв</span>
              <span>Фев</span>
              <span>Мар</span>
              <span>Апр</span>
              <span>Май</span>
              <span>Июн</span>
            </div>
            
            <div className="absolute top-0 left-0 bottom-0 flex flex-col justify-between text-xs text-gray-400 py-1">
              <span>30M</span>
              <span>24M</span>
              <span>18M</span>
              <span>12M</span>
              <span>6M</span>
              <span>0</span>
            </div>
          </div>
        </div>
        
        {/* ТАБЛИЦА ЗАДОЛЖЕННОСТЕЙ ПО МОДЕЛЯМ - ЧЕТКАЯ И ПОНЯТНАЯ */}
        <div className="bg-gray-750/60 rounded-lg border border-gray-700 p-4">
          <h4 className="text-white text-sm font-medium mb-3">
            Задолженность по моделям в регионе {selectedRegion}
          </h4>
          
          <div className="overflow-hidden rounded-lg border border-gray-700 mb-3">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/80">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-400 font-medium">Модель</th>
                  <th className="px-3 py-2 text-center text-gray-400 font-medium">Контракты</th>
                  <th className="px-3 py-2 text-right text-gray-400 font-medium">Сумма долга (UZS)</th>
                  <th className="px-3 py-2 text-center text-gray-400 font-medium">Ср. просрочка</th>
                  <th className="px-3 py-2 text-center text-gray-400 font-medium">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {carModels.map((model, idx) => {
                  // Генерируем данные
                  const contractCount = Math.floor(Math.random() * 5) + 1;
                  const debtAmount = (Math.floor(Math.random() * 2000) + 1000) * 10000;
                  const avgDelay = Math.floor(Math.random() * 8) + 2;
                  const status = avgDelay > 7 ? 'Критический' : avgDelay > 4 ? 'Средний' : 'Низкий';
                  const statusColor = status === 'Критический' ? 'red' : status === 'Средний' ? 'orange' : 'yellow';
                  
                  return (
                    <tr 
                      key={idx} 
                      className={`${idx % 2 === 0 ? 'bg-gray-800/60' : 'bg-gray-750/80'} hover:bg-gray-700/70 cursor-pointer`}
                      onClick={() => handleModelSelect(model.id)}
                    >
                      <td className="px-3 py-2 text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-md overflow-hidden bg-gray-600/30">
                            <img 
                              src={model.img} 
                              alt={model.name} 
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <span>{model.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center text-gray-300">{contractCount}</td>
                      <td className="px-3 py-2 text-right text-gray-300 font-medium">{debtAmount.toLocaleString()}</td>
                      <td className="px-3 py-2 text-center text-gray-300">{avgDelay} {getDayWord(avgDelay)}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs bg-${statusColor}-900/30 text-${statusColor}-400 border border-${statusColor}-800/50`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-900/80">
                <tr>
                  <td className="px-3 py-2 font-medium text-white">Итого</td>
                  <td className="px-3 py-2 text-center text-white font-medium">
                    {regionContracts[regions.findIndex(r => r.name === selectedRegion)]}
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-white">
                    {regionDebtData[regions.findIndex(r => r.name === selectedRegion)].toLocaleString()} UZS
                  </td>
                  <td className="px-3 py-2 text-center text-white font-medium">7 дней</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          <div className="flex justify-end gap-2">
            <button className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded flex items-center gap-1.5 transition-colors">
              <Download size={16} />
              <span>Экспорт</span>
            </button>
            <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded flex items-center gap-1.5 transition-colors">
              <Clock size={16} />
              <span>Отправить напоминания</span>
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
</div>
        </div>
        

        {/* Панель моделей автомобилей - с интерактивным выбором */}
        <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg border border-gray-700/50 shadow-md overflow-hidden mt-5">
          <div className="flex justify-between items-center p-3 border-b border-gray-700">
            <h3 className="text-base font-medium text-white flex items-center gap-2">
              <Car size={18} className="text-green-400" />
              Популярные модели
            </h3>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {modelSalesData.map((car, index) => (
                <div 
                  key={index} 
                  className={`bg-gray-700/40 rounded-lg p-3 border transition-all ${
                    selectedModel === car.id 
                      ? 'border-green-500 bg-gray-700/70 shadow-[0_0_10px_rgba(34,197,94,0.3)]' 
                      : 'border-gray-600/50 hover:bg-gray-700/60'
                  }`}
                  onClick={() => handleModelSelect(car.id)}
                >
                  <div className="h-32 flex items-center justify-center mb-3 bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-lg">
                    <img 
                      src={car.img} 
                      alt={car.name} 
                      className="h-full object-contain p-2"
                    />
                  </div>
                  <div className="text-center">
                    <h4 className="text-white font-medium mb-1">{car.name}</h4>
                    <div className="text-xs text-gray-400 mb-2">
                      {car.category === 'suv' && 'Внедорожник'}
                      {car.category === 'sedan' && 'Седан'}
                      {car.category === 'minivan' && 'Минивэн'}
                      {car.category === 'hatchback' && 'Хэтчбек'}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Продано:</span>
                      <span className="text-sm text-white font-medium">{car.sales}</span>
                    </div>
                    <div className="mt-1 w-full bg-gray-800 rounded-full h-1.5">
                      <div 
                        className="h-1.5 rounded-full bg-green-600"
                        style={{ width: `${car.percent}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {selectedModel === car.id && (
                    <div className="mt-3 flex justify-center">
                      <button 
                        className="w-full py-1.5 text-xs bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedModel(null);
                        }}
                      >
                        Сбросить фильтр
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-4 flex justify-center">
              <button className="flex items-center gap-1.5 px-4 py-2 bg-gray-700 rounded-md text-sm text-white hover:bg-gray-600 transition-colors">
                <span>Показать все модели</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;