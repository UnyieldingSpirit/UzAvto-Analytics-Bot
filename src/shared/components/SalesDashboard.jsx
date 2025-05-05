'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Clock, Check, AlertTriangle, ChevronDown, Truck, MapPin, 
  Archive, ChevronLeft, BarChart3, Users, Activity, ChevronRight, RefreshCcw, Zap, Calendar, Car, X } from 'lucide-react';
import { carModels, regions } from '@/src/shared/mocks/mock-data';
import { useTelegram } from '@/src/hooks/useTelegram';
import * as d3 from 'd3';
import ContentReadyLoader from '@/src/shared/layout/ContentReadyLoader';

const SalesChart = ({ 
  initialSalesData = [], 
  initialLastYearData = [], 
  months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
  selectedModel,
  setSelectedModel,
  activeTab = 'месяц', 
  setActiveTab,
  period,
  setPeriod,
  carModels = [],
  regions = []
}) => {
  // Состояние UI
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [dateRange, setDateRange] = useState(period || { 
    // Изменение: показывать последний год по умолчанию
    start: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [isFilterAnimating, setIsFilterAnimating] = useState(false);
  
  // Данные для графика
  const [salesData, setSalesData] = useState(initialSalesData.length > 0 ? initialSalesData : Array(12).fill(10));
  const [lastYearSalesData, setLastYearSalesData] = useState(initialLastYearData.length > 0 ? initialLastYearData : []);
  const [displayLabels, setDisplayLabels] = useState(months);
  
  // Состояние загрузки
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // Ссылки на DOM элементы
  const chartRef = useRef(null);
  const tooltipRef = useRef(null);
  const modelDropdownRef = useRef(null);
  const regionDropdownRef = useRef(null);
  const isFirstRender = useRef(true);
  
  // Загрузка моделей и регионов из API
  const [availableModels, setAvailableModels] = useState([]);
  const [availableRegions, setAvailableRegions] = useState([]);
  
  // Функция форматирования даты для API (DD.MM.YYYY)
  const formatDateForApi = (dateString) => {
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      const now = new Date();
      const day = now.getDate().toString().padStart(2, '0');
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const year = now.getFullYear();
      return `${day}.${month}.${year}`;
    }
  };
  
  // Функция получения предыдущего года для сравнения
  const getPreviousYearDates = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    start.setFullYear(start.getFullYear() - 1);
    end.setFullYear(end.getFullYear() - 1);
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };
  
  // Функция для получения меток оси X в зависимости от выбранного периода
  const getLabelsForPeriod = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 14) {
      // Для периода до 14 дней показываем каждый день
      const labels = [];
      const tempDate = new Date(startDate);
      
      while (tempDate <= endDate) {
        const day = tempDate.getDate();
        const month = tempDate.toLocaleDateString('ru-RU', { month: 'short' });
        labels.push(`${day} ${month}`);
        tempDate.setDate(tempDate.getDate() + 1);
      }
      
      return labels;
    } else if (diffDays <= 31) {
      // Для периода до 31 дня показываем недели
      const labels = [];
      let weekCount = 1;
      const tempDate = new Date(startDate);
      
      while (tempDate <= endDate) {
        const week = `Нед ${weekCount}`;
        if (!labels.includes(week)) {
          labels.push(week);
        }
        tempDate.setDate(tempDate.getDate() + 7);
        weekCount++;
      }
      
      return labels;
    } else if (diffDays <= 180) {
      // Для периода до 6 месяцев показываем месяцы
      const labels = [];
      const tempDate = new Date(startDate);
      
      while (tempDate <= endDate) {
        const month = tempDate.toLocaleDateString('ru-RU', { month: 'short' });
        if (!labels.includes(month)) {
          labels.push(month);
        }
        tempDate.setMonth(tempDate.getMonth() + 1);
      }
      
      return labels;
    } else {
      // Для периода более 6 месяцев показываем все месяцы
      return months;
    }
  };
  
  // Функция форматирования значений для отображения над столбцами
  const formatDisplayValue = (value) => {
    if (value === null) return "";
    
    if (value < 100000) {
      // До 100к показываем полное число
      return value.toLocaleString();
    } else if (value < 1000000) {
      // От 100к до 1М показываем в тысячах
      return Math.round(value / 1000) + "K";
    } else if (value < 1000000000) {
      // От 1М до 1Б показываем в миллионах
      return (value / 1000000).toFixed(1) + "М";
    } else {
      // Свыше 1Б показываем в миллиардах
      return (value / 1000000000).toFixed(1) + "Б";
    }
  };
  
  // Функция запроса данных из API с учетом периода
const fetchAnalyticsData = async (forComparison = false, customPeriod = null) => {
  // Используем переданный период или берем из состояния
  const currentPeriod = customPeriod || period || dateRange;
  
  // Для сравнения используем предыдущий год
  const requestPeriod = forComparison 
    ? getPreviousYearDates(currentPeriod.start, currentPeriod.end) 
    : currentPeriod;
    
  setIsLoading(true);
  if (!forComparison) setIsFilterAnimating(true);
  
  console.log(`Отправляем запрос за период: ${requestPeriod.start} - ${requestPeriod.end}`);
  
  try {
    // Получаем даты для запроса
    const beginDate = formatDateForApi(requestPeriod.start);
    const endDate = formatDateForApi(requestPeriod.end);
    
    // Формируем базовый URL API
    const baseUrl = 'https://uzavtosalon.uz/b/dashboard/infos';
    const apiUrl = `${baseUrl}&auto_analytics`;
    
    // Создаем объект данных для отправки в теле запроса
    const requestData = {
      begin_date: beginDate,
      end_date: endDate,
    };
    
    // Добавляем модель, если выбрана
    if (selectedModel) {
      requestData.model_id = selectedModel;
      console.log(`Запрос по конкретной модели: ${selectedModel}`);
    }
    
    // Добавляем регион, если выбран
    if (selectedRegion) {
      requestData.region_id = selectedRegion;
      console.log(`Запрос по конкретному региону: ${selectedRegion}`);
    }
    
    console.log(`Отправка ${forComparison ? 'сравнительных' : 'текущих'} данных:`, requestData);
    
    // Выполняем POST-запрос с данными в теле
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Получены ${forComparison ? 'сравнительные' : 'текущие'} данные:`, data);
    
    // Получаем метки для графика
    if (!forComparison) {
      const labels = getLabelsForPeriod(currentPeriod.start, currentPeriod.end);
      setDisplayLabels(labels);
    }
    
    // Обрабатываем данные для графика
    const processedData = processApiData(data, forComparison);
    
    // Обновляем состояние в зависимости от типа запроса
    if (forComparison) {
      setLastYearSalesData(processedData);
    } else {
      setSalesData(processedData);
      
      // Извлекаем доступные модели из данных
      if (Array.isArray(data)) {
        // Собираем модели
        const models = data.map(item => ({
          id: item.model_id,
          name: item.model_name,
          img: `https://uzavtosalon.uz/b/core/m$load_image?sha=${item.photo_sha}&width=400&height=400`
        }));
        
        // Фильтруем уникальные модели по ID
        const uniqueModels = models.filter((model, index, self) =>
          index === self.findIndex((m) => m.id === model.id)
        );
        
        setAvailableModels(uniqueModels);
        
        // Собираем регионы из первой модели (они одинаковы для всех моделей)
        if (data.length > 0 && data[0].filter_by_region && Array.isArray(data[0].filter_by_region)) {
          const regions = data[0].filter_by_region.map(region => ({
            id: region.region_id,
            name: region.region_name
          }));
          setAvailableRegions(regions);
        }
      }
      
      // Если включено сравнение, делаем запрос для прошлого года
      if (showComparison && !forComparison) {
        fetchAnalyticsData(true, currentPeriod);
      }
    }
  } catch (error) {
    console.error(`Ошибка при получении ${forComparison ? 'сравнительных' : 'текущих'} данных:`, error);
    if (!forComparison) setHasError(true);
    
    // В случае ошибки устанавливаем демо-данные чтобы график все равно отображался
    if (!forComparison) {
      setSalesData(Array(displayLabels.length).fill(0).map(() => Math.floor(Math.random() * 100) + 50));
    } else {
      setLastYearSalesData(Array(displayLabels.length).fill(0).map(() => Math.floor(Math.random() * 100) + 50));
    }
  } finally {
    setIsLoading(false);
    if (!forComparison) {
      setTimeout(() => {
        setIsFilterAnimating(false);
      }, 500);
    }
  }
};
  
