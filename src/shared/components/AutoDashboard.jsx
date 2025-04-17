'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { carModels, regions } from '../mocks/mock-data';
import { motion, AnimatePresence } from 'framer-motion';

// Генерация тестовых данных (сохраняем ту же логику, но добавляем больше деталей)
const generateMockTimeData = () => {
  // Генерируем данные за последние 12 месяцев
  const data = {};
  const now = new Date();
  
  for (let i = 0; i < 12; i++) {
    const date = new Date(now);
    date.setMonth(now.getMonth() - i);
    
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const monthKey = `${year}-${month + 1}`;
    
    // Базовые значения для каждой модели с небольшой случайностью
    data[monthKey] = {
      date: new Date(year, month, 1),
      sales: {},
      export: {},
      import: {}
    };
    
    // Данные продаж по моделям
    carModels.forEach((model, idx) => {
      // Базовое значение + случайность + сезонность
      const baseValue = 500 + idx * 100;
      const randomFactor = 0.8 + Math.random() * 0.4; // 0.8-1.2
      const seasonality = 1 + 0.2 * Math.sin((month / 12) * Math.PI * 2); // Сезонный фактор
      
      const value = Math.round(baseValue * randomFactor * seasonality);
      
      data[monthKey].sales[model.id] = {
        value,
        model: model.name,
        img: model.img,
        // Распределение по регионам
        regions: regions.reduce((acc, region) => {
          acc[region.id] = Math.round(value * (0.05 + Math.random() * 0.3));
          return acc;
        }, {})
      };
      
      // Экспорт (примерно 30-50% от продаж)
      const exportValue = Math.round(value * (0.3 + Math.random() * 0.2));
      data[monthKey].export[model.id] = {
        value: exportValue,
        model: model.name,
        img: model.img,
        // Распределение по странам экспорта
        regions: {
          'kz': Math.round(exportValue * 0.35),
          'kg': Math.round(exportValue * 0.25),
          'tj': Math.round(exportValue * 0.15),
          'ru': Math.round(exportValue * 0.15),
          'af': Math.round(exportValue * 0.07),
          'other': Math.round(exportValue * 0.03)
        }
      };
    });
    
    // Данные импорта (запчасти, комплектующие и т.д.)
    const importCategories = [
      { id: 'parts', name: 'Запчасти' },
      { id: 'components', name: 'Комплектующие' },
      { id: 'batteries', name: 'Аккумуляторы' },
      { id: 'engines', name: 'Двигатели' },
      { id: 'electronics', name: 'Электроника' },
      { id: 'materials', name: 'Материалы' }
    ];
    
    importCategories.forEach((category, idx) => {
      const baseValue = 600 + idx * 80;
      const randomFactor = 0.85 + Math.random() * 0.3;
      const seasonality = 1 + 0.15 * Math.sin((month / 12) * Math.PI * 2);
      
      const value = Math.round(baseValue * randomFactor * seasonality);
      
      data[monthKey].import[category.id] = {
        value,
        name: category.name,
        // Распределение по странам импорта
        regions: {
          'kr': Math.round(value * 0.38),
          'ru': Math.round(value * 0.26),
          'cn': Math.round(value * 0.18),
          'de': Math.round(value * 0.10),
          'tr': Math.round(value * 0.05),
          'other': Math.round(value * 0.03)
        }
      };
    });
  }
  
  return data;
};

const timeData = generateMockTimeData();

