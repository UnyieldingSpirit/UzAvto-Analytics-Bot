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
    { key: 'all', label: 'Все производство', icon: '🏭' },
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
    const date = new Date(currentYear, currentMonth, i);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    const factValue = i < dailyValues.length ? dailyValues[i - 1] : 0;
    
    // Определяем план с учетом выходных и возможных остановок производства
    let planValue = 1300;
    if (isWeekend) {
      planValue = 0; // Выходные
    } else if (i === 4 || i === 5) {
      planValue = 0; // Плановая остановка производства
    } else if (i === 12 || i === 13) {
      planValue = 0; // Еще одна плановая остановка производства 
    }
    
    daily.push({
      day: i,
      monthName: currentMonthName,
      date: date,
      plan: planValue,
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
  
  // Градиенты
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
  
  // Оси
  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(''))
    .select('.domain')
    .style('stroke', isDark ? '#4b5563' : '#d1d5db');
  
  g.append('g')
    .call(d3.axisLeft(y).ticks(5))
    .select('.domain')
    .style('stroke', isDark ? '#4b5563' : '#d1d5db');
  
  // Стиль для осей
  g.selectAll('.tick line')
    .style('stroke', isDark ? '#4b5563' : '#d1d5db');
  
  g.selectAll('.tick text')
    .style('fill', isDark ? '#9ca3af' : '#4b5563');
  
  // Горизонтальные линии сетки
  g.selectAll('.grid-line')
    .data(y.ticks(5))
    .enter().append('line')
    .attr('class', 'grid-line')
    .attr('x1', 0)
    .attr('x2', width)
    .attr('y1', d => y(d))
    .attr('y2', d => y(d))
    .attr('stroke', isDark ? '#374151' : '#e5e7eb')
    .attr('stroke-width', 0.5)
    .attr('stroke-dasharray', '2,2')
    .style('opacity', 0.5);
  
  // Столбцы с чередующимися цветами
  g.selectAll('.bar')
    .data(dailyData.filter(d => !d.isFuture))
    .enter().append('rect')
    .attr('class', 'bar')
    .attr('x', d => x(d.day))
    .attr('width', x.bandwidth())
    .attr('y', height)
    .attr('height', 0)
    .attr('fill', (d, i) => i % 2 === 0 ? 'url(#blue-gradient)' : 'url(#green-gradient)')
    .attr('rx', 4)
    .style('opacity', 0.9)
    .transition()
    .duration(500)
    .delay((d, i) => i * 30)
    .attr('y', d => d.fact > 0 ? y(d.fact) : height)
    .attr('height', d => d.fact > 0 ? height - y(d.fact) : 0);
  
  // Значения на столбцах
// Значения на столбцах (вертикально) с большим отступом
g.selectAll('.bar-text')
  .data(dailyData.filter(d => !d.isFuture && d.fact > 0))
  .enter().append('text')
  .attr('class', 'bar-text')
  .attr('x', d => x(d.day) + x.bandwidth() / 2)
  .attr('y', d => y(d.fact) - 20) // Увеличен отступ с -15 до -25
  .attr('text-anchor', 'middle')
  .attr('transform', d => `rotate(-90, ${x(d.day) + x.bandwidth() / 2}, ${y(d.fact) - 25})`)
  .style('fill', isDark ? '#ffffff' : '#1e293b')
  .style('font-size', '12px')
  .style('font-weight', '700')
  .style('opacity', 0)
  .transition()
  .duration(500)
  .delay((d, i) => i * 30 + 200)
  .style('opacity', 1)
  .text(d => d.fact.toLocaleString());

// Индикаторы выполнения плана тоже сдвигаем
g.selectAll('.performance-indicator')
  .data(dailyData.filter(d => !d.isFuture && d.fact > 0 && d.plan > 0))
  .enter().append('text')
  .attr('class', 'performance-indicator')
  .attr('x', d => x(d.day) + x.bandwidth() / 2)
  .attr('y', d => y(d.fact) - 45) // Увеличен отступ с -35 до -45
  .attr('text-anchor', 'middle')
  .style('font-size', '9px')
  .style('font-weight', '600')
  .style('fill', d => d.fact >= d.plan ? '#22c55e' : '#ef4444')
  .style('opacity', 0)
  .transition()
  .duration(500)
  .delay((d, i) => i * 30 + 400)
  .style('opacity', 1)
  .text(d => {
    const percentage = Math.round((d.fact / d.plan) * 100);
    return percentage >= 100 ? '✓' : `${percentage}%`;
  });
  
  // Линия плана - оранжевая пунктирная как на фото
  const planLine = d3.line()
    .x(d => x(d.day) + x.bandwidth() / 2)
    .y(d => y(d.plan))
    .curve(d3.curveLinear);
  
  // Рисуем линию плана
  g.append('path')
    .datum(dailyData)
    .attr('fill', 'none')
    .attr('stroke', '#f97316')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '6,3')
    .attr('d', planLine)
    .style('opacity', 0)
    .transition()
    .duration(800)
    .delay(500)
    .style('opacity', 1);
  
  // Подписи дней под наклоном
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
  
  
  // Легенда
  const legend = g.append('g')
    .attr('transform', `translate(${width - 150}, -15)`);
  
  // План
  legend.append('line')
    .attr('x1', 0)
    .attr('x2', 25)
    .attr('y1', 0)
    .attr('y2', 0)
    .attr('stroke', '#f97316')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '6,3');
  
  legend.append('text')
    .attr('x', 30)
    .attr('y', 4)
    .style('font-size', '11px')
    .style('fill', isDark ? '#d1d5db' : '#4b5563')
    .text('План');
  
  // Факт
  legend.append('rect')
    .attr('x', 0)
    .attr('y', 12)
    .attr('width', 25)
    .attr('height', 12)
    .attr('fill', 'url(#blue-gradient)')
    .attr('rx', 2);
  
  legend.append('text')
    .attr('x', 30)
    .attr('y', 22)
    .style('font-size', '11px')
    .style('fill', isDark ? '#d1d5db' : '#4b5563')
    .text('Факт');
  
  // Метка для оси Y
  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0 - margin.left + 10)
    .attr('x', 0 - (height / 2))
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .style('fill', isDark ? '#9ca3af' : '#4b5563')
    .style('font-size', '12px')
    .text('Количество (шт)');
  
  // Индикаторы выполнения плана (только если план > 0)
  g.selectAll('.performance-indicator')
    .data(dailyData.filter(d => !d.isFuture && d.fact > 0 && d.plan > 0))
    .enter().append('text')
    .attr('class', 'performance-indicator')
    .attr('x', d => x(d.day) + x.bandwidth() / 2)
    .attr('y', d => y(d.fact) - 20)
    .attr('text-anchor', 'middle')
    .style('font-size', '9px')
    .style('font-weight', '600')
    .style('fill', d => d.fact >= d.plan ? '#22c55e' : '#ef4444')
    .style('opacity', 0)
    .transition()
    .duration(500)
    .delay((d, i) => i * 30 + 400)
    .style('opacity', 1)
    .text(d => {
      const percentage = Math.round((d.fact / d.plan) * 100);
      return percentage >= 100 ? '✓' : `${percentage}%`;
    });
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
  

const TableCell = ({ label1, label2, label3, value, color, large = false, colSpan = 1 }) => {
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
    return 'text-orange-600';
  };
  
  return (
    <td 
      colSpan={colSpan}
      className={`border-2 border-dotted ${isDark ? 'border-gray-600' : 'border-gray-400'} ${getBgColor()}`}
    >
      <div className="p-2 h-full flex flex-col justify-center items-center">
        {(label1 || label2 || label3) && (
          <div className={`text-xs font-semibold ${getLabelColor()} text-center leading-tight`}>
            {label1 && <div>{label1}</div>}
            {label2 && <div>{label2}</div>}
            {label3 && <div>{label3}</div>}
          </div>
        )}
        
        <div className="w-full my-2">
            <div className="border-t-2 border-dotted border-gray-400"></div>
          </div>
        
        <div className={`${large ? 'text-3xl' : 'text-2xl'} font-black ${getTextColor()} text-center`}>
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
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-800'} text-2xl font-semibold`}>
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
{/* Таблица месячных показателей */}
<table className="w-full border-collapse flex-grow">
  <tbody className="h-full">
    {/* Первая строка */}
    <tr className="h-1/3">
      <TableCell 
        label1="Ойлик РЕЖА" 
        value="33 000" 
        color="orange"
        large
      />
      <TableCell 
        label1="Ойлик РЕЖА"
        label2="(шу кунгача)"
        value="12 195" 
        color="orange"
        large
      />
      <TableCell 
        label1="Ойлик РЕЖА"
        label2="Шу кунгача"
        label3="(фойзда)"
        value="37%" 
        color="blue"
        large
      />
    </tr>
    
    {/* Вторая строка */}
    <tr className="h-1/3">
      <TableCell 
        label1="Ойлик ФАКТ" 
        value="12 285" 
        color="green"
      />
      <TableCell 
        label1="Ўртача"
        label2="иш. чиқариш"
        label3="(бир кунлик)"
        value="1 229" 
        color="orange"
      />
      <TableCell 
        label1="Ойлик ФАКТ"
        label2="Шу кунгача"
        label3="(фойзда)"
        value="37%" 
        color="blue"
      />
    </tr>
    
    {/* Третья строка */}
    <tr className="h-1/3">
      <TableCell 
        label1="Ойлик РЕЖАга"
        label2="нисбатан ФАРҚ"
        value="-20 715" 
        color="red"
      />
      <TableCell 
        label1="Ойлик РЕЖАга"
        label2="нисбатан ФАРҚ"
        label3="(Шу кунгача)"
        value="90" 
        color="orange"
      />
      <TableCell 
        label1="Фойзда ФАРҚ"
        label2="Шу кунгача"
        value="0%" 
        color=""
      />
    </tr>
  </tbody>
</table>
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
          {/* Таблица годовых показателей */}
<table className="w-full border-collapse flex-grow mb-4">
  <tbody className="h-full">
    {/* Первая строка */}
    <tr className="h-1/3">
      <TableCell 
        label1="Йиллик РЕЖА" 
        value="376 000" 
        color="green"
        large
      />
      <TableCell 
        label1="Йиллик РЕЖА"
        label2="(Шу кунгача - 630)"
        value="159 193" 
        color="green"
        large
      />
      <TableCell 
        label1="Йиллик РЕЖА"
        label2="Шу кунгача"
        label3="(фойзда)"
        value="42%" 
        color="blue"
        large
      />
    </tr>
    
    {/* Вторая строка */}
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
      <TableCell
        label1="Йиллик ФАКТ"
        label2="Шу кунгача"
        label3="(фойзда)"
        value="42%"
        color="blue"
      />
    </tr>
    
    {/* Третья строка */}
    <tr className="h-1/3">
      <TableCell 
        label1="Йиллик РЕЖАга"
        label2="нисбатан ФАРҚ"
        value="-216 717" 
        color="red"
      />
      <TableCell 
        label1="Йиллик РЕЖАга"
        label2="нисбатан ФАРҚ"
        label3="(Шу кунгача)"
        value="90" 
        color="orange"
      />
      <TableCell 
        label1="Фойзда ФАРҚ"
        label2="Шу кунгача"
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