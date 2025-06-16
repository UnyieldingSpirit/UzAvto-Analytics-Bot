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
    noData: 'Нет данных для отображения',
    // Новые переводы для табов
    currentProduction: 'Текущее производство',
    readyProducts: 'Тайёр махсулот',
    trends: 'Тренды',
    analytics: 'Аналитика'
  },
  'uz': {
    title: 'Ishlab chiqarish statistikasi',
    subtitle: 'Ishlab chiqarish rejasini bajarish monitoringi',
    loading: 'Ma\'lumotlar yuklanmoqda...',
    noData: 'Ko\'rsatish uchun ma\'lumot yo\'q',
    // Новые переводы для табов
    currentProduction: 'Joriy ishlab chiqarish',
    readyProducts: 'Tayyor mahsulot',
    trends: 'Trendlar',
    analytics: 'Tahlil'
  }
};

export default function ProductionStatistics() {
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';
  const { currentLocale } = useLanguageStore();
  const { t } = useTranslation(productionTranslations);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('current'); // Новое состояние для табов
  const [selectedFactory, setSelectedFactory] = useState('all');
  const [dailyData, setDailyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const trendsChartRef = useRef(null);
  // Refs для графиков
  const dailyChartRef = useRef(null);
  const monthlyChartRef = useRef(null);
  const eventChartRef = useRef(null);
  const realizationChartRef = useRef(null);
  
  // Список заводов
  const factories = [
    { key: 'all', label: 'Все производство', icon: '🏭' },
    { key: 'asaka', label: 'Асака', icon: '🚗' },
    { key: 'khorezm', label: 'Хорезм', icon: '🚙' },
    { key: 'scd', label: 'SCD', icon: '🚐' }
  ];
  
  // Конфигурация табов
  const tabs = [
    { id: 'current', label: t.currentProduction, icon: '📊' },
    { id: 'ready', label: t.readyProducts, icon: '📦' },
    { id: 'trends', label: t.trends, icon: '📈' },
    { id: 'analytics', label: t.analytics, icon: '📉' }
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
  
useEffect(() => {
  // Функция для рендера графиков с проверкой существования элементов
  const renderGraphs = () => {
    if (activeTab === 'current') {
      // Проверяем, что контейнеры существуют
      requestAnimationFrame(() => {
        if (dailyChartRef.current && monthlyChartRef.current) {
          renderDailyChart();
          renderMonthlyChart();
        }
      });
    } else if (activeTab === 'ready') {
      // Проверяем, что контейнеры существуют
      requestAnimationFrame(() => {
        if (eventChartRef.current && realizationChartRef.current) {
          renderEventChart();
          renderRealizationChart();
        }
      });
    }
  };

  // Если данные загружены, рендерим графики
  if (!loading && dailyData.length > 0) {
    // Небольшая задержка для DOM
    const timer = setTimeout(renderGraphs, 200);
    return () => clearTimeout(timer);
  }
}, [loading, dailyData, monthlyData, isDark, activeTab]);
  
  // Функция для отрисовки графика событий (Тайёр махсулот)
const renderEventChart = () => {
  if (!eventChartRef.current) return;
  
  const container = eventChartRef.current;
  d3.select(container).selectAll("*").remove();
  
  // Данные для всех дней января
  const eventData = [
    { date: '1-янв', value: 514 },
    { date: '2-янв', value: 1144 },
    { date: '3-янв', value: 1337 },
    { date: '4-янв', value: 1317 },
    { date: '5-янв', value: 0 },
    { date: '6-янв', value: 699 },
    { date: '7-янв', value: 0 },
    { date: '8-янв', value: 815 },
    { date: '9-янв', value: 1270 },
    { date: '10-янв', value: 1234 },
    { date: '11-янв', value: 1340 },
    { date: '12-янв', value: 1315 },
    { date: '13-янв', value: 1381 },
    { date: '14-янв', value: 0 },
    { date: '15-янв', value: 0 },
    { date: '16-янв', value: 0 },
    { date: '17-янв', value: 0 },
    { date: '18-янв', value: 0 },
    { date: '19-янв', value: 0 },
    { date: '20-янв', value: 0 },
    { date: '21-янв', value: 0 },
    { date: '22-янв', value: 0 },
    { date: '23-янв', value: 0 },
    { date: '24-янв', value: 0 },
    { date: '25-янв', value: 0 },
    { date: '26-янв', value: 0 },
    { date: '27-янв', value: 0 },
    { date: '28-янв', value: 0 },
    { date: '29-янв', value: 0 },
    { date: '30-янв', value: 0 },
    { date: '31-янв', value: 0 },
  ];
  
  const margin = { top: 50, right: 20, bottom: 80, left: 50 };
  const width = container.clientWidth - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;
  
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .style('background', '#fafafa');
  
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  
  // Добавляем белый фон для области графика
  g.append('rect')
    .attr('width', width)
    .attr('height', height)
    .attr('fill', 'white');
  
  // Шкалы
  const x = d3.scaleBand()
    .domain(eventData.map(d => d.date))
    .range([0, width])
    .padding(0.1);
  
  const y = d3.scaleLinear()
    .domain([0, 2500])
    .range([height, 0]);
  
  // Сетка в стиле Excel
  // Вертикальные линии (для каждого дня)
  g.selectAll('.grid-line-x')
    .data(eventData)
    .enter().append('line')
    .attr('class', 'grid-line-x')
    .attr('x1', d => x(d.date))
    .attr('x2', d => x(d.date))
    .attr('y1', 0)
    .attr('y2', height)
    .attr('stroke', '#e0e0e0')
    .attr('stroke-width', 1);
  
  // Дополнительная линия справа
  g.append('line')
    .attr('x1', width)
    .attr('x2', width)
    .attr('y1', 0)
    .attr('y2', height)
    .attr('stroke', '#e0e0e0')
    .attr('stroke-width', 1);
  
  // Горизонтальные линии сетки
  const yTicks = [0, 500, 1000, 1500, 2000, 2500];
  g.selectAll('.grid-line-y')
    .data(yTicks)
    .enter().append('line')
    .attr('class', 'grid-line-y')
    .attr('x1', 0)
    .attr('x2', width)
    .attr('y1', d => y(d))
    .attr('y2', d => y(d))
    .attr('stroke', '#e0e0e0')
    .attr('stroke-width', 1);
  
  // Столбцы
  g.selectAll('.bar')
    .data(eventData)
    .enter().append('rect')
    .attr('class', 'bar')
    .attr('x', d => x(d.date) + x.bandwidth() * 0.1)
    .attr('width', x.bandwidth() * 0.8)
    .attr('y', d => d.value > 0 ? y(d.value) : height)
    .attr('height', d => d.value > 0 ? height - y(d.value) : 0)
    .attr('fill', '#5b9bd5')
    .attr('stroke', '#4472c4')
    .attr('stroke-width', 0.5);
  
  // Вертикальные значения на столбцах
  g.selectAll('.bar-text')
    .data(eventData.filter(d => d.value > 0))
    .enter().append('text')
    .attr('class', 'bar-text')
    .attr('x', d => x(d.date) + x.bandwidth() / 2)
    .attr('y', d => y(d.value) - 8)
    .attr('text-anchor', 'middle')
    .attr('transform', d => `rotate(-90, ${x(d.date) + x.bandwidth() / 2}, ${y(d.value) - 8})`)
    .style('fill', '#333')
    .style('font-size', '10px')
    .style('font-weight', '400')
    .style('font-family', 'Arial, sans-serif')
    .text(d => d.value);
  
  // Ось X - показываем ВСЕ даты под каждым столбцом
  const xAxis = g.append('g')
    .attr('transform', `translate(0,${height})`);
  
  // Линия оси X
  xAxis.append('line')
    .attr('x1', 0)
    .attr('x2', width)
    .attr('y1', 0)
    .attr('y2', 0)
    .attr('stroke', '#e0e0e0')
    .attr('stroke-width', 1);
  
  // Метки для ВСЕХ дней
  xAxis.selectAll('.x-label')
    .data(eventData)
    .enter().append('text')
    .attr('class', 'x-label')
    .attr('x', d => x(d.date) + x.bandwidth() / 2)
    .attr('y', 20)
    .attr('text-anchor', 'end')
    .attr('transform', d => `rotate(-45, ${x(d.date) + x.bandwidth() / 2}, 20)`)
    .style('font-size', '8px')
    .style('font-family', 'Arial, sans-serif')
    .style('fill', '#666')
    .text(d => d.date);
  
  // Ось Y
  g.append('g')
    .call(d3.axisLeft(y)
      .tickValues(yTicks)
      .tickSize(0)
      .tickPadding(8))
    .style('font-size', '11px')
    .style('font-family', 'Arial, sans-serif');
  
  // Удаляем линии осей
  g.selectAll('.domain').remove();
};

const renderRealizationChart = () => {
  if (!realizationChartRef.current) return;
  
  const container = realizationChartRef.current;
  d3.select(container).selectAll("*").remove();
  
  // Данные для всех дней января
  const realizationData = [
    { date: '1-янв', value: 5 },
    { date: '2-янв', value: 1584 },
    { date: '3-янв', value: 1329 },
    { date: '4-янв', value: 1051 },
    { date: '5-янв', value: 1274 },
    { date: '6-янв', value: 0 },
    { date: '7-янв', value: 5 },
    { date: '8-янв', value: 161 },
    { date: '9-янв', value: 21 },
    { date: '10-янв', value: 1678 },
    { date: '11-янв', value: 1223 },
    { date: '12-янв', value: 1187 },
    { date: '13-янв', value: 1374 },
    { date: '14-янв', value: 0 },
    { date: '15-янв', value: 0 },
    { date: '16-янв', value: 0 },
    { date: '17-янв', value: 0 },
    { date: '18-янв', value: 0 },
    { date: '19-янв', value: 0 },
    { date: '20-янв', value: 0 },
    { date: '21-янв', value: 0 },
    { date: '22-янв', value: 0 },
    { date: '23-янв', value: 0 },
    { date: '24-янв', value: 0 },
    { date: '25-янв', value: 0 },
    { date: '26-янв', value: 0 },
    { date: '27-янв', value: 0 },
    { date: '28-янв', value: 0 },
    { date: '29-янв', value: 0 },
    { date: '30-янв', value: 0 },
    { date: '31-янв', value: 0 },
  ];
  
  const margin = { top: 50, right: 20, bottom: 80, left: 50 };
  const width = container.clientWidth - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;
  
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .style('background', '#fafafa');
  
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  
  // Белый фон для области графика
  g.append('rect')
    .attr('width', width)
    .attr('height', height)
    .attr('fill', 'white');
  
  // Шкалы
  const x = d3.scaleBand()
    .domain(realizationData.map(d => d.date))
    .range([0, width])
    .padding(0.1);
  
  const y = d3.scaleLinear()
    .domain([0, 2000])
    .range([height, 0]);
  
  // Вертикальные линии сетки
  g.selectAll('.grid-line-x')
    .data(realizationData)
    .enter().append('line')
    .attr('class', 'grid-line-x')
    .attr('x1', d => x(d.date))
    .attr('x2', d => x(d.date))
    .attr('y1', 0)
    .attr('y2', height)
    .attr('stroke', '#e0e0e0')
    .attr('stroke-width', 1);
  
  // Дополнительная линия справа
  g.append('line')
    .attr('x1', width)
    .attr('x2', width)
    .attr('y1', 0)
    .attr('y2', height)
    .attr('stroke', '#e0e0e0')
    .attr('stroke-width', 1);
  
  // Горизонтальные линии сетки
  const yTicks = [0, 400, 800, 1200, 1600, 2000];
  g.selectAll('.grid-line-y')
    .data(yTicks)
    .enter().append('line')
    .attr('class', 'grid-line-y')
    .attr('x1', 0)
    .attr('x2', width)
    .attr('y1', d => y(d))
    .attr('y2', d => y(d))
    .attr('stroke', '#e0e0e0')
    .attr('stroke-width', 1);
  
  // Столбцы
  g.selectAll('.bar')
    .data(realizationData)
    .enter().append('rect')
    .attr('class', 'bar')
    .attr('x', d => x(d.date) + x.bandwidth() * 0.1)
    .attr('width', x.bandwidth() * 0.8)
    .attr('y', d => d.value > 0 ? y(d.value) : height)
    .attr('height', d => d.value > 0 ? height - y(d.value) : 0)
    .attr('fill', '#70ad47')
    .attr('stroke', '#548235')
    .attr('stroke-width', 0.5);
  
  // Вертикальные значения на столбцах
  g.selectAll('.bar-text')
    .data(realizationData.filter(d => d.value > 0))
    .enter().append('text')
    .attr('class', 'bar-text')
    .attr('x', d => x(d.date) + x.bandwidth() / 2)
    .attr('y', d => y(d.value) - 8)
    .attr('text-anchor', 'middle')
    .attr('transform', d => `rotate(-90, ${x(d.date) + x.bandwidth() / 2}, ${y(d.value) - 8})`)
    .style('fill', '#333')
    .style('font-size', '10px')
    .style('font-weight', '400')
    .style('font-family', 'Arial, sans-serif')
    .text(d => {
      if (d.value > 999) {
        return d.value.toLocaleString('ru-RU').replace(',', ' ');
      }
      return d.value;
    });
  
  // Ось X - показываем ВСЕ даты
  const xAxis = g.append('g')
    .attr('transform', `translate(0,${height})`);
  
  // Линия оси X
  xAxis.append('line')
    .attr('x1', 0)
    .attr('x2', width)
    .attr('y1', 0)
    .attr('y2', 0)
    .attr('stroke', '#e0e0e0')
    .attr('stroke-width', 1);
  
  // Метки для ВСЕХ дней
  xAxis.selectAll('.x-label')
    .data(realizationData)
    .enter().append('text')
    .attr('class', 'x-label')
    .attr('x', d => x(d.date) + x.bandwidth() / 2)
    .attr('y', 20)
    .attr('text-anchor', 'end')
    .attr('transform', d => `rotate(-45, ${x(d.date) + x.bandwidth() / 2}, 20)`)
    .style('font-size', '8px')
    .style('font-family', 'Arial, sans-serif')
    .style('fill', '#666')
    .text(d => d.date);
  
  // Ось Y
  g.append('g')
    .call(d3.axisLeft(y)
      .tickValues(yTicks)
      .tickSize(0)
      .tickPadding(8))
    .style('font-size', '11px')
    .style('font-family', 'Arial, sans-serif');
  
  // Удаляем линии осей
  g.selectAll('.domain').remove();
};
  
const renderDailyChart = () => {
  if (!dailyChartRef.current) return;
  
  const container = dailyChartRef.current;
  d3.select(container).selectAll("*").remove();
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
    
    // Значения на столбцах (вертикально) с большим отступом
    g.selectAll('.bar-text')
      .data(dailyData.filter(d => !d.isFuture && d.fact > 0))
      .enter().append('text')
      .attr('class', 'bar-text')
      .attr('x', d => x(d.day) + x.bandwidth() / 2)
      .attr('y', d => y(d.fact) - 20)
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
    
    // Индикаторы выполнения плана
    g.selectAll('.performance-indicator')
      .data(dailyData.filter(d => !d.isFuture && d.fact > 0 && d.plan > 0))
      .enter().append('text')
      .attr('class', 'performance-indicator')
      .attr('x', d => x(d.day) + x.bandwidth() / 2)
      .attr('y', d => y(d.fact) - 45)
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
  };
  
const renderMonthlyChart = () => {
  if (!monthlyChartRef.current) return;
  
  const container = monthlyChartRef.current;
  // Очищаем контейнер перед отрисовкой
  d3.select(container).selectAll("*").remove();
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
  
  // Рендер контента текущего производства
  const renderCurrentProductionContent = () => (
    <>
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
          style={{ minHeight: '464px' }}
        >
          <div className="h-full flex flex-col">
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
    </>
  );
  
  // Рендер контента готовой продукции
  const renderReadyProductsContent = () => (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-lg`}>
        <div className="flex items-center justify-between">
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Сотув ва Тайёр махсулот бўйича маълумот
          </h2>
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            13 июнь 2025
          </span>
        </div>
      </div>
      
      {/* Графики */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* График Тайёр махсулот */}
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-lg`}
  >
    <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
      Тайёр махсулот PDL_#700 event
    </h3>
    <div ref={eventChartRef} className="w-full" style={{ height: '350px' }} />
    {/* Итоговые таблицы под графиками - все 12 месяцев */}
    <div className="mt-4">
      {/* Верхний ряд - первые 6 месяцев */}
      <div className="grid grid-cols-6 gap-0">
        <div className={`border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'} p-2`}>
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Yan</div>
          <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>11 767</div>
        </div>
        <div className={`border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'} p-2`}>
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Fev</div>
          <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>36 850</div>
        </div>
        <div className={`border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'} p-2`}>
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Mar</div>
          <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>35 492</div>
        </div>
        <div className={`border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'} p-2`}>
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Apr</div>
          <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>32 502</div>
        </div>
        <div className={`border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'} p-2`}>
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>May</div>
          <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>32 125</div>
        </div>
        <div className={`border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'} p-2`}>
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Jun</div>
          <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>12 453</div>
        </div>
      </div>
      {/* Нижний ряд - вторые 6 месяцев */}
      <div className="grid grid-cols-6 gap-0">
        <div className={`border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'} p-2`}>
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Iyul</div>
          <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>0</div>
        </div>
        <div className={`border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'} p-2`}>
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Avg</div>
          <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>0</div>
        </div>
        <div className={`border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'} p-2`}>
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Sen</div>
          <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>0</div>
        </div>
        <div className={`border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'} p-2`}>
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Okt</div>
          <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>0</div>
        </div>
        <div className={`border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'} p-2`}>
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Nov</div>
          <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>0</div>
        </div>
        <div className={`border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'} p-2`}>
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Dek</div>
          <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>0</div>
        </div>
      </div>
      {/* TOTAL */}
      <div className={`border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'} p-3 mt-0`}>
        <div className="flex justify-between items-center">
          <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>TOTAL</span>
          <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>161 189</span>
        </div>
      </div>
    </div>
  </motion.div>
  
  {/* График Реализация */}
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-lg`}
  >
    <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
      Реализация
    </h3>
    <div ref={realizationChartRef} className="w-full" style={{ height: '350px' }} />
    {/* Итоговые таблицы под графиками - все 12 месяцев */}
    <div className="mt-4">
      {/* Верхний ряд - первые 6 месяцев */}
      <div className="grid grid-cols-6 gap-0">
        <div className={`border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'} p-2`}>
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>JAN</div>
          <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>17 168</div>
        </div>
        <div className={`border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'} p-2`}>
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>FEB</div>
          <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>24 341</div>
        </div>
        <div className={`border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'} p-2`}>
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>MAR</div>
          <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>20 751</div>
        </div>
        <div className={`border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'} p-2`}>
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>APR</div>
          <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>25 956</div>
        </div>
        <div className={`border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'} p-2`}>
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>MAY</div>
          <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>23 614</div>
        </div>
        <div className={`border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'} p-2`}>
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>JUN</div>
          <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>10 873</div>
        </div>
      </div>
      {/* Нижний ряд - вторые 6 месяцев */}
      <div className="grid grid-cols-6 gap-0">
        <div className={`border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'} p-2`}>
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>JUL</div>
          <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>0</div>
        </div>
        <div className={`border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'} p-2`}>
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>AUG</div>
          <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>0</div>
        </div>
        <div className={`border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'} p-2`}>
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>SEP</div>
          <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>0</div>
        </div>
        <div className={`border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'} p-2`}>
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>OCT</div>
          <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>0</div>
        </div>
        <div className={`border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'} p-2`}>
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>NOV</div>
          <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>0</div>
        </div>
        <div className={`border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'} p-2`}>
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>DEC</div>
          <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>0</div>
        </div>
      </div>
      {/* TOTAL */}
      <div className={`border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'} p-3 mt-0`}>
        <div className="flex justify-between items-center">
          <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>TOTAL</span>
          <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>122 703</span>
        </div>
      </div>
    </div>
  </motion.div>
</div>
      
      {/* Таблица Қарздорлик бўйича маълумот */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-lg`}
      >
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Қарздорлик бўйича маълумот
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <th className={`text-left p-3 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Модель</th>
                <th className={`text-center p-3 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>2024</th>
                <th className={`text-center p-3 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Янв-Мар</th>
                <th className={`text-center p-3 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Апр</th>
                <th className={`text-center p-3 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Май</th>
                <th className={`text-center p-3 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Июн</th>
                <th className={`text-center p-3 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Июл</th>
                <th className={`text-center p-3 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Авг</th>
                <th className={`text-center p-3 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Сен</th>
                <th className={`text-center p-3 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Окт</th>
                <th className={`text-center p-3 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Ноя</th>
                <th className={`text-center p-3 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Дек</th>
                <th className={`text-center p-3 font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>ЖАМИ</th>
              </tr>
            </thead>
            <tbody>
              <tr className={`border-b ${isDark ? 'border-gray-700 bg-yellow-900/10' : 'border-gray-200 bg-yellow-50'}`}>
                <td className={`p-3 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>TRACKER</td>
                <td className="text-center p-3">-</td>
                <td className="text-center p-3">-</td>
                <td className="text-center p-3">-</td>
                <td className="text-center p-3">-</td>
                <td className="text-center p-3 text-red-600 font-bold">43</td>
                <td className="text-center p-3">-</td>
                <td className="text-center p-3">-</td>
                <td className="text-center p-3">-</td>
                <td className="text-center p-3">-</td>
                <td className="text-center p-3">-</td>
                <td className="text-center p-3">-</td>
                <td className="text-center p-3 font-bold">43</td>
              </tr>
              <tr className={`border-b ${isDark ? 'border-gray-700 bg-yellow-900/10' : 'border-gray-200 bg-yellow-50'}`}>
                <td className={`p-3 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>ONIX</td>
                <td className="text-center p-3">-</td>
                <td className="text-center p-3">-</td>
                <td className="text-center p-3">-</td>
                <td className="text-center p-3 text-red-600 font-bold">1</td>
                <td className="text-center p-3 text-red-600 font-bold">15</td>
                <td className="text-center p-3">-</td>
                <td className="text-center p-3">-</td>
                <td className="text-center p-3">-</td>
                <td className="text-center p-3">-</td>
                <td className="text-center p-3">-</td>
                <td className="text-center p-3">-</td>
                <td className="text-center p-3 font-bold">16</td>
              </tr>
              <tr className={`border-b ${isDark ? 'border-gray-700 bg-yellow-900/10' : 'border-gray-200 bg-yellow-50'}`}>
                <td className={`p-3 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>LACETTI </td>
    <td className="text-center p-3">-</td>
               <td className="text-center p-3">-</td>
               <td className="text-center p-3">-</td>
               <td className="text-center p-3">-</td>
               <td className="text-center p-3">-</td>
               <td className="text-center p-3">-</td>
               <td className="text-center p-3">-</td>
               <td className="text-center p-3">-</td>
               <td className="text-center p-3">-</td>
               <td className="text-center p-3">-</td>
               <td className="text-center p-3">-</td>
               <td className="text-center p-3 font-bold">-</td>
             </tr>
             <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
               <td className={`p-3 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>COBALT</td>
               <td className="text-center p-3 text-red-600 font-bold">74</td>
               <td className="text-center p-3 text-red-600 font-bold">83</td>
               <td className="text-center p-3 text-red-600 font-bold">88</td>
               <td className="text-center p-3 text-red-600 font-bold">175</td>
               <td className="text-center p-3 text-red-600 font-bold">1 952</td>
               <td className="text-center p-3 text-red-600 font-bold">1 256</td>
               <td className="text-center p-3 text-red-600 font-bold">2 973</td>
               <td className="text-center p-3 text-red-600 font-bold">2 670</td>
               <td className="text-center p-3 text-red-600 font-bold">6 001</td>
               <td className="text-center p-3">-</td>
               <td className="text-center p-3">-</td>
               <td className="text-center p-3 font-bold">15 272</td>
             </tr>
             <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} font-bold`}>
               <td className={`p-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>TOTAL</td>
               <td className="text-center p-3 text-red-600">74</td>
               <td className="text-center p-3 text-red-600">83</td>
               <td className="text-center p-3 text-red-600">88</td>
               <td className="text-center p-3 text-red-600">176</td>
               <td className="text-center p-3 text-red-600">2 010</td>
               <td className="text-center p-3 text-red-600">1 256</td>
               <td className="text-center p-3 text-red-600">2 973</td>
               <td className="text-center p-3 text-red-600">2 670</td>
               <td className="text-center p-3 text-red-600">6 001</td>
               <td className="text-center p-3">-</td>
               <td className="text-center p-3">-</td>
               <td className="text-center p-3">15 331</td>
             </tr>
             <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
               <td className={`p-3 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>DAMAS</td>
               <td className="text-center p-3 text-red-600 font-bold">115</td>
               <td className="text-center p-3 text-red-600 font-bold">59</td>
               <td className="text-center p-3 text-red-600 font-bold">2</td>
               <td className="text-center p-3 text-red-600 font-bold">16</td>
               <td className="text-center p-3 text-red-600 font-bold">9</td>
               <td className="text-center p-3">-</td>
               <td className="text-center p-3">-</td>
               <td className="text-center p-3">-</td>
               <td className="text-center p-3">-</td>
               <td className="text-center p-3">-</td>
               <td className="text-center p-3">-</td>
               <td className="text-center p-3 font-bold">201</td>
             </tr>
             <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
               <td className={`p-3 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>SUP</td>
               <td className="text-center p-3">-</td>
               <td className="text-center p-3">-</td>
               <td className="text-center p-3">-</td>
               <td className="text-center p-3 text-red-600 font-bold">1</td>
               <td className="text-center p-3">-</td>
               <td className="text-center p-3 text-red-600 font-bold">7</td>
               <td className="text-center p-3 text-red-600 font-bold">2</td>
               <td className="text-center p-3 text-red-600 font-bold">6</td>
               <td className="text-center p-3 text-red-600 font-bold">3</td>
               <td className="text-center p-3 text-red-600 font-bold">6</td>
               <td className="text-center p-3 text-red-600 font-bold">22</td>
               <td className="text-center p-3 font-bold">47</td>
             </tr>
             <tr className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} font-bold`}>
               <td className={`p-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>TOTAL</td>
               <td className="text-center p-3 text-red-600">189</td>
               <td className="text-center p-3 text-red-600">142</td>
               <td className="text-center p-3 text-red-600">90</td>
               <td className="text-center p-3 text-red-600">193</td>
               <td className="text-center p-3 text-red-600">2 019</td>
               <td className="text-center p-3 text-red-600">1 263</td>
               <td className="text-center p-3 text-red-600">2 975</td>
               <td className="text-center p-3 text-red-600">2 676</td>
               <td className="text-center p-3 text-red-600">6 004</td>
               <td className="text-center p-3 text-red-600">6</td>
               <td className="text-center p-3 text-red-600">22</td>
               <td className={`text-center p-3 text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>15 579</td>
             </tr>
           </tbody>
         </table>
       </div>
     </motion.div>
   </div>
 );
const renderTrendsChart = () => {
  if (!trendsChartRef.current) return;
  
  const container = trendsChartRef.current;
  d3.select(container).selectAll("*").remove();
  
  const chartData = [
    { date: '1 май', value: 54691, topValue: 8332, showRedArrow: true },
    { date: '1 июн', value: 60771, topValue: 6080, showRedArrow: true },
    { date: '5 июн', value: 61200, topValue: 0 },
    { date: '6 июн', value: 61200, topValue: 0 },
    { date: '7 июн', value: 61200, topValue: 0 },
    { date: '8 июн', value: 61200, topValue: 0 },
    { date: '9 июн', value: 62206, topValue: 1006, showRedArrow: true },
    { date: '10 июн', value: 62233, topValue: 27, showRedArrow: true },
    { date: '11 июн', value: 62270, topValue: 37, showRedArrow: true },
    { date: '12 июн', value: 62184, topValue: 86, showGreenArrow: true },
    { date: '13 июн', value: 62100, topValue: 84, showGreenArrow: true }
  ];
  
  const margin = { top: 60, right: 30, bottom: 80, left: 70 };
  const width = container.clientWidth - margin.left - margin.right;
  const height = 450 - margin.top - margin.bottom;
  
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);
  
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  
  // Шкалы
  const x = d3.scaleBand()
    .domain(chartData.map(d => d.date))
    .range([0, width])
    .padding(0.15);
  
  const y = d3.scaleLinear()
    .domain([0, 70000])
    .range([height, 0]);
  
  // Рисуем столбцы
  chartData.forEach((d, i) => {
    const barX = x(d.date);
    const barWidth = x.bandwidth();
    const totalValue = d.value + (d.topValue || 0);
    
    // Основной столбец
    const barColor = i < 2 ? '#8b9dc3' : '#4a90e2';
    const barStroke = i < 2 ? '#5b7aa8' : '#2c5aa0';
    
    g.append('rect')
      .attr('x', barX)
      .attr('width', barWidth)
      .attr('y', y(totalValue))
      .attr('height', height - y(totalValue))
      .attr('fill', barColor)
      .attr('stroke', barStroke)
      .attr('stroke-width', 1);
    
    // Верхняя часть столбца (красная или зеленая)
    if (d.topValue > 0) {
      const topColor = d.showGreenArrow ? '#70ad47' : '#e74c3c';
      const topStroke = d.showGreenArrow ? '#548235' : '#c0392b';
      
      g.append('rect')
        .attr('x', barX)
        .attr('width', barWidth)
        .attr('y', y(totalValue))
        .attr('height', height - y(d.value))
        .attr('fill', topColor)
        .attr('stroke', topStroke)
        .attr('stroke-width', 1);
    }
    
    // Значение над столбцом
    g.append('text')
      .attr('x', barX + barWidth / 2)
      .attr('y', y(totalValue) - 8)
      .attr('text-anchor', 'middle')
      .style('fill', '#333')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text(totalValue.toLocaleString('ru-RU'));
    
    // Стрелка и значение ВНУТРИ столбца
    if (d.topValue > 0) {
      const arrowX = barX + barWidth / 2;
      const arrowCenterY = y(d.value) + (height - y(d.value)) / 2;
      
      // Значение изменения
      g.append('text')
        .attr('x', arrowX)
        .attr('y', arrowCenterY - 40)
        .attr('text-anchor', 'middle')
        .style('fill', 'white')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text(d.topValue.toLocaleString());
      
      if (d.showRedArrow) {
        // Красная стрелка вверх
        g.append('path')
          .attr('d', `
            M ${arrowX} ${arrowCenterY - 25}
            L ${arrowX - 15} ${arrowCenterY}
            L ${arrowX - 5} ${arrowCenterY}
            L ${arrowX - 5} ${arrowCenterY + 20}
            L ${arrowX + 5} ${arrowCenterY + 20}
            L ${arrowX + 5} ${arrowCenterY}
            L ${arrowX + 15} ${arrowCenterY}
            Z
          `)
          .attr('fill', '#ffffff')
          .attr('stroke', '#e74c3c')
          .attr('stroke-width', 2);
      } else if (d.showGreenArrow) {
        // Зеленая стрелка вниз
        g.append('path')
          .attr('d', `
            M ${arrowX} ${arrowCenterY + 20}
            L ${arrowX - 15} ${arrowCenterY - 5}
            L ${arrowX - 5} ${arrowCenterY - 5}
            L ${arrowX - 5} ${arrowCenterY - 25}
            L ${arrowX + 5} ${arrowCenterY - 25}
            L ${arrowX + 5} ${arrowCenterY - 5}
            L ${arrowX + 15} ${arrowCenterY - 5}
            Z
          `)
          .attr('fill', '#ffffff')
          .attr('stroke', '#70ad47')
          .attr('stroke-width', 2);
      }
    }
  });
  
  // Оси
  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .style('font-size', '12px')
    .style('font-weight', '500');
  
  g.append('g')
    .call(d3.axisLeft(y)
      .ticks(7)
      .tickFormat(d => d.toLocaleString('ru-RU')))
    .selectAll('text')
    .style('font-size', '12px');
  
  // Сетка
  g.selectAll('.grid-line-y')
    .data(y.ticks(7))
    .enter().append('line')
    .attr('class', 'grid-line-y')
    .attr('x1', 0)
    .attr('x2', width)
    .attr('y1', d => y(d))
    .attr('y2', d => y(d))
    .attr('stroke', isDark ? '#374151' : '#e5e7eb')
    .attr('stroke-width', 0.5)
    .style('opacity', 0.7);
};
 // Заглушки для других табов
const renderTrendsContent = () => {
  // Исправленные данные для таблицы с правильным форматированием
  const tableData = [
    { 
      model: 'COBALT', 
      may13: '846', 
      may1: '198', 
      june1: '44', 
      asaka: '-', 
      khorezm: '121', 
      angren: '53', 
      tashkent: '-', 
      asakaCity: '-', 
      sergeli: '4', 
      yuldash: '36', 
      dealers: '258', 
      total: '+37',
      isPositive: true
    },
    { 
      model: 'LACETTI', 
      may13: '1', 
      may1: '0', 
      june1: '-', 
      asaka: '-', 
      khorezm: '-', 
      angren: '-', 
      tashkent: '-', 
      asakaCity: '-', 
      sergeli: '-', 
      yuldash: '-', 
      dealers: '-', 
      total: '+0',
      isPositive: true
    },
    { 
      model: 'ONIX', 
      may13: '21451', 
      may1: '21013', 
      june1: '1 090', 
      asaka: '-', 
      khorezm: '2 025', 
      angren: '6', 
      tashkent: '11 910', 
      asakaCity: '2', 
      sergeli: '236', 
      yuldash: '6 156', 
      dealers: '21 425', 
      total: '-46',
      isPositive: false
    },
    { 
      model: 'TRACKER', 
      may13: '15979', 
      may1: '16689', 
      june1: '2 106', 
      asaka: '-', 
      khorezm: '916', 
      angren: '4', 
      tashkent: '8 245', 
      asakaCity: '-', 
      sergeli: '311', 
      yuldash: '4 901', 
      dealers: '16 483', 
      total: '+116',
      isPositive: true
    },
    { 
      model: 'Nexia / Spark', 
      may13: '0', 
      may1: '0', 
      june1: '-', 
      asaka: '-', 
      khorezm: '-', 
      angren: '-', 
      tashkent: '-', 
      asakaCity: '-', 
      sergeli: '-', 
      yuldash: '-', 
      dealers: '-', 
      total: '+0',
      isPositive: true
    },
    { 
      model: 'Damas / Labo', 
      may13: '16023', 
      may1: '22500', 
      june1: '-', 
      asaka: '18 849', 
      khorezm: '3', 
      angren: '20', 
      tashkent: '-', 
      asakaCity: '-', 
      sergeli: '637', 
      yuldash: '4 085', 
      dealers: '23 594', 
      total: '-154',
      isPositive: false
    },
    { 
      model: 'SUP', 
      may13: '391', 
      may1: '371', 
      june1: '-', 
      asaka: '1', 
      khorezm: '37', 
      angren: '121', 
      tashkent: '-', 
      asakaCity: '-', 
      sergeli: '2', 
      yuldash: '179', 
      dealers: '340', 
      total: '-31',
      isPositive: false
    }
  ];

  const totals = {
    may13: '54691',
    may1: '60771',
    june1: '3 240',
    asaka: '18 850',
    khorezm: '3 102',
    angren: '204',
    tashkent: '20 155',
    asakaCity: '2',
    sergeli: '1 190',
    yuldash: '15 357',
    dealers: '62 100',
    total: '-84'
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-lg`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Эғасиз(<span className="text-orange-500">Free</span>) турган автомобиллар
          </h2>
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            13 июнь 2025
          </span>
        </div>

        {/* Таблица */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className={`text-left p-3 font-medium ${isDark ? 'text-gray-300 bg-gray-700' : 'text-gray-700 bg-gray-100'} border ${isDark ? 'border-gray-600' : 'border-gray-300'}`} rowSpan={2}>
                  
                </th>
                <th className={`text-center p-3 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} bg-blue-100 dark:bg-blue-900/30 border ${isDark ? 'border-gray-600' : 'border-gray-300'}`} rowSpan={2}>
                  13 июн
                </th>
                <th className={`text-center p-3 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} bg-yellow-100 dark:bg-yellow-900/30 border ${isDark ? 'border-gray-600' : 'border-gray-300'}`} rowSpan={2}>
                  1 май
                </th>
                <th className={`text-center p-3 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} bg-yellow-100 dark:bg-yellow-900/30 border ${isDark ? 'border-gray-600' : 'border-gray-300'}`} rowSpan={2}>
                  1 июн
                </th>
                <th colSpan={7} className={`text-center p-3 font-medium ${isDark ? 'text-gray-300 bg-gray-700' : 'text-gray-700 bg-gray-100'} border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                  
                </th>
                <th className={`text-center p-3 font-medium ${isDark ? 'text-gray-300 bg-gray-700' : 'text-gray-700 bg-gray-100'} border ${isDark ? 'border-gray-600' : 'border-gray-300'}`} rowSpan={2}>
                  Диллерда
                </th>
                <th className={`text-center p-3 font-medium ${isDark ? 'text-gray-300 bg-gray-700' : 'text-gray-700 bg-gray-100'} border ${isDark ? 'border-gray-600' : 'border-gray-300'}`} rowSpan={2}>
                  Жами:
                </th>
                <th className={`text-center p-3 font-medium ${isDark ? 'text-gray-300 bg-gray-700' : 'text-gray-700 bg-gray-100'} border ${isDark ? 'border-gray-600' : 'border-gray-300'}`} rowSpan={2}>
                  Кунлик<br/>Фарқ
                </th>
              </tr>
              <tr>
                <th className={`text-center p-2 text-xs ${isDark ? 'text-gray-400 bg-gray-700' : 'text-gray-600 bg-gray-100'} border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                  Асака<br/>(Корхона)
                </th>
                <th className={`text-center p-2 text-xs ${isDark ? 'text-gray-400 bg-gray-700' : 'text-gray-600 bg-gray-100'} border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                  Хоразм<br/>(Корхона)
                </th>
                <th className={`text-center p-2 text-xs ${isDark ? 'text-gray-400 bg-gray-700' : 'text-gray-600 bg-gray-100'} border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                  Ангрен<br/>(Терминал)
                </th>
                <th className={`text-center p-2 text-xs ${isDark ? 'text-gray-400 bg-gray-700' : 'text-gray-600 bg-gray-100'} border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                  Тошкент<br/>(Филиал)
                </th>
                <th className={`text-center p-2 text-xs ${isDark ? 'text-gray-400 bg-gray-700' : 'text-gray-600 bg-gray-100'} border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                  Асака (Сити)/<br/>Андижон/<br/>Фаргона
                </th>
                <th className={`text-center p-2 text-xs ${isDark ? 'text-gray-400 bg-gray-700' : 'text-gray-600 bg-gray-100'} border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                  Сергели<br/>(Склад)
                </th>
                <th className={`text-center p-2 text-xs ${isDark ? 'text-gray-400 bg-gray-700' : 'text-gray-600 bg-gray-100'} border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                  Йўлдош
                </th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, index) => (
                <tr key={index} className={`${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                  <td className={`p-3 font-medium ${isDark ? 'text-white' : 'text-gray-900'} border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                    {row.model}
                  </td>
                  <td className={`text-center p-3 ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'} border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                    {row.may13}
                  </td>
                  <td className={`text-center p-3 ${isDark ? 'bg-yellow-900/20' : 'bg-yellow-50'} border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                    {row.may1}
                  </td>
                  <td className={`text-center p-3 ${isDark ? 'bg-yellow-900/20' : 'bg-yellow-50'} border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                    {row.june1}
                  </td>
                  <td className={`text-center p-3 border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>{row.asaka}</td>
                  <td className={`text-center p-3 border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>{row.khorezm}</td>
                  <td className={`text-center p-3 border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>{row.angren}</td>
                  <td className={`text-center p-3 border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>{row.tashkent}</td>
                  <td className={`text-center p-3 border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>{row.asakaCity}</td>
                  <td className={`text-center p-3 border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>{row.sergeli}</td>
                  <td className={`text-center p-3 border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>{row.yuldash}</td>
                  <td className={`text-center p-3 font-bold border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                    {row.dealers}
                  </td>
                  <td className={`text-center p-3 font-bold border ${isDark ? 'border-gray-600' : 'border-gray-300'} ${
                    row.isPositive ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {row.total}
                  </td>
                </tr>
              ))}
              <tr className={`font-bold ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <td className={`p-3 ${isDark ? 'text-white' : 'text-gray-900'} border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                  Жами:
                </td>
                <td className={`text-center p-3 ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'} border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                  {totals.may13}
                </td>
                <td className={`text-center p-3 ${isDark ? 'bg-yellow-900/20' : 'bg-yellow-50'} border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                  {totals.may1}
                </td>
                <td className={`text-center p-3 ${isDark ? 'bg-yellow-900/20' : 'bg-yellow-50'} border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                  {totals.june1}
                </td>
                <td className={`text-center p-3 border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>{totals.asaka}</td>
                <td className={`text-center p-3 border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>{totals.khorezm}</td>
                <td className={`text-center p-3 border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>{totals.angren}</td>
                <td className={`text-center p-3 border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>{totals.tashkent}</td>
                <td className={`text-center p-3 border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>{totals.asakaCity}</td>
                <td className={`text-center p-3 border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>{totals.sergeli}</td>
                <td className={`text-center p-3 border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>{totals.yuldash}</td>
                <td className={`text-center p-3 border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                  {totals.dealers}
                </td>
                <td className={`text-center p-3 text-green-600 border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                  {totals.total}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* График */}
        <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
          <div ref={trendsChartRef} className="w-full" style={{ height: '450px' }} />
        </div>
      </div>
    </div>
  );
};
 
 const renderAnalyticsContent = () => (
   <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-8 rounded-xl shadow-lg`}>
     <div className="flex items-center justify-center h-96">
       <div className="text-center">
         <span className="text-6xl mb-4 block">📉</span>
         <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
           Контент для "Аналитика" будет добавлен здесь
         </p>
       </div>
     </div>
   </div>
 );
  // Добавьте эту функцию после объявления состояний
const handleTabChange = (tabId) => {
  setActiveTab(tabId);
  
  // Принудительная перерисовка графиков после смены таба
  setTimeout(() => {
  if (tabId === 'current') {
      if (dailyChartRef.current) renderDailyChart();
      if (monthlyChartRef.current) renderMonthlyChart();
    } else if (tabId === 'ready') {
      if (eventChartRef.current) renderEventChart();
      if (realizationChartRef.current) renderRealizationChart();
    } else if (tabId === 'trends') {
      if (trendsChartRef.current) renderTrendsChart(); // Добавьте эту строку
    }
  }, 100);
};
 
 if (loading) {
   return <ContentReadyLoader />;
 }
 
 return (
   <div className={`p-4 md:p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen`}>
     {/* Заголовок с датой справа и уведомлением о тестовых данных */}
{/* Табы в стиле сегментированного контрола */}
<div className="mb-6">
  <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
    Режим просмотра
  </h3>
  <div className={`inline-flex rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-200'} p-1`}>
    {tabs.map((tab, index) => (
      <button
        key={tab.id}
        onClick={() => handleTabChange(tab.id)}
        className={`
          relative px-6 py-3 rounded-md font-medium transition-all duration-200
          flex items-center gap-3
          ${activeTab === tab.id
            ? isDark
              ? 'bg-gray-700 text-white shadow-inner' 
              : 'bg-white text-gray-900 shadow-sm'
            : isDark 
              ? 'text-gray-400 hover:text-gray-300' 
              : 'text-gray-600 hover:text-gray-700'
          }
          ${index === 0 ? 'rounded-l-md' : ''}
          ${index === tabs.length - 1 ? 'rounded-r-md' : ''}
        `}
      >
        <span className="text-xl">{tab.icon}</span>
        <div className="text-left">
          <div className="text-sm font-semibold">{tab.label}</div>
          <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            {tab.id === 'current' && 'Ежедневная статистика'}
            {tab.id === 'ready' && 'Готовая продукция'}
            {tab.id === 'trends' && 'Анализ трендов'}
            {tab.id === 'analytics' && 'Детальный анализ'}
          </div>
        </div>
      </button>
    ))}
  </div>
</div>
     
     {/* Контент табов */}
{/* Контент табов - все рендерится сразу */}
<div className="relative">
  {/* Текущее производство */}
  <div className={`${activeTab === 'current' ? 'block' : 'hidden'}`}>
    {renderCurrentProductionContent()}
  </div>
  
  {/* Готовая продукция */}
  <div className={`${activeTab === 'ready' ? 'block' : 'hidden'}`}>
    {renderReadyProductsContent()}
  </div>
  
  {/* Тренды */}
  <div className={`${activeTab === 'trends' ? 'block' : 'hidden'}`}>
    {renderTrendsContent()}
  </div>
  
  {/* Аналитика */}
  <div className={`${activeTab === 'analytics' ? 'block' : 'hidden'}`}>
    {renderAnalyticsContent()}
  </div>
</div>
   </div>
 );
}