"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as d3 from 'd3';
import { D3Visualizer } from '@/src/utils/dataVisualizer';

// Массив месяцев для отображения
const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

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
  const [apiStartDate, setApiStartDate] = useState('01.01.2025');
  const [apiEndDate, setApiEndDate] = useState('31.12.2025');
  const [apiEndpoint, setApiEndpoint] = useState("get_all_payment"); // Начальный эндпоинт API (все продажи)
  const [dataStructureType, setDataStructureType] = useState("region"); // "model" для розницы, "region" для опта и всех
  const [dailySalesData, setDailySalesData] = useState({
  all: [],
  retail: [],
  wholesale: []
});
const [isLoadingDailySales, setIsLoadingDailySales] = useState(false);
const [tableDateStart, setTableDateStart] = useState(apiStartDate);
const [tableDateEnd, setTableDateEnd] = useState(apiEndDate);
  // Функция для получения текущего месяца и года
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
    // Получаем первое число текущего месяца и текущую дату
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Форматируем даты в формат DD.MM.YYYY для API
    const formatDate = (date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    };
    
    const startDateFormatted = formatDate(firstDayOfMonth);
    const endDateFormatted = formatDate(currentDay);
    
    console.log(`Загрузка данных с ${startDateFormatted} по ${endDateFormatted}`);
    
    // Загружаем данные из всех трех API-эндпоинтов параллельно
    const [allSalesResponse, retailSalesResponse, wholesaleSalesResponse] = await Promise.all([
      fetch(`https://uzavtosalon.uz/b/dashboard/infos&get_all_payment_by_day`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `begin_date=${startDateFormatted}&end_date=${endDateFormatted}`
      }),
      fetch(`https://uzavtosalon.uz/b/dashboard/infos&get_roz_payment_by_day`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `begin_date=${startDateFormatted}&end_date=${endDateFormatted}`
      }),
      fetch(`https://uzavtosalon.uz/b/dashboard/infos&get_opt_payment_by_day`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `begin_date=${startDateFormatted}&end_date=${endDateFormatted}`
      })
    ]);
    
    // Проверяем успешность запросов
    if (!allSalesResponse.ok || !retailSalesResponse.ok || !wholesaleSalesResponse.ok) {
      throw new Error('Ошибка при получении данных от API');
    }
    
    // Парсим ответы
    const allSalesJsonData = await allSalesResponse.json();
    const retailSalesJsonData = await retailSalesResponse.json();
    const wholesaleSalesJsonData = await wholesaleSalesResponse.json();
    
    console.log('Исходные данные:', { allSalesJsonData, retailSalesJsonData, wholesaleSalesJsonData });
    
    // Преобразуем ответы API в нужный формат
    const transformData = (data, type) => {
      console.log(`Обработка данных для типа: ${type}`);
      console.log("Структура данных:", data);
      
      // Для общих продаж и оптовых продаж
      if (type === 'all' || type === 'wholesale') {
        // Проверяем структуру данных
        let dailyData = [];
        
        // Если данные уже представлены как массив с filter_by_region
        if (Array.isArray(data.filter_by_region)) {
          dailyData = data.filter_by_region;
          console.log(`Используем data.filter_by_region для ${type}`);
        }
        // Если данные представлены как массив дней
        else if (Array.isArray(data) && data.length > 0 && data[0].day) {
          dailyData = data;
          console.log(`Используем массив дней для ${type}`);
        }
        // Если данные представлены как массив с filter_by_region внутри первого элемента
        else if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0].filter_by_region)) {
          dailyData = data[0].filter_by_region;
          console.log(`Используем data[0].filter_by_region для ${type}`);
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
    
    // Также обновляем значения для полей ввода дат
    setTableDateStart(startDateFormatted);
    setTableDateEnd(endDateFormatted);
    
  } catch (error) {
    console.error('Ошибка при загрузке данных о продажах:', error);
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
    
    const response = await fetch(`https://uzavtosalon.uz/b/dashboard/infos&${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `begin_date=${apiStartDate}&end_date=${apiEndDate}`
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
// Вспомогательная функция для преобразования массива месяцев в формат финансовых данных
const convertMonthsArrayToFinancialData = (monthsArray, category) => {
  console.log("Конвертация массива месяцев в финансовые данные:", monthsArray);
  
  const result = {};
  const years = new Set();
  
  // Собираем годы
  monthsArray.forEach(month => {
    if (!month || !month.month || typeof month.month !== 'string') return;
    
    const parts = month.month.split('-');
    if (parts.length !== 2) return;
    
    const year = parseInt(parts[0], 10);
    if (isNaN(year)) return;
    
    years.add(year);
  });
  
  console.log("Найденные годы:", Array.from(years));
  
  // Создаем структуру данных для каждого года
  Array.from(years).forEach(year => {
    result[year] = {
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
      modelData: {} // Пустой объект для совместимости
    };
  });
  
  // Заполняем данные
  monthsArray.forEach(monthData => {
    if (!monthData || !monthData.month || typeof monthData.month !== 'string') return;
    
    const parts = monthData.month.split('-');
    if (parts.length !== 2) return;
    
    const year = parseInt(parts[0], 10);
    const monthIndex = parseInt(parts[1], 10) - 1;
    
    if (isNaN(year) || isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) return;
    if (!result[year]) return;
    
    let monthTotal = 0;
    
    if (Array.isArray(monthData.regions)) {
      monthData.regions.forEach(region => {
        if (!region) return;
        
        const amount = parseFloat(region.amount) || 0;
        monthTotal += amount;
      });
    }
    
    // Обновляем данные
    result[year].months[monthIndex].total += monthTotal;
    
    // Распределяем по категориям
    if (category === 'wholesale') {
      result[year].months[monthIndex].wholesale += monthTotal;
      result[year].categories.wholesale += monthTotal;
    } else if (category === 'all') {
      const retailAmount = monthTotal * 0.6;
      const wholesaleAmount = monthTotal * 0.4;
      
      result[year].months[monthIndex].retail += retailAmount;
      result[year].months[monthIndex].wholesale += wholesaleAmount;
      
      result[year].categories.retail += retailAmount;
      result[year].categories.wholesale += wholesaleAmount;
    }
    
    // Обновляем квартальные данные
    const quarterIndex = Math.floor(monthIndex / 3);
    result[year].quarterlyData[quarterIndex] += monthTotal;
    
    // Обновляем общую сумму
    result[year].totalEarned += monthTotal;
  });
  
  // Устанавливаем целевой показатель
  Object.keys(result).forEach(year => {
    result[year].targetAmount = result[year].totalEarned * 1.2;
  });
  
  console.log("Результат конвертации:", result);
  return result;
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
    renderProgressChart();
    renderDetailsChart();
    renderYearlyTrendChart();
    
    if (displayMode === 'compare') {
      renderYearComparisonChart();
    } else if (displayMode === 'period') {
      renderPeriodComparisonTable();
    }
    
    renderForecastChart();
    renderCategoryDistribution();
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
  
  // Округляем до целого числа и форматируем с разделителями тысяч
  const formattedNumber = Math.round(number).toLocaleString('ru-RU');
  
  // Добавляем обозначение валюты
  return `${formattedNumber} UZS`;
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
  
  // Функция для расчета среднего дохода в день на основе прошедших дней текущего месяца
const calculateAverageDailyIncome = () => {
  // Получаем текущую дату
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();
  
  // Находим данные текущего месяца
  const currentMonthData = filteredData.find(
    month => month.month === currentMonth && month.year === currentYear
  );
  
  // Если данных нет, возвращаем 0
  if (!currentMonthData) return 0;
  
  // Общий доход за текущий месяц в зависимости от категории
  let totalIncome = 0;
  
  switch (focusCategory) {
    case 'retail':
      totalIncome = currentMonthData.retail;
      break;
    case 'wholesale':
      totalIncome = currentMonthData.wholesale;
      break;
    case 'all':
    default:
      totalIncome = currentMonthData.total;
      break;
  }
  
  // Делим на количество прошедших дней
  return totalIncome / currentDay;
};
  
  // Функция для расчета полного прогнозируемого дохода за текущий месяц
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
  if (!filteredData.length) {
    mainChartRef.current.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100%"><p style="color:#9ca3af">Загрузка данных...</p></div>';
    return;
  }
  
  // Очистка контейнера
  mainChartRef.current.innerHTML = '';
    
  // Подготовка данных для графика в зависимости от режима отображения
  let chartData;

  // Обработка данных с учетом выбранного режима отображения
  if (displayMode === 'yearly') {
    // Для годового представления - суммарное значение по месяцам
    chartData = filteredData.map(month => ({
      id: month.month,
      label: month.name,
      value: focusCategory === 'all' ? month.total : month[focusCategory],
      month: month,
      color: focusCategory === 'all' ? undefined : SALE_TYPES[focusCategory.toUpperCase()].color
    }));
  } else if (displayMode === 'compare') {
    // Для сравнения - данные сгруппированные по месяцам с разбивкой по годам
    const monthGroups = {};
    
    // Собираем все доступные месяцы и данные по годам
    filteredData.forEach(month => {
      if (!monthGroups[month.month]) {
        monthGroups[month.month] = {
          month: month.month,
          name: month.name,
          years: {}
        };
      }
      
      // Сохраняем значение для каждого года без ограничений
      monthGroups[month.month].years[month.year] = focusCategory === 'all' ? 
        month.total : month[focusCategory];
    });
    
    // Получаем все уникальные годы из данных
    const allYears = [...new Set(filteredData.map(item => item.year))].sort();
    
    // Конвертируем в формат для grouped bar chart, включая все годы
    chartData = Object.values(monthGroups).map(group => {
      // Проверяем, что данные для всех годов присутствуют
      allYears.forEach(year => {
        if (group.years[year] === undefined) {
          group.years[year] = 0; // Устанавливаем 0 для отсутствующих данных
        }
      });
      
      return {
        category: group.name,
        // Преобразуем в массив значений, включая все годы
        values: Object.entries(group.years).map(([year, value]) => ({
          label: year.toString(),
          value
        }))
      };
    }).sort((a, b) => {
      // Сортируем по номеру месяца
      const monthA = MONTHS.indexOf(a.category);
      const monthB = MONTHS.indexOf(b.category);
      return monthA - monthB;
    });
  } else {
    // Для периода - группировка по месяцам и годам
    chartData = filteredData.map(month => ({
      id: `${month.year}-${month.month}`,
      label: month.label || `${month.name} ${month.year}`,
      value: focusCategory === 'all' ? month.total : month[focusCategory],
      month: month,
      color: focusCategory === 'all' ? undefined : SALE_TYPES[focusCategory.toUpperCase()].color
    }));
  }
  
  // Настройки графика с улучшенной типографикой и визуальным форматированием
  let chartTitle;
  if (displayMode === 'yearly') {
    chartTitle = `Финансовые показатели за ${selectedYears[0]} год` +
      (focusCategory !== 'all' ? ` (${SALE_TYPES[focusCategory.toUpperCase()].name})` : '');
  } else if (displayMode === 'compare') {
    chartTitle = `Сравнение продаж по месяцам ${selectedYears.join(', ')}` +
      (focusCategory !== 'all' ? ` (${SALE_TYPES[focusCategory.toUpperCase()].name})` : '');
  } else {
    chartTitle = `Финансовые показатели за выбранный период` +
      (focusCategory !== 'all' ? ` (${SALE_TYPES[focusCategory.toUpperCase()].name})` : '');
  }
  
  // Улучшенные настройки графика для повышения читаемости и эстетики
  const chartOptions = {
    container: mainChartRef.current,
    title: chartTitle,
    height: 400,
    colors: focusCategory === 'all' ? d3.schemeBlues[9].slice(3) : [SALE_TYPES[focusCategory.toUpperCase()].color],
    animated: true,
    // Добавляем улучшенные стили для графика
    borderRadius: 8,
    labelFontSize: '0.85rem',
    labelColor: '#d1d5db',
    gridOpacity: 0.15,
    barRadius: 4,
    animationDuration: 800,
    animationEasing: 'easeOutElastic',
    shadow: true,
    responsive: true,
    theme: 'dark'
  };
  
  // Отрисовка в зависимости от выбранного типа графика и режима отображения
  if (viewType === 'bar') {
    if (displayMode === 'compare') {
      // Используем улучшенную функцию для отображения сгруппированных столбцов
      renderGroupedBarChart(chartData, chartOptions);
    } else {
      // Используем базовую функцию из D3Visualizer с улучшенными опциями
      D3Visualizer.createBarChart(chartData, chartOptions);
    }
  } else if (viewType === 'line' || viewType === 'area') {
    if (displayMode === 'compare') {
      // Для будущей реализации мультилинейного графика
      // renderMultiLineChart(chartData, chartOptions);
    } else {
      const lineData = chartData.map(item => ({
        x: item.label, 
        y: item.value
      }));
      
      if (viewType === 'line') {
        // Будущая реализация линейного графика с улучшенными параметрами
        // renderCustomLineChart(lineData, chartOptions);
      } else {
        // Используем существующую функцию с улучшенными визуальными параметрами
        D3Visualizer.createAreaChart(lineData, {
          ...chartOptions,
          colors: [focusCategory === 'all' ? '#3b82f6' : SALE_TYPES[focusCategory.toUpperCase()].color],
          areaOpacity: 0.2, // Добавляем прозрачность для области под линией
          lineWidth: 2.5,   // Увеличиваем толщину основной линии
          curveType: 'curveMonotoneX', // Используем более плавную кривую
          tooltipEnabled: true, // Включаем подсказки при наведении
          dotRadius: 4,   // Размер точек на линии
          hoverDotRadius: 6 // Размер точек при наведении
        });
      }
    }
  } else if (viewType === 'stacked') {
    // Подготовка данных для стекового графика
    const stackedData = filteredData.map(month => {
      return {
        category: displayMode === 'yearly' ? month.name : (month.label || `${month.name} ${month.year}`),
        values: [
          { label: SALE_TYPES.RETAIL.name, value: month.retail },
          { label: SALE_TYPES.WHOLESALE.name, value: month.wholesale },
          { label: SALE_TYPES.PROMO.name, value: month.promo }
        ]
      };
    });
    
    // Отрисовка с улучшенными параметрами
    D3Visualizer.createStackedBarChart(stackedData, {
      ...chartOptions,
      title: 'Структура продаж по месяцам',
      colors: [SALE_TYPES.RETAIL.color, SALE_TYPES.WHOLESALE.color, SALE_TYPES.PROMO.color],
      legendPosition: 'top-right', // Позиция легенды
      stackSpacing: 1, // Небольшой промежуток между элементами стека
      highlightOnHover: true, // Выделение при наведении
      percentageMode: false, // Отображение абсолютных значений
      legendFormat: 'circle' // Формат маркеров в легенде
    });
  }
  
  // Добавление интерактивных элементов и улучшение отзывчивости
  if (chartData.length > 0) {
    addInteractiveElements(mainChartRef.current, chartData, chartOptions);
  }
};
// Вспомогательная функция для добавления интерактивных элементов к графику
const addInteractiveElements = (container, data, options) => {
  // Добавление мини-панели взаимодействия для управления графиком
  const controlPanel = document.createElement('div');
  controlPanel.className = 'chart-controls';
  controlPanel.style.position = 'absolute';
  controlPanel.style.top = '10px';
  controlPanel.style.right = '10px';
  controlPanel.style.display = 'flex';
  controlPanel.style.gap = '8px';
  controlPanel.style.background = 'rgba(17, 24, 39, 0.6)';
  controlPanel.style.padding = '4px 8px';
  controlPanel.style.borderRadius = '4px';
  controlPanel.style.fontSize = '0.75rem';
  
  // Пример кнопки в контрольной панели (можно расширить)
  const fullscreenButton = document.createElement('button');
  fullscreenButton.textContent = '⛶';
  fullscreenButton.title = 'Показать на весь экран';
  fullscreenButton.style.background = 'none';
  fullscreenButton.style.border = 'none';
  fullscreenButton.style.color = '#9ca3af';
  fullscreenButton.style.cursor = 'pointer';
  fullscreenButton.style.fontSize = '1rem';
  fullscreenButton.style.transition = 'color 0.2s';
  
  fullscreenButton.addEventListener('mouseover', () => {
    fullscreenButton.style.color = '#f9fafb';
  });
  
  fullscreenButton.addEventListener('mouseout', () => {
    fullscreenButton.style.color = '#9ca3af';
  });
  
  fullscreenButton.addEventListener('click', () => {
    // Логика открытия графика на весь экран
    console.log('Открытие графика в полноэкранном режиме');
  });
  
  controlPanel.appendChild(fullscreenButton);
  
  // Кнопка экспорта данных
  const exportButton = document.createElement('button');
  exportButton.textContent = '⤓';
  exportButton.title = 'Экспорт данных';
  exportButton.style.background = 'none';
  exportButton.style.border = 'none';
  exportButton.style.color = '#9ca3af';
  exportButton.style.cursor = 'pointer';
  exportButton.style.fontSize = '1rem';
  exportButton.style.transition = 'color 0.2s';
  
  exportButton.addEventListener('mouseover', () => {
    exportButton.style.color = '#f9fafb';
  });
  
  exportButton.addEventListener('mouseout', () => {
    exportButton.style.color = '#9ca3af';
  });
  
  exportButton.addEventListener('click', () => {
    // Логика экспорта данных
    console.log('Экспорт данных графика');
  });
  
  controlPanel.appendChild(exportButton);
  
  // Добавляем панель управления к контейнеру
  container.appendChild(controlPanel);
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
    .style('background', 'radial-gradient(circle at 10% 20%, rgba(21, 30, 45, 0.4) 0%, rgba(10, 14, 23, 0.2) 90%)')
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
    .style('background', 'rgba(30, 41, 59, 0.5)')
    .style('border-radius', '10px')
    .style('border', '1px solid rgba(59, 130, 246, 0.15)')
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
    .style('color', '#9ca3af')
    .style('font-size', '0.85rem')
    .style('margin-right', '6px')
    .text('Месяц:');
 
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
    .style('background', 'rgba(17, 24, 39, 0.8)')
    .style('color', '#f9fafb')
    .style('border', '1px solid rgba(75, 85, 99, 0.5)')
    .style('border-radius', '6px')
    .style('padding', '4px 8px')
    .style('font-size', '0.85rem')
    .style('cursor', 'pointer')
    .style('transition', 'all 0.2s')
    .on('mouseover', function() {
      d3.select(this).style('border-color', 'rgba(59, 130, 246, 0.5)');
    })
    .on('mouseout', function() {
      d3.select(this).style('border-color', 'rgba(75, 85, 99, 0.5)');
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
    .text('Все месяцы');
 
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
    .style('color', '#9ca3af')
    .style('font-size', '0.85rem')
    .style('margin-right', '6px')
    .text('День:');
 
  // Создаем селект дня с улучшенным стилем
  const daySelect = daySelector.append('select')
    .attr('id', 'day-select')
    .style('background', 'rgba(17, 24, 39, 0.8)')
    .style('color', '#f9fafb')
    .style('border', '1px solid rgba(75, 85, 99, 0.5)')
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
      d3.select(this).style('border-color', 'rgba(75, 85, 99, 0.5)');
    })
    .on('change', function() {
      setSelectedDay(this.value);
      updateChartByDay(selectedMonth, this.value);
    });
 
  // Добавляем опцию "Все дни"
  daySelect.append('option')
    .attr('value', '')
    .text('Все дни');
 
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
    .style('background', 'rgba(59, 130, 246, 0.15)')
    .style('color', '#60a5fa')
    .style('border', '1px solid rgba(59, 130, 246, 0.3)')
    .style('border-radius', '6px')
    .style('padding', '4px 10px')
    .style('font-size', '0.8rem')
    .style('display', 'none');
 
  // Добавляем кнопку сброса фильтров
  const resetButton = filterPanel.append('button')
    .style('background', 'rgba(59, 130, 246, 0.2)')
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
    .html('<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 13h12l4-8-8 12-1-9-2 5h-5z"/></svg> <span>Сбросить</span>')
    .on('mouseover', function() {
      d3.select(this).style('background', 'rgba(59, 130, 246, 0.3)');
    })
    .on('mouseout', function() {
      d3.select(this).style('background', 'rgba(59, 130, 246, 0.2)');
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
    .style('background', 'rgba(0, 0, 0, 0.3)')
    .style('color', '#f0f0f0')
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
    .style('background', 'linear-gradient(135deg, #1f2937 0%, #111827 100%)')
    .style('border-radius', '1rem')
    .style('box-shadow', '0 10px 25px -5px rgba(0, 0, 0, 0.3)')
    .style('border', '1px solid rgba(59, 130, 246, 0.1)');
 
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
    .attr('fill', 'rgba(30, 58, 138, 0.3)')
    .attr('stroke', 'rgba(59, 130, 246, 0.5)')
    .attr('stroke-width', 1);
 
  // Добавляем заголовок с тенью для текста
  headerCard.append('text')
    .attr('class', 'chart-title')
    .attr('x', 0)
    .attr('y', 7)
    .attr('text-anchor', 'middle')
    .style('font-size', '1.3rem')
    .style('font-weight', 'bold')
    .style('fill', '#f9fafb')
    .style('filter', 'drop-shadow(0 2px 3px rgba(0,0,0,0.5))')
    .text(`Аналитика продаж автомобилей`);
 
  // Функция для обновления графика по выбранному месяцу (показывает все дни месяца)
  const updateChartByMonth = (monthKey) => {
    if (!monthKey) {
      updateChart(); // Показываем все данные
      return;
    }
    
    const [year, month] = monthKey.split('-').map(Number);
    
    // Находим данные месяца
    const monthData = filteredData.find(item => 
      item.year === year && item.month === month
    );
    
    if (!monthData) return;
    
    // Обновляем бейдж периода
    const periodBadge = d3.select('#period-badge')
      .style('display', 'block')
      .html(`Период: ${MONTHS[month-1]} ${year}`);
    
    // Обновляем заголовок
    d3.select('.chart-title')
      .text(`Аналитика продаж за ${MONTHS[month-1]} ${year}`);
    
    // Генерируем данные по дням месяца
    const daysInMonth = new Date(year, month, 0).getDate();
    const daysData = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      // Создаем вариативность данных на основе дня
      const dayFactor = 0.7 + Math.sin(day / 30 * Math.PI * 2) * 0.3;
      // Уменьшаем показатели для выходных
      const date = new Date(year, month - 1, day);
      const weekendFactor = (date.getDay() === 0 || date.getDay() === 6) ? 0.6 : 1;
      
      daysData.push({
        year: year,
        month: month,
        day: day,
        name: day.toString(), // Используем день как название
        label: `${day}`,
        retail: Math.round(monthData.retail / daysInMonth * dayFactor * weekendFactor),
        wholesale: Math.round(monthData.wholesale / daysInMonth * dayFactor * weekendFactor),
        promo: Math.round(monthData.promo / daysInMonth * dayFactor * weekendFactor),
        total: Math.round(monthData.total / daysInMonth * dayFactor * weekendFactor)
      });
    }
    
    // Обновляем график с данными по дням
    updateChart(daysData, false, true);
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
      .html(`Период: ${day} ${MONTHS[month-1]} ${year}`);
    
    // Обновляем заголовок
    d3.select('.chart-title')
      .text(`Аналитика продаж за ${day} ${MONTHS[month-1]} ${year}`);
    
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
      .attr('stroke', 'rgba(107, 114, 128, 0.15)')
      .attr('stroke-dasharray', '3,3');
    
    // Добавляем оси с улучшенным стилем
    const xAxis = g => g
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x0).tickSizeOuter(0))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').remove())
      .call(g => g.selectAll('text')
        .style('fill', '#d1d5db')
        .style('font-size', isDaysList ? '0.7rem' : '0.85rem') // Размер текста меньше для дней
        .attr('dy', '0.6em')
        // Не поворачиваем цифры дней
        .attr('transform', isDaysList ? '' : 'rotate(-20)')
        .attr('text-anchor', isDaysList ? 'middle' : 'end'));
    
    const yAxis = g => g
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => formatProfitCompact(d)))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line')
        .attr('x2', width - margin.left - margin.right)
        .attr('stroke-opacity', 0.05))
      .call(g => g.selectAll('text')
        .style('fill', '#d1d5db')
        .style('font-size', '0.8rem'));
    
    svg.append('g').call(xAxis);
    svg.append('g').call(yAxis);
    
    // Добавляем подпись к оси Y
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(height - margin.bottom + margin.top)/2)
      .attr('y', margin.left/3)
      .attr('text-anchor', 'middle')
      .style('fill', '#9ca3af')
      .style('font-size', '0.85rem')
      .text('Объем продаж (UZS)');
    
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
        .style('background', 'rgba(17, 24, 39, 0.95)')
        .style('color', '#f9fafb')
        .style('padding', '10px 15px')
        .style('border-radius', '5px')
        .style('font-size', '0.9rem')
        .style('box-shadow', '0 4px 15px rgba(0, 0, 0, 0.3)')
        .style('border', '1px solid rgba(59, 130, 246, 0.3)')
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
        <div style="border-bottom: 1px solid rgba(75, 85, 99, 0.3); margin-bottom: 8px; padding-bottom: 8px;">
          <div style="font-weight: bold; font-size: 1rem; margin-bottom: 4px;">${d.name}</div>
          <div style="font-size: 0.8rem; color: #9ca3af;">Нажмите для детального анализа</div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div>
            <div style="font-size: 0.75rem; color: #9ca3af;">Продажи</div>
            <div style="font-weight: bold;">${formatProfitCompact(d.sales)}</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: #9ca3af;">Количество</div>
            <div style="font-weight: bold;">${d.count} шт.</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: #9ca3af;">Доля</div>
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
      .attr('stroke', d => d3.rgb(colorScale(d.year)).darker(0.5))
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
            <strong>${isDaysList ? `День ${d.name}` : d.name} ${d.year}</strong>
          </div>
          <div style="margin-left: 20px;">Продажи: <strong>${formatProfitCompact(d.value)}</strong></div>
          <div style="font-size: 0.8rem; color: #9ca3af; margin-top: 5px;">
            Нажмите для просмотра детализации
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
      .style('fill', '#f9fafb')
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
        .attr('fill', 'rgba(17, 24, 39, 0.6)')
        .attr('stroke', 'rgba(59, 130, 246, 0.2)')
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
      .style('fill', '#f9fafb')
      .text(d => d);
    
    // Добавляем подсказку о прокрутке, если много годов
    if (needScrolling) {
      legendContainer.append('text')
        .attr('x', 65)
        .attr('y', maxVisibleLegendItems * 30 + 25)
        .attr('text-anchor', 'middle')
        .style('font-size', '0.7rem')
        .style('fill', '#9ca3af')
        .text('⟳ Прокрутите для просмотра');
    }
  };
  
  // Инициализация графика с полными данными
  updateChart();
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
    .style('background', 'linear-gradient(135deg, #1f2937 0%, #111827 100%)')
    .style('border-radius', '1rem')
    .style('padding', '20px')
    .style('box-shadow', '0 10px 25px -5px rgba(0, 0, 0, 0.3)');
  
  // Добавляем заголовок с периодом
  container.append('h2')
    .style('font-size', '1.5rem')
    .style('font-weight', 'bold')
    .style('color', '#f9fafb')
    .style('margin-bottom', '30px')
    .style('text-align', 'center')
    .html(`Детализация продаж: <span style="color: #60a5fa;">${monthName}</span>`);
  
  // Создаем контейнер для карточек выбора
  const cardsContainer = container.append('div')
    .style('display', 'flex')
    .style('gap', '40px')
    .style('justify-content', 'center')
    .style('margin-bottom', '30px');
  
  // Функция для создания стильной карточки выбора
  const createOptionCard = (title, icon, description, onClick) => {
    const card = cardsContainer.append('div')
      .style('background', 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)')
      .style('border', '1px solid rgba(59, 130, 246, 0.2)')
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
          .style('box-shadow', '0 15px 30px -10px rgba(0, 0, 0, 0.4)');
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
      .style('color', '#f9fafb')
      .style('margin-bottom', '10px')
      .text(title);
    
    content.append('p')
      .style('font-size', '0.9rem')
      .style('color', '#9ca3af')
      .style('line-height', '1.5')
      .text(description);
    
    // Добавляем кнопку действия
    content.append('div')
      .style('background', 'rgba(59, 130, 246, 0.2)')
      .style('color', '#60a5fa')
      .style('padding', '8px 15px')
      .style('border-radius', '20px')
      .style('font-size', '0.85rem')
      .style('margin-top', '20px')
      .style('display', 'inline-block')
      .text('Выбрать');
  };
  
  // Создаем карточку выбора: по моделям автомобилей
  createOptionCard(
    'По моделям авто',
    '<i class="fas fa-car"></i>',
    'Анализ продаж различных моделей автомобилей с разбивкой по популярности и доходности',
    () => showCarModelDetails(year, month, monthName)
  );
  
  // Создаем карточку выбора: по регионам
  createOptionCard(
    'По регионам',
    '<i class="fas fa-map-marker-alt"></i>',
    'Анализ продаж по регионам Узбекистана с визуализацией географического распределения',
    () => showRegionDetails(year, month, monthName)
  );
  
  // Добавляем кнопку возврата
  container.append('button')
    .style('background', 'rgba(59, 130, 246, 0.2)')
    .style('color', '#60a5fa')
    .style('border', 'none')
    .style('padding', '10px 20px')
    .style('border-radius', '8px')
    .style('font-size', '0.9rem')
    .style('cursor', 'pointer')
    .style('transition', 'background 0.2s')
    .style('margin-top', '20px')
    .text('Вернуться к общему графику')
    .on('mouseover', function() {
      d3.select(this).style('background', 'rgba(59, 130, 246, 0.3)');
    })
    .on('mouseout', function() {
      d3.select(this).style('background', 'rgba(59, 130, 246, 0.2)');
    })
    .on('click', renderPeriodComparisonTable);
  
  // Добавляем стили Font Awesome для иконок
  const head = document.head || document.getElementsByTagName('head')[0];
  const fontAwesome = document.createElement('link');
  fontAwesome.rel = 'stylesheet';
  fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css';
  head.appendChild(fontAwesome);
};

const showCarModelDetails = (year, month, monthName) => {
  if (!mainChartRef.current) return;
  d3.selectAll('.chart-tooltip, .bar-tooltip, .model-tooltip').remove();
  
  // Очищаем контейнер
  mainChartRef.current.innerHTML = '';
  
  // Создаем основной контейнер
  const container = d3.select(mainChartRef.current)
    .append('div')
    .style('width', '100%')
    .style('background', 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)')
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
    .style('border-bottom', '1px solid rgba(59, 130, 246, 0.2)');
  
  // Добавляем иконку и анимированный заголовок
  const titleSection = header.append('div')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('gap', '12px');
    
  titleSection.append('div')
    .style('background', 'rgba(59, 130, 246, 0.2)')
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
    .style('color', '#f9fafb')
    .style('margin', '0')
    .html(`Аналитика продаж: <span style="background: linear-gradient(90deg, #60a5fa, #93c5fd); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${monthName}</span>`);
  
  // Улучшенные интерактивные кнопки
  const buttonGroup = header.append('div')
    .style('display', 'flex')
    .style('flex-wrap', 'wrap')
    .style('gap', '12px');
  
  // Кнопка возврата к выбору с улучшенным дизайном и анимацией
  const backButton = buttonGroup.append('button')
    .style('background', 'rgba(59, 130, 246, 0.15)')
    .style('color', '#60a5fa')
    .style('border', '1px solid rgba(59, 130, 246, 0.25)')
    .style('padding', '8px 15px')
    .style('border-radius', '8px')
    .style('font-size', '0.85rem')
    .style('font-weight', '500')
    .style('cursor', 'pointer')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('gap', '6px')
    .style('transition', 'all 0.2s ease-in-out')
    .html('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Выбор режима')
    .on('mouseover', function() {
      d3.select(this)
        .style('background', 'rgba(59, 130, 246, 0.25)')
        .style('transform', 'translateY(-2px)');
    })
    .on('mouseout', function() {
      d3.select(this)
        .style('background', 'rgba(59, 130, 246, 0.15)')
        .style('transform', 'translateY(0)');
    })
    .on('click', () => showSelectionOptions(year, month, monthName));
  
  // Кнопка возврата к общему обзору
  const overviewButton = buttonGroup.append('button')
    .style('background', 'rgba(16, 185, 129, 0.15)')
    .style('color', '#34d399')
    .style('border', '1px solid rgba(16, 185, 129, 0.25)')
    .style('padding', '8px 15px')
    .style('border-radius', '8px')
    .style('font-size', '0.85rem')
    .style('font-weight', '500')
    .style('cursor', 'pointer')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('gap', '6px')
    .style('transition', 'all 0.2s ease-in-out')
    .html('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> Общий обзор')
    .on('mouseover', function() {
      d3.select(this)
        .style('background', 'rgba(16, 185, 129, 0.25)')
        .style('transform', 'translateY(-2px)');
    })
    .on('mouseout', function() {
      d3.select(this)
        .style('background', 'rgba(16, 185, 129, 0.15)')
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
      .style('color', '#9ca3af')
      .style('font-size', '1.2rem')
      .text('Нет данных о моделях автомобилей за выбранный период');
    
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
    .style('background', 'rgba(30, 41, 59, 0.4)')
    .style('border', '1px solid rgba(59, 130, 246, 0.1)');
  
  // Рассчитываем общие показатели на основе реальных данных
  const totalSales = sortedModels.reduce((sum, model) => sum + model.totalSales, 0);
  const totalCount = sortedModels.reduce((sum, model) => {
    return sum + model.monthlyData.reduce((mSum, m) => mSum + (m.count || 0), 0);
  }, 0);
  const avgPrice = totalCount > 0 ? Math.round(totalSales / totalCount) : 0;
  
  // Добавляем информационные карточки с ключевыми показателями
  const createInfoCard = (title, value, subtitle, icon, color) => {
    const card = infoPanel.append('div')
      .style('background', `rgba(${color}, 0.1)`)
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
      .style('color', '#9ca3af')
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
      .style('color', '#f9fafb')
      .style('margin-bottom', '4px')
      .text(value);
    
    if (subtitle) {
      card.append('div')
        .style('font-size', isMobile ? '0.7rem' : '0.75rem')
        .style('color', '#9ca3af')
        .text(subtitle);
    }
  };
  
  // Создаем информационные карточки с реальными данными
  createInfoCard(
    'Общая сумма продаж',
    formatProfitCompact(totalSales),
    `${totalCount} автомобилей`,
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
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
  
  // Отображаем лидера продаж
  if (sortedModels.length > 0) {
    const topModel = sortedModels[0];
    const topModelCount = topModel.monthlyData.reduce((sum, m) => sum + (m.count || 0), 0);
    
    createInfoCard(
      'Лидер продаж',
      topModel.model_name,
      `${topModelCount} шт.`,
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>',
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
    .style('background', 'rgba(17, 24, 39, 0.4)')
    .style('border-radius', '12px')
    .style('padding', isMobile ? '12px' : '16px')
    .style('border', '1px solid rgba(59, 130, 246, 0.1)')
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
    .style('color', '#f9fafb')
    .style('margin', '0')
    .text(`Объем продаж по моделям`);
  
  const barChartFilters = barChartHeader.append('div')
    .style('display', 'flex')
    .style('gap', '8px');
  
  // Добавляем переключатели представления
  const viewOptions = [
    { id: 'sales', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6" y2="6"></line><line x1="6" y1="18" x2="6" y2="18"></line></svg>', label: 'Продажи' },
    { id: 'count', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>', label: 'Количество' }
  ];
  
  // Создаем группу кнопок для переключения режима просмотра
  const viewToggle = barChartFilters.append('div')
    .style('display', 'flex')
    .style('background', 'rgba(30, 41, 59, 0.5)')
    .style('border-radius', '6px')
    .style('padding', '2px');
  
  // Переменная для хранения текущего режима просмотра
  let viewMode = 'sales';
  
  viewOptions.forEach((option, i) => {
    viewToggle.append('button')
      .attr('id', `view-${option.id}`)
      .style('background', option.id === viewMode ? 'rgba(59, 130, 246, 0.4)' : 'transparent')
      .style('color', option.id === viewMode ? '#f9fafb' : '#9ca3af')
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
          .style('color', '#9ca3af');
        
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
        .style('fill', '#9ca3af')
        .style('font-size', '1rem')
        .text('Нет данных для отображения');
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
      .attr('stroke', 'rgba(75, 85, 99, 0.2)')
      .attr('stroke-dasharray', '3,3');
    
    // Добавляем оси с улучшенными стилями
    barChartSvg.append('g')
      .attr('transform', `translate(0,${barHeight - barMargin.bottom})`)
      .call(d3.axisBottom(barX)
        .ticks(5)
        .tickFormat(d => viewMode === 'sales' ? formatProfitCompact(d) : d3.format('~s')(d)))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text')
        .style('fill', '#9ca3af')
        .style('font-size', '0.7rem'));
    
    barChartSvg.append('g')
      .attr('transform', `translate(${barMargin.left},0)`)
      .call(d3.axisLeft(barY))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').remove())
      .call(g => g.selectAll('text')
        .style('fill', '#d1d5db')
        .style('font-size', isMobile ? '0.7rem' : '0.8rem')
        .style('font-weight', (d, i) => i === 0 ? 'bold' : 'normal'));
    
    // Создаем улучшенный тултип
    const barTooltip = d3.select('body').select('.model-tooltip');
    
    if (barTooltip.empty()) {
      d3.select('body').append('div')
        .attr('class', 'model-tooltip')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background', 'rgba(15, 23, 42, 0.95)')
        .style('color', '#f9fafb')
        .style('padding', '12px 15px')
        .style('border-radius', '8px')
        .style('font-size', '0.9rem')
        .style('box-shadow', '0 10px 25px rgba(0, 0, 0, 0.2)')
        .style('border', '1px solid rgba(59, 130, 246, 0.3)')
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
        <div style="border-bottom: 1px solid rgba(75, 85, 99, 0.3); margin-bottom: 8px; padding-bottom: 8px;">
          <div style="font-weight: bold; font-size: 1rem; margin-bottom: 4px;">${d.name}</div>
          <div style="font-size: 0.8rem; color: #9ca3af;">Нажмите для детального анализа</div>
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
            <div style="font-size: 0.75rem; color: #9ca3af;">Продажи</div>
            <div style="font-weight: bold;">${formatProfitCompact(d.sales)}</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: #9ca3af;">Количество</div>
            <div style="font-weight: bold;">${d.count} шт.</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: #9ca3af;">Средняя цена</div>
            <div style="font-weight: bold;">${formatProfitCompact(d.avgPrice)}</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: #9ca3af;">Доля</div>
            <div style="font-weight: bold; color: #60a5fa;">${percentage}%</div>
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
      .style('fill', '#f9fafb')
      .style('opacity', 0)
      .text(d => viewMode === 'sales' ? formatProfitCompact(d.value) : `${d.value} шт.`)
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
    .style('background', 'rgba(17, 24, 39, 0.4)')
    .style('border-radius', '12px')
    .style('padding', isMobile ? '12px' : '16px')
    .style('border', '1px solid rgba(59, 130, 246, 0.1)')
    .style('min-height', isMobile ? '300px' : 'auto');
  
  // Заголовок
  pieChartContainer.append('h3')
    .style('font-size', '1.1rem')
    .style('color', '#f9fafb')
    .style('margin-bottom', '15px')
    .style('text-align', 'center')
    .text('Структура продаж');
  
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
        name: 'Другие модели',
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
    .attr('stroke', '#111827')
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
      centerText.text('Общий объем')
        .style('font-size', '0.9rem');
        
      centerNumber.text(formatProfitCompact(totalSales));
      centerPercent.text('100%');
      
      // Восстанавливаем метки
      pieG.selectAll('.pie-label')
        .style('font-weight', 'normal')
        .style('fill', '#d1d5db');
    })
  
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
    .attr('fill', 'rgba(17, 24, 39, 0.7)')
    .attr('stroke', 'rgba(59, 130, 246, 0.2)')
    .attr('stroke-width', 1);
  
  const centerText = centerGroup.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '-1.2em')
    .style('font-size', '0.9rem')
    .style('fill', '#d1d5db')
    .style('transition', 'all 0.3s ease')
    .text('Общий объем');
  
  const centerNumber = centerGroup.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '0.4em')
    .style('font-size', isMobile ? '1.1rem' : '1.3rem')
    .style('font-weight', 'bold')
    .style('fill', '#f9fafb')
    .text(formatProfitCompact(totalSales));
  
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
    .style('fill', '#d1d5db')
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
    .style('background', 'rgba(17, 24, 39, 0.4)')
    .style('border-radius', '12px')
    .style('padding', isMobile ? '12px' : '16px')
    .style('border', '1px solid rgba(59, 130, 246, 0.1)')
    .style('display', 'flex')
    .style('flex-direction', 'column');
  
  metricsContainer.append('h3')
    .style('font-size', '1.1rem')
    .style('color', '#f9fafb')
    .style('margin-bottom', '15px')
    .style('text-align', 'center')
    .text('Ключевые показатели');
  
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
      .style('background', `rgba(${color}, 0.08)`)
      .style('border-radius', '10px')
      .style('padding', isMobile ? '12px' : '15px')
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('justify-content', 'center')
      .style('position', 'relative')
      .style('border', `1px solid rgba(${color}, 0.2)`)
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
      .style('color', '#9ca3af')
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
        .style('color', '#9ca3af')
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
      'Топ-модель',
      modelName,
      `${topModelCount} шт.`,
      '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>',
      '16, 185, 129'
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
      'Доходная модель',
      modelName,
      `${formatProfitCompact(topModelBySales.totalSales)}`,
      '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>',
      '236, 72, 153'
    );
  }
  // Добавляем подсказку о возможности интерактивности с улучшенным стилем
  container.append('div')
    .style('text-align', 'center')
    .style('margin-top', '12px')
    .style('padding', '10px')
    .style('background', 'rgba(17, 24, 39, 0.5)')
    .style('border-radius', '8px')
    .style('border', '1px dashed rgba(59, 130, 246, 0.3)')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('justify-content', 'center')
    .style('gap', '8px')
    .html(`
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 16v-4"></path>
        <path d="M12 8h.01"></path>
      </svg>
      <span style="color: #9ca3af; font-size: 0.9rem;">Нажмите на любую модель для анализа распределения по регионам</span>
    `);
  
  
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
    .style('background', 'linear-gradient(135deg, #1f2937 0%, #111827 100%)')
    .style('border-radius', '1rem')
    .style('padding', '20px');
  
  // Добавляем логирование для отладки
  console.group('RegionDetails Debug');
  console.log('Вызов функции showRegionDetails с параметрами:', {year, month, monthName});
  
  // Заголовок и навигация
  const header = container.append('div')
    .style('display', 'flex')
    .style('justify-content', 'space-between')
    .style('align-items', 'center')
    .style('margin-bottom', '20px');
  
  header.append('h2')
    .style('font-size', '1.4rem')
    .style('font-weight', 'bold')
    .style('color', '#f9fafb')
    .html(`Анализ региональных продаж: <span style="color: #60a5fa;">${monthName}</span>`);
  
  const buttonGroup = header.append('div')
    .style('display', 'flex')
    .style('gap', '10px');
  
  buttonGroup.append('button')
    .style('background', 'rgba(16, 185, 129, 0.2)')
    .style('color', '#34d399')
    .style('border', 'none')
    .style('padding', '8px 15px')
    .style('border-radius', '8px')
    .style('font-size', '0.85rem')
    .style('cursor', 'pointer')
    .text('← К общему графику')
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
        .style('color', '#9ca3af')
        .html(`
          <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          <span class="ml-3">Загрузка данных о регионах...</span>
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
    const response = await fetch(`https://uzavtosalon.uz/b/dashboard/infos&${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `begin_date=${startDate}&end_date=${endDate}`
    });
    
    if (!response.ok) {
      throw new Error(`Ошибка HTTP: ${response.status}`);
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
                region_name: region.region_name || `Регион ${regionId}`,
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
      
      // Логируем для отладки
      console.log(`Ищем месяц ${monthStr} в данных`);
      
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
      console.log("Не найдено данных о регионах в API-ответе");
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
      .style('background', 'rgba(239, 68, 68, 0.1)')
      .style('border', '1px solid rgba(239, 68, 68, 0.3)')
      .style('border-radius', '6px')
      .style('margin-top', '10px')
      .text(`Ошибка при загрузке данных: ${error.message}`);
    
    return null;
  }
};
  
  // Функция для отображения таблицы статистики продаж
const renderDailySalesTable = () => {
  // Создаем контейнер для таблицы в нижней части страницы
  const tableContainer = document.createElement('div');
  tableContainer.className = 'mt-6 bg-gray-800/80 shadow-xl backdrop-blur-sm rounded-xl p-5 border border-gray-700/50';
  
  // Заголовок секции
  const header = document.createElement('div');
  header.className = 'flex justify-between items-center mb-4';
  
  const headerTitle = document.createElement('h2');
  headerTitle.className = 'text-xl md:text-2xl font-bold text-white bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent';
  headerTitle.textContent = 'Детальная статистика продаж по дням';
  
  const controlPanel = document.createElement('div');
  controlPanel.className = 'flex items-center gap-2';
  
  // Добавляем элементы выбора дат
  const dateRangeContainer = document.createElement('div');
  dateRangeContainer.className = 'flex items-center gap-3';
  
  // Создаем элементы выбора дат
  const startDateContainer = document.createElement('div');
  startDateContainer.className = 'relative';
  
  const startDateInput = document.createElement('input');
  startDateInput.type = 'date';
  startDateInput.className = 'bg-gray-700/80 text-white px-3 py-1.5 rounded-md text-sm border border-gray-600/50 w-36';
  startDateInput.value = formatDateForInput(apiStartDate);
  startDateInput.addEventListener('change', (e) => {
    tableDateStart = formatDateFromInput(e.target.value);
  });
  
  startDateContainer.appendChild(startDateInput);
  
  const dateRangeSeparator = document.createElement('span');
  dateRangeSeparator.className = 'text-gray-400';
  dateRangeSeparator.textContent = '—';
  
  const endDateContainer = document.createElement('div');
  endDateContainer.className = 'relative';
  
  const endDateInput = document.createElement('input');
  endDateInput.type = 'date';
  endDateInput.className = 'bg-gray-700/80 text-white px-3 py-1.5 rounded-md text-sm border border-gray-600/50 w-36';
  endDateInput.value = formatDateForInput(apiEndDate);
  endDateInput.addEventListener('change', (e) => {
    tableDateEnd = formatDateFromInput(e.target.value);
  });
  
  endDateContainer.appendChild(endDateInput);
  dateRangeContainer.appendChild(startDateContainer);
  dateRangeContainer.appendChild(dateRangeSeparator);
  dateRangeContainer.appendChild(endDateContainer);
  
  // Кнопка обновления данных
  const refreshButton = document.createElement('button');
  refreshButton.className = 'bg-blue-600 hover:bg-blue-700 transition-colors text-white px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-1';
  refreshButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"></path>
    </svg>
    Загрузить данные
  `;
  refreshButton.addEventListener('click', fetchDailySalesData);
  
  controlPanel.appendChild(dateRangeContainer);
  controlPanel.appendChild(refreshButton);
  
  header.appendChild(headerTitle);
  header.appendChild(controlPanel);
  tableContainer.appendChild(header);
  
  // Контейнер для таблицы с возможностью горизонтальной прокрутки
  const tableWrapper = document.createElement('div');
  tableWrapper.className = 'overflow-x-auto';
  
  // Индикатор загрузки
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'flex justify-center items-center py-10';
  loadingIndicator.innerHTML = `
    <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    <span class="ml-3 text-gray-300">Загрузка данных...</span>
  `;
  
  // Сообщение при отсутствии данных
  const noDataMessage = document.createElement('div');
  noDataMessage.className = 'flex flex-col items-center justify-center py-10 text-gray-400';
  noDataMessage.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mb-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    <p class="text-lg">Данные отсутствуют для выбранного периода</p>
    <p class="text-sm mt-1">Выберите другой диапазон дат или обновите данные</p>
  `;
  noDataMessage.style.display = 'none';
  
  // Содержимое таблицы (будет заполнено при загрузке данных)
  const tableSalesContent = document.createElement('div');
  tableSalesContent.id = 'daily-sales-table-content';
  tableSalesContent.className = 'hidden'; // Скрыто до загрузки данных
  
  tableWrapper.appendChild(loadingIndicator);
  tableWrapper.appendChild(noDataMessage);
  tableWrapper.appendChild(tableSalesContent);
  tableContainer.appendChild(tableWrapper);
  
  // Добавляем таблицу в DOM
  document.querySelector('.min-h-screen').appendChild(tableContainer);
  
  // Инициализируем переменные для хранения дат и данных
  let tableDateStart = apiStartDate;
  let tableDateEnd = apiEndDate;
  let salesData = {
    all: [],
    retail: [],
    wholesale: []
  };
  
  // Функция для загрузки данных о продажах по дням

  
  // Функция для проверки наличия данных
  function hasData(salesData) {
    return salesData.all.length > 0 || salesData.retail.length > 0 || salesData.wholesale.length > 0;
  }
  
  // Функция для отображения данных в таблице
  function renderSalesTable(data) {
    // Получаем элемент для таблицы
    const tableContainer = document.getElementById('daily-sales-table-content');
    tableContainer.innerHTML = '';
    
    // Создаем структуру таблицы
    const table = document.createElement('table');
    table.className = 'min-w-full divide-y divide-gray-700 table-fixed';
    
    // Создаем заголовок таблицы
    const thead = document.createElement('thead');
    thead.className = 'bg-gray-700/50';
    
    const headerRow = document.createElement('tr');
    
    // Заголовки столбцов
    const headers = [
      { text: 'Дата', className: 'w-32' },
      { text: 'Общие продажи', className: 'w-44' },
      { text: 'Розничные продажи', className: 'w-44' },
      { text: 'Оптовые продажи', className: 'w-44' },
      { text: 'Модели (розница)', className: '' }
    ];
    
    headers.forEach(header => {
      const th = document.createElement('th');
      th.scope = 'col';
      th.className = `px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider ${header.className}`;
      th.textContent = header.text;
      headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Создаем тело таблицы
    const tbody = document.createElement('tbody');
    tbody.className = 'bg-gray-800 divide-y divide-gray-700';
    
    // Создаем объединенный набор дат из всех трех источников
    const allDates = new Set();
    
    // Функция для получения даты из строки формата YYYY-MM-DD
    const getDateFromString = (dateStr) => {
      if (!dateStr) return null;
      return dateStr;
    };
    
    // Собираем все даты
    data.all.forEach(item => {
      const date = getDateFromString(item.day);
      if (date) allDates.add(date);
    });
    
    data.retail.forEach(item => {
      const date = getDateFromString(item.day);
      if (date) allDates.add(date);
    });
    
    data.wholesale.forEach(item => {
      const date = getDateFromString(item.day);
      if (date) allDates.add(date);
    });
    
    // Преобразуем Set в массив и сортируем даты
    const sortedDates = Array.from(allDates).sort((a, b) => {
      return new Date(a) - new Date(b);
    });
    
    // Создаем индексы данных по датам для быстрого доступа
    const allSalesIndex = {};
    const retailSalesIndex = {};
    const wholesaleSalesIndex = {};
    
    data.all.forEach(item => {
      allSalesIndex[item.day] = item;
    });
    
    data.retail.forEach(item => {
      retailSalesIndex[item.day] = item;
    });
    
    data.wholesale.forEach(item => {
      wholesaleSalesIndex[item.day] = item;
    });
    
    // Для каждой даты создаем строку таблицы
    sortedDates.forEach((date, index) => {
      const row = document.createElement('tr');
      row.className = index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750';
      
      // Форматируем дату из YYYY-MM-DD в DD.MM.YYYY
      const displayDate = formatDisplayDate(date);
      
      // Получаем данные для текущей даты
      const allSalesData = allSalesIndex[date] || { amount: 0, all_count: 0 };
      const retailSalesData = retailSalesIndex[date] || { amount: 0, all_count: 0, models: [] };
      const wholesaleSalesData = wholesaleSalesIndex[date] || { amount: 0, all_count: 0 };
      
      // Ячейка даты
      const dateCell = document.createElement('td');
      dateCell.className = 'px-3 py-4 whitespace-nowrap';
      dateCell.innerHTML = `
        <div class="text-sm font-medium text-white">${displayDate}</div>
        <div class="text-xs text-gray-400">${getDayOfWeek(date)}</div>
      `;
      row.appendChild(dateCell);
      
      // Ячейка общих продаж
      const allSalesCell = document.createElement('td');
      allSalesCell.className = 'px-3 py-4 whitespace-nowrap';
      allSalesCell.innerHTML = `
        <div class="text-sm font-medium text-white">${formatProfitCompact(allSalesData.amount)}</div>
        <div class="text-xs text-gray-400">${allSalesData.all_count || 0} шт.</div>
      `;
      row.appendChild(allSalesCell);
      
      // Ячейка розничных продаж
      const retailSalesCell = document.createElement('td');
      retailSalesCell.className = 'px-3 py-4 whitespace-nowrap';
      retailSalesCell.innerHTML = `
        <div class="text-sm font-medium text-blue-400">${formatProfitCompact(retailSalesData.amount)}</div>
        <div class="text-xs text-gray-400">${retailSalesData.all_count || 0} шт.</div>
      `;
      row.appendChild(retailSalesCell);
      
      // Ячейка оптовых продаж
      const wholesaleSalesCell = document.createElement('td');
      wholesaleSalesCell.className = 'px-3 py-4 whitespace-nowrap';
      wholesaleSalesCell.innerHTML = `
        <div class="text-sm font-medium text-purple-400">${formatProfitCompact(wholesaleSalesData.amount)}</div>
        <div class="text-xs text-gray-400">${wholesaleSalesData.all_count || 0} шт.</div>
      `;
      row.appendChild(wholesaleSalesCell);
      
      // Ячейка с моделями розничных продаж
      const modelsCell = document.createElement('td');
      modelsCell.className = 'px-3 py-4';
      
      // Проверяем наличие данных о моделях
      if (retailSalesData.models && retailSalesData.models.length > 0) {
        const modelsContainer = document.createElement('div');
        modelsContainer.className = 'flex flex-wrap gap-2';
        
        // Отображаем до 3 моделей, остальные скрываем под кнопкой "Еще"
        const visibleModels = retailSalesData.models.slice(0, 3);
        const hiddenModels = retailSalesData.models.slice(3);
        
        // Создаем чипы для видимых моделей
        visibleModels.forEach(model => {
          const modelChip = createModelChip(model);
          modelsContainer.appendChild(modelChip);
        });
        
        // Если есть скрытые модели, добавляем кнопку "Еще"
        if (hiddenModels.length > 0) {
          const moreButton = document.createElement('button');
          moreButton.className = 'py-1 px-2 text-xs rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors';
          moreButton.textContent = `Еще ${hiddenModels.length}...`;
          
          // Обработчик клика для отображения всех моделей
          moreButton.addEventListener('click', () => {
            // Создаем модальное окно с полным списком моделей
            showModelsModal(date, displayDate, retailSalesData.models);
          });
          
          modelsContainer.appendChild(moreButton);
        }
        
        modelsCell.appendChild(modelsContainer);
      } else {
        // Сообщение при отсутствии данных о моделях
        modelsCell.innerHTML = `<span class="text-sm text-gray-500">Нет данных о моделях</span>`;
      }
      
      row.appendChild(modelsCell);
      tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    
    // Создаем итоговую строку с суммарными данными
    const totalRow = createTotalRow(data);
    tbody.appendChild(totalRow);
  }
  
  // Функция для создания чипа модели
  function createModelChip(model) {
    const chip = document.createElement('div');
    chip.className = 'bg-blue-600/20 text-blue-300 text-xs rounded-full py-1 px-2 flex items-center';
    
    // Название и количество
    chip.innerHTML = `
      <span class="mr-1">${model.model_name || 'Модель'}</span>
      <span class="text-xs bg-blue-600/40 rounded-full px-1.5">${model.all_count || 0}</span>
    `;
    
    // Добавляем тултип с информацией
    chip.title = `${model.model_name}: ${formatProfitCompact(model.amount)} (${model.all_count} шт.)`;
    
    return chip;
  }
  
  // Функция для создания итоговой строки
  function createTotalRow(data) {
    const totalRow = document.createElement('tr');
    totalRow.className = 'bg-gray-700/30 font-medium';
    
    // Ячейка с надписью "Итого"
    const totalLabelCell = document.createElement('td');
    totalLabelCell.className = 'px-3 py-4 whitespace-nowrap text-sm text-white';
    totalLabelCell.textContent = 'ИТОГО:';
    totalRow.appendChild(totalLabelCell);
    
    // Функция для расчета общей суммы и количества
    const calculateTotal = (dataArray) => {
      return dataArray.reduce((acc, item) => {
        return {
          amount: acc.amount + (parseFloat(item.amount) || 0),
          all_count: acc.all_count + (parseInt(item.all_count) || 0)
        };
      }, { amount: 0, all_count: 0 });
    };
    
    // Расчет итогов по всем категориям
    const allTotal = calculateTotal(data.all);
    const retailTotal = calculateTotal(data.retail);
    const wholesaleTotal = calculateTotal(data.wholesale);
    
    // Ячейка итогов общих продаж
    const allTotalCell = document.createElement('td');
    allTotalCell.className = 'px-3 py-4 whitespace-nowrap';
    allTotalCell.innerHTML = `
      <div class="text-sm font-bold text-white">${formatProfitCompact(allTotal.amount)}</div>
      <div class="text-xs text-gray-300">${allTotal.all_count} шт.</div>
    `;
    totalRow.appendChild(allTotalCell);
    
    // Ячейка итогов розничных продаж
    const retailTotalCell = document.createElement('td');
    retailTotalCell.className = 'px-3 py-4 whitespace-nowrap';
    retailTotalCell.innerHTML = `
      <div class="text-sm font-bold text-blue-300">${formatProfitCompact(retailTotal.amount)}</div>
      <div class="text-xs text-gray-300">${retailTotal.all_count} шт.</div>
    `;
    totalRow.appendChild(retailTotalCell);
    
    // Ячейка итогов оптовых продаж
    const wholesaleTotalCell = document.createElement('td');
    wholesaleTotalCell.className = 'px-3 py-4 whitespace-nowrap';
    wholesaleTotalCell.innerHTML = `
      <div class="text-sm font-bold text-purple-300">${formatProfitCompact(wholesaleTotal.amount)}</div>
      <div class="text-xs text-gray-300">${wholesaleTotal.all_count} шт.</div>
    `;
    totalRow.appendChild(wholesaleTotalCell);
    
    // Пустая ячейка для соблюдения структуры
    const emptyCell = document.createElement('td');
    totalRow.appendChild(emptyCell);
    
    return totalRow;
  }
  
  // Функция для отображения модального окна со всеми моделями
  function showModelsModal(date, displayDate, models) {
    // Создаем затемненный фон
    const modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    document.body.appendChild(modalBackdrop);
    
    // Создаем модальное окно
    const modalContent = document.createElement('div');
    modalContent.className = 'bg-gray-800 rounded-xl shadow-xl p-5 max-w-3xl w-full max-h-[80vh] flex flex-col border border-gray-700';
    
    // Заголовок модального окна
    const modalHeader = document.createElement('div');
    modalHeader.className = 'flex justify-between items-center mb-4 pb-3 border-b border-gray-700';
    
    const modalTitle = document.createElement('h3');
    modalTitle.className = 'text-lg font-bold text-white';
    modalTitle.textContent = `Модели автомобилей за ${displayDate}`;
    
    const closeButton = document.createElement('button');
    closeButton.className = 'text-gray-400 hover:text-white';
    closeButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    `;
    closeButton.addEventListener('click', () => {
      document.body.removeChild(modalBackdrop);
    });
    
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);
    modalContent.appendChild(modalHeader);
    
    // Содержимое модального окна
    const modalBody = document.createElement('div');
    modalBody.className = 'overflow-y-auto flex-grow';
    
    // Проверяем наличие моделей
    if (models && models.length > 0) {
      // Создаем таблицу для отображения данных о моделях
      const modelsTable = document.createElement('table');
      modelsTable.className = 'min-w-full divide-y divide-gray-700';
      
      // Заголовок таблицы
      const tableHead = document.createElement('thead');
      tableHead.className = 'bg-gray-700/50';
      
      const headerRow = document.createElement('tr');
      
      // Заголовки столбцов
      const headers = [
        { text: '№', className: 'w-10' },
        { text: 'Модель', className: 'w-1/3' },
        { text: 'Продажи', className: 'w-1/5' },
        { text: 'Количество', className: 'w-1/5' },
        { text: 'Средняя цена', className: 'w-1/5' }
      ];
      
      headers.forEach(header => {
        const th = document.createElement('th');
        th.scope = 'col';
        th.className = `px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider ${header.className}`;
        th.textContent = header.text;
        headerRow.appendChild(th);
      });
      
      tableHead.appendChild(headerRow);
      modelsTable.appendChild(tableHead);
      
      // Тело таблицы
      const tableBody = document.createElement('tbody');
      tableBody.className = 'bg-gray-800 divide-y divide-gray-700';
      
      // Сортируем модели по сумме продаж (от большей к меньшей)
      const sortedModels = [...models].sort((a, b) => {
        return (parseFloat(b.amount) || 0) - (parseFloat(a.amount) || 0);
      });
      
      // Для каждой модели создаем строку
      sortedModels.forEach((model, index) => {
        const row = document.createElement('tr');
        row.className = index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750';
        
        // Номер по порядку
        const indexCell = document.createElement('td');
        indexCell.className = 'px-3 py-3 whitespace-nowrap text-sm text-gray-300';
        indexCell.textContent = index + 1;
        row.appendChild(indexCell);
        
        // Название модели
        const nameCell = document.createElement('td');
        nameCell.className = 'px-3 py-3 whitespace-nowrap';
        nameCell.innerHTML = `
          <div class="text-sm font-medium text-white">${model.model_name || 'Модель'}</div>
          <div class="text-xs text-gray-400">${model.model_id || ''}</div>
        `;
        row.appendChild(nameCell);
        
        // Сумма продаж
        const amountCell = document.createElement('td');
        amountCell.className = 'px-3 py-3 whitespace-nowrap text-sm text-blue-400';
        amountCell.textContent = formatProfitCompact(model.amount);
        row.appendChild(amountCell);
        
        // Количество
        const countCell = document.createElement('td');
        countCell.className = 'px-3 py-3 whitespace-nowrap text-sm text-white';
        countCell.textContent = `${model.all_count || 0} шт.`;
        row.appendChild(countCell);
        
        // Средняя цена
        const avgPriceCell = document.createElement('td');
        avgPriceCell.className = 'px-3 py-3 whitespace-nowrap text-sm text-green-400';
        const avgPrice = model.all_count > 0 ? model.amount / model.all_count : 0;
        avgPriceCell.textContent = formatProfitCompact(avgPrice);
        row.appendChild(avgPriceCell);
        
        tableBody.appendChild(row);
      });
      
      modelsTable.appendChild(tableBody);
      modalBody.appendChild(modelsTable);
    } else {
      // Сообщение при отсутствии данных
      const noDataMessage = document.createElement('div');
      noDataMessage.className = 'flex flex-col items-center justify-center py-10 text-gray-400';
      noDataMessage.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mb-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-lg">Нет данных о моделях</p>
      `;
      modalBody.appendChild(noDataMessage);
    }
    
    modalContent.appendChild(modalBody);
    
    // Футер модального окна
    const modalFooter = document.createElement('div');
    modalFooter.className = 'pt-3 mt-3 border-t border-gray-700 flex justify-end';
    
    const closeModalButton = document.createElement('button');
    closeModalButton.className = 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded';
    closeModalButton.textContent = 'Закрыть';
    closeModalButton.addEventListener('click', () => {
      document.body.removeChild(modalBackdrop);
    });
    
    modalFooter.appendChild(closeModalButton);
    modalContent.appendChild(modalFooter);
    
    modalBackdrop.appendChild(modalContent);
    
    // Закрытие модального окна при клике на фон
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        document.body.removeChild(modalBackdrop);
      }
    });
  }
  
  // Функция для форматирования даты YYYY-MM-DD в DD.MM.YYYY
  function formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  
  // Функция для получения дня недели
  function getDayOfWeek(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    return days[date.getDay()];
  }
  
  // Загружаем данные при первой отрисовке компонента
  fetchDailySalesData();
};
  
  // Если этих функций нет, добавьте их
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  
  const parts = dateString.split('.');
  if (parts.length !== 3) return '';
  
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

const formatDateFromInput = (dateString) => {
  if (!dateString) return '';
  
  const parts = dateString.split('-');
  if (parts.length !== 3) return '';
  
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
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
        .style('color', '#9ca3af')
        .text('Нет данных о регионах для отображения');
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
      .style('height', 'calc(100% - 100px)'); // Уменьшаем отступ для табов

    // Создаем верхнюю секцию для таблицы регионов и круговой диаграммы
    const topSection = grid.append('div')
      .style('display', 'grid')
      .style('grid-template-columns', 'minmax(0, 3fr) minmax(0, 2fr)')
      .style('gap', '20px');

    // Левая колонка - таблица рейтинга регионов
    const regionRankingContainer = topSection.append('div')
      .style('background', 'rgba(17, 24, 39, 0.4)')
      .style('border-radius', '12px')
      .style('padding', '15px')
      .style('border', '1px solid rgba(59, 130, 246, 0.1)')
      .style('display', 'flex')
      .style('flex-direction', 'column');

    regionRankingContainer.append('h3')
      .style('font-size', '1.1rem')
      .style('color', '#f9fafb')
      .style('margin-bottom', '10px')
      .style('text-align', 'center')
      .text(`Рейтинг и доля регионов: ${monthName}`);
    
    // Создаем таблицу с рейтингом регионов
    const rankingTable = regionRankingContainer.append('div')
      .style('flex-grow', '1')
      .style('overflow-y', 'auto')
      .style('background', 'rgba(17, 24, 39, 0.6)')
      .style('border-radius', '8px')
      .style('padding', '5px');

    // Заголовок таблицы
    const rankingHeader = rankingTable.append('div')
      .style('display', 'grid')
      .style('grid-template-columns', '8% 32% 20% 15% 25%')
      .style('padding', '10px')
      .style('background', 'rgba(30, 41, 59, 0.8)')
      .style('border-radius', '8px 8px 0 0')
      .style('position', 'sticky')
      .style('top', '0')
      .style('z-index', '1');

    rankingHeader.append('div').style('font-size', '0.85rem').style('font-weight', 'bold').style('color', '#f9fafb').text('№');
    rankingHeader.append('div').style('font-size', '0.85rem').style('font-weight', 'bold').style('color', '#f9fafb').text('Регион');
    rankingHeader.append('div').style('font-size', '0.85rem').style('font-weight', 'bold').style('color', '#f9fafb').style('text-align', 'center').text('Продажи');
    rankingHeader.append('div').style('font-size', '0.85rem').style('font-weight', 'bold').style('color', '#f9fafb').style('text-align', 'center').text('Контракты');
    rankingHeader.append('div').style('font-size', '0.85rem').style('font-weight', 'bold').style('color', '#f9fafb').style('text-align', 'center').text('Доля рынка');

    // Строки таблицы с анимацией
    regions.forEach((region, i) => {
      const marketShare = (region.sales / totalSales) * 100;
      console.log(`Регион #${i+1}: ${region.name}, Продажи: ${region.sales}, Кол-во: ${region.count}, Доля: ${marketShare.toFixed(1)}%`);
      
      const backgroundColor = i % 2 === 0 ? 'rgba(30, 41, 59, 0.3)' : 'rgba(30, 41, 59, 0.5)';
      
      const row = rankingTable.append('div')
        .style('display', 'grid')
        .style('grid-template-columns', '8% 32% 20% 15% 25%')
        .style('padding', '10px 8px')
        .style('background', backgroundColor)
        .style('border-left', i < 3 ? `3px solid ${d3.interpolateReds(0.3 + i * 0.2)}` : 'none')
        .style('cursor', 'pointer')
        .style('transition', 'all 0.2s')
        .on('mouseover', function() { d3.select(this).style('background', 'rgba(59, 130, 246, 0.2)'); })
        .on('mouseout', function() { d3.select(this).style('background', backgroundColor); });
      
      // Номер
      row.append('div')
        .style('font-size', '0.85rem')
        .style('color', '#f9fafb')
        .style('font-weight', 'bold')
        .style('display', 'flex')
        .style('align-items', 'center')
        .text(i + 1);
      
      // Имя региона
      row.append('div')
        .style('font-size', '0.85rem')
        .style('color', '#f9fafb')
        .style('font-weight', i < 3 ? 'bold' : 'normal')
        .style('display', 'flex')
        .style('align-items', 'center')
        .text(region.name);
      
      // Сумма продаж
      row.append('div')
        .style('font-size', '0.85rem')
        .style('color', '#f9fafb')
        .style('text-align', 'center')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('justify-content', 'center')
        .text(formatProfitCompact(region.sales));
      
      // Количество продаж (контракты) - прямо из all_count
      row.append('div')
        .style('font-size', '0.85rem')
        .style('color', '#f9fafb')
        .style('text-align', 'center')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('justify-content', 'center')
        .text(region.count + ' шт.');
      
      // Доля рынка с графиком
      const marketShareCell = row.append('div')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('gap', '10px');
      
      // Текст доли рынка
      marketShareCell.append('span')
        .style('font-size', '0.85rem')
        .style('color', '#f9fafb')
        .style('min-width', '45px')
        .text(`${marketShare.toFixed(1)}%`);
      
      // График доли
      const barContainer = marketShareCell.append('div')
        .style('flex-grow', '1')
        .style('height', '8px')
        .style('background', 'rgba(75, 85, 99, 0.3)')
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
      .style('background', 'rgba(17, 24, 39, 0.4)')
      .style('border-radius', '12px')
      .style('padding', '15px')
      .style('border', '1px solid rgba(59, 130, 246, 0.1)');
    
    pieChartContainer.append('h3')
      .style('font-size', '1.1rem')
      .style('color', '#f9fafb')
      .style('margin-bottom', '15px')
      .style('text-align', 'center')
      .text(`Структура продаж по регионам: ${monthName}`);
    
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
      pieData.push({ name: 'Другие регионы', sales: otherSales, count: otherCount });
      console.log(`Некоторые регионы объединены в "Другие регионы": ${regions.length - (maxRegionsInPie - 1)} регионов`);
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
        .padAngle(0.03); // Добавляем небольшой отступ между секторами
      
      const arc = d3.arc()
        .innerRadius(pieRadius * 0.4) // Больший внутренний радиус для пончика
        .outerRadius(pieRadius * 0.9)
        .cornerRadius(6); // Скругление углов секторов
      
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
        .attr('stroke', '#111827')
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
          centerCount.text(`${d.data.count} шт.`);
          
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
          centerText.text('Общий объем');
          centerNumber.text(formatProfitCompact(total));
          centerPercent.text('100%');
          centerCount.text(`${totalCount} шт.`);
          
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
        .style('fill', '#d1d5db')
        .text('Общий объем');
      
      const centerNumber = pieG.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0em')
        .style('font-size', '1.2rem')
        .style('font-weight', 'bold')
        .style('fill', '#f9fafb')
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
        .style('fill', '#9ca3af')
        .text(`${totalCount} шт.`);
      
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
          centerCount.text(`${d.data.count} шт.`);
          
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
          centerText.text('Общий объем');
          centerNumber.text(formatProfitCompact(total));
          centerPercent.text('100%');
          centerCount.text(`${totalCount} шт.`);
          
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
        .style('fill', '#f9fafb')
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
      .style('background', 'rgba(30, 41, 59, 0.5)')
      .style('border-radius', '8px')
      .style('padding', '12px 15px')
      .style('border', '1px solid rgba(59, 130, 246, 0.1)');
    
    // Добавляем заголовок
    rangeSelector.append('div')
      .style('color', '#f9fafb')
      .style('font-weight', 'bold')
      .style('font-size', '0.9rem')
      .text('Сравнение продаж регионов:');
    
    // Контейнер для селекторов
    const selectorsContainer = rangeSelector.append('div')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('gap', '10px');
    
    // От какого месяца
    selectorsContainer.append('span')
      .style('color', '#9ca3af')
      .style('font-size', '0.85rem')
      .text('От:');
    
    const startMonthSelect = selectorsContainer.append('select')
      .style('background', 'rgba(17, 24, 39, 0.7)')
      .style('color', '#f9fafb')
      .style('border', '1px solid rgba(75, 85, 99, 0.5)')
      .style('border-radius', '6px')
      .style('padding', '6px 10px')
      .style('font-size', '0.85rem')
      .style('cursor', 'pointer');
    
    // До какого месяца
    selectorsContainer.append('span')
      .style('color', '#9ca3af')
      .style('font-size', '0.85rem')
      .text('До:');
    
    const endMonthSelect = selectorsContainer.append('select')
      .style('background', 'rgba(17, 24, 39, 0.7)')
      .style('color', '#f9fafb')
      .style('border', '1px solid rgba(75, 85, 99, 0.5)')
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
      .style('background', 'rgba(16, 185, 129, 0.2)')
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
      .html('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>Применить')
      .on('mouseover', function() {
        d3.select(this)
          .style('background', 'rgba(16, 185, 129, 0.3)')
          .style('color', '#f9fafb');
      })
      .on('mouseout', function() {
        d3.select(this)
          .style('background', 'rgba(16, 185, 129, 0.2)')
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
      .style('background', 'rgba(17, 24, 39, 0.4)')
      .style('border-radius', '12px')
      .style('padding', '15px')
      .style('border', '1px solid rgba(59, 130, 246, 0.1)');
   
    compareChartContainer.append('h3')
      .style('font-size', '1.1rem')
      .style('color', '#f9fafb')
      .style('margin-bottom', '15px')
      .style('text-align', 'center')
      .text(`Сравнение региональных показателей`);
    
    // Добавляем индикатор загрузки в контейнер для сравнения
    compareChartContainer.append('div')
      .attr('class', 'comparison-loader')
      .style('display', 'flex')
      .style('justify-content', 'center')
      .style('align-items', 'center')
      .style('height', '100px')
      .style('color', '#9ca3af')
      .html(`
        <div style="width: 25px; height: 25px; border-radius: 50%; border: 2px solid rgba(59, 130, 246, 0.2); border-top-color: #3b82f6; animation: spin 1s linear infinite;"></div>
        <span style="margin-left: 10px;">Загрузка данных для сравнения...</span>
      `);
    
    // Возвращаем список месяцев, чтобы его можно было использовать в инициации сравнения
    return selectableMonths;
  };
  
  // Функция для обновления данных сравнения по выбранному диапазону
// Функция для обновления данных сравнения по выбранному диапазону
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
      .text('Ошибка: не удалось получить данные о доступных периодах');
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
      .style('color', '#9ca3af')
      .text('Выберите периоды для сравнения');
    return;
  }
  
  // Формируем названия периодов
  const startPeriodName = `${MONTHS[startMonthData.month-1]} ${startMonthData.year}`;
  const endPeriodName = `${MONTHS[endMonthData.month-1]} ${endMonthData.year}`;
  
  // Заголовок с периодами сравнения
  comparisonContainer.append('h3')
    .style('font-size', '1.1rem')
    .style('color', '#f9fafb')
    .style('margin-bottom', '15px')
    .style('text-align', 'center')
    .text(`Сравнение: ${startPeriodName} vs ${endPeriodName}`);
  
  // Индикатор загрузки
  const loader = comparisonContainer.append('div')
    .style('display', 'flex')
    .style('justify-content', 'center')
    .style('align-items', 'center')
    .style('height', '150px')
    .style('color', '#9ca3af');
    
  const spinnerSize = 40;
  loader.append('div')
    .style('width', `${spinnerSize}px`)
    .style('height', `${spinnerSize}px`)
    .style('border-radius', '50%')
    .style('border', '3px solid rgba(59, 130, 246, 0.2)')
    .style('border-top-color', '#3b82f6')
    .style('animation', 'spin 1s linear infinite')
    .style('margin-right', '10px');
  
  loader.append('div')
    .text('Обработка данных для сравнения...');
  
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
    const startPeriodResponse = await fetch(`https://uzavtosalon.uz/b/dashboard/infos&${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `begin_date=${startPeriodStartDate}&end_date=${startPeriodEndDate}`
    });
    
    if (!startPeriodResponse.ok) {
      throw new Error(`Ошибка HTTP при запросе данных начального периода: ${startPeriodResponse.status}`);
    }
    
    const startPeriodData = await startPeriodResponse.json();
    console.log("Данные начального периода:", startPeriodData);
    
    // Получаем данные для конечного периода
    console.log(`Запрос к API для конечного периода: ${endpoint}`);
    const endPeriodResponse = await fetch(`https://uzavtosalon.uz/b/dashboard/infos&${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `begin_date=${endPeriodStartDate}&end_date=${endPeriodEndDate}`
    });
    
    if (!endPeriodResponse.ok) {
      throw new Error(`Ошибка HTTP при запросе данных конечного периода: ${endPeriodResponse.status}`);
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
        console.error("Не удалось найти данные о регионах в ответе API");
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
        const name = region.region_name || 'Неизвестный регион';
        const sales = parseFloat(region.amount || 0);
        const count = parseInt(region.all_count || 0, 10);
        
        return { id, name, sales, count };
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
        .style('color', '#9ca3af')
        .text('Нет данных для сравнения за выбранный период');
      return;
    }
    
    // Объединяем данные для сравнения в единую структуру
    const regionMap = new Map();
    
    // Сначала добавляем регионы из конечного периода
    processedEndRegions.forEach(region => {
      regionMap.set(region.id, {
        name: region.name,
        currentSales: region.sales,
        currentCount: region.count,
        previousSales: 0,
        previousCount: 0
      });
    });
    
    // Затем добавляем или обновляем из начального периода
    processedStartRegions.forEach(region => {
      if (regionMap.has(region.id)) {
        const existingRegion = regionMap.get(region.id);
        existingRegion.previousSales = region.sales;
        existingRegion.previousCount = region.count;
      } else {
        regionMap.set(region.id, {
          name: region.name,
          currentSales: 0,
          currentCount: 0,
          previousSales: region.sales,
          previousCount: region.count
        });
      }
    });
    
    // Преобразуем Map в массив и вычисляем проценты роста
    const compareData = Array.from(regionMap.values())
      .map(region => ({
        ...region,
        salesGrowth: region.previousSales > 0 ? 
          ((region.currentSales / region.previousSales) - 1) * 100 : 
          (region.currentSales > 0 ? 100 : 0)
      }))
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
        .style('color', '#9ca3af')
        .text('Нет данных для сравнения за выбранный период');
      return;
    }
    
    // Берем топ-10 регионов для графика
    const topRegions = compareData.slice(0, 10);
    
    // Создаем контейнер для графика сравнения
    const graphContainer = comparisonContainer.append('div')
      .style('flex', '1')
      .style('background', 'rgba(17, 24, 39, 0.6)')
      .style('border-radius', '8px')
      .style('padding', '15px')
      .style('height', '350px');
    
    graphContainer.append('h4')
      .style('font-size', '1rem')
      .style('color', '#f9fafb')
      .style('margin-bottom', '15px')
      .style('text-align', 'center')
      .text(`Сравнение объемов продаж по регионам`);
    
    // SVG для графика
    const graphSvg = graphContainer.append('svg')
      .attr('width', '100%')
      .attr('height', 'calc(100% - 40px)');
    
    const graphWidth = graphSvg.node().clientWidth;
    const graphHeight = graphSvg.node().clientHeight;
    const graphMargin = { top: 20, right: 100, bottom: 40, left: 180 };
    
    // Максимальное значение для масштаба
    const maxValue = d3.max(topRegions, d => Math.max(d.currentSales, d.previousSales)) * 1.1;
    
    // Шкалы для графика
    const salesX = d3.scaleLinear()
      .domain([0, maxValue])
      .range([graphMargin.left, graphWidth - graphMargin.right]);
    
    const salesY = d3.scaleBand()
      .domain(topRegions.map(d => d.name))
      .range([graphMargin.top, graphHeight - graphMargin.bottom])
      .padding(0.3);
    
    // Оси для графика
    graphSvg.append('g')
      .attr('transform', `translate(0,${graphHeight - graphMargin.bottom})`)
      .call(d3.axisBottom(salesX)
        .ticks(5)
        .tickFormat(d => formatProfitCompact(d)))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text')
        .style('fill', '#d1d5db')
        .style('font-size', '0.85rem'));
    
    graphSvg.append('g')
      .attr('transform', `translate(${graphMargin.left},0)`)
      .call(d3.axisLeft(salesY))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text')
        .style('fill', '#d1d5db')
        .style('font-size', '0.85rem'));
    
    // Текущий период (голубые полосы)
    graphSvg.selectAll('.current-sales-bar')
      .data(topRegions)
      .join('rect')
      .attr('class', 'current-sales-bar')
      .attr('x', graphMargin.left)
      .attr('y', d => salesY(d.name))
      .attr('height', salesY.bandwidth() / 2 - 2)
      .attr('fill', '#3b82f6') // Голубой для текущего периода
      .attr('rx', 4)
      .attr('width', 0)
      .transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .attr('width', d => salesX(d.currentSales) - graphMargin.left);
    
    // Начальный период (серые полосы)
    graphSvg.selectAll('.previous-sales-bar')
      .data(topRegions)
      .join('rect')
      .attr('class', 'previous-sales-bar')
      .attr('x', graphMargin.left)
      .attr('y', d => salesY(d.name) + salesY.bandwidth() / 2 + 2)
      .attr('height', salesY.bandwidth() / 2 - 2)
      .attr('fill', '#94a3b8')
      .attr('rx', 4)
      .attr('width', 0)
      .transition()
      .duration(800)
      .delay((d, i) => i * 100 + 300)
      .attr('width', d => salesX(d.previousSales) - graphMargin.left);

    
    // Добавляем легенду
    const legend = graphSvg.append('g')
      .attr('transform', `translate(${graphMargin.left}, 5)`);
    
    // Текущий период
    legend.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('rx', 3)
      .attr('fill', '#3b82f6'); // Цвет для текущего периода
    
    legend.append('text')
      .attr('x', 22)
      .attr('y', 12)
      .style('font-size', '0.9rem')
      .style('fill', '#f9fafb')
      .text(endPeriodName);
    
    // Предыдущий период
    legend.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('rx', 3)
      .attr('fill', '#94a3b8')
      .attr('transform', 'translate(120, 0)');
    
    legend.append('text')
      .attr('x', 142)
      .attr('y', 12)
      .style('font-size', '0.9rem')
      .style('fill', '#f9fafb')
      .text(startPeriodName);
    
    // Добавляем тултипы для полос
    graphSvg.selectAll('.current-sales-bar, .previous-sales-bar')
      .on('mouseover', function(event, d) {
        const isCurrentBar = d3.select(this).classed('current-sales-bar');
        const value = isCurrentBar ? d.currentSales : d.previousSales;
        const periodName = isCurrentBar ? endPeriodName : startPeriodName;
        const count = isCurrentBar ? d.currentCount : d.previousCount;
        
        // Создаем тултип с улучшенным стилем
        d3.select('body').append('div')
          .attr('class', 'chart-tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(17, 24, 39, 0.95)')
          .style('color', '#f9fafb')
          .style('border-radius', '6px')
          .style('padding', '10px 15px')
          .style('font-size', '0.95rem')
          .style('pointer-events', 'none')
          .style('z-index', 1000)
          .style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.3)')
          .style('border', `1px solid ${isCurrentBar ? '#3b82f6' : '#94a3b8'}`)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 40}px`)
          .html(`
            <div style="font-weight:bold;font-size:1rem;margin-bottom:5px;">${d.name}</div>
            <div style="color:#a1a1aa">${periodName}</div>
            <div style="margin-top:8px">
              <span style="color:#60a5fa;font-weight:bold;">Объем продаж:</span> 
              <span style="font-weight:600;">${formatProfitCompact(value)}</span>
            </div>
            <div style="margin-top:3px">
              <span style="color:#60a5fa;font-weight:bold;">Количество:</span> 
              <span style="font-weight:600;">${count} шт.</span>
            </div>
          `);
          
        // Увеличиваем полосу при наведении
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 0.9)
          .attr('height', salesY.bandwidth() / 2);
      })
      .on('mousemove', function(event) {
        d3.select('.chart-tooltip')
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 40}px`);
      })
      .on('mouseout', function() {
        d3.select('.chart-tooltip').remove();
        
        // Возвращаем исходный размер
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 1)
          .attr('height', salesY.bandwidth() / 2 - 2);
      });
    
    // Секция со статистикой полностью удалена
    
  } catch (error) {
    // Удаляем индикатор загрузки
    loader.remove();
    
    console.error('Ошибка при загрузке данных для сравнения:', error);
    
    comparisonContainer.append('div')
      .style('color', '#ef4444')
      .style('padding', '15px')
      .style('background', 'rgba(239, 68, 68, 0.1)')
      .style('border', '1px solid rgba(239, 68, 68, 0.3)')
      .style('border-radius', '6px')
      .style('margin-top', '15px')
      .text(`Ошибка при загрузке данных для сравнения: ${error.message}`);
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
     .style('color', '#9ca3af')
     .html(`
       <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
       <span class="ml-3">Загрузка данных о регионах...</span>
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
             .style('color', '#9ca3af')
             .text('Выберите диапазон для сравнения и нажмите "Применить"');
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
       .style('color', '#9ca3af')
       .text('Нет данных о регионах для отображения');
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
       <div>Ошибка при загрузке данных о регионах</div>
       <div style="margin-top: 10px; font-size: 0.9rem;">${error.message}</div>
     `);
 }
 
 console.groupEnd(); // Завершаем группу логирования
};
      
      
const showModelRegionalDistribution = (modelName, year, month, monthName) => {
  if (!mainChartRef.current) return;
  d3.selectAll('.chart-tooltip, .bar-tooltip, .model-tooltip').remove();
  // Очищаем контейнер
  mainChartRef.current.innerHTML = '';
  
  // Создаем основной контейнер
  const container = d3.select(mainChartRef.current)
    .append('div')
    .style('width', '100%')
    .style('background', 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)')
    .style('border-radius', '1rem')
    .style('padding', '20px');
  
  // Добавляем заголовок и навигацию
  const header = container.append('div')
    .style('display', 'flex')
    .style('justify-content', 'space-between')
    .style('margin-bottom', '20px')
    .style('border-bottom', '1px solid rgba(59, 130, 246, 0.2)')
    .style('padding-bottom', '10px');
  
  header.append('h2')
    .style('font-size', '1.4rem')
    .style('color', '#f9fafb')
    .html(`<span style="color: #60a5fa;">${modelName}</span>: распределение по регионам (${monthName} ${year})`);
  
  // Кнопки навигации
  const buttons = header.append('div').style('display', 'flex').style('gap', '10px');
  
  buttons.append('button')
    .style('background', 'rgba(59, 130, 246, 0.1)')
    .style('color', '#60a5fa')
    .style('border', '1px solid rgba(59, 130, 246, 0.3)')
    .style('padding', '8px 15px')
    .style('border-radius', '8px')
    .text('← К выбору модели')
    .on('click', () => showCarModelDetails(year, month, monthName));
  
  buttons.append('button')
    .style('background', 'rgba(16, 185, 129, 0.1)')
    .style('color', '#34d399')
    .style('border', '1px solid rgba(16, 185, 129, 0.3)')
    .style('padding', '8px 15px')
    .style('border-radius', '8px')
    .text('← К общему обзору')
    .on('click', renderPeriodComparisonTable);
  
  // Информационная панель
  const infoPanel = container.append('div')
    .style('display', 'grid')
    .style('grid-template-columns', 'repeat(auto-fit, minmax(200px, 1fr))')
    .style('gap', '15px')
    .style('margin-bottom', '20px');
  
  // Генерируем данные о модели
  const totalSales = Math.round(500000 + Math.random() * 500000);
  const totalCount = Math.round(50 + Math.random() * 100);
  const avgPrice = Math.round(totalSales / totalCount);
  const lastYearCount = Math.round(totalCount * (0.7 + Math.random() * 0.4));
  const growth = ((totalCount / lastYearCount - 1) * 100).toFixed(1);
  
  // Создаем информационные карточки
  createInfoCard(infoPanel, 'Общие продажи', formatProfitCompact(totalSales), '', '#3b82f6');
  createInfoCard(infoPanel, 'Количество', totalCount, 'шт.', '#f87171', growth);
  createInfoCard(infoPanel, 'Средняя цена', formatProfitCompact(avgPrice), '', '#8b5cf6');
  createInfoCard(infoPanel, 'Доля рынка', (Math.round(5 + Math.random() * 15)), '%', '#10b981');
  
  // Контейнер для графика распределения по регионам
  const regionsContainer = container.append('div')
    .style('background', 'rgba(15, 23, 42, 0.6)')
    .style('border-radius', '12px')
    .style('padding', '20px')
    .style('margin-bottom', '20px');
  
  regionsContainer.append('h3')
    .style('font-size', '1.1rem')
    .style('color', '#f9fafb')
    .style('margin-bottom', '15px')
    .text(`Распределение ${modelName} по регионам`);
  
  const regionsChartSvg = regionsContainer.append('svg')
    .attr('width', '100%')
    .attr('height', '400px');
  
  // Генерируем данные о распределении по регионам
  const regions = [
    'Ташкент', 'Самарканд', 'Бухара', 'Фергана', 'Андижан', 
    'Наманган', 'Навои', 'Карши', 'Нукус', 'Ургенч', 'Джизак', 'Термез'
  ];
  
  const regionData = regions.map(region => {
    const currentYearSales = Math.round(5 + Math.random() * 45);
    const previousYearSales = Math.round(currentYearSales * (0.7 + Math.random() * 0.6));
    const regionGrowth = ((currentYearSales / previousYearSales - 1) * 100).toFixed(1);
    
    return {
      name: region,
      currentYear: currentYearSales,
      previousYear: previousYearSales,
      growth: parseFloat(regionGrowth)
    };
  }).sort((a, b) => b.currentYear - a.currentYear);
  
  // Отрисовка горизонтальной столбчатой диаграммы
  const chartWidth = regionsChartSvg.node().clientWidth;
  const chartHeight = 400;
  const chartMargin = { top: 20, right: 120, bottom: 40, left: 150 };
  
  // Создаем шкалы
  const y = d3.scaleBand()
    .domain(regionData.map(d => d.name))
    .range([chartMargin.top, chartHeight - chartMargin.bottom])
    .padding(0.3);
  
  const x = d3.scaleLinear()
    .domain([0, d3.max(regionData, d => d.currentYear) * 1.1])
    .nice()
    .range([chartMargin.left, chartWidth - chartMargin.right]);
  
  // Добавляем оси
  regionsChartSvg.append('g')
    .attr('transform', `translate(0,${chartHeight - chartMargin.bottom})`)
    .call(d3.axisBottom(x).ticks(5))
    .call(g => g.selectAll('text').style('fill', '#9ca3af'));
  
  regionsChartSvg.append('g')
    .attr('transform', `translate(${chartMargin.left},0)`)
    .call(d3.axisLeft(y))
    .call(g => g.selectAll('text').style('fill', '#9ca3af'));
  
  // Добавляем полосы для текущего года
  regionsChartSvg.selectAll('.region-bar')
    .data(regionData)
    .join('rect')
    .attr('class', 'region-bar')
    .attr('x', chartMargin.left)
    .attr('y', d => y(d.name))
    .attr('height', y.bandwidth())
    .attr('width', d => x(d.currentYear) - chartMargin.left)
    .attr('fill', '#3b82f6')
    .attr('rx', 4);
  
  // Добавляем метки значений
  regionsChartSvg.selectAll('.region-label')
    .data(regionData)
    .join('text')
    .attr('class', 'region-label')
    .attr('x', d => x(d.currentYear) + 5)
    .attr('y', d => y(d.name) + y.bandwidth() / 2)
    .attr('dy', '0.35em')
    .style('font-size', '0.9rem')
    .style('fill', '#f9fafb')
    .text(d => `${d.currentYear} шт. ${d.growth >= 0 ? '+' : ''}${d.growth}%`);
  
  // Таблица с данными регионов и изменениями
  const tableContainer = container.append('div')
    .style('background', 'rgba(15, 23, 42, 0.6)')
    .style('border-radius', '12px')
    .style('padding', '20px');
  
  tableContainer.append('h3')
    .style('font-size', '1.1rem')
    .style('color', '#f9fafb')
    .style('margin-bottom', '15px')
    .text(`Сравнение продаж ${modelName} по регионам: ${year} vs ${year-1}`);
  
  const table = tableContainer.append('div')
    .style('width', '100%')
    .style('overflow-x', 'auto');
  
  // Заголовок таблицы
  const tableHeader = table.append('div')
    .style('display', 'grid')
    .style('grid-template-columns', '30% 20% 20% 15% 15%')
    .style('padding', '12px')
    .style('background', 'rgba(30, 41, 59, 0.7)')
    .style('border-radius', '8px 8px 0 0');
  
  tableHeader.append('div').style('font-weight', 'bold').style('color', '#f9fafb').text('Регион');
  tableHeader.append('div').style('font-weight', 'bold').style('color', '#f9fafb').style('text-align', 'center').text(`${year} год`);
  tableHeader.append('div').style('font-weight', 'bold').style('color', '#f9fafb').style('text-align', 'center').text(`${year-1} год`);
  tableHeader.append('div').style('font-weight', 'bold').style('color', '#f9fafb').style('text-align', 'center').text('Изменение');
  tableHeader.append('div').style('font-weight', 'bold').style('color', '#f9fafb').style('text-align', 'center').text('Доля');
  
  // Строки таблицы
  regionData.forEach((region, i) => {
    const marketShare = ((region.currentYear / regionData.reduce((sum, r) => sum + r.currentYear, 0)) * 100).toFixed(1);
    
    const row = table.append('div')
      .style('display', 'grid')
      .style('grid-template-columns', '30% 20% 20% 15% 15%')
      .style('padding', '12px')
      .style('background', i % 2 === 0 ? 'rgba(30, 41, 59, 0.3)' : 'rgba(30, 41, 59, 0.5)');
    
    row.append('div').style('color', '#f9fafb').text(region.name);
    row.append('div').style('color', '#f9fafb').style('text-align', 'center').text(`${region.currentYear} шт.`);
    row.append('div').style('color', '#9ca3af').style('text-align', 'center').text(`${region.previousYear} шт.`);
    row.append('div').style('color', region.growth >= 0 ? '#10b981' : '#ef4444').style('font-weight', 'bold').style('text-align', 'center').text(`${region.growth >= 0 ? '+' : ''}${region.growth}%`);
    row.append('div').style('color', '#f9fafb').style('text-align', 'center').text(`${marketShare}%`);
  });
};
const createInfoCard = (container, title, value, suffix, color, trend) => {
  const card = container.append('div')
    .style('background', `rgba(30, 41, 59, 0.5)`)
    .style('border-radius', '12px')
    .style('padding', '15px')
    .style('border-left', `3px solid ${color}`);
  
  card.append('div')
    .style('font-size', '0.8rem')
    .style('color', '#9ca3af')
    .text(title);
  
  const valueRow = card.append('div')
    .style('font-size', '1.4rem')
    .style('font-weight', 'bold')
    .style('color', '#f9fafb')
    .style('margin', '5px 0')
    .text(value + (suffix ? ' ' + suffix : ''));
  
  if (trend) {
    card.append('div')
      .style('font-size', '0.8rem')
      .style('color', trend >= 0 ? '#10b981' : '#ef4444')
      .text(`${trend >= 0 ? '▲' : '▼'} ${Math.abs(trend)}% к прошлому году`);
  }
};
const showRegionModelDistribution = (regionName, year, month, monthName) => {
  if (!mainChartRef.current) return;
  
  // Очищаем контейнер
  mainChartRef.current.innerHTML = '';
  
  // Создаем основной контейнер
  const container = d3.select(mainChartRef.current)
    .append('div')
    .style('width', '100%')
    .style('background', 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)')
    .style('border-radius', '1rem')
    .style('padding', '20px');
  
  // Добавляем заголовок и навигацию
  const header = container.append('div')
    .style('display', 'flex')
    .style('justify-content', 'space-between')
    .style('margin-bottom', '20px')
    .style('border-bottom', '1px solid rgba(59, 130, 246, 0.2)')
    .style('padding-bottom', '10px');
  
  header.append('h2')
    .style('font-size', '1.4rem')
    .style('color', '#f9fafb')
    .html(`<span style="color: #f87171;">${regionName}</span>: модели (${monthName} ${year})`);
  
  // Кнопки навигации
  const buttons = header.append('div').style('display', 'flex').style('gap', '10px');
  
  buttons.append('button')
    .style('background', 'rgba(239, 68, 68, 0.1)')
    .style('color', '#f87171')
    .style('border', '1px solid rgba(239, 68, 68, 0.3)')
    .style('padding', '8px 15px')
    .style('border-radius', '8px')
    .text('← К списку регионов')
    .on('click', () => showRegionDetails(year, month, monthName));
  
  buttons.append('button')
    .style('background', 'rgba(16, 185, 129, 0.1)')
    .style('color', '#34d399')
    .style('border', '1px solid rgba(16, 185, 129, 0.3)')
    .style('padding', '8px 15px')
    .style('border-radius', '8px')
    .text('← К общему обзору')
    .on('click', renderPeriodComparisonTable);
  
  // Панель сравнения
  const comparisonPanel = container.append('div')
    .style('display', 'flex')
    .style('background', 'rgba(30, 41, 59, 0.5)')
    .style('border-radius', '10px')
    .style('padding', '15px')
    .style('margin-bottom', '20px');
    
  comparisonPanel.append('div')
    .style('font-size', '0.9rem')
    .style('color', '#f9fafb')
    .text(`Сравнение с ${monthName} ${year-1}`);
  
  // Генерируем статистику региона
  const totalSalesCurrentYear = Math.round(2500000 + Math.random() * 1000000);
  const totalSalesPrevYear = Math.round(totalSalesCurrentYear * (0.8 + Math.random() * 0.3));
  const salesGrowth = ((totalSalesCurrentYear / totalSalesPrevYear - 1) * 100).toFixed(1);
  const totalCountCurrentYear = Math.round(300 + Math.random() * 200);
  
  // Основной контейнер для графиков
  const chartsContainer = container.append('div')
    .style('display', 'grid')
    .style('grid-template-columns', 'repeat(auto-fit, minmax(300px, 1fr))')
    .style('gap', '20px')
    .style('margin-bottom', '20px');
  
  // 1. График сравнения продаж моделей (текущий год vs предыдущий)
  const comparisonChartContainer = chartsContainer.append('div')
    .style('grid-column', 'span 2')
    .style('background', 'rgba(15, 23, 42, 0.6)')
    .style('border-radius', '12px')
    .style('padding', '20px');
    
  comparisonChartContainer.append('h3')
    .style('font-size', '1.1rem')
    .style('color', '#f9fafb')
    .style('margin-bottom', '15px')
    .text(`Сравнение продаж моделей: ${monthName} ${year} vs ${monthName} ${year-1}`);
    
  const comparisonChartSvg = comparisonChartContainer.append('svg')
    .attr('width', '100%')
    .attr('height', '350px');
    
  // Генерируем данные о моделях
  const modelNames = [
    'DAMAS-2', 'TRACKER-2', 'Captiva 5T', 
    'ONIX',
  ];
  
  const modelsComparisonData = modelNames.map(model => {
    const currentYearSales = Math.round(50000 + Math.random() * 100000);
    const previousYearSales = Math.round(currentYearSales * (0.7 + Math.random() * 0.6));
    const growth = ((currentYearSales / previousYearSales - 1) * 100).toFixed(1);
    
    return {
      name: model,
      currentYear: currentYearSales,
      previousYear: previousYearSales,
      growth: parseFloat(growth)
    };
  }).sort((a, b) => b.currentYear - a.currentYear);
  
  // Отрисовка графика сравнения
  const compWidth = comparisonChartSvg.node().clientWidth;
  const compHeight = 350;
  const compMargin = { top: 30, right: 100, bottom: 60, left: 80 };
  
  // Создаем шкалы
  const compX = d3.scaleBand()
    .domain(modelsComparisonData.map(d => d.name))
    .range([compMargin.left, compWidth - compMargin.right])
    .padding(0.3);
  
  const compY = d3.scaleLinear()
    .domain([0, d3.max(modelsComparisonData, d => Math.max(d.currentYear, d.previousYear)) * 1.1])
    .nice()
    .range([compHeight - compMargin.bottom, compMargin.top]);
  
  // Внутренняя шкала для группировки
  const compX1 = d3.scaleBand()
    .domain(['previousYear', 'currentYear'])
    .range([0, compX.bandwidth()])
    .padding(0.1);
  
  // Цветовая шкала
  const compColor = d3.scaleOrdinal()
    .domain(['previousYear', 'currentYear'])
    .range(['#94a3b8', '#f87171']);
  
  // Добавляем оси
  comparisonChartSvg.append('g')
    .attr('transform', `translate(0,${compHeight - compMargin.bottom})`)
    .call(d3.axisBottom(compX))
    .call(g => g.selectAll('text')
      .style('fill', '#9ca3af')
      .attr('transform', 'rotate(-30)')
      .attr('text-anchor', 'end')
      .attr('dx', '-0.8em')
      .attr('dy', '0.15em'));
  
  comparisonChartSvg.append('g')
    .attr('transform', `translate(${compMargin.left},0)`)
    .call(d3.axisLeft(compY).ticks(5).tickFormat(d => formatProfitCompact(d)))
    .call(g => g.selectAll('text').style('fill', '#9ca3af'));
  
  // Добавляем горизонтальные линии сетки
  comparisonChartSvg.append('g')
    .selectAll('line')
    .data(compY.ticks(5))
    .join('line')
    .attr('x1', compMargin.left)
    .attr('x2', compWidth - compMargin.right)
    .attr('y1', d => compY(d))
    .attr('y2', d => compY(d))
    .attr('stroke', 'rgba(148, 163, 184, 0.1)')
    .attr('stroke-dasharray', '3,3');
  
  // Создаем группы для каждой модели
  const modelGroups = comparisonChartSvg.append('g')
    .selectAll('g')
    .data(modelsComparisonData)
    .join('g')
    .attr('transform', d => `translate(${compX(d.name)},0)`);
  
  // Добавляем столбцы для каждого года
  const years = ['previousYear', 'currentYear'];
  
  years.forEach(yearKey => {
    modelGroups.append('rect')
      .attr('x', d => compX1(yearKey))
      .attr('y', d => compY(d[yearKey]))
      .attr('width', compX1.bandwidth())
      .attr('height', d => compHeight - compMargin.bottom - compY(d[yearKey]))
      .attr('fill', compColor(yearKey))
      .attr('rx', 4)
      .style('opacity', yearKey === 'currentYear' ? 0.9 : 0.6);
  });
  
  // Добавляем метки процентного изменения
  modelGroups.append('text')
    .attr('x', d => compX1('currentYear') + compX1.bandwidth() / 2)
    .attr('y', d => compY(d.currentYear) - 10)
    .attr('text-anchor', 'middle')
    .style('fill', d => d.growth >= 0 ? '#10b981' : '#ef4444')
    .style('font-weight', 'bold')
    .style('font-size', '0.8rem')
    .text(d => `${d.growth >= 0 ? '+' : ''}${d.growth}%`);
  
  // Добавляем легенду
  const compLegend = comparisonChartSvg.append('g')
    .attr('transform', `translate(${compWidth - compMargin.right + 20}, ${compMargin.top + 10})`);
  
  const yearLabels = { 'previousYear': year-1, 'currentYear': year };
  
  years.forEach((year, i) => {
    const legendItem = compLegend.append('g')
      .attr('transform', `translate(0, ${i * 20})`);
    
    legendItem.append('rect')
      .attr('width', 12)
      .attr('height', 12)
      .attr('rx', 2)
      .attr('fill', compColor(year));
    
    legendItem.append('text')
      .attr('x', 20)
      .attr('y', 10)
      .style('fill', '#d1d5db')
      .style('font-size', '0.8rem')
      .text(`${monthName} ${yearLabels[year]}`);
  });
  
  // Таблица моделей с изменениями
  const tableContainer = container.append('div')
    .style('background', 'rgba(15, 23, 42, 0.6)')
    .style('border-radius', '12px')
    .style('padding', '20px')
    .style('margin-bottom', '20px');
  
  tableContainer.append('h3')
    .style('font-size', '1.1rem')
    .style('color', '#f9fafb')
    .style('margin-bottom', '15px')
    .text(`Сводная таблица моделей в ${regionName}`);
  
  // Таблица с данными
  const table = tableContainer.append('div')
    .style('width', '100%')
    .style('overflow-x', 'auto');
  
  // Заголовок таблицы
  const tableHeader = table.append('div')
    .style('display', 'grid')
    .style('grid-template-columns', '40% 15% 15% 15% 15%')
    .style('padding', '12px 15px')
    .style('background', 'rgba(30, 41, 59, 0.7)')
    .style('border-radius', '8px 8px 0 0');
  
  tableHeader.append('div').style('font-weight', 'bold').style('color', '#f9fafb').text('Модель');
  tableHeader.append('div').style('font-weight', 'bold').style('color', '#f9fafb').style('text-align', 'right').text(`${year} г., UZS.`);
  tableHeader.append('div').style('font-weight', 'bold').style('color', '#f9fafb').style('text-align', 'right').text(`${year-1} г., UZS.`);
  tableHeader.append('div').style('font-weight', 'bold').style('color', '#f9fafb').style('text-align', 'right').text('Рост, %');
  tableHeader.append('div').style('font-weight', 'bold').style('color', '#f9fafb').style('text-align', 'right').text('Доля, %');
  
  // Строки таблицы с данными
  modelsComparisonData.forEach((model, i) => {
    const marketShare = ((model.currentYear / modelsComparisonData.reduce((sum, m) => sum + m.currentYear, 0)) * 100).toFixed(1);
    
    const row = table.append('div')
      .style('display', 'grid')
      .style('grid-template-columns', '40% 15% 15% 15% 15%')
      .style('padding', '12px 15px')
      .style('background', i % 2 === 0 ? 'rgba(30, 41, 59, 0.3)' : 'rgba(30, 41, 59, 0.5)')
      .style('border-left', i < 3 ? `3px solid ${i === 0 ? '#f87171' : (i === 1 ? '#fb923c' : '#fbbf24')}` : 'none');
    
    // Данные
    row.append('div').style('color', '#f9fafb').text(model.name);
    row.append('div').style('color', '#f9fafb').style('text-align', 'right').text(formatProfitCompact(model.currentYear));
    row.append('div').style('color', '#9ca3af').style('text-align', 'right').text(formatProfitCompact(model.previousYear));
    row.append('div').style('color', model.growth >= 0 ? '#10b981' : '#ef4444').style('font-weight', 'bold').style('text-align', 'right').text(`${model.growth >= 0 ? '+' : ''}${model.growth}%`);
    row.append('div').style('color', '#f9fafb').style('text-align', 'right').text(`${marketShare}%`);
  });
  
  // Итоговая строка
  const totalCurrentYear = modelsComparisonData.reduce((sum, model) => sum + model.currentYear, 0);
  const totalPreviousYear = modelsComparisonData.reduce((sum, model) => sum + model.previousYear, 0);
  const totalGrowth = ((totalCurrentYear / totalPreviousYear - 1) * 100).toFixed(1);
  
  const totalRow = table.append('div')
    .style('display', 'grid')
    .style('grid-template-columns', '40% 15% 15% 15% 15%')
    .style('padding', '12px 15px')
    .style('background', 'rgba(30, 41, 59, 0.8)')
    .style('border-top', '2px solid rgba(148, 163, 184, 0.2)')
    .style('font-weight', 'bold');
  
  totalRow.append('div').style('color', '#f9fafb').text('ИТОГО');
  totalRow.append('div').style('color', '#f9fafb').style('text-align', 'right').text(formatProfitCompact(totalCurrentYear));
  totalRow.append('div').style('color', '#f9fafb').style('text-align', 'right').text(formatProfitCompact(totalPreviousYear));
  totalRow.append('div').style('color', totalGrowth >= 0 ? '#10b981' : '#ef4444').style('text-align', 'right').text(`${totalGrowth >= 0 ? '+' : ''}${totalGrowth}%`);
  totalRow.append('div').style('color', '#f9fafb').style('text-align', 'right').text('100%');
};
const renderGroupedBarChart = (data, options) => {
  const {
    container,
    width = container.clientWidth,
    height = 400,
    margin = { top: 40, right: 30, bottom: 60, left: 60 },
    title
  } = options;
  
  // Очистка контейнера
  container.innerHTML = '';
  
  // Создаем SVG
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('background', '#1f2937')
    .style('border-radius', '0.5rem');
  
  // Добавляем заголовок
  if (title) {
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '1.2rem')
      .style('font-weight', 'bold')
      .style('fill', '#f9fafb')
      .text(title);
  }
  
  // Создаем шкалы
  // Внешняя шкала для месяцев
  const x0 = d3.scaleBand()
    .domain(data.map(d => d.name))
    .range([margin.left, width - margin.right])
    .padding(0.2);
  
  // Получаем все годы, представленные в данных
  const allYearsInData = [...new Set(data.flatMap(group => 
    Object.keys(group.years)
  ))].sort((a, b) => Number(a) - Number(b));
  
  // Внутренняя шкала для всех годов в каждом месяце
  const x1 = d3.scaleBand()
    .domain(allYearsInData) // Используем все годы из данных без ограничений
    .range([0, x0.bandwidth()])
    .padding(0.05);
  
  // Находим максимальное значение для масштабирования по оси Y
  const maxValue = d3.max(data, d => 
    d3.max(Object.values(d.years))
  );
  
  const y = d3.scaleLinear()
    .domain([0, maxValue * 1.1])
    .nice()
    .range([height - margin.bottom, margin.top]);
  
  // Создаем расширенную цветовую шкалу для произвольного количества годов
  const colorScale = d3.scaleOrdinal()
    .domain(allYearsInData)
    .range(allYearsInData.map((_, i) => {
      if (focusCategory !== 'all') {
        // Используем интерполяцию цветов для равномерного распределения
        const baseColor = d3.hsl(SALE_TYPES[focusCategory.toUpperCase()].color);
        // Вычисляем яркость цвета с учетом количества лет
        const lightnessStep = 0.5 / (allYearsInData.length || 1);
        baseColor.l = 0.7 - (i * lightnessStep);
        return baseColor.toString();
      }
      
      // Для разных категорий используем несколько цветовых схем для большего разнообразия
      const combinedColorScheme = [
        ...d3.schemeCategory10,
        ...d3.schemePaired,
        ...(d3.schemeTableau10 || d3.schemeSet3),
        ...d3.schemeSet2
      ];
      
      return combinedColorScheme[i % combinedColorScheme.length];
    }));
  
  // Создаем оси
  const xAxis = g => g
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x0).tickSizeOuter(0))
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('text')
      .style('fill', '#f9fafb')
      .style('font-size', '0.8rem')
      .attr('dy', '0.5em')
      .attr('transform', 'rotate(-25)')
      .attr('text-anchor', 'end'));
  
  const yAxis = g => g
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => d3.format(',.0f')(d)))
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('text').style('fill', '#f9fafb'))
    .call(g => g.selectAll('.tick line')
      .attr('x2', width - margin.left - margin.right)
      .attr('stroke-opacity', 0.1));
  
  // Добавляем оси
  svg.append('g').call(xAxis);
  svg.append('g').call(yAxis);
  
  // Создаем tooltip
  const tooltip = d3.select(container)
    .append('div')
    .style('position', 'absolute')
    .style('background-color', '#27303f')
    .style('color', '#f9fafb')
    .style('padding', '8px')
    .style('border-radius', '4px')
    .style('font-size', '12px')
    .style('box-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.3)')
    .style('pointer-events', 'none')
    .style('opacity', 0)
    .style('z-index', 10);
  
  // Добавляем группы для каждого месяца
  const monthGroups = svg.append('g')
    .selectAll('g')
    .data(data)
    .join('g')
    .attr('transform', d => `translate(${x0(d.name)},0)`);
  
  // Добавляем столбцы для каждого года внутри месяца
  monthGroups.selectAll('rect')
    .data(d => {
      return allYearsInData.map(year => ({
        year: Number(year),
        yearStr: year.toString(),
        value: d.years[year] || 0,
        month: d.name
      }));
    })
    .join('rect')
    .attr('x', d => x1(d.yearStr))
    .attr('y', d => y(d.value))
    .attr('width', x1.bandwidth())
    .attr('height', d => height - margin.bottom - y(d.value))
    .attr('fill', d => colorScale(d.yearStr))
    .attr('rx', 4)
    .attr('opacity', 0.9)
    .on('mouseover', function(event, d) {
      d3.select(this).attr('opacity', 1);
      
      // Улучшенная подсказка с отформатированным значением
      tooltip.style('opacity', 1)
        .html(`
          <div style="font-weight:bold">${d.month} ${d.year}</div>
          <div>${d3.format(',.0f')(d.value)} ${focusCategory === 'all' ? '' : SALE_TYPES[focusCategory.toUpperCase()].name}</div>
        `)
        .style('left', `${event.pageX + 15}px`)
        .style('top', `${event.pageY - 28}px`);
    })
    .on('mouseout', function() {
      d3.select(this).attr('opacity', 0.9);
      tooltip.style('opacity', 0);
    });
  
  // Добавляем анимацию
  monthGroups.selectAll('rect')
    .attr('y', height - margin.bottom)
    .attr('height', 0)
    .transition()
    .duration(800)
    .delay((d, i) => i * 50)
    .attr('y', d => y(d.value))
    .attr('height', d => height - margin.bottom - y(d.value));
  
  // Добавляем легенду
  const legendContainer = svg.append('g')
    .attr('transform', `translate(${width - margin.right - 130}, ${margin.top})`);
  
  // Определяем максимальное количество лет, которое можно показать без прокрутки
  const maxVisibleLegendItems = Math.min(8, Math.floor((height - margin.top - margin.bottom) / 25));
  const needScrolling = allYearsInData.length > maxVisibleLegendItems;
  
  // Если нужна прокрутка, добавляем фон и контейнер с клиппингом
  if (needScrolling) {
    // Создаем прямоугольник фона
    legendContainer.append('rect')
      .attr('width', 120)
      .attr('height', maxVisibleLegendItems * 25 + 10)
      .attr('fill', 'rgba(31, 41, 55, 0.7)')
      .attr('rx', 5);
    
    // Создаем подсказку о прокрутке
    legendContainer.append('text')
      .attr('x', 60)
      .attr('y', maxVisibleLegendItems * 25 + 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '0.7rem')
      .style('fill', '#9ca3af')
      .text('* Все годы в легенде');
  }
  
  // Создаем группу для элементов легенды
  const legend = legendContainer.append('g');
  
  // Добавляем элементы легенды для каждого года
  allYearsInData.forEach((year, i) => {
    const yearLegend = legend.append('g')
      .attr('transform', `translate(0, ${i * 25})`)
      .style('cursor', 'pointer')
      .on('mouseover', function() {
        // Подсветка соответствующих столбцов
        monthGroups.selectAll('rect')
          .filter(d => d.yearStr === year)
          .transition()
          .duration(200)
          .attr('opacity', 1)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 1);
          
        d3.select(this).select('rect')
          .transition()
          .duration(200)
          .attr('width', 18)
          .attr('height', 18);
          
        d3.select(this).select('text')
          .style('font-weight', 'bold');
      })
      .on('mouseout', function() {
        // Возврат к нормальному виду
        monthGroups.selectAll('rect')
          .filter(d => d.yearStr === year)
          .transition()
          .duration(200)
          .attr('opacity', 0.9)
          .attr('stroke', 'none');
          
        d3.select(this).select('rect')
          .transition()
          .duration(200)
          .attr('width', 15)
          .attr('height', 15);
          
        d3.select(this).select('text')
          .style('font-weight', 'normal');
      });
      
    yearLegend.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('rx', 3)
      .attr('fill', colorScale(year));
      
    yearLegend.append('text')
      .attr('x', 25)
      .attr('y', 12)
      .style('font-size', '0.9rem')
      .style('fill', '#f9fafb')
      .text(year);
    
    // Если это не первый год, добавляем процент изменения
    if (i > 0 && selectedYears.length > 1) {
      const baseYear = allYearsInData[0]; // Первый год как базовый для сравнения
      
      // Рассчитываем суммарные значения для сравнения
      const baseYearTotal = data.reduce((sum, month) => sum + (month.years[baseYear] || 0), 0);
      const currentYearTotal = data.reduce((sum, month) => sum + (month.years[year] || 0), 0);
      
      // Вычисляем процент изменения
      const growthPercent = baseYearTotal !== 0 ? 
        ((currentYearTotal / baseYearTotal) - 1) * 100 : 0;
      
      // Добавляем метку с процентом
      yearLegend.append('text')
        .attr('x', 60)
        .attr('y', 12)
        .style('font-size', '0.8rem')
        .style('fill', growthPercent >= 0 ? '#10b981' : '#ef4444')
        .text(`${growthPercent >= 0 ? '+' : ''}${growthPercent.toFixed(1)}%`);
    }
  });
};
const renderProgressChart = () => {
  if (!progressChartRef.current || Object.keys(financialData).length === 0) return;
  
  // Очистка контейнера
  progressChartRef.current.innerHTML = '';
  
  // Получаем актуальные данные для текущего режима отображения
  let targetAmount, totalEarned;
  
  if (displayMode === 'yearly' || displayMode === 'compare') {
    // Для режима одного года или сравнения берем данные по последнему выбранному году
    const latestYear = Math.max(...selectedYears);
    const yearData = financialData[latestYear] || {};
    targetAmount = yearData.targetAmount || 0;
    totalEarned = yearData.totalEarned || 0;
  } else {
    // Для режима периода - сумма за выбранный период
    targetAmount = 0;
    totalEarned = 0;
    
    for (let year = startYear; year <= endYear; year++) {
      if (!financialData[year]) continue;
      
      const monthlyTarget = financialData[year].targetAmount / 12;
      
      financialData[year].months.forEach(month => {
        if (
          (year === startYear && month.month < startMonth) || 
          (year === endYear && month.month > endMonth)
        ) {
          return;
        }
        
        targetAmount += monthlyTarget;
        totalEarned += month.total;
      });
    }
  }
  
  // Расчет процента выполнения плана с проверкой на корректность данных
  const percentage = Math.min(100, Math.round((totalEarned / (targetAmount || 1)) * 100));
  
  // Создаем контейнер с флекс-версткой для лучшей организации
  const container = d3.select(progressChartRef.current)
    .append('div')
    .style('display', 'flex')
    .style('flex-direction', 'column')
    .style('align-items', 'center')
    .style('justify-content', 'center')
    .style('height', '100%')
    .style('padding', '15px')
    .style('background', 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.8) 100%)')
    .style('border-radius', '12px')
    .style('box-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)')
    .style('border', '1px solid rgba(59, 130, 246, 0.1)');
  
  // Добавляем заголовок с улучшенной типографикой
  container.append('h3')
    .style('color', '#f9fafb')
    .style('font-size', '1.1rem')
    .style('font-weight', 'bold')
    .style('margin-top', '5px')
    .style('margin-bottom', '15px')
    .style('text-align', 'center')
    .style('background', 'linear-gradient(90deg, #3b82f6, #60a5fa)')
    .style('background-clip', 'text')
    .style('-webkit-background-clip', 'text')
    .style('color', 'transparent')
    .style('text-shadow', '0 1px 2px rgba(0, 0, 0, 0.1)')
    .text('Прогресс выполнения плана продаж');
  
  // Создаем контейнер для кругового прогресс-бара с улучшенным позиционированием
  const progressContainer = container.append('div')
    .style('position', 'relative')
    .style('width', '160px')
    .style('height', '160px')
    .style('margin', '10px 0')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('justify-content', 'center');
    
  // Создаем SVG для кругового индикатора с улучшенными свойствами
  const svg = progressContainer.append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .style('transform', 'rotate(-90deg)'); // Повернем чтобы прогресс шел по часовой

  // Определяем параметры круга с улучшенной визуализацией
  const circleSize = 160;
  const strokeWidth = 14;
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Добавляем декоративный фоновый элемент для улучшения эстетики
  svg.append('circle')
    .attr('cx', circleSize / 2)
    .attr('cy', circleSize / 2)
    .attr('r', radius + strokeWidth / 2)
    .attr('fill', 'rgba(15, 23, 42, 0.5)')
    .attr('stroke', 'rgba(59, 130, 246, 0.1)')
    .attr('stroke-width', 1)
    .attr('opacity', 0.3);
  
  // Улучшенный фоновый круг с градиентом
  const gradient = svg.append('defs')
    .append('linearGradient')
    .attr('id', 'circle-bg-gradient')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '100%')
    .attr('y2', '100%');
    
  gradient.append('stop')
    .attr('offset', '0%')
    .attr('stop-color', '#1e293b')
    .attr('stop-opacity', 0.6);
    
  gradient.append('stop')
    .attr('offset', '100%')
    .attr('stop-color', '#0f172a')
    .attr('stop-opacity', 0.8);
  
  // Добавляем фоновый круг с улучшенной стилизацией
  svg.append('circle')
    .attr('cx', circleSize / 2)
    .attr('cy', circleSize / 2)
    .attr('r', radius)
    .attr('fill', 'none')
    .attr('stroke', 'url(#circle-bg-gradient)')
    .attr('stroke-width', strokeWidth)
    .attr('stroke-linecap', 'round');
  
  // Вычисляем длину дуги для прогресса
  const progressLength = (percentage / 100) * circumference;
  
  // Функция для определения цвета в зависимости от процента с улучшенной палитрой
  const getProgressColor = (percent) => {
    if (percent >= 100) return '#10b981'; // Зеленый для 100%+
    if (percent >= 85) return '#3b82f6';  // Синий для 85-99%
    if (percent >= 70) return '#6366f1';  // Фиолетовый для 70-84%
    if (percent >= 50) return '#f59e0b';  // Оранжевый для 50-69%
    if (percent >= 30) return '#f97316';  // Темно-оранжевый для 30-49%
    return '#ef4444';                     // Красный для <30%
  };
  
  // Создаем градиент для прогресс-бара
  const progressGradient = svg.append('defs')
    .append('linearGradient')
    .attr('id', 'progress-gradient')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '100%')
    .attr('y2', '0%');
    
  const mainColor = getProgressColor(percentage);
  const darkerColor = d3.color(mainColor).darker(0.5).toString();
  const lighterColor = d3.color(mainColor).brighter(0.3).toString();
    
  progressGradient.append('stop')
    .attr('offset', '0%')
    .attr('stop-color', lighterColor);
    
  progressGradient.append('stop')
    .attr('offset', '100%')
    .attr('stop-color', mainColor);
  
  // Добавляем дугу прогресса с анимацией и улучшенной стилизацией
  const progressCircle = svg.append('circle')
    .attr('cx', circleSize / 2)
    .attr('cy', circleSize / 2)
    .attr('r', radius)
    .attr('fill', 'none')
    .attr('stroke', 'url(#progress-gradient)')
    .attr('stroke-width', strokeWidth)
    .attr('stroke-dasharray', circumference)
    .attr('stroke-dashoffset', circumference) // Начинаем с нуля
    .attr('stroke-linecap', 'round')
    .style('filter', 'drop-shadow(0 0 4px ' + mainColor + ')');
  
  // Добавляем анимацию заполнения с улучшенным таймингом
  progressCircle.transition()
    .duration(1500)
    .ease(d3.easeElasticOut.amplitude(0.8).period(1)) // Улучшенная функция анимации
    .attr('stroke-dashoffset', circumference - progressLength);
  
  // Добавляем контейнер для текста в центре с улучшенной стилизацией
  const textContainer = progressContainer.append('div')
    .style('position', 'absolute')
    .style('top', '0')
    .style('left', '0')
    .style('width', '100%')
    .style('height', '100%')
    .style('display', 'flex')
    .style('flex-direction', 'column')
    .style('align-items', 'center')
    .style('justify-content', 'center')
    .style('text-align', 'center')
    .style('pointer-events', 'none'); // Предотвращаем перехват событий
  
  // Добавляем большой процент в центр с улучшенной типографикой
  const percentElement = textContainer.append('div')
    .style('font-size', '2.5rem')
    .style('font-weight', 'bold')
    .style('color', mainColor)
    .style('line-height', '1')
    .style('margin-bottom', '4px')
    .style('text-shadow', '0 2px 4px rgba(0, 0, 0, 0.3)')
    .text('0%');
    
  // Анимация счетчика процентов с улучшенным алгоритмом
  let startValue = 0;
  const duration = 1500;
  const frameDuration = 16; // ~60fps
  const totalFrames = Math.min(120, duration / frameDuration);
  const incrementPerFrame = percentage / totalFrames;
  
  // Функция для нелинейной интерполяции
  const easeOutQuart = x => 1 - Math.pow(1 - x, 4);
  
  let frame = 0;
  const counterAnimation = () => {
    if (frame === totalFrames) {
      percentElement.text(`${percentage}%`);
      return;
    }
    
    frame++;
    const progress = easeOutQuart(frame / totalFrames);
    const currentValue = Math.round(progress * percentage);
    
    percentElement.text(`${currentValue}%`);
    requestAnimationFrame(counterAnimation);
  };
  
  requestAnimationFrame(counterAnimation);
  
  // Информация о суммах под процентом с улучшенной стилизацией
  textContainer.append('div')
    .style('font-size', '0.85rem')
    .style('color', '#94a3b8')
    .style('margin-top', '2px')
    .style('letter-spacing', '0.5px')
    .text('выполнения плана');
    
  // Добавляем пояснительную информацию под круговым индикатором
  const detailsContainer = container.append('div')
    .style('display', 'flex')
    .style('flex-direction', 'column')
    .style('width', '100%')
    .style('max-width', '280px')
    .style('margin-top', '20px')
    .style('background', 'rgba(30, 41, 59, 0.5)')
    .style('border-radius', '8px')
    .style('padding', '15px')
    .style('border', '1px solid rgba(59, 130, 246, 0.1)')
    .style('backdrop-filter', 'blur(4px)');
    
  // Информация о текущей и целевой сумме с улучшенной типографикой
  detailsContainer.append('div')
    .style('display', 'flex')
    .style('justify-content', 'space-between')
    .style('margin-bottom', '10px')
    .html(`
      <span style="color: #94a3b8; font-size: 0.9rem;">Текущая сумма:</span>
      <span style="color: #f9fafb; font-size: 0.9rem; font-weight: 600; letter-spacing: 0.5px; 
        background: linear-gradient(90deg, ${mainColor}, ${lighterColor}); 
        -webkit-background-clip: text; background-clip: text; color: transparent;">
        ${formatCurrency(totalEarned)}
      </span>
    `);
    
  detailsContainer.append('div')
    .style('display', 'flex')
    .style('justify-content', 'space-between')
    .style('margin-bottom', '15px')
    .html(`
      <span style="color: #94a3b8; font-size: 0.9rem;">Целевая сумма:</span>
      <span style="color: #f9fafb; font-size: 0.9rem; font-weight: 600;">${formatCurrency(targetAmount)}</span>
    `);
    
  // Добавляем индикатор остатка
  const remainingAmount = Math.max(0, targetAmount - totalEarned);
  const remainingPercentage = Math.max(0, 100 - percentage);
  
  detailsContainer.append('div')
    .style('display', 'flex')
    .style('justify-content', 'space-between')
    .style('margin-bottom', '15px')
    .html(`
      <span style="color: #94a3b8; font-size: 0.9rem;">Осталось выполнить:</span>
      <span style="color: #f9fafb; font-size: 0.9rem; font-weight: 600;">
        ${formatCurrency(remainingAmount)} <span style="color: #94a3b8;">(${remainingPercentage}%)</span>
      </span>
    `);
    
  // Добавляем прогресс-бар для визуализации остатка
  const remainingBarContainer = detailsContainer.append('div')
    .style('width', '100%')
    .style('height', '6px')
    .style('background', 'rgba(30, 41, 59, 0.8)')
    .style('border-radius', '3px')
    .style('overflow', 'hidden')
    .style('margin-bottom', '15px');
    
  remainingBarContainer.append('div')
    .style('width', `${percentage}%`)
    .style('height', '100%')
    .style('background', `linear-gradient(to right, ${darkerColor}, ${mainColor})`)
    .style('border-radius', '3px')
    .style('transform', 'scaleX(0)')
    .style('transform-origin', 'left')
    .style('transition', 'transform 1s ease-out')
    .transition()
    .duration(1000)
    .delay(800)
    .style('transform', 'scaleX(1)');
    
  // Добавляем статус-сообщение с улучшенной логикой и информативностью
  const getStatusMessage = (percent) => {
    if (percent >= 100) return { text: 'План полностью выполнен!', color: '#10b981', icon: '✅' };
    if (percent >= 90) return { text: 'Отличный результат, почти выполнено', color: '#3b82f6', icon: '🎯' };
    if (percent >= 80) return { text: 'Хороший прогресс, близко к цели', color: '#6366f1', icon: '📈' };
    if (percent >= 70) return { text: 'Уверенное движение к цели', color: '#8b5cf6', icon: '👍' };
    if (percent >= 50) return { text: 'Средний прогресс, нужно ускориться', color: '#f59e0b', icon: '⚡' };
    if (percent >= 30) return { text: 'Необходимо ускорить темп продаж', color: '#f97316', icon: '⏱️' };
    return { text: 'Требуется значительное улучшение', color: '#ef4444', icon: '⚠️' };
  };
  
  const status = getStatusMessage(percentage);
  
  const statusContainer = detailsContainer.append('div')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('justify-content', 'center')
    .style('padding', '10px')
    .style('background', `${status.color}15`) // Полупрозрачный фон в цвет статуса
    .style('border-radius', '6px')
    .style('border', `1px solid ${status.color}30`);
  
  statusContainer.append('div')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('gap', '8px')
    .html(`
      <span style="font-size: 1.2rem;">${status.icon}</span>
      <span style="color: ${status.color}; font-weight: 600; letter-spacing: 0.3px;">${status.text}</span>
    `);
  
  // Дополнительная информация о расчете с указанием периода
  let periodInfo = '';
  if (displayMode === 'yearly') {
    periodInfo = `Показатель выполнения плана за ${selectedYears[0]} год`;
  } else if (displayMode === 'compare') {
    periodInfo = `Показатель для ${Math.max(...selectedYears)} года`;
  } else {
    const startDate = `${startMonth < 10 ? '0' + startMonth : startMonth}.${startYear}`;
    const endDate = `${endMonth < 10 ? '0' + endMonth : endMonth}.${endYear}`;
    periodInfo = `Показатель для периода ${startDate} - ${endDate}`;
  }
  
  container.append('div')
    .style('font-size', '0.8rem')
    .style('color', '#94a3b8')
    .style('margin-top', '10px')
    .style('text-align', 'center')
    .style('font-style', 'italic')
    .text(periodInfo);
};
const renderDetailsChart = () => {
  if (!detailsChartRef.current || !filteredData.length) return;
  
  // Очистка контейнера
  detailsChartRef.current.innerHTML = '';
  
  // Суммирование данных по типам продаж
  const totalRetail = filteredData.reduce((sum, month) => sum + month.retail, 0);
  const totalWholesale = filteredData.reduce((sum, month) => sum + month.wholesale, 0);
  const totalPromo = filteredData.reduce((sum, month) => sum + month.promo, 0);
  
  // Подготовка данных для пирога с дополнительной валидацией
  const pieData = [
    { id: 'retail', label: SALE_TYPES.RETAIL.name, value: totalRetail, color: SALE_TYPES.RETAIL.color },
    { id: 'wholesale', label: SALE_TYPES.WHOLESALE.name, value: totalWholesale, color: SALE_TYPES.WHOLESALE.color },
    { id: 'promo', label: SALE_TYPES.PROMO.name, value: totalPromo, color: SALE_TYPES.PROMO.color }
  ].filter(item => item.value > 0); // Фильтруем нулевые значения для лучшего отображения
  
  // Проверка наличия данных
  if (pieData.length === 0) {
    detailsChartRef.current.innerHTML = `
      <div style="display:flex;justify-content:center;align-items:center;height:100%;flex-direction:column;">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" 
          stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p style="color:#9ca3af;margin-top:12px;text-align:center;">Нет данных для отображения категорий продаж</p>
      </div>
    `;
    return;
  }
  
  // Отрисовка пирога с дополнительной визуализацией
  const container = detailsChartRef.current;
  const width = container.clientWidth;
  const height = container.clientHeight || 320;
  const margin = { top: 30, right: 120, bottom: 20, left: 20 };
  const radius = Math.min(width - margin.left - margin.right, height - margin.top - margin.bottom) / 2;
  
  // Создаем основной контейнер с улучшенной стилизацией
  const chartContainer = d3.select(container)
    .append('div')
    .style('width', '100%')
    .style('height', '100%')
    .style('background', 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.8) 100%)')
    .style('border-radius', '12px')
    .style('box-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)')
    .style('border', '1px solid rgba(59, 130, 246, 0.1)')
    .style('padding', '15px')
    .style('position', 'relative')
    .style('overflow', 'hidden');
  
  // Добавляем декоративный элемент фона
  chartContainer.append('div')
    .style('position', 'absolute')
    .style('top', '0')
    .style('left', '0')
    .style('width', '100%')
    .style('height', '100%')
    .style('background-image', 'radial-gradient(circle at 10% 90%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)')
    .style('z-index', '0');
  
  // Создаем SVG с улучшенным позиционированием
  const svg = chartContainer.append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('position', 'relative')
    .style('z-index', '1');
  
  // Добавляем заголовок с улучшенной типографикой
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', margin.top / 2)
    .attr('text-anchor', 'middle')
    .style('font-size', '1.1rem')
    .style('font-weight', 'bold')
    .style('fill', '#f9fafb')
    .style('text-shadow', '0 1px 2px rgba(0, 0, 0, 0.2)')
    .text('Структура продаж по категориям');
  
  // Создаем группу для пирога с правильным позиционированием
  const g = svg.append('g')
    .attr('transform', `translate(${(width - margin.right) / 2},${height / 2})`);
  
  // Создаем генератор пирога с улучшенными параметрами
  const pie = d3.pie()
    .sort(null)
    .padAngle(0.03) // Добавляем небольшой отступ между секторами
    .value(d => d.value);
  
  // Создаем арки с улучшенной визуализацией
  const arc = d3.arc()
    .innerRadius(radius * 0.4) // Больший внутренний радиус для пончика
    .outerRadius(radius * 0.9)
    .cornerRadius(6); // Скругление углов секторов
  
  // Функция для анимации дуги при наведении
  const arcHover = d3.arc()
    .innerRadius(radius * 0.38)
    .outerRadius(radius * 0.95)
    .cornerRadius(6);
  
  // Создаем улучшенные градиенты для каждой категории
  pieData.forEach((d, i) => {
    const id = `pie-gradient-${d.id}`;
    
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', id)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%');
      
    // Основной цвет категории
    const baseColor = d3.color(d.color);
    const lighterColor = baseColor.brighter(0.5);
    const darkerColor = baseColor.darker(0.3);
      
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', lighterColor.toString())
      .attr('stop-opacity', 0.95);
      
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', darkerColor.toString())
      .attr('stop-opacity', 0.85);
    
    // Создаем также градиент для наведения
    const hoverGradientId = `pie-hover-gradient-${d.id}`;
    
    const hoverGradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', hoverGradientId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%');
      
    hoverGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', lighterColor.brighter(0.2).toString())
      .attr('stop-opacity', 1);
      
    hoverGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', baseColor.toString())
      .attr('stop-opacity', 0.9);
  });
  
  // Рассчитываем общую сумму для процентов
  const total = pieData.reduce((sum, d) => sum + d.value, 0);
  
  // Фильтр для свечения при наведении
  svg.append('defs')
    .append('filter')
    .attr('id', 'glow')
    .append('feGaussianBlur')
    .attr('stdDeviation', '3')
    .attr('result', 'coloredBlur');
  
  // Добавляем дуги с улучшенной анимацией и интерактивностью
  const arcs = g.selectAll('.arc')
    .data(pie(pieData))
    .join('g')
    .attr('class', 'arc');
  
  // Добавляем пути с анимацией и улучшенной стилизацией
  const paths = arcs.append('path')
    .attr('fill', d => `url(#pie-gradient-${d.data.id})`)
    .attr('stroke', '#1f2937')
    .attr('stroke-width', 1.5)
    .style('cursor', 'pointer')
    .style('transition', 'filter 0.3s')
    .on('mouseover', function(event, d) {
      d3.select(this)
        .attr('fill', `url(#pie-hover-gradient-${d.data.id})`)
        .transition()
        .duration(200)
        .attr('d', arcHover)
        .style('filter', 'url(#glow)');
          
      // Обновляем центральный текст с анимацией
      centerTextGroup.style('opacity', 0)
        .transition()
        .duration(200)
        .style('opacity', 1);
        
      centerText.text(d3.format(',.0f')(d.data.value));
      subText.text(d.data.label);
      percentText.text(`${d3.format('.1f')((d.data.value / total) * 100)}%`);
      
      // Обновляем иконку в центре
      centerIcon.attr('fill', d.data.color)
        .attr('transform', 'scale(1.2)');
      
      // Подсвечиваем соответствующий элемент легенды
      legendItems.select(`#legend-${d.data.id}`)
        .transition()
        .duration(200)
        .style('font-weight', 'bold')
        .attr('x', 30);
        
      // Выделяем фон легенды
      legendItems.selectAll(`.legend-bg-${d.data.id}`)
        .transition()
        .duration(200)
        .style('opacity', 0.15);
    })
    .on('mouseout', function(event, d) {
      d3.select(this)
        .attr('fill', `url(#pie-gradient-${d.data.id})`)
        .transition()
        .duration(200)
        .attr('d', arc)
        .style('filter', 'none');
          
      // Возвращаем центральный текст
      centerText.text(d3.format(',.0f')(total));
      subText.text('Общий объем');
      percentText.text('100%');
      
      // Возвращаем иконку в нормальное состояние
      centerIcon.attr('fill', '#4b5563')
        .attr('transform', 'scale(1)');
      
      // Возвращаем нормальный вид легенды
      legendItems.selectAll('text')
        .transition()
        .duration(200)
        .style('font-weight', 'normal')
        .attr('x', 25);
        
      // Скрываем фон легенды
      legendItems.selectAll('.legend-bg')
        .transition()
        .duration(200)
        .style('opacity', 0);
    });
  
  // Добавляем анимацию появления с усовершенствованной механикой
  paths.each(function(d) {
    const node = d3.select(this);
    const angleInterpolation = d3.interpolate({startAngle: d.startAngle, endAngle: d.startAngle}, d);
    
    node
      .attr('d', arc({startAngle: d.startAngle, endAngle: d.startAngle}))
      .transition()
      .duration(800)
      .delay(d.index * 150)
      .attrTween('d', () => t => arc(angleInterpolation(t)));
  });
  
  // Добавляем группу для центрального текста
  const centerTextGroup = g.append('g')
    .attr('text-anchor', 'middle');
  
  // Добавляем круглый фон для центрального текста
  centerTextGroup.append('circle')
    .attr('r', radius * 0.35)
    .attr('fill', 'rgba(30, 41, 59, 0.7)')
    .attr('stroke', 'rgba(59, 130, 246, 0.3)')
    .attr('stroke-width', 1);
  
  // Добавляем иконку в центр
  const centerIcon = centerTextGroup.append('path')
    .attr('d', 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1.93.82 1.62 2.02 1.62 1.19 0 1.78-.65 1.78-1.34 0-.68-.33-1.18-1.88-1.54-1.67-.38-3.48-.94-3.48-3.02 0-1.62 1.38-2.84 3.02-3.2V5h2.67v2.12c1.57.32 2.62 1.62 2.63 3.22h-1.97c-.07-.9-.67-1.56-1.73-1.56-1.04 0-1.7.58-1.7 1.27 0 .69.44 1.09 2.03 1.48 1.99.46 3.28 1.31 3.28 3.16 0 1.45-1.17 2.77-2.69 3.4z')
    .attr('transform', 'translate(-12, -12) scale(1.2)') // Центрируем иконку
    .attr('fill', '#4b5563');
  
  // Добавляем текст для общей суммы
  const centerText = centerTextGroup.append('text')
    .attr('dy', '0.5em')
    .style('font-size', '1.5rem')
    .style('font-weight', 'bold')
    .style('fill', '#f9fafb')
    .style('letter-spacing', '0.5px')
    .text(d3.format(',.0f')(total));
  
  // Добавляем подтекст с названием категории
  const subText = centerTextGroup.append('text')
    .attr('dy', '3em')
    .style('font-size', '0.9rem')
    .style('fill', '#94a3b8')
    .text('Общий объем');
  
  // Добавляем текст процента
  const percentText = centerTextGroup.append('text')
    .attr('dy', '-1.5em')
    .style('font-size', '1.2rem')
    .style('fill', '#60a5fa')
    .style('font-weight', '600')
    .text('100%');
  
  // Добавляем улучшенную легенду с расширенными данными
  const legendGroup = svg.append('g')
    .attr('transform', `translate(${width - margin.right + 20}, ${height / 2 - (pieData.length * 30) / 2})`)
    .style('font-size', '0.9rem');
  
  // Добавляем заголовок легенды
  legendGroup.append('text')
    .attr('x', 0)
    .attr('y', -25)
    .style('font-size', '0.9rem')
    .style('fill', '#94a3b8')
    .style('font-weight', 'bold')
    .text('Категории продаж');
  
  // Добавляем элементы легенды с улучшенным форматированием
  const legendItems = legendGroup.selectAll('.legend-item')
    .data(pieData)
    .join('g')
    .attr('class', 'legend-item')
    .attr('transform', (d, i) => `translate(0, ${i * 30})`)
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      // Находим соответствующий сегмент
      const segment = paths.filter(p => p.data.id === d.id);
      
      // Имитируем наведение на сегмент
      segment
        .attr('fill', `url(#pie-hover-gradient-${d.id})`)
        .transition()
        .duration(200)
        .attr('d', arcHover)
        .style('filter', 'url(#glow)');
      
      // Обновляем центральный текст
      centerText.text(d3.format(',.0f')(d.value));
      subText.text(d.label);
      percentText.text(`${d3.format('.1f')((d.value / total) * 100)}%`);
      
      // Обновляем иконку в центре
      centerIcon.attr('fill', d.color)
        .attr('transform', 'scale(1.2)');
      
      // Выделяем текущий элемент легенды
      d3.select(this).select('text')
        .transition()
        .duration(200)
        .style('font-weight', 'bold')
        .attr('x', 30);
        
      // Показываем фон текущего элемента
      d3.select(this).select('.legend-bg')
        .transition()
        .duration(200)
        .style('opacity', 0.15);
    })
    .on('mouseout', function(event, d) {
      // Находим соответствующий сегмент
      const segment = paths.filter(p => p.data.id === d.id);
      
      // Возвращаем нормальный вид сегмента
      segment
        .attr('fill', `url(#pie-gradient-${d.id})`)
        .transition()
        .duration(200)
        .attr('d', arc)
        .style('filter', 'none');
      
      // Возвращаем центральный текст
      centerText.text(d3.format(',.0f')(total));
      subText.text('Общий объем');
      percentText.text('100%');
      
      // Возвращаем иконку в нормальное состояние
      centerIcon.attr('fill', '#4b5563')
        .attr('transform', 'scale(1)');
      
      // Возвращаем нормальный вид легенды
      d3.select(this).select('text')
        .transition()
        .duration(200)
        .style('font-weight', 'normal')
        .attr('x', 25);
        
      // Скрываем фон
      d3.select(this).select('.legend-bg')
        .transition()
        .duration(200)
        .style('opacity', 0);
    });
  
  // Добавляем фон для элементов легенды
  legendItems.append('rect')
    .attr('class', d => `legend-bg legend-bg-${d.id}`)
    .attr('x', -5)
    .attr('y', -15)
    .attr('width', 100)
    .attr('height', 28)
    .attr('rx', 4)
    .attr('fill', d => d.color)
    .style('opacity', 0);
  
  // Добавляем маркеры и текст легенды с улучшенной стилизацией
  legendItems.append('rect')
    .attr('width', 15)
    .attr('height', 15)
    .attr('rx', 3)
    .attr('fill', d => d.color)
    .style('filter', 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))');
  
  legendItems.append('text')
    .attr('id', d => `legend-${d.id}`)
    .attr('x', 25)
    .attr('y', 12)
    .style('fill', '#f9fafb')
    .text(d => d.label);
  
  // Добавляем данные о суммах и процентах
  legendItems.append('text')
    .attr('x', 0)
    .attr('y', 30)
    .style('font-size', '0.8rem')
    .style('fill', d => d.color)
    .text(d => {
      const percentage = ((d.value / total) * 100).toFixed(1);
      return `${d3.format(',.0f')(d.value)} UZS (${percentage}%)`;
    });
  
  // Добавляем интерактивные элементы управления
  const controlPanel = chartContainer.append('div')
    .style('position', 'absolute')
    .style('top', '10px')
    .style('right', '10px')
    .style('display', 'flex')
    .style('gap', '8px');
  
  // Кнопка экспорта данных
  const exportButton = controlPanel.append('button')
    .style('background', 'rgba(30, 41, 59, 0.7)')
    .style('border', 'none')
    .style('color', '#9ca3af')
    .style('cursor', 'pointer')
    .style('width', '28px')
    .style('height', '28px')
    .style('border-radius', '4px')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('justify-content', 'center')
    .style('transition', 'all 0.2s')
    .attr('title', 'Экспорт данных')
    .html('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>')
    .on('mouseover', function() {
      d3.select(this)
        .style('background', 'rgba(59, 130, 246, 0.3)')
        .style('color', '#f9fafb');
    })
    .on('mouseout', function() {
      d3.select(this)
        .style('background', 'rgba(30, 41, 59, 0.7)')
        .style('color', '#9ca3af');
    })
    .on('click', function() {
      // Логика экспорта данных
      exportChartData(pieData, 'strukturaProdazh');
    });
};

