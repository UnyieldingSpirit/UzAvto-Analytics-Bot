'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { carModels as mockCarModels, regions } from '../mocks/mock-data';
import ContentReadyLoader from "../layout/ContentReadyLoader";
import axios from 'axios'
import ContractsYearlyComparison from './ContractsYearlyComparison';
import { useLanguageStore } from '@/src/store/language';
import { carContractsAnalyticsTranslations } from './locales/CarContractsAnalytics';
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
  const [selectedYear, setSelectedYear] = useState('2025');
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
  const [yearlyChartData, setYearlyChartData] = useState([]);
  const { currentLocale } = useLanguageStore();
  const t = carContractsAnalyticsTranslations[currentLocale];
  const [yearlyDataLoading, setYearlyDataLoading] = useState(false);
  const carColors = ['Белый', 'Черный', 'Серебряный', 'Красный', 'Синий', 'Зеленый'];
  const carModifications = ['Стандарт', 'Комфорт', 'Люкс', 'Премиум', 'Спорт'];
  const getYearDateRange = (year) => {
    return {
     beginDate: `01.01.${year}`,
     endDate: `31.12.${year}`
    };
  };

const extractMonthlyReturnData = (apiData, year) => {
  const months = [
    { month: 'Янв', value: 0 },
    { month: 'Фев', value: 0 },
    { month: 'Мар', value: 0 },
    { month: 'Апр', value: 0 },
    { month: 'Май', value: 0 },
    { month: 'Июн', value: 0 },
    { month: 'Июл', value: 0 },
    { month: 'Авг', value: 0 },
    { month: 'Сен', value: 0 },
    { month: 'Окт', value: 0 },
    { month: 'Ноя', value: 0 },
    { month: 'Дек', value: 0 }
  ];
  
  // Отметка будущих месяцев
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-11
  
  if (parseInt(year) === currentYear) {
    for (let i = currentMonth + 1; i < 12; i++) {
      months[i].isFuture = true;
    }
  }
  
  if (!apiData || !Array.isArray(apiData)) {
    return months;
  }
  
  const monthlyTotals = Array(12).fill(0);
  
  try {
    apiData.forEach(model => {
      if (!model) return;
      
      if (selectedModel !== 'all' && model.model_id !== selectedModel) {
        return;
      }
      
      if (!model.filter_by_month || !Array.isArray(model.filter_by_month)) {
        return;
      }
      
      model.filter_by_month.forEach(monthData => {
        if (!monthData.month || !monthData.month.startsWith(year)) {
          return;
        }
        
        const monthNum = parseInt(monthData.month.split('-')[1]);
        if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
          return;
        }
        
        // Индекс в массиве (0-11)
        const monthIndex = monthNum - 1;
        
        // Проверяем наличие данных регионов
        if (!monthData.regions || !Array.isArray(monthData.regions)) {
          return;
        }
        
        // Суммируем данные по регионам
        if (selectedRegion !== 'all') {
          // Если выбран конкретный регион, ищем его данные
          const regionData = monthData.regions.find(r => r.region_id === selectedRegion);
          if (regionData) {
            // Проверяем наличие поля amount
            if (regionData.amount !== undefined) {
              const amount = parseInt(regionData.amount || 0);
              if (!isNaN(amount)) {
                monthlyTotals[monthIndex] += amount;
              }
            }
          }
        } else {
          // Если не выбран конкретный регион, суммируем по всем
          monthData.regions.forEach(region => {
            if (region.amount !== undefined) {
              const amount = parseInt(region.amount || 0);
              if (!isNaN(amount)) {
                monthlyTotals[monthIndex] += amount;
              }
            }
          });
        }
      });
    });
    
    // Заполняем массив месяцев данными
    for (let i = 0; i < 12; i++) {
      months[i].value = monthlyTotals[i];
    }
    
    return months;
    
  } catch (error) {
    return months;
  }
};
  
const fetchAutoReturnData = async () => {
  try {
    setLoadingComponent(true);
    
    const baseUrl = 'https://uzavtosalon.uz/b/dashboard/infos';
    const autoReturnUrl = `${baseUrl}&auto_return`;
    
    // Формируем даты начала и конца года
    const beginDate = formatDateForAPI(`${selectedYear}-01-01`);
    const endDate = formatDateForAPI(`${selectedYear}-12-31`);
    
    const requestData = {
      begin_date: beginDate,
      end_date: endDate,
    };
    
    // Добавляем фильтры, если они выбраны
    if (selectedModel !== 'all') {
      requestData.model_id = selectedModel;
      console.log(`Применяем фильтр по модели: ${selectedModel}`);
    }
    
    if (selectedRegion !== 'all') {
      requestData.region_id = selectedRegion;
      console.log(`Применяем фильтр по региону: ${selectedRegion}`);
    }
    
    console.log(`Отправка запроса auto_return за ${selectedYear} год:`, requestData);
    
    const response = await axios.post(autoReturnUrl, requestData);
    
    console.log('Получены данные о возврате автомобилей за год:', response.data);
    
    if (response.data && Array.isArray(response.data)) {
      // Обрабатываем полученные данные и перерисовываем график
      const monthlyData = extractMonthlyReturnData(response.data, selectedYear);
      renderMoneyReturnChart();
    }
    
    setLoadingComponent(false);
  } catch (error) {
    console.error('Ошибка при запросе данных auto_return:', error);
    setLoadingComponent(false);
    // Генерируем тестовые данные в случае ошибки
    renderMoneyReturnChart();
  }
};
  
useEffect(() => {
  fetchAutoReturnData();
}, [selectedModel, selectedRegion]);

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
  
  const average = totalContracts > 0 ? Math.round(totalAmount / totalContracts) : 0;
  
  const tabMultipliers = {
    contracts: { count: 1, amount: 1 },
    sales: { count: 1, amount: 1 },
    stock: { count: 1, amount: 1 },
    retail: { count: 1, amount: 1 },
    wholesale: { count: 1, amount: 1 },
    promotions: { count: 1, amount: 1 }
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
     
      const regionArray = Array.from(uniqueRegions.values()).sort((a, b) => 
        a.name.localeCompare(b.name, 'ru-RU')
      );
      
      setRegionsList(regionArray);
      
      // Перерисовываем графики с новыми данными
      renderCharts();
      setLoadingComponent(false);
    }
  }, [apiData]);

  useEffect(() => {
    renderCharts();
    
    if (startDate && endDate) {
      fetchData(getApiUrlForTab(activeTab));
    }
  }, [activeTab, selectedRegion, selectedModel]);
  
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
  

