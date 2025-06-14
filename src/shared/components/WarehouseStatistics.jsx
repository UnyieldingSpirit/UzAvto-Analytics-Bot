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
  

    
  const factories = [
  { key: 'all', label: 'Все заводы', icon: '🏭' },
  { key: 'asaka', label: 'Асака', icon: '🚗' },
  { key: 'khorezm', label: 'Хорезм', icon: '🚙' },
  { key: 'scd', label: 'SCD', icon: '🚐' }
];
    
  if (loading) {
    return <ContentReadyLoader />;
  }
const MetricCard = ({ title, value, subValue, percentage, trend, color = 'blue', icon }) => {
  const colorSchemes = {
    blue: {
      bg: isDark ? 'from-blue-900/20 to-blue-800/20' : 'from-blue-50 to-blue-100',
      border: isDark ? 'border-blue-800/30' : 'border-blue-200',
      text: isDark ? 'text-blue-400' : 'text-blue-600',
      icon: isDark ? 'bg-blue-900/30' : 'bg-blue-100'
    },
    green: {
      bg: isDark ? 'from-green-900/20 to-green-800/20' : 'from-green-50 to-green-100',
      border: isDark ? 'border-green-800/30' : 'border-green-200',
      text: isDark ? 'text-green-400' : 'text-green-600',
      icon: isDark ? 'bg-green-900/30' : 'bg-green-100'
    },
    yellow: {
      bg: isDark ? 'from-yellow-900/20 to-yellow-800/20' : 'from-yellow-50 to-yellow-100',
      border: isDark ? 'border-yellow-800/30' : 'border-yellow-200',
      text: isDark ? 'text-yellow-400' : 'text-yellow-600',
      icon: isDark ? 'bg-yellow-900/30' : 'bg-yellow-100'
    },
    purple: {
      bg: isDark ? 'from-purple-900/20 to-purple-800/20' : 'from-purple-50 to-purple-100',
      border: isDark ? 'border-purple-800/30' : 'border-purple-200',
      text: isDark ? 'text-purple-400' : 'text-purple-600',
      icon: isDark ? 'bg-purple-900/30' : 'bg-purple-100'
    },
    red: {
      bg: isDark ? 'from-red-900/20 to-red-800/20' : 'from-red-50 to-red-100',
      border: isDark ? 'border-red-800/30' : 'border-red-200',
      text: isDark ? 'text-red-400' : 'text-red-600',
      icon: isDark ? 'bg-red-900/30' : 'bg-red-100'
    }
  };
  
  const scheme = colorSchemes[color];
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`relative bg-gradient-to-br ${scheme.bg} backdrop-blur-sm rounded-xl p-4 border ${scheme.border} h-full flex flex-col`}
    >
      {/* Иконка в углу */}
      {icon && (
        <div className={`absolute top-3 right-3 w-8 h-8 ${scheme.icon} rounded-lg flex items-center justify-center ${scheme.text} text-sm`}>
          {icon}
        </div>
      )}
      
      {/* Заголовок */}
      <h4 className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
        {title}
      </h4>
      
      {/* Значение */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          {trend && (
            <span className={`text-sm font-bold ${
              trend === 'up' ? 'text-green-500' : 
              trend === 'down' ? 'text-red-500' : 
              'text-gray-500'
            }`}>
              {trend === 'up' ? '↑' : '↓'}
            </span>
          )}
        </div>
        {subValue && (
          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'} mt-1`}>
            {subValue}
          </span>
        )}
      </div>
      
      {/* Процент с прогресс-баром */}
      {percentage !== undefined && (
        <div className="mt-3">
          <div className="flex justify-between items-center mb-1">
            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Выполнено</span>
            <span className={`text-sm font-bold ${scheme.text}`}>{percentage}%</span>
          </div>
          <div className={`w-full h-1.5 ${isDark ? 'bg-gray-700/50' : 'bg-gray-300/50'} rounded-full overflow-hidden`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(percentage, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full ${scheme.text.replace('text-', 'bg-')} rounded-full`}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

return (
  <div className={`p-4 lg:p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen`}>
    {/* Заголовок */}
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'} p-4 lg:p-6 rounded-xl shadow-lg`}
    >
      <h1 className={`text-2xl lg:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
        {t('title')}
      </h1>
      <p className={`text-sm lg:text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
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
            className={`px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-medium transition-all text-sm lg:text-base ${
              selectedFactory === factory.key
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                : isDark 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="flex items-center gap-2">
              {factory.icon}
              <span className="hidden sm:inline">{factory.label}</span>
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>

    {/* МЕСЯЧНАЯ СТАТИСТИКА */}
    <div className="mb-6">
      {/* На мобильных - вертикально, на десктопе - горизонтально */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* График по дням */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className={`xl:col-span-8 ${isDark ? 'bg-gray-800' : 'bg-white'} p-4 lg:p-6 rounded-xl shadow-lg`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h2 className={`text-lg lg:text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('charts.daily')}
              </h2>
              <p className={`text-xs lg:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                {t('charts.dailySubtitle')}
              </p>
            </div>
          </div>
          <div ref={dailyChartRef} className="w-full h-[300px] lg:h-[400px]" />
        </motion.div>

        {/* Метрики за месяц */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className={`xl:col-span-4 ${isDark ? 'bg-gray-800' : 'bg-white'} p-4 lg:p-6 rounded-xl shadow-lg`}
        >
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4 flex items-center gap-2`}>
            <span className="text-xl">📊</span> 
            <span>Показатели месяца</span>
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-2 gap-3">
            <MetricCard
              title="План месяца"
              value={metrics.monthPlan}
              subValue="ед."
              color="blue"
              icon="📋"
            />
            
            <MetricCard
              title="План на сегодня"
              value={metrics.monthPlanToday}
              percentage={37}
              color="blue"
              icon="📅"
            />
            
            <MetricCard
              title="Выполнено"
              value={metrics.monthFact}
              percentage={37}
              trend="up"
              color="green"
              icon="✅"
            />
            
            <MetricCard
              title="Осталось"
              value={metrics.monthRemaining}
              percentage={63}
              color="yellow"
              icon="⏳"
            />
            
            <MetricCard
              title="Сверх плана"
              value={`+${metrics.monthDeviation}`}
              subValue={`+${metrics.monthDeviationPercent}%`}
              trend="up"
              color="green"
              icon="📈"
            />
            
            <MetricCard
              title="В среднем"
              value={metrics.monthAverage}
              subValue="ед./день"
              color="purple"
              icon="⚡"
            />
          </div>
        </motion.div>
      </div>
    </div>

    {/* ГОДОВАЯ СТАТИСТИКА */}
    <div>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* График по месяцам */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className={`xl:col-span-7 ${isDark ? 'bg-gray-800' : 'bg-white'} p-4 lg:p-6 rounded-xl shadow-lg`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h2 className={`text-lg lg:text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('charts.monthly')}
              </h2>
              <p className={`text-xs lg:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                {t('charts.monthlySubtitle')}
              </p>
            </div>
          </div>
          <div ref={monthlyChartRef} className="w-full h-[300px] lg:h-[400px]" />
        </motion.div>

        {/* Метрики за год */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className={`xl:col-span-5 ${isDark ? 'bg-gray-800' : 'bg-white'} p-4 lg:p-6 rounded-xl shadow-lg`}
        >
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4 flex items-center gap-2`}>
            <span className="text-xl">📈</span>
            <span>Годовые показатели</span>
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 gap-3">
            <MetricCard
              title="План года"
              value={metrics.yearPlan}
              subValue="ед."
              color="purple"
              icon="🎯"
            />
            
            <MetricCard
              title="План на сегодня"
              value={metrics.yearPlanToday}
              percentage={42}
              color="purple"
              icon="📆"
            />
            
            <MetricCard
              title="Выполнено"
              value={metrics.yearFact}
              percentage={42}
              trend="up"
              color="green"
              icon="✅"
            />
            
            <MetricCard
              title="Прошлый год"
              value={metrics.yearLastYear}
              subValue={`+${metrics.yearDifference.toLocaleString()}`}
              trend="up"
              color="blue"
              icon="📊"
            />
            
            <MetricCard
              title="Осталось"
              value={metrics.yearRemaining}
              percentage={58}
              color="yellow"
              icon="⏰"
            />
            
            <MetricCard
              title="Сверх плана"
              value={`+${metrics.yearDeviation}`}
              subValue={`+${metrics.yearDeviationPercent}%`}
              trend="up"
              color="green"
              icon="📈"
            />
            
            <MetricCard
              title="Проверено ОТК"
              value={metrics.yearChecked}
              subValue="ед."
              color="blue"
              icon="🔍"
            />
            
            <MetricCard
              title="Процент брака"
              value="0.8"
              subValue="%"
              trend="down"
              color="red"
              icon="⚠️"
            />
          </div>
        </motion.div>
      </div>
    </div>
  </div>
);
}