// components/WarehouseAnalytics.jsx
'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const WarehouseAnalytics = () => {
  const salesChartRef = useRef(null);
  const regionDistributionRef = useRef(null);
  const manufacturerChartRef = useRef(null);
  const modelInventoryChartRef = useRef(null);
  const detailsChartRef = useRef(null);
  const colorDistributionRef = useRef(null);
  
  const [selectedMonth, setSelectedMonth] = useState('Апрель');
  const [selectedView, setSelectedView] = useState('общий');
  const [selectedCarModel, setSelectedCarModel] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  
  // Данные для диаграммы каналов продаж
  const salesChannelData = [
    { source: 'Дилерские центры', value: 68.3, color: '#3b82f6' },
    { source: 'Онлайн-продажи', value: 15.6, color: '#ef4444' },
    { source: 'Выставки', value: 10.2, color: '#f59e0b' },
    { source: 'Корпоративные клиенты', value: 5.9, color: '#22c55e' }
  ];

  // Данные для диаграммы распределения по регионам Узбекистана
  const regionData = [
    { region: 'Ташкент', male: 48, female: 36, other: 6 },
    { region: 'Самарканд', male: 35, female: 25, other: 4 },
    { region: 'Наманган', male: 28, female: 22, other: 3 },
    { region: 'Андижан', male: 26, female: 20, other: 3 },
    { region: 'Бухара', male: 22, female: 18, other: 2 }
  ];

  // Данные для диаграммы производителей
  const manufacturerData = [
    { manufacturer: 'Chevrolet', percentage: 42, color: '#3b82f6' },
    { manufacturer: 'Ravon', percentage: 18, color: '#ef4444' },
    { manufacturer: 'Kia', percentage: 12, color: '#f59e0b' },
    { manufacturer: 'Toyota', percentage: 10, color: '#06b6d4' },
    { manufacturer: 'Hyundai', percentage: 8, color: '#22c55e' },
    { manufacturer: 'Другие', percentage: 10, color: '#8b5cf6' }
  ];

  // Данные для уровней инвентаря (остаток на складе)
  const carModelInventory = [
    { model: 'Chevrolet Nexia', stock: 82, defective: 4 },
    { model: 'Chevrolet Cobalt', stock: 68, defective: 3 },
    { model: 'Ravon R4', stock: 45, defective: 2 },
    { model: 'Kia K5', stock: 32, defective: 1 },
    { model: 'Toyota Camry', stock: 28, defective: 1 }
  ];

  // Данные по моделям автомобилей
  const carModelsData = {
    'Chevrolet Nexia': {
      totalCount: 342,
      goodCondition: 328,
      defective: 14,
      defectRate: 4.1,
      price: 11900,
      regions: [
        { name: 'Ташкент', count: 148 },
        { name: 'Самарканд', count: 82 },
        { name: 'Наманган', count: 46 },
        { name: 'Андижан', count: 38 },
        { name: 'Бухара', count: 28 }
      ],
      colors: [
        { name: 'Белый', count: 120, hex: '#ffffff' },
        { name: 'Черный', count: 84, hex: '#000000' },
        { name: 'Серебристый', count: 68, hex: '#C0C0C0' },
        { name: 'Синий', count: 42, hex: '#0000FF' },
        { name: 'Красный', count: 28, hex: '#FF0000' }
      ],
      history: [
        { month: 'Янв', stock: 320, defective: 13 },
        { month: 'Фев', stock: 330, defective: 14 },
        { month: 'Мар', stock: 338, defective: 14 },
        { month: 'Апр', stock: 342, defective: 14 }
      ],
      variants: [
        { name: 'Базовая', count: 180 },
        { name: 'Комфорт', count: 110 },
        { name: 'Люкс', count: 52 }
      ]
    },
    'Chevrolet Cobalt': {
      totalCount: 285,
      goodCondition: 267,
      defective: 18,
      defectRate: 6.3,
      price: 13500,
      regions: [
        { name: 'Ташкент', count: 124 },
        { name: 'Самарканд', count: 65 },
        { name: 'Андижан', count: 42 },
        { name: 'Наманган', count: 34 },
        { name: 'Бухара', count: 20 }
      ],
      colors: [
        { name: 'Белый', count: 92, hex: '#ffffff' },
        { name: 'Черный', count: 76, hex: '#000000' },
        { name: 'Серебристый', count: 58, hex: '#C0C0C0' },
        { name: 'Синий', count: 35, hex: '#0000FF' },
        { name: 'Красный', count: 24, hex: '#FF0000' }
      ],
      history: [
        { month: 'Янв', stock: 252, defective: 15 },
        { month: 'Фев', stock: 264, defective: 16 },
        { month: 'Мар', stock: 278, defective: 17 },
        { month: 'Апр', stock: 285, defective: 18 }
      ],
      variants: [
        { name: 'Базовая', count: 120 },
        { name: 'Комфорт', count: 105 },
        { name: 'Люкс', count: 60 }
      ]
    },
    'Ravon R4': {
      totalCount: 186,
      goodCondition: 179,
      defective: 7,
      defectRate: 3.8,
      price: 10800,
      regions: [
        { name: 'Ташкент', count: 84 },
        { name: 'Самарканд', count: 42 },
        { name: 'Наманган', count: 25 },
        { name: 'Бухара', count: 20 },
        { name: 'Андижан', count: 15 }
      ],
      colors: [
        { name: 'Белый', count: 68, hex: '#ffffff' },
        { name: 'Черный', count: 42, hex: '#000000' },
        { name: 'Серебристый', count: 35, hex: '#C0C0C0' },
        { name: 'Синий', count: 26, hex: '#0000FF' },
        { name: 'Красный', count: 15, hex: '#FF0000' }
      ],
      history: [
        { month: 'Янв', stock: 165, defective: 6 },
        { month: 'Фев', stock: 171, defective: 6 },
        { month: 'Мар', stock: 180, defective: 7 },
        { month: 'Апр', stock: 186, defective: 7 }
      ],
      variants: [
        { name: 'Базовая', count: 95 },
        { name: 'Комфорт', count: 70 },
        { name: 'Люкс', count: 21 }
      ]
    },
    'Kia K5': {
      totalCount: 112,
      goodCondition: 108,
      defective: 4,
      defectRate: 3.6,
      price: 23500,
      regions: [
        { name: 'Ташкент', count: 65 },
        { name: 'Самарканд', count: 24 },
        { name: 'Андижан', count: 10 },
        { name: 'Наманган', count: 8 },
        { name: 'Бухара', count: 5 }
      ],
      colors: [
        { name: 'Белый', count: 35, hex: '#ffffff' },
        { name: 'Черный', count: 42, hex: '#000000' },
        { name: 'Серебристый', count: 18, hex: '#C0C0C0' },
        { name: 'Красный', count: 12, hex: '#FF0000' },
        { name: 'Синий', count: 5, hex: '#0000FF' }
      ],
      history: [
        { month: 'Янв', stock: 98, defective: 3 },
        { month: 'Фев', stock: 102, defective: 3 },
        { month: 'Мар', stock: 108, defective: 4 },
        { month: 'Апр', stock: 112, defective: 4 }
      ],
      variants: [
        { name: 'Комфорт', count: 42 },
        { name: 'Люкс', count: 48 },
        { name: 'Премиум', count: 22 }
      ]
    },
    'Toyota Camry': {
      totalCount: 94,
      goodCondition: 90,
      defective: 4,
      defectRate: 4.3,
      price: 32800,
      regions: [
        { name: 'Ташкент', count: 58 },
        { name: 'Самарканд', count: 18 },
        { name: 'Наманган', count: 8 },
        { name: 'Андижан', count: 6 },
        { name: 'Бухара', count: 4 }
      ],
      colors: [
        { name: 'Белый', count: 28, hex: '#ffffff' },
        { name: 'Черный', count: 36, hex: '#000000' },
        { name: 'Серебристый', count: 22, hex: '#C0C0C0' },
        { name: 'Красный', count: 6, hex: '#FF0000' },
        { name: 'Синий', count: 2, hex: '#0000FF' }
      ],
      history: [
        { month: 'Янв', stock: 85, defective: 3 },
        { month: 'Фев', stock: 89, defective: 4 },
        { month: 'Мар', stock: 92, defective: 4 },
        { month: 'Апр', stock: 94, defective: 4 }
      ],
      variants: [
        { name: 'Комфорт', count: 28 },
        { name: 'Люкс', count: 36 },
        { name: 'Премиум', count: 30 }
      ]
    }
  };

  // Данные по регионам Узбекистана
  const regionsData = {
    'Ташкент': {
      totalCount: 479,
      goodCondition: 462,
      defective: 17,
      defectRate: 3.5,
      population: '2,694,400',
      dealerships: 12,
      models: [
        { name: 'Chevrolet Nexia', count: 148 },
        { name: 'Chevrolet Cobalt', count: 124 },
        { name: 'Ravon R4', count: 84 },
        { name: 'Kia K5', count: 65 },
        { name: 'Toyota Camry', count: 58 }
      ],
      history: [
        { month: 'Янв', stock: 435, defective: 15 },
        { month: 'Фев', stock: 452, defective: 16 },
        { month: 'Мар', stock: 468, defective: 16 },
        { month: 'Апр', stock: 479, defective: 17 }
      ],
      salesChannels: [
        { name: 'Дилерские центры', percentage: 72 },
        { name: 'Онлайн-продажи', percentage: 18 },
        { name: 'Выставки', percentage: 6 },
        { name: 'Корпоративные клиенты', percentage: 4 }
      ]
    },
    'Самарканд': {
      totalCount: 231,
      goodCondition: 224,
      defective: 7,
      defectRate: 3.0,
      population: '519,000',
      dealerships: 5,
      models: [
        { name: 'Chevrolet Nexia', count: 82 },
        { name: 'Chevrolet Cobalt', count: 65 },
        { name: 'Ravon R4', count: 42 },
        { name: 'Kia K5', count: 24 },
        { name: 'Toyota Camry', count: 18 }
      ],
      history: [
        { month: 'Янв', stock: 210, defective: 6 },
        { month: 'Фев', stock: 218, defective: 7 },
        { month: 'Мар', stock: 225, defective: 7 },
        { month: 'Апр', stock: 231, defective: 7 }
      ],
      salesChannels: [
        { name: 'Дилерские центры', percentage: 68 },
        { name: 'Онлайн-продажи', percentage: 12 },
        { name: 'Выставки', percentage: 15 },
        { name: 'Корпоративные клиенты', percentage: 5 }
      ]
    },
    'Наманган': {
      totalCount: 121,
      goodCondition: 116,
      defective: 5,
      defectRate: 4.1,
      population: '475,700',
      dealerships: 3,
      models: [
        { name: 'Chevrolet Nexia', count: 46 },
        { name: 'Chevrolet Cobalt', count: 34 },
        { name: 'Ravon R4', count: 25 },
        { name: 'Kia K5', count: 8 },
        { name: 'Toyota Camry', count: 8 }
      ],
      history: [
        { month: 'Янв', stock: 105, defective: 4 },
        { month: 'Фев', stock: 112, defective: 5 },
        { month: 'Мар', stock: 118, defective: 5 },
        { month: 'Апр', stock: 121, defective: 5 }
      ],
      salesChannels: [
        { name: 'Дилерские центры', percentage: 65 },
        { name: 'Онлайн-продажи', percentage: 10 },
        { name: 'Выставки', percentage: 18 },
        { name: 'Корпоративные клиенты', percentage: 7 }
      ]
    },
    'Андижан': {
      totalCount: 111,
      goodCondition: 107,
      defective: 4,
      defectRate: 3.6,
      population: '416,300',
      dealerships: 3,
      models: [
        { name: 'Chevrolet Nexia', count: 38 },
        { name: 'Chevrolet Cobalt', count: 42 },
        { name: 'Ravon R4', count: 15 },
        { name: 'Kia K5', count: 10 },
        { name: 'Toyota Camry', count: 6 }
      ],
      history: [
        { month: 'Янв', stock: 98, defective: 3 },
        { month: 'Фев', stock: 102, defective: 4 },
        { month: 'Мар', stock: 108, defective: 4 },
        { month: 'Апр', stock: 111, defective: 4 }
      ],
      salesChannels: [
        { name: 'Дилерские центры', percentage: 62 },
        { name: 'Онлайн-продажи', percentage: 8 },
        { name: 'Выставки', percentage: 21 },
        { name: 'Корпоративные клиенты', percentage: 9 }
      ]
    },
    'Бухара': {
      totalCount: 77,
      goodCondition: 75,
      defective: 2,
      defectRate: 2.6,
      population: '278,400',
      dealerships: 2,
      models: [
        { name: 'Chevrolet Nexia', count: 28 },
        { name: 'Chevrolet Cobalt', count: 20 },
        { name: 'Ravon R4', count: 20 },
        { name: 'Kia K5', count: 5 },
        { name: 'Toyota Camry', count: 4 }
      ],
      history: [
        { month: 'Янв', stock: 68, defective: 2 },
        { month: 'Фев', stock: 72, defective: 2 },
        { month: 'Мар', stock: 75, defective: 2 },
        { month: 'Апр', stock: 77, defective: 2 }
      ],
      salesChannels: [
        { name: 'Дилерские центры', percentage: 58 },
        { name: 'Онлайн-продажи', percentage: 7 },
        { name: 'Выставки', percentage: 25 },
        { name: 'Корпоративные клиенты', percentage: 10 }
      ]
    },
  };

  // Обработчик клика по модели
  const handleCarModelClick = (model) => {
    if (selectedCarModel === model) {
      setSelectedCarModel(null);
    } else {
      setSelectedCarModel(model);
      setSelectedRegion(null); // Снимаем выбор региона при выборе модели
    }
  };

  // Обработчик клика по региону
  const handleRegionClick = (region) => {
    if (selectedRegion === region) {
      setSelectedRegion(null);
    } else {
      setSelectedRegion(region);
      setSelectedCarModel(null); // Снимаем выбор модели при выборе региона
    }
  };

  useEffect(() => {
    renderSalesChart();
    renderRegionDistribution();
    renderManufacturerChart();
    renderModelInventoryChart();
    
    if (selectedCarModel && detailsChartRef.current) {
      renderModelDetailsChart(selectedCarModel);
    }
    
    if (selectedCarModel && colorDistributionRef.current) {
      renderColorDistributionChart(selectedCarModel);
    }
    
    if (selectedRegion && detailsChartRef.current) {
      renderRegionDetailsChart(selectedRegion);
    }
    
    const handleResize = () => {
      renderSalesChart();
      renderRegionDistribution();
      renderManufacturerChart();
      renderModelInventoryChart();
      
      if (selectedCarModel && detailsChartRef.current) {
        renderModelDetailsChart(selectedCarModel);
      }
      
      if (selectedCarModel && colorDistributionRef.current) {
        renderColorDistributionChart(selectedCarModel);
      }
      
      if (selectedRegion && detailsChartRef.current) {
        renderRegionDetailsChart(selectedRegion);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedMonth, selectedView, selectedCarModel, selectedRegion]);

  // Рендер диаграммы каналов продаж
  const renderSalesChart = () => {
    if (!salesChartRef.current) return;
    
    const container = salesChartRef.current;
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
      .domain(salesChannelData.map(d => d.source))
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
      .style('fill', '#d1d5db')
      .attr('transform', 'rotate(-25)')
      .attr('text-anchor', 'end');
      
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
      .text(`Каналы продаж автомобилей. ${selectedMonth}, 2024`);
      
    // Подпись оси Y
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left + 15)
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#d1d5db')
      .text('Процент продаж');
      
    // Создаем столбцы с градиентом
    const defs = svg.append('defs');
    
    salesChannelData.forEach((d, i) => {
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
      .data(salesChannelData)
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
  
  // Рендер диаграммы распределения по регионам
  const renderRegionDistribution = () => {
    if (!regionDistributionRef.current) return;
    
    const container = regionDistributionRef.current;
    container.innerHTML = '';
    
    const margin = { top: 30, right: 20, bottom: 40, left: 100 };
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
      .text('Распределение автомобилей по регионам');
      
    // Создаем шкалы
    const x = d3.scaleLinear()
      .domain([0, 100])
      .range([0, width]);
      
    const y = d3.scaleBand()
      .domain(regionData.map(d => d.region))
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
      .style('fill', '#d1d5db')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        handleRegionClick(d);
      });
      
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
      
    const stackedData = stack(regionData);
    
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
      .attr('y', d => y(d.data.region))
      .attr('height', y.bandwidth())
      .attr('x', d => x(d[0]))
      .attr('width', 0)
      .attr('rx', 3)
      .attr('ry', 3)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        handleRegionClick(d.data.region);
      })
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
  };
  
  // Рендер круговой диаграммы производителей
  const renderManufacturerChart = () => {
    if (!manufacturerChartRef.current) return;
    
    const container = manufacturerChartRef.current;
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
      .text('Доля производителей на рынке');
      
    // Создаем пирог
    const pie = d3.pie()
      .value(d => d.percentage)
      .sort(null);
      
    const data_ready = pie(manufacturerData);
    
    // Создаем дуги
    const arc = d3.arc()
      .innerRadius(radius * 0.4)
      .outerRadius(radius);
      
    const arcHover = d3.arc()
      .innerRadius(radius * 0.4)
      .outerRadius(radius * 1.07);
      
    // Создаем градиенты
    const defs = svg.append('defs');
    
    manufacturerData.forEach((d, i) => {
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
          
        const total = d3.sum(manufacturerData, d => d.percentage);
        const percent = Math.round((d.data.percentage / total) * 100);
        
        // Обновляем центральный текст
        centerLabel.text(d.data.manufacturer);
        centerValue.text(`${percent}%`);
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arc);
          
        // Сбрасываем центральный текст
        centerLabel.text('Производители');
        centerValue.text('Узбекистан');
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
      .text('Производители');
      
    const centerValue = svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1em')
      .style('font-size', '24px')
      .style('font-weight', 'bold')
      .style('fill', '#ffffff')
      .text('Узбекистан');
  };
  
  // Рендер графика инвентаря моделей
  const renderModelInventoryChart = () => {
    if (!modelInventoryChartRef.current) return;
    
    const container = modelInventoryChartRef.current;
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
      .text('Склад: состояние автомобилей');
      
    // Создаем шкалы
    const y = d3.scaleBand()
      .domain(carModelInventory.map(d => d.model))
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
      .style('fill', '#d1d5db')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        handleCarModelClick(d);
      });
      
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
      
    // Создаем градиенты для исправных авто
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
      
    // Градиент для бракованных авто
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
      .data(carModelInventory)
      .join('rect')
      .attr('class', 'stock-bar')
      .attr('y', d => y(d.model))
      .attr('height', y.bandwidth())
      .attr('x', 0)
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', 'url(#stockGradient)')
      .attr('width', 0)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        handleCarModelClick(d.model);
      })
      .transition()
      .duration(800)
      .attr('width', d => x(d.stock));
      
    // Добавляем полосы для дефектных
    svg.selectAll('.defective-bar')
      .data(carModelInventory)
      .join('rect')
      .attr('class', 'defective-bar')
      .attr('y', d => y(d.model))
      .attr('height', y.bandwidth())
      .attr('x', d => x(d.stock))
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', 'url(#defectiveGradient)')
      .attr('width', 0)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        handleCarModelClick(d.model);
      })
      .transition()
      .duration(800)
      .delay(800)
      .attr('width', d => x(d.defective));
      
    // Добавляем значения
    svg.selectAll('.stock-label')
      .data(carModelInventory)
      .join('text')
      .attr('class', 'stock-label')
      .attr('x', d => x(d.stock / 2))
      .attr('y', d => y(d.model) + y.bandwidth() / 2)
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
      .data(carModelInventory)
      .join('text')
      .attr('class', 'defective-label')
      .attr('x', d => x(d.stock + d.defective / 2))
      .attr('y', d => y(d.model) + y.bandwidth() / 2)
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
      .style('opacity', d => d.defective > 1 ? 1 : 0);
      
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
      .text('Исправные авто');
      
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

  // Функция для отрисовки графика детализации выбранной модели
  const renderModelDetailsChart = (modelName) => {
    if (!detailsChartRef.current) return;
    
    const container = detailsChartRef.current;
    container.innerHTML = '';
    
    const margin = { top: 30, right: 20, bottom: 50, left: 50 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
      
    // Получаем историю для выбранной модели
    const historyData = carModelsData[modelName].history;
    
    // Создаем шкалы
    const x = d3.scaleBand()
      .domain(historyData.map(d => d.month))
      .range([0, width])
      .padding(0.3);
      
    const y = d3.scaleLinear()
      .domain([0, d3.max(historyData, d => d.stock) * 1.1])
      .range([height, 0]);
      
    // Добавляем оси
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#d1d5db');
      
    svg.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#d1d5db');
      
    // Создаем градиент для столбцов
    const defs = svg.append('defs');
    const barGradient = defs.append('linearGradient')
      .attr('id', 'detailsBarGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
      
    barGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#4f46e5')
      .attr('stop-opacity', 1);
      
    barGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#4338ca')
      .attr('stop-opacity', 1);
      
    // Добавляем столбцы
    svg.selectAll('.detail-bar')
      .data(historyData)
      .join('rect')
      .attr('class', 'detail-bar')
      .attr('x', d => x(d.month))
      .attr('width', x.bandwidth())
      .attr('y', height)
      .attr('height', 0)
      .attr('rx', 4)
      .attr('fill', 'url(#detailsBarGradient)')
      .transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .attr('y', d => y(d.stock))
      .attr('height', d => height - y(d.stock));
      
    // Добавляем метки значений
    svg.selectAll('.detail-label')
      .data(historyData)
      .join('text')
      .attr('class', 'detail-label')
      .attr('x', d => x(d.month) + x.bandwidth() / 2)
      .attr('y', d => y(d.stock) - 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#d1d5db')
      .style('opacity', 0)
      .text(d => d.stock)
      .transition()
      .duration(500)
      .delay((d, i) => i * 100 + 800)
      .style('opacity', 1);
      
    // Добавляем линию для дефектных авто
    const line = d3.line()
      .x(d => x(d.month) + x.bandwidth() / 2)
      .y(d => y(d.defective))
      .curve(d3.curveMonotoneX);
      
    // Рисуем линию
    const path = svg.append('path')
      .datum(historyData)
      .attr('fill', 'none')
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 3)
      .attr('d', line);
      
    const pathLength = path.node().getTotalLength();
    
    path
      .attr('stroke-dasharray', pathLength)
      .attr('stroke-dashoffset', pathLength)
      .transition()
      .duration(1000)
      .attr('stroke-dashoffset', 0);
      
    // Добавляем точки на линии
    svg.selectAll('.detail-dot')
      .data(historyData)
      .join('circle')
      .attr('class', 'detail-dot')
      .attr('cx', d => x(d.month) + x.bandwidth() / 2)
      .attr('cy', d => y(d.defective))
      .attr('r', 0)
      .attr('fill', '#ef4444')
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 2)
      .transition()
      .duration(500)
      .delay((d, i) => 1000 + i * 100)
      .attr('r', 5);
      
    // Добавляем метки для дефектных авто
    svg.selectAll('.defect-label')
      .data(historyData)
      .join('text')
      .attr('class', 'defect-label')
      .attr('x', d => x(d.month) + x.bandwidth() / 2)
      .attr('y', d => y(d.defective) - 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#ef4444')
      .style('opacity', 0)
      .text(d => d.defective)
      .transition()
      .duration(500)
      .delay((d, i) => 1000 + i * 100)
      .style('opacity', 1);
      
    // Добавляем заголовок
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('fill', '#f9fafb')
      .text(`Динамика остатков: ${modelName}`);
      
    // Добавляем легенду
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 200}, ${height - 30})`);
      
    legend.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', '#4f46e5')
      .attr('rx', 2);
      
    legend.append('text')
      .attr('x', 25)
      .attr('y', 12)
      .style('font-size', '12px')
      .style('fill', '#d1d5db')
      .text('Всего единиц');
      
    legend.append('circle')
      .attr('cx', 7.5)
      .attr('cy', 32.5)
      .attr('r', 7.5)
      .attr('fill', '#ef4444');
      
    legend.append('text')
      .attr('x', 25)
      .attr('y', 37)
      .style('font-size', '12px')
      .style('fill', '#d1d5db')
      .text('Брак');
  };
  
  // Функция для отрисовки графика детализации выбранного региона
  const renderRegionDetailsChart = (regionName) => {
    if (!detailsChartRef.current) return;
    
    const container = detailsChartRef.current;
    container.innerHTML = '';
    
    const margin = { top: 30, right: 20, bottom: 50, left: 50 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
      
    // Получаем историю для выбранного региона
    const historyData = regionsData[regionName].history;
    
    // Создаем шкалы
    const x = d3.scaleBand()
      .domain(historyData.map(d => d.month))
      .range([0, width])
      .padding(0.3);
      
    const y = d3.scaleLinear()
      .domain([0, d3.max(historyData, d => d.stock) * 1.1])
      .range([height, 0]);
      
    // Добавляем оси
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#d1d5db');
      
    svg.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#d1d5db');
      
    // Создаем градиент для столбцов
    const defs = svg.append('defs');
    const barGradient = defs.append('linearGradient')
      .attr('id', 'regionBarGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
      
    barGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#8b5cf6')
      .attr('stop-opacity', 1);
      
    barGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#7c3aed')
      .attr('stop-opacity', 1);
      
    // Добавляем столбцы
    svg.selectAll('.region-bar')
      .data(historyData)
      .join('rect')
      .attr('class', 'region-bar')
      .attr('x', d => x(d.month))
      .attr('width', x.bandwidth())
      .attr('y', height)
      .attr('height', 0)
      .attr('rx', 4)
      .attr('fill', 'url(#regionBarGradient)')
      .transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .attr('y', d => y(d.stock))
      .attr('height', d => height - y(d.stock));
      
    // Добавляем метки значений
    svg.selectAll('.region-label')
      .data(historyData)
      .join('text')
      .attr('class', 'region-label')
      .attr('x', d => x(d.month) + x.bandwidth() / 2)
      .attr('y', d => y(d.stock) - 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#d1d5db')
      .style('opacity', 0)
      .text(d => d.stock)
      .transition()
      .duration(500)
      .delay((d, i) => i * 100 + 800)
      .style('opacity', 1);
      
    // Добавляем линию для дефектных авто
    const line = d3.line()
      .x(d => x(d.month) + x.bandwidth() / 2)
      .y(d => y(d.defective))
      .curve(d3.curveMonotoneX);
      
    // Рисуем линию
    const path = svg.append('path')
      .datum(historyData)
      .attr('fill', 'none')
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 3)
      .attr('d', line);
      
    const pathLength = path.node().getTotalLength();
    
    path
      .attr('stroke-dasharray', pathLength)
      .attr('stroke-dashoffset', pathLength)
      .transition()
      .duration(1000)
      .attr('stroke-dashoffset', 0);
      
    // Добавляем точки на линии
    svg.selectAll('.region-dot')
      .data(historyData)
      .join('circle')
      .attr('class', 'region-dot')
      .attr('cx', d => x(d.month) + x.bandwidth() / 2)
      .attr('cy', d => y(d.defective))
      .attr('r', 0)
      .attr('fill', '#ef4444')
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 2)
      .transition()
      .duration(500)
      .delay((d, i) => 1000 + i * 100)
      .attr('r', 5);
      
    // Добавляем метки для дефектных авто
    svg.selectAll('.region-defect-label')
      .data(historyData)
      .join('text')
      .attr('class', 'region-defect-label')
      .attr('x', d => x(d.month) + x.bandwidth() / 2)
      .attr('y', d => y(d.defective) - 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#ef4444')
      .style('opacity', 0)
      .text(d => d.defective)
      .transition()
      .duration(500)
      .delay((d, i) => 1000 + i * 100)
      .style('opacity', 1);
      
    // Добавляем заголовок
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('fill', '#f9fafb')
      .text(`Динамика остатков по региону: ${regionName}`);
      
    // Добавляем легенду
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 200}, ${height - 30})`);
      
 legend.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', '#8b5cf6')
      .attr('rx', 2);
      
    legend.append('text')
      .attr('x', 25)
      .attr('y', 12)
      .style('font-size', '12px')
      .style('fill', '#d1d5db')
      .text('Всего автомобилей');
      
    legend.append('circle')
      .attr('cx', 7.5)
      .attr('cy', 32.5)
      .attr('r', 7.5)
      .attr('fill', '#ef4444');
      
    legend.append('text')
      .attr('x', 25)
      .attr('y', 37)
      .style('font-size', '12px')
      .style('fill', '#d1d5db')
      .text('Брак');
  };
  
  // Функция для отрисовки распределения по цветам для выбранной модели
  const renderColorDistributionChart = (modelName) => {
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
      
    // Получаем данные о цветах для выбранной модели
    const colorData = carModelsData[modelName].colors;
    
    // Шкалы
    const y = d3.scaleBand()
      .domain(colorData.map(d => d.name))
      .range([0, height])
      .padding(0.2);
      
    const x = d3.scaleLinear()
      .domain([0, d3.max(colorData, d => d.count) * 1.2])
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
      
    // Добавляем подписи
    svg.selectAll('.color-label')
      .data(colorData)
      .join('text')
      .attr('class', 'color-label')
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
      
    // Добавляем заголовок
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#f9fafb')
      .text('Распределение по цветам');
  };

  return (
    <div className="p-4 md:p-6 bg-gray-900 text-gray-100 min-h-screen">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Аналитика автосклада Узбекистана</h1>
          <p className="text-gray-400 mt-1">Мониторинг остатков автомобилей и их состояния</p>
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
              <option value="модель">По моделям</option>
              <option value="регион">По регионам</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
          <div ref={salesChartRef} className="w-full h-[300px]"></div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
          <div className="flex justify-between mb-2">
            <h2 className="text-lg font-semibold">Состояние автомобилей</h2>
            <div className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">
              Обновлено сегодня
            </div>
          </div>
          <div className="text-sm text-gray-400 mb-4">
            Информация о браке: сколько автомобилей отмечены как дефектные
          </div>
          <div ref={modelInventoryChartRef} className="w-full h-[250px]"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
          <div ref={regionDistributionRef} className="w-full h-[300px]"></div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
          <div className="flex justify-between mb-2">
            <h2 className="text-lg font-semibold">Статистика производителей</h2>
            <button className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div ref={manufacturerChartRef} className="w-full h-[300px]"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg flex items-center">
          <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <div className="text-sm text-gray-400">Всего автомобилей на складе</div>
            <div className="text-2xl font-bold">1,019</div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg flex items-center">
          <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-sm text-gray-400">Автомобилей в хорошем состоянии</div>
            <div className="text-2xl font-bold">972</div>
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
            <div className="text-2xl font-bold">47</div>
            <div className="text-xs text-red-400">4.6% от общего количества</div>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-4 shadow-lg mb-6">
        <div className="flex justify-between mb-4">
          <h2 className="text-lg font-semibold">Управление автоскладом по моделям</h2>
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
            Ниже представлены данные по моделям автомобилей на складах Узбекистана. Для получения подробной информации нажмите на строку с моделью.
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 text-gray-400 text-left">
                <th className="p-3 rounded-l-lg">Модель</th>
                <th className="p-3">Всего единиц</th>
                <th className="p-3">Исправные</th>
                <th className="p-3">Брак</th>
                <th className="p-3">% брака</th>
                <th className="p-3">Цена ($)</th>
                <th className="p-3 rounded-r-lg">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {Object.entries(carModelsData).map(([model, data]) => (
                <tr 
                  key={model} 
                  className={`hover:bg-gray-700/30 transition-colors cursor-pointer ${selectedCarModel === model ? 'bg-blue-900/20' : ''}`}
                  onClick={() => handleCarModelClick(model)}
                >
                  <td className="p-3">{model}</td>
                  <td className="p-3">{data.totalCount}</td>
                  <td className="p-3">{data.goodCondition}</td>
                  <td className="p-3">{data.defective}</td>
                  <td className="p-3">
                    <span className={`bg-${data.defectRate > 5 ? 'red' : data.defectRate > 3 ? 'yellow' : 'green'}-500/20 
                                     text-${data.defectRate > 5 ? 'red' : data.defectRate > 3 ? 'yellow' : 'green'}-400 
                                     px-2 py-1 rounded-full text-xs`}>
                      {data.defectRate}%
                    </span>
                  </td>
                  <td className="p-3">{data.price.toLocaleString()}</td>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-4 shadow-lg mb-6">
        <div className="flex justify-between mb-4">
          <h2 className="text-lg font-semibold">Управление автоскладом по регионам</h2>
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
            Ниже представлена статистика по регионам Узбекистана. Для получения подробной информации по региону нажмите на соответствующую строку.
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 text-gray-400 text-left">
                <th className="p-3 rounded-l-lg">Регион</th>
                <th className="p-3">Всего автомобилей</th>
                <th className="p-3">Исправные</th>
                <th className="p-3">Брак</th>
                <th className="p-3">% брака</th>
                <th className="p-3">Дилерские центры</th>
                <th className="p-3 rounded-r-lg">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {Object.entries(regionsData).map(([region, data]) => (
                <tr 
                  key={region} 
                  className={`hover:bg-gray-700/30 transition-colors cursor-pointer ${selectedRegion === region ? 'bg-purple-900/20' : ''}`}
                  onClick={() => handleRegionClick(region)}
                >
                  <td className="p-3">{region}</td>
                  <td className="p-3">{data.totalCount}</td>
                  <td className="p-3">{data.goodCondition}</td>
                  <td className="p-3">{data.defective}</td>
                  <td className="p-3">
                    <span className={`bg-${data.defectRate > 5 ? 'red' : data.defectRate > 3 ? 'yellow' : 'green'}-500/20 
                                     text-${data.defectRate > 5 ? 'red' : data.defectRate > 3 ? 'yellow' : 'green'}-400 
                                     px-2 py-1 rounded-full text-xs`}>
                      {data.defectRate}%
                    </span>
                  </td>
                  <td className="p-3">{data.dealerships}</td>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Детальная информация о выбранной модели */}
      {selectedCarModel && (
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg mb-6 border border-blue-900/30 transition-all duration-300">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">{selectedCarModel}</h2>
              <p className="text-blue-400">Детальная информация о модели</p>
            </div>
            <button 
              onClick={() => setSelectedCarModel(null)}
              className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700/50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Статистика по регионам */}
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <h3 className="text-white font-medium mb-3">Распределение по регионам</h3>
              <div className="space-y-4">
                {carModelsData[selectedCarModel].regions.map(region => (
                  <div key={region.name}>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-300">{region.name}</span>
                      <span className="font-medium text-white">{region.count} шт.</span>
                    </div>
                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(region.count / carModelsData[selectedCarModel].totalCount) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* История изменений - график */}
            <div className="bg-gray-700/50 p-4 rounded-lg md:col-span-2">
              <h3 className="text-white font-medium mb-3">Динамика остатков</h3>
              <div ref={detailsChartRef} className="h-[200px]"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Распределение по цветам */}
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <h3 className="text-white font-medium mb-3">Цвета автомобилей</h3>
              <div ref={colorDistributionRef} className="h-[200px]"></div>
            </div>
            
            {/* Комплектации */}
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <h3 className="text-white font-medium mb-3">Комплектации</h3>
              <div className="space-y-4 mt-4">
                {carModelsData[selectedCarModel].variants.map(variant => (
                  <div key={variant.name}>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-300">{variant.name}</span>
                      <span className="font-medium text-white">{variant.count} шт.</span>
                    </div>
                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${(variant.count / carModelsData[selectedCarModel].totalCount) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-right text-xs text-gray-400 mt-1">
                      {((variant.count / carModelsData[selectedCarModel].totalCount) * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Кнопки действий */}
          <div className="flex flex-wrap justify-end gap-3 mt-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              Сформировать отчет
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
              Заказать ещё
            </button>
            <button className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
              </svg>
              Перераспределить по регионам
            </button>
          </div>
        </div>
      )}
      
      {/* Детальная информация о выбранном регионе */}
      {selectedRegion && (
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg mb-6 border border-purple-900/30 transition-all duration-300">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">{selectedRegion}</h2>
              <p className="text-purple-400">Детальная информация о регионе</p>
            </div>
            <button 
              onClick={() => setSelectedRegion(null)}
              className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700/50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Статистика по моделям */}
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <h3 className="text-white font-medium mb-3">Распределение по моделям</h3>
              <div className="space-y-4">
                {regionsData[selectedRegion].models.map(model => (
                  <div key={model.name}>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-300">{model.name}</span>
                      <span className="font-medium text-white">{model.count} шт.</span>
                    </div>
                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${(model.count / regionsData[selectedRegion].totalCount) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* История изменений - график */}
            <div className="bg-gray-700/50 p-4 rounded-lg md:col-span-2">
              <h3 className="text-white font-medium mb-3">Динамика остатков</h3>
              <div ref={detailsChartRef} className="h-[200px]"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Каналы продаж */}
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <h3 className="text-white font-medium mb-3">Каналы продаж</h3>
              <div className="space-y-4 mt-4">
                {regionsData[selectedRegion].salesChannels.map(channel => (
                  <div key={channel.name}>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-300">{channel.name}</span>
                      <span className="font-medium text-white">{channel.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${channel.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Информация о регионе */}
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <h3 className="text-white font-medium mb-3">Информация о регионе</h3>
              <div className="space-y-4">
                <div className="bg-gray-800/70 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-gray-400 text-sm">Население</div>
                      <div className="text-white font-medium">{regionsData[selectedRegion].population}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Дилерские центры</div>
                      <div className="text-white font-medium">{regionsData[selectedRegion].dealerships}</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-800/70 rounded-lg p-3">
                  <div className="text-gray-400 text-sm">Рейтинг продаж</div>
                  <div className="flex items-center mt-1">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${i < 4 ? 'text-yellow-400' : 'text-gray-500'}`} viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="ml-2 text-white">4.0/5.0</span>
                  </div>
                </div>
                
                <div className="bg-gray-800/70 rounded-lg p-3">
                  <div className="text-gray-400 text-sm">Рекомендации</div>
                  <div className="text-white text-sm mt-1">
                    {selectedRegion === 'Ташкент' 
                      ? 'Увеличить поставки премиальных моделей для удовлетворения спроса.' 
                      : selectedRegion === 'Самарканд' 
                        ? 'Расширить дилерскую сеть для улучшения доступности автомобилей.' 
                        : 'Оптимизировать выбор моделей под локальный спрос.'}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Кнопки действий */}
          <div className="flex flex-wrap justify-end gap-3 mt-4">
            <button className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              Детальный отчет
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
              </svg>
              Запланировать поставку
            </button>
            <button className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              Настройки региона
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseAnalytics;