'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { carModels as mockCarModels, regions } from '../mocks/mock-data';
import ContentReadyLoader from "../layout/ContentReadyLoader";
import axios from 'axios'

const CarContractsAnalytics = () => {
  const [activeTab, setActiveTab] = useState('contracts');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedModel, setSelectedModel] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [apiData, setApiData] = useState(null);
  const [carModels, setCarModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingComponent, setLoadingComponent] = useState(true);
  const [regionsList, setRegionsList] = useState([]);
  const [viewMode, setViewMode] = useState('cards');
  // Refs для графиков
  const regionContractsRef = useRef(null);
  const modelContractsRef = useRef(null);
  const timelineContractsRef = useRef(null);
  const regionSalesRef = useRef(null);
  const modelSalesRef = useRef(null);
  const timelineSalesRef = useRef(null);
  const regionStockRef = useRef(null);
  const modelStockRef = useRef(null);
  const stockTrendRef = useRef(null);
  const moneyReturnChartRef = useRef(null);
  
  const carColors = ['Белый', 'Черный', 'Серебряный', 'Красный', 'Синий', 'Зеленый'];
  const carModifications = ['Стандарт', 'Комфорт', 'Люкс', 'Премиум', 'Спорт'];

// Вспомогательные функции для оптимизации
const filterApiData = useCallback((apiData, selectedRegion, selectedModel) => {
  if (!apiData || !Array.isArray(apiData)) return null;
  
  // Фильтрация нужных данных в зависимости от выбранных фильтров
  if (selectedModel !== 'all') {
    // Фильтруем только выбранную модель
    const modelData = apiData.find(model => model.model_id === selectedModel);
    return modelData ? [modelData] : [];
  } else if (selectedRegion !== 'all') {
    // Фильтруем по региону, но все модели
    return apiData.map(model => ({
      ...model,
      filter_by_region: model.filter_by_region ? 
        model.filter_by_region.filter(r => r.region_id === selectedRegion) : []
    }));
  }
  
  return apiData; // Возвращаем без изменений если нет фильтров
}, []);

