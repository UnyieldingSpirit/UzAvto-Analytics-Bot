'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import { carModels, regions, warehouses } from '../mocks/mock-data';

const WarehouseAnalytics = () => {
 // Refs для графиков
 const salesChartRef = useRef(null);
 const warehouseDistributionRef = useRef(null); // Изменено с regionDistributionRef
 const manufacturerChartRef = useRef(null);
 const modelInventoryChartRef = useRef(null);
 const detailsChartRef = useRef(null);
 const colorDistributionRef = useRef(null);
 const warehouseOccupancyRef = useRef(null); // Новый ref для графика занятости складов
 
 // Состояния
 const [selectedMonth, setSelectedMonth] = useState('Апрель');
 const [selectedView, setSelectedView] = useState('общий');
 const [selectedCarModel, setSelectedCarModel] = useState(null);
 const [selectedWarehouse, setSelectedWarehouse] = useState(null); // Изменено с selectedRegion
 
 // Расширяем данные моделей из mock-data
 const enhancedCarModels = carModels.map(model => {
   // Добавляем данные о количестве авто
   const totalCount = Math.floor(Math.random() * 200) + 100;
   const defective = Math.floor(totalCount * (Math.random() * 0.05 + 0.01));
   const goodCondition = totalCount - defective;
   const defectRate = parseFloat((defective / totalCount * 100).toFixed(1));
   
   // Распределение по регионам
   const regionsData = regions.map(region => ({
     name: region.name,
     count: Math.floor(Math.random() * 50) + 10
   }));
   
   // Добавляем распределение по складам
   const warehousesData = warehouses.map(warehouse => ({
     id: warehouse.id,
     name: warehouse.name,
     count: Math.floor(Math.random() * 50) + 10
   }));
   
   // Распределение по цветам
   const colors = [
     { name: 'Белый', count: Math.floor(Math.random() * 50) + 20, hex: '#ffffff' },
     { name: 'Черный', count: Math.floor(Math.random() * 40) + 15, hex: '#000000' },
     { name: 'Серебристый', count: Math.floor(Math.random() * 30) + 15, hex: '#C0C0C0' },
     { name: 'Синий', count: Math.floor(Math.random() * 20) + 10, hex: '#0000FF' },
     { name: 'Красный', count: Math.floor(Math.random() * 20) + 10, hex: '#FF0000' }
   ];
   
   // История по месяцам
   const history = [
     { month: 'Янв', stock: Math.floor(totalCount * 0.85), defective: Math.floor(defective * 0.8) },
     { month: 'Фев', stock: Math.floor(totalCount * 0.9), defective: Math.floor(defective * 0.9) },
     { month: 'Мар', stock: Math.floor(totalCount * 0.95), defective: Math.floor(defective * 0.95) },
     { month: 'Апр', stock: totalCount, defective }
   ];
   
   // Комплектации
   const variants = [
     { name: 'Базовая', count: Math.floor(totalCount * (Math.random() * 0.3 + 0.4)) },
     { name: 'Комфорт', count: Math.floor(totalCount * (Math.random() * 0.2 + 0.3)) },
     { name: 'Люкс', count: Math.floor(totalCount * (Math.random() * 0.15 + 0.1)) }
   ];
   
   return {
     ...model,
     totalCount,
     goodCondition,
     defective,
     defectRate,
     price: Math.floor(Math.random() * 20000) + 10000,
     regions: regionsData,
     warehouses: warehousesData, // Добавляем данные о складах
     colors,
     history,
     variants
   };
 });
 
 // Расширяем данные о складах (вместо регионов)
 const enhancedWarehouses = warehouses.map(warehouse => {
   // Подсчитываем остатки по всем моделям на этом складе
   const modelCounts = enhancedCarModels.map(model => {
     const warehouseData = model.warehouses.find(w => w.id === warehouse.id);
     return {
       id: model.id,
       name: model.name,
       count: warehouseData ? warehouseData.count : 0,
       category: model.category
     };
   });
   
   const totalCount = modelCounts.reduce((sum, model) => sum + model.count, 0);
   const defective = Math.floor(totalCount * (Math.random() * 0.04 + 0.02));
   const goodCondition = totalCount - defective;
   const defectRate = parseFloat((defective / totalCount * 100).toFixed(1));
   
   // История по месяцам
   const history = [
     { month: 'Янв', stock: Math.floor(totalCount * 0.85), defective: Math.floor(defective * 0.8) },
     { month: 'Фев', stock: Math.floor(totalCount * 0.9), defective: Math.floor(defective * 0.9) },
     { month: 'Мар', stock: Math.floor(totalCount * 0.95), defective: Math.floor(defective * 0.95) },
     { month: 'Апр', stock: totalCount, defective }
   ];
   
   // Группировка по категориям
   const categoryCounts = modelCounts.reduce((acc, model) => {
     if (!acc[model.category]) {
       acc[model.category] = 0;
     }
     acc[model.category] += model.count;
     return acc;
   }, {});
   
   // Преобразуем в массив для графиков
   const categories = Object.keys(categoryCounts).map(key => ({
     name: key === 'suv' ? 'Внедорожники' : 
           key === 'sedan' ? 'Седаны' : 
           key === 'minivan' ? 'Минивэны' : key,
     count: categoryCounts[key]
   }));
   
   // Статус заполненности склада
   const occupancyRate = Math.round((totalCount / warehouse.capacity) * 100);
   const availableSpace = warehouse.capacity - totalCount;
   
   // Каналы продаж
   const salesChannels = [
     { name: 'Дилерские центры', percentage: Math.floor(Math.random() * 20) + 50 },
     { name: 'Онлайн-продажи', percentage: Math.floor(Math.random() * 10) + 10 },
     { name: 'Выставки', percentage: Math.floor(Math.random() * 10) + 10 },
     { name: 'Корпоративные клиенты', percentage: Math.floor(Math.random() * 10) + 5 }
   ];
   
   // Корректируем проценты, чтобы сумма была 100%
   const totalPercentage = salesChannels.reduce((sum, channel) => sum + channel.percentage, 0);
   salesChannels.forEach(channel => {
     channel.percentage = Math.round(channel.percentage / totalPercentage * 100);
   });
   
   return {
     ...warehouse,
     totalCount,
     goodCondition,
     defective,
     defectRate,
     models: modelCounts,
     history,
     categories,
     occupancyRate,
     availableSpace,
     salesChannels,
     status: occupancyRate > 90 ? 'критический' : 
             occupancyRate > 75 ? 'высокий' : 
             occupancyRate > 50 ? 'средний' : 'низкий'
   };
 });

 // Обработчик клика по модели
 const handleCarModelClick = (model) => {
   if (selectedCarModel && selectedCarModel.id === model.id) {
     setSelectedCarModel(null);
   } else {
     const selectedModelData = enhancedCarModels.find(m => m.id === model.id || m.name === model);
     setSelectedCarModel(selectedModelData);
     setSelectedWarehouse(null); // Снимаем выбор склада при выборе модели
   }
 };

 // Обработчик клика по складу (вместо региона)
 const handleWarehouseClick = (warehouse) => {
   if (selectedWarehouse && selectedWarehouse.id === warehouse.id) {
     setSelectedWarehouse(null);
   } else {
     const selectedWarehouseData = enhancedWarehouses.find(w => w.id === warehouse.id || w.name === warehouse);
     setSelectedWarehouse(selectedWarehouseData);
     setSelectedCarModel(null); // Снимаем выбор модели при выборе склада
   }
 };

 useEffect(() => {
   renderSalesChart();
   renderWarehouseDistribution(); // Новый метод вместо renderRegionDistribution
   renderManufacturerChart();
   renderModelInventoryChart();
   
   if (selectedCarModel && detailsChartRef.current) {
     renderModelDetailsChart(selectedCarModel);
   }
   
   if (selectedCarModel && colorDistributionRef.current) {
     renderColorDistributionChart(selectedCarModel);
   }
   
   if (selectedWarehouse && detailsChartRef.current) {
     renderWarehouseDetailsChart(selectedWarehouse); // Новый метод
   }
   
   if (selectedWarehouse && warehouseOccupancyRef.current) {
     renderWarehouseOccupancyChart(selectedWarehouse); // Новый метод
   }
   
   const handleResize = () => {
     renderSalesChart();
     renderWarehouseDistribution();
     renderManufacturerChart();
     renderModelInventoryChart();
     
     if (selectedCarModel && detailsChartRef.current) {
       renderModelDetailsChart(selectedCarModel);
     }
     
     if (selectedCarModel && colorDistributionRef.current) {
       renderColorDistributionChart(selectedCarModel);
     }
     
     if (selectedWarehouse && detailsChartRef.current) {
       renderWarehouseDetailsChart(selectedWarehouse);
     }
     
     if (selectedWarehouse && warehouseOccupancyRef.current) {
       renderWarehouseOccupancyChart(selectedWarehouse);
     }
   };
   
   window.addEventListener('resize', handleResize);
   return () => window.removeEventListener('resize', handleResize);
 }, [selectedMonth, selectedView, selectedCarModel, selectedWarehouse]);

 // Рендер диаграммы каналов продаж (без изменений)
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
  
  // Данные для диаграммы каналов продаж - ПЕРЕМЕСТИТЕ ЭТО ОБЪЯВЛЕНИЕ СЮДА
  const salesChannelData = [
    { source: 'Дилерские центры', value: 68.3, color: '#3b82f6' },
    { source: 'Онлайн-продажи', value: 15.6, color: '#ef4444' },
    { source: 'Выставки', value: 10.2, color: '#f59e0b' },
    { source: 'Корпоративные клиенты', value: 5.9, color: '#22c55e' }
  ];
    
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
 
 // Рендер диаграммы распределения по складам (вместо регионов)
 const renderWarehouseDistribution = () => {
   if (!warehouseDistributionRef.current) return;
   
   const container = warehouseDistributionRef.current;
   container.innerHTML = '';
   
   const margin = { top: 30, right: 20, bottom: 40, left: 160 }; // Увеличиваем левый отступ для названий складов
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
     .text('Распределение автомобилей по складам');
     
   // Получаем данные для графика из расширенных складов
   const warehouseData = enhancedWarehouses.map(warehouse => ({
     name: warehouse.name,
     sedans: Math.round(warehouse.totalCount * 0.4),
     suvs: Math.round(warehouse.totalCount * 0.5),
     minivans: Math.round(warehouse.totalCount * 0.1)
   }));
   
   // Создаем шкалы
   const x = d3.scaleLinear()
     .domain([0, d3.max(enhancedWarehouses, d => d.capacity)])
     .range([0, width]);
     
   const y = d3.scaleBand()
     .domain(warehouseData.map(d => d.name))
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
       const warehouse = enhancedWarehouses.find(w => w.name === d);
       handleWarehouseClick(warehouse);
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
     .keys(['minivans', 'sedans', 'suvs'])
     .order(d3.stackOrderNone)
     .offset(d3.stackOffsetNone);
     
   const stackedData = stack(warehouseData);
   
   const colorScale = d3.scaleOrdinal()
     .domain(['suvs', 'sedans', 'minivans'])
     .range(['#3b82f6', '#ef4444', '#f59e0b']);
     
   // Создаем градиенты
   const defs = svg.append('defs');
   
   ['suvs', 'sedans', 'minivans'].forEach((key, i) => {
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
     .transition()
     .duration(800)
     .delay((d, i) => i * 100)
     .attr('width', d => x(d[1]) - x(d[0]));
     
   // Добавляем заполненность склада (линию емкости)
   svg.selectAll('.capacity-line')
     .data(enhancedWarehouses)
     .join('line')
     .attr('class', 'capacity-line')
     .attr('x1', d => x(d.capacity))
     .attr('y1', d => y(d.name))
     .attr('x2', d => x(d.capacity))
     .attr('y2', d => y(d.name) + y.bandwidth())
     .attr('stroke', '#f97316') // Оранжевая линия для максимальной емкости
     .attr('stroke-width', 2)
     .attr('stroke-dasharray', '5,3')
     .style('opacity', 0)
     .transition()
     .duration(500)
     .delay(1000)
     .style('opacity', 1);
     
   // Добавляем легенду
   const legend = svg.append('g')
     .attr('transform', `translate(${width - 140}, ${height - 80})`);
     
   const legendData = [
     { key: 'suvs', label: 'Внедорожники' },
     { key: 'sedans', label: 'Седаны' },
     { key: 'minivans', label: 'Минивэны' }
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
   
   // Добавляем метку для линии емкости
   legend.append('g')
     .attr('transform', `translate(0, ${legendData.length * 20})`);
   
   legend.append('line')
     .attr('x1', 0)
     .attr('y1', legendData.length * 20 + 7.5)
     .attr('x2', 15)
     .attr('y2', legendData.length * 20 + 7.5)
     .attr('stroke', '#f97316')
     .attr('stroke-width', 2)
     .attr('stroke-dasharray', '5,3');
     
   legend.append('text')
     .attr('x', 20)
     .attr('y', legendData.length * 20 + 12)
     .style('font-size', '12px')
     .style('fill', '#d1d5db')
     .text('Макс. емкость');
 };
 
 // Рендер круговой диаграммы производителей (без изменений)
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
     
   // Данные для диаграммы производителей
   const manufacturerData = [
     { manufacturer: 'Chevrolet', percentage: 42, color: '#3b82f6' },
     { manufacturer: 'Ravon', percentage: 18, color: '#ef4444' },
     { manufacturer: 'Kia', percentage: 12, color: '#f59e0b' },
     { manufacturer: 'Toyota', percentage: 10, color: '#06b6d4' },
     { manufacturer: 'Hyundai', percentage: 8, color: '#22c55e' },
     { manufacturer: 'Другие', percentage: 10, color: '#8b5cf6' }
   ];
     
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
 
 // Рендер графика инвентаря моделей (без изменений)
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
     
   // Данные для графика из расширенных моделей
   const carModelInventory = enhancedCarModels.slice(0, 5).map(model => ({
     model: model.name,
     stock: Math.round((model.goodCondition / model.totalCount) * 100),
     defective: Math.round((model.defective / model.totalCount) * 100)
   }));
   
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
       const model = enhancedCarModels.find(m => m.name === d);
       handleCarModelClick(model);
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
       const model = enhancedCarModels.find(m => m.name === d.model);
       handleCarModelClick(model);
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
       const model = enhancedCarModels.find(m => m.name === d.model);
       handleCarModelClick(model);
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

 // Функция для отрисовки графика детализации выбранной модели (без изменений)
 const renderModelDetailsChart = (model) => {
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
   const historyData = model.history;
   
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
     .text(`Динамика остатков: ${model.name}`);
     
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

 // Функция для отрисовки графика распределения по цветам для выбранной модели (без изменений)
 const renderColorDistributionChart = (model) => {
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
   const colorData = model.colors;
   
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
 
 // Метод для рендеринга деталей склада
 const renderWarehouseDetailsChart = (warehouse) => {
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
     
   // Получаем историю для выбранного склада
   const historyData = warehouse.history;
   
   // Создаем шкалы
   const x = d3.scaleBand()
     .domain(historyData.map(d => d.month))
     .range([0, width])
     .padding(0.3);
     
   const y = d3.scaleLinear()
     .domain([0, Math.max(d3.max(historyData, d => d.stock) * 1.1, warehouse.capacity * 1.05)])
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
     
   // Добавляем емкость склада (горизонтальная линия)
   const capacityLine = svg.append('line')
     .attr('x1', 0)
     .attr('y1', y(warehouse.capacity))
     .attr('x2', width)
     .attr('y2', y(warehouse.capacity))
     .attr('stroke', '#f97316')
     .attr('stroke-width', 2)
     .attr('stroke-dasharray', '5,3')
     .style('opacity', 0)
     .transition()
     .duration(500)
     .delay(1000)
     .style('opacity', 1);
     
   // Добавляем подпись к линии емкости
   svg.append('text')
     .attr('x', width - 5)
     .attr('y', y(warehouse.capacity) - 5)
     .attr('text-anchor', 'end')
     .style('font-size', '12px')
     .style('fill', '#f97316')
     .style('opacity', 0)
     .text(`Макс. емкость: ${warehouse.capacity}`)
     .transition()
     .duration(500)
     .delay(1200)
     .style('opacity', 1);
     
   // Создаем градиент для столбцов
   const defs = svg.append('defs');
   const barGradient = defs.append('linearGradient')
     .attr('id', 'warehouseBarGradient')
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
   svg.selectAll('.warehouse-bar')
     .data(historyData)
     .join('rect')
     .attr('class', 'warehouse-bar')
     .attr('x', d => x(d.month))
     .attr('width', x.bandwidth())
     .attr('y', height)
     .attr('height', 0)
     .attr('rx', 4)
     .attr('fill', 'url(#warehouseBarGradient)')
     .transition()
     .duration(800)
     .delay((d, i) => i * 100)
     .attr('y', d => y(d.stock))
     .attr('height', d => height - y(d.stock));
     
   // Добавляем метки значений
   svg.selectAll('.warehouse-label')
     .data(historyData)
     .join('text')
     .attr('class', 'warehouse-label')
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
   svg.selectAll('.warehouse-dot')
     .data(historyData)
     .join('circle')
     .attr('class', 'warehouse-dot')
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
   svg.selectAll('.warehouse-defect-label')
     .data(historyData)
     .join('text')
     .attr('class', 'warehouse-defect-label')
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
     .text(`Динамика наполнения склада: ${warehouse.name}`);
     
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
 
 // Новый метод для рендеринга графика заполненности склада
 const renderWarehouseOccupancyChart = (warehouse) => {
   if (!warehouseOccupancyRef.current) return;
   
   const container = warehouseOccupancyRef.current;
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
     
   // Данные о заполненности склада
   const data = [
     { name: 'Занято', value: warehouse.occupied, color: '#3b82f6' },
     { name: 'Свободно', value: warehouse.capacity - warehouse.occupied, color: '#94a3b8' }
   ];
   
   // Создаем пирог
   const pie = d3.pie()
     .value(d => d.value)
     .sort(null);
     
   const data_ready = pie(data);
   
   // Создаем дуги
   const arc = d3.arc()
     .innerRadius(radius * 0.7) // Делаем кольцевую диаграмму
     .outerRadius(radius);
     
   const arcHover = d3.arc()
     .innerRadius(radius * 0.68)
     .outerRadius(radius * 1.05);
     
   // Создаем градиенты
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
   
   // Добавляем дуги с градиентами
   svg.selectAll('path')
     .data(data_ready)
     .join('path')
     .attr('d', arc)
     .attr('fill', (d, i) => `url(#pieGradient-occupancy-${i})`)
     .attr('stroke', '#1f2937')
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
       
       // Обновляем центральный текст
       centerLabel.text(d.data.name);
       centerValue.text(`${d.data.value} (${percent}%)`);
     })
     .on('mouseout', function() {
       d3.select(this)
         .transition()
         .duration(200)
         .attr('d', arc);
         
       // Сбрасываем центральный текст
       centerLabel.text('Заполненность');
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
     
   // Центральный текст
   const centerLabel = svg.append('text')
     .attr('text-anchor', 'middle')
     .attr('dy', '-0.5em')
     .style('font-size', '16px')
     .style('fill', '#d1d5db')
     .text('Заполненность');
     
   const centerValue = svg.append('text')
     .attr('text-anchor', 'middle')
     .attr('dy', '1em')
     .style('font-size', '24px')
     .style('font-weight', 'bold')
     .style('fill', '#ffffff')
     .text(`${warehouse.occupancyRate}%`);
     
   // Статус заполненности склада с цветовой индикацией
   const statusColors = {
     'критический': '#ef4444',
     'высокий': '#f97316',
     'средний': '#facc15',
     'низкий': '#22c55e'
   };
   
   svg.append('text')
     .attr('text-anchor', 'middle')
     .attr('dy', '3em')
     .style('font-size', '12px')
     .style('fill', statusColors[warehouse.status] || '#d1d5db')
     .text(`Статус: ${warehouse.status}`);
     
   // Добавляем легенду
   const legend = svg.append('g')
     .attr('transform', `translate(${-radius * 0.9}, ${radius * 0.5})`);
     
  //  data.forEach((d, i) => {
  //    const legendRow = legend.append('g')
  //      .attr('transform', `translate(0, ${i * 25})`);
       
  //    legendRow.append('rect')
  //      .attr('width', 15)
  //      .attr('height', 15)
  //      .attr('rx', 2)
  //      .attr('fill', d.color);
       
  //    legendRow.append('text')
  //      .attr('x', 25)
  //      .attr('y', 12)
  //      .style('font-size', '12px')
  //      .style('fill', '#d1d5db')
  //      .text(`${d.name} (${d.value})`);
  //  });
 };

 return (
   <div className="p-4 md:p-6 bg-gray-900 text-gray-100 min-h-screen">
     {/* Верхняя панель с фильтрами */}
     <div className="mb-6 bg-gray-800 p-4 rounded-lg shadow-md">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
         <div>
           <h1 className="text-2xl font-bold text-white">Аналитика автосклада</h1>
           <p className="text-gray-400 mt-1">Мониторинг остатков автомобилей</p>
         </div>
         
         <div className="flex flex-wrap mt-4 md:mt-0 gap-3">
           <select 
             value={selectedMonth}
             onChange={(e) => setSelectedMonth(e.target.value)}
             className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm"
           >
             <option>Январь</option>
             <option>Февраль</option>
             <option>Март</option>
             <option>Апрель</option>
           </select>
           
           <select 
             value={selectedView}
             onChange={(e) => setSelectedView(e.target.value)}
             className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm"
           >
             <option value="общий">Общий вид</option>
             <option value="модель">По моделям</option>
             <option value="склад">По складам</option>
           </select>
         </div>
       </div>
       
       {/* Фильтры по складам вместо регионов */}
       <div className="mt-4 flex flex-wrap gap-2">
         <button
           className={`px-3 py-1 rounded-full text-sm font-medium ${
             selectedWarehouse === null 
               ? 'bg-blue-600 text-white' 
               : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
           }`}
           onClick={() => setSelectedWarehouse(null)}
         >
           Все склады
         </button>
         {enhancedWarehouses.map(warehouse => (
           <button
             key={warehouse.id}
             className={`px-3 py-1 rounded-full text-sm font-medium ${
               selectedWarehouse?.id === warehouse.id 
                 ? 'bg-blue-600 text-white' 
                 : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
             }`}
             onClick={() => handleWarehouseClick(warehouse)}
           >
             {warehouse.name}
           </button>
         ))}
       </div>
     </div>
     
     {/* Ключевые метрики */}
     <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
       <div className="bg-gray-800 p-4 rounded-lg shadow-md">
         <div className="flex items-center">
           <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mr-3">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
             </svg>
           </div>
           <div>
             <div className="text-sm text-gray-400">Всего автомобилей</div>
             <div className="text-xl font-bold">{enhancedWarehouses.reduce((sum, warehouse) => sum + warehouse.totalCount, 0)}</div>
           </div>
         </div>
       </div>
       
       <div className="bg-gray-800 p-4 rounded-lg shadow-md">
         <div className="flex items-center">
           <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mr-3">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
             </svg>
           </div>
           <div>
             <div className="text-sm text-gray-400">Всего складов</div>
             <div className="text-xl font-bold">{enhancedWarehouses.length}</div>
           </div>
         </div>
       </div>
       
       <div className="bg-gray-800 p-4 rounded-lg shadow-md">
         <div className="flex items-center">
           <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center mr-3">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
           </div>
           <div>
             <div className="text-sm text-gray-400">Исправные авто</div>
             <div className="text-xl font-bold">{enhancedWarehouses.reduce((sum, warehouse) => sum + warehouse.goodCondition, 0)}</div>
           </div>
         </div>
       </div>
       
       <div className="bg-gray-800 p-4 rounded-lg shadow-md">
         <div className="flex items-center">
           <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center mr-3">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
             </svg>
           </div>
           <div>
             <div className="text-sm text-gray-400">Брак</div>
             <div className="flex items-baseline">
               <span className="text-xl font-bold mr-2">{enhancedWarehouses.reduce((sum, warehouse) => sum + warehouse.defective, 0)}</span>
               <span className="text-xs text-red-400">{(enhancedWarehouses.reduce((sum, warehouse) => sum + warehouse.defective, 0) / enhancedWarehouses.reduce((sum, warehouse) => sum + warehouse.totalCount, 0) * 100).toFixed(1)}%</span>
             </div>
           </div>
         </div>
       </div>
     </div>
     
     {/* Основные графики */}
     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
       <div className="bg-gray-800 rounded-lg p-4 shadow-md">
         <div className="flex justify-between mb-2">
           <h2 className="text-lg font-medium">Каналы продаж</h2>
           <span className="text-sm bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">Статистика</span>
         </div>
         <div ref={salesChartRef} className="h-[300px]"></div>
       </div>
       
       <div className="bg-gray-800 rounded-lg p-4 shadow-md">
         <div className="flex justify-between mb-2">
           <h2 className="text-lg font-medium">Распределение автомобилей по складам</h2>
           <span className="text-sm bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">Интерактивно</span>
         </div>
         <div ref={warehouseDistributionRef} className="h-[300px]"></div>
       </div>
     </div>
     
     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
       <div className="bg-gray-800 rounded-lg p-4 shadow-md">
         <div className="flex justify-between mb-2">
           <h2 className="text-lg font-medium">Производители на рынке</h2>
           <span className="text-sm bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">Доли рынка</span>
         </div>
         <div ref={manufacturerChartRef} className="h-[300px]"></div>
       </div>
       
       <div className="bg-gray-800 rounded-lg p-4 shadow-md">
         <div className="flex justify-between mb-2">
           <h2 className="text-lg font-medium">Состояние автомобилей</h2>
           <span className="text-sm bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">Статистика</span>
         </div>
         <div ref={modelInventoryChartRef} className="h-[300px]"></div>
       </div>
     </div>
     
     {/* Таблица складов вместо регионов */}
     <div className="bg-gray-800 rounded-lg p-4 shadow-md mb-6">
       <div className="flex justify-between mb-4">
         <div>
           <h2 className="text-lg font-medium">Список складов</h2>
           <p className="text-sm text-gray-400">Нажмите на склад для детальной информации</p>
         </div>
         <div className="flex space-x-2">
           <button className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
             Экспорт
           </button>
         </div>
       </div>
       
       <div className="overflow-x-auto">
         <table className="w-full text-sm">
           <thead>
             <tr className="bg-gray-900/60 text-gray-400 text-left">
               <th className="p-3 rounded-l-lg">Название склада</th>
               <th className="p-3">Адрес</th>
               <th className="p-3">Емкость</th>
               <th className="p-3">Заполнено</th>
               <th className="p-3">Исправные</th>
               <th className="p-3">Брак</th>
               <th className="p-3">Статус</th>
               <th className="p-3 rounded-r-lg">Действия</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-gray-700">
             {enhancedWarehouses.map(warehouse => (
               <motion.tr 
                 key={warehouse.id} 
                 className={`hover:bg-gray-700/30 transition-colors cursor-pointer ${
                   selectedWarehouse?.id === warehouse.id ? 'bg-blue-900/20' : ''
                 }`}
                 onClick={() => handleWarehouseClick(warehouse)}
                 whileHover={{ backgroundColor: 'rgba(55, 65, 81, 0.3)' }}
               >
                 <td className="p-3 font-medium">{warehouse.name}</td>
                 <td className="p-3 text-gray-300">{warehouse.address}</td>
                 <td className="p-3">{warehouse.capacity}</td>
                 <td className="p-3">
                   <div className="flex items-center">
                     <div className="w-24 bg-gray-700 rounded-full h-2.5 mr-2">
                       <div 
                         className={`h-2.5 rounded-full ${
                           warehouse.occupancyRate > 90 ? 'bg-red-500' : 
                           warehouse.occupancyRate > 75 ? 'bg-orange-500' : 
                           warehouse.occupancyRate > 50 ? 'bg-yellow-500' : 'bg-green-500'
                         }`}
                         style={{ width: `${warehouse.occupancyRate}%` }}
                       ></div>
                     </div>
                     <span>{warehouse.occupancyRate}%</span>
                   </div>
                 </td>
                 <td className="p-3">{warehouse.goodCondition}</td>
                 <td className="p-3">
                   <span className={`bg-${warehouse.defectRate > 5 ? 'red' : warehouse.defectRate > 3 ? 'yellow' : 'green'}-500/20 
                     text-${warehouse.defectRate > 5 ? 'red' : warehouse.defectRate > 3 ? 'yellow' : 'green'}-400 
                     px-2 py-1 rounded-full text-xs`}>
                     {warehouse.defective} ({warehouse.defectRate}%)
                   </span>
                 </td>
                 <td className="p-3">
                   <span className={`px-2 py-1 rounded-full text-xs ${
                     warehouse.status === 'критический' ? 'bg-red-500/20 text-red-400' :
                     warehouse.status === 'высокий' ? 'bg-orange-500/20 text-orange-400' :
                     warehouse.status === 'средний' ? 'bg-yellow-500/20 text-yellow-400' :
                     'bg-green-500/20 text-green-400'
                   }`}>
                     {warehouse.status}
                   </span>
                 </td>
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
     
     {/* Детальная информация о выбранной модели (без изменений) */}
     <AnimatePresence>
       {selectedCarModel && (
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: 20 }}
           transition={{ duration: 0.3 }}
           className="bg-gray-800 rounded-lg p-5 shadow-md mb-6 border border-blue-900/30"
         >
           <div className="flex justify-between items-start mb-5">
             <div className="flex items-center">
               <img 
                 src={selectedCarModel.img} 
                 alt={selectedCarModel.name} 
                 className="h-16 w-24 object-contain bg-gray-700 rounded mr-4" 
               />
               <div>
                 <h2 className="text-xl font-bold text-white">{selectedCarModel.name}</h2>
                 <p className="text-blue-400 text-sm">Детальная информация о модели</p>
                 <div className="flex items-center mt-1">
                   <span className="text-lg font-semibold text-white mr-2">${selectedCarModel.price.toLocaleString()}</span>
                   <span className="text-sm capitalize bg-gray-700 px-2 py-0.5 rounded">{selectedCarModel.category}</span>
                 </div>
               </div>
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
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
             {/* Краткая информация */}
             <div className="bg-gray-700/50 p-4 rounded-lg">
               <h3 className="text-white font-medium mb-3">Информация о модели</h3>
               <div className="grid grid-cols-2 gap-3">
                 <div className="bg-gray-800/70 p-3 rounded-lg">
                   <div className="text-gray-400 text-xs">Всего на складе</div>
                   <div className="text-white text-lg font-medium">{selectedCarModel.totalCount}</div>
                 </div>
                 <div className="bg-gray-800/70 p-3 rounded-lg">
                   <div className="text-gray-400 text-xs">Исправные</div>
                   <div className="text-white text-lg font-medium">{selectedCarModel.goodCondition}</div>
                 </div>
                 <div className="bg-gray-800/70 p-3 rounded-lg">
                   <div className="text-gray-400 text-xs">Брак</div>
                   <div className="text-white text-lg font-medium">{selectedCarModel.defective}</div>
                 </div>
                 <div className="bg-gray-800/70 p-3 rounded-lg">
                   <div className="text-gray-400 text-xs">Процент брака</div>
                   <div className="text-white text-lg font-medium">{selectedCarModel.defectRate}%</div>
                 </div>
               </div>
             </div>
             
             {/* История изменений - график */}
             <div className="bg-gray-700/50 p-4 rounded-lg md:col-span-2">
               <h3 className="text-white font-medium mb-3">Динамика остатков</h3>
               <div ref={detailsChartRef} className="h-[200px]"></div>
             </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
             {/* Распределение по цветам */}
             <div className="bg-gray-700/50 p-4 rounded-lg">
               <h3 className="text-white font-medium mb-3">Цвета автомобилей</h3>
               <div ref={colorDistributionRef} className="h-[200px]"></div>
             </div>
             
             {/* Распределение по складам вместо регионов */}
             <div className="bg-gray-700/50 p-4 rounded-lg">
               <h3 className="text-white font-medium mb-3">Распределение по складам</h3>
               <div className="space-y-3">
                 {selectedCarModel.warehouses.map(warehouse => (
                   <div key={warehouse.id} className="group cursor-pointer" onClick={() => handleWarehouseClick(warehouse.id)}>
                     <div className="flex justify-between mb-1">
                       <span className="text-gray-300">{warehouse.name}</span>
                       <span className="font-medium text-white">{warehouse.count} шт.</span>
                     </div>
                     <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-blue-500 group-hover:bg-blue-400 transition-all rounded-full"
                         style={{ width: `${(warehouse.count / selectedCarModel.totalCount) * 100}%` }}
                       ></div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           </div>
           
           {/* Комплектации */}
           <div className="bg-gray-700/50 p-4 rounded-lg mb-5">
             <h3 className="text-white font-medium mb-3">Комплектации</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
               {selectedCarModel.variants.map(variant => (
                 <div key={variant.name} className="bg-gray-800/70 p-3 rounded-lg">
                   <div className="flex justify-between mb-2">
                     <span className="text-white font-medium">{variant.name}</span>
                     <span className="text-sm text-gray-400">{variant.count} шт.</span>
                   </div>
                   <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                     <div 
                       className="h-full bg-purple-500 rounded-full"
                       style={{ width: `${(variant.count / selectedCarModel.totalCount) * 100}%` }}
                     ></div>
                   </div>
                   <div className="text-right text-xs text-gray-400 mt-1">
                     {((variant.count / selectedCarModel.totalCount) * 100).toFixed(1)}%
                   </div>
                 </div>
               ))}
             </div>
           </div>
           
           {/* Кнопки действий */}
           <div className="flex flex-wrap justify-end gap-3">
          <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
               </svg>
               Отчет
             </button>
             <button className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded text-sm">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
               </svg>
               Заказать
             </button>
           </div>
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
           className="bg-gray-800 rounded-lg p-5 shadow-md mb-6 border border-purple-900/30"
         >
           <div className="flex justify-between items-start mb-5">
             <div>
               <h2 className="text-xl font-bold text-white">{selectedWarehouse.name}</h2>
               <p className="text-purple-400 text-sm">Детальная информация о складе</p>
               <div className="flex items-center mt-1">
                 <span className="text-lg font-semibold text-white mr-2">{selectedWarehouse.totalCount} авто</span>
                 <span className={`text-sm px-2 py-0.5 rounded ${
                   selectedWarehouse.status === 'критический' ? 'bg-red-500/20 text-red-400' :
                   selectedWarehouse.status === 'высокий' ? 'bg-orange-500/20 text-orange-400' :
                   selectedWarehouse.status === 'средний' ? 'bg-yellow-500/20 text-yellow-400' :
                   'bg-green-500/20 text-green-400'
                 }`}>
                   Заполнение: {selectedWarehouse.occupancyRate}%
                 </span>
               </div>
               <p className="text-gray-400 text-sm mt-2">{selectedWarehouse.address}</p>
             </div>
             <button 
               onClick={() => setSelectedWarehouse(null)}
               className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700/50"
             >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
             {/* Краткая информация */}
             <div className="bg-gray-700/50 p-4 rounded-lg">
               <h3 className="text-white font-medium mb-3">Информация о складе</h3>
               <div className="grid grid-cols-2 gap-3">
                 <div className="bg-gray-800/70 p-3 rounded-lg">
                   <div className="text-gray-400 text-xs">Всего авто</div>
                   <div className="text-white text-lg font-medium">{selectedWarehouse.totalCount}</div>
                 </div>
                 <div className="bg-gray-800/70 p-3 rounded-lg">
                   <div className="text-gray-400 text-xs">Исправные</div>
                   <div className="text-white text-lg font-medium">{selectedWarehouse.goodCondition}</div>
                 </div>
                 <div className="bg-gray-800/70 p-3 rounded-lg">
                   <div className="text-gray-400 text-xs">Брак</div>
                   <div className="text-white text-lg font-medium">{selectedWarehouse.defective}</div>
                 </div>
                 <div className="bg-gray-800/70 p-3 rounded-lg">
                   <div className="text-gray-400 text-xs">Емкость</div>
                   <div className="text-white text-lg font-medium">{selectedWarehouse.capacity}</div>
                 </div>
               </div>
               <div className="mt-3 bg-gray-800/70 p-3 rounded-lg">
                 <div className="text-gray-400 text-xs mb-1">Контактная информация</div>
                 <div className="text-white">
                   <div className="flex items-center mt-1">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                     </svg>
                     <span className="text-sm">{selectedWarehouse.manager}</span>
                   </div>
                   <div className="flex items-center mt-1">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                     </svg>
                     <span className="text-sm">{selectedWarehouse.contact}</span>
                   </div>
                 </div>
               </div>
             </div>
             
             {/* График заполненности склада */}
             <div className="bg-gray-700/50 p-4 rounded-lg">
               <h3 className="text-white font-medium mb-3">Заполненность склада</h3>
               <div ref={warehouseOccupancyRef} className="h-[200px]"></div>
             </div>
             
             {/* История изменений - график */}
             <div className="bg-gray-700/50 p-4 rounded-lg">
               <h3 className="text-white font-medium mb-3">Динамика наполнения</h3>
               <div ref={detailsChartRef} className="h-[200px]"></div>
             </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
             {/* Распределение по категориям */}
             <div className="bg-gray-700/50 p-4 rounded-lg">
               <h3 className="text-white font-medium mb-3">Категории автомобилей</h3>
               <div className="space-y-3">
                 {selectedWarehouse.categories.map(category => (
                   <div key={category.name} className="group">
                     <div className="flex justify-between mb-1">
                       <span className="text-gray-300 capitalize">{category.name}</span>
                       <span className="font-medium text-white">{category.count} шт.</span>
                     </div>
                     <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                       <div 
                         className={`h-full rounded-full ${
                           category.name === 'Внедорожники' ? 'bg-blue-500 group-hover:bg-blue-400' :
                           category.name === 'Седаны' ? 'bg-red-500 group-hover:bg-red-400' :
                           'bg-amber-500 group-hover:bg-amber-400'
                         } transition-all`}
                         style={{ width: `${(category.count / selectedWarehouse.totalCount) * 100}%` }}
                       ></div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
             
             {/* Распределение по моделям */}
             <div className="bg-gray-700/50 p-4 rounded-lg">
               <h3 className="text-white font-medium mb-3">Распределение по моделям</h3>
               <div className="space-y-3">
                 {selectedWarehouse.models.filter(model => model.count > 0).slice(0, 5).map(model => (
                   <div key={model.id} className="group cursor-pointer" onClick={() => handleCarModelClick(model.id)}>
                     <div className="flex justify-between mb-1">
                       <span className="text-gray-300">{model.name}</span>
                       <span className="font-medium text-white">{model.count} шт.</span>
                     </div>
                     <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-purple-500 group-hover:bg-purple-400 transition-all rounded-full"
                         style={{ width: `${(model.count / selectedWarehouse.totalCount) * 100}%` }}
                       ></div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           </div>
           
           {/* Кнопки действий */}
           <div className="flex flex-wrap justify-end gap-3">
             <button className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded text-sm">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
               </svg>
               Отчет
             </button>
             <button className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded text-sm">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                 <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                 <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
               </svg>
               Поставка
             </button>
           </div>
         </motion.div>
       )}
     </AnimatePresence>
   </div>
 );
};

export default WarehouseAnalytics;