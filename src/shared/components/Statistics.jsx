"use client";

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { D3Visualizer } from '@/src/utils/dataVisualizer';
import * as d3 from 'd3';
import { carModels } from '@/src/shared/mocks/mock-data';

export default function Statistics() {
  // State variables
  const [view, setView] = useState('models');
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [chartType, setChartType] = useState('bar');
  const [animateCards, setAnimateCards] = useState(true);
  const [data, setData] = useState({
    modelData: [],
    dealerData: [],
    salespersonData: [],
    trendData: [],
    paymentData: [] // Новое состояние для данных о платежах
  });
  
  // Режим просмотра детализации платежей
  const [viewMode, setViewMode] = useState('general'); // 'general' или 'payments'
  
  // Период времени - новое состояние
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 6)),
    endDate: new Date(),
    preset: 'last6Months'
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Для пагинации списка дилеров
  const [currentPage, setCurrentPage] = useState(1);
  const dealersPerPage = 10;

  // Refs for chart containers
  const modelChartRef = useRef(null);
  const modelSecondaryChartRef = useRef(null);
  const dealerChartRef = useRef(null);
  const dealerSecondaryChartRef = useRef(null);
  const dealerPaymentsChartRef = useRef(null);
  const salespersonChartRef = useRef(null);
  const salespersonSecondaryChartRef = useRef(null);
  const trendChartRef = useRef(null);
  const datePickerRef = useRef(null);

  // Filtered data
  const filteredDealerData = selectedModel
    ? data.dealerData.filter(d => d.modelId === selectedModel.id)
    : [];

  // Функция для пагинации дилеров
  const getPaginatedDealers = () => {
    const start = (currentPage - 1) * dealersPerPage;
    return filteredDealerData.slice(start, start + dealersPerPage);
  };
  
  // Общее количество страниц для пагинации
  const totalPages = Math.ceil(filteredDealerData.length / dealersPerPage);

  const filteredSalespersonData = (selectedModel && selectedDealer)
    ? data.salespersonData.filter(
        d => d.modelId === selectedModel.id && d.dealerId === selectedDealer.dealerId
      )
    : [];
    
  // Получаем топ-5 продавцов для выбранного дилера
  const getTopSalespeople = () => {
    if (!selectedDealer || !selectedModel) return [];
    
    return filteredSalespersonData
      .sort((a, b) => b.sales - a.sales) // Сортировка по продажам (от большего к меньшему)
      .slice(0, 5); // Берем только топ-5
  };
  
  const topSalespeople = getTopSalespeople();
    
  const filteredPaymentData = (selectedModel && selectedDealer)
    ? data.paymentData.find(
        p => p.modelId === selectedModel.id && p.dealerId === selectedDealer.dealerId
      )
    : null;

  // Event handlers
  const handleModelClick = (model) => {
    setSelectedModel(model);
    setView('dealers');
    setAnimateCards(true);
    setViewMode('general');
    setCurrentPage(1); // Сбрасываем пагинацию при смене модели
  };

  const handleDealerClick = (dealer) => {
    setSelectedDealer(dealer);
    setView('salespeople');
    setAnimateCards(true);
    setViewMode('general');
  };

  const handleBackClick = () => {
    setAnimateCards(true);
    setViewMode('general');
    if (view === 'salespeople') {
      setView('dealers');
      setSelectedDealer(null);
    } else if (view === 'dealers') {
      setView('models');
      setSelectedModel(null);
      setCurrentPage(1); // Сбрасываем пагинацию
    }
  };
  
  // Обработчик переключения режима просмотра
  const toggleViewMode = () => {
    setViewMode(viewMode === 'general' ? 'payments' : 'general');
  };
  
  // Обработчики пагинации
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  // Обработчики для датапикера
  const handleDateRangeChange = (newRange) => {
    setDateRange({
      ...dateRange,
      ...newRange,
      preset: 'custom'
    });
    refreshDataWithDateRange({...dateRange, ...newRange});
  };
  
  const handlePresetSelect = (preset) => {
    let startDate = new Date();
    const endDate = new Date();
    
    switch(preset) {
      case 'last7Days':
        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'last30Days':
        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 30);
        break;
      case 'last3Months':
        startDate = new Date(endDate);
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'last6Months':
        startDate = new Date(endDate);
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case 'last12Months':
        startDate = new Date(endDate);
        startDate.setMonth(endDate.getMonth() - 12);
        break;
      case 'thisYear':
        startDate = new Date(endDate.getFullYear(), 0, 1);
        break;
      case 'lastYear':
        startDate = new Date(endDate.getFullYear() - 1, 0, 1);
        endDate.setFullYear(endDate.getFullYear() - 1, 11, 31);
        break;
    }
    
    const newRange = { startDate, endDate, preset };
    setDateRange(newRange);
    refreshDataWithDateRange(newRange);
    setShowDatePicker(false);
  };
  
  // Функция обновления данных с учетом выбранного периода
  const refreshDataWithDateRange = (range) => {
    const newData = generateDemoData(range.startDate, range.endDate);
    setData(newData);
  };

  // Закрытие датапикера при клике вне его области
  useEffect(() => {
    function handleClickOutside(event) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [datePickerRef]);

  // Форматирование даты для отображения
  const formatDate = (date) => {
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  
  // Форматирование суммы в удобочитаемый вид
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', { 
      style: 'currency', 
      currency: 'UZS',
      maximumFractionDigits: 0,
      notation: 'compact'
    }).format(amount);
  };
  
  // Получение названия периода
  const getDateRangeLabel = () => {
    const { preset, startDate, endDate } = dateRange;
    
    switch(preset) {
      case 'last7Days': return 'Последние 7 дней';
      case 'last30Days': return 'Последние 30 дней';
      case 'last3Months': return 'Последние 3 месяца';
      case 'last6Months': return 'Последние 6 месяцев';
      case 'last12Months': return 'Последние 12 месяцев';
      case 'thisYear': return 'Текущий год';
      case 'lastYear': return 'Прошлый год';
      case 'custom': return `${formatDate(startDate)} — ${formatDate(endDate)}`;
      default: return `${formatDate(startDate)} — ${formatDate(endDate)}`;
    }
  };

  // Утилитарные функции для генерации случайных имен
  function generateRandomName() {
    const firstNames = ['Александр', 'Дмитрий', 'Сергей', 'Михаил', 'Иван', 'Екатерина', 'Мария', 'Анна', 'Ольга', 'Наталья',
                         'Виктор', 'Андрей', 'Павел', 'Максим', 'Юрий', 'Татьяна', 'Елена', 'Светлана', 'Ирина', 'Алексей'];
    const lastNames = ['Иванов', 'Смирнов', 'Кузнецов', 'Попов', 'Васильев', 'Петров', 'Соколов', 'Новиков', 'Морозов', 'Волков',
                        'Лебедев', 'Козлов', 'Виноградов', 'Белов', 'Черных', 'Федоров', 'Голубев', 'Дмитриев', 'Королев', 'Гусев'];
    
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  }

  function generateRandomDealerName() {
    const prefixes = ['Авто', 'Мотор', 'Драйв', 'Кар', 'Премиум', 'Элит', 'Стар', 'Вип', 'Люкс', 'Мега'];
    const suffixes = ['Сервис', 'Центр', 'Трейд', 'Дилер', 'Плюс', 'Престиж', 'Лакшери', 'Моторс', 'Трак', 'Авто'];
    
    return `${prefixes[Math.floor(Math.random() * prefixes.length)]}${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
  }

  // Generate demo data
  const generateDemoData = (startDate = dateRange.startDate, endDate = dateRange.endDate) => {
    // Используем данные из mock-data.js
    const models = carModels.map((car, index) => {
      const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];
      return {
        id: car.id,
        name: car.name,
        color: colors[index % colors.length],
        img: car.img,
        category: car.category
      };
    });

    // Генерируем 500 дилеров вместо текущих 4
    const dealers = Array.from({ length: 500 }).map((_, index) => ({
      id: index + 1,
      name: `${generateRandomDealerName()} #${index + 1}`
    }));

    // Для каждого дилера генерируем до 100 продавцов
    const salespeople = [];
    dealers.forEach(dealer => {
      const salesPersonCount = Math.floor(Math.random() * 80) + 20; // от 20 до 100 продавцов
      
      Array.from({ length: salesPersonCount }).forEach((_, spIndex) => {
        salespeople.push({
          id: salespeople.length + 1,
          name: generateRandomName(),
          dealerId: dealer.id
        });
      });
    });

    // Модифицируем генерацию данных с учетом выбранного временного периода
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const multiplier = Math.max(1, daysDiff / 180); // Примерная нормализация по отношению к 6 месяцам
    
    const modelData = models.map(model => {
      // Масштабируем значения в зависимости от выбранного периода
      return {
        id: model.id,
        name: model.name,
        color: model.color,
        img: model.img,
        category: model.category,
        totalSales: Math.floor((Math.random() * 1000 + 200) * multiplier),
      };
    });

    const dealerData = [];
    models.forEach(model => {
      dealers.forEach(dealer => {
        // Используем нормальное распределение для более реалистичных данных
        // Это приведет к тому, что большинство дилеров будут иметь средние продажи,
        // а некоторые выделятся как супер-успешные или очень неуспешные
        const normalRandom = () => {
          let u = 0, v = 0;
          while(u === 0) u = Math.random();
          while(v === 0) v = Math.random();
          const std = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
          // Настраиваем стандартное отклонение и среднее значение
          return std * 100 + 300; // среднее 300, стандартное отклонение 100
        };
        
        const sales = Math.max(5, Math.floor(normalRandom() * multiplier));
        dealerData.push({
          modelId: model.id,
          dealerId: dealer.id,
          dealerName: dealer.name,
          modelName: model.name,
          sales: sales,
          color: model.color,
        });
      });
    });

    const salespersonData = [];
    dealerData.forEach(dealerRecord => {
      const dealerSalespeople = salespeople.filter(sp => sp.dealerId === dealerRecord.dealerId);
      
      let remainingSales = dealerRecord.sales;
      
      // Применим распределение Парето для продаж сотрудников:
      // 20% сотрудников делают 80% продаж
      const pareto = [];
      const topPerformersCount = Math.max(1, Math.floor(dealerSalespeople.length * 0.2));
      
      dealerSalespeople.forEach((_, index) => {
        if (index < topPerformersCount) {
          // Для топ-20% сотрудников
          pareto.push(0.8 / topPerformersCount);
        } else {
          // Для остальных 80% сотрудников
          pareto.push(0.2 / (dealerSalespeople.length - topPerformersCount));
        }
      });
      
      // Перемешиваем парето-индексы для реалистичности
      for (let i = pareto.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pareto[i], pareto[j]] = [pareto[j], pareto[i]];
      }
      
      dealerSalespeople.forEach((salesperson, index) => {
        const salesShare = pareto[index];
        let sales = Math.round(dealerRecord.sales * salesShare);
        
        // Корректируем, чтобы сумма точно равнялась общим продажам
        if (index === dealerSalespeople.length - 1) {
          sales = remainingSales;
        } else {
          remainingSales -= sales;
        }
        
        // Добавляем немного случайности
        sales = Math.max(1, sales + Math.floor((Math.random() - 0.5) * 5));
        
        salespersonData.push({
          modelId: dealerRecord.modelId,
          dealerId: dealerRecord.dealerId,
          salespersonId: salesperson.id,
          salespersonName: salesperson.name,
          modelName: dealerRecord.modelName,
          dealerName: dealerRecord.dealerName,
          sales: sales,
          color: dealerRecord.color,
        });
      });
    });

    // Генерация данных тренда с учетом выбранного периода
    const trendData = [];
    
    // Определяем интервал генерации точек данных в зависимости от длительности периода
    let interval = 1; // по умолчанию - 1 день
    if (daysDiff > 90) interval = 7; // если больше 3 месяцев - еженедельно
    if (daysDiff > 365) interval = 30; // если больше года - ежемесячно
    
    for (let i = 0; i <= daysDiff; i += interval) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      // Добавляем сезонность и тренд
      const monthFactor = 1 + 0.3 * Math.sin((date.getMonth() / 12) * Math.PI * 2);
      const trendFactor = 1 + (i / daysDiff) * 0.2; // Небольшой рост во времени
      
      trendData.push({
        date: date.toISOString().slice(0, 10),
        sales: Math.floor((Math.random() * 400 + 100) * monthFactor * trendFactor)
      });
    }
    
    // Новая генерация данных о платежах
    const paymentData = [];
    dealerData.forEach(dealerRecord => {
      // Для каждого дилера генерируем данные о платежах
      const totalCars = dealerRecord.sales;
      const paidCars = Math.floor(totalCars * (0.7 + Math.random() * 0.2)); // 70-90% оплачено полностью
      const returnedCars = Math.floor((totalCars - paidCars) * (Math.random() * 0.8)); // Часть возвращена
      const pendingCars = totalCars - paidCars - returnedCars; // Остальные в процессе
      
      const paidAmount = paidCars * (Math.random() * 25000 + 75000);
      const returnedAmount = returnedCars * (Math.random() * 20000 + 60000);
      const pendingAmount = pendingCars * (Math.random() * 15000 + 80000);
      
      // Данные о платежах для этого дилера и модели
      paymentData.push({
        modelId: dealerRecord.modelId,
        modelName: dealerRecord.modelName,
        dealerId: dealerRecord.dealerId,
        dealerName: dealerRecord.dealerName,
        totalCars: totalCars,
        paidCars: paidCars,
        returnedCars: returnedCars,
        pendingCars: pendingCars,
        paidAmount: paidAmount,
        returnedAmount: returnedAmount,
        pendingAmount: pendingAmount,
        totalAmount: paidAmount + pendingAmount,
        // Генерируем детали по отдельным транзакциям
        transactions: Array.from({ length: totalCars }).map((_, i) => {
          const status = i < paidCars ? 'paid' : (i < paidCars + returnedCars ? 'returned' : 'pending');
          const carId = `CAR-${dealerRecord.modelId}-${dealerRecord.dealerId}-${i + 1}`;
          const carName = `${dealerRecord.modelName} ${["Base", "Comfort", "Lux", "Premium"][Math.floor(Math.random() * 4)]}`;
          const paymentDate = new Date(startDate);
          paymentDate.setDate(startDate.getDate() + Math.floor(Math.random() * daysDiff));
          
          const baseAmount = Math.floor(Math.random() * 30000 + 70000);
          let paymentAmount = baseAmount;
          let returnAmount = 0;
          let returnDate = null;
          
          if (status === 'returned') {
            returnDate = new Date(paymentDate);
            returnDate.setDate(paymentDate.getDate() + Math.floor(Math.random() * 30) + 5);
            returnAmount = Math.floor(baseAmount * (Math.random() * 0.5 + 0.5)); // 50-100% возвращено
          } else if (status === 'pending') {
            paymentAmount = Math.floor(baseAmount * (Math.random() * 0.4 + 0.1)); // 10-50% предоплата
          }
          
          return {
            id: `TRX-${dealerRecord.modelId}-${dealerRecord.dealerId}-${i + 1}`,
            carId,
            carName,
            status,
            totalAmount: baseAmount,
            paymentAmount,
            paymentDate: paymentDate.toISOString(),
            returnDate: returnDate ? returnDate.toISOString() : null,
            returnAmount,
            balanceAmount: baseAmount - paymentAmount + returnAmount
          };
        })
      });
    });

    return { modelData, dealerData, salespersonData, trendData, paymentData };
  };

  // Render functions with our new D3 visualizer
 const renderModelCharts = () => {
  if (!modelChartRef.current || !modelSecondaryChartRef.current || !data.modelData.length) return;
  
  // Format data for D3 visualizer - продажи по моделям
  const salesChartData = data.modelData.map(model => ({
    id: model.id,
    label: model.name,
    value: model.totalSales,
    color: model.color,
    model: model
  }));
  
  // Primary chart - Продажи по моделям
  if (chartType === 'bar') {
    D3Visualizer.createBarChart(salesChartData, {
      container: modelChartRef.current,
      title: `Продажи по моделям (${getDateRangeLabel()})`,
      onClick: (item) => handleModelClick(item.model),
      height: 400
    });
  } else if (chartType === 'pie') {
    D3Visualizer.createPieChart(salesChartData, {
      container: modelChartRef.current,
      title: `Доля рынка по моделям (${getDateRangeLabel()})`,
      onClick: (item) => handleModelClick(item.model),
      height: 400
    });
  } else if (chartType === 'stacked') {
    // Группировка данных для stacked chart
    const dealersByModel = data.dealerData.reduce((acc, dealer) => {
      const model = data.modelData.find(m => m.id === dealer.modelId);
      if (!model) return acc;
      
      if (!acc[model.name]) {
        acc[model.name] = {
          category: model.name,
          values: []
        };
      }
      
      acc[model.name].values.push({
        label: dealer.dealerName,
        value: dealer.sales
      });
      
      return acc;
    }, {});

    D3Visualizer.createStackedBarChart(Object.values(dealersByModel), {
      container: modelChartRef.current,
      title: `Продажи по моделям и дилерам (${getDateRangeLabel()})`,
      onClick: (item) => {
        const model = data.modelData.find(m => m.name === item.category);
        if (model) handleModelClick(model);
      },
      height: 400
    });
  }
  
  // Secondary chart - Возвраты по моделям
  // Рассчитываем возвраты для каждой модели, суммируя возвраты по всем дилерам
  const returnsData = data.modelData.map(model => {
    // Находим все данные о платежах для этой модели
    const modelPayments = data.paymentData.filter(p => p.modelId === model.id);
    
    // Суммируем возврашенные автомобили и суммы
    const totalReturnedCars = modelPayments.reduce((sum, p) => sum + p.returnedCars, 0);
    const totalReturnedAmount = modelPayments.reduce((sum, p) => sum + p.returnedAmount, 0);
    
    // Рассчитываем процент возвратов от общих продаж
    const returnPercentage = model.totalSales > 0 
      ? (totalReturnedCars / model.totalSales) * 100 
      : 0;
    
    return {
      id: model.id,
      label: model.name,
      value: totalReturnedCars,
      amount: totalReturnedAmount,
      percentage: returnPercentage.toFixed(1),
      color: '#ef4444', // Красный цвет для возвратов
      model: model
    };
  });
  
  // Отображаем график возвратов
  D3Visualizer.createBarChart(returnsData, {
    container: modelSecondaryChartRef.current,
    title: `Возвраты по моделям (${getDateRangeLabel()})`,
    onClick: (item) => handleModelClick(item.model),
    height: 400,
    colors: returnsData.map(d => '#ef4444') // Все столбцы красные для обозначения возвратов
  });
  
  // Добавляем аннотации к графику возвратов
  const container = modelSecondaryChartRef.current;
  const annotations = document.createElement('div');
  annotations.className = 'mt-4 grid grid-cols-3 gap-4';
  
  const totalReturns = returnsData.reduce((sum, d) => sum + d.value, 0);
  const totalReturnAmount = returnsData.reduce((sum, d) => sum + d.amount, 0);
  const avgReturnPercentage = returnsData.reduce((sum, d) => sum + parseFloat(d.percentage), 0) / returnsData.length;
  
  annotations.innerHTML = `
    <div class="bg-gray-900/50 p-3 rounded-lg border border-red-900/30">
      <div class="text-sm text-gray-400">Всего возвратов</div>
      <div class="text-xl font-bold text-red-400 mt-1">${totalReturns.toLocaleString()}</div>
    </div>
    <div class="bg-gray-900/50 p-3 rounded-lg border border-red-900/30">
      <div class="text-sm text-gray-400">Сумма возвратов</div>
      <div class="text-xl font-bold text-red-400 mt-1">${formatCurrency(totalReturnAmount)}</div>
    </div>
    <div class="bg-gray-900/50 p-3 rounded-lg border border-red-900/30">
      <div class="text-sm text-gray-400">Средний % возвратов</div>
      <div class="text-xl font-bold text-red-400 mt-1">${avgReturnPercentage.toFixed(1)}%</div>
    </div>
  `;
  
  container.appendChild(annotations);
  
  // Тренд график мы оставляем без изменений
  if (trendChartRef.current && data.trendData.length) {
    D3Visualizer.createAreaChart(data.trendData.map(d => ({
      x: d.date,
      y: d.sales
    })), {
      container: trendChartRef.current,
      title: `Тренд продаж за период: ${getDateRangeLabel()}`,
      height: 300,
      colors: ['#10b981']
    });
  }
};
  const renderDealerCharts = () => {
    if (!dealerChartRef.current || !dealerSecondaryChartRef.current || !filteredDealerData.length || !selectedModel) return;
    
    // Формат данных для D3 визуализатора
    const chartData = filteredDealerData.map(dealer => ({
      id: dealer.dealerId,
      label: dealer.dealerName,
      value: dealer.sales,
      color: selectedModel.color,
      dealer
    }));
    
    // Сортируем дилеров по продажам для лучшей визуализации
    chartData.sort((a, b) => b.value - a.value);
    
    // Берем только топ-20 дилеров для графика, чтобы избежать перегрузки
    const topDealers = chartData.slice(0, 20);
    
    // Primary chart - продажи по дилерам
    if (chartType === 'bar') {
      D3Visualizer.createBarChart(topDealers, {
        container: dealerChartRef.current,
        title: `Топ-20 дилеров ${selectedModel.name} по продажам (${getDateRangeLabel()})`,
        onClick: (item) => handleDealerClick(item.dealer),
        height: 400,
        colors: topDealers.map((_, i) => {
          // Creating color variations
          const baseColor = selectedModel.color;
          const hslColor = d3.hsl(baseColor);
          hslColor.l = 0.4 + (i * 0.1);
          return hslColor.toString();
        })
      });
    } else if (chartType === 'pie') {
      D3Visualizer.createPieChart(topDealers, {
        container: dealerChartRef.current,
        title: `Доля продаж ${selectedModel.name} по топ-20 дилерам (${getDateRangeLabel()})`,
        onClick: (item) => handleDealerClick(item.dealer),
        height: 400,
        colors: topDealers.map((_, i) => {
          // Creating color variations
          const baseColor = selectedModel.color;
          const hslColor = d3.hsl(baseColor);
          hslColor.l = 0.4 + (i * 0.1);
          return hslColor.toString();
        })
      });
    }
    
    // Secondary chart - Сопоставление продаж и возвратов
    const dealersForComparison = topDealers.slice(0, 10); // Берем только топ-10 для ясности
    
    // Создаем данные для сравнения продаж и возвратов
    const salesVsReturnsData = [];
    
    dealersForComparison.forEach(dealer => {
      const paymentInfo = data.paymentData.find(p => 
        p.modelId === selectedModel.id && p.dealerId === dealer.dealer.dealerId
      );
      
      if (paymentInfo) {
        // Данные о продажах
        salesVsReturnsData.push({
          id: `sales-${dealer.dealer.dealerId}`,
          label: dealer.dealer.dealerName,
          value: dealer.dealer.sales,
          type: 'sales',
          color: selectedModel.color,
          dealer: dealer.dealer
        });
        
        // Данные о возвратах
        salesVsReturnsData.push({
          id: `returns-${dealer.dealer.dealerId}`,
          label: `${dealer.dealer.dealerName} (возврат)`,
          value: paymentInfo.returnedCars,
          type: 'returns',
          color: '#ef4444', // Красный для возвратов
          dealer: dealer.dealer
        });
      }
    });
    
    // Группируем данные по категориям для правильного отображения
    const salesReturnsCategories = [];
    
    dealersForComparison.forEach(dealer => {
      const category = dealer.dealer.dealerName;
      const values = [
        { label: 'Продажи', value: dealer.dealer.sales, color: selectedModel.color },
        { 
          label: 'Возвраты', 
          value: data.paymentData.find(p => 
            p.modelId === selectedModel.id && p.dealerId === dealer.dealer.dealerId
          )?.returnedCars || 0,
          color: '#ef4444'
        }
      ];
      salesReturnsCategories.push({
       category,
       values,
       dealer: dealer.dealer
     });
   });
   
   // Используем stacked bar chart для отображения продаж и возвратов вместе
   D3Visualizer.createStackedBarChart(salesReturnsCategories.reverse(), {
     container: dealerSecondaryChartRef.current,
     title: `Продажи и возвраты ${selectedModel.name} по дилерам (${getDateRangeLabel()})`,
     onClick: (item) => {
       const dealer = item.dealer || filteredDealerData.find(d => d.dealerName === item.category);
       if (dealer) handleDealerClick(dealer);
     },
     height: 400,
     // Пользовательские цвета для стеков
     colors: (d) => {
       if (d && d.label) {
         if (d.label === 'Продажи') return selectedModel.color;
         if (d.label === 'Возвраты') return '#ef4444';
       }
       return '#3b82f6';
     }
   });
 };

 const renderSalespersonCharts = () => {
   if (!salespersonChartRef.current || !salespersonSecondaryChartRef.current || !filteredSalespersonData.length || !selectedModel || !selectedDealer) return;
   
   if (viewMode === 'general') {
     const topSalespeople = [...filteredSalespersonData]
       .sort((a, b) => b.sales - a.sales)
       .slice(0, 15);
     
     // Формат данных для D3 визуализатора
     const chartData = topSalespeople.map(salesperson => ({
       id: salesperson.salespersonId,
       label: salesperson.salespersonName,
       value: salesperson.sales,
       color: selectedModel.color,
       salesperson
     }));
     
     // Primary chart
     if (chartType === 'bar') {
       D3Visualizer.createBarChart(chartData, {
         container: salespersonChartRef.current,
         title: `Топ-15 продавцов ${selectedModel.name} в ${selectedDealer.dealerName} (${getDateRangeLabel()})`,
         height: 400,
         colors: chartData.map((_, i) => {
           // Creating color variations
           const baseColor = selectedModel.color;
           const hslColor = d3.hsl(baseColor);
           hslColor.l = 0.4 + (i * 0.1);
           return hslColor.toString();
         })
       });
     } else if (chartType === 'pie') {
       D3Visualizer.createPieChart(chartData, {
         container: salespersonChartRef.current,
         title: `Доля продаж ${selectedModel.name} в ${selectedDealer.dealerName} (${getDateRangeLabel()})`,
         height: 400,
         colors: chartData.map((_, i) => {
           // Creating color variations
           const baseColor = selectedModel.color;
           const hslColor = d3.hsl(baseColor);
           hslColor.l = 0.4 + (i * 0.1);
           return hslColor.toString();
         })
       });
     }
     
     // Generate some mock monthly performance data for each salesperson
     const monthlyData = topSalespeople.slice(0, 5).flatMap(salesperson => {
       const today = new Date();
       return Array.from({ length: 6 }).map((_, i) => {
         const date = new Date();
         date.setMonth(today.getMonth() - 5 + i);
         return {
           x: date.toISOString().slice(0, 7),
           y: Math.floor(Math.random() * 30) + 10,
           group: salesperson.salespersonName
         };
       });
     });

     // Group by month for line chart
     const monthlyByPerson = {};
     monthlyData.forEach(d => {
       if (!monthlyByPerson[d.group]) {
         monthlyByPerson[d.group] = [];
       }
       monthlyByPerson[d.group].push(d);
     });

     // Secondary chart - Performance over time
     const multiLineData = Object.entries(monthlyByPerson).map(([name, values]) => ({
       name,
       values: values.map(v => ({ date: v.x, value: v.y }))
     }));

     // Custom D3 rendering for multi-line chart
     const container = salespersonSecondaryChartRef.current;
     container.innerHTML = '';
     
     const width = container.clientWidth;
     const height = 400;
     const margin = { top: 40, right: 80, bottom: 60, left: 60 };
     
     const svg = d3.select(container)
       .append('svg')
       .attr('width', width)
       .attr('height', height)
       .style('background', '#1f2937')
       .style('border-radius', '0.5rem');
       
     svg.append('text')
       .attr('x', width / 2)
       .attr('y', margin.top / 2)
       .attr('text-anchor', 'middle')
       .style('font-size', '1.2rem')
       .style('font-weight', 'bold')
       .style('fill', '#f9fafb')
       .text(`Динамика продаж топ-5 продавцов за период: ${getDateRangeLabel()}`);
       
     const x = d3.scaleTime()
       .domain(d3.extent(monthlyData, d => new Date(d.x)))
       .range([margin.left, width - margin.right]);
       
     const y = d3.scaleLinear()
       .domain([0, d3.max(monthlyData, d => d.y)])
       .nice()
       .range([height - margin.bottom, margin.top]);
       
     const colorScale = d3.scaleOrdinal()
       .domain(Object.keys(monthlyByPerson))
       .range(d3.quantize(d => {
         const baseColor = selectedModel.color;
         const hslColor = d3.hsl(baseColor);
         hslColor.h += d * 180;
         return hslColor.toString();
       }, Object.keys(monthlyByPerson).length));
       
     const line = d3.line()
       .x(d => x(new Date(d.x)))
       .y(d => y(d.y))
       .curve(d3.curveMonotoneX);
       
     svg.append('g')
       .attr('transform', `translate(0,${height - margin.bottom})`)
       .call(d3.axisBottom(x).ticks(6).tickFormat(d => d3.timeFormat('%b %Y')(d)))
       .call(g => g.select('.domain').remove())
       .call(g => g.selectAll('text').style('fill', '#f9fafb'));
       
     svg.append('g')
       .attr('transform', `translate(${margin.left},0)`)
       .call(d3.axisLeft(y).ticks(5))
       .call(g => g.select('.domain').remove())
       .call(g => g.selectAll('text').style('fill', '#f9fafb'))
       .call(g => g.selectAll('.tick line')
         .attr('x2', width - margin.left - margin.right)
         .attr('stroke-opacity', 0.1));
         
     // Add lines
     Object.entries(monthlyByPerson).forEach(([name, values], i) => {
       const pathData = monthlyData.filter(d => d.group === name);
       
       // Add path
       svg.append('path')
         .datum(pathData)
         .attr('fill', 'none')
         .attr('stroke', colorScale(name))
         .attr('stroke-width', 3)
         .attr('d', line)
         .attr('opacity', 0)
         .transition()
         .duration(1000)
         .delay(i * 300)
         .attr('opacity', 0.8);

       // Add points
       svg.selectAll(`.point-${i}`)
         .data(pathData)
         .join('circle')
         .attr('class', `point-${i}`)
         .attr('cx', d => x(new Date(d.x)))
         .attr('cy', d => y(d.y))
         .attr('r', 0)
         .attr('fill', colorScale(name))
         .attr('stroke', '#1f2937')
         .attr('stroke-width', 2)
         .transition()
         .duration(500)
         .delay((d, j) => i * 300 + j * 100 + 1000)
         .attr('r', 6);
     });
     
     // Add legend
     const legend = svg.append('g')
       .attr('transform', `translate(${width - margin.right + 20}, ${margin.top + 20})`);
       
     Object.keys(monthlyByPerson).forEach((name, i) => {
       const legendRow = legend.append('g')
         .attr('transform', `translate(0, ${i * 25})`);
         
       legendRow.append('rect')
         .attr('width', 15)
         .attr('height', 3)
         .attr('fill', colorScale(name));
         
       legendRow.append('text')
         .attr('x', 25)
         .attr('y', 5)
         .text(name)
         .style('font-size', '0.8rem')
         .style('fill', '#f9fafb');
     });
   } else if (viewMode === 'payments') {
     // Режим просмотра платежей
     
     if (filteredPaymentData && dealerPaymentsChartRef.current) {
       // Отображаем детализацию платежей дилера
       
       // График статуса платежей
       const paymentStatusData = [
         { 
           label: 'Оплачено полностью', 
           value: filteredPaymentData.paidCars,
           color: '#10b981' // зеленый
         },
         { 
           label: 'Возвращено', 
           value: filteredPaymentData.returnedCars,
           color: '#ef4444' // красный
         },
         { 
           label: 'Частичная оплата', 
           value: filteredPaymentData.pendingCars,
           color: '#f59e0b' // оранжевый
         }
       ];
       
       D3Visualizer.createPieChart(paymentStatusData, {
         container: salespersonChartRef.current,
         title: `Статус платежей ${selectedModel.name} в ${selectedDealer.dealerName}`,
         height: 400,
         colors: paymentStatusData.map(d => d.color)
       });
       
       // График сумм платежей
       const paymentAmountData = [
         { 
           label: 'Оплачено', 
           value: filteredPaymentData.paidAmount,
           color: '#10b981' // зеленый
         },
         { 
           label: 'Возвращено', 
           value: filteredPaymentData.returnedAmount,
           color: '#ef4444' // красный
         },
         { 
           label: 'В ожидании', 
           value: filteredPaymentData.pendingAmount,
           color: '#f59e0b' // оранжевый
         }
       ];
       
       D3Visualizer.createBarChart(paymentAmountData, {
         container: salespersonSecondaryChartRef.current,
         title: `Суммы платежей ${selectedModel.name} (${getDateRangeLabel()})`,
         height: 400,
         colors: paymentAmountData.map(d => d.color)
       });
       
       // Детальная таблица транзакций (не через D3, а через DOM)
       if (dealerPaymentsChartRef.current) {
         const container = dealerPaymentsChartRef.current;
         container.innerHTML = '';
         
         // Создаем таблицу транзакций
         const tableContainer = document.createElement('div');
         tableContainer.className = 'overflow-auto max-h-[400px] mt-4';
         
         const table = document.createElement('table');
         table.className = 'min-w-full divide-y divide-gray-700';
         
         // Заголовок таблицы
         const tableHead = document.createElement('thead');
         tableHead.className = 'bg-gray-800 sticky top-0';
         tableHead.innerHTML = `
           <tr>
             <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ID</th>
             <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Автомобиль</th>
             <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Статус</th>
             <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Сумма (UZS)</th>
             <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Дата платежа</th>
             <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Возврат</th>
             <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Баланс</th>
           </tr>
         `;
         
         // Тело таблицы
         const tableBody = document.createElement('tbody');
         tableBody.className = 'bg-gray-900 divide-y divide-gray-800';
         
         // Сортируем транзакции: сначала возвращенные, затем частично оплаченные, затем полностью оплаченные
         const sortedTransactions = [...filteredPaymentData.transactions].sort((a, b) => {
           const order = { returned: 0, pending: 1, paid: 2 };
           return order[a.status] - order[b.status];
         });
         
         // Добавляем строки таблицы
         sortedTransactions.forEach((transaction, i) => {
           const row = document.createElement('tr');
           row.className = i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/50';
           
           // Определяем цвет и текст статуса
           let statusColor, statusText;
           switch (transaction.status) {
             case 'paid':
               statusColor = 'bg-green-900 text-green-300';
               statusText = 'Оплачено';
               break;
             case 'returned':
               statusColor = 'bg-red-900 text-red-300';
               statusText = 'Возвращено';
               break;
             case 'pending':
               statusColor = 'bg-yellow-900 text-yellow-300';
               statusText = 'Частично';
               break;
           }
           
           const formatter = new Intl.NumberFormat('ru-RU');
           
           row.innerHTML = `
             <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-400">${transaction.id}</td>
             <td class="px-4 py-3 whitespace-nowrap text-sm text-white">${transaction.carName}</td>
             <td class="px-4 py-3 whitespace-nowrap">
               <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">
                 ${statusText}
               </span>
             </td>
             <td class="px-4 py-3 whitespace-nowrap text-sm text-white">${formatter.format(transaction.paymentAmount)}</td>
             <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-400">${new Date(transaction.paymentDate).toLocaleDateString('ru-RU')}</td>
             <td class="px-4 py-3 whitespace-nowrap text-sm ${transaction.returnAmount > 0 ? 'text-red-400' : 'text-gray-500'}">
               ${transaction.returnAmount > 0 ? 
                 `${formatter.format(transaction.returnAmount)} (${new Date(transaction.returnDate).toLocaleDateString('ru-RU')})` : 
                 '-'}
             </td>
             <td class="px-4 py-3 whitespace-nowrap text-sm ${transaction.balanceAmount > 0 ? 'text-yellow-400' : 'text-green-400'}">
               ${formatter.format(transaction.balanceAmount)}
             </td>
           `;
           
           tableBody.appendChild(row);
         });
         
         table.appendChild(tableHead);
         table.appendChild(tableBody);
         tableContainer.appendChild(table);
         
         // Добавляем заголовок и таблицу в контейнер
         const titleElement = document.createElement('h3');
         titleElement.className = 'text-xl font-bold text-white mb-4';
         titleElement.textContent = `Детализация транзакций (${filteredPaymentData.transactions.length})`;
         
         container.appendChild(titleElement);
         container.appendChild(tableContainer);
       }
     }
   }
 };

 // Альтернативный график - рейтинг продаж моделей по месяцам
 const renderModelTimelineChart = () => {
   if (!modelSecondaryChartRef.current || !data.modelData.length) return;

   const months = [];
   const today = new Date();
   for (let i = 5; i >= 0; i--) {
     const month = new Date(today);
     month.setMonth(today.getMonth() - i);
     months.push(month.toLocaleString('ru', { month: 'short' }));
   }

   // Создаем данные по месяцам для каждой модели
   const modelTimelineData = data.modelData.map(model => {
     // Базовые продажи для модели
     const baseSales = model.totalSales / 6;
     
     // Создаем массив данных по месяцам с некоторой вариативностью
     return {
       category: model.name,
       color: model.color,
       model: model,
       values: months.map((month, idx) => {
         // Добавляем случайную вариацию и тренд (более новые месяцы имеют больше продаж)
         const trendFactor = 0.8 + (idx * 0.05);
         const randomFactor = 0.8 + (Math.random() * 0.4);
         
         return {
           label: month,
           value: Math.round(baseSales * trendFactor * randomFactor),
         };
       })
     };
   });

   // Создаем групповую столбчатую диаграмму
   const container = modelSecondaryChartRef.current;
   container.innerHTML = '';
   
   const width = container.clientWidth;
   const height = 400;
   const margin = { top: 40, right: 90, bottom: 60, left: 60 };
   
   const svg = d3.select(container)
     .append('svg')
     .attr('width', width)
     .attr('height', height)
     .style('background', '#1f2937')
     .style('border-radius', '0.5rem');
   
   svg.append('text')
     .attr('x', width / 2)
     .attr('y', margin.top / 2)
     .attr('text-anchor', 'middle')
     .style('font-size', '1.2rem')
     .style('font-weight', 'bold')
     .style('fill', '#f9fafb')
     .text(`Динамика продаж моделей по месяцам (${getDateRangeLabel()})`);
   
   // Вычисляем максимальное значение для масштаба
   const maxValue = d3.max(modelTimelineData, d => 
     d3.max(d.values, v => v.value)
   );
   
   // Задаем масштабы
   const x0 = d3.scaleBand()
     .domain(months)
     .rangeRound([margin.left, width - margin.right])
     .padding(0.2);
   
   const x1 = d3.scaleBand()
     .domain(modelTimelineData.map(d => d.category))
     .rangeRound([0, x0.bandwidth()])
     .padding(0.05);
   
   const y = d3.scaleLinear()
     .domain([0, maxValue * 1.1])
     .nice()
     .rangeRound([height - margin.bottom, margin.top]);
   
   // Добавляем оси
   svg.append('g')
     .attr('transform', `translate(0,${height - margin.bottom})`)
     .call(d3.axisBottom(x0))
     .call(g => g.select('.domain').remove())
     .call(g => g.selectAll('text')
       .style('fill', '#f9fafb')
       .style('font-size', '0.8rem'));
   
   svg.append('g')
     .attr('transform', `translate(${margin.left},0)`)
     .call(d3.axisLeft(y).ticks(5).tickFormat(d => d))
     .call(g => g.select('.domain').remove())
     .call(g => g.selectAll('text').style('fill', '#f9fafb'))
     .call(g => g.selectAll('.tick line')
       .attr('x2', width - margin.left - margin.right)
       .attr('stroke-opacity', 0.1));
   
   // Добавляем группы и столбцы
   const groups = svg.append('g')
     .selectAll('g')
     .data(modelTimelineData)
     .join('g')
     .attr('transform', d => `translate(${x1(d.category)},0)`)
     .on('click', (event, d) => {
       if (d.model) handleModelClick(d.model);
     });
   
   groups.selectAll('rect')
     .data(d => d.values.map(v => ({ ...v, color: d.color, model: d.model })))
     .join('rect')
     .attr('x', (d, i) => x0(months[i]))
     .attr('y', height - margin.bottom)
     .attr('width', x1.bandwidth())
     .attr('height', 0)
     .attr('rx', 3)
     .attr('fill', d => d.color)
     .style('cursor', 'pointer')
     .transition()
     .duration(800)
     .delay((d, i) => i * 50)
     .attr('y', d => y(d.value))
     .attr('height', d => height - margin.bottom - y(d.value));
   
   // Добавляем подписи к столбцам
   groups.selectAll('text')
     .data(d => d.values.map(v => ({ ...v, color: d.color })))
     .join('text')
     .attr('x', (d, i) => x0(months[i]) + x1.bandwidth() / 2)
     .attr('y', d => y(d.value) - 5)
     .attr('text-anchor', 'middle')
     .style('font-size', '0.7rem')
     .style('fill', '#f9fafb')
     .style('opacity', 0)
     .text(d => d.value)
     .transition()
     .duration(400)
     .delay((d, i) => i * 50 + 800)
     .style('opacity', 1);
   
   // Добавляем легенду
   const legend = svg.append('g')
     .attr('transform', `translate(${width - margin.right + 15}, ${margin.top + 10})`);
   
   modelTimelineData.forEach((d, i) => {
     const legendRow = legend.append('g')
       .attr('transform', `translate(0, ${i * 20})`)
       .style('cursor', 'pointer')
       .on('click', () => {
         if (d.model) handleModelClick(d.model);
       });
     
     legendRow.append('rect')
       .attr('width', 12)
       .attr('height', 12)
       .attr('rx', 2)
       .attr('fill', d.color);
     
     legendRow.append('text')
       .attr('x', 20)
       .attr('y', 10)
       .style('font-size', '0.7rem')
       .style('fill', '#f9fafb')
       .text(d.category);
   });
 };

 // Initialize on mount and update charts when view changes
 useEffect(() => {
   const initialData = generateDemoData();
   setData(initialData);
 }, []);

 useEffect(() => {
   if (view === 'models') {
     renderModelCharts();
     renderModelTimelineChart();
   } else if (view === 'dealers' && selectedModel) {
     renderDealerCharts();
   } else if (view === 'salespeople' && selectedModel && selectedDealer) {
     renderSalespersonCharts();
   }
 }, [view, selectedModel, selectedDealer, data, chartType, dateRange, viewMode, currentPage]);

 // Prepare model card data
 const modelCards = view === 'models' ? data.modelData : [];
 // Получаем дилеров для текущей страницы
 const paginatedDealers = getPaginatedDealers();

 return (
   <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
     <header className="mb-8">
       <motion.h1 
         initial={{ opacity: 0, y: -20 }}
         animate={{ opacity: 1, y: 0 }}
         className="text-3xl md:text-4xl font-bold text-transparent bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text"
       >
         Интерактивная панель продаж автомобилей
       </motion.h1>
       <motion.p 
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         transition={{ delay: 0.2 }}
         className="text-gray-400 mt-2"
       >
         Исследуйте данные о продажах от моделей до отдельных продавцов
       </motion.p>
     </header>
     
     <div className="bg-gray-900/60 rounded-xl p-4 md:p-6 border border-gray-700/50 shadow-xl">
       {/* Инструменты и фильтры */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
         <div className="flex items-center space-x-2">
           <motion.div 
             whileHover={{ scale: 1.05 }} 
             whileTap={{ scale: 0.95 }}
             className={`h-3 w-3 rounded-full cursor-pointer ${view === 'models' ? 'bg-green-500' : 'bg-gray-500'}`}
             onClick={() => setView('models')}
           />
           <div className="h-0.5 w-8 bg-gray-600"></div>
           <motion.div 
             whileHover={{ scale: 1.05 }} 
             whileTap={{ scale: 0.95 }}
             className={`h-3 w-3 rounded-full cursor-pointer ${view === 'dealers' ? 'bg-green-500' : 'bg-gray-500'}`}
             onClick={() => selectedModel && setView('dealers')}
           />
           <div className="h-0.5 w-8 bg-gray-600"></div>
           <motion.div 
             whileHover={{ scale: 1.05 }} 
             whileTap={{ scale: 0.95 }}
             className={`h-3 w-3 rounded-full cursor-pointer ${view === 'salespeople' ? 'bg-green-500' : 'bg-gray-500'}`}
             onClick={() => selectedDealer && setView('salespeople')}
           />
         </div>

         <div className="flex flex-wrap space-x-2 md:mb-0 mb-2">
           <motion.button
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={() => setChartType('bar')}
             className={`px-3 py-1.5 rounded-md text-sm ${chartType === 'bar' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            Столбцы
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setChartType('pie')}
            className={`px-3 py-1.5 rounded-md text-sm ${chartType === 'pie' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            Круговая
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setChartType('stacked')}
            className={`px-3 py-1.5 rounded-md text-sm ${chartType === 'stacked' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            Составная
          </motion.button>
        </div>
        
        {/* Режим просмотра платежей (только для уровня продавцов) */}
        {view === 'salespeople' && selectedDealer && (
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleViewMode}
              className={`px-3 py-1.5 rounded-md text-sm ${viewMode === 'general' ? 'bg-gray-700 text-gray-300' : 'bg-blue-600 text-white'}`}
            >
              {viewMode === 'general' ? 'Показать платежи' : 'Показать продавцов'}
            </motion.button>
            
            {viewMode === 'payments' && (
              <div className="text-sm text-yellow-300 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Режим просмотра платежей
              </div>
            )}
          </div>
        )}
        
        {/* Компонент выбора периода */}
        <div className="relative ml-auto">
          <motion.div 
            className="bg-gray-800 rounded-lg border border-gray-700 flex items-center cursor-pointer p-2 hover:bg-gray-700/70 transition-colors"
            onClick={() => setShowDatePicker(!showDatePicker)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-white text-sm whitespace-nowrap">{getDateRangeLabel()}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
          
          {showDatePicker && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-0 mt-2 bg-gray-800 rounded-lg border border-gray-700 shadow-xl z-50 w-72"
              ref={datePickerRef}
            >
              <div className="p-3">
                <h3 className="text-white font-semibold mb-3">Выберите период</h3>
                
                {/* Предустановленные периоды */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePresetSelect('last7Days')}
                    className={`px-3 py-1.5 rounded-md text-xs ${dateRange.preset === 'last7Days' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                  >
                    7 дней
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePresetSelect('last30Days')}
                    className={`px-3 py-1.5 rounded-md text-xs ${dateRange.preset === 'last30Days' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                  >
                    30 дней
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePresetSelect('last3Months')}
                    className={`px-3 py-1.5 rounded-md text-xs ${dateRange.preset === 'last3Months' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                  >
                    3 месяца
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePresetSelect('last6Months')}
                    className={`px-3 py-1.5 rounded-md text-xs ${dateRange.preset === 'last6Months' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                  >
                    6 месяцев
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePresetSelect('last12Months')}
                    className={`px-3 py-1.5 rounded-md text-xs ${dateRange.preset === 'last12Months' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                  >
                    12 месяцев
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePresetSelect('thisYear')}
                    className={`px-3 py-1.5 rounded-md text-xs ${dateRange.preset === 'thisYear' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                  >
                    Этот год
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePresetSelect('lastYear')}
                    className={`px-3 py-1.5 rounded-md text-xs ${dateRange.preset === 'lastYear' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                  >
                    Прошлый год
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePresetSelect('custom')}
                    className={`px-3 py-1.5 rounded-md text-xs col-span-2 ${dateRange.preset === 'custom' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                  >
                    Произвольный период
                  </motion.button>
                </div>
                
                {/* Custom date range */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Начало периода</label>
                    <input 
                      type="date" 
                      value={dateRange.startDate.toISOString().split('T')[0]}
                      onChange={(e) => handleDateRangeChange({ startDate: new Date(e.target.value) })}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Конец периода</label>
                    <input 
                      type="date" 
                      value={dateRange.endDate.toISOString().split('T')[0]}
                      onChange={(e) => handleDateRangeChange({ endDate: new Date(e.target.value) })}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowDatePicker(false)}
                    className="px-3 py-1.5 rounded-md text-sm bg-gray-700 text-gray-300"
                  >
                    Отмена
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      refreshDataWithDateRange(dateRange);
                      setShowDatePicker(false);
                    }}
                    className="px-3 py-1.5 rounded-md text-sm bg-blue-600 text-white"
                  >
                    Применить
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Индикатор выбранного периода */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 flex items-center bg-blue-900/30 rounded-lg p-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-blue-200 text-sm">
          Данные за период: <strong>{getDateRangeLabel()}</strong>
        </span>
      </motion.div>
      
      {/* Навигационный путь */}
      {(selectedModel || selectedDealer) && (
        <div className="mb-6 bg-gray-800/80 p-3 rounded-lg flex items-center flex-wrap">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSelectedModel(null);
              setSelectedDealer(null);
              setView('models');
              setViewMode('general');
            }}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Все модели
          </motion.button>
          
          {selectedModel && (
            <>
              <span className="mx-2 text-gray-500">/</span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedDealer(null);
                  setView('dealers');
                  setViewMode('general');
                }}
                className="text-blue-400 hover:text-blue-300 transition-colors"
                style={{ color: selectedModel.color }}
              >
                {selectedModel.name}
              </motion.button>
            </>
          )}
          
          {selectedDealer && (
            <>
              <span className="mx-2 text-gray-500">/</span>
              <span className="text-gray-300">{selectedDealer.dealerName}</span>
            </>
          )}
          
          {viewMode === 'payments' && (
            <>
              <span className="mx-2 text-gray-500">/</span>
              <span className="text-yellow-300">Платежи и возвраты</span>
            </>
          )}
        </div>
      )}
      

      {view === 'models' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold mb-6 text-white">Каталог моделей автомобилей</h2>
          
          {/* Карточки моделей автомобилей */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {modelCards.map((model, index) => (
              <motion.div
                key={model.id}
                initial={animateCards ? { opacity: 0, y: 20 } : false}
                animate={animateCards ? { opacity: 1, y: 0 } : false}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.03, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)' }}
                className="bg-gray-800 rounded-lg overflow-hidden shadow-lg cursor-pointer"
                onClick={() => handleModelClick(model)}
                onAnimationComplete={() => index === modelCards.length - 1 && setAnimateCards(false)}
              >
                <div className="relative h-40 bg-gradient-to-br from-gray-700 to-gray-900 overflow-hidden">
                  {model.img && (
                    <img 
                      src={model.img} 
                      alt={model.name} 
                      className="w-full h-full object-contain p-2"
                    />
                    )}
                 <div className="absolute top-2 right-2 bg-gray-900/70 rounded-full px-2 py-1 text-xs">
                   {model.category === 'suv' && 'Внедорожник'}
                   {model.category === 'sedan' && 'Седан'}
                   {model.category === 'minivan' && 'Минивэн'}
                 </div>
               </div>
               <div className="p-4">
                 <h3 className="text-lg font-bold" style={{ color: model.color }}>{model.name}</h3>
                 <div className="flex justify-between items-center mt-2">
                   <div className="text-gray-400 text-sm">Продажи</div>
                   <div className="text-white font-bold">{model.totalSales.toLocaleString()}</div>
                 </div>
                 <div className="mt-3 w-full bg-gray-700 rounded-full h-1.5">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${(model.totalSales / Math.max(...data.modelData.map(m => m.totalSales))) * 100}%` }}
                     transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
                     className="h-full rounded-full"
                     style={{ backgroundColor: model.color }}
                   />
                 </div>
               </div>
               <div className="p-4 bg-gray-900/50 border-t border-gray-700 flex justify-between items-center">
                 <button className="text-xs text-gray-400 hover:text-white transition-colors">
                   Подробнее
                 </button>
                 <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                   Рейтинг: {Math.floor(model.totalSales / 100)}
                 </span>
               </div>
             </motion.div>
           ))}
         </div>
         
         <h2 className="text-2xl font-bold mb-6 text-white">Общие продажи по моделям</h2>
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Основной график */}
           <div className="bg-gray-800 p-4 rounded-lg shadow-md">
             <div ref={modelChartRef} className="w-full h-full"></div>
             <p className="text-center text-gray-400 mt-2">Нажмите на элемент для просмотра продаж по дилерам</p>
           </div>
           
           {/* Дополнительный график */}
           <div className="bg-gray-800 p-4 rounded-lg shadow-md">
             <div ref={modelSecondaryChartRef} className="w-full h-full"></div>
           </div>
         </div>
         
         {/* Тренд */}
         <div className="mt-6 bg-gray-800 p-4 rounded-lg shadow-md">
           <div ref={trendChartRef} className="w-full h-full"></div>
         </div>
       </motion.div>
     )}
     
     {/* Уровень дилеров */}
     {view === 'dealers' && (
       <motion.div 
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         className="mb-8"
       >
         <div className="flex flex-col md:flex-row gap-6 mb-8">
           {/* Информация о модели */}
           <motion.div 
             initial={animateCards ? { opacity: 0, x: -20 } : false}
             animate={animateCards ? { opacity: 1, x: 0 } : false}
             transition={{ duration: 0.5 }}
             onAnimationComplete={() => setAnimateCards(false)}
             className="bg-gray-800 p-4 rounded-lg shadow-md md:w-1/3"
           >
             <div className="relative h-40 bg-gradient-to-br from-gray-700 to-gray-900 rounded-md overflow-hidden mb-4">
               {selectedModel && selectedModel.img && (
                 <img 
                   src={selectedModel.img} 
                   alt={selectedModel.name} 
                   className="w-full h-full object-contain p-2"
                 />
               )}
             </div>
             
             <h2 className="text-2xl font-bold mb-4" style={{ color: selectedModel?.color }}>
               {selectedModel ? selectedModel.name : ''}
             </h2>
             
             <div className="space-y-3">
               <div className="flex justify-between items-center">
                 <span className="text-gray-400">Всего продаж</span>
                 <span className="text-white font-bold">
                   {selectedModel ? selectedModel.totalSales.toLocaleString() : 0}
                 </span>
               </div>
               
               <div className="flex justify-between items-center">
                 <span className="text-gray-400">Категория</span>
                 <span className="text-white">
                   {selectedModel?.category === 'suv' && 'Внедорожник'}
                   {selectedModel?.category === 'sedan' && 'Седан'}
                   {selectedModel?.category === 'minivan' && 'Минивэн'}
                 </span>
               </div>
               
               <div className="flex justify-between items-center">
                 <span className="text-gray-400">Дилеров</span>
                 <span className="text-white">{filteredDealerData.length}</span>
               </div>
               
               <div className="flex justify-between items-center">
                 <span className="text-gray-400">Средние продажи на дилера</span>
                 <span className="text-white">
                   {filteredDealerData.length > 0 
                     ? Math.round(filteredDealerData.reduce((sum, d) => sum + d.sales, 0) / filteredDealerData.length).toLocaleString()
                     : 0}
                 </span>
               </div>
             </div>
             
             <div className="mt-4">
               <motion.button
                 whileHover={{ scale: 1.03 }}
                 whileTap={{ scale: 0.98 }}
                 onClick={handleBackClick}
                 className="w-full py-2 rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
               >
                 Вернуться к моделям
               </motion.button>
             </div>
           </motion.div>
           
           {/* Дилеры в виде карточек с пагинацией */}
           <div className="md:w-2/3 space-y-4">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-xl font-bold text-white">Дилеры {selectedModel?.name}</h3>
               <div className="text-sm text-gray-400">
                 Всего дилеров: {filteredDealerData.length}
               </div>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {paginatedDealers.map((dealer, index) => {
                 // Находим данные о платежах для этого дилера
                 const paymentInfo = data.paymentData.find(
                   p => p.modelId === selectedModel.id && p.dealerId === dealer.dealerId
                 );
                 
                 return (
                   <motion.div
                     key={dealer.dealerId}
                     initial={animateCards ? { opacity: 0, y: 20 } : false}
                     animate={animateCards ? { opacity: 1, y: 0 } : false}
                     transition={{ delay: index * 0.1 }}
                     whileHover={{ scale: 1.03, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)' }}
                     className="bg-gray-800 rounded-lg overflow-hidden shadow-lg cursor-pointer"
                     onClick={() => handleDealerClick(dealer)}
                     onAnimationComplete={() => index === paginatedDealers.length - 1 && setAnimateCards(false)}
                   >
                     <div className="p-4 border-l-4" style={{ borderColor: selectedModel?.color }}>
                       <div className="flex justify-between">
                         <h3 className="text-lg font-bold text-white">{dealer.dealerName}</h3>
                         <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                           ID: {dealer.dealerId}
                         </span>
                       </div>
                       <div className="flex justify-between items-center mt-2">
                         <div className="text-gray-400 text-sm">Продажи</div>
                         <div className="text-white font-bold">{dealer.sales.toLocaleString()}</div>
                       </div>
                       <div className="mt-3 w-full bg-gray-700 rounded-full h-1.5">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${(dealer.sales / Math.max(...filteredDealerData.map(d => d.sales))) * 100}%` }}
                           transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                           className="h-full rounded-full"
                           style={{ backgroundColor: selectedModel?.color }}
                         />
                       </div>
                       
                       {/* Информация о продажах и возвратах в одном блоке */}
                       <div className="mt-4 grid grid-cols-2 gap-3">
                         <div className="bg-gray-900/50 rounded p-2">
                           <div className="text-xs text-gray-400">Продажи</div>
                           <div className="text-lg font-bold text-white">{dealer.sales}</div>
                         </div>
                         <div className="bg-gray-900/50 rounded p-2">
                           <div className="text-xs text-gray-400">Возвраты</div>
                           <div className="text-lg font-bold text-red-500">{paymentInfo?.returnedCars || 0}</div>
                         </div>
                       </div>
                       
                       {/* Детальная информация о возвратах */}
                       {paymentInfo && paymentInfo.returnedCars > 0 && (
                         <div className="mt-3 flex items-center">
                           <div className="text-xs px-2 py-1 rounded-full bg-red-900/50 text-red-300 flex items-center space-x-1">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                             </svg>
                             <span>Возвраты: {paymentInfo.returnedCars}</span>
                           </div>
                           <div className="flex-grow text-right text-xs text-red-300">
                             {formatCurrency(paymentInfo.returnedAmount)}
                           </div>
                         </div>
                       )}
                     </div>
                   </motion.div>
                 );
               })}
             </div>
             
             {/* Пагинация */}
             {totalPages > 1 && (
               <div className="flex justify-between items-center mt-6 px-4 py-3 bg-gray-800 rounded-lg">
                 <button
                   onClick={handlePrevPage}
                   disabled={currentPage === 1}
                   className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-700 text-gray-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                 >
                   Назад
                 </button>
                 
                 <div className="text-gray-300">
                   Страница {currentPage} из {totalPages}
                 </div>
                 
                 <button
                   onClick={handleNextPage}
                   disabled={currentPage === totalPages}
                   className={`px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-700 text-gray-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                 >
                   Вперед
                 </button>
               </div>
             )}
           </div>
         </div>
         
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Основной график */}
           <div className="bg-gray-800 p-4 rounded-lg shadow-md">
             <div ref={dealerChartRef} className="w-full h-full"></div>
             <p className="text-center text-gray-400 mt-2">Нажмите на элемент для просмотра продаж по продавцам</p>
           </div>
           
           {/* Дополнительный график - теперь показывает статус платежей */}
           <div className="bg-gray-800 p-4 rounded-lg shadow-md">
             <div ref={dealerSecondaryChartRef} className="w-full h-full"></div>
             <p className="text-center text-gray-400 mt-2">Сравнение продаж и возвратов по дилерам</p>
           </div>
         </div>
       </motion.div>
     )}
     
     {/* Уровень продавцов / платежей */}
     {view === 'salespeople' && (
       <motion.div 
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         className="mb-8"
       >
         <div className="flex flex-col md:flex-row gap-6 mb-8">
           {/* Инфо о дилере и модели */}
           <motion.div 
             initial={animateCards ? { opacity: 0, x: -20 } : false}
             animate={animateCards ? { opacity: 1, x: 0 } : false}
             transition={{ duration: 0.5 }}
             onAnimationComplete={() => setAnimateCards(false)}
             className="bg-gray-800 p-4 rounded-lg shadow-md md:w-1/3"
           >
             <div className="relative h-32 bg-gradient-to-br from-gray-700 to-gray-900 rounded-md overflow-hidden mb-4">
               {selectedModel && selectedModel.img && (
                 <img 
                   src={selectedModel.img} 
                   alt={selectedModel.name} 
                   className="w-full h-full object-contain p-2"
                 />
               )}
             </div>
             
             <h3 className="text-xl font-bold mb-1" style={{ color: selectedModel?.color }}>
               {selectedModel ? selectedModel.name : ''}
             </h3>
             
             <h2 className="text-2xl font-bold mb-4 text-white">
               {selectedDealer ? selectedDealer.dealerName : ''}
             </h2>
             
             {/* Сводная информация по продажам и возвратам (общая для обоих режимов) */}
             <div className="grid grid-cols-2 gap-3 mb-4">
               <div className="bg-gray-900/50 rounded p-3">
                 <div className="text-sm text-gray-400">Продажи</div>
                 <div className="text-xl font-bold text-white">{selectedDealer?.sales || 0}</div>
               </div>
               <div className="bg-gray-900/50 rounded p-3">
                 <div className="text-sm text-gray-400">Возвраты</div>
                 <div className="text-xl font-bold text-red-500">
                   {filteredPaymentData?.returnedCars || 0}
                 </div>
               </div>
             </div>
             
             <div className="space-y-3">
               {viewMode === 'general' ? (
                 <>
                   <div className="flex justify-between items-center">
                     <span className="text-gray-400">Продавцов</span>
                     <span className="text-white">{filteredSalespersonData.length}</span>
                   </div>
                   
                   <div className="flex justify-between items-center">
                     <span className="text-gray-400">Средние продажи на продавца</span>
                     <span className="text-white">
                       {filteredSalespersonData.length > 0 
                         ? Math.round(filteredSalespersonData.reduce((sum, d) => sum + d.sales, 0) / filteredSalespersonData.length).toLocaleString()
                         : 0}
                     </span>
                   </div>
                 </>
               ) : (
                 <>
                   {filteredPaymentData && (
                     <>
                       <div className="flex justify-between items-center">
                         <span className="text-gray-400">Оплачено полностью</span>
                         <div className="flex items-center">
                           <span className="text-green-400 font-medium mr-2">{filteredPaymentData.paidCars}</span>
                           <span className="text-white text-xs">{formatCurrency(filteredPaymentData.paidAmount)}</span>
                         </div>
                       </div>
                       
                       <div className="flex justify-between items-center">
                         <span className="text-gray-400">Возвращено</span>
                         <div className="flex items-center">
                           <span className="text-red-400 font-medium mr-2">{filteredPaymentData.returnedCars}</span>
                           <span className="text-white text-xs">{formatCurrency(filteredPaymentData.returnedAmount)}</span>
                         </div>
                       </div>
                       
                       <div className="flex justify-between items-center">
                         <span className="text-gray-400">Частичная оплата</span>
                         <div className="flex items-center">
                           <span className="text-yellow-400 font-medium mr-2">{filteredPaymentData.pendingCars}</span>
                           <span className="text-white text-xs">{formatCurrency(filteredPaymentData.pendingAmount)}</span>
                         </div>
                       </div>
                     </>
                   )}
                 </>
               )}
             </div>
             
             <div className="mt-4 space-y-2">
               <motion.button
                 whileHover={{ scale: 1.03 }}
                 whileTap={{ scale: 0.98 }}
                 onClick={handleBackClick}
                 className="w-full py-2 rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
               >
                 Вернуться к дилерам
               </motion.button>
               
               <motion.button
                 whileHover={{ scale: 1.03 }}
                 whileTap={{ scale: 0.98 }}
                 onClick={() => {
                   setSelectedModel(null);
                   setSelectedDealer(null);
                   setView('models');
                   setViewMode('general');
                 }}
                 className="w-full py-2 rounded-md bg-gray-700/50 text-gray-400 hover:bg-gray-700 transition-colors"
               >
                 К списку моделей
               </motion.button>
               
               {/* Кнопка переключения режима */}
               <motion.button
                 whileHover={{ scale: 1.03 }}
                 whileTap={{ scale: 0.98 }}
                 onClick={toggleViewMode}
                 className="w-full py-2 rounded-md bg-blue-600/70 text-white hover:bg-blue-600 transition-colors flex items-center justify-center"
               >
                 {viewMode === 'general' ? (
                   <>
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                     Показать платежи и возвраты
                   </>
                 ) : (
                   <>
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                     </svg>
                     Показать продавцов
                   </>
                 )}
               </motion.button>
             </div>
           </motion.div>
           
           {/* Список продавцов или платежные карточки */}
           <div className="md:w-2/3">
             {viewMode === 'general' ? (
               <>
                 <div className="flex justify-between items-center mb-4">
                   <h3 className="text-xl font-bold text-white">Топ-5 продавцов {selectedDealer?.dealerName}</h3>
                   <div className="text-sm text-gray-400">
                     Всего продавцов: {filteredSalespersonData.length}
                   </div>
                 </div>
                 
                 <div className="bg-gray-800 rounded-lg p-4 mb-4">
                   <div className="grid grid-cols-1 gap-3">
                     {topSalespeople.map((salesperson, index) => (
                       <motion.div
                         key={salesperson.salespersonId}
                         initial={animateCards ? { opacity: 0, y: 10 } : false}
                         animate={animateCards ? { opacity: 1, y: 0 } : false}
                         transition={{ delay: index * 0.1 }}
                         className="bg-gray-900/70 rounded-lg p-3 flex items-center"
                         onAnimationComplete={() => index === topSalespeople.length - 1 && setAnimateCards(false)}
                       >
                         <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold mr-3" 
                              style={{ backgroundColor: `${selectedModel?.color}20` }}>
                           {salesperson.salespersonName.split(' ').map(n => n[0]).join('')}
                         </div>
                         
                         <div className="flex-grow">
                           <div className="flex justify-between items-center">
                             <h4 className="text-lg font-bold text-white">{salesperson.salespersonName}</h4>
                             <span className="px-2 py-1 rounded text-xs" 
                                   style={{ backgroundColor: `${selectedModel?.color}20`, color: selectedModel?.color }}>
                               {index === 0 ? '🏆 Лучший продавец' : `#${index + 1}`}
                             </span>
                           </div>
                           
                           <div className="flex items-center mt-1">
                             <div className="text-gray-400 text-sm">Продажи:</div>
                             <div className="text-white font-bold ml-2">{salesperson.sales.toLocaleString()}</div>
                             
                             <div className="ml-auto flex items-center">
                               <div className="h-2 w-24 bg-gray-700 rounded-full mr-2">
                                 <motion.div 
                                   initial={{ width: 0 }}
                                   animate={{ width: `${(salesperson.sales / Math.max(...filteredSalespersonData.map(d => d.sales))) * 100}%` }}
                                   transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                                   className="h-full rounded-full"
                                   style={{ backgroundColor: selectedModel?.color }}
                                 />
                               </div>
                               <span className="text-xs text-gray-400">
                                 {Math.round((salesperson.sales / filteredSalespersonData.reduce((sum, d) => sum + d.sales, 0)) * 100)}%
                               </span>
                             </div>
                           </div>
                         </div>
                       </motion.div>
                     ))}
                   </div>
                   
                   {/* Кнопка для просмотра всех продавцов */}
                   {filteredSalespersonData.length > 5 && (
                     <motion.button
                       whileHover={{ scale: 1.02 }}
                       whileTap={{ scale: 0.98 }}
                       className="w-full mt-3 py-2 bg-gray-700/50 text-gray-300 rounded hover:bg-gray-700 transition-colors text-sm"
                     >
                       Показать всех продавцов ({filteredSalespersonData.length - 5} ещё)
                     </motion.button>
                   )}
                 </div>
                 
                 {/* Распределение продаж по времени */}
                 <div className="bg-gray-800 rounded-lg p-4">
                   <h3 className="text-lg font-bold text-white mb-3">Динамика продаж</h3>
                   
                   <div className="grid grid-cols-12 gap-2 mb-2">
                     {Array.from({ length: 12 }).map((_, index) => {
                       const month = new Date();
                       month.setMonth(month.getMonth() - 11 + index);
                       const monthName = month.toLocaleString('ru', { month: 'short' });
                       
                       // Генерируем случайные продажи для месяца
                       const sales = Math.floor(Math.random() * (selectedDealer?.sales / 6)) + 1;
                       const height = `${(sales / (selectedDealer?.sales / 3)) * 100}%`;
                       
                       return (
                         <div key={index} className="flex flex-col h-32 justify-end">
                           <div 
                             className="rounded-t w-full transition-all duration-700" 
                             style={{ 
                               height, 
                               backgroundColor: index === 11 ? selectedModel?.color : `${selectedModel?.color}80` 
                             }}
                           />
                           <div className="text-xs text-gray-500 text-center mt-1">{monthName}</div>
                         </div>
                       );
                     })}
                   </div>
                   
                   <div className="text-center text-xs text-gray-500 mt-1">
                     Последние 12 месяцев
                   </div>
                 </div>
               </>
             ) : (
               <>
                 <h3 className="text-xl font-bold text-white mb-4">Статус платежей и возвратов</h3>
                 {filteredPaymentData && (
                   <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg p-4 mb-4">
                     <div className="grid grid-cols-3 gap-4 mb-4">
                       <div className="bg-gray-900/50 p-3 rounded-lg border border-green-900/30">
                         <div className="text-sm text-gray-400">Оплачено полностью</div>
                         <div className="text-xl font-bold text-green-400 mt-1">{filteredPaymentData.paidCars}</div>
                         <div className="text-xs text-gray-500">{formatCurrency(filteredPaymentData.paidAmount)}</div>
                       </div>
                       <div className="bg-gray-900/50 p-3 rounded-lg border border-red-900/30">
                         <div className="text-sm text-gray-400">Возвращено</div>
                         <div className="text-xl font-bold text-red-400 mt-1">{filteredPaymentData.returnedCars}</div>
                         <div className="text-xs text-gray-500">{formatCurrency(filteredPaymentData.returnedAmount)}</div>
                       </div>
                       <div className="bg-gray-900/50 p-3 rounded-lg border border-yellow-900/30">
                         <div className="text-sm text-gray-400">Частичная оплата</div>
                         <div className="text-xl font-bold text-yellow-400 mt-1">{filteredPaymentData.pendingCars}</div>
                         <div className="text-xs text-gray-500">{formatCurrency(filteredPaymentData.pendingAmount)}</div>
                       </div>
                     </div>
                     
                     <div className="flex flex-col space-y-3 mb-4">
                       <div>
                         <div className="flex justify-between text-sm mb-1">
                           <span className="text-gray-400">Общая стоимость автомобилей</span>
                           <span className="text-white">{formatCurrency(filteredPaymentData.totalAmount)}</span>
                         </div>
                         <div className="w-full bg-gray-700 rounded-full h-2">
                           <div 
                             className="h-full rounded-full bg-blue-500"
                             style={{ width: '100%' }}
                           />
                         </div>
                       </div>
                       
                       <div>
                         <div className="flex justify-between text-sm mb-1">
                           <span className="text-gray-400">Оплачено полностью</span>
                           <span className="text-green-400">{formatCurrency(filteredPaymentData.paidAmount)}</span>
                         </div>
                         <div className="w-full bg-gray-700 rounded-full h-2">
                           <div 
                             className="h-full rounded-full bg-green-500"
                             style={{ width: `${(filteredPaymentData.paidAmount / filteredPaymentData.totalAmount) * 100}%` }}
                           />
                         </div>
                       </div>
                       
                       <div>
                         <div className="flex justify-between text-sm mb-1">
                           <span className="text-gray-400">Частичная оплата</span>
                           <span className="text-yellow-400">{formatCurrency(filteredPaymentData.pendingAmount)}</span>
                         </div>
                         <div className="w-full bg-gray-700 rounded-full h-2">
                           <div 
                             className="h-full rounded-full bg-yellow-500"
                             style={{ width: `${(filteredPaymentData.pendingAmount / filteredPaymentData.totalAmount) * 100}%` }}
                           />
                         </div>
                       </div>
                       
                       <div>
                         <div className="flex justify-between text-sm mb-1">
                           <span className="text-gray-400">Возвращено</span>
                           <span className="text-red-400">{formatCurrency(filteredPaymentData.returnedAmount)}</span>
                         </div>
                         <div className="w-full bg-gray-700 rounded-full h-2">
                           <div 
                             className="h-full rounded-full bg-red-500"
                             style={{ width: `${(filteredPaymentData.returnedAmount / filteredPaymentData.totalAmount) * 100}%` }}
                           />
                         </div>
                       </div>
                     </div>
                     
                     <p className="text-xs text-gray-500 bg-gray-900/30 p-2 rounded">
                       Суммы указаны в узбекских сумах (UZS). Данные актуальны на {new Date().toLocaleDateString('ru-RU')}.
                     </p>
                   </div>
                 )}
                 
                 {/* Здесь будет детальная таблица транзакций */}
                 <div ref={dealerPaymentsChartRef} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg"></div>
               </>
             )}
           </div>
         </div>
         
         <h2 className="text-2xl font-bold mb-6 text-white" style={{ color: selectedModel?.color }}>
           {selectedModel && selectedDealer ? 
             `${selectedModel.name} - ${viewMode === 'general' ? 'Продажи' : 'Финансы'} в ${selectedDealer.dealerName}` : ''}
         </h2>
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Основной график */}
           <div className="bg-gray-800 p-4 rounded-lg shadow-md">
             <div ref={salespersonChartRef} className="w-full h-full"></div>
           </div>
           
           <div className="bg-gray-800 p-4 rounded-lg shadow-md">
             <div ref={salespersonSecondaryChartRef} className="w-full h-full"></div>
           </div>
         </div>
       </motion.div>
     )}
   </div>
   
   {/* Плавающая кнопка для быстрого выбора периода */}
   <motion.div 
     className="fixed bottom-6 right-6 z-10"
     whileHover={{ scale: 1.05 }}
     whileTap={{ scale: 0.95 }}
   >
     <button 
       onClick={() => setShowDatePicker(!showDatePicker)}
       className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-colors"
     >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </button>
  </motion.div>
  
  {/* Плавающая кнопка для переключения режима просмотра */}
  {view === 'salespeople' && (
    <motion.div 
      className="fixed bottom-6 right-24 z-10"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <button 
        onClick={toggleViewMode}
        className={`${viewMode === 'payments' ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-colors`}
      >
        {viewMode === 'general' ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        )}
      </button>
    </motion.div>
  )}
  
  <style jsx>{`
    .bg-clip-text {
      -webkit-background-clip: text;
      background-clip: text;
    }

    .text-transparent {
      color: transparent;
    }
  `}</style>
</div>
);
}