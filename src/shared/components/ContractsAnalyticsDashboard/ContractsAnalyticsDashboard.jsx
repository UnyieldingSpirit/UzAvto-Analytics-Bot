'use client'
import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';

// Импорт компонентов
import FilterPanel from './FilterPanel';
import SelectedModelDetails from './SelectedModelDetails';
import ModelComparisonChart from './ModelComparisonChart';
import StatsCards from './StatsCards';
// Импорт утилит и сервисов
import { formatNumber, getPeriodLabel, getPeriodDescription } from './utils/formatters';
import { fetchContractData, fetchContractDataByDate, processContractData } from './services/contractService';
import { regions } from './models/regions';
import ContentReadyLoader from '../../layout/ContentReadyLoader';

function ContractsAnalyticsDashboard() {
  // Основные состояния
  const [selectedPeriod, setSelectedPeriod] = useState('year');
  const [periodData, setPeriodData] = useState([]);
  const [selectedModel, setSelectedModel] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedDetailLabel, setSelectedDetailLabel] = useState('');
  const [detailedData, setDetailedData] = useState({});
  const [chartType, setChartType] = useState('line');
  const [activeMetric, setActiveMetric] = useState('contracts');
  const [isLoading, setIsLoading] = useState(true);
  const [modelPerformance, setModelPerformance] = useState({});
  const [enhancedModels, setEnhancedModels] = useState([]);
  const [contractData, setContractData] = useState([]); // Храним данные от API
  const [dailyContractData, setDailyContractData] = useState([]);
  const prevDataRef = useRef(null);
  const prevRenderedChartRef = useRef(null);
  const [isDataReady, setIsDataReady] = useState(false); // Новое состояние для контроля готовности данных
  
  // Состояния для кастомного периода
  const [isCustomPeriod, setIsCustomPeriod] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [customEndDate, setCustomEndDate] = useState(new Date());
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().substring(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().substring(0, 10));
  
  // Кэш обработанных данных
  const processedDataCache = useRef({});
  
  // Получение категории для модели на основе имени
  const getCategoryForModel = (modelName) => {
    const sedans = ['COBALT', 'NEXIA', 'GENTRA'];
    const suvs = ['TAHOE', 'EQUINOX'];
    const minivans = ['DAMAS'];
    
    if (sedans.some(name => modelName.includes(name))) return 'sedan';
    if (suvs.some(name => modelName.includes(name))) return 'suv';
    if (minivans.some(name => modelName.includes(name))) return 'minivan';
    
    return 'other';
  };
  
  // Функция для загрузки всех необходимых данных (объединяем запросы)
  const loadAllData = async () => {
    setIsLoading(true);
    
    try {
      // Форматируем даты для API
      const formattedStartDate = formatDateForApi(startDate, true); // Указываем, что это начальная дата
      const formattedEndDate = formatDateForApi(endDate);

      
      console.log(`Загрузка данных API: от ${formattedStartDate} до ${formattedEndDate}`);
      
      // Запрос к API для данных по месяцам
      const monthlyData = await fetchContractData(formattedStartDate, formattedEndDate);
      setContractData(monthlyData);
      
      // Обновляем модели автомобилей
      if (monthlyData.length > 0) {
        const enrichedModels = monthlyData.map(model => {
          return {
            id: model.model_id,
            name: model.model_name,
            img: `https://uzavtosalon.uz/b/core/m$load_image?sha=${model.photo_sha}&width=400&height=400`,
            category: getCategoryForModel(model.model_name)
          };
        });
        
        setEnhancedModels(enrichedModels);
      }
      
      // Запрос к API для данных по дням
      // Берем текущий месяц для детализации и тепловой карты
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      const formattedMonthStart = formatDateForApi(firstDayOfMonth);
      const formattedMonthEnd = formatDateForApi(lastDayOfMonth);
      
      console.log(`Загрузка данных по дням: от ${formattedMonthStart} до ${formattedMonthEnd}`);
      
      const dailyData = await fetchContractDataByDate(formattedMonthStart, formattedMonthEnd);
      setDailyContractData(dailyData);
      
      console.log("Все данные успешно загружены");
      return true; // Возвращаем успешное завершение
    } catch (error) {
      console.error("Ошибка при загрузке данных:", error);
      return false; // Возвращаем ошибку
    } finally {
      setIsLoading(false);
    }
  };
  
  const processData = () => {
    console.log(`Обработка данных для фильтров: модель=${selectedModel}, регион=${selectedRegion}, период=${selectedPeriod}`);
    
    // Если данные API еще не загружены, прерываем
    if (!contractData || contractData.length === 0) {
      console.log("Нет данных API для обработки");
      return;
    }
    
    // Формируем ключ кэша на основе фильтров
    const cacheKey = `${selectedModel}-${selectedRegion}-${selectedPeriod}`;
    
    // Проверяем, есть ли данные в кэше
    if (processedDataCache.current[cacheKey]) {
      console.log("Использование кэшированных данных");
      const cachedData = processedDataCache.current[cacheKey];
      
      setPeriodData(cachedData.periodData);
      setDetailedData(cachedData.detailedData);
      setModelPerformance(cachedData.modelPerformance);
      
      // Устанавливаем первый доступный период для детализации
      if (cachedData.periodData.length > 0) {
        setSelectedDetailLabel(cachedData.periodData[0].name);
      }
      
      return;
    }
    
    // Обрабатываем данные
    const processed = processContractData(contractData, selectedModel, selectedRegion, selectedPeriod);
    
    // Сохраняем обработанные данные в кэш
    processedDataCache.current[cacheKey] = processed;
    
    // Обновляем состояние
    setPeriodData(processed.periodData);
    setDetailedData(processed.detailedData);
    setModelPerformance(processed.modelPerformance);
    
    // Если есть данные, устанавливаем первый доступный период для детализации
    if (processed.periodData.length > 0) {
      setSelectedDetailLabel(processed.periodData[0].name);
    }
    
    console.log("Данные успешно обработаны");
    console.log("DetailedData.totals:", processed.detailedData.totals);
  };
  
  // Функция для применения фильтра дат
  const applyDateFilter = () => {
    console.log(`Применение фильтров: даты=${startDate}-${endDate}, регион=${selectedRegion}, модель=${selectedModel}`);
    
    // Указываем, что данные не готовы (идет загрузка)
    setIsDataReady(false);
    
    // Сбрасываем кэш при изменении параметров
    processedDataCache.current = {};
    
    // Загружаем данные заново
    loadAllData().then(() => {
      // После завершения загрузки помечаем данные как готовые
      setIsDataReady(true);
    });
  };
  
  // Обработчик для изменения модели
  const handleModelChange = (modelId) => {
    setSelectedModel(modelId);
    
    // Обновляем данные с новым фильтром по модели
    // Важно: не делаем новый запрос, а обрабатываем имеющиеся данные с новым фильтром
    if (contractData.length > 0) {
      const processed = processContractData(contractData, modelId, selectedRegion, selectedPeriod);
      
      setPeriodData(processed.periodData);
      setDetailedData(processed.detailedData);
      setModelPerformance(processed.modelPerformance);
      
      // Если есть данные, устанавливаем первый доступный период для детализации
      if (processed.periodData.length > 0) {
        setSelectedDetailLabel(processed.periodData[0].name);
      }
    }
  };
  
  // Обработчик для изменения региона
  const handleRegionChange = (regionId) => {
    setSelectedRegion(regionId);
    
    // Обновляем данные с новым фильтром по региону
    // Важно: не делаем новый запрос, а обрабатываем имеющиеся данные с новым фильтром
    if (contractData.length > 0) {
      const processed = processContractData(contractData, selectedModel, regionId, selectedPeriod);
      
      setPeriodData(processed.periodData);
      setDetailedData(processed.detailedData);
      setModelPerformance(processed.modelPerformance);
      
      // Если есть данные, устанавливаем первый доступный период для детализации
      if (processed.periodData.length > 0) {
        setSelectedDetailLabel(processed.periodData[0].name);
      }
    }
  };
  
  // Инициализация данных при загрузке компонента
  useEffect(() => {
    loadAllData().then(() => {
      setIsDataReady(true);
    });
  }, []);
  
  // Обработка данных при изменении фильтров или загрузке данных API
  useEffect(() => {
    if (!isLoading && contractData.length > 0) {
      processData();
    }
  }, [selectedModel, selectedRegion, selectedPeriod, contractData, isLoading]);
  
  // Обновляем только label при изменении выбранного периода
  useEffect(() => {
    if (periodData.length > 0 && !isLoading && selectedDetailLabel && detailedData.totals) {
      // Найти выбранный период в данных
      const selectedPeriodData = periodData.find(item => item.name === selectedDetailLabel);
      
      if (selectedPeriodData) {
        console.log("Обновление периода детализации:", selectedDetailLabel);
        
        // ВАЖНО: Сохраняем исходные totals и changes, меняем только label
        setDetailedData(prevData => {
          const updatedData = {
            ...prevData,
            label: selectedPeriodData.name
          };
          console.log("Обновленные данные детализации с сохранением totals:", updatedData);
          return updatedData;
        });
      }
    }
  }, [selectedDetailLabel, periodData, isLoading]);
  
  // Кастомный Tooltip для графиков
  const renderCustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800/95 p-4 rounded-lg shadow-xl border border-gray-700/60 backdrop-blur-sm">
          <p className="text-gray-200 font-medium text-base mb-2">{payload[0]?.payload.name || payload[0]?.payload.day}</p>
          <p className="text-indigo-400 font-medium flex items-center gap-2 mb-1.5">
            <span className="text-lg">📝</span> Контракты: {formatNumber(payload[0]?.payload.contracts)}
          </p>
          <p className="text-emerald-400 font-medium flex items-center gap-2 mb-1.5">
            <span className="text-lg">✅</span> Реализация: {formatNumber(payload[0]?.payload.realization)}
          </p>
          <p className="text-red-400 font-medium flex items-center gap-2">
            <span className="text-lg">❌</span> Отмена: {formatNumber(payload[0]?.payload.cancellation)}
          </p>
        </div>
      );
    }
    return null;
  };
  
  // Функция для обработки данных и подготовки их к отображению на графике
  const processDataForChart = (data, startDateString, endDateString) => {
    if (!data || !data.length) return [];
    
    // Преобразуем строковые даты в объекты Date для сравнения
    const start = new Date(startDateString);
    const end = new Date(endDateString);
    
    // Для гарантии правильного сравнения установим время в начало дня для начальной даты
    // и конец дня для конечной даты
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    console.log("Фильтрация данных по периоду:", start.toLocaleDateString('ru-RU'), "-", end.toLocaleDateString('ru-RU'));
    
    // Фильтруем данные, чтобы оставить только те, что попадают в диапазон дат
    const filteredData = data.filter(item => {
      // Предполагаем, что в item.month хранится строка вида "2025-05"
      if (!item.month) return false;
      
      const [year, month] = item.month.split('-');
      // Создаем дату для первого дня месяца
      const itemDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      
      // Проверяем, попадает ли дата в запрошенный диапазон
      const isInRange = itemDate >= start && itemDate <= end;
      
      if (!isInRange) {
        console.log(`Месяц ${item.name} (${item.month}) не входит в запрошенный диапазон`);
      }
      
      return isInRange;
    });
    
    console.log(`Отфильтровано ${filteredData.length} из ${data.length} периодов`);
    
    // Сортируем по дате
    const sortedData = filteredData.sort((a, b) => {
      const [yearA, monthA] = a.month.split('-');
      const [yearB, monthB] = b.month.split('-');
      
      const dateA = new Date(parseInt(yearA), parseInt(monthA) - 1, 1);
      const dateB = new Date(parseInt(yearB), parseInt(monthB) - 1, 1);
      
      return dateA - dateB;
    });
    
    console.log("Данные для графика после фильтрации и сортировки:", sortedData);
    
    return sortedData;
  };
  
  // Форматирование даты для API (DD.MM.YYYY)
  const formatDateForApi = (dateString, isStartDate = false) => {
    if (!dateString) {
      const today = new Date();
      return `${today.getDate().toString().padStart(2, '0')}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getFullYear()}`;
    }
    
    try {
      const date = new Date(dateString);
      
      if (isStartDate) {
        date.setDate(date.getDate() + 1);
      }
      
      return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
    } catch (e) {
      console.error("Ошибка форматирования даты:", e);
      const today = new Date();
      return `${today.getDate().toString().padStart(2, '0')}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getFullYear()}`;
    }
  };
  
  // Функция для получения номера недели в месяце
  const getWeekNumber = (date) => {
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const pastDaysOfMonth = date.getDate() - 1;
    
    return Math.ceil((pastDaysOfMonth + firstDayOfMonth.getDay()) / 7);
  };

  // Полная функция renderChart
  const renderChart = () => {
    // Если данные еще не готовы после изменения фильтра
    if (!isDataReady) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400">Нажмите "Применить", чтобы обновить данные для выбранного периода.</p>
        </div>
      );
    }
    
    // Проверка наличия данных
    if (!periodData || periodData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400">Нет данных для отображения. Пожалуйста, выберите другой период или фильтры.</p>
        </div>
      );
    }
    
    // Фильтруем данные для отображения только за запрошенный период
    const chartData = processDataForChart(periodData, startDate, endDate);
    
    // Если после фильтрации данных не осталось
    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400">Нет данных для выбранного периода: {new Date(startDate).toLocaleDateString('ru-RU')} - {new Date(endDate).toLocaleDateString('ru-RU')}</p>
        </div>
      );
    }
    
    // Более безопасное сравнение данных без использования JSON.stringify
    const isDataChanged = !prevDataRef.current || 
      chartData.length !== prevDataRef.current.length ||
      chartData.some((item, index) => {
        const prevItem = prevDataRef.current[index];
        return !prevItem || 
          item.name !== prevItem.name || 
          item.contracts !== prevItem.contracts || 
          item.realization !== prevItem.realization || 
          item.cancellation !== prevItem.cancellation;
      });
    
    // Если данные не изменились и у нас уже есть отрисованный график, возвращаем его
    if (!isDataChanged && prevRenderedChartRef.current) {
      console.log("Данные не изменились, используем существующий график");
      return prevRenderedChartRef.current;
    }
    
    // Обновляем ссылку на текущие данные (создаем глубокую копию данных)
    prevDataRef.current = chartData.map(item => ({...item}));
    
    // Настраиваем отображение оси X в зависимости от количества точек данных
    const xAxisConfig = {
      dataKey: "name",
      stroke: "#9ca3af",
      // Корректировка угла и высоты для лучшей читаемости
      angle: chartData.length > 12 ? -45 : 0,
      textAnchor: chartData.length > 12 ? 'end' : 'middle',
      height: chartData.length > 12 ? 60 : 30,
      tick: { fontSize: 12 },
      // Показываем все точки данных
      interval: 0
    };

    let renderedChart;
    
    switch (chartType) {
      case 'line':
        renderedChart = (
          <LineChart data={chartData}>
            <defs>
              <linearGradient id="colorContractsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="colorRealizationGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="colorCancellationGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <XAxis {...xAxisConfig} />
            <YAxis
              stroke="#9ca3af"
              tickFormatter={formatNumber}
              width={70}
            />
            <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
            <Tooltip content={renderCustomTooltip} />
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value) => {
                const labels = {
                  contracts: "Контракты",
                  realization: "Реализация",
                  cancellation: "Отмена"
                };
                return <span style={{ color: '#d1d5db', fontSize: '0.9rem' }}>{labels[value]}</span>
              }}
            />
            <Line
              type="monotone"
              dataKey="contracts"
              stroke="#4f46e5"
              strokeWidth={3}
              dot={{ stroke: '#4f46e5', fill: '#1f2937', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 8, stroke: 'white', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="realization"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ stroke: '#10b981', fill: '#1f2937', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 8, stroke: 'white', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="cancellation"
              stroke="#ef4444"
              strokeWidth={3}
              dot={{ stroke: '#ef4444', fill: '#1f2937', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 8, stroke: 'white', strokeWidth: 2 }}
            />
          </LineChart>
        );
        break;
        
      case 'area':
        renderedChart = (
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorContractsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorRealizationGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorCancellationGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <XAxis {...xAxisConfig} />
            <YAxis
              stroke="#9ca3af"
              tickFormatter={formatNumber}
              width={70}
            />
            <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
            <Tooltip content={renderCustomTooltip} />
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value) => {
                const labels = {
                  contracts: "Контракты",
                  realization: "Реализация",
                  cancellation: "Отмена"
                };
                return <span style={{ color: '#d1d5db', fontSize: '0.9rem' }}>{labels[value]}</span>
              }}
            />
            <Area
              type="monotone"
              dataKey="contracts"
              fill="url(#colorContractsGradient)"
              stroke="#4f46e5"
              strokeWidth={2}
              activeDot={{ r: 8 }}
            />
            <Area
              type="monotone"
              dataKey="realization"
              fill="url(#colorRealizationGradient)"
              stroke="#10b981"
              strokeWidth={2}
              activeDot={{ r: 8 }}
            />
            <Area
              type="monotone"
              dataKey="cancellation"
              fill="url(#colorCancellationGradient)"
              stroke="#ef4444"
              strokeWidth={2}
              activeDot={{ r: 8 }}
            />
          </AreaChart>
        );
        break;
        
      case 'bar':
        renderedChart = (
          <BarChart data={chartData}>
            <XAxis {...xAxisConfig} />
            <YAxis
              stroke="#9ca3af"
              tickFormatter={formatNumber}
              width={70}
            />
            <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
            <Tooltip content={renderCustomTooltip} />
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value) => {
                const labels = {
                  contracts: "Контракты",
                  realization: "Реализация",
                  cancellation: "Отмена"
                };
                return <span style={{ color: '#d1d5db', fontSize: '0.9rem' }}>{labels[value]}</span>
              }}
            />
            <defs>
              <linearGradient id="contractsBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity={1} />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="realizationBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="cancellationBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <Bar
              dataKey="contracts"
              fill="url(#contractsBar)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="realization"
              fill="url(#realizationBar)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="cancellation"
              fill="url(#cancellationBar)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        );
        break;
        
      default:
        renderedChart = (
          <LineChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="contracts"
              stroke="#4f46e5"
            />
            <Line
              type="monotone"
              dataKey="realization"
              stroke="#10b981"
            />
            <Line
              type="monotone"
              dataKey="cancellation"
              stroke="#ef4444"
            />
          </LineChart>
        );
    }
    
    // Сохраняем отрисованный график
    prevRenderedChartRef.current = renderedChart;
    
    return renderedChart;
  };
  
