'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';

const WarehouseDashboard = () => {
  // Refs для графиков
  const salesTrendChartRef = useRef(null);
  const warehouseDistributionRef = useRef(null);
  const colorDistributionRef = useRef(null);
  const stockChartRef = useRef(null);
  
  // Состояние
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  
  // Данные для складов
  const warehouses = [
    { id: 'tashkent', name: 'Ташкент', stock: 142, capacity: 200 },
    { id: 'samarkand', name: 'Самарканд', stock: 98, capacity: 120 },
    { id: 'bukhara', name: 'Бухара', stock: 62, capacity: 80 },
    { id: 'other', name: 'Другие', stock: 23, capacity: 40 }
  ];
  
  // Данные продаж по месяцам
  const monthlySales = [
    { month: 'Янв', count: 42, amount: 4200000 },
    { month: 'Фев', count: 38, amount: 3800000 },
    { month: 'Мар', count: 45, amount: 4500000 },
    { month: 'Апр', count: 51, amount: 5100000 },
    { month: 'Май', count: 47, amount: 4700000 },
    { month: 'Июн', count: 52, amount: 5200000 },
    { month: 'Июл', count: 48, amount: 4800000 }
  ];
  
  // Данные по популярным комплектациям
  const popularConfigurations = [
    { name: 'Базовая', count: 120, percentage: 35 },
    { name: 'Комфорт', count: 156, percentage: 45 },
    { name: 'Люкс', count: 49, percentage: 15 },
    { name: 'Премиум', count: 17, percentage: 5 }
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
      colorsDistribution: [
        { name: 'Красный', count: 18 },
        { name: 'Синий', count: 23 },
        { name: 'Серый', count: 15 },
        { name: 'Белый', count: 12 },
        { name: 'Черный', count: 8 }
      ],
      configurations: ['Базовая', 'Комфорт', 'Люкс'],
      configurationsData: [
        { name: 'Базовая', count: 34 },
        { name: 'Комфорт', count: 27 },
        { name: 'Люкс', count: 15 }
      ],
      warehouses: {
        tashkent: 30,
        samarkand: 23,
        bukhara: 15,
        other: 8
      },
      price: 11900,
      salesData: [5, 7, 9, 8, 11, 12, 10]
    },
    { 
      id: 'cobalt', 
      name: 'Chevrolet Cobalt', 
      stock: 84, 
      color: '#ef4444',
      monthlyData: [70, 75, 79, 82, 84, 86, 84],
      colors: ['#ef4444', '#3b82f6', '#6b7280', '#ffffff', '#000000'],
      colorsDistribution: [
        { name: 'Красный', count: 22 },
        { name: 'Синий', count: 18 },
        { name: 'Серый', count: 14 },
        { name: 'Белый', count: 20 },
        { name: 'Черный', count: 10 }
      ],
      configurations: ['Базовая', 'Комфорт', 'Люкс', 'Премиум'],
      configurationsData: [
        { name: 'Базовая', count: 25 },
        { name: 'Комфорт', count: 36 },
        { name: 'Люкс', count: 18 },
        { name: 'Премиум', count: 5 }
      ],
      warehouses: {
        tashkent: 34,
        samarkand: 25,
        bukhara: 17,
        other: 8
      },
      price: 13500,
      salesData: [8, 9, 12, 14, 13, 11, 12]
    },
    { 
      id: 'gentra', 
      name: 'Chevrolet Gentra', 
      stock: 58, 
      color: '#f59e0b',
      monthlyData: [50, 54, 56, 59, 58, 60, 58],
      colors: ['#ef4444', '#3b82f6', '#6b7280', '#ffffff', '#000000'],
      colorsDistribution: [
        { name: 'Красный', count: 12 },
        { name: 'Синий', count: 15 },
        { name: 'Серый', count: 11 },
        { name: 'Белый', count: 14 },
        { name: 'Черный', count: 6 }
      ],
      configurations: ['Базовая', 'Комфорт', 'Люкс'],
      configurationsData: [
        { name: 'Базовая', count: 18 },
        { name: 'Комфорт', count: 24 },
        { name: 'Люкс', count: 16 }
      ],
      warehouses: {
        tashkent: 23,
        samarkand: 17,
        bukhara: 12,
        other: 6
      },
      price: 14800,
      salesData: [7, 6, 9, 8, 9, 10, 8]
    },
    { 
      id: 'tracker', 
      name: 'Chevrolet Tracker', 
      stock: 42, 
      color: '#22c55e',
      monthlyData: [35, 38, 40, 42, 45, 44, 42],
      colors: ['#ef4444', '#3b82f6', '#6b7280', '#000000'],
      colorsDistribution: [
        { name: 'Красный', count: 8 },
        { name: 'Синий', count: 14 },
        { name: 'Серый', count: 10 },
        { name: 'Черный', count: 10 }
      ],
      configurations: ['Базовая', 'Люкс', 'Премиум'],
      configurationsData: [
        { name: 'Базовая', count: 12 },
        { name: 'Люкс', count: 18 },
        { name: 'Премиум', count: 12 }
      ],
      warehouses: {
        tashkent: 17,
        samarkand: 13,
        bukhara: 8,
        other: 4
      },
      price: 20200,
      salesData: [4, 5, 6, 5, 7, 9, 8]
    },
    { 
      id: 'spark', 
      name: 'Chevrolet Spark', 
      stock: 65, 
      color: '#8b5cf6',
      monthlyData: [58, 60, 63, 65, 68, 66, 65],
      colors: ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#ffffff'],
      colorsDistribution: [
        { name: 'Красный', count: 14 },
        { name: 'Синий', count: 16 },
        { name: 'Зеленый', count: 8 },
        { name: 'Оранжевый', count: 12 },
        { name: 'Белый', count: 15 }
      ],
      configurations: ['Базовая', 'Комфорт'],
      configurationsData: [
        { name: 'Базовая', count: 35 },
        { name: 'Комфорт', count: 30 }
      ],
      warehouses: {
        tashkent: 26,
        samarkand: 20,
        bukhara: 13,
        other: 6
      },
      price: 9800,
      salesData: [10, 12, 9, 11, 13, 10, 12]
    }
  ];
  
  // Эффект для инициализации графиков
  useEffect(() => {
    renderSalesTrendChart();
    renderWarehouseDistribution();
    
    if (selectedModel) {
      renderStockChart(selectedModel);
      renderColorDistribution(selectedModel);
    }
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedModel, selectedPeriod]);
  
  // Обработчик изменения размера окна
  const handleResize = () => {
    renderSalesTrendChart();
    renderWarehouseDistribution();
    
    if (selectedModel) {
      renderStockChart(selectedModel);
      renderColorDistribution(selectedModel);
    }
  };
  
  // Функция для отрисовки графика продаж
  const renderSalesTrendChart = () => {
    if (!salesTrendChartRef.current) return;
    
    const container = salesTrendChartRef.current;
    container.innerHTML = '';
    
    const margin = { top: 30, right: 70, bottom: 50, left: 60 };
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
      .text('Динамика продаж. 2024');
      
    // Шкалы
    const x = d3.scaleBand()
      .domain(monthlySales.map(d => d.month))
      .range([0, width])
      .padding(0.4);
      
    const y1 = d3.scaleLinear()
      .domain([0, d3.max(monthlySales, d => d.count) * 1.2])
      .range([height, 0]);
      
    const y2 = d3.scaleLinear()
      .domain([0, d3.max(monthlySales, d => d.amount) * 1.2])
      .range([height, 0]);
      
    // Оси
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#9ca3af');
      
    svg.append('g')
      .call(d3.axisLeft(y1).ticks(5).tickFormat(d => `${d} шт.`))
      .selectAll('text')
      .style('fill', '#9ca3af');
      
    svg.append('g')
      .attr('transform', `translate(${width}, 0)`)
      .call(d3.axisRight(y2).ticks(5).tickFormat(d => `${(d / 1000000).toFixed(1)}M`))
      .selectAll('text')
      .style('fill', '#9ca3af');
      
    // Подпись оси Y1
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left + 15)
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#9ca3af')
      .text('Количество проданных автомобилей');
      
    // Подпись оси Y2
    svg.append('text')
      .attr('transform', 'rotate(90)')
      .attr('y', -width - margin.right + 15)
      .attr('x', height / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#9ca3af')
      .text('Объем продаж (UZS)');
      
    // Создаем линии сетки
    svg.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y1)
        .tickSize(-width)
        .tickFormat('')
      )
      .selectAll('line')
      .style('stroke', '#374151')
      .style('stroke-opacity', '0.3')
      .style('stroke-dasharray', '3,3');
      
    // Создаем столбцы с анимацией
    svg.selectAll('.bar')
      .data(monthlySales)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.month))
      .attr('width', x.bandwidth())
      .attr('y', height)
      .attr('height', 0)
      .attr('fill', '#3b82f6')
      .attr('rx', 4)
      .transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .attr('y', d => y1(d.count))
      .attr('height', d => height - y1(d.count));
      
    // Добавляем значения над столбцами
    svg.selectAll('.label')
      .data(monthlySales)
      .enter().append('text')
      .attr('class', 'label')
      .attr('x', d => x(d.month) + x.bandwidth() / 2)
      .attr('y', d => y1(d.count) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#e5e7eb')
      .style('opacity', 0)
      .transition()
      .duration(800)
      .delay((d, i) => i * 100 + 300)
      .style('opacity', 1)
      .text(d => d.count);
      
    // Создаем линию для объема продаж
    const line = d3.line()
      .x(d => x(d.month) + x.bandwidth() / 2)
      .y(d => y2(d.amount))
      .curve(d3.curveMonotoneX);
      
    // Добавляем линию с анимацией
    const path = svg.append('path')
      .datum(monthlySales)
      .attr('fill', 'none')
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 3)
      .attr('d', line);
      
    const pathLength = path.node().getTotalLength();
    
    path
      .attr('stroke-dasharray', pathLength)
      .attr('stroke-dashoffset', pathLength)
      .transition()
      .duration(1500)
      .attr('stroke-dashoffset', 0);
      
    // Добавляем точки на линии
    svg.selectAll('.dot')
      .data(monthlySales)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(d.month) + x.bandwidth() / 2)
      .attr('cy', d => y2(d.amount))
      .attr('r', 0)
      .attr('fill', '#ef4444')
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 2)
      .transition()
      .duration(500)
      .delay((d, i) => 1500 + i * 100)
      .attr('r', 5);
      
    // Добавляем легенду
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 200}, -10)`);
      
    legend.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('rx', 2)
      .attr('fill', '#3b82f6');
      
    legend.append('text')
      .attr('x', 25)
      .attr('y', 12)
      .style('font-size', '12px')
      .style('fill', '#e5e7eb')
      .text('Количество (шт.)');
      
    legend.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('rx', 2)
      .attr('fill', '#ef4444')
      .attr('transform', 'translate(0, 25)');
      
    legend.append('text')
      .attr('x', 25)
      .attr('y', 37)
      .style('font-size', '12px')
      .style('fill', '#e5e7eb')
      .text('Объем (UZS)');
  };
  
  // Функция для отрисовки распределения по складам
  const renderWarehouseDistribution = () => {
    if (!warehouseDistributionRef.current) return;
    
    const container = warehouseDistributionRef.current;
    container.innerHTML = '';
    
    const margin = { top: 30, right: 30, bottom: 50, left: 150 };
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
      .text('Загруженность складов');
      
    // Шкалы
    const y = d3.scaleBand()
      .domain(warehouses.map(d => d.name))
      .range([0, height])
      .padding(0.3);
      
    const x = d3.scaleLinear()
      .domain([0, d3.max(warehouses, d => d.capacity)])
      .range([0, width]);
      
    // Оси
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#9ca3af');
      
    svg.append('g')
      .call(d3.axisLeft(y))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#9ca3af');
      
    // Создаем линии сетки
    svg.append('g')
      .attr('class', 'grid')
      .call(d3.axisBottom(x)
        .tickSize(height)
        .tickFormat('')
      )
      .selectAll('line')
      .style('stroke', '#374151')
      .style('stroke-opacity', '0.3')
      .style('stroke-dasharray', '3,3');
      
    // Создаем фоновые полосы (емкость склада)
    svg.selectAll('.bar-bg')
      .data(warehouses)
      .enter().append('rect')
      .attr('class', 'bar-bg')
      .attr('x', 0)
      .attr('y', d => y(d.name))
      .attr('width', d => x(d.capacity))
      .attr('height', y.bandwidth())
      .attr('fill', '#374151')
      .attr('rx', 4);
      
    // Создаем основные полосы с анимацией
    svg.selectAll('.bar')
      .data(warehouses)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', 0)
      .attr('y', d => y(d.name))
      .attr('width', 0)
      .attr('height', y.bandwidth())
      .attr('fill', d => {
        const ratio = d.stock / d.capacity;
        if (ratio > 0.8) return '#ef4444';
        if (ratio > 0.6) return '#f59e0b';
        return '#22c55e';
      })
      .attr('rx', 4)
      .transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .attr('width', d => x(d.stock));
      
    // Добавляем метки занятости и емкости
    svg.selectAll('.label-capacity')
      .data(warehouses)
      .enter().append('text')
      .attr('class', 'label-capacity')
      .attr('x', d => x(d.capacity) + 5)
      .attr('y', d => y(d.name) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .style('font-size', '12px')
      .style('fill', '#9ca3af')
      .style('opacity', 0)
      .transition()
      .duration(800)
      .delay((d, i) => i * 100 + 300)
      .style('opacity', 1)
      .text(d => `Емкость: ${d.capacity}`);
      
    svg.selectAll('.label-stock')
      .data(warehouses)
      .enter().append('text')
      .attr('class', 'label-stock')
      .attr('x', d => x(d.stock) - 30)
      .attr('y', d => y(d.name) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#ffffff')
      .style('opacity', 0)
      .transition()
      .duration(800)
      .delay((d, i) => i * 100 + 500)
      .style('opacity', 1)
      .text(d => `${d.stock}`);
      
    // Добавляем процент загруженности
    svg.selectAll('.label-percentage')
      .data(warehouses)
      .enter().append('text')
      .attr('class', 'label-percentage')
      .attr('x', 5)
      .attr('y', d => y(d.name) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#ffffff')
      .style('opacity', 0)
      .transition()
      .duration(800)
      .delay((d, i) => i * 100 + 700)
      .style('opacity', 1)
      .text(d => `${Math.round(d.stock / d.capacity * 100)}%`);
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
 
 // Функция для отрисовки распределения по цветам
 const renderColorDistribution = (model) => {
   if (!colorDistributionRef.current) return;
   
   const container = colorDistributionRef.current;
   container.innerHTML = '';
   
   const margin = { top: 20, right: 30, bottom: 30, left: 90 };
   const width = container.clientWidth - margin.left - margin.right;
   const height = container.clientHeight - margin.top - margin.bottom;
   
   const svg = d3.select(container)
     .append('svg')
     .attr('width', width + margin.left + margin.right)
     .attr('height', height + margin.top + margin.bottom)
     .append('g')
     .attr('transform', `translate(${margin.left},${margin.top})`);
     
   // Шкалы
   const y = d3.scaleBand()
     .domain(model.colorsDistribution.map(d => d.name))
     .range([0, height])
     .padding(0.2);
     
   const x = d3.scaleLinear()
     .domain([0, d3.max(model.colorsDistribution, d => d.count) * 1.2])
     .range([0, width]);
     
   // Оси
   svg.append('g')
     .attr('transform', `translate(0,${height})`)
     .call(d3.axisBottom(x).ticks(5))
     .selectAll('text')
     .style('fill', '#9ca3af');
     
   svg.append('g')
     .call(d3.axisLeft(y))
     .selectAll('text')
     .style('fill', '#9ca3af');
     
   // Создаем полосы с анимацией
   svg.selectAll('.bar')
     .data(model.colorsDistribution)
     .enter().append('rect')
     .attr('class', 'bar')
     .attr('x', 0)
     .attr('y', d => y(d.name))
     .attr('width', 0)
     .attr('height', y.bandwidth())
     .attr('fill', (d, i) => model.colors[i] || '#9ca3af')
     .attr('rx', 2)
     .transition()
     .duration(800)
     .delay((d, i) => i * 100)
     .attr('width', d => x(d.count));
     
   // Добавляем подписи
   svg.selectAll('.label')
     .data(model.colorsDistribution)
     .enter().append('text')
     .attr('class', 'label')
     .attr('x', d => x(d.count) - 25)
     .attr('y', d => y(d.name) + y.bandwidth() / 2)
     .attr('dy', '0.35em')
     .style('font-size', '12px')
     .style('fill', d => d.name === 'Белый' ? '#1f2937' : '#ffffff')
     .style('opacity', 0)
     .transition()
     .duration(800)
     .delay((d, i) => i * 100 + 300)
     .style('opacity', 1)
     .text(d => d.count);
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

 // Вычисляем общее количество автомобилей
 const totalCars = carModels.reduce((sum, model) => sum + model.stock, 0);

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
     <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
       <div className="bg-gray-800 p-4 rounded-lg shadow-md">
         <h3 className="text-gray-400 text-sm mb-1">Всего автомобилей</h3>
         <p className="text-3xl font-bold text-white">{totalCars}</p>
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
         <p className="text-3xl font-bold text-white">{carModels.length}</p>
         <div className="flex items-center mt-2 text-sm">
           <span className="text-gray-500">Общее количество</span>
         </div>
       </div>
       
       <div className="bg-gray-800 p-4 rounded-lg shadow-md">
         <h3 className="text-gray-400 text-sm mb-1">Загруженность складов</h3>
         <p className="text-3xl font-bold text-white">
           {Math.round(warehouses.reduce((sum, w) => sum + w.stock, 0) / warehouses.reduce((sum, w) => sum + w.capacity, 0) * 100)}%
         </p>
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
       
       <div className="bg-gray-800 p-4 rounded-lg shadow-md">
         <h3 className="text-gray-400 text-sm mb-1">Средняя стоимость</h3>
         <p className="text-3xl font-bold text-white">
           {Math.round(carModels.reduce((sum, model) => sum + model.price, 0) / carModels.length)}$
         </p>
         <div className="flex items-center mt-2 text-sm">
           <span className="text-gray-500">Усредненно по всем моделям</span>
         </div>
       </div>
     </div>
     
     {/* Региональная статистика и продажи */}
     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
       <div className="bg-gray-800 p-4 rounded-lg shadow-md">
         <h2 className="text-lg font-medium text-white mb-4">Распределение по складам</h2>
         <div ref={warehouseDistributionRef} className="h-[300px]"></div>
       </div>
       
       <div className="bg-gray-800 p-4 rounded-lg shadow-md">
         <h2 className="text-lg font-medium text-white mb-4">Динамика продаж</h2>
         <div ref={salesTrendChartRef} className="h-[300px]"></div>
       </div>
     </div>
     
     {/* Популярные комплектации */}
     <div className="bg-gray-800 p-4 rounded-lg shadow-md mb-6">
       <div className="flex justify-between items-start mb-4">
         <div>
           <h2 className="text-lg font-medium text-white">Популярные комплектации</h2>
           <p className="text-gray-400 text-sm">Распределение автомобилей по комплектациям</p>
         </div>
       </div>
       
       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         {popularConfigurations.map(config => (
           <div key={config.name} className="bg-gray-700/50 p-4 rounded-lg">
             <div className="flex justify-between items-center mb-2">
               <h3 className="font-medium text-white">{config.name}</h3>
               <span className="text-blue-400 font-medium">{config.percentage}%</span>
             </div>
             <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
               <div
                 className="h-full bg-blue-500 rounded-full"
                 style={{ width: `${config.percentage}%` }}
               ></div>
             </div>
             <p className="text-gray-400 text-sm mt-2">{config.count} автомобилей</p>
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
                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Цена</th>
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
                     <td className="px-4 py-3 whitespace-nowrap text-gray-300">{model.price}$</td>
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
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
               {/* Доступные цвета */}
               <div className="bg-gray-700/50 p-4 rounded-lg">
                 <h3 className="text-white font-medium mb-2">Распределение по цветам</h3>
                 <div ref={colorDistributionRef} className="h-[150px]"></div>
               </div>
               
               {/* Доступные комплектации */}
               <div className="bg-gray-700/50 p-4 rounded-lg">
                 <h3 className="text-white font-medium mb-2">Комплектации</h3>
                 <div className="space-y-3 mt-4">
                   {selectedModel.configurationsData.map(config => (
                     <div key={config.name}>
                       <div className="flex justify-between mb-1">
                         <span className="text-gray-300">{config.name}</span>
                         <span className="font-medium text-white">{config.count} шт.</span>
                       </div>
                       {renderPercentageBar(config.count, selectedModel.stock)}
                     </div>
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