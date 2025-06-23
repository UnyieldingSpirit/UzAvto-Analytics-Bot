"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as d3 from 'd3';
import { D3Visualizer } from '../../utils/dataVisualizer';
import { useThemeStore } from '../../store/theme';

import { useTranslation } from '../../hooks/useTranslation';
import { financialAnalyticsLocale } from '../components/locales/financialAnalytics';
import { useAuth } from '../../hooks/useAuth';
import { axiosInstance } from '../../utils/axiosConfig';


// Константы типов продаж
const SALE_TYPES = {
  RETAIL: {
    id: 'retail',
    name: 'Розничные продажи',
    color: '#3b82f6'
  },
  WHOLESALE: {
    id: 'wholesale',
    name: 'Оптовые продажи',
    color: '#8b5cf6'
  }
};

// Основной компонент
export default function EnhancedFinancialAnalytics() {
  // Состояния для управления данными и фильтрами
  const [financialData, setFinancialData] = useState({});
  const [selectedYears, setSelectedYears] = useState([]); // Может быть несколько выбранных лет
  const [filteredData, setFilteredData] = useState([]);
  const [displayMode, setDisplayMode] = useState('period'); // 'yearly', 'period', 'compare'
  const [isLoading, setIsLoading] = useState(true); // Состояние загрузки
  const [apiStartDate, setApiStartDate] = useState('01.01.2024');
  const [apiEndDate, setApiEndDate] = useState('31.12.2025');
  const [apiEndpoint, setApiEndpoint] = useState("get_all_payment"); // Начальный эндпоинт API (все продажи)
  const [dataStructureType, setDataStructureType] = useState("region"); // "model" для розницы, "region" для опта и всех
  const [dailySalesData, setDailySalesData] = useState({
  all: [],
  retail: [],
  wholesale: []
  });
    const { checkAuth } = useAuth();
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);
  const [isLoadingDailySales, setIsLoadingDailySales] = useState(false);
const getCurrentMonthDates = () => {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };
  
  return {
    start: formatDate(firstDayOfMonth),
    end: formatDate(currentDay)
  };
};
const currentMonthDates = getCurrentMonthDates();
const [tableDateStart, setTableDateStart] = useState(currentMonthDates.start);
const [tableDateEnd, setTableDateEnd] = useState(currentMonthDates.end);
 const { t } = useTranslation(financialAnalyticsLocale);
    const { mode: themeMode } = useThemeStore();
  const isDarkMode = themeMode === 'dark';
    const MONTHS = useMemo(() => [
    t('months.january'),
    t('months.february'),
    t('months.march'),
    t('months.april'),
    t('months.may'),
    t('months.june'),
    t('months.july'),
    t('months.august'),
    t('months.september'),
    t('months.october'),
    t('months.november'),
    t('months.december')
  ], [t]);
  // Функция для получения текущего месяца и года
    const getThemeColors = () => {
    if (isDarkMode) {
      return {
        background: '#0f172a',
        backgroundSecondary: '#1e293b',
        text: '#f8fafc',
        textSecondary: '#cbd5e1',
        border: '#334155',
        cardBg: '#1e293b',
        cardBorder: '#334155'
      };
    } else {
      return {
        background: '#ffffff',
        backgroundSecondary: '#f8fafc',
        text: '#0f172a',
        textSecondary: '#475569',
        border: '#e2e8f0',
        cardBg: '#ffffff',
        cardBorder: '#e2e8f0'
      };
    }
    };
    const colors = getThemeColors();
  const getCurrentMonthAndYear = () => {
    const now = new Date();
    return {
      month: now.getMonth() + 1,
      year: now.getFullYear()
    };
  }; 
 

const fetchDailySalesData = async () => {
  setIsLoadingDailySales(true);
  
  try {
    // Используем даты из полей таблицы, если они установлены
    const startDateFormatted = tableDateStart || apiStartDate;
    const endDateFormatted = tableDateEnd || apiEndDate;
    
    console.log(`Загрузка данных с ${startDateFormatted} по ${endDateFormatted}`);
    
    // Загружаем данные из всех трех API-эндпоинтов параллельно
    const [allSalesResponse, retailSalesResponse, wholesaleSalesResponse] = await Promise.all([
      axiosInstance.post('https://uzavtoanalytics.uz/dashboard/proxy', {
        url: "/b/dashboard/infos&get_all_payment_by_day",
        begin_date: startDateFormatted,
        end_date: endDateFormatted
      }),
      axiosInstance.post('https://uzavtoanalytics.uz/dashboard/proxy', {
        url: "/b/dashboard/infos&get_roz_payment_by_day",
        begin_date: startDateFormatted,
        end_date: endDateFormatted
      }),
      axiosInstance.post('https://uzavtoanalytics.uz/dashboard/proxy', {
        url: "/b/dashboard/infos&get_opt_payment_by_day",
        begin_date: startDateFormatted,
        end_date: endDateFormatted
      })
    ]);
    
    let allSalesJsonData = allSalesResponse.data;
    let retailSalesJsonData = retailSalesResponse.data;
    let wholesaleSalesJsonData = wholesaleSalesResponse.data;
    
    if (allSalesJsonData && typeof allSalesJsonData === 'object' && 'data' in allSalesJsonData) {
      allSalesJsonData = allSalesJsonData.data;
    }
    if (retailSalesJsonData && typeof retailSalesJsonData === 'object' && 'data' in retailSalesJsonData) {
      retailSalesJsonData = retailSalesJsonData.data;
    }
    if (wholesaleSalesJsonData && typeof wholesaleSalesJsonData === 'object' && 'data' in wholesaleSalesJsonData) {
      wholesaleSalesJsonData = wholesaleSalesJsonData.data;
    }
    
    console.log('Исходные данные:', { allSalesJsonData, retailSalesJsonData, wholesaleSalesJsonData });
    
    // Преобразуем ответы API в нужный формат
    const transformData = (data, type) => {
      console.log(`Обработка данных для типа: ${type}`);
      console.log("Структура данных:", data);
      
      // Проверка на null/undefined
      if (!data) {
        console.warn(`Данные для типа ${type} отсутствуют`);
        return [];
      }
      
      // Для общих продаж и оптовых продаж
      if (type === 'all' || type === 'wholesale') {
        // Проверяем структуру данных
        let dailyData = [];
        
        // Если данные уже представлены как массив с filter_by_region
        if (data.filter_by_region && Array.isArray(data.filter_by_region)) {
          dailyData = data.filter_by_region;
          console.log(`Используем data.filter_by_region для ${type}`);
        }
        // Если данные представлены как массив дней
        else if (Array.isArray(data) && data.length > 0 && data[0].day) {
          dailyData = data;
          console.log(`Используем массив дней для ${type}`);
        }
        // Если данные представлены как массив с filter_by_region внутри первого элемента
        else if (Array.isArray(data) && data.length > 0 && data[0].filter_by_region && Array.isArray(data[0].filter_by_region)) {
          dailyData = data[0].filter_by_region;
          console.log(`Используем data[0].filter_by_region для ${type}`);
        }
        // Дополнительная проверка для объекта с массивом внутри
        else if (typeof data === 'object' && !Array.isArray(data)) {
          // Ищем массив в объекте
          const possibleKeys = ['filter_by_region', 'data', 'items', 'results', 'days'];
          for (const key of possibleKeys) {
            if (data[key] && Array.isArray(data[key])) {
              dailyData = data[key];
              console.log(`Используем data.${key} для ${type}`);
              break;
            }
          }
        }
        
        // Обрабатываем каждый день
        return dailyData.map(dayData => {
          if (!dayData || !dayData.day) {
            console.warn("Некорректные данные дня:", dayData);
            return null;
          }
          
          // Суммируем данные по всем регионам
          let totalAmount = 0;
          let totalCount = 0;
          
          if (Array.isArray(dayData.regions)) {
            dayData.regions.forEach(region => {
              if (region) {
                totalAmount += parseFloat(region.amount) || 0;
                totalCount += parseInt(region.all_count) || 0;
              }
            });
          }
          
          return {
            day: dayData.day,
            amount: totalAmount.toString(),
            all_count: totalCount.toString(),
            regions: dayData.regions || []
          };
        }).filter(Boolean); // Удаляем null элементы
      } 
      // Для розничных продаж (retail)
      else if (type === 'retail') {
        // Если данные - массив моделей
        if (Array.isArray(data)) {
          console.log(`Данные retail - массив моделей`);
          // Собираем все filter_by_region из всех моделей
          const allDaysData = [];
          
          data.forEach(model => {
            if (model && Array.isArray(model.filter_by_region)) {
              model.filter_by_region.forEach(dayData => {
                // Добавляем информацию о модели к каждому дню
                if (dayData && dayData.day) {
                  // Ищем, есть ли уже день в массиве
                  const existingDayIndex = allDaysData.findIndex(item => item.day === dayData.day);
                  
                  if (existingDayIndex >= 0) {
                    // Добавляем модель к существующему дню
                    if (!allDaysData[existingDayIndex].models) {
                      allDaysData[existingDayIndex].models = [];
                    }
                    
                    // Рассчитываем суммы для модели в этот день
                    let modelAmount = 0;
                    let modelCount = 0;
                    
                    if (Array.isArray(dayData.regions)) {
                      dayData.regions.forEach(region => {
                        if (region) {
                          modelAmount += parseFloat(region.amount) || 0;
                          modelCount += parseInt(region.all_count) || 0;
                        }
                      });
                    }
                    
                    allDaysData[existingDayIndex].models.push({
                      model_id: model.model_id,
                      model_name: model.model_name,
                      photo_sha: model.photo_sha,
                      amount: modelAmount,
                      all_count: modelCount
                    });
                    
                    // Обновляем общую сумму и количество
                    allDaysData[existingDayIndex].amount = 
                      (parseFloat(allDaysData[existingDayIndex].amount) || 0) + modelAmount;
                    allDaysData[existingDayIndex].all_count = 
                      (parseInt(allDaysData[existingDayIndex].all_count) || 0) + modelCount;
                  } else {
                    // Создаем новый день
                    let totalAmount = 0;
                    let totalCount = 0;
                    
                    if (Array.isArray(dayData.regions)) {
                      dayData.regions.forEach(region => {
                        if (region) {
                          totalAmount += parseFloat(region.amount) || 0;
                          totalCount += parseInt(region.all_count) || 0;
                        }
                      });
                    }
                    
                    const newDayData = {
                      day: dayData.day,
                      amount: totalAmount.toString(),
                      all_count: totalCount.toString(),
                      regions: dayData.regions || [],
                      models: [{
                        model_id: model.model_id,
                        model_name: model.model_name,
                        photo_sha: model.photo_sha,
                        amount: totalAmount,
                        all_count: totalCount
                      }]
                    };
                    
                    allDaysData.push(newDayData);
                  }
                }
              });
            }
          });
          
          console.log(`Обработано ${allDaysData.length} дней для retail`);
          return allDaysData;
        }
        // Дополнительная проверка для объекта с массивом моделей
        else if (typeof data === 'object' && !Array.isArray(data)) {
          const possibleKeys = ['models', 'data', 'items', 'results'];
          for (const key of possibleKeys) {
            if (data[key] && Array.isArray(data[key])) {
              console.log(`Используем data.${key} для retail`);
              return transformData(data[key], type);
            }
          }
        }
      }
      
      // Если не сработали известные шаблоны, возвращаем пустой массив
      console.warn(`Не удалось определить структуру данных для типа ${type}`, data);
      return [];
    };
    
    // Преобразуем данные для каждого типа
    const allSalesData = transformData(allSalesJsonData, 'all');
    const retailSalesData = transformData(retailSalesJsonData, 'retail');
    const wholesaleSalesData = transformData(wholesaleSalesJsonData, 'wholesale');
    
    console.log('Преобразованные данные:', { 
      all: allSalesData.length, 
      retail: retailSalesData.length, 
      wholesale: wholesaleSalesData.length 
    });
    
    // Логируем первые элементы каждого массива для проверки
    if (allSalesData.length > 0) console.log('Пример all:', allSalesData[0]);
    if (retailSalesData.length > 0) console.log('Пример retail:', retailSalesData[0]);
    if (wholesaleSalesData.length > 0) console.log('Пример wholesale:', wholesaleSalesData[0]);
    
    // Сохраняем данные
    setDailySalesData({
      all: Array.isArray(allSalesData) ? allSalesData : [],
      retail: Array.isArray(retailSalesData) ? retailSalesData : [],
      wholesale: Array.isArray(wholesaleSalesData) ? wholesaleSalesData : []
    });
    
    // Обновляем значения полей дат, если они не были установлены
    if (!tableDateStart) {
      setTableDateStart(startDateFormatted);
    }
    if (!tableDateEnd) {
      setTableDateEnd(endDateFormatted);
    }
    
  } catch (error) {
    console.error('Ошибка при загрузке данных о продажах:', error);
    
    // Дополнительное логирование для отладки
    if (error.response) {
      console.error('Ошибка ответа:', error.response.data);
      console.error('Статус:', error.response.status);
    }
  } finally {
    setIsLoadingDailySales(false);
  }
};
  
  // Состояния для фильтров по периоду
  const currentDate = getCurrentMonthAndYear();
  const [startMonth, setStartMonth] = useState(1); // Начинаем с января
  const [startYear, setStartYear] = useState(currentDate.year - 1); // Прошлый год
  const [endMonth, setEndMonth] = useState(currentDate.month); // Текущий месяц
  const [endYear, setEndYear] = useState(currentDate.year);
  
  // Состояния для представления
  const [viewType, setViewType] = useState('bar'); // 'bar', 'line', 'stacked', 'area', 'radar', 'mixed'
  const [focusCategory, setFocusCategory] = useState('all'); // 'all', 'retail', 'wholesale'
  
  // Состояние для информации о моделях
  const [modelInfo, setModelInfo] = useState({
    retail: { id: '', name: 'Модель 1' },
    wholesale: { id: '', name: 'Модель 2' }
  });
  
  // Refs для контейнеров графиков
  const mainChartRef = useRef(null);
  const progressChartRef = useRef(null);
  const detailsChartRef = useRef(null);
  const yearlyTrendChartRef = useRef(null);
  const yearComparisonChartRef = useRef(null);
  const forecastChartRef = useRef(null);
  const categoryDistributionRef = useRef(null);
  
  // Функция выбора категории с обновлением API эндпоинта
  const handleCategoryChange = (category) => {
    setFocusCategory(category);
    
    let endpoint = "get_all_payment";
    let dataType = "region";
    
    // Определяем API эндпоинт и тип структуры данных
    switch(category) {
      case 'retail':
        endpoint = "get_roz_payment";
        dataType = "model";
        break;
      case 'wholesale':
        endpoint = "get_opt_payment";
        dataType = "region";
        break;
      case 'all':
        endpoint = "get_all_payment";
        dataType = "region";
        break;
      default:
        endpoint = "get_all_payment";
        dataType = "region";
    }
    
    setApiEndpoint(endpoint);
    setDataStructureType(dataType);
    
    // Загружаем данные для новой категории
    fetchDataForCategory(category, endpoint, dataType);
  };
  
  // Функция для загрузки данных в зависимости от категории
// Модифицированный обработчик для fetchDataForCategory
const fetchDataForCategory = async (category, endpoint, dataType) => {
  setIsLoading(true);
  
  try {
    console.log(`Запрос данных для категории ${category}, эндпоинт: ${endpoint}`);
    
    // Добавляем логирование для отслеживания параметров запроса
    console.log(`Параметры запроса: begin_date=${apiStartDate}, end_date=${apiEndDate}`);
    
  const token = localStorage.getItem('authToken');

// Выполняем запрос к API
const response = await fetch(`https://uzavtoanalytics.uz/dashboard/proxy`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Auth": `Bearer ${token}`
  },
  body: JSON.stringify({
    url: `/b/dashboard/infos&${endpoint}`,
    begin_date: apiStartDate,
    end_date: apiEndDate
  })
});
    
    if (!response.ok) {
      throw new Error(`Ошибка HTTP: ${response.status}`);
    }
    
    let apiData;
    try {
      apiData = await response.json();
    } catch (jsonError) {
      console.error("Ошибка при разборе JSON:", jsonError);
      throw new Error("Ошибка при разборе ответа сервера");
    }
    
    console.log(`Получены данные для категории ${category}:`, apiData);
    
    // Преобразуем данные в зависимости от типа структуры
    let transformedData;
    try {
      if (!apiData) {
        throw new Error("Получены пустые данные от API");
      }
      
      // Используем разные функции преобразования в зависимости от категории
      if (category === 'retail') {
        console.log("Преобразование данных розничных продаж");
        transformedData = transformModelBasedData(apiData);
      } else if (category === 'wholesale') {
        console.log("Преобразование данных оптовых продаж");
        transformedData = transformRegionBasedData(apiData, 'wholesale');
      } else {
        console.log("Преобразование данных общих продаж");
        transformedData = transformRegionBasedData(apiData, 'all');
      }
      
      console.log(`Результат трансформации для ${category}:`, transformedData);
    } catch (transformError) {
      console.error("Ошибка при трансформации данных:", transformError);
      
      // Создаем минимальные данные для интерфейса
      transformedData = createMinimalData(category);
      console.log("Созданы минимальные данные для отображения");
    }
    
    // Устанавливаем данные
    setFinancialData(transformedData);
    
    // Обновляем выбранные годы и модели
    updateYearsAndModels(transformedData);
    
    setIsLoading(false);
  } catch (error) {
    console.error("Ошибка при загрузке данных:", error);
    
    // Создаем минимальные данные для интерфейса
    const minimalData = createMinimalData(category);
    setFinancialData(minimalData);
    updateYearsAndModels(minimalData);
    setIsLoading(false);
  }
};
  // Функция для создания минимальных данных для интерфейса при ошибке
const createMinimalData = (category) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  const minimalData = {
    [currentYear]: {
      targetAmount: 1000000,
      totalEarned: 800000,
      months: Array(12).fill().map((_, index) => {
        const amount = index === currentMonth ? 100000 : 50000;
        return {
          name: MONTHS[index],
          month: index + 1,
          retail: category === 'retail' || category === 'all' ? amount * 0.6 : 0,
          wholesale: category === 'wholesale' || category === 'all' ? amount * 0.4 : 0,
          promo: 0,
          total: amount
        };
      }),
      quarterlyData: [200000, 200000, 200000, 200000],
      categories: {
        retail: category === 'retail' || category === 'all' ? 480000 : 0,
        wholesale: category === 'wholesale' || category === 'all' ? 320000 : 0,
        promo: 0
      },
      modelData: {}
    }
  };
  
  return minimalData;
};
  
  // Функция для обновления выбранных годов и моделей
  const updateYearsAndModels = (data) => {
    const allYears = Object.keys(data).map(Number);
    
    if (allYears.length > 0) {
      if (displayMode === 'compare') {
        // В режиме сравнения берем все годы
        setSelectedYears(allYears);
      } else {
        // В остальных режимах берем последний год
        const latestYear = Math.max(...allYears);
        setSelectedYears([latestYear]);
      }
      
      // Обновляем названия моделей для последнего года, если данные структурированы по моделям
      if (dataStructureType === "model") {
        const latestYear = Math.max(...allYears);
        updateModelNames(data, latestYear);
      }
    }
  };
  
  // Функция для обновления названий моделей
  const updateModelNames = (data, selectedYear) => {
    if (!data || !data[selectedYear] || !data[selectedYear].modelData) return;
    
    const year = parseInt(selectedYear);
    const allModels = Object.values(data[year].modelData || {});
    const sortedModels = [...allModels].sort((a, b) => b.totalSales - a.totalSales);
    
    const newModelInfo = { ...modelInfo };
    
    if (sortedModels.length > 0) {
      newModelInfo.retail = {
        id: sortedModels[0].model_id,
        name: sortedModels[0].model_name
      };
      // Также обновите константу для совместимости
      SALE_TYPES.RETAIL.name = sortedModels[0].model_name;
    }
    
    if (sortedModels.length > 1) {
      newModelInfo.wholesale = {
        id: sortedModels[1].model_id,
        name: sortedModels[1].model_name
      };
      // Также обновите константу для совместимости
      SALE_TYPES.WHOLESALE.name = sortedModels[1].model_name;
    }
    
    setModelInfo(newModelInfo);
  };
  
  // Функция для проверки наличия данных о моделях
  const hasModelData = () => {
    return dataStructureType === "model";
  };
  
  // Функция для обновления данных с датами
  const refreshDataWithDateRange = () => {
    fetchDataForCategory(focusCategory, apiEndpoint, dataStructureType);
  };
  
const transformModelBasedData = (apiData) => {
  console.log("Начало трансформации данных на основе моделей:", apiData);
  
  // Проверяем структуру входных данных
  if (!apiData || !Array.isArray(apiData) || apiData.length === 0) {
    console.warn("Получены некорректные данные для моделей");
    return createMinimalData('retail');
  }
  
  const transformedData = {};
  const years = new Set();
  
  // Собираем все уникальные годы из данных
  apiData.forEach(model => {
    if (!model || !Array.isArray(model.filter_by_region)) {
      console.warn("Некорректная структура данных модели:", model);
      return;
    }
    
    model.filter_by_region.forEach(monthData => {
      if (!monthData || !monthData.month || typeof monthData.month !== 'string') {
        return;
      }
      
      // Парсим год из строки формата "YYYY-MM"
      const yearStr = monthData.month.split('-')[0];
      const year = parseInt(yearStr, 10);
      
      if (!isNaN(year)) {
        years.add(year);
      }
    });
  });
  
  // Если не найдено годов, добавляем текущий
  if (years.size === 0) {
    years.add(new Date().getFullYear());
  }
  
  // Создаем базовую структуру данных для каждого года
  Array.from(years).forEach(year => {
    transformedData[year] = {
      targetAmount: 0,
      totalEarned: 0,
      months: Array(12).fill().map((_, index) => ({
        name: MONTHS[index],
        month: index + 1,
        retail: 0,
        wholesale: 0,
        promo: 0,
        total: 0
      })),
      quarterlyData: [0, 0, 0, 0],
      categories: {
        retail: 0,
        wholesale: 0,
        promo: 0
      },
      modelData: {}
    };
  });
  
  // Заполняем данные по моделям и месяцам
  apiData.forEach(model => {
    if (!model || !model.model_id || !model.model_name || !Array.isArray(model.filter_by_region)) {
      return;
    }
    
    // Для каждого года инициализируем данные модели
    Array.from(years).forEach(year => {
      transformedData[year].modelData[model.model_id] = {
        model_id: model.model_id,
        model_name: model.model_name,
        photo_sha: model.photo_sha || '',
        totalSales: 0,
        monthlyData: Array(12).fill().map(() => ({ amount: 0, count: 0 }))
      };
    });
    
    // Обрабатываем данные по месяцам
    model.filter_by_region.forEach(monthData => {
      if (!monthData || !monthData.month || typeof monthData.month !== 'string') {
        return;
      }
      
      const parts = monthData.month.split('-');
      if (parts.length !== 2) return;
      
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      
      if (isNaN(year) || isNaN(monthIndex) || !transformedData[year]) {
        return;
      }
      
      // Обрабатываем данные по регионам
      if (!Array.isArray(monthData.regions)) {
        return;
      }
      
      let modelMonthTotal = 0;
      let modelMonthCount = 0;
      
      monthData.regions.forEach(region => {
        if (!region) return;
        
        const amount = parseFloat(region.amount) || 0;
        const count = parseInt(region.all_count || 0, 10);
        
        modelMonthTotal += amount;
        modelMonthCount += count;
      });
      
      // Обновляем данные модели для месяца
      if (transformedData[year].modelData[model.model_id]) {
        transformedData[year].modelData[model.model_id].totalSales += modelMonthTotal;
        transformedData[year].modelData[model.model_id].monthlyData[monthIndex].amount = modelMonthTotal;
        transformedData[year].modelData[model.model_id].monthlyData[monthIndex].count = modelMonthCount;
      }
      
      // Обновляем общие данные по месяцу
      transformedData[year].months[monthIndex].retail += modelMonthTotal;
      transformedData[year].months[monthIndex].total += modelMonthTotal;
      
      // Обновляем квартальные данные
      const quarterIndex = Math.floor(monthIndex / 3);
      transformedData[year].quarterlyData[quarterIndex] += modelMonthTotal;
      
      // Обновляем общую сумму и категории
      transformedData[year].totalEarned += modelMonthTotal;
      transformedData[year].categories.retail += modelMonthTotal;
    });
  });
  
  // Устанавливаем целевой показатель
  Array.from(years).forEach(year => {
    transformedData[year].targetAmount = transformedData[year].totalEarned * 1.2;
  });
  
  console.log("Результат трансформации:", transformedData);
  return transformedData;
};
  
  // Функция для трансформации данных, основанных на регионах (опт и все продажи)
