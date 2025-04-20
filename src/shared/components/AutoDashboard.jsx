'use client';
import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import { carModels } from '../mocks/mock-data';

// Импортируем иконки
import { BarChart3, Calendar, CarFront, TrendingUp, ExternalLink, Home, Filter, ChevronDown, Check, ChevronUp } from 'lucide-react';

const ProductionDashboard = () => {
  // Состояния для управления фильтрами
  const [period, setPeriod] = useState('year');
  const [year, setYear] = useState('2024');
  const [marketType, setMarketType] = useState('all');
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(false);
  
  // Состояние для выбранного месяца
  const [selectedMonth, setSelectedMonth] = useState(null);
  
  // Состояние для хранения данных предыдущего месяца
  const [prevMonthData, setPrevMonthData] = useState(null);
  
  // Рефы для элементов UI
  const chartRef = useRef(null);
  
  // Доступные годы
  const availableYears = ['2024', '2023', '2022'];
  
  // Генерируем данные для производства
  const generateProductionData = () => {
    const months = [
      'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
      'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'
    ];
    
    // Базовые значения по месяцам как в примере на графике
    const baseValues = [4050, 4200, 4400, 3700, 4350, 4900, 3900, 3950, 5000, 4600, 3500, 3200];
    
    // Коэффициенты для разных лет
    const yearMultipliers = {
      '2024': 1,
      '2023': 0.85,
      '2022': 0.7
    };
    
    const yearMultiplier = yearMultipliers[year] || 1;
    
    return months.map((month, index) => {
      // Учитываем коэффициент года
      const adjustedValue = Math.round(baseValues[index] * yearMultiplier);
      
      // Распределение между внутренним и экспортным рынком
      const domestic = Math.round(adjustedValue * 0.75); // 75% для внутреннего рынка
      const export_ = adjustedValue - domestic; // Остальное на экспорт
      
      return {
        month,
        total: adjustedValue,
        domestic,
        export: export_,
        // Распределение по моделям
        models: carModels.map(model => {
          // Вычисляем долю каждой модели в зависимости от ее популярности
          // Пусть популярность модели зависит от ее порядкового номера в массиве
          const popularityIndex = carModels.findIndex(m => m.id === model.id);
          const popularityFactor = 1 - (popularityIndex / carModels.length * 0.7); // От 0.3 до 1
          
          // Случайное отклонение для естественности данных
          const randomVariation = 0.8 + Math.random() * 0.4; // От 0.8 до 1.2
          
          // Вычисляем значения для модели
          const modelShare = popularityFactor * randomVariation;
          const modelDomestic = Math.round(domestic * modelShare / carModels.length * 2);
          const modelExport = Math.round(export_ * modelShare / carModels.length * 2);
          
          return {
            ...model,
            domestic: modelDomestic,
            export: modelExport,
            total: modelDomestic + modelExport
          };
        }).sort((a, b) => b.total - a.total) // Сортируем по убыванию
      };
    });
  };
  
  // Генерируем и сохраняем данные производства
  const productionData = generateProductionData();
  
  // Вычисляем итоговые показатели
  const calculateTotals = () => {
    const totalProduction = productionData.reduce((sum, month) => sum + month.total, 0);
    const totalDomestic = productionData.reduce((sum, month) => sum + month.domestic, 0);
    const totalExport = productionData.reduce((sum, month) => sum + month.export, 0);
    
    return {
      totalProduction,
      totalDomestic,
      totalExport
    };
  };
  
  const totals = calculateTotals();
  
  // Обработчик выбора месяца
  const handleMonthClick = (month) => {
    if (month === selectedMonth) {
      setSelectedMonth(null);
      setPrevMonthData(null);
    } else {
      setSelectedMonth(month);
      
      // Получаем данные предыдущего месяца
      const monthIndex = productionData.findIndex(data => data.month === month);
      if (monthIndex > 0) {
        setPrevMonthData(productionData[monthIndex - 1]);
      } else if (monthIndex === 0) {
        // Если выбран январь, предыдущим будет декабрь прошлого года
        setPrevMonthData({
          month: 'dekabr',
          total: Math.round(productionData[monthIndex].total * 0.9),
          domestic: Math.round(productionData[monthIndex].domestic * 0.9),
          export: Math.round(productionData[monthIndex].export * 0.9)
        });
      } else {
        setPrevMonthData(null);
      }
    }
  };
  
  // Обработчик изменения года
  const handleYearChange = (e) => {
    const selectedYear = e.target.value;
    setYear(selectedYear);
    // Сбрасываем выбранный месяц при смене года
    setSelectedMonth(null);
    setPrevMonthData(null);
  };
  
  // Отрисовка графика при изменении данных
  useEffect(() => {
    if (chartRef.current) {
      renderChart();
    }
  }, [marketType, selectedMonth, year]);
  
  // Функция для отрисовки графика
  const renderChart = () => {
    const container = chartRef.current;
    d3.select(container).selectAll("*").remove();
    
    const margin = { top: 30, right: 30, bottom: 60, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Создаем SVG
    const svg = d3.select(container)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Определяем данные для отображения в зависимости от типа рынка
    let data = productionData;
    if (marketType === 'domestic') {
      data = productionData.map(d => ({...d, value: d.domestic, month: d.month}));
    } else if (marketType === 'export') {
      data = productionData.map(d => ({...d, value: d.export, month: d.month}));
    } else {
      data = productionData.map(d => ({...d, value: d.total, month: d.month}));
    }
    
    // Шкалы для графика
    const x = d3.scaleBand()
      .domain(data.map(d => d.month))
      .range([0, width])
      .padding(0.3);
    
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) * 1.1])
      .nice()
      .range([height, 0]);
    
    // Создаем градиент для столбцов
    const defs = svg.append("defs");
    
    const gradient = defs.append("linearGradient")
      .attr("id", "bar-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    
    // Цвета в зависимости от типа рынка
    const mainColor = marketType === 'all' ? "#f97316" : 
                      marketType === 'domestic' ? "#3b82f6" : "#10b981";
    
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", mainColor)
      .attr("stop-opacity", 0.9);
    
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", d3.color(mainColor).darker(0.8))
      .attr("stop-opacity", 0.7);
    
    // Добавляем эффект свечения для выделенного столбца
    const glowFilter = defs.append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    
    glowFilter.append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "coloredBlur");
    
    const glowMerge = glowFilter.append("feMerge");
    glowMerge.append("feMergeNode")
      .attr("in", "coloredBlur");
    glowMerge.append("feMergeNode")
      .attr("in", "SourceGraphic");
    
    // Добавляем оси
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)")
      .style("fill", "#e5e7eb");
    
    svg.append("g")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("fill", "#e5e7eb");
    
    // Добавляем сетку
    svg.append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(y.ticks(5))
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", d => y(d))
      .attr("y2", d => y(d))
      .attr("stroke", "#374151")
      .attr("stroke-width", 0.5)
      .attr("stroke-dasharray", "3,3");
    
    // Добавляем столбцы
    const bars = svg.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.month))
      .attr("width", x.bandwidth())
      .attr("y", height)
      .attr("height", 0)
      .attr("fill", "url(#bar-gradient)")
      .attr("rx", 4)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("filter", "url(#glow)")
          .attr("opacity", 1);
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("filter", null)
          .attr("opacity", 0.9);
      })
      .on("click", function(event, d) {
        handleMonthClick(d.month);
      })
      .transition()
      .duration(1000)
      .delay((d, i) => i * 50)
      .attr("y", d => y(d.value))
      .attr("height", d => height - y(d.value))
      .attr("opacity", 0.9);
    
    // Выделение выбранного месяца
    if (selectedMonth) {
      svg.selectAll(".bar")
        .filter(d => d.month === selectedMonth)
        .attr("fill", d3.color(mainColor).darker(0.3))
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .attr("filter", "url(#glow)");
    }
    
    // Добавляем значения над столбцами
    svg.selectAll(".bar-value")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "bar-value")
      .attr("x", d => x(d.month) + x.bandwidth() / 2)
      .attr("y", d => y(d.value) - 10)
      .attr("text-anchor", "middle")
      .attr("fill", "#e5e7eb")
      .style("font-size", "12px")
      .style("font-weight", "500")
      .style("opacity", 0)
      .text(d => d.value.toLocaleString())
      .transition()
      .duration(1000)
      .delay((d, i) => i * 50 + 500)
      .style("opacity", 1);
    
    // Добавляем название графика
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .style("fill", "#f1f5f9")
      .text(`Производство автомобилей - ${year} год`);
    
    // Добавляем метки месяцев (локализованные)
    const monthNames = {
      'yanvar': 'Янв', 'fevral': 'Фев', 'mart': 'Мар', 'aprel': 'Апр',
      'may': 'Май', 'iyun': 'Июн', 'iyul': 'Июл', 'avgust': 'Авг',
      'sentabr': 'Сен', 'oktabr': 'Окт', 'noyabr': 'Ноя', 'dekabr': 'Дек'
    };
    
    svg.selectAll(".month-label")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "month-label")
      .attr("x", d => x(d.month) + x.bandwidth() / 2)
      .attr("y", height + 40)
      .attr("text-anchor", "middle")
      .attr("fill", "#9ca3af")
      .style("font-size", "10px")
      .text(d => monthNames[d.month]);
  };
  
  // Форматирование чисел
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };
  
  // Получение названия месяца
  const getMonthName = (month) => {
    const monthNames = {
      'yanvar': 'Январь',
      'fevral': 'Февраль',
      'mart': 'Март',
      'aprel': 'Апрель',
      'may': 'Май',
      'iyun': 'Июнь',
      'iyul': 'Июль',
      'avgust': 'Август',
      'sentabr': 'Сентябрь',
      'oktabr': 'Октябрь',
      'noyabr': 'Ноябрь',
      'dekabr': 'Декабрь'
    };
    return monthNames[month] || month;
  };
  
  // Получение короткого названия месяца
  const getShortMonthName = (month) => {
    const monthNames = {
      'yanvar': 'Янв',
      'fevral': 'Фев',
      'mart': 'Мар',
      'aprel': 'Апр',
      'may': 'Май',
      'iyun': 'Июн',
      'iyul': 'Июл',
      'avgust': 'Авг',
      'sentabr': 'Сен',
      'oktabr': 'Окт',
      'noyabr': 'Ноя',
      'dekabr': 'Дек'
    };
    return monthNames[month] || month;
  };
  
  // Получение данных по моделям для выбранного месяца
  const getSelectedMonthData = () => {
    if (!selectedMonth) return null;
    return productionData.find(d => d.month === selectedMonth);
  };
  
  const selectedMonthData = getSelectedMonthData();
  
  // Получение процентного изменения между текущим и предыдущим месяцем
  const getChangePercentage = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };
  
  return (
    <div className="bg-gray-900 text-white p-4 md:p-6">
      {/* Заголовок */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center">
          <CarFront className="mr-2 text-orange-500" size={28} />
          <span className="bg-gradient-to-r from-orange-400 to-amber-600 text-transparent bg-clip-text">
            Производство
          </span>
        </h1>
      </div>
      
      {/* Панель фильтров */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 md:p-5 rounded-lg border border-gray-700 shadow-lg mb-6 transition-all duration-300">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-200 flex items-center">
            <Filter className="w-5 h-5 mr-2 text-orange-500" />
            Параметры анализа
          </h2>
          <button 
            className="text-gray-400 hover:text-gray-200 flex items-center focus:outline-none"
            onClick={() => setIsFiltersCollapsed(!isFiltersCollapsed)}
          >
            {isFiltersCollapsed ? 'Развернуть' : 'Свернуть'}
            <ChevronDown 
              className={`ml-1 transition-transform duration-300 ${isFiltersCollapsed ? 'rotate-180' : ''}`}
              size={18} 
            />
          </button>
        </div>
        
        <AnimatePresence>
          {!isFiltersCollapsed && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden"
            >
              {/* Выбор периода */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Период анализа</label>
                <div className="flex space-x-2">
                  <button 
                    className={`px-4 py-2 rounded-md transition-all duration-200 ${
                      period === 'year' 
                        ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white font-medium shadow-md' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    onClick={() => setPeriod('year')}
                  >
                    Год
                  </button>
                  <button 
                    className={`px-4 py-2 rounded-md transition-all duration-200 ${
                      period === 'quarter' 
                        ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white font-medium shadow-md' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    onClick={() => setPeriod('quarter')}
                  >
                    Квартал
                  </button>
                  <button 
                    className={`px-4 py-2 rounded-md transition-all duration-200 ${
                      period === 'month' 
                        ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white font-medium shadow-md' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    onClick={() => setPeriod('month')}
                  >
                    Месяц
                  </button>
                </div>
                
                {/* ЗАМЕНЕНО: Селект вместо выпадающего списка */}
                <div className="mt-3">
                  <select
                    value={year}
                    onChange={handleYearChange}
                    className="w-full p-2.5 bg-gray-700 text-white border border-gray-600 rounded-md"
                  >
                    {availableYears.map((yearOption) => (
                      <option key={yearOption} value={yearOption}>
                        {yearOption} год
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Выбор типа рынка */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Тип рынка</label>
                <div className="flex flex-wrap md:flex-nowrap gap-2">
                  <button 
                    className={`px-4 py-2 rounded-md flex items-center transition-all duration-200 ${
                      marketType === 'all' 
                        ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white font-medium shadow-md' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    onClick={() => setMarketType('all')}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Все рынки
                  </button>
                  <button 
                    className={`px-4 py-2 rounded-md flex items-center transition-all duration-200 ${
                      marketType === 'domestic' 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium shadow-md' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    onClick={() => setMarketType('domestic')}
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Внутренний
                  </button>
                  <button 
                    className={`px-4 py-2 rounded-md flex items-center transition-all duration-200 ${
                      marketType === 'export' 
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium shadow-md' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    onClick={() => setMarketType('export')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Экспортный
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Ключевые показатели */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Общее производство */}
        <motion.div 
          whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)' }}
          className="bg-gradient-to-br from-gray-800 to-gray-900 p-5 rounded-lg border border-gray-700 shadow-md transition-all duration-300"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-400 mb-1">Общее производство</p>
              <h3 className="text-2xl font-bold text-white">{formatNumber(totals.totalProduction)}</h3>
              <p className="text-xs text-gray-300 mt-1">
                за {year} год
              </p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 flex items-center justify-center text-orange-500 shadow-lg">
              <BarChart3 className="w-7 h-7" />
            </div>
          </div>
          <div className="mt-4 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
            />
          </div>
        </motion.div>
        
        {/* Внутренний рынок */}
        <motion.div 
          whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)' }}
          className="bg-gradient-to-br from-gray-800 to-gray-900 p-5 rounded-lg border border-gray-700 shadow-md transition-all duration-300"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-400 mb-1">Внутренний рынок</p>
              <h3 className="text-2xl font-bold text-white">{formatNumber(totals.totalDomestic)}</h3>
              <p className="text-xs text-gray-300 mt-1">
                {Math.round((totals.totalDomestic / totals.totalProduction) * 100)}% от общего объема
              </p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center text-blue-500 shadow-lg">
              <Home className="w-7 h-7" />
            </div>
          </div>
          <div className="mt-4 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(totals.totalDomestic / totals.totalProduction) * 100}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
            />
          </div>
        </motion.div>
        
        {/* Экспортный рынок */}
        <motion.div 
          whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)' }}
          className="bg-gradient-to-br from-gray-800 to-gray-900 p-5 rounded-lg border border-gray-700 shadow-md transition-all duration-300"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-400 mb-1">Экспортный рынок</p>
              <h3 className="text-2xl font-bold text-white">{formatNumber(totals.totalExport)}</h3>
              <p className="text-xs text-gray-300 mt-1">
                {Math.round((totals.totalExport / totals.totalProduction) * 100)}% от общего объема
              </p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 flex items-center justify-center text-green-500 shadow-lg">
              <ExternalLink className="w-7 h-7" />
            </div>
          </div>
          <div className="mt-4 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(totals.totalExport / totals.totalProduction) * 100}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
            />
          </div>
        </motion.div>
      </div>
      
   <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-br from-gray-800 to-gray-900 p-5 rounded-lg border border-gray-700 shadow-lg mb-6"
      >
        <h2 className="text-lg font-medium text-gray-200 flex items-center mb-5">
          <TrendingUp className="w-5 h-5 mr-2 text-orange-500" />
          Динамика производства
          <span className="ml-2 text-sm font-normal text-gray-400">
            {marketType === 'all' ? 'Все рынки' : 
             marketType === 'domestic' ? 'Внутренний рынок' : 'Экспортный рынок'}
          </span>
        </h2>
        
        <div ref={chartRef} className="w-full h-[400px]"></div>
        
        <p className="text-xs text-gray-400 mt-3 text-center">
          Нажмите на столбец месяца для просмотра детальной информации по моделям
        </p>
      </motion.div>
      
      {/* Детализация по месяцу */}
      <AnimatePresence>
        {selectedMonth && selectedMonthData && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 p-5 rounded-lg border border-gray-700 shadow-lg"
          >
            <h2 className="text-lg font-medium text-gray-200 flex items-center mb-5">
              <Calendar className="w-5 h-5 mr-2 text-green-500" />
              Производство за {getMonthName(selectedMonth)} {year}
              <span className="ml-auto text-sm bg-gray-700 px-3 py-1 rounded-full text-gray-300">
                {formatNumber(selectedMonthData.total)} авто
              </span>
            </h2>
            
            <div className="overflow-hidden rounded-lg border border-gray-700 shadow">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-800/80 sticky top-0">
                  <tr>
                    <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Модель</th>
                    <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Внутренний рынок</th>
                    <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Экспортный рынок</th>
                    <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Всего</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800/50 divide-y divide-gray-700">
                  {selectedMonthData.models.map((model, i) => (
                    <motion.tr 
                      key={model.id} 
                      className="hover:bg-gray-700/50 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      whileHover={{ backgroundColor: 'rgba(55, 65, 81, 0.5)' }}
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-18 h-12 bg-gray-700/70 rounded-md overflow-hidden border border-gray-600 transition-transform hover:scale-105 shadow-md">
                            <img 
                              src={model.img} 
                              alt={model.name} 
                              className="w-full h-full object-contain"
                              loading="lazy"
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">{model.name}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              {((model.total / selectedMonthData.total) * 100).toFixed(1)}% от общего
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-200">
                          {formatNumber(model.domestic)}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {((model.domestic / model.total) * 100).toFixed(0)}%
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-200">
                          {formatNumber(model.export)}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {((model.export / model.total) * 100).toFixed(0)}%
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-200">{formatNumber(model.total)}</div>
                        <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2 overflow-hidden">
                          <div 
                            className={`h-1.5 rounded-full ${i === 0 ? 'bg-gradient-to-r from-orange-500 to-amber-500' : 'bg-gradient-to-r from-gray-500 to-gray-600'}`}
                            style={{width: `${(model.total / selectedMonthData.models[0].total) * 100}%`}}
                          />
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-800/90">
                  <tr>
                    <td className="px-4 py-3.5 text-sm font-medium text-gray-200">Итого:</td>
                    <td className="px-4 py-3.5 text-sm font-medium text-gray-200">
                      {formatNumber(selectedMonthData.domestic)}
                    </td>
                    <td className="px-4 py-3.5 text-sm font-medium text-gray-200">
                      {formatNumber(selectedMonthData.export)}
                    </td>
                    <td className="px-4 py-3.5 text-sm font-medium text-gray-200">
                      {formatNumber(selectedMonthData.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Распределение по типу рынка */}
              <div className="p-4 bg-gray-800/60 rounded-lg border border-gray-700">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Распределение по типу рынка</h3>
                <div className="flex items-center space-x-3">
                  <div className="w-24 h-24 relative">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <circle 
                        cx="50" cy="50" r="40" 
                        fill="transparent" 
                        stroke="#374151" 
                        strokeWidth="15" 
                      />
                      <circle 
                        cx="50" cy="50" r="40" 
                        fill="transparent" 
                        stroke="#3b82f6" 
                        strokeWidth="15" 
                        strokeDasharray={`${2 * Math.PI * 40 * selectedMonthData.domestic / selectedMonthData.total} ${2 * Math.PI * 40}`}
                        strokeDashoffset={2 * Math.PI * 40 * 0.25}
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-xs text-gray-400">Внутренний</div>
                        <div className="text-sm font-medium text-white">
                          {((selectedMonthData.domestic / selectedMonthData.total) * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-blue-400">Внутренний</span>
                      <span className="text-xs text-gray-300">{formatNumber(selectedMonthData.domestic)}</span>
                    </div>
                    <div className="flex justify-between mb-3">
                      <span className="text-xs text-green-400">Экспортный</span>
                      <span className="text-xs text-gray-300">{formatNumber(selectedMonthData.export)}</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500"
                        style={{width: `${(selectedMonthData.domestic / selectedMonthData.total) * 100}%`}}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Топ модель месяца */}
              <div className="p-4 bg-gray-800/60 rounded-lg border border-gray-700">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Топ модель месяца</h3>
                <div className="flex items-center">
                  <div className="w-14 h-14 bg-gray-700 rounded-md overflow-hidden border border-gray-600 shadow mr-3">
                    <img 
                      src={selectedMonthData.models[0].img} 
                      alt={selectedMonthData.models[0].name} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{selectedMonthData.models[0].name}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatNumber(selectedMonthData.models[0].total)} автомобилей
                    </div>
                    <div className="text-xs text-gray-400">
                      {((selectedMonthData.models[0].total / selectedMonthData.total) * 100).toFixed(1)}% от объема
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Сравнение с предыдущим месяцем */}
              <div className="p-4 bg-gray-800/60 rounded-lg border border-gray-700">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Сравнение с предыдущим месяцем</h3>
                {prevMonthData ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Текущий месяц</span>
                      <span className="text-sm font-medium text-white">{formatNumber(selectedMonthData.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Предыдущий месяц</span>
                      <span className="text-sm font-medium text-gray-300">{formatNumber(prevMonthData.total)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400">Изменение</span>
                      <div className={`flex items-center text-sm font-medium ${selectedMonthData.total >= prevMonthData.total ? 'text-green-400' : 'text-red-400'}`}>
                        {selectedMonthData.total >= prevMonthData.total ? (
                          <ChevronUp size={16} className="mr-1" />
                        ) : (
                          <ChevronDown size={16} className="mr-1" />
                        )}
                        <span>
                          {getChangePercentage(selectedMonthData.total, prevMonthData.total)}%
                          ({formatNumber(Math.abs(selectedMonthData.total - prevMonthData.total))})
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-sm text-gray-400 mb-1">Данные не доступны</div>
                      <div className="text-xs text-gray-500">для сравнения с предыдущим месяцем</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductionDashboard;