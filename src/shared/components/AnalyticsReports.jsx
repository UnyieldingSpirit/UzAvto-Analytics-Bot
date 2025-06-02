// src/shared/components/AnalyticsReports.jsx
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useTranslation } from '../../hooks/useTranslation';
import { analyticsReportsTranslations } from './locales/AnalyticsReports';
import { useThemeStore } from '../../store/theme';
import axios from 'axios';
import confetti from 'canvas-confetti';
import * as d3 from 'd3';
import { 
  Sparkles, TrendingUp, Award, Palette, BarChart3, 
  PieChart, Activity, Zap, Brain, Rocket, Star,
  Car, DollarSign, Package, Layers, Download, RefreshCw,
  Calendar, ArrowUp, ArrowDown, Minus
} from 'lucide-react';
import CountUp from 'react-countup';
import { 
  ResponsiveContainer, LineChart, Line, AreaChart, Area, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  Radar, Tooltip, CartesianGrid, XAxis, YAxis, PieChart as RechartsPie, 
  Pie, Cell, BarChart, Bar, Treemap, Legend, ComposedChart
} from 'recharts';
import { useSpring, animated } from '@react-spring/web';

// Компонент 3D-подобной визуализации с D3
const D3CarVisualization = ({ data, selectedModel }) => {
  const svgRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const { t } = useTranslation(analyticsReportsTranslations);
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';
  
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  useEffect(() => {
    if (!data || dimensions.width === 0) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    
    const margin = { top: 20, right: 100, bottom: 20, left: 20 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;
    
    // Создаем градиенты
    const defs = svg.append("defs");
    
    const gradient = defs.append("linearGradient")
      .attr("id", "car-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");
    
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#3b82f6")
      .attr("stop-opacity", 0.8);
    
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#8b5cf6")
      .attr("stop-opacity", 0.8);
    
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Подготовка данных
    const models = Object.entries(data.modelStats)
      .map(([name, stats]) => ({
        name,
        total: stats.total,
        revenue: stats.revenue,
        avgPrice: stats.revenue / stats.total || 0
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
    
    // Масштабы
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(models, d => d.total)])
      .range([0, width]);
    
    const yScale = d3.scaleBand()
      .domain(models.map(d => d.name))
      .range([0, height])
      .padding(0.2);
    
    // Создаем машинки с анимацией
    const cars = g.selectAll(".car-group")
      .data(models)
      .enter()
      .append("g")
      .attr("class", "car-group")
      .attr("transform", d => `translate(0, ${yScale(d.name)})`);
    
    // Фон для каждой машинки
    cars.append("rect")
      .attr("width", width)
      .attr("height", yScale.bandwidth())
      .attr("fill", isDark ? "#1f2937" : "#f3f4f6")
      .attr("rx", 8)
      .attr("opacity", 0.3);
    
    // Прогресс-бар продаж
    cars.append("rect")
      .attr("height", yScale.bandwidth())
      .attr("fill", "url(#car-gradient)")
      .attr("rx", 8)
      .attr("width", 0)
      .transition()
      .duration(1500)
      .delay((d, i) => i * 100)
      .attr("width", d => xScale(d.total));
    
    // Текст с названием модели
    cars.append("text")
      .attr("x", 10)
      .attr("y", yScale.bandwidth() / 2)
      .attr("dy", ".35em")
      .attr("fill", isDark ? "#f1f5f9" : "#1e293b")
      .attr("font-weight", "bold")
      .attr("font-size", "14px")
      .text(d => d.name)
      .attr("opacity", 0)
      .transition()
      .duration(500)
      .delay((d, i) => i * 100)
      .attr("opacity", 1);
    
    // Количество продаж
    cars.append("text")
      .attr("x", d => Math.min(xScale(d.total) + 10, width - 60))
      .attr("y", yScale.bandwidth() / 2)
      .attr("dy", ".35em")
      .attr("fill", isDark ? "#f1f5f9" : "#1e293b")
      .attr("font-size", "12px")
      .text(d => `${d.total.toLocaleString()} ${t('metrics.units')}`)
      .attr("opacity", 0)
      .transition()
      .duration(500)
      .delay((d, i) => i * 100 + 1200)
      .attr("opacity", 1);
    
  }, [data, selectedModel, dimensions, t, isDark]);
  
  return (
    <div ref={containerRef} className="w-full h-full">
      <svg 
        ref={svgRef} 
        width={dimensions.width}
        height={dimensions.height}
      />
    </div>
  );
};

// Улучшенный компонент для распределения по цветам (Treemap)
const ColorDistributionChart = ({ colorStats, totalSales }) => {
  const { t } = useTranslation(analyticsReportsTranslations);
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';
  
  // Функция для определения цвета по названию
  const getColorCode = (colorName) => {
    const lowerName = colorName.toLowerCase();
    if (lowerName.includes('white') || lowerName.includes('белый')) return '#FFFFFF';
    if (lowerName.includes('black') || lowerName.includes('черный')) return '#1a1a1a';
    if (lowerName.includes('gray') || lowerName.includes('grey') || lowerName.includes('серый')) return '#6b7280';
    if (lowerName.includes('silver') || lowerName.includes('серебр')) return '#c0c0c0';
    if (lowerName.includes('blue') || lowerName.includes('синий')) return '#3b82f6';
    if (lowerName.includes('red') || lowerName.includes('красный')) return '#ef4444';
    if (lowerName.includes('green') || lowerName.includes('зеленый')) return '#10b981';
    if (lowerName.includes('brown') || lowerName.includes('коричневый')) return '#92400e';
    if (lowerName.includes('beige') || lowerName.includes('бежевый')) return '#d4b5a0';
    if (lowerName.includes('gold') || lowerName.includes('золот')) return '#fbbf24';
    if (lowerName.includes('orange') || lowerName.includes('оранж')) return '#f97316';
    if (lowerName.includes('purple') || lowerName.includes('фиолет')) return '#8b5cf6';
    return '#9ca3af';
  };
  
  // Подготовка данных
  const colorData = Object.entries(colorStats)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 12)
    .map(([name, stats]) => ({
      name,
      value: stats.count,
      color: getColorCode(name),
      percent: ((stats.count / totalSales) * 100).toFixed(1)
    }));
  
  // Кастомный контент для Treemap
  const CustomTreemapContent = ({ x, y, width, height, name, value, color, percent }) => {
    const fontSize = width > 100 ? 14 : width > 60 ? 12 : 10;
    const showDetails = width > 60 && height > 40;
    
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: color,
            stroke: isDark ? '#1f2937' : '#e5e7eb',
            strokeWidth: 2,
            opacity: 0.9
          }}
        />
        {color === '#FFFFFF' && (
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            style={{
              fill: 'url(#whiteGradient)',
              stroke: isDark ? '#1f2937' : '#e5e7eb',
              strokeWidth: 2
            }}
          />
        )}
        {showDetails && (
          <>
            <text
              x={x + width / 2}
              y={y + height / 2 - 10}
              textAnchor="middle"
              fill={color === '#FFFFFF' || color === '#fbbf24' || color === '#d4b5a0' ? '#000' : '#fff'}
              fontSize={fontSize}
              fontWeight="600"
            >
              {name}
            </text>
            <text
              x={x + width / 2}
              y={y + height / 2 + 10}
              textAnchor="middle"
              fill={color === '#FFFFFF' || color === '#fbbf24' || color === '#d4b5a0' ? '#000' : '#fff'}
              fontSize={fontSize - 2}
              opacity="0.8"
            >
              {percent}%
            </text>
            <text
              x={x + width / 2}
              y={y + height / 2 + 25}
              textAnchor="middle"
              fill={color === '#FFFFFF' || color === '#fbbf24' || color === '#d4b5a0' ? '#000' : '#fff'}
              fontSize={fontSize - 4}
              opacity="0.6"
            >
              {value.toLocaleString()} {t('metrics.units')}
            </text>
          </>
        )}
      </g>
    );
  };
  
  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={colorData}
          dataKey="value"
          aspectRatio={4/3}
          stroke={isDark ? "#1f2937" : "#e5e7eb"}
          content={<CustomTreemapContent />}
        >
          <defs>
            <linearGradient id="whiteGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f8f8f8" />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e0e0e0" />
            </linearGradient>
          </defs>
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px',
              color: isDark ? '#f1f5f9' : '#1e293b'
            }}
            formatter={(value, name) => [
              <div key="tooltip">
                <div className="font-semibold">{value.toLocaleString()} {t('metrics.units')}</div>
                <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>{t('reports.marketShare')}</div>
              </div>,
              name
            ]}
          />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
};

