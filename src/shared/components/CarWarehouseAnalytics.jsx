'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import { carModels, regions } from '../mocks/mock-data';

const WarehouseAnalytics = () => {
 // Refs для графиков
 const salesChartRef = useRef(null);
 const regionDistributionRef = useRef(null);
 const manufacturerChartRef = useRef(null);
 const modelInventoryChartRef = useRef(null);
 const detailsChartRef = useRef(null);
 const colorDistributionRef = useRef(null);
 
 // Состояния
 const [selectedMonth, setSelectedMonth] = useState('Апрель');
 const [selectedView, setSelectedView] = useState('общий');
 const [selectedCarModel, setSelectedCarModel] = useState(null);
 const [selectedRegion, setSelectedRegion] = useState(null);
 
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
     colors,
     history,
     variants
   };
 });
 
 // Расширяем данные регионов
 const enhancedRegions = regions.map(region => {
   // Подсчитываем остатки по всем моделям в этом регионе
   const modelCounts = enhancedCarModels.map(model => {
     const regionData = model.regions.find(r => r.name === region.name);
     return {
       name: model.name,
       count: regionData ? regionData.count : 0
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
     ...region,
     totalCount,
     goodCondition,
     defective,
     defectRate,
     dealerships: Math.floor(Math.random() * 10) + 1,
     models: modelCounts,
     history,
     salesChannels,
     population: `${(Math.random() * 2 + 0.2).toFixed(1)}M`
   };
 });
 
 // Данные для диаграммы каналов продаж
 const salesChannelData = [
   { source: 'Дилерские центры', value: 68.3, color: '#3b82f6' },
   { source: 'Онлайн-продажи', value: 15.6, color: '#ef4444' },
   { source: 'Выставки', value: 10.2, color: '#f59e0b' },
   { source: 'Корпоративные клиенты', value: 5.9, color: '#22c55e' }
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

 // Обработчик клика по модели
 const handleCarModelClick = (model) => {
   if (selectedCarModel && selectedCarModel.id === model.id) {
     setSelectedCarModel(null);
   } else {
     const selectedModelData = enhancedCarModels.find(m => m.id === model.id || m.name === model);
     setSelectedCarModel(selectedModelData);
     setSelectedRegion(null); // Снимаем выбор региона при выборе модели
   }
 };

 // Обработчик клика по региону
 const handleRegionClick = (region) => {
   if (selectedRegion && selectedRegion.id === region.id) {
     setSelectedRegion(null);
   } else {
     const selectedRegionData = enhancedRegions.find(r => r.id === region.id || r.name === region);
     setSelectedRegion(selectedRegionData);
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
     
   // Получаем данные для графика из расширенных регионов
   const regionData = enhancedRegions.slice(0, 5).map(region => ({
     region: region.name,
     male: Math.round(region.totalCount * 0.6),
     female: Math.round(region.totalCount * 0.3),
     other: Math.round(region.totalCount * 0.1)
   }));
   
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
       const region = enhancedRegions.find(r => r.name === d);
       handleRegionClick(region);
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
       const region = enhancedRegions.find(r => r.name === d.data.region);
       handleRegionClick(region);
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

// Функция для отрисовки графика детализации выбранной модели
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

// Функция для отрисовки графика детализации выбранного региона
const renderRegionDetailsChart = (region) => {
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
 const historyData = region.history;
 
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
   .text(`Динамика остатков по региону: ${region.name}`);
   
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
           <option value="регион">По регионам</option>
         </select>
       </div>
     </div>
     
     {/* Фильтры по регионам */}
     <div className="mt-4 flex flex-wrap gap-2">
       <button
         className={`px-3 py-1 rounded-full text-sm font-medium ${
           selectedRegion === null 
             ? 'bg-blue-600 text-white' 
             : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
         }`}
         onClick={() => setSelectedRegion(null)}
       >
         Все регионы
       </button>
       {enhancedRegions.map(region => (
         <button
           key={region.id}
           className={`px-3 py-1 rounded-full text-sm font-medium ${
             selectedRegion?.id === region.id 
               ? 'bg-blue-600 text-white' 
               : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
           }`}
           onClick={() => handleRegionClick(region)}
         >
           {region.name}
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
           <div className="text-xl font-bold">{enhancedCarModels.reduce((sum, model) => sum + model.totalCount, 0)}</div>
         </div>
       </div>
     </div>
     
     <div className="bg-gray-800 p-4 rounded-lg shadow-md">
       <div className="flex items-center">
         <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mr-3">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
           </svg>
         </div>
         <div>
           <div className="text-sm text-gray-400">Доступные модели</div>
           <div className="text-xl font-bold">{enhancedCarModels.length}</div>
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
           <div className="text-xl font-bold">{enhancedCarModels.reduce((sum, model) => sum + model.goodCondition, 0)}</div>
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
             <span className="text-xl font-bold mr-2">{enhancedCarModels.reduce((sum, model) => sum + model.defective, 0)}</span>
             <span className="text-xs text-red-400">{(enhancedCarModels.reduce((sum, model) => sum + model.defective, 0) / enhancedCarModels.reduce((sum, model) => sum + model.totalCount, 0) * 100).toFixed(1)}%</span>
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
         <h2 className="text-lg font-medium">Распределение по регионам</h2>
         <span className="text-sm bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">Интерактивно</span>
       </div>
       <div ref={regionDistributionRef} className="h-[300px]"></div>
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
   
   {/* Таблица моделей */}
   <div className="bg-gray-800 rounded-lg p-4 shadow-md mb-6">
     <div className="flex justify-between mb-4">
       <div>
         <h2 className="text-lg font-medium">Список моделей на складе</h2>
         <p className="text-sm text-gray-400">Нажмите на модель для детальной информации</p>
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
             <th className="p-3 rounded-l-lg">Модель</th>
             <th className="p-3">Фото</th>
             <th className="p-3">Категория</th>
             <th className="p-3">Всего</th>
             <th className="p-3">Исправные</th>
             <th className="p-3">Брак</th>
             <th className="p-3">Цена ($)</th>
             <th className="p-3 rounded-r-lg">Действия</th>
           </tr>
         </thead>
         <tbody className="divide-y divide-gray-700">
           {enhancedCarModels
             .filter(model => !selectedRegion || model.regions.some(r => r.name === selectedRegion.name))
             .map(model => (
               <motion.tr 
                 key={model.id} 
                 className={`hover:bg-gray-700/30 transition-colors cursor-pointer ${
                   selectedCarModel?.id === model.id ? 'bg-blue-900/20' : ''
                 }`}
                 onClick={() => handleCarModelClick(model)}
                 whileHover={{ backgroundColor: 'rgba(55, 65, 81, 0.3)' }}
               >
                 <td className="p-3 font-medium">{model.name}</td>
                 <td className="p-3">
                   <img 
                     src={model.img} 
                     alt={model.name} 
                     className="h-10 w-16 object-contain bg-gray-700/50 rounded" 
                   />
                 </td>
                 <td className="p-3 capitalize">{model.category}</td>
                 <td className="p-3">{model.totalCount}</td>
                 <td className="p-3">{model.goodCondition}</td>
                 <td className="p-3">
                   <span className={`bg-${model.defectRate > 5 ? 'red' : model.defectRate > 3 ? 'yellow' : 'green'}-500/20 
                     text-${model.defectRate > 5 ? 'red' : model.defectRate > 3 ? 'yellow' : 'green'}-400 
                     px-2 py-1 rounded-full text-xs`}>
                     {model.defective} ({model.defectRate}%)
                   </span>
                 </td>
                 <td className="p-3">{model.price.toLocaleString()}</td>
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
           
           {/* Распределение по регионам */}
           <div className="bg-gray-700/50 p-4 rounded-lg">
             <h3 className="text-white font-medium mb-3">Распределение по регионам</h3>
             <div className="space-y-3">
               {selectedCarModel.regions.map(region => (
                 <div key={region.name} className="group">
                   <div className="flex justify-between mb-1">
                     <span className="text-gray-300">{region.name}</span>
                     <span className="font-medium text-white">{region.count} шт.</span>
                   </div>
                   <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                     <div 
                       className="h-full bg-blue-500 group-hover:bg-blue-400 transition-all rounded-full"
                       style={{ width: `${(region.count / selectedCarModel.totalCount) * 100}%` }}
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
   
   {/* Детальная информация о выбранном регионе */}
   <AnimatePresence>
     {selectedRegion && (
       <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         exit={{ opacity: 0, y: 20 }}
         transition={{ duration: 0.3 }}
         className="bg-gray-800 rounded-lg p-5 shadow-md mb-6 border border-purple-900/30"
       >
         <div className="flex justify-between items-start mb-5">
           <div>
             <h2 className="text-xl font-bold text-white">{selectedRegion.name}</h2>
             <p className="text-purple-400 text-sm">Детальная информация о регионе</p>
             <div className="flex items-center mt-1">
               <span className="text-lg font-semibold text-white mr-2">{selectedRegion.totalCount} авто</span>
               <span className="text-sm bg-gray-700 px-2 py-0.5 rounded">{selectedRegion.dealerships} дилерских центров</span>
             </div>
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
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
           {/* Краткая информация */}
           <div className="bg-gray-700/50 p-4 rounded-lg">
             <h3 className="text-white font-medium mb-3">Информация о регионе</h3>
             <div className="grid grid-cols-2 gap-3">
               <div className="bg-gray-800/70 p-3 rounded-lg">
                 <div className="text-gray-400 text-xs">Всего авто</div>
                 <div className="text-white text-lg font-medium">{selectedRegion.totalCount}</div>
               </div>
               <div className="bg-gray-800/70 p-3 rounded-lg">
                 <div className="text-gray-400 text-xs">Исправные</div>
                 <div className="text-white text-lg font-medium">{selectedRegion.goodCondition}</div>
               </div>
               <div className="bg-gray-800/70 p-3 rounded-lg">
                 <div className="text-gray-400 text-xs">Брак</div>
                 <div className="text-white text-lg font-medium">{selectedRegion.defective}</div>
               </div>
               <div className="bg-gray-800/70 p-3 rounded-lg">
                 <div className="text-gray-400 text-xs">Население</div>
                 <div className="text-white text-lg font-medium">{selectedRegion.population}</div>
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
           {/* Каналы продаж */}
           <div className="bg-gray-700/50 p-4 rounded-lg">
             <h3 className="text-white font-medium mb-3">Каналы продаж</h3>
             <div className="space-y-3">
               {selectedRegion.salesChannels.map(channel => (
                 <div key={channel.name} className="group">
                   <div className="flex justify-between mb-1">
                     <span className="text-gray-300">{channel.name}</span>
                     <span className="font-medium text-white">{channel.percentage}%</span>
                   </div>
                   <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                     <div 
                       className="h-full bg-blue-500 group-hover:bg-blue-400 transition-all rounded-full"
                       style={{ width: `${channel.percentage}%` }}
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
               {selectedRegion.models.map(model => (
                 <div key={model.name} className="group cursor-pointer" onClick={() => handleCarModelClick(model.name)}>
                   <div className="flex justify-between mb-1">
                     <span className="text-gray-300">{model.name}</span>
                     <span className="font-medium text-white">{model.count} шт.</span>
                   </div>
                   <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                     <div 
                       className="h-full bg-purple-500 group-hover:bg-purple-400 transition-all rounded-full"
                       style={{ width: `${(model.count / selectedRegion.totalCount) * 100}%` }}
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