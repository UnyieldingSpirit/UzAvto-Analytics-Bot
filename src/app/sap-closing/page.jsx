// app/sap-closing/page.jsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Search,
  Loader2,
  Building2,
  User,
  CalendarDays,
  AlertTriangle,
  PlayCircle,
  CheckCircle2,
  XOctagon,
  PauseCircle,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Activity,
  Zap,
  Target,
  Award,
  Sparkles,
  BarChart3,
  PieChart,
  Users,
  Briefcase,
  Package,
  Cpu,
  DollarSign,
  ShoppingCart
} from 'lucide-react';

// Генератор данных
const generateMockTasks = () => {
  const departments = [
    { id: 'PROD', name: 'Производство', color: '#3b82f6', icon: <Cpu size={20} /> },
    { id: 'FIN', name: 'Финансы', color: '#10b981', icon: <DollarSign size={20} /> },
    { id: 'LOG', name: 'Логистика', color: '#f59e0b', icon: <Package size={20} /> },
    { id: 'IT', name: 'ИТ', color: '#8b5cf6', icon: <Cpu size={20} /> },
    { id: 'HR', name: 'Персонал', color: '#ec4899', icon: <Users size={20} /> },
    { id: 'SALES', name: 'Продажи', color: '#06b6d4', icon: <ShoppingCart size={20} /> }
  ];
  
  const taskTemplates = [
    'Закрытие главной книги',
    'Сверка банковских счетов',
    'Отражение движений материалов',
    'Обработка записей COGI',
    'Расчет амортизации',
    'Формирование баланса',
    'Инвентаризация склада',
    'Учет НЗП',
    'Закрытие производственных заказов',
    'Проверка дебиторской задолженности',
    'Учет курсовых разниц',
    'Начисление резервов',
    'Финансовая консолидация',
    'Сверка поставок',
    'Закрытие логистических операций',
    'Учет транспортных расходов',
    'Резервное копирование данных',
    'Закрытие системных периодов',
    'Архивирование логов',
    'Проверка целостности данных',
    'Обновление справочников',
    'Расчет заработной платы',
    'Начисление отпускных',
    'Учет больничных листов',
    'Формирование табеля',
    'Расчет налогов с ФОТ',
    'Закрытие договоров продаж',
    'Учет скидок и бонусов',
    'Формирование отчета о продажах',
    'Сверка с дилерами',
    'Расчет комиссионных'
  ];
  
  const executors = [
    { name: 'Иванов А.А.', avatar: '👨‍💼', rating: 4.8 },
    { name: 'Петрова М.С.', avatar: '👩‍💼', rating: 4.5 },
    { name: 'Сидоров В.П.', avatar: '👨‍🔧', rating: 4.2 },
    { name: 'Козлова Е.И.', avatar: '👩‍🔬', rating: 4.9 },
    { name: 'Николаев Д.К.', avatar: '👨‍💻', rating: 4.6 },
    { name: 'Смирнова О.В.', avatar: '👩‍🏫', rating: 4.7 },
    { name: 'Морозов С.А.', avatar: '👨‍🏭', rating: 4.3 },
    { name: 'Волкова Н.Д.', avatar: '👩‍💻', rating: 4.8 },
    { name: 'Кузнецов П.И.', avatar: '👨‍🎓', rating: 4.4 },
    { name: 'Лебедева А.С.', avatar: '👩‍🎨', rating: 4.9 }
  ];
  
  const tasks = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  // Генерируем задачи для каждого статуса
  const statusDistribution = {
    completed: 35,
    inProgress: 25,
    waiting: 20,
    problems: 20
  };
  
  let taskId = 1;
  
  // Генерируем выполненные задачи
  for (let i = 0; i < statusDistribution.completed; i++) {
    const dept = departments[Math.floor(Math.random() * departments.length)];
    const executor = executors[Math.floor(Math.random() * executors.length)];
    const plannedDays = 1 + Math.floor(Math.random() * 5);
    const actualDays = plannedDays + Math.floor((Math.random() - 0.5) * 2);
    const priority = Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low';
    
    tasks.push({
      id: `TASK-${String(taskId++).padStart(4, '0')}`,
      name: taskTemplates[Math.floor(Math.random() * taskTemplates.length)],
      department: dept.name,
      departmentId: dept.id,
      departmentColor: dept.color,
      departmentIcon: dept.icon,
      executor: executor.name,
      executorAvatar: executor.avatar,
      executorRating: executor.rating,
      plannedStart: `01.${String(currentMonth).padStart(2, '0')}.${currentYear}`,
      plannedEnd: `${String(plannedDays).padStart(2, '0')}.${String(currentMonth).padStart(2, '0')}.${currentYear}`,
      actualStart: `01.${String(currentMonth).padStart(2, '0')}.${currentYear}`,
      actualEnd: `${String(actualDays).padStart(2, '0')}.${String(currentMonth).padStart(2, '0')}.${currentYear}`,
      status: 'completed',
      statusName: 'Выполнено',
      progress: 100,
      deviation: (actualDays - plannedDays) * 24,
      completedDate: `${String(actualDays).padStart(2, '0')}.${String(currentMonth).padStart(2, '0')}.${currentYear} ${8 + Math.floor(Math.random() * 10)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
      priority,
      duration: plannedDays * 24
    });
  }
  
  // Генерируем задачи в процессе
  for (let i = 0; i < statusDistribution.inProgress; i++) {
    const dept = departments[Math.floor(Math.random() * departments.length)];
    const executor = executors[Math.floor(Math.random() * executors.length)];
    const progress = 20 + Math.floor(Math.random() * 70);
    const plannedDays = 3 + Math.floor(Math.random() * 7);
    const priority = Math.random() > 0.8 ? 'critical' : Math.random() > 0.5 ? 'high' : 'medium';
    
    tasks.push({
      id: `TASK-${String(taskId++).padStart(4, '0')}`,
      name: taskTemplates[Math.floor(Math.random() * taskTemplates.length)],
      department: dept.name,
      departmentId: dept.id,
      departmentColor: dept.color,
      departmentIcon: dept.icon,
      executor: executor.name,
      executorAvatar: executor.avatar,
      executorRating: executor.rating,
      plannedStart: `01.${String(currentMonth).padStart(2, '0')}.${currentYear}`,
      plannedEnd: `${String(plannedDays).padStart(2, '0')}.${String(currentMonth).padStart(2, '0')}.${currentYear}`,
      actualStart: `01.${String(currentMonth).padStart(2, '0')}.${currentYear}`,
      actualEnd: '',
      status: 'inProgress',
      statusName: 'В процессе',
      progress,
      deviation: 0,
      startedBy: executors[Math.floor(Math.random() * executors.length)].name,
      estimatedCompletion: `${String(plannedDays + 1).padStart(2, '0')}.${String(currentMonth).padStart(2, '0')}.${currentYear}`,
      priority,
      duration: plannedDays * 24,
      velocity: progress > 50 ? 'fast' : progress > 30 ? 'normal' : 'slow'
    });
  }
  
  // Генерируем задачи в ожидании
  for (let i = 0; i < statusDistribution.waiting; i++) {
    const dept = departments[Math.floor(Math.random() * departments.length)];
    const executor = executors[Math.floor(Math.random() * executors.length)];
    const plannedDays = 5 + Math.floor(Math.random() * 10);
    const waitingReasons = [
      'Ожидает завершения предыдущей задачи',
      'Ожидает данные от другого отдела',
      'Ожидает утверждения руководства',
      'Ожидает системные ресурсы',
      'Ожидает внешние данные'
    ];
    const priority = Math.random() > 0.6 ? 'high' : 'medium';
    
    tasks.push({
      id: `TASK-${String(taskId++).padStart(4, '0')}`,
      name: taskTemplates[Math.floor(Math.random() * taskTemplates.length)],
      department: dept.name,
      departmentId: dept.id,
      departmentColor: dept.color,
      departmentIcon: dept.icon,
      executor: executor.name,
      executorAvatar: executor.avatar,
      executorRating: executor.rating,
      plannedStart: `${String(plannedDays - 2).padStart(2, '0')}.${String(currentMonth).padStart(2, '0')}.${currentYear}`,
      plannedEnd: `${String(plannedDays).padStart(2, '0')}.${String(currentMonth).padStart(2, '0')}.${currentYear}`,
      actualStart: '',
      actualEnd: '',
      status: 'waiting',
      statusName: 'Ожидание',
      progress: 0,
      deviation: 0,
      waitingReason: waitingReasons[Math.floor(Math.random() * waitingReasons.length)],
      blockedSince: `${String(plannedDays - 3).padStart(2, '0')}.${String(currentMonth).padStart(2, '0')}.${currentYear}`,
      priority,
      duration: plannedDays * 24,
      waitingDays: 3 + Math.floor(Math.random() * 5)
    });
  }
  
  // Генерируем задачи с проблемами
  for (let i = 0; i < statusDistribution.problems; i++) {
    const dept = departments[Math.floor(Math.random() * departments.length)];
    const executor = executors[Math.floor(Math.random() * executors.length)];
    const plannedDays = 2 + Math.floor(Math.random() * 5);
    const problemTypes = [
      { type: 'error', name: 'Ошибка выполнения', description: 'Ошибка при обработке данных', severity: 'high' },
      { type: 'blocked', name: 'Заблокировано', description: 'Процесс заблокирован системой', severity: 'medium' },
      { type: 'failed', name: 'Не выполнено', description: 'Задача завершилась с ошибкой', severity: 'critical' },
      { type: 'timeout', name: 'Превышен лимит времени', description: 'Задача выполнялась слишком долго', severity: 'medium' }
    ];
    
    const problem = problemTypes[Math.floor(Math.random() * problemTypes.length)];
    const priority = problem.severity === 'critical' ? 'critical' : 'high';
    
    tasks.push({
      id: `TASK-${String(taskId++).padStart(4, '0')}`,
      name: taskTemplates[Math.floor(Math.random() * taskTemplates.length)],
      department: dept.name,
      departmentId: dept.id,
      departmentColor: dept.color,
      departmentIcon: dept.icon,
      executor: executor.name,
      executorAvatar: executor.avatar,
      executorRating: executor.rating,
      plannedStart: `01.${String(currentMonth).padStart(2, '0')}.${currentYear}`,
      plannedEnd: `${String(plannedDays).padStart(2, '0')}.${String(currentMonth).padStart(2, '0')}.${currentYear}`,
      actualStart: `01.${String(currentMonth).padStart(2, '0')}.${currentYear}`,
      actualEnd: '',
      status: 'problems',
      statusName: problem.name,
      progress: 10 + Math.floor(Math.random() * 40),
      deviation: plannedDays * 24,
      problemType: problem.type,
      problemDescription: problem.description,
      problemSeverity: problem.severity,
      failedAt: `${String(plannedDays).padStart(2, '0')}.${String(currentMonth).padStart(2, '0')}.${currentYear} ${Math.floor(Math.random() * 24)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
      priority,
      duration: plannedDays * 24,
      attempts: 1 + Math.floor(Math.random() * 3)
    });
  }
  
  return tasks;
};

export default function SAPClosingPage() {
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('completed');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [showStats, setShowStats] = useState(true);
  
  const chartRef = useRef(null);
  const pieChartRef = useRef(null);
  const progressChartRef = useRef(null);
  
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
    primary: '#6366f1',
    purple: '#8b5cf6',
    pink: '#ec4899',
    cyan: '#06b6d4'
  };
  
  // Конфигурация табов с анимированными иконками
  const tabs = [
    {
      id: 'completed',
      name: 'Выполнено',
      icon: <CheckCircle2 size={20} />,
      color: colors.success,
      description: 'Успешно завершенные задачи',
      bgGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    },
    {
      id: 'inProgress',
      name: 'В процессе',
      icon: <Timer size={20} />,
      color: colors.info,
      description: 'Задачи в работе',
      bgGradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
    },
    {
      id: 'waiting',
      name: 'Ожидание',
      icon: <PauseCircle size={20} />,
      color: colors.warning,
      description: 'Задачи, ожидающие действий',
      bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    },
    {
      id: 'problems',
      name: 'Проблемы',
      icon: <XOctagon size={20} />,
      color: colors.error,
      description: 'Задачи с ошибками',
      bgGradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
    }
  ];
  
  // Загрузка данных
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const mockData = generateMockTasks();
        setTasks(mockData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Фильтрация задач
  const getFilteredTasks = () => {
    let filtered = tasks.filter(task => {
      if (activeTab === 'completed') return task.status === 'completed';
      if (activeTab === 'inProgress') return task.status === 'inProgress';
      if (activeTab === 'waiting') return task.status === 'waiting';
      if (activeTab === 'problems') return task.status === 'problems';
      return true;
    });
    
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(task => task.departmentId === selectedDepartment);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.name.toLowerCase().includes(query) ||
        task.executor.toLowerCase().includes(query) ||
        task.department.toLowerCase().includes(query)
      );
    }
    
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return filtered;
  };
  
  const filteredTasks = getFilteredTasks();
  
  // Сортировка
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  // Статистика
  const statistics = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'inProgress').length,
    waiting: tasks.filter(t => t.status === 'waiting').length,
    problems: tasks.filter(t => t.status === 'problems').length,
    completionRate: tasks.length > 0 ? (tasks.filter(t => t.status === 'completed').length / tasks.length * 100).toFixed(1) : 0,
    avgDeviation: tasks.filter(t => t.deviation).reduce((sum, t) => sum + Math.abs(t.deviation), 0) / tasks.filter(t => t.deviation).length || 0,
    criticalTasks: tasks.filter(t => t.priority === 'critical').length,
    performanceScore: tasks.length > 0 ? 
      ((tasks.filter(t => t.status === 'completed' && t.deviation <= 0).length / tasks.length) * 100).toFixed(1) : 0
  };
  
  // Отрисовка графиков
  useEffect(() => {
    if (!isLoading && tasks.length > 0) {
      renderProgressChart();
      renderPieChart();
      renderBarChart();
    }
  }, [tasks, isDark, currentLocale, activeTab]);
  
  // График прогресса по департаментам
  const renderProgressChart = () => {
    if (!progressChartRef.current) return;
    
    const container = d3.select(progressChartRef.current);
    container.selectAll('*').remove();
    
    const width = progressChartRef.current.clientWidth;
    const height = 250;
    
    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height);
    
    // Данные по департаментам
    const departments = [...new Set(tasks.map(t => t.department))];
    const data = departments.map(dept => {
      const deptTasks = tasks.filter(t => t.department === dept);
      const completed = deptTasks.filter(t => t.status === 'completed').length;
      const total = deptTasks.length;
      const progress = total > 0 ? (completed / total * 100) : 0;
      
      return {
        department: dept,
        progress,
        completed,
        total,
        color: tasks.find(t => t.department === dept)?.departmentColor || colors.primary
      };
    }).sort((a, b) => b.progress - a.progress);
    
    const margin = { top: 20, right: 30, bottom: 40, left: 120 };
    
    const xScale = d3.scaleLinear()
      .domain([0, 100])
      .range([margin.left, width - margin.right]);
    
    const yScale = d3.scaleBand()
      .domain(data.map(d => d.department))
      .range([margin.top, height - margin.bottom])
      .padding(0.3);
    
    // Фоновые линии
    svg.append('g')
      .selectAll('line')
      .data([25, 50, 75, 100])
      .enter()
      .append('line')
      .attr('x1', d => xScale(d))
      .attr('x2', d => xScale(d))
      .attr('y1', margin.top)
      .attr('y2', height - margin.bottom)
      .style('stroke', colors.border)
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0.5);
    
    // Прогресс бары
    const bars = svg.selectAll('.progress-bar')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'progress-bar');
    
    // Фоновый бар
    bars.append('rect')
      .attr('x', margin.left)
      .attr('y', d => yScale(d.department))
      .attr('width', width - margin.left - margin.right)
      .attr('height', yScale.bandwidth())
      .attr('fill', colors.border)
      .attr('opacity', 0.2)
      .attr('rx', yScale.bandwidth() / 2);
    
    // Прогресс
    bars.append('rect')
      .attr('x', margin.left)
      .attr('y', d => yScale(d.department))
      .attr('width', 0)
      .attr('height', yScale.bandwidth())
      .attr('fill', d => d.color)
      .attr('rx', yScale.bandwidth() / 2)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 100)
      .attr('width', d => xScale(d.progress) - margin.left);
    
    // Департаменты
    bars.append('text')
      .attr('x', margin.left - 10)
      .attr('y', d => yScale(d.department) + yScale.bandwidth() / 2)
      .attr('text-anchor', 'end')
      .attr('alignment-baseline', 'middle')
      .style('fill', colors.text)
      .style('font-size', '14px')
      .style('font-weight', '500')
      .text(d => d.department);
    
    // Значения
    bars.append('text')
      .attr('x', d => xScale(d.progress) + 5)
      .attr('y', d => yScale(d.department) + yScale.bandwidth() / 2)
      .attr('alignment-baseline', 'middle')
      .style('fill', colors.text)
      .style('font-size', '12px')
      .style('font-weight', '600')
      .style('opacity', 0)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 100 + 500)
      .style('opacity', 1)
      .text(d => `${d.progress.toFixed(0)}% (${d.completed}/${d.total})`);
  };
  
  // Круговая диаграмма
  const renderPieChart = () => {
    if (!pieChartRef.current) return;
    
    const container = d3.select(pieChartRef.current);
    container.selectAll('*').remove();
    
    const width = pieChartRef.current.clientWidth;
    const height = 250;
    const radius = Math.min(width, height) / 2 - 40;
    
    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height);
    
    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);
    
    const data = tabs.map(tab => ({
      name: tab.name,
      value: statistics[tab.id],
      color: tab.color
    }));
    
    const pie = d3.pie()
      .value(d => d.value)
      .sort(null);
    
    const arc = d3.arc()
      .innerRadius(radius * 0.6)
      .outerRadius(radius);
    
    const arcs = g.selectAll('.arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc');
    
    arcs.append('path')
      .attr('d', arc)
      .style('fill', d => d.data.color)
      .style('opacity', 0.8)
      .style('stroke', colors.cardBg)
      .style('stroke-width', 2)
      .transition()
      .duration(1000)
      .attrTween('d', function(d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function(t) {
          return arc(interpolate(t));
        };
      });
    
    // Центральная информация
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.5em')
      .style('font-size', '32px')
      .style('font-weight', 'bold')
      .style('fill', colors.text)
      .text(statistics.total);
    
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.5em')
      .style('font-size', '14px')
      .style('fill', colors.textSecondary)
      .text('Всего задач');
    
    // Процент выполнения
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '3.5em')
      .style('font-size', '18px')
      .style('font-weight', '600')
      .style('fill', colors.success)
      .text(`${statistics.completionRate}%`);
  };
  
  // Столбчатая диаграмма
  const renderBarChart = () => {
    if (!chartRef.current) return;
    
    const container = d3.select(chartRef.current);
    container.selectAll('*').remove();
    
    const width = chartRef.current.clientWidth;
    const height = 300;
    const margin = { top: 40, right: 30, bottom: 60, left: 60 };
    
    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height);
    
    // Заголовок
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', '600')
      .style('fill', colors.text)
      .text('Эффективность выполнения по приоритетам');
    
    // Данные по приоритетам
    const priorities = ['low', 'medium', 'high', 'critical'];
    const priorityNames = {
      low: 'Низкий',
      medium: 'Средний',
      high: 'Высокий',
      critical: 'Критический'
    };
    
    const data = priorities.map(priority => {
      const priorityTasks = tasks.filter(t => t.priority === priority);
      const completed = priorityTasks.filter(t => t.status === 'completed').length;
      const onTime = priorityTasks.filter(t => t.status === 'completed' && t.deviation <= 0).length;
      
      return {
        priority: priorityNames[priority],
        total: priorityTasks.length,
        completed,
        onTime,
        delayed: completed - onTime,
        completionRate: priorityTasks.length > 0 ? (completed / priorityTasks.length * 100) : 0
      };
    });
    
    const xScale = d3.scaleBand()
      .domain(data.map(d => d.priority))
      .range([margin.left, width - margin.right])
      .padding(0.3);
    
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.total)])
      .nice()
      .range([height - margin.bottom, margin.top]);
    
    // Оси
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale))
      .style('color', colors.textSecondary);
    
    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale))
      .style('color', colors.textSecondary);
    
    // Группы столбцов
    const barGroups = svg.selectAll('.bar-group')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'bar-group');
    
    // Общее количество
    barGroups.append('rect')
      .attr('x', d => xScale(d.priority))
      .attr('y', height - margin.bottom)
      .attr('width', xScale.bandwidth())
      .attr('height', 0)
      .attr('fill', colors.border)
      .attr('opacity', 0.3)
      .attr('rx', 4)
      .transition()
      .duration(800)
      .attr('y', d => yScale(d.total))
      .attr('height', d => height - margin.bottom - yScale(d.total));
    
    // Выполненные вовремя
    barGroups.append('rect')
      .attr('x', d => xScale(d.priority))
      .attr('y', height - margin.bottom)
      .attr('width', xScale.bandwidth())
      .attr('height', 0)
      .attr('fill', colors.success)
      .attr('opacity', 0.8)
      .attr('rx', 4)
      .transition()
      .duration(800)
      .delay(200)
      .attr('y', d => yScale(d.onTime))
      .attr('height', d => height - margin.bottom - yScale(d.onTime));
    
    // Выполненные с задержкой
    barGroups.append('rect')
      .attr('x', d => xScale(d.priority))
      .attr('y', height - margin.bottom)
      .attr('width', xScale.bandwidth())
      .attr('height', 0)
      .attr('fill', colors.warning)
      .attr('opacity', 0.8)
      .attr('rx', 4)
      .transition()
      .duration(800)
      .delay(400)
      .attr('y', d => yScale(d.onTime + d.delayed))
      .attr('height', d => height - margin.bottom - yScale(d.delayed));
    
    // Значения
    barGroups.append('text')
      .attr('x', d => xScale(d.priority) + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.total) - 5)
      .attr('text-anchor', 'middle')
      .style('fill', colors.text)
      .style('font-size', '14px')
      .style('font-weight', '600')
      .style('opacity', 0)
      .transition()
      .duration(800)
      .delay(600)
      .style('opacity', 1)
      .text(d => d.total);
    
    // Процент выполнения
    barGroups.append('text')
      .attr('x', d => xScale(d.priority) + xScale.bandwidth() / 2)
      .attr('y', height - margin.bottom + 20)
      .attr('text-anchor', 'middle')
      .style('fill', colors.success)
      .style('font-size', '12px')
      .style('font-weight', '600')
      .style('opacity', 0)
      .transition()
      .duration(800)
      .delay(800)
      .style('opacity', 1)
      .text(d => `${d.completionRate.toFixed(0)}%`);
  };
  
  // Получение приоритета
  const getPriorityBadge = (priority) => {
    const config = {
      critical: { color: colors.error, icon: <Zap size={12} />, text: 'Критический' },
      high: { color: colors.warning, icon: <AlertTriangle size={12} />, text: 'Высокий' },
      medium: { color: colors.info, icon: <Activity size={12} />, text: 'Средний' },
      low: { color: colors.textSecondary, icon: <Target size={12} />, text: 'Низкий' }
    };
    
    const { color, icon, text } = config[priority] || config.medium;
    
    return (
      <span 
        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
        style={{
          backgroundColor: color + '20',
          color: color
        }}
      >
        {icon}
        {text}
      </span>
    );
  };
  
  // Получение индикатора скорости
  const getVelocityIndicator = (velocity) => {
    if (velocity === 'fast') {
      return <TrendingUp size={14} style={{ color: colors.success }} />;
    } else if (velocity === 'slow') {
      return <TrendingDown size={14} style={{ color: colors.error }} />;
    }
    return <Activity size={14} style={{ color: colors.info }} />;
  };
  
  // Получение уникальных департаментов
  const departments = [...new Set(tasks.map(t => ({ 
    id: t.departmentId, 
    name: t.department, 
    color: t.departmentColor,
    icon: t.departmentIcon 
  })))]
    .filter((dept, index, self) => self.findIndex(d => d.id === dept.id) === index);
  
  // Рендер таблицы для каждого таба
  const renderTable = () => {
    if (activeTab === 'completed') {
      return (
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
              <th className="text-left py-3 px-4 font-medium cursor-pointer hover:bg-opacity-5 hover:bg-gray-500"
                  style={{ color: colors.textSecondary }}
                  onClick={() => handleSort('id')}>
                <div className="flex items-center gap-2">
                  ID
                  <ArrowUpDown size={14} />
                </div>
              </th>
              <th className="text-left py-3 px-4 font-medium cursor-pointer hover:bg-opacity-5 hover:bg-gray-500"
                  style={{ color: colors.textSecondary }}
                  onClick={() => handleSort('name')}>
                <div className="flex items-center gap-2">
                  Задача
                  <ArrowUpDown size={14} />
                </div>
              </th>
              <th className="text-left py-3 px-4 font-medium"
                  style={{ color: colors.textSecondary }}>
                Отдел
              </th>
              <th className="text-left py-3 px-4 font-medium"
                  style={{ color: colors.textSecondary }}>
                Исполнитель
              </th>
              <th className="text-center py-3 px-4 font-medium"
                  style={{ color: colors.textSecondary }}>
                Приоритет
              </th>
              <th className="text-center py-3 px-4 font-medium"
                  style={{ color: colors.textSecondary }}>
                Завершено
              </th>
              <th className="text-center py-3 px-4 font-medium"
                  style={{ color: colors.textSecondary }}>
                Результат
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task, index) => (
              <motion.tr
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                className="border-t hover:bg-opacity-5 hover:bg-gray-500 transition-colors"
                style={{ borderColor: colors.border }}
              >
                <td className="py-3 px-4">
                  <span className="font-mono text-sm" style={{ color: colors.text }}>
                    {task.id}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium" style={{ color: colors.text }}>
                      {task.name}
                    </p>
                    <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                      План: {task.plannedStart} - {task.plannedEnd} ({task.duration}ч)
                    </p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div style={{ color: task.departmentColor }}>
                      {task.departmentIcon}
                    </div>
                    <span style={{ color: colors.text }}>{task.department}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{task.executorAvatar}</span>
                    <div>
                      <p style={{ color: colors.text }}>{task.executor}</p>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Award 
                            key={i} 
                            size={10} 
                            style={{ 
                              color: i < Math.floor(task.executorRating) ? colors.warning : colors.border,
                              fill: i < Math.floor(task.executorRating) ? colors.warning : 'none'
                            }} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  {getPriorityBadge(task.priority)}
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle size={16} style={{ color: colors.success }} />
                    <span className="text-sm" style={{ color: colors.text }}>
                      {task.completedDate}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  {task.deviation <= 0 ? (
                    <div className="flex items-center justify-center gap-1">
                      <Sparkles size={16} style={{ color: colors.success }} />
                      <span className="text-sm font-medium" style={{ color: colors.success }}>
                        Вовремя
                      </span>
                    </div>
                  ) : (
                    <span 
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: colors.warning + '20',
                        color: colors.warning
                      }}
                    >
                      <Clock size={12} />
                      +{task.deviation}ч
                    </span>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      );
    }
    
    if (activeTab === 'inProgress') {
      return (
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
              <th className="text-left py-3 px-4 font-medium" style={{ color: colors.textSecondary }}>ID</th>
              <th className="text-left py-3 px-4 font-medium" style={{ color: colors.textSecondary }}>Задача</th>
              <th className="text-left py-3 px-4 font-medium" style={{ color: colors.textSecondary }}>Отдел</th>
              <th className="text-left py-3 px-4 font-medium" style={{ color: colors.textSecondary }}>Исполнитель</th>
              <th className="text-center py-3 px-4 font-medium" style={{ color: colors.textSecondary }}>Приоритет</th>
              <th className="text-center py-3 px-4 font-medium" style={{ color: colors.textSecondary }}>Прогресс</th>
              <th className="text-center py-3 px-4 font-medium" style={{ color: colors.textSecondary }}>Скорость</th>
              <th className="text-center py-3 px-4 font-medium" style={{ color: colors.textSecondary }}>Прогноз</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task, index) => (
              <motion.tr
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                className="border-t hover:bg-opacity-5 hover:bg-gray-500 transition-colors"
                style={{ borderColor: colors.border }}
              >
                <td className="py-3 px-4">
                  <span className="font-mono text-sm" style={{ color: colors.text }}>{task.id}</span>
                </td>
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium" style={{ color: colors.text }}>{task.name}</p>
                    <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                      Начато: {task.actualStart} | Инициатор: {task.startedBy}
                    </p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div style={{ color: task.departmentColor }}>
                      {task.departmentIcon}
                    </div>
                    <span style={{ color: colors.text }}>{task.department}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{task.executorAvatar}</span>
                    <div>
                      <p style={{ color: colors.text }}>{task.executor}</p>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Award 
                            key={i} 
                            size={10} 
                            style={{ 
                              color: i < Math.floor(task.executorRating) ? colors.warning : colors.border,
                              fill: i < Math.floor(task.executorRating) ? colors.warning : 'none'
                            }} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  {getPriorityBadge(task.priority)}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="relative w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.border }}>
                        <motion.div 
                          className="absolute top-0 left-0 h-full rounded-full"
                          style={{ 
                            background: `linear-gradient(90deg, ${colors.info} 0%, ${colors.cyan} 100%)`,
                            boxShadow: `0 0 10px ${colors.info}40`
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${task.progress}%` }}
                          transition={{ duration: 1, delay: index * 0.05 }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium min-w-[40px] text-right" style={{ color: colors.text }}>
                      {task.progress}%
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {getVelocityIndicator(task.velocity)}
                    <span className="text-sm" style={{ color: colors.textSecondary }}>
                      {task.velocity === 'fast' ? 'Быстро' : 
                       task.velocity === 'slow' ? 'Медленно' : 'Нормально'}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <CalendarDays size={16} style={{ color: colors.textSecondary }} />
                    <span className="text-sm" style={{ color: colors.text }}>
                      {task.estimatedCompletion}
                    </span>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      );
    }
    
    if (activeTab === 'waiting') {
      return (
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
              <th className="text-left py-3 px-4 font-medium" style={{ color: colors.textSecondary }}>ID</th>
              <th className="text-left py-3 px-4 font-medium" style={{ color: colors.textSecondary }}>Задача</th>
              <th className="text-left py-3 px-4 font-medium" style={{ color: colors.textSecondary }}>Отдел</th>
              <th className="text-left py-3 px-4 font-medium" style={{ color: colors.textSecondary }}>Ответственный</th>
              <th className="text-center py-3 px-4 font-medium" style={{ color: colors.textSecondary }}>Приоритет</th>
              <th className="text-left py-3 px-4 font-medium" style={{ color: colors.textSecondary }}>Причина ожидания</th>
              <th className="text-center py-3 px-4 font-medium" style={{ color: colors.textSecondary }}>Время ожидания</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task, index) => (
              <motion.tr
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                className="border-t hover:bg-opacity-5 hover:bg-gray-500 transition-colors"
                style={{ borderColor: colors.border }}
              >
                <td className="py-3 px-4">
                  <span className="font-mono text-sm" style={{ color: colors.text }}>{task.id}</span>
                </td>
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium" style={{ color: colors.text }}>{task.name}</p>
                    <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                      План: {task.plannedStart} - {task.plannedEnd}
                    </p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div style={{ color: task.departmentColor }}>
                      {task.departmentIcon}
                    </div>
                    <span style={{ color: colors.text }}>{task.department}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{task.executorAvatar}</span>
                    <span style={{ color: colors.text }}>{task.executor}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  {getPriorityBadge(task.priority)}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <PauseCircle size={16} style={{ color: colors.warning }} />
                    <span style={{ color: colors.text }}>{task.waitingReason}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <div 
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium"
                    style={{
                      backgroundColor: colors.warning + '10',
                      border: `1px solid ${colors.warning}30`,
                      color: colors.warning
                    }}
                  >
                    <Clock size={14} />
                    {task.waitingDays} дн. с {task.blockedSince}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      );
    }
    
    if (activeTab === 'problems') {
      return (
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
              <th className="text-left py-3 px-4 font-medium" style={{ color: colors.textSecondary }}>ID</th>
              <th className="text-left py-3 px-4 font-medium" style={{ color: colors.textSecondary }}>Задача</th>
              <th className="text-left py-3 px-4 font-medium" style={{ color: colors.textSecondary }}>Отдел</th>
              <th className="text-left py-3 px-4 font-medium" style={{ color: colors.textSecondary }}>Исполнитель</th>
              <th className="text-center py-3 px-4 font-medium" style={{ color: colors.textSecondary }}>Критичность</th>
              <th className="text-left py-3 px-4 font-medium" style={{ color: colors.textSecondary }}>Проблема</th>
              <th className="text-center py-3 px-4 font-medium" style={{ color: colors.textSecondary }}>Попытки</th>
              <th className="text-center py-3 px-4 font-medium" style={{ color: colors.textSecondary }}>Время сбоя</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task, index) => (
              <motion.tr
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                className="border-t hover:bg-opacity-5 hover:bg-gray-500 transition-colors"
                style={{ borderColor: colors.border }}
              >
                <td className="py-3 px-4">
                  <span className="font-mono text-sm" style={{ color: colors.text }}>{task.id}</span>
                </td>
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium" style={{ color: colors.text }}>{task.name}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1">
                        <div className="w-full h-1 rounded-full overflow-hidden bg-gray-200" style={{ width: '60px' }}>
                          <div 
                            className="h-full"
                            style={{ 
                              width: `${task.progress}%`,
                              backgroundColor: colors.error
                            }}
                          />
                        </div>
                        <span className="text-xs" style={{ color: colors.textSecondary }}>{task.progress}%</span>
                      </div>
                      <span className="text-xs" style={{ color: colors.textSecondary }}>
                        План: {task.plannedEnd}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div style={{ color: task.departmentColor }}>
                      {task.departmentIcon}
                    </div>
                    <span style={{ color: colors.text }}>{task.department}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{task.executorAvatar}</span>
                    <span style={{ color: colors.text }}>{task.executor}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <span 
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: task.problemSeverity === 'critical' ? colors.error + '20' :
                                     task.problemSeverity === 'high' ? colors.warning + '20' :
                                     colors.info + '20',
                      color: task.problemSeverity === 'critical' ? colors.error :
                             task.problemSeverity === 'high' ? colors.warning :
                             colors.info
                    }}
                  >
                    {task.problemSeverity === 'critical' && <AlertTriangle size={12} />}
                    {task.problemSeverity === 'critical' ? 'Критическая' :
                     task.problemSeverity === 'high' ? 'Высокая' : 'Средняя'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {task.problemType === 'error' && <XCircle size={16} style={{ color: colors.error }} />}
                      {task.problemType === 'blocked' && <AlertTriangle size={16} style={{ color: colors.warning }} />}
                      {task.problemType === 'failed' && <XOctagon size={16} style={{ color: colors.error }} />}
                      {task.problemType === 'timeout' && <Clock size={16} style={{ color: colors.warning }} />}
                      <span className="font-medium" style={{ color: colors.text }}>{task.statusName}</span>
                    </div>
                    <p className="text-xs" style={{ color: colors.textSecondary }}>{task.problemDescription}</p>
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {Array.from({ length: task.attempts }, (_, i) => (
                      <div 
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: colors.error }}
                      />
                    ))}
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <span 
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
                    style={{
                      backgroundColor: colors.error + '10',
                      border: `1px solid ${colors.error}30`,
                      color: colors.error
                    }}
                  >
                    <AlertCircle size={12} />
                    {task.failedAt}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      );
    }
  };
  
  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.background }}>
      {/* Заголовок с анимацией */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2 flex items-center gap-3" style={{ color: colors.text }}>
              {t('title')}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Activity size={24} style={{ color: colors.primary }} />
              </motion.div>
            </h1>
    <p className="text-sm" style={{ color: colors.textSecondary }}>
             Мониторинг выполнения задач закрытия периода • {new Date().toLocaleDateString(currentLocale)}
           </p>
         </div>
         
         <motion.button
           whileHover={{ scale: 1.05 }}
           whileTap={{ scale: 0.95 }}
           onClick={() => setShowStats(!showStats)}
           className="px-4 py-2 rounded-lg flex items-center gap-2"
           style={{ 
             backgroundColor: colors.cardBg,
             border: `1px solid ${colors.border}`,
             color: colors.text
           }}
         >
           <BarChart3 size={16} />
           {showStats ? 'Скрыть статистику' : 'Показать статистику'}
         </motion.button>
       </div>
     </motion.div>
     
     {/* Метрики производительности */}
     <AnimatePresence>
       {showStats && (
         <motion.div
           initial={{ opacity: 0, height: 0 }}
           animate={{ opacity: 1, height: 'auto' }}
           exit={{ opacity: 0, height: 0 }}
           className="mb-6 overflow-hidden"
         >
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
             <motion.div
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="p-4 rounded-xl relative overflow-hidden"
               style={{ 
                 background: `linear-gradient(135deg, ${colors.primary}20 0%, ${colors.primary}10 100%)`,
                 border: `1px solid ${colors.primary}30`
               }}
             >
               <div className="relative z-10">
                 <div className="flex items-center justify-between mb-2">
                   <Target size={20} style={{ color: colors.primary }} />
                   <span className="text-2xl font-bold" style={{ color: colors.text }}>
                     {statistics.completionRate}%
                   </span>
                 </div>
                 <p className="text-sm font-medium" style={{ color: colors.text }}>
                   Выполнение плана
                 </p>
                 <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                   {statistics.completed} из {statistics.total}
                 </p>
               </div>
               <motion.div
                 className="absolute bottom-0 left-0 right-0 h-1"
                 style={{ backgroundColor: colors.primary }}
                 initial={{ width: 0 }}
                 animate={{ width: `${statistics.completionRate}%` }}
                 transition={{ duration: 1, delay: 0.5 }}
               />
             </motion.div>
             
             <motion.div
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.1 }}
               className="p-4 rounded-xl"
               style={{ 
                 background: `linear-gradient(135deg, ${colors.success}20 0%, ${colors.success}10 100%)`,
                 border: `1px solid ${colors.success}30`
               }}
             >
               <div className="flex items-center justify-between mb-2">
                 <Zap size={20} style={{ color: colors.success }} />
                 <span className="text-2xl font-bold" style={{ color: colors.text }}>
                   {statistics.performanceScore}%
                 </span>
               </div>
               <p className="text-sm font-medium" style={{ color: colors.text }}>
                 Эффективность
               </p>
               <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                 Задачи без отклонений
               </p>
             </motion.div>
             
             <motion.div
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.2 }}
               className="p-4 rounded-xl"
               style={{ 
                 background: `linear-gradient(135deg, ${colors.warning}20 0%, ${colors.warning}10 100%)`,
                 border: `1px solid ${colors.warning}30`
               }}
             >
               <div className="flex items-center justify-between mb-2">
                 <Clock size={20} style={{ color: colors.warning }} />
                 <span className="text-2xl font-bold" style={{ color: colors.text }}>
                   {Math.round(statistics.avgDeviation)}ч
                 </span>
               </div>
               <p className="text-sm font-medium" style={{ color: colors.text }}>
                 Среднее отклонение
               </p>
               <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                 По всем задачам
               </p>
             </motion.div>
             
             <motion.div
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.3 }}
               className="p-4 rounded-xl"
               style={{ 
                 background: `linear-gradient(135deg, ${colors.error}20 0%, ${colors.error}10 100%)`,
                 border: `1px solid ${colors.error}30`
               }}
             >
               <div className="flex items-center justify-between mb-2">
                 <AlertTriangle size={20} style={{ color: colors.error }} />
                 <span className="text-2xl font-bold" style={{ color: colors.text }}>
                   {statistics.criticalTasks}
                 </span>
               </div>
               <p className="text-sm font-medium" style={{ color: colors.text }}>
                 Критические задачи
               </p>
               <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                 Требуют внимания
               </p>
             </motion.div>
           </div>
           
           {/* Графики */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.4 }}
               className="p-6 rounded-xl"
               style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}
             >
               <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
                 Прогресс по департаментам
               </h3>
               <div ref={progressChartRef} style={{ width: '100%', height: '250px' }} />
             </motion.div>
             
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.5 }}
               className="p-6 rounded-xl"
               style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}
             >
               <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
                 Распределение задач
               </h3>
               <div ref={pieChartRef} style={{ width: '100%', height: '250px' }} />
             </motion.div>
             
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.6 }}
               className="p-6 rounded-xl"
               style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}
             >
               <div ref={chartRef} style={{ width: '100%', height: '300px' }} />
             </motion.div>
           </div>
         </motion.div>
       )}
     </AnimatePresence>
     
     {/* Статусные карточки */}
     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
       {tabs.map((tab, index) => (
         <motion.div
           key={tab.id}
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: index * 0.1 }}
           whileHover={{ 
             scale: 1.02,
             boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.3)' : '0 10px 30px rgba(0,0,0,0.1)'
           }}
           whileTap={{ scale: 0.98 }}
           className="relative cursor-pointer overflow-hidden rounded-xl"
           style={{ 
             background: activeTab === tab.id ? tab.bgGradient : colors.cardBg,
             border: `2px solid ${activeTab === tab.id ? tab.color : colors.border}`
           }}
           onClick={() => setActiveTab(tab.id)}
         >
           {/* Фоновая анимация */}
           {activeTab === tab.id && (
             <motion.div
               className="absolute inset-0"
               initial={{ opacity: 0 }}
               animate={{ opacity: 0.1 }}
               style={{
                 background: `radial-gradient(circle at 50% 50%, ${tab.color} 0%, transparent 70%)`
               }}
             />
           )}
           
           <div className="relative z-10 p-5">
             <div className="flex items-center justify-between mb-3">
               <motion.div
                 animate={activeTab === tab.id ? { rotate: [0, 360] } : {}}
                 transition={{ duration: 2, repeat: activeTab === tab.id ? Infinity : 0, ease: "linear" }}
                 style={{ color: activeTab === tab.id ? '#ffffff' : tab.color }}
               >
                 {tab.icon}
               </motion.div>
               <span className="text-3xl font-bold" style={{ 
                 color: activeTab === tab.id ? '#ffffff' : colors.text 
               }}>
                 {statistics[tab.id]}
               </span>
             </div>
             <p className="text-sm font-medium mb-1" style={{ 
               color: activeTab === tab.id ? '#ffffff' : colors.text 
             }}>
               {tab.name}
             </p>
             <p className="text-xs" style={{ 
               color: activeTab === tab.id ? 'rgba(255,255,255,0.8)' : colors.textSecondary 
             }}>
               {tab.description}
             </p>
             
             {/* Индикатор прогресса */}
             <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ 
               backgroundColor: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : colors.border 
             }}>
               <motion.div
                 className="h-full rounded-full"
                 style={{ 
                   backgroundColor: activeTab === tab.id ? '#ffffff' : tab.color 
                 }}
                 initial={{ width: 0 }}
                 animate={{ width: `${(statistics[tab.id] / statistics.total * 100)}%` }}
                 transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
               />
             </div>
           </div>
         </motion.div>
       ))}
     </div>
     
     {/* Фильтры */}
     <motion.div 
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ delay: 0.5 }}
       className="mb-6 p-4 rounded-xl"
       style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}
     >
       <div className="flex flex-wrap gap-4 items-center">
         <div className="flex-1 min-w-[200px]">
           <div className="relative">
             <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: colors.textSecondary }} />
             <input
               type="text"
               placeholder="Поиск по задачам, исполнителям..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full pl-10 pr-4 py-2.5 rounded-lg border transition-all"
               style={{ 
                 backgroundColor: colors.background,
                 borderColor: colors.border,
                 color: colors.text
               }}
             />
           </div>
         </div>
         
         <select
           value={selectedDepartment}
           onChange={(e) => setSelectedDepartment(e.target.value)}
           className="px-4 py-2.5 rounded-lg border cursor-pointer"
           style={{ 
             backgroundColor: colors.background,
             borderColor: colors.border,
             color: colors.text
           }}
         >
           <option value="all">Все отделы</option>
           {departments.map(dept => (
             <option key={dept.id} value={dept.id}>
               {dept.name}
             </option>
           ))}
         </select>
         
         <motion.button
           whileHover={{ scale: 1.05 }}
           whileTap={{ scale: 0.95 }}
           onClick={() => {
             const mockData = generateMockTasks();
             setTasks(mockData);
           }}
           className="px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium"
           style={{ 
             backgroundColor: colors.primary,
             color: '#ffffff'
           }}
         >
           <RefreshCw size={16} />
           Обновить
         </motion.button>
         
         <motion.button
           whileHover={{ scale: 1.05 }}
           whileTap={{ scale: 0.95 }}
           className="px-4 py-2.5 rounded-lg flex items-center gap-2 border font-medium"
           style={{ 
             borderColor: colors.border,
             color: colors.text
           }}
         >
           <Download size={16} />
           Экспорт
         </motion.button>
       </div>
     </motion.div>
     
     {/* Таблица с анимацией */}
     <motion.div
       key={activeTab}
       initial={{ opacity: 0, x: -20 }}
       animate={{ opacity: 1, x: 0 }}
       transition={{ duration: 0.3 }}
       className="rounded-xl overflow-hidden"
       style={{ 
         backgroundColor: colors.cardBg, 
         border: `1px solid ${colors.border}`,
         boxShadow: isDark ? '0 4px 6px rgba(0,0,0,0.1)' : '0 4px 6px rgba(0,0,0,0.05)'
       }}
     >
       {isLoading ? (
         <div className="flex flex-col items-center justify-center py-20">
           <motion.div
             animate={{ rotate: 360 }}
             transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
           >
             <Loader2 size={48} style={{ color: colors.primary }} />
           </motion.div>
           <p className="mt-4 text-lg" style={{ color: colors.text }}>
             Загрузка данных...
           </p>
           <p className="text-sm mt-2" style={{ color: colors.textSecondary }}>
             Пожалуйста, подождите
           </p>
         </div>
       ) : filteredTasks.length === 0 ? (
         <div className="text-center py-20">
           <motion.div
             initial={{ scale: 0 }}
             animate={{ scale: 1 }}
             transition={{ type: "spring", stiffness: 200 }}
           >
             <Search size={64} style={{ color: colors.textSecondary, margin: '0 auto', opacity: 0.5 }} />
           </motion.div>
           <p className="text-lg mt-4 mb-2" style={{ color: colors.text }}>
             Нет задач для отображения
           </p>
           <p className="text-sm" style={{ color: colors.textSecondary }}>
             Попробуйте изменить фильтры или обновить данные
           </p>
         </div>
       ) : (
         <div className="overflow-x-auto">
           {renderTable()}
         </div>
       )}
     </motion.div>
   </div>
 );
}