const transformRegionBasedData = (apiData, category) => {
  console.log(`Начало трансформации данных по регионам для категории ${category}:`, apiData);
  
  if (!apiData) {
    console.warn(`Получены пустые данные для категории ${category}`);
    return createMinimalData(category);
  }
  
  // Функция для извлечения данных о месяцах
  const extractMonthsData = (data) => {
    if (Array.isArray(data)) {
      // Проверяем, является ли первый элемент данными месяца
      if (data.length > 0 && data[0].month) {
        return data;
      }
      
      // Пытаемся найти месячные данные в первом объекте
      if (data.length > 0 && data[0].filter_by_region) {
        return data[0].filter_by_region;
      }
    } 
    else if (typeof data === 'object' && data !== null) {
      // Проверяем наличие filter_by_region в объекте
      if (Array.isArray(data.filter_by_region)) {
        return data.filter_by_region;
      }
      
      // Пытаемся найти массив в любом поле объекта
      for (const key in data) {
        if (Array.isArray(data[key])) {
          return data[key];
        }
      }
    }
    
    console.warn("Не удалось извлечь данные о месяцах");
    return [];
  };
  
  // Получаем данные о месяцах
  const monthsData = extractMonthsData(apiData);
  
  if (!Array.isArray(monthsData) || monthsData.length === 0) {
    console.warn("Не найдены данные о месяцах");
    return createMinimalData(category);
  }
  
  // Собираем все уникальные годы
  const years = new Set();
  monthsData.forEach(monthData => {
    if (!monthData || !monthData.month || typeof monthData.month !== 'string') {
      return;
    }
    
    const parts = monthData.month.split('-');
    if (parts.length !== 2) return;
    
    const year = parseInt(parts[0], 10);
    if (!isNaN(year)) {
      years.add(year);
    }
  });
  
  // Если не найдено годов, добавляем текущий
  if (years.size === 0) {
    years.add(new Date().getFullYear());
  }
  
  // Создаем структуру данных
  const transformedData = {};
  
  // Создаем базовую структуру данных для каждого года
  Array.from(years).forEach(year => {
    transformedData[year] = {
      targetAmount: 0,
      totalEarned: 0,
      months: Array(12).fill().map((_, index) => ({
        name: MONTHS[index],
        month: index + 1,
        retail: 0,
        wholesale: 0,
        promo: 0,
        total: 0
      })),
      quarterlyData: [0, 0, 0, 0],
      categories: {
        retail: 0,
        wholesale: 0,
        promo: 0
      },
      modelData: {}
    };
  });
  
  // Заполняем данные по месяцам
  monthsData.forEach(monthData => {
    if (!monthData || !monthData.month || typeof monthData.month !== 'string') {
      return;
    }
    
    const parts = monthData.month.split('-');
    if (parts.length !== 2) return;
    
    const year = parseInt(parts[0], 10);
    const monthIndex = parseInt(parts[1], 10) - 1;
    
    if (isNaN(year) || isNaN(monthIndex) || !transformedData[year]) {
      return;
    }
    
    // Обрабатываем данные по регионам
    if (!Array.isArray(monthData.regions)) {
      return;
    }
    
    let monthTotal = 0;
    
    monthData.regions.forEach(region => {
      if (!region) return;
      
      const amount = parseFloat(region.amount) || 0;
      monthTotal += amount;
    });
    
    // Обновляем данные месяца
    if (category === 'wholesale') {
      transformedData[year].months[monthIndex].wholesale += monthTotal;
      transformedData[year].categories.wholesale += monthTotal;
    } else {
      // Для общих продаж распределяем между розницей и оптом
      // 60% розница, 40% опт (или используем реальное соотношение, если доступно)
      const retailRatio = 0.6;
      transformedData[year].months[monthIndex].retail += monthTotal * retailRatio;
      transformedData[year].months[monthIndex].wholesale += monthTotal * (1 - retailRatio);
      transformedData[year].categories.retail += monthTotal * retailRatio;
      transformedData[year].categories.wholesale += monthTotal * (1 - retailRatio);
    }
    
    // Обновляем общую сумму месяца
    transformedData[year].months[monthIndex].total += monthTotal;
    
    // Обновляем квартальные данные
    const quarterIndex = Math.floor(monthIndex / 3);
    transformedData[year].quarterlyData[quarterIndex] += monthTotal;
    
    // Обновляем общую сумму
    transformedData[year].totalEarned += monthTotal;
  });
  
  // Устанавливаем целевой показатель
  Array.from(years).forEach(year => {
    transformedData[year].targetAmount = transformedData[year].totalEarned * 1.2;
  });
  
  console.log("Результат трансформации:", transformedData);
  return transformedData;
};
  
  // Функция для модификации поведения при клике (переход к нужному типу детализации)
  const handleChartBarClick = (d) => {
    const yearData = d.year;
    const monthData = d.month;
    const monthName = `${d.name} ${d.year}`;
    
    // В зависимости от типа данных переходим к разным экранам
    if (dataStructureType === "model") {
      // Для розницы показываем экран выбора между моделями и регионами
      showSelectionOptions(yearData, monthData, monthName);
    } else {
      // Для опта и всех продаж сразу показываем распределение по регионам
      showRegionDetails(yearData, monthData, monthName);
    }
  };
  
  // Функция для клика по столбцу или сегменту графика
  const handleDataPointClick = (year, month, monthName) => {
    if (dataStructureType === "model") {
      // Для розницы - выбор между моделями и регионами
      showSelectionOptions(year, month, monthName);
    } else {
      // Для опта и всех продаж - сразу показываем регионы
      showRegionDetails(year, month, monthName);
    }
  };
  
  // Инициализация данных с API
useEffect(() => {
  fetchDataForCategory(focusCategory, apiEndpoint, dataStructureType);
  fetchDailySalesData(); // Загружаем данные за текущий месяц при монтировании
}, []);
  
  // Эффект для фильтрации данных в зависимости от режима и фильтров
  useEffect(() => {
    if (Object.keys(financialData).length === 0) return;
    
    // Получаем все доступные годы
    const allAvailableYears = Object.keys(financialData).map(Number).sort();
    console.log("Все доступные годы в данных:", allAvailableYears);
    
    // Для режима 'period' всегда включаем все доступные годы в selectedYears
    setSelectedYears(allAvailableYears);
    
    const filteredMonths = [];
    
    // Режим period - группировка по месяцам и годам
    // Полный диапазон выбранного периода
    const effectiveStartYear = Math.min(...allAvailableYears);
    const effectiveEndYear = Math.max(...allAvailableYears);
    
    for (let year = effectiveStartYear; year <= effectiveEndYear; year++) {
      if (!financialData[year]) continue;
      
      financialData[year].months.forEach(month => {
        // Убираем фильтрацию по диапазону месяцев, чтобы видеть все данные
        filteredMonths.push({
          ...month,
          year,
          label: `${month.name} ${year}`
        });
      });
    }
    
    console.log("Отфильтрованные данные:", filteredMonths.length, "записей");
    console.log("Годы в отфильтрованных данных:", [...new Set(filteredMonths.map(m => m.year))].sort());
    
    setFilteredData(filteredMonths);
  }, [financialData]);
  
  // Эффект для рендеринга графиков при изменении данных
  useEffect(() => {
    if (!filteredData.length) return;
    
    renderMainChart();
    // renderProgressChart();
    // renderDetailsChart();
    // renderYearlyTrendChart();
    
    if (displayMode === 'compare') {
      renderYearComparisonChart();
    } else if (displayMode === 'period') {
      renderPeriodComparisonTable();
    }
    
    // renderForecastChart();
    // renderCategoryDistribution();
  }, [filteredData, viewType, displayMode, focusCategory]);
  
  // Функция форматирования для денежных значений
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'UZS',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Функция для форматирования чисел в компактный вид
const formatProfitCompact = (number) => {
  // Проверяем, является ли number числом
  if (number === null || number === undefined || isNaN(number)) {
    return '0 UZS';
  }
  
  // Преобразуем в число на всякий случай
  const num = Math.abs(Number(number));
  
  // Определяем суффиксы для разных порядков чисел
  const suffixes = [
    { value: 1, text: '' },
    { value: 1e3, text: ' тыс' },
    { value: 1e6, text: ' млн' },
    { value: 1e9, text: ' млрд' },
    { value: 1e12, text: ' трлн' },
    { value: 1e15, text: ' квдрлн' },
    { value: 1e18, text: ' квнтлн' },
    { value: 1e21, text: ' скстлн' },
    { value: 1e24, text: ' сптлн' },
    { value: 1e27, text: ' октлн' },
    { value: 1e30, text: ' ннлн' },
    { value: 1e33, text: ' дцлн' }
  ];
  
  // Находим подходящий суффикс
  let i = suffixes.length - 1;
  while (i > 0 && num < suffixes[i].value) {
    i--;
  }
  
  // Вычисляем результат с делением на соответствующий порядок
  const divider = suffixes[i].value;
  const result = num / divider;
  const suffix = suffixes[i].text;
  
  // Определяем, сколько десятичных знаков отображать
  // Для сумм менее тысячи - 0 знаков
  // Для тысяч и больше - 1-2 знака, если не целое число
  let decimals = 0;
  if (divider > 1) {
    const decimalPart = result - Math.floor(result);
    if (decimalPart > 0) {
      // Если после запятой значащие цифры, показываем 1-2 знака
      if (result < 10) {
        decimals = 2; // Для чисел вида 1.23 млн
      } else if (result < 100) {
        decimals = 1; // Для чисел вида 12.3 млн
      }
      // Для больших чисел (≥ 100) оставляем 0 знаков
    }
  }
  
  // Форматируем число
  const formattedResult = result.toLocaleString('ru-RU', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  });
  
  // Для отрицательных чисел добавляем знак минус
  const sign = number < 0 ? '-' : '';
  
  // Добавляем обозначение валюты
  return `${sign}${formattedResult}${suffix} UZS`;
};
  // Функция для получения общей суммы за период
  const getTotalForPeriod = () => {
    if (!filteredData.length) return 0;
    return filteredData.reduce((sum, month) => sum + month.total, 0);
  };
  
  // Функция для расчета общей суммы за текущий месяц
const getCurrentMonthTotal = () => {
  if (!filteredData || filteredData.length === 0) {
    console.warn("Нет данных для расчета текущего месяца");
    return 0;
  }
  
  // Получаем текущую дату
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  // Сначала пытаемся найти точное совпадение по месяцу и году
  let currentMonthData = filteredData.find(
    month => month.month === currentMonth && month.year === currentYear
  );
  
  // Если не найдено, берем самую последнюю запись
  if (!currentMonthData) {
    // Сортируем по году (по убыванию), затем по месяцу (по убыванию)
    const sortedData = [...filteredData].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
    
    currentMonthData = sortedData[0];
    
    if (!currentMonthData) {
      console.warn("Не удалось найти ни одной записи в данных");
      return 0;
    }
  }
  
  console.log("Данные для расчета:", currentMonthData);
  
  // В зависимости от выбранной категории возвращаем разные значения
  switch (focusCategory) {
    case 'retail':
      return currentMonthData.retail || 0;
    case 'wholesale':
      return currentMonthData.wholesale || 0;
    case 'all':
    default:
      return currentMonthData.total || 0;
  }
};
  
// Модифицированная функция для расчета полного прогнозируемого дохода
const calculateTotalMonthEstimate = () => {
  if (!filteredData || filteredData.length === 0) {
    console.warn("Нет данных для расчета прогноза");
    return 0;
  }
  
  // Получаем текущую дату
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();
  
  // Получаем количество дней в текущем месяце
  const daysInCurrentMonth = new Date(currentYear, currentMonth, 0).getDate();
  
  // Сначала пытаемся найти точное совпадение по месяцу и году
  let currentMonthData = filteredData.find(
    month => month.month === currentMonth && month.year === currentYear
  );
  
  // Если не найдено, берем самую последнюю запись
  if (!currentMonthData) {
    // Сортируем по году (по убыванию), затем по месяцу (по убыванию)
    const sortedData = [...filteredData].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
    
    currentMonthData = sortedData[0];
    
    if (!currentMonthData) {
      console.warn("Не удалось найти ни одной записи в данных");
      return 0;
    }
  }
  
  // Уже полученный доход за месяц в зависимости от категории
  let currentIncome = 0;
  
  switch (focusCategory) {
    case 'retail':
      currentIncome = currentMonthData.retail || 0;
      break;
    case 'wholesale':
      currentIncome = currentMonthData.wholesale || 0;
      break;
    case 'all':
    default:
      currentIncome = currentMonthData.total || 0;
      break;
  }
  
  // Если это не текущий месяц и год, просто возвращаем известное значение
  if (currentMonthData.year !== currentYear || currentMonthData.month !== currentMonth) {
    return currentIncome;
  }
  
  // Если месяц закончился, просто возвращаем текущий доход
  if (currentDay >= daysInCurrentMonth) {
    return currentIncome;
  }
  
  // Текущий средний доход в день (на основе прошедших дней)
  const averageDailyIncome = currentIncome / Math.max(1, currentDay);
  
  // Оставшиеся дни в месяце
  const remainingDays = daysInCurrentMonth - currentDay;
  
  // Прогнозируемый доход на оставшиеся дни
  const estimatedRemainingIncome = averageDailyIncome * remainingDays;
  
  // Общий ожидаемый доход за месяц (текущий + прогнозируемый)
  return currentIncome + estimatedRemainingIncome;
};
  
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    
    const parts = dateString.split('.');
    if (parts.length !== 3) return '';
    
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };
  
  // Конвертирует дату из формата YYYY-MM-DD (из элемента input) в формат DD.MM.YYYY для API
  const formatDateFromInput = (dateString) => {
    if (!dateString) return '';
    
    const parts = dateString.split('-');
    if (parts.length !== 3) return '';
    
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  };
  
const renderMainChart = () => {
  if (!mainChartRef.current) return;
  
  // Определяем цвета для текущей темы
  const chartColors = {
    background: isDarkMode ? '#1f2937' : '#ffffff',
    text: isDarkMode ? '#f9fafb' : '#1f2937',
    gridLines: isDarkMode ? 'rgba(107, 114, 128, 0.15)' : 'rgba(229, 231, 235, 0.5)',
    labelColor: isDarkMode ? '#d1d5db' : '#4b5563',
    tooltipBg: isDarkMode ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    tooltipBorder: isDarkMode ? '#374151' : '#e5e7eb',
    axisColor: isDarkMode ? '#6b7280' : '#9ca3af',
    barColors: {
      total: isDarkMode ? '#3b82f6' : '#2563eb',
      retail: isDarkMode ? '#8b5cf6' : '#7c3aed',
      wholesale: isDarkMode ? '#10b981' : '#059669',
      other: isDarkMode ? '#f59e0b' : '#d97706'
    }
  };
  
  d3.select(mainChartRef.current).selectAll("*").remove();
  
  const container = d3.select(mainChartRef.current);
  const containerRect = mainChartRef.current.getBoundingClientRect();
  const width = containerRect.width;
  const height = 400;
  const margin = { top: 20, right: 30, bottom: 60, left: 70 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  
  const svg = container.append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('background', chartColors.background)
    .style('border-radius', '8px');
  
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  
  // Подготовка данных
  const chartData = Object.entries(financialData.monthly || {}).map(([key, value]) => ({
    month: key,
    ...value
  }));
  
  // Настройка осей
  const x = d3.scaleBand()
    .range([0, innerWidth])
    .padding(0.1)
    .domain(chartData.map(d => d.month));
  
  const y = d3.scaleLinear()
    .range([innerHeight, 0])
    .domain([0, d3.max(chartData, d => d.total) * 1.1]);
  
  // Добавление сетки
  g.append('g')
    .attr('class', 'grid')
    .call(d3.axisLeft(y)
      .tickSize(-innerWidth)
      .tickFormat('')
    )
    .style('stroke-dasharray', '3,3')
    .style('opacity', 0.3)
    .selectAll('line')
    .attr('stroke', chartColors.gridLines);
  
  // Ось X
  g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x).tickFormat(d => {
      const monthIndex = parseInt(d.split('-')[1]) - 1;
      return MONTHS[monthIndex] || d;
    }))
    .selectAll('text')
    .style('fill', chartColors.labelColor)
    .style('font-size', '12px')
    .attr('transform', 'rotate(-45)')
    .style('text-anchor', 'end');
  
  // Ось Y
  g.append('g')
    .call(d3.axisLeft(y).tickFormat(d => `${(d / 1000000).toFixed(0)}M`))
    .selectAll('text')
    .style('fill', chartColors.labelColor)
    .style('font-size', '12px');
  
  
  // Создание групп для баров
  const barGroups = g.selectAll('.bar-group')
    .data(chartData)
    .enter().append('g')
    .attr('class', 'bar-group')
    .attr('transform', d => `translate(${x(d.month)},0)`);
  
  // Функция для создания баров с анимацией
  const createBar = (selection, yAccessor, color, delay) => {
    selection.append('rect')
      .attr('x', 0)
      .attr('y', innerHeight)
      .attr('width', x.bandwidth())
      .attr('height', 0)
      .attr('fill', color)
      .attr('rx', 4)
      .attr('opacity', 0.8)
      .transition()
      .duration(750)
      .delay(delay)
      .attr('y', d => y(yAccessor(d)))
      .attr('height', d => innerHeight - y(yAccessor(d)));
  };
  
  // Добавление баров в зависимости от выбранной категории
  if (focusCategory === 'all') {
    createBar(barGroups, d => d.total || 0, chartColors.barColors.total, 0);
  } else if (focusCategory === 'retail') {
    createBar(barGroups, d => d.retail || 0, chartColors.barColors.retail, 0);
  } else {
    createBar(barGroups, d => d.wholesale || 0, chartColors.barColors.wholesale, 0);
  }
  
  // Тултип
  const tooltip = d3.select('body').append('div')
    .attr('class', 'chart-tooltip')
    .style('position', 'absolute')
    .style('visibility', 'hidden')
    .style('background', chartColors.tooltipBg)
    .style('border', `1px solid ${chartColors.tooltipBorder}`)
    .style('border-radius', '8px')
    .style('padding', '12px')
    .style('font-size', '14px')
    .style('color', chartColors.text)
    .style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.1)')
    .style('pointer-events', 'none')
    .style('z-index', '1000');
  
  // Интерактивность
  barGroups.selectAll('rect')
    .on('mouseover', function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('opacity', 1);
      
      const monthIndex = parseInt(d.month.split('-')[1]) - 1;
      const monthName = MONTHS[monthIndex];
      
      tooltip.html(`
        <div style="font-weight: bold; margin-bottom: 8px;">${monthName}</div>
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <div style="display: flex; justify-content: space-between; gap: 16px;">
            <span>${t('charts.total')}:</span>
            <span style="font-weight: bold; color: ${chartColors.barColors.total}">
              ${formatCurrency(d.total || 0)}
            </span>
          </div>
          <div style="display: flex; justify-content: space-between; gap: 16px;">
            <span>${t('charts.retail')}:</span>
            <span style="color: ${chartColors.barColors.retail}">
              ${formatCurrency(d.retail || 0)}
            </span>
          </div>
          <div style="display: flex; justify-content: space-between; gap: 16px;">
            <span>${t('charts.wholesale')}:</span>
            <span style="color: ${chartColors.barColors.wholesale}">
              ${formatCurrency(d.wholesale || 0)}
            </span>
          </div>
        </div>
      `)
      .style('visibility', 'visible');
    })
    .on('mousemove', function(event) {
      tooltip
        .style('top', (event.pageY - 10) + 'px')
        .style('left', (event.pageX + 10) + 'px');
    })
    .on('mouseout', function() {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('opacity', 0.8);
      
      tooltip.style('visibility', 'hidden');
    });
  
  // Cleanup при unmount
  return () => {
    tooltip.remove();
  };
};
const renderPeriodComparisonTable = () => {
  if (!mainChartRef.current || !filteredData.length) return;
  
  // Используем обычные переменные вместо хуков useState
  let selectedMonth = null;
  let selectedDay = null;
  
  // Функции для установки значений переменных
  const setSelectedMonth = (value) => {
    selectedMonth = value;
  };
  
  const setSelectedDay = (value) => {
    selectedDay = value;
  };
  
  // Очистка контейнера
  mainChartRef.current.innerHTML = '';
 
  // Добавляем текстуру фона
  const container = d3.select(mainChartRef.current)
    .append('div')
    .style('width', '100%')
    .style('height', '100%')
    .style('position', 'relative')
    .style('overflow', 'hidden');

  container.append('div')
    .style('position', 'absolute')
    .style('top', '0')
    .style('left', '0')
    .style('width', '100%')
    .style('height', '100%')
    .style('background', isDarkMode 
      ? 'radial-gradient(circle at 10% 20%, rgba(21, 30, 45, 0.4) 0%, rgba(10, 14, 23, 0.2) 90%)' 
      : 'radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.05) 0%, rgba(255, 255, 255, 0.95) 90%)')
    .style('opacity', '0.7')
    .style('z-index', '0');
 
  // Создаем панель фильтрации по дате
  const filterPanel = container.append('div')
    .style('position', 'relative')
    .style('z-index', '1')
    .style('display', 'flex')
    .style('flex-wrap', 'wrap')
    .style('align-items', 'center')
    .style('gap', '10px')
    .style('margin-bottom', '15px')
    .style('padding', '10px 15px')
    .style('background', isDarkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.9)')
    .style('border-radius', '10px')
    .style('border', `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.2)'}`)
    .style('box-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1)');
 
  // Добавляем иконку календаря
  filterPanel.append('div')
    .style('color', '#60a5fa')
    .style('font-size', '1.1rem')
    .html('<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>');
 
  // Добавляем селектор месяца
  const monthSelector = filterPanel.append('div')
    .style('display', 'flex')
    .style('align-items', 'center');
 
  monthSelector.append('span')
    .style('color', isDarkMode ? '#9ca3af' : '#64748b')
    .style('font-size', '0.85rem')
    .style('margin-right', '6px')
    .text(t('filters.month'));
 
  // Создаем уникальный список месяцев из данных
  const availableMonths = [...new Set(filteredData.map(item => {
    return {
      key: `${item.year}-${item.month}`,
      label: `${item.name} ${item.year}`
    };
  }).map(item => JSON.stringify(item)))].map(item => JSON.parse(item));
 
  // Сортируем месяцы
  availableMonths.sort((a, b) => {
    const [yearA, monthA] = a.key.split('-').map(Number);
    const [yearB, monthB] = b.key.split('-').map(Number);
    if (yearA !== yearB) return yearA - yearB;
    return monthA - monthB;
  });
 
  // Создаем селект месяца с улучшенным стилем
  const monthSelect = monthSelector.append('select')
    .style('background', isDarkMode ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.9)')
    .style('color', isDarkMode ? '#f9fafb' : '#1f2937')
    .style('border', `1px solid ${isDarkMode ? 'rgba(75, 85, 99, 0.5)' : 'rgba(203, 213, 225, 0.8)'}`)
    .style('border-radius', '6px')
    .style('padding', '4px 8px')
    .style('font-size', '0.85rem')
    .style('cursor', 'pointer')
    .style('transition', 'all 0.2s')
    .on('mouseover', function() {
      d3.select(this).style('border-color', 'rgba(59, 130, 246, 0.5)');
    })
    .on('mouseout', function() {
      d3.select(this).style('border-color', isDarkMode ? 'rgba(75, 85, 99, 0.5)' : 'rgba(203, 213, 225, 0.8)');
    })
    .on('change', function() {
      const selectedValue = this.value;
      setSelectedMonth(selectedValue);
      setSelectedDay(null); // Сбрасываем выбранный день при смене месяца
      
      // Обновляем опции выбора дня
      updateDayOptions(selectedValue);
    });
 
  // Добавляем опцию "Все месяцы"
  monthSelect.append('option')
    .attr('value', '')
    .text(t('filters.allMonths'));
 
  // Добавляем опции месяцев
  availableMonths.forEach(month => {
    monthSelect.append('option')
      .attr('value', month.key)
      .text(month.label);
  });
 
  // Добавляем селектор дня
  const daySelector = filterPanel.append('div')
    .attr('id', 'day-selector')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('opacity', '0.5'); // Изначально затемнен
 
  daySelector.append('span')
    .style('color', isDarkMode ? '#9ca3af' : '#64748b')
    .style('font-size', '0.85rem')
    .style('margin-right', '6px')
    .text(t('filters.day'));
 
  // Создаем селект дня с улучшенным стилем
  const daySelect = daySelector.append('select')
    .attr('id', 'day-select')
    .style('background', isDarkMode ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.9)')
    .style('color', isDarkMode ? '#f9fafb' : '#1f2937')
    .style('border', `1px solid ${isDarkMode ? 'rgba(75, 85, 99, 0.5)' : 'rgba(203, 213, 225, 0.8)'}`)
    .style('border-radius', '6px')
    .style('padding', '4px 8px')
    .style('font-size', '0.85rem')
    .style('cursor', 'pointer')
    .style('transition', 'all 0.2s')
    .property('disabled', true)
    .on('mouseover', function() {
      if (!this.disabled) {
        d3.select(this).style('border-color', 'rgba(59, 130, 246, 0.5)');
      }
    })
    .on('mouseout', function() {
      d3.select(this).style('border-color', isDarkMode ? 'rgba(75, 85, 99, 0.5)' : 'rgba(203, 213, 225, 0.8)');
    })
    .on('change', function() {
      setSelectedDay(this.value);
      updateChartByDay(selectedMonth, this.value);
    });
 
  // Добавляем опцию "Все дни"
  daySelect.append('option')
    .attr('value', '')
    .text(t('filters.allDays'));
 
  // Функция для обновления опций выбора дня
  const updateDayOptions = (monthKey) => {
    const daySelect = d3.select('#day-select');
    const daySelector = d3.select('#day-selector');
    
    // Очищаем текущие опции, кроме первой "Все дни"
    daySelect.selectAll('option:not(:first-child)').remove();
    
    if (!monthKey) {
      daySelect.property('disabled', true);
      daySelector.style('opacity', '0.5');
      updateChart(); // Показываем все данные
      return;
    }
    
    // Разбиваем ключ месяца на год и месяц
    const [year, month] = monthKey.split('-').map(Number);
    
    // Определяем количество дней в месяце
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // Активируем селектор дней
    daySelect.property('disabled', false);
    daySelector.style('opacity', '1');
    
    // Добавляем опции дней
    for (let day = 1; day <= daysInMonth; day++) {
      daySelect.append('option')
        .attr('value', day)
        .text(day);
    }
    
    // Обновляем график для выбранного месяца, показываем все дни
    updateChartByMonth(monthKey);
  };
 
  // Добавляем индикатор выбранного периода
  const periodBadge = filterPanel.append('div')
    .attr('id', 'period-badge')
    .style('margin-left', 'auto')
    .style('background', isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)')
    .style('color', '#60a5fa')
    .style('border', `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`)
    .style('border-radius', '6px')
    .style('padding', '4px 10px')
    .style('font-size', '0.8rem')
    .style('display', 'none');
 
  // Добавляем кнопку сброса фильтров
  const resetButton = filterPanel.append('button')
    .style('background', isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)')
    .style('color', '#60a5fa')
    .style('border', 'none')
    .style('padding', '4px 10px')
    .style('border-radius', '6px')
    .style('font-size', '0.85rem')
    .style('cursor', 'pointer')
    .style('transition', 'all 0.2s')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('gap', '4px')
    .html(`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 13h12l4-8-8 12-1-9-2 5h-5z"/></svg> <span>${t('buttons.reset')}</span>`)
    .on('mouseover', function() {
      d3.select(this).style('background', isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)');
    })
    .on('mouseout', function() {
      d3.select(this).style('background', isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)');
    })
    .on('click', function() {
      // Сбрасываем выбранные значения
      monthSelect.property('value', '');
      daySelect.property('value', '');
      daySelect.property('disabled', true);
      d3.select('#day-selector').style('opacity', '0.5');
      d3.select('#period-badge').style('display', 'none');
      
      setSelectedMonth(null);
      setSelectedDay(null);
      
      // Обновляем график
      updateChart();
    });
 
  // Добавляем диагностическую информацию (временно)
  const debugInfo = filterPanel.append('div')
    .style('background', isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)')
    .style('color', isDarkMode ? '#f0f0f0' : '#333333')
    .style('padding', '4px 8px')
    .style('font-size', '0.75rem')
    .style('border-radius', '4px');
    
  // ВАЖНОЕ ИСПРАВЛЕНИЕ - получаем ВСЕ годы из данных
  // Используем данные из financialData, а не filteredData
  const uniqueYears = Object.keys(financialData).map(Number).sort();
  debugInfo.html(`Годы в данных: ${JSON.stringify(uniqueYears)} (${filteredData.length} записей)`);
 
  // Создаем основной контейнер для графика
  const chartContainer = container.append('div')
    .style('position', 'relative')
    .style('z-index', '1')
    .style('width', '100%')
    .style('height', '90%')
    .style('padding', '15px');
 
  // Определяем размеры графика
  const width = chartContainer.node().clientWidth;
  const height = 450;
  const margin = { top: 60, right: 150, bottom: 70, left: 70 }; // Увеличиваем правый отступ для легенды
 
  // Создаем SVG с более красивым стилем
  const svg = chartContainer.append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('background', isDarkMode ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)' : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)')
    .style('border-radius', '1rem')
    .style('box-shadow', '0 10px 25px -5px rgba(0, 0, 0, 0.3)')
    .style('border', `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.2)'}`);
 
  // Добавляем карточку с заголовком и описанием
  const headerCard = svg.append('g')
    .attr('transform', `translate(${width/2}, 30)`)
    .style('pointer-events', 'none');
 
  headerCard.append('rect')
    .attr('x', -200)
    .attr('y', -25)
    .attr('width', 400)
    .attr('height', 50)
    .attr('rx', 25)
    .attr('fill', isDarkMode ? 'rgba(30, 58, 138, 0.3)' : 'rgba(59, 130, 246, 0.1)')
    .attr('stroke', isDarkMode ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.3)')
    .attr('stroke-width', 1);
 
  // Добавляем заголовок с тенью для текста
  headerCard.append('text')
    .attr('class', 'chart-title')
    .attr('x', 0)
    .attr('y', 7)
    .attr('text-anchor', 'middle')
    .style('font-size', '1.3rem')
    .style('font-weight', 'bold')
    .style('fill', isDarkMode ? '#f9fafb' : '#1f2937')
    .style('filter', 'drop-shadow(0 2px 3px rgba(0,0,0,0.5))')
    .text(t('title'));
 
