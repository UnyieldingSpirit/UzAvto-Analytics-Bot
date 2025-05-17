'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const CarWarehouseAnalytics = () => {
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
  
  // Загрузка данных с API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('https://uzavtosalon.uz/b/dashboard/infos&get_stock');
        
        // Фильтрация данных - оставляем только склады с машинами
        const warehouses = response.data.filter(warehouse => 
          warehouse.models && warehouse.models.length > 0
        );
        
        // Обработка данных
        processData(warehouses);
        
        setLoading(false);
      } catch (err) {
        console.error('Ошибка при загрузке данных:', err);
        setError('Не удалось загрузить данные. Пожалуйста, попробуйте позже.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Функция для обработки загруженных данных
  const processData = (warehouses) => {
    const carModels = [];
    
    // Создаем итоговые объекты для подсчета общего количества по всем складам
    let totalModelsCount = {};
    
    // Обработка данных для создания структуры автомобилей
    warehouses.forEach(warehouse => {
      if (!warehouse.models || warehouse.models.length === 0) return;
      
      warehouse.models.forEach(model => {
        // Если нет моди или они пустые, пропускаем
        if (!model.modifications || model.modifications.length === 0) return;
        
        // Инициализируем счетчик для текущей модели, если еще не сделано
        if (!totalModelsCount[model.model]) {
          totalModelsCount[model.model] = {
            totalCount: 0,
            available: 0,
            reserved: 0,
            defective: 0,
            defectiveOk: 0,
            colors: {},
            modifications: {}
          };
        }
        
        // Проходим по модификациям этой модели
        model.modifications.forEach(mod => {
          // Если нет цветов или они пустые, пропускаем
          if (!mod.colors || mod.colors.length === 0) return;
          
          // Инициализируем счетчик для текущей модификации, если еще не сделано
          if (!totalModelsCount[model.model].modifications[mod.modification]) {
            totalModelsCount[model.model].modifications[mod.modification] = {
              totalCount: 0,
              available: 0,
              reserved: 0,
              defective: 0,
              defectiveOk: 0
            };
          }
          
          // Проходим по цветам этой модификации
          mod.colors.forEach(color => {
            // Если нет статусов или они пустые, пропускаем
            if (!color.statuses || color.statuses.length === 0) return;
            
            // Инициализируем счетчик для текущего цвета, если еще не сделано
            if (!totalModelsCount[model.model].colors[color.color]) {
              totalModelsCount[model.model].colors[color.color] = {
                totalCount: 0,
                available: 0,
                reserved: 0,
                defective: 0,
                defectiveOk: 0
              };
            }
            
            // Проходим по статусам этого цвета
            color.statuses.forEach(status => {
              const count = parseInt(status.count);
              
              // Увеличиваем общий счетчик для этой модели
              totalModelsCount[model.model].totalCount += count;
              
              // Увеличиваем общий счетчик для этого цвета
              totalModelsCount[model.model].colors[color.color].totalCount += count;
              
              // Увеличиваем общий счетчик для этой модификации
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
              }
            });
          });
        });
      });
    });
    
    // Преобразуем объект с итогами в массив для использования в компоненте
    Object.entries(totalModelsCount).forEach(([modelName, modelData]) => {
      // Преобразуем объекты цветов и модификаций в массивы
      let colorsArray = Object.entries(modelData.colors).map(([colorName, colorData]) => ({
        name: colorName,
        count: colorData.totalCount,
        available: colorData.available,
        reserved: colorData.reserved,
        defective: colorData.defective,
        defectiveOk: colorData.defectiveOk,
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
        image: `https://source.unsplash.com/random/400x300/?car,${modelName.toLowerCase()}`
      }));
      
      // Добавляем модель в итоговый массив
      carModels.push({
        id: modelName,
        name: modelName,
        category: getCategoryForModel(modelName),
        totalCount: modelData.totalCount,
        available: modelData.available,
        reserved: modelData.reserved,
        defective: modelData.defective,
        defectiveOk: modelData.defectiveOk,
        colors: colorsArray,
        modifications: modificationsArray,
        img: `https://source.unsplash.com/random/400x300/?car,${modelName.toLowerCase()}`
      });
    });
    
    // Сортируем модели по количеству
    carModels.sort((a, b) => b.totalCount - a.totalCount);
    
    // Обработка данных о складах
    const processedWarehouses = warehouses.map(warehouse => {
      // Если нет моделей, возвращаем пустой объект
      if (!warehouse.models || warehouse.models.length === 0) {
        return null;
      }
      
      // Подсчитываем остатки по всем моделям на этом складе
      const modelCounts = [];
      let totalCount = 0;
      let defective = 0;
      let defectiveOk = 0;
      let reserved = 0;
      let available = 0;
      
      // Маппинг категорий для этого склада
      const categoryCountsMap = {};
      
      warehouse.models.forEach(model => {
        let modelTotal = 0;
        let modelAvailable = 0;
        let modelReserved = 0;
        let modelDefective = 0;
        let modelDefectiveOk = 0;
        
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
              }
            });
          });
        });
        
        if (modelTotal > 0) {
          const category = getCategoryForModel(model.model);
          
          // Добавляем в счетчик категорий
          if (!categoryCountsMap[category]) {
            categoryCountsMap[category] = 0;
          }
          categoryCountsMap[category] += modelTotal;
          
          modelCounts.push({
            id: model.model,
            name: model.model,
            count: modelTotal,
            available: modelAvailable,
            reserved: modelReserved,
            defective: modelDefective,
            defectiveOk: modelDefectiveOk,
            category: category
          });
        }
      });
      
      // Если на складе нет автомобилей, пропускаем его
      if (totalCount === 0) {
        return null;
      }
      
      // Расчет вместимости склада - для демонстрации используем примерное значение
      const capacity = Math.round(totalCount * 1.2);
      const occupancyRate = Math.round((totalCount / capacity) * 100);
      
      // Преобразуем мапу категорий в массив для графиков
      const categories = Object.keys(categoryCountsMap).map(key => ({
        name: key === 'suv' ? 'Внедорожники' : 
              key === 'sedan' ? 'Седаны' : 
              key === 'minivan' ? 'Минивэны' : key,
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
        models: modelCounts,
        categories,
        capacity,
        occupancyRate,
        status: occupancyRate > 90 ? 'критический' : 
                occupancyRate > 75 ? 'высокий' : 
                occupancyRate > 50 ? 'средний' : 'низкий'
      };
    }).filter(Boolean); // Удаляем null элементы
    
    // Обновляем состояния с обработанными данными
    setEnhancedCarModels(carModels);
    setEnhancedWarehouses(processedWarehouses);
    
    // Общие статистические данные
    setTotalVehicles(processedWarehouses.reduce((sum, warehouse) => sum + warehouse.totalCount, 0));
    setTotalDefective(processedWarehouses.reduce((sum, warehouse) => sum + warehouse.defective, 0));
    setTotalDefectiveOk(processedWarehouses.reduce((sum, warehouse) => sum + warehouse.defectiveOk, 0));
    setTotalReserved(processedWarehouses.reduce((sum, warehouse) => sum + warehouse.reserved, 0));
    setTotalAvailable(processedWarehouses.reduce((sum, warehouse) => sum + warehouse.available, 0));
  };
  
  // Обработчик клика по модели
  const handleCarModelClick = (model) => {
    if (selectedCarModel && selectedCarModel.id === model.id) {
      setSelectedCarModel(null);
      setSelectedModification(null);
    } else {
      const selectedModelData = enhancedCarModels.find(m => m.id === model.id || m.name === model);
      setSelectedCarModel(selectedModelData);
      setSelectedWarehouse(null); // Снимаем выбор склада при выборе модели
      setSelectedModification(null); // Сбрасываем выбор модификации
    }
  };

  // Обработчик клика по складу
  const handleWarehouseClick = (warehouse) => {
    if (selectedWarehouse && selectedWarehouse.id === warehouse.id) {
      setSelectedWarehouse(null);
    } else {
      const selectedWarehouseData = enhancedWarehouses.find(w => w.id === warehouse.id || w.name === warehouse);
      setSelectedWarehouse(selectedWarehouseData);
      setSelectedCarModel(null); // Снимаем выбор модели при выборе склада
      setSelectedModification(null); // Сбрасываем выбор модификации
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

  // Функция для определения категории модели
  function getCategoryForModel(modelName) {
    const suvModels = ['TRACKER-2', 'EQUINOX', 'TRAVERSE', 'TAHOE', 'TAHOE-2', 'Captiva 5T'];
    const sedanModels = ['COBALT', 'MALIBU-2', 'ONIX', 'LACETTI'];
    const minivanModels = ['DAMAS-2', 'LABO'];
    
    if (suvModels.includes(modelName)) return 'suv';
    if (sedanModels.includes(modelName)) return 'sedan';
    if (minivanModels.includes(modelName)) return 'minivan';
    return 'other';
  }

  // Функция для получения HEX-кода по названию цвета
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
  }, [loading, enhancedWarehouses, selectedCarModel, selectedWarehouse]);

  // Рендер диаграммы распределения по складам
  const renderWarehouseDistribution = () => {
    if (!warehouseDistributionRef.current) return;
    
    const container = warehouseDistributionRef.current;
    container.innerHTML = '';
    
    const margin = { top: 30, right: 20, bottom: 40, left: 160 };
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
      available: warehouse.available,
      reserved: warehouse.reserved,
      defective: warehouse.defective,
      defectiveOk: warehouse.defectiveOk
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
      .keys(['defective', 'defectiveOk', 'reserved', 'available'])
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);
      
    const stackedData = stack(warehouseData);
    
    const colorScale = d3.scaleOrdinal()
      .domain(['available', 'reserved', 'defectiveOk', 'defective'])
      .range(['#22c55e', '#3b82f6', '#f59e0b', '#ef4444']);
      
    // Создаем градиенты
    const defs = svg.append('defs');
    
    ['available', 'reserved', 'defectiveOk', 'defective'].forEach((key, i) => {
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
      .attr('stroke', '#f97316')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,3')
      .style('opacity', 0)
      .transition()
      .duration(500)
      .delay(1000)
      .style('opacity', 1);
      
    // Добавляем легенду с новыми статусами
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 160}, ${height - 100})`);
      
    const legendData = [
      { key: 'available', label: 'Свободные' },
      { key: 'reserved', label: 'Закрепленные' },
      { key: 'defectiveOk', label: 'Брак-ОК' },
      { key: 'defective', label: 'Брак' }
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
      
    // Данные для диаграммы производителей - используем топ-5 моделей из enhancedCarModels
    const manufacturerData = enhancedCarModels
      .slice(0, 5)
      .map(model => ({
        manufacturer: model.name,
        percentage: Math.round((model.totalCount / totalVehicles) * 100),
        color: getColorHex(model.colors[0]?.name || 'Summit White')
      }));
      
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
        centerValue.text('Текущая доля');
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
      .text('Текущая доля');
  };
  
  // Рендер графика инвентаря моделей с обновленными статусами
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
      .text('Статус автомобилей на складах');
      
    // Данные для графика из расширенных моделей
    const carModelInventory = enhancedCarModels.slice(0, 5).map(model => ({
      model: model.name,
      available: Math.round((model.available / model.totalCount) * 100),
      reserved: Math.round((model.reserved / model.totalCount) * 100),
      defective: Math.round((model.defective / model.totalCount) * 100),
      defectiveOk: Math.round((model.defectiveOk / model.totalCount) * 100)
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
      
    // Создаем градиенты
    const defs = svg.append('defs');
    
    // Градиент для свободных авто
    const availableGradient = defs.append('linearGradient')
      .attr('id', 'availableGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
      
    availableGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#22c55e')
      .attr('stop-opacity', 1);
      
    availableGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#4ade80')
      .attr('stop-opacity', 1);
      
    // Градиент для закрепленных авто
    const reservedGradient = defs.append('linearGradient')
      .attr('id', 'reservedGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
      
    reservedGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#3b82f6')
      .attr('stop-opacity', 1);
      
    reservedGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#60a5fa')
      .attr('stop-opacity', 1);
      
    // Градиент для брак-ок авто
    const defectiveOkGradient = defs.append('linearGradient')
      .attr('id', 'defectiveOkGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
      
    defectiveOkGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#f59e0b')
      .attr('stop-opacity', 1);
      
    defectiveOkGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#fbbf24')
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
    
    // Добавляем полосы для свободных
    svg.selectAll('.available-bar')
      .data(carModelInventory)
      .join('rect')
      .attr('class', 'available-bar')
      .attr('y', d => y(d.model))
      .attr('height', y.bandwidth())
      .attr('x', 0)
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', 'url(#availableGradient)')
      .attr('width', 0)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        const model = enhancedCarModels.find(m => m.name === d.model);
        handleCarModelClick(model);
      })
      .transition()
      .duration(800)
      .attr('width', d => x(d.available));
      
    // Добавляем полосы для закрепленных
    svg.selectAll('.reserved-bar')
      .data(carModelInventory)
      .join('rect')
      .attr('class', 'reserved-bar')
      .attr('y', d => y(d.model))
      .attr('height', y.bandwidth())
      .attr('x', d => x(d.available))
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', 'url(#reservedGradient)')
      .attr('width', 0)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        const model = enhancedCarModels.find(m => m.name === d.model);
        handleCarModelClick(model);
      })
      .transition()
      .duration(800)
      .delay(300)
      .attr('width', d => x(d.reserved));
      
    // Добавляем полосы для брак-ок
    svg.selectAll('.defectiveOk-bar')
      .data(carModelInventory)
      .join('rect')
      .attr('class', 'defectiveOk-bar')
      .attr('y', d => y(d.model))
      .attr('height', y.bandwidth())
      .attr('x', d => x(d.available + d.reserved))
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', 'url(#defectiveOkGradient)')
      .attr('width', 0)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        const model = enhancedCarModels.find(m => m.name === d.model);
        handleCarModelClick(model);
      })
      .transition()
      .duration(800)
      .delay(600)
      .attr('width', d => x(d.defectiveOk));
      
    // Добавляем полосы для дефектных
    svg.selectAll('.defective-bar')
      .data(carModelInventory)
      .join('rect')
      .attr('class', 'defective-bar')
      .attr('y', d => y(d.model))
      .attr('height', y.bandwidth())
      .attr('x', d => x(d.available + d.reserved + d.defectiveOk))
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
      .delay(900)
      .attr('width', d => x(d.defective));
      
    // Добавляем значения (только если процент достаточно большой для отображения)
    svg.selectAll('.available-label')
      .data(carModelInventory)
      .join('text')
      .attr('class', 'available-label')
      .attr('x', d => x(d.available / 2))
      .attr('y', d => y(d.model) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .style('fill', '#ffffff')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('opacity', 0)
      .text(d => d.available >= 10 ? `${d.available}%` : '')
      .transition()
      .duration(500)
      .delay(1000)
      .style('opacity', 1);
      
    svg.selectAll('.reserved-label')
      .data(carModelInventory)
      .join('text')
      .attr('class', 'reserved-label')
      .attr('x', d => x(d.available + d.reserved / 2))
      .attr('y', d => y(d.model) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .style('fill', '#ffffff')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('opacity', 0)
      .text(d => d.reserved >= 10 ? `${d.reserved}%` : '')
      .transition()
      .duration(500)
      .delay(1100)
      .style('opacity', 1);
      
    svg.selectAll('.defectiveOk-label')
      .data(carModelInventory)
      .join('text')
      .attr('class', 'defectiveOk-label')
      .attr('x', d => x(d.available + d.reserved + d.defectiveOk / 2))
      .attr('y', d => y(d.model) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .style('fill', '#ffffff')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('opacity', 0)
      .text(d => d.defectiveOk >= 5 ? `${d.defectiveOk}%` : '')
      .transition()
      .duration(500)
      .delay(1200)
      .style('opacity', 1);
      
    svg.selectAll('.defective-label')
      .data(carModelInventory)
      .join('text')
      .attr('class', 'defective-label')
      .attr('x', d => x(d.available + d.reserved + d.defectiveOk + d.defective / 2))
      .attr('y', d => y(d.model) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .style('fill', '#ffffff')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('opacity', 0)
      .text(d => d.defective >= 5 ? `${d.defective}%` : '')
      .transition()
      .duration(500)
      .delay(1300)
      .style('opacity', 1);
      
    // Добавляем легенду с отступом, чтобы не перекрывалась с графиком
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 330}, ${height - 30})`);
      
    legend.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', '#22c55e')
      .attr('rx', 2);
      
    legend.append('text')
      .attr('x', 20)
      .attr('y', 12)
      .style('font-size', '12px')
      .style('fill', '#d1d5db')
      .text('Свободные');
      
    legend.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', '#3b82f6')
      .attr('rx', 2)
      .attr('transform', 'translate(95, 0)');
      
    legend.append('text')
      .attr('x', 115)
      .attr('y', 12)
      .style('font-size', '12px')
      .style('fill', '#d1d5db')
      .text('Закрепленные');
      
    legend.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', '#f59e0b')
      .attr('rx', 2)
      .attr('transform', 'translate(210, 0)');
      
    legend.append('text')
      .attr('x', 230)
      .attr('y', 12)
      .style('font-size', '12px')
      .style('fill', '#d1d5db')
      .text('Брак-ОК');
      
    legend.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', '#ef4444')
      .attr('rx', 2)
      .attr('transform', 'translate(295, 0)');
      
    legend.append('text')
      .attr('x', 315)
      .attr('y', 12)
      .style('font-size', '12px')
      .style('fill', '#d1d5db')
      .text('Брак');
  };

  // Функция для отрисовки графика распределения по цветам для выбранной модели
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
      .style('fill', d => (d.name === 'Summit White' || d.name === 'White Frost') ? '#1f2937' : '#ffffff')
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

  // Метод для рендеринга графика заполненности склада
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
      { name: 'Свободно', value: warehouse.capacity - warehouse.totalCount, color: '#94a3b8' },
      { name: 'Брак', value: warehouse.defective, color: '#ef4444' }, 
      { name: 'Брак-ОК', value: warehouse.defectiveOk, color: '#f59e0b' },
      { name: 'Закреплено', value: warehouse.reserved, color: '#3b82f6' },
      { name: 'Доступно', value: warehouse.available, color: '#22c55e' }
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
  };

  // Если данные загружаются, показываем индикатор загрузки
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Если произошла ошибка, показываем сообщение об ошибке
  if (error) {
    return (
      <div className="p-4 md:p-6 bg-gray-900 text-gray-100 min-h-screen">
        <div className="bg-red-500/20 text-red-400 p-6 rounded-lg text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold mb-2">Ошибка загрузки данных</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-900 text-gray-100 min-h-screen">
      {/* Верхняя панель со списком складов */}
      <div className="mb-6 bg-gray-800 p-4 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Аналитика автосклада</h1>
            <p className="text-gray-400 mt-1">Мониторинг в реальном времени</p>
          </div>
        </div>
      </div>
      
      {/* Ключевые метрики с обновленными статусами */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
             </svg>
           </div>
           <div>
             <div className="text-sm text-gray-400">Всего</div>
             <div className="text-xl font-bold">{totalVehicles}</div>
           </div>
         </div>
       </div>
       
       <div className="bg-gray-800 p-4 rounded-lg shadow-md">
         <div className="flex items-center">
           <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center mr-3">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
           </div>
           <div>
             <div className="text-sm text-gray-400">Свободные</div>
             <div className="text-xl font-bold">{totalAvailable}</div>
           </div>
         </div>
       </div>
       
       <div className="bg-gray-800 p-4 rounded-lg shadow-md">
         <div className="flex items-center">
           <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center mr-3">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
             </svg>
           </div>
           <div>
             <div className="text-sm text-gray-400">Закрепленные</div>
             <div className="text-xl font-bold">{totalReserved}</div>
           </div>
         </div>
       </div>
       
       <div className="bg-gray-800 p-4 rounded-lg shadow-md">
         <div className="flex items-center">
           <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center mr-3">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
             </svg>
           </div>
           <div>
             <div className="text-sm text-gray-400">Брак-ОК</div>
             <div className="text-xl font-bold">{totalDefectiveOk}</div>
           </div>
         </div>
       </div>
       
       <div className="bg-gray-800 p-4 rounded-lg shadow-md">
         <div className="flex items-center">
           <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center mr-3">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
             </svg>
           </div>
           <div>
             <div className="text-sm text-gray-400">Бракованные</div>
             <div className="text-xl font-bold">{totalDefective}</div>
           </div>
         </div>
       </div>
     </div>
     
     {/* Обновленная метрика с временем обновления */}
     <div className="bg-gray-800 p-4 rounded-lg shadow-md mb-6">
       <div className="flex items-center justify-between">
         <div>
           <span className="text-sm text-gray-400">Всего моделей автомобилей: {enhancedCarModels.length}</span>
         </div>
         
         <div className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm">
           Обновлено: {new Date().toLocaleTimeString()}
         </div>
       </div>
     </div>
     
     {/* Основные графики */}
     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
       <div className="bg-gray-800 rounded-lg p-4 shadow-md">
         <div className="flex justify-between mb-2">
           <h2 className="text-lg font-medium">Распределение моделей</h2>
           <span className="text-sm bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">Доли рынка</span>
         </div>
         <div ref={manufacturerChartRef} className="h-[300px]"></div>
       </div>
       
       <div className="bg-gray-800 rounded-lg p-4 shadow-md">
         <div className="flex justify-between mb-2">
           <h2 className="text-lg font-medium">Распределение автомобилей по складам</h2>
           <span className="text-sm bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">Интерактивно</span>
         </div>
         <div ref={warehouseDistributionRef} className="h-[300px]"></div>
       </div>
     </div>
     
     {/* График статусов моделей */}
     <div className="bg-gray-800 rounded-lg p-4 shadow-md mb-6">
       <div className="flex justify-between mb-2">
         <h2 className="text-lg font-medium">Статус автомобилей на складах</h2>
         <span className="text-sm bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Процентное соотношение</span>
       </div>
       <div ref={modelInventoryChartRef} className="h-[300px]"></div>
     </div>
     
     {/* Выбор модели авто с использованием фото */}
     <div className="bg-gray-800 rounded-lg p-4 shadow-md mb-6">
       <div className="flex justify-between mb-4">
         <div>
           <h2 className="text-lg font-medium">Модели автомобилей</h2>
           <p className="text-sm text-gray-400">Выберите модель для просмотра деталей</p>
         </div>
       </div>
       
       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
         {enhancedCarModels.slice(0, 8).map(model => (
           <div 
             key={model.id}
             className={`bg-gray-700 rounded-lg overflow-hidden cursor-pointer transition-all ${
               selectedCarModel?.id === model.id ? 'ring-2 ring-blue-500' : 'hover:bg-gray-600'
             }`}
             onClick={() => handleCarModelClick(model)}
           >
             <div className="bg-gray-800 relative overflow-hidden rounded-t-lg">
               <div className="pt-[75%] relative">
                 <img 
                   src={model.img} 
                   alt={model.name}
                   className="absolute inset-0 w-full h-full object-contain p-2" 
                 />
               </div>
               <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gray-900/70 text-xs text-white text-center">
                 {model.category === 'sedan' ? 'Седан' :
                  model.category === 'suv' ? 'Внедорожник' :
                  model.category === 'minivan' ? 'Минивэн' : model.category}
               </div>
             </div>
             <div className="p-3">
               <div className="font-medium text-white mb-1">{model.name}</div>
               <div className="flex justify-between text-sm">
                 <span className="text-gray-400">Всего:</span>
                 <span className="text-white">{model.totalCount}</span>
               </div>
               <div className="mt-2 flex gap-1 flex-wrap">
                 <span className="text-xs px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
                   {model.available} своб.
                 </span>
                 <span className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                   {model.reserved} закр.
                 </span>
                 <span className="text-xs px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded">
                   {model.defectiveOk} брак-ок
                 </span>
                 <span className="text-xs px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded">
                   {model.defective} брак
                 </span>
               </div>
             </div>
           </div>
         ))}
       </div>
     </div>
     
     {/* Таблица складов с обновленными статусами */}
     <div className="bg-gray-800 rounded-lg p-4 shadow-md mb-6">
       <div className="flex justify-between mb-4">
         <div>
           <h2 className="text-lg font-medium">Список складов</h2>
           <p className="text-sm text-gray-400">Нажмите на склад для детальной информации</p>
         </div>
         <div className="flex space-x-2">
           <button className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
             Экспорт данных
           </button>
         </div>
       </div>
       
       <div className="overflow-x-auto">
         <table className="w-full text-sm">
           <thead>
             <tr className="bg-gray-900/60 text-gray-400 text-left">
               <th className="p-3 rounded-l-lg">Название склада</th>
               <th className="p-3">Емкость</th>
               <th className="p-3">Заполнено</th>
               <th className="p-3">Свободные</th>
               <th className="p-3">Закрепленные</th>
               <th className="p-3">Брак-ОК</th>
               <th className="p-3">Брак</th>
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
                 <td className="p-3">{warehouse.available}</td>
                 <td className="p-3">{warehouse.reserved}</td>
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
                   <span className="text-lg font-semibold text-white mr-2">{selectedCarModel.totalCount} шт.</span>
                   <span className="text-sm capitalize bg-gray-700 px-2 py-0.5 rounded">{
                     selectedCarModel.category === 'sedan' ? 'Седан' :
                     selectedCarModel.category === 'suv' ? 'Внедорожник' :
                     selectedCarModel.category === 'minivan' ? 'Минивэн' : selectedCarModel.category
                   }</span>
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
             {/* Краткая информация о статусах */}
             <div className="bg-gray-700/50 p-4 rounded-lg">
               <h3 className="text-white font-medium mb-3">Статистика по модели</h3>
               <div className="grid grid-cols-2 gap-3">
                 <div className="bg-gray-800/70 p-3 rounded-lg">
                   <div className="text-gray-400 text-xs">Всего на складах</div>
                   <div className="text-white text-lg font-medium">{selectedCarModel.totalCount}</div>
                 </div>
                 <div className="bg-gray-800/70 p-3 rounded-lg">
                   <div className="text-gray-400 text-xs">Свободные</div>
                   <div className="text-white text-lg font-medium">{selectedCarModel.available}</div>
                 </div>
                 <div className="bg-gray-800/70 p-3 rounded-lg">
                   <div className="text-gray-400 text-xs">Закрепленные</div>
                   <div className="text-white text-lg font-medium">{selectedCarModel.reserved}</div>
                 </div>
                 <div className="bg-gray-800/70 p-3 rounded-lg">
                   <div className="text-gray-400 text-xs">Брак-ОК</div>
                   <div className="text-white text-lg font-medium">{selectedCarModel.defectiveOk}</div>
                 </div>
                 <div className="bg-gray-800/70 p-3 rounded-lg col-span-2">
                   <div className="text-gray-400 text-xs">Бракованные</div>
                   <div className="text-white text-lg font-medium">{selectedCarModel.defective}</div>
                 </div>
               </div>
             </div>
             
             {/* Доступность модели */}
             <div className="bg-gray-700/50 p-4 rounded-lg md:col-span-2">
               <h3 className="text-white font-medium">Распределение по статусам</h3>
               <div className="flex items-center h-full p-2">
                 <div className="flex-1 h-full flex flex-col justify-center">
                   <div className="grid grid-cols-2 gap-2">
                     <div className="bg-gray-800/70 rounded-lg p-2">
                       <div className="text-gray-400 text-xs">Доступность</div>
                       <div className="text-white text-lg font-medium">
                         {Math.round((selectedCarModel.available / selectedCarModel.totalCount) * 100)}%
                       </div>
                     </div>
                     <div className="bg-gray-800/70 rounded-lg p-2">
                       <div className="text-gray-400 text-xs">Качество</div>
                       <div className="text-white text-lg font-medium">
                         {Math.round(((selectedCarModel.totalCount - selectedCarModel.defective) / selectedCarModel.totalCount) * 100)}%
                       </div>
                     </div>
                   </div>
                 </div>
                 
                 <div className="flex-1 flex items-center justify-center">
                   <div className="relative h-32 w-32">
                     <svg viewBox="0 0 100 100" className="h-full w-full">
                       <circle 
                         cx="50" cy="50" r="45" 
                         fill="none" 
                         stroke="#374151" 
                         strokeWidth="10"
                       />
                       <circle 
                         cx="50" cy="50" r="45" 
                         fill="none" 
                         stroke="#3b82f6" 
                         strokeWidth="10"
                         strokeDasharray={`${(selectedCarModel.available / selectedCarModel.totalCount) * 283} 283`}
                         strokeDashoffset="0"
                         transform="rotate(-90 50 50)"
                       />
                     </svg>
                     <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <div className="text-white text-xl font-bold">
                         {Math.round((selectedCarModel.available / selectedCarModel.totalCount) * 100)}%
                       </div>
                       <div className="text-xs text-gray-400">Доступно</div>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           </div>
           
           {/* График распределения по цветам */}
           <div className="bg-gray-700/50 p-4 rounded-lg mb-5">
             <h3 className="text-white font-medium mb-3">Распределение по цветам</h3>
             <div ref={colorDistributionRef} className="h-[200px]"></div>
           </div>
           
           {/* Выбор модификации */}
           <div className="bg-gray-700/50 p-4 rounded-lg mb-5">
             <h3 className="text-white font-medium mb-3">Выберите модификацию</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
               {selectedCarModel.modifications?.map(modification => (
                 <div 
                   key={modification.id} 
                   className={`bg-gray-800/70 p-3 rounded-lg cursor-pointer transition-all ${
                     selectedModification?.id === modification.id ? 'ring-2 ring-blue-500' : 'hover:bg-gray-800'
                   }`}
                   onClick={() => handleModificationClick(modification)}
                 >
                   <div className="flex justify-between mb-2">
                     <span className="text-white font-medium">{modification.name}</span>
                     <span className="text-sm text-gray-400">{modification.count} шт.</span>
                   </div>
                   <div className="flex gap-1.5 mb-2 flex-wrap">
                     <span className="text-xs px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
                       {modification.available} своб.
                     </span>
                     <span className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                       {modification.reserved} закр.
                     </span>
                     <span className="text-xs px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded">
                       {modification.defectiveOk} брак-ок
                     </span>
                     <span className="text-xs px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded">
                       {modification.defective} брак
                     </span>
                   </div>
                 </div>
               ))}
             </div>
           </div>
           
           {/* Отображение выбранной модификации */}
           {selectedModification && (
             <div className="bg-gray-700/50 p-4 rounded-lg mb-5">
               <div className="flex flex-col md:flex-row gap-5">
                 <div className="md:w-1/2">
                   <h3 className="text-white font-medium mb-3">{selectedCarModel.name} - {selectedModification.name}</h3>
                   <img 
                     src={selectedModification.image} 
                     alt={`${selectedCarModel.name} ${selectedModification.name}`} 
                     className="w-full h-64 object-cover rounded-lg"
                   />
                 </div>
                 <div className="md:w-1/2 flex flex-col">
                   <h3 className="text-white font-medium mb-3">Детали модификации</h3>
                   <div className="grid grid-cols-2 gap-3 mb-auto">
                     <div className="bg-gray-800/70 p-3 rounded-lg">
                       <div className="text-gray-400 text-xs">Всего</div>
                       <div className="text-white text-lg font-medium">{selectedModification.count}</div>
                     </div>
                     <div className="bg-gray-800/70 p-3 rounded-lg">
                       <div className="text-gray-400 text-xs">Свободные</div>
                       <div className="text-white text-lg font-medium">{selectedModification.available}</div>
                     </div>
                     <div className="bg-gray-800/70 p-3 rounded-lg">
                       <div className="text-gray-400 text-xs">Закрепленные</div>
                       <div className="text-white text-lg font-medium">{selectedModification.reserved}</div>
                     </div>
                     <div className="bg-gray-800/70 p-3 rounded-lg">
                       <div className="text-gray-400 text-xs">Брак-ОК</div>
                       <div className="text-white text-lg font-medium">{selectedModification.defectiveOk}</div>
                     </div>
                     <div className="bg-gray-800/70 p-3 rounded-lg col-span-2">
                       <div className="text-gray-400 text-xs">Бракованные</div>
                       <div className="text-white text-lg font-medium">{selectedModification.defective}</div>
                     </div>
                   </div>
                   <div className="mt-3">
                     <div className="flex justify-between text-sm mb-1">
                       <span className="text-gray-400">Доступность:</span>
                       <span className="text-white">
                         {Math.round((selectedModification.available / selectedModification.count) * 100)}% свободных авто
                       </span>
                     </div>
                     <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-green-500 rounded-full"
                         style={{ width: `${(selectedModification.available / selectedModification.count) * 100}%` }}
                       ></div>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           )}
           
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
             {/* Краткая информация с обновленными статусами */}
             <div className="bg-gray-700/50 p-4 rounded-lg">
               <h3 className="text-white font-medium mb-3">Информация о складе</h3>
               <div className="grid grid-cols-2 gap-3">
                 <div className="bg-gray-800/70 p-3 rounded-lg">
                   <div className="text-gray-400 text-xs">Всего авто</div>
                   <div className="text-white text-lg font-medium">{selectedWarehouse.totalCount}</div>
                 </div>
                 <div className="bg-gray-800/70 p-3 rounded-lg">
                   <div className="text-gray-400 text-xs">Свободные</div>
                   <div className="text-white text-lg font-medium">{selectedWarehouse.available}</div>
                 </div>
                 <div className="bg-gray-800/70 p-3 rounded-lg">
                   <div className="text-gray-400 text-xs">Закрепленные</div>
                   <div className="text-white text-lg font-medium">{selectedWarehouse.reserved}</div>
                 </div>
                 <div className="bg-gray-800/70 p-3 rounded-lg">
                   <div className="text-gray-400 text-xs">Брак-ОК</div>
                   <div className="text-white text-lg font-medium">{selectedWarehouse.defectiveOk}</div>
                 </div>
                 <div className="bg-gray-800/70 p-3 rounded-lg col-span-2">
                   <div className="text-gray-400 text-xs">Бракованные</div>
                   <div className="text-white text-lg font-medium">{selectedWarehouse.defective}</div>
                 </div>
               </div>
             </div>
             
             {/* График заполненности склада */}
             <div className="bg-gray-700/50 p-4 rounded-lg md:col-span-2">
               <h3 className="text-white font-medium mb-3">Заполненность склада</h3>
               <div ref={warehouseOccupancyRef} className="h-[200px]"></div>
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
                       <div>
                         <span className="font-medium text-white">{model.count} шт.</span>
                         <span className="ml-2 text-xs text-red-400">
                           {model.defective > 0 ? `(${model.defective} брак)` : ''}
                         </span>
                         <span className="ml-2 text-xs text-amber-400">
                           {model.defectiveOk > 0 ? `(${model.defectiveOk} брак-ок)` : ''}
                         </span>
                       </div>
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

export default CarWarehouseAnalytics;