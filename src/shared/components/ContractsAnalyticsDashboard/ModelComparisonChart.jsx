import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatNumber } from './utils/formatters';

const ModelComparisonChart = ({ modelPerformance, carModels, selectedPeriod, getPeriodLabel }) => {
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
        Сравнительный анализ моделей {getPeriodLabel(selectedPeriod).toLowerCase()}
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

export default ModelComparisonChart;