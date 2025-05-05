'use client';
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import ContentReadyLoader from '@/src/shared/layout/ContentReadyLoader';

const ModelTrackingDashboard = () => {
  const donutChartRef = useRef(null);
  const modelsChartRef = useRef(null);
  const statusChartRef = useRef(null);
  
  const [viewMode, setViewMode] = useState('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [isWholesale, setIsWholesale] = useState(false); // Флаг для отображения опт/розница
  const [data, setData] = useState([]);
  
  // Состояния для фильтрации и навигации
  const [currentView, setCurrentView] = useState('general');
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [filterModel, setFilterModel] = useState('all');
  const [filterRegion, setFilterRegion] = useState('all');

  // Функция для загрузки данных
  const fetchData = async (isWholesale) => {
    setIsLoading(true);
    try {
      // URL для загрузки данных
      const url = isWholesale 
        ? 'https://uzavtosalon.uz/b/dashboard/infos&contract_state_wholesale' 
        : 'https://uzavtosalon.uz/b/dashboard/infos&contract_state';
      
      const response = await fetch(url);
      const jsonData = await response.json();
      setData(jsonData);
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Переключение между оптом и розницей
  const toggleWholesale = (wholesale) => {
    setIsWholesale(wholesale);
    fetchData(wholesale);
  };
  
  // Загрузка начальных данных при монтировании компонента
  useEffect(() => {
    fetchData(isWholesale);
  }, []);
  
  // Функция для форматирования данных из API в нужный формат
const formatApiData = () => {
  // Если данных нет, возвращаем пустые массивы
  if (!data || !data.length) {
    return { regions: [], models: [], modelsByRegion: {} };
  }
  
  // Массив уникальных регионов
  const regions = data.map((region, index) => ({
    id: `region-${index}`,
    name: region.region,
    value: region.models.reduce((sum, model) => sum + parseInt(model.total_count || 0), 0),
    color: getRegionColor(index)
  }));
  
  // Создаем уникальный список моделей из всех регионов
  const uniqueModels = [];
  const modelMap = new Map();
  
  data.forEach(region => {
    region.models.forEach(model => {
      if (!modelMap.has(model.model)) {
        modelMap.set(model.model, {
          id: `model-${uniqueModels.length}`,
          name: model.model,
          image: model.image,
          value: 0,
          totalCount: 0,
          state_new: 0,
          state_waiting: 0,
          state_complete: 0,
          state_moving: 0,
          state_reserved: 0,
          state_binding: 0,
          state_booked: 0
        });
        uniqueModels.push(modelMap.get(model.model));
      }
      
      // Обновляем общее количество и стоимость
      const modelData = modelMap.get(model.model);
      modelData.totalCount += parseInt(model.total_count || 0);
      modelData.value += parseInt(model.total_count || 0) * getModelBasePrice(model.model);
      
      // Также добавляем суммирование по статусам
      modelData.state_new += parseInt(model.state_new || 0);
      modelData.state_waiting += parseInt(model.state_waiting || 0);
      modelData.state_complete += parseInt(model.state_complete || 0);
      modelData.state_moving += parseInt(model.state_moving || 0);
      modelData.state_reserved += parseInt(model.state_reserved || 0);
      modelData.state_binding += parseInt(model.state_binding || 0);
      modelData.state_booked += parseInt(model.state_booked || 0);
    });
  });
  
  // Назначаем уникальные цвета моделям
  uniqueModels.forEach((model, index) => {
    model.color = getModelColor(index);
  });
  
  // Генерируем данные моделей по регионам
  const modelsByRegion = {};
  
  data.forEach((region, regionIndex) => {
    const regionId = `region-${regionIndex}`;
    modelsByRegion[regionId] = [];
    
    region.models.forEach(model => {
      const baseModel = modelMap.get(model.model);
      if (baseModel) {
        modelsByRegion[regionId].push({
          ...baseModel,
          id: `${baseModel.id}_${regionId}`,
          region: region.region,
          regionId: regionId,
          totalCount: parseInt(model.total_count || 0),
          value: parseInt(model.total_count || 0) * getModelBasePrice(model.model),
          state_new: parseInt(model.state_new || 0),
          state_waiting: parseInt(model.state_waiting || 0),
          state_complete: parseInt(model.state_complete || 0),
          state_moving: parseInt(model.state_moving || 0),
          state_reserved: parseInt(model.state_reserved || 0),
          state_binding: parseInt(model.state_binding || 0),
          state_booked: parseInt(model.state_booked || 0)
        });
      }
    });
  });
  
  return {
    regions: regions,
    models: uniqueModels,
    modelsByRegion: modelsByRegion
  };
};
  
  // Получаем данные из API
  const { regions, models, modelsByRegion } = formatApiData();
  
  // Данные для прогресса выполнения плана
  const calculateRevenueData = () => {
    const totalCars = models.reduce((sum, model) => sum + model.totalCount, 0);
    const totalValue = models.reduce((sum, model) => sum + model.value, 0);
    const goal = totalValue * 1.5; // Целевое значение на 50% больше текущего
    const completed = Math.round((totalValue / goal) * 100);
    
    return {
      goal: goal,
      current: totalValue,
      completed: completed,
      total: totalValue
    };
  };
  
  const revenueData = calculateRevenueData();
  
  // Данные статусов заказов на основе реальных данных
  const calculateStatusData = () => {
    let totalNew = 0;
    let totalWaiting = 0;
    let totalComplete = 0;
    let totalMoving = 0;
    let totalReserved = 0;
    let totalBinding = 0;
    let totalBooked = 0;
    
    // Суммируем значения по всем моделям и регионам
    // Если выбран регион, суммируем только по этому региону
    if (selectedRegion) {
      const regionModels = modelsByRegion[selectedRegion.id] || [];
      regionModels.forEach(model => {
        totalNew += model.state_new || 0;
        totalWaiting += model.state_waiting || 0;
        totalComplete += model.state_complete || 0;
        totalMoving += model.state_moving || 0;
        totalReserved += model.state_reserved || 0;
        totalBinding += model.state_binding || 0;
        totalBooked += model.state_booked || 0;
      });
    } else {
      data.forEach(region => {
        region.models.forEach(model => {
          totalNew += parseInt(model.state_new || 0);
          totalWaiting += parseInt(model.state_waiting || 0);
          totalComplete += parseInt(model.state_complete || 0);
          totalMoving += parseInt(model.state_moving || 0);
          totalReserved += parseInt(model.state_reserved || 0);
          totalBinding += parseInt(model.state_binding || 0);
          totalBooked += parseInt(model.state_booked || 0);
        });
      });
    }
    
    return [
      { id: 'neopl', name: 'Не оплаченный', value: totalNew, color: '#ef4444' },
      { id: 'ocheredi', name: 'В очереди', value: totalWaiting, color: '#f59e0b' },
      { id: 'process', name: 'Завершенные', value: totalComplete, color: '#10b981' },
      { id: 'dostavka', name: 'В пути', value: totalMoving, color: '#8b5cf6' },
      { id: 'raspredelenie', name: 'Зарезервировано', value: totalReserved + totalBinding, color: '#3b82f6' },
      { id: 'diler', name: 'Забронировано', value: totalBooked, color: '#6366f1' }
    ];
  };
  
  const statusData = calculateStatusData();
  
  // Статусы оплаты
  const calculatePaymentCategories = () => {
    const totalPaid = statusData.reduce((sum, status) => {
      // Считаем оплаченными все статусы, кроме "Не оплаченный"
      if (status.id !== 'neopl') {
        return sum + status.value;
      }
      return sum;
    }, 0);
    
    const totalUnpaid = statusData.find(s => s.id === 'neopl')?.value || 0;
    
    return {
      'oplachen': { name: 'ОПЛАЧЕНО', value: totalPaid, color: '#10b981' },
      'neoplachen': { name: 'НЕ ОПЛАЧЕНО', value: totalUnpaid, color: '#ef4444' }
    };
  };
  
  const paymentCategories = calculatePaymentCategories();
  
  // Функция для получения базовой цены модели
  function getModelBasePrice(modelName) {
    const prices = {
      'COBALT': 12000,
      'DAMAS-2': 9500,
      'ONIX': 16000,
      'TRACKER-2': 22000
    };
    return prices[modelName] || 15000;
  }
  
  // Функция для получения цвета модели по индексу
  function getModelColor(index) {
    const colors = ['#4747e5', '#60a5fa', '#34d399', '#f59e0b', '#ec4899', '#8b5cf6'];
    return colors[index % colors.length];
  }
  
  // Функция для получения цвета региона по индексу
  function getRegionColor(index) {
    const colors = ['#4747e5', '#60a5fa', '#34d399', '#f59e0b', '#ec4899', '#8b5cf6'];
    return colors[index % colors.length];
  }

  // Функция для обработки выбора региона
  const handleRegionSelect = (event) => {
    const regionId = event.target.value;
    setFilterRegion(regionId);
    
    if (regionId === 'all') {
      setSelectedRegion(null);
      setCurrentView('general');
    } else {
      const region = regions.find(r => r.id === regionId);
      setSelectedRegion(region);
      setSelectedModel(null);
      setCurrentView('region');
    }
  };

  // Функция для обработки выбора модели
  const handleModelSelect = (event) => {
    const modelName = event.target.value;
    setFilterModel(modelName);
    
    if (modelName === 'all') {
      setSelectedModel(null);
      if (selectedRegion) {
        setCurrentView('region');
      } else {
        setCurrentView('general');
      }
    } else {
      // Находим модель по имени в массиве моделей
      const modelArray = selectedRegion 
        ? (modelsByRegion[selectedRegion.id] || [])
        : models;
        
      const model = modelArray.find(m => m.name === modelName);
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

  // Функция для сброса всех фильтров
  const resetFilters = () => {
    setSelectedRegion(null);
    setSelectedModel(null);
    setCurrentView('general');
    setFilterModel('all');
    setFilterRegion('all');
  };
  
  // Фильтрация моделей на основе выбранных фильтров
  const getFilteredModels = () => {
    // Определяем базовый набор моделей
    let filteredModels = [];
    
    if (currentView === 'general') {
      filteredModels = [...models];
    } else if (currentView === 'region' && selectedRegion) {
      filteredModels = modelsByRegion[selectedRegion.id] || [];
    } else if (currentView === 'model' && selectedModel) {
      filteredModels = [selectedModel];
    }
    
    // Применяем фильтр по модели
    if (filterModel !== 'all' && currentView !== 'model') {
      filteredModels = filteredModels.filter(model => model.name === filterModel);
    }
    
    return filteredModels;
  };

  useEffect(() => {
    renderDonutChart();
    
    // Отрисовываем графики в зависимости от текущего представления
    if (currentView === 'general' || currentView === 'region') {
      renderStatusChart();
    }
    
    renderModelsChart();
  }, [currentView, selectedRegion, selectedModel, viewMode, filterModel, filterRegion, data]);

  // Функция форматирования чисел
  const formatNumber = (num) => {
    return num.toLocaleString('ru-RU');
  };

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

    // Применяем фильтрацию моделей
    const data = getFilteredModels();

    // Создаем контейнер
    const container = d3.select(modelsChartRef.current);

    // Если нет данных, показываем сообщение
    if (!data.length) {
      container.append('div')
        .style('text-align', 'center')
        .style('padding', '30px')
        .style('color', '#94a3b8')
        .style('font-size', '16px')
        .text('Нет данных для отображения');
      return;
    }

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
        
        // Название и изображение
        const nameBlock = header.append('div')
          .style('display', 'flex')
          .style('align-items', 'center');
        
        // Используем изображение для отображения
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
          .attr('src', `https://uzavtosalon.uz/b/core/m$load_image?sha=${model.image}&width=400&height=400`)
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
        
        // Значение количества
        const valueBlock = header.append('div')
          .style('text-align', 'right');
        
        valueBlock.append('div')
          .style('font-weight', 'bold')
          .style('color', '#f1f5f9')
          .style('font-size', '18px')
          .text(model.totalCount || 0);
        
        // Информация о статусах
        const statusInfo = card.append('div')
          .style('margin-top', '12px')
          .style('display', 'flex')
          .style('flex-direction', 'column')
          .style('gap', '8px');
          
        const newStatus = statusInfo.append('div')
          .style('display', 'flex')
          .style('justify-content', 'space-between')
          .style('align-items', 'center');
          
        newStatus.append('div')
          .style('color', '#94a3b8')
          .style('font-size', '12px')
          .text('Не оплаченные:');
          
        newStatus.append('div')
          .style('color', '#ef4444')
          .style('font-weight', 'medium')
          .style('font-size', '12px')
          .text(model.state_new || 0);
          
    const waitingStatus = statusInfo.append('div')
          .style('display', 'flex')
          .style('justify-content', 'space-between')
          .style('align-items', 'center');
          
        waitingStatus.append('div')
          .style('color', '#94a3b8')
          .style('font-size', '12px')
          .text('В очереди:');
          
        waitingStatus.append('div')
          .style('color', '#f59e0b')
          .style('font-weight', 'medium')
          .style('font-size', '12px')
          .text(model.state_waiting || 0);
          
        const completeStatus = statusInfo.append('div')
          .style('display', 'flex')
          .style('justify-content', 'space-between')
          .style('align-items', 'center');
          
        completeStatus.append('div')
          .style('color', '#94a3b8')
          .style('font-size', '12px')
          .text('Завершенные:');
          
        completeStatus.append('div')
          .style('color', '#10b981')
          .style('font-weight', 'medium')
          .style('font-size', '12px')
          .text(model.state_complete || 0);
          
        // Прогресс-бар для статусов
        const progressContainer = card.append('div')
          .style('margin-top', '16px')
          .style('width', '100%')
          .style('height', '6px')
          .style('background', '#334155')
          .style('border-radius', '3px')
          .style('overflow', 'hidden')
          .style('display', 'flex');
        
        // Рассчитываем доли для прогресс-бара
        const total = (model.state_new || 0) + (model.state_waiting || 0) + (model.state_complete || 0) + (model.state_moving || 0) + (model.state_reserved || 0) + (model.state_binding || 0) + (model.state_booked || 0);
        
        if (total > 0) {
          const newWidth = ((model.state_new || 0) / total) * 100;
          const waitingWidth = ((model.state_waiting || 0) / total) * 100;
          const completeWidth = ((model.state_complete || 0) / total) * 100;
          const otherWidth = 100 - newWidth - waitingWidth - completeWidth;
          
          // Создаем сегменты прогресс-бара
          if (newWidth > 0) {
            progressContainer.append('div')
              .style('height', '100%')
              .style('width', `${newWidth}%`)
              .style('background', '#ef4444');
          }
          
          if (waitingWidth > 0) {
            progressContainer.append('div')
              .style('height', '100%')
              .style('width', `${waitingWidth}%`)
              .style('background', '#f59e0b');
          }
          
          if (completeWidth > 0) {
            progressContainer.append('div')
              .style('height', '100%')
              .style('width', `${completeWidth}%`)
              .style('background', '#10b981');
          }
          
          if (otherWidth > 0) {
            progressContainer.append('div')
              .style('height', '100%')
              .style('width', `${otherWidth}%`)
              .style('background', '#3b82f6');
          }
        }
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
          .attr('src', `https://uzavtosalon.uz/b/core/m$load_image?sha=${model.image}&width=400&height=400`)
          .style('width', '100%')
          .style('height', '100%')
          .style('object-fit', 'contain');
        
        const nameContainer = leftPart.append('div');
        
        nameContainer.append('div')
          .style('font-weight', 'bold')
          .style('color', '#f1f5f9')
          .style('font-size', '16px')
          .text(model.name);
        
        // Правая часть с статусами
        const rightPart = rowContent.append('div')
          .style('display', 'flex')
          .style('align-items', 'center')
          .style('gap', '32px');
        
        // Статусы
        const newBlock = rightPart.append('div')
          .style('display', 'flex')
          .style('flex-direction', 'column')
          .style('align-items', 'flex-end');
        
        newBlock.append('div')
          .style('color', '#94a3b8')
          .style('font-size', '12px')
          .text('Не оплачены');
        
        newBlock.append('div')
          .style('color', '#ef4444')
          .style('font-size', '14px')
          .style('font-weight', 'bold')
          .text(model.state_new || 0);
        
        // В очереди
        const waitingBlock = rightPart.append('div')
          .style('display', 'flex')
          .style('flex-direction', 'column')
          .style('align-items', 'flex-end');
        
        waitingBlock.append('div')
          .style('color', '#94a3b8')
          .style('font-size', '12px')
          .text('В очереди');
        
        waitingBlock.append('div')
          .style('color', '#f59e0b')
          .style('font-size', '14px')
          .style('font-weight', 'bold')
          .text(model.state_waiting || 0);
        
        // Завершено
        const completeBlock = rightPart.append('div')
          .style('display', 'flex')
          .style('flex-direction', 'column')
          .style('align-items', 'flex-end');
        
        completeBlock.append('div')
          .style('color', '#94a3b8')
          .style('font-size', '12px')
          .text('Завершены');
        
        completeBlock.append('div')
          .style('color', '#10b981')
          .style('font-size', '14px')
          .style('font-weight', 'bold')
          .text(model.state_complete || 0);
        
        // Всего
        const totalBlock = rightPart.append('div')
          .style('display', 'flex')
          .style('flex-direction', 'column')
          .style('align-items', 'flex-end');
        
        totalBlock.append('div')
          .style('color', '#94a3b8')
          .style('font-size', '12px')
          .text('Всего');
        
        totalBlock.append('div')
          .style('color', '#f1f5f9')
          .style('font-size', '14px')
          .style('font-weight', 'bold')
          .text(model.totalCount || 0);
      });
    }

    // На уровне модели показываем изображение
    if (currentView === 'model' && selectedModel) {
      // Просто добавляем изображение модели
      const imageSection = container.append('div')
        .style('margin-top', '20px')
        .style('background', 'linear-gradient(145deg, #1e293b, #1a2234)')
        .style('border-radius', '16px')
        .style('padding', '20px')
        .style('animation', 'fadeInUp 0.6s both');
      
      // Добавляем изображение модели
      const imageContainer = imageSection.append('div')
        .style('height', '200px')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('justify-content', 'center')
        .style('background', `linear-gradient(145deg, ${selectedModel.color}10, ${selectedModel.color}05)`)
        .style('border-radius', '8px')
        .style('overflow', 'hidden');
      
      imageContainer.append('img')
        .attr('src', `https://uzavtosalon.uz/b/core/m$load_image?sha=${selectedModel.image}&width=400&height=400`)
        .style('max-height', '180px')
        .style('max-width', '100%')
        .style('object-fit', 'contain');
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

const renderStatusChart = () => {
  if (!statusChartRef.current) return;
  d3.select(statusChartRef.current).selectAll('*').remove();

  const width = statusChartRef.current.clientWidth;
  const height = 300;
  const margin = { top: 40, right: 20, bottom: 80, left: 50 }; // Увеличенный нижний отступ для подписей

  // Создаем SVG
  const svg = d3.select(statusChartRef.current)
    .append('svg')
    .attr('width', width)
    .attr('height', height + 60) // Увеличиваем высоту для подписей
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

  // Создаем всплывающую подсказку
  const tooltip = d3.select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('position', 'absolute')
    .style('visibility', 'hidden')
    .style('background', 'rgba(15, 23, 42, 0.9)')
    .style('color', '#f1f5f9')
    .style('padding', '10px')
    .style('border-radius', '6px')
    .style('font-size', '12px')
    .style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.3)')
    .style('z-index', '1000')
    .style('max-width', '220px')
    .style('border', '1px solid rgba(59, 130, 246, 0.2)');

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
  const bars = svg.selectAll('.bar')
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
    .attr('stroke-width', 1);
  
  // Добавляем обработчики событий без изменения цвета
  bars.on('mouseover', function(event, d) {
      // Определяем описание для каждого статуса
      const descriptions = {
        'neopl': 'Заказы без оплаты или с частичной оплатой',
        'ocheredi': 'Оплаченные заказы в очереди на обработку',
        'process': 'Заказы завершены',
        'dostavka': 'Заказы в доставке',
        'raspredelenie': 'Зарезервированные заказы',
        'diler': 'Забронированные заказы'
      };
      
      const desc = descriptions[d.id] || 'Нет описания';
      
      tooltip
        .style('visibility', 'visible')
        .html(`
          <div>
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${d.color}; margin-right: 5px;"></div>
              <strong>${d.name}</strong>
            </div>
            <div style="margin-top: 5px;">${desc}</div>
            <div style="margin-top: 8px; font-weight: bold;">Количество: ${d.value}</div>
          </div>
        `)
        .style('left', (event.pageX + 15) + 'px')
        .style('top', (event.pageY - 20) + 'px');
    })
    .on('mousemove', function(event) {
      tooltip
        .style('left', (event.pageX + 15) + 'px')
        .style('top', (event.pageY - 20) + 'px');
    })
    .on('mouseout', function() {
      tooltip.style('visibility', 'hidden');
    });
  
  // Анимируем столбцы
  bars.transition()
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

  // Добавляем заголовок "СТАТУС ЗАКАЗОВ"
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', height + 15)
    .attr('text-anchor', 'middle')
    .style('font-size', '14px')
    .style('font-weight', 'bold')
    .style('fill', '#94a3b8')
    .text('СТАТУС ЗАКАЗОВ');

  // Добавляем описания статусов
  const statusDescriptions = [
    { id: 'neopl', desc: 'Заказы без оплаты' },
    { id: 'ocheredi', desc: 'В очереди на обработку' },
    { id: 'process', desc: 'Завершены' },
    { id: 'dostavka', desc: 'В пути' },
    { id: 'raspredelenie', desc: 'Зарезервированы' },
    { id: 'diler', desc: 'Забронированы' }
  ];
  
  // Определяем количество колонок в легенде
  const columns = 3; // Показываем в 3 колонки
  const itemsPerColumn = Math.ceil(statusDescriptions.length / columns);
  const columnWidth = (width - margin.left - margin.right) / columns;
  
  // Создаем контейнер для легенды
  const legendContainer = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${height + 25})`);
  
  // Добавляем элементы легенды
  statusDescriptions.forEach((item, i) => {
    const column = Math.floor(i / itemsPerColumn);
    const row = i % itemsPerColumn;
    
    const status = statusData.find(s => s.id === item.id);
    if (!status) return;
    
    const itemGroup = legendContainer.append('g')
      .attr('transform', `translate(${column * columnWidth}, ${row * 20})`);
    
    // Цветной индикатор
    itemGroup.append('rect')
      .attr('width', 8)
      .attr('height', 8)
      .attr('rx', 2)
      .attr('fill', status.color)
      .attr('y', -8);
    
    // Название статуса
    itemGroup.append('text')
      .attr('x', 15)
      .attr('y', 0)
      .style('font-size', '10px')
      .style('fill', '#e2e8f0')
      .style('font-weight', 'medium')
      .text(`${status.name}:`);
    
    // Описание статуса
    itemGroup.append('text')
      .attr('x', status.name.length * 5.5 + 20) // Отступ после названия
      .attr('y', 0)
      .style('font-size', '10px')
      .style('fill', '#94a3b8')
      .text(item.desc);
  });
};

  return (
    <>
      {isLoading && <ContentReadyLoader timeout={2000} />}
      
      <div className="bg-slate-900 text-white p-6 rounded-xl shadow-2xl border border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
            {isWholesale ? 'ОПТОВЫЕ ЗАКАЗЫ' : 'РОЗНИЧНЫЕ ЗАКАЗЫ'}: СТАТУС И РАСПРЕДЕЛЕНИЕ
          </h1>
          
          <div className="flex space-x-3">
            {/* Переключатель между режимами опт/розница */}
            <div className="flex space-x-2 mr-4 bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => toggleWholesale(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  !isWholesale
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                    : 'bg-transparent text-slate-300 hover:bg-slate-700'
                }`}
              >
                Розница
              </button>
              <button
                onClick={() => toggleWholesale(true)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isWholesale
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                    : 'bg-transparent text-slate-300 hover:bg-slate-700'
                }`}
              >
                Опт
              </button>
            </div>
            
            {/* Переключатель режима отображения */}
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
                value={filterRegion}
                onChange={handleRegionSelect}
                className="bg-slate-700 text-slate-200 px-3 py-2 rounded-lg border-0 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Все регионы</option>
                {data.map((region, index) => (
                  <option key={`region-${index}`} value={`region-${index}`}>{region.region}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center">
              <span className="text-slate-400 mr-2 text-sm">Модель:</span>
              <select 
                value={filterModel}
                onChange={handleModelSelect}
                className="bg-slate-700 text-slate-200 px-3 py-2 rounded-lg border-0 focus:ring-2 focus:ring-blue-500"
              >
           <option value="all">Все модели</option>
                {/* Создаем уникальный список моделей без дубликатов */}
                {Array.from(new Set(data.flatMap(region => region.models.map(model => model.model))))
                  .sort()
                  .map((modelName, index) => (
                    <option key={index} value={modelName}>{modelName}</option>
                  ))
                }
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
            ? `СТАТУСЫ ЗАКАЗОВ ${isWholesale ? '(ОПТОВЫЕ)' : '(РОЗНИЧНЫЕ)'}: НЕ ОПЛАЧЕННЫЙ, В ОЧЕРЕДИ, ЗАВЕРШЕННЫЕ, В ПУТИ, ЗАРЕЗЕРВИРОВАННЫЕ, ЗАБРОНИРОВАННЫЕ`
            : currentView === 'region'
              ? `СТАТИСТИКА ПО РЕГИОНУ: ${selectedRegion?.name}`
              : `ДЕТАЛЬНАЯ ИНФОРМАЦИЯ ПО МОДЕЛИ: ${selectedModel?.name}`}
        </p>
        
        <div className="mb-6">
          {/* Карточка со статусом оплаты - отображаем только на общем экране и экране региона */}
{currentView !== 'model' && (
  <div className="lg:col-span-8 bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-xl border border-slate-700/50 relative overflow-hidden mb-6">
    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-purple-500/5 to-pink-500/5 z-0 pointer-events-none"></div>
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
              className="w-20 h-20 rounded-full flex items-center justify-center mb-2 shadow-lg relative"
              style={{ 
                background: `radial-gradient(circle, ${category.color}30 0%, ${category.color}10 70%)`
              }}
            >
              <div 
                className="absolute inset-0 rounded-full z-0"
                style={{ boxShadow: `0 0 20px ${category.color}30` }}
              ></div>
              <span className="text-2xl font-bold relative z-10" style={{ color: category.color }}>{category.value}</span>
            </div>
            <span className="text-sm font-medium text-slate-300">{category.name}</span>
          </div>
        ))}
      </div>
      
      {/* Прогресс-бар оплаты с заголовком */}
      <div className="mb-6">
        {/* Расчет процента оплаченных заказов */}
        {(() => {
          const totalOrders = paymentCategories['oplachen'].value + paymentCategories['neoplachen'].value;
          const paidPercent = totalOrders > 0 ? (paymentCategories['oplachen'].value / totalOrders) * 100 : 0;
          
          return (
            <div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden shadow-inner relative">
              <div 
                className="h-full rounded-full transition-all duration-1000 absolute left-0 top-0" 
                style={{ 
                  width: `${paidPercent}%`, 
                  background: 'linear-gradient(to right, #10b981, #3b82f6)'
                }}
              ></div>
              <div 
                className="absolute left-0 top-0 h-full w-full opacity-50 z-0"
                style={{ 
                  width: `${paidPercent}%`, 
                  boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)'
                }}
              ></div>
            </div>
          );
        })()}
        
        <div className="flex justify-between mt-2 text-sm text-slate-400">
          <span>Оплачено: {paymentCategories['oplachen'].value} (UZS {formatNumber(revenueData.current * (paymentCategories['oplachen'].value / (paymentCategories['oplachen'].value + paymentCategories['neoplachen'].value || 1)))})</span>
          <span>Не оплачено: {paymentCategories['neoplachen'].value} (UZS {formatNumber(revenueData.current * (paymentCategories['neoplachen'].value / (paymentCategories['oplachen'].value + paymentCategories['neoplachen'].value || 1)))})</span>
        </div>
      </div>
      
      {/* График статусов заказов */}
      <div ref={statusChartRef} className="w-full" style={{ height: '280px' }}></div>
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
                </div>
                
                {/* Показатели модели */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                    <h3 className="text-sm text-slate-400 mb-1">Всего автомобилей</h3>
                    <div className="text-xl font-bold text-white">
                      {selectedModel?.totalCount || 0} шт.
                    </div>
                  </div>
                  
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                    <h3 className="text-sm text-slate-400 mb-1">Не оплаченные</h3>
                    <div className="text-xl font-bold text-red-500">
                      {selectedModel?.state_new || 0} шт.
                    </div>
                  </div>
                  
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                    <h3 className="text-sm text-slate-400 mb-1">Заказы в очереди</h3>
                    <div className="text-xl font-bold text-orange-500">
                      {selectedModel?.state_waiting || 0} шт.
                    </div>
                  </div>
                </div>
                
                {/* Показатель стоимости в виде карты */}
                <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 p-4 mb-4">
                  <h3 className="text-sm text-slate-400 mb-3">Общая стоимость</h3>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-white">
                      {formatNumber(selectedModel?.value || 0)} UZS
                    </div>
                  </div>
                </div>
                
                {/* Таблица распределения по статусам */}
                <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 p-4 mb-4">
                  <h3 className="text-sm text-slate-400 mb-3">Распределение по статусам</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-slate-700/50">
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Статус</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Количество</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {(() => {
                          // Расчет количества для статусов
                          const statusCounts = [
                            { name: 'Не оплаченные', value: selectedModel?.state_new || 0, color: '#ef4444' },
                            { name: 'В очереди', value: selectedModel?.state_waiting || 0, color: '#f59e0b' },
                            { name: 'Завершенные', value: selectedModel?.state_complete || 0, color: '#10b981' },
                            { name: 'В пути', value: selectedModel?.state_moving || 0, color: '#8b5cf6' },
                            { name: 'Зарезервировано', value: selectedModel?.state_reserved || 0, color: '#3b82f6' },
                            { name: 'Привязано', value: selectedModel?.state_binding || 0, color: '#6366f1' },
                            { name: 'Забронировано', value: selectedModel?.state_booked || 0, color: '#ec4899' }
                          ];
                          
                          return statusCounts.map((status, index) => (
                            <tr key={index} className="hover:bg-slate-700/30 transition-colors">
                              <td className="px-4 py-2 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="h-3 w-3 rounded-full mr-3" style={{ 
                                    backgroundColor: status.color,
                                    boxShadow: `0 0 10px ${status.color}70`
                                  }}></div>
                                  <div className="text-sm text-slate-300">{status.name}</div>
                                </div>
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-400 text-right">{status.value}</td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Если есть регион, показываем региональную статистику */}
                {selectedRegion && (
                  <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 p-4 mb-4">
                    <h3 className="text-sm text-slate-400 mb-3">Региональная статистика - {selectedRegion.name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-800/50 p-3 rounded-lg">
                        <h4 className="text-xs text-slate-400">Доля в регионе</h4>
                        <div className="text-lg font-bold text-white">
                          {selectedModel?.totalCount || 0} из {selectedRegion.value}
                        </div>
                      </div>
                      <div className="bg-slate-800/50 p-3 rounded-lg">
                        <h4 className="text-xs text-slate-400">Количество в регионе</h4>
                        <div className="text-lg font-bold text-white">
                          {selectedModel?.totalCount || 0} шт.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Карточка с моделями или регионами */}
        <div className="bg-gradient-to-br h-full from-slate-800 to-slate-900 p-6 rounded-2xl shadow-xl border border-slate-700/50 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-indigo-500/5 to-blue-500/5 z-0"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-200">
                {currentView === 'general' 
                  ? `${isWholesale ? 'ОПТОВЫЕ' : 'РОЗНИЧНЫЕ'} МОДЕЛИ В РАЗРЕЗЕ`
                  : currentView === 'region'
                    ? `МОДЕЛИ В РЕГИОНЕ: ${selectedRegion?.name}`
                    : currentView === 'model' && selectedRegion
                      ? `ДЕТАЛЬНАЯ ИНФОРМАЦИЯ: ${selectedModel?.name} В ${selectedRegion?.name}`
                      : `ДЕТАЛЬНАЯ ИНФОРМАЦИЯ: ${selectedModel?.name}`}
              </h2>
            </div>
            <div ref={modelsChartRef} className="w-full" style={{ maxHeight: '450px', overflowY: 'auto' }}></div>
          </div>
        </div>
        
        {/* Нижний блок с таблицей - отображаем только на общем экране */}
        {currentView === 'general' && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-xl border border-slate-700/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-cyan-500/5 to-emerald-500/5 z-0"></div>
            <div className="relative z-10">
              <h2 className="text-lg font-bold text-slate-200 mb-4">ДЕТАЛЬНАЯ ИНФОРМАЦИЯ ПО СТАТУСАМ ЗАКАЗОВ</h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Статус</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Количество</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Сумма (UZS)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {statusData.map((status) => {
                      const totalOrders = statusData.reduce((acc, curr) => acc + curr.value, 0);
                      const amount = totalOrders > 0 ? Math.round(revenueData.current * (status.value / totalOrders)) : 0;
                      
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{formatNumber(amount)} UZS</td>
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
        <style jsx global>{`
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
          
          .bg-clip-text {
            -webkit-background-clip: text;
            background-clip: text;
          }
          
          .text-transparent {
            color: transparent;
          }
        `}</style>
      </div>
    </>
  );
};

export default ModelTrackingDashboard;