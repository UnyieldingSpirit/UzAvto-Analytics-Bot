'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import { carModels, regions } from '../mocks/mock-data';

const WarehouseDashboard = () => {
  // Refs для графиков
  const warehouseDistributionRef = useRef(null);
  const modelDistributionRef = useRef(null);
  const colorDistributionRef = useRef(null);
  const configDistributionRef = useRef(null);
  
  // Состояния
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Расширенные данные моделей с дополнительной информацией
  const enhancedCarModels = carModels.map(model => {
    // Распределение по регионам
    const modelRegions = {};
    regions.forEach(region => {
      modelRegions[region.id] = Math.floor(Math.random() * 20) + 5;
    });
    
    // Общее количество
    const totalStock = Object.values(modelRegions).reduce((sum, value) => sum + value, 0);
    
    // Распределение по цветам
    const colors = ['Красный', 'Синий', 'Серый', 'Белый', 'Черный'];
    const colorsDistribution = colors.map(color => ({
      name: color,
      count: Math.floor(Math.random() * 15) + 5
    }));
    
    // Распределение по комплектациям
    const configurations = ['Базовая', 'Комфорт', 'Люкс'];
    const configurationsData = configurations.map(config => ({
      name: config,
      count: Math.floor(Math.random() * 20) + 10
    }));
    
    return {
      ...model,
      stock: totalStock,
      warehouses: modelRegions,
      colorsDistribution,
      colorCodes: ['#ef4444', '#3b82f6', '#6b7280', '#ffffff', '#000000'],
      configurationsData,
      price: Math.floor(Math.random() * 15000) + 8000
    };
  });
  
  // Данные для складов по регионам
  const warehouseData = regions.map(region => {
    const stock = enhancedCarModels.reduce((sum, model) => sum + (model.warehouses[region.id] || 0), 0);
    const capacity = stock + Math.floor(Math.random() * 50) + 20;
    
    return {
      ...region,
      stock,
      capacity
    };
  });

  // Фильтрованные модели на основе выбранного региона
  const filteredModels = selectedRegion === 'all' 
    ? enhancedCarModels 
    : enhancedCarModels.filter(model => model.warehouses[selectedRegion] > 0);
  
  // Суммарные показатели
  const totalStock = filteredModels.reduce((sum, model) => sum + model.stock, 0);
  const totalModels = filteredModels.length;
  const avgPrice = Math.round(filteredModels.reduce((sum, model) => sum + model.price, 0) / totalModels);
  
  // Обработчик выбора модели
  const handleModelSelect = (model) => {
    if (selectedModel?.id === model.id) {
      setSelectedModel(null);
    } else {
      setSelectedModel(model);
      setActiveTab('details');
    }
  };
  
  // Обработчик выбора региона
  const handleRegionSelect = (regionId) => {
    setSelectedRegion(regionId);
    if (selectedModel && !enhancedCarModels
      .filter(model => regionId === 'all' || model.warehouses[regionId] > 0)
      .some(model => model.id === selectedModel.id)) {
      setSelectedModel(null);
    }
  };
  
  // Эффект для отрисовки графиков
  useEffect(() => {
    renderWarehouseDistribution();
    renderModelDistribution();
    
    if (selectedModel) {
      renderColorDistribution();
      renderConfigDistribution();
    }
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedRegion, selectedModel, activeTab]);
  
  // Обработчик изменения размера окна
  const handleResize = () => {
    renderWarehouseDistribution();
    renderModelDistribution();
    
    if (selectedModel) {
      renderColorDistribution();
      renderConfigDistribution();
    }
  };
  
  // Отрисовка распределения по складам
  const renderWarehouseDistribution = () => {
    if (!warehouseDistributionRef.current) return;
    
    const container = warehouseDistributionRef.current;
    container.innerHTML = '';
    
    const margin = { top: 20, right: 20, bottom: 30, left: 100 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    
    // Фильтруем склады для отображения
    const data = selectedRegion === 'all' 
      ? warehouseData 
      : warehouseData.filter(d => d.id === selectedRegion);
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
      
    // Шкалы
    const y = d3.scaleBand()
      .domain(data.map(d => d.name))
      .range([0, height])
      .padding(0.3);
      
    const x = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.capacity)])
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
      
    // Фоновые полосы (емкость)
    svg.selectAll('.bar-bg')
      .data(data)
      .enter().append('rect')
      .attr('x', 0)
      .attr('y', d => y(d.name))
      .attr('width', d => x(d.capacity))
      .attr('height', y.bandwidth())
      .attr('fill', '#374151')
      .attr('rx', 4);
      
    // Полосы остатков
    svg.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('x', 0)
      .attr('y', d => y(d.name))
      .attr('width', 0)
      .attr('height', y.bandwidth())
      .attr('fill', d => {
        const ratio = d.stock / d.capacity;
        return ratio > 0.8 ? '#ef4444' : ratio > 0.6 ? '#f59e0b' : '#22c55e';
      })
      .attr('rx', 4)
      .transition()
      .duration(800)
      .attr('width', d => x(d.stock));
      
    // Метки
    svg.selectAll('.label-stock')
      .data(data)
      .enter().append('text')
      .attr('x', d => x(d.stock) - 30)
      .attr('y', d => y(d.name) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .style('font-size', '12px')
      .style('fill', '#ffffff')
      .style('opacity', 0)
      .transition()
      .duration(800)
      .style('opacity', 1)
      .text(d => `${d.stock} шт.`);
      
    // Процент загрузки
    svg.selectAll('.label-percentage')
      .data(data)
      .enter().append('text')
      .attr('x', 5)
      .attr('y', d => y(d.name) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .style('font-size', '12px')
      .style('fill', '#ffffff')
      .text(d => `${Math.round(d.stock / d.capacity * 100)}%`);
  };
  
  // Отрисовка распределения по моделям
  const renderModelDistribution = () => {
    if (!modelDistributionRef.current) return;
    
    const container = modelDistributionRef.current;
    container.innerHTML = '';
    
    const margin = { top: 20, right: 20, bottom: 30, left: 100 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    
    // Берем топ-5 моделей
    const data = [...filteredModels]
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 5);
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
      
    // Шкалы
    const y = d3.scaleBand()
      .domain(data.map(d => d.name))
      .range([0, height])
      .padding(0.3);
      
    const x = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.stock) * 1.1])
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
      
    // Полосы с анимацией
    svg.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('x', 0)
      .attr('y', d => y(d.name))
      .attr('width', 0)
      .attr('height', y.bandwidth())
      .attr('fill', (d, i) => ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444'][i])
      .attr('rx', 4)
      .transition()
      .duration(800)
      .attr('width', d => x(d.stock));
      
    // Метки
    svg.selectAll('.label')
      .data(data)
      .enter().append('text')
      .attr('x', d => x(d.stock) - 40)
      .attr('y', d => y(d.name) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .style('font-size', '12px')
      .style('fill', '#ffffff')
      .style('opacity', 0)
      .transition()
      .duration(800)
      .style('opacity', 1)
      .text(d => `${d.stock} шт.`);
  };
  
  // Отрисовка распределения по цветам
  const renderColorDistribution = () => {
    if (!colorDistributionRef.current || !selectedModel) return;
    
    const container = colorDistributionRef.current;
    container.innerHTML = '';
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    const radius = Math.min(width, height) / 2;
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);
      
    // Подготавливаем данные
    const data = selectedModel.colorsDistribution;
    
    // Создаем pie-генератор
    const pie = d3.pie()
      .value(d => d.count)
      .sort(null);
      
    const arc = d3.arc()
      .innerRadius(radius * 0.5)
      .outerRadius(radius * 0.8);
      
    const outerArc = d3.arc()
      .innerRadius(radius * 0.9)
      .outerRadius(radius * 0.9);
      
    const arcs = svg.selectAll('arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc');
      
    // Добавляем сегменты
    arcs.append('path')
      .attr('d', arc)
      .attr('fill', (d, i) => selectedModel.colorCodes[i])
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 1)
      .style('opacity', 0)
      .transition()
      .duration(800)
      .style('opacity', 1);
      
    // Добавляем метки
    arcs.append('text')
      .attr('transform', d => {
        const pos = outerArc.centroid(d);
        const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
        pos[0] = radius * 0.95 * (midAngle < Math.PI ? 1 : -1);
        return `translate(${pos})`;
      })
      .attr('dy', '.35em')
      .style('text-anchor', d => {
        const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
        return midAngle < Math.PI ? 'start' : 'end';
      })
      .style('font-size', '12px')
      .style('fill', '#e5e7eb')
      .text(d => `${d.data.name}: ${d.data.count}`)
      .style('opacity', 0)
      .transition()
      .duration(800)
      .delay(600)
      .style('opacity', 1);
      
    // Добавляем линии от секторов к меткам
    arcs.append('polyline')
      .attr('points', d => {
        const pos = outerArc.centroid(d);
        const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
        pos[0] = radius * 0.95 * (midAngle < Math.PI ? 1 : -1);
        return [arc.centroid(d), outerArc.centroid(d), pos];
      })
      .style('fill', 'none')
      .style('stroke', '#6b7280')
      .style('opacity', 0)
      .transition()
      .duration(800)
      .delay(300)
      .style('opacity', 0.4);
  };
  
  // Отрисовка распределения по комплектациям
  const renderConfigDistribution = () => {
    if (!configDistributionRef.current || !selectedModel) return;
    
    const container = configDistributionRef.current;
    container.innerHTML = '';
    
    const margin = { top: 20, right: 20, bottom: 30, left: 100 };
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
      .domain(selectedModel.configurationsData.map(d => d.name))
      .range([0, height])
      .padding(0.2);
      
    const x = d3.scaleLinear()
      .domain([0, d3.max(selectedModel.configurationsData, d => d.count) * 1.1])
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
      
    // Полосы с анимацией
    svg.selectAll('.bar')
      .data(selectedModel.configurationsData)
      .enter().append('rect')
      .attr('x', 0)
      .attr('y', d => y(d.name))
      .attr('width', 0)
      .attr('height', y.bandwidth())
      .attr('fill', (d, i) => ['#3b82f6', '#8b5cf6', '#ef4444'][i])
      .attr('rx', 4)
      .transition()
      .duration(800)
      .attr('width', d => x(d.count));
      
    // Метки
    svg.selectAll('.label')
      .data(selectedModel.configurationsData)
      .enter().append('text')
      .attr('x', d => x(d.count) - 30)
      .attr('y', d => y(d.name) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .style('font-size', '12px')
      .style('fill', '#ffffff')
      .style('opacity', 0)
      .transition()
      .duration(800)
      .style('opacity', 1)
      .text(d => `${d.count} шт.`);
  };
  
  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen pb-8">
      {/* Заголовок */}
      <div className="bg-gray-800 mb-6 p-4 md:p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-white">Аналитика склада</h1>
        <p className="text-gray-400">Обзор остатков автомобилей и статистика</p>
      </div>
      
      {/* Навигация по вкладкам */}
      <div className="flex border-b border-gray-700 mb-6">
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'overview' 
            ? 'text-blue-500 border-b-2 border-blue-500' 
            : 'text-gray-400 hover:text-white'}`}
          onClick={() => setActiveTab('overview')}
        >
          Обзор
        </button>
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'details' 
            ? 'text-blue-500 border-b-2 border-blue-500' 
            : 'text-gray-400 hover:text-white'}`}
          onClick={() => setActiveTab('details')}
          disabled={!selectedModel}
        >
          Детали модели
        </button>
      </div>
      
      {/* Фильтр по регионам */}
      <div className="mb-6 p-4 bg-gray-800 rounded-lg shadow-md">
        <div className="flex items-center mb-4">
          <h3 className="text-lg font-medium text-white mr-4">Регион:</h3>
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedRegion === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => handleRegionSelect('all')}
            >
              Все регионы
            </button>
            {regions.map(region => (
              <button
                key={region.id}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  selectedRegion === region.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                onClick={() => handleRegionSelect(region.id)}
              >
                {region.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {activeTab === 'overview' && (
        <>
          {/* Основные метрики */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800 p-4 rounded-lg shadow-md">
              <h3 className="text-gray-400 text-sm">Всего автомобилей</h3>
              <p className="text-3xl font-bold text-white mt-2">{totalStock}</p>
              <div className="mt-2 text-sm text-green-500">
                +12% с прошлого месяца
              </div>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg shadow-md">
              <h3 className="text-gray-400 text-sm">Моделей в наличии</h3>
              <p className="text-3xl font-bold text-white mt-2">{totalModels}</p>
              <div className="mt-2 text-sm text-gray-400">
                В выбранном регионе
              </div>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg shadow-md">
              <h3 className="text-gray-400 text-sm">Загруженность складов</h3>
              <p className="text-3xl font-bold text-white mt-2">
                {Math.round(warehouseData.reduce((sum, w) => sum + w.stock, 0) / 
                  warehouseData.reduce((sum, w) => sum + w.capacity, 0) * 100)}%
              </p>
              <div className="mt-2 text-sm text-green-500">
                +5% с прошлого месяца
              </div>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg shadow-md">
              <h3 className="text-gray-400 text-sm">Средняя стоимость</h3>
              <p className="text-3xl font-bold text-white mt-2">
                {avgPrice}$
              </p>
              <div className="mt-2 text-sm text-gray-400">
                Усредненно по всем моделям
              </div>
            </div>
          </div>
          
          {/* Графики */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-800 p-4 rounded-lg shadow-md">
              <h2 className="text-lg font-medium text-white mb-4">Загруженность складов</h2>
              <div ref={warehouseDistributionRef} className="h-[300px]"></div>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg shadow-md">
              <h2 className="text-lg font-medium text-white mb-4">Топ-5 моделей по наличию</h2>
              <div ref={modelDistributionRef} className="h-[300px]"></div>
            </div>
          </div>
          
          {/* Таблица моделей */}
          <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-gray-700">
              <h2 className="text-lg font-medium text-white">Список автомобилей на складе</h2>
              <p className="text-sm text-gray-400">Выберите модель для просмотра детальной информации</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Модель
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Фото
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Категория
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Кол-во
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Цена
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Статус
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {filteredModels.map(model => {
                    // Определяем статус на основе остатков
                    let status = { color: '', text: '' };
                    if (model.stock > 70) {
                      status = { color: 'bg-green-100 text-green-800', text: 'В наличии' };
                    } else if (model.stock > 30) {
                      status = { color: 'bg-yellow-100 text-yellow-800', text: 'Ограничено' };
                    } else {
                      status = { color: 'bg-red-100 text-red-800', text: 'Мало' };
                    }
                    
                    return (
                      <motion.tr
                        key={model.id}
                      
                        onClick={() => handleModelSelect(model)}
                        whileHover={{ backgroundColor: 'rgba(55, 65, 81, 1)' }}
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="font-medium text-white">{model.name}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <img src={model.img} alt={model.name} className="h-10 w-16 object-contain rounded" />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-gray-300 capitalize">
                          {model.category}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap font-medium">
                          {selectedRegion === 'all' 
                            ? model.stock 
                            : model.warehouses[selectedRegion] || 0} шт.
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-gray-300">
                          {model.price}$
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color}`}>
                            {status.text}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      
      {activeTab === 'details' && selectedModel && (
        <div className="space-y-6">
          {/* Заголовок модели */}
          <div className="bg-gray-800 p-4 rounded-lg shadow-md">
            <div className="flex items-center">
              <img 
                src={selectedModel.img} 
                alt={selectedModel.name} 
                className="h-20 w-32 object-contain bg-gray-700 rounded mr-4"
              />
              <div>
                <h2 className="text-xl font-bold text-white mb-1">{selectedModel.name}</h2>
                <p className="text-sm text-gray-400 capitalize">{selectedModel.category}</p>
                <div className="mt-2 flex items-center">
                  <span className="text-2xl font-bold text-white mr-2">{selectedModel.price}$</span>
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">
                    {selectedRegion === 'all' 
                      ? selectedModel.stock 
                      : selectedModel.warehouses[selectedRegion] || 0} шт. в наличии
                  </span>
                </div>
              </div>
            </div>
          </div>
       {/* Распределение по регионам */}
         {/* <div className="bg-gray-800 p-4 rounded-lg shadow-md">
           <h3 className="text-lg font-medium text-white mb-4">Распределение по регионам</h3>
           <div className="space-y-3">
             {regions.map(region => {
               const stock = selectedModel.warehouses[region.id] || 0;
               const percentage = Math.round((stock / selectedModel.stock) * 100);
               
               return (
                 <div key={region.id} className="group">
                   <div className="flex justify-between mb-1">
                     <span className="text-gray-300">{region.name}</span>
                     <div>
                       <span className="font-medium text-white">{stock} шт.</span>
                       <span className="text-gray-400 ml-2">({percentage}%)</span>
                     </div>
                   </div>
                   <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                     <div 
                       className="h-full bg-blue-500 group-hover:bg-blue-400 transition-all rounded-full"
                       style={{ width: `${percentage}%` }}
                     ></div>
                   </div>
                 </div>
               );
             })}
           </div>
         </div>
          */}
         {/* Графики по цветам и комплектациям */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div className="bg-gray-800 p-4 rounded-lg shadow-md">
             <h3 className="text-lg font-medium text-white mb-4">Распределение по цветам</h3>
             <div ref={colorDistributionRef} className="h-[250px]"></div>
           </div>
           
           <div className="bg-gray-800 p-4 rounded-lg shadow-md">
             <h3 className="text-lg font-medium text-white mb-4">Комплектации</h3>
             <div ref={configDistributionRef} className="h-[250px]"></div>
           </div>
         </div>
         
         {/* Дополнительная информация */}
         <div className="bg-gray-800 p-4 rounded-lg shadow-md">
           <h3 className="text-lg font-medium text-white mb-4">Дополнительная информация</h3>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-gray-700/50 p-3 rounded-lg">
               <h4 className="text-sm text-gray-400 mb-1">Средний срок ожидания</h4>
               <p className="text-xl font-medium text-white">2-3 недели</p>
             </div>
             
             <div className="bg-gray-700/50 p-3 rounded-lg">
               <h4 className="text-sm text-gray-400 mb-1">Спрос</h4>
               <p className="text-xl font-medium text-white">Высокий</p>
             </div>
             
             <div className="bg-gray-700/50 p-3 rounded-lg">
               <h4 className="text-sm text-gray-400 mb-1">Популярная комплектация</h4>
               <p className="text-xl font-medium text-white">
                 {selectedModel.configurationsData.sort((a, b) => b.count - a.count)[0]?.name || 'Базовая'}
               </p>
             </div>
           </div>
           
           <div className="mt-6 flex justify-end">
             <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center">
               Подробная спецификация
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
               </svg>
             </button>
           </div>
         </div>
       </div>
     )}
   </div>
 );
};

export default WarehouseDashboard;