// src/shared/components/analytics/DashboardAnalytics.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, RefreshCcw, ArrowRight, MapPin, Car, 
  LineChart, BarChart3, Calendar 
} from 'lucide-react';

const DashboardAnalytics = ({ selectedModel = null }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsTab, setAnalyticsTab] = useState('regions'); // 'regions', 'models', 'yearly'
  const [yearTab, setYearTab] = useState('2025'); // '2023', '2024', '2025'
  const [analyticsData, setAnalyticsData] = useState({
    regions: [],
    models: [],
    yearly: {
      '2023': [],
      '2024': [],
      '2025': []
    }
  });
  const [period, setPeriod] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
  // Флаг для предотвращения повторных запросов
  const dataLoaded = useRef(false);
  
  // Список месяцев для графиков
  const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

  // Форматирование денежных значений
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ru-RU').format(value) + ' сум';
  };

  // Форматирование даты для API
  const formatDateForAPI = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric'
    }).replace(/\./g, '.');
  };

  // Обработка данных регионов
  const processRegionsData = (data) => {
    if (!data || !data.filter_by_region) return [];
    
    return data.filter_by_region
      .filter(region => region.region_id)
      .map(region => ({
        name: region.region_name || "Регион не указан",
        contracts: parseInt(region.total_contracts || 0),
        totalAmount: parseInt(region.total_price || 0)
      }))
      .filter(region => region.contracts > 0 || region.totalAmount > 0)
      .sort((a, b) => b.contracts - a.contracts);
  };
  
  // Обработка данных моделей
  const processModelsData = (data) => {
    if (!data || !data.filter_by_modification) return [];
    
    return data.filter_by_modification
      .filter(model => model.modification_id)
      .map(model => ({
        id: model.modification_id,
        name: model.modification_name || "Модель не указана",
        contracts: parseInt(model.total_contracts || 0),
        totalAmount: parseInt(model.total_price || 0),
        img: model.photo_sha ? `https://uzavtosalon.uz/b/core/m$load_image?sha=${model.photo_sha}&width=400&height=400` : null
      }))
      .filter(model => model.contracts > 0 || model.totalAmount > 0)
      .sort((a, b) => b.contracts - a.contracts);
  };
  
  // Обработка годовых данных
  const processYearlyData = (data, year) => {
    if (!data || !data.filter_by_month) return [];
    
    const currentMonth = new Date().getMonth() + 1;
    const monthlyData = [];
    
    // Создаем массив с данными для всех месяцев
    for (let i = 1; i <= 12; i++) {
      const monthStr = `${year}-${i.toString().padStart(2, '0')}`;
      
      // Если месяц еще не наступил, добавляем пустые данные
      if (i > currentMonth && year === new Date().getFullYear()) {
        monthlyData.push({
          month: monthStr,
          contracts: 0,
          totalAmount: 0
        });
        continue;
      }
      
      // Находим данные месяца в ответе API
      const monthData = data.filter_by_month.find(item => item.month === monthStr);
      
      // Если данные найдены, обрабатываем их
      if (monthData && monthData.regions) {
        const contracts = monthData.regions.reduce((sum, region) => sum + parseInt(region.contract || 0), 0);
        const totalAmount = monthData.regions.reduce((sum, region) => sum + parseInt(region.total_price || 0), 0);
        
        monthlyData.push({
          month: monthStr,
          contracts,
          totalAmount
        });
      } else {
        // Если данных нет, добавляем пустые
        monthlyData.push({
          month: monthStr,
          contracts: 0,
          totalAmount: 0
        });
      }
    }
    
    return monthlyData;
  };

  // Запрос аналитических данных за указанный период
  const fetchAnalyticsByPeriod = async (periodToUse) => {
    setLoading(true);
    try {
      const startDate = formatDateForAPI(periodToUse.start);
      const endDate = formatDateForAPI(periodToUse.end);
      
      console.log(`Загрузка аналитики за период: ${startDate} - ${endDate}`);
      
      // Добавляем параметр модели к запросу, если она выбрана
      const modelParam = selectedModel ? `&model_id=${selectedModel}` : '';
      
      const response = await fetch(`https://uzavtosalon.uz/b/dashboard/infos&auto_analytics${modelParam}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          begin_date: startDate,
          end_date: endDate
        })
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка загрузки данных: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Обработка данных
      const regionsData = processRegionsData(data);
      const modelsData = processModelsData(data);
      
      // Обновляем только данные регионов и моделей, не трогая годовые
      setAnalyticsData(prevData => ({
        ...prevData,
        regions: regionsData,
        models: modelsData
      }));
      
      console.log('Данные за период успешно обновлены');
    } catch (error) {
      console.error('Ошибка загрузки данных за период:', error);
      setError(`Ошибка загрузки данных: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка годовых данных
  const fetchYearlyData = async (year) => {
    try {
      const startOfYear = `01.01.${year}`;
      const endOfYear = `31.12.${year}`;
      
      console.log(`Загрузка аналитики за год: ${startOfYear} - ${endOfYear}`);
      
      // Добавляем параметр модели к запросу, если она выбрана
      const modelParam = selectedModel ? `&model_id=${selectedModel}` : '';
      
      const response = await fetch(`https://uzavtosalon.uz/b/dashboard/infos&auto_analytics${modelParam}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          begin_date: startOfYear,
          end_date: endOfYear
        })
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка загрузки данных: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Обработка годовых данных
      const yearlyData = processYearlyData(data, year);
      
      // Обновляем только годовые данные для выбранного года
      setAnalyticsData(prevData => ({
        ...prevData,
        yearly: {
          ...prevData.yearly,
          [year]: yearlyData
        }
      }));
      
      console.log(`Данные за ${year} год успешно обновлены`);
    } catch (error) {
      console.error(`Ошибка загрузки данных за ${year} год:`, error);
    }
  };
  
  // Функция для обновления всех данных
  const refreshAllData = async () => {
    setLoading(true);
    try {
      // Обновляем данные за выбранный период
      await fetchAnalyticsByPeriod(period);
      
      // Если выбрана вкладка годовой статистики, обновляем данные за выбранный год
      if (analyticsTab === 'yearly') {
        await fetchYearlyData(parseInt(yearTab));
      }
    } catch (error) {
      console.error('Ошибка при обновлении данных:', error);
      setError(`Ошибка обновления данных: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Обработчик изменения периода
  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    fetchAnalyticsByPeriod(newPeriod);
  };

  // Обработчик переключения вкладок аналитики
  const handleAnalyticsTabChange = (tab) => {
    setAnalyticsTab(tab);
    
    // Если переключаемся на годовую вкладку и нет данных для выбранного года - загрузим их
    if (tab === 'yearly' && analyticsData.yearly[yearTab].length === 0) {
      fetchYearlyData(parseInt(yearTab));
    }
  };

  // Обработчик переключения вкладок годов
  const handleYearTabChange = (year) => {
    setYearTab(year);
    
    // Если нет данных для выбранного года - загрузим их
    if (analyticsData.yearly[year].length === 0) {
      fetchYearlyData(parseInt(year));
    }
  };

  // Загрузка данных при первом рендере
  useEffect(() => {
    // Проверяем, загружены ли уже данные
    if (dataLoaded.current) {
      return;
    }
    
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Загружаем данные за выбранный период
        await fetchAnalyticsByPeriod(period);
        
        // Загружаем годовые данные для текущего года
        const currentYear = new Date().getFullYear();
        await fetchYearlyData(currentYear);
        
        // Отмечаем, что данные загружены
        dataLoaded.current = true;
      } catch (error) {
        console.error('Ошибка загрузки начальных данных:', error);
        setError(`Ошибка загрузки данных: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [selectedModel]); // Повторно загружаем данные при изменении выбранной модели
  
  // Компонент выбора периода
  const PeriodSelector = () => {
    // Локальное состояние для временного хранения значений периода
    const [localPeriod, setLocalPeriod] = useState({...period});
    
    // Обработчик изменения начальной даты
    const handleStartDateChange = (e) => {
      setLocalPeriod({...localPeriod, start: e.target.value});
    };
    
    // Обработчик изменения конечной даты
    const handleEndDateChange = (e) => {
      setLocalPeriod({...localPeriod, end: e.target.value});
    };
    
    // Применение выбранного периода
    const applyPeriod = () => {
      // Проверяем, что конечная дата не раньше начальной
      if (new Date(localPeriod.end) < new Date(localPeriod.start)) {
        alert('Дата окончания не может быть раньше даты начала');
        return;
      }
      
      // Проверяем, что период не слишком велик (например, не более 1 года)
      const startDate = new Date(localPeriod.start);
      const endDate = new Date(localPeriod.end);
      const diffTime = Math.abs(endDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays > 366) {
        alert('Период не может быть больше 1 года. Пожалуйста, выберите меньший период.');
        return;
      }
      
      // Применяем период и запускаем загрузку данных
      handlePeriodChange(localPeriod);
    };
    
    // Предустановленные периоды
    const presetPeriods = [
      { name: 'Сегодня', period: { 
        start: new Date().toISOString().split('T')[0], 
        end: new Date().toISOString().split('T')[0] 
      }},
      { name: 'Неделя', period: { 
        start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0], 
        end: new Date().toISOString().split('T')[0] 
      }},
      { name: 'Месяц', period: { 
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], 
        end: new Date().toISOString().split('T')[0] 
      }},
      { name: 'Квартал', period: { 
        start: new Date(new Date().setDate(new Date().getDate() - 90)).toISOString().split('T')[0], 
        end: new Date().toISOString().split('T')[0] 
      }}
    ];
    
    return (
      <div className="flex items-center gap-3">
        {/* Предустановленные периоды */}
        <div className="flex border border-gray-700 rounded-md overflow-hidden bg-gray-800">
          {presetPeriods.map((preset, index) => (
            <button 
              key={index}
              className={`px-3 py-1.5 text-sm ${
                period.start === preset.period.start && period.end === preset.period.end 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:bg-gray-700'
              }`}
              onClick={() => handlePeriodChange(preset.period)}
            >
              {preset.name}
            </button>
          ))}
        </div>
        
        {/* Выбор произвольного периода */}
        <div className="flex gap-2 items-center">
          <input 
            type="date" 
            value={localPeriod.start} 
            onChange={handleStartDateChange}
            className="bg-gray-800 text-gray-300 border border-gray-700 rounded-md px-2 py-1.5 text-sm w-36"
          />
          <ArrowRight size={14} className="text-gray-500" />
          <input 
            type="date" 
            value={localPeriod.end} 
            onChange={handleEndDateChange}
            className="bg-gray-800 text-gray-300 border border-gray-700 rounded-md px-2 py-1.5 text-sm w-36"
          />
          <button 
            onClick={applyPeriod}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm flex items-center"
          >
            Применить
          </button>
        </div>
      </div>
    );
  };

  // Компонент графика по регионам
  const RegionsChart = () => {
    const data = analyticsData.regions.slice(0, 10);
    
    if (data.length === 0) {
      return (
        <div className="p-4 text-center">
          <div className="bg-gray-800/70 rounded-lg p-8 border border-gray-700/60">
            <AlertTriangle size={32} className="text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Нет данных для отображения</h3>
            <p className="text-gray-400">Данные по регионам отсутствуют за выбранный период. Попробуйте изменить период или обновить данные.</p>
          </div>
        </div>
      );
    }
    
    const maxContracts = Math.max(...data.map(item => item.contracts), 1);
    const maxAmount = Math.max(...data.map(item => item.totalAmount), 1);
    
    return (
      <div className="p-4">
        <h3 className="text-base font-medium text-white mb-4">Контракты по регионам за выбранный период</h3>
        
        <div className="grid grid-cols-1 gap-8">
          {/* График контрактов */}
          <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/60">
            <div className="flex justify-between text-sm text-gray-400 mb-3">
              <span>Регион</span>
              <span>Количество контрактов</span>
            </div>
            
            <div className="space-y-3">
              {data.map((region, index) => (
                <div key={index} className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-300 truncate max-w-[70%]">{region.name}</span>
                    <span className="text-white font-semibold">{region.contracts}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${(region.contracts / maxContracts) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 w-14 text-right">{Math.round((region.contracts / maxContracts) * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* График суммы */}
          <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/60">
            <div className="flex justify-between text-sm text-gray-400 mb-3">
              <span>Регион</span>
              <span>Сумма контрактов</span>
            </div>
            
            <div className="space-y-3">
              {data.map((region, index) => (
                <div key={index} className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-300 truncate max-w-[70%]">{region.name}</span>
                    <span className="text-white font-semibold">{formatCurrency(region.totalAmount)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-green-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${(region.totalAmount / maxAmount) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 w-14 text-right">{Math.round((region.totalAmount / maxAmount) * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Компонент графика по моделям
  const ModelsChart = () => {
    const data = analyticsData.models.slice(0, 10);
    
    if (data.length === 0) {
      return (
        <div className="p-4 text-center">
          <div className="bg-gray-800/70 rounded-lg p-8 border border-gray-700/60">
            <AlertTriangle size={32} className="text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Нет данных для отображения</h3>
            <p className="text-gray-400">Данные по моделям отсутствуют за выбранный период. Попробуйте изменить период или обновить данные.</p>
          </div>
        </div>
      );
    }
    
    const maxContracts = Math.max(...data.map(item => item.contracts), 1);
    const maxAmount = Math.max(...data.map(item => item.totalAmount), 1);
    
    return (
      <div className="p-4">
        <h3 className="text-base font-medium text-white mb-4">Контракты по моделям за выбранный период</h3>
        
        <div className="grid grid-cols-1 gap-8">
          {/* График контрактов */}
          <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/60">
            <div className="flex justify-between text-sm text-gray-400 mb-3">
              <span>Модель</span>
              <span>Количество контрактов</span>
            </div>
            
            <div className="space-y-4">
              {data.map((model, index) => (
                <div key={index} className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 max-w-[70%]">
                      {model.img && (
                        <div className="w-8 h-8 rounded overflow-hidden bg-gray-700 flex-shrink-0">
                          <img 
                            src={model.img} 
                            alt={model.name} 
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '';
                            }}
                          />
                        </div>
                      )}
                      <span className="text-gray-300 truncate">{model.name}</span>
                    </div>
                    <span className="text-white font-semibold">{model.contracts}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${(model.contracts / maxContracts) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 w-14 text-right">{Math.round((model.contracts / maxContracts) * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* График суммы */}
          <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/60">
            <div className="flex justify-between text-sm text-gray-400 mb-3">
              <span>Модель</span>
              <span>Сумма контрактов</span>
            </div>
            
            <div className="space-y-4">
              {data.map((model, index) => (
                <div key={index} className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 max-w-[70%]">
                      {model.img && (
                        <div className="w-8 h-8 rounded overflow-hidden bg-gray-700 flex-shrink-0">
                          <img 
                            src={model.img} 
                            alt={model.name} 
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '';
                            }}
                          />
                        </div>
                      )}
                      <span className="text-gray-300 truncate">{model.name}</span>
                    </div>
                    <span className="text-white font-semibold">{formatCurrency(model.totalAmount)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-green-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${(model.totalAmount / maxAmount) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 w-14 text-right">{Math.round((model.totalAmount / maxAmount) * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Компонент графика по годам
  const YearlyChart = () => {
    const data = analyticsData.yearly[yearTab];
    
    // Если данных нет, показываем заглушку
    if (!data || data.length === 0) {
      return (
        <div className="p-4 text-center">
          <div className="bg-gray-800/70 rounded-lg p-8 border border-gray-700/60">
            <AlertTriangle size={32} className="text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Нет данных для отображения</h3>
            <p className="text-gray-400">Данные за {yearTab} год отсутствуют или еще не загружены.</p>
          </div>
        </div>
      );
    }
    
    // Создаем полный массив месяцев для отображения (даже если данных нет)
    const monthlyData = months.map((month, index) => {
      const monthNum = index + 1;
      const monthStr = `${yearTab}-${String(monthNum).padStart(2, '0')}`;
      const monthData = data.find(item => item.month === monthStr);
      
      return {
        month,
        index: monthNum,
        contracts: monthData ? monthData.contracts : 0,
        totalAmount: monthData ? monthData.totalAmount : 0
      };
    });
    
    const maxContracts = Math.max(...monthlyData.map(item => item.contracts), 1);
    const totalContracts = monthlyData.reduce((sum, item) => sum + item.contracts, 0);
    const totalAmount = monthlyData.reduce((sum, item) => sum + item.totalAmount, 0);
    
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-medium text-white">Динамика контрактов за {yearTab} год</h3>
          <div className="text-sm text-gray-400">
            <span className="text-gray-300 font-medium">{totalContracts}</span> контрактов на 
            <span className="text-gray-300 font-medium ml-1">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-8">
          {/* График контрактов по месяцам */}
          <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/60">
            <div className="flex justify-between text-sm text-gray-400 mb-4">
              <span>Месяц</span>
              <span>Количество контрактов</span>
            </div>
            
            <div className="grid grid-cols-12 gap-2 h-48 mb-2">
              {monthlyData.map((item, index) => (
                <div 
                  key={index} 
                  className="flex flex-col justify-end items-center"
                >
                  <div className="text-xs text-gray-400 mb-1">{item.contracts}</div>
                  <div 
                    className="w-full bg-blue-500 rounded-t-md hover:bg-blue-400 transition-all duration-300 group relative"
                    style={{ 
                      height: `${maxContracts ? (item.contracts / maxContracts) * 100 : 0}%`,
                      minHeight: item.contracts > 0 ? '4px' : '0'
                    }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap transition-opacity z-10">
                      {item.contracts} контрактов <br />
                      {formatCurrency(item.totalAmount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-12 gap-2 mt-1 border-t border-gray-700/60 pt-2">
              {monthlyData.map((item, index) => (
                <div key={index} className="text-center">
                  <span className="text-xs text-gray-400">{item.month}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* График доходов по месяцам */}
          <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/60">
            <div className="flex justify-between text-sm text-gray-400 mb-4">
              <span>Месяц</span>
              <span>Суммы контрактов</span>
            </div>
            
            <div className="grid grid-cols-12 gap-2 h-48 mb-2">
              {monthlyData.map((item, index) => {
                const maxAmount = Math.max(...monthlyData.map(m => m.totalAmount), 1);
                return (
                  <div 
                    key={index} 
                    className="flex flex-col justify-end items-center"
                  >
                    <div className="text-xs text-gray-400 mb-1 truncate w-full text-center">
                      {item.totalAmount > 0 ? formatCurrency(item.totalAmount).split(' ')[0] : '0'}
                    </div>
                    <div 
                      className="w-full bg-green-500 rounded-t-md hover:bg-green-400 transition-all duration-300 group relative"
                      style={{ 
                        height: `${(item.totalAmount / maxAmount) * 100}%`,
                        minHeight: item.totalAmount > 0 ? '4px' : '0'
                      }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap transition-opacity z-10">
                        {formatCurrency(item.totalAmount)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="grid grid-cols-12 gap-2 mt-1 border-t border-gray-700/60 pt-2">
              {monthlyData.map((item, index) => (
                <div key={index} className="text-center">
                  <span className="text-xs text-gray-400">{item.month}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Таблица с данными по месяцам */}
          <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/60">
            <div className="text-sm text-gray-400 mb-3">Сводная таблица по месяцам</div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-900/80">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-400 font-medium">Месяц</th>
                    <th className="px-3 py-2 text-right text-gray-400 font-medium">Контракты</th>
                    <th className="px-3 py-2 text-right text-gray-400 font-medium">Сумма</th>
                    <th className="px-3 py-2 text-right text-gray-400 font-medium">% от общего</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {monthlyData.map((item, index) => (
                    <tr key={index} className={`${index % 2 === 0 ? 'bg-gray-800/60' : 'bg-gray-800/30'} hover:bg-gray-700/50`}>
                      <td className="px-3 py-2 font-medium text-white">{item.month}</td>
                      <td className="px-3 py-2 text-right text-gray-300">{item.contracts}</td>
                      <td className="px-3 py-2 text-right text-gray-300">{formatCurrency(item.totalAmount)}</td>
                      <td className="px-3 py-2 text-right text-gray-300">
                        {totalContracts > 0 
                          ? Math.round((item.contracts / totalContracts) * 100) 
                          : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-900/80">
                  <tr>
                    <td className="px-3 py-2 font-medium text-white">Итого</td>
                    <td className="px-3 py-2 text-right font-medium text-white">{totalContracts}</td>
                    <td className="px-3 py-2 text-right font-medium text-white">{formatCurrency(totalAmount)}</td>
                    <td className="px-3 py-2 text-right font-medium text-white">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg border border-gray-700/50 shadow-md overflow-hidden">
      <div className="flex justify-between items-center p-3 border-b border-gray-700">
        <h2 className="text-base font-medium text-white flex items-center gap-2">
          <BarChart3 size={18} className="text-blue-400" />
          Аналитика продаж
          {selectedModel && (
            <span className="ml-2 text-sm text-gray-400">
              • {selectedModel}
            </span>
          )}
        </h2>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={refreshAllData}
            className="bg-gray-700 hover:bg-gray-600 text-gray-300 p-1.5 rounded-md flex items-center gap-1.5 text-xs"
            disabled={loading}
          >
            <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
            <span>{loading ? "Обновление..." : "Обновить"}</span>
          </button>
        </div>
      </div>
      
      {/* Панель управления аналитикой */}
      <div className="bg-gray-850 p-3 border-b border-gray-700">
        <div className="flex flex-wrap gap-4 justify-between items-center">
          {/* Вкладки типа аналитики */}
          <div className="flex border border-gray-700 rounded-md overflow-hidden">
            <button 
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 ${analyticsTab === 'regions' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              onClick={() => handleAnalyticsTabChange('regions')}
            >
              <MapPin size={14} />
              <span>Регионы</span>
            </button>
            <button 
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 ${analyticsTab === 'models' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              onClick={() => handleAnalyticsTabChange('models')}
            >
              <Car size={14} />
              <span>Модели</span>
            </button>
            <button 
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 ${analyticsTab === 'yearly' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              onClick={() => handleAnalyticsTabChange('yearly')}
            >
              <LineChart size={14} />
              <span>Годовая</span>
            </button>
          </div>
          
          {/* Вкладки года для годовой аналитики */}
          {analyticsTab === 'yearly' && (
            <div className="flex border border-gray-700 rounded-md overflow-hidden">
              <button 
                className={`px-3 py-1.5 text-sm ${yearTab === '2023' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                onClick={() => handleYearTabChange('2023')}
              >
                2023
              </button>
              <button 
                className={`px-3 py-1.5 text-sm ${yearTab === '2024' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                onClick={() => handleYearTabChange('2024')}
              >
                2024
              </button>
              <button 
                className={`px-3 py-1.5 text-sm ${yearTab === '2025' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                onClick={() => handleYearTabChange('2025')}
              >
                2025
              </button>
            </div>
          )}
        </div>
        
        {/* Селектор периода (только для регионов и моделей) */}
        {(analyticsTab === 'regions' || analyticsTab === 'models') && (
          <div className="mt-3">
            <PeriodSelector />
          </div>
        )}
      </div>
      
      {/* Отображение лоадера при загрузке данных */}
      {loading && analyticsData[analyticsTab].length === 0 && analyticsTab !== 'yearly' && (
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Загрузка данных...</p>
        </div>
      )}
      
      {/* Отображение ошибки при загрузке данных */}
      {error && analyticsData[analyticsTab].length === 0 && analyticsTab !== 'yearly' && (
        <div className="p-6 text-center">
          <AlertTriangle size={32} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Ошибка загрузки данных</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={refreshAllData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm flex items-center mx-auto"
          >
            <RefreshCcw size={14} className="mr-2" />
            Попробовать снова
          </button>
        </div>
      )}
      
      {/* Контент аналитического дашборда */}
      <div className="max-h-[600px] overflow-y-auto">
        {analyticsTab === 'regions' && !loading && <RegionsChart />}
        {analyticsTab === 'models' && !loading && <ModelsChart />}
        {analyticsTab === 'yearly' && <YearlyChart />}
      </div>
    </div>
  );
};

export default DashboardAnalytics;