// Функция для обновления графика по выбранному месяцу (показывает реальные данные по дням)
const updateChartByMonth = async (monthKey) => {
  if (!monthKey) {
    updateChart(); // Показываем все данные
    return;
  }
  
  const [year, month] = monthKey.split('-').map(Number);
  
  // Обновляем бейдж периода
  const periodBadge = d3.select('#period-badge')
    .style('display', 'block')
    .html(`${t('filters.period')} ${MONTHS[month-1]} ${year}`);
  
  // Обновляем заголовок
  d3.select('.chart-title')
    .text(`${t('title')} - ${MONTHS[month-1]} ${year}`);
  
  // Показываем индикатор загрузки
  const chartContainer = d3.select(mainChartRef.current);
  const loader = chartContainer.append('div')
    .attr('class', 'month-data-loader')
    .style('position', 'absolute')
    .style('top', '50%')
    .style('left', '50%')
    .style('transform', 'translate(-50%, -50%)')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('justify-content', 'center')
    .style('background', isDarkMode ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)')
    .style('padding', '20px')
    .style('border-radius', '8px')
    .style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.1)')
    .html(`
      <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-3"></div>
      <span>${t('filters.loadingMonthData')}</span>
    `);
  
  try {
    // Определяем первый и последний день месяца
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    
    // Форматируем даты для API
    const formatDate = (date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    };
    
    const startDate = formatDate(firstDay);
    const endDate = formatDate(lastDay);
    
    console.log(`Загрузка данных за ${MONTHS[month-1]} ${year}: ${startDate} - ${endDate}`);
    
    // Определяем эндпоинт в зависимости от выбранной категории
    let endpoint = '';
    switch(focusCategory) {
      case 'retail':
        endpoint = 'get_roz_payment_by_day';
        break;
      case 'wholesale':
        endpoint = 'get_opt_payment_by_day';
        break;
      case 'all':
      default:
        endpoint = 'get_all_payment_by_day';
        break;
    }
    
    // Загружаем данные с API
 const token = localStorage.getItem('authToken');

// Загружаем данные с API
const response = await fetch(`https://uzavtoanalytics.uz/dashboard/proxy`, {
  method: "POST",
  headers: { 
    "Content-Type": "application/json",
    "X-Auth": `Bearer ${token}`
  },
  body: JSON.stringify({
    url: `/b/dashboard/infos&${endpoint}`,
    begin_date: startDate,
    end_date: endDate
  })
});

    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const apiData = await response.json();
    console.log('Данные по дням месяца:', apiData);
    
    // Преобразуем данные API в формат для графика
    const daysData = [];
    
    // Обработка данных в зависимости от структуры ответа
    let dailyData = [];
    
    if (Array.isArray(apiData)) {
      // Если это массив (для розницы - массив моделей)
      if (focusCategory === 'retail' && apiData.length > 0 && apiData[0].filter_by_region) {
        // Объединяем данные по всем моделям
        const dayMap = new Map();
        
        apiData.forEach(model => {
          if (model.filter_by_region && Array.isArray(model.filter_by_region)) {
            model.filter_by_region.forEach(dayData => {
              if (dayData.day) {
                if (!dayMap.has(dayData.day)) {
                  dayMap.set(dayData.day, {
                    day: dayData.day,
                    amount: 0,
                    count: 0
                  });
                }
                
                const dayEntry = dayMap.get(dayData.day);
                
                // Суммируем данные по регионам
                if (Array.isArray(dayData.regions)) {
                  dayData.regions.forEach(region => {
                    dayEntry.amount += parseFloat(region.amount) || 0;
                    dayEntry.count += parseInt(region.all_count) || 0;
                  });
                }
              }
            });
          }
        });
        
        dailyData = Array.from(dayMap.values());
      } else if (apiData[0] && apiData[0].day) {
        // Если это уже массив дней
        dailyData = apiData;
      }
    } else if (apiData.filter_by_region && Array.isArray(apiData.filter_by_region)) {
      // Если это объект с filter_by_region
      dailyData = apiData.filter_by_region;
    }
    
    // Преобразуем данные для отображения
    dailyData.forEach(dayData => {
      if (!dayData || !dayData.day) return;
      
      // Парсим дату из формата YYYY-MM-DD
      const [yearStr, monthStr, dayStr] = dayData.day.split('-');
      const dayNum = parseInt(dayStr);
      
      // Проверяем, что это нужный месяц
      if (parseInt(yearStr) !== year || parseInt(monthStr) !== month) return;
      
      let dayTotal = 0;
      let dayCount = 0;
      
      // Если есть регионы, суммируем их данные
      if (Array.isArray(dayData.regions)) {
        dayData.regions.forEach(region => {
          dayTotal += parseFloat(region.amount) || 0;
          dayCount += parseInt(region.all_count) || 0;
        });
      } else {
        // Иначе берем данные напрямую
        dayTotal = parseFloat(dayData.amount) || 0;
        dayCount = parseInt(dayData.all_count) || 0;
      }
      
      daysData.push({
        year: year,
        month: month,
        day: dayNum,
        name: dayNum.toString(),
        label: `${dayNum}`,
        retail: focusCategory === 'retail' ? dayTotal : 0,
        wholesale: focusCategory === 'wholesale' ? dayTotal : 0,
        promo: 0,
        total: dayTotal
      });
    });
    
    // Сортируем по дням
    daysData.sort((a, b) => a.day - b.day);
    
    console.log(`Загружено ${daysData.length} дней с данными`);
    
    // Удаляем индикатор загрузки
    loader.remove();
    
    // Если данных нет, показываем сообщение
    if (daysData.length === 0) {
      const noDataMsg = chartContainer.append('div')
        .style('position', 'absolute')
        .style('top', '50%')
        .style('left', '50%')
        .style('transform', 'translate(-50%, -50%)')
        .style('text-align', 'center')
        .style('color', isDarkMode ? '#9ca3af' : '#64748b')
        .html(`
          <div style="font-size: 1.2rem; margin-bottom: 10px;">Нет данных за ${MONTHS[month-1]} ${year}</div>
          <div style="font-size: 0.9rem;">Попробуйте выбрать другой период</div>
        `);
      
      setTimeout(() => noDataMsg.remove(), 3000);
      return;
    }
    
    // Обновляем график с реальными данными по дням
    updateChart(daysData, false, true);
    
  } catch (error) {
    console.error('Ошибка при загрузке данных месяца:', error);
    
    // Удаляем индикатор загрузки
    d3.select('.month-data-loader').remove();
    
    // Показываем сообщение об ошибке
    const errorMsg = chartContainer.append('div')
      .style('position', 'absolute')
      .style('top', '50%')
      .style('left', '50%')
      .style('transform', 'translate(-50%, -50%)')
      .style('text-align', 'center')
      .style('color', '#ef4444')
      .style('background', isDarkMode ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)')
      .style('padding', '20px')
      .style('border-radius', '8px')
      .style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.1)')
      .html(`
        <div style="font-size: 1.1rem; margin-bottom: 10px;">Ошибка загрузки данных</div>
        <div style="font-size: 0.9rem;">${error.message}</div>
      `);
    
    setTimeout(() => errorMsg.remove(), 5000);
  }
};
  
  // Функция для обновления графика по выбранному дню
  const updateChartByDay = (monthKey, day) => {
    if (!monthKey) {
      updateChart(); // Показываем все данные
      return;
    }
    
    const [year, month] = monthKey.split('-').map(Number);
    
    if (!day) {
      updateChartByMonth(monthKey); // Показываем данные месяца по дням
      return;
    }
    
    // Обновляем бейдж периода
    const periodBadge = d3.select('#period-badge')
      .style('display', 'block')
      .html(`${t('filters.period')} ${day} ${MONTHS[month-1]} ${year}`);
    
    // Обновляем заголовок
    d3.select('.chart-title')
      .text(`${t('title')} - ${day} ${MONTHS[month-1]} ${year}`);
    
    // Генерируем данные для выбранного дня
    const dayData = generateDayData(year, month, parseInt(day));
    
    // Обновляем график с данными дня
    updateChart(dayData, true);
  };
  
  // Функция для генерации синтетических данных по дню
  const generateDayData = (year, month, day) => {
    // Находим данные месяца
    const monthData = filteredData.find(item => 
      item.year === year && item.month === month
    );
    
    if (!monthData) return [];
    
    // Создаем примерное распределение по дням (вариации внутри месяца)
    const dayFactor = 0.7 + Math.sin(day / 30 * Math.PI * 2) * 0.3; // Фактор колебания по дням
    const date = new Date(year, month - 1, day);
    const weekendFactor = (date.getDay() === 0 || date.getDay() === 6) ? 0.6 : 1; // Выходные меньше продаж
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // Генерируем данные дня на основе данных месяца
    return [{
      year: year,
      month: month,
      day: day,
      name: day.toString(),
      label: `${day} ${MONTHS[month-1]}`,
      retail: Math.round(monthData.retail / daysInMonth * dayFactor * weekendFactor),
      wholesale: Math.round(monthData.wholesale / daysInMonth * dayFactor * weekendFactor),
      promo: Math.round(monthData.promo / daysInMonth * dayFactor * weekendFactor),
      total: Math.round(monthData.total / daysInMonth * dayFactor * weekendFactor)
    }];
  };
  
  // Функция обновления графика с новыми данными
  const updateChart = (data = filteredData, isDay = false, isDaysList = false) => {
    // Очистка предыдущего графика
    svg.selectAll('g:not(.chart-title)').remove();
    
    // Выводим отладочную информацию
    console.log("Обновление графика с данными:", data.length, "записей");
    const dataYears = [...new Set(data.map(item => item.year))].sort();
    console.log("Уникальные годы в данных:", dataYears);
    
    // Группируем данные по месяцам/дням и годам
    const groupedData = {};
    data.forEach(item => {
      // Определяем ключ для группировки (день или месяц)
      const groupKey = isDaysList ? item.day : item.month;
      // Используем соответствующее название 
      const displayName = isDaysList ? item.day.toString() : item.name;
      
      if (!groupedData[groupKey]) {
        groupedData[groupKey] = {
          key: groupKey,
          name: displayName,
          years: {}
        };
      }
      
      const value = focusCategory === 'all' ? item.total : item[focusCategory];
      groupedData[groupKey].years[item.year] = value;
    });
    
    const sortedItems = Object.values(groupedData).sort((a, b) => a.key - b.key);
    
    // Проверяем, какие годы представлены в данных
    const yearsInData = new Set();
    sortedItems.forEach(item => {
      Object.keys(item.years).forEach(year => {
        yearsInData.add(parseInt(year));
      });
    });
    console.log("Годы в сгруппированных данных:", [...yearsInData].sort());
    
    // Получаем все уникальные годы из данных без ограничений и фильтрации
    // ВАЖНОЕ ИСПРАВЛЕНИЕ - используем все годы из financialData, которые есть в отфильтрованных данных
    const years = [...yearsInData].sort();
    console.log("Годы для отображения:", years);
    
    // Создаем шкалы
    const x0 = d3.scaleBand()
      .domain(sortedItems.map(m => m.name))
      .range([margin.left, width - margin.right])
      .padding(0.25);
    
    // Внутренняя шкала для годов с учетом динамического количества
    const x1 = d3.scaleBand()
      .domain(years)
      .range([0, x0.bandwidth()])
      .padding(0.08);
    
    // Вычисляем максимальное значение для масштаба оси Y
    const maxValue = d3.max(sortedItems, item => 
      d3.max(years.map(year => item.years[year] || 0))
    );
    
    const y = d3.scaleLinear()
      .domain([0, maxValue * 1.1])
      .nice()
      .range([height - margin.bottom, margin.top]);
    
    // Создаем расширенную цветовую схему для любого количества годов
    const colorPalette = [
      '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',  // Основные цвета
      '#0ea5e9', '#6366f1', '#a855f7', '#d946ef', '#f43f5e',  // Дополнительные цвета
      '#14b8a6', '#f97316', '#84cc16', '#22d3ee', '#a3e635'   // Дополнительные цвета 2
    ];
    
    const colorScale = d3.scaleOrdinal()
      .domain(years)
      .range(years.map((_, i) => colorPalette[i % colorPalette.length]));
    
    // Добавляем сетку на фон
    svg.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(y.ticks(5))
      .join('line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', d => y(d))
      .attr('y2', d => y(d))
      .attr('stroke', isDarkMode ? 'rgba(107, 114, 128, 0.15)' : 'rgba(229, 231, 235, 0.5)')
      .attr('stroke-dasharray', '3,3');
    
    // Добавляем оси с улучшенным стилем
    const xAxis = g => g
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x0).tickSizeOuter(0))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').remove())
      .call(g => g.selectAll('text')
        .style('fill', isDarkMode ? '#d1d5db' : '#4b5563')
        .style('font-size', isDaysList ? '0.7rem' : '0.85rem') // Размер текста меньше для дней
        .attr('dy', '0.6em')
        // Не поворачиваем цифры дней
        .attr('transform', isDaysList ? '' : 'rotate(-20)')
        .attr('text-anchor', isDaysList ? 'middle' : 'end'));
    
    const yAxis = g => g
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => formatProfitCompact(d)))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text')
        .style('fill', isDarkMode ? '#d1d5db' : '#4b5563')
        .style('font-size', '0.8rem'))
      .call(g => g.selectAll('.tick line')
        .attr('x2', width - margin.left - margin.right)
        .attr('stroke', isDarkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(229, 231, 235, 0.3)')
        .attr('stroke-dasharray', '2,2'));
    
    svg.append('g').call(xAxis);
    svg.append('g').call(yAxis);
    
    
    // Создаем группы для каждого месяца/дня
    const itemGroups = svg.append('g')
      .selectAll('g')
      .data(sortedItems)
      .join('g')
      .attr('transform', d => `translate(${x0(d.name)},0)`);
    
    // Добавляем подписи с данными для всплывающих подсказок
    const tooltip = d3.select('body').select('.chart-tooltip');
    
    if (tooltip.empty()) {
      d3.select('body').append('div')
        .attr('class', 'chart-tooltip')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background', isDarkMode ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)')
        .style('color', isDarkMode ? '#f9fafb' : '#1f2937')
        .style('padding', '10px 15px')
        .style('border-radius', '5px')
        .style('font-size', '0.9rem')
        .style('box-shadow', '0 4px 15px rgba(0, 0, 0, 0.3)')
        .style('border', `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`)
        .style('z-index', 10);
    }
    
    // Анимированная функция для тултипа
    const showTooltip = (event, d) => {
      const tooltip = d3.select('body').select('.chart-tooltip');
      
      // Вычисляем процент
      const percentage = viewMode === 'sales'
        ? ((d.sales / totalSales) * 100).toFixed(1)
        : ((d.count / totalCount) * 100).toFixed(1);
      
      // Добавляем красиво форматированное содержимое тултипа
      tooltip.html(`
        <div style="border-bottom: 1px solid ${isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.8)'}; margin-bottom: 8px; padding-bottom: 8px;">
          <div style="font-weight: bold; font-size: 1rem; margin-bottom: 4px;">${d.name}</div>
          <div style="font-size: 0.8rem; color: ${isDarkMode ? '#9ca3af' : '#64748b'};">${t('models.viewDetails')}</div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div>
            <div style="font-size: 0.75rem; color: ${isDarkMode ? '#9ca3af' : '#64748b'};">${t('metrics.totalSales')}</div>
            <div style="font-weight: bold;">${formatProfitCompact(d.sales)}</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: ${isDarkMode ? '#9ca3af' : '#64748b'};">${t('metrics.share')}</div>
            <div style="font-weight: bold; color: #60a5fa;">${percentage}%</div>
          </div>
        </div>
      `);
      
      // Анимированное появление тултипа
      tooltip
        .style('visibility', 'visible')
        .style('opacity', '0')
        .style('transform', 'translateY(10px)')
        .style('left', `${event.pageX + 15}px`)
        .style('top', `${event.pageY - 20}px`)
        .transition()
        .duration(200)
        .style('opacity', '1')
        .style('transform', 'translateY(0)');
    };
    
    const hideTooltip = () => {
      const tooltip = d3.select('body').select('.chart-tooltip');
      
      tooltip
        .transition()
        .duration(200)
        .style('opacity', '0')
        .style('transform', 'translateY(10px)')
        .on('end', function() {
          tooltip.style('visibility', 'hidden');
        });
    };
    
    // Создаем градиентные заливки для столбцов
    const defs = svg.append('defs');
    
    years.forEach(year => {
      const gradientId = `gradient-${year}`;
      const gradient = defs.append('linearGradient')
        .attr('id', gradientId)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');
      
      const baseColor = d3.rgb(colorScale(year));
      
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', baseColor.brighter(0.5))
        .attr('stop-opacity', 1);
      
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', baseColor)
        .attr('stop-opacity', 0.8);
    });
    
    // Создаем эффект свечения для выделения
    defs.append('filter')
      .attr('id', 'glow')
      .append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'coloredBlur');
    
    // Для каждой группы добавляем столбцы по годам с учетом ширины x1
    itemGroups.selectAll('rect')
      .data(d => {
        // Создаем данные для всех годов, даже если значение отсутствует
        return years.map(year => ({
          year,
          value: d.years[year] || 0,
          key: d.key,
          name: d.name,
          isDay: isDaysList
        }));
      })
      .join('rect')
      .attr('class', 'bar')
      .attr('x', d => x1(d.year))
      .attr('y', d => y(d.value))
      .attr('width', x1.bandwidth())
      .attr('height', d => height - margin.bottom - y(d.value))
      .attr('rx', 4)
      .attr('fill', d => `url(#gradient-${d.year})`)
      .attr('stroke', d => isDarkMode ? d3.rgb(colorScale(d.year)).darker(0.5) : d3.rgb(colorScale(d.year)).darker(0.2))
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.9)
      .style('cursor', 'pointer')
      .style('transition', 'filter 0.2s, opacity 0.2s')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .style('filter', 'url(#glow)')
          .attr('opacity', 1);
        
        const tooltip = d3.select('body').select('.chart-tooltip');
        tooltip.html(`
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <div style="width: 12px; height: 12px; border-radius: 50%; background: ${colorScale(d.year)}; margin-right: 8px;"></div>
            <strong>${isDaysList ? `${t('filters.day')} ${d.name}` : d.name} ${d.year}</strong>
          </div>
          <div style="margin-left: 20px;">${t('charts.total')}: <strong>${formatProfitCompact(d.value)}</strong></div>
          <div style="font-size: 0.8rem; color: ${isDarkMode ? '#9ca3af' : '#64748b'}; margin-top: 5px;">
            ${t('models.viewDetails')}
          </div>
        `)
        .style('visibility', 'visible')
        .style('left', `${event.pageX + 15}px`)
        .style('top', `${event.pageY - 20}px`);
      })
      .on('mouseout', function() {
        d3.select(this)
          .style('filter', 'none')
          .attr('opacity', 0.9);
        
        d3.select('body').select('.chart-tooltip').style('visibility', 'hidden');
      })
      .on('click', (event, d) => {
        // При клике показываем детализацию - в зависимости от активной категории
        // переходим к выбору (розница) или сразу к регионам (опт, все)
        if (isDaysList) {
          // Если это день из списка дней, используем выбранный месяц и день для детализации
          const [year, month] = selectedMonth.split('-').map(Number);
          
          if (focusCategory === 'retail') {
            // Для розницы - показываем экран выбора
            showSelectionOptions(d.year, month, `${d.name} ${MONTHS[month-1]} ${d.year}`);
          } else {
            // Для опта и всех продаж - сразу показываем регионы
            showRegionDetails(d.year, month, `${d.name} ${MONTHS[month-1]} ${d.year}`);
          }
        } else if (isDay) {
          // Если это единственный день, просто передаем параметры
          const [year, month] = selectedMonth.split('-').map(Number);
          
          if (focusCategory === 'retail') {
            showSelectionOptions(d.year, month, `${d.name} ${MONTHS[month-1]} ${d.year}`);
          } else {
            showRegionDetails(d.year, month, `${d.name} ${MONTHS[month-1]} ${d.year}`);
          }
        } else {
          // Для месяца передаем месяц из данных
          if (focusCategory === 'retail') {
            showSelectionOptions(d.year, d.key, `${d.name} ${d.year}`);
          } else {
            showRegionDetails(d.year, d.key, `${d.name} ${d.year}`);
          }
        }
      })
      // Анимация появления
      .attr('y', height - margin.bottom)
      .attr('height', 0)
      .transition()
      .duration(800)
      .delay((d, i) => i * 50)
      .attr('y', d => y(d.value))
      .attr('height', d => height - margin.bottom - y(d.value));
    
    // Добавляем текстовые метки со значениями над столбцами если значение существенное
    itemGroups.selectAll('.bar-value-label')
      .data(d => years.map(year => ({
        year,
        value: d.years[year] || 0,
        key: d.key,
        name: d.name
      })))
      .join('text')
      .attr('class', 'bar-value-label')
      .attr('x', d => x1(d.year) + x1.bandwidth() / 2)
      .attr('y', d => y(d.value) - 8) // Положение над столбцом
      .attr('text-anchor', 'middle')
      .style('font-size', isDaysList ? '0.6rem' : '0.7rem') // Меньший размер для дней
      .style('font-weight', 'bold')
      .style('fill', isDarkMode ? '#f9fafb' : '#1f2937')
      .style('filter', 'drop-shadow(0 1px 1px rgba(0,0,0,0.7))')
      .style('opacity', 0) // Начинаем с прозрачного состояния для анимации
      .text(d => d.value > 0 ? formatProfitCompact(d.value) : '')
      .transition() // Анимация появления текста
      .duration(500)
      .delay((d, i) => 800 + i * 50) // Задержка после анимации столбцов
      .style('opacity', d => d.value > (maxValue * 0.05) ? 1 : 0); // Показываем только для значимых значений
    
    // Добавляем легенду с прокруткой для большого количества годов
    const legendContainer = svg.append('g')
      .attr('transform', `translate(${width - margin.right + 30}, ${margin.top + 20})`);
    
    // Определяем максимальное количество годов, которое можно показать без прокрутки
    const maxVisibleLegendItems = Math.min(10, Math.floor((height - margin.top - margin.bottom) / 30));
    const needScrolling = years.length > maxVisibleLegendItems;
    
    // Если много годов, добавляем фон для легенды
    if (needScrolling) {
      legendContainer.append('rect')
        .attr('width', 130)
        .attr('height', maxVisibleLegendItems * 30 + 10)
        .attr('rx', 10)
        .attr('fill', isDarkMode ? 'rgba(17, 24, 39, 0.6)' : 'rgba(255, 255, 255, 0.8)')
        .attr('stroke', isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)')
        .attr('stroke-width', 1);
    }
    
    // Создаем группу для элементов легенды
    const legend = legendContainer.append('g');
    
    // Добавляем элементы легенды для каждого года с интерактивностью
    const pieLegendItems = legend.selectAll('.legend-item')
      .data(years)
      .join('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 30})`)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, year) {
        // Подсвечиваем соответствующие столбцы
        svg.selectAll('.bar')
          .filter(d => d.year === year)
          .style('filter', 'url(#glow)')
          .attr('opacity', 1);
        
        // Выделяем элемент легенды
        d3.select(this)
          .style('opacity', 1);
        
        // Затемняем остальные элементы легенды
        pieLegendItems.filter(d => d !== year)
          .style('opacity', 0.5);
      })
      .on('mouseout', function() {
        // Возвращаем нормальный вид столбцам
        svg.selectAll('.bar')
          .style('filter', 'none')
          .attr('opacity', 0.9);
        
        // Возвращаем нормальный вид легенде
        pieLegendItems.style('opacity', 1);
      });
    
    // Добавляем маркеры и текст легенды
    pieLegendItems.append('rect')
      .attr('width', 12)
      .attr('height', 12)
      .attr('rx', 2)
      .attr('fill', d => colorScale(d));
    
    pieLegendItems.append('text')
      .attr('x', 18)
      .attr('y', 10)
      .style('font-size', '0.8rem')
      .style('fill', isDarkMode ? '#f9fafb' : '#1f2937')
      .text(d => d);
    
    // Добавляем подсказку о прокрутке, если много годов
    if (needScrolling) {
      legendContainer.append('text')
        .attr('x', 65)
        .attr('y', maxVisibleLegendItems * 30 + 25)
        .attr('text-anchor', 'middle')
        .style('font-size', '0.7rem')
        .style('fill', isDarkMode ? '#9ca3af' : '#64748b')
        .text('⟳ Прокрутите для просмотра');
    }
  };
  
  // Инициализация графика с полными данными
  updateChart();
};
const showCarModelDetails = (year, month, monthName) => {
  if (!mainChartRef.current) return;
  d3.selectAll('.chart-tooltip, .bar-tooltip, .model-tooltip').remove();
  
  // Массив переведенных месяцев
  const MONTHS = [
    t('months.january'),
    t('months.february'),
    t('months.march'),
    t('months.april'),
    t('months.may'),
    t('months.june'),
    t('months.july'),
    t('months.august'),
    t('months.september'),
    t('months.october'),
    t('months.november'),
    t('months.december')
  ];
  
  // Очищаем контейнер
  mainChartRef.current.innerHTML = '';
  
  // Создаем основной контейнер
  const container = d3.select(mainChartRef.current)
    .append('div')
    .style('width', '100%')
    .style('background', isDarkMode ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)')
    .style('border-radius', '1rem')
    .style('padding', '20px');
  
  // Определяем ширину контейнера для адаптивного дизайна
  const containerWidth = mainChartRef.current.clientWidth;
  const isMobile = containerWidth < 768;
    
  // Добавляем стилизованный заголовок и кнопки с улучшенным интерфейсом
  const header = container.append('div')
    .style('display', 'flex')
    .style('flex-direction', isMobile ? 'column' : 'row')
    .style('justify-content', 'space-between')
    .style('align-items', isMobile ? 'flex-start' : 'center')
    .style('margin-bottom', '20px')
    .style('padding-bottom', '15px')
    .style('gap', '15px')
    .style('border-bottom', `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)'}`);
  
  // Добавляем иконку и анимированный заголовок
  const titleSection = header.append('div')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('gap', '12px');
    
  titleSection.append('div')
    .style('background', isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)')
    .style('width', '40px')
    .style('height', '40px')
    .style('border-radius', '10px')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('justify-content', 'center')
    .html('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 24px; height: 24px;"><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><path d="M14 3v5h5M16 13H8M16 17H8M10 9H8"/></svg>');
  
  titleSection.append('h2')
    .style('font-size', isMobile ? '1.2rem' : '1.5rem')
    .style('font-weight', 'bold')
    .style('color', isDarkMode ? '#f9fafb' : '#0f172a')
    .style('margin', '0')
    .html(`${t('models.title', { period: monthName })}`);
  
  // Улучшенные интерактивные кнопки
  const buttonGroup = header.append('div')
    .style('display', 'flex')
    .style('flex-wrap', 'wrap')
    .style('gap', '12px');
  
  // Кнопка возврата к выбору с улучшенным дизайном и анимацией
  const backButton = buttonGroup.append('button')
    .style('background', isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)')
    .style('color', '#60a5fa')
    .style('border', `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.2)'}`)
    .style('padding', '8px 15px')
    .style('border-radius', '8px')
    .style('font-size', '0.85rem')
    .style('font-weight', '500')
    .style('cursor', 'pointer')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('gap', '6px')
    .style('transition', 'all 0.2s ease-in-out')
    .html(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> ${t('models.backToChoice')}`)
    .on('mouseover', function() {
      d3.select(this)
        .style('background', isDarkMode ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.15)')
        .style('transform', 'translateY(-2px)');
    })
    .on('mouseout', function() {
      d3.select(this)
        .style('background', isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)')
        .style('transform', 'translateY(0)');
    })
    .on('click', () => showSelectionOptions(year, month, monthName));
  
  // Кнопка возврата к общему обзору
  const overviewButton = buttonGroup.append('button')
    .style('background', isDarkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)')
    .style('color', '#34d399')
    .style('border', `1px solid ${isDarkMode ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.2)'}`)
    .style('padding', '8px 15px')
    .style('border-radius', '8px')
    .style('font-size', '0.85rem')
    .style('font-weight', '500')
    .style('cursor', 'pointer')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('gap', '6px')
    .style('transition', 'all 0.2s ease-in-out')
    .html(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> ${t('models.backToOverview')}`)
    .on('mouseover', function() {
      d3.select(this)
        .style('background', isDarkMode ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.15)')
        .style('transform', 'translateY(-2px)');
    })
    .on('mouseout', function() {
      d3.select(this)
        .style('background', isDarkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)')
        .style('transform', 'translateY(0)');
    })
    .on('click', renderPeriodComparisonTable);
  
  // Получаем данные о моделях из данных API
  const yearData = financialData[year] || {};
  const modelData = Object.values(yearData.modelData || {});
  
  // Проверяем наличие моделей
  console.log(`Найдено моделей: ${modelData.length}`, modelData);
  
  // Сортируем модели по объему продаж
  const sortedModels = [...modelData].sort((a, b) => b.totalSales - a.totalSales);
  
  // Исправляем: если данных о моделях нет, показываем сообщение
  if (sortedModels.length === 0) {
    container.append('div')
      .style('width', '100%')
      .style('height', '300px')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('justify-content', 'center')
      .style('color', isDarkMode ? '#9ca3af' : '#64748b')
      .style('font-size', '1.2rem')
      .text(t('models.noModelData'));
    
    return;
  }
  
  // Добавляем информационную панель с ключевыми показателями
  const infoPanel = container.append('div')
    .style('display', 'grid')
    .style('grid-template-columns', isMobile 
      ? 'repeat(auto-fit, minmax(150px, 1fr))' 
      : 'repeat(auto-fit, minmax(200px, 1fr))')
    .style('gap', '12px')
    .style('margin-bottom', '20px')
    .style('padding', '10px')
    .style('border-radius', '8px')
    .style('background', isDarkMode ? 'rgba(30, 41, 59, 0.4)' : 'rgba(241, 245, 249, 0.6)')
    .style('border', `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'}`);
  
  // Рассчитываем общие показатели на основе данных моделей
  const totalSales = Object.values(yearData.modelData)
    .reduce((total, model) => total + model.totalSales, 0);
    
  const totalCount = Object.values(yearData.modelData)
    .reduce((total, model) => 
      total + model.monthlyData.reduce((sum, month) => sum + (month.count || 0), 0), 0);
    
  const avgPrice = totalCount > 0 ? Math.round(totalSales / totalCount) : 0;
  
  // Проверяем на расхождение с данными года
  if (yearData.categories && Math.abs(totalSales - yearData.categories.retail) > 1) {
    console.warn(t('discrepancy.warning'), {
      sumByModels: totalSales,
      retailFromYearData: yearData.categories.retail,
      difference: totalSales - yearData.categories.retail
    });
  }
  
  // Добавляем информационные карточки с ключевыми показателями
  const createInfoCard = (title, value, subtitle, icon, color) => {
    const card = infoPanel.append('div')
      .style('background', isDarkMode ? `rgba(${color}, 0.1)` : `rgba(${color}, 0.05)`)
      .style('border-radius', '8px')
      .style('padding', isMobile ? '10px' : '12px')
      .style('border-left', `3px solid rgba(${color}, 0.5)`)
      .style('transition', 'transform 0.2s ease')
      .style('cursor', 'default')
      .on('mouseover', function() {
        d3.select(this).style('transform', 'translateY(-2px)');
      })
      .on('mouseout', function() {
        d3.select(this).style('transform', 'translateY(0)');
      });
    
    const cardHeader = card.append('div')
      .style('display', 'flex')
      .style('justify-content', 'space-between')
      .style('align-items', 'center')
      .style('margin-bottom', '8px');
    
    cardHeader.append('div')
      .style('font-size', isMobile ? '0.75rem' : '0.85rem')
      .style('color', isDarkMode ? '#9ca3af' : '#64748b')
      .text(title);
    
    cardHeader.append('div')
      .style('width', isMobile ? '20px' : '24px')
      .style('height', isMobile ? '20px' : '24px')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('justify-content', 'center')
      .style('color', `rgba(${color}, 0.8)`)
      .html(icon);
    
    card.append('div')
      .style('font-size', isMobile ? '1.1rem' : '1.25rem')
      .style('font-weight', 'bold')
      .style('color', isDarkMode ? '#f9fafb' : '#0f172a')
      .style('margin-bottom', '4px')
      .text(value);
    
    if (subtitle) {
      card.append('div')
        .style('font-size', isMobile ? '0.7rem' : '0.75rem')
        .style('color', isDarkMode ? '#9ca3af' : '#64748b')
        .text(subtitle);
    }
  };
  
  // Создаем информационные карточки с данными на основе моделей
  createInfoCard(
    t('metrics.totalSales'),
    formatProfitCompact(getCurrentMonthTotal()),
    t('metrics.basedOnModels'),
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
    '59, 130, 246'
  );

  // Рассчитываем долю премиум сегмента (модели со средней ценой выше среднего)
  const avgAllModelsPrice = avgPrice || 1;
  const premiumModels = sortedModels.filter(m => {
    const modelAvgPrice = m.monthlyData.reduce((sum, d) => sum + (d.count ? d.amount / d.count : 0), 0) / 12;
    return modelAvgPrice > avgAllModelsPrice * 1.3; // Премиум если на 30% дороже среднего
  });
  
  const premiumSales = premiumModels.reduce((sum, m) => sum + m.totalSales, 0);
  const premiumShare = totalSales > 0 ? (premiumSales / totalSales * 100) : 0;
  
  createInfoCard(
    t('metrics.premiumShare'),
    `${premiumShare.toFixed(1)}%`,
    `${premiumModels.length} ${t('models.models', { count: premiumModels.length })}`,
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
    '139, 92, 246'
  );
  
  // Отображаем лидера продаж
  if (sortedModels.length > 0) {
    const topModel = sortedModels[0];
    const topModelCount = topModel.monthlyData.reduce((sum, m) => sum + (m.count || 0), 0);
    
    createInfoCard(
      t('models.topSeller'),
      topModel.model_name,
      `${topModelCount} ${t('table.headers.count').toLowerCase()}`,
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8m-4-4v4m-5.2-4h10.4c1.12 0 1.68 0 2.108-.218a2 2 0 0 0 .874-.874C21 15.48 21 14.92 21 13.8V7.2c0-1.12 0-1.68-.218-2.108a2 2 0 0 0-.874-.874C19.48 4 18.92 4 17.8 4H6.2c-1.12 0-1.68 0-2.108.218a2 2 0 0 0-.874.874C3 5.52 3 6.08 3 7.2v6.6c0 1.12 0 1.68.218 2.108a2 2 0 0 0 .874.874C4.52 17 5.08 17 6.2 17Z"/></svg>',
      '16, 185, 129'
    );
  }
  
  // Создаем контейнер для основного анализа с адаптивной сетчатой структурой
  const gridContainer = container.append('div')
    .style('display', 'grid')
    .style('grid-template-columns', isMobile ? '1fr' : 'minmax(0, 2fr) minmax(0, 1fr)')
    .style('grid-template-rows', isMobile ? 'auto auto auto' : 'minmax(300px, 1fr) minmax(200px, auto)')
    .style('gap', '15px')
    .style('height', isMobile ? 'auto' : 'calc(100% - 170px)');
  
  // 1. Основной график - Горизонтальные столбцы по моделям с интерактивными элементами
  const barChartContainer = gridContainer.append('div')
    .style('grid-column', isMobile ? '1' : '1')
    .style('grid-row', isMobile ? '1' : '1 / span 2')
    .style('background', isDarkMode ? 'rgba(17, 24, 39, 0.4)' : 'rgba(255, 255, 255, 0.8)')
    .style('border-radius', '12px')
    .style('padding', isMobile ? '12px' : '16px')
    .style('border', `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'}`)
    .style('display', 'flex')
    .style('flex-direction', 'column')
    .style('min-height', isMobile ? '300px' : 'auto');
  
  // Заголовок с фильтрами
  const barChartHeader = barChartContainer.append('div')
    .style('display', 'flex')
    .style('flex-direction', isMobile ? 'column' : 'row')
    .style('justify-content', 'space-between')
    .style('align-items', isMobile ? 'flex-start' : 'center')
    .style('margin-bottom', '15px')
    .style('gap', isMobile ? '10px' : '0');
  
  barChartHeader.append('h3')
    .style('font-size', '1.1rem')
    .style('color', isDarkMode ? '#f9fafb' : '#0f172a')
    .style('margin', '0')
    .text(t('models.salesVolume'));
  
  const barChartFilters = barChartHeader.append('div')
    .style('display', 'flex')
    .style('gap', '8px');
  
  // Добавляем переключатели представления
  const viewOptions = [
    { id: 'sales', label: t('table.headers.amount'), icon: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="22"></line><polyline points="17 7 12 2 7 7"></polyline></svg>' },
    { id: 'count', label: t('table.headers.count'), icon: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line></svg>' }
  ];
  
  // Создаем группу кнопок для переключения режима просмотра
  const viewToggle = barChartFilters.append('div')
    .style('display', 'flex')
    .style('background', isDarkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(226, 232, 240, 0.5)')
    .style('border-radius', '6px')
    .style('padding', '2px');
  
  // Переменная для хранения текущего режима просмотра
  let viewMode = 'sales';
  
  viewOptions.forEach((option, i) => {
    viewToggle.append('button')
      .attr('id', `view-${option.id}`)
      .style('background', option.id === viewMode ? 'rgba(59, 130, 246, 0.4)' : 'transparent')
      .style('color', option.id === viewMode ? '#f9fafb' : (isDarkMode ? '#9ca3af' : '#64748b'))
      .style('border', 'none')
      .style('border-radius', '4px')
      .style('padding', '5px 8px')
      .style('font-size', '0.75rem')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('gap', '4px')
      .style('cursor', 'pointer')
      .style('transition', 'all 0.2s ease')
      .html(`${option.icon} ${option.label}`)
      .on('click', function() {
        // Обновляем стили кнопок
        viewToggle.selectAll('button')
          .style('background', 'transparent')
          .style('color', isDarkMode ? '#9ca3af' : '#64748b');
        
        d3.select(this)
          .style('background', 'rgba(59, 130, 246, 0.4)')
          .style('color', '#f9fafb');
        
        // Обновляем текущий режим просмотра
        viewMode = option.id;
        
        // Перерисовываем график
        updateBarChart(viewMode);
      });
  });
  
  // Создаем SVG-контейнер для графика
  const barChartSvg = barChartContainer.append('div')
    .style('flex-grow', '1')
    .style('width', '100%')
    .style('height', isMobile ? '250px' : '0')
    .style('position', 'relative')
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .style('overflow', 'visible');
  
  // Функция обновления графика в зависимости от выбранного представления
  function updateBarChart(viewMode) {
    // Очищаем текущий график
    barChartSvg.selectAll('*').remove();
    
    // Определяем размеры графика
    const barWidth = barChartSvg.node().clientWidth;
    const barHeight = barChartSvg.node().clientHeight;
    const barMargin = { top: 10, right: isMobile ? 40 : 120, bottom: 20, left: isMobile ? 120 : 180 };
    
    // Определяем, какие данные использовать для отображения
    // Берем данные текущего месяца для всех моделей
    const data = sortedModels.map(model => {
      // Получаем данные модели за текущий месяц
      const monthData = model.monthlyData[month-1] || { amount: 0, count: 0 };
      
      return {
        id: model.model_id,
        name: model.model_name,
        value: viewMode === 'sales' ? monthData.amount : monthData.count,
        // Полные данные для тултипа
        sales: monthData.amount,
        count: monthData.count,
        avgPrice: monthData.count > 0 ? monthData.amount / monthData.count : 0,
        totalSales: model.totalSales,
        photo_sha: model.photo_sha,
        image_url: model.photo_sha ? `https://uzavtosalon.uz/b/img/img-model.php?sha=${model.photo_sha}` : null
      };
    })
    .sort((a, b) => b.value - a.value) // Сортируем по значению
    .slice(0, 10); // Берем только топ-10 моделей для наглядности
    
    // Проверяем, есть ли данные
    if (data.length === 0) {
      barChartSvg.append('text')
        .attr('x', barWidth / 2)
        .attr('y', barHeight / 2)
        .attr('text-anchor', 'middle')
        .style('fill', isDarkMode ? '#9ca3af' : '#64748b')
        .style('font-size', '1rem')
        .text(t('models.noModelData'));
      return;
    }
    
    // Создаем шкалы
    const barX = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) * 1.05])
      .nice()
      .range([barMargin.left, barWidth - barMargin.right]);
    
    const barY = d3.scaleBand()
      .domain(data.map(d => d.name))
      .range([barMargin.top, barHeight - barMargin.bottom])
      .padding(0.3);
    
    // Создаем линейный градиент для заливки полос
    const barDefs = barChartSvg.append('defs');
    
    // Основной градиент
    const barGradient = barDefs.append('linearGradient')
      .attr('id', 'sales-bar-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
    
    barGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#3b82f6')
      .attr('stop-opacity', 0.9);
    
    barGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#60a5fa')
      .attr('stop-opacity', 0.7);
    
    // Градиент для наведения
    const barHoverGradient = barDefs.append('linearGradient')
      .attr('id', 'sales-bar-hover-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
    
    barHoverGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#2563eb')
      .attr('stop-opacity', 1);
    
    barHoverGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#3b82f6')
      .attr('stop-opacity', 0.8);
    
    // Добавляем фоновую сетку
    barChartSvg.append('g')
      .selectAll('line')
      .data(barX.ticks(5))
      .join('line')
      .attr('x1', d => barX(d))
      .attr('x2', d => barX(d))
      .attr('y1', barMargin.top - 5)
      .attr('y2', barHeight - barMargin.bottom)
      .attr('stroke', isDarkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(203, 213, 225, 0.3)')
      .attr('stroke-dasharray', '3,3');
    
    // Добавляем оси с улучшенными стилями
    barChartSvg.append('g')
      .attr('transform', `translate(0,${barHeight - barMargin.bottom})`)
      .call(d3.axisBottom(barX)
        .ticks(5)
        .tickFormat(d => viewMode === 'sales' ? formatProfitCompact(d) : d3.format('~s')(d)))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text')
        .style('fill', isDarkMode ? '#9ca3af' : '#64748b')
        .style('font-size', '0.7rem'));
    
    barChartSvg.append('g')
      .attr('transform', `translate(${barMargin.left},0)`)
      .call(d3.axisLeft(barY))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').remove())
      .call(g => g.selectAll('text')
        .style('fill', isDarkMode ? '#d1d5db' : '#4b5563')
        .style('font-size', isMobile ? '0.7rem' : '0.8rem')
        .style('font-weight', (d, i) => i === 0 ? 'bold' : 'normal'));
    
    // Создаем улучшенный тултип
    const barTooltip = d3.select('body').select('.model-tooltip');
    
    if (barTooltip.empty()) {
      d3.select('body').append('div')
        .attr('class', 'model-tooltip')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background', isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)')
        .style('color', isDarkMode ? '#f9fafb' : '#0f172a')
        .style('padding', '12px 15px')
        .style('border-radius', '8px')
        .style('font-size', '0.9rem')
        .style('box-shadow', '0 10px 25px rgba(0, 0, 0, 0.2)')
        .style('border', `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`)
        .style('z-index', 1000)
        .style('max-width', '280px')
        .style('backdrop-filter', 'blur(4px)');
    }
    
    // Анимированная функция для тултипа
    const showTooltip = (event, d) => {
      const tooltip = d3.select('body').select('.model-tooltip');
      
      // Вычисляем процент
      const totalValue = viewMode === 'sales'
        ? data.reduce((sum, m) => sum + m.sales, 0)
        : data.reduce((sum, m) => sum + m.count, 0);
      
      const percentage = viewMode === 'sales'
        ? ((d.sales / totalValue) * 100).toFixed(1)
        : ((d.count / totalValue) * 100).toFixed(1);
      
      // Добавляем красиво форматированное содержимое тултипа
      let tooltipHTML = `
        <div style="border-bottom: 1px solid ${isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.8)'}; margin-bottom: 8px; padding-bottom: 8px;">
          <div style="font-weight: bold; font-size: 1rem; margin-bottom: 4px;">${d.name}</div>
          <div style="font-size: 0.8rem; color: ${isDarkMode ? '#9ca3af' : '#64748b'};">${t('models.viewDetails')}</div>
        </div>
      `;
      
      // Если есть изображение, добавляем его
      if (d.image_url) {
        tooltipHTML += `
          <div style="text-align: center; margin-bottom: 8px;">
            <img src="${d.image_url}" style="max-width: 100%; max-height: 100px; object-fit: contain; border-radius: 4px;">
          </div>
        `;
      }
      
      tooltipHTML += `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div>
            <div style="font-size: 0.75rem; color: ${isDarkMode ? '#9ca3af' : '#64748b'};">${t('table.headers.totalSales')}</div>
            <div style="font-weight: bold;">${formatProfitCompact(d.sales)}</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: ${isDarkMode ? '#9ca3af' : '#64748b'};">${t('table.headers.count')}</div>
            <div style="font-weight: bold;">${d.count} ${t('table.headers.count').toLowerCase()}</div>
          </div>
        </div>
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid ${isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.8)'};">
          <div style="display: flex; justify-content: space-between;">
            <span style="font-size: 0.75rem; color: ${isDarkMode ? '#9ca3af' : '#64748b'};">${t('metrics.averagePrice')}:</span>
            <span style="font-weight: bold; color: #10b981;">${formatProfitCompact(d.avgPrice)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 4px;">
            <span style="font-size: 0.75rem; color: ${isDarkMode ? '#9ca3af' : '#64748b'};">${t('metrics.share')}:</span>
            <span style="font-weight: bold; color: #60a5fa;">${percentage}%</span>
          </div>
        </div>
      `;
      
      tooltip.html(tooltipHTML);
      
      // Анимированное появление тултипа
      tooltip
        .style('visibility', 'visible')
        .style('opacity', '0')
        .style('transform', 'translateY(10px)')
        .style('left', `${event.pageX + 15}px`)
        .style('top', `${event.pageY - 20}px`)
        .transition()
        .duration(200)
        .style('opacity', '1')
        .style('transform', 'translateY(0)');
    };
    
    const hideTooltip = () => {
      const tooltip = d3.select('body').select('.model-tooltip');
      
      tooltip
        .transition()
        .duration(200)
        .style('opacity', '0')
        .style('transform', 'translateY(10px)')
        .on('end', function() {
          tooltip.style('visibility', 'hidden');
        });
    };
    
    // Создаем градиентные заливки для столбцов
    const defs = barChartSvg.append('defs');
    
    data.forEach((d, i) => {
      const id = `bar-gradient-${i}`;
      
      const gradient = defs.append('linearGradient')
        .attr('id', id)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '0%');
      
      const baseColor = d3.rgb(i === 0 ? '#3b82f6' : '#4b5563');
      const startColor = baseColor.brighter(0.5);
      const endColor = baseColor;
      
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', startColor.toString())
        .attr('stop-opacity', 0.9);
      
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', endColor.toString())
        .attr('stop-opacity', 0.7);
    });
    
    // Создаем эффект свечения для выделения
    defs.append('filter')
      .attr('id', 'glow')
      .append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'coloredBlur');
    
    // Добавляем полосы для моделей с улучшенной анимацией и интерактивностью
    const bars = barChartSvg.selectAll('.car-model-bar')
      .data(data)
      .join('rect')
      .attr('class', 'car-model-bar')
      .attr('x', barMargin.left)
      .attr('y', d => barY(d.name))
      .attr('height', barY.bandwidth())
      .attr('fill', (d, i) => `url(#bar-gradient-${i})`)
      .attr('rx', 6)
      .attr('ry', 6)
      .style('cursor', 'pointer')
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))')
      .style('transition', 'all 0.2s ease-in-out')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('fill', 'url(#sales-bar-hover-gradient)')
          .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))');
          
        showTooltip(event, d);
      })
      .on('mousemove', function(event, d) {
        const tooltip = d3.select('body').select('.model-tooltip');
        tooltip
          .style('left', `${event.pageX + 15}px`)
          .style('top', `${event.pageY - 20}px`);
      })
      .on('mouseout', function(event, d, i) {
        d3.select(this)
          .attr('fill', (d, i) => `url(#bar-gradient-${i})`)
          .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))');
          
        hideTooltip();
      })
      // Анимация появления
      .attr('width', 0)
      .transition()
      .duration(800)
      .delay((d, i) => i * 50)
      .attr('width', d => barX(d.value) - barMargin.left);
    
    // Добавляем текстовые метки со значениями над столбцами если значение существенное
    barChartSvg.selectAll('.bar-value-label')
      .data(data)
      .join('text')
      .attr('class', 'bar-value-label')
      .attr('x', d => barX(d.value) + 10)
      .attr('y', d => barY(d.name) + barY.bandwidth() / 2)
      .attr('dy', '0.35em')
      .style('font-size', '0.7rem')
      .style('font-weight', 'bold')
      .style('fill', isDarkMode ? '#f9fafb' : '#0f172a')
      .style('opacity', 0)
      .text(d => viewMode === 'sales' ? formatProfitCompact(d.value) : d.value)
      .transition()
      .duration(500)
      .delay((d, i) => 800 + i * 50)
      .style('opacity', 1);
  }
  
  // Первичная отрисовка графика в режиме "продажи"
  updateBarChart('sales');
  
  // 2. Правый верхний график - улучшенная круговая диаграмма с интерактивностью
  const pieChartContainer = gridContainer.append('div')
    .style('grid-column', isMobile ? '1' : '2')
    .style('grid-row', isMobile ? '2' : '1')
    .style('background', isDarkMode ? 'rgba(17, 24, 39, 0.4)' : 'rgba(255, 255, 255, 0.8)')
    .style('border-radius', '12px')
    .style('padding', isMobile ? '12px' : '16px')
    .style('border', `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'}`)
    .style('min-height', isMobile ? '300px' : 'auto');
  
  // Заголовок
  pieChartContainer.append('h3')
    .style('font-size', '1.1rem')
    .style('color', isDarkMode ? '#f9fafb' : '#0f172a')
    .style('margin-bottom', '15px')
    .style('text-align', 'center')
    .text(t('models.salesStructure'));
  
  // Создаем SVG для пончиковой диаграммы
  const pieSvg = pieChartContainer.append('svg')
    .attr('width', '100%')
    .attr('height', 'calc(100% - 30px)');
  
  const pieWidth = pieSvg.node().clientWidth;
  const pieHeight = pieSvg.node().clientHeight;
  const pieRadius = Math.min(pieWidth, pieHeight) / 2 * 0.8;
  
  // Берем топ-5 моделей для пирога
  const pieData = sortedModels.slice(0, 5).map(model => ({
    id: model.model_id,
    name: model.model_name,
    value: model.totalSales
  }));
  
  // Если есть больше моделей, добавляем "Другие"
  if (sortedModels.length > 5) {
    const otherModelsTotal = sortedModels.slice(5).reduce((sum, model) => sum + model.totalSales, 0);
    if (otherModelsTotal > 0) {
      pieData.push({
        id: 'others',
        name: t('regions.otherRegions'),
        value: otherModelsTotal
      });
    }
  }
  
  // Создаем улучшенную цветовую схему
  const pieColor = d3.scaleOrdinal()
    .domain(pieData.map(d => d.name))
    .range([
      '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
      '#0ea5e9', '#6366f1', '#a855f7', '#d946ef', '#f43f5e'
    ]);
  
  // Создаем генератор пончика с закругленными краями
  const pie = d3.pie()
    .value(d => d.value)
    .sort(null)
    .padAngle(0.02);
  
  const arc = d3.arc()
    .innerRadius(pieRadius * 0.5)
    .outerRadius(pieRadius * 0.95)
    .cornerRadius(5);
  
  const arcHover = d3.arc()
    .innerRadius(pieRadius * 0.48)
    .outerRadius(pieRadius * 1)
    .cornerRadius(5);
  
  // Создаем группу для пончика
  const pieG = pieSvg.append('g')
    .attr('transform', `translate(${pieWidth / 2}, ${pieHeight / 2})`);
  
  // Создаем градиенты для каждого сегмента
  const pieDefs = pieSvg.append('defs');
  
  pieData.forEach((model, i) => {
    const color = pieColor(model.name);
    const gradientId = `pie-gradient-${model.id}`;
    
    const gradient = pieDefs.append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%');
    
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', d3.rgb(color).brighter(0.5))
      .attr('stop-opacity', 0.95);
    
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', color)
      .attr('stop-opacity', 0.8);
    
    // Создаем градиент для эффекта наведения
    const hoverGradientId = `pie-hover-gradient-${model.id}`;
    
    const hoverGradient = pieDefs.append('linearGradient')
      .attr('id', hoverGradientId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%');
    
    hoverGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', d3.rgb(color).brighter(0.7))
      .attr('stop-opacity', 1);
    
    hoverGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', d3.rgb(color).brighter(0.2))
      .attr('stop-opacity', 0.9);
  });
  
  // Добавляем фильтр для эффекта свечения
  pieDefs.append('filter')
    .attr('id', 'glow')
    .append('feGaussianBlur')
    .attr('stdDeviation', '3')
    .attr('result', 'coloredBlur');
  
  // Создаем сегменты пончика с новыми визуальными эффектами
  const pieArcs = pieG.selectAll('path')
    .data(pie(pieData))
    .join('path')
    .attr('d', arc)
    .attr('fill', d => `url(#pie-gradient-${d.data.id})`)
    .attr('stroke', isDarkMode ? '#111827' : '#ffffff')
    .attr('stroke-width', 1)
    .attr('data-model', d => d.data.id)
    .style('cursor', 'pointer')
    .style('transition', 'all 0.3s ease')
    .on('mouseover', function(event, d) {
      d3.select(this)
        .attr('fill', `url(#pie-hover-gradient-${d.data.id})`)
        .attr('d', arcHover)
        .style('filter', 'url(#glow)');
      
      // Обновляем текст в центре
      centerText.text(d.data.name)
        .style('font-size', d.data.name.length > 15 ? '0.8rem' : '0.9rem');
        
      centerNumber.text(formatProfitCompact(d.data.value));
      
      // Вычисляем процент
      const total = pieData.reduce((sum, d) => sum + d.value, 0);
      const percentage = ((d.data.value / total) * 100).toFixed(1);
      centerPercent.text(`${percentage}%`);
      
      // Подсвечиваем соответствующую метку
      pieG.selectAll('.pie-label')
        .filter(label => label.data.id === d.data.id)
        .style('font-weight', 'bold')
        .style('fill', '#fff');
    })
    .on('mouseout', function(event, d) {
      d3.select(this)
        .attr('fill', `url(#pie-gradient-${d.data.id})`)
        .attr('d', arc)
        .style('filter', 'none');
      
      // Восстанавливаем текст в центре
      centerText.text(t('metrics.volume'))
        .style('font-size', '0.9rem');
        
      centerNumber.text(formatProfitCompact(getCurrentMonthTotal()));
      centerPercent.text('100%');
      
      // Восстанавливаем метки
      pieG.selectAll('.pie-label')
        .style('font-weight', 'normal')
        .style('fill', isDarkMode ? '#d1d5db' : '#4b5563');
    })
    .on('click', (event, d) => {
      console.log(`Клик по модели: ${d.data.name} (ID: ${d.data.id})`);
    });
  
  // Добавляем анимацию с поочередным появлением сегментов
  pieArcs.each(function(d, i) {
    const totalLength = Math.PI * 2;
    
    d3.select(this)
      .style('opacity', 0)
      .transition()
      .duration(700)
      .delay(i * 100)
      .style('opacity', 1)
      .attrTween('d', function() {
        const interpolate = d3.interpolate(
          { startAngle: d.startAngle, endAngle: d.startAngle },
          { startAngle: d.startAngle, endAngle: d.endAngle }
        );
        return function(t) {
          return arc(interpolate(t));
        };
      });
  });
  
  // Добавляем текст в центр пончика с улучшенным стилем
  const centerGroup = pieG.append('g');
  
  // Добавляем декоративный круг в центре
  centerGroup.append('circle')
    .attr('r', pieRadius * 0.48)
    .attr('fill', isDarkMode ? 'rgba(17, 24, 39, 0.7)' : 'rgba(248, 250, 252, 0.8)')
    .attr('stroke', isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)')
    .attr('stroke-width', 1);
  
  const centerText = centerGroup.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '-1.2em')
    .style('font-size', '0.9rem')
    .style('fill', isDarkMode ? '#d1d5db' : '#64748b')
    .style('transition', 'all 0.3s ease')
    .text(t('metrics.volume'));
  
  const centerNumber = centerGroup.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '0.4em')
    .style('font-size', isMobile ? '1.1rem' : '1.3rem')
    .style('font-weight', 'bold')
    .style('fill', isDarkMode ? '#f9fafb' : '#0f172a')
    .text(formatProfitCompact(getCurrentMonthTotal()));
  
  const centerPercent = centerGroup.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '2em')
    .style('font-size', isMobile ? '0.9rem' : '1.1rem')
    .style('fill', '#60a5fa')
    .style('font-weight', '500')
    .text('100%');
  
  // Добавляем компактные метки для сегментов (показываем только топ модели)
  const topPieModels = pieData.slice(0, Math.min(5, pieData.length));
  const pieLabels = pieG.selectAll('.pie-label')
    .data(pie(topPieModels))
    .join('text')
    .attr('class', 'pie-label')
    .attr('transform', d => {
      const pos = arc.centroid(d);
      const offset = 1.8; // Увеличиваем смещение
      return `translate(${pos[0] * offset}, ${pos[1] * offset})`;
    })
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .style('font-size', isMobile ? '0.6rem' : '0.7rem')
    .style('fill', isDarkMode ? '#d1d5db' : '#4b5563')
    .style('pointer-events', 'none')
    .style('opacity', 0)
    .text(d => {
      // Сокращаем длинные названия
      const name = d.data.name;
      return name.length > 10 ? name.substring(0, 10) + '...' : name;
    })
    .transition()
    .duration(500)
    .delay((d, i) => 1000 + i * 100)
    .style('opacity', 1);
  
  // 3. Правый нижний график - улучшенная панель метрик
  const metricsContainer = gridContainer.append('div')
    .style('grid-column', isMobile ? '1' : '2')
    .style('grid-row', isMobile ? '3' : '2')
    .style('background', isDarkMode ? 'rgba(17, 24, 39, 0.4)' : 'rgba(255, 255, 255, 0.8)')
    .style('border-radius', '12px')
    .style('padding', isMobile ? '12px' : '16px')
    .style('border', `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'}`)
    .style('display', 'flex')
    .style('flex-direction', 'column');
  
  metricsContainer.append('h3')
    .style('font-size', '1.1rem')
    .style('color', isDarkMode ? '#f9fafb' : '#0f172a')
    .style('margin-bottom', '15px')
    .style('text-align', 'center')
    .text(t('models.keyIndicators'));
  
  // Создаем контейнер для метрик с улучшенным интерфейсом
  const metricsGrid = metricsContainer.append('div')
    .style('display', 'grid')
    .style('grid-template-columns', isMobile 
      ? 'repeat(auto-fit, minmax(120px, 1fr))' 
      : 'repeat(auto-fit, minmax(150px, 1fr))')
    .style('gap', '12px')
    .style('flex-grow', '1');
  
  // Метрика "Средняя цена" на основе реальных данных
  const createMetricCard = (title, value, subtitle, icon, color) => {
    const card = metricsGrid.append('div')
      .style('background', isDarkMode ? `rgba(${color}, 0.08)` : `rgba(${color}, 0.05)`)
      .style('border-radius', '10px')
      .style('padding', isMobile ? '12px' : '15px')
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('justify-content', 'center')
      .style('position', 'relative')
      .style('border', `1px solid rgba(${color}, ${isDarkMode ? 0.2 : 0.15})`)
      .style('transition', 'all 0.2s ease')
      .style('cursor', 'default')
      .on('mouseover', function() {
        d3.select(this)
          .style('transform', 'translateY(-2px)')
          .style('box-shadow', `0 6px 16px -6px rgba(${color}, 0.25)`);
      })
      .on('mouseout', function() {
        d3.select(this)
          .style('transform', 'translateY(0)')
          .style('box-shadow', 'none');
      });
    
    // Добавляем содержимое
    const content = card.append('div')
      .style('position', 'relative')
      .style('z-index', '1');
    
    const iconContainer = content.append('div')
      .style('position', 'absolute')
      .style('top', '-8px')
      .style('right', '-8px')
      .style('width', isMobile ? '24px' : '28px')
      .style('height', isMobile ? '24px' : '28px')
      .style('border-radius', '50%')
      .style('background', `rgba(${color}, 0.2)`)
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('justify-content', 'center')
      .style('color', `rgb(${color})`)
      .html(icon);
    
    content.append('div')
      .style('font-size', isMobile ? '0.75rem' : '0.8rem')
      .style('color', isDarkMode ? '#9ca3af' : '#64748b')
      .style('margin-bottom', '5px')
      .text(title);
    
    content.append('div')
      .style('font-size', isMobile ? '1.1rem' : '1.2rem')
      .style('font-weight', 'bold')
      .style('color', `rgb(${color})`)
      .style('margin-bottom', '4px')
      .text(value);
    
    if (subtitle) {
      content.append('div')
        .style('font-size', isMobile ? '0.7rem' : '0.75rem')
        .style('color', isDarkMode ? '#9ca3af' : '#64748b')
        .text(subtitle);
    }
  };
  
  // Топ-модель по количеству продаж
  if (sortedModels.length > 0) {
    // Найдем модель с максимальным количеством продаж
    const topModelByCount = [...sortedModels].sort((a, b) => {
      const countA = a.monthlyData.reduce((sum, m) => sum + (m.count || 0), 0);
      const countB = b.monthlyData.reduce((sum, m) => sum + (m.count || 0), 0);
      return countB - countA;
    })[0];
    
    const topModelCount = topModelByCount.monthlyData.reduce((sum, m) => sum + (m.count || 0), 0);
    
    // Сокращаем слишком длинные названия
    let modelName = topModelByCount.model_name;
    if (modelName.length > 15) {
      modelName = modelName.substring(0, 12) + '...';
    }
    
    createMetricCard(
      t('models.topSeller'),
      modelName,
      `${topModelCount} ${t('table.headers.count').toLowerCase()}`,
'<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
     '59, 130, 246'
   );
 }
 
 // Доходная модель (по объему продаж)
 if (sortedModels.length > 0) {
   const topModelBySales = sortedModels[0];
   
   // Сокращаем слишком длинные названия
   let modelName = topModelBySales.model_name;
   if (modelName.length > 15) {
     modelName = modelName.substring(0, 12) + '...';
   }
   
   createMetricCard(
     t('models.profitableModel'),
     modelName,
     `${formatProfitCompact(topModelBySales.totalSales)}`,
     '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>',
     '236, 72, 153'
   );
 }
 
 // Средняя цена
 createMetricCard(
   t('metrics.averagePrice'),
   formatProfitCompact(avgPrice),
   t('metrics.basedOnModels'),
   '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
   '16, 185, 129'
 );
 
 // Количество продаж
 createMetricCard(
   t('metrics.salesCount'),
   totalCount.toLocaleString(),
   `${MONTHS[month-1]} ${year}`,
   '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
   '245, 158, 11'
 );
 
 // Загружаем Font Awesome для иконок
 if (!document.querySelector('[href*="font-awesome"]')) {
   const head = document.head || document.getElementsByTagName('head')[0];
   const fontAwesome = document.createElement('link');
   fontAwesome.rel = 'stylesheet';
   fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css';
   head.appendChild(fontAwesome);
 }
};      
  
