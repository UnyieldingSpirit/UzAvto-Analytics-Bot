import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatNumber } from './utils/formatters';

const ModelComparisonChart = ({ modelPerformance, carModels, selectedPeriod, getPeriodLabel, startDate, endDate }) => {
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
      <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/60 shadow-lg hover:shadow-xl transition-all duration-300 mb-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <span className="text-2xl mr-2">📊</span> 
          Сравнительный анализ моделей {getPeriodLabel(selectedPeriod).toLowerCase()}
        </h3>
        
        <div className="w-full h-72 flex items-center justify-center">
          <p className="text-gray-400">
            Нет данных для сравнения моделей за выбранный период: 
            {new Date(startDate).toLocaleDateString('ru-RU')} - {new Date(endDate).toLocaleDateString('ru-RU')}
          </p>
        </div>
      </div>
    );
  }
  
  // Форматирование периода для отображения
  const getFormattedPeriod = () => {
    const formattedStart = new Date(startDate).toLocaleDateString('ru-RU');
    const formattedEnd = new Date(endDate).toLocaleDateString('ru-RU');
    return `(${formattedStart} - ${formattedEnd})`;
  };
  
  return (
    <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/60 shadow-lg hover:shadow-xl transition-all duration-300 mb-6">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
        <span className="text-2xl mr-2">📊</span> 
        Сравнительный анализ моделей {getPeriodLabel(selectedPeriod).toLowerCase()} {getFormattedPeriod()}
      </h3>
      
      <div className="w-full h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={comparisonData}
            margin={{ top: 5, right: 30, left: 20, bottom: 80 }}
            barGap={4}
            barCategoryGap={16}
          >
            <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
            <XAxis 
              dataKey="shortName" 
              stroke="#9ca3af"
              tick={{ fill: '#e5e7eb', fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis 
              stroke="#9ca3af" 
              tickFormatter={formatNumber}
            />
            <Tooltip 
              formatter={(value, name) => {
                const labels = {
                  contracts: "Контракты",
                  realization: "Реализация",
                  cancellation: "Отмена"
                };
                return [formatNumber(value), labels[name] || name];
              }}
              labelFormatter={(value, entry) => {
                // Найти полное название в данных
                const fullName = entry[0]?.payload?.name || value;
                return fullName;
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
                  cancellation: "Отмена"
                };
                return <span style={{color: '#d1d5db', fontSize: '0.9rem'}}>{labels[value]}</span>
              }}
              wrapperStyle={{ bottom: 0 }}
            />
            <Bar 
              dataKey="contracts" 
              fill="#4f46e5" 
              radius={[4, 4, 0, 0]}
              animationDuration={800}
            />
            <Bar 
              dataKey="realization" 
              fill="#10b981" 
              radius={[4, 4, 0, 0]}
              animationDuration={800}
              animationBegin={100}
            />
            <Bar 
              dataKey="cancellation" 
              fill="#ef4444" 
              radius={[4, 4, 0, 0]}
              animationDuration={800}
              animationBegin={200}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ModelComparisonChart;