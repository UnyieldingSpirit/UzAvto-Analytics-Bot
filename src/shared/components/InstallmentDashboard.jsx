// InstallmentDashboard.jsx
'use client';
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import ContentReadyLoader from '../../shared/layout/ContentReadyLoader';
import { useTranslation } from '../../hooks/useTranslation';
import { installmentDashboardTranslations } from '../../shared/components/locales/InstallmentDashboard';
import { useThemeStore } from '../../store/theme';
import { useAuth } from '../../hooks/useAuth';
import { axiosInstance } from '../../utils/axiosConfig';

const InstallmentDashboard = () => {
  // Получаем текущую тему
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';
  
  // Refs для графиков
  const mainChartRef = useRef(null);
  const modelChartRef = useRef(null);
  const paymentStatusRef = useRef(null);
  const monthlyTrendsRef = useRef(null);
  const regionChartRef = useRef(null);
  const overdueHistoryRef = useRef(null); // Новый ref для графика истории просрочек
  const { checkAuth } = useAuth();
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);
  // Используем хук локализации
  const { t } = useTranslation(installmentDashboardTranslations);

  // API данные и состояние
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
    totalPrepayment: 0,
    overdueLastTwoMonths: 0,
    overdueLastThreeMonths: 0
  });

  // Состояние
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedModel, setSelectedModel] = useState(null);
  const [modelCompareMode, setModelCompareMode] = useState(false);
  const [viewMode, setViewMode] = useState('region'); // 'region' или 'model'
  const [activeTab, setActiveTab] = useState('contracts');
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  // Отслеживание размера окна для адаптивности
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Определяем размеры для адаптивности
  const isDesktop = windowWidth >= 1024; // lg
  const isTablet = windowWidth >= 768 && windowWidth < 1024; // md
  const isMobile = windowWidth < 768; // sm

  // Загрузка данных API
  useEffect(() => {
 const fetchData = async () => {
  setIsLoading(true);
  try {
    const token = localStorage.getItem('authToken');

    const response = await axiosInstance.post('https://uzavtoanalytics.uz/dashboard/proxy', {
      url: '/b/dashboard/infos&auto_installments'
    }, {
      headers: {
        'X-Auth': `Bearer ${token}`
      }
    });
    
    // В axios не нужно проверять response.ok и использовать response.json()
    const data = response.data;
    
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
  }, [t]);

  // Функция для безопасного преобразования строк в числа, учитывающая "0"
  const safeParseInt = (value) => {
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
    let totalOverdueLastTwoMonths = 0;
    let totalOverdueLastThreeMonths = 0;

    if (selectedModelId !== 'all') {
      const modelData = apiData.find(model => model.model_id === selectedModelId);

      if (modelData) {
        if (selectedRegion !== 'all') {
          const regionData = modelData.filter_by_region?.find(r => r.region_id === selectedRegion);

          if (regionData) {
            totalContracts = safeParseInt(regionData.contract_count);
            totalAmount = safeParseInt(regionData.total_price);
            totalPaid = safeParseInt(regionData.total_paid);
            totalPrepayment = safeParseInt(regionData.total_prepayment);
            totalOverdue = safeParseInt(regionData.total_overdue);
            totalOverdueLastTwoMonths = safeParseInt(regionData.overdue_last_2_months);
            totalOverdueLastThreeMonths = safeParseInt(regionData.overdue_last_3_months);
          }
        } else {
          if (modelData.filter_by_region && Array.isArray(modelData.filter_by_region)) {
            modelData.filter_by_region.forEach(region => {
              totalContracts += safeParseInt(region.contract_count);
              totalAmount += safeParseInt(region.total_price);
              totalPaid += safeParseInt(region.total_paid);
              totalPrepayment += safeParseInt(region.total_prepayment);
              totalOverdue += safeParseInt(region.total_overdue);
              totalOverdueLastTwoMonths += safeParseInt(region.overdue_last_2_months);
              totalOverdueLastThreeMonths += safeParseInt(region.overdue_last_3_months);
            });
          }
        }
      }
    } else if (selectedRegion !== 'all') {
      apiData.forEach(model => {
        if (model.filter_by_region && Array.isArray(model.filter_by_region)) {
          const regionData = model.filter_by_region.find(r => r.region_id === selectedRegion);
          if (regionData) {
            totalContracts += safeParseInt(regionData.contract_count);
            totalAmount += safeParseInt(regionData.total_price);
            totalPaid += safeParseInt(regionData.total_paid);
            totalPrepayment += safeParseInt(regionData.total_prepayment);
            totalOverdue += safeParseInt(regionData.total_overdue);
            totalOverdueLastTwoMonths += safeParseInt(regionData.overdue_last_2_months);
            totalOverdueLastThreeMonths += safeParseInt(regionData.overdue_last_3_months);
          }
        }
      });
    } else {
      apiData.forEach(model => {
        if (model.filter_by_region && Array.isArray(model.filter_by_region)) {
          model.filter_by_region.forEach(region => {
            totalContracts += safeParseInt(region.contract_count);
            totalAmount += safeParseInt(region.total_price);
            totalPaid += safeParseInt(region.total_paid);
            totalPrepayment += safeParseInt(region.total_prepayment);
            totalOverdue += safeParseInt(region.total_overdue);
            totalOverdueLastTwoMonths += safeParseInt(region.overdue_last_2_months);
            totalOverdueLastThreeMonths += safeParseInt(region.overdue_last_3_months);
          });
        }
      });
    }

    const paidTotal = totalPaid + totalPrepayment;
    const remaining = Math.max(0, totalAmount - paidTotal - totalOverdue);
    const paidPercentage = totalAmount > 0 ? Math.round((paidTotal / totalAmount) * 100) : 0;
    const overduePercentage = totalAmount > 0 ? Math.round((totalOverdue / totalAmount) * 100) : 0;

    const average = totalContracts > 0 ? Math.round(totalAmount / totalContracts) : 0;

    return {
      count: totalContracts,
      amount: totalAmount,
      average: average,
      paid: paidTotal,
      overdue: totalOverdue,
      remaining: remaining,
      paidPercentage: paidPercentage,
      overduePercentage: overduePercentage,
      totalPaid: totalPaid,
      totalPrepayment: totalPrepayment,
      overdueLastTwoMonths: totalOverdueLastTwoMonths,
      overdueLastThreeMonths: totalOverdueLastThreeMonths
    };
  };

  // Обновление статистики
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
      renderOverdueHistory();
    }
  }, [statsData, selectedRegion, selectedModel, viewMode, modelCompareMode, isLoading, apiData, windowWidth, isDark]);

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
      return `${(num / 1000000000000).toFixed(1)} ${t('units.trillion')} ${t('units.currency')}`;
    } else if (num >= 1000000000) {
      return `${(num / 1000000000).toFixed(1)} ${t('units.billion')} ${t('units.currency')}`;
    } else if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)} ${t('units.million')} ${t('units.currency')}`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)} ${t('units.thousand')} ${t('units.currency')}`;
    } else {
      return `${new Intl.NumberFormat('ru-RU').format(num)} ${t('units.currency')}`;
    }
  };
  
  const formatNumberText = (num) => {
    return `${num} ${t('units.pieces')}`;
  };

  const formatNumberWithFullAmount = (num) => {
    const fullFormatted = new Intl.NumberFormat('ru-RU').format(num);
    return `${fullFormatted} ${t('units.currency')}`;
  };

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
      return t('modelDetails.categories.suv');
    } else if (lowerName.includes('malibu') || lowerName.includes('onix') || 
               lowerName.includes('lacetti') || lowerName.includes('cobalt') || 
               lowerName.includes('nexia')) {
      return t('modelDetails.categories.sedan');
    } else {
      return t('modelDetails.categories.minivan');
    }
  };

  // Получение данных по модели и региону
  const getModelRegionData = (model, regionId) => {
    if (!model || !model.filter_by_region) return null;
    
    if (regionId === 'all') {
      return model.filter_by_region.reduce((acc, region) => {
        return {
          contract_count: acc.contract_count + safeParseInt(region.contract_count),
          total_price: acc.total_price + safeParseInt(region.total_price),
          total_paid: acc.total_paid + safeParseInt(region.total_paid),
          total_prepayment: acc.total_prepayment + safeParseInt(region.total_prepayment),
          total_overdue: acc.total_overdue + safeParseInt(region.total_overdue),
          overdue_last_2_months: acc.overdue_last_2_months + safeParseInt(region.overdue_last_2_months),
          overdue_last_3_months: acc.overdue_last_3_months + safeParseInt(region.overdue_last_3_months)
        };
      }, { 
        contract_count: 0, 
        total_price: 0, 
        total_paid: 0, 
        total_prepayment: 0, 
        total_overdue: 0,
        overdue_last_2_months: 0,
        overdue_last_3_months: 0
      });
    } else {
      const regionData = model.filter_by_region.find(r => r.region_id === regionId);
      if (!regionData) return null;
      
      return {
        contract_count: safeParseInt(regionData.contract_count),
        total_price: safeParseInt(regionData.total_price),
        total_paid: safeParseInt(regionData.total_paid),
        total_prepayment: safeParseInt(regionData.total_prepayment),
        total_overdue: safeParseInt(regionData.total_overdue),
        overdue_last_2_months: safeParseInt(regionData.overdue_last_2_months),
        overdue_last_3_months: safeParseInt(regionData.overdue_last_3_months)
      };
    }
  };

  // Получение данных по региону для всех моделей
  const getRegionData = (regionId) => {
    if (!apiData || apiData.length === 0) return null;
    
    if (regionId === 'all') {
      return apiData.reduce((acc, model) => {
        if (model.filter_by_region && Array.isArray(model.filter_by_region)) {
          model.filter_by_region.forEach(region => {
            acc.contract_count += safeParseInt(region.contract_count);
            acc.total_price += safeParseInt(region.total_price);
            acc.total_paid += safeParseInt(region.total_paid);
            acc.total_prepayment += safeParseInt(region.total_prepayment);
            acc.total_overdue += safeParseInt(region.total_overdue);
            acc.overdue_last_2_months += safeParseInt(region.overdue_last_2_months);
            acc.overdue_last_3_months += safeParseInt(region.overdue_last_3_months);
          });
        }
        return acc;
      }, { 
        contract_count: 0, 
        total_price: 0, 
        total_paid: 0, 
        total_prepayment: 0, 
        total_overdue: 0,
        overdue_last_2_months: 0,
        overdue_last_3_months: 0
      });
    }
    
    return apiData.reduce((acc, model) => {
      if (model.filter_by_region && Array.isArray(model.filter_by_region)) {
        const regionData = model.filter_by_region.find(r => r.region_id === regionId);
        if (regionData) {
          acc.contract_count += safeParseInt(regionData.contract_count);
          acc.total_price += safeParseInt(regionData.total_price);
          acc.total_paid += safeParseInt(regionData.total_paid);
          acc.total_prepayment += safeParseInt(regionData.total_prepayment);
          acc.total_overdue += safeParseInt(regionData.total_overdue);
          acc.overdue_last_2_months += safeParseInt(regionData.overdue_last_2_months);
          acc.overdue_last_3_months += safeParseInt(regionData.overdue_last_3_months);
        }
      }
      return acc;
    }, { 
      contract_count: 0, 
      total_price: 0, 
      total_paid: 0, 
      total_prepayment: 0, 
      total_overdue: 0,
      overdue_last_2_months: 0,
      overdue_last_3_months: 0
    });
  };

  // Генерация месячных данных на основе общих сумм
  const generateMonthlyData = (totalPaid, totalOverdue, monthCount = 9) => {
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен'];
    const monthsToShow = months.slice(0, monthCount);
    
    const basePayment = totalPaid / monthCount;
    let cumulativePaid = 0;
    
    return monthsToShow.map((month, index) => {
      const variation = Math.random() * 0.3 + 0.85;
      const monthlyPaid = basePayment * variation;
      cumulativePaid += monthlyPaid;
      
      const overdueFactor = (index / monthCount) * 1.5;
      const monthlyOverdue = (totalOverdue / monthCount) * overdueFactor;
      
      return {
        month,
        paid: cumulativePaid,
        unpaid: monthlyOverdue
      };
    });
  };

  // Новая функция для рендеринга графика истории просрочек
  const renderOverdueHistory = () => {
    if (!overdueHistoryRef.current || !statsData) return;
    
    const container = overdueHistoryRef.current;
    const width = container.clientWidth;
    const height = 280;
    
    d3.select(container).selectAll("*").remove();
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);
    
    // Заголовок
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('fill', isDark ? '#ffffff' : '#1f2937')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text('История просрочек по периодам');
    
    // Проверяем наличие данных
    if (statsData.overdueLastTwoMonths === 0 && statsData.overdueLastThreeMonths === 0 && statsData.overdue === 0) {
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', isDark ? '#94a3b8' : '#6b7280')
        .attr('font-size', '14px')
        .text('Нет данных о просрочках');
      return;
    }
    
    // Подготовка данных
    const data = [
      { 
        period: 'Последние 2 месяца', 
        amount: statsData.overdueLastTwoMonths,
        color: '#fbbf24',
        gradientStart: '#f59e0b',
        gradientEnd: '#fbbf24'
      },
      { 
        period: 'Последние 3 месяца', 
        amount: statsData.overdueLastThreeMonths,
        color: '#fb923c',
        gradientStart: '#ea580c',
        gradientEnd: '#fb923c'
      },
      { 
        period: 'Всего просрочено', 
        amount: statsData.overdue,
        color: '#ef4444',
        gradientStart: '#dc2626',
        gradientEnd: '#ef4444'
      }
    ];
    
    // Настройки графика
    const margin = { top: 50, right: 40, bottom: 80, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    // Создаем градиенты
    const defs = svg.append('defs');
    
    data.forEach((d, i) => {
      const gradient = defs.append('linearGradient')
        .attr('id', `overdueGradient${i}`)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');
        
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', d.gradientStart);
        
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', d.gradientEnd);
    });
    
    // Шкалы
    const x = d3.scaleBand()
      .domain(data.map(d => d.period))
      .range([0, innerWidth])
      .padding(0.3);
      
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.amount) * 1.1])
      .nice()
      .range([innerHeight, 0]);
    
    // Оси
    g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('fill', isDark ? '#94a3b8' : '#6b7280')
      .style('text-anchor', 'middle')
      .attr('dy', '1em');
    
    g.append('g')
      .call(d3.axisLeft(y).tickFormat(d => formatNumber(d)))
      .selectAll('text')
      .attr('fill', isDark ? '#94a3b8' : '#6b7280');
    
    // Линии сетки
    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y)
        .tickSize(-innerWidth)
        .tickFormat('')
      )
      .selectAll('line')
      .attr('stroke', isDark ? '#334155' : '#e5e7eb')
      .attr('stroke-dasharray', '2,2')
      .attr('opacity', 0.5);
    
    // Столбцы
    const bars = g.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.period))
      .attr('width', x.bandwidth())
      .attr('y', innerHeight)
      .attr('height', 0)
      .attr('fill', (d, i) => `url(#overdueGradient${i})`)
      .attr('rx', 6)
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))');
    
    // Анимация столбцов
    bars.transition()
      .duration(800)
      .delay((d, i) => i * 200)
      .attr('y', d => y(d.amount))
      .attr('height', d => innerHeight - y(d.amount));
    
    // Значения над столбцами
    g.selectAll('.value')
      .data(data)
      .enter().append('text')
      .attr('class', 'value')
      .attr('x', d => x(d.period) + x.bandwidth() / 2)
      .attr('y', d => y(d.amount) - 10)
      .attr('text-anchor', 'middle')
      .attr('fill', isDark ? '#ffffff' : '#1f2937')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('opacity', 0)
      .text(d => formatNumber(d.amount))
      .transition()
      .duration(800)
      .delay((d, i) => i * 200 + 400)
      .attr('opacity', 1);
    
    // Процентное соотношение
    const total = statsData.overdue;
    if (total > 0) {
      g.selectAll('.percentage')
        .data(data.slice(0, 2)) // Только для 2 и 3 месяцев
        .enter().append('text')
        .attr('class', 'percentage')
        .attr('x', d => x(d.period) + x.bandwidth() / 2)
        .attr('y', d => y(d.amount) + 20)
        .attr('text-anchor', 'middle')
        .attr('fill', isDark ? '#94a3b8' : '#6b7280')
        .attr('font-size', '12px')
        .attr('opacity', 0)
        .text(d => `${Math.round((d.amount / total) * 100)}% от общей`)
        .transition()
        .duration(800)
        .delay((d, i) => i * 200 + 600)
        .attr('opacity', 1);
    }
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
    
    // Функция для точного расчета процента
    const calculateExactPercentage = (part, total) => {
      if (!total || total === 0) return 0;
      return Math.round((part / total) * 100 * 100) / 100;
    };
    
    // Форматирование числа
    const formatNumberClear = (num) => {
      if (Math.abs(num) < 0.01) return '0';
      
      if (num >= 1000000000) {
        return `${(num / 1000000000).toFixed(1)} ${t('units.billion')}`;
      } else if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)} ${t('units.million')}`;
      } else if (num >= 1000) {
        return `${(num / 1000).toFixed(1)} ${t('units.thousand')}`;
      } else {
        return num.toLocaleString('ru-RU');
      }
    };
    
    // Определяем, какие данные используем
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
    
    // Расчет компонентов для диаграммы
    const paidTotal = totalPaid + totalPrepayment;
    const remaining = Math.max(0, totalPrice - paidTotal - totalOverdue);
    
    // Рассчитываем проценты
    const paidPercent = calculateExactPercentage(paidTotal, totalPrice);
    const overduePercent = calculateExactPercentage(totalOverdue, totalPrice);
    const remainingPercent = calculateExactPercentage(remaining, totalPrice);
    
    // Данные для графика
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
    
    // Проверяем наличие данных
    const hasData = totalPrice > 0 && (paidTotal > 0 || totalOverdue > 0 || remaining > 0);
    
    if (!hasData) {
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', isDark ? '#94a3b8' : '#6b7280')
        .attr('font-size', '14px')
        .text(t('noData'));
      return;
    }
      
    // Настраиваем размеры в зависимости от ширины
    const isSmallContainer = width < 800;
    
    // Параметры диаграммы
    const startX = 50;
    const endX = width - 50;
    const boxHeight = isSmallContainer ? 70 : 80;
    const boxWidth = isSmallContainer ? 100 : 120;  
    const arrowWidth = (endX - startX - 2 * boxWidth) / 3;
    
    // Полная стоимость
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
      .attr('font-size', isSmallContainer ? '12px' : '14px')
      .text(t('metrics.fullPrice'));
    
    fullPriceBox.append('text')
      .attr('x', boxWidth/2)
      .attr('y', 50)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', isSmallContainer ? '16px' : '18px')
      .attr('font-weight', 'bold')
      .text(`${formatNumberClear(data.carPrice)}`);
    
    // Остаток
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
      .attr('font-size', isSmallContainer ? '12px' : '14px')
      .text(t('metrics.remainder'));
    
    currentStatusBox.append('text')
      .attr('x', boxWidth/2)
      .attr('y', 50)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', isSmallContainer ? '16px' : '18px')
      .attr('font-weight', 'bold')
      .text(`${formatNumberClear(data.remainingAmount)}`);

    // Центральная область
    const middleX = startX + boxWidth + arrowWidth/2;
    const middleWidth = width - 2*(startX + boxWidth) - arrowWidth;
    const barHeight = isSmallContainer ? 35 : 40;
    
    // Фон
    svg.append('rect')
      .attr('x', middleX)
      .attr('y', height/2 - barHeight/2)
      .attr('width', middleWidth)
      .attr('height', barHeight)
      .attr('fill', isDark ? '#334155' : '#e5e7eb')
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
    
    // Стрелки
    svg.append('line')
      .attr('x1', startX + boxWidth)
      .attr('y1', height/2)
      .attr('x2', middleX)
      .attr('y2', height/2)
      .attr('stroke', isDark ? '#64748b' : '#94a3b8')
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrow)');
    
    svg.append('line')
      .attr('x1', middleX + middleWidth)
      .attr('y1', height/2)
      .attr('x2', endX - boxWidth)
      .attr('y2', height/2)
      .attr('stroke', isDark ? '#64748b' : '#94a3b8')
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
      .attr('fill', isDark ? '#64748b' : '#94a3b8');
    
    // Подписи для шкалы прогресса
    if (data.paidPercent > 10) {
      svg.append('text')
        .attr('x', middleX + (middleWidth * data.paidPercent / 100) / 2)
        .attr('y', height/2 + 5)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .attr('font-size', isSmallContainer ? '10px' : '12px')
        .attr('font-weight', 'bold')
        .text(`${data.paidPercent}%`);
    }
    
    if (data.overduePercent > 5) {
      svg.append('text')
        .attr('x', middleX + middleWidth * data.paidPercent / 100 + (middleWidth * data.overduePercent / 100) / 2)
        .attr('y', height/2 + 5)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .attr('font-size', isSmallContainer ? '10px' : '12px')
        .attr('font-weight', 'bold')
        .text(`${data.overduePercent}%`);
    }
    
    // Метки ниже полосы прогресса
    const multilineMode = width < 700;
    const labelYPos = height/2 + barHeight/2 + 20;
    const labelFontSize = isSmallContainer ? '10px' : '12px';
    
    if (multilineMode) {
      const line1Y = labelYPos;
      const line2Y = labelYPos + 18;
      const line3Y = labelYPos + 36;
      
      svg.append('text')
        .attr('x', middleX)
        .attr('y', line1Y)
        .attr('text-anchor', 'start')
        .attr('fill', '#16a34a')
        .attr('font-size', labelFontSize)
        .text(`${t('metrics.paid')}: ${formatNumberClear(paidTotal)} ${t('units.currency')} (${data.paidPercent}%)`);
      
      svg.append('text')
        .attr('x', middleX)
        .attr('y', line2Y)
        .attr('text-anchor', 'start')
        .attr('fill', '#dc2626')
        .attr('font-size', labelFontSize)
        .text(`${t('metrics.overduePay')}: ${formatNumberClear(totalOverdue)} ${t('units.currency')} (${data.overduePercent}%)`);
      
      svg.append('text')
        .attr('x', middleX)
        .attr('y', line3Y)
        .attr('text-anchor', 'start')
        .attr('fill', isDark ? '#94a3b8' : '#6b7280')
        .attr('font-size', labelFontSize)
        .text(`${t('metrics.remaining')}: ${formatNumberClear(remaining)} ${t('units.currency')} (${data.remainingPercent}%)`);
    } else {
      svg.append('g')
        .attr('transform', `translate(${middleX}, ${labelYPos})`)
        .append('text')
        .attr('x', 0)
        .attr('y', 0)
        .attr('text-anchor', 'start')
        .attr('fill', '#16a34a')
        .attr('font-size', labelFontSize)
        .text(`${t('metrics.paid')}: ${formatNumberClear(paidTotal)} ${t('units.currency')}`);
      
      svg.append('g')
        .attr('transform', `translate(${middleX + middleWidth/2}, ${labelYPos})`)
        .append('text')
        .attr('x', 0)
        .attr('y', 0)
        .attr('text-anchor', 'middle')
        .attr('fill', '#dc2626')
        .attr('font-size', labelFontSize)
        .text(`${t('metrics.overduePay')}: ${formatNumberClear(totalOverdue)} ${t('units.currency')}`);
      
      svg.append('g')
        .attr('transform', `translate(${middleX + middleWidth}, ${labelYPos})`)
        .append('text')
        .attr('x', 0)
        .attr('y', 0)
        .attr('text-anchor', 'end')
        .attr('fill', isDark ? '#94a3b8' : '#6b7280')
        .attr('font-size', labelFontSize)
        .text(`${t('metrics.remaining')}: ${formatNumberClear(remaining)} ${t('units.currency')}`);
      
      // Проценты под суммами
      const percentYPos = labelYPos + 15;
      const percentFontSize = isSmallContainer ? '9px' : '10px';
      
      svg.append('g')
        .attr('transform', `translate(${middleX}, ${percentYPos})`)
        .append('text')
        .attr('x', 0)
        .attr('y', 0)
        .attr('text-anchor', 'start')
        .attr('fill', isDark ? '#94a3b8' : '#6b7280')
        .attr('font-size', percentFontSize)
        .text(`${data.paidPercent}%`);
      
      svg.append('g')
        .attr('transform', `translate(${middleX + middleWidth/2}, ${percentYPos})`)
        .append('text')
        .attr('x', 0)
        .attr('y', 0)
        .attr('text-anchor', 'middle')
        .attr('fill', isDark ? '#94a3b8' : '#6b7280')
        .attr('font-size', percentFontSize)
        .text(`${data.overduePercent}%`);
      
      svg.append('g')
        .attr('transform', `translate(${middleX + middleWidth}, ${percentYPos})`)
        .append('text')
        .attr('x', 0)
        .attr('y', 0)
        .attr('text-anchor', 'end')
        .attr('fill', isDark ? '#94a3b8' : '#6b7280')
        .attr('font-size', percentFontSize)
        .text(`${data.remainingPercent}%`);
    }
    
    // Подпись выбранного региона и модели
    const regionName = selectedRegion === 'all' ? t('views.allRegions') : 
      getRegions().find(r => r.id === selectedRegion)?.name || t('views.unknownRegion');
    
    let modelName = '';
    if (selectedModel) {
      const maxLength = width < 500 ? 15 : 30;
      modelName = selectedModel.model_name;
      if (modelName.length > maxLength) {
        modelName = modelName.substring(0, maxLength) + '...';
      }
      modelName = ` - ${t('views.model')}: ${modelName}`;
    }
      
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height - 15)
      .attr('text-anchor', 'middle')
      .attr('fill', isDark ? '#94a3b8' : '#6b7280')
      .attr('font-size', isSmallContainer ? '10px' : '12px')
      .text(`${t('views.region')}: ${regionName}${modelName}`);
  };

  const renderModelChart = () => {
    if (!modelChartRef.current || apiData.length === 0) return;
    
    const container = modelChartRef.current;
    const width = container.clientWidth;
    const height = 300;
    
    d3.select(container).selectAll("*").remove();
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);
    
    const isNarrow = width < 400;
    
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
      .attr('x', isNarrow ? width / 2 : 15)
      .attr('y', 20)
      .attr('text-anchor', isNarrow ? 'middle' : 'start')
      .attr('fill', isDark ? '#ffffff' : '#1f2937')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text(t('charts.topModels'));
    
    const margin = { top: 35, right: 25, bottom: 10, left: isNarrow ? 80 : 120 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    // Создаем градиенты
    const defs = svg.append('defs');
    
    // Фильтр для теней
    const dropShadow = defs.append('filter')
      .attr('id', 'bar-shadow')
      .attr('height', '130%');
      
    dropShadow.append('feGaussianBlur')
      .attr('in', 'SourceAlpha')
      .attr('stdDeviation', 3)
      .attr('result', 'blur');
      
    dropShadow.append('feOffset')
      .attr('in', 'blur')
      .attr('dx', 1)
      .attr('dy', 1)
      .attr('result', 'offsetBlur');
      
    const feComponentTransfer = dropShadow.append('feComponentTransfer')
      .attr('in', 'offsetBlur')
      .attr('result', 'offsetBlur');
      
    feComponentTransfer.append('feFuncA')
      .attr('type', 'linear')
      .attr('slope', 0.2);
      
    const feMerge = dropShadow.append('feMerge');
    feMerge.append('feMergeNode')
      .attr('in', 'offsetBlur');
    feMerge.append('feMergeNode')
      .attr('in', 'SourceGraphic');
    
    // Набор градиентов для баров
    const colors = [
      ['#3b82f6', '#60a5fa'], // Синий
      ['#8b5cf6', '#a78bfa'], // Фиолетовый
      ['#ec4899', '#f472b6'], // Розовый
      ['#f59e0b', '#fbbf24'], // Оранжевый
      ['#10b981', '#34d399']  // Зеленый
    ];
    
    colors.forEach((color, i) => {
      const gradient = defs.append('linearGradient')
        .attr('id', `barGradient${i}`)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '0%');
        
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', color[0]);
        
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', color[1]);
    });
    
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
    
    // Фон для графика
    chart.append('rect')
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .attr('fill', isDark ? '#1e293b' : '#f3f4f6')
      .attr('rx', 8)
      .attr('opacity', 0.2)
      .attr('filter', 'url(#bar-shadow)');
    
    // Линии сетки
    chart.selectAll('.grid-line')
      .data(y.domain())
      .join('line')
      .attr('class', 'grid-line')
      .attr('x1', 0)
      .attr('x2', chartWidth)
      .attr('y1', d => y(d) + y.bandwidth() / 2)
      .attr('y2', d => y(d) + y.bandwidth() / 2)
      .attr('stroke', isDark ? '#334155' : '#e5e7eb')
      .attr('stroke-width', 0.5)
      .attr('stroke-dasharray', '3,3')
      .attr('opacity', 0.6);
    
    // Фон для баров
    chart.selectAll('.bar-bg')
      .data(models)
      .join('rect')
      .attr('class', 'bar-bg')
      .attr('y', m => y(m.model_id))
      .attr('height', y.bandwidth())
      .attr('x', 0)
      .attr('width', chartWidth)
      .attr('fill', isDark ? '#1e293b' : '#f3f4f6')
      .attr('rx', 6)
      .attr('opacity', 0.3);
    
    // Бары с градиентами и анимацией
    chart.selectAll('.bar')
      .data(models)
      .join('rect')
      .attr('class', 'bar')
      .attr('y', m => y(m.model_id))
      .attr('height', y.bandwidth())
      .attr('x', 0)
      .attr('width', 0)
      .attr('fill', (m, i) => `url(#barGradient${i % colors.length})`)
      .attr('rx', 6)
      .attr('filter', 'url(#bar-shadow)')
      .attr('cursor', 'pointer')
      .on('click', (event, m) => handleModelSelect(m))
      .on('mouseover', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('height', y.bandwidth() * 1.1)
          .attr('y', d => y(d.model_id) - y.bandwidth() * 0.05);
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('height', y.bandwidth())
          .attr('y', d => y(d.model_id));
      })
      .transition()
      .duration(1200)
      .delay((_, i) => i * 100)
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
      .attr('x', -10)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .attr('fill', isDark ? '#ffffff' : '#1f2937')
      .attr('font-size', isNarrow ? '11px' : '12px')
      .attr('font-weight', 'medium')
      .text(m => {
        const name = m.model_name;
        const maxLength = isNarrow ? 8 : 14;
        return name.length > maxLength ? name.substring(0, maxLength) + '...' : name;
      });
    
    // Количество контрактов (метки с анимацией)
    chart.selectAll('.count')
      .data(models)
      .join('text')
      .attr('class', 'count')
      .attr('y', m => y(m.model_id) + y.bandwidth() / 2)
      .attr('x', m => {
        const data = getModelRegionData(m, selectedRegion);
        const value = data?.contract_count || 0;
        return x(value) + 10;
      })
      .attr('dominant-baseline', 'middle')
      .attr('fill', isDark ? '#ffffff' : '#1f2937')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('opacity', 0)
      .text(m => {
        const data = getModelRegionData(m, selectedRegion);
        return formatNumberText(data?.contract_count || 0);
      })
      .transition()
      .duration(800)
      .delay((_, i) => 400 + i * 100)
      .attr('opacity', 1);
  };

  const renderPaymentStatus = () => {
    if (!paymentStatusRef.current || apiData.length === 0) return;
    
    const container = paymentStatusRef.current;
    const width = container.clientWidth;
    const height = 300;
    
    d3.select(container).selectAll("*").remove();
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);
    
    // Определяем режим отображения в зависимости от ширины
    const isNarrow = width < 500;
    const isMedium = width >= 500 && width < 700;
    
    // Данные для диаграммы
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
    
    // Расчет компонентов
    const paidTotal = totalPaid + totalPrepayment;
    const remaining = Math.max(0, totalPrice - paidTotal - totalOverdue);
    
    // Расчет процентов
    const calculateExactPercentage = (part, total) => {
      if (!total || total === 0) return 0;
      return Math.round((part / total) * 100 * 100) / 100;
    };
    
    const paidPercentage = calculateExactPercentage(paidTotal, totalPrice);
    const overduePercentage = calculateExactPercentage(totalOverdue, totalPrice);
    const remainingPercentage = calculateExactPercentage(remaining, totalPrice);
    
    // Проверка наличия данных
    const hasData = totalPrice > 0 && (paidTotal > 0 || totalOverdue > 0 || remaining > 0);
    
    if (!hasData) {
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', isDark ? '#94a3b8' : '#6b7280')
        .attr('font-size', '16px')
        .text(t('noData'));
      return;
    }
    
    // Создаем данные для диаграммы
    const pieData = [
      { label: t('metrics.paid'), value: paidTotal > 0 ? paidTotal : 0, color: '#16a34a', gradientId: 'gradientPaid', percentage: paidPercentage },
      { label: t('metrics.overduePay'), value: totalOverdue > 0 ? totalOverdue : 0, color: '#dc2626', gradientId: 'gradientOverdue', percentage: overduePercentage },
      { label: t('metrics.remaining'), value: remaining > 0 ? remaining : 0, color: isDark ? '#334155' : '#94a3b8', gradientId: 'gradientRemaining', percentage: remainingPercentage }
    ].filter(d => d.value > 0);
    
    if (pieData.length === 0) {
      pieData.push({ label: t('noData'), value: 1, color: isDark ? '#94a3b8' : '#d1d5db', gradientId: 'gradientNoData', percentage: 100 });
    }
    
    // Добавляем градиенты
    const defs = svg.append('defs');
    
    // Градиент для оплаченной части
    const gradientPaid = defs.append('linearGradient')
      .attr('id', 'gradientPaid')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%');
      
    gradientPaid.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#059669');
      
    gradientPaid.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#10b981');
    
    // Градиент для просроченной части
    const gradientOverdue = defs.append('linearGradient')
      .attr('id', 'gradientOverdue')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%');
      
    gradientOverdue.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#b91c1c');
      
    gradientOverdue.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#ef4444');
    
    // Градиент для оставшейся части
    const gradientRemaining = defs.append('linearGradient')
      .attr('id', 'gradientRemaining')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%');
      
    gradientRemaining.append('stop')
      .attr('offset', '0%')
    .attr('stop-color', isDark ? '#1e293b' : '#64748b');
     
   gradientRemaining.append('stop')
     .attr('offset', '100%')
     .attr('stop-color', isDark ? '#475569' : '#94a3b8');
   
   // Градиент для "нет данных"
   const gradientNoData = defs.append('linearGradient')
     .attr('id', 'gradientNoData')
     .attr('x1', '0%')
     .attr('y1', '0%')
     .attr('x2', '100%')
     .attr('y2', '100%');
     
   gradientNoData.append('stop')
     .attr('offset', '0%')
     .attr('stop-color', isDark ? '#64748b' : '#d1d5db');
     
   gradientNoData.append('stop')
     .attr('offset', '100%')
     .attr('stop-color', isDark ? '#94a3b8' : '#e5e7eb');
   
   // Определяем радиус и положение диаграммы
   let chartRadius, chartX, chartY, legendX, legendY;
   
   if (isNarrow) {
     chartX = width / 2;
     chartY = 80;
     chartRadius = Math.min(width * 0.25, 50);
     legendX = width * 0.1;
     legendY = chartY + chartRadius + 20;
   } else if (isMedium) {
     chartX = width * 0.28;
     chartY = height / 2;
     chartRadius = Math.min(width * 0.15, height * 0.35);
     legendX = width * 0.48;
     legendY = height / 2 - 45;
   } else {
     chartX = width * 0.25;
     chartY = height / 2;
     chartRadius = Math.min(width * 0.15, height * 0.35);
     legendX = width * 0.45;
     legendY = height / 2 - 45;
   }
   
   // Заголовок
   svg.append('text')
     .attr('x', isNarrow ? width / 2 : 20)
     .attr('y', 25)
     .attr('text-anchor', isNarrow ? 'middle' : 'start')
     .attr('fill', isDark ? '#ffffff' : '#1f2937')
     .attr('font-size', '16px')
     .attr('font-weight', 'bold')
     .text(t('charts.paymentDistribution'));
   
   // Создаем дуги для диаграммы
   const arc = d3.arc()
     .innerRadius(chartRadius * 0.55) // Внутренний радиус (пончик)
     .outerRadius(chartRadius) // Внешний радиус
     .cornerRadius(4) // Скругление концов
     .padAngle(0.02); // Отступ между сегментами
   
   const pie = d3.pie()
     .value(d => d.value)
     .sort(null);
   
   // Группа для диаграммы
   const chart = svg.append('g')
     .attr('transform', `translate(${chartX}, ${chartY})`);
   
   // Добавляем тень для диаграммы
   const filter = defs.append('filter')
     .attr('id', 'drop-shadow')
     .attr('height', '130%');
   
   filter.append('feGaussianBlur')
     .attr('in', 'SourceAlpha')
     .attr('stdDeviation', 3)
     .attr('result', 'blur');
   
   filter.append('feOffset')
     .attr('in', 'blur')
     .attr('dx', 2)
     .attr('dy', 2)
     .attr('result', 'offsetBlur');
   
   const feComponentTransfer = filter.append('feComponentTransfer')
     .attr('in', 'offsetBlur')
     .attr('result', 'offsetBlur');
   
   feComponentTransfer.append('feFuncA')
     .attr('type', 'linear')
     .attr('slope', 0.3);
   
   const feMerge = filter.append('feMerge');
   feMerge.append('feMergeNode')
     .attr('in', 'offsetBlur');
   feMerge.append('feMergeNode')
     .attr('in', 'SourceGraphic');
   
   // Фон для диаграммы
   chart.append('circle')
     .attr('r', chartRadius + 2)
     .attr('fill', isDark ? '#1e293b' : '#f3f4f6')
     .attr('opacity', 0.3)
     .attr('filter', 'url(#drop-shadow)');
   
   // Создаем дуги
   const path = chart.selectAll('path')
     .data(pie(pieData))
     .enter()
     .append('path')
     .attr('d', arc)
     .attr('fill', d => `url(#${d.data.gradientId})`)
     .attr('stroke', isDark ? '#0f172a' : '#ffffff')
     .attr('stroke-width', 1)
     .style('filter', 'url(#drop-shadow)')
     .style('opacity', 0);
   
   // Анимация появления с эффектом нарастания
   path.transition()
     .duration(1000)
     .style('opacity', 1)
     .attrTween('d', function(d) {
       const i = d3.interpolate({startAngle: d.startAngle, endAngle: d.startAngle}, d);
       return function(t) {
         return arc(i(t));
       };
     });
   
   // Форматирование больших чисел
   const formatLargeNumber = (num) => {
     if (num >= 1000000000000) {
       return `${(num / 1000000000000).toFixed(1)} ${t('units.trillion')}`;
     } else if (num >= 1000000000) {
       return `${(num / 1000000000).toFixed(1)} ${t('units.billion')}`;
     } else if (num >= 1000000) {
       return `${(num / 1000000).toFixed(1)} ${t('units.million')}`;
     } else if (num >= 1000) {
       return `${(num / 1000).toFixed(1)} ${t('units.thousand')}`;
     } else {
       return num.toLocaleString('ru-RU');
     }
   };
   
   // Добавляем центральный текст если диаграмма достаточно большая
   if (chartRadius >= 35) {
     const centerGroup = chart.append('g');
     
     // Фон для центрального текста
     centerGroup.append('circle')
       .attr('r', chartRadius * 0.5)
       .attr('fill', isDark ? '#0f172a' : '#f9fafb')
       .attr('opacity', 0.7);
       
     centerGroup.append('text')
       .attr('text-anchor', 'middle')
       .attr('y', -chartRadius * 0.15)
       .attr('fill', isDark ? '#ffffff' : '#1f2937')
       .attr('font-size', `${Math.max(10, chartRadius * 0.22)}px`)
       .text(t('metrics.total'));
       
     centerGroup.append('text')
       .attr('text-anchor', 'middle')
       .attr('y', chartRadius * 0.15)
       .attr('fill', isDark ? '#ffffff' : '#1f2937')
       .attr('font-size', `${Math.max(12, chartRadius * 0.25)}px`)
       .attr('font-weight', 'bold')
       .text(formatLargeNumber(totalPrice));
       
     centerGroup.append('text')
       .attr('text-anchor', 'middle')
       .attr('y', chartRadius * 0.35)
       .attr('fill', isDark ? '#94a3b8' : '#6b7280')
       .attr('font-size', `${Math.max(9, chartRadius * 0.18)}px`)
       .text(t('units.currency'));
   }
   
   // Создаем современную легенду
   const legend = svg.append('g')
     .attr('transform', `translate(${legendX}, ${legendY})`);
   
   // Адаптивное расстояние между элементами легенды
   const itemSpacing = isNarrow ? 30 : Math.min(45, height / (pieData.length + 1));
   
   // Не добавляем заголовок легенды в узком режиме
   if (!isNarrow) {
     legend.append('text')
       .attr('x', 0)
       .attr('y', -15)
       .attr('fill', isDark ? '#94a3b8' : '#6b7280')
       .attr('font-size', '13px')
       .text(t('charts.paymentDistribution') + ':');
   }
   
   // Добавляем элементы легенды с эффектами
   pieData.forEach((item, i) => {
     const legendItem = legend.append('g')
       .attr('transform', `translate(0, ${i * itemSpacing})`)
       .style('opacity', 0)
       .style('cursor', 'pointer');
     
     // Анимация появления элементов легенды
     legendItem.transition()
       .delay(i * 100 + 300)
       .duration(500)
       .style('opacity', 1);
     
     // Взаимодействие при наведении
     legendItem.on('mouseover', function() {
       d3.select(this).select('rect').transition()
         .duration(200)
         .attr('width', 20)
         .attr('height', 20)
         .attr('x', -2)
         .attr('y', -2);
         
       d3.select(this).select('.legend-percent').transition()
         .duration(200)
         .attr('font-size', '15px');
     })
     .on('mouseout', function() {
       d3.select(this).select('rect').transition()
         .duration(200)
         .attr('width', 16)
         .attr('height', 16)
         .attr('x', 0)
         .attr('y', 0);
         
       d3.select(this).select('.legend-percent').transition()
         .duration(200)
         .attr('font-size', '14px');
     });
     
     // Цветной индикатор с градиентом
     legendItem.append('rect')
       .attr('width', 16)
       .attr('height', 16)
       .attr('rx', 4)
       .attr('fill', `url(#${item.gradientId})`)
       .attr('stroke', isDark ? '#0f172a' : '#e5e7eb')
       .attr('stroke-width', 1);
     
     // Название и процент
     legendItem.append('text')
       .attr('class', 'legend-percent')
       .attr('x', 26)
       .attr('y', 13)
       .attr('fill', isDark ? '#ffffff' : '#1f2937')
       .attr('font-size', '14px')
       .attr('font-weight', item.label === t('metrics.paid') ? 'bold' : 'normal')
       .text(`${item.label}: ${item.percentage}%`);
     
     // Сумма
     legendItem.append('text')
       .attr('x', 26)
       .attr('y', 30)
       .attr('fill', isDark ? '#94a3b8' : '#6b7280')
       .attr('font-size', '12px')
       .text(`${formatLargeNumber(item.value)} ${t('units.currency')}`);
   });
   
   // Добавляем фон для легенды
   if (!isNarrow && pieData.length > 0) {
     const legendWidth = 180;
     const legendHeight = pieData.length * itemSpacing + 15;
     
     legend.insert('rect', ':first-child')
       .attr('x', -12)
       .attr('y', -30)
       .attr('width', legendWidth)
       .attr('height', legendHeight)
       .attr('rx', 10)
       .attr('fill', isDark ? '#1e293b' : '#f3f4f6')
       .attr('opacity', 0.3)
       .attr('filter', 'url(#drop-shadow)');
   }
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
     .attr('fill', isDark ? '#ffffff' : '#1f2937')
     .attr('font-size', '14px')
     .attr('font-weight', 'bold')
     .text(t('charts.paymentDynamics'));
   
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
     .attr('fill', isDark ? '#94a3b8' : '#6b7280');
   
   svg.append('g')
     .attr('transform', `translate(${margin.left}, 0)`)
     .call(d3.axisLeft(y).ticks(5).tickFormat(d => `$${d >= 1000 ? Math.round(d/1000) + 'k' : d}`))
     .selectAll('text')
     .attr('fill', isDark ? '#94a3b8' : '#6b7280');
   
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
     .attr('stroke', isDark ? '#0f172a' : '#ffffff')
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
     .attr('fill', isDark ? '#ffffff' : '#1f2937')
     .attr('font-size', '11px')
     .text(t('metrics.paid'));
   
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
     .attr('fill', isDark ? '#ffffff' : '#1f2937')
     .attr('font-size', '11px')
     .text(t('metrics.overduePay'));
   
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
     .attr('fill', isDark ? '#ffffff' : '#1f2937')
     .attr('font-size', '11px')
     .text(t('metrics.total'));
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
   
   // Процент просрочек за 2 и 3 месяца от общей суммы просрочек
   const overduePercent2Months = data.total_overdue > 0 
     ? Math.round((data.overdue_last_2_months / data.total_overdue) * 100) 
     : 0;
   const overduePercent3Months = data.total_overdue > 0 
     ? Math.round((data.overdue_last_3_months / data.total_overdue) * 100) 
     : 0;
   
   return (
     <div className="space-y-4 mb-6">
       {/* Первая строка карточек */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         {/* Карточка по количеству рассрочек */}
         <div className={`${isDark ? 'bg-gradient-to-br from-blue-900/40 to-blue-800/20' : 'bg-gradient-to-br from-blue-100 to-blue-50'} rounded-xl p-4 shadow-lg border ${isDark ? 'border-blue-800/30' : 'border-blue-200'}`}>
           <div className="flex items-center">
             <div className={`w-12 h-12 rounded-full ${isDark ? 'bg-blue-600/30' : 'bg-blue-500/20'} flex items-center justify-center mr-4`}>
               <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
               </svg>
             </div>
             <div>
               <h3 className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>{t('metrics.contracts')}</h3>
               <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.contract_count} {t('units.pieces')}</p>
               <p className={`${isDark ? 'text-blue-300/70' : 'text-blue-600/70'} text-xs mt-1`}>{t('metrics.activeContracts')}</p>
             </div>
           </div>
         </div>
         
         {/* Карточка по проценту оплаты */}
         <div className={`${isDark ? 'bg-gradient-to-br from-green-900/40 to-green-800/20' : 'bg-gradient-to-br from-green-100 to-green-50'} rounded-xl p-4 shadow-lg border ${isDark ? 'border-green-800/30' : 'border-green-200'}`}>
           <div className="flex items-center">
             <div className={`w-12 h-12 rounded-full ${isDark ? 'bg-green-600/30' : 'bg-green-500/20'} flex items-center justify-center mr-4`}>
               <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
             </div>
             <div>
               <h3 className={`text-sm font-medium ${isDark ? 'text-green-300' : 'text-green-700'}`}>{t('metrics.paymentStatus')}</h3>
               <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{paidPercentage}%</p>
               <p className={`${isDark ? 'text-green-300/70' : 'text-green-600/70'} text-xs mt-1`}>
                 {formatNumber(paidTotal)} {t('metrics.outOf')} {formatNumber(data.total_price)}
               </p>
               {selectedRegion !== 'all' && (
                 <p className={`${isDark ? 'text-green-300/70' : 'text-green-600/70'} text-xs`}>
                   {t('metrics.total')}: {paidPercentageAll}% ({formatNumber(totalPaidAll)})
                 </p>
               )}
             </div>
           </div>
         </div>
         
         {/* Карточка по проценту просрочки */}
         <div className={`${isDark ? 'bg-gradient-to-br from-red-900/40 to-red-800/20' : 'bg-gradient-to-br from-red-100 to-red-50'} rounded-xl p-4 shadow-lg border ${isDark ? 'border-red-800/30' : 'border-red-200'}`}>
           <div className="flex items-center">
             <div className={`w-12 h-12 rounded-full ${isDark ? 'bg-red-600/30' : 'bg-red-500/20'} flex items-center justify-center mr-4`}>
               <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
             </div>
             <div>
               <h3 className={`text-sm font-medium ${isDark ? 'text-red-300' : 'text-red-700'}`}>{t('metrics.overdue')}</h3>
               <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{overduePercentage}%</p>
               <p className={`${isDark ? 'text-red-300/70' : 'text-red-600/70'} text-xs mt-1`}>
                 {formatNumber(data.total_overdue)} {t('metrics.outOf')} {formatNumber(data.total_price)}
               </p>
               {selectedRegion !== 'all' && (
                 <p className={`${isDark ? 'text-red-300/70' : 'text-red-600/70'} text-xs`}>
                   {t('metrics.total')}: {overduePercentageAll}% ({formatNumber(totalOverdueAll)})
                 </p>
               )}
             </div>
           </div>
         </div>
       </div>
       
       {/* Вторая строка карточек - просрочки по периодам */}
       {(data.overdue_last_2_months > 0 || data.overdue_last_3_months > 0) && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {/* Карточка просрочек за 2 месяца */}
           <div className={`${isDark ? 'bg-gradient-to-br from-amber-900/40 to-amber-800/20' : 'bg-gradient-to-br from-amber-100 to-amber-50'} rounded-xl p-4 shadow-lg border ${isDark ? 'border-amber-800/30' : 'border-amber-200'}`}>
             <div className="flex items-center">
               <div className={`w-12 h-12 rounded-full ${isDark ? 'bg-amber-600/30' : 'bg-amber-500/20'} flex items-center justify-center mr-4`}>
                 <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                 </svg>
               </div>
               <div>
                 <h3 className={`text-sm font-medium ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>Просрочка более 2 месяцев</h3>
                 <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatNumber(data.overdue_last_2_months)}</p>
                 <p className={`${isDark ? 'text-amber-300/70' : 'text-amber-600/70'} text-xs mt-1`}>
                   {overduePercent2Months}% от общей просрочки
                 </p>
               </div>
             </div>
           </div>
           
           {/* Карточка просрочек за 3 месяца */}
           <div className={`${isDark ? 'bg-gradient-to-br from-orange-900/40 to-orange-800/20' : 'bg-gradient-to-br from-orange-100 to-orange-50'} rounded-xl p-4 shadow-lg border ${isDark ? 'border-orange-800/30' : 'border-orange-200'}`}>
             <div className="flex items-center">
               <div className={`w-12 h-12 rounded-full ${isDark ? 'bg-orange-600/30' : 'bg-orange-500/20'} flex items-center justify-center mr-4`}>
                 <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                 </svg>
               </div>
               <div>
                 <h3 className={`text-sm font-medium ${isDark ? 'text-orange-300' : 'text-orange-700'}`}>Просрочка более 3 месяцев</h3>
                 <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatNumber(data.overdue_last_3_months)}</p>
                 <p className={`${isDark ? 'text-orange-300/70' : 'text-orange-600/70'} text-xs mt-1`}>
                   {overduePercent3Months}% от общей просрочки
                 </p>
               </div>
             </div>
           </div>
         </div>
       )}
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
     .attr('fill', isDark ? '#ffffff' : '#1f2937')
     .attr('font-size', '14px')
     .attr('font-weight', 'bold')
     .text(t('charts.topRegions'));
   
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
     .attr('fill', d => d === selectedRegion ? '#ffffff' : (isDark ? '#94a3b8' : '#6b7280'))
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
     .attr('fill', isDark ? '#1e293b' : '#f3f4f6')
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
     .style('pointer-events', 'none')
     .text(d => formatNumberText(d.contractCount));
   
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
       <div className={`${isDark ? 'bg-slate-800/50' : 'bg-gray-100'} p-6 rounded-xl text-center`}>
         <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>{t('noData')}</p>
       </div>
     );
   }
   
   return (
     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
             className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl overflow-hidden shadow-lg transition-all cursor-pointer border ${
               selectedModel?.model_id === model.model_id ? 'border-blue-500 scale-[1.02]' : (isDark ? 'border-slate-700 hover:scale-[1.01]' : 'border-gray-200 hover:scale-[1.01]')
             }`}
             onClick={() => handleModelSelect(model)}
           >
             <div className={`h-44 overflow-hidden ${isDark ? 'bg-slate-700/50' : 'bg-gray-100'} flex items-center justify-center`}>
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
               <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{model.model_name}</h4>
               <p className={`${isDark ? 'text-slate-400' : 'text-gray-600'} text-sm mb-2`}>
                 {getCategoryByName(model.model_name)}
               </p>
               
               <div className="mt-3">
                 <div className="flex justify-between text-sm mb-1">
                   <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>{t('metrics.contracts')}:</span>
                   <span className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium`}>{modelData.contract_count} {t('units.pieces')}</span>
                 </div>
                 <div className={`w-full ${isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded-full h-1.5 mb-3`}>
                   <div 
                     className="bg-blue-600 h-1.5 rounded-full" 
                     style={{ width: `${(modelData.contract_count / maxContracts) * 100}%` }}
                   ></div>
                 </div>
                 
                 <div className="flex justify-between text-sm mb-1">
                   <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>{t('metrics.paid')}:</span>
                   <span className="text-green-400 font-medium">{paidPercentage}%</span>
                 </div>
                 <div className={`w-full ${isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded-full h-1.5 mb-3`}>
                   <div 
                     className="bg-green-500 h-1.5 rounded-full" 
                     style={{ width: `${paidPercentage}%` }}
                   ></div>
                 </div>
                 
                 <div className="flex justify-between text-sm mb-1">
                   <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>{t('metrics.overduePay')}:</span>
                   <span className="text-red-400 font-medium">{overduePercentage}%</span>
                 </div>
                 <div className={`w-full ${isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded-full h-1.5`}>
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
     <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl p-5 shadow-lg border ${isDark ? 'border-blue-800/30' : 'border-blue-200'} mb-6`}>
       <div className="flex flex-col md:flex-row gap-6">
         {/* Изображение автомобиля */}
         <div className={`md:w-1/3 ${isDark ? 'bg-slate-700/50' : 'bg-gray-100'} rounded-xl p-4 flex items-center justify-center`}>
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
               <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>{selectedModel.model_name}</h2>
               <p className={`${isDark ? 'text-slate-400' : 'text-gray-600'} mb-1`}>
                 {getCategoryByName(selectedModel.model_name)}
               </p>
               <p className="text-blue-400 text-sm">
                 {t('modelDetails.data')}: {selectedRegion === 'all' ? t('views.allRegions') : 
                   getRegions().find(r => r.id === selectedRegion)?.name || t('views.unknownRegion')}
               </p>
             </div>
             <button 
               onClick={() => {
                 setSelectedModel(null);
                 setViewMode('region');
               }}
               className={`${isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-200 hover:bg-gray-300'} p-2 rounded-lg ${isDark ? 'text-slate-300' : 'text-gray-700'}`}
               aria-label="Close"
             >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-3 gap-4 my-6">
             <div className={`${isDark ? 'bg-slate-700/50' : 'bg-gray-100'} p-3 rounded-lg`}>
               <div className={`${isDark ? 'text-slate-400' : 'text-gray-600'} text-sm`}>{t('modelDetails.totalInInstallment')}</div>
               <div className={`${isDark ? 'text-white' : 'text-gray-900'} text-xl font-bold`}>{formatNumberWithFullAmount(modelData.contract_count)}</div>
             </div>
             
             <div className={`${isDark ? 'bg-slate-700/50' : 'bg-gray-100'} p-3 rounded-lg`}>
               <div className={`${isDark ? 'text-slate-400' : 'text-gray-600'} text-sm`}>{t('metrics.paid')}</div>
               <div className="text-green-400 text-xl font-bold">{paidPercentage}%</div>
             </div>
             
             <div className={`${isDark ? 'bg-slate-700/50' : 'bg-gray-100'} p-3 rounded-lg`}>
               <div className={`${isDark ? 'text-slate-400' : 'text-gray-600'} text-sm`}>{t('metrics.overduePay')}</div>
               <div className="text-red-400 text-xl font-bold">{overduePercentage}%</div>
             </div>
             
             <div className={`${isDark ? 'bg-slate-700/50' : 'bg-gray-100'} p-3 rounded-lg`}>
               <div className={`${isDark ? 'text-slate-400' : 'text-gray-600'} text-sm`}>{t('metrics.remaining')}</div>
               <div className={`${isDark ? 'text-white' : 'text-gray-900'} text-xl font-bold`}>{formatNumber(remainingAmount)}</div>
             </div>
             
             <div className={`${isDark ? 'bg-slate-700/50' : 'bg-gray-100'} p-3 rounded-lg`}>
               <div className={`${isDark ? 'text-slate-400' : 'text-gray-600'} text-sm`}>{t('metrics.paid')}</div>
               <div className={`${isDark ? 'text-white' : 'text-gray-900'} text-xl font-bold`}>{formatNumber(modelData.total_paid + modelData.total_prepayment)}</div>
             </div>
             
             <div className={`${isDark ? 'bg-slate-700/50' : 'bg-gray-100'} p-3 rounded-lg`}>
               <div className={`${isDark ? 'text-slate-400' : 'text-gray-600'} text-sm`}>{t('modelDetails.fullPrice')}</div>
               <div className={`${isDark ? 'text-white' : 'text-gray-900'} text-xl font-bold`}>{formatNumber(modelData.total_price)}</div>
             </div>
           </div>
           
           {/* Информация о просрочках по периодам */}
           {(modelData.overdue_last_2_months > 0 || modelData.overdue_last_3_months > 0) && (
             <div className="grid grid-cols-2 gap-4 mb-6">
               <div className={`${isDark ? 'bg-amber-900/20' : 'bg-amber-50'} p-3 rounded-lg border ${isDark ? 'border-amber-800/30' : 'border-amber-200'}`}>
                 <div className="text-amber-400 text-sm">Просрочки за 2 месяца</div>
                 <div className={`${isDark ? 'text-white' : 'text-gray-900'} text-lg font-bold`}>{formatNumber(modelData.overdue_last_2_months)}</div>
                 <div className={`${isDark ? 'text-amber-400/70' : 'text-amber-600/70'} text-xs`}>
                   {modelData.total_overdue > 0 
                     ? Math.round((modelData.overdue_last_2_months / modelData.total_overdue) * 100) 
                     : 0}% от общей просрочки
                 </div>
               </div>
               
               <div className={`${isDark ? 'bg-orange-900/20' : 'bg-orange-50'} p-3 rounded-lg border ${isDark ? 'border-orange-800/30' : 'border-orange-200'}`}>
                 <div className="text-orange-400 text-sm">Просрочки за 3 месяца</div>
                 <div className={`${isDark ? 'text-white' : 'text-gray-900'} text-lg font-bold`}>{formatNumber(modelData.overdue_last_3_months)}</div>
                 <div className={`${isDark ? 'text-orange-400/70' : 'text-orange-600/70'} text-xs`}>
                   {modelData.total_overdue > 0 
                     ? Math.round((modelData.overdue_last_3_months / modelData.total_overdue) * 100) 
                     : 0}% от общей просрочки
                 </div>
               </div>
             </div>
           )}
           
           {/* Полоса прогресса оплаты */}
           <div className="mb-6">
             <div className="flex justify-between text-sm mb-2">
               <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>{t('charts.paymentsProgress')}:</span>
               <span className={isDark ? 'text-white' : 'text-gray-900'}>{paidPercentage}%</span>
             </div>
             <div className={`w-full h-4 ${isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
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
               {modelCompareMode ? t('modelDetails.hideRegionComparison') : t('modelDetails.compareByRegions')}
             </button>
             <button 
               className={`${isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-200 hover:bg-gray-300'} ${isDark ? 'text-white' : 'text-gray-900'} px-4 py-2 rounded-lg`}
               onClick={() => {
                 setSelectedModel(null);
                 setViewMode('region');
               }}
             >
               {t('modelDetails.backToList')}
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
     <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-lg border ${isDark ? 'border-slate-700' : 'border-gray-200'} mb-6 overflow-x-auto`}>
       <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>{selectedModel.model_name} - {t('modelDetails.compareByRegions')}</h3>
       <div className="overflow-x-auto">
         <table className="w-full text-sm">
           <thead>
             <tr className={`${isDark ? 'bg-slate-700/50' : 'bg-gray-100'}`}>
               <th className={`p-2 text-left ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('views.region')}</th>
               <th className={`p-2 text-right ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('table.count')}</th>
               <th className={`p-2 text-right ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('table.paidPercent')}</th>
               <th className={`p-2 text-right ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('table.overduePercent')}</th>
               <th className={`p-2 text-right ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Просрочки 2 мес.</th>
               <th className={`p-2 text-right ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Просрочки 3 мес.</th>
               <th className={`p-2 text-right ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('table.remainingAmount')}</th>
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
                 ? Math.round((modelInRegion.total_overdue / modelInRegion.total_price) * 100 * 100) / 100
                 : 0;
               
               const remaining = modelInRegion.total_price - modelInRegion.total_paid - modelInRegion.total_prepayment;
               
               return (
                 <tr 
                   key={region.id} 
                   className={`border-b ${isDark ? 'border-slate-700' : 'border-gray-200'} ${isDark ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'} cursor-pointer ${region.id === selectedRegion ? (isDark ? 'bg-blue-900/20' : 'bg-blue-50') : ''}`}
                   onClick={() => handleRegionSelect(region.id)}
                 >
                   <td className={`p-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{region.name}</td>
                   <td className={`p-2 text-right ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{(modelInRegion.contract_count)} {t('units.pieces')} </td>
                   <td className="p-2 text-right text-green-400">{paidPercentage}%</td>
                   <td className="p-2 text-right text-red-400">{overduePercentage}%</td>
                   <td className="p-2 text-right text-amber-400">
                     {modelInRegion.overdue_last_2_months > 0 ? formatNumber(modelInRegion.overdue_last_2_months) : '-'}
                   </td>
                   <td className="p-2 text-right text-orange-400">
                     {modelInRegion.overdue_last_3_months > 0 ? formatNumber(modelInRegion.overdue_last_3_months) : '-'}
                   </td>
                   <td className={`p-2 text-right ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{formatNumber(remaining)}</td>
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
   <div className={`${isDark ? 'bg-slate-900' : 'bg-gray-50'} p-4 md:p-6 ${isDark ? 'text-white' : 'text-gray-900'} min-h-screen`}>
     <ContentReadyLoader isLoading={isLoading} />
     
     <h1 className="text-2xl font-bold mb-6 text-center">{t('title').toUpperCase()}</h1>
     
     {/* Навигационные вкладки */}
     <div className={`flex mb-6 border-b ${isDark ? 'border-slate-700' : 'border-gray-300'} overflow-x-auto pb-1`}>
       <button 
         className={`px-4 py-2 font-medium whitespace-nowrap ${viewMode === 'region' ? 'text-blue-400 border-b-2 border-blue-400' : (isDark ? 'text-slate-400' : 'text-gray-600')}`}
         onClick={() => {
           setViewMode('region');
           setModelCompareMode(false);
         }}
       >
         {t('views.byRegion')}
       </button>
       {selectedModel && (
         <button 
           className={`px-4 py-2 font-medium whitespace-nowrap ${viewMode === 'model' ? 'text-blue-400 border-b-2 border-blue-400' : (isDark ? 'text-slate-400' : 'text-gray-600')}`}
           onClick={() => setViewMode('model')}
         >
           {selectedModel.model_name}
         </button>
       )}
     </div>
     
     <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl p-5 shadow-lg border ${isDark ? 'border-slate-700' : 'border-gray-200'} mb-6`}>
       <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
         {viewMode === 'region' ? t('views.region') : `${selectedModel?.model_name} ${t('views.byRegion')}`}
       </h3>
       
       <div className="flex flex-wrap mb-4 gap-2">
         <button
           key="all"
           onClick={() => handleRegionSelect('all')}
           className={`mb-2 px-4 py-2 rounded-lg transition-all ${
             selectedRegion === 'all' 
               ? 'bg-blue-600 text-white font-medium ring-2 ring-blue-500/50' 
               : isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
           }`}
         >
           {t('views.allRegions')}
         </button>

         {getRegions().map(region => (
           <button
             key={region.id}
             onClick={() => handleRegionSelect(region.id)}
             className={`mb-2 px-4 py-2 rounded-lg transition-all ${
               selectedRegion === region.id 
                 ? 'bg-blue-600 text-white font-medium ring-2 ring-blue-500/50' 
                 : isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
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
         <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
           <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
             {t('modelDetails.carCatalog')} - {selectedRegion === 'all' ? t('views.allRegions') : 
               getRegions().find(r => r.id === selectedRegion)?.name || t('views.unknownRegion')}
           </h3>
           <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
             {t('clickToViewDetails')}
           </div>
         </div>
       {renderModelCards()}
       </div>
     )}
     
     {/* Графики */}
     <div className="space-y-6">
       {/* График по регионам показываем только в режиме региона */}
       {viewMode === 'region' && (
         <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-lg border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
           <div ref={regionChartRef} className="w-full h-[350px]"></div>
         </div>
       )}
       
       <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-lg border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
         <div ref={mainChartRef} className="w-full h-[300px]"></div>
       </div>
       
       <div className={`grid grid-cols-1 ${isTablet || isDesktop ? 'md:grid-cols-2' : ''} gap-4`}>
         <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-lg border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
           <div ref={modelChartRef} className="w-full h-[300px]"></div>
         </div>
         
         <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-lg border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
           <div ref={paymentStatusRef} className="w-full h-[300px]"></div>
         </div>
       </div>
       
       <div className={`grid grid-cols-1 ${isTablet || isDesktop ? 'md:grid-cols-2' : ''} gap-4`}>
         <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-lg border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
           <div ref={monthlyTrendsRef} className="w-full h-[250px]"></div>
         </div>
         
         {/* График истории просрочек */}
         <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-lg border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
           <div ref={overdueHistoryRef} className="w-full h-[280px]"></div>
         </div>
       </div>
     </div>
   </div>
 );
};

export default InstallmentDashboard;