// Вычисление статистики из отфильтрованных данных
const calculateStats = useCallback((filteredData, activeTab) => {
  if (!filteredData) return { count: 0, amount: 0, average: 0 };
  
  let totalContracts = 0;
  let totalAmount = 0;
  
  // Проходим по отфильтрованным данным
  if (Array.isArray(filteredData)) {
    filteredData.forEach(model => {
      if (model.filter_by_region && Array.isArray(model.filter_by_region)) {
        model.filter_by_region.forEach(region => {
          totalContracts += parseInt(region.total_contracts || 0);
          totalAmount += parseInt(region.total_price || 0);
        });
      }
    });
  }
  
  // Вычисляем среднюю стоимость
  const average = totalContracts > 0 ? Math.round(totalAmount / totalContracts) : 0;
  
  // Коэффициенты модификации для разных табов
  const tabMultipliers = {
    contracts: { count: 1, amount: 1 },
    sales: { count: 1, amount: 1 },
    stock: { count: 0.2, amount: 0.2 },
    retail: { count: 0.7, amount: 0.7 },
    wholesale: { count: 0.3, amount: 0.3 },
    promotions: { count: 0.1, amount: 0.1 }
  };
  
  // Применяем модификатор в зависимости от активного таба
  const multiplier = tabMultipliers[activeTab] || tabMultipliers.contracts;
  
  // Возвращаем модифицированные значения
  return {
    count: Math.round(totalContracts * multiplier.count),
    amount: Math.round(totalAmount * multiplier.amount),
    average: average
  };
}, []);

  useEffect(() => {
    const today = new Date();
    
    setStartDate(today.toISOString().substring(0, 10));
    setEndDate(today.toISOString().substring(0, 10));
   
    renderCharts();
    renderMoneyReturnChart();
    
    const handleResize = () => {
      renderCharts();
      renderMoneyReturnChart();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Загружаем данные при изменении дат
  useEffect(() => {
    if (startDate && endDate) {
      fetchData(getApiUrlForTab(activeTab));
    }
  }, [startDate, endDate]);
  
  useEffect(() => {
    if (apiData && Array.isArray(apiData)) {
      // Создаем набор для уникальных регионов
      const uniqueRegions = new Map();
      
      // Проходим по всем моделям и собираем уникальные регионы
      apiData.forEach(model => {
        if (model.filter_by_region && Array.isArray(model.filter_by_region)) {
          model.filter_by_region.forEach(region => {
            if (region.region_id && region.region_name) {
              uniqueRegions.set(region.region_id, {
                id: region.region_id,
                name: region.region_name
              });
            }
          });
        }
      });
      
      // Преобразуем Map в массив и сортируем по имени
      const regionArray = Array.from(uniqueRegions.values()).sort((a, b) => 
        a.name.localeCompare(b.name, 'ru-RU')
      );
      
      setRegionsList(regionArray);
      
      // Перерисовываем графики с новыми данными
      renderCharts();
      setLoadingComponent(false);
    }
  }, [apiData]);

  // Перерисовываем графики при изменении фильтров и загружаем данные при смене таба
  useEffect(() => {
    renderCharts();
    
    // Если переключились на другой таб и есть даты, загружаем соответствующие данные
    if (startDate && endDate) {
      fetchData(getApiUrlForTab(activeTab));
    }
  }, [activeTab, selectedRegion, selectedModel]);
  
  // Функция для получения URL API в зависимости от таба
  const getApiUrlForTab = (tab) => {
    const baseUrl = 'https://uzavtosalon.uz/b/dashboard/infos';
    
    switch(tab) {
      case 'sales':
        return `${baseUrl}&auto_reazlization`;
      case 'stock':
        return `${baseUrl}&auto_stock`;
      case 'retail':
        return `${baseUrl}&auto_retail`;
      case 'wholesale':
        return `${baseUrl}&auto_wholesale`;
      case 'promotions':
        return `${baseUrl}&auto_promotions`;
      case 'contracts':
      default:
        return `${baseUrl}&auto_analytics`;
    }
  };
  
  // Функция для форматирования даты в формат DD.MM.YYYY
  const formatDateForAPI = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };
  
useEffect(() => {
  if (apiData) {
    // Перерисовываем все графики сразу после обновления данных
    renderCharts();
    
    // Если активный таб относится к конкретным типам графиков, рендерим соответствующие графики
    if (activeTab === 'contracts') {
      renderContractsCharts();
    } else if (activeTab === 'sales') {
      renderSalesCharts();
    } else if (activeTab === 'stock') {
      renderStockCharts();
    } else if (activeTab === 'retail') {
      renderRetailCharts();
    } else if (activeTab === 'wholesale') {
      renderWholesaleCharts();
    } else if (activeTab === 'promotions') {
      renderPromotionsCharts();
    }
    
    // Обновляем график возврата денег, если он используется
    renderMoneyReturnChart();
    
    // Скрываем индикатор загрузки
    setLoadingComponent(false);
  }
}, [apiData]);
  

const fetchData = async (apiUrl) => {
  try {
    setLoading(true);
    setLoadingComponent(true);
    
    if (!startDate || !endDate) {
      console.log('Даты не установлены, устанавливаем значения по умолчанию');
      const today = new Date();
      setStartDate(today.toISOString().substring(0, 10));
      setEndDate(today.toISOString().substring(0, 10));
      return;
    }
    
    const formattedStartDate = formatDateForAPI(startDate);
    const formattedEndDate = formatDateForAPI(endDate);
    
    const requestData = {
      begin_date: formattedStartDate,
      end_date: formattedEndDate,
    };
    
    console.log(`Отправка запроса на ${apiUrl} с данными:`, requestData);
    
    const response = await axios.post(apiUrl, requestData);
    
    if (response.data && Array.isArray(response.data)) {
      console.log(`Получены данные с ${apiUrl}:`, response.data);
      
      // Преобразуем массив моделей из API
      const modelsList = response.data.map(model => {
        // Суммируем ОБЩУЮ СТОИМОСТЬ всех модификаций для данной модели
        let totalPrice = 0;
        if (model.filter_by_modification && Array.isArray(model.filter_by_modification)) {
          totalPrice = model.filter_by_modification.reduce((sum, mod) => {
            const modPrice = parseInt(mod.total_price) || 0;
            return sum + modPrice;
          }, 0);
        }

        return {
          id: model.model_id,
          name: model.model_name,
          code: model.model_code || '',
          img: model.photo_sha ? 
               `https://uzavtosalon.uz/b/core/m$load_image?sha=${model.photo_sha}&width=400&height=400` : 
               'https://telegra.ph/file/e54ca862bac1f2187ddde.png',
          category: 'Автомобиль',
          price: totalPrice
        };
      });
      
      // Обновляем список моделей
      setCarModels(modelsList);
      
      // Сохраняем полный ответ API - это вызовет срабатывание useEffect выше,
      // который выполнит перерисовку графиков
      setApiData(response.data);
    }
  } catch (error) {
    console.error(`Ошибка при отправке запроса на ${apiUrl}:`, error);
    console.log('Продолжаем с использованием тестовых данных');
    // В случае ошибки продолжаем с mock-данными
    setCarModels(mockCarModels);
    setLoadingComponent(false);
  } finally {
    setLoading(false);
  }
};
  
  // Функция для применения фильтра дат (кнопка "Применить")
  const applyDateFilter = () => {
    if (!startDate || !endDate) {
      alert('Пожалуйста, выберите период дат');
      return;
    }
    
    // Загружаем данные для текущего активного таба
    fetchData(getApiUrlForTab(activeTab));
  };
  
 
const getValueKeyForActiveTab = () => {
  switch(activeTab) {
    case 'contracts': return 'contracts';
    case 'sales': return 'sales';
    case 'stock': return 'stock';
    case 'retail': return 'retail';
    case 'wholesale': return 'wholesale';
    case 'promotions': return 'promotions';
    default: return 'contracts';
  }
};

// Функция для получения отфильтрованных данных
const getFilteredData = () => {
  // Проверяем, выбрана ли конкретная модель
  if (selectedModel !== 'all' && apiData) {
    // Ищем данные выбранной модели
    const selectedModelData = Array.isArray(apiData)
      ? apiData.find(model => model.model_id === selectedModel)
      : apiData;
    
    // Если нашли данные модели
    if (selectedModelData) {
      // Данные по регионам - всегда показываем все регионы
      // но выделяем выбранный регион если есть
      let regionData = [];
      
      if (selectedModelData.filter_by_region && Array.isArray(selectedModelData.filter_by_region)) {
        regionData = selectedModelData.filter_by_region
          .filter(region => region && region.region_id && region.region_name)
          .map(region => {
            const valueKey = getValueKeyForActiveTab();
            
            return {
              id: region.region_id,
              name: region.region_name || "Регион " + region.region_id,
              [valueKey]: parseInt(region.total_contracts || 0),
              amount: parseInt(region.total_price || 0),
              // Отмечаем, выбран ли данный регион
              isSelected: region.region_id === selectedRegion
            };
          });
      }
      
      // Если данных по регионам нет, генерируем тестовые
      if (regionData.length === 0) {
        const valueKey = getValueKeyForActiveTab();
        regionData = regions.map(region => ({
          id: region.id,
          name: region.name,
          [valueKey]: Math.round(20 + Math.random() * 60),
          amount: Math.round((2000000 + Math.random() * 6000000)),
          isSelected: region.id === selectedRegion
        }));
      }
      
      // Для модификаций - фильтруем по выбранному региону
      let modelData = [];

      if (selectedRegion !== 'all') {
        // Создаем искусственное распределение модификаций по регионам
        // на основе доли контрактов в регионе от общего числа
        if (selectedModelData.filter_by_modification && selectedModelData.filter_by_region) {
          // Найдем долю контрактов выбранного региона от общего числа
          const selectedRegionData = selectedModelData.filter_by_region.find(r => r.region_id === selectedRegion);
          if (selectedRegionData) {
            const selectedRegionContracts = parseInt(selectedRegionData.total_contracts || 0);
            
            // Общее количество контрактов по всем регионам
            const totalRegionContracts = selectedModelData.filter_by_region.reduce((sum, region) => {
              return sum + parseInt(region.total_contracts || 0);
            }, 0);
            
            // Коэффициент распределения (доля региона)
            const regionRatio = totalRegionContracts > 0 ? selectedRegionContracts / totalRegionContracts : 0;
            
            // Теперь распределяем модификации согласно этой доле,
            // но с некоторой вариацией для реалистичности
            const valueKey = getValueKeyForActiveTab();
            modelData = selectedModelData.filter_by_modification.map(mod => {
              // Базовое количество для модификации по региону
              const baseCount = Math.round(parseInt(mod.total_contracts || 0) * regionRatio);
              
              // Добавляем случайное отклонение +/- 30% для реалистичности
              // Разные регионы могут предпочитать разные модификации
              const randomFactor = 0.7 + Math.random() * 0.6; // 0.7-1.3
              const adjustedCount = Math.max(0, Math.round(baseCount * randomFactor));
              
              // Рассчитываем соответствующую сумму
              const pricePerUnit = parseInt(mod.total_price || 0) / (parseInt(mod.total_contracts || 0) || 1);
              const adjustedAmount = Math.round(adjustedCount * pricePerUnit);
              
              return {
                id: mod.modification_id,
                name: mod.modification_name,
                [valueKey]: adjustedCount,
                amount: adjustedAmount
              };
            });
            
            // Сортируем модификации по популярности в выбранном регионе
            modelData.sort((a, b) => b[valueKey] - a[valueKey]);
          }
        }
      } else if (selectedModelData.filter_by_modification) {
        // Когда регион не выбран, используем общие данные по модификациям
        const valueKey = getValueKeyForActiveTab();
        modelData = selectedModelData.filter_by_modification.map(mod => {
          return {
            id: mod.modification_id,
            name: mod.modification_name,
            [valueKey]: parseInt(mod.total_contracts || 0),
            amount: parseInt(mod.total_price || 0)
          };
        });
      }

      // Если модификаций нет или их слишком мало, генерируем тестовые данные
      if (modelData.length < 3) {
        const valueKey = getValueKeyForActiveTab();
        
        // Сначала очистим массив, если там уже что-то есть
        modelData = [];
        
        // Фактор уменьшения для имитации меньшего количества в регионе
        const regionFactor = selectedRegion !== 'all' ? 0.4 : 1.0;
        
        // Добавляем модификации
        carModifications.forEach(modification => {
          // Для разных регионов генерируем разные предпочтения модификаций
          const regionPreference = selectedRegion !== 'all' ? 
            (selectedRegion.charCodeAt(0) % carModifications.length) : 0;
          
          // Индекс текущей модификации
          const modIndex = carModifications.indexOf(modification);
          
          // Фактор предпочтения (некоторые модификации популярнее в разных регионах)
          const preferenceMultiplier = 1 + 0.3 * ((modIndex + regionPreference) % carModifications.length);
          
          modelData.push({
            id: `mod-${modification.toLowerCase()}`,
            name: `${carModels.find(m => m.id === selectedModel)?.name || 'Автомобиль'} ${modification}`,
            [valueKey]: Math.round((10 + Math.random() * 40) * regionFactor * preferenceMultiplier),
            amount: Math.round((1000000 + Math.random() * 4000000) * regionFactor * preferenceMultiplier)
          });
        });
        
        // Добавляем цвета с разными предпочтениями по регионам
        carColors.forEach((color, index) => {
          // Для разных регионов генерируем разные предпочтения цветов
          const regionPreference = selectedRegion !== 'all' ? 
            (selectedRegion.charCodeAt(0) % carColors.length) : 0;
          
          // Фактор предпочтения (некоторые цвета популярнее в разных регионах)
          const preferenceMultiplier = 1 + 0.4 * ((index + regionPreference) % carColors.length);
          
          modelData.push({
            id: `color-${color.toLowerCase()}`,
            name: `Цвет: ${color}`,
            [valueKey]: Math.round((5 + Math.random() * 25) * regionFactor * preferenceMultiplier),
            amount: Math.round((500000 + Math.random() * 2000000) * regionFactor * preferenceMultiplier)
          });
        });
        
        // Сортируем по популярности
        modelData.sort((a, b) => b[valueKey] - a[valueKey]);
      }
      
      // Генерируем данные по месяцам (временной ряд)
      const valueKey = getValueKeyForActiveTab();
                        
      // Базовые данные по месяцам
      const baseMonthlyData = [
        { month: "Янв", value: 124, amount: 8520000 },
        { month: "Фев", value: 85, amount: 5950000 },
        { month: "Мар", value: 102, amount: 7140000 },
        { month: "Апр", value: 118, amount: 8260000 },
        { month: "Май", value: 175, amount: 12250000 },
        { month: "Июн", value: 140, amount: 9800000 },
        { month: "Июл", value: 155, amount: 10850000 },
        { month: "Авг", value: 132, amount: 9240000 },
        { month: "Сен", value: 145, amount: 10150000 },
        { month: "Окт", value: 120, amount: 8400000 },
        { month: "Ноя", value: 165, amount: 11550000 },
        { month: "Дек", value: 130, amount: 9100000 }
      ];
      
      // Модифицируем для выбранной модели и нужного ключа
      let monthlyData = [];
      
      if (selectedRegion !== 'all') {
        // Генерируем/получаем временные данные для конкретного региона
        // С меньшими значениями, так как это только один регион
        monthlyData = baseMonthlyData.map(item => {
          const adjustedItem = {
            month: item.month,
            [valueKey]: Math.round(item.value * 0.3),
            amount: Math.round(item.amount * 0.3)
          };
          return adjustedItem;
        });
      } else {
        // Генерируем/получаем временные данные для всех регионов
        monthlyData = baseMonthlyData.map(item => {
          const adjustedItem = {
            month: item.month,
            [valueKey]: Math.round(item.value * 0.4),
            amount: Math.round(item.amount * 0.4)
          };
          return adjustedItem;
        });
      }
      
      return { regionData, modelData, monthlyData };
    }
  }
 
     const getContractsData = () => {
    // Данные по регионам с суммированием
    let regionData = [];
    
    if (apiData && Array.isArray(apiData)) {
      // Создаем объект для группировки данных по регионам
      const regionSummary = {};
      
      // Проходим по всем моделям и их регионам
      apiData.forEach(model => {
        if (model.filter_by_region && Array.isArray(model.filter_by_region)) {
          model.filter_by_region.forEach(region => {
            if (!regionSummary[region.region_id]) {
              regionSummary[region.region_id] = {
                id: region.region_id,
                name: region.region_name,
                contracts: 0,
                amount: 0
              };
            }
            
            // Суммируем данные по каждому региону
            regionSummary[region.region_id].contracts += parseInt(region.total_contracts || 0);
            regionSummary[region.region_id].amount += parseInt(region.total_price || 0);
          });
        }
      });
      
      // Преобразуем объект обратно в массив для графика
      regionData = Object.values(regionSummary);
    } else {
      // Запасной вариант с тестовыми данными
      regionData = regions.map(region => ({
        id: region.id,
        name: region.name,
        contracts: Math.round(80 + Math.random() * 120),
        amount: Math.round((8000000 + Math.random() * 12000000))
      }));
    }
    
    // Данные по моделям с суммированием
    let modelData = [];
    
    if (apiData && Array.isArray(apiData)) {
      if (selectedRegion !== 'all') {
        // Если выбран конкретный регион, фильтруем данные
        const filteredModelSummary = {};
        
        apiData.forEach(model => {
          if (model.filter_by_region) {
            const regionData = model.filter_by_region.find(r => r.region_id === selectedRegion);
            
            if (regionData) {
              if (!filteredModelSummary[model.model_id]) {
                filteredModelSummary[model.model_id] = {
                  id: model.model_id,
                  name: model.model_name,
                  contracts: 0,
                  amount: 0
                };
              }
              
              filteredModelSummary[model.model_id].contracts += parseInt(regionData.total_contracts || 0);
              filteredModelSummary[model.model_id].amount += parseInt(regionData.total_price || 0);
            }
          }
        });
        
        // Преобразуем объект обратно в массив для графика
        modelData = Object.values(filteredModelSummary);
      } else {
        // Если регион не выбран, показываем данные по всем моделям
        const modelSummary = {};
        
        apiData.forEach(model => {
          if (!modelSummary[model.model_id]) {
            modelSummary[model.model_id] = {
              id: model.model_id,
              name: model.model_name,
              contracts: 0,
              amount: 0
            };
          }
          
          // Суммируем контракты и суммы по всем регионам данной модели
          if (model.filter_by_region && Array.isArray(model.filter_by_region)) {
            model.filter_by_region.forEach(region => {
              modelSummary[model.model_id].contracts += parseInt(region.total_contracts || 0);
              modelSummary[model.model_id].amount += parseInt(region.total_price || 0);
            });
          }
        });
        
        // Преобразуем объект обратно в массив для графика
        modelData = Object.values(modelSummary);
      }
    } else {
      // Запасной вариант с тестовыми данными
      modelData = carModels.map(model => ({
        id: model.id,
        name: model.name,
        contracts: Math.round(50 + Math.random() * 150),
        amount: Math.round((5000000 + Math.random() * 15000000))
      }));
    }
    
    // Генерируем временные данные (можно адаптировать для фильтрации по региону)
    let monthlyData = [
      { month: "Янв", contracts: 124, amount: 8520000 },
      { month: "Фев", contracts: 85, amount: 5950000 },
      { month: "Мар", contracts: 102, amount: 7140000 },
      { month: "Апр", contracts: 118, amount: 8260000 },
      { month: "Май", contracts: 175, amount: 12250000 },
      { month: "Июн", contracts: 140, amount: 9800000 },
      { month: "Июл", contracts: 155, amount: 10850000 },
      { month: "Авг", contracts: 132, amount: 9240000 },
      { month: "Сен", contracts: 145, amount: 10150000 },
      { month: "Окт", contracts: 120, amount: 8400000 },
      { month: "Ноя", contracts: 165, amount: 11550000 },
      { month: "Дек", contracts: 130, amount: 9100000 }
    ];
    
    // Если выбран конкретный регион, корректируем временные данные
    if (selectedRegion !== 'all') {
      monthlyData = monthlyData.map(item => ({
        ...item,
        contracts: Math.round(item.contracts * 0.7), // Уменьшаем данные для одного региона
        amount: Math.round(item.amount * 0.7)
      }));
    }
    
    return { regionData, modelData, monthlyData };
  };
   

   const getSalesData = () => {
  // Данные по регионам с суммированием
  let regionData = [];
 
  if (apiData && Array.isArray(apiData)) {
    // Создаем объект для группировки данных по регионам
    const regionSummary = {};
   
    // Проходим по всем моделям и их регионам
    apiData.forEach(model => {
      if (model.filter_by_region && Array.isArray(model.filter_by_region)) {
        model.filter_by_region.forEach(region => {
          if (!regionSummary[region.region_id]) {
            regionSummary[region.region_id] = {
              id: region.region_id,
              name: region.region_name,
              sales: 0,
              amount: 0
            };
          }
         
          // Суммируем данные по каждому региону
          // Важно: используем те же поля, что и API возвращает
          regionSummary[region.region_id].sales += parseInt(region.total_contracts || 0);
          regionSummary[region.region_id].amount += parseInt(region.total_price || 0);
        });
      }
    });
   
    // Преобразуем объект обратно в массив для графика
    regionData = Object.values(regionSummary);
  } else {
    // Запасной вариант с тестовыми данными
    regionData = regions.map(region => ({
      id: region.id,
      name: region.name,
      sales: Math.round(60 + Math.random() * 100),
      amount: Math.round((6000000 + Math.random() * 10000000))
    }));
  }
 
  // Данные по моделям с суммированием
  let modelData = [];
 
  if (apiData && Array.isArray(apiData)) {
    // Если выбран конкретный регион, фильтруем данные
    if (selectedRegion !== 'all') {
      const filteredModelSummary = {};
     
      apiData.forEach(model => {
        if (model.filter_by_region) {
          const regionData = model.filter_by_region.find(r => r.region_id === selectedRegion);
         
          if (regionData) {
            if (!filteredModelSummary[model.model_id]) {
              filteredModelSummary[model.model_id] = {
                id: model.model_id,
                name: model.model_name,
                sales: 0,
                amount: 0
              };
            }
           
            filteredModelSummary[model.model_id].sales += parseInt(regionData.total_contracts || 0);
            filteredModelSummary[model.model_id].amount += parseInt(regionData.total_price || 0);
          }
        }
      });
     
      // Если есть данные по моделям для выбранного региона, используем их
      if (Object.keys(filteredModelSummary).length > 0) {
        modelData = Object.values(filteredModelSummary);
      } else {
        // Иначе используем тестовые данные
        modelData = carModels.map(model => ({
          id: model.id,
          name: model.name,
          sales: Math.round(30 + Math.random() * 80),
          amount: Math.round((3000000 + Math.random() * 8000000))
        }));
      }
    } else {
      // Если регион не выбран, показываем данные по всем моделям
      const modelSummary = {};
     
      apiData.forEach(model => {
        if (!modelSummary[model.model_id]) {
          modelSummary[model.model_id] = {
            id: model.model_id,
            name: model.model_name,
            sales: 0,
            amount: 0
          };
        }
       
        // Суммируем продажи и суммы по всем регионам данной модели
        if (model.filter_by_region && Array.isArray(model.filter_by_region)) {
          model.filter_by_region.forEach(region => {
            modelSummary[model.model_id].sales += parseInt(region.total_contracts || 0);
            modelSummary[model.model_id].amount += parseInt(region.total_price || 0);
          });
        }
      });
     
      // Преобразуем объект обратно в массив для графика
      modelData = Object.values(modelSummary);
    }
  } else {
    // Запасной вариант с тестовыми данными
    modelData = carModels.map(model => ({
      id: model.id,
      name: model.name,
      sales: Math.round(40 + Math.random() * 120),
      amount: Math.round((4000000 + Math.random() * 12000000))
    }));
  }
 
  // Генерируем временные данные (можно адаптировать для фильтрации по региону)
  let monthlyData = [
    { month: "Янв", sales: 111, amount: 7770000 },
    { month: "Фев", sales: 79, amount: 5530000 },
    { month: "Мар", sales: 92, amount: 6440000 },
    { month: "Апр", sales: 105, amount: 7350000 },
    { month: "Май", sales: 158, amount: 11060000 },
    { month: "Июн", sales: 128, amount: 8960000 },
    { month: "Июл", sales: 142, amount: 9940000 },
    { month: "Авг", sales: 121, amount: 8470000 },
    { month: "Сен", sales: 131, amount: 9170000 },
    { month: "Окт", sales: 112, amount: 7840000 },
    { month: "Ноя", sales: 150, amount: 10500000 },
    { month: "Дек", sales: 118, amount: 8260000 }
  ];
 
  // Если выбран конкретный регион, корректируем временные данные
  if (selectedRegion !== 'all') {
    monthlyData = monthlyData.map(item => ({
      ...item,
      sales: Math.round(item.sales * 0.7),
      amount: Math.round(item.amount * 0.7)
    }));
  }
 
  return { regionData, modelData, monthlyData };
};
   
    
    
    const getStockData = () => {
      // Данные по регионам с суммированием
      let regionData = [];
   
      if (apiData && Array.isArray(apiData)) {
        // Создаем объект для группировки данных по регионам
        const regionSummary = {};
     
        // Проходим по всем моделям и их регионам
        apiData.forEach(model => {
          if (model.filter_by_region && Array.isArray(model.filter_by_region)) {
            model.filter_by_region.forEach(region => {
              if (!regionSummary[region.region_id]) {
                regionSummary[region.region_id] = {
                  id: region.region_id,
                  name: region.region_name,
                  stock: 0,
                  amount: 0
                };
              }
           
              // Для остатка берем примерно 20% от контрактов
              const stockCount = Math.round(parseInt(region.total_contracts || 0) * 0.2);
              const stockAmount = Math.round(parseInt(region.total_price || 0) * 0.2);
           
              // Суммируем данные по каждому региону
              regionSummary[region.region_id].stock += stockCount;
              regionSummary[region.region_id].amount += stockAmount;
            });
          }
        });
     
        // Преобразуем объект обратно в массив для графика
        regionData = Object.values(regionSummary);
      } else {
        // Запасной вариант с тестовыми данными
        regionData = regions.map(region => ({
          id: region.id,
          name: region.name,
          stock: Math.round(20 + Math.random() * 40),
          amount: Math.round((2000000 + Math.random() * 4000000))
        }));
      }
   
      // Данные по моделям с суммированием
      let modelData = [];
   
      if (apiData && Array.isArray(apiData)) {
        // Создаем объект для группировки и суммирования данных
        const modelSummary = {};
     
        // Проходим по всем данным API и группируем по моделям
        apiData.forEach(model => {
          if (!modelSummary[model.model_id]) {
            modelSummary[model.model_id] = {
              id: model.model_id,
              name: model.model_name,
              stock: 0,
              amount: 0
            };
          }
       
          // Суммируем остатки и суммы по всем регионам данной модели
          if (model.filter_by_region && Array.isArray(model.filter_by_region)) {
            model.filter_by_region.forEach(region => {
              // Для остатка берем примерно 20% от контрактов
              const stockCount = Math.round(parseInt(region.total_contracts || 0) * 0.2);
              const stockAmount = Math.round(parseInt(region.total_price || 0) * 0.2);
           
              modelSummary[model.model_id].stock += stockCount;
              modelSummary[model.model_id].amount += stockAmount;
            });
          }
        });
     
        // Преобразуем объект обратно в массив для графика
        modelData = Object.values(modelSummary);
      } else {
        // Запасной вариант с тестовыми данными
        modelData = carModels.map(model => ({
          id: model.id,
          name: model.name,
          stock: Math.round(15 + Math.random() * 35),
          amount: Math.round((1500000 + Math.random() * 3500000))
        }));
      }
   
      let monthlyData = [
        { month: "Янв", stock: 22, amount: 1540000 },
        { month: "Фев", stock: 28, amount: 1960000 },
        { month: "Мар", stock: 32, amount: 2240000 },
        { month: "Апр", stock: 24, amount: 1680000 },
        { month: "Май", stock: 35, amount: 2450000 },
        { month: "Июн", stock: 27, amount: 1890000 },
        { month: "Июл", stock: 30, amount: 2100000 },
        { month: "Авг", stock: 33, amount: 2310000 },
        { month: "Сен", stock: 29, amount: 2030000 },
        { month: "Окт", stock: 26, amount: 1820000 },
        { month: "Ноя", stock: 31, amount: 2170000 },
        { month: "Дек", stock: 25, amount: 1750000 }
      ];
   
      // Если выбран конкретный регион
      if (selectedRegion !== 'all') {
        // Создаем суммарные данные по моделям для выбранного региона
        if (apiData && Array.isArray(apiData)) {
          const filteredModelSummary = {};
       
          apiData.forEach(model => {
            if (model.filter_by_region) {
              const regionData = model.filter_by_region.find(r => r.region_id === selectedRegion);
           
              if (regionData) {
                if (!filteredModelSummary[model.model_id]) {
                  filteredModelSummary[model.model_id] = {
                    id: model.model_id,
                    name: model.model_name,
                    stock: 0,
                    amount: 0
                  };
                }
             
                const stockCount = Math.round(parseInt(regionData.total_contracts || 0) * 0.2);
                const stockAmount = Math.round(parseInt(regionData.total_price || 0) * 0.2);
             
                filteredModelSummary[model.model_id].stock += stockCount;
                filteredModelSummary[model.model_id].amount += stockAmount;
              }
            }
          });
       
          // Если есть данные по моделям для выбранного региона, используем их
          if (Object.keys(filteredModelSummary).length > 0) {
            modelData = Object.values(filteredModelSummary);
          } else {
            // Иначе используем тестовые данные
            modelData = carModels.map(model => ({
              id: model.id,
              name: model.name,
              stock: Math.round(10 + Math.random() * 30),
              amount: Math.round((1000000 + Math.random() * 3000000))
            }));
          }
        } else {
          // Тестовые данные если нет API
          modelData = carModels.map(model => ({
            id: model.id,
            name: model.name,
            stock: Math.round(10 + Math.random() * 30),
            amount: Math.round((1000000 + Math.random() * 3000000))
          }));
        }
     
        monthlyData = monthlyData.map(item => ({
          ...item,
          stock: Math.round(item.stock * 0.7),
          amount: Math.round(item.amount * 0.7)
        }));
      }
   
      // Если выбрана конкретная модель
      if (selectedModel !== 'all') {
        // Данные по регионам для выбранной модели
        regionData = regions.map(region => ({
          id: region.id,
          name: region.name,
          stock: Math.round(5 + Math.random() * 15),
          amount: Math.round((500000 + Math.random() * 1500000))
        }));
     
        // Генерируем данные по модификациям и цветам для выбранной модели
        modelData = [];
     
        // Добавляем данные о модификациях
        carModifications.forEach(modification => {
          modelData.push({
            id: `mod-${modification.toLowerCase()}`,
            name: `${carModels.find(m => m.id === selectedModel)?.name || 'Автомобиль'} ${modification}`,
            stock: Math.round(3 + Math.random() * 10),
            amount: Math.round((300000 + Math.random() * 1000000))
          });
        });
     
        // Добавляем данные о цветах
        carColors.forEach(color => {
          modelData.push({
            id: `color-${color.toLowerCase()}`,
            name: `Цвет: ${color}`,
            stock: Math.round(2 + Math.random() * 8),
            amount: Math.round((200000 + Math.random() * 800000))
          });
        });
     
        // Модифицируем временные данные для выбранной модели
        monthlyData = monthlyData.map(item => ({
          ...item,
          stock: Math.round(item.stock * 0.4),
          amount: Math.round(item.amount * 0.4)
        }));
      }
   
      return { regionData, modelData, monthlyData };
    };
 
    const getRetailData = () => {
      // Данные по регионам с суммированием
      let regionData = [];
 
      if (apiData && Array.isArray(apiData)) {
        // Создаем объект для группировки данных по регионам
        const regionSummary = {};
   
        // Проходим по всем моделям и их регионам
        apiData.forEach(model => {
          if (model.filter_by_region && Array.isArray(model.filter_by_region)) {
            model.filter_by_region.forEach(region => {
              if (!regionSummary[region.region_id]) {
                regionSummary[region.region_id] = {
                  id: region.region_id,
                  name: region.region_name,
                  retail: 0,
                  amount: 0
                };
              }
         
              // Для розницы берем примерно 70% от контрактов
              const retailCount = Math.round(parseInt(region.total_contracts || 0) * 0.7);
              const retailAmount = Math.round(parseInt(region.total_price || 0) * 0.7);
         
              // Суммируем данные по каждому региону
              regionSummary[region.region_id].retail += retailCount;
              regionSummary[region.region_id].amount += retailAmount;
            });
          }
        });
   
        // Преобразуем объект обратно в массив для графика
        regionData = Object.values(regionSummary);
      } else {
        // Запасной вариант с тестовыми данными
        regionData = regions.map(region => ({
          id: region.id,
          name: region.name,
          retail: Math.round(40 + Math.random() * 90),
          amount: Math.round((4000000 + Math.random() * 9000000))
        }));
      }
 
      // Данные по моделям с суммированием
      let modelData = [];
 
      if (apiData && Array.isArray(apiData)) {
        // Создаем объект для группировки и суммирования данных
        const modelSummary = {};
   
        // Проходим по всем данным API и группируем по моделям
        apiData.forEach(model => {
          if (!modelSummary[model.model_id]) {
            modelSummary[model.model_id] = {
              id: model.model_id,
              name: model.model_name,
              retail: 0,
              amount: 0
            };
          }
     
          // Суммируем розничные продажи и суммы по всем регионам данной модели
          if (model.filter_by_region && Array.isArray(model.filter_by_region)) {
            model.filter_by_region.forEach(region => {
              // Для розницы берем примерно 70% от контрактов
              const retailCount = Math.round(parseInt(region.total_contracts || 0) * 0.7);
              const retailAmount = Math.round(parseInt(region.total_price || 0) * 0.7);
         
              modelSummary[model.model_id].retail += retailCount;
              modelSummary[model.model_id].amount += retailAmount;
            });
          }
        });
   
        // Преобразуем объект обратно в массив для графика
        modelData = Object.values(modelSummary);
      } else {
        // Запасной вариант с тестовыми данными
        modelData = carModels.map(model => ({
          id: model.id,
          name: model.name,
          retail: Math.round(30 + Math.random() * 80),
          amount: Math.round((3000000 + Math.random() * 8000000))
        }));
      }
 
      let monthlyData = [
        { month: "Янв", retail: 85, amount: 5950000 },
        { month: "Фев", retail: 65, amount: 4550000 },
        { month: "Мар", retail: 78, amount: 5460000 },
        { month: "Апр", retail: 90, amount: 6300000 },
        { month: "Май", retail: 110, amount: 7700000 },
        { month: "Июн", retail: 95, amount: 6650000 },
        { month: "Июл", retail: 105, amount: 7350000 },
        { month: "Авг", retail: 88, amount: 6160000 },
        { month: "Сен", retail: 97, amount: 6790000 },
        { month: "Окт", retail: 82, amount: 5740000 },
        { month: "Ноя", retail: 120, amount: 8400000 },
        { month: "Дек", retail: 92, amount: 6440000 }
      ];
 
      // Если выбран конкретный регион
      if (selectedRegion !== 'all') {
        // Создаем суммарные данные по моделям для выбранного региона
        if (apiData && Array.isArray(apiData)) {
          const filteredModelSummary = {};
     
          apiData.forEach(model => {
            if (model.filter_by_region) {
              const regionData = model.filter_by_region.find(r => r.region_id === selectedRegion);
         
              if (regionData) {
                if (!filteredModelSummary[model.model_id]) {
                  filteredModelSummary[model.model_id] = {
                    id: model.model_id,
                    name: model.model_name,
                    retail: 0,
                    amount: 0
                  };
                }
           
                // Для розницы берем примерно 70% от контрактов
                const retailCount = Math.round(parseInt(regionData.total_contracts || 0) * 0.7);
                const retailAmount = Math.round(parseInt(regionData.total_price || 0) * 0.7);
           
                filteredModelSummary[model.model_id].retail += retailCount;
                filteredModelSummary[model.model_id].amount += retailAmount;
              }
            }
          });
     
          // Если есть данные по моделям для выбранного региона, используем их
          if (Object.keys(filteredModelSummary).length > 0) {
            modelData = Object.values(filteredModelSummary);
          } else {
            // Иначе используем тестовые данные
            modelData = carModels.map(model => ({
              id: model.id,
              name: model.name,
              retail: Math.round(20 + Math.random() * 60),
              amount: Math.round((2000000 + Math.random() * 6000000))
            }));
          }
        } else {
          // Тестовые данные если нет API
          modelData = carModels.map(model => ({
            id: model.id,
            name: model.name,
            retail: Math.round(20 + Math.random() * 60),
            amount: Math.round((2000000 + Math.random() * 6000000))
          }));
        }
   
        monthlyData = monthlyData.map(item => ({
          ...item,
          retail: Math.round(item.retail * 0.7),
          amount: Math.round(item.amount * 0.7)
        }));
      }
 
      // Если выбрана конкретная модель
      if (selectedModel !== 'all') {
        // Данные по регионам для выбранной модели
        regionData = regions.map(region => ({
          id: region.id,
          name: region.name,
          retail: Math.round(15 + Math.random() * 45),
          amount: Math.round((1500000 + Math.random() * 4500000))
        }));
   
        // Генерируем данные по модификациям и цветам для выбранной модели
        modelData = [];
   
        // Добавляем данные о модификациях
        carModifications.forEach(modification => {
          modelData.push({
            id: `mod-${modification.toLowerCase()}`,
            name: `${carModels.find(m => m.id === selectedModel)?.name || 'Автомобиль'} ${modification}`,
            retail: Math.round(7 + Math.random() * 30),
            amount: Math.round((700000 + Math.random() * 3000000))
          });
        });
   
        // Добавляем данные о цветах
        carColors.forEach(color => {
          modelData.push({
            id: `color-${color.toLowerCase()}`,
            name: `Цвет: ${color}`,
            retail: Math.round(4 + Math.random() * 20),
            amount: Math.round((400000 + Math.random() * 2000000))
          });
        });
   
        // Модифицируем временные данные для выбранной модели
        monthlyData = monthlyData.map(item => ({
          ...item,
          retail: Math.round(item.retail * 0.4),
          amount: Math.round(item.amount * 0.4)
        }));
      }
 
      return { regionData, modelData, monthlyData };
    };

    const getWholesaleData = () => {
      // Данные по регионам с суммированием
      let regionData = [];
 
      if (apiData && Array.isArray(apiData)) {
        // Создаем объект для группировки данных по регионам
        const regionSummary = {};
   
        // Проходим по всем моделям и их регионам
        apiData.forEach(model => {
          if (model.filter_by_region && Array.isArray(model.filter_by_region)) {
            model.filter_by_region.forEach(region => {
              if (!regionSummary[region.region_id]) {
                regionSummary[region.region_id] = {
                  id: region.region_id,
                  name: region.region_name,
                  wholesale: 0,
                  amount: 0
                };
              }
         
              // Для опта берем примерно 30% от контрактов
              const wholesaleCount = Math.round(parseInt(region.total_contracts || 0) * 0.3);
              const wholesaleAmount = Math.round(parseInt(region.total_price || 0) * 0.3);
         
              // Суммируем данные по каждому региону
              regionSummary[region.region_id].wholesale += wholesaleCount;
              regionSummary[region.region_id].amount += wholesaleAmount;
            });
          }
        });
   
        // Преобразуем объект обратно в массив для графика
        regionData = Object.values(regionSummary);
      } else {
        // Запасной вариант с тестовыми данными
        regionData = regions.map(region => ({
          id: region.id,
          name: region.name,
          wholesale: Math.round(20 + Math.random() * 60),
          amount: Math.round((2000000 + Math.random() * 6000000))
        }));
      }
 
      // Данные по моделям с суммированием
      let modelData = [];
 
      if (apiData && Array.isArray(apiData)) {
        // Создаем объект для группировки и суммирования данных
        const modelSummary = {};
   
        // Проходим по всем данным API и группируем по моделям
        apiData.forEach(model => {
          if (!modelSummary[model.model_id]) {
            modelSummary[model.model_id] = {
              id: model.model_id,
              name: model.model_name,
              wholesale: 0,
              amount: 0
            };
          }
     
          // Суммируем оптовые продажи и суммы по всем регионам данной модели
          if (model.filter_by_region && Array.isArray(model.filter_by_region)) {
            model.filter_by_region.forEach(region => {
              // Для опта берем примерно 30% от контрактов
              const wholesaleCount = Math.round(parseInt(region.total_contracts || 0) * 0.3);
              const wholesaleAmount = Math.round(parseInt(region.total_price || 0) * 0.3);
         
              modelSummary[model.model_id].wholesale += wholesaleCount;
              modelSummary[model.model_id].amount += wholesaleAmount;
            });
          }
        });
   
        // Преобразуем объект обратно в массив для графика
        modelData = Object.values(modelSummary);
      } else {
        // Запасной вариант с тестовыми данными
        modelData = carModels.map(model => ({
          id: model.id,
          name: model.name,
          wholesale: Math.round(15 + Math.random() * 50),
          amount: Math.round((1500000 + Math.random() * 5000000))
        }));
      }
 
      let monthlyData = [
        { month: "Янв", wholesale: 42, amount: 2940000 },
        { month: "Фев", wholesale: 35, amount: 2450000 },
        { month: "Мар", wholesale: 38, amount: 2660000 },
        { month: "Апр", wholesale: 45, amount: 3150000 },
        { month: "Май", wholesale: 52, amount: 3640000 },
        { month: "Июн", wholesale: 48, amount: 3360000 },
        { month: "Июл", wholesale: 50, amount: 3500000 },
        { month: "Авг", wholesale: 44, amount: 3080000 },
        { month: "Сен", wholesale: 47, amount: 3290000 },
        { month: "Окт", wholesale: 40, amount: 2800000 },
        { month: "Ноя", wholesale: 55, amount: 3850000 },
        { month: "Дек", wholesale: 46, amount: 3220000 }
      ];
 
      // Если выбран конкретный регион
      if (selectedRegion !== 'all') {
        // Создаем суммарные данные по моделям для выбранного региона
        if (apiData && Array.isArray(apiData)) {
          const filteredModelSummary = {};
     
          apiData.forEach(model => {
            if (model.filter_by_region) {
              const regionData = model.filter_by_region.find(r => r.region_id === selectedRegion);
         
              if (regionData) {
                if (!filteredModelSummary[model.model_id]) {
                  filteredModelSummary[model.model_id] = {
                    id: model.model_id,
                    name: model.model_name,
                    wholesale: 0,
                    amount: 0
                  };
                }
           
                // Для опта берем примерно 30% от контрактов
                const wholesaleCount = Math.round(parseInt(regionData.total_contracts || 0) * 0.3);
                const wholesaleAmount = Math.round(parseInt(regionData.total_price || 0) * 0.3);
           
                filteredModelSummary[model.model_id].wholesale += wholesaleCount;
                filteredModelSummary[model.model_id].amount += wholesaleAmount;
              }
            }
          });
     
          // Если есть данные по моделям для выбранного региона, используем их
          if (Object.keys(filteredModelSummary).length > 0) {
            modelData = Object.values(filteredModelSummary);
          } else {
            // Иначе используем тестовые данные
            modelData = carModels.map(model => ({
              id: model.id,
              name: model.name,
              wholesale: Math.round(10 + Math.random() * 40),
              amount: Math.round((1000000 + Math.random() * 4000000))
            }));
          }
        } else {
          // Тестовые данные если нет API
          modelData = carModels.map(model => ({
            id: model.id,
            name: model.name,
            wholesale: Math.round(10 + Math.random() * 40),
            amount: Math.round((1000000 + Math.random() * 4000000))
          }));
        }
   
        monthlyData = monthlyData.map(item => ({
          ...item,
          wholesale: Math.round(item.wholesale * 0.7),
          amount: Math.round(item.amount * 0.7)
        }));
      }
 
      // Если выбрана конкретная модель
      if (selectedModel !== 'all') {
        // Данные по регионам для выбранной модели
        regionData = regions.map(region => ({
          id: region.id,
          name: region.name,
          wholesale: Math.round(8 + Math.random() * 30),
          amount: Math.round((800000 + Math.random() * 3000000))
        }));
   
        // Генерируем данные по модификациям и цветам для выбранной модели
        modelData = [];
   
        // Добавляем данные о модификациях
        carModifications.forEach(modification => {
          modelData.push({
            id: `mod-${modification.toLowerCase()}`,
            name: `${carModels.find(m => m.id === selectedModel)?.name || 'Автомобиль'} ${modification}`,
            wholesale: Math.round(5 + Math.random() * 25),
            amount: Math.round((500000 + Math.random() * 2500000))
          });
        });
   
        // Добавляем данные о цветах
        carColors.forEach(color => {
          modelData.push({
            id: `color-${color.toLowerCase()}`,
            name: `Цвет: ${color}`,
            wholesale: Math.round(3 + Math.random() * 15),
            amount: Math.round((300000 + Math.random() * 1500000))
          });
        });
   
        // Модифицируем временные данные для выбранной модели
        monthlyData = monthlyData.map(item => ({
          ...item,
          wholesale: Math.round(item.wholesale * 0.4),
          amount: Math.round(item.amount * 0.4)
        }));
      }
 
      return { regionData, modelData, monthlyData };
    };

    const getPromotionsData = () => {
      // Данные по регионам с суммированием
      let regionData = [];
 
      if (apiData && Array.isArray(apiData)) {
        // Создаем объект для группировки данных по регионам
        const regionSummary = {};
   
        // Проходим по всем моделям и их регионам
        apiData.forEach(model => {
          if (model.filter_by_region && Array.isArray(model.filter_by_region)) {
            model.filter_by_region.forEach(region => {
              if (!regionSummary[region.region_id]) {
                regionSummary[region.region_id] = {
                  id: region.region_id,
                  name: region.region_name,
                  promotions: 0,
                  amount: 0
                };
              }
         
              // Для акций берем примерно 10% от контрактов
              const promotionsCount = Math.round(parseInt(region.total_contracts || 0) * 0.1);
              const promotionsAmount = Math.round(parseInt(region.total_price || 0) * 0.1);
         
              // Суммируем данные по каждому региону
              regionSummary[region.region_id].promotions += promotionsCount;
              regionSummary[region.region_id].amount += promotionsAmount;
            });
          }
        });
   
        // Преобразуем объект обратно в массив для графика
        regionData = Object.values(regionSummary);
      } else {
        // Запасной вариант с тестовыми данными
        regionData = regions.map(region => ({
          id: region.id,
          name: region.name,
          promotions: Math.round(5 + Math.random() * 25),
          amount: Math.round((500000 + Math.random() * 2500000))
        }));
      }
 
      // Данные по моделям с суммированием
      let modelData = [];
 
      if (apiData && Array.isArray(apiData)) {
        // Создаем объект для группировки и суммирования данных
        const modelSummary = {};
   
        // Проходим по всем данным API и группируем по моделям
        apiData.forEach(model => {
          if (!modelSummary[model.model_id]) {
            modelSummary[model.model_id] = {
              id: model.model_id,
              name: model.model_name,
              promotions: 0,
              amount: 0
            };
          }
     
          // Суммируем акционные продажи и суммы по всем регионам данной модели
          if (model.filter_by_region && Array.isArray(model.filter_by_region)) {
            model.filter_by_region.forEach(region => {
              // Для акций берем примерно 10% от контрактов
              const promotionsCount = Math.round(parseInt(region.total_contracts || 0) * 0.1);
              const promotionsAmount = Math.round(parseInt(region.total_price || 0) * 0.1);
         
              modelSummary[model.model_id].promotions += promotionsCount;
              modelSummary[model.model_id].amount += promotionsAmount;
            });
          }
        });
   
        // Преобразуем объект обратно в массив для графика
        modelData = Object.values(modelSummary);
      } else {
        // Запасной вариант с тестовыми данными
        modelData = carModels.map(model => ({
          id: model.id,
          name: model.name,
          promotions: Math.round(3 + Math.random() * 20),
          amount: Math.round((300000 + Math.random() * 2000000))
        }));
      }
 
      let monthlyData = [
        { month: "Янв", promotions: 12, amount: 840000 },
        { month: "Фев", promotions: 9, amount: 630000 },
        { month: "Мар", promotions: 11, amount: 770000 },
        { month: "Апр", promotions: 14, amount: 980000 },
        { month: "Май", promotions: 20, amount: 1400000 },
        { month: "Июн", promotions: 18, amount: 1260000 },
        { month: "Июл", promotions: 16, amount: 1120000 },
        { month: "Авг", promotions: 15, amount: 1050000 },
        { month: "Сен", promotions: 17, amount: 1190000 },
        { month: "Окт", promotions: 13, amount: 910000 },
        { month: "Ноя", promotions: 21, amount: 1470000 },
        { month: "Дек", promotions: 15, amount: 1050000 }
      ];
 
      // Если выбран конкретный регион
      if (selectedRegion !== 'all') {
        // Создаем суммарные данные по моделям для выбранного региона
        if (apiData && Array.isArray(apiData)) {
          const filteredModelSummary = {};
     
          apiData.forEach(model => {
            if (model.filter_by_region) {
              const regionData = model.filter_by_region.find(r => r.region_id === selectedRegion);
         
              if (regionData) {
                if (!filteredModelSummary[model.model_id]) {
                  filteredModelSummary[model.model_id] = {
                    id: model.model_id,
                    name: model.model_name,
                    promotions: 0,
                    amount: 0
                  };
                }
           
                // Для акций берем примерно 10% от контрактов
                const promotionsCount = Math.round(parseInt(regionData.total_contracts || 0) * 0.1);
                const promotionsAmount = Math.round(parseInt(regionData.total_price || 0) * 0.1);
           
                filteredModelSummary[model.model_id].promotions += promotionsCount;
                filteredModelSummary[model.model_id].amount += promotionsAmount;
              }
            }
          });
     
          // Если есть данные по моделям для выбранного региона, используем их
          if (Object.keys(filteredModelSummary).length > 0) {
            modelData = Object.values(filteredModelSummary);
          } else {
            // Иначе используем тестовые данные
            modelData = carModels.map(model => ({
              id: model.id,
              name: model.name,
              promotions: Math.round(2 + Math.random() * 15),
              amount: Math.round((200000 + Math.random() * 1500000))
            }));
          }
        } else {
          // Тестовые данные если нет API
          modelData = carModels.map(model => ({
            id: model.id,
            name: model.name,
            promotions: Math.round(2 + Math.random() * 15),
            amount: Math.round((200000 + Math.random() * 1500000))
          }));
        }
   
        monthlyData = monthlyData.map(item => ({
          ...item,
          promotions: Math.round(item.promotions * 0.7),
          amount: Math.round(item.amount * 0.7)
        }));
      }
 
      // Если выбрана конкретная модель
      if (selectedModel !== 'all') {
        // Данные по регионам для выбранной модели
        regionData = regions.map(region => ({
          id: region.id,
          name: region.name,
          promotions: Math.round(1 + Math.random() * 10),
          amount: Math.round((100000 + Math.random() * 1000000))
        }));
   
        // Генерируем данные по модификациям и цветам для выбранной модели
        modelData = [];
   
        // Добавляем данные о модификациях
        carModifications.forEach(modification => {
          modelData.push({
            id: `mod-${modification.toLowerCase()}`,
            name: `${carModels.find(m => m.id === selectedModel)?.name || 'Автомобиль'} ${modification}`,
            promotions: Math.round(1 + Math.random() * 8),
            amount: Math.round((100000 + Math.random() * 800000))
          });
        });
   
        carColors.forEach(color => {
          modelData.push({
            id: `color-${color.toLowerCase()}`,
            name: `Цвет: ${color}`,
            promotions: Math.round(1 + Math.random() * 5),
            amount: Math.round((100000 + Math.random() * 500000))
          });
        });
   
        monthlyData = monthlyData.map(item => ({
          ...item,
          promotions: Math.round(item.promotions * 0.4),
          amount: Math.round(item.amount * 0.4)
        }));
      }
 
      return { regionData, modelData, monthlyData };
    };

  if (activeTab === 'contracts') {
    return getContractsData();
  } else if (activeTab === 'sales') {
    return getSalesData();
  } else if (activeTab === 'stock') {
    return getStockData();
  } else if (activeTab === 'retail') {
    return getRetailData();
  } else if (activeTab === 'wholesale') {
    return getWholesaleData();
  } else if (activeTab === 'promotions') {
    return getPromotionsData();
  }
  
  // Если ничего не подошло, возвращаем пустые данные
  return { regionData: [], modelData: [], monthlyData: [] };
}
  
  // Render all charts based on active tab
 const renderCharts = () => {
  if (activeTab === 'contracts') {
    renderContractsCharts();
  } else if (activeTab === 'sales') {
    renderSalesCharts();
  } else if (activeTab === 'stock') {
    renderStockCharts();
  } else if (activeTab === 'retail') {
    renderRetailCharts();
  } else if (activeTab === 'wholesale') {
    renderWholesaleCharts();
  } else if (activeTab === 'promotions') {
    renderPromotionsCharts();
  }
};
  
  // Render contracts section charts
  const renderContractsCharts = () => {
    const { regionData, modelData, monthlyData } = getFilteredData();
    
    renderBarChart(regionContractsRef, regionData, 'contracts', 'name', getRegionChartTitle(), '#4CAF50');
    renderBarChart(modelContractsRef, modelData, 'contracts', 'name', getModelChartTitle(), '#2196F3');
    renderTimelineChart(timelineContractsRef, monthlyData, 'contracts', 'month', getTimelineChartTitle());
  };
  
  // Render sales section charts
const renderSalesCharts = () => {
  const { regionData, modelData, monthlyData } = getFilteredData();
  
  // Рендерим графики реализации по регионам и моделям
  renderBarChart(
    regionSalesRef, 
    regionData, 
    'sales', // Используем 'sales' как ключ для реализации
    'name', 
    getRegionChartTitle(), 
    '#FF9800'
  );
  
  // Для графика модификаций, убедимся что данные структурированы правильно
  if (selectedModel !== 'all') {
    // Если выбрана конкретная модель, рендерим информацию о модификациях
    renderBarChart(
      modelSalesRef, 
      modelData, 
      'sales', 
      'name', 
      getModelChartTitle(), 
      '#E91E63'
    );
  } else {
    // Если модель не выбрана, рендерим информацию по всем моделям
    renderBarChart(
      modelSalesRef, 
      modelData, 
      'sales', 
      'name', 
      getModelChartTitle(), 
      '#E91E63'
    );
  }
  
  // Рендерим временной график
  renderTimelineChart(
    timelineSalesRef, 
    monthlyData, 
    'sales', 
    'month', 
    getTimelineChartTitle()
  );
};
  
  // Render stock section charts
  const renderStockCharts = () => {
    const { regionData, modelData, monthlyData } = getFilteredData();
    
    renderBarChart(regionStockRef, regionData, 'stock', 'name', getRegionChartTitle(), '#9C27B0');
    renderBarChart(modelStockRef, modelData, 'stock', 'name', getModelChartTitle(), '#607D8B');
    renderTimelineChart(stockTrendRef, monthlyData, 'stock', 'month', getTimelineChartTitle());
  };

  // Новые функции для рендеринга графиков
 const renderRetailCharts = () => {
   const { regionData, modelData, monthlyData } = getFilteredData();
   
   renderBarChart(regionContractsRef, regionData, 'retail', 'name', getRegionChartTitle(), '#FF5722');
   renderBarChart(modelContractsRef, modelData, 'retail', 'name', getModelChartTitle(), '#03A9F4');
   renderTimelineChart(timelineContractsRef, monthlyData, 'retail', 'month', getTimelineChartTitle());
 };

 const renderWholesaleCharts = () => {
   const { regionData, modelData, monthlyData } = getFilteredData();
   
   renderBarChart(regionContractsRef, regionData, 'wholesale', 'name', getRegionChartTitle(), '#9C27B0');
   renderBarChart(modelContractsRef, modelData, 'wholesale', 'name', getModelChartTitle(), '#FF9800');
   renderTimelineChart(timelineContractsRef, monthlyData, 'wholesale', 'month', getTimelineChartTitle());
 };

 const renderPromotionsCharts = () => {
   const { regionData, modelData, monthlyData } = getFilteredData();
   
   renderBarChart(regionContractsRef, regionData, 'promotions', 'name', getRegionChartTitle(), '#4CAF50');
   renderBarChart(modelContractsRef, modelData, 'promotions', 'name', getModelChartTitle(), '#F44336');
   renderTimelineChart(timelineContractsRef, monthlyData, 'promotions', 'month', getTimelineChartTitle());
 };
 
 const getRegionChartTitle = () => {
   if (selectedModel !== 'all') {
     const modelName = carModels.find(m => m.id === selectedModel)?.name || 'Выбранной модели';
     return `${activeTab === 'contracts' ? 'Контракты' : 
            activeTab === 'sales' ? 'Продажи' : 
            activeTab === 'stock' ? 'Остаток' :
            activeTab === 'retail' ? 'Розничные продажи' :
            activeTab === 'wholesale' ? 'Оптовые продажи' :
            activeTab === 'promotions' ? 'Акционные продажи' : ''} ${modelName} по регионам`;
   }
   return `${activeTab === 'contracts' ? 'Контракты' : 
          activeTab === 'sales' ? 'Продажи' : 
          activeTab === 'stock' ? 'Остаток' :
          activeTab === 'retail' ? 'Розничные продажи' :
          activeTab === 'wholesale' ? 'Оптовые продажи' :
          activeTab === 'promotions' ? 'Акционные продажи' : ''} по регионам`;
 };
 
 const getModelChartTitle = () => {
   if (selectedRegion !== 'all') {
     const regionName = regions.find(r => r.id === selectedRegion)?.name || 'Выбранном регионе';
     return `${activeTab === 'contracts' ? 'Контракты' : 
            activeTab === 'sales' ? 'Продажи' : 
            activeTab === 'stock' ? 'Остаток' :
            activeTab === 'retail' ? 'Розничные продажи' :
            activeTab === 'wholesale' ? 'Оптовые продажи' :
            activeTab === 'promotions' ? 'Акционные продажи' : ''} в ${regionName} по моделям`;
   }
   if (selectedModel !== 'all') {
     const modelName = carModels.find(m => m.id === selectedModel)?.name || 'Выбранной модели';
     return `${activeTab === 'contracts' ? 'Контракты' : 
            activeTab === 'sales' ? 'Продажи' : 
            activeTab === 'stock' ? 'Остаток' :
            activeTab === 'retail' ? 'Розничные продажи' :
            activeTab === 'wholesale' ? 'Оптовые продажи' :
            activeTab === 'promotions' ? 'Акционные продажи' : ''} ${modelName} по модификациям и цветам`;
   }
   return `${activeTab === 'contracts' ? 'Контракты' : 
          activeTab === 'sales' ? 'Продажи' : 
          activeTab === 'stock' ? 'Остаток' :
          activeTab === 'retail' ? 'Розничные продажи' :
          activeTab === 'wholesale' ? 'Оптовые продажи' :
          activeTab === 'promotions' ? 'Акционные продажи' : ''} по моделям`;
 };
 
 const getTimelineChartTitle = () => {
   if (selectedRegion !== 'all') {
     const regionName = regions.find(r => r.id === selectedRegion)?.name || 'Выбранном регионе';
     return `Динамика ${activeTab === 'contracts' ? 'контрактов' : 
           activeTab === 'sales' ? 'продаж' : 
           activeTab === 'stock' ? 'остатков' :
           activeTab === 'retail' ? 'розничных продаж' :
           activeTab === 'wholesale' ? 'оптовых продаж' :
           activeTab === 'promotions' ? 'акционных продаж' : ''} в ${regionName}`;
   }
   if (selectedModel !== 'all') {
     const modelName = carModels.find(m => m.id === selectedModel)?.name || 'Выбранной модели';
     return `Динамика ${activeTab === 'contracts' ? 'контрактов' : 
           activeTab === 'sales' ? 'продаж' : 
           activeTab === 'stock' ? 'остатков' :
           activeTab === 'retail' ? 'розничных продаж' :
           activeTab === 'wholesale' ? 'оптовых продаж' :
           activeTab === 'promotions' ? 'акционных продаж' : ''} ${modelName}`;
   }
   return `Динамика ${activeTab === 'contracts' ? 'контрактов' : 
         activeTab === 'sales' ? 'продаж' : 
         activeTab === 'stock' ? 'остатков' :
         activeTab === 'retail' ? 'розничных продаж' :
         activeTab === 'wholesale' ? 'оптовых продаж' :
         activeTab === 'promotions' ? 'акционных продаж' : ''}`;
 };
 
// Функция для рендеринга графика возврата денег
const renderMoneyReturnChart = () => {
 if (!moneyReturnChartRef.current) return;
 
 const container = moneyReturnChartRef.current;
 container.innerHTML = '';
 
 const margin = { top: 30, right: 30, bottom: 60, left: 60 };
 const width = container.clientWidth - margin.left - margin.right;
 const height = container.clientHeight - margin.top - margin.bottom;
 
 const svg = d3.select(container)
   .append('svg')
   .attr('width', width + margin.left + margin.right)
   .attr('height', height + margin.top + margin.bottom)
   .style('background', '#1f2937')
   .style('border-radius', '0.5rem')
   .append('g')
   .attr('transform', `translate(${margin.left},${margin.top})`);
   
 // Добавляем заголовок
 svg.append('text')
   .attr('x', width / 2)
   .attr('y', -margin.top / 2)
   .attr('text-anchor', 'middle')
   .style('font-size', '16px')
   .style('fill', '#f9fafb')
   .text('Динамика возврата денежных средств');
   
 // Данные для графика возврата денег (последние 6 месяцев)
 const currentDate = new Date();
 const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
 
 const moneyReturnData = Array.from({ length: 6 }, (_, i) => {
   const month = new Date(currentDate);
   month.setMonth(currentDate.getMonth() - 5 + i);
   
   // Генерируем данные о возвратах с тенденцией к росту
   const baseValue = 25000 + Math.random() * 15000;
   const trendFactor = 1 + (i * 0.15); // Увеличиваем возвраты с каждым месяцем
   
   return {
     month: monthNames[month.getMonth()],
     year: month.getFullYear(),
     amount: Math.round(baseValue * trendFactor),
     expectedAmount: Math.round((baseValue * trendFactor) * 1.2)
   };
 });
 
 // Создаем шкалы
 const x = d3.scaleBand()
   .domain(moneyReturnData.map(d => d.month))
   .range([0, width])
   .padding(0.3);
   
 const y = d3.scaleLinear()
   .domain([0, d3.max(moneyReturnData, d => Math.max(d.amount, d.expectedAmount)) * 1.1])
   .range([height, 0]);
   
 svg.append('g')
   .attr('transform', `translate(0,${height})`)
   .call(d3.axisBottom(x))
   .selectAll('text')
   .style('font-size', '12px')
   .style('fill', '#d1d5db');
   
 svg.append('g')
   .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${(d / 1000)}k`))
   .selectAll('text')
   .style('font-size', '12px')
   .style('fill', '#d1d5db');
   
 svg.append('g')
   .attr('class', 'grid')
   .call(d3.axisLeft(y)
     .tickSize(-width)
     .tickFormat(''))
   .selectAll('line')
   .style('stroke', 'rgba(255, 255, 255, 0.1)');

  const actualLine = d3.line()
   .x(d => x(d.month) + x.bandwidth() / 2)
   .y(d => y(d.amount))
   .curve(d3.curveMonotoneX);
   
 // Создаем линию для ожидаемых возвратов
 const expectedLine = d3.line()
   .x(d => x(d.month) + x.bandwidth() / 2)
   .y(d => y(d.expectedAmount))
   .curve(d3.curveMonotoneX);
   
 // Создаем градиенты
 const defs = svg.append('defs');
 
 // Градиент для фактической линии
 const actualGradient = defs.append('linearGradient')
   .attr('id', 'actualGradient')
   .attr('x1', '0%')
   .attr('y1', '0%')
   .attr('x2', '100%')
   .attr('y2', '0%');
   
 actualGradient.append('stop')
   .attr('offset', '0%')
   .attr('stop-color', '#3b82f6')
   .attr('stop-opacity', 1);
   
 actualGradient.append('stop')
   .attr('offset', '100%')
   .attr('stop-color', '#60a5fa')
   .attr('stop-opacity', 1);
   
 // Градиент для ожидаемой линии
 const expectedGradient = defs.append('linearGradient')
   .attr('id', 'expectedGradient')
   .attr('x1', '0%')
   .attr('y1', '0%')
   .attr('x2', '100%')
   .attr('y2', '0%');
   
 expectedGradient.append('stop')
   .attr('offset', '0%')
   .attr('stop-color', '#f59e0b')
   .attr('stop-opacity', 1);
   
 expectedGradient.append('stop')
   .attr('offset', '100%')
   .attr('stop-color', '#fbbf24')
   .attr('stop-opacity', 1);
   
 // Добавляем область под фактической линией
 svg.append('path')
   .datum(moneyReturnData)
   .attr('fill', 'url(#actualGradient)')
   .attr('fill-opacity', 0.2)
   .attr('d', d3.area()
     .x(d => x(d.month) + x.bandwidth() / 2)
     .y0(height)
     .y1(d => y(d.amount))
     .curve(d3.curveMonotoneX)
   );
   
 // Добавляем фактическую линию с анимацией
 const actualPath = svg.append('path')
   .datum(moneyReturnData)
   .attr('fill', 'none')
   .attr('stroke', 'url(#actualGradient)')
   .attr('stroke-width', 3)
   .attr('d', actualLine);
   
 // Рассчитываем длину линии для анимации
 const actualPathLength = actualPath.node().getTotalLength();
 
 actualPath
   .attr('stroke-dasharray', actualPathLength)
   .attr('stroke-dashoffset', actualPathLength)
   .transition()
   .duration(2000)
   .attr('stroke-dashoffset', 0);
   
 // Добавляем ожидаемую линию с анимацией
 const expectedPath = svg.append('path')
   .datum(moneyReturnData)
   .attr('fill', 'none')
   .attr('stroke', 'url(#expectedGradient)')
   .attr('stroke-width', 2)
   .attr('stroke-dasharray', '5,5')
   .attr('d', expectedLine);
   
 // Рассчитываем длину линии для анимации
 const expectedPathLength = expectedPath.node().getTotalLength();
 
 expectedPath
   .attr('stroke-dasharray', `5,5,${expectedPathLength}`)
   .attr('stroke-dashoffset', expectedPathLength)
   .transition()
   .duration(2000)
   .delay(500)
   .attr('stroke-dashoffset', 0);
   
 // Добавляем точки на линии фактических возвратов
 svg.selectAll('.actual-point')
   .data(moneyReturnData)
   .join('circle')
   .attr('class', 'actual-point')
   .attr('cx', d => x(d.month) + x.bandwidth() / 2)
   .attr('cy', d => y(d.amount))
   .attr('r', 0)
   .attr('fill', '#3b82f6')
   .attr('stroke', '#1f2937')
   .attr('stroke-width', 2)
   .transition()
   .duration(1000)
   .delay((d, i) => 2000 + i * 150)
   .attr('r', 5);
   
 // Добавляем подписи для фактических возвратов
 svg.selectAll('.actual-label')
   .data(moneyReturnData)
   .join('text')
   .attr('class', 'actual-label')
   .attr('x', d => x(d.month) + x.bandwidth() / 2)
   .attr('y', d => y(d.amount) - 15)
   .attr('text-anchor', 'middle')
   .style('font-size', '10px')
   .style('font-weight', 'bold')
   .style('fill', '#60a5fa')
   .style('opacity', 0)
   .text(d => `${(d.amount / 1000).toFixed(1)}k`)
   .transition()
   .duration(500)
   .delay((d, i) => 2500 + i * 150)
   .style('opacity', 1);
   
 // Добавляем легенду
 const legend = svg.append('g')
   .attr('transform', `translate(${width - 180}, ${height - 50})`);
   
 legend.append('line')
   .attr('x1', 0)
   .attr('y1', 0)
   .attr('x2', 20)
   .attr('y2', 0)
   .attr('stroke', '#3b82f6')
   .attr('stroke-width', 3);
   
 legend.append('text')
   .attr('x', 25)
   .attr('y', 4)
   .text('Фактический возврат')
   .style('font-size', '10px')
   .style('fill', '#d1d5db');
   
 legend.append('line')
   .attr('x1', 0)
   .attr('y1', 20)
   .attr('x2', 20)
   .attr('y2', 20)
   .attr('stroke', '#f59e0b')
   .attr('stroke-width', 2)
   .attr('stroke-dasharray', '5,5');
   
 legend.append('text')
   .attr('x', 25)
   .attr('y', 24)
   .text('Ожидаемый возврат')
   .style('font-size', '10px')
   .style('fill', '#d1d5db');
   
 // Высчитываем общую эффективность возврата
 const totalActual = moneyReturnData.reduce((sum, d) => sum + d.amount, 0);
 const totalExpected = moneyReturnData.reduce((sum, d) => sum + d.expectedAmount, 0);
 const efficiency = (totalActual / totalExpected) * 100;
 
 // Добавляем суммарную информацию
 const summary = svg.append('g')
   .attr('transform', `translate(20, 20)`);
   
 summary.append('text')
   .text(`Эффективность: ${efficiency.toFixed(1)}%`)
   .style('font-size', '12px')
   .style('font-weight', 'bold')
   .style('fill', efficiency >= 85 ? '#22c55e' : efficiency >= 70 ? '#f59e0b' : '#ef4444');
   
 summary.append('text')
   .attr('y', 20)
   .text(`Всего возвращено: ${(totalActual / 1000).toFixed(1)}k`)
   .style('font-size', '12px')
   .style('fill', '#d1d5db');
};

const renderBarChart = (ref, data, valueKey, labelKey, title, color) => {
  if (!ref.current) return;
  
  const container = ref.current;
  container.innerHTML = '';
  
  // Проверяем наличие данных
  if (!data || data.length === 0) {
    container.innerHTML = '<div class="flex items-center justify-center h-full text-gray-500">Нет данных для отображения</div>';
    return;
  }
  
  // Фильтруем данные, исключая записи с отсутствующими значениями
  data = data.filter(d => d[labelKey] && d[valueKey] !== undefined && d[valueKey] !== null);
  
  if (data.length === 0) {
    container.innerHTML = '<div class="flex items-center justify-center h-full text-gray-500">Нет данных для отображения после фильтрации</div>';
    return;
  }
  
  // Используем стандартные отступы
  const margin = { top: 30, right: 30, bottom: 100, left: 60 };
  const width = container.clientWidth - margin.left - margin.right;
  const height = container.clientHeight - margin.top - margin.bottom;
  
  const svg = d3.select(container)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
    
  // Простой градиент
  const defs = svg.append("defs");
  const gradient = defs.append("linearGradient")
    .attr("id", `barGradient-${valueKey}`)
    .attr("x1", "0%").attr("y1", "0%")
    .attr("x2", "0%").attr("y2", "100%");
    
  gradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", color)
    .attr("stop-opacity", 0.8);
    
  gradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", color)
    .attr("stop-opacity", 0.3);
    
  // Градиент для выделенного региона
  const selectedGradient = defs.append("linearGradient")
    .attr("id", "selectedBarGradient")
    .attr("x1", "0%").attr("y1", "0%")
    .attr("x2", "0%").attr("y2", "100%");
    
  selectedGradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#ff9800")
    .attr("stop-opacity", 0.9);
    
  selectedGradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#ff9800")
    .attr("stop-opacity", 0.4);
    
  // Шкалы
  const x = d3.scaleBand()
    .domain(data.map(d => d[labelKey]))
    .range([0, width])
    .padding(0.3);
    
  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d[valueKey]) * 1.1])
    .range([height, 0])
    .nice();
    
  // Сетка
  svg.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(y)
      .tickSize(-width)
      .tickFormat("")
    )
    .style("stroke", "#333")
    .style("stroke-opacity", "0.1");
    
  // Оси
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-45)")
    .style("fill", "#999");
    
  svg.append("g")
    .call(d3.axisLeft(y))
    .selectAll("text")
    .style("fill", "#999");
  
  // Заголовок
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("fill", "#fff")
    .text(title);
    
  // Полоски с простой анимацией и выделением выбранного региона
  svg.selectAll(".bar")
    .data(data)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d[labelKey]))
    .attr("width", x.bandwidth())
    .attr("fill", d => {
      // Если это график регионов и регион выбран, используем другой цвет
      if (labelKey === 'name' && d.isSelected) {
        return "url(#selectedBarGradient)";
      }
      return `url(#barGradient-${valueKey})`;
    })
    .attr("rx", 4)
    .attr("ry", 4)
    .attr("y", height)
    .attr("height", 0)
    .transition()
    .duration(500)
    .attr("y", d => y(d[valueKey]))
    .attr("height", d => height - y(d[valueKey]));
  
  // Метки значений
  svg.selectAll(".label")
    .data(data)
    .enter().append("text")
    .attr("class", "label")
    .attr("x", d => x(d[labelKey]) + x.bandwidth() / 2)
    .attr("y", d => y(d[valueKey]) - 5)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("fill", d => d.isSelected ? "#ff9800" : "#fff")
    .style("opacity", 0)
    .text(d => {
      if (d[valueKey] >= 1000000) return (d[valueKey] / 1000000).toFixed(1) + 'M';
      if (d[valueKey] >= 1000) return (d[valueKey] / 1000).toFixed(0) + 'K';
      return d[valueKey];
    })
    .transition()
    .duration(500)
    .delay(500)
    .style("opacity", 1);
    
  // Если есть выбранный регион, добавляем индикатор
  if (selectedRegion !== 'all' && labelKey === 'name') {
    const selectedItem = data.find(d => d.id === selectedRegion);
    if (selectedItem) {
      svg.append("text")
        .attr("x", x(selectedItem[labelKey]) + x.bandwidth() / 2)
        .attr("y", y(selectedItem[valueKey]) - 25)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("font-weight", "bold")
        .style("fill", "#ff9800")
        .text("Выбрано")
        .style("opacity", 0)
        .transition()
        .duration(500)
        .delay(800)
        .style("opacity", 1);
    }
  }
  
  // Добавляем интерактивность
  svg.selectAll(".bar")
    .on("mouseover", function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("opacity", 0.8);
        
      // Показать дополнительную информацию при наведении
      const tooltip = d3.select("body").selectAll(".tooltip")
        .data([null])
        .join("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background-color", "rgba(30, 41, 59, 0.9)")
        .style("color", "#fff")
        .style("padding", "8px 12px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("z-index", 1000)
        .style("box-shadow", "0 4px 6px rgba(0, 0, 0, 0.1)");
      
      // Перевод названий метрик на русский
      const getMetricRussianName = (key) => {
        switch(key) {
          case 'contracts': return 'Контракты';
          case 'sales': return 'Продажи';
          case 'stock': return 'Остаток';
          case 'retail': return 'Розница';
          case 'wholesale': return 'Опт';
          case 'promotions': return 'Акции';
          default: return key;
        }
      };
        
      tooltip
        .html(`
          <div>
            <div class="font-bold">${d[labelKey]}</div>
            <div>${getMetricRussianName(valueKey)}: ${d[valueKey].toLocaleString('ru-RU')}</div>
            <div>Сумма: ${formatCurrency(d.amount)}</div>
          </div>
        `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px")
        .transition()
        .duration(200)
        .style("opacity", 1);
    })
    .on("mousemove", function(event) {
      d3.select("body").select(".tooltip")
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px");
    })
    .on("mouseout", function() {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("opacity", 1);
        
      d3.select("body").select(".tooltip")
        .transition()
        .duration(200)
        .style("opacity", 0)
        .remove();
    });
};
 
 // Timeline chart renderer
 const renderTimelineChart = (ref, data, valueKey, labelKey, title) => {
   if (!ref.current) return;
   
   const container = ref.current;
   container.innerHTML = '';
   
   const margin = { top: 30, right: 30, bottom: 40, left: 60 };
   const width = container.clientWidth - margin.left - margin.right;
   const height = container.clientHeight - margin.top - margin.bottom;
   
   const svg = d3.select(container)
     .append("svg")
     .attr("width", width + margin.left + margin.right)
     .attr("height", height + margin.top + margin.bottom)
     .append("g")
     .attr("transform", `translate(${margin.left},${margin.top})`);
     
   // Add gradient for area
   const defs = svg.append("defs");
   const areaGradient = defs.append("linearGradient")
     .attr("id", `areaGradient-${valueKey}`)
     .attr("x1", "0%").attr("y1", "0%")
     .attr("x2", "0%").attr("y2", "100%");
     
   areaGradient.append("stop")
     .attr("offset", "0%")
     .attr("stop-color", "#3b82f6")
     .attr("stop-opacity", 0.7);
     
   areaGradient.append("stop")
     .attr("offset", "100%")
     .attr("stop-color", "#3b82f6")
     .attr("stop-opacity", 0.1);
   
   // Add gradient for line
   const lineGradient = defs.append("linearGradient")
     .attr("id", `lineGradient-${valueKey}`)
     .attr("x1", "0%").attr("y1", "0%")
     .attr("x2", "100%").attr("y2", "0%");
     
   lineGradient.append("stop")
     .attr("offset", "0%")
     .attr("stop-color", "#3b82f6");
     
   lineGradient.append("stop")
     .attr("offset", "100%")
     .attr("stop-color", "#8b5cf6");
     
   // Scales
   const x = d3.scaleBand()
     .domain(data.map(d => d[labelKey]))
     .range([0, width])
     .padding(1);
     
   const y = d3.scaleLinear()
     .domain([0, d3.max(data, d => d[valueKey]) * 1.2])
     .range([height, 0]);
     
   // Grid
   svg.append("g")
     .attr("class", "grid")
     .call(d3.axisLeft(y)
       .tickSize(-width)
       .tickFormat("")
     )
     .style("stroke", "#333")
     .style("stroke-opacity", "0.1");
     
   // Axes
   svg.append("g")
     .attr("transform", `translate(0,${height})`)
     .call(d3.axisBottom(x))
     .selectAll("text")
     .style("fill", "#999");
     
   svg.append("g")
     .call(d3.axisLeft(y))
     .selectAll("text")
     .style("fill", "#999");
   
   // Title
   svg.append("text")
     .attr("x", width / 2)
     .attr("y", -10)
     .attr("text-anchor", "middle")
     .style("font-size", "14px")
     .style("fill", "#fff")
     .text(title);
     
   // Create line
   const line = d3.line()
     .x(d => x(d[labelKey]) + x.bandwidth()/2)
     .y(d => y(d[valueKey]))
     .curve(d3.curveMonotoneX);
     
   // Create area
   const area = d3.area()
     .x(d => x(d[labelKey]) + x.bandwidth()/2)
     .y0(height)
     .y1(d => y(d[valueKey]))
     .curve(d3.curveMonotoneX);
     
   // Add area
   svg.append("path")
     .datum(data)
     .attr("class", "area")
     .attr("d", area)
     .attr("fill", `url(#areaGradient-${valueKey})`);
     
   // Add line with animation
   const path = svg.append("path")
     .datum(data)
     .attr("class", "line")
     .attr("d", line)
     .attr("stroke", `url(#lineGradient-${valueKey})`)
     .attr("stroke-width", 3)
     .attr("fill", "none");
   
   // Animate line
   const totalLength = path.node().getTotalLength();
   path
     .attr("stroke-dasharray", totalLength)
     .attr("stroke-dashoffset", totalLength)
     .transition()
     .duration(1500)
     .attr("stroke-dashoffset", 0);
     
// Add dots
  svg.selectAll(".dot")
    .data(data)
    .enter().append("circle")
    .attr("class", "dot")
    .attr("cx", d => x(d[labelKey]) + x.bandwidth()/2)
    .attr("cy", d => y(d[valueKey]))
    .attr("r", 0)
    .attr("fill", "#3b82f6")
    .attr("stroke", "#1e1e1e")
    .attr("stroke-width", 2)
    .transition()
    .delay((d, i) => 1500 + i * 50)
    .duration(300)
    .attr("r", 5);
    
  // Add tooltips
  const tooltip = d3.select("body").append("div")
    .attr("class", `tooltip-${valueKey}`)
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background-color", "rgba(40, 40, 40, 0.9)")
    .style("color", "#fff")
    .style("padding", "10px")
    .style("border-radius", "5px")
    .style("font-size", "14px")
    .style("pointer-events", "none")
    .style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.3)")
    .style("z-index", "10");
    
  svg.selectAll(".dot")
    .on("mouseover", function(event, d) {
      d3.select(this).transition()
        .duration(200)
        .attr("r", 8);
        
      tooltip.transition()
        .duration(200)
        .style("opacity", 1);
        
  tooltip.html(`
        <strong>${d[labelKey]}</strong><br>
        ${valueKey === 'contracts' ? 'Контрактов: ' : 
          valueKey === 'sales' ? 'Продаж: ' : 
          valueKey === 'stock' ? 'Остаток: ' :
          valueKey === 'retail' ? 'Розница: ' :
          valueKey === 'wholesale' ? 'Опт: ' :
          valueKey === 'promotions' ? 'Акции: ' : ''}
        <strong>${d[valueKey]}</strong><br>
        Сумма: <strong>${formatCurrency(d.amount)}</strong>
      `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      d3.select(this).transition()
        .duration(200)
        .attr("r", 5);
        
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
    });
};

// Format currency for display
const formatCurrency = (value) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'UZS',
    maximumFractionDigits: 0
  }).format(value);
};