const showRegionDetails = async (year, month, monthName) => {
  if (!mainChartRef.current) return;
  d3.selectAll('.chart-tooltip, .bar-tooltip, .model-tooltip').remove();
  
  // Очищаем контейнер
  mainChartRef.current.innerHTML = '';
  
  // Создаем основной контейнер
  const container = d3.select(mainChartRef.current)
    .append('div')
    .style('width', '100%')
    .style('height', '100%')
    .style('background', isDarkMode ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)')
    .style('border-radius', '1rem')
    .style('padding', '20px');
  
  // Определяем ширину контейнера для адаптивного дизайна
  const containerWidth = mainChartRef.current.clientWidth;
  const isMobile = containerWidth < 768;
  
  // Заголовок и навигация
  const header = container.append('div')
    .style('display', 'flex')
    .style('flex-direction', isMobile ? 'column' : 'row')
    .style('justify-content', 'space-between')
    .style('align-items', isMobile ? 'flex-start' : 'center')
    .style('margin-bottom', '20px')
    .style('padding-bottom', '15px')
    .style('gap', '15px')
    .style('border-bottom', `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)'}`);
  
  // Добавляем иконку и анимированный заголовок
  const titleSection = header.append('div')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('gap', '12px');
    
  titleSection.append('div')
    .style('background', isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)')
    .style('width', '40px')
    .style('height', '40px')
    .style('border-radius', '10px')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('justify-content', 'center')
    .html('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 24px; height: 24px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>');
  
  titleSection.append('h2')
    .style('font-size', isMobile ? '1.2rem' : '1.5rem')
    .style('font-weight', 'bold')
    .style('color', isDarkMode ? '#f9fafb' : '#0f172a')
    .style('margin', '0')
    .html(`${t('regions.title', { period: monthName })}`);
  
  // Улучшенные интерактивные кнопки
  const buttonGroup = header.append('div')
    .style('display', 'flex')
    .style('flex-wrap', 'wrap')
    .style('gap', '12px');
  
  buttonGroup.append('button')
    .style('background', isDarkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)')
    .style('color', '#34d399')
    .style('border', `1px solid ${isDarkMode ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.2)'}`)
    .style('padding', '8px 15px')
    .style('border-radius', '8px')
    .style('font-size', '0.85rem')
    .style('font-weight', '500')
    .style('cursor', 'pointer')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('gap', '6px')
    .style('transition', 'all 0.2s ease-in-out')
    .html(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> ${t('models.backToOverview')}`)
    .on('mouseover', function() {
      d3.select(this)
        .style('background', isDarkMode ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.15)')
        .style('transform', 'translateY(-2px)');
    })
    .on('mouseout', function() {
      d3.select(this)
        .style('background', isDarkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)')
        .style('transform', 'translateY(0)');
    })
    .on('click', renderPeriodComparisonTable);

  // Функция для загрузки данных с API
  const loadRegionData = async (startDate, endDate, category, showLoader = true) => {
    try {
      // Показываем индикатор загрузки, если нужно
      if (showLoader) {
        container.append('div')
          .attr('class', 'region-data-loader')
          .style('display', 'flex')
          .style('align-items', 'center')
          .style('justify-content', 'center')
          .style('height', '100px')
          .style('color', isDarkMode ? '#9ca3af' : '#64748b')
          .html(`
            <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            <span class="ml-3">${t('regions.loadingData')}</span>
          `);
      }
      
      // Определяем соответствующий эндпоинт API в зависимости от категории
      let endpoint = "get_all_payment";
      if (category === 'retail') {
        endpoint = "get_roz_payment";
      } else if (category === 'wholesale') {
        endpoint = "get_opt_payment";
      }
      
      console.log(`Выполняется запрос к API: ${endpoint} с датами ${startDate}-${endDate}`);
      
      // Выполняем запрос к API
   const token = localStorage.getItem('authToken');

// Загружаем данные с API
const response = await fetch(`https://uzavtoanalytics.uz/dashboard/proxy`, {
  method: "POST",
  headers: { 
    "Content-Type": "application/json",
    "X-Auth": `Bearer ${token}`
  },
  body: JSON.stringify({
    url: `/b/dashboard/infos&${endpoint}`,
    begin_date: startDate,
    end_date: endDate
  })
});

      
      if (!response.ok) {
        throw new Error(t('errors.httpError', { status: response.status }));
      }
      
      // Парсим ответ
      const apiData = await response.json();
      console.log("Получены данные от API:", apiData);
      
      // Формируем месяц в формате YYYY-MM для поиска
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;
      
      // Извлекаем данные о регионах
      let regionData = [];
      
      // Проверяем, какой тип данных мы обрабатываем на основе категории
      if (category === 'retail') {
        // Для розничных продаж обрабатываем данные аналогично transformModelBasedData
        console.log("Обрабатываем данные розничных продаж");
        
        if (Array.isArray(apiData)) {
          // Объединяем данные по регионам из всех моделей
          const regionMap = new Map();
          
          apiData.forEach(model => {
            if (!model || !Array.isArray(model.filter_by_region)) {
              console.warn("Модель без данных о регионах:", model);
              return;
            }
            
            // Ищем данные для выбранного месяца
            const monthData = model.filter_by_region.find(m => m.month === monthStr);
            if (!monthData || !Array.isArray(monthData.regions)) {
              console.log(`Нет данных о регионах для месяца ${monthStr} в модели ${model.model_name || 'неизвестная модель'}`);
              return;
            }
            
            // Агрегируем данные о регионах для всех моделей
            monthData.regions.forEach(region => {
              if (!region || !region.region_id) return;
              
              const regionId = region.region_id;
              if (!regionMap.has(regionId)) {
                regionMap.set(regionId, {
                  region_id: regionId,
                  region_name: region.region_name || t('regions.unknownRegion'),
                  amount: 0,
                  all_count: 0
                });
              }
              
              // Суммируем значения для этого региона
              const regionEntry = regionMap.get(regionId);
              regionEntry.amount += parseFloat(region.amount || 0);
              regionEntry.all_count += parseInt(region.all_count || 0, 10);
            });
          });
          
          // Преобразуем Map в массив
          regionData = Array.from(regionMap.values());
          console.log(`Объединены данные о ${regionData.length} регионах из розничных продаж`);
        } else {
          console.warn("Данные розничных продаж не являются массивом:", apiData);
        }
      } else {
        // Для оптовых и общих продаж - стандартная обработка
        console.log("Обрабатываем данные оптовых/общих продаж");
        
        // Функция для извлечения данных о регионах из ответа API
        const extractRegions = (apiData, monthStr) => {
          if (!apiData) return [];
          
          // Проверяем разные структуры данных
          if (Array.isArray(apiData)) {
            // Если ответ - массив
            for (const item of apiData) {
              if (Array.isArray(item.filter_by_region)) {
                const monthData = item.filter_by_region.find(m => m.month === monthStr);
                if (monthData && Array.isArray(monthData.regions)) {
                  console.log(`Найдены данные о регионах для месяца ${monthStr}: ${monthData.regions.length} регионов`);
                  return monthData.regions;
                }
              }
            }
          } else if (apiData && typeof apiData === 'object') {
            // Если ответ - объект
            if (Array.isArray(apiData.filter_by_region)) {
              const monthData = apiData.filter_by_region.find(m => m.month === monthStr);
              if (monthData && Array.isArray(monthData.regions)) {
                console.log(`Найдены данные о регионах для месяца ${monthStr}: ${monthData.regions.length} регионов`);
                return monthData.regions;
              }
            }
            
            // Проверяем прямой доступ к regions
            if (Array.isArray(apiData.regions)) {
              console.log(`Найдены данные о регионах напрямую: ${apiData.regions.length} регионов`);
              return apiData.regions;
            }
          }
          
          return [];
        };
        
        regionData = extractRegions(apiData, monthStr);
      }
      
      // Удаляем индикатор загрузки, если он есть
      container.selectAll('.region-data-loader').remove();
      
      if (regionData.length === 0) {
        console.log(t('regions.noData'));
        return null;
      }
      
      console.log(`Найдено ${regionData.length} регионов в API-ответе`);
      return regionData;
      
    } catch (error) {
      // Удаляем индикатор загрузки, если он есть
      container.selectAll('.region-data-loader').remove();
      
      console.error('Ошибка при получении данных о регионах:', error);
      
      // Показываем сообщение об ошибке
      container.append('div')
        .style('color', '#ef4444')
        .style('padding', '10px')
        .style('background', isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)')
        .style('border', `1px solid ${isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'}`)
        .style('border-radius', '6px')
        .style('margin-top', '10px')
        .text(t('errors.loadingError') + ': ' + error.message);
      
      return null;
    }
  };
  
  // Функция преобразования данных API в удобный формат
  const processRegionData = (apiRegions) => {
    if (!apiRegions || !Array.isArray(apiRegions)) return [];
    
    return apiRegions.map(region => {
      return {
        id: region.region_id,
        name: region.region_name,
        sales: parseFloat(region.amount) || 0,
        count: parseInt(region.all_count, 10) || 0
      };
    }).sort((a, b) => b.sales - a.sales); // Сортируем по объему продаж
  };
  
  // Функция для отображения данных регионов
  const displayRegionData = (regions) => {
    if (!regions || regions.length === 0) {
      container.append('div')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('justify-content', 'center')
        .style('height', '300px')
        .style('color', isDarkMode ? '#9ca3af' : '#64748b')
        .text(t('regions.noData'));
      return;
    }
    
    // Общие показатели для текущего месяца
    const totalSales = regions.reduce((sum, r) => sum + r.sales, 0);
    const totalCount = regions.reduce((sum, r) => sum + r.count, 0);
    console.log("Общие показатели:", {totalSales, totalCount});
    
    // Создаем сетку для графиков на всю ширину
    const grid = container.append('div')
      .style('display', 'grid')
      .style('grid-template-rows', 'auto auto')
      .style('gap', '20px')
      .style('height', 'calc(100% - 100px)');

    // Создаем верхнюю секцию для таблицы регионов и круговой диаграммы
    const topSection = grid.append('div')
      .style('display', 'grid')
      .style('grid-template-columns', isMobile ? '1fr' : 'minmax(0, 3fr) minmax(0, 2fr)')
      .style('gap', '20px');

    // Левая колонка - таблица рейтинга регионов
    const regionRankingContainer = topSection.append('div')
      .style('background', isDarkMode ? 'rgba(17, 24, 39, 0.4)' : 'rgba(255, 255, 255, 0.8)')
      .style('border-radius', '12px')
      .style('padding', '15px')
      .style('border', `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'}`)
      .style('display', 'flex')
      .style('flex-direction', 'column');

    regionRankingContainer.append('h3')
      .style('font-size', '1.1rem')
      .style('color', isDarkMode ? '#f9fafb' : '#0f172a')
      .style('margin-bottom', '10px')
      .style('text-align', 'center')
      .text(t('regions.rating', { period: monthName }));
    
    // Создаем таблицу с рейтингом регионов
    const rankingTable = regionRankingContainer.append('div')
      .style('flex-grow', '1')
      .style('overflow-y', 'auto')
      .style('background', isDarkMode ? 'rgba(17, 24, 39, 0.6)' : 'rgba(248, 250, 252, 0.8)')
      .style('border-radius', '8px')
      .style('padding', '5px');

    // Заголовок таблицы
    const rankingHeader = rankingTable.append('div')
      .style('display', 'grid')
      .style('grid-template-columns', '8% 32% 20% 15% 25%')
      .style('padding', '10px')
      .style('background', isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(226, 232, 240, 0.8)')
      .style('border-radius', '8px 8px 0 0')
      .style('position', 'sticky')
      .style('top', '0')
      .style('z-index', '1');

    rankingHeader.append('div').style('font-size', '0.85rem').style('font-weight', 'bold').style('color', isDarkMode ? '#f9fafb' : '#0f172a').text('№');
    rankingHeader.append('div').style('font-size', '0.85rem').style('font-weight', 'bold').style('color', isDarkMode ? '#f9fafb' : '#0f172a').text(t('table.headers.region'));
    rankingHeader.append('div').style('font-size', '0.85rem').style('font-weight', 'bold').style('color', isDarkMode ? '#f9fafb' : '#0f172a').style('text-align', 'center').text(t('regions.sales'));
    rankingHeader.append('div').style('font-size', '0.85rem').style('font-weight', 'bold').style('color', isDarkMode ? '#f9fafb' : '#0f172a').style('text-align', 'center').text(t('regions.contracts'));
    rankingHeader.append('div').style('font-size', '0.85rem').style('font-weight', 'bold').style('color', isDarkMode ? '#f9fafb' : '#0f172a').style('text-align', 'center').text(t('regions.marketShare'));

    // Строки таблицы с анимацией
    regions.forEach((region, i) => {
      const marketShare = (region.sales / totalSales) * 100;
      console.log(`Регион #${i+1}: ${region.name}, Продажи: ${region.sales}, Кол-во: ${region.count}, Доля: ${marketShare.toFixed(1)}%`);
      
      const backgroundColor = i % 2 === 0 
        ? (isDarkMode ? 'rgba(30, 41, 59, 0.3)' : 'rgba(241, 245, 249, 0.5)') 
        : (isDarkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.5)');
      
      const row = rankingTable.append('div')
        .style('display', 'grid')
        .style('grid-template-columns', '8% 32% 20% 15% 25%')
        .style('padding', '10px 8px')
        .style('background', backgroundColor)
        .style('border-left', i < 3 ? `3px solid ${d3.interpolateReds(0.3 + i * 0.2)}` : 'none')
        .style('cursor', 'pointer')
        .style('transition', 'all 0.2s')
        .on('mouseover', function() { 
          d3.select(this).style('background', isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'); 
        })
        .on('mouseout', function() { 
          d3.select(this).style('background', backgroundColor); 
        });
      
      // Номер
      row.append('div')
        .style('font-size', '0.85rem')
        .style('color', isDarkMode ? '#f9fafb' : '#0f172a')
        .style('font-weight', 'bold')
        .style('display', 'flex')
        .style('align-items', 'center')
        .text(i + 1);
      
      // Имя региона
      row.append('div')
        .style('font-size', '0.85rem')
        .style('color', isDarkMode ? '#f9fafb' : '#0f172a')
        .style('font-weight', i < 3 ? 'bold' : 'normal')
        .style('display', 'flex')
        .style('align-items', 'center')
        .text(region.name);
      
      // Сумма продаж
      row.append('div')
        .style('font-size', '0.85rem')
        .style('color', isDarkMode ? '#f9fafb' : '#0f172a')
        .style('text-align', 'center')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('justify-content', 'center')
        .text(formatProfitCompact(region.sales));
      
      // Количество продаж (контракты)
      row.append('div')
        .style('font-size', '0.85rem')
        .style('color', isDarkMode ? '#f9fafb' : '#0f172a')
        .style('text-align', 'center')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('justify-content', 'center')
        .text(region.count);
      
      // Доля рынка с графиком
      const marketShareCell = row.append('div')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('gap', '10px');
      
      // Текст доли рынка
      marketShareCell.append('span')
        .style('font-size', '0.85rem')
        .style('color', isDarkMode ? '#f9fafb' : '#0f172a')
        .style('min-width', '45px')
        .text(`${marketShare.toFixed(1)}%`);
      
      // График доли
      const barContainer = marketShareCell.append('div')
        .style('flex-grow', '1')
        .style('height', '8px')
        .style('background', isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(203, 213, 225, 0.3)')
        .style('border-radius', '4px')
        .style('overflow', 'hidden');
      
      barContainer.append('div')
        .style('height', '100%')
        .style('width', `${(region.sales / regions[0].sales) * 100}%`)
        .style('background', d3.interpolateReds(0.3 + (region.sales / regions[0].sales) * 0.7))
        .style('border-radius', '4px')
        .style('transform', 'scaleX(0)')
        .style('transform-origin', 'left')
        .transition()
        .duration(1000)
        .delay(i * 50)
        .style('transform', 'scaleX(1)');
    });
    
    // Правая колонка - круговая диаграмма структуры регионов
    const pieChartContainer = topSection.append('div')
      .style('background', isDarkMode ? 'rgba(17, 24, 39, 0.4)' : 'rgba(255, 255, 255, 0.8)')
      .style('border-radius', '12px')
      .style('padding', '15px')
      .style('border', `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'}`);
    
    pieChartContainer.append('h3')
      .style('font-size', '1.1rem')
      .style('color', isDarkMode ? '#f9fafb' : '#0f172a')
      .style('margin-bottom', '15px')
      .style('text-align', 'center')
      .text(t('regions.structure', { period: monthName }));
    
    // Создаем круговую диаграмму
    const pieSvg = pieChartContainer.append('svg')
      .attr('width', '100%')
      .attr('height', 'calc(100% - 30px)');
    
    const pieWidth = pieSvg.node().clientWidth;
    const pieHeight = pieSvg.node().clientHeight;
    const pieRadius = Math.min(pieWidth, pieHeight) / 2 * 0.8;
    
    // Определяем максимальное количество регионов для отображения
    const maxRegionsInPie = 15;
    let pieData = [];
    
    if (regions.length <= maxRegionsInPie) {
      pieData = [...regions];
      console.log("Все регионы помещаются в диаграмму:", pieData.length);
    } else {
      pieData = [...regions.slice(0, maxRegionsInPie - 1)];
      const otherSales = regions.slice(maxRegionsInPie - 1).reduce((sum, r) => sum + r.sales, 0);
      const otherCount = regions.slice(maxRegionsInPie - 1).reduce((sum, r) => sum + r.count, 0);
      pieData.push({ name: t('regions.otherRegions'), sales: otherSales, count: otherCount });
      console.log(`Некоторые регионы объединены в "${t('regions.otherRegions')}": ${regions.length - (maxRegionsInPie - 1)} регионов`);
    }
    
    console.log("Регионы для диаграммы:", pieData.map(r => r.name));
    
    // Создаем цветовую схему
    const pieColor = d3.scaleOrdinal()
      .domain(pieData.map(d => d.name))
      .range(d3.quantize(t => d3.interpolateBlues(t * 0.8 + 0.1), pieData.length));
    
    // Функция для обновления круговой диаграммы
    const updatePieChart = () => {
      console.log(`Обновление круговой диаграммы для объема продаж`);
      
      // Очищаем существующую диаграмму
      pieSvg.selectAll('*').remove();
      
      // Создаем генератор пончика
      const pie = d3.pie()
        .value(d => d.sales)
        .sort(null)
        .padAngle(0.03);
      
      const arc = d3.arc()
        .innerRadius(pieRadius * 0.4)
        .outerRadius(pieRadius * 0.9)
        .cornerRadius(6);
      
      // Функция для анимации дуги при наведении
      const arcHover = d3.arc()
        .innerRadius(pieRadius * 0.38)
        .outerRadius(pieRadius * 0.95)
        .cornerRadius(6);
      
      // Создаем улучшенные градиенты для каждой категории
      pieData.forEach((d, i) => {
        const id = `pie-region-gradient-${i}`;
        
        const gradient = pieSvg.append('defs')
          .append('linearGradient')
          .attr('id', id)
          .attr('x1', '0%')
          .attr('y1', '0%')
          .attr('x2', '100%')
          .attr('y2', '100%');
        
        gradient.append('stop')
          .attr('offset', '0%')
          .attr('stop-color', d3.rgb(pieColor(d.name)).brighter(0.5))
          .attr('stop-opacity', 0.9);
        
        gradient.append('stop')
          .attr('offset', '100%')
          .attr('stop-color', pieColor(d.name))
          .attr('stop-opacity', 0.7);
      });
      
      // Создаем группу для пончика
      const pieG = pieSvg.append('g')
        .attr('transform', `translate(${pieWidth / 2}, ${pieHeight / 2})`);
      
      // Вычисляем общую сумму для процентов в зависимости от показателя
      const total = pieData.reduce((sum, d) => sum + d.sales, 0);
      
      // Создаем сегменты пончика
      const pieArcs = pieG.selectAll('path')
        .data(pie(pieData))
        .join('path')
        .attr('fill', (d, i) => `url(#pie-region-gradient-${i})`)
        .attr('stroke', isDarkMode ? '#111827' : '#ffffff')
        .attr('stroke-width', 1)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
          // Выделяем сегмент
          d3.select(this)
            .transition()
            .duration(200)
            .attr('d', arcHover);
          
          // Показываем значение в центре
          centerText.text(d.data.name);
          centerNumber.text(formatProfitCompact(d.data.sales));
          centerPercent.text(`${((d.data.sales / total) * 100).toFixed(1)}%`);
          
          // Показываем количество контрактов
          centerCount.text(`${d.data.count} ${t('table.headers.count').toLowerCase()}`);
          
          // Показываем легенду для выбранного элемента
          pieLegendItems.style('opacity', 0.5);
          pieLegendItems.filter(item => item.data.name === d.data.name)
            .style('opacity', 1)
            .style('font-weight', 'bold');
        })
        .on('mouseout', function() {
          // Восстанавливаем сегмент
          d3.select(this)
            .transition()
            .duration(200)
            .attr('d', arc);
          
          // Восстанавливаем общую сумму в центре
          centerText.text(t('metrics.volume'));
          centerNumber.text(formatProfitCompact(total));
          centerPercent.text('100%');
          centerCount.text(`${totalCount} ${t('table.headers.count').toLowerCase()}`);
          
          // Восстанавливаем легенду
          pieLegendItems.style('opacity', 1)
            .style('font-weight', 'normal');
        });
      
      // Анимация появления сегментов
      pieArcs.each(function(d) {
        const self = this;
        const totalLength = Math.PI * 2;
        const i = d.index;
        
        d3.select(this)
          .transition()
          .duration(500)
          .delay(i * 100)
          .attrTween('d', function() {
            const interpolate = d3.interpolate(
              { startAngle: d.startAngle, endAngle: d.startAngle },
              { startAngle: d.startAngle, endAngle: d.endAngle }
            );
            return function(t) {
              return arc(interpolate(t));
            };
          });
      });
      
      // Добавляем текст в центр пончика
      const centerText = pieG.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-1.5em')
        .style('font-size', '0.9rem')
        .style('fill', isDarkMode ? '#d1d5db' : '#64748b')
        .text(t('metrics.volume'));
      
      const centerNumber = pieG.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0em')
        .style('font-size', '1.2rem')
        .style('font-weight', 'bold')
        .style('fill', isDarkMode ? '#f9fafb' : '#0f172a')
        .text(formatProfitCompact(total));
      
      const centerPercent = pieG.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '1.5em')
        .style('font-size', '1rem')
        .style('fill', '#60a5fa')
        .text('100%');
      
      // Добавляем количество контрактов
      const centerCount = pieG.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '3em')
        .style('font-size', '0.9rem')
        .style('fill', isDarkMode ? '#9ca3af' : '#64748b')
        .text(`${totalCount} ${t('table.headers.count').toLowerCase()}`);
      
      // Создаем оптимизированную легенду для диаграммы
      const legendData = pieData.slice(0, Math.min(7, pieData.length));
      
      const pieLegend = pieSvg.append('g')
        .attr('transform', `translate(${pieWidth - 80}, 20)`);
      
      // Добавляем элементы легенды
      const pieLegendItems = pieLegend.selectAll('.legend-item')
        .data(pie(legendData))
        .join('g')
        .attr('class', 'legend-item')
        .attr('transform', (d, i) => `translate(0, ${i * 20})`)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
          // Находим соответствующий сегмент
          const segment = pieArcs.filter(arc => arc.data.name === d.data.name);
          
          // Выделяем сегмент
          segment.transition()
            .duration(200)
            .attr('d', arcHover);
          
          // Показываем значение в центре
          centerText.text(d.data.name);
          centerNumber.text(formatProfitCompact(d.data.sales));
          centerPercent.text(`${((d.data.sales / total) * 100).toFixed(1)}%`);
          centerCount.text(`${d.data.count} ${t('table.headers.count').toLowerCase()}`);
          
          // Выделяем текущий элемент легенды
          d3.select(this)
            .style('opacity', 1)
            .style('font-weight', 'bold');
          
          pieLegendItems.filter(item => item.data.name !== d.data.name)
            .style('opacity', 0.5);
        })
        .on('mouseout', function(event, d) {
          // Восстанавливаем сегмент
          pieArcs.transition()
            .duration(200)
            .attr('d', arc);
          
          // Восстанавливаем общую сумму в центре
          centerText.text(t('metrics.volume'));
          centerNumber.text(formatProfitCompact(total));
          centerPercent.text('100%');
          centerCount.text(`${totalCount} ${t('table.headers.count').toLowerCase()}`);
          
          // Восстанавливаем легенду
          pieLegendItems.style('opacity', 1)
            .style('font-weight', 'normal');
        });
      
      // Добавляем маркеры и текст легенды
      pieLegendItems.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('rx', 2)
        .attr('fill', (d, i) => pieColor(d.data.name));
      
      pieLegendItems.append('text')
        .attr('x', 18)
        .attr('y', 10)
        .style('font-size', '0.7rem')
        .style('fill', isDarkMode ? '#f9fafb' : '#0f172a')
        .text(d => {
          // Сокращаем длинные названия регионов
          const name = d.data.name;
          return name.length > 10 ? name.substring(0, 10) + '...' : name;
        });
    };
    
    // Запускаем первоначальное отображение круговой диаграммы
    updatePieChart();
    
    // СОЗДАЕМ ПАНЕЛЬ ВЫБОРА ДИАПАЗОНА СРАВНЕНИЯ
    
    // Получаем все доступные годы и месяцы
    const allYears = Object.keys(financialData).map(Number).sort();
    
    // Преобразуем данные в удобный формат для выбора
    const selectableMonths = [];
    
    allYears.forEach(y => {
      if (financialData[y] && financialData[y].months) {
        financialData[y].months.forEach((monthData, idx) => {
          if (monthData.total > 0) {
            selectableMonths.push({
              id: `${y}-${idx + 1}`,
              name: `${MONTHS[idx]} ${y}`,
              year: y,
              month: idx + 1
            });
          }
        });
      }
    });
    
    // Сортируем месяцы по дате (сначала самые старые)
    selectableMonths.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
    
    console.log("Доступные месяцы для сравнения:", selectableMonths);
    
    // Создаем панель выбора диапазона
    const rangeSelector = container.append('div')
      .style('display', 'flex')
      .style('flex-wrap', 'wrap')
      .style('align-items', 'center')
      .style('gap', '15px')
      .style('margin-bottom', '15px')
      .style('background', isDarkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(226, 232, 240, 0.5)')
      .style('border-radius', '8px')
      .style('padding', '12px 15px')
      .style('border', `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'}`);
    
    // Добавляем заголовок
    rangeSelector.append('div')
      .style('color', isDarkMode ? '#f9fafb' : '#0f172a')
      .style('font-weight', 'bold')
      .style('font-size', '0.9rem')
      .text(t('filters.comparison'));
    
    // Контейнер для селекторов
    const selectorsContainer = rangeSelector.append('div')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('gap', '10px');
    
    // От какого месяца
    selectorsContainer.append('span')
      .style('color', isDarkMode ? '#9ca3af' : '#64748b')
      .style('font-size', '0.85rem')
      .text(t('filters.from'));
    
    const startMonthSelect = selectorsContainer.append('select')
      .style('background', isDarkMode ? 'rgba(17, 24, 39, 0.7)' : 'rgba(255, 255, 255, 0.9)')
      .style('color', isDarkMode ? '#f9fafb' : '#0f172a')
      .style('border', `1px solid ${isDarkMode ? 'rgba(75, 85, 99, 0.5)' : 'rgba(203, 213, 225, 0.8)'}`)
      .style('border-radius', '6px')
      .style('padding', '6px 10px')
      .style('font-size', '0.85rem')
      .style('cursor', 'pointer');
    
    // До какого месяца
    selectorsContainer.append('span')
      .style('color', isDarkMode ? '#9ca3af' : '#64748b')
      .style('font-size', '0.85rem')
      .text(t('filters.to'));
    
    const endMonthSelect = selectorsContainer.append('select')
      .style('background', isDarkMode ? 'rgba(17, 24, 39, 0.7)' : 'rgba(255, 255, 255, 0.9)')
      .style('color', isDarkMode ? '#f9fafb' : '#0f172a')
      .style('border', `1px solid ${isDarkMode ? 'rgba(75, 85, 99, 0.5)' : 'rgba(203, 213, 225, 0.8)'}`)
      .style('border-radius', '6px')
      .style('padding', '6px 10px')
      .style('font-size', '0.85rem')
      .style('cursor', 'pointer');
    
    // Добавляем опции для выбора месяцев
    selectableMonths.forEach(monthData => {
      startMonthSelect.append('option')
        .attr('value', monthData.id)
        .text(monthData.name);
      
      endMonthSelect.append('option')
        .attr('value', monthData.id)
        .text(monthData.name);
    });
    
    // Выбираем по умолчанию текущий месяц и предыдущий
    const currentIndex = selectableMonths.findIndex(m => m.year === year && m.month === month);
    console.log(`Текущий индекс месяца для сравнения: ${currentIndex}, год: ${year}, месяц: ${month}`);
    
    if (currentIndex > 0) {
      startMonthSelect.property('value', selectableMonths[currentIndex - 1].id);
      endMonthSelect.property('value', selectableMonths[currentIndex].id);
      
      // Сохраняем выбранные значения в глобальную область видимости компонента
      window.startMonthId = selectableMonths[currentIndex - 1].id;
      window.endMonthId = selectableMonths[currentIndex].id;
    }
    
    // Кнопка применения
    const applyButton = rangeSelector.append('button')
      .style('background', isDarkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)')
      .style('color', '#10b981')
      .style('border', 'none')
      .style('padding', '6px 15px')
      .style('border-radius', '6px')
      .style('font-size', '0.85rem')
      .style('font-weight', 'bold')
      .style('cursor', 'pointer')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('gap', '5px')
      .style('transition', 'all 0.2s')
      .html(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>${t('buttons.apply')}`)
      .on('mouseover', function() {
        d3.select(this)
          .style('background', isDarkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)')
          .style('color', '#f9fafb');
      })
      .on('mouseout', function() {
        d3.select(this)
          .style('background', isDarkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)')
          .style('color', '#10b981');
      })
      .on('click', function() {
        const startMonthId = startMonthSelect.property('value');
        const endMonthId = endMonthSelect.property('value');
        
        console.log(`Нажата кнопка Применить: ${startMonthId} - ${endMonthId}`);
        
        // Сохраняем выбранные значения
        window.startMonthId = startMonthId;
        window.endMonthId = endMonthId;
        window.selectedRegionMonths = selectableMonths;
        
        // Обновляем данные для сравнения
        updateRangeComparisonData(startMonthId, endMonthId, selectableMonths);
      });
    
    // Нижняя секция - сравнение периодов на всю ширину
    // ВАЖНО: Создаем контейнер для сравнения с уникальным ID
    const compareChartContainer = grid.append('div')
      .attr('id', 'region-comparison-container')
      .style('grid-column', '1 / -1') // Занимает всю ширину
      .style('background', isDarkMode ? 'rgba(17, 24, 39, 0.4)' : 'rgba(255, 255, 255, 0.8)')
      .style('border-radius', '12px')
      .style('padding', '15px')
      .style('border', `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'}`);
   
    compareChartContainer.append('h3')
      .style('font-size', '1.1rem')
      .style('color', isDarkMode ? '#f9fafb' : '#0f172a')
      .style('margin-bottom', '15px')
      .style('text-align', 'center')
      .text(t('regions.comparison', { start: '', end: '' }));
    
    // Добавляем индикатор загрузки в контейнер для сравнения
    compareChartContainer.append('div')
      .attr('class', 'comparison-loader')
      .style('display', 'flex')
      .style('justify-content', 'center')
      .style('align-items', 'center')
      .style('height', '100px')
      .style('color', isDarkMode ? '#9ca3af' : '#64748b')
      .html(`
        <div style="width: 25px; height: 25px; border-radius: 50%; border: 2px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'}; border-top-color: #3b82f6; animation: spin 1s linear infinite;"></div>
        <span style="margin-left: 10px;">${t('regions.loadingData')}</span>
      `);
    
    // Возвращаем список месяцев, чтобы его можно было использовать в инициации сравнения
    return selectableMonths;
  };
  
  async function updateRangeComparisonData(startMonthId, endMonthId, providedMonths = null) {
    console.log(`Запуск сравнения периодов: ${startMonthId} - ${endMonthId}`);
    
    const comparisonContainer = d3.select('#region-comparison-container');
    
    // Проверяем, существует ли контейнер для сравнения
    if (!comparisonContainer.node()) {
      console.error('Контейнер #region-comparison-container не найден');
      return;
    }
    
    // Очищаем содержимое контейнера
    comparisonContainer.selectAll('*').remove();
    
    // Используем предоставленный список месяцев или из компонента
    const monthsToUse = providedMonths || selectableMonths;
    
    // Получаем информацию о выбранных месяцах
    if (!monthsToUse || monthsToUse.length === 0) {
      console.error('Массив месяцев не определен или пуст');
      comparisonContainer.append('div')
        .style('padding', '20px')
        .style('color', '#ef4444')
        .text(t('errors.loadingError'));
      return;
    }
    
    const startMonthData = monthsToUse.find(m => m.id === startMonthId);
    const endMonthData = monthsToUse.find(m => m.id === endMonthId);
    
    console.log('Данные для периодов сравнения:', { startMonthData, endMonthData });
    
    if (!startMonthData || !endMonthData) {
      comparisonContainer.append('div')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('justify-content', 'center')
        .style('height', '200px')
        .style('color', isDarkMode ? '#9ca3af' : '#64748b')
        .text(t('regions.selectPeriod'));
      return;
    }
    
    // Формируем названия периодов
    const startPeriodName = `${MONTHS[startMonthData.month-1]} ${startMonthData.year}`;
    const endPeriodName = `${MONTHS[endMonthData.month-1]} ${endMonthData.year}`;
    
    // Заголовок с периодами сравнения
    comparisonContainer.append('h3')
      .style('font-size', '1.1rem')
      .style('color', isDarkMode ? '#f9fafb' : '#0f172a')
      .style('margin-bottom', '15px')
      .style('text-align', 'center')
      .text(t('regions.comparison', { start: startPeriodName, end: endPeriodName }));
    
    // Индикатор загрузки
    const loader = comparisonContainer.append('div')
      .style('display', 'flex')
      .style('justify-content', 'center')
      .style('align-items', 'center')
      .style('height', '150px')
      .style('color', isDarkMode ? '#9ca3af' : '#64748b');
      
    const spinnerSize = 40;
    loader.append('div')
      .style('width', `${spinnerSize}px`)
      .style('height', `${spinnerSize}px`)
      .style('border-radius', '50%')
      .style('border', `3px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'}`)
      .style('border-top-color', '#3b82f6')
      .style('animation', 'spin 1s linear infinite')
      .style('margin-right', '10px');
    
    loader.append('div')
      .text(t('regions.loadingData'));
    
    try {
      // Определяем даты для двух периодов для запросов API
      const startYear = startMonthData.year;
      const startMonth = startMonthData.month;
      const endYear = endMonthData.year;
      const endMonth = endMonthData.month;
      
      // Форматируем даты для API запросов
      const formatApiDate = (year, month, day) => {
        return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`;
      };
      
      // Определяем последний день месяца
      const getLastDayOfMonth = (year, month) => {
        return new Date(year, month, 0).getDate();
      };
      
      // Даты для начального периода
      const startPeriodStartDate = formatApiDate(startYear, startMonth, 1);
      const startPeriodEndDate = formatApiDate(startYear, startMonth, getLastDayOfMonth(startYear, startMonth));
      
      // Даты для конечного периода
      const endPeriodStartDate = formatApiDate(endYear, endMonth, 1);
      const endPeriodEndDate = formatApiDate(endYear, endMonth, getLastDayOfMonth(endYear, endMonth));
      
      console.log("Даты для API запросов:");
      console.log(`Начальный период: ${startPeriodStartDate} - ${startPeriodEndDate}`);
      console.log(`Конечный период: ${endPeriodStartDate} - ${endPeriodEndDate}`);
      
      // Делаем запросы к API для обоих периодов
      // Определяем API endpoint в зависимости от выбранной категории
      let endpoint = "get_all_payment";
      if (focusCategory === 'retail') {
        endpoint = "get_roz_payment";
      } else if (focusCategory === 'wholesale') {
        endpoint = "get_opt_payment";
      }
      
      // Получаем данные для начального периода
      console.log(`Запрос к API для начального периода: ${endpoint}`);
    const token = localStorage.getItem('authToken');

// Получаем данные для начального периода
const startPeriodResponse = await fetch(`https://uzavtoanalytics.uz/dashboard/proxy`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Auth": `Bearer ${token}`
  },
  body: JSON.stringify({
    url: `/b/dashboard/infos&${endpoint}`,
    begin_date: startPeriodStartDate,
    end_date: startPeriodEndDate
  })
});
      if (!startPeriodResponse.ok) {
        throw new Error(t('errors.httpError', { status: startPeriodResponse.status }));
      }
      
      const startPeriodData = await startPeriodResponse.json();
      
    const endPeriodResponse = await fetch(`https://uzavtoanalytics.uz/dashboard/proxy`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Auth": `Bearer ${token}`
  },
  body: JSON.stringify({
    url: `/b/dashboard/infos&${endpoint}`,
    begin_date: endPeriodStartDate,
    end_date: endPeriodEndDate
  })
});
      
      if (!endPeriodResponse.ok) {
        throw new Error(t('errors.httpError', { status: endPeriodResponse.status }));
      }
      
      const endPeriodData = await endPeriodResponse.json();
      console.log("Данные конечного периода:", endPeriodData);
      
      // Извлекаем данные о регионах
      // Функция для извлечения данных о регионах из ответа API
      const extractRegions = (apiData, year, month) => {
        const monthStr = `${year}-${String(month).padStart(2, '0')}`;
        let regions = [];
        
        // Логируем для отладки
        console.log(`Извлечение данных о регионах для ${monthStr}`);
        console.log("Структура данных:", JSON.stringify(apiData).substring(0, 200) + "...");
        
        // Проверяем разные структуры данных
        if (Array.isArray(apiData)) {
          // Если ответ - массив
          for (const item of apiData) {
            if (Array.isArray(item.filter_by_region)) {
              const monthData = item.filter_by_region.find(m => m.month === monthStr);
              if (monthData && Array.isArray(monthData.regions)) {
                regions = monthData.regions;
                console.log(`Найдены данные о регионах в массиве: ${regions.length} регионов`);
                break;
              }
            } else if (item.filter_by_region && typeof item.filter_by_region === 'object') {
              // Проверяем прямой доступ к регионам
              if (Array.isArray(item.filter_by_region.regions)) {
                regions = item.filter_by_region.regions;
                console.log(`Найдены данные о регионах напрямую: ${regions.length} регионов`);
                break;
              }
            }
          }
        } else if (apiData && apiData.filter_by_region) {
          // Если ответ - объект с filter_by_region
          if (Array.isArray(apiData.filter_by_region)) {
            const monthData = apiData.filter_by_region.find(m => m.month === monthStr);
            if (monthData && Array.isArray(monthData.regions)) {
              regions = monthData.regions;
              console.log(`Найдены данные о регионах в объекте: ${regions.length} регионов`);
            }
          } else if (typeof apiData.filter_by_region === 'object' && apiData.filter_by_region.regions) {
            // Прямой доступ к regions
            regions = apiData.filter_by_region.regions;
            console.log(`Найдены данные о регионах напрямую: ${regions.length} регионов`);
          }
        }
        
        // Еще один вариант - прямой доступ к regions на верхнем уровне
        if (regions.length === 0 && Array.isArray(apiData.regions)) {
          regions = apiData.regions;
          console.log(`Найдены данные о регионах на верхнем уровне: ${regions.length} регионов`);
        }
        
        // Если после всех проверок регионы не найдены - логируем ошибку
        if (regions.length === 0) {
          console.error(t('errors.noRegionData'));
          console.log("Полный ответ API:", JSON.stringify(apiData));
        }
        
        return regions;
      };
      
      // Извлекаем данные о регионах
      const startPeriodRegions = extractRegions(startPeriodData, startYear, startMonth);
      const endPeriodRegions = extractRegions(endPeriodData, endYear, endMonth);
      
      // Обрабатываем данные о регионах
      const processRegions = (apiRegions) => {
        if (!apiRegions || !Array.isArray(apiRegions) || apiRegions.length === 0) {
          return [];
        }
        
        // Логируем пример данных региона
        console.log("Пример данных региона:", apiRegions[0]);
        
        return apiRegions.map(region => {
          // Проверяем наличие всех необходимых полей
          const id = region.region_id || '0';
          const name = region.region_name || t('regions.unknownRegion');
          const sales = parseFloat(region.amount || 0);
          
          return { id, name, sales };
        });
      };
      
      const processedStartRegions = processRegions(startPeriodRegions);
      const processedEndRegions = processRegions(endPeriodRegions);
      
      console.log(`Обработано ${processedStartRegions.length} регионов начального периода и ${processedEndRegions.length} регионов конечного периода`);
      
      // Проверяем наличие данных
      if (processedStartRegions.length === 0 && processedEndRegions.length === 0) {
        loader.remove();
        comparisonContainer.append('div')
          .style('display', 'flex')
          .style('justify-content', 'center')
          .style('align-items', 'center')
          .style('height', '200px')
        .style('color', isDarkMode ? '#9ca3af' : '#64748b')
         .text(t('regions.noData'));
       return;
     }
     
     // Объединяем данные для сравнения в единую структуру
     const regionMap = new Map();
     
     // Сначала добавляем регионы из конечного периода
     processedEndRegions.forEach(region => {
       regionMap.set(region.id, {
         name: region.name,
         currentSales: region.sales,
         previousSales: 0
       });
     });
     
     // Затем добавляем или обновляем из начального периода
     processedStartRegions.forEach(region => {
       if (regionMap.has(region.id)) {
         const existingRegion = regionMap.get(region.id);
         existingRegion.previousSales = region.sales;
       } else {
         regionMap.set(region.id, {
           name: region.name,
           currentSales: 0,
           previousSales: region.sales
         });
       }
     });
     
     // Преобразуем Map в массив
     const compareData = Array.from(regionMap.values())
       .filter(region => region.currentSales > 0 || region.previousSales > 0) // Убираем регионы без данных
       .sort((a, b) => b.currentSales - a.currentSales); // Сортируем по текущим продажам
     
     console.log(`Данные для сравнения подготовлены: ${compareData.length} регионов`);
     
     // Удаляем индикатор загрузки
     loader.remove();
     
     if (compareData.length === 0) {
       comparisonContainer.append('div')
         .style('display', 'flex')
         .style('justify-content', 'center')
         .style('align-items', 'center')
         .style('height', '200px')
         .style('color', isDarkMode ? '#9ca3af' : '#64748b')
         .text(t('regions.noData'));
       return;
     }
     
     // Берем топ-8 регионов для графика
     const topRegions = compareData.slice(0, 8);
     
     // Создаем контейнер для графика сравнения
     const graphContainer = comparisonContainer.append('div')
       .style('flex', '1')
       .style('background', isDarkMode ? 'rgba(17, 24, 39, 0.6)' : 'rgba(248, 250, 252, 0.8)')
       .style('border-radius', '8px')
       .style('padding', '15px')
       .style('height', '400px');
     
     graphContainer.append('h4')
       .style('font-size', '1rem')
       .style('color', isDarkMode ? '#f9fafb' : '#0f172a')
       .style('margin-bottom', '15px')
       .style('text-align', 'center')
       .text(t('charts.salesVolume'));
     
     // SVG для графика
     const graphSvg = graphContainer.append('svg')
       .attr('width', '100%')
       .attr('height', 'calc(100% - 40px)');
     
     const graphWidth = graphSvg.node().clientWidth;
     const graphHeight = graphSvg.node().clientHeight;
     const graphMargin = { top: 20, right: 30, bottom: 120, left: 70 };
     
     // Максимальное значение для масштаба
     const maxValue = d3.max(topRegions, d => Math.max(d.currentSales, d.previousSales)) * 1.1;
     
     // Шкалы для графика (для вертикальных столбцов)
     const xScale = d3.scaleBand()
       .domain(topRegions.map(d => d.name))
       .range([graphMargin.left, graphWidth - graphMargin.right])
       .padding(0.2);
     
     const yScale = d3.scaleLinear()
       .domain([0, maxValue])
       .range([graphHeight - graphMargin.bottom, graphMargin.top]);
     
     // Внутренняя шкала для группировки столбцов
     const xSubScale = d3.scaleBand()
       .domain([0, 1]) // 0 - предыдущий период, 1 - текущий период
       .range([0, xScale.bandwidth()])
       .padding(0.1);
     
     // Оси для графика
     // Ось X (регионы)
     graphSvg.append('g')
       .attr('transform', `translate(0,${graphHeight - graphMargin.bottom})`)
       .call(d3.axisBottom(xScale))
       .call(g => g.select('.domain').remove())
       .call(g => g.selectAll('text')
         .style('fill', isDarkMode ? '#d1d5db' : '#4b5563')
         .style('font-size', '0.8rem')
         .attr('transform', 'rotate(-45)')
         .attr('text-anchor', 'end')
         .attr('dx', '-0.8em')
         .attr('dy', '0.15em'));
     
     // Ось Y (продажи)
     graphSvg.append('g')
       .attr('transform', `translate(${graphMargin.left},0)`)
       .call(d3.axisLeft(yScale)
         .ticks(5)
         .tickFormat(d => formatProfitCompact(d)))
       .call(g => g.select('.domain').remove())
       .call(g => g.selectAll('text')
         .style('fill', isDarkMode ? '#d1d5db' : '#4b5563')
         .style('font-size', '0.8rem'))
       .call(g => g.selectAll('.tick line')
         .attr('x2', graphWidth - graphMargin.left - graphMargin.right)
         .attr('stroke', isDarkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(229, 231, 235, 0.3)')
         .attr('stroke-dasharray', '2,2'));
     
     // Добавляем фоновую сетку
     graphSvg.append('g')
       .selectAll('line.grid')
       .data(yScale.ticks(5))
       .join('line')
       .attr('class', 'grid')
       .attr('x1', graphMargin.left)
       .attr('x2', graphWidth - graphMargin.right)
       .attr('y1', d => yScale(d))
       .attr('y2', d => yScale(d))
       .attr('stroke', isDarkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(229, 231, 235, 0.3)')
       .attr('stroke-width', 1);
     
     // Создаем градиенты для столбцов
     const defs = graphSvg.append('defs');
     
     // Градиент для текущего периода
     const currentGradient = defs.append('linearGradient')
       .attr('id', 'current-period-gradient')
       .attr('x1', '0%')
       .attr('y1', '0%')
       .attr('x2', '0%')
       .attr('y2', '100%');
     
     currentGradient.append('stop')
       .attr('offset', '0%')
       .attr('stop-color', '#60a5fa')
       .attr('stop-opacity', 1);
     
     currentGradient.append('stop')
       .attr('offset', '100%')
       .attr('stop-color', '#3b82f6')
       .attr('stop-opacity', 0.8);
     
     // Градиент для предыдущего периода
     const previousGradient = defs.append('linearGradient')
       .attr('id', 'previous-period-gradient')
       .attr('x1', '0%')
       .attr('y1', '0%')
       .attr('x2', '0%')
       .attr('y2', '100%');
     
     previousGradient.append('stop')
       .attr('offset', '0%')
       .attr('stop-color', isDarkMode ? '#cbd5e1' : '#cbd5e1')
       .attr('stop-opacity', 1);
     
     previousGradient.append('stop')
       .attr('offset', '100%')
       .attr('stop-color', isDarkMode ? '#94a3b8' : '#94a3b8')
       .attr('stop-opacity', 0.8);
     
     // Добавляем столбцы для предыдущего периода
     graphSvg.selectAll('.previous-sales-bar')
       .data(topRegions)
       .join('rect')
       .attr('class', 'previous-sales-bar')
       .attr('x', d => xScale(d.name) + xSubScale(0))
       .attr('y', graphHeight - graphMargin.bottom)
       .attr('width', xSubScale.bandwidth())
       .attr('height', 0)
       .attr('fill', 'url(#previous-period-gradient)')
       .attr('rx', 4)
       .attr('stroke', isDarkMode ? '#1f2937' : '#e5e7eb')
       .attr('stroke-width', 1)
       .attr('stroke-opacity', 0.5)
       .transition()
       .duration(800)
       .delay((d, i) => i * 100)
       .attr('y', d => yScale(d.previousSales))
       .attr('height', d => graphHeight - graphMargin.bottom - yScale(d.previousSales));
     
     // Добавляем столбцы для текущего периода
     graphSvg.selectAll('.current-sales-bar')
       .data(topRegions)
       .join('rect')
       .attr('class', 'current-sales-bar')
       .attr('x', d => xScale(d.name) + xSubScale(1))
       .attr('y', graphHeight - graphMargin.bottom)
       .attr('width', xSubScale.bandwidth())
       .attr('height', 0)
       .attr('fill', 'url(#current-period-gradient)')
       .attr('rx', 4)
       .attr('stroke', isDarkMode ? '#1f2937' : '#e5e7eb')
       .attr('stroke-width', 1)
       .attr('stroke-opacity', 0.5)
       .transition()
       .duration(800)
       .delay((d, i) => i * 100 + 300)
       .attr('y', d => yScale(d.currentSales))
       .attr('height', d => graphHeight - graphMargin.bottom - yScale(d.currentSales));
     
     // Добавляем текстовые метки со значениями для предыдущего периода
     graphSvg.selectAll('.previous-sales-label')
       .data(topRegions)
       .join('text')
       .attr('class', 'previous-sales-label')
       .attr('x', d => xScale(d.name) + xSubScale(0) + xSubScale.bandwidth() / 2)
       .attr('y', d => yScale(d.previousSales) - 5)
       .attr('text-anchor', 'middle')
       .style('font-size', '0.7rem')
       .style('fill', isDarkMode ? '#cbd5e1' : '#64748b')
       .style('opacity', 0)
       .text(d => formatProfitCompact(d.previousSales))
       .transition()
       .duration(400)
       .delay((d, i) => i * 100 + 900)
       .style('opacity', 1);
     
     // Добавляем текстовые метки со значениями для текущего периода
     graphSvg.selectAll('.current-sales-label')
       .data(topRegions)
       .join('text')
       .attr('class', 'current-sales-label')
       .attr('x', d => xScale(d.name) + xSubScale(1) + xSubScale.bandwidth() / 2)
       .attr('y', d => yScale(d.currentSales) - 5)
       .attr('text-anchor', 'middle')
       .style('font-size', '0.7rem')
       .style('fill', isDarkMode ? '#93c5fd' : '#3b82f6')
       .style('opacity', 0)
       .text(d => formatProfitCompact(d.currentSales))
       .transition()
       .duration(400)
       .delay((d, i) => i * 100 + 1100)
       .style('opacity', 1);
     
     // Добавляем легенду
     const legend = graphSvg.append('g')
       .attr('transform', `translate(${graphWidth - graphMargin.right - 130}, ${graphMargin.top})`);
     
     // Текущий период
     legend.append('rect')
       .attr('width', 15)
       .attr('height', 15)
       .attr('rx', 3)
       .attr('fill', 'url(#current-period-gradient)');
     
     legend.append('text')
       .attr('x', 22)
       .attr('y', 12)
       .style('font-size', '0.9rem')
       .style('fill', isDarkMode ? '#f9fafb' : '#0f172a')
       .text(endPeriodName);
     
     // Предыдущий период
     legend.append('rect')
       .attr('width', 15)
       .attr('height', 15)
       .attr('rx', 3)
       .attr('fill', 'url(#previous-period-gradient)')
       .attr('transform', 'translate(0, 25)');
     
     legend.append('text')
       .attr('x', 22)
       .attr('y', 37)
       .style('font-size', '0.9rem')
       .style('fill', isDarkMode ? '#f9fafb' : '#0f172a')
       .text(startPeriodName);
     
     // Добавляем тултипы для столбцов
     const addBarInteractivity = (selector, isPrevious) => {
       graphSvg.selectAll(selector)
         .on('mouseover', function(event, d) {
           const value = isPrevious ? d.previousSales : d.currentSales;
           const periodName = isPrevious ? startPeriodName : endPeriodName;
           const color = isPrevious ? '#94a3b8' : '#3b82f6';
           
           // Увеличиваем столбец при наведении
           d3.select(this)
             .transition()
             .duration(200)
             .attr('fill', d3.rgb(color).brighter(0.2))
             .attr('filter', 'brightness(1.2)');
           
           // Показываем тултип
           d3.select('body').append('div')
             .attr('class', 'chart-tooltip')
             .style('position', 'absolute')
             .style('background', isDarkMode ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)')
             .style('color', isDarkMode ? '#f9fafb' : '#0f172a')
             .style('border-radius', '6px')
             .style('padding', '10px 15px')
             .style('font-size', '0.95rem')
             .style('pointer-events', 'none')
             .style('z-index', 1000)
             .style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.3)')
             .style('border', `1px solid ${color}`)
             .style('left', `${event.pageX + 10}px`)
             .style('top', `${event.pageY - 80}px`)
             .html(`
               <div style="font-weight:bold;font-size:1rem;margin-bottom:5px;">${d.name}</div>
               <div style="color:${isDarkMode ? '#a1a1aa' : '#71717a'}">${periodName}</div>
               <div style="margin-top:8px">
                 <span style="font-weight:600;">${formatProfitCompact(value)}</span>
               </div>
             `);
         })
         .on('mousemove', function(event) {
           d3.select('.chart-tooltip')
             .style('left', `${event.pageX + 10}px`)
             .style('top', `${event.pageY - 80}px`);
         })
         .on('mouseout', function() {
           // Возвращаем исходный вид столбца
           d3.select(this)
             .transition()
             .duration(200)
             .attr('fill', isPrevious ? 'url(#previous-period-gradient)' : 'url(#current-period-gradient)')
             .attr('filter', 'none');
           
           // Удаляем тултип
           d3.select('.chart-tooltip').remove();
         });
     };
     
     // Добавляем интерактивность столбцам
     addBarInteractivity('.previous-sales-bar', true);
     addBarInteractivity('.current-sales-bar', false);
     
   } catch (error) {
     // Удаляем индикатор загрузки
     loader.remove();
     
     console.error('Ошибка при загрузке данных для сравнения:', error);
     
     comparisonContainer.append('div')
       .style('color', '#ef4444')
       .style('padding', '15px')
       .style('background', isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)')
       .style('border', `1px solid ${isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'}`)
       .style('border-radius', '6px')
       .style('margin-top', '15px')
       .text(t('errors.comparisonError', { message: error.message }));
   }
 }
 
 // Загружаем и отображаем данные для текущего периода
 const apiStartDate = `01.${String(month).padStart(2, '0')}.${year}`;
 const apiEndDate = `${new Date(year, month, 0).getDate()}.${String(month).padStart(2, '0')}.${year}`;
 
 console.log(`Загрузка данных для периода ${apiStartDate} - ${apiEndDate}`);
 
 // Запускаем загрузку данных
 try {
   // Показываем индикатор загрузки
   container.append('div')
     .attr('class', 'initial-loader')
     .style('display', 'flex')
     .style('align-items', 'center')
     .style('justify-content', 'center')
     .style('height', '200px')
     .style('color', isDarkMode ? '#9ca3af' : '#64748b')
     .html(`
       <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
       <span class="ml-3">${t('regions.loadingData')}</span>
     `);

   const regions = await loadRegionData(apiStartDate, apiEndDate, focusCategory);
   
   // Удаляем начальный индикатор загрузки
   container.select('.initial-loader').remove();
   
   // Проверяем наличие данных и отображаем их
   if (regions && regions.length > 0) {
     console.log(`Получены данные по ${regions.length} регионам, обрабатываем...`);
     const processedRegions = processRegionData(regions);
     
     // Отображаем данные
     const selectableMonths = displayRegionData(processedRegions);
     
     // Инициируем сравнение с предыдущим периодом с задержкой
     setTimeout(() => {
       const comparisonContainer = d3.select('#region-comparison-container');
       
       // Проверяем наличие контейнера для сравнения
       if (!comparisonContainer.node()) {
         console.error('Контейнер для сравнения не найден после отображения данных');
         return;
       }
       
       // Удаляем индикатор загрузки в контейнере для сравнения
       comparisonContainer.select('.comparison-loader').remove();
       
       // Получаем все доступные месяцы для надежности
       const allAvailableMonths = [];
       
       // Получаем все годы из данных
       const allYears = Object.keys(financialData).map(Number).sort();
       
       // Формируем список месяцев
       allYears.forEach(y => {
         if (financialData[y] && financialData[y].months) {
           financialData[y].months.forEach((monthData, idx) => {
             if (monthData.total > 0) {
               allAvailableMonths.push({
                 id: `${y}-${idx + 1}`,
                 name: `${MONTHS[idx]} ${y}`,
                 year: y,
                 month: idx + 1
               });
             }
           });
         }
       });
       
       // Сортируем месяцы
       allAvailableMonths.sort((a, b) => {
         if (a.year !== b.year) return a.year - b.year;
         return a.month - b.month;
       });
       
       // Используем сохраненные ID, если они есть
       const startId = window.startMonthId;
       const endId = window.endMonthId;
       
       // Если сохраненных ID нет, находим текущий месяц и предыдущий
       if (!startId || !endId) {
         const currentIndex = allAvailableMonths.findIndex(m => m.year === year && m.month === month);
         console.log(`Найден индекс текущего месяца: ${currentIndex}, год: ${year}, месяц: ${month}`);
         
         if (currentIndex > 0) {
           // Вызываем сравнение с предыдущим месяцем
           console.log(`Автоматическое сравнение с предыдущим периодом: ${allAvailableMonths[currentIndex - 1].name} vs ${allAvailableMonths[currentIndex].name}`);
           
           updateRangeComparisonData(
             allAvailableMonths[currentIndex - 1].id, 
             allAvailableMonths[currentIndex].id,
             allAvailableMonths
           );
         } else {
           console.log('Нет предыдущего периода для сравнения, показываем сообщение');
           
           // Показываем сообщение о выборе диапазона
           comparisonContainer.append('div')
             .style('display', 'flex')
             .style('align-items', 'center')
             .style('justify-content', 'center')
             .style('height', '200px')
             .style('color', isDarkMode ? '#9ca3af' : '#64748b')
             .text(t('regions.selectPeriod'));
         }
       } else {
         // Используем сохраненные ID
         console.log(`Использование сохраненных ID периодов: ${startId} - ${endId}`);
         updateRangeComparisonData(startId, endId, allAvailableMonths);
       }
     }, 1000);
     
   } else {
     console.warn('Не получены данные о регионах для отображения');
     // Если данные не найдены, отображаем сообщение
     container.append('div')
       .style('display', 'flex')
       .style('align-items', 'center')
       .style('justify-content', 'center')
       .style('height', '300px')
       .style('color', isDarkMode ? '#9ca3af' : '#64748b')
       .text(t('regions.noData'));
   }
 } catch (error) {
   console.error('Ошибка при загрузке данных о регионах:', error);
   
   // Удаляем начальный индикатор загрузки если он есть
   container.select('.initial-loader').remove();
   
   // Показываем сообщение об ошибке
   container.append('div')
     .style('display', 'flex')
     .style('flex-direction', 'column')
     .style('align-items', 'center')
     .style('justify-content', 'center')
     .style('height', '300px')
     .style('color', '#ef4444')
     .style('text-align', 'center')
     .html(`
       <div>${t('regions.errorLoading')}</div>
       <div style="margin-top: 10px; font-size: 0.9rem;">${error.message}</div>
     `);
 }
 
 console.groupEnd(); // Завершаем группу логирования
};
const showSelectionOptions = (year, month, monthName) => {
  if (!mainChartRef.current) return;
  d3.selectAll('.chart-tooltip, .bar-tooltip, .model-tooltip').remove();
  // Очищаем контейнер
  mainChartRef.current.innerHTML = '';
  
  // Создаем стильный контейнер для выбора опций
  const container = d3.select(mainChartRef.current)
    .append('div')
    .style('display', 'flex')
    .style('flex-direction', 'column')
    .style('align-items', 'center')
    .style('justify-content', 'center')
    .style('width', '100%')
    .style('height', '100%')
    .style('background', isDarkMode 
      ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)' 
      : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)')
    .style('border-radius', '1rem')
    .style('padding', '20px')
    .style('box-shadow', isDarkMode 
      ? '0 10px 25px -5px rgba(0, 0, 0, 0.3)' 
      : '0 10px 25px -5px rgba(0, 0, 0, 0.1)');
  
  // Добавляем заголовок с периодом
  container.append('h2')
    .style('font-size', '1.5rem')
    .style('font-weight', 'bold')
    .style('color', isDarkMode ? '#f9fafb' : '#0f172a')
    .style('margin-bottom', '30px')
    .style('text-align', 'center')
    .html(`${t('models.title', { period: `<span style="color: #60a5fa;">${monthName}</span>` })}`);
  
  // Создаем контейнер для карточек выбора
  const cardsContainer = container.append('div')
    .style('display', 'flex')
    .style('gap', '40px')
    .style('justify-content', 'center')
    .style('margin-bottom', '30px');
  
  // Функция для создания стильной карточки выбора
  const createOptionCard = (title, icon, description, onClick) => {
    const card = cardsContainer.append('div')
      .style('background', isDarkMode 
        ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)' 
        : 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)')
      .style('border', `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)'}`)
      .style('border-radius', '16px')
      .style('width', '250px')
      .style('padding', '25px')
      .style('text-align', 'center')
      .style('cursor', 'pointer')
      .style('transition', 'transform 0.3s, box-shadow 0.3s')
      .style('position', 'relative')
      .style('overflow', 'hidden')
      .on('mouseover', function() {
        d3.select(this)
          .style('transform', 'translateY(-5px)')
          .style('box-shadow', isDarkMode 
            ? '0 15px 30px -10px rgba(0, 0, 0, 0.4)' 
            : '0 15px 30px -10px rgba(0, 0, 0, 0.2)');
      })
      .on('mouseout', function() {
        d3.select(this)
          .style('transform', 'translateY(0)')
          .style('box-shadow', 'none');
      })
      .on('click', onClick);
    
    // Добавляем фоновый градиент
    card.append('div')
      .style('position', 'absolute')
      .style('top', '0')
      .style('left', '0')
      .style('width', '100%')
      .style('height', '100%')
      .style('background', 'radial-gradient(circle at 90% 10%, rgba(59, 130, 246, 0.15) 0%, transparent 80%)')
      .style('z-index', '0');
    
    // Добавляем содержимое карточки
    const content = card.append('div')
      .style('position', 'relative')
      .style('z-index', '1');
    
    content.append('div')
      .style('font-size', '2.5rem')
      .style('color', '#60a5fa')
      .style('margin-bottom', '15px')
      .html(icon);
    
    content.append('h3')
      .style('font-size', '1.3rem')
      .style('font-weight', 'bold')
      .style('color', isDarkMode ? '#f9fafb' : '#0f172a')
      .style('margin-bottom', '10px')
      .text(title);
    
    content.append('p')
      .style('font-size', '0.9rem')
      .style('color', isDarkMode ? '#9ca3af' : '#64748b')
      .style('line-height', '1.5')
      .text(description);
    
    // Добавляем кнопку действия
    content.append('div')
      .style('background', isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)')
      .style('color', '#60a5fa')
      .style('padding', '8px 15px')
      .style('border-radius', '20px')
      .style('font-size', '0.85rem')
      .style('margin-top', '20px')
      .style('display', 'inline-block')
      .text(t('buttons.apply'));
  };
  
  // Создаем карточку выбора: по моделям автомобилей
  createOptionCard(
    t('models.byModels'),
    '<i class="fas fa-car"></i>',
    t('models.modelsAnalysis'),
    () => showCarModelDetails(year, month, monthName)
  );
  
  // Создаем карточку выбора: по регионам
  createOptionCard(
    t('models.byRegions'),
    '<i class="fas fa-map-marker-alt"></i>',
    t('models.regionsAnalysis'),
    () => showRegionDetails(year, month, monthName)
  );
  
  // Добавляем кнопку возврата
  container.append('button')
    .style('background', isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)')
    .style('color', '#60a5fa')
    .style('border', 'none')
    .style('padding', '10px 20px')
    .style('border-radius', '8px')
    .style('font-size', '0.9rem')
    .style('cursor', 'pointer')
    .style('transition', 'background 0.2s')
    .style('margin-top', '20px')
    .text(t('models.backToOverview'))
    .on('mouseover', function() {
      d3.select(this).style('background', isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)');
    })
    .on('mouseout', function() {
      d3.select(this).style('background', isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)');
    })
    .on('click', renderPeriodComparisonTable);
  
  // Добавляем стили Font Awesome для иконок
  const head = document.head || document.getElementsByTagName('head')[0];
  const fontAwesome = document.createElement('link');
  fontAwesome.rel = 'stylesheet';
  fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css';
  head.appendChild(fontAwesome);
};
const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
};
const renderDailySalesTableRows = () => {
  // Модели, которые нужно отображать отдельно
  const specificModels = ["DAMAS-2", "ONIX", "TRACKER-2", "COBALT"];
  
  // Создаем объединенный набор дат из всех трех источников
  const allDates = new Set();
  
  // Собираем все даты
  dailySalesData.all.forEach(item => {
    if (item.day) allDates.add(item.day);
  });
  
  dailySalesData.retail.forEach(item => {
    if (item.day) allDates.add(item.day);
  });
  
  dailySalesData.wholesale.forEach(item => {
    if (item.day) allDates.add(item.day);
  });
  
  // Преобразуем Set в массив и сортируем даты в обратном порядке (от последних к первым)
  const sortedDates = Array.from(allDates).sort((a, b) => {
    // Меняем a и b местами для обратной сортировки
    return new Date(b) - new Date(a);
  });
  
  // Создаем индексы данных по датам для быстрого доступа
  const allSalesIndex = {};
  const retailSalesIndex = {};
  const wholesaleSalesIndex = {};
  
  dailySalesData.all.forEach(item => {
    allSalesIndex[item.day] = item;
  });
  
  dailySalesData.retail.forEach(item => {
    retailSalesIndex[item.day] = item;
  });
  
  dailySalesData.wholesale.forEach(item => {
    wholesaleSalesIndex[item.day] = item;
  });
  
  // Рендерим строки для каждой даты
  return sortedDates.map((date, index) => {
    // Форматируем дату из YYYY-MM-DD в DD.MM.YYYY
    const displayDate = formatDisplayDate(date);
    
    // Получаем данные для текущей даты
    const allSalesData = allSalesIndex[date] || { amount: 0, all_count: 0 };
    const retailSalesData = retailSalesIndex[date] || { amount: 0, all_count: 0, models: [] };
    const wholesaleSalesData = wholesaleSalesIndex[date] || { amount: 0, all_count: 0 };
    
    // Проверяем формат и приводим к числу для безопасности
    const allAmount = parseFloat(allSalesData.amount) || 0;
    const retailAmount = parseFloat(retailSalesData.amount) || 0;
    const wholesaleAmount = parseFloat(wholesaleSalesData.amount) || 0;
    
    const allCount = parseInt(allSalesData.all_count) || 0;
    const retailCount = parseInt(retailSalesData.all_count) || 0;
    const wholesaleCount = parseInt(wholesaleSalesData.all_count) || 0;
    
    // Обработка данных по моделям
    const modelData = {};
    let otherModelsAmount = 0;
    let otherModelsCount = 0;
    
    // Инициализация данных для всех моделей
    specificModels.forEach(modelName => {
      modelData[modelName] = { amount: 0, count: 0 };
    });
    
    // Если есть данные о моделях, обрабатываем их
    if (retailSalesData.models && Array.isArray(retailSalesData.models)) {
      retailSalesData.models.forEach(model => {
        const modelName = model.model_name || '';
        const modelAmount = parseFloat(model.amount) || 0;
        const modelCount = parseInt(model.all_count) || 0;
        
        // Если модель входит в список специфических, добавляем данные
        if (specificModels.includes(modelName)) {
          modelData[modelName] = {
            amount: modelAmount,
            count: modelCount
          };
        } else {
          // Иначе добавляем к "Остальным"
          otherModelsAmount += modelAmount;
          otherModelsCount += modelCount;
        }
      });
    } else {
      // Если данных о моделях нет, считаем все как "Остальные"
      otherModelsAmount = retailAmount;
      otherModelsCount = retailCount;
    }
    
    return (
      <tr key={date} className={index % 2 === 0 
        ? (isDarkMode ? 'bg-gray-800' : 'bg-gray-50') 
        : (isDarkMode ? 'bg-gray-750' : 'bg-white')
      }>
        {/* Дата */}
        <td className="px-3 py-4 whitespace-nowrap">
          <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {displayDate}
          </div>
          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {getDayOfWeek(date)}
          </div>
        </td>
        
        {/* Общие продажи */}
        <td className="px-3 py-4 whitespace-nowrap">
          <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatProfitCompact(allAmount)}
          </div>
        </td>
        
        {/* Розничные продажи */}
        <td className="px-3 py-4 whitespace-nowrap">
          <div className={`text-sm font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            {formatProfitCompact(retailAmount)}
          </div>
        </td>
        
        {/* Оптовые продажи */}
        <td className="px-3 py-4 whitespace-nowrap">
          <div className={`text-sm font-medium ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
            {formatProfitCompact(wholesaleAmount)}
          </div>
        </td>
        
        {/* Данные по конкретным моделям */}
        {specificModels.map(modelName => (
          <td key={modelName} className="px-3 py-4 whitespace-nowrap">
            <div className={`text-sm font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
              {formatProfitCompact(modelData[modelName].amount)}
            </div>
          </td>
        ))}
        
        {/* Остальные модели */}
        <td className="px-3 py-4 whitespace-nowrap">
          <div className={`text-sm font-medium ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
            {formatProfitCompact(otherModelsAmount)}
          </div>
        </td>
      </tr>
    );
  });
};

const renderDailySalesTotalRow = () => {
  // Модели, которые нужно отображать отдельно
  const specificModels = ["DAMAS-2", "ONIX", "TRACKER-2", "COBALT"];
  
  // Функция для расчета общей суммы и количества
  const calculateTotal = (dataArray) => {
    return dataArray.reduce((acc, item) => {
      const amount = parseFloat(item.amount) || 0;
      const count = parseInt(item.all_count) || 0;
      
      return {
        amount: acc.amount + amount,
        all_count: acc.all_count + count
      };
    }, { amount: 0, all_count: 0 });
  };
  
  // Расчет итогов по всем категориям
  const allTotal = calculateTotal(dailySalesData.all);
  const retailTotal = calculateTotal(dailySalesData.retail);
  const wholesaleTotal = calculateTotal(dailySalesData.wholesale);
  
  // Расчет итогов по моделям
  const modelTotals = {};
  specificModels.forEach(model => {
    modelTotals[model] = { amount: 0, count: 0 };
  });
  
  let otherModelsTotal = { amount: 0, count: 0 };
  
  // Собираем данные по моделям
  dailySalesData.retail.forEach(dayData => {
    if (dayData.models && Array.isArray(dayData.models)) {
      dayData.models.forEach(model => {
        const modelName = model.model_name || '';
        const modelAmount = parseFloat(model.amount) || 0;
        const modelCount = parseInt(model.all_count) || 0;
        
        if (specificModels.includes(modelName)) {
          modelTotals[modelName].amount += modelAmount;
          modelTotals[modelName].count += modelCount;
        } else {
          otherModelsTotal.amount += modelAmount;
          otherModelsTotal.count += modelCount;
        }
      });
    }
  });
  
  return (
    <tr className={isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100'} style={{ fontWeight: '500' }}>
      <td className="px-3 py-4 whitespace-nowrap text-sm" style={{ color: isDarkMode ? '#f3f4f6' : '#111827' }}>
        {t('table.total')}
      </td>
      
      <td className="px-3 py-4 whitespace-nowrap">
        <div className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {formatProfitCompact(allTotal.amount)}
        </div>
      </td>
      
      <td className="px-3 py-4 whitespace-nowrap">
        <div className={`text-sm font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
          {formatProfitCompact(retailTotal.amount)}
        </div>
      </td>
      
      <td className="px-3 py-4 whitespace-nowrap">
        <div className={`text-sm font-bold ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
          {formatProfitCompact(wholesaleTotal.amount)}
        </div>
      </td>
      
      {/* Итоги по моделям */}
      {specificModels.map(model => (
        <td key={model} className="px-3 py-4 whitespace-nowrap">
          <div className={`text-sm font-bold ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
            {formatProfitCompact(modelTotals[model].amount)}
          </div>
        </td>
      ))}
      
      {/* Итоги по остальным моделям */}
      <td className="px-3 py-4 whitespace-nowrap">
        <div className={`text-sm font-bold ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
          {formatProfitCompact(otherModelsTotal.amount)}
        </div>
      </td>
    </tr>
  );
};

// Вспомогательная функция для получения дня недели с переводом
const getDayOfWeek = (dateStr) => {
  const date = new Date(dateStr);
  const dayOfWeek = date.getDay();
  const weekdays = [
    t('weekdays.sunday'),
    t('weekdays.monday'),
    t('weekdays.tuesday'),
    t('weekdays.wednesday'),
    t('weekdays.thursday'),
    t('weekdays.friday'),
    t('weekdays.saturday')
  ];
  return weekdays[dayOfWeek];
};


return (
  <div 
    className="min-h-screen p-4 md:p-6"
    style={{
      background: isDarkMode 
        ? 'linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a)' 
        : 'linear-gradient(to bottom right, #f8fafc, #e2e8f0, #f8fafc)',
      color: colors.text
    }}
  >
    {/* РАЗДЕЛ: Заголовок страницы */}
    <header className="mb-6">
   <motion.h1 
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent"
  style={{ color: 'transparent' }}
>
  {t('title')}
</motion.h1>
  <motion.p 
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.2 }}
  className="mt-2"
  style={{ color: colors.textSecondary }}
>
  {t('subtitle')}
</motion.p>
    </header>
    
    {/* Индикатор загрузки */}
    {isLoading ? (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-primary"></div>
      </div>
    ) : (
      <>
        {/* РАЗДЕЛ: Панель управления и фильтры */}
     <div 
  className="shadow-xl backdrop-blur-sm rounded-xl p-5 mb-6"
  style={{
    backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
    borderColor: colors.border,
    borderWidth: '1px',
    borderStyle: 'solid'
  }}
>
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Табы для категорий продаж */}
          <div 
  className="flex rounded-lg p-1"
  style={{
    backgroundColor: isDarkMode ? 'rgba(55, 65, 81, 0.8)' : 'rgba(229, 231, 235, 0.8)'
  }}
>
<button 
  className="px-3 py-1.5 rounded-md text-sm shadow-md"
  style={{
    backgroundColor: focusCategory === 'all' ? '#3b82f6' : 'transparent',
    color: focusCategory === 'all' ? '#ffffff' : colors.textSecondary
  }}
  onClick={() => handleCategoryChange('all')}
>
  {t('categories.all')}
</button>
              <button 
                className={`px-3 py-1.5 rounded-md text-sm ${
                  focusCategory === 'retail' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300'
                }`}
                onClick={() => handleCategoryChange('retail')}
                style={{ color: focusCategory === 'retail' ? '#ffffff' : SALE_TYPES.RETAIL.color }}
              >
                Розница
              </button>
              <button 
                className={`px-3 py-1.5 rounded-md text-sm ${
                  focusCategory === 'wholesale' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300'
                }`}
                onClick={() => handleCategoryChange('wholesale')}
                style={{ color: focusCategory === 'wholesale' ? '#ffffff' : SALE_TYPES.WHOLESALE.color }}
              >
                Опт
              </button>
            </div>

            {/* Элементы выбора даты для API запроса */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input 
                    type="date" 
                    className="bg-gray-700/80 text-white px-3 py-1.5 rounded-md text-sm border border-gray-600/50 w-36"
                    value={formatDateForInput(apiStartDate)}
                    onChange={(e) => setApiStartDate(formatDateFromInput(e.target.value))}
                  />
                </div>
                
                <span className="text-gray-400">—</span>
                
                <div className="relative">
                  <input 
                    type="date" 
                    className="bg-gray-700/80 text-white px-3 py-1.5 rounded-md text-sm border border-gray-600/50 w-36"
                    value={formatDateForInput(apiEndDate)}
                    onChange={(e) => setApiEndDate(formatDateFromInput(e.target.value))}
                  />
                </div>
              </div>
              
           <button 
  className="transition-colors text-white px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-1"
  style={{
    backgroundColor: '#3b82f6',
    ':hover': { backgroundColor: '#2563eb' }
  }}
  onClick={refreshDataWithDateRange}
>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              {t('buttons.refresh')}
</button>
            </div>
          </div>
        </div>
        
        {filteredData.length > 0 && (
          <>
            {/* РАЗДЕЛ: Информационные карточки */}

{/* РАЗДЕЛ: Информационные карточки */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 }}
    className="rounded-xl p-5 shadow-lg"
    style={{
      background: isDarkMode 
        ? 'linear-gradient(to br, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.1))' 
        : 'linear-gradient(to br, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))',
      border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`
    }}
  >
    <div className="flex items-center">
      <div 
        className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center mr-4"
        style={{
          backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill={isDarkMode ? '#93c5fd' : '#3b82f6'}>
          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
      </div>
      <div>
        <h3 style={{ color: isDarkMode ? '#93c5fd' : '#3b82f6' }}>
          {focusCategory === 'all' ? t('infoCards.totalAmount') : 
           focusCategory === 'retail' ? t('infoCards.retailSales') : 
           t('infoCards.wholesaleSales')}
        </h3>
        <p className="text-3xl font-bold mt-1" style={{ color: colors.text }}>
          {formatCurrency(getCurrentMonthTotal())}
        </p>
        <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
          {t('infoCards.currentMonth')}
        </p>
      </div>
    </div>
  </motion.div>
  
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
    className="rounded-xl p-5 shadow-lg"
    style={{
      background: isDarkMode 
        ? 'linear-gradient(to br, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.1))' 
        : 'linear-gradient(to br, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05))',
      border: `1px solid ${isDarkMode ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)'}`
    }}
  >
    <div className="flex items-center">
      <div 
        className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center mr-4"
        style={{
          backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)'
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill={isDarkMode ? '#c4b5fd' : '#8b5cf6'}>
          <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
        </svg>
      </div>
      <div>
        <h3 style={{ color: isDarkMode ? '#c4b5fd' : '#8b5cf6' }}>
          {focusCategory === 'all' ? t('infoCards.averageDaily') : 
           focusCategory === 'retail' ? t('infoCards.averageDailyRetail') : 
           t('infoCards.averageDailyWholesale')}
        </h3>
        <p className="text-3xl font-bold mt-1" style={{ color: colors.text }}>
          {formatCurrency(getCurrentMonthTotal() / new Date().getDate())}
        </p>
        <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
          {t('infoCards.basedOnDays', { count: new Date().getDate() })}
        </p>
      </div>
    </div>
  </motion.div>
  
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
    className="rounded-xl p-5 shadow-lg"
    style={{
      background: isDarkMode 
        ? 'linear-gradient(to br, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1))' 
        : 'linear-gradient(to br, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))',
      border: `1px solid ${isDarkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)'}`
    }}
  >
    <div className="flex items-center">
      <div 
        className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center mr-4"
        style={{
          backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)'
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill={isDarkMode ? '#86efac' : '#10b981'}>
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      </div>
      <div>
        <h3 style={{ color: isDarkMode ? '#86efac' : '#10b981' }}>
          {focusCategory === 'all' ? t('infoCards.expectedMonth') : 
           focusCategory === 'retail' ? t('infoCards.expectedRetail') : 
           t('infoCards.expectedWholesale')}
        </h3>
        <p className="text-3xl font-bold mt-1" style={{ color: colors.text }}>
          {formatCurrency(calculateTotalMonthEstimate())}
        </p>
        <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
          {t('infoCards.monthProgress', { 
            current: new Date().getDate(), 
            total: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() 
          })}
        </p>
      </div>
    </div>
  </motion.div>
</div>
            
            {/* РАЗДЕЛ: Основной график и прогресс */}
            <div className="gap-6 mb-6">
              <div className="lg:col-span-2 rounded-xl p-2">
                <div ref={mainChartRef} className="w-full h-full"></div>
              </div>
            </div>
          </>
        )}

     <div className={`mt-6 shadow-xl backdrop-blur-sm rounded-xl p-5 border ${
  isDarkMode 
    ? 'bg-gray-800/80 border-gray-700/50' 
    : 'bg-white/90 border-gray-200'
}`}>
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
      {t('table.title')}
    </h2>
    
    {/* Панель управления таблицей */}
    <div className="flex items-center gap-2">
      {/* Выбор дат для таблицы */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <input 
            type="date" 
            className={`px-3 py-1.5 rounded-md text-sm border w-36 ${
              isDarkMode 
                ? 'bg-gray-700/80 text-white border-gray-600/50 focus:border-blue-500' 
                : 'bg-white text-gray-900 border-gray-300 focus:border-blue-600'
            }`}
            value={formatDateForInput(tableDateStart || apiStartDate)}
            onChange={(e) => setTableDateStart(formatDateFromInput(e.target.value))}
          />
        </div>
        
        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>—</span>
        
        <div className="relative">
          <input 
            type="date" 
            className={`px-3 py-1.5 rounded-md text-sm border w-36 ${
              isDarkMode 
                ? 'bg-gray-700/80 text-white border-gray-600/50 focus:border-blue-500' 
                : 'bg-white text-gray-900 border-gray-300 focus:border-blue-600'
            }`}
            value={formatDateForInput(tableDateEnd || apiEndDate)}
            onChange={(e) => setTableDateEnd(formatDateFromInput(e.target.value))}
          />
        </div>
      </div>
      
      {/* Кнопка обновления таблицы */}
      <button 
        className={`transition-colors text-white px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-1 ${
          isDarkMode 
            ? 'bg-blue-600 hover:bg-blue-700' 
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
        onClick={fetchDailySalesData}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
        </svg>
        {t('buttons.loadData')}
      </button>
    </div>
  </div>
  
  {/* Контейнер таблицы с обработкой состояний загрузки */}
  <div className="overflow-x-auto">
    {isLoadingDailySales ? (
      <div className="flex justify-center items-center py-10">
        <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${
          isDarkMode ? 'border-blue-500' : 'border-blue-600'
        }`}></div>
        <span className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {t('table.loading')}
        </span>
      </div>
    ) : dailySalesData.all.length === 0 && dailySalesData.retail.length === 0 && dailySalesData.wholesale.length === 0 ? (
      <div className={`flex flex-col items-center justify-center py-10 ${
        isDarkMode ? 'text-gray-400' : 'text-gray-500'
      }`}>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-16 w-16 mb-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="1.5" 
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
          />
        </svg>
        <p className="text-lg">{t('table.noData')}</p>
        <p className="text-sm mt-1">{t('table.selectDifferentPeriod')}</p>
      </div>
    ) : (
      <table className={`min-w-full table-fixed ${
        isDarkMode ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'
      }`}>
        <thead className={isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}>
          <tr>
            <th scope="col" className={`px-3 py-3 text-left text-xs font-medium uppercase tracking-wider w-32 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {t('table.headers.date')}
            </th>
            <th scope="col" className={`px-3 py-3 text-left text-xs font-medium uppercase tracking-wider w-44 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {t('table.headers.totalSales')}
            </th>
            <th scope="col" className={`px-3 py-3 text-left text-xs font-medium uppercase tracking-wider w-44 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {t('table.headers.retailSales')}
            </th>
            <th scope="col" className={`px-3 py-3 text-left text-xs font-medium uppercase tracking-wider w-44 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {t('table.headers.wholesaleSales')}
            </th>
            
            {/* Новые заголовки для моделей */}
            <th scope="col" className={`px-3 py-3 text-left text-xs font-medium uppercase tracking-wider w-44 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              DAMAS-2
            </th>
            <th scope="col" className={`px-3 py-3 text-left text-xs font-medium uppercase tracking-wider w-44 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              ONIX
            </th>
            <th scope="col" className={`px-3 py-3 text-left text-xs font-medium uppercase tracking-wider w-44 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              TRACKER-2
            </th>
            <th scope="col" className={`px-3 py-3 text-left text-xs font-medium uppercase tracking-wider w-44 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              COBALT
            </th>
            <th scope="col" className={`px-3 py-3 text-left text-xs font-medium uppercase tracking-wider w-44 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {t('table.headers.remaining')}
            </th>
          </tr>
        </thead>
        <tbody className={`${isDarkMode ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'}`}>
          {/* Генерируем строки таблицы */}
          {renderDailySalesTableRows()}
          
          {/* Итоговая строка */}
          {renderDailySalesTotalRow()}
        </tbody>
      </table>
    )}
  </div>
</div>
      </>
    )}
    <style jsx>{`
      .bg-clip-text {
        -webkit-background-clip: text;
        background-clip: text;
      }
      .text-transparent {
        color: transparent;
      }
    `}</style>
  </div>
);
}