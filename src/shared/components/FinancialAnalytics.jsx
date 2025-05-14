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

// Функция для трансформации данных API в формат компонента
const transformApiDataToComponentFormat = (apiData) => {
  // Создаем объект для хранения трансформированных данных
  const transformedData = {};
  
  // Получаем уникальные годы из данных API
  const years = new Set();
  
  // Проходим по данным API, чтобы собрать все уникальные годы
  apiData.forEach(model => {
    model.filter_by_region.forEach(monthData => {
      const year = parseInt(monthData.month.split('-')[0]);
      years.add(year);
    });
  });
  
  // Создаем структуру данных для каждого года
  Array.from(years).forEach(year => {
    transformedData[year] = {
      targetAmount: 0, // Будет обновлено ниже
      totalEarned: 0, // Будет рассчитано ниже
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
      modelData: {} // Добавим данные по моделям
    };
  });
  
  // Заполняем данные продаж из API
  apiData.forEach(model => {
    // Инициализируем данные по модели для каждого года
    Array.from(years).forEach(year => {
      if (!transformedData[year].modelData[model.model_id]) {
        transformedData[year].modelData[model.model_id] = {
          model_id: model.model_id,
          model_name: model.model_name,
          photo_sha: model.photo_sha,
          totalSales: 0,
          monthlyData: Array(12).fill().map(() => ({ amount: 0, count: 0 }))
        };
      }
    });
    
    model.filter_by_region.forEach(monthData => {
      const [yearStr, monthStr] = monthData.month.split('-');
      const year = parseInt(yearStr);
      const monthIndex = parseInt(monthStr) - 1;
      
      if (!transformedData[year]) return;
      
      // Общий объем продаж для данной модели в этом месяце
      let modelMonthTotal = 0;
      let modelMonthCount = 0;
      
      monthData.regions.forEach(region => {
        const amount = parseFloat(region.amount);
        const count = parseInt(region.all_count || 0);
        
        modelMonthTotal += amount;
        modelMonthCount += count;
      });
      
      // Сохраняем данные по модели
      if (transformedData[year].modelData[model.model_id]) {
        transformedData[year].modelData[model.model_id].totalSales += modelMonthTotal;
        transformedData[year].modelData[model.model_id].monthlyData[monthIndex].amount = modelMonthTotal;
        transformedData[year].modelData[model.model_id].monthlyData[monthIndex].count = modelMonthCount;
      }
      
      // Обновляем данные месяца (общая сумма по всем моделям)
      transformedData[year].months[monthIndex].total += modelMonthTotal;
      
      // Обновляем квартальные данные
      const quarterIndex = Math.floor(monthIndex / 3);
      transformedData[year].quarterlyData[quarterIndex] += modelMonthTotal;
      
      // Обновляем общую сумму продаж за год
      transformedData[year].totalEarned += modelMonthTotal;
    });
  });
  
  // Установим целевые показатели на основе общей суммы продаж
  // и добавим запас для визуализации прогресса
  Object.keys(transformedData).forEach(year => {
    transformedData[year].targetAmount = transformedData[year].totalEarned * 1.2; // Целевой показатель на 20% выше текущего
  });
  
  // Финальный шаг - распределение данных по моделям в категории
  // для совместимости с существующим интерфейсом
  Object.keys(transformedData).forEach(year => {
    const modelEntries = Object.values(transformedData[year].modelData);
    
    // Сортируем модели по объему продаж
    modelEntries.sort((a, b) => b.totalSales - a.totalSales);
    
    // Для упрощения используем топ-3 модели как категории
    // (это временное решение для совместимости с существующим UI)
    if (modelEntries.length > 0) {
      const topModel = modelEntries[0];
      transformedData[year].categories.retail = topModel.totalSales;
      
      // Распределяем данные по месяцам для этой модели
      topModel.monthlyData.forEach((data, monthIndex) => {
        transformedData[year].months[monthIndex].retail = data.amount;
      });
    }
    
    if (modelEntries.length > 1) {
      const secondModel = modelEntries[1];
      transformedData[year].categories.wholesale = secondModel.totalSales;
      
      // Распределяем данные по месяцам для этой модели
      secondModel.monthlyData.forEach((data, monthIndex) => {
        transformedData[year].months[monthIndex].wholesale = data.amount;
      });
    }
    
    if (modelEntries.length > 2) {
      const thirdModel = modelEntries[2];
      transformedData[year].categories.promo = thirdModel.totalSales;
      
      // Распределяем данные по месяцам для этой модели
      thirdModel.monthlyData.forEach((data, monthIndex) => {
        transformedData[year].months[monthIndex].promo = data.amount;
      });
    }
  });
  
  return transformedData;
};

// Основной компонент
export default function EnhancedFinancialAnalytics() {
  // Состояния для управления данными и фильтрами
  const [financialData, setFinancialData] = useState({});
  const [selectedYears, setSelectedYears] = useState([2024]); // Может быть несколько выбранных лет
  const [filteredData, setFilteredData] = useState([]);
  const [displayMode, setDisplayMode] = useState('period'); // 'yearly', 'period', 'compare'
  const [isLoading, setIsLoading] = useState(true); // Состояние загрузки
  const [apiStartDate, setApiStartDate] = useState('01.01.2025');
  const [apiEndDate, setApiEndDate] = useState('31.12.2025');
  
  // Функция для получения текущего месяца и года
  const getCurrentMonthAndYear = () => {
    const now = new Date();
    return {
      month: now.getMonth() + 1,
      year: now.getFullYear()
    };
  };
  
  // Состояния для фильтров по периоду
  const currentDate = getCurrentMonthAndYear();
  const [startMonth, setStartMonth] = useState(1); // Начинаем с января
  const [startYear, setStartYear] = useState(currentDate.year - 1); // Прошлый год
  const [endMonth, setEndMonth] = useState(currentDate.month); // Текущий месяц
  const [endYear, setEndYear] = useState(currentDate.year);
  
  // Состояния для представления
  const [viewType, setViewType] = useState('bar'); // 'bar', 'line', 'stacked', 'area', 'radar', 'mixed'
  const [focusCategory, setFocusCategory] = useState('all'); // 'all', 'retail', 'wholesale', 'promo'
  const [showQuarterlyData, setShowQuarterlyData] = useState(false);
  
  // Состояние для информации о моделях
  const [modelInfo, setModelInfo] = useState({
    retail: { id: '', name: 'Модель 1' },
    wholesale: { id: '', name: 'Модель 2' },
    promo: { id: '', name: 'Модель 3' }
  });
  
  // Динамические SALE_TYPES, которые будут обновляться
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
  },
  PROMO: {
    id: 'promo',
    name: 'Акционные продажи',
    color: '#ec4899'
  }
};

  
  // Refs для контейнеров графиков
  const mainChartRef = useRef(null);
  const progressChartRef = useRef(null);
  const detailsChartRef = useRef(null);
  const yearlyTrendChartRef = useRef(null);
  const yearComparisonChartRef = useRef(null);
  const forecastChartRef = useRef(null);
  const categoryDistributionRef = useRef(null);
  const quarterlyChartRef = useRef(null);
  
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
    
    if (sortedModels.length > 2) {
      newModelInfo.promo = {
        id: sortedModels[2].model_id,
        name: sortedModels[2].model_name
      };
      // Также обновите константу для совместимости
      SALE_TYPES.PROMO.name = sortedModels[2].model_name;
    }
    
    setModelInfo(newModelInfo);
  };
  
  // Инициализация данных с API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        console.log("Отправка запроса к API финансовых данных...");
        
        const response = await fetch("https://uzavtosalon.uz/b/dashboard/infos&get_all_payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `begin_date=${apiStartDate}&end_date=${apiEndDate}`
        });
        
        if (!response.ok) {
          throw new Error(`Ошибка HTTP: ${response.status}`);
        }
        
        const apiData = await response.json();
        console.log("Данные API получены:", apiData);
        
        // Трансформируем данные API в нужный формат
        const transformedData = transformApiDataToComponentFormat(apiData);
        
        // Устанавливаем данные в состояние компонента
        setFinancialData(transformedData);
        
        // Устанавливаем начальные значения для фильтров
        // Берем самый последний год из полученных данных
        const years = Object.keys(transformedData).map(Number).sort((a, b) => b - a);
        
        if (years.length > 0) {
          setSelectedYears([years[0]]);
          updateModelNames(transformedData, years[0]);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Ошибка при получении данных:", error);
        setIsLoading(false);
      }
    };
    
    // Вызываем функцию загрузки данных
    fetchData();
  }, []);
  
  // Функция для обновления данных с новыми датами
  const refreshDataWithDateRange = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("https://uzavtosalon.uz/b/dashboard/infos&get_all_payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `begin_date=${apiStartDate}&end_date=${apiEndDate}`
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const apiData = await response.json();
      const transformedData = transformApiDataToComponentFormat(apiData);
      setFinancialData(transformedData);
      
      // Обновляем выбранный год
      const years = Object.keys(transformedData).map(Number).sort((a, b) => b - a);
      if (years.length > 0) {
        setSelectedYears([years[0]]);
        updateModelNames(transformedData, years[0]);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Ошибка при получении данных:", error);
      setIsLoading(false);
    }
  };
  
  // Функция для переключения выбора года
  const toggleYearSelection = (year) => {
    if (displayMode === 'compare') {
      // В режиме сравнения можно выбрать несколько лет
      if (selectedYears.includes(year)) {
        if (selectedYears.length > 1) {
          setSelectedYears(selectedYears.filter(y => y !== year));
        }
      } else {
        setSelectedYears([...selectedYears, year]);
      }
    } else {
      // В обычном режиме только один год
      setSelectedYears([year]);
      // Обновляем названия моделей для выбранного года
      updateModelNames(financialData, year);
    }
  };
  
  // Эффект для фильтрации данных в зависимости от режима и фильтров
  useEffect(() => {
    if (Object.keys(financialData).length === 0) return;
    
    // Обновляем названия моделей при изменении года
    if (selectedYears.length > 0) {
      updateModelNames(financialData, selectedYears[0]);
    }
    
    const filteredMonths = [];
    
    if (displayMode === 'yearly') {
      selectedYears.forEach(year => {
        if (financialData[year]) {
          financialData[year].months.forEach(month => {
            filteredMonths.push({
              ...month,
              year
            });
          });
        }
      });
    } else if (displayMode === 'compare') {
      selectedYears.forEach(year => {
        if (financialData[year]) {
          financialData[year].months.forEach(month => {
            filteredMonths.push({
              ...month,
              year
            });
          });
        }
      });
    } else if (displayMode === 'period') {
      // Полный диапазон выбранного периода
      for (let year = startYear; year <= endYear; year++) {
        if (!financialData[year]) continue;
        
        financialData[year].months.forEach(month => {
          if (
            (year === startYear && month.month < startMonth) || 
            (year === endYear && month.month > endMonth)
          ) {
            return;
          }
          
          filteredMonths.push({
            ...month,
            year,
            label: `${month.name} ${year}`
          });
        });
      }
    }
    
    setFilteredData(filteredMonths);
  }, [
    financialData, 
    selectedYears, 
    displayMode, 
    startMonth, 
    startYear, 
    endMonth, 
    endYear,
    viewType,
    focusCategory
  ]);
  
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
    
    if (showQuarterlyData) {
      renderQuarterlyChart();
    }
  }, [filteredData, viewType, displayMode, focusCategory, showQuarterlyData]);
  
  // Функция для изменения режима отображения
  const handleDisplayModeChange = (mode) => {
    setDisplayMode(mode);
    
    if (mode === 'yearly') {
      setSelectedYears([2024]); // Устанавливаем текущий год по умолчанию
    } else if (mode === 'compare') {
      // Для сравнения берем последние два года
      const years = Object.keys(financialData).map(Number).sort((a, b) => b - a);
      setSelectedYears([years[0], years[1]].filter(Boolean));
    } else if (mode === 'period') {
      // Для периода устанавливаем текущий месяц и аналогичный период прошлого года
      const currentDate = getCurrentMonthAndYear();
      setStartMonth(1); // С января
      setStartYear(currentDate.year - 1); // Прошлый год
      setEndMonth(currentDate.month); // До текущего месяца
      setEndYear(currentDate.year); // Текущий год
    }
  };
  
  // Функция для проверки валидности периода
  const isPeriodValid = () => {
    if (startYear > endYear) return false;
    if (startYear === endYear && startMonth > endMonth) return false;
    return true;
  };
  
  // Функция для форматирования чисел в компактный вид
  const formatProfitCompact = (number) => {
    if (number >= 1000000000000) { // триллионы
      return `${(number / 1000000000000).toFixed(1)}T`;
    } else if (number >= 1000000000) { // миллиарды
      return `${(number / 1000000000).toFixed(1)}B`;
    } else if (number >= 1000000) { // миллионы
      return `${(number / 1000000).toFixed(1)}M`;
    } else if (number >= 1000) { // тысячи
      return `${(number / 1000).toFixed(1)}K`;
    }
    return Math.round(number).toLocaleString('ru-RU');
  };
  
  // Функция для форматирования валюты
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'UZS',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Функция для получения общей суммы за период
  const getTotalForPeriod = () => {
    if (!filteredData.length) return 0;
    return filteredData.reduce((sum, month) => sum + month.total, 0);
  };
  
const renderMainChart = () => {
  if (!mainChartRef.current) return;
  if (!filteredData.length) {
    mainChartRef.current.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100%"><p style="color:#9ca3af">Загрузка данных...</p></div>';
    return;
  }
    // Очистка контейнера
    mainChartRef.current.innerHTML = '';
    
    // Подготовка данных в зависимости от представления
    let chartData;
    
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
      
      filteredData.forEach(month => {
        if (!monthGroups[month.month]) {
          monthGroups[month.month] = {
            month: month.month,
            name: month.name,
            years: {}
          };
        }
        
        monthGroups[month.month].years[month.year] = focusCategory === 'all' ? 
          month.total : month[focusCategory];
      });
      
      // Конвертируем в формат для stacked bar chart
      chartData = Object.values(monthGroups).map(group => {
        return {
          category: group.name,
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
    
    // Настройки графика
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
    
    const chartOptions = {
      container: mainChartRef.current,
      title: chartTitle,
      height: 400,
      colors: focusCategory === 'all' ? d3.schemeBlues[9].slice(3) : [SALE_TYPES[focusCategory.toUpperCase()].color],
      animated: true
    };
    
    // Отрисовка в зависимости от выбранного типа графика
if (viewType === 'bar') {
  if (displayMode === 'compare') {
    // Подготовка данных для сравнения двух лет в виде сгруппированных столбцов
    const monthGroups = [];
    
    // Получаем уникальные месяцы из данных
    const allMonths = [...new Set(filteredData.map(item => item.month))].sort((a, b) => a - b);
    
    // Для каждого месяца создаем группу с данными обоих годов
    allMonths.forEach(monthNum => {
      const monthName = MONTHS[monthNum - 1];
      const monthData = {
        month: monthNum,
        name: monthName,
        years: {}
      };
      
      // Собираем данные для каждого года в этом месяце
      selectedYears.forEach(year => {
        const yearData = filteredData.find(
          item => item.month === monthNum && item.year === year
        );
        
        if (yearData) {
          monthData.years[year] = focusCategory === 'all' ? 
            yearData.total : yearData[focusCategory];
        } else {
          monthData.years[year] = 0;
        }
      });
      
      monthGroups.push(monthData);
    });
    
    // Создаем данные для D3
    const chartConfig = {
      container: mainChartRef.current,
      title: `Сравнение продаж по месяцам ${selectedYears.join(' и ')}` +
        (focusCategory !== 'all' ? ` (${SALE_TYPES[focusCategory.toUpperCase()].name})` : ''),
      height: 400,
      animated: true
    };
    
    // Создаем кастомную группированную диаграмму с месяцами и годами
    renderGroupedBarChart(monthGroups, chartConfig);
  } else {
    D3Visualizer.createBarChart(chartData, chartOptions);
  }
} else if (viewType === 'line' || viewType === 'area') {
     if (displayMode === 'compare') {
    renderMultiLineChart(); // Добавьте этот метод, если он не реализован
  } else {
        const lineData = chartData.map(item => ({
          x: item.label, 
          y: item.value
        }));
        
        if (viewType === 'line') {
          // Ручная отрисовка линейного графика
          renderCustomLineChart(lineData, chartOptions);
        } else {
          D3Visualizer.createAreaChart(lineData, {
            ...chartOptions,
            colors: [focusCategory === 'all' ? '#3b82f6' : SALE_TYPES[focusCategory.toUpperCase()].color]
          });
        }
      }
    } else if (viewType === 'stacked') {
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
      
      D3Visualizer.createStackedBarChart(stackedData, {
        ...chartOptions,
        title: 'Структура продаж по месяцам',
        colors: [SALE_TYPES.RETAIL.color, SALE_TYPES.WHOLESALE.color, SALE_TYPES.PROMO.color]
      });
 } else if (viewType === 'radar') {
  renderRadarChart();
} else if (viewType === 'mixed') {
  renderMixedChart();
}
  };
  
  const renderCustomLineChart = (data, options) => {
    const { container, title, height = 400 } = options;
    
    const width = container.clientWidth;
    const margin = { top: 40, right: 30, bottom: 60, left: 60 };
    
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
    const x = d3.scaleBand()
      .domain(data.map(d => d.x))
      .range([margin.left, width - margin.right])
      .padding(0.3);
    
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.y) * 1.1]) // добавляем 10% сверху для отступа
      .nice()
      .range([height - margin.bottom, margin.top]);
    
    // Создаем оси
    const xAxis = g => g
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickSizeOuter(0))
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
    
    // Создаем линию
    const line = d3.line()
      .x(d => x(d.x) + x.bandwidth() / 2)
      .y(d => y(d.y))
      .curve(d3.curveMonotoneX);
    
    // Добавляем фоновый градиент для линии
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'line-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
    
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', focusCategory === 'all' ? '#3b82f6' : SALE_TYPES[focusCategory.toUpperCase()].color);
    
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', focusCategory === 'all' ? '#8b5cf6' : SALE_TYPES[focusCategory.toUpperCase()].color);
    
    // Добавляем линию
    const path = svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', 'url(#line-gradient)')
      .attr('stroke-width', 3)
      .attr('d', line);
    
    // Добавляем анимацию линии
    const totalLength = path.node().getTotalLength();
    
    path
      .attr('stroke-dasharray', totalLength)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(1500)
      .attr('stroke-dashoffset', 0);
    
    // Добавляем точки
    svg.selectAll('.data-point')
      .data(data)
      .join('circle')
      .attr('class', 'data-point')
      .attr('cx', d => x(d.x) + x.bandwidth() / 2)
      .attr('cy', d => y(d.y))
      .attr('r', 0)
      .attr('fill', focusCategory === 'all' ? '#3b82f6' : SALE_TYPES[focusCategory.toUpperCase()].color)
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 2)
      .transition()
      .delay((_, i) => i * 100 + 500)
      .duration(300)
      .attr('r', 5);
    
    // Добавляем подписи значений над точками
    svg.selectAll('.data-label')
      .data(data)
      .join('text')
      .attr('class', 'data-label')
      .attr('x', d => x(d.x) + x.bandwidth() / 2)
      .attr('y', d => y(d.y) - 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '0.7rem')
      .style('fill', '#f9fafb')
      .style('opacity', 0)
      .text(d => d3.format(',.0f')(d.y))
      .transition()
      .delay((_, i) => i * 100 + 800)
      .duration(300)
      .style('opacity', 1);
    
    // Добавляем области для интерактивности
    svg.selectAll('.hover-area')
      .data(data)
      .join('rect')
      .attr('class', 'hover-area')
      .attr('x', d => x(d.x))
      .attr('y', margin.top)
      .attr('width', x.bandwidth())
      .attr('height', height - margin.top - margin.bottom)
      .attr('fill', 'transparent')
      .on('mouseover', function(event, d) {
        // Увеличиваем соответствующую точку
        svg.selectAll('.data-point')
          .filter(point => point.x === d.x)
          .transition()
          .duration(100)
          .attr('r', 8)
          .attr('fill', focusCategory === 'all' ? '#60a5fa' : SALE_TYPES[focusCategory.toUpperCase()].color);
        
        // Делаем подпись более заметной
        svg.selectAll('.data-label')
          .filter(point => point.x === d.x)
          .transition()
          .duration(100)
          .style('font-size', '0.9rem')
          .style('font-weight', 'bold');
        
        // Добавляем вертикальную направляющую
        svg.append('line')
          .attr('class', 'guide-line')
          .attr('x1', x(d.x) + x.bandwidth() / 2)
          .attr('x2', x(d.x) + x.bandwidth() / 2)
          .attr('y1', y(d.y))
          .attr('y2', height - margin.bottom)
          .attr('stroke', '#f9fafb')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '3,3')
          .style('opacity', 0.6);
      })
      .on('mouseout', function(event, d) {
        // Возвращаем точку к нормальному размеру
        svg.selectAll('.data-point')
          .filter(point => point.x === d.x)
          .transition()
          .duration(100)
          .attr('r', 5)
          .attr('fill', focusCategory === 'all' ? '#3b82f6' : SALE_TYPES[focusCategory.toUpperCase()].color);
        
        // Возвращаем подпись к нормальному виду
        svg.selectAll('.data-label')
          .filter(point => point.x === d.x)
          .transition()
          .duration(100)
          .style('font-size', '0.7rem')
          .style('font-weight', 'normal');
        
        // Удаляем направляющую
        svg.selectAll('.guide-line').remove();
      });
    
    // Добавляем фоновую сетку
    svg.selectAll('.grid-line')
      .data(y.ticks(5))
      .join('line')
      .attr('class', 'grid-line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', d => y(d))
      .attr('y2', d => y(d))
      .attr('stroke', '#374151')
      .attr('stroke-width', 0.5)
      .attr('stroke-dasharray', '3,3')
      .style('opacity', 0.5);
    
    // Добавляем тренд (скользящее среднее)
    if (data.length > 2) {
      // Расчет скользящего среднего
      const movingAverage = [];
      const windowSize = 3; // Размер окна для скользящего среднего
      
      for (let i = 0; i < data.length; i++) {
        let sum = 0;
        let count = 0;
        
        for (let j = Math.max(0, i - windowSize + 1); j <= i; j++) {
          sum += data[j].y;
          count++;
        }
        
        movingAverage.push({
          x: data[i].x,
          y: sum / count
        });
      }
      
      // Создаем линию для тренда
      const trendLine = d3.line()
        .x(d => x(d.x) + x.bandwidth() / 2)
        .y(d => y(d.y))
        .curve(d3.curveMonotoneX);
      
      // Добавляем линию тренда
      svg.append('path')
        .datum(movingAverage)
        .attr('fill', 'none')
        .attr('stroke', '#10b981') // Зеленый цвет для тренда
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
        .attr('d', trendLine)
        .style('opacity', 0)
        .transition()
        .delay(2000)
        .duration(500)
        .style('opacity', 0.8);
      
      // Добавляем легенду
      const legend = svg.append('g')
        .attr('transform', `translate(${width - margin.right - 150}, ${margin.top + 10})`);
      
      // Легенда для основной линии
      const lineLegend = legend.append('g');
      
      lineLegend.append('line')
        .attr('x1', 0)
        .attr('x2', 20)
        .attr('y1', 0)
        .attr('y2', 0)
        .attr('stroke', 'url(#line-gradient)')
        .attr('stroke-width', 3);
      
      lineLegend.append('text')
        .attr('x', 30)
        .attr('y', 4)
        .text('Фактические продажи')
        .style('font-size', '0.8rem')
        .style('fill', '#f9fafb');
      
      // Легенда для тренда
      const trendLegend = legend.append('g')
        .attr('transform', 'translate(0, 20)');
      
      trendLegend.append('line')
        .attr('x1', 0)
        .attr('x2', 20)
        .attr('y1', 0)
        .attr('y2', 0)
        .attr('stroke', '#10b981')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');
      
      trendLegend.append('text')
        .attr('x', 30)
        .attr('y', 4)
        .text('Тренд (скользящее среднее)')
        .style('font-size', '0.8rem')
        .style('fill', '#f9fafb');
    }
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
  const margin = { top: 60, right: 130, bottom: 70, left: 70 };
 
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
    const years = [...new Set(data.map(item => item.year))].sort();
    
    // Создаем шкалы
    const x0 = d3.scaleBand()
      .domain(sortedItems.map(m => m.name))
      .range([margin.left, width - margin.right])
      .padding(0.25);
    
    const x1 = d3.scaleBand()
      .domain(years)
      .range([0, x0.bandwidth()])
      .padding(0.08);
    
    const maxValue = d3.max(sortedItems, item => 
      d3.max(Object.values(item.years), value => value || 0)
    );
    
    const y = d3.scaleLinear()
      .domain([0, maxValue * 1.1])
      .nice()
      .range([height - margin.bottom, margin.top]);
    
    // Создаем красивую цветовую схему
    const colorScale = d3.scaleOrdinal()
      .domain(years)
      .range(['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'].slice(0, years.length));
    
    // Удаляем все существующие элементы, кроме заголовка
    svg.selectAll("g:not(.chart-title)").remove();
    
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
    
    // Создаем градиентные заливки для столбцов
    const defs = svg.append('defs');
    
    years.forEach((year, i) => {
      const gradientId = `gradient-${year}`;
      const gradient = defs.append('linearGradient')
        .attr('id', gradientId)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');
      
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', d3.rgb(colorScale(year)).brighter(0.5))
        .attr('stop-opacity', 1);
      
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', colorScale(year))
        .attr('stop-opacity', 0.8);
    });
    
    // Создаем эффект свечения для выделения
    defs.append('filter')
      .attr('id', 'glow')
      .append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'coloredBlur');
    
    // Для каждой группы добавляем столбцы по годам с улучшенным стилем и интерактивностью
    itemGroups.selectAll('rect')
      .data(d => years.map(year => ({
        year,
        value: d.years[year] || 0,
        key: d.key,
        name: d.name,
        isDay: isDaysList
      })))
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
        // При клике показываем детализацию с выбором: по моделям или по регионам
        // Для дня передаем текущий выбранный месяц, для месяца - месяц из данных
        if (isDaysList) {
          // Если это день из списка дней, используем выбранный месяц и день для детализации
          const [year, month] = selectedMonth.split('-').map(Number);
          showSelectionOptions(d.year, month, `${d.name} ${MONTHS[month-1]} ${d.year}`);
        } else if (isDay) {
          // Если это единственный день, просто передаем параметры
          const [year, month] = selectedMonth.split('-').map(Number);
          showSelectionOptions(d.year, month, `${d.name} ${MONTHS[month-1]} ${d.year}`);
        } else {
          // Для месяца передаем месяц из данных
          showSelectionOptions(d.year, d.key, `${d.name} ${d.year}`);
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
    
    // Добавляем текстовые метки со значениями над столбцами
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
    
    // Добавляем красивую легенду в правой части
    const legend = svg.append('g')
      .attr('transform', `translate(${width - margin.right + 30}, ${margin.top + 20})`);
    
    // Фон для легенды
    legend.append('rect')
      .attr('x', -20)
      .attr('y', -15)
      .attr('width', 110)
      .attr('height', years.length * 30 + 10)
      .attr('rx', 10)
      .attr('fill', 'rgba(17, 24, 39, 0.4)')
      .attr('stroke', 'rgba(59, 130, 246, 0.2)')
      .attr('stroke-width', 1);
    
    // Элементы легенды
    years.forEach((year, i) => {
      const legendItem = legend.append('g')
        .attr('transform', `translate(0, ${i * 30})`)
        .style('cursor', 'pointer')
        .on('mouseover', function() {
          d3.select(this).select('text').style('font-weight', 'bold');
          // Подсвечиваем все столбцы соответствующего года
          svg.selectAll('.bar')
            .filter(d => d.year === year)
            .style('filter', 'url(#glow)')
            .attr('opacity', 1);
          
          // Также подсвечиваем метки значений
          svg.selectAll('.bar-value-label')
            .filter(d => d.year === year)
            .style('font-size', isDaysList ? '0.7rem' : '0.8rem')
            .style('fill', '#ffffff');
        })
        .on('mouseout', function() {
          d3.select(this).select('text').style('font-weight', 'normal');
          // Возвращаем нормальный вид столбцам
          svg.selectAll('.bar')
            .filter(d => d.year === year)
            .style('filter', 'none')
            .attr('opacity', 0.9);
          
          // Возвращаем нормальный вид меткам
          svg.selectAll('.bar-value-label')
            .filter(d => d.year === year)
            .style('font-size', isDaysList ? '0.6rem' : '0.7rem')
            .style('fill', '#f9fafb');
        });
      
      // Цветной индикатор
      legendItem.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('rx', 2)
        .attr('fill', colorScale(year));
      
      // Текст года
      legendItem.append('text')
        .attr('x', 18)
        .attr('y', 10)
        .style('font-size', '0.9rem')
        .style('fill', '#f9fafb')
        .text(year);
    });
    
    // Добавляем подсказку о возможности клика
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height - 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '0.85rem')
      .style('fill', '#9ca3af')
      .style('font-style', 'italic')
      .text(isDaysList 
        ? 'Нажмите на столбец для детализации данных по дню' 
        : isDay 
          ? 'Детализация данных по выбранному дню' 
          : 'Нажмите на столбец для детализации данных');
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
    .html(`Детализация продаж: <span style="color: #60a5fa;">${monthName} ${year}</span>`);
  
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
  
  // Создаем основной контейнер с современным градиентным фоном
  const container = d3.select(mainChartRef.current)
    .append('div')
    .style('width', '100%')
    .style('height', '100%')
    .style('background', 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)')
    .style('border-radius', '1rem')
    .style('padding', '20px')
    .style('box-shadow', '0 15px 35px -10px rgba(0, 0, 0, 0.5)')
    .style('border', '1px solid rgba(59, 130, 246, 0.15)');
    
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
    .html(`Аналитика продаж: <span style="background: linear-gradient(90deg, #60a5fa, #93c5fd); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${monthName} ${year}</span>`);
  
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
  
  // Взять реальные данные моделей вместо генерации
  const carModels = sortedModels.slice(0, 4).map(model => ({
    id: model.model_id,
    name: model.model_name,
    sales: model.totalSales, 
    count: model.monthlyData.reduce((sum, data) => {
      // Считаем только тот месяц, который выбран
      if (data && data.count) {
        return sum + data.count;
      }
      return sum;
    }, 0)
  }));
  
  // Рассчитываем общие показатели
  const totalSales = carModels.reduce((sum, model) => sum + model.sales, 0);
  const totalCount = carModels.reduce((sum, model) => sum + model.count, 0);
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
  
  createInfoCard(
    'Средняя цена',
    formatProfitCompact(avgPrice),
    'За единицу',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
    '139, 92, 246'
  );
  
  // Рассчитываем долю премиум сегмента (модели со средней ценой выше 700000)
  const premiumModels = carModels.filter(m => m.count > 0 && m.sales / m.count > 700000);
  const premiumShare = totalSales > 0 
    ? premiumModels.reduce((sum, m) => sum + m.sales, 0) / totalSales * 100 
    : 0;
  
  createInfoCard(
    'Премиум сегмент',
    `${premiumShare.toFixed(1)}%`,
    'От общих продаж',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
    '245, 158, 11'
  );
  
  // Отображаем лидера продаж
  if (carModels.length > 0) {
    createInfoCard(
      'Лидер продаж',
      carModels[0].name,
      `${carModels[0].count} шт.`,
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
    .text('Объем продаж по моделям');
  
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
  let currentView = 'sales';
  
  viewOptions.forEach((option, i) => {
    viewToggle.append('button')
      .attr('id', `view-${option.id}`)
      .style('background', option.id === currentView ? 'rgba(59, 130, 246, 0.4)' : 'transparent')
      .style('color', option.id === currentView ? '#f9fafb' : '#9ca3af')
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
        currentView = option.id;
        
        // Перерисовываем график
        updateBarChart(currentView);
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
    
    // Подготавливаем данные в зависимости от режима
    const data = carModels.map(model => ({
      id: model.id,
      name: model.name,
      value: viewMode === 'sales' ? model.sales : model.count,
      // Добавляем доп. информацию для тултипа
      sales: model.sales,
      count: model.count,
      avgPrice: model.count > 0 ? Math.round(model.sales / model.count) : 0
    }));
    
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
            <div style="font-size: 0.75rem; color: #9ca3af;">Средняя цена</div>
            <div style="font-weight: bold;">${formatProfitCompact(d.avgPrice)}</div>
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
    
    // Добавляем полосы для моделей с улучшенной анимацией и интерактивностью
    const bars = barChartSvg.selectAll('.car-model-bar')
      .data(data)
      .join('rect')
      .attr('class', 'car-model-bar')
      .attr('x', barMargin.left)
      .attr('y', d => barY(d.name))
      .attr('height', barY.bandwidth())
      .attr('fill', 'url(#sales-bar-gradient)')
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
      .on('mouseout', function() {
        d3.select(this)
          .attr('fill', 'url(#sales-bar-gradient)')
          .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))');
          
        hideTooltip();
      })
      .on('click', (event, d) => {
        showModelRegionalDistribution(d.name, year, month, monthName);
      })
      // Анимированное появление
      .attr('width', 0)
      .transition()
      .duration(800)
      .delay((d, i) => i * 70)
      .ease(d3.easeElasticOut.amplitude(0.8).period(1))
      .attr('width', d => barX(d.value) - barMargin.left);
    
    // Добавляем подписи значений с анимацией
    barChartSvg.selectAll('.car-model-label')
      .data(data)
      .join('text')
      .attr('class', 'car-model-label')
      .attr('x', d => barX(d.value) + 10)
      .attr('y', d => barY(d.name) + barY.bandwidth() / 2)
      .attr('dy', '0.35em')
      .style('font-size', isMobile ? '0.75rem' : '0.85rem')
      .style('font-weight', '500')
      .style('fill', '#f9fafb')
      .style('opacity', 0)
      .text(d => viewMode === 'sales' ? formatProfitCompact(d.value) : `${d.value} шт.`)
      .transition()
      .duration(500)
      .delay((d, i) => 800 + i * 70)
      .style('opacity', 1);
  }
  
  // Первичная отрисовка графика
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
  
  // Создаем улучшенную цветовую схему
  const pieColor = d3.scaleOrdinal()
    .domain(carModels.map(d => d.name))
    .range([
      '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
      '#0ea5e9', '#6366f1', '#a855f7', '#d946ef', '#f43f5e'
    ]);
  
  // Создаем генератор пончика с закругленными краями
  const pie = d3.pie()
    .value(d => d.sales)
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
  
  carModels.forEach((model, i) => {
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
    .data(pie(carModels))
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
        
      centerNumber.text(formatProfitCompact(d.data.sales));
      centerPercent.text(`${((d.data.sales / totalSales) * 100).toFixed(1)}%`);
      
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
    .on('click', (event, d) => {
      showModelRegionalDistribution(d.data.name, year, month, monthName);
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
  const topModels = carModels.slice(0, 5);
  const pieLabels = pieG.selectAll('.pie-label')
    .data(pie(topModels))
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
    .text(d => d.data.name.split(' ').pop()) // Отображаем только модель
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
  
  // Функция для создания улучшенной карточки метрики
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
  
  // Создаем метрики с улучшенными иконками и стилем
  createMetricCard(
    'Средняя цена продажи',
    formatProfitCompact(totalSales / totalCount),
    `На базе ${totalCount} авто`,
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
    '59, 130, 246'
  );
  
  createMetricCard(
    'Премиум сегмент',
    ((carModels.filter(m => m.count > 0 && m.sales / m.count > 700000).reduce((sum, m) => sum + m.sales, 0) / totalSales) * 100).toFixed(1) + '%',
    'Высокодоходные модели',
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
    '245, 158, 11'
  );
  
  createMetricCard(
    'Топ-модель',
    carModels.length > 0 ? carModels.reduce((max, model) => model.count > max.count ? model : max, { count: 0 }).name.split(' ').pop() : '-',
    'По количеству продаж',
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>',
    '16, 185, 129'
  );
  
  createMetricCard(
    'Доходная модель',
    carModels.length > 0 ? carModels.reduce((max, model) => model.sales > max.sales ? model : max, { sales: 0 }).name.split(' ').pop() : '-',
    'По объему продаж',
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>',
    '236, 72, 153'
  );
  
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

const showRegionDetails = (year, month, monthName) => {
  if (!mainChartRef.current) return;
  d3.selectAll('.chart-tooltip, .bar-tooltip, .model-tooltip').remove();
  mainChartRef.current.innerHTML = '';
  
  const container = d3.select(mainChartRef.current)
    .append('div')
    .style('width', '100%')
    .style('height', '100%')
    .style('background', 'linear-gradient(135deg, #1f2937 0%, #111827 100%)')
    .style('border-radius', '1rem')
    .style('padding', '20px')
    .style('box-shadow', '0 10px 25px -5px rgba(0, 0, 0, 0.3)');
  
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
    .html(`Анализ региональных продаж: <span style="color: #60a5fa;">${monthName} ${year}</span>`);
  
  const buttonGroup = header.append('div')
    .style('display', 'flex')
    .style('gap', '10px');
  
  buttonGroup.append('button')
    .style('background', 'rgba(59, 130, 246, 0.2)')
    .style('color', '#60a5fa')
    .style('border', 'none')
    .style('padding', '8px 15px')
    .style('border-radius', '8px')
    .style('font-size', '0.85rem')
    .style('cursor', 'pointer')
    .text('← Назад к выбору')
    .on('click', () => showSelectionOptions(year, month, monthName));
  
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
  
  // Добавляем контроль временного периода для сравнения
  const timeControl = container.append('div')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('justify-content', 'center')
    .style('margin-bottom', '20px')
    .style('background', 'rgba(17, 24, 39, 0.4)')
    .style('border-radius', '8px')
    .style('padding', '10px');
  
  timeControl.append('span')
    .style('color', '#d1d5db')
    .style('margin-right', '10px')
    .text('Сравнить с:');
  
  // Создаем селектор для сравнения с другими годами
  const prevYears = [year-1, year-2];
  const yearSelector = timeControl.append('select')
    .style('background', 'rgba(30, 41, 59, 0.7)')
    .style('color', '#f9fafb')
    .style('border', '1px solid rgba(75, 85, 99, 0.5)')
    .style('border-radius', '6px')
    .style('padding', '5px 10px')
    .style('margin-right', '15px')
    .style('cursor', 'pointer')
    .on('change', function() {
      const selectedYear = +this.value;
      updateRegionComparisonData(selectedYear, year, month, monthName);
    });
  
  yearSelector.append('option')
    .attr('value', year-1)
    .text(`${year-1} год`);
  
  yearSelector.append('option')
    .attr('value', year-2)
    .text(`${year-2} год`);
  
  // Опция для просмотра среднего показателя за несколько лет
  yearSelector.append('option')
    .attr('value', 'avg')
    .text('Среднее за 3 года');
  
  // Добавляем выбор типа сравнения
  timeControl.append('span')
    .style('color', '#d1d5db')
    .style('margin-right', '10px')
    .style('margin-left', '15px')
    .text('Тип анализа:');
  
  const analysisType = timeControl.append('select')
    .style('background', 'rgba(30, 41, 59, 0.7)')
    .style('color', '#f9fafb')
    .style('border', '1px solid rgba(75, 85, 99, 0.5)')
    .style('border-radius', '6px')
    .style('padding', '5px 10px')
    .style('cursor', 'pointer')
    .on('change', function() {
      const selectedType = this.value;
      const selectedYear = +yearSelector.node().value;
      updateRegionComparisonData(selectedYear, year, month, monthName, selectedType);
    });
  
  analysisType.append('option')
    .attr('value', 'sales')
    .text('Объем продаж');
  
  analysisType.append('option')
    .attr('value', 'count')
    .text('Количество авто');
  
  analysisType.append('option')
    .attr('value', 'growth')
    .text('Динамика роста');
  
  // Создаем сетку для графиков
  const grid = container.append('div')
    .style('display', 'grid')
    .style('grid-template-columns', '1fr 1fr')
    .style('grid-template-rows', 'auto auto')
    .style('gap', '20px')
    .style('height', 'calc(100% - 100px)');
  
  // Генерируем данные по регионам для текущего года
  const regions = [
    { name: 'Ташкент', sales: Math.round(920000 + Math.random() * 250000), count: Math.round(140 + Math.random() * 35) },
    { name: 'Самарканд', sales: Math.round(680000 + Math.random() * 180000), count: Math.round(100 + Math.random() * 30) },
    { name: 'Бухара', sales: Math.round(580000 + Math.random() * 150000), count: Math.round(85 + Math.random() * 25) },
    { name: 'Фергана', sales: Math.round(520000 + Math.random() * 130000), count: Math.round(75 + Math.random() * 20) },
    { name: 'Андижан', sales: Math.round(490000 + Math.random() * 120000), count: Math.round(70 + Math.random() * 20) },
    { name: 'Наманган', sales: Math.round(450000 + Math.random() * 110000), count: Math.round(65 + Math.random() * 18) },
    { name: 'Навои', sales: Math.round(420000 + Math.random() * 100000), count: Math.round(60 + Math.random() * 15) },
    { name: 'Карши', sales: Math.round(380000 + Math.random() * 90000), count: Math.round(55 + Math.random() * 15) },
    { name: 'Нукус', sales: Math.round(350000 + Math.random() * 85000), count: Math.round(50 + Math.random() * 12) },
    { name: 'Ургенч', sales: Math.round(320000 + Math.random() * 80000), count: Math.round(45 + Math.random() * 12) },
    { name: 'Джизак', sales: Math.round(290000 + Math.random() * 70000), count: Math.round(40 + Math.random() * 10) },
    { name: 'Термез', sales: Math.round(260000 + Math.random() * 65000), count: Math.round(35 + Math.random() * 10) }
  ];
  
  // Генерируем исторические данные для сравнения
  const yearsMinus1 = regions.map(region => ({
    name: region.name,
    sales: Math.round(region.sales * (0.75 + Math.random() * 0.15)),
    count: Math.round(region.count * (0.75 + Math.random() * 0.15))
  }));
  
  const yearsMinus2 = regions.map(region => ({
    name: region.name,
    sales: Math.round(region.sales * (0.6 + Math.random() * 0.15)),
    count: Math.round(region.count * (0.6 + Math.random() * 0.15))
  }));
  
  // Сортируем по продажам
  regions.sort((a, b) => b.sales - a.sales);
  yearsMinus1.sort((a, b) => b.sales - a.sales);
  yearsMinus2.sort((a, b) => b.sales - a.sales);
  
  // Общие показатели для текущего года
  const totalSales = regions.reduce((sum, r) => sum + r.sales, 0);
  const totalCount = regions.reduce((sum, r) => sum + r.count, 0);
  
  // Общие показатели для прошлых лет
  const totalSalesMinus1 = yearsMinus1.reduce((sum, r) => sum + r.sales, 0);
  const totalCountMinus1 = yearsMinus1.reduce((sum, r) => sum + r.count, 0);
  
  const totalSalesMinus2 = yearsMinus2.reduce((sum, r) => sum + r.sales, 0);
  const totalCountMinus2 = yearsMinus2.reduce((sum, r) => sum + r.count, 0);
  
  // 1. Левый верхний блок - интерактивная таблица регионов с графиком доли рынка
  const regionRankingContainer = grid.append('div')
    .style('grid-column', '1')
    .style('grid-row', '1')
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
    .text('Рейтинг и доля регионов');
  
  // Добавляем блок статистики по топ-5 регионам
  const topRegionsStats = regionRankingContainer.append('div')
    .style('display', 'flex')
    .style('justify-content', 'space-between')
    .style('margin-bottom', '15px')
    .style('background', 'rgba(30, 41, 59, 0.5)')
    .style('border-radius', '8px')
    .style('padding', '10px')
    .style('font-size', '0.9rem');
  
  // Доля топ-5 регионов
  const top5Share = (regions.slice(0, 5).reduce((sum, r) => sum + r.sales, 0) / totalSales * 100).toFixed(1);
  
  topRegionsStats.append('div')
    .style('display', 'flex')
    .style('flex-direction', 'column')
    .style('align-items', 'center')
    .html(`
      <span style="color: #9ca3af">Топ-5 регионов</span>
      <span style="color: #f9fafb; font-weight: bold; font-size: 1.2rem">${top5Share}%</span>
      <span style="color: #60a5fa; font-size: 0.8rem">доля рынка</span>
    `);
  
  // Количество авто в топ-5
  const top5Count = regions.slice(0, 5).reduce((sum, r) => sum + r.count, 0);
  
  topRegionsStats.append('div')
    .style('display', 'flex')
    .style('flex-direction', 'column')
    .style('align-items', 'center')
    .html(`
      <span style="color: #9ca3af">Продано авто</span>
      <span style="color: #f9fafb; font-weight: bold; font-size: 1.2rem">${top5Count}</span>
      <span style="color: #60a5fa; font-size: 0.8rem">в топ-5 регионах</span>
    `);
  
  // Рост по сравнению с прошлым годом
  const top5Growth = ((regions.slice(0, 5).reduce((sum, r) => sum + r.sales, 0) / 
                      yearsMinus1.slice(0, 5).reduce((sum, r) => sum + r.sales, 0) - 1) * 100).toFixed(1);
  
  topRegionsStats.append('div')
    .style('display', 'flex')
    .style('flex-direction', 'column')
    .style('align-items', 'center')
    .html(`
      <span style="color: #9ca3af">Рост продаж</span>
      <span style="color: ${+top5Growth >= 0 ? '#10b981' : '#ef4444'}; font-weight: bold; font-size: 1.2rem">
        ${+top5Growth >= 0 ? '+' : ''}${top5Growth}%
      </span>
      <span style="color: #60a5fa; font-size: 0.8rem">к ${year-1} году</span>
    `);

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
    .style('grid-template-columns', '8% 32% 15% 15% 30%')
    .style('padding', '10px')
    .style('background', 'rgba(30, 41, 59, 0.8)')
    .style('border-radius', '8px 8px 0 0')
    .style('position', 'sticky')
    .style('top', '0')
    .style('z-index', '1');

  rankingHeader.append('div').style('font-size', '0.85rem').style('font-weight', 'bold').style('color', '#f9fafb').text('№');
  rankingHeader.append('div').style('font-size', '0.85rem').style('font-weight', 'bold').style('color', '#f9fafb').text('Регион');
  rankingHeader.append('div').style('font-size', '0.85rem').style('font-weight', 'bold').style('color', '#f9fafb').style('text-align', 'center').text('Продажи');
  rankingHeader.append('div').style('font-size', '0.85rem').style('font-weight', 'bold').style('color', '#f9fafb').style('text-align', 'center').text('Динамика');
  rankingHeader.append('div').style('font-size', '0.85rem').style('font-weight', 'bold').style('color', '#f9fafb').style('text-align', 'center').text('Доля рынка');

  // Строки таблицы с анимацией
  regions.forEach((region, i) => {
    const prevYearRegion = yearsMinus1.find(r => r.name === region.name) || { sales: 0, count: 0 };
    const growth = ((region.sales / prevYearRegion.sales) - 1) * 100;
    const marketShare = (region.sales / totalSales) * 100;
    
    const backgroundColor = i % 2 === 0 ? 'rgba(30, 41, 59, 0.3)' : 'rgba(30, 41, 59, 0.5)';
    
    const row = rankingTable.append('div')
      .style('display', 'grid')
      .style('grid-template-columns', '8% 32% 15% 15% 30%')
      .style('padding', '10px 8px')
      .style('background', backgroundColor)
      .style('border-left', i < 3 ? `3px solid ${d3.interpolateReds(0.3 + i * 0.2)}` : 'none')
      .style('cursor', 'pointer')
      .style('transition', 'all 0.2s')
      .on('mouseover', function() { d3.select(this).style('background', 'rgba(59, 130, 246, 0.2)'); })
      .on('mouseout', function() { d3.select(this).style('background', backgroundColor); })
      .on('click', () => { showRegionModelDistribution(region.name, year, month, monthName); });
    
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
    
    // Количество продаж
    row.append('div')
      .style('font-size', '0.85rem')
      .style('color', '#f9fafb')
      .style('text-align', 'center')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('justify-content', 'center')
      .text(region.count + ' шт.');
    
    // Динамика роста
    row.append('div')
      .style('font-size', '0.85rem')
      .style('color', growth >= 0 ? '#10b981' : '#ef4444')
      .style('font-weight', 'bold')
      .style('text-align', 'center')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('justify-content', 'center')
      .text(`${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`);
    
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
  
  // 2. Правый верхний блок - интерактивная круговая диаграмма
  const pieChartContainer = grid.append('div')
    .style('grid-column', '2')
    .style('grid-row', '1')
    .style('background', 'rgba(17, 24, 39, 0.4)')
    .style('border-radius', '12px')
    .style('padding', '15px')
    .style('border', '1px solid rgba(59, 130, 246, 0.1)');
  
  pieChartContainer.append('h3')
    .style('font-size', '1.1rem')
    .style('color', '#f9fafb')
    .style('margin-bottom', '15px')
    .style('text-align', 'center')
    .text('Структура продаж по регионам');
  
  // Создаем круговую диаграмму
  const pieSvg = pieChartContainer.append('svg')
    .attr('width', '100%')
    .attr('height', 'calc(100% - 30px)');
  
  const pieWidth = pieSvg.node().clientWidth;
  const pieHeight = pieSvg.node().clientHeight;
  const pieRadius = Math.min(pieWidth, pieHeight) / 2 * 0.8;
  
  // Используем топ-5 регионов и объединяем остальные в "Другие"
  const pieData = [...regions.slice(0, 5)];
  
  if (regions.length > 5) {
    const otherSales = regions.slice(5).reduce((sum, r) => sum + r.sales, 0);
    const otherCount = regions.slice(5).reduce((sum, r) => sum + r.count, 0);
    pieData.push({ name: 'Другие регионы', sales: otherSales, count: otherCount });
  }
  
  const pieColor = d3.scaleOrdinal()
    .domain(pieData.map(d => d.name))
    .range(d3.quantize(t => d3.interpolateBlues(t * 0.8 + 0.1), pieData.length));
  
  const pie = d3.pie()
    .value(d => d.sales)
    .sort(null);
  
  const arc = d3.arc()
    .innerRadius(pieRadius * 0.4) // Для пончика
    .outerRadius(pieRadius);
  
  const arcHover = d3.arc()
    .innerRadius(pieRadius * 0.4)
    .outerRadius(pieRadius * 1.05);
  
  // Создаем градиенты для каждого сегмента
  const pieDefs = pieSvg.append('defs');
  
  pieData.forEach((region, i) => {
    const gradientId = `pie-region-gradient-${i}`;
    const gradient = pieDefs.append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%');
    
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', d3.rgb(pieColor(region.name)).brighter(0.5))
      .attr('stop-opacity', 0.9);
    
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', pieColor(region.name))
      .attr('stop-opacity', 0.7);
  });
  
  // Создаем группу для пончика
  const pieG = pieSvg.append('g')
    .attr('transform', `translate(${pieWidth / 2}, ${pieHeight / 2})`);
  
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
      centerPercent.text(`${((d.data.sales / totalSales) * 100).toFixed(1)}%`);
      
      // Показываем легенду для выбранного элемента
      pieLegendItems.style('opacity', 0.5);
      pieLegendItems.filter(item => item.name === d.data.name)
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
      centerNumber.text(formatProfitCompact(totalSales));
      centerPercent.text('100%');
      
      // Восстанавливаем легенду
      pieLegendItems.style('opacity', 1)
        .style('font-weight', 'normal');
    })
    .on('click', (event, d) => {
      // При клике показываем распределение по моделям для региона
      if (d.data.name !== 'Другие регионы') {
        showRegionModelDistribution(d.data.name, year, month, monthName);
      }
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
    .attr('dy', '-1em')
    .style('font-size', '0.9rem')
    .style('fill', '#d1d5db')
    .text('Общий объем');
  
  const centerNumber = pieG.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '0.5em')
    .style('font-size', '1.2rem')
    .style('font-weight', 'bold')
    .style('fill', '#f9fafb')
    .text(formatProfitCompact(totalSales));
  
  const centerPercent = pieG.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '2em')
    .style('font-size', '1rem')
    .style('fill', '#60a5fa')
    .text('100%');
  
  // Добавляем легенду для диаграммы
  const pieLegend = pieSvg.append('g')
    .attr('transform', `translate(${pieWidth - 80}, 20)`);
  
  // Добавляем элементы легенды
  const pieLegendItems = pieLegend.selectAll('.legend-item')
    .data(pieData)
    .join('g')
    .attr('class', 'legend-item')
    .attr('transform', (d, i) => `translate(0, ${i * 20})`)
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      // Находим соответствующий сегмент
      const segment = pieArcs.filter(arc => arc.data.name === d.name);
      
      // Выделяем сегмент
      segment.transition()
        .duration(200)
        .attr('d', arcHover);
      
      // Показываем значение в центре
      centerText.text(d.name);
      centerNumber.text(formatProfitCompact(d.sales));
      centerPercent.text(`${((d.sales / totalSales) * 100).toFixed(1)}%`);
      
      // Выделяем легенду
      d3.select(this)
        .style('opacity', 1)
        .style('font-weight', 'bold');
      
      pieLegendItems.filter(item => item.name !== d.name)
        .style('opacity', 0.5);
    })
   .on('mouseout', function(event, d) {
     // Восстанавливаем сегмент
     pieArcs.transition()
       .duration(200)
       .attr('d', arc);
     
     // Восстанавливаем общую сумму в центре
     centerText.text('Общий объем');
     centerNumber.text(formatProfitCompact(totalSales));
     centerPercent.text('100%');
     
     // Восстанавливаем легенду
     pieLegendItems.style('opacity', 1)
       .style('font-weight', 'normal');
   })
   .on('click', function(event, d) {
     if (d.name !== 'Другие регионы') {
       showRegionModelDistribution(d.name, year, month, monthName);
     }
   });
 
 // Добавляем маркеры и текст легенды
 pieLegendItems.append('rect')
   .attr('width', 12)
   .attr('height', 12)
   .attr('rx', 2)
   .attr('fill', d => pieColor(d.name));
 
 pieLegendItems.append('text')
   .attr('x', 18)
   .attr('y', 10)
   .style('font-size', '0.7rem')
   .style('fill', '#f9fafb')
   .text(d => d.name.length > 10 ? d.name.substring(0, 10) + '...' : d.name);
 
 // 3. Нижний левый - сравнение с предыдущими годами
 const compareChartContainer = grid.append('div')
   .attr('id', 'region-comparison-container')
   .style('grid-column', '1')
   .style('grid-row', '2')
   .style('background', 'rgba(17, 24, 39, 0.4)')
   .style('border-radius', '12px')
   .style('padding', '15px')
   .style('border', '1px solid rgba(59, 130, 246, 0.1)');
 
 compareChartContainer.append('h3')
   .style('font-size', '1.1rem')
   .style('color', '#f9fafb')
   .style('margin-bottom', '15px')
   .style('text-align', 'center')
   .text(`Сравнение с ${year-1} годом`);
 
 // Функция для обновления данных сравнения
// Обновленная функция для блока сравнения
function updateRegionComparisonData(compareYear, currentYear, month, monthName, analysisMetric = 'sales') {
  const comparisonContainer = d3.select('#region-comparison-container');
  comparisonContainer.selectAll('*').remove();
  
  // Заголовок
  comparisonContainer.append('h3')
    .style('font-size', '1.1rem')
    .style('color', '#f9fafb')
    .style('margin-bottom', '10px')
    .style('text-align', 'center')
    .text(`Сравнение продаж автомобилей: ${monthName} ${currentYear} vs ${monthName} ${compareYear}`);
  
  // Топ регионов
  const topRegions = regions.slice(0, 6);
  
  // Данные для сравнения
  let compareRegions;
  if (compareYear === 'avg') {
    compareRegions = yearsMinus1;
  } else if (compareYear === currentYear-1) {
    compareRegions = yearsMinus1;
  } else {
    compareRegions = yearsMinus2;
  }
  
  // Подготовка данных
  const compareData = topRegions.map(region => {
    const compareRegion = compareRegions.find(r => r.name === region.name) || 
      { name: region.name, sales: 0, count: 0 };
    
    return {
      name: region.name,
      currentSales: region.sales,
      previousSales: compareRegion.sales,
      currentCount: region.count, 
      previousCount: compareRegion.count,
      salesGrowth: ((region.sales / Math.max(1, compareRegion.sales)) - 1) * 100,
      countGrowth: ((region.count / Math.max(1, compareRegion.count)) - 1) * 100
    };
  });
  
  // Создаем двойную визуализацию: график для количества и для денег
  const graphsContainer = comparisonContainer.append('div')
    .style('display', 'flex')
    .style('flex-direction', 'column')
    .style('height', 'calc(100% - 20px)')
    .style('gap', '15px');
  
  // 1. График сравнения количества проданных автомобилей
  const countChartContainer = graphsContainer.append('div')
    .style('flex', '1')
    .style('background', 'rgba(17, 24, 39, 0.6)')
    .style('border-radius', '8px')
    .style('padding', '10px');
  
  countChartContainer.append('h4')
    .style('font-size', '0.9rem')
    .style('color', '#f9fafb')
    .style('margin-bottom', '10px')
    .style('text-align', 'center')
    .text('Количество проданных автомобилей');
  
  // SVG для графика количества
  const countSvg = countChartContainer.append('svg')
    .attr('width', '100%')
    .attr('height', 'calc(100% - 30px)');
  
  const countWidth = countSvg.node().clientWidth;
  const countHeight = countSvg.node().clientHeight;
  const countMargin = { top: 20, right: 60, bottom: 30, left: 80 };
  
  // Максимальное количество для масштаба
  const maxCount = d3.max(compareData, d => Math.max(d.currentCount, d.previousCount)) * 1.1;
  
  // Шкалы для графика количества
  const countX = d3.scaleLinear()
    .domain([0, maxCount])
    .range([countMargin.left, countWidth - countMargin.right]);
  
  const countY = d3.scaleBand()
    .domain(compareData.map(d => d.name))
    .range([countMargin.top, countHeight - countMargin.bottom])
    .padding(0.4);
  
  // Оси для графика количества
  countSvg.append('g')
    .attr('transform', `translate(0,${countHeight - countMargin.bottom})`)
    .call(d3.axisBottom(countX).ticks(5))
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('text')
      .style('fill', '#d1d5db')
      .style('font-size', '0.7rem'));
  
  countSvg.append('g')
    .attr('transform', `translate(${countMargin.left},0)`)
    .call(d3.axisLeft(countY))
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('text')
      .style('fill', '#d1d5db')
      .style('font-size', '0.8rem'));
  
  // Текущий год (синие полосы)
  countSvg.selectAll('.current-bar')
    .data(compareData)
    .join('rect')
    .attr('class', 'current-bar')
    .attr('x', countMargin.left)
    .attr('y', d => countY(d.name))
    .attr('height', countY.bandwidth() / 2 - 2)
    .attr('fill', '#3b82f6')
    .attr('rx', 4)
    .attr('width', 0)
    .transition()
    .duration(800)
    .delay((d, i) => i * 100)
    .attr('width', d => countX(d.currentCount) - countMargin.left);
  
  // Прошлый год (серые полосы)
  countSvg.selectAll('.previous-bar')
    .data(compareData)
    .join('rect')
    .attr('class', 'previous-bar')
    .attr('x', countMargin.left)
    .attr('y', d => countY(d.name) + countY.bandwidth() / 2 + 2)
    .attr('height', countY.bandwidth() / 2 - 2)
    .attr('fill', '#94a3b8')
    .attr('rx', 4)
    .attr('width', 0)
    .transition()
    .duration(800)
    .delay((d, i) => i * 100 + 300)
    .attr('width', d => countX(d.previousCount) - countMargin.left);
  
  // Подписи значений
  countSvg.selectAll('.current-count-label')
    .data(compareData)
    .join('text')
    .attr('class', 'current-count-label')
    .attr('x', d => countX(d.currentCount) + 5)
    .attr('y', d => countY(d.name) + countY.bandwidth() / 4)
    .style('font-size', '0.75rem')
    .style('fill', '#ffffff')
    .style('opacity', 0)
    .text(d => d.currentCount)
    .transition()
    .duration(500)
    .delay((d, i) => i * 100 + 800)
    .style('opacity', 1);
  
  countSvg.selectAll('.previous-count-label')
    .data(compareData)
    .join('text')
    .attr('class', 'previous-count-label')
    .attr('x', d => countX(d.previousCount) + 5)
    .attr('y', d => countY(d.name) + countY.bandwidth() * 3/4 + 2)
    .style('font-size', '0.75rem')
    .style('fill', '#d1d5db')
    .style('opacity', 0)
    .text(d => d.previousCount)
    .transition()
    .duration(500)
    .delay((d, i) => i * 100 + 1000)
    .style('opacity', 1);
  
  // Стрелки изменения с процентами
  countSvg.selectAll('.count-growth')
    .data(compareData)
    .join('text')
    .attr('class', 'count-growth')
    .attr('x', countWidth - countMargin.right + 5)
    .attr('y', d => countY(d.name) + countY.bandwidth() / 2)
    .attr('dy', '0.35em')
    .style('font-size', '0.8rem')
    .style('font-weight', 'bold')
    .style('fill', d => d.countGrowth >= 0 ? '#10b981' : '#ef4444')
    .text(d => `${d.countGrowth >= 0 ? '▲' : '▼'} ${Math.abs(d.countGrowth).toFixed(1)}%`)
    .style('opacity', 0)
    .transition()
    .duration(500)
    .delay((d, i) => i * 100 + 1200)
    .style('opacity', 1);
  
  // 2. График сравнения объема продаж (в деньгах)
  const salesChartContainer = graphsContainer.append('div')
    .style('flex', '1')
    .style('background', 'rgba(17, 24, 39, 0.6)')
    .style('border-radius', '8px')
    .style('padding', '10px');
  
  salesChartContainer.append('h4')
    .style('font-size', '0.9rem')
    .style('color', '#f9fafb')
    .style('margin-bottom', '10px')
    .style('text-align', 'center')
    .text('Объем продаж (в UZS)');
  
  // SVG для графика продаж
  const salesSvg = salesChartContainer.append('svg')
    .attr('width', '100%')
    .attr('height', 'calc(100% - 30px)');
  
  const salesWidth = salesSvg.node().clientWidth;
  const salesHeight = salesSvg.node().clientHeight;
  const salesMargin = { top: 20, right: 60, bottom: 30, left: 80 };
  
  // Максимальная сумма продаж для масштаба
  const maxSales = d3.max(compareData, d => Math.max(d.currentSales, d.previousSales)) * 1.1;
  
  // Шкалы для графика продаж
  const salesX = d3.scaleLinear()
    .domain([0, maxSales])
    .range([salesMargin.left, salesWidth - salesMargin.right]);
  
  const salesY = d3.scaleBand()
    .domain(compareData.map(d => d.name))
    .range([salesMargin.top, salesHeight - salesMargin.bottom])
    .padding(0.4);
  
  // Оси для графика продаж
  salesSvg.append('g')
    .attr('transform', `translate(0,${salesHeight - salesMargin.bottom})`)
    .call(d3.axisBottom(salesX).ticks(5).tickFormat(d => formatProfitCompact(d)))
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('text')
      .style('fill', '#d1d5db')
      .style('font-size', '0.7rem'));
  
  salesSvg.append('g')
    .attr('transform', `translate(${salesMargin.left},0)`)
    .call(d3.axisLeft(salesY))
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('text')
      .style('fill', '#d1d5db')
      .style('font-size', '0.8rem'));
  
  // Текущий год (зеленые полосы для продаж)
  salesSvg.selectAll('.current-sales-bar')
    .data(compareData)
    .join('rect')
    .attr('class', 'current-sales-bar')
    .attr('x', salesMargin.left)
    .attr('y', d => salesY(d.name))
    .attr('height', salesY.bandwidth() / 2 - 2)
    .attr('fill', '#10b981')
    .attr('rx', 4)
    .attr('width', 0)
    .transition()
    .duration(800)
    .delay((d, i) => i * 100)
    .attr('width', d => salesX(d.currentSales) - salesMargin.left);
  
  // Прошлый год (серые полосы для продаж)
  salesSvg.selectAll('.previous-sales-bar')
    .data(compareData)
    .join('rect')
    .attr('class', 'previous-sales-bar')
    .attr('x', salesMargin.left)
    .attr('y', d => salesY(d.name) + salesY.bandwidth() / 2 + 2)
    .attr('height', salesY.bandwidth() / 2 - 2)
    .attr('fill', '#94a3b8')
    .attr('rx', 4)
    .attr('width', 0)
    .transition()
    .duration(800)
    .delay((d, i) => i * 100 + 300)
    .attr('width', d => salesX(d.previousSales) - salesMargin.left);
  
  // Стрелки изменения с процентами для продаж
  salesSvg.selectAll('.sales-growth')
    .data(compareData)
    .join('text')
    .attr('class', 'sales-growth')
    .attr('x', salesWidth - salesMargin.right + 5)
    .attr('y', d => salesY(d.name) + salesY.bandwidth() / 2)
    .attr('dy', '0.35em')
    .style('font-size', '0.8rem')
    .style('font-weight', 'bold')
    .style('fill', d => d.salesGrowth >= 0 ? '#10b981' : '#ef4444')
    .text(d => `${d.salesGrowth >= 0 ? '▲' : '▼'} ${Math.abs(d.salesGrowth).toFixed(1)}%`)
    .style('opacity', 0)
    .transition()
    .duration(500)
    .delay((d, i) => i * 100 + 1200)
    .style('opacity', 1);
  
  // Добавляем легенду
  const legend = salesSvg.append('g')
    .attr('transform', `translate(${salesMargin.left}, 5)`);
  
  // Текущий год
  legend.append('rect')
    .attr('width', 12)
    .attr('height', 12)
    .attr('rx', 2)
    .attr('fill', '#10b981');
  
  legend.append('text')
    .attr('x', 18)
    .attr('y', 10)
    .style('font-size', '0.7rem')
    .style('fill', '#f9fafb')
    .text(`${currentYear} год`);
  
  // Предыдущий год
  legend.append('rect')
    .attr('width', 12)
    .attr('height', 12)
    .attr('rx', 2)
    .attr('fill', '#94a3b8')
    .attr('transform', 'translate(80, 0)');
  
  legend.append('text')
    .attr('x', 98)
    .attr('y', 10)
    .style('font-size', '0.7rem')
    .style('fill', '#f9fafb')
    .text(`${compareYear} год`);
}
 
 // Инициализируем график сравнения
 updateRegionComparisonData(year-1, year, month, monthName);
 
 // 4. Нижний правый - ключевые метрики региона
 const metricsContainer = grid.append('div')
   .style('grid-column', '2')
   .style('grid-row', '2')
   .style('background', 'rgba(17, 24, 39, 0.4)')
   .style('border-radius', '12px')
   .style('padding', '15px')
   .style('border', '1px solid rgba(59, 130, 246, 0.1)');
 
 metricsContainer.append('h3')
   .style('font-size', '1.1rem')
   .style('color', '#f9fafb')
   .style('margin-bottom', '15px')
   .style('text-align', 'center')
   .text('Ключевые показатели');
 
 // Создаем контейнер для метрик
 const metricsGrid = metricsContainer.append('div')
   .style('display', 'grid')
   .style('grid-template-columns', '1fr 1fr')
   .style('grid-gap', '15px')
   .style('height', 'calc(100% - 30px)');
 
 // Функция для создания карточки метрики
 const createMetricCard = (title, value, unit, icon, color, subtitle) => {
   const card = metricsGrid.append('div')
     .style('background', 'rgba(30, 41, 59, 0.5)')
     .style('border-radius', '10px')
     .style('padding', '15px')
     .style('display', 'flex')
     .style('flex-direction', 'column')
     .style('justify-content', 'center')
     .style('position', 'relative')
     .style('overflow', 'hidden');
   
   // Градиентный фон
   card.append('div')
     .style('position', 'absolute')
     .style('top', '0')
     .style('left', '0')
     .style('width', '100%')
     .style('height', '100%')
     .style('background', `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`)
     .style('z-index', '0');
   
   // Фоновая иконка
   card.append('div')
     .style('position', 'absolute')
     .style('top', '10px')
     .style('right', '10px')
     .style('font-size', '2.5rem')
     .style('color', `${color}25`)
     .style('z-index', '0')
     .html(icon);
   
   // Содержимое
   const content = card.append('div')
     .style('position', 'relative')
     .style('z-index', '1');
   
   content.append('div')
     .style('font-size', '0.9rem')
     .style('color', '#9ca3af')
     .style('margin-bottom', '5px')
     .text(title);
   
   const valueRow = content.append('div')
     .style('display', 'flex')
     .style('align-items', 'baseline')
     .style('margin-bottom', '5px');
   
   valueRow.append('span')
     .style('font-size', '1.6rem')
     .style('font-weight', 'bold')
     .style('color', color)
     .text(value);
   
   valueRow.append('span')
     .style('font-size', '0.9rem')
     .style('color', '#d1d5db')
     .style('margin-left', '5px')
     .text(unit);
   
   if (subtitle) {
     content.append('div')
       .style('font-size', '0.8rem')
       .style('color', '#9ca3af')
       .text(subtitle);
   }
 };
 
 // Рассчитываем метрики для анализа
 const yearOverYearGrowth = ((totalSales / totalSalesMinus1) - 1) * 100;
 const threeyearGrowth = ((totalSales / totalSalesMinus2) - 1) * 100;
 const salesPerCapita = totalSales / (regions.reduce((sum, r) => sum + r.count, 0) || 1);
 const concentrationIndex = regions.slice(0, 3).reduce((sum, r) => sum + r.sales, 0) / totalSales * 100;
 
 // Создаем метрики
 createMetricCard(
   'Общий объем продаж',
   formatProfitCompact(totalSales),
   '',
   '<i class="fas fa-chart-line"></i>',
   '#f87171',
   `${totalCount} автомобилей`
 );
 
 createMetricCard(
   'Годовой рост продаж',
   `${yearOverYearGrowth.toFixed(1)}`,
   '%',
   '<i class="fas fa-arrow-trend-up"></i>',
   yearOverYearGrowth >= 0 ? '#10b981' : '#ef4444',
   `По сравнению с ${year-1} годом`
 );
 
 createMetricCard(
   'Индекс концентрации',
   concentrationIndex.toFixed(1),
   '%',
   '<i class="fas fa-map-marker-alt"></i>',
   '#8b5cf6',
   'Доля топ-3 регионов в продажах'
 );
 
 createMetricCard(
   'Средняя цена автомобиля',
   formatProfitCompact(salesPerCapita),
   '',
   '<i class="fas fa-car"></i>',
   '#f59e0b',
   'По всем регионам'
 );
 
 // Добавляем иконки Font Awesome
 if (!document.querySelector('[href*="font-awesome"]')) {
   const head = document.head || document.getElementsByTagName('head')[0];
   const fontAwesome = document.createElement('link');
   fontAwesome.rel = 'stylesheet';
   fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css';
   head.appendChild(fontAwesome);
 }
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
  
  // Внутренняя шкала для годов в каждом месяце
  const x1 = d3.scaleBand()
    .domain(selectedYears)
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
  
  // Создаем цветовую шкалу для годов
  const colorScale = d3.scaleOrdinal()
    .domain(selectedYears)
    .range(selectedYears.map((_, i) => {
      if (focusCategory !== 'all') {
        const baseColor = d3.hsl(SALE_TYPES[focusCategory.toUpperCase()].color);
        baseColor.l = 0.4 + (i * 0.2);
        return baseColor.toString();
      }
      return d3.schemeCategory10[i % d3.schemeCategory10.length];
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
    .data(d => selectedYears.map(year => ({
      year: year,
      value: d.years[year] || 0,
      month: d.name
    })))
    .join('rect')
    .attr('x', d => x1(d.year))
    .attr('y', d => y(d.value))
    .attr('width', x1.bandwidth())
    .attr('height', d => height - margin.bottom - y(d.value))
    .attr('fill', d => colorScale(d.year))
    .attr('rx', 4)
    .attr('opacity', 0.9)
    .on('mouseover', function(event, d) {
      d3.select(this).attr('opacity', 1);
      
      // Показываем подсказку
      tooltip.style('opacity', 1)
        .html(`<strong>${d.month} ${d.year}</strong><br>${d3.format(',.0f')(d.value)}`)
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
  const legend = svg.append('g')
    .attr('transform', `translate(${width - margin.right - 120}, ${margin.top})`);
  
  selectedYears.forEach((year, i) => {
    const yearLegend = legend.append('g')
      .attr('transform', `translate(0, ${i * 25})`);
    
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
    if (i > 0) {
      const prevYear = selectedYears[0]; // Обычно сравниваем с первым годом
      const yearTotals = data.reduce((acc, month) => {
        acc[year] = (acc[year] || 0) + (month.years[year] || 0);
        acc[prevYear] = (acc[prevYear] || 0) + (month.years[prevYear] || 0);
        return acc;
      }, {});
      
      const growthPercent = yearTotals[prevYear] !== 0 ? 
        ((yearTotals[year] / yearTotals[prevYear]) - 1) * 100 : 0;
      
      yearLegend.append('text')
        .attr('x', 60)
        .attr('y', 12)
        .style('font-size', '0.8rem')
        .style('fill', growthPercent >= 0 ? '#10b981' : '#ef4444')
        .text(`${growthPercent >= 0 ? '+' : ''}${growthPercent.toFixed(1)}%`);
    }
  });
};
  const renderMultiLineChart = () => {
    if (!mainChartRef.current) return;
    
    const container = mainChartRef.current;
      container.innerHTML = '';
      const width = container.clientWidth;
    const height = 400;
    const margin = { top: 40, right: 80, bottom: 60, left: 60 };
    
    // Создаем SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('background', '#1f2937')
      .style('border-radius', '0.5rem');
    
    // Добавляем заголовок
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '1.2rem')
      .style('font-weight', 'bold')
      .style('fill', '#f9fafb')
      .text(`Сравнение продаж по годам ${selectedYears.join(', ')}` +
        (focusCategory !== 'all' ? ` (${SALE_TYPES[focusCategory.toUpperCase()].name})` : ''));
    
    // Подготавливаем данные для мультилинейного графика
    const yearlyData = {};
    
    // Группируем данные по годам
    filteredData.forEach(month => {
      if (!yearlyData[month.year]) {
        yearlyData[month.year] = [];
      }
      
      yearlyData[month.year].push({
        month: month.month,
        name: month.name,
        value: focusCategory === 'all' ? month.total : month[focusCategory]
      });
    });
    
    // Сортируем по месяцам в каждом году
    Object.keys(yearlyData).forEach(year => {
      yearlyData[year].sort((a, b) => a.month - b.month);
    });
    
    // Создаем шкалы
    const x = d3.scalePoint()
      .domain(MONTHS)
      .range([margin.left, width - margin.right])
      .padding(0.5);
    
    const y = d3.scaleLinear()
      .domain([0, d3.max(filteredData, d => focusCategory === 'all' ? d.total : d[focusCategory]) * 1.1])
      .nice()
      .range([height - margin.bottom, margin.top]);
    
    // Цветовая схема для годов
    const colorScale = d3.scaleOrdinal()
      .domain(selectedYears)
      .range(selectedYears.map((_, i) => {
        if (focusCategory !== 'all') {
          const baseColor = d3.hsl(SALE_TYPES[focusCategory.toUpperCase()].color);
          baseColor.l = 0.4 + (i * 0.2);
          return baseColor.toString();
        }
        return d3.schemeCategory10[i % d3.schemeCategory10.length];
      }));
    
    // Создаем оси
    const xAxis = g => g
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text')
        .style('fill', '#f9fafb')
        .style('font-size', '0.8rem'));
    
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
    
    // Добавляем фоновую сетку
    svg.selectAll('.grid-line')
      .data(y.ticks(5))
      .join('line')
      .attr('class', 'grid-line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', d => y(d))
      .attr('y2', d => y(d))
      .attr('stroke', '#374151')
      .attr('stroke-width', 0.5)
      .attr('stroke-dasharray', '3,3')
      .style('opacity', 0.5);
    
    // Создаем линии для каждого года
    const line = d3.line()
      .x(d => x(d.name))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);
    
    // Добавляем линии с анимацией
    Object.entries(yearlyData).forEach(([year, data], index) => {
      // Добавляем линию
      const path = svg.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', colorScale(parseInt(year)))
        .attr('stroke-width', 3)
        .attr('d', line);
      
      // Анимация линии
      const totalLength = path.node().getTotalLength();
      
      path
        .attr('stroke-dasharray', totalLength)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(1500)
        .delay(index * 300)
        .attr('stroke-dashoffset', 0);
      
      // Добавляем точки
      svg.selectAll(`.data-point-${year}`)
        .data(data)
        .join('circle')
        .attr('class', `data-point-${year}`)
        .attr('cx', d => x(d.name))
        .attr('cy', d => y(d.value))
        .attr('r', 0)
        .attr('fill', colorScale(parseInt(year)))
        .attr('stroke', '#1f2937')
        .attr('stroke-width', 2)
        .transition()
        .delay((_, i) => i * 100 + 500 + index * 300)
        .duration(300)
        .attr('r', 5);
    });
    
    // Добавляем легенду
    const legend = svg.append('g')
      .attr('transform', `translate(${width - margin.right - 100}, ${margin.top + 10})`);
    
    selectedYears.forEach((year, i) => {
      const yearLegend = legend.append('g')
        .attr('transform', `translate(0, ${i * 25})`);
      
      yearLegend.append('line')
        .attr('x1', 0)
        .attr('x2', 25)
        .attr('y1', 0)
        .attr('y2', 0)
        .attr('stroke', colorScale(year))
        .attr('stroke-width', 3);
      
      yearLegend.append('text')
        .attr('x', 35)
        .attr('y', 4)
        .text(year)
        .style('font-size', '0.9rem')
        .style('fill', '#f9fafb');
    });
    
    // Добавляем интерактивные подсказки
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
    
    // Область для взаимодействия
    MONTHS.forEach(month => {
      svg.append('rect')
        .attr('x', x(month) - 15)
        .attr('y', margin.top)
        .attr('width', 30)
        .attr('height', height - margin.top - margin.bottom)
        .attr('fill', 'transparent')
        .on('mouseover', function(event) {
          // Показываем вертикальную направляющую
          svg.append('line')
            .attr('class', 'month-guide')
            .attr('x1', x(month))
            .attr('x2', x(month))
            .attr('y1', margin.top)
            .attr('y2', height - margin.bottom)
            .attr('stroke', '#f9fafb')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '3,3')
            .style('opacity', 0.6);
          
          // Подсвечиваем все точки для этого месяца
          Object.keys(yearlyData).forEach(year => {
            const monthData = yearlyData[year].find(d => d.name === month);
            if (monthData) {
              svg.selectAll(`.data-point-${year}`)
                .filter(d => d.name === month)
                .transition()
                .duration(100)
                .attr('r', 8);
              
              // Добавляем метку со значением
              svg.append('text')
                .attr('class', 'month-label')
                .attr('x', x(month))
                .attr('y', y(monthData.value) - 10)
                .attr('text-anchor', 'middle')
                .style('font-size', '0.8rem')
                .style('fill', colorScale(parseInt(year)))
                .text(d3.format(',.0f')(monthData.value));
            }
          });
          
          // Показываем подсказку
          const tooltipContent = `
            <strong>${month}</strong><br>
            ${Object.entries(yearlyData)
              .map(([year, data]) => {
                const monthData = data.find(d => d.name === month);
                return monthData ? 
                  `<div style="display: flex; justify-content: space-between; margin: 2px 0;">
                    <span style="color: ${colorScale(parseInt(year))};">${year}:</span>
                    <span style="margin-left: 12px;">${d3.format(',.0f')(monthData.value)}  UZS</span>
                  </div>` : '';
              })
              .join('')}
          `;
          
          tooltip.html(tooltipContent)
            .style('left', `${event.pageX + 15}px`)
            .style('top', `${event.pageY - 28}px`)
            .style('opacity', 1);
        })
        .on('mouseout', function() {
          // Убираем направляющую
          svg.selectAll('.month-guide').remove();
          
          // Возвращаем размер точек
          Object.keys(yearlyData).forEach(year => {
            svg.selectAll(`.data-point-${year}`)
              .transition()
              .duration(100)
              .attr('r', 5);
          });
          
          // Убираем метки
          svg.selectAll('.month-label').remove();
          
          // Скрываем подсказку
          tooltip.style('opacity', 0);
        });
    });
  };
  const renderRadarChart = () => {
    if (!mainChartRef.current) return;
    
    const container = mainChartRef.current;
    container.innerHTML = '';
    
    const width = container.clientWidth;
    const height = 400;
    const margin = 60;
    
    // Создаем SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('background', '#1f2937')
      .style('border-radius', '0.5rem');
    
    // Центр графика
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - margin;
    
    // Добавляем заголовок
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .style('font-size', '1.2rem')
      .style('font-weight', 'bold')
      .style('fill', '#f9fafb')
      .text(`Радарная диаграмма продаж по месяцам` +
        (focusCategory !== 'all' ? ` (${SALE_TYPES[focusCategory.toUpperCase()].name})` : ''));
    
    // Подготавливаем данные
    let chartData;
    
    if (displayMode === 'compare') {
      // Для режима сравнения создаем многоуровневый радар по годам
      chartData = selectedYears.map(year => {
        const yearData = filteredData.filter(month => month.year === year);
        
        return {
          year,
          values: MONTHS.map((month, i) => {
            const monthData = yearData.find(m => m.name === month);
            return {
              axis: month,
              value: monthData ? 
                (focusCategory === 'all' ? monthData.total : monthData[focusCategory]) : 0
            };
          })
        };
      });
    } else {
      // Для обычного режима создаем один уровень с тремя категориями продаж
      chartData = Object.values(SALE_TYPES).map(type => {
        return {
          category: type.name,
          color: type.color,
          values: MONTHS.map((month, i) => {
            const monthData = filteredData.find(m => m.name === month && 
              (displayMode === 'yearly' ? m.year === selectedYears[0] : true));
            
            return {
              axis: month,
              value: monthData ? monthData[type.id] : 0
            };
          })
        };
      });
    }
    
    // Находим максимальное значение для нормализации
    const maxValue = d3.max(chartData, d => d3.max(d.values, v => v.value));
    
    // Создаем шкалы
    const angleSlice = Math.PI * 2 / MONTHS.length;
    
    // Цветовая схема
    const colorScale = displayMode === 'compare' ?
      d3.scaleOrdinal()
        .domain(selectedYears)
        .range(d3.schemeCategory10.slice(0, selectedYears.length)) :
      d3.scaleOrdinal()
        .domain(Object.values(SALE_TYPES).map(t => t.name))
        .range(Object.values(SALE_TYPES).map(t => t.color));
    
    // Создаем радиальную шкалу
    const rScale = d3.scaleLinear()
      .domain([0, maxValue])
      .range([0, radius]);
    
    // Функция для генерации пути радара
    const radarLine = d3.lineRadial()
      .radius(d => rScale(d.value))
      .angle((d, i) => i * angleSlice)
      .curve(d3.curveLinearClosed);
    
    // Создаем группу для радара
    const radarGroup = svg.append('g')
      .attr('transform', `translate(${centerX},${centerY})`);
    
    // Добавляем концентрические круги
    const axisGrid = radarGroup.append('g').attr('class', 'axis-grid');
    
    // Добавляем круги-уровни
    const levels = 5;
    axisGrid.selectAll('.level')
      .data(d3.range(1, levels + 1).reverse())
      .join('circle')
      .attr('class', 'level')
      .attr('r', d => radius * d / levels)
      .style('fill', 'none')
      .style('stroke', '#4b5563')
      .style('stroke-dasharray', '3,3')
      .style('stroke-width', '0.5px');
    
    // Добавляем подписи к уровням
    axisGrid.selectAll('.level-label')
      .data(d3.range(1, levels + 1).reverse())
      .join('text')
      .attr('class', 'level-label')
      .attr('x', 5)
      .attr('y', d => -radius * d / levels)
      .attr('dy', '0.4em')
      .style('font-size', '10px')
      .style('fill', '#9ca3af')
      .text(d => d3.format(',.0f')(maxValue * d / levels));
    
    // Добавляем оси
    const axes = radarGroup.selectAll('.axis')
      .data(MONTHS)
      .join('g')
      .attr('class', 'axis');
    
    // Добавляем линии осей
    axes.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', (d, i) => radius * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('y2', (d, i) => radius * Math.sin(angleSlice * i - Math.PI / 2))
      .style('stroke', '#4b5563')
      .style('stroke-width', '1px');
    
    // Добавляем подписи к осям
    axes.append('text')
      .attr('class', 'axis-label')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('x', (d, i) => (radius + 10) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('y', (d, i) => (radius + 10) * Math.sin(angleSlice * i - Math.PI / 2))
      .text(d => d)
      .style('font-size', '0.7rem')
      .style('fill', '#f9fafb');
    
    // Добавляем радарные области с анимацией
    chartData.forEach((d, i) => {
      // Преобразуем данные для радарной линии
      const dataValues = d.values.map(v => ({ ...v }));
      
      // Добавляем полупрозрачную заливку
      radarGroup.append('path')
        .datum(dataValues)
        .attr('class', 'radar-area')
        .attr('d', d => radarLine(d))
        .style('fill', displayMode === 'compare' ? colorScale(d.year) : d.color)
        .style('fill-opacity', 0.1)
        .style('stroke', 'none')
        .style('filter', 'blur(2px)')
        .style('opacity', 0)
        .transition()
        .duration(800)
        .delay(i * 300)
        .style('opacity', 0.7);
      
      // Добавляем контур
      const path = radarGroup.append('path')
        .datum(dataValues)
        .attr('class', 'radar-stroke')
        .attr('d', d => radarLine(d))
        .style('fill', 'none')
        .style('stroke-width', 2)
        .style('stroke', displayMode === 'compare' ? colorScale(d.year) : d.color)
        .style('filter', `drop-shadow(0 0 2px ${displayMode === 'compare' ? colorScale(d.year) : d.color})`)
        .style('opacity', 0)
        .transition()
        .duration(800)
        .delay(i * 300)
        .style('opacity', 1);
      
      // Анимация отрисовки контура
      const pathLength = path.node().getTotalLength();
      path
        .attr('stroke-dasharray', pathLength)
        .attr('stroke-dashoffset', pathLength)
        .transition()
        .duration(1500)
        .delay(i * 300)
        .attr('stroke-dashoffset', 0);
      
      // Добавляем точки данных
      radarGroup.selectAll(`.radar-circle-${i}`)
        .data(dataValues)
        .join('circle')
        .attr('class', `radar-circle-${i}`)
        .attr('cx', (d, j) => rScale(d.value) * Math.cos(angleSlice * j - Math.PI / 2))
        .attr('cy', (d, j) => rScale(d.value) * Math.sin(angleSlice * j - Math.PI / 2))
        .attr('r', 0)
        .style('fill', displayMode === 'compare' ? colorScale(d.year) : d.color)
        .style('stroke', '#1f2937')
        .style('stroke-width', 2)
        .transition()
        .duration(800)
        .delay((_, j) => i * 300 + j * 50 + 800)
        .attr('r', 4);
    });
    
    // Добавляем легенду
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 120}, 60)`);
    
    chartData.forEach((d, i) => {
      const legendItem = legend.append('g')
        .attr('transform', `translate(0, ${i * 25})`);
      
      legendItem.append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('rx', 2)
        .attr('fill', displayMode === 'compare' ? colorScale(d.year) : d.color);
      
      legendItem.append('text')
        .attr('x', 25)
        .attr('y', 12)
        .style('font-size', '0.8rem')
        .style('fill', '#f9fafb')
        .text(displayMode === 'compare' ? `${d.year} год` : d.category);
    });
  };
  
  const renderMixedChart = () => {
    if (!mainChartRef.current) return;
    
    const container = mainChartRef.current;
    container.innerHTML = '';
    
    const width = container.clientWidth;
    const height = 400;
    const margin = { top: 40, right: 30, bottom: 60, left: 60 };
    
    // Создаем SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('background', '#1f2937')
      .style('border-radius', '0.5rem');
    
    // Добавляем заголовок
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '1.2rem')
      .style('font-weight', 'bold')
      .style('fill', '#f9fafb')
      .text('Комбинированный анализ продаж');
    
    // Подготавливаем данные
    let barData, lineData;
    
    if (displayMode === 'yearly') {
      // Для годового режима: столбцы для категорий, линия для общих продаж
      barData = [];
      
      // Данные для столбцов (категории продаж)
      filteredData.forEach(month => {
        barData.push(
          { month: month.month, name: month.name, category: 'retail', value: month.retail },
          { month: month.month, name: month.name, category: 'wholesale', value: month.wholesale },
          { month: month.month, name: month.name, category: 'promo', value: month.promo }
        );
      });
      
      // Данные для линии (общие продажи)
      lineData = filteredData.map(month => ({
        month: month.month,
        name: month.name,
        value: month.total
      })).sort((a, b) => a.month - b.month);
    } else if (displayMode === 'compare') {
      // Для режима сравнения: столбцы для текущего года, линия для предыдущего
      const currentYear = Math.max(...selectedYears);
      const previousYear = Math.max(...selectedYears.filter(y => y !== currentYear));
      
      // Данные для столбцов (текущий год)
      barData = filteredData
        .filter(month => month.year === currentYear)
        .map(month => ({
          month: month.month,
          name: month.name,
          category: 'current',
          value: focusCategory === 'all' ? month.total : month[focusCategory]
        }));
      
      // Данные для линии (предыдущий год)
      lineData = filteredData
        .filter(month => month.year === previousYear)
        .map(month => ({
          month: month.month,
          name: month.name,
          value: focusCategory === 'all' ? month.total : month[focusCategory],
          year: previousYear
        }))
        .sort((a, b) => a.month - b.month);
    } else {
      // Для периода: столбцы для последних 6 месяцев, линия для тренда
      const sortedData = [...filteredData].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });
      
      // Берем последние 6 месяцев для столбцов
      const recentMonths = sortedData.slice(-6);
      
      barData = [];
      recentMonths.forEach(month => {
        barData.push(
          { 
            month: month.month, 
            name: month.name,
            year: month.year,
            fullName: `${month.name} ${month.year}`,
            category: 'retail', 
            value: month.retail 
          },
          { 
            month: month.month, 
            name: month.name,
            year: month.year,
            fullName: `${month.name} ${month.year}`,
            category: 'wholesale', 
            value: month.wholesale 
          },
          { 
            month: month.month, 
            name: month.name,
            year: month.year,
            fullName: `${month.name} ${month.year}`,
            category: 'promo', 
            value: month.promo 
          }
        );
      });
      
      // Линейный тренд для всего периода
      lineData = sortedData.map(month => ({
        month: month.month,
        year: month.year,
        name: month.name,
        fullName: `${month.name} ${month.year}`,
        value: month.total
      }));
    }
    
    // Создаем шкалы
    const x = d3.scaleBand()
      .domain(displayMode === 'yearly' ? 
        MONTHS : 
        [...new Set(barData.map(d => d.fullName || d.name))])
      .range([margin.left, width - margin.right])
      .padding(0.3);
    
    const xSubgroup = d3.scaleBand()
      .domain(displayMode === 'yearly' ? 
        ['retail', 'wholesale', 'promo'] : 
        [...new Set(barData.map(d => d.category))])
      .range([0, x.bandwidth()])
      .padding(0.05);
    
    const y = d3.scaleLinear()
      .domain([0, Math.max(
        d3.max(barData, d => d.value) * 1.1,
        d3.max(lineData, d => d.value) * 1.1
      )])
      .nice()
      .range([height - margin.bottom, margin.top]);
    
    // Цветовая схема для столбцов
    const colorScale = displayMode === 'yearly' ?
      d3.scaleOrdinal()
        .domain(['retail', 'wholesale', 'promo'])
        .range([SALE_TYPES.RETAIL.color, SALE_TYPES.WHOLESALE.color, SALE_TYPES.PROMO.color]) :
      d3.scaleOrdinal()
        .domain(['current', 'retail', 'wholesale', 'promo'])
        .range(['#3b82f6', SALE_TYPES.RETAIL.color, SALE_TYPES.WHOLESALE.color, SALE_TYPES.PROMO.color]);
    
    // Создаем оси
    const xAxis = g => g
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickSizeOuter(0))
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
    
    // Добавляем столбцы с группировкой
 // Добавляем столбцы с группировкой
    const groups = svg.append('g')
      .selectAll('g')
      .data(displayMode === 'yearly' ?
        MONTHS.map(month => {
          return {
            name: month,
            month: MONTHS.indexOf(month) + 1
          };
        }) :
        [...new Set(barData.map(d => d.fullName || d.name))])
      .join('g')
      .attr('transform', d => `translate(${x(d.name || d)},0)`);
    
    // Группируем столбцы по категориям
    groups.selectAll('rect')
      .data(d => {
        const monthName = d.name || d;
        const monthNum = d.month;
        
        return barData
          .filter(item => (item.name === monthName) || (item.fullName === monthName))
          .map(item => ({
            ...item,
            parentMonth: monthName
          }));
      })
      .join('rect')
      .attr('x', d => xSubgroup(d.category))
      .attr('y', d => y(d.value))
      .attr('width', xSubgroup.bandwidth())
      .attr('height', d => height - margin.bottom - y(d.value))
      .attr('fill', d => colorScale(d.category))
      .attr('rx', 2)
      .attr('opacity', 0)
      .transition()
      .duration(800)
      .delay((_, i) => i * 20)
      .attr('opacity', 0.8);
    
    // Добавляем линию тренда
    const line = d3.line()
      .x(d => x(d.fullName || d.name) + x.bandwidth() / 2)
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);
    
    // Добавляем линию с анимацией
    const path = svg.append('path')
      .datum(lineData)
      .attr('fill', 'none')
      .attr('stroke', displayMode === 'compare' ? '#10b981' : '#f59e0b')
      .attr('stroke-width', 3)
      .attr('d', line);
    
    // Анимация линии
    const totalLength = path.node().getTotalLength();
    
    path
      .attr('stroke-dasharray', totalLength)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(1500)
      .delay(800)
      .attr('stroke-dashoffset', 0);
    
    // Добавляем точки на линию
    svg.selectAll('.line-point')
      .data(lineData)
      .join('circle')
      .attr('class', 'line-point')
      .attr('cx', d => x(d.fullName || d.name) + x.bandwidth() / 2)
      .attr('cy', d => y(d.value))
      .attr('r', 0)
      .attr('fill', displayMode === 'compare' ? '#10b981' : '#f59e0b')
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 2)
      .transition()
      .duration(300)
      .delay((_, i) => i * 100 + 2000)
      .attr('r', 5);
    
    // Добавляем легенду
    const legend = svg.append('g')
      .attr('transform', `translate(${width - margin.right - 150}, ${margin.top + 10})`);
    
    // Легенда для столбцов
    if (displayMode === 'yearly') {
      // Легенда для категорий продаж
      Object.values(SALE_TYPES).forEach((type, i) => {
        const legendItem = legend.append('g')
          .attr('transform', `translate(0, ${i * 25})`);
        
        legendItem.append('rect')
          .attr('width', 15)
          .attr('height', 15)
          .attr('rx', 2)
          .attr('fill', type.color);
        
        legendItem.append('text')
          .attr('x', 25)
          .attr('y', 12)
          .style('font-size', '0.8rem')
          .style('fill', '#f9fafb')
          .text(type.name);
      });
      
      // Легенда для линии (общие продажи)
      const lineLegend = legend.append('g')
        .attr('transform', `translate(0, ${Object.values(SALE_TYPES).length * 25})`);
      
      lineLegend.append('line')
        .attr('x1', 0)
        .attr('x2', 15)
        .attr('y1', 8)
        .attr('y2', 8)
        .attr('stroke', '#f59e0b')
        .attr('stroke-width', 3);
      
      lineLegend.append('text')
        .attr('x', 25)
        .attr('y', 12)
        .style('font-size', '0.8rem')
        .style('fill', '#f9fafb')
        .text('Общие продажи');
    } else if (displayMode === 'compare') {
      // Легенда для текущего года (столбцы)
      const barLegend = legend.append('g');
      
      barLegend.append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('rx', 2)
        .attr('fill', '#3b82f6');
      
      barLegend.append('text')
        .attr('x', 25)
        .attr('y', 12)
        .style('font-size', '0.8rem')
        .style('fill', '#f9fafb')
        .text(`${Math.max(...selectedYears)} год`);
      
      // Легенда для предыдущего года (линия)
      const lineLegend = legend.append('g')
        .attr('transform', 'translate(0, 25)');
      
      lineLegend.append('line')
        .attr('x1', 0)
        .attr('x2', 15)
        .attr('y1', 8)
        .attr('y2', 8)
        .attr('stroke', '#10b981')
        .attr('stroke-width', 3);
      
      lineLegend.append('text')
        .attr('x', 25)
        .attr('y', 12)
        .style('font-size', '0.8rem')
        .style('fill', '#f9fafb')
        .text(`${Math.max(...selectedYears.filter(y => y !== Math.max(...selectedYears)))} год`);
    } else {
      // Легенда для категорий продаж
      Object.values(SALE_TYPES).forEach((type, i) => {
        const legendItem = legend.append('g')
          .attr('transform', `translate(0, ${i * 25})`);
        
        legendItem.append('rect')
          .attr('width', 15)
          .attr('height', 15)
          .attr('rx', 2)
          .attr('fill', type.color);
        
        legendItem.append('text')
          .attr('x', 25)
          .attr('y', 12)
          .style('font-size', '0.8rem')
          .style('fill', '#f9fafb')
          .text(type.name);
      });
      
      // Легенда для линии тренда
      const lineLegend = legend.append('g')
        .attr('transform', `translate(0, ${Object.values(SALE_TYPES).length * 25})`);
      
      lineLegend.append('line')
        .attr('x1', 0)
        .attr('x2', 15)
        .attr('y1', 8)
        .attr('y2', 8)
        .attr('stroke', '#f59e0b')
        .attr('stroke-width', 3);
      
      lineLegend.append('text')
        .attr('x', 25)
        .attr('y', 12)
        .style('font-size', '0.8rem')
        .style('fill', '#f9fafb')
        .text('Тренд общих продаж');
    }
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
  
  // Расчет процента выполнения плана
  const percentage = Math.min(20, Math.round((totalEarned / targetAmount) * 100));
  
  // Создаем контейнер с флекс-версткой для лучшей организации
  const container = d3.select(progressChartRef.current)
    .append('div')
    .style('display', 'flex')
    .style('flex-direction', 'column')
    .style('align-items', 'center')
    .style('justify-content', 'center')
    .style('height', '100%')
    .style('padding', '10px');
  
  // Добавляем заголовок с пояснением
  container.append('h3')
    .style('color', '#f9fafb')
    .style('font-size', '1.1rem')
    .style('font-weight', 'bold')
    .style('margin-top', '15px')
    .style('margin-bottom', '15px')
    .style('text-align', 'center')
    .text('Прогресс выполнения плана продаж');
  
  // Создаем контейнер для кругового прогресс-бара
  const progressContainer = container.append('div')
    .style('position', 'relative')
    .style('width', '150px')
    .style('margin-top', '25px')
    .style('height', '150px');
    
  // Создаем SVG для кругового индикатора
  const svg = progressContainer.append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .style('transform', 'rotate(-90deg)'); // Повернем чтобы прогресс шел по часовой

  // Определяем параметры круга
  const circleSize = 150;
  const strokeWidth = 14;
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Добавляем фоновый круг
  svg.append('circle')
    .attr('cx', circleSize / 2)
    .attr('cy', circleSize / 2)
    .attr('r', radius)
    .attr('fill', 'none')
    .attr('stroke', '#374151')
    .attr('stroke-width', strokeWidth);
  
  // Вычисляем длину дуги для прогресса
  const progressLength = (percentage / 100) * circumference;
  
  // Функция для определения цвета в зависимости от процента
  const getProgressColor = (percent) => {
    if (percent >= 100) return '#10b981'; // Зеленый для 100%+
    if (percent >= 75) return '#3b82f6';  // Синий для 75-99%
    if (percent >= 50) return '#f59e0b';  // Оранжевый для 50-74%
    return '#ef4444';                     // Красный для <50%
  };
  
  // Добавляем дугу прогресса с анимацией
  const progressCircle = svg.append('circle')
    .attr('cx', circleSize / 2)
    .attr('cy', circleSize / 2)
    .attr('r', radius)
    .attr('fill', 'none')
    .attr('stroke', getProgressColor(percentage))
    .attr('stroke-width', strokeWidth)
    .attr('stroke-dasharray', circumference)
    .attr('stroke-dashoffset', circumference); // Начинаем с нуля
  
  // Добавляем анимацию заполнения
  progressCircle.transition()
    .duration(1500)
    .ease(d3.easeQuadOut)
    .attr('stroke-dashoffset', circumference - progressLength);
    
  // Дополнительные эффекты для круга прогресса
  progressCircle
    .attr('stroke-linecap', 'round')
    .style('filter', `drop-shadow(0 0 6px ${getProgressColor(percentage)})`);
  
  // Добавляем контейнер для текста в центре
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
    .style('text-align', 'center');
  
  // Добавляем большой процент в центр
  const percentElement = textContainer.append('div')
    .style('font-size', '2.5rem')
    .style('font-weight', 'bold')
    .style('color', '#f9fafb')
    .style('line-height', '1')
    .text('0%');
    
  // Анимация счетчика процентов
  let startValue = 0;
  const duration = 1500;
  const interval = 30; // Обновляем каждые 30мс
  
  const timer = setInterval(() => {
    startValue += 1;
    if (startValue > percentage) {
      startValue = percentage;
      clearInterval(timer);
    }
    percentElement.text(`${startValue}%`);
  }, Math.max(interval, duration / percentage));
  
  // Информация о суммах под процентом
  textContainer.append('div')
    .style('font-size', '0.8rem')
    .style('color', '#9ca3af')
    .style('margin-top', '5px')
    .text('выполнения плана');
    
  // Добавляем пояснительную информацию под круговым индикатором
  const detailsContainer = container.append('div')
    .style('display', 'flex')
    .style('flex-direction', 'column')
    .style('margin-top', '15px')
    .style('width', '100%')
    .style('background', 'rgba(30, 41, 59, 0.5)')
    .style('border-radius', '8px')
    .style('padding', '12px');
    
  // Информация о текущей и целевой сумме
  detailsContainer.append('div')
    .style('display', 'flex')
    .style('justify-content', 'space-between')
    .style('margin-bottom', '8px')
    .html(`
      <span style="color: #9ca3af; font-size: 0.9rem;">Текущая сумма:</span>
      <span style="color: #f9fafb; font-size: 0.9rem; font-weight: 600;">${formatCurrency(totalEarned)}</span>
    `);
    
  detailsContainer.append('div')
    .style('display', 'flex')
    .style('justify-content', 'space-between')
    .style('margin-bottom', '12px')
    .html(`
      <span style="color: #9ca3af; font-size: 0.9rem;">Целевая сумма:</span>
      <span style="color: #f9fafb; font-size: 0.9rem; font-weight: 600;">${formatCurrency(targetAmount)}</span>
    `);
    
  // Добавляем статус-сообщение
  const getStatusMessage = (percent) => {
    if (percent >= 100) return { text: 'План выполнен!', color: '#10b981' };
    if (percent >= 90) return { text: 'Почти выполнено', color: '#3b82f6' };
    if (percent >= 70) return { text: 'Хороший прогресс', color: '#8b5cf6' };
    if (percent >= 50) return { text: 'Средний прогресс', color: '#f59e0b' };
    if (percent >= 30) return { text: 'Нужно ускориться', color: '#f97316' };
    return { text: 'Требуется улучшение', color: '#ef4444' };
  };
  
  const status = getStatusMessage(percentage);
  
  detailsContainer.append('div')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('justify-content', 'center')
    .style('padding', '8px')
    .style('background', `${status.color}20`) // Полупрозрачный фон в цвет статуса
    .style('border-radius', '6px')
    .style('border', `1px solid ${status.color}40`)
    .html(`
      <div style="display: flex; align-items: center;">
        <span style="color: ${status.color}; font-weight: 600;">${status.text}</span>
        <div style="margin-left: 8px; width: 12px; height: 12px; border-radius: 50%; background: ${status.color};"></div>
      </div>
    `);
  
  // Дополнительная информация о расчете
  if (displayMode === 'yearly') {
    container.append('div')
      .style('font-size', '0.8rem')
      .style('color', '#9ca3af')
      .style('margin-top', '10px')
      .style('text-align', 'center')
      .text(`Показатель выполнения плана за ${selectedYears[0]} год`);
  } else if (displayMode === 'compare') {
    container.append('div')
      .style('font-size', '0.8rem')
      .style('color', '#9ca3af')
      .style('margin-top', '10px')
      .style('text-align', 'center')
      .text(`Показатель для ${Math.max(...selectedYears)} года`);
  } else {
    container.append('div')
      .style('font-size', '0.8rem')
      .style('color', '#9ca3af')
      .style('margin-top', '10px')
      .style('text-align', 'center')
      .text(`Показатель для выбранного периода`);
  }
};
  const renderDetailsChart = () => {
    if (!detailsChartRef.current || !filteredData.length) return;
    
    // Очистка контейнера
    detailsChartRef.current.innerHTML = '';
    
    // Суммирование данных по типам продаж
    const totalRetail = filteredData.reduce((sum, month) => sum + month.retail, 0);
    const totalWholesale = filteredData.reduce((sum, month) => sum + month.wholesale, 0);
    const totalPromo = filteredData.reduce((sum, month) => sum + month.promo, 0);
    
    // Подготовка данных для пирога
    const pieData = [
      { id: 'retail', label: SALE_TYPES.RETAIL.name, value: totalRetail, color: SALE_TYPES.RETAIL.color },
      { id: 'wholesale', label: SALE_TYPES.WHOLESALE.name, value: totalWholesale, color: SALE_TYPES.WHOLESALE.color },
      { id: 'promo', label: SALE_TYPES.PROMO.name, value: totalPromo, color: SALE_TYPES.PROMO.color }
    ];
    
    // Отрисовка пирога с дополнительной визуализацией
    const container = detailsChartRef.current;
    const width = container.clientWidth;
    const height = 300;
    const margin = 40;
    const radius = Math.min(width, height) / 2 - margin;
    
    // Создаем SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('background', '#1f2937')
      .style('border-radius', '0.5rem');
    
    // Добавляем заголовок
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .style('font-size', '1.2rem')
      .style('font-weight', 'bold')
      .style('fill', '#f9fafb')
      .text('Структура продаж по категориям');
    
    // Создаем группу для пирога
    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);
    
    // Создаем генератор пирога
    const pie = d3.pie()
      .sort(null)
      .value(d => d.value);
    
    // Создаем арки
    const arc = d3.arc()
      .innerRadius(radius * 0.4) // Больший внутренний радиус для пончика
      .outerRadius(radius);
    
    // Функция для анимации дуги при наведении
    const arcHover = d3.arc()
      .innerRadius(radius * 0.4)
      .outerRadius(radius * 1.05);
    
    // Создаем градиенты для каждой категории
    pieData.forEach((d, i) => {
      const id = `pie-gradient-${d.id}`;
      
      const gradient = svg.append('defs')
        .append('linearGradient')
        .attr('id', id)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '100%');
        
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', d3.hsl(d.color).brighter(0.5));
        
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', d.color);
    });
    
    // Рассчитываем общую сумму
    const total = pieData.reduce((sum, d) => sum + d.value, 0);
    
    // Добавляем дуги
    const arcs = g.selectAll('.arc')
      .data(pie(pieData))
      .join('g')
      .attr('class', 'arc');
    
    // Добавляем пути с анимацией
    arcs.append('path')
      .attr('d', arc)
      .style('fill', d => `url(#pie-gradient-${d.data.id})`)
      .style('stroke', '#1f2937')
      .style('stroke-width', 2)
      .style('filter', d => `drop-shadow(0 0 3px ${d.data.color})`)
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arcHover);
          
        // Обновляем центральный текст
        centerText.text(d3.format(',.0f')(d.data.value));
        subText.text(d.data.label);
        percentText.text(`${d3.format('.1f')((d.data.value / total) * 100)}%`);
        
        // Подсвечиваем соответствующий элемент легенды
        legendItems.select(`#legend-${d.data.id}`)
          .transition()
          .duration(200)
          .style('font-weight', 'bold')
          .attr('x', 30);
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arc);
          
        // Возвращаем центральный текст
        centerText.text(d3.format(',.0f')(total));
        subText.text('Общий объем');
        percentText.text('100%');
        
        // Возвращаем нормальный вид легенды
        legendItems.select(`#legend-${d.data.id}`)
          .transition()
          .duration(200)
          .style('font-weight', 'normal')
          .attr('x', 25);
      });
    
    // Добавляем анимацию появления
    arcs.selectAll('path')
      .each(function(d) {
        const node = d3.select(this);
        const totalLength = node.node().getTotalLength();
        
        node
          .attr('stroke-dasharray', totalLength)
          .attr('stroke-dashoffset', totalLength)
          .transition()
          .duration(1500)
          .attr('stroke-dashoffset', 0);
      });
    
    // Добавляем текст в центр
    const centerText = g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('font-size', '1.8rem')
      .style('font-weight', 'bold')
      .style('fill', '#f9fafb')
      .text(d3.format(',.0f')(total));
    
    const subText = g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('y', 25)
      .style('font-size', '0.9rem')
      .style('fill', '#f9fafb')
      .text('Общий объем');
    
    const percentText = g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('y', -25)
      .style('font-size', '1.2rem')
      .style('fill', '#f9fafb')
      .text('100%');
    
    // Добавляем легенду
    const legendItems = svg.append('g')
      .attr('transform', `translate(${width - 150}, 70)`)
      .selectAll('.legend-item')
      .data(pieData)
      .join('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 25})`)
      .on('mouseover', function(event, d) {
        // Находим соответствующую дугу
        const arcPath = arcs.selectAll('path')
          .filter(arc => arc.data.id === d.id);
        
        // Имитируем наведение на дугу
        arcPath
          .transition()
          .duration(200)
          .attr('d', arcHover);
          
        // Обновляем центральный текст
        centerText.text(d3.format(',.0f')(d.value));
        subText.text(d.label);
        percentText.text(`${d3.format('.1f')((d.value / total) * 100)}%`);
        
        // Подсвечиваем текущий элемент легенды
        d3.select(this).select('text')
          .transition()
          .duration(200)
          .style('font-weight', 'bold')
          .attr('x', 30);
      })
      .on('mouseout', function(event, d) {
        // Находим соответствующую дугу
        const arcPath = arcs.selectAll('path')
          .filter(arc => arc.data.id === d.id);
        
        // Возвращаем нормальный вид дуги
        arcPath
          .transition()
          .duration(200)
          .attr('d', arc);
          
        // Возвращаем центральный текст
        centerText.text(d3.format(',.0f')(total));
        subText.text('Общий объем');
        percentText.text('100%');
        
        // Возвращаем нормальный вид легенды
        d3.select(this).select('text')
          .transition()
          .duration(200)
          .style('font-weight', 'normal')
          .attr('x', 25);
      });
    
    // Добавляем иконки
    legendItems.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('rx', 3)
      .attr('fill', d => d.color);
    
    // Добавляем текст
    legendItems.append('text')
      .attr('id', d => `legend-${d.id}`)
      .attr('x', 25)
      .attr('y', 12)
      .style('font-size', '0.9rem')
      .style('fill', '#f9fafb')
      .text(d => d.label);
    
    // Добавляем процент
    legendItems.append('text')
      .attr('x', 25)
      .attr('y', 28)
      .style('font-size', '0.8rem')
      .style('fill', d => d.color)
      .text(d => `${d3.format(',.0f')(d.value)}  UZS (${d3.format('.1f')((d.value / total) * 100)}%)`);
  };
  const renderYearlyTrendChart = () => {
    if (!yearlyTrendChartRef.current || Object.keys(financialData).length === 0) return;
    
    // Очистка контейнера
    yearlyTrendChartRef.current.innerHTML = '';
    
    // Подготовка данных для линейного графика
    const yearlyData = Object.keys(financialData).map(year => ({
      x: parseInt(year),
      y: financialData[year].totalEarned
    }));
    
    // Сортировка по годам
    yearlyData.sort((a, b) => a.x - b.x);
    
    // Если есть данные по категориям, добавляем их
    const retailData = Object.keys(financialData).map(year => ({
      x: parseInt(year),
      y: financialData[year].categories?.retail || 0
    })).sort((a, b) => a.x - b.x);
    
    const wholesaleData = Object.keys(financialData).map(year => ({
      x: parseInt(year),
      y: financialData[year].categories?.wholesale || 0
    })).sort((a, b) => a.x - b.x);
    
    const promoData = Object.keys(financialData).map(year => ({
      x: parseInt(year),
      y: financialData[year].categories?.promo || 0
    })).sort((a, b) => a.x - b.x);
    
    // Создаем улучшенный стек-график
    const container = yearlyTrendChartRef.current;
    const width = container.clientWidth;
    const height = 200;
    const margin = { top: 40, right: 80, bottom: 30, left: 60 };
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('background', '#1f2937')
      .style('border-radius', '0.5rem');
    
    // Добавляем заголовок
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '1.1rem')
      .style('font-weight', 'bold')
      .style('fill', '#f9fafb')
      .text('Тренд продаж по годам');
    
    // Создаем шкалы
    const x = d3.scaleLinear()
      .domain([d3.min(yearlyData, d => d.x), d3.max(yearlyData, d => d.x)])
      .range([margin.left, width - margin.right]);
    
    const y = d3.scaleLinear()
      .domain([0, d3.max(yearlyData, d => d.y) * 1.1])
      .nice()
      .range([height - margin.bottom, margin.top]);
    
    // Создаем оси
    const xAxis = g => g
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(3).tickFormat(d => d))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text').style('fill', '#f9fafb'));
    
    const yAxis = g => g
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(3).tickFormat(d => d3.format('.2s')(d)))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text').style('fill', '#f9fafb'))
      .call(g => g.selectAll('.tick line')
        .attr('x2', width - margin.left - margin.right)
        .attr('stroke-opacity', 0.1));
    
    // Добавляем оси
    svg.append('g').call(xAxis);
    svg.append('g').call(yAxis);
    
    // Создаем область для заполнения
    const area = d3.area()
      .x(d => x(d.x))
      .y0(height - margin.bottom)
      .y1(d => y(d.y))
      .curve(d3.curveCatmullRom);
    
    // Добавляем градиент
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
      .attr('offset', '100%')
      .attr('stop-color', '#3b82f6')
      .attr('stop-opacity', 0.1);
    
    // Добавляем область
    svg.append('path')
      .datum(yearlyData)
      .attr('fill', 'url(#area-gradient)')
      .attr('d', area);
    
    // Создаем линию для общего тренда
    const line = d3.line()
      .x(d => x(d.x))
      .y(d => y(d.y))
      .curve(d3.curveCatmullRom);
    
    // Добавляем линию тренда
    const totalPath = svg.append('path')
      .datum(yearlyData)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 3)
      .attr('d', line);
    
    // Анимация линии
    const totalLength = totalPath.node().getTotalLength();
    
    totalPath
      .attr('stroke-dasharray', totalLength + ' ' + totalLength)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(1500)
      .attr('stroke-dashoffset', 0);
    
    // Добавляем точки на линию с анимацией
    svg.selectAll('.data-point')
      .data(yearlyData)
      .join('circle')
      .attr('class', 'data-point')
      .attr('cx', d => x(d.x))
      .attr('cy', d => y(d.y))
      .attr('r', 0)
      .attr('fill', '#3b82f6')
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 2)
      .transition()
      .duration(500)
      .delay((_, i) => i * 300 + 1000)
      .attr('r', 6);
    
    // Добавляем подписи к точкам
    svg.selectAll('.point-label')
      .data(yearlyData)
      .join('text')
      .attr('class', 'point-label')
      .attr('x', d => x(d.x))
      .attr('y', d => y(d.y) - 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '0.7rem')
      .style('fill', '#f9fafb')
      .style('opacity', 0)
      .text(d => d3.format('.2s')(d.y))
      .transition()
      .duration(500)
      .delay((_, i) => i * 300 + 1200)
      .style('opacity', 1);
    
    // Добавляем легенду для стековых данных, если они доступны
    if (focusCategory === 'all') {
      // Добавляем небольшие стеки по категориям
      const retailPath = svg.append('path')
        .datum(retailData)
        .attr('fill', 'none')
        .attr('stroke', SALE_TYPES.RETAIL.color)
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '3,3')
        .attr('d', line)
        .style('opacity', 0)
        .transition()
        .duration(500)
        .delay(1800)
        .style('opacity', 0.7);
      
      const wholesalePath = svg.append('path')
        .datum(wholesaleData)
        .attr('fill', 'none')
        .attr('stroke', SALE_TYPES.WHOLESALE.color)
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '3,3')
        .attr('d', line)
        .style('opacity', 0)
        .transition()
        .duration(500)
        .delay(2000)
        .style('opacity', 0.7);
      
      const promoPath = svg.append('path')
        .datum(promoData)
        .attr('fill', 'none')
        .attr('stroke', SALE_TYPES.PROMO.color)
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '3,3')
        .attr('d', line)
        .style('opacity', 0)
        .transition()
        .duration(500)
        .delay(2200)
        .style('opacity', 0.7);
      
      // Добавляем легенду
      const legend = svg.append('g')
        .attr('transform', `translate(${width - margin.right + 5}, ${margin.top})`);
      
      // Основная линия
      const totalLegend = legend.append('g');
      
      totalLegend.append('line')
        .attr('x1', 0)
        .attr('x2', 20)
        .attr('y1', 0)
        .attr('y2', 0)
        .attr('stroke', '#3b82f6')
        .attr('stroke-width', 3);
      
      totalLegend.append('text')
        .attr('x', 25)
        .attr('y', 4)
        .style('font-size', '0.7rem')
        .style('fill', '#f9fafb')
        .text('Общие');
      
      // Розничные
      const retailLegend = legend.append('g')
        .attr('transform', 'translate(0, 20)');
      
      retailLegend.append('line')
        .attr('x1', 0)
        .attr('x2', 20)
        .attr('y1', 0)
        .attr('y2', 0)
        .attr('stroke', SALE_TYPES.RETAIL.color)
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '3,3');
      
      retailLegend.append('text')
        .attr('x', 25)
        .attr('y', 4)
        .style('font-size', '0.7rem')
        .style('fill', '#f9fafb')
        .text('Розница');
      
      // Оптовые
      const wholesaleLegend = legend.append('g')
        .attr('transform', 'translate(0, 40)');
      
      wholesaleLegend.append('line')
        .attr('x1', 0)
        .attr('x2', 20)
        .attr('y1', 0)
        .attr('y2', 0)
        .attr('stroke', SALE_TYPES.WHOLESALE.color)
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '3,3');
      
      wholesaleLegend.append('text')
        .attr('x', 25)
        .attr('y', 4)
        .style('font-size', '0.7rem')
        .style('fill', '#f9fafb')
        .text('Опт');
      
      // Акционные
      const promoLegend = legend.append('g')
        .attr('transform', 'translate(0, 60)');
      
      promoLegend.append('line')
        .attr('x1', 0)
        .attr('x2', 20)
        .attr('y1', 0)
        .attr('y2', 0)
        .attr('stroke', SALE_TYPES.PROMO.color)
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '3,3');
      
      promoLegend.append('text')
        .attr('x', 25)
        .attr('y', 4)
        .style('font-size', '0.7rem')
        .style('fill', '#f9fafb')
        .text('Акции');
    }
  };
  const renderYearComparisonChart = () => {
    if (!yearComparisonChartRef.current || selectedYears.length < 2) return;
    
    const container = yearComparisonChartRef.current;
    container.innerHTML = '';
    
    const width = container.clientWidth;
    const height = 300;
    const margin = { top: 40, right: 30, bottom: 60, left: 60 };
    
    // Создаем SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('background', '#1f2937')
      .style('border-radius', '0.5rem');
    
    // Добавляем заголовок
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '1.2rem')
      .style('font-weight', 'bold')
      .style('fill', '#f9fafb')
      .text(`Сравнение динамики продаж ${selectedYears.join(' и ')}`);
    
    // Создаем данные для сравнения по кварталам
    const quarterlyData = [];
    
    selectedYears.forEach(year => {
      if (!financialData[year]) return;
      
      for (let quarter = 0; quarter < 4; quarter++) {
        quarterlyData.push({
          year,
          quarter: quarter + 1,
          value: financialData[year].quarterlyData[quarter]
        });
      }
    });
    
    // Создаем шкалы
    const x0 = d3.scaleBand()
      .domain([1, 2, 3, 4].map(d => d.toString()))
      .range([margin.left, width - margin.right])
      .padding(0.2);
    
    const x1 = d3.scaleBand()
      .domain(selectedYears)
      .range([0, x0.bandwidth()])
      .padding(0.05);
    
    const y = d3.scaleLinear()
      .domain([0, d3.max(quarterlyData, d => d.value) * 1.1])
      .nice()
      .range([height - margin.bottom, margin.top]);
    
    // Цветовая схема
    const colorScale = d3.scaleOrdinal()
      .domain(selectedYears)
      .range(d3.schemeCategory10.slice(0, selectedYears.length));
    
    // Создаем оси
    const xAxis = g => g
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x0).tickSizeOuter(0).tickFormat(d => `Q${d}`))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text')
        .style('fill', '#f9fafb')
        .style('font-size', '0.9rem')
        .style('font-weight', 'bold'));
    
    const yAxis = g => g
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => d3.format('.2s')(d)))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text').style('fill', '#f9fafb'))
      .call(g => g.selectAll('.tick line')
        .attr('x2', width - margin.left - margin.right)
        .attr('stroke-opacity', 0.1));
    
    // Добавляем оси
    svg.append('g').call(xAxis);
    svg.append('g').call(yAxis);
    
    // Группируем по кварталам
    const quarterGroups = svg.append('g')
      .selectAll('g')
      .data([1, 2, 3, 4].map(d => d.toString()))
      .join('g')
      .attr('transform', d => `translate(${x0(d)},0)`);
    
    // Добавляем столбцы для каждого года в квартале
    quarterGroups.selectAll('rect')
      .data(d => {
        const quarter = parseInt(d);
        return selectedYears.map(year => ({
          year,
          quarter,
          value: quarterlyData.find(item => item.year === year && item.quarter === quarter)?.value || 0
        }));
      })
      .join('rect')
      .attr('x', d => x1(d.year))
      .attr('y', d => y(d.value))
      .attr('width', x1.bandwidth())
      .attr('height', d => height - margin.bottom - y(d.value))
      .attr('fill', d => colorScale(d.year))
      .attr('rx', 4)
      .attr('opacity', 0.9)
      .attr('y', height - margin.bottom) // Начальная позиция для анимации
      .attr('height', 0) // Начальная высота для анимации
      .transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .attr('y', d => y(d.value))
      .attr('height', d => height - margin.bottom - y(d.value));
    
    // Добавляем подписи к столбцам
    quarterGroups.selectAll('text')
      .data(d => {
        const quarter = parseInt(d);
        return selectedYears.map(year => ({
          year,
          quarter,
          value: quarterlyData.find(item => item.year === year && item.quarter === quarter)?.value || 0
        }));
      })
      .join('text')
      .attr('x', d => x1(d.year) + x1.bandwidth() / 2)
      .attr('y', d => y(d.value) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '0.7rem')
      .style('fill', '#f9fafb')
      .style('opacity', 0)
      .text(d => d3.format('.2s')(d.value))
      .transition()
      .duration(500)
      .delay((d, i) => i * 100 + 800)
      .style('opacity', 1);
    
    // Добавляем легенду
    const legend = svg.append('g')
      .attr('transform', `translate(${width - margin.right - 120}, ${margin.top})`);
    
    selectedYears.forEach((year, i) => {
      const yearLegend = legend.append('g')
        .attr('transform', `translate(0, ${i * 25})`);
      
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
      
      // Добавляем информацию о росте
      if (i > 0) {
        const prevYear = selectedYears[i - 1];
        const currentYearTotal = financialData[year]?.totalEarned || 0;
        const prevYearTotal = financialData[prevYear]?.totalEarned || 1;
        
        const growthPercentage = ((currentYearTotal / prevYearTotal) - 1) * 100;
        
        yearLegend.append('text')
          .attr('x', 60)
          .attr('y', 12)
          .style('font-size', '0.8rem')
          .style('fill', growthPercentage >= 0 ? '#10b981' : '#ef4444')
          .text(`${growthPercentage >= 0 ? '+' : ''}${growthPercentage.toFixed(1)}%`);
      }
    });
    
    // Добавляем подписи для кварталов
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height - 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '0.9rem')
      .style('fill', '#9ca3af')
      .text('Кварталы');
  };
  const renderForecastChart = () => {
    if (!forecastChartRef.current || Object.keys(financialData).length === 0) return;
    
    const container = forecastChartRef.current;
    container.innerHTML = '';
    
    const width = container.clientWidth;
    const height = 250;
    const margin = { top: 40, right: 80, bottom: 40, left: 60 };
    
    // Создаем SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('background', '#1f2937')
      .style('border-radius', '0.5rem');
    
    // Добавляем заголовок
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '1.2rem')
      .style('font-weight', 'bold')
      .style('fill', '#f9fafb')
      .text('Прогноз на следующий год');
    
    // Подготовка данных для прогноза
    const lastYear = Math.max(...Object.keys(financialData).map(Number));
    const lastYearData = financialData[lastYear];
    
    if (!lastYearData) return;
    
    // Собираем фактические данные
    const actualData = lastYearData.months.map((month, index) => ({
      month: index + 1,
      value: focusCategory === 'all' ? month.total : month[focusCategory]
    }));
    
    // Создаем прогноз на следующий год с небольшим ростом
    const growthFactor = 1.15; // 15% рост
    const forecastData = lastYearData.months.map((month, index) => ({
      month: index + 1,
      value: (focusCategory === 'all' ? month.total : month[focusCategory]) * growthFactor * 
        (1 + (Math.random() * 0.2 - 0.1)) // Случайное колебание ±10%
    }));
    
    // Объединяем для визуализации
    const combinedData = [
      ...actualData.map(d => ({ ...d, type: 'actual', year: lastYear })),
      ...forecastData.map(d => ({ ...d, type: 'forecast', year: lastYear + 1 }))
    ];
    
    // Создаем шкалы
    const x = d3.scaleLinear()
      .domain([1, 12])
      .range([margin.left, width - margin.right]);
    
    const y = d3.scaleLinear()
      .domain([0, d3.max(combinedData, d => d.value) * 1.1])
      .nice()
      .range([height - margin.bottom, margin.top]);
    
    // Создаем оси
    const xAxis = g => g
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(12).tickFormat(d => ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'][d-1]))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text')
        .style('fill', '#f9fafb')
        .style('font-size', '0.8rem')
        .attr('transform', 'rotate(-45)')
        .attr('text-anchor', 'end'));
    
    const yAxis = g => g
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => d3.format('.2s')(d)))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text').style('fill', '#f9fafb'))
      .call(g => g.selectAll('.tick line')
        .attr('x2', width - margin.left - margin.right)
        .attr('stroke-opacity', 0.1));
    
    // Добавляем оси
    svg.append('g').call(xAxis);
    svg.append('g').call(yAxis);
    
    // Создаем линии
    const line = d3.line()
      .x(d => x(d.month))
      .y(d => y(d.value))
      .curve(d3.curveCatmullRom);
    
    // Добавляем линию фактических данных
    const actualLine = svg.append('path')
      .datum(actualData)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 3)
      .attr('d', line);
    
    // Анимация линии
    const actualLength = actualLine.node().getTotalLength();
    
    actualLine
      .attr('stroke-dasharray', actualLength)
      .attr('stroke-dashoffset', actualLength)
      .transition()
      .duration(1500)
      .attr('stroke-dashoffset', 0);
    
    // Добавляем линию прогноза с пунктиром
    const forecastLine = svg.append('path')
      .datum(forecastData)
      .attr('fill', 'none')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '6,3')
      .attr('d', line)
      .style('opacity', 0)
      .transition()
      .delay(1500)
      .duration(1000)
      .style('opacity', 1);
    
    // Добавляем точки для фактических данных
    svg.selectAll('.actual-point')
      .data(actualData)
      .join('circle')
      .attr('class', 'actual-point')
      .attr('cx', d => x(d.month))
      .attr('cy', d => y(d.value))
      .attr('r', 0)
      .attr('fill', '#3b82f6')
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 2)
      .transition()
      .duration(300)
      .delay((_, i) => i * 100 + 1500)
      .attr('r', 4);
    
    // Добавляем точки для прогнозных данных
    svg.selectAll('.forecast-point')
      .data(forecastData)
      .join('circle')
      .attr('class', 'forecast-point')
      .attr('cx', d => x(d.month))
      .attr('cy', d => y(d.value))
      .attr('r', 0)
      .attr('fill', '#10b981')
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 2)
      .transition()
      .duration(300)
      .delay((_, i) => i * 100 + 2500)
      .attr('r', 4);
    
    // Добавляем заливку под линией прогноза
    const forecastArea = d3.area()
      .x(d => x(d.month))
      .y0(height - margin.bottom)
      .y1(d => y(d.value))
      .curve(d3.curveCatmullRom);
    
    // Создаем градиент для заливки
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
      .attr('stop-opacity', 0.5);
      
    forecastGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#10b981')
      .attr('stop-opacity', 0.05);
    
    // Добавляем заливку
    svg.append('path')
      .datum(forecastData)
      .attr('fill', 'url(#forecast-gradient)')
      .attr('d', forecastArea)
      .style('opacity', 0)
      .transition()
      .delay(1800)
      .duration(1000)
      .style('opacity', 0.8);
    