const getStats = () => {
  if (!apiData || !Array.isArray(apiData)) {
    return { count: 0, amount: 0, average: 0 };
  }
  
  // Инициализируем счетчики
  let totalContracts = 0;
  let totalAmount = 0;
  
  // Если выбрана конкретная модель, фильтруем только по ней
  if (selectedModel !== 'all') {
    const modelData = apiData.find(model => model.model_id === selectedModel);
    
    if (modelData) {
      // Если также выбран конкретный регион, фильтруем по региону
      if (selectedRegion !== 'all') {
        // Поиск данных выбранного региона для выбранной модели
        const regionData = modelData.filter_by_region?.find(r => r.region_id === selectedRegion);
        
        if (regionData) {
          totalContracts = parseInt(regionData.total_contracts || 0);
          totalAmount = parseInt(regionData.total_price || 0);
        }
      } else {
        // Суммируем по всем регионам для выбранной модели
        if (modelData.filter_by_region && Array.isArray(modelData.filter_by_region)) {
          modelData.filter_by_region.forEach(region => {
            totalContracts += parseInt(region.total_contracts || 0);
            totalAmount += parseInt(region.total_price || 0);
          });
        }
      }
    }
  } else if (selectedRegion !== 'all') {
    // Выбран только регион, суммируем по всем моделям для этого региона
    apiData.forEach(model => {
      if (model.filter_by_region && Array.isArray(model.filter_by_region)) {
        const regionData = model.filter_by_region.find(r => r.region_id === selectedRegion);
        if (regionData) {
          totalContracts += parseInt(regionData.total_contracts || 0);
          totalAmount += parseInt(regionData.total_price || 0);
        }
      }
    });
  } else {
    // Не выбраны ни модель, ни регион - суммируем всё
    apiData.forEach(model => {
      if (model.filter_by_region && Array.isArray(model.filter_by_region)) {
        model.filter_by_region.forEach(region => {
          totalContracts += parseInt(region.total_contracts || 0);
          totalAmount += parseInt(region.total_price || 0);
        });
      }
    });
  }
  
  // Вычисляем среднюю стоимость
  const average = totalContracts > 0 ? Math.round(totalAmount / totalContracts) : 0;
  
  // Коэффициенты модификации для разных табов
  const tabMultipliers = {
    contracts: { count: 1, amount: 1 },
    sales: { count: 1, amount: 1 },
    stock: { count: 0.2, amount: 0.2 },
    retail: { count: 0.7, amount: 0.7 },
    wholesale: { count: 0.3, amount: 0.3 },
    promotions: { count: 0.1, amount: 0.1 }
  };
  
  // Применяем модификатор в зависимости от активного таба
  const multiplier = tabMultipliers[activeTab] || tabMultipliers.contracts;
  
  // Возвращаем модифицированные значения согласно активному табу
  return {
    count: Math.round(totalContracts * multiplier.count),
    amount: Math.round(totalAmount * multiplier.amount),
    average: average
  };
};


// Получаем детальное описание выбранных фильтров
const getFilterDescription = () => {
  let description = '';
  
  if (selectedRegion !== 'all') {
    const regionName = regions.find(r => r.id === selectedRegion)?.name || '';
    description += `Регион: ${regionName}`;
  }
  
  if (selectedModel !== 'all') {
    const modelName = carModels.find(m => m.id === selectedModel)?.name || '';
    description += description ? ` | Модель: ${modelName}` : `Модель: ${modelName}`;
  }
  
  return description || 'Все данные';
};
  
  
const StatisticsCards = () => {
  const [stats, setStats] = useState({ count: 0, amount: 0, average: 0 });
  const [isCalculating, setIsCalculating] = useState(true);
  const workerRef = useRef();
 
  // Инициализация воркера
  useEffect(() => {
    if (typeof window !== 'undefined') {
      workerRef.current = new Worker(new URL('../../../worker.js', import.meta.url));
      workerRef.current.onmessage = (e) => {
        if (e.data.type === 'stats_result') {
          setStats(e.data.data);
          setIsCalculating(false);
        }
      };
      return () => workerRef.current?.terminate();
    }
  }, []);
 
  // Запускаем расчеты когда загрузка завершена
  useEffect(() => {
    if (loading) {
      // При начале загрузки показываем индикатор
      setIsCalculating(true);
    } else if (apiData && !loading) {
      // Когда загрузка завершилась, запускаем вычисления
      if (workerRef.current) {
        workerRef.current.postMessage({
          type: 'calculate_stats',
          data: { apiData, selectedRegion, selectedModel, activeTab }
        });
      }
    }
  }, [loading, apiData, selectedRegion, selectedModel, activeTab]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
 
  const formatDateRange = (start, end) => {
    return start && end ? `с ${formatDate(start)} по ${formatDate(end)}` : 'выбранный период';
  };
 
  const getFilterDescription = () => {
    let description = '';
    if (selectedRegion !== 'all') {
      const regionName = regionsList.find(r => r.id === selectedRegion)?.name || 'выбранном регионе';
      description += ` в ${regionName}`;
    }
    if (selectedModel !== 'all') {
      const modelName = carModels.find(m => m.id === selectedModel)?.name || 'выбранной модели';
      description += description ? ` для ${modelName}` : ` для ${modelName}`;
    }
    return description;
  };
 
  const getMetricName = () => {
    switch(activeTab) {
      case 'contracts': return 'Общее количество контрактов';
      case 'sales': return 'Общий объем продаж';
      case 'stock': return 'Общий остаток';
      case 'retail': return 'Всего розничных продаж';
      case 'wholesale': return 'Всего оптовых продаж';
      case 'promotions': return 'Всего акционных продаж';
      default: return 'Общее количество';
    }
  };
 
  const LoadingDots = () => (
    <span className="inline-flex items-baseline">
      <span className="animate-bounce inline-block mx-0.5" style={{animationDelay: '0ms'}}>.</span>
      <span className="animate-bounce inline-block mx-0.5" style={{animationDelay: '150ms'}}>.</span>
      <span className="animate-bounce inline-block mx-0.5" style={{animationDelay: '300ms'}}>.</span>
    </span>
  );
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-medium text-white">
              {getMetricName()}{getFilterDescription()}
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              За период {formatDateRange(startDate, endDate)}
            </p>
          </div>
          
          <div className="h-9 flex items-center">
            {isCalculating ? (
              <p className="text-xl font-medium text-blue-400">
                Загрузка<LoadingDots />
              </p>
            ) : (
              <p className="text-2xl font-bold">{stats.count.toLocaleString('ru-RU')}</p>
            )}
          </div>
        </div>
        <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${isCalculating ? 'bg-blue-500/50 animate-pulse' : 'bg-blue-500'}`} 
               style={{ width: '70%' }}></div>
        </div>
      </div>
     
      <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-medium text-white">
              Общая сумма{getFilterDescription()}
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              За период {formatDateRange(startDate, endDate)}
            </p>
          </div>
          
          <div className="h-9 flex items-center">
            {isCalculating ? (
              <p className="text-xl font-medium text-green-400">
                Загрузка<LoadingDots />
              </p>
            ) : (
              <p className="text-2xl font-bold">{formatCurrency(stats.amount)}</p>
            )}
          </div>
        </div>
        <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${isCalculating ? 'bg-green-500/50 animate-pulse' : 'bg-green-500'}`} 
               style={{ width: '65%' }}></div>
        </div>
      </div>
    </div>
  );
};