// Компонент сравнения по годам
const YearComparison = ({ currentData, onYearSelect }) => {
  const [selectedYears, setSelectedYears] = useState(['2024', '2025']);
  const [yearData, setYearData] = useState({});
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation(analyticsReportsTranslations);
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';
  
  // Загрузка данных за разные годы
  useEffect(() => {
    const fetchYearData = async () => {
      setLoading(true);
      const dataPromises = selectedYears.map(async (year) => {
        try {
          const response = await axios.post('https://uzavtosalon.uz/b/dashboard/infos&get_modif_color', {
            begin_date: `01.01.${year}`,
            end_date: `31.12.${year}`
          });
          return { year, data: response.data };
        } catch (error) {
          console.error(`Error fetching data for ${year}:`, error);
          return { year, data: null };
        }
      });
      
      const results = await Promise.all(dataPromises);
      const newYearData = {};
      results.forEach(({ year, data }) => {
        if (data) {
          newYearData[year] = processYearData(data);
        }
      });
      setYearData(newYearData);
      setLoading(false);
    };
    
    fetchYearData();
  }, [selectedYears]);
  
  // Обработка данных года
  const processYearData = (apiData) => {
    let totalSales = 0;
    let totalRevenue = 0;
    const monthlyData = {};
    
    apiData.forEach(model => {
      model.filter_by_region.forEach(month => {
        const monthNum = month.month.split('-')[1];
        if (!monthlyData[monthNum]) {
          monthlyData[monthNum] = { sales: 0, revenue: 0 };
        }
        
        month.modifications.forEach(mod => {
          const count = parseInt(mod.all_count) || 0;
          const amount = parseFloat(mod.amount) || 0;
          
          totalSales += count;
          totalRevenue += amount;
          monthlyData[monthNum].sales += count;
          monthlyData[monthNum].revenue += amount;
        });
      });
    });
    
    return { totalSales, totalRevenue, monthlyData };
  };
  
  // Подготовка данных для графика
  const chartData = useMemo(() => {
    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    const monthNames = {
      'ru': ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
      'uz': ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'],
      'en': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    };
    
    const currentLocale = localStorage.getItem('language-store') 
      ? JSON.parse(localStorage.getItem('language-store')).state.currentLocale 
      : 'ru';
    
    return months.map((month, index) => {
      const data = { month: monthNames[currentLocale][index] };
      selectedYears.forEach(year => {
        if (yearData[year] && yearData[year].monthlyData[month]) {
          data[`sales${year}`] = yearData[year].monthlyData[month].sales;
          data[`revenue${year}`] = Math.round(yearData[year].monthlyData[month].revenue);
        } else {
          data[`sales${year}`] = 0;
          data[`revenue${year}`] = 0;
        }
      });
      return data;
    });
  }, [yearData, selectedYears]);
  
  // Расчет изменений
  const calculateChange = (current, previous) => {
    if (!previous || previous === 0) return { value: 0, percent: 0 };
    const change = current - previous;
    const percent = ((change / previous) * 100).toFixed(1);
    return { value: change, percent: parseFloat(percent) };
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Селектор годов */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>{t('charts.selectYears')}:</span>
        {['2023', '2024', '2025'].map(year => (
          <motion.button
            key={year}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (selectedYears.includes(year)) {
                if (selectedYears.length > 1) {
                  setSelectedYears(selectedYears.filter(y => y !== year));
                }
              } else {
                if (selectedYears.length < 3) {
                  setSelectedYears([...selectedYears, year].sort());
                }
              }
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedYears.includes(year)
                ? 'bg-blue-500 text-white'
                : isDark 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {year}
          </motion.button>
        ))}
      </div>
      
      {/* Карточки сравнения */}
      {selectedYears.length >= 2 && yearData[selectedYears[0]] && yearData[selectedYears[1]] && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedYears.map((year, index) => {
            const data = yearData[year];
            const prevYear = index > 0 ? selectedYears[index - 1] : null;
            const prevData = prevYear ? yearData[prevYear] : null;
            const salesChange = prevData ? calculateChange(data.totalSales, prevData.totalSales) : null;
            const revenueChange = prevData ? calculateChange(data.totalRevenue, prevData.totalRevenue) : null;
            
            return (
              <motion.div
                key={year}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`${isDark ? 'bg-gray-800/50' : 'bg-white'} backdrop-blur-sm rounded-2xl p-6 border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{year} {t('charts.year')}</h4>
                  <Calendar className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mb-1`}>{t('charts.totalSales')}</p>
                    <div className="flex items-end gap-2">
                      <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {data.totalSales.toLocaleString()} {t('metrics.units')}
                      </p>
                      {salesChange && (
                        <div className={`flex items-center gap-1 text-sm ${
                          salesChange.value > 0 ? 'text-green-400' : 
                          salesChange.value < 0 ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          {salesChange.value > 0 ? <ArrowUp className="w-4 h-4" /> : 
                           salesChange.value < 0 ? <ArrowDown className="w-4 h-4" /> : 
                           <Minus className="w-4 h-4" />}
                          <span>{Math.abs(salesChange.percent)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mb-1`}>{t('charts.totalRevenue')}</p>
                    <div className="flex items-end gap-2">
                      <p className="text-2xl font-bold text-green-400">
                        {Math.round(data.totalRevenue).toLocaleString()} {t('metrics.currency')}
                      </p>
                      {revenueChange && (
                        <div className={`flex items-center gap-1 text-sm ${
                          revenueChange.value > 0 ? 'text-green-400' : 
                          revenueChange.value < 0 ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          {revenueChange.value > 0 ? <ArrowUp className="w-4 h-4" /> : 
                           revenueChange.value < 0 ? <ArrowDown className="w-4 h-4" /> : 
                           <Minus className="w-4 h-4" />}
                          <span>{Math.abs(revenueChange.percent)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      
      {/* График сравнения */}
      {selectedYears.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${isDark ? 'bg-gray-800/50' : 'bg-white'} backdrop-blur-sm rounded-2xl p-6`}
        >
          <h4 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>{t('charts.salesDynamics')}</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
                <XAxis dataKey="month" stroke={isDark ? "#9ca3af" : "#6b7280"} />
                <YAxis stroke={isDark ? "#9ca3af" : "#6b7280"} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                    border: isDark ? '1px solid #374151' : '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    padding: '12px',
                    color: isDark ? '#f1f5f9' : '#1e293b'
                  }}
                  formatter={(value, name) => {
                    const year = name.replace('sales', '');
                    return [`${value.toLocaleString()} ${t('metrics.units')}`, `${year} ${t('charts.year')}`];
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  formatter={(value) => {
                    const year = value.replace('sales', '');
                    return `${year} ${t('charts.year')}`;
                  }}
                />
                {selectedYears.map((year, index) => (
                  <Line
                    key={year}
                    type="monotone"
                    dataKey={`sales${year}`}
                    stroke={['#3b82f6', '#8b5cf6', '#ec4899'][index]}
                    strokeWidth={3}
                    dot={{ fill: ['#3b82f6', '#8b5cf6', '#ec4899'][index], r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Компонент анимированной статистики
const AnimatedStat = ({ value, label, icon, color, delay = 0, prefix = '', suffix = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef();
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={isVisible ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="relative group cursor-pointer h-full"
    >
      <div className={`absolute inset-0 bg-gradient-to-r ${color} opacity-20 blur-xl group-hover:opacity-30 transition-opacity rounded-2xl`} />
      <div className={`relative h-full ${isDark ? 'bg-gray-800/80' : 'bg-white/90'} backdrop-blur-xl rounded-2xl p-4 lg:p-6 border ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'} hover:border-gray-600 transition-all`}>
        <div className="flex items-center justify-between mb-3">
          <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-r ${color} flex items-center justify-center transform group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full border-2 border-dashed ${isDark ? 'border-gray-600' : 'border-gray-300'}`}
          />
        </div>
        <div className={`text-2xl lg:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
          {prefix}
          {isVisible && <CountUp end={value} duration={2.5} separator="," decimals={suffix === '%' ? 1 : 0} />}
          {suffix}
        </div>
        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs lg:text-sm`}>{label}</p>
      </div>
    </motion.div>
  );
};

// Компонент карточки отчета
const ReportCard = ({ title, subtitle, gradient, icon, children, className = "" }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';
  
  const springProps = useSpring({
    transform: isHovered ? 'translateY(-5px)' : 'translateY(0px)',
    boxShadow: isHovered 
      ? '0 20px 40px rgba(0,0,0,0.3)' 
      : '0 10px 20px rgba(0,0,0,0.1)'
  });
  
  return (
    <animated.div
      style={springProps}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden rounded-2xl ${gradient} p-6 lg:p-8 h-full ${className}`}
    >
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent animate-shimmer" />
      </div>
      
      <div className="relative z-10 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4 lg:mb-6">
          <div>
            <h3 className="text-lg lg:text-2xl font-bold text-white mb-1">{title}</h3>
            <p className="text-gray-300 text-sm lg:text-base">{subtitle}</p>
          </div>
          <motion.div 
            animate={{ rotate: isHovered ? 360 : 0 }}
            transition={{ duration: 0.5 }}
            className="w-12 h-12 lg:w-16 lg:h-16 bg-white/20 backdrop-blur-sm rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0"
          >
            {icon}
          </motion.div>
        </div>
        <div className="flex-1">
          {children}
        </div>
      </div>
    </animated.div>
  );
};

// Основной компонент
const AnalyticsReports = () => {
  const { t } = useTranslation(analyticsReportsTranslations);
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';
  const [loading, setLoading] = useState(true);
  const [apiData, setApiData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState({ start: '01.01.2025', end: '31.05.2025' });
  const [activeView, setActiveView] = useState('overview');
  const [selectedModel, setSelectedModel] = useState(null);
  const containerRef = useRef();
  
  // Загрузка данных
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.post('https://uzavtosalon.uz/b/dashboard/infos&get_modif_color', {
          begin_date: selectedPeriod.start,
          end_date: selectedPeriod.end
        });
        setApiData(response.data);
        
        setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#3b82f6', '#8b5cf6', '#ec4899']
          });
        }, 500);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedPeriod]);
  
  // Обработка данных
  const processedData = useMemo(() => {
    if (!apiData) return null;
    
    const modelStats = {};
    const colorStats = {};
    const monthlyTrends = {};
    
    apiData.forEach(model => {
      let modelTotal = 0;
      let modelRevenue = 0;
      const modelModifications = {};
      
      model.filter_by_region.forEach(month => {
        if (!monthlyTrends[month.month]) {
          monthlyTrends[month.month] = { 
            total: 0, 
            revenue: 0, 
            models: {}
          };
        }
        
        month.modifications.forEach(mod => {
          const count = parseInt(mod.all_count) || 0;
          const amount = parseFloat(mod.amount) || 0;
          
          modelTotal += count;
          modelRevenue += amount;
          
          if (!modelModifications[mod.modification_name]) {
            modelModifications[mod.modification_name] = {
              total: 0,
              revenue: 0,
              colors: {}
            };
          }
          modelModifications[mod.modification_name].total += count;
          modelModifications[mod.modification_name].revenue += amount;
          
          if (!modelModifications[mod.modification_name].colors[mod.color_name]) {
            modelModifications[mod.modification_name].colors[mod.color_name] = {
              count: 0,
              revenue: 0
            };
          }
          modelModifications[mod.modification_name].colors[mod.color_name].count += count;
          modelModifications[mod.modification_name].colors[mod.color_name].revenue += amount;
          
          if (!colorStats[mod.color_name]) {
            colorStats[mod.color_name] = { 
              count: 0, 
              revenue: 0,
              models: {}
            };
          }
          colorStats[mod.color_name].count += count;
          colorStats[mod.color_name].revenue += amount;
          
          monthlyTrends[month.month].total += count;
          monthlyTrends[month.month].revenue += amount;
        });
      });
      
      modelStats[model.model_name] = {
        total: modelTotal,
        revenue: modelRevenue,
        avgPrice: modelTotal > 0 ? modelRevenue / modelTotal : 0,
        photo: model.photo_sha,
        modifications: modelModifications
      };
    });
    
    const bestSellingModel = Object.entries(modelStats).reduce((a, b) => 
      b[1].total > a[1].total ? b : a, ['', { total: 0 }]
    );
    
    const mostProfitableModel = Object.entries(modelStats).reduce((a, b) => 
      b[1].revenue > a[1].revenue ? b : a, ['', { revenue: 0 }]
    );
    
    const bestSellingColor = Object.entries(colorStats).reduce((a, b) => 
      b[1].count > a[1].count ? b : a, ['', { count: 0 }]
    );
    
    let bestCombination = { model: '', modification: '', color: '', count: 0 };
    Object.entries(modelStats).forEach(([modelName, modelData]) => {
      Object.entries(modelData.modifications).forEach(([modName, modData]) => {
        Object.entries(modData.colors).forEach(([colorName, colorData]) => {
          if (colorData.count > bestCombination.count) {
            bestCombination = {
              model: modelName,
              modification: modName,
              color: colorName,
              count: colorData.count,
              revenue: colorData.revenue
            };
          }
        });
      });
    });
    
    return {
      modelStats,
      colorStats,
      monthlyTrends,
      bestSellingModel,
      mostProfitableModel,
      bestSellingColor,
      bestCombination,
      totalSales: Object.values(modelStats).reduce((sum, model) => sum + model.total, 0),
      totalRevenue: Object.values(modelStats).reduce((sum, model) => sum + model.revenue, 0)
    };
  }, [apiData]);
  
  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <motion.div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{t('states.loading')}</p>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div ref={containerRef} className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="relative z-10 min-h-screen flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 lg:p-8"
        >
          <div className="max-w-[1920px] mx-auto">
            <div className="flex items-center gap-4 mb-4 lg:mb-6">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-lg"
              >
                <Brain className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
              </motion.div>
              <div>
                <h1 className={`text-2xl lg:text-4xl xl:text-5xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
                  {t('title')}
                </h1>
                <p className={`text-base lg:text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {t('subtitle', { year: new Date().getFullYear() })}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 lg:gap-4 flex-wrap">
              {[
                { id: 'overview', label: t('tabs.overview'), icon: <BarChart3 className="w-4 h-4" /> },
                { id: 'visualization', label: t('tabs.visualization'), icon: <Activity className="w-4 h-4" /> },
                { id: 'comparison', label: t('tabs.comparison'), icon: <Calendar className="w-4 h-4" /> },
                { id: 'details', label: t('tabs.details'), icon: <Layers className="w-4 h-4" /> }
              ].map((view) => (
                <motion.button
                  key={view.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveView(view.id)}
                  className={`px-4 py-2 lg:px-6 lg:py-3 rounded-lg lg:rounded-xl font-medium transition-all flex items-center gap-2 text-sm lg:text-base ${
                    activeView === view.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                      : isDark 
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {view.icon}
                  <span className="hidden sm:inline">{view.label.split(' ')[1]}</span>
                  <span className="sm:hidden">{view.label.split(' ')[0]}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
        
        <div className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            {activeView === 'overview' && processedData && (
              <motion.div
                key="overview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 lg:p-8"
              >
                <div className="max-w-[1920px] mx-auto">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-12">
                    <AnimatedStat
                      value={processedData.totalSales}
                      label={t('metrics.totalSold')}
                      icon={<Car className="w-5 h-5 lg:w-6 lg:h-6 text-white" />}
                      color="from-blue-500 to-cyan-500"
                      delay={0}
                      suffix={` ${t('metrics.units')}`}
                    />
                    <AnimatedStat
                      value={Math.round(processedData.totalRevenue)}
                      label={t('metrics.totalRevenue')}
                      icon={<DollarSign className="w-5 h-5 lg:w-6 lg:h-6 text-white" />}
                      color="from-green-500 to-emerald-500"
                      delay={0.1}
                      suffix={` ${t('metrics.currency')}`}
                    />
                    <AnimatedStat
                      value={Object.keys(processedData.modelStats).length}
                      label={t('metrics.models')}
                      icon={<Package className="w-5 h-5 lg:w-6 lg:h-6 text-white" />}
                      color="from-purple-500 to-pink-500"
                      delay={0.2}
                    />
                    <AnimatedStat
                      value={Object.keys(processedData.colorStats).length}
                      label={t('metrics.colors')}
                      icon={<Palette className="w-5 h-5 lg:w-6 lg:h-6 text-white" />}
                      color="from-orange-500 to-red-500"
                      delay={0.3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8 mb-6 lg:mb-12">
                    <ReportCard
                      title={t('reports.bestSelling.title')}
                      subtitle={t('reports.bestSelling.subtitle')}
                      gradient="bg-gradient-to-br from-blue-600/20 to-blue-800/20"
                      icon={<TrendingUp className="w-6 h-6 lg:w-8 lg:h-8 text-blue-400" />}
                    >
                      <div className="space-y-3 lg:space-y-4">
                        <div className={`${isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'} rounded-xl p-3 lg:p-4`}>
                          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs lg:text-sm mb-2`}>{t('reports.bestSelling.modelLeader')}</p>
                          <p className={`text-xl lg:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-1 lg:mb-2`}>
                            {processedData.bestCombination.model}
                          </p>
                          <p className={`text-sm lg:text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {processedData.bestCombination.modification}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <div 
                              className="w-5 h-5 lg:w-6 lg:h-6 rounded-full border-2 border-gray-600"
                              style={{ backgroundColor: processedData.bestCombination.color === 'Summit White' ? '#FFFFFF' : '#808080' }}
                            />
                            <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm lg:text-base`}>{processedData.bestCombination.color}</span>
                          </div>
                        </div>
                        
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 lg:p-4">
                          <p className="text-blue-300 text-xs lg:text-sm">
                            {t('reports.bestSelling.result', {
                              year: '2025',
                              model: processedData.bestCombination.model,
                              modification: processedData.bestCombination.modification,
                              color: processedData.bestCombination.color,
                              quantity: processedData.bestCombination.count.toLocaleString()
                            })}
                          </p>
                        </div>
                      </div>
                    </ReportCard>
                    
                    <ReportCard
                      title={t('reports.mostProfitable.title')}
                      subtitle={t('reports.mostProfitable.subtitle')}
                      gradient="bg-gradient-to-br from-green-600/20 to-green-800/20"
                      icon={<Award className="w-6 h-6 lg:w-8 lg:h-8 text-green-400" />}
                    >
                      <div className="space-y-3 lg:space-y-4">
                        <div className={`${isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'} rounded-xl p-3 lg:p-4`}>
                          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs lg:text-sm mb-2`}>{t('reports.mostProfitable.profitLeader')}</p>
                          <p className={`text-xl lg:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-1 lg:mb-2`}>
                            {processedData.mostProfitableModel[0]}
                          </p>
                          <p className="text-lg lg:text-2xl text-green-400 font-bold">
                            {Math.round(processedData.mostProfitableModel[1].revenue).toLocaleString()} {t('metrics.currency')}
                          </p>
                        </div>
                        
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 lg:p-4">
                          <p className="text-green-300 text-xs lg:text-sm">
                            {t('reports.mostProfitable.result', {
                              year: '2025',
                              model: processedData.mostProfitableModel[0],
                              modification: '',
                              color: '',
                              amount: `${Math.round(processedData.mostProfitableModel[1].revenue).toLocaleString()} ${t('metrics.currency')}`
                            })}
                          </p>
                        </div>
                      </div>
                    </ReportCard>
                    
                    <ReportCard
                      title={t('reports.bestSellingColor.title')}
                      subtitle={t('reports.bestSellingColor.subtitle')}
                      gradient="bg-gradient-to-br from-purple-600/20 to-purple-800/20"
                      icon={<Palette className="w-6 h-6 lg:w-8 lg:h-8 text-purple-400" />}
                    >
                      <div className="space-y-3 lg:space-y-4">
                        <div className={`${isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'} rounded-xl p-3 lg:p-4`}>
                          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs lg:text-sm mb-2`}>{t('reports.bestSellingColor.popularColor')}</p>
                          <div className="flex items-center gap-3 mb-2">
                            <div 
                              className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg border-2 border-gray-600 shadow-lg"
                              style={{ 
                                backgroundColor: processedData.bestSellingColor[0] === 'Summit White' ? '#FFFFFF' : 
                                               processedData.bestSellingColor[0] === 'Black Met. Kettle metallic' ? '#000000' :
                                               '#808080'
                              }}
                            />
                            <p className={`text-lg lg:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {processedData.bestSellingColor[0]}
                            </p>
                          </div>
                          <p className="text-lg lg:text-xl text-purple-400 font-bold">
                            {processedData.bestSellingColor[1].count.toLocaleString()} {t('metrics.units')}
                          </p>
                        </div>
                        
                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 lg:p-4">
                          <p className="text-purple-300 text-xs lg:text-sm">
                            {t('reports.bestSellingColor.result', {
                              year: '2025',
                              color: processedData.bestSellingColor[0],
                              quantity: processedData.bestSellingColor[1].count.toLocaleString()
                            })}
                          </p>
                        </div>
                      </div>
                    </ReportCard>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`${isDark ? 'bg-gray-800/50' : 'bg-white'} backdrop-blur-sm rounded-2xl p-4 lg:p-6`}
                    >
                      <h3 className={`text-lg lg:text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>{t('charts.topModels')}</h3>
                      <div className="h-48 lg:h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={Object.entries(processedData.modelStats)
                            .sort((a, b) => b[1].total - a[1].total)
                            .slice(0, 5)
                            .map(([name, stats]) => ({
                              name,
                              sales: stats.total,
                              revenue: Math.round(stats.revenue)
                            }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
                            <XAxis dataKey="name" stroke={isDark ? "#9ca3af" : "#6b7280"} />
                            <YAxis stroke={isDark ? "#9ca3af" : "#6b7280"} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                                border: isDark ? '1px solid #374151' : '1px solid #e5e7eb', 
                                borderRadius: '8px',
                                color: isDark ? '#f1f5f9' : '#1e293b'
                              }}
                              labelStyle={{ color: isDark ? '#9ca3af' : '#6b7280' }}
                            />
                            <Bar dataKey="sales" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                              {Object.entries(processedData.modelStats)
                                .sort((a, b) => b[1].total - a[1].total)
                                .slice(0, 5)
                                .map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][index]} />
                                ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className={`${isDark ? 'bg-gray-800/50' : 'bg-white'} backdrop-blur-sm rounded-2xl p-4 lg:p-6`}
                    >
                      <h3 className={`text-lg lg:text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>{t('charts.colorDistribution')}</h3>
                      <div className="h-48 lg:h-64">
                        <ColorDistributionChart 
                          colorStats={processedData.colorStats} 
                          totalSales={processedData.totalSales}
                        />
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
            
            {activeView === 'visualization' && processedData && (
              <motion.div
                key="visualization"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 lg:p-8 h-full"
              >
                <div className="max-w-[1920px] mx-auto h-full">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 h-full">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`${isDark ? 'bg-gray-800/50' : 'bg-white'} backdrop-blur-sm rounded-2xl p-4 lg:p-6`}
                    >
                      <h3 className={`text-lg lg:text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>{t('charts.modelRating')}</h3>
                      <div className="h-[400px] lg:h-[500px]">
                        <D3CarVisualization data={processedData} selectedModel={selectedModel} />
                      </div>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 }}
                      className={`${isDark ? 'bg-gray-800/50' : 'bg-white'} backdrop-blur-sm rounded-2xl p-4 lg:p-6`}
                    >
                      <h3 className={`text-lg lg:text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>{t('charts.monthlySalesDynamics')}</h3>
                      <div className="h-[400px] lg:h-[500px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={Object.entries(processedData.monthlyTrends).map(([month, data]) => ({
                            month: month.split('-')[1],
                            total: data.total,
                            revenue: Math.round(data.revenue)
                          }))}>
                            <defs>
                              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
                            <XAxis dataKey="month" stroke={isDark ? "#9ca3af" : "#6b7280"} />
                            <YAxis stroke={isDark ? "#9ca3af" : "#6b7280"} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                                border: isDark ? '1px solid #374151' : '1px solid #e5e7eb', 
                                borderRadius: '8px',
                                color: isDark ? '#f1f5f9' : '#1e293b'
                              }}
                              labelStyle={{ color: isDark ? '#9ca3af' : '#6b7280' }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="total" 
                              stroke="#3b82f6" 
                              fillOpacity={1} 
                              fill="url(#colorTotal)"
                              strokeWidth={3}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
            
            {activeView === 'comparison' && processedData && (
              <motion.div
                key="comparison"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 lg:p-8"
              >
                <div className="max-w-[1920px] mx-auto">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`${isDark ? 'bg-gray-800/50' : 'bg-white'} backdrop-blur-sm rounded-2xl p-4 lg:p-6`}
                  >
                    <h3 className={`text-lg lg:text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>{t('charts.yearComparison')}</h3>
                    <YearComparison 
                      currentData={processedData} 
                      onYearSelect={(year) => {
                        // Можно добавить логику выбора года
                      }}
                    />
                  </motion.div>
               </div>
             </motion.div>
           )}
           
           {activeView === 'details' && processedData && (
             <motion.div
               key="details"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="p-4 lg:p-8"
             >
               <div className="max-w-[1920px] mx-auto">
                 <motion.div
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   className={`${isDark ? 'bg-gray-800/50' : 'bg-white'} backdrop-blur-sm rounded-2xl p-4 lg:p-6 overflow-x-auto`}
                 >
                   <h3 className={`text-lg lg:text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>{t('table.model')}</h3>
                   <div className="overflow-x-auto">
                     <table className="w-full min-w-[600px]">
                       <thead>
                         <tr className={`text-left ${isDark ? 'text-gray-400' : 'text-gray-600'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                           <th className="pb-3 pr-4">{t('table.model')}</th>
                           <th className="pb-3 pr-4 text-right">{t('table.sales')}</th>
                           <th className="pb-3 pr-4 text-right">{t('table.revenue')}</th>
                           <th className="pb-3 pr-4 text-right">{t('table.avgPrice')}</th>
                           <th className="pb-3 text-center">{t('table.marketShare')}</th>
                         </tr>
                       </thead>
                       <tbody>
                         {Object.entries(processedData.modelStats)
                           .sort((a, b) => b[1].total - a[1].total)
                           .map(([model, stats], index) => (
                             <motion.tr
                               key={model}
                               initial={{ opacity: 0, x: -20 }}
                               animate={{ opacity: 1, x: 0 }}
                               transition={{ delay: index * 0.05 }}
                               className={`border-b ${isDark ? 'border-gray-700/50 hover:bg-gray-700/30' : 'border-gray-200/50 hover:bg-gray-100/50'} transition-colors cursor-pointer`}
                               onClick={() => setSelectedModel(model)}
                             >
                               <td className="py-3 pr-4">
                                 <div className="flex items-center gap-3">
                                   <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${
                                     index === 0 ? 'from-yellow-400 to-yellow-600' :
                                     index === 1 ? 'from-gray-300 to-gray-500' :
                                     index === 2 ? 'from-orange-400 to-orange-600' :
                                     'from-blue-400 to-blue-600'
                                   } flex items-center justify-center text-white font-bold text-sm`}>
                                     {index + 1}
                                   </div>
                                   <span className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium`}>{model}</span>
                                 </div>
                               </td>
                               <td className="py-3 pr-4 text-right">
                                 <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{stats.total.toLocaleString()}</span>
                               </td>
                               <td className="py-3 pr-4 text-right">
                                 <span className="text-green-400">{Math.round(stats.revenue).toLocaleString()} {t('metrics.currency')}</span>
                               </td>
                               <td className="py-3 pr-4 text-right">
                                 <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{Math.round(stats.avgPrice).toLocaleString()} {t('metrics.currency')}</span>
                               </td>
                               <td className="py-3">
                                 <div className="flex items-center justify-center gap-2">
                                   <div className={`w-24 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
                                     <motion.div 
                                       initial={{ width: 0 }}
                                       animate={{ width: `${(stats.total / processedData.totalSales) * 100}%` }}
                                       transition={{ duration: 1, delay: index * 0.1 }}
                                       className="h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                                     />
                                   </div>
                                   <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                     {((stats.total / processedData.totalSales) * 100).toFixed(1)}%
                                   </span>
                                 </div>
                               </td>
                             </motion.tr>
                           ))}
                       </tbody>
                     </table>
                   </div>
                 </motion.div>
               </div>
             </motion.div>
           )}
         </AnimatePresence>
       </div>
     </div>
     
     <div className="fixed bottom-4 right-4 lg:bottom-8 lg:right-8 z-20 flex flex-col gap-3 lg:gap-4">
       <motion.button
         whileHover={{ scale: 1.1 }}
         whileTap={{ scale: 0.9 }}
         onClick={() => {
           const count = 200;
           const defaults = {
             origin: { y: 0.7 }
           };

           function fire(particleRatio, opts) {
             confetti({
               ...defaults,
               ...opts,
               particleCount: Math.floor(count * particleRatio),
               spread: 90,
               startVelocity: 30,
               decay: 0.9,
               scalar: 1.2
             });
           }

           fire(0.25, {
             spread: 26,
             startVelocity: 55,
             colors: ['#3b82f6', '#8b5cf6']
           });
           fire(0.2, {
             spread: 60,
             colors: ['#ec4899', '#f59e0b']
           });
           fire(0.35, {
             spread: 100,
             decay: 0.91,
             scalar: 0.8,
             colors: ['#10b981', '#06b6d4']
           });
         }}
         className="w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse"
         title={t('actions.celebrate')}
       >
         <Rocket className="w-7 h-7 lg:w-8 lg:h-8 text-white" />
       </motion.button>
     </div>
   </div>
 );
};

// Функция генерации CSV отчета с переводами
const generateCSVReport = (data) => {
 if (!data) return '';
 
 // Получаем текущий язык
 const currentLocale = localStorage.getItem('language-store') 
   ? JSON.parse(localStorage.getItem('language-store')).state.currentLocale 
   : 'ru';
 
 // Тексты для CSV на разных языках
 const csvTexts = {
   ru: {
     title: 'Аналитический отчет',
     mainMetrics: 'Основные показатели',
     totalSold: 'Всего продано автомобилей',
     totalRevenue: 'Общая выручка',
     bestSellingModel: 'Лучшая модель по продажам',
     mostProfitableModel: 'Самая прибыльная модель',
     mostPopularColor: 'Самый популярный цвет',
     modelDetails: 'Детальная статистика по моделям',
     model: 'Модель',
     sales: 'Продажи (шт)',
     revenue: 'Выручка (сум)',
     avgPrice: 'Средняя цена (сум)',
     units: 'шт',
     currency: 'сум'
   },
   uz: {
     title: 'Analitik hisobot',
     mainMetrics: 'Asosiy ko\'rsatkichlar',
     totalSold: 'Jami sotilgan avtomobillar',
     totalRevenue: 'Umumiy daromad',
     bestSellingModel: 'Eng ko\'p sotilgan model',
     mostProfitableModel: 'Eng foydali model',
     mostPopularColor: 'Eng mashhur rang',
     modelDetails: 'Modellar bo\'yicha batafsil statistika',
     model: 'Model',
     sales: 'Savdo (dona)',
     revenue: 'Daromad (so\'m)',
     avgPrice: 'O\'rtacha narx (so\'m)',
     units: 'dona',
     currency: 'so\'m'
   },
   en: {
     title: 'Analytics Report',
     mainMetrics: 'Key Metrics',
     totalSold: 'Total cars sold',
     totalRevenue: 'Total revenue',
     bestSellingModel: 'Best selling model',
     mostProfitableModel: 'Most profitable model',
     mostPopularColor: 'Most popular color',
     modelDetails: 'Detailed statistics by models',
     model: 'Model',
     sales: 'Sales (pcs)',
     revenue: 'Revenue (UZS)',
     avgPrice: 'Average price (UZS)',
     units: 'pcs',
     currency: 'UZS'
   }
 };
  
 
 const texts = csvTexts[currentLocale] || csvTexts.ru;
 
 let csv = `${texts.title}\n\n`;
 
 // Основные показатели
 csv += `${texts.mainMetrics}\n`;
 csv += `${texts.totalSold},${data.totalSales}\n`;
 csv += `${texts.totalRevenue},${Math.round(data.totalRevenue).toLocaleString()} ${texts.currency}\n`;
 csv += `${texts.bestSellingModel},${data.bestSellingModel[0]},${data.bestSellingModel[1].total} ${texts.units}\n`;
 csv += `${texts.mostProfitableModel},${data.mostProfitableModel[0]},${Math.round(data.mostProfitableModel[1].revenue).toLocaleString()} ${texts.currency}\n`;
 csv += `${texts.mostPopularColor},${data.bestSellingColor[0]},${data.bestSellingColor[1].count} ${texts.units}\n\n`;
 
 // Детали по моделям
 csv += `${texts.modelDetails}\n`;
 csv += `${texts.model},${texts.sales},${texts.revenue},${texts.avgPrice}\n`;
 Object.entries(data.modelStats)
   .sort((a, b) => b[1].total - a[1].total)
   .forEach(([model, stats]) => {
     csv += `${model},${stats.total},${Math.round(stats.revenue).toLocaleString()},${Math.round(stats.avgPrice).toLocaleString()}\n`;
   });
 
 return csv;
};

export default AnalyticsReports;