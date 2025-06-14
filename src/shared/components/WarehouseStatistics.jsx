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
    factories: {
      all: 'Все заводы',
      asaka: 'Асака',
      khorezm: 'Хорезм',
      scd: 'SCD'
    },
    charts: {
      daily: 'Производство по дням',
      monthly: 'Производство по месяцам',
      dailySubtitle: 'Ежедневная динамика выпуска автомобилей',
      monthlySubtitle: 'Помесячная статистика текущего года'
    },
    sections: {
      month: 'Текущий месяц',
      year: 'Годовые показатели'
    },
    metrics: {
      monthPlan: 'План на месяц',
      monthPlanToday: 'План на сегодня',
      monthFact: 'Выполнено',
      monthRemaining: 'Осталось выпустить',
      monthDeviation: 'Перевыполнение',
      monthAverage: 'В среднем в день',
      yearPlan: 'План на год',
      yearPlanToday: 'План на текущую дату',
      yearFact: 'Выполнено за год',
      yearLastYear: 'В прошлом году',
      yearRemaining: 'Осталось до конца года',
      yearDeviation: 'Отклонение от плана',
      yearChecked: 'Проверено ОТК'
    },
    descriptions: {
      monthPlan: 'автомобилей к выпуску',
      monthPlanToday: 'от месячного плана',
      monthFact: 'от месячного плана',
      monthRemaining: 'до выполнения плана',
      monthDeviation: 'сверх плана на сегодня',
      monthAverage: 'средний выпуск',
      yearPlan: 'автомобилей к выпуску',
      yearPlanToday: 'от годового плана',
      yearFact: 'от годового плана',
      yearLastYear: 'разница с прошлым годом',
      yearRemaining: 'от годового плана',
      yearDeviation: 'от плана на сегодня',
      yearChecked: 'прошло контроль'
    },
    units: 'ед.',
    percentage: 'выполнения',
    compared: 'к прошлому году',
    vehicles: 'автомобилей',
    loading: 'Загрузка данных...',
    noData: 'Нет данных для отображения',
    legend: {
      plan: 'План',
      fact: 'Факт',
      lastYear: 'Прошлый год'
    }
  },
  'uz': {
    title: 'Ishlab chiqarish statistikasi',
    subtitle: 'Ishlab chiqarish rejasini bajarish monitoringi',
    factories: {
      all: 'Barcha zavodlar',
      asaka: 'Asaka',
      khorezm: 'Xorazm',
      scd: 'SCD'
    },
    charts: {
      daily: 'Kunlik ishlab chiqarish',
      monthly: 'Oylik ishlab chiqarish',
      dailySubtitle: 'Avtomobillar chiqarishning kunlik dinamikasi',
      monthlySubtitle: 'Joriy yilning oylik statistikasi'
    },
    sections: {
      month: 'Joriy oy',
      year: 'Yillik ko\'rsatkichlar'
    },
    metrics: {
      monthPlan: 'Oylik reja',
      monthPlanToday: 'Bugunga reja',
      monthFact: 'Bajarildi',
      monthRemaining: 'Chiqarish kerak',
      monthDeviation: 'Ortiqcha bajarildi',
      monthAverage: 'O\'rtacha kunlik',
      yearPlan: 'Yillik reja',
      yearPlanToday: 'Joriy sanaga reja',
      yearFact: 'Yil bo\'yicha bajarildi',
      yearLastYear: 'O\'tgan yilda',
      yearRemaining: 'Yil oxirigacha qoldi',
      yearDeviation: 'Rejadan chetlanish',
      yearChecked: 'OTK tekshiruvi'
    },
    descriptions: {
      monthPlan: 'avtomobil chiqarish',
      monthPlanToday: 'oylik rejadan',
      monthFact: 'oylik rejadan',
      monthRemaining: 'reja bajarilishiga',
      monthDeviation: 'bugunga rejadan ortiq',
      monthAverage: 'o\'rtacha chiqarish',
      yearPlan: 'avtomobil chiqarish',
      yearPlanToday: 'yillik rejadan',
      yearFact: 'yillik rejadan',
      yearLastYear: 'o\'tgan yil bilan farq',
      yearRemaining: 'yillik rejadan',
      yearDeviation: 'bugunga rejadan',
      yearChecked: 'nazoratdan o\'tdi'
    },
    units: 'dona',
    percentage: 'bajarildi',
    compared: 'o\'tgan yilga nisbatan',
    vehicles: 'avtomobillar',
    loading: 'Ma\'lumotlar yuklanmoqda...',
    noData: 'Ko\'rsatish uchun ma\'lumot yo\'q',
    legend: {
      plan: 'Reja',
      fact: 'Fakt',
      lastYear: 'O\'tgan yil'
    }
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
  const [metrics, setMetrics] = useState({
    monthPlan: 33000,
    monthPlanToday: 12195,
    monthFact: 12285,
    monthRemaining: 20715,
    monthDeviation: 90,
    monthDeviationPercent: 0.7,
    monthAverage: 409,
    yearPlan: 376000,
    yearPlanToday: 159193,
    yearFact: 159283,
    yearLastYear: 157101,
    yearDifference: 2182,
    yearRemaining: 216717,
    yearDeviation: 90,
    yearDeviationPercent: 0.06,
    yearChecked: 161189
  });
  
  // Refs для графиков
  const dailyChartRef = useRef(null);
  const monthlyChartRef = useRef(null);
  
  // Генерация моковых данных
  useEffect(() => {
    generateMockData();
  }, [selectedFactory]);
  
  const generateMockData = () => {
    setLoading(true);
    
    // Генерация данных по дням для текущего месяца
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = currentDate.getDate();
    
    const daily = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const baseValue = selectedFactory === 'all' ? 1300 : 
                       selectedFactory === 'asaka' ? 700 :
                       selectedFactory === 'khorezm' ? 400 : 200;
      
      const plannedValue = baseValue + Math.floor(Math.random() * 100);
      const factValue = i <= today ? baseValue + Math.floor(Math.random() * 150 - 50) : 0;
      
      daily.push({
        day: i,
        date: new Date(currentYear, currentMonth, i),
        plan: plannedValue,
        fact: factValue,
        isToday: i === today,
        isFuture: i > today
      });
    }
    
    // Генерация данных по месяцам
    const monthly = [];
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    
    for (let i = 0; i < 12; i++) {
      const baseValue = selectedFactory === 'all' ? 32000 : 
                       selectedFactory === 'asaka' ? 17000 :
                       selectedFactory === 'khorezm' ? 10000 : 5000;
      
      const plannedValue = baseValue + Math.floor(Math.random() * 2000);
      const factValue = i < currentMonth ? baseValue + Math.floor(Math.random() * 3000 - 1000) : 
                       i === currentMonth ? Math.floor(baseValue * (today / daysInMonth)) : 0;
      
      monthly.push({
        month: months[i],
        monthIndex: i,
        plan: plannedValue,
        fact: factValue,
        lastYear: i <= currentMonth ? baseValue + Math.floor(Math.random() * 2000 - 1000) : 0,
        isCurrent: i === currentMonth,
        isFuture: i > currentMonth
      });
    }
    
    // Обновляем метрики на основе данных
    const totalMonthFact = daily.slice(0, today).reduce((sum, d) => sum + d.fact, 0);
    const avgDaily = Math.round(totalMonthFact / today);
    
    setMetrics(prev => ({
      ...prev,
      monthFact: totalMonthFact,
      monthAverage: avgDaily,
      monthDeviation: totalMonthFact - metrics.monthPlanToday,
      monthDeviationPercent: ((totalMonthFact - metrics.monthPlanToday) / metrics.monthPlanToday * 100).toFixed(1)
    }));
    
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
    
    const margin = { top: 40, right: 20, bottom: 80, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Градиенты
    const defs = svg.append('defs');
    
    // Градиент для факта
    const factGradient = defs.append('linearGradient')
      .attr('id', 'daily-fact-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    
    factGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#10b981')
      .attr('stop-opacity', 1);
    
    factGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#059669')
      .attr('stop-opacity', 1);
    
    // Шкалы
    const x = d3.scaleBand()
      .domain(dailyData.map(d => d.day))
      .range([0, width])
      .padding(0.1);
    
    const y = d3.scaleLinear()
      .domain([0, d3.max(dailyData, d => Math.max(d.plan, d.fact)) * 1.1])
      .range([height, 0]);
    
    // Группы для каждого дня
    const dayGroups = g.selectAll('.day-group')
      .data(dailyData)
      .enter().append('g')
      .attr('class', 'day-group')
      .attr('transform', d => `translate(${x(d.day)},0)`);
    
    // Фоновая подсветка для текущего дня
    dayGroups.filter(d => d.isToday)
      .append('rect')
      .attr('x', -x.bandwidth() * 0.1)
      .attr('width', x.bandwidth() * 1.2)
      .attr('y', -20)
      .attr('height', height + 60)
      .attr('fill', isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)')
      .attr('rx', 8);
    
    // Столбцы факта
    dayGroups.filter(d => !d.isFuture && d.fact > 0)
      .append('rect')
      .attr('class', 'fact-bar')
      .attr('x', 0)
      .attr('width', x.bandwidth())
      .attr('y', height)
      .attr('height', 0)
      .attr('fill', d => d.fact >= d.plan ? 'url(#daily-fact-gradient)' : '#3b82f6')
      .attr('rx', 4)
      .attr('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this).attr('opacity', 0.8);
        showTooltip(event, `Факт: ${d.fact.toLocaleString()} ед.`, `День ${d.day}`);
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 1);
        hideTooltip();
      })
      .transition()
      .duration(800)
      .delay((d, i) => i * 20)
      .attr('y', d => y(d.fact))
      .attr('height', d => height - y(d.fact));
    
    // Значения на столбцах для каждого дня
    dayGroups.filter(d => !d.isFuture && d.fact > 0)
      .append('text')
      .attr('x', x.bandwidth() / 2)
      .attr('y', d => y(d.fact) - 5)
      .attr('text-anchor', 'middle')
      .style('fill', isDark ? '#f3f4f6' : '#1f2937')
      .style('font-size', '10px')
      .style('font-weight', '600')
      .style('opacity', 0)
      .text(d => d.fact.toLocaleString())
      .transition()
      .duration(800)
      .delay((d, i) => i * 20)
      .style('opacity', 1);
    
    // Линия плана
    const planLine = d3.line()
      .x(d => x(d.day) + x.bandwidth() / 2)
      .y(d => y(d.plan))
      .curve(d3.curveMonotoneX);
    
    g.append('path')
      .datum(dailyData.filter(d => !d.isFuture))
      .attr('fill', 'none')
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,3')
      .attr('d', planLine)
      .style('opacity', 0)
      .transition()
      .duration(1000)
      .delay(500)
      .style('opacity', 0.8);
    
    // Оси
    const xAxis = g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));
    
    xAxis.selectAll('text')
      .style('fill', isDark ? '#9ca3af' : '#4b5563')
      .style('font-size', '11px')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');
    
    const yAxis = g.append('g')
      .call(d3.axisLeft(y).ticks(6).tickFormat(d => d.toLocaleString()));
    
    yAxis.selectAll('text')
      .style('fill', isDark ? '#9ca3af' : '#4b5563')
      .style('font-size', '12px');
    
    // Средняя линия
    const avgValue = dailyData.filter(d => !d.isFuture && d.fact > 0).reduce((sum, d) => sum + d.fact, 0) / dailyData.filter(d => !d.isFuture && d.fact > 0).length;
    
    g.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', y(avgValue))
      .attr('y2', y(avgValue))
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .style('opacity', 0)
      .transition()
      .duration(1000)
      .delay(500)
      .style('opacity', 0.7);
    
    g.append('text')
      .attr('x', width - 5)
      .attr('y', y(avgValue) - 5)
      .attr('text-anchor', 'end')
      .style('fill', '#f59e0b')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .style('opacity', 0)
      .text(`Среднее: ${Math.round(avgValue).toLocaleString()}`)
      .transition()
      .duration(1000)
      .delay(500)
      .style('opacity', 1);
  };
  
  const renderMonthlyChart = () => {
    if (!monthlyChartRef.current) return;
    
    const container = monthlyChartRef.current;
    container.innerHTML = '';
    
    const margin = { top: 40, right: 20, bottom: 60, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Шкалы
    const x = d3.scaleBand()
      .domain(monthlyData.map(d => d.month))
      .range([0, width])
      .padding(0.2);
    
    const y = d3.scaleLinear()
      .domain([0, d3.max(monthlyData, d => Math.max(d.plan, d.fact, d.lastYear)) * 1.1])
      .range([height, 0]);
    
    // Группы для каждого месяца
    const monthGroups = g.selectAll('.month-group')
      .data(monthlyData)
      .enter().append('g')
      .attr('class', 'month-group')
      .attr('transform', d => `translate(${x(d.month)},0)`);
    
    // Фоновая подсветка для текущего месяца
    monthGroups.filter(d => d.isCurrent)
      .append('rect')
      .attr('x', -x.bandwidth() * 0.2)
      .attr('width', x.bandwidth() * 1.4)
      .attr('y', -20)
      .attr('height', height + 60)
      .attr('fill', isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)')
      .attr('rx', 8);
    
    // Столбцы факта
    monthGroups.append('rect')
      .attr('class', 'fact-bar')
      .attr('x', 0)
      .attr('width', x.bandwidth())
      .attr('y', height)
      .attr('height', 0)
      .attr('fill', d => {
        if (d.fact === 0) return isDark ? '#374151' : '#e5e7eb';
        return d.fact >= d.plan ? '#10b981' : '#3b82f6';
      })
      .attr('rx', 6)
      .attr('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this).attr('opacity', 0.8);
        const percentage = ((d.fact / d.plan) * 100).toFixed(1);
        showTooltip(event, `Факт: ${d.fact.toLocaleString()} (${percentage}%)`, d.month);
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 1);
        hideTooltip();
      })
      .transition()
      .duration(800)
      .delay((d, i) => i * 50)
      .attr('y', d => d.fact > 0 ? y(d.fact) : height)
      .attr('height', d => d.fact > 0 ? height - y(d.fact) : 0);
    
    // Значения на столбцах для каждого месяца
    monthGroups.append('text')
      .attr('x', x.bandwidth() / 2)
      .attr('y', d => d.fact > 0 ? y(d.fact) - 8 : height - 5)
      .attr('text-anchor', 'middle')
      .style('fill', isDark ? '#f3f4f6' : '#1f2937')
      .style('font-size', '12px')
      .style('font-weight', '600')
      .style('opacity', 0)
      .text(d => d.fact > 0 ? d.fact.toLocaleString() : '-')
      .transition()
      .duration(800)
      .delay((d, i) => i * 50)
      .style('opacity', 1);
    
    // Линия плана
    const planLine = d3.line()
      .x(d => x(d.month) + x.bandwidth() / 2)
      .y(d => y(d.plan))
      .curve(d3.curveMonotoneX);
    
    g.append('path')
      .datum(monthlyData)
      .attr('fill', 'none')
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', '8,4')
      .attr('d', planLine)
      .style('opacity', 0)
      .transition()
      .duration(1000)
      .delay(500)
      .style('opacity', 0.8);
    
    // Оси
    const xAxis = g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));
    
    xAxis.selectAll('text')
      .style('fill', isDark ? '#9ca3af' : '#4b5563')
      .style('font-size', '12px');
    
    const yAxis = g.append('g')
      .call(d3.axisLeft(y).ticks(6).tickFormat(d => (d / 1000).toFixed(0) + 'K'));
    
    yAxis.selectAll('text')
      .style('fill', isDark ? '#9ca3af' : '#4b5563')
      .style('font-size', '12px');
  };
  
  // Функции для тултипов
  const showTooltip = (event, text, title) => {
    const tooltip = d3.select('body').append('div')
      .attr('class', 'chart-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background', isDark ? '#1f2937' : '#ffffff')
      .style('border', `1px solid ${isDark ? '#374151' : '#e5e7eb'}`)
      .style('border-radius', '8px')
      .style('padding', '12px')
      .style('box-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1)')
      .style('pointer-events', 'none')
      .style('z-index', '1000');
    
    if (title) {
      tooltip.append('div')
        .style('font-size', '11px')
        .style('color', isDark ? '#9ca3af' : '#6b7280')
        .style('margin-bottom', '4px')
        .text(title);
    }
    
    tooltip.append('div')
      .style('font-size', '14px')
      .style('font-weight', '600')
      .style('color', isDark ? '#f3f4f6' : '#1f2937')
      .text(text);
    
    tooltip.transition()
      .duration(200)
      .style('opacity', 1);
    
    tooltip
      .style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 28) + 'px');
  };
  
  const hideTooltip = () => {
    d3.selectAll('.chart-tooltip')
      .transition()
      .duration(200)
      .style('opacity', 0)
      .remove();
  };
  