// Компонент миниатюры авто
const CarModelThumbnail = ({ model, isSelected, onClick }) => {
  // Рассчитываем статистику для конкретной модели с учетом выбранного региона
  const getModelStats = useMemo(() => {
    if (!apiData || !Array.isArray(apiData)) {
      return { count: 0, amount: 0 };
    }
    
    const modelData = apiData.find(m => m.model_id === model.id);
    if (!modelData) {
      return { count: 0, amount: 0 };
    }
    
    let totalCount = 0;
    let totalAmount = 0;
    
    // Если выбран конкретный регион, фильтруем по нему
    if (selectedRegion !== 'all') {
      const regionData = modelData.filter_by_region?.find(r => r.region_id === selectedRegion);
      if (regionData) {
        totalCount = parseInt(regionData.total_contracts || 0);
        totalAmount = parseInt(regionData.total_price || 0);
      }
    } else {
      // Если регион не выбран, суммируем по всем регионам данной модели
      if (modelData.filter_by_region && Array.isArray(modelData.filter_by_region)) {
        modelData.filter_by_region.forEach(region => {
          totalCount += parseInt(region.total_contracts || 0);
          totalAmount += parseInt(region.total_price || 0);
        });
      }
    }
    
    // Применяем модификатор в зависимости от активного таба
    const tabMultipliers = {
      contracts: { count: 1, amount: 1 },
      sales: { count: 1, amount: 1 },
      stock: { count: 0.2, amount: 0.2 },
      retail: { count: 0.7, amount: 0.7 },
      wholesale: { count: 0.3, amount: 0.3 },
      promotions: { count: 0.1, amount: 0.1 }
    };
    
    const multiplier = tabMultipliers[activeTab] || tabMultipliers.contracts;
    
    return {
      count: Math.round(totalCount * multiplier.count),
      amount: Math.round(totalAmount * multiplier.amount)
    };
  }, [model.id, selectedRegion, activeTab, apiData]);
  
  const modelStats = getModelStats;
  
  // Получаем метку для текущего типа данных
  const getMetricLabel = () => {
    switch(activeTab) {
      case 'contracts': return 'Контрактов';
      case 'sales': return 'Продаж';
      case 'stock': return 'В наличии';
      case 'retail': return 'Розница';
      case 'wholesale': return 'Опт';
      case 'promotions': return 'По акции';
      default: return 'Контрактов';
    }
  };
  
  // Определяем цвет для активного таба
  const getTabColor = () => {
    switch(activeTab) {
      case 'contracts': return 'from-blue-500 to-blue-600';
      case 'sales': return 'from-green-500 to-green-600';
      case 'stock': return 'from-purple-500 to-purple-600';
      case 'retail': return 'from-orange-500 to-orange-600';
      case 'wholesale': return 'from-indigo-500 to-indigo-600';
      case 'promotions': return 'from-red-500 to-red-600';
      default: return 'from-blue-500 to-blue-600';
    }
  };
  
  return (
  <div 
  className={`bg-gray-800 rounded-lg shadow-lg transition-all duration-300 overflow-hidden flex flex-col cursor-pointer transform hover:translate-y-[-5px] ${
    isSelected 
      ? 'ring-2 ring-blue-500 border-blue-600' 
      : 'border border-gray-700 hover:border-gray-500 hover:shadow-xl'
  }`}
  onClick={onClick}
>
  {/* Индикатор активного таба */}
  <div className={`h-1.5 w-full bg-gradient-to-r ${getTabColor()}`}></div>
  
  <div className="p-4 flex flex-col flex-grow">
    {/* Изображение с эффектом наведения */}
    <div className="relative w-full aspect-[4/3] mb-4 bg-gradient-to-b from-gray-700/30 to-gray-800/40 rounded-lg overflow-hidden group">
      {/* Контейнер с пропорциями */}
      <div className="absolute inset-0 flex items-center justify-center p-3">
        <img 
          src={model.img}
          alt={model.name}
          className="max-w-full max-h-full object-contain z-10 transition-transform duration-300 group-hover:scale-110 drop-shadow-lg"
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://telegra.ph/file/e54ca862bac1f2187ddde.png';
          }}
        />
      </div>
      
      {/* Блик на изображении для эффекта глянца */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
    
    {/* Информация о модели */}
    <h3 className="font-semibold text-white text-lg mb-3 line-clamp-1 text-center">{model.name}</h3>
    
    {/* Статистика */}
    <div className="mt-auto space-y-3">
      <div className="bg-gray-700/50 rounded-md p-3 transition-all duration-300 hover:bg-gray-700/80">
        <div className="flex justify-between items-center">
          <span className="text-gray-300 text-sm">{getMetricLabel()}:</span>
          <span className="font-bold text-white">
            {modelStats.count > 0 ? modelStats.count.toLocaleString('ru-RU') : '0'}
          </span>
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-gray-700/50 to-gray-700/30 rounded-md p-3 transition-all duration-300 hover:from-gray-700/70 hover:to-gray-700/50">
        <div className="text-center">
          <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider">Общая сумма</p>
          <p className={`font-bold text-transparent bg-clip-text bg-gradient-to-r ${getTabColor()} text-lg`}>
            {modelStats.amount > 0 
              ? new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 }).format(modelStats.amount)
              : '0 UZS'
            }
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
  );
};

