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
  
  // Состояния для кастомного периода
  const [isCustomPeriod, setIsCustomPeriod] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [customEndDate, setCustomEndDate] = useState(new Date());
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().substring(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().substring(0, 10));
  
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
  
  // Получение и обработка данных
const fetchData = async () => {
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
    
    // Запрос к API
    const contractData = await fetchContractData(formattedStartDate, formattedEndDate);
    
    // Обработка данных из API
    const processed = processContractData(contractData, selectedModel, selectedRegion, selectedPeriod);
    
    setPeriodData(processed.periodData);
    setDetailedData(processed.detailedData);
    setModelPerformance(processed.modelPerformance);
    setHeatmapData(generateHeatmapData(selectedModel, selectedPeriod));
    
    // Если есть данные, устанавливаем первый доступный период для детализации
    if (processed.periodData.length > 0) {
      setSelectedDetailLabel(processed.periodData[0].name);
    }
    
    if (enhancedModels.length === 0 && contractData.length > 0) {
      const enrichedModels = contractData.map(model => {
        return {
          id: model.model_id,
          name: model.model_name,
          img: `https://uzavtosalon.uz/b/core/m$load_image?sha=${model.photo_sha}&width=400&height=400`,
          category: getCategoryForModel(model.model_name)
        };
      });
      
      setEnhancedModels(enrichedModels);
    }
  } catch (error) {
    console.error("Ошибка при загрузке данных:", error);
  } finally {
    setIsLoading(false);
  }
};
  
  // Применение фильтра дат
  const applyDateFilter = () => {
    fetchData();
  };
  
  // Инициализация данных при загрузке компонента
  useEffect(() => {
    fetchData();
  }, []);
  
  // Обновление данных при изменении фильтров
  useEffect(() => {
    if (!isLoading) {
      fetchData();
    }
  }, [selectedPeriod, isCustomPeriod]);
  
  // Обработка выбора кастомного периода
  const handleCustomPeriodSelect = () => {
    setIsCustomPeriod(true);
    setSelectedPeriod('custom');
    fetchData();
  };
  
  // Обновление данных при выборе детального периода
  useEffect(() => {
    if (periodData.length > 0 && !isLoading && selectedDetailLabel) {
      // Найти выбранный период в данных
      const selectedPeriodData = periodData.find(item => item.name === selectedDetailLabel);
      
      if (selectedPeriodData) {
        // Обновляем детализированные данные для выбранного периода
        // В реальном приложении здесь можно использовать API для загрузки детализированных данных
        // или генерировать их на основе выбранного периода
        
        // Для примера используем помощника для генерации детализированных данных
        const generateDetailedDataFromPeriod = (periodItem) => {
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
          
          return {
            label: periodItem.name,
            data: days,
            totals: {
              contracts: periodItem.contracts,
              realization: periodItem.realization,
              cancellation: periodItem.cancellation
            },
            changes: {
              // Для случайных изменений
              contracts: Math.round((Math.random() * 40) - 15),
              realization: Math.round((Math.random() * 40) - 15),
              cancellation: Math.round((Math.random() * 40) - 15)
            }
          };
        };
        
        setDetailedData(generateDetailedDataFromPeriod(selectedPeriodData));
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
  
  // Компонент графика
  const renderChart = () => {
    // Проверка наличия данных
    if (!periodData || periodData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400">Нет данных для отображения. Пожалуйста, выберите другой период или фильтры.</p>
        </div>
      );
    }

    switch (chartType) {
      case 'line':
        return (
          <LineChart data={periodData}>
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
            <XAxis 
              dataKey="name" 
              stroke="#9ca3af"
              // Если много данных, показываем не все тики
              interval={selectedPeriod === 'month' ? 4 : 'preserveEnd'}
              angle={selectedPeriod === 'month' ? -45 : 0}
              textAnchor={selectedPeriod === 'month' ? 'end' : 'middle'}
              height={selectedPeriod === 'month' ? 60 : 30}
            />
            <YAxis stroke="#9ca3af" tickFormatter={formatNumber}/>
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
              dot={{ stroke: '#4f46e5', fill: '#1f2937', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, stroke: 'white', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="realization" 
              stroke="#10b981" 
              strokeWidth={3} 
              dot={{ stroke: '#10b981', fill: '#1f2937', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, stroke: 'white', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="cancellation" 
              stroke="#ef4444" 
              strokeWidth={3}
              dot={{ stroke: '#ef4444', fill: '#1f2937', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, stroke: 'white', strokeWidth: 2 }}
            />
          </LineChart>
        );
        
      case 'area':
        return (
          <AreaChart data={periodData}>
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
            <XAxis 
              dataKey="name" 
              stroke="#9ca3af"
              interval={selectedPeriod === 'month' ? 4 : 'preserveEnd'}
              angle={selectedPeriod === 'month' ? -45 : 0}
              textAnchor={selectedPeriod === 'month' ? 'end' : 'middle'}
              height={selectedPeriod === 'month' ? 60 : 30}
            />
            <YAxis stroke="#9ca3af" tickFormatter={formatNumber}/>
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
          <BarChart data={periodData}>
            <XAxis 
              dataKey="name" 
              stroke="#9ca3af"
              interval={selectedPeriod === 'month' ? 4 : 'preserveEnd'}
              angle={selectedPeriod === 'month' ? -45 : 0}
              textAnchor={selectedPeriod === 'month' ? 'end' : 'middle'}
              height={selectedPeriod === 'month' ? 60 : 30}
            />
            <YAxis stroke="#9ca3af" tickFormatter={formatNumber}/>
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
          <LineChart data={periodData}>
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
          />
          
          {/* Показатели за выбранный период */}
<StatsCards 
  selectedPeriod={selectedPeriod}
  selectedDetailLabel={selectedDetailLabel}
  selectedModel={selectedModel}
  detailedData={detailedData}
  activeMetric={activeMetric}
  setActiveMetric={setActiveMetric}
  carModels={enhancedModels}
  modelPerformance={modelPerformance}
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