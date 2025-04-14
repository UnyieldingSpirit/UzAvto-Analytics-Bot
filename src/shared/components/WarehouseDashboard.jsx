'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';

const WarehouseDashboard = () => {
  // Refs для графиков
  const trafficChartRef = useRef(null);
  const deviceChartRef = useRef(null);
  const socialChartRef = useRef(null);
  const stockChartRef = useRef(null);
  
  // Состояние
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  
  // Данные для графиков
  const trafficData = [
    { source: 'Органический поиск', value: 62.7, color: '#3b82f6' },
    { source: 'Прямой', value: 40.6, color: '#ef4444' },
    { source: 'Реферал', value: 25.2, color: '#f59e0b' },
    { source: 'Другие', value: 10.6, color: '#22c55e' }
  ];
  
  const deviceData = [
    { name: 'Десктоп', value: 56.0, color: '#3b82f6' },
    { name: 'Мобильный', value: 30.0, color: '#ef4444' },
    { name: 'Планшет', value: 14.0, color: '#f59e0b' }
  ];
  
  const socialData = [
    { platform: 'Facebook', visits: 46, percentage: 33, color: '#3b82f6' },
    { platform: 'YouTube', visits: 12, percentage: 17, color: '#ef4444' },
    { platform: 'LinkedIn', visits: 29, percentage: 21, color: '#38bdf8' },
    { platform: 'Twitter', visits: 34, percentage: 23, color: '#f59e0b' },
    { platform: 'Dribbble', visits: 28, percentage: 19, color: '#22c55e' }
  ];
  
  // Данные для автомобилей
  const carModels = [
    { 
      id: 'nexia', 
      name: 'Chevrolet Nexia', 
      stock: 76, 
      color: '#3b82f6',
      monthlyData: [68, 72, 74, 76, 80, 78, 76],
      colors: ['#ef4444', '#3b82f6', '#6b7280', '#ffffff', '#000000'],
      configurations: ['Базовая', 'Комфорт', 'Люкс'],
      warehouses: {
        tashkent: 30,
        samarkand: 23,
        bukhara: 15,
        other: 8
      }
    },
    { 
      id: 'cobalt', 
      name: 'Chevrolet Cobalt', 
      stock: 84, 
      color: '#ef4444',
      monthlyData: [70, 75, 79, 82, 84, 86, 84],
      colors: ['#ef4444', '#3b82f6', '#6b7280', '#ffffff', '#000000'],
      configurations: ['Базовая', 'Комфорт', 'Люкс', 'Премиум'],
      warehouses: {
        tashkent: 34,
        samarkand: 25,
        bukhara: 17,
        other: 8
      }
    },
    { 
      id: 'gentra', 
      name: 'Chevrolet Gentra', 
      stock: 58, 
      color: '#f59e0b',
      monthlyData: [50, 54, 56, 59, 58, 60, 58],
      colors: ['#ef4444', '#3b82f6', '#6b7280', '#ffffff', '#000000'],
      configurations: ['Базовая', 'Комфорт', 'Люкс'],
      warehouses: {
        tashkent: 23,
        samarkand: 17,
        bukhara: 12,
        other: 6
      }
    },
    { 
      id: 'tracker', 
      name: 'Chevrolet Tracker', 
      stock: 42, 
      color: '#22c55e',
      monthlyData: [35, 38, 40, 42, 45, 44, 42],
      colors: ['#ef4444', '#3b82f6', '#6b7280', '#000000'],
      configurations: ['Базовая', 'Люкс', 'Премиум'],
      warehouses: {
        tashkent: 17,
        samarkand: 13,
        bukhara: 8,
        other: 4
      }
    },
    { 
      id: 'spark', 
      name: 'Chevrolet Spark', 
      stock: 65, 
      color: '#8b5cf6',
      monthlyData: [58, 60, 63, 65, 68, 66, 65],
      colors: ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#ffffff'],
      configurations: ['Базовая', 'Комфорт'],
      warehouses: {
        tashkent: 26,
        samarkand: 20,
        bukhara: 13,
        other: 6
      }
    }
  ];
  
  // Эффект для инициализации графиков
  useEffect(() => {
    renderTrafficChart();
    renderDeviceChart();
    renderSocialChart();
    
    if (selectedModel) {
      renderStockChart(selectedModel);
    }
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedModel]);
  
  // Обработчик изменения размера окна
  const handleResize = () => {
    renderTrafficChart();
    renderDeviceChart();
    renderSocialChart();
    
    if (selectedModel) {
      renderStockChart(selectedModel);
    }
  };
  
  // Функция для отрисовки графика источников трафика
  const renderTrafficChart = () => {
    if (!trafficChartRef.current) return;
    
    const container = trafficChartRef.current;
    container.innerHTML = '';
    
    const margin = { top: 30, right: 10, bottom: 50, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
      
    // Заголовок
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#e5e7eb')
      .text('Источники трафика. Январь, 2024');
      
    // Шкалы
    const x = d3.scaleBand()
      .domain(trafficData.map(d => d.source))
      .range([0, width])
      .padding(0.4);
      
    const y = d3.scaleLinear()
      .domain([0, 80])
      .range([height, 0]);
      
    // Оси
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#9ca3af');
      
    svg.append('g')
      .call(d3.axisLeft(y).tickFormat(d => `${d}%`))
      .selectAll('text')
      .style('fill', '#9ca3af');
      
    // Подпись оси Y
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left + 15)
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#9ca3af')
      .text('Доля трафика');
      
    // Создаем линии сетки
    svg.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat('')
      )
      .selectAll('line')
      .style('stroke', '#374151')
      .style('stroke-opacity', '0.3')
      .style('stroke-dasharray', '3,3');
      
    // Создаем столбцы с анимацией
    svg.selectAll('.bar')
      .data(trafficData)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.source))
      .attr('width', x.bandwidth())
      .attr('y', height)
      .attr('height', 0)
      .attr('fill', d => d.color)
      .attr('rx', 4)
      .transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .attr('y', d => y(d.value))
      .attr('height', d => height - y(d.value));
      
    // Добавляем значения
    svg.selectAll('.label')
      .data(trafficData)
      .enter().append('text')
      .attr('class', 'label')
      .attr('x', d => x(d.source) + x.bandwidth() / 2)
      .attr('y', d => y(d.value) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#e5e7eb')
      .style('opacity', 0)
      .transition()
      .duration(800)
      .delay((d, i) => i * 100 + 300)
      .style('opacity', 1)
      .text(d => `${d.value}%`);
      
    // Создаем интерактивность
    svg.selectAll('.hover-area')
      .data(trafficData)
      .enter().append('rect')
      .attr('class', 'hover-area')
      .attr('x', d => x(d.source))
      .attr('width', x.bandwidth())
      .attr('y', 0)
      .attr('height', height)
      .attr('fill', 'transparent')
      .on('mouseover', function(event, d) {
        svg.append('line')
          .attr('class', 'hover-line')
          .attr('x1', x(d.source) + x.bandwidth() / 2)
          .attr('x2', x(d.source) + x.bandwidth() / 2)
          .attr('y1', 0)
          .attr('y2', height)
          .style('stroke', '#9ca3af')
          .style('stroke-width', 1)
          .style('stroke-dasharray', '3,3');
          
        // Увеличиваем текст
        svg.selectAll('.label')
          .filter(label => label.source === d.source)
          .transition()
          .duration(200)
          .style('font-size', '14px')
          .attr('y', d => y(d.value) - 10);
      })
      .on('mouseout', function(event, d) {
        svg.selectAll('.hover-line').remove();
        
        // Возвращаем текст к нормальному размеру
        svg.selectAll('.label')
          .filter(label => label.source === d.source)
          .transition()
          .duration(200)
          .style('font-size', '12px')
          .attr('y', d => y(d.value) - 5);
      });
  };
  
  // Функция для отрисовки круговой диаграммы устройств
  const renderDeviceChart = () => {
    if (!deviceChartRef.current) return;
    
    const container = deviceChartRef.current;
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
      
    // Создаем пирог
    const pie = d3.pie()
      .value(d => d.value)
      .sort(null);
      
    const arc = d3.arc()
      .innerRadius(radius * 0.6) // Увеличиваем внутренний радиус для эффекта кольца
      .outerRadius(radius);
      
    // Создаем градиенты для каждого сектора
    const defs = svg.append('defs');
    
    deviceData.forEach((d, i) => {
      const gradientId = `deviceGradient-${i}`;
      const gradient = defs.append('linearGradient')
        .attr('id', gradientId)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '100%');
        
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', d3.rgb(d.color).brighter(0.5));
        
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', d.color);
    });
    
    // Создаем эффект свечения
    const glow = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-40%')
      .attr('y', '-40%')
      .attr('width', '180%')
      .attr('height', '180%');
      
    glow.append('feGaussianBlur')
      .attr('stdDeviation', '6')
      .attr('result', 'coloredBlur');
      
    const feBlend = glow.append('feBlend')
      .attr('in', 'SourceGraphic')
      .attr('in2', 'coloredBlur')
      .attr('mode', 'normal');
    
    // Создаем дуги
    const arcs = svg.selectAll('.arc')
      .data(pie(deviceData))
      .enter()
      .append('g')
      .attr('class', 'arc');
      
    // Добавляем дуги с анимацией
    arcs.append('path')
      .attr('d', arc)
      .attr('fill', (d, i) => `url(#deviceGradient-${i})`)
      .attr('stroke', '#1f2937')
      .style('stroke-width', '2px')
      .style('cursor', 'pointer')
      .style('opacity', 0)
      .transition()
      .duration(800)
      .delay((d, i) => i * 200)
      .style('opacity', 1)
      .attrTween('d', function(d) {
        const interpolate = d3.interpolate(
          { startAngle: d.startAngle, endAngle: d.startAngle },
          { startAngle: d.startAngle, endAngle: d.endAngle }
        );
        return function(t) {
          return arc(interpolate(t));
        };
      })
      .on('end', function(d, i) {
        // Активируем интерактивность только после завершения анимации
        d3.select(this)
          .on('mouseover', function(event, d) {
            d3.select(this)
              .transition()
              .duration(200)
              .attr('filter', 'url(#glow)')
              .attr('d', d3.arc()
                .innerRadius(radius * 0.6)
                .outerRadius(radius * 1.05)
              );
              
            // Показываем подробности в центре
            centerText.text(d.data.name);
            centerNumber.text(`${d.data.value}%`);
            centerNumber.style('fill', d.data.color);
          })
          .on('mouseout', function(event, d) {
            d3.select(this)
              .transition()
              .duration(200)
              .attr('filter', null)
              .attr('d', arc);
              
            // Возвращаем общую информацию
            centerText.text('Устройства');
            centerNumber.text('100%');
            centerNumber.style('fill', '#e5e7eb');
          });
      });
      
    // Добавляем центральный текст
    const centerText = svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.5em')
      .style('font-size', '14px')
      .style('fill', '#9ca3af')
      .text('Устройства');
      
    const centerNumber = svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1em')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .style('fill', '#e5e7eb')
      .text('100%');
      
    // Добавляем легенду
    const legend = svg.append('g')
      .attr('transform', `translate(${radius + 10}, -${radius - 20})`);
      
    deviceData.forEach((d, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 25})`);
        
      legendRow.append('rect')
        .attr('width', 16)
        .attr('height', 16)
        .attr('rx', 4)
        .attr('fill', d.color);
        
      legendRow.append('text')
        .attr('x', 24)
        .attr('y', 12)
        .style('font-size', '12px')
        .style('fill', '#e5e7eb')
        .text(`${d.name} (${d.value}%)`);
    });
    
    // Заголовок
    svg.append('text')
      .attr('x', 0)
      .attr('y', -radius - 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#e5e7eb')
      .text('Устройства пользователей');
  };
  
  // Функция для отрисовки социального трафика
  const renderSocialChart = () => {
    if (!socialChartRef.current) return;
    
    const container = socialChartRef.current;
    container.innerHTML = '';
    
    const width = container.clientWidth;
    const height = 40; // Высота для одной полосы
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);
      
    // Шкала
    const x = d3.scaleLinear()
      .domain([0, 100])
      .range([0, width]);
      
    // Создаем кумулятивные позиции
    let cumulative = 0;
    const bars = socialData.map(d => {
      const bar = {
        platform: d.platform,
        visits: d.visits,
        percentage: d.percentage,
        color: d.color,
        start: cumulative,
        end: cumulative + d.percentage
      };
      cumulative += d.percentage;
      return bar;
    });
    
    // Создаем градиенты для плавных переходов
    const defs = svg.append('defs');
    
    bars.forEach((d, i) => {
      const nextColor = i < bars.length - 1 ? bars[i + 1].color : d.color;
      
      const gradientId = `socialGradient-${i}`;
      const gradient = defs.append('linearGradient')
        .attr('id', gradientId)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '0%');
        
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', d.color);
        
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', nextColor);
    });
    
    // Добавляем полосы с анимацией
    svg.selectAll('.bar')
      .data(bars)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(0))
      .attr('width', 0)
      .attr('y', 0)
      .attr('height', height)
      .attr('fill', (d, i) => `url(#socialGradient-${i})`)
      .style('cursor', 'pointer')
      .transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .attr('x', d => x(d.start))
      .attr('width', d => x(d.end) - x(d.start))
      .on('end', function(d, i) {
        // Добавляем интерактивность после анимации
        d3.select(this)
          .on('mouseover', function(event, d) {
            d3.select(this)
              .transition()
              .duration(200)
              .attr('height', height + 4)
              .attr('y', -2);
              
            // Добавляем всплывающую подсказку
            const tooltip = svg.append('g')
              .attr('class', 'tooltip')
              .attr('transform', `translate(${(x(d.start) + x(d.end)) / 2}, -15)`);
              
            tooltip.append('rect')
              .attr('x', -60)
              .attr('y', -25)
              .attr('width', 120)
              .attr('height', 25)
              .attr('rx', 4)
              .attr('fill', '#374151')
              .attr('opacity', 0.9);
              
            tooltip.append('text')
              .attr('text-anchor', 'middle')
              .attr('y', -8)
              .style('font-size', '12px')
              .style('fill', '#e5e7eb')
              .text(`${d.platform}: ${d.percentage}%`);
          })
          .on('mouseout', function(event, d) {
            d3.select(this)
              .transition()
              .duration(200)
              .attr('height', height)
              .attr('y', 0);
              
            svg.selectAll('.tooltip').remove();
          });
      });
  };
  
  // Функция для отрисовки графика динамики остатков выбранной модели
  const renderStockChart = (model) => {
    if (!stockChartRef.current) return;
    
    const container = stockChartRef.current;
    container.innerHTML = '';
    
    const margin = { top: 30, right: 30, bottom: 40, left: 50 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
      
    // Данные для графика
    const data = model.monthlyData.map((value, i) => ({
      month: i,
      value: value
    }));
    
    // Шкалы
    const x = d3.scaleLinear()
      .domain([0, data.length - 1])
      .range([0, width]);
      
    const y = d3.scaleLinear()
      .domain([d3.min(data, d => d.value) * 0.9, d3.max(data, d => d.value) * 1.1])
      .nice()
      .range([height, 0]);
      
    // Создаем линию
    const line = d3.line()
      .x(d => x(d.month))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);
      
    // Создаем область под линией
    const area = d3.area()
      .x(d => x(d.month))
      .y0(height)
      .y1(d => y(d.value))
      .curve(d3.curveMonotoneX);
      
    // Создаем градиент
    const areaGradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'stockGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
      
    areaGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', model.color)
      .attr('stop-opacity', 0.8);
      
    areaGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', model.color)
      .attr('stop-opacity', 0.1);
      
    // Добавляем оси
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(data.length).tickFormat((d, i) => {
        const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл'];
        return months[i];
      }))
      .selectAll('text')
      .style('fill', '#9ca3af');
      
    svg.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .selectAll('text')
      .style('fill', '#9ca3af');
      
    // Добавляем сетку
    svg.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y)
        .ticks(5)
        .tickSize(-width)
        .tickFormat('')
      )
      .selectAll('line')
      .style('stroke', '#374151')
      .style('stroke-opacity', '0.3')
      .style('stroke-dasharray', '3,3');
      
    // Добавляем область с анимацией
    svg.append('path')
      .datum(data)
      .attr('fill', 'url(#stockGradient)')
      .attr('d', area)
      .style('opacity', 0)
      .transition()
      .duration(1000)
      .style('opacity', 1);
      
    // Добавляем линию с анимацией
    const path = svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', model.color)
      .attr('stroke-width', 3)
      .attr('d', line);
      
    const pathLength = path.node().getTotalLength();
    
    path
      .attr('stroke-dasharray', pathLength)
      .attr('stroke-dashoffset', pathLength)
      .transition()
      .duration(1000)
      .attr('stroke-dashoffset', 0);
      
    // Добавляем точки с анимацией
    svg.selectAll('.dot')
      .data(data)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(d.month))
      .attr('cy', d => y(d.value))
      .attr('r', 0)
      .attr('fill', model.color)
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 2)
      .transition()
      .duration(500)
      .delay((d, i) => 1000 + i * 100)
      .attr('r', 5);
      
    // Добавляем подписи
    svg.selectAll('.label')
      .data(data)
      .enter().append('text')
      .attr('class', 'label')
      .attr('x', d => x(d.month))
      .attr('y', d => y(d.value) - 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#e5e7eb')
      .style('opacity', 0)
      .transition()
      .duration(500)
      .delay((d, i) => 1000 + i * 100)
      .style('opacity', 1)
      .text(d => d.value);
      
    // Добавляем заголовок
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#e5e7eb')
      .text(`Динамика остатков: ${model.name}`);
  };

  // Обработчик клика по модели
  const handleModelClick = (model) => {
    // Проверяем, выбрана ли уже эта модель
    if (selectedModel && selectedModel.id === model.id) {
      setSelectedModel(null); // Если уже выбрана, то снимаем выделение
    } else {
      setSelectedModel(model); // Иначе выбираем модель
    }
  };
  
  // Форматирование статуса на основе остатка
