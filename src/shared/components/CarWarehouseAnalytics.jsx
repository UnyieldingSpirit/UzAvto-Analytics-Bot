// components/CarWarehouseAnalytics.jsx
'use client';
import { carModels } from '../mocks/mock-data';
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const CarWarehouseAnalytics = () => {
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('Апрель');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const inventoryChartRef = useRef(null);
  const defectiveChartRef = useRef(null);
  const modelDistributionRef = useRef(null);
  const warehouseComparisonRef = useRef(null);
  
  // Данные по складам автомобилей
  const warehouses = [
    { id: 'all', name: 'Все склады' },
    { id: 'tashkent', name: 'Ташкент' },
    { id: 'samarkand', name: 'Самарканд' },
    { id: 'bukhara', name: 'Бухара' },
    { id: 'andijan', name: 'Андижан' },
    { id: 'fergana', name: 'Фергана' }
  ];
  
  // Данные по категориям автомобилей
  const categories = [
    { id: 'all', name: 'Все категории' },
    { id: 'sedan', name: 'Седаны' },
    { id: 'suv', name: 'Внедорожники' },
    { id: 'hatchback', name: 'Хэтчбеки' },
    { id: 'minivan', name: 'Минивэны' }
  ];
  
  // Данные по моделям автомобилей
 const modelData = carModels.map(model => ({
  ...model,
  stock: Math.round(40 + Math.random() * 50),
  defective: Math.round(2 + Math.random() * 8)
}));
  
  // Данные по складам и распределению бракованных автомобилей
  const warehouseData = [
  { 
    id: 'tashkent', 
    name: 'Ташкент', 
    totalCars: 180, 
    defectiveCars: 12,
    models: [
      { model: 'DAMAS-2', defective: 4, total: 45 },
      { model: 'TRACKER-2', defective: 2, total: 38 },
      { model: 'Captiva 5T', defective: 3, total: 32 },
      { model: 'ONIX', defective: 3, total: 65 }
    ]
  },
  { 
    id: 'samarkand', 
    name: 'Самарканд', 
    totalCars: 120, 
    defectiveCars: 9,
    models: [
      { model: 'DAMAS-2', defective: 2, total: 30 },
      { model: 'TRACKER-2', defective: 1, total: 25 },
      { model: 'Captiva 5T', defective: 2, total: 20 },
      { model: 'ONIX', defective: 4, total: 45 }
    ]
  },
  { 
    id: 'bukhara', 
    name: 'Бухара', 
    totalCars: 90, 
    defectiveCars: 5,
    models: [
      { model: 'DAMAS-2', defective: 1, total: 20 },
      { model: 'TRACKER-2', defective: 1, total: 15 },
      { model: 'Captiva 5T', defective: 1, total: 10 },
      { model: 'ONIX', defective: 2, total: 45 }
    ]
  },
  { 
    id: 'andijan', 
    name: 'Андижан', 
    totalCars: 65, 
    defectiveCars: 8,
    models: [
      { model: 'DAMAS-2', defective: 2, total: 20 },
      { model: 'TRACKER-2', defective: 3, total: 25 },
      { model: 'ONIX', defective: 3, total: 20 }
    ]
  },
  { 
    id: 'fergana', 
    name: 'Фергана', 
    totalCars: 45, 
    defectiveCars: 3,
    models: [
      { model: 'DAMAS-2', defective: 1, total: 15 },
      { model: 'Captiva 5T', defective: 1, total: 10 },
      { model: 'ONIX', defective: 1, total: 20 }
    ]
  }
];

  useEffect(() => {
    renderInventoryChart();
    renderDefectiveChart();
    renderModelDistribution();
    renderWarehouseComparison();
    
    const handleResize = () => {
      renderInventoryChart();
      renderDefectiveChart();
      renderModelDistribution();
      renderWarehouseComparison();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedWarehouse, selectedCategory]);

  // Фильтрация данных по выбранному складу и категории
  const getFilteredModelData = () => {
    let filtered = [...modelData];
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(model => model.category === selectedCategory);
    }
    
    return filtered;
  };
  
  // Получение данных склада
  const getWarehouseInfo = (warehouseId) => {
    if (warehouseId === 'all') {
      const totalCars = warehouseData.reduce((sum, wh) => sum + wh.totalCars, 0);
      const defectiveCars = warehouseData.reduce((sum, wh) => sum + wh.defectiveCars, 0);
      return { 
        totalCars, 
        defectiveCars, 
        defectivePercentage: (defectiveCars / totalCars * 100).toFixed(1) 
      };
    }
    
    const warehouse = warehouseData.find(wh => wh.id === warehouseId);
    if (warehouse) {
      return { 
        totalCars: warehouse.totalCars, 
        defectiveCars: warehouse.defectiveCars, 
        defectivePercentage: (warehouse.defectiveCars / warehouse.totalCars * 100).toFixed(1) 
      };
    }
    
    return { totalCars: 0, defectiveCars: 0, defectivePercentage: 0 };
  };

  // Рендер графика остатков автомобилей
  const renderInventoryChart = () => {
    if (!inventoryChartRef.current) return;
    
    const container = inventoryChartRef.current;
    container.innerHTML = '';
    
    const filteredData = getFilteredModelData();
    if (filteredData.length === 0) return;
    
    const margin = { top: 30, right: 50, bottom: 70, left: 140 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = Math.max(300, filteredData.length * 40) - margin.top - margin.bottom;
    
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
      .style('fill', '#f3f4f6')
      .text('Остатки автомобилей на складе');
      
    // Создаем шкалы
    const y = d3.scaleBand()
      .domain(filteredData.map(d => d.name))
      .range([0, height])
      .padding(0.3);
      
    const x = d3.scaleLinear()
      .domain([0, d3.max(filteredData, d => d.stock + d.defective) * 1.1])
      .range([0, width]);
      
    // Добавляем оси
    svg.append('g')
      .call(d3.axisLeft(y))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#d1d5db');
      
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#d1d5db');
      
    // Добавляем подпись оси X
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height + 40)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#9ca3af')
      .text('Количество автомобилей');
      
    // Добавляем сетку
    svg.append('g')
      .attr('class', 'grid')
      .call(d3.axisBottom(x)
        .tickSize(height)
        .tickFormat(''))
      .selectAll('line')
      .style('stroke', 'rgba(255, 255, 255, 0.1)');
      
    // Создаем градиенты для исправных автомобилей
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
      
    // Градиент для бракованных автомобилей
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
      .data(filteredData)
      .join('rect')
      .attr('class', 'stock-bar')
      .attr('y', d => y(d.name))
      .attr('height', y.bandwidth())
      .attr('x', 0)
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', 'url(#stockGradient)')
      .attr('width', 0)
      .attr('cursor', 'pointer')
      .on('click', (event, d) => handleModelClick(d))
      .transition()
      .duration(800)
      .attr('width', d => x(d.stock));
      
    // Добавляем полосы для бракованных
    svg.selectAll('.defective-bar')
      .data(filteredData)
      .join('rect')
      .attr('class', 'defective-bar')
      .attr('y', d => y(d.name))
      .attr('height', y.bandwidth())
      .attr('x', d => x(d.stock))
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', 'url(#defectiveGradient)')
      .attr('width', 0)
      .attr('cursor', 'pointer')
      .on('click', (event, d) => handleModelClick(d))
      .transition()
      .duration(800)
      .delay(800)
      .attr('width', d => x(d.defective));
      
    // Добавляем значения
    svg.selectAll('.stock-label')
      .data(filteredData)
      .join('text')
      .attr('class', 'stock-label')
      .attr('x', d => x(d.stock / 2))
      .attr('y', d => y(d.name) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .style('fill', '#ffffff')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .text(d => d.stock)
      .transition()
      .duration(500)
      .delay(1000)
      .style('opacity', 1);
      
    svg.selectAll('.defective-label')
      .data(filteredData)
      .join('text')
      .attr('class', 'defective-label')
      .attr('x', d => x(d.stock + d.defective / 2))
      .attr('y', d => y(d.name) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .style('fill', '#ffffff')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .text(d => d.defective)
      .transition()
      .duration(500)
      .delay(1200)
      .style('opacity', d => d.defective > 2 ? 1 : 0);
  };
  
  // Рендер диаграммы бракованных автомобилей по складам
  const renderDefectiveChart = () => {
    if (!defectiveChartRef.current) return;
    
    const container = defectiveChartRef.current;
    container.innerHTML = '';
    
    const margin = { top: 30, right: 30, bottom: 70, left: 60 };
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
      .style('fill', '#f3f4f6')
      .text('Бракованные автомобили по складам');
      
    // Создаем шкалы
    const x = d3.scaleBand()
      .domain(warehouseData.map(d => d.name))
      .range([0, width])
      .padding(0.3);
      
    const y = d3.scaleLinear()
      .domain([0, d3.max(warehouseData, d => d.defectivePercentage || (d.defectiveCars / d.totalCars * 100)) * 1.2])
      .range([height, 0]);
      
    // Добавляем оси
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#d1d5db')
      .attr('transform', 'rotate(-20)')
      .attr('text-anchor', 'end');
      
    svg.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#d1d5db');
      
    // Добавляем подпись оси Y
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left + 15)
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#9ca3af')
      .text('% бракованных');
      
    // Добавляем сетку
    svg.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat(''))
      .selectAll('line')
      .style('stroke', 'rgba(255, 255, 255, 0.1)');
      
    // Создаем градиент для столбцов
    const defs = svg.append('defs');
    const barGradient = defs.append('linearGradient')
      .attr('id', 'defectiveBarGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
      
    barGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#ef4444')
      .attr('stop-opacity', 0.8);
      
    barGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#ef4444')
      .attr('stop-opacity', 0.5);
      
    // Добавляем столбцы
    svg.selectAll('.bar')
      .data(warehouseData)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.name))
      .attr('width', x.bandwidth())
      .attr('fill', 'url(#defectiveBarGradient)')
      .attr('rx', 4)
      .attr('cursor', 'pointer')
      .on('click', (event, d) => setSelectedWarehouse(d.id))
      .attr('y', height)
      .attr('height', 0)
      .transition()
      .duration(800)
      .attr('y', d => y(d.defectiveCars / d.totalCars * 100))
      .attr('height', d => height - y(d.defectiveCars / d.totalCars * 100));
      
    // Добавляем метки значений
    svg.selectAll('.label')
      .data(warehouseData)
      .join('text')
      .attr('class', 'label')
      .attr('x', d => x(d.name) + x.bandwidth() / 2)
      .attr('y', d => y(d.defectiveCars / d.totalCars * 100) - 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#ffffff')
      .style('opacity', 0)
      .text(d => `${(d.defectiveCars / d.totalCars * 100).toFixed(1)}%`)
      .transition()
      .duration(500)
      .delay(800)
      .style('opacity', 1);
      
    // Выделяем выбранный склад
    if (selectedWarehouse !== 'all') {
      const selectedData = warehouseData.find(d => d.id === selectedWarehouse);
      if (selectedData) {
        svg.append('rect')
          .attr('x', x(selectedData.name) - 4)
          .attr('y', y(selectedData.defectiveCars / selectedData.totalCars * 100) - 15)
          .attr('width', x.bandwidth() + 8)
          .attr('height', height - y(selectedData.defectiveCars / selectedData.totalCars * 100) + 20)
          .attr('rx', 6)
          .attr('fill', 'none')
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '5,5')
          .style('pointer-events', 'none');
      }
    }
  };
  
  // Рендер круговой диаграммы распределения моделей
  const renderModelDistribution = () => {
    if (!modelDistributionRef.current) return;
    
    const container = modelDistributionRef.current;
    container.innerHTML = '';
    
    const margin = 40;
    const width = container.clientWidth;
    const height = container.clientHeight;
    const radius = Math.min(width, height) / 2 - margin;
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);
      
    // Фильтруем данные по выбранному складу
    let pieData;
    if (selectedWarehouse === 'all') {
      // Если выбраны все склады, используем общие данные по моделям
      pieData = modelData.map(model => ({
        name: model.name,
        value: model.stock + model.defective
      }));
    } else {
      // Иначе используем данные конкретного склада
      const warehouse = warehouseData.find(wh => wh.id === selectedWarehouse);
      if (warehouse) {
        pieData = warehouse.models.map(model => ({
          name: model.model,
          value: model.total
        }));
      } else {
        pieData = [];
      }
    }
    
    if (pieData.length === 0) return;
    
    // Добавляем заголовок
    svg.append('text')
      .attr('x', 0)
      .attr('y', -height / 2 + margin / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('fill', '#f3f4f6')
      .text(`Распределение моделей${selectedWarehouse !== 'all' ? ` (${warehouseData.find(wh => wh.id === selectedWarehouse)?.name})` : ''}`);
      
    // Создаем цветовую шкалу
    const color = d3.scaleOrdinal()
      .domain(pieData.map(d => d.name))
      .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), pieData.length));
      
    // Создаем пирог
    const pie = d3.pie()
      .value(d => d.value)
      .sort(null);
      
    const data_ready = pie(pieData);
    
    // Создаем дуги
    const arc = d3.arc()
      .innerRadius(radius * 0.4)
      .outerRadius(radius);
      
    const arcHover = d3.arc()
      .innerRadius(radius * 0.4)
      .outerRadius(radius * 1.07);
      
    // Создаем градиенты
    const defs = svg.append('defs');
    
    pieData.forEach((d, i) => {
      const gradientId = `pieGradient-${i}`;
      const baseColor = color(d.name);
      
      const gradient = defs.append('radialGradient')
        .attr('id', gradientId)
        .attr('cx', '50%')
        .attr('cy', '50%')
        .attr('r', '50%');
        
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', d3.rgb(baseColor).brighter(0.5))
        .attr('stop-opacity', 1);
        
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', baseColor)
        .attr('stop-opacity', 1);
    });
    
    // Центральный текст для общей информации
    const centerTotal = svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-1em')
      .style('font-size', '14px')
      .style('fill', '#d1d5db')
      .text('Всего автомобилей');
      
    const centerValue = svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.7em')
      .style('font-size', '20px')
      .style('font-weight', 'bold')
      .style('fill', '#ffffff')
      .text(d3.sum(pieData, d => d.value));
      
    // Добавляем дуги с интерактивностью
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
          
        // Обновляем центральный текст
        centerTotal.text(d.data.name);
        centerValue.text(d.data.value);
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arc);
          
        // Сбрасываем центральный текст
        centerTotal.text('Всего автомобилей');
        centerValue.text(d3.sum(pieData, d => d.value));
      })
      .transition()
      .duration(800)
      .attrTween('d', function(d) {
        const interpolate = d3.interpolate({startAngle: d.startAngle, endAngle: d.startAngle}, d);
        return function(t) {
          return arc(interpolate(t));
        };
      });
  };
  
  // Рендер сравнительного графика по складам
  const renderWarehouseComparison = () => {
    if (!warehouseComparisonRef.current) return;
    
    const container = warehouseComparisonRef.current;
    container.innerHTML = '';
    
    const margin = { top: 30, right: 30, bottom: 70, left: 60 };
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
      .style('fill', '#f3f4f6')
      .text('Сравнение складов по количеству автомобилей');
      
    // Создаем данные для стековой диаграммы
    const stackData = warehouseData.map(wh => ({
      name: wh.name,
      healthy: wh.totalCars - wh.defectiveCars,
      defective: wh.defectiveCars
    }));
    
    // Создаем шкалы
    const x = d3.scaleBand()
      .domain(stackData.map(d => d.name))
      .range([0, width])
      .padding(0.3);
      
    const y = d3.scaleLinear()
      .domain([0, d3.max(stackData, d => d.healthy + d.defective) * 1.1])
      .range([height, 0]);
      
    // Добавляем оси
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#d1d5db')
      .attr('transform', 'rotate(-20)')
      .attr('text-anchor', 'end');
      
    svg.append('g')
      .call(d3.axisLeft(y).ticks(5))
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
      
    // Создаем градиенты
    const defs = svg.append('defs');
    
    // Градиент для исправных
    const healthyGradient = defs.append('linearGradient')
      .attr('id', 'healthyGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
      
    healthyGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#10b981')
      .attr('stop-opacity', 0.8);
      
    healthyGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#10b981')
      .attr('stop-opacity', 0.5);
      
    // Градиент для бракованных
    const brokenGradient = defs.append('linearGradient')
      .attr('id', 'brokenGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
      
    brokenGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#ef4444')
      .attr('stop-opacity', 0.8);
      
    brokenGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#ef4444')
      .attr('stop-opacity', 0.5);
      
    // Добавляем столбцы для исправных автомобилей
    svg.selectAll('.healthy-bar')
      .data(stackData)
      .join('rect')
      .attr('class', 'healthy-bar')
      .attr('x', d => x(d.name))
      .attr('width', x.bandwidth())
      .attr('fill', 'url(#healthyGradient)')
      .attr('rx', 4)
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        const warehouseId = warehouseData.find(wh => wh.name === d.name)?.id;
        if (warehouseId) setSelectedWarehouse(warehouseId);
      })
      .attr('y', height)
      .attr('height', 0)
      .transition()
      .duration(800)
      .attr('y', d => y(d.healthy))
      .attr('height', d => height - y(d.healthy));
      
    // Добавляем столбцы для бракованных автомобилей
    svg.selectAll('.defective-bar')
      .data(stackData)
      .join('rect')
      .attr('class', 'defective-bar')
      .attr('x', d => x(d.name))
      .attr('width', x.bandwidth())
      .attr('fill', 'url(#brokenGradient)')
      .attr('rx', 4)
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        const warehouseId = warehouseData.find(wh => wh.name === d.name)?.id;
        if (warehouseId) setSelectedWarehouse(warehouseId);
      })
      .attr('y', d => y(d.healthy + d.defective))
      .attr('height', 0)
      .transition()
      .duration(800)
      .delay(800)
      .attr('y', d => y(d.healthy + d.defective))
      .attr('height', d => height - y(d.defective));
      
    // Добавляем подписи для общего количества
    svg.selectAll('.total-label')
      .data(stackData)
      .join('text')
      .attr('class', 'total-label')
      .attr('x', d => x(d.name) + x.bandwidth() / 2)
      .attr('y', d => y(d.healthy + d.defective) - 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#ffffff')
      .style('opacity', 0)
      .text(d => d.healthy + d.defective)
      .transition()
      .duration(500)
      .delay(1600)
      .style('opacity', 1);
      
    // Добавляем легенду
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 180}, ${height - 60})`);
      
    legend.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', '#10b981')
      .attr('rx', 2);
      
    legend.append('text')
      .attr('x', 20)
      .attr('y', 12)
      .style('font-size', '12px')
      .style('fill', '#d1d5db')
      .text('Исправные');
      
    legend.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', '#ef4444')
      .attr('rx', 2)
      .attr('transform', 'translate(0, 20)');
      
    legend.append('text')
      .attr('x', 20)
      .attr('y', 32)
      .style('font-size', '12px')
      .style('fill', '#d1d5db')
      .text('Бракованные');
      
    // Выделяем выбранный склад
    if (selectedWarehouse !== 'all') {
      const selectedData = warehouseData.find(d => d.id === selectedWarehouse);
      if (selectedData) {
        svg.append('rect')
          .attr('x', x(selectedData.name) - 4)
          .attr('y', y(selectedData.totalCars) - 15)
          .attr('width', x.bandwidth() + 8)
          .attr('height', height - y(selectedData.totalCars) + 20)
          .attr('rx', 6)
          .attr('fill', 'none')
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '5,5')
          .style('pointer-events', 'none');
      }
    }
  };
  
  // Обработчик клика по модели автомобиля
  const handleModelClick = (model) => {
    // Здесь можно добавить дополнительную логику для отображения деталей модели
    console.log(`Выбрана модель: ${model.name}`);
    
    // Показываем модальное окно или переключаем вид
    const modelDetails = document.getElementById('modelDetails');
    if (modelDetails) {
      document.getElementById('modelName').textContent = model.name;
      document.getElementById('modelStock').textContent = model.stock;
      document.getElementById('modelDefective').textContent = model.defective;
      document.getElementById('modelTotal').textContent = model.stock + model.defective;
      document.getElementById('modelDefectivePercent').textContent = 
        `${((model.defective / (model.stock + model.defective)) * 100).toFixed(1)}%`;
      
      modelDetails.classList.remove('hidden');
    }
  };
  
  // Закрытие модального окна
  const closeModelDetails = () => {
    const modelDetails = document.getElementById('modelDetails');
    if (modelDetails) {
      modelDetails.classList.add('hidden');
    }
  };
  
  // Получение статистики для выбранного склада
  const warehouseInfo = getWarehouseInfo(selectedWarehouse);

  return (
    <div className="p-4 md:p-6 bg-gray-900 text-gray-100 min-h-screen">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Аналитика автомобильного склада</h1>
          <p className="text-gray-400 mt-1">Мониторинг уровней инвентаря и анализ брака</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center">
            <span className="text-gray-400 mr-2 text-sm">Склад:</span>
            <select 
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
            >
              {warehouses.map(warehouse => (
                <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center">
            <span className="text-gray-400 mr-2 text-sm">Категория:</span>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center">
            <span className="text-gray-400 mr-2 text-sm">Месяц:</span>
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
            >
              <option>Январь</option>
              <option>Февраль</option>
              <option>Март</option>
              <option>Апрель</option>
              <option>Май</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg flex items-center">
          <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <div className="text-sm text-gray-400">Всего автомобилей</div>
            <div className="text-2xl font-bold">{warehouseInfo.totalCars}</div>
            <div className="text-xs text-blue-400">По всем моделям</div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg flex items-center">
          <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-sm text-gray-400">Исправные автомобили</div>
            <div className="text-2xl font-bold">{warehouseInfo.totalCars - warehouseInfo.defectiveCars}</div>
            <div className="text-xs text-green-400">Готовы к продаже</div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg flex items-center">
          <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <div className="text-sm text-gray-400">Бракованные автомобили</div>
            <div className="text-2xl font-bold">{warehouseInfo.defectiveCars}</div>
            <div className="text-xs text-red-400">{warehouseInfo.defectivePercentage}% от общего количества</div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
  <div className="flex justify-between mb-2">
    <h2 className="text-lg font-semibold">Остаток автомобилей на складе</h2>
    <div className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">
      Обновлено сегодня
    </div>
  </div>
  <div className="text-sm text-gray-400 mb-2">
    Нажмите на модель, чтобы увидеть подробную информацию
  </div>
  
  <div className="flex gap-2 mb-3">
    <div className="flex items-center text-xs bg-gray-700 px-2 py-1 rounded">
      <div className="w-3 h-3 bg-blue-500 rounded-sm mr-1"></div>
      <span>Исправные</span>
    </div>
    <div className="flex items-center text-xs bg-gray-700 px-2 py-1 rounded">
      <div className="w-3 h-3 bg-red-500 rounded-sm mr-1"></div>
      <span>Бракованные</span>
    </div>
  </div>
  
  <div ref={inventoryChartRef} className="w-full h-[300px]"></div>
</div>
        
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
          <div className="flex justify-between mb-2">
            <h2 className="text-lg font-semibold">Брак по складам</h2>
            <div className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded-full">
              Важно
            </div>
          </div>
          <div className="text-sm text-gray-400 mb-4">
            Процент бракованных автомобилей по каждому складу
          </div>
          <div ref={defectiveChartRef} className="w-full h-[300px]"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
          <div className="flex justify-between mb-2">
            <h2 className="text-lg font-semibold">Распределение по моделям</h2>
            <button className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div ref={modelDistributionRef} className="w-full h-[300px]"></div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
          <div className="flex justify-between mb-2">
            <h2 className="text-lg font-semibold">Сравнение складов</h2>
            <div className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">
              Нажмите для выбора
            </div>
          </div>
          <div className="text-sm text-gray-400 mb-4">
            Сравнение количества исправных и бракованных автомобилей по складам
          </div>
          <div ref={warehouseComparisonRef} className="w-full h-[300px]"></div>
        </div>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-4 shadow-lg mb-6">
        <div className="flex justify-between mb-4">
          <h2 className="text-lg font-semibold">Управление складом и статус уровня автомобилей</h2>
          <div className="flex space-x-2">
            <button className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
              Экспорт
            </button>
            <button className="text-xs px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors">
              Обновить
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 text-gray-400 text-left">
                <th className="p-3 rounded-l-lg">Модель</th>
                <th className="p-3">Категория</th>
                <th className="p-3">Исправные</th>
                <th className="p-3">Брак</th>
                <th className="p-3">Всего</th>
                <th className="p-3">% брака</th>
                <th className="p-3 rounded-r-lg">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {modelData.map(model => (
                <tr key={model.id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="p-3 font-medium">{model.name}</td>
                  <td className="p-3">{categories.find(c => c.id === model.category)?.name || model.category}</td>
                  <td className="p-3">{model.stock}</td>
                  <td className="p-3">{model.defective}</td>
                  <td className="p-3">{model.stock + model.defective}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      (model.defective / (model.stock + model.defective) * 100) > 8 
                        ? 'bg-red-500/20 text-red-400' 
                        : (model.defective / (model.stock + model.defective) * 100) > 5
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-green-500/20 text-green-400'
                    }`}>
                      {((model.defective / (model.stock + model.defective)) * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="p-3">
                    <button 
                      className="text-blue-400 hover:text-blue-300 transition-colors mr-2"
                      onClick={() => handleModelClick(model)}
                    >
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
      
      {/* Модальное окно с деталями модели */}
      <div id="modelDetails" className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 hidden">
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold" id="modelName">Название модели</h3>
            <button 
              onClick={closeModelDetails}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-sm text-gray-400">Исправные</div>
              <div className="text-xl font-bold text-green-400" id="modelStock">0</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-sm text-gray-400">Брак</div>
              <div className="text-xl font-bold text-red-400" id="modelDefective">0</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-sm text-gray-400">Всего</div>
              <div className="text-xl font-bold" id="modelTotal">0</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-sm text-gray-400">% брака</div>
              <div className="text-xl font-bold text-yellow-400" id="modelDefectivePercent">0%</div>
            </div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-3 mb-4">
            <h4 className="font-medium mb-2">Распределение по складам</h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Ташкент</span>
                <span>24 шт.</span>
              </div>
              <div className="flex justify-between">
                <span>Самарканд</span>
                <span>18 шт.</span>
              </div>
              <div className="flex justify-between">
                <span>Бухара</span>
                <span>15 шт.</span>
              </div>
              <div className="flex justify-between">
                <span>Андижан</span>
                <span>12 шт.</span>
              </div>
              <div className="flex justify-between">
                <span>Фергана</span>
                <span>9 шт.</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              onClick={closeModelDetails}
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarWarehouseAnalytics;