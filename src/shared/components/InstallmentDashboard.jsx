'use client';
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const InstallmentDashboard = () => {
  const mainChartRef = useRef(null);
  const modelChartRef = useRef(null);
  const paymentStatusRef = useRef(null);
  const monthlyTrendsRef = useRef(null);

  // Данные рассрочки
  const data = {
    remainingAmount: 68452,    // Оставшаяся сумма
    paidAmount: 9478,          // Оплачено
    carPrice: 78600,           // Цена машины
    overdueDebt: 3652,         // Просроченные платежи
    accountsReceivable: 5784,  // Дебиторская задолженность
    
    // Платежи по месяцам
    monthlyPayments: [
      { month: 'Янв', paid: 4200, unpaid: 1800 },
      { month: 'Фев', paid: 4500, unpaid: 1500 },
      { month: 'Мар', paid: 5100, unpaid: 1200 },
      { month: 'Апр', paid: 5400, unpaid: 1800 },
      { month: 'Май', paid: 6300, unpaid: 2100 },
      { month: 'Июн', paid: 6900, unpaid: 2700 },
      { month: 'Июл', paid: 7500, unpaid: 3300 },
      { month: 'Авг', paid: 8100, unpaid: 3600 },
      { month: 'Сен', paid: 9478, unpaid: 3652 }
    ],
    
    // Данные по моделям
    models: [
      { name: 'Лачетти', percentage: 85 },
      { name: 'Нексия', percentage: 70 },
      { name: 'Кобальт', percentage: 55 },
      { name: 'Дамас', percentage: 40 }
    ]
  };

  useEffect(() => {
    renderMainChart();
    renderModelChart();
    renderPaymentStatus();
    renderMonthlyTrends();
  }, []);

  // Форматирование чисел и валюты
  const formatNumber = (num) => {
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  // Главная диаграмма с обзором рассрочки
  const renderMainChart = () => {
    if (!mainChartRef.current) return;
    const container = mainChartRef.current;
    const width = container.clientWidth;
    const height = 300;
    
    // Очищаем контейнер
    d3.select(container).selectAll("*").remove();
    
    // Создаем SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);
    
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
  };

  // Диаграмма по моделям
  const renderModelChart = () => {
    if (!modelChartRef.current) return;
    const container = modelChartRef.current;
    const width = container.clientWidth;
    const height = 200;
    
    // Очищаем контейнер
    d3.select(container).selectAll("*").remove();
    
    // Создаем SVG
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
      .text('Рассрочка по моделям');
    
    const barHeight = 20;
    const barSpacing = 16;
    const startY = 50;
    const barWidth = width - 100;
    
    // Цвета для моделей
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
    
    // Добавляем бары для каждой модели
    data.models.forEach((model, i) => {
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
        .attr('width', barWidth * model.percentage / 100)
        .attr('height', barHeight)
        .attr('fill', colors[i])
        .attr('rx', 4)
        .transition()
        .duration(1000)
        .attr('width', barWidth * model.percentage / 100);
      
      // Процент
      svg.append('text')
        .attr('x', 110)
        .attr('y', y + barHeight/2 + 5)
        .attr('fill', 'white')
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .text(`${model.percentage}%`);
    });
  };

  // Диаграмма статуса оплаты
  const renderPaymentStatus = () => {
    if (!paymentStatusRef.current) return;
    const container = paymentStatusRef.current;
    const width = container.clientWidth;
    const height = 200;
    
    // Очищаем контейнер
    d3.select(container).selectAll("*").remove();
    
    // Создаем SVG
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
    const total = data.carPrice;
    const paid = data.paidAmount;
    const overdue = data.overdueDebt;
    const remaining = total - paid - overdue;
    
    const pieData = [
      { label: 'Оплачено', value: paid, color: '#16a34a' },
      { label: 'Просрочено', value: overdue, color: '#dc2626' },
      { label: 'Остаток', value: remaining, color: '#334155' }
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
    
    // Добавляем сегменты
    pieGroup.selectAll('path')
      .data(arcData)
      .join('path')
      .attr('d', arcGenerator)
      .attr('fill', d => d.data.color)
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 1);
    
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
      .text(`$${formatNumber(total)}`);
    
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
    
    // Очищаем контейнер
    d3.select(container).selectAll("*").remove();
    
    // Создаем SVG
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
    
    // Создаем шкалы
    const x = d3.scaleBand()
      .domain(data.monthlyPayments.map(d => d.month))
      .range([margin.left, width - margin.right])
      .padding(0.3);
    
    const y = d3.scaleLinear()
      .domain([0, d3.max(data.monthlyPayments, d => d.paid + d.unpaid) * 1.1])
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
      .data(data.monthlyPayments)
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
      .data(data.monthlyPayments)
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
      .datum(data.monthlyPayments)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2)
      .attr('d', lineGenerator);
    
    // Добавляем точки
    svg.selectAll('.data-point')
      .data(data.monthlyPayments)
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
  };

  return (
    <div className="bg-slate-900 p-4 md:p-6 text-white">
      <h1 className="text-2xl font-bold mb-6 text-center">ТАБЛИЦА РАССРОЧКИ</h1>
      
      <div className="grid grid-cols-1 gap-6 mb-6">
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