// Вспомогательная функция для экспорта данных
const exportChartData = (data, filename) => {
  const csvContent = "data:text/csv;charset=utf-8," 
    + "Категория,Значение,Процент\n"
    + data.map(item => {
        const total = data.reduce((sum, d) => sum + d.value, 0);
        const percentage = ((item.value / total) * 100).toFixed(2);
        return `${item.label},${item.value},${percentage}%`;
      }).join("\n");
    
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
  
const renderYearlyTrendChart = () => {
  if (!yearlyTrendChartRef.current || Object.keys(financialData).length === 0) return;
  
  // Очистка контейнера
  yearlyTrendChartRef.current.innerHTML = '';
  
  // Подготовка данных для линейного графика с проверкой на валидность
  const yearlyData = Object.entries(financialData)
    .filter(([year, data]) => data && data.totalEarned !== undefined)
    .map(([year, data]) => ({
      x: parseInt(year),
      y: data.totalEarned,
      rawData: data
    }));
  
  // Проверка наличия достаточного количества данных для отображения тренда
  if (yearlyData.length < 2) {
    yearlyTrendChartRef.current.innerHTML = `
      <div style="display:flex;justify-content:center;align-items:center;height:100%;flex-direction:column;
        background:linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.8) 100%);
        border-radius:12px;padding:20px;border:1px solid rgba(59, 130, 246, 0.1);">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" 
          stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="2" x2="12" y2="6"></line>
          <line x1="12" y1="18" x2="12" y2="22"></line>
          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
          <line x1="2" y1="12" x2="6" y2="12"></line>
          <line x1="18" y1="12" x2="22" y2="12"></line>
          <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
          <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
        </svg>
        <p style="color:#9ca3af;margin-top:12px;text-align:center;">Недостаточно данных для построения тренда по годам</p>
        <p style="color:#6b7280;margin-top:6px;font-size:0.85rem;text-align:center;">Необходимо минимум 2 года данных</p>
      </div>
    `;
    return;
  }
  
  // Сортировка по годам для правильного отображения тренда
  yearlyData.sort((a, b) => a.x - b.x);
  
  // Если есть данные по категориям, добавляем их
  const retailData = Object.entries(financialData)
    .filter(([year, data]) => data && data.categories && data.categories.retail !== undefined)
    .map(([year, data]) => ({
      x: parseInt(year),
      y: data.categories.retail
    }))
    .sort((a, b) => a.x - b.x);
  
  const wholesaleData = Object.entries(financialData)
    .filter(([year, data]) => data && data.categories && data.categories.wholesale !== undefined)
    .map(([year, data]) => ({
      x: parseInt(year),
      y: data.categories.wholesale
    }))
    .sort((a, b) => a.x - b.x);
  
  const promoData = Object.entries(financialData)
    .filter(([year, data]) => data && data.categories && data.categories.promo !== undefined)
    .map(([year, data]) => ({
      x: parseInt(year),
      y: data.categories.promo
    }))
    .sort((a, b) => a.x - b.x);
  
  // Создаем улучшенный стек-график с интерактивностью
  const container = yearlyTrendChartRef.current;
  
  // Создаем основной контейнер с улучшенным стилем
  const chartContainer = d3.select(container)
    .append('div')
    .style('width', '100%')
    .style('height', '100%')
    .style('background', 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.8) 100%)')
    .style('border-radius', '12px')
    .style('box-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)')
    .style('border', '1px solid rgba(59, 130, 246, 0.1)')
    .style('position', 'relative');
  
  // Добавляем декоративный элемент фона
  chartContainer.append('div')
    .style('position', 'absolute')
    .style('top', '0')
    .style('left', '0')
    .style('width', '100%')
    .style('height', '100%')
    .style('background-image', 'radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)')
    .style('z-index', '0');
  
  const width = container.clientWidth;
  const height = container.clientHeight || 240;
  const margin = { top: 40, right: 80, bottom: 40, left: 60 };
  
  // Создаем SVG с правильным позиционированием
  const svg = chartContainer.append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('position', 'relative')
    .style('z-index', '1');
  
  // Добавляем заголовок с улучшенной типографикой
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', margin.top / 2)
    .attr('text-anchor', 'middle')
    .style('font-size', '1.1rem')
    .style('font-weight', 'bold')
    .style('fill', '#f9fafb')
    .style('text-shadow', '0 1px 2px rgba(0, 0, 0, 0.2)')
    .text(`Тренд продаж за ${yearlyData[0].x}–${yearlyData[yearlyData.length - 1].x} годы`);
  
  // Создаем шкалы с улучшенными параметрами
  const x = d3.scaleLinear()
    .domain([
      d3.min(yearlyData, d => d.x) - 0.5, 
      d3.max(yearlyData, d => d.x) + 0.5
    ]) // Добавляем отступ с обеих сторон
    .range([margin.left, width - margin.right]);
  
  // Находим максимальное значение среди всех наборов данных
  const maxValue = d3.max([
    d3.max(yearlyData, d => d.y),
    retailData.length ? d3.max(retailData, d => d.y) : 0,
    wholesaleData.length ? d3.max(wholesaleData, d => d.y) : 0,
    promoData.length ? d3.max(promoData, d => d.y) : 0
  ]) * 1.15; // Добавляем отступ сверху
  
  const y = d3.scaleLinear()
    .domain([0, maxValue])
    .nice()
    .range([height - margin.bottom, margin.top]);
  
  // Создаем улучшенные оси
  const xAxis = g => g
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x)
      .ticks(yearlyData.length)
      .tickFormat(d => Math.floor(d) === d ? d : ''))
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('text')
      .style('fill', '#d1d5db')
      .style('font-size', '0.85rem')
      .style('font-weight', 'bold'));
  
  const yAxis = g => g
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y)
      .ticks(5)
      .tickFormat(d => d3.format(".2s")(d)
        .replace(/G/, ' млрд')
        .replace(/M/, ' млн')
        .replace(/k/, ' тыс.')))
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('text')
      .style('fill', '#d1d5db')
      .style('font-size', '0.8rem'))
    .call(g => g.selectAll('.tick line')
      .attr('x2', width - margin.left - margin.right)
      .attr('stroke', 'rgba(148, 163, 184, 0.1)')
      .attr('stroke-dasharray', '2,2'));
  
  // Добавляем оси
  svg.append('g').call(xAxis);
  svg.append('g').call(yAxis);
  
  // Добавляем надпись на оси Y
  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height/2)
    .attr('y', margin.left/3)
    .attr('text-anchor', 'middle')
    .style('fill', '#9ca3af')
    .style('font-size', '0.8rem')
    .text('Объем продаж, сум');
  
  // Создаем область для заполнения с градиентом
  const areaGradient = svg.append('defs')
    .append('linearGradient')
    .attr('id', 'area-gradient')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '0%')
    .attr('y2', '100%');
    
  areaGradient.append('stop')
    .attr('offset', '0%')
    .attr('stop-color', '#3b82f6')
    .attr('stop-opacity', 0.7);
    
  areaGradient.append('stop')
    .attr('offset', '80%')
    .attr('stop-color', '#3b82f6')
    .attr('stop-opacity', 0.05);
  
  // Определяем область для заполнения под линией
  const area = d3.area()
    .x(d => x(d.x))
    .y0(height - margin.bottom)
    .y1(d => y(d.y))
    .curve(d3.curveMonotoneX); // Используем кривую, которая сохраняет монотонность
  
  // Добавляем заполненную область под линией основного тренда
  const areaPath = svg.append('path')
    .datum(yearlyData)
    .attr('fill', 'url(#area-gradient)')
    .attr('d', area)
    .style('opacity', 0) // Начинаем с прозрачного
    .transition()
    .duration(1000)
    .style('opacity', 1);
  
  // Создаем основную линию тренда
  const line = d3.line()
    .x(d => x(d.x))
    .y(d => y(d.y))
    .curve(d3.curveMonotoneX);
  
  // Добавляем линию тренда с улучшенной стилизацией
  const totalPath = svg.append('path')
    .datum(yearlyData)
    .attr('fill', 'none')
    .attr('stroke', '#3b82f6')
    .attr('stroke-width', 3)
    .attr('stroke-linejoin', 'round')
    .attr('stroke-linecap', 'round')
    .attr('d', line)
    .style('filter', 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.2))');
  
  // Анимация появления линии
  const totalLength = totalPath.node().getTotalLength();
  
  totalPath
    .attr('stroke-dasharray', totalLength + ' ' + totalLength)
    .attr('stroke-dashoffset', totalLength)
    .transition()
    .duration(1500)
    .ease(d3.easeLinear)
    .attr('stroke-dashoffset', 0)
    .on('end', () => {
      // Удаляем пунктирную линию после завершения анимации
      totalPath.attr('stroke-dasharray', 'none');
    });
  
  // Создаем группу для точек на графике
  const pointsGroup = svg.append('g');
  
  // Добавляем точки на линию с анимацией появления и интерактивностью
  const points = pointsGroup.selectAll('.data-point')
    .data(yearlyData)
    .join('g')
    .attr('class', 'data-point')
    .attr('transform', d => `translate(${x(d.x)}, ${y(d.y)})`)
    .style('cursor', 'pointer');
  
  // Добавляем невидимые большие круги для лучшего взаимодействия
  points.append('circle')
    .attr('r', 15)
    .attr('fill', 'transparent')
    .style('pointer-events', 'all');
  
  // Добавляем видимые маленькие круги с базовым стилем
  const visiblePoints = points.append('circle')
    .attr('r', 0) // Начинаем с нулевого радиуса для анимации
    .attr('fill', '#3b82f6')
    .attr('stroke', '#1e293b')
    .attr('stroke-width', 2)
    .transition()
    .duration(300)
    .delay((_, i) => i * 200 + 1500) // Появляются после линии
    .attr('r', 6);
  
  // Создаем всплывающие подсказки для точек
  const tooltip = d3.select(container)
    .append('div')
    .attr('class', 'chart-tooltip')
    .style('position', 'absolute')
    .style('visibility', 'hidden')
    .style('background', 'rgba(15, 23, 42, 0.95)')
    .style('color', '#f9fafb')
    .style('padding', '10px 15px')
    .style('border-radius', '6px')
    .style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.3)')
    .style('border', '1px solid rgba(59, 130, 246, 0.3)')
    .style('font-size', '0.85rem')
    .style('z-index', 10)
    .style('pointer-events', 'none')
    .style('transform', 'translate(-50%, -100%)')
    .style('transition', 'opacity 0.2s, transform 0.2s')
    .style('opacity', 0);
  
  // Добавляем интерактивность к точкам
  points
    .on('mouseover', function(event, d) {
      // Показываем подсказку
      tooltip
        .style('visibility', 'visible')
        .style('opacity', 1)
        .style('transform', 'translate(-50%, -110%)')
        .html(`
          <div style="margin-bottom: 5px;font-weight:bold;color:#60a5fa">${d.x} год</div>
          <div style="display:flex;justify-content:space-between;gap:10px;margin-bottom:3px">
            <span>Общий объем:</span>
            <span style="font-weight:600">${formatCurrency(d.y)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;gap:10px;margin-bottom:3px">
            <span>Розница:</span>
            <span style="font-weight:600;color:${SALE_TYPES.RETAIL.color}">
              ${formatCurrency(d.rawData.categories?.retail || 0)}
            </span>
          </div>
          <div style="display:flex;justify-content:space-between;gap:10px">
            <span>Опт:</span>
            <span style="font-weight:600;color:${SALE_TYPES.WHOLESALE.color}">
              ${formatCurrency(d.rawData.categories?.wholesale || 0)}
            </span>
          </div>
        `)
        .style('left', `${x(d.x)}px`)
        .style('top', `${y(d.y) - 10}px`);
      
      // Увеличиваем текущую точку
      d3.select(this).select('circle')
        .transition()
        .duration(200)
        .attr('r', 8)
        .attr('fill', '#60a5fa');
        
      // Добавляем пульсацию
      d3.select(this).append('circle')
        .attr('r', 6)
        .attr('fill', 'rgba(59, 130, 246, 0.2)')
        .style('pointer-events', 'none')
        .transition()
        .duration(1000)
        .attr('r', 20)
        .style('opacity', 0)
        .remove();
    })
    .on('mouseout', function() {
      // Скрываем подсказку
      tooltip
        .style('opacity', 0)
        .style('transform', 'translate(-50%, -100%)')
        .transition()
        .duration(200)
        .style('visibility', 'hidden');
      
      // Возвращаем точку в нормальное состояние
      d3.select(this).select('circle')
        .transition()
        .duration(200)
        .attr('r', 6)
        .attr('fill', '#3b82f6');
    })
    .on('mousemove', function(event, d) {
      // Обновляем позицию подсказки
      tooltip
        .style('left', `${event.layerX}px`)
        .style('top', `${y(d.y) - 10}px`);
    });
  
  // Добавляем подписи к точкам
  const pointLabels = pointsGroup.selectAll('.point-label')
    .data(yearlyData)
    .join('text')
    .attr('class', 'point-label')
    .attr('x', d => x(d.x))
    .attr('y', d => y(d.y) - 15)
    .attr('text-anchor', 'middle')
    .style('font-size', '0.75rem')
    .style('font-weight', 'bold')
    .style('fill', '#f9fafb')
    .style('opacity', 0)
    .style('pointer-events', 'none')
    .style('text-shadow', '0 1px 3px rgba(0, 0, 0, 0.3)')
    .text(d => formatProfitCompact(d.y));
  
  // Анимация появления подписей
  pointLabels
    .transition()
    .duration(300)
    .delay((_, i) => i * 200 + 1800) // Появляются после точек
    .style('opacity', 1);
  
  // Добавляем дополнительные линии по категориям, если выбраны все категории
  if (focusCategory === 'all' && retailData.length > 0 && wholesaleData.length > 0) {
    // Создаем линии для категорий
    const createCategoryLine = (data, color, id) => {
      // Создаем линию
      const path = svg.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '3,3')
        .attr('d', line)
        .style('opacity', 0);
      
      // Анимация появления
      path
        .transition()
        .duration(800)
        .delay(2000 + (id * 200))
        .style('opacity', 0.7);
      
      return path;
    };
    
    // Создаем линии для категорий
    const retailPath = createCategoryLine(retailData, SALE_TYPES.RETAIL.color, 1);
    const wholesalePath = createCategoryLine(wholesaleData, SALE_TYPES.WHOLESALE.color, 2);
    const promoPath = promoData.length > 0 ? 
      createCategoryLine(promoData, SALE_TYPES.PROMO.color, 3) : null;
    
    // Добавляем легенду
    const legend = svg.append('g')
      .attr('transform', `translate(${width - margin.right + 10}, ${margin.top + 10})`);
    
    // Создаем элементы легенды
    const createLegendItem = (y, label, color, dashed = false) => {
      const item = legend.append('g')
        .attr('transform', `translate(0, ${y})`)
        .style('cursor', 'pointer')
        .on('mouseover', function() {
          d3.select(this).select('text')
            .transition()
            .duration(200)
            .style('font-weight', 'bold');
        })
        .on('mouseout', function() {
          d3.select(this).select('text')
            .transition()
            .duration(200)
            .style('font-weight', 'normal');
        });
      
      // Линия легенды
      item.append('line')
        .attr('x1', 0)
        .attr('x2', 20)
        .attr('y1', 0)
        .attr('y2', 0)
        .attr('stroke', color)
        .attr('stroke-width', dashed ? 2 : 3)
        .attr('stroke-dasharray', dashed ? '3,3' : null);
      
      // Текст легенды
      item.append('text')
        .attr('x', 25)
        .attr('y', 4)
        .style('font-size', '0.8rem')
        .style('fill', '#d1d5db')
        .text(label);
      
      return item;
    };
    
    // Добавляем элементы легенды
    const totalLegend = createLegendItem(0, 'Общие продажи', '#3b82f6');
    const retailLegend = createLegendItem(20, 'Розница', SALE_TYPES.RETAIL.color, true);
    const wholesaleLegend = createLegendItem(40, 'Опт', SALE_TYPES.WHOLESALE.color, true);
    
    if (promoData.length > 0) {
      const promoLegend = createLegendItem(60, 'Акции', SALE_TYPES.PROMO.color, true);
    }
    
    // Добавляем интерактивность к легенде
    totalLegend.on('click', function() {
      const currentOpacity = totalPath.style('opacity');
      const newOpacity = currentOpacity == 1 ? 0.2 : 1;
      
      totalPath.transition()
        .duration(300)
        .style('opacity', newOpacity);
        
      areaPath.transition()
        .duration(300)
        .style('opacity', newOpacity);
        
      d3.select(this).select('line')
        .transition()
        .duration(300)
        .attr('stroke-opacity', newOpacity);
    });
    
    retailLegend.on('click', function() {
      const currentOpacity = retailPath.style('opacity');
      const newOpacity = currentOpacity > 0.5 ? 0.2 : 0.7;
      
      retailPath.transition()
        .duration(300)
        .style('opacity', newOpacity);
        
      d3.select(this).select('line')
        .transition()
        .duration(300)
        .attr('stroke-opacity', newOpacity > 0.5 ? 1 : 0.5);
    });
    
    wholesaleLegend.on('click', function() {
      const currentOpacity = wholesalePath.style('opacity');
      const newOpacity = currentOpacity > 0.5 ? 0.2 : 0.7;
      
      wholesalePath.transition()
        .duration(300)
        .style('opacity', newOpacity);
        
      d3.select(this).select('line')
        .transition()
        .duration(300)
        .attr('stroke-opacity', newOpacity > 0.5 ? 1 : 0.5);
    });
    
    if (promoPath) {
      legend.selectAll('.legend-item').filter((d, i) => i === 3)
        .on('click', function() {
          const currentOpacity = promoPath.style('opacity');
          const newOpacity = currentOpacity > 0.5 ? 0.2 : 0.7;
          
          promoPath.transition()
            .duration(300)
            .style('opacity', newOpacity);
            
          d3.select(this).select('line')
            .transition()
            .duration(300)
            .attr('stroke-opacity', newOpacity > 0.5 ? 1 : 0.5);
        });
    }
  }
  
  // Добавляем анализ тренда
  if (yearlyData.length >= 3) {
    // Вычисляем изменение за последний год
    const lastYearChange = yearlyData[yearlyData.length - 1].y / yearlyData[yearlyData.length - 2].y;
    const percentChange = ((lastYearChange - 1) * 100).toFixed(1);
    
    // Вычисляем средний рост за все годы
    const firstYear = yearlyData[0].y;
    const lastYear = yearlyData[yearlyData.length - 1].y;
    const yearsCount = yearlyData.length - 1;
    const averageGrowthRate = ((Math.pow(lastYear / firstYear, 1 / yearsCount) - 1) * 100).toFixed(1);
    
    // Добавляем блок с аналитикой
    const analyticsBlock = chartContainer.append('div')
      .style('position', 'absolute')
      .style('bottom', '10px')
      .style('left', '10px')
      .style('background', 'rgba(15, 23, 42, 0.8)')
      .style('border-radius', '6px')
      .style('padding', '8px 12px')
      .style('border', '1px solid rgba(59, 130, 246, 0.2)')
      .style('font-size', '0.8rem')
      .style('max-width', '220px');
    
    // Определяем цвет и иконку для роста/падения
    const growthColor = percentChange >= 0 ? '#10b981' : '#ef4444';
    const growthIcon = percentChange >= 0 ? '↗' : '↘';
    
    analyticsBlock.html(`
      <div style="margin-bottom:6px;color:#d1d5db;font-weight:bold">Аналитика тренда:</div>
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <span style="color:#9ca3af">Изменение за год:</span>
        <span style="color:${growthColor};font-weight:bold">${growthIcon} ${percentChange}%</span>
      </div>
      <div style="display:flex;justify-content:space-between">
        <span style="color:#9ca3af">Средний рост:</span>
        <span style="color:#60a5fa;font-weight:bold">${averageGrowthRate}% в год</span>
      </div>
    `);
  }
  
  // Добавляем элементы управления графиком
  const controls = chartContainer.append('div')
    .style('position', 'absolute')
    .style('top', '10px')
    .style('right', '10px')
    .style('display', 'flex')
    .style('gap', '5px');
  
  // Кнопка экспорта данных
  const exportButton = controls.append('button')
    .style('background', 'rgba(30, 41, 59, 0.7)')
    .style('border', 'none')
    .style('color', '#9ca3af')
    .style('cursor', 'pointer')
    .style('width', '28px')
    .style('height', '28px')
    .style('border-radius', '4px')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('justify-content', 'center')
    .style('transition', 'all 0.2s')
    .attr('title', 'Экспорт данных')
    .html('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>')
    .on('mouseover', function() {
      d3.select(this)
        .style('background', 'rgba(59, 130, 246, 0.3)')
        .style('color', '#f9fafb');
    })
    .on('mouseout', function() {
      d3.select(this)
        .style('background', 'rgba(30, 41, 59, 0.7)')
        .style('color', '#9ca3af');
    })
    .on('click', function() {
      // Экспорт данных в CSV
      exportTrendData(yearlyData, 'trend_analysis');
    });
    
  // Функция для экспорта данных тренда
  function exportTrendData(data, filename) {
    // Формируем CSV строку
    let csvContent = "data:text/csv;charset=utf-8,Год,Общие продажи,Розница,Опт,Акции\n";
    
    data.forEach(d => {
      csvContent += `${d.x},${d.y},${d.rawData.categories?.retail || 0},${d.rawData.categories?.wholesale || 0},${d.rawData.categories?.promo || 0}\n`;
    });
    
    // Создаем ссылку для скачивания
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
const renderForecastChart = () => {
  if (!forecastChartRef.current || Object.keys(financialData).length === 0) return;
  
  const container = forecastChartRef.current;
  container.innerHTML = '';
  
  // Создаем основной контейнер с улучшенной стилизацией
  const chartContainer = d3.select(container)
    .append('div')
    .style('width', '100%')
    .style('height', '100%')
    .style('background', 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.8) 100%)')
    .style('border-radius', '12px')
    .style('box-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)')
    .style('border', '1px solid rgba(59, 130, 246, 0.1)')
    .style('position', 'relative')
    .style('overflow', 'hidden');
  
  // Добавляем декоративный элемент фона
  chartContainer.append('div')
    .style('position', 'absolute')
    .style('top', '0')
    .style('left', '0')
    .style('width', '100%')
    .style('height', '100%')
    .style('background-image', 'radial-gradient(circle at 90% 90%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)')
    .style('z-index', '0');
  
  const width = container.clientWidth;
  const height = container.clientHeight || 250;
  const margin = { top: 40, right: 80, bottom: 50, left: 60 };
  
  // Создаем SVG с правильным позиционированием
  const svg = chartContainer.append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('position', 'relative')
    .style('z-index', '1');
  
  // Добавляем заголовок с улучшенной типографикой
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', margin.top / 2)
    .attr('text-anchor', 'middle')
    .style('font-size', '1.1rem')
    .style('font-weight', 'bold')
    .style('fill', '#f9fafb')
    .style('text-shadow', '0 1px 2px rgba(0, 0, 0, 0.2)')
    .text('Прогноз на следующий год');
  
  // Подготовка данных для прогноза
  const lastYear = Math.max(...Object.keys(financialData).map(Number));
  const lastYearData = financialData[lastYear];
  
  if (!lastYearData) {
    // Отображаем информацию, если данные отсутствуют
    chartContainer.append('div')
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('align-items', 'center')
      .style('justify-content', 'center')
      .style('height', '100%')
      .style('padding', '20px')
      .html(`
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" 
          stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p style="color:#9ca3af;margin-top:12px;text-align:center;">Недостаточно данных для построения прогноза</p>
      `);
    return;
  }
  
  // Собираем фактические данные с улучшенной валидацией
  const actualData = lastYearData.months.map((month, index) => ({
    month: index + 1,
    name: MONTHS[index],
    value: focusCategory === 'all' ? month.total : month[focusCategory] || 0,
    year: lastYear
  }));
  
  // Анализируем данные для более точного прогноза
  const calculateGrowthTrend = () => {
    // Ищем данные за предыдущий год для анализа тренда
    const prevYear = lastYear - 1;
    const prevYearData = financialData[prevYear];
    
    // Если есть данные за предыдущий год, рассчитываем тренд
    if (prevYearData) {
      let totalGrowth = 0;
      let monthsWithData = 0;
      
      prevYearData.months.forEach((month, index) => {
        const prevValue = focusCategory === 'all' ? month.total : month[focusCategory] || 0;
        const currentValue = actualData[index].value;
        
        // Учитываем только месяцы с ненулевыми значениями
        if (prevValue > 0 && currentValue > 0) {
          totalGrowth += (currentValue / prevValue);
          monthsWithData++;
        }
      });
      
      // Вычисляем средний рост
      if (monthsWithData > 0) {
        const averageGrowth = totalGrowth / monthsWithData;
        return averageGrowth;
      }
    }
    
    // Если нет данных за предыдущий год, используем базовый коэффициент роста
    return 1.15; // 15% рост
  };
  
  // Получаем средний коэффициент роста на основе исторических данных
  const growthFactor = calculateGrowthTrend();
  
  // Определяем сезонность (на основе колебаний в текущем году)
  const calculateSeasonality = () => {
    // Вычисляем среднее значение по месяцам
    const average = actualData.reduce((sum, month) => sum + month.value, 0) / actualData.length;
    
    // Рассчитываем сезонные коэффициенты для каждого месяца
    return actualData.map(month => ({
      month: month.month,
      factor: average > 0 ? month.value / average : 1
    }));
  };
  
  const seasonalFactors = calculateSeasonality();
  
  // Создаем прогноз на следующий год с учетом сезонности и тренда
  const forecastData = lastYearData.months.map((month, index) => {
    // Базовый прогноз с учетом роста
    const baseValue = (focusCategory === 'all' ? month.total : month[focusCategory]) * growthFactor;
    
    // Применяем сезонный коэффициент
    const seasonalFactor = seasonalFactors[index].factor;
    
    // Добавляем случайное колебание для реалистичности (±5%)
    const randomVariation = 1 + (Math.random() * 0.1 - 0.05);
    
    return {
      month: index + 1,
      name: MONTHS[index],
      value: baseValue * seasonalFactor * randomVariation,
      year: lastYear + 1
    };
  });
  
  // Объединяем для визуализации с дополнительными метаданными
  const combinedData = [
    ...actualData.map(d => ({ ...d, type: 'actual' })),
    ...forecastData.map(d => ({ ...d, type: 'forecast' }))
  ];
  
  // Добавляем индикаторы качества прогноза
  const confidenceLevel = Math.min(0.9, 0.6 + (Object.keys(financialData).length * 0.1));
  const forecastQuality = confidenceLevel >= 0.8 ? 'высокая' : (confidenceLevel >= 0.7 ? 'средняя' : 'низкая');
  
  // Создаем шкалы с улучшенными параметрами
  const x = d3.scaleLinear()
    .domain([1, 12])
    .range([margin.left, width - margin.right]);
  
  // Находим максимальное значение с запасом для легенд и надписей
  const maxValue = d3.max(combinedData, d => d.value) * 1.15;
  
  const y = d3.scaleLinear()
    .domain([0, maxValue])
    .nice()
    .range([height - margin.bottom, margin.top]);
  
  // Создаем улучшенные оси
  const xAxis = g => g
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x)
      .ticks(12)
      .tickFormat(d => MONTHS[d-1].substring(0, 3)))
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('text')
      .style('fill', '#d1d5db')
      .style('font-size', '0.8rem')
      .attr('transform', 'rotate(-30)')
      .attr('text-anchor', 'end')
      .attr('dx', '-0.8em')
      .attr('dy', '0.15em'));
  
  const yAxis = g => g
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y)
      .ticks(5)
      .tickFormat(d => formatProfitCompact(d)))
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('text')
      .style('fill', '#d1d5db')
      .style('font-size', '0.8rem'))
    .call(g => g.selectAll('.tick line')
      .attr('x2', width - margin.left - margin.right)
      .attr('stroke', 'rgba(148, 163, 184, 0.1)')
      .attr('stroke-dasharray', '2,2'));
  
  // Добавляем оси
  svg.append('g').call(xAxis);
  svg.append('g').call(yAxis);
  
  // Добавляем вспомогательную сетку
  svg.append('g')
    .selectAll('line')
    .data(y.ticks(5))
    .join('line')
    .attr('x1', margin.left)
    .attr('x2', width - margin.right)
    .attr('y1', d => y(d))
    .attr('y2', d => y(d))
    .attr('stroke', 'rgba(75, 85, 99, 0.1)')
    .attr('stroke-width', 1);
  
  // Создаем градиенты для заливки областей
  // Градиент для фактических данных
  const actualGradient = svg.append('defs')
    .append('linearGradient')
    .attr('id', 'actual-gradient')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '0%')
    .attr('y2', '100%');
    
  actualGradient.append('stop')
    .attr('offset', '0%')
    .attr('stop-color', '#3b82f6')
    .attr('stop-opacity', 0.7);
    
  actualGradient.append('stop')
    .attr('offset', '100%')
    .attr('stop-color', '#3b82f6')
    .attr('stop-opacity', 0.05);
  
  // Градиент для прогнозных данных
  const forecastGradient = svg.append('defs')
    .append('linearGradient')
    .attr('id', 'forecast-gradient')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '0%')
    .attr('y2', '100%');
    
  forecastGradient.append('stop')
    .attr('offset', '0%')
    .attr('stop-color', '#10b981')
    .attr('stop-opacity', 0.6);
    
  forecastGradient.append('stop')
    .attr('offset', '100%')
    .attr('stop-color', '#10b981')
    .attr('stop-opacity', 0.05);
  
  // Создаем функции для построения линий и областей
  const line = d3.line()
    .x(d => x(d.month))
    .y(d => y(d.value))
    .curve(d3.curveMonotoneX);
  
  const area = d3.area()
    .x(d => x(d.month))
    .y0(height - margin.bottom)
    .y1(d => y(d.value))
    .curve(d3.curveMonotoneX);
  
  // Добавляем области под линиями с улучшенной стилизацией
  // Область для фактических данных
  svg.append('path')
    .datum(actualData)
    .attr('fill', 'url(#actual-gradient)')
    .attr('d', area)
    .style('opacity', 0)
    .transition()
    .duration(1000)
    .style('opacity', 0.8);
  
  // Область для прогнозных данных
  svg.append('path')
    .datum(forecastData)
    .attr('fill', 'url(#forecast-gradient)')
    .attr('d', area)
    .style('opacity', 0)
    .transition()
    .duration(1000)
    .delay(800)
    .style('opacity', 0.6);
  
  // Добавляем линии с улучшенной стилизацией и анимацией
  // Линия фактических данных
  const actualLine = svg.append('path')
    .datum(actualData)
    .attr('fill', 'none')
    .attr('stroke', '#3b82f6')
    .attr('stroke-width', 3)
    .attr('stroke-linejoin', 'round')
    .attr('stroke-linecap', 'round')
    .attr('d', line);
  
  // Анимация для фактической линии
  const actualLength = actualLine.node().getTotalLength();
  
  actualLine
    .attr('stroke-dasharray', actualLength + ' ' + actualLength)
    .attr('stroke-dashoffset', actualLength)
    .transition()
    .duration(1500)
    .attr('stroke-dashoffset', 0);
  
  // Линия прогнозных данных
  const forecastLine = svg.append('path')
    .datum(forecastData)
    .attr('fill', 'none')
    .attr('stroke', '#10b981')
    .attr('stroke-width', 2.5)
    .attr('stroke-dasharray', '6,3')
    .attr('d', line)
    .style('opacity', 0);
  
  // Анимация для прогнозной линии
  forecastLine
    .transition()
    .delay(1500)
    .duration(1000)
    .style('opacity', 1);
  
  // Добавляем маркеры с улучшенной интерактивностью
  // Группа для фактических точек
  const actualPoints = svg.append('g')
    .selectAll('.actual-point')
    .data(actualData)
    .join('g')
    .attr('class', 'actual-point')
    .attr('transform', d => `translate(${x(d.month)}, ${y(d.value)})`)
    .style('cursor', 'pointer');
  
  // Добавляем невидимые большие круги для лучшего взаимодействия
  actualPoints.append('circle')
    .attr('r', 15)
    .attr('fill', 'transparent')
    .style('pointer-events', 'all');
  
  // Добавляем видимые маленькие круги
  const actualCircles = actualPoints.append('circle')
    .attr('r', 0)
    .attr('fill', '#3b82f6')
    .attr('stroke', '#1e293b')
    .attr('stroke-width', 2)
    .transition()
    .duration(300)
    .delay((_, i) => i * 100 + 1500)
    .attr('r', 5);
  
  // Группа для прогнозных точек
  const forecastPoints = svg.append('g')
    .selectAll('.forecast-point')
    .data(forecastData)
    .join('g')
    .attr('class', 'forecast-point')
    .attr('transform', d => `translate(${x(d.month)}, ${y(d.value)})`)
    .style('cursor', 'pointer');
  
  // Добавляем невидимые большие круги для лучшего взаимодействия
  forecastPoints.append('circle')
    .attr('r', 15)
    .attr('fill', 'transparent')
    .style('pointer-events', 'all');
  
  // Добавляем видимые маленькие круги
  const forecastCircles = forecastPoints.append('circle')
    .attr('r', 0)
    .attr('fill', '#10b981')
    .attr('stroke', '#1e293b')
    .attr('stroke-width', 2)
    .transition()
    .duration(300)
    .delay((_, i) => i * 100 + 2500)
    .attr('r', 5);
  
  // Создаем всплывающую подсказку
  const tooltip = d3.select(container)
    .append('div')
    .attr('class', 'chart-tooltip')
    .style('position', 'absolute')
    .style('visibility', 'hidden')
    .style('background', 'rgba(15, 23, 42, 0.95)')
    .style('color', '#f9fafb')
    .style('padding', '10px 15px')
    .style('border-radius', '6px')
    .style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.3)')
    .style('border', '1px solid rgba(59, 130, 246, 0.3)')
    .style('font-size', '0.85rem')
    .style('z-index', 10)
    .style('pointer-events', 'none')
    .style('transform', 'translate(-50%, -100%)')
    .style('transition', 'opacity 0.2s, transform 0.2s')
    .style('opacity', 0);
  
  // Добавляем интерактивность к точкам
  const handlePointHover = (event, d, isActual) => {
    const color = isActual ? '#3b82f6' : '#10b981';
    const typeLabel = isActual ? 'Фактические данные' : 'Прогноз';
    
    // Показываем подсказку
    tooltip
      .style('visibility', 'visible')
      .style('opacity', 1)
      .style('transform', 'translate(-50%, -110%)')
      .html(`
        <div style="color:${color};font-weight:bold;margin-bottom:4px;">
          ${d.name} ${d.year} (${typeLabel})
        </div>
        <div style="display:flex;justify-content:space-between;gap:15px;margin-bottom:3px">
          <span>Значение:</span>
          <span style="font-weight:600">${formatCurrency(d.value)}</span>
        </div>
        ${!isActual ? `
          <div style="background:rgba(16, 185, 129, 0.1);margin-top:6px;padding:4px 6px;
            border-radius:4px;font-size:0.8rem;text-align:center;">
            <span style="color:#a1a1aa">Точность прогноза: </span>
            <span style="color:#10b981">${forecastQuality}</span>
          </div>
        ` : ''}
      `)
      .style('left', `${event.layerX}px`)
      .style('top', `${y(d.value) - 10}px`);
    
    // Увеличиваем точку
    d3.select(event.currentTarget).select('circle:last-child')
      .transition()
      .duration(200)
      .attr('r', 7)
      .attr('filter', 'drop-shadow(0 0 3px ' + color + ')');
    
    // Подсвечиваем соответствующую линию
    if (isActual) {
      actualLine.transition()
        .duration(200)
        .attr('stroke-width', 4)
        .attr('stroke', d3.rgb('#3b82f6').brighter(0.2));
    } else {
      forecastLine.transition()
        .duration(200)
        .style('opacity', 1)
        .attr('stroke-width', 3.5)
        .attr('stroke', d3.rgb('#10b981').brighter(0.2));
    }
  };
  
  const handlePointLeave = (event, d, isActual) => {
    // Скрываем подсказку
    tooltip
      .style('opacity', 0)
      .style('transform', 'translate(-50%, -100%)')
      .transition()
      .duration(200)
      .style('visibility', 'hidden');
    
    // Возвращаем точку к исходному размеру
    d3.select(event.currentTarget).select('circle:last-child')
      .transition()
      .duration(200)
      .attr('r', 5)
      .attr('filter', 'none');
    
    // Возвращаем линию к исходному состоянию
    if (isActual) {
      actualLine.transition()
        .duration(200)
        .attr('stroke-width', 3)
        .attr('stroke', '#3b82f6');
    } else {
      forecastLine.transition()
        .duration(200)
        .attr('stroke-width', 2.5)
        .attr('stroke', '#10b981');
    }
  };
  
  // Привязываем обработчики к точкам
  actualPoints
    .on('mouseover', (e, d) => handlePointHover(e, d, true))
    .on('mouseout', (e, d) => handlePointLeave(e, d, true))
    .on('mousemove', function(event) {
      tooltip
        .style('left', `${event.layerX}px`)
        .style('top', `${y(d3.select(this).datum().value) - 10}px`);
    });
  
  forecastPoints
    .on('mouseover', (e, d) => handlePointHover(e, d, false))
    .on('mouseout', (e, d) => handlePointLeave(e, d, false))
    .on('mousemove', function(event) {
      tooltip
        .style('left', `${event.layerX}px`)
        .style('top', `${y(d3.select(this).datum().value) - 10}px`);
    });
  
  // Добавляем разделитель между фактическими данными и прогнозом
  svg.append('line')
    .attr('x1', x(12.5))
    .attr('x2', x(12.5))
    .attr('y1', margin.top)
    .attr('y2', height - margin.bottom)
    .attr('stroke', '#9ca3af')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '4,4')
    .style('opacity', 0)
    .transition()
    .duration(500)
    .delay(2000)
    .style('opacity', 0.7);
  
  // Добавляем подписи годов
  svg.append('text')
    .attr('x', x(6))
    .attr('y', height - 10)
    .attr('text-anchor', 'middle')
    .style('font-size', '0.9rem')
    .style('fill', '#3b82f6')
    .style('opacity', 0)
    .text(lastYear)
    .transition()
    .duration(500)
    .delay(2200)
    .style('opacity', 1);
  
  svg.append('text')
    .attr('x', x(6) + (x(12) - x(1)) / 2)
    .attr('y', height - 10)
    .attr('text-anchor', 'middle')
    .style('font-size', '0.9rem')
    .style('fill', '#10b981')
    .style('opacity', 0)
    .text(lastYear + 1)
    .transition()
    .duration(500)
    .delay(2300)
    .style('opacity', 1);
  
  // Добавляем легенду
  const legend = svg.append('g')
    .attr('transform', `translate(${width - margin.right + 5}, ${margin.top + 5})`);
  
  // Фактические данные
  const actualLegend = legend.append('g')
    .style('cursor', 'pointer')
    .on('mouseover', function() {
      d3.select(this).select('text')
        .transition()
        .duration(200)
        .style('font-weight', 'bold');
      
      actualLine.transition()
        .duration(200)
        .attr('stroke-width', 4)
        .attr('stroke', d3.rgb('#3b82f6').brighter(0.2));
    })
    .on('mouseout', function() {
      d3.select(this).select('text')
        .transition()
        .duration(200)
        .style('font-weight', 'normal');
      
      actualLine.transition()
        .duration(200)
        .attr('stroke-width', 3)
        .attr('stroke', '#3b82f6');
    });
  
  actualLegend.append('line')
    .attr('x1', 0)
    .attr('x2', 20)
    .attr('y1', 0)
    .attr('y2', 0)
    .attr('stroke', '#3b82f6')
    .attr('stroke-width', 3);
  
  actualLegend.append('text')
    .attr('x', 25)
    .attr('y', 4)
    .style('font-size', '0.8rem')
    .style('fill', '#d1d5db')
    .text(`Факт (${lastYear})`);
  
  // Прогнозные данные
  const forecastLegend = legend.append('g')
    .attr('transform', 'translate(0, 20)')
    .style('cursor', 'pointer')
    .on('mouseover', function() {
      d3.select(this).select('text')
        .transition()
        .duration(200)
        .style('font-weight', 'bold');
      
      forecastLine.transition()
        .duration(200)
        .attr('stroke-width', 3.5)
        .attr('stroke', d3.rgb('#10b981').brighter(0.2));
    })
    .on('mouseout', function() {
      d3.select(this).select('text')
        .transition()
        .duration(200)
        .style('font-weight', 'normal');
      
      forecastLine.transition()
        .duration(200)
        .attr('stroke-width', 2.5)
        .attr('stroke', '#10b981');
    });
  
  forecastLegend.append('line')
    .attr('x1', 0)
    .attr('x2', 20)
    .attr('y1', 0)
    .attr('y2', 0)
    .attr('stroke', '#10b981')
    .attr('stroke-width', 2.5)
    .attr('stroke-dasharray', '6,3');
  
  forecastLegend.append('text')
    .attr('x', 25)
    .attr('y', 4)
    .style('font-size', '0.8rem')
    .style('fill', '#d1d5db')
    .text(`Прогноз (${lastYear + 1})`);
  
  // Добавляем информацию о росте и точности прогноза
  const lastYearTotal = actualData.reduce((sum, d) => sum + d.value, 0);
  const nextYearEstimate = forecastData.reduce((sum, d) => sum + d.value, 0);
  const growthPercentage = ((nextYearEstimate / lastYearTotal) - 1) * 100;
  
  // Создаем информационную панель
