'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useTranslation } from '../../hooks/useTranslation';
import { warehouseAnalyticsTranslations } from './locales/WarehouseAnalytics';
import ContentReadyLoader from '../layout/ContentReadyLoader';
import { useThemeStore } from '../../store/theme';
import { useAuth } from '../../hooks/useAuth';
import { axiosInstance } from '../../utils/axiosConfig';


const WarehouseMonthlyChart = ({ isDark = false, enhancedCarModels = [] }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedModel, setSelectedModel] = useState('all');
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const availableModels = enhancedCarModels.length > 0 
    ? enhancedCarModels.slice(0, 6).map(m => ({
        id: m.id,
        name: m.name,
        color: m.category === 'suv' ? '#3b82f6' : 
               m.category === 'sedan' ? '#10b981' : 
               m.category === 'minivan' ? '#f59e0b' : '#8b5cf6'
      }))
    : [
        { id: 'tracker-2', name: 'TRACKER-2', color: '#3b82f6' },
        { id: 'cobalt', name: 'COBALT', color: '#10b981' },
        { id: 'onix', name: 'ONIX', color: '#10b981' },
        { id: 'malibu-2', name: 'MALIBU-2', color: '#10b981' },
        { id: 'tahoe', name: 'TAHOE', color: '#3b82f6' },
        { id: 'equinox', name: 'EQUINOX', color: '#3b82f6' }
      ];

  // Генерация моковых данных по месяцам с разбивкой по моделям
  const generateMockData = () => {
    const months = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    
    const currentMonth = new Date().getMonth();
    const currentYear = 2025;
    
    return months.slice(0, currentMonth + 1).map((month, index) => {
      const seasonalFactor = 1 + (Math.sin((index - 3) * Math.PI / 6) * 0.15);
      const trendFactor = 1 + (index * 0.02);
      const randomFactor = 0.9 + Math.random() * 0.2;
      
      // Генерируем данные для каждой модели
      const modelData = {};
      let totalForMonth = 0;
      
      availableModels.forEach(model => {
        const baseValue = 
          model.name === 'TRACKER-2' ? 600 :
          model.name === 'COBALT' ? 450 :
          model.name === 'ONIX' ? 400 :
          model.name === 'MALIBU-2' ? 350 :
          model.name === 'TAHOE' ? 250 :
          model.name === 'EQUINOX' ? 300 : 400;
          
        const modelTotal = Math.round(baseValue * seasonalFactor * trendFactor * randomFactor);
        modelData[model.id] = modelTotal;
        totalForMonth += modelTotal;
      });
      
      return {
        month,
        monthIndex: index,
        year: currentYear,
        date: new Date(currentYear, index, 1),
        total: selectedModel === 'all' ? totalForMonth : modelData[selectedModel] || 0,
        ...modelData
      };
    });
  };

  // Генерация данных по дням для выбранного месяца
  const generateDailyData = (monthIndex, monthName, year) => {
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const monthData = data.find(d => d.monthIndex === monthIndex);
    const dailyData = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayVariation = 0.95 + Math.random() * 0.1;
      const date = new Date(year, monthIndex, day);
      
      if (selectedModel === 'all') {
        // Данные для всех моделей
        const dayModelData = {};
        availableModels.forEach(model => {
          const modelMonthTotal = monthData[model.id] || 0;
          const modelDayTotal = Math.round((modelMonthTotal / daysInMonth) * dayVariation);
          dayModelData[model.name] = modelDayTotal;
        });
        
        const dayTotal = Object.values(dayModelData).reduce((sum, val) => sum + val, 0);
        
        dailyData.push({
          day,
          date,
          dateStr: `${String(day).padStart(2, '0')}.${String(monthIndex + 1).padStart(2, '0')}.${year}`,
          total: dayTotal,
          ...dayModelData
        });
      } else {
        // Данные для конкретной модели
        const modelMonthTotal = monthData[selectedModel] || 0;
        const dayTotal = Math.round((modelMonthTotal / daysInMonth) * dayVariation);
        
        // Распределяем по статусам
        const available = Math.round(dayTotal * 0.4);
        const reserved = Math.round(dayTotal * 0.35);
        const defective = Math.round(dayTotal * 0.05);
        const defectiveOk = Math.round(dayTotal * 0.1);
        const tradeIn = Math.round(dayTotal * 0.1);
        
        dailyData.push({
          day,
          date,
          dateStr: `${String(day).padStart(2, '0')}.${String(monthIndex + 1).padStart(2, '0')}.${year}`,
          total: dayTotal,
          available,
          reserved,
          defective,
          defectiveOk,
          tradeIn
        });
      }
    }
    
    return dailyData;
  };

  const [data, setData] = useState(generateMockData());
  const [dailyData, setDailyData] = useState([]);

  // Обновляем данные при изменении выбранной модели
  useEffect(() => {
    setData(generateMockData());
    setSelectedMonth(null);
    setDailyData([]);
  }, [selectedModel]);

  // Обновление размеров
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: width - 40,
          height: Math.min(450, width * 0.5)
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Отрисовка графика
  useEffect(() => {
    if (!dimensions.width || !dimensions.height || !data.length) return;

    const margin = { top: 20, right: 40, bottom: 80, left: 70 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', dimensions.width)
      .attr('height', dimensions.height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Масштабы
    const xScale = d3.scaleBand()
      .domain(data.map(d => d.month))
      .range([0, width])
      .padding(0.25);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.total) * 1.1])
      .range([height, 0])
      .nice();

    // Цвет для выбранной модели
    const barColor = selectedModel === 'all' 
      ? '#3b82f6' 
      : availableModels.find(m => m.id === selectedModel)?.color || '#3b82f6';

    // Градиент для столбцов
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'barGradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0).attr('y1', height)
      .attr('x2', 0).attr('y2', 0);

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', d3.rgb(barColor).darker(0.5))
      .attr('stop-opacity', 1);

    gradient.append('stop')
      .attr('offset', '50%')
      .attr('stop-color', barColor)
      .attr('stop-opacity', 1);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', d3.rgb(barColor).brighter(0.5))
      .attr('stop-opacity', 1);

    // Тень для столбцов
    const filter = svg.append('defs')
      .append('filter')
      .attr('id', 'shadow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    filter.append('feGaussianBlur')
      .attr('in', 'SourceAlpha')
      .attr('stdDeviation', 3);

    filter.append('feOffset')
      .attr('dx', 0)
      .attr('dy', 2);

    filter.append('feComponentTransfer')
      .append('feFuncA')
      .attr('type', 'linear')
      .attr('slope', 0.2);

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode');
    feMerge.append('feMergeNode')
      .attr('in', 'SourceGraphic');

    // Сетка
    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale)
        .ticks(5)
        .tickSize(-width)
        .tickFormat('')
      )
      .selectAll('line')
      .style('stroke', isDark ? '#374151' : '#e5e7eb')
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0.5);

    // Линия среднего значения
    const avgValue = d3.mean(data, d => d.total);
    g.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', yScale(avgValue))
      .attr('y2', yScale(avgValue))
      .attr('stroke', isDark ? '#6b7280' : '#9ca3af')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .attr('opacity', 0.7);

    g.append('text')
      .attr('x', width - 5)
      .attr('y', yScale(avgValue) - 5)
      .attr('text-anchor', 'end')
      .style('fill', isDark ? '#6b7280' : '#9ca3af')
      .style('font-size', '11px')
      .text(`Среднее: ${Math.round(avgValue).toLocaleString('ru-RU')}`);

    // Группы для столбцов
    const barGroups = g.selectAll('.bar-group')
      .data(data)
      .enter().append('g')
      .attr('class', 'bar-group')
      .style('cursor', 'pointer');

    // Столбцы
    barGroups.append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.month))
      .attr('y', height)
      .attr('width', xScale.bandwidth())
      .attr('height', 0)
      .attr('fill', 'url(#barGradient)')
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('filter', 'url(#shadow)')
      .on('click', function(event, d) {
        if (selectedMonth?.monthIndex === d.monthIndex) {
          setSelectedMonth(null);
          setDailyData([]);
          g.selectAll('.bar')
            .transition()
            .duration(200)
            .attr('opacity', 1);
        } else {
          setSelectedMonth(d);
          setDailyData(generateDailyData(d.monthIndex, d.month, d.year));
          g.selectAll('.bar')
            .transition()
            .duration(200)
            .attr('opacity', function(data) {
              return data.monthIndex === d.monthIndex ? 1 : 0.5;
            });
        }
      })
      .on('mouseover', function(event, d) {
        if (selectedMonth?.monthIndex !== d.monthIndex) {
          d3.select(this)
            .transition()
            .duration(100)
            .attr('transform', `translate(0, -5)`);
        }
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .transition()
          .duration(100)
          .attr('transform', 'translate(0, 0)');
      })
      .transition()
      .duration(800)
      .delay((d, i) => i * 60)
      .attr('y', d => yScale(d.total))
      .attr('height', d => height - yScale(d.total));

    // Значения на столбцах
    barGroups.append('text')
      .attr('class', 'label')
      .attr('x', d => xScale(d.month) + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.total) - 10)
      .attr('text-anchor', 'middle')
      .style('fill', isDark ? '#f3f4f6' : '#1f2937')
      .style('font-size', '13px')
      .style('font-weight', '600')
      .style('opacity', 0)
      .text(d => d.total.toLocaleString('ru-RU'))
      .transition()
      .duration(800)
      .delay((d, i) => i * 60 + 400)
      .style('opacity', 1);

    // Оси
    const xAxis = g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('fill', isDark ? '#9ca3af' : '#4b5563')
      .style('font-size', '12px');

    g.append('g')
      .call(d3.axisLeft(yScale)
        .ticks(5)
        .tickFormat(d => d.toLocaleString('ru-RU'))
      )
      .selectAll('text')
      .style('fill', isDark ? '#9ca3af' : '#4b5563')
      .style('font-size', '12px');

    // Подпись оси Y
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left + 15)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('fill', isDark ? '#9ca3af' : '#4b5563')
      .style('font-size', '12px')
      .text('Количество автомобилей');

  }, [data, dimensions, isDark, selectedMonth, selectedModel]);

  // Вычисление изменения
  const calculateChange = () => {
    if (data.length < 2) return { value: 0, isPositive: true };
    const lastValue = data[data.length - 1].total;
    const prevValue = data[data.length - 2].total;
    const change = ((lastValue - prevValue) / prevValue) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      isPositive: change >= 0
    };
  };

  const change = calculateChange();
  const currentTotal = data.length > 0 ? data[data.length - 1].total : 0;

  return (
    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md overflow-hidden`}>
      {/* Заголовок */}
      <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Динамика складских запасов
            </h3>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {selectedModel === 'all' 
                ? 'Общее количество автомобилей по месяцам' 
                : `${availableModels.find(m => m.id === selectedModel)?.name || ''} - динамика по месяцам`}
            </p>
          </div>
          <div className={`flex items-center gap-4`}>
            <div className={`text-right`}>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Текущий остаток</div>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {currentTotal.toLocaleString('ru-RU')}
              </div>
            </div>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              change.isPositive 
                ? isDark ? 'bg-green-900/20' : 'bg-green-50' 
                : isDark ? 'bg-red-900/20' : 'bg-red-50'
            }`}>
              {change.isPositive ? (
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              <span className={`text-sm font-semibold ${
                change.isPositive ? 'text-green-500' : 'text-red-500'
              }`}>
                {change.value}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Табы для выбора модели */}
      <div className={`px-6 py-3 ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setSelectedModel('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              selectedModel === 'all'
                ? `${isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`
                : `${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100'}`
            }`}
          >
            Все модели
          </button>
          {availableModels.map(model => (
            <button
              key={model.id}
              onClick={() => setSelectedModel(model.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                selectedModel === model.id
                  ? `text-white`
                  : `${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100'}`
              }`}
              style={{
                backgroundColor: selectedModel === model.id ? model.color : undefined
              }}
            >
              {model.name}
            </button>
          ))}
        </div>
      </div>

      {/* График */}
      <div className="px-6 py-4">
        <div ref={containerRef} className="relative">
          <svg ref={svgRef}></svg>
        </div>
      </div>

      {/* Информация о выбранном месяце */}
      {selectedMonth && (
        <div className={`mx-6 mb-4 px-4 py-3 rounded-lg ${
          isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className={`text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                {selectedMonth.month} {selectedMonth.year}
              </span>
            </div>
            <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {selectedMonth.total.toLocaleString('ru-RU')} автомобилей
            </span>
          </div>
        </div>
      )}

      {/* Таблица с детализацией по дням */}
      {selectedMonth && dailyData.length > 0 && (
        <div className={`px-6 pb-6`}>
          <div className={`${isDark ? 'bg-gray-900/50' : 'bg-gray-50'} rounded-lg overflow-hidden`}>
            <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Детализация по дням - {selectedMonth.month} {selectedMonth.year}
              </h4>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`text-xs ${isDark ? 'bg-gray-800/50 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                    <th className="text-left p-3 font-medium">Дата</th>
                    <th className="text-right p-3 font-medium">Всего</th>
                    {selectedModel === 'all' 
                      ? availableModels.map(model => (
                          <th key={model.id} className="text-right p-3 font-medium">{model.name}</th>
                        ))
                      : (
                        <>
                          <th className="text-right p-3 font-medium">Доступно</th>
                          <th className="text-right p-3 font-medium">Забронировано</th>
                          <th className="text-right p-3 font-medium">Брак-ОК</th>
                          <th className="text-right p-3 font-medium">Брак</th>
                          <th className="text-right p-3 font-medium">Trade-in</th>
                        </>
                      )
                    }
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-200'}`}>
                  {dailyData.map((day) => {
                    const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
                    return (
                      <tr 
                        key={day.day} 
                        className={`text-sm ${
                          isWeekend 
                            ? isDark ? 'bg-gray-800/30' : 'bg-gray-50' 
                            : ''
                        } ${isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'} transition-colors`}
                      >
                        <td className={`p-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{day.dateStr}</span>
                          </div>
                        </td>
                        <td className={`p-3 text-right font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {day.total.toLocaleString('ru-RU')}
                        </td>
                        {selectedModel === 'all' 
                          ? availableModels.map(model => (
                              <td key={model.id} className={`p-3 text-right ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {(day[model.name] || 0).toLocaleString('ru-RU')}
                              </td>
                            ))
                          : (
                            <>
                              <td className={`p-3 text-right ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                                {(day.available || 0).toLocaleString('ru-RU')}
                              </td>
                              <td className={`p-3 text-right ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                {(day.reserved || 0).toLocaleString('ru-RU')}
                              </td>
                              <td className={`p-3 text-right ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                {(day.defectiveOk || 0).toLocaleString('ru-RU')}
                              </td>
                              <td className={`p-3 text-right ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                                {(day.defective || 0).toLocaleString('ru-RU')}
                              </td>
                              <td className={`p-3 text-right ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                                {(day.tradeIn || 0).toLocaleString('ru-RU')}
                              </td>
                            </>
                          )
                        }
                      </tr>
                    );
                  })}
                  {/* Итоговая строка */}
                  <tr className={`font-semibold text-sm ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <td className={`p-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Итого за месяц</td>
                    <td className={`p-3 text-right ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {dailyData.reduce((sum, day) => sum + day.total, 0).toLocaleString('ru-RU')}
                    </td>
                    {selectedModel === 'all' 
                      ? availableModels.map(model => (
                          <td key={model.id} className={`p-3 text-right ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {dailyData.reduce((sum, day) => sum + (day[model.name] || 0), 0).toLocaleString('ru-RU')}
                          </td>
                        ))
                      : (
                        <>
                          <td className={`p-3 text-right ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                            {dailyData.reduce((sum, day) => sum + (day.available || 0), 0).toLocaleString('ru-RU')}
                          </td>
                          <td className={`p-3 text-right ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                            {dailyData.reduce((sum, day) => sum + (day.reserved || 0), 0).toLocaleString('ru-RU')}
                          </td>
                          <td className={`p-3 text-right ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                            {dailyData.reduce((sum, day) => sum + (day.defectiveOk || 0), 0).toLocaleString('ru-RU')}
                          </td>
                          <td className={`p-3 text-right ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                            {dailyData.reduce((sum, day) => sum + (day.defective || 0), 0).toLocaleString('ru-RU')}
                          </td>
                          <td className={`p-3 text-right ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                            {dailyData.reduce((sum, day) => sum + (day.tradeIn || 0), 0).toLocaleString('ru-RU')}
                          </td>
                        </>
                      )
                    }
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CarWarehouseAnalytics = () => {
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';
    const { checkAuth } = useAuth();
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);
  const { t } = useTranslation(warehouseAnalyticsTranslations);
  const [lastUpdateDate, setLastUpdateDate] = useState(null);
  // Refs для графиков
  const warehouseDistributionRef = useRef(null);
  const manufacturerChartRef = useRef(null);
  const modelInventoryChartRef = useRef(null);
  const colorDistributionRef = useRef(null);
  const warehouseOccupancyRef = useRef(null);
  
  // Состояния
  const [selectedCarModel, setSelectedCarModel] = useState(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [selectedModification, setSelectedModification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Состояния для обработанных данных
  const [enhancedCarModels, setEnhancedCarModels] = useState([]);
  const [enhancedWarehouses, setEnhancedWarehouses] = useState([]);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [totalDefective, setTotalDefective] = useState(0);
  const [totalDefectiveOk, setTotalDefectiveOk] = useState(0);
  const [totalReserved, setTotalReserved] = useState(0);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [totalTradeIn, setTotalTradeIn] = useState(0); // Новое состояние для Trade-in
  
  // Дополнительные состояния для улучшенного взаимодействия
  const [selectedWarehouseModel, setSelectedWarehouseModel] = useState(null);
  const [warehouseModelViewTab, setWarehouseModelViewTab] = useState('modifications');
  const [modificationFilter, setModificationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [colorFilter, setColorFilter] = useState('');
  const [notifications, setNotifications] = useState([]);
  
  // Состояние для адаптивного дизайна
  const [isMobile, setIsMobile] = useState(false);
  
  // Отслеживание размера экрана для адаптивности
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
  // Фильтрация модификаций
  const filteredModifications = useMemo(() => {
    if (!selectedCarModel) return [];
    
    return selectedCarModel.modifications.filter(mod => {
      const matchesText = mod.name.toLowerCase().includes(modificationFilter.toLowerCase());
      if (!matchesText) return false;
      
      if (statusFilter === 'all') return true;
      if (statusFilter === 'available' && mod.available > 0) return true;
      if (statusFilter === 'reserved' && mod.reserved > 0) return true;
      if (statusFilter === 'defectiveOk' && mod.defectiveOk > 0) return true;
      if (statusFilter === 'defective' && mod.defective > 0) return true;
      if (statusFilter === 'tradeIn' && mod.tradeIn > 0) return true;
      
      return false;
    });
  }, [selectedCarModel, modificationFilter, statusFilter]);
  
  // Фильтрация цветов
  const filteredColors = useMemo(() => {
    if (!selectedCarModel) return [];
    
    return selectedCarModel.colors.filter(color => 
      color.name.toLowerCase().includes(colorFilter.toLowerCase())
    );
  }, [selectedCarModel, colorFilter]);
  
  // Функция для добавления уведомления
  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Автоматическое скрытие через 5 секунд
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };
  
  // Загрузка данных с API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const token = localStorage.getItem('authToken');

const response = await axiosInstance.post('https://uzavtoanalytics.uz/dashboard/proxy', {
  url: '/b/dashboard/infos&get_stock'
}, {
  headers: {
    'X-Auth': `Bearer ${token}`
  }
});
        
        console.log('Полный ответ API:', response.data);
        
        let updateDate = null;
        let warehouses = [];
        
        if (Array.isArray(response.data)) {
          const firstDataEntry = response.data[0];
          
          if (firstDataEntry && firstDataEntry.date && firstDataEntry.data) {
            updateDate = firstDataEntry.date;
            warehouses = firstDataEntry.data;
            console.log('Найдена структура с date и data в массиве');
          } else {
            console.error('Неожиданная структура в первом элементе:', firstDataEntry);
            throw new Error('Неожиданная структура данных от API');
          }
        } else {
          console.error('Ответ не является массивом:', response.data);
          throw new Error('Данные от API не в ожидаемом формате');
        }
        
        if (!warehouses || !Array.isArray(warehouses)) {
          console.error('Warehouses не является массивом:', warehouses);
          throw new Error('Данные складов отсутствуют или имеют неверный формат');
        }
        
        console.log('Дата обновления:', updateDate);
        console.log('Количество складов:', warehouses.length);
        
        if (updateDate) {
          setLastUpdateDate(updateDate);
        } else {
          console.warn('Дата обновления не найдена в ответе API');
          setLastUpdateDate(new Date().toISOString().split('T')[0]);
        }
        
        const filteredWarehouses = warehouses.filter(warehouse => 
          warehouse.models && warehouse.models.length > 0
        );
        
        console.log('Отфильтрованные склады:', filteredWarehouses.length);
        
        processData(filteredWarehouses);
        
        setLoading(false);
      } catch (err) {
        console.error(t('errors.loadingData'), err);
        setError(t('errors.failedToLoad'));
        setLoading(false);
        addNotification(t('errors.loadingData'), 'error');
      }
    };
    
    fetchData();
  }, [t]);
  
  const formatDate = (dateString) => {
    return dateString || 'Нет данных'; 
  };
  
  // Функция для обработки загруженных данных
  const processData = (warehouses) => {
    const carModels = [];
    
    let totalModelsCount = {};
    
    warehouses.forEach(warehouse => {
      if (!warehouse.models || warehouse.models.length === 0) return;
      
      warehouse.models.forEach(model => {
        if (!model.modifications || model.modifications.length === 0) return;
        
        if (!totalModelsCount[model.model]) {
          totalModelsCount[model.model] = {
            totalCount: 0,
            available: 0,
            reserved: 0,
            defective: 0,
            defectiveOk: 0,
            tradeIn: 0, // Добавляем Trade-in
            colors: {},
            modifications: {},
            photo_sha: model.photo_sha || null
          };
        }
        
        if (!totalModelsCount[model.model].photo_sha && model.photo_sha) {
          totalModelsCount[model.model].photo_sha = model.photo_sha;
        }
        
        model.modifications.forEach(mod => {
          if (!mod.colors || mod.colors.length === 0) return;
          
          if (!totalModelsCount[model.model].modifications[mod.modification]) {
            totalModelsCount[model.model].modifications[mod.modification] = {
              totalCount: 0,
              available: 0,
              reserved: 0,
              defective: 0,
              defectiveOk: 0,
              tradeIn: 0 // Добавляем Trade-in
            };
          }
          
          mod.colors.forEach(color => {
            if (!color.statuses || color.statuses.length === 0) return;
            
            if (!totalModelsCount[model.model].colors[color.color]) {
              totalModelsCount[model.model].colors[color.color] = {
                totalCount: 0,
                available: 0,
                reserved: 0,
                defective: 0,
                defectiveOk: 0,
                tradeIn: 0 // Добавляем Trade-in
              };
            }
            
            color.statuses.forEach(status => {
              const count = parseInt(status.count);
              
              totalModelsCount[model.model].totalCount += count;
              totalModelsCount[model.model].colors[color.color].totalCount += count;
              totalModelsCount[model.model].modifications[mod.modification].totalCount += count;
              
              // Распределяем по статусам
              if (status.status_name === "Свободно") {
                totalModelsCount[model.model].available += count;
                totalModelsCount[model.model].colors[color.color].available += count;
                totalModelsCount[model.model].modifications[mod.modification].available += count;
              } else if (status.status_name === "Именной" || status.status_name === "Закрепленные") {
                totalModelsCount[model.model].reserved += count;
                totalModelsCount[model.model].colors[color.color].reserved += count;
                totalModelsCount[model.model].modifications[mod.modification].reserved += count;
              } else if (status.status_name === "Брак") {
                totalModelsCount[model.model].defective += count;
                totalModelsCount[model.model].colors[color.color].defective += count;
                totalModelsCount[model.model].modifications[mod.modification].defective += count;
              } else if (status.status_name === "Брак-ОК") {
                totalModelsCount[model.model].defectiveOk += count;
                totalModelsCount[model.model].colors[color.color].defectiveOk += count;
                totalModelsCount[model.model].modifications[mod.modification].defectiveOk += count;
              } else if (status.status_name === "Trade-in") {
                totalModelsCount[model.model].tradeIn += count;
                totalModelsCount[model.model].colors[color.color].tradeIn += count;
                totalModelsCount[model.model].modifications[mod.modification].tradeIn += count;
              }
            });
          });
        });
      });
    });
    
    // Преобразуем объект с итогами в массив для использования в компоненте
    Object.entries(totalModelsCount).forEach(([modelName, modelData]) => {
      let colorsArray = Object.entries(modelData.colors).map(([colorName, colorData]) => ({
        name: colorName,
        count: colorData.totalCount,
        available: colorData.available,
        reserved: colorData.reserved,
        defective: colorData.defective,
        defectiveOk: colorData.defectiveOk,
        tradeIn: colorData.tradeIn,
        hex: getColorHex(colorName)
      }));
      
      let modificationsArray = Object.entries(modelData.modifications).map(([modName, modData]) => ({
        id: `${modelName}-${modName}`,
        name: modName,
        count: modData.totalCount,
        available: modData.available,
        reserved: modData.reserved,
        defective: modData.defective,
        defectiveOk: modData.defectiveOk,
        tradeIn: modData.tradeIn
      }));
      
      const imageUrl = `https://uzavtosalon.uz/b/core/m$load_image?sha=${modelData.photo_sha}&width=400&height=400`
      
      carModels.push({
        id: modelName,
        name: modelName,
        category: getCategoryForModel(modelName),
        totalCount: modelData.totalCount,
        available: modelData.available,
        reserved: modelData.reserved,
        defective: modelData.defective,
        defectiveOk: modelData.defectiveOk,
        tradeIn: modelData.tradeIn,
        colors: colorsArray,
        modifications: modificationsArray,
        img: imageUrl,
        photo_sha: modelData.photo_sha
      });
    });
    
    carModels.sort((a, b) => b.totalCount - a.totalCount);
    
    // Обработка данных о складах
    const processedWarehouses = warehouses.map(warehouse => {
      if (!warehouse.models || warehouse.models.length === 0) {
        return null;
      }
      
      const modelCounts = [];
      let totalCount = 0;
      let defective = 0;
      let defectiveOk = 0;
      let reserved = 0;
      let available = 0;
      let tradeIn = 0; // Добавляем Trade-in
      
      const categoryCountsMap = {};
      
      warehouse.models.forEach(model => {
        let modelTotal = 0;
        let modelAvailable = 0;
        let modelReserved = 0;
        let modelDefective = 0;
        let modelDefectiveOk = 0;
        let modelTradeIn = 0; // Добавляем Trade-in
        
        if (!model.modifications) return;
        
        model.modifications.forEach(mod => {
          if (!mod.colors) return;
          
          mod.colors.forEach(color => {
            if (!color.statuses) return;
            
            color.statuses.forEach(status => {
              const count = parseInt(status.count);
              totalCount += count;
              modelTotal += count;
              
              if (status.status_name === "Свободно") {
                available += count;
                modelAvailable += count;
              } else if (status.status_name === "Именной" || status.status_name === "Закрепленные") {
                reserved += count;
                modelReserved += count;
              } else if (status.status_name === "Брак") {
                defective += count;
                modelDefective += count;
              } else if (status.status_name === "Брак-ОК") {
                defectiveOk += count;
                modelDefectiveOk += count;
              } else if (status.status_name === "Trade-in") {
                tradeIn += count;
                modelTradeIn += count;
              }
            });
          });
        });
        
        if (modelTotal > 0) {
          const category = getCategoryForModel(model.model);
          
          if (!categoryCountsMap[category]) {
            categoryCountsMap[category] = 0;
          }
          categoryCountsMap[category] += modelTotal;
          
          const photo_sha = model.photo_sha || null;
          const imageUrl = `https://uzavtosalon.uz/b/core/m$load_image?sha=${photo_sha}&width=400&height=400`
          
          modelCounts.push({
            id: model.model,
            name: model.model,
            count: modelTotal,
            available: modelAvailable,
            reserved: modelReserved,
            defective: modelDefective,
            defectiveOk: modelDefectiveOk,
            tradeIn: modelTradeIn,
            category: category,
            img: imageUrl,
            photo_sha: photo_sha
          });
        }
      });
      
      if (totalCount === 0) {
        return null;
      }
      
      const volume = parseInt(warehouse.volume || 0);
      const capacity = volume > 0 ? volume : totalCount;
      const occupancyRate = volume > 0 ? Math.round((totalCount / volume) * 100) : 100;
      
      const categories = Object.keys(categoryCountsMap).map(key => ({
        name: key === 'suv' ? t('categories.suv') : 
              key === 'sedan' ? t('categories.sedan') : 
              key === 'minivan' ? t('categories.minivan') : key,
        count: categoryCountsMap[key]
      }));
      
      return {
        id: warehouse.warehouse,
        name: warehouse.warehouse,
        totalCount,
        defective,
        defectiveOk,
        reserved,
        available,
        tradeIn,
        models: modelCounts,
        categories,
        capacity,
        volume: warehouse.volume || 0,
        occupancyRate,
        status: occupancyRate > 90 ? 'critical' : 
                occupancyRate > 75 ? 'high' : 
                occupancyRate > 50 ? 'medium' : 'low'
      };
    }).filter(Boolean);
    
    // Обновляем состояния с обработанными данными
    setEnhancedCarModels(carModels);
    setEnhancedWarehouses(processedWarehouses);
    
    // Общие статистические данные
    setTotalVehicles(processedWarehouses.reduce((sum, warehouse) => sum + warehouse.totalCount, 0));
    setTotalDefective(processedWarehouses.reduce((sum, warehouse) => sum + warehouse.defective, 0));
    setTotalDefectiveOk(processedWarehouses.reduce((sum, warehouse) => sum + warehouse.defectiveOk, 0));
    setTotalReserved(processedWarehouses.reduce((sum, warehouse) => sum + warehouse.reserved, 0));
    setTotalAvailable(processedWarehouses.reduce((sum, warehouse) => sum + warehouse.available, 0));
    setTotalTradeIn(processedWarehouses.reduce((sum, warehouse) => sum + warehouse.tradeIn, 0));
  };
  
  // Функция для переключения отображения модели в контексте склада
  const toggleModelDetailInWarehouse = (modelId) => {
    if (selectedWarehouseModel === modelId) {
      setSelectedWarehouseModel(null);
    } else {
      setSelectedWarehouseModel(modelId);
      setWarehouseModelViewTab('modifications');
    }
  };
  
  // Обработчик клика по модели
  const handleCarModelClick = (model) => {
    if (selectedCarModel && selectedCarModel.id === model.id) {
      setSelectedCarModel(null);
      setSelectedModification(null);
    } else {
      const selectedModelData = enhancedCarModels.find(m => m.id === model.id || m.name === model);
      setSelectedCarModel(selectedModelData);
      setSelectedWarehouse(null);
      setSelectedModification(null);
      setModificationFilter('');
      setStatusFilter('all');
      setColorFilter('');
    }
  };

  // Обработчик клика по складу
  const handleWarehouseClick = (warehouse) => {
    if (selectedWarehouse && selectedWarehouse.id === warehouse.id) {
      setSelectedWarehouse(null);
    } else {
      const selectedWarehouseData = enhancedWarehouses.find(w => w.id === warehouse.id || w.name === warehouse);
      setSelectedWarehouse(selectedWarehouseData);
      setSelectedCarModel(null);
      setSelectedModification(null);
      setSelectedWarehouseModel(null);
    }
  };

  // Обработчик клика по модификации
  const handleModificationClick = (modification) => {
    if (selectedModification && selectedModification.id === modification.id) {
      setSelectedModification(null);
    } else {
      setSelectedModification(modification);
    }
  };

function getCategoryForModel(modelName) {
    const suvModels = ['TRACKER-2', 'EQUINOX', 'TRAVERSE', 'TAHOE', 'TAHOE-2'];
    const sedanModels = ['COBALT', 'MALIBU-2', 'ONIX', 'LACETTI', 'NEXIA-3'];
    const minivanModels = ['DAMAS-2', 'LABO','SPARK'];
    const otherModels = ['CAPTIVA'];
    
    if (suvModels.includes(modelName)) return 'suv';
    if (sedanModels.includes(modelName)) return 'sedan';
    if (minivanModels.includes(modelName)) return 'minivan';
    if (otherModels.includes(modelName)) return 'suv';
    
    return 'other';
}

  function getColorHex(colorName) {
    const colorMap = {
      'Summit White': '#FFFFFF',
      'Black Met. Kettle metallic': '#000000',
      'Swichblade Silver': '#C0C0C0',
      'Satin Steel Gray Met.': '#808080',
      'Satin Steel Gray Met-2': '#A9A9A9',
      'Son of а gun gray': '#696969',
      'Grey': '#909090',
      'Dark Grey': '#505050',
      'DARKMOON BLUE MET': '#223344',
      'Red - E or Not': '#FF0000',
      'SOME KINDA BLUE': '#0000FF',
      'Blue': '#0066FF',
      'Burnt Coconut': '#8B4513',
      'Artemis Gray': '#6C7A89',
      'Zeus': '#483D8B',
      'Smoke Beige': '#F5F5DC',
      'May Green': '#4c9141',
      'White Frost': '#F0F8FF',
      'THE DRAKE MET-2': '#1A1A1A',
      'Mosaic Black Metallic': '#111111',
      'Black-Matt': '#101010',
      'NIGHT SHADE MET-2': '#2D2F43',
      'Iridescent Pearl Tricoat': '#F0EAD6',
      'POW ZINGA MET': '#FFA500',
      'Jinx Met-2': '#5E7380',
      'Seeker Met-3': '#8E9095',
      'Glaze red': '#B31B1B',
      'Aurora silver': '#B2BEC3'
    };
    
    return colorMap[colorName] || '#CCCCCC';
  }

  // Функция для экспорта данных о складах в CSV
  const exportWarehouseData = () => {
    const headers = [
      t('export.warehouse'), 
      t('export.total'), 
      t('export.available'), 
      t('export.reserved'), 
      t('export.defectiveOk'), 
      t('export.defective'),
      'Trade-in', // Добавляем Trade-in
      t('export.occupancy')
    ];
    
    const rows = enhancedWarehouses.map(warehouse => [
      warehouse.name,
      warehouse.totalCount,
      warehouse.available,
      warehouse.reserved,
      warehouse.defectiveOk,
      warehouse.defective,
      warehouse.tradeIn,
      `${warehouse.occupancyRate}%`
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `warehouse_data_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addNotification(t('notifications.exportSuccessWarehouse'), 'success');
  };
  
  // Функция для экспорта данных о моделях в CSV
  const exportModelData = () => {
    const headers = [
      t('export.model'), 
      t('export.category'), 
      t('export.total'), 
      t('export.available'), 
      t('export.reserved'), 
      t('export.defectiveOk'), 
      t('export.defective'),
      'Trade-in' // Добавляем Trade-in
    ];
    
    const rows = enhancedCarModels.map(model => [
      model.name,
      model.category === 'sedan' ? t('categories.sedan') : 
      model.category === 'suv' ? t('categories.suv') : 
      model.category === 'minivan' ? t('categories.minivan') : model.category,
      model.totalCount,
      model.available,
      model.reserved,
      model.defectiveOk,
      model.defective,
      model.tradeIn
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `car_models_data_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addNotification(t('notifications.exportSuccessModels'), 'success');
  };

  useEffect(() => {
    if (!loading && enhancedWarehouses.length > 0) {
      renderWarehouseDistribution();
      renderManufacturerChart();
      renderModelInventoryChart();
      
      if (selectedCarModel && colorDistributionRef.current) {
        renderColorDistributionChart(selectedCarModel);
      }
      
      if (selectedWarehouse && warehouseOccupancyRef.current) {
        renderWarehouseOccupancyChart(selectedWarehouse);
      }
      
      const handleResize = () => {
        renderWarehouseDistribution();
        renderManufacturerChart();
        renderModelInventoryChart();
        
        if (selectedCarModel && colorDistributionRef.current) {
          renderColorDistributionChart(selectedCarModel);
        }
        
        if (selectedWarehouse && warehouseOccupancyRef.current) {
          renderWarehouseOccupancyChart(selectedWarehouse);
        }
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [loading, enhancedWarehouses, selectedCarModel, selectedWarehouse, t, isDark]);

  // Рендер диаграммы распределения по складам
const renderWarehouseDistribution = () => {
  if (!warehouseDistributionRef.current) return;
  
  const container = warehouseDistributionRef.current;
  container.innerHTML = '';
  
  // Сначала определяем colorScale
  const colorScale = d3.scaleOrdinal()
    .domain(['available', 'reserved', 'defectiveOk', 'defective', 'tradeIn'])
    .range(['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']);
  
  // Увеличиваем левый отступ для размещения названий складов
  const margin = { 
    top: 30, 
    right: 20, 
    bottom: isMobile ? 60 : 60,
    left: isMobile ? 120 : 140  // Увеличиваем левый отступ для названий
  };
  const width = container.clientWidth - margin.left - margin.right;
  const height = container.clientHeight - margin.top - margin.bottom;
  
  if (width < 100 || height < 100) return;
  
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
    
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', -margin.top / 2)
    .attr('text-anchor', 'middle')
    .style('font-size', isMobile ? '14px' : '16px')
    .style('fill', isDark ? '#f9fafb' : '#111827')
    .text(t('charts.warehouseDistribution'));
    
  const warehouseData = enhancedWarehouses.map(warehouse => ({
    name: warehouse.name,
    available: warehouse.available,
    reserved: warehouse.reserved,
    defective: warehouse.defective,
    defectiveOk: warehouse.defectiveOk,
    tradeIn: warehouse.tradeIn
  }));
  
  const x = d3.scaleLinear()
    .domain([0, d3.max(enhancedWarehouses, d => d.capacity)])
    .range([0, width]);
    
  const y = d3.scaleBand()
    .domain(warehouseData.map(d => d.name))
    .range([0, height])
    .padding(0.3);
    
  // Добавляем горизонтальную ось
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .style('font-size', '12px')
    .style('fill', isDark ? '#d1d5db' : '#4b5563');
    
  // Добавляем вертикальную ось с названиями складов
  svg.append('g')
    .call(d3.axisLeft(y))
    .selectAll('text')
    .style('font-size', isMobile ? '10px' : '12px')
    .style('fill', isDark ? '#d1d5db' : '#4b5563')
    .style('cursor', 'pointer')
    .on('click', (event, d) => {
      const warehouse = enhancedWarehouses.find(w => w.name === d);
      handleWarehouseClick(warehouse);
    })
    .on('mouseover', function() {
      d3.select(this)
        .style('fill', '#60a5fa')
        .style('font-weight', 'bold');
    })
    .on('mouseout', function() {
      d3.select(this)
        .style('fill', isDark ? '#d1d5db' : '#4b5563')
        .style('font-weight', 'normal');
    });
    
  // Добавляем сетку
  svg.append('g')
    .attr('class', 'grid')
    .call(d3.axisBottom(x)
      .tickSize(height)
      .tickFormat(''))
    .selectAll('line')
    .style('stroke', isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)');
    
  const stack = d3.stack()
    .keys(['available', 'reserved', 'defectiveOk', 'defective', 'tradeIn'])
    .order(d3.stackOrderNone)
    .offset(d3.stackOffsetNone);
    
  const stackedData = stack(warehouseData);
  
  const defs = svg.append('defs');
  
  ['available', 'reserved', 'defectiveOk', 'defective', 'tradeIn'].forEach((key, i) => {
    const gradientId = `stackGradient-${key}`;
    const color = colorScale(key);
    
    const gradient = defs.append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
      
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', d3.rgb(color).darker(0.3))
      .attr('stop-opacity', 1);
      
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', color)
      .attr('stop-opacity', 1);
  });
  
  // Группы для баров
  svg.append('g')
    .selectAll('g')
    .data(stackedData)
    .join('g')
    .attr('fill', d => `url(#stackGradient-${d.key})`)
    .selectAll('rect')
    .data(d => d)
    .join('rect')
    .attr('y', d => y(d.data.name))
    .attr('height', y.bandwidth())
    .attr('x', d => x(d[0]))
    .attr('width', 0)
    .attr('rx', 3)
    .attr('ry', 3)
    .style('cursor', 'pointer')
    .on('click', (event, d) => {
      const warehouse = enhancedWarehouses.find(w => w.name === d.data.name);
      handleWarehouseClick(warehouse);
    })
    .on('mouseover', function(event, d) {
      // Подсвечиваем соответствующее название склада
      svg.selectAll('.y.axis text')
        .filter(text => text === d.data.name)
        .style('fill', '#60a5fa')
        .style('font-weight', 'bold');
    })
    .on('mouseout', function(event, d) {
      // Возвращаем обычный стиль
      svg.selectAll('.y.axis text')
        .filter(text => text === d.data.name)
        .style('fill', isDark ? '#d1d5db' : '#4b5563')
        .style('font-weight', 'normal');
    })
    .transition()
    .duration(800)
    .delay((d, i) => i * 100)
    .attr('width', d => x(d[1]) - x(d[0]));
    
  // Линии максимальной вместимости
  svg.selectAll('.capacity-line')
    .data(enhancedWarehouses)
    .join('line')
    .attr('class', 'capacity-line')
    .attr('x1', d => x(d.capacity))
    .attr('y1', d => y(d.name))
    .attr('x2', d => x(d.capacity))
    .attr('y2', d => y(d.name) + y.bandwidth())
    .attr('stroke', '#f97316')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '5,3')
    .style('opacity', 0)
    .transition()
    .duration(500)
    .delay(1000)
    .style('opacity', 1);
    
  // Добавляем текстовые метки с количеством автомобилей на каждом складе
  svg.selectAll('.warehouse-total')
    .data(enhancedWarehouses)
    .join('text')
    .attr('class', 'warehouse-total')
    .attr('x', d => x(d.totalCount) + 5)
    .attr('y', d => y(d.name) + y.bandwidth() / 2)
    .attr('dy', '0.35em')
    .style('font-size', isMobile ? '10px' : '12px')
    .style('fill', isDark ? '#ffffff' : '#111827')
    .style('font-weight', 'bold')
    .style('opacity', 0)
    .text(d => d.totalCount)
    .transition()
    .duration(500)
    .delay(1000)
    .style('opacity', 1);
};
   
  // Рендер круговой диаграммы складов
  const renderManufacturerChart = () => {
    if (!manufacturerChartRef.current) return;
    
    const container = manufacturerChartRef.current;
    container.innerHTML = '';
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    if (width < 100 || height < 100) return;
    
    const radius = Math.min(width, height) / 2 * 0.8;
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width/2},${height/2})`);
      
    const warehouseData = enhancedWarehouses
      .map(warehouse => ({
        warehouse: warehouse.name,
        value: warehouse.totalCount,
        percentage: Math.round((warehouse.totalCount / totalVehicles) * 100)
      }));
      
    const colorScale = d3.scaleOrdinal()
      .domain(warehouseData.map(d => d.warehouse))
      .range([
        '#3b82f6', '#ef4444', '#f59e0b', '#22c55e', '#8b5cf6',
        '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
      ]);
      
    const pie = d3.pie()
      .value(d => d.value)
      .sort(null);
      
    const data_ready = pie(warehouseData);
    
    const arc = d3.arc()
      .innerRadius(radius * 0.4)
      .outerRadius(radius);
      
    const arcHover = d3.arc()
      .innerRadius(radius * 0.4)
      .outerRadius(radius * 1.07);
      
    const defs = svg.append('defs');
    
    warehouseData.forEach((d, i) => {
      const gradientId = `pieGradient-${i}`;
      const color = colorScale(d.warehouse);
      
      const gradient = defs.append('radialGradient')
        .attr('id', gradientId)
        .attr('cx', '50%')
        .attr('cy', '50%')
        .attr('r', '50%');
        
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', d3.rgb(color).brighter(0.5))
        .attr('stop-opacity', 1);
        
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', color)
        .attr('stop-opacity', 1);
    });
    
    svg.selectAll('path')
      .data(data_ready)
      .join('path')
      .attr('d', arc)
      .attr('fill', (d, i) => `url(#pieGradient-${i})`)
      .attr('stroke', isDark ? '#1f2937' : '#e5e7eb')
      .style('stroke-width', '2px')
      .style('opacity', 0.9)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arcHover);
          
        centerLabel.text(d.data.warehouse);
        centerValue.text(`${d.data.percentage}% (${d.data.value} ${t('units')})`);
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arc);
          
        centerLabel.text(t('charts.distribution'));
        centerValue.text(t('charts.byWarehouse'));
      })
      .on('click', function(event, d) {
        const warehouse = enhancedWarehouses.find(w => w.name === d.data.warehouse);
        handleWarehouseClick(warehouse);
      })
      .transition()
      .duration(800)
      .attrTween('d', function(d) {
        const interpolate = d3.interpolate({startAngle: d.startAngle, endAngle: d.startAngle}, d);
        return function(t) {
          return arc(interpolate(t));
        };
      });
      
    if (width > 350 && !isMobile) {
      const legendG = svg.append('g')
        .attr('transform', `translate(${radius + 20}, -${radius - 20})`);
      
      const legend = legendG.selectAll('.legend')
        .data(data_ready)
        .enter()
        .append('g')
        .attr('class', 'legend')
        .attr('transform', (d, i) => `translate(0, ${i * 20})`);
        
      legend.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', (d, i) => colorScale(d.data.warehouse));
        
      legend.append('text')
        .attr('x', 20)
        .attr('y', 10)
        .text(d => {
          const name = d.data.warehouse;
          const truncated = name.length > 15 ? name.substring(0, 15) + '...' : name;
          return truncated;
        })
        .style('font-size', '10px')
        .style('fill', isDark ? '#d1d5db' : '#4b5563');
    }
      
    const centerLabel = svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.5em')
      .style('font-size', isMobile ? '14px' : '16px')
      .style('fill', isDark ? '#d1d5db' : '#4b5563')
      .text(t('charts.distribution'));
      
    const centerValue = svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1em')
      .style('font-size', isMobile ? '20px' : '24px')
      .style('font-weight', 'bold')
      .style('fill', isDark ? '#ffffff' : '#111827')
      .text(t('charts.byWarehouse'));
  };
  
const renderModelInventoryChart = () => {
  if (!modelInventoryChartRef.current) return;
  
  const container = modelInventoryChartRef.current;
  container.innerHTML = '';
  
  // Увеличиваем нижний отступ для размещения легенды
  const margin = { top: 30, right: 20, bottom: 80, left: isMobile ? 80 : 100 };
  const width = container.clientWidth - margin.left - margin.right;
  const height = container.clientHeight - margin.top - margin.bottom;
  
  if (width < 100 || height < 100) return;
  
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
    
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', -margin.top / 2)
    .attr('text-anchor', 'middle')
    .style('font-size', isMobile ? '14px' : '16px')
    .style('fill', isDark ? '#f9fafb' : '#111827')
    .text(t('charts.carStatusInWarehouses'));
    
  const maxModels = isMobile ? 3 : 5;
  const carModelInventory = enhancedCarModels.slice(0, maxModels).map(model => ({
    model: model.name,
    available: Math.round((model.available / model.totalCount) * 100),
    reserved: Math.round((model.reserved / model.totalCount) * 100),
    defective: Math.round((model.defective / model.totalCount) * 100),
    defectiveOk: Math.round((model.defectiveOk / model.totalCount) * 100),
    tradeIn: Math.round((model.tradeIn / model.totalCount) * 100)
  }));
  
  const y = d3.scaleBand()
    .domain(carModelInventory.map(d => d.model))
    .range([0, height])
    .padding(0.3);
    
  const x = d3.scaleLinear()
    .domain([0, 100])
    .range([0, width]);
    
  svg.append('g')
    .call(d3.axisLeft(y))
    .selectAll('text')
    .style('font-size', isMobile ? '10px' : '12px')
    .style('fill', isDark ? '#d1d5db' : '#4b5563')
    .style('cursor', 'pointer')
    .on('click', (event, d) => {
      const model = enhancedCarModels.find(m => m.name === d);
      handleCarModelClick(model);
    });
    
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat(d => `${d}%`))
    .selectAll('text')
    .style('font-size', '12px')
    .style('fill', isDark ? '#d1d5db' : '#4b5563');
    
  svg.append('g')
    .attr('class', 'grid')
    .call(d3.axisBottom(x)
      .tickSize(height)
      .tickFormat(''))
    .selectAll('line')
    .style('stroke', isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)');
    
  const defs = svg.append('defs');
  
  // Градиенты для всех статусов включая Trade-in
  const gradients = [
    { id: 'availableGradient', startColor: '#22c55e', endColor: '#4ade80' },
    { id: 'reservedGradient', startColor: '#3b82f6', endColor: '#60a5fa' },
    { id: 'defectiveOkGradient', startColor: '#f59e0b', endColor: '#fbbf24' },
    { id: 'defectiveGradient', startColor: '#ef4444', endColor: '#f87171' },
    { id: 'tradeInGradient', startColor: '#8b5cf6', endColor: '#a78bfa' }
  ];
  
  gradients.forEach(g => {
    const gradient = defs.append('linearGradient')
      .attr('id', g.id)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
      
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', g.startColor)
      .attr('stop-opacity', 1);
      
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', g.endColor)
      .attr('stop-opacity', 1);
  });
  
  // Добавляем полосы для всех статусов
  const statuses = ['available', 'reserved', 'defectiveOk', 'defective', 'tradeIn'];
  const gradientUrls = ['availableGradient', 'reservedGradient', 'defectiveOkGradient', 'defectiveGradient', 'tradeInGradient'];
  
  statuses.forEach((status, statusIndex) => {
    svg.selectAll(`.${status}-bar`)
      .data(carModelInventory)
      .join('rect')
      .attr('class', `${status}-bar`)
      .attr('y', d => y(d.model))
      .attr('height', y.bandwidth())
      .attr('x', d => {
        let sum = 0;
        for (let i = 0; i < statusIndex; i++) {
          sum += d[statuses[i]];
        }
        return x(sum);
      })
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', `url(#${gradientUrls[statusIndex]})`)
      .attr('width', 0)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        const model = enhancedCarModels.find(m => m.name === d.model);
        handleCarModelClick(model);
      })
      .transition()
      .duration(800)
      .delay(statusIndex * 300)
      .attr('width', d => x(d[status]));
  });
    
  // Добавляем значения
  const addLabel = (className, key, offset, minPercent) => {
    svg.selectAll(`.${className}`)
      .data(carModelInventory)
      .join('text')
      .attr('class', className)
      .each(function(d) {
        const percent = d[key];
        const barWidth = x(percent);
        const position = x(offset(d)) + barWidth / 2;
        
        if (percent < minPercent || barWidth < 40) {
          d3.select(this).style('display', 'none');
        } else {
          d3.select(this)
            .attr('x', position)
            .attr('y', y(d.model) + y.bandwidth() / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .style('fill', '#ffffff')
            .style('font-size', isMobile ? '10px' : '12px')
            .style('font-weight', 'bold')
            .style('opacity', 0)
            .text(`${percent}%`)
            .transition()
            .duration(500)
            .delay(1000)
            .style('opacity', 1);
        }
      });
  };
    
  addLabel('available-label', 'available', d => 0, 5);
  addLabel('reserved-label', 'reserved', d => d.available, 5);
  addLabel('defectiveOk-label', 'defectiveOk', d => d.available + d.reserved, 5);
  addLabel('defective-label', 'defective', d => d.available + d.reserved + d.defectiveOk, 5);
  addLabel('tradeIn-label', 'tradeIn', d => d.available + d.reserved + d.defectiveOk + d.defective, 5);
    
if (!isMobile) {
  const legend = svg.append('g')
    .attr('transform', `translate(${width / 2 - 300}, ${height + 40})`); // Увеличиваем смещение для центрирования
    
  const legendItems = [
    { key: 'available', label: t('status.available'), color: '#22c55e' },
    { key: 'reserved', label: t('status.reserved'), color: '#3b82f6' },
    { key: 'defectiveOk', label: t('status.defectiveOk'), color: '#f59e0b' },
    { key: 'defective', label: t('status.defective'), color: '#ef4444' },
    { key: 'tradeIn', label: 'Trade-in', color: '#8b5cf6' }
  ];
  
  legendItems.forEach((item, i) => {
    const xOffset = i * 120; // Увеличил с 85 до 100 для большего расстояния
    
    legend.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', item.color)
      .attr('rx', 2)
      .attr('transform', `translate(${xOffset}, 0)`);
      
    legend.append('text')
      .attr('x', xOffset + 20)
      .attr('y', 12)
      .style('font-size', '12px')
      .style('fill', isDark ? '#d1d5db' : '#4b5563')
      .text(item.label);
  });
} else {
  // Для мобильных устройств размещаем легенду компактнее
  const legend = svg.append('g')
    .attr('transform', `translate(10, ${height + 35})`);
    
  const legendItems = [
    { key: 'available', label: t('status.availableShort'), color: '#22c55e' },
    { key: 'reserved', label: t('status.reservedShort'), color: '#3b82f6' },
    { key: 'defectiveOk', label: t('status.defectiveOkShort'), color: '#f59e0b' },
    { key: 'defective', label: t('status.defectiveShort'), color: '#ef4444' },
    { key: 'tradeIn', label: 'Trade-in', color: '#8b5cf6' }
  ];
  
  // Размещаем легенду в две строки для мобильных
  legendItems.forEach((item, i) => {
    const row = Math.floor(i / 3);
    const col = i % 3;
    const xOffset = col * 80; // Увеличил с 60 до 80 для мобильных
    const yOffset = row * 25; // Увеличил с 20 до 25 для вертикального отступа
    
    legend.append('rect')
      .attr('width', 10)
      .attr('height', 10)
      .attr('fill', item.color)
      .attr('rx', 2)
      .attr('transform', `translate(${xOffset}, ${yOffset})`);
      
    legend.append('text')
      .attr('x', xOffset + 15)
      .attr('y', yOffset + 9)
      .style('font-size', '10px')
      .style('fill', isDark ? '#d1d5db' : '#4b5563')
      .text(item.label);
  });
}
};

  // Функция для отрисовки графика распределения по цветам для выбранной модели
  const renderColorDistributionChart = (model) => {
    if (!colorDistributionRef.current) return;
    
    const container = colorDistributionRef.current;
    container.innerHTML = '';
    
    const margin = { top: 20, right: 30, bottom: 30, left: isMobile ? 60 : 90 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;
    
    if (width < 100 || height < 100) return;
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
      
    const colorData = model.colors;
    
    const y = d3.scaleBand()
      .domain(colorData.map(d => d.name))
      .range([0, height])
      .padding(0.2);
      
    const x = d3.scaleLinear()
      .domain([0, d3.max(colorData, d => d.count) * 1.2])
      .range([0, width]);
      
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5))
      .selectAll('text')
      .style('fill', isDark ? '#9ca3af' : '#4b5563');
      
    svg.append('g')
      .call(d3.axisLeft(y))
      .selectAll('text')
      .style('font-size', isMobile ? '10px' : '12px')
      .style('fill', isDark ? '#9ca3af' : '#4b5563');
      
    svg.selectAll('.color-bar')
      .data(colorData)
      .join('rect')
      .attr('class', 'color-bar')
      .attr('x', 0)
      .attr('y', d => y(d.name))
      .attr('width', 0)
      .attr('height', y.bandwidth())
      .attr('fill', d => d.hex)
      .attr('rx', 2)
      .transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .attr('width', d => x(d.count));
      
    svg.selectAll('.color-label')
      .data(colorData)
      .join('text')
      .attr('class', 'color-label')
      .each(function(d) {
        const barWidth = x(d.count);
        if (barWidth < 40) {
          d3.select(this).style('display', 'none');
        } else {
          const textX = barWidth > 80 ? x(d.count) - 25 : x(d.count) + 5;
          const textColor = barWidth > 80 ? 
                          (d.name === 'Summit White' || d.name === 'White Frost') ? '#1f2937' : '#ffffff' 
                          : isDark ? '#d1d5db' : '#1f2937';
          const textAnchor = barWidth > 80 ? 'end' : 'start';
          
          d3.select(this)
            .attr('x', textX)
            .attr('y', y(d.name) + y.bandwidth() / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', textAnchor)
            .style('font-size', isMobile ? '10px' : '12px')
            .style('fill', textColor)
            .style('opacity', 0)
            .transition()
            .duration(800)
            .delay((d, i) => i * 100 + 300)
            .style('opacity', 1)
            .text(d.count);
        }
      });
      
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', isMobile ? '12px' : '14px')
      .style('fill', isDark ? '#f9fafb' : '#111827')
      .text(t('charts.colorDistribution'));
  };

  // Метод для рендеринга графика заполненности склада
  const renderWarehouseOccupancyChart = (warehouse) => {
    if (!warehouseOccupancyRef.current) return;
    
    const container = warehouseOccupancyRef.current;
    container.innerHTML = '';
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    if (width < 100 || height < 100) return;
    
    const radius = Math.min(width, height) / 2 * 0.8;
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width/2},${height/2})`);
      
    const data = [
      { name: t('status.free'), value: warehouse.capacity - warehouse.totalCount, color: '#94a3b8' },
      { name: t('status.defective'), value: warehouse.defective, color: '#ef4444' }, 
      { name: t('status.defectiveOk'), value: warehouse.defectiveOk, color: '#f59e0b' },
      { name: t('status.reserved'), value: warehouse.reserved, color: '#3b82f6' },
      { name: t('status.available'), value: warehouse.available, color: '#22c55e' },
      { name: 'Trade-in', value: warehouse.tradeIn, color: '#8b5cf6' } // Добавляем Trade-in
    ];
    
    const pie = d3.pie()
      .value(d => d.value)
      .sort(null);
      
    const data_ready = pie(data);
    
    const arc = d3.arc()
      .innerRadius(radius * 0.7)
      .outerRadius(radius);
      
    const arcHover = d3.arc()
      .innerRadius(radius * 0.68)
      .outerRadius(radius * 1.05);
      
    const defs = svg.append('defs');
   
   data.forEach((d, i) => {
     const gradientId = `pieGradient-occupancy-${i}`;
     
     const gradient = defs.append('radialGradient')
       .attr('id', gradientId)
       .attr('cx', '50%')
       .attr('cy', '50%')
       .attr('r', '50%');
       
     gradient.append('stop')
       .attr('offset', '0%')
       .attr('stop-color', d3.rgb(d.color).brighter(0.5))
       .attr('stop-opacity', 1);
       
     gradient.append('stop')
       .attr('offset', '100%')
       .attr('stop-color', d.color)
       .attr('stop-opacity', 1);
   });
   
   svg.selectAll('path')
     .data(data_ready)
     .join('path')
     .attr('d', arc)
     .attr('fill', (d, i) => `url(#pieGradient-occupancy-${i})`)
     .attr('stroke', isDark ? '#1f2937' : '#e5e7eb')
     .style('stroke-width', '2px')
     .style('opacity', 0.9)
     .style('cursor', 'pointer')
     .on('mouseover', function(event, d) {
       d3.select(this)
         .transition()
         .duration(200)
         .attr('d', arcHover);
         
       const total = d3.sum(data, d => d.value);
       const percent = Math.round((d.data.value / total) * 100);
       
       centerLabel.text(d.data.name);
       centerValue.text(`${d.data.value} (${percent}%)`);
     })
     .on('mouseout', function() {
       d3.select(this)
         .transition()
         .duration(200)
         .attr('d', arc);
         
       centerLabel.text(t('charts.occupancy'));
       centerValue.text(`${warehouse.occupancyRate}%`);
     })
     .transition()
     .duration(800)
     .attrTween('d', function(d) {
       const interpolate = d3.interpolate({startAngle: d.startAngle, endAngle: d.startAngle}, d);
       return function(t) {
         return arc(interpolate(t));
       };
     });
     
   const centerLabel = svg.append('text')
     .attr('text-anchor', 'middle')
     .attr('dy', '-0.5em')
     .style('font-size', isMobile ? '14px' : '16px')
     .style('fill', isDark ? '#d1d5db' : '#4b5563')
     .text(t('charts.occupancy'));
     
   const centerValue = svg.append('text')
     .attr('text-anchor', 'middle')
     .attr('dy', '1em')
     .style('font-size', isMobile ? '20px' : '24px')
     .style('font-weight', 'bold')
     .style('fill', isDark ? '#ffffff' : '#111827')
     .text(`${warehouse.occupancyRate}%`);
     
   svg.append('text')
     .attr('text-anchor', 'middle')
     .attr('dy', '2.5em')
     .style('font-size', isMobile ? '10px' : '12px')
     .style('fill', isDark ? '#d1d5db' : '#6b7280')
     .text(t('charts.currentOccupancy'));
     
   const statusColors = {
     'critical': '#ef4444',
     'high': '#f97316',
     'medium': '#facc15',
     'low': '#22c55e'
   };
   
   svg.append('text')
     .attr('text-anchor', 'middle')
     .attr('dy', '4em')
     .style('font-size', isMobile ? '10px' : '12px')
     .style('fill', statusColors[warehouse.status] || (isDark ? '#d1d5db' : '#6b7280'))
     .text(`${t('charts.status')}: ${t(`occupancyStatus.${warehouse.status}`)}`);
 };

 // Компонент всплывающих подсказок
 const Tooltip = ({ children, content }) => {
   const [isVisible, setIsVisible] = useState(false);
   
   return (
     <div 
       className="relative inline-block"
       onMouseEnter={() => setIsVisible(true)}
       onMouseLeave={() => setIsVisible(false)}
     >
       {children}
       {isVisible && (
         <div className={`absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 ${
           isDark ? 'bg-gray-900' : 'bg-gray-800'
         } text-white text-xs rounded whitespace-nowrap`}>
           {content}
           <div className={`absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent ${
             isDark ? 'border-t-gray-900' : 'border-t-gray-800'
           }`}></div>
         </div>
       )}
     </div>
   );
 };
 
 // Компонент уведомлений
 const NotificationsContainer = () => (
   <div className="fixed bottom-4 right-4 z-50 space-y-2">
     <AnimatePresence>
       {notifications.map(notification => (
         <motion.div
           key={notification.id}
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -20 }}
           className={`px-4 py-3 rounded-lg shadow-lg ${
             notification.type === 'success' ? 'bg-green-600' :
             notification.type === 'error' ? 'bg-red-600' :
             notification.type === 'warning' ? 'bg-amber-600' : 'bg-blue-600'
           } text-white max-w-sm`}
         >
           {notification.message}
           <button 
             className="ml-3 text-white opacity-70 hover:opacity-100"
             onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
           >
             ×
           </button>
         </motion.div>
       ))}
     </AnimatePresence>
   </div>
 );

 // Если данные загружаются, показываем индикатор загрузки
 if (loading) {
   return <ContentReadyLoader />;
 }
 
 // Если произошла ошибка, показываем сообщение об ошибке
 if (error) {
   return (
     <div className={`p-4 md:p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'} text-gray-100 min-h-screen`}>
       <div className="bg-red-500/20 text-red-400 p-6 rounded-lg text-center">
         <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
         </svg>
         <h2 className="text-xl font-bold mb-2">{t('errors.loadingDataTitle')}</h2>
         <p>{error}</p>
       </div>
     </div>
   );
 }

 return (
   <div className={`p-4 md:p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'} ${isDark ? 'text-gray-100' : 'text-gray-900'} min-h-screen`}>
     {/* Верхняя панель со списком складов */}
     <div className={`mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow-md`}>
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
         <div>
           <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('title')}</h1>
           <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>{t('subtitle')}</p>
         </div>
       </div>
     </div>
     
     {/* Ключевые метрики с обновленными статусами */}
     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
       <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow-md`}>
         <div className="flex items-center">
           <div className={`w-12 h-12 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center mr-3`}>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
             </svg>
           </div>
           <div>
             <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('metrics.total')}</div>
             <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{totalVehicles}</div>
           </div>
         </div>
       </div>
      
       <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow-md`}>
         <div className="flex items-center">
           <div className={`w-12 h-12 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center mr-3`}>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
           </div>
           <div>
             <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('metrics.available')}</div>
             <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{totalAvailable}</div>
           </div>
         </div>
       </div>
      
       <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow-md`}>
         <div className="flex items-center">
           <div className={`w-12 h-12 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center mr-3`}>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
             </svg>
           </div>
           <div>
             <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('metrics.reserved')}</div>
             <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{totalReserved}</div>
           </div>
         </div>
       </div>
      
       <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow-md`}>
         <div className="flex items-center">
           <div className={`w-12 h-12 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center mr-3`}>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
             </svg>
           </div>
           <div>
             <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('metrics.defectiveOk')}</div>
             <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{totalDefectiveOk}</div>
           </div>
         </div>
       </div>
      
       <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow-md`}>
         <div className="flex items-center">
           <div className={`w-12 h-12 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center mr-3`}>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
             </svg>
           </div>
           <div>
             <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('metrics.defective')}</div>
             <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{totalDefective}</div>
           </div>
         </div>
       </div>
       
       {/* Новая метрика для Trade-in */}
       <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow-md`}>
         <div className="flex items-center">
           <div className={`w-12 h-12 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center mr-3`}>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
             </svg>
           </div>
           <div>
             <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Trade-in</div>
             <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{totalTradeIn}</div>
           </div>
         </div>
       </div>
     </div>
    
     {/* Обновленная метрика с временем обновления */}
     <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow-md mb-6`}>
       <div className="flex items-center justify-between">
         <div>
           <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('metrics.totalCarModels', { count: enhancedCarModels.length })}</span>
         </div>
         
         <div className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm">
           {t('metrics.updatedAt')} {formatDate(lastUpdateDate)}
         </div>
       </div>
     </div>
    
     {/* Основные графики */}
     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
       <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 shadow-md`}>
         <div className="flex justify-between mb-2">
           <h2 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('charts.warehouseDistribution')}</h2>
           <span className="text-sm bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">{t('charts.inventoryShare')}</span>
         </div>
         <div ref={manufacturerChartRef} className="h-[300px]"></div>
       </div>
      
