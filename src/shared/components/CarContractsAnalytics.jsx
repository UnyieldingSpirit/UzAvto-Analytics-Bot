// components/CarContractsAnalytics.jsx
'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const CarContractsAnalytics = () => {
  const [selectedModel, setSelectedModel] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const mainChartRef = useRef(null);
  const contractsChartRef = useRef(null);
  const revenueChartRef = useRef(null);
  const avgCostChartRef = useRef(null);
  const popularityChartRef = useRef(null);

  // Список доступных моделей автомобилей
  const carModels = [
    { id: 'all', name: 'Все модели' },
    { id: 'nexia', name: 'Chevrolet Nexia' },
    { id: 'cobalt', name: 'Chevrolet Cobalt' },
    { id: 'gentra', name: 'Chevrolet Gentra' },
    { id: 'spark', name: 'Chevrolet Spark' },
    { id: 'malibu', name: 'Chevrolet Malibu' },
    { id: 'tracker', name: 'Chevrolet Tracker' },
    { id: 'onix', name: 'Chevrolet Onix' },
  ];

  // Данные контрактов по месяцам
  const getContractData = (modelId = 'all') => {
    // Базовые данные для всех моделей вместе
    const baseData = [
      { month: "Янв", count: 124, revenue: 8520000 },
      { month: "Фев", count: 85, revenue: 5950000 },
      { month: "Мар", count: 102, revenue: 7140000 },
      { month: "Апр", count: 118, revenue: 8260000 },
      { month: "Май", count: 175, revenue: 12250000 },
      { month: "Июн", count: 140, revenue: 9800000 },
      { month: "Июл", count: 155, revenue: 10850000 },
      { month: "Авг", count: 132, revenue: 9240000 },
      { month: "Сен", count: 145, revenue: 10150000 },
      { month: "Окт", count: 120, revenue: 8400000 },
      { month: "Ноя", count: 165, revenue: 11550000 },
      { month: "Дек", count: 130, revenue: 9100000 }
    ];

    // Если выбрана конкретная модель, модифицируем данные
    if (modelId !== 'all') {
      const modelMultiplier = {
        'nexia': 0.25,
        'cobalt': 0.2,
        'gentra': 0.15,
        'spark': 0.1,
        'malibu': 0.12,
        'tracker': 0.08,
        'onix': 0.1
      };
      
      // Рассчитываем долю модели в общем объеме
      return baseData.map(item => ({
        month: item.month,
        count: Math.round(item.count * modelMultiplier[modelId] * (1 + (Math.random() * 0.3 - 0.15))),
        revenue: Math.round(item.revenue * modelMultiplier[modelId] * (1 + (Math.random() * 0.3 - 0.15)))
      }));
    }
    
    return baseData;
  };

  useEffect(() => {
    // Установка дат по умолчанию (последние 12 месяцев)
    const today = new Date();
    const lastYear = new Date();
    lastYear.setFullYear(today.getFullYear() - 1);
    
    setStartDate(lastYear.toISOString().substring(0, 10));
    setEndDate(today.toISOString().substring(0, 10));
    
    // Инициализация графиков при первой загрузке
    renderCharts();
    
    // Обработчик изменения размера окна
    const handleResize = () => {
      renderCharts();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Перерисовываем графики при изменении выбранной модели
  useEffect(() => {
    renderCharts();
  }, [selectedModel]);
  
  // Функция отрисовки всех графиков
  const renderCharts = () => {
    const contractData = getContractData(selectedModel);
    
    renderMainChart(contractData);
    renderMiniChart(contractsChartRef, contractData.map(d => d.count), '#4CAF50', 'Контрактов');
    renderMiniChart(revenueChartRef, contractData.map(d => d.revenue), '#F44336', 'Выручка');
    renderMiniChart(avgCostChartRef, contractData.map(d => Math.round(d.revenue / (d.count || 1))), '#2196F3', 'Средняя стоимость');
    renderPopularityChart();
  };
  
  // Рендер основного графика
  const renderMainChart = (data) => {
    if (!mainChartRef.current) return;
    
    const container = mainChartRef.current;
    container.innerHTML = '';
    
    const margin = { top: 30, right: 30, bottom: 50, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;
    
    const svg = d3.select(container)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
      
    // Добавляем градиент для области
    const defs = svg.append("defs");
    const areaGradient = defs.append("linearGradient")
      .attr("id", "areaGradient")
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
    
    // Добавляем градиент для линии
    const lineGradient = defs.append("linearGradient")
      .attr("id", "lineGradient")
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "100%").attr("y2", "0%");
      
    lineGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#3b82f6");
      
    lineGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#8b5cf6");
      
    // Шкалы
    const x = d3.scaleBand()
      .domain(data.map(d => d.month))
      .range([0, width])
      .padding(1);
      
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count) * 1.2])
      .range([height, 0]);
      
    // Сетка
    svg.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat("")
      )
      .style("stroke", "#333")
      .style("stroke-opacity", "0.1");
      
    // Оси
    svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("fill", "#999");
      
    svg.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("fill", "#999");
    
    // Подписи осей
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .style("fill", "#999")
      .text("Месяц");
    
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", `translate(${-margin.left + 15},${height/2}) rotate(-90)`)
      .style("fill", "#999")
      .text("Количество контрактов");
      
    // Создание линии
    const line = d3.line()
      .x(d => x(d.month) + x.bandwidth()/2)
      .y(d => y(d.count))
      .curve(d3.curveMonotoneX);
      
    // Создание области
    const area = d3.area()
      .x(d => x(d.month) + x.bandwidth()/2)
      .y0(height)
      .y1(d => y(d.count))
      .curve(d3.curveMonotoneX);
      
    // Добавление области
    svg.append("path")
      .datum(data)
      .attr("class", "area")
      .attr("d", area)
      .attr("fill", "url(#areaGradient)");
      
    // Добавление линии
    const path = svg.append("path")
      .datum(data)
      .attr("class", "line")
      .attr("d", line)
      .attr("stroke", "url(#lineGradient)")
      .attr("stroke-width", 3)
      .attr("fill", "none");
    
    // Анимация линии
    const totalLength = path.node().getTotalLength();
    path
      .attr("stroke-dasharray", totalLength)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(1500)
      .attr("stroke-dashoffset", 0);
      
    // Добавление точек
    const dots = svg.selectAll(".dot")
      .data(data)
      .enter().append("circle")
      .attr("class", "dot")
      .attr("cx", d => x(d.month) + x.bandwidth()/2)
      .attr("cy", d => y(d.count))
      .attr("r", 6)
      .attr("fill", "#3b82f6")
      .attr("stroke", "#1e1e1e")
      .attr("stroke-width", 2)
      .style("cursor", "pointer");
    
    // Анимация точек
    dots
      .attr("r", 0)
      .transition()
      .delay((d, i) => 1500 + i * 50)
      .duration(300)
      .attr("r", 6);
      
    // Добавление всплывающих подсказок
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
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
          <strong>${d.month}</strong><br>
          Контрактов: <strong>${d.count}</strong><br>
          Выручка: <strong>${formatCurrency(d.revenue)}</strong><br>
          Ср. стоимость: <strong>${formatCurrency(Math.round(d.revenue / d.count))}</strong>
        `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).transition()
          .duration(200)
          .attr("r", 6);
          
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });
      
    // Подпись текущего месяца
    const currentMonth = new Date().toLocaleString('ru', { month: 'short' }).charAt(0).toUpperCase() + new Date().toLocaleString('ru', { month: 'short' }).slice(1);
    const currentMonthData = data.find(d => d.month === currentMonth);
    
    if (currentMonthData) {
      svg.append("circle")
        .attr("cx", x(currentMonthData.month) + x.bandwidth()/2)
        .attr("cy", y(currentMonthData.count))
        .attr("r", 9)
        .attr("fill", "none")
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .style("opacity", 0)
        .transition()
        .delay(2000)
        .duration(500)
        .style("opacity", 1);
      
      svg.append("text")
        .attr("x", x(currentMonthData.month) + x.bandwidth()/2)
        .attr("y", y(currentMonthData.count) - 15)
        .attr("text-anchor", "middle")
        .style("fill", "#fff")
        .style("font-weight", "bold")
        .style("opacity", 0)
        .text(currentMonthData.count)
        .transition()
        .delay(2000)
        .duration(500)
        .style("opacity", 1);
    }
  };
  
  // Рендер мини-графиков
  const renderMiniChart = (ref, data, color, label) => {
    if (!ref.current) return;
    
    const container = ref.current;
    container.innerHTML = '';
    
    const margin = {top: 10, right: 10, bottom: 20, left: 40};
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;
    
    const svg = d3.select(container)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
      
    // Добавляем градиент
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", `barGradient-${label.replace(/\s/g, '')}`)
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
      
    // Шкалы
    const x = d3.scaleBand()
      .domain(d3.range(data.length))
      .range([0, width])
      .padding(0.2);
      
    const y = d3.scaleLinear()
      .domain([0, d3.max(data) * 1.1])
      .range([height, 0]);
      
    // Оси
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat((d, i) => i % 3 === 0 ? ['Янв', 'Апр', 'Июл', 'Окт'][i/3] : '').tickSize(0))
      .selectAll("text")
      .style("fill", "#999")
      .style("font-size", "10px");
      
    svg.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => {
        if (label === 'Выручка') return `${Math.round(d/1000000)}M`;
        if (d >= 1000) return `${Math.round(d/1000)}K`;
        return d;
      }))
      .selectAll("text")
      .style("fill", "#999")
      .style("font-size", "10px");
      
    // Столбцы с анимацией
    svg.selectAll(".bar")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", (d, i) => x(i))
      .attr("width", x.bandwidth())
      .attr("fill", `url(#barGradient-${label.replace(/\s/g, '')})`)
      .attr("rx", 2)
      .attr("ry", 2)
      .attr("y", height)
      .attr("height", 0)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 30)
      .attr("y", d => y(d))
      .attr("height", d => height - y(d));
  };
  
  // Рендер круговой диаграммы популярности моделей
  const renderPopularityChart = () => {
    if (!popularityChartRef.current) return;
    
    const container = popularityChartRef.current;
    container.innerHTML = '';
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    const radius = Math.min(width, height) / 2 * 0.8;
    
    const svg = d3.select(container)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);
    
    // Данные по популярности моделей
    const popularityData = [
      { name: "Nexia", value: 25, color: "#3b82f6" },
      { name: "Cobalt", value: 20, color: "#8b5cf6" },
      { name: "Gentra", value: 15, color: "#ec4899" },
      { name: "Spark", value: 10, color: "#f59e0b" },
      { name: "Malibu", value: 12, color: "#10b981" },
      { name: "Tracker", value: 8, color: "#ef4444" },
      { name: "Onix", value: 10, color: "#6366f1" }
    ];
    
    // Выделение выбранной модели
    const pie = d3.pie()
      .value(d => d.value)
      .sort(null);
    
    const arc = d3.arc()
      .innerRadius(radius * 0.5)
      .outerRadius(radius);
    
    const arcs = svg.selectAll("arc")
      .data(pie(popularityData))
      .enter()
      .append("g")
      .attr("class", "arc");
    
    // Анимация секторов
    arcs.append("path")
      .attr("d", arc)
      .attr("fill", (d, i) => d.data.color)
      .attr("stroke", "#1e1e1e")
      .attr("stroke-width", 1)
      .style("opacity", d => selectedModel === 'all' || selectedModel === d.data.name.toLowerCase() ? 1 : 0.4)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        const modelId = d.data.name.toLowerCase();
        setSelectedModel(modelId === selectedModel ? 'all' : modelId);
      });
    
    // Добавляем метки
    arcs.append("text")
      .attr("transform", d => `translate(${arc.centroid(d)})`)
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .style("fill", "#fff")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .text(d => `${d.data.value}%`);
    
    // Центральный текст
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0em")
      .style("font-size", "14px")
      .style("fill", "#999")
      .text("Доля моделей");
    
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1.5em")
      .style("font-size", "14px")
      .style("fill", "#fff")
      .style("font-weight", "bold")
      .text(selectedModel === 'all' ? "Все модели" : carModels.find(m => m.id === selectedModel)?.name || "");
  };
  
  // Форматирование суммы
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'UZS',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Расчет статистики
  const getStats = () => {
    const contractData = getContractData(selectedModel);
    
    const totalContracts = contractData.reduce((sum, item) => sum + item.count, 0);
    const totalRevenue = contractData.reduce((sum, item) => sum + item.revenue, 0);
    const avgCost = Math.round(totalRevenue / totalContracts);
    
    return {
      totalContracts,
      totalRevenue,
      avgCost
    };
  };
  
  const stats = getStats();

  return (
    <div className="p-5 bg-gray-900 text-gray-100 min-h-screen">
      <h1 className="text-3xl font-semibold mb-6">Аналитика Контрактов</h1>
      
      <div className="bg-gray-800 p-5 rounded-lg shadow-lg mb-8 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="flex items-center">
            <span className="text-gray-400 mr-2">Модель:</span>
            <select 
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white min-w-[200px]"
            >
              {carModels.map(model => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </select>
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
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-medium text-white">Общее количество контрактов</h3>
              <p className="text-gray-400 text-sm mt-1">За выбранный период</p>
            </div>
            <p className="text-2xl font-bold">{stats.totalContracts.toLocaleString('ru-RU')}</p>
          </div>
          <div id="contractsChart" ref={contractsChartRef} className="w-full h-[150px]"></div>
        </div>
        
        <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-medium text-white">Общая выручка</h3>
              <p className="text-gray-400 text-sm mt-1">За выбранный период</p>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
          </div>
          <div id="revenueChart" ref={revenueChartRef} className="w-full h-[150px]"></div>
        </div>
        
        <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-medium text-white">Средняя стоимость контракта</h3>
              <p className="text-gray-400 text-sm mt-1">За выбранный период</p>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(stats.avgCost)}</p>
          </div>
          <div id="avgCostChart" ref={avgCostChartRef} className="w-full h-[150px]"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 p-5 rounded-lg shadow-lg lg:col-span-3">
          <h3 className="text-xl font-semibold mb-4">Динамика контрактов</h3>
          <div 
            id="mainChart" 
            ref={mainChartRef} 
            className="w-full h-[300px]"
          ></div>
        </div>
        
        <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Популярность моделей</h3>
          <div 
            id="popularityChart" 
            ref={popularityChartRef} 
            className="w-full h-[300px]"
          ></div>
        </div>
      </div>
      
      <div className="bg-blue-900/20 border-l-4 border-blue-500 p-5 rounded-r-lg mb-8">
        <h3 className="text-xl font-semibold text-blue-400 mb-2">Информация о контрактной модели</h3>
        <p className="text-gray-300">
          Контрактная модель действует в течение 12 месяцев. Вы можете выбрать отдельную модель автомобиля для анализа 
          или просмотреть данные по всем моделям вместе, используя селектор в верхней части страницы.
        </p>
      </div>
    </div>
  );
};

export default CarContractsAnalytics;