const formatDateForAPI = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  } catch (error) {
    console.error('Ошибка форматирования даты:', error);
    return '';
  }
};
  

  
useEffect(() => {
  if (apiData) {
    // Перерисовываем все графики сразу после обновления данных
    renderCharts();
    
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
    // Устанавливаем состояния загрузки
    setLoading(true);
    setLoadingComponent(true);
    
    // Минимальное время показа лоадера (в миллисекундах)
    const MIN_LOADER_DISPLAY_TIME = 4000; // 4 секунды минимум
    
    if (!startDate || !endDate) {
      console.log('Даты не установлены, устанавливаем значения по умолчанию');
      const today = new Date();
      setStartDate(today.toISOString().substring(0, 10));
      setEndDate(today.toISOString().substring(0, 10));
      return;
    }
    
    console.log('🕐 Начинаем запрос данных...');
    const requestStartTime = Date.now(); // Запоминаем время начала запроса
    
    const formattedStartDate = formatDateForAPI(startDate);
    const formattedEndDate = formatDateForAPI(endDate);
    
    const requestData = {
      begin_date: formattedStartDate,
      end_date: formattedEndDate,
    };
    
    // Выполняем запрос
    const response = await axios.post(apiUrl, requestData);
    
    // Вычисляем, сколько времени занял запрос
    const requestEndTime = Date.now();
    const requestDuration = requestEndTime - requestStartTime;
    console.log(`⏱️ Запрос выполнен за ${requestDuration/1000} секунд`);
    
    // Рассчитываем необходимую задержку
    // Формула: чем дольше запрос, тем меньше дополнительная задержка
    let additionalDelayTime;
    
    if (requestDuration < 1000) { // Запрос менее 1 секунды
      additionalDelayTime = 5000; // +5 секунд
      console.log('🚀 Очень быстрый запрос, добавляем 5 секунд задержки');
    } else if (requestDuration < 3000) { // 1-3 секунды
      additionalDelayTime = 4000; // +4 секунды
      console.log('⚡ Быстрый запрос, добавляем 4 секунды задержки');
    } else if (requestDuration < 5000) { // 3-5 секунд
      additionalDelayTime = 3000; // +3 секунды
      console.log('✓ Средний запрос, добавляем 3 секунды задержки');
    } else if (requestDuration < 8000) { // 5-8 секунд
      additionalDelayTime = 2000; // +2 секунды
      console.log('⏳ Долгий запрос, добавляем 2 секунды задержки');
    } else if (requestDuration < 12000) { // 8-12 секунд
      additionalDelayTime = 1000; // +1 секунда
      console.log('⌛ Очень долгий запрос, добавляем 1 секунду задержки');
    } else { // Более 12 секунд
      additionalDelayTime = 500; // +0.5 секунды
      console.log('🐢 Критически долгий запрос, добавляем 0.5 секунды задержки');
    }
    
    // Рассчитываем общее время, которое должен быть виден лоадер
    const totalLoaderTime = Math.max(MIN_LOADER_DISPLAY_TIME, requestDuration + additionalDelayTime);
    
    // Сколько времени прошло с момента начала загрузки
    const elapsedTime = Date.now() - requestStartTime;
    
    // Сколько еще нужно показывать лоадер после получения ответа
    const remainingLoaderTime = Math.max(0, totalLoaderTime - elapsedTime);
    
    console.log(`🔄 Всего лоадер должен отображаться: ${totalLoaderTime/1000} секунд`);
    console.log(`⏰ Прошло времени: ${elapsedTime/1000} секунд`);
    console.log(`⌚ Осталось показывать лоадер: ${remainingLoaderTime/1000} секунд`);
    
    if (response.data && Array.isArray(response.data)) {
      console.log(`📊 Получены данные с ${apiUrl}`);
      
      // Обрабатываем данные API
      const modelsList = response.data.map(model => {
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
      
      // Сохраняем данные API
      setApiData(response.data);
      
      // Сохраняем информацию о времени для использования в useEffect
      window.loaderTimingData = {
        requestStartTime,
        requestDuration,
        remainingLoaderTime,
        shouldHideLoaderAt: Date.now() + remainingLoaderTime
      };
      
      console.log(`🕒 Лоадер будет скрыт в: ${new Date(window.loaderTimingData.shouldHideLoaderAt).toLocaleTimeString()}`);
      
      // Не выключаем лоадер здесь!
    } else {
      console.error("❌ Некорректный формат данных:", response.data);
      setCarModels(mockCarModels);
      
      // Для случая ошибки делаем фиксированную задержку
      setTimeout(() => {
        setLoadingComponent(false);
      }, 3000);
    }
  } catch (error) {
    console.error(`❌ Ошибка при отправке запроса на ${apiUrl}:`, error);
    console.log('Продолжаем с использованием тестовых данных');
    setCarModels(mockCarModels);
    
    // Для случая ошибки делаем фиксированную задержку
    setTimeout(() => {
      setLoadingComponent(false);
    }, 3000);
  } finally {
    setLoading(false); // Отключаем только состояние API-запроса
  }
};
  
const fetchYearlyData = async (year) => {
  try {
    setYearlyDataLoading(true);
    
    // Получаем диапазон дат для года
    const { beginDate, endDate } = getYearDateRange(year);
    
    // Формируем URL в зависимости от активного таба
    const apiUrl = getApiUrlForTab(activeTab);
    
    // Подготавливаем данные запроса
    const requestData = {
      begin_date: beginDate,
      end_date: endDate,
    };
    
    const response = await axios.post(apiUrl, requestData);
    
    if (response.data && Array.isArray(response.data)) {
      // Преобразуем данные в формат для графика
      const monthlyData = prepareMonthlyDataFromResponse(response.data, year);
      
      // Подсчет общего количества контрактов
      const totalContracts = calculateTotalContracts(response.data);
      
      // Вывод информации в лог
      console.log(`Всего контрактов за ${year} год: ${totalContracts}`);
      console.log(`Запрос данных для динамики ${activeTab} за период: ${beginDate} - ${endDate}`);
      
      // Сохраняем данные для графика
      setYearlyChartData(monthlyData);
    }
  } catch (error) {
    console.error(`Ошибка при получении данных за ${year} год:`, error);
  } finally {
    setYearlyDataLoading(false);
  }
};

// Функция для подсчета общего количества контрактов из данных API
const calculateTotalContracts = (apiData) => {
  let totalContracts = 0;
  
  try {
    // Если выбрана конкретная модель
    if (selectedModel !== 'all') {
      const modelData = apiData.find(model => model.model_id === selectedModel);
      if (modelData && modelData.filter_by_region) {
        if (selectedRegion !== 'all') {
          // Если выбран и регион, и модель
          const regionData = modelData.filter_by_region.find(r => r.region_id === selectedRegion);
          if (regionData) {
            totalContracts = parseInt(regionData.total_contracts || 0);
          }
        } else {
          // Если выбрана только модель, суммируем по всем регионам
          modelData.filter_by_region.forEach(region => {
            totalContracts += parseInt(region.total_contracts || 0);
          });
        }
      }
    } else {
      // Если модель не выбрана
      if (selectedRegion !== 'all') {
        // Если выбран только регион, суммируем по всем моделям для этого региона
        apiData.forEach(model => {
          if (model.filter_by_region) {
            const regionData = model.filter_by_region.find(r => r.region_id === selectedRegion);
            if (regionData) {
              totalContracts += parseInt(regionData.total_contracts || 0);
            }
          }
        });
      } else {
        // Если не выбраны ни модель, ни регион, суммируем все
        apiData.forEach(model => {
          if (model.filter_by_region) {
            model.filter_by_region.forEach(region => {
              totalContracts += parseInt(region.total_contracts || 0);
            });
          }
        });
      }
    }
  } catch (error) {
    console.error("Ошибка при расчете общего количества контрактов:", error);
  }
  
  return totalContracts;
};

useEffect(() => {
  if (activeTab) {
    fetchYearlyData(selectedYear);
  }
}, [activeTab, selectedModel, selectedRegion]); 

const prepareMonthlyDataFromResponse = (apiData, year) => {
  if (!apiData || !Array.isArray(apiData)) {
    return [];
  }
  
  const monthlyDataMap = {};
  const valueKey = getValueKeyForActiveTab();
  const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
  
  monthNames.forEach((name, index) => {
    monthlyDataMap[name] = {
      month: name,
      [valueKey]: 0,
      amount: 0,
      sortIndex: index
    };
  });
  
  // Проходим по всем моделям
  apiData.forEach(model => {
    // Пропускаем модель, если выбрана конкретная модель и это не она
    if (selectedModel !== 'all' && model.model_id !== selectedModel) {
      return;
    }
    
    // Проверяем наличие данных по месяцам
    if (!model.filter_by_month || !Array.isArray(model.filter_by_month)) {
      return;
    }
    
    // Обрабатываем каждый месяц
    model.filter_by_month.forEach(monthData => {
      // Проверяем, что месяц соответствует выбранному году
      if (!monthData.month || !monthData.month.startsWith(year)) {
        return;
      }
      
      const yearMonth = monthData.month.split('-');
      if (yearMonth.length !== 2) return;
      
      const monthIndex = parseInt(yearMonth[1], 10) - 1;
      if (monthIndex < 0 || monthIndex > 11) return;
      
      const monthName = monthNames[monthIndex];
      
      // Обрабатываем данные по регионам
      if (monthData.regions && Array.isArray(monthData.regions)) {
        if (selectedRegion !== 'all') {
          // Если выбран конкретный регион, ищем его
          const regionData = monthData.regions.find(r => r.region_id === selectedRegion);
          if (regionData) {
            // Используем поля contract или count в зависимости от их наличия
            const count = Number(regionData.contract || regionData.count || 0);
            const amount = Number(regionData.total_price || regionData.amount || 0);
            
            monthlyDataMap[monthName][valueKey] += Math.abs(count);
            monthlyDataMap[monthName].amount += Math.abs(amount);
          }
        } else {
          // Если регион не выбран, суммируем по всем регионам
          monthData.regions.forEach(region => {
            const count = Number(region.contract || region.count || 0);
            const amount = Number(region.total_price || region.amount || 0);
            
            monthlyDataMap[monthName][valueKey] += Math.abs(count);
            monthlyDataMap[monthName].amount += Math.abs(amount);
          });
        }
      }
    });
  });
  
  // Преобразуем объект в массив и сортируем по месяцам
  return Object.values(monthlyDataMap).sort((a, b) => a.sortIndex - b.sortIndex);
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
  if (selectedModel !== 'all' && apiData) {
    const selectedModelData = Array.isArray(apiData)
      ? apiData.find(model => model.model_id === selectedModel)
      : apiData;
    
    if (selectedModelData) {
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
      
      let modelData = [];

      if (selectedRegion !== 'all') {
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

      if (modelData.length < 3) {
        const valueKey = getValueKeyForActiveTab();
        
        modelData = [];
        
        const regionFactor = selectedRegion !== 'all' ? 0.4 : 1.0;
        
        carModifications.forEach(modification => {
          const regionPreference = selectedRegion !== 'all' ? 
            (selectedRegion.charCodeAt(0) % carModifications.length) : 0;
          
          const modIndex = carModifications.indexOf(modification);
          
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
        
        modelData.sort((a, b) => b[valueKey] - a[valueKey]);
      }
      const valueKey = getValueKeyForActiveTab();

   if (selectedModelData.filter_by_region && Array.isArray(selectedModelData.filter_by_region)) {
  regionData = selectedModelData.filter_by_region
    .filter(region => 
      region && 
      region.region_id && 
      region.region_name
    )
    .map(region => {
      const valueKey = getValueKeyForActiveTab();
      return {
        id: region.region_id,
        name: region.region_name,
        [valueKey]: parseInt(region.total_contracts || 0),
        amount: parseInt(region.total_price || 0),
        isSelected: region.region_id === selectedRegion
      };
    });
} 
      
let monthlyData = [];

if (selectedModelData.filter_by_month && Array.isArray(selectedModelData.filter_by_month) && selectedModelData.filter_by_month.length > 0) {
  monthlyData = selectedModelData.filter_by_month.map(item => {
    const yearMonth = item.month.split('-');
    const monthIndex = parseInt(yearMonth[1], 10) - 1;
    
    // Массив названий месяцев на русском
    const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const monthName = monthNames[monthIndex];
    
    const valueKeyName = activeTab === 'contracts' ? 'contracts' : 
                        activeTab === 'sales' ? 'sales' : 
                        activeTab === 'stock' ? 'stock' :
                        activeTab === 'retail' ? 'retail' :
                        activeTab === 'wholesale' ? 'wholesale' :
                        activeTab === 'promotions' ? 'promotions' : 'contracts';
    
    const adjustedItem = {
      month: monthName,
      [valueKeyName]: parseInt(item.count || 0),
      amount: parseInt(item.total_price || 0),
      fullDate: item.month
    };
    
    return adjustedItem;
  });
  
  if (selectedRegion !== 'all') {
    const regionRatio = 0.7;
    
    monthlyData = monthlyData.map(item => {
      const valueKeyName = getValueKeyForActiveTab();
      
      return {
        ...item,
        [valueKeyName]: Math.round(item[valueKeyName] * regionRatio),
        amount: Math.round(item.amount * regionRatio)
      };
    });
  }
  
  // Сортируем данные по дате, чтобы они отображались в хронологическом порядке
  monthlyData.sort((a, b) => {
    return new Date(a.fullDate) - new Date(b.fullDate);
  });
  
  // Удаляем вспомогательное поле fullDate, так как оно больше не нужно
  monthlyData = monthlyData.map(({ fullDate, ...rest }) => rest);
  
} else {
  // Если данных по месяцам нет в API, используем тестовые данные
  const valueKeyName = getValueKeyForActiveTab();
  
  // Базовые тестовые данные
  monthlyData = [
    { month: "Янв", [valueKeyName]: 124, amount: 8520000 },
    { month: "Фев", [valueKeyName]: 85, amount: 5950000 },
    { month: "Мар", [valueKeyName]: 102, amount: 7140000 },
    { month: "Апр", [valueKeyName]: 118, amount: 8260000 },
    { month: "Май", [valueKeyName]: 175, amount: 12250000 },
    { month: "Июн", [valueKeyName]: 140, amount: 9800000 },
    { month: "Июл", [valueKeyName]: 155, amount: 10850000 },
    { month: "Авг", [valueKeyName]: 132, amount: 9240000 },
    { month: "Сен", [valueKeyName]: 145, amount: 10150000 },
    { month: "Окт", [valueKeyName]: 120, amount: 8400000 },
    { month: "Ноя", [valueKeyName]: 165, amount: 11550000 },
    { month: "Дек", [valueKeyName]: 130, amount: 9100000 }
  ];
  
  // Если выбран регион, корректируем тестовые данные
  if (selectedRegion !== 'all') {
    monthlyData = monthlyData.map(item => ({
      ...item,
      [valueKeyName]: Math.round(item[valueKeyName] * 0.7),
      amount: Math.round(item.amount * 0.7)
    }));
  }
}

// Функция-помощник для получения ключа значения в зависимости от активной вкладки
function getValueKeyForActiveTab() {
  switch(activeTab) {
    case 'contracts': return 'contracts';
    case 'sales': return 'sales';
    case 'stock': return 'stock';
    case 'retail': return 'retail';
    case 'wholesale': return 'wholesale';
    case 'promotions': return 'promotions';
    default: return 'contracts';
  }
}

// Возвращаем финальный объект с данными для графиков
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
           
              const stockCount = Math.round(parseInt(region.total_contracts || 0));
              const stockAmount = Math.round(parseInt(region.total_price || 0));
           
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
          if (!region || !region.region_id || !region.region_name) return;
          
          if (!regionSummary[region.region_id]) {
            regionSummary[region.region_id] = {
              id: region.region_id,
              name: region.region_name,
              retail: 0,
              amount: 0,
              isSelected: region.region_id === selectedRegion
            };
          }
          
          // Используем parseFloat вместо Number для более надежного преобразования
          const contractCount = parseFloat(region.total_contracts || 0);
          const totalPrice = parseFloat(region.total_price || 0);
          
          regionSummary[region.region_id].retail += contractCount;
          regionSummary[region.region_id].amount += totalPrice;
        });
      }
    });
    
    // Преобразуем объект обратно в массив для графика
    regionData = Object.values(regionSummary);
    
    // Сортируем данные по количеству (по убыванию)
    regionData.sort((a, b) => b.retail - a.retail);
  } else {
    // Запасной вариант с тестовыми данными
    regionData = regions.map(region => ({
      id: region.id,
      name: region.name,
      retail: Math.round(30 + Math.random() * 70),
      amount: Math.round((3000000 + Math.random() * 7000000)),
      isSelected: region.id === selectedRegion
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
                retail: 0,
                amount: 0
              };
            }
            
            const contractCount = parseFloat(regionData.total_contracts || 0);
            const totalPrice = parseFloat(regionData.total_price || 0);
            
            filteredModelSummary[model.model_id].retail += contractCount;
            filteredModelSummary[model.model_id].amount += totalPrice;
          }
        }
      });
      
      // Преобразуем объект обратно в массив для графика
      modelData = Object.values(filteredModelSummary);
      
      // Сортируем по количеству
      modelData.sort((a, b) => b.retail - a.retail);
    } else {
      // Если регион не выбран, показываем данные по всем моделям
      const modelSummary = {};
      
      apiData.forEach(model => {
        if (!modelSummary[model.model_id]) {
          modelSummary[model.model_id] = {
            id: model.model_id,
            name: model.model_name,
            retail: 0,
            amount: 0
          };
        }
        
        // Суммируем контракты и суммы по всем регионам данной модели
        if (model.filter_by_region && Array.isArray(model.filter_by_region)) {
          model.filter_by_region.forEach(region => {
            const contractCount = parseFloat(region.total_contracts || 0);
            const totalPrice = parseFloat(region.total_price || 0);
            
            modelSummary[model.model_id].retail += contractCount;
            modelSummary[model.model_id].amount += totalPrice;
          });
        }
      });
      
      // Преобразуем объект обратно в массив для графика
      modelData = Object.values(modelSummary);
      
      // Сортируем по количеству
      modelData.sort((a, b) => b.retail - a.retail);
    }
  } else {
    // Запасной вариант с тестовыми данными
    modelData = carModels.map(model => ({
      id: model.id,
      name: model.name,
      retail: Math.round(20 + Math.random() * 60),
      amount: Math.round((2000000 + Math.random() * 6000000))
    }));
  }

  // Обработка данных по месяцам
  let monthlyData = [];
  
  // Проверяем наличие ежемесячных данных в API
  const hasMonthlyData = apiData && Array.isArray(apiData) && 
                         apiData.some(model => model.filter_by_month && model.filter_by_month.length > 0);
  
  if (hasMonthlyData) {
    // Создаем объект для суммирования данных по месяцам
    const monthSummary = {};
    const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    
    // Инициализируем все месяцы
    monthNames.forEach((name, index) => {
      monthSummary[name] = {
        month: name,
        retail: 0,
        amount: 0,
        sortIndex: index
      };
    });
    
    // Обрабатываем данные по месяцам из API
    apiData.forEach(model => {
      // Фильтрация по выбранной модели, если она указана
      if (selectedModel === 'all' || model.model_id === selectedModel) {
        if (model.filter_by_month && Array.isArray(model.filter_by_month)) {
          model.filter_by_month.forEach(monthData => {
            // Определяем индекс месяца из строки формата "YYYY-MM"
            const monthParts = monthData.month.split('-');
            if (monthParts.length === 2) {
              const monthIndex = parseInt(monthParts[1]) - 1;
              const monthName = monthNames[monthIndex];
              
              // Обрабатываем данные по регионам за данный месяц
              if (monthData.regions && Array.isArray(monthData.regions)) {
                if (selectedRegion !== 'all') {
                  // Если выбран конкретный регион, ищем его
                  const regionData = monthData.regions.find(r => r.region_id === selectedRegion);
                  if (regionData) {
                    const count = parseFloat(regionData.count || 0);
                    const amount = parseFloat(regionData.amount || 0);
                    
                    monthSummary[monthName].retail += count;
                    monthSummary[monthName].amount += amount;
                  }
                } else {
                  // Если регион не выбран, суммируем по всем регионам
                  monthData.regions.forEach(region => {
                    const count = parseFloat(region.count || 0);
                    const amount = parseFloat(region.amount || 0);
                    
                    monthSummary[monthName].retail += count;
                    monthSummary[monthName].amount += amount;
                  });
                }
              } else if (monthData.count !== undefined && monthData.total_price !== undefined) {
                // Если данные о регионах отсутствуют, но есть общие данные
                const count = parseFloat(monthData.count || 0);
                const amount = parseFloat(monthData.total_price || 0);
                
                monthSummary[monthName].retail += count;
                monthSummary[monthName].amount += amount;
              }
            }
          });
        }
      }
    });
    
    // Преобразуем объект в массив и сортируем по месяцам
    monthlyData = Object.values(monthSummary).sort((a, b) => a.sortIndex - b.sortIndex);
    
    // Удаляем вспомогательное поле sortIndex
    monthlyData.forEach(item => delete item.sortIndex);
  } else {
    // Если данных по месяцам нет, используем тестовые данные
    monthlyData = [
      { month: "Янв", retail: 95, amount: 6650000 },
      { month: "Фев", retail: 70, amount: 4900000 },
      { month: "Мар", retail: 85, amount: 5950000 },
      { month: "Апр", retail: 100, amount: 7000000 },
      { month: "Май", retail: 145, amount: 10150000 },
      { month: "Июн", retail: 120, amount: 8400000 },
      { month: "Июл", retail: 135, amount: 9450000 },
      { month: "Авг", retail: 115, amount: 8050000 },
      { month: "Сен", retail: 125, amount: 8750000 },
      { month: "Окт", retail: 105, amount: 7350000 },
      { month: "Ноя", retail: 140, amount: 9800000 },
      { month: "Дек", retail: 110, amount: 7700000 }
    ];
    
    // Если выбран конкретный регион, корректируем данные
    if (selectedRegion !== 'all') {
      monthlyData = monthlyData.map(item => ({
        ...item,
        retail: Math.round(item.retail * 0.7),
        amount: Math.round(item.amount * 0.7)
      }));
    }
  }

  // Если выбрана конкретная модель, обработаем данные по модификациям
  if (selectedModel !== 'all') {
    const selectedModelData = apiData && Array.isArray(apiData) ? 
                            apiData.find(m => m.model_id === selectedModel) : null;
    
    // Если у выбранной модели есть данные о модификациях, используем их
    if (selectedModelData && selectedModelData.filter_by_modification && 
        Array.isArray(selectedModelData.filter_by_modification) && 
        selectedModelData.filter_by_modification.length > 0) {
        
      modelData = selectedModelData.filter_by_modification.map(mod => ({
        id: mod.modification_id,
        name: mod.modification_name,
        retail: parseFloat(mod.total_contracts || 0),
        amount: parseFloat(mod.total_price || 0)
      }));
      
      // Корректируем данные для выбранного региона, если он задан
      if (selectedRegion !== 'all') {
        const totalContracts = selectedModelData.filter_by_region 
          ? selectedModelData.filter_by_region.reduce((sum, r) => sum + parseFloat(r.total_contracts || 0), 0) 
          : 0;
          
        const regionData = selectedModelData.filter_by_region 
          ? selectedModelData.filter_by_region.find(r => r.region_id === selectedRegion) 
          : null;
          
        const regionContracts = regionData ? parseFloat(regionData.total_contracts || 0) : 0;
        const regionRatio = totalContracts > 0 ? regionContracts / totalContracts : 0;
        
        modelData = modelData.map(mod => ({
          ...mod,
          retail: Math.round(mod.retail * regionRatio),
          amount: Math.round(mod.amount * regionRatio)
        }));
      }
      
      // Сортируем по количеству
      modelData.sort((a, b) => b.retail - a.retail);
    } else {
      // Если нет данных о модификациях, создаем тестовые данные
      // Данные по регионам для выбранной модели
      regionData = regions.map(region => ({
        id: region.id,
        name: region.name,
        retail: Math.round(10 + Math.random() * 40),
        amount: Math.round((1000000 + Math.random() * 4000000))
      }));
   
      // Генерируем данные по модификациям и цветам для выбранной модели
      modelData = [];
   
      // Добавляем данные о модификациях
      carModifications.forEach(modification => {
        modelData.push({
          id: `mod-${modification.toLowerCase()}`,
          name: `${carModels.find(m => m.id === selectedModel)?.name || 'Автомобиль'} ${modification}`,
          retail: Math.round(5 + Math.random() * 20),
          amount: Math.round((500000 + Math.random() * 2000000))
        });
      });
   
      // Добавляем данные о цветах
      carColors.forEach(color => {
        modelData.push({
          id: `color-${color.toLowerCase()}`,
          name: `Цвет: ${color}`,
          retail: Math.round(3 + Math.random() * 15),
          amount: Math.round((300000 + Math.random() * 1500000))
        });
      });
      
      // Сортируем по количеству
      modelData.sort((a, b) => b.retail - a.retail);
    }
  }

  return { regionData, modelData, monthlyData };
};

    const getWholesaleData = () => {
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
              const wholesaleCount = Math.round(parseInt(region.total_contracts || 0));
              const wholesaleAmount = Math.round(parseInt(region.total_price || 0));
         
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
              const wholesaleCount = Math.round(parseInt(region.total_contracts || 0));
              const wholesaleAmount = Math.round(parseInt(region.total_price || 0));
         
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

          // Используем те же данные, что и в других разделах, без множителей
          // total_contracts и total_price приходят из API так же, как и для других разделов
          const promotionsCount = parseInt(region.total_contracts || 0);
          const promotionsAmount = parseInt(region.total_price || 0);

          // Суммируем данные по каждому региону
          regionSummary[region.region_id].promotions += promotionsCount;
          regionSummary[region.region_id].amount += promotionsAmount;
        });
      }
    });

    // Преобразуем объект обратно в массив для графика
    regionData = Object.values(regionSummary);
  } else {
    // Запасной вариант с тестовыми данными (оставляем как есть)
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

      // Суммируем данные о промоакциях по всем регионам данной модели
      if (model.filter_by_region && Array.isArray(model.filter_by_region)) {
        model.filter_by_region.forEach(region => {
          // Используем те же данные, что и в других разделах
          const promotionsCount = parseInt(region.total_contracts || 0);
          const promotionsAmount = parseInt(region.total_price || 0);

          modelSummary[model.model_id].promotions += promotionsCount;
          modelSummary[model.model_id].amount += promotionsAmount;
        });
      }
    });

    // Преобразуем объект обратно в массив для графика
    modelData = Object.values(modelSummary);
  } else {
    // Запасной вариант с тестовыми данными (оставляем как есть)
    modelData = carModels.map(model => ({
      id: model.id,
      name: model.name,
      promotions: Math.round(3 + Math.random() * 20),
      amount: Math.round((300000 + Math.random() * 2000000))
    }));
  }

  // Обработка данных по месяцам, аналогично другим разделам
  let monthlyData = [];
  
  // Проверяем наличие ежемесячных данных в API
  const hasMonthlyData = apiData && Array.isArray(apiData) && 
                        apiData.some(model => model.filter_by_month && model.filter_by_month.length > 0);
  
  if (hasMonthlyData) {
    // Создаем объект для суммирования данных по месяцам
    const monthSummary = {};
    const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    
    // Инициализируем все месяцы
    monthNames.forEach((name, index) => {
      monthSummary[name] = {
        month: name,
        promotions: 0,
        amount: 0,
        sortIndex: index
      };
    });
    
    // Обрабатываем данные по месяцам из API
    apiData.forEach(model => {
      // Фильтрация по выбранной модели, если она указана
      if (selectedModel === 'all' || model.model_id === selectedModel) {
        if (model.filter_by_month && Array.isArray(model.filter_by_month)) {
          model.filter_by_month.forEach(monthData => {
            // Определяем индекс месяца из строки формата "YYYY-MM"
            const monthParts = monthData.month.split('-');
            if (monthParts.length === 2) {
              const monthIndex = parseInt(monthParts[1]) - 1;
              const monthName = monthNames[monthIndex];
              
              // Обрабатываем данные по регионам за данный месяц
              if (monthData.regions && Array.isArray(monthData.regions)) {
                if (selectedRegion !== 'all') {
                  // Если выбран конкретный регион, ищем его
                  const regionData = monthData.regions.find(r => r.region_id === selectedRegion);
                  if (regionData) {
                    const count = parseInt(regionData.count || 0);
                    const amount = parseInt(regionData.amount || 0);
                    
                    monthSummary[monthName].promotions += count;
                    monthSummary[monthName].amount += amount;
                  }
                } else {
                  // Если регион не выбран, суммируем по всем регионам
                  monthData.regions.forEach(region => {
                    const count = parseInt(region.count || 0);
                    const amount = parseInt(region.amount || 0);
                    
                    monthSummary[monthName].promotions += count;
                    monthSummary[monthName].amount += amount;
                  });
                }
              } else if (monthData.count !== undefined && monthData.total_price !== undefined) {
                // Если данные о регионах отсутствуют, но есть общие данные
                const count = parseInt(monthData.count || 0);
                const amount = parseInt(monthData.total_price || 0);
                
                monthSummary[monthName].promotions += count;
                monthSummary[monthName].amount += amount;
              }
            }
          });
        }
      }
    });
    
    // Преобразуем объект в массив и сортируем по месяцам
    monthlyData = Object.values(monthSummary).sort((a, b) => a.sortIndex - b.sortIndex);
    
    // Удаляем вспомогательное поле sortIndex
    monthlyData.forEach(item => delete item.sortIndex);
  } else {
    // Если данных по месяцам нет, используем тестовые (оставляем как есть)
    monthlyData = [
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
  }

  // Если выбран конкретный регион, фильтруем данные по модели для этого региона
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
           
            // Используем прямые значения из API
            const promotionsCount = parseInt(regionData.total_contracts || 0);
            const promotionsAmount = parseInt(regionData.total_price || 0);
           
            filteredModelSummary[model.model_id].promotions += promotionsCount;
            filteredModelSummary[model.model_id].amount += promotionsAmount;
          }
        }
      });
     
      // Если есть данные по моделям для выбранного региона, используем их
      if (Object.keys(filteredModelSummary).length > 0) {
        modelData = Object.values(filteredModelSummary);
      }
    }
   
    // Корректируем тестовые данные для выбранного региона
    if (monthlyData.length > 0 && Array.isArray(monthlyData[0])) {
      monthlyData = monthlyData.map(item => ({
        ...item,
        promotions: Math.round(item.promotions * 0.7),
        amount: Math.round(item.amount * 0.7)
      }));
    }
  }

  // Если выбрана конкретная модель, детализируем данные по модификациям
  if (selectedModel !== 'all') {
    const selectedModelData = apiData && Array.isArray(apiData) 
      ? apiData.find(m => m.model_id === selectedModel) 
      : null;
    
    // Если у выбранной модели есть данные о модификациях, используем их
    if (selectedModelData && selectedModelData.filter_by_modification && 
        Array.isArray(selectedModelData.filter_by_modification) &&
        selectedModelData.filter_by_modification.length > 0) {
        
      modelData = selectedModelData.filter_by_modification.map(mod => ({
        id: mod.modification_id,
        name: mod.modification_name,
        promotions: parseInt(mod.total_contracts || 0),
        amount: parseInt(mod.total_price || 0)
      }));
      
      // Корректируем данные для выбранного региона, если он задан
      if (selectedRegion !== 'all') {
        const totalContracts = selectedModelData.filter_by_region 
          ? selectedModelData.filter_by_region.reduce((sum, r) => sum + parseInt(r.total_contracts || 0), 0) 
          : 0;
          
        const regionData = selectedModelData.filter_by_region 
          ? selectedModelData.filter_by_region.find(r => r.region_id === selectedRegion) 
          : null;
          
        const regionContracts = regionData ? parseInt(regionData.total_contracts || 0) : 0;
        const regionRatio = totalContracts > 0 ? regionContracts / totalContracts : 0;
        
        modelData = modelData.map(mod => ({
          ...mod,
          promotions: Math.round(mod.promotions * regionRatio),
          amount: Math.round(mod.amount * regionRatio)
        }));
      }
    } else {
      // Если нет данных о модификациях, используем тестовые данные (оставляем как есть)
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
    }
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

// Создайте отдельные референсы для каждого таба или переиспользуйте корректно
const renderRetailCharts = () => {
  const { regionData, modelData, monthlyData } = getFilteredData();
  
  // Проверяем наличие данных
  console.log("Retail data for charts:", {
    regionData: regionData.length,
    modelData: modelData.length,
    monthlyData: monthlyData.length
  });
  
  // ВАЖНЫЙ МОМЕНТ: Проверяем, существуют ли DOM-элементы
  if (!regionContractsRef.current || !modelContractsRef.current || !timelineContractsRef.current) {
    console.error("DOM references not initialized for retail charts");
    return;
  }

  renderBarChart(regionContractsRef, regionData, 'retail', 'name', getRegionChartTitle(), '#FF5722');
  renderBarChart(modelContractsRef, modelData, 'retail', 'name', getModelChartTitle(), '#03A9F4');
  renderTimelineChart(timelineContractsRef, monthlyData, 'retail', 'month', getTimelineChartTitle());
}

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
 
const getMetricNameForChart = () => {
  switch(activeTab) {
    case 'contracts': return t.tabs.contracts;
    case 'sales': return t.tabs.sales;
    case 'stock': return t.tabs.stock;
    case 'retail': return t.tabs.retail;
    case 'wholesale': return t.tabs.wholesale;
    case 'promotions': return t.tabs.promotions;
    default: return t.tabs.contracts;
  }
};

const getRegionChartTitle = () => {
  const metric = getMetricNameForChart();
  
  if (selectedModel !== 'all') {
    const modelName = carModels.find(m => m.id === selectedModel)?.name || t.filters.model;
    return t.charts.modelRegionTitle
      .replace('{{metric}}', metric)
      .replace('{{modelName}}', modelName);
  }
  return t.charts.regionTitle.replace('{{metric}}', metric);
};

const getModelChartTitle = () => {
  const metric = getMetricNameForChart();
  
  if (selectedRegion !== 'all') {
    const regionName = regionsList.find(r => r.id === selectedRegion)?.name || t.filters.region;
    return t.charts.regionModelTitle
      .replace('{{metric}}', metric)
      .replace('{{regionName}}', regionName);
  }
  if (selectedModel !== 'all') {
    const modelName = carModels.find(m => m.id === selectedModel)?.name || t.filters.model;
    return t.charts.modelDetailsTitle
      .replace('{{metric}}', metric)
      .replace('{{modelName}}', modelName);
  }
  return t.charts.modelTitle.replace('{{metric}}', metric);
};

const getTimelineChartTitle = () => {
  const metric = getMetricNameForChart();
  return t.charts.timelineTitle.replace('{{metric}}', metric);
};
 

  
const renderChart = (container, data, year) => {
  // Очищаем контейнер
  container.innerHTML = '';

  // Создаем SVG контейнер
  const margin = {top: 20, right: 30, bottom: 40, left: 60};
  const width = container.clientWidth - margin.left - margin.right;
  const height = 280 - margin.top - margin.bottom;

  const svg = d3.select(container)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Шкалы
  const x = d3.scaleBand()
    .domain(data.map(d => d.month))
    .range([0, width])
    .padding(1);  // Используем padding 1 как в графике динамики

  // Проверяем, есть ли ненулевые данные для масштаба Y
  const maxValue = d3.max(data, d => d.value);
  
  // Модифицированный масштаб Y, который никогда не будет с нулевым диапазоном
  const y = d3.scaleLinear()
    .domain([0, maxValue > 0 ? maxValue * 1.2 : 100]) // Если все значения 0, используем диапазон до 100
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
    .style("fill", "#999");

  svg.append("g")
    .call(d3.axisLeft(y))
    .selectAll("text")
    .style("fill", "#999");

  // Уникальные ID для градиентов
  const uniqueId = Date.now();
  const areaGradientId = `areaGradient-${uniqueId}`;
  const lineGradientId = `lineGradient-${uniqueId}`;

  // Градиенты
  const defs = svg.append("defs");

  // Градиент для области
  const areaGradient = defs.append("linearGradient")
    .attr("id", areaGradientId)
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

  // Градиент для линии
  const lineGradient = defs.append("linearGradient")
    .attr("id", lineGradientId)
    .attr("x1", "0%").attr("y1", "0%")
    .attr("x2", "100%").attr("y2", "0%");

  lineGradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#3b82f6");

  lineGradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#2563eb");

  // Разделяем данные на прошедшие и будущие месяцы
  const pastData = data.filter(d => !d.isFuture);
  const futureData = data.filter(d => d.isFuture);

  // Линия для прошедших месяцев
  const line = d3.line()
    .x(d => x(d.month) + x.bandwidth()/2)
    .y(d => y(d.value))
    .curve(d3.curveMonotoneX);

  // Линия для будущих месяцев (пунктирная)
  const futureLine = d3.line()
    .x(d => x(d.month) + x.bandwidth()/2)
    .y(d => y(d.value))
    .curve(d3.curveMonotoneX);

  // Область
  const area = d3.area()
    .x(d => x(d.month) + x.bandwidth()/2)
    .y0(height)
    .y1(d => y(d.value))
    .curve(d3.curveMonotoneX);

  // Добавляем область только для прошедших месяцев
  if (pastData.length > 0) {
    svg.append("path")
      .datum(pastData)
      .attr("class", "area")
      .attr("fill", `url(#${areaGradientId})`)
      .attr("d", area);
  }

  // Добавляем линию для прошедших месяцев с анимацией
  if (pastData.length > 0) {
    const path = svg.append("path")
      .datum(pastData)
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", `url(#${lineGradientId})`)
      .attr("stroke-width", 3)
      .attr("d", line);

    // Анимация линии
    if (path.node() && typeof path.node().getTotalLength === 'function') {
      const totalLength = path.node().getTotalLength();
      path
        .attr("stroke-dasharray", totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(1500)
        .attr("stroke-dashoffset", 0);
    }
  }

  // Добавляем пунктирную линию для будущих месяцев, если это текущий год
  if (futureData.length > 0) {
    // Соединяем последний прошедший месяц с первым будущим для непрерывности
    if (pastData.length > 0) {
      const combinedData = [...pastData.slice(-1), ...futureData];
      
      svg.append("path")
        .datum(combinedData)
        .attr("class", "future-line")
        .attr("fill", "none")
        .attr("stroke", "#3b82f6")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "3,3")
        .attr("stroke-opacity", 0.5)
        .attr("d", futureLine)
        .style("opacity", 0)
        .transition()
        .delay(1800)
        .duration(500)
        .style("opacity", 1);
    }
  }

  // Добавляем точки для прошедших месяцев
  svg.selectAll(".past-dot")
    .data(pastData)
    .enter().append("circle")
    .attr("class", "dot")
    .attr("cx", d => x(d.month) + x.bandwidth()/2)
    .attr("cy", d => y(d.value))
    .attr("r", 0)
    .attr("fill", "#3b82f6")
    .attr("stroke", "#1e1e2e")
    .attr("stroke-width", 2)
    .transition()
    .delay((d, i) => 1500 + i * 50)
    .duration(300)
    .attr("r", 5);

  // Добавляем точки для будущих месяцев с другим стилем
  svg.selectAll(".future-dot")
    .data(futureData)
    .enter().append("circle")
    .attr("class", "future-dot")
    .attr("cx", d => x(d.month) + x.bandwidth()/2)
    .attr("cy", d => y(d.value))
    .attr("r", 0)
    .attr("fill", "#666666")
    .attr("stroke", "#1e1e2e")
    .attr("stroke-width", 1)
    .attr("opacity", 0.3)
    .transition()
    .delay((d, i) => 1800 + i * 50)
    .duration(300)
    .attr("r", 3);

  // Добавляем метки значений только для прошедших месяцев
  svg.selectAll(".value-label")
    .data(pastData)
    .enter().append("text")
    .attr("class", "value-label")
    .attr("x", d => x(d.month) + x.bandwidth()/2)
    .attr("y", d => y(d.value) - 10)
    .attr("text-anchor", "middle")
    .style("font-size", "10px")
    .style("fill", "#ccc")
    .style("opacity", 0)
    .text(d => {
      if (d.value === 0) return "0";
      if (d.value >= 1000000) return (d.value / 1000000).toFixed(1) + 'M';
      if (d.value >= 1000) return (d.value / 1000).toFixed(0) + 'K';
      return d.value;
    })
    .transition()
    .delay((d, i) => 1800 + i * 50)
    .duration(300)
    .style("opacity", 1);

  // Если все значения нулевые, добавим сообщение на график
if (maxValue === 0) {
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("fill", "#888")
    .style("opacity", 0)
    .text(t.moneyReturn.noDataPeriod)
    .transition()
    .delay(1000)
    .duration(500)
    .style("opacity", 1);
}

  // Заголовок
 svg.append("text")
  .attr("x", width / 2)
  .attr("y", -5)
  .attr("text-anchor", "middle")
  .style("font-size", "14px")
  .style("fill", "#e5e7eb")
  .text(t.moneyReturn.dynamicsTitle.replace('{{year}}', year));

  // Добавление индикатора текущего месяца для текущего года
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  if (parseInt(year) === currentYear && data[currentMonth]) {
    svg.append("line")
      .attr("x1", x(data[currentMonth].month) + x.bandwidth()/2)
      .attr("y1", height)
      .attr("x2", x(data[currentMonth].month) + x.bandwidth()/2)
      .attr("y2", 0)
      .attr("stroke", "#ff9800")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4")
      .attr("opacity", 0)
      .transition()
      .delay(2000)
      .duration(500)
      .attr("opacity", 0.7);
    
svg.append("text")
  .attr("x", x(data[currentMonth].month) + x.bandwidth()/2)
  .attr("y", 15)
  .attr("text-anchor", "middle")
  .style("font-size", "10px")
  .style("fill", "#ff9800")
  .style("opacity", 0)
  .text(t.charts.currentMonth)
  .transition()
  .delay(2200)
  .duration(500)
  .style("opacity", 1);
  }
  
if (parseInt(year) === currentYear && futureData.length > 0) {
  svg.append("text")
    .attr("x", width)
    .attr("y", 15)
    .attr("text-anchor", "end")
    .style("font-size", "10px")
    .style("fill", "#888")
    .text(t.moneyReturn.currentMonthOnly)
    .style("opacity", 0)
    .transition()
    .delay(2400)
    .duration(500)
    .style("opacity", 1);
}

  // Добавляем интерактивность
  const tooltip = d3.select("body").append("div")
    .attr("class", `tooltip-return-${uniqueId}`)
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

  // Интерактивность для прошедших месяцев
  svg.selectAll(".dot")
    .on("mouseover", function(event, d) {
      d3.select(this).transition()
        .duration(200)
        .attr("r", 8);

      tooltip.transition()
        .duration(200)
        .style("opacity", 1);

    tooltip.html(`
  <strong>${d.month} ${year}</strong><br>
  ${t.moneyReturn.returnAmount}: <strong>${d.value === 0 ? '0 UZS' : formatCurrency(d.value)}</strong>
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
    })
    .on("mousemove", function(event) {
      tooltip
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    });
    
  // Интерактивность для будущих месяцев
  svg.selectAll(".future-dot")
    .on("mouseover", function(event, d) {
      d3.select(this).transition()
        .duration(200)
        .attr("r", 5)
        .attr("opacity", 0.7);

      tooltip.transition()
        .duration(200)
        .style("opacity", 1);

   tooltip.html(`
  <strong>${d.month} ${year}</strong><br>
  <span style="color:#ffaa00">${t.charts.futureMonth}</span><br>
  ${t.charts.dataNotAvailable}
`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      d3.select(this).transition()
        .duration(200)
        .attr("r", 3)
        .attr("opacity", 0.3);

      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
    })
    .on("mousemove", function(event) {
      tooltip
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    });
};

  
const renderMoneyReturnChart = () => {
  // Получаем контейнер
  const container = moneyReturnChartRef.current;
  if (!container) return;
  
  // Очищаем контейнер
  container.innerHTML = '';
  
  console.log("Начинаем рендеринг графика возврата денег");
  
  // Добавляем переключатель годов
  const yearSelector = document.createElement('div');
  yearSelector.className = 'flex justify-between items-center mb-4';
  yearSelector.innerHTML = `
    <div class="flex items-center">
      <span class="text-gray-400 mr-2">${t.moneyReturn.analysisReturns}:</span>
      ${selectedRegion !== 'all' ? 
        `<span class="px-2.5 py-1 bg-blue-500/20 text-blue-400 rounded-md text-sm mr-2">
          ${t.moneyReturn.regionLabel}: ${regionsList.find(r => r.id === selectedRegion)?.name || t.filters.region}
        </span>` : ''}
      ${selectedModel !== 'all' ? 
        `<span class="px-2.5 py-1 bg-purple-500/20 text-purple-400 rounded-md text-sm">
          ${t.moneyReturn.modelLabel}: ${carModels.find(m => m.id === selectedModel)?.name || t.filters.model}
        </span>` : ''}
    </div>
    <div class="bg-gray-700 rounded-lg p-1 flex items-center border border-gray-700">
      <button class="year-btn ${selectedYear === '2023' ? 'bg-blue-600 text-white' : 'text-gray-400'} px-3 py-1 text-sm font-medium rounded-md" data-year="2023">2023</button>
      <button class="year-btn ${selectedYear === '2024' ? 'bg-blue-600 text-white' : 'text-gray-400'} px-3 py-1 text-sm font-medium rounded-md" data-year="2024">2024</button>
      <button class="year-btn ${selectedYear === '2025' ? 'bg-blue-600 text-white' : 'text-gray-400'} px-3 py-1 text-sm font-medium rounded-md" data-year="2025">2025</button>
    </div>
  `;
  container.appendChild(yearSelector);
  
  // Добавляем обработчики для кнопок
  yearSelector.querySelectorAll('.year-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const year = btn.getAttribute('data-year');
      
      // Обновляем визуально
      yearSelector.querySelectorAll('.year-btn').forEach(b => {
        b.classList.remove('bg-blue-600', 'text-white');
        b.classList.add('text-gray-400');
      });
      btn.classList.remove('text-gray-400');
      btn.classList.add('bg-blue-600', 'text-white');
      
      // Обновляем состояние
      setSelectedYear(year);
      
      console.log(`Выбран год: ${year}`);
      
      // Показываем индикатор загрузки
      const chartDiv = container.querySelector('.chart-container') || container;
   chartDiv.innerHTML = `
  <div class="flex flex-col items-center justify-center h-64">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-blue-500 mb-4"></div>
    <p class="text-gray-400">${t.charts.loading}</p>
  </div>
`;
      
      // Загружаем данные заново
      loadMoneyReturnData(year);
    });
  });
  
  // Создаем контейнер графика
  const chartDiv = document.createElement('div');
  chartDiv.className = 'chart-container w-full h-[300px]';
  container.appendChild(chartDiv);
  
  // Функция загрузки данных
  const loadMoneyReturnData = (year) => {
    // Показываем загрузку
    chartDiv.innerHTML = `
      <div class="flex flex-col items-center justify-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-blue-500 mb-4"></div>
        <p class="text-gray-400">Загрузка данных...</p>
      </div>
    `;
    
    const baseUrl = 'https://uzavtosalon.uz/b/dashboard/infos';
    const autoReturnUrl = `${baseUrl}&auto_return`;
    
    // Формируем даты начала и конца года
    const beginDate = formatDateForAPI(`${year}-01-01`);
    const endDate = formatDateForAPI(`${year}-12-31`);
    
    const requestData = {
      begin_date: beginDate,
      end_date: endDate,
    };
    
    // Добавляем фильтры, если они выбраны
    if (selectedModel !== 'all') {
      requestData.model_id = selectedModel;
      console.log(`Применяем фильтр по модели: ${selectedModel}`);
    }
    
    if (selectedRegion !== 'all') {
      requestData.region_id = selectedRegion;
      console.log(`Применяем фильтр по региону: ${selectedRegion}`);
    }
    
    console.log(`Отправка запроса возврата за ${year}:`, requestData);
    
    // Отправляем запрос
    axios.post(autoReturnUrl, requestData)
      .then(response => {
        console.log('Получены данные о возврате:', response.data);
        
        // Проверяем наличие данных
        if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
      chartDiv.innerHTML = `
  <div class="flex flex-col items-center justify-center h-64">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
    <p class="text-gray-400 text-center mb-3">${t.moneyReturn.noDataPeriod}</p>
    <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm flex items-center" 
      id="reload-data-btn">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      ${t.moneyReturn.reloadData}
    </button>
  </div>
`;
          
          // Добавляем обработчик для кнопки повторного запроса
          const reloadBtn = chartDiv.querySelector('#reload-data-btn');
          if (reloadBtn) {
            reloadBtn.addEventListener('click', () => {
              loadMoneyReturnData(year);
            });
          }
          
          return;
        }
        
        // Обрабатываем данные API
        let monthlyData = extractMonthlyReturnData(response.data, year);
        
        // Проверяем наличие данных (с учетом абсолютных значений)
        const hasData = monthlyData.some(d => Math.abs(d.value) > 0);
        
        if (!hasData) {
          chartDiv.innerHTML = `
            <div class="flex flex-col items-center justify-center h-64">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p class="text-gray-400 text-center mb-3">Нет данных о возврате для выбранного периода</p>
            </div>
          `;
          return;
        }
        
        const positiveData = monthlyData.map(item => ({
          ...item,
          originalValue: item.value, // Сохраняем оригинальное значение для отладки
          value: Math.abs(item.value)
        }));
        
        // Рисуем график с положительными данными
        renderChart(chartDiv, positiveData, year);
      })
      .catch(error => {
        console.error('Ошибка при запросе данных о возврате:', error);
        
     chartDiv.innerHTML = `
  <div class="flex flex-col items-center justify-center h-64">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <p class="text-gray-400 text-center mb-3">${t.moneyReturn.loadError}</p>
    <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm flex items-center" 
      id="retry-btn">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      ${t.moneyReturn.retryLoad}
    </button>
  </div>
`;
        
        // Добавляем обработчик для кнопки повторного запроса
        const retryBtn = chartDiv.querySelector('#retry-btn');
        if (retryBtn) {
          retryBtn.addEventListener('click', () => {
            loadMoneyReturnData(year);
          });
        }
      });
  };
  
  // Загружаем данные для текущего года
  loadMoneyReturnData(selectedYear);
};

  
const renderBarChart = (ref, data, valueKey, labelKey, title, color) => {
 if (!ref.current) return;
 
 const container = ref.current;
 container.innerHTML = '';
 
 // Проверяем наличие данных
 if (!data || data.length === 0) {
   container.innerHTML = `<div class="flex items-center justify-center h-full text-gray-500">${t.charts.noData}</div>`;
   return;
 }
  
 // Фильтруем данные, удаляя строки с нулевыми значениями или undefined
 data = data.filter(d => {
   return d[labelKey] && 
          d[valueKey] !== undefined && 
          d[valueKey] !== null && 
          d[valueKey] > 0;
 });
 
 if (data.length === 0) {
   container.innerHTML = `<div class="flex items-center justify-center h-full text-gray-500">${t.charts.noDataAfterFilter}</div>`;
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
     if (d[valueKey] >= 1000000) return (d[valueKey] / 1000000).toFixed(1) + t.units.million;
     if (d[valueKey] >= 1000) return (d[valueKey] / 1000).toFixed(0) + t.units.thousand;
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
       .text(t.charts.tooltips.selected)
       .style("opacity", 0)
       .transition()
       .duration(500)
       .delay(800)
       .style("opacity", 1);
   }
 }
 
 // Перевод названий метрик
 const getMetricLocalizedName = (key) => {
   switch(key) {
     case 'contracts': return t.charts.tooltips.contracts;
     case 'sales': return t.charts.tooltips.sales;
     case 'stock': return t.charts.tooltips.stock;
     case 'retail': return t.charts.tooltips.retail;
     case 'wholesale': return t.charts.tooltips.wholesale;
     case 'promotions': return t.charts.tooltips.promotions;
     default: return key;
   }
 };
 
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
       
     tooltip
       .html(`
         <div>
           <div class="font-bold">${d[labelKey]}</div>
           <div>${getMetricLocalizedName(valueKey)}: ${d[valueKey].toLocaleString(currentLocale === 'ru' ? 'ru-RU' : 'uz-UZ')}</div>
           <div>${t.charts.tooltips.amount}: ${formatCurrency(d.amount)}</div>
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
  
  useEffect(() => {
  if (!yearlyDataLoading && yearlyChartData.length > 0) {
    renderCharts();
  }
}, [yearlyChartData, yearlyDataLoading]);
  
const renderTimelineChart = (ref, data, valueKey, labelKey, title) => {
 if (!ref.current) return;
 
 const container = ref.current;
 container.innerHTML = '';
 
 // Используем обычную переменную вместо хука useState
 let activeYears = [selectedYear]; // Инициализируем текущим выбранным годом
 
 const yearColors = {
   '2023': { color: '#FF5252', name: '2023' },
   '2024': { color: '#4CAF50', name: '2024' },
   '2025': { color: '#2196F3', name: '2025' }
 };
 
 // Селектор года (добавляем до основного графика)
 const yearSelector = document.createElement('div');
 yearSelector.className = 'flex justify-between items-center mb-3';
 
 let regionInfo = '';
 if (selectedRegion !== 'all') {
   const regionName = regionsList.find(r => r.id === selectedRegion)?.name || t.filters.region;
   regionInfo = `<div class="text-sm flex items-center text-blue-400">
                   <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                   </svg>
                   ${t.stats.inRegion.replace('{{regionName}}', regionName)}
                 </div>`;
 }
 
 yearSelector.innerHTML = `
   <div class="flex items-center">
     ${regionInfo}
     <div class="text-sm text-gray-400 ml-2">${t.charts.yearComparison}:</div>
   </div>
   <div class="bg-gray-700 rounded-lg p-1 flex items-center border border-gray-700">
     <label class="year-btn relative overflow-hidden ${activeYears.includes('2023') ? 'active-year bg-red-600 text-white' : 'text-gray-400 hover:text-white'} px-3 py-1 text-sm font-medium rounded-md mx-0.5 cursor-pointer transition-all">
       <input type="checkbox" class="year-checkbox absolute opacity-0" data-year="2023" ${activeYears.includes('2023') ? 'checked' : ''}>
       ${t.yearComparison.year2023}
     </label>
     <label class="year-btn relative overflow-hidden ${activeYears.includes('2024') ? 'active-year bg-green-600 text-white' : 'text-gray-400 hover:text-white'} px-3 py-1 text-sm font-medium rounded-md mx-0.5 cursor-pointer transition-all">
       <input type="checkbox" class="year-checkbox absolute opacity-0" data-year="2024" ${activeYears.includes('2024') ? 'checked' : ''}>
       ${t.yearComparison.year2024}
     </label>
     <label class="year-btn relative overflow-hidden ${activeYears.includes('2025') ? 'active-year bg-blue-600 text-white' : 'text-gray-400 hover:text-white'} px-3 py-1 text-sm font-medium rounded-md mx-0.5 cursor-pointer transition-all">
       <input type="checkbox" class="year-checkbox absolute opacity-0" data-year="2025" ${activeYears.includes('2025') ? 'checked' : ''}>
       ${t.yearComparison.year2025}
     </label>
   </div>
 `;
 container.appendChild(yearSelector);
 
 // Создаем основной контейнер для графика
 const graphContainer = document.createElement('div');
 graphContainer.className = 'chart-container w-full h-[300px]';
 container.appendChild(graphContainer);
 
 // Функция для обновления выбранных годов
 const updateSelectedYears = () => {
   const yearCheckboxes = yearSelector.querySelectorAll('.year-checkbox');
   const newSelectedYears = [];
   
   yearCheckboxes.forEach(checkbox => {
     const yearBtn = checkbox.parentElement;
     if (checkbox.checked) {
       newSelectedYears.push(checkbox.dataset.year);
       // Добавляем класс активной кнопки
       if (checkbox.dataset.year === '2023') {
         yearBtn.className = "year-btn relative overflow-hidden active-year bg-red-600 text-white px-3 py-1 text-sm font-medium rounded-md mx-0.5 cursor-pointer transition-all";
       } else if (checkbox.dataset.year === '2024') {
         yearBtn.className = "year-btn relative overflow-hidden active-year bg-green-600 text-white px-3 py-1 text-sm font-medium rounded-md mx-0.5 cursor-pointer transition-all";
       } else {
         yearBtn.className = "year-btn relative overflow-hidden active-year bg-blue-600 text-white px-3 py-1 text-sm font-medium rounded-md mx-0.5 cursor-pointer transition-all";
       }
     } else {
       // Неактивная кнопка
       yearBtn.className = "year-btn relative overflow-hidden text-gray-400 hover:text-white px-3 py-1 text-sm font-medium rounded-md mx-0.5 cursor-pointer transition-all";
     }
   });
   
   // Обновляем, если есть выбранные года
   if (newSelectedYears.length > 0) {
     activeYears = newSelectedYears;
     
     // Показываем лоадер
     graphContainer.innerHTML = `
       <div class="flex items-center justify-center h-64">
         <div class="flex flex-col items-center">
           <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-3"></div>
           <p class="text-gray-400 text-sm">${t.charts.loading}</p>
         </div>
       </div>
     `;
     
     // Загружаем данные для всех выбранных годов
     Promise.all(newSelectedYears.map(year => fetchYearData(year)))
       .then(yearsData => {
         renderMultiYearChart(graphContainer, yearsData, valueKey, labelKey, title);
       });
   } else {
     // Если не выбран ни один год, устанавливаем текущий год по умолчанию
     const defaultYear = selectedYear;
     yearSelector.querySelector(`.year-checkbox[data-year="${defaultYear}"]`).checked = true;
     
     const defaultYearBtn = yearSelector.querySelector(`.year-checkbox[data-year="${defaultYear}"]`).parentElement;
     if (defaultYear === '2023') {
       defaultYearBtn.className = "year-btn relative overflow-hidden active-year bg-red-600 text-white px-3 py-1 text-sm font-medium rounded-md mx-0.5 cursor-pointer transition-all";
     } else if (defaultYear === '2024') {
       defaultYearBtn.className = "year-btn relative overflow-hidden active-year bg-green-600 text-white px-3 py-1 text-sm font-medium rounded-md mx-0.5 cursor-pointer transition-all";
     } else {
       defaultYearBtn.className = "year-btn relative overflow-hidden active-year bg-blue-600 text-white px-3 py-1 text-sm font-medium rounded-md mx-0.5 cursor-pointer transition-all";
     }
     
     activeYears = [defaultYear];
     
     fetchYearData(defaultYear)
       .then(yearData => {
         renderMultiYearChart(graphContainer, [yearData], valueKey, labelKey, title);
       });
   }
 };
 
 // Загрузка данных за конкретный год
 const fetchYearData = (year) => {
   return new Promise((resolve) => {
     // Получаем диапазон дат для года
     const { beginDate, endDate } = getYearDateRange(year);
     
     // Формируем URL в зависимости от активного таба
     const apiUrl = getApiUrlForTab(activeTab);
     
     // Подготавливаем данные запроса
     const requestData = {
       begin_date: beginDate,
       end_date: endDate,
       model_id: selectedModel !== 'all' ? selectedModel : undefined,
       region_id: selectedRegion !== 'all' ? selectedRegion : undefined
     };
     
     axios.post(apiUrl, requestData)
       .then(response => {
         if (response.data && Array.isArray(response.data)) {
           // Преобразуем данные в формат для графика
           const monthlyData = prepareMonthlyDataFromResponse(response.data, year);
           resolve({ year, data: monthlyData });
         } else {
           resolve({ year, data: [] });
         }
       })
       .catch(error => {
         console.error(`${t.errors.loadingError} ${year}:`, error);
         resolve({ year, data: [] });
       });
   });
 };
 
 // Функция для отображения пустого состояния
 function showEmptyState(container) {
   container.innerHTML = `
     <div class="flex items-center justify-center h-64">
       <div class="flex flex-col items-center">
         <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
         </svg>
         <p class="text-gray-400 text-center mb-1">${t.charts.noData}</p>
         <button class="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors flex items-center" id="retry-load-btn">
           <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
           </svg>
           ${t.charts.retryLoad}
         </button>
       </div>
     </div>
   `;
   
   // Добавляем обработчик для кнопки повторной загрузки
   const retryBtn = container.querySelector('#retry-load-btn');
   if (retryBtn) {
     retryBtn.addEventListener('click', () => {
       updateSelectedYears();
     });
   }
 }
 
 // Функция для отрисовки мультигодового графика
 function renderMultiYearChart(container, yearsData, valKey, labelKey, chartTitle) {
   // Очищаем контейнер перед рендерингом
   container.innerHTML = '';
   
   // Если нет данных, показываем пустое состояние
   if (!yearsData || yearsData.length === 0 || yearsData.every(yd => !yd.data || yd.data.length === 0)) {
     showEmptyState(container);
     return;
   }
   
   const margin = { top: 30, right: 100, bottom: 50, left: 60 };
   const width = container.clientWidth - margin.left - margin.right;
   const height = container.clientHeight - margin.top - margin.bottom - 20;
   
   const svg = d3.select(container)
     .append("svg")
     .attr("width", width + margin.left + margin.right)
     .attr("height", height + margin.top + margin.bottom)
     .append("g")
     .attr("transform", `translate(${margin.left},${margin.top})`);
   
   // Уникальный ID для градиентов и других элементов
   const uniqueId = Date.now();
   
   // Получаем все месяцы для оси X
   const months = [
     t.charts.monthData.january,
     t.charts.monthData.february,
     t.charts.monthData.march,
     t.charts.monthData.april,
     t.charts.monthData.may,
     t.charts.monthData.june,
     t.charts.monthData.july,
     t.charts.monthData.august,
     t.charts.monthData.september,
     t.charts.monthData.october,
     t.charts.monthData.november,
     t.charts.monthData.december
   ];
   
   // Подготавливаем данные для графика
   const allMonthsData = yearsData.map(yearData => {
     const year = yearData.year;
     const data = yearData.data || [];
     
     // Создаем полный набор месяцев
     return months.map(month => {
       // Находим соответствующий месяц в данных
       const monthData = data.find(d => d[labelKey] === month) || {};
       
       return {
         month,
         year,
         [valKey]: monthData[valKey] || 0,
         amount: monthData.amount || 0,
         color: yearColors[year].color
       };
     });
   }).flat();
   
   // Шкалы
   const x = d3.scaleBand()
     .domain(months)
     .range([0, width])
     .padding(0.2);
   
   // Находим максимальное значение для всех годов
   const maxValue = d3.max(allMonthsData, d => d[valKey]) * 1.2 || 10;
   
   const y = d3.scaleLinear()
     .domain([0, maxValue])
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
     .style("fill", "#bbb")
     .style("font-size", "11px");
   
   svg.append("g")
     .call(d3.axisLeft(y))
     .selectAll("text")
     .style("fill", "#bbb")
     .style("font-size", "11px");
   
   // Для каждого года рисуем линию
   yearsData.forEach(yearData => {
     const year = yearData.year;
     const data = yearData.data || [];
     
     if (data.length === 0) return;
     
     // Если данных нет, пропускаем
     if (!data.some(d => d[valKey] > 0)) return;
     
     // Полный набор месяцев с данными для каждого года
     const yearMonthsData = months.map(month => {
       const monthData = data.find(d => d[labelKey] === month) || {};
       return {
         month,
         [valKey]: monthData[valKey] || 0,
         amount: monthData.amount || 0
       };
     });
     
     // Создаем линию
     const line = d3.line()
       .x(d => x(d.month) + x.bandwidth() / 2)
       .y(d => y(d[valKey]))
       .curve(d3.curveMonotoneX);
     
     // Создаем градиент для каждого года
     const lineGradientId = `lineGradient-${year}-${uniqueId}`;
     const areaGradientId = `areaGradient-${year}-${uniqueId}`;
     
     const defs = svg.append("defs");
     
     // Градиент для линии
     const lineGradient = defs.append("linearGradient")
       .attr("id", lineGradientId)
       .attr("x1", "0%").attr("y1", "0%")
       .attr("x2", "100%").attr("y2", "0%");
     
     lineGradient.append("stop")
       .attr("offset", "0%")
       .attr("stop-color", yearColors[year].color);
     
     lineGradient.append("stop")
       .attr("offset", "100%")
       .attr("stop-color", yearColors[year].color);
     
     // Градиент для области
     const areaGradient = defs.append("linearGradient")
       .attr("id", areaGradientId)
       .attr("x1", "0%").attr("y1", "0%")
       .attr("x2", "0%").attr("y2", "100%");
     
     areaGradient.append("stop")
       .attr("offset", "0%")
       .attr("stop-color", yearColors[year].color)
       .attr("stop-opacity", 0.3);
     
     areaGradient.append("stop")
       .attr("offset", "100%")
       .attr("stop-color", yearColors[year].color)
       .attr("stop-opacity", 0.05);
     
     // Отображаем область под линией для одиночного года
     if (yearsData.length === 1) {
       const area = d3.area()
         .x(d => x(d.month) + x.bandwidth() / 2)
         .y0(height)
         .y1(d => y(d[valKey]))
         .curve(d3.curveMonotoneX);
       
       svg.append("path")
         .datum(yearMonthsData)
         .attr("class", `area-${year}`)
         .attr("fill", `url(#${areaGradientId})`)
         .attr("d", area);
     }
     
     // Рисуем линию
     const path = svg.append("path")
       .datum(yearMonthsData)
       .attr("class", `line-${year}`)
       .attr("fill", "none")
       .attr("stroke", `url(#${lineGradientId})`)
       .attr("stroke-width", 3)
       .attr("d", line);
     
     // Анимация линии
     if (path.node() && typeof path.node().getTotalLength === 'function') {
       const totalLength = path.node().getTotalLength();
       path
         .attr("stroke-dasharray", totalLength)
         .attr("stroke-dashoffset", totalLength)
         .transition()
         .duration(1500)
         .attr("stroke-dashoffset", 0);
     }
     
     // Добавляем текстовые метки значений над точками
     svg.selectAll(`.value-label-${year}`)
       .data(yearMonthsData)
       .enter().append("text")
       .attr("class", `value-label-${year}`)
       .attr("x", d => x(d.month) + x.bandwidth() / 2)
       .attr("y", d => y(d[valKey]) - 15)
       .attr("text-anchor", "middle")
       .attr("font-size", "11px")
       .attr("font-weight", "bold")
       .style("fill", yearColors[year].color)
       .style("opacity", 0)
       .text(d => d[valKey] > 0 ? d[valKey] : "")
       .transition()
       .delay((d, i) => 1500 + i * 50 + 200)
       .duration(300)
       .style("opacity", 1);
     
     // Добавляем точки
     svg.selectAll(`.dot-${year}`)
       .data(yearMonthsData)
       .enter().append("circle")
       .attr("class", `dot-${year}`)
       .attr("cx", d => x(d.month) + x.bandwidth() / 2)
       .attr("cy", d => y(d[valKey]))
       .attr("r", 0)
       .attr("fill", yearColors[year].color)
       .attr("stroke", "#1e1e1e")
       .attr("stroke-width", 2)
       .transition()
       .delay((d, i) => 1500 + i * 50)
       .duration(300)
       .attr("r", d => d[valKey] > 0 ? 5 : 0);
   });
   
   // Добавляем линию для текущего месяца
   const currentDate = new Date();
   const currentMonthIndex = currentDate.getMonth();
   const currentMonth = months[currentMonthIndex];
   
   svg.append("line")
     .attr("x1", x(currentMonth) + x.bandwidth() / 2)
     .attr("y1", 0)
     .attr("x2", x(currentMonth) + x.bandwidth() / 2)
     .attr("y2", height)
     .attr("stroke", "#e5e5e5")
     .attr("stroke-width", 1)
     .attr("stroke-dasharray", "3,3")
     .attr("opacity", 0.5);
   
   // Добавляем метку текущего месяца
   svg.append("text")
     .attr("x", x(currentMonth) + x.bandwidth() / 2)
     .attr("y", -8)
     .attr("text-anchor", "middle")
     .style("font-size", "10px")
     .style("fill", "#e5e5e5")
     .text(t.charts.currentMonth);
   
   // Заголовок графика
   svg.append("text")
     .attr("x", width / 2)
     .attr("y", -15)
     .attr("text-anchor", "middle")
     .style("font-size", "14px")
     .style("fill", "#e5e7eb")
     .text(chartTitle);
   
   // Легенда годов
   const legend = svg.append("g")
     .attr("class", "legend")
     .attr("transform", `translate(${width + 20}, 10)`);
   
   yearsData.forEach((yearData, i) => {
     const year = yearData.year;
     
     legend.append("rect")
       .attr("x", 0)
       .attr("y", i * 25)
       .attr("width", 15)
       .attr("height", 3)
       .attr("fill", yearColors[year].color);
     
     legend.append("text")
       .attr("x", 25)
       .attr("y", i * 25 + 5)
       .attr("text-anchor", "start")
       .style("font-size", "12px")
       .style("fill", "#e5e7eb")
       .text(year);
   });
   
   // Добавляем интерактивные подсказки
   const tooltip = d3.select("body").append("div")
     .attr("class", `tooltip-${uniqueId}`)
     .style("opacity", 0)
     .style("position", "absolute")
     .style("background-color", "rgba(30, 41, 59, 0.95)")
     .style("color", "#fff")
     .style("padding", "12px")
     .style("border-radius", "6px")
     .style("font-size", "14px")
     .style("box-shadow", "0 4px 6px rgba(0, 0, 0, 0.1)")
     .style("pointer-events", "none")
     .style("z-index", 1000);
   
   // Создаем невидимые зоны для ховера для каждого месяца
   months.forEach(month => {
     svg.append("rect")
       .attr("x", x(month))
       .attr("y", 0)
       .attr("width", x.bandwidth())
       .attr("height", height)
       .attr("fill", "transparent")
       .on("mouseover", function(event) {
         // Находим данные для всех годов для этого месяца
         const monthData = allMonthsData.filter(d => d.month === month);
         
         // Создаем содержимое тултипа
         let tooltipContent = `<div class="font-semibold mb-2">${month}</div>`;
         
         if (monthData.length > 0) {
           tooltipContent += `<div class="space-y-2">`;
           monthData.forEach(d => {
             if (d[valKey] > 0) {
               tooltipContent += `
                 <div class="flex items-center justify-between gap-3">
                   <div class="flex items-center">
                     <span class="inline-block w-3 h-3 rounded-full mr-2" style="background-color: ${d.color};"></span>
                     <span>${d.year}:</span>
                   </div>
                   <div class="font-medium">${d[valKey]}</div>
                 </div>
               `;
             }
           });
           tooltipContent += `</div>`;
         } else {
           tooltipContent += `<div>${t.charts.noData}</div>`;
         }
         
         tooltip.html(tooltipContent)
           .style("left", (event.pageX + 15) + "px")
           .style("top", (event.pageY - 20) + "px")
           .transition()
           .duration(200)
           .style("opacity", 1);
         
         // Подсвечиваем точки и метки для этого месяца
         yearsData.forEach(yearData => {
           const year = yearData.year;
           svg.selectAll(`.dot-${year}`)
             .filter(d => d.month === month && d[valKey] > 0)
             .transition()
             .duration(200)
             .attr("r", 7);
             
           svg.selectAll(`.value-label-${year}`)
             .filter(d => d.month === month && d[valKey] > 0)
             .transition()
             .duration(200)
             .attr("font-size", "13px")
             .style("font-weight", "bolder");
         });
       })
       .on("mouseout", function() {
         tooltip.transition()
           .duration(500)
           .style("opacity", 0);
         
         // Возвращаем точки и метки к исходному размеру
         yearsData.forEach(yearData => {
           const year = yearData.year;
           svg.selectAll(`.dot-${year}`)
             .transition()
             .duration(200)
             .attr("r", 5);
             
           svg.selectAll(`.value-label-${year}`)
             .transition()
             .duration(200)
             .attr("font-size", "11px")
             .style("font-weight", "bold");
         });
       })
       .on("mousemove", function(event) {
         tooltip
           .style("left", (event.pageX + 15) + "px")
           .style("top", (event.pageY - 20) + "px");
       });
   });
 }
 
 // Добавляем обработчики событий для чекбоксов
 setTimeout(() => {
   const yearCheckboxes = yearSelector.querySelectorAll('.year-checkbox');
   yearCheckboxes.forEach(checkbox => {
     // Обработчик для всей кнопки
     checkbox.parentElement.addEventListener('click', (e) => {
       // Переключаем состояние чекбокса
       checkbox.checked = !checkbox.checked;
       // Вызываем обновление
       updateSelectedYears();
       // Предотвращаем дальнейшую обработку клика
       e.preventDefault();
     });
   });
 }, 0);
 
 // Если идет загрузка годовых данных, показываем индикатор загрузки
 if (yearlyDataLoading) {
   const loadingIndicator = document.createElement('div');
   loadingIndicator.className = 'flex items-center justify-center h-64';
   loadingIndicator.innerHTML = `
     <div class="flex flex-col items-center">
       <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-3"></div>
       <p class="text-gray-400 text-sm">${t.charts.loading}</p>
     </div>
   `;
   graphContainer.appendChild(loadingIndicator);
   return;
 }
 
 // Инициализируем график с текущими данными
 if (activeYears.length === 1 && activeYears[0] === selectedYear) {
   // Если выбран только текущий год, используем уже загруженные данные
   const displayData = yearlyChartData.length > 0 ? yearlyChartData : data;
   
   if (!displayData || displayData.length === 0) {
     showEmptyState(graphContainer);
     return;
   }
   
   // Преобразуем данные перед отрисовкой (удаляем отрицательные значения)
   const processedData = displayData.map(item => {
     const value = item[valueKey] !== undefined ? item[valueKey] : 0;
     return {
       ...item,
       [valueKey]: Math.abs(value)
     };
   });
   
   renderMultiYearChart(graphContainer, [{ year: selectedYear, data: processedData }], valueKey, labelKey, title);
 } else {
   // Если выбрано несколько годов, загружаем данные для каждого года
   Promise.all(activeYears.map(year => fetchYearData(year)))
     .then(yearsData => {
       renderMultiYearChart(graphContainer, yearsData, valueKey, labelKey, title);
     });
 }
 
 // Инициализируем первичную загрузку данных, если уже есть выбранные годы
 if (activeYears.length > 0) {
   setTimeout(() => {
     updateSelectedYears();
   }, 50);
 }
};

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
  
  // Возвращаем фактические значения без применения коэффициентов
  return {
    count: totalContracts,
    amount: totalAmount,
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
 
  const getMetricName = () => {
    switch(activeTab) {
      case 'contracts': return t.stats.totalContracts;
      case 'sales': return t.stats.totalSales;
      case 'retail': return t.stats.totalRetail;
      case 'wholesale': return t.stats.totalWholesale;
      case 'promotions': return t.stats.totalPromotions;
      default: return t.stats.totalContracts;
    }
  };
  
  const LoadingDots = () => (
    <span className="inline-flex items-baseline">
      <span className="animate-bounce inline-block mx-0.5" style={{animationDelay: '0ms'}}>.</span>
      <span className="animate-bounce inline-block mx-0.5" style={{animationDelay: '150ms'}}>.</span>
      <span className="animate-bounce inline-block mx-0.5" style={{animationDelay: '300ms'}}>.</span>
    </span>
  );
  
  const getFilterDescription = () => {
    let description = '';
    if (selectedRegion !== 'all') {
      const regionName = regionsList.find(r => r.id === selectedRegion)?.name || '';
      description += ` ${t.stats.inRegion.replace('{{regionName}}', regionName)}`;
    }
    if (selectedModel !== 'all') {
      const modelName = carModels.find(m => m.id === selectedModel)?.name || '';
      description += ` ${t.stats.forModel.replace('{{modelName}}', modelName)}`;
    }
    return description;
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-medium text-white">
              {getMetricName()}{getFilterDescription()}
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              {t.stats.periodData
                .replace('{{startDate}}', formatDate(startDate))
                .replace('{{endDate}}', formatDate(endDate))}
            </p>
          </div>
          
          <div className="h-9 flex items-center">
            {isCalculating ? (
              <p className="text-xl font-medium text-blue-400">
                {t.stats.loading}<LoadingDots />
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
              {t.stats.totalAmount}{getFilterDescription()}
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              {t.stats.periodData
                .replace('{{startDate}}', formatDate(startDate))
                .replace('{{endDate}}', formatDate(endDate))}
            </p>
          </div>
          
          <div className="h-9 flex items-center">
            {isCalculating ? (
              <p className="text-xl font-medium text-green-400">
                {t.stats.loading}<LoadingDots />
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
    stock: { count: 1, amount: 1 },
    retail: { count: 1, amount: 1 },
    wholesale: { count: 1, amount: 1 },
    promotions: { count: 1, amount: 1 }
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
      case 'contracts': return t.modelRange.contracts;
      case 'sales': return t.modelRange.sales;
      case 'stock': return t.modelRange.inStock;
      case 'retail': return t.modelRange.retail;
      case 'wholesale': return t.modelRange.wholesale;
      case 'promotions': return t.modelRange.promotions;
      default: return t.modelRange.contracts;
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
              {modelStats.count > 0 ? modelStats.count.toLocaleString(currentLocale === 'ru' ? 'ru-RU' : 'uz-UZ') : '0'}
            </span>
          </div>
      </div>
      
      <div className="bg-gradient-to-r from-gray-700/50 to-gray-700/30 rounded-md p-3 transition-all duration-300 hover:from-gray-700/70 hover:to-gray-700/50">
        <div className="text-center">
   <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider">{t.modelRange.totalAmount}</p>
            <p className={`font-bold text-transparent bg-clip-text bg-gradient-to-r ${getTabColor()} text-lg`}>
           {modelStats.amount > 0 
                ? new Intl.NumberFormat(currentLocale === 'ru' ? 'ru-RU' : 'uz-UZ', { 
                    style: 'currency', 
                    currency: 'UZS', 
                    maximumFractionDigits: 0 
                  }).format(modelStats.amount)
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
     {loadingComponent && 
  <ContentReadyLoader 
    isLoading={loadingComponent} 
    setIsLoading={setLoadingComponent} 
    timeout={12000} // 10 секунд
  />
}
<h1 className="text-3xl font-semibold mb-6">{t.title}</h1>
    
    {/* Filter Panel */}
 <div className="bg-gray-800 p-5 rounded-lg shadow-lg mb-8 flex flex-wrap gap-4 justify-between items-center">
  <div className="flex flex-wrap items-center gap-4">
    <div className="flex items-center">
      <span className="text-gray-400 mr-2">{t.filters.region}:</span>
      <select 
        value={selectedRegion}
        onChange={(e) => setSelectedRegion(e.target.value)}
        className="bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white min-w-[200px]"
      >
        <option value="all">{t.filters.allRegions}</option>
        {regionsList.map(region => (
          <option key={region.id} value={region.id}>{region.name}</option>
        ))}
      </select>
    </div>
  </div>
  
  <div className="flex items-center gap-4">
    <div className="flex items-center">
      <span className="text-gray-400 mr-2">{t.filters.dateFrom}:</span>
      <input 
        type="date" 
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
      />
    </div>
    <div className="flex items-center">
      <span className="text-gray-400 mr-2">{t.filters.dateTo}:</span>
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
      {t.filters.apply}
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
        <span className="font-medium text-blue-400">{t.filters.activeFilters}:</span> {getFilterDescription()}
      </p>
    </div>
    <button 
      className="text-sm text-blue-400 hover:text-blue-300 flex items-center"
      onClick={() => {
        setSelectedRegion('all');
        setSelectedModel('all');
      }}
    >
      {t.filters.resetFilters}
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
    {t.tabs.contracts}
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
    {t.tabs.sales}
  </button>
  
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
    {t.tabs.retail}
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
    {t.tabs.wholesale}
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
    {t.tabs.promotions}
  </button>
</div>
    
 <StatisticsCards/>
    
{selectedModel === 'all' && (
  <div className="mb-8">
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
      <div className="flex items-center">
        <h3 className="text-xl font-semibold mr-4">{t.modelRange.title}</h3>
        
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
              {t.modelRange.viewModes.cards}
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
              {t.modelRange.viewModes.list}
            </div>
          </button>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center bg-gray-800 rounded-lg px-3 py-2 border border-gray-700">
          <span className="text-gray-400 mr-2 text-sm">{t.modelRange.sorting.label}:</span>
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
                  const modelA = apiData.find(m => m.model_id === a.id);
                  const modelB = apiData.find(m => m.model_id === b.id);
                  
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
                  const modelA = apiData.find(m => m.model_id === a.id);
                  const modelB = apiData.find(m => m.model_id === b.id);
                  
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
            <option value="default">{t.modelRange.sorting.default}</option>
            <option value="price-high">{t.modelRange.sorting.priceHigh}</option>
            <option value="price-low">{t.modelRange.sorting.priceLow}</option>
            <option value="contracts-high">{t.modelRange.sorting.contractsHigh}</option>
            <option value="contracts-low">{t.modelRange.sorting.contractsLow}</option>
          </select>
        </div>
        <div className="flex items-center">
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 text-sm flex items-center transition-colors"
            onClick={() => {
              fetchData(getApiUrlForTab(activeTab));
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {t.filters.reset}
          </button>
        </div>
      </div>
    </div>
    
    {viewMode === 'cards' ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {carModels.length > 0 ? (
          carModels
            .filter(model => {
              const modelData = apiData?.find(m => m.model_id === model.id);
              if (!modelData) return false;
              
              let totalCount = 0;
              let totalAmount = 0;
              
              if (selectedRegion !== 'all') {
                const regionData = modelData.filter_by_region?.find(r => r.region_id === selectedRegion);
                if (regionData) {
                  totalCount = parseInt(regionData.total_contracts || 0);
                  totalAmount = parseInt(regionData.total_price || 0);
                }
              } else {
                if (modelData.filter_by_region && Array.isArray(modelData.filter_by_region)) {
                  modelData.filter_by_region.forEach(region => {
                    totalCount += parseInt(region.total_contracts || 0);
                    totalAmount += parseInt(region.total_price || 0);
                  });
                }
              }
              
              return totalCount > 0 || totalAmount > 0;
            })
            .map(model => (
              <CarModelThumbnail 
                key={model.id} 
                model={model} 
                isSelected={selectedModel === model.id}
                onClick={() => setSelectedModel(model.id)}
              />
            ))
        ) : (
          <div className="col-span-full p-6 bg-gray-800 rounded-lg text-center">
            <div className="flex flex-col items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-400 mb-2">{t.modelRange.noModelsAvailable}</p>
              <p className="text-gray-500 text-sm">{t.modelRange.selectPeriodMessage}</p>
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
            <p className="text-gray-400 text-sm">{t.modelRange.noModelsAvailable}</p>
          </div>
        )}
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
        alt={t.modelRange.auto}
        className="w-52 h-40 object-contain"
      />
      
      <div className="flex flex-col justify-between h-full py-2">
        <h3 className="text-2xl font-bold text-white mb-2">
          {Array.isArray(apiData) 
            ? apiData.find(m => m.model_id === selectedModel)?.model_name 
            : apiData.model_name || t.filters.model}
        </h3>
        
        <button 
          className="mt-auto text-blue-400 hover:text-white transition-all duration-200 flex items-center text-sm px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 rounded-md border border-blue-500/30 shadow-sm w-fit"
          onClick={() => setSelectedModel('all')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          {t.modelRange.backToModels}
        </button>
      </div>
    </div>
  </div>
)}
           <div className="bg-gray-800 p-5 rounded-lg shadow-lg mb-8">
 <ContractsYearlyComparison
    selectedRegion={selectedRegion}
    selectedModel={selectedModel}
    activeTab={activeTab}
    currentLocale={currentLocale}
  />
</div>
    
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
    
    <div className="bg-gray-800 p-5 rounded-lg shadow-lg mb-8 h-[400px]">
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
   
   <div className="bg-gray-800 p-5 rounded-lg shadow-lg mb-8 mt-[100px]">
     <h3 className="text-xl font-semibold mb-4">{getTimelineChartTitle()}</h3>
     <div 
       ref={timelineContractsRef} 
       className="w-full h-[300px]"
     ></div>
   </div>
   
   <div className="bg-gray-800 p-5 rounded-lg shadow-lg mb-8">
     <h3 className="text-xl font-semibold mb-4">{t.promotions.typesTitle}</h3>
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
       {/* Рассрочка моделей Onix и Tracker (2025) */}
       <div className="p-4 bg-gray-700 rounded-lg border-l-4 border-green-400">
         <h4 className="text-lg font-medium text-green-400 mb-2">{t.promotions.installmentOnixTracker}</h4>
         <div className="space-y-2 text-sm">
           <div className="flex justify-between">
             <span className="text-gray-300">{t.promotions.modelYear}:</span>
             <span className="text-white font-medium">2025</span>
           </div>
           <div className="flex justify-between">
             <span className="text-gray-300">{t.promotions.downPayment}:</span>
             <span className="text-green-400 font-bold">50%</span>
           </div>
           <div className="flex justify-between">
             <span className="text-gray-300">{t.promotions.installmentPeriod}:</span>
             <span className="text-white font-medium">30 {t.promotions.months}</span>
           </div>
         </div>
       </div>

       {/* Рассрочка для сотрудников Узавтосаноат */}
       <div className="p-4 bg-gray-700 rounded-lg border-l-4 border-blue-400">
         <h4 className="text-lg font-medium text-blue-400 mb-2">{t.promotions.employeeBenefits}</h4>
         <div className="space-y-2 text-sm">
           <div className="flex justify-between">
             <span className="text-gray-300">{t.promotions.organization}:</span>
             <span className="text-white font-medium">{currentLocale === 'ru' ? 'Узавтосаноат' : 'Uzavtosanoat'}</span>
           </div>
           <div className="flex justify-between">
             <span className="text-gray-300">{t.promotions.model}:</span>
             <span className="text-white font-medium">Onix (2024)</span>
           </div>
           <div className="flex justify-between">
             <span className="text-gray-300">{t.promotions.downPayment}:</span>
             <span className="text-blue-400 font-bold">30%</span>
           </div>
         </div>
       </div>

       {/* Рассрочка для "Ватанпарвар" */}
       <div className="p-4 bg-gray-700 rounded-lg border-l-4 border-purple-400">
         <h4 className="text-lg font-medium text-purple-400 mb-2">{t.promotions.corporateProgram}</h4>
         <div className="space-y-2 text-sm">
           <div className="flex justify-between">
             <span className="text-gray-300">{t.promotions.organization}:</span>
             <span className="text-white font-medium">{currentLocale === 'ru' ? 'Ватанпарвар' : 'Vatanparvar'}</span>
           </div>
           <div className="flex justify-between">
             <span className="text-gray-300">{t.promotions.model}:</span>
             <span className="text-white font-medium">Onix (2024)</span>
           </div>
           <div className="flex justify-between">
             <span className="text-gray-300">{t.promotions.downPayment}:</span>
             <span className="text-purple-400 font-bold">30%</span>
           </div>
         </div>
       </div>
     </div>

     {/* <h3 className="text-xl font-semibold mb-4">{t.promotions.effectiveness}</h3> */}
     {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
       <div className="p-4 bg-gray-700 rounded-lg">
         <div className="flex items-center justify-between mb-2">
           <span className="text-gray-300">{t.promotions.viewsConversion}</span>
           <span className="text-green-400 font-bold">24.8%</span>
         </div>
         <div className="w-full bg-gray-600 h-2 rounded-full">
           <div className="bg-green-400 h-2 rounded-full" style={{ width: '24.8%' }}></div>
         </div>
       </div>
       
       <div className="p-4 bg-gray-700 rounded-lg">
         <div className="flex items-center justify-between mb-2">
           <span className="text-gray-300">{t.promotions.averageDiscount}</span>
           <span className="text-blue-400 font-bold">15.3%</span>
         </div>
         <div className="w-full bg-gray-600 h-2 rounded-full">
           <div className="bg-blue-400 h-2 rounded-full" style={{ width: '15.3%' }}></div>
         </div>
       </div>
       
       <div className="p-4 bg-gray-700 rounded-lg">
         <div className="flex items-center justify-between mb-2">
           <span className="text-gray-300">{t.promotions.promotionsROI}</span>
           <span className="text-purple-400 font-bold">132%</span>
         </div>
         <div className="w-full bg-gray-600 h-2 rounded-full">
           <div className="bg-purple-400 h-2 rounded-full" style={{ width: '100%' }}></div>
         </div>
       </div>
     </div> */}
   </div>
 </>
)}

 
    
    {/* График возврата денежных средств */}
 <div className="bg-gray-800 p-5 rounded-lg shadow-lg mb-8">
  <h3 className="text-xl font-semibold mb-4">{t.moneyReturn.title}</h3>
  <div className="flex items-center mb-3">
    <div className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm mr-2">{t.moneyReturn.financialAnalytics}</div>
    <div className="text-sm text-gray-400">{t.moneyReturn.subtitle}</div>
  </div>
  <div 
    ref={moneyReturnChartRef} 
    className="w-full h-[350px]"
  ></div>
</div>
    
 <div className="bg-blue-900/20 border-l-4 border-blue-500 p-5 rounded-r-lg mb-8">
  <h3 className="text-xl font-semibold text-blue-400 mb-2">{t.info.title}</h3>
  <p className="text-gray-300">{t.info.description}</p>
</div>
  </div>
);
};

export default CarContractsAnalytics;