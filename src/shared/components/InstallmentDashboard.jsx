// InstallmentDashboard.jsx
'use client';
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import ContentReadyLoader from '@/src/shared/layout/ContentReadyLoader';

const InstallmentDashboard = () => {
  // Refs for charts
  const mainChartRef = useRef(null);
  const modelChartRef = useRef(null);
  const paymentStatusRef = useRef(null);
  const monthlyTrendsRef = useRef(null);
  const regionChartRef = useRef(null);

  // API data state
  const [apiData, setApiData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    count: 0,
    amount: 0,
    average: 0,
    paid: 0,
    overdue: 0,
    remaining: 0,
    paidPercentage: 0,
    overduePercentage: 0,
    totalPaid: 0,
    totalPrepayment: 0
  });

  // State
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedModel, setSelectedModel] = useState(null);
  const [modelCompareMode, setModelCompareMode] = useState(false);
  const [viewMode, setViewMode] = useState('region'); // 'region' or 'model'
  const [activeTab, setActiveTab] = useState('contracts');

  // Загрузка данных API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('https://uzavtosalon.uz/b/dashboard/infos&auto_installments');
        if (!response.ok) {
          throw new Error('Ошибка получения данных');
        }
        const data = await response.json();
        
        // Фильтрация моделей с контрактами
        const modelsWithContracts = data.filter(model => {
          return model.filter_by_region && model.filter_by_region.some(region => 
            parseInt(region.contract_count || 0) > 0
          );
        });
        
        setApiData(modelsWithContracts);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        // Даем время для загрузки изображений и расчетов
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
      }
    };
    
    fetchData();
  }, []);

  // Функция для безопасного преобразования строк в числа, учитывающая "0"
  const safeParseInt = (value) => {
    // Если value строка "0", parseInt вернет 0
    // Если value null или undefined, вернем 0
    // Если value другая строка, преобразуем ее в число
    return parseInt(value || 0);
  };

  // Функция для расчета статистики с корректной обработкой числовых значений
  const calculateStats = (apiData, selectedRegion, selectedModelId, activeTab) => {
    if (!apiData || !Array.isArray(apiData)) {
      return { count: 0, amount: 0, average: 0 };
    }

    let totalContracts = 0;
    let totalAmount = 0;
    let totalPaid = 0;
    let totalPrepayment = 0;
    let totalOverdue = 0;

    if (selectedModelId !== 'all') {
      const modelData = apiData.find(model => model.model_id === selectedModelId);

      if (modelData) {
        if (selectedRegion !== 'all') {
          const regionData = modelData.filter_by_region?.find(r => r.region_id === selectedRegion);

          if (regionData) {
            // Используем safeParseInt для всех числовых значений
            totalContracts = safeParseInt(regionData.contract_count);
            totalAmount = safeParseInt(regionData.total_price);
            totalPaid = safeParseInt(regionData.total_paid);
            totalPrepayment = safeParseInt(regionData.total_prepayment);
            totalOverdue = safeParseInt(regionData.total_overdue);
          }
        } else {
          if (modelData.filter_by_region && Array.isArray(modelData.filter_by_region)) {
            modelData.filter_by_region.forEach(region => {
              // Используем safeParseInt для всех числовых значений
              totalContracts += safeParseInt(region.contract_count);
              totalAmount += safeParseInt(region.total_price);
              totalPaid += safeParseInt(region.total_paid);
              totalPrepayment += safeParseInt(region.total_prepayment);
              totalOverdue += safeParseInt(region.total_overdue);
            });
          }
        }
      }
    } else if (selectedRegion !== 'all') {
      apiData.forEach(model => {
        if (model.filter_by_region && Array.isArray(model.filter_by_region)) {
          const regionData = model.filter_by_region.find(r => r.region_id === selectedRegion);
          if (regionData) {
            // Используем safeParseInt для всех числовых значений
            totalContracts += safeParseInt(regionData.contract_count);
            totalAmount += safeParseInt(regionData.total_price);
            totalPaid += safeParseInt(regionData.total_paid);
            totalPrepayment += safeParseInt(regionData.total_prepayment);
            totalOverdue += safeParseInt(regionData.total_overdue);
          }
        }
      });
    } else {
      apiData.forEach(model => {
        if (model.filter_by_region && Array.isArray(model.filter_by_region)) {
          model.filter_by_region.forEach(region => {
            // Используем safeParseInt для всех числовых значений
            totalContracts += safeParseInt(region.contract_count);
            totalAmount += safeParseInt(region.total_price);
            totalPaid += safeParseInt(region.total_paid);
            totalPrepayment += safeParseInt(region.total_prepayment);
            totalOverdue += safeParseInt(region.total_overdue);
          });
        }
      });
    }

    const paidTotal = totalPaid + totalPrepayment;
    const remaining = Math.max(0, totalAmount - paidTotal - totalOverdue);
    const paidPercentage = totalAmount > 0 ? Math.round((paidTotal / totalAmount) * 100) : 0;
    const overduePercentage = totalAmount > 0 ? Math.round((totalOverdue / totalAmount) * 100) : 0;

    const average = totalContracts > 0 ? Math.round(totalAmount / totalContracts) : 0;

    const tabMultipliers = {
      contracts: { count: 1, amount: 1 },
      sales: { count: 1, amount: 1 },
      stock: { count: 1, amount: 1 },
      retail: { count: 1, amount: 1 },
      wholesale: { count: 1, amount: 1 },
      promotions: { count: 1, amount: 1 }
    };

    const multiplier = tabMultipliers[activeTab] || tabMultipliers.contracts;

    return {
      count: Math.round(totalContracts * multiplier.count),
      amount: Math.round(totalAmount * multiplier.amount),
      average: average,
      paid: paidTotal,
      overdue: totalOverdue,
      remaining: remaining,
      paidPercentage: paidPercentage,
      overduePercentage: overduePercentage,
      totalPaid: totalPaid,
      totalPrepayment: totalPrepayment
    };
  };

  // Добавим новый useEffect для обновления статистики
  useEffect(() => {
    if (apiData.length > 0) {
      const stats = calculateStats(
        apiData, 
        selectedRegion, 
        selectedModel ? selectedModel.model_id : 'all', 
        activeTab
      );
      setStatsData(stats);
    }
  }, [apiData, selectedRegion, selectedModel, activeTab]);
  
  // Визуализация данных при обновлении статистики или фильтров
  useEffect(() => {
    if (!isLoading && apiData.length > 0) {
      renderMainChart();
      renderModelChart();
      renderPaymentStatus();
      renderMonthlyTrends();
      renderRegionChart();
    }
  }, [statsData, selectedRegion, selectedModel, viewMode, modelCompareMode, isLoading, apiData]);

  // Обработчик выбора модели
  const handleModelSelect = (model) => {
    if (selectedModel?.model_id === model.model_id) {
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
      const modelInRegion = apiData.find(m => m.model_id === selectedModel.model_id);
      if (modelInRegion) {
        setSelectedModel(modelInRegion);
      }
    }
  };

  // Переключение режима сравнения моделей
  const toggleModelCompareMode = () => {
    setModelCompareMode(!modelCompareMode);
  };

  // Форматирование чисел
  const formatNumber = (num) => {
    if (num >= 1000000000000) {
      return `${(num / 1000000000000).toFixed(1)} трлн UZS`;
    } else if (num >= 1000000000) {
      return `${(num / 1000000000).toFixed(1)} млрд UZS`;
    } else if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)} млн UZS`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)} тыс UZS`;
    } else {
      return `${new Intl.NumberFormat('ru-RU').format(num)} UZS`;
    }
  };

  const formatNumberWithFullAmount = (num) => {
  // Форматирование с разделителями разрядов для полной суммы
  const fullFormatted = new Intl.NumberFormat('ru-RU').format(num);
  
  // Сокращенный формат для более компактного отображения
  let shortFormat;
  if (num >= 1000000000000) {
    shortFormat = `${(num / 1000000000000).toFixed(1)} трлн`;
  } else if (num >= 1000000000) {
    shortFormat = `${(num / 1000000000).toFixed(1)} млрд`;
  } else if (num >= 1000000) {
    shortFormat = `${(num / 1000000).toFixed(1)} млн`;
  } else if (num >= 1000) {
    shortFormat = `${(num / 1000).toFixed(1)} тыс`;
  } else {
    return `${fullFormatted} UZS`; // Для маленьких чисел возвращаем только полный формат
  }
  
  // Возвращаем сокращенный формат с полной суммой в скобках
  return `${fullFormatted} UZS`;
}

  // Получение списка регионов
  const getRegions = () => {
    if (!apiData || apiData.length === 0) return [];
    
    const firstModel = apiData[0];
    if (!firstModel || !firstModel.filter_by_region) return [];
    
    return firstModel.filter_by_region.map(r => ({
      id: r.region_id,
      name: r.region_name
    }));
  };

  // Получение категории модели по названию
  const getCategoryByName = (name) => {
    const lowerName = name?.toLowerCase() || '';
    if (lowerName.includes('tracker') || lowerName.includes('tahoe') || 
        lowerName.includes('captiva') || lowerName.includes('equinox') || 
        lowerName.includes('trailblazer') || lowerName.includes('traverse')) {
      return 'Внедорожник';
    } else if (lowerName.includes('malibu') || lowerName.includes('onix') || 
               lowerName.includes('lacetti') || lowerName.includes('cobalt') || 
               lowerName.includes('nexia')) {
      return 'Седан';
    } else {
      return 'Минивэн';
    }
  };

  // Получение данных по модели и региону с корректной обработкой числовых значений
  const getModelRegionData = (model, regionId) => {
    if (!model || !model.filter_by_region) return null;
    
    if (regionId === 'all') {
      // Суммируем данные по всем регионам для указанной модели
      return model.filter_by_region.reduce((acc, region) => {
        return {
          contract_count: acc.contract_count + safeParseInt(region.contract_count),
          total_price: acc.total_price + safeParseInt(region.total_price),
          total_paid: acc.total_paid + safeParseInt(region.total_paid),
          total_prepayment: acc.total_prepayment + safeParseInt(region.total_prepayment),
          total_overdue: acc.total_overdue + safeParseInt(region.total_overdue)
        };
      }, { 
        contract_count: 0, 
        total_price: 0, 
        total_paid: 0, 
        total_prepayment: 0, 
        total_overdue: 0 
      });
    } else {
      // Находим данные для конкретного региона
      const regionData = model.filter_by_region.find(r => r.region_id === regionId);
      if (!regionData) return null;
      
      return {
        contract_count: safeParseInt(regionData.contract_count),
        total_price: safeParseInt(regionData.total_price),
        total_paid: safeParseInt(regionData.total_paid),
        total_prepayment: safeParseInt(regionData.total_prepayment),
        total_overdue: safeParseInt(regionData.total_overdue)
      };
    }
  };

  // Получение данных по региону для всех моделей с корректной обработкой числовых значений
  const getRegionData = (regionId) => {
    if (!apiData || apiData.length === 0) return null;
    
    // Если выбраны все регионы, суммируем по всем моделям и всем регионам
    if (regionId === 'all') {
      return apiData.reduce((acc, model) => {
        if (model.filter_by_region && Array.isArray(model.filter_by_region)) {
          model.filter_by_region.forEach(region => {
            acc.contract_count += safeParseInt(region.contract_count);
            acc.total_price += safeParseInt(region.total_price);
            acc.total_paid += safeParseInt(region.total_paid);
            acc.total_prepayment += safeParseInt(region.total_prepayment);
            acc.total_overdue += safeParseInt(region.total_overdue);
          });
        }
        return acc;
      }, { 
        contract_count: 0, 
        total_price: 0, 
        total_paid: 0, 
        total_prepayment: 0, 
        total_overdue: 0 
      });
    }
    
    // Суммируем данные по конкретному региону для всех моделей
    return apiData.reduce((acc, model) => {
      if (model.filter_by_region && Array.isArray(model.filter_by_region)) {
        const regionData = model.filter_by_region.find(r => r.region_id === regionId);
        if (regionData) {
          acc.contract_count += safeParseInt(regionData.contract_count);
          acc.total_price += safeParseInt(regionData.total_price);
          acc.total_paid += safeParseInt(regionData.total_paid);
          acc.total_prepayment += safeParseInt(regionData.total_prepayment);
          acc.total_overdue += safeParseInt(regionData.total_overdue);
        }
      }
      return acc;
    }, { 
      contract_count: 0, 
      total_price: 0, 
      total_paid: 0, 
      total_prepayment: 0, 
      total_overdue: 0 
    });
  };

  // Генерация месячных данных на основе общих сумм
  const generateMonthlyData = (totalPaid, totalOverdue, monthCount = 9) => {
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен'];
    const monthsToShow = months.slice(0, monthCount);
    
    // Распределяем выплаты равномерно с небольшими вариациями
    const basePayment = totalPaid / monthCount;
    
    // Создаем нарастающий график оплаты
    let cumulativePaid = 0;
    
    return monthsToShow.map((month, index) => {
      // Добавляем немного случайности для естественности графика
      const variation = Math.random() * 0.3 + 0.85; // 0.85 - 1.15
      const monthlyPaid = basePayment * variation;
      cumulativePaid += monthlyPaid;
      
      // Для просрочки генерируем данные, которые нарастают ближе к концу периода
      const overdueFactor = (index / monthCount) * 1.5; // Больше просрочек ближе к концу
      const monthlyOverdue = (totalOverdue / monthCount) * overdueFactor;
      
      return {
        month,
        paid: cumulativePaid,
        unpaid: monthlyOverdue
      };
    });
  };

const renderMainChart = () => {
  if (!mainChartRef.current || apiData.length === 0) return;
  
  const container = mainChartRef.current;
  const width = container.clientWidth;
  const height = 300;
  
  d3.select(container).selectAll("*").remove();
  
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height);
  
  // Функция для точного расчета процента с округлением до 2 десятичных знаков
  const calculateExactPercentage = (part, total) => {
    if (!total || total === 0) return 0;
    return Math.round((part / total) * 100 * 100) / 100;
  };
  
  // Определяем, какие данные используем - для модели или региона
  let totalPrice = 0;
  let totalPaid = 0;
  let totalPrepayment = 0;
  let totalOverdue = 0;
  
  if (selectedModel) {
    const modelData = getModelRegionData(selectedModel, selectedRegion);
    if (modelData) {
      totalPrice = modelData.total_price;
      totalPaid = modelData.total_paid;
      totalPrepayment = modelData.total_prepayment;
      totalOverdue = modelData.total_overdue;
    }
  } else {
    const regionData = getRegionData(selectedRegion);
    if (regionData) {
      totalPrice = regionData.total_price;
      totalPaid = regionData.total_paid;
      totalPrepayment = regionData.total_prepayment;
      totalOverdue = regionData.total_overdue;
    }
  }
  
  // Расчет компонентов для диаграммы по правильной логике
  const paidTotal = totalPaid + totalPrepayment; // Оплаченная часть = предоплата + выплаты
  const remaining = Math.max(0, totalPrice - paidTotal - totalOverdue); // Оставшаяся часть = полная цена - оплачено - просрочено
  
  // Рассчитываем проценты с точным округлением
  const paidPercent = calculateExactPercentage(paidTotal, totalPrice);
  const overduePercent = calculateExactPercentage(totalOverdue, totalPrice);
  const remainingPercent = calculateExactPercentage(remaining, totalPrice);
  
  // Проверяем, что сумма процентов примерно равна 100%
  const totalPercent = paidPercent + overduePercent + remainingPercent;
  console.log('Main Chart percentages:', { 
    paidPercent, 
    overduePercent, 
    remainingPercent, 
    totalPercent,
    paidTotal,
    totalOverdue,
    remaining,
    totalPrice
  });
  
  // Формируем данные для графика
  let data = {
    carPrice: totalPrice,
    paidAmount: totalPaid,
    prepayment: totalPrepayment,
    remainingAmount: remaining,
    overdueDebt: totalOverdue,
    paidPercent: paidPercent,
    overduePercent: overduePercent,
    remainingPercent: remainingPercent
  };
  
  // Проверяем, что есть какие-то ненулевые данные
  const hasData = totalPrice > 0 && (paidTotal > 0 || totalOverdue > 0 || remaining > 0);
  
  if (!hasData) {
    // Отображаем сообщение, если нет данных
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '14px')
      .text('Нет данных для отображения');
    return;
  }
    
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
    .text(`${formatNumber(data.carPrice)}`);
  
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
    .text(`${formatNumber(data.remainingAmount)}`);

  // Центральная область для распределения
  const middleX = startX + boxWidth + arrowWidth/2;
  const middleWidth = width - 2*(startX + boxWidth) - arrowWidth;
  const barHeight = 40; // Увеличенная высота для лучшей видимости
  
  // Фон для шкалы прогресса
  svg.append('rect')
    .attr('x', middleX)
    .attr('y', height/2 - barHeight/2)
    .attr('width', middleWidth)
    .attr('height', barHeight)
    .attr('fill', '#334155')
    .attr('rx', 6);
  
  // Оплаченная часть
  svg.append('rect')
    .attr('x', middleX)
    .attr('y', height/2 - barHeight/2)
    .attr('width', 0)
    .attr('height', barHeight)
    .attr('fill', '#16a34a')
    .attr('rx', 6)
    .transition()
    .duration(1000)
    .attr('width', middleWidth * data.paidPercent / 100);
  
  // Просроченная часть
  svg.append('rect')
    .attr('x', middleX + middleWidth * data.paidPercent / 100)
    .attr('y', height/2 - barHeight/2)
    .attr('width', 0)
    .attr('height', barHeight)
    .attr('fill', '#dc2626')
    .transition()
    .duration(1000)
    .attr('width', middleWidth * data.overduePercent / 100);
  
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
  
  // Добавляем подписи для шкалы прогресса с процентами и суммами
  // Оплаченная часть
  if (data.paidPercent > 10) {
    svg.append('text')
      .attr('x', middleX + (middleWidth * data.paidPercent / 100) / 2)
      .attr('y', height/2 + 5)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text(`${data.paidPercent}%`);
  }
  
  // Просроченная часть
  if (data.overduePercent > 5) {
    svg.append('text')
      .attr('x', middleX + middleWidth * data.paidPercent / 100 + (middleWidth * data.overduePercent / 100) / 2)
      .attr('y', height/2 + 5)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text(`${data.overduePercent}%`);
  }
  
  // Метки ниже полосы прогресса
  svg.append('g')
    .attr('transform', `translate(${middleX}, ${height/2 + barHeight/2 + 20})`)
    .append('text')
    .attr('x', 0)
    .attr('y', 0)
    .attr('text-anchor', 'start')
    .attr('fill', '#16a34a')
    .attr('font-size', '12px')
    .text(`Оплачено: ${formatNumber(paidTotal)}`);
  
  svg.append('g')
    .attr('transform', `translate(${middleX + middleWidth/2}, ${height/2 + barHeight/2 + 20})`)
    .append('text')
    .attr('x', 0)
    .attr('y', 0)
    .attr('text-anchor', 'middle')
    .attr('fill', '#dc2626')
    .attr('font-size', '12px')
    .text(`Просрочено: ${formatNumber(totalOverdue)}`);
  
  svg.append('g')
    .attr('transform', `translate(${middleX + middleWidth}, ${height/2 + barHeight/2 + 20})`)
    .append('text')
    .attr('x', 0)
    .attr('y', 0)
    .attr('text-anchor', 'end')
    .attr('fill', '#94a3b8')
    .attr('font-size', '12px')
    .text(`Остаток: ${formatNumber(remaining)}`);
  
  // Проценты под суммами
  svg.append('g')
    .attr('transform', `translate(${middleX}, ${height/2 + barHeight/2 + 35})`)
    .append('text')
    .attr('x', 0)
    .attr('y', 0)
    .attr('text-anchor', 'start')
    .attr('fill', '#94a3b8')
    .attr('font-size', '10px')
    .text(`${data.paidPercent}%`);
  
  svg.append('g')
    .attr('transform', `translate(${middleX + middleWidth/2}, ${height/2 + barHeight/2 + 35})`)
    .append('text')
    .attr('x', 0)
    .attr('y', 0)
    .attr('text-anchor', 'middle')
    .attr('fill', '#94a3b8')
    .attr('font-size', '10px')
    .text(`${data.overduePercent}%`);
  
  svg.append('g')
    .attr('transform', `translate(${middleX + middleWidth}, ${height/2 + barHeight/2 + 35})`)
    .append('text')
    .attr('x', 0)
    .attr('y', 0)
    .attr('text-anchor', 'end')
    .attr('fill', '#94a3b8')
    .attr('font-size', '10px')
    .text(`${data.remainingPercent}%`);
  
  // Добавляем подпись выбранного региона и модели
  const regionName = selectedRegion === 'all' ? 'Все регионы' : 
    getRegions().find(r => r.id === selectedRegion)?.name || 'Неизвестный регион';
    
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', height - 15)
    .attr('text-anchor', 'middle')
    .attr('fill', '#94a3b8')
    .attr('font-size', '12px')
    .text(`Регион: ${regionName}${selectedModel ? ` - Модель: ${selectedModel.model_name}` : ''}`);
};

  // Диаграмма по моделям (горизонтальные бары)
  const renderModelChart = () => {
    if (!modelChartRef.current || apiData.length === 0) return;
    
    const container = modelChartRef.current;
    const width = container.clientWidth;
    const height = 200;
    
    d3.select(container).selectAll("*").remove();
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);
    
    // Получаем топ-модели для текущего региона
    const models = apiData
      .filter(model => {
        if (selectedRegion === 'all') {
          return model.filter_by_region.some(r => parseInt(r.contract_count || 0) > 0);
        } else {
          const regionData = model.filter_by_region.find(r => r.region_id === selectedRegion);
          return regionData && parseInt(regionData.contract_count || 0) > 0;
        }
      })
      .sort((a, b) => {
        const aData = getModelRegionData(a, selectedRegion);
        const bData = getModelRegionData(b, selectedRegion);
        return (bData?.contract_count || 0) - (aData?.contract_count || 0);
      })
      .slice(0, 5); // Показываем только топ-5 моделей
    
    // Заголовок
    svg.append('text')
      .attr('x', 10)
      .attr('y', 20)
      .attr('fill', 'white')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('Топ моделей по количеству рассрочек');
    
    const margin = { top: 30, right: 20, bottom: 10, left: 100 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    // Шкалы
    const y = d3.scaleBand()
      .domain(models.map(m => m.model_id))
      .range([0, chartHeight])
      .padding(0.3);
    
    const x = d3.scaleLinear()
      .domain([0, d3.max(models, m => {
        const data = getModelRegionData(m, selectedRegion);
        return data?.contract_count || 0;
      }) * 1.1])
      .range([0, chartWidth]);
    
    const chart = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    // Фон для баров
    chart.selectAll('.bar-bg')
      .data(models)
      .join('rect')
      .attr('class', 'bar-bg')
    .attr('y', m => y(m.model_id))
     .attr('height', y.bandwidth())
     .attr('x', 0)
     .attr('width', chartWidth)
     .attr('fill', '#1e293b')
     .attr('rx', 4);
     
   // Бары
   chart.selectAll('.bar')
     .data(models)
     .join('rect')
     .attr('class', 'bar')
     .attr('y', m => y(m.model_id))
     .attr('height', y.bandwidth())
     .attr('x', 0)
     .attr('width', 0)
     .attr('fill', (m, i) => d3.schemeCategory10[i % 10])
     .attr('rx', 4)
     .transition()
     .duration(1000)
     .attr('width', m => {
       const data = getModelRegionData(m, selectedRegion);
       return x(data?.contract_count || 0);
     });
   
   // Названия моделей
   chart.selectAll('.model-name')
     .data(models)
     .join('text')
     .attr('class', 'model-name')
     .attr('y', m => y(m.model_id) + y.bandwidth() / 2)
     .attr('x', -5)
     .attr('text-anchor', 'end')
     .attr('dominant-baseline', 'middle')
     .attr('fill', 'white')
     .attr('font-size', '12px')
     .text(m => m.model_name.length > 12 ? m.model_name.substring(0, 12) + '...' : m.model_name);
   
   // Количество контрактов
   chart.selectAll('.count')
     .data(models)
     .join('text')
     .attr('class', 'count')
     .attr('y', m => y(m.model_id) + y.bandwidth() / 2)
     .attr('x', m => {
       const data = getModelRegionData(m, selectedRegion);
       return x(data?.contract_count || 0) + 5;
     })
     .attr('dominant-baseline', 'middle')
     .attr('fill', 'white')
     .attr('font-size', '12px')
     .attr('font-weight', 'bold')
     .text(m => {
       const data = getModelRegionData(m, selectedRegion);
       return formatNumberWithFullAmount(data?.contract_count || 0);
     });
 };

