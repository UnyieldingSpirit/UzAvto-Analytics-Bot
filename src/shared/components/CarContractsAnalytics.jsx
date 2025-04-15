'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { carModels, regions } from '../mocks/mock-data';

const CarContractsAnalytics = () => {
  const [activeTab, setActiveTab] = useState('contracts');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedModel, setSelectedModel] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Chart refs
  const regionContractsRef = useRef(null);
  const modelContractsRef = useRef(null);
  const timelineContractsRef = useRef(null);
  const regionSalesRef = useRef(null);
  const modelSalesRef = useRef(null);
  const timelineSalesRef = useRef(null);
  const regionStockRef = useRef(null);
  const modelStockRef = useRef(null);
  const stockTrendRef = useRef(null);
  
  // Дополнительные данные
  const carColors = ['Белый', 'Черный', 'Серебряный', 'Красный', 'Синий', 'Зеленый'];
  const carModifications = ['Стандарт', 'Комфорт', 'Люкс', 'Премиум', 'Спорт'];

  useEffect(() => {
    // Set default dates (last 12 months)
    const today = new Date();
    const lastYear = new Date();
    lastYear.setFullYear(today.getFullYear() - 1);
    
    setStartDate(lastYear.toISOString().substring(0, 10));
    setEndDate(today.toISOString().substring(0, 10));
    
    // Initialize charts
    renderCharts();
    
    // Window resize handler
    const handleResize = () => {
      renderCharts();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Redraw charts when tab or filters change
  useEffect(() => {
    renderCharts();
  }, [activeTab, selectedRegion, selectedModel]);
  
  // Функция для получения отфильтрованных данных
  const getFilteredData = () => {
    // Data functions (for demo purposes)
    const getContractsData = () => {
      let regionData = regions.map(region => ({
        id: region.id,
        name: region.name,
        contracts: Math.round(80 + Math.random() * 120),
        amount: Math.round((8000000 + Math.random() * 12000000))
      }));
      
      let modelData = carModels.map(model => ({
        id: model.id,
        name: model.name,
        contracts: Math.round(50 + Math.random() * 150),
        amount: Math.round((5000000 + Math.random() * 15000000))
      }));
      
      let monthlyData = [
        { month: "Янв", contracts: 124, amount: 8520000 },
        { month: "Фев", contracts: 85, amount: 5950000 },
        { month: "Мар", contracts: 102, amount: 7140000 },
        { month: "Апр", contracts: 118, amount: 8260000 },
        { month: "Май", contracts: 175, amount: 12250000 },
        { month: "Июн", contracts: 140, amount: 9800000 },
        { month: "Июл", contracts: 155, amount: 10850000 },
        { month: "Авг", contracts: 132, amount: 9240000 },
        { month: "Сен", contracts: 145, amount: 10150000 },
        { month: "Окт", contracts: 120, amount: 8400000 },
        { month: "Ноя", contracts: 165, amount: 11550000 },
        { month: "Дек", contracts: 130, amount: 9100000 }
      ];
      
      // Если выбран конкретный регион
      if (selectedRegion !== 'all') {
        // Детальные данные по модификациям и цветам для выбранного региона
        modelData = carModels.map(model => ({
          id: model.id,
          name: model.name,
          contracts: Math.round(30 + Math.random() * 80),
          amount: Math.round((3000000 + Math.random() * 8000000))
        }));
        
        // Дополнительные данные по модификациям для выбранного региона
        const selectedRegionName = regions.find(r => r.id === selectedRegion)?.name || 'Выбранный регион';
        monthlyData = monthlyData.map(item => ({
          ...item,
          contracts: Math.round(item.contracts * 0.7),
          amount: Math.round(item.amount * 0.7)
        }));
      }
      
      // Если выбрана конкретная модель
      if (selectedModel !== 'all') {
        // Данные по регионам для выбранной модели
        regionData = regions.map(region => ({
          id: region.id,
          name: region.name,
          contracts: Math.round(20 + Math.random() * 60),
          amount: Math.round((2000000 + Math.random() * 6000000))
        }));
        
        // Генерируем данные по модификациям и цветам для выбранной модели
        modelData = [];
        
        // Добавляем данные о модификациях
        carModifications.forEach(modification => {
          modelData.push({
            id: `mod-${modification.toLowerCase()}`,
            name: `${carModels.find(m => m.id === selectedModel)?.name || 'Автомобиль'} ${modification}`,
            contracts: Math.round(10 + Math.random() * 40),
            amount: Math.round((1000000 + Math.random() * 4000000))
          });
        });
        
        // Добавляем данные о цветах
        carColors.forEach(color => {
          modelData.push({
            id: `color-${color.toLowerCase()}`,
            name: `Цвет: ${color}`,
            contracts: Math.round(5 + Math.random() * 25),
            amount: Math.round((500000 + Math.random() * 2000000))
          });
        });
        
        // Модифицируем временные данные для выбранной модели
        monthlyData = monthlyData.map(item => ({
          ...item,
          contracts: Math.round(item.contracts * 0.4),
          amount: Math.round(item.amount * 0.4)
        }));
      }
      
      return { regionData, modelData, monthlyData };
    };
    
    const getSalesData = () => {
      let regionData = regions.map(region => ({
        id: region.id,
        name: region.name,
        sales: Math.round(60 + Math.random() * 100),
        amount: Math.round((6000000 + Math.random() * 10000000))
      }));
      
      let modelData = carModels.map(model => ({
        id: model.id,
        name: model.name,
        sales: Math.round(40 + Math.random() * 120),
        amount: Math.round((4000000 + Math.random() * 12000000))
      }));
      
      let monthlyData = [
        { month: "Янв", sales: 111, amount: 7770000 },
        { month: "Фев", sales: 79, amount: 5530000 },
        { month: "Мар", sales: 92, amount: 6440000 },
        { month: "Апр", sales: 105, amount: 7350000 },
        { month: "Май", sales: 158, amount: 11060000 },
        { month: "Июн", sales: 128, amount: 8960000 },
        { month: "Июл", sales: 142, amount: 9940000 },
        { month: "Авг", sales: 121, amount: 8470000 },
        { month: "Сен", sales: 131, amount: 9170000 },
        { month: "Окт", sales: 112, amount: 7840000 },
        { month: "Ноя", sales: 150, amount: 10500000 },
        { month: "Дек", sales: 118, amount: 8260000 }
      ];
      
      // Если выбран конкретный регион
      if (selectedRegion !== 'all') {
        // Детальные данные по модификациям и цветам для выбранного региона
        modelData = carModels.map(model => ({
          id: model.id,
          name: model.name,
          sales: Math.round(30 + Math.random() * 80),
          amount: Math.round((3000000 + Math.random() * 8000000))
        }));
        
        monthlyData = monthlyData.map(item => ({
          ...item,
          sales: Math.round(item.sales * 0.7),
          amount: Math.round(item.amount * 0.7)
        }));
      }
      
      // Если выбрана конкретная модель
      if (selectedModel !== 'all') {
        // Данные по регионам для выбранной модели
        regionData = regions.map(region => ({
          id: region.id,
          name: region.name,
          sales: Math.round(20 + Math.random() * 60),
          amount: Math.round((2000000 + Math.random() * 6000000))
        }));
        
        // Генерируем данные по модификациям и цветам для выбранной модели
        modelData = [];
        
        // Добавляем данные о модификациях
        carModifications.forEach(modification => {
          modelData.push({
            id: `mod-${modification.toLowerCase()}`,
            name: `${carModels.find(m => m.id === selectedModel)?.name || 'Автомобиль'} ${modification}`,
            sales: Math.round(10 + Math.random() * 40),
            amount: Math.round((1000000 + Math.random() * 4000000))
          });
        });
        
        // Добавляем данные о цветах
        carColors.forEach(color => {
          modelData.push({
            id: `color-${color.toLowerCase()}`,
            name: `Цвет: ${color}`,
            sales: Math.round(5 + Math.random() * 25),
            amount: Math.round((500000 + Math.random() * 2000000))
          });
        });
        
        // Модифицируем временные данные для выбранной модели
        monthlyData = monthlyData.map(item => ({
          ...item,
          sales: Math.round(item.sales * 0.4),
          amount: Math.round(item.amount * 0.4)
        }));
      }
      
      return { regionData, modelData, monthlyData };
    };
    
    const getStockData = () => {
      let regionData = regions.map(region => ({
        id: region.id,
        name: region.name,
        stock: Math.round(20 + Math.random() * 40),
        amount: Math.round((2000000 + Math.random() * 4000000))
      }));
      
      let modelData = carModels.map(model => ({
        id: model.id,
        name: model.name,
        stock: Math.round(15 + Math.random() * 35),
        amount: Math.round((1500000 + Math.random() * 3500000))
      }));
      
      let monthlyData = [
        { month: "Янв", stock: 22, amount: 1540000 },
        { month: "Фев", stock: 28, amount: 1960000 },
        { month: "Мар", stock: 32, amount: 2240000 },
        { month: "Апр", stock: 24, amount: 1680000 },
        { month: "Май", stock: 35, amount: 2450000 },
        { month: "Июн", stock: 27, amount: 1890000 },
        { month: "Июл", stock: 30, amount: 2100000 },
        { month: "Авг", stock: 33, amount: 2310000 },
        { month: "Сен", stock: 29, amount: 2030000 },
        { month: "Окт", stock: 26, amount: 1820000 },
        { month: "Ноя", stock: 31, amount: 2170000 },
        { month: "Дек", stock: 25, amount: 1750000 }
      ];
      
      // Если выбран конкретный регион
      if (selectedRegion !== 'all') {
        // Детальные данные по модификациям и цветам для выбранного региона
        modelData = carModels.map(model => ({
          id: model.id,
          name: model.name,
          stock: Math.round(10 + Math.random() * 30),
          amount: Math.round((1000000 + Math.random() * 3000000))
        }));
        
        monthlyData = monthlyData.map(item => ({
          ...item,
          stock: Math.round(item.stock * 0.7),
          amount: Math.round(item.amount * 0.7)
        }));
      }
      
      // Если выбрана конкретная модель
      if (selectedModel !== 'all') {
        // Данные по регионам для выбранной модели
        regionData = regions.map(region => ({
          id: region.id,
          name: region.name,
          stock: Math.round(5 + Math.random() * 15),
          amount: Math.round((500000 + Math.random() * 1500000))
        }));
        
        // Генерируем данные по модификациям и цветам для выбранной модели
        modelData = [];
        
        // Добавляем данные о модификациях
        carModifications.forEach(modification => {
          modelData.push({
            id: `mod-${modification.toLowerCase()}`,
            name: `${carModels.find(m => m.id === selectedModel)?.name || 'Автомобиль'} ${modification}`,
            stock: Math.round(3 + Math.random() * 10),
            amount: Math.round((300000 + Math.random() * 1000000))
          });
        });
        
        // Добавляем данные о цветах
        carColors.forEach(color => {
          modelData.push({
            id: `color-${color.toLowerCase()}`,
            name: `Цвет: ${color}`,
            stock: Math.round(2 + Math.random() * 8),
            amount: Math.round((200000 + Math.random() * 800000))
          });
        });
        
        // Модифицируем временные данные для выбранной модели
        monthlyData = monthlyData.map(item => ({
          ...item,
          stock: Math.round(item.stock * 0.4),
          amount: Math.round(item.amount * 0.4)
        }));
      }
      
      return { regionData, modelData, monthlyData };
    };
    
    if (activeTab === 'contracts') {
      return getContractsData();
    } else if (activeTab === 'sales') {
      return getSalesData();
    } else if (activeTab === 'stock') {
      return getStockData();
    }
    
    return { regionData: [], modelData: [], monthlyData: [] };
  };
  
  // Render all charts based on active tab
  const renderCharts = () => {
    if (activeTab === 'contracts') {
      renderContractsCharts();
    } else if (activeTab === 'sales') {
      renderSalesCharts();
    } else if (activeTab === 'stock') {
      renderStockCharts();
    }
  };
  
  // Render contracts section charts
  const renderContractsCharts = () => {
    const { regionData, modelData, monthlyData } = getFilteredData();
    
    renderBarChart(regionContractsRef, regionData, 'contracts', 'name', getRegionChartTitle(), '#4CAF50');
    renderBarChart(modelContractsRef, modelData, 'contracts', 'name', getModelChartTitle(), '#2196F3');
    renderTimelineChart(timelineContractsRef, monthlyData, 'contracts', 'month', getTimelineChartTitle());
  };
  
  // Render sales section charts
  const renderSalesCharts = () => {
    const { regionData, modelData, monthlyData } = getFilteredData();
    
    renderBarChart(regionSalesRef, regionData, 'sales', 'name', getRegionChartTitle(), '#FF9800');
    renderBarChart(modelSalesRef, modelData, 'sales', 'name', getModelChartTitle(), '#E91E63');
    renderTimelineChart(timelineSalesRef, monthlyData, 'sales', 'month', getTimelineChartTitle());
  };
  
  // Render stock section charts
  const renderStockCharts = () => {
    const { regionData, modelData, monthlyData } = getFilteredData();
    
    renderBarChart(regionStockRef, regionData, 'stock', 'name', getRegionChartTitle(), '#9C27B0');
    renderBarChart(modelStockRef, modelData, 'stock', 'name', getModelChartTitle(), '#607D8B');
    renderTimelineChart(stockTrendRef, monthlyData, 'stock', 'month', getTimelineChartTitle());
  };
  
  // Функции для формирования заголовков графиков в зависимости от выбранных фильтров
  const getRegionChartTitle = () => {
    if (selectedModel !== 'all') {
      const modelName = carModels.find(m => m.id === selectedModel)?.name || 'Выбранной модели';
      return `${activeTab === 'contracts' ? 'Контракты' : activeTab === 'sales' ? 'Продажи' : 'Остаток'} ${modelName} по регионам`;
    }
    return `${activeTab === 'contracts' ? 'Контракты' : activeTab === 'sales' ? 'Продажи' : 'Остаток'} по регионам`;
  };
  
  const getModelChartTitle = () => {
    if (selectedRegion !== 'all') {
      const regionName = regions.find(r => r.id === selectedRegion)?.name || 'Выбранном регионе';
      return `${activeTab === 'contracts' ? 'Контракты' : activeTab === 'sales' ? 'Продажи' : 'Остаток'} в ${regionName} по моделям`;
    }
    if (selectedModel !== 'all') {
      const modelName = carModels.find(m => m.id === selectedModel)?.name || 'Выбранной модели';
      return `${activeTab === 'contracts' ? 'Контракты' : activeTab === 'sales' ? 'Продажи' : 'Остаток'} ${modelName} по модификациям и цветам`;
    }
    return `${activeTab === 'contracts' ? 'Контракты' : activeTab === 'sales' ? 'Продажи' : 'Остаток'} по моделям`;
  };
  
  const getTimelineChartTitle = () => {
    if (selectedRegion !== 'all') {
      const regionName = regions.find(r => r.id === selectedRegion)?.name || 'Выбранном регионе';
      return `Динамика ${activeTab === 'contracts' ? 'контрактов' : activeTab === 'sales' ? 'продаж' : 'остатков'} в ${regionName}`;
    }
    if (selectedModel !== 'all') {
      const modelName = carModels.find(m => m.id === selectedModel)?.name || 'Выбранной модели';
      return `Динамика ${activeTab === 'contracts' ? 'контрактов' : activeTab === 'sales' ? 'продаж' : 'остатков'} ${modelName}`;
    }
    return `Динамика ${activeTab === 'contracts' ? 'контрактов' : activeTab === 'sales' ? 'продаж' : 'остатков'}`;
  };
  
  // Generic bar chart renderer
  const renderBarChart = (ref, data, valueKey, labelKey, title, color) => {
    if (!ref.current) return;
    
    const container = ref.current;
    container.innerHTML = '';
    
    const margin = { top: 30, right: 30, bottom: 60, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;
    
    const svg = d3.select(container)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
      
    // Add gradient for bars
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", `barGradient-${valueKey}`)
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "0%").attr("y2", "100%");
      
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", color)
      .attr("stop-opacity", 0.8);
      
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", color)
      .attr("stop-opacity", 0.3);
      
    // Scales
    const x = d3.scaleBand()
      .domain(data.map(d => d[labelKey]))
      .range([0, width])
      .padding(0.3);
      
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d[valueKey]) * 1.1])
      .range([height, 0]);
      
    // Grid lines
    svg.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat("")
      )
      .style("stroke", "#333")
      .style("stroke-opacity", "0.1");
      
    // Axes
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)")
      .style("fill", "#999");
      
    svg.append("g")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("fill", "#999");
    
    // Title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "#fff")
      .text(title);
      
    // Bars with animation
    svg.selectAll(".bar")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d[labelKey]))
      .attr("width", x.bandwidth())
      .attr("fill", `url(#barGradient-${valueKey})`)
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("y", height)
      .attr("height", 0)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 50)
      .attr("y", d => y(d[valueKey]))
      .attr("height", d => height - y(d[valueKey]));
    
    // Value labels
    svg.selectAll(".label")
      .data(data)
      .enter().append("text")
      .attr("class", "label")
      .attr("x", d => x(d[labelKey]) + x.bandwidth() / 2)
      .attr("y", d => y(d[valueKey]) - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "#fff")
      .style("opacity", 0)
      .text(d => d[valueKey])
      .transition()
      .duration(500)
      .delay((d, i) => 1000 + i * 50)
      .style("opacity", 1);
  };
  
  // Timeline chart renderer
  const renderTimelineChart = (ref, data, valueKey, labelKey, title) => {
    if (!ref.current) return;
    
    const container = ref.current;
    container.innerHTML = '';
    
    const margin = { top: 30, right: 30, bottom: 40, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;
    
    const svg = d3.select(container)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
      
    // Add gradient for area
    const defs = svg.append("defs");
    const areaGradient = defs.append("linearGradient")
      .attr("id", `areaGradient-${valueKey}`)
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "0%").attr("y2", "100%");
      
    areaGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#3b82f6")
      .attr("stop-opacity", 0.7);
      
    areaGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#3b82f6")
      .attr("stop-opacity", 0.1);
    
    // Add gradient for line
    const lineGradient = defs.append("linearGradient")
      .attr("id", `lineGradient-${valueKey}`)
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "100%").attr("y2", "0%");
      
    lineGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#3b82f6");
      
    lineGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#8b5cf6");
      
    // Scales
    const x = d3.scaleBand()
      .domain(data.map(d => d[labelKey]))
      .range([0, width])
      .padding(1);
      
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d[valueKey]) * 1.2])
      .range([height, 0]);
      
    // Grid
    svg.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat("")
      )
      .style("stroke", "#333")
      .style("stroke-opacity", "0.1");
      
    // Axes
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("fill", "#999");
      
    svg.append("g")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("fill", "#999");
    
    // Title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "#fff")
      .text(title);
      
    // Create line
    const line = d3.line()
      .x(d => x(d[labelKey]) + x.bandwidth()/2)
      .y(d => y(d[valueKey]))
      .curve(d3.curveMonotoneX);
      
    // Create area
    const area = d3.area()
      .x(d => x(d[labelKey]) + x.bandwidth()/2)
      .y0(height)
      .y1(d => y(d[valueKey]))
      .curve(d3.curveMonotoneX);
      
    // Add area
    svg.append("path")
      .datum(data)
      .attr("class", "area")
      .attr("d", area)
      .attr("fill", `url(#areaGradient-${valueKey})`);
      
    // Add line with animation
    const path = svg.append("path")
      .datum(data)
      .attr("class", "line")
      .attr("d", line)
      .attr("stroke", `url(#lineGradient-${valueKey})`)
      .attr("stroke-width", 3)
      .attr("fill", "none");
    
    // Animate line
    const totalLength = path.node().getTotalLength();
    path
      .attr("stroke-dasharray", totalLength)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(1500)
      .attr("stroke-dashoffset", 0);
      
