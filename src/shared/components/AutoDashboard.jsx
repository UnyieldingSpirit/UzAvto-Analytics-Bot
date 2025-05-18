'use client';
import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// Импортируем иконки
import { BarChart3, Calendar, CarFront, TrendingUp, ExternalLink, Home, Filter, ChevronDown, ChevronUp } from 'lucide-react';

const ProductionDashboard = () => {
  // Состояния для управления фильтрами
  const [period, setPeriod] = useState('year');
  const [year, setYear] = useState('2025'); // Установлен 2025 год по умолчанию
  const [marketType, setMarketType] = useState('all');
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(false);
  
  // Состояние для выбранного месяца
  const [selectedMonth, setSelectedMonth] = useState(null);
  
  // Состояние для хранения данных API
  const [apiData, setApiData] = useState([]);
  
  // Состояние для отображения загрузки
  const [isLoading, setIsLoading] = useState(true);
  
  // Состояние для хранения ошибок API
  const [error, setError] = useState(null);
  
  // Рефы для элементов UI
  const chartRef = useRef(null);
  
  // Доступные годы
  const availableYears = ['2025', '2024', '2023', '2022'];
  
  // Функция для получения данных с API
  const fetchMarketData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Отправка запроса API с параметрами:', {
        begin_date: `01.01.${year}`,
        end_date: `31.12.${year}`
      });
      
      const response = await axios.post('https://uzavtosalon.uz/b/dashboard/infos&get_market_by_month', {
        begin_date: `01.01.${year}`,
        end_date: `31.12.${year}`
      });
      
      console.log('Получен ответ API:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setApiData(response.data);
      } else {
        setError('Получен некорректный ответ от API');
        setApiData([]);
      }
    } catch (err) {
      console.error('Ошибка при получении данных:', err);
      setError(`Ошибка загрузки данных: ${err.message}`);
      setApiData([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Загружаем данные при изменении года
  useEffect(() => {
    fetchMarketData();
  }, [year]);
  
  // Обработчик выбора месяца
  const handleMonthClick = (month) => {
    console.log('Выбран месяц:', month);
    setSelectedMonth(month === selectedMonth ? null : month);
  };
  
  // Обработчик изменения года
  const handleYearChange = (e) => {
    const selectedYear = e.target.value;
    setYear(selectedYear);
    setSelectedMonth(null);
  };
  
  // Отрисовка графика при изменении данных
  useEffect(() => {
    if (chartRef.current && apiData.length > 0) {
      console.log('Отрисовка графика с данными:', apiData);
      renderChart();
    }
  }, [marketType, selectedMonth, apiData]);
  
  // Функция для отрисовки графика
  const renderChart = () => {
    const container = chartRef.current;
    if (!container) return;
    
    // Очищаем контейнер перед отрисовкой
    d3.select(container).selectAll("*").remove();
    
    // Подготовка данных для графика
    const chartData = [];
    
    // Собираем уникальные месяцы для текущего года из всех моделей
    const months = new Set();
    
    apiData.forEach(model => {
      if (model.filter_by_month && Array.isArray(model.filter_by_month)) {
        model.filter_by_month.forEach(monthData => {
          if (monthData.month && monthData.month.startsWith(year)) {
            months.add(monthData.month);
          }
        });
      }
    });
    
    // Конвертируем в массив и сортируем
    const sortedMonths = Array.from(months).sort();
    console.log('Найдены уникальные месяцы:', sortedMonths);
    
    if (sortedMonths.length === 0) {
      console.log('Месяцы не найдены для года:', year);
      d3.select(container)
        .append("div")
        .attr("class", "flex items-center justify-center h-[400px] text-gray-400")
        .text(`Нет данных для отображения за ${year} год`);
      return;
    }
    
    // Для каждого месяца агрегируем данные по всем моделям
    sortedMonths.forEach(month => {
      let domestic = 0;
      let export_ = 0;
      
      apiData.forEach(model => {
        if (model.filter_by_month && Array.isArray(model.filter_by_month)) {
          const monthData = model.filter_by_month.find(m => m.month === month);
          
          if (monthData && monthData.states && Array.isArray(monthData.states)) {
            monthData.states.forEach(state => {
              // Преобразуем пустую строку в 0, иначе используем указанное значение
              let quantity = 0;
              if (state.quantity !== "" && state.quantity !== null && state.quantity !== undefined) {
                try {
                  quantity = parseInt(state.quantity, 10);
                  if (isNaN(quantity)) quantity = 0;
                } catch (e) {
                  console.error('Ошибка преобразования quantity:', state.quantity);
                  quantity = 0;
                }
              }
              
              if (state.state === 'ud') { // Внутренний рынок (domestic)
                domestic += quantity;
              } else if (state.state === 'ue') { // Экспорт (export)
                export_ += quantity;
              }
            });
          }
        }
      });
      
      const total = domestic + export_;
      chartData.push({
        month,
        domestic,
        export: export_,
        total
      });
    });
    
    console.log('Подготовленные данные для графика:', chartData);
    
    // Настройка размеров графика
    const margin = { top: 30, right: 30, bottom: 70, left: 60 };
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
    let data = chartData;
    if (marketType === 'domestic') {
      data = chartData.map(d => ({...d, value: d.domestic}));
    } else if (marketType === 'export') {
      data = chartData.map(d => ({...d, value: d.export}));
    } else {
      data = chartData.map(d => ({...d, value: d.total}));
    }
    
    // Шкалы для графика
    const x = d3.scaleBand()
      .domain(data.map(d => d.month))
      .range([0, width])
      .padding(0.3);
    
    // Находим максимальное значение для шкалы Y с небольшим отступом сверху
    const maxValue = d3.max(data, d => d.value) || 0;
    const yMax = maxValue * 1.1 > 0 ? maxValue * 1.1 : 100; // Если максимум равен 0, используем 100 для шкалы
    
    const y = d3.scaleLinear()
      .domain([0, yMax])
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
      .attr("y", d => y(d.value))  // Сразу устанавливаем конечную высоту
      .attr("height", d => height - y(d.value))  // Сразу устанавливаем конечную высоту
      .attr("fill", "url(#bar-gradient)")
      .attr("rx", 4)
      .attr("opacity", 0.9)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        d3.select(this)
          .attr("filter", "url(#glow)")
          .attr("opacity", 1);
      })
      .on("mouseout", function(event, d) {
        // Если столбец не выбран, убираем свечение
        if (!selectedMonth || selectedMonth.month !== d.month) {
          d3.select(this)
            .attr("filter", null)
            .attr("opacity", 0.9);
        }
      })
      .on("click", function(event, d) {
        handleMonthClick(d);
      });
    
    // Выделение выбранного месяца
    if (selectedMonth) {
      svg.selectAll(".bar")
        .filter(d => d.month === selectedMonth.month)
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
      .text(d => d.value)
      .transition()
      .duration(1000)
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
  };
  
  // Вычисляем итоговые показатели для отображения вверху
  const calculateTotals = () => {
    if (!apiData || apiData.length === 0) {
      return {
        totalProduction: 0,
        totalDomestic: 0,
        totalExport: 0
      };
    }
    
    let totalDomestic = 0;
    let totalExport = 0;
    
    apiData.forEach(model => {
      if (model.filter_by_month && Array.isArray(model.filter_by_month)) {
        model.filter_by_month.forEach(monthData => {
          // Проверяем, относится ли месяц к выбранному году
          if (monthData.month && monthData.month.startsWith(year)) {
            if (monthData.states && Array.isArray(monthData.states)) {
              monthData.states.forEach(state => {
                // Преобразуем пустую строку в 0, иначе используем указанное значение
                let quantity = 0;
                if (state.quantity !== "" && state.quantity !== null && state.quantity !== undefined) {
                  try {
                    quantity = parseInt(state.quantity, 10);
                    if (isNaN(quantity)) quantity = 0;
                  } catch (e) {
                    console.error('Ошибка преобразования quantity:', state.quantity);
                    quantity = 0;
                  }
                }
                
                if (state.state === 'ud') { // Внутренний рынок
                  totalDomestic += quantity;
                } else if (state.state === 'ue') { // Экспорт
                  totalExport += quantity;
                }
              });
            }
          }
        });
      }
    });
    
    const totalProduction = totalDomestic + totalExport;
    
    return {
      totalProduction,
      totalDomestic,
      totalExport
    };
  };
  
  const totals = calculateTotals();
  
  // Получаем детальные данные выбранного месяца
  const getSelectedMonthDetails = () => {
    if (!selectedMonth) return null;
    
    const monthModels = [];
    let totalDomestic = 0;
    let totalExport = 0;
    
    apiData.forEach(model => {
      if (model.filter_by_month && Array.isArray(model.filter_by_month)) {
        const monthData = model.filter_by_month.find(m => m.month === selectedMonth.month);
        
        if (monthData && monthData.states && Array.isArray(monthData.states)) {
          let domestic = 0;
          let export_ = 0;
          
          monthData.states.forEach(state => {
            // Преобразуем пустую строку в 0, иначе используем указанное значение
            let quantity = 0;
            if (state.quantity !== "" && state.quantity !== null && state.quantity !== undefined) {
              try {
                quantity = parseInt(state.quantity, 10);
                if (isNaN(quantity)) quantity = 0;
              } catch (e) {
                console.error('Ошибка преобразования quantity:', state.quantity);
                quantity = 0;
              }
            }
            
            if (state.state === 'ud') { // Внутренний рынок
              domestic += quantity;
              totalDomestic += quantity;
            } else if (state.state === 'ue') { // Экспорт
              export_ += quantity;
              totalExport += quantity;
            }
          });
          
          const total = domestic + export_;
          
          // Добавляем модель даже с нулевыми значениями
          monthModels.push({
            id: model.model_id,
            name: model.model_name,
            // URL изображения или заглушка, если photo_sha не определен
            img: model.photo_sha ? 
              `https://uzavtosalon.uz/b/assets/images/${model.photo_sha}.webp` : 
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E",
            domestic,
            export: export_,
            total
          });
        }
      }
    });
    
    // Сортировка моделей по общему количеству (по убыванию)
    monthModels.sort((a, b) => b.total - a.total);
    
    return {
      models: monthModels,
      domestic: totalDomestic,
      export: totalExport,
      total: totalDomestic + totalExport
    };
  };
  
  const selectedMonthDetails = selectedMonth ? getSelectedMonthDetails() : null;
  
  // Форматирование месяца для отображения
  const formatMonth = (monthStr) => {
    if (!monthStr) return '';
    
    const months = {
      '01': 'Январь',
      '02': 'Февраль',
      '03': 'Март',
      '04': 'Апрель',
      '05': 'Май',
      '06': 'Июнь',
      '07': 'Июль',
      '08': 'Август',
      '09': 'Сентябрь',
      '10': 'Октябрь',
      '11': 'Ноябрь',
      '12': 'Декабрь'
    };
    
    // Разбиваем строку формата "2025-01" на год и месяц
    const parts = monthStr.split('-');
    if (parts.length !== 2) return monthStr;
    
    const monthNum = parts[1];
    return months[monthNum] || monthNum;
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
      
      {/* Индикатор загрузки */}
      {isLoading && (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-lg border border-gray-700 shadow-lg mb-6 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
            <p className="text-gray-300">Загрузка данных...</p>
          </div>
        </div>
      )}
      
      {/* Сообщение об ошибке */}
      {error && (
        <div className="bg-gradient-to-br from-gray-800 to-red-900/20 p-6 rounded-lg border border-red-700 shadow-lg mb-6">
          <h3 className="text-lg font-medium text-red-400 mb-2">Ошибка загрузки данных</h3>
          <p className="text-gray-300">{error}</p>
        </div>
      )}
      
      {/* Ключевые показатели */}
      {!isLoading && apiData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Общее производство */}
          <motion.div 
            whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)' }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 p-5 rounded-lg border border-gray-700 shadow-md transition-all duration-300"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-400 mb-1">Общее производство</p>
                <h3 className="text-2xl font-bold text-white">{totals.totalProduction}</h3>
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
                <h3 className="text-2xl font-bold text-white">{totals.totalDomestic}</h3>
                <p className="text-xs text-gray-300 mt-1">
                  {totals.totalProduction > 0 ? Math.round((totals.totalDomestic / totals.totalProduction) * 100) : 0}% от общего объема
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center text-blue-500 shadow-lg">
                <Home className="w-7 h-7" />
              </div>
            </div>
            <div className="mt-4 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: totals.totalProduction > 0 ? `${(totals.totalDomestic / totals.totalProduction) * 100}%` : '0%' }}
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
                <h3 className="text-2xl font-bold text-white">{totals.totalExport}</h3>
                <p className="text-xs text-gray-300 mt-1">
                  {totals.totalProduction > 0 ? Math.round((totals.totalExport / totals.totalProduction) * 100) : 0}% от общего объема
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 flex items-center justify-center text-green-500 shadow-lg">
                <ExternalLink className="w-7 h-7" />
              </div>
            </div>
            <div className="mt-4 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: totals.totalProduction > 0 ? `${(totals.totalExport / totals.totalProduction) * 100}%` : '0%' }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
              />
            </div>
          </motion.div>
        </div>
      )}
      
      {/* График */}
      {!isLoading && apiData.length > 0 && (
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
      )}
      
      {/* Информация если нет данных */}
      {!isLoading && apiData.length === 0 && !error && (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-lg border border-gray-700 shadow-lg mb-6 text-center">
          <p className="text-gray-300">Нет данных для отображения за выбранный период</p>
        </div>
      )}
      
      {/* Детализация по месяцу */}
      <AnimatePresence>
        {selectedMonth && selectedMonthDetails && !isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 p-5 rounded-lg border border-gray-700 shadow-lg"
          >
            <h2 className="text-lg font-medium text-gray-200 flex items-center mb-5">
              <Calendar className="w-5 h-5 mr-2 text-green-500" />
              Производство за {formatMonth(selectedMonth.month)} {selectedMonth.month.split('-')[0]}
              <span className="ml-auto text-sm bg-gray-700 px-3 py-1 rounded-full text-gray-300">
                {selectedMonthDetails.total} авто
              </span>
            </h2>
            
            {selectedMonthDetails.models.length > 0 ? (
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
                    {selectedMonthDetails.models.map((model, i) => (
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
                                onError={(e) => {
                                  // Если изображение не загрузилось, показываем запасное изображение
                                  e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
                                }}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-white">{model.name}</div>
                              <div className="text-xs text-gray-400 mt-1">
                                {selectedMonthDetails.total > 0 ? ((model.total / selectedMonthDetails.total) * 100).toFixed(1) : 0}% от общего
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-200">
                            {model.domestic}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {model.total > 0 ? ((model.domestic / model.total) * 100).toFixed(0) : 0}%
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-200">
                            {model.export}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {model.total > 0 ? ((model.export / model.total) * 100).toFixed(0) : 0}%
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-200">{model.total}</div>
                          <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2 overflow-hidden">
                            <div 
                              className={`h-1.5 rounded-full ${i === 0 ? 'bg-gradient-to-r from-orange-500 to-amber-500' : 'bg-gradient-to-r from-gray-500 to-gray-600'}`}
                              style={{
                                width: selectedMonthDetails.models[0]?.total > 0 
                                  ? `${(model.total / selectedMonthDetails.models[0].total) * 100}%` 
                                  : '0%'
                              }}
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
                        {selectedMonthDetails.domestic}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-medium text-gray-200">
                        {selectedMonthDetails.export}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-medium text-gray-200">
                        {selectedMonthDetails.total}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="bg-gray-800/60 p-6 rounded-lg text-center">
                <p className="text-gray-300">Нет данных о моделях за выбранный месяц</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductionDashboard;