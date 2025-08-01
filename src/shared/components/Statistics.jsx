"use client";

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { D3Visualizer } from '../../utils/dataVisualizer';
import * as d3 from 'd3';
import { carModels } from '../../shared/mocks/mock-data';
import ContentReadyLoader from '../../shared/layout/ContentReadyLoader';
import { useTranslation } from "../../hooks/useTranslation";
import { statisticsTranslations } from '../../shared/components/locales/Statistics';
import { useThemeStore } from '../../store/theme';
import { axiosInstance } from '../../utils/axiosConfig';

export default function Statistics() {
  // State variables
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState('models');
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [chartType, setChartType] = useState('bar');
  const [animateCards, setAnimateCards] = useState(true);
  const [showAllSalespeople, setShowAllSalespeople] = useState(false);
  const [hoveredSalesperson, setHoveredSalesperson] = useState(null);
  
  const [data, setData] = useState({
    modelData: [],
    dealerData: [],
    salespersonData: [],
    trendData: [],
    paymentData: []
  });
  
  const { t } = useTranslation(statisticsTranslations);
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';
  
  // Режим просмотра детализации платежей
  const [viewMode, setViewMode] = useState('general');
  
  // Период времени - состояние
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1),
    endDate: new Date(),
    preset: 'thisYear'
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

  // Цветовая схема для темной темы
  const getThemedColor = (baseColor, variant = 'base') => {
    if (!isDark) return baseColor;
    
    // Адаптация цветов для темной темы
const colorMap = {
  '#8b5cf6': { base: '#a78bfa', light: '#c4b5fd', dark: '#7c3aed' }, // purple основной
  '#7c3aed': { base: '#8b5cf6', light: '#a78bfa', dark: '#6d28d9' }, // purple темный
  '#a78bfa': { base: '#c084fc', light: '#d8b4fe', dark: '#8b5cf6' }, // purple светлый
  '#10b981': { base: '#34d399', light: '#6ee7b7', dark: '#059669' }, // green (оставляем)
  '#c084fc': { base: '#d8b4fe', light: '#e9d5ff', dark: '#a855f7' }, // purple-300
  '#6366f1': { base: '#818cf8', light: '#a5b4fc', dark: '#4f46e5' }, // indigo
};
    
    const colors = colorMap[baseColor];
    if (!colors) return baseColor;
    
    switch (variant) {
      case 'light': return colors.light;
      case 'dark': return colors.dark;
      default: return colors.base;
    }
  };

  // Функция для получения стилей графиков в зависимости от темы
  const getChartStyles = () => ({
    backgroundColor: isDark ? '#1f2937' : '#ffffff',
    textColor: isDark ? '#f9fafb' : '#1f2937',
    gridColor: isDark ? '#374151' : '#e5e7eb',
    secondaryTextColor: isDark ? '#9ca3af' : '#6b7280',
    borderRadius: '0.5rem',
    tooltipBackground: isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(31, 41, 55, 0.9)',
    tooltipText: '#ffffff'
  });

  // Получаем данные за выбранный период
const fetchMarketData = async (startDate, endDate) => {
  setIsLoading(true);
  
  try {
    const formatDateForApi = (date) => {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    };

    const requestBody = {
      url: '/b/dashboard/infos&auto_statistics',
      begin_date: formatDateForApi(startDate),
      end_date: formatDateForApi(endDate)
    };

    console.log('Отправляем запрос с данными:', requestBody);

    const token = localStorage.getItem('authToken');

    const response = await axiosInstance.post('https://uzavtoanalytics.uz/dashboard/proxy', requestBody, {
      headers: {
        'X-Auth': `Bearer ${token}`
      }
    });

    const apiData = response.data;
    console.log('Получены данные с сервера:', apiData);
    
    window.originalApiData = apiData;
    
    const transformedData = transformApiData(apiData);
    
    setData(transformedData);
    setIsLoading(false);
    
    return apiData;
  } catch (error) {
    console.error('Ошибка при получении данных рынка:', error);
    const fallbackData = generateDemoData(dateRange.startDate, dateRange.endDate);
    setData(fallbackData);
    setIsLoading(false);
    return null;
  }
};
  
  const transformApiData = (apiData) => {
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];
    
    const modelsWithModifications = apiData.filter(model => {
      if (!model.filter_by_month || !model.filter_by_month.length) {
        return false;
      }
      
      for (const monthData of model.filter_by_month) {
        if (!monthData.dealers || !monthData.dealers.length) {
          continue;
        }
        
        for (const dealer of monthData.dealers) {
          if (!dealer.user_list || !dealer.user_list.length) {
            continue;
          }
          
          for (const user of dealer.user_list) {
            if (parseInt(user.contract) > 0) {
              return true;
            }
          }
        }
      }
      
      return false;
    });
    
    const modelData = modelsWithModifications.map((model, index) => {
      return {
        id: model.model_id,
        name: model.model_name,
        color: colors[index % colors.length],
        img: model.photo_sha ? `https://uzavtosalon.uz/b/core/m$load_image?sha=${model.photo_sha}&width=400&height=400` : null,
        category: getCategoryFromName(model.model_name),
        totalSales: calculateTotalSales(model)
      };
    });
    
    const dealerData = [];
    modelsWithModifications.forEach(model => {
      if (model.filter_by_month && model.filter_by_month.length) {
        model.filter_by_month.forEach(monthData => {
          if (monthData.dealers && monthData.dealers.length) {
            monthData.dealers.forEach(dealer => {
              const sales = calculateDealerSales(dealer);
              
              dealerData.push({
                modelId: model.model_id,
                dealerId: dealer.dealer_id,
                dealerName: dealer.dealer_name,
                modelName: model.model_name,
                sales: sales,
                color: modelData.find(m => m.id === model.model_id)?.color || '#3b82f6'
              });
            });
          }
        });
      }
    });
    
    const aggregatedDealerData = aggregateDealerData(dealerData);
    
    const salespersonMap = new Map();
    modelsWithModifications.forEach(model => {
      if (model.filter_by_month && model.filter_by_month.length) {
        model.filter_by_month.forEach(monthData => {
          if (monthData.dealers && monthData.dealers.length) {
            monthData.dealers.forEach(dealer => {
              if (dealer.user_list && dealer.user_list.length) {
                dealer.user_list.forEach(user => {
                  const key = `${model.model_id}-${dealer.dealer_id}-${user.user_id}-${user.user_name}`;
                  
                  const salesPersonData = {
                    modelId: model.model_id,
                    dealerId: dealer.dealer_id,
                    salespersonId: user.user_id,
                    salespersonName: user.user_name,
                    modelName: model.model_name,
                    dealerName: dealer.dealer_name,
                    sales: parseInt(user.contract) || 0,
                    color: modelData.find(m => m.id === model.model_id)?.color || '#3b82f6'
                  };
                  
                  if (salespersonMap.has(key)) {
                    const existingPerson = salespersonMap.get(key);
                    existingPerson.sales += salesPersonData.sales;
                  } else {
                    salespersonMap.set(key, salesPersonData);
                  }
                });
              }
            });
          }
        });
      }
    });
    
    const salespersonData = Array.from(salespersonMap.values());
    
    const trendData = generateTrendDataFromApi(modelsWithModifications);
    
    const paymentData = generatePaymentDataFromDealers(aggregatedDealerData);
    
    return {
      modelData,
      dealerData: aggregatedDealerData,
      salespersonData,
      trendData,
      paymentData
    };
  };
  
  // Вспомогательные функции для трансформации данных
  const getCategoryFromName = (modelName) => {
    const nameLower = modelName.toLowerCase();
    if (nameLower.includes('tahoe')) return 'suv';
    if (nameLower.includes('cobalt') || nameLower.includes('nexia')) return 'sedan';
    return 'sedan';
  };
  
  const calculateTotalSales = (model) => {
    let totalSales = 0;
    
    if (model.filter_by_month && model.filter_by_month.length) {
      model.filter_by_month.forEach(monthData => {
        if (monthData.dealers && monthData.dealers.length) {
          monthData.dealers.forEach(dealer => {
            if (dealer.user_list && dealer.user_list.length) {
              dealer.user_list.forEach(user => {
                totalSales += parseInt(user.contract) || 0;
              });
            }
          });
        }
      });
    }
    
    return totalSales;
  };
  
  const calculateDealerSales = (dealer) => {
    let sales = 0;
    
    if (dealer.user_list && dealer.user_list.length) {
      dealer.user_list.forEach(user => {
        sales += parseInt(user.contract) || 0;
      });
    }
    
    return sales;
  };
  
  const aggregateDealerData = (dealerData) => {
    const dealerMap = new Map();
    
    dealerData.forEach(dealer => {
      const key = `${dealer.modelId}-${dealer.dealerId}`;
      
      if (dealerMap.has(key)) {
        const existing = dealerMap.get(key);
        existing.sales += dealer.sales;
      } else {
        dealerMap.set(key, {...dealer});
      }
    });
    
    return Array.from(dealerMap.values());
  };
  
  const generateTrendDataFromApi = (apiData) => {
    const trendData = [];
    
    const salesByMonth = new Map();
    
    apiData.forEach(model => {
      if (model.filter_by_month && model.filter_by_month.length) {
        model.filter_by_month.forEach(monthData => {
          const month = monthData.month;
          let monthlySales = salesByMonth.get(month) || 0;
          
          if (monthData.dealers && monthData.dealers.length) {
            monthData.dealers.forEach(dealer => {
              if (dealer.user_list && dealer.user_list.length) {
                dealer.user_list.forEach(user => {
                  monthlySales += parseInt(user.contract) || 0;
                });
              }
            });
          }
          
          salesByMonth.set(month, monthlySales);
        });
      }
    });
    
    for (const [month, sales] of salesByMonth.entries()) {
      trendData.push({
        date: month,
        sales: sales
      });
    }
    
    trendData.sort((a, b) => a.date.localeCompare(b.date));
    
    return trendData;
  };
  
  const generatePaymentDataFromDealers = (dealerData) => {
    return dealerData.map(dealer => {
      const totalCars = dealer.sales;
      const paidCars = Math.floor(totalCars * (0.7 + Math.random() * 0.2));
      const returnedCars = Math.floor((totalCars - paidCars) * (Math.random() * 0.8));
      const pendingCars = totalCars - paidCars - returnedCars;
      
      const paidAmount = paidCars * (Math.random() * 25000 + 75000);
      const returnedAmount = returnedCars * (Math.random() * 20000 + 60000);
      const pendingAmount = pendingCars * (Math.random() * 15000 + 80000);
      
      return {
        modelId: dealer.modelId,
        modelName: dealer.modelName,
        dealerId: dealer.dealerId,
        dealerName: dealer.dealerName,
        totalCars: totalCars,
        paidCars: paidCars,
        returnedCars: returnedCars,
        pendingCars: pendingCars,
        paidAmount: paidAmount,
        returnedAmount: returnedAmount,
        pendingAmount: pendingAmount,
        totalAmount: paidAmount + pendingAmount,
        transactions: Array.from({ length: totalCars }).map((_, i) => {
          const status = i < paidCars ? 'paid' : (i < paidCars + returnedCars ? 'returned' : 'pending');
          const carId = `CAR-${dealer.modelId}-${dealer.dealerId}-${i + 1}`;
          const carName = `${dealer.modelName} ${["Base", "Comfort", "Lux", "Premium"][Math.floor(Math.random() * 4)]}`;
          const paymentDate = new Date();
          paymentDate.setDate(paymentDate.getDate() - Math.floor(Math.random() * 90));
          
          const baseAmount = Math.floor(Math.random() * 30000 + 70000);
          let paymentAmount = baseAmount;
          let returnAmount = 0;
          let returnDate = null;
          
          if (status === 'returned') {
            returnDate = new Date(paymentDate);
            returnDate.setDate(paymentDate.getDate() + Math.floor(Math.random() * 30) + 5);
            returnAmount = Math.floor(baseAmount * (Math.random() * 0.5 + 0.5));
          } else if (status === 'pending') {
            paymentAmount = Math.floor(baseAmount * (Math.random() * 0.4 + 0.1));
          }
          
          return {
            id: `TRX-${dealer.modelId}-${dealer.dealerId}-${i + 1}`,
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
      };
    });
  };
  
  useEffect(() => {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const today = new Date();
    
    setDateRange({
      startDate: startOfYear,
      endDate: today,
      preset: 'thisYear'
    });
    
    fetchMarketData(startOfYear, today);
  }, []);
   const filteredDealerData = selectedModel
    ? data.dealerData.filter(d => d.modelId === selectedModel.id)
    : [];
  const getPaginatedDealers = () => {
    const sortedDealers = [...filteredDealerData].sort((a, b) => b.sales - a.sales);
    
    const start = (currentPage - 1) * dealersPerPage;
    return sortedDealers.slice(start, start + dealersPerPage);
  };
  
  const totalPages = Math.ceil(filteredDealerData.length / dealersPerPage);

 

  const filteredSalespersonData = (selectedModel && selectedDealer)
    ? data.salespersonData.filter(
        d => d.modelId === selectedModel.id && d.dealerId === selectedDealer.dealerId
      )
    : [];
    
  const getGlobalTopSalespeople = () => {
    const salesByPerson = new Map();
    
    data.salespersonData.forEach(person => {
      const isOnlineSalesperson = person.salespersonName.toLowerCase().includes('online') || 
                                 person.dealerName.toLowerCase().includes('online');
      
      const key = `${person.salespersonId}-${person.salespersonName}`;
      
      if (salesByPerson.has(key)) {
        const existingRecord = salesByPerson.get(key);
        existingRecord.totalSales += person.sales;
        existingRecord.isOnline = existingRecord.isOnline || isOnlineSalesperson;
        
        if ((!isOnlineSalesperson || existingRecord.dealers.length === 0) && 
            !existingRecord.dealers.some(d => d.dealerId === person.dealerId)) {
          
          const region = extractRegionFromDealerName(person.dealerName);
          
          existingRecord.dealers.push({
            dealerId: person.dealerId,
            dealerName: person.dealerName,
            region: region,
            sales: person.sales
          });
        } else if (existingRecord.dealers.some(d => d.dealerId === person.dealerId)) {
          const dealerRecord = existingRecord.dealers.find(d => d.dealerId === person.dealerId);
          dealerRecord.sales += person.sales;
        }
      } else {
        const region = extractRegionFromDealerName(person.dealerName);
        
        salesByPerson.set(key, {
          id: parseInt(person.salespersonId),
          name: person.salespersonName,
          totalSales: person.sales,
          isOnline: isOnlineSalesperson,
          dealers: isOnlineSalesperson ? [] : [{
            dealerId: person.dealerId,
            dealerName: person.dealerName,
            region: region,
            sales: person.sales
          }]
        });
      }
    });
    
    function extractRegionFromDealerName(dealerName) {
      const cityInBrackets = dealerName.match(/\(([^)]+)\)/);
      if (cityInBrackets && cityInBrackets[1]) return cityInBrackets[1].trim();
      
      const knownCities = ['Ташкент', 'Самарканд', 'Бухара', 'Андижан', 'Наманган', 'Фергана'];
      for (const city of knownCities) {
        if (dealerName.includes(city)) return city;
      }
      
      const cityPattern = /(?:г\.|город)\s+([А-Яа-я-]+)/i;
      const cityMatch = dealerName.match(cityPattern);
      if (cityMatch && cityMatch[1]) return cityMatch[1].trim();
      
      return '';
    }
    
    const allSalespeople = Array.from(salesByPerson.values()).map(person => {
      person.dealers.sort((a, b) => b.sales - a.sales);
      
      const mainDealer = person.dealers.length > 0 ? person.dealers[0] : null;
      
      const dealersByRegion = {};
      person.dealers.forEach(dealer => {
        if (!dealersByRegion[dealer.region]) {
          dealersByRegion[dealer.region] = [];
        }
        dealersByRegion[dealer.region].push(dealer);
      });
      
      return {
        ...person,
        mainDealer: mainDealer,
        dealersByRegion: dealersByRegion,
        hasMultipleDealers: person.dealers.length > 1
      };
    });
    
    return allSalespeople
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 10);
  };
  
  const getTopSalespeople = () => {
    if (!selectedDealer || !selectedModel) return [];
    
    return filteredSalespersonData
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
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
    setCurrentPage(1);
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
      setCurrentPage(1);
    }
  };
  
  const toggleViewMode = () => {
    setViewMode(viewMode === 'general' ? 'payments' : 'general');
  };
  
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
  
  const refreshDataWithDateRange = (range) => {
    fetchMarketData(range.startDate, range.endDate)
      .catch(error => {
        console.error('Ошибка при обновлении данных:', error);
        const fallbackData = generateDemoData(range.startDate, range.endDate);
        setData(fallbackData);
        setIsLoading(false);
      });
  };

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

  const formatDate = (date) => {
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', { 
      style: 'currency', 
      currency: 'UZS',
      maximumFractionDigits: 0,
      notation: 'compact'
    }).format(amount);
  };
  
  const getDateRangeLabel = () => {
    const { preset, startDate, endDate } = dateRange;
    
    switch(preset) {
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

    const dealers = Array.from({ length: 500 }).map((_, index) => ({
      id: index + 1,
      name: `${generateRandomDealerName()} #${index + 1}`
    }));

    const salespeople = [];
    dealers.forEach(dealer => {
      const salesPersonCount = Math.floor(Math.random() * 80) + 20;
      
      Array.from({ length: salesPersonCount }).forEach((_, spIndex) => {
        salespeople.push({
          id: salespeople.length + 1,
          name: generateRandomName(),
          dealerId: dealer.id
        });
      });
    });

    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const multiplier = Math.max(1, daysDiff / 180);
    
    const modelData = models.map(model => {
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
        const normalRandom = () => {
          let u = 0, v = 0;
          while(u === 0) u = Math.random();
          while(v === 0) v = Math.random();
          const std = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
          return std * 100 + 300;
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
      
      const pareto = [];
      const topPerformersCount = Math.max(1, Math.floor(dealerSalespeople.length * 0.2));
      
      dealerSalespeople.forEach((_, index) => {
        if (index < topPerformersCount) {
          pareto.push(0.8 / topPerformersCount);
        } else {
          pareto.push(0.2 / (dealerSalespeople.length - topPerformersCount));
        }
      });
      
      for (let i = pareto.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pareto[i], pareto[j]] = [pareto[j], pareto[i]];
      }
      
      dealerSalespeople.forEach((salesperson, index) => {
        const salesShare = pareto[index];
        let sales = Math.round(dealerRecord.sales * salesShare);
        
        if (index === dealerSalespeople.length - 1) {
          sales = remainingSales;
        } else {
          remainingSales -= sales;
        }
        
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

    const trendData = [];
    
    let interval = 1;
    if (daysDiff > 90) interval = 7;
    if (daysDiff > 365) interval = 30;
    
    for (let i = 0; i <= daysDiff; i += interval) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const monthFactor = 1 + 0.3 * Math.sin((date.getMonth() / 12) * Math.PI * 2);
      const trendFactor = 1 + (i / daysDiff) * 0.2;
      
      trendData.push({
        date: date.toISOString().slice(0, 10),
        sales: Math.floor((Math.random() * 400 + 100) * monthFactor * trendFactor)
      });
    }
    
    const paymentData = [];
    dealerData.forEach(dealerRecord => {
      const totalCars = dealerRecord.sales;
      const paidCars = Math.floor(totalCars * (0.7 + Math.random() * 0.2));
      const returnedCars = Math.floor((totalCars - paidCars) * (Math.random() * 0.8));
      const pendingCars = totalCars - paidCars - returnedCars;
      
      const paidAmount = paidCars * (Math.random() * 25000 + 75000);
      const returnedAmount = returnedCars * (Math.random() * 20000 + 60000);
      const pendingAmount = pendingCars * (Math.random() * 15000 + 80000);
      
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
            returnAmount = Math.floor(baseAmount * (Math.random() * 0.5 + 0.5));
          } else if (status === 'pending') {
            paymentAmount = Math.floor(baseAmount * (Math.random() * 0.4 + 0.1));
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

  const renderModelCharts = () => {
    if (!modelChartRef.current || !modelSecondaryChartRef.current || !data.modelData.length) return;
    
    const chartStyles = getChartStyles();
    
    const salesChartData = data.modelData.map(model => ({
      id: model.id,
      label: model.name,
      value: model.totalSales,
      color: getThemedColor(model.color),
      model: model
    }));
    
    if (chartType === 'bar') {
      D3Visualizer.createBarChart(salesChartData, {
        container: modelChartRef.current,
        title: t('charts.modelSales', { period: getDateRangeLabel(), defaultValue: `Продажи по моделям (${getDateRangeLabel()})` }),
        onClick: (item) => handleModelClick(item.model),
        height: window.innerWidth < 640 ? 300 : 400,
        theme: isDark ? 'dark' : 'light',
        styles: chartStyles
      });
    } else if (chartType === 'pie') {
      D3Visualizer.createPieChart(salesChartData, {
        container: modelChartRef.current,
        title: t('charts.modelShare', { period: getDateRangeLabel(), defaultValue: `Доля рынка по моделям (${getDateRangeLabel()})` }),
        onClick: (item) => handleModelClick(item.model),
        height: window.innerWidth < 640 ? 300 : 400,
        theme: isDark ? 'dark' : 'light',
        styles: chartStyles
      });
    }
    
    renderModelTimelineChart();
    
    if (trendChartRef.current && data.trendData.length) {
      const trendContainer = trendChartRef.current;
      trendContainer.innerHTML = '';
      
      const trendWidth = trendContainer.clientWidth;
      const trendHeight = window.innerWidth < 640 ? 300 : 380;
      const trendMargin = { 
        top: 70, 
        right: window.innerWidth < 768 ? 20 : 30, 
        bottom: window.innerWidth < 640 ? 80 : 60, 
        left: window.innerWidth < 640 ? 40 : 60 
      };
      
      const trendChartWidth = trendWidth - trendMargin.left - trendMargin.right;
      const trendChartHeight = trendHeight - trendMargin.top - trendMargin.bottom;
      
      const trendSvg = d3.select(trendContainer)
        .append('svg')
        .attr('width', trendWidth)
        .attr('height', trendHeight)
        .style('background', chartStyles.backgroundColor)
        .style('border-radius', chartStyles.borderRadius);
      
      trendSvg.append('text')
        .attr('x', trendWidth / 2)
        .attr('y', 30)
        .attr('text-anchor', 'middle')
        .style('font-size', window.innerWidth < 640 ? '1rem' : '1.2rem')
        .style('font-weight', 'bold')
        .style('fill', chartStyles.textColor)
        .text(t('charts.salesTrend', { period: getDateRangeLabel(), defaultValue: `Тренд продаж за период: ${getDateRangeLabel()}` }));
      
      const sortedTrendData = [...data.trendData].sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
      });
      
      const processedData = sortedTrendData.map(d => {
        let monthLabel = d.date;
        try {
          const [year, month] = d.date.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1);
          monthLabel = date.toLocaleString('ru', { month: 'short' });
          
          if (date.getMonth() === 0 || date === new Date(sortedTrendData[0].date)) {
            monthLabel = `${monthLabel} ${date.getFullYear()}`;
          }
        } catch (e) {}
        
        return {
          ...d,
          monthLabel
        };
      });
      
      const trendX = d3.scaleBand()
        .domain(processedData.map(d => d.date))
        .range([0, trendChartWidth])
        .padding(0.3);
      
      const trendY = d3.scaleLinear()
        .domain([0, d3.max(processedData, d => d.sales) * 1.2])
        .nice()
        .range([trendChartHeight, 0]);
      
      const trendG = trendSvg.append('g')
        .attr('transform', `translate(${trendMargin.left}, ${trendMargin.top})`);
      
      trendG.selectAll('.grid-line')
        .data(trendY.ticks(5))
        .join('line')
        .attr('class', 'grid-line')
        .attr('x1', 0)
        .attr('x2', trendChartWidth)
        .attr('y1', d => trendY(d))
        .attr('y2', d => trendY(d))
        .attr('stroke', chartStyles.gridColor)
        .attr('stroke-dasharray', '2,2')
        .attr('stroke-width', 1);
      
      trendG.append('g')
        .attr('transform', `translate(0, ${trendChartHeight})`)
        .call(d3.axisBottom(trendX).tickFormat(i => {
          const item = processedData.find(d => d.date === i);
          return item ? item.monthLabel : '';
        }))
        .call(g => g.select('.domain').remove())
        .call(g => g.selectAll('text')
          .style('fill', chartStyles.textColor)
          .style('font-size', window.innerWidth < 640 ? '0.7rem' : '0.8rem')
          .attr('text-anchor', 'middle')
          .attr('transform', window.innerWidth < 640 ? 'rotate(-25)' : 'rotate(-15)')
          .attr('dx', window.innerWidth < 640 ? '-0.6em' : '-0.8em')
          .attr('dy', window.innerWidth < 640 ? '0.15em' : '0.15em'));
      
      trendG.append('g')
        .call(d3.axisLeft(trendY).ticks(5))
        .call(g => g.select('.domain').remove())
        .call(g => g.selectAll('text')
          .style('fill', chartStyles.textColor)
          .style('font-size', window.innerWidth < 640 ? '0.7rem' : '0.8rem'));
      
      trendG.append('text')
        .attr('y', trendChartHeight + (window.innerWidth < 640 ? 60 : 45))
        .attr('x', trendChartWidth / 2)
        .attr('text-anchor', 'middle')
        .style('fill', chartStyles.secondaryTextColor)
        .style('font-size', window.innerWidth < 640 ? '0.7rem' : '0.9rem')
        .text(t('charts.month', { defaultValue: 'Месяц' }));
      
      trendG.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', window.innerWidth < 640 ? -30 : -45)
        .attr('x', -trendChartHeight / 2)
        .attr('text-anchor', 'middle')
        .style('fill', chartStyles.secondaryTextColor)
        .style('font-size', window.innerWidth < 640 ? '0.7rem' : '0.9rem')
        .text(t('charts.sales', { defaultValue: 'Количество продаж' }));
      
      const barsGroup = trendG.append('g')
        .attr('class', 'bars-group');
      
      const trendBars = barsGroup.selectAll('.trend-bar')
        .data(processedData)
        .join('rect')
        .attr('class', 'trend-bar')
        .attr('x', d => trendX(d.date))
        .attr('y', d => trendY(d.sales))
        .attr('width', trendX.bandwidth())
        .attr('height', d => trendChartHeight - trendY(d.sales))
        .attr('rx', 4)
        .attr('fill', (d, i) => {
          const colorIndex = i / processedData.length;
          return d3.interpolateTurbo(0.2 + colorIndex * 0.4);
        })
        .attr('opacity', 0.9)
        .attr('cursor', 'pointer')
        .on('mouseover', function() {
          d3.select(this)
            .transition()
            .duration(150)
            .attr('opacity', 1);
        })
        .on('mouseout', function() {
          d3.select(this)
            .transition()
            .duration(150)
            .attr('opacity', 0.9);
        })
        .transition()
        .duration(500)
        .delay((_, i) => i * 50)
        .attr('opacity', 0.9);
      
      barsGroup.selectAll('.value-label')
        .data(processedData)
        .join('text')
        .attr('class', 'value-label')
        .attr('x', d => trendX(d.date) + trendX.bandwidth() / 2)
        .attr('y', d => trendY(d.sales) - 10)
        .attr('text-anchor', 'middle')
        .attr('font-size', window.innerWidth < 640 ? '10px' : '12px')
        .attr('font-weight', 'bold')
        .style('fill', chartStyles.textColor)
        .text(d => d.sales.toLocaleString())
        .attr('opacity', 0)
        .transition()
        .duration(500)
        .delay((_, i) => i * 50 + 500)
        .attr('opacity', 1);
      
      if (processedData.length > 1) {
        const trendLine = d3.line()
          .x(d => trendX(d.date) + trendX.bandwidth() / 2)
          .y(d => trendY(d.sales))
          .curve(d3.curveMonotoneX);
        
        trendG.append('path')
          .datum(processedData)
          .attr('fill', 'none')
          .attr('stroke', chartStyles.textColor)
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '5,5')
          .attr('stroke-opacity', 0.7)
          .attr('d', trendLine)
          .attr('opacity', 0)
          .transition()
          .duration(1000)
          .delay(processedData.length * 50)
          .attr('opacity', 1);
        
        trendG.selectAll('.trend-dot')
          .data(processedData)
          .join('circle')
          .attr('class', 'trend-dot')
          .attr('cx', d => trendX(d.date) + trendX.bandwidth() / 2)
          .attr('cy', d => trendY(d.sales))
          .attr('r', window.innerWidth < 640 ? 3 : 4)
          .attr('fill', chartStyles.textColor)
          .attr('stroke', chartStyles.backgroundColor)
          .attr('stroke-width', 2)
          .attr('opacity', 0)
          .transition()
          .duration(300)
          .delay((_, i) => processedData.length * 50 + 1000 + i * 100)
          .attr('opacity', 1);
      }
    }
  };

  const renderModelTimelineChart = () => {
    if (!modelSecondaryChartRef.current || !data.modelData.length || !data.trendData.length) return;

    const chartStyles = getChartStyles();
    const container = modelSecondaryChartRef.current;
    container.innerHTML = '';
    
    const allMonths = [...new Set(data.trendData.map(d => d.date))].sort();
    const months = allMonths.slice(-6);
    
    const monthNames = months.map(monthStr => {
      try {
        const [year, month] = monthStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleString('ru', { month: 'short' });
      } catch (e) {
        return monthStr;
      }
    });
    
    const topModels = [...data.modelData]
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 6);
    
    const width = container.clientWidth;
    const height = window.innerWidth < 640 ? 300 : 400;
    const margin = { 
      top: 40, 
      right: window.innerWidth < 768 ? 80 : 140, 
      bottom: window.innerWidth < 640 ? 80 : 60, 
      left: window.innerWidth < 640 ? 40 : 60 
    };
    
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('background', chartStyles.backgroundColor)
      .style('border-radius', chartStyles.borderRadius);
    
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', window.innerWidth < 640 ? '1rem' : '1.2rem')
      .style('font-weight', 'bold')
      .style('fill', chartStyles.textColor)
      .text(t('charts.modelTimeline', { period: getDateRangeLabel(), defaultValue: `Динамика продаж по месяцам (${getDateRangeLabel()})` }));
    
    const lineData = topModels.map((model) => {
      const monthlySales = months.map((month, i) => {
        let monthSales = 0;
        
        if (window.originalApiData && Array.isArray(window.originalApiData)) {
          const modelApiData = window.originalApiData.find(m => m.model_id === model.id);
          
          if (modelApiData && modelApiData.filter_by_month) {
            const monthData = modelApiData.filter_by_month.find(m => m.month === month);
            
            if (monthData && monthData.dealers) {
              monthData.dealers.forEach(dealer => {
                if (dealer.user_list && dealer.user_list.length) {
                  dealer.user_list.forEach(user => {
                    const userSales = parseInt(user.contract) || 0;
                    monthSales += userSales;
                  });
                }
              });
            }
          }
        }
        
        return {
          date: month,
          month: monthNames[i],
          value: monthSales,
          model: model
        };
      });
      
      return {
        model: model,
        values: monthlySales
      };
    });
    
    let selectedModelForChart = null;
    
    const x = d3.scaleBand()
      .domain(months)
      .range([0, chartWidth])
      .padding(0.1);
    
    const maxSales = d3.max(lineData, d => d3.max(d.values, v => v.value)) || 0;
    
    const y = d3.scaleLinear()
      .domain([0, maxSales * 1.1])
      .range([chartHeight, 0]);
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y)
        .ticks(5)
        .tickSize(-chartWidth)
        .tickFormat('')
      )
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line')
        .attr('stroke', chartStyles.gridColor)
        .attr('stroke-opacity', 0.3)
        .attr('stroke-dasharray', '2,2'));
      
    g.append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(x).tickFormat((d, i) => monthNames[i % monthNames.length]))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text')
        .style('fill', chartStyles.textColor)
        .style('font-size', window.innerWidth < 640 ? '0.7rem' : '0.8rem')
        .attr('transform', window.innerWidth < 640 ? 'rotate(-25)' : 'rotate(-15)') 
        .attr('text-anchor', 'end')
        .attr('dx', window.innerWidth < 640 ? '-0.6em' : '-0.8em')
        .attr('dy', window.innerWidth < 640 ? '0.15em' : '0.15em'));
    
    g.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text')
        .style('fill', chartStyles.textColor)
        .style('font-size', window.innerWidth < 640 ? '0.7rem' : '0.8rem'));
    
    const line = d3.line()
      .x(d => x(d.date) + x.bandwidth() / 2)
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);
    
    const updateLineStyles = (selectedModel) => {
      lineData.forEach((d, i) => {
        const isSelected = selectedModel && d.model.id === selectedModel.id;
        const isHighlighted = !selectedModel || isSelected;
        
        const lineGroup = g.select(`.line-group-${i}`);
        
        lineGroup.select('.main-line')
          .transition()
          .duration(300)
          .attr('stroke-width', isSelected ? 5 : (window.innerWidth < 640 ? 2 : 3))
          .attr('opacity', isHighlighted ? 1 : 0.2)
          .attr('stroke', isSelected ? chartStyles.textColor : getThemedColor(d.model.color));
        
        lineGroup.select('.background-line')
          .transition()
          .duration(300)
          .attr('opacity', isHighlighted ? 0.3 : 0.1);
        
        lineGroup.selectAll('.line-dot')
          .transition()
          .duration(300)
          .attr('r', isSelected ? (window.innerWidth < 640 ? 6 : 8) : (window.innerWidth < 640 ? 3 : 5))
          .attr('opacity', isHighlighted ? 1 : 0.3)
          .attr('fill', isSelected ? chartStyles.textColor : getThemedColor(d.model.color))
          .attr('stroke', isSelected ? getThemedColor(d.model.color) : chartStyles.backgroundColor)
          .attr('stroke-width', isSelected ? 3 : 2);
        
        lineGroup.select('.model-label')
          .transition()
          .duration(300)
          .attr('opacity', isHighlighted ? 1 : 0.3)
          .style('font-weight', isSelected ? 'bold' : 'normal')
          .attr('fill', isSelected ? chartStyles.textColor : getThemedColor(d.model.color));
      });
    };
    
    lineData.forEach((d, i) => {
      const lineGroup = g.append('g')
        .attr('class', `line-group-${i}`);
      
      lineGroup.append('path')
        .datum(d.values)
        .attr('class', 'background-line')
        .attr('fill', 'none')
        .attr('stroke', isDark ? '#000' : '#666')
        .attr('stroke-width', window.innerWidth < 640 ? 4 : 6)
        .attr('stroke-opacity', 0.3)
        .attr('d', line);
      
      lineGroup.append('path')
        .datum(d.values)
        .attr('class', 'main-line')
        .attr('fill', 'none')
        .attr('stroke', getThemedColor(d.model.color))
        .attr('stroke-width', window.innerWidth < 640 ? 2 : 3)
        .attr('d', line)
        .style('cursor', 'pointer')
        .on('click', () => {
          selectedModelForChart = selectedModelForChart?.id === d.model.id ? null : d.model;
          updateLineStyles(selectedModelForChart);
          updateLegendStyles();
        });
      
      lineGroup.selectAll(`.dot-${i}`)
        .data(d.values)
        .join('circle')
        .attr('class', `line-dot dot-${i}`)
        .attr('cx', v => x(v.date) + x.bandwidth() / 2)
        .attr('cy', v => y(v.value))
        .attr('r', window.innerWidth < 640 ? 3 : 5)
        .attr('fill', getThemedColor(d.model.color))
        .attr('stroke', chartStyles.backgroundColor)
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('click', () => {
          selectedModelForChart = selectedModelForChart?.id === d.model.id ? null : d.model;
          updateLineStyles(selectedModelForChart);
          updateLegendStyles();
        })
        .on('mouseover', function(event, v) {
          if (!selectedModelForChart || selectedModelForChart.id === d.model.id) {
            const tooltip = g.append('g')
              .attr('class', 'temp-tooltip');
            
            const tooltipTexts = [
              `${v.value.toLocaleString()} ${t('models.sales', { defaultValue: 'продаж' })}`,
              d.model.name,
              v.month
            ];
            
            const tempText = tooltip.append('text')
              .style('visibility', 'hidden')
              .style('font-size', window.innerWidth < 640 ? '10px' : '12px');
            
            const maxWidth = Math.max(...tooltipTexts.map(text => {
              tempText.text(text);
              return tempText.node().getComputedTextLength();
            })) + 20;
            
            tempText.remove();
            
            const tooltipBg = tooltip.append('rect')
              .attr('x', x(v.date) + x.bandwidth() / 2 - maxWidth / 2)
              .attr('y', y(v.value) - 55)
              .attr('width', maxWidth)
              .attr('height', 45)
              .attr('rx', 5)
              .attr('fill', chartStyles.tooltipBackground);
            tooltip.append('text')
             .attr('x', x(v.date) + x.bandwidth() / 2)
             .attr('y', y(v.value) - 35)
             .attr('text-anchor', 'middle')
             .attr('font-size', window.innerWidth < 640 ? '10px' : '12px')
             .attr('font-weight', 'bold')
             .attr('fill', chartStyles.tooltipText)
             .text(tooltipTexts[0]);
           
           tooltip.append('text')
             .attr('x', x(v.date) + x.bandwidth() / 2)
             .attr('y', y(v.value) - 22)
             .attr('text-anchor', 'middle')
             .attr('font-size', window.innerWidth < 640 ? '8px' : '10px')
             .attr('fill', getThemedColor(d.model.color))
             .text(tooltipTexts[1]);
           
           tooltip.append('text')
             .attr('x', x(v.date) + x.bandwidth() / 2)
             .attr('y', y(v.value) - 10)
             .attr('text-anchor', 'middle')
             .attr('font-size', window.innerWidth < 640 ? '8px' : '9px')
             .attr('fill', chartStyles.secondaryTextColor)
             .text(tooltipTexts[2]);
         }
       })
       .on('mouseout', function() {
         g.selectAll('.temp-tooltip').remove();
       });
     
     if (d.values.length > 0 && window.innerWidth >= 768) {
       const lastValue = d.values[d.values.length - 1];
       lineGroup.append('text')
         .attr('class', 'model-label')
         .attr('x', x(lastValue.date) + x.bandwidth() / 2 + 10)
         .attr('y', y(lastValue.value))
         .text(d.model.name)
         .attr('text-anchor', 'start')
         .attr('dominant-baseline', 'middle')
         .attr('fill', getThemedColor(d.model.color))
         .attr('font-size', '12px')
         .style('cursor', 'pointer')
         .on('click', () => {
           selectedModelForChart = selectedModelForChart?.id === d.model.id ? null : d.model;
           updateLineStyles(selectedModelForChart);
           updateLegendStyles();
         });
     }
   });
   
   const legendGroup = svg.append('g')
     .attr('transform', `translate(${width - margin.right + 20}, ${margin.top + 20})`);
   
   legendGroup.append('text')
     .attr('x', 0)
     .attr('y', -10)
     .attr('text-anchor', 'start')
     .style('font-size', window.innerWidth < 640 ? '0.7rem' : '0.8rem')
     .style('font-weight', 'bold')
     .style('fill', chartStyles.textColor)
     .text(t('models.title', { defaultValue: 'Модели' }) + ':');
   
   topModels.forEach((model, i) => {
     const legendItem = legendGroup.append('g')
       .attr('class', `legend-item-${i}`)
       .attr('transform', `translate(0, ${i * (window.innerWidth < 640 ? 25 : 30)})`)
       .style('cursor', 'pointer')
       .on('click', () => {
         selectedModelForChart = selectedModelForChart?.id === model.id ? null : model;
         updateLineStyles(selectedModelForChart);
         updateLegendStyles();
       });
     
     legendItem.append('rect')
       .attr('class', 'legend-bg')
       .attr('x', -5)
       .attr('y', -8)
       .attr('width', window.innerWidth < 640 ? 110 : 130)
       .attr('height', window.innerWidth < 640 ? 24 : 28)
       .attr('rx', 4)
       .attr('fill', isDark ? '#2d3748' : '#e5e7eb')
       .attr('opacity', 0.3);
     
     legendItem.append('rect')
       .attr('class', 'legend-indicator')
       .attr('width', window.innerWidth < 640 ? 15 : 20)
       .attr('height', window.innerWidth < 640 ? 3 : 4)
       .attr('y', -1)
       .attr('fill', getThemedColor(model.color));
     
     const maxNameLength = window.innerWidth < 640 ? 12 : 18;
     const displayName = model.name.length > maxNameLength ? 
       model.name.substring(0, maxNameLength - 3) + '...' : 
       model.name;
     
     legendItem.append('text')
       .attr('class', 'legend-text')
       .attr('x', window.innerWidth < 640 ? 20 : 25)
       .attr('y', 3)
       .attr('dominant-baseline', 'middle')
       .text(displayName)
       .style('font-size', window.innerWidth < 640 ? '0.7rem' : '0.8rem')
       .style('fill', chartStyles.textColor);
     
     if (window.innerWidth >= 640) {
       legendItem.append('text')
         .attr('class', 'legend-sales')
         .attr('x', 25)
         .attr('y', 17)
         .attr('dominant-baseline', 'middle')
         .text(`${model.totalSales.toLocaleString()}`)
         .style('font-size', '0.65rem')
         .style('fill', chartStyles.secondaryTextColor);
     }
   });
   
   const updateLegendStyles = () => {
     topModels.forEach((model, i) => {
       const isSelected = selectedModelForChart && selectedModelForChart.id === model.id;
       const isHighlighted = !selectedModelForChart || isSelected;
       
       const legendItem = legendGroup.select(`.legend-item-${i}`);
       
       legendItem.select('.legend-bg')
         .transition()
         .duration(300)
         .attr('opacity', isSelected ? 0.8 : 0.3)
         .attr('fill', isSelected ? getThemedColor(model.color) : (isDark ? '#2d3748' : '#e5e7eb'));
       
       legendItem.select('.legend-indicator')
         .transition()
         .duration(300)
         .attr('height', isSelected ? 6 : (window.innerWidth < 640 ? 3 : 4))
         .attr('fill', isSelected ? chartStyles.textColor : getThemedColor(model.color));
       
       legendItem.select('.legend-text')
         .transition()
         .duration(300)
         .style('fill', isHighlighted ? chartStyles.textColor : chartStyles.secondaryTextColor)
         .style('font-weight', isSelected ? 'bold' : 'normal');
       
       legendItem.select('.legend-sales')
         .transition()
         .duration(300)
         .style('fill', isHighlighted ? chartStyles.secondaryTextColor : (isDark ? '#4b5563' : '#9ca3af'));
     });
   };
   
   svg.append('text')
     .attr('x', margin.left)
     .attr('y', height - 10)
     .attr('text-anchor', 'start')
     .attr('fill', chartStyles.secondaryTextColor)
     .style('font-size', window.innerWidth < 640 ? '8px' : '10px')
     .text(t('charts.clickDot', { defaultValue: 'Нажмите на линию или элемент легенды для выделения модели' }));
   
   updateLineStyles(null);
   updateLegendStyles();
 };

 const renderDealerCharts = () => {
   if (!dealerChartRef.current || !dealerSecondaryChartRef.current || !filteredDealerData.length || !selectedModel) return;
   
   const chartStyles = getChartStyles();
   const sortedDealerData = [...filteredDealerData].sort((a, b) => b.sales - a.sales);
   
   const chartData = sortedDealerData.map(dealer => ({
     id: dealer.dealerId,
     label: dealer.dealerName,
     value: dealer.sales,
     color: getThemedColor(selectedModel.color),
     dealer: dealer
   }));
   
   const topDealers = chartData.slice(0, window.innerWidth < 640 ? 10 : 20);
   
   if (chartType === 'bar') {
     const container = dealerChartRef.current;
     container.innerHTML = '';
     
     const width = container.clientWidth;
     const height = window.innerWidth < 640 ? 300 : 400;
     const margin = { 
       top: 40, 
       right: window.innerWidth < 768 ? 20 : 30, 
       bottom: window.innerWidth < 640 ? 170 : 150, 
       left: window.innerWidth < 640 ? 40 : 60 
     }; 
     
     const chartWidth = width - margin.left - margin.right;
     const chartHeight = height - margin.top - margin.bottom;
     
     const svg = d3.select(container)
       .append('svg')
       .attr('width', width)
       .attr('height', height)
       .style('background', chartStyles.backgroundColor)
       .style('border-radius', chartStyles.borderRadius);
     
     svg.append('text')
       .attr('x', width / 2)
       .attr('y', margin.top / 2)
       .attr('text-anchor', 'middle')
       .style('font-size', window.innerWidth < 640 ? '0.9rem' : '1.2rem')
       .style('font-weight', 'bold')
       .style('fill', chartStyles.textColor)
       .text(t('charts.dealerSales', { 
         model: selectedModel.name, 
         period: getDateRangeLabel(), 
         defaultValue: `Топ-${topDealers.length} дилеров ${selectedModel.name} по продажам (${getDateRangeLabel()})` 
       }));
     
     const g = svg.append('g')
       .attr('transform', `translate(${margin.left}, ${margin.top})`);
     
     const x = d3.scaleBand()
       .domain(topDealers.map(d => d.id.toString()))
       .range([0, chartWidth])
       .padding(0.4);
     
     const y = d3.scaleLinear()
       .domain([0, d3.max(topDealers, d => d.value) * 1.1])
       .nice()
       .range([chartHeight, 0]);
     
     g.append('g')
       .attr('class', 'grid')
       .call(d3.axisLeft(y)
         .ticks(5)
         .tickSize(-chartWidth)
         .tickFormat('')
       )
       .call(g => g.select('.domain').remove())
       .call(g => g.selectAll('.tick line')
         .attr('stroke', chartStyles.gridColor)
         .attr('stroke-opacity', 0.5)
         .attr('stroke-dasharray', '2,2'));
     
     g.append('g')
       .call(d3.axisLeft(y).ticks(5))
       .call(g => g.select('.domain').remove())
       .call(g => g.selectAll('text')
         .style('fill', chartStyles.textColor)
         .style('font-size', window.innerWidth < 640 ? '0.7rem' : '0.85rem'));
     
     g.append('text')
       .attr('text-anchor', 'middle')
       .attr('transform', 'rotate(-90)')
       .attr('y', -margin.left + (window.innerWidth < 640 ? 15 : 20))
       .attr('x', -chartHeight / 2)
       .style('fill', chartStyles.textColor)
       .style('font-size', window.innerWidth < 640 ? '0.7rem' : '0.9rem')
       .text(t('charts.sales', { defaultValue: 'Количество продаж' }));
     
     g.selectAll('.bar')
       .data(topDealers)
       .join('rect')
       .attr('class', 'bar')
       .attr('x', (d) => x(d.id.toString()))
       .attr('y', d => y(d.value))
       .attr('width', x.bandwidth())
       .attr('height', d => chartHeight - y(d.value))
       .attr('fill', (d, i) => {
         const baseColor = getThemedColor(selectedModel.color);
         const hslColor = d3.hsl(baseColor);
         hslColor.l = isDark ? 0.5 + (i * 0.03) : 0.4 + (i * 0.03);
         return hslColor.toString();
       })
       .attr('rx', 4)
       .style('cursor', 'pointer')
       .on('click', (event, d) => handleDealerClick(d.dealer))
       .on('mouseover', function(event, d) {
         d3.select(this)
           .transition()
           .duration(100)
           .attr('opacity', 0.8)
           .attr('stroke', chartStyles.textColor)
           .attr('stroke-width', 2);
           
         g.select(`.dealer-label-${d.id}`)
           .transition()
           .duration(100)
           .style('font-weight', 'bold')
           .style('fill', chartStyles.textColor);
         
         const tooltip = g.append('g')
           .attr('class', 'dealer-tooltip')
           .attr('transform', `translate(${x(d.id.toString()) + x.bandwidth() / 2}, ${y(d.value) - 30})`);
         
         const tooltipText = tooltip.append('text')
           .attr('text-anchor', 'middle')
           .attr('dy', '-0.5em')
           .style('fill', chartStyles.tooltipText)
           .style('font-size', window.innerWidth < 640 ? '10px' : '12px')
           .style('font-weight', 'bold')
           .text(`${d.value.toLocaleString()}`);
         
         const tooltipLabel = tooltip.append('text')
           .attr('text-anchor', 'middle')
           .attr('dy', '1em')
           .style('fill', chartStyles.tooltipText)
           .style('font-size', window.innerWidth < 640 ? '9px' : '11px')
           .text(`${d.label.length > (window.innerWidth < 640 ? 15 : 20) ? 
                   d.label.substring(0, (window.innerWidth < 640 ? 13 : 18)) + '...' : 
                   d.label}`);
         
         const bbox = tooltipLabel.node().getBBox();
         const textHeight = Math.abs(tooltipText.node().getBBox().y - tooltipLabel.node().getBBox().y - tooltipLabel.node().getBBox().height);
         
         tooltip.insert('rect', 'text')
           .attr('x', bbox.x - 6)
           .attr('y', tooltipText.node().getBBox().y - 4)
           .attr('width', bbox.width + 12)
           .attr('height', textHeight + 12)
           .attr('rx', 4)
           .attr('fill', chartStyles.tooltipBackground);
         
         tooltipText.raise();
         tooltipLabel.raise();
       })
       .on('mouseout', function(event, d) {
         d3.select(this)
           .transition()
           .duration(100)
           .attr('opacity', 1)
           .attr('stroke', 'none');
           
         g.select(`.dealer-label-${d.id}`)
           .transition()
           .duration(100)
           .style('font-weight', 'normal')
           .style('fill', chartStyles.secondaryTextColor);
         
         g.selectAll('.dealer-tooltip').remove();
       })
       .attr('opacity', 0)
       .transition()
       .duration(500)
       .delay((_, i) => i * 30)
       .attr('opacity', 1);
     
     g.selectAll('.value-label')
       .data(topDealers)
       .join('text')
       .attr('class', 'value-label')
       .attr('x', d => x(d.id.toString()) + x.bandwidth() / 2)
       .attr('y', d => y(d.value) - 5)
       .attr('text-anchor', 'middle')
       .style('font-size', window.innerWidth < 640 ? '8px' : '10px')
       .style('font-weight', 'bold')
       .style('fill', chartStyles.textColor)
       .text(d => d.value.toLocaleString())
       .attr('opacity', 0)
       .transition()
       .duration(500)
       .delay((_, i) => i * 30 + 500)
       .attr('opacity', 1);
     
     const labelColumns = window.innerWidth < 640 ? 2 : 5;
     const labelRows = Math.ceil(topDealers.length / labelColumns);
     
     const dealerLabelsGroup = g.append('g')
       .attr('transform', `translate(0, ${chartHeight + 10})`);
     
     topDealers.forEach((dealer, i) => {
       const row = Math.floor(i / labelColumns);
       const col = i % labelColumns;
       
       const colWidth = chartWidth / labelColumns;
       const rowHeight = window.innerWidth < 640 ? 45 : 35;
       
       const xPos = col * colWidth + colWidth / 2;
       const yPos = row * rowHeight + 15;
       
       dealerLabelsGroup.append('rect')
         .attr('x', xPos - colWidth * 0.45)
         .attr('y', yPos - 12)
         .attr('width', colWidth * 0.9)
         .attr('height', 24)
         .attr('rx', 4)
         .attr('fill', isDark ? '#1f293788' : '#f3f4f688')
         .attr('opacity', 0)
         .transition()
         .duration(500)
         .delay(i * 30 + 600)
         .attr('opacity', 1);
       
       const dealerName = dealer.label;
       const maxNameLength = window.innerWidth < 640 ? 12 : 16;
       const truncatedName = dealerName.length > maxNameLength ? 
         dealerName.substring(0, maxNameLength - 2) + '...' : 
         dealerName;
       
       dealerLabelsGroup.append('text')
         .attr('class', `dealer-label dealer-label-${dealer.id}`)
         .attr('x', xPos)
         .attr('y', yPos)
         .attr('text-anchor', 'middle')
         .style('font-size', window.innerWidth < 640 ? '8px' : '10px')
         .style('fill', chartStyles.secondaryTextColor)
         .style('cursor', 'pointer')
         .text(truncatedName)
         .on('click', () => handleDealerClick(dealer.dealer))
         .on('mouseover', function() {
           d3.select(this)
             .transition()
             .duration(100)
             .style('font-weight', 'bold')
             .style('fill', chartStyles.textColor);
           
           g.selectAll('.bar')
             .filter(d => d.id === dealer.id)
             .transition()
             .duration(100)
             .attr('opacity', 0.8)
             .attr('stroke', chartStyles.textColor)
             .attr('stroke-width', 2);
           
           if (dealerName.length > maxNameLength) {
             const tooltip = dealerLabelsGroup.append('g')
               .attr('class', 'name-tooltip')
               .attr('transform', `translate(${xPos}, ${yPos - 15})`);
             
             const tooltipText = tooltip.append('text')
               .attr('text-anchor', 'middle')
               .style('fill', chartStyles.tooltipText)
               .style('font-size', window.innerWidth < 640 ? '9px' : '11px')
               .text(dealerName);
             
             const bbox = tooltipText.node().getBBox();
             
             tooltip.insert('rect', 'text')
               .attr('x', bbox.x - 5)
               .attr('y', bbox.y - 2)
               .attr('width', bbox.width + 10)
               .attr('height', bbox.height + 4)
               .attr('rx', 3)
               .attr('fill', chartStyles.tooltipBackground);
             
             tooltipText.raise();
           }
         })
         .on('mouseout', function() {
           d3.select(this)
             .transition()
             .duration(100)
             .style('font-weight', 'normal')
             .style('fill', chartStyles.secondaryTextColor);
           
           g.selectAll('.bar')
             .filter(d => d.id === dealer.id)
             .transition()
             .duration(100)
             .attr('opacity', 1)
             .attr('stroke', 'none');
           
           dealerLabelsGroup.selectAll('.name-tooltip').remove();
         })
         .attr('opacity', 0)
         .transition()
         .duration(500)
         .delay(i * 30 + 600)
         .attr('opacity', 1);
     });
     
   } else if (chartType === 'pie') {
     D3Visualizer.createPieChart(topDealers, {
       container: dealerChartRef.current,
       title: t('charts.dealerShare', { 
         model: selectedModel.name, 
         period: getDateRangeLabel(), 
         defaultValue: `Доля продаж ${selectedModel.name} по топ-${topDealers.length} дилерам (${getDateRangeLabel()})` 
       }),
       onClick: (item) => handleDealerClick(item.dealer),
       height: window.innerWidth < 640 ? 300 : 400,
       theme: isDark ? 'dark' : 'light',
       styles: chartStyles
     });
   }
   
   // График эффективности дилеров
   const container = dealerSecondaryChartRef.current;
   container.innerHTML = '';
   
   const dealerEfficiency = sortedDealerData.slice(0, window.innerWidth < 640 ? 5 : 10).map(dealer => {
     const dealerSalespeople = data.salespersonData.filter(
       s => s.modelId === selectedModel.id && s.dealerId === dealer.dealerId
     );
     
     const salesPerPerson = dealerSalespeople.length > 0 
       ? dealer.sales / dealerSalespeople.length
       : dealer.sales;
     
     return {
       id: dealer.dealerId,
       label: dealer.dealerName,
       value: Math.round(salesPerPerson * 10) / 10,
       totalSales: dealer.sales,
       salespeople: dealerSalespeople.length,
       color: getThemedColor(selectedModel.color),
       dealer: dealer
     };
   });
   
   const width = container.clientWidth;
   const height = window.innerWidth < 640 ? 300 : 400;
   const margin = { 
     top: 40, 
     right: window.innerWidth < 768 ? 20 : 30, 
     bottom: window.innerWidth < 640 ? 180 : 160, 
     left: window.innerWidth < 640 ? 40 : 70 
   };
   
   const chartWidth = width - margin.left - margin.right;
   const chartHeight = height - margin.top - margin.bottom;
   
   const svg = d3.select(container)
     .append('svg')
     .attr('width', width)
     .attr('height', height)
     .style('background', chartStyles.backgroundColor)
     .style('border-radius', chartStyles.borderRadius);
   
   svg.append('text')
     .attr('x', width / 2)
     .attr('y', margin.top / 2)
     .attr('text-anchor', 'middle')
     .style('font-size', window.innerWidth < 640 ? '0.9rem' : '1.2rem')
     .style('font-weight', 'bold')
     .style('fill', chartStyles.textColor)
     .text(t('charts.dealerEfficiency', { 
       model: selectedModel.name, 
       defaultValue: `Эффективность топ-${dealerEfficiency.length} дилеров ${selectedModel.name} (продажи на продавца)` 
     }));
   
   const g = svg.append('g')
     .attr('transform', `translate(${margin.left}, ${margin.top})`);
   
   const x = d3.scaleBand()
     .domain(dealerEfficiency.map(d => d.id.toString()))
     .range([0, chartWidth])
     .padding(0.4);
   
   const y = d3.scaleLinear()
     .domain([0, d3.max(dealerEfficiency, d => d.value) * 1.1])
     .nice()
     .range([chartHeight, 0]);
   
   g.append('g')
     .attr('class', 'grid')
     .call(d3.axisLeft(y)
       .ticks(5)
       .tickSize(-chartWidth)
       .tickFormat('')
     )
     .call(g => g.select('.domain').remove())
     .call(g => g.selectAll('.tick line')
       .attr('stroke', chartStyles.gridColor)
       .attr('stroke-opacity', 0.5)
       .attr('stroke-dasharray', '2,2'));
   
   g.append('g')
     .attr('transform', `translate(0, ${chartHeight})`)
     .call(d3.axisBottom(x).tickFormat(() => ''))
     .call(g => g.select('.domain').remove());
   
   g.append('g')
     .call(d3.axisLeft(y).ticks(5))
     .call(g => g.select('.domain').remove())
     .call(g => g.selectAll('text')
       .style('fill', chartStyles.textColor)
       .style('font-size', window.innerWidth < 640 ? '0.7rem' : '0.85rem'));
   
   g.append('text')
     .attr('text-anchor', 'middle')
     .attr('transform', 'rotate(-90)')
     .attr('y', -margin.left + (window.innerWidth < 640 ? 15 : 20))
     .attr('x', -chartHeight / 2)
     .style('fill', chartStyles.textColor)
     .style('font-size', window.innerWidth < 640 ? '0.7rem' : '0.9rem')
     .text(t('salespeople.avgSales', { defaultValue: 'Средние продажи на продавца' }));
   
   g.selectAll('.bar')
     .data(dealerEfficiency)
     .join('rect')
     .attr('class', 'bar')
     .attr('x', d => x(d.id.toString()))
     .attr('y', d => y(d.value))
     .attr('width', x.bandwidth())
     .attr('height', d => chartHeight - y(d.value))
     .attr('fill', (d, i) => {
       const baseColor = getThemedColor(selectedModel.color);
       const hslColor = d3.hsl(baseColor);
       hslColor.l = isDark ? 0.5 + (i * 0.05) : 0.4 + (i * 0.05);
       return hslColor.toString();
     })
     .attr('rx', 4)
     .style('cursor', 'pointer')
     .on('click', (event, d) => handleDealerClick(d.dealer))
     .on('mouseover', function(event, d) {
       d3.select(this)
         .transition()
         .duration(100)
         .attr('opacity', 0.8)
         .attr('stroke', chartStyles.textColor)
         .attr('stroke-width', 2);
         
       g.selectAll(`.eff-dealer-${d.id}`)
         .transition()
         .duration(100)
         .style('font-weight', 'bold')
         .style('fill', chartStyles.textColor);
       
       const tooltip = g.append('g')
         .attr('class', 'eff-tooltip')
         .attr('transform', `translate(${x(d.id.toString()) + x.bandwidth() / 2}, ${y(d.value) - 30})`);
       
       const tooltipBg = tooltip.append('rect')
         .attr('x', -85)
         .attr('y', -45)
         .attr('width', 170)
         .attr('height', 90)
         .attr('rx', 5)
         .attr('fill', chartStyles.tooltipBackground);
       
       tooltip.append('text')
         .attr('x', 0)
         .attr('y', -28)
         .attr('text-anchor', 'middle')
         .style('font-size', window.innerWidth < 640 ? '12px' : '14px')
         .style('font-weight', 'bold')
         .style('fill', chartStyles.tooltipText)
         .text(`${d.value.toFixed(1)}`);
       
       tooltip.append('text')
         .attr('x', 0)
         .attr('y', -10)
         .attr('text-anchor', 'middle')
         .style('font-size', window.innerWidth < 640 ? '9px' : '11px')
         .style('fill', chartStyles.secondaryTextColor)
         .text(t('salespeople.avgSales', { defaultValue: 'продаж на продавца' }));
       
       const maxNameLength = window.innerWidth < 640 ? 15 : 20;
       const displayName = d.label.length > maxNameLength ? 
         d.label.substring(0, maxNameLength - 3) + '...' : 
         d.label;
         
       tooltip.append('text')
         .attr('x', 0)
         .attr('y', 10)
         .attr('text-anchor', 'middle')
         .style('font-size', window.innerWidth < 640 ? '9px' : '11px')
         .style('fill', chartStyles.tooltipText)
         .text(displayName);
       
       tooltip.append('text')
         .attr('x', 0)
         .attr('y', 30)
         .attr('text-anchor', 'middle')
         .style('font-size', window.innerWidth < 640 ? '9px' : '11px')
         .style('fill', chartStyles.secondaryTextColor)
         .text(`${t('dealers.totalSales', { defaultValue: 'Всего продаж' })}: ${d.totalSales}`);
     })
     .on('mouseout', function(event, d) {
       d3.select(this)
         .transition()
         .duration(100)
         .attr('opacity', 1)
         .attr('stroke', 'none');
         
       g.selectAll(`.eff-dealer-${d.id}`)
         .transition()
         .duration(100)
         .style('font-weight', 'normal')
         .style('fill', chartStyles.secondaryTextColor);
       
       g.selectAll('.eff-tooltip').remove();
     })
     .attr('opacity', 0)
     .transition()
     .duration(500)
     .delay((_, i) => i * 50)
     .attr('opacity', 1);
   
   g.selectAll('.value-label')
     .data(dealerEfficiency)
     .join('text')
     .attr('class', 'value-label')
     .attr('x', d => x(d.id.toString()) + x.bandwidth() / 2)
     .attr('y', d => y(d.value) - 5)
     .attr('text-anchor', 'middle')
     .style('font-size', window.innerWidth < 640 ? '10px' : '12px')
     .style('font-weight', 'bold')
     .style('fill', chartStyles.textColor)
     .text(d => d.value.toFixed(1))
     .attr('opacity', 0)
     .transition()
     .duration(500)
     .delay((_, i) => i * 50 + 500)
     .attr('opacity', 1);
 };

 const renderGlobalTopSalespeople = () => {
   const topSalespeople = getGlobalTopSalespeople();
   
   return (
     <div className={`${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg p-3 sm:p-4 mb-4 md:mb-6`}>
       <div className="grid grid-cols-1 gap-3">
         {topSalespeople.map((salesperson, index) => (
           <motion.div
             key={salesperson.id}
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: index * 0.1 }}
             className={`${isDark ? 'bg-gray-900/70' : 'bg-white'} rounded-lg p-2 sm:p-3 flex items-start sm:items-center flex-col sm:flex-row relative`}
             onMouseEnter={() => setHoveredSalesperson(salesperson)}
             onMouseLeave={() => setHoveredSalesperson(null)}
           >
             <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold mr-3 flex-shrink-0"
                  style={{ 
                    backgroundColor: salesperson.isOnline ? '#10b981' : 
                                    index === 0 ? '#FFD700' : 
                                    index === 1 ? '#C0C0C0' : 
                                    index === 2 ? '#CD7F32' : 
                                    getThemedColor('#3b82f6', 'light') + '80' 
                  }}>
               {salesperson.name.split(' ').map(n => n[0]).join('')}
             </div>
             
             <div className="flex-grow min-w-0 w-full sm:w-auto">
               <div className="flex justify-between items-center flex-wrap gap-1">
                 <h4 className={`text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center truncate max-w-[70%]`} title={salesperson.name}>
                   {salesperson.name}
                   {salesperson.isOnline && (
                     <span className={`ml-2 text-xs font-normal px-1.5 py-0.5 rounded-full ${isDark ? 'bg-green-900/70 text-green-300' : 'bg-green-100 text-green-800'} flex items-center`}>
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                       </svg>
                       {t('status.online', { defaultValue: 'Онлайн' })}
                     </span>
                   )}
                 </h4>
                 <span className="px-2 py-1 rounded text-xs whitespace-nowrap" 
                       style={{ backgroundColor: `${index === 0 ? '#FFD700' : 
                                                 index === 1 ? '#C0C0C0' : 
                                                 index === 2 ? '#CD7F32' : 
                                                 getThemedColor('#3b82f6')}20`, 
                                color: index === 0 ? '#FFD700' : 
                                       index === 1 ? '#C0C0C0' : 
                                       index === 2 ? '#CD7F32' : 
                                       getThemedColor('#3b82f6') }}>
                   {index === 0 ? t('salespeople.rank.first', { defaultValue: '🥇 Абсолютный лидер' }) : 
                    index === 1 ? t('salespeople.rank.second', { defaultValue: '🥈 #2' }) : 
                    index === 2 ? t('salespeople.rank.third', { defaultValue: '🥉 #3' }) : 
                    t('salespeople.rank.other', { position: index + 1, defaultValue: `#${index + 1}` })}
                 </span>
               </div>
               
               {!salesperson.isOnline && salesperson.mainDealer && (
                 <div className={`flex items-center text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1 flex-wrap gap-1`}>
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                   </svg>
                   <span className="truncate max-w-[120px] sm:max-w-[180px]" title={salesperson.mainDealer.dealerName}>
                     {salesperson.mainDealer.dealerName}
                     {salesperson.hasMultipleDealers && (
                       <span className={`text-xs ml-1 px-1 py-0.5 ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'} rounded cursor-pointer`}>
                         + {t('salespeople.moreDealers', { count: salesperson.dealers.length - 1, defaultValue: 'ещё {count}' })}
                       </span>
                     )}
                   </span>
                   
                   <span className={`ml-1 sm:ml-2 px-1.5 py-0.5 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'} text-xs flex items-center`}>
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                     </svg>
                     {salesperson.mainDealer.region}
                   </span>
                 </div>
               )}
               
               <div className="flex items-center mt-2 w-full">
                 <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs sm:text-sm whitespace-nowrap`}>{t('models.totalSales', { defaultValue: 'Общие продажи' })}:</div>
                 <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-bold ml-1 sm:ml-2 text-xs sm:text-sm`}>{salesperson.totalSales.toLocaleString()}</div>
                 
                 <div className="ml-auto flex items-center">
                   <div className={`h-1.5 sm:h-2 w-16 sm:w-24 ${isDark ? 'bg-gray-700' : 'bg-gray-300'} rounded-full mr-2`}>
                     <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${(salesperson.totalSales / topSalespeople[0].totalSales) * 100}%` }}
                       transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                       className="h-full rounded-full"
                       style={{ 
                         backgroundColor: salesperson.isOnline ? '#10b981' :
                                         index === 0 ? '#FFD700' : 
                                         index === 1 ? '#C0C0C0' : 
                                         index === 2 ? '#CD7F32' : 
                                         getThemedColor('#3b82f6') 
                       }}
                     />
                   </div>
                   <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} whitespace-nowrap`}>
                     {Math.round((salesperson.totalSales / topSalespeople.reduce((sum, sp) => sum + sp.totalSales, 0)) * 100)}%
                   </span>
                 </div>
               </div>
             </div>
             
             {hoveredSalesperson && hoveredSalesperson.id === salesperson.id && 
              hoveredSalesperson.hasMultipleDealers && !hoveredSalesperson.isOnline && (
               <div className={`absolute right-0 top-0 transform -translate-y-full mt-2 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-3 shadow-xl z-10 w-72 max-w-[calc(100vw-2rem)] md:max-w-xs`}>
                 <h5 className={`${isDark ? 'text-white' : 'text-gray-900'} font-bold mb-3 text-sm`}>{t('salespeople.salesByRegion', { defaultValue: 'Продажи по дилерам и регионам' })}</h5>
                 
                 <div className="space-y-4 max-h-60 overflow-auto pr-2">
                   {Object.entries(hoveredSalesperson.dealersByRegion).map(([region, dealers]) => (
                     <div key={region} className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} pb-3 last:border-b-0`}>
                       <div className="flex items-center mb-2">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-3 sm:h-4 w-3 sm:w-4 mr-1 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                         </svg>
                         <span className="text-xs sm:text-sm font-medium text-blue-400">{region}</span>
                         <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} ml-auto`}>
                           {dealers.reduce((sum, d) => sum + d.sales, 0)} {t('models.sales', { defaultValue: 'продаж' })}
                         </span>
                       </div>
                       
                       <div className="space-y-2">
                         {dealers.map((dealer, idx) => (
                           <div key={idx} className={`flex justify-between items-center ${isDark ? 'bg-gray-900/50' : 'bg-gray-100'} rounded p-2 text-xs`}>
                             <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'} truncate max-w-[150px]`} title={dealer.dealerName}>
                               {dealer.dealerName}
                             </span>
                             <div className="flex items-center">
                               <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{dealer.sales}</span>
                               <div className={`h-1.5 w-10 ${isDark ? 'bg-gray-700' : 'bg-gray-300'} rounded-full ml-2`}>
                                 <div 
                                   className="h-full rounded-full" 
                                   style={{ 
                                     width: `${(dealer.sales / hoveredSalesperson.totalSales) * 100}%`,
                                     backgroundColor: dealer.dealerId === hoveredSalesperson.mainDealer.dealerId ? 
                                                    '#10b981' : getThemedColor('#3b82f6')
                                   }}
                                 />
                               </div>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             )}
           </motion.div>
         ))}
       </div>
     </div>
   );
 };
 
 const renderSalespersonCharts = () => {
  if (!salespersonChartRef.current || !salespersonSecondaryChartRef.current || !filteredSalespersonData.length || !selectedModel || !selectedDealer) return;
  
  const chartStyles = getChartStyles();
  
  if (viewMode === 'general') {
    // Получаем всех продавцов, отсортированных по продажам (от большего к меньшему)
    const sortedSalespeople = [...filteredSalespersonData]
      .sort((a, b) => b.sales - a.sales);
    
    // Для основного графика берем топ-15 продавцов
    // Для мобильных устройств ограничиваем еще больше
    const topCount = window.innerWidth < 640 ? 8 : 15;
    const topSalespeople = sortedSalespeople.slice(0, topCount);
    
    // Формат данных для D3 визуализатора
    const chartData = topSalespeople.map(salesperson => ({
      id: salesperson.salespersonId,
      label: salesperson.salespersonName,
      value: salesperson.sales,
      color: getThemedColor(selectedModel.color),
      salesperson
    }));
    
    // Primary chart
    if (chartType === 'bar') {
      // Очищаем контейнер
      const container = salespersonChartRef.current;
      container.innerHTML = '';
      
      // Настройка размеров графика с адаптивностью
      const width = container.clientWidth;
      const height = window.innerWidth < 640 ? 300 : 400;
      const margin = { 
        top: 40, 
        right: window.innerWidth < 768 ? 20 : 30, 
        bottom: window.innerWidth < 640 ? 150 : 100, 
        left: window.innerWidth < 640 ? 40 : 60 
      };
      
      const chartWidth = width - margin.left - margin.right;
      const chartHeight = height - margin.top - margin.bottom;
      
      // Создаем SVG элемент
      const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('background', chartStyles.backgroundColor)
        .style('border-radius', chartStyles.borderRadius);
      
      // Добавляем заголовок с адаптивным размером шрифта
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', margin.top / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', window.innerWidth < 640 ? '0.9rem' : '1.2rem')
        .style('font-weight', 'bold')
        .style('fill', chartStyles.textColor)
        .text(t('charts.salesPersonSales', { 
          model: selectedModel.name, 
          dealer: selectedDealer.dealerName, 
          period: getDateRangeLabel(), 
          defaultValue: `Топ-${topCount} продавцов ${selectedModel.name} в ${selectedDealer.dealerName} (${getDateRangeLabel()})` 
        }));
      
      // Основная группа для графика
      const g = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);
      
      // Настраиваем шкалы
      const x = d3.scaleBand()
        .domain(chartData.map(d => d.id.toString()))
        .range([0, chartWidth])
        .padding(0.4);
      
      const y = d3.scaleLinear()
        .domain([0, d3.max(chartData, d => d.value) * 1.1])
        .nice()
        .range([chartHeight, 0]);
      
      // Добавляем сетку для Y оси
      g.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(y)
          .ticks(5)
          .tickSize(-chartWidth)
          .tickFormat('')
        )
        .call(g => g.select('.domain').remove())
        .call(g => g.selectAll('.tick line')
          .attr('stroke', chartStyles.gridColor)
          .attr('stroke-opacity', 0.5)
          .attr('stroke-dasharray', '2,2'));
      
      // Добавляем ось Y с адаптивным шрифтом
      g.append('g')
        .call(d3.axisLeft(y).ticks(5))
        .call(g => g.select('.domain').remove())
        .call(g => g.selectAll('text')
          .style('fill', chartStyles.textColor)
          .style('font-size', window.innerWidth < 640 ? '0.7rem' : '0.85rem'));
      
      // Добавляем подпись оси Y
      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('transform', 'rotate(-90)')
        .attr('y', -margin.left + (window.innerWidth < 640 ? 15 : 20))
        .attr('x', -chartHeight / 2)
        .style('fill', chartStyles.textColor)
        .style('font-size', window.innerWidth < 640 ? '0.7rem' : '0.9rem')
        .text(t('charts.sales', { defaultValue: 'Количество продаж' }));
      
      // Создаем цветовую шкалу для столбцов
  const getBarColor = (_, i) => {
  const baseColor = getThemedColor(selectedModel.color);
  const hslColor = d3.hsl(baseColor);
  hslColor.l = isDark ? 0.5 + (i * 0.05) : 0.4 + (i * 0.05);
        return hslColor.toString();
      };
      
      // Добавляем столбцы
      g.selectAll('.bar')
        .data(chartData)
        .join('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.id.toString()))
        .attr('y', d => y(d.value))
        .attr('width', x.bandwidth())
        .attr('height', d => chartHeight - y(d.value))
        .attr('fill', getBarColor)
        .attr('rx', 4) // Скругленные углы
        .on('mouseover', function(event, d) {
          // Подсвечиваем столбец при наведении
          d3.select(this)
            .transition()
            .duration(100)
            .attr('opacity', 0.8)
            .attr('stroke', chartStyles.textColor)
            .attr('stroke-width', 2);
            
          // Подсвечиваем соответствующую подпись
          g.select(`#salesperson-label-${d.id}`)
            .transition()
            .duration(100)
            .style('font-weight', 'bold')
            .style('fill', chartStyles.textColor);
          
          // Отображаем подробную информацию о продавце
          const tooltip = g.append('g')
            .attr('class', 'salesperson-tooltip')
            .attr('transform', `translate(${x(d.id.toString()) + x.bandwidth() / 2}, ${y(d.value) - 30})`);
          
          const tooltipText = tooltip.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '-0.5em')
            .style('fill', chartStyles.tooltipText)
            .style('font-size', window.innerWidth < 640 ? '10px' : '12px')
            .style('font-weight', 'bold')
            .text(`${d.value.toLocaleString()}`);
          
          const tooltipLabel = tooltip.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '1em')
            .style('fill', chartStyles.tooltipText)
            .style('font-size', window.innerWidth < 640 ? '9px' : '11px')
            .text(d.label);
          
          const bbox = tooltipLabel.node().getBBox();
          const textHeight = Math.abs(tooltipText.node().getBBox().y - tooltipLabel.node().getBBox().y - tooltipLabel.node().getBBox().height);
          
          tooltip.insert('rect', 'text')
            .attr('x', bbox.x - 6)
            .attr('y', tooltipText.node().getBBox().y - 4)
            .attr('width', bbox.width + 12)
            .attr('height', textHeight + 12)
            .attr('rx', 4)
            .attr('fill', chartStyles.tooltipBackground);
          
          tooltipText.raise();
          tooltipLabel.raise();
        })
        .on('mouseout', function(event, d) {
          d3.select(this)
            .transition()
            .duration(100)
            .attr('opacity', 1)
            .attr('stroke', 'none');
            
          // Возвращаем подпись к нормальному виду
          g.select(`#salesperson-label-${d.id}`)
            .transition()
            .duration(100)
            .style('font-weight', 'normal')
            .style('fill', chartStyles.secondaryTextColor);
          
          // Удаляем подсказку
          g.selectAll('.salesperson-tooltip').remove();
        })
        .attr('opacity', 0)
        .transition()
        .duration(500)
        .delay((_, i) => i * 50)
        .attr('opacity', 1);
      
      // Добавляем значения над столбцами
      g.selectAll('.value-label')
        .data(chartData)
        .join('text')
        .attr('class', 'value-label')
        .attr('x', d => x(d.id.toString()) + x.bandwidth() / 2)
        .attr('y', d => y(d.value) - 5)
        .attr('text-anchor', 'middle')
        .style('font-size', window.innerWidth < 640 ? '8px' : '10px')
        .style('font-weight', 'bold')
        .style('fill', chartStyles.textColor)
        .text(d => d.value.toLocaleString())
        .attr('opacity', 0)
        .transition()
        .duration(500)
        .delay((_, i) => i * 50 + 500)
        .attr('opacity', 1);
      
      // Добавляем имена продавцов внизу графика
      // Используем flexbox-подобную раскладку для адаптивности
      const labelsGroup = g.append('g')
        .attr('transform', `translate(0, ${chartHeight + 10})`);
      
      // Определяем количество строк и столбцов для имен продавцов
      const labelColumns = window.innerWidth < 640 ? 1 : 3;
      const labelRows = Math.ceil(chartData.length / labelColumns);
      
      chartData.forEach((d, i) => {
        // Вычисляем позицию в сетке
        const row = Math.floor(i / labelColumns);
        const col = i % labelColumns;
        
        // Вычисляем реальные координаты
        const colWidth = chartWidth / labelColumns;
        const rowHeight = window.innerWidth < 640 ? 42 : 30; // Увеличиваем высоту строки для мобильных
        
        const xPos = col * colWidth + colWidth / 2;
        const yPos = row * rowHeight + 15;
        
        // Создаем фон для имени
        labelsGroup.append('rect')
          .attr('x', xPos - colWidth * 0.45)
          .attr('y', yPos - 12)
          .attr('width', colWidth * 0.9)
          .attr('height', 24)
          .attr('rx', 4)
          .attr('fill', isDark ? '#1f293788' : '#f3f4f688')
          .attr('opacity', 0)
          .transition()
          .duration(500)
          .delay(i * 50 + 600)
          .attr('opacity', 1);
        
        // Максимальная длина имени в символах
        const maxNameLength = window.innerWidth < 640 ? 15 : 
                             window.innerWidth < 768 ? 20 : 
                             25;
                             
        // Сокращаем длинные имена
        const name = d.label;
        const truncatedName = name.length > maxNameLength ? 
          name.substring(0, maxNameLength - 3) + '...' : 
          name;
        
        // Добавляем текст с именем
        labelsGroup.append('text')
          .attr('id', `salesperson-label-${d.id}`)
          .attr('x', xPos)
          .attr('y', yPos)
          .attr('text-anchor', 'middle')
          .style('font-size', window.innerWidth < 640 ? '8px' : '10px')
          .style('fill', chartStyles.secondaryTextColor)
          .style('cursor', 'pointer')
          .text(truncatedName)
          .on('mouseover', function() {
            // Подсвечиваем текст
            d3.select(this)
              .transition()
              .duration(100)
              .style('font-weight', 'bold')
              .style('fill', chartStyles.textColor);
            
            // Подсвечиваем соответствующий столбец
            g.selectAll('.bar')
              .filter((bar) => bar.id === d.id)
              .transition()
              .duration(100)
              .attr('opacity', 0.8)
              .attr('stroke', chartStyles.textColor)
              .attr('stroke-width', 2);
            
            // Показываем полное имя при наведении, если оно было сокращено
            if (name.length > maxNameLength) {
              const tooltip = labelsGroup.append('g')
                .attr('class', 'name-tooltip')
                .attr('transform', `translate(${xPos}, ${yPos - 15})`);
              
              const tooltipText = tooltip.append('text')
                .attr('text-anchor', 'middle')
                .style('fill', chartStyles.tooltipText)
                .style('font-size', window.innerWidth < 640 ? '9px' : '11px')
                .text(name);
              
              const bbox = tooltipText.node().getBBox();
              
              tooltip.insert('rect', 'text')
                .attr('x', bbox.x - 5)
                .attr('y', bbox.y - 2)
                .attr('width', bbox.width + 10)
                .attr('height', bbox.height + 4)
                .attr('rx', 3)
                .attr('fill', chartStyles.tooltipBackground);
              
              tooltipText.raise();
            }
          })
          .on('mouseout', function() {
            // Возвращаем текст к нормальному виду
            d3.select(this)
              .transition()
              .duration(100)
              .style('font-weight', 'normal')
              .style('fill', chartStyles.secondaryTextColor);
            
            // Возвращаем столбец к нормальному виду
            g.selectAll('.bar')
              .filter((bar) => bar.id === d.id)
              .transition()
              .duration(100)
              .attr('opacity', 1)
              .attr('stroke', 'none');
            
            // Удаляем всплывающую подсказку
            labelsGroup.selectAll('.name-tooltip').remove();
          })
          .attr('opacity', 0)
          .transition()
          .duration(500)
          .delay(i * 50 + 600)
          .attr('opacity', 1);
      });
    } else if (chartType === 'pie') {
      // Создаем круговую диаграмму доли продаж продавцов
      D3Visualizer.createPieChart(chartData, {
        container: salespersonChartRef.current,
        title: t('charts.salesPersonShare', { 
          model: selectedModel.name, 
          dealer: selectedDealer.dealerName, 
          period: getDateRangeLabel(), 
          defaultValue: `Доля продаж ${selectedModel.name} в ${selectedDealer.dealerName} (${getDateRangeLabel()})` 
        }),
        height: window.innerWidth < 640 ? 300 : 400,
        theme: isDark ? 'dark' : 'light',
        styles: chartStyles
      });
    }
    
    // Для графика динамики продаж берем только топ-5 продавцов
    const topFiveSalespeople = sortedSalespeople.slice(0, 5);

    // Создаем объект для хранения данных по месяцам для каждого продавца
    const salespersonMonthlyData = {};
    
    // Инициализируем объект для каждого продавца
    topFiveSalespeople.forEach(sp => {
      salespersonMonthlyData[sp.salespersonName] = {};
    });
    
    // Получаем все доступные месяцы из trendData
    const allMonths = [...new Set(data.trendData.filter(t => t.date).map(t => t.date))].sort();
    
    // Если нет данных по месяцам, выводим уведомление
    if (allMonths.length === 0) {
      const container = salespersonSecondaryChartRef.current;
      container.innerHTML = `
        <div class="flex justify-center items-center h-full">
          <div class="${isDark ? 'text-gray-400' : 'text-gray-600'} text-center p-4">
            <p class="text-sm sm:text-base">${t('charts.noMonthlyData', { defaultValue: 'Недостаточно данных для отображения динамики продаж' })}</p>
            <p class="text-xs sm:text-sm mt-2">${t('charts.changeDateRange', { defaultValue: 'Используйте другой диапазон дат или обновите данные' })}</p>
          </div>
        </div>
      `;
      return;
    }
    
    // Создаем структуру данных для графика
    let monthlyData = [];
    
    // Проверяем, есть ли у нас доступ к raw_data
    if (window.originalApiData && Array.isArray(window.originalApiData)) {
      console.log('Используем raw_data для графика продавцов');
      
      // Ищем данные для текущей модели
      const modelData = window.originalApiData.find(m => m.model_id === selectedModel.id);
      
      if (modelData && modelData.filter_by_month) {
        // Для каждого месяца
        modelData.filter_by_month.forEach(monthData => {
          const month = monthData.month;
          
          // Ищем дилера
          const dealerData = monthData.dealers.find(d => d.dealer_id === selectedDealer.dealerId);
          
          if (dealerData && dealerData.user_list) {
            // Для каждого продавца из топ-5
            topFiveSalespeople.forEach(salesperson => {
              // Ищем продавца в списке продавцов дилера
              const userSales = dealerData.user_list.find(u => 
                parseInt(u.user_id) === salesperson.salespersonId || 
                u.user_name === salesperson.salespersonName
              );
              
              // Добавляем данные о продажах этого продавца за этот месяц
              const sales = userSales ? parseInt(userSales.contract) || 0 : 0;
              
              // Сохраняем данные о продажах
              if (!salespersonMonthlyData[salesperson.salespersonName]) {
                salespersonMonthlyData[salesperson.salespersonName] = {};
              }
              
              salespersonMonthlyData[salesperson.salespersonName][month] = sales;
            });
          }
        });
        
        // Преобразуем данные в формат для графика
        topFiveSalespeople.forEach(salesperson => {
          const personData = salespersonMonthlyData[salesperson.salespersonName];
          
          // Для каждого месяца добавляем запись
          allMonths.forEach(month => {
            monthlyData.push({
              x: month,
              y: personData[month] || 0, // Если нет данных, используем 0
              group: salesperson.salespersonName
            });
          });
        });
      }
    }
    
    // Если не смогли получить данные из raw_data, используем альтернативный подход
    if (monthlyData.length === 0) {
      console.log('Используем альтернативный подход для графика продавцов');
      
      // Используем равномерное распределение для демонстрации
      if (data.trendData && data.trendData.length > 0) {
        const totalTrendSales = data.trendData.reduce((sum, item) => sum + item.sales, 0);
        
        if (totalTrendSales > 0) {
          topFiveSalespeople.forEach(salesperson => {
            data.trendData.forEach(trend => {
              if (trend.date) {
                const monthShareOfTotal = trend.sales / totalTrendSales;
                const salesInMonth = Math.round(salesperson.sales * monthShareOfTotal);
                
                monthlyData.push({
                  x: trend.date,
                  y: salesInMonth,
                  group: salesperson.salespersonName
                });
              }
            });
          });
        }
      }
      
      // Если ничего не сработало, используем равномерное распределение
      if (monthlyData.length === 0) {
        const monthCount = allMonths.length;
        
        topFiveSalespeople.forEach(salesperson => {
          allMonths.forEach(month => {
            const salesInMonth = Math.round(salesperson.sales / monthCount);
            
            monthlyData.push({
              x: month,
              y: salesInMonth,
              group: salesperson.salespersonName
            });
          });
        });
      }
    }
    
    // Group by person for line chart
    const monthlyByPerson = {};
    monthlyData.forEach(d => {
      if (!monthlyByPerson[d.group]) {
        monthlyByPerson[d.group] = [];
      }
      monthlyByPerson[d.group].push(d);
    });
    
    // Сортируем данные для каждого продавца по месяцам
    Object.keys(monthlyByPerson).forEach(person => {
      monthlyByPerson[person].sort((a, b) => a.x.localeCompare(b.x));
    });

    // Custom D3 rendering for multi-line chart
    const container = salespersonSecondaryChartRef.current;
    container.innerHTML = '';
    
    const width = container.clientWidth;
    const height = window.innerWidth < 640 ? 300 : 400;
    const margin = { 
      top: 40, 
      right: window.innerWidth < 768 ? 100 : 160, 
      bottom: window.innerWidth < 640 ? 90 : 70, 
      left: window.innerWidth < 640 ? 40 : 70 
    };
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('background', chartStyles.backgroundColor)
      .style('border-radius', chartStyles.borderRadius);
      
    // Добавляем заголовок
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', window.innerWidth < 640 ? '0.9rem' : '1.2rem')
      .style('font-weight', 'bold')
      .style('fill', chartStyles.textColor)
      .text(t('charts.salesTimeline', { 
        period: getDateRangeLabel(), 
        defaultValue: `Динамика продаж топ-5 продавцов за период: ${getDateRangeLabel()}` 
      }));
    
    // Создаем форматтер для дат
    const formatMonthYear = (monthStr) => {
      try {
        const [year, month] = monthStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleString('ru-RU', { month: 'short', year: 'numeric' });
      } catch (e) {
        return monthStr;
      }
    };
    
    // Для x используем scalePoint вместо scaleTime
    const x = d3.scalePoint()
      .domain(allMonths)
      .range([margin.left, width - margin.right]);
      
    // Находим максимальное значение для y
    const yMax = d3.max(monthlyData, d => d.y) || 0;
    
    const y = d3.scaleLinear()
      .domain([0, yMax * 1.1]) // Добавляем 10% отступ сверху
      .nice()
      .range([height - margin.bottom, margin.top]);
      
    // Создаем цветовую шкалу для продавцов с более контрастными цветами
 const colorScale = d3.scaleOrdinal()
  .domain(Object.keys(monthlyByPerson))
  .range([
    getThemedColor('#8b5cf6'), // Фиолетовый
    getThemedColor('#a78bfa'), // Светло-фиолетовый
    getThemedColor('#7c3aed'), // Темно-фиолетовый
    getThemedColor('#c084fc'), // Фиолетовый-300
    getThemedColor('#6366f1')  // Индиго
  ]);
      
    // Создаем функцию линии
    const line = d3.line()
      .x(d => x(d.x))
      .y(d => y(d.y))
      .curve(d3.curveMonotoneX);
    
    // Добавляем заливку для осей для лучшей читаемости
    svg.append('rect')
      .attr('x', 0)
      .attr('y', height - margin.bottom)
      .attr('width', width)
      .attr('height', margin.bottom)
      .attr('fill', isDark ? '#1a2434' : '#f3f4f6')
      .attr('opacity', 0.5);
    
    svg.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', margin.left)
      .attr('height', height - margin.bottom)
      .attr('fill', isDark ? '#1a2434' : '#f3f4f6')
      .attr('opacity', 0.5);
    
    // Рисуем оси с адаптивным размером шрифта
    const chartGroup = svg.append('g');
    
    chartGroup.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat(formatMonthYear))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text')
        .style('fill', chartStyles.textColor)
        .style('font-size', window.innerWidth < 640 ? '0.7rem' : '0.9rem')
        .attr('transform', window.innerWidth < 640 ? 'rotate(-25)' : 'rotate(-25)')
        .attr('text-anchor', 'end')
        .attr('dx', window.innerWidth < 640 ? '-0.6em' : '-0.8em')
        .attr('dy', window.innerWidth < 640 ? '0.15em' : '0.15em'));
      
    chartGroup.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text')
        .style('fill', chartStyles.textColor)
        .style('font-size', window.innerWidth < 640 ? '0.7rem' : '0.9rem'));
      
    // Рисуем подписи осей
    chartGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('x', width / 2)
      .attr('y', height - (window.innerWidth < 640 ? 15 : 15))
      .attr('fill', chartStyles.textColor)
      .style('font-size', window.innerWidth < 640 ? '0.7rem' : '0.9rem')
      .text(t('charts.month', { defaultValue: 'Месяц' }));
    
    chartGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(height - margin.bottom + margin.top) / 2)
      .attr('y', window.innerWidth < 640 ? 15 : 25)
      .attr('fill', chartStyles.textColor)
      .style('font-size', window.innerWidth < 640 ? '0.7rem' : '0.9rem')
      .text(t('charts.sales', { defaultValue: 'Количество продаж' }));
    
    // Рисуем сетку для y оси
    chartGroup.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y)
        .ticks(5)
        .tickSize(-(width - margin.left - margin.right))
        .tickFormat('')
      )
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line')
        .attr('stroke', chartStyles.gridColor)
        .attr('stroke-opacity', 0.5)
        .attr('stroke-dasharray', '2,2'));
    
    // Создаем группу для линий и точек
    const lineGroup = chartGroup.append('g')
      .attr('class', 'chart-group');
    
    // Добавляем линии для каждого продавца
    Object.entries(monthlyByPerson).forEach(([name, values], i) => {
      if (values.length < 2) return; // Нужно минимум 2 точки для линии
      
      // Создаем группу для этого продавца
      const personGroup = lineGroup.append('g')
        .attr('class', `person-${i}`);
      
      // Добавляем линию
      personGroup.append('path')
        .datum(values)
        .attr('fill', 'none')
        .attr('stroke', colorScale(name))
        .attr('stroke-width', window.innerWidth < 640 ? 3 : 4)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('d', line)
        .attr('opacity', 0)
        .transition()
        .duration(1000)
        .delay(i * 300)
        .attr('opacity', 0.9);
    
      // Добавляем точки с адаптивным размером
      values.forEach((d, j) => {
        // Создаем группу для точки
        const pointGroup = personGroup.append('g')
          .attr('class', `point-${i}-${j}`)
          .attr('transform', `translate(${x(d.x)}, ${y(d.y)})`)
          .style('cursor', 'pointer')
          .on('mouseover', function() {
            // Увеличиваем точку при наведении
            d3.select(this).select('circle')
              .transition()
              .duration(100)
              .attr('r', window.innerWidth < 640 ? 15 : 20);
              
            // Делаем текст более заметным
            d3.select(this).select('text')
              .transition()
              .duration(100)
              .style('font-size', window.innerWidth < 640 ? '10px' : '12px')
              .attr('dy', '0.35em');
              
            // Подсвечиваем линию
            personGroup.select('path')
              .transition()
              .duration(100)
              .attr('stroke-width', window.innerWidth < 640 ? 4 : 6)
              .attr('opacity', 1);
          })
          .on('mouseout', function() {
            // Возвращаем точку к обычному размеру
            d3.select(this).select('circle')
              .transition()
              .duration(100)
              .attr('r', window.innerWidth < 640 ? 12 : 16);
              
            // Возвращаем текст к обычному размеру
            d3.select(this).select('text')
              .transition()
              .duration(100)
              .style('font-size', window.innerWidth < 640 ? '8px' : '10px')
              .attr('dy', '0.35em');
              
            // Возвращаем линию к обычному виду
            personGroup.select('path')
              .transition()
              .duration(100)
              .attr('stroke-width', window.innerWidth < 640 ? 3 : 4)
              .attr('opacity', 0.9);
          });
        
        // Добавляем круг
        pointGroup.append('circle')
          .attr('r', 0)
          .attr('fill', colorScale(name))
          .attr('stroke', chartStyles.backgroundColor)
          .attr('stroke-width', 2)
          .transition()
          .duration(500)
          .delay(i * 300 + j * 100 + 1000)
          .attr('r', window.innerWidth < 640 ? 12 : 16);
        
        // Добавляем текст с числом продаж
        pointGroup.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '0.35em')
          .attr('fill', '#fff')
          .style('font-size', '0px')
          .style('font-weight', 'bold')
          .text(d.y)
          .transition()
          .duration(500)
          .delay(i * 300 + j * 100 + 1200)
          .style('font-size', window.innerWidth < 640 ? '8px' : '10px');
        
        // Добавляем подпись с месяцем и именем продавца при клике
        pointGroup.on('click', function() {
          // Удаляем все предыдущие подписи
          chartGroup.selectAll('.point-label').remove();
          
          // Добавляем новую подпись
          const label = chartGroup.append('g')
            .attr('class', 'point-label')
            .attr('transform', `translate(${x(d.x)}, ${y(d.y) - 30})`);
          
          // Фон для подписи
          const labelText = label.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0em')
            .attr('fill', chartStyles.tooltipText)
            .style('font-size', window.innerWidth < 640 ? '10px' : '12px')
            .text(`${name}: ${d.y} (${formatMonthYear(d.x)})`);
          
          // Получаем размеры текста
          const bbox = labelText.node().getBBox();
          
          // Добавляем фон
          label.insert('rect', 'text')
            .attr('x', bbox.x - 5)
            .attr('y', bbox.y - 2)
            .attr('width', bbox.width + 10)
            .attr('height', bbox.height + 4)
            .attr('rx', 4)
            .attr('fill', chartStyles.tooltipBackground);
          
          // Добавляем кнопку закрытия
          label.append('circle')
            .attr('cx', bbox.x + bbox.width + 10)
            .attr('cy', bbox.y + bbox.height / 2)
            .attr('r', 8)
            .attr('fill', '#ef4444')
            .style('cursor', 'pointer')
            .on('click', function(event) {
              event.stopPropagation();
              label.remove();
            });
          
          label.append('text')
            .attr('text-anchor', 'middle')
            .attr('x', bbox.x + bbox.width + 10)
            .attr('y', bbox.y + bbox.height / 2)
            .attr('dy', '0.35em')
            .attr('fill', '#fff')
            .style('font-size', window.innerWidth < 640 ? '8px' : '10px')
            .style('font-weight', 'bold')
            .text('×')
            .style('cursor', 'pointer')
            .on('click', function(event) {
              event.stopPropagation();
              label.remove();
            });
        });
      });
    });
    
    // Добавляем легенду с адаптивностью
    const legend = svg.append('g')
      .attr('transform', `translate(${width - margin.right + 30}, ${margin.top + 20})`);
    
    // Добавляем заголовок легенды  
    legend.append('text')
      .attr('x', 0)
      .attr('y', -10)
      .style('font-size', window.innerWidth < 640 ? '12px' : '14px')
      .style('font-weight', 'bold')
      .style('fill', chartStyles.textColor)
      .text(t('salespeople.title', { defaultValue: 'Продавцы:' }));
    
    // Добавляем элементы легенды с интерактивностью
    Object.keys(monthlyByPerson).forEach((name, i) => {
      const personValues = monthlyByPerson[name];
      // Вычисляем общую сумму продаж этого продавца
      const totalSales = personValues.reduce((sum, d) => sum + d.y, 0);
      
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * (window.innerWidth < 640 ? 28 : 35)})`)
        .attr('class', `legend-${i}`)
        .style('cursor', 'pointer')
        .on('mouseover', function() {
          // Подсвечиваем все элементы для этого продавца
          chartGroup.select(`.person-${i}`).select('path')
            .transition()
            .duration(100)
            .attr('stroke-width', window.innerWidth < 640 ? 4 : 6)
            .attr('opacity', 1);
            
          chartGroup.selectAll(`.person-${i} circle`)
            .transition()
            .duration(100)
            .attr('r', window.innerWidth < 640 ? 15 : 20);
            
          chartGroup.selectAll(`.person-${i} text`)
            .transition()
            .duration(100)
            .style('font-size', window.innerWidth < 640 ? '10px' : '12px');
            
          // Подсвечиваем строку легенды
          d3.select(this)
            .transition()
            .duration(100)
            .attr('opacity', 1);
            
          // Увеличиваем фон легенды
          d3.select(this).select('rect')
            .transition()
            .duration(100)
            .attr('width', window.innerWidth < 640 ? 120 : 150)
            .attr('height', window.innerWidth < 640 ? 25 : 30)
            .attr('y', window.innerWidth < 640 ? -12 : -15);
        })
        .on('mouseout', function() {
          // Возвращаем элементы к нормальному виду
          chartGroup.select(`.person-${i}`).select('path')
            .transition()
            .duration(100)
            .attr('stroke-width', window.innerWidth < 640 ? 3 : 4)
            .attr('opacity', 0.9);
            
          chartGroup.selectAll(`.person-${i} circle`)
            .transition()
            .duration(100)
            .attr('r', window.innerWidth < 640 ? 12 : 16);
            
          chartGroup.selectAll(`.person-${i} text`)
            .transition()
            .duration(100)
            .style('font-size', window.innerWidth < 640 ? '8px' : '10px');
            
          // Возвращаем строку легенды к нормальному виду
          d3.select(this)
            .transition()
            .duration(100)
            .attr('opacity', 0.9);
            
          // Возвращаем фон легенды к нормальному размеру
          d3.select(this).select('rect')
            .transition()
            .duration(100)
            .attr('width', window.innerWidth < 640 ? 100 : 140)
            .attr('height', window.innerWidth < 640 ? 22 : 25)
            .attr('y', window.innerWidth < 640 ? -10 : -12);
        });
      
      // Фон для элемента легенды для лучшей интерактивности
      legendRow.append('rect')
        .attr('x', -5)
        .attr('y', window.innerWidth < 640 ? -10 : -12)
        .attr('width', window.innerWidth < 640 ? 100 : 140)
        .attr('height', window.innerWidth < 640 ? 22 : 25)
        .attr('rx', 4)
        .attr('fill', isDark ? '#2d3748' : '#e5e7eb')
        .attr('opacity', 0.3);
      
      // Цветной индикатор
      legendRow.append('rect')
        .attr('width', window.innerWidth < 640 ? 15 : 20)
        .attr('height', window.innerWidth < 640 ? 3 : 4)
        .attr('y', -1)
        .attr('fill', colorScale(name));
      
      // Максимальная длина имени в легенде
      const maxNameLength = window.innerWidth < 640 ? 10 : 18;
      
      // Обрезанное имя для легенды
      const displayName = name.length > maxNameLength ? 
        name.substring(0, maxNameLength - 2) + '...' : 
        name;
      
      // Имя продавца
      legendRow.append('text')
        .attr('x', window.innerWidth < 640 ? 20 : 30)
        .attr('y', 0)
        .attr('dy', '0.32em')
        .attr('fill', chartStyles.textColor)
        .style('font-size', window.innerWidth < 640 ? '10px' : '12px')
        .text(displayName)
        .on('mouseover', function() {
          // Показываем полное имя при наведении, если оно было сокращено
          if (name.length > maxNameLength) {
            const tooltip = legend.append('g')
              .attr('class', 'name-tooltip')
              .attr('transform', `translate(${window.innerWidth < 640 ? 50 : 70}, ${i * (window.innerWidth < 640 ? 28 : 35)})`);
            
            const tooltipText = tooltip.append('text')
              .style('fill', chartStyles.tooltipText)
              .style('font-size', window.innerWidth < 640 ? '10px' : '11px')
              .text(name);
            
            const bbox = tooltipText.node().getBBox();
            
            tooltip.insert('rect', 'text')
              .attr('x', bbox.x - 5)
              .attr('y', bbox.y - 2)
              .attr('width', bbox.width + 10)
              .attr('height', bbox.height + 4)
              .attr('rx', 3)
              .attr('fill', chartStyles.tooltipBackground);
            
            tooltipText.raise();
          }
        })
        .on('mouseout', function() {
          // Удаляем всплывающую подсказку
          legend.selectAll('.name-tooltip').remove();
        });
        
      // Добавляем общую сумму продаж
      legendRow.append('text')
        .attr('x', window.innerWidth < 640 ? 20 : 30)
        .attr('y', window.innerWidth < 640 ? 12 : 15)
        .attr('fill', chartStyles.secondaryTextColor)
        .style('font-size', window.innerWidth < 640 ? '8px' : '10px')
        .text(`${t('models.totalSales', { defaultValue: 'Всего' })}: ${totalSales}`);
    });
    
    // Добавляем инструкцию по использованию
    svg.append('text')
      .attr('x', margin.left)
      .attr('y', height - (window.innerWidth < 640 ? 10 : 15))
      .attr('text-anchor', 'start')
      .attr('fill', chartStyles.secondaryTextColor)
      .style('font-size', window.innerWidth < 640 ? '8px' : '10px')
      .text(t('charts.clickDot', { defaultValue: 'Нажмите на точку для подробной информации' }));

  } else if (viewMode === 'payments') {
    // Режим просмотра платежей
    
    if (filteredPaymentData && dealerPaymentsChartRef.current) {
      // Отображаем детализацию платежей дилера с адаптивностью
      
      // График статуса платежей
      const paymentStatusData = [
        { 
          label: t('payments.status.paid', { defaultValue: 'Оплачено полностью' }), 
          value: filteredPaymentData.paidCars,
          color: getThemedColor('#10b981') // зеленый
        },
        { 
          label: t('payments.status.returned', { defaultValue: 'Возвращено' }), 
          value: filteredPaymentData.returnedCars,
          color: getThemedColor('#ef4444') // красный
        },
        { 
          label: t('payments.status.pending', { defaultValue: 'Частичная оплата' }), 
          value: filteredPaymentData.pendingCars,
          color: getThemedColor('#f59e0b') // оранжевый
        }
      ];
      
      D3Visualizer.createPieChart(paymentStatusData, {
        container: salespersonChartRef.current,
        title: `${t('payments.status.title', { defaultValue: 'Статус платежей' })} ${selectedModel.name} ${t('payments.status.in', { defaultValue: 'в' })} ${selectedDealer.dealerName}`,
        height: window.innerWidth < 640 ? 300 : 400,
        theme: isDark ? 'dark' : 'light',
        styles: chartStyles
      });
      
      // График сумм платежей
      const paymentAmountData = [
        { 
          label: t('payments.status.paid', { defaultValue: 'Оплачено' }), 
          value: filteredPaymentData.paidAmount,
          color: getThemedColor('#10b981') // зеленый
        },
        { 
          label: t('payments.status.returned', { defaultValue: 'Возвращено' }), 
          value: filteredPaymentData.returnedAmount,
          color: getThemedColor('#ef4444') // красный
        },
        { 
          label: t('payments.status.pending', { defaultValue: 'В ожидании' }), 
          value: filteredPaymentData.pendingAmount,
          color: getThemedColor('#f59e0b') // оранжевый
        }
      ];
      
      D3Visualizer.createBarChart(paymentAmountData, {
        container: salespersonSecondaryChartRef.current,
        title: `${t('payments.amounts.title', { defaultValue: 'Суммы платежей' })} ${selectedModel.name} (${getDateRangeLabel()})`,
        height: window.innerWidth < 640 ? 300 : 400,
        theme: isDark ? 'dark' : 'light',
        styles: chartStyles
      });
      
      // Детальная таблица транзакций с адаптивностью
      if (dealerPaymentsChartRef.current) {
        const container = dealerPaymentsChartRef.current;
        container.innerHTML = '';
        
        // Создаем таблицу транзакций
        const tableContainer = document.createElement('div');
        tableContainer.className = 'overflow-auto max-h-[300px] sm:max-h-[400px] mt-4';
        
        const table = document.createElement('table');
        table.className = `min-w-full divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`;
        
        // Заголовок таблицы
        const tableHead = document.createElement('thead');
        tableHead.className = `${isDark ? 'bg-gray-800' : 'bg-gray-50'} sticky top-0`;
        tableHead.innerHTML = `
          <tr>
            <th scope="col" class="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider">${t('payments.transactions.id', { defaultValue: 'ID' })}</th>
            <th scope="col" class="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider">${t('payments.transactions.car', { defaultValue: 'Автомобиль' })}</th>
            <th scope="col" class="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider">${t('payments.transactions.status', { defaultValue: 'Статус' })}</th>
            <th scope="col" class="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider">${t('payments.transactions.amount', { defaultValue: 'Сумма (UZS)' })}</th>
            <th scope="col" class="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider">${t('payments.transactions.paymentDate', { defaultValue: 'Дата платежа' })}</th>
            <th scope="col" class="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider">${t('payments.transactions.returnInfo', { defaultValue: 'Возврат' })}</th>
            <th scope="col" class="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider">${t('payments.transactions.balance', { defaultValue: 'Баланс' })}</th>
          </tr>
        `;
        
        // Тело таблицы
        const tableBody = document.createElement('tbody');
        tableBody.className = `${isDark ? 'bg-gray-900 divide-y divide-gray-800' : 'bg-white divide-y divide-gray-200'}`;
        
        // Сортируем транзакции
        const sortedTransactions = [...filteredPaymentData.transactions].sort((a, b) => {
          const order = { returned: 0, pending: 1, paid: 2 };
          return order[a.status] - order[b.status];
        });
        
        // Добавляем строки таблицы
        sortedTransactions.forEach((transaction, i) => {
          const row = document.createElement('tr');
          row.className = i % 2 === 0 ? (isDark ? 'bg-gray-900' : 'bg-gray-50') : (isDark ? 'bg-gray-800/50' : 'bg-white');
          
          // Определяем цвет и текст статуса
          let statusColor, statusText;
          switch (transaction.status) {
            case 'paid':
              statusColor = isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800';
              statusText = t('payments.status.paid', { defaultValue: 'Оплачено' });
              break;
            case 'returned':
              statusColor = isDark ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800';
              statusText = t('payments.status.returned', { defaultValue: 'Возвращено' });
              break;
            case 'pending':
              statusColor = isDark ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800';
              statusText = t('payments.status.pending', { defaultValue: 'Частично' });
              break;
          }
          
          const formatter = new Intl.NumberFormat('ru-RU');
          
          row.innerHTML = `
            <td class="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}">${transaction.id}</td>
            <td class="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm ${isDark ? 'text-white' : 'text-gray-900'}">${transaction.carName}</td>
            <td class="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
              <span class="px-1.5 sm:px-2 py-0.5 sm:py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">
                ${statusText}
              </span>
            </td>
            <td class="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm ${isDark ? 'text-white' : 'text-gray-900'}">${formatter.format(transaction.paymentAmount)}</td>
            <td class="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}">${new Date(transaction.paymentDate).toLocaleDateString('ru-RU')}</td>
            <td class="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm ${transaction.returnAmount > 0 ? (isDark ? 'text-red-400' : 'text-red-600') : (isDark ? 'text-gray-500' : 'text-gray-400')}">
              ${transaction.returnAmount > 0 ? 
                `${formatter.format(transaction.returnAmount)} (${new Date(transaction.returnDate).toLocaleDateString('ru-RU')})` : 
                '-'}
            </td>
            <td class="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm ${transaction.balanceAmount > 0 ? (isDark ? 'text-yellow-400' : 'text-yellow-600') : (isDark ? 'text-green-400' : 'text-green-600')}">
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
        titleElement.className = `text-lg sm:text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`;
        titleElement.textContent = t('payments.transactions.title', { count: filteredPaymentData.transactions.length, defaultValue: `Детализация транзакций (${filteredPaymentData.transactions.length})` });
        
        container.appendChild(titleElement);
        container.appendChild(tableContainer);
      }
    }
  }
 };

  useEffect(() => {
   if (view === 'models') {
     renderModelCharts();
   } else if (view === 'dealers' && selectedModel) {
     renderDealerCharts();
   } else if (view === 'salespeople' && selectedModel && selectedDealer) {
     renderSalespersonCharts();
   }
 }, [view, selectedModel, selectedDealer, data, chartType, dateRange, viewMode, currentPage, isDark]);

 // Prepare model card data
 const modelCards = view === 'models' ? data.modelData : [];
 const paginatedDealers = getPaginatedDealers();
 
 return (
   <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-50'} p-4`}>
     <ContentReadyLoader isLoading={isLoading} setIsLoading={setIsLoading} timeout={8000} />
     
     <header className="mb-6 md:mb-8">
       <motion.h1 
         initial={{ opacity: 0, y: -20 }}
         animate={{ opacity: 1, y: 0 }}
         className={`text-2xl sm:text-3xl md:text-4xl font-bold ${isDark ? 'text-transparent bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text' : 'text-transparent bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text'}`}
       >
         {t('title', { defaultValue: 'Интерактивная панель контрактов автомобилей' })}
       </motion.h1>
       <motion.p 
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         transition={{ delay: 0.2 }}
         className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-2 text-sm sm:text-base`}
       >
         {t('subtitle', { defaultValue: 'Исследуйте данные о продажах от моделей до отдельных продавцов' })}
       </motion.p>
     </header>
     
     <div className={`${isDark ? 'bg-gray-900/60 border-gray-700/50' : 'bg-white/80 border-gray-200'} rounded-xl p-3 sm:p-4 md:p-6 border shadow-xl`}>
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-3 md:gap-4">
         <div className="flex items-center space-x-2">
           <motion.div 
             whileHover={{ scale: 1.05 }} 
             whileTap={{ scale: 0.95 }}
             className={`h-3 w-3 rounded-full cursor-pointer ${view === 'models' ? 'bg-green-500' : (isDark ? 'bg-gray-500' : 'bg-gray-400')}`}
             onClick={() => setView('models')}
           />
           <div className={`h-0.5 w-6 sm:w-8 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
           <motion.div 
             whileHover={{ scale: 1.05 }} 
             whileTap={{ scale: 0.95 }}
             className={`h-3 w-3 rounded-full cursor-pointer ${view === 'dealers' ? 'bg-green-500' : (isDark ? 'bg-gray-500' : 'bg-gray-400')}`}
             onClick={() => selectedModel && setView('dealers')}
           />
           <div className={`h-0.5 w-6 sm:w-8 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
           <motion.div 
             whileHover={{ scale: 1.05 }} 
             whileTap={{ scale: 0.95 }}
             className={`h-3 w-3 rounded-full cursor-pointer ${view === 'salespeople' ? 'bg-green-500' : (isDark ? 'bg-gray-500' : 'bg-gray-400')}`}
             onClick={() => selectedDealer && setView('salespeople')}
           />
         </div>

         <div className="flex flex-wrap gap-2 md:mb-0 mb-2">
           <motion.button
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={() => setChartType('bar')}
             className={`px-3 py-1.5 rounded-md text-xs sm:text-sm ${chartType === 'bar' ? 'bg-purple-500 text-white' : (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
           >
             {t('chartTypes.bar', { defaultValue: 'Столбцы' })}
           </motion.button>
           <motion.button
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={() => setChartType('pie')}
             className={`px-3 py-1.5 rounded-md text-xs sm:text-sm ${chartType === 'pie' ? 'bg-purple-500 text-white' : (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
           >
             {t('chartTypes.pie', { defaultValue: 'Круговая' })}
           </motion.button>
         </div>
         
         <div className="relative w-full md:w-auto md:ml-auto">
           <motion.div 
             className={`${isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-700/70' : 'bg-white border-gray-300 hover:bg-gray-50'} rounded-lg border flex items-center cursor-pointer p-2 transition-colors max-w-full`}
             onClick={() => setShowDatePicker(!showDatePicker)}
             whileHover={{ scale: 1.02 }}
             whileTap={{ scale: 0.98 }}
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500  mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
             </svg>
             <span className={`${isDark ? 'text-white' : 'text-gray-900'} text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis`}>{getDateRangeLabel()}</span>
             <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-600'} ml-2 flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
             </svg>
           </motion.div>
           
           {showDatePicker && (
             <motion.div 
               initial={{ opacity: 0, y: -10 }}
               animate={{ opacity: 1, y: 0 }}
               className={`absolute right-0 mt-2 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border shadow-xl z-50 w-full md:w-72`}
               ref={datePickerRef}
             >
               <div className="p-3">
                 <h3 className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold mb-3`}>{t('dateRangeSelector.title', { defaultValue: 'Выберите период' })}</h3>
                 
                 <div className="grid grid-cols-2 gap-2 mb-4">
                   <motion.button
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={() => handlePresetSelect('last7Days')}
                     className={`px-3 py-1.5 rounded-md text-xs ${dateRange.preset === 'last7Days' ? 'bg-blue-600 text-white' : (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                   >
                     {t('datePeriods.last7Days', { defaultValue: '7 дней' })}
                   </motion.button>
                   <motion.button
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={() => handlePresetSelect('last30Days')}
                     className={`px-3 py-1.5 rounded-md text-xs ${dateRange.preset === 'last30Days' ? 'bg-blue-600 text-white' : (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                   >
                     {t('datePeriods.last30Days', { defaultValue: '30 дней' })}
                   </motion.button>
                   <motion.button
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={() => handlePresetSelect('last3Months')}
                     className={`px-3 py-1.5 rounded-md text-xs ${dateRange.preset === 'last3Months' ? 'bg-blue-600 text-white' : (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                   >
                     {t('datePeriods.last3Months', { defaultValue: '3 месяца' })}
                   </motion.button>
                   <motion.button
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={() => handlePresetSelect('last6Months')}
                     className={`px-3 py-1.5 rounded-md text-xs ${dateRange.preset === 'last6Months' ? 'bg-blue-600 text-white' : (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                   >
                     {t('datePeriods.last6Months', { defaultValue: '6 месяцев' })}
                   </motion.button>
                   <motion.button
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={() => handlePresetSelect('last12Months')}
                     className={`px-3 py-1.5 rounded-md text-xs ${dateRange.preset === 'last12Months' ? 'bg-blue-600 text-white' : (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                   >
                     {t('datePeriods.last12Months', { defaultValue: '12 месяцев' })}
                   </motion.button>
                   <motion.button
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={() => handlePresetSelect('thisYear')}
                     className={`px-3 py-1.5 rounded-md text-xs ${dateRange.preset === 'thisYear' ? 'bg-blue-600 text-white' : (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                   >
                     {t('datePeriods.thisYear', { defaultValue: 'Этот год' })}
                   </motion.button>
                   <motion.button
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={() => handlePresetSelect('lastYear')}
                     className={`px-3 py-1.5 rounded-md text-xs ${dateRange.preset === 'lastYear' ? 'bg-blue-600 text-white' : (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                   >
                     {t('datePeriods.lastYear', { defaultValue: 'Прошлый год' })}
                   </motion.button>
                   <motion.button
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={() => handlePresetSelect('custom')}
                     className={`px-3 py-1.5 rounded-md text-xs col-span-2 ${dateRange.preset === 'custom' ? 'bg-blue-600 text-white' : (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                   >
                     {t('datePeriods.custom', { defaultValue: 'Произвольный период' })}
                   </motion.button>
                 </div>
                 
                 <div className="space-y-3">
                   <div>
                     <label className={`block text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>{t('dateRangeSelector.startDate', { defaultValue: 'Начало периода' })}</label>
                     <input 
                       type="date" 
                       value={dateRange.startDate.toISOString().split('T')[0]}
                       onChange={(e) => handleDateRangeChange({ startDate: new Date(e.target.value) })}
                       className={`w-full ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                     />
                   </div>
                   <div>
                     <label className={`block text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>{t('dateRangeSelector.endDate', { defaultValue: 'Конец периода' })}</label>
                     <input 
                       type="date" 
                       value={dateRange.endDate.toISOString().split('T')[0]}
                       onChange={(e) => handleDateRangeChange({ endDate: new Date(e.target.value) })}
                       className={`w-full ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                     />
                   </div>
                 </div>
                 
                 <div className="mt-4 flex justify-end space-x-2">
                   <motion.button
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={() => setShowDatePicker(false)}
                     className={`px-3 py-1.5 rounded-md text-sm ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
                   >
                     {t('dateRangeSelector.cancel', { defaultValue: 'Отмена' })}
                   </motion.button>
                   <motion.button
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={() => {
                       refreshDataWithDateRange(dateRange);
                       setShowDatePicker(false);
                     }}
                     className="px-3 py-1.5 rounded-md text-sm bg-purple-500 text-white"
                   >
                     {t('dateRangeSelector.apply', { defaultValue: 'Применить' })}
                   </motion.button>
                 </div>
               </div>
             </motion.div>
           )}
         </div>
       </div>
       
       <motion.div 
         initial={{ opacity: 0, y: -10 }}
         animate={{ opacity: 1, y: 0 }}
         className={`mb-4 flex items-center ${isDark ? 'bg-purple-500 ' : 'bg-purple-100'} rounded-lg p-2 text-xs sm:text-sm overflow-hidden`}
       >
         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500  mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
         </svg>
         <span className={`${isDark ? 'text-dark-200' : 'text-dark-500'} text-xs sm:text-sm overflow-hidden text-ellipsis`}>
           {t('periodData', { period: getDateRangeLabel(), defaultValue: 'Данные за период: {{period}}' })}
         </span>
       </motion.div>
       
       {(selectedModel || selectedDealer) && (
         <div className={`mb-4 md:mb-6 ${isDark ? 'bg-gray-800/80' : 'bg-gray-100'} p-2 sm:p-3 rounded-lg flex items-center flex-wrap text-xs sm:text-sm`}>
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
             {t('models.title', { defaultValue: 'Все модели' })}
           </motion.button>
           
           {selectedModel && (
             <>
               <span className={`mx-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>/</span>
               <motion.button
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={() => {
                   setSelectedDealer(null);
                   setView('dealers');
                   setViewMode('general');
                 }}
                 className="text-blue-400 hover:text-blue-300 transition-colors max-w-[120px] sm:max-w-none truncate"
                 style={{ color: getThemedColor(selectedModel.color) }}
               >
                 {selectedModel.name}
               </motion.button>
             </>
           )}
           
           {selectedDealer && (
             <>
               <span className={`mx-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>/</span>
               <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'} max-w-[150px] sm:max-w-none truncate`} title={selectedDealer.dealerName}>{selectedDealer.dealerName}</span>
             </>
           )}
           
           {viewMode === 'payments' && (
             <>
               <span className={`mx-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>/</span>
               <span className="text-yellow-300">{t('payments.title', { defaultValue: 'Платежи и возвраты' })}</span>
             </>
           )}
         </div>
       )}
     </div>

     {/* Содержимое для представления моделей */}
     {view === 'models' && (
       <motion.div 
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         className="mb-8"
       >
         <h2 className={`text-xl sm:text-2xl font-bold mb-4 md:mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('models.title', { defaultValue: 'Каталог моделей автомобилей' })}</h2>
         
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
           {modelCards.map((model, index) => (
             <motion.div
               key={model.id}
               initial={animateCards ? { opacity: 0, y: 20 } : false}
               animate={animateCards ? { opacity: 1, y: 0 } : false}
               transition={{ delay: index * 0.1 }}
               whileHover={{ scale: 1.03, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)' }}
               className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg overflow-hidden shadow-lg cursor-pointer`}
               onClick={() => handleModelClick(model)}
               onAnimationComplete={() => index === modelCards.length - 1 && setAnimateCards(false)}
             >
               <div className={`relative h-32 sm:h-40 ${isDark ? 'bg-gradient-to-br from-gray-700 to-gray-900' : 'bg-gradient-to-br from-gray-100 to-gray-200'} overflow-hidden`}>
                 {model.img && (
                   <img 
                     src={model.img} 
                     alt={model.name} 
                     className="w-full h-full object-contain p-2"
                   />
                 )}
                 <div className={`absolute top-2 right-2 ${isDark ? 'bg-gray-900/70' : 'bg-white/90'} rounded-full px-2 py-1 text-xs`}>
                   {model.category === 'suv' && t('models.categories.suv', { defaultValue: 'Внедорожник' })}
                   {model.category === 'sedan' && t('models.categories.sedan', { defaultValue: 'Седан' })}
                   {model.category === 'minivan' && t('models.categories.minivan', { defaultValue: 'Минивэн' })}
                 </div>
               </div>
               <div className="p-3 md:p-4">
                 <h3 className="text-base sm:text-lg font-bold truncate" style={{ color: getThemedColor(model.color) }}>{model.name}</h3>
                 <div className="flex justify-between items-center mt-2">
                   <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs sm:text-sm`}>{t('models.sales', { defaultValue: 'Продажи' })}</div>
                   <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-bold text-sm sm:text-base`}>{model.totalSales.toLocaleString()}</div>
                 </div>
               </div>
             </motion.div>
           ))}
         </div>
         
         <h2 className={`text-xl sm:text-2xl font-bold mb-4 md:mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('charts.modelSales', { period: getDateRangeLabel(), defaultValue: 'Общие продажи по моделям' })}</h2>
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
           <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-3 sm:p-4 rounded-lg shadow-md`}>
             <div ref={modelChartRef} className="w-full h-[300px] sm:h-[400px]"></div>
             <p className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-2 text-xs sm:text-sm`}>{t('charts.instructions', { defaultValue: 'Нажмите на элемент для просмотра продаж по дилерам' })}</p>
           </div>
           
           <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-3 sm:p-4 rounded-lg shadow-md`}>
             <div ref={modelSecondaryChartRef} className="w-full h-[300px] sm:h-[400px]"></div>
           </div>
         </div>
         
         <h2 className={`text-xl sm:text-2xl font-bold my-4 md:my-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('salespeople.globalTop', { defaultValue: 'Лидеры продаж' })}</h2>
         {renderGlobalTopSalespeople()}

         <div className={`mt-6 ${isDark ? 'bg-gray-800' : 'bg-white'} p-3 sm:p-4 rounded-lg shadow-md`}>
           <div ref={trendChartRef} className="w-full h-[300px] sm:h-[400px]"></div>
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
         <div className="flex flex-col md:flex-row gap-4 md:gap-6 mb-6 md:mb-8">
           <motion.div 
             initial={animateCards ? { opacity: 0, x: -20 } : false}
             animate={animateCards ? { opacity: 1, x: 0 } : false}
             transition={{ duration: 0.5 }}
             onAnimationComplete={() => setAnimateCards(false)}
             className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow-md md:w-1/3 w-full`}
           >
             <div className={`relative h-32 sm:h-40 ${isDark ? 'bg-gradient-to-br from-gray-700 to-gray-900' : 'bg-gradient-to-br from-gray-100 to-gray-200'} rounded-md overflow-hidden mb-4`}>
               {selectedModel && selectedModel.img && (
                 <img 
                   src={selectedModel.img} 
                   alt={selectedModel.name} 
                   className="w-full h-full object-contain p-2"
                 />
               )}
             </div>
             
             <h2 className="text-xl sm:text-2xl font-bold mb-4" style={{ color: getThemedColor(selectedModel?.color) }}>
               {selectedModel ? selectedModel.name : ''}
             </h2>
             
             <div className="space-y-3 text-sm sm:text-base">
               <div className="flex justify-between items-center">
                 <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('dealers.totalSales', { defaultValue: 'Всего продаж' })}</span>
                 <span className={`${isDark ? 'text-white' : 'text-gray-900'} font-bold`}>
                   {selectedModel ? selectedModel.totalSales.toLocaleString() : 0}
                 </span>
               </div>
               
               <div className="flex justify-between items-center">
                 <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('models.category', { defaultValue: 'Категория' })}</span>
                 <span className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
                   {selectedModel?.category === 'suv' && t('models.categories.suv', { defaultValue: 'Внедорожник' })}
                   {selectedModel?.category === 'sedan' && t('models.categories.sedan', { defaultValue: 'Седан' })}
                   {selectedModel?.category === 'minivan' && t('models.categories.minivan', { defaultValue: 'Минивэн' })}
                 </span>
               </div>
               
               <div className="flex justify-between items-center">
                 <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('dealers.title', { defaultValue: 'Дилеров' })}</span>
                 <span className={`${isDark ? 'text-white' : 'text-gray-900'}`}>{filteredDealerData.length}</span>
               </div>
               
               <div className="flex justify-between items-center">
                 <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('dealers.avgSales', { defaultValue: 'Средние продажи на дилера' })}</span>
                 <span className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
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
                 className={`w-full py-2 rounded-md ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} transition-colors text-sm sm:text-base`}
               >
                 {t('dealers.backToModels', { defaultValue: 'Вернуться к моделям' })}
               </motion.button>
             </div>
           </motion.div>
           
           <div className="md:w-2/3 space-y-4 w-full">
             <div className="flex justify-between items-center mb-4">
               <h3 className={`text-lg sm:text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('dealers.title', { defaultValue: 'Дилеры' })} {selectedModel?.name}</h3>
               <div className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                 {t('dealers.count', { count: filteredDealerData.length, defaultValue: 'Всего дилеров: {{count}}' })}
               </div>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
               {paginatedDealers.map((dealer, index) => {
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
                     className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg overflow-hidden shadow-lg cursor-pointer`}
                     onClick={() => handleDealerClick(dealer)}
                     onAnimationComplete={() => index === paginatedDealers.length - 1 && setAnimateCards(false)}
                   >
                     <div className="p-3 sm:p-4 border-l-4" style={{ borderColor: getThemedColor(selectedModel?.color) }}>
                       <div className="flex justify-between flex-wrap gap-1">
                         <h3 className={`text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'} truncate max-w-[70%]`} title={dealer.dealerName}>{dealer.dealerName}</h3>
                         <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'} whitespace-nowrap`}>
                           ID: {dealer.dealerId}
                         </span>
                       </div>
                       <div className="flex justify-between items-center mt-2">
                         <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs sm:text-sm`}>{t('models.sales', { defaultValue: 'Продажи' })}</div>
                         <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-bold text-sm sm:text-base`}>{dealer.sales.toLocaleString()}</div>
                       </div>
                       <div className={`mt-3 w-full ${isDark ? 'bg-gray-700' : 'bg-gray-300'} rounded-full h-1.5`}>
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${(dealer.sales / Math.max(...filteredDealerData.map(d => d.sales))) * 100}%` }}
                           transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                           className="h-full rounded-full"
                           style={{ backgroundColor: getThemedColor(selectedModel?.color) }}
                         />
                       </div>
                       
                       <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
                         <div className={`${isDark ? 'bg-gray-900/50' : 'bg-gray-100'} rounded p-2`}>
                           <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('models.sales', { defaultValue: 'Продажи' })}</div>
                           <div className={`text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{dealer.sales}</div>
                         </div>
                         <div className={`${isDark ? 'bg-gray-900/50' : 'bg-gray-100'} rounded p-2`}>
                           <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('salespeople.title', { defaultValue: 'Продавцов' })}</div>
                           <div className={`text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                             {data.salespersonData.filter(
                               s => s.modelId === selectedModel.id && s.dealerId === dealer.dealerId
                             ).length}
                           </div>
                         </div>
                       </div>
                     </div>
                   </motion.div>
                 );
               })}
             </div>
             
             {totalPages > 1 && (
               <div className={`flex justify-between items-center mt-4 md:mt-6 px-3 md:px-4 py-2 md:py-3 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg text-xs sm:text-sm`}>
                 <button
                   onClick={handlePrevPage}
                   disabled={currentPage === 1}
                   className={`px-2 sm:px-3 py-1 rounded ${currentPage === 1 ? (isDark ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400') : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                 >
                   {t('dealers.pagination.prev', { defaultValue: 'Назад' })}
                 </button>
                 
                 <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-xs sm:text-sm`}>
                   {t('dealers.pagination.page', { current: currentPage, total: totalPages, defaultValue: 'Страница {{current}} из {{total}}' })}
                 </div>
                 
                 <button
                   onClick={handleNextPage}
                   disabled={currentPage === totalPages}
                   className={`px-2 sm:px-3 py-1 rounded ${currentPage === totalPages ? (isDark ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400') : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                 >
                   {t('dealers.pagination.next', { defaultValue: 'Вперед' })}
                 </button>
               </div>
             )}
           </div>
         </div>
         
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
           <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-3 sm:p-4 rounded-lg shadow-md`}>
             <div ref={dealerChartRef} className="w-full h-[300px] sm:h-[400px]"></div>
           </div>
           
           <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-3 sm:p-4 rounded-lg shadow-md`}>
             <div ref={dealerSecondaryChartRef} className="w-full h-[300px] sm:h-[400px]"></div>
           </div>
         </div>
       </motion.div>
     )}
     
     {/* Уровень продавцов */}
     {view === 'salespeople' && (
       <motion.div 
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         className="mb-8"
       >
         <div className="flex flex-col md:flex-row gap-4 md:gap-6 mb-6 md:mb-8">
           <motion.div 
             initial={animateCards ? { opacity: 0, x: -20 } : false}
             animate={animateCards ? { opacity: 1, x: 0 } : false}
             transition={{ duration: 0.5 }}
             onAnimationComplete={() => setAnimateCards(false)}
             className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow-md md:w-1/3 w-full`}
           >
             <div className={`relative h-24 sm:h-32 ${isDark ? 'bg-gradient-to-br from-gray-700 to-gray-900' : 'bg-gradient-to-br from-gray-100 to-gray-200'} rounded-md overflow-hidden mb-4`}>
               {selectedModel && selectedModel.img && (
                 <img 
                   src={selectedModel.img} 
                   alt={selectedModel.name} 
                   className="w-full h-full object-contain p-2"
                 />
               )}
             </div>
             
             <h3 className="text-lg sm:text-xl font-bold mb-1" style={{ color: getThemedColor(selectedModel?.color) }}>
               {selectedModel ? selectedModel.name : ''}
             </h3>
             
             <h2 className={`text-xl sm:text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'} truncate`} title={selectedDealer?.dealerName}>
               {selectedDealer ? selectedDealer.dealerName : ''}
             </h2>
             
             <div className="grid grid-cols-2 gap-3 mb-4">
               <div className={`${isDark ? 'bg-gray-900/50' : 'bg-gray-100'} rounded p-3`}>
                 <div className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('models.sales', { defaultValue: 'Продажи' })}</div>
                 <div className={`text-lg sm:text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedDealer?.sales || 0}</div>
               </div>
               <div className={`${isDark ? 'bg-gray-900/50' : 'bg-gray-100'} rounded p-3`}>
                 <div className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('salespeople.title', { defaultValue: 'Продавцов' })}</div>
                 <div className={`text-lg sm:text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                   {filteredSalespersonData.length}
                 </div>
               </div>
             </div>
             
             <div className="space-y-3 text-sm">
               {viewMode === 'general' ? (
                 <>
                   <div className="flex justify-between items-center">
                     <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('salespeople.title', { defaultValue: 'Продавцов' })}</span>
                     <span className={`${isDark ? 'text-white' : 'text-gray-900'}`}>{filteredSalespersonData.length}</span>
                   </div>
                   
                   <div className="flex justify-between items-center">
                     <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('salespeople.avgSales', { defaultValue: 'Средние продажи на продавца' })}</span>
                     <span className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
                       {filteredSalespersonData.length > 0 
                         ? Math.round(filteredSalespersonData.reduce((sum, d) => sum + d.sales, 0) / filteredSalespersonData.length).toLocaleString()
                         : 0}
                     </span>
                   </div>
                 </>
               ) : (
                 <></>
               )}
             </div>
             
             <div className="mt-4 space-y-2">
               <motion.button
                 whileHover={{ scale: 1.03 }}
                 whileTap={{ scale: 0.98 }}
                 onClick={handleBackClick}
                 className={`w-full py-2 rounded-md ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} transition-colors text-sm`}
               >
                 {t('salespeople.backToDealer', { defaultValue: 'Вернуться к дилерам' })}
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
                 className={`w-full py-2 rounded-md ${isDark ? 'bg-gray-700/50 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-colors text-sm`}
               >
                 {t('salespeople.backToModels', { defaultValue: 'К списку моделей' })}
               </motion.button>
             </div>
           </motion.div>
           
           <div className="md:w-2/3 w-full">
             {viewMode === 'general' ? (
               <>
                 <div className="flex justify-between items-center mb-4">
                   <h3 className={`text-lg sm:text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                     {t('salespeople.topTitle', { count: 5, dealer: selectedDealer?.dealerName, defaultValue: 'Топ-5 продавцов {{dealer}}' })}
                   </h3>
                   <div className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                     {t('salespeople.count', { count: filteredSalespersonData.length, defaultValue: 'Всего продавцов: {{count}}' })}
                   </div>
                 </div>
                 
                 <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-3 sm:p-4 mb-4`}>
                   <div className="grid grid-cols-1 gap-3">
                     {(showAllSalespeople ? filteredSalespersonData : topSalespeople).map((salesperson, index) => (
                       <motion.div
                         key={salesperson.salespersonId}
                         initial={animateCards ? { opacity: 0, y: 10 } : false}
                         animate={animateCards ? { opacity: 1, y: 0 } : false}
                         transition={{ delay: index * 0.1 }}
                         className={`${isDark ? 'bg-gray-900/70' : 'bg-gray-100'} rounded-lg p-3 flex items-center`}
                         onAnimationComplete={() => index === 
                           (showAllSalespeople ? filteredSalespersonData.length - 1 : topSalespeople.length - 1) 
                           && setAnimateCards(false)}
                       >
                         <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-300'} flex items-center justify-center font-bold mr-2 sm:mr-3 flex-shrink-0`} 
                             style={{ backgroundColor: `${getThemedColor(selectedModel?.color)}20` }}>
                           {salesperson.salespersonName.split(' ').map(n => n[0]).join('')}
                         </div>
                         
                         <div className="flex-grow min-w-0">
                           <div className="flex justify-between items-center flex-wrap gap-1">
                             <h4 className={`text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'} truncate max-w-[70%]`} title={salesperson.salespersonName}>
                               {salesperson.salespersonName}
                             </h4>
                             <span className="px-2 py-1 rounded text-xs whitespace-nowrap" 
                                   style={{ backgroundColor: `${getThemedColor(selectedModel?.color)}20`, color: getThemedColor(selectedModel?.color) }}>
                               {index === 0 && !showAllSalespeople ? 
                                 t('salespeople.bestSalesperson', { defaultValue: '🏆 Лучший продавец' }) : 
                                 `#${index + 1}`}
                             </span>
                           </div>
                           
                           <div className="flex items-center mt-1 flex-wrap gap-1">
                             <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs sm:text-sm`}>{t('models.sales', { defaultValue: 'Продажи' })}:</div>
                             <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-bold text-xs sm:text-sm ml-1 sm:ml-2`}>{salesperson.sales.toLocaleString()}</div>
                             
                             <div className="ml-auto flex items-center mt-1 sm:mt-0 w-full sm:w-auto">
                               <div className={`h-1.5 sm:h-2 w-full sm:w-24 ${isDark ? 'bg-gray-700' : 'bg-gray-300'} rounded-full mr-2`}>
                                 <motion.div 
                                   initial={{ width: 0 }}
                                   animate={{ width: `${(salesperson.sales / Math.max(...filteredSalespersonData.map(d => d.sales))) * 100}%` }}
                                   transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                                   className="h-full rounded-full"
                                   style={{ backgroundColor: getThemedColor(selectedModel?.color) }}
                                 />
                               </div>
                               <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} whitespace-nowrap`}>
                                 {Math.round((salesperson.sales / filteredSalespersonData.reduce((sum, d) => sum + d.sales, 0)) * 100)}%
                               </span>
                             </div>
                           </div>
                         </div>
                       </motion.div>
                     ))}
                   </div>
                   
                   {filteredSalespersonData.length > 5 && (
                     <motion.button
                       whileHover={{ scale: 1.02 }}
                       whileTap={{ scale: 0.98 }}
                       onClick={() => setShowAllSalespeople(!showAllSalespeople)}
                       className={`w-full mt-3 py-2 ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} rounded transition-colors text-xs sm:text-sm`}
                     >
                       {showAllSalespeople 
                         ? t('salespeople.showTop', { count: 5, defaultValue: "Показать только топ-5 продавцов" })
                         : t('salespeople.showAll', { count: filteredSalespersonData.length - 5, defaultValue: `Показать всех продавцов (${filteredSalespersonData.length - 5} ещё)` })
                       }
                     </motion.button>
                   )}
                 </div>
               </>
             ) : (
               <>
                 <div ref={dealerPaymentsChartRef} className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg overflow-hidden shadow-lg`}></div>
               </>
             )}
           </div>
         </div>
         
         <h2 className={`text-xl sm:text-2xl font-bold mb-4 md:mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`} style={{ color: getThemedColor(selectedModel?.color) }}>
           {selectedModel && selectedDealer ? 
             `${selectedModel.name} - ${viewMode === 'general' ? 
               t('models.sales', { defaultValue: 'Продажи' }) : 
               t('payments.title', { defaultValue: 'Финансы' })} 
             в ${selectedDealer.dealerName}` : ''}
         </h2>
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
           <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-3 sm:p-4 rounded-lg shadow-md`}>
             <div ref={salespersonChartRef} className="w-full h-[300px] sm:h-[400px]"></div>
           </div>
           
           <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-3 sm:p-4 rounded-lg shadow-md`}>
             <div ref={salespersonSecondaryChartRef} className="w-full h-[300px] sm:h-[400px]"></div>
           </div>
         </div>
       </motion.div>
     )}
   </div>
 );
}