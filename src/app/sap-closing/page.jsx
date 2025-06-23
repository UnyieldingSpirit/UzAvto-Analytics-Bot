// app/sap-closing/page.jsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useThemeStore } from '../../store/theme';
import { useLanguageStore } from '../../store/language';
import { useTranslation } from '../../hooks/useTranslation';
import { sapClosingTranslations } from './translations';
import * as d3 from 'd3';
import { 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Timer,
  TrendingUp,
  TrendingDown,
  Filter,
  Download,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Search,
  Loader2,
  FileText,
  Users,
  Building2,
  BarChart3
} from 'lucide-react';

// Генератор моковых данных
const generateMockTasks = () => {
  const profiles = ['UZ01202504', 'UZ01202503', 'UZ01202502', 'UZ01202501'];
  const instances = ['8', '7', '6', '5'];
  
  const taskTemplates = [
    { code: '0.1.1.1', name: 'Сборочный цех ОТРАЖЕНИЯ ДВИЖЕНИЙ МАТЕРИАЛОВ' },
    { code: '0.1.1.2', name: 'Прессовый цех№1 ОТРАЖЕНИЯ ДВИЖЕНИЙ МАТЕРИАЛОВ' },
    { code: '0.1.1.3', name: 'Прессовый цех№2 ОТРАЖЕНИЯ ДВИЖЕНИЙ МАТЕРИАЛОВ' },
    { code: '0.1.1.4', name: 'Сварочный цех№1 ОТРАЖЕНИЯ ДВИЖЕНИЙ МАТЕРИАЛОВ' },
    { code: '0.1.1.5', name: 'Сварочный цех№2 ОТРАЖЕНИЯ ДВИЖЕНИЙ МАТЕРИАЛОВ' },
    { code: '0.1.1.6', name: 'Сварочный цех№3 ОТРАЖЕНИЯ ДВИЖЕНИЙ МАТЕРИАЛОВ' },
    { code: '0.1.1.7', name: 'Окрасочный цех ОТРАЖЕНИЯ ДВИЖЕНИЙ МАТЕРИАЛОВ' },
    { code: '0.1.1.8', name: 'Логистика ОТРАЖЕНИЯ ДВИЖЕНИЙ МАТЕРИАЛОВ + ГТД' },
    { code: '0.1.1.9', name: 'Склад ОТРАЖЕНИЯ ДВИЖЕНИЙ МАТЕРИАЛОВ + ГТД' },
    { code: '0.1.1.10', name: 'РСУ ОТРАЖЕНИЯ ДВИЖЕНИЙ МАТЕРИАЛОВ' },
    { code: '0.1.1.11', name: 'Отдел Техники Безопасности ОТРАЖЕНИЯ ДВИЖ. МАТЕР.' },
    { code: '0.1.1.12', name: 'Транспортный отдел ОТРАЖЕНИЯ ДВИЖЕНИЙ МАТЕРИАЛОВ' },
    { code: '0.1.1.13', name: 'Администрация ОТРАЖЕНИЯ ДВИЖЕНИЙ МАТЕРИАЛОВ' },
    { code: '0.1.1.14', name: 'Коммунальный ОТРАЖЕНИЯ ДВИЖЕНИЙ МАТЕРИАЛОВ' },
    { code: '0.1.1.15', name: 'Строй комитет ОТРАЖЕНИЯ ДВИЖЕНИЙ МАТЕРИАЛОВ' },
    { code: '0.1.2.1', name: 'ОДМ+ГТД 2100 Ташкентский офис' },
    { code: '0.1.3.1', name: 'ОДМ+ГТД 2200 Питнак' },
    { code: '0.1.4.1', name: 'ОДМ+ГТД 2300 Ташкентский филиал SUP' },
    { code: '0.2.1', name: '2100 Асака Операции по дискретному производству' },
    { code: '0.2.2', name: '2200 Питнак Операции по дискретному производству' },
    { code: '0.3.1', name: '2100 Асака Операции по давальческой переработке' },
    { code: '0.3.2', name: '2200 Питнак Операции по давальческой переработке' },
    { code: '0.4.1', name: '2100 Асака Операции по выпуску готовой продукции' },
    { code: '0.4.2', name: '2200 Питнак Операции по выпуску готовой продукции' },
    { code: '0.5.1', name: '2100 Асака Отражение НЗП-04' },
    { code: '0.6.1.1', name: 'COGI по всем подр. в стркт. Упр.Дир. Мирзаходжаев С.' },
    { code: '0.6.1.2', name: 'Сборочный цех Обработка записей COGI' },
    { code: '0.6.1.3', name: 'Прессовый цех№1 Обработка записей COGI' },
    { code: '0.6.1.4', name: 'Прессовый цех№2 Обработка записей COGI' },
    { code: '0.6.1.5', name: 'Сварочный цех№1 Обработка записей COGI' },
    { code: '0.6.1.6', name: 'Сварочный цех№2 Обработка записей COGI' },
    { code: '0.6.1.7', name: 'Сварочный цех№3 Обработка записей COGI' },
    { code: '0.6.1.8', name: 'Окрасочный цех Обработка записей COGI' },
    { code: '0.6.2.1', name: '2200 Питнак Обработка записей COGI' },
    { code: '0.7.1', name: '2100 Асака Операции финансов' }
  ];
  
  const executors = [
    'Иванов А.А.',
    'Петрова М.С.',
    'Сидоров В.П.',
    'Козлова Е.И.',
    'Николаев Д.К.',
    'Смирнова О.В.',
    'Морозов С.А.',
    'Волкова Н.Д.'
  ];
  
  const statuses = [
    { id: '10', name: 'Проверено' },
    { id: '20', name: 'Выполнено' },
    { id: '30', name: 'Завершено с предупреждениями' },
    { id: '40', name: 'В обработке' },
    { id: '50', name: 'Запланировано' },
    { id: '60', name: 'Не запущено' },
    { id: '70', name: 'Неизвестно' },
    { id: '80', name: 'Завершено с ошибками' },
    { id: '90', name: 'Обработка прервана' }
  ];
  
  const tasks = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  // Генерируем 50-70 задач
  const totalTasks = 50 + Math.floor(Math.random() * 20);
  
  for (let i = 0; i < totalTasks; i++) {
    const profile = profiles[Math.floor(Math.random() * profiles.length)];
    const instance = instances[Math.floor(Math.random() * instances.length)];
    const template = taskTemplates[i % taskTemplates.length];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const executor = executors[Math.floor(Math.random() * executors.length)];
    
    // Генерируем даты
    const plannedStartDay = 1 + Math.floor(Math.random() * 5);
    const plannedStartDate = `${String(plannedStartDay).padStart(2, '0')}.${String(currentMonth).padStart(2, '0')}.${currentYear}`;
    const plannedStartTime = `08:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`;
    
    const plannedDurationHours = 24 + Math.floor(Math.random() * 300);
    const plannedEndDay = plannedStartDay + Math.floor(plannedDurationHours / 24);
    const plannedEndDate = `${String(plannedEndDay).padStart(2, '0')}.${String(currentMonth).padStart(2, '0')}.${currentYear}`;
    const plannedEndTime = `${String(8 + Math.floor(Math.random() * 10)).padStart(2, '0')}:00:00`;
    
    let actualStartDate = '';
    let actualStartTime = '';
    let actualEndDate = '';
    let actualEndTime = '';
    let diffInHours = 0;
    
    // Для выполненных и в процессе задач генерируем фактические даты
    if (status.id === '20' || status.id === '10' || status.id === '30' || status.id === '80') {
      actualStartDate = plannedStartDate;
      actualStartTime = plannedStartTime;
      
      const actualDurationHours = plannedDurationHours + (Math.random() - 0.5) * 48;
      const actualEndDay = plannedStartDay + Math.floor(actualDurationHours / 24);
      actualEndDate = `${String(actualEndDay).padStart(2, '0')}.${String(currentMonth).padStart(2, '0')}.${currentYear}`;
      actualEndTime = `${String(8 + Math.floor(Math.random() * 10)).padStart(2, '0')}:00:00`;
      
      diffInHours = Math.round(actualDurationHours - plannedDurationHours);
    } else if (status.id === '40') {
      actualStartDate = plannedStartDate;
      actualStartTime = plannedStartTime;
      diffInHours = Math.round((Math.random() - 0.5) * 24);
    }
    
    tasks.push({
      closingTemplate: profile,
      closingTaskListInstance: instance,
      closingTask: template.code,
      closingTaskName: template.name,
      plannedStartDate,
      plannedEndDate,
      actualPlnStartTimeDiffInHours: Math.abs(diffInHours),
      actualPlnEndTimeDiffInHours: diffInHours,
      executor,
      statusId: status.id,
      statusName: status.name,
      actualStartDate,
      actualStartTime,
      actualEndDate,
      actualEndTime,
      plannedStartTime,
      plannedEndTime,
      globalId: `00000000${String(1000 + i).padStart(4, '0')}`,
      item: `00000000${String(1000 + i).padStart(4, '0')}`,
      node: template.code.split('.').slice(0, -1).join('.') || '0'
    });
  }
  
  return tasks;
};

export default function SAPClosingPage() {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedPeriod, setSelectedPeriod] = useState('004');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  
  const chartRef = useRef(null);
  
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';
  const { currentLocale } = useLanguageStore();
  const { t } = useTranslation(sapClosingTranslations);
  
  // Цвета темы
  const colors = {
    background: isDark ? '#0f172a' : '#ffffff',
    cardBg: isDark ? '#1e293b' : '#f8fafc',
    text: isDark ? '#f1f5f9' : '#1e293b',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    primary: '#6366f1'
  };
  
  // Загрузка данных
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const mockData = generateMockTasks();
        setTasks(mockData);
        setFilteredTasks(mockData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [selectedYear, selectedPeriod]);
  
  // Фильтрация и поиск
  useEffect(() => {
    let filtered = [...tasks];
    
    // Фильтр по статусу
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(task => task.statusId === selectedStatus);
    }
    
    // Поиск
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.closingTaskName.toLowerCase().includes(query) ||
        task.closingTask.toLowerCase().includes(query) ||
        task.executor.toLowerCase().includes(query)
      );
    }
    
    // Сортировка
    if (sortColumn) {
      filtered.sort((a, b) => {
        let aVal = a[sortColumn];
        let bVal = b[sortColumn];
        
        if (sortColumn.includes('Date')) {
          aVal = new Date(aVal.split('.').reverse().join('-'));
          bVal = new Date(bVal.split('.').reverse().join('-'));
        }
        
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    setFilteredTasks(filtered);
  }, [tasks, selectedStatus, searchQuery, sortColumn, sortDirection]);
  
  // Отрисовка графика
  useEffect(() => {
    if (!isLoading && filteredTasks.length > 0 && chartRef.current) {
      renderChart();
    }
  }, [filteredTasks, isDark]);
  
 // Обновленная функция renderChart в том же файле
const renderChart = () => {
  const container = d3.select(chartRef.current);
  container.selectAll('*').remove();
  
  const width = chartRef.current.clientWidth;
  const height = 350; // Увеличил высоту
  const margin = { top: 30, right: 120, bottom: 80, left: 80 };
  
  const svg = container
    .append('svg')
    .attr('width', width)
    .attr('height', height);
  
  // Группируем по статусам с дополнительной информацией
  const statusData = d3.rollup(
    filteredTasks,
    tasks => ({
      count: tasks.length,
      delayed: tasks.filter(t => t.actualPlnEndTimeDiffInHours > 0).length,
      onTime: tasks.filter(t => t.actualPlnEndTimeDiffInHours <= 0).length,
      avgDelay: d3.mean(tasks.filter(t => t.actualPlnEndTimeDiffInHours > 0), t => t.actualPlnEndTimeDiffInHours) || 0
    }),
    d => d.statusName
  );
  
  const data = Array.from(statusData, ([status, stats]) => ({ 
    status, 
    ...stats,
    percentage: (stats.count / filteredTasks.length * 100).toFixed(1)
  }));
  
  // Сортируем по количеству
  data.sort((a, b) => b.count - a.count);
  
  // Цветовая схема для статусов
  const getStatusColor = (status) => {
    if (status.includes('Выполнено') || status.includes('Проверено')) return colors.success;
    if (status.includes('обработке')) return colors.info;
    if (status.includes('ошибками') || status.includes('прервана')) return colors.error;
    if (status.includes('предупреждениями')) return colors.warning;
    if (status.includes('Запланировано')) return colors.primary;
    return colors.textSecondary;
  };
  
  // Градиенты для красоты
  const defs = svg.append('defs');
  
  data.forEach((d, i) => {
    const gradient = defs.append('linearGradient')
      .attr('id', `gradient-${i}`)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    
    const color = getStatusColor(d.status);
    gradient.append('stop')
      .attr('offset', '0%')
      .style('stop-color', color)
      .style('stop-opacity', 0.8);
    
    gradient.append('stop')
      .attr('offset', '100%')
      .style('stop-color', color)
      .style('stop-opacity', 0.4);
  });
  
  // Шкалы
  const xScale = d3.scaleBand()
    .domain(data.map(d => d.status))
    .range([margin.left, width - margin.right])
    .padding(0.3);
  
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.count) * 1.1])
    .nice()
    .range([height - margin.bottom, margin.top]);
  
  // Сетка
  svg.append('g')
    .attr('class', 'grid')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale)
      .tickSize(-width + margin.left + margin.right)
      .tickFormat('')
    )
    .style('stroke-dasharray', '3,3')
    .style('opacity', 0.3)
    .style('stroke', colors.border);
  
  // Оси
  const xAxis = svg.append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(xScale))
    .style('color', colors.textSecondary);
  
  xAxis.selectAll('text')
    .style('font-size', '12px')
    .attr('transform', 'rotate(-30)')
    .style('text-anchor', 'end')
    .each(function(d) {
      const text = d3.select(this);
      const words = d.split(' ');
      if (words.length > 2) {
        text.text(words.slice(0, 2).join(' ') + '...');
      }
    });
  
  svg.append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale))
    .style('color', colors.textSecondary)
    .style('font-size', '12px');
  
  // Группы для столбцов
  const barGroups = svg.selectAll('.bar-group')
    .data(data)
    .enter()
    .append('g')
    .attr('class', 'bar-group');
  
  // Основные столбцы с градиентом
  barGroups.append('rect')
    .attr('x', d => xScale(d.status))
    .attr('y', height - margin.bottom)
    .attr('width', xScale.bandwidth())
    .attr('height', 0)
    .attr('fill', (d, i) => `url(#gradient-${i})`)
    .attr('rx', 4)
    .attr('ry', 4)
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .style('opacity', 0.8);
      
      // Показываем подсказку
      const tooltip = d3.select('body').append('div')
        .attr('class', 'chart-tooltip')
        .style('position', 'absolute')
        .style('background', isDark ? colors.cardBg : colors.background)
        .style('border', `1px solid ${colors.border}`)
        .style('border-radius', '8px')
        .style('padding', '12px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .style('z-index', 1000);
      
      tooltip.html(`
        <div style="color: ${colors.text}; font-weight: 600; margin-bottom: 8px;">${d.status}</div>
        <div style="color: ${colors.textSecondary};">
          <div>Всего: <span style="color: ${colors.text}; font-weight: 500;">${d.count}</span></div>
          <div>Процент: <span style="color: ${colors.text}; font-weight: 500;">${d.percentage}%</span></div>
          ${d.delayed > 0 ? `<div>С задержкой: <span style="color: ${colors.error}; font-weight: 500;">${d.delayed}</span></div>` : ''}
          ${d.avgDelay > 0 ? `<div>Ср. задержка: <span style="color: ${colors.warning}; font-weight: 500;">${Math.round(d.avgDelay)}ч</span></div>` : ''}
        </div>
      `);
      
      tooltip.transition()
        .duration(200)
        .style('opacity', 0.95)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    })
    .on('mouseout', function() {
      d3.select(this)
        .transition()
        .duration(200)
        .style('opacity', 1);
      
      d3.selectAll('.chart-tooltip').remove();
    })
    .transition()
    .duration(800)
    .delay((d, i) => i * 100)
    .attr('y', d => yScale(d.count))
    .attr('height', d => height - margin.bottom - yScale(d.count));
  
  // Значения на столбцах
  barGroups.append('text')
    .attr('x', d => xScale(d.status) + xScale.bandwidth() / 2)
    .attr('y', d => yScale(d.count) - 8)
    .attr('text-anchor', 'middle')
    .style('fill', colors.text)
    .style('font-size', '14px')
    .style('font-weight', '600')
    .style('opacity', 0)
    .transition()
    .duration(800)
    .delay((d, i) => i * 100 + 400)
    .style('opacity', 1)
    .text(d => d.count);
  
  // Процент под значением
  barGroups.append('text')
    .attr('x', d => xScale(d.status) + xScale.bandwidth() / 2)
    .attr('y', d => yScale(d.count) + 15)
    .attr('text-anchor', 'middle')
    .style('fill', colors.textSecondary)
    .style('font-size', '11px')
    .style('opacity', 0)
    .transition()
    .duration(800)
    .delay((d, i) => i * 100 + 600)
    .style('opacity', 1)
    .text(d => `${d.percentage}%`);
  
  // Индикаторы задержек (если есть)
  barGroups.filter(d => d.delayed > 0)
    .append('rect')
    .attr('x', d => xScale(d.status))
    .attr('y', d => yScale(d.count) - 3)
    .attr('width', xScale.bandwidth())
    .attr('height', 3)
    .attr('fill', colors.error)
    .attr('rx', 1.5)
    .style('opacity', 0)
    .transition()
    .duration(800)
    .delay((d, i) => i * 100 + 800)
    .style('opacity', 0.8);
  
  // Заголовок графика
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', 15)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .style('font-weight', '600')
    .style('fill', colors.text)
    .text('Распределение задач по статусам');
  
  // Легенда справа
  const legend = svg.append('g')
    .attr('transform', `translate(${width - margin.right + 20}, ${margin.top})`);
  
  const legendItems = [
    { label: 'Выполнено', color: colors.success },
    { label: 'В процессе', color: colors.info },
    { label: 'Ошибки', color: colors.error },
    { label: 'Предупреждения', color: colors.warning },
    { label: 'Запланировано', color: colors.primary }
  ];
  
  legendItems.forEach((item, i) => {
    const legendItem = legend.append('g')
      .attr('transform', `translate(0, ${i * 25})`);
    
    legendItem.append('rect')
      .attr('width', 16)
      .attr('height', 16)
      .attr('fill', item.color)
      .attr('rx', 3)
      .style('opacity', 0.8);
    
    legendItem.append('text')
      .attr('x', 22)
      .attr('y', 12)
      .style('font-size', '12px')
      .style('fill', colors.textSecondary)
      .text(item.label);
  });
  
  // Общая статистика внизу
  const stats = svg.append('g')
    .attr('transform', `translate(${width / 2}, ${height - 20})`);
  
  stats.append('text')
    .attr('text-anchor', 'middle')
    .style('font-size', '12px')
    .style('fill', colors.textSecondary)
    .html(`Всего задач: <tspan style="font-weight: 600; fill: ${colors.text}">${filteredTasks.length}</tspan> | ` +
          `Завершено: <tspan style="font-weight: 600; fill: ${colors.success}">${data.filter(d => d.status.includes('Выполнено') || d.status.includes('Проверено')).reduce((sum, d) => sum + d.count, 0)}</tspan> | ` +
          `С задержкой: <tspan style="font-weight: 600; fill: ${colors.error}">${filteredTasks.filter(t => t.actualPlnEndTimeDiffInHours > 0).length}</tspan>`);
};
  
  // Обработка сортировки
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  
  // Получение иконки статуса
  const getStatusIcon = (statusId) => {
    switch (statusId) {
      case '10':
      case '20': return <CheckCircle size={16} style={{ color: colors.success }} />;
      case '30': return <AlertCircle size={16} style={{ color: colors.warning }} />;
      case '40': return <Timer size={16} style={{ color: colors.info }} />;
      case '50':
      case '60': return <Clock size={16} style={{ color: colors.textSecondary }} />;
      case '80':
      case '90': return <XCircle size={16} style={{ color: colors.error }} />;
      default: return <AlertCircle size={16} style={{ color: colors.textSecondary }} />;
    }
  };
  
  // Статистика
  const statistics = {
    total: filteredTasks.length,
    completed: filteredTasks.filter(t => t.statusId === '20' || t.statusId === '10').length,
    inProgress: filteredTasks.filter(t => t.statusId === '40').length,
    delayed: filteredTasks.filter(t => t.actualPlnEndTimeDiffInHours > 0).length,
    onTime: filteredTasks.filter(t => t.actualPlnEndTimeDiffInHours <= 0 && (t.statusId === '20' || t.statusId === '10')).length
  };
  
  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.background }}>
      {/* Заголовок */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>
          {t('title')}
        </h1>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          Период: {selectedPeriod}/{selectedYear}
        </p>
      </motion.div>
      
      {/* Статистика */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-lg"
          style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}
        >
          <p className="text-sm mb-1" style={{ color: colors.textSecondary }}>
            {t('stats.totalTasks')}
          </p>
          <p className="text-2xl font-bold" style={{ color: colors.text }}>
            {statistics.total}
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-lg"
          style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}
        >
          <p className="text-sm mb-1" style={{ color: colors.textSecondary }}>
            {t('stats.completed')}
          </p>
          <p className="text-2xl font-bold" style={{ color: colors.success }}>
            {statistics.completed}
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-lg"
          style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}
        >
          <p className="text-sm mb-1" style={{ color: colors.textSecondary }}>
            {t('stats.inProgress')}
          </p>
          <p className="text-2xl font-bold" style={{ color: colors.info }}>
            {statistics.inProgress}
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-lg"
          style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}
        >
          <p className="text-sm mb-1" style={{ color: colors.textSecondary }}>
            {t('stats.delayed')}
          </p>
          <p className="text-2xl font-bold" style={{ color: colors.error }}>
            {statistics.delayed}
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="p-4 rounded-lg"
          style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}
        >
          <p className="text-sm mb-1" style={{ color: colors.textSecondary }}>
            Вовремя
          </p>
          <p className="text-2xl font-bold" style={{ color: colors.success }}>
            {statistics.onTime}
          </p>
        </motion.div>
      </div>
      
      {/* График */}
    <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.5 }}
  className="mb-6 p-6 rounded-lg"
  style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}
>
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold" style={{ color: colors.text }}>
      Аналитика выполнения задач
    </h3>
    <div className="flex items-center gap-2 text-sm" style={{ color: colors.textSecondary }}>
      <BarChart3 size={16} />
      <span>Обновлено: {new Date().toLocaleTimeString(currentLocale)}</span>
    </div>
  </div>
  <div ref={chartRef} style={{ width: '100%', height: '350px' }} />
</motion.div>
      
      {/* Фильтры */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mb-4 p-4 rounded-lg"
        style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}
      >
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: colors.textSecondary }} />
              <input
                type="text"
                placeholder="Поиск по задачам..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-md border"
                style={{ 
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text
                }}
              />
            </div>
          </div>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-md border"
            style={{ 
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.text
            }}
          >
            <option value="all">Все статусы</option>
            <option value="10">Проверено</option>
            <option value="20">Выполнено</option>
            <option value="30">Завершено с предупреждениями</option>
            <option value="40">В обработке</option>
            <option value="50">Запланировано</option>
            <option value="80">Завершено с ошибками</option>
          </select>
          
          <button
            onClick={() => {
              const mockData = generateMockTasks();
              setTasks(mockData);
              setFilteredTasks(mockData);
            }}
            className="px-4 py-2 rounded-md flex items-center gap-2"
            style={{ 
              backgroundColor: colors.primary,
              color: '#ffffff'
            }}
          >
            <RefreshCw size={16} />
            {t('filters.refresh')}
          </button>
          
          {/* <button
            className="px-4 py-2 rounded-md flex items-center gap-2 border"
            style={{ 
              borderColor: colors.border,
              color: colors.text
            }}
          >
            <Download size={16} />
            {t('filters.export')}
          </button> */}
        </div>
      </motion.div>
      
      {/* Таблица */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="rounded-lg overflow-hidden"
        style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin mr-3" size={32} style={{ color: colors.primary }} />
            <span className="text-lg" style={{ color: colors.text }}>{t('messages.loading')}</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: colors.background }}>
                  <th 
                    className="text-left py-3 px-4 font-medium text-xs cursor-pointer hover:bg-opacity-5 hover:bg-gray-500"
                    style={{ color: colors.textSecondary }}
                    onClick={() => handleSort('closingTemplate')}
                  >
                    PROFILE
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-medium text-xs cursor-pointer hover:bg-opacity-5 hover:bg-gray-500"
                    style={{ color: colors.textSecondary }}
                    onClick={() => handleSort('closingTaskListInstance')}
                  >
                    INSTANCE
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-medium text-xs"
                    style={{ color: colors.textSecondary }}
                  >
                    NODE
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-medium text-xs cursor-pointer hover:bg-opacity-5 hover:bg-gray-500"
                    style={{ color: colors.textSecondary }}
                    onClick={() => handleSort('closingTask')}
                  >
                    ITEM
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-medium text-xs"
                    style={{ color: colors.textSecondary }}
                  >
                    TEXT
                  </th>
                  <th 
                    className="text-center py-3 px-4 font-medium text-xs cursor-pointer hover:bg-opacity-5 hover:bg-gray-500"
                    style={{ color: colors.textSecondary }}
                    onClick={() => handleSort('plannedStartDate')}
                  >
                    PLANNEDSTARTDATE
                  </th>
                  <th 
                    className="text-center py-3 px-4 font-medium text-xs cursor-pointer hover:bg-opacity-5 hover:bg-gray-500"
                    style={{ color: colors.textSecondary }}
                    onClick={() => handleSort('plannedEndDate')}
                  >
                    PLANNEDENDDATE
                  </th>
                  <th 
                    className="text-center py-3 px-4 font-medium text-xs"
                    style={{ color: colors.textSecondary }}
                  >
                    ACTLPLNSTRTTIMEDIFFINHOURS
                  </th>
                  <th 
                    className="text-center py-3 px-4 font-medium text-xs"
                    style={{ color: colors.textSecondary }}
                  >
                    ACTLPLNENDTIMEDIFFINHOURS
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-medium text-xs"
                    style={{ color: colors.textSecondary }}
                  >
                    STATUS
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task, index) => (
                  <motion.tr
                    key={`${task.closingTemplate}-${task.item}-${index}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.01 }}
                    className="border-t hover:bg-opacity-5 hover:bg-gray-500 transition-colors"
                    style={{ borderColor: colors.border }}
                  >
                    <td className="py-2 px-4 text-sm" style={{ color: colors.text }}>
                      {task.closingTemplate}
                    </td>
                    <td className="py-2 px-4 text-sm" style={{ color: colors.text }}>
                      {task.closingTaskListInstance}
                    </td>
                    <td className="py-2 px-4 text-sm" style={{ color: colors.text }}>
                      {task.node}
                    </td>
                    <td className="py-2 px-4 text-sm font-mono" style={{ color: colors.text }}>
                      {task.item}
                    </td>
                    <td className="py-2 px-4 text-sm" style={{ color: colors.text }}>
                      <div className="max-w-xs truncate" title={task.closingTaskName}>
                        {task.closingTaskName}
                      </div>
                    </td>
                    <td className="py-2 px-4 text-sm text-center" style={{ color: colors.text }}>
                      {task.plannedStartDate}
                    </td>
                    <td className="py-2 px-4 text-sm text-center" style={{ color: colors.text }}>
                      {task.plannedEndDate}
                    </td>
                    <td className="py-2 px-4 text-sm text-center" style={{ color: colors.text }}>
                      {task.actualPlnStartTimeDiffInHours > 0 ? (
                        <span style={{ color: colors.error }}>
                          {task.actualPlnStartTimeDiffInHours}
                        </span>
                      ) : (
                        <span>{task.actualPlnStartTimeDiffInHours}</span>
                      )}
                    </td>
                    <td className="py-2 px-4 text-sm text-center" style={{ color: colors.text }}>
                      {task.actualPlnEndTimeDiffInHours > 0 ? (
                        <span style={{ color: colors.error }}>
                          +{task.actualPlnEndTimeDiffInHours}
                        </span>
                      ) : task.actualPlnEndTimeDiffInHours < 0 ? (
                        <span style={{ color: colors.success }}>
                          {task.actualPlnEndTimeDiffInHours}
                        </span>
                      ) : (
                        <span>0</span>
                      )}
                    </td>
                    <td className="py-2 px-4 text-sm">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(task.statusId)}
                        <span style={{ color: colors.text }}>
                          {task.statusName}
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}