'use client'
import { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';

// Генерация тестовых данных для контрактов
const generateContractData = () => {
  const data = [];
  const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь'];
  
  let contractTrend = 100;
  let realizationTrend = 80;
  let cancellationTrend = 20;
  
  for (let i = 0; i < months.length; i++) {
    // Симуляция сезонных трендов
    const seasonalFactor = 1 + Math.sin(i / 3) * 0.2;
    
    // Добавление случайных колебаний
    const contractRandom = 0.9 + Math.random() * 0.2;
    const realizationRandom = 0.85 + Math.random() * 0.3;
    const cancellationRandom = 0.7 + Math.random() * 0.6;
    
    // Расчет значений с трендами и случайностью
    contractTrend = Math.max(50, Math.min(200, contractTrend * (1 + (Math.random() * 0.1 - 0.03)) * seasonalFactor));
    realizationTrend = Math.max(40, Math.min(180, realizationTrend * (1 + (Math.random() * 0.12 - 0.04)) * seasonalFactor));
    cancellationTrend = Math.max(10, Math.min(60, cancellationTrend * (1 + (Math.random() * 0.15 - 0.05)) * seasonalFactor));

    data.push({
      name: months[i],
      contracts: Math.round(contractTrend * contractRandom),
      realization: Math.round(realizationTrend * realizationRandom),
      cancellation: Math.round(cancellationTrend * cancellationRandom)
    });
  }
  return data;
};

// Генерация данных для "последнего месяца" (декабрь не входит в годовой отчет)
const generateMonthlyData = (selectedMonth = 'Ноябрь') => {
  // Базовые значения
  const baseContracts = 120 + Math.random() * 30;
  const baseRealization = 90 + Math.random() * 25;
  const baseCancellation = 25 + Math.random() * 10;
  
  // Объект с днями месяца
  const data = [];
  
  // Количество дней в месяце (упрощенно)
  const daysInMonth = 30;
  
  let contractsValue = baseContracts;
  let realizationValue = baseRealization;
  let cancellationValue = baseCancellation;
  
  for (let day = 1; day <= daysInMonth; day++) {
    // Добавляем случайные колебания
    contractsValue = Math.max(50, Math.min(200, contractsValue * (1 + (Math.random() * 0.06 - 0.03))));
    realizationValue = Math.max(40, Math.min(180, realizationValue * (1 + (Math.random() * 0.07 - 0.035))));
    cancellationValue = Math.max(10, Math.min(60, cancellationValue * (1 + (Math.random() * 0.08 - 0.04))));
    
    data.push({
      day: day,
      contracts: Math.round(contractsValue * (0.9 + Math.random() * 0.2)),
      realization: Math.round(realizationValue * (0.85 + Math.random() * 0.3)),
      cancellation: Math.round(cancellationValue * (0.7 + Math.random() * 0.6))
    });
  }
  
  return {
    month: selectedMonth,
    data: data,
    totals: {
      contracts: Math.round(data.reduce((sum, item) => sum + item.contracts, 0) / daysInMonth),
      realization: Math.round(data.reduce((sum, item) => sum + item.realization, 0) / daysInMonth),
      cancellation: Math.round(data.reduce((sum, item) => sum + item.cancellation, 0) / daysInMonth)
    },
    changes: {
      contracts: Math.round((Math.random() * 40) - 10),
      realization: Math.round((Math.random() * 35) - 5),
      cancellation: Math.round((Math.random() * 45) - 25)
    }
  };
};

const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num;
};

export default function ContractsAnalyticsDashboard() {
  const [yearlyData, setYearlyData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('Ноябрь');
  const [monthlyData, setMonthlyData] = useState({});
  const [chartType, setChartType] = useState('line');
  const [activeMetric, setActiveMetric] = useState('contracts');
  const [isLoading, setIsLoading] = useState(true);
  const [heatmapData, setHeatmapData] = useState([]);
  
  // Анимация для чисел
  const valueRefs = {
    contracts: useRef(null),
    realization: useRef(null),
    cancellation: useRef(null)
  };
  
  // Инициализация данных
  useEffect(() => {
    setIsLoading(true);
    
    // Симулируем загрузку данных
    setTimeout(() => {
      const newYearlyData = generateContractData();
      setYearlyData(newYearlyData);
      setMonthlyData(generateMonthlyData(selectedMonth));
      
      // Генерируем данные тепловой карты
      const heatmap = [];
      for (let week = 0; week < 4; week++) {
        const weekData = { week: `Неделя ${week + 1}` };
        for (let day = 1; day <= 7; day++) {
          weekData[`day${day}`] = Math.round(20 + Math.random() * 120);
        }
        heatmap.push(weekData);
      }
      setHeatmapData(heatmap);
      
      setIsLoading(false);
    }, 1000);
  }, []);
  
  // Обновление данных при выборе месяца
  useEffect(() => {
    if (yearlyData.length > 0) {
      setMonthlyData(generateMonthlyData(selectedMonth));
    }
  }, [selectedMonth, yearlyData]);
  
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
  
  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 rounded-xl shadow-2xl border border-gray-700/40 w-full max-w-6xl mx-auto overflow-hidden">
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
            </h2>
            <p className="text-gray-400">Годовой отчет по контрактам, реализации и отменам</p>
          </div>
          
          <MonthlyStatsCards />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/60 shadow-lg hover:shadow-xl transition-all duration-300">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <span className="text-2xl mr-2">📈</span> 
                  Динамика показателей
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
              
              <div className="flex flex-wrap mt-4 gap-2 justify-center">
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
          
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/60 shadow-lg hover:shadow-xl transition-all duration-300">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <span className="text-2xl mr-2">📋</span> 
              Отчет о статусе
            </h3>
            <div className="bg-gray-900/90 p-5 rounded-lg border border-gray-700/60 shadow-inner">
              <h4 className="font-medium text-indigo-400 mb-3 text-lg">Статус контракта</h4>
              <p className="text-gray-300 mb-3">
                Будет 3 линии. Первая - контракты, вторая - реализация, третья - отмена. 
                Это годовой отчет, последний месяц в него не входит.
              </p>
              <p className="text-gray-300">
                При нажатии на январь внизу будет отображаться статус за январь по 3 показателям, 
                процент по отношению к предыдущему месяцу. По умолчанию должен отображаться последний месяц.
              </p>
              
              <div className="mt-6 p-4 bg-indigo-900/20 border border-indigo-500/20 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center mr-3">
                    <span className="text-xl">💡</span>
                  </div>
                  <p className="text-indigo-300 text-sm">
                    Выберите месяц на графике выше, чтобы увидеть детальную статистику за этот период.
                  </p>
                </div>
              </div>
            </div>
          </div>
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