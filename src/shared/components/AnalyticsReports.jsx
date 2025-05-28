// src/shared/components/AnalyticsReports.jsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../hooks/useTranslation';
import { analyticsReportsTranslations } from './locales/AnalyticsReports';

const AnalyticsReports = () => {
  const { t } = useTranslation(analyticsReportsTranslations);
  
  // Состояния
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(2024);
  const [filters, setFilters] = useState({
    modification: 'all',
    color: 'all',
    period: 'year'
  });
  
  // Расширенные моковые данные
  const [reportData] = useState({
    bestSellingModel: {
      model: 'COBALT',
      modification: '2-позиция',
      color: 'Summit White',
      colorHex: '#FFFFFF',
      quantity: 12458,
      percentage: 28.5,
      trend: 'up',
      trendValue: 15.3,
      image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400&h=300&fit=crop',
      // Дополнительные данные для детального анализа
      byModification: [
        { name: '2-позиция', quantity: 8234, percentage: 66.1 },
        { name: 'LT', quantity: 2890, percentage: 23.2 },
        { name: 'Premier', quantity: 1334, percentage: 10.7 }
      ],
      byColor: [
        { name: 'Summit White', hex: '#FFFFFF', quantity: 5234, percentage: 42.0 },
        { name: 'Black', hex: '#000000', quantity: 3456, percentage: 27.7 },
        { name: 'Silver', hex: '#C0C0C0', quantity: 2345, percentage: 18.8 },
        { name: 'Red', hex: '#FF0000', quantity: 1423, percentage: 11.4 }
      ],
      monthlyBreakdown: [
        { month: 'Январь', quantity: 890 },
        { month: 'Февраль', quantity: 1023 },
        { month: 'Март', quantity: 1156 },
        { month: 'Апрель', quantity: 987 },
        { month: 'Май', quantity: 1234 },
        { month: 'Июнь', quantity: 1098 },
        { month: 'Июль', quantity: 1203 },
        { month: 'Август', quantity: 1045 },
        { month: 'Сентябрь', quantity: 989 },
        { month: 'Октябрь', quantity: 1067 },
        { month: 'Ноябрь', quantity: 876 },
        { month: 'Декабрь', quantity: 890 }
      ]
    },
    mostProfitableModel: {
      model: 'TRACKER-2',
      modification: 'Premier',
      color: 'Black Met. Kettle metallic',
      colorHex: '#000000',
      revenue: 485750000,
      profit: 78500000,
      profitMargin: 16.2,
      trend: 'up',
      trendValue: 8.7,
      image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&h=300&fit=crop',
      // Дополнительные данные
      byModification: [
        { name: 'Premier', profit: 45600000, percentage: 58.1 },
        { name: 'LTZ', profit: 23400000, percentage: 29.8 },
        { name: 'LT', profit: 9500000, percentage: 12.1 }
      ],
      byColor: [
        { name: 'Black', hex: '#000000', profit: 32500000, percentage: 41.4 },
        { name: 'White', hex: '#FFFFFF', profit: 24300000, percentage: 30.9 },
        { name: 'Blue', hex: '#0000FF', profit: 12400000, percentage: 15.8 },
        { name: 'Gray', hex: '#808080', profit: 9300000, percentage: 11.8 }
      ],
      quarterlyBreakdown: [
        { quarter: 'Q1', profit: 16500000, revenue: 98500000 },
        { quarter: 'Q2', profit: 19800000, revenue: 115600000 },
        { quarter: 'Q3', profit: 22300000, revenue: 134700000 },
        { quarter: 'Q4', profit: 19900000, revenue: 136950000 }
      ]
    },
    bestSellingColor: {
      color: 'Summit White',
      colorHex: '#FFFFFF',
      quantity: 24785,
      percentage: 34.2,
      trend: 'up',
      trendValue: 5.8,
      models: [
        { model: 'COBALT', count: 8450, percentage: 34.1 },
        { model: 'ONIX', count: 6320, percentage: 25.5 },
        { model: 'TRACKER-2', count: 5890, percentage: 23.8 },
        { model: 'EQUINOX', count: 4125, percentage: 16.6 }
      ],
      // Сравнение с другими цветами
      colorComparison: [
        { name: 'Summit White', hex: '#FFFFFF', quantity: 24785, percentage: 34.2 },
        { name: 'Black', hex: '#000000', quantity: 18234, percentage: 25.2 },
        { name: 'Silver', hex: '#C0C0C0', quantity: 12456, percentage: 17.2 },
        { name: 'Gray', hex: '#808080', quantity: 8765, percentage: 12.1 },
        { name: 'Blue', hex: '#0000FF', quantity: 4532, percentage: 6.3 },
        { name: 'Red', hex: '#FF0000', quantity: 3678, percentage: 5.1 }
      ],
      yearOverYear: [
        { year: 2022, quantity: 18456, percentage: 31.2 },
        { year: 2023, quantity: 22345, percentage: 33.1 },
        { year: 2024, quantity: 24785, percentage: 34.2 }
      ]
    },
    // Дополнительная аналитика
    allModelsComparison: [
      { model: 'COBALT', sales: 12458, revenue: 186870000, avgPrice: 15000 },
      { model: 'TRACKER-2', sales: 9876, revenue: 296280000, avgPrice: 30000 },
      { model: 'ONIX', sales: 8234, revenue: 115276000, avgPrice: 14000 },
      { model: 'EQUINOX', sales: 6543, revenue: 229005000, avgPrice: 35000 },
      { model: 'TAHOE', sales: 2345, revenue: 117250000, avgPrice: 50000 }
    ]
  });
  
  const [availableYears] = useState([2022, 2023, 2024, 2025]);
  const [availableColors] = useState([
    { value: 'all', label: t('filters.allColors'), hex: null },
    { value: 'Summit White', label: 'Summit White', hex: '#FFFFFF' },
    { value: 'Black Met. Kettle metallic', label: 'Black Met. Kettle metallic', hex: '#000000' },
    { value: 'Satin Steel Gray Met.', label: 'Satin Steel Gray Met.', hex: '#808080' },
    { value: 'Red - E or Not', label: 'Red - E or Not', hex: '#FF0000' },
    { value: 'SOME KINDA BLUE', label: 'SOME KINDA BLUE', hex: '#0000FF' }
  ]);
  
  const [availableModifications] = useState([
    { value: 'all', label: t('filters.allModifications') },
    { value: '2-позиция', label: '2-позиция' },
    { value: 'Premier', label: 'Premier' },
    { value: 'LT', label: 'LT' },
    { value: 'LTZ', label: 'LTZ' }
  ]);
  
  // Состояние для развернутых карточек
  const [expandedCards, setExpandedCards] = useState({
    bestSelling: false,
    mostProfitable: false,
    bestColor: false
  });
  
  // Переключение развернутого состояния
  const toggleExpanded = (cardType) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardType]: !prev[cardType]
    }));
  };
  
  // Форматирование чисел
  const formatNumber = (num) => {
    return new Intl.NumberFormat('ru-RU').format(num);
  };
  
  const formatCurrency = (num) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };
  
  // Компонент карточки отчета
  const ReportCard = ({ title, subtitle, children, icon, gradient, expandable, cardType }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-gradient-to-br ${gradient} p-6 rounded-2xl shadow-xl border border-gray-700/50 ${
        expandable && expandedCards[cardType] ? 'lg:col-span-3' : ''
      }`}
      layout
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
          {subtitle && <p className="text-gray-300 text-sm">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
            {icon}
          </div>
          {expandable && (
            <button
              onClick={() => toggleExpanded(cardType)}
              className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <svg 
                className={`w-5 h-5 text-white transition-transform ${expandedCards[cardType] ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>
      {children}
    </motion.div>
  );
  
  // Компонент мини-графика
  const MiniChart = ({ data, type = 'bar', color = '#3b82f6' }) => (
    <div className="h-20 flex items-end gap-1">
      {data.map((item, index) => (
        <div key={index} className="flex-1 flex flex-col items-center">
          <div 
            className="w-full bg-opacity-80 rounded-t transition-all hover:opacity-100"
            style={{
              height: `${(item.value / Math.max(...data.map(d => d.value))) * 100}%`,
              backgroundColor: color,
              minHeight: '4px'
            }}
          />
          <span className="text-xs text-gray-400 mt-1">{item.label}</span>
        </div>
      ))}
    </div>
  );
  
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Шапка с градиентом */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
        
        <div className="relative z-10 p-6 md:p-8">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold mb-2"
          >
            {t('title')}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-300 text-lg"
          >
            {t('subtitle', { year: selectedYear })}
          </motion.p>
        </div>
      </div>
      
      {/* Фильтры */}
      <div className="p-6 md:p-8">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Выбор года */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('filters.year')}
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            {/* Выбор модификации */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('filters.modification')}
              </label>
              <select
                value={filters.modification}
                onChange={(e) => setFilters({ ...filters, modification: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableModifications.map(mod => (
                  <option key={mod.value} value={mod.value}>{mod.label}</option>
                ))}
              </select>
            </div>
            
            {/* Выбор цвета */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('filters.color')}
              </label>
              <div className="relative">
                <select
                  value={filters.color}
                  onChange={(e) => setFilters({ ...filters, color: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-10"
                >
                  {availableColors.map(color => (
                    <option key={color.value} value={color.value}>
                      {color.label}
                    </option>
                  ))}
                </select>
                {filters.color !== 'all' && (
                  <div 
                    className="absolute right-8 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full border-2 border-gray-600"
                    style={{ 
                      backgroundColor: availableColors.find(c => c.value === filters.color)?.hex 
                    }}
                  />
                )}
              </div>
            </div>
            
            {/* Кнопка сброса фильтров */}
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ modification: 'all', color: 'all', period: 'year' })}
                className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-white transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t('filters.reset')}
              </button>
            </div>
          </div>
        </div>
        
        {/* Основные отчеты */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Самая продаваемая модель */}
          <ReportCard
            title={t('reports.bestSelling.title')}
            subtitle={t('reports.bestSelling.subtitle', { year: selectedYear })}
            gradient="from-blue-600/20 to-blue-800/20"
            expandable={true}
            cardType="bestSelling"
            icon={
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          >
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <img 
                  src={reportData.bestSellingModel.image} 
                  alt={reportData.bestSellingModel.model}
                  className="w-24 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="text-2xl font-bold text-white">
                    {reportData.bestSellingModel.model}
                  </h4>
                  <p className="text-gray-300">
                    {reportData.bestSellingModel.modification}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">{t('reports.color')}:</span>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-gray-600"
                      style={{ backgroundColor: reportData.bestSellingModel.colorHex }}
                    />
                    <span className="text-white">{reportData.bestSellingModel.color}</span>
                  </div>
                </div>
                
                <div className="bg-gray-800/50 p-4 rounded-xl">
                  <div className="text-3xl font-bold text-white mb-1">
                    {formatNumber(reportData.bestSellingModel.quantity)} {t('units')}
                  </div>
                  <div className="text-sm text-gray-400">
                    {reportData.bestSellingModel.percentage}% {t('reports.marketShare')}
                  </div>
                  <div className="text-green-400 text-sm mt-2 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    +{reportData.bestSellingModel.trendValue}% {t('reports.vsLastYear')}
                  </div>
                </div>
              </div>
              
              {/* Расширенный контент */}
              <AnimatePresence>
                {expandedCards.bestSelling && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-6 space-y-6"
                  >
                    {/* Разбивка по модификациям */}
                    <div>
                      <h5 className="text-lg font-semibold text-white mb-3">{t('analytics.byModification')}</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {reportData.bestSellingModel.byModification.map((mod, index) => (
                          <div key={index} className="bg-gray-800/30 p-4 rounded-lg">
                            <p className="text-white font-medium">{mod.name}</p>
                            <p className="text-2xl font-bold text-blue-400">{formatNumber(mod.quantity)}</p>
                            <p className="text-sm text-gray-400">{mod.percentage}%</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Разбивка по цветам */}
                    <div>
                      <h5 className="text-lg font-semibold text-white mb-3">{t('analytics.byColor')}</h5>
                      <div className="space-y-2">
                        {reportData.bestSellingModel.byColor.map((color, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-8 h-8 rounded-full border-2 border-gray-600"
                                style={{ backgroundColor: color.hex }}
                              />
                              <span className="text-white">{color.name}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-white font-medium">{formatNumber(color.quantity)}</p>
                              <p className="text-sm text-gray-400">{color.percentage}%</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-300">
                  {t('reports.bestSelling.result', {
                    year: selectedYear,
                    model: reportData.bestSellingModel.model,
                    modification: reportData.bestSellingModel.modification,
                    color: reportData.bestSellingModel.color,
                    quantity: formatNumber(reportData.bestSellingModel.quantity)
                  })}
                </p>
              </div>
            </div>
          </ReportCard>
          
          {/* Самая прибыльная модель */}
          <ReportCard
            title={t('reports.mostProfitable.title')}
            subtitle={t('reports.mostProfitable.subtitle', { year: selectedYear })}
            gradient="from-green-600/20 to-green-800/20"
            expandable={true}
            cardType="mostProfitable"
            icon={
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          >
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <img 
                  src={reportData.mostProfitableModel.image} 
                  alt={reportData.mostProfitableModel.model}
                  className="w-24 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="text-2xl font-bold text-white">
                    {reportData.mostProfitableModel.model}
                  </h4>
                  <p className="text-gray-300">
                    {reportData.mostProfitableModel.modification}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">{t('reports.color')}:</span>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-gray-600"
                      style={{ backgroundColor: reportData.mostProfitableModel.colorHex }}
                    />
                    <span className="text-white">{reportData.mostProfitableModel.color}</span>
                  </div>
                </div>
                
                <div className="bg-gray-800/50 p-4 rounded-xl">
                  <div className="text-3xl font-bold text-white mb-1">
                    {formatCurrency(reportData.mostProfitableModel.profit)}
                  </div>
                  <div className="text-sm text-gray-400">
                    {t('reports.profitMargin')}: {reportData.mostProfitableModel.profitMargin}%
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    {t('reports.revenue')}: {formatCurrency(reportData.mostProfitableModel.revenue)}
                  </div>
                  <div className="text-green-400 text-sm mt-2 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    +{reportData.mostProfitableModel.trendValue}% {t('reports.vsLastYear')}
                  </div>
                </div>
              </div>
              
              {/* Расширенный контент */}
              <AnimatePresence>
                {expandedCards.mostProfitable && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-6 space-y-6"
                  >
                    {/* Разбивка по модификациям */}
                    <div>
                      <h5 className="text-lg font-semibold text-white mb-3">{t('analytics.profitByModification')}</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {reportData.mostProfitableModel.byModification.map((mod, index) => (
                          <div key={index} className="bg-gray-800/30 p-4 rounded-lg">
                            <p className="text-white font-medium">{mod.name}</p>
                            <p className="text-2xl font-bold text-green-400">{formatCurrency(mod.profit)}</p>
                            <p className="text-sm text-gray-400">{mod.percentage}%</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Разбивка по цветам */}
                    <div>
                      <h5 className="text-lg font-semibold text-white mb-3">{t('analytics.profitByColor')}</h5>
                      <div className="space-y-2">
                        {reportData.mostProfitableModel.byColor.map((color, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-8 h-8 rounded-full border-2 border-gray-600"
                                style={{ backgroundColor: color.hex }}
                              />
                              <span className="text-white">{color.name}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-white font-medium">{formatCurrency(color.profit)}</p>
                              <p className="text-sm text-gray-400">{color.percentage}%</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
]                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm text-green-300">
                  {t('reports.mostProfitable.result', {
                    year: selectedYear,
                    model: reportData.mostProfitableModel.model,
                    modification: reportData.mostProfitableModel.modification,
                    color: reportData.mostProfitableModel.color,
                    amount: formatCurrency(reportData.mostProfitableModel.profit)
                  })}
                </p>
              </div>
            </div>
          </ReportCard>
          
          {/* Самый популярный цвет */}
          <ReportCard
            title={t('reports.bestSellingColor.title')}
            subtitle={t('reports.bestSellingColor.subtitle', { year: selectedYear })}
            gradient="from-purple-600/20 to-purple-800/20"
            expandable={true}
            cardType="bestColor"
            icon={
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            }
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-16 h-16 rounded-xl border-2 border-gray-600 shadow-lg"
                    style={{ backgroundColor: reportData.bestSellingColor.colorHex }}
                  />
                  <div>
                    <h4 className="text-2xl font-bold text-white">
                      {reportData.bestSellingColor.color}
                    </h4>
                    <p className="text-gray-400">
                      {reportData.bestSellingColor.percentage}% {t('reports.allSales')}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800/50 p-4 rounded-xl mb-4">
                <div className="text-3xl font-bold text-white mb-1">
                  {formatNumber(reportData.bestSellingColor.quantity)} {t('units')}
                </div>
                <div className="text-sm text-gray-400">
                  {t('reports.acrossAllModels')}
                </div>
                <div className="text-green-400 text-sm mt-2 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  +{reportData.bestSellingColor.trendValue}% {t('reports.vsLastYear')}
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-400 mb-2">{t('reports.byModel')}:</p>
                {reportData.bestSellingColor.models.slice(0, 4).map((model, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-800/30 rounded-lg">
                    <span className="text-white">{model.model}</span>
                    <div className="text-right">
                      <span className="text-gray-300">{formatNumber(model.count)} {t('units')}</span>
                      <span className="text-gray-500 text-sm ml-2">({model.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Расширенный контент */}
              <AnimatePresence>
                {expandedCards.bestColor && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-6 space-y-6"
                  >
                    {/* Сравнение всех цветов */}
                    <div>
                      <h5 className="text-lg font-semibold text-white mb-3">{t('analytics.colorComparison')}</h5>
                      <div className="space-y-2">
                        {reportData.bestSellingColor.colorComparison.map((color, index) => (
                          <div key={index} className="relative">
                            <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className={`text-lg font-bold ${index === 0 ? 'text-yellow-400' : 'text-gray-400'}`}>
                                  #{index + 1}
                                </div>
                                <div 
                                  className="w-8 h-8 rounded-full border-2 border-gray-600"
                                  style={{ backgroundColor: color.hex }}
                                />
                                <span className="text-white">{color.name}</span>
                              </div>
                              <div className="text-right">
                                <p className="text-white font-medium">{formatNumber(color.quantity)}</p>
                                <p className="text-sm text-gray-400">{color.percentage}%</p>
                              </div>
                            </div>
                            <div className="absolute bottom-0 left-0 h-1 bg-purple-500 rounded-b-lg transition-all"
                              style={{ width: `${color.percentage}%` }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <p className="text-sm text-purple-300">
                  {t('reports.bestSellingColor.result', {
                    year: selectedYear,
                    color: reportData.bestSellingColor.color,
                    quantity: formatNumber(reportData.bestSellingColor.quantity)
                  })}
                </p>
              </div>
            </div>
          </ReportCard>
        </div>
        
        {/* Сравнительная таблица всех моделей */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4">{t('analytics.allModelsComparison')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-700">
                  <th className="pb-3 pr-4">{t('table.model')}</th>
                  <th className="pb-3 pr-4 text-right">{t('table.sales')}</th>
                  <th className="pb-3 pr-4 text-right">{t('table.revenue')}</th>
                  <th className="pb-3 text-center">{t('table.performance')}</th>
                </tr>
              </thead>
              <tbody>
                {reportData.allModelsComparison.map((model, index) => (
                  <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                    <td className="py-3 pr-4">
                      <span className="text-white font-medium">{model.model}</span>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <span className="text-gray-300">{formatNumber(model.sales)}</span>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <span className="text-gray-300">{formatCurrency(model.revenue)}</span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-24 bg-gray-700 rounded-full h-2">
                          <div 
                            className="h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                            style={{ width: `${(model.sales / Math.max(...reportData.allModelsComparison.map(m => m.sales))) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">
                          {Math.round((model.sales / Math.max(...reportData.allModelsComparison.map(m => m.sales))) * 100)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsReports;