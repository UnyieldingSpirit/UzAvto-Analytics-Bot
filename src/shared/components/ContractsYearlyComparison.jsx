import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import axios from 'axios';
import { contractsYearlyComparisonTranslations } from './locales/ContractsYearlyComparison';
import { useAuth } from '../../hooks/useAuth';

const ContractsYearlyComparison = ({ selectedRegion, selectedModel, activeTab, currentLocale }) => {
  const chartRef = useRef(null);
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
    const { checkAuth } = useAuth();
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);
  // Получаем переводы
  const t = contractsYearlyComparisonTranslations[currentLocale];
  
  // Получаем текущий и предыдущий год
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;
  
  // Массив названий месяцев из переводов
  const MONTHS = [
    t.months.january,
    t.months.february,
    t.months.march,
    t.months.april,
    t.months.may,
    t.months.june,
    t.months.july,
    t.months.august,
    t.months.september,
    t.months.october,
    t.months.november,
    t.months.december
  ];
  
  // Функция для форматирования чисел
  const formatNumber = (value) => {
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(0) + 'K';
    return value;
  };
  
  // Функция для форматирования валюты
  const formatCurrency = (value) => {
    return new Intl.NumberFormat(currentLocale === 'ru' ? 'ru-RU' : 'uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Функция для форматирования даты в формат API
  const formatDateForAPI = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    } catch (error) {
      console.error(t.console.dateFormatError, error);
      return '';
    }
  };
  
  // Получение данных по API
