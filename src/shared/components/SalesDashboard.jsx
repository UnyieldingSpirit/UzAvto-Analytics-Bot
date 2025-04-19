'use client';

import React, { useState, useEffect, useMemo, useRef,useCallback } from 'react';
import {  Clock, Download, Check, AlertTriangle, ChevronDown, Truck, MapPin, 
  Archive, ChevronLeft, BarChart3, Users, Activity, ChevronRight,RefreshCcw, Zap, Calendar, Car, X  } from 'lucide-react';
import { carModels, regions } from '@/src/shared/mocks/mock-data';
import { useTelegram } from '@/src/hooks/useTelegram';
import * as d3 from 'd3';

// Компонент SalesChart
const SalesChart = ({ 
  salesData: initialSalesData, 
  lastYearSalesData: initialLastYearData, 
  months, 
  selectedModel,
  setSelectedModel,
  activeTab, 
  setActiveTab,
  period,
  setPeriod
}) => {
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [dateRange, setDateRange] = useState(period);
  const [isFilterAnimating, setIsFilterAnimating] = useState(false);
  
  const chartRef = useRef(null);
  const tooltipRef = useRef(null);
  const modelDropdownRef = useRef(null);
  const regionDropdownRef = useRef(null);
  
  // Генерация данных с учетом фильтров
  const filteredData = useMemo(() => {
    let sales = [...initialSalesData];
    let lastYear = [...initialLastYearData];
    
    if (selectedModel) {
      const modelIndex = carModels.findIndex(m => m.id === selectedModel);
      // Создаем более выраженную разницу для наглядности
      const factor = 0.6 + (modelIndex * 0.15);
      
      sales = sales.map(value => Math.round(value * factor));
      lastYear = lastYear.map(value => Math.round(value * (factor - 0.15)));
    }
    
    if (selectedRegion) {
      const regionIndex = regions.findIndex(r => r.id === selectedRegion);
      // Создаем более выраженную разницу для наглядности
      const regionFactor = 0.75 + (regionIndex * 0.08);
      
      sales = sales.map(value => Math.round(value * regionFactor));
      lastYear = lastYear.map(value => Math.round(value * (regionFactor - 0.1)));
    }
    
    return { sales, lastYear };
  }, [initialSalesData, initialLastYearData, selectedModel, selectedRegion]);
  
  const displaySalesData = filteredData.sales;
  const displayLastYearData = filteredData.lastYear;
  
  // Вычисляем максимальное значение для графика
  const maxValue = useMemo(() => {
    return showComparison 
      ? Math.max(...displaySalesData, ...displayLastYearData) * 1.1
      : Math.max(...displaySalesData) * 1.1;
  }, [displaySalesData, displayLastYearData, showComparison]);
  
  // Общая сумма продаж
  const totalSales = useMemo(() => 
    displaySalesData.reduce((a, b) => a + b, 0), [displaySalesData]);
  
  // Рост в сравнении с прошлым годом
  const growthPercent = useMemo(() => {
    const lastYearTotal = displayLastYearData.reduce((a, b) => a + b, 0);
    return ((totalSales - lastYearTotal) / lastYearTotal * 100).toFixed(1);
  }, [displaySalesData, displayLastYearData, totalSales]);

  // Анимация при изменении фильтров
  useEffect(() => {
    setIsFilterAnimating(true);
    const timer = setTimeout(() => {
      setIsFilterAnimating(false);
    }, 700);
    return () => clearTimeout(timer);
  }, [selectedModel, selectedRegion]);

  // Функция для рендеринга графика с анимацией
  const renderChart = useCallback(() => {
    if (!chartRef.current) return;
    
    const container = chartRef.current;
    const tooltip = tooltipRef.current;
    
    // Очистка существующего графика
    d3.select(container).selectAll('*').remove();
    
    // Размеры графика
    const margin = { top: 30, right: 30, bottom: 50, left: 60 };
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
      .domain(d3.range(displaySalesData.length))
      .range([0, width])
      .padding(0.4);
    
    const y = d3.scaleLinear()
      .domain([0, maxValue])
      .range([height, 0]);
    
    // Оси
    const xAxis = d3.axisBottom(x)
      .tickFormat(i => months[i % months.length])
      .tickSizeOuter(0);
    
    const yAxis = d3.axisLeft(y)
      .ticks(5)
      .tickFormat(d3.format(',d'))
      .tickSizeInner(-width)
      .tickSizeOuter(0);
    
    // Добавление осей
    svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#D1D5DB')
      .attr('font-size', '12px');
    
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
    const showTooltip = (event, d, i) => {
      const percentChange = displayLastYearData[i] > 0 
        ? ((d - displayLastYearData[i]) / displayLastYearData[i] * 100).toFixed(1) 
        : 0;
        
      const tooltipContent = `
        <div class="font-bold text-center mb-2 text-purple-300">${months[i % months.length]}</div>
        <table class="w-full">
          <tbody>
            <tr>
              <td class="py-1 text-gray-300">Текущий год:</td>
              <td class="py-1 font-bold text-right">${d.toLocaleString()}</td>
            </tr>
            ${showComparison ? `
              <tr>
                <td class="py-1 text-gray-300">Прошлый год:</td>
                <td class="py-1 font-bold text-right">${displayLastYearData[i].toLocaleString()}</td>
              </tr>
              <tr class="border-t border-gray-700">
                <td class="py-1 pt-2 text-gray-300">Изменение:</td>
                <td class="py-1 pt-2 font-bold text-right ${d > displayLastYearData[i] ? 'text-green-400' : 'text-red-400'}">
                  ${percentChange > 0 ? '+' : ''}${percentChange}%
                </td>
              </tr>
            ` : ''}
          </tbody>
        </table>
      `;
      
      // Позиционирование тултипа
      const tooltipWidth = 200;
      const tooltipHeight = showComparison ? 140 : 80;
      
      let xPos = event.pageX - container.getBoundingClientRect().left;
      let yPos = event.pageY - container.getBoundingClientRect().top - window.scrollY;
      
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
        .style('opacity', 1);
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
    
    // Рисуем столбцы прошлого года при активном сравнении
    if (showComparison) {
      svg.selectAll('.bar-last-year')
        .data(displayLastYearData)
        .enter()
        .append('rect')
        .attr('class', 'bar-last-year')
        .attr('x', (_, i) => x(i) - x.bandwidth() * 0.15)
        .attr('width', x.bandwidth() * 0.3)
        .attr('rx', 2)
        .attr('fill', 'rgba(59, 130, 246, 0.7)')
        .attr('filter', 'drop-shadow(0 0 2px rgba(59, 130, 246, 0.3))')
        .attr('y', height) // Начинаем с нуля для анимации
        .attr('height', 0)
        .on('mouseover', (event, d, i) => showTooltip(event, d, i))
        .on('mousemove', (event, d, i) => showTooltip(event, d, i))
        .on('mouseout', hideTooltip)
        .transition()
        .duration(800)
        .delay((_, i) => i * 30)
        .attr('y', d => y(d))
        .attr('height', d => height - y(d));
    }
    
    // Рисуем столбцы текущего года с анимацией
    svg.selectAll('.bar-current-year')
      .data(displaySalesData)
      .enter()
      .append('rect')
      .attr('class', 'bar-current-year')
      .attr('x', (_, i) => showComparison ? x(i) + x.bandwidth() * 0.15 : x(i))
      .attr('width', showComparison ? x.bandwidth() * 0.3 : x.bandwidth())
      .attr('rx', 2)
      .attr('fill', 'url(#purpleGradient)')
      .attr('filter', 'drop-shadow(0 0 5px rgba(168, 85, 247, 0.5))')
      .attr('y', height) // Начинаем с нуля для анимации
      .attr('height', 0)
      .on('mouseover', (event, d, i) => showTooltip(event, d, i))
      .on('mousemove', (event, d, i) => showTooltip(event, d, i))
      .on('mouseout', hideTooltip)
      .transition()
      .duration(800)
      .delay((_, i) => i * 30)
      .attr('y', d => y(d))
      .attr('height', d => height - y(d));
    
    // Добавляем метки изменений при сравнении
    if (showComparison) {
      displaySalesData.forEach((value, i) => {
        const percentChange = ((value - displayLastYearData[i]) / displayLastYearData[i] * 100);
        const isPositive = value > displayLastYearData[i];
        
        svg.append('text')
          .attr('x', x(i) + x.bandwidth() / 2)
          .attr('y', y(value) - 10)
          .attr('text-anchor', 'middle')
          .attr('font-size', '10px')
          .attr('font-weight', 'bold')
          .attr('fill', isPositive ? '#4ADE80' : '#F87171')
          .attr('opacity', 0)
          .text(isPositive ? '↑' : '↓')
          .transition()
          .duration(500)
          .delay(800 + i * 30)
          .attr('opacity', 1);
      });
    }
  }, [displaySalesData, displayLastYearData, showComparison, months, maxValue]);

  // Отслеживаем клики вне выпадающих списков для их закрытия
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

  // Инициализация графика при изменении зависимостей
  useEffect(() => {
    renderChart();
  }, [renderChart]);

  // Обработчик изменения размера окна
  useEffect(() => {
    const handleResize = () => renderChart();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderChart]);

  // Обработчики выбора
  const handleModelSelect = (modelId) => {
    if (setSelectedModel) {
      setSelectedModel(modelId === selectedModel ? null : modelId);
    }
    setShowModelDropdown(false);
  };

  const handleRegionSelect = (regionId) => {
    setSelectedRegion(regionId === selectedRegion ? null : regionId);
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
      if (setPeriod) setPeriod(newPeriod);
    }
  };
  
  // Применение выбранных дат
  const applyDateFilter = () => {
    if (setPeriod) setPeriod(dateRange);
    setShowPeriodModal(false);
  };
  
  // Переключатель сравнения с прошлым годом
  const toggleComparison = () => {
    setShowComparison(!showComparison);
  };
  
  // Информация о выбранных фильтрах
  const selectedModelInfo = useMemo(() => {
    if (!selectedModel) return null;
    return carModels.find(m => m.id === selectedModel);
  }, [selectedModel]);
  
  const selectedRegionInfo = useMemo(() => {
    if (!selectedRegion) return null;
    return regions.find(r => r.id === selectedRegion);
  }, [selectedRegion]);
  
  // Сброс всех фильтров
  const resetFilters = () => {
    if (setSelectedModel) setSelectedModel(null);
    setSelectedRegion(null);
  };
  
  // Функция для отображения категории модели
  const getModelCategory = (category) => {
    switch(category) {
      case 'suv': return 'Внедорожник';
      case 'sedan': return 'Седан';
      case 'minivan': return 'Минивэн';
      default: return category;
    }
  };
  
  return (
    <>
      {/* Заголовок с инфо о выборе */}
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <BarChart3 size={20} className="text-purple-400" />
          <div>
            Продажи за {activeTab === 'месяц' ? 'последние 30 дней' : 'год'}
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
          {/* Селектор периода */}
          <select 
            className="bg-gray-700 border border-gray-600 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
            onChange={handlePeriodChange}
          >
            <option value="30days">30 дней</option>
            <option value="7days">7 дней</option>
            <option value="90days">3 месяца</option>
            <option value="6months">6 месяцев</option>
            <option value="12months">12 месяцев</option>
            <option value="custom">Свой период...</option>
          </select>
          
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
                    if (setSelectedModel) setSelectedModel(null);
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
                        if (setSelectedModel) setSelectedModel(null);
                        setShowModelDropdown(false);
                      }}
                    >
                      <RefreshCcw size={10} />
                      Сбросить
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto py-1">
                  {carModels.map(model => (
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
                  ))}
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
                  {regions.map(region => (
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
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Кнопка сравнения */}
          <button 
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 text-sm border ${
              showComparison 
                ? 'bg-indigo-900/30 text-indigo-100 border-indigo-700'
                : 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600'
            }`}
            onClick={toggleComparison}
          >
            <Activity size={14} />
            <span>Сравнение с прошлым годом</span>
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
          
          {/* Экспорт */}
          <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-md text-white text-sm flex items-center gap-1.5">
            <Download size={14} />
            <span>Экспорт</span>
          </button>
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
        </div>
        
        {/* Легенда и статистика */}
        <div className="bg-gray-900 rounded-lg p-3 border border-gray-700 flex flex-wrap justify-between items-center">
          <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
              <div className="w-3 h-8 rounded-sm bg-gradient-to-t from-purple-700 via-purple-600 to-purple-500"></div>
              <span className="text-sm text-white">Текущий год</span>
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
              <span className="text-gray-400">Общая сумма:</span>
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
        
        {/* Переключатель между месяцами и годами */}
        <div className="mt-3 flex justify-between items-center">
          <div className="inline-flex rounded-md overflow-hidden border border-gray-700">
            <button
              className={`px-3 py-1.5 text-sm font-medium ${
                activeTab === 'месяц' 
                  ? 'bg-purple-700 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => setActiveTab('месяц')}
            >
              Месяцы
            </button>
            <button
              className={`px-3 py-1.5 text-sm font-medium ${
                activeTab === 'год' 
                  ? 'bg-purple-700 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => setActiveTab('год')}
            >
              Годы
            </button>
          </div>
          
          <button 
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-md flex items-center gap-1.5 border border-gray-700"
            onClick={() => setShowPeriodModal(true)}
          >
            <Calendar size={14} />
            <span>Выбрать даты</span>
          </button>
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
  const [showPeriodFilter, setShowPeriodFilter] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const { hapticFeedback } = useTelegram();
  
  const [period, setPeriod] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Данные продаж за прошлый год для сравнения
  const lastYearSalesData = [60, 70, 58, 82, 65, 75, 80, 68, 79, 85, 60, 70];
  const salesData = [75, 82, 65, 90, 70, 85, 92, 78, 88, 94, 65, 75];

  // Вычисляем максимальное значение для графика с учетом режима сравнение 
  const maxValue = showComparison 
    ? Math.max(...salesData, ...lastYearSalesData) 
    : Math.max(...salesData);
  
  // Создаем маппинг моделей для быстрого доступа
  const carModelMap = useMemo(() => {
    return carModels.reduce((acc, model) => {
      acc[model.id] = model;
      return acc;
    }, {});
  }, []);

  // Данные о задолженностях по контрактам (переименовано)
  const contractDebtData = {
    notShipped: 64,  // Распределены, но не отгружены в течение 48 часов
    inTransit: 48,   // В пути более 3 дней
    delivered: 96    // Доставлены
  };

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

  // Использование данных внутри компонента
  const debtData = useMemo(() => {
    const data = generateDebtData();
    return selectedModel 
      ? data.filter(item => item.modelId === selectedModel)
      : data;
  }, [selectedModel]);

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

  // Данные по регионам для каждого статуса (с учетом фильтрации по модели)
  const getRegionData = (status, modelId) => {
    const baseData = regions.slice(0, 5).map((region, index) => {
      // Генерация значений с учетом выбранной модели
      let value;
      if (status === 'notShipped') {
        value = 24 - (index * 5);
      } else {
        value = 15 - (index * 3);
      }
      
      // Если выбрана модель, уменьшаем значения пропорционально
      if (modelId) {
        const modelIndex = carModels.findIndex(m => m.id === modelId);
        const factor = 0.7 - (modelIndex * 0.15); // Разные факторы для разных моделей
        value = Math.floor(value * factor);
      }
      
      return {
        name: region.name,
        value: value > 0 ? value : 1 // Минимальное значение 1
      };
    });
    
    return baseData;
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

  // Данные по дилерам для каждого региона и статуса
  const getDealerData = (status, regionName, selectedModelId) => {
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

  // Рендеринг содержимого бокового окна
  const renderSidebarContent = () => {
    if (activeDetailLevel === 0 || !selectedStatus) return null;

    const statusTitle = selectedStatus === 'notShipped' ? 'Не отгружено >48ч' : 'В пути >3 дней';
    const statusColor = selectedStatus === 'notShipped' ? 'blue' : 'yellow';
    const statusIcon = selectedStatus === 'notShipped' ? <Archive size={20} /> : <Truck size={20} />;

    // Уровень 1: Список регионов
    if (activeDetailLevel === 1) {
      const regions = regionData[selectedStatus];
      const maxRegionValue = getMaxValue(regions);
      
      return (
        <div className="h-full flex flex-col">
          <div className="flex items-center gap-2 p-3 border-b border-gray-700 bg-gray-800/70">
            <div className={`text-${statusColor}-400`}>{statusIcon}</div>
            <h3 className="text-lg font-medium text-white">
              {statusTitle}
              {selectedModel && (
                <span className="ml-2 text-sm text-gray-400">
                  • {carModels.find(m => m.id === selectedModel)?.name}
                </span>
              )}
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            <div className="text-sm text-gray-400 mb-3 px-2">Выберите регион для детализации:</div>
            
            <div className="space-y-2">
              {regions.map((region, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg border ${selectedRegion === region.name ? `bg-${statusColor}-900/30 border-${statusColor}-700` : 'bg-gray-800/60 border-gray-700'} 
                    hover:bg-gray-700/70 cursor-pointer transition-all`}
                  onClick={() => handleRegionSelect(region.name)}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={16} className={`text-${statusColor}-400`} />
                      <span className="text-white font-medium">{region.name}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full bg-${statusColor}-900/40 text-${statusColor}-300`}>
                      {region.value}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full bg-${statusColor}-600`}
                        style={{ width: `${(region.value / maxRegionValue) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-400 w-12 text-right">
                      {Math.round((region.value / maxRegionValue) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    // Уровень 2: Список дилеров для выбранного региона
    if (activeDetailLevel === 2 && selectedRegion) {
      const dealers = dealerData[selectedStatus][selectedRegion] || [];
      const maxDealerValue = dealers.length > 0 ? getMaxValue(dealers) : 0;
      
      return (
        <div className="h-full flex flex-col">
          <div className="flex items-center gap-2 p-3 border-b border-gray-700 bg-gray-800/70">
            <button 
              onClick={handleBack}
              className="p-1 rounded-full hover:bg-gray-700"
            >
              <ChevronLeft size={18} />
            </button>
            <h3 className="text-lg font-medium text-white">
              <span className={`text-${statusColor}-400 text-sm mr-1`}>{statusTitle}</span>
              {selectedRegion}
              {selectedModel && (
                <span className="ml-2 text-sm text-gray-400">
                  • {carModels.find(m => m.id === selectedModel)?.name}
                </span>
              )}
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            <div className="text-sm text-gray-400 mb-3 px-2">Список дилеров:</div>
            
            <div className="space-y-2">
              {dealers.map((dealer, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg border ${selectedDealer === dealer.name ? `bg-${statusColor}-900/30 border-${statusColor}-700` : 'bg-gray-800/60 border-gray-700'} 
                    hover:bg-gray-700/70 cursor-pointer transition-all`}
                  onClick={() => handleDealerSelect(dealer.name)}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Users size={16} className="text-gray-400" />
                      <span className="text-white font-medium">{dealer.name}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full bg-${statusColor}-900/40 text-${statusColor}-300`}>
                      {dealer.value}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full bg-${statusColor}-600`}
                        style={{ width: `${(dealer.value / maxDealerValue) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-400 w-12 text-right">
                      {Math.round((dealer.value / maxDealerValue) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    // Уровень 3: Детализация по моделям для выбранного дилера
    if (activeDetailLevel === 3 && selectedDealer && selectedRegion) {
      const dealers = dealerData[selectedStatus][selectedRegion] || [];
      const dealer = dealers.find(d => d.name === selectedDealer);
      
      if (!dealer) return null;
      
      return (
        <div className="h-full flex flex-col">
          <div className="flex items-center gap-2 p-3 border-b border-gray-700 bg-gray-800/70">
            <button 
              onClick={handleBack}
              className="p-1 rounded-full hover:bg-gray-700"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex flex-col">
              <h3 className="text-lg font-medium text-white">{selectedDealer}</h3>
              <div className="flex items-center text-sm">
                <span className={`text-${statusColor}-400 mr-1`}>{statusTitle}</span>
                <span className="text-gray-400">• {selectedRegion}</span>
                {selectedModel && (
                  <span className="ml-2 text-gray-400">
                    • {carModels.find(m => m.id === selectedModel)?.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3">
            <div className="bg-gray-800/70 rounded-lg p-4 mb-4 border border-gray-700">
              <div className="flex justify-between items-center mb-3">
                <div className="text-sm text-gray-400">Всего автомобилей:</div>
                <div className="text-2xl font-bold text-white">{dealer.value}</div>
              </div>
              
              <div className="mb-2 text-sm text-gray-400">Распределение по моделям:</div>
              
              <div className="space-y-2">
                {dealer.models.map((model, idx) => {
                  const percentage = (model.count / dealer.value) * 100;
                  
                  return (
                    <div key={idx} className="bg-gray-700/50 rounded-lg p-2 border border-gray-600/50">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-md overflow-hidden bg-gray-600/30">
                            <img 
                              src={model.img} 
                              alt={model.name} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-white">{model.name}</span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full bg-${statusColor}-900/40 text-${statusColor}-300`}>
                          {model.count}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full bg-${statusColor}-600`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-400 w-10 text-right">
                          {Math.round(percentage)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="bg-gray-800/70 rounded-lg p-4 border border-gray-700">
              <h4 className="font-medium text-white mb-3">Рекомендуемые действия:</h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm">
                  <Clock size={16} className="text-gray-400 mt-0.5" />
                  <span className="text-gray-300">Запросить обновление статуса</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <AlertTriangle size={16} className="text-yellow-400 mt-0.5" />
                  <span className="text-gray-300">Проверить договоры на отложенные поставки</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Zap size={16} className="text-green-400 mt-0.5" />
                  <span className="text-gray-300">Связаться с менеджером дилерского центра</span>
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
      {/* Плавающая боковая панель */}
      <div 
        className={`fixed top-0 right-0 h-full w-80 bg-gray-850 backdrop-blur-sm border-l border-gray-700 shadow-xl transform transition-transform duration-300 z-50 
        ${showSidebar ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ backgroundColor: 'rgba(17, 24, 39, 0.95)' }}
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
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              period={period}
              setPeriod={setPeriod}
            />
          </div>
          
          {/* УЛУЧШЕННАЯ ТАБЛИЦА ЗАДОЛЖЕННОСТИ ПО КОНТРАКТАМ */}
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
      Общая просрочка: <span className="font-bold">{totalDebtDays} {getDayWord(totalDebtDays)}</span>
    </div>
  </div>
  
  <div className="p-3">
    <div className="rounded-lg overflow-hidden border border-gray-700">
      <table className="w-full text-sm">
        <thead className="bg-gray-900/80">
          <tr>
            <th className="px-3 py-2 text-left text-gray-400 font-medium">№ Контракта</th>
            <th className="px-3 py-2 text-left text-gray-400 font-medium">Модель</th>
            <th className="px-3 py-2 text-right text-gray-400 font-medium">Сумма долга (UZS)</th>
            <th className="px-3 py-2 text-center text-gray-400 font-medium">Просрочка</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {debtData.map((item, index) => (
            <tr key={index} className={`${index % 2 === 0 ? 'bg-gray-800/60' : 'bg-gray-850/70'} hover:bg-gray-700/70`}>
              <td className="px-3 py-2 font-medium text-white">{item.contractId}</td>
              <td className="px-3 py-2 text-gray-300">
                <div className="flex items-center gap-2">
                  <span>{item.modelName}</span>
                </div>
              </td>
              <td className="px-3 py-2 text-right text-gray-300 font-medium">{item.debt.toLocaleString()}</td>
              <td className="px-3 py-2 text-center">
                <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                  item.days > 7 ? 'bg-red-900/30 text-red-400 border border-red-800/50' :
                  item.days > 3 ? 'bg-orange-900/30 text-orange-400 border border-orange-800/50' :
                  'bg-yellow-900/30 text-yellow-400 border border-yellow-800/50'
                }`}>
                  {item.days} {getDayWord(item.days)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-900/80">
          <tr>
            <td className="px-3 py-2 font-medium text-white">Итого</td>
            <td></td>
            <td className="px-3 py-2 text-right font-medium text-white">
              {debtData.reduce((sum, item) => sum + item.debt, 0).toLocaleString()} UZS
            </td>
            <td className="px-3 py-2 text-center text-red-400 text-xs font-medium">
              В среднем: {avgDebtDays} {getDayWord(avgDebtDays)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</div>
        </div>
        
        {/* Панель моделей автомобилей - с интерактивным выбором */}
        {/* <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg border border-gray-700/50 shadow-md overflow-hidden mt-5">
          <div className="flex justify-between items-center p-3 border-b border-gray-700">
            <h3 className="text-base font-medium text-white flex items-center gap-2">
              <Car size={18} className="text-green-400" />
              Популярные модели
            </h3>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {modelSalesData.map((car, index) => (
                <div 
                  key={index} 
                  className={`bg-gray-700/40 rounded-lg p-3 border transition-all ${
                    selectedModel === car.id 
                      ? 'border-green-500 bg-gray-700/70 shadow-[0_0_10px_rgba(34,197,94,0.3)]' 
                      : 'border-gray-600/50 hover:bg-gray-700/60'
                  }`}
                  onClick={() => handleModelSelect(car.id)}
                >
                  <div className="h-32 flex items-center justify-center mb-3 bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-lg">
                    <img 
                      src={car.img} 
                      alt={car.name} 
                      className="h-full object-contain p-2"
                    />
                  </div>
                  <div className="text-center">
                    <h4 className="text-white font-medium mb-1">{car.name}</h4>
                    <div className="text-xs text-gray-400 mb-2">
                      {car.category === 'suv' && 'Внедорожник'}
                      {car.category === 'sedan' && 'Седан'}
                      {car.category === 'minivan' && 'Минивэн'}
                      {car.category === 'hatchback' && 'Хэтчбек'}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Продано:</span>
                      <span className="text-sm text-white font-medium">{car.sales}</span>
                    </div>
                    <div className="mt-1 w-full bg-gray-800 rounded-full h-1.5">
                      <div 
                        className="h-1.5 rounded-full bg-green-600"
                        style={{ width: `${car.percent}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {selectedModel === car.id && (
                    <div className="mt-3 flex justify-center">
                      <button 
                        className="w-full py-1.5 text-xs bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedModel(null);
                        }}
                      >
                        Сбросить фильтр
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-4 flex justify-center">
              <button className="flex items-center gap-1.5 px-4 py-2 bg-gray-700 rounded-md text-sm text-white hover:bg-gray-600 transition-colors">
                <span>Показать все модели</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default SalesDashboard;