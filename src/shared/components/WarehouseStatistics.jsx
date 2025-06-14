// src/shared/components/ProductionStatistics.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as d3 from 'd3';
import { useThemeStore } from '../../store/theme';
import { useTranslation } from '../../hooks/useTranslation';
import { useLanguageStore } from '../../store/language';
import ContentReadyLoader from '../layout/ContentReadyLoader';

// Переводы для компонента
const productionTranslations = {
  'ru': {
    title: 'Статистика производства',
    subtitle: 'Мониторинг выполнения производственного плана',
    loading: 'Загрузка данных...',
    noData: 'Нет данных для отображения'
  },
  'uz': {
    title: 'Ishlab chiqarish statistikasi',
    subtitle: 'Ishlab chiqarish rejasini bajarish monitoringi',
    loading: 'Ma\'lumotlar yuklanmoqda...',
    noData: 'Ko\'rsatish uchun ma\'lumot yo\'q'
  }
};

export default function ProductionStatistics() {
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';
  const { currentLocale } = useLanguageStore();
  const { t } = useTranslation(productionTranslations);
  
  const [loading, setLoading] = useState(true);
  const [selectedFactory, setSelectedFactory] = useState('all');
  const [dailyData, setDailyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  
  // Refs для графиков
  const dailyChartRef = useRef(null);
  const monthlyChartRef = useRef(null);
  
  // Список заводов
  const factories = [
    { key: 'all', label: 'Все заводы', icon: '🏭' },
    { key: 'asaka', label: 'Асака', icon: '🚗' },
    { key: 'khorezm', label: 'Хорезм', icon: '🚙' },
    { key: 'scd', label: 'SCD', icon: '🚐' }
  ];
  
  // Генерация моковых данных
  useEffect(() => {
    generateMockData();
  }, [selectedFactory]);
  
  const generateMockData = () => {
    setLoading(true);
    
    // Данные по дням как на фото
    const dailyValues = [1389, 1359, 1345, 0, 0, 1103, 0, 1373, 1388, 1401, 1362, 0, 0, 786, 799];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = currentDate.getDate();
    
    const monthNames = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    const currentMonthName = monthNames[currentMonth];
    
    const daily = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const factValue = i < dailyValues.length ? dailyValues[i - 1] : 0;
      
      daily.push({
        day: i,
        monthName: currentMonthName,
        date: new Date(currentYear, currentMonth, i),
        plan: 1300,
        fact: factValue,
        isToday: i === today,
        isFuture: i > today
      });
    }
    
    // Данные по месяцам как на фото
    const monthlyValues = [9375, 37379, 35612, 32573, 32059, 12285, 0, 0, 0, 0, 0, 0];
    const monthly = [];
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    
    for (let i = 0; i < 12; i++) {
      monthly.push({
        month: months[i],
        monthIndex: i,
        plan: 33000,
        fact: monthlyValues[i],
        isCurrent: i === currentMonth,
        isFuture: i > currentMonth
      });
    }
    
    setDailyData(daily);
    setMonthlyData(monthly);
    
    setTimeout(() => setLoading(false), 500);
  };
  
  // Отрисовка графиков
  useEffect(() => {
    if (!loading && dailyData.length > 0) {
      renderDailyChart();
      renderMonthlyChart();
    }
  }, [loading, dailyData, monthlyData, isDark]);
  
const renderDailyChart = () => {
  if (!dailyChartRef.current) return;
  
  const container = dailyChartRef.current;
  container.innerHTML = '';
  
  const margin = { top: 50, right: 20, bottom: 60, left: 50 };
  const width = container.clientWidth - margin.left - margin.right;
  const height = 350 - margin.top - margin.bottom;
  
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);
  
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  
  // Создаем два градиента - синий и зеленый
  const defs = svg.append('defs');
  
  // Синий градиент
  const blueGradient = defs.append('linearGradient')
    .attr('id', 'blue-gradient')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '0%')
    .attr('y2', '100%');
  
  blueGradient.append('stop')
    .attr('offset', '0%')
    .attr('stop-color', '#60a5fa');
  
  blueGradient.append('stop')
    .attr('offset', '100%')
    .attr('stop-color', '#3b82f6');
  
  // Зеленый градиент
  const greenGradient = defs.append('linearGradient')
    .attr('id', 'green-gradient')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '0%')
    .attr('y2', '100%');
  
  greenGradient.append('stop')
    .attr('offset', '0%')
    .attr('stop-color', '#4ade80');
  
  greenGradient.append('stop')
    .attr('offset', '100%')
    .attr('stop-color', '#22c55e');
  
  // Шкалы
  const x = d3.scaleBand()
    .domain(dailyData.map(d => d.day))
    .range([0, width])
    .padding(0.1);
  
  const y = d3.scaleLinear()
    .domain([0, 2000])
    .range([height, 0]);
  
  // Создаем линию для плана
  const planLine = d3.line()
    .x(d => x(d.day) + x.bandwidth() / 2)
    .y(d => y(d.plan))
    .curve(d3.curveMonotoneX);
  
  // Добавляем область под линией плана для красивого эффекта
  const planArea = d3.area()
    .x(d => x(d.day) + x.bandwidth() / 2)
    .y0(height)
    .y1(d => y(d.plan))
    .curve(d3.curveMonotoneX);
  
  // Градиент для области плана
  const planGradient = defs.append('linearGradient')
    .attr('id', 'plan-gradient')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '0%')
    .attr('y2', '100%');
  
  planGradient.append('stop')
    .attr('offset', '0%')
    .attr('stop-color', '#ef4444')
    .attr('stop-opacity', 0.3);
  
  planGradient.append('stop')
    .attr('offset', '100%')
    .attr('stop-color', '#ef4444')
    .attr('stop-opacity', 0.05);
  
  // Рисуем область под линией плана
  g.append('path')
    .datum(dailyData)
    .attr('fill', 'url(#plan-gradient)')
    .attr('d', planArea);
  
  // Рисуем линию плана
  g.append('path')
    .datum(dailyData)
    .attr('fill', 'none')
    .attr('stroke', '#ef4444')
    .attr('stroke-width', 3)
    .attr('stroke-dasharray', '8,4')
    .attr('d', planLine)
    .style('filter', 'drop-shadow(0 2px 4px rgba(239, 68, 68, 0.3))');
  
  // Добавляем точки на линии плана
  g.selectAll('.plan-dot')
    .data(dailyData)
    .enter().append('circle')
    .attr('class', 'plan-dot')
    .attr('cx', d => x(d.day) + x.bandwidth() / 2)
    .attr('cy', d => y(d.plan))
    .attr('r', 4)
    .attr('fill', '#ef4444')
    .attr('stroke', isDark ? '#1f2937' : '#ffffff')
    .attr('stroke-width', 2);
  
  // Столбцы с чередующимися цветами
  g.selectAll('.bar')
    .data(dailyData.filter(d => !d.isFuture))
    .enter().append('rect')
    .attr('class', 'bar')
    .attr('x', d => x(d.day))
    .attr('width', x.bandwidth())
    .attr('y', d => d.fact > 0 ? y(d.fact) : height)
    .attr('height', d => d.fact > 0 ? height - y(d.fact) : 0)
    .attr('fill', (d, i) => i % 2 === 0 ? 'url(#blue-gradient)' : 'url(#green-gradient)')
    .attr('rx', 4)
    .style('opacity', 0.9)
    .style('filter', d => d.fact < d.plan ? 'brightness(0.8)' : 'brightness(1)');
  
  // Добавляем индикаторы выполнения плана на столбцах
  g.selectAll('.performance-indicator')
    .data(dailyData.filter(d => !d.isFuture && d.fact > 0))
    .enter().append('text')
    .attr('class', 'performance-indicator')
    .attr('x', d => x(d.day) + x.bandwidth() / 2)
    .attr('y', d => y(d.fact) - 35)
    .attr('text-anchor', 'middle')
    .style('font-size', '10px')
    .style('font-weight', '600')
    .style('fill', d => d.fact >= d.plan ? '#22c55e' : '#ef4444')
    .text(d => {
      const percentage = Math.round((d.fact / d.plan) * 100);
      return percentage >= 100 ? '✓' : `${percentage}%`;
    });
  
  // Значения на столбцах - делаем жирнее
  g.selectAll('.bar-text')
    .data(dailyData.filter(d => !d.isFuture && d.fact > 0))
    .enter().append('text')
    .attr('class', 'bar-text')
    .attr('x', d => x(d.day) + x.bandwidth() / 2)
    .attr('y', d => y(d.fact) - 15)
    .attr('text-anchor', 'middle')
    .attr('transform', d => `rotate(-90, ${x(d.day) + x.bandwidth() / 2}, ${y(d.fact) - 15})`)
    .style('fill', isDark ? '#ffffff' : '#1e293b')
    .style('font-size', '12px')
    .style('font-weight', '700')
    .text(d => d.fact.toLocaleString());
  
  // Пунктирные линии для ориентира
  dailyData.filter((d, i) => i % 5 === 0).forEach(d => {
    g.append('line')
      .attr('x1', x(d.day) + x.bandwidth() / 2)
      .attr('x2', x(d.day) + x.bandwidth() / 2)
      .attr('y1', height)
      .attr('y2', 0)
      .attr('stroke', isDark ? '#374151' : '#e5e7eb')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .style('opacity', 0.5);
  });
  
  // Добавляем легенду
  const legend = g.append('g')
    .attr('transform', `translate(${width - 150}, 10)`);
  
  // Легенда для плана
  legend.append('line')
    .attr('x1', 0)
    .attr('x2', 30)
    .attr('y1', 0)
    .attr('y2', 0)
    .attr('stroke', '#ef4444')
    .attr('stroke-width', 3)
    .attr('stroke-dasharray', '8,4');
  
  legend.append('text')
    .attr('x', 35)
    .attr('y', 4)
    .style('font-size', '12px')
    .style('fill', isDark ? '#d1d5db' : '#4b5563')
    .text('План (1300 шт/день)');
  
  // Легенда для факта
  legend.append('rect')
    .attr('x', 0)
    .attr('y', 15)
    .attr('width', 30)
    .attr('height', 15)
    .attr('fill', 'url(#blue-gradient)')
    .attr('rx', 2);
  
  legend.append('text')
    .attr('x', 35)
    .attr('y', 27)
    .style('font-size', '12px')
    .style('fill', isDark ? '#d1d5db' : '#4b5563')
    .text('Факт');
  
  // Добавляем среднюю линию выполнения плана
  const avgPerformance = d3.mean(
    dailyData.filter(d => !d.isFuture && d.fact > 0),
    d => (d.fact / d.plan) * 100
  );
  
  // Текст с общим процентом выполнения плана
  g.append('text')
    .attr('x', 10)
    .attr('y', -10)
    .style('font-size', '14px')
    .style('font-weight', '600')
    .style('fill', avgPerformance >= 95 ? '#22c55e' : '#ef4444')
    .text(`Среднее выполнение плана: ${avgPerformance.toFixed(1)}%`);
  
  // Ось X
  const xAxis = g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(''));
  
  // Подписи дней и месяцев под наклоном
  g.selectAll('.x-label')
    .data(dailyData)
    .enter().append('text')
    .attr('class', 'x-label')
    .attr('x', d => x(d.day) + x.bandwidth() / 2)
    .attr('y', height + 15)
    .attr('text-anchor', 'end')
    .attr('transform', d => `rotate(-45, ${x(d.day) + x.bandwidth() / 2}, ${height + 15})`)
    .style('fill', isDark ? '#9ca3af' : '#4b5563')
    .style('font-size', '10px')
    .text(d => `${d.day} ${d.monthName}`);
  
  // Ось Y
  g.append('g')
    .call(d3.axisLeft(y).ticks(5))
    .selectAll('text')
    .style('fill', isDark ? '#9ca3af' : '#4b5563');
  
  // Метка для оси Y
  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0 - margin.left)
    .attr('x', 0 - (height / 2))
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .style('fill', isDark ? '#9ca3af' : '#4b5563')
    .style('font-size', '12px')
    .text('Количество (шт)');
};
  
  const renderMonthlyChart = () => {
    if (!monthlyChartRef.current) return;
    
    const container = monthlyChartRef.current;
    container.innerHTML = '';
    
    const margin = { top: 30, right: 20, bottom: 50, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Градиент для столбцов
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'month-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#34d399');
    
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#10b981');
    
    // Шкалы
    const x = d3.scaleBand()
      .domain(monthlyData.map(d => d.month))
      .range([0, width])
      .padding(0.2);
    
    const y = d3.scaleLinear()
      .domain([0, 45000])
      .range([height, 0]);
    
    // Столбцы
    g.selectAll('.bar')
      .data(monthlyData)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.month))
      .attr('width', x.bandwidth())
      .attr('y', d => d.fact > 0 ? y(d.fact) : height)
      .attr('height', d => d.fact > 0 ? height - y(d.fact) : 0)
      .attr('fill', d => d.fact === 0 ? (isDark ? '#374151' : '#e5e7eb') : 'url(#month-gradient)')
      .attr('rx', 4)
      .style('opacity', d => d.fact === 0 ? 0.3 : 0.9);
    
    // Значения на столбцах
    g.selectAll('.text')
      .data(monthlyData.filter(d => d.fact > 0))
      .enter().append('text')
      .attr('x', d => x(d.month) + x.bandwidth() / 2)
      .attr('y', d => y(d.fact) - 5)
      .attr('text-anchor', 'middle')
      .style('fill', isDark ? '#f3f4f6' : '#1e293b')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .text(d => d.fact.toLocaleString());
    
    // Оси
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('fill', isDark ? '#9ca3af' : '#4b5563');
    
    g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => (d / 1000) + 'K'))
      .selectAll('text')
      .style('fill', isDark ? '#9ca3af' : '#4b5563');
  };
  
  // Компонент ячейки таблицы
const highlightKeywords = (text) => {
  const keywords = ['РЕЖА', 'ФАКТ', 'ФАРҚ', 'фойзда', 'Ойлик', 'Йиллик', 'Ўртача'];
  let highlightedText = text;
  
  keywords.forEach(keyword => {
    highlightedText = highlightedText.replace(
      new RegExp(keyword, 'g'),
      `<span class="font-extrabold text-current">${keyword}</span>`
    );
  });
  
  return highlightedText;
};

// Обновленный компонент TableCell
const TableCell = ({ label, value, color, large = false, colSpan = 1 }) => {
  const getBgColor = () => {
    if (color === 'orange') return isDark ? 'bg-orange-900/20' : 'bg-orange-50';
    if (color === 'blue') return isDark ? 'bg-blue-900/20' : 'bg-blue-50';
    if (color === 'green') return isDark ? 'bg-green-900/20' : 'bg-green-50';
    if (color === 'red') return isDark ? 'bg-red-900/20' : 'bg-red-50';
    return isDark ? 'bg-gray-800' : 'bg-gray-100';
  };
  
  const getTextColor = () => {
    if (color === 'orange') return 'text-orange-600';
    if (color === 'blue') return 'text-blue-600';
    if (color === 'green') return 'text-green-600';
    if (color === 'red') return 'text-red-600';
    return isDark ? 'text-gray-900' : 'text-gray-900';
  };
  
  const getLabelColor = () => {
    return isDark ? 'text-gray-400' : 'text-gray-600';
  };
  
  return (
    <td 
      colSpan={colSpan}
      className={`border ${isDark ? 'border-gray-700' : 'border-gray-300'} ${getBgColor()}`}
    >
      <div className="p-4 h-full flex flex-col justify-center items-center text-center">
        {label && (
          <div className={`text-xs font-medium ${getLabelColor()} mb-2 leading-tight`}>
            {label.split('\n').map((line, i) => (
              <div 
                key={i} 
                dangerouslySetInnerHTML={{ __html: highlightKeywords(line) }}
              />
            ))}
          </div>
        )}
        <div className="border-t border-gray-300 w-full my-2"></div>
        <div className={`${large ? 'text-3xl' : 'text-2xl'} font-extrabold ${getTextColor()}`}>
          {value}
        </div>
      </div>
    </td>
  );
};
  
  if (loading) {
    return <ContentReadyLoader />;
  }
  
  return (
    <div className={`p-4 md:p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen`}>
      {/* Заголовок с датой справа */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-lg`}
      >
        <div className="flex justify-between items-center">
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Асака ва Хоразм ишлаб чиқариш ҳисоботи
          </h1>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-800'} text-base font-semibold`}>
            {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </motion.div>
      
      {/* Табы для выбора завода */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'} p-2 rounded-xl shadow-lg`}
      >
        <div className="flex flex-wrap gap-2">
          {factories.map((factory) => (
            <button
              key={factory.key}
              onClick={() => setSelectedFactory(factory.key)}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                selectedFactory === factory.key
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : isDark 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="flex items-center gap-2">
                {factory.icon}
                {factory.label}
              </span>
            </button>
          ))}
        </div>
      </motion.div>
      
      {/* График по дням и таблица месячных показателей */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* График по дням */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-4 rounded-xl shadow-lg`}
        >
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
            Ойлик ишлаб чиқариш #630 Event
          </h2>
          <div ref={dailyChartRef} className="w-full" style={{ height: '400px' }} />
        </motion.div>
        
        {/* Таблица месячных показателей */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-4 rounded-xl shadow-lg`}
          style={{ height: '464px' }}
        >
          <div className="h-full flex flex-col">
            <table className="w-full border-collapse flex-grow">
              <tbody className="h-full">
                {/* Первая строка - занимает 33% высоты */}
                <tr className="h-1/3">
                  <TableCell 
                    label="Ойлик РЕЖА" 
                    value="33 000" 
                    color="orange"
                    large
                  />
                  <TableCell 
                    label="Ойлик РЕЖА
(шу кунгача)" 
                    value="12 195" 
                    color="orange"
                    large
                  />
                  <TableCell 
                    label="Ойлик РЕЖА
Шу кунгача
(фойзда)" 
                    value="37%" 
                    color="blue"
                    large
                  />
                </tr>
                
                {/* Вторая строка - занимает 33% высоты */}
                <tr className="h-1/3">
                  <TableCell 
                    label="Ойлик ФАКТ" 
                    value="12 285" 
                    color="orange"
                  />
                  <TableCell 
                    label="Ўртача
иш. чиқариш
(бир кунлик)" 
                    value="1 229" 
                    color="orange"
                  />
                  <TableCell 
                    label="Ойлик ФАКТ
Шу кунгача
(фойзда)" 
                    value="37%" 
                    color="blue"
                  />
                </tr>
                
                {/* Третья строка - занимает 33% высоты */}
                <tr className="h-1/3">
                  <TableCell 
                    label="Ойлик РЕЖАга
нисбатан ФАРҚ" 
                    value="-20 715" 
                    color="red"
                  />
                  <TableCell 
                    label="Ойлик РЕЖАга
нисбатан ФАРҚ
(Шу кунгача)" 
                    value="90" 
                    color="orange"
                  />
                  <TableCell 
                    label="Фойзда ФАРҚ
Шу кунгача" 
                    value="0%" 
                    color=""
                  />
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
      
      {/* График по месяцам и таблица годовых показателей */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* График по месяцам */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-4 rounded-xl shadow-lg`}
        >
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
            Йиллик ишлаб чиқариш #630 Event
          </h2>
          <div ref={monthlyChartRef} className="w-full" style={{ height: '400px' }} />
        </motion.div>
        
        {/* Таблица годовых показателей */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-4 rounded-xl shadow-lg`}
          style={{ minHeight: '464px' }}
        >
          <div className="h-full flex flex-col">
            <table className="w-full border-collapse flex-grow mb-4">
              <tbody className="h-full">
                {/* Первая строка */}
                <tr className="h-1/3">
                  <TableCell 
                    label="Йиллик РЕЖА" 
                    value="376 000" 
                    color="green"
                    large
                  />
                  <TableCell 
                    label="Йиллик РЕЖА
(Шу кунгача - 630)" 
                    value="159 193" 
                    color="green"
                    large
                  />
                  <TableCell 
                    label="Йиллик РЕЖА
Шу кунгача
(фойзда)" 
                    value="42%" 
                    color="blue"
                    large
                  />
                </tr>
                
                {/* Вторая строка с объединенными ячейками */}
                <tr className="h-1/3">
                  <td colSpan="2" className={`border ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
                    <div className={`p-4 h-full ${isDark ? 'bg-green-900/20' : 'bg-green-50'}`}>
                      <div className="text-xs font-medium text-orange-600 mb-2">
                        Йиллик ФАКТ
                      </div>
                      <div className="text-xl font-bold text-green-600">
                        159 283
                      </div>
                    </div>
                  </td>
                  <td className={`border ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
                    <div className={`p-4 h-full ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                      <div className="text-xs font-medium text-orange-600 mb-2">
                        Йиллик ФАКТ
Шу кунгача
(фойзда)
                      </div>
                      <div className="text-xl font-bold text-blue-600">42%</div>
                    </div>
                  </td>
                </tr>
                
                {/* Третья строка */}
                <tr className="h-1/3">
                  <TableCell 
                    label="Йиллик РЕЖАга
нисбатан ФАРҚ" 
                    value="-216 717" 
                    color="red"
                  />
                  <TableCell 
                    label="Йиллик РЕЖАга
нисбатан ФАРҚ
(Шу кунгача)" 
                    value="90" 
                    color="orange"
                  />
                  <TableCell 
                    label="Фойзда ФАРҚ
Шу кунгача" 
                    value="0%" 
                    color=""
                  />
                </tr>
              </tbody>
            </table>
            
            {/* Дополнительная информация */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-4 text-center border ${isDark ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'} rounded-lg`}>
                <div className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                  Ўтган йили шу кунда
                </div>
                <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  157 101
                </div>
              </div>
              <div className={`p-4 text-center border ${isDark ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'} rounded-lg`}>
                <div className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                  Фарқи
                </div>
                <div className="text-lg font-bold text-green-500 flex items-center justify-center gap-1">
                  <span>↑</span>
                  <span>2 182</span>
                </div>
              </div>
              <div className={`p-4 text-center border ${isDark ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'} rounded-lg`}>
                <div className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                  Йиллик ФАКТ #700 (шу кунгача)
                </div>
                <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  161 189
                </div>
              </div>
              <div className={`p-4 text-center border ${isDark ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'} rounded-lg`}>
                <div className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                  % брака
                </div>
                <div className="text-lg font-bold text-green-500">
                  0.8%
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}