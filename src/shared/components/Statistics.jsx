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
      
      return apiData;
    } catch (error) {
      console.error('Ошибка при получении данных рынка:', error);
      // В случае ошибки загружаем демо-данные
      const fallbackData = generateDemoData(dateRange.startDate, dateRange.endDate);
      setData(fallbackData);
      return null;
    }
  };
  
  // Функция для преобразования данных API в формат компонента
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
    
    // Преобразуем данные о продавцах
    const salespersonData = [];
    modelsWithModifications.forEach(model => {
      if (model.filter_by_month && model.filter_by_month.length) {
        model.filter_by_month.forEach(monthData => {
          if (monthData.dealers && monthData.dealers.length) {
            monthData.dealers.forEach(dealer => {
              if (dealer.user_list && dealer.user_list.length) {
                dealer.user_list.forEach(user => {
                  salespersonData.push({
                    modelId: model.model_id,
                    dealerId: dealer.dealer_id,
                    salespersonId: user.user_id,
                    salespersonName: user.user_name,
                    modelName: model.model_name,
                    dealerName: dealer.dealer_name,
                    sales: parseInt(user.contract) || 0,
                    color: modelData.find(m => m.id === model.model_id)?.color || '#3b82f6'
                  });
                });
              }
            });
          }
        });
      }
    });
    
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
    
  const getGlobalTopSalespeople = () => {
    // Создаем карту для агрегации продаж по каждому продавцу
    const salesByPerson = new Map();
    
    // Проходим по всем записям о продавцах
    data.salespersonData.forEach(person => {
      const key = `${person.salespersonId}-${person.salespersonName}`;
      const currentSales = salesByPerson.get(key) || 0;
      salesByPerson.set(key, currentSales + person.sales);
    });
    
    // Преобразуем карту в массив и сортируем по убыванию продаж
    const allSalespeople = Array.from(salesByPerson.entries()).map(([key, sales]) => {
      const [id, name] = key.split('-', 2);
      return {
        id: parseInt(id),
        name: name,
        totalSales: sales
      };
    });
    
    // Сортируем и берем топ-5
    return allSalespeople
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 5);
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
    
    // Вместо графика возвратов отображаем динамику продаж по месяцам
    renderModelTimelineChart();
    
    // Тренд график оставляем без изменений
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

  const renderModelTimelineChart = () => {
    if (!modelSecondaryChartRef.current || !data.modelData.length) return;

    // Очищаем контейнер
    const container = modelSecondaryChartRef.current;
    container.innerHTML = '';
    
    // Получаем даты за последние 6 месяцев
    const months = [];
    const monthNames = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(today);
      month.setMonth(today.getMonth() - i);
      months.push(month.toISOString().slice(0, 7)); // Формат 'YYYY-MM'
      monthNames.push(month.toLocaleString('ru', { month: 'short' }));
    }
    
    // Берем только топ-6 моделей по продажам
    const topModels = [...data.modelData]
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 6);
    
    // Настройка размеров графика
    const width = container.clientWidth;
    const height = 400;
    const margin = { top: 40, right: 80, bottom: 60, left: 60 };
    
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
    
    // Создаем данные для линейного графика
    const lineData = topModels.map(model => {
      const monthlySales = months.map((month, i) => {
        // Вычисляем примерные продажи в месяц
        // Базовые продажи делим на 6 месяцев, добавляем тренд и небольшую случайность
        const baseMonthlySales = model.totalSales / 6;
        const trendFactor = 0.8 + (i * 0.05); // Небольшой рост со временем
        const randomFactor = 0.9 + Math.random() * 0.2; // Небольшая вариация ±10%
        
        return {
          date: month,
          month: monthNames[i],
          value: Math.round(baseMonthlySales * trendFactor * randomFactor),
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
    const maxSales = d3.max(lineData, d => d3.max(d.values, v => v.value));
    
    const y = d3.scaleLinear()
      .domain([0, maxSales * 1.1]) // Добавляем 10% отступ сверху
      .range([chartHeight, 0]);
    
    // Основная группа для графика
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
      
    // Добавляем оси
    g.append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(x).tickFormat((d, i) => monthNames[i]))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text')
        .style('fill', '#f9fafb')
        .style('font-size', '0.8rem'));
    
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
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);
    
    // Добавляем линии для каждой модели
    lineData.forEach((d, i) => {
      // Добавляем линию
      g.append('path')
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
        .attr('opacity', 0.7);
      
      // Добавляем точки на линию
      g.selectAll(`.dot-${i}`)
        .data(d.values)
        .join('circle')
        .attr('class', `dot-${i}`)
        .attr('cx', v => x(v.date) + x.bandwidth() / 2)
        .attr('cy', v => y(v.value))
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
            
          // Отображаем текст значения над точкой
          const valueText = g.append('text')
            .attr('class', 'temp-value')
            .attr('x', x(v.date) + x.bandwidth() / 2)
            .attr('y', y(v.value) - 15)
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .attr('fill', d.model.color)
            .text(v.value.toLocaleString());
            
          // Добавляем фон для улучшения читаемости
          const bbox = valueText.node().getBBox();
          
          g.insert('rect', '.temp-value')
            .attr('class', 'temp-value-bg')
            .attr('x', bbox.x - 5)
            .attr('y', bbox.y - 2)
            .attr('width', bbox.width + 10)
            .attr('height', bbox.height + 4)
            .attr('rx', 3)
            .attr('fill', 'rgba(0, 0, 0, 0.7)');
        })
        .on('mouseout', function() {
          // Уменьшаем точку при отведении курсора
          d3.select(this)
            .transition()
            .duration(100)
            .attr('r', 5);
            
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
    
    // Добавляем легенду
    const legendGroup = svg.append('g')
      .attr('transform', `translate(${width - margin.right}, ${margin.top})`);
      
    // Добавляем заголовок для легенды
    legendGroup.append('text')
      .attr('x', 0)
      .attr('y', -10)
      .attr('text-anchor', 'start')
      .style('font-size', '0.8rem')
      .style('font-weight', 'bold')
      .style('fill', '#f9fafb')
      .text('Модели:');
      
    // Добавляем элементы легенды
    topModels.forEach((model, i) => {
      const legendItem = legendGroup.append('g')
        .attr('transform', `translate(0, ${i * 25})`)
        .style('cursor', 'pointer')
        .on('click', () => handleModelClick(model));
      
      // Цветной индикатор
      legendItem.append('line')
        .attr('x1', 0)
        .attr('y1', 10)
        .attr('x2', 15)
        .attr('y2', 10)
        .attr('stroke', model.color)
        .attr('stroke-width', 3);
      
      // Название модели
      legendItem.append('text')
        .attr('x', 20)
        .attr('y', 10)
        .attr('dominant-baseline', 'middle')
        .text(`${model.name} (${model.totalSales.toLocaleString()})`)
        .style('font-size', '0.7rem')
        .style('fill', '#f9fafb');
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
    const margin = { top: 40, right: 30, bottom: 100, left: 60 };
    
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
      .domain(dealerEfficiency.map(d => d.label))
      .range([0, chartWidth])
      .padding(0.3);
    
    const y = d3.scaleLinear()
      .domain([0, d3.max(dealerEfficiency, d => d.value) * 1.1])
      .nice()
      .range([chartHeight, 0]);
    
    // Добавляем оси
    g.append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(x))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text')
        .attr('transform', 'rotate(-45)')
        .attr('text-anchor', 'end')
        .attr('x', -8)
        .attr('y', 8)
        .style('fill', '#f9fafb')
        .style('font-size', '0.7rem'));
    
    g.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text').style('fill', '#f9fafb'))
      .call(g => g.selectAll('.tick line')
        .attr('x2', chartWidth)
        .attr('stroke-opacity', 0.1));
    
    // Добавляем столбцы
    g.selectAll('.bar')
      .data(dealerEfficiency)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.label))
      .attr('y', d => y(d.value))
      .attr('width', x.bandwidth())
      .attr('height', d => chartHeight - y(d.value))
      .attr('fill', (d, i) => {
        const baseColor = selectedModel.color;
        const hslColor = d3.hsl(baseColor);
        hslColor.l = 0.4 + (i * 0.1);
        return hslColor.toString();
      })
      .attr('rx', 4)
      .style('cursor', 'pointer')
      .on('click', (event, d) => handleDealerClick(d.dealer))
      .on('mouseover', function(event, d) {
        // Увеличиваем столбец при наведении
        d3.select(this)
          .transition()
          .duration(100)
          .attr('opacity', 0.8);
          
        // Отображаем текст значения над столбцом
        g.append('text')
          .attr('class', 'temp-value')
          .attr('x', x(d.label) + x.bandwidth() / 2)
          .attr('y', y(d.value) - 10)
          .attr('text-anchor', 'middle')
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .style('fill', 'white')
          .text(d.value.toFixed(1));
      })
      .on('mouseout', function() {
d3.select(this)
          .transition()
          .duration(100)
          .attr('opacity', 1);
          
        // Удаляем временный текст
        g.selectAll('.temp-value').remove();
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
      .attr('x', d => x(d.label) + x.bandwidth() / 2)
      .attr('y', d => y(d.value) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('fill', 'white')
      .style('opacity', 0)
      .text(d => d.value.toFixed(1))
      .transition()
      .duration(500)
      .delay((_, i) => i * 50 + 500)
      .style('opacity', 1);
    
    // Добавляем информацию о количестве продавцов
    g.selectAll('.staff-label')
      .data(dealerEfficiency)
      .join('text')
      .attr('class', 'staff-label')
      .attr('x', d => x(d.label) + x.bandwidth() / 2)
      .attr('y', chartHeight + 40)
      .attr('text-anchor', 'middle')
      .style('font-size', '9px')
      .style('fill', '#9ca3af')
      .style('opacity', 0)
      .text(d => `${d.salespeople} прод.`)
      .transition()
      .duration(500)
      .delay((_, i) => i * 50 + 700)
      .style('opacity', 1);
  };

  const renderGlobalTopSalespeople = () => {
  const topSalespeople = getGlobalTopSalespeople();
  
  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <h3 className="text-xl font-bold text-white mb-4">Топ-5 продавцов по всем дилерам</h3>
      
      <div className="grid grid-cols-1 gap-3">
        {topSalespeople.map((salesperson, index) => (
          <motion.div
            key={salesperson.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-900/70 rounded-lg p-3 flex items-center"
          >
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold mr-3"
                 style={{ backgroundColor: index === 0 ? '#FFD700' : 
                                         index === 1 ? '#C0C0C0' : 
                                         index === 2 ? '#CD7F32' : '#3b82f680' }}>
              {salesperson.name.split(' ').map(n => n[0]).join('')}
            </div>
            
            <div className="flex-grow">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-bold text-white">{salesperson.name}</h4>
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
                      style={{ backgroundColor: index === 0 ? '#FFD700' : 
                                               index === 1 ? '#C0C0C0' : 
                                               index === 2 ? '#CD7F32' : '#3b82f6' }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">
                    {Math.round((salesperson.totalSales / topSalespeople.reduce((sum, sp) => sum + sp.totalSales, 0)) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
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
             <p className="text-center text-gray-400 mt-2">Нажмите на элемент для просмотра продаж по продавцам</p>
           </div>
           
           {/* Дополнительный график - эффективность дилеров */}
           <div className="bg-gray-800 p-4 rounded-lg shadow-md">
             <div ref={dealerSecondaryChartRef} className="w-full h-full"></div>
             <p className="text-center text-gray-400 mt-2">Эффективность дилеров по среднему количеству продаж на одного продавца</p>
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