// Форматирование статуса на основе остатка
 const getStockStatus = (stock) => {
   if (stock > 70) return { label: 'В наличии', color: 'bg-green-100 text-green-800' };
   if (stock > 40) return { label: 'Ограничено', color: 'bg-yellow-100 text-yellow-800' };
   return { label: 'Мало', color: 'bg-red-100 text-red-800' };
 };
 
 // Функция для отображения процентной диаграммы
 const renderPercentageBar = (value, maxValue) => {
   const percentage = Math.round((value / maxValue) * 100);
   return (
     <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
       <div 
         className="h-full bg-blue-500 rounded-full"
         style={{ width: `${percentage}%` }}
       ></div>
     </div>
   );
 };

 return (
   <div className="min-h-screen bg-gray-900 text-gray-200">
     {/* Заголовок */}
     <div className="mb-6 p-6 bg-gray-800 rounded-lg shadow-md">
       <h1 className="text-2xl font-bold text-white">Аналитика склада</h1>
       <p className="text-gray-400">Обзор остатков автомобилей и статистика</p>
     </div>
     
     {/* Фильтры */}
     <div className="mb-6 flex flex-wrap gap-4 bg-gray-800 p-4 rounded-lg shadow-md">
       <div className="flex items-center">
         <span className="text-gray-400 mr-2">Период:</span>
         <select 
           value={selectedPeriod}
           onChange={(e) => setSelectedPeriod(e.target.value)}
           className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
         >
           <option value="week">Неделя</option>
           <option value="month">Месяц</option>
           <option value="quarter">Квартал</option>
           <option value="year">Год</option>
         </select>
       </div>
       
       <div className="flex items-center">
         <span className="text-gray-400 mr-2">Склад:</span>
         <select 
           value={selectedWarehouse}
           onChange={(e) => setSelectedWarehouse(e.target.value)}
           className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
         >
           <option value="all">Все склады</option>
           <option value="tashkent">Ташкент</option>
           <option value="samarkand">Самарканд</option>
           <option value="bukhara">Бухара</option>
         </select>
       </div>
     </div>
     
     {/* Основные метрики */}
     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
       <div className="bg-gray-800 p-4 rounded-lg shadow-md">
         <h3 className="text-gray-400 text-sm mb-1">Всего автомобилей</h3>
         <p className="text-3xl font-bold text-white">325</p>
         <div className="flex items-center mt-2 text-sm">
           <span className="text-green-500 flex items-center">
             <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
               <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
             </svg>
             +12% 
           </span>
           <span className="text-gray-500 ml-2">с прошлого месяца</span>
         </div>
       </div>
       
       <div className="bg-gray-800 p-4 rounded-lg shadow-md">
         <h3 className="text-gray-400 text-sm mb-1">Модели в наличии</h3>
         <p className="text-3xl font-bold text-white">14</p>
         <div className="flex items-center mt-2 text-sm">
           <span className="text-red-500 flex items-center">
             <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
               <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
             </svg>
             -3%
           </span>
           <span className="text-gray-500 ml-2">с прошлого месяца</span>
         </div>
       </div>
       
       <div className="bg-gray-800 p-4 rounded-lg shadow-md">
         <h3 className="text-gray-400 text-sm mb-1">Средняя загруженность</h3>
         <p className="text-3xl font-bold text-white">76%</p>
         <div className="flex items-center mt-2 text-sm">
           <span className="text-green-500 flex items-center">
             <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
               <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
             </svg>
             +5%
           </span>
           <span className="text-gray-500 ml-2">с прошлого месяца</span>
         </div>
       </div>
     </div>
     
     {/* Графики */}
     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
       <div className="bg-gray-800 p-4 rounded-lg shadow-md">
         <h2 className="text-lg font-medium text-white mb-4">Источники трафика</h2>
         <div ref={trafficChartRef} className="h-[300px]"></div>
       </div>
       
       <div className="bg-gray-800 p-4 rounded-lg shadow-md">
         <h2 className="text-lg font-medium text-white mb-4">Устройства пользователей</h2>
         <div ref={deviceChartRef} className="h-[300px]"></div>
       </div>
     </div>
     
     {/* Социальный трафик */}
     <div className="bg-gray-800 p-4 rounded-lg shadow-md mb-6">
       <div className="flex justify-between items-start mb-4">
         <div>
           <h2 className="text-lg font-medium text-white">Социальный трафик</h2>
           <p className="text-gray-400 text-sm">89,421 общих посещений</p>
         </div>
         <button className="text-gray-400 hover:text-white">
           <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
             <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
           </svg>
         </button>
       </div>
       
       <div ref={socialChartRef} className="mb-4"></div>
       
       <div className="space-y-3">
         {socialData.map(platform => (
           <div key={platform.platform} className="flex justify-between items-center">
             <div className="flex items-center">
               <span className="w-3 h-3 mr-2 rounded-full" style={{ backgroundColor: platform.color }}></span>
               <span>{platform.platform}</span>
             </div>
             <div className="flex space-x-8">
               <span className="text-gray-400">{platform.visits} визитов</span>
               <span className="font-medium w-12 text-right">{platform.percentage}%</span>
             </div>
           </div>
         ))}
       </div>
     </div>
     
     {/* ОСТАТОК НА СКЛАДЕ секция - это основной фокус нашего дашборда */}
     <div className="mb-6">
       <h2 className="text-xl font-bold text-white mb-4 px-4 uppercase tracking-wide">SKLAD UROVENIDA OSTATKA</h2>
       
       <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
         <div className="overflow-x-auto">
           <table className="min-w-full divide-y divide-gray-700">
             <thead className="bg-gray-700">
               <tr>
                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Модель</th>
                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Доступно</th>
                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Резерв</th>
                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Всего</th>
                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Статус</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-700">
               {carModels.map(model => {
                 const status = getStockStatus(model.stock);
                 return (
                   <motion.tr 
                     key={model.id} 
                     className={`hover:bg-gray-700 cursor-pointer transition-colors duration-200 ${selectedModel?.id === model.id ? 'bg-blue-800/20' : ''}`}
                     onClick={() => handleModelClick(model)}
                     whileHover={{ backgroundColor: 'rgba(55, 65, 81, 1)' }}
                     animate={{ backgroundColor: selectedModel?.id === model.id ? 'rgba(30, 58, 138, 0.2)' : 'rgba(31, 41, 55, 0)' }}
                     transition={{ duration: 0.2 }}
                   >
                     <td className="px-4 py-3 whitespace-nowrap">
                       <div className="font-medium text-white">{model.name}</div>
                     </td>
                     <td className="px-4 py-3 whitespace-nowrap text-gray-300">{model.stock - Math.floor(model.stock * 0.1)}</td>
                     <td className="px-4 py-3 whitespace-nowrap text-gray-300">{Math.floor(model.stock * 0.1)}</td>
                     <td className="px-4 py-3 whitespace-nowrap font-medium text-white">{model.stock}</td>
                     <td className="px-4 py-3 whitespace-nowrap">
                       <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color}`}>
                         {status.label}
                       </span>
                     </td>
                   </motion.tr>
                 );
               })}
             </tbody>
           </table>
         </div>
       </div>
     </div>
     
     {/* Детальная информация о выбранной модели */}
     <AnimatePresence>
       {selectedModel && (
         <motion.div
           initial={{ height: 0, opacity: 0 }}
           animate={{ height: 'auto', opacity: 1 }}
           exit={{ height: 0, opacity: 0 }}
           transition={{ duration: 0.3 }}
           className="mb-6 overflow-hidden"
         >
           <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-blue-900/30">
             <div className="flex justify-between items-start mb-6">
               <div>
                 <h2 className="text-xl font-bold text-white">
                   {selectedModel.name}
                 </h2>
                 <p className="text-blue-400">
                   MODEL USTIGA BOSSA, MODIFICATSIYAGA UTISH KERAK
                 </p>
               </div>
               <button 
                 onClick={() => setSelectedModel(null)}
                 className="text-gray-400 hover:text-white p-1"
               >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>
             
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
               {/* График динамики остатков */}
               <div className="lg:col-span-2 bg-gray-700/50 p-4 rounded-lg">
                 <h3 className="text-white font-medium mb-2">Динамика остатков</h3>
                 <div ref={stockChartRef} className="h-[200px]"></div>
               </div>
               
               {/* Распределение по складам */}
               <div className="bg-gray-700/50 p-4 rounded-lg">
                 <h3 className="text-white font-medium mb-4">Остаток по складам</h3>
                 <div className="space-y-4">
                   <div>
                     <div className="flex justify-between mb-1">
                       <span className="text-gray-300">Ташкент</span>
                       <span className="font-medium text-white">{selectedModel.warehouses.tashkent} шт.</span>
                     </div>
                     {renderPercentageBar(selectedModel.warehouses.tashkent, selectedModel.stock)}
                   </div>
                   <div>
                     <div className="flex justify-between mb-1">
                       <span className="text-gray-300">Самарканд</span>
                       <span className="font-medium text-white">{selectedModel.warehouses.samarkand} шт.</span>
                     </div>
                     {renderPercentageBar(selectedModel.warehouses.samarkand, selectedModel.stock)}
                   </div>
                   <div>
                     <div className="flex justify-between mb-1">
                       <span className="text-gray-300">Бухара</span>
                       <span className="font-medium text-white">{selectedModel.warehouses.bukhara} шт.</span>
                     </div>
                     {renderPercentageBar(selectedModel.warehouses.bukhara, selectedModel.stock)}
                   </div>
                   <div>
                     <div className="flex justify-between mb-1">
                       <span className="text-gray-300">Другие</span>
                       <span className="font-medium text-white">{selectedModel.warehouses.other} шт.</span>
                     </div>
                     {renderPercentageBar(selectedModel.warehouses.other, selectedModel.stock)}
                   </div>
                 </div>
               </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
               {/* Доступные цвета */}
               <div className="bg-gray-700/50 p-4 rounded-lg">
                 <h3 className="text-white font-medium mb-2">Цвета</h3>
                 <div className="flex space-x-3 mt-2">
                   {selectedModel.colors.map((color, index) => (
                     <span 
                       key={index} 
                       className="w-8 h-8 rounded-full border-2 border-gray-600 transition-transform hover:scale-110"
                       style={{ 
                         backgroundColor: color,
                         boxShadow: color === '#ffffff' ? 'inset 0 0 0 1px rgba(255,255,255,0.2)' : 'none'
                       }}
                     ></span>
                   ))}
                 </div>
               </div>
               
               {/* Доступные комплектации */}
               <div className="bg-gray-700/50 p-4 rounded-lg">
                 <h3 className="text-white font-medium mb-2">Комплектации</h3>
                 <div className="flex flex-wrap gap-2 mt-2">
                   {selectedModel.configurations.map((config, index) => (
                     <span 
                       key={index} 
                       className="px-3 py-1 text-sm bg-blue-900/50 text-blue-200 rounded-md border border-blue-800/50"
                     >
                       {config}
                     </span>
                   ))}
                 </div>
               </div>
             </div>
             
             <div className="flex justify-end mt-6">
               <button
                 className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
               >
                 Перейти к модификации
               </button>
             </div>
           </div>
         </motion.div>
       )}
     </AnimatePresence>
   </div>
 );
};

export default WarehouseDashboard;