"use client";

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { D3Visualizer } from '@/src/utils/dataVisualizer';
import * as d3 from 'd3';
import { carModels } from '@/src/shared/mocks/mock-data';
import ContentReadyLoader from '@/src/shared/layout/ContentReadyLoader';

export default function Statistics() {
  // State variables
  const [isLoading, setIsLoading] = useState(true); // Добавляем состояние загрузки
  const [view, setView] = useState('models');
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [chartType, setChartType] = useState('bar');
  const [animateCards, setAnimateCards] = useState(true);
const [showAllSalespeople, setShowAllSalespeople] = useState(false);
  const [data, setData] = useState({
    modelData: [],
    dealerData: [],
    salespersonData: [],
    trendData: [],
    paymentData: [] // Состояние для данных о платежах
  });
  
  // Режим просмотра детализации платежей
  const [viewMode, setViewMode] = useState('general'); // 'general' или 'payments'
  
  // Период времени - состояние
  const [dateRange, setDateRange] = useState({
    // Устанавливаем 1 января текущего года
    startDate: new Date(new Date().getFullYear(), 0, 1),
    endDate: new Date(), // Текущая дата
    preset: 'thisYear' // Обновляем пресет в соответствии с выбранным периодом
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

  // Функция для получения данных за выбранный период
  const fetchMarketData = async (startDate, endDate) => {
    setIsLoading(true); // Устанавливаем состояние загрузки при начале запроса
    
    try {
      // Форматирование дат в требуемый формат DD.MM.YYYY
      const formatDateForApi = (date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
      };

      const requestBody = {
        begin_date: formatDateForApi(startDate),
        end_date: formatDateForApi(endDate)
      };

      console.log('Отправляем запрос с данными:', requestBody);

      const response = await fetch('https://uzavtosalon.uz/b/dashboard/infos&auto_statistics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Ошибка запроса: ${response.status}`);
      }

      const apiData = await response.json();
      console.log('Получены данные с сервера:', apiData);
      
      // Преобразуем данные из API в формат, понятный компоненту
      const transformedData = transformApiData(apiData);
      
      // Обновляем состояние компонента
      setData(transformedData);
      setIsLoading(false); // Отключаем состояние загрузки
      
      return apiData;
    } catch (error) {
      console.error('Ошибка при получении данных рынка:', error);
      // В случае ошибки загружаем демо-данные
      const fallbackData = generateDemoData(dateRange.startDate, dateRange.endDate);
      setData(fallbackData);
      setIsLoading(false); // Отключаем состояние загрузки даже в случае ошибки
      return null;
    }
  };
  
const transformApiData = (apiData) => {
  // Цвета для моделей
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];
  
  // Фильтрация моделей, у которых есть модификации (есть продажи)
  const modelsWithModifications = apiData.filter(model => {
    // Проверяем, есть ли у модели данные о продажах
    if (!model.filter_by_month || !model.filter_by_month.length) {
      return false;
    }
    
    // Проверяем наличие дилеров и продаж
    for (const monthData of model.filter_by_month) {
      if (!monthData.dealers || !monthData.dealers.length) {
        continue;
      }
      
      for (const dealer of monthData.dealers) {
        if (!dealer.user_list || !dealer.user_list.length) {
          continue;
        }
        
        // Проверяем, есть ли продажи
        for (const user of dealer.user_list) {
          if (parseInt(user.contract) > 0) {
            return true; // Нашли продажи - модель имеет модификации
          }
        }
      }
    }
    
    return false; // Продаж не найдено
  });
  
  // Преобразуем модели
  const modelData = modelsWithModifications.map((model, index) => {
    return {
      id: model.model_id,
      name: model.model_name,
      color: colors[index % colors.length],
      img: model.photo_sha ? `https://uzavtosalon.uz/b/core/m$load_image?sha=${model.photo_sha}&width=400&height=400` : null,
      category: getCategoryFromName(model.model_name), // Определяем категорию по имени
      totalSales: calculateTotalSales(model) // Вычисляем общие продажи модели
    };
  });
  
  // Преобразуем данные о дилерах
  const dealerData = [];
  modelsWithModifications.forEach(model => {
    // Объединяем данные дилеров по всем месяцам
    if (model.filter_by_month && model.filter_by_month.length) {
      model.filter_by_month.forEach(monthData => {
        if (monthData.dealers && monthData.dealers.length) {
          monthData.dealers.forEach(dealer => {
            // Подсчитываем общие продажи дилера для этой модели
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
  
  // Агрегируем данные о дилерах (суммируем продажи за все месяцы)
  const aggregatedDealerData = aggregateDealerData(dealerData);
  
  // Преобразуем данные о продавцах с агрегацией по идентичным ID и именам
  const salespersonMap = new Map(); // Используем карту для агрегации
  modelsWithModifications.forEach(model => {
    if (model.filter_by_month && model.filter_by_month.length) {
      model.filter_by_month.forEach(monthData => {
        if (monthData.dealers && monthData.dealers.length) {
          monthData.dealers.forEach(dealer => {
            if (dealer.user_list && dealer.user_list.length) {
              dealer.user_list.forEach(user => {
                // Создаем уникальный ключ для комбинации модели, дилера и продавца
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
                
                // Если такая комбинация уже есть, суммируем продажи
                if (salespersonMap.has(key)) {
                  const existingPerson = salespersonMap.get(key);
                  existingPerson.sales += salesPersonData.sales;
                } else {
                  // Если новая комбинация, добавляем в карту
                  salespersonMap.set(key, salesPersonData);
                }
              });
            }
          });
        }
      });
    }
  });
  
  // Преобразуем карту обратно в массив
  const salespersonData = Array.from(salespersonMap.values());
  
  // Генерируем данные тренда на основе месяцев из API
  const trendData = generateTrendDataFromApi(modelsWithModifications);
  
  // Генерируем данные о платежах (пока заглушка, т.к. в API нет этих данных)
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
    // Простая логика определения категории по имени
    const nameLower = modelName.toLowerCase();
    if (nameLower.includes('tahoe')) return 'suv';
    if (nameLower.includes('cobalt') || nameLower.includes('nexia')) return 'sedan';
    return 'sedan'; // По умолчанию седан
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
    
    // Группируем данные по месяцам
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
    
    // Преобразуем Map в массив объектов для тренда
    for (const [month, sales] of salesByMonth.entries()) {
      trendData.push({
        date: month, // Формат: YYYY-MM
        sales: sales
      });
    }
    
    // Сортируем по дате
    trendData.sort((a, b) => a.date.localeCompare(b.date));
    
    return trendData;
  };
  
  // Заглушка для данных о платежах, которых нет в API
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
        // Генерируем детали по отдельным транзакциям
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
    // Устанавливаем период с 1 января текущего года по текущую дату
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const today = new Date();
    
    // Обновляем состояние диапазона дат
    setDateRange({
      startDate: startOfYear,
      endDate: today,
      preset: 'thisYear'
    });
    
    // Загружаем данные за этот период
    fetchMarketData(startOfYear, today);
  }, []);
  
  // Функция для пагинации дилеров
  const getPaginatedDealers = () => {
    // Сортируем дилеров по продажам от большего к меньшему
    const sortedDealers = [...filteredDealerData].sort((a, b) => b.sales - a.sales);
    
    const start = (currentPage - 1) * dealersPerPage;
    return sortedDealers.slice(start, start + dealersPerPage);
  };
  
  // Общее количество страниц для пагинации
  const totalPages = Math.ceil(filteredDealerData.length / dealersPerPage);

  const filteredSalespersonData = (selectedModel && selectedDealer)
    ? data.salespersonData.filter(
        d => d.modelId === selectedModel.id && d.dealerId === selectedDealer.dealerId
      )
    : [];
    
// Получаем топ-10 продавцов для всех дилеров
const getGlobalTopSalespeople = () => {
  // Создаем карту для агрегации продаж по каждому продавцу
  const salesByPerson = new Map();
  
  // Проходим по всем записям о продавцах
  data.salespersonData.forEach(person => {
    // Проверяем, не является ли это онлайн-продавцом
    const isOnlineSalesperson = person.salespersonName.toLowerCase().includes('online') || 
                               person.dealerName.toLowerCase().includes('online');
    
    // Создаем ключ для идентификации продавца
    const key = `${person.salespersonId}-${person.salespersonName}`;
    
    // Если этот продавец уже есть в карте, обновляем существующую запись
    if (salesByPerson.has(key)) {
      const existingRecord = salesByPerson.get(key);
      existingRecord.totalSales += person.sales;
      existingRecord.isOnline = existingRecord.isOnline || isOnlineSalesperson;
      
      // Добавляем запись об этом дилере, если её ещё нет и это не онлайн-продавец
      // либо если у этого продавца ещё нет ни одного дилера
      if ((!isOnlineSalesperson || existingRecord.dealers.length === 0) && 
          !existingRecord.dealers.some(d => d.dealerId === person.dealerId)) {
        
        // Извлекаем регион из названия дилера или устанавливаем значение по умолчанию
        const region = extractRegionFromDealerName(person.dealerName);
        
        existingRecord.dealers.push({
          dealerId: person.dealerId,
          dealerName: person.dealerName,
          region: region,
          sales: person.sales
        });
      } else if (existingRecord.dealers.some(d => d.dealerId === person.dealerId)) {
        // Обновляем продажи у существующего дилера
        const dealerRecord = existingRecord.dealers.find(d => d.dealerId === person.dealerId);
        dealerRecord.sales += person.sales;
      }
    } else {
      // Извлекаем регион из названия дилера
      const region = extractRegionFromDealerName(person.dealerName);
      
      // Создаём новую запись для этого продавца
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
  
  // Функция для извлечения региона из названия дилера
  function extractRegionFromDealerName(dealerName) {
    // Примеры логики определения региона из названия дилера
    // Это можно настроить в зависимости от формата названий дилеров
    
    // Проверим наличие города в скобках, например "АвтоСалон (Ташкент)"
    const cityInBrackets = dealerName.match(/\(([^)]+)\)/);
    if (cityInBrackets && cityInBrackets[1]) return cityInBrackets[1].trim();
    
    // Проверим, есть ли в названии какой-то известный город
    const knownCities = ['Ташкент', 'Самарканд', 'Бухара', 'Андижан', 'Наманган', 'Фергана'];
    for (const city of knownCities) {
      if (dealerName.includes(city)) return city;
    }
    
    // Если в названии есть 'г.' или 'город', пытаемся извлечь название города
    const cityPattern = /(?:г\.|город)\s+([А-Яа-я-]+)/i;
    const cityMatch = dealerName.match(cityPattern);
    if (cityMatch && cityMatch[1]) return cityMatch[1].trim();
    
    // Если не смогли определить, возвращаем значение по умолчанию
    return 'Неизвестный регион';
  }
  
  // Преобразуем карту в массив и определяем основного дилера для каждого продавца
  const allSalespeople = Array.from(salesByPerson.values()).map(person => {
    // Сортируем дилеров по количеству продаж (от большего к меньшему)
    person.dealers.sort((a, b) => b.sales - a.sales);
    
    // Определяем основного дилера (с наибольшим количеством продаж)
    const mainDealer = person.dealers.length > 0 ? person.dealers[0] : null;
    
    // Группируем дилеров по регионам
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
      // Если есть продажи у нескольких дилеров, добавляем флаг
      hasMultipleDealers: person.dealers.length > 1
    };
  });
  
  // Сортируем и берем топ-10
  return allSalespeople
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 10);
};
  
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
    // Загружаем данные за выбранный период
    fetchMarketData(range.startDate, range.endDate)
      .catch(error => {
        console.error('Ошибка при обновлении данных:', error);
        // Если API недоступен, используем демо-данные
        const fallbackData = generateDemoData(range.startDate, range.endDate);
        setData(fallbackData);
        setIsLoading(false); // Отключаем состояние загрузки в случае ошибки
      });
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
  }
  
  // Вместо графика возвратов отображаем динамику продаж по месяцам
  renderModelTimelineChart();
  
  // Полностью переработанный код для тренда продаж
  if (trendChartRef.current && data.trendData.length) {
    // Очищаем контейнер тренда
    const trendContainer = trendChartRef.current;
    trendContainer.innerHTML = '';
    
    // Настройка размеров графика
    const trendWidth = trendContainer.clientWidth;
    const trendHeight = 380; // Увеличиваем высоту еще больше
    const trendMargin = { top: 70, right: 30, bottom: 60, left: 60 }; // Увеличиваем верхний отступ для меток значений
    
    const trendChartWidth = trendWidth - trendMargin.left - trendMargin.right;
    const trendChartHeight = trendHeight - trendMargin.top - trendMargin.bottom;
    
    // Создаем SVG элемент
    const trendSvg = d3.select(trendContainer)
      .append('svg')
      .attr('width', trendWidth)
      .attr('height', trendHeight)
      .style('background', '#1f2937')
      .style('border-radius', '0.5rem');
    
    // Добавляем заголовок
    trendSvg.append('text')
      .attr('x', trendWidth / 2)
      .attr('y', 30) // Размещаем заголовок ближе к верху
      .attr('text-anchor', 'middle')
      .style('font-size', '1.2rem')
      .style('font-weight', 'bold')
      .style('fill', '#f9fafb')
      .text(`Тренд продаж за период: ${getDateRangeLabel()}`);
    
    // Сортируем данные тренда по дате
    const sortedTrendData = [...data.trendData].sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });
    
    // Обрабатываем и форматируем данные
    const processedData = sortedTrendData.map(d => {
      // Пытаемся форматировать дату
      let monthLabel = d.date;
      try {
        const [year, month] = d.date.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        monthLabel = date.toLocaleString('ru', { month: 'short' });
        
        // Добавляем год, если это январь или первый месяц в наборе данных
        if (date.getMonth() === 0 || date === new Date(sortedTrendData[0].date)) {
          monthLabel = `${monthLabel} ${date.getFullYear()}`;
        }
      } catch (e) {
        // Если не удалось распарсить, оставляем как есть
      }
      
      return {
        ...d,
        monthLabel
      };
    });
    
    // Настраиваем шкалы
    const trendX = d3.scaleBand()
      .domain(processedData.map(d => d.date))
      .range([0, trendChartWidth])
      .padding(0.3);
    
    const trendY = d3.scaleLinear()
      .domain([0, d3.max(processedData, d => d.sales) * 1.2]) // Увеличиваем верхнюю границу, чтобы было место для меток
      .nice()
      .range([trendChartHeight, 0]);
    
    // Основная группа для графика
    const trendG = trendSvg.append('g')
      .attr('transform', `translate(${trendMargin.left}, ${trendMargin.top})`);
    
    // Добавляем горизонтальные направляющие линии
    trendG.selectAll('.grid-line')
      .data(trendY.ticks(5))
      .join('line')
      .attr('class', 'grid-line')
      .attr('x1', 0)
      .attr('x2', trendChartWidth)
      .attr('y1', d => trendY(d))
      .attr('y2', d => trendY(d))
      .attr('stroke', '#374151')
      .attr('stroke-dasharray', '2,2')
      .attr('stroke-width', 1);
    
    // Добавляем оси
    trendG.append('g')
      .attr('transform', `translate(0, ${trendChartHeight})`)
      .call(d3.axisBottom(trendX).tickFormat(i => {
        const item = processedData.find(d => d.date === i);
        return item ? item.monthLabel : '';
      }))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text')
        .style('fill', '#f9fafb')
        .style('font-size', '0.8rem')
        .attr('text-anchor', 'middle'));
    
    trendG.append('g')
      .call(d3.axisLeft(trendY).ticks(5))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text').style('fill', '#f9fafb'));
    
    // Добавляем подписи осей
    trendG.append('text')
      .attr('y', trendChartHeight + 45)
      .attr('x', trendChartWidth / 2)
      .attr('text-anchor', 'middle')
      .style('fill', '#9ca3af')
      .style('font-size', '0.9rem')
      .text('Месяц');
    
    trendG.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -45)
      .attr('x', -trendChartHeight / 2)
      .attr('text-anchor', 'middle')
      .style('fill', '#9ca3af')
      .style('font-size', '0.9rem')
      .text('Количество продаж');
    
    // Группа для столбцов и их меток
    const barsGroup = trendG.append('g')
      .attr('class', 'bars-group');
    
    // Добавляем столбцы
    const trendBars = barsGroup.selectAll('.trend-bar')
      .data(processedData)
      .join('rect')
      .attr('class', 'trend-bar')
      .attr('x', d => trendX(d.date))
      .attr('y', d => trendY(d.sales))
      .attr('width', trendX.bandwidth())
      .attr('height', d => trendChartHeight - trendY(d.sales))
      .attr('rx', 4) // Скругленные углы для столбцов
      .attr('fill', (d, i) => {
        // Создаем более выраженный градиент от светло-голубого к зеленому
        const colorIndex = i / processedData.length; // от 0 до 1
        return d3.interpolateTurbo(0.2 + colorIndex * 0.4); // Более яркий цветовой градиент
      })
      .attr('opacity', 0.9)
      .attr('cursor', 'pointer')
      .on('mouseover', function() {
        // Просто подсвечиваем столбец при наведении
        d3.select(this)
          .transition()
          .duration(150)
          .attr('opacity', 1);
      })
      .on('mouseout', function() {
        // Возвращаем столбец к исходному виду
        d3.select(this)
          .transition()
          .duration(150)
          .attr('opacity', 0.9);
      })
      .transition()
      .duration(500)
      .delay((_, i) => i * 50)
      .attr('opacity', 0.9);
    
    // Добавляем значения продаж прямо над столбцами
    barsGroup.selectAll('.value-label')
      .data(processedData)
      .join('text')
      .attr('class', 'value-label')
      .attr('x', d => trendX(d.date) + trendX.bandwidth() / 2)
      .attr('y', d => trendY(d.sales) - 10) // Размещаем на 10px выше столбца
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .style('fill', '#ffffff')
      .text(d => d.sales.toLocaleString())
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .delay((_, i) => i * 50 + 500) // Появляются после столбцов
      .attr('opacity', 1);
    
    // Добавляем линию тренда, если есть достаточное количество точек
    if (processedData.length > 1) {
      // Функция для линии тренда
      const trendLine = d3.line()
        .x(d => trendX(d.date) + trendX.bandwidth() / 2)
        .y(d => trendY(d.sales))
        .curve(d3.curveMonotoneX);
      
      // Добавляем линию тренда
      trendG.append('path')
        .datum(processedData)
        .attr('fill', 'none')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
        .attr('stroke-opacity', 0.7)
        .attr('d', trendLine)
        .attr('opacity', 0)
        .transition()
        .duration(1000)
        .delay(processedData.length * 50)
        .attr('opacity', 1);
      
      // Добавляем точки на линию тренда
      trendG.selectAll('.trend-dot')
        .data(processedData)
        .join('circle')
        .attr('class', 'trend-dot')
        .attr('cx', d => trendX(d.date) + trendX.bandwidth() / 2)
        .attr('cy', d => trendY(d.sales))
        .attr('r', 4)
        .attr('fill', 'white')
        .attr('stroke', '#1f2937')
        .attr('stroke-width', 2)
        .attr('opacity', 0)
        .transition()
        .duration(300)
        .delay((_, i) => processedData.length * 50 + 1000 + i * 100)
        .attr('opacity', 1);
      
      // Вычисляем изменение в продажах между первым и последним периодом
      const firstSales = processedData[0].sales;
      const lastSales = processedData[processedData.length - 1].sales;
      const salesDiff = lastSales - firstSales;
      const percentChange = firstSales > 0 ? (salesDiff / firstSales) * 100 : 0;
    }
  }
};

const renderModelTimelineChart = () => {
  if (!modelSecondaryChartRef.current || !data.modelData.length || !data.trendData.length) return;

  // Очищаем контейнер
  const container = modelSecondaryChartRef.current;
  container.innerHTML = '';
  
  // Получаем все уникальные месяцы из данных trendData
  const allMonths = [...new Set(data.trendData.map(d => d.date))].sort();
  
  // Если данных не за полные 6 месяцев, возьмем последние 6 или сколько есть
  const months = allMonths.slice(-6);
  
  // Вычисляем названия месяцев для отображения
  const monthNames = months.map(monthStr => {
    try {
      const [year, month] = monthStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleString('ru', { month: 'short' });
    } catch (e) {
      // Если не удалось распарсить дату, вернем исходную строку
      return monthStr;
    }
  });
  
  // Берем только топ-6 моделей по продажам
  const topModels = [...data.modelData]
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 6);
  
  // Настройка размеров графика
  const width = container.clientWidth;
  const height = 400;
  const margin = { top: 40, right: 120, bottom: 60, left: 60 }; // Увеличиваем правый отступ для легенды
  
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  // Создаем SVG элемент
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('background', '#1f2937')
    .style('border-radius', '0.5rem');
  
  // Добавляем заголовок
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', margin.top / 2)
    .attr('text-anchor', 'middle')
    .style('font-size', '1.2rem')
    .style('font-weight', 'bold')
    .style('fill', '#f9fafb')
    .text(`Динамика продаж по месяцам (${getDateRangeLabel()})`);
  
  // Вычисляем общую сумму продаж для всех моделей
  const totalModelSales = topModels.reduce((sum, model) => sum + model.totalSales, 0);
  
  // Создаем данные для линейного графика с нормализацией на основе общего тренда
  const lineData = topModels.map((model, modelIndex) => {
    // Для каждой модели вычислим её долю в общих продажах
    const modelShare = totalModelSales > 0 ? model.totalSales / totalModelSales : 1 / topModels.length;
    
    // Применяем небольшое отклонение для визуального разделения линий
    // Для каждой модели используем разный "смещающий" коэффициент
    const deviation = 0.8 + (modelIndex * 0.1); // От 0.8 до 1.3 для 6 моделей
    
    const monthlySales = months.map((month, i) => {
      // Находим данные тренда для этого месяца
      const trendEntry = data.trendData.find(t => t.date === month);
      
      // Вычисляем реальные продажи модели в этом месяце
      let actualValue = 0;
      if (trendEntry && trendEntry.sales) {
        actualValue = Math.round(trendEntry.sales * modelShare);
      } else {
        // Если нет данных, пропорционально распределяем общие продажи модели
        actualValue = Math.round(model.totalSales / months.length);
      }
      
      // Применяем коэффициент отклонения для визуального разделения линий
      const visualValue = Math.round(actualValue * deviation);
      
      return {
        date: month,
        month: monthNames[i],
        value: visualValue, // Значение для построения графика с визуальным отклонением
        actualValue: actualValue, // Оригинальное значение для отображения в подсказке
        model: model
      };
    });
    
    return {
      model: model,
      values: monthlySales
    };
  });
  
  // Настраиваем шкалы
  const x = d3.scaleBand()
    .domain(months)
    .range([0, chartWidth])
    .padding(0.1);
  
  // Находим максимальное значение продаж для определения шкалы Y
  const maxVisualSales = d3.max(lineData, d => d3.max(d.values, v => v.value)) || 0;
  
  const y = d3.scaleLinear()
    .domain([0, maxVisualSales * 1.1]) // Добавляем 10% отступ сверху
    .range([chartHeight, 0]);
  
  // Основная группа для графика
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
  // Добавляем оси
  g.append('g')
    .attr('transform', `translate(0, ${chartHeight})`)
    .call(d3.axisBottom(x).tickFormat((d, i) => monthNames[i % monthNames.length]))
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('text')
      .style('fill', '#f9fafb')
      .style('font-size', '0.8rem')
      .attr('transform', 'rotate(-15)') // Небольшой наклон подписей для лучшей читаемости
      .attr('text-anchor', 'end')
      .attr('dx', '-0.8em')
      .attr('dy', '0.15em'));
  
  g.append('g')
    .call(d3.axisLeft(y).ticks(5))
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('text').style('fill', '#f9fafb'))
    .call(g => g.selectAll('.tick line')
      .attr('x2', chartWidth)
      .attr('stroke-opacity', 0.1));
  
  // Создаем функцию для построения линии
  const line = d3.line()
    .x(d => x(d.date) + x.bandwidth() / 2)
    .y(d => y(d.value)) // Используем визуальное значение для позиционирования
    .curve(d3.curveMonotoneX);
  
  // Добавляем линии для каждой модели
  lineData.forEach((d, i) => {
    // Группируем все элементы, относящиеся к одной линии
    const lineGroup = g.append('g')
      .attr('class', `line-group-${i}`);
    
    // Добавляем фоновую линию с обводкой для лучшей видимости
    lineGroup.append('path')
      .datum(d.values)
      .attr('fill', 'none')
      .attr('stroke', '#000')
      .attr('stroke-width', 6)
      .attr('stroke-opacity', 0.3)
      .attr('d', line)
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .delay(i * 100)
      .attr('opacity', 0.7);
    
    // Добавляем основную линию
    lineGroup.append('path')
      .datum(d.values)
      .attr('fill', 'none')
      .attr('stroke', d.model.color)
      .attr('stroke-width', 3)
      .attr('d', line)
      .style('cursor', 'pointer')
      .on('click', () => handleModelClick(d.model))
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .delay(i * 100)
      .attr('opacity', 1);
    
    // Добавляем точки на линию
    lineGroup.selectAll(`.dot-${i}`)
      .data(d.values)
      .join('circle')
      .attr('class', `dot-${i}`)
      .attr('cx', v => x(v.date) + x.bandwidth() / 2)
      .attr('cy', v => y(v.value)) // Используем визуальное значение для позиционирования
      .attr('r', 5)
      .attr('fill', d.model.color)
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', () => handleModelClick(d.model))
      .on('mouseover', function(event, v) {
        // Увеличиваем точку при наведении
        d3.select(this)
          .transition()
          .duration(100)
          .attr('r', 8);
        
        // Выделяем линию при наведении
        lineGroup.selectAll('path')
          .transition()
          .duration(100)
          .attr('stroke-width', function() {
            return parseFloat(this.getAttribute('stroke-width') || '3') * 1.5;
          });
        
        // Отображаем текст с ОРИГИНАЛЬНЫМ значением продаж
        const valueText = g.append('text')
          .attr('class', 'temp-value')
          .attr('x', x(v.date) + x.bandwidth() / 2)
          .attr('y', y(v.value) - 20)
          .attr('text-anchor', 'middle')
          .attr('font-size', '12px')
          .attr('font-weight', 'bold')
          .attr('fill', d.model.color)
          .text(`${v.actualValue.toLocaleString()} (${d.model.name})`);
        
        // Добавляем фон для улучшения читаемости
        const bbox = valueText.node().getBBox();
        
        g.insert('rect', '.temp-value')
          .attr('class', 'temp-value-bg')
          .attr('x', bbox.x - 5)
          .attr('y', bbox.y - 2)
          .attr('width', bbox.width + 10)
          .attr('height', bbox.height + 4)
          .attr('rx', 3)
          .attr('fill', 'rgba(0, 0, 0, 0.8)');
      })
      .on('mouseout', function() {
        // Уменьшаем точку при отведении курсора
        d3.select(this)
          .transition()
          .duration(100)
          .attr('r', 5);
        
        // Возвращаем линию к обычной толщине
        lineGroup.selectAll('path')
          .transition()
          .duration(100)
          .attr('stroke-width', function() {
            const currentWidth = parseFloat(this.getAttribute('stroke-width') || '3');
            return currentWidth / 1.5;
          });
        
        // Удаляем временный текст и фон
        g.selectAll('.temp-value').remove();
        g.selectAll('.temp-value-bg').remove();
      })
      .attr('opacity', 0)
      .transition()
      .duration(300)
      .delay((_, j) => i * 100 + j * 100 + 500)
      .attr('opacity', 1);
    
    // Добавляем текст с названием модели и последним значением в конце линии
    if (d.values.length > 0) {
      const lastValue = d.values[d.values.length - 1];
      g.append('text')
        .attr('x', x(lastValue.date) + x.bandwidth() / 2 + 10)
        .attr('y', y(lastValue.value))
        .text(`${d.model.name}`)
        .attr('text-anchor', 'start')
        .attr('dominant-baseline', 'middle')
        .attr('fill', d.model.color)
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .attr('opacity', 0)
        .transition()
        .duration(300)
        .delay(i * 100 + 1000)
        .attr('opacity', 1);
    }
  });
  
  // Добавляем улучшенную легенду
  const legendGroup = svg.append('g')
    .attr('transform', `translate(${width - margin.right + 20}, ${margin.top + 20})`);
  
  // Добавляем заголовок для легенды
  legendGroup.append('text')
    .attr('x', 0)
    .attr('y', -10)
    .attr('text-anchor', 'start')
    .style('font-size', '0.8rem')
    .style('font-weight', 'bold')
    .style('fill', '#f9fafb')
    .text('Модели:');
  
  // Добавляем элементы легенды с интерактивностью
  topModels.forEach((model, i) => {
    const legendItem = legendGroup.append('g')
      .attr('transform', `translate(0, ${i * 28})`) // Увеличенное расстояние между элементами
      .style('cursor', 'pointer')
      .on('click', () => handleModelClick(model))
      .on('mouseover', function() {
        // Подсвечиваем линию модели
        d3.select(container).select(`.line-group-${i}`)
          .selectAll('path')
          .transition()
          .duration(100)
          .attr('stroke-width', function() {
            return parseFloat(this.getAttribute('stroke-width') || '3') * 1.5;
          });
        
        // Подсвечиваем элемент легенды
        d3.select(this)
          .transition()
          .duration(100)
          .attr('opacity', 0.7);
      })
      .on('mouseout', function() {
        // Возвращаем линию к обычной толщине
        d3.select(container).select(`.line-group-${i}`)
          .selectAll('path')
          .transition()
          .duration(100)
          .attr('stroke-width', function() {
            const currentWidth = parseFloat(this.getAttribute('stroke-width') || '3');
            return currentWidth / 1.5;
          });
        
        // Возвращаем элемент легенды к обычной прозрачности
        d3.select(this)
          .transition()
          .duration(100)
          .attr('opacity', 1);
      });
    
    // Добавляем фон для элемента легенды для лучшей интерактивности
    legendItem.append('rect')
      .attr('x', -5)
      .attr('y', -6)
      .attr('width', 120)
      .attr('height', 25)
      .attr('rx', 4)
      .attr('fill', '#2d3748')
      .attr('opacity', 0.3);
    
    // Цветной индикатор
    legendItem.append('line')
      .attr('x1', 0)
      .attr('y1', 7)
      .attr('x2', 25)
      .attr('y2', 7)
      .attr('stroke', model.color)
      .attr('stroke-width', 3);
    
    // Название модели
    legendItem.append('text')
      .attr('x', 30)
      .attr('y', 7)
      .attr('dominant-baseline', 'middle')
      .text(`${model.name}`)
      .style('font-size', '0.8rem')
      .style('fill', '#f9fafb');
    
    // Продажи модели
    legendItem.append('text')
      .attr('x', 30)
      .attr('y', 20)
      .attr('dominant-baseline', 'middle')
      .text(`${model.totalSales.toLocaleString()}`)
      .style('font-size', '0.65rem')
      .style('fill', '#9ca3af');
  });
};
  
const renderDealerCharts = () => {
  if (!dealerChartRef.current || !dealerSecondaryChartRef.current || !filteredDealerData.length || !selectedModel) return;
  
  // Сортируем дилеров по продажам от большего к меньшему
  const sortedDealerData = [...filteredDealerData].sort((a, b) => b.sales - a.sales);
  
  // Формат данных для D3 визуализатора
  const chartData = sortedDealerData.map(dealer => ({
    id: dealer.dealerId,
    label: dealer.dealerName,
    value: dealer.sales,
    color: selectedModel.color,
    dealer: dealer
  }));
  
  // Берем только топ-20 дилеров для графика, чтобы избежать перегрузки
  const topDealers = chartData.slice(0, 20);
  
  // Primary chart - продажи по дилерам
  if (chartType === 'bar') {
    // Очищаем контейнер
    const container = dealerChartRef.current;
    container.innerHTML = '';
    
    // Настройка размеров графика
    const width = container.clientWidth;
    const height = 400;
    const margin = { top: 40, right: 30, bottom: 150, left: 60 }; // Увеличиваем нижний отступ
    
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    // Создаем SVG элемент
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('background', '#1f2937')
      .style('border-radius', '0.5rem');
    
    // Добавляем заголовок
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '1.2rem')
      .style('font-weight', 'bold')
      .style('fill', '#f9fafb')
      .text(`Топ-20 дилеров ${selectedModel.name} по продажам (${getDateRangeLabel()})`);
    
    // Основная группа для графика
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    // Настраиваем шкалы
    const x = d3.scaleBand()
      .domain(topDealers.map(d => d.id.toString())) // Используем ID как ключи, а не названия
      .range([0, chartWidth])
      .padding(0.4);
    
    const y = d3.scaleLinear()
      .domain([0, d3.max(topDealers, d => d.value) * 1.1])
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
        .attr('stroke', '#374151')
        .attr('stroke-opacity', 0.5)
        .attr('stroke-dasharray', '2,2'));
    
    // Добавляем ось Y
    g.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text')
        .style('fill', '#f9fafb')
        .style('font-size', '0.85rem'));
    
    // Добавляем подпись оси Y
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left + 20)
      .attr('x', -chartHeight / 2)
      .style('fill', '#f9fafb')
      .style('font-size', '0.9rem')
      .text('Количество продаж');
    
    // Вычисляем позиции столбцов на основе индекса, не названия
    const getXPosition = (d, i) => {
      const index = topDealers.findIndex(dealer => dealer.id === d.id);
      return index >= 0 ? x(index.toString()) : 0;
    };
    
    // Добавляем столбцы с интерактивностью
    g.selectAll('.bar')
      .data(topDealers)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', (d, i) => x(d.id.toString()))
      .attr('y', d => y(d.value))
      .attr('width', x.bandwidth())
      .attr('height', d => chartHeight - y(d.value))
      .attr('fill', (d, i) => {
        const baseColor = selectedModel.color;
        const hslColor = d3.hsl(baseColor);
        hslColor.l = 0.4 + (i * 0.03);
        return hslColor.toString();
      })
      .attr('rx', 4) // Скругленные углы
      .style('cursor', 'pointer')
      .on('click', (event, d) => handleDealerClick(d.dealer))
      .on('mouseover', function(event, d) {
        // Увеличиваем столбец при наведении
        d3.select(this)
          .transition()
          .duration(100)
          .attr('opacity', 0.8)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 2);
          
        // Подсвечиваем соответствующую подпись внизу
        g.select(`.dealer-label-${d.id}`)
          .transition()
          .duration(100)
          .style('font-weight', 'bold')
          .style('fill', '#ffffff');
        
        // Отображаем подробную информацию о дилере
        const tooltip = g.append('g')
          .attr('class', 'dealer-tooltip')
          .attr('transform', `translate(${x(d.id.toString()) + x.bandwidth() / 2}, ${y(d.value) - 30})`);
        
        const tooltipText = tooltip.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '-0.5em')
          .style('fill', '#ffffff')
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .text(`${d.value.toLocaleString()}`);
        
        const tooltipLabel = tooltip.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '1em')
          .style('fill', '#ffffff')
          .style('font-size', '11px')
          .text(`${d.label.length > 20 ? d.label.substring(0, 18) + '...' : d.label}`);
        
        const bbox = tooltipLabel.node().getBBox();
        const textHeight = Math.abs(tooltipText.node().getBBox().y - tooltipLabel.node().getBBox().y - tooltipLabel.node().getBBox().height);
        
        tooltip.insert('rect', 'text')
          .attr('x', bbox.x - 6)
          .attr('y', tooltipText.node().getBBox().y - 4)
          .attr('width', bbox.width + 12)
          .attr('height', textHeight + 12)
          .attr('rx', 4)
          .attr('fill', 'rgba(0, 0, 0, 0.8)');
        
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
        g.select(`.dealer-label-${d.id}`)
          .transition()
          .duration(100)
          .style('font-weight', 'normal')
          .style('fill', '#9ca3af');
        
        // Удаляем подсказку
        g.selectAll('.dealer-tooltip').remove();
      })
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .delay((_, i) => i * 30)
      .attr('opacity', 1);
    
    // Добавляем значения над столбцами
    g.selectAll('.value-label')
      .data(topDealers)
      .join('text')
      .attr('class', 'value-label')
      .attr('x', d => x(d.id.toString()) + x.bandwidth() / 2)
      .attr('y', d => y(d.value) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('fill', 'white')
      .text(d => d.value.toLocaleString())
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .delay((_, i) => i * 30 + 500)
      .attr('opacity', 1);
    
    // Создаем контейнер для названий дилеров
    // Используем многострочный макет для лучшего отображения
    
    // Определяем количество столбцов и строк для названий
    // Для топ-20 дилеров используем 5 столбцов и 4 строки
    const labelColumns = 5;
    const labelRows = Math.ceil(topDealers.length / labelColumns);
    
    // Создаем сетку для названий дилеров
    const dealerLabelsGroup = g.append('g')
      .attr('transform', `translate(0, ${chartHeight + 10})`);
    
    // Добавляем названия дилеров в сетку
    topDealers.forEach((dealer, i) => {
      // Вычисляем позицию в сетке
      const row = Math.floor(i / labelColumns);
      const col = i % labelColumns;
      
      // Вычисляем реальные координаты
      const colWidth = chartWidth / labelColumns;
      const rowHeight = 35; // Увеличиваем высоту строки для длинных названий
      
      const xPos = col * colWidth + colWidth / 2;
      const yPos = row * rowHeight + 15;
      
      // Создаем фон для названия
      dealerLabelsGroup.append('rect')
        .attr('x', xPos - colWidth * 0.45)
        .attr('y', yPos - 12)
        .attr('width', colWidth * 0.9)
        .attr('height', 24)
        .attr('rx', 4)
        .attr('fill', '#1f293788')
        .attr('opacity', 0)
        .transition()
        .duration(500)
        .delay(i * 30 + 600)
        .attr('opacity', 1);
      
      // Обрабатываем название дилера для отображения
      const dealerName = dealer.label;
      // Сокращаем длинные названия
      const truncatedName = dealerName.length > 16 ? dealerName.substring(0, 14) + '...' : dealerName;
      
      // Добавляем текст с названием
      dealerLabelsGroup.append('text')
        .attr('class', `dealer-label dealer-label-${dealer.id}`)
        .attr('x', xPos)
        .attr('y', yPos)
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('fill', '#9ca3af')
        .style('cursor', 'pointer')
        .text(truncatedName)
        .on('click', () => handleDealerClick(dealer.dealer))
        .on('mouseover', function() {
          // Подсвечиваем текст
          d3.select(this)
            .transition()
            .duration(100)
            .style('font-weight', 'bold')
            .style('fill', '#ffffff');
          
          // Подсвечиваем соответствующий столбец
          g.selectAll('.bar')
            .filter(d => d.id === dealer.id)
            .transition()
            .duration(100)
            .attr('opacity', 0.8)
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 2);
          
          // Показываем полное название при наведении, если оно было сокращено
          if (dealerName.length > 16) {
            const tooltip = dealerLabelsGroup.append('g')
              .attr('class', 'name-tooltip')
              .attr('transform', `translate(${xPos}, ${yPos - 15})`);
            
            const tooltipText = tooltip.append('text')
              .attr('text-anchor', 'middle')
              .style('fill', '#ffffff')
              .style('font-size', '11px')
              .text(dealerName);
            
            const bbox = tooltipText.node().getBBox();
            
            tooltip.insert('rect', 'text')
              .attr('x', bbox.x - 5)
              .attr('y', bbox.y - 2)
              .attr('width', bbox.width + 10)
              .attr('height', bbox.height + 4)
              .attr('rx', 3)
              .attr('fill', 'rgba(0, 0, 0, 0.8)');
            
            tooltipText.raise();
          }
        })
        .on('mouseout', function() {
          // Возвращаем текст к нормальному виду
          d3.select(this)
            .transition()
            .duration(100)
            .style('font-weight', 'normal')
            .style('fill', '#9ca3af');
          
          // Возвращаем столбец к нормальному виду
          g.selectAll('.bar')
            .filter(d => d.id === dealer.id)
            .transition()
            .duration(100)
            .attr('opacity', 1)
            .attr('stroke', 'none');
          
          // Удаляем всплывающую подсказку
          dealerLabelsGroup.selectAll('.name-tooltip').remove();
        })
        .attr('opacity', 0)
        .transition()
        .duration(500)
        .delay(i * 30 + 600)
        .attr('opacity', 1);
    });
    
  } else if (chartType === 'pie') {
    // Для круговой диаграммы будем использовать нативный D3.js для минималистичного отображения
    const container = dealerChartRef.current;
    container.innerHTML = '';
    
    // Настройка размеров графика
    const width = container.clientWidth;
    const height = 400;
    const margin = { top: 40, right: 20, bottom: 20, left: 20 };
    
    // Создаем SVG элемент
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('background', '#1f2937')
      .style('border-radius', '0.5rem');
    
    // Добавляем только заголовок
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '1.2rem')
      .style('font-weight', 'bold')
      .style('fill', '#f9fafb')
      .text(`Доля продаж ${selectedModel.name} по топ-20 дилерам (${getDateRangeLabel()})`);
    
    // Вычисляем радиус и центр для круговой диаграммы - делаем её максимально большой
    const radius = Math.min(width, height) / 2 - Math.max(margin.top, margin.right, margin.bottom, margin.left);
    const center = {
      x: width / 2,
      y: height / 2
    };
    
    // Создаем функцию для генерации секторов круговой диаграммы
    const pie = d3.pie()
      .value(d => d.value)
      .sort(null); // Не сортировать, чтобы сохранить порядок по продажам
    
    // Создаем арки для секторов
    const arc = d3.arc()
      .innerRadius(0) // 0 для обычной круговой диаграммы
      .outerRadius(radius * 0.8); // Немного уменьшаем для отступов
    
    // Создаем дугу для подписей
    const labelArc = d3.arc()
      .innerRadius(radius * 0.5)
      .outerRadius(radius * 0.7);
    
    // Создаем цветовую схему
    const colorScale = d3.scaleOrdinal()
      .domain(topDealers.map(d => d.id))
      .range(topDealers.map((_, i) => {
        const baseColor = selectedModel.color;
        const hslColor = d3.hsl(baseColor);
        hslColor.l = 0.4 + (i * 0.025); // Мягкий градиент
        return hslColor.toString();
      }));
    
    // Создаем группу для диаграммы и центрируем её
    const pieGroup = svg.append('g')
      .attr('transform', `translate(${center.x}, ${center.y})`);
    
    // Создаем секторы
    const arcs = pieGroup.selectAll('.arc')
      .data(pie(topDealers))
      .enter()
      .append('g')
      .attr('class', 'arc')
      .style('cursor', 'pointer')
      .on('click', (event, d) => handleDealerClick(d.data.dealer));
    
    // Добавляем секторы с анимацией
    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => colorScale(d.data.id))
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 1)
      .attr('opacity', 0.9)
      .on('mouseover', function(event, d) {
        // Подсвечиваем сектор при наведении
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 1)
          .attr('transform', 'scale(1.05)');
        
        // Показываем название дилера при наведении
        const angle = (d.startAngle + d.endAngle) / 2;
        const centroid = labelArc.centroid(d);
        
        // Вычисляем процент от общих продаж
        const totalSales = topDealers.reduce((sum, dealer) => sum + dealer.value, 0);
        const percent = (d.data.value / totalSales) * 100;
        
        // Добавляем временную всплывающую подсказку
        const tooltip = pieGroup.append('g')
          .attr('class', 'pie-tooltip')
          .attr('transform', `translate(${centroid[0]}, ${centroid[1]})`);
        
        // Добавляем текст с названием дилера
        tooltip.append('text')
          .attr('dy', '-1.2em')
          .attr('text-anchor', 'middle')
          .style('font-size', '11px')
          .style('font-weight', 'bold')
          .style('fill', '#ffffff')
          .text(d.data.label.length > 25 ? d.data.label.substring(0, 25) + '...' : d.data.label);
        
        // Добавляем текст с количеством продаж и процентом
        tooltip.append('text')
          .attr('dy', '0em')
          .attr('text-anchor', 'middle')
          .style('font-size', '10px')
          .style('fill', '#ffffff')
          .text(`${d.data.value.toLocaleString()} (${Math.round(percent)}%)`);
      })
      .on('mouseout', function() {
        // Возвращаем сектор к обычному виду
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 0.9)
          .attr('transform', 'scale(1)');
        
        // Удаляем временную подсказку
        pieGroup.selectAll('.pie-tooltip').remove();
      })
      .transition()
      .duration(800)
      .attrTween('d', function(d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function(t) {
          return arc(interpolate(t));
        };
      });
    
    // Добавляем процентные значения на все секторы
    const totalSales = topDealers.reduce((sum, d) => sum + d.value, 0);
    arcs.append('text')
      .attr('transform', d => {
        const centroid = labelArc.centroid(d);
        return `translate(${centroid})`;
      })
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .text(d => {
        const percent = (d.data.value / totalSales) * 100;
        return percent >= 3 ? `${Math.round(percent)}%` : ''; // Показываем проценты для всех секторов >= 3%
      })
      .style('fill', '#ffffff')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .style('pointer-events', 'none') // Чтобы текст не мешал кликам
      .attr('opacity', 0)
      .transition()
      .delay(800)
      .duration(500)
      .attr('opacity', 1);
      
    // Добавляем легенду для топ-5 дилеров
    const legendGroup = svg.append('g')
      .attr('transform', `translate(${width - 200}, ${height - 150})`);
      
    // Заголовок легенды
    legendGroup.append('text')
      .attr('x', 0)
      .attr('y', -15)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#f9fafb')
      .text('Топ-5 дилеров:');
      
    // Добавляем элементы легенды для топ-5 дилеров
    topDealers.slice(0, 5).forEach((dealer, i) => {
      const legendItem = legendGroup.append('g')
        .attr('transform', `translate(0, ${i * 20})`);
        
      // Цветной квадрат
      legendItem.append('rect')
        .attr('width', 10)
        .attr('height', 10)
        .attr('fill', colorScale(dealer.id));
        
      // Сокращаем название дилера для легенды
      const truncatedName = dealer.label.length > 20 ? dealer.label.substring(0, 18) + '...' : dealer.label;
      
      // Название дилера
      legendItem.append('text')
        .attr('x', 15)
        .attr('y', 8)
        .style('font-size', '10px')
        .style('fill', '#f9fafb')
        .text(truncatedName)
        .on('mouseover', function() {
          // Показываем полное название при наведении, если оно было сокращено
          if (dealer.label.length > 20) {
            const tooltip = legendGroup.append('g')
              .attr('class', 'legend-tooltip')
              .attr('transform', `translate(100, ${i * 20})`);
            
            const tooltipText = tooltip.append('text')
              .attr('text-anchor', 'middle')
              .style('fill', '#ffffff')
              .style('font-size', '11px')
              .text(dealer.label);
            
            const bbox = tooltipText.node().getBBox();
            
            tooltip.insert('rect', 'text')
              .attr('x', bbox.x - 5)
              .attr('y', bbox.y - 2)
              .attr('width', bbox.width + 10)
              .attr('height', bbox.height + 4)
              .attr('rx', 3)
              .attr('fill', 'rgba(0, 0, 0, 0.8)');
            
            tooltipText.raise();
          }
        })
        .on('mouseout', function() {
          // Удаляем всплывающую подсказку
          legendGroup.selectAll('.legend-tooltip').remove();
        });
    });
  }
  
  // Вместо графика возвратов создаем график эффективности дилеров (среднее количество продаж на продавца)
  // Очищаем контейнер
  const container = dealerSecondaryChartRef.current;
  container.innerHTML = '';
  
  // Подготавливаем данные для графика эффективности
  const dealerEfficiency = sortedDealerData.slice(0, 10).map(dealer => {
    // Находим всех продавцов для этого дилера
    const dealerSalespeople = data.salespersonData.filter(
      s => s.modelId === selectedModel.id && s.dealerId === dealer.dealerId
    );
    
    // Вычисляем среднее количество продаж на одного продавца
    const salesPerPerson = dealerSalespeople.length > 0 
      ? dealer.sales / dealerSalespeople.length
      : dealer.sales; // Если нет данных о продавцах, используем общие продажи
    
    return {
      id: dealer.dealerId,
      label: dealer.dealerName,
      value: Math.round(salesPerPerson * 10) / 10, // Округляем до 1 десятичного знака
      totalSales: dealer.sales,
      salespeople: dealerSalespeople.length,
      color: selectedModel.color,
      dealer: dealer
    };
  });
  
  // Настройка размеров графика
  const width = container.clientWidth;
  const height = 400;
  const margin = { top: 40, right: 30, bottom: 160, left: 70 }; // Увеличиваем нижний отступ для названий
  
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  // Создаем SVG элемент
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('background', '#1f2937')
    .style('border-radius', '0.5rem');
  
  // Добавляем заголовок
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', margin.top / 2)
    .attr('text-anchor', 'middle')
    .style('font-size', '1.2rem')
    .style('font-weight', 'bold')
    .style('fill', '#f9fafb')
    .text(`Эффективность топ-10 дилеров ${selectedModel.name} (продажи на продавца)`);
  
  // Основная группа для графика
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);
  
  // Настраиваем шкалы
  const x = d3.scaleBand()
    .domain(dealerEfficiency.map(d => d.id.toString())) // Используем ID как ключи
    .range([0, chartWidth])
    .padding(0.4);
  
  const y = d3.scaleLinear()
    .domain([0, d3.max(dealerEfficiency, d => d.value) * 1.1])
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
      .attr('stroke', '#374151')
      .attr('stroke-opacity', 0.5)
      .attr('stroke-dasharray', '2,2'));
  
  // Добавляем оси
  g.append('g')
    .attr('transform', `translate(0, ${chartHeight})`)
    .call(d3.axisBottom(x).tickFormat(() => '')) // Убираем метки оси X
    .call(g => g.select('.domain').remove());
  
  g.append('g')
    .call(d3.axisLeft(y).ticks(5))
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('text')
      .style('fill', '#f9fafb')
      .style('font-size', '0.85rem'));
  
  // Добавляем подписи осей
  g.append('text')
    .attr('text-anchor', 'middle')
    .attr('transform', 'rotate(-90)')
    .attr('y', -margin.left + 20)
    .attr('x', -chartHeight / 2)
    .style('fill', '#f9fafb')
    .style('font-size', '0.9rem')
    .text('Средние продажи на продавца');
  
  // Добавляем столбцы
  g.selectAll('.bar')
    .data(dealerEfficiency)
    .join('rect')
    .attr('class', 'bar')
    .attr('x', d => x(d.id.toString()))
    .attr('y', d => y(d.value))
    .attr('width', x.bandwidth())
    .attr('height', d => chartHeight - y(d.value))
    .attr('fill', (d, i) => {
      const baseColor = selectedModel.color;
      const hslColor = d3.hsl(baseColor);
      hslColor.l = 0.4 + (i * 0.05);
      return hslColor.toString();
    })
    .attr('rx', 4) // Скругленные углы
    .style('cursor', 'pointer')
    .on('click', (event, d) => handleDealerClick(d.dealer))
    .on('mouseover', function(event, d) {
      // Увеличиваем столбец при наведении
      d3.select(this)
        .transition()
        .duration(100)
        .attr('opacity', 0.8)
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2);
        
      // Подсвечиваем соответствующую подпись внизу
      g.selectAll(`.eff-dealer-${d.id}`)
        .transition()
        .duration(100)
        .style('font-weight', 'bold')
        .style('fill', '#ffffff');
      
      // Отображаем подробную информацию о дилере
      const tooltip = g.append('g')
        .attr('class', 'eff-tooltip')
        .attr('transform', `translate(${x(d.id.toString()) + x.bandwidth() / 2}, ${y(d.value) - 30})`);
      
      const tooltipBg = tooltip.append('rect')
        .attr('x', -85)
        .attr('y', -45)
        .attr('width', 170)
        .attr('height', 90)
        .attr('rx', 5)
        .attr('fill', 'rgba(0, 0, 0, 0.8)');
      
      // Значение эффективности
      tooltip.append('text')
        .attr('x', 0)
        .attr('y', -28)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .style('fill', '#ffffff')
        .text(`${d.value.toFixed(1)}`);
      
      // Подпись "продаж на продавца"
      tooltip.append('text')
        .attr('x', 0)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .style('font-size', '11px')
        .style('fill', '#9ca3af')
        .text('продаж на продавца');
      
      // Название дилера (сокращенное)
      tooltip.append('text')
        .attr('x', 0)
        .attr('y', 10)
        .attr('text-anchor', 'middle')
        .style('font-size', '11px')
        .style('fill', '#ffffff')
        .text(d.label.length > 20 ? d.label.substring(0, 18) + '...' : d.label);
      
      // Общие продажи
      tooltip.append('text')
        .attr('x', 0)
        .attr('y', 30)
        .attr('text-anchor', 'middle')
        .style('font-size', '11px')
        .style('fill', '#9ca3af')
        .text(`Всего продаж: ${d.totalSales}`);
    })
    .on('mouseout', function(event, d) {
      d3.select(this)
        .transition()
        .duration(100)
        .attr('opacity', 1)
        .attr('stroke', 'none');
        
      // Возвращаем подпись к нормальному виду
      g.selectAll(`.eff-dealer-${d.id}`)
        .transition()
        .duration(100)
        .style('font-weight', 'normal')
        .style('fill', '#9ca3af');
      
      // Удаляем подсказку
      g.selectAll('.eff-tooltip').remove();
    })
    .attr('opacity', 0)
    .transition()
    .duration(500)
    .delay((_, i) => i * 50)
    .attr('opacity', 1);
  
  // Добавляем подписи к столбцам
  g.selectAll('.value-label')
    .data(dealerEfficiency)
    .join('text')
    .attr('class', 'value-label')
    .attr('x', d => x(d.id.toString()) + x.bandwidth() / 2)
    .attr('y', d => y(d.value) - 5)
    .attr('text-anchor', 'middle')
    .style('font-size', '12px')
    .style('font-weight', 'bold')
    .style('fill', 'white')
    .text(d => d.value.toFixed(1))
    .attr('opacity', 0)
    .transition()
    .duration(500)
    .delay((_, i) => i * 50 + 500)
    .attr('opacity', 1);
  
  // Создаем контейнер для названий дилеров
  // Используем 2-колоночный макет для лучшего использования пространства
  const dealerLabelsContainer = g.append('g')
    .attr('transform', `translate(0, ${chartHeight + 15})`);
  
  // Разделяем дилеров на две колонки
  const leftColumnDealers = dealerEfficiency.slice(0, 5);
  const rightColumnDealers = dealerEfficiency.slice(5);
  
  // Функция для добавления информации о дилере
  const addDealerInfo = (dealer, index, isLeftColumn) => {
    const columnWidth = chartWidth / 2;
    const xPos = isLeftColumn ? columnWidth * 0.5 : columnWidth * 1.5;
    const yPos = index * 30; // Увеличиваем расстояние между дилерами
    
    // Создаем фон для названия дилера
    dealerLabelsContainer.append('rect')
      .attr('x', xPos - columnWidth * 0.4)
      .attr('y', yPos - 10)
      .attr('width', columnWidth * 0.8)
      .attr('height', 25)
      .attr('rx', 5)
      .attr('fill', '#1f293780')
      .attr('stroke', dealer.color)
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.3)
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .delay(index * 50 + 700)
      .attr('opacity', 1);
    
    // Сокращаем название дилера
    const dealerName = dealer.label;
    const truncatedName = dealerName.length > 25 ? dealerName.substring(0, 23) + '...' : dealerName;
    
    // Добавляем название дилера
    dealerLabelsContainer.append('text')
      .attr('class', `eff-dealer-${dealer.id}`)
      .attr('x', xPos)
      .attr('y', yPos + 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', '#9ca3af')
      .style('cursor', 'pointer')
      .text(truncatedName)
      .on('click', () => handleDealerClick(dealer.dealer))
      .on('mouseover', function() {
        // Подсвечиваем текст
        d3.select(this)
          .transition()
          .duration(100)
          .style('font-weight', 'bold')
          .style('fill', '#ffffff');
        
        // Подсвечиваем соответствующий столбец
        g.selectAll('.bar')
          .filter(d => d.id === dealer.id)
          .transition()
          .duration(100)
          .attr('opacity', 0.8)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 2);
        
        // Показываем полное название при наведении
        if (dealerName.length > 25) {
          const tooltip = dealerLabelsContainer.append('g')
            .attr('class', 'name-tooltip')
            .attr('transform', `translate(${xPos}, ${yPos - 15})`);
          
          const tooltipText = tooltip.append('text')
            .attr('text-anchor', 'middle')
            .style('fill', '#ffffff')
            .style('font-size', '11px')
            .text(dealerName);
          
          const bbox = tooltipText.node().getBBox();
          
          tooltip.insert('rect', 'text')
            .attr('x', bbox.x - 5)
            .attr('y', bbox.y - 2)
            .attr('width', bbox.width + 10)
            .attr('height', bbox.height + 4)
            .attr('rx', 3)
            .attr('fill', 'rgba(0, 0, 0, 0.8)');
          
          tooltipText.raise();
        }
      })
      .on('mouseout', function() {
        // Возвращаем текст к нормальному виду
        d3.select(this)
          .transition()
          .duration(100)
          .style('font-weight', 'normal')
          .style('fill', '#9ca3af');
        
        // Возвращаем столбец к нормальному виду
        g.selectAll('.bar')
          .filter(d => d.id === dealer.id)
          .transition()
          .duration(100)
          .attr('opacity', 1)
          .attr('stroke', 'none');
        
        // Удаляем всплывающую подсказку
        dealerLabelsContainer.selectAll('.name-tooltip').remove();
      })
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .delay(index * 50 + 800)
      .attr('opacity', 1);
  };
  
  // Добавляем дилеров в левую колонку
  leftColumnDealers.forEach((dealer, index) => {
    addDealerInfo(dealer, index, true);
  });
  
  // Добавляем дилеров в правую колонку
  rightColumnDealers.forEach((dealer, index) => {
    addDealerInfo(dealer, index, false);
  });
};
  const [hoveredSalesperson, setHoveredSalesperson] = useState(null);

