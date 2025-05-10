"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import * as d3 from 'd3';

// Импорт компонентов
import Header from './Header';
import ControlPanel from './ControlPanel';
import InfoCards from './InfoCards';
import MainChart from './charts/MainChart';
import ProgressChart from './charts/ProgressChart';
import DetailsChart from './charts/DetailsChart';
import YearlyTrendChart from './charts/YearlyTrendChart';
import YearComparisonChart from './charts/YearComparisonChart';
import ForecastChart from './charts/ForecastChart';
import CategoryDistributionChart from './charts/CategoryDistributionChart';
import QuarterlyChart from './charts/QuarterlyChart';

// Константы и утилиты
export const SALE_TYPES = {
  RETAIL: {
    id: 'retail',
    name: 'Розничные продажи',
    color: '#3b82f6'
  },
  WHOLESALE: {
    id: 'wholesale',
    name: 'Оптовые продажи',
    color: '#8b5cf6'
  },
  PROMO: {
    id: 'promo',
    name: 'Акционные продажи',
    color: '#ec4899'
  }
};

export const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

// Форматирование чисел
export const formatProfitCompact = (number) => {
  if (number >= 1000000000000) { // триллионы
    return `${(number / 1000000000000).toFixed(1)}T`;
  } else if (number >= 1000000000) { // миллиарды
    return `${(number / 1000000000).toFixed(1)}B`;
  } else if (number >= 1000000) { // миллионы
    return `${(number / 1000000).toFixed(1)}M`;
  } else if (number >= 1000) { // тысячи
    return `${(number / 1000).toFixed(1)}K`;
  }
  return Math.round(number).toLocaleString('ru-RU');
};

// Генерация демо-данных
export const generateFinancialData = () => {
  const years = [2023, 2024, 2025];
  
  const data = {};
  
  // Базовые значения для создания реалистичных данных
  const baseRetail = 350000;
  const baseWholesale = 500000;
  const basePromo = 200000;
  
  // Сезонные коэффициенты (больше в летние месяцы и под конец года)
  const seasonalFactors = [
    0.7, 0.75, 0.9, 0.95, 1.1, 1.3, 
    1.4, 1.3, 1.1, 1.0, 1.2, 1.5
  ];
  
  // Годовой рост для создания тренда
  const yearlyGrowthFactors = {
    2023: 1,
    2024: 1.35,
    2025: 1.8
  };
  
  years.forEach(year => {
    // Генерация целевых показателей
    const targetAmount = Math.round((5000000 + Math.random() * 5000000) * yearlyGrowthFactors[year]);
    
    data[year] = {
      targetAmount,
      totalEarned: 0,
      months: [],
      quarterlyData: [0, 0, 0, 0], // Данные по кварталам
      categories: { // Накопительные данные по категориям
        retail: 0,
        wholesale: 0,
        promo: 0
      }
    };
    
    let yearlyTotal = 0;
    
    // Создаем небольшие случайные колебания для каждой категории и месяца
    const retailVariation = Array(12).fill().map(() => 0.8 + Math.random() * 0.4);
    const wholesaleVariation = Array(12).fill().map(() => 0.8 + Math.random() * 0.4);
    const promoVariation = Array(12).fill().map(() => 0.8 + Math.random() * 0.4);
    
    MONTHS.forEach((month, monthIndex) => {
      // Применяем сезонность, годовой рост и случайные вариации
      const retail = Math.round(
        baseRetail * seasonalFactors[monthIndex] * yearlyGrowthFactors[year] * retailVariation[monthIndex]
      );
      
      const wholesale = Math.round(
        baseWholesale * seasonalFactors[monthIndex] * yearlyGrowthFactors[year] * wholesaleVariation[monthIndex]
      );
      
      const promo = Math.round(
        basePromo * seasonalFactors[monthIndex] * yearlyGrowthFactors[year] * promoVariation[monthIndex]
      );
      
      const monthTotal = retail + wholesale + promo;
      yearlyTotal += monthTotal;
      
      // Обновляем квартальные данные
      const quarterIndex = Math.floor(monthIndex / 3);
      data[year].quarterlyData[quarterIndex] += monthTotal;
      
      // Обновляем категории
      data[year].categories.retail += retail;
      data[year].categories.wholesale += wholesale;
      data[year].categories.promo += promo;
      
      data[year].months.push({
        name: month,
        month: monthIndex + 1,
        retail,
        wholesale,
        promo,
        total: monthTotal
      });
    });
    
    data[year].totalEarned = yearlyTotal;
  });
  
  return data;
};

// Основной компонент
export default function FinancialAnalytics() {
  // Стейты для управления данными и фильтрами
  const [financialData, setFinancialData] = useState({});
  const [selectedYears, setSelectedYears] = useState([2024]);
  const [filteredData, setFilteredData] = useState([]);
  const [displayMode, setDisplayMode] = useState('period'); // 'yearly', 'period', 'compare'
  
  // Получение текущего месяца и года
  const getCurrentMonthAndYear = () => {
    const now = new Date();
    return {
      month: now.getMonth() + 1,
      year: now.getFullYear()
    };
  };
  
  // Стейты для фильтров по периоду
  const currentDate = getCurrentMonthAndYear();
  const [startMonth, setStartMonth] = useState(1);
  const [startYear, setStartYear] = useState(currentDate.year - 1);
  const [endMonth, setEndMonth] = useState(currentDate.month);
  const [endYear, setEndYear] = useState(currentDate.year);
  
  // Стейты для представления
  const [viewType, setViewType] = useState('bar');
  const [focusCategory, setFocusCategory] = useState('all');
  const [showQuarterlyData, setShowQuarterlyData] = useState(false);
  
  // Refs для контейнеров графиков
  const mainChartRef = useRef(null);
  const progressChartRef = useRef(null);
  const detailsChartRef = useRef(null);
  const yearlyTrendChartRef = useRef(null);
  const yearComparisonChartRef = useRef(null);
  const forecastChartRef = useRef(null);
  const categoryDistributionRef = useRef(null);
  const quarterlyChartRef = useRef(null);
  
  // Инициализация данных
  useEffect(() => {
    setFinancialData(generateFinancialData());
  }, []);
  
  // Функция для переключения выбора года
  const toggleYearSelection = (year) => {
    if (displayMode === 'compare') {
      // В режиме сравнения можно выбрать несколько лет
      if (selectedYears.includes(year)) {
        if (selectedYears.length > 1) {
          setSelectedYears(selectedYears.filter(y => y !== year));
        }
      } else {
        setSelectedYears([...selectedYears, year]);
      }
    } else {
      // В обычном режиме только один год
      setSelectedYears([year]);
    }
  };
  
  // Фильтрация данных в зависимости от выбранных параметров
  useEffect(() => {
    if (Object.keys(financialData).length === 0) return;
    
    const filteredMonths = [];
    
    if (displayMode === 'yearly') {
      selectedYears.forEach(year => {
        if (financialData[year]) {
          financialData[year].months.forEach(month => {
            filteredMonths.push({
              ...month,
              year
            });
          });
        }
      });
    } else if (displayMode === 'compare') {
      selectedYears.forEach(year => {
        if (financialData[year]) {
          financialData[year].months.forEach(month => {
            filteredMonths.push({
              ...month,
              year
            });
          });
        }
      });
    } else if (displayMode === 'period') {
      // Полный диапазон выбранного периода
      for (let year = startYear; year <= endYear; year++) {
        if (!financialData[year]) continue;
        
        financialData[year].months.forEach(month => {
          if (
            (year === startYear && month.month < startMonth) || 
            (year === endYear && month.month > endMonth)
          ) {
            return;
          }
          
          filteredMonths.push({
            ...month,
            year,
            label: `${month.name} ${year}`
          });
        });
      }
    }
    
    setFilteredData(filteredMonths);
  }, [
    financialData, 
    selectedYears, 
    displayMode, 
    startMonth, 
    startYear, 
    endMonth, 
    endYear
  ]);
  
  // Обработчик изменения режима отображения
  const handleDisplayModeChange = (mode) => {
    setDisplayMode(mode);
    
    if (mode === 'yearly') {
      setSelectedYears([2024]);
    } else if (mode === 'compare') {
      const years = Object.keys(financialData).map(Number).sort((a, b) => b - a);
      setSelectedYears(years.slice(0, 2));
    }
  };
  
  // Проверка корректности выбранного периода
  const isPeriodValid = () => {
    if (startYear > endYear) return false;
    if (startYear === endYear && startMonth > endMonth) return false;
    return true;
  };
  
  // Получение общей суммы для периода
  const getTotalForPeriod = () => {
    if (!filteredData.length) return 0;
    return filteredData.reduce((sum, month) => sum + month.total, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-6">
      {/* Заголовок страницы */}
      <Header />
      
      {/* Панель управления и фильтры */}
      <ControlPanel 
        displayMode={displayMode}
        viewType={viewType}
        focusCategory={focusCategory}
        selectedYears={selectedYears}
        startMonth={startMonth}
        startYear={startYear}
        endMonth={endMonth}
        endYear={endYear}
        showQuarterlyData={showQuarterlyData}
        financialData={financialData}
        onDisplayModeChange={handleDisplayModeChange}
        onViewTypeChange={setViewType}
        onFocusCategoryChange={setFocusCategory}
        onYearToggle={toggleYearSelection}
        onStartMonthChange={setStartMonth}
        onStartYearChange={setStartYear}
        onEndMonthChange={setEndMonth}
        onEndYearChange={setEndYear}
        onShowQuarterlyDataChange={setShowQuarterlyData}
        isPeriodValid={isPeriodValid}
      />
      
      {filteredData.length > 0 && (
        <>
          {/* Информационные карточки */}
          <InfoCards 
            filteredData={filteredData}
            displayMode={displayMode}
            selectedYears={selectedYears}
            financialData={financialData}
            getTotalForPeriod={getTotalForPeriod}
          />
          
          {/* Основной график и прогресс */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 bg-gray-800 rounded-xl p-2 border border-gray-700/50 shadow-lg">
              <MainChart 
                ref={mainChartRef}
                filteredData={filteredData}
                displayMode={displayMode}
                viewType={viewType}
                focusCategory={focusCategory}
                selectedYears={selectedYears}
              />
            </div>
            
            <div className="bg-gray-800 rounded-xl p-10 border border-gray-700/50 shadow-lg">
              <h3 className="text-xl font-semibold text-white mb-4 text-center">Выполнение плана</h3>
              <ProgressChart 
                ref={progressChartRef}
                financialData={financialData}
                displayMode={displayMode}
                selectedYears={selectedYears}
                startYear={startYear}
                startMonth={startMonth}
                endYear={endYear}
                endMonth={endMonth}
              />
            </div>
          </div>
          
          {/* Детальная аналитика по категориям */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700/50 shadow-lg">
              <h3 className="text-xl font-semibold text-white mb-4">Структура продаж по категориям</h3>
              <DetailsChart 
                ref={detailsChartRef} 
                filteredData={filteredData} 
              />
            </div>
            
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700/50 shadow-lg">
              <h3 className="text-xl font-semibold text-white mb-4">Распределение по категориям</h3>
              <CategoryDistributionChart 
                ref={categoryDistributionRef} 
                filteredData={filteredData} 
              />
            </div>
          </div>
          
          {/* Тренды и прогнозы */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700/50 shadow-lg">
              <h3 className="text-xl font-semibold text-white mb-4">Динамика по годам</h3>
              <YearlyTrendChart 
                ref={yearlyTrendChartRef}
                financialData={financialData}
                focusCategory={focusCategory}
              />
            </div>
            
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700/50 shadow-lg">
              <h3 className="text-xl font-semibold text-white mb-4">Прогноз на следующий год</h3>
              <ForecastChart 
                ref={forecastChartRef}
                financialData={financialData}
                focusCategory={focusCategory}
              />
            </div>
          </div>
          
          {/* Условное отображение для режима сравнения */}
          {displayMode === 'compare' && (
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700/50 shadow-lg mb-6">
              <h3 className="text-xl font-semibold text-white mb-4">Сравнение по годам</h3>
              <YearComparisonChart 
                ref={yearComparisonChartRef}
                selectedYears={selectedYears}
                financialData={financialData}
              />
            </div>
          )}
          
          {/* Квартальная аналитика */}
          {showQuarterlyData && (
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700/50 shadow-lg mb-6">
              <h3 className="text-xl font-semibold text-white mb-4">Квартальная аналитика</h3>
              <QuarterlyChart 
                ref={quarterlyChartRef}
                financialData={financialData}
                displayMode={displayMode}
                selectedYears={selectedYears}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}