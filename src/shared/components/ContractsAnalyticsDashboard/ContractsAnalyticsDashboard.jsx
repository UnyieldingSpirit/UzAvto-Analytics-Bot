'use client'
import { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';

// Импорт компонентов
import FilterPanel from './FilterPanel';
import SelectedModelDetails from './SelectedModelDetails';
import ModelComparisonChart from './ModelComparisonChart';
import StatsCards from './StatsCards'
// Импорт утилит и сервисов
import { formatNumber, getPeriodLabel, getPeriodDescription } from './utils/formatters';
import { fetchContractData, processContractData } from './services/contractService';
import { regions } from './models/regions';

export default function ContractsAnalyticsDashboard() {
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
  const [heatmapData, setHeatmapData] = useState([]);
  const [modelPerformance, setModelPerformance] = useState({});
  const [enhancedModels, setEnhancedModels] = useState([]);
  const [contractData, setContractData] = useState([]); // Храним данные от API
  
  // Состояния для кастомного периода
  const [isCustomPeriod, setIsCustomPeriod] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [customEndDate, setCustomEndDate] = useState(new Date());
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().substring(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().substring(0, 10));
  
  // Кэш обработанных данных
  const processedDataCache = useRef({});
  
  // Генерация тепловой карты
  const generateHeatmapData = (selectedModelId = 'all', period = 'year') => {
    const heatmap = [];
    
    // Базовое значение зависит от модели и периода
    let baseValue = selectedModelId === 'all' ? 80 : 40; // Меньше значения для одной модели
    
    // Корректируем базовое значение в зависимости от периода
    switch (period) {
      case 'quarter':
        baseValue *= 1.2;
        break;
      case 'month':
        baseValue *= 0.5;
        break;
      case 'week':
        baseValue *= 0.2;
        break;
    }
    
    // Количество недель для отображения
    const weeksCount = period === 'week' ? 1 : 4;
    
    for (let week = 0; week < weeksCount; week++) {
      const weekData = { week: `Неделя ${week + 1}` };
      
      for (let day = 1; day <= 7; day++) {
        // В выходные (6,7) меньше контрактов
        const dayFactor = (day === 6 || day === 7) ? 0.7 : 1.0;
        // Значение для тепловой карты
        weekData[`day${day}`] = Math.round(baseValue * dayFactor * (0.5 + Math.random()));
      }
      
      heatmap.push(weekData);
    }
    
    return heatmap;
  };
  
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
  
  // Функция для загрузки данных с API
  const loadDataFromApi = async () => {
    setIsLoading(true);
    
    try {
      // Получаем текущую дату
      const currentDate = new Date();
      
      // Формируем дату начала текущего года (1 января)
      const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
      
      // Получаем форматированные даты для API
      const formattedStartDate = isCustomPeriod
        ? `${customStartDate.getDate().toString().padStart(2, '0')}.${(customStartDate.getMonth() + 1).toString().padStart(2, '0')}.${customStartDate.getFullYear()}`
        : `${startOfYear.getDate().toString().padStart(2, '0')}.${(startOfYear.getMonth() + 1).toString().padStart(2, '0')}.${startOfYear.getFullYear()}`;
        
      const formattedEndDate = isCustomPeriod
        ? `${customEndDate.getDate().toString().padStart(2, '0')}.${(customEndDate.getMonth() + 1).toString().padStart(2, '0')}.${customEndDate.getFullYear()}`
        : `${currentDate.getDate().toString().padStart(2, '0')}.${(currentDate.getMonth() + 1).toString().padStart(2, '0')}.${currentDate.getFullYear()}`;
      
      console.log(`Загрузка данных API: от ${formattedStartDate} до ${formattedEndDate}`);
      
      // Запрос к API
      const data = await fetchContractData(formattedStartDate, formattedEndDate);
      
      // Сохраняем данные API
      setContractData(data);
      
      // Обновляем модели автомобилей
      if (data.length > 0) {
        const enrichedModels = data.map(model => {
          return {
            id: model.model_id,
            name: model.model_name,
            img: `https://uzavtosalon.uz/b/core/m$load_image?sha=${model.photo_sha}&width=400&height=400`,
            category: getCategoryForModel(model.model_name)
          };
        });
        
        setEnhancedModels(enrichedModels);
      }
      
      console.log("Данные API успешно загружены:", data.length);
    } catch (error) {
      console.error("Ошибка при загрузке данных API:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Функция для обработки данных на основе фильтров
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
      setHeatmapData(generateHeatmapData(selectedModel, selectedPeriod));
      
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
    setHeatmapData(generateHeatmapData(selectedModel, selectedPeriod));
    
    // Если есть данные, устанавливаем первый доступный период для детализации
    if (processed.periodData.length > 0) {
      setSelectedDetailLabel(processed.periodData[0].name);
    }
    
    console.log("Данные успешно обработаны");
    console.log("DetailedData.totals:", processed.detailedData.totals);
  };
  
  // Функция для применения фильтра дат - ИЗМЕНЕНО: теперь только загружает новые данные API
// Функция для применения фильтра дат
const applyDateFilter = () => {
  console.log(`Применение фильтров: даты=${startDate}-${endDate}, регион=${selectedRegion}, модель=${selectedModel}`);
  
  // Сбрасываем кэш при изменении параметров
  processedDataCache.current = {};
  
  // Устанавливаем состояние загрузки
  setIsLoading(true);
  
  try {
    // Форматируем даты для API
    const formattedStartDate = formatDateForApi(startDate);
    const formattedEndDate = formatDateForApi(endDate);
    
    console.log(`Отправка запроса с параметрами: даты=${formattedStartDate}-${formattedEndDate}, регион=${selectedRegion}, модель=${selectedModel}`);
    
    // Запрос к API с выбранными пользователем параметрами
    fetchContractData(formattedStartDate, formattedEndDate)
      .then(data => {
        setContractData(data);
        
        // Обрабатываем данные с применением текущих фильтров по модели и региону
        const processed = processContractData(data, selectedModel, selectedRegion, selectedPeriod);
        
        // Обновляем состояния на основе обработанных данных
        setPeriodData(processed.periodData);
        setDetailedData(processed.detailedData);
        setModelPerformance(processed.modelPerformance);
        setHeatmapData(generateHeatmapData(selectedModel, selectedPeriod));
        
        // Если есть данные, устанавливаем первый доступный период для детализации
        if (processed.periodData.length > 0) {
          setSelectedDetailLabel(processed.periodData[0].name);
        }
      })
      .catch(error => {
        console.error("Ошибка при загрузке данных:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
      
  } catch (error) {
    console.error("Ошибка при форматировании дат:", error);
    setIsLoading(false);
  }
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
    setHeatmapData(generateHeatmapData(modelId, selectedPeriod));
    
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
    setHeatmapData(generateHeatmapData(selectedModel, selectedPeriod));
    
    // Если есть данные, устанавливаем первый доступный период для детализации
    if (processed.periodData.length > 0) {
      setSelectedDetailLabel(processed.periodData[0].name);
    }
  }
};
  
  // Инициализация данных при загрузке компонента
  useEffect(() => {
    loadDataFromApi();
  }, []);
  
  // Обработка данных при изменении фильтров или загрузке данных API
  useEffect(() => {
    if (!isLoading && contractData.length > 0) {
      processData();
    }
  }, [selectedModel, selectedRegion, selectedPeriod, contractData, isLoading]);
  
  // Обработка выбора кастомного периода
  const handleCustomPeriodSelect = () => {
    setIsCustomPeriod(true);
    setSelectedPeriod('custom');
    
    // Сбрасываем кэш при изменении периода
    processedDataCache.current = {};
    
    // Загружаем данные для нового периода
    loadDataFromApi();
  };
  
  // ВАЖНО: Детализированные данные не меняем полностью, а только обновляем график
  useEffect(() => {
    if (periodData.length > 0 && !isLoading && selectedDetailLabel && detailedData.totals) {
      // Найти выбранный период в данных
      const selectedPeriodData = periodData.find(item => item.name === selectedDetailLabel);
      
      if (selectedPeriodData) {
        console.log("Обновление графика детализации для периода:", selectedDetailLabel);
        
        // Для примера используем помощника для генерации детализированных данных
        const generateDetailedDaysFromPeriod = (periodItem) => {
          const days = [];
          const daysInMonth = 30; // Предполагаем 30 дней в месяце для упрощения
          
          for (let day = 1; day <= daysInMonth; day++) {
            // Применяем некоторую случайность с сохранением общей суммы
            const dayFactor = (day % 7 === 0 || day % 7 === 6) ? 0.7 : 1.0; // В выходные меньше
            const randomFactor = 0.7 + Math.random() * 0.6;
            
            const contracts = Math.max(1, Math.round((periodItem.contracts / daysInMonth) * randomFactor * dayFactor));
            const realization = Math.max(0, Math.round((periodItem.realization / daysInMonth) * randomFactor * dayFactor));
            const cancellation = Math.max(0, Math.round((periodItem.cancellation / daysInMonth) * randomFactor * dayFactor));
            
            days.push({
              day: day,
              contracts,
              realization,
              cancellation
            });
          }
          
          return days;
        };
        
        // ВАЖНО: Сохраняем исходные totals и changes, меняем только data и label
        setDetailedData(prevData => {
          const updatedData = {
            ...prevData,
            label: selectedPeriodData.name,
            data: generateDetailedDaysFromPeriod(selectedPeriodData)
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
const formatDateForApi = (dateString) => {
  if (!dateString) {
    const today = new Date();
    return `${today.getDate().toString().padStart(2, '0')}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getFullYear()}`;
  }
  
  try {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
  } catch (e) {
    console.error("Ошибка форматирования даты:", e);
    const today = new Date();
    return `${today.getDate().toString().padStart(2, '0')}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getFullYear()}`;
  }
};

// Функция для рендеринга графика
const renderChart = () => {
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
  
  // Настраиваем отображение оси X в зависимости от количества точек данных
  const xAxisConfig = {
    dataKey: "name",
    stroke: "#9ca3af",
    // Корректировка угла и высоты для лучшей читаемости
    angle: chartData.length > 12 ? -45 : 0,
    textAnchor: chartData.length > 12 ? 'end' : 'middle', 
    height: chartData.length > 12 ? 60 : 30,
    tick: {fontSize: 12},
    // Показываем все точки данных
    interval: 0 
  };

  switch (chartType) {
    case 'line':
      return (
        <LineChart data={chartData}>
          <defs>
            <linearGradient id="colorContractsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.2}/>
            </linearGradient>
            <linearGradient id="colorRealizationGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
            </linearGradient>
            <linearGradient id="colorCancellationGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2}/>
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
              return <span style={{color: '#d1d5db', fontSize: '0.9rem'}}>{labels[value]}</span>
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
      
    case 'area':
      return (
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorContractsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorRealizationGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorCancellationGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
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
              return <span style={{color: '#d1d5db', fontSize: '0.9rem'}}>{labels[value]}</span>
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
      
    case 'bar':
      return (
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
              return <span style={{color: '#d1d5db', fontSize: '0.9rem'}}>{labels[value]}</span>
            }}
          />
          <defs>
            <linearGradient id="contractsBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity={1}/>
              <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.6}/>
            </linearGradient>
            <linearGradient id="realizationBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={1}/>
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.6}/>
            </linearGradient>
            <linearGradient id="cancellationBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={1}/>
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.6}/>
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
      
    default:
      return (
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
};

  
  // График для детализации по дням выбранного периода
  const renderDetailedChart = () => {
    if (!detailedData.data) return null;
    
    return (
      <LineChart data={detailedData.data}>
        <defs>
          <linearGradient id="colorContractsMonth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.2}/>
          </linearGradient>
          <linearGradient id="colorRealizationMonth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
          </linearGradient>
          <linearGradient id="colorCancellationMonth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2}/>
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="day" 
          stroke="#9ca3af"
          tick={{ fontSize: 12 }}
          // Корректируем показ тиков в зависимости от количества дней
          ticks={detailedData.data.length <= 7 
            ? detailedData.data.map(d => d.day)
            : [1, 5, 10, 15, 20, 25, 30].filter(d => d <= detailedData.data.length)}
        />
        <YAxis stroke="#9ca3af" tickFormatter={formatNumber}/>
        <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
        <Tooltip content={renderCustomTooltip} />
        <Line 
          type="monotone" 
          dataKey="contracts" 
          stroke="#4f46e5" 
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6, stroke: 'white', strokeWidth: 2 }}
        />
        <Line 
          type="monotone" 
          dataKey="realization" 
          stroke="#10b981" 
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6, stroke: 'white', strokeWidth: 2 }}
        />
        <Line 
          type="monotone" 
          dataKey="cancellation" 
          stroke="#ef4444" 
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6, stroke: 'white', strokeWidth: 2 }}
        />
      </LineChart>
    );
  };
  
  // Тепловая карта для визуализации интенсивности контрактов
  const renderHeatmap = () => {
    const colorScale = (value) => {
      // Адаптируем шкалу под периоды
      let minVal, maxVal;
      switch (selectedPeriod) {
        case 'year':
        case 'quarter':
          minVal = 20;
          maxVal = 140;
          break;
        case 'month':
          minVal = 10;
          maxVal = 70;
          break;
        case 'week':
          minVal = 2;
          maxVal = 20;
          break;
        default:
          minVal = 20;
          maxVal = 140;
      }
      
      const normalizedVal = Math.min(1, Math.max(0, (value - minVal) / (maxVal - minVal)));
      
      // Градиент от синего (холодный) к красному (горячий)
      if (normalizedVal < 0.25) {
        return `rgba(59, 130, 246, ${0.3 + normalizedVal * 0.7})`;
      } else if (normalizedVal < 0.5) {
        return `rgba(139, 92, 246, ${0.3 + normalizedVal * 0.7})`;
      } else if (normalizedVal < 0.75) {
        return `rgba(249, 115, 22, ${0.3 + normalizedVal * 0.7})`;
      } else {
        return `rgba(239, 68, 68, ${0.3 + normalizedVal * 0.7})`;
      }
    };
    
    // Адаптируем отображение тепловой карты для недельного вида
    if (selectedPeriod === 'week' && heatmapData.length === 1) {
      return (
        <div className="grid grid-cols-8 gap-1 w-full">
          <div className="col-span-1"></div>
          <div className="font-medium text-gray-400 text-center text-sm">Пн</div>
          <div className="font-medium text-gray-400 text-center text-sm">Вт</div>
          <div className="font-medium text-gray-400 text-center text-sm">Ср</div>
          <div className="font-medium text-gray-400 text-center text-sm">Чт</div>
          <div className="font-medium text-gray-400 text-center text-sm">Пт</div>
          <div className="font-medium text-gray-400 text-center text-sm">Сб</div>
          <div className="font-medium text-gray-400 text-center text-sm">Вс</div>
          
          <div className="font-medium text-gray-400 text-sm flex items-center">
            Неделя
          </div>
          {[1,2,3,4,5,6,7].map(day => (
            <div 
              key={`cell-week-${day}`}
              className="aspect-square rounded-md flex items-center justify-center text-xs font-medium text-white relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer group"
              style={{ backgroundColor: colorScale(heatmapData[0][`day${day}`]) }}
            >
              <span className="relative z-10">{heatmapData[0][`day${day}`]}</span>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300"></div>
            </div>
          ))}
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-8 gap-1 w-full">
        <div className="col-span-1"></div>
        <div className="font-medium text-gray-400 text-center text-sm">Пн</div>
        <div className="font-medium text-gray-400 text-center text-sm">Вт</div>
        <div className="font-medium text-gray-400 text-center text-sm">Ср</div>
        <div className="font-medium text-gray-400 text-center text-sm">Чт</div>
        <div className="font-medium text-gray-400 text-center text-sm">Пт</div>
        <div className="font-medium text-gray-400 text-center text-sm">Сб</div>
        <div className="font-medium text-gray-400 text-center text-sm">Вс</div>
        
        {heatmapData.map((week, weekIndex) => (
          <>
            <div key={`week-${weekIndex}`} className="font-medium text-gray-400 text-sm flex items-center">
              {week.week}
            </div>
            {[1,2,3,4,5,6,7].map(day => (
              <div 
                key={`cell-${weekIndex}-${day}`}
                className="aspect-square rounded-md flex items-center justify-center text-xs font-medium text-white relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer group"
                style={{ backgroundColor: colorScale(week[`day${day}`]) }}
              >
                <span className="relative z-10">{week[`day${day}`]}</span>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300"></div>
              </div>
            ))}
          </>
        ))}
      </div>
    );
    };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 rounded-xl shadow-2xl border border-gray-700/40 w-full mx-auto overflow-hidden">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400 text-lg">Загрузка данных...</p>
        </div>
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
  carModels={enhancedModels}
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
          
          {/* Основной график */}
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
                <div className="flex flex-wrap gap-2">
                  <button 
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${chartType === 'line' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-700/80 text-gray-300 hover:bg-gray-600/80'}`}
                    onClick={() => setChartType('line')}
                  >
                    Линия
                  </button>
                  <button 
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${chartType === 'area' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-700/80 text-gray-300 hover:bg-gray-600/80'}`}
                    onClick={() => setChartType('area')}
                  >
                    Область
                  </button>
                  <button 
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${chartType === 'bar' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-700/80 text-gray-300 hover:bg-gray-600/80'}`}
                    onClick={() => setChartType('bar')}
                  >
                    Столбцы
                  </button>
                </div>
              </div>
              
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  {renderChart()}
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Тепловая карта */}
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
          </div>
          
          {/* График по дням детализации */}
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/60 shadow-lg hover:shadow-xl transition-all duration-300 mb-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <span className="text-2xl mr-2">📅</span> 
              Детализация {
                selectedPeriod === 'week' ? 'по дням недели' : 
                selectedPeriod === 'month' ? 'по дням месяца' : 
                `для ${selectedDetailLabel}`
              }
            </h3>
            
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                {renderDetailedChart()}
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Сравнительный анализ моделей */}
{selectedModel === 'all' && (
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