// Создаем информационную панель
  const infoPanel = chartContainer.append('div')
    .style('position', 'absolute')
    .style('left', '10px')
    .style('bottom', '10px')
    .style('background', 'rgba(15, 23, 42, 0.8)')
    .style('border-radius', '6px')
    .style('padding', '10px 12px')
    .style('border', '1px solid rgba(16, 185, 129, 0.2)')
    .style('font-size', '0.8rem')
    .style('max-width', '230px')
    .style('box-shadow', '0 2px 10px rgba(0, 0, 0, 0.1)')
    .style('backdrop-filter', 'blur(4px)');
  
  // Определяем цвет и иконку для роста
  const growthColor = growthPercentage >= 0 ? '#10b981' : '#ef4444';
  const growthIcon = growthPercentage >= 0 ? '↗' : '↘';
  
  // Добавляем информацию о прогнозе
  infoPanel.html(`
    <div style="margin-bottom:6px;color:#d1d5db;font-weight:bold;border-bottom:1px solid rgba(75, 85, 99, 0.4);padding-bottom:4px;">
      Аналитика прогноза:
    </div>
    <div style="display:flex;justify-content:space-between;margin-bottom:4px">
      <span style="color:#9ca3af">Ожидаемый рост:</span>
      <span style="color:${growthColor};font-weight:bold">${growthIcon} ${growthPercentage.toFixed(1)}%</span>
    </div>
    <div style="display:flex;justify-content:space-between;margin-bottom:4px">
      <span style="color:#9ca3af">Точность прогноза:</span>
      <span style="color:#60a5fa;font-weight:bold">${forecastQuality}</span>
    </div>
    <div style="display:flex;justify-content:space-between">
      <span style="color:#9ca3af">Ожидаемый объем:</span>
      <span style="color:#f9fafb;font-weight:600">${formatProfitCompact(nextYearEstimate)}</span>
    </div>
  `);
  
  // Добавляем панель с методологией прогноза
  const methodologyPanel = chartContainer.append('div')
    .style('position', 'absolute')
    .style('right', '10px')
    .style('bottom', '10px')
    .style('background', 'rgba(15, 23, 42, 0.6)')
    .style('border-radius', '6px')
    .style('padding', '8px 10px')
    .style('border', '1px solid rgba(59, 130, 246, 0.1)')
    .style('font-size', '0.75rem')
    .style('color', '#9ca3af')
    .style('max-width', '180px')
    .style('cursor', 'help')
    .style('transition', 'all 0.2s')
    .on('mouseover', function() {
      d3.select(this)
        .style('background', 'rgba(30, 41, 59, 0.8)')
        .style('color', '#d1d5db');
    })
    .on('mouseout', function() {
      d3.select(this)
        .style('background', 'rgba(15, 23, 42, 0.6)')
        .style('color', '#9ca3af');
    });
    
  methodologyPanel.html(`
    <div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" 
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
      <span style="font-weight:bold">Методология прогноза</span>
    </div>
    <div style="font-size:0.7rem;line-height:1.4;">
      Прогноз основан на анализе исторических данных с учетом сезонных колебаний и общего тренда роста.
    </div>
  `);
  
  // Добавляем элементы управления
  const controls = chartContainer.append('div')
    .style('position', 'absolute')
    .style('top', '10px')
    .style('right', '10px')
    .style('display', 'flex')
    .style('gap', '5px');
  
  // Кнопка экспорта данных
  const exportButton = controls.append('button')
    .style('background', 'rgba(30, 41, 59, 0.7)')
    .style('border', 'none')
    .style('color', '#9ca3af')
    .style('cursor', 'pointer')
    .style('width', '28px')
    .style('height', '28px')
    .style('border-radius', '4px')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('justify-content', 'center')
    .style('transition', 'all 0.2s')
    .attr('title', 'Экспорт данных прогноза')
    .html('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>')
    .on('mouseover', function() {
      d3.select(this)
        .style('background', 'rgba(59, 130, 246, 0.3)')
        .style('color', '#f9fafb');
    })
    .on('mouseout', function() {
      d3.select(this)
        .style('background', 'rgba(30, 41, 59, 0.7)')
        .style('color', '#9ca3af');
    })
    .on('click', function() {
      // Экспорт данных в CSV
      exportForecastData(actualData, forecastData);
    });
  
  // Кнопка настройки параметров прогноза
  const settingsButton = controls.append('button')
    .style('background', 'rgba(30, 41, 59, 0.7)')
    .style('border', 'none')
    .style('color', '#9ca3af')
    .style('cursor', 'pointer')
    .style('width', '28px')
    .style('height', '28px')
    .style('border-radius', '4px')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('justify-content', 'center')
    .style('transition', 'all 0.2s')
    .attr('title', 'Настроить параметры прогноза')
    .html('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>')
    .on('mouseover', function() {
      d3.select(this)
        .style('background', 'rgba(139, 92, 246, 0.3)')
        .style('color', '#f9fafb');
    })
    .on('mouseout', function() {
      d3.select(this)
        .style('background', 'rgba(30, 41, 59, 0.7)')
        .style('color', '#9ca3af');
    })
    .on('click', function() {
      // Показываем панель настроек прогноза
      showForecastSettings(chartContainer, growthFactor, seasonalFactors);
    });
  
  // Функция для экспорта данных прогноза
  function exportForecastData(actual, forecast) {
    // Формируем CSV строку
    let csvContent = "data:text/csv;charset=utf-8,Месяц,Год,Тип данных,Значение\n";
    
    actual.forEach(d => {
      csvContent += `${d.name},${d.year},Фактические,${d.value}\n`;
    });
    
    forecast.forEach(d => {
      csvContent += `${d.name},${d.year},Прогноз,${d.value}\n`;
    });
    
    // Создаем ссылку для скачивания
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `forecast_${lastYear}_${lastYear+1}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  // Функция для отображения панели настроек прогноза
  function showForecastSettings(container, currentGrowth, seasonality) {
    // Удаляем предыдущую панель настроек, если она есть
    container.selectAll('.forecast-settings-panel').remove();
    
    // Создаем панель настроек
    const settingsPanel = container.append('div')
      .attr('class', 'forecast-settings-panel')
      .style('position', 'absolute')
      .style('top', '50%')
      .style('left', '50%')
      .style('transform', 'translate(-50%, -50%)')
      .style('background', 'rgba(15, 23, 42, 0.95)')
      .style('border-radius', '8px')
      .style('padding', '15px 20px')
      .style('border', '1px solid rgba(59, 130, 246, 0.3)')
      .style('box-shadow', '0 10px 25px rgba(0, 0, 0, 0.3)')
      .style('z-index', 100)
      .style('min-width', '300px')
      .style('backdrop-filter', 'blur(8px)')
      .style('opacity', 0)
      .style('transform', 'translate(-50%, -48%)')
      .transition()
      .duration(300)
      .style('opacity', 1)
      .style('transform', 'translate(-50%, -50%)');
    
    // Заголовок панели
    settingsPanel.append('div')
      .style('display', 'flex')
      .style('justify-content', 'space-between')
      .style('align-items', 'center')
      .style('margin-bottom', '15px')
      .style('padding-bottom', '8px')
      .style('border-bottom', '1px solid rgba(75, 85, 99, 0.3)')
      .html(`
        <span style="font-size:1rem;font-weight:bold;color:#f9fafb;">Параметры прогноза</span>
        <button style="background:none;border:none;color:#9ca3af;cursor:pointer;font-size:1.2rem;
          padding:0;display:flex;align-items:center;justify-content:center;width:24px;height:24px;">×</button>
      `);
    
    // Закрываем панель при клике на кнопку закрытия
    settingsPanel.select('button')
      .on('click', function() {
        settingsPanel
          .transition()
          .duration(200)
          .style('opacity', 0)
          .style('transform', 'translate(-50%, -48%)')
          .remove();
      });
    
    // Добавляем слайдер для коэффициента роста
    settingsPanel.append('div')
      .style('margin-bottom', '15px')
      .html(`
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <label style="color:#d1d5db;font-size:0.9rem;">Коэффициент роста</label>
          <span style="color:#60a5fa;font-weight:bold;font-size:0.9rem;" id="growth-value">
            ${((currentGrowth - 1) * 100).toFixed(1)}%
          </span>
        </div>
        <input type="range" min="0.8" max="1.5" step="0.01" value="${currentGrowth}"
          style="width:100%;margin-top:5px;" id="growth-slider">
      `);
    
    // Обновляем отображение значения при изменении слайдера
    settingsPanel.select('#growth-slider')
      .on('input', function() {
        const value = parseFloat(this.value);
        settingsPanel.select('#growth-value')
          .text(((value - 1) * 100).toFixed(1) + '%');
      });
    
    // Добавляем другие параметры прогноза по необходимости
    
    // Добавляем кнопки действий
    const buttonsContainer = settingsPanel.append('div')
      .style('display', 'flex')
      .style('justify-content', 'flex-end')
      .style('gap', '10px')
      .style('margin-top', '20px');
    
    // Кнопка Отмена
    buttonsContainer.append('button')
      .style('background', 'rgba(75, 85, 99, 0.2)')
      .style('color', '#d1d5db')
      .style('border', 'none')
      .style('padding', '8px 15px')
      .style('border-radius', '6px')
      .style('cursor', 'pointer')
      .style('font-size', '0.9rem')
      .style('transition', 'all 0.2s')
      .text('Отмена')
      .on('mouseover', function() {
        d3.select(this)
          .style('background', 'rgba(75, 85, 99, 0.3)')
          .style('color', '#f9fafb');
      })
      .on('mouseout', function() {
        d3.select(this)
          .style('background', 'rgba(75, 85, 99, 0.2)')
          .style('color', '#d1d5db');
      })
      .on('click', function() {
        settingsPanel
          .transition()
          .duration(200)
          .style('opacity', 0)
          .style('transform', 'translate(-50%, -48%)')
          .remove();
      });
    
    // Кнопка Применить
    buttonsContainer.append('button')
      .style('background', 'rgba(16, 185, 129, 0.2)')
      .style('color', '#10b981')
      .style('border', 'none')
      .style('padding', '8px 15px')
      .style('border-radius', '6px')
      .style('cursor', 'pointer')
      .style('font-size', '0.9rem')
      .style('font-weight', 'bold')
      .style('transition', 'all 0.2s')
      .text('Применить')
      .on('mouseover', function() {
        d3.select(this)
          .style('background', 'rgba(16, 185, 129, 0.3)')
          .style('color', '#f9fafb');
      })
      .on('mouseout', function() {
        d3.select(this)
          .style('background', 'rgba(16, 185, 129, 0.2)')
          .style('color', '#10b981');
      })
      .on('click', function() {
        // Получаем новое значение коэффициента роста
        const newGrowthFactor = parseFloat(settingsPanel.select('#growth-slider').property('value'));
        
        // Закрываем панель настроек
        settingsPanel
          .transition()
          .duration(200)
          .style('opacity', 0)
          .style('transform', 'translate(-50%, -48%)')
          .remove();
        
        // Перестраиваем график с новыми параметрами
        container.html('');
        setTimeout(() => {
          renderForecastChartWithParams(container, lastYear, lastYearData, newGrowthFactor, seasonalFactors);
        }, 300);
      });
    
    // Добавляем фон для предотвращения взаимодействия с основным интерфейсом
    container.insert('div', '.forecast-settings-panel')
      .attr('class', 'settings-backdrop')
      .style('position', 'absolute')
      .style('top', 0)
      .style('left', 0)
      .style('width', '100%')
      .style('height', '100%')
      .style('background', 'rgba(0, 0, 0, 0.5)')
      .style('z-index', 99)
      .style('opacity', 0)
      .style('backdrop-filter', 'blur(2px)')
      .transition()
      .duration(300)
      .style('opacity', 1)
      .on('click', function() {
        // Закрываем панель при клике на фон
        container.selectAll('.forecast-settings-panel, .settings-backdrop')
          .transition()
          .duration(200)
          .style('opacity', 0)
          .remove();
      });
  }
  
  // Реализация функции для перерисовки графика с новыми параметрами
  function renderForecastChartWithParams(container, year, yearData, newGrowthFactor, seasonalFactors) {
    // В реальной реализации здесь был бы вызов основной функции renderForecastChart
    // с передачей новых параметров. Для демонстрации просто перерисовываем график.
    renderForecastChart();
  }
};
  
const renderCategoryDistribution = () => {
  if (!categoryDistributionRef.current || !filteredData.length) return;
         
  const container = categoryDistributionRef.current;
  container.innerHTML = '';
  
  // Создаем основной контейнер с улучшенной стилизацией
  const chartContainer = d3.select(container)
    .append('div')
    .style('width', '100%')
    .style('height', '100%')
    .style('background', 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.8) 100%)')
    .style('border-radius', '12px')
    .style('box-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)')
    .style('border', '1px solid rgba(59, 130, 246, 0.1)')
    .style('position', 'relative')
    .style('overflow', 'hidden');
  
  // Добавляем декоративный элемент фона
  chartContainer.append('div')
    .style('position', 'absolute')
    .style('top', '0')
    .style('left', '0')
    .style('width', '100%')
    .style('height', '100%')
    .style('background-image', 'radial-gradient(circle at 10% 10%, rgba(99, 102, 241, 0.1) 0%, transparent 50%)')
    .style('z-index', '0');
  
  const width = container.clientWidth;
  const height = container.clientHeight || 250;
  const margin = { top: 40, right: 120, bottom: 50, left: 60 };
  
  // Создаем SVG с правильным позиционированием
  const svg = chartContainer.append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('position', 'relative')
    .style('z-index', '1');
  
  // Добавляем заголовок с улучшенной типографикой
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', margin.top / 2)
    .attr('text-anchor', 'middle')
    .style('font-size', '1.1rem')
    .style('font-weight', 'bold')
    .style('fill', '#f9fafb')
    .style('text-shadow', '0 1px 2px rgba(0, 0, 0, 0.2)')
    .text('Динамика структуры продаж');
  
  // Группируем данные по месяцам и категориям с улучшенной обработкой
  // Проходим по месяцам
  const monthGroups = {};
  
  filteredData.forEach(month => {
    let monthKey;
    
    if (displayMode === 'yearly') {
      monthKey = month.name;
    } else if (displayMode === 'compare') {
      monthKey = `${month.name} ${month.year}`;
    } else {
      monthKey = month.label || `${month.name} ${month.year}`;
    }
    
    if (!monthGroups[monthKey]) {
      monthGroups[monthKey] = {
        name: monthKey,
        month: month.month,
        year: month.year,
        retail: 0,
        wholesale: 0,
        promo: 0,
        total: 0
      };
    }
    
    // Суммируем значения, если есть несколько записей на один месяц
    monthGroups[monthKey].retail += month.retail || 0;
    monthGroups[monthKey].wholesale += month.wholesale || 0;
    monthGroups[monthKey].promo += month.promo || 0;
    monthGroups[monthKey].total += month.total || 0;
  });
  
  // Преобразуем объект в массив для сортировки
  let sortedMonths = Object.values(monthGroups);
  
  // Применяем соответствующую сортировку в зависимости от режима отображения
  if (displayMode === 'yearly') {
    // По номеру месяца
    sortedMonths.sort((a, b) => a.month - b.month);
  } else if (displayMode === 'compare') {
    // По году и номеру месяца
    sortedMonths.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  } else {
    // Для режима период - по хронологии
    sortedMonths.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  }
  
  // Для визуализации выбираем оптимальное количество месяцев
  // чтобы не перегружать график
  if (sortedMonths.length > 8) {
    // Выбираем стратегию выборки в зависимости от количества данных
    if (sortedMonths.length <= 12) {
      // Для 9-12 месяцев берем каждый второй месяц
      sortedMonths = sortedMonths.filter((_, i) => i % 2 === 0);
    } else if (sortedMonths.length <= 24) {
      // Для 13-24 месяцев берем каждый третий месяц
      sortedMonths = sortedMonths.filter((_, i) => i % 3 === 0);
    } else {
      // Для большего количества равномерно выбираем 8 точек
      const step = Math.floor(sortedMonths.length / 7);
      sortedMonths = [
        sortedMonths[0],
        ...Array.from({ length: 6 }, (_, i) => sortedMonths[step * (i + 1)]),
        sortedMonths[sortedMonths.length - 1]
      ];
    }
  }
  
  // Проверяем наличие данных после фильтрации
  if (sortedMonths.length === 0) {
    chartContainer.append('div')
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('align-items', 'center')
      .style('justify-content', 'center')
      .style('height', '100%')
      .style('padding', '20px')
      .html(`
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" 
          stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p style="color:#9ca3af;margin-top:12px;text-align:center;">Нет данных для отображения структуры продаж</p>
      `);
    return;
  }
  
  // Преобразуем данные для stacked bar chart
  // каждая категория - отдельная запись для каждого месяца
  const stackedData = [];
  
  sortedMonths.forEach(month => {
    // Вычисляем проценты для каждой категории
    const total = month.total || 1; // Избегаем деления на ноль
    
    // Добавляем записи для каждой категории
    stackedData.push(
      { month: month.name, category: 'retail', value: (month.retail / total) * 100 },
      { month: month.name, category: 'wholesale', value: (month.wholesale / total) * 100 },
      { month: month.name, category: 'promo', value: (month.promo / total) * 100 }
    );
  });
  
  // Создаем шкалы с улучшенными параметрами
  const months = [...new Set(stackedData.map(d => d.month))];
  
  const x = d3.scaleBand()
    .domain(months)
    .range([margin.left, width - margin.right])
    .padding(0.3);
  
  const y = d3.scaleLinear()
    .domain([0, 100]) // Процентная шкала
    .range([height - margin.bottom, margin.top]);
  
  // Создаем улучшенную цветовую схему для категорий
  const colorScale = d3.scaleOrdinal()
    .domain(['retail', 'wholesale', 'promo'])
    .range([
      SALE_TYPES.RETAIL.color,
      SALE_TYPES.WHOLESALE.color,
      SALE_TYPES.PROMO.color
    ]);
  
  // Создаем градиенты для улучшенной визуализации
  const defs = svg.append('defs');
  
  ['retail', 'wholesale', 'promo'].forEach(category => {
    const gradient = defs.append('linearGradient')
      .attr('id', `gradient-${category}`)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    
    const baseColor = d3.color(colorScale(category));
    
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', baseColor.brighter(0.3))
      .attr('stop-opacity', 0.95);
    
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', baseColor)
      .attr('stop-opacity', 0.85);
  });
  
  // Создаем оси с улучшенной стилизацией
  const xAxis = g => g
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x)
      .tickFormat(d => {
        // Сокращаем длинные надписи
        if (d.length > 10) {
          return d.substring(0, 8) + '...';
        }
        return d;
      }))
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('text')
      .style('fill', '#d1d5db')
      .style('font-size', '0.8rem')
      .attr('transform', 'rotate(-25)')
      .attr('text-anchor', 'end')
      .attr('dx', '-0.8em')
      .attr('dy', '0.15em'));
  
  const yAxis = g => g
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y)
      .ticks(5)
      .tickFormat(d => `${d}%`))
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('text')
      .style('fill', '#d1d5db')
      .style('font-size', '0.8rem'))
    .call(g => g.selectAll('.tick line')
      .attr('x2', width - margin.left - margin.right)
      .attr('stroke', 'rgba(148, 163, 184, 0.1)')
      .attr('stroke-dasharray', '2,2'));
  
  // Добавляем оси
  svg.append('g').call(xAxis);
  svg.append('g').call(yAxis);
  
  // Добавляем вспомогательную сетку
  svg.append('g')
    .selectAll('line')
    .data(y.ticks(5))
    .join('line')
    .attr('x1', margin.left)
    .attr('x2', width - margin.right)
    .attr('y1', d => y(d))
    .attr('y2', d => y(d))
    .attr('stroke', 'rgba(75, 85, 99, 0.1)')
    .attr('stroke-width', 1);
  
  // Группируем данные для построения stacked bar chart
  const dataReady = d3.stack()
    .keys(['retail', 'wholesale', 'promo'])
    .value((d, key) => {
      // Находим запись для текущего месяца и категории
      const entry = stackedData.find(
        item => item.month === d && item.category === key
      );
      return entry ? entry.value : 0;
    })
    .order(d3.stackOrderNone)
    .offset(d3.stackOffsetNone);
  
  const series = dataReady(months);
  
  // Добавляем tooltip для интерактивности
  const tooltip = d3.select(container)
    .append('div')
    .attr('class', 'chart-tooltip')
    .style('position', 'absolute')
    .style('visibility', 'hidden')
    .style('background', 'rgba(15, 23, 42, 0.95)')
    .style('color', '#f9fafb')
    .style('padding', '10px 15px')
    .style('border-radius', '6px')
    .style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.3)')
    .style('border', '1px solid rgba(59, 130, 246, 0.3)')
    .style('font-size', '0.85rem')
    .style('z-index', 10)
    .style('pointer-events', 'none')
    .style('transition', 'opacity 0.2s, transform 0.2s')
    .style('opacity', 0);
  
  // Добавляем stacked bars с улучшенной стилизацией и анимацией
  svg.append('g')
    .selectAll('g')
    .data(series)
    .join('g')
    .attr('fill', (d, i) => `url(#gradient-${d.key})`)
    .selectAll('rect')
    .data(d => d)
    .join('rect')
    .attr('x', d => x(d.data))
    .attr('y', d => y(d[1]))
    .attr('height', d => y(d[0]) - y(d[1]))
    .attr('width', x.bandwidth())
    .attr('rx', 2) // Скругление углов
    .attr('stroke', '#1e293b')
    .attr('stroke-width', 0.5)
    .style('cursor', 'pointer')
    .style('filter', 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))')
    .on('mouseover', function(event, d) {
      // Выделяем текущий элемент
      d3.select(this)
        .transition()
        .duration(200)
        .attr('stroke-width', 1.5)
        .style('filter', 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))');
      
      // Находим категорию по цвету
      const category = series.find(serie => 
        serie.some(item => item[0] === d[0] && item[1] === d[1])
      ).key;
      
      // Получаем месяц
      const monthName = d.data;
      
      // Находим оригинальные данные для месяца
      const monthData = monthGroups[monthName];
      
      // Вычисляем значение для категории и долю
      const value = monthData[category];
      const percentage = (value / monthData.total * 100).toFixed(1);
      
      // Определяем правильное название категории
      const categoryName = category === 'retail' ? SALE_TYPES.RETAIL.name :
                           category === 'wholesale' ? SALE_TYPES.WHOLESALE.name :
                           SALE_TYPES.PROMO.name;
      
      // Показываем tooltip с данными
      tooltip
        .style('visibility', 'visible')
        .style('opacity', 1)
        .style('left', `${event.pageX + 15}px`)
        .style('top', `${event.pageY - 20}px`)
        .html(`
          <div style="color:${colorScale(category)};font-weight:bold;margin-bottom:4px;">
            ${categoryName}
          </div>
          <div style="display:flex;justify-content:space-between;gap:15px;margin-bottom:3px">
            <span>Период:</span>
            <span style="font-weight:600">${monthName}</span>
          </div>
          <div style="display:flex;justify-content:space-between;gap:15px;margin-bottom:3px">
            <span>Объем:</span>
            <span style="font-weight:600">${formatCurrency(value)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;gap:15px">
            <span>Доля:</span>
            <span style="font-weight:600">${percentage}%</span>
          </div>
        `);
    })
    .on('mousemove', function(event) {
      // Обновляем позицию tooltip при движении
      tooltip
        .style('left', `${event.pageX + 15}px`)
        .style('top', `${event.pageY - 20}px`);
    })
    .on('mouseout', function() {
      // Возвращаем исходный вид элемента
      d3.select(this)
        .transition()
        .duration(200)
        .attr('stroke-width', 0.5)
        .style('filter', 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))');
      
      // Скрываем tooltip
      tooltip
        .style('opacity', 0)
        .transition()
        .duration(200)
        .style('visibility', 'hidden');
    })
    // Анимация появления
    .attr('y', height - margin.bottom)
    .attr('height', 0)
    .transition()
    .duration(800)
    .delay((d, i) => i * 10)
    .attr('y', d => y(d[1]))
    .attr('height', d => y(d[0]) - y(d[1]));
  
  // Добавляем легенду
  const legend = svg.append('g')
    .attr('transform', `translate(${width - margin.right + 10}, ${margin.top})`);
  
  // Создаем элементы легенды с интерактивностью
  const categories = [
    { id: 'retail', name: SALE_TYPES.RETAIL.name },
    { id: 'wholesale', name: SALE_TYPES.WHOLESALE.name },
    { id: 'promo', name: SALE_TYPES.PROMO.name }
  ];
  
  categories.forEach((category, i) => {
    const legendItem = legend.append('g')
      .attr('transform', `translate(0, ${i * 25})`)
      .style('cursor', 'pointer')
      .on('mouseover', function() {
        // Подсвечиваем соответствующие сегменты
        svg.selectAll('rect')
          .filter(d => {
            const serie = series.find(s => 
              s.some(item => item[0] === d[0] && item[1] === d[1])
            );
            return serie && serie.key === category.id;
          })
          .transition()
          .duration(200)
          .attr('stroke-width', 1.5)
          .style('filter', 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))');
        
        // Выделяем элемент легенды
        d3.select(this).select('text')
          .transition()
          .duration(200)
          .style('font-weight', 'bold');
      })
      .on('mouseout', function() {
        // Возвращаем исходный вид сегментов
        svg.selectAll('rect')
          .transition()
          .duration(200)
          .attr('stroke-width', 0.5)
          .style('filter', 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))');
        
        // Возвращаем исходный вид элемента легенды
        d3.select(this).select('text')
          .transition()
          .duration(200)
          .style('font-weight', 'normal');
      });
    
    // Добавляем прямоугольник легенды
    legendItem.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('rx', 2)
      .attr('fill', colorScale(category.id));
    
    // Добавляем текст легенды
    legendItem.append('text')
      .attr('x', 25)
      .attr('y', 12)
      .style('font-size', '0.8rem')
      .style('fill', '#d1d5db')
      .text(category.name);
  });
  
  // Добавляем анализ тренда структуры продаж
  if (sortedMonths.length >= 3) {
    // Вычисляем средние доли категорий в первой и последней трети периода
    const firstThird = sortedMonths.slice(0, Math.ceil(sortedMonths.length / 3));
    const lastThird = sortedMonths.slice(-Math.ceil(sortedMonths.length / 3));
    
    // Вычисляем средние доли для первой трети
    const firstRetailShare = firstThird.reduce((sum, month) => 
      sum + (month.retail / month.total) * 100, 0) / firstThird.length;
    
    const firstWholesaleShare = firstThird.reduce((sum, month) => 
      sum + (month.wholesale / month.total) * 100, 0) / firstThird.length;
    
    // Вычисляем средние доли для последней трети
    const lastRetailShare = lastThird.reduce((sum, month) => 
      sum + (month.retail / month.total) * 100, 0) / lastThird.length;
    
    const lastWholesaleShare = lastThird.reduce((sum, month) => 
      sum + (month.wholesale / month.total) * 100, 0) / lastThird.length;
    
    // Вычисляем изменения
    const retailChange = lastRetailShare - firstRetailShare;
    const wholesaleChange = lastWholesaleShare - firstWholesaleShare;
    
    // Добавляем панель с анализом трендов
    const trendPanel = chartContainer.append('div')
      .style('position', 'absolute')
      .style('left', '10px')
      .style('bottom', '10px')
      .style('background', 'rgba(15, 23, 42, 0.8)')
      .style('border-radius', '6px')
      .style('padding', '10px 12px')
      .style('border', '1px solid rgba(99, 102, 241, 0.2)')
      .style('font-size', '0.8rem')
      .style('max-width', '230px')
      .style('box-shadow', '0 2px 10px rgba(0, 0, 0, 0.1)')
      .style('backdrop-filter', 'blur(4px)');
    
    // Заголовок панели
    trendPanel.append('div')
      .style('margin-bottom', '6px')
      .style('color', '#d1d5db')
      .style('font-weight', 'bold')
      .style('border-bottom', '1px solid rgba(75, 85, 99, 0.4)')
      .style('padding-bottom', '4px')
      .text('Анализ тренда структуры:');
    
    // Изменение доли розничных продаж
    const retailColor = retailChange > 0 ? '#10b981' : retailChange < 0 ? '#ef4444' : '#9ca3af';
    const retailIcon = retailChange > 0 ? '↗' : retailChange < 0 ? '↘' : '→';
    
    trendPanel.append('div')
      .style('display', 'flex')
      .style('justify-content', 'space-between')
      .style('margin-bottom', '4px')
      .html(`
        <span style="color:#9ca3af">Розница:</span>
        <span style="color:${retailColor};font-weight:bold">
          ${retailIcon} ${Math.abs(retailChange).toFixed(1)}%
        </span>
      `);
    
    // Изменение доли оптовых продаж
    const wholesaleColor = wholesaleChange > 0 ? '#10b981' : wholesaleChange < 0 ? '#ef4444' : '#9ca3af';
    const wholesaleIcon = wholesaleChange > 0 ? '↗' : wholesaleChange < 0 ? '↘' : '→';
    
    trendPanel.append('div')
      .style('display', 'flex')
      .style('justify-content', 'space-between')
      .style('margin-bottom', '4px')
      .html(`
        <span style="color:#9ca3af">Опт:</span>
        <span style="color:${wholesaleColor};font-weight:bold">
          ${wholesaleIcon} ${Math.abs(wholesaleChange).toFixed(1)}%
        </span>
      `);
    
    // Определение основного тренда
    let trendText = '';
    if (Math.abs(retailChange) > Math.abs(wholesaleChange)) {
      if (retailChange > 2) {
        trendText = 'Рост доли розничных продаж';
      } else if (retailChange < -2) {
        trendText = 'Снижение доли розничных продаж';
      } else {
        trendText = 'Стабильная структура продаж';
      }
    } else {
      if (wholesaleChange > 2) {
        trendText = 'Рост доли оптовых продаж';
      } else if (wholesaleChange < -2) {
        trendText = 'Снижение доли оптовых продаж';
      } else {
        trendText = 'Стабильная структура продаж';
      }
    }
    
    trendPanel.append('div')
      .style('margin-top', '8px')
      .style('color', '#f9fafb')
      .style('font-weight', 'bold')
      .style('font-size', '0.85rem')
      .text(trendText);
  }
  
  // Добавляем элементы управления
  const controls = chartContainer.append('div')
    .style('position', 'absolute')
    .style('top', '10px')
    .style('right', '10px')
    .style('display', 'flex')
    .style('gap', '5px');
  
  // Кнопка экспорта данных
  const exportButton = controls.append('button')
    .style('background', 'rgba(30, 41, 59, 0.7)')
    .style('border', 'none')
    .style('color', '#9ca3af')
    .style('cursor', 'pointer')
    .style('width', '28px')
    .style('height', '28px')
    .style('border-radius', '4px')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('justify-content', 'center')
    .style('transition', 'all 0.2s')
    .attr('title', 'Экспорт данных')
    .html('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>')
    .on('mouseover', function() {
      d3.select(this)
        .style('background', 'rgba(59, 130, 246, 0.3)')
        .style('color', '#f9fafb');
    })
    .on('mouseout', function() {
      d3.select(this)
        .style('background', 'rgba(30, 41, 59, 0.7)')
        .style('color', '#9ca3af');
    })
    .on('click', function() {
      // Экспорт данных в CSV
      exportStructureData(sortedMonths);
    });
  
  // Функция для экспорта данных
  function exportStructureData(data) {
    // Формируем CSV строку
    let csvContent = "data:text/csv;charset=utf-8,Месяц,Розница (%),Опт (%),Акции (%),Розница (сумма),Опт (сумма),Акции (сумма),Общая сумма\n";
    
    data.forEach(month => {
      const retailShare = (month.retail / month.total * 100).toFixed(2);
      const wholesaleShare = (month.wholesale / month.total * 100).toFixed(2);
      const promoShare = (month.promo / month.total * 100).toFixed(2);
      
      csvContent += `${month.name},${retailShare},${wholesaleShare},${promoShare},${month.retail},${month.wholesale},${month.promo},${month.total}\n`;
    });
    
    // Создаем ссылку для скачивания
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `structure_analysis_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

  // Функция для форматирования даты YYYY-MM-DD в DD.MM.YYYY
const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
};

// Функция для получения дня недели
const getDayOfWeek = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  return days[date.getDay()];
};

// Функция для рендеринга строк таблицы с данными// Функция для улучшенного отображения моделей в таблице с указанием суммы
const renderDailySalesTableRows = () => {
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
  
  // Преобразуем Set в массив и сортируем даты
  const sortedDates = Array.from(allDates).sort((a, b) => {
    return new Date(a) - new Date(b);
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
    
    // Логируем для отладки
    if (index === 0) {
      console.log("Пример данных:", {
        date,
        allData: allSalesData,
        retailData: retailSalesData,
        wholesaleData: wholesaleSalesData,
        allAmount,
        retailAmount,
        wholesaleAmount
      });
    }
    
    return (
      <tr key={date} className={index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}>
        {/* Дата */}
        <td className="px-3 py-4 whitespace-nowrap">
          <div className="text-sm font-medium text-white">{displayDate}</div>
          <div className="text-xs text-gray-400">{getDayOfWeek(date)}</div>
        </td>
        
        {/* Общие продажи */}
        <td className="px-3 py-4 whitespace-nowrap">
          <div className="text-sm font-medium text-white">{formatProfitCompact(allAmount)}</div>
          <div className="text-xs text-gray-400">{allCount} шт.</div>
        </td>
        
        {/* Розничные продажи */}
        <td className="px-3 py-4 whitespace-nowrap">
          <div className="text-sm font-medium text-blue-400">{formatProfitCompact(retailAmount)}</div>
          <div className="text-xs text-gray-400">{retailCount} шт.</div>
        </td>
        
        {/* Оптовые продажи */}
        <td className="px-3 py-4 whitespace-nowrap">
          <div className="text-sm font-medium text-purple-400">{formatProfitCompact(wholesaleAmount)}</div>
          <div className="text-xs text-gray-400">{wholesaleCount} шт.</div>
        </td>
      </tr>
    );
  });
};

// Функция для рендеринга итоговой строки с правильным расчетом сумм
const renderDailySalesTotalRow = () => {
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
  
  return (
    <tr className="bg-gray-700/30 font-medium">
      <td className="px-3 py-4 whitespace-nowrap text-sm text-white">ИТОГО:</td>
      
      <td className="px-3 py-4 whitespace-nowrap">
        <div className="text-sm font-bold text-white">{formatProfitCompact(allTotal.amount)}</div>
        <div className="text-xs text-gray-300">{allTotal.all_count} шт.</div>
      </td>
      
      <td className="px-3 py-4 whitespace-nowrap">
        <div className="text-sm font-bold text-blue-300">{formatProfitCompact(retailTotal.amount)}</div>
        <div className="text-xs text-gray-300">{retailTotal.all_count} шт.</div>
      </td>
      
      <td className="px-3 py-4 whitespace-nowrap">
        <div className="text-sm font-bold text-purple-300">{formatProfitCompact(wholesaleTotal.amount)}</div>
        <div className="text-xs text-gray-300">{wholesaleTotal.all_count} шт.</div>
      </td>
      
      <td></td>
    </tr>
  );
};

// Функция для отображения модального окна с моделями
const showModelsModal = (date, displayDate, models) => {
  // Создаем модальное окно
  const modalRoot = document.createElement('div');
  modalRoot.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  document.body.appendChild(modalRoot);
  
  // Рендерим содержимое модального окна с помощью React
  ReactDOM.render(
    <div className="bg-gray-800 rounded-xl shadow-xl p-5 max-w-3xl w-full max-h-[80vh] flex flex-col border border-gray-700">
      {/* Заголовок модального окна */}
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-700">
        <h3 className="text-lg font-bold text-white">Модели автомобилей за {displayDate}</h3>
        <button 
          className="text-gray-400 hover:text-white"
          onClick={() => {
            document.body.removeChild(modalRoot);
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Содержимое модального окна */}
      <div className="overflow-y-auto flex-grow">
        {models && models.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700/50">
              <tr>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-10">№</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-1/3">Модель</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-1/5">Продажи</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-1/5">Количество</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-1/5">Средняя цена</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {/* Сортируем модели по сумме продаж (от большей к меньшей) */}
              {[...models].sort((a, b) => (parseFloat(b.amount) || 0) - (parseFloat(a.amount) || 0)).map((model, index) => {
                const avgPrice = model.all_count > 0 ? model.amount / model.all_count : 0;
                
                return (
                  <tr key={model.model_id} className={index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-300">{index + 1}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{model.model_name || 'Модель'}</div>
                      <div className="text-xs text-gray-400">{model.model_id || ''}</div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-blue-400">{formatProfitCompact(model.amount)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-white">{model.all_count || 0} шт.</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-green-400">{formatProfitCompact(avgPrice)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg">Нет данных о моделях</p>
          </div>
        )}
      </div>
      
      {/* Футер модального окна */}
      <div className="pt-3 mt-3 border-t border-gray-700 flex justify-end">
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          onClick={() => {
            document.body.removeChild(modalRoot);
          }}
        >
          Закрыть
        </button>
      </div>
    </div>,
    modalRoot
  );
};

  // JSX для компонента
return (
  <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-6">
    {/* РАЗДЕЛ: Заголовок страницы */}
    <header className="mb-6">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl md:text-4xl font-bold text-white bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent"
      >
        Финансовая аналитика продаж автомобилей
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-gray-400 mt-2"
      >
        Анализ финансовых показателей и динамики продаж моделей
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
        <div className="bg-gray-800/80 shadow-xl backdrop-blur-sm rounded-xl p-5 mb-6 border border-gray-700/50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Табы для категорий продаж */}
            <div className="flex bg-gray-700/80 rounded-lg p-1">
              <button 
                className={`px-3 py-1.5 rounded-md text-sm ${
                  focusCategory === 'all' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300'
                }`}
                onClick={() => handleCategoryChange('all')}
              >
                Все продажи
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
                className="bg-blue-600 hover:bg-blue-700 transition-colors text-white px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-1"
                onClick={refreshDataWithDateRange}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Обновить
              </button>
            </div>
          </div>
        </div>
        
        {filteredData.length > 0 && (
          <>
            {/* РАЗДЕЛ: Информационные карточки */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 rounded-xl p-5 border border-blue-500/20 shadow-lg"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600/30 flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-100" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-blue-300">
                      {focusCategory === 'all' ? 'Общая сумма' : 
                      focusCategory === 'retail' ? 'Розничные продажи' : 
                      'Оптовые продажи'}
                    </h3>
                    <p className="text-3xl font-bold text-white mt-1">
                      {formatCurrency(getCurrentMonthTotal())}
                    </p>
                    <p className="text-blue-300/70 text-sm mt-1">
                      За текущий месяц
                    </p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 rounded-xl p-5 border border-purple-500/20 shadow-lg"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-600/30 flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-100" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-purple-300">
                      {focusCategory === 'all' ? 'Средний доход в день' : 
                      focusCategory === 'retail' ? 'Среднее в день (розница)' : 
                      'Среднее в день (опт)'}
                    </h3>
                    <p className="text-3xl font-bold text-white mt-1">
                      {formatCurrency(calculateAverageDailyIncome())}
                    </p>
                    <p className="text-purple-300/70 text-sm mt-1">
                      На основе {new Date().getDate()} прошедших дней
                    </p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-green-600/20 to-green-800/20 rounded-xl p-5 border border-green-500/20 shadow-lg"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-600/30 flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-100" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-green-300">
                      {focusCategory === 'all' ? 'Ожидаемая сумма за месяц' : 
                      focusCategory === 'retail' ? 'Прогноз розницы за месяц' : 
                      'Прогноз опта за месяц'}
                    </h3>
                    <p className="text-3xl font-bold text-white mt-1">
                      {formatCurrency(calculateTotalMonthEstimate())}
                    </p>
                    <p className="text-green-300/70 text-sm mt-1">
                      {new Date().getDate()} / {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()} дней месяца прошло
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* РАЗДЕЛ: Основной график и прогресс */}
            <div className="gap-6 mb-6">
              <div className="lg:col-span-2 bg-gray-800 rounded-xl p-2 border border-gray-700/50 shadow-lg">
                <div ref={mainChartRef} className="w-full h-full"></div>
              </div>
            </div>
          </>
        )}

        {/* РАЗДЕЛ: Таблица детальной статистики продаж по дням */}
        <div className="mt-6 bg-gray-800/80 shadow-xl backdrop-blur-sm rounded-xl p-5 border border-gray-700/50">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-white bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              Детальная статистика продаж по дням
            </h2>
            
            {/* Панель управления таблицей */}
            <div className="flex items-center gap-2">
              {/* Выбор дат для таблицы */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input 
                    type="date" 
                    className="bg-gray-700/80 text-white px-3 py-1.5 rounded-md text-sm border border-gray-600/50 w-36"
                    value={formatDateForInput(tableDateStart || apiStartDate)}
                    onChange={(e) => setTableDateStart(formatDateFromInput(e.target.value))}
                  />
                </div>
                
                <span className="text-gray-400">—</span>
                
                <div className="relative">
                  <input 
                    type="date" 
                    className="bg-gray-700/80 text-white px-3 py-1.5 rounded-md text-sm border border-gray-600/50 w-36"
                    value={formatDateForInput(tableDateEnd || apiEndDate)}
                    onChange={(e) => setTableDateEnd(formatDateFromInput(e.target.value))}
                  />
                </div>
              </div>
              
              {/* Кнопка обновления таблицы */}
              <button 
                className="bg-blue-600 hover:bg-blue-700 transition-colors text-white px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-1"
                onClick={fetchDailySalesData}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Загрузить данные
              </button>
            </div>
          </div>
          
          {/* Контейнер таблицы с обработкой состояний загрузки */}
          <div className="overflow-x-auto">
            {isLoadingDailySales ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-300">Загрузка данных...</span>
              </div>
            ) : dailySalesData.all.length === 0 && dailySalesData.retail.length === 0 && dailySalesData.wholesale.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg">Данные отсутствуют для выбранного периода</p>
                <p className="text-sm mt-1">Выберите другой диапазон дат или обновите данные</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-700 table-fixed">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-32">Дата</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-44">Общие продажи</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-44">Розничные продажи</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-44">Оптовые продажи</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
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