const renderDetailedChart = () => {
  // Проверка наличия данных
  if (!dailyContractData || !Array.isArray(dailyContractData)) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Нет данных для отображения детализации.</p>
      </div>
    );
  }

  // Фильтруем данные по выбранной модели
  const filteredData = selectedModel === 'all'
    ? dailyContractData
    : dailyContractData.filter(model => model.model_id === selectedModel);

  // Фильтруем также по выбранному региону, если он указан
  const filteredByRegion = (selectedRegion === 'all')
    ? filteredData
    : filteredData.map(model => {
      const newModel = { ...model };
      if (newModel.filter_by_date && Array.isArray(newModel.filter_by_date)) {
        newModel.filter_by_date = newModel.filter_by_date.filter(
          region => region.region_id === selectedRegion
        );
      }
      return newModel;
    }).filter(model =>
      model.filter_by_date &&
      model.filter_by_date.length > 0 &&
      model.filter_by_date.some(region => region.data && region.data.length > 0)
    );

  // Если нет данных после фильтрации
  if (filteredByRegion.length === 0 || !filteredByRegion.some(model =>
    model.filter_by_date &&
    Array.isArray(model.filter_by_date) &&
    model.filter_by_date.some(region => region.data && region.data.length > 0)
  )) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Нет данных для отображения детализации по выбранным параметрам.</p>
      </div>
    );
  }

  // Создаем карту данных для каждого дня
  const dayDataMap = {};

  // Собираем данные о контрактах по дням
  filteredByRegion.forEach(model => {
    if (model.filter_by_date && Array.isArray(model.filter_by_date)) {
      model.filter_by_date.forEach(region => {
        if (region.data && Array.isArray(region.data)) {
          region.data.forEach(item => {
            if (item.order_date && item.order_count) {
              const dateStr = item.order_date;
            
              // Инициализируем запись для даты, если ее еще нет
              if (!dayDataMap[dateStr]) {
                dayDataMap[dateStr] = {
                  date: dateStr,
                  day: new Date(dateStr).getDate(),
                  contracts: 0,
                  realization: 0,
                  cancellation: 0
                };
              }
            
              // Добавляем количество контрактов
              dayDataMap[dateStr].contracts += parseInt(item.order_count || 0);
            }
          });
        }
      });
    }
    
    // Аналогично для реализованных контрактов, если они есть в API
    if (model.filter_real_by_date && Array.isArray(model.filter_real_by_date)) {
      model.filter_real_by_date.forEach(region => {
        if (region.data && Array.isArray(region.data)) {
          region.data.forEach(item => {
            if (item.order_date && item.order_count) {
              const dateStr = item.order_date;
              
              // Инициализируем запись для даты, если ее еще нет
              if (!dayDataMap[dateStr]) {
                dayDataMap[dateStr] = {
                  date: dateStr,
                  day: new Date(dateStr).getDate(),
                  contracts: 0,
                  realization: 0,
                  cancellation: 0
                };
              }
              
              // Добавляем количество реализованных контрактов
              dayDataMap[dateStr].realization += parseInt(item.order_count || 0);
            }
          });
        }
      });
    }
    
    // Аналогично для отмененных контрактов, если они есть в API
    if (model.filter_cancel_by_date && Array.isArray(model.filter_cancel_by_date)) {
      model.filter_cancel_by_date.forEach(region => {
        if (region.data && Array.isArray(region.data)) {
          region.data.forEach(item => {
            if (item.order_date && item.order_count) {
              const dateStr = item.order_date;
              
              // Инициализируем запись для даты, если ее еще нет
              if (!dayDataMap[dateStr]) {
                dayDataMap[dateStr] = {
                  date: dateStr,
                  day: new Date(dateStr).getDate(),
                  contracts: 0,
                  realization: 0,
                  cancellation: 0
                };
              }
              
              // Добавляем количество отмененных контрактов
              dayDataMap[dateStr].cancellation += parseInt(item.order_count || 0);
            }
          });
        }
      });
    }
  });

  // Преобразуем объект в массив и сортируем по дате
  const chartData = Object.values(dayDataMap).sort((a, b) => a.day - b.day);

  // Если нет данных
  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Нет данных для отображения детализации.</p>
      </div>
    );
  }

  // Новый кастомный тултип для столбчатой диаграммы
  const renderCustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const date = new Date(data.date);
      const formattedDate = date.toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'short',
        year: 'numeric'
      });
      
      return (
        <div className="bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-700 text-sm">
          <p className="font-semibold text-gray-300 mb-1">{formattedDate}</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
              <p className="text-white">Контракты: <span className="font-bold">{formatNumber(data.contracts)}</span></p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <p className="text-white">Реализация: <span className="font-bold">{formatNumber(data.realization)}</span></p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <p className="text-white">Отмены: <span className="font-bold">{formatNumber(data.cancellation)}</span></p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Функция кастомизации данных для БарЧарта
  const CustomBarShape = ({ x, y, width, height, fill }) => {
    return (
      <g>
        <rect 
          x={x} 
          y={y} 
          width={width} 
          height={height} 
          fill={fill} 
          rx={4} 
          ry={4}
          filter="url(#drop-shadow)"
        />
        <rect 
          x={x} 
          y={y} 
          width={width} 
          height={5}
          fill="white" 
          fillOpacity={0.2} 
          rx={4} 
          ry={4}
        />
      </g>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={500}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        barSize={20}
      >
        <defs>
          <filter id="drop-shadow" height="130%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur"/>
            <feOffset in="blur" dx="0" dy="2" result="offsetBlur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3"/>
            </feComponentTransfer>
            <feMerge> 
              <feMergeNode in="offsetBlur"/>
              <feMergeNode in="SourceGraphic"/> 
            </feMerge>
          </filter>
        </defs>
        <CartesianGrid stroke="#374151" strokeDasharray="3 3" vertical={false} />
        <XAxis 
          dataKey="day" 
          stroke="#9ca3af"
          tickFormatter={(day) => `${day}`}
          // Отображаем все дни последовательно
          ticks={chartData.map(d => d.day)}
          // Если график получится слишком плотным, можно использовать это условное отображение
          // ticks={chartData.length <= 15
          //   ? chartData.map(d => d.day)
          //   : Array.from(
          //       { length: Math.ceil((Math.max(...chartData.map(item => item.day)) - Math.min(...chartData.map(item => item.day)) + 1) / 2) },
          //       (_, i) => Math.min(...chartData.map(item => item.day)) + i * 2
          //     )
          // }
        />
        <YAxis 
          stroke="#9ca3af" 
          tickFormatter={formatNumber} 
        />
        <Tooltip 
          content={renderCustomTooltip} 
          cursor={{ fill: 'rgba(107, 114, 128, 0.2)' }}
        />
        <Legend
          verticalAlign="top"
          height={40}
          formatter={(value) => {
            const labels = {
              'contracts': 'Контракты',
              'realization': 'Реализация',
              'cancellation': 'Отмены'
            };
            return <span className="text-sm text-gray-300">{labels[value]}</span>;
          }}
        />
        <Bar 
          dataKey="contracts" 
          name="contracts"
          fill="#4f46e5" 
          shape={<CustomBarShape />}
          animationDuration={1000}
          animationBegin={0}
        />
        <Bar 
          dataKey="realization" 
          name="realization"
          fill="#10b981" 
          shape={<CustomBarShape />}
          animationDuration={1000}
          animationBegin={200}
        />
        <Bar 
          dataKey="cancellation" 
          name="cancellation"
          fill="#ef4444" 
          shape={<CustomBarShape />}
          animationDuration={1000}
          animationBegin={400}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};
  
  
  const filteredModels = enhancedModels.filter(model => {
    // Получаем данные о производительности для модели
    const modelStats = modelPerformance[model.id];
  
    // Проверяем наличие ненулевых данных
    return modelStats && (
      (modelStats.contracts && modelStats.contracts > 0) ||
      (modelStats.realization && modelStats.realization > 0) ||
      (modelStats.cancellation && modelStats.cancellation > 0)
    );
  });
  
  const renderHeatmap = () => {
    // Проверка наличия данных
    if (!dailyContractData || !Array.isArray(dailyContractData)) {
      return (
        <div className="flex items-center justify-center h-48">
          <p className="text-gray-400">Нет данных для отображения тепловой карты.</p>
        </div>
      );
    }
  
    // Функция для определения цвета ячейки с фиксированными пороговыми значениями
    const colorScale = (value) => {
      // Если нет значения, возвращаем серый цвет
      if (value === null || value === undefined || value === 0) {
        return "rgba(75, 85, 99, 0.2)"; // серый цвет для дней без данных
      }
    
      // Фиксированные пороговые значения
      if (value < 1000) {
        // Мало (синий)
        return "rgba(59, 130, 246, 0.7)";
      } else if (value < 1200) {
        // Средне (фиолетовый)
        return "rgba(139, 92, 246, 0.7)";
      } else if (value < 1500) {
        // Много (оранжевый)
        return "rgba(249, 115, 22, 0.7)";
      } else {
        // Очень много (красный)
        return "rgba(239, 68, 68, 0.7)";
      }
    };
  
    // Фильтруем данные по выбранной модели
    const filteredData = selectedModel === 'all'
      ? dailyContractData
      : dailyContractData.filter(model => model.model_id === selectedModel);
  
    // Фильтруем также по выбранному региону, если он указан
    const filteredByRegion = (selectedRegion === 'all')
      ? filteredData
      : filteredData.map(model => {
        const newModel = { ...model };
        if (newModel.filter_by_date && Array.isArray(newModel.filter_by_date)) {
          newModel.filter_by_date = newModel.filter_by_date.filter(
            region => region.region_id === selectedRegion
          );
        }
        return newModel;
      }).filter(model =>
        model.filter_by_date &&
        model.filter_by_date.length > 0 &&
        model.filter_by_date.some(region => region.data && region.data.length > 0)
      );
  
    // Если нет данных после фильтрации
    if (filteredByRegion.length === 0 || !filteredByRegion.some(model =>
      model.filter_by_date &&
      Array.isArray(model.filter_by_date) &&
      model.filter_by_date.some(region => region.data && region.data.length > 0)
    )) {
      return (
        <div className="flex items-center justify-center h-48">
          <p className="text-gray-400">Нет данных для отображения тепловой карты по выбранным параметрам.</p>
        </div>
      );
    }
  
    // Собираем все даты
    const allDates = [];
    filteredByRegion.forEach(model => {
      if (model.filter_by_date && Array.isArray(model.filter_by_date)) {
        model.filter_by_date.forEach(region => {
          if (region.data && Array.isArray(region.data)) {
            region.data.forEach(item => {
              if (item.order_date) {
                allDates.push(item.order_date);
              }
            });
          }
        });
      }
    });
  
    // Если нет дат
    if (allDates.length === 0) {
      return (
        <div className="flex items-center justify-center h-48">
          <p className="text-gray-400">Нет данных о датах для отображения тепловой карты.</p>
        </div>
      );
    }
  
    // Определяем месяц и год
    const firstDate = new Date(allDates[0]);
    const currentYear = firstDate.getFullYear();
    const currentMonth = firstDate.getMonth();
  
    // Получаем название месяца
    const monthNames = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    const currentMonthName = `${monthNames[currentMonth]} ${currentYear}`;
  
    // Создаем объект для хранения данных по дням
    const dayDataMap = {};
  
    // Заполняем данные по дням
    filteredByRegion.forEach(model => {
      if (model.filter_by_date && Array.isArray(model.filter_by_date)) {
        model.filter_by_date.forEach(region => {
          if (region.data && Array.isArray(region.data)) {
            region.data.forEach(item => {
              if (item.order_date && item.order_count) {
                const date = new Date(item.order_date);
                // Проверяем, что дата относится к текущему месяцу
                if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
                  const day = date.getDate();
                
                  // Инициализируем данные для дня, если их еще нет
                  if (!dayDataMap[day]) {
                    dayDataMap[day] = 0;
                  }
                
                  // Добавляем количество заказов
                  dayDataMap[day] += parseInt(item.order_count);
                }
              }
            });
          }
        });
      }
    });
  
    // Получаем первый день месяца
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    // День недели для первого дня месяца (0 - воскресенье, 1 - понедельник, ...)
    let firstDayOfWeek = firstDayOfMonth.getDay();
    // Преобразуем в формат 1-7, где 1 - понедельник, 7 - воскресенье
    if (firstDayOfWeek === 0) firstDayOfWeek = 7;
  
    // Получаем последний день месяца
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
  
    // Сегодняшний день (для определения будущих дней)
    const today = new Date();
    const currentDay = today.getDate();
    const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;
  
    // Создаем недели
    const weeks = [];
    let currentWeek = { week: "Неделя 1" };
    let weekNumber = 1;
  
    // Заполняем пустые ячейки до первого дня месяца
    for (let i = 1; i < firstDayOfWeek; i++) {
      currentWeek[`day${i}`] = { day: null, value: null };
    }
  
    // Заполняем дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
      // Вычисляем день недели для текущего дня
      const dayOfWeek = (firstDayOfWeek + day - 1) % 7 || 7;
    
      // Если начинается новая неделя, добавляем текущую неделю в список и создаем новую
      if (dayOfWeek === 1 && day > 1) {
        weeks.push(currentWeek);
        weekNumber++;
        currentWeek = { week: `Неделя ${weekNumber}` };
      }
    
      // Определяем, является ли день будущим (после сегодняшнего дня для текущего месяца)
      const isFuture = isCurrentMonth && day > currentDay;
    
      // Заполняем данные для дня
      currentWeek[`day${dayOfWeek}`] = {
        day: day,
        value: dayDataMap[day] || 0,
        isFuture
      };
    }
  
    // Заполняем пустые ячейки после последнего дня месяца
    const lastDayOfWeek = (firstDayOfWeek + daysInMonth - 1) % 7 || 7;
    for (let i = lastDayOfWeek + 1; i <= 7; i++) {
      currentWeek[`day${i}`] = { day: null, value: null };
    }
  
    // Добавляем последнюю неделю
    weeks.push(currentWeek);
  
    // Отрисовка тепловой карты
    return (
      <>
        {/* Добавляем заголовок с текущим месяцем */}
        <div className="mb-4">
          <h4 className="text-lg font-medium text-white">Тепловая карта за {currentMonthName}</h4>
        </div>
      
        <div className="grid grid-cols-8 gap-1 w-full">
          <div className="col-span-1"></div>
          <div className="font-medium text-gray-400 text-center text-sm">Пн</div>
          <div className="font-medium text-gray-400 text-center text-sm">Вт</div>
          <div className="font-medium text-gray-400 text-center text-sm">Ср</div>
          <div className="font-medium text-gray-400 text-center text-sm">Чт</div>
          <div className="font-medium text-gray-400 text-center text-sm">Пт</div>
          <div className="font-medium text-gray-400 text-center text-sm">Сб</div>
          <div className="font-medium text-gray-400 text-center text-sm">Вс</div>
        
          {weeks.map((week, weekIndex) => (
            <React.Fragment key={`week-row-${weekIndex}`}>
              <div className="font-medium text-gray-400 text-sm flex items-center">
                {week.week}
              </div>
              {[1, 2, 3, 4, 5, 6, 7].map(day => {
                const dayData = week[`day${day}`];
              
                // Пустая ячейка (день другого месяца)
                if (!dayData || dayData.day === null) {
                  return (
                    <div
                      key={`cell-${weekIndex}-${day}`}
                      className="aspect-square rounded-md bg-gray-800/30"
                    ></div>
                  );
                }
              
                // Определяем, является ли день будущим
                const isFuture = dayData.isFuture;
                const cellColor = isFuture ? "rgba(75, 85, 99, 0.2)" : colorScale(dayData.value);
              
                return (
                  <div
                    key={`cell-${weekIndex}-${day}`}
                    className={`aspect-square rounded-md flex flex-col items-center justify-center text-xs font-medium relative overflow-hidden transition-all duration-300 ${!isFuture ? 'hover:scale-105 hover:shadow-lg cursor-pointer' : ''} group`}
                    style={{ backgroundColor: cellColor }}
                  >
                    <span className={`text-[10px] mb-1 ${isFuture ? 'text-gray-500' : 'text-gray-300'}`}>
                      {dayData.day}
                    </span>
                    <span className={`relative z-10 ${isFuture ? 'text-gray-500' : 'text-white'}`}>
                      {!isFuture && dayData.value > 0 ? dayData.value : ''}
                    </span>
                    {!isFuture && <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300"></div>}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 rounded-xl shadow-2xl border border-gray-700/40 w-full mx-auto overflow-hidden">
      {isLoading ? (
        <ContentReadyLoader
          isLoading={isLoading}
          timeout={5000}
        />
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Анализ контрактов {getPeriodLabel(selectedPeriod).toLowerCase()}
              {selectedModel !== 'all' && (
                <span className="ml-2 font-medium text-indigo-400 text-2xl">
                  — {enhancedModels.find(m => m.id === selectedModel)?.name}
                </span>
              )}
            </h2>
            <p className="text-gray-400">
              {selectedModel === 'all'
                ? `${getPeriodDescription(selectedPeriod, customStartDate, customEndDate)} по контрактам, реализации и отменам для всех моделей`
                : `Детальная статистика ${selectedPeriod === 'year' ? 'за год' : selectedPeriod === 'quarter' ? 'за полгода' : selectedPeriod === 'month' ? 'за месяц' : 'за неделю'} по модели ${enhancedModels.find(m => m.id === selectedModel)?.name}`
              }
            </p>
          </div>
        
          <FilterPanel
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            regionsList={regions}
            carModels={filteredModels}
            applyDateFilter={applyDateFilter}
            handleModelChange={handleModelChange}
            handleRegionChange={handleRegionChange}
          />
        
          <StatsCards
            selectedPeriod={selectedPeriod}
            selectedDetailLabel={selectedDetailLabel}
            selectedModel={selectedModel}
            detailedData={detailedData}
            activeMetric={activeMetric}
            setActiveMetric={setActiveMetric}
            carModels={enhancedModels}
            modelPerformance={modelPerformance}
            startDate={startDate}
            endDate={endDate}
          />
        
          {/* Детали выбранной модели */}
          <SelectedModelDetails
            selectedModel={selectedModel}
            selectedPeriod={selectedPeriod}
            carModels={enhancedModels}
            modelPerformance={modelPerformance}
            regions={regions}
            getPeriodLabel={getPeriodLabel}
          />
        
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/60 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <span className="text-2xl mr-2">📈</span>
                  Динамика показателей {getPeriodLabel(selectedPeriod).toLowerCase()}
                  {selectedModel !== 'all' && (
                    <span className="ml-2 text-indigo-400 text-base">
                      ({enhancedModels.find(m => m.id === selectedModel)?.name})
                    </span>
                  )}
                </h3>
              </div>
            
              <div className="w-full h-80">
                {periodData && periodData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400">Нет данных для отображения графика.</p>
                  </div>
                )}
              </div>
            </div>
          
            {/* Тепловая карта - проверяем наличие данных в order_count */}
            {(() => {
              // Проверка наличия данных с ненулевым order_count для тепловой карты
              const hasHeatmapData = dailyContractData &&
                Array.isArray(dailyContractData) &&
                dailyContractData.length > 0 &&
                dailyContractData.some(model => {
                  // Проверяем только выбранную модель или все модели
                  if (selectedModel !== 'all' && model.model_id !== selectedModel) {
                    return false;
                  }
                                  
                  // Проверяем наличие данных в filter_by_date
                  if (!model.filter_by_date || !Array.isArray(model.filter_by_date)) {
                    return false;
                  }
                                  
                  // Проверяем наличие данных по выбранному региону или по всем регионам
                  const filteredRegions = selectedRegion === 'all'
                    ? model.filter_by_date
                    : model.filter_by_date.filter(region => region.region_id === selectedRegion);
                                  
                  // Проверяем наличие ненулевых order_count в данных
                  return filteredRegions.some(region =>
                    region.data &&
                    Array.isArray(region.data) &&
                    region.data.some(item => parseInt(item.order_count || 0) > 0)
                  );
                });
                                
              // Если данных нет, не показываем блок вообще
              if (!hasHeatmapData) {
                return null;
              }
            
              // Иначе показываем блок с тепловой картой
              return (
                <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/60 shadow-lg hover:shadow-xl transition-all duration-300">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                    <span className="text-2xl mr-2">🗓️</span>
                    Тепловая карта контрактов
                  </h3>
                  {renderHeatmap()}
                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500/70 mr-1"></div>
                      <span className="text-xs text-gray-400">Мало</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-purple-500/70 mr-1"></div>
                      <span className="text-xs text-gray-400">Средне</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-orange-500/70 mr-1"></div>
                      <span className="text-xs text-gray-400">Много</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-red-500/70 mr-1"></div>
                      <span className="text-xs text-gray-400">Очень много</span>
                    </div>
                </div>
               </div>
             );
           })()}
         </div>

         {/* График по дням детализации - проверяем наличие данных в order_count */}
         {(() => {
           // Проверка наличия данных с ненулевым order_count для графика детализации
           const hasDetailedData = dailyContractData &&
             Array.isArray(dailyContractData) &&
             dailyContractData.length > 0 &&
             dailyContractData.some(model => {
               // Проверяем только выбранную модель или все модели
               if (selectedModel !== 'all' && model.model_id !== selectedModel) {
                 return false;
               }
                               
               // Проверяем наличие данных в filter_by_date
               if (!model.filter_by_date || !Array.isArray(model.filter_by_date)) {
                 return false;
               }
                               
               // Проверяем наличие данных по выбранному региону или по всем регионам
               const filteredRegions = selectedRegion === 'all'
                 ? model.filter_by_date
                 : model.filter_by_date.filter(region => region.region_id === selectedRegion);
                               
               // Проверяем наличие ненулевых order_count в данных
               return filteredRegions.some(region =>
                 region.data &&
                 Array.isArray(region.data) &&
                 region.data.some(item => parseInt(item.order_count || 0) > 0)
               );
             });
             // Если данных нет, не показываем блок вообще
           if (!hasDetailedData) {
             return null;
           }
         
           // Иначе показываем блок с графиком детализации
           return (
             <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/60 shadow-lg hover:shadow-xl transition-all duration-300 mb-6">
               <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                 <span className="text-2xl mr-2">📅</span>
                 Детализация по дням месяца
               </h3>
             
               <div className="w-full h-64">
                 <ResponsiveContainer width="100%" height="100%">
                   {renderDetailedChart()}
                 </ResponsiveContainer>
               </div>
             </div>
           );
         })()}

         {/* Сравнительный анализ моделей - отображаем только если есть данные и выбраны все модели */}
         {selectedModel === 'all' && Object.keys(modelPerformance).filter(key => key !== 'totalContracts').length > 0 && (
           <ModelComparisonChart
             modelPerformance={modelPerformance}
             carModels={enhancedModels}
             selectedPeriod={selectedPeriod}
             getPeriodLabel={getPeriodLabel}
             startDate={startDate}
             endDate={endDate}
           />
         )}
       </>
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


export default ContractsAnalyticsDashboard;