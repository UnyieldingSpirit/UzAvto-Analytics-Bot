'use client';
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const OrderTrackingDashboard = () => {
 const donutChartRef = useRef(null);
 const modelsChartRef = useRef(null);
 const statusChartRef = useRef(null);
 const [activeModel, setActiveModel] = useState(null);
 const [viewMode, setViewMode] = useState('grid');

 // Данные для прогресса выполнения плана
 const revenueData = {
   goal: 12000,
   current: 8796,
   completed: 68,
   total: 8796
 };

 // Данные моделей автомобилей
 const modelData = [
   { id: 'model1', name: 'Лачетти', category: 'Седан', value: 45689, change: 28.5, icon: '🚗', color: '#4747e5' },
   { id: 'model2', name: 'Нексия 3', category: 'Седан', value: 34248, change: -14.5, icon: '🚗', color: '#60a5fa' },
   { id: 'model3', name: 'Кобальт', category: 'Седан', value: 45689, change: 28.5, icon: '🚗', color: '#34d399' },
   { id: 'model4', name: 'Дамас', category: 'Минивэн', value: 67249, change: -43.5, icon: '🚐', color: '#f59e0b' },
   { id: 'model5', name: 'Спарк', category: 'Хэтчбек', value: 67249, change: -43.5, icon: '🚙', color: '#ec4899' },
   { id: 'model6', name: 'Джентра', category: 'Седан', value: 89178, change: 24.7, icon: '🚗', color: '#8b5cf6' }
 ];

 // Данные статусов заказов
 const statusData = [
   { id: 'neopl', name: 'Не оплаченный', value: 142, color: '#ef4444' },
   { id: 'ocheredi', name: 'В очереди', value: 254, color: '#f59e0b' },
   { id: 'process', name: 'В процессе', value: 186, color: '#3b82f6' },
   { id: 'dostavka', name: 'В пути', value: 95, color: '#8b5cf6' },
   { id: 'raspredelenie', name: 'Распределение', value: 63, color: '#10b981' },
   { id: 'diler', name: 'У дилера', value: 127, color: '#6366f1' }
 ];

 // Статусы оплаты
 const paymentCategories = {
   'oplachen': { name: 'ОПЛАЧЕНО', value: '65%', color: '#10b981' },
   'neoplachen': { name: 'НЕ ОПЛАЧЕНО', value: '35%', color: '#ef4444' }
 };

 useEffect(() => {
   renderDonutChart();
   renderModelsChart();
   renderStatusChart();
 }, [activeModel, viewMode]);

 // Функция для создания диаграммы прогресса (пончик)
 const renderDonutChart = () => {
   if (!donutChartRef.current) return;
   d3.select(donutChartRef.current).selectAll('*').remove();

   const width = donutChartRef.current.clientWidth;
   const height = width;
   const margin = 20;
   const radius = Math.min(width, height) / 2 - margin;

   // Создаем SVG
   const svg = d3.select(donutChartRef.current)
     .append('svg')
     .attr('width', width)
     .attr('height', height)
     .append('g')
     .attr('transform', `translate(${width / 2}, ${height / 2})`);

   // Данные для диаграммы
   const data = [
     { name: 'completed', value: revenueData.completed },
     { name: 'remaining', value: 100 - revenueData.completed }
   ];

   // Создаем градиенты
   const defs = svg.append('defs');
   
   // Градиент для выполненной части
   const gradient = defs.append('linearGradient')
     .attr('id', 'progress-gradient')
     .attr('gradientUnits', 'userSpaceOnUse')
     .attr('x1', '-50%')
     .attr('y1', '-50%')
     .attr('x2', '50%')
     .attr('y2', '50%');
     
   gradient.append('stop')
     .attr('offset', '0%')
     .attr('stop-color', '#4f46e5');
     
   gradient.append('stop')
     .attr('offset', '100%')
     .attr('stop-color', '#818cf8');
     
   // Градиент для оставшейся части
   const remainingGradient = defs.append('linearGradient')
     .attr('id', 'remaining-gradient')
     .attr('x1', '0%')
     .attr('y1', '0%')
     .attr('x2', '100%')
     .attr('y2', '100%');
     
   remainingGradient.append('stop')
     .attr('offset', '0%')
     .attr('stop-color', '#1e293b')
     .attr('stop-opacity', 0.3);
     
   remainingGradient.append('stop')
     .attr('offset', '100%')
     .attr('stop-color', '#1e293b')
     .attr('stop-opacity', 0.1);

   // Создаем функцию для построения дуг
   const arc = d3.arc()
     .innerRadius(radius * 0.7)
     .outerRadius(radius)
     .cornerRadius(10)
     .padAngle(0.02);

   // Генератор пончика
   const pie = d3.pie()
     .value(d => d.value)
     .sort(null)
     .padAngle(0.02);

   // Тень для сегмента
   const filter = defs.append('filter')
     .attr('id', 'drop-shadow')
     .attr('height', '130%');
   
   filter.append('feGaussianBlur')
     .attr('in', 'SourceAlpha')
     .attr('stdDeviation', 3)
     .attr('result', 'blur');
   
   filter.append('feOffset')
     .attr('in', 'blur')
     .attr('dx', 0)
     .attr('dy', 3)
     .attr('result', 'offsetBlur');
   
   const feComponentTransfer = filter.append('feComponentTransfer')
     .attr('in', 'offsetBlur')
     .attr('result', 'coloredBlur');
   
   feComponentTransfer.append('feFuncA')
     .attr('type', 'linear')
     .attr('slope', 0.5);
   
   const feMerge = filter.append('feMerge');
   feMerge.append('feMergeNode')
     .attr('in', 'coloredBlur');
   feMerge.append('feMergeNode')
     .attr('in', 'SourceGraphic');

   // Добавляем дуги с анимацией
   const arcs = svg.selectAll('path')
     .data(pie(data))
     .enter()
     .append('path')
     .attr('d', arc)
     .attr('fill', (d, i) => i === 0 ? 'url(#progress-gradient)' : 'url(#remaining-gradient)')
     .attr('stroke', '#0f172a')
     .attr('stroke-width', 1)
     .style('filter', (d, i) => i === 0 ? 'url(#drop-shadow)' : 'none')
     .style('opacity', 0)
     .transition()
     .duration(1000)
     .style('opacity', 1);

   // Добавляем текст в центр
   const centerGroup = svg.append('g');

   centerGroup.append('text')
     .attr('text-anchor', 'middle')
     .attr('dy', '-0.2em')
     .attr('font-size', '2.5rem')
     .attr('font-weight', 'bold')
     .attr('fill', '#f8fafc')
     .text(`${revenueData.completed}%`)
     .style('opacity', 0)
     .transition()
     .duration(800)
     .style('opacity', 1);

   centerGroup.append('text')
     .attr('text-anchor', 'middle')
     .attr('dy', '1.5em')
     .attr('font-size', '0.9rem')
     .attr('fill', '#94a3b8')
     .text('Прибыль')
     .style('opacity', 0)
     .transition()
     .duration(800)
     .delay(200)
     .style('opacity', 1);

   // Добавляем подпись снизу
   svg.append('text')
     .attr('text-anchor', 'middle')
     .attr('y', radius + 10)
     .attr('font-size', '1rem')
     .attr('font-weight', 'medium')
     .attr('fill', '#94a3b8')
     .text(`₽${revenueData.total.toLocaleString('ru-RU')}`)
     .style('opacity', 0)
     .transition()
     .duration(800)
     .delay(400)
     .style('opacity', 1);
 };

 // Функция для отрисовки графика моделей
 const renderModelsChart = () => {
   if (!modelsChartRef.current) return;
   d3.select(modelsChartRef.current).selectAll('*').remove();

   // Создаем контейнер
   const container = d3.select(modelsChartRef.current);

   // Сетка для карточек
   const grid = container.append('div')
     .style('display', 'grid')
     .style('grid-template-columns', 'repeat(auto-fill, minmax(250px, 1fr))')
     .style('gap', '16px');

   // Добавляем карточки моделей с анимацией
   modelData.forEach((model, index) => {
     const card = grid.append('div')
       .style('background', 'linear-gradient(145deg, #1e293b, #1a2234)')
       .style('border-radius', '16px')
       .style('padding', '16px')
       .style('box-shadow', '0 10px 15px -3px rgba(0, 0, 0, 0.3)')
       .style('position', 'relative')
       .style('overflow', 'hidden')
       .style('border', '1px solid rgba(30, 41, 59, 0.8)')
       .style('animation', `fadeInUp 0.6s ${index * 0.1}s both`);
     
     // Добавляем полоску цвета
     card.append('div')
       .style('position', 'absolute')
       .style('top', '0')
       .style('left', '0')
       .style('width', '100%')
       .style('height', '4px')
       .style('background', `linear-gradient(90deg, ${model.color}, ${model.color}80)`);
     
     // Добавляем блик для эффекта стекла
     card.append('div')
       .style('position', 'absolute')
       .style('top', '0')
       .style('left', '0')
       .style('width', '100%')
       .style('height', '100%')
       .style('background', 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, transparent 100%)');
     
     // Заголовок модели
     const header = card.append('div')
       .style('display', 'flex')
       .style('align-items', 'center')
       .style('justify-content', 'space-between')
       .style('margin-bottom', '16px');
     
     // Название и иконка
     const nameBlock = header.append('div')
       .style('display', 'flex')
       .style('align-items', 'center');
     
     nameBlock.append('div')
       .style('width', '40px')
       .style('height', '40px')
       .style('background', `linear-gradient(145deg, ${model.color}40, ${model.color}20)`)
       .style('border-radius', '12px')
       .style('margin-right', '12px')
       .style('display', 'flex')
       .style('align-items', 'center')
       .style('justify-content', 'center')
       .style('font-size', '20px')
       .text(model.icon);
     
     const nameInfo = nameBlock.append('div');
     
     nameInfo.append('div')
       .style('font-weight', 'bold')
       .style('color', '#f1f5f9')
       .style('font-size', '16px')
       .style('margin-bottom', '2px')
       .text(model.name);
     
     nameInfo.append('div')
       .style('color', '#94a3b8')
       .style('font-size', '12px')
       .text(model.category);
     
     // Значение и процент изменения
     const valueBlock = header.append('div')
       .style('text-align', 'right');
     
     valueBlock.append('div')
       .style('font-weight', 'bold')
       .style('color', '#f1f5f9')
       .style('font-size', '18px')
       .text(model.value.toLocaleString('ru-RU'));
     
     const changeColor = model.change >= 0 ? '#10b981' : '#ef4444';
     const changeIcon = model.change >= 0 ? '▲' : '▼';
     
     valueBlock.append('div')
       .style('color', changeColor)
       .style('font-size', '14px')
       .style('font-weight', 'medium')
       .text(`${changeIcon} ${Math.abs(model.change)}%`);
     
     // Прогресс-бар
     const progressContainer = card.append('div')
       .style('margin-top', '12px')
       .style('width', '100%')
       .style('height', '6px')
       .style('background', '#334155')
       .style('border-radius', '3px')
       .style('overflow', 'hidden');
     
     progressContainer.append('div')
       .style('height', '100%')
       .style('width', '0')
       .style('background', `linear-gradient(90deg, ${model.color}, ${model.color}90)`)
       .style('border-radius', '3px')
       .style('transition', 'width 1s ease-in-out')
       .style('width', `${Math.min(100, Math.abs(model.change) * 2)}%`);
     
     // Дополнительная информация внизу
     const footer = card.append('div')
       .style('display', 'flex')
       .style('justify-content', 'space-between')
       .style('margin-top', '16px');
     
     footer.append('div')
       .style('color', '#94a3b8')
       .style('font-size', '12px')
       .text('Продано: 85%');
     
     footer.append('div')
       .style('color', '#94a3b8')
       .style('font-size', '12px')
       .text('В наличии: 15%');
   });

   // Добавляем стили анимации
   const style = document.createElement('style');
   style.textContent = `
     @keyframes fadeInUp {
       from {
         opacity: 0;
         transform: translate3d(0, 20px, 0);
       }
       to {
         opacity: 1;
         transform: translate3d(0, 0, 0);
       }
     }
   `;
   document.head.appendChild(style);
 };

 // Функция для отрисовки графика статусов
 const renderStatusChart = () => {
   if (!statusChartRef.current) return;
   d3.select(statusChartRef.current).selectAll('*').remove();

   const width = statusChartRef.current.clientWidth;
   const height = 300;
   const margin = { top: 40, right: 20, bottom: 50, left: 50 };

   // Создаем SVG
   const svg = d3.select(statusChartRef.current)
     .append('svg')
     .attr('width', width)
     .attr('height', height)
     .style('overflow', 'visible');

   // Создаем фильтр для эффекта свечения
   const defs = svg.append('defs');
   const filter = defs.append('filter')
     .attr('id', 'glow');
   
   filter.append('feGaussianBlur')
     .attr('stdDeviation', '3.5')
     .attr('result', 'coloredBlur');
   
   const feMerge = filter.append('feMerge');
   feMerge.append('feMergeNode')
     .attr('in', 'coloredBlur');
   feMerge.append('feMergeNode')
     .attr('in', 'SourceGraphic');

   // Создаем градиенты для столбцов
   statusData.forEach((d, i) => {
     const gradientId = `status-gradient-${i}`;
     const gradient = defs.append('linearGradient')
       .attr('id', gradientId)
       .attr('x1', '0%')
       .attr('y1', '0%')
       .attr('x2', '0%')
       .attr('y2', '100%');
       
     gradient.append('stop')
       .attr('offset', '0%')
       .attr('stop-color', d3.color(d.color).brighter(0.5));
       
     gradient.append('stop')
       .attr('offset', '100%')
       .attr('stop-color', d.color);
   });

   // Создаем шкалы
   const x = d3.scaleBand()
     .domain(statusData.map(d => d.name))
     .range([margin.left, width - margin.right])
     .padding(0.5);

   const y = d3.scaleLinear()
     .domain([0, d3.max(statusData, d => d.value) * 1.1])
     .nice()
     .range([height - margin.bottom, margin.top]);

   // Добавляем оси
   svg.append('g')
     .attr('transform', `translate(0,${height - margin.bottom})`)
     .call(d3.axisBottom(x).tickSize(0))
     .call(g => g.select('.domain').remove())
     .selectAll('text')
     .attr('transform', 'rotate(-25)')
     .style('text-anchor', 'end')
     .style('font-size', '12px')
     .style('fill', '#94a3b8');

   svg.append('g')
     .attr('transform', `translate(${margin.left},0)`)
     .call(d3.axisLeft(y).ticks(5).tickFormat(d => d))
     .call(g => g.select('.domain').remove())
     .call(g => g.selectAll('.tick line')
       .attr('x2', width - margin.left - margin.right)
       .attr('stroke', '#334155')
       .attr('stroke-opacity', 0.2))
     .selectAll('text')
     .style('font-size', '12px')
     .style('fill', '#94a3b8');

   // Добавляем сетку
   svg.selectAll('.grid-line')
     .data(y.ticks(5))
     .enter()
     .append('line')
     .attr('class', 'grid-line')
     .attr('x1', margin.left)
     .attr('x2', width - margin.right)
     .attr('y1', d => y(d))
     .attr('y2', d => y(d))
     .attr('stroke', '#334155')
     .attr('stroke-opacity', 0.2)
     .attr('stroke-dasharray', '4,4');

   // Добавляем столбцы с анимацией
   svg.selectAll('.bar')
     .data(statusData)
     .enter()
     .append('rect')
     .attr('class', 'bar')
     .attr('x', d => x(d.name))
     .attr('width', x.bandwidth())
     .attr('y', height - margin.bottom)
     .attr('height', 0)
     .attr('rx', 8)
     .attr('fill', (d, i) => `url(#status-gradient-${i})`)
     .attr('stroke', '#0f172a')
     .attr('stroke-width', 1)
     .transition()
     .duration(800)
     .delay((d, i) => i * 100)
     .attr('y', d => y(d.value))
     .attr('height', d => height - margin.bottom - y(d.value));

   // Добавляем подписи над столбцами
   svg.selectAll('.bar-label')
     .data(statusData)
     .enter()
     .append('text')
     .attr('class', 'bar-label')
     .attr('x', d => x(d.name) + x.bandwidth() / 2)
     .attr('y', d => y(d.value) - 10)
     .attr('text-anchor', 'middle')
     .style('font-size', '12px')
     .style('font-weight', 'bold')
     .style('fill', d => d3.color(d.color).brighter(0.3))
     .style('filter', 'url(#glow)')
     .text(d => d.value)
     .style('opacity', 0)
     .transition()
     .duration(500)
     .delay((d, i) => i * 100 + 800)
     .style('opacity', 1);

   // Добавляем линию тренда
   const line = d3.line()
     .x(d => x(d.name) + x.bandwidth() / 2)
     .y(d => y(d.value))
     .curve(d3.curveMonotoneX);

   svg.append('path')
     .datum(statusData)
     .attr('fill', 'none')
     .attr('stroke', '#94a3b8')
     .attr('stroke-width', 2)
     .attr('stroke-dasharray', '6,4')
     .attr('d', line)
     .style('opacity', 0)
     .transition()
     .duration(800)
     .delay(1000)
     .style('opacity', 0.6);

   // Добавляем точки пересечения
   svg.selectAll('.dot')
     .data(statusData)
     .enter()
     .append('circle')
     .attr('class', 'dot')
     .attr('cx', d => x(d.name) + x.bandwidth() / 2)
     .attr('cy', d => y(d.value))
     .attr('r', 4)
     .attr('fill', '#f8fafc')
     .attr('stroke', d => d.color)
     .attr('stroke-width', 2)
     .style('filter', 'url(#glow)')
     .style('opacity', 0)
     .transition()
     .duration(300)
     .delay((d, i) => i * 100 + 1100)
     .style('opacity', 1);
 };

 // Функция форматирования чисел
 const formatNumber = (num) => {
   return num.toLocaleString('ru-RU');
 };

 return (
   <div className="bg-slate-900 text-white p-6 rounded-xl shadow-2xl border border-slate-800">
     <div className="flex justify-between items-center mb-6">
       <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">ОБЩИЙ СТАТУС ЗАКАЗОВ И ДОСТАВОК</h1>
       
       <div className="flex space-x-3">
         <button 
           onClick={() => setViewMode('grid')}
           className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
             viewMode === 'grid' 
               ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' 
               : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
           }`}
         >
           Сетка
         </button>
         <button 
           onClick={() => setViewMode('list')}
           className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
             viewMode === 'list' 
               ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' 
               : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
           }`}
         >
           Список
         </button>
       </div>
     </div>
     
     <p className="text-slate-400 mb-6 font-medium">
       СТАТУСЫ ЗАКАЗОВ: НЕ ОПЛАЧЕННЫЙ, В ОЧЕРЕДИ, В ПРОЦЕСС ДОСТАВКИ (В ПУТИ+РАСПРЕДЕЛЕНИЕ), У ДИЛЕРА
     </p>
     
     <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
       {/* Карточка с прогрессом */}
       <div className="lg:col-span-4 bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-xl border border-slate-700/50 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-blue-500/5 to-purple-500/5 z-0"></div>
         <div className="relative z-10">
           <div className="flex justify-between items-center mb-4">
             <h2 className="text-lg font-bold text-slate-200">Целевая выручка</h2>
             <div className="text-sm font-medium text-blue-400">План выполнен</div>
           </div>
           <div ref={donutChartRef} className="w-full" style={{ height: '280px' }}></div>
         </div>
       </div>
       
       {/* Карточка со статусом оплаты */}
       <div className="lg:col-span-8 bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-xl border border-slate-700/50 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-purple-500/5 to-pink-500/5 z-0"></div>
         <div className="relative z-10">
           <div className="flex justify-between items-center mb-4">
             <h2 className="text-lg font-bold text-slate-200">СТАТУС ОПЛАТЫ</h2>
             <div className="text-sm font-medium text-purple-400">
               Всего заказов: {statusData.reduce((acc, curr) => acc + curr.value, 0)}
             </div>
           </div>
           
           <div className="flex justify-center space-x-10 mb-6">
             {Object.entries(paymentCategories).map(([key, category]) => (
               <div key={key} className="flex flex-col items-center">
                 <div 
                   className="w-20 h-20 rounded-full flex items-center justify-center mb-2 shadow-lg"
                   style={{ 
                     background: `radial-gradient(circle, ${category.color}30 0%, ${category.color}10 70%)`,
                     boxShadow: `0 0 20px ${category.color}30`
                   }}
                 >
                   <span className="text-2xl font-bold" style={{ color: category.color }}>{category.value}</span>
                 </div>
                 <span className="text-sm font-medium text-slate-300">{category.name}</span>
               </div>
             ))}
           </div>
           
           {/* Прогресс-бар оплаты */}
           <div className="mb-6">
             <div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden shadow-inner">
               <div 
                 className="h-full rounded-full transition-all duration-1000" 
                 style={{ 
                   width: '65%', 
                   background: 'linear-gradient(to right, #10b981, #3b82f6)',
                   boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)' 
                 }}
               ></div>
             </div>
             <div className="flex justify-between mt-2 text-sm text-slate-400">
               <span>Оплачено: 65% (₽5,704)</span>
               <span>Не оплачено: 35% (₽3,092)</span>
             </div>
           </div>
           
           <div ref={statusChartRef} className="w-full" style={{ height: '220px' }}></div>
         </div>
       </div>
     </div>
     
     {/* Карточка с моделями */}
     <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-xl border border-slate-700/50 mb-6 relative overflow-hidden">
       <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-indigo-500/5 to-blue-500/5 z-0"></div>
       <div className="relative z-10">
         <div className="flex justify-between items-center mb-6">
           <h2 className="text-lg font-bold text-slate-200">ОБЩИЕ МОДЕЛИ В РАЗРЕЗЕ</h2>
         <select className="bg-slate-700 text-slate-200 px-3 py-2 rounded-lg border-0 focus:ring-2 focus:ring-blue-500">
             <option>Все категории</option>
             <option>Седан</option>
             <option>Хэтчбек</option>
             <option>Минивэн</option>
           </select>
         </div>
         <div ref={modelsChartRef} className="w-full" style={{ maxHeight: '450px', overflowY: 'auto' }}></div>
       </div>
     </div>
     
     {/* Нижний блок с таблицей */}
     <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-xl border border-slate-700/50 relative overflow-hidden">
       <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-cyan-500/5 to-emerald-500/5 z-0"></div>
       <div className="relative z-10">
         <h2 className="text-lg font-bold text-slate-200 mb-4">ОБЩИЕ СТАТУСЫ ЗАКАЗОВ</h2>
         
         <div className="overflow-x-auto">
           <table className="min-w-full">
             <thead>
               <tr className="border-b border-slate-700/50">
                 <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Статус</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Количество</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Процент</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Сумма (₽)</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Действия</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-700/50">
               {statusData.map((status) => {
                 const totalOrders = statusData.reduce((acc, curr) => acc + curr.value, 0);
                 const percent = ((status.value / totalOrders) * 100).toFixed(1);
                 const amount = Math.round(revenueData.current * (status.value / totalOrders));
                 
                 return (
                   <tr key={status.id} className="hover:bg-slate-700/30 transition-colors">
                     <td className="px-6 py-4 whitespace-nowrap">
                       <div className="flex items-center">
                         <div className="h-3 w-3 rounded-full mr-3" style={{ 
                           backgroundColor: status.color,
                           boxShadow: `0 0 10px ${status.color}70`
                         }}></div>
                         <div className="text-sm font-medium text-slate-300">{status.name}</div>
                       </div>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{status.value}</td>
                     <td className="px-6 py-4 whitespace-nowrap">
                       <div className="flex items-center">
                         <div className="text-sm text-slate-400 mr-2">{percent}%</div>
                         <div className="w-24 bg-slate-700 rounded-full h-2 overflow-hidden shadow-inner">
                           <div 
                             className="h-2 rounded-full" 
                             style={{ 
                               width: `${percent}%`, 
                               background: `linear-gradient(90deg, ${status.color}90, ${status.color})`,
                               boxShadow: `0 0 8px ${status.color}80`
                             }}
                           ></div>
                         </div>
                       </div>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{formatNumber(amount)} ₽</td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm">
                       <button className="text-blue-400 hover:text-blue-300 transition-colors px-2 py-1 bg-blue-500/10 rounded-lg mr-2">
                         Открыть
                       </button>
                       <button className="text-slate-400 hover:text-slate-300 transition-colors px-2 py-1 bg-slate-500/10 rounded-lg">
                         Детали
                       </button>
                     </td>
                   </tr>
                 );
               })}
             </tbody>
             <tfoot>
               <tr className="bg-slate-800/50">
                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-300">ИТОГО</td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-300">
                   {statusData.reduce((acc, curr) => acc + curr.value, 0)}
                 </td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-300">100%</td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-300">
                   {formatNumber(revenueData.current)} ₽
                 </td>
                 <td className="px-6 py-4 whitespace-nowrap"></td>
               </tr>
             </tfoot>
           </table>
         </div>
       </div>
     </div>

     {/* Добавляем стили анимации глобально */}
     <style>
       {`
         @keyframes fadeInUp {
           from {
             opacity: 0;
             transform: translate3d(0, 20px, 0);
           }
           to {
             opacity: 1;
             transform: translate3d(0, 0, 0);
           }
         }
         
         @keyframes pulse {
           0%, 100% {
             opacity: 1;
           }
           50% {
             opacity: 0.5;
           }
         }
         
         @keyframes glow {
           0%, 100% {
             filter: drop-shadow(0 0 5px rgba(59, 130, 246, 0.5));
           }
           50% {
             filter: drop-shadow(0 0 15px rgba(59, 130, 246, 0.8));
           }
         }
         
         .bg-clip-text {
           -webkit-background-clip: text;
           background-clip: text;
         }
         
         .text-transparent {
           color: transparent;
         }
       `}
     </style>
   </div>
 );
};

export default OrderTrackingDashboard;