const renderGlobalTopSalespeople = () => {
  const topSalespeople = getGlobalTopSalespeople();
  
  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <h3 className="text-xl font-bold text-white mb-4">Топ-10 продавцов по всем дилерам</h3>
      
      <div className="grid grid-cols-1 gap-3">
        {topSalespeople.map((salesperson, index) => (
          <motion.div
            key={salesperson.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-900/70 rounded-lg p-3 flex items-center relative"
            onMouseEnter={() => setHoveredSalesperson(salesperson)}
            onMouseLeave={() => setHoveredSalesperson(null)}
          >
            {/* Аватар продавца */}
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold mr-3"
                 style={{ 
                   backgroundColor: salesperson.isOnline ? '#10b981' : 
                                     index === 0 ? '#FFD700' : 
                                     index === 1 ? '#C0C0C0' : 
                                     index === 2 ? '#CD7F32' : '#3b82f680' 
                 }}>
              {salesperson.name.split(' ').map(n => n[0]).join('')}
            </div>
            
            <div className="flex-grow">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-bold text-white flex items-center">
                  {salesperson.name}
                  {salesperson.isOnline && (
                    <span className="ml-2 text-xs font-normal px-1.5 py-0.5 rounded-full bg-green-900/70 text-green-300 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                      </svg>
                      Online
                    </span>
                  )}
                </h4>
                <span className="px-2 py-1 rounded text-xs" 
                      style={{ backgroundColor: `${index === 0 ? '#FFD700' : 
                                                index === 1 ? '#C0C0C0' : 
                                                index === 2 ? '#CD7F32' : '#3b82f6'}20`, 
                               color: index === 0 ? '#FFD700' : 
                                      index === 1 ? '#C0C0C0' : 
                                      index === 2 ? '#CD7F32' : '#3b82f6' }}>
                  {index === 0 ? '🥇 Абсолютный лидер' : 
                   index === 1 ? '🥈 #2' : 
                   index === 2 ? '🥉 #3' : `#${index + 1}`}
                </span>
              </div>
              
              {/* Информация о дилере, только если это не онлайн-продавец */}
              {!salesperson.isOnline && salesperson.mainDealer && (
                <div className="flex items-center text-sm text-gray-400 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="truncate max-w-[180px]" title={salesperson.mainDealer.dealerName}>
                    {salesperson.mainDealer.dealerName}
                    {salesperson.hasMultipleDealers && (
                      <span className="text-xs ml-1 px-1 py-0.5 bg-blue-900/30 rounded cursor-pointer">
                        + ещё {salesperson.dealers.length - 1}
                      </span>
                    )}
                  </span>
                  
                  {/* Регион основного дилера */}
                  <span className="ml-2 px-1.5 py-0.5 rounded-full bg-gray-800 text-xs flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {salesperson.mainDealer.region}
                  </span>
                </div>
              )}
              
              {/* Продажи */}
              <div className="flex items-center mt-1">
                <div className="text-gray-400 text-sm">Общие продажи:</div>
                <div className="text-white font-bold ml-2">{salesperson.totalSales.toLocaleString()}</div>
                
                <div className="ml-auto flex items-center">
                  <div className="h-2 w-24 bg-gray-700 rounded-full mr-2">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(salesperson.totalSales / topSalespeople[0].totalSales) * 100}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                      className="h-full rounded-full"
                      style={{ 
                        backgroundColor: salesperson.isOnline ? '#10b981' :
                                        index === 0 ? '#FFD700' : 
                                        index === 1 ? '#C0C0C0' : 
                                        index === 2 ? '#CD7F32' : '#3b82f6' 
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">
                    {Math.round((salesperson.totalSales / topSalespeople.reduce((sum, sp) => sum + sp.totalSales, 0)) * 100)}%
                  </span>
                </div>
              </div>
            </div>
            
            {/* Всплывающая подсказка с информацией о дилерах и регионах */}
            {hoveredSalesperson && hoveredSalesperson.id === salesperson.id && 
             hoveredSalesperson.hasMultipleDealers && !hoveredSalesperson.isOnline && (
              <div className="absolute right-0 top-0 transform -translate-y-full mt-2 bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl z-10 w-72">
                <h5 className="text-white font-bold mb-3">Продажи по дилерам и регионам</h5>
                
                {/* Группировка дилеров по регионам */}
                <div className="space-y-4 max-h-64 overflow-auto pr-2">
                  {Object.entries(hoveredSalesperson.dealersByRegion).map(([region, dealers]) => (
                    <div key={region} className="border-b border-gray-700 pb-3 last:border-b-0">
                      <div className="flex items-center mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm font-medium text-blue-400">{region}</span>
                        <span className="text-xs text-gray-400 ml-auto">
                          {dealers.reduce((sum, d) => sum + d.sales, 0)} продаж
                        </span>
                      </div>
                      
                      {/* Список дилеров в регионе */}
                      <div className="space-y-2">
                        {dealers.map((dealer, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-gray-900/50 rounded p-2">
                            <span className="text-xs text-gray-300 truncate max-w-[180px]" title={dealer.dealerName}>
                              {dealer.dealerName}
                            </span>
                            <div className="flex items-center">
                              <span className="text-xs font-medium text-white">{dealer.sales}</span>
                              <div className="h-1.5 w-12 bg-gray-700 rounded-full ml-2">
                                <div 
                                  className="h-full rounded-full" 
                                  style={{ 
                                    width: `${(dealer.sales / hoveredSalesperson.totalSales) * 100}%`,
                                    backgroundColor: dealer.dealerId === hoveredSalesperson.mainDealer.dealerId ? 
                                                    '#10b981' : '#3b82f6'
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
  
  if (viewMode === 'general') {
    // Получаем всех продавцов, отсортированных по продажам (от большего к меньшему)
    const sortedSalespeople = [...filteredSalespersonData]
      .sort((a, b) => b.sales - a.sales);
    
    // Для основного графика берем топ-15 продавцов
    const topSalespeople = sortedSalespeople.slice(0, 15);
    
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
    
    // Для графика динамики продаж берем только топ-5 продавцов
    const topFiveSalespeople = sortedSalespeople.slice(0, 5);

    // Попробуем найти оригинальные необработанные данные в компоненте
    // Создадим объект для хранения данных по месяцам для каждого продавца
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
          <div class="text-gray-400 text-center p-4">
            <p>Недостаточно данных для отображения динамики продаж</p>
            <p class="text-sm mt-2">Используйте другой диапазон дат или обновите данные</p>
          </div>
        </div>
      `;
      return;
    }
    
    // Создаем структуру данных для графика
    let monthlyData = [];
    
    // Проверяем, есть ли у нас доступ к raw_data - оригинальным данным от API
    if (typeof raw_data !== 'undefined' && raw_data && Array.isArray(raw_data)) {
      console.log('Используем raw_data для графика продавцов');
      
      // Ищем данные для текущей модели
      const modelData = raw_data.find(m => m.model_id === selectedModel.id);
      
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
    
    // Если не смогли получить данные из raw_data, попробуем использовать другой подход
    if (monthlyData.length === 0) {
      console.log('Используем альтернативный подход для графика продавцов');
      
      // Проверяем, есть ли в салеспернонов данные о месяцах или другие связанные данные
      // Для каждого продавца проверяем, есть ли у него дополнительные свойства с месячными данными
      let hasMonthData = false;
      
      // Подход 2: Ищем месячные данные в составных полях объектов salesperson
      topFiveSalespeople.forEach(salesperson => {
        // Проверяем наличие месячных данных в объекте продавца
        const monthlyFields = Object.keys(salesperson).filter(key => 
          key.includes('month') || key.includes('Month') || 
          (typeof salesperson[key] === 'object' && salesperson[key] !== null)
        );
        
        if (monthlyFields.length > 0) {
          hasMonthData = true;
          
          // Для каждого поля с месячными данными
          monthlyFields.forEach(field => {
            const monthData = salesperson[field];
            
            // Предполагаем, что monthData - это объект, где ключи - месяцы, значения - продажи
            if (typeof monthData === 'object' && monthData !== null) {
              Object.entries(monthData).forEach(([month, sales]) => {
                // Проверяем, что месяц в формате YYYY-MM
                if (/^\d{4}-\d{2}$/.test(month)) {
                  monthlyData.push({
                    x: month,
                    y: parseInt(sales) || 0,
                    group: salesperson.salespersonName
                  });
                }
              });
            }
          });
        }
      });
      
      // Если и второй подход не сработал, используем последний вариант - равномерное распределение
      if (!hasMonthData && monthlyData.length === 0) {
        console.log('Используем равномерное распределение данных по месяцам');
        
        // Получаем данные о продажах продавцов из существующей структуры
        // Просто разделим общие продажи на количество месяцев для демонстрации
        
        // Проверим, есть ли данные напрямую в trendData
        // Попробуем извлечь данные продавцов из trendData
        let hasSalespersonTrendData = false;
        
        // Создаем массив данных по месяцам для каждого продавца, распределяя продажи в соответствии с трендом
        if (data.trendData && data.trendData.length > 0) {
          // Вычисляем общую сумму продаж во всех месяцах
          const totalTrendSales = data.trendData.reduce((sum, item) => sum + item.sales, 0);
          
          if (totalTrendSales > 0) {
            // Для каждого продавца
            topFiveSalespeople.forEach(salesperson => {
              // Для каждого месяца
              data.trendData.forEach(trend => {
                if (trend.date) {
                  // Вычисляем долю продаж в этом месяце от общих продаж
                  const monthShareOfTotal = trend.sales / totalTrendSales;
                  
                  // Вычисляем продажи этого продавца в этом месяце
                  // пропорционально его доле в общих продажах и распределению по месяцам
                  const salesInMonth = Math.round(salesperson.sales * monthShareOfTotal);
                  
                  // Добавляем точку данных
                  monthlyData.push({
                    x: trend.date,
                    y: salesInMonth,
                    group: salesperson.salespersonName
                  });
                  
                  hasSalespersonTrendData = true;
                }
              });
            });
          }
        }
        
        // Если ничего не сработало, используем равномерное распределение как последний вариант
        if (!hasSalespersonTrendData && monthlyData.length === 0) {
          // Количество месяцев для равномерного распределения
          const monthCount = allMonths.length;
          
          // Для каждого продавца из топ-5
          topFiveSalespeople.forEach(salesperson => {
            // Для каждого месяца добавляем запись в monthlyData
            allMonths.forEach(month => {
              // Распределяем продажи продавца равномерно по всем месяцам
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

    // Выводим в консоль, что получилось
    console.log('Данные по месяцам для продавцов:', monthlyByPerson);

    // Custom D3 rendering for multi-line chart
    const container = salespersonSecondaryChartRef.current;
    container.innerHTML = '';
    
    const width = container.clientWidth;
    const height = 400;
    const margin = { top: 40, right: 160, bottom: 70, left: 70 }; // Увеличиваем отступы для лучшей читаемости
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('background', '#1f2937')
      .style('border-radius', '0.5rem');
      
    // Добавляем заголовок
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '1.2rem')
      .style('font-weight', 'bold')
      .style('fill', '#f9fafb')
      .text(`Динамика продаж топ-5 продавцов за период: ${getDateRangeLabel()}`);
    
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
    
    // Для x используем scalePoint вместо scaleTime, так как у нас строковые ключи
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
        '#FF5733', // Ярко-оранжевый
        '#33A8FF', // Ярко-голубой
        '#B933FF', // Фиолетовый
        '#33FF57', // Ярко-зеленый
        '#FFD433'  // Золотой
      ]);
      
    // Создаем функцию линии с настройкой для x и y координат
    const line = d3.line()
      .x(d => x(d.x))
      .y(d => y(d.y))
      .curve(d3.curveMonotoneX); // Используем плавные кривые
    
    // Добавляем заливку для осей для лучшей читаемости
    svg.append('rect')
      .attr('x', 0)
      .attr('y', height - margin.bottom)
      .attr('width', width)
      .attr('height', margin.bottom)
      .attr('fill', '#1a2434')
      .attr('opacity', 0.5);
    
    svg.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', margin.left)
      .attr('height', height - margin.bottom)
      .attr('fill', '#1a2434')
      .attr('opacity', 0.5);
    
    // Рисуем оси
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat(formatMonthYear))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text')
        .style('fill', '#f9fafb')
        .style('font-size', '0.9rem') // Увеличиваем размер шрифта
        .attr('transform', 'rotate(-25)') // Увеличиваем угол поворота для лучшей читаемости
        .attr('text-anchor', 'end')
        .attr('dx', '-0.8em')
        .attr('dy', '0.15em'));
      
    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text')
        .style('fill', '#f9fafb')
        .style('font-size', '0.9rem')); // Увеличиваем размер шрифта
      
    // Рисуем подписи осей
    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('x', width / 2)
      .attr('y', height - 15)
      .attr('fill', '#f9fafb')
      .style('font-size', '0.9rem')
      .text('Месяц');
    
    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(height - margin.bottom + margin.top) / 2)
      .attr('y', 25)
      .attr('fill', '#f9fafb')
      .style('font-size', '0.9rem')
      .text('Количество продаж');
    
    // Рисуем сетку для y оси
    svg.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y)
        .ticks(5)
        .tickSize(-(width - margin.left - margin.right))
        .tickFormat('')
      )
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line')
        .attr('stroke', '#374151')
        .attr('stroke-opacity', 0.5)
        .attr('stroke-dasharray', '2,2'));
    
    // Создаем группу для линий и точек
    const chartGroup = svg.append('g')
      .attr('class', 'chart-group');
    
    // Добавляем линии для каждого продавца
    Object.entries(monthlyByPerson).forEach(([name, values], i) => {
      if (values.length < 2) return; // Нужно минимум 2 точки для линии
      
      // Создаем группу для этого продавца
      const personGroup = chartGroup.append('g')
        .attr('class', `person-${i}`);
      
      // Добавляем линию
      personGroup.append('path')
        .datum(values)
        .attr('fill', 'none')
        .attr('stroke', colorScale(name))
        .attr('stroke-width', 4) // Делаем линию толще
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('d', line)
        .attr('opacity', 0)
        .transition()
        .duration(1000)
        .delay(i * 300)
        .attr('opacity', 0.9);
    
      // Добавляем точки с числами
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
              .attr('r', 20);
              
            // Делаем текст более заметным
            d3.select(this).select('text')
              .transition()
              .duration(100)
              .style('font-size', '12px')
              .attr('dy', '0.35em');
              
            // Подсвечиваем линию
            personGroup.select('path')
              .transition()
              .duration(100)
              .attr('stroke-width', 6)
              .attr('opacity', 1);
          })
          .on('mouseout', function() {
            // Возвращаем точку к обычному размеру
            d3.select(this).select('circle')
              .transition()
              .duration(100)
              .attr('r', 16);
              
            // Возвращаем текст к обычному размеру
            d3.select(this).select('text')
              .transition()
              .duration(100)
              .style('font-size', '10px')
              .attr('dy', '0.35em');
              
            // Возвращаем линию к обычному виду
            personGroup.select('path')
              .transition()
              .duration(100)
              .attr('stroke-width', 4)
              .attr('opacity', 0.9);
          });
        
        // Добавляем круг
        pointGroup.append('circle')
          .attr('r', 0)
          .attr('fill', colorScale(name))
          .attr('stroke', '#1f2937')
          .attr('stroke-width', 2)
          .transition()
          .duration(500)
          .delay(i * 300 + j * 100 + 1000)
          .attr('r', 16); // Делаем точки больше
        
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
          .style('font-size', '10px');
        
        // Добавляем подпись с месяцем и именем продавца при клике
        pointGroup.on('click', function() {
          // Удаляем все предыдущие подписи
          svg.selectAll('.point-label').remove();
          
          // Добавляем новую подпись
          const label = svg.append('g')
            .attr('class', 'point-label')
            .attr('transform', `translate(${x(d.x)}, ${y(d.y) - 30})`);
          
          // Фон для подписи
          const labelText = label.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0em')
            .attr('fill', '#fff')
            .style('font-size', '12px')
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
            .attr('fill', 'rgba(0, 0, 0, 0.8)');
          
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
            .style('font-size', '10px')
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
    
    // Добавляем легенду
    const legend = svg.append('g')
      .attr('transform', `translate(${width - margin.right + 30}, ${margin.top + 20})`);
    
    // Добавляем заголовок легенды  
    legend.append('text')
      .attr('x', 0)
      .attr('y', -10)
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', '#f9fafb')
      .text('Продавцы:');
    
    // Добавляем элементы легенды с интерактивностью
    Object.keys(monthlyByPerson).forEach((name, i) => {
      const personValues = monthlyByPerson[name];
      // Вычисляем общую сумму продаж этого продавца
      const totalSales = personValues.reduce((sum, d) => sum + d.y, 0);
      
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 35})`) // Увеличиваем расстояние между строками
        .attr('class', `legend-${i}`)
        .style('cursor', 'pointer')
        .on('mouseover', function() {
          // Подсвечиваем все элементы для этого продавца
          svg.select(`.person-${i}`).select('path')
            .transition()
            .duration(100)
            .attr('stroke-width', 6)
            .attr('opacity', 1);
            
          svg.selectAll(`.person-${i} circle`)
            .transition()
            .duration(100)
            .attr('r', 20);
            
          svg.selectAll(`.person-${i} text`)
            .transition()
            .duration(100)
            .style('font-size', '12px');
            
          // Подсвечиваем строку легенды
          d3.select(this)
            .transition()
            .duration(100)
            .attr('opacity', 1);
            
          // Увеличиваем фон легенды
          d3.select(this).select('rect')
            .transition()
            .duration(100)
            .attr('width', 150)
            .attr('height', 30)
            .attr('y', -15);
        })
        .on('mouseout', function() {
          // Возвращаем элементы к нормальному виду
          svg.select(`.person-${i}`).select('path')
            .transition()
            .duration(100)
            .attr('stroke-width', 4)
            .attr('opacity', 0.9);
            
          svg.selectAll(`.person-${i} circle`)
            .transition()
            .duration(100)
            .attr('r', 16);
            
          svg.selectAll(`.person-${i} text`)
            .transition()
            .duration(100)
            .style('font-size', '10px');
            
          // Возвращаем строку легенды к нормальному виду
          d3.select(this)
            .transition()
            .duration(100)
            .attr('opacity', 0.9);
            
          // Возвращаем фон легенды к нормальному размеру
          d3.select(this).select('rect')
            .transition()
            .duration(100)
            .attr('width', 140)
            .attr('height', 25)
            .attr('y', -12);
        });
      
      // Фон для элемента легенды для лучшей интерактивности
      legendRow.append('rect')
        .attr('x', -5)
        .attr('y', -12)
        .attr('width', 140)
        .attr('height', 25)
        .attr('rx', 4)
        .attr('fill', '#2d3748')
        .attr('opacity', 0.3);
      
      // Цветной индикатор
      legendRow.append('rect')
        .attr('width', 20)
        .attr('height', 4)
        .attr('y', 0)
        .attr('fill', colorScale(name));
      
      // Имя продавца
      legendRow.append('text')
        .attr('x', 30)
        .attr('y', 0)
        .attr('dy', '0.32em')
        .attr('fill', '#f9fafb')
        .style('font-size', '12px')
        .text(name);
        
      // Добавляем общую сумму продаж
      legendRow.append('text')
        .attr('x', 30)
        .attr('y', 15)
        .attr('fill', '#9ca3af')
        .style('font-size', '10px')
        .text(`Всего: ${totalSales}`);
    });
    
    // Добавляем инструкцию по использованию
    svg.append('text')
      .attr('x', margin.left)
      .attr('y', height - 15)
      .attr('text-anchor', 'start')
      .attr('fill', '#9ca3af')
      .style('font-size', '10px')
      .text('Нажмите на точку для подробной информации');

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

 // Initialize on mount and update charts when view changes
  useEffect(() => {
    if (view === 'models') {
      renderModelCharts();
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
      {/* Добавляем компонент загрузки */}
      <ContentReadyLoader isLoading={isLoading} setIsLoading={setIsLoading} timeout={8000} />
      
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
        </div>
        
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
         
            <h2 className="text-2xl font-bold my-6 text-white">Лидеры продаж</h2>
    {renderGlobalTopSalespeople()}

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
                           <div className="text-xs text-gray-400">Продавцов</div>
                           <div className="text-lg font-bold text-white">
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
           </div>
           
           {/* Дополнительный график - эффективность дилеров */}
           <div className="bg-gray-800 p-4 rounded-lg shadow-md">
             <div ref={dealerSecondaryChartRef} className="w-full h-full"></div>
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
                 <div className="text-sm text-gray-400">Продавцов</div>
                 <div className="text-xl font-bold text-white">
                   {filteredSalespersonData.length}
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
                   {/* {filteredPaymentData && (
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
                   )} */}
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
               
               {/* <motion.button
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
               </motion.button> */}
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
    {/* Используем showAllSalespeople для определения, сколько продавцов показать */}
    {(showAllSalespeople ? filteredSalespersonData : topSalespeople).map((salesperson, index) => (
      <motion.div
        key={salesperson.salespersonId}
        initial={animateCards ? { opacity: 0, y: 10 } : false}
        animate={animateCards ? { opacity: 1, y: 0 } : false}
        transition={{ delay: index * 0.1 }}
        className="bg-gray-900/70 rounded-lg p-3 flex items-center"
        onAnimationComplete={() => index === 
          (showAllSalespeople ? filteredSalespersonData.length - 1 : topSalespeople.length - 1) 
          && setAnimateCards(false)}
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
              {index === 0 && !showAllSalespeople ? '🏆 Лучший продавец' : `#${index + 1}`}
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
  
  {/* Кнопка для просмотра всех продавцов с обработчиком нажатия */}
  {filteredSalespersonData.length > 5 && (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setShowAllSalespeople(!showAllSalespeople)} // Переключаем состояние
      className="w-full mt-3 py-2  text-gray-300 rounded hover:bg-gray-700 transition-colors text-sm"
    >
      {showAllSalespeople 
        ? "Показать только топ-5 продавцов" 
        : `Показать всех продавцов (${filteredSalespersonData.length - 5} ещё)`
      }
    </motion.button>
  )}
</div>
                 
                 {/* Распределение продаж по времени */}
              {/* Заменить этот блок динамики продаж по времени в режиме просмотра продавцов */}
<div className=" rounded-lg p-4">
  {/* <h3 className="text-lg font-bold text-white mb-3">Динамика продаж</h3> */}
  
  {/* {(() => {
    // Создаем объект с данными за последние 12 месяцев
    const monthlySales = {};
    const today = new Date();
    
    // Инициализируем все 12 месяцев с нулями
    for (let i = 11; i >= 0; i--) {
      const month = new Date(today);
      month.setMonth(today.getMonth() - i);
      const monthKey = month.toISOString().slice(0, 7); // YYYY-MM формат
      monthlySales[monthKey] = 0;
    }
    
    // Если есть данные трендов, обогащаем данные месяцев
    if (data.trendData && data.trendData.length > 0) {
      // Фильтруем данные тренда только для текущего дилера и модели
      const dealerSales = filteredSalespersonData.reduce((sum, sp) => sum + sp.sales, 0);
      const totalSales = selectedModel?.totalSales || 1;
      const dealerRatio = dealerSales / totalSales;
      
      // Распределяем продажи по месяцам пропорционально общим продажам
      data.trendData.forEach(trend => {
        if (monthlySales[trend.date]) {
          monthlySales[trend.date] = Math.round(trend.sales * dealerRatio);
        }
      });
    }
    
    // Преобразуем в массив для отображения
    const monthlyDataArray = Object.entries(monthlySales).map(([date, sales]) => {
      const month = new Date(date);
      return {
        date,
        sales,
        month: month.toLocaleString('ru', { month: 'short' })
      };
    });
    
    // Находим максимальное значение для масштабирования
    const maxSales = Math.max(...monthlyDataArray.map(m => m.sales), 1);
    
    return (
      <div className="grid grid-cols-12 gap-2 mb-2">
        {monthlyDataArray.map((monthData, index) => {
          const height = `${(monthData.sales / maxSales) * 100}%`;
          
          return (
            <div key={index} className="flex flex-col h-32 justify-end">
              <div 
                className="rounded-t w-full transition-all duration-700" 
                style={{ 
                  height, 
                  backgroundColor: index === 11 ? selectedModel?.color : `${selectedModel?.color}80` 
                }}
              />
              <div className="text-xs text-gray-500 text-center mt-1">{monthData.month}</div>
              <div className="text-xs text-white text-center">{monthData.sales > 0 ? monthData.sales : ''}</div>
            </div>
          );
        })}
      </div>
    )
  })()} */}
  
  {/* <div className="text-center text-xs text-gray-500 mt-1">
    Последние 12 месяцев
  </div> */}
</div>
               </>
             ) : (
               <>
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