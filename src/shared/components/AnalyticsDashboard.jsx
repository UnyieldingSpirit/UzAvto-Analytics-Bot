'use client'
import { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { carModels, regions } from '../mocks/mock-data';

// Генерация тестовых данных для контрактов с учетом выбранной модели
const generateContractData = (selectedModelId = 'all') => {
  const data = [];
  const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь'];
  
  // Создаем объект с базовыми значениями для каждой модели
  const modelBaseValues = {};
  carModels.forEach(model => {
    const baseContractRate = 80 + Math.random() * 120; // Базовый показатель контрактов для модели
    const realizationRate = 0.7 + Math.random() * 0.2; // % реализации от контрактов (70-90%)
    const cancellationRate = 0.05 + Math.random() * 0.15; // % отмен от контрактов (5-20%)
    
    modelBaseValues[model.id] = {
      baseContractRate,
      realizationRate,
      cancellationRate
    };
  });
  
  // Если выбрана конкретная модель, генерируем данные только для неё
  const relevantModels = selectedModelId === 'all' 
    ? carModels.map(m => m.id) 
    : [selectedModelId];
  
  months.forEach((month, monthIndex) => {
    const monthData = {
      name: month,
      contracts: 0,
      realization: 0,
      cancellation: 0
    };
    
    // Сезонный фактор общий для всех моделей
    const seasonalFactor = 1 + Math.sin(monthIndex / 3) * 0.2;
    
    // Для каждой релевантной модели добавляем её вклад в общие показатели
    relevantModels.forEach(modelId => {
      const { baseContractRate, realizationRate, cancellationRate } = modelBaseValues[modelId];
      
      // Добавляем случайные колебания
      const contractRandom = 0.9 + Math.random() * 0.2;
      const realizationRandom = 0.85 + Math.random() * 0.3;
      const cancellationRandom = 0.7 + Math.random() * 0.6;
      
      // Расчет значений для модели с учетом тренда и случайности
      const contractValue = Math.max(30, Math.min(200, baseContractRate * seasonalFactor * contractRandom));
      const realizationValue = contractValue * realizationRate * realizationRandom;
      const cancellationValue = contractValue * cancellationRate * cancellationRandom;
      
      // Добавляем вклад модели в общие показатели месяца
      monthData.contracts += Math.round(contractValue);
      monthData.realization += Math.round(realizationValue);
      monthData.cancellation += Math.round(cancellationValue);
    });
    
    data.push(monthData);
  });
  
  return data;
};

// Генерация данных для "последнего месяца" с учетом выбранной модели
const generateMonthlyData = (selectedMonth = 'Ноябрь', selectedModelId = 'all') => {
  // Объект с базовыми значениями для каждой модели
  const modelBaseValues = {};
  carModels.forEach(model => {
    const baseContractRate = 4 + Math.random() * 6; // Базовый дневной показатель
    const realizationRate = 0.7 + Math.random() * 0.2;
    const cancellationRate = 0.05 + Math.random() * 0.15;
    
    modelBaseValues[model.id] = {
      baseContractRate,
      realizationRate,
      cancellationRate
    };
  });
  
  // Если выбрана конкретная модель, учитываем только её
  const relevantModels = selectedModelId === 'all' 
    ? carModels.map(m => m.id) 
    : [selectedModelId];
  
  // Количество дней в месяце (упрощенно)
  const daysInMonth = 30;
  const data = [];
  
  // Сумматоры для расчета средних показателей
  let totalContracts = 0;
  let totalRealization = 0;
  let totalCancellation = 0;
  
  // Генерируем данные по дням месяца
  for (let day = 1; day <= daysInMonth; day++) {
    const dayData = {
      day: day,
      contracts: 0,
      realization: 0,
      cancellation: 0
    };
    
    // Сезонный фактор дня (например, в выходные меньше контрактов)
    const dayOfWeek = day % 7;
    const dayFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.7 : 1.0;
    
    // Для каждой релевантной модели добавляем её вклад
    relevantModels.forEach(modelId => {
      const { baseContractRate, realizationRate, cancellationRate } = modelBaseValues[modelId];
      
      // Случайные колебания для дня
      const contractRandom = 0.7 + Math.random() * 0.6;
      const realizationRandom = 0.85 + Math.random() * 0.3;
      const cancellationRandom = 0.7 + Math.random() * 0.6;
      
      // Расчет значений для модели на этот день
      const contractValue = Math.max(1, Math.round(baseContractRate * dayFactor * contractRandom));
      const realizationValue = Math.round(contractValue * realizationRate * realizationRandom);
      const cancellationValue = Math.round(contractValue * cancellationRate * cancellationRandom);
      
      // Добавляем вклад модели в общие показатели дня
      dayData.contracts += contractValue;
      dayData.realization += realizationValue;
      dayData.cancellation += cancellationValue;
      
      // Добавляем в общие суммы для расчета средних
      totalContracts += contractValue;
      totalRealization += realizationValue;
      totalCancellation += cancellationValue;
    });
    
    data.push(dayData);
  }
  
  // Расчет изменения по сравнению с предыдущим периодом (случайные значения)
  const getRandomChange = () => Math.round((Math.random() * 40) - 15);
  
  return {
    month: selectedMonth,
    data: data,
    totals: {
      contracts: Math.round(totalContracts / daysInMonth),
      realization: Math.round(totalRealization / daysInMonth),
      cancellation: Math.round(totalCancellation / daysInMonth)
    },
    changes: {
      contracts: getRandomChange(),
      realization: getRandomChange(),
      cancellation: getRandomChange()
    }
  };
};

// Генерация тепловой карты с учетом выбранной модели
const generateHeatmapData = (selectedModelId = 'all') => {
  const heatmap = [];
  const baseValue = selectedModelId === 'all' ? 80 : 40; // Меньше значения для одной модели
  
  for (let week = 0; week < 4; week++) {
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

// Функция форматирования чисел для отображения
const formatNumber = (num) => {
  if (num === undefined || num === null) return '—';
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num;
};

export default function ContractsAnalyticsDashboard() {
  const [yearlyData, setYearlyData] = useState([]);
  const [selectedModel, setSelectedModel] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('Ноябрь');
  const [monthlyData, setMonthlyData] = useState({});
  const [chartType, setChartType] = useState('line');
  const [activeMetric, setActiveMetric] = useState('contracts');
  const [isLoading, setIsLoading] = useState(true);
  const [heatmapData, setHeatmapData] = useState([]);
  const [modelPerformance, setModelPerformance] = useState({});
  
  // Расширяем данные моделей дополнительной информацией
  const [enhancedModels, setEnhancedModels] = useState([]);
  
  // Анимация для чисел
  const valueRefs = {
    contracts: useRef(null),
    realization: useRef(null),
    cancellation: useRef(null)
  };
  
  // Инициализация данных
  useEffect(() => {
    setIsLoading(true);
    
    // Генерация расширенной информации о моделях
    const enrichedModels = carModels.map(model => {
      const performance = Math.round(40 + Math.random() * 60); // Рейтинг производительности 40-100%
      const trend = Math.round((Math.random() * 40) - 15); // Тренд -15% до +25%
      const sales = Math.round(1000 + Math.random() * 9000); // Объем продаж за период
      
      return {
        ...model,
        performance,
        trend,
        sales
      };
    });
    
    setEnhancedModels(enrichedModels);
    
    // Симулируем загрузку данных
    setTimeout(() => {
      const newYearlyData = generateContractData(selectedModel);
      setYearlyData(newYearlyData);
      setMonthlyData(generateMonthlyData(selectedMonth, selectedModel));
      setHeatmapData(generateHeatmapData(selectedModel));
      
      // Генерируем сравнительную статистику по моделям
      const perfData = {};
      carModels.forEach(model => {
        perfData[model.id] = {
          contracts: Math.round(200 + Math.random() * 800),
          realization: Math.round(150 + Math.random() * 600),
          cancellation: Math.round(20 + Math.random() * 100),
          conversion: Math.round(60 + Math.random() * 30) // % конверсии
        };
      });
      setModelPerformance(perfData);
      
      setIsLoading(false);
    }, 800);
  }, []);
  
  // Обновление данных при изменении выбранной модели
  useEffect(() => {
    if (!isLoading) {
      setIsLoading(true);
      
      setTimeout(() => {
        const newYearlyData = generateContractData(selectedModel);
        setYearlyData(newYearlyData);
        setMonthlyData(generateMonthlyData(selectedMonth, selectedModel));
        setHeatmapData(generateHeatmapData(selectedModel));
        setIsLoading(false);
      }, 500);
    }
  }, [selectedModel]);
  
  // Обновление данных при выборе месяца
  useEffect(() => {
    if (yearlyData.length > 0 && !isLoading) {
      setMonthlyData(generateMonthlyData(selectedMonth, selectedModel));
    }
  }, [selectedMonth, yearlyData, isLoading]);
  
  // Анимация для чисел
  useEffect(() => {
    // Анимация для чисел
    Object.keys(valueRefs).forEach(key => {
      if (valueRefs[key].current && monthlyData.totals) {
        const target = monthlyData.totals[key];
        const duration = 1500;
        const start = Date.now();
        const startValue = parseInt(valueRefs[key].current.textContent.replace(/[^0-9.-]/g, '')) || 0;
        
        const animate = () => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
          
          const currentValue = Math.floor(startValue + (target - startValue) * easedProgress);
          if (valueRefs[key].current) {
            valueRefs[key].current.textContent = formatNumber(currentValue);
          }
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        
        animate();
      }
    });
  }, [monthlyData]);
  
  // Получение цвета активной метрики
  const getMetricColor = (metric) => {
    switch (metric) {
      case 'contracts': return 'indigo';
      case 'realization': return 'emerald';
      case 'cancellation': return 'red';
      default: return 'indigo';
    }
  };
  
  // Цвета для графиков
  const getChartColors = (metric) => {
    switch (metric) {
      case 'contracts':
        return { stroke: '#4f46e5', fill: 'url(#colorContractsGradient)' };
      case 'realization':
        return { stroke: '#10b981', fill: 'url(#colorRealizationGradient)' };
      case 'cancellation':
        return { stroke: '#ef4444', fill: 'url(#colorCancellationGradient)' };
      default:
        return { stroke: '#4f46e5', fill: 'url(#colorContractsGradient)' };
    }
  };
  
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
    switch (chartType) {
      case 'line':
        return (
          <LineChart data={yearlyData}>
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
            <XAxis dataKey="name" stroke="#9ca3af"/>
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
          <AreaChart data={yearlyData}>
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
            <XAxis dataKey="name" stroke="#9ca3af"/>
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
          <BarChart data={yearlyData}>
            <XAxis dataKey="name" stroke="#9ca3af"/>
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
          <LineChart data={yearlyData}>
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
  
  // График для детализации по дням выбранного месяца
  const renderMonthlyChart = () => {
    if (!monthlyData.data) return null;
    
    return (
      <LineChart data={monthlyData.data}>
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
          ticks={[1, 5, 10, 15, 20, 25, 30]}
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
      const minVal = 20;
      const maxVal = 140;
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
  
  // Получение цвета для отображения изменений
  const getChangeColor = (change) => {
    const changeNum = parseFloat(change);
    if (changeNum > 0) return 'text-emerald-500';
    if (changeNum < 0) return 'text-red-500';
    return 'text-gray-400';
  };
  
  // Получение стрелки для изменений
  const getChangeIcon = (change) => {
    const changeNum = parseFloat(change);
    if (changeNum > 0) return '↑';
    if (changeNum < 0) return '↓';
    return '—';
  };
  
  // Карточка метрики
  const MetricCard = ({ title, icon, value, change, color, isActive, onClick }) => {
    const borderClass = isActive ? `border-${color}-500` : 'border-gray-700';
    const bgClass = isActive ? `bg-${color}-900/30` : 'bg-gray-800/80';
    
    return (
      <div 
        className={`rounded-lg p-5 border ${borderClass} ${bgClass} transition-all duration-300 cursor-pointer hover:shadow-xl hover:scale-105`}
        onClick={onClick}
      >
        <div className="flex items-center">
          <div className={`w-14 h-14 rounded-full bg-${color}-500/30 flex items-center justify-center mr-4 shadow-lg`}>
            <span className="text-2xl">{icon}</span>
          </div>
          <div className="flex-1">
            <h3 className="text-sm text-gray-400 font-semibold">{title}</h3>
            <div className="flex items-baseline">
              <span ref={valueRefs[value.toLowerCase()]} className="text-2xl font-bold text-white">
                {monthlyData.totals ? formatNumber(monthlyData.totals[value.toLowerCase()]) : '—'}
              </span>
              <span className={`ml-2 text-sm font-medium ${getChangeColor(monthlyData.changes?.[value.toLowerCase()])}`}>
                {getChangeIcon(monthlyData.changes?.[value.toLowerCase()])} {Math.abs(monthlyData.changes?.[value.toLowerCase()] || 0)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Компонент карты показателей за месяц
  const MonthlyStatsCards = () => {
    return (
      <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/60 shadow-lg mb-6 hover:shadow-xl transition-all duration-300">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
          <span className="text-2xl mr-2">📊</span> 
          Статистика за {selectedMonth}
          {selectedModel !== 'all' && (
            <span className="ml-2 text-indigo-400">
              ({carModels.find(m => m.id === selectedModel)?.name})
            </span>
          )}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard 
            title="Контракты" 
            icon="📝"
            value="contracts"
            change={monthlyData.changes?.contracts}
            color="indigo"
            isActive={activeMetric === 'contracts'}
            onClick={() => setActiveMetric('contracts')}
          />
          <MetricCard 
            title="Реализация" 
            icon="✅"
            value="realization"
            change={monthlyData.changes?.realization}
            color="emerald"
            isActive={activeMetric === 'realization'}
            onClick={() => setActiveMetric('realization')}
          />
          <MetricCard 
            title="Отмена" 
            icon="❌"
            value="cancellation"
            change={monthlyData.changes?.cancellation}
            color="red"
            isActive={activeMetric === 'cancellation'}
            onClick={() => setActiveMetric('cancellation')}
          />
        </div>
      </div>
    );
  };

  // Компонент для выбора модели с изображениями
  const ModelSelector = () => {
    return (
      <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/60 shadow-lg mb-6 hover:shadow-xl transition-all duration-300">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white flex items-center">
            <span className="text-2xl mr-2">🚗</span> 
            Выбор модели
          </h3>
          {selectedModel !== 'all' && (
            <button 
              onClick={() => setSelectedModel('all')} 
              className="px-3 py-1 bg-gray-700/80 hover:bg-gray-600/80 text-sm text-gray-300 rounded-md transition-all"
            >
              Сбросить фильтр
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <div 
            className={`bg-gray-900/90 p-4 rounded-lg border ${selectedModel === 'all' ? 'border-indigo-500/70 ring-2 ring-indigo-500/30' : 'border-gray-700/60 hover:border-indigo-500/40'} transition-all duration-300 flex flex-col items-center cursor-pointer`}
            onClick={() => setSelectedModel('all')}
          >
            <div className="w-14 h-14 rounded-full bg-indigo-500/20 flex items-center justify-center mb-2">
              <span className="text-2xl">🔍</span>
            </div>
            <p className="font-medium text-gray-200 text-center">Все модели</p>
            <p className="text-xs text-gray-400">Показать всё</p>
          </div>
          
          {carModels.map(model => (
            <div 
              key={model.id}
              className={`bg-gray-900/90 p-4 rounded-lg border ${selectedModel === model.id ? 'border-indigo-500/70 ring-2 ring-indigo-500/30' : 'border-gray-700/60 hover:border-indigo-500/40'} transition-all duration-300 flex flex-col items-center cursor-pointer`}
              onClick={() => setSelectedModel(model.id)}
            >
              <div className="w-16 h-16 bg-gray-800/80 rounded-lg flex items-center justify-center mb-2 overflow-hidden">
                <img 
                  src={model.img} 
                  alt={model.name} 
                  className="w-full h-full object-contain p-1"
                />
              </div>
              <p className="font-medium text-gray-200 text-center">{model.name}</p>
              <p className="text-xs text-gray-400">{
                model.category === 'sedan' ? 'Седан' :
                model.category === 'suv' ? 'Внедорожник' :
                model.category === 'minivan' ? 'Минивэн' : 
                model.category
              }</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Компонент сравнительного анализа моделей
  const ModelComparisonChart = () => {
    if (Object.keys(modelPerformance).length === 0) return null;
    
    // Подготовка данных для сравнительного графика
    const comparisonData = carModels.map(model => {
      const perfData = modelPerformance[model.id] || {};
      return {
        name: model.name,
        contracts: perfData.contracts || 0,
        realization: perfData.realization || 0,
        cancellation: perfData.cancellation || 0,
        conversion: perfData.conversion || 0
      };
    });
    
    return (
      <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/60 shadow-lg hover:shadow-xl transition-all duration-300 mb-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <span className="text-2xl mr-2">📊</span> 
          Сравнительный анализ моделей
        </h3>
        
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={comparisonData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <XAxis type="number" stroke="#9ca3af" tickFormatter={formatNumber} />
              <YAxis 
                dataKey="name" 
                type="category" 
                stroke="#9ca3af" 
                width={80}
                tick={{
                  fill: '#e5e7eb',
                  fontSize: 12
                }}
              />
              <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
              <Tooltip 
                formatter={(value, name) => {
                  const labels = {
                    contracts: "Контракты",
                    realization: "Реализация",
                    cancellation: "Отмена",
                    conversion: "Конверсия"
                  };
                  return [formatNumber(value), labels[name] || name];
                }}
                wrapperStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                itemStyle={{ color: '#e5e7eb' }}
                labelStyle={{ color: '#e5e7eb', fontWeight: 'bold' }}
              />
              <Legend 
                formatter={(value) => {
                  const labels = {
                    contracts: "Контракты",
                    realization: "Реализация",
                    cancellation: "Отмена",
                    conversion: "Конверсия (%)"
                  };
                  return <span style={{color: '#d1d5db', fontSize: '0.9rem'}}>{labels[value]}</span>
                }}
              />
              <Bar dataKey="contracts" fill="#4f46e5" radius={[0, 4, 4, 0]} />
              <Bar dataKey="realization" fill="#10b981" radius={[0, 4, 4, 0]} />
              <Bar dataKey="cancellation" fill="#ef4444" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };
  
  // Компонент с расширенной информацией о выбранной модели
  const SelectedModelDetails = () => {
    if (selectedModel === 'all') return null;
    
    const model = carModels.find(m => m.id === selectedModel);
    if (!model) return null;
    
    const modelStats = modelPerformance[model.id] || {};
    
    return (
      <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/60 shadow-lg hover:shadow-xl transition-all duration-300 mb-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <span className="text-2xl mr-2">🔍</span> 
          Детальная информация: {model.name}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900/70 rounded-xl overflow-hidden border border-gray-700/50">
            <div className="h-48 flex items-center justify-center bg-gradient-to-b from-gray-800 to-gray-900">
              <img 
                src={model.img} 
                alt={model.name} 
                className="h-full object-contain p-4"
              />
            </div>
            <div className="p-4">
              <h4 className="text-lg font-bold text-white">{model.name}</h4>
              <p className="text-gray-400 mb-3">{
                model.category === 'sedan' ? 'Седан' :
                model.category === 'suv' ? 'Внедорожник' :
                model.category === 'minivan' ? 'Минивэн' : 
                model.category
              }</p>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-gray-800/80 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Контракты</p>
                  <p className="text-lg font-bold text-indigo-400">{formatNumber(modelStats.contracts || 0)}</p>
                </div>
                <div className="bg-gray-800/80 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Реализация</p>
                  <p className="text-lg font-bold text-emerald-400">{formatNumber(modelStats.realization || 0)}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Конверсия:</span>
                <span className="text-sm font-medium text-white">{modelStats.conversion || 0}%</span>
              </div>
              <div className="w-full h-2 bg-gray-700 rounded-full mt-1 overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${modelStats.conversion || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="bg-gray-900/70 rounded-xl p-4 border border-gray-700/50">
              <h4 className="text-lg font-bold text-white mb-3">Распределение по регионам</h4>
              
              <div className="space-y-3">
                {regions.slice(0, 4).map((region, index) => {
                  const value = 20 + Math.floor(Math.random() * 60);
                  return (
                    <div key={region.id} className="flex flex-col">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">{region.name}</span>
                        <span className="text-gray-400">{value}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full"
                          style={{ 
                            width: `${value}%`,
                            background: index === 0 ? 'linear-gradient(90deg, #4f46e5, #6366f1)' :
                                      index === 1 ? 'linear-gradient(90deg, #8b5cf6, #a78bfa)' :
                                      index === 2 ? 'linear-gradient(90deg, #ec4899, #f472b6)' :
                                      'linear-gradient(90deg, #10b981, #34d399)'
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="bg-gray-900/70 rounded-xl p-4 border border-gray-700/50 flex-1">
              <h4 className="text-lg font-bold text-white mb-3">Характеристики контрактов</h4>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-800/60 p-3 rounded-lg">
                  <p className="text-xs text-gray-400">Средний срок</p>
                  <p className="text-lg font-bold text-white">{Math.floor(Math.random() * 12) + 12} мес.</p>
                </div>
                <div className="bg-gray-800/60 p-3 rounded-lg">
                  <p className="text-xs text-gray-400">Ср. предоплата</p>
                  <p className="text-lg font-bold text-white">{Math.floor(Math.random() * 20) + 20}%</p>
                </div>
              </div>
              
              <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-lg p-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center mr-3">
                    <span className="text-lg">📝</span>
                  </div>
                  <p className="text-indigo-300 text-sm">
                    Наиболее популярная комплектация: <span className="font-medium">Премиум</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
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
              Анализ контрактов
              {selectedModel !== 'all' && (
                <span className="ml-2 font-medium text-indigo-400 text-2xl">
                  — {carModels.find(m => m.id === selectedModel)?.name}
                </span>
              )}
            </h2>
            <p className="text-gray-400">
              {selectedModel === 'all' 
                ? 'Годовой отчет по контрактам, реализации и отменам для всех моделей'
                : `Детальная статистика по модели ${carModels.find(m => m.id === selectedModel)?.name}`
              }
            </p>
          </div>
          
          {/* Селектор моделей с фото */}
          <ModelSelector />
          
          {/* Показатели за месяц */}
          <MonthlyStatsCards />
          
          {/* Детали выбранной модели */}
          <SelectedModelDetails />
          
          {/* Основной график */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/60 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <span className="text-2xl mr-2">📈</span> 
                  Динамика показателей
                  {selectedModel !== 'all' && (
                    <span className="ml-2 text-indigo-400 text-base">
                      ({carModels.find(m => m.id === selectedModel)?.name})
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
              
              <div className="flex flex-wrap mt-4 mb-4 justify-between items-center">
                <div className="flex flex-wrap gap-2">
                  {yearlyData.map((item, index) => (
                    <button
                      key={`month-${index}`}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        selectedMonth === item.name ? 
                        'bg-indigo-600/70 text-white ring-2 ring-indigo-500 ring-offset-2 ring-offset-gray-800' : 
                        'bg-gray-700/60 text-gray-300 hover:bg-gray-600/60'
                      }`}
                      onClick={() => setSelectedMonth(item.name)}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
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
          
          {/* График по дням месяца */}
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/60 shadow-lg hover:shadow-xl transition-all duration-300 mb-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <span className="text-2xl mr-2">📅</span> 
              Детализация по дням: {selectedMonth}
            </h3>
            
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                {renderMonthlyChart()}
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Сравнительный анализ моделей */}
          {selectedModel === 'all' && <ModelComparisonChart />}
          
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