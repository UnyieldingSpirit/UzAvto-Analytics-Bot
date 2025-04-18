'use client';
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { carModels, regions } from '@/src/shared/mocks/mock-data';

const OrderTrackingDashboard = () => {
  const donutChartRef = useRef(null);
  const modelsChartRef = useRef(null);
  const statusChartRef = useRef(null);
  const [viewMode, setViewMode] = useState('grid');
  
  // Добавляем состояния для навигации и детализации
  const [currentView, setCurrentView] = useState('general'); // 'general', 'region', 'model'
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  
  // Данные для прогресса выполнения плана
  const revenueData = {
    goal: 12000,
    current: 8796,
    completed: 68,
    total: 8796
  };

  // Интегрируем данные из mock-data.js
  const enhancedCarModels = carModels.map((car, index) => {
    const colors = ['#4747e5', '#60a5fa', '#34d399', '#f59e0b', '#ec4899', '#8b5cf6'];
    const icons = {
      'sedan': '🚗',
      'suv': '🚙',
      'minivan': '🚐',
      'hatchback': '🚙'
    };
    
    return {
      id: car.id,
      name: car.name,
      category: car.category,
      value: Math.floor(Math.random() * 50000) + 30000, // Случайное значение продаж
      change: Math.floor(Math.random() * 70) - 30, // Случайное изменение от -30% до +40%
      icon: icons[car.category] || '🚗',
      color: colors[index % colors.length],
      img: car.img
    };
  });

  // Используем регионы из mock-data.js
  const enhancedRegions = regions.map((region, index) => {
    const colors = ['#4747e5', '#60a5fa', '#34d399', '#f59e0b', '#ec4899', '#8b5cf6'];
    
    return {
      id: region.id,
      name: region.name,
      value: Math.floor(Math.random() * 200000) + 50000, // Случайное значение продаж по региону
      change: Math.floor(Math.random() * 40) - 20, // Случайное изменение от -20% до +20%
      color: colors[index % colors.length]
    };
  });

  // Генерация данных моделей по регионам
  const generateModelsByRegion = () => {
    const modelsByRegion = {};
    
    enhancedRegions.forEach(region => {
      // Выбираем случайное подмножество моделей для этого региона
      const modelsCount = Math.floor(Math.random() * (enhancedCarModels.length - 2)) + 2;
      const shuffledModels = [...enhancedCarModels].sort(() => 0.5 - Math.random()).slice(0, modelsCount);
      
      modelsByRegion[region.id] = shuffledModels.map(model => ({
        ...model,
        id: `${model.id}_${region.id}`,
        value: Math.floor(model.value * (0.5 + Math.random())), // Скорректированное значение для региона
        change: Math.floor(Math.random() * 60) - 30, // Случайное изменение для региона
      }));
    });
    
    return modelsByRegion;
  };

  const modelsByRegion = generateModelsByRegion();

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

  // Функция для обработки выбора региона
  const handleRegionSelect = (event) => {
    const regionId = event.target.value;
    if (regionId === 'all') {
      setSelectedRegion(null);
      setCurrentView('general');
    } else {
      const region = enhancedRegions.find(r => r.id === regionId);
      setSelectedRegion(region);
      setSelectedModel(null);
      setCurrentView('region');
    }
  };

  // Функция для обработки выбора модели
  const handleModelSelect = (event) => {
    const modelId = event.target.value;
    if (modelId === 'all') {
      setSelectedModel(null);
      if (selectedRegion) {
        setCurrentView('region');
      } else {
        setCurrentView('general');
      }
    } else {
      // Определяем, какой массив моделей использовать
      const modelsArray = selectedRegion 
        ? (modelsByRegion[selectedRegion.id] || [])
        : enhancedCarModels;
        
      const model = modelsArray.find(m => m.id === modelId);
      if (model) {
        setSelectedModel(model);
        setCurrentView('model');
      }
    }
  };

  // Функция для прямого выбора модели из карточки
  const handleModelCardClick = (model) => {
    setSelectedModel(model);
    setCurrentView('model');
  };

  // Функция для сброса всех фильтров и возврата к общему виду
  const resetFilters = () => {
    setSelectedRegion(null);
    setSelectedModel(null);
    setCurrentView('general');
  };

  useEffect(() => {
    renderDonutChart();
    
    // Отрисовываем графики в зависимости от текущего представления
    if (currentView === 'general' || currentView === 'region') {
      renderStatusChart();
    }
    
    renderModelsChart();
  }, [currentView, selectedRegion, selectedModel, viewMode]);

  // Функция для отрисовки диаграммы прогресса (пончик)
const renderDonutChart = () => {
  if (!donutChartRef.current) return;
  d3.select(donutChartRef.current).selectAll('*').remove();

  // Получаем размеры контейнера
  const containerRect = donutChartRef.current.getBoundingClientRect();
  const containerWidth = containerRect.width;
  const containerHeight = containerRect.height;
  
  // Устанавливаем ширину и высоту SVG элемента
  const width = containerWidth;
  const height = containerHeight;
  
  // Рассчитываем радиус диаграммы как процент от меньшей стороны
  const size = Math.min(width, height);
  const margin = size * 0.08; // Адаптивный отступ
  const radius = (size / 2) - margin;

  // Создаем SVG с адаптивными размерами
  const svg = d3.select(donutChartRef.current)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('overflow', 'visible')
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

  // Адаптивное скругление углов
  const cornerRadius = radius * 0.05;
  
  // Создаем функцию для построения дуг
  const arc = d3.arc()
    .innerRadius(radius * 0.7)
    .outerRadius(radius)
    .cornerRadius(cornerRadius)
    .padAngle(0.02);

  // Генератор пончика
  const pie = d3.pie()
    .value(d => d.value)
    .sort(null)
    .padAngle(0.02);

  // Тень для сегмента с адаптивными параметрами
  const filter = defs.append('filter')
    .attr('id', 'drop-shadow')
    .attr('height', '120%');
  
  filter.append('feGaussianBlur')
    .attr('in', 'SourceAlpha')
    .attr('stdDeviation', size * 0.008) // Адаптивное размытие
    .attr('result', 'blur');
  
  filter.append('feOffset')
    .attr('in', 'blur')
    .attr('dx', 0)
    .attr('dy', size * 0.004) // Адаптивное смещение
    .attr('result', 'offsetBlur');
  
  const feComponentTransfer = filter.append('feComponentTransfer')
    .attr('in', 'offsetBlur')
    .attr('result', 'coloredBlur');
  
  feComponentTransfer.append('feFuncA')
    .attr('type', 'linear')
    .attr('slope', 0.4);
  
  const feMerge = filter.append('feMerge');
  feMerge.append('feMergeNode')
    .attr('in', 'coloredBlur');
  feMerge.append('feMergeNode')
    .attr('in', 'SourceGraphic');

  // Создаем дуги с начальным нулевым углом для анимации
  const pieData = pie(data);
  
  // Добавляем фоновые (неактивные) дуги
  svg.selectAll('.background-arc')
    .data(pieData)
    .enter()
    .append('path')
    .attr('class', 'background-arc')
    .attr('d', arc)
    .attr('fill', (d, i) => i === 0 ? 'url(#progress-gradient)' : 'url(#remaining-gradient)')
    .attr('stroke', '#0f172a')
    .attr('stroke-width', 1)
    .style('opacity', (d, i) => i === 0 ? 0 : 0.8) // Показываем только неактивную часть
    .style('filter', (d, i) => i === 0 ? 'url(#drop-shadow)' : 'none');

  // Добавляем активные дуги с анимацией заполнения
  const activeArc = svg.append('path')
    .datum({
      startAngle: 0,
      endAngle: 0,
      padAngle: pieData[0].padAngle
    })
    .attr('d', arc)
    .attr('fill', 'url(#progress-gradient)')
    .attr('stroke', '#0f172a')
    .attr('stroke-width', 1)
    .style('filter', 'url(#drop-shadow)');

  // Функция для интерполяции угла дуги
  function arcTween(newAngle) {
    return function(d) {
      const interpolate = d3.interpolate(d.endAngle, newAngle);
      return function(t) {
        d.endAngle = interpolate(t);
        return arc(d);
      };
    };
  }

  // Анимация заполнения
  activeArc.transition()
    .duration(1500)
    .attrTween('d', arcTween(pieData[0].endAngle));

  // Адаптивные размеры шрифта
  const textSizeLarge = Math.max(radius * 0.3, 14); // Минимум 14px, но адаптивно
  const textSizeMedium = Math.max(radius * 0.12, 10); // Минимум 10px, но адаптивно
  const textSizeSmall = Math.max(radius * 0.1, 9); // Минимум 9px, но адаптивно

  // Добавляем текст в центр с анимацией появления
  const centerGroup = svg.append('g');

  // Процент выполнения (большой текст)
  centerGroup.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '-0.1em')
    .attr('font-size', `${textSizeLarge}px`)
    .attr('font-weight', 'bold')
    .attr('fill', '#f8fafc')
    .text('0%') // Начинаем с 0%
    .transition()
    .duration(1500)
    .tween('text', function() {
      const i = d3.interpolate(0, revenueData.completed);
      return function(t) {
        this.textContent = `${Math.round(i(t))}%`;
      };
    });

  // Подпись "Прибыль" (средний текст)
  centerGroup.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', `${textSizeLarge * 0.8}px`)
    .attr('font-size', `${textSizeMedium}px`)
    .attr('fill', '#94a3b8')
    .text('Прибыль')
    .style('opacity', 0)
    .transition()
    .duration(800)
    .delay(200)
    .style('opacity', 1);

  // Сумма (малый текст)
  svg.append('text')
    .attr('text-anchor', 'middle')
    .attr('y', radius * 0.5) // Размещаем ниже центра, но внутри диаграммы
    .attr('font-size', `${textSizeSmall}px`)
    .attr('font-weight', 'medium')
    .attr('fill', '#94a3b8')
    .text(`UZS${revenueData.total.toLocaleString('ru-RU')}`)
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

    // Определяем, какие данные использовать
    let data;
    if (currentView === 'general') {
      data = enhancedCarModels;
    } else if (currentView === 'region' && selectedRegion) {
      data = modelsByRegion[selectedRegion.id] || [];
    } else if (currentView === 'model' && selectedModel) {
      // Если мы на уровне модели, показываем только выбранную модель
      data = [selectedModel];
    } else {
      data = [];
    }

    // Создаем контейнер
    const container = d3.select(modelsChartRef.current);

    // Выбор типа отображения - сетка или список
    if (viewMode === 'grid') {
      // Сетка для карточек
      const grid = container.append('div')
        .style('display', 'grid')
        .style('grid-template-columns', 'repeat(auto-fill, minmax(250px, 1fr))')
        .style('gap', '16px');

      // Добавляем карточки моделей с анимацией и изображениями
      data.forEach((model, index) => {
        const isHovered = hoveredCard === model.id;
        
        const card = grid.append('div')
          .style('background', 'linear-gradient(145deg, #1e293b, #1a2234)')
          .style('border-radius', '16px')
          .style('padding', '16px')
          .style('box-shadow', isHovered ? 
            `0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 0 10px 2px ${model.color}40` : 
            '0 10px 15px -3px rgba(0, 0, 0, 0.3)')
          .style('position', 'relative')
          .style('overflow', 'hidden')
          .style('border', isHovered ? 
            `1px solid ${model.color}80` : 
            '1px solid rgba(30, 41, 59, 0.8)')
          .style('transform', isHovered ? 'translateY(-5px)' : 'none')
          .style('transition', 'all 0.3s ease-in-out')
          .style('cursor', 'pointer')
          .style('animation', `fadeInUp 0.6s ${index * 0.1}s both`)
          .on('mouseenter', () => {
            setHoveredCard(model.id);
          })
          .on('mouseleave', () => {
            setHoveredCard(null);
          })
          .on('click', () => {
            handleModelCardClick(model);
          });
          
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
        
        // Название и иконка/изображение
        const nameBlock = header.append('div')
          .style('display', 'flex')
          .style('align-items', 'center');
        
        // Используем изображение из mock-data вместо иконки
        nameBlock.append('div')
          .style('width', '48px')
          .style('height', '48px')
          .style('background', `linear-gradient(145deg, ${model.color}40, ${model.color}20)`)
          .style('border-radius', '12px')
          .style('margin-right', '12px')
          .style('display', 'flex')
          .style('align-items', 'center')
          .style('justify-content', 'center')
          .style('overflow', 'hidden')
          .append('img')
          .attr('src', model.img)
          .style('width', '100%')
          .style('height', '100%')
          .style('object-fit', 'contain');
        
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
          .text(getCategoryName(model.category));
        
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
    } else {
      // Отображение списком
      const list = container.append('div')
        .style('width', '100%')
        .style('background', 'linear-gradient(145deg, #1e293b, #1a2234)')
        .style('border-radius', '16px')
        .style('overflow', 'hidden')
        .style('border', '1px solid rgba(30, 41, 59, 0.8)');
      
      data.forEach((model, index) => {
        const isHovered = hoveredCard === model.id;
        
        const listItem = list.append('div')
          .style('padding', '16px')
          .style('border-bottom', index < data.length - 1 ? '1px solid rgba(30, 41, 59, 0.8)' : 'none')
          .style('background', isHovered ? `linear-gradient(145deg, #1e293b, ${model.color}10)` : 'transparent')
          .style('transition', 'all 0.3s ease-in-out')
          .style('cursor', 'pointer')
          .style('animation', `fadeInUp 0.6s ${index * 0.05}s both`)
          .on('mouseenter', () => {
            setHoveredCard(model.id);
          })
          .on('mouseleave', () => {
            setHoveredCard(null);
          })
          .on('click', () => {
            handleModelCardClick(model);
          });
        
        const rowContent = listItem.append('div')
          .style('display', 'flex')
          .style('align-items', 'center')
          .style('justify-content', 'space-between');
        
        // Левая часть с изображением и названием
        const leftPart = rowContent.append('div')
          .style('display', 'flex')
          .style('align-items', 'center');
        
        leftPart.append('div')
          .style('width', '48px')
          .style('height', '48px')
          .style('background', `linear-gradient(145deg, ${model.color}40, ${model.color}20)`)
          .style('border-radius', '12px')
          .style('margin-right', '16px')
          .style('display', 'flex')
          .style('align-items', 'center')
          .style('justify-content', 'center')
          .style('overflow', 'hidden')
          .append('img')
          .attr('src', model.img)
          .style('width', '100%')
          .style('height', '100%')
          .style('object-fit', 'contain');
        
        const nameContainer = leftPart.append('div');
        
        nameContainer.append('div')
          .style('font-weight', 'bold')
          .style('color', '#f1f5f9')
          .style('font-size', '16px')
          .text(model.name);
        
        nameContainer.append('div')
          .style('color', '#94a3b8')
          .style('font-size', '12px')
          .text(getCategoryName(model.category));
        
        // Правая часть с значениями
        const rightPart = rowContent.append('div')
          .style('display', 'flex')
          .style('align-items', 'center')
          .style('gap', '32px');
        
        const changeColor = model.change >= 0 ? '#10b981' : '#ef4444';
        const changeIcon = model.change >= 0 ? '▲' : '▼';
        
        // Изменение
        const changeContainer = rightPart.append('div')
          .style('display', 'flex')
          .style('flex-direction', 'column')
          .style('align-items', 'flex-end');
        
        changeContainer.append('div')
          .style('color', '#94a3b8')
          .style('font-size', '12px')
          .text('Изменение');
        
        changeContainer.append('div')
          .style('color', changeColor)
          .style('font-size', '14px')
          .style('font-weight', 'bold')
          .text(`${changeIcon} ${Math.abs(model.change)}%`);
        
        // Продажи
        const salesContainer = rightPart.append('div')
          .style('display', 'flex')
          .style('flex-direction', 'column')
          .style('align-items', 'flex-end');
        
        salesContainer.append('div')
          .style('color', '#94a3b8')
          .style('font-size', '12px')
          .text('Продажи');
        
        salesContainer.append('div')
          .style('color', '#f1f5f9')
          .style('font-size', '14px')
          .style('font-weight', 'bold')
          .text(model.value.toLocaleString('ru-RU'));
        
        // Статус
        const statusContainer = rightPart.append('div');
        
        statusContainer.append('div')
          .style('background', `${model.color}20`)
          .style('color', model.color)
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .style('padding', '4px 12px')
          .style('border-radius', '16px')
          .style('border', `1px solid ${model.color}40`)
          .text('В наличии');
      });
    }

    // На уровне модели показываем дополнительную информацию
    if (currentView === 'model' && selectedModel) {
      // Детальная информация о модели
      const detailSection = container.append('div')
        .style('margin-top', '20px')
        .style('background', 'linear-gradient(145deg, #1e293b, #1a2234)')
        .style('border-radius', '16px')
        .style('padding', '20px')
        .style('animation', 'fadeInUp 0.6s both');
      
      detailSection.append('h3')
        .style('font-size', '1.2rem')
        .style('font-weight', 'bold')
        .style('color', '#f1f5f9')
        .style('margin-bottom', '15px')
        .text('Детальная информация');
      
      // Создаем сетку для информационных блоков
      const infoGrid = detailSection.append('div')
        .style('display', 'grid')
        .style('grid-template-columns', 'repeat(auto-fit, minmax(200px, 1fr))')
        .style('gap', '15px');
      
      // Блок с основной информацией
      const mainInfo = infoGrid.append('div')
        .style('background', 'rgba(15, 23, 42, 0.5)')
        .style('border-radius', '12px')
        .style('padding', '15px')
        .style('border', '1px solid rgba(59, 130, 246, 0.2)');
      
      mainInfo.append('h4')
        .style('font-size', '0.9rem')
        .style('color', '#94a3b8')
        .style('margin-bottom', '10px')
        .text('Основные показатели');
      
      // Создаем таблицу с метриками
      const metrics = [
        { label: 'Общий объем продаж', value: selectedModel.value.toLocaleString('ru-RU') + '  UZS' },
        { label: 'Изменение к прошлому периоду', value: (selectedModel.change >= 0 ? '+' : '') + selectedModel.change + '%' },
        { label: 'Средняя цена', value: Math.round(selectedModel.value / 100).toLocaleString('ru-RU') + '  UZS' },
        { label: 'Регионы с наличием', value: '6 из 12' }
      ];
      
      metrics.forEach(metric => {
        const row = mainInfo.append('div')
          .style('display', 'flex')
          .style('justify-content', 'space-between')
          .style('margin-bottom', '8px')
          .style('padding-bottom', '8px')
          .style('border-bottom', '1px solid rgba(59, 130, 246, 0.1)');
        
        row.append('div')
          .style('font-size', '0.85rem')
          .style('color', '#cbd5e1')
          .text(metric.label);
        
        row.append('div')
          .style('font-size', '0.85rem')
          .style('font-weight', 'bold')
          .style('color', '#f1f5f9')
          .text(metric.value);
      });
      
      // Блок со спецификациями
      const specsInfo = infoGrid.append('div')
        .style('background', 'rgba(15, 23, 42, 0.5)')
        .style('border-radius', '12px')
        .style('padding', '15px')
        .style('border', '1px solid rgba(59, 130, 246, 0.2)');
      
      specsInfo.append('h4')
        .style('font-size', '0.9rem')
        .style('color', '#94a3b8')
        .style('margin-bottom', '10px')
        .text('Спецификации');
      
      // Характеристики модели
      const specs = [
        { label: 'Категория', value: getCategoryName(selectedModel.category) },
        { label: 'Мощность', value: '105 л.с.' },
        { label: 'Объем двигателя', value: '1.6 л' },
        { label: 'КПП', value: 'АКПП' }
      ];
      
      specs.forEach(spec => {
        const row = specsInfo.append('div')
          .style('display', 'flex')
          .style('justify-content', 'space-between')
          .style('margin-bottom', '8px')
          .style('padding-bottom', '8px')
          .style('border-bottom', '1px solid rgba(59, 130, 246, 0.1)');
        
        row.append('div')
          .style('font-size', '0.85rem')
          .style('color', '#cbd5e1')
          .text(spec.label);
        
        row.append('div')
          .style('font-size', '0.85rem')
          .style('font-weight', 'bold')
          .style('color', '#f1f5f9')
          .text(spec.value);
      });
      
      // Если есть выбранный регион, показываем информацию о модели в этом регионе
      if (selectedRegion) {
        const regionInfo = infoGrid.append('div')
          .style('background', 'rgba(15, 23, 42, 0.5)')
          .style('border-radius', '12px')
          .style('padding', '15px')
          .style('border', '1px solid rgba(59, 130, 246, 0.2)');
        
        regionInfo.append('h4')
          .style('font-size', '0.9rem')
          .style('color', '#94a3b8')
          .style('margin-bottom', '10px')
          .text(`Показатели в регионе ${selectedRegion.name}`);
        
        // Метрики по региону
        const regionMetrics = [
          { label: 'Продажи в регионе', value: Math.round(selectedModel.value * 0.4).toLocaleString('ru-RU') + '  UZS' },
          { label: 'Доля в регионе', value: '32%' },
          { label: 'Рост в регионе', value: '+15.7%' },
          { label: 'Наличие у дилеров', value: '12 шт.' }
        ];
        
        regionMetrics.forEach(metric => {
          const row = regionInfo.append('div')
            .style('display', 'flex')
            .style('justify-content', 'space-between')
            .style('margin-bottom', '8px')
            .style('padding-bottom', '8px')
            .style('border-bottom', '1px solid rgba(59, 130, 246, 0.1)');
          
          row.append('div')
            .style('font-size', '0.85rem')
            .style('color', '#cbd5e1')
            .text(metric.label);
          
          row.append('div')
            .style('font-size', '0.85rem')
            .style('font-weight', 'bold')
            .style('color', '#f1f5f9')
            .text(metric.value);
        });
      }
      
      // Добавляем большое изображение модели
      const imageSection = detailSection.append('div')
        .style('margin-top', '20px')
        .style('background', 'rgba(15, 23, 42, 0.5)')
        .style('border-radius', '12px')
        .style('padding', '15px')
        .style('border', '1px solid rgba(59, 130, 246, 0.2)');
      
      imageSection.append('h4')
        .style('font-size', '0.9rem')
        .style('color', '#94a3b8')
        .style('margin-bottom', '10px')
        .text('Изображение модели');
      
      const imageContainer = imageSection.append('div')
        .style('height', '200px')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('justify-content', 'center')
        .style('background', `linear-gradient(145deg, ${selectedModel.color}10, ${selectedModel.color}05)`)
        .style('border-radius', '8px')
        .style('overflow', 'hidden');
      
      imageContainer.append('img')
        .attr('src', selectedModel.img)
        .style('max-height', '180px')
        .style('max-width', '100%')
        .style('object-fit', 'contain')
        .style('filter', 'drop-shadow(0 0 8px rgba(0, 0, 0, 0.3))');
    }

    // Добавляем стили анимации
    if (!document.querySelector('style[data-animation="fadeInUp"]')) {
      const style = document.createElement('style');
      style.setAttribute('data-animation', 'fadeInUp');
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
    }
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

  // Функция для получения русского названия категории
  const getCategoryName = (category) => {
    const categories = {
      'sedan': 'Седан',
      'suv': 'Внедорожник',
      'minivan': 'Минивэн',
      'hatchback': 'Хэтчбек'
    };
    return categories[category] || category;
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
      
      {/* Навигационная панель и фильтры */}
      <div className="bg-slate-800 p-4 rounded-xl mb-6 border border-slate-700/50 shadow-md">
        <div className="flex flex-wrap items-center gap-4">
          {/* Сброс всех фильтров */}
          <button 
            onClick={resetFilters}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-all flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Сбросить
          </button>
          
          {/* Выбор региона */}
          <div className="flex items-center">
            <span className="text-slate-400 mr-2 text-sm">Регион:</span>
            <select 
              value={selectedRegion ? selectedRegion.id : 'all'}
              onChange={handleRegionSelect}
              className="bg-slate-700 text-slate-200 px-3 py-2 rounded-lg border-0 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все регионы</option>
              {enhancedRegions.map(region => (
                <option key={region.id} value={region.id}>{region.name}</option>
              ))}
            </select>
          </div>
          
          {/* Выбор модели */}
          <div className="flex items-center">
            <span className="text-slate-400 mr-2 text-sm">Модель:</span>
            <select 
              value={selectedModel ? selectedModel.id : 'all'}
              onChange={handleModelSelect}
              className="bg-slate-700 text-slate-200 px-3 py-2 rounded-lg border-0 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все модели</option>
              {/* Показываем список моделей в зависимости от выбранного региона */}
              {(selectedRegion 
                ? (modelsByRegion[selectedRegion.id] || []) 
                : enhancedCarModels
              ).map(model => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </select>
          </div>
          
          {/* Отображение текущего пути */}
          <div className="flex items-center ml-auto">
            <span className="text-slate-400 text-sm">Просмотр:</span>
            <div className="flex items-center ml-2">
              <span className="text-blue-400 font-medium text-sm">
                {currentView === 'general' 
                  ? 'Общий обзор' 
                  : currentView === 'region' 
                    ? `Регион: ${selectedRegion?.name}` 
                    : currentView === 'model' && selectedRegion 
                      ? `${selectedRegion.name} > ${selectedModel?.name}` 
                      : `Модель: ${selectedModel?.name}`
                }
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-slate-400 mb-6 font-medium">
        {currentView === 'general' 
          ? 'СТАТУСЫ ЗАКАЗОВ: НЕ ОПЛАЧЕННЫЙ, В ОЧЕРЕДИ, В ПРОЦЕСС ДОСТАВКИ (В ПУТИ+РАСПРЕДЕЛЕНИЕ), У ДИЛЕРА'
          : currentView === 'region'
            ? `СТАТИСТИКА ПО РЕГИОНУ: ${selectedRegion?.name}`
            : `ДЕТАЛЬНАЯ ИНФОРМАЦИЯ ПО МОДЕЛИ: ${selectedModel?.name}`}
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Карточка с прогрессом */}
<div className="lg:col-span-4 bg-gradient-to-br from-slate-800 to-slate-900 p-5 rounded-2xl shadow-xl border border-slate-700/50 relative overflow-hidden">
  <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-blue-500/5 to-purple-500/5 z-0"></div>
  <div className="relative z-10 flex flex-col h-full">
    <div className="flex justify-between items-center mb-2">
      <h2 className="text-lg font-bold text-slate-200">Целевая выручка</h2>
      <div className="text-sm font-medium text-blue-400">План выполнен</div>
    </div>
            <div className="flex-1 flex items-center justify-center">
      <div ref={donutChartRef} className="w-full h-full aspect-square max-h-64"></div>
    </div>
          </div>
        </div>
        
        {/* Карточка со статусом оплаты - отображаем только на общем экране и экране региона */}
        {currentView !== 'model' && (
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
                  <span>Оплачено: 65% (UZS 5,704)</span>
                  <span>Не оплачено: 35% (UZS 3,092)</span>
                </div>
              </div>
              
              <div ref={statusChartRef} className="w-full" style={{ height: '220px' }}></div>
            </div>
          </div>
        )}
        
        {/* Если мы в режиме модели, показываем детальную информацию */}
        {currentView === 'model' && (
          <div className="lg:col-span-8 bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-xl border border-slate-700/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-purple-500/5 to-pink-500/5 z-0"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-200">
                  {selectedModel?.name} {selectedRegion ? `в регионе ${selectedRegion?.name}` : '- Общая статистика'}
                </h2>
                <div className="text-sm font-medium text-purple-400">
                  {getCategoryName(selectedModel?.category)}
                </div>
              </div>
              
              {/* Показатели модели */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                  <h3 className="text-sm text-slate-400 mb-1">Объем продаж</h3>
                  <div className="text-xl font-bold text-white">
                    {formatNumber(selectedModel?.value || 0)} UZS
                  </div>
                </div>
                
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                  <h3 className="text-sm text-slate-400 mb-1">Изменение</h3>
                  <div className={`text-xl font-bold ${selectedModel?.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {selectedModel?.change >= 0 ? '+' : ''}{selectedModel?.change}%
                  </div>
                </div>
                
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                  <h3 className="text-sm text-slate-400 mb-1">Заказы в процессе</h3>
                  <div className="text-xl font-bold text-blue-500">
                    34 шт.
                  </div>
                </div>
              </div>
              
              {/* График показателей модели */}
              <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 p-4 mb-4 h-56 flex flex-col justify-center">
                <div className="text-center mb-4">
                  <img 
                    src={selectedModel?.img} 
                    alt={selectedModel?.name} 
                    className="h-32 mx-auto object-contain" 
                  />
                </div>
                <p className="text-slate-400 text-center">
                  Здесь будет график динамики продаж {selectedModel?.name}
                  {selectedRegion ? ` в регионе ${selectedRegion.name}` : ' по всем регионам'}
                </p>
              </div>
              
              {/* Таблица распределения по статусам */}
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Статус</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Количество</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Сумма (UZS)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {statusData.slice(0, 4).map((status) => (
                      <tr key={status.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-3 w-3 rounded-full mr-3" style={{ 
                              backgroundColor: status.color,
                              boxShadow: `0 0 10px ${status.color}70`
                            }}></div>
                            <div className="text-sm text-slate-300">{status.name}</div>
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-400 text-right">{Math.round(status.value * 0.3)}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-400 text-right">
                          {formatNumber(Math.round(selectedModel?.value || 0 * (status.value / 800) * 0.3))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Карточка с моделями или регионами */}
      <div className="bg-gradient-to-br h-full from-slate-800 to-slate-900 p-6 rounded-2xl shadow-xl border border-slate-700/50 mb-6 relative ">
        <div className=" w-full h-full bg-gradient-to-br from-indigo-500/5 to-blue-500/5 z-0"></div>
        <div className="">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-200">
              {currentView === 'general' 
                ? 'ОБЩИЕ МОДЕЛИ В РАЗРЕЗЕ'
                : currentView === 'region'
                  ? `МОДЕЛИ В РЕГИОНЕ: ${selectedRegion?.name}`
                  : currentView === 'model' && selectedRegion
                    ? `ДЕТАЛЬНАЯ ИНФОРМАЦИЯ: ${selectedModel?.name} В ${selectedRegion?.name}`
                    : `ДЕТАЛЬНАЯ ИНФОРМАЦИЯ: ${selectedModel?.name}`}
            </h2>
            
            {/* Фильтр для моделей */}
            {(currentView === 'general' || currentView === 'region') && (
              <select className="bg-slate-700 text-slate-200 px-3 py-2 rounded-lg border-0 focus:ring-2 focus:ring-blue-500">
                <option>Все категории</option>
                <option>Седан</option>
                <option>Внедорожник</option>
                <option>Минивэн</option>
                <option>Хэтчбек</option>
              </select>
            )}
          </div>
          <div ref={modelsChartRef} className="w-full" style={{ maxHeight: '450px', overflowY: 'auto' }}></div>
        </div>
      </div>
      
      {/* Нижний блок с таблицей - отображаем только на общем экране */}
      {currentView === 'general' && (
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Сумма (UZS)</th>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{formatNumber(amount)} UZS</td>
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
                      {formatNumber(revenueData.current)} UZS
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

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