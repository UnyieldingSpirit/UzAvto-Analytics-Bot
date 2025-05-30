'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Clock, Check, AlertTriangle, ChevronDown, Truck, MapPin, 
  Archive, ChevronLeft, BarChart3, Users, Activity, ChevronRight, Zap, Calendar, Car, X } from 'lucide-react';
import { carModels, regions } from '../../shared/mocks/mock-data';
import { useTelegram } from '../../hooks/useTelegram';
import ContentReadyLoader from '../../shared/layout/ContentReadyLoader';
import DashboardAnalytics from './DashboardAnalytics';
import { useTranslation } from '../../hooks/useTranslation';
import { dashboardTranslations } from '../../shared/components/locales/SalesDashboard';

const SalesDashboard = () => {
  // Инициализация переводов
  const { t, currentLocale } = useTranslation(dashboardTranslations);
  
  const [activeDetailLevel, setActiveDetailLevel] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const { hapticFeedback } = useTelegram;
  
  const dataLoaded = useRef(false);
  
  // Данные для API
  const [inMovementData, setInMovementData] = useState([]);
  const [frozenData, setFrozenData] = useState([]);
  const [notShippedData, setNotShippedData] = useState([]);
  const [deliveredData, setDeliveredData] = useState([]);

  useEffect(() => {
    if (dataLoaded.current) {
      return;
    }

    const fetchAllData = async () => {
      setLoading(true);
      try {
        const baseUrl = 'https://uzavtosalon.uz/b/dashboard/infos';
        
        const [inMovementResponse, frozenResponse, notShippedResponse, deliveredResponse] = 
          await Promise.all([
            fetch(`${baseUrl}&auto_movment`),
            fetch(`${baseUrl}&auto_frozen`),
            fetch(`${baseUrl}&auto_shipped`),
            fetch(`${baseUrl}&auto_delivered`)
          ]);
        
        const inMovementData = await inMovementResponse.json();
        const frozenData = await frozenResponse.json();
        const notShippedData = await notShippedResponse.json();
        const deliveredData = await deliveredResponse.json();
        
        setInMovementData(inMovementData);
        setFrozenData(frozenData);
        setNotShippedData(notShippedData);
        setDeliveredData(deliveredData);
        
        console.log(t('logs.dataLoaded'));
        
        // Отмечаем, что данные загружены
        dataLoaded.current = true;
      } catch (error) {
        console.error(t('logs.dataLoadError'), error);
      } finally {
        setLoading(false);
      }
    };
    
    // Запускаем загрузку данных
    fetchAllData();
  }, [t]);

  // Расчет данных о задолженностях по контрактам на основе API
  const contractDebtData = useMemo(() => {
    // Расчет количества не отгруженных автомобилей
    let notShippedCount = 0;
    
    if (Array.isArray(notShippedData)) {
      notShippedCount = notShippedData.reduce((regionTotal, region) => {
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
      }, 0);
    } else if (notShippedData && notShippedData.all_count) {
      // Если данные приходят в формате {all_count: "XXX"}
      notShippedCount = parseInt(notShippedData.all_count);
    }
        
    // Расчет количества автомобилей в пути
    let inTransitCount = 0;
    
    if (Array.isArray(inMovementData)) {
      inTransitCount = inMovementData.reduce((total, region) => {
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
      }, 0);
    } else if (inMovementData && inMovementData.all_count) {
      // Если данные приходят в формате {all_count: "XXX"}
      inTransitCount = parseInt(inMovementData.all_count);
    }
    
    // Проверка формата deliveredData
    let deliveredCount = 0;
    if (deliveredData && deliveredData.all_count) {
      deliveredCount = parseInt(deliveredData.all_count);
    } else if (Array.isArray(deliveredData)) {
      // Если данные в формате массива, суммируем все значения
      deliveredCount = deliveredData.reduce((total, item) => {
        return total + parseInt(item.total_count || 0);
      }, 0);
    }
    
    return {
      notShipped: notShippedCount || 0,
      inTransit: inTransitCount || 0,
      delivered: deliveredCount || 0
    };
  }, [notShippedData, inMovementData, deliveredData, selectedModel]);

  // Функция для правильного склонения слова "день"
  const getDayWord = (days) => {
    if (currentLocale === 'ru') {
      if (days % 10 === 1 && days % 100 !== 11) {
        return t('table.day');
      } else if ([2, 3, 4].includes(days % 10) && ![12, 13, 14].includes(days % 100)) {
        return t('table.days2to4');
      } else {
        return t('table.days');
      }
    }
    // Для других языков просто возвращаем перевод "дней"
    return t('table.days');
  };
  
  // Обработка данных замороженных контрактов с учетом разных форматов
  const debtData = useMemo(() => {
    // Если данные не пришли или пришел пустой массив
    if (!frozenData || (Array.isArray(frozenData) && frozenData.length === 0)) {
      return [];
    }
    
    // Если frozenData - это массив объектов
    if (Array.isArray(frozenData)) {
      // Если выбрана модель, фильтруем данные
      const filteredData = selectedModel 
        ? frozenData.filter(item => item.model_id === selectedModel)
        : frozenData;
      
      return filteredData.map(item => ({
        modelId: item.model_id,
        modelName: item.model_name || t('unknown.model'),
        modelImg: item.photo_sha ? `https://uzavtosalon.uz/b/core/m$load_image?sha=${item.photo_sha}&width=400&height=400` : '',
        total_count: parseInt(item.total_count || 0),
        days: parseInt(item.days || 5),
        status: parseInt(item.days || 5) > 5 ? t('status.critical') : t('status.medium')
      }));
    }
    
    // Если frozenData - это объект с вложенными массивами (для совместимости)
    if (frozenData && frozenData.models && Array.isArray(frozenData.models)) {
      return frozenData.models
        .filter(model => !selectedModel || model.model_id === selectedModel)
        .map(model => ({
          modelId: model.model_id,
          modelName: model.model_name || t('unknown.model'),
          modelImg: model.photo_sha ? `https://uzavtosalon.uz/b/core/m$load_image?sha=${model.photo_sha}&width=400&height=400` : '',
          total_count: parseInt(model.total_count || 0),
          days: parseInt(model.days || 5),
          status: parseInt(model.days || 5) > 5 ? t('status.critical') : t('status.medium')
        }));
    }
    
    // Если frozenData имеет неожиданный формат, возвращаем пустой массив
    return [];
  }, [frozenData, selectedModel, t]);

  const totalFrozenCount = useMemo(() => {
    return debtData.reduce((sum, item) => sum + parseInt(item.total_count || 0), 0);
  }, [debtData]);

  // Форматирование данных о не отгруженных автомобилях с учетом разных форматов
  const formatNotShippedData = () => {
    // Если данные не пришли или пришел пустой массив
    if (!notShippedData) return [];
    
    // Если notShippedData - это массив объектов с данными по регионам
    if (Array.isArray(notShippedData)) {
      return notShippedData
        .filter(item => item && item.region_name) // Фильтруем пустые или некорректные данные
        .map(item => {
          return {
            name: item.region_name || t('unknown.region'),
            value: parseInt(item.total_count || 0),
            modelId: item.model_id,
            modelName: item.model_name,
            photo_sha: item.photo_sha
          };
        })
        .filter(region => region.value > 0)
        .sort((a, b) => b.value - a.value);
    }
    
    // Если notShippedData - это объект с вложенными массивами регионов
    if (notShippedData && notShippedData.regions && Array.isArray(notShippedData.regions)) {
      return notShippedData.regions
        .map(region => ({
          name: region.region_name || t('unknown.region'),
          value: parseInt(region.total_count || 0),
          modelId: selectedModel, // Используем выбранную модель, если она есть
          modelName: carModels.find(m => m.id === selectedModel)?.name || t('unknown.model')
        }))
        .filter(region => region.value > 0)
        .sort((a, b) => b.value - a.value);
    }
    
    // Если формат данных не соответствует ожидаемому, возвращаем пустой массив
    return [];
  };

  // Обновленная функция getRegionData с учетом разных форматов данных
  const getRegionData = (status, modelId) => {
    if (status === 'inTransit') {
      // Для данных в пути
      if (Array.isArray(inMovementData)) {
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
            name: region.name || region.region_name || t('unknown.region'),
            value: totalCount
          };
        })
        .filter(region => region.value > 0)
        .sort((a, b) => b.value - a.value);
      } else if (inMovementData && inMovementData.regions && Array.isArray(inMovementData.regions)) {
        // Альтернативный формат данных
        return inMovementData.regions
          .map(region => ({
            name: region.region_name || t('unknown.region'),
            value: parseInt(region.total_count || 0)
          }))
          .filter(region => region.value > 0)
          .sort((a, b) => b.value - a.value);
      }
    } else if (status === 'notShipped') {
      // Для не отгруженных автомобилей
      const data = formatNotShippedData();
      
      // Если выбрана модель, фильтруем данные
      if (modelId) {
        return data.filter(item => !item.modelId || item.modelId === modelId);
      }
      
      return data;
    }
    
    // Заглушка для других статусов и случаев, когда данные не получены
    return regions.slice(0, 5).map((region, index) => {
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

  // Обновленная функция getDealerData с учетом разных форматов данных
  const getDealerData = (status, regionName, selectedModelId) => {
    if (status === 'inTransit' && Array.isArray(inMovementData)) {
      const region = inMovementData.find(r => r.name === regionName || r.region_name === regionName);
      
      if (region && region.dealers && Array.isArray(region.dealers)) {
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
              img: model.photo_sha ? `https://uzavtosalon.uz/b/core/m$load_image?sha=${model.photo_sha}&width=400&height=400` : carModelMap[model.model]?.img || ''
            }));
            
            return {
              name: dealer.name ? dealer.name.replace(/^"(.*)".*$/, '$1') : t('unknown.dealer'), 
              value,
              models: modelDetails
            };
          })
          .filter(dealer => dealer.value > 0) // Отображаем только дилеров с ненулевыми значениями
          .sort((a, b) => b.value - a.value); // Сортируем по убыванию количества
      }
    } else if (status === 'notShipped' && Array.isArray(notShippedData)) {
      // Для не отгруженных автомобилей
      const region = notShippedData.find(r => r.name === regionName || r.region_name === regionName);
      
      if (region && region.dealers && Array.isArray(region.dealers)) {
        return region.dealers
          .map(dealer => {
            // Обработка аналогична inTransit
            const filteredModels = dealer.models && Array.isArray(dealer.models)
              ? dealer.models.filter(model => !selectedModelId || model.model === selectedModelId)
              : [];
            
            const value = filteredModels.reduce((sum, model) => 
              sum + parseInt(model.sold || 0), 0
            );
            
            const modelDetails = filteredModels.map(model => ({
              id: model.model,
              name: carModelMap[model.model]?.name || model.model,
              count: parseInt(model.sold || 0),
              img: model.photo_sha ? `https://uzavtosalon.uz/b/core/m$load_image?sha=${model.photo_sha}&width=400&height=400` : carModelMap[model.model]?.img || ''
            }));
            
            return {
              name: dealer.name ? dealer.name.replace(/^"(.*)".*$/, '$1') : t('unknown.dealer'),
              value,
              models: modelDetails
            };
          })
          .filter(dealer => dealer.value > 0)
          .sort((a, b) => b.value - a.value);
      }
    }
    
    // Заглушка для других статусов и случаев, когда данные не получены
    const baseDealers = {
      'Ташкент': [
        { name: t('dealers.central'), value: 10, models: generateModelData(3, selectedModelId) },
        { name: t('dealers.premium'), value: 8, models: generateModelData(3, selectedModelId) },
        { name: t('dealers.maximum'), value: 6, models: generateModelData(3, selectedModelId) },
      ],
      'Самарканд': [
        { name: t('dealers.samarkand'), value: 9, models: generateModelData(3, selectedModelId) },
        { name: t('dealers.autoSamarkand'), value: 6, models: generateModelData(3, selectedModelId) },
        { name: t('dealers.samarkandMotors'), value: 3, models: generateModelData(3, selectedModelId) },
      ],
      'Бухара': [
        { name: t('dealers.bukhara'), value: 7, models: generateModelData(3, selectedModelId) },
        { name: t('dealers.bukharaGM'), value: 5, models: generateModelData(3, selectedModelId) },
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

  // Создаем маппинг моделей для быстрого доступа
  const carModelMap = useMemo(() => {
    return carModels.reduce((acc, model) => {
      acc[model.id] = model;
      return acc;
    }, {});
  }, []);

  // Обновленная функция handleModelSelect для правильной загрузки данных по моделям
  const handleModelSelect = (modelId) => {
    // Если модель уже выбрана, снимаем выбор
    if (selectedModel === modelId) {
      setSelectedModel(null);
    } else {
      setSelectedModel(modelId);
    }
    
    // Сбрасываем флаг, чтобы можно было загрузить данные для выбранной модели
    dataLoaded.current = false;
    
    // Загружаем данные для выбранной модели или для всех моделей, если выбор снят
    const fetchAllData = async () => {
      setLoading(true);
      try {
        // Базовый URL API
        const baseUrl = 'https://uzavtosalon.uz/b/dashboard/infos';
        
        // Добавляем параметр модели к URL, если модель выбрана
        const modelParam = modelId === null ? '' : `&model_id=${modelId}`;
        
        // Загружаем все нужные данные параллельно
        const [inMovementResponse, frozenResponse, notShippedResponse, deliveredResponse] = 
          await Promise.all([
            fetch(`${baseUrl}&auto_movment${modelParam}`),
            fetch(`${baseUrl}&auto_frozen${modelParam}`),
            fetch(`${baseUrl}&auto_shipped${modelParam}`),
            fetch(`${baseUrl}&auto_delivered${modelParam}`)
          ]);
        
        // Обрабатываем ответы
        const inMovementData = await inMovementResponse.json();
        const frozenData = await frozenResponse.json();
        const notShippedData = await notShippedResponse.json();
        const deliveredData = await deliveredResponse.json();
        
        // Сохраняем данные в состояние
        setInMovementData(inMovementData);
        setFrozenData(frozenData);
        setNotShippedData(notShippedData);
        setDeliveredData(deliveredData);
        
        console.log(t('logs.modelDataLoaded'), modelId);
      } catch (error) {
        console.error(t('logs.modelDataLoadError'), error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllData();
  };

  const handleStatusSelect = (status) => {
    if (hapticFeedback) hapticFeedback('selection');
    setSelectedStatus(status);
    setActiveDetailLevel(1);
    setSelectedRegion(null);
    setSelectedDealer(null);
    setShowSidebar(true);
  };

  const handleRegionSelect = (region) => {
    if (hapticFeedback) hapticFeedback('selection');
    setSelectedRegion(region);
    setActiveDetailLevel(2);
    setSelectedDealer(null);
  };

  const handleDealerSelect = (dealer) => {
    if (hapticFeedback) hapticFeedback('selection');
    setSelectedDealer(dealer);
    setActiveDetailLevel(3);
  };

  const handleBack = () => {
    if (hapticFeedback) hapticFeedback('impact');
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

  // Эффект для обновления заголовка при смене модели
  useEffect(() => {
    const titleElement = document.getElementById('dashboard-title');
    if (titleElement && selectedModel) {
      const model = carModels.find(m => m.id === selectedModel);
      if (model) {
        titleElement.innerHTML = t('titleWithModel', { modelName: model.name });
      }
    } else if (titleElement) {
      titleElement.innerHTML = t('title');
    }
  }, [selectedModel, t]);

  // Форматирование денежных значений
  const formatCurrency = (value) => {
    return new Intl.NumberFormat(
      currentLocale === 'ru' ? 'ru-RU' : 
      currentLocale === 'en' ? 'en-US' : 
      'uz-UZ'
    ).format(value) + (currentLocale === 'en' ? ' sum' : ' сум');
  };

  // Функция для правильного склонения слова "модель"
  const getModelWord = (count) => {
    if (currentLocale === 'ru') {
      if (count === 1) {
        return t('sidebar.model');
      } else if ([2, 3, 4].includes(count)) {
        return t('sidebar.models2to4');
      } else {
        return t('sidebar.models');
      }
    }
    // Для других языков
    return count === 1 ? t('sidebar.model') : t('sidebar.models');
  };

  // Содержимое боковой панели
  const renderSidebarContent = () => {
    if (activeDetailLevel === 0 || !selectedStatus) return null;

    const statusTitle = selectedStatus === 'notShipped' ? t('notShipped.shortTitle') : t('inTransit.shortTitle');
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
          
          return { 
            name: region.name || region.region_name || t('unknown.region'), 
            value 
          };
        })
        .filter(region => region.value > 0)
        .sort((a, b) => b.value - a.value);
      } else if (sourceData && sourceData.regions && Array.isArray(sourceData.regions)) {
        // Альтернативный формат данных
        regions = sourceData.regions
          .map(region => ({
            name: region.region_name || t('unknown.region'),
            value: parseInt(region.total_count || 0)
          }))
          .filter(region => region.value > 0)
          .sort((a, b) => b.value - a.value);
      } else {
        // Для других статусов используем имеющиеся данные
        regions = regionData[selectedStatus] || [];
      }
      
      return (
        <div className="h-full flex flex-col">
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
                {t('sidebar.totalRegions')}: {regions.length}
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3">
            <div className="text-sm text-gray-400 mb-3 px-2 flex items-center gap-2">
              <MapPin size={14} />
              <span>{t('sidebar.selectRegion')}:</span>
            </div>
            
            {regions.length === 0 ? (
              <div className="p-6 text-center text-gray-400 bg-gray-800/40 rounded-lg border border-gray-700/50">
                <AlertTriangle size={24} className="mx-auto mb-2 text-gray-500" />
                <p>{t('table.noData')}</p>
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
        const region = sourceData.find(r => r.name === selectedRegion || r.region_name === selectedRegion);
        
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
                    name: carModelMap[model.model]?.name || model.model,
                    count,
                    img: model.photo_sha ? `https://uzavtosalon.uz/b/core/m$load_image?sha=${model.photo_sha}&width=400&height=400` : carModelMap[model.model]?.img || ''
                  });
                }
              });
            }
            
            return {
              name: dealer.name ? dealer.name.replace(/^"(.*)".*$/, '$1') : t('unknown.dealer'), 
              value,
              models: filteredModels
            };
          })
          .filter(dealer => dealer.value > 0)
          .sort((a, b) => b.value - a.value);
        }
      } else if (sourceData && sourceData.dealers && Array.isArray(sourceData.dealers)) {
        // Альтернативный формат данных
        dealers = sourceData.dealers
          .filter(dealer => dealer.region_name === selectedRegion)
          .map(dealer => {
            const modelList = [];
            
            if (selectedModel) {
              // Если выбрана модель, добавляем только ее
              const model = carModels.find(m => m.id === selectedModel);
              if (model) {
                modelList.push({
                  id: model.id,
                  name: model.name,
                  count: parseInt(dealer.total_count || 0),
                  img: model.img
                });
              }
            } else if (dealer.models && Array.isArray(dealer.models)) {
              // Иначе добавляем все модели дилера
              dealer.models.forEach(model => {
                modelList.push({
                  id: model.model_id,
                  name: model.model_name || t('unknown.model'),
                  count: parseInt(model.count || 0),
                  img: model.photo_sha ? `https://uzavtosalon.uz/b/core/m$load_image?sha=${model.photo_sha}&width=400&height=400` : ''
                });
              });
            }
            
            return {
              name: dealer.dealer_name || t('unknown.dealer'),
              value: parseInt(dealer.total_count || 0),
              models: modelList
            };
          })
          .filter(dealer => dealer.value > 0)
          .sort((a, b) => b.value - a.value);
      } else {
        // Для других статусов используем имеющиеся данные
        dealers = dealerData[selectedStatus][selectedRegion] || [];
      }
      
      return (
        <div className="h-full flex flex-col">
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
              <span className="text-gray-400">{t('sidebar.dealers')}:</span>
              <span className="text-white font-semibold ml-1">{dealers.length}</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3">
            <div className="text-sm text-gray-400 mb-3 px-2 flex items-center gap-2">
              <Users size={14} />
              <span>{t('sidebar.dealersList')}:</span>
            </div>
            
            {dealers.length === 0 ? (
              <div className="p-6 text-center text-gray-400 bg-gray-800/40 rounded-lg border border-gray-700/50">
                <AlertTriangle size={24} className="mx-auto mb-2 text-gray-500" />
                <p>{t('table.noData')}</p>
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
                          {dealer.models.length} {getModelWord(dealer.models.length)}
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
        const region = sourceData.find(r => r.name === selectedRegion || r.region_name === selectedRegion);
        
        if (region && region.dealers && Array.isArray(region.dealers)) {
          // Находим выбранного дилера
          const dealerData = region.dealers.find(d => 
            d.name && d.name.replace(/^"(.*)".*$/, '$1') === selectedDealer
          );
          
          if (dealerData && dealerData.models && Array.isArray(dealerData.models)) {
            const filteredModels = dealerData.models
              .filter(model => !selectedModel || model.model === selectedModel)
              .map(model => ({
                id: model.model,
                name: carModelMap[model.model]?.name || model.model,
                count: parseInt(model.sold || 0),
                img: model.photo_sha ? `https://uzavtosalon.uz/b/core/m$load_image?sha=${model.photo_sha}&width=400&height=400` : carModelMap[model.model]?.img || ''
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
      } else if (sourceData && sourceData.dealers && Array.isArray(sourceData.dealers)) {
        // Альтернативный формат данных
        const dealerData = sourceData.dealers.find(d => 
          d.dealer_name === selectedDealer && d.region_name === selectedRegion
        );
        
        if (dealerData) {
          const modelList = [];
            
          if (selectedModel) {
            // Если выбрана модель, добавляем только ее
            const model = carModels.find(m => m.id === selectedModel);
            if (model) {
              modelList.push({
                id: model.id,
                name: model.name,
                count: parseInt(dealerData.total_count || 0),
                img: model.img
              });
            }
          } else if (dealerData.models && Array.isArray(dealerData.models)) {
            // Иначе добавляем все модели дилера
            dealerData.models.forEach(model => {
              modelList.push({
                id: model.model_id,
                name: model.model_name || t('unknown.model'),
                count: parseInt(model.count || 0),
                img: model.photo_sha ? `https://uzavtosalon.uz/b/core/m$load_image?sha=${model.photo_sha}&width=400&height=400` : ''
              });
            });
          }
          
          dealer = {
            name: dealerData.dealer_name,
            value: parseInt(dealerData.total_count || 0),
            models: modelList
          };
        }
      } else {
        // Для других статусов используем имеющиеся данные
        const dealers = dealerData[selectedStatus][selectedRegion] || [];
        dealer = dealers.find(d => d.name === selectedDealer);
      }
      
      if (!dealer) return null;
      
      return (
        <div className="h-full flex flex-col">
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
                  <div className="text-sm text-gray-400 mb-1">{t('dealer.totalCars')}:</div>
                  <div className="flex items-baseline gap-1.5">
                    <div className="text-2xl font-bold text-white">{dealer.value}</div>
                    <div className="text-xs text-gray-400">{t('dealer.units')}</div>
                  </div>
                </div>
                <div className="w-16 h-16 rounded-full bg-gray-750 border border-gray-700 flex items-center justify-center">
                  {statusIcon}
                </div>
              </div>
              
              <div className="mb-3 flex items-center gap-2">
                <div className="text-sm text-gray-400">{t('dealer.modelDistribution')}:</div>
                <div className="text-xs px-2 py-0.5 bg-gray-700 rounded-full text-gray-300 border border-gray-600">
                  {dealer.models.length} {getModelWord(dealer.models.length)}
                </div>
              </div>
              
              {dealer.models.length === 0 ? (
                <div className="p-4 text-center text-gray-400 bg-gray-800/40 rounded-lg border border-gray-700/50">
                  <AlertTriangle size={24} className="mx-auto mb-2 text-gray-500" />
                  <p>{t('table.noData')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                 {dealer.models.map((model, idx) => (
                  <div key={idx} className="bg-gray-700/50 rounded-lg p-3 border border-gray-600/50 hover:bg-gray-700/80 transition-colors">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3 min-w-0 w-3/4">
                        <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-600/30 flex-shrink-0 flex items-center justify-center">
                          <img 
                            src={model.img}
                            alt={model.name} 
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = carModelMap[model.id]?.img || '';
                            }}
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-white font-medium truncate">{model.name}</span>
                          <span className="text-xs text-gray-400">{carModelMap[model.id]?.category || t('car')}</span>
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
                  ? t('titleWithModel', { modelName: carModels.find(m => m.id === selectedModel)?.name }) 
                  : t('title')}
              </h1>
              <div className="text-sm text-gray-400 flex items-center gap-1">
                <span>{t('dealerCenter')}</span>
                <span>•</span>
                <span>Ташкент</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-gray-700/70 rounded-lg text-sm text-white flex items-center gap-1.5">
              <Calendar size={14} />
              <span>{new Date().toLocaleDateString(
                currentLocale === 'ru' ? 'ru-RU' : 
                currentLocale === 'en' ? 'en-US' : 
                'uz-UZ', 
                { day: 'numeric', month: 'long', year: 'numeric' }
              )}</span>
            </div>
          </div>
        </div>
        
        {/* Информационная панель - переименовано в "Задолженность по общим контрактам" */}
        <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg mb-5 border border-gray-700/50 shadow-md overflow-hidden">
          <div className="flex justify-between items-center p-3 border-b border-gray-700">
            <h2 className="text-base font-medium text-white flex items-center gap-2">
              <Activity size={18} className="text-blue-400" />
              {t('carsStatus')}
              {selectedModel && (
                <span className="ml-2 text-sm text-gray-400">
                  • {carModels.find(m => m.id === selectedModel)?.name}
                </span>
              )}
            </h2>
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
                    <span>{t('notShipped.title')}</span>
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
                    <span>{t('inTransit.title')}</span>
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
                  <div className="text-sm text-green-300">{t('delivered')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-5 mb-5">
          {/* Компонент аналитики */}
          {/* {renderAnalyticsDashboard()} */}
          
          {/* ТАБЛИЦА ЗАДОЛЖЕННОСТИ ПО КОНТРАКТАМ */}
          <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg border border-gray-700/50 shadow-md overflow-hidden">
            <div className="flex justify-between items-center p-3 border-b border-gray-700">
              <h3 className="text-base font-medium text-white flex items-center gap-2">
                <AlertTriangle size={18} className="text-yellow-400" />
                {t('frozenContracts')} 
                {selectedModel && (
                  <span className="ml-2 text-sm text-gray-400">
                    • {carModels.find(m => m.id === selectedModel)?.name}
                  </span>
                )}
              </h3>
              <div className="text-[16px] text-yellow-300">
                {t('total')}: <span className="font-bold">{totalFrozenCount}</span>
              </div>
            </div>
            
            <div className="p-3">
              <div className="rounded-lg overflow-hidden border border-gray-700">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900/80">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-400 font-medium">{t('table.modelName')}</th>
                      <th className="px-3 py-2 text-center text-gray-400 font-medium">{t('table.image')}</th>
                      <th className="px-3 py-2 text-right text-gray-400 font-medium">{t('table.quantity')}</th>
                      <th className="px-3 py-2 text-center text-gray-400 font-medium">{t('table.status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {debtData.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-3 py-4 text-center text-gray-400">
                          <AlertTriangle size={20} className="mx-auto mb-2 text-yellow-500" />
                          {t('table.noData')}
                        </td>
                      </tr>
                    ) : (
                      debtData.map((item, index) => (
                        <tr key={index} className={`${index % 2 === 0 ? 'bg-gray-800/60' : 'bg-gray-850/70'} hover:bg-gray-700/70`}>
                          <td className="px-3 py-2 font-medium text-white">{item.modelName}</td>
                          <td className="px-3 py-2 text-center">
                        <div className="w-12 h-12 mx-auto rounded-md overflow-hidden bg-gray-700/70 flex items-center justify-center">
                              <img 
                                src={item.modelImg} 
                                alt={item.modelName} 
                                className="h-full w-auto object-contain"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = carModelMap[item.modelId]?.img || '';
                                }}
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right text-gray-300 font-medium">{item.total_count}</td>
                          <td className="px-3 py-2 text-center">
                            <span className="inline-block px-2 py-1 rounded-full text-xs bg-red-900/30 text-red-400 border border-red-800/50">
                              &gt; {item.days || 5} {getDayWord(item.days || 5)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-gray-900/80">
                    <tr>
                      <td className="px-3 py-2 font-medium text-white" colSpan="2">{t('table.total')}</td>
                      <td className="px-3 py-2 text-right font-medium text-white">
                        {totalFrozenCount}
                      </td>
                      <td className="px-3 py-2 text-center text-red-400 text-xs font-medium">
                        {t('table.allDays')}
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