const renderPaymentStatus = () => {
  if (!paymentStatusRef.current || apiData.length === 0) return;
  
  const container = paymentStatusRef.current;
  const width = container.clientWidth;
  const height = 200;
  
  d3.select(container).selectAll("*").remove();
  
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height);
  
  // Заголовок
  svg.append('text')
    .attr('x', 10)
    .attr('y', 20)
    .attr('fill', 'white')
    .attr('font-size', '14px')
    .attr('font-weight', 'bold')
    .text('Распределение платежей');
  
  // Определяем, какие данные используем - для модели или региона
  let totalPrice = 0;
  let totalPaid = 0;
  let totalPrepayment = 0;
  let totalOverdue = 0;
  
  if (selectedModel) {
    const modelData = getModelRegionData(selectedModel, selectedRegion);
    if (modelData) {
      totalPrice = modelData.total_price;
      totalPaid = modelData.total_paid;
      totalPrepayment = modelData.total_prepayment;
      totalOverdue = modelData.total_overdue;
    }
  } else {
    const regionData = getRegionData(selectedRegion);
    if (regionData) {
      totalPrice = regionData.total_price;
      totalPaid = regionData.total_paid;
      totalPrepayment = regionData.total_prepayment;
      totalOverdue = regionData.total_overdue;
    }
  }
  
  // Расчет компонентов для диаграммы по правильной логике
  const paidTotal = totalPaid + totalPrepayment; // Оплаченная часть = предоплата + выплаты
  const remaining = Math.max(0, totalPrice - paidTotal - totalOverdue); // Оставшаяся часть = полная цена - оплачено - просрочено
  
  // Функция для точного вычисления процента с округлением до 2 десятичных знаков
  const calculateExactPercentage = (part, total) => {
    if (!total || total === 0) return 0;
    return Math.round((part / total) * 100 * 100) / 100;
  };
  
  // Вычисляем проценты более точно
  const paidPercentage = calculateExactPercentage(paidTotal, totalPrice);
  const overduePercentage = calculateExactPercentage(totalOverdue, totalPrice);
  const remainingPercentage = calculateExactPercentage(remaining, totalPrice);
  
  // Отладочная информация для проверки вычислений
  console.log('Payment status calculations:', {
    totalPrice,
    paidTotal: totalPaid + totalPrepayment,
    totalOverdue,
    remaining,
    paidPercentage,
    overduePercentage,
    remainingPercentage,
    sum: paidPercentage + overduePercentage + remainingPercentage
  });
  
  // Проверяем, что есть какие-то ненулевые данные
  const hasData = totalPrice > 0 && (paidTotal > 0 || totalOverdue > 0 || remaining > 0);
  
  if (!hasData) {
    // Отображаем сообщение, если нет данных
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '14px')
      .text('Нет данных для отображения');
    return;
  }
  
  // Создаем данные для пирога с правильными значениями и процентами
  const pieData = [
    { label: 'Оплачено', value: paidTotal > 0 ? paidTotal : 0, color: '#16a34a', percentage: paidPercentage },
    { label: 'Просрочено', value: totalOverdue > 0 ? totalOverdue : 0, color: '#dc2626', percentage: overduePercentage },
    { label: 'Осталось', value: remaining > 0 ? remaining : 0, color: '#334155', percentage: remainingPercentage }
  ].filter(d => d.value > 0); // Фильтруем нулевые значения
  
  // Если даже после фильтрации нет данных, добавляем заглушку
  if (pieData.length === 0) {
    pieData.push({ label: 'Нет данных', value: 1, color: '#94a3b8', percentage: 100 });
  }
  
  // Создаем пирог с уменьшенным размером для более компактного вида
  const radius = Math.min(width, height) / 3; // Немного уменьшаем радиус
  const arcGenerator = d3.arc()
    .innerRadius(radius * 0.6) // Делаем пончик вместо пирога
    .outerRadius(radius);
  
  // Генератор пирога
  const pieGenerator = d3.pie()
    .value(d => d.value)
    .sort(null);
  
  // Сдвигаем график влево для увеличения расстояния до легенды
  const pieGroup = svg.append('g')
    .attr('transform', `translate(${width/3 - 20}, ${height/2})`);
  
  // Добавляем сегменты с анимацией
  const arcs = pieGroup.selectAll('path')
    .data(pieGenerator(pieData))
    .join('path')
    .attr('d', arcGenerator)
    .attr('fill', d => d.data.color)
    .attr('stroke', '#1e293b')
    .attr('stroke-width', 1)
    .style('opacity', 0.9);
  
  // Анимация появления
  arcs.transition()
    .duration(800)
    .attrTween('d', function(d) {
      const interpolate = d3.interpolate(
        { startAngle: d.startAngle, endAngle: d.startAngle },
        { startAngle: d.startAngle, endAngle: d.endAngle }
      );
      return function(t) {
        return arcGenerator(interpolate(t));
      };
    });
  
  // Форматирование больших чисел в сокращенном виде (млрд, млн, и т.д.)
  const formatLargeNumber = (num) => {
    if (num >= 1000000000000) {
      return `${(num / 1000000000000).toFixed(1)} трлн`;
    } else if (num >= 1000000000) {
      return `${(num / 1000000000).toFixed(1)} млрд`;
    } else if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)} млн`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)} тыс`;
    } else {
      return num.toString();
    }
  };
  
  // Добавляем текст в центр
  pieGroup.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', -5)
    .attr('fill', 'white')
    .attr('font-size', '12px')
    .text('Всего');
  
  pieGroup.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', 15)
    .attr('fill', 'white')
    .attr('font-size', '14px')
    .attr('font-weight', 'bold')
    .text(`${formatLargeNumber(totalPrice)}`);
  
  pieGroup.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', 32)
    .attr('fill', '#94a3b8')
    .attr('font-size', '12px')
    .text('UZS');
  
  // Компактная легенда с точными процентами - увеличенное расстояние от диаграммы
  const legend = svg.append('g')
    .attr('transform', `translate(${2*width/3 - 20}, ${height/2 - 50})`); // Сдвигаем легенду правее
  
  pieData.forEach((item, i) => {
    const legendItem = legend.append('g')
      .attr('transform', `translate(0, ${i * 32})`); // Увеличиваем расстояние между элементами легенды
    
    // Цветной квадрат
    legendItem.append('rect')
      .attr('width', 14)
      .attr('height', 14)
      .attr('fill', item.color)
      .attr('rx', 2);
    
    // Название и процент с точностью до 2 знаков после запятой
    legendItem.append('text')
      .attr('x', 22) // Немного увеличиваем отступ от цветного квадрата
      .attr('y', 11)
      .attr('fill', 'white')
      .attr('font-size', '13px') // Увеличиваем размер шрифта
      .text(`${item.label}: ${item.percentage}%`);
    
    // Сумма
    legendItem.append('text')
      .attr('x', 22)
      .attr('y', 26)
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .text(`${formatLargeNumber(item.value)} UZS`);
  });
};

 const renderMonthlyTrends = () => {
   if (!monthlyTrendsRef.current || apiData.length === 0) return;
   const container = monthlyTrendsRef.current;
   const width = container.clientWidth;
   const height = 250;
   const margin = { top: 30, right: 20, bottom: 40, left: 60 };
   
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
     .attr('font-size', '14px')
     .attr('font-weight', 'bold')
     .text('Динамика платежей');
   
   // Получаем данные для графика
   let monthlyPayments = [];
   
   if (selectedModel) {
     const modelData = getModelRegionData(selectedModel, selectedRegion);
     if (modelData) {
       monthlyPayments = generateMonthlyData(modelData.total_paid, modelData.total_overdue, 6); // Сокращаем до 6 месяцев
     }
   } else {
     const regionData = getRegionData(selectedRegion);
     if (regionData) {
       monthlyPayments = generateMonthlyData(regionData.total_paid, regionData.total_overdue, 6); // Сокращаем до 6 месяцев
     }
   }
   
   // Создаем шкалы
   const x = d3.scaleBand()
     .domain(monthlyPayments.map(d => d.month))
     .range([margin.left, width - margin.right])
     .padding(0.4);
   
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
     .call(d3.axisLeft(y).ticks(5).tickFormat(d => `$${d >= 1000 ? Math.round(d/1000) + 'k' : d}`))
     .selectAll('text')
     .attr('fill', '#94a3b8');
   
   // Градиент для столбцов
   const defs = svg.append('defs');
   
   // Градиент оплаченных платежей
   const paidGradient = defs.append('linearGradient')
     .attr('id', 'paidGradient')
     .attr('x1', '0%')
     .attr('y1', '0%')
     .attr('x2', '0%')
     .attr('y2', '100%');
   
   paidGradient.append('stop')
     .attr('offset', '0%')
     .attr('stop-color', '#16a34a');
   
   paidGradient.append('stop')
     .attr('offset', '100%')
     .attr('stop-color', '#10b981');
   
   // Градиент просроченных платежей
   const unpaidGradient = defs.append('linearGradient')
     .attr('id', 'unpaidGradient')
     .attr('x1', '0%')
     .attr('y1', '0%')
     .attr('x2', '0%')
     .attr('y2', '100%');
   
   unpaidGradient.append('stop')
     .attr('offset', '0%')
     .attr('stop-color', '#dc2626');
   
   unpaidGradient.append('stop')
     .attr('offset', '100%')
     .attr('stop-color', '#ef4444');
   
   // Добавляем столбцы оплаченных сумм с анимацией
   svg.selectAll('.paid-bar')
     .data(monthlyPayments)
     .join('rect')
     .attr('class', 'paid-bar')
     .attr('x', d => x(d.month))
     .attr('y', height - margin.bottom)
     .attr('width', x.bandwidth())
     .attr('height', 0)
     .attr('fill', 'url(#paidGradient)')
     .attr('rx', 4)
     .transition()
     .duration(1000)
     .attr('y', d => y(d.paid))
     .attr('height', d => height - margin.bottom - y(d.paid));
   
   // Добавляем столбцы просроченных платежей с анимацией
   svg.selectAll('.unpaid-bar')
     .data(monthlyPayments)
     .join('rect')
     .attr('class', 'unpaid-bar')
     .attr('x', d => x(d.month))
     .attr('y', height - margin.bottom)
     .attr('width', x.bandwidth())
     .attr('height', 0)
     .attr('fill', 'url(#unpaidGradient)')
     .attr('rx', 4)
     .transition()
     .duration(1000)
     .delay(300)
     .attr('y', d => y(d.paid + d.unpaid))
     .attr('height', d => y(d.paid) - y(d.paid + d.unpaid));
   
   // Добавляем линию тренда с анимацией
   const lineGenerator = d3.line()
     .x(d => x(d.month) + x.bandwidth() / 2)
     .y(d => y(d.paid + d.unpaid))
     .curve(d3.curveMonotoneX);
   
   const linePath = svg.append('path')
     .datum(monthlyPayments)
     .attr('fill', 'none')
     .attr('stroke', '#3b82f6')
     .attr('stroke-width', 3)
     .attr('d', lineGenerator);
   
   // Анимация линии
   const pathLength = linePath.node().getTotalLength();
   
   linePath
     .attr('stroke-dasharray', pathLength)
     .attr('stroke-dashoffset', pathLength)
     .transition()
     .duration(1500)
     .attr('stroke-dashoffset', 0);
   
   // Добавляем точки с анимацией
   svg.selectAll('.data-point')
     .data(monthlyPayments)
     .join('circle')
     .attr('class', 'data-point')
     .attr('cx', d => x(d.month) + x.bandwidth() / 2)
     .attr('cy', d => y(d.paid + d.unpaid))
     .attr('r', 0)
     .attr('fill', '#3b82f6')
     .attr('stroke', '#0f172a')
     .attr('stroke-width', 2)
     .transition()
     .duration(1000)
     .delay((_, i) => 500 + i * 100)
     .attr('r', 5);
   
   // Компактная легенда
   const legend = svg.append('g')
     .attr('transform', `translate(${width - 140}, 40)`);
   
   // Оплаченные платежи
   const paidLegend = legend.append('g');
   paidLegend.append('rect')
     .attr('width', 12)
     .attr('height', 12)
     .attr('fill', '#16a34a')
     .attr('rx', 2);
   
   paidLegend.append('text')
     .attr('x', 18)
     .attr('y', 10)
     .attr('fill', 'white')
     .attr('font-size', '11px')
     .text('Оплачено');
   
   // Просроченные платежи
   const unpaidLegend = legend.append('g')
     .attr('transform', 'translate(0, 20)');
   
   unpaidLegend.append('rect')
     .attr('width', 12)
     .attr('height', 12)
     .attr('fill', '#dc2626')
     .attr('rx', 2);
   
   unpaidLegend.append('text')
     .attr('x', 18)
     .attr('y', 10)
     .attr('fill', 'white')
     .attr('font-size', '11px')
     .text('Просрочено');
   
   // Общая сумма
   const totalLegend = legend.append('g')
     .attr('transform', 'translate(0, 40)');
   
   totalLegend.append('line')
     .attr('x1', 0)
     .attr('x2', 12)
     .attr('y1', 6)
     .attr('y2', 6)
     .attr('stroke', '#3b82f6')
     .attr('stroke-width', 2);
   
   totalLegend.append('circle')
     .attr('cx', 6)
     .attr('cy', 6)
     .attr('r', 3)
     .attr('fill', '#3b82f6');
   
   totalLegend.append('text')
     .attr('x', 18)
     .attr('y', 10)
     .attr('fill', 'white')
     .attr('font-size', '11px')
     .text('Общая сумма');
 };
  