// Add dots
   svg.selectAll(".dot")
     .data(data)
     .enter().append("circle")
     .attr("class", "dot")
     .attr("cx", d => x(d[labelKey]) + x.bandwidth()/2)
     .attr("cy", d => y(d[valueKey]))
     .attr("r", 0)
     .attr("fill", "#3b82f6")
     .attr("stroke", "#1e1e1e")
     .attr("stroke-width", 2)
     .transition()
     .delay((d, i) => 1500 + i * 50)
     .duration(300)
     .attr("r", 5);
     
   // Add tooltips
   const tooltip = d3.select("body").append("div")
     .attr("class", `tooltip-${valueKey}`)
     .style("opacity", 0)
     .style("position", "absolute")
     .style("background-color", "rgba(40, 40, 40, 0.9)")
     .style("color", "#fff")
     .style("padding", "10px")
     .style("border-radius", "5px")
     .style("font-size", "14px")
     .style("pointer-events", "none")
     .style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.3)")
     .style("z-index", "10");
     
   svg.selectAll(".dot")
     .on("mouseover", function(event, d) {
       d3.select(this).transition()
         .duration(200)
         .attr("r", 8);
         
       tooltip.transition()
         .duration(200)
         .style("opacity", 1);
         
       tooltip.html(`
         <strong>${d[labelKey]}</strong><br>
         ${valueKey === 'contracts' ? 'Контрактов: ' : 
           valueKey === 'sales' ? 'Продаж: ' : 'Остаток: '}
         <strong>${d[valueKey]}</strong><br>
         Сумма: <strong>${formatCurrency(d.amount)}</strong>
       `)
         .style("left", (event.pageX + 10) + "px")
         .style("top", (event.pageY - 28) + "px");
     })
     .on("mouseout", function() {
       d3.select(this).transition()
         .duration(200)
         .attr("r", 5);
         
       tooltip.transition()
         .duration(500)
         .style("opacity", 0);
     });
 };
 
 // Format currency for display
 const formatCurrency = (value) => {
   return new Intl.NumberFormat('ru-RU', {
     style: 'currency',
     currency: 'UZS',
     maximumFractionDigits: 0
   }).format(value);
 };
 
 // Calculate statistics based on active tab
 const getStats = () => {
   const { monthlyData } = getFilteredData();
   
   if (activeTab === 'contracts') {
     const totalContracts = monthlyData.reduce((sum, item) => sum + item.contracts, 0);
     const totalAmount = monthlyData.reduce((sum, item) => sum + item.amount, 0);
     
     return {
       count: totalContracts,
       amount: totalAmount,
       average: Math.round(totalAmount / totalContracts)
     };
   } else if (activeTab === 'sales') {
     const totalSales = monthlyData.reduce((sum, item) => sum + item.sales, 0);
     const totalAmount = monthlyData.reduce((sum, item) => sum + item.amount, 0);
     
     return {
       count: totalSales,
       amount: totalAmount,
       average: Math.round(totalAmount / totalSales)
     };
   } else {
     const totalStock = monthlyData.reduce((sum, item) => sum + item.stock, 0) / monthlyData.length;
     const totalAmount = monthlyData.reduce((sum, item) => sum + item.amount, 0) / monthlyData.length;
     
     return {
       count: Math.round(totalStock),
       amount: totalAmount,
       average: Math.round(totalAmount / totalStock)
     };
   }
 };
 
 const stats = getStats();
 
 // Получаем детальное описание выбранных фильтров
 const getFilterDescription = () => {
   let description = '';
   
   if (selectedRegion !== 'all') {
     const regionName = regions.find(r => r.id === selectedRegion)?.name || '';
     description += `Регион: ${regionName}`;
   }
   
   if (selectedModel !== 'all') {
     const modelName = carModels.find(m => m.id === selectedModel)?.name || '';
     description += description ? ` | Модель: ${modelName}` : `Модель: ${modelName}`;
   }
   
   return description || 'Все данные';
 };
 
 // Компонент миниатюры авто
 const CarModelThumbnail = ({ model, isSelected, onClick }) => {
   return (
     <div 
       className={`bg-gray-800 p-3 rounded-lg shadow-lg flex items-center cursor-pointer border transition-all duration-300 ${
         isSelected ? 'border-blue-500 transform scale-105' : 'border-gray-700 hover:border-gray-500'
       }`}
       onClick={onClick}
     >
       <img 
         src={model.img}
         alt={model.name}
         className="w-12 h-12 object-contain mr-3"
       />
       <div>
         <h3 className="font-medium text-white">{model.name}</h3>
         <p className="text-sm text-gray-400 capitalize">{model.category}</p>
       </div>
     </div>
   );
 };

 return (
   <div className="p-5 bg-gray-900 text-gray-100 min-h-screen">
     <h1 className="text-3xl font-semibold mb-6">Аналитика автомобилей</h1>
     
     {/* Filter Panel */}
     <div className="bg-gray-800 p-5 rounded-lg shadow-lg mb-8 flex flex-wrap gap-4 justify-between items-center">
       <div className="flex flex-wrap items-center gap-4">
         <div className="flex items-center">
           <span className="text-gray-400 mr-2">Регион:</span>
           <select 
             value={selectedRegion}
             onChange={(e) => setSelectedRegion(e.target.value)}
             className="bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white min-w-[200px]"
           >
             <option value="all">Все регионы</option>
             {regions.map(region => (
               <option key={region.id} value={region.id}>{region.name}</option>
             ))}
           </select>
         </div>
         
         <div className="flex items-center">
           <span className="text-gray-400 mr-2">Модель:</span>
           <select 
             value={selectedModel}
             onChange={(e) => setSelectedModel(e.target.value)}
             className="bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white min-w-[200px]"
           >
             <option value="all">Все модели</option>
             {carModels.map(model => (
               <option key={model.id} value={model.id}>
                 {model.name}
               </option>
             ))}
           </select>
         </div>
       </div>
       
       <div className="flex items-center gap-4">
         <div className="flex items-center">
           <span className="text-gray-400 mr-2">С:</span>
           <input 
             type="date" 
             value={startDate}
             onChange={(e) => setStartDate(e.target.value)}
             className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
           />
         </div>
         <div className="flex items-center">
           <span className="text-gray-400 mr-2">По:</span>
           <input 
             type="date" 
             value={endDate}
             onChange={(e) => setEndDate(e.target.value)}
             className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
           />
         </div>
       </div>
     </div>
     
     {/* Active Filters */}
     {(selectedRegion !== 'all' || selectedModel !== 'all') && (
       <div className="bg-blue-900/20 border-l-4 border-blue-500 p-3 rounded-r-lg mb-6 flex justify-between items-center">
         <div className="flex items-center">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
             <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
           </svg>
           <p className="text-gray-300">
             <span className="font-medium text-blue-400">Активные фильтры:</span> {getFilterDescription()}
           </p>
         </div>
         <button 
           className="text-sm text-blue-400 hover:text-blue-300 flex items-center"
           onClick={() => {
             setSelectedRegion('all');
             setSelectedModel('all');
           }}
         >
           Сбросить фильтры
           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
             <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
           </svg>
         </button>
       </div>
     )}
     
     {/* Tabs */}
     <div className="flex border-b border-gray-700 mb-6">
       <button
         className={`py-3 px-6 font-medium ${
           activeTab === 'contracts' 
             ? 'text-blue-400 border-b-2 border-blue-400' 
             : 'text-gray-400 hover:text-gray-300'
         }`}
         onClick={() => setActiveTab('contracts')}
       >
         Контракты/Реализация
       </button>
       <button
         className={`py-3 px-6 font-medium ${
           activeTab === 'sales' 
             ? 'text-blue-400 border-b-2 border-blue-400' 
             : 'text-gray-400 hover:text-gray-300'
         }`}
         onClick={() => setActiveTab('sales')}
       >
         Реализация
       </button>
       <button
         className={`py-3 px-6 font-medium ${
           activeTab === 'stock' 
             ? 'text-blue-400 border-b-2 border-blue-400' 
             : 'text-gray-400 hover:text-gray-300'
         }`}
         onClick={() => setActiveTab('stock')}
       >
         Остаток
       </button>
     </div>
     
     {/* Summary Cards */}
     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
       <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
         <div className="flex justify-between items-start mb-4">
           <div>
             <h3 className="text-lg font-medium text-white">
               {activeTab === 'contracts' ? 'Общее количество контрактов' : 
                activeTab === 'sales' ? 'Общий объем продаж' : 
                'Общий остаток'}
             </h3>
             <p className="text-gray-400 text-sm mt-1">За выбранный период</p>
           </div>
           <p className="text-2xl font-bold">{stats.count.toLocaleString('ru-RU')}</p>
         </div>
         <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
           <div className="bg-blue-500 h-full rounded-full" style={{ width: '70%' }}></div>
         </div>
       </div>
       
       <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
         <div className="flex justify-between items-start mb-4">
           <div>
             <h3 className="text-lg font-medium text-white">Общая сумма</h3>
             <p className="text-gray-400 text-sm mt-1">За выбранный период</p>
           </div>
           <p className="text-2xl font-bold">{formatCurrency(stats.amount)}</p>
         </div>
         <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
           <div className="bg-green-500 h-full rounded-full" style={{ width: '65%' }}></div>
         </div>
       </div>
       
       <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
         <div className="flex justify-between items-start mb-4">
           <div>
             <h3 className="text-lg font-medium text-white">
               {activeTab === 'contracts' ? 'Средняя стоимость контракта' : 
                activeTab === 'sales' ? 'Средняя стоимость продажи' : 
                'Средняя стоимость остатка'}
             </h3>
             <p className="text-gray-400 text-sm mt-1">За выбранный период</p>
           </div>
           <p className="text-2xl font-bold">{formatCurrency(stats.average)}</p>
         </div>
         <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
           <div className="bg-purple-500 h-full rounded-full" style={{ width: '80%' }}></div>
         </div>
       </div>
     </div>
     
     {/* Модельный ряд - отображается только если не выбрана конкретная модель */}
     {selectedModel === 'all' && (
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
         {carModels.map(model => (
           <CarModelThumbnail 
             key={model.id} 
             model={model} 
             isSelected={selectedModel === model.id}
             onClick={() => setSelectedModel(model.id)}
           />
         ))}
       </div>
     )}
     
     {/* Если выбрана конкретная модель, отображаем её детали */}
     {selectedModel !== 'all' && (
       <div className="bg-gray-800 p-5 rounded-lg shadow-lg mb-8">
         <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
           <img 
             src={carModels.find(m => m.id === selectedModel)?.img} 
             alt={carModels.find(m => m.id === selectedModel)?.name}
             className="w-32 h-32 object-contain"
           />
           <div>
             <h3 className="text-xl font-bold text-white mb-2">
               {carModels.find(m => m.id === selectedModel)?.name}
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div>
                 <p className="text-gray-400 text-sm">Категория:</p>
                 <p className="text-white font-medium capitalize">
                   {carModels.find(m => m.id === selectedModel)?.category}
                 </p>
               </div>
               <div>
                 <p className="text-gray-400 text-sm">Стоимость:</p>
                 <p className="text-white font-medium">
                   {formatCurrency(carModels.find(m => m.id === selectedModel)?.price || 0)}
                 </p>
               </div>
               <div>
                 <p className="text-gray-400 text-sm">Производитель:</p>
                 <p className="text-white font-medium">
                   {carModels.find(m => m.id === selectedModel)?.production || 'UzAuto Motors'}
                 </p>
               </div>
             </div>
             <button 
               className="mt-4 text-blue-400 text-sm flex items-center"
               onClick={() => setSelectedModel('all')}
             >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
               </svg>
               Вернуться ко всем моделям
             </button>
           </div>
         </div>
       </div>
     )}
     
     {/* Main Charts Section */}
     {activeTab === 'contracts' && (
       <>
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
           <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
             <h3 className="text-xl font-semibold mb-4">{getRegionChartTitle()}</h3>
             <div 
               ref={regionContractsRef} 
               className="w-full h-[300px]"
             ></div>
           </div>
           
           <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
             <h3 className="text-xl font-semibold mb-4">{getModelChartTitle()}</h3>
             <div 
               ref={modelContractsRef} 
               className="w-full h-[300px]"
             ></div>
           </div>
         </div>
         
         <div className="bg-gray-800 p-5 rounded-lg shadow-lg mb-8">
           <h3 className="text-xl font-semibold mb-4">{getTimelineChartTitle()}</h3>
           <div 
             ref={timelineContractsRef} 
             className="w-full h-[300px]"
           ></div>
         </div>
       </>
     )}
     
     {activeTab === 'sales' && (
       <>
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
           <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
             <h3 className="text-xl font-semibold mb-4">{getRegionChartTitle()}</h3>
             <div 
               ref={regionSalesRef} 
               className="w-full h-[300px]"
             ></div>
           </div>
           
           <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
             <h3 className="text-xl font-semibold mb-4">{getModelChartTitle()}</h3>
             <div 
               ref={modelSalesRef} 
               className="w-full h-[300px]"
             ></div>
           </div>
         </div>
         
         <div className="bg-gray-800 p-5 rounded-lg shadow-lg mb-8">
           <h3 className="text-xl font-semibold mb-4">{getTimelineChartTitle()}</h3>
           <div 
             ref={timelineSalesRef} 
             className="w-full h-[300px]"
           ></div>
         </div>
       </>
     )}
     
     {activeTab === 'stock' && (
       <>
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
           <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
             <h3 className="text-xl font-semibold mb-4">{getRegionChartTitle()}</h3>
             <div 
               ref={regionStockRef} 
               className="w-full h-[300px]"
             ></div>
           </div>
           
           <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
             <h3 className="text-xl font-semibold mb-4">{getModelChartTitle()}</h3>
             <div 
               ref={modelStockRef} 
               className="w-full h-[300px]"
             ></div>
           </div>
         </div>
         
         <div className="bg-gray-800 p-5 rounded-lg shadow-lg mb-8">
           <h3 className="text-xl font-semibold mb-4">{getTimelineChartTitle()}</h3>
           <div 
             ref={stockTrendRef} 
             className="w-full h-[300px]"
           ></div>
         </div>
       </>
     )}
     
     <div className="bg-blue-900/20 border-l-4 border-blue-500 p-5 rounded-r-lg mb-8">
       <h3 className="text-xl font-semibold text-blue-400 mb-2">Информация об аналитической панели</h3>
       <p className="text-gray-300">
         Эта панель показывает полную аналитику по контрактам, реализации и остаткам автомобилей. 
         Используйте вкладки вверху для переключения между различными типами данных. 
         Вы можете фильтровать данные по регионам и моделям используя соответствующие селекторы.
         При выборе конкретной модели отображается детальная статистика по модификациям и цветам.
       </p>
     </div>
   </div>
 );
};

export default CarContractsAnalytics;