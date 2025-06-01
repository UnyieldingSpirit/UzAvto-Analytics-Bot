// src/shared/components/ContractsAnalyticsDashboard/ModelComparisonChart.jsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatNumber } from './utils/formatters';

const ModelComparisonChart = ({ t, currentLocale, isDark, modelPerformance, carModels, selectedPeriod, getPeriodLabel, startDate, endDate }) => {
  if (Object.keys(modelPerformance).length === 0) return null;
  
  // Подготовка данных для сравнительного графика с учетом выбранного периода
  const prepareComparisonData = () => {
    // Фильтруем модели, для которых есть данные
    const modelsWithData = carModels.filter(model => 
      modelPerformance[model.id] && (
        modelPerformance[model.id].contracts > 0 || 
        modelPerformance[model.id].realization > 0 || 
        modelPerformance[model.id].cancellation > 0
      )
    );
    
    // Если моделей больше 8, оставляем только топ-8 по количеству контрактов
    let modelsToShow = modelsWithData;
    if (modelsWithData.length > 8) {
      modelsToShow = modelsWithData.sort((a, b) => {
        const aContracts = modelPerformance[a.id]?.contracts || 0;
        const bContracts = modelPerformance[b.id]?.contracts || 0;
        return bContracts - aContracts; // Сортировка по убыванию
      }).slice(0, 8);
    }
    
    // Создаем данные для графика
    const comparisonData = modelsToShow.map(model => {
      const perfData = modelPerformance[model.id] || {};
      return {
        name: model.name,
        shortName: model.name.length > 12 ? model.name.substring(0, 10) + '...' : model.name,
        contracts: perfData.contracts || 0,
        realization: perfData.realization || 0,
        cancellation: perfData.cancellation || 0,
        conversion: perfData.conversion || 0
      };
    });
    
    console.log("Данные для графика сравнения моделей:", comparisonData);
    
    return comparisonData;
  };
  
  // Подготовленные данные для графика
  const comparisonData = prepareComparisonData();
  
  // Если нет данных после фильтрации, показываем сообщение
  if (comparisonData.length === 0) {
    return (
      <div className={`${isDark ? 'bg-gray-800/80' : 'bg-white'} backdrop-blur-sm rounded-xl p-4 md:p-6 border ${isDark ? 'border-gray-700/60' : 'border-gray-200'} shadow-lg hover:shadow-xl transition-all duration-300 mb-4 md:mb-6`}>
        <h3 className={`text-lg md:text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-3 md:mb-4 flex items-center`}>
          <span className="text-xl md:text-2xl mr-2">📊</span> 
          {t('charts.comparison.title', {
            period: t(`period.${selectedPeriod}`),
            date: ''
          })}
        </h3>
        
        <div className="w-full h-60 md:h-72 flex items-center justify-center">
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm md:text-base text-center`}>
            {t('charts.noDataPeriod', { 
              startDate: new Date(startDate).toLocaleDateString(currentLocale === 'uz' ? 'uz-UZ' : 'ru-RU'), 
              endDate: new Date(endDate).toLocaleDateString(currentLocale === 'uz' ? 'uz-UZ' : 'ru-RU') 
            })}
          </p>
        </div>
      </div>
    );
  }
  
  // Форматирование периода для отображения
  const getFormattedPeriod = () => {
    const formattedStart = new Date(startDate).toLocaleDateString(currentLocale === 'uz' ? 'uz-UZ' : 'ru-RU');
    const formattedEnd = new Date(endDate).toLocaleDateString(currentLocale === 'uz' ? 'uz-UZ' : 'ru-RU');
    return `(${formattedStart} - ${formattedEnd})`;
  };

  // Метки для легенды
  const legendLabels = {
    contracts: t('stats.contracts'),
    realization: t('stats.realization'),
    cancellation: t('stats.cancellation')
  };

  // Кастомный тултип
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-3 rounded-lg shadow-lg border`}>
          <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {legendLabels[entry.dataKey]}: <span className="font-semibold" style={{ color: entry.color }}>{formatNumber(entry.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className={`${isDark ? 'bg-gray-800/80' : 'bg-white'} backdrop-blur-sm rounded-xl p-4 md:p-6 border ${isDark ? 'border-gray-700/60' : 'border-gray-200'} shadow-lg hover:shadow-xl transition-all duration-300 mb-4 md:mb-6`}>
      <h3 className={`text-lg md:text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-3 md:mb-4 flex items-center`}>
        <span className="text-xl md:text-2xl mr-2">📊</span> 
        {t('charts.comparison.title', {
          period: t(`period.${selectedPeriod}`),
          date: getFormattedPeriod()
        })}
      </h3>
      
      <div className="w-full h-[400px] md:h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={comparisonData}
            margin={{ top: 5, right: 20, left: 5, bottom: 80 }}
            barGap={4}
            barCategoryGap={16}
          >
            <CartesianGrid stroke={isDark ? "#374151" : "#e5e7eb"} strokeDasharray="3 3" />
            <XAxis 
              dataKey="shortName" 
              stroke={isDark ? "#9ca3af" : "#4b5563"}
              tick={{ fill: isDark ? '#e5e7eb' : '#374151', fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis 
              stroke={isDark ? "#9ca3af" : "#4b5563"}
              tickFormatter={formatNumber}
              width={45}
              tick={{ fontSize: 10, fill: isDark ? '#d1d5db' : '#374151' }}
            />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ fill: isDark ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.5)' }}
            />
            <Legend 
              formatter={(value) => {
                return <span style={{color: isDark ? '#d1d5db' : '#374151', fontSize: '0.85rem'}}>{legendLabels[value]}</span>
              }}
              wrapperStyle={{ bottom: 0 }}
            />
            <Bar 
              dataKey="contracts" 
              fill="#4f46e5" 
              radius={[4, 4, 0, 0]}
              animationDuration={800}
              maxBarSize={50}
            />
            <Bar 
              dataKey="realization" 
              fill="#10b981" 
              radius={[4, 4, 0, 0]}
              animationDuration={800}
              animationBegin={100}
              maxBarSize={50}
            />
            <Bar 
              dataKey="cancellation" 
              fill="#ef4444" 
              radius={[4, 4, 0, 0]}
              animationDuration={800}
              animationBegin={200}
              maxBarSize={50}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ModelComparisonChart;