const calculatePercentage = (part, total) => {
  if (!total || total === 0) return 0;
  return Math.round((part / total) * 100 * 100) / 100;
};
  
const RegionInfoCards = () => {
  const data = getRegionData(selectedRegion);
  
  if (!data) return null;
  
  // Функция для точного расчета процента с округлением до 2 десятичных знаков
  const calculateExactPercentage = (part, total) => {
    if (!total || total === 0) return 0;
    return Math.round((part / total) * 100 * 100) / 100;
  };
  
  // Получаем общие данные по всем регионам
  const allRegionsData = getRegionData('all');
  
  // Суммы для выбранного региона
  const paidTotal = data.total_paid + data.total_prepayment;
  const paidPercentage = calculateExactPercentage(paidTotal, data.total_price);
  const overduePercentage = calculateExactPercentage(data.total_overdue, data.total_price);
  
  // Суммы по всем регионам
  const totalPaidAll = allRegionsData ? (allRegionsData.total_paid + allRegionsData.total_prepayment) : 0;
  const totalOverdueAll = allRegionsData ? allRegionsData.total_overdue : 0;
  const totalPriceAll = allRegionsData ? allRegionsData.total_price : 0;
  
  // Проценты по всем регионам
  const paidPercentageAll = calculateExactPercentage(totalPaidAll, totalPriceAll);
  const overduePercentageAll = calculateExactPercentage(totalOverdueAll, totalPriceAll);
  
  // Отладочная информация
  console.log('RegionInfoCards calculations:', {
    region: selectedRegion,
    regionData: {
      total_price: data.total_price,
      total_paid: data.total_paid,
      total_prepayment: data.total_prepayment,
      total_overdue: data.total_overdue,
      paidPercentage,
      overduePercentage
    },
    allRegionsData: {
      total_price: totalPriceAll,
      total_paid: allRegionsData?.total_paid,
      total_prepayment: allRegionsData?.total_prepayment,
      total_overdue: totalOverdueAll,
      paidPercentageAll,
      overduePercentageAll
    }
  });
  
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
            <p className="text-2xl font-bold text-white">{formatNumberWithFullAmount(data.contract_count)}</p>
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
            <p className="text-2xl font-bold text-white">{paidPercentage}%</p>
            <p className="text-green-300/70 text-xs mt-1">
              {formatNumber(paidTotal)} из {formatNumber(data.total_price)}
            </p>
            {selectedRegion !== 'all' && (
              <p className="text-green-300/70 text-xs">
                Всего: {paidPercentageAll}% ({formatNumber(totalPaidAll)})
              </p>
            )}
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
            <p className="text-2xl font-bold text-white">{overduePercentage}%</p>
            <p className="text-red-300/70 text-xs mt-1">
              {formatNumber(data.total_overdue)} из {formatNumber(data.total_price)}
            </p>
            {selectedRegion !== 'all' && (
              <p className="text-red-300/70 text-xs">
                Всего: {overduePercentageAll}% ({formatNumber(totalOverdueAll)})
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

 const renderRegionChart = () => {
   if (!regionChartRef.current || apiData.length === 0) return;
   const container = regionChartRef.current;
   d3.select(container).selectAll("*").remove();
   
   const width = container.clientWidth;
   const height = 350;
   
   // Получаем регионы с данными о контрактах
   const regions = getRegions()
     .map(region => {
       const regionData = getRegionData(region.id);
       return {
         id: region.id,
         name: region.name,
         contractCount: regionData?.contract_count || 0
       };
     })
     .filter(region => region.contractCount > 0)
     .sort((a, b) => b.contractCount - a.contractCount)
     .slice(0, 8); // Только топ-8 регионов
   
   // Создаем SVG
   const svg = d3.select(container)
     .append('svg')
     .attr('width', width)
     .attr('height', height);
   
   // Заголовок
   svg.append('text')
     .attr('x', width / 2)
     .attr('y', 20)
     .attr('text-anchor', 'middle')
     .attr('fill', 'white')
     .attr('font-size', '14px')
     .attr('font-weight', 'bold')
     .text('Топ регионов по количеству рассрочек');
   
   // Настройки отступов
   const margin = { top: 40, right: 40, bottom: 20, left: 140 };
   const innerWidth = width - margin.left - margin.right;
   const innerHeight = height - margin.top - margin.bottom;
   
   // Группа для графика
   const g = svg.append('g')
     .attr('transform', `translate(${margin.left}, ${margin.top})`);
   
   // Шкалы
   const y = d3.scaleBand()
     .domain(regions.map(r => r.id))
     .range([0, innerHeight])
     .padding(0.4);
   
   const x = d3.scaleLinear()
     .domain([0, d3.max(regions, r => r.contractCount) * 1.1])
     .range([0, innerWidth]);
   
   // Ось Y (названия регионов)
   g.append('g')
     .call(d3.axisLeft(y)
       .tickSize(0)
       .tickPadding(10)
       .tickFormat(id => {
         const name = regions.find(r => r.id === id)?.name || '';
         // Обрезаем длинные названия
         return name.length > 18 ? name.substring(0, 18) + '...' : name;
       }))
     .call(g => g.select('.domain').remove())
     .selectAll('text')
     .attr('fill', d => d === selectedRegion ? '#ffffff' : '#94a3b8')
     .attr('font-weight', d => d === selectedRegion ? 'bold' : 'normal')
     .style('cursor', 'pointer')
     .on('click', (_, d) => handleRegionSelect(d));
   
   // Фон для баров
   g.selectAll('.bar-bg')
     .data(regions)
     .join('rect')
     .attr('class', 'bar-bg')
     .attr('y', d => y(d.id))
     .attr('height', y.bandwidth())
     .attr('x', 0)
     .attr('width', innerWidth)
     .attr('fill', '#1e293b')
     .attr('rx', 4);
   
   // Создаем градиент для баров
   const defs = svg.append('defs');
   
   const gradient = defs.append('linearGradient')
     .attr('id', 'barGradient')
     .attr('x1', '0%')
     .attr('y1', '0%')
     .attr('x2', '100%')
     .attr('y2', '0%');
   
   gradient.append('stop')
     .attr('offset', '0%')
     .attr('stop-color', '#3b82f6');
   
   gradient.append('stop')
     .attr('offset', '100%')
     .attr('stop-color', '#60a5fa');
   
   // Рисуем бары с анимацией
   g.selectAll('.bar')
     .data(regions)
     .join('rect')
     .attr('class', 'bar')
     .attr('y', d => y(d.id))
     .attr('height', y.bandwidth())
     .attr('x', 0)
     .attr('fill', d => d.id === selectedRegion ? 'url(#barGradient)' : '#64748b')
     .attr('rx', 4)
     .style('cursor', 'pointer')
     .on('click', (_, d) => handleRegionSelect(d.id))
     .attr('width', 0)
     .transition()
     .duration(800)
     .attr('width', d => x(d.contractCount));
   
   // Добавляем метки с количеством
   g.selectAll('.count')
     .data(regions)
     .join('text')
     .attr('class', 'count')
     .attr('y', d => y(d.id) + y.bandwidth() / 2)
     .attr('x', d => x(d.contractCount) - 10)
     .attr('dy', '0.35em')
     .attr('text-anchor', 'end')
     .attr('fill', 'white')
     .attr('font-size', '12px')
     .attr('font-weight', 'bold')
     .style('pointer-events', 'none') // Чтобы текст не мешал кликам
     .text(d => formatNumberWithFullAmount(d.contractCount));
   
   // Подсветка для выбранного региона
   if (selectedRegion !== 'all' && regions.some(r => r.id === selectedRegion)) {
     const selectedY = y(selectedRegion);
     if (selectedY !== undefined) {
       g.append('rect')
         .attr('x', -10)
         .attr('y', selectedY - 2)
         .attr('width', innerWidth + 20)
         .attr('height', y.bandwidth() + 4)
         .attr('fill', 'none')
         .attr('stroke', '#3b82f6')
         .attr('stroke-width', 1.5)
         .attr('stroke-dasharray', '3,2')
         .attr('rx', 5);
       
       // Добавляем индикатор выбора
       g.append('path')
         .attr('d', 'M-20,0L-12,5L-12,-5Z') // Форма стрелки
         .attr('transform', `translate(0, ${selectedY + y.bandwidth()/2})`)
         .attr('fill', '#3b82f6');
     }
   }
 };

 // Рендер карточек моделей
 const renderModelCards = () => {
   // Фильтруем модели с данными по контрактам
   const filteredModels = apiData.filter(model => {
     if (selectedRegion === 'all') {
       return model.filter_by_region.some(r => safeParseInt(r.contract_count) > 0);
     } else {
       const regionData = model.filter_by_region.find(r => r.region_id === selectedRegion);
       return regionData && safeParseInt(regionData.contract_count) > 0;
     }
   });
   
   if (filteredModels.length === 0) {
     return (
       <div className="bg-slate-800/50 p-6 rounded-xl text-center">
         <p className="text-slate-400">Нет данных по рассрочке для выбранного фильтра</p>
       </div>
     );
   }
   
   return (
     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
       {filteredModels.map(model => {
         const modelData = getModelRegionData(model, selectedRegion);
         if (!modelData || modelData.contract_count === 0) return null;
         
         // Рассчитываем процентные показатели
         const paidPercentage = modelData.total_price > 0 
           ? Math.round(((modelData.total_paid + modelData.total_prepayment) / modelData.total_price) * 100)
           : 0;
           
  // Правильная формула для процента просрочки
const overduePercentage = modelData.total_price > 0 
  ? Math.round((modelData.total_overdue / modelData.total_price) * 100 * 100) / 100 // Округляем до 2 десятичных знаков
  : 0;

         
         // Максимальное количество контрактов для относительной шкалы
         const maxContracts = Math.max(...filteredModels
           .map(m => {
             const data = getModelRegionData(m, selectedRegion);
             return data ? data.contract_count : 0;
           }));
         
         return (
           <div 
             key={model.model_id}
             className={`bg-slate-800 rounded-xl overflow-hidden shadow-lg transition-all cursor-pointer border ${
               selectedModel?.model_id === model.model_id ? 'border-blue-500 scale-[1.02]' : 'border-slate-700 hover:scale-[1.01]'
             }`}
             onClick={() => handleModelSelect(model)}
           >
             <div className="h-44 overflow-hidden bg-slate-700/50 flex items-center justify-center">
               <img 
                 src={`https://uzavtosalon.uz/b/core/m$load_image?sha=${model.photo_sha}&width=400&height=400`}
                 alt={model.model_name} 
                 className="w-full h-44 object-contain p-2" 
                 onError={(e) => {
                   e.target.onerror = null;
                   e.target.src = '/img/car-placeholder.png'; // Путь к запасному изображению
                 }}
               />
             </div>
             <div className="p-4">
               <h4 className="text-lg font-bold text-white">{model.model_name}</h4>
               <p className="text-slate-400 text-sm mb-2">
                 {getCategoryByName(model.model_name)}
               </p>
               
               <div className="mt-3">
                 <div className="flex justify-between text-sm mb-1">
                   <span className="text-slate-400">Рассрочка:</span>
                   <span className="text-white font-medium">{formatNumberWithFullAmount(modelData.contract_count)}</span>
                 </div>
                 <div className="w-full bg-slate-700 rounded-full h-1.5 mb-3">
                   <div 
                     className="bg-blue-600 h-1.5 rounded-full" 
                     style={{ width: `${(modelData.contract_count / maxContracts) * 100}%` }}
                   ></div>
                 </div>
                 
                 <div className="flex justify-between text-sm mb-1">
                   <span className="text-slate-400">Оплачено:</span>
                   <span className="text-green-400 font-medium">{paidPercentage}%</span>
                 </div>
                 <div className="w-full bg-slate-700 rounded-full h-1.5 mb-3">
                   <div 
                     className="bg-green-500 h-1.5 rounded-full" 
                     style={{ width: `${paidPercentage}%` }}
                   ></div>
                 </div>
                 
                 <div className="flex justify-between text-sm mb-1">
                   <span className="text-slate-400">Просрочено:</span>
                   <span className="text-red-400 font-medium">{overduePercentage}%</span>
                 </div>
                 <div className="w-full bg-slate-700 rounded-full h-1.5">
                   <div 
                     className="bg-red-500 h-1.5 rounded-full" 
                     style={{ width: `${overduePercentage}%` }}
                   ></div>
                 </div>
               </div>
             </div>
           </div>
         );
       })}
     </div>
   );
 };

 // Рендер компонента модели
 const renderModelDetail = () => {
   if (!selectedModel) return null;
   
   const modelData = getModelRegionData(selectedModel, selectedRegion);
   if (!modelData) return null;
   
   const paidPercentage = modelData.total_price > 0 
     ? Math.round(((modelData.total_paid + modelData.total_prepayment) / modelData.total_price) * 100)
     : 0;
     
const overduePercentage = modelData.total_price > 0 
  ? Math.round((modelData.total_overdue / modelData.total_price) * 100 * 100) / 100
  : 0;
   
   const remainingAmount = modelData.total_price - modelData.total_paid - modelData.total_prepayment;
   
   return (
     <div className="bg-slate-800 rounded-xl p-5 shadow-lg border border-blue-800/30 mb-6">
       <div className="flex flex-col md:flex-row gap-6">
         {/* Изображение автомобиля */}
         <div className="md:w-1/3 bg-slate-700/50 rounded-xl p-4 flex items-center justify-center">
           <img 
             src={`https://uzavtosalon.uz/b/core/m$load_image?sha=${selectedModel.photo_sha}&width=400&height=400`}
             alt={selectedModel.model_name} 
             className="max-h-60 object-contain" 
             onError={(e) => {
               e.target.onerror = null;
               e.target.src = '/img/car-placeholder.png'; // Путь к запасному изображению
             }}
           />
         </div>
         
         {/* Информация о модели в выбранном регионе */}
         <div className="md:w-2/3">
           <div className="flex justify-between items-start">
             <div>
               <h2 className="text-2xl font-bold text-white mb-1">{selectedModel.model_name}</h2>
               <p className="text-slate-400 mb-1">
                 {getCategoryByName(selectedModel.model_name)}
               </p>
               <p className="text-blue-400 text-sm">
                 Данные по региону: {selectedRegion === 'all' ? 'Все регионы' : 
                   getRegions().find(r => r.id === selectedRegion)?.name || 'Неизвестный регион'}
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
               <div className="text-white text-xl font-bold">{formatNumber(modelData.contract_count)}</div>
             </div>
             
             <div className="bg-slate-700/50 p-3 rounded-lg">
               <div className="text-slate-400 text-sm">Оплачено</div>
               <div className="text-green-400 text-xl font-bold">{paidPercentage}%</div>
             </div>
             
             <div className="bg-slate-700/50 p-3 rounded-lg">
               <div className="text-slate-400 text-sm">Просрочено</div>
               <div className="text-red-400 text-xl font-bold">{overduePercentage}%</div>
             </div>
             
             <div className="bg-slate-700/50 p-3 rounded-lg">
               <div className="text-slate-400 text-sm">Остаток</div>
               <div className="text-white text-xl font-bold">{formatNumber(remainingAmount)}</div>
             </div>
             
             <div className="bg-slate-700/50 p-3 rounded-lg">
               <div className="text-slate-400 text-sm">Оплачено</div>
               <div className="text-white text-xl font-bold">{formatNumber(modelData.total_paid + modelData.total_prepayment)}</div>
             </div>
             
             <div className="bg-slate-700/50 p-3 rounded-lg">
               <div className="text-slate-400 text-sm">Полная стоимость</div>
               <div className="text-white text-xl font-bold">{formatNumber(modelData.total_price)}</div>
             </div>
           </div>
           
           {/* Полоса прогресса оплаты */}
           <div className="mb-6">
             <div className="flex justify-between text-sm mb-2">
               <span className="text-slate-400">Прогресс оплаты:</span>
               <span className="text-white">{paidPercentage}%</span>
             </div>
             <div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-gradient-to-r from-blue-600 to-green-500" 
                 style={{ width: `${paidPercentage}%` }}
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
   );
 };

 // Рендер сравнения модели по регионам
 const renderModelCompareTable = () => {
   if (!selectedModel || !modelCompareMode) return null;
   
   const regions = getRegions();
   
   return (
     <div className="bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-700 mb-6">
       <h3 className="text-lg font-bold text-white mb-4">{selectedModel.model_name} - Сравнение по регионам</h3>
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
               const modelInRegion = getModelRegionData(selectedModel, region.id);
               
               // Пропускаем регионы без данных
               if (!modelInRegion || modelInRegion.contract_count === 0) return null;
               
               const paidPercentage = modelInRegion.total_price > 0 
                 ? Math.round(((modelInRegion.total_paid + modelInRegion.total_prepayment) / modelInRegion.total_price) * 100)
                 : 0;
                 
            const overduePercentage = modelInRegion.total_price > 0 
  ? Math.round((modelInRegion.total_overdue / modelInRegion.total_price) * 100 * 100) / 100 // Округляем до 2 десятичных знаков
  : 0;
               
               const remaining = modelInRegion.total_price - modelInRegion.total_paid - modelInRegion.total_prepayment;
               
               return (
                 <tr 
                   key={region.id} 
                   className={`border-b border-slate-700 hover:bg-slate-700/30 cursor-pointer ${region.id === selectedRegion ? 'bg-blue-900/20' : ''}`}
                   onClick={() => handleRegionSelect(region.id)}
                 >
                   <td className="p-2">{region.name}</td>
                   <td className="p-2 text-right">{formatNumberWithFullAmount(modelInRegion.contract_count)}</td>
                   <td className="p-2 text-right text-green-400">{paidPercentage}%</td>
                   <td className="p-2 text-right text-red-400">{overduePercentage}%</td>
                   <td className="p-2 text-right">{formatNumber(remaining)}</td>
                 </tr>
               );
             })}
           </tbody>
         </table>
       </div>
     </div>
   );
 };

 // Основной рендер компонента
 return (
   <div className="bg-slate-900 p-4 md:p-6 text-white">
     <ContentReadyLoader isLoading={isLoading} />
     
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
           {selectedModel.model_name}
         </button>
       )}
     </div>
     
     <div className="bg-slate-800 rounded-xl p-5 shadow-lg border border-slate-700 mb-6">
       <h3 className="text-lg font-bold text-white mb-3">
         {viewMode === 'region' ? 'Выбор региона' : `${selectedModel?.model_name} в регионах`}
       </h3>
       
       <div className="mb-4">
         <button
           key="all"
           onClick={() => handleRegionSelect('all')}
           className={`mr-2 mb-2 px-4 py-2 rounded-lg transition-all ${
             selectedRegion === 'all' 
               ? 'bg-blue-600 text-white font-medium ring-2 ring-blue-500/50' 
               : 'bg-slate-700 text-white hover:bg-slate-600'
           }`}
         >
           Все регионы
         </button>

         {getRegions().map(region => (
           <button
             key={region.id}
             onClick={() => handleRegionSelect(region.id)}
             className={`mr-2 mb-2 px-4 py-2 rounded-lg transition-all ${
               selectedRegion === region.id 
                 ? 'bg-blue-600 text-white font-medium ring-2 ring-blue-500/50' 
                 : 'bg-slate-700 text-white hover:bg-slate-600'
             }`}
           >
             {region.name}
           </button>
         ))}
       </div>
     </div>
     
     {/* Информационные карточки региона */}
     {viewMode === 'region' && <RegionInfoCards />}
     
     {/* Детальная информация о выбранной модели */}
     {selectedModel && viewMode === 'model' && renderModelDetail()}
     
     {/* Сравнение модели по регионам */}
     {viewMode === 'model' && modelCompareMode && renderModelCompareTable()}
     
     {/* Отображение карточек моделей только в режиме региона */}
     {viewMode === 'region' && (
       <div className="mb-6">
         <div className="flex justify-between items-center mb-4">
           <h3 className="text-lg font-bold text-white">
             Модели автомобилей в рассрочке - {selectedRegion === 'all' ? 'Все регионы' : 
               getRegions().find(r => r.id === selectedRegion)?.name || 'Неизвестный регион'}
           </h3>
           <div className="text-sm text-slate-400">
             Нажмите на модель для подробной информации
           </div>
         </div>
         
         {renderModelCards()}
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
     </div>
   </div>
 );
};

export default InstallmentDashboard;