const AutoDashboard = () => {
  // Основное состояние
  const [timeRange, setTimeRange] = useState({
    startDate: d3.timeMonth.offset(new Date(), -3),
    endDate: new Date(),
    preset: 'last3Months'
  });
  
  const [comparisonRange, setComparisonRange] = useState({
    startDate: d3.timeMonth.offset(d3.timeMonth.offset(new Date(), -3), -3),
    endDate: d3.timeMonth.offset(new Date(), -3),
    preset: 'prevPeriod'
  });
  
  const [showComparison, setShowComparison] = useState(false);
  const [activeSection, setActiveSection] = useState('sales');
  const [visualizationType, setVisualizationType] = useState('barChart');
  
  // Фильтры
  const [filters, setFilters] = useState({
    models: [], // Пустой массив = все модели
    regions: [] // Пустой массив = все регионы
  });
  
  // Состояние UI
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [activeDrilldown, setActiveDrilldown] = useState(null);
  
  // Refs для графиков
  const mainChartRef = useRef(null);
  const trendChartRef = useRef(null);
  const distributionChartRef = useRef(null);
  
  // Пресеты выбора времени
  const timePresets = [
    { id: 'thisMonth', label: 'Этот месяц', getRange: () => ({
      startDate: d3.timeMonth.floor(new Date()),
      endDate: new Date()
    })},
    { id: 'lastMonth', label: 'Прошлый месяц', getRange: () => ({
      startDate: d3.timeMonth.offset(d3.timeMonth.floor(new Date()), -1),
      endDate: d3.timeMonth.offset(d3.timeMonth.floor(new Date()), 0)
    })},
    { id: 'last3Months', label: '3 месяца', getRange: () => ({
      startDate: d3.timeMonth.offset(new Date(), -3),
      endDate: new Date()
    })},
    { id: 'last6Months', label: '6 месяцев', getRange: () => ({
      startDate: d3.timeMonth.offset(new Date(), -6),
      endDate: new Date()
    })},
    { id: 'thisYear', label: 'Этот год', getRange: () => ({
      startDate: d3.timeYear.floor(new Date()),
      endDate: new Date()
    })},
    { id: 'lastYear', label: 'Прошлый год', getRange: () => ({
      startDate: d3.timeYear.offset(d3.timeYear.floor(new Date()), -1),
      endDate: d3.timeYear.floor(new Date())
    })},
    { id: 'custom', label: 'Свой период', getRange: () => ({
      startDate: timeRange.startDate,
      endDate: timeRange.endDate
    })}
  ];
  
  const comparisonPresets = [
    { id: 'prevPeriod', label: 'Пред. период', getRange: () => {
      const currentRange = timeRange.endDate - timeRange.startDate;
      return {
        startDate: new Date(timeRange.startDate - currentRange),
        endDate: new Date(timeRange.endDate - currentRange)
      };
    }},
    { id: 'prevYear', label: 'Пред. год', getRange: () => ({
      startDate: d3.timeYear.offset(timeRange.startDate, -1),
      endDate: d3.timeYear.offset(timeRange.endDate, -1)
    })},
    { id: 'custom', label: 'Свой период', getRange: () => ({
      startDate: comparisonRange.startDate,
      endDate: comparisonRange.endDate
    })}
  ];
  
  // Применение выбранного пресета времени
  const applyTimePreset = (presetId) => {
    const preset = timePresets.find(p => p.id === presetId);
    if (preset) {
      const range = preset.getRange();
      setTimeRange({
        ...range,
        preset: presetId
      });
    }
  };
  
  // Применение выбранного пресета сравнения
  const applyComparisonPreset = (presetId) => {
    const preset = comparisonPresets.find(p => p.id === presetId);
    if (preset) {
      const range = preset.getRange();
      setComparisonRange({
        ...range,
        preset: presetId
      });
    }
  };
  
  // Обновление интервалов сравнения при изменении основного интервала
  useEffect(() => {
    if (comparisonRange.preset !== 'custom') {
      applyComparisonPreset(comparisonRange.preset);
    }
  }, [timeRange]);
  
  // Получение отфильтрованных данных
  const getFilteredData = (range) => {
    // Получаем данные в интервале
    const dataInRange = Object.values(timeData).filter(d => {
      const date = new Date(d.date);
      return date >= range.startDate && date <= range.endDate;
    });
    
    // Применяем фильтры
    return dataInRange;
  };
  
  // Мемоизируем основные наборы данных
  const primaryData = useMemo(() => getFilteredData(timeRange), [timeRange, filters]);
  const comparisonData = useMemo(() => showComparison ? getFilteredData(comparisonRange) : [], 
    [showComparison, comparisonRange, filters]);
  
  // Расчет агрегированных показателей
  const aggregateData = (dataPoints, section) => {
    if (!dataPoints || dataPoints.length === 0) return [];
    
    // Здесь логика агрегации данных из выбранного раздела
    const aggregated = {};
    
    // Собираем все значения для каждой модели/категории
    dataPoints.forEach(dataPoint => {
      const sectionData = dataPoint[section];
      
      Object.keys(sectionData).forEach(itemId => {
        const item = sectionData[itemId];
        
        if (!aggregated[itemId]) {
          aggregated[itemId] = {
            id: itemId,
            name: item.model || item.name,
            value: 0,
            img: item.img,
            regionData: {}
          };
        }
        
        // Суммирование значений
        aggregated[itemId].value += item.value;
        
        // Суммирование по регионам
        Object.keys(item.regions).forEach(regionId => {
          if (!aggregated[itemId].regionData[regionId]) {
            aggregated[itemId].regionData[regionId] = 0;
          }
          aggregated[itemId].regionData[regionId] += item.regions[regionId];
        });
      });
    });
    
    // Преобразование в массив и добавление процентов
    const result = Object.values(aggregated);
    const total = result.reduce((sum, item) => sum + item.value, 0);
    
    result.forEach(item => {
      item.percent = parseFloat((item.value / total * 100).toFixed(1));
    });
    
    return result.sort((a, b) => b.value - a.value);
  };
  
  // Расчет итоговых показателей
  const calculateSummaryStats = (primaryAggregated, comparisonAggregated) => {
    if (!primaryAggregated || primaryAggregated.length === 0) {
      return { total: 0, change: 0, percentChange: 0, topItem: null };
    }
    
    const total = primaryAggregated.reduce((sum, item) => sum + item.value, 0);
    const topItem = [...primaryAggregated].sort((a, b) => b.value - a.value)[0];
    
    let change = 0;
    let percentChange = 0;
    
    if (showComparison && comparisonAggregated && comparisonAggregated.length > 0) {
      const comparisonTotal = comparisonAggregated.reduce((sum, item) => sum + item.value, 0);
      change = total - comparisonTotal;
      percentChange = comparisonTotal !== 0 
        ? parseFloat(((total - comparisonTotal) / comparisonTotal * 100).toFixed(1))
        : 0;
    }
    
    return { total, change, percentChange, topItem };
  };
  
  // Мемоизированные агрегированные данные
  const primaryAggregated = useMemo(() => 
    aggregateData(primaryData, activeSection), [primaryData, activeSection]);
  
  const comparisonAggregated = useMemo(() => 
    showComparison ? aggregateData(comparisonData, activeSection) : [], 
    [showComparison, comparisonData, activeSection]);
  
  // Итоговые статистические показатели
  const summaryStats = useMemo(() =>
    calculateSummaryStats(primaryAggregated, comparisonAggregated),
    [primaryAggregated, comparisonAggregated, showComparison]);
  
  // Форматирование дат в удобной форме
  const formatDateRange = (range) => {
    const formatDate = d3.timeFormat("%d.%m.%Y");
    return `${formatDate(range.startDate)} - ${formatDate(range.endDate)}`;
  };
  
  // Отрисовка графиков при изменении данных
  useEffect(() => {
    if (mainChartRef.current) renderMainChart();
    if (trendChartRef.current) renderTrendChart();
    if (distributionChartRef.current) renderDistributionChart();
  }, [primaryAggregated, comparisonAggregated, showComparison, visualizationType]);
  
  // Рендеринг основного графика
 // Рендеринг основного графика
const renderMainChart = () => {
  const container = mainChartRef.current;
  d3.select(container).selectAll("*").remove();
  
  if (!primaryAggregated || primaryAggregated.length === 0) {
    d3.select(container)
      .append("div")
      .attr("class", "flex items-center justify-center h-full text-gray-400")
      .text("Нет данных для отображения");
    return;
  }
  
  const width = container.clientWidth;
  const height = container.clientHeight || 400;
  const margin = { top: 30, right: 30, bottom: 50, left: 70 };
  
  // Ограничиваем количество элементов для отображения
  const displayData = primaryAggregated.slice(0, 10);
  
  const svg = d3.select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("class", "overflow-visible");
  
  // Выбор типа визуализации и раздела
  if (activeSection === 'inventory' && visualizationType === 'barChart') {
    // Остатки по складам - вертикальные столбцы
    
    // Получаем уникальные склады и формируем данные
    const warehouses = [
      { id: 'tashkent_main', name: 'Ташкент Центральный' },
      { id: 'tashkent_south', name: 'Ташкент Южный' },
      { id: 'samarkand', name: 'Самарканд' },
      { id: 'andijan', name: 'Андижан' },
      { id: 'bukhara', name: 'Бухара' },
      { id: 'namangan', name: 'Наманган' },
      { id: 'fergana', name: 'Фергана' }
    ];
    
    // Преобразуем данные складов в формат для отображения
    const warehouseData = [];
    
    // Получаем уникальные склады
    const allWarehouses = {};
    primaryAggregated.forEach(model => {
      Object.keys(model.regionData).forEach(warehouseId => {
        if (!allWarehouses[warehouseId]) {
          const warehouse = warehouses.find(w => w.id === warehouseId);
          allWarehouses[warehouseId] = warehouse ? warehouse.name : warehouseId;
        }
      });
    });
    
    // Формируем данные для отображения
    Object.entries(allWarehouses).forEach(([warehouseId, warehouseName]) => {
      // Суммируем количество всех моделей на этом складе
      const totalInventory = primaryAggregated.reduce((sum, model) => {
        return sum + (model.regionData[warehouseId] || 0);
      }, 0);
      
      warehouseData.push({
        id: warehouseId,
        name: warehouseName,
        value: totalInventory
      });
    });
    
    // Сортируем по количеству (от большего к меньшему)
    warehouseData.sort((a, b) => b.value - a.value);
    
    // Склады по оси X, количество по оси Y
    const x = d3.scaleBand()
      .domain(warehouseData.map(d => d.name))
      .range([margin.left, width - margin.right])
      .padding(0.3);
    
    const y = d3.scaleLinear()
      .domain([0, d3.max(warehouseData, d => d.value) * 1.1])
      .nice()
      .range([height - margin.bottom, margin.top]);
    
    // Градиент для столбцов
    const defs = svg.append("defs");
    const gradient = defs
      .append("linearGradient")
      .attr("id", "warehouse-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#8b5cf6")
      .attr("stop-opacity", 0.9);
    
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#6d28d9")
      .attr("stop-opacity", 0.7);
    
    // Эффект тени
    defs.append("filter")
      .attr("id", "dropShadow")
      .append("feDropShadow")
      .attr("stdDeviation", 3)
      .attr("flood-opacity", 0.3);
    
    defs.append("filter")
      .attr("id", "glow")
      .append("feGaussianBlur")
      .attr("stdDeviation", 2.5)
      .attr("result", "coloredBlur");
    
    // Оси
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .attr("class", "axis")
      .call(d3.axisBottom(x).tickSize(0))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick text")
        .attr("fill", "#e5e7eb")
        .style("font-size", "0.85rem")
        .style("font-weight", "500")
        .attr("transform", "rotate(-25)")
        .attr("text-anchor", "end")
        .attr("dy", "0.5em")
        .attr("dx", "-0.5em"));
    
    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .attr("class", "axis")
      .call(d3.axisLeft(y).ticks(5))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick text")
        .attr("fill", "#e5e7eb")
        .style("font-size", "0.85rem"));
    
    // Линии сетки
    svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(${margin.left},0)`)
      .selectAll("line")
      .data(y.ticks(5))
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", width - margin.left - margin.right)
      .attr("y1", d => y(d))
      .attr("y2", d => y(d))
      .attr("stroke", "#374151")
      .attr("stroke-width", 0.5)
      .attr("stroke-dasharray", "3,3");
    
    // Основные столбцы
    const bars = svg.selectAll(".bar")
      .data(warehouseData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.name))
      .attr("y", height - margin.bottom)  // Начальная позиция для анимации
      .attr("width", x.bandwidth())
      .attr("height", 0)  // Начальная высота для анимации
      .attr("rx", 4)
      .attr("fill", "url(#warehouse-gradient)")
      .style("filter", "url(#dropShadow)")
      .on("mouseover", function(event, d) {
        d3.select(this)
          .style("filter", "url(#glow)")
          .attr("opacity", 1);
        
        // Создаем всплывающую подсказку
        const tooltip = d3.select(container)
          .append("div")
          .attr("class", "absolute z-10 p-3 rounded-lg shadow-xl bg-gray-800 border border-gray-700 text-white text-sm")
          .style("left", `${event.pageX - container.getBoundingClientRect().left + 10}px`)
          .style("top", `${event.pageY - container.getBoundingClientRect().top - 80}px`)
          .style("opacity", 0);
        
        // Содержимое подсказки
        tooltip.html(`
          <div class="font-medium text-base mb-1">${d.name}</div>
          <div class="grid grid-cols-2 gap-x-4 gap-y-1">
            <span class="text-gray-300">Количество:</span>
            <span class="font-medium text-white">${d.value.toLocaleString()}</span>
          </div>
        `);
        
        // Анимация появления подсказки
        tooltip.transition()
          .duration(200)
          .style("opacity", 1);
      })
      .on("mouseout", function() {
        d3.select(this)
          .style("filter", "url(#dropShadow)")
          .attr("opacity", 0.9);
        
        d3.select(container).selectAll(".absolute").remove();
      });
    
    // Анимация столбцов
    bars.transition()
      .duration(1000)
      .delay((d, i) => i * 50)
      .attr("y", d => y(d.value))
      .attr("height", d => height - margin.bottom - y(d.value))
      .ease(d3.easeCubicOut);
    
    // Подписи значений над столбцами
    svg.selectAll(".value-label")
      .data(warehouseData)
      .enter()
      .append("text")
      .attr("class", "value-label")
      .attr("x", d => x(d.name) + x.bandwidth() / 2)
      .attr("y", d => y(d.value) - 10)
      .attr("text-anchor", "middle")
      .attr("fill", "#f9fafb")
      .style("font-size", "0.85rem")
      .style("font-weight", "bold")
      .style("opacity", 0)
      .text(d => d.value.toLocaleString())
      .transition()
      .duration(800)
      .delay((d, i) => i * 50 + 500)
      .style("opacity", 1);
    
    // Добавляем название осей
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 5)
      .attr("text-anchor", "middle")
      .attr("fill", "#9ca3af")
      .style("font-size", "0.8rem")
      .text("Склады");
    
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", margin.left / 3)
      .attr("text-anchor", "middle")
      .attr("fill", "#9ca3af")
      .style("font-size", "0.8rem")
      .text("Количество");
    
    // Заголовок графика
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#f9fafb")
      .style("font-size", "1.2rem")
      .style("font-weight", "bold")
      .text("Остатки по складам");
      
  } else if (visualizationType === 'barChart') {
    // Горизонтальная столбчатая диаграмма для других разделов
    // Шкалы
    const x = d3.scaleLinear()
      .domain([0, d3.max(displayData, d => Math.max(d.value, showComparison ? (d.compareValue || 0) : 0)) * 1.1])
      .range([margin.left, width - margin.right]);
    
    const y = d3.scaleBand()
      .domain(displayData.map(d => d.name))
      .range([margin.top, height - margin.bottom])
      .padding(0.3);
    
    // Градиенты для элементов
    const gradientColors = {
      sales: {primary: "#3b82f6", secondary: "#1d4ed8"},
      export: {primary: "#10b981", secondary: "#047857"},
      import: {primary: "#f59e0b", secondary: "#b45309"}
    };
    
    // Основной градиент
    const defs = svg.append("defs");
    
    const gradient = defs
      .append("linearGradient")
      .attr("id", "bar-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");
    
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", gradientColors[activeSection].primary)
      .attr("stop-opacity", 0.9);
    
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", gradientColors[activeSection].secondary)
      .attr("stop-opacity", 0.7);
    
    // Градиент для данных сравнения
    if (showComparison) {
      const compareGradient = defs
        .append("linearGradient")
        .attr("id", "compare-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");
      
      compareGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#6b7280")
        .attr("stop-opacity", 0.7);
      
      compareGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#374151")
        .attr("stop-opacity", 0.6);
    }
    
    // Добавляем эффекты
    defs.append("filter")
      .attr("id", "dropShadow")
      .append("feDropShadow")
      .attr("stdDeviation", 3)
      .attr("flood-opacity", 0.3);
    
    defs.append("filter")
      .attr("id", "glow")
      .append("feGaussianBlur")
      .attr("stdDeviation", 2.5)
      .attr("result", "coloredBlur");
    
    // Оси
    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .attr("class", "axis")
      .call(d3.axisLeft(y).tickSize(0))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick text")
        .attr("fill", "#e5e7eb")
        .style("font-size", "0.85rem")
        .style("font-weight", "500"));
    
    // Линии сетки
    svg.append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(x.ticks(5))
      .enter()
      .append("line")
      .attr("x1", d => x(d))
      .attr("x2", d => x(d))
      .attr("y1", margin.top)
      .attr("y2", height - margin.bottom)
      .attr("stroke", "#374151")
      .attr("stroke-width", 0.5)
      .attr("stroke-dasharray", "3,3");
    
    // Полосы для данных сравнения (если включено)
    if (showComparison) {
      // Объединяем данные для корректного сравнения
      const combinedData = [...displayData];
      
      // Для каждого элемента сравнения находим соответствующий элемент в основных данных
      comparisonAggregated.forEach(compItem => {
        const primaryIndex = combinedData.findIndex(p => p.id === compItem.id);
        if (primaryIndex !== -1) {
          combinedData[primaryIndex].compareValue = compItem.value;
        } else {
          // Если элемент отсутствует в основных данных, добавляем его
          combinedData.push({
            ...compItem,
            compareValue: compItem.value,
            value: 0
          });
        }
      });
      
      // Сортируем и ограничиваем количество элементов
      const displayCombined = combinedData
        .sort((a, b) => Math.max(b.value, b.compareValue || 0) - Math.max(a.value, a.compareValue || 0))
        .slice(0, 10);
      
      // Сравнительные полосы (немного тоньше основных)
      svg.selectAll(".compare-bar")
        .data(displayCombined)
        .enter()
        .append("rect")
        .attr("class", "compare-bar")
        .attr("x", margin.left)
        .attr("y", d => y(d.name) + y.bandwidth() * 0.65)
        .attr("height", y.bandwidth() * 0.35)
        .attr("rx", 2)
        .attr("fill", "url(#compare-gradient)")
        .attr("opacity", 0.8)
        .attr("width", 0) // Начальная ширина для анимации
        .transition()
        .duration(900)
        .delay((d, i) => i * 50)
        .attr("width", d => x(d.compareValue || 0) - margin.left);
    }
    
    // Основные полосы
    const bars = svg.selectAll(".bar")
      .data(displayData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", margin.left)
      .attr("y", d => showComparison ? y(d.name) : y(d.name))
      .attr("height", showComparison ? y.bandwidth() * 0.65 : y.bandwidth())
      .attr("rx", 4)
      .attr("fill", "url(#bar-gradient)")
      .style("filter", "url(#dropShadow)")
      .attr("width", 0) // Начальная ширина для анимации
      .on("mouseover", function(event, d) {
        d3.select(this)
          .style("filter", "url(#glow)")
          .attr("opacity", 1);
        
        // Создаем всплывающую подсказку
        const tooltip = d3.select(container)
          .append("div")
          .attr("class", "absolute z-10 p-3 rounded-lg shadow-xl bg-gray-800 border border-gray-700 text-white text-sm")
          .style("left", `${event.pageX - container.getBoundingClientRect().left + 10}px`)
          .style("top", `${event.pageY - container.getBoundingClientRect().top - 80}px`)
          .style("opacity", 0);
        
        // Содержимое подсказки
        tooltip.html(`
          <div class="font-medium text-base mb-1">${d.name}</div>
          <div class="grid grid-cols-2 gap-x-4 gap-y-1">
            <span class="text-gray-300">Значение:</span>
            <span class="font-medium text-white">${d.value.toLocaleString()}</span>
            <span class="text-gray-300">Доля:</span>
            <span class="font-medium text-white">${d.percent}%</span>
            ${showComparison ? `
              <span class="text-gray-300">Сравнение:</span>
              <span class="font-medium text-white">${(d.compareValue || 0).toLocaleString()}</span>
              <span class="text-gray-300">Изменение:</span>
              <span class="font-medium ${d.value > (d.compareValue || 0) ? 'text-green-400' : 'text-red-400'}">
                ${(((d.value - (d.compareValue || 0)) / (d.compareValue || 1) * 100).toFixed(1))}%
              </span>
            ` : ''}
          </div>
        `);
        
        // Анимация появления подсказки
        tooltip.transition()
          .duration(200)
          .style("opacity", 1);
      })
      .on("mouseout", function() {
        d3.select(this)
          .style("filter", "url(#dropShadow)")
          .attr("opacity", 0.9);
        
        d3.select(container).selectAll(".absolute").remove();
      })
      .on("click", function(event, d) {
        // Действие при клике - например, переход к детальному анализу модели/региона
        setActiveDrilldown(d.id);
      });
    
    // Анимация полос
    bars.transition()
      .duration(1000)
      .delay((d, i) => i * 50)
      .attr("width", d => x(d.value) - margin.left)
      .ease(d3.easeCubicOut);
    
    // Подписи значений
    svg.selectAll(".value-label")
      .data(displayData)
      .enter()
      .append("text")
      .attr("class", "value-label")
      .attr("x", d => x(d.value) + 10)
      .attr("y", d => showComparison ? y(d.name) + y.bandwidth() * 0.3 : y(d.name) + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("fill", "#f9fafb")
      .style("font-size", "0.85rem")
      .style("font-weight", "bold")
      .style("opacity", 0)
      .text(d => d.value.toLocaleString())
      .transition()
      .duration(800)
      .delay((d, i) => i * 50 + 500)
      .style("opacity", 1);
    
    // Если включено сравнение, добавляем метки изменения
    if (showComparison) {
      svg.selectAll(".percent-change")
        .data(displayData)
        .enter()
        .append("text")
        .attr("class", "percent-change")
        .attr("x", d => Math.max(x(d.value), x(d.compareValue || 0)) + 60)
        .attr("y", d => y(d.name) + y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("fill", d => {
          const change = d.value - (d.compareValue || 0);
          return change >= 0 ? "#34d399" : "#f87171";
        })
        .style("font-size", "0.8rem")
        .style("font-weight", "medium")
        .style("opacity", 0)
        .text(d => {
          const change = d.value - (d.compareValue || 0);
          const percentChange = (d.compareValue || 1) !== 0 
            ? (change / (d.compareValue || 1) * 100).toFixed(1)
            : "100";
          return `${change >= 0 ? "+" : ""}${percentChange}%`;
        })
        .transition()
        .duration(800)
        .delay((d, i) => i * 50 + 800)
        .style("opacity", 1);
    }
    
  } else if (visualizationType === 'pieChart') {
    // Круговая диаграмма для отображения долей
    
    // Ограничиваем количество секторов (Top 6 + "Другие")
    let pieData = [...displayData];
    if (pieData.length > 6) {
      const topItems = pieData.slice(0, 6);
      const otherItems = pieData.slice(6);
      const otherValue = otherItems.reduce((sum, item) => sum + item.value, 0);
      const otherPercent = otherItems.reduce((sum, item) => sum + item.percent, 0);
      
      pieData = [
        ...topItems,
        {
          id: 'others',
          name: 'Другие',
          value: otherValue,
          percent: otherPercent
        }
      ];
    }
    
    const radius = Math.min(width, height) / 2 - 40;
    
    // Цветовая схема
    const colorScale = d3.scaleOrdinal()
      .domain(pieData.map(d => d.id))
      .range([
        "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", 
        "#ec4899", "#ef4444", "#6366f1", "#14b8a6"
      ]);
    
    const pie = d3.pie()
      .value(d => d.value)
      .sort(null);
    
    const arc = d3.arc()
      .innerRadius(radius * 0.5) // Делаем "пончик" вместо круга
      .outerRadius(radius);
    
    const hoverArc = d3.arc()
      .innerRadius(radius * 0.5)
      .outerRadius(radius * 1.05);
    
    // Центрируем диаграмму
    const g = svg.append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);
    
    // Добавляем градиенты для секторов
    const defs = svg.append("defs");
    
    pieData.forEach((d, i) => {
      const gradientId = `pie-gradient-${i}`;
      const gradient = defs.append("linearGradient")
        .attr("id", gradientId)
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "100%");
      
      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", d3.color(colorScale(d.id)).brighter(0.5));
      
      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", d3.color(colorScale(d.id)).darker(0.5));
    });
    
    // Эффект тени
    defs.append("filter")
      .attr("id", "drop-shadow")
      .append("feDropShadow")
      .attr("stdDeviation", 3)
      .attr("flood-opacity", 0.3);
    
    // Добавляем секторы
    const path = g.selectAll("path")
      .data(pie(pieData))
      .enter()
      .append("path")
      .attr("fill", (d, i) => `url(#pie-gradient-${i})`)
      .attr("stroke", "#1f2937")
      .attr("stroke-width", 2)
      .attr("d", arc)
      .style("filter", "url(#drop-shadow)")
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("d", hoverArc);
        
        // Всплывающая подсказка
        const tooltip = d3.select(container)
          .append("div")
          .attr("class", "absolute z-10 p-3 rounded-lg shadow-xl bg-gray-800 border border-gray-700 text-white text-sm")
          .style("left", `${event.pageX - container.getBoundingClientRect().left + 10}px`)
          .style("top", `${event.pageY - container.getBoundingClientRect().top - 80}px`)
          .style("opacity", 0);
        
        tooltip.html(`
          <div class="font-medium text-base mb-1">${d.data.name}</div>
          <div class="grid grid-cols-2 gap-x-4 gap-y-1">
            <span class="text-gray-300">Значение:</span>
            <span class="font-medium text-white">${d.data.value.toLocaleString()}</span>
            <span class="text-gray-300">Доля:</span>
            <span class="font-medium text-white">${d.data.percent}%</span>
          </div>
        `);
        
        tooltip.transition()
          .duration(200)
          .style("opacity", 1);
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("d", arc);
        
        d3.select(container).selectAll(".absolute").remove();
      })
      .on("click", function(event, d) {
        // Действие при клике (если нужно)
      });
    
    // Анимация появления
    path.transition()
      .duration(1000)
      .attrTween("d", function(d) {
        const i = d3.interpolate({ startAngle: d.startAngle, endAngle: d.startAngle }, d);
        return function(t) {
          return arc(i(t));
        };
      });
    
    // Центральная информация
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("fill", "#f9fafb")
      .style("font-size", "1.75rem")
      .style("font-weight", "bold")
      .text(summaryStats.total.toLocaleString());
    
    g.append("text")
     .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("y", 25)
      .attr("fill", "#d1d5db")
      .style("font-size", "0.85rem")
      .text("ВСЕГО");
    
    // Легенда
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 150}, ${height / 2 - pieData.length * 15})`);
    
    pieData.forEach((d, i) => {
      const lg = legend.append("g")
        .attr("transform", `translate(0, ${i * 30})`)
        .style("cursor", "pointer")
        .on("mouseover", function() {
         // Подсвечиваем соответствующий сектор
          const sector = path.filter((path, j) => j === i);
          sector.transition()
            .duration(200)
            .attr("d", hoverArc);
        })
        .on("mouseout", function() {
          // Возвращаем сектор к нормальному состоянию
          const sector = path.filter((path, j) => j === i);
          sector.transition()
            .duration(200)
            .attr("d", arc);
        });
      
      // Цветной квадрат
      lg.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("rx", 2)
        .attr("fill", colorScale(d.id));
      
      // Название
      lg.append("text")
        .attr("x", 20)
        .attr("y", 10)
        .text(d.name.length > 15 ? d.name.substring(0, 15) + "..." : d.name)
        .attr("fill", "#f9fafb")
        .style("font-size", "0.8rem");
    });
  } else if (visualizationType === 'heatmap') {
    // Тепловая карта для распределения по моделям и регионам
    
    // Получаем данные о распределении по регионам
    const regionDistribution = {};
    const modelNames = {};
    
    // Собираем данные распределения по регионам
    displayData.forEach(model => {
      modelNames[model.id] = model.name;
      Object.entries(model.regionData).forEach(([regionId, value]) => {
        if (!regionDistribution[regionId]) {
          regionDistribution[regionId] = {};
        }
        regionDistribution[regionId][model.id] = value;
      });
    });
    
    // Преобразуем в формат для тепловой карты
    const heatmapData = [];
    Object.entries(regionDistribution).forEach(([regionId, models]) => {
      Object.entries(models).forEach(([modelId, value]) => {
        // Находим соответствующее название региона
        const regionName = regions.find(r => r.id === regionId)?.name || regionId;
        
        heatmapData.push({
          region: regionName,
          model: modelNames[modelId],
          value: value
        });
      });
    });
    
    // Получаем уникальные значения для осей
    const regionNames = [...new Set(heatmapData.map(d => d.region))];
    const modelList = [...new Set(heatmapData.map(d => d.model))];
    
    // Размеры ячеек
    const cellSize = Math.min(
      (width - margin.left - margin.right) / modelList.length,
      (height - margin.top - margin.bottom) / regionNames.length
    );
    
    // Масштабы
    const x = d3.scaleBand()
      .domain(modelList)
      .range([margin.left, margin.left + cellSize * modelList.length]);
    
    const y = d3.scaleBand()
      .domain(regionNames)
      .range([margin.top, margin.top + cellSize * regionNames.length]);
    
    // Цветовая шкала
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, d3.max(heatmapData, d => d.value)]);
    
    // Оси
    svg.append("g")
      .attr("transform", `translate(0,${margin.top})`)
      .call(d3.axisTop(x).tickSize(0))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "start")
        .attr("dx", ".8em")
        .attr("dy", ".15em")
        .attr("fill", "#e5e7eb")
        .style("font-size", "0.7rem"));
    
    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).tickSize(0))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll("text")
        .attr("fill", "#e5e7eb")
        .style("font-size", "0.7rem"));
    
    // Ячейки тепловой карты
    const cells = svg.selectAll("rect")
      .data(heatmapData)
      .enter()
      .append("rect")
      .attr("x", d => x(d.model))
      .attr("y", d => y(d.region))
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("rx", 2)
      .attr("fill", d => colorScale(d.value))
      .attr("stroke", "#1f2937")
      .attr("stroke-width", 1)
      .attr("opacity", 0)
      .on("mouseover", function(event, d) {
        d3.select(this)
          .attr("stroke", "#f9fafb")
          .attr("stroke-width", 2);
        
        const tooltip = d3.select(container)
          .append("div")
          .attr("class", "absolute z-10 p-3 rounded-lg shadow-xl bg-gray-800 border border-gray-700 text-white text-sm")
          .style("left", `${event.pageX - container.getBoundingClientRect().left + 10}px`)
          .style("top", `${event.pageY - container.getBoundingClientRect().top - 60}px`)
          .style("opacity", 0);
        
        tooltip.html(`
          <div class="font-medium mb-1">${d.model}</div>
          <div class="text-gray-300">${d.region}</div>
          <div class="font-bold mt-1">${d.value.toLocaleString()}</div>
        `);
        
        tooltip.transition()
          .duration(200)
          .style("opacity", 1);
      })
      .on("mouseout", function() {
        d3.select(this)
          .attr("stroke", "#1f2937")
          .attr("stroke-width", 1);
        
        d3.select(container).selectAll(".absolute").remove();
      });
    
    // Анимация появления
    cells.transition()
      .duration(500)
      .delay((d, i) => i * 10)
      .attr("opacity", 1);
    
    // Подписи значений внутри ячеек
    svg.selectAll("text.cell-value")
      .data(heatmapData)
      .enter()
      .append("text")
      .attr("class", "cell-value")
      .attr("x", d => x(d.model) + x.bandwidth() / 2)
      .attr("y", d => y(d.region) + y.bandwidth() / 2)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("fill", d => d.value > d3.max(heatmapData, d => d.value) / 2 ? "#fff" : "#333")
      .style("font-size", "0.7rem")
      .style("font-weight", "medium")
      .style("opacity", 0)
      .text(d => d.value > 0 ? d.value.toLocaleString() : "")
      .transition()
      .duration(500)
      .delay((d, i) => i * 10 + 300)
      .style("opacity", 1);
  }
};

  
  // Рендеринг графика тренда
  const renderTrendChart = () => {
    const container = trendChartRef.current;
    d3.select(container).selectAll("*").remove();
    
    // Здесь будет логика отрисовки графика тренда (линейный график по периодам)
    // Для простоты этот метод оставим без реализации в данном примере
  };
  
  // Рендеринг графика распределения
  const renderDistributionChart = () => {
    const container = distributionChartRef.current;
    d3.select(container).selectAll("*").remove();
    
    // Здесь будет логика отрисовки графика распределения (круговая диаграмма)
    // Для простоты этот метод оставим без реализации в данном примере
  };
  
  // Функция для форматирования числа с разделителями и единицами измерения
  const formatNumber = (num, compact = false) => {
    if (num === 0) return '0';
    
    if (compact) {
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + ' млн';
      }
      if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + ' тыс';
      }
    }
    
    return num.toLocaleString('ru-RU');
  };
  
  // Основной интерфейс компонента
  return (
    <div className="bg-gray-900 text-white p-1 sm:p-5 rounded-lg shadow-xl">
      {/* Заголовок и основные элементы управления */}
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
       <h1 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-3 sm:mb-0">
  Производство 
</h1>
          
          <div className="flex items-center space-x-2">
            <button 
              className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                !isFiltersOpen ? 'bg-gray-700 hover:bg-gray-600' : 'bg-blue-600'
              }`}
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Фильтры
              </div>
            </button>
            
            <button 
              className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                !showComparison ? 'bg-gray-700 hover:bg-gray-600' : 'bg-blue-600'
              }`}
              onClick={() => setShowComparison(!showComparison)}
            >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Сравнение
              </div>
            </button>
          </div>
        </div>
      </div>
      
      {/* Панель фильтров и периодов */}
      <AnimatePresence>
        {isFiltersOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Выбор основного периода */}
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Период анализа</h3>
                  <div className="flex flex-wrap gap-2">
                    {timePresets.map(preset => (
                      <button
                        key={preset.id}
                        className={`px-3 py-1.5 text-sm rounded-md transition ${
                          timeRange.preset === preset.id 
                            ? 'bg-blue-600 text-white font-medium' 
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                        onClick={() => applyTimePreset(preset.id)}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  
                  {timeRange.preset === 'custom' && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">От</label>
                        <input 
                          type="date" 
                          className="w-full rounded bg-gray-700 border border-gray-600 px-3 py-1.5 text-sm"
                          value={timeRange.startDate.toISOString().split('T')[0]}
                          onChange={(e) => setTimeRange({
                            ...timeRange,
                            startDate: new Date(e.target.value)
                          })}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">До</label>
                        <input 
                          type="date" 
                          className="w-full rounded bg-gray-700 border border-gray-600 px-3 py-1.5 text-sm"
                          value={timeRange.endDate.toISOString().split('T')[0]}
                          onChange={(e) => setTimeRange({
                            ...timeRange,
                            endDate: new Date(e.target.value)
                          })}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Выбор периода сравнения */}
                {showComparison && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-2">Сравнить с периодом</h3>
                    <div className="flex flex-wrap gap-2">
                      {comparisonPresets.map(preset => (
                        <button
                          key={preset.id}
                          className={`px-3 py-1.5 text-sm rounded-md transition ${
                            comparisonRange.preset === preset.id 
                              ? 'bg-indigo-600 text-white font-medium' 
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                          onClick={() => applyComparisonPreset(preset.id)}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                    
                    {comparisonRange.preset === 'custom' && (
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">От</label>
                          <input 
                            type="date" 
                            className="w-full rounded bg-gray-700 border border-gray-600 px-3 py-1.5 text-sm"
                            value={comparisonRange.startDate.toISOString().split('T')[0]}
                            onChange={(e) => setComparisonRange({
                              ...comparisonRange,
                              startDate: new Date(e.target.value)
                            })}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">До</label>
                          <input 
                            type="date" 
                            className="w-full rounded bg-gray-700 border border-gray-600 px-3 py-1.5 text-sm"
                            value={comparisonRange.endDate.toISOString().split('T')[0]}
                            onChange={(e) => setComparisonRange({
                              ...comparisonRange,
                              endDate: new Date(e.target.value)
                            })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Дополнительные фильтры */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Модели</label>
                    <select 
                      multiple 
                      className="w-full rounded bg-gray-700 border border-gray-600 px-3 py-1.5 text-sm"
                      value={filters.models}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                        setFilters({...filters, models: selected});
                      }}
                    >
                      {carModels.map(model => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Регионы</label>
                    <select 
                      multiple 
                      className="w-full rounded bg-gray-700 border border-gray-600 px-3 py-1.5 text-sm"
                      value={filters.regions}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                        setFilters({...filters, regions: selected});
                      }}
                    >
                      {regions.map(region => (
                        <option key={region.id} value={region.id}>
                          {region.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Ключевые метрики */}
     <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
  <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4 shadow-md border border-gray-700 transform hover:scale-102 transition-transform">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-400 text-xs mb-1">
          Всего {activeSection === 'sales' ? 'продаж' : 
                activeSection === 'export' ? 'экспорт' : 
                activeSection === 'import' ? 'импорт' : 
                'на складах'}
        </p>
        <p className="text-2xl font-bold">{formatNumber(summaryStats.total)}</p>
        {showComparison && (
          <p className={`text-xs flex items-center mt-1 ${summaryStats.percentChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            <span className="mr-1">
              {summaryStats.percentChange >= 0 ? '↑' : '↓'}
            </span>
            {summaryStats.percentChange >= 0 ? '+' : ''}{summaryStats.percentChange}%
          </p>
        )}
      </div>
      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500 bg-opacity-20">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
    </div>
    <div className="h-1.5 bg-blue-900 rounded-full mt-3 overflow-hidden">
      <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full animate-pulse w-3/4"></div>
    </div>
  </div>
  
  <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4 shadow-md border border-gray-700 transform hover:scale-102 transition-transform">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-400 text-xs mb-1">Период анализа</p>
        <p className="text-lg font-bold truncate">{formatDateRange(timeRange)}</p>
        <p className="text-xs text-gray-400 mt-1">
          {Math.round((timeRange.endDate - timeRange.startDate) / (1000 * 60 * 60 * 24))} дней
        </p>
      </div>
      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-indigo-500 bg-opacity-20">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    </div>
    <div className="h-1.5 bg-indigo-900 rounded-full mt-3 overflow-hidden">
      <div className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full animate-pulse w-1/2"></div>
    </div>
  </div>
  
  <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4 shadow-md border border-gray-700 transform hover:scale-102 transition-transform">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-400 text-xs mb-1">
          {activeSection === 'import' ? 'Популярная категория' : 
           activeSection === 'inventory' ? 'Крупнейший склад' : 
           'Популярная модель'}
        </p>
        <p className="text-lg font-bold truncate">{summaryStats.topItem?.name || 'Нет данных'}</p>
        <p className="text-xs text-gray-400 mt-1">
          {activeSection === 'inventory' ? 'Количество: ' : 'Доля рынка: '}
          {summaryStats.topItem?.percent || 0}
          {activeSection === 'inventory' ? '' : '%'}
        </p>
      </div>
      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500 bg-opacity-20">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      </div>
    </div>
    <div className="h-1.5 bg-green-900 rounded-full mt-3 overflow-hidden">
      <div className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full animate-pulse w-2/3"></div>
    </div>
  </div>
  
  <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4 shadow-md border border-gray-700 transform hover:scale-102 transition-transform">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-400 text-xs mb-1">
          {activeSection === 'inventory' ? 'Всего складов' : 'Всего моделей'}
        </p>
        <p className="text-2xl font-bold">{primaryAggregated.length}</p>
        <p className="text-xs text-gray-400 mt-1">
          Анализ {activeSection === 'sales' ? 'продаж' : 
                 activeSection === 'export' ? 'экспорта' : 
                 activeSection === 'import' ? 'импорта' : 
                 'остатков'}
        </p>
      </div>
      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-500 bg-opacity-20">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
        </svg>
      </div>
    </div>
    <div className="h-1.5 bg-purple-900 rounded-full mt-3 overflow-hidden">
      <div className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full animate-pulse w-4/5"></div>
    </div>
  </div>
</div>
      
      {/* Секции анализа */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          className={`px-4 py-2 rounded transition-all ${activeSection === 'sales' 
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          onClick={() => setActiveSection('sales')}
        >
          Продажи
        </button>
        <button
          className={`px-4 py-2 rounded transition-all ${activeSection === 'export' 
            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg' 
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
    onClick={() => setActiveSection('export')}
        >
          Экспорт
        </button>
        <button
          className={`px-4 py-2 rounded transition-all ${activeSection === 'import' 
            ? 'bg-gradient-to-r from-yellow-600 to-amber-600 text-white shadow-lg' 
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          onClick={() => setActiveSection('import')}
        >
          Импорт
        </button>
      </div>
      
      {/* Режим визуализации */}
      <div className="flex space-x-1 mb-6 bg-gray-800 inline-flex p-1 rounded-lg">
        <button
          className={`px-3 py-1.5 text-sm rounded ${
            visualizationType === 'barChart' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
          }`}
          onClick={() => setVisualizationType('barChart')}
        >
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Столбцы
          </div>
        </button>
        <button
          className={`px-3 py-1.5 text-sm rounded ${
            visualizationType === 'pieChart' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
          }`}
          onClick={() => setVisualizationType('pieChart')}
        >
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            Круговая
          </div>
        </button>
        <button
          className={`px-3 py-1.5 text-sm rounded ${
            visualizationType === 'heatmap' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
          }`}
          onClick={() => setVisualizationType('heatmap')}
        >
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            Тепловая
          </div>
        </button>
      </div>
      
      {/* Основной график */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 mb-6 shadow-xl border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">
            {activeSection === 'sales' ? 'Продажи автомобилей' : 
             activeSection === 'export' ? 'Экспорт автомобилей' : 'Импорт автокомпонентов'}
            <span className="text-sm font-normal text-gray-400 ml-2">
              {formatDateRange(timeRange)}
              {showComparison ? ` vs ${formatDateRange(comparisonRange)}` : ''}
            </span>
          </h2>
          
          <div className="text-sm text-gray-400 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Интерактивный график</span>
          </div>
        </div>
        
        <div ref={mainChartRef} className="w-full" style={{ height: '400px' }}></div>
      </div>
      
      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 shadow-lg border border-gray-700">
          <h3 className="text-base font-medium mb-4">Модельный ряд</h3>
          
          <div className="grid grid-cols-2 gap-4">
            {carModels.slice(0, 4).map((model) => {
              const modelData = primaryAggregated.find(m => m.id === model.id);
              const value = modelData ? modelData.value : 0;
              const percent = modelData ? modelData.percent : 0;
              
              return (
                <div 
                  key={model.id}
                  className="p-3 bg-gray-900 rounded-lg border border-gray-800 hover:border-blue-500 transition-colors cursor-pointer"
                >
                  <div className="aspect-video overflow-hidden rounded-md mb-3">
                    <img 
                      src={model.img} 
                      alt={model.name} 
                      className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  
                  <h4 className="font-medium mb-2">{model.name}</h4>
                  
                  <div className="flex justify-between items-center text-sm">
                    <div>
                      <p className="text-gray-400 text-xs">Продажи</p>
                      <p className="font-bold">{formatNumber(value)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-xs">Доля</p>
                      <p className="font-bold">{percent}%</p>
                    </div>
                  </div>
                  
                  <div className="h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full" 
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
         <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 shadow-lg border border-gray-700">
          <h3 className="text-base font-medium mb-4">Динамика по месяцам</h3>
          
          <div ref={trendChartRef} className="w-full" style={{ height: '220px' }}></div>
        </div>
      </div> */}
      
      {/* Нижняя часть - Распределение и топ */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 shadow-lg border border-gray-700">
          <h3 className="text-base font-medium mb-4">Региональное распределение</h3>
          
          <div ref={distributionChartRef} className="w-full" style={{ height: '300px' }}></div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 shadow-lg border border-gray-700">
          <h3 className="text-base font-medium mb-4">Топ {activeSection === 'import' ? 'категории' : 'модели'}</h3>
          
          <div className="space-y-3">
            {primaryAggregated.slice(0, 5).map((item, idx) => (
              <div key={item.id} className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-medium mr-3">
                  {idx + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-gray-400">{formatNumber(item.value)}</span>
                    <span className="text-gray-400">{item.percent}%</span>
                  </div>
                  
                  <div className="h-1 bg-gray-700 rounded-full mt-1 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percent}%` }}
                      transition={{ duration: 1, delay: idx * 0.1 }}
                      className="h-full rounded-full"
                      style={{ 
                        background: idx === 0 
                          ? 'linear-gradient(to right, #3b82f6, #1d4ed8)'
                          : idx === 1
                            ? 'linear-gradient(to right, #10b981, #047857)'
                            : idx === 2
                              ? 'linear-gradient(to right, #f59e0b, #b45309)'
                              : 'linear-gradient(to right, #8b5cf6, #6d28d9)'
                      }}
                    ></motion.div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default AutoDashboard;