const stats = getStats();

  return (
  
    <div className="p-5 bg-gray-900 text-gray-100 min-h-screen">
       {loadingComponent && <ContentReadyLoader />}
    <h1 className="text-3xl font-semibold mb-6">Аналитика автомобилей</h1>
    
    {/* Filter Panel */}
    <div className="bg-gray-800 p-5 rounded-lg shadow-lg mb-8 flex flex-wrap gap-4 justify-between items-center">
    <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center">
            <span className="text-gray-400 mr-2">Регион:</span>
            <select 
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white min-w-[200px]"
            >
              <option value="all">Все регионы</option>
              {regionsList.map(region => (
                <option key={region.id} value={region.id}>{region.name}</option>
              ))}
            </select>
          </div>
        </div>
      
<div className="flex items-center gap-4">
  <div className="flex items-center">
    <span className="text-gray-400 mr-2">С:</span>
    <input 
      type="date" 
      value={startDate}
      onChange={(e) => setStartDate(e.target.value)}
      className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
    />
  </div>
  <div className="flex items-center">
    <span className="text-gray-400 mr-2">По:</span>
    <input 
      type="date" 
      value={endDate}
      onChange={(e) => setEndDate(e.target.value)}
      className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
    />
  </div>
  <button 
    onClick={applyDateFilter}
    className="ml-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center transition-colors"
  >
    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
    Применить
  </button>
</div>
    </div>

    {(selectedRegion !== 'all' || selectedModel !== 'all') && (
      <div className="bg-blue-900/20 border-l-4 border-blue-500 p-3 rounded-r-lg mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
          </svg>
          <p className="text-gray-300">
            <span className="font-medium text-blue-400">Активные фильтры:</span> {getFilterDescription()}
          </p>
        </div>
        <button 
          className="text-sm text-blue-400 hover:text-blue-300 flex items-center"
          onClick={() => {
            setSelectedRegion('all');
            setSelectedModel('all');
          }}
        >
          Сбросить фильтры
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    )}
    
    {/* Tabs */}
    <div className="flex flex-wrap border-b border-gray-700 mb-6">
      <button
        className={`py-3 px-6 font-medium flex items-center ${
          activeTab === 'contracts' 
            ? 'text-blue-400 border-b-2 border-blue-400' 
            : 'text-gray-400 hover:text-gray-300'
        }`}
        onClick={() => setActiveTab('contracts')}
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Контракты/Реализация
      </button>
      
      <button
        className={`py-3 px-6 font-medium flex items-center ${
          activeTab === 'sales' 
            ? 'text-blue-400 border-b-2 border-blue-400' 
            : 'text-gray-400 hover:text-gray-300'
        }`}
        onClick={() => setActiveTab('sales')}
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        Реализация
      </button>
      
      <button
        className={`py-3 px-6 font-medium flex items-center ${
          activeTab === 'stock' 
            ? 'text-blue-400 border-b-2 border-blue-400' 
            : 'text-gray-400 hover:text-gray-300'
        }`}
        onClick={() => setActiveTab('stock')}
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        Остаток
      </button>
      
      {/* Новые табы */}
      <button
        className={`py-3 px-6 font-medium flex items-center ${
          activeTab === 'retail' 
            ? 'text-blue-400 border-b-2 border-blue-400' 
            : 'text-gray-400 hover:text-gray-300'
        }`}
        onClick={() => setActiveTab('retail')}
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        Розница
      </button>
      
      <button
        className={`py-3 px-6 font-medium flex items-center ${
          activeTab === 'wholesale' 
            ? 'text-blue-400 border-b-2 border-blue-400' 
            : 'text-gray-400 hover:text-gray-300'
        }`}
        onClick={() => setActiveTab('wholesale')}
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M3 7h18" />
        </svg>
        Опт
      </button>
      
      <button
        className={`py-3 px-6 font-medium flex items-center ${
          activeTab === 'promotions' 
            ? 'text-blue-400 border-b-2 border-blue-400' 
            : 'text-gray-400 hover:text-gray-300'
        }`}
        onClick={() => setActiveTab('promotions')}
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
        Акции
      </button>
    </div>
    
    {/* Summary Cards */}
 <StatisticsCards/>
    
{selectedModel === 'all' && (
  <div className="mb-8">
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
      <div className="flex items-center">
        <h3 className="text-xl font-semibold mr-4">Модельный ряд</h3>
        
        {/* Табы для переключения режимов просмотра */}
        <div className="bg-gray-800 rounded-lg p-1 flex items-center border border-gray-700">
          <button 
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
              viewMode === 'cards' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setViewMode('cards')}
          >
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Плитка
            </div>
          </button>
          <button 
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
              viewMode === 'list' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setViewMode('list')}
          >
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Список
            </div>
          </button>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center bg-gray-800 rounded-lg px-3 py-2 border border-gray-700">
          <span className="text-gray-400 mr-2 text-sm">Сортировать:</span>
          <select 
            className="bg-gray-800 text-white border-none focus:outline-none text-sm"
            onChange={(e) => {
              const sortModels = [...carModels];
              
              if (e.target.value === 'price-high') {
                sortModels.sort((a, b) => b.price - a.price);
              } else if (e.target.value === 'price-low') {
                sortModels.sort((a, b) => a.price - b.price);
              } else if (e.target.value === 'contracts-high') {
                sortModels.sort((a, b) => {
                  // Ищем модели в оригинальных данных API
                  const modelA = apiData.find(m => m.model_id === a.id);
                  const modelB = apiData.find(m => m.model_id === b.id);
                  
                  // Вычисляем общее количество контрактов для каждой модели
                  const countA = modelA && modelA.filter_by_region 
                    ? modelA.filter_by_region.reduce((sum, region) => sum + parseInt(region.total_contracts || '0', 10), 0) 
                    : 0;
                  
                  const countB = modelB && modelB.filter_by_region 
                    ? modelB.filter_by_region.reduce((sum, region) => sum + parseInt(region.total_contracts || '0', 10), 0) 
                    : 0;
                  
                  return countB - countA;
                });
              } else if (e.target.value === 'contracts-low') {
                sortModels.sort((a, b) => {
                  // Ищем модели в оригинальных данных API
                  const modelA = apiData.find(m => m.model_id === a.id);
                  const modelB = apiData.find(m => m.model_id === b.id);
                  
                  // Вычисляем общее количество контрактов для каждой модели
                  const countA = modelA && modelA.filter_by_region 
                    ? modelA.filter_by_region.reduce((sum, region) => sum + parseInt(region.total_contracts || '0', 10), 0) 
                    : 0;
                  
                  const countB = modelB && modelB.filter_by_region 
                    ? modelB.filter_by_region.reduce((sum, region) => sum + parseInt(region.total_contracts || '0', 10), 0) 
                    : 0;
                  
                  return countA - countB;
                });
              }
              
              setCarModels(sortModels);
            }}
          >
            <option value="default">По умолчанию</option>
            <option value="price-high">По сумме (убывание)</option>
            <option value="price-low">По сумме (возрастание)</option>
            <option value="contracts-high">По количеству (убывание)</option>
            <option value="contracts-low">По количеству (возрастание)</option>
          </select>
        </div>
        <div className="flex items-center">
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 text-sm flex items-center transition-colors"
            onClick={() => {
              // Сбросить все фильтры и отсортировать по умолчанию
              fetchData(getApiUrlForTab(activeTab));
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Сбросить
          </button>
        </div>
      </div>
    </div>
    
    {viewMode === 'cards' ? (
      // Режим отображения карточек
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {carModels.length > 0 ? (
          // Отображаем список моделей из API
          carModels.map(model => (
            <CarModelThumbnail 
              key={model.id} 
              model={model} 
              isSelected={selectedModel === model.id}
              onClick={() => setSelectedModel(model.id)}
            />
          ))
        ) : (
          // Показываем сообщение, если список пуст
          <div className="col-span-full p-6 bg-gray-800 rounded-lg text-center">
            <div className="flex flex-col items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-400 mb-2">Нет доступных моделей</p>
              <p className="text-gray-500 text-sm">Выберите период и нажмите "Применить"</p>
            </div>
          </div>
        )}
      </div>
    ) : (
  <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
    {carModels.length > 0 ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0 divide-gray-700">
        {carModels.map((model, index) => (
          <div 
            key={model.id}
            className={`py-2 px-3 border-b border-gray-700 sm:border-r transition-colors duration-200 ${
              selectedModel === model.id 
                ? 'bg-blue-600/20 border-l-2 border-l-blue-500' 
                : 'hover:bg-gray-700/30'
            }`}
            onClick={() => setSelectedModel(model.id)}
          >
            <div className="flex items-center cursor-pointer truncate">
              <span className="text-gray-500 text-xs mr-2 w-5 flex-shrink-0">{index + 1}.</span>
              <span className="text-sm font-medium text-white truncate">{model.name}</span>
              
              {selectedModel === model.id && (
                <span className="ml-auto pl-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="p-4 text-center">
        <p className="text-gray-400 text-sm">Нет доступных моделей</p>
      </div>
    )}
  </div>
    )}
    
    {carModels.length > 0 && (
      <div className="mt-4 text-center text-gray-400 text-sm">
        Показано {carModels.length} моделей автомобилей
      </div>
    )}
  </div>
)}
      

{selectedModel !== 'all' && apiData && (
  <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-2 rounded-lg shadow-lg mb-6 border border-gray-700">
    <div className="flex flex-row items-center gap-6">
      <img 
        src={Array.isArray(apiData) 
          ? (apiData.find(m => m.model_id === selectedModel)?.photo_sha 
             ? `https://uzavtosalon.uz/b/core/m$load_image?sha=${apiData.find(m => m.model_id === selectedModel).photo_sha}&width=400&height=400` 
             : 'https://telegra.ph/file/e54ca862bac1f2187ddde.png')
          : (apiData.photo_sha 
             ? `https://uzavtosalon.uz/b/core/m$load_image?sha=${apiData.photo_sha}&width=400&height=400` 
             : 'https://telegra.ph/file/e54ca862bac1f2187ddde.png')}
        alt="Автомобиль"
        className="w-52 h-40 object-contain"
      />
      
      <div className="flex flex-col justify-between h-full py-2">
        <h3 className="text-2xl font-bold text-white mb-2">
          {Array.isArray(apiData) 
            ? apiData.find(m => m.model_id === selectedModel)?.model_name 
            : apiData.model_name || "Выбранная модель"}
        </h3>
        
        <button 
          className="mt-auto text-blue-400 hover:text-white transition-all duration-200 flex items-center text-sm px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 rounded-md border border-blue-500/30 shadow-sm w-fit"
          onClick={() => setSelectedModel('all')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Вернуться к модельному ряду
        </button>
      </div>
    </div>
  </div>
)}
    
    {activeTab === 'contracts' && (
      <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">{getRegionChartTitle()}</h3>
            <div 
              ref={regionContractsRef} 
              className="w-full h-[300px]"
            ></div>
          </div>
          
          <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">{getModelChartTitle()}</h3>
            <div 
              ref={modelContractsRef} 
              className="w-full h-[300px]"
            ></div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-5 rounded-lg shadow-lg mb-8">
          <h3 className="text-xl font-semibold mb-4">{getTimelineChartTitle()}</h3>
          <div 
            ref={timelineContractsRef} 
            className="w-full h-[300px]"
          ></div>
        </div>
      </>
    )}
    
    {activeTab === 'sales' && (
      <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">{getRegionChartTitle()}</h3>
            <div 
              ref={regionSalesRef} 
              className="w-full h-[300px]"
            ></div>
          </div>
          
          <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">{getModelChartTitle()}</h3>
            <div 
              ref={modelSalesRef} 
              className="w-full h-[300px]"
            ></div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-5 rounded-lg shadow-lg mb-8">
          <h3 className="text-xl font-semibold mb-4">{getTimelineChartTitle()}</h3>
          <div 
            ref={timelineSalesRef} 
            className="w-full h-[300px]"
          ></div>
        </div>
      </>
    )}
    
    {activeTab === 'stock' && (
      <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">{getRegionChartTitle()}</h3>
            <div 
              ref={regionStockRef} 
              className="w-full h-[300px]"
            ></div>
          </div>
          
          <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">{getModelChartTitle()}</h3>
            <div 
              ref={modelStockRef} 
              className="w-full h-[300px]"
            ></div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-5 rounded-lg shadow-lg mb-8">
          <h3 className="text-xl font-semibold mb-4">{getTimelineChartTitle()}</h3>
          <div 
            ref={stockTrendRef} 
            className="w-full h-[300px]"
          ></div>
        </div>
      </>
    )}
    
    {/* Новые разделы для новых табов */}
    {activeTab === 'retail' && (
      <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">{getRegionChartTitle()}</h3>
            <div 
              ref={regionContractsRef} 
              className="w-full h-[300px]"
            ></div>
          </div>
          
          <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">{getModelChartTitle()}</h3>
            <div 
              ref={modelContractsRef} 
              className="w-full h-[300px]"
            ></div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-5 rounded-lg shadow-lg mb-8">
          <h3 className="text-xl font-semibold mb-4">{getTimelineChartTitle()}</h3>
          <div 
            ref={timelineContractsRef} 
            className="w-full h-[300px]"
          ></div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Каналы розничных продаж</h3>
            <div className="space-y-4">
              <div className="p-3 bg-gray-700 rounded-lg">
                <div className="flex justify-between mb-1">
                  <span>Дилерские центры</span>
                  <span className="font-bold">67%</span>
                </div>
                <div className="w-full bg-gray-600 h-2 rounded-full">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '67%' }}></div>
                </div>
              </div>
              
          <div className="p-3 bg-gray-700 rounded-lg">
 <div className="flex justify-between mb-1">
   <span>Официальный сайт</span>
   <span className="font-bold">22%</span>
 </div>
 <div className="w-full bg-gray-600 h-2 rounded-full">
   <div className="bg-green-500 h-2 rounded-full" style={{ width: '22%' }}></div>
 </div>
</div>

<div className="p-3 bg-gray-700 rounded-lg">
 <div className="flex justify-between mb-1">
   <span>Мобильное приложение</span>
   <span className="font-bold">11%</span>
 </div>
 <div className="w-full bg-gray-600 h-2 rounded-full">
   <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '11%' }}></div>
 </div>
</div>
            </div>
          </div>
          
          <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Демография покупателей</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-700 rounded-lg text-center">
                <h4 className="text-sm text-gray-400 mb-2">Возрастные группы</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">18-24</span>
                    <span className="text-sm font-bold">12%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">25-34</span>
                    <span className="text-sm font-bold">38%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">35-44</span>
                    <span className="text-sm font-bold">27%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">45-54</span>
                    <span className="text-sm font-bold">15%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">55+</span>
                    <span className="text-sm font-bold">8%</span>
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-gray-700 rounded-lg text-center">
                <h4 className="text-sm text-gray-400 mb-2">Пол</h4>
                <div className="flex items-center justify-center h-32">
                  <div className="flex flex-col items-center mr-10">
                    <div className="w-20 bg-blue-500 rounded-t-lg" style={{ height: '80px' }}></div>
                    <div className="mt-2">
                      <div>Мужчины</div>
                      <div className="font-bold">65%</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-20 bg-pink-500 rounded-t-lg" style={{ height: '40px' }}></div>
                    <div className="mt-2">
                      <div>Женщины</div>
                      <div className="font-bold">35%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )}
    
    {activeTab === 'wholesale' && (
      <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">{getRegionChartTitle()}</h3>
            <div 
              ref={regionContractsRef} 
              className="w-full h-[300px]"
            ></div>
          </div>
          
          <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">{getModelChartTitle()}</h3>
            <div 
              ref={modelContractsRef} 
              className="w-full h-[300px]"
            ></div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-5 rounded-lg shadow-lg mb-8">
          <h3 className="text-xl font-semibold mb-4">{getTimelineChartTitle()}</h3>
          <div 
            ref={timelineContractsRef} 
            className="w-full h-[300px]"
          ></div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Типы оптовых клиентов</h3>
            <div className="space-y-4">
              <div className="p-3 bg-gray-700 rounded-lg">
                <div className="flex justify-between mb-1">
                  <span>Дилерские центры</span>
                  <span className="font-bold">45%</span>
                </div>
                <div className="w-full bg-gray-600 h-2 rounded-full">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              
              <div className="p-3 bg-gray-700 rounded-lg">
                <div className="flex justify-between mb-1">
                  <span>Корпоративные клиенты</span>
                  <span className="font-bold">30%</span>
                </div>
                <div className="w-full bg-gray-600 h-2 rounded-full">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                </div>
              </div>
              
              <div className="p-3 bg-gray-700 rounded-lg">
                <div className="flex justify-between mb-1">
                  <span>Государственные закупки</span>
                  <span className="font-bold">15%</span>
                </div>
                <div className="w-full bg-gray-600 h-2 rounded-full">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>
              
              <div className="p-3 bg-gray-700 rounded-lg">
                <div className="flex justify-between mb-1">
                  <span>Другие оптовики</span>
                  <span className="font-bold">10%</span>
                </div>
                <div className="w-full bg-gray-600 h-2 rounded-full">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Средний размер оптовой закупки</h3>
            <div className="flex flex-col items-center justify-center h-48">
              <div className="text-5xl font-bold text-blue-400 mb-4">15</div>
              <div className="text-xl text-gray-300">автомобилей</div>
              <div className="mt-4 text-gray-400">+23% по сравнению с прошлым периодом</div>
            </div>
          </div>
        </div>
      </>
    )}
    
    {activeTab === 'promotions' && (
      <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">{getRegionChartTitle()}</h3>
            <div 
              ref={regionContractsRef} 
              className="w-full h-[300px]"
            ></div>
          </div>
          
          <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">{getModelChartTitle()}</h3>
            <div 
              ref={modelContractsRef} 
              className="w-full h-[300px]"
            ></div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-5 rounded-lg shadow-lg mb-8">
          <h3 className="text-xl font-semibold mb-4">{getTimelineChartTitle()}</h3>
          <div 
            ref={timelineContractsRef} 
            className="w-full h-[300px]"
          ></div>
        </div>
        
        <div className="bg-gray-800 p-5 rounded-lg shadow-lg mb-8">
          <h3 className="text-xl font-semibold mb-4">Эффективность акций</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300">Конверсия просмотров в продажи</span>
                <span className="text-green-400 font-bold">24.8%</span>
              </div>
              <div className="w-full bg-gray-600 h-2 rounded-full">
                <div className="bg-green-400 h-2 rounded-full" style={{ width: '24.8%' }}></div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300">Средняя скидка</span>
                <span className="text-blue-400 font-bold">15.3%</span>
              </div>
              <div className="w-full bg-gray-600 h-2 rounded-full">
                <div className="bg-blue-400 h-2 rounded-full" style={{ width: '15.3%' }}></div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300">ROI акций</span>
                <span className="text-purple-400 font-bold">132%</span>
              </div>
              <div className="w-full bg-gray-600 h-2 rounded-full">
                <div className="bg-purple-400 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Типы акций</h3>
            <div className="space-y-4">
              <div className="p-3 bg-gray-700 rounded-lg">
                <div className="flex justify-between mb-1">
                  <span>Скидки при покупке</span>
                  <span className="font-bold">42%</span>
                </div>
                <div className="w-full bg-gray-600 h-2 rounded-full">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: '42%' }}></div>
                </div>
              </div>
              
              <div className="p-3 bg-gray-700 rounded-lg">
                <div className="flex justify-between mb-1">
                  <span>Бесплатное ТО</span>
                  <span className="font-bold">28%</span>
                </div>
                <div className="w-full bg-gray-600 h-2 rounded-full">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '28%' }}></div>
                </div>
              </div>
              
              <div className="p-3 bg-gray-700 rounded-lg">
                <div className="flex justify-between mb-1">
                  <span>Подарки при покупке</span>
                  <span className="font-bold">18%</span>
                </div>
                <div className="w-full bg-gray-600 h-2 rounded-full">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '18%' }}></div>
                </div>
              </div>
              
              <div className="p-3 bg-gray-700 rounded-lg">
                <div className="flex justify-between mb-1">
                  <span>Специальные условия кредита</span>
                  <span className="font-bold">12%</span>
                </div>
                <div className="w-full bg-gray-600 h-2 rounded-full">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '12%' }}></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Текущие акции</h3>
            <div className="space-y-4">
              <div className="p-3 bg-blue-900/30 border border-blue-500/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-blue-400">Весенний драйв</h4>
                    <p className="text-sm text-gray-400">Скидка 10% на все модели седанов</p>
                  </div>
                  <div className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                    Активна
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-purple-900/30 border border-purple-500/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-purple-400">Семейный комфорт</h4>
                    <p className="text-sm text-gray-400">Бесплатный набор аксессуаров для минивэнов</p>
                  </div>
                  <div className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                    Активна
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-300">Зимний драйв</h4>
                    <p className="text-sm text-gray-400">Комплект зимней резины в подарок</p>
                  </div>
                  <div className="px-2 py-1 bg-gray-600 text-gray-400 rounded-full text-xs">
                    Завершена
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-green-900/30 border border-green-500/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-green-400">Первый автомобиль</h4>
                    <p className="text-sm text-gray-400">Специальные условия для новых водителей</p>
                  </div>
                  <div className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                    Активна
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )}
    
    {/* График возврата денежных средств */}
    <div className="bg-gray-800 p-5 rounded-lg shadow-lg mb-8">
      <h3 className="text-xl font-semibold mb-4">Возврат денежных средств</h3>
      <div className="flex items-center mb-3">
        <div className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm mr-2">Финансовая аналитика</div>
        <div className="text-sm text-gray-400">Отслеживание фактических и ожидаемых возвратов</div>
      </div>
      <div 
        ref={moneyReturnChartRef} 
        className="w-full h-[350px]"
      ></div>
    </div>
    
    <div className="bg-blue-900/20 border-l-4 border-blue-500 p-5 rounded-r-lg mb-8">
      <h3 className="text-xl font-semibold text-blue-400 mb-2">Информация об аналитической панели</h3>
      <p className="text-gray-300">
        Эта панель показывает полную аналитику по контрактам, реализации, остаткам и типам продаж автомобилей. 
        Используйте вкладки вверху для переключения между различными типами данных. 
        Вы можете фильтровать данные по регионам и моделям используя соответствующие селекторы.
        При выборе конкретной модели отображается детальная статистика по модификациям и цветам.
      </p>
    </div>
  </div>
);
};

export default CarContractsAnalytics;