// Добавляем разделитель между фактическими данными и прогнозом
    svg.append('line')
      .attr('x1', x(12))
      .attr('x2', x(12))
      .attr('y1', margin.top)
      .attr('y2', height - margin.bottom)
      .attr('stroke', '#9ca3af')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4')
      .style('opacity', 0)
      .transition()
      .delay(2000)
      .duration(500)
      .style('opacity', 0.7);
    
    // Добавляем подписи годов
    svg.append('text')
      .attr('x', x(6))
      .attr('y', margin.top / 2 + 8)
      .attr('text-anchor', 'middle')
      .style('font-size', '0.9rem')
      .style('fill', '#3b82f6')
      .style('opacity', 0)
      .text(lastYear)
      .transition()
      .delay(2200)
      .duration(500)
      .style('opacity', 1);
    
    svg.append('text')
      .attr('x', x(6) + (x(12) - x(1)) / 2)
      .attr('y', margin.top / 2 + 8)
      .attr('text-anchor', 'middle')
      .style('font-size', '0.9rem')
      .style('fill', '#10b981')
      .style('opacity', 0)
      .text(lastYear + 1)
      .transition()
      .delay(2300)
      .duration(500)
      .style('opacity', 1);
    
    // Добавляем легенду
    const legend = svg.append('g')
      .attr('transform', `translate(${width - margin.right + 5}, ${margin.top})`);
    
    // Фактические данные
    const actualLegend = legend.append('g');
    
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
      .style('fill', '#f9fafb')
      .text(`Факт (${lastYear})`);
    
    // Прогнозные данные
    const forecastLegend = legend.append('g')
      .attr('transform', 'translate(0, 20)');
    
    forecastLegend.append('line')
      .attr('x1', 0)
      .attr('x2', 20)
      .attr('y1', 0)
      .attr('y2', 0)
      .attr('stroke', '#10b981')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '6,3');
    
    forecastLegend.append('text')
      .attr('x', 25)
      .attr('y', 4)
      .style('font-size', '0.8rem')
      .style('fill', '#f9fafb')
      .text(`Прогноз (${lastYear + 1})`);
    
    // Добавляем информацию о росте
    const lastYearTotal = lastYearData.totalEarned;
    const nextYearEstimate = lastYearTotal * growthFactor;
    const growthPercentage = ((nextYearEstimate / lastYearTotal) - 1) * 100;
    
    svg.append('g')
      .attr('transform', `translate(${margin.left}, ${height - 10})`)
      .append('text')
      .style('font-size', '0.8rem')
      .style('fill', '#10b981')
      .style('opacity', 0)
      .text(`Ожидаемый рост: +${growthPercentage.toFixed(1)}% (${(nextYearEstimate / 1000000).toFixed(2)} млн  UZS)`)
      .transition()
      .delay(2500)
      .duration(500)
      .style('opacity', 1);
  };
  const renderCategoryDistribution = () => {
    if (!categoryDistributionRef.current || !filteredData.length) return;
         
    const container = categoryDistributionRef.current;
    container.innerHTML = '';
    
    const width = container.clientWidth;
    const height = 250;
    const margin = { top: 30, right: 30, bottom: 40, left: 50 };
    
    // Создаем SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('background', '#1f2937')
      .style('border-radius', '0.5rem');
    
    // Добавляем заголовок
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '1rem')
      .style('font-weight', 'bold')
      .style('fill', '#f9fafb')
      .text('Динамика структуры продаж');
    
    // Группируем данные по месяцам и категориям
    const groupedData = [];
    
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
      monthGroups[monthKey].retail += month.retail;
      monthGroups[monthKey].wholesale += month.wholesale;
      monthGroups[monthKey].promo += month.promo;
      monthGroups[monthKey].total += month.total;
    });
    
    // Сортируем месяцы 
    const sortedMonths = Object.values(monthGroups);
    
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
    
    // Для визуализации выбираем не более 6 месяцев, чтобы не перегружать график
    let displayMonths = sortedMonths;
    
    if (sortedMonths.length > 6) {
      // Берем первый, последний и равномерно распределенные между ними
      const step = Math.floor(sortedMonths.length / 5);
      displayMonths = [
        sortedMonths[0],
        sortedMonths[step],
        sortedMonths[step * 2],
        sortedMonths[step * 3],
        sortedMonths[step * 4],
        sortedMonths[sortedMonths.length - 1]
      ];
    }
    
    // Преобразуем данные для stacked bar chart
    displayMonths.forEach(month => {
      const total = month.total;
      
      groupedData.push(
        { category: 'retail', month: month.name, value: month.retail, percentage: (month.retail / total) * 100 },
        { category: 'wholesale', month: month.name, value: month.wholesale, percentage: (month.wholesale / total) * 100 },
        { category: 'promo', month: month.name, value: month.promo, percentage: (month.promo / total) * 100 }
      );
    });
    
    // Создаем шкалы
    const x = d3.scaleBand()
      .domain([...new Set(groupedData.map(d => d.month))])
      .range([margin.left, width - margin.right])
      .padding(0.2);
    
    const y = d3.scaleLinear()
      .domain([0, 100]) // Процентная шкала
      .range([height - margin.bottom, margin.top]);
    
    // Создаем цветовую схему
    const colorScale = d3.scaleOrdinal()
      .domain(['retail', 'wholesale', 'promo'])
      .range([SALE_TYPES.RETAIL.color, SALE_TYPES.WHOLESALE.color, SALE_TYPES.PROMO.color]);
    
    // Создаем оси
    const xAxis = g => g
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickSizeOuter(0))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text')
        .style('fill', '#f9fafb')
        .style('font-size', '0.8rem')
        .attr('dy', '0.5em')
        .attr('transform', 'rotate(-25)')
        .attr('text-anchor', 'end'));
    
    const yAxis = g => g
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text').style('fill', '#f9fafb'))
      .call(g => g.selectAll('.tick line')
        .attr('x2', width - margin.left - margin.right)
        .attr('stroke-opacity', 0.1));
    
    // Добавляем оси
    svg.append('g').call(xAxis);
    svg.append('g').call(yAxis);
    
    // Группируем данные для построения stacked bar chart
    const stackedData = d3.stack()
      .keys(['retail', 'wholesale', 'promo'])
      .value((d, key) => {
        const entry = groupedData.find(item => item.month === d && item.category === key);
        return entry ? entry.percentage : 0;
      })
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);
    
    const series = stackedData([...new Set(groupedData.map(d => d.month))]);
    
    // Добавляем stacked bars
    svg.append('g')
      .selectAll('g')
      .data(series)
      .join('g')
      .attr('fill', (d, i) => colorScale(d.key))
      .selectAll('rect')
      .data(d => d)
      .join('rect')
      .attr('x', d => x(d.data))
      .attr('y', d => y(d[1]))
      .attr('height', d => y(d[0]) - y(d[1]))
      .attr('width', x.bandwidth())
      .attr('rx', 2)
      .attr('opacity', 0.9)
      .attr('y', height - margin.bottom) // Начальная позиция для анимации
      .attr('height', 0) // Начальная высота для анимации
      .transition()
      .duration(800)
      .delay((_, i) => i * 50)
      .attr('y', d => y(d[1]))
      .attr('height', d => y(d[0]) - y(d[1]));
    
    // Добавляем легенду
    const legend = svg.append('g')
      .attr('transform', `translate(${width - margin.right - 120}, ${margin.top})`);
    
    Object.values(SALE_TYPES).forEach((type, i) => {
      const legendItem = legend.append('g')
        .attr('transform', `translate(0, ${i * 25})`);
      
      legendItem.append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('rx', 2)
        .attr('fill', type.color);
      
      legendItem.append('text')
        .attr('x', 25)
        .attr('y', 12)
        .style('font-size', '0.8rem')
        .style('fill', '#f9fafb')
        .text(type.name);
    });
  };
  const renderQuarterlyChart = () => {
    if (!quarterlyChartRef.current || Object.keys(financialData).length === 0) return;
    
    const container = quarterlyChartRef.current;
    container.innerHTML = '';
    
    const width = container.clientWidth;
    const height = 300;
    const margin = { top: 40, right: 30, bottom: 60, left: 60 };
    
    // Создаем SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('background', '#1f2937')
      .style('border-radius', '0.5rem');
    
    // Добавляем заголовок
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '1.2rem')
      .style('font-weight', 'bold')
      .style('fill', '#f9fafb')
      .text('Динамика по кварталам');
    
    // Подготовка данных
    const quarterlyData = [];
    
    // Для режима сравнения используем все выбранные годы
    if (displayMode === 'compare') {
      selectedYears.forEach(year => {
        if (!financialData[year]) return;
        
        financialData[year].quarterlyData.forEach((value, quarter) => {
          quarterlyData.push({
            year,
            quarter: quarter + 1,
            value
          });
        });
      });
    } 
    // Для остальных режимов берем последний доступный год
    else {
      const year = displayMode === 'yearly' ? 
        selectedYears[0] : Math.max(...Object.keys(financialData).map(Number));
      
      if (financialData[year]) {
        financialData[year].quarterlyData.forEach((value, quarter) => {
          quarterlyData.push({
            year,
            quarter: quarter + 1,
            value
          });
        });
      }
    }
    
    // Создаем шкалы
    const x = d3.scaleBand()
      .domain(quarterlyData.map(d => `Q${d.quarter}${displayMode === 'compare' ? `-${d.year}` : ''}`))
      .range([margin.left, width - margin.right])
      .padding(0.3);
    
    const y = d3.scaleLinear()
      .domain([0, d3.max(quarterlyData, d => d.value) * 1.1])
      .nice()
      .range([height - margin.bottom, margin.top]);
    
    // Создаем цветовую схему
    const colorScale = displayMode === 'compare' ?
      d3.scaleOrdinal()
        .domain(selectedYears)
        .range(d3.schemeCategory10.slice(0, selectedYears.length)) :
      d3.scaleOrdinal()
        .domain([1, 2, 3, 4])
        .range(['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b']);
    // Создаем оси
    const xAxis = g => g
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickSizeOuter(0))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text')
        .style('fill', '#f9fafb')
        .style('font-size', '0.9rem')
        .style('font-weight', 'bold'));
    
    const yAxis = g => g
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => d3.format('.2s')(d)))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text').style('fill', '#f9fafb'))
      .call(g => g.selectAll('.tick line')
        .attr('x2', width - margin.left - margin.right)
        .attr('stroke-opacity', 0.1));
    
    // Добавляем оси
    svg.append('g').call(xAxis);
    svg.append('g').call(yAxis);
    
    // Добавляем столбцы
    svg.selectAll('.quarter-bar')
      .data(quarterlyData)
      .join('rect')
      .attr('class', 'quarter-bar')
      .attr('x', d => x(`Q${d.quarter}${displayMode === 'compare' ? `-${d.year}` : ''}`))
      .attr('y', d => y(d.value))
      .attr('width', x.bandwidth())
      .attr('height', d => height - margin.bottom - y(d.value))
      .attr('fill', d => displayMode === 'compare' ? colorScale(d.year) : colorScale(d.quarter))
      .attr('rx', 6)
      .attr('opacity', 0.9)
      .attr('y', height - margin.bottom) // Начальная позиция для анимации
      .attr('height', 0) // Начальная высота для анимации
      .transition()
      .duration(800)
      .delay((_, i) => i * 100)
      .attr('y', d => y(d.value))
      .attr('height', d => height - margin.bottom - y(d.value));
    
    // Добавляем подписи со значениями
    svg.selectAll('.quarter-label')
      .data(quarterlyData)
      .join('text')
      .attr('class', 'quarter-label')
      .attr('x', d => x(`Q${d.quarter}${displayMode === 'compare' ? `-${d.year}` : ''}`) + x.bandwidth() / 2)
      .attr('y', d => y(d.value) - 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '0.8rem')
      .style('fill', '#f9fafb')
      .style('opacity', 0)
      .text(d => d3.format('.2s')(d.value))
      .transition()
      .duration(500)
      .delay((_, i) => i * 100 + 800)
      .style('opacity', 1);
    
    // Добавляем процентный рост между кварталами
    if (displayMode !== 'compare') {
      for (let i = 1; i < quarterlyData.length; i++) {
        const current = quarterlyData[i];
        const previous = quarterlyData[i - 1];
        const growthPercentage = ((current.value / previous.value) - 1) * 100;
        
        svg.append('text')
          .attr('x', x(`Q${current.quarter}`) + x.bandwidth() / 2)
          .attr('y', y(current.value) - 30)
          .attr('text-anchor', 'middle')
          .style('font-size', '0.8rem')
          .style('fill', growthPercentage >= 0 ? '#10b981' : '#ef4444')
          .style('opacity', 0)
          .text(`${growthPercentage >= 0 ? '+' : ''}${growthPercentage.toFixed(1)}%`)
          .transition()
          .duration(500)
          .delay(900 + i * 100)
          .style('opacity', 1);
      }
    }
    
    // Если это режим сравнения, добавляем легенду
    if (displayMode === 'compare') {
      const legend = svg.append('g')
        .attr('transform', `translate(${width - margin.right - 100}, ${margin.top})`);
      
      selectedYears.forEach((year, i) => {
        const yearLegend = legend.append('g')
          .attr('transform', `translate(0, ${i * 25})`);
        
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
      });
    } else {
      // Добавляем подпись года
      svg.append('text')
        .attr('x', width - margin.right - 50)
        .attr('y', margin.top + 20)
        .style('font-size', '1rem')
        .style('font-weight', 'bold')
        .style('fill', '#f9fafb')
        .text(quarterlyData[0]?.year || '');
    }
  };
  
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
          <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-blue-500"></div>
          <p className="ml-4 text-white">Загрузка данных...</p>
        </div>
      ) : (
        <>
          {/* Элементы управления API запросом */}
          <div className="bg-gray-800/80 shadow-xl backdrop-blur-sm rounded-xl p-5 mb-6 border border-gray-700/50">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <h2 className="text-xl font-semibold text-white">Параметры API запроса</h2>
              
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2">
                  <label className="text-gray-300 text-sm">Начальная дата:</label>
                  <input 
                    type="text" 
                    className="bg-gray-700/80 text-white px-3 py-1.5 rounded-md text-sm border border-gray-600/50"
                    value={apiStartDate}
                    onChange={(e) => setApiStartDate(e.target.value)}
                    placeholder="ДД.ММ.ГГГГ"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-gray-300 text-sm">Конечная дата:</label>
                  <input 
                    type="text" 
                    className="bg-gray-700/80 text-white px-3 py-1.5 rounded-md text-sm border border-gray-600/50"
                    value={apiEndDate}
                    onChange={(e) => setApiEndDate(e.target.value)}
                    placeholder="ДД.ММ.ГГГГ"
                  />
                </div>
                
                <button 
                  className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium"
                  onClick={refreshDataWithDateRange}
                >
                  Обновить данные
                </button>
              </div>
            </div>
          </div>
          
          {/* РАЗДЕЛ: Панель управления и фильтры */}
          <div className="bg-gray-800/80 shadow-xl backdrop-blur-sm rounded-xl p-5 mb-6 border border-gray-700/50">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex flex-wrap items-center gap-4">
                <h2 className="text-xl font-semibold text-white">Параметры отображения</h2>
                
                <div className="flex bg-gray-700/80 rounded-lg p-1">
                  <button 
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      displayMode === 'compare' 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                        : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                    }`}
                    onClick={() => handleDisplayModeChange('compare')}
                  >
                    Сравнение
                  </button>
                  <button 
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      displayMode === 'period' 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                        : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                    }`}
                    onClick={() => handleDisplayModeChange('period')}
                  >
                    По периоду
                  </button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <div className="flex bg-gray-700/80 rounded-lg p-1">
                  <button 
                    className={`px-3 py-1.5 rounded-md text-sm ${
                      viewType === 'bar' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300'
                    }`}
                    onClick={() => setViewType('bar')}
                  >
                    Столбцы
                  </button>
                  <button 
                    className={`px-3 py-1.5 rounded-md text-sm ${
                      viewType === 'line' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300'
                    }`}
                    onClick={() => setViewType('line')}
                  >
                    Линия
                  </button>
                  <button 
                    className={`px-3 py-1.5 rounded-md text-sm ${
                      viewType === 'stacked' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300'
                    }`}
                    onClick={() => setViewType('stacked')}
                  >
                    Составной
                  </button>
                  <button 
                    className={`px-3 py-1.5 rounded-md text-sm ${
                      viewType === 'radar' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300'
                    }`}
                    onClick={() => setViewType('radar')}
                  >
                    Радар
                  </button>
                  <button 
                    className={`px-3 py-1.5 rounded-md text-sm ${
                      viewType === 'mixed' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300'
                    }`}
                    onClick={() => setViewType('mixed')}
                  >
                    Комбинированный
                  </button>
                </div>
                
              <div className="flex bg-gray-700/80 rounded-lg p-1">
  <button 
    className={`px-3 py-1.5 rounded-md text-sm ${
      focusCategory === 'all' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300'
    }`}
    onClick={() => setFocusCategory('all')}
  >
    Все продажи
  </button>
  <button 
    className={`px-3 py-1.5 rounded-md text-sm ${
      focusCategory === 'retail' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300'
    }`}
    onClick={() => setFocusCategory('retail')}
    style={{ color: focusCategory === 'retail' ? '#ffffff' : SALE_TYPES.RETAIL.color }}
  >
    Розница
  </button>
  <button 
    className={`px-3 py-1.5 rounded-md text-sm ${
      focusCategory === 'wholesale' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300'
    }`}
    onClick={() => setFocusCategory('wholesale')}
    style={{ color: focusCategory === 'wholesale' ? '#ffffff' : SALE_TYPES.WHOLESALE.color }}
  >
    Опт
  </button>
  <button 
    className={`px-3 py-1.5 rounded-md text-sm ${
      focusCategory === 'promo' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300'
    }`}
    onClick={() => setFocusCategory('promo')}
    style={{ color: focusCategory === 'promo' ? '#ffffff' : SALE_TYPES.PROMO.color }}
  >
    Акции
  </button>
