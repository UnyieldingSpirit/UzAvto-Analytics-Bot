'use client';
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { carModels } from '@/src/shared/mocks/mock-data';

const InstallmentDashboard = () => {
  // Refs for charts
  const mainChartRef = useRef(null);
  const modelChartRef = useRef(null);
  const paymentStatusRef = useRef(null);
  const monthlyTrendsRef = useRef(null);
  const regionChartRef = useRef(null);

  // State
  const [selectedRegion, setSelectedRegion] = useState('Ташкент');
  const [selectedModel, setSelectedModel] = useState(null);
  const [modelCompareMode, setModelCompareMode] = useState(false);
  const [viewMode, setViewMode] = useState('region'); // 'region' or 'model'

  // Регионы Узбекистана
  const regions = [
    'Ташкент', 'Самарканд', 'Бухара', 'Андижан', 'Наманган', 'Фергана',
    'Кашкадарья', 'Сурхандарья', 'Хорезм', 'Навои', 'Джизак', 
    'Сырдарья', 'Ташкентская область', 'Каракалпакстан'
  ];

  // Расширяем данные регионов
  const regionData = {};
  
  // Заполняем данные для регионов
  regions.forEach(region => {
    regionData[region] = {
      installmentCount: Math.floor(Math.random() * 200) + 100,
      paidPercentage: Math.floor(Math.random() * 30) + 60,
      overduePercentage: Math.floor(Math.random() * 20) + 5,
      models: carModels.map(model => ({
        ...model,
        installments: Math.floor(Math.random() * 60) + 15,
        paidPercentage: Math.floor(Math.random() * 30) + 50,
        overduePercentage: Math.floor(Math.random() * 20) + 5,
        remainingAmount: Math.floor(Math.random() * 40000) + 20000,
        paidAmount: Math.floor(Math.random() * 15000) + 5000,
        monthlyPayments: generateMonthlyData()
      }))
    };
  });

  // Генерация месячных платежей
  function generateMonthlyData() {
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен'];
    let cumulativePaid = 0;
    return months.map(month => {
      const paid = Math.floor(Math.random() * 1000) + 500;
      const unpaid = Math.floor(Math.random() * 500) + 100;
      cumulativePaid += paid;
      return { month, paid: cumulativePaid, unpaid };
    });
  }

  // Обработчик выбора модели
  const handleModelSelect = (model) => {
    if (selectedModel?.id === model.id) {
      setSelectedModel(null);
      setViewMode('region');
    } else {
      setSelectedModel(model);
      setViewMode('model');
    }
  };

  // Обработчик выбора региона
  const handleRegionSelect = (region) => {
    setSelectedRegion(region);
    if (viewMode === 'model' && selectedModel) {
      // При выборе региона в режиме просмотра модели, обновляем данные для выбранной модели
      const modelInRegion = regionData[region].models.find(m => m.id === selectedModel.id);
      if (modelInRegion) {
        setSelectedModel(modelInRegion);
      }
    }
  };

  // Переключение режима сравнения моделей
  const toggleModelCompareMode = () => {
    setModelCompareMode(!modelCompareMode);
  };

  useEffect(() => {
    renderMainChart();
    renderModelChart();
    renderPaymentStatus();
    renderMonthlyTrends();
    renderRegionChart();
  }, [selectedRegion, selectedModel, viewMode, modelCompareMode]);

  // Форматирование чисел
  const formatNumber = (num) => {
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  // Главная диаграмма с обзором рассрочки
  const renderMainChart = () => {
    if (!mainChartRef.current) return;
    const container = mainChartRef.current;
    const width = container.clientWidth;
    const height = 300;
    
    d3.select(container).selectAll("*").remove();
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);
    
    // Получаем данные для текущей модели или общие данные по региону
    let data = {
      carPrice: 0,
      paidAmount: 0,
      remainingAmount: 0,
      overdueDebt: 0
    };
    
    if (selectedModel) {
      const model = regionData[selectedRegion].models.find(m => m.id === selectedModel.id);
      data.carPrice = model.paidAmount + model.remainingAmount;
      data.paidAmount = model.paidAmount;
      data.remainingAmount = model.remainingAmount;
      data.overdueDebt = Math.round(model.remainingAmount * (model.overduePercentage / 100));
    } else {
      const regionModels = regionData[selectedRegion].models;
      data.carPrice = regionModels.reduce((sum, model) => sum + model.paidAmount + model.remainingAmount, 0);
      data.paidAmount = regionModels.reduce((sum, model) => sum + model.paidAmount, 0);
      data.remainingAmount = regionModels.reduce((sum, model) => sum + model.remainingAmount, 0);
      data.overdueDebt = Math.round(data.remainingAmount * (regionData[selectedRegion].overduePercentage / 100));
    }
    
    // Рассчитываем проценты
    const paidPercent = (data.paidAmount / data.carPrice) * 100;
    const overduePercent = (data.overdueDebt / data.carPrice) * 100;
    const remainingPercent = 100 - paidPercent - overduePercent;
    
    // Создаем санкей-подобную диаграмму
    const startX = 50;
    const endX = width - 50;
    const boxHeight = 80;
    const boxWidth = 120;
    const arrowWidth = (endX - startX - 2 * boxWidth) / 3;
    
    // Информация о полной стоимости
    const fullPriceBox = svg.append('g')
      .attr('transform', `translate(${startX}, ${height/2 - boxHeight/2})`);
    
    fullPriceBox.append('rect')
      .attr('width', boxWidth)
      .attr('height', boxHeight)
      .attr('fill', '#1e40af')
      .attr('rx', 8);
    
    fullPriceBox.append('text')
      .attr('x', boxWidth/2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '14px')
      .text('Полная цена');
    
    fullPriceBox.append('text')
      .attr('x', boxWidth/2)
      .attr('y', 50)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '18px')
      .attr('font-weight', 'bold')
      .text(`$${formatNumber(data.carPrice)}`);
    
    // Информация о текущем статусе
    const currentStatusBox = svg.append('g')
      .attr('transform', `translate(${endX - boxWidth}, ${height/2 - boxHeight/2})`);
    
    currentStatusBox.append('rect')
      .attr('width', boxWidth)
      .attr('height', boxHeight)
      .attr('fill', '#0f766e')
      .attr('rx', 8);
    
    currentStatusBox.append('text')
      .attr('x', boxWidth/2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '14px')
      .text('Остаток');
    
    currentStatusBox.append('text')
      .attr('x', boxWidth/2)
      .attr('y', 50)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '18px')
      .attr('font-weight', 'bold')
      .text(`$${formatNumber(data.remainingAmount)}`);

    // Центральная область для распределения
    const middleX = startX + boxWidth + arrowWidth/2;
    const middleWidth = width - 2*(startX + boxWidth) - arrowWidth;
    const barHeight = 30;
    
    // Фон для шкалы прогресса
    svg.append('rect')
      .attr('x', middleX)
      .attr('y', height/2 - barHeight/2)
      .attr('width', middleWidth)
      .attr('height', barHeight)
      .attr('fill', '#334155')
      .attr('rx', 4);
    
    // Оплаченная часть
    svg.append('rect')
      .attr('x', middleX)
      .attr('y', height/2 - barHeight/2)
      .attr('width', middleWidth * paidPercent / 100)
      .attr('height', barHeight)
      .attr('fill', '#16a34a')
      .attr('rx', 4);
    
    // Просроченная часть
    svg.append('rect')
      .attr('x', middleX + middleWidth * paidPercent / 100)
      .attr('y', height/2 - barHeight/2)
      .attr('width', middleWidth * overduePercent / 100)
      .attr('height', barHeight)
      .attr('fill', '#dc2626')
      .attr('rx', 0);
    
    // Стрелки-соединения
    svg.append('line')
      .attr('x1', startX + boxWidth)
      .attr('y1', height/2)
      .attr('x2', middleX)
      .attr('y2', height/2)
      .attr('stroke', '#64748b')
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrow)');
    
    svg.append('line')
      .attr('x1', middleX + middleWidth)
      .attr('y1', height/2)
      .attr('x2', endX - boxWidth)
      .attr('y2', height/2)
      .attr('stroke', '#64748b')
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrow)');
    
    // Маркер для стрелок
    const defs = svg.append('defs');
    
    defs.append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#64748b');
    
    // Добавляем подписи для шкалы прогресса
    svg.append('text')
      .attr('x', middleX + 10)
      .attr('y', height/2 - barHeight/2 - 10)
      .attr('fill', 'white')
      .attr('font-size', '12px')
      .text('Оплачено:');
    
    svg.append('text')
      .attr('x', middleX + 80)
      .attr('y', height/2 - barHeight/2 - 10)
      .attr('fill', '#16a34a')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text(`${Math.round(paidPercent)}% ($${formatNumber(data.paidAmount)})`);
    
    svg.append('text')
      .attr('x', middleX + middleWidth - 200)
      .attr('y', height/2 - barHeight/2 - 10)
      .attr('fill', 'white')
      .attr('font-size', '12px')
      .text('Просрочено:');
    
    svg.append('text')
      .attr('x', middleX + middleWidth - 120)
      .attr('y', height/2 - barHeight/2 - 10)
      .attr('fill', '#dc2626')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text(`${Math.round(overduePercent)}% ($${formatNumber(data.overdueDebt)})`);
    
    // Остаток в процентах
    svg.append('text')
      .attr('x', middleX + middleWidth / 2)
      .attr('y', height/2 + barHeight/2 + 20)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '12px')
      .text(`Остаток к оплате: ${Math.round(remainingPercent)}%`);
    
    // Добавляем подпись выбранного региона и модели
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height - 15)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '12px')
      .text(`Регион: ${selectedRegion}${selectedModel ? ` - Модель: ${selectedModel.name}` : ''}`);
  };

  // Диаграмма по моделям
  const renderModelChart = () => {
    if (!modelChartRef.current) return;
    const container = modelChartRef.current;
    const width = container.clientWidth;
    const height = 200;
    
    d3.select(container).selectAll("*").remove();
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);
    
    // Получаем модели для текущего региона
    const models = selectedModel 
      ? [selectedModel] 
      : regionData[selectedRegion].models.slice(0, 4); // Ограничиваем 4 моделями для лучшего отображения
    
    // Добавляем заголовок
    svg.append('text')
      .attr('x', 10)
      .attr('y', 20)
      .attr('fill', 'white')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text('Рассрочка по моделям');
    
    const barHeight = 20;
    const barSpacing = 16;
    const startY = 50;
    const barWidth = width - 100;
    
    // Цвета для моделей
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
    
    // Добавляем бары для каждой модели
    models.forEach((model, i) => {
      const y = startY + i * (barHeight + barSpacing);
      
      // Название модели
      svg.append('text')
        .attr('x', 10)
        .attr('y', y + barHeight/2 + 5)
        .attr('fill', 'white')
        .attr('font-size', '14px')
        .text(model.name);
      
      // Фон прогресс-бара
      svg.append('rect')
        .attr('x', 100)
        .attr('y', y)
        .attr('width', barWidth)
        .attr('height', barHeight)
        .attr('fill', '#334155')
        .attr('rx', 4);
      
      // Прогресс
      svg.append('rect')
        .attr('x', 100)
        .attr('y', y)
        .attr('width', 0)
        .attr('height', barHeight)
        .attr('fill', colors[i % colors.length])
        .attr('rx', 4)
        .transition()
        .duration(1000)
        .attr('width', barWidth * model.paidPercentage / 100);
      
      // Процент
      svg.append('text')
        .attr('x', 110)
        .attr('y', y + barHeight/2 + 5)
        .attr('fill', 'white')
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .text(`${model.paidPercentage}%`);
    });
    
    // Добавляем информацию о регионе
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height - 10)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '12px')
      .text(`${selectedRegion}`);
  };

  // Диаграмма статуса оплаты
  const renderPaymentStatus = () => {
    if (!paymentStatusRef.current) return;
    const container = paymentStatusRef.current;
    const width = container.clientWidth;
    const height = 200;
    
    d3.select(container).selectAll("*").remove();
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);
    
    // Добавляем заголовок
    svg.append('text')
      .attr('x', 10)
      .attr('y', 20)
      .attr('fill', 'white')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text('Статус оплаты');
    
    // Получаем данные для диаграммы
    let data = {};
    
    if (selectedModel) {
      const model = regionData[selectedRegion].models.find(m => m.id === selectedModel.id);
      const total = model.paidAmount + model.remainingAmount;
      const paid = model.paidAmount;
      const overdue = Math.round(model.remainingAmount * (model.overduePercentage / 100));
      const remaining = model.remainingAmount - overdue;
      
      data = { total, paid, overdue, remaining };
    } else {
      const regionModels = regionData[selectedRegion].models;
      const total = regionModels.reduce((sum, model) => sum + model.paidAmount + model.remainingAmount, 0);
      const paid = regionModels.reduce((sum, model) => sum + model.paidAmount, 0);
      const remainingTotal = regionModels.reduce((sum, model) => sum + model.remainingAmount, 0);
      const overdue = Math.round(remainingTotal * (regionData[selectedRegion].overduePercentage / 100));
      const remaining = remainingTotal - overdue;
      
      data = { total, paid, overdue, remaining };
    }
    
    const pieData = [
      { label: 'Оплачено', value: data.paid, color: '#16a34a' },
      { label: 'Просрочено', value: data.overdue, color: '#dc2626' },
      { label: 'Остаток', value: data.remaining, color: '#334155' }
    ];
    
    // Создаем пирог
    const radius = Math.min(width, height) / 3;
    const pieGenerator = d3.pie().value(d => d.value).sort(null);
    const arcData = pieGenerator(pieData);
    
    const arcGenerator = d3.arc()
      .innerRadius(radius * 0.6)
      .outerRadius(radius);
    
    const pieGroup = svg.append('g')
      .attr('transform', `translate(${width/3}, ${height/2})`);
    
    // Добавляем сегменты с анимацией
    pieGroup.selectAll('path')
      .data(arcData)
      .join('path')
      .attr('d', d => {
        // Начальное положение - все сегменты имеют начальный и конечный углы равные 0
        const startArc = { ...d, startAngle: d.endAngle, endAngle: d.endAngle };
        return arcGenerator(startArc);
      })
      .attr('fill', d => d.data.color)
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 1)
      .transition()
      .duration(800)
      .attrTween('d', function(d) {
        const interpolate = d3.interpolate(
          { startAngle: d.endAngle, endAngle: d.endAngle },
          { startAngle: d.startAngle, endAngle: d.endAngle }
        );
        return function(t) {
          return arcGenerator(interpolate(t));
        };
      });
    
    // Добавляем текст в центр
    pieGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', -5)
      .attr('fill', 'white')
      .attr('font-size', '14px')
      .text('Всего');
    
    pieGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 15)
      .attr('fill', 'white')
      .attr('font-size', '18px')
      .attr('font-weight', 'bold')
      .text(`$${formatNumber(data.total)}`);
    
    // Добавляем легенду
    const legend = svg.append('g')
      .attr('transform', `translate(${2*width/3}, ${height/4})`);
    
    pieData.forEach((item, i) => {
      const legendItem = legend.append('g')
        .attr('transform', `translate(0, ${i * 25})`);
      
      legendItem.append('rect')
        .attr('width', 14)
        .attr('height', 14)
        .attr('fill', item.color)
        .attr('rx', 2);
      
      legendItem.append('text')
        .attr('x', 20)
        .attr('y', 12)
        .attr('fill', 'white')
        .attr('font-size', '14px')
        .text(`${item.label}: $${formatNumber(item.value)}`);
    });
  };

  // График месячных трендов
  const renderMonthlyTrends = () => {
    if (!monthlyTrendsRef.current) return;
    const container = monthlyTrendsRef.current;
    const width = container.clientWidth;
    const height = 250;
    const margin = { top: 30, right: 30, bottom: 40, left: 60 };
    
    d3.select(container).selectAll("*").remove();
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);
    
    // Добавляем заголовок
    svg.append('text')
      .attr('x', 10)
      .attr('y', 20)
      .attr('fill', 'white')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text('Динамика платежей по месяцам');
    
    // Получаем данные для графика
    let monthlyPayments = [];
    
    if (selectedModel) {
      const model = regionData[selectedRegion].models.find(m => m.id === selectedModel.id);
      monthlyPayments = model.monthlyPayments;
    } else {
      // Суммируем данные по всем моделям
      const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен'];
      monthlyPayments = months.map((month, i) => {
        const models = regionData[selectedRegion].models;
        return {
          month,
          paid: models.reduce((sum, model) => sum + model.monthlyPayments[i].paid, 0),
          unpaid: models.reduce((sum, model) => sum + model.monthlyPayments[i].unpaid, 0)
        };
      });
    }
    
    // Создаем шкалы
    const x = d3.scaleBand()
      .domain(monthlyPayments.map(d => d.month))
      .range([margin.left, width - margin.right])
      .padding(0.3);
    
    const y = d3.scaleLinear()
      .domain([0, d3.max(monthlyPayments, d => d.paid + d.unpaid) * 1.1])
      .nice()
      .range([height - margin.bottom, margin.top]);
    
    // Добавляем оси
    svg.append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('fill', '#94a3b8');
    
    svg.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `$${d/1000}k`))
      .selectAll('text')
      .attr('fill', '#94a3b8');
    
    // Добавляем столбцы оплаченных сумм
    svg.selectAll('.paid-bar')
      .data(monthlyPayments)
      .join('rect')
      .attr('class', 'paid-bar')
      .attr('x', d => x(d.month))
      .attr('y', d => y(d.paid))
      .attr('width', x.bandwidth())
      .attr('height', d => height - margin.bottom - y(d.paid))
      .attr('fill', '#16a34a')
      .attr('rx', 2);
    
    // Добавляем столбцы просроченных платежей
    svg.selectAll('.unpaid-bar')
      .data(monthlyPayments)
      .join('rect')
      .attr('class', 'unpaid-bar')
      .attr('x', d => x(d.month))
      .attr('y', d => y(d.paid + d.unpaid))
      .attr('width', x.bandwidth())
      .attr('height', d => y(d.paid) - y(d.paid + d.unpaid))
      .attr('fill', '#dc2626')
      .attr('rx', 2);
    
    // Добавляем линию тренда
    const lineGenerator = d3.line()
      .x(d => x(d.month) + x.bandwidth() / 2)
      .y(d => y(d.paid + d.unpaid))
      .curve(d3.curveMonotoneX);
    
    svg.append('path')
      .datum(monthlyPayments)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2)
      .attr('d', lineGenerator);
    
    // Добавляем точки
    svg.selectAll('.data-point')
      .data(monthlyPayments)
      .join('circle')
      .attr('class', 'data-point')
      .attr('cx', d => x(d.month) + x.bandwidth() / 2)
      .attr('cy', d => y(d.paid + d.unpaid))
      .attr('r', 4)
      .attr('fill', '#3b82f6')
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 2);
    
    // Добавляем легенду
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 160}, 40)`);
    
    // Оплаченные платежи
    const paidLegend = legend.append('g');
    paidLegend.append('rect')
      .attr('width', 14)
      .attr('height', 14)
      .attr('fill', '#16a34a')
      .attr('rx', 2);
    
    paidLegend.append('text')
      .attr('x', 20)
      .attr('y', 12)
      .attr('fill', 'white')
      .attr('font-size', '12px')
      .text('Оплачено');
    
    // Просроченные платежи
    const unpaidLegend = legend.append('g')
      .attr('transform', 'translate(0, 20)');
    
    unpaidLegend.append('rect')
      .attr('width', 14)
      .attr('height', 14)
      .attr('fill', '#dc2626')
      .attr('rx', 2);
    
    unpaidLegend.append('text')
      .attr('x', 20)
      .attr('y', 12)
      .attr('fill', 'white')
      .attr('font-size', '12px')
      .text('Просрочено');
    
    // Общая сумма
    const totalLegend = legend.append('g')
      .attr('transform', 'translate(0, 40)');
    
    totalLegend.append('line')
      .attr('x1', 0)
      .attr('x2', 14)
      .attr('y1', 7)
      .attr('y2', 7)
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2);
    
    totalLegend.append('text')
      .attr('x', 20)
      .attr('y', 12)
      .attr('fill', 'white')
      .attr('font-size', '12px')
      .text('Общая сумма');
    
    // Информация о регионе
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height - 10)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '12px')
      .text(`Данные по региону: ${selectedRegion}`);
  };

  // Диаграмма по регионам
  const renderRegionChart = () => {
    if (!regionChartRef.current) return;
    const container = regionChartRef.current;
    d3.select(container).selectAll("*").remove();
    
    const width = container.clientWidth;
    const height = 350; // Reduced height
    
    // Get top 8 regions to avoid overcrowding
    const topRegions = Object.entries(regionData)
      .sort((a, b) => b[1].installmentCount - a[1].installmentCount)
      .slice(0, 8)
      .map(entry => entry[0]);
    
    // Create simple SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);
    
    // Define clean margins
    const margin = { top: 40, right: 20, bottom: 20, left: 120 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Create title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('Топ регионов по количеству рассрочек');
    
    // Create chart group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    // Set up scales
    const y = d3.scaleBand()
      .domain(topRegions)
      .range([0, innerHeight])
      .padding(0.4);
      
    const x = d3.scaleLinear()
      .domain([0, d3.max(topRegions.map(r => regionData[r].installmentCount))])
      .range([0, innerWidth - 100]); // Leave space for labels
    
    // Draw axes
    g.append('g')
      .call(d3.axisLeft(y)
        .tickSize(0)
        .tickPadding(10))
      .call(g => g.select('.domain').remove())
      .selectAll('text')
      .attr('fill', d => d === selectedRegion ? '#ffffff' : '#94a3b8')
      .attr('font-weight', d => d === selectedRegion ? 'bold' : 'normal')
      .style('cursor', 'pointer')
      .on('click', (_, d) => handleRegionSelect(d));
    
    // Draw background for bars
    g.selectAll('.bar-bg')
      .data(topRegions)
      .join('rect')
      .attr('class', 'bar-bg')
      .attr('y', d => y(d) + y.bandwidth() * 0.1)
      .attr('height', y.bandwidth() * 0.8)
      .attr('x', 0)
      .attr('width', innerWidth - 100)
      .attr('fill', '#1e293b')
      .attr('rx', 3);
    
    // Draw bars
    g.selectAll('.bar')
      .data(topRegions)
      .join('rect')
      .attr('class', 'bar')
      .attr('y', d => y(d) + y.bandwidth() * 0.1)
      .attr('height', y.bandwidth() * 0.8)
      .attr('x', 0)
      .attr('fill', d => d === selectedRegion ? '#3b82f6' : '#64748b')
      .attr('rx', 3)
      .style('cursor', 'pointer')
      .on('click', (_, d) => handleRegionSelect(d))
      .attr('width', 0)
      .transition()
      .duration(800)
      .attr('width', d => x(regionData[d].installmentCount));
    
    // Add count labels
    g.selectAll('.count')
      .data(topRegions)
      .join('text')
      .attr('class', 'count')
      .attr('y', d => y(d) + y.bandwidth() / 2)
      .attr('x', d => x(regionData[d].installmentCount) + 5)
      .attr('dy', '0.35em')
      .attr('fill', 'white')
      .attr('font-size', '11px')
      .text(d => formatNumber(regionData[d].installmentCount));
    
    // Add indicators
    g.selectAll('.indicator')
      .data(topRegions)
      .join('g')
      .attr('class', 'indicator')
      .attr('transform', d => `translate(${innerWidth - 70}, ${y(d) + y.bandwidth() / 2})`)
      .each(function(d) {
        const g = d3.select(this);
        const info = regionData[d];
        
        // Mini progress bar
        const width = 60;
        
        // Background
        g.append('rect')
          .attr('x', 0)
          .attr('y', -4)
          .attr('width', width)
          .attr('height', 8)
          .attr('rx', 4)
          .attr('fill', '#1e293b');
        
        // Paid part
        g.append('rect')
          .attr('x', 0)
          .attr('y', -4)
          .attr('width', (width * info.paidPercentage) / 100)
          .attr('height', 8)
          .attr('rx', 4)
          .attr('fill', '#16a34a');
        
        // Overdue part
        g.append('rect')
          .attr('x', (width * info.paidPercentage) / 100)
          .attr('y', -4)
          .attr('width', (width * info.overduePercentage) / 100)
          .attr('height', 8)
          .attr('fill', '#dc2626');
        
        // Status dot
        const statusColor = info.overduePercentage < 10 ? '#22c55e' : 
                            info.overduePercentage < 15 ? '#eab308' : '#ef4444';
        
        g.append('circle')
          .attr('cx', -10)
          .attr('cy', 0)
          .attr('r', 4)
          .attr('fill', statusColor);
      });
    
    // Add highlight for selected region
    if (selectedRegion && topRegions.includes(selectedRegion)) {
      const selectedY = y(selectedRegion);
      g.append('rect')
        .attr('x', -10)
        .attr('y', selectedY - 2)
        .attr('width', innerWidth - 80)
        .attr('height', y.bandwidth() + 4)
        .attr('fill', 'none')
        .attr('stroke', '#3b82f6')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '3,2')
        .attr('rx', 5);
    }
    
    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 170}, ${margin.top - 15})`);
    
    legend.append('rect')
      .attr('width', 10)
      .attr('height', 10)
      .attr('fill', '#16a34a');
    
    legend.append('text')
      .attr('x', 15)
      .attr('y', 8)
      .attr('font-size', '10px')
      .attr('fill', '#94a3b8')
      .text('Оплачено');
    
    legend.append('rect')
      .attr('x', 80)
      .attr('width', 10)
      .attr('height', 10)
      .attr('fill', '#dc2626');
    
    legend.append('text')
      .attr('x', 95)
      .attr('y', 8)
      .attr('font-size', '10px')
      .attr('fill', '#94a3b8')
      .text('Просрочено');
  };

  // Информационные карточки региона
  const RegionInfoCards = () => {
    const regionInfo = regionData[selectedRegion];
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Карточка по количеству рассрочек */}
        <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 rounded-xl p-4 shadow-lg border border-blue-800/30">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-blue-600/30 flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-300">Количество рассрочек</h3>
              <p className="text-2xl font-bold text-white">{formatNumber(regionInfo.installmentCount)}</p>
              <p className="text-blue-300/70 text-xs mt-1">Активных договоров</p>
            </div>
          </div>
        </div>
        
        {/* Карточка по проценту оплаты */}
        <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 rounded-xl p-4 shadow-lg border border-green-800/30">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-green-600/30 flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-green-300">Процент оплаты</h3>
              <p className="text-2xl font-bold text-white">{regionInfo.paidPercentage}%</p>
              <p className="text-green-300/70 text-xs mt-1">Оплаченных платежей</p>
            </div>
          </div>
        </div>
        
        {/* Карточка по проценту просрочки */}
        <div className="bg-gradient-to-br from-red-900/40 to-red-800/20 rounded-xl p-4 shadow-lg border border-red-800/30">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-red-600/30 flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-red-300">Просрочка платежей</h3>
              <p className="text-2xl font-bold text-white">{regionInfo.overduePercentage}%</p>
              <p className="text-red-300/70 text-xs mt-1">Просроченных платежей</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900 p-4 md:p-6 text-white">
      <h1 className="text-2xl font-bold mb-6 text-center">ТАБЛИЦА РАССРОЧКИ</h1>
      
      {/* Навигационные вкладки */}
      <div className="flex mb-6 border-b border-slate-700">
        <button 
          className={`px-4 py-2 font-medium ${viewMode === 'region' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400'}`}
          onClick={() => {
            setViewMode('region');
            setModelCompareMode(false);
          }}
        >
          По регионам
        </button>
        {selectedModel && (
          <button 
            className={`px-4 py-2 font-medium ${viewMode === 'model' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400'}`}
            onClick={() => setViewMode('model')}
          >
            {selectedModel.name}
          </button>
        )}
      </div>
      
      {/* Выбор региона всегда доступен */}
      <div className="bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-700 mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white mb-2">
              {viewMode === 'region' ? 'Выбор региона' : `${selectedModel?.name} в регионах`}
            </h3>
            <p className="text-slate-400 text-sm">
              {viewMode === 'region' 
                ? 'Выберите регион для просмотра статистики рассрочки' 
                : 'Выберите регион для просмотра рассрочки на эту модель'}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 max-w-2xl">
            {regions.map(region => (
              <button
                key={region}
                onClick={() => handleRegionSelect(region)}
                className={`px-3 py-2 text-sm rounded-lg transition-all ${
                  selectedRegion === region 
                    ? 'bg-blue-600 text-white font-medium shadow-md shadow-blue-900/30' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Информационные карточки региона */}
      {viewMode === 'region' && <RegionInfoCards />}
      
      {/* Детальная информация о выбранной модели */}
      {selectedModel && viewMode === 'model' && (
        <div className="bg-slate-800 rounded-xl p-5 shadow-lg border border-blue-800/30 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Изображение автомобиля */}
            <div className="md:w-1/3 bg-slate-700/50 rounded-xl p-4 flex items-center justify-center">
              <img 
                src={selectedModel.img} 
                alt={selectedModel.name} 
                className="max-h-60 object-contain" 
              />
            </div>
            
            {/* Информация о модели в выбранном регионе */}
            <div className="md:w-2/3">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">{selectedModel.name}</h2>
                  <p className="text-slate-400 mb-1">
                    {selectedModel.category === 'suv' ? 'Внедорожник' : 
                     selectedModel.category === 'sedan' ? 'Седан' : 'Минивэн'}
                  </p>
                  <p className="text-blue-400 text-sm">
                    Данные по региону: {selectedRegion}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setSelectedModel(null);
                    setViewMode('region');
                  }}
                  className="bg-slate-700 hover:bg-slate-600 p-2 rounded-lg text-slate-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 my-6">
                <div className="bg-slate-700/50 p-3 rounded-lg">
                  <div className="text-slate-400 text-sm">Всего в рассрочке</div>
                  <div className="text-white text-xl font-bold">{selectedModel.installments} шт.</div>
                </div>
                
                <div className="bg-slate-700/50 p-3 rounded-lg">
                  <div className="text-slate-400 text-sm">Оплачено</div>
                  <div className="text-green-400 text-xl font-bold">{selectedModel.paidPercentage}%</div>
                </div>
                
                <div className="bg-slate-700/50 p-3 rounded-lg">
                  <div className="text-slate-400 text-sm">Просрочено</div>
                  <div className="text-red-400 text-xl font-bold">{selectedModel.overduePercentage}%</div>
                </div>
                
                <div className="bg-slate-700/50 p-3 rounded-lg">
                  <div className="text-slate-400 text-sm">Остаток</div>
                  <div className="text-white text-xl font-bold">${formatNumber(selectedModel.remainingAmount)}</div>
                </div>
                
                <div className="bg-slate-700/50 p-3 rounded-lg">
                  <div className="text-slate-400 text-sm">Оплачено</div>
                  <div className="text-white text-xl font-bold">${formatNumber(selectedModel.paidAmount)}</div>
                </div>
                
                <div className="bg-slate-700/50 p-3 rounded-lg">
                  <div className="text-slate-400 text-sm">Полная стоимость</div>
                  <div className="text-white text-xl font-bold">${formatNumber(selectedModel.paidAmount + selectedModel.remainingAmount)}</div>
                </div>
              </div>
              
              {/* Полоса прогресса оплаты */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Прогресс оплаты:</span>
                  <span className="text-white">{selectedModel.paidPercentage}%</span>
                </div>
                <div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-green-500" 
                    style={{ width: `${selectedModel.paidPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Кнопки действий */}
              <div className="flex flex-wrap gap-3">
                <button 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  onClick={toggleModelCompareMode}
                >
                  {modelCompareMode ? 'Скрыть сравнение по регионам' : 'Сравнить по регионам'}
                </button>
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
                  График платежей
                </button>
                <button 
                  className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg"
                  onClick={() => {
                    setSelectedModel(null);
                    setViewMode('region');
                  }}
                >
                  К списку моделей
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Сравнение модели по регионам */}
      {viewMode === 'model' && modelCompareMode && (
        <div className="bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-700 mb-6">
          <h3 className="text-lg font-bold text-white mb-4">{selectedModel.name} - Сравнение по регионам</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-700/50">
                  <th className="p-2 text-left">Регион</th>
                  <th className="p-2 text-right">Количество</th>
                  <th className="p-2 text-right">Оплачено (%)</th>
                  <th className="p-2 text-right">Просрочено (%)</th>
                  <th className="p-2 text-right">Сумма остатка</th>
                </tr>
              </thead>
              <tbody>
                {regions.map(region => {
                  const modelInRegion = regionData[region].models.find(m => m.id === selectedModel.id);
                  return (
                    <tr 
                      key={region} 
                      className={`border-b border-slate-700 hover:bg-slate-700/30 cursor-pointer ${region === selectedRegion ? 'bg-blue-900/20' : ''}`}
                      onClick={() => handleRegionSelect(region)}
                    >
                      <td className="p-2">{region}</td>
                      <td className="p-2 text-right">{modelInRegion.installments}</td>
                      <td className="p-2 text-right text-green-400">{modelInRegion.paidPercentage}%</td>
                      <td className="p-2 text-right text-red-400">{modelInRegion.overduePercentage}%</td>
                      <td className="p-2 text-right">${formatNumber(modelInRegion.remainingAmount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Отображение карточек моделей только в режиме региона */}
      {viewMode === 'region' && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">Модели автомобилей в рассрочке - {selectedRegion}</h3>
            <div className="text-sm text-slate-400">
              Нажмите на модель для подробной информации
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {regionData[selectedRegion].models.map(model => (
              <div 
                key={model.id}
                className={`bg-slate-800 rounded-xl overflow-hidden shadow-lg transition-all cursor-pointer border ${
                  selectedModel?.id === model.id ? 'border-blue-500 scale-[1.02]' : 'border-slate-700 hover:scale-[1.01]'
                }`}
                onClick={() => handleModelSelect(model)}
              >
                <div className="h-44 overflow-hidden bg-slate-700/50 flex items-center justify-center">
                  <img 
                    src={model.img} 
                    alt={model.name} 
                    className="w-full h-44 object-contain p-2" 
                  />
                </div>
                <div className="p-4">
                  <h4 className="text-lg font-bold text-white">{model.name}</h4>
                  <p className="text-slate-400 text-sm mb-2">
                    {model.category === 'suv' ? 'Внедорожник' : 
                     model.category === 'sedan' ? 'Седан' : 'Минивэн'}
                  </p>
                  
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">Рассрочка:</span>
                      <span className="text-white font-medium">{model.installments} шт.</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-1.5 mb-3">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full" 
                        style={{ width: `${(model.installments / Math.max(...regionData[selectedRegion].models.map(m => m.installments))) * 100}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">Оплачено:</span>
                      <span className="text-green-400 font-medium">{model.paidPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-1.5 mb-3">
                      <div 
                        className="bg-green-500 h-1.5 rounded-full" 
                        style={{ width: `${model.paidPercentage}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">Просрочено:</span>
                      <span className="text-red-400 font-medium">{model.overduePercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-1.5">
                      <div 
                        className="bg-red-500 h-1.5 rounded-full" 
                        style={{ width: `${model.overduePercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Графики */}
      <div className="space-y-6">
        {/* График по регионам показываем только в режиме региона */}
        {viewMode === 'region' && (
          <div className="bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-700">
            <div ref={regionChartRef} className="w-full h-[350px]"></div>
          </div>
        )}
        
        <div className="bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-700">
          <div ref={mainChartRef} className="w-full h-[300px]"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-700">
            <div ref={modelChartRef} className="w-full h-[200px]"></div>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-700">
            <div ref={paymentStatusRef} className="w-full h-[200px]"></div>
          </div>
        </div>
        
        <div className="bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-700">
          <div ref={monthlyTrendsRef} className="w-full h-[250px]"></div>
        </div>
      </div>
    </div>
  );
};

export default InstallmentDashboard;