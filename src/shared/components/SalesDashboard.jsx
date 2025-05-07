'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Clock, Check, AlertTriangle, ChevronDown, Truck, MapPin, 
  Archive, ChevronLeft, BarChart3, Users, Activity, ChevronRight, RefreshCcw, Zap, Calendar, Car, X } from 'lucide-react';
import { carModels, regions } from '@/src/shared/mocks/mock-data';
import { useTelegram } from '@/src/hooks/useTelegram';
import * as d3 from 'd3';
import ContentReadyLoader from '@/src/shared/layout/ContentReadyLoader';

const SalesDashboard = () => {
  const [activeDetailLevel, setActiveDetailLevel] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const { hapticFeedback } = useTelegram();
  
  // Данные для API
  const [inMovementData, setInMovementData] = useState([]);
  const [frozenData, setFrozenData] = useState([]);
  const [notShippedData, setNotShippedData] = useState([]);
  const [deliveredData, setDeliveredData] = useState([]);
  
  const [period, setPeriod] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Загрузка данных при инициализации
  useEffect(() => {
 const fetchAllData = async (modelId = null) => {
  setLoading(true);
  try {
    // Базовый URL API
    const baseUrl = 'https://uzavtosalon.uz/b/dashboard/infos';
    
    // Добавляем параметр модели к URL, если модель выбрана
    const modelParam = modelId ? `&model_id=${modelId}` : '';
    
    // Получаем данные об автомобилях в пути
    const inMovementResponse = await fetch(`${baseUrl}&auto_movment${modelParam}`);
    const inMovementData = await inMovementResponse.json();
    setInMovementData(inMovementData);
    
    // Получаем данные о замороженных контрактах
    const frozenResponse = await fetch(`${baseUrl}&auto_frozen${modelParam}`);
    const frozenData = await frozenResponse.json();
    setFrozenData(frozenData);
    
    // Получаем данные о не отгруженных автомобилях
    const notShippedResponse = await fetch(`${baseUrl}&auto_shipped${modelParam}`);
    const notShippedData = await notShippedResponse.json();
    setNotShippedData(notShippedData);
    
    // Получаем данные о доставленных автомобилях
    const deliveredResponse = await fetch(`${baseUrl}&auto_delivered${modelParam}`);
    const deliveredData = await deliveredResponse.json();
    setDeliveredData(deliveredData);
    
    console.log('Данные успешно загружены с фильтром по модели:', modelId);
  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
  } finally {
    setLoading(false);
  }
};
    
    fetchAllData();
  }, []);

  // Данные продаж за прошлый год для сравнения
  const lastYearSalesData = [60, 70, 58, 82, 65, 75, 80, 68, 79, 85, 60, 70];
  const salesData = [75, 82, 65, 90, 70, 85, 92, 78, 88, 94, 65, 75];

  // Создаем маппинг моделей для быстрого доступа
  const carModelMap = useMemo(() => {
    return carModels.reduce((acc, model) => {
      acc[model.id] = model;
      return acc;
    }, {});
  }, []);

  // Расчет данных о задолженностях по контрактам на основе API
  const contractDebtData = useMemo(() => {
    // Расчет количества не отгруженных автомобилей
const notShippedCount = Array.isArray(notShippedData) 
  ? notShippedData.reduce((regionTotal, region) => {
      if (!region.dealers || !Array.isArray(region.dealers)) return regionTotal;
      
      const regionCount = region.dealers.reduce((dealerTotal, dealer) => {
        if (!dealer.models || !Array.isArray(dealer.models)) return dealerTotal;
        
        const dealerCount = dealer.models.reduce((modelTotal, model) => {
          if (selectedModel && model.model !== selectedModel) return modelTotal;
          return modelTotal + parseInt(model.sold || 0);
        }, 0);
        
        return dealerTotal + dealerCount;
      }, 0);
      
      return regionTotal + regionCount;
    }, 0)
  : 0;
    
    // Расчет количества автомобилей в пути
    const inTransitCount = Array.isArray(inMovementData) ? inMovementData.reduce((total, region) => {
      let regionTotal = 0;
      if (region.dealers && Array.isArray(region.dealers)) {
        region.dealers.forEach(dealer => {
          if (dealer.models && Array.isArray(dealer.models)) {
            dealer.models.forEach(model => {
              if (!selectedModel || model.model === selectedModel) {
                regionTotal += parseInt(model.sold || 0);
              }
            });
          }
        });
      }
      return total + regionTotal;
    }, 0) : 0;
    
const deliveredCount = deliveredData && deliveredData.all_count 
    ? parseInt(deliveredData.all_count)
    : 0;
    
  return {
    notShipped: notShippedCount || 0,
    inTransit: inTransitCount || 0,
    delivered: deliveredCount || 0
  };
}, [notShippedData, inMovementData, deliveredData, selectedModel]);

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

const debtData = useMemo(() => {
  if (!Array.isArray(frozenData)) return [];
  
  // Если выбрана модель, фильтруем данные
  if (selectedModel) {
    return frozenData.filter(item => item.model_id === selectedModel);
  }
  
  return frozenData.map(item => ({
    modelId: item.model_id,
    modelName: item.model_name,
    modelImg: `https://uzavtosalon.uz/b/core/m$load_image?sha=${item.photo_sha}&width=400&height=400`,
    total_count: parseInt(item.total_count || 0),
    days: 5,
    status: 'Критический'
  }));
}, [frozenData, selectedModel]);

const totalFrozenCount = useMemo(() => {
  return debtData.reduce((sum, item) => sum + parseInt(item.total_count || 0), 0);
}, [debtData]);

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

const formatNotShippedData = () => {
  if (!Array.isArray(notShippedData)) return [];
  
  return notShippedData.map(item => {
    return {
      name: item.region_name || "Регион не указан",
      value: parseInt(item.total_count || 0),
      modelId: item.model_id,
      modelName: item.model_name,
      photo_sha: item.photo_sha
    };
  })
  .filter(region => region.value > 0)
  .sort((a, b) => b.value - a.value);
};

// Обновленная функция getRegionData
const getRegionData = (status, modelId) => {
  if (status === 'inTransit' && Array.isArray(inMovementData)) {
    return inMovementData.map(region => {
      let totalCount = 0;
      
      if (region.dealers && Array.isArray(region.dealers)) {
        region.dealers.forEach(dealer => {
          if (dealer.models && Array.isArray(dealer.models)) {
            dealer.models.forEach(model => {
              if (!modelId || model.model === modelId) {
                totalCount += parseInt(model.sold || 0);
              }
            });
          }
        });
      }
      
      return {
        name: region.name,
        value: totalCount
      };
    })
    .filter(region => region.value > 0)
    .sort((a, b) => b.value - a.value);
  } else if (status === 'notShipped') {
    // Форматируем данные о не отгруженных автомобилях
    const data = formatNotShippedData();
    
    // Если выбрана модель, фильтруем данные
    if (modelId) {
      return data.filter(item => item.modelId === modelId);
    }
    
    return data;
  } else {
    // Заглушка для других статусов
    const baseData = regions.slice(0, 5).map((region, index) => {
      let value = 15 - (index * 3);
      
      if (modelId) {
        const modelIndex = carModels.findIndex(m => m.id === modelId);
        const factor = 0.7 - (modelIndex * 0.15);
        value = Math.floor(value * factor);
      }
      
      return {
        name: region.name,
        value: value > 0 ? value : 1
      };
    });
    
    return baseData;
  }
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

const getDealerData = (status, regionName, selectedModelId) => {

  if (status === 'inTransit' && Array.isArray(inMovementData)) {
    const region = inMovementData.find(r => r.name === regionName);
    
    if (region && region.dealers) {
      return region.dealers
        .map(dealer => {
          // Фильтруем модели по выбранной, если нужно
          const filteredModels = dealer.models && Array.isArray(dealer.models)
            ? dealer.models.filter(model => !selectedModelId || model.model === selectedModelId)
            : [];
          
          // Вычисляем общее количество автомобилей
          const value = filteredModels.reduce((sum, model) => 
            sum + parseInt(model.sold || 0), 0
          );
          
          // Преобразуем в нужный формат
          const modelDetails = filteredModels.map(model => ({
            id: model.model,
            name: carModelMap[model.model]?.name || model.model,
            count: parseInt(model.sold || 0),
            img: carModelMap[model.model]?.img || ''
          }));
          
          return {
            name: dealer.name.replace(/^"(.*)".*$/, '$1'), // Убираем кавычки из имени
            value,
            models: modelDetails
          };
        })
        .filter(dealer => dealer.value > 0) // Отображаем только дилеров с ненулевыми значениями
        .sort((a, b) => b.value - a.value); // Сортируем по убыванию количества
    }
  }
  
  // Заглушка для других статусов
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
  setSelectedModel(modelId);
  // Дополнительно можно обновить все данные
  fetchAllData(modelId);
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

const renderSidebarContent = () => {
  if (activeDetailLevel === 0 || !selectedStatus) return null;

  const statusTitle = selectedStatus === 'notShipped' ? 'Не отгружено >48ч' : 'В пути >3 дней';
  const statusColor = selectedStatus === 'notShipped' ? 'blue' : 'yellow';
  const statusIcon = selectedStatus === 'notShipped' ? <Archive size={20} /> : <Truck size={20} />;
  
  // Получаем актуальный источник данных в зависимости от выбранного статуса
  const sourceData = selectedStatus === 'notShipped' ? notShippedData : 
                     selectedStatus === 'inTransit' ? inMovementData : null;

  // Уровень 1: Список регионов
  if (activeDetailLevel === 1) {
    // Получаем данные по регионам
    let regions = [];
    
    if (sourceData && Array.isArray(sourceData)) {
      // Обрабатываем данные API для обоих статусов одинаково
      regions = sourceData.map(region => {
        let value = 0;
        
        if (region.dealers && Array.isArray(region.dealers)) {
          region.dealers.forEach(dealer => {
            if (dealer.models && Array.isArray(dealer.models)) {
              dealer.models.forEach(model => {
                if (!selectedModel || model.model === selectedModel) {
                  value += parseInt(model.sold || 0);
                }
              });
            }
          });
        }
        
        return { name: region.name, value };
      })
      .filter(region => region.value > 0)
      .sort((a, b) => b.value - a.value);
    } else {
      // Для других статусов используем имеющиеся данные
      regions = regionData[selectedStatus] || [];
    }
    
    return (
      <div className="h-full flex flex-col"> {/* Увеличена ширина панели */}
        {/* Улучшенный заголовок */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-700 bg-gray-800/90">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-${statusColor}-900/40 text-${statusColor}-400`}>
            {statusIcon}
          </div>
          <div>
            <h3 className="text-lg font-medium text-white flex items-center">
              {statusTitle}
              {selectedModel && (
                <span className="ml-2 text-sm text-gray-400 flex items-center gap-1">
                  <span>•</span>
                  <span>{carModels.find(m => m.id === selectedModel)?.name}</span>
                </span>
              )}
            </h3>
            <div className="text-sm text-gray-400">
              Всего регионов: {regions.length}
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3">
          <div className="text-sm text-gray-400 mb-3 px-2 flex items-center gap-2">
            <MapPin size={14} />
            <span>Выберите регион для детализации:</span>
          </div>
          
          {regions.length === 0 ? (
            <div className="p-6 text-center text-gray-400 bg-gray-800/40 rounded-lg border border-gray-700/50">
              <AlertTriangle size={24} className="mx-auto mb-2 text-gray-500" />
              <p>Нет данных для отображения</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {regions.map((region, index) => (
                <div 
                  key={index} 
                  className={`p-3.5 rounded-lg border transition-all duration-200 ${
                    selectedRegion === region.name 
                      ? `bg-${statusColor}-900/30 border-${statusColor}-700` 
                      : 'bg-gray-800/60 border-gray-700 hover:bg-gray-700/70'
                  } cursor-pointer`}
                  onClick={() => handleRegionSelect(region.name)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <MapPin size={18} className={`text-${statusColor}-400`} />
                      <span className="text-white font-medium text-base">{region.name}</span>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full bg-${statusColor}-900/40 text-${statusColor}-300 flex items-center gap-1.5 border border-${statusColor}-800/30`}>
                      {statusIcon}
                      <span className="text-sm font-semibold">{region.value}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Уровень 2: Список дилеров для выбранного региона
  if (activeDetailLevel === 2 && selectedRegion) {
    let dealers = [];
    
    if (sourceData && Array.isArray(sourceData)) {
      // Находим выбранный регион
      const region = sourceData.find(r => r.name === selectedRegion);
      
      if (region && region.dealers && Array.isArray(region.dealers)) {
        // Фильтруем дилеров по моделям
        dealers = region.dealers.map(dealer => {
          let value = 0;
          const filteredModels = [];
          
          if (dealer.models && Array.isArray(dealer.models)) {
            dealer.models.forEach(model => {
              if (!selectedModel || model.model === selectedModel) {
                const count = parseInt(model.sold || 0);
                value += count;
                
                filteredModels.push({
                  id: model.model,
                  name: model.model,
                  count,
                  img: carModelMap[model.model]?.img || ''
                });
              }
            });
          }
          
          return {
            name: dealer.name.replace(/^"(.*)".*$/, '$1'), // Убираем кавычки
            value,
            models: filteredModels
          };
        })
        .filter(dealer => dealer.value > 0)
        .sort((a, b) => b.value - a.value);
      }
    } else {
      // Для других статусов используем имеющиеся данные
      dealers = dealerData[selectedStatus][selectedRegion] || [];
    }
    
    return (
      <div className="h-full flex flex-col"> {/* Увеличена ширина панели */}
        {/* Улучшенный заголовок с навигацией */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-700 bg-gray-800/90">
          <button 
            onClick={handleBack}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-700/80 transition-colors text-gray-400 hover:text-white"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h3 className="text-lg font-medium text-white flex items-center gap-1.5">
              <MapPin size={16} className={`text-${statusColor}-400`} />
              <span>{selectedRegion}</span>
            </h3>
            <div className="text-sm text-gray-400 flex items-center gap-1">
              <span className={`text-${statusColor}-400`}>{statusTitle}</span>
              {selectedModel && (
                <>
                  <span>•</span>
                  <span>{carModels.find(m => m.id === selectedModel)?.name}</span>
                </>
              )}
            </div>
          </div>
          <div className="ml-auto bg-gray-800/80 px-2.5 py-1 rounded-md border border-gray-700 text-sm">
            <span className="text-gray-400">Дилеров:</span>
            <span className="text-white font-semibold ml-1">{dealers.length}</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3">
          <div className="text-sm text-gray-400 mb-3 px-2 flex items-center gap-2">
            <Users size={14} />
            <span>Список дилеров в регионе:</span>
          </div>
          
          {dealers.length === 0 ? (
            <div className="p-6 text-center text-gray-400 bg-gray-800/40 rounded-lg border border-gray-700/50">
              <AlertTriangle size={24} className="mx-auto mb-2 text-gray-500" />
              <p>Нет данных для отображения</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {dealers.map((dealer, index) => (
                <div 
                  key={index} 
                  className={`p-3.5 rounded-lg border transition-all duration-200 ${
                    selectedDealer === dealer.name 
                      ? `bg-${statusColor}-900/30 border-${statusColor}-700` 
                      : 'bg-gray-800/60 border-gray-700 hover:bg-gray-700/70'
                  } cursor-pointer`}
                  onClick={() => handleDealerSelect(dealer.name)}
                >
                  <div className="flex justify-between items-center">
                    <div className="w-3/4 min-w-0"> {/* Ограничение ширины для предотвращения перекрытия */}
                      <div className="flex items-center gap-2 mb-1">
                        <Users size={16} className="text-gray-400 flex-shrink-0" />
                        <span className="text-white font-medium text-base truncate">{dealer.name}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {dealer.models.length} {dealer.models.length === 1 ? 'модель' : dealer.models.length < 5 ? 'модели' : 'моделей'}
                      </div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full bg-${statusColor}-900/40 text-${statusColor}-300 flex items-center gap-1.5 border border-${statusColor}-800/30 whitespace-nowrap`}>
                      {statusIcon}
                      <span className="text-sm font-semibold">{dealer.value}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Уровень 3: Детализация по моделям для выбранного дилера
  if (activeDetailLevel === 3 && selectedDealer && selectedRegion) {
    let dealer = null;
    
    if (sourceData && Array.isArray(sourceData)) {
      // Находим выбранный регион
      const region = sourceData.find(r => r.name === selectedRegion);
      
      if (region && region.dealers && Array.isArray(region.dealers)) {
        // Находим выбранного дилера
        const dealerData = region.dealers.find(d => 
          d.name.replace(/^"(.*)".*$/, '$1') === selectedDealer
        );
        
        if (dealerData && dealerData.models && Array.isArray(dealerData.models)) {
          const filteredModels = dealerData.models
            .filter(model => !selectedModel || model.model === selectedModel)
            .map(model => ({
              id: model.model,
              name: model.model,
              count: parseInt(model.sold || 0),
              img: model.photo_sha
            }));
          
          const totalValue = filteredModels.reduce((sum, model) => sum + model.count, 0);
          
          if (totalValue > 0) {
            dealer = {
              name: dealerData.name.replace(/^"(.*)".*$/, '$1'),
              value: totalValue,
              models: filteredModels
            };
          }
        }
      }
    } else {
      // Для других статусов используем имеющиеся данные
      const dealers = dealerData[selectedStatus][selectedRegion] || [];
      dealer = dealers.find(d => d.name === selectedDealer);
    }
    
    if (!dealer) return null;
    
    return (
      <div className="h-full flex flex-col"> {/* Увеличена ширина панели */}
        {/* Улучшенный заголовок с навигацией */}
        <div className="p-4 border-b border-gray-700 bg-gray-800/90">
          <div className="flex items-center gap-3 mb-2">
            <button 
              onClick={handleBack}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-700/80 transition-colors text-gray-400 hover:text-white"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium text-white truncate">{selectedDealer}</h3>
            </div>
          </div>
          <div className="flex items-center text-sm text-gray-400 pl-10">
            <div className="flex items-center gap-1">
              <MapPin size={14} className="text-gray-500" />
              <span>{selectedRegion}</span>
            </div>
            <span className="mx-1.5">•</span>
            <div className="flex items-center gap-1">
              <span className={`text-${statusColor}-400`}>{statusTitle}</span>
            </div>
            {selectedModel && (
              <>
                <span className="mx-1.5">•</span>
                <div className="flex items-center gap-1">
                  <Car size={14} className="text-gray-500" />
                  <span>{carModels.find(m => m.id === selectedModel)?.name}</span>
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3">
          {/* Карточка с общей информацией */}
          <div className="bg-gray-800/70 rounded-lg p-4 mb-4 border border-gray-700 shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">Всего автомобилей:</div>
                <div className="flex items-baseline gap-1.5">
                  <div className="text-2xl font-bold text-white">{dealer.value}</div>
                  <div className="text-xs text-gray-400">единиц</div>
                </div>
              </div>
              <div className="w-16 h-16 rounded-full bg-gray-750 border border-gray-700 flex items-center justify-center">
                {statusIcon}
              </div>
            </div>
            
            <div className="mb-3 flex items-center gap-2">
              <div className="text-sm text-gray-400">Распределение по моделям:</div>
              <div className="text-xs px-2 py-0.5 bg-gray-700 rounded-full text-gray-300 border border-gray-600">
                {dealer.models.length} {dealer.models.length === 1 ? 'модель' : dealer.models.length < 5 ? 'модели' : 'моделей'}
              </div>
            </div>
            
            {dealer.models.length === 0 ? (
              <div className="p-4 text-center text-gray-400 bg-gray-800/40 rounded-lg border border-gray-700/50">
                <AlertTriangle size={24} className="mx-auto mb-2 text-gray-500" />
                <p>Нет данных для отображения</p>
              </div>
            ) : (
              <div className="space-y-3">
               {dealer.models.map((model, idx) => (
  <div key={idx} className="bg-gray-700/50 rounded-lg p-3 border border-gray-600/50 hover:bg-gray-700/80 transition-colors">
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3 min-w-0 w-3/4">
        <div className="w-18 h-18 rounded-md overflow-hidden bg-gray-600/30 flex-shrink-0 flex items-center justify-center">
          <img 
            src={`https://uzavtosalon.uz/b/core/m$load_image?sha=${model.img}&width=400&height=400`}
            alt={model.name} 
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-white font-medium truncate">{carModelMap[model.id]?.name || model.name}</span>
          <span className="text-xs text-gray-400">{carModelMap[model.id]?.category || 'Авто'}</span>
        </div>
      </div>
      <div className={`px-2.5 py-1 rounded-md bg-${statusColor}-900/40 text-${statusColor}-300 flex items-center gap-1.5 border border-${statusColor}-800/30 whitespace-nowrap`}>
        <Car size={14} className="text-gray-400" />
        <span className="text-sm font-semibold">{model.count}</span>
      </div>
    </div>
  </div>
))}
              </div>
            )}
          </div>
          
          {/* Карточка с рекомендациями */}
          <div className="bg-gray-800/70 rounded-lg p-4 border border-gray-700 shadow-md">
            <h4 className="font-medium text-white mb-3 flex items-center gap-2">
              <Zap size={16} className="text-yellow-400" />
              Рекомендуемые действия
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 p-2.5 rounded-lg bg-gray-800/50 border border-gray-700 hover:bg-gray-700/50 transition-colors">
                <Clock size={18} className="text-blue-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-200 font-medium">Запросить обновление статуса</div>
                  <div className="text-xs text-gray-400 mt-0.5">Получите актуальную информацию о состоянии поставки</div>
                </div>
              </li>
              <li className="flex items-start gap-3 p-2.5 rounded-lg bg-gray-800/50 border border-gray-700 hover:bg-gray-700/50 transition-colors">
                <AlertTriangle size={18} className="text-yellow-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-200 font-medium">Проверить договоры на отложенные поставки</div>
                  <div className="text-xs text-gray-400 mt-0.5">Проанализируйте условия договоров с повышенным риском</div>
                </div>
              </li>
              <li className="flex items-start gap-3 p-2.5 rounded-lg bg-gray-800/50 border border-gray-700 hover:bg-gray-700/50 transition-colors">
                <Zap size={18} className="text-green-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-200 font-medium">Связаться с менеджером дилерского центра</div>
                  <div className="text-xs text-gray-400 mt-0.5">Установите прямой контакт для ускорения процессов</div>
                </div>
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
      {/* Индикатор загрузки */}
      {loading && <ContentReadyLoader isLoading={loading} timeout={3000} />}

      {/* Плавающая боковая панель */}
    <div 
  className={`fixed top-0 right-0 h-full bg-gray-850 backdrop-blur-sm border-l border-gray-700 shadow-xl transform transition-transform duration-300 z-50 
  ${showSidebar ? 'translate-x-0' : 'translate-x-full'}`}
  style={{ 
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    width: '400px' // Задаем точную ширину
  }}
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
        
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-5 mb-5">
          {/* <div className="bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-700/50 shadow-lg overflow-hidden">
            <SalesChart 
              salesData={salesData}
              lastYearSalesData={lastYearSalesData}
              months={months}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              period={period}
              setPeriod={setPeriod}
            />
          </div> */}
          
   {/* ТАБЛИЦА ЗАДОЛЖЕННОСТИ ПО КОНТРАКТАМ */}
<div className="bg-gray-800/70 backdrop-blur-sm rounded-lg border border-gray-700/50 shadow-md overflow-hidden">
  <div className="flex justify-between items-center p-3 border-b border-gray-700">
    <h3 className="text-base font-medium text-white flex items-center gap-2">
      <AlertTriangle size={18} className="text-yellow-400" />
      Замороженые контракты 
      {selectedModel && (
        <span className="ml-2 text-sm text-gray-400">
          • {carModels.find(m => m.id === selectedModel)?.name}
        </span>
      )}
    </h3>
    <div className="text-sm text-yellow-300">
      Общее количество: <span className="font-bold">{totalFrozenCount}</span>
    </div>
  </div>
  
  <div className="p-3">
    <div className="rounded-lg overflow-hidden border border-gray-700">
      <table className="w-full text-sm">
        <thead className="bg-gray-900/80">
          <tr>
            <th className="px-3 py-2 text-left text-gray-400 font-medium">Название модели</th>
            <th className="px-3 py-2 text-center text-gray-400 font-medium">Изображение</th>
            <th className="px-3 py-2 text-right text-gray-400 font-medium">Количество</th>
            <th className="px-3 py-2 text-center text-gray-400 font-medium">Статус</th>
          </tr>
        </thead>
      <tbody className="divide-y divide-gray-700">
  {debtData.map((item, index) => (
    <tr key={index} className={`${index % 2 === 0 ? 'bg-gray-800/60' : 'bg-gray-850/70'} hover:bg-gray-700/70`}>
      <td className="px-3 py-2 font-medium text-white">{item.modelName}</td>
      <td className="px-3 py-2 text-center">
        <div className="w-12 h-12 mx-auto rounded-md overflow-hidden bg-gray-700/70 flex items-center justify-center">
          <img 
            src={item.modelImg} 
            alt={item.modelName} 
            className="h-full w-auto object-contain"
          />
        </div>
      </td>
      <td className="px-3 py-2 text-right text-gray-300 font-medium">{item.total_count}</td>
      <td className="px-3 py-2 text-center">
        <span className="inline-block px-2 py-1 rounded-full text-xs bg-red-900/30 text-red-400 border border-red-800/50">
          &gt; 5 дней
        </span>
      </td>
    </tr>
  ))}
</tbody>
        <tfoot className="bg-gray-900/80">
          <tr>
            <td className="px-3 py-2 font-medium text-white" colSpan="2">Итого</td>
            <td className="px-3 py-2 text-right font-medium text-white">
              {totalFrozenCount}
            </td>
            <td className="px-3 py-2 text-center text-red-400 text-xs font-medium">
              Все &gt; 5 дней
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</div>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;