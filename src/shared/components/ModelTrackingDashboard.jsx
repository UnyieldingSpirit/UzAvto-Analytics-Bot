'use client';
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import ContentReadyLoader from '../../shared/layout/ContentReadyLoader';
import { useTranslation } from '../../hooks/useTranslation';
import { modelTrackingTranslations } from '../../shared/components/locales/ModelTracking';
import { useThemeStore } from '../../store/theme';
import { useAuth } from '../../hooks/useAuth';
import { axiosInstance } from '../../utils/axiosConfig';

const ModelTrackingDashboard = () => {
  const { t, currentLocale } = useTranslation(modelTrackingTranslations);
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';
  
  const donutChartRef = useRef(null);
  const modelsChartRef = useRef(null);
  const statusChartRef = useRef(null);
  
  const [viewMode, setViewMode] = useState('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [isWholesale, setIsWholesale] = useState(false);
  const [data, setData] = useState([]);
  
  // Состояния для фильтрации и навигации
  const [currentView, setCurrentView] = useState('general');
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [filterModel, setFilterModel] = useState('all');
  const [filterRegion, setFilterRegion] = useState('all');
  
  // Добавляем состояние для переключения между графиком и таблицей
  const [statusView, setStatusView] = useState('chart');
  const { checkAuth } = useAuth();
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);
  // Функция для загрузки данных
const fetchData = async (isWholesale) => {
  setIsLoading(true);
  try {
    const token = localStorage.getItem('authToken');

    // URL для загрузки данных
    const url = isWholesale 
      ? '/b/dashboard/infos&contract_state_wholesale' 
      : '/b/dashboard/infos&contract_state';

    const response = await axiosInstance.post('https://uzavtoanalytics.uz/dashboard/proxy', {
      url
    }, {
      headers: {
        'X-Auth': `Bearer ${token}`
      }
    });

    // В axios используем response.data вместо response.json()
    const jsonData = response.data;
    setData(jsonData);
    
  } catch (error) {
    console.error(`${currentLocale === 'ru' ? 'Ошибка при загрузке данных:' : 'Ma\'lumotlarni yuklashda xatolik:'} ${error}`);
  } finally {
    setIsLoading(false);
  }
};

  // Переключение между оптом и розницей
  const toggleWholesale = (wholesale) => {
    setIsWholesale(wholesale);
    
    // Сбрасываем детальный режим просмотра при переключении
    if (currentView === 'model') {
      setSelectedModel(null);
      setCurrentView('general');
      setFilterModel('all');
      setFilterRegion('all');
      setSelectedRegion(null);
    }
    
    // Загружаем новые данные
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
            state_booked: 0,
            paid_count: 0,
            no_paid_count: 0
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
        
        // Добавляем суммирование по оплаченным и неоплаченным
        modelData.paid_count += parseInt(model.paid_count || 0);
        modelData.no_paid_count += parseInt(model.no_paid_count || 0);
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
            state_booked: parseInt(model.state_booked || 0),
            paid_count: parseInt(model.paid_count || 0),
            no_paid_count: parseInt(model.no_paid_count || 0)
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
  
  // Данные статусов заказов (с обновленным порядком и названием)
  const calculateStatusData = () => {
    let totalNew = 0;
    let totalWaiting = 0;
    let totalComplete = 0;
    let totalMoving = 0;
    let totalReserved = 0;
    let totalBinding = 0;
    let totalBooked = 0;
    
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
      { id: 'new', name: t('statuses.partiallyPaid'), value: totalNew, color: '#ef4444' },
      { id: 'waiting', name: t('statuses.paid'), value: totalWaiting, color: '#f59e0b' },
      { id: 'binding', name: t('statuses.inDistribution'), value: totalBinding, color: '#60a5fa' },
      { id: 'reserved', name: t('statuses.distributed'), value: totalReserved, color: '#3b82f6' },
      { id: 'moving', name: t('statuses.inTransit'), value: totalMoving, color: '#8b5cf6' },
      { id: 'complete', name: t('statuses.atDealer'), value: totalComplete, color: '#10b981' },
      { id: 'booked', name: t('statuses.reserved'), value: totalBooked, color: '#6366f1' }
    ];
  };
  
  const statusData = calculateStatusData();
  
  // Категории оплаты с обновленным названием
  const calculatePaymentCategories = () => {
    let totalPaid = 0;
    let totalUnpaid = 0;
    
    if (selectedRegion) {
      const regionModels = modelsByRegion[selectedRegion.id] || [];
      regionModels.forEach(model => {
        totalPaid += model.paid_count || 0;
        totalUnpaid += model.no_paid_count || 0;
      });
    } else {
      models.forEach(model => {
        totalPaid += model.paid_count || 0;
        totalUnpaid += model.no_paid_count || 0;
      });
    }
    
    return {
      'oplachen': { name: t('statuses.paid'), value: totalPaid, color: '#10b981' },
      'neoplachen': { name: t('statuses.partiallyPaid'), value: totalUnpaid, color: '#ef4444' }
    };
  };
  
  const paymentCategories = calculatePaymentCategories();
  
  // Функция для получения базовой цены модели
  function getModelBasePrice(modelName) {
    const prices = {
      'COBALT': 12000,
      'DAMAS-2': 9500,
      'ONIX': 16000,
      'TRACKER-2': 22000,
      'Captiva 5T': 18000,
      'EQUINOX': 20000
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
    let filteredModels = [];
    
    if (currentView === 'general') {
      filteredModels = [...models];
    } else if (currentView === 'region' && selectedRegion) {
      filteredModels = modelsByRegion[selectedRegion.id] || [];
    } else if (currentView === 'model' && selectedModel) {
      filteredModels = [selectedModel];
    }
    
    if (filterModel !== 'all' && currentView !== 'model') {
      filteredModels = filteredModels.filter(model => model.name === filterModel);
    }
    
    return filteredModels;
  };

  useEffect(() => {
    renderDonutChart();
    
    if ((currentView === 'general' || currentView === 'region') && statusView === 'chart') {
      renderStatusChart();
    }
    
    renderModelsChart();
  }, [currentView, selectedRegion, selectedModel, viewMode, filterModel, filterRegion, data, statusView, currentLocale, isDark]);

  // Функция форматирования чисел
  const formatNumber = (num) => {
    return num.toLocaleString(currentLocale === 'ru' ? 'ru-RU' : 'uz-UZ');
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
    
    // Рассчитываем радиус диаграммы
    const size = Math.min(width, height);
    const margin = size * 0.08;
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
      .attr('stop-color', isDark ? '#1e293b' : '#e5e7eb')
      .attr('stop-opacity', 0.3);
      
    remainingGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', isDark ? '#1e293b' : '#e5e7eb')
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

    // Тень для сегмента
    const filter = defs.append('filter')
      .attr('id', 'drop-shadow')
      .attr('height', '120%');
    
    filter.append('feGaussianBlur')
      .attr('in', 'SourceAlpha')
      .attr('stdDeviation', size * 0.008)
      .attr('result', 'blur');
    
    filter.append('feOffset')
      .attr('in', 'blur')
      .attr('dx', 0)
      .attr('dy', size * 0.004)
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
      .attr('stroke', isDark ? '#0f172a' : '#e5e7eb')
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
      .attr('stroke', isDark ? '#0f172a' : '#e5e7eb')
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
      .attr('fill', isDark ? '#f8fafc' : '#1f2937')
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
      .attr('fill', isDark ? '#94a3b8' : '#6b7280')
      .text(currentLocale === 'ru' ? 'Прибыль' : 'Foyda')
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
      .attr('fill', isDark ? '#94a3b8' : '#6b7280')
      .text(`UZS${revenueData.total.toLocaleString(currentLocale === 'ru' ? 'ru-RU' : 'uz-UZ')}`)
      .style('opacity', 0)
      .transition()
      .duration(800)
      .delay(400)
      .style('opacity', 1);
  };

  // Функция для отрисовки графика моделей (карточки и список)
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
        .style('color', isDark ? '#94a3b8' : '#6b7280')
        .style('font-size', '16px')
        .text(t('noData'));
      return;
    }

    // В начале функции renderModelsChart(), перед любым отображением данных, добавьте проверку:
    if (currentView === 'model' && selectedModel) {
      // Очищаем весь контейнер перед отрисовкой
      container.selectAll("*").remove();
      
      // Создаем сразу двухколоночную карточку для детальной информации без верхней карточки
      const detailContainer = container.append('div')
        .style('display', 'grid')
        .style('grid-template-columns', 'repeat(auto-fit, minmax(300px, 1fr))')
        .style('gap', '20px')
        .style('animation', 'fadeInUp 0.6s both');
      
      // КОЛОНКА 1: Информация и статусы
      const infoColumn = detailContainer.append('div')
        .style('background', isDark ? 'linear-gradient(145deg, #1e293b, #1a2234)' : 'linear-gradient(145deg, #ffffff, #f9fafb)')
        .style('border-radius', '16px')
        .style('padding', '20px')
        .style('border', isDark ? '1px solid rgba(30, 41, 59, 0.8)' : '1px solid #e5e7eb')
        .style('box-shadow', isDark ? '0 10px 15px -3px rgba(0, 0, 0, 0.3)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)');
      
      // Добавляем название модели вверху
      infoColumn.append('div')
        .style('font-weight', 'bold')
        .style('color', isDark ? '#f1f5f9' : '#1f2937')
        .style('font-size', '22px')
        .style('margin-bottom', '15px')
        .style('text-align', 'center')
        .text(selectedModel.name.toUpperCase());
      
      // Все ВСЕГО - ОПЛАЧЕНО - НЕ ОПЛАЧЕНО
      const statsHeader = infoColumn.append('div')
        .style('display', 'grid')
        .style('grid-template-columns', 'repeat(3, 1fr)')
        .style('gap', '10px')
        .style('margin-bottom', '20px');
      
      // ВСЕГО
      const totalStats = statsHeader.append('div')
        .style('padding', '10px')
        .style('background', isDark ? 'rgba(15, 23, 42, 0.3)' : 'rgba(243, 244, 246, 0.8)')
        .style('border-radius', '8px')
        .style('text-align', 'center');
      
      totalStats.append('div')
        .style('color', isDark ? '#94a3b8' : '#6b7280')
        .style('font-size', '12px')
        .style('margin-bottom', '5px')
        .text(t('statuses.total'));
      
      totalStats.append('div')
        .style('font-size', '22px')
        .style('font-weight', 'bold')
        .style('color', isDark ? '#f1f5f9' : '#1f2937')
        .text(selectedModel.totalCount || 0);
      
      // ОПЛАЧЕНО
      const paidStats = statsHeader.append('div')
        .style('padding', '10px')
        .style('background', isDark ? 'rgba(15, 23, 42, 0.3)' : 'rgba(243, 244, 246, 0.8)')
        .style('border-radius', '8px')
        .style('text-align', 'center');
      
      paidStats.append('div')
        .style('color', isDark ? '#94a3b8' : '#6b7280')
        .style('font-size', '12px')
        .style('margin-bottom', '5px')
        .text(t('statuses.paid'));
      
      paidStats.append('div')
        .style('font-size', '22px')
        .style('font-weight', 'bold')
        .style('color', '#10b981')
        .text(selectedModel.paid_count || 0);
      
      // НЕ ОПЛАЧЕНО/ЧАСТИЧНО ОПЛАЧЕНО - ИЗМЕНЕНО НАЗВАНИЕ с учетом формата через слеш
      const unpaidStats = statsHeader.append('div')
        .style('padding', '10px')
        .style('background', isDark ? 'rgba(15, 23, 42, 0.3)' : 'rgba(243, 244, 246, 0.8)')
        .style('border-radius', '8px')
        .style('text-align', 'center');
      
      unpaidStats.append('div')
        .style('color', isDark ? '#94a3b8' : '#6b7280')
        .style('font-size', '11px') // Уменьшил размер, чтобы вместить текст
        .style('margin-bottom', '5px')
        .text(t('statuses.partiallyPaid'));
      
      unpaidStats.append('div')
        .style('font-size', '22px')
        .style('font-weight', 'bold')
        .style('color', '#ef4444')
        .text(selectedModel.no_paid_count || 0);
      
      // Заголовок секции статусов
      infoColumn.append('div')
        .style('margin', '20px 0 15px 0')
        .style('color', isDark ? '#94a3b8' : '#6b7280')
        .style('font-size', '14px')
        .style('font-weight', 'medium')
        .text(t('statuses.title'));
      
      // Прогресс-бар статусов
      const progressSection = infoColumn.append('div')
        .style('margin-bottom', '15px');
      
      // Создаем прогресс-бар с подписями
      const progressData = [
        { name: t('statuses.partiallyPaid'), value: selectedModel.state_new || 0, color: '#ef4444' },
        { name: t('statuses.paid'), value: selectedModel.state_waiting || 0, color: '#f59e0b' },
        { name: t('statuses.inDistribution'), value: selectedModel.state_binding || 0, color: '#60a5fa' },
        { name: t('statuses.distributed'), value: selectedModel.state_reserved || 0, color: '#3b82f6' },
        { name: t('statuses.inTransit'), value: selectedModel.state_moving || 0, color: '#8b5cf6' },
        { name: t('statuses.atDealer'), value: selectedModel.state_complete || 0, color: '#10b981' },
        { name: t('statuses.reserved'), value: selectedModel.state_booked || 0, color: '#6366f1' }
      ];
      
      const total = progressData.reduce((sum, item) => sum + item.value, 0);
      
      // Контейнер для прогресс-бара
      const progressBarContainer = progressSection.append('div')
        .style('width', '100%')
        .style('height', '8px')
        .style('background', isDark ? '#334155' : '#e5e7eb')
        .style('border-radius', '4px')
        .style('overflow', 'hidden')
        .style('margin-bottom', '10px')
        .style('display', 'flex');
      
      // Добавляем сегменты прогресс-бара
      if (total > 0) {
        progressData.forEach(item => {
          const width = (item.value / total) * 100;
          if (width > 0) {
            progressBarContainer.append('div')
              .style('height', '100%')
              .style('width', `${width}%`)
              .style('background', item.color);
          }
        });
      }
      
      // Легенда прогресс-бара
      const legend = progressSection.append('div')
        .style('display', 'flex')
        .style('flex-wrap', 'wrap')
        .style('gap', '8px')
        .style('margin-bottom', '15px');
      
      progressData.forEach(item => {
        if (item.value > 0) {
          const legendItem = legend.append('div')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('margin-right', '10px');
          
          legendItem.append('div')
            .style('width', '10px')
            .style('height', '10px')
            .style('border-radius', '50%')
            .style('background', item.color)
            .style('margin-right', '5px')
            .style('box-shadow', `0 0 5px ${item.color}80`);
          
          // В легенде для экономии места используем сокращение
          const displayName = item.name;
          
          legendItem.append('div')
            .style('color', isDark ? '#94a3b8' : '#6b7280')
            .style('font-size', '11px')
            .text(`${displayName}: ${item.value}`);
        }
      });
      
      // Таблица статусов
      const statusesSection = infoColumn.append('div');
      
      // Заголовки таблицы
      const tableHeader = statusesSection.append('div')
        .style('display', 'flex')
        .style('justify-content', 'space-between')
        .style('padding', '10px 5px')
        .style('border-bottom', isDark ? '1px solid rgba(30, 41, 59, 0.8)' : '1px solid #e5e7eb')
        .style('margin-bottom', '10px');
      
      tableHeader.append('div')
        .style('color', isDark ? '#94a3b8' : '#6b7280')
        .style('font-size', '12px')
        .style('font-weight', 'medium')
        .text(t('modelDetails.statusesTable'));
      
      tableHeader.append('div')
        .style('color', isDark ? '#94a3b8' : '#6b7280')
        .style('font-size', '12px')
        .style('font-weight', 'medium')
        .text(t('modelDetails.quantityTable'));
      
      // Строки таблицы статусов
      progressData.forEach((status, index) => {
        const row = statusesSection.append('div')
          .style('display', 'flex')
          .style('justify-content', 'space-between')
          .style('padding', '8px 5px')
          .style('border-bottom', index < progressData.length - 1 ? 
            (isDark ? '1px solid rgba(30, 41, 59, 0.4)' : '1px solid #f3f4f6') : 
            'none');
        
        const statusLabel = row.append('div')
          .style('display', 'flex')
          .style('align-items', 'center');
        
        statusLabel.append('div')
          .style('width', '8px')
          .style('height', '8px')
          .style('border-radius', '50%')
          .style('background', status.color)
          .style('margin-right', '8px');
        
        statusLabel.append('div')
          .style('color', isDark ? '#f1f5f9' : '#1f2937')
          .style('font-size', '13px')
          .text(status.name);
        
        row.append('div')
          .style('color', status.color)
          .style('font-size', '14px')
          .style('font-weight', 'medium')
          .text(status.value);
      });
      
      // КОЛОНКА 2: Только изображение
      const imageColumn = detailContainer.append('div')
        .style('background', isDark ? 'linear-gradient(145deg, #1e293b, #1a2234)' : 'linear-gradient(145deg, #ffffff, #f9fafb)')
        .style('border-radius', '16px')
        .style('border', isDark ? '1px solid rgba(30, 41, 59, 0.8)' : '1px solid #e5e7eb')
        .style('overflow', 'hidden')
        .style('box-shadow', isDark ? '0 10px 15px -3px rgba(0, 0, 0, 0.3)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)')
        .style('display', 'flex')
        .style('flex-direction', 'column');

      // Заголовок с названием "Изображение"
      imageColumn.append('div')
        .style('padding', '15px 20px')
        .style('border-bottom', isDark ? '1px solid rgba(30, 41, 59, 0.8)' : '1px solid #e5e7eb')
        .style('font-weight', 'medium')
        .style('color', isDark ? '#f1f5f9' : '#1f2937')
        .style('font-size', '16px')
        .text(t('modelDetails.image'));
      
      // Контейнер для изображения
      const imageContainer = imageColumn.append('div')
        .style('flex', '1')
        .style('padding', '30px 20px')
        .style('display', 'flex')
        .style('flex-direction', 'column')
        .style('justify-content', 'center')
        .style('align-items', 'center')
        .style('background', `linear-gradient(145deg, ${selectedModel.color}10, ${selectedModel.color}05)`)
        .style('position', 'relative');
      
      // Добавляем декоративный элемент
      imageContainer.append('div')
        .style('position', 'absolute')
        .style('top', '0')
        .style('left', '0')
        .style('width', '100%')
        .style('height', '100%')
        .style('background', `radial-gradient(circle at center, ${selectedModel.color}15 0%, transparent 70%)`);
      
      // Изображение модели
      imageContainer.append('img')
        .attr('src', `https://uzavtosalon.uz/b/core/m$load_image?sha=${selectedModel.image}&width=800&height=600`)
        .style('max-width', '100%')
        .style('max-height', '300px')
        .style('object-fit', 'contain')
        .style('border-radius', '8px')
        .style('z-index', '1')
        .style('filter', 'drop-shadow(0px 10px 15px rgba(0, 0, 0, 0.2))');
      
      // Название модели под изображением
      imageContainer.append('div')
        .style('margin-top', '20px')
        .style('font-weight', 'bold')
        .style('color', isDark ? '#f1f5f9' : '#1f2937')
        .style('font-size', '20px')
        .style('text-align', 'center')
        .style('z-index', '1')
        .text(selectedModel.name.toUpperCase());
      
      // Важно: После создания всего детального вида, сразу вернуть из функции
      return;
    }

    // Выбор типа отображения - сетка или список
    if (viewMode === 'grid') {
      // Сетка для карточек
      const grid = container.append('div')
        .style('display', 'grid')
        .style('grid-template-columns', 'repeat(auto-fill, minmax(280px, 1fr))')
        .style('gap', '16px');

      // Добавляем карточки моделей с анимацией и изображениями
      data.forEach((model, index) => {
        const isHovered = hoveredCard === model.id;
        
        const card = grid.append('div')
          .style('background', isDark ? 'linear-gradient(145deg, #1e293b, #1a2234)' : 'linear-gradient(145deg, #ffffff, #f9fafb)')
          .style('border-radius', '16px')
          .style('padding', '16px')
          .style('box-shadow', isHovered ? 
            `0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 0 10px 2px ${model.color}40` : 
            isDark ? '0 10px 15px -3px rgba(0, 0, 0, 0.3)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)')
          .style('position', 'relative')
          .style('overflow', 'hidden')
          .style('border', isHovered ? 
            `1px solid ${model.color}80` : 
            isDark ? '1px solid rgba(30, 41, 59, 0.8)' : '1px solid #e5e7eb')
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
          .style('color', isDark ? '#f1f5f9' : '#1f2937')
          .style('font-size', '16px')
          .style('margin-bottom', '2px')
          .text(model.name);
        
        // Значение количества
        const valueBlock = header.append('div')
          .style('text-align', 'right');
        
        valueBlock.append('div')
          .style('font-weight', 'bold')
          .style('color', isDark ? '#f1f5f9' : '#1f2937')
          .style('font-size', '18px')
          .text(model.totalCount || 0);

        // Добавляем информацию об оплаченных и неоплаченных
        const paymentInfo = card.append('div')
          .style('margin-top', '8px')
          .style('margin-bottom', '12px')
          .style('display', 'flex')
          .style('justify-content', 'space-between')
          .style('background', isDark ? 'rgba(15, 23, 42, 0.3)' : 'rgba(243, 244, 246, 0.8)')
          .style('border-radius', '8px')
          .style('padding', '8px 12px');
        
        // Оплаченные
        const paidBlock = paymentInfo.append('div')
          .style('display', 'flex')
          .style('flex-direction', 'column')
          .style('align-items', 'center');
        
        paidBlock.append('div')
          .style('color', isDark ? '#94a3b8' : '#6b7280')
          .style('font-size', '11px')
          .style('margin-bottom', '2px')
          .text(t('statuses.paid'));
        
        paidBlock.append('div')
          .style('color', '#10b981')
          .style('font-weight', 'bold')
          .style('font-size', '16px')
          .text(model.paid_count || 0);
        
        // Неоплаченные - ИЗМЕНЕНО НАЗВАНИЕ с объединением через слеш
        const unpaidBlock = paymentInfo.append('div')
          .style('display', 'flex')
          .style('flex-direction', 'column')
          .style('align-items', 'center');
        
        unpaidBlock.append('div')
          .style('color', isDark ? '#94a3b8' : '#6b7280')
          .style('font-size', '11px')
          .style('margin-bottom', '2px')
          .text(t('statuses.partiallyPaid'));
        
        unpaidBlock.append('div')
          .style('color', '#ef4444')
          .style('font-weight', 'bold')
          .style('font-size', '16px')
          .text(model.no_paid_count || 0);
        
        // Информация о статусах - ОБНОВЛЕННЫЙ ПОРЯДОК И НАЗВАНИЯ
        const statusInfo = card.append('div')
          .style('display', 'flex')
          .style('flex-direction', 'column')
          .style('gap', '8px');
          
        // 1. Не оплачено/частично оплачено (раньше было "Частично оплачено")
        const newStatus = statusInfo.append('div')
          .style('display', 'flex')
          .style('justify-content', 'space-between')
          .style('align-items', 'center');
          
        newStatus.append('div')
          .style('color', isDark ? '#94a3b8' : '#6b7280')
          .style('font-size', '12px')
          .text(`${t('statuses.partiallyPaid')}:`);
          
        newStatus.append('div')
          .style('color', '#ef4444')
          .style('font-weight', 'medium')
          .style('font-size', '12px')
          .text(model.state_new || 0);
        
        // 2. Оплачено  
        const waitingStatus = statusInfo.append('div')
          .style('display', 'flex')
          .style('justify-content', 'space-between')
          .style('align-items', 'center');
          
        waitingStatus.append('div')
          .style('color', isDark ? '#94a3b8' : '#6b7280')
          .style('font-size', '12px')
          .text(`${t('statuses.paid')}:`);
          
        waitingStatus.append('div')
          .style('color', '#f59e0b')
          .style('font-weight', 'medium')
          .style('font-size', '12px')
          .text(model.state_waiting || 0);
        
        // 3. На распределении
        const bindingStatus = statusInfo.append('div')
          .style('display', 'flex')
          .style('justify-content', 'space-between')
          .style('align-items', 'center');
          
        bindingStatus.append('div')
          .style('color', isDark ? '#94a3b8' : '#6b7280')
          .style('font-size', '12px')
          .text(`${t('statuses.inDistribution')}:`);
          
        bindingStatus.append('div')
          .style('color', '#60a5fa')
          .style('font-weight', 'medium')
          .style('font-size', '12px')
          .text(model.state_binding || 0);
        
        // 4. Распределён
        const reservedStatus = statusInfo.append('div')
          .style('display', 'flex')
          .style('justify-content', 'space-between')
          .style('align-items', 'center');
          
        reservedStatus.append('div')
          .style('color', isDark ? '#94a3b8' : '#6b7280')
          .style('font-size', '12px')
          .text(`${t('statuses.distributed')}:`);
          
        reservedStatus.append('div')
          .style('color', '#3b82f6')
          .style('font-weight', 'medium')
          .style('font-size', '12px')
          .text(model.state_reserved || 0);

        // 5. В пути
        const movingStatus = statusInfo.append('div')
          .style('display', 'flex')
          .style('justify-content', 'space-between')
          .style('align-items', 'center');
          
        movingStatus.append('div')
          .style('color', isDark ? '#94a3b8' : '#6b7280')
          .style('font-size', '12px')
          .text(`${t('statuses.inTransit')}:`);
          
        movingStatus.append('div')
          .style('color', '#8b5cf6')
          .style('font-weight', 'medium')
          .style('font-size', '12px')
          .text(model.state_moving || 0);

        // 6. У дилера
        const completeStatus = statusInfo.append('div')
          .style('display', 'flex')
          .style('justify-content', 'space-between')
          .style('align-items', 'center');
          
        completeStatus.append('div')
          .style('color', isDark ? '#94a3b8' : '#6b7280')
          .style('font-size', '12px')
          .text(`${t('statuses.atDealer')}:`);
          
        completeStatus.append('div')
          .style('color', '#10b981')
          .style('font-weight', 'medium')
          .style('font-size', '12px')
          .text(model.state_complete || 0);

        // 7. Бронь
        const bookedStatus = statusInfo.append('div')
          .style('display', 'flex')
          .style('justify-content', 'space-between')
          .style('align-items', 'center');
          
        bookedStatus.append('div')
          .style('color', isDark ? '#94a3b8' : '#6b7280')
          .style('font-size', '12px')
          .text(`${t('statuses.reserved')}:`);
          
        bookedStatus.append('div')
          .style('color', '#6366f1')
          .style('font-weight', 'medium')
          .style('font-size', '12px')
          .text(model.state_booked || 0);
                  
        // Прогресс-бар для статусов
        const progressContainer = card.append('div')
          .style('margin-top', '16px')
          .style('width', '100%')
          .style('height', '6px')
          .style('background', isDark ? '#334155' : '#e5e7eb')
          .style('border-radius', '3px')
          .style('overflow', 'hidden')
          .style('display', 'flex');
        
        // Рассчитываем доли для прогресс-бара
        const total = (model.state_new || 0) + (model.state_waiting || 0) + 
                      (model.state_complete || 0) + (model.state_moving || 0) + 
                      (model.state_reserved || 0) + (model.state_binding || 0) + 
                      (model.state_booked || 0);
        
        if (total > 0) {
          const newWidth = ((model.state_new || 0) / total) * 100;
          const waitingWidth = ((model.state_waiting || 0) / total) * 100;
          const completeWidth = ((model.state_complete || 0) / total) * 100;
          const movingWidth = ((model.state_moving || 0) / total) * 100;
          const reservedWidth = ((model.state_reserved || 0) / total) * 100;
          const bindingWidth = ((model.state_binding || 0) / total) * 100;
          const bookedWidth = ((model.state_booked || 0) / total) * 100;
          
          // Создаем сегменты прогресс-бара в новом порядке
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
          
          if (bindingWidth > 0) {
            progressContainer.append('div')
              .style('height', '100%')
              .style('width', `${bindingWidth}%`)
              .style('background', '#60a5fa');
          }
          
          if (reservedWidth > 0) {
            progressContainer.append('div')
              .style('height', '100%')
              .style('width', `${reservedWidth}%`)
              .style('background', '#3b82f6');
          }
          
       if (movingWidth > 0) {
            progressContainer.append('div')
              .style('height', '100%')
              .style('width', `${movingWidth}%`)
              .style('background', '#8b5cf6');
          }
          
          if (completeWidth > 0) {
            progressContainer.append('div')
              .style('height', '100%')
              .style('width', `${completeWidth}%`)
              .style('background', '#10b981');
          }
          
          if (bookedWidth > 0) {
            progressContainer.append('div')
              .style('height', '100%')
              .style('width', `${bookedWidth}%`)
              .style('background', '#6366f1');
          }
        }
      });
    } else {
      
   // Отображение списком (исправленный код)
const list = container.append('div')
  .style('width', '100%')
  .style('background', isDark ? 'linear-gradient(145deg, #1e293b, #1a2234)' : 'linear-gradient(145deg, #ffffff, #f9fafb)')
  .style('border-radius', '16px')
  .style('overflow', 'hidden')
  .style('border', isDark ? '1px solid rgba(30, 41, 59, 0.8)' : '1px solid #e5e7eb');

data.forEach((model, index) => {
  const isHovered = hoveredCard === model.id;
  
  const listItem = list.append('div')
    .style('padding', '16px')
    .style('border-bottom', index < data.length - 1 ? 
      (isDark ? '1px solid rgba(30, 41, 59, 0.8)' : '1px solid #e5e7eb') : 
      'none')
    .style('background', isHovered ? 
      (isDark ? `linear-gradient(145deg, #1e293b, ${model.color}10)` : `linear-gradient(145deg, #ffffff, ${model.color}10)`) : 
      'transparent')
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
  
  // Создаем адаптивную структуру с горизонтальной прокруткой для узких экранов
  const rowContainer = listItem.append('div')
    .style('overflow-x', 'auto') // Добавляем горизонтальную прокрутку
    .style('scrollbar-width', 'thin') // Тонкий скроллбар для Firefox
    .style('scrollbar-color', isDark ? 'rgba(30, 41, 59, 0.5) transparent' : 'rgba(229, 231, 235, 0.5) transparent') // Цвет скроллбара для Firefox
    .style('margin-bottom', '5px') // Немного места для скроллбара
    .style('-webkit-overflow-scrolling', 'touch') // Плавный скролл на iOS
    .style('padding-bottom', '5px'); // Пространство для скроллбара
 
 // Добавляем стили скроллбара для webkit браузеров
 const style = document.createElement('style');
 if (!document.head.querySelector('[data-custom-scrollbar]')) {
   style.setAttribute('data-custom-scrollbar', 'true');
   style.textContent = `
     ::-webkit-scrollbar {
       height: 4px;
       width: 4px;
     }
     ::-webkit-scrollbar-track {
       background: transparent;
     }
     ::-webkit-scrollbar-thumb {
       background: ${isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(229, 231, 235, 0.5)'};
       border-radius: 4px;
     }
   `;
   document.head.appendChild(style);
 }
 
 // Основное содержимое теперь внутри контейнера с прокруткой
 const rowContent = rowContainer.append('div')
   .style('display', 'flex')
   .style('min-width', 'max-content') // Важно! Гарантирует, что содержимое не будет сжиматься
   .style('align-items', 'center')
   .style('gap', '20px');
 
 // Левая часть с изображением и названием (фиксированная слева)
 const leftPart = listItem.append('div') // Важно: добавляем к listItem напрямую
   .style('display', 'flex')
   .style('align-items', 'center')
   .style('margin-bottom', '10px'); // Добавляем отступ от прокручиваемой части
 
 leftPart.append('div')
   .style('width', '48px')
   .style('height', '48px')
   .style('min-width', '48px')
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
   .style('color', isDark ? '#f1f5f9' : '#1f2937')
   .style('font-size', '16px')
   .text(model.name);
 
 // Добавляем подпись "Всего" для модели рядом с названием
 nameContainer.append('div')
   .style('display', 'flex')
   .style('align-items', 'center')
   .style('margin-top', '4px');
 
 nameContainer.select('div:last-child')
   .append('span')
   .style('color', isDark ? '#94a3b8' : '#6b7280')
   .style('font-size', '12px')
   .style('margin-right', '4px')
   .text(`${t('statuses.total')}:`);
 
 nameContainer.select('div:last-child')
   .append('span')
   .style('color', isDark ? '#f1f5f9' : '#1f2937')
   .style('font-size', '14px')
   .style('font-weight', 'bold')
   .text(model.totalCount || 0);
 
 // Все статусы теперь в прокручиваемом контейнере
 
 // 1. Оплачено
 const paidBlock = rowContent.append('div')
   .style('display', 'flex')
   .style('flex-direction', 'column')
   .style('align-items', 'center')
   .style('min-width', '80px'); // Минимальная ширина для блока
 
 paidBlock.append('div')
   .style('color', isDark ? '#94a3b8' : '#6b7280')
   .style('font-size', '12px')
   .style('white-space', 'nowrap') // Предотвращаем перенос текста
   .text(t('statuses.paid'));
 
 paidBlock.append('div')
   .style('color', '#10b981')
   .style('font-size', '14px')
   .style('font-weight', 'bold')
   .text(model.paid_count || 0);
 
 // 2. Не оплачено/частично
 const unpaidBlock = rowContent.append('div')
   .style('display', 'flex')
   .style('flex-direction', 'column')
   .style('align-items', 'center')
   .style('min-width', '80px');
 
 unpaidBlock.append('div')
   .style('color', isDark ? '#94a3b8' : '#6b7280')
   .style('font-size', '12px')
   .style('white-space', 'nowrap')
   .text(t('statuses.partiallyPaid'));
 
 unpaidBlock.append('div')
   .style('color', '#ef4444')
   .style('font-size', '14px')
   .style('font-weight', 'bold')
   .text(model.no_paid_count || 0);
 
 // 3. Не/част. оплачено
 const newBlock = rowContent.append('div')
   .style('display', 'flex')
   .style('flex-direction', 'column')
   .style('align-items', 'center')
   .style('min-width', '80px');
 
 newBlock.append('div')
   .style('color', isDark ? '#94a3b8' : '#6b7280')
   .style('font-size', '12px')
   .style('white-space', 'nowrap')
   .text(t('statuses.partiallyPaid'));
 
 newBlock.append('div')
   .style('color', '#ef4444')
   .style('font-size', '14px')
   .style('font-weight', 'bold')
   .text(model.state_new || 0);
 
 // 4. Оплачено (статус)
 const waitingBlock = rowContent.append('div')
   .style('display', 'flex')
   .style('flex-direction', 'column')
   .style('align-items', 'center')
   .style('min-width', '80px');
 
 waitingBlock.append('div')
   .style('color', isDark ? '#94a3b8' : '#6b7280')
   .style('font-size', '12px')
   .style('white-space', 'nowrap')
   .text(t('statuses.paid'));
 
 waitingBlock.append('div')
   .style('color', '#f59e0b')
   .style('font-size', '14px')
   .style('font-weight', 'bold')
   .text(model.state_waiting || 0);
 
 // 5. На распределении
 const bindingBlock = rowContent.append('div')
   .style('display', 'flex')
   .style('flex-direction', 'column')
   .style('align-items', 'center')
   .style('min-width', '80px');
 
 bindingBlock.append('div')
   .style('color', isDark ? '#94a3b8' : '#6b7280')
   .style('font-size', '12px')
   .style('white-space', 'nowrap')
   .text(t('statuses.inDistribution'));
 
 bindingBlock.append('div')
   .style('color', '#60a5fa')
   .style('font-size', '14px')
   .style('font-weight', 'bold')
   .text(model.state_binding || 0);
 
 // 6. Распределён
 const reservedBlock = rowContent.append('div')
   .style('display', 'flex')
   .style('flex-direction', 'column')
   .style('align-items', 'center')
   .style('min-width', '80px');
 
 reservedBlock.append('div')
   .style('color', isDark ? '#94a3b8' : '#6b7280')
   .style('font-size', '12px')
   .style('white-space', 'nowrap')
   .text(t('statuses.distributed'));
 
 reservedBlock.append('div')
   .style('color', '#3b82f6')
   .style('font-size', '14px')
   .style('font-weight', 'bold')
   .text(model.state_reserved || 0);
 
 // 7. В пути
 const movingBlock = rowContent.append('div')
   .style('display', 'flex')
   .style('flex-direction', 'column')
   .style('align-items', 'center')
   .style('min-width', '80px');
 
 movingBlock.append('div')
   .style('color', isDark ? '#94a3b8' : '#6b7280')
   .style('font-size', '12px')
   .style('white-space', 'nowrap')
   .text(t('statuses.inTransit'));
 
 movingBlock.append('div')
   .style('color', '#8b5cf6')
   .style('font-size', '14px')
   .style('font-weight', 'bold')
   .text(model.state_moving || 0);
 
 // 8. У дилера
 const completeBlock = rowContent.append('div')
   .style('display', 'flex')
   .style('flex-direction', 'column')
   .style('align-items', 'center')
   .style('min-width', '80px');
 
 completeBlock.append('div')
   .style('color', isDark ? '#94a3b8' : '#6b7280')
   .style('font-size', '12px')
   .style('white-space', 'nowrap')
   .text(t('statuses.atDealer'));
 
 completeBlock.append('div')
   .style('color', '#10b981')
   .style('font-size', '14px')
   .style('font-weight', 'bold')
   .text(model.state_complete || 0);
 
 // 9. Бронь
 const bookedBlock = rowContent.append('div')
   .style('display', 'flex')
   .style('flex-direction', 'column')
   .style('align-items', 'center')
   .style('min-width', '80px');
 
 bookedBlock.append('div')
   .style('color', isDark ? '#94a3b8' : '#6b7280')
   .style('font-size', '12px')
   .style('white-space', 'nowrap')
   .text(t('statuses.reserved'));
 
 bookedBlock.append('div')
   .style('color', '#6366f1')
   .style('font-size', '14px')
   .style('font-weight', 'bold')
   .text(model.state_booked || 0);
 
 // Добавляем индикатор скролла для ясности UI
 const scrollIndicator = listItem.append('div')
   .style('display', 'flex')
   .style('justify-content', 'center')
   .style('align-items', 'center')
   .style('margin-top', '6px')
   .style('color', isDark ? '#94a3b8' : '#6b7280')
   .style('font-size', '10px');
 
 scrollIndicator.append('svg')
   .attr('xmlns', 'http://www.w3.org/2000/svg')
   .attr('width', '16')
   .attr('height', '16')
   .attr('viewBox', '0 0 24 24')
   .attr('fill', 'none')
   .attr('stroke', 'currentColor')
   .attr('stroke-width', '2')
   .attr('stroke-linecap', 'round')
   .attr('stroke-linejoin', 'round')
   .html('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>');
 
 scrollIndicator.append('span')
   .style('margin-left', '4px')
   .text(currentLocale === 'ru' ? 'Прокрутите для просмотра всех статусов' : 'Barcha holatlarni ko\'rish uchun aylantiring');
 
 // Показываем индикатор скролла только если контент выходит за пределы видимой области
 setTimeout(() => {
   const rowContentWidth = rowContent.node().getBoundingClientRect().width;
   const containerWidth = rowContainer.node().getBoundingClientRect().width;
   
   if (rowContentWidth <= containerWidth) {
     scrollIndicator.style('display', 'none');
   }
 }, 100);
});
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
   // Проверяем ширину экрана для адаптивной высоты графика
   const isMobile = window.innerWidth < 768;
   const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
   
   // Адаптируем высоту и отступы в зависимости от размера экрана
   const height = isMobile ? 300 : (isTablet ? 350 : 400);
   const margin = { 
     top: 40, 
     right: isMobile ? 10 : 20,
     bottom: isMobile ? 120 : 100,
     left: isMobile ? 40 : 50
   };

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
     .style('background', isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)')
     .style('color', isDark ? '#f1f5f9' : '#1f2937')
     .style('padding', '10px')
     .style('border-radius', '6px')
     .style('font-size', '12px')
     .style('box-shadow', isDark ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.1)')
     .style('z-index', '1000')
     .style('max-width', '220px')
     .style('border', isDark ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid #e5e7eb');

   // Создаем шкалы
   const x = d3.scaleBand()
     .domain(statusData.map(d => d.name))
     .range([margin.left, width - margin.right])
     .padding(isMobile ? 0.3 : 0.5); // Уменьшаем отступы для мобильных устройств

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
     .attr('transform', `rotate(${isMobile ? -35 : -25})`) // Больший угол наклона для мобильных
     .style('text-anchor', 'end')
     .style('font-size', isMobile ? '10px' : '12px') // Меньший размер шрифта для мобильных
     .style('fill', isDark ? '#94a3b8' : '#6b7280');

   svg.append('g')
     .attr('transform', `translate(${margin.left},0)`)
     .call(d3.axisLeft(y).ticks(isMobile ? 3 : 5).tickFormat(d => d)) // Меньше делений для мобильных
     .call(g => g.select('.domain').remove())
     .call(g => g.selectAll('.tick line')
       .attr('x2', width - margin.left - margin.right)
       .attr('stroke', isDark ? '#334155' : '#e5e7eb')
       .attr('stroke-opacity', 0.2))
     .selectAll('text')
     .style('font-size', isMobile ? '10px' : '12px')
     .style('fill', isDark ? '#94a3b8' : '#6b7280');

   // Добавляем сетку (меньше линий для мобильных)
   svg.selectAll('.grid-line')
     .data(y.ticks(isMobile ? 3 : 5))
     .enter()
     .append('line')
     .attr('class', 'grid-line')
     .attr('x1', margin.left)
     .attr('x2', width - margin.right)
     .attr('y1', d => y(d))
     .attr('y2', d => y(d))
     .attr('stroke', isDark ? '#334155' : '#e5e7eb')
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
     .attr('rx', isMobile ? 4 : 8) // Уменьшаем скругление для мобильных
     .attr('fill', (d, i) => `url(#status-gradient-${i})`)
     .attr('stroke', isDark ? '#0f172a' : '#e5e7eb')
     .attr('stroke-width', 1);
   
   // Добавляем обработчики событий без изменения цвета
   bars.on('mouseover', function(event, d) {
       tooltip
         .style('visibility', 'visible')
         .html(`
           <div>
             <div style="display: flex; align-items: center; margin-bottom: 5px;">
               <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${d.color}; margin-right: 5px;"></div>
               <strong>${d.name}</strong>
             </div>
             <div style="margin-top: 8px; font-weight: bold;">${t('modelDetails.quantityTable')}: ${d.value}</div>
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

   // Добавляем подписи над столбцами (скрываем на мобильных, если слишком много или значения маленькие)
   svg.selectAll('.bar-label')
     .data(statusData)
     .enter()
     .filter(d => !isMobile || d.value > 5) // Фильтруем метки для мобильных
     .append('text')
     .attr('class', 'bar-label')
     .attr('x', d => x(d.name) + x.bandwidth() / 2)
     .attr('y', d => y(d.value) - (isMobile ? 5 : 10))
     .attr('text-anchor', 'middle')
     .style('font-size', isMobile ? '12px' : '14px')
     .style('font-weight', 'bold')
     .style('fill', d => d3.color(d.color).brighter(0.3))
     .style('filter', 'url(#glow)')
     .text(d => d.value)
     .style('opacity', 0)
     .transition()
     .duration(500)
     .delay((d, i) => i * 100 + 800)
     .style('opacity', 1);

   // Добавляем линию тренда (убираем для очень узких экранов)
   if (!isMobile) {
     const line = d3.line()
       .x(d => x(d.name) + x.bandwidth() / 2)
       .y(d => y(d.value))
       .curve(d3.curveMonotoneX);

     svg.append('path')
       .datum(statusData)
       .attr('fill', 'none')
       .attr('stroke', isDark ? '#94a3b8' : '#6b7280')
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
       .attr('r', isTablet ? 4 : 5) // Меньший размер для планшетов
       .attr('fill', isDark ? '#f8fafc' : '#1f2937')
       .attr('stroke', d => d.color)
       .attr('stroke-width', 2)
       .style('filter', 'url(#glow)')
       .style('opacity', 0)
       .transition()
       .duration(300)
       .delay((d, i) => i * 100 + 1100)
       .style('opacity', 1);
   }
 };

 // Функция для отображения таблицы статусов
 const renderStatusTable = () => {
   return (
     <div className="overflow-x-auto">
       <div className="flex mb-2 pb-2 border-b border-slate-700/50">
         <div className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'} uppercase tracking-wider pl-3 w-1/2`}>{t('modelDetails.statusesTable')}</div>
         <div className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'} uppercase tracking-wider w-1/2`}>{t('modelDetails.quantityTable')}</div>
       </div>
       
       {statusData.map((status, index) => (
         <div 
           key={index} 
           className={`flex py-2 ${isDark ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'} transition-colors`}
         >
           <div className="flex items-center pl-3 w-1/2">
             <div 
               className="h-3 w-3 rounded-full mr-2" 
               style={{ 
                 backgroundColor: status.color,
                 boxShadow: `0 0 10px ${status.color}70`
               }}
             ></div>
             <div className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
               {status.name}
             </div>
           </div>
           <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'} w-1/2`}>{status.value}</div>
         </div>
       ))}
       
       <div className={`flex pt-2 mt-2 border-t ${isDark ? 'border-slate-700/50' : 'border-gray-200'} font-medium`}>
         <div className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'} pl-3 w-1/2`}>{t('statuses.total').toUpperCase()}</div>
         <div className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'} w-1/2`}>
           {statusData.reduce((acc, curr) => acc + curr.value, 0)}
         </div>
       </div>
     </div>
   );
 };

 // Компонент для отображения UI
 return (
   <>
     {isLoading && <ContentReadyLoader timeout={2000} />}
     
     <div className={`${isDark ? 'bg-dark text-white' : 'bg-white text-gray-900'} p-3 md:p-6 shadow-2xl border ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
         <h1 className={`text-xl md:text-2xl font-bold bg-gradient-to-r ${isDark ? 'from-blue-500 to-purple-500' : 'from-blue-600 to-purple-600'} text-transparent bg-clip-text`}>
           {isWholesale ? t('wholesale') : t('retail')}: {t('statusAndDistribution')}
         </h1>
         
         <div className="flex flex-wrap gap-3">
           {/* Переключатель между режимами опт/розница */}
           <div className={`flex space-x-2 ${isDark ? 'bg-slate-800' : 'bg-gray-100'} p-1 rounded-lg`}>
             <button
               onClick={() => toggleWholesale(false)}
               className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                 !isWholesale
                   ? isDark 
                     ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                     : 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                   : isDark
                     ? 'bg-transparent text-slate-300 hover:bg-slate-700'
                     : 'bg-transparent text-gray-700 hover:bg-gray-200'
               }`}
             >
               {currentLocale === 'ru' ? 'Розница' : 'Chakana'}
             </button>
             <button
               onClick={() => toggleWholesale(true)}
               className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                 isWholesale
                   ? isDark 
                     ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                     : 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                   : isDark
                     ? 'bg-transparent text-slate-300 hover:bg-slate-700'
                     : 'bg-transparent text-gray-700 hover:bg-gray-200'
               }`}
             >
               {currentLocale === 'ru' ? 'Опт' : 'Ulgurji'}
             </button>
           </div>
         </div>
       </div>
       
       {/* Навигационная панель и фильтры */}
       <div className={`${isDark ? 'bg-slate-800' : 'bg-gray-100'} p-3 md:p-4 rounded-xl mb-6 border ${isDark ? 'border-slate-700/50' : 'border-gray-200'} shadow-md`}>
         <div className="flex flex-wrap items-center gap-4">
           {/* Сброс всех фильтров */}
           <button 
             onClick={resetFilters}
             className={`px-3 py-2 ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'} rounded-lg text-sm font-medium transition-all flex items-center`}
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
               <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
             </svg>
             {t('filters.reset')}
           </button>
           
           {/* Выбор региона */}
           <div className="flex items-center">
             <span className={`${isDark ? 'text-slate-400' : 'text-gray-600'} mr-2 text-sm`}>{t('filters.region')}:</span>
             <select 
               value={filterRegion}
               onChange={handleRegionSelect}
               className={`${isDark ? 'bg-slate-700 text-slate-200' : 'bg-white text-gray-700 border border-gray-200'} px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500`}
             >
               <option value="all">{t('filters.allRegions')}</option>
               {data.map((region, index) => (
                 <option key={`region-${index}`} value={`region-${index}`}>{region.region}</option>
               ))}
             </select>
           </div>
           
           <div className="flex items-center">
             <span className={`${isDark ? 'text-slate-400' : 'text-gray-600'} mr-2 text-sm`}>{t('filters.model')}:</span>
             <select 
               value={filterModel}
               onChange={handleModelSelect}
               className={`${isDark ? 'bg-slate-700 text-slate-200' : 'bg-white text-gray-700 border border-gray-200'} px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500`}
             >
               <option value="all">{t('filters.allModels')}</option>
               {Array.from(new Set(data.flatMap(region => region.models.map(model => model.model))))
                 .sort()
                 .map((modelName, index) => (
                   <option key={index} value={modelName}>{modelName}</option>
                 ))
               }
             </select>
           </div>
           
           {/* Отображение текущего пути */}
           <div className="flex items-center ml-auto mt-2 md:mt-0">
             <span className={`${isDark ? 'text-slate-400' : 'text-gray-600'} text-sm`}>{t('filters.currentView')}:</span>
             <div className="flex items-center ml-2">
               <span className="text-blue-400 font-medium text-sm">
                 {currentView === 'general' 
                   ? t('views.general')
                   : currentView === 'region' 
                     ? t('views.region', { regionName: selectedRegion?.name }) 
                     : currentView === 'model' && selectedRegion 
                       ? t('views.regionModel', { regionName: selectedRegion.name, modelName: selectedModel?.name }) 
                       : t('views.model', { modelName: selectedModel?.name })
                 }
               </span>
             </div>
           </div>
         </div>
       </div>
       
       <p className={`${isDark ? 'text-slate-400' : 'text-gray-600'} mb-6 font-medium text-sm md:text-base`}>
         {currentView === 'general' 
           ? `${t('statuses.title')} ${isWholesale ? `(${t('wholesale')})` : `(${t('retail')})`}`
           : currentView === 'region'
             ? t('modelDetails.titleRegion', { regionName: selectedRegion?.name })
             : t('modelDetails.titleModel', { modelName: selectedModel?.name })}
       </p>
       
       <div className="mb-6">
         {currentView !== 'model' && (
           <div className={`lg:col-span-8 ${isDark ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'} p-4 md:p-6 rounded-2xl shadow-xl border ${isDark ? 'border-slate-700/50' : 'border-gray-200'} relative overflow-hidden mb-6`}>
             <div className={`absolute top-0 right-0 w-full h-full bg-gradient-to-br ${isDark ? 'from-purple-500/5 to-pink-500/5' : 'from-purple-500/10 to-pink-500/10'} z-0 pointer-events-none`}></div>
             <div className="relative z-10">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
                 <h2 className={`text-lg font-bold ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>{t('statuses.title')}</h2>
                 <div className={`text-base md:text-[18px] font-medium ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                   {t('statuses.totalOrders')}: {statusData.reduce((acc, curr) => acc + curr.value, 0)}
                 </div>
               </div>
               
               {/* Табы для переключения между графиком и таблицей */}
               <div className="flex space-x-2 mb-6">
                 <button
                   onClick={() => setStatusView('chart')}
                   className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                     statusView === 'chart' 
                       ? isDark 
                         ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                         : 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                       : isDark
                         ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                         : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                   }`}
                 >
                   {t('statuses.chart')}
                 </button>
                 <button
                   onClick={() => setStatusView('table')}
                   className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                     statusView === 'table' 
                       ? isDark 
                         ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                         : 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                       : isDark
                         ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                         : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                   }`}
                 >
                   {t('statuses.table')}
                 </button>
               </div>
               
               <div className="flex flex-wrap justify-center gap-6 mb-6">
                 {/* Используем напрямую поля paid_count и no_paid_count */}
                 <div className="flex flex-col items-center">
                   <div 
                     className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mb-2 shadow-lg relative"
                     style={{ 
                       background: `radial-gradient(circle, #10b98130 0%, #10b98110 70%)`
                     }}
                   >
                     <div 
                       className="absolute inset-0 rounded-full z-0"
                       style={{ boxShadow: `0 0 20px #10b98130` }}
                     ></div>
                     <span className="text-xl md:text-2xl font-bold relative z-10" style={{ color: '#10b981' }}>
                       {selectedRegion
                         ? modelsByRegion[selectedRegion.id]?.reduce((sum, model) => sum + (model.paid_count || 0), 0)
                         : models.reduce((sum, model) => sum + (model.paid_count || 0), 0)}
                     </span>
                   </div>
                   <span className={`text-xs md:text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{t('statuses.paid')}</span>
                 </div>
                 
                 <div className="flex flex-col items-center">
                   <div 
                     className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mb-2 shadow-lg relative"
                     style={{ 
                       background: `radial-gradient(circle, #ef444430 0%, #ef444410 70%)`
                     }}
                   >
                     <div 
                       className="absolute inset-0 rounded-full z-0"
                       style={{ boxShadow: `0 0 20px #ef444430` }}
                     ></div>
                     <span className="text-xl md:text-2xl font-bold relative z-10" style={{ color: '#ef4444' }}>
                       {selectedRegion
                         ? modelsByRegion[selectedRegion.id]?.reduce((sum, model) => sum + (model.no_paid_count || 0), 0)
                         : models.reduce((sum, model) => sum + (model.no_paid_count || 0), 0)}
                     </span>
                   </div>
                   <span className={`text-xs md:text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{t('statuses.unpaid')}</span>
                 </div>
               </div>
               
               {/* Отображаем график или таблицу в зависимости от выбранной вкладки */}
               {statusView === 'chart' ? (
                 <div ref={statusChartRef} className="w-full" ></div>
               ) : (
                 renderStatusTable()
               )}
             </div>
           </div>
         )}
       </div>
       
       {/* Карточка с моделями или регионами */}
       <div className={`${isDark ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'} h-full p-4 md:p-6 rounded-2xl shadow-xl border ${isDark ? 'border-slate-700/50' : 'border-gray-200'} mb-6 relative overflow-hidden`}>
         <div className={`absolute top-0 right-0 w-full h-full bg-gradient-to-br ${isDark ? 'from-indigo-500/5 to-blue-500/5' : 'from-indigo-500/10 to-blue-500/10'} z-0`}></div>
         <div className="relative z-10">
           <div className="flex justify-between items-center mb-6">
             <h2 className={`text-base md:text-lg font-bold ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
               {currentView === 'general' 
                 ? (isWholesale ? t('modelDetails.titleWholesale') : t('modelDetails.titleRetail'))
                 : currentView === 'region'
                   ? t('modelDetails.titleRegion', { regionName: selectedRegion?.name })
                   : currentView === 'model' && selectedRegion
                     ? t('modelDetails.titleModelRegion', { modelName: selectedModel?.name, regionName: selectedRegion?.name })
                     : t('modelDetails.titleModel', { modelName: selectedModel?.name })}
             </h2>
           </div>
           <div ref={modelsChartRef} className="w-full" style={{ 
             maxHeight: currentView === 'model' ? 'none' : '650px', 
             overflowY: currentView === 'model' ? 'visible' : 'auto' 
           }}></div>
         </div>
       </div>

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
         
         /* Адаптивные стили для мобильных устройств */
         @media (max-width: 640px) {
           .tooltip {
             max-width: 180px;
             font-size: 10px;
             padding: 8px;
           }
         }
         
         /* Адаптивные стили для планшетов */
         @media (min-width: 641px) and (max-width: 1024px) {
           .tooltip {
             max-width: 200px;
           }
         }
       `}</style>
     </div>
   </>
 );
};

export default ModelTrackingDashboard;