const processApiData = (data, forComparison = false) => {
  // Если данные отсутствуют, возвращаем пустой массив
  if (!Array.isArray(data) || data.length === 0) {
    console.log('Нет данных для обработки');
    return [];
  }
  
  try {
    // Получаем текущую дату для определения, какие месяцы уже прошли
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11, где 0 - январь
    
    // Создаем массив только для прошедших месяцев текущего года
    const monthlyValues = Array(currentMonth + 1).fill(0);
    
    // Обрабатываем данные
    data.forEach(model => {
      // Пропускаем модель, если выбрана конкретная модель и это не она
      if (selectedModel && model.model_id !== selectedModel) {
        return;
      }
      
      // Проверяем наличие данных по месяцам
      if (model.filter_by_month && Array.isArray(model.filter_by_month)) {
        model.filter_by_month.forEach(monthData => {
          if (monthData && monthData.month) {
            // Получаем месяц и год из формата "YYYY-MM"
            const [year, month] = monthData.month.split('-').map(Number);
            
            // Обрабатываем только данные текущего года и только прошедшие месяцы
            if (year === currentYear && month - 1 <= currentMonth) {
              // Индекс месяца (0-11)
              const monthIndex = month - 1;
              
              // Обрабатываем данные по регионам
              if (monthData.regions && Array.isArray(monthData.regions)) {
                monthData.regions.forEach(region => {
                  // Пропускаем, если выбран конкретный регион, и это не он
                  if (selectedRegion && region.region_id !== selectedRegion) {
                    return;
                  }
                  
                  // Получаем значение в зависимости от вкладки
                  let value = 0;
                  if (activeTab === 'месяц' || activeTab === 'contracts') {
                    value = parseInt(region.contract || 0);
                  } else {
                    value = parseInt(region.total_price || 0);
                  }
                  
                  // Добавляем значение к соответствующему месяцу
                  monthlyValues[monthIndex] += value;
                });
              }
            }
          }
        });
      }
    });
    
    console.log('Обработанные данные по прошедшим месяцам текущего года:', monthlyValues);
    return monthlyValues;
  } catch (error) {
    console.error('Ошибка при обработке данных:', error);
    return [];
  }
};

  useEffect(() => {
  if (isFirstRender.current) {
    isFirstRender.current = false;
    
    // Настройка периода только за текущий год
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1); // 1 января текущего года
    
    const currentYearPeriod = {
      start: startOfYear.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0]
    };
    
    // Устанавливаем период для даты за текущий год
    setDateRange(currentYearPeriod);
    if (setPeriod) {
      setPeriod(currentYearPeriod);
    }
    
    // Если нет переданных начальных данных, загружаем из API с периодом за текущий год
    if (initialSalesData.length === 0) {
      setTimeout(() => {
        fetchAnalyticsData(false, currentYearPeriod);
      }, 500);
    } else {
      // Иначе используем переданные данные
      setSalesData(initialSalesData);
      if (initialLastYearData.length > 0) {
        setLastYearSalesData(initialLastYearData);
      }
    }
  }
}, []);
  
  // Эффект для обновления данных при изменении фильтров
  useEffect(() => {
    if (!isFirstRender.current) {
      console.log('Фильтры изменились, обновляем данные');
      setIsLoading(true);
    
      // Небольшая задержка для визуального эффекта загрузки
      setTimeout(() => {
        fetchAnalyticsData();
        if (showComparison) {
          setTimeout(() => {
            fetchAnalyticsData(true);
          }, 200);
        }
      }, 300);
    }
  }, [selectedModel, selectedRegion, activeTab, period]);
  
  // Эффект для обновления сравнительных данных при включении сравнения
  useEffect(() => {
    if (showComparison && !isFirstRender.current) {
      fetchAnalyticsData(true);
    }
  }, [showComparison]);
  
  // Общая сумма продаж
  const totalSales = useMemo(() => {
    return salesData.reduce((a, b) => a + b, 0);
  }, [salesData]);
  
  // Процент роста
  const growthPercent = useMemo(() => {
    const lastYearTotal = lastYearSalesData.reduce((a, b) => a + b, 0);
    if (lastYearTotal === 0) return "0.0";
    return ((totalSales - lastYearTotal) / lastYearTotal * 100).toFixed(1);
  }, [salesData, lastYearSalesData, totalSales]);
  
  // Максимальное значение для графика
  const maxValue = useMemo(() => {
    const max = showComparison
      ? Math.max(...salesData, ...lastYearSalesData)
      : Math.max(...salesData);
    
    return max > 0 ? max * 1.1 : 100;
  }, [salesData, lastYearSalesData, showComparison]);
  
  // Отслеживаем клики вне выпадающих списков
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target)) {
        setShowModelDropdown(false);
      }
      if (regionDropdownRef.current && !regionDropdownRef.current.contains(event.target)) {
        setShowRegionDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
const renderChart = () => {
  if (!chartRef.current) return;
  
  const container = chartRef.current;
  const tooltip = tooltipRef.current;
  
  // Очистка существующего графика
  d3.select(container).selectAll('*').remove();
  
  const currentPeriod = period || dateRange;
  const start = new Date(currentPeriod.start);
  const end = new Date(currentPeriod.end);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Определяем, нужно ли отображать по месяцам или один столбец
  const showMonthlyView = diffDays > 31;
  
  // Текущая дата - для проверки доступности месяцев
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Подготавливаем данные и метки
  let currentLabels = [];
  let currentData = [];
  let comparisonData = [];
  
  if (showMonthlyView) {
    // Для месячного представления формируем метки по месяцам
    let currentDate = new Date(start.getFullYear(), start.getMonth(), 1);
    
    // Отслеживаем уже добавленные месяцы, чтобы не было дубликатов
    const addedMonthKeys = new Set();
    
    // Создаем массивы для хранения данных
    const labelsArray = [];
    const currentDataArray = [];
    const comparisonDataArray = [];
    
    // Собираем все месяцы в диапазоне
    while (currentDate <= end) {
      // Создаем уникальный ключ для месяца в формате "MM-YYYY"
      const monthKey = `${currentDate.getMonth()}-${currentDate.getFullYear()}`;
      
      // Пропускаем, если такой месяц уже добавлен
      if (addedMonthKeys.has(monthKey)) {
        // Переходим к следующему месяцу
        currentDate.setMonth(currentDate.getMonth() + 1);
        continue;
      }
      
      // Добавляем ключ в Set
      addedMonthKeys.add(monthKey);
      
      // Форматируем метку месяца
      const monthName = currentDate.toLocaleDateString('ru-RU', { month: 'short' });
      
      // Если год не текущий, добавляем его к метке
      const labelWithYear = currentDate.getFullYear() !== currentYear 
        ? `${monthName} ${currentDate.getFullYear()}`
        : monthName;
      
      labelsArray.push(labelWithYear);
      
      // Проверяем, доступен ли месяц в текущем году
      const isMonthAvailableCurrentYear = currentDate <= now;
      
      // Ищем данные для этого месяца
      const monthIndex = currentDate.getMonth();
      let value = null;
      
      // Заполняем данные
      if (isMonthAvailableCurrentYear) {
        value = (Array.isArray(salesData) && monthIndex < salesData.length) 
          ? salesData[monthIndex] 
          : 0;
      }
      
      currentDataArray.push(value);
      
      // Данные для прошлого года
      if (showComparison) {
        const lastYearDate = new Date(currentDate);
        lastYearDate.setFullYear(lastYearDate.getFullYear() - 1);
        const lastYearMonthIndex = lastYearDate.getMonth();
        
        const lastYearValue = (Array.isArray(lastYearSalesData) && lastYearMonthIndex < lastYearSalesData.length) 
          ? lastYearSalesData[lastYearMonthIndex] 
          : 0;
        
        comparisonDataArray.push(lastYearValue);
      }
      
      // Переходим к следующему месяцу
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    // Присваиваем подготовленные данные
    currentLabels = labelsArray;
    currentData = currentDataArray;
    
    if (showComparison) {
      comparisonData = comparisonDataArray;
    }
  } else {
    // Для короткого периода - один столбец
    const formattedStart = start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    const formattedEnd = end.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    const label = formattedStart === formattedEnd ? formattedStart : `${formattedStart} - ${formattedEnd}`;
    
    // Добавляем год, если не текущий
    const labelWithYear = start.getFullYear() !== currentYear 
      ? `${label} ${start.getFullYear()}`
      : label;
    
    currentLabels = [labelWithYear];
    
    // Проверяем, доступен ли период
    const isPeriodAvailable = start <= now;
    
    // Суммируем все значения за период
    const totalValue = isPeriodAvailable
      ? salesData.reduce((sum, val) => sum + (val || 0), 0)
      : null;
    
    currentData = [totalValue !== null ? (totalValue > 0 ? totalValue : 0) : null];
    
    // Если включено сравнение, готовим данные для прошлого года
    if (showComparison) {
      const lastYearTotal = lastYearSalesData.reduce((sum, val) => sum + (val || 0), 0);
      comparisonData = [lastYearTotal || 0];
    }
  }
  
  // Если нет данных для отображения
  if ((currentData.every(val => val === null || val === 0) || currentData.length === 0) && 
      (!showComparison || comparisonData.every(val => val === 0) || comparisonData.length === 0)) {
    d3.select(container)
      .append('div')
      .attr('class', 'flex items-center justify-center h-full')
      .append('span')
      .attr('class', 'text-gray-400')
      .text('Нет данных для отображения');
    return;
  }
  
  // Размеры графика
  // Увеличиваем отступ слева для меток шкалы
  const margin = { top: 30, right: 30, bottom: 60, left: 80 };
  const width = container.clientWidth - margin.left - margin.right;
  const height = container.clientHeight - margin.top - margin.bottom;
  
  // Создание SVG
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  
  // Шкалы
  const x = d3.scaleBand()
    .domain(currentLabels)
    .range([0, width])
    .padding(0.3);
  
  // Находим максимальное значение для оси Y, игнорируя null
  const allValues = [...currentData.filter(v => v !== null), ...comparisonData.filter(v => v !== null)];
  const yMax = Math.max(...allValues, 1) * 1.1; // Минимум 1, чтобы избежать деления на 0
  
  const y = d3.scaleLinear()
    .domain([0, yMax])
    .range([height, 0]);
  
  // Оси
  const xAxis = d3.axisBottom(x)
    .tickSizeOuter(0);
  
  const yAxis = d3.axisLeft(y)
    .ticks(5)
    .tickFormat(d => {
      if (activeTab === 'год') {
        // Форматирование для сумм
        if (d >= 1000000000) {
          return d3.format('.1f')(d / 1000000000) + ' млрд';
        } else if (d >= 1000000) {
          return d3.format('.1f')(d / 1000000) + ' млн';
        } else if (d >= 1000) {
          return d3.format(',d')(d / 1000) + ' тыс';
        }
        return d3.format(',d')(d);
      } else {
        // Форматирование для контрактов
        if (d >= 1000) {
          return d3.format(',d')(d / 1000) + 'K';
        }
        return d3.format(',d')(d);
      }
    })
    .tickSizeInner(-width)
    .tickSizeOuter(0);
  
  // Добавление осей
  svg.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${height})`)
    .call(xAxis)
    .selectAll('text')
    .attr('fill', '#D1D5DB')
    .attr('font-size', '12px')
    .attr('transform', 'rotate(-15)')
    .attr('text-anchor', 'end')
    .attr('dy', '0.5em')
    .attr('dx', '-0.5em');
  
  svg.append('g')
    .attr('class', 'y-axis')
    .call(yAxis)
    .selectAll('text')
    .attr('fill', '#D1D5DB')
    .attr('font-size', '12px');
  
  // Стили для сетки
  svg.selectAll('.y-axis line')
    .attr('stroke', 'rgba(75, 85, 99, 0.3)')
    .attr('stroke-dasharray', '2,2');
  
  svg.selectAll('.y-axis path, .x-axis path')
    .attr('stroke', 'rgba(75, 85, 99, 0.7)');
  
  // Функция для отображения тултипа
 // Функция для отображения тултипа
const showTooltip = (event, value, label, isLastYear, index) => {
  // Если значение null, не показываем тултип
  if (value === null) return;
  
  // Находим соответствующее значение для сравнения
  let currentValue = isLastYear ? null : value;
  let lastYearValue = isLastYear ? value : null;
  
  if (showComparison) {
    if (isLastYear) {
      // Если это прошлогоднее значение, берем текущее по индексу
      currentValue = index < currentData.length ? currentData[index] : null;
    } else {
      // Если это текущее значение, берем прошлогоднее по индексу
      lastYearValue = index < comparisonData.length ? comparisonData[index] : 0;
    }
  }
  
  // Функция форматирования значений в зависимости от типа данных
  const formatValue = val => {
    if (val === null) return "Нет данных";
    
    if (activeTab === 'год') {
      // Форматирование для сумм
      return new Intl.NumberFormat('ru-RU', { 
        style: 'currency', 
        currency: 'UZS',
        maximumFractionDigits: 0
      }).format(val);
    } else {
      // Форматирование для контрактов
      return val.toLocaleString();
    }
  };
  
  // Рассчитываем процент изменения если есть оба значения
  let percentChange = null;
  if (currentValue !== null && lastYearValue > 0) {
    percentChange = ((currentValue - lastYearValue) / lastYearValue * 100).toFixed(1);
  }
  
  // Создаем красивый тултип с градиентом
  let tooltipContent = `
    <div class="relative overflow-hidden rounded-md" style="background: linear-gradient(120deg, #1e293b, #111927);">
      <div class="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" 
           style="background: radial-gradient(circle, rgba(168,85,247,0.6) 0%, rgba(0,0,0,0) 70%); transform: translate(30%, -30%);"></div>
      
      <div class="px-4 py-3 border-b border-gray-700">
        <div class="font-bold text-center text-white text-sm">${label}</div>
      </div>
      
      <div class="p-4">
  `;
  
  // Если есть сравнение и оба значения
  if (showComparison && currentValue !== null && lastYearValue > 0) {
    tooltipContent += `
      <div class="flex items-center justify-between mb-3">
        <div class="flex flex-col">
          <div class="font-bold text-xl text-white">${formatValue(currentValue)}</div>
          <div class="text-xs text-gray-400 mt-0.5">текущее значение</div>
        </div>
        
        <div class="h-full border-r border-gray-700 mx-2"></div>
        
        <div class="flex flex-col items-end">
          <div class="text-base text-gray-300">${formatValue(lastYearValue)}</div>
          <div class="text-xs text-gray-400 mt-0.5">предыдущий период</div>
        </div>
      </div>
      
      <div class="flex items-center justify-center mt-2 ${percentChange >= 0 ? 'text-green-400' : 'text-red-400'}">
        <div class="flex items-center gap-1 px-3 py-1 rounded-full ${percentChange >= 0 ? 'bg-green-900/20' : 'bg-red-900/20'} 
                    ${percentChange >= 0 ? 'border border-green-800/30' : 'border border-red-800/30'}">
          ${percentChange >= 0 ? 
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg>' : 
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>'}
          <span class="font-bold">${percentChange >= 0 ? '+' : ''}${percentChange}%</span>
        </div>
      </div>
    `;
  } else {
    // Если нет сравнения или одно из значений отсутствует
    const displayValue = currentValue !== null ? currentValue : (lastYearValue > 0 ? lastYearValue : value);
    
    tooltipContent += `
      <div class="flex flex-col items-center">
        <div class="font-bold text-xl text-white">${formatValue(displayValue)}</div>
        <div class="text-xs text-gray-400 mt-1">
          ${activeTab === 'месяц' ? 'контрактов' : 'сумма'}
        </div>
      </div>
    `;
  }
  
  tooltipContent += `
      </div>
    </div>
  `;
  
  // Позиционирование тултипа
  const tooltipWidth = 240;
  const tooltipHeight = showComparison && currentValue !== null && lastYearValue > 0 ? 140 : 100;
  
  let xPos = event.pageX - container.getBoundingClientRect().left;
  let yPos = event.pageY - container.getBoundingClientRect().top;
  
  if (xPos + tooltipWidth > container.clientWidth) {
    xPos = xPos - tooltipWidth;
  }
  
  if (yPos - tooltipHeight < 0) {
    yPos = yPos + 20;
  } else {
    yPos = yPos - tooltipHeight - 10;
  }
  
  d3.select(tooltip)
    .html(tooltipContent)
    .style('left', `${xPos}px`)
    .style('top', `${yPos}px`)
    .style('opacity', 1)
    .style('width', `${tooltipWidth}px`)
    .style('border-radius', '6px')
    .style('overflow', 'hidden')
    .style('box-shadow', '0 4px 20px rgba(0, 0, 0, 0.3)');
};
  
  // Функция для скрытия тултипа
  const hideTooltip = () => {
    d3.select(tooltip).style('opacity', 0);
  };
  
  // Градиент для столбцов текущего года
  const gradient = svg.append('defs')
    .append('linearGradient')
    .attr('id', 'purpleGradient')
    .attr('x1', '0%')
    .attr('x2', '0%')
    .attr('y1', '0%')
    .attr('y2', '100%');
  
  gradient.append('stop')
    .attr('offset', '0%')
    .attr('stop-color', '#A855F7');
  
  gradient.append('stop')
    .attr('offset', '50%')
    .attr('stop-color', '#9333EA');
  
  gradient.append('stop')
    .attr('offset', '100%')
    .attr('stop-color', '#7E22CE');
  
  // Добавляем легенду, если включено сравнение
  if (showComparison) {
    const legendX = width - 220;
    const legendY = 10;
    
    // Фон для легенды
    svg.append('rect')
      .attr('x', legendX - 10)
      .attr('y', legendY - 5)
      .attr('width', 220)
      .attr('height', 40)
      .attr('rx', 4)
      .attr('fill', 'rgba(31, 41, 55, 0.7)')
      .attr('stroke', 'rgba(75, 85, 99, 0.5)');
    
    // Текущий год
    svg.append('rect')
      .attr('x', legendX)
      .attr('y', legendY)
      .attr('width', 20)
      .attr('height', 10)
      .attr('rx', 2)
      .attr('fill', 'url(#purpleGradient)');
    
    svg.append('text')
      .attr('x', legendX + 30)
      .attr('y', legendY + 8)
      .attr('fill', '#D1D5DB')
      .attr('font-size', '12px')
      .text('Текущий год');
    
    // Прошлый год
    svg.append('rect')
      .attr('x', legendX + 120)
      .attr('y', legendY)
      .attr('width', 20)
      .attr('height', 10)
      .attr('rx', 2)
      .attr('fill', 'rgba(59, 130, 246, 0.7)');
    
    svg.append('text')
      .attr('x', legendX + 150)
      .attr('y', legendY + 8)
      .attr('fill', '#D1D5DB')
      .attr('font-size', '12px')
      .text('Прошлый год');
    
    // Недоступные данные
    svg.append('rect')
      .attr('x', legendX)
      .attr('y', legendY + 20)
      .attr('width', 20)
      .attr('height', 10)
      .attr('rx', 2)
      .attr('fill', 'rgba(107, 114, 128, 0.1)')
      .attr('stroke', 'rgba(107, 114, 128, 0.3)')
      .attr('stroke-dasharray', '2,2');
    
    svg.append('text')
      .attr('x', legendX + 30)
      .attr('y', legendY + 28)
      .attr('fill', '#D1D5DB')
      .attr('font-size', '12px')
      .text('Данные недоступны');
  }
  
  // Рисуем столбцы
  currentLabels.forEach((label, i) => {
    const value = i < currentData.length ? currentData[i] : null;
    const lastYearValue = i < comparisonData.length ? comparisonData[i] : 0;
    
    if (showComparison) {
      // Рисуем столбцы прошлого года
      svg.append('rect')
        .attr('class', 'bar-last-year')
        .attr('x', x(label))
        .attr('width', x.bandwidth() / 2 - 2)
        .attr('rx', 2)
        .attr('fill', 'rgba(59, 130, 246, 0.7)')
        .attr('filter', 'drop-shadow(0 0 2px rgba(59, 130, 246, 0.3))')
        .attr('y', height)
        .attr('height', 0)
        .on('mouseover', function(event) {
          d3.select(this).attr('fill', 'rgba(96, 165, 250, 0.9)');
          showTooltip(event, lastYearValue, label, true, i);
        })
        .on('mousemove', function(event) {
          showTooltip(event, lastYearValue, label, true, i);
        })
        .on('mouseout', function() {
          d3.select(this).attr('fill', 'rgba(59, 130, 246, 0.7)');
          hideTooltip();
        })
        .transition()
        .duration(800)
        .delay(i * 30)
        .attr('y', y(lastYearValue))
        .attr('height', height - y(lastYearValue));
      
      // Добавляем значение над столбцом прошлого года
      if (lastYearValue > 0) {
        svg.append("text")
          .attr("x", x(label) + (x.bandwidth() / 4))
          .attr("y", y(lastYearValue) - 5)
          .attr("text-anchor", "middle")
          .attr("font-size", "10px")
          .attr("fill", "#D1D5DB")
          .text(formatDisplayValue(lastYearValue));
      }
      
      // Рисуем столбцы текущего года только если значение не null
      if (value !== null) {
        svg.append('rect')
          .attr('class', 'bar-current-year')
          .attr('x', x(label) + x.bandwidth() / 2 + 2)
          .attr('width', x.bandwidth() / 2 - 2)
          .attr('rx', 2)
          .attr('fill', 'url(#purpleGradient)')
          .attr('filter', 'drop-shadow(0 0 5px rgba(168, 85, 247, 0.5))')
          .attr('y', height)
          .attr('height', 0)
          .on('mouseover', function(event) {
            d3.select(this).attr('fill', '#b975fa');
            showTooltip(event, value, label, false, i);
          })
          .on('mousemove', function(event) {
            showTooltip(event, value, label, false, i);
          })
          .on('mouseout', function() {
            d3.select(this).attr('fill', 'url(#purpleGradient)');
            hideTooltip();
          })
          .transition()
          .duration(800)
          .delay(i * 30)
          .attr('y', y(value))
          .attr('height', height - y(value));
          
        // Добавляем значение над столбцом текущего года
        svg.append("text")
          .attr("x", x(label) + x.bandwidth() / 2 + 2 + (x.bandwidth() / 4))
          .attr("y", y(value) - 5)
          .attr("text-anchor", "middle")
          .attr("font-size", "10px")
          .attr("fill", "#D1D5DB")
          .text(formatDisplayValue(value));
      } else {
        // Если данных для текущего года нет, показываем пунктирный плейсхолдер
        svg.append('rect')
          .attr('class', 'bar-current-year-placeholder')
          .attr('x', x(label) + x.bandwidth() / 2 + 2)
          .attr('width', x.bandwidth() / 2 - 2)
          .attr('height', height)
          .attr('y', 0)
          .attr('rx', 2)
          .attr('fill', 'rgba(107, 114, 128, 0.1)')
          .attr('stroke', 'rgba(107, 114, 128, 0.3)')
          .attr('stroke-dasharray', '2,2');
      }
    } else {
      // Если нет сравнения, рисуем один столбец на всю ширину
      if (value !== null) {
        svg.append('rect')
          .attr('class', 'bar-current-year')
          .attr('x', x(label))
          .attr('width', x.bandwidth())
          .attr('rx', 2)
          .attr('fill', 'url(#purpleGradient)')
          .attr('filter', 'drop-shadow(0 0 5px rgba(168, 85, 247, 0.5))')
          .attr('y', height)
          .attr('height', 0)
          .on('mouseover', function(event) {
            d3.select(this).attr('fill', '#b975fa');
            showTooltip(event, value, label, false, i);
          })
          .on('mousemove', function(event) {
            showTooltip(event, value, label, false, i);
          })
          .on('mouseout', function() {
            d3.select(this).attr('fill', 'url(#purpleGradient)');
            hideTooltip();
          })
          .transition()
          .duration(800)
          .delay(i * 30)
          .attr('y', y(value))
          .attr('height', height - y(value));
          
        // Добавляем значение над столбцом
        svg.append("text")
          .attr("x", x(label) + x.bandwidth() / 2)
          .attr("y", y(value) - 5)
          .attr("text-anchor", "middle")
          .attr("font-size", "10px")
          .attr("fill", "#D1D5DB")
          .text(formatDisplayValue(value));
      } else {
        // Если данных нет, показываем плейсхолдер
        svg.append('rect')
          .attr('class', 'bar-current-year-placeholder')
          .attr('x', x(label))
          .attr('width', x.bandwidth())
          .attr('height', height)
          .attr('y', 0)
          .attr('rx', 2)
          .attr('fill', 'rgba(107, 114, 128, 0.1)')
          .attr('stroke', 'rgba(107, 114, 128, 0.3)')
          .attr('stroke-dasharray', '2,2');
      }
    }
  });
};
  
  useEffect(() => {
    if (chartRef.current) {
      renderChart();
    }
  }, [salesData, lastYearSalesData, showComparison, displayLabels, maxValue]);
  
  // Эффект для обновления графика при изменении размера окна
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) {
        renderChart();
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [salesData, lastYearSalesData, showComparison, displayLabels, maxValue]);
  
  // Обработчики событий
  
  // Обработчик выбора модели
  const handleModelSelect = (modelId) => {
    const newModelValue = modelId === selectedModel ? null : modelId;
    if (setSelectedModel) {
      setSelectedModel(newModelValue);
    } else {
      // Если внешний setSelectedModel отсутствует, обновляем данные сами
      setTimeout(() => {
        fetchAnalyticsData();
        if (showComparison) fetchAnalyticsData(true);
      }, 0);
    }
    setShowModelDropdown(false);
  };
  
  // Обработчик выбора региона
  const handleRegionSelect = (regionId) => {
    const newRegionValue = regionId === selectedRegion ? null : regionId;
    setSelectedRegion(newRegionValue);
    setShowRegionDropdown(false);
  };
  
  // Обработчик выбора периода
  const handlePeriodChange = (e) => {
    if (e.target.value === 'custom') {
      setShowPeriodModal(true);
    } else {
      const now = new Date();
      let start = new Date();
      
      switch(e.target.value) {
        case '7days': start.setDate(now.getDate() - 7); break;
        case '30days': start.setDate(now.getDate() - 30); break;
        case '90days': start.setDate(now.getDate() - 90); break;
        case '6months': start.setMonth(now.getMonth() - 6); break;
        case '12months': start.setMonth(now.getMonth() - 12); break;
        default: start.setDate(now.getDate() - 30);
      }
      
      const newPeriod = {
        start: start.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0]
      };
      
      setDateRange(newPeriod);
      if (setPeriod) {
        setPeriod(newPeriod);
      } else {
        // Если внешний setPeriod отсутствует, обновляем данные сами
        setTimeout(() => {
          const updatedPeriod = period || newPeriod;
          setDisplayLabels(getLabelsForPeriod(updatedPeriod.start, updatedPeriod.end));
          fetchAnalyticsData();
        }, 0);
      }
    }
  };
  
  // Применение выбранных дат
  const applyDateFilter = () => {
    // Проверка корректности дат
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    if (startDate > endDate) {
      alert('Дата начала не может быть позже даты окончания');
      return;
    }
    
    if (setPeriod) {
      setPeriod(dateRange);
    } else {
      // Если внешний setPeriod отсутствует, обновляем данные сами
      setDisplayLabels(getLabelsForPeriod(dateRange.start, dateRange.end));
      setTimeout(() => {
        fetchAnalyticsData();
      }, 0);
    }
    setShowPeriodModal(false);
  };
  
  // Переключатель сравнения с прошлым годом
  const toggleComparison = () => {
    const newComparisonState = !showComparison;
    setShowComparison(newComparisonState);
    
    // Если включили сравнение, запрашиваем данные для прошлого года
    if (newComparisonState) {
      setTimeout(() => {
        fetchAnalyticsData(true);
      }, 0);
    }
  };
  
  // Переключатель вкладок (месяц/год)
  const handleTabChange = (tab) => {
    if (setActiveTab) {
      setActiveTab(tab);
    } else {
      // Если внешний setActiveTab отсутствует, обновляем данные сами
      setTimeout(() => {
        fetchAnalyticsData();
      }, 0);
    }
  };
  
  // Обновление данных вручную
  const handleRefreshData = () => {
    fetchAnalyticsData();
    if (showComparison) {
      setTimeout(() => {
        fetchAnalyticsData(true);
      }, 100);
    }
  };
  
  // Сброс фильтров
  const resetFilters = () => {
    if (setSelectedModel) {
      setSelectedModel(null);
    }
    setSelectedRegion(null);
    
    // Делаем запрос после сброса фильтров
    setTimeout(() => {
      fetchAnalyticsData();
      if (showComparison) {
        fetchAnalyticsData(true);
      }
    }, 0);
  };
  
  // Информация о выбранных фильтрах
  const selectedModelInfo = useMemo(() => {
    if (!selectedModel) return null;
    
    // Сначала ищем в загруженных с API моделях
    if (availableModels.length > 0) {
      const apiModel = availableModels.find(m => m.id === selectedModel);
      if (apiModel) return apiModel;
    }
    
    // Затем в переданных извне
    return carModels.find(m => m.id === selectedModel) || null;
  }, [selectedModel, carModels, availableModels]);
  
  const selectedRegionInfo = useMemo(() => {
    if (!selectedRegion) return null;
    
    // Сначала ищем в загруженных с API регионах
    if (availableRegions.length > 0) {
      const apiRegion = availableRegions.find(r => r.id === selectedRegion);
      if (apiRegion) return apiRegion;
    }
    
    // Затем в переданных извне
    return regions.find(r => r.id === selectedRegion) || null;
  }, [selectedRegion, regions, availableRegions]);
  
  // Функция для определения категории модели
  const getModelCategory = (category) => {
    switch(category) {
      case 'suv': return 'Внедорожник';
      case 'sedan': return 'Седан';
      case 'minivan': return 'Минивэн';
      default: return category || 'Автомобиль';
    }
  };
  
  // Функция для получения описания периода
  const getPeriodDescription = () => {
    const currentPeriod = period || dateRange;
    const start = new Date(currentPeriod.start);
    const end = new Date(currentPeriod.end);
    const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) return 'последнюю неделю';
    if (diffDays <= 14) return 'последние 2 недели';
    if (diffDays <= 31) return 'последний месяц';
    if (diffDays <= 90) return 'последние 3 месяца';
    if (diffDays <= 180) return 'последние 6 месяцев';
    if (diffDays <= 365) return 'последний год';
    return 'выбранный период';
  };
  
  // Получаем модели для отображения в выпадающем списке
  const displayModels = useMemo(() => {
    // Если есть модели из API, используем их
    if (availableModels.length > 0) {
      return availableModels;
    }
    
    // Иначе используем переданные извне
    return carModels;
  }, [availableModels, carModels]);
  
  // Получаем регионы для отображения в выпадающем списке
  const displayRegions = useMemo(() => {
    // Если есть регионы из API, используем их
    if (availableRegions.length > 0) {
      return availableRegions;
    }
    
    // Иначе используем переданные извне
    return regions;
  }, [availableRegions, regions]);
  
  // Рендеринг компонента
  return (
    <>
      {/* Заголовок с инфо о выборе */}
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <BarChart3 size={20} className="text-purple-400" />
          <div>
            Продажи за {getPeriodDescription()}
            {(selectedModelInfo || selectedRegionInfo) && (
              <div className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
                {selectedModelInfo && `${selectedModelInfo.name}`}
                {selectedModelInfo && selectedRegionInfo && " • "}
                {selectedRegionInfo && `${selectedRegionInfo.name}`}
              </div>
            )}
          </div>
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-white">{totalSales.toLocaleString()}</span>
          <span className={`px-2 py-1 ${parseFloat(growthPercent) >= 0 ? 'bg-green-900/50 text-green-400 border-green-800' : 'bg-red-900/50 text-red-400 border-red-800'} text-sm rounded-md border`}>
            {parseFloat(growthPercent) >= 0 ? '+' : ''}{growthPercent}%
          </span>
        </div>
      </div>
      
      {/* Панель фильтров */}
      <div className="p-3 bg-gray-850 border-b border-gray-700">
        <div className="flex flex-wrap gap-2">
          {/* Выбор модели */}
          <div className="relative inline-block" ref={modelDropdownRef}>
            <button
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 text-sm border ${
                selectedModelInfo 
                  ? 'bg-purple-900/30 text-purple-100 border-purple-700'
                  : 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600'
              }`}
              onClick={() => {
                setShowModelDropdown(!showModelDropdown);
                setShowRegionDropdown(false);
              }}
            >
              <Car size={14} />
              <span>{selectedModelInfo ? selectedModelInfo.name : "Выбрать модель"}</span>
              {selectedModelInfo ? (
                <button 
                  className="ml-1 text-gray-400 hover:text-white" 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (setSelectedModel) {
                      setSelectedModel(null);
                    } else {
                      setTimeout(() => {
                        fetchAnalyticsData();
                        if (showComparison) fetchAnalyticsData(true);
                      }, 0);
                    }
                  }}
                >
                  <X size={12} />
                </button>
              ) : (
                <ChevronDown size={14} className="ml-1" />
              )}
            </button>
            
            {/* Выпадающий список моделей */}
            {showModelDropdown && (
              <div className="absolute left-0 mt-1 w-72 bg-gray-800 rounded-md shadow-lg overflow-hidden z-20 border border-gray-700">
                <div className="p-2 border-b border-gray-700 flex justify-between items-center">
                  <span className="text-sm font-medium text-white">Модели автомобилей</span>
                  {selectedModelInfo && (
                    <button 
                      className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                      onClick={() => {
                        if (setSelectedModel) {
                          setSelectedModel(null);
                        }
                        setShowModelDropdown(false);
                      }}
                    >
                      <RefreshCcw size={10} />
                      Сбросить
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto py-1">
                  {displayModels.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-400 text-center">
                      Загрузка моделей...
                    </div>
                  ) : (
                    displayModels.map(model => (
                      <div 
                        key={model.id}
                        className={`flex items-center p-2 cursor-pointer gap-3 hover:bg-gray-700/70 ${
                          selectedModel === model.id ? 'bg-purple-900/30' : ''
                        }`}
                        onClick={() => handleModelSelect(model.id)}
                      >
                        <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-700/70 flex-shrink-0 flex items-center justify-center">
                          <img 
                            src={model.img} 
                            alt={model.name} 
                            className="h-full w-auto object-contain"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/100?text=Нет+фото';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center">
                            <span className="text-sm text-white font-medium">{model.name}</span>
                            {selectedModel === model.id && (
                              <Check size={14} className="ml-2 text-purple-400" />
                            )}
                          </div>
                          <div className="text-xs text-gray-400">{getModelCategory(model.category)}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Выбор региона */}
          <div className="relative inline-block" ref={regionDropdownRef}>
            <button
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 text-sm border ${
                selectedRegionInfo 
                  ? 'bg-blue-900/30 text-blue-100 border-blue-700'
                  : 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600'
              }`}
              onClick={() => {
                setShowRegionDropdown(!showRegionDropdown);
                setShowModelDropdown(false);
              }}
            >
              <MapPin size={14} />
              <span>{selectedRegionInfo ? selectedRegionInfo.name : "Выбрать регион"}</span>
              {selectedRegionInfo ? (
                <button 
                  className="ml-1 text-gray-400 hover:text-white" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRegion(null);
                  }}
                >
                  <X size={12} />
                </button>
              ) : (
                <ChevronDown size={14} className="ml-1" />
              )}
            </button>
            
            {/* Выпадающий список регионов */}
            {showRegionDropdown && (
              <div className="absolute left-0 mt-1 w-56 bg-gray-800 rounded-md shadow-lg overflow-hidden z-20 border border-gray-700">
                <div className="p-2 border-b border-gray-700 flex justify-between items-center">
                  <span className="text-sm font-medium text-white">Регионы</span>
                  {selectedRegionInfo && (
                    <button 
                      className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                      onClick={() => {
                        setSelectedRegion(null);
                        setShowRegionDropdown(false);
                      }}
                    >
                      <RefreshCcw size={10} />
                      Сбросить
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto py-1">
                  {displayRegions.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-400 text-center">
                      Загрузка регионов...
                    </div>
                  ) : (
                    displayRegions.map(region => (
                      <div 
                        key={region.id}
                        className={`flex items-center p-2 cursor-pointer hover:bg-gray-700/70 ${
                          selectedRegion === region.id ? 'bg-blue-900/30' : ''
                        }`}
                        onClick={() => handleRegionSelect(region.id)}
                      >
                        <MapPin size={14} className="text-gray-400 mr-2" />
                        <span className="text-sm text-white">{region.name}</span>
                        {selectedRegion === region.id && (
                          <Check size={14} className="ml-auto text-blue-400" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          {/* Кнопка обновления данных */}
          <button 
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-md text-white text-sm flex items-center gap-1.5"
            onClick={handleRefreshData}
            disabled={isLoading}
          >
            <RefreshCcw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>{isLoading ? 'Загрузка...' : 'Обновить данные'}</span>
          </button>
          
          {/* Растягивающийся элемент */}
          <div className="flex-grow"></div>
          
          {/* Сброс фильтров */}
          {(selectedModelInfo || selectedRegionInfo) && (
            <button 
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-md text-white text-sm flex items-center gap-1.5"
              onClick={resetFilters}
            >
              <RefreshCcw size={14} />
              <span>Сбросить фильтры</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Основной контент */}
      
      <div className="p-4">
        {/* График D3 */}
        <div className={`relative h-80 mb-4 bg-gray-900 rounded-lg p-4 border border-gray-700 shadow-inner ${isFilterAnimating ? 'animate-pulse' : ''}`}>
          <div ref={chartRef} className="w-full h-full"></div>
          
          <div 
            ref={tooltipRef}
            className="absolute opacity-0 bg-gray-800 text-white p-3 rounded-md text-sm min-w-[160px] z-10 border border-gray-700 shadow-xl pointer-events-none"
          ></div>
          
          {/* Информация о выбранных фильтрах */}
          {(selectedModelInfo || selectedRegionInfo) && (
            <div className="absolute top-4 left-4 flex gap-2 items-center">
              {selectedModelInfo && (
                <div className="px-2 py-1 bg-purple-900/50 text-white text-xs rounded-full border border-purple-700 flex items-center gap-1">
                  <Car size={10} className="text-purple-300" />
                  <span>{selectedModelInfo.name}</span>
                </div>
              )}
              {selectedRegionInfo && (
                <div className="px-2 py-1 bg-blue-900/50 text-white text-xs rounded-full border border-blue-700 flex items-center gap-1">
                <MapPin size={10} className="text-blue-300" />
                  <span>{selectedRegionInfo.name}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Индикатор загрузки */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          )}
          
          {/* Индикатор ошибки */}
          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 max-w-md text-center">
                <AlertTriangle size={24} className="text-red-400 mx-auto mb-2" />
                <p className="text-white mb-1">Произошла ошибка при загрузке данных</p>
                <p className="text-gray-400 text-sm">Попробуйте обновить данные позже</p>
              </div>
            </div>
          )}
          
          {/* Сообщение при отсутствии данных */}
          {!isLoading && !hasError && salesData.length > 0 && salesData.every(val => val === 0) && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/30">
              <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4 max-w-md text-center">
                <Activity size={24} className="text-gray-400 mx-auto mb-2" />
                <p className="text-white mb-1">Нет данных для отображения</p>
                <p className="text-gray-400 text-sm">Попробуйте изменить фильтры или период</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Легенда и статистика */}
        <div className="bg-gray-900 rounded-lg p-3 border border-gray-700 flex flex-wrap justify-between items-center">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-8 rounded-sm bg-gradient-to-t from-purple-700 via-purple-600 to-purple-500"></div>
              <span className="text-sm text-white">Текущий период</span>
            </div>
            
            {showComparison && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-8 rounded-sm bg-blue-500 opacity-70"></div>
                <span className="text-sm text-white">Прошлый год</span>
              </div>
            )}
          </div>
          
          <div className="px-3 py-1.5 bg-gray-800/70 rounded-md border border-gray-700 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">
                {activeTab === 'месяц' ? 'Всего контрактов:' : 'Общая сумма:'}
              </span>
              <span className="text-lg font-bold text-white">{totalSales.toLocaleString()}</span>
              
              {showComparison && (
                <span className={`ml-1 text-sm font-medium ${
                  parseFloat(growthPercent) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {parseFloat(growthPercent) >= 0 ? '+' : ''}{growthPercent}%
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Переключатель между контрактами и суммами */}
        <div className="mt-3 flex justify-between items-center">
          <div className="inline-flex rounded-md overflow-hidden border border-gray-700">
            <button
              className={`px-3 py-1.5 text-sm font-medium ${
                activeTab === 'месяц' 
                  ? 'bg-purple-700 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => handleTabChange('месяц')}
            >
              Контракты
            </button>
            <button
              className={`px-3 py-1.5 text-sm font-medium ${
                activeTab === 'год' 
                  ? 'bg-purple-700 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => handleTabChange('год')}
            >
              Суммы
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-md flex items-center gap-1.5 border border-gray-700"
              onClick={() => setShowPeriodModal(true)}
            >
              <Calendar size={14} />
              <span>Выбрать даты</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Модальное окно выбора периода */}
      {showPeriodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowPeriodModal(false)}>
          <div 
            className="bg-gray-800 w-80 rounded-lg shadow-xl border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-3 border-b border-gray-700">
              <h3 className="text-white font-medium flex items-center gap-2">
                <Calendar size={16} className="text-purple-400" />
                Выбор периода
              </h3>
              <button 
                className="text-gray-400 hover:text-white rounded-full p-1 hover:bg-gray-700"
                onClick={() => setShowPeriodModal(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Начальная дата</label>
                  <input 
                    type="date" 
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Конечная дата</label>
                  <input 
                    type="date" 
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <button 
                  className="flex-1 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 text-sm"
                  onClick={() => setShowPeriodModal(false)}
                >
                  Отмена
                </button>
                <button 
                  className="flex-1 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-500 text-sm font-medium"
                  onClick={applyDateFilter}
                >
                  Применить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};






const SalesDashboard = () => {
  const [activeTab, setActiveTab] = useState('месяц');
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
    const fetchAllData = async () => {
      setLoading(true);
      try {
        // Получаем данные об автомобилях в пути
        const inMovementResponse = await fetch('https://uzavtosalon.uz/b/dashboard/infos&auto_movment');
        const inMovementData = await inMovementResponse.json();
        setInMovementData(inMovementData);
        
        // Получаем данные о замороженных контрактах
        const frozenResponse = await fetch('https://uzavtosalon.uz/b/dashboard/infos&auto_frozen');
        const frozenData = await frozenResponse.json();
        setFrozenData(frozenData);
        
        // Получаем данные о не отгруженных автомобилях
        const notShippedResponse = await fetch('https://uzavtosalon.uz/b/dashboard/infos&auto_shipped');
        const notShippedData = await notShippedResponse.json();
        setNotShippedData(notShippedData);
        
        // Получаем данные о доставленных автомобилях
        const deliveredResponse = await fetch('https://uzavtosalon.uz/b/dashboard/infos&auto_delivered');
        const deliveredData = await deliveredResponse.json();
        setDeliveredData(deliveredData);
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
        
        {/* Сетка отчетов */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          {/* Обновленный график продаж с использованием компонента SalesChart */}
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-700/50 shadow-lg overflow-hidden">
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
          </div>
          
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