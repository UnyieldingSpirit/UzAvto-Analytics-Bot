"use client";

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { D3Visualizer } from '@/src/utils/dataVisualizer';
import * as d3 from 'd3';
import { carModels } from '@/src/shared/mocks/mock-data';

export default function Statistics() {
  // State variables
  const [view, setView] = useState('models');
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [chartType, setChartType] = useState('bar');
  const [animateCards, setAnimateCards] = useState(true);
  const [data, setData] = useState({
    modelData: [],
    dealerData: [],
    salespersonData: [],
    trendData: []
  });
  
  // Период времени - новое состояние
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 6)),
    endDate: new Date(),
    preset: 'last6Months'
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Refs for chart containers
  const modelChartRef = useRef(null);
  const modelSecondaryChartRef = useRef(null);
  const dealerChartRef = useRef(null);
  const dealerSecondaryChartRef = useRef(null);
  const salespersonChartRef = useRef(null);
  const salespersonSecondaryChartRef = useRef(null);
  const trendChartRef = useRef(null);
  const datePickerRef = useRef(null);

  // Filtered data
  const filteredDealerData = selectedModel
    ? data.dealerData.filter(d => d.modelId === selectedModel.id)
    : [];

  const filteredSalespersonData = (selectedModel && selectedDealer)
    ? data.salespersonData.filter(
        d => d.modelId === selectedModel.id && d.dealerId === selectedDealer.dealerId
      )
    : [];

  // Event handlers
  const handleModelClick = (model) => {
    setSelectedModel(model);
    setView('dealers');
    setAnimateCards(true);
  };

  const handleDealerClick = (dealer) => {
    setSelectedDealer(dealer);
    setView('salespeople');
    setAnimateCards(true);
  };

  const handleBackClick = () => {
    setAnimateCards(true);
    if (view === 'salespeople') {
      setView('dealers');
      setSelectedDealer(null);
    } else if (view === 'dealers') {
      setView('models');
      setSelectedModel(null);
    }
  };
  
  // Обработчики для датапикера
  const handleDateRangeChange = (newRange) => {
    setDateRange({
      ...dateRange,
      ...newRange,
      preset: 'custom'
    });
    refreshDataWithDateRange({...dateRange, ...newRange});
  };
  
  const handlePresetSelect = (preset) => {
    let startDate = new Date();
    const endDate = new Date();
    
    switch(preset) {
      case 'last7Days':
        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'last30Days':
        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 30);
        break;
      case 'last3Months':
        startDate = new Date(endDate);
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'last6Months':
        startDate = new Date(endDate);
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case 'last12Months':
        startDate = new Date(endDate);
        startDate.setMonth(endDate.getMonth() - 12);
        break;
      case 'thisYear':
        startDate = new Date(endDate.getFullYear(), 0, 1);
        break;
      case 'lastYear':
        startDate = new Date(endDate.getFullYear() - 1, 0, 1);
        endDate.setFullYear(endDate.getFullYear() - 1, 11, 31);
        break;
    }
    
    const newRange = { startDate, endDate, preset };
    setDateRange(newRange);
    refreshDataWithDateRange(newRange);
    setShowDatePicker(false);
  };
  
  // Функция обновления данных с учетом выбранного периода
  const refreshDataWithDateRange = (range) => {
    const newData = generateDemoData(range.startDate, range.endDate);
    setData(newData);
  };

  // Закрытие датапикера при клике вне его области
  useEffect(() => {
    function handleClickOutside(event) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [datePickerRef]);

  // Форматирование даты для отображения
  const formatDate = (date) => {
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  
  // Получение названия периода
  const getDateRangeLabel = () => {
    const { preset, startDate, endDate } = dateRange;
    
    switch(preset) {
      case 'last7Days': return 'Последние 7 дней';
      case 'last30Days': return 'Последние 30 дней';
      case 'last3Months': return 'Последние 3 месяца';
      case 'last6Months': return 'Последние 6 месяцев';
      case 'last12Months': return 'Последние 12 месяцев';
      case 'thisYear': return 'Текущий год';
      case 'lastYear': return 'Прошлый год';
      case 'custom': return `${formatDate(startDate)} — ${formatDate(endDate)}`;
      default: return `${formatDate(startDate)} — ${formatDate(endDate)}`;
    }
  };

  // Generate demo data
  const generateDemoData = (startDate = dateRange.startDate, endDate = dateRange.endDate) => {
    // Используем данные из mock-data.js
    const models = carModels.map((car, index) => {
      const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];
      return {
        id: car.id,
        name: car.name,
        color: colors[index % colors.length],
        img: car.img,
        category: car.category
      };
    });

    const dealers = [
      { id: 1, name: 'Премиум Моторс' },
      { id: 2, name: 'Luxury Auto' },
      { id: 3, name: 'Elite Cars' },
      { id: 4, name: 'City Dealership' },
    ];

    const salespeople = [
      { id: 1, name: 'Алексей Иванов', dealerId: 1 },
      { id: 2, name: 'Сергей Петров', dealerId: 1 },
      { id: 3, name: 'Максим Сидоров', dealerId: 1 },
      { id: 4, name: 'Дмитрий Соколов', dealerId: 2 },
      { id: 5, name: 'Екатерина Морозова', dealerId: 2 },
      { id: 6, name: 'Мария Волкова', dealerId: 3 },
      { id: 7, name: 'Анна Смирнова', dealerId: 3 },
      { id: 8, name: 'Артём Козлов', dealerId: 4 },
      { id: 9, name: 'Николай Новиков', dealerId: 4 },
    ];

    // Модифицируем генерацию данных с учетом выбранного временного периода
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const multiplier = Math.max(1, daysDiff / 180); // Примерная нормализация по отношению к 6 месяцам
    
    const modelData = models.map(model => {
      // Масштабируем значения в зависимости от выбранного периода
      return {
        id: model.id,
        name: model.name,
        color: model.color,
        img: model.img,
        category: model.category,
        totalSales: Math.floor((Math.random() * 1000 + 200) * multiplier),
      };
    });

    const dealerData = [];
    models.forEach(model => {
      dealers.forEach(dealer => {
        const sales = Math.floor((Math.random() * 300 + 20) * multiplier);
        dealerData.push({
          modelId: model.id,
          dealerId: dealer.id,
          dealerName: dealer.name,
          modelName: model.name,
          sales: sales,
          color: model.color,
        });
      });
    });

    const salespersonData = [];
    dealerData.forEach(dealerRecord => {
      const dealerSalespeople = salespeople.filter(sp => sp.dealerId === dealerRecord.dealerId);
      
      let remainingSales = dealerRecord.sales;
      dealerSalespeople.forEach((salesperson, index) => {
        let sales;
        if (index === dealerSalespeople.length - 1) {
          sales = remainingSales;
        } else {
          sales = Math.floor(Math.random() * (remainingSales * 0.7));
          remainingSales -= sales;
        }
        
        salespersonData.push({
          modelId: dealerRecord.modelId,
          dealerId: dealerRecord.dealerId,
          salespersonId: salesperson.id,
          salespersonName: salesperson.name,
          modelName: dealerRecord.modelName,
          dealerName: dealerRecord.dealerName,
          sales: sales,
          color: dealerRecord.color,
        });
      });
    });

    // Генерация данных тренда с учетом выбранного периода
    const trendData = [];
    
    // Определяем интервал генерации точек данных в зависимости от длительности периода
    let interval = 1; // по умолчанию - 1 день
    if (daysDiff > 90) interval = 7; // если больше 3 месяцев - еженедельно
    if (daysDiff > 365) interval = 30; // если больше года - ежемесячно
    
    for (let i = 0; i <= daysDiff; i += interval) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      // Добавляем сезонность и тренд
      const monthFactor = 1 + 0.3 * Math.sin((date.getMonth() / 12) * Math.PI * 2);
      const trendFactor = 1 + (i / daysDiff) * 0.2; // Небольшой рост во времени
      
      trendData.push({
        date: date.toISOString().slice(0, 10),
        sales: Math.floor((Math.random() * 400 + 100) * monthFactor * trendFactor)
      });
    }

    return { modelData, dealerData, salespersonData, trendData };
  };

  // Render functions with our new D3 visualizer
  const renderModelCharts = () => {
    if (!modelChartRef.current || !modelSecondaryChartRef.current || !data.modelData.length) return;
    
    // Format data for D3 visualizer
    const chartData = data.modelData.map(model => ({
      id: model.id,
      label: model.name,
      value: model.totalSales,
      color: model.color,
      model: model
    }));
    
    // Primary chart
    if (chartType === 'bar') {
      D3Visualizer.createBarChart(chartData, {
        container: modelChartRef.current,
        title: `Продажи по моделям (${getDateRangeLabel()})`,
        onClick: (item) => handleModelClick(item.model),
        height: 400
      });
    } else if (chartType === 'pie') {
      D3Visualizer.createPieChart(chartData, {
        container: modelChartRef.current,
        title: `Доля рынка по моделям (${getDateRangeLabel()})`,
        onClick: (item) => handleModelClick(item.model),
        height: 400
      });
    } else if (chartType === 'stacked') {
      // Группировка данных для stacked chart
      const dealersByModel = data.dealerData.reduce((acc, dealer) => {
        const model = data.modelData.find(m => m.id === dealer.modelId);
        if (!model) return acc;
        
        if (!acc[model.name]) {
          acc[model.name] = {
            category: model.name,
            values: []
          };
        }
        
        acc[model.name].values.push({
          label: dealer.dealerName,
          value: dealer.sales
        });
        
        return acc;
      }, {});

      D3Visualizer.createStackedBarChart(Object.values(dealersByModel), {
        container: modelChartRef.current,
        title: `Продажи по моделям и дилерам (${getDateRangeLabel()})`,
        onClick: (item) => {
          const model = data.modelData.find(m => m.name === item.category);
          if (model) handleModelClick(model);
        },
        height: 400
      });
    }
    
    // Secondary chart - тренд продаж
    if (trendChartRef.current && data.trendData.length) {
      D3Visualizer.createAreaChart(data.trendData.map(d => ({
        x: d.date,
        y: d.sales
      })), {
        container: trendChartRef.current,
        title: `Тренд продаж за период: ${getDateRangeLabel()}`,
        height: 300,
        colors: ['#10b981']
      });
    }
    
    // Вторичный график - диаграмма рассеяния цена vs продажи
    const scatterData = data.modelData.map(model => ({
      x: Math.random() * 50000 + 50000, // Примерная цена
      y: model.totalSales,
      label: model.name,
      size: model.totalSales / 50,
      group: model.name,
      model
    }));
    
    D3Visualizer.createScatterPlot(scatterData, {
      container: modelSecondaryChartRef.current,
      title: `Соотношение цены и объема продаж (${getDateRangeLabel()})`,
      onClick: (item) => handleModelClick(item.model),
      height: 400,
      colors: data.modelData.map(m => m.color)
    });
  };

  const renderDealerCharts = () => {
    if (!dealerChartRef.current || !dealerSecondaryChartRef.current || !filteredDealerData.length || !selectedModel) return;
    
    // Формат данных для D3 визуализатора
    const chartData = filteredDealerData.map(dealer => ({
      id: dealer.dealerId,
      label: dealer.dealerName,
      value: dealer.sales,
      color: selectedModel.color,
      dealer
    }));
    
    // Primary chart
    if (chartType === 'bar') {
      D3Visualizer.createBarChart(chartData, {
        container: dealerChartRef.current,
        title: `Продажи ${selectedModel.name} по дилерам (${getDateRangeLabel()})`,
        onClick: (item) => handleDealerClick(item.dealer),
        height: 400,
        colors: chartData.map((_, i) => {
          // Creating color variations
          const baseColor = selectedModel.color;
          const hslColor = d3.hsl(baseColor);
          hslColor.l = 0.4 + (i * 0.1);
          return hslColor.toString();
        })
      });
    } else if (chartType === 'pie') {
      D3Visualizer.createPieChart(chartData, {
        container: dealerChartRef.current,
        title: `Доля продаж ${selectedModel.name} по дилерам (${getDateRangeLabel()})`,
        onClick: (item) => handleDealerClick(item.dealer),
        height: 400,
        colors: chartData.map((_, i) => {
          // Creating color variations
          const baseColor = selectedModel.color;
          const hslColor = d3.hsl(baseColor);
          hslColor.l = 0.4 + (i * 0.1);
          return hslColor.toString();
        })
      });
    }
    
    // Secondary chart - Stacked bar для продавцов по дилерам
    const dealerSalespersonData = data.salespersonData.filter(sp => sp.modelId === selectedModel.id);
    const salespeopleByDealer = dealerSalespersonData.reduce((acc, salesperson) => {
      if (!acc[salesperson.dealerName]) {
        acc[salesperson.dealerName] = {
          category: salesperson.dealerName,
          values: []
        };
      }
      
      acc[salesperson.dealerName].values.push({
        label: salesperson.salespersonName,
        value: salesperson.sales
      });
      
      return acc;
    }, {});

    D3Visualizer.createStackedBarChart(Object.values(salespeopleByDealer), {
      container: dealerSecondaryChartRef.current,
      title: `Продажи ${selectedModel.name} по продавцам (${getDateRangeLabel()})`,
      onClick: (item) => {
        const dealer = filteredDealerData.find(d => d.dealerName === item.category);
        if (dealer) handleDealerClick(dealer);
      },
      height: 400
    });
  };

  const renderSalespersonCharts = () => {
    if (!salespersonChartRef.current || !salespersonSecondaryChartRef.current || !filteredSalespersonData.length || !selectedModel || !selectedDealer) return;
    
    // Формат данных для D3 визуализатора
    const chartData = filteredSalespersonData.map(salesperson => ({
      id: salesperson.salespersonId,
      label: salesperson.salespersonName,
      value: salesperson.sales,
      color: selectedModel.color,
      salesperson
    }));
    
    // Primary chart
    if (chartType === 'bar') {
      D3Visualizer.createBarChart(chartData, {
        container: salespersonChartRef.current,
        title: `Продажи ${selectedModel.name} в ${selectedDealer.dealerName} (${getDateRangeLabel()})`,
        height: 400,
        colors: chartData.map((_, i) => {
          // Creating color variations
          const baseColor = selectedModel.color;
          const hslColor = d3.hsl(baseColor);
          hslColor.l = 0.4 + (i * 0.1);
          return hslColor.toString();
        })
      });
    } else if (chartType === 'pie') {
      D3Visualizer.createPieChart(chartData, {
        container: salespersonChartRef.current,
        title: `Доля продаж ${selectedModel.name} в ${selectedDealer.dealerName} (${getDateRangeLabel()})`,
        height: 400,
        colors: chartData.map((_, i) => {
          // Creating color variations
          const baseColor = selectedModel.color;
          const hslColor = d3.hsl(baseColor);
          hslColor.l = 0.4 + (i * 0.1);
          return hslColor.toString();
        })
      });
    }
    
    // Generate some mock monthly performance data for each salesperson
    const monthlyData = filteredSalespersonData.flatMap(salesperson => {
      const today = new Date();
      return Array.from({ length: 6 }).map((_, i) => {
        const date = new Date();
        date.setMonth(today.getMonth() - 5 + i);
        return {
          x: date.toISOString().slice(0, 7),
          y: Math.floor(Math.random() * 30) + 10,
          group: salesperson.salespersonName
        };
      });
    });

    // Group by month for line chart
    const monthlyByPerson = {};
    monthlyData.forEach(d => {
      if (!monthlyByPerson[d.group]) {
        monthlyByPerson[d.group] = [];
      }
      monthlyByPerson[d.group].push(d);
    });

    // Secondary chart - Performance over time
    const multiLineData = Object.entries(monthlyByPerson).map(([name, values]) => ({
      name,
      values: values.map(v => ({ date: v.x, value: v.y }))
    }));

    // Custom D3 rendering for multi-line chart
    const container = salespersonSecondaryChartRef.current;
    container.innerHTML = '';
    
    const width = container.clientWidth;
    const height = 400;
    const margin = { top: 40, right: 80, bottom: 60, left: 60 };
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('background', '#1f2937')
      .style('border-radius', '0.5rem');
      
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '1.2rem')
      .style('font-weight', 'bold')
      .style('fill', '#f9fafb')
      .text(`Динамика продаж за период: ${getDateRangeLabel()}`);
      
    const x = d3.scaleTime()
      .domain(d3.extent(monthlyData, d => new Date(d.x)))
      .range([margin.left, width - margin.right]);
      
    const y = d3.scaleLinear()
      .domain([0, d3.max(monthlyData, d => d.y)])
      .nice()
      .range([height - margin.bottom, margin.top]);
      
    const colorScale = d3.scaleOrdinal()
      .domain(Object.keys(monthlyByPerson))
      .range(d3.quantize(d => {
        const baseColor = selectedModel.color;
        const hslColor = d3.hsl(baseColor);
        hslColor.h += d * 180;
        return hslColor.toString();
      }, Object.keys(monthlyByPerson).length));
      
    const line = d3.line()
      .x(d => x(new Date(d.x)))
      .y(d => y(d.y))
      .curve(d3.curveMonotoneX);
      
    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat(d => d3.timeFormat('%b %Y')(d)))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text').style('fill', '#f9fafb'));
      
    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text').style('fill', '#f9fafb'))
      .call(g => g.selectAll('.tick line')
        .attr('x2', width - margin.left - margin.right)
        .attr('stroke-opacity', 0.1));
        
    // Add lines
    Object.entries(monthlyByPerson).forEach(([name, values], i) => {
      const pathData = monthlyData.filter(d => d.group === name);
      
      // Add path
      svg.append('path')
        .datum(pathData)
        .attr('fill', 'none')
        .attr('stroke', colorScale(name))
        .attr('stroke-width', 3)
        .attr('d', line)
        .attr('opacity', 0)
        .transition()
        .duration(1000)
        .delay(i * 300)
        .attr('opacity', 0.8);

      // Add points
      svg.selectAll(`.point-${i}`)
        .data(pathData)
        .join('circle')
        .attr('class', `point-${i}`)
        .attr('cx', d => x(new Date(d.x)))
        .attr('cy', d => y(d.y))
        .attr('r', 0)
        .attr('fill', colorScale(name))
        .attr('stroke', '#1f2937')
        .attr('stroke-width', 2)
        .transition()
        .duration(500)
        .delay((d, j) => i * 300 + j * 100 + 1000)
        .attr('r', 6);
    });
    
    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - margin.right + 20}, ${margin.top + 20})`);
      
    Object.keys(monthlyByPerson).forEach((name, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 25})`);
        
      legendRow.append('rect')
        .attr('width', 15)
        .attr('height', 3)
        .attr('fill', colorScale(name));
        
      legendRow.append('text')
        .attr('x', 25)
        .attr('y', 5)
        .text(name)
        .style('font-size', '0.8rem')
        .style('fill', '#f9fafb');
    });
  };

  // Initialize on mount and update charts when view changes
  useEffect(() => {
    const initialData = generateDemoData();
    setData(initialData);
  }, []);

  useEffect(() => {
    if (view === 'models') {
      renderModelCharts();
    } else if (view === 'dealers' && selectedModel) {
      renderDealerCharts();
    } else if (view === 'salespeople' && selectedModel && selectedDealer) {
      renderSalespersonCharts();
    }
  }, [view, selectedModel, selectedDealer, data, chartType, dateRange]);

  // Prepare model card data
  const modelCards = view === 'models' ? data.modelData : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-8">
      <header className="mb-8">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold text-transparent bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text"
        >
          Интерактивная панель продаж автомобилей
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-gray-400 mt-2"
        >
          Исследуйте данные о продажах от моделей до отдельных продавцов
        </motion.p>
      </header>
      
      <div className="bg-gray-900/60 rounded-xl p-4 md:p-6 border border-gray-700/50 shadow-xl">
        {/* Инструменты и фильтры */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center space-x-2">
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              className={`h-3 w-3 rounded-full cursor-pointer ${view === 'models' ? 'bg-green-500' : 'bg-gray-500'}`}
              onClick={() => setView('models')}
            />
            <div className="h-0.5 w-8 bg-gray-600"></div>
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              className={`h-3 w-3 rounded-full cursor-pointer ${view === 'dealers' ? 'bg-green-500' : 'bg-gray-500'}`}
              onClick={() => selectedModel && setView('dealers')}
            />
            <div className="h-0.5 w-8 bg-gray-600"></div>
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              className={`h-3 w-3 rounded-full cursor-pointer ${view === 'salespeople' ? 'bg-green-500' : 'bg-gray-500'}`}
              onClick={() => selectedDealer && setView('salespeople')}
            />
          </div>

          <div className="flex flex-wrap space-x-2 md:mb-0 mb-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setChartType('bar')}
              className={`px-3 py-1.5 rounded-md text-sm ${chartType === 'bar' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
           >
             Столбцы
           </motion.button>
           <motion.button
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={() => setChartType('pie')}
             className={`px-3 py-1.5 rounded-md text-sm ${chartType === 'pie' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
           >
             Круговая
           </motion.button>
           <motion.button
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={() => setChartType('stacked')}
             className={`px-3 py-1.5 rounded-md text-sm ${chartType === 'stacked' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
           >
             Составная
           </motion.button>
         </div>
         
         {/* Новый компонент выбора периода */}
         <div className="relative ml-auto">
           <motion.div 
             className="bg-gray-800 rounded-lg border border-gray-700 flex items-center cursor-pointer p-2 hover:bg-gray-700/70 transition-colors"
             onClick={() => setShowDatePicker(!showDatePicker)}
             whileHover={{ scale: 1.02 }}
             whileTap={{ scale: 0.98 }}
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
             </svg>
             <span className="text-white text-sm whitespace-nowrap">{getDateRangeLabel()}</span>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
             </svg>
           </motion.div>
           
           {showDatePicker && (
             <motion.div 
               initial={{ opacity: 0, y: -10 }}
               animate={{ opacity: 1, y: 0 }}
               className="absolute right-0 mt-2 bg-gray-800 rounded-lg border border-gray-700 shadow-xl z-50 w-72"
               ref={datePickerRef}
             >
               <div className="p-3">
                 <h3 className="text-white font-semibold mb-3">Выберите период</h3>
                 
                 {/* Предустановленные периоды */}
                 <div className="grid grid-cols-2 gap-2 mb-4">
                   <motion.button
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={() => handlePresetSelect('last7Days')}
                     className={`px-3 py-1.5 rounded-md text-xs ${dateRange.preset === 'last7Days' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                   >
                     7 дней
                   </motion.button>
                   <motion.button
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={() => handlePresetSelect('last30Days')}
                     className={`px-3 py-1.5 rounded-md text-xs ${dateRange.preset === 'last30Days' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                   >
                     30 дней
                   </motion.button>
                   <motion.button
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={() => handlePresetSelect('last3Months')}
                     className={`px-3 py-1.5 rounded-md text-xs ${dateRange.preset === 'last3Months' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                   >
                     3 месяца
                   </motion.button>
                   <motion.button
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={() => handlePresetSelect('last6Months')}
                     className={`px-3 py-1.5 rounded-md text-xs ${dateRange.preset === 'last6Months' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                   >
                     6 месяцев
                   </motion.button>
                   <motion.button
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={() => handlePresetSelect('last12Months')}
                     className={`px-3 py-1.5 rounded-md text-xs ${dateRange.preset === 'last12Months' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                   >
                     12 месяцев
                   </motion.button>
                   <motion.button
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={() => handlePresetSelect('thisYear')}
                     className={`px-3 py-1.5 rounded-md text-xs ${dateRange.preset === 'thisYear' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                   >
                     Этот год
                   </motion.button>
                   <motion.button
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={() => handlePresetSelect('lastYear')}
                     className={`px-3 py-1.5 rounded-md text-xs ${dateRange.preset === 'lastYear' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                   >
                     Прошлый год
                   </motion.button>
                   <motion.button
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={() => handlePresetSelect('custom')}
                     className={`px-3 py-1.5 rounded-md text-xs col-span-2 ${dateRange.preset === 'custom' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                   >
                     Произвольный период
                   </motion.button>
                 </div>
                 
                 {/* Custom date range */}
                 <div className="space-y-3">
                   <div>
                     <label className="block text-sm text-gray-400 mb-1">Начало периода</label>
                     <input 
                       type="date" 
                       value={dateRange.startDate.toISOString().split('T')[0]}
                       onChange={(e) => handleDateRangeChange({ startDate: new Date(e.target.value) })}
                       className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                     />
                   </div>
                   <div>
                     <label className="block text-sm text-gray-400 mb-1">Конец периода</label>
                     <input 
                       type="date" 
                       value={dateRange.endDate.toISOString().split('T')[0]}
                       onChange={(e) => handleDateRangeChange({ endDate: new Date(e.target.value) })}
                       className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                     />
                   </div>
                 </div>
                 
                 <div className="mt-4 flex justify-end space-x-2">
                   <motion.button
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={() => setShowDatePicker(false)}
                     className="px-3 py-1.5 rounded-md text-sm bg-gray-700 text-gray-300"
                   >
                     Отмена
                   </motion.button>
                   <motion.button
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={() => {
                       refreshDataWithDateRange(dateRange);
                       setShowDatePicker(false);
                     }}
                     className="px-3 py-1.5 rounded-md text-sm bg-blue-600 text-white"
                   >
                     Применить
                   </motion.button>
                 </div>
               </div>
             </motion.div>
           )}
         </div>
       </div>
       
       {/* Индикатор выбранного периода */}
       <motion.div 
         initial={{ opacity: 0, y: -10 }}
         animate={{ opacity: 1, y: 0 }}
         className="mb-4 flex items-center bg-blue-900/30 rounded-lg p-2"
       >
         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
         </svg>
         <span className="text-blue-200 text-sm">
           Данные за период: <strong>{getDateRangeLabel()}</strong>
         </span>
       </motion.div>
       
       {/* Навигационный путь */}
       {(selectedModel || selectedDealer) && (
         <div className="mb-6 bg-gray-800/80 p-3 rounded-lg flex items-center flex-wrap">
           <motion.button
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={() => {
               setSelectedModel(null);
               setSelectedDealer(null);
               setView('models');
             }}
             className="text-blue-400 hover:text-blue-300 transition-colors"
           >
             Все модели
           </motion.button>
           
           {selectedModel && (
             <>
               <span className="mx-2 text-gray-500">/</span>
               <motion.button
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={() => {
                   setSelectedDealer(null);
                   setView('dealers');
                 }}
                 className="text-blue-400 hover:text-blue-300 transition-colors"
                 style={{ color: selectedModel.color }}
               >
                 {selectedModel.name}
               </motion.button>
             </>
           )}
           
           {selectedDealer && (
             <>
               <span className="mx-2 text-gray-500">/</span>
               <span className="text-gray-300">{selectedDealer.dealerName}</span>
             </>
           )}
         </div>
       )}
       
       {/* Уровень моделей - с карточками автомобилей */}
       {view === 'models' && (
         <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           className="mb-8"
         >
           <h2 className="text-2xl font-bold mb-6 text-white">Каталог моделей автомобилей</h2>
           
           {/* Карточки моделей автомобилей */}
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
             {modelCards.map((model, index) => (
               <motion.div
                 key={model.id}
                 initial={animateCards ? { opacity: 0, y: 20 } : false}
                 animate={animateCards ? { opacity: 1, y: 0 } : false}
                 transition={{ delay: index * 0.1 }}
                 whileHover={{ scale: 1.03, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)' }}
                 className="bg-gray-800 rounded-lg overflow-hidden shadow-lg cursor-pointer"
                 onClick={() => handleModelClick(model)}
                 onAnimationComplete={() => index === modelCards.length - 1 && setAnimateCards(false)}
               >
                 <div className="relative h-40 bg-gradient-to-br from-gray-700 to-gray-900 overflow-hidden">
                   {model.img && (
                     <img 
                       src={model.img} 
                       alt={model.name} 
                       className="w-full h-full object-contain p-2"
                     />
                   )}
                   <div className="absolute top-2 right-2 bg-gray-900/70 rounded-full px-2 py-1 text-xs">
                     {model.category === 'suv' && 'Внедорожник'}
                     {model.category === 'sedan' && 'Седан'}
                     {model.category === 'minivan' && 'Минивэн'}
                   </div>
                 </div>
                 <div className="p-4">
                   <h3 className="text-lg font-bold" style={{ color: model.color }}>{model.name}</h3>
                   <div className="flex justify-between items-center mt-2">
                     <div className="text-gray-400 text-sm">Продажи</div>
                     <div className="text-white font-bold">{model.totalSales.toLocaleString()}</div>
                   </div>
                   <div className="mt-3 w-full bg-gray-700 rounded-full h-1.5">
                     <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${(model.totalSales / Math.max(...data.modelData.map(m => m.totalSales))) * 100}%` }}
                       transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
                       className="h-full rounded-full"
                       style={{ backgroundColor: model.color }}
                     />
                   </div>
                 </div>
                 <div className="p-4 bg-gray-900/50 border-t border-gray-700 flex justify-between items-center">
                   <button className="text-xs text-gray-400 hover:text-white transition-colors">
                     Подробнее
                   </button>
                   <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                     Рейтинг: {Math.floor(model.totalSales / 100)}
                   </span>
                 </div>
               </motion.div>
             ))}
           </div>
           
           <h2 className="text-2xl font-bold mb-6 text-white">Общие продажи по моделям</h2>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* Основной график */}
             <div className="bg-gray-800 p-4 rounded-lg shadow-md">
               <div ref={modelChartRef} className="w-full h-full"></div>
               <p className="text-center text-gray-400 mt-2">Нажмите на элемент для просмотра продаж по дилерам</p>
             </div>
             
             {/* Дополнительный график */}
             <div className="bg-gray-800 p-4 rounded-lg shadow-md">
               <div ref={modelSecondaryChartRef} className="w-full h-full"></div>
             </div>
           </div>
           
           {/* Тренд */}
           <div className="mt-6 bg-gray-800 p-4 rounded-lg shadow-md">
             <div ref={trendChartRef} className="w-full h-full"></div>
           </div>
         </motion.div>
       )}
       
       {/* Уровень дилеров */}
       {view === 'dealers' && (
         <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           className="mb-8"
         >
           <div className="flex flex-col md:flex-row gap-6 mb-8">
             {/* Информация о модели */}
             <motion.div 
               initial={animateCards ? { opacity: 0, x: -20 } : false}
               animate={animateCards ? { opacity: 1, x: 0 } : false}
               transition={{ duration: 0.5 }}
               onAnimationComplete={() => setAnimateCards(false)}
               className="bg-gray-800 p-4 rounded-lg shadow-md md:w-1/3"
             >
               <div className="relative h-40 bg-gradient-to-br from-gray-700 to-gray-900 rounded-md overflow-hidden mb-4">
                 {selectedModel && selectedModel.img && (
                   <img 
                     src={selectedModel.img} 
                     alt={selectedModel.name} 
                     className="w-full h-full object-contain p-2"
                   />
                 )}
               </div>
               
               <h2 className="text-2xl font-bold mb-4" style={{ color: selectedModel?.color }}>
                 {selectedModel ? selectedModel.name : ''}
               </h2>
               
               <div className="space-y-3">
                 <div className="flex justify-between items-center">
                   <span className="text-gray-400">Всего продаж</span>
                   <span className="text-white font-bold">
                     {selectedModel ? selectedModel.totalSales.toLocaleString() : 0}
                   </span>
                 </div>
                 
                 <div className="flex justify-between items-center">
                   <span className="text-gray-400">Категория</span>
                   <span className="text-white">
                     {selectedModel?.category === 'suv' && 'Внедорожник'}
                     {selectedModel?.category === 'sedan' && 'Седан'}
                     {selectedModel?.category === 'minivan' && 'Минивэн'}
                   </span>
                 </div>
                 
                 <div className="flex justify-between items-center">
                   <span className="text-gray-400">Дилеров</span>
                   <span className="text-white">{filteredDealerData.length}</span>
                 </div>
                 
                 <div className="flex justify-between items-center">
                   <span className="text-gray-400">Средние продажи на дилера</span>
                   <span className="text-white">
                     {filteredDealerData.length > 0 
                       ? Math.round(filteredDealerData.reduce((sum, d) => sum + d.sales, 0) / filteredDealerData.length).toLocaleString()
                       : 0}
                   </span>
                 </div>
               </div>
               
               <div className="mt-4">
                 <motion.button
                   whileHover={{ scale: 1.03 }}
                   whileTap={{ scale: 0.98 }}
                   onClick={handleBackClick}
                   className="w-full py-2 rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                 >
                   Вернуться к моделям
                 </motion.button>
               </div>
             </motion.div>
             
             {/* Дилеры в виде карточек */}
             <div className="md:w-2/3 space-y-4">
               <h3 className="text-xl font-bold text-white mb-4">Дилеры {selectedModel?.name}</h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {filteredDealerData.map((dealer, index) => (
                   <motion.div
                     key={dealer.dealerId}
                     initial={animateCards ? { opacity: 0, y: 20 } : false}
                     animate={animateCards ? { opacity: 1, y: 0 } : false}
                     transition={{ delay: index * 0.1 }}
                     whileHover={{ scale: 1.03, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)' }}
                     className="bg-gray-800 rounded-lg overflow-hidden shadow-lg cursor-pointer"
                     onClick={() => handleDealerClick(dealer)}
                     onAnimationComplete={() => index === filteredDealerData.length - 1 && setAnimateCards(false)}
                   >
                     <div className="p-4 border-l-4" style={{ borderColor: selectedModel?.color }}>
                       <h3 className="text-lg font-bold text-white">{dealer.dealerName}</h3>
                       <div className="flex justify-between items-center mt-2">
                         <div className="text-gray-400 text-sm">Продажи</div>
                         <div className="text-white font-bold">{dealer.sales.toLocaleString()}</div>
                       </div>
                       <div className="mt-3 w-full bg-gray-700 rounded-full h-1.5">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${(dealer.sales / Math.max(...filteredDealerData.map(d => d.sales))) * 100}%` }}
                           transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                           className="h-full rounded-full"
                           style={{ backgroundColor: selectedModel?.color }}
                         />
                       </div>
                     </div>
                   </motion.div>
                 ))}
               </div>
             </div>
           </div>
           
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* Основной график */}
             <div className="bg-gray-800 p-4 rounded-lg shadow-md">
               <div ref={dealerChartRef} className="w-full h-full"></div>
               <p className="text-center text-gray-400 mt-2">Нажмите на элемент для просмотра продаж по продавцам</p>
             </div>
             
             {/* Дополнительный график */}
             <div className="bg-gray-800 p-4 rounded-lg shadow-md">
               <div ref={dealerSecondaryChartRef} className="w-full h-full"></div>
             </div>
           </div>
         </motion.div>
       )}
       
       {/* Уровень продавцов */}
       {view === 'salespeople' && (
         <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           className="mb-8"
         >
           <div className="flex flex-col md:flex-row gap-6 mb-8">
             {/* Инфо о дилере и модели */}
             <motion.div 
               initial={animateCards ? { opacity: 0, x: -20 } : false}
               animate={animateCards ? { opacity: 1, x: 0 } : false}
               transition={{ duration: 0.5 }}
               onAnimationComplete={() => setAnimateCards(false)}
               className="bg-gray-800 p-4 rounded-lg shadow-md md:w-1/3"
             >
               <div className="relative h-32 bg-gradient-to-br from-gray-700 to-gray-900 rounded-md overflow-hidden mb-4">
                 {selectedModel && selectedModel.img && (
                   <img 
                     src={selectedModel.img} 
                     alt={selectedModel.name} 
                     className="w-full h-full object-contain p-2"
                   />
                 )}
               </div>
               
               <h3 className="text-xl font-bold mb-1" style={{ color: selectedModel?.color }}>
                 {selectedModel ? selectedModel.name : ''}
               </h3>
               
               <h2 className="text-2xl font-bold mb-4 text-white">
                 {selectedDealer ? selectedDealer.dealerName : ''}
               </h2>
               
               <div className="space-y-3">
                 <div className="flex justify-between items-center">
                   <span className="text-gray-400">Продажи модели</span>
                   <span className="text-white font-bold">
                     {selectedDealer ? selectedDealer.sales.toLocaleString() : 0}
                   </span>
                 </div>
                 
                 <div className="flex justify-between items-center">
                   <span className="text-gray-400">Продавцов</span>
                   <span className="text-white">{filteredSalespersonData.length}</span>
                 </div>
                 
                 <div className="flex justify-between items-center">
                   <span className="text-gray-400">Средние продажи на продавца</span>
                   <span className="text-white">
                     {filteredSalespersonData.length > 0 
                       ? Math.round(filteredSalespersonData.reduce((sum, d) => sum + d.sales, 0) / filteredSalespersonData.length).toLocaleString()
                       : 0}
                   </span>
                 </div>
               </div>
               
               <div className="mt-4 space-y-2">
                 <motion.button
                   whileHover={{ scale: 1.03 }}
                   whileTap={{ scale: 0.98 }}
                   onClick={handleBackClick}
                   className="w-full py-2 rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                 >
                   Вернуться к дилерам
                 </motion.button>
                 
                 <motion.button
                   whileHover={{ scale: 1.03 }}
                   whileTap={{ scale: 0.98 }}
                   onClick={() => {
                     setSelectedModel(null);
                     setSelectedDealer(null);
                     setView('models');
                   }}
                   className="w-full py-2 rounded-md bg-gray-700/50 text-gray-400 hover:bg-gray-700 transition-colors"
                 >
                   К списку моделей
                 </motion.button>
               </div>
             </motion.div>
             
             {/* Список продавцов в виде карточек */}
             <div className="md:w-2/3">
               <h3 className="text-xl font-bold text-white mb-4">Продавцы {selectedDealer?.dealerName}</h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {filteredSalespersonData.map((salesperson, index) => (
                   <motion.div
                     key={salesperson.salespersonId}
                     initial={animateCards ? { opacity: 0, y: 20 } : false}
                     animate={animateCards ? { opacity: 1, y: 0 } : false}
                     transition={{ delay: index * 0.1 }}
                     whileHover={{ scale: 1.03 }}
                     className="bg-gray-800 rounded-lg overflow-hidden shadow-lg p-4"
                     onAnimationComplete={() => index === filteredSalespersonData.length - 1 && setAnimateCards(false)}
                   >
                     <div className="flex items-center mb-3">
                       <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold mr-3" 
                            style={{ backgroundColor: `${selectedModel?.color}20` }}>
                         {salesperson.salespersonName.split(' ').map(n => n[0]).join('')}
                       </div>
                       <div>
                         <h4 className="text-lg font-bold text-white">{salesperson.salespersonName}</h4>
                         <p className="text-sm text-gray-400">Менеджер по продажам</p>
                       </div>
                     </div>
                     
                     <div className="flex justify-between items-center mt-2">
                       <div className="text-gray-400 text-sm">Продажи {selectedModel?.name}</div>
                       <div className="text-white font-bold">{salesperson.sales.toLocaleString()}</div>
                     </div>
                     
                     <div className="mt-3 w-full bg-gray-700 rounded-full h-1.5">
                       <motion.div 
                         initial={{ width: 0 }}
                        animate={{ width: `${(salesperson.sales / Math.max(...filteredSalespersonData.map(d => d.sales))) * 100}%` }}
                         transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                         className="h-full rounded-full"
                         style={{ backgroundColor: selectedModel?.color }}
                       />
                     </div>
                     
                     <div className="flex items-center justify-between mt-4">
                       <span className="px-2 py-1 rounded-full text-xs" 
                             style={{ backgroundColor: `${selectedModel?.color}20`, color: selectedModel?.color }}>
                         {salesperson.sales > 100 ? 'Топ продавец' : 'Стандарт'}
                       </span>
                       
                       <motion.button
                         whileHover={{ scale: 1.05 }}
                         whileTap={{ scale: 0.95 }}
                         className="text-sm text-gray-400 hover:text-white transition-colors"
                       >
                         Подробнее
                       </motion.button>
                     </div>
                   </motion.div>
                 ))}
               </div>
             </div>
           </div>
           
           <h2 className="text-2xl font-bold mb-6 text-white" style={{ color: selectedModel?.color }}>
             {selectedModel && selectedDealer ? 
               `${selectedModel.name} - Продажи в ${selectedDealer.dealerName}` : ''}
           </h2>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* Основной график */}
             <div className="bg-gray-800 p-4 rounded-lg shadow-md">
               <div ref={salespersonChartRef} className="w-full h-full"></div>
             </div>
             
             {/* Дополнительный график */}
             <div className="bg-gray-800 p-4 rounded-lg shadow-md">
               <div ref={salespersonSecondaryChartRef} className="w-full h-full"></div>
             </div>
           </div>
         </motion.div>
       )}
     </div>
     
     {/* Плавающая кнопка для быстрого выбора периода */}
     <motion.div 
       className="fixed bottom-6 right-6 z-10"
       whileHover={{ scale: 1.05 }}
       whileTap={{ scale: 0.95 }}
     >
       <button 
         onClick={() => setShowDatePicker(!showDatePicker)}
         className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-colors"
       >
         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
         </svg>
       </button>
     </motion.div>
     
     <style jsx>{`
       .bg-clip-text {
         -webkit-background-clip: text;
         background-clip: text;
       }

       .text-transparent {
         color: transparent;
       }
     `}</style>
   </div>
 );
}