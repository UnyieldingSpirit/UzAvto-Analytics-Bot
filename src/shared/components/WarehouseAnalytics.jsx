// components/WarehouseAnalytics.jsx
'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const WarehouseAnalytics = () => {
  const trafficChartRef = useRef(null);
  const genderChartRef = useRef(null);
  const browserChartRef = useRef(null);
  const inventoryChartRef = useRef(null);
  
  const [selectedMonth, setSelectedMonth] = useState('Январь');
  const [selectedView, setSelectedView] = useState('общий');

  useEffect(() => {
    renderTrafficChart();
    renderGenderChart();
    renderBrowserChart();
    renderInventoryLevelsChart();
    
    const handleResize = () => {
      renderTrafficChart();
      renderGenderChart();
      renderBrowserChart();
      renderInventoryLevelsChart();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedMonth, selectedView]);

  // Данные для диаграммы источников трафика
  const trafficData = [
    { source: 'Органический поиск', value: 62.7, color: '#3b82f6' },
    { source: 'Прямой', value: 40.6, color: '#ef4444' },
    { source: 'Реферал', value: 25.2, color: '#f59e0b' },
    { source: 'Другие', value: 10.6, color: '#22c55e' }
  ];

  // Данные для диаграммы посетителей по полу
  const genderData = [
    { month: 'Янв', male: 6, female: 3, other: 3 },
    { month: 'Фев', male: 5, female: 2, other: 4 },
    { month: 'Мар', male: 7, female: 2, other: 3 },
    { month: 'Апр', male: 8, female: 2, other: 1 },
    { month: 'Май', male: 4, female: 1, other: 4 }
  ];

  // Данные для диаграммы браузеров
  const browserData = [
    { browser: 'Chrome', percentage: 35, color: '#3b82f6' },
    { browser: 'Firefox', percentage: 20, color: '#ef4444' },
    { browser: 'Safari', percentage: 18, color: '#f59e0b' },
    { browser: 'Edge', percentage: 15, color: '#06b6d4' },
    { browser: 'Opera', percentage: 12, color: '#22c55e' }
  ];

  // Данные для уровней инвентаря (остаток на складе)
  const inventoryData = [
    { category: 'Электроника', stock: 85, defective: 5 },
    { category: 'Одежда', stock: 70, defective: 8 },
    { category: 'Мебель', stock: 60, defective: 12 },
    { category: 'Книги', stock: 90, defective: 2 },
    { category: 'Игрушки', stock: 75, defective: 7 }
  ];

  // Рендер диаграммы источников трафика
  const renderTrafficChart = () => {
    if (!trafficChartRef.current) return;
    
    const container = trafficChartRef.current;
    container.innerHTML = '';
    
    const margin = { top: 30, right: 20, bottom: 50, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
      
    // Создаем шкалы
    const x = d3.scaleBand()
      .range([0, width])
      .domain(trafficData.map(d => d.source))
      .padding(0.3);
      
    const y = d3.scaleLinear()
      .domain([0, 80])
      .range([height, 0]);
      
    // Добавляем оси
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#d1d5db');
      
    svg.append('g')
      .call(d3.axisLeft(y)
        .tickFormat(d => `${d}%`))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#d1d5db');
      
    // Добавляем сетку
    svg.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat(''))
      .selectAll('line')
      .style('stroke', 'rgba(255, 255, 255, 0.1)');
      
    // Добавляем заголовок
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('fill', '#f9fafb')
      .text(`Источники трафика. ${selectedMonth}, 2020`);
      
    // Подпись оси Y
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left + 15)
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#d1d5db')
      .text('Процент рынка');
      
    // Создаем столбцы с градиентом
    const defs = svg.append('defs');
    
    trafficData.forEach((d, i) => {
      const gradientId = `barGradient-${i}`;
      
      const gradient = defs.append('linearGradient')
        .attr('id', gradientId)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');
        
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', d3.rgb(d.color).brighter(0.5))
        .attr('stop-opacity', 1);
        
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', d.color)
        .attr('stop-opacity', 1);
        
      svg.append('rect')
        .attr('x', x(d.source))
        .attr('y', y(d.value))
        .attr('width', x.bandwidth())
        .attr('height', height - y(d.value))
        .attr('fill', `url(#${gradientId})`)
        .attr('rx', 4)
        .attr('ry', 4)
        .attr('opacity', 0)
        .transition()
        .duration(800)
        .delay(i * 100)
        .attr('opacity', 1);
    });
    
    // Добавляем значения над столбцами
    svg.selectAll('.value-label')
      .data(trafficData)
      .enter()
      .append('text')
      .attr('class', 'value-label')
      .attr('x', d => x(d.source) + x.bandwidth() / 2)
      .attr('y', d => y(d.value) - 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#ffffff')
      .style('font-weight', 'bold')
      .style('opacity', 0)
      .text(d => `${d.value}%`)
      .transition()
      .duration(800)
      .delay((d, i) => i * 100 + 300)
      .style('opacity', 1);
  };
  
  // Рендер диаграммы посетителей по полу
  const renderGenderChart = () => {
    if (!genderChartRef.current) return;
    
    const container = genderChartRef.current;
    container.innerHTML = '';
    
    const margin = { top: 30, right: 20, bottom: 40, left: 40 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
      
    // Добавляем заголовок
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('fill', '#f9fafb')
      .text('Посетители по полу');
      
    // Создаем шкалы
    const x = d3.scaleLinear()
      .domain([0, 12])
      .range([0, width]);
      
    const y = d3.scaleBand()
      .domain(genderData.map(d => d.month))
      .range([0, height])
      .padding(0.3);
      
    // Добавляем оси
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#d1d5db');
      
    svg.append('g')
      .call(d3.axisLeft(y))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#d1d5db');
      
    // Добавляем сетку
    svg.append('g')
      .attr('class', 'grid')
      .call(d3.axisBottom(x)
        .tickSize(height)
        .tickFormat(''))
      .selectAll('line')
      .style('stroke', 'rgba(255, 255, 255, 0.1)');
      
    // Добавляем стеки
    const stack = d3.stack()
      .keys(['other', 'female', 'male'])
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);
      
    const stackedData = stack(genderData);
    
    const colorScale = d3.scaleOrdinal()
      .domain(['male', 'female', 'other'])
      .range(['#3b82f6', '#ef4444', '#f59e0b']);
      
    // Создаем градиенты
    const defs = svg.append('defs');
    
    ['male', 'female', 'other'].forEach((key, i) => {
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
    
    // Добавляем стеки с анимацией
    svg.append('g')
      .selectAll('g')
      .data(stackedData)
      .join('g')
      .attr('fill', d => `url(#stackGradient-${d.key})`)
      .selectAll('rect')
      .data(d => d)
      .join('rect')
      .attr('y', d => y(d.data.month))
      .attr('height', y.bandwidth())
      .attr('x', d => x(d[0]))
      .attr('width', 0)
      .attr('rx', 3)
      .attr('ry', 3)
      .transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .attr('width', d => x(d[1]) - x(d[0]));
      
    // Добавляем легенду
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 120}, ${height - 80})`);
      
    const legendData = [
      { key: 'male', label: 'Мужчины' },
      { key: 'female', label: 'Женщины' },
      { key: 'other', label: 'Другие' }
    ];
    
    legendData.forEach((d, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);
        
      legendRow.append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', colorScale(d.key))
        .attr('rx', 2);
        
      legendRow.append('text')
        .attr('x', 20)
        .attr('y', 12)
        .style('font-size', '12px')
        .style('fill', '#d1d5db')
        .text(d.label);
    });
    
    // Добавляем подсказки при наведении
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background', 'rgba(15, 23, 42, 0.95)')
      .style('color', '#fff')
      .style('padding', '8px 12px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', 10)
      .style('box-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1)');
      
    // Выделяем активный месяц
    if (selectedMonth === 'Март') {
      const activeMonth = 'Мар';
      const monthData = genderData.find(d => d.month === activeMonth);
      
      if (monthData) {
        // Добавляем подсветку строки
        svg.append('rect')
          .attr('y', y(activeMonth) - 2)
          .attr('x', 0)
          .attr('width', width)
          .attr('height', y.bandwidth() + 4)
          .attr('fill', 'rgba(59, 130, 246, 0.1)')
          .attr('rx', 4)
          .style('opacity', 0)
          .transition()
          .duration(300)
          .style('opacity', 1);
          
        // Добавляем метки значений
        svg.append('text')
          .attr('x', 5)
          .attr('y', y(activeMonth) + y.bandwidth() / 2 + 4)
          .style('font-size', '12px')
          .style('fill', '#ffffff')
          .style('font-weight', 'bold')
          .text(`Мар: Муж. ${monthData.male}`);
      }
    }
  };
  
  // Рендер круговой диаграммы браузеров
  const renderBrowserChart = () => {
    if (!browserChartRef.current) return;
    
    const container = browserChartRef.current;
    container.innerHTML = '';
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    const radius = Math.min(width, height) / 2 * 0.8;
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width/2},${height/2})`);
      
    // Добавляем заголовок
    svg.append('text')
      .attr('x', 0)
      .attr('y', -height/2 + 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('fill', '#f9fafb')
      .text('Статистика браузеров');
      
    // Создаем пирог
    const pie = d3.pie()
      .value(d => d.percentage)
      .sort(null);
      
    const data_ready = pie(browserData);
    
    // Создаем дуги
    const arc = d3.arc()
      .innerRadius(radius * 0.4)
      .outerRadius(radius);
      
    const arcHover = d3.arc()
      .innerRadius(radius * 0.4)
      .outerRadius(radius * 1.07);
      
    // Создаем градиенты
    const defs = svg.append('defs');
    
    browserData.forEach((d, i) => {
      const gradientId = `pieGradient-${i}`;
      
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
    
    // Добавляем дуги с градиентами
    svg.selectAll('path')
      .data(data_ready)
      .join('path')
      .attr('d', arc)
      .attr('fill', (d, i) => `url(#pieGradient-${i})`)
      .attr('stroke', '#1f2937')
      .style('stroke-width', '2px')
      .style('opacity', 0.9)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arcHover);
          
        const total = d3.sum(browserData, d => d.percentage);
        const percent = Math.round((d.data.percentage / total) * 100);
        
        // Обновляем центральный текст
        centerLabel.text(d.data.browser);
        centerValue.text(`${percent}%`);
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arc);
          
        // Сбрасываем центральный текст
        centerLabel.text('Браузеры');
        centerValue.text('100%');
      })
      .transition()
      .duration(800)
      .attrTween('d', function(d) {
        const interpolate = d3.interpolate({startAngle: d.startAngle, endAngle: d.startAngle}, d);
        return function(t) {
          return arc(interpolate(t));
        };
      });
      
    // Центральный текст
    const centerLabel = svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.5em')
      .style('font-size', '16px')
      .style('fill', '#d1d5db')
      .text('Браузеры');
      
    const centerValue = svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1em')
      .style('font-size', '24px')
      .style('font-weight', 'bold')
      .style('fill', '#ffffff')
      .text('100%');
  };
  
  // Рендер графика уровней инвентаря
  const renderInventoryLevelsChart = () => {
    if (!inventoryChartRef.current) return;
    
    const container = inventoryChartRef.current;
    container.innerHTML = '';
    
    const margin = { top: 30, right: 20, bottom: 50, left: 100 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
      
    // Добавляем заголовок
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('fill', '#f9fafb')
      .text('Склад: уровень остатка');
      
    // Создаем шкалы
    const y = d3.scaleBand()
      .domain(inventoryData.map(d => d.category))
      .range([0, height])
      .padding(0.3);
      
    const x = d3.scaleLinear()
      .domain([0, 100])
      .range([0, width]);
      
    // Добавляем оси
    svg.append('g')
      .call(d3.axisLeft(y))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#d1d5db');
      
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d => `${d}%`))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#d1d5db');
      
    // Добавляем сетку
    svg.append('g')
      .attr('class', 'grid')
      .call(d3.axisBottom(x)
        .tickSize(height)
        .tickFormat(''))
      .selectAll('line')
      .style('stroke', 'rgba(255, 255, 255, 0.1)');
      
    // Создаем градиенты для исправных товаров
    const defs = svg.append('defs');
    
    const stockGradient = defs.append('linearGradient')
      .attr('id', 'stockGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
      
    stockGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#3b82f6')
      .attr('stop-opacity', 1);
      
    stockGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#60a5fa')
      .attr('stop-opacity', 1);
      
    // Градиент для бракованных товаров
    const defectiveGradient = defs.append('linearGradient')
      .attr('id', 'defectiveGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
      
    defectiveGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#ef4444')
      .attr('stop-opacity', 1);
      
    defectiveGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#f87171')
      .attr('stop-opacity', 1);
      
    // Добавляем полосы для исправных
    svg.selectAll('.stock-bar')
      .data(inventoryData)
      .join('rect')
      .attr('class', 'stock-bar')
      .attr('y', d => y(d.category))
      .attr('height', y.bandwidth())
      .attr('x', 0)
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', 'url(#stockGradient)')
      .attr('width', 0)
      .transition()
      .duration(800)
      .attr('width', d => x(d.stock));
      
    // Добавляем полосы для бракованных
    svg.selectAll('.defective-bar')
      .data(inventoryData)
      .join('rect')
      .attr('class', 'defective-bar')
      .attr('y', d => y(d.category))
      .attr('height', y.bandwidth())
      .attr('x', d => x(d.stock))
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', 'url(#defectiveGradient)')
      .attr('width', 0)
      .transition()
      .duration(800)
      .delay(800)
      .attr('width', d => x(d.defective));
      
    // Добавляем значения
    svg.selectAll('.stock-label')
      .data(inventoryData)
      .join('text')
      .attr('class', 'stock-label')
      .attr('x', d => x(d.stock / 2))
      .attr('y', d => y(d.category) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .style('fill', '#ffffff')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('opacity', 0)
      .text(d => `${d.stock}%`)
      .transition()
      .duration(500)
      .delay(1000)
      .style('opacity', 1);
      
    svg.selectAll('.defective-label')
      .data(inventoryData)
      .join('text')
      .attr('class', 'defective-label')
      .attr('x', d => x(d.stock + d.defective / 2))
      .attr('y', d => y(d.category) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .style('fill', '#ffffff')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('opacity', 0)
      .text(d => `${d.defective}%`)
      .transition()
      .duration(500)
      .delay(1200)
      .style('opacity', d => d.defective > 3 ? 1 : 0);
      
    // Добавляем легенду
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 200}, ${height - 50})`);
      
    legend.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', '#3b82f6')
      .attr('rx', 2);
      
    legend.append('text')
      .attr('x', 20)
      .attr('y', 12)
      .style('font-size', '12px')
      .style('fill', '#d1d5db')
      .text('Исправный товар');
      
    legend.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', '#ef4444')
      .attr('rx', 2)
      .attr('transform', 'translate(120, 0)');
      
    legend.append('text')
      .attr('x', 140)
      .attr('y', 12)
      .style('font-size', '12px')
      .style('fill', '#d1d5db')
      .text('Брак');
  };

  return (
    <div className="p-4 md:p-6 bg-gray-900 text-gray-100 min-h-screen">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Аналитика склада</h1>
          <p className="text-gray-400 mt-1">Мониторинг уровней инвентаря и анализ статусов</p>
        </div>
        
        <div className="flex mt-4 md:mt-0 space-x-3">
          <div className="flex items-center">
            <span className="text-gray-400 mr-2 text-sm">Месяц:</span>
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-sm"
            >
                          <option>Январь</option>
      <option>Февраль</option>
              <option>Март</option>
              <option>Апрель</option>
              <option>Май</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <span className="text-gray-400 mr-2 text-sm">Вид:</span>
            <select 
              value={selectedView}
              onChange={(e) => setSelectedView(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-sm"
            >
              <option value="общий">Общий</option>
              <option value="категория">По категориям</option>
              <option value="склад">По складам</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
          <div ref={trafficChartRef} className="w-full h-[300px]"></div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
          <div className="flex justify-between mb-2">
            <h2 className="text-lg font-semibold">Склад: уровень остатка</h2>
            <div className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">
              Обновлено сегодня
            </div>
          </div>
          <div className="text-sm text-gray-400 mb-4">
            Информация о браке: сколько товаров на складе отмечены как брак
          </div>
          <div ref={inventoryChartRef} className="w-full h-[250px]"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
          <div ref={genderChartRef} className="w-full h-[300px]"></div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
          <div className="flex justify-between mb-2">
            <h2 className="text-lg font-semibold">Статистика браузеров</h2>
            <button className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div ref={browserChartRef} className="w-full h-[300px]"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg flex items-center">
          <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
          <div>
            <div className="text-sm text-gray-400">Всего товаров на складе</div>
            <div className="text-2xl font-bold">14,521</div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg flex items-center">
          <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-sm text-gray-400">Товаров в хорошем состоянии</div>
            <div className="text-2xl font-bold">13,822</div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg flex items-center">
          <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <div className="text-sm text-gray-400">Брак</div>
            <div className="text-2xl font-bold">699</div>
            <div className="text-xs text-red-400">4.8% от общего количества</div>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-4 shadow-lg mb-6">
        <div className="flex justify-between mb-4">
          <h2 className="text-lg font-semibold">Управление складом и статус уровня товаров</h2>
          <div className="flex space-x-2">
            <button className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
              Экспорт
            </button>
            <button className="text-xs px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors">
              Обновить
            </button>
          </div>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-400">
            Контрактная модель действует в течение 12 месяцев. Необходимо настроить модель склада и отслеживание статусов уровней. Информация о браке отображается отдельно для каждой категории товаров.
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 text-gray-400 text-left">
                <th className="p-3 rounded-l-lg">Категория</th>
                <th className="p-3">Всего единиц</th>
                <th className="p-3">Исправные</th>
                <th className="p-3">Брак</th>
                <th className="p-3">% брака</th>
                <th className="p-3 rounded-r-lg">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              <tr className="hover:bg-gray-700/30 transition-colors">
                <td className="p-3">Электроника</td>
                <td className="p-3">3,245</td>
                <td className="p-3">3,058</td>
                <td className="p-3">187</td>
                <td className="p-3"><span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs">5.8%</span></td>
                <td className="p-3">
                  <button className="text-blue-400 hover:text-blue-300 transition-colors mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button className="text-gray-400 hover:text-gray-300 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-gray-700/30 transition-colors">
                <td className="p-3">Одежда</td>
                <td className="p-3">5,621</td>
                <td className="p-3">5,398</td>
                <td className="p-3">223</td>
                <td className="p-3"><span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs">4.0%</span></td>
                <td className="p-3">
                  <button className="text-blue-400 hover:text-blue-300 transition-colors mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button className="text-gray-400 hover:text-gray-300 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-gray-700/30 transition-colors">
                <td className="p-3">Мебель</td>
                <td className="p-3">1,890</td>
                <td className="p-3">1,701</td>
                <td className="p-3">189</td>
                <td className="p-3"><span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-full text-xs">10.0%</span></td>
                <td className="p-3">
                  <button className="text-blue-400 hover:text-blue-300 transition-colors mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button className="text-gray-400 hover:text-gray-300 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-gray-700/30 transition-colors">
                <td className="p-3">Книги</td>
                <td className="p-3">2,450</td>
                <td className="p-3">2,401</td>
                <td className="p-3">49</td>
                <td className="p-3"><span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">2.0%</span></td>
                <td className="p-3">
                  <button className="text-blue-400 hover:text-blue-300 transition-colors mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button className="text-gray-400 hover:text-gray-300 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-gray-700/30 transition-colors">
                <td className="p-3">Игрушки</td>
                <td className="p-3">1,315</td>
                <td className="p-3">1,264</td>
                <td className="p-3">51</td>
                <td className="p-3"><span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs">3.9%</span></td>
                <td className="p-3">
                  <button className="text-blue-400 hover:text-blue-300 transition-colors mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button className="text-gray-400 hover:text-gray-300 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WarehouseAnalytics;