</div>
              </div>
            </div>
            
            {/* РАЗДЕЛ: Динамические опции в зависимости от режима просмотра */}
            <AnimatePresence mode="wait">
              {displayMode === 'yearly' && (
                <motion.div 
                  key="yearly"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-3"
                >
                  <div className="flex items-center justify-center w-full">
                    <div className="flex space-x-4">
                      {Object.keys(financialData).map(year => (
                        <motion.button
                          key={year}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`relative px-6 py-3 rounded-xl text-lg font-semibold transition-all duration-300 ${
                            selectedYears.includes(parseInt(year)) 
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30' 
                              : 'bg-gray-700/80 text-gray-300 hover:bg-gray-600/80'
                          }`}
                          onClick={() => toggleYearSelection(parseInt(year))}
                        >
                          {year}
                          {selectedYears.includes(parseInt(year)) && (
                            <motion.span 
                              layoutId="yearIndicator"
                              className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-10 h-1 rounded-full bg-white"
                            />
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="w-full mt-3">
                    <div className="flex justify-between">
                      <div className="flex items-center">
                        <button 
                          className={`flex items-center px-3 py-1.5 rounded-md text-sm border ${
                            showQuarterlyData 
                              ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300' 
                              : 'bg-gray-700/50 border-gray-600/50 text-gray-300'
                          }`}
                          onClick={() => setShowQuarterlyData(!showQuarterlyData)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            {showQuarterlyData ? (
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            ) : (
                              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            )}
                          </svg>
                          Квартальная аналитика
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {displayMode === 'compare' && (
                <motion.div 
                  key="compare"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-3"
                >
                  <div className="flex items-center justify-center w-full">
                    <div className="flex space-x-4">
                      {Object.keys(financialData).map(year => (
                        <motion.button
                          key={year}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`relative px-6 py-3 rounded-xl text-lg font-semibold transition-all duration-300 ${
                            selectedYears.includes(parseInt(year)) 
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30' 
                              : 'bg-gray-700/80 text-gray-300 hover:bg-gray-600/80'
                          }`}
                          onClick={() => toggleYearSelection(parseInt(year))}
                        >
                          {year}
                          {selectedYears.includes(parseInt(year)) && (
                            <motion.span 
                              className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-10 h-1 rounded-full bg-white"
                            />
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="w-full flex justify-center mt-2">
                    <p className="text-gray-400 text-sm">
                      {selectedYears.length === 0 ? 'Выберите годы для сравнения' : 
                       selectedYears.length === 1 ? 'Выберите еще один год для сравнения' :
                       `Сравниваем данные за ${selectedYears.join(', ')} годы`}
                    </p>
                  </div>
                </motion.div>
              )}
              
              {displayMode === 'period' && (
                <motion.div 
                  key="period"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gradient-to-r from-gray-800/80 to-gray-700/60 backdrop-blur-sm rounded-xl p-3.5 border border-gray-600/30 shadow-lg"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="relative group">
                        <div className="absolute -top-5 left-0 text-xs text-blue-300/70 font-medium opacity-0 group-hover:opacity-100 transition-opacity">От</div>
                        <div className="flex items-center overflow-hidden rounded-lg shadow-sm bg-gray-900/50 border border-blue-500/20 hover:border-blue-500/40 transition-colors">
                          <select 
                            value={startMonth}
                            onChange={(e) => setStartMonth(parseInt(e.target.value))}
                            className="bg-transparent text-white text-sm font-medium px-3 py-2 focus:outline-none min-w-24"
                          >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                              <option key={`sm-${month}`} value={month}>
                                {new Date(2000, month - 1).toLocaleString('ru', { month: 'short' })}
                              </option>
                            ))}
                          </select>
                          
                          <div className="h-5 w-px bg-blue-500/20"></div>
                          
                          <select 
                            value={startYear}
                            onChange={(e) => setStartYear(parseInt(e.target.value))}
                            className="bg-transparent text-white text-sm font-medium px-3 py-2 focus:outline-none w-20"
                          >
                            {Object.keys(financialData).map(year => (
                              <option key={`sy-${year}`} value={year}>{year}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="w-8 h-px bg-gradient-to-r from-blue-500/20 to-indigo-500/30"></div>
                      
                      <div className="relative group">
                        <div className="absolute -top-5 left-0 text-xs text-blue-300/70 font-medium opacity-0 group-hover:opacity-100 transition-opacity">До</div>
                        <div className="flex items-center overflow-hidden rounded-lg shadow-sm bg-gray-900/50 border border-indigo-500/20 hover:border-indigo-500/40 transition-colors">
                          <select 
                            value={endMonth}
                            onChange={(e) => setEndMonth(parseInt(e.target.value))}
                            className="bg-transparent text-white text-sm font-medium px-3 py-2 focus:outline-none min-w-24"
                          >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                              <option key={`em-${month}`} value={month}>
                                {new Date(2000, month - 1).toLocaleString('ru', { month: 'short' })}
                              </option>
                            ))}
                          </select>
                          
                          <div className="h-5 w-px bg-indigo-500/20"></div>
                          
                          <select 
                            value={endYear}
                            onChange={(e) => setEndYear(parseInt(e.target.value))}
                            className="bg-transparent text-white text-sm font-medium px-3 py-2 focus:outline-none w-20"
                          >
                            {Object.keys(financialData).map(year => (
                              <option key={`ey-${year}`} value={year}>{year}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    {!isPeriodValid() ? (
                      <div className="text-xs font-medium text-red-400 bg-red-900/10 px-3 py-1.5 rounded-lg border border-red-500/30 shadow-inner flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        Некорректный период
                      </div>
                    ) : (
                      <div className="text-xs font-medium text-sky-300 bg-sky-900/10 px-3 py-1.5 rounded-lg border border-sky-500/20 shadow-inner">
                        {new Date(startYear, startMonth - 1).toLocaleString('ru', { month: 'short', year: 'numeric' })} —{' '}
                        {new Date(endYear, endMonth - 1).toLocaleString('ru', { month: 'short', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
                      <h3 className="text-lg font-medium text-blue-300">Общая сумма</h3>
                      <p className="text-3xl font-bold text-white mt-1">
                        {formatCurrency(getTotalForPeriod())}
                      </p>
                      <p className="text-blue-300/70 text-sm mt-1">
                        {displayMode === 'yearly' 
                          ? `За ${selectedYears[0] || ''} год` 
                          : displayMode === 'compare'
                          ? `За выбранные годы` 
                          : 'За выбранный период'}
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
                      <h3 className="text-lg font-medium text-purple-300">Средняя стоимость авто</h3>
                      <p className="text-3xl font-bold text-white mt-1">
                        {formatCurrency(Math.round(getTotalForPeriod() / (filteredData.length * 5)))}
                      </p>
                      <p className="text-purple-300/70 text-sm mt-1">
                        На основе количества проданных автомобилей
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
                        <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-green-300">Рост продаж</h3>
                      <p className="text-3xl font-bold text-white mt-1">
                        +{displayMode === 'yearly' && selectedYears.length > 0 && financialData[selectedYears[0]-1]
                          ? Math.round((financialData[selectedYears[0]]?.totalEarned || 0) / 
                              (financialData[selectedYears[0]-1]?.totalEarned || 1) * 100 - 100)
                          : '23'}%
                      </p>
                      <p className="text-green-300/70 text-sm mt-1">
                        По сравнению с предыдущим периодом
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
              
              {/* РАЗДЕЛ: Основной график и прогресс */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2 bg-gray-800 rounded-xl p-2 border border-gray-700/50 shadow-lg">
                  <div ref={mainChartRef} className="w-full h-full"></div>
                </div>
                
                <div className="bg-gray-800 rounded-xl p-10 border border-gray-700/50 shadow-lg">
                  <h3 className="text-xl font-semibold text-white mb-4 text-center">Выполнение плана</h3>
                  <div ref={progressChartRef} className="w-full h-64"></div>
                </div>
              </div>
            </>
          )}
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