const fetchYearData = async (year) => {
    const token = localStorage.getItem('authToken');
    
    // Формируем диапазон дат
    const beginDate = formatDateForAPI(`${year}-01-01`);
    const endDate = formatDateForAPI(`${year}-12-31`);
    
    // Формируем URL API в зависимости от активного таба
    let apiUrl;
    
    switch(activeTab) {
      case 'sales':
        apiUrl = '/b/dashboard/infos&auto_reazlization';
        break;
      case 'stock':
        apiUrl = '/b/dashboard/infos&auto_stock';
        break;
      case 'retail':
        apiUrl = '/b/dashboard/infos&auto_retail';
        break;
      case 'wholesale':
        apiUrl = '/b/dashboard/infos&auto_wholesale';
        break;
      case 'promotions':
        apiUrl = '/b/dashboard/infos&auto_promotions';
        break;
      case 'contracts':
      default:
        apiUrl = '/b/dashboard/infos&auto_analytics';
    }
    
    const requestData = {
      url: apiUrl,
      begin_date: beginDate,
      end_date: endDate,
    };
    
    // Добавляем фильтры, если они указаны
    if (selectedModel !== 'all') {
      requestData.model_id = selectedModel;
    }
    
    if (selectedRegion !== 'all') {
      requestData.region_id = selectedRegion;
    }
    
    try {
      console.log(t.console.requestData.replace('{{year}}', year), requestData);
      const response = await axios.post('https://uzavtoanalytics.uz/dashboard/proxy', requestData, {
        headers: {
          'X-Auth': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error(t.console.errorLoadingYear.replace('{{year}}', year), error);
      return null;
    }
  };
  
  // Обработка и подготовка данных
  const prepareMonthlyData = (apiData, year) => {
    if (!apiData || !Array.isArray(apiData)) {
      return Array(12).fill(0).map((_, idx) => ({
        month: idx + 1,
        value: 0,
        year
      }));
    }
    
    // Инициализируем массив с нулевыми значениями
    const monthlyData = Array(12).fill(0).map((_, idx) => ({
      month: idx + 1,
      name: MONTHS[idx],
      value: 0,
      year
    }));
    
    // Получаем ключ для значений в зависимости от активного таба
    const getValueKey = () => {
      switch(activeTab) {
        case 'contracts': return 'contract';
        case 'sales': return 'count';
        case 'stock': return 'count';
        case 'retail': return 'count';
        case 'wholesale': return 'count';
        case 'promotions': return 'count';
        default: return 'contract';
      }
    };
    
    const valueKey = getValueKey();
    
    // Обрабатываем данные из API
    apiData.forEach(model => {
      // Если выбрана конкретная модель, фильтруем
      if (selectedModel !== 'all' && model.model_id !== selectedModel) {
        return;
      }
      
      if (model.filter_by_month && Array.isArray(model.filter_by_month)) {
        model.filter_by_month.forEach(monthData => {
          // Проверяем, относится ли запись к нужному году
          if (!monthData.month || !monthData.month.startsWith(year)) {
            return;
          }
          
          // Получаем номер месяца (1-12)
          const monthParts = monthData.month.split('-');
          if (monthParts.length !== 2) return;
          
          const monthIndex = parseInt(monthParts[1], 10) - 1;
          if (monthIndex < 0 || monthIndex > 11) return;
          
          // Обрабатываем данные по регионам за месяц
          if (monthData.regions && Array.isArray(monthData.regions)) {
            if (selectedRegion !== 'all') {
              // Если выбран конкретный регион, фильтруем данные
              const regionData = monthData.regions.find(r => r.region_id === selectedRegion);
              if (regionData) {
                monthlyData[monthIndex].value += parseInt(regionData[valueKey] || regionData.contract || regionData.count || 0);
              }
            } else {
              // Если регион не выбран, суммируем по всем регионам
              monthData.regions.forEach(region => {
                monthlyData[monthIndex].value += parseInt(region[valueKey] || region.contract || region.count || 0);
              });
            }
          }
        });
      }
    });
    
    return monthlyData;
  };

  // Загрузка данных при изменении параметров
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      try {
        // Загружаем данные за текущий и предыдущий годы параллельно
        const [currentYearData, previousYearData] = await Promise.all([
          fetchYearData(currentYear),
          fetchYearData(previousYear)
        ]);
        
        // Если данные успешно загружены, подготавливаем их для графика
        if (currentYearData && previousYearData) {
          setChartData({
            currentYear: prepareMonthlyData(currentYearData, currentYear),
            previousYear: prepareMonthlyData(previousYearData, previousYear)
          });
          setError(null);
        } else {
          setError(t.errors.loadDataError);
        }
      } catch (err) {
        console.error(t.errors.loadingDataError, err);
        setError(t.errors.generalError);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [selectedRegion, selectedModel, activeTab, currentLocale]); // Добавляем currentLocale в зависимости
  
  // Рендеринг графика при изменении данных
  useEffect(() => {
    if (chartData && !isLoading && chartRef.current) {
      renderChart();
    }
  }, [chartData, isLoading, currentLocale]); // Добавляем currentLocale в зависимости
  
  // Функция для рендеринга графика
  const renderChart = () => {
    if (!chartRef.current || !chartData) return;
    
    const container = chartRef.current;
    container.innerHTML = '';
    
    // Получаем размеры контейнера
    const width = container.clientWidth;
    const height = 300;
    const margin = { top: 30, right: 30, bottom: 50, left: 60 };
    
    // Создаем SVG элемент
    const svg = d3.select(container)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Получаем данные за текущий и предыдущий год
    const currentYearData = chartData.currentYear;
    const previousYearData = chartData.previousYear;
    
    // Определяем, до какого месяца текущего года у нас есть данные
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const availableMonths = currentMonth + 1;
    
    // Фильтруем данные текущего года по доступным месяцам
    const filteredCurrentYearData = currentYearData.slice(0, availableMonths);
    
    // Объединяем данные для определения диапазона шкалы Y
    const allData = [...previousYearData, ...filteredCurrentYearData];
    
    // Создаем шкалу X
    const x = d3.scaleBand()
      .domain(MONTHS)
      .range([0, width - margin.left - margin.right])
      .padding(0.3);
    
    // Находим максимальное значение для шкалы Y
    const maxValue = d3.max(allData, d => d.value) * 1.1 || 100;
    
    // Создаем шкалу Y
    const y = d3.scaleLinear()
      .domain([0, maxValue])
      .nice()
      .range([height - margin.top - margin.bottom, 0]);
    
    // Сетка
    svg.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y)
        .tickSize(-(width - margin.left - margin.right))
        .tickFormat("")
      )
      .style("stroke", "#333")
      .style("stroke-opacity", "0.1");
    
    // Ось X
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)")
      .style("fill", "#999");
    
    // Ось Y
    svg.append("g")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("fill", "#999");
    
    // Ширина столбца
    const barWidth = x.bandwidth() / 2 - 2;
    
    // Создаем блок тултипа
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "chart-tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background", "rgba(30, 41, 59, 0.9)")
      .style("color", "#fff")
      .style("padding", "8px 12px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("z-index", 1000)
      .style("transition", "opacity 0.2s");
    
    // Вспомогательная функция для получения названия метрики
    function getMetricName() {
      switch(activeTab) {
        case 'contracts': return t.metrics.contracts;
        case 'sales': return t.metrics.sales;
        case 'stock': return t.metrics.stock;
        case 'retail': return t.metrics.retail;
        case 'wholesale': return t.metrics.wholesale;
        case 'promotions': return t.metrics.promotions;
        default: return t.metrics.contracts;
      }
    }
    
    // Рисуем столбцы предыдущего года
    svg.selectAll(".bar-prev-year")
      .data(previousYearData)
      .enter().append("rect")
      .attr("class", "bar-prev-year")
      .attr("x", d => x(MONTHS[d.month - 1]))
      .attr("y", d => y(d.value))
      .attr("width", barWidth)
      .attr("height", d => height - margin.top - margin.bottom - y(d.value))
      .attr("fill", "#4CAF50")
      .attr("rx", 3)
      .attr("ry", 3)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        tooltip
          .html(`
            <div>
              <div style="font-weight: bold; margin-bottom: 4px;">${MONTHS[d.month - 1]} ${previousYear}</div>
              <div>${getMetricName()}: ${d.value.toLocaleString(currentLocale === 'ru' ? 'ru-RU' : 'uz-UZ')}</div>
            </div>
          `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 40) + "px")
          .transition()
          .duration(200)
          .style("opacity", 1);
        
        d3.select(this)
          .attr("opacity", 0.8);
      })
      .on("mousemove", function(event) {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 40) + "px");
      })
      .on("mouseout", function() {
        tooltip
          .transition()
          .duration(200)
          .style("opacity", 0);
        
        d3.select(this)
          .attr("opacity", 1);
      });
    
    // Рисуем столбцы текущего года, но только для доступных месяцев
    svg.selectAll(".bar-curr-year")
      .data(filteredCurrentYearData)
      .enter().append("rect")
      .attr("class", "bar-curr-year")
      .attr("x", d => x(MONTHS[d.month - 1]) + barWidth + 2)
      .attr("y", d => y(d.value))
      .attr("width", barWidth)
      .attr("height", d => height - margin.top - margin.bottom - y(d.value))
      .attr("fill", "#2196F3")
      .attr("rx", 3)
      .attr("ry", 3)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        tooltip
          .html(`
            <div>
              <div style="font-weight: bold; margin-bottom: 4px;">${MONTHS[d.month - 1]} ${currentYear}</div>
              <div>${getMetricName()}: ${d.value.toLocaleString(currentLocale === 'ru' ? 'ru-RU' : 'uz-UZ')}</div>
            </div>
          `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 40) + "px")
          .transition()
          .duration(200)
          .style("opacity", 1);
        
        d3.select(this)
          .attr("opacity", 0.8);
      })
      .on("mousemove", function(event) {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 40) + "px");
      })
      .on("mouseout", function() {
        tooltip
          .transition()
          .duration(200)
          .style("opacity", 0);
        
        d3.select(this)
          .attr("opacity", 1);
      });
    
    // Добавляем метки значений для предыдущего года
    svg.selectAll(".label-prev-year")
      .data(previousYearData)
      .enter().append("text")
      .attr("class", "label-prev-year")
      .attr("x", d => x(MONTHS[d.month - 1]) + barWidth / 2)
      .attr("y", d => y(d.value) - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "#fff")
      .text(d => formatNumber(d.value));
    
    // Добавляем метки значений для текущего года
    svg.selectAll(".label-curr-year")
      .data(filteredCurrentYearData)
      .enter().append("text")
      .attr("class", "label-curr-year")
      .attr("x", d => x(MONTHS[d.month - 1]) + barWidth + 2 + barWidth / 2)
      .attr("y", d => y(d.value) - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "#fff")
      .text(d => formatNumber(d.value));
    
    // Добавляем цветовые индикаторы под графиком для лучшей читаемости
    const indicatorsY = height - margin.top - margin.bottom + 35;

    // Индикатор для предыдущего года
    svg.append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", "#4CAF50")
      .attr("rx", 2)
      .attr("ry", 2)
      .attr("x", width / 2 - 120)
      .attr("y", indicatorsY);

    svg.append("text")
      .attr("x", width / 2 - 102)
      .attr("y", indicatorsY + 9)
      .style("font-size", "11px")
      .style("fill", "#ccc")
      .text(`${previousYear} ${t.ui.year}`);

    // Индикатор для текущего года
    svg.append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", "#2196F3")
      .attr("rx", 2)
      .attr("ry", 2)
      .attr("x", width / 2 + 20)
      .attr("y", indicatorsY);

    svg.append("text")
      .attr("x", width / 2 + 38)
      .attr("y", indicatorsY + 9)
      .style("font-size", "11px")
      .style("fill", "#ccc")
      .text(`${currentYear} ${t.ui.year}`);
    
    // Добавляем линию текущего месяца
    if (currentMonth < 12) {
      svg.append("line")
        .attr("x1", x(MONTHS[currentMonth]) + x.bandwidth())
        .attr("y1", 0)
        .attr("x2", x(MONTHS[currentMonth]) + x.bandwidth())
        .attr("y2", height - margin.top - margin.bottom)
        .attr("stroke", "#FF9800")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4,4");
      
      svg.append("text")
        .attr("x", x(MONTHS[currentMonth]) + x.bandwidth())
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .style("fill", "#FF9800")
        .text(t.ui.currentMonth);
    }
  };
  
  // При размонтировании компонента удаляем все тултипы
  useEffect(() => {
    return () => {
      d3.select('body').selectAll('.chart-tooltip').remove();
    };
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary dark:border-primary-dark"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-gray-400 text-center mb-3">{error}</p>
        <button 
          className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors" 
          onClick={() => {
            setIsLoading(true);
            setError(null);
            // Перезагружаем данные
            const loadData = async () => {
              try {
                const [currentYearData, previousYearData] = await Promise.all([
                  fetchYearData(currentYear),
                  fetchYearData(previousYear)
                ]);
                
                if (currentYearData && previousYearData) {
                  setChartData({
                    currentYear: prepareMonthlyData(currentYearData, currentYear),
                    previousYear: prepareMonthlyData(previousYearData, previousYear)
                  });
                  setError(null);
                } else {
                  setError(t.errors.loadDataError);
                }
              } catch (err) {
                setError(t.errors.generalError);
              } finally {
                setIsLoading(false);
              }
            };
            loadData();
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {t.ui.retryButton}
        </button>
      </div>
    );
  }
  
  return (
    <div className="w-full h-full" ref={chartRef}></div>
  );
};

export default ContractsYearlyComparison;