// Улучшенный компонент MetricCard с полными описаниями
const MetricCard = ({ title, value, subValue, percentage, trend, color = 'blue', description, fullDescription, icon }) => {
  const colorSchemes = {
    blue: {
      gradient: 'from-blue-500 to-blue-600',
      bg: isDark ? 'bg-blue-900/10' : 'bg-blue-50',
      text: isDark ? 'text-blue-400' : 'text-blue-600',
      border: isDark ? 'border-blue-800/50' : 'border-blue-200'
    },
    green: {
      gradient: 'from-green-500 to-green-600',
      bg: isDark ? 'bg-green-900/10' : 'bg-green-50',
      text: isDark ? 'text-green-400' : 'text-green-600',
      border: isDark ? 'border-green-800/50' : 'border-green-200'
    },
    yellow: {
      gradient: 'from-yellow-500 to-yellow-600',
      bg: isDark ? 'bg-yellow-900/10' : 'bg-yellow-50',
      text: isDark ? 'text-yellow-400' : 'text-yellow-600',
      border: isDark ? 'border-yellow-800/50' : 'border-yellow-200'
    },
    purple: {
      gradient: 'from-purple-500 to-purple-600',
      bg: isDark ? 'bg-purple-900/10' : 'bg-purple-50',
      text: isDark ? 'text-purple-400' : 'text-purple-600',
      border: isDark ? 'border-purple-800/50' : 'border-purple-200'
    },
    red: {
      gradient: 'from-red-500 to-red-600',
      bg: isDark ? 'bg-red-900/10' : 'bg-red-50',
      text: isDark ? 'text-red-400' : 'text-red-600',
      border: isDark ? 'border-red-800/50' : 'border-red-200'
    },
    indigo: {
      gradient: 'from-indigo-500 to-indigo-600',
      bg: isDark ? 'bg-indigo-900/10' : 'bg-indigo-50',
      text: isDark ? 'text-indigo-400' : 'text-indigo-600',
      border: isDark ? 'border-indigo-800/50' : 'border-indigo-200'
    }
  };
  
  const colors = colorSchemes[color] || colorSchemes.blue;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`relative ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border ${isDark ? 'border-gray-700/50' : 'border-gray-200'}`}
    >
      {/* Градиентная линия сверху */}
      <div className={`h-1 bg-gradient-to-r ${colors.gradient}`} />
      
      <div className="p-5">
        {/* Заголовок с иконкой */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-12 h-12 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center text-xl flex-shrink-0 border ${colors.border}`}>
              {icon}
            </div>
            <div className="flex-1">
              <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'} mb-1`}>
                {title}
              </h3>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>
                {fullDescription}
              </p>
            </div>
          </div>
        </div>
        
        {/* Значение */}
        <div className="mb-3">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </span>
                {subValue && (
                  <span className={`text-sm font-medium ${colors.text}`}>
                    {subValue}
                  </span>
                )}
              </div>
              {description && (
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'} mt-1`}>
                  {description}
                </p>
              )}
            </div>
            {trend && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                trend === 'up' ? 'bg-green-500/10 text-green-500' : 
                trend === 'down' ? 'bg-red-500/10 text-red-500' : 
                'bg-gray-500/10 text-gray-500'
              }`}>
                <span className="text-sm font-bold">
                  {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
                </span>
                {percentage && trend && (
                  <span className="text-xs font-medium">
                    {trend === 'up' ? '+' : ''}{Math.abs(percentage - 100).toFixed(1)}%
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Прогресс бар */}
        {percentage !== undefined && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Прогресс выполнения
              </span>
              <span className={`text-xs font-bold ${colors.text}`}>
                {percentage}%
              </span>
            </div>
            <div className={`relative w-full h-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(percentage, 100)}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className={`absolute h-full bg-gradient-to-r ${colors.gradient} rounded-full`}
              />
            </div>
            {percentage > 100 && (
              <p className={`text-xs ${colors.text} mt-1 font-medium`}>
                Перевыполнено на {(percentage - 100).toFixed(1)}%
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
    
  const factories = [
  { key: 'all', label: 'Все заводы', icon: '🏭' },
  { key: 'asaka', label: 'Асака', icon: '🚗' },
  { key: 'khorezm', label: 'Хорезм', icon: '🚙' },
  { key: 'scd', label: 'SCD', icon: '🚐' }
];
    
  if (loading) {
    return <ContentReadyLoader />;
  }
  
  return (
    <div className={`p-4 md:p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen`}>
      {/* Заголовок */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-lg`}
      >
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
          {t('title')}
        </h1>
        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {t('subtitle')}
        </p>
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
      <motion.button
        key={factory.key}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
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
          <div>{factory.icon}</div>
          {factory.label}
        </span>
      </motion.button>
    ))}
  </div>
</motion.div>
      
      {/* Метрики за месяц */}
<motion.div 
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.2 }}
  className="mb-8"
>
  <div className={`flex items-center gap-4 mb-6 p-4 ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} rounded-xl`}>
    <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-white'} shadow-md`}>
      <span className="text-3xl">📊</span>
    </div>
    <div>
      <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Показатели текущего месяца
      </h2>
      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
        Детальная статистика производства за {new Date().toLocaleString('ru', { month: 'long' })} {new Date().getFullYear()} года
      </p>
    </div>
  </div>
  
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
    <MetricCard
      title="План на месяц"
      value={metrics.monthPlan}
      subValue="автомобилей"
      description="запланировано к производству"
      fullDescription="Общее количество автомобилей, которое должно быть произведено в текущем месяце согласно производственному плану"
      color="blue"
      icon="📋"
    />
    <MetricCard
      title="План на текущую дату"
      value={metrics.monthPlanToday}
      subValue="автомобилей"
      percentage={37}
      description="должно быть выполнено на сегодня"
      fullDescription="Количество автомобилей, которое должно быть произведено с начала месяца до текущей даты для соблюдения графика"
      color="indigo"
      icon="📅"
    />
    <MetricCard
      title="Фактически произведено"
      value={metrics.monthFact}
      subValue="автомобилей"
      percentage={37}
      trend="up"
      description="выпущено с начала месяца"
      fullDescription="Реальное количество автомобилей, произведенных с первого числа текущего месяца по сегодняшний день"
      color="green"
      icon="✅"
    />
    <MetricCard
      title="Осталось произвести"
      value={metrics.monthRemaining}
      subValue="автомобилей"
      percentage={63}
      description="до выполнения месячного плана"
      fullDescription="Количество автомобилей, которое необходимо произвести до конца месяца для полного выполнения производственного плана"
      color="yellow"
      icon="⏳"
    />
    <MetricCard
      title="Отклонение от плана"
      value={`+${metrics.monthDeviation}`}
      subValue={`автомобилей (+${metrics.monthDeviationPercent}%)`}
      trend="up"
      description="перевыполнение на текущую дату"
      fullDescription="Разница между фактическим производством и планом на текущую дату. Положительное значение означает опережение графика"
      color="green"
      icon="📈"
    />
    <MetricCard
      title="Средний дневной выпуск"
      value={metrics.monthAverage}
      subValue="авто/день"
      description="среднее производство за рабочий день"
      fullDescription="Среднее количество автомобилей, производимых за один рабочий день в текущем месяце на основе фактических данных"
      color="purple"
      icon="⚡"
    />
  </div>
</motion.div>


      
      {/* График по дням */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-lg mb-6`}
      >
        <div className="mb-4">
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('charts.daily')}
          </h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
            {t('charts.dailySubtitle')}
          </p>
        </div>
        <div ref={dailyChartRef} className="w-full" style={{ height: '400px' }} />
      </motion.div>
      
      {/* Метрики за год */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.4 }}
  className="mb-8"
>
  <div className={`flex items-center gap-4 mb-6 p-4 ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} rounded-xl`}>
    <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-white'} shadow-md`}>
      <span className="text-3xl">📈</span>
    </div>
    <div>
      <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Годовые показатели
      </h2>
      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
        Комплексная статистика производства за {new Date().getFullYear()} год с начала января по текущую дату
      </p>
    </div>
  </div>
  
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
    <MetricCard
      title="Годовой план производства"
      value={metrics.yearPlan}
      subValue="автомобилей"
      description="запланировано на весь год"
      fullDescription="Общее количество автомобилей, запланированное к производству в текущем году согласно утвержденному годовому плану"
      color="purple"
      icon="🎯"
    />
    <MetricCard
      title="План на текущую дату года"
      value={metrics.yearPlanToday}
      subValue="автомобилей"
      percentage={42}
      description="должно быть произведено к сегодня"
      fullDescription="Количество автомобилей, которое должно быть произведено с начала года до текущей даты для соблюдения годового графика"
      color="indigo"
      icon="📆"
    />
    <MetricCard
      title="Фактически произведено за год"
      value={metrics.yearFact}
      subValue="автомобилей"
      percentage={42}
      trend="up"
      description="выпущено с начала года"
      fullDescription="Общее количество автомобилей, фактически произведенных с 1 января текущего года по сегодняшний день"
      color="green"
      icon="✅"
    />
    <MetricCard
      title="Сравнение с прошлым годом"
      value={metrics.yearLastYear}
      subValue={`авто (+${metrics.yearDifference.toLocaleString()})`}
      trend="up"
      description="за аналогичный период прошлого года"
      fullDescription="Количество автомобилей, произведенных за аналогичный период прошлого года. Показывает динамику роста производства"
      color="blue"
      icon="📊"
    />
    <MetricCard
      title="До конца года осталось"
      value={metrics.yearRemaining}
      subValue="автомобилей"
      percentage={58}
      description="необходимо произвести"
      fullDescription="Количество автомобилей, которое необходимо произвести с текущей даты до 31 декабря для выполнения годового плана"
      color="yellow"
      icon="⏰"
    />
    <MetricCard
      title="Годовое отклонение"
      value={`+${metrics.yearDeviation}`}
      subValue={`авто (+${metrics.yearDeviationPercent}%)`}
      trend="up"
      description="опережение годового плана"
      fullDescription="Разница между фактическим производством и планом на текущую дату года. Показывает эффективность выполнения годового плана"
      color="green"
      icon="📈"
    />
    <MetricCard
      title="Прошло контроль качества"
      value={metrics.yearChecked}
      subValue="автомобилей"
      description="успешно прошли ОТК"
      fullDescription="Количество автомобилей, которые прошли все этапы контроля качества ОТК и готовы к реализации с начала года"
      color="blue"
      icon="🔍"
    />
    <MetricCard
      title="Процент брака"
      value="0.8"
      subValue="%"
      trend="down"
      description="от общего производства"
      fullDescription="Процент автомобилей, не прошедших контроль качества. Низкий показатель свидетельствует о высоком качестве производства"
      color="red"
      icon="⚠️"
    />
  </div>
</motion.div>
      
      {/* График по месяцам */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-lg`}
      >
        <div className="mb-4">
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('charts.monthly')}
          </h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
            {t('charts.monthlySubtitle')}
          </p>
        </div>
        <div ref={monthlyChartRef} className="w-full" style={{ height: '400px' }} />
      </motion.div>
    </div>
  );
}