<div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 shadow-md`}>
 <div className="flex justify-between mb-2">
   <h2 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('charts.carsByWarehouse')}</h2>
   <span className="text-sm bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
     {t('charts.interactive')}
   </span>
 </div>
 
 {/* График */}
 <div ref={warehouseDistributionRef} className="h-[280px]"></div>
 
 {/* HTML легенда */}
 <div className={`mt-3 pt-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
   <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center text-xs">
     <div className="flex items-center gap-1.5">
       <div className="w-3 h-3 bg-green-500 rounded"></div>
       <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{t('status.available')}</span>
     </div>
     <div className="flex items-center gap-1.5">
       <div className="w-3 h-3 bg-blue-500 rounded"></div>
       <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{t('status.reserved')}</span>
     </div>
     <div className="flex items-center gap-1.5">
       <div className="w-3 h-3 bg-amber-500 rounded"></div>
       <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{t('status.defectiveOk')}</span>
     </div>
     <div className="flex items-center gap-1.5">
       <div className="w-3 h-3 bg-red-500 rounded"></div>
       <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{t('status.defective')}</span>
     </div>
     <div className="flex items-center gap-1.5">
       <div className="w-3 h-3 bg-purple-500 rounded"></div>
       <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Trade-in</span>
     </div>
     <div className="flex items-center gap-1.5">
       <div className="w-4 h-0 border-t-2 border-dashed border-orange-500"></div>
       <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{t('status.maxCapacity')}</span>
     </div>
   </div>
 </div>
</div>
     </div>
    
     {/* График статусов моделей */}
     <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 shadow-md mb-6`}>
       <div className="flex justify-between mb-2">
         <h2 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('charts.carStatusInWarehouses')}</h2>
         <span className="text-sm bg-green-500/20 text-green-400 px-2 py-1 rounded-full">{t('charts.percentageRatio')}</span>
       </div>
       <div ref={modelInventoryChartRef} className="h-[300px]"></div>
     </div>
    
     {/* Выбор модели авто с использованием фото */}
<div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 shadow-md mb-6`}>
 <div className="flex justify-between mb-4">
   <div>
     <h2 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('sections.carModels')}</h2>
     <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('sections.selectModelHint')}</p>
   </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
   {enhancedCarModels.map(model => (
     <div 
       key={model.id}
       className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg overflow-hidden cursor-pointer transition-all ${
         selectedCarModel?.id === model.id ? 'ring-2 ring-blue-500' : isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
       }`}
       onClick={() => handleCarModelClick(model)}
     >
       <div className={`${isDark ? 'bg-gray-800' : 'bg-gray-200'} relative overflow-hidden rounded-t-lg`}>
         <div className="pt-[75%] relative">
           <img 
             src={model.img} 
             alt={model.name}
             className="absolute inset-0 w-full h-full object-contain p-2" 
           />
         </div>
         <div className={`absolute bottom-0 left-0 right-0 px-2 py-1 ${isDark ? 'bg-gray-900/70' : 'bg-gray-800/70'} text-xs text-white text-center`}>
           {model.category === 'sedan' ? t('categories.sedan') :
           model.category === 'suv' ? t('categories.suv') :
           model.category === 'minivan' ? t('categories.minivan') : model.category}
         </div>
       </div>
       <div className="p-3">
         <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>{model.name}</div>
         <div className="flex justify-between text-sm">
           <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>{t('metrics.total')}:</span>
           <span className={isDark ? 'text-white' : 'text-gray-900'}>{model.totalCount}</span>
         </div>
         <div className="mt-2 flex gap-1 flex-wrap">
           {/* Показываем все статусы, даже если 0 */}
           <span className={`text-xs px-1.5 py-0.5 rounded ${
             model.available > 0 ? 'bg-green-500/20 text-green-400' : isDark ? 'bg-gray-600/20 text-gray-500' : 'bg-gray-300/20 text-gray-500'
           }`}>
             {model.available} {t('status.availableShort')}
           </span>
           <span className={`text-xs px-1.5 py-0.5 rounded ${
             model.reserved > 0 ? 'bg-blue-500/20 text-blue-400' : isDark ? 'bg-gray-600/20 text-gray-500' : 'bg-gray-300/20 text-gray-500'
           }`}>
             {model.reserved} {t('status.reservedShort')}
           </span>
           <span className={`text-xs px-1.5 py-0.5 rounded ${
             model.defectiveOk > 0 ? 'bg-amber-500/20 text-amber-400' : isDark ? 'bg-gray-600/20 text-gray-500' : 'bg-gray-300/20 text-gray-500'
           }`}>
             {model.defectiveOk} {t('status.defectiveOkShort')}
           </span>
           <span className={`text-xs px-1.5 py-0.5 rounded ${
             model.defective > 0 ? 'bg-red-500/20 text-red-400' : isDark ? 'bg-gray-600/20 text-gray-500' : 'bg-gray-300/20 text-gray-500'
           }`}>
             {model.defective} {t('status.defectiveShort')}
           </span>
           <span className={`text-xs px-1.5 py-0.5 rounded ${
             model.tradeIn > 0 ? 'bg-purple-500/20 text-purple-400' : isDark ? 'bg-gray-600/20 text-gray-500' : 'bg-gray-300/20 text-gray-500'
           }`}>
             {model.tradeIn} Trade-in
           </span>
         </div>
       </div>
     </div>
   ))}
 </div>
</div>
    
     {/* Таблица складов с обновленными статусами */}
<div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 shadow-md mb-6`}>
 <div className="overflow-x-auto">
   <table className="w-full text-sm">
     <thead>
       <tr className={`${isDark ? 'bg-gray-900/60' : 'bg-gray-100'} ${isDark ? 'text-gray-400' : 'text-gray-700'} text-left`}>
         <th className="p-3 rounded-l-lg">{t('table.warehouseName')}</th>
         <th className="p-3">{t('table.capacity')}</th>
         <th className="p-3">{t('table.occupied')}</th>
         <th className="p-3">{t('table.available')}</th>
         <th className="p-3">{t('table.reserved')}</th>
         <th className="p-3">{t('table.defectiveOk')}</th>
         <th className="p-3">{t('table.defective')}</th>
         <th className="p-3">Trade-in</th>
         {/* Добавляем новые колонки если есть данные */}
         {enhancedWarehouses.some(w => w.atDealer > 0) && (
           <th className="p-3">У дилера</th>
         )}
         {enhancedWarehouses.some(w => w.inTransit > 0) && (
           <th className="p-3">В пути</th>
         )}
         <th className="p-3 rounded-r-lg">{t('table.actions')}</th>
       </tr>
     </thead>
     <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
       {enhancedWarehouses.map(warehouse => (
         <motion.tr 
           key={warehouse.id} 
           className={`${isDark ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'} transition-colors cursor-pointer ${
             selectedWarehouse?.id === warehouse.id ? isDark ? 'bg-blue-900/20' : 'bg-blue-50' : ''
           }`}
           onClick={() => handleWarehouseClick(warehouse)}
           whileHover={{ backgroundColor: isDark ? 'rgba(55, 65, 81, 0.3)' : 'rgba(249, 250, 251, 1)' }}
         >
           <td className={`p-3 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{warehouse.name}</td>
           <td className={`p-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{warehouse.capacity}</td>
           <td className="p-3">
             <div className="flex items-center">
               <div className={`w-24 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2.5 mr-2`}>
                 <div 
                   className={`h-2.5 rounded-full ${
                     warehouse.occupancyRate > 90 ? 'bg-red-500' : 
                     warehouse.occupancyRate > 75 ? 'bg-orange-500' : 
                     warehouse.occupancyRate > 50 ? 'bg-yellow-500' : 'bg-green-500'
                   }`}
                   style={{ width: `${warehouse.occupancyRate}%` }}
                 ></div>
               </div>
               <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{warehouse.occupancyRate}%</span>
             </div>
           </td>
           <td className={`p-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{warehouse.available}</td>
           <td className={`p-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{warehouse.reserved}</td>
           <td className="p-3">
             <span className={`bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full text-xs`}>
               {warehouse.defectiveOk}
             </span>
           </td>
           <td className="p-3">
             <span className={`bg-red-500/20 text-red-400 px-2 py-1 rounded-full text-xs`}>
               {warehouse.defective}
             </span>
           </td>
           <td className="p-3">
             <span className={`bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full text-xs`}>
               {warehouse.tradeIn}
             </span>
           </td>
           {enhancedWarehouses.some(w => w.atDealer > 0) && (
             <td className="p-3">
               <span className={`bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-full text-xs`}>
                 {warehouse.atDealer || 0}
               </span>
             </td>
           )}
           {enhancedWarehouses.some(w => w.inTransit > 0) && (
             <td className="p-3">
               <span className={`bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full text-xs`}>
                 {warehouse.inTransit || 0}
               </span>
             </td>
           )}
           <td className="p-3">
             <button className="text-blue-400 hover:text-blue-300 transition-colors p-1 rounded-full">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                 <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                 <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
               </svg>
             </button>
           </td>
         </motion.tr>
       ))}
     </tbody>
   </table>
 </div>
</div>
    
     {/* Детальная информация о выбранной модели */}
     <AnimatePresence>
       {selectedCarModel && (
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: 20 }}
           transition={{ duration: 0.3 }}
           className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-5 shadow-md mb-6 border ${isDark ? 'border-blue-900/30' : 'border-blue-200'}`}
         >
           <div className="flex flex-col md:flex-row justify-between items-start mb-5">
             <div className="flex flex-col md:flex-row items-start md:items-center">
               <img 
                 src={selectedCarModel.img} 
                 alt={selectedCarModel.name} 
                 className={`h-16 w-24 object-contain ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded mb-3 md:mb-0 md:mr-4`} 
               />
               <div>
                 <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedCarModel.name}</h2>
                 <p className="text-blue-400 text-sm">{t('details.carModelDetails')}</p>
                 <div className="flex items-center mt-1">
                   <span className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mr-2`}>{selectedCarModel.totalCount} {t('units')}</span>
                   <span className={`text-sm capitalize ${isDark ? 'bg-gray-700' : 'bg-gray-200'} px-2 py-0.5 rounded`}>{
                     selectedCarModel.category === 'sedan' ? t('categories.sedan') :
                     selectedCarModel.category === 'suv' ? t('categories.suv') :
                     selectedCarModel.category === 'minivan' ? t('categories.minivan') : selectedCarModel.category
                   }</span>
                 </div>
               </div>
             </div>
             <button 
               onClick={() => setSelectedCarModel(null)}
               className={`${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} p-1 rounded-full ${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'} mt-3 md:mt-0`}
             >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
           </div>
          
           <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
             {/* Краткая информация о статусах */}
             <div className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-100'} p-4 rounded-lg`}>
               <h3 className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium mb-3`}>{t('details.modelStatistics')}</h3>
               <div className="grid grid-cols-2 gap-3">
                 <div className={`${isDark ? 'bg-gray-800/70' : 'bg-white'} p-3 rounded-lg`}>
                   <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>{t('metrics.totalInWarehouses')}</div>
                   <div className={`${isDark ? 'text-white' : 'text-gray-900'} text-lg font-medium`}>{selectedCarModel.totalCount}</div>
                 </div>
                 <div className={`${isDark ? 'bg-gray-800/70' : 'bg-white'} p-3 rounded-lg`}>
                   <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>{t('metrics.available')}</div>
                   <div className={`${isDark ? 'text-white' : 'text-gray-900'} text-lg font-medium`}>{selectedCarModel.available}</div>
                 </div>
                 <div className={`${isDark ? 'bg-gray-800/70' : 'bg-white'} p-3 rounded-lg`}>
                   <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>{t('metrics.reserved')}</div>
                   <div className={`${isDark ? 'text-white' : 'text-gray-900'} text-lg font-medium`}>{selectedCarModel.reserved}</div>
                 </div>
                 <div className={`${isDark ? 'bg-gray-800/70' : 'bg-white'} p-3 rounded-lg`}>
                   <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>{t('metrics.defectiveOk')}</div>
                   <div className={`${isDark ? 'text-white' : 'text-gray-900'} text-lg font-medium`}>{selectedCarModel.defectiveOk}</div>
                 </div>
                 <div className={`${isDark ? 'bg-gray-800/70' : 'bg-white'} p-3 rounded-lg`}>
                   <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>{t('metrics.defective')}</div>
                   <div className={`${isDark ? 'text-white' : 'text-gray-900'} text-lg font-medium`}>{selectedCarModel.defective}</div>
                 </div>
                 <div className={`${isDark ? 'bg-gray-800/70' : 'bg-white'} p-3 rounded-lg`}>
                   <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>Trade-in</div>
                   <div className={`${isDark ? 'text-white' : 'text-gray-900'} text-lg font-medium`}>{selectedCarModel.tradeIn}</div>
                 </div>
               </div>
             </div>
            
             {/* Доступность модели - изменено на линейные индикаторы */}
             <div className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-100'} p-4 rounded-lg md:col-span-2`}>
               <h3 className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium`}>{t('details.statusDistribution')}</h3>
               <div className="space-y-4 mt-3">
                 {/* Свободные автомобили */}
                 <div>
                   <div className="flex justify-between mb-1">
                     <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{t('status.available')}</span>
                     <span className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium`}>
                       {selectedCarModel.available} {t('units')} 
                       ({Math.round((selectedCarModel.available / selectedCarModel.totalCount) * 100)}%)
                     </span>
                   </div>
                   <div className={`w-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'} h-3 rounded-full overflow-hidden`}>
                     <div 
                       className="h-full bg-green-500 rounded-full"
                       style={{ width: `${(selectedCarModel.available / selectedCarModel.totalCount) * 100}%` }}
                     ></div>
                   </div>
                 </div>
                
                 {/* Закрепленные автомобили */}
                 <div>
                   <div className="flex justify-between mb-1">
                     <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{t('status.reserved')}</span>
                     <span className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium`}>
                       {selectedCarModel.reserved} {t('units')} 
                       ({Math.round((selectedCarModel.reserved / selectedCarModel.totalCount) * 100)}%)
                     </span>
                   </div>
                   <div className={`w-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'} h-3 rounded-full overflow-hidden`}>
                     <div 
                       className="h-full bg-blue-500 rounded-full"
                       style={{ width: `${(selectedCarModel.reserved / selectedCarModel.totalCount) * 100}%` }}
                     ></div>
                   </div>
                 </div>
                
                 {/* Брак-ОК автомобили */}
                 <div>
                   <div className="flex justify-between mb-1">
                     <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{t('status.defectiveOk')}</span>
                     <span className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium`}>
                       {selectedCarModel.defectiveOk} {t('units')} 
                       ({Math.round((selectedCarModel.defectiveOk / selectedCarModel.totalCount) * 100)}%)
                     </span>
                   </div>
                   <div className={`w-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'} h-3 rounded-full overflow-hidden`}>
                     <div 
                       className="h-full bg-amber-500 rounded-full"
                       style={{ width: `${(selectedCarModel.defectiveOk / selectedCarModel.totalCount) * 100}%` }}
                     ></div>
                   </div>
                 </div>
                
                 {/* Бракованные автомобили */}
                 <div>
                   <div className="flex justify-between mb-1">
                     <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{t('status.defective')}</span>
                     <span className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium`}>
                       {selectedCarModel.defective} {t('units')} 
                       ({Math.round((selectedCarModel.defective / selectedCarModel.totalCount) * 100)}%)
                     </span>
                   </div>
                   <div className={`w-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'} h-3 rounded-full overflow-hidden`}>
                     <div 
                       className="h-full bg-red-500 rounded-full"
                       style={{ width: `${(selectedCarModel.defective / selectedCarModel.totalCount) * 100}%` }}
                     ></div>
                   </div>
                 </div>
                 
                 {/* Trade-in автомобили */}
                 <div>
                   <div className="flex justify-between mb-1">
                     <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Trade-in</span>
                     <span className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium`}>
                       {selectedCarModel.tradeIn} {t('units')} 
                       ({Math.round((selectedCarModel.tradeIn / selectedCarModel.totalCount) * 100)}%)
                     </span>
                   </div>
                   <div className={`w-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'} h-3 rounded-full overflow-hidden`}>
                     <div 
                       className="h-full bg-purple-500 rounded-full"
                       style={{ width: `${(selectedCarModel.tradeIn / selectedCarModel.totalCount) * 100}%` }}
                     ></div>
                   </div>
                 </div>
               </div>
             </div>
           </div>
          
           {/* График распределения по цветам - заменяем на улучшенную сетку цветов */}
           <div className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-100'} p-4 rounded-lg mb-5`}>
             <div className="flex justify-between items-center mb-3">
               <h3 className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium`}>{t('details.colorDistribution')}</h3>
               <div className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                 {t('details.availableColors', { count: selectedCarModel.colors.length })}
               </div>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
               {filteredColors.map(color => (
                 <div key={color.name} className={`${isDark ? 'bg-gray-800/70' : 'bg-white'} p-3 rounded-lg overflow-hidden`}>
                   <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center">
                       <div 
                         className={`w-6 h-6 rounded-full mr-2 border ${isDark ? 'border-gray-600' : 'border-gray-300'}`} 
                         style={{ backgroundColor: color.hex }}
                       />
                       <span className={`${isDark ? 'text-white' : 'text-gray-900'} text-sm font-medium`}>{color.name}</span>
                     </div>
                     <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-xs`}>{color.count} {t('units')}</span>
                   </div>
                   
                   {/* Индикаторы статусов */}
                   <div className="space-y-2 mt-3">
                     <div className="flex justify-between items-center">
                       <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('status.available')}:</span>
                       <div className="flex items-center">
                         <span className={`text-xs ${isDark ? 'text-white' : 'text-gray-900'} mr-1`}>{color.available}</span>
                         <div className={`w-16 h-1.5 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                           <div 
                             className="h-full bg-green-500 rounded-full"
                             style={{ width: `${(color.available / color.count) * 100}%` }}
                           ></div>
                         </div>
                       </div>
                     </div>
                     
                     <div className="flex justify-between items-center">
                       <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('status.reserved')}:</span>
                       <div className="flex items-center">
                         <span className={`text-xs ${isDark ? 'text-white' : 'text-gray-900'} mr-1`}>{color.reserved}</span>
                         <div className={`w-16 h-1.5 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                           <div 
                             className="h-full bg-blue-500 rounded-full"
                             style={{ width: `${(color.reserved / color.count) * 100}%` }}
                           ></div>
                         </div>
                       </div>
                     </div>
                     
                     <div className="flex justify-between items-center">
                       <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('status.defectiveOk')}:</span>
                       <div className="flex items-center">
                         <span className={`text-xs ${isDark ? 'text-white' : 'text-gray-900'} mr-1`}>{color.defectiveOk}</span>
                         <div className={`w-16 h-1.5 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                           <div 
                             className="h-full bg-amber-500 rounded-full"
                             style={{ width: `${(color.defectiveOk / color.count) * 100}%` }}
                           ></div>
                         </div>
                       </div>
                     </div>
                     
                     <div className="flex justify-between items-center">
                       <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('status.defective')}:</span>
                       <div className="flex items-center">
                         <span className={`text-xs ${isDark ? 'text-white' : 'text-gray-900'} mr-1`}>{color.defective}</span>
                         <div className={`w-16 h-1.5 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                           <div 
                             className="h-full bg-red-500 rounded-full"
                             style={{ width: `${(color.defective / color.count) * 100}%` }}
                           ></div>
                         </div>
                       </div>
                     </div>
                     
                     {color.tradeIn > 0 && (
                       <div className="flex justify-between items-center">
                         <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Trade-in:</span>
                         <div className="flex items-center">
                           <span className={`text-xs ${isDark ? 'text-white' : 'text-gray-900'} mr-1`}>{color.tradeIn}</span>
                           <div className={`w-16 h-1.5 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                             <div 
                               className="h-full bg-purple-500 rounded-full"
                               style={{ width: `${(color.tradeIn / color.count) * 100}%` }}
                             ></div>
                           </div>
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
               ))}
             </div>
           </div>
          
           {/* Выбор модификации - улучшенное отображение */}
           <div className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-100'} p-4 rounded-lg mb-5`}>
             <div className="flex justify-between items-center mb-3">
               <h3 className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium`}>{t('details.modifications', { model: selectedCarModel.name })}</h3>
               <div className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                 {t('details.modificationsCount', { count: selectedCarModel.modifications.length })}
               </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
               {filteredModifications.map(modification => (
                 <div 
                   key={modification.id} 
                   className={`${isDark ? 'bg-gray-800/70' : 'bg-white'} p-3 rounded-lg cursor-pointer transition-all ${
                     selectedModification?.id === modification.id ? 'ring-2 ring-blue-500' : isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                   }`}
                   onClick={() => handleModificationClick(modification)}
                 >
                   <div className="flex justify-between mb-2">
                     <span className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium`}>{modification.name}</span>
                     <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{modification.count} {t('units')}</span>
                   </div>
                   
                   {/* Полоса прогресса для отображения статусов */}
                   <div className={`h-2 w-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden flex mb-3`}>
                     <div 
                       className="h-full bg-green-500" 
                       style={{ width: `${(modification.available / modification.count) * 100}%` }}
                     ></div>
                     <div 
                       className="h-full bg-blue-500" 
                       style={{ width: `${(modification.reserved / modification.count) * 100}%` }}
                     ></div>
                     <div 
                       className="h-full bg-amber-500" 
                       style={{ width: `${(modification.defectiveOk / modification.count) * 100}%` }}
                     ></div>
                     <div 
                       className="h-full bg-red-500" 
                       style={{ width: `${(modification.defective / modification.count) * 100}%` }}
                     ></div>
                     <div 
                       className="h-full bg-purple-500" 
                       style={{ width: `${(modification.tradeIn / modification.count) * 100}%` }}
                     ></div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-2">
                     <div className="flex justify-between items-center bg-green-500/10 px-2 py-1 rounded">
                       <span className="text-xs text-green-400">{t('status.available')}</span>
                       <span className={`text-xs ${isDark ? 'text-white' : 'text-gray-900'}`}>{modification.available}</span>
                     </div>
                     <div className="flex justify-between items-center bg-blue-500/10 px-2 py-1 rounded">
                       <span className="text-xs text-blue-400">{t('status.reserved')}</span>
                       <span className={`text-xs ${isDark ? 'text-white' : 'text-gray-900'}`}>{modification.reserved}</span>
                     </div>
                     <div className="flex justify-between items-center bg-amber-500/10 px-2 py-1 rounded">
                       <span className="text-xs text-amber-400">{t('status.defectiveOk')}</span>
                       <span className={`text-xs ${isDark ? 'text-white' : 'text-gray-900'}`}>{modification.defectiveOk}</span>
                     </div>
                     <div className="flex justify-between items-center bg-red-500/10 px-2 py-1 rounded">
                       <span className="text-xs text-red-400">{t('status.defective')}</span>
                       <span className={`text-xs ${isDark ? 'text-white' : 'text-gray-900'}`}>{modification.defective}</span>
                     </div>
                     {modification.tradeIn > 0 && (
                       <div className="flex justify-between items-center bg-purple-500/10 px-2 py-1 rounded col-span-2">
                         <span className="text-xs text-purple-400">Trade-in</span>
                         <span className={`text-xs ${isDark ? 'text-white' : 'text-gray-900'}`}>{modification.tradeIn}</span>
                       </div>
                     )}
                   </div>
                 </div>
               ))}
             </div>
           </div>
          
           {/* Отображение выбранной модификации */}
           {selectedModification && (
             <div className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-100'} p-4 rounded-lg mb-5`}>
               <div className="flex flex-col md:flex-row gap-5">
                 <div className="md:w-1/2">
                   <h3 className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium mb-3`}>{selectedCarModel.name} - {selectedModification.name}</h3>
                   <img 
                     src={selectedCarModel.img} 
                     alt={`${selectedCarModel.name} ${selectedModification.name}`} 
                     className="w-full h-64 object-cover rounded-lg"
                   />
                 </div>
                 <div className="md:w-1/2 flex flex-col">
                   <h3 className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium mb-3`}>{t('details.modificationDetails')}</h3>
                   <div className="grid grid-cols-2 gap-3 mb-auto">
                     <div className={`${isDark ? 'bg-gray-800/70' : 'bg-white'} p-3 rounded-lg`}>
                       <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>{t('metrics.total')}</div>
             <div className={`${isDark ? 'text-white' : 'text-gray-900'} text-lg font-medium`}>{selectedModification.count}</div>
                     </div>
                     <div className={`${isDark ? 'bg-gray-800/70' : 'bg-white'} p-3 rounded-lg`}>
                       <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>{t('metrics.available')}</div>
                       <div className={`${isDark ? 'text-white' : 'text-gray-900'} text-lg font-medium`}>{selectedModification.available}</div>
                     </div>
                     <div className={`${isDark ? 'bg-gray-800/70' : 'bg-white'} p-3 rounded-lg`}>
                       <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>{t('metrics.reserved')}</div>
                       <div className={`${isDark ? 'text-white' : 'text-gray-900'} text-lg font-medium`}>{selectedModification.reserved}</div>
                     </div>
                     <div className={`${isDark ? 'bg-gray-800/70' : 'bg-white'} p-3 rounded-lg`}>
                       <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>{t('metrics.defectiveOk')}</div>
                       <div className={`${isDark ? 'text-white' : 'text-gray-900'} text-lg font-medium`}>{selectedModification.defectiveOk}</div>
                     </div>
                     <div className={`${isDark ? 'bg-gray-800/70' : 'bg-white'} p-3 rounded-lg`}>
                       <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>{t('metrics.defective')}</div>
                       <div className={`${isDark ? 'text-white' : 'text-gray-900'} text-lg font-medium`}>{selectedModification.defective}</div>
                     </div>
                     <div className={`${isDark ? 'bg-gray-800/70' : 'bg-white'} p-3 rounded-lg`}>
                       <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>Trade-in</div>
                       <div className={`${isDark ? 'text-white' : 'text-gray-900'} text-lg font-medium`}>{selectedModification.tradeIn}</div>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           )}
         </motion.div>
       )}
     </AnimatePresence>
    
     {/* Детальная информация о выбранном складе */}
     <AnimatePresence>
       {selectedWarehouse && (
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: 20 }}
           transition={{ duration: 0.3 }}
           className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-5 shadow-md mb-6 border ${isDark ? 'border-purple-900/30' : 'border-purple-200'}`}
         >
           <div className="flex justify-between items-start mb-5">
             <div>
               <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedWarehouse.name}</h2>
               <p className="text-purple-400 text-sm">{t('details.warehouseDetails')}</p>
               <div className="flex items-center mt-1">
                 <span className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mr-2`}>{selectedWarehouse.totalCount} {t('car')}</span>
                 <span className={`text-sm px-2 py-0.5 rounded ${
                   selectedWarehouse.status === 'critical' ? 'bg-red-500/20 text-red-400' :
                   selectedWarehouse.status === 'high' ? 'bg-orange-500/20 text-orange-400' :
                   selectedWarehouse.status === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                   'bg-green-500/20 text-green-400'
                 }`}>
                   {t('details.occupancy')}: {selectedWarehouse.occupancyRate}%
                 </span>
               </div>
             </div>
             <button 
               onClick={() => setSelectedWarehouse(null)}
               className={`${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} p-1 rounded-full ${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'}`}
             >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
           </div>
          
           <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
             {/* Краткая информация с обновленными статусами */}
             <div className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-100'} p-4 rounded-lg`}>
               <h3 className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium mb-3`}>{t('details.warehouseInfo')}</h3>
               <div className="grid grid-cols-2 gap-3">
                 <div className={`${isDark ? 'bg-gray-800/70' : 'bg-white'} p-3 rounded-lg`}>
                   <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>{t('metrics.totalCars')}</div>
                   <div className={`${isDark ? 'text-white' : 'text-gray-900'} text-lg font-medium`}>{selectedWarehouse.totalCount}</div>
                 </div>
                 <div className={`${isDark ? 'bg-gray-800/70' : 'bg-white'} p-3 rounded-lg`}>
                   <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>{t('metrics.available')}</div>
                   <div className={`${isDark ? 'text-white' : 'text-gray-900'} text-lg font-medium`}>{selectedWarehouse.available}</div>
                 </div>
                 <div className={`${isDark ? 'bg-gray-800/70' : 'bg-white'} p-3 rounded-lg`}>
                   <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>{t('metrics.reserved')}</div>
                   <div className={`${isDark ? 'text-white' : 'text-gray-900'} text-lg font-medium`}>{selectedWarehouse.reserved}</div>
                 </div>
                 <div className={`${isDark ? 'bg-gray-800/70' : 'bg-white'} p-3 rounded-lg`}>
                   <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>{t('metrics.defectiveOk')}</div>
                   <div className={`${isDark ? 'text-white' : 'text-gray-900'} text-lg font-medium`}>{selectedWarehouse.defectiveOk}</div>
                 </div>
                 <div className={`${isDark ? 'bg-gray-800/70' : 'bg-white'} p-3 rounded-lg`}>
                   <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>{t('metrics.defective')}</div>
                   <div className={`${isDark ? 'text-white' : 'text-gray-900'} text-lg font-medium`}>{selectedWarehouse.defective}</div>
                 </div>
                 <div className={`${isDark ? 'bg-gray-800/70' : 'bg-white'} p-3 rounded-lg`}>
                   <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>Trade-in</div>
                   <div className={`${isDark ? 'text-white' : 'text-gray-900'} text-lg font-medium`}>{selectedWarehouse.tradeIn}</div>
                 </div>
               </div>
             </div>
            
             {/* График заполненности склада */}
             <div className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-100'} p-4 rounded-lg md:col-span-2`}>
               <h3 className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium mb-3`}>{t('details.warehouseOccupancy')}</h3>
               <div ref={warehouseOccupancyRef} className="h-[200px]"></div>
             </div>
           </div>
          
           <div className="grid grid-cols-1 md:grid-cols-1 gap-5 mb-5">
             {/* Распределение по моделям */}
             <div className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-100'} p-4 rounded-lg`}>
               <h3 className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium mb-3`}>{t('details.modelDistribution')}</h3>
               <div className="space-y-3">
                 {/* Убираем ограничение slice(0, 5) чтобы показать все модели */}
                 {selectedWarehouse.models
                   .filter(model => model.count > 0)
                   .sort((a, b) => b.count - a.count) // Сортируем по количеству
                   .map(model => {
                     // Для отладки выводим все статусы
                     console.log(`Модель ${model.name}:`, {
                       count: model.count,
                       available: model.available,
                       reserved: model.reserved,
                       defective: model.defective,
                       defectiveOk: model.defectiveOk,
                       tradeIn: model.tradeIn,
                       atDealer: model.atDealer,
                       inTransit: model.inTransit,
                       otherStatuses: model.otherStatuses
                     });
                     
                     return (
                       <div key={model.id} className="group cursor-pointer" onClick={() => toggleModelDetailInWarehouse(model.id)}>
                         <div className="flex flex-col">
                           <div className="flex justify-between mb-1">
                             <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{model.name}</span>
                             <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{model.count} {t('units')}</span>
                           </div>
                           
                           {/* Показываем все статусы в более компактном виде */}
                           <div className="flex flex-wrap gap-2 text-xs">
                             {model.available > 0 && (
                               <span className="text-green-400">
                                 {model.available} {t('status.availableShort')}
                               </span>
                             )}
                             {model.reserved > 0 && (
                               <span className="text-blue-400">
                                 {model.reserved} {t('status.reservedShort')}
                               </span>
                             )}
                             {model.defectiveOk > 0 && (
                               <span className="text-amber-400">
                                 {model.defectiveOk} {t('status.defectiveOkShort')}
                               </span>
                             )}
                             {model.defective > 0 && (
                               <span className="text-red-400">
                                 {model.defective} {t('status.defectiveShort')}
                               </span>
                             )}
                             {model.tradeIn > 0 && (
                               <span className="text-purple-400">
                                 {model.tradeIn} Trade-in
                               </span>
                             )}
                             {model.atDealer > 0 && (
                               <span className="text-cyan-400">
                                 {model.atDealer} У дилера
                               </span>
                             )}
                             {model.inTransit > 0 && (
                               <span className="text-orange-400">
                                 {model.inTransit} В пути
                               </span>
                             )}
                             {/* Отображаем другие статусы */}
                             {Object.entries(model.otherStatuses || {}).map(([status, count]) => 
                               count > 0 && (
                                 <span key={status} className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                                   {count} {status}
                                 </span>
                               )
                             )}
                           </div>
                         </div>
                         
                         <div className={`w-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'} h-2 rounded-full overflow-hidden mt-2`}>
                           <div 
                             className="h-full bg-purple-500 group-hover:bg-purple-400 transition-all rounded-full"
                             style={{ width: `${(model.count / selectedWarehouse.totalCount) * 100}%` }}
                           ></div>
                         </div>
                       </div>
                     );
                   })}
               </div>
               
               {/* Добавляем информацию о количестве моделей */}
               <div className={`mt-3 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                 Показано моделей: {selectedWarehouse.models.filter(model => model.count > 0).length} из {selectedWarehouse.models.length}
               </div>
             </div>
               
               {/* Расширенное представление для выбранной модели в контексте склада */}
               <AnimatePresence>
                 {selectedWarehouseModel && (
                   <motion.div
                     initial={{ opacity: 0, height: 0 }}
                     animate={{ opacity: 1, height: 'auto' }}
                     exit={{ opacity: 0, height: 0 }}
                     transition={{ duration: 0.3 }}
                     className={`${isDark ? 'bg-gray-800/60' : 'bg-gray-50'} mt-5 p-4 rounded-lg overflow-hidden`}
                   >
                     {(() => {
                       const modelData = selectedWarehouse.models.find(m => m.id === selectedWarehouseModel);
                       const fullModelData = enhancedCarModels.find(m => m.id === selectedWarehouseModel);
                       
                       if (!modelData || !fullModelData) return <div>{t('errors.dataNotFound')}</div>;
                       
                       return (
                         <>
                           <div className="flex justify-between items-center mb-4">
                             <h4 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{modelData.name} {t('details.inWarehouse')} {selectedWarehouse.name}</h4>
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setSelectedWarehouseModel(null);
                               }}
                               className={`${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                             >
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                               </svg>
                             </button>
                           </div>
                           
                           {/* Статистика по модели на этом складе */}
                           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
                             <div className={`${isDark ? 'bg-gray-700' : 'bg-white'} p-3 rounded-lg`}>
                               <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>{t('metrics.total')}</div>
                               <div className={`${isDark ? 'text-white' : 'text-gray-900'} text-lg font-medium`}>{modelData.count}</div>
                             </div>
                             <div className="bg-green-900/30 p-3 rounded-lg">
                               <div className="text-green-400 text-xs">{t('metrics.available')}</div>
                               <div className={`${isDark ? 'text-white' : 'text-gray-900'} text-lg font-medium`}>{modelData.available}</div>
                             </div>
                             <div className="bg-blue-900/30 p-3 rounded-lg">
                               <div className="text-blue-400 text-xs">{t('metrics.reserved')}</div>
                               <div className={`${isDark ? 'text-white' : 'text-gray-900'} text-lg font-medium`}>{modelData.reserved}</div>
                             </div>
                             <div className="bg-amber-900/30 p-3 rounded-lg">
                               <div className="text-amber-400 text-xs">{t('metrics.defectiveOk')}</div>
                               <div className={`${isDark ? 'text-white' : 'text-gray-900'} text-lg font-medium`}>{modelData.defectiveOk}</div>
                             </div>
                             <div className="bg-red-900/30 p-3 rounded-lg">
                               <div className="text-red-400 text-xs">{t('metrics.defective')}</div>
                               <div className={`${isDark ? 'text-white' : 'text-gray-900'} text-lg font-medium`}>{modelData.defective}</div>
                             </div>
                             <div className="bg-purple-900/30 p-3 rounded-lg">
                               <div className="text-purple-400 text-xs">Trade-in</div>
                               <div className={`${isDark ? 'text-white' : 'text-gray-900'} text-lg font-medium`}>{modelData.tradeIn}</div>
                             </div>
                           </div>
                           
                           {/* Табы для выбора между цветами и модификациями */}
                           <div className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-300'} mb-4`}>
                             <nav className="-mb-px flex space-x-6">
                               <button 
                                 className={`pb-2 font-medium text-sm ${
                                   warehouseModelViewTab === 'modifications' 
                                     ? 'border-b-2 border-blue-500 text-blue-400' 
                                     : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'
                                 }`}
                                 onClick={() => setWarehouseModelViewTab('modifications')}
                               >
                                 {t('tabs.modifications')}
                               </button>
                               <button 
                                 className={`pb-2 font-medium text-sm ${
                                   warehouseModelViewTab === 'colors' 
                                     ? 'border-b-2 border-blue-500 text-blue-400' 
                                     : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'
                                 }`}
                                 onClick={() => setWarehouseModelViewTab('colors')}
                               >
                                 {t('tabs.colors')}
                               </button>
                             </nav>
                           </div>
                           
                           {/* Содержимое таба модификаций */}
                           {warehouseModelViewTab === 'modifications' && (
                             <div className="space-y-3">
                               <h5 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>{t('details.allModifications', { model: modelData.name })}</h5>
                               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                 {fullModelData.modifications.map(mod => {
                                   const warehouseMod = {
                                     ...mod,
                                     warehouseCount: Math.floor(mod.count * (modelData.count / fullModelData.totalCount))
                                   };
                                   
                                   if (warehouseMod.warehouseCount <= 0) return null;
                                   
                                   return (
                                     <div key={mod.id} className={`${isDark ? 'bg-gray-700/50' : 'bg-white'} p-3 rounded-lg`}>
                                       <div className="flex justify-between mb-1">
                                         <span className={`${isDark ? 'text-white' : 'text-gray-900'} text-sm`}>{mod.name}</span>
                                         <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>{warehouseMod.warehouseCount} {t('units')}</span>
                                       </div>
                                       <div className="grid grid-cols-2 gap-1 mt-2">
                                         <div className="bg-green-900/20 px-1.5 py-1 rounded flex justify-between">
                                           <span className="text-green-400 text-xs">{t('status.availableShort')}:</span>
                                           <span className={`${isDark ? 'text-white' : 'text-gray-900'} text-xs`}>{Math.floor(warehouseMod.warehouseCount * (modelData.available / modelData.count))}</span>
                                         </div>
                                         <div className="bg-blue-900/20 px-1.5 py-1 rounded flex justify-between">
                                           <span className="text-blue-400 text-xs">{t('status.reservedShort')}:</span>
                                           <span className={`${isDark ? 'text-white' : 'text-gray-900'} text-xs`}>{Math.floor(warehouseMod.warehouseCount * (modelData.reserved / modelData.count))}</span>
                                         </div>
                                         <div className="bg-amber-900/20 px-1.5 py-1 rounded flex justify-between">
                                           <span className="text-amber-400 text-xs">{t('status.defectiveOkShort')}:</span>
                                           <span className={`${isDark ? 'text-white' : 'text-gray-900'} text-xs`}>{Math.floor(warehouseMod.warehouseCount * (modelData.defectiveOk / modelData.count))}</span>
                                         </div>
                                         <div className="bg-red-900/20 px-1.5 py-1 rounded flex justify-between">
                                           <span className="text-red-400 text-xs">{t('status.defectiveShort')}:</span>
                                           <span className={`${isDark ? 'text-white' : 'text-gray-900'} text-xs`}>{Math.floor(warehouseMod.warehouseCount * (modelData.defective / modelData.count))}</span>
                                         </div>
                                         {modelData.tradeIn > 0 && (
                                           <div className="bg-purple-900/20 px-1.5 py-1 rounded flex justify-between col-span-2">
                                             <span className="text-purple-400 text-xs">Trade-in:</span>
                                             <span className={`${isDark ? 'text-white' : 'text-gray-900'} text-xs`}>{Math.floor(warehouseMod.warehouseCount * (modelData.tradeIn / modelData.count))}</span>
                                           </div>
                                         )}
                                       </div>
                                     </div>
                                   );
                                 }).filter(Boolean)}
                               </div>
                             </div>
                           )}
                           
                           {/* Содержимое таба цветов */}
                           {warehouseModelViewTab === 'colors' && (
                             <div className="space-y-3">
                               <h5 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>{t('details.colorDistribution')}</h5>
                               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                 {fullModelData.colors.map(color => {
                                   const warehouseColor = {
                                     ...color,
                                     warehouseCount: Math.floor(color.count * (modelData.count / fullModelData.totalCount))
                                   };
                                   
                                   if (warehouseColor.warehouseCount <= 0) return null;
                                   
                                   return (
                                     <div key={color.name} className={`${isDark ? 'bg-gray-700/50' : 'bg-white'} p-3 rounded-lg`}>
                                       <div className="flex items-center justify-between mb-2">
                                         <div className="flex items-center">
                                           <div 
                                             className={`w-4 h-4 rounded-full mr-2 border ${isDark ? 'border-gray-600' : 'border-gray-300'}`} 
                                             style={{ backgroundColor: color.hex }}
                                           />
                                           <span className={`${isDark ? 'text-white' : 'text-gray-900'} text-sm`}>{color.name}</span>
                                         </div>
                                         <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>{warehouseColor.warehouseCount} {t('units')}</span>
                                       </div>
                                       <div className="grid grid-cols-2 gap-1 mt-2">
                                         <div className="bg-green-900/20 px-1.5 py-1 rounded flex justify-between">
                                           <span className="text-green-400 text-xs">{t('status.availableShort')}:</span>
                                           <span className={`${isDark ? 'text-white' : 'text-gray-900'} text-xs`}>{Math.floor(warehouseColor.warehouseCount * (modelData.available / modelData.count))}</span>
                                         </div>
                                         <div className="bg-blue-900/20 px-1.5 py-1 rounded flex justify-between">
                                           <span className="text-blue-400 text-xs">{t('status.reservedShort')}:</span>
                                           <span className={`${isDark ? 'text-white' : 'text-gray-900'} text-xs`}>{Math.floor(warehouseColor.warehouseCount * (modelData.reserved / modelData.count))}</span>
                                         </div>
                                         <div className="bg-amber-900/20 px-1.5 py-1 rounded flex justify-between">
                                           <span className="text-amber-400 text-xs">{t('status.defectiveOkShort')}:</span>
                                           <span className={`${isDark ? 'text-white' : 'text-gray-900'} text-xs`}>{Math.floor(warehouseColor.warehouseCount * (modelData.defectiveOk / modelData.count))}</span>
                                         </div>
                                         <div className="bg-red-900/20 px-1.5 py-1 rounded flex justify-between">
                                           <span className="text-red-400 text-xs">{t('status.defectiveShort')}:</span>
                                           <span className={`${isDark ? 'text-white' : 'text-gray-900'} text-xs`}>{Math.floor(warehouseColor.warehouseCount * (modelData.defective / modelData.count))}</span>
                                         </div>
                                         {modelData.tradeIn > 0 && (
                                           <div className="bg-purple-900/20 px-1.5 py-1 rounded flex justify-between col-span-2">
                                             <span className="text-purple-400 text-xs">Trade-in:</span>
                                             <span className={`${isDark ? 'text-white' : 'text-gray-900'} text-xs`}>{Math.floor(warehouseColor.warehouseCount * (modelData.tradeIn / modelData.count))}</span>
                                           </div>
                                         )}
                                       </div>
                                     </div>
                                   );
                                 }).filter(Boolean)}
                               </div>
                             </div>
                           )}
                         </>
                       );
                     })()}
                   </motion.div>
                 )}
               </AnimatePresence>
           </div>
         </motion.div>
       )}
     </AnimatePresence>
       <div className="mt-6 mb-6">
       <WarehouseMonthlyChart isDark={isDark} />
     </div>
     {/* Контейнер уведомлений */}
     <NotificationsContainer />
   </div>
 );
};

export default CarWarehouseAnalytics;