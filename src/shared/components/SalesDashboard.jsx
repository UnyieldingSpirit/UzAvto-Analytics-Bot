'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Clock, Check, AlertTriangle, ChevronDown, Truck, MapPin, 
  Archive, ChevronLeft, BarChart3, Users, Activity, ChevronRight, RefreshCcw, Zap, Calendar, Car, X,
  BarChart, LineChart, ArrowUpDown, ArrowLeft, ArrowRight } from 'lucide-react';
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
  const [analyticsTab, setAnalyticsTab] = useState('regions'); // 'regions', 'models', 'yearly'
  const [yearTab, setYearTab] = useState('2025'); // '2023', '2024', '2025'
  const { hapticFeedback } = useTelegram;
  
  // Флаг для предотвращения повторных запросов
  const dataLoaded = useRef(false);
  
  // Данные для API
  const [inMovementData, setInMovementData] = useState([]);
  const [frozenData, setFrozenData] = useState([]);
  const [notShippedData, setNotShippedData] = useState([]);
  const [deliveredData, setDeliveredData] = useState([]);
  const [analyticsData, setAnalyticsData] = useState({
    regions: [],
    models: [],
    yearly: {
      '2023': [],
      '2024': [],
      '2025': []
    }
  });
  
  // Период для аналитики
  const [period, setPeriod] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Форматирование даты для API
  const formatDateForAPI = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric'
    }).replace(/\./g, '.');
  };

  // Загрузка данных при инициализации
  useEffect(() => {
    // Проверяем, загружены ли уже данные
    if (dataLoaded.current) {
      return;
    }
    
    const fetchAllData = async () => {
      setLoading(true);
      try {
        // 1. Загрузка основных данных (не аналитических)
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
        
        console.log('Основные данные успешно загружены');
        
        // 2. Загрузка аналитических данных за текущий месяц
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        
        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
        
        const startDate = formatDateForAPI(startOfMonth.toISOString().split('T')[0]);
        const endDate = formatDateForAPI(endOfMonth.toISOString().split('T')[0]);
        
        console.log(`Загрузка аналитики за месяц: ${startDate} - ${endDate}`);
        
        const monthlyAnalytics = await fetch('https://uzavtosalon.uz/b/dashboard/infos&auto_analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            begin_date: startDate,
            end_date: endDate
          })
        }).then(res => res.json());
        
        // 3. Загрузка аналитических данных за текущий год
        const startOfYear = `01.01.${currentYear}`;
        const endOfYear = `31.12.${currentYear}`;
        
        console.log(`Загрузка аналитики за год: ${startOfYear} - ${endOfYear}`);
        
        const yearlyAnalytics = await fetch('https://uzavtosalon.uz/b/dashboard/infos&auto_analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            begin_date: startOfYear,
            end_date: endOfYear
          })
        }).then(res => res.json());
        
        // Обработка данных регионов и моделей (из месячной аналитики)
        const regionsData = processRegionsData(monthlyAnalytics);
        const modelsData = processModelsData(monthlyAnalytics);
        
        // Обработка годовых данных
        const yearlyData = processYearlyData(yearlyAnalytics, currentYear);
        
        // Обновление состояния с аналитическими данными
        setAnalyticsData({
          regions: regionsData,
          models: modelsData,
          yearly: {
            '2023': [], // В данном случае заполняем только текущий год
            '2024': [],
            '2025': yearlyData
          }
        });
        
        console.log('Аналитические данные успешно загружены');
        
        // Отмечаем, что данные загружены
        dataLoaded.current = true;
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        setLoading(false);
      }
    };
    
    // Запускаем загрузку данных
    fetchAllData();
  }, []);

  // Обработка данных регионов
  const processRegionsData = (data) => {
    if (!data || !data.filter_by_region) return [];
    
    return data.filter_by_region
      .filter(region => region.region_id)
      .map(region => ({
        name: region.region_name || "Регион не указан",
        contracts: parseInt(region.total_contracts || 0),
        totalAmount: parseInt(region.total_price || 0)
      }))
      .filter(region => region.contracts > 0 || region.totalAmount > 0)
      .sort((a, b) => b.contracts - a.contracts);
  };
  
  // Обработка данных моделей
  const processModelsData = (data) => {
    if (!data || !data.filter_by_modification) return [];
    
    return data.filter_by_modification
      .filter(model => model.modification_id)
      .map(model => ({
        id: model.modification_id,
        name: model.modification_name || "Модель не указана",
        contracts: parseInt(model.total_contracts || 0),
        totalAmount: parseInt(model.total_price || 0),
        img: model.photo_sha ? `https://uzavtosalon.uz/b/core/m$load_image?sha=${model.photo_sha}&width=400&height=400` : null
      }))
      .filter(model => model.contracts > 0 || model.totalAmount > 0)
      .sort((a, b) => b.contracts - a.contracts);
  };
  
  // Обработка годовых данных
  const processYearlyData = (data, year) => {
    if (!data || !data.filter_by_month) return [];
    
    const currentMonth = new Date().getMonth() + 1;
    const monthlyData = [];
    
    // Создаем массив с данными для всех месяцев
    for (let i = 1; i <= 12; i++) {
      const monthStr = `${year}-${i.toString().padStart(2, '0')}`;
      
      // Если месяц еще не наступил, добавляем пустые данные
      if (i > currentMonth) {
        monthlyData.push({
          month: monthStr,
          contracts: 0,
          totalAmount: 0
        });
        continue;
      }
      
      // Находим данные месяца в ответе API
      const monthData = data.filter_by_month.find(item => item.month === monthStr);
      
      // Если данные найдены, обрабатываем их
      if (monthData && monthData.regions) {
        const contracts = monthData.regions.reduce((sum, region) => sum + parseInt(region.contract || 0), 0);
        const totalAmount = monthData.regions.reduce((sum, region) => sum + parseInt(region.total_price || 0), 0);
        
        monthlyData.push({
          month: monthStr,
          contracts,
          totalAmount
        });
      } else {
        // Если данных нет, добавляем пустые
        monthlyData.push({
          month: monthStr,
          contracts: 0,
          totalAmount: 0
        });
      }
    }
    
    return monthlyData;
  };

  // Функция для обновления аналитических данных при изменении периода
  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    fetchAnalyticsByPeriod(newPeriod);
  };
  
  // Запрос аналитических данных за указанный период
  const fetchAnalyticsByPeriod = async (periodToUse) => {
    setLoading(true);
    try {
      const startDate = formatDateForAPI(periodToUse.start);
      const endDate = formatDateForAPI(periodToUse.end);
      
      console.log(`Загрузка аналитики за период: ${startDate} - ${endDate}`);
      
      const response = await fetch('https://uzavtosalon.uz/b/dashboard/infos&auto_analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          begin_date: startDate,
          end_date: endDate
        })
      });
      
      const data = await response.json();
      
      // Обработка данных
      const regionsData = processRegionsData(data);
      const modelsData = processModelsData(data);
      
      // Обновляем только данные регионов и моделей, не трогая годовые
      setAnalyticsData(prevData => ({
        ...prevData,
        regions: regionsData,
        models: modelsData
      }));
      
      console.log('Данные за период успешно обновлены');
    } catch (error) {
      console.error('Ошибка загрузки данных за период:', error);
    } finally {
      setLoading(false);
    }
  };

  // Запрос для обновления всех данных
  const refreshAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAnalyticsByPeriod(period),
        fetchYearlyData(new Date().getFullYear())
      ]);
    } catch (error) {
      console.error('Ошибка при обновлении данных:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Функция для загрузки годовых данных
  const fetchYearlyData = async (year) => {
    try {
      const startOfYear = `01.01.${year}`;
      const endOfYear = `31.12.${year}`;
      
      console.log(`Загрузка аналитики за год: ${startOfYear} - ${endOfYear}`);
      
      const response = await fetch('https://uzavtosalon.uz/b/dashboard/infos&auto_analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          begin_date: startOfYear,
          end_date: endOfYear
        })
      });
      
      const data = await response.json();
      
      // Обработка годовых данных
      const yearlyData = processYearlyData(data, year);
      
      // Обновляем только годовые данные для выбранного года
      setAnalyticsData(prevData => ({
        ...prevData,
        yearly: {
          ...prevData.yearly,
          [year]: yearlyData
        }
      }));
      
      console.log(`Данные за ${year} год успешно обновлены`);
    } catch (error) {
      console.error(`Ошибка загрузки данных за ${year} год:`, error);
    }
  };

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
  
  // Обработка данных замороженных контрактов
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

  // Форматирование данных о не отгруженных автомобилях
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

  // Обработчики для навигации и интерактивности
  const handleModelSelect = (modelId) => {
    setSelectedModel(modelId);
    
    // Сбрасываем флаг, чтобы можно было загрузить данные для выбранной модели
    dataLoaded.current = false;
    
    // Загружаем данные для выбранной модели
    const fetchAllData = async () => {
      setLoading(true);
      try {
        // Базовый URL API
        const baseUrl = 'https://uzavtosalon.uz/b/dashboard/infos';
        
        // Добавляем параметр модели к URL
        const modelParam = `&model_id=${modelId}`;
        
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
        
        console.log('Данные успешно загружены для модели:', modelId);
      } catch (error) {
        console.error('Ошибка загрузки данных для модели:', error);
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
        titleElement.innerHTML = `Мониторинг продаж: ${model.name}`;
      }
    } else if (titleElement) {
      titleElement.innerHTML = 'Мониторинг продаж автомобилей';
    }
  }, [selectedModel]);

  // Форматирование денежных значений
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ru-RU').format(value) + ' сум';
  };

  // Обработчик переключения вкладок аналитики
  const handleAnalyticsTabChange = (tab) => {
    setAnalyticsTab(tab);
    
    // Если переключаемся на годовую вкладку и нет данных для выбранного года - загрузим их
    if (tab === 'yearly' && analyticsData.yearly[yearTab].length === 0) {
      fetchYearlyData(parseInt(yearTab));
    }
  };

  // Обработчик переключения вкладок годов
  const handleYearTabChange = (year) => {
    setYearTab(year);
    
    // Если нет данных для выбранного года - загрузим их
    if (analyticsData.yearly[year].length === 0) {
      fetchYearlyData(parseInt(year));
    }
  };

  // Компонент выбора периода
  const PeriodSelector = () => {
    // Локальное состояние для временного хранения значений периода
    const [localPeriod, setLocalPeriod] = useState({...period});
    
    // Обработчик изменения начальной даты
    const handleStartDateChange = (e) => {
      setLocalPeriod({...localPeriod, start: e.target.value});
    };
    
    // Обработчик изменения конечной даты
    const handleEndDateChange = (e) => {
      setLocalPeriod({...localPeriod, end: e.target.value});
    };
    
    // Применение выбранного периода
    const applyPeriod = () => {
      // Проверяем, что конечная дата не раньше начальной
      if (new Date(localPeriod.end) < new Date(localPeriod.start)) {
        alert('Дата окончания не может быть раньше даты начала');
        return;
      }
      
      // Проверяем, что период не слишком велик (например, не более 1 года)
      const startDate = new Date(localPeriod.start);
      const endDate = new Date(localPeriod.end);
      const diffTime = Math.abs(endDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays > 366) {
        alert('Период не может быть больше 1 года. Пожалуйста, выберите меньший период.');
        return;
      }
      
      // Применяем период и запускаем загрузку данных
      handlePeriodChange(localPeriod);
    };
    
    // Предустановленные периоды
    const presetPeriods = [
      { name: 'Сегодня', period: { 
        start: new Date().toISOString().split('T')[0], 
        end: new Date().toISOString().split('T')[0] 
      }},
      { name: 'Неделя', period: { 
        start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0], 
        end: new Date().toISOString().split('T')[0] 
      }},
      { name: 'Месяц', period: { 
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], 
        end: new Date().toISOString().split('T')[0] 
      }},
      { name: 'Квартал', period: { 
        start: new Date(new Date().setDate(new Date().getDate() - 90)).toISOString().split('T')[0], 
        end: new Date().toISOString().split('T')[0] 
      }}
    ];
    
    return (
      <div className="flex items-center gap-3">
        {/* Предустановленные периоды */}
        <div className="flex border border-gray-700 rounded-md overflow-hidden bg-gray-800">
          {presetPeriods.map((preset, index) => (
            <button 
              key={index}
              className={`px-3 py-1.5 text-sm ${
                period.start === preset.period.start && period.end === preset.period.end 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:bg-gray-700'
              }`}
              onClick={() => handlePeriodChange(preset.period)}
            >
              {preset.name}
            </button>
          ))}
        </div>
        
        {/* Выбор произвольного периода */}
        <div className="flex gap-2 items-center">
          <input 
            type="date" 
            value={localPeriod.start} 
            onChange={handleStartDateChange}
            className="bg-gray-800 text-gray-300 border border-gray-700 rounded-md px-2 py-1.5 text-sm w-36"
          />
          <ArrowRight size={14} className="text-gray-500" />
          <input 
            type="date" 
            value={localPeriod.end} 
            onChange={handleEndDateChange}
            className="bg-gray-800 text-gray-300 border border-gray-700 rounded-md px-2 py-1.5 text-sm w-36"
          />
          <button 
            onClick={applyPeriod}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm flex items-center"
          >
            Применить
          </button>
        </div>
      </div>
    );
  };

  // Компонент графика по регионам
  const RegionsChart = () => {
    const data = analyticsData.regions.slice(0, 10);
    
    if (data.length === 0) {
      return (
        <div className="p-4 text-center">
          <div className="bg-gray-800/70 rounded-lg p-8 border border-gray-700/60">
            <AlertTriangle size={32} className="text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Нет данных для отображения</h3>
            <p className="text-gray-400">Данные по регионам отсутствуют за выбранный период. Попробуйте изменить период или обновить данные.</p>
          </div>
        </div>
      );
    }
    
    const maxContracts = Math.max(...data.map(item => item.contracts), 1);
    const maxAmount = Math.max(...data.map(item => item.totalAmount), 1);
    
    return (
      <div className="p-4">
        <h3 className="text-base font-medium text-white mb-4">Контракты по регионам за выбранный период</h3>
        
        <div className="grid grid-cols-1 gap-8">
          {/* График контрактов */}
          <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/60">
            <div className="flex justify-between text-sm text-gray-400 mb-3">
              <span>Регион</span>
              <span>Количество контрактов</span>
            </div>
            
            <div className="space-y-3">
              {data.map((region, index) => (
                <div key={index} className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-300 truncate max-w-[70%]">{region.name}</span>
                    <span className="text-white font-semibold">{region.contracts}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${(region.contracts / maxContracts) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 w-14 text-right">{Math.round((region.contracts / maxContracts) * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* График суммы */}
          <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/60">
            <div className="flex justify-between text-sm text-gray-400 mb-3">
              <span>Регион</span>
              <span>Сумма контрактов</span>
            </div>
            
            <div className="space-y-3">
              {data.map((region, index) => (
                <div key={index} className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-300 truncate max-w-[70%]">{region.name}</span>
                    <span className="text-white font-semibold">{formatCurrency(region.totalAmount)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-green-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${(region.totalAmount / maxAmount) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 w-14 text-right">{Math.round((region.totalAmount / maxAmount) * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Компонент графика по моделям
  const ModelsChart = () => {
    const data = analyticsData.models.slice(0, 10);
    
    if (data.length === 0) {
      return (
        <div className="p-4 text-center">
          <div className="bg-gray-800/70 rounded-lg p-8 border border-gray-700/60">
            <AlertTriangle size={32} className="text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Нет данных для отображения</h3>
            <p className="text-gray-400">Данные по моделям отсутствуют за выбранный период. Попробуйте изменить период или обновить данные.</p>
          </div>
        </div>
      );
    }
    
    const maxContracts = Math.max(...data.map(item => item.contracts), 1);
    const maxAmount = Math.max(...data.map(item => item.totalAmount), 1);
    
    return (
      <div className="p-4">
        <h3 className="text-base font-medium text-white mb-4">Контракты по моделям за выбранный период</h3>
        
        <div className="grid grid-cols-1 gap-8">
          {/* График контрактов */}
          <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/60">
            <div className="flex justify-between text-sm text-gray-400 mb-3">
              <span>Модель</span>
              <span>Количество контрактов</span>
            </div>
            
            <div className="space-y-4">
              {data.map((model, index) => (
                <div key={index} className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 max-w-[70%]">
                      {model.img && (
                        <div className="w-8 h-8 rounded overflow-hidden bg-gray-700 flex-shrink-0">
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
                      )}
                      <span className="text-gray-300 truncate">{model.name}</span>
                    </div>
                    <span className="text-white font-semibold">{model.contracts}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${(model.contracts / maxContracts) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 w-14 text-right">{Math.round((model.contracts / maxContracts) * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* График суммы */}
          <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/60">
            <div className="flex justify-between text-sm text-gray-400 mb-3">
              <span>Модель</span>
              <span>Сумма контрактов</span>
            </div>
            
            <div className="space-y-4">
              {data.map((model, index) => (
                <div key={index} className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 max-w-[70%]">
                      {model.img && (
                        <div className="w-8 h-8 rounded overflow-hidden bg-gray-700 flex-shrink-0">
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
                      )}
                      <span className="text-gray-300 truncate">{model.name}</span>
                    </div>
                    <span className="text-white font-semibold">{formatCurrency(model.totalAmount)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-green-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${(model.totalAmount / maxAmount) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 w-14 text-right">{Math.round((model.totalAmount / maxAmount) * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Компонент графика по годам
  const YearlyChart = () => {
    const data = analyticsData.yearly[yearTab];
    
    // Если данных нет, показываем заглушку
    if (!data || data.length === 0) {
      return (
        <div className="p-4 text-center">
          <div className="bg-gray-800/70 rounded-lg p-8 border border-gray-700/60">
            <AlertTriangle size={32} className="text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Нет данных для отображения</h3>
            <p className="text-gray-400">Данные за {yearTab} год отсутствуют или еще не загружены.</p>
          </div>
        </div>
      );
    }
    
    // Создаем полный массив месяцев для отображения (даже если данных нет)
    const monthlyData = months.map((month, index) => {
      const monthNum = index + 1;
      const monthStr = `${yearTab}-${String(monthNum).padStart(2, '0')}`;
      const monthData = data.find(item => item.month === monthStr);
      
      return {
        month,
        index: monthNum,
        contracts: monthData ? monthData.contracts : 0,
        totalAmount: monthData ? monthData.totalAmount : 0
      };
    });
    
    const maxContracts = Math.max(...monthlyData.map(item => item.contracts), 1);
    const totalContracts = monthlyData.reduce((sum, item) => sum + item.contracts, 0);
    const totalAmount = monthlyData.reduce((sum, item) => sum + item.totalAmount, 0);
    
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-medium text-white">Динамика контрактов за {yearTab} год</h3>
          <div className="text-sm text-gray-400">
            <span className="text-gray-300 font-medium">{totalContracts}</span> контрактов на 
            <span className="text-gray-300 font-medium ml-1">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-8">
          {/* График контрактов по месяцам */}
          <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/60">
            <div className="flex justify-between text-sm text-gray-400 mb-4">
              <span>Месяц</span>
              <span>Количество контрактов</span>
            </div>
            
            <div className="grid grid-cols-12 gap-2 h-48 mb-2">
              {monthlyData.map((item, index) => (
                <div 
                  key={index} 
                  className="flex flex-col justify-end items-center"
                >
                  <div className="text-xs text-gray-400 mb-1">{item.contracts}</div>
                  <div 
                    className="w-full bg-blue-500 rounded-t-md hover:bg-blue-400 transition-all duration-300 group relative"
                    style={{ 
                      height: `${maxContracts ? (item.contracts / maxContracts) * 100 : 0}%`,
                      minHeight: item.contracts > 0 ? '4px' : '0'
                    }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap transition-opacity z-10">
                      {item.contracts} контрактов <br />
                      {formatCurrency(item.totalAmount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-12 gap-2 mt-1 border-t border-gray-700/60 pt-2">
              {monthlyData.map((item, index) => (
                <div key={index} className="text-center">
                  <span className="text-xs text-gray-400">{item.month}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* График доходов по месяцам */}
          <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/60">
            <div className="flex justify-between text-sm text-gray-400 mb-4">
              <span>Месяц</span>
              <span>Суммы контрактов</span>
            </div>
            
            <div className="grid grid-cols-12 gap-2 h-48 mb-2">
              {monthlyData.map((item, index) => {
                const maxAmount = Math.max(...monthlyData.map(m => m.totalAmount), 1);
                return (
                  <div 
                    key={index} 
                    className="flex flex-col justify-end items-center"
                  >
                    <div className="text-xs text-gray-400 mb-1 truncate w-full text-center">
                      {item.totalAmount > 0 ? formatCurrency(item.totalAmount).split(' ')[0] : '0'}
                    </div>
                    <div 
                      className="w-full bg-green-500 rounded-t-md hover:bg-green-400 transition-all duration-300 group relative"
                      style={{ 
                        height: `${(item.totalAmount / maxAmount) * 100}%`,
                        minHeight: item.totalAmount > 0 ? '4px' : '0'
                      }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap transition-opacity z-10">
                        {formatCurrency(item.totalAmount)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="grid grid-cols-12 gap-2 mt-1 border-t border-gray-700/60 pt-2">
              {monthlyData.map((item, index) => (
                <div key={index} className="text-center">
                  <span className="text-xs text-gray-400">{item.month}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Таблица с данными по месяцам */}
          <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/60">
            <div className="text-sm text-gray-400 mb-3">Сводная таблица по месяцам</div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-900/80">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-400 font-medium">Месяц</th>
                    <th className="px-3 py-2 text-right text-gray-400 font-medium">Контракты</th>
                    <th className="px-3 py-2 text-right text-gray-400 font-medium">Сумма</th>
                    <th className="px-3 py-2 text-right text-gray-400 font-medium">% от общего</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {monthlyData.map((item, index) => (
                    <tr key={index} className={`${index % 2 === 0 ? 'bg-gray-800/60' : 'bg-gray-800/30'} hover:bg-gray-700/50`}>
                      <td className="px-3 py-2 font-medium text-white">{item.month}</td>
                      <td className="px-3 py-2 text-right text-gray-300">{item.contracts}</td>
                      <td className="px-3 py-2 text-right text-gray-300">{formatCurrency(item.totalAmount)}</td>
                      <td className="px-3 py-2 text-right text-gray-300">
                        {totalContracts > 0 
                          ? Math.round((item.contracts / totalContracts) * 100) 
                          : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-900/80">
                  <tr>
                    <td className="px-3 py-2 font-medium text-white">Итого</td>
                    <td className="px-3 py-2 text-right font-medium text-white">{totalContracts}</td>
                    <td className="px-3 py-2 text-right font-medium text-white">{formatCurrency(totalAmount)}</td>
                    <td className="px-3 py-2 text-right font-medium text-white">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Компонент аналитического дашборда
  const renderAnalyticsDashboard = () => {
    return (
      <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg border border-gray-700/50 shadow-md overflow-hidden">
        <div className="flex justify-between items-center p-3 border-b border-gray-700">
          <h2 className="text-base font-medium text-white flex items-center gap-2">
            <BarChart3 size={18} className="text-blue-400" />
            Аналитика продаж
            {selectedModel && (
              <span className="ml-2 text-sm text-gray-400">
                • {carModels.find(m => m.id === selectedModel)?.name}
              </span>
            )}
          </h2>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={refreshAllData}
              className="bg-gray-700 hover:bg-gray-600 text-gray-300 p-1.5 rounded-md flex items-center gap-1.5 text-xs"
            >
              <RefreshCcw size={14} />
              <span>Обновить</span>
            </button>
          </div>
        </div>
        
        {/* Панель управления аналитикой */}
        <div className="bg-gray-850 p-3 border-b border-gray-700">
          <div className="flex flex-wrap gap-4 justify-between items-center">
            {/* Вкладки типа аналитики */}
            <div className="flex border border-gray-700 rounded-md overflow-hidden">
              <button 
                className={`px-3 py-1.5 text-sm flex items-center gap-1.5 ${analyticsTab === 'regions' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                onClick={() => handleAnalyticsTabChange('regions')}
              >
                <MapPin size={14} />
                <span>Регионы</span>
              </button>
              <button 
                className={`px-3 py-1.5 text-sm flex items-center gap-1.5 ${analyticsTab === 'models' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                onClick={() => handleAnalyticsTabChange('models')}
              >
                <Car size={14} />
                <span>Модели</span>
              </button>
              <button 
                className={`px-3 py-1.5 text-sm flex items-center gap-1.5 ${analyticsTab === 'yearly' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                onClick={() => handleAnalyticsTabChange('yearly')}
              >
                <LineChart size={14} />
                <span>Годовая</span>
              </button>
            </div>
            
            {/* Вкладки года для годовой аналитики */}
            {analyticsTab === 'yearly' && (
              <div className="flex border border-gray-700 rounded-md overflow-hidden">
                <button 
                  className={`px-3 py-1.5 text-sm ${yearTab === '2023' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                  onClick={() => handleYearTabChange('2023')}
                >
                  2023
                </button>
                <button 
                  className={`px-3 py-1.5 text-sm ${yearTab === '2024' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                  onClick={() => handleYearTabChange('2024')}
                >
                  2024
                </button>
                <button 
                  className={`px-3 py-1.5 text-sm ${yearTab === '2025' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                  onClick={() => handleYearTabChange('2025')}
                >
                  2025
                </button>
              </div>
            )}
          </div>
          
          {/* Селектор периода (только для регионов и моделей) */}
          {(analyticsTab === 'regions' || analyticsTab === 'models') && (
            <div className="mt-3">
              <PeriodSelector />
            </div>
          )}
        </div>
        
        {/* Контент аналитического дашборда */}
        <div className="max-h-[600px] overflow-y-auto">
          {analyticsTab === 'regions' && <RegionsChart />}
          {analyticsTab === 'models' && <ModelsChart />}
          {analyticsTab === 'yearly' && <YearlyChart />}
        </div>
      </div>
    );
  };

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
                    img: model.photo_sha
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
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = carModelMap[model.id]?.img || '';
                            }}
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
          {/* Новый компонент для аналитики */}
          {renderAnalyticsDashboard()}
          
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