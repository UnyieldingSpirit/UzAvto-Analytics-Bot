"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as d3 from 'd3';
import { D3Visualizer } from '@/src/utils/dataVisualizer';

// Структура для типов продаж
const SALE_TYPES = {
  RETAIL: {
    id: 'retail',
    name: 'Розничные продажи',
    color: '#3b82f6' // blue
  },
  WHOLESALE: {
    id: 'wholesale',
    name: 'Оптовые продажи',
    color: '#8b5cf6' // purple
  },
  PROMO: {
    id: 'promo',
    name: 'Акционные продажи',
    color: '#ec4899' // pink
  }
};

// Названия месяцев
const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

// Форматирование больших чисел с сокращениями (млн, млрд)
const formatShortNumber = (number) => {
  if (number >= 1000000000) {
    return `${(number / 1000000000).toFixed(1)}B`; // миллиарды
  } else if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1)}M`; // миллионы
  } else if (number >= 1000) {
    return `${(number / 1000).toFixed(1)}K`; // тысячи
  }
  return Math.round(number).toLocaleString('ru-RU');
};

// Генерация демо-данных
const generateFinancialData = () => {
  const years = [2023, 2024, 2025];
  
  const data = {};
  
  // Базовые значения для создания реалистичных данных
  const baseRetail = 350000;
  const baseWholesale = 500000;
  const basePromo = 200000;
  
  // Сезонные коэффициенты (больше в летние месяцы и под конец года)
  const seasonalFactors = [
    0.7, 0.75, 0.9, 0.95, 1.1, 1.3, 
    1.4, 1.3, 1.1, 1.0, 1.2, 1.5
  ];
  
  // Годовой рост для создания тренда
  const yearlyGrowthFactors = {
    2023: 1,
    2024: 1.35,
    2025: 1.8
  };
  
  years.forEach(year => {
    // Генерация целевых показателей
    const targetAmount = Math.round((5000000 + Math.random() * 5000000) * yearlyGrowthFactors[year]);
    
    data[year] = {
      targetAmount,
      totalEarned: 0,
      months: [],
      quarterlyData: [0, 0, 0, 0], // Данные по кварталам
      categories: { // Накопительные данные по категориям
        retail: 0,
        wholesale: 0,
        promo: 0
      }
    };
    
    let yearlyTotal = 0;
    
    // Создаем небольшие случайные колебания для каждой категории и месяца
    const retailVariation = Array(12).fill().map(() => 0.8 + Math.random() * 0.4);
    const wholesaleVariation = Array(12).fill().map(() => 0.8 + Math.random() * 0.4);
    const promoVariation = Array(12).fill().map(() => 0.8 + Math.random() * 0.4);
    
    MONTHS.forEach((month, monthIndex) => {
      // Применяем сезонность, годовой рост и случайные вариации
      const retail = Math.round(
        baseRetail * seasonalFactors[monthIndex] * yearlyGrowthFactors[year] * retailVariation[monthIndex]
      );
      
      const wholesale = Math.round(
        baseWholesale * seasonalFactors[monthIndex] * yearlyGrowthFactors[year] * wholesaleVariation[monthIndex]
      );
      
      const promo = Math.round(
        basePromo * seasonalFactors[monthIndex] * yearlyGrowthFactors[year] * promoVariation[monthIndex]
      );
      
      const monthTotal = retail + wholesale + promo;
      yearlyTotal += monthTotal;
      
      // Обновляем квартальные данные
      const quarterIndex = Math.floor(monthIndex / 3);
      data[year].quarterlyData[quarterIndex] += monthTotal;
      
      // Обновляем категории
      data[year].categories.retail += retail;
      data[year].categories.wholesale += wholesale;
      data[year].categories.promo += promo;
      
      data[year].months.push({
        name: month,
        month: monthIndex + 1,
        retail,
        wholesale,
        promo,
        total: monthTotal
      });
    });
    
    data[year].totalEarned = yearlyTotal;
  });
  
  return data;
};

// Основной компонент
export default function EnhancedFinancialAnalytics() {
  // Стейты для управления данными и фильтрами
  const [financialData, setFinancialData] = useState({});
  const [selectedYears, setSelectedYears] = useState([2024]); // Теперь может быть несколько выбранных лет
  const [filteredData, setFilteredData] = useState([]);
  const [displayMode, setDisplayMode] = useState('period'); // 'yearly', 'period', 'compare'
  const getCurrentMonthAndYear = () => {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear()
  };
  };
  // Стейты для фильтров по периоду
const currentDate = getCurrentMonthAndYear();
const [startMonth, setStartMonth] = useState(1); // Начинаем с января
const [startYear, setStartYear] = useState(currentDate.year - 1); // Прошлый год
const [endMonth, setEndMonth] = useState(currentDate.month); // Текущий месяц
const [endYear, setEndYear] = useState(currentDate.year);
  
  // Стейты для представления
  const [viewType, setViewType] = useState('bar'); // 'bar', 'line', 'stacked', 'area', 'radar', 'mixed'
  const [focusCategory, setFocusCategory] = useState('all'); // 'all', 'retail', 'wholesale', 'promo'
  const [showQuarterlyData, setShowQuarterlyData] = useState(false);
  
  // Refs для контейнеров графиков
  const mainChartRef = useRef(null);
  const progressChartRef = useRef(null);
  const detailsChartRef = useRef(null);
  const yearlyTrendChartRef = useRef(null);
  const yearComparisonChartRef = useRef(null);
  const forecastChartRef = useRef(null);
  const categoryDistributionRef = useRef(null);
  const quarterlyChartRef = useRef(null);
  
  // Инициализация данных
  useEffect(() => {
    setFinancialData(generateFinancialData());
  }, []);
  
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
    }
  };
  
  useEffect(() => {
    if (Object.keys(financialData).length === 0) return;
    
    if (displayMode === 'yearly' || displayMode === 'compare') {
      // Фильтрация по выбранному году или годам
      const allFilteredData = [];
      
      selectedYears.forEach(year => {
        if (financialData[year]) {
          financialData[year].months.forEach(month => {
            allFilteredData.push({
              ...month,
              year
            });
          });
        }
      });
      
      setFilteredData(allFilteredData);
    } else if (displayMode === 'period') {

      const filteredMonths = [];
      
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
      
      setFilteredData(filteredMonths);
    }
  }, [
    financialData, selectedYears, displayMode, 
    startMonth, startYear, endMonth, endYear
  ]);
  
  // Отрисовка графиков
// Отрисовка графиков
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
  
  // Функция отрисовки основного графика
  const renderMainChart = () => {
    if (!mainChartRef.current) return;
    
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
        renderMultiLineChart();
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
      // Отрисовка радарного графика для сравнения месяцев
      renderRadarChart();
    } else if (viewType === 'mixed') {
      // Комбинированный график (столбцы + линия)
      renderMixedChart();
    }
  };
  
  // Пользовательский линейный график с дополнительными функциями
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
  

// Модификация функции renderPeriodComparisonTable для создания столбчатого графика
// Функция для более удобного форматирования больших чисел
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

// Модифицированная функция рендеринга периода
const renderPeriodComparisonTable = () => {
  if (!mainChartRef.current || !filteredData.length) return;
  
  // Очистка контейнера
  mainChartRef.current.innerHTML = '';
  
  // Группируем данные по месяцам для сравнения между годами
  const monthsData = {};
  
  // Собираем все данные в структуру по месяцам и годам
  filteredData.forEach(item => {
    const monthKey = item.month; // Используем номер месяца как ключ
    
    if (!monthsData[monthKey]) {
      monthsData[monthKey] = {
        month: monthKey,
        name: item.name,
        years: {}
      };
    }
    
    // Добавляем данные для текущего года и месяца
    const value = focusCategory === 'all' ? item.total : item[focusCategory];
    monthsData[monthKey].years[item.year] = value;
  });
  
  // Преобразуем в массив и сортируем по номеру месяца
  const sortedMonths = Object.values(monthsData).sort((a, b) => a.month - b.month);
  
  // Получаем уникальные годы из данных и сортируем их
  const years = [...new Set(filteredData.map(item => item.year))].sort();
  
  // Создаем SVG
  const width = mainChartRef.current.clientWidth;
  const height = 400;
  const margin = { top: 50, right: 120, bottom: 70, left: 70 };
  
  const svg = d3.select(mainChartRef.current)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('background', '#1f2937')
    .style('border-radius', '0.5rem');
  
  // Добавляем заголовок
  const monthRangeText = startMonth === endMonth && startYear === endYear 
    ? `${MONTHS[startMonth-1]} ${startYear}` 
    : `${MONTHS[startMonth-1]} - ${MONTHS[endMonth-1]} (${startYear}${startYear !== endYear ? `-${endYear}` : ''})`;
  
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', margin.top / 2)
    .attr('text-anchor', 'middle')
    .style('font-size', '1.2rem')
    .style('font-weight', 'bold')
    .style('fill', '#f9fafb')
    .text(`Сравнение ${focusCategory !== 'all' ? SALE_TYPES[focusCategory.toUpperCase()].name.toLowerCase() : 'продаж'} за период: ${monthRangeText}`);
  
  // Определяем шкалы для группированных столбцов
  // Создаем массив групп месяцев
  const groups = sortedMonths.map(m => m.name);
  
  // Создаем шкалы
  const x0 = d3.scaleBand()
    .domain(groups)
    .range([margin.left, width - margin.right])
    .padding(0.2);
  
  const x1 = d3.scaleBand()
    .domain(years)
    .range([0, x0.bandwidth()])
    .padding(0.05);
  
  // Находим максимальное значение для шкалы Y
  const maxValue = d3.max(sortedMonths, month => 
    d3.max(Object.values(month.years), value => value || 0)
  );
  
  const y = d3.scaleLinear()
    .domain([0, maxValue * 1.1])
    .nice()
    .range([height - margin.bottom, margin.top]);
  
  // Создаем цветовую схему для разных лет
  const colorScale = d3.scaleOrdinal()
    .domain(years)
    .range(years.map((_, i) => {
      // Если есть фокус на категории, используем её цвет как базовый
      if (focusCategory !== 'all') {
        const baseColor = d3.hsl(SALE_TYPES[focusCategory.toUpperCase()].color);
        baseColor.l = 0.4 + (i * 0.15); // Регулируем яркость для разных лет
        return baseColor.toString();
      }
      // Иначе используем стандартную палитру цветов
      return d3.schemeCategory10[i % d3.schemeCategory10.length];
    }));
  
  // Добавляем оси
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
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => formatProfitCompact(d)))
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('text').style('fill', '#f9fafb'))
    .call(g => g.selectAll('.tick line')
      .attr('x2', width - margin.left - margin.right)
      .attr('stroke-opacity', 0.1));
  
  // Добавляем оси на SVG
  svg.append('g').call(xAxis);
  svg.append('g').call(yAxis);
  
  // Создаем группы для каждого месяца
  const monthGroups = svg.append('g')
    .selectAll('g')
    .data(sortedMonths)
    .join('g')
    .attr('transform', d => `translate(${x0(d.name)},0)`);
  
  // Для каждой группы месяцев добавляем столбцы по годам
  monthGroups.selectAll('rect')
    .data(d => years.map(year => ({
      year,
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
    // Анимация появления
    .attr('y', height - margin.bottom)
    .attr('height', 0)
    .transition()
    .duration(800)
    .delay((d, i) => i * 50)
    .attr('y', d => y(d.value))
    .attr('height', d => height - margin.bottom - y(d.value));
  
  // Добавляем подписи значений над столбцами
  monthGroups.selectAll('text')
    .data(d => years.map(year => ({
      year,
      value: d.years[year] || 0,
      month: d.name
    })))
    .join('text')
    .filter(d => d.value > 0) // Подписываем только ненулевые значения
    .attr('x', d => x1(d.year) + x1.bandwidth() / 2)
    .attr('y', d => y(d.value) - 5)
    .attr('text-anchor', 'middle')
    .style('font-size', '0.7rem')
    .style('fill', '#f9fafb')
    .style('opacity', 0)
    .text(d => formatProfitCompact(d.value))
    .transition()
    .duration(500)
    .delay((d, i) => 800 + i * 50)
    .style('opacity', 1);
  
  // Добавляем легенду
  const legend = svg.append('g')
    .attr('transform', `translate(${width - margin.right + 20}, ${margin.top})`);
  
  // Создаем строки легенды для каждого года
  years.forEach((year, i) => {
    const legendRow = legend.append('g')
      .attr('transform', `translate(0, ${i * 25})`);
    
    // Прямоугольник с цветом года
    legendRow.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('rx', 3)
      .attr('fill', colorScale(year));
    
    // Текст с годом
    legendRow.append('text')
      .attr('x', 25)
      .attr('y', 12)
      .style('font-size', '0.9rem')
      .style('fill', '#f9fafb')
      .text(year);
    
    // Если есть более одного года, добавляем процент изменения
    if (years.length > 1 && i > 0) {
      // Получаем суммарные значения для текущего и предыдущего годов
      const currentYearTotal = sortedMonths.reduce((sum, month) => 
        sum + (month.years[year] || 0), 0);
      
      const prevYear = years[i-1];
      const prevYearTotal = sortedMonths.reduce((sum, month) => 
        sum + (month.years[prevYear] || 0), 0);
      
      // Если предыдущий год имеет ненулевые значения, показываем процент изменения
      if (prevYearTotal > 0) {
        const growthPercent = ((currentYearTotal / prevYearTotal) - 1) * 100;
        const growthText = `${growthPercent >= 0 ? '+' : ''}${growthPercent.toFixed(1)}%`;
        
        legendRow.append('text')
          .attr('x', 70)
          .attr('y', 12)
          .style('font-size', '0.8rem')
          .style('fill', growthPercent >= 0 ? '#10b981' : '#ef4444')
          .text(growthText);
      }
    }
  });
  
  // Добавляем подпись к оси Y для уточнения формата чисел
  svg.append('text')
    .attr('x', margin.left - 50)
    .attr('y', margin.top - 10)
    .style('font-size', '0.7rem')
    .style('fill', '#9ca3af')
    .text('* 1M = 1 000 000');
  
  return svg.node();
};
// Добавляем новую функцию для создания сгруппированных столбцов сравнения
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

  // Мультилинейный график для сравнения по годам
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
                    <span style="margin-left: 12px;">${d3.format(',.0f')(monthData.value)} ₽</span>
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
  
  // Функция для отрисовки радарного графика
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
  
  // Комбинированный график (столбцы + линия)
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
  
  // Круговой индикатор выполнения плана с дополнительными индикаторами
// Кардинально переработанный круговой индикатор выполнения плана
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
    .style('margin-bottom', '15px')
    .style('text-align', 'center')
    .text('Прогресс выполнения плана продаж');
  
  // Создаем контейнер для кругового прогресс-бара
  const progressContainer = container.append('div')
    .style('position', 'relative')
    .style('width', '150px')
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
  
  // Отрисовка пирога по категориям
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
      .text(d => `${d3.format(',.0f')(d.value)} ₽ (${d3.format('.1f')((d.value / total) * 100)}%)`);
  };
    
    // Отрисовка графика тренда
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
  
  // Функция для отрисовки прогноза
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
      .text(`Ожидаемый рост: +${growthPercentage.toFixed(1)}% (${(nextYearEstimate / 1000000).toFixed(2)} млн ₽)`)
      .transition()
      .delay(2500)
      .duration(500)
      .style('opacity', 1);
  };
  
  // Функция для отрисовки распределения по категориям
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
  
  // Функция для отрисовки квартальных данных
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
  
  // Форматирование суммы для отображения
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Получение суммы для заданного периода
  const getTotalForPeriod = () => {
    if (!filteredData.length) return 0;
    return filteredData.reduce((sum, month) => sum + month.total, 0);
  };
  
  // Обработчик переключения режима отображения
// Обработчик переключения режима отображения
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
  
  // Проверка корректности выбранного периода
  const isPeriodValid = () => {
    if (startYear > endYear) return false;
    if (startYear === endYear && startMonth > endMonth) return false;
    return true;
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
        Финансовая аналитика
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-gray-400 mt-2"
      >
        Анализ финансовых показателей и динамики продаж
      </motion.p>
    </header>
    
    {/* РАЗДЕЛ: Панель управления и фильтры */}
    <div className="bg-gray-800/80 shadow-xl backdrop-blur-sm rounded-xl p-5 mb-6 border border-gray-700/50">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-4">
          <h2 className="text-xl font-semibold text-white">Параметры отображения</h2>
          
          <div className="flex bg-gray-700/80 rounded-lg p-1">
            <button 
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                displayMode === 'yearly' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
              }`}
              onClick={() => handleDisplayModeChange('yearly')}
            >
              По годам
            </button>
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
            className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/50"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-300 mb-2 text-sm">Начало периода:</p>
                <div className="flex space-x-3">
                  <select 
                    value={startMonth}
                    onChange={(e) => setStartMonth(parseInt(e.target.value))}
                    className="bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white flex-1"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <option key={`start-month-${month}`} value={month}>
                        {new Date(2000, month - 1).toLocaleString('ru', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                  
                  <select 
                    value={startYear}
                    onChange={(e) => setStartYear(parseInt(e.target.value))}
                    className="bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white w-24"
                  >
                    {Object.keys(financialData).map(year => (
                      <option key={`start-year-${year}`} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <p className="text-gray-300 mb-2 text-sm">Конец периода:</p>
                <div className="flex space-x-3">
                  <select 
                    value={endMonth}
                    onChange={(e) => setEndMonth(parseInt(e.target.value))}
                    className="bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white flex-1"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <option key={`end-month-${month}`} value={month}>
                        {new Date(2000, month - 1).toLocaleString('ru', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                  
                  <select 
                    value={endYear}
                    onChange={(e) => setEndYear(parseInt(e.target.value))}
                    className="bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white w-24"
                  >
                    {Object.keys(financialData).map(year => (
                      <option key={`end-year-${year}`} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {!isPeriodValid() && (
              <div className="mt-3 text-red-400 text-sm bg-red-900/20 p-2 rounded-md border border-red-700/30">
                Ошибка: дата начала периода должна быть раньше даты окончания
              </div>
            )}
            
            {isPeriodValid() && (
              <div className="mt-3 text-green-400 text-sm">
                Выбранный период: с {new Date(startYear, startMonth - 1).toLocaleString('ru', { month: 'long', year: 'numeric' })} 
                &nbsp;по {new Date(endYear, endMonth - 1).toLocaleString('ru', { month: 'long', year: 'numeric' })}
              </div>
            )}
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
                <h3 className="text-lg font-medium text-purple-300">Средний чек</h3>
                <p className="text-3xl font-bold text-white mt-1">
                  {formatCurrency(Math.round(getTotalForPeriod() / (filteredData.length * 20)))}
                </p>
                <p className="text-purple-300/70 text-sm mt-1">
                  На основе примерного количества транзакций
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
                  +{displayMode === 'yearly' 
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
          <div className="lg:col-span-2 bg-gray-800 rounded-xl p-5 border border-gray-700/50 shadow-lg">
            <div ref={mainChartRef} className="w-full h-full"></div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700/50 shadow-lg">
            <h3 className="text-xl font-semibold text-white mb-4 text-center">Выполнение плана</h3>
            <div ref={progressChartRef} className="w-full h-64"></div>
          </div>
        </div>
        
        {/* РАЗДЕЛ: Детализация и распределение по категориям */}
        {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700/50 shadow-lg">
            <h3 className="text-xl font-semibold text-white mb-4">Структура продаж по категориям</h3>
            <div ref={detailsChartRef} className="w-full"></div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700/50 shadow-lg">
            <h3 className="text-xl font-semibold text-white mb-4">Распределение по категориям</h3>
            <div ref={categoryDistributionRef} className="w-full"></div>
          </div>
        </div> */}
        
        {/* РАЗДЕЛ: Тренд по годам и прогноз */}
        {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700/50 shadow-lg">
            <h3 className="text-xl font-semibold text-white mb-4">Динамика по годам</h3>
            <div ref={yearlyTrendChartRef} className="w-full"></div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700/50 shadow-lg">
            <h3 className="text-xl font-semibold text-white mb-4">Прогноз на следующий год</h3>
            <div ref={forecastChartRef} className="w-full"></div>
          </div>
        </div> */}
        
        {/* РАЗДЕЛ: Сравнение по годам (условное отображение) */}
        {/* {displayMode === 'compare' && (
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700/50 shadow-lg mb-6">
            <h3 className="text-xl font-semibold text-white mb-4">Сравнение по годам</h3>
            <div ref={yearComparisonChartRef} className="w-full"></div>
          </div>
        )} */}
        
        {/* РАЗДЕЛ: Квартальная аналитика (условное отображение) */}
        {/* {showQuarterlyData && (
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700/50 shadow-lg mb-6">
            <h3 className="text-xl font-semibold text-white mb-4">Квартальная аналитика</h3>
            <div ref={quarterlyChartRef} className="w-full"></div>
          </div>
        )} */}
        
        {/* РАЗДЕЛ: Панель инструментов и действий */}
        {/* <div className="bg-gray-800/80 rounded-xl p-5 border border-gray-700/50 shadow-lg mb-6">
          <h3 className="text-xl font-semibold text-white mb-4">Аналитические действия</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 transition-colors rounded-lg p-4 text-blue-300 border border-blue-500/30"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Экспорт данных
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 transition-colors rounded-lg p-4 text-purple-300 border border-purple-500/30"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              Подробный анализ
            </motion.button>
            <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-2 bg-green-600/20 hover:bg-green-600/30 transition-colors rounded-lg p-4 text-green-300 border border-green-500/30"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                  <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                </svg>
                Составить отчет
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/30 transition-colors rounded-lg p-4 text-red-300 border border-red-500/30"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Предложить стратегию
              </motion.button>
            </div>
          </div> */}
        </>
        )}
      
      {/* Если данные не загружены */}
      {/* {filteredData.length === 0 && (
        <div className="flex items-center justify-center h-64 bg-gray-800 rounded-xl border border-gray-700/50">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-gray-400">Загрузка данных...</p>
          </div>
        </div>
      )} */}
      
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