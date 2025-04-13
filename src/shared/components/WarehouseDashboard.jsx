'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const WarehouseDashboard = () => {
  // Refs для графиков
  const trafficChartRef = useRef(null);
  const deviceChartRef = useRef(null);
  const socialChartRef = useRef(null);
  
  // Состояние
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  
  // Данные для графиков
  const trafficData = [
    { source: 'Органический поиск', value: 62.7, color: '#3b82f6' },
    { source: 'Прямой', value: 40.6, color: '#ef4444' },
    { source: 'Реферал', value: 25.2, color: '#f59e0b' },
    { source: 'Другие', value: 10.6, color: '#22c55e' }
  ];
  
  const deviceData = [
    { name: 'Десктоп', value: 56.0, color: '#3b82f6' },
    { name: 'Мобильный', value: 30.0, color: '#ef4444' },
    { name: 'Планшет', value: 14.0, color: '#f59e0b' }
  ];
  
  const socialData = [
    { platform: 'Facebook', visits: 46, percentage: 33, color: '#3b82f6' },
    { platform: 'YouTube', visits: 12, percentage: 17, color: '#ef4444' },
    { platform: 'LinkedIn', visits: 29, percentage: 21, color: '#38bdf8' },
    { platform: 'Twitter', visits: 34, percentage: 23, color: '#f59e0b' },
    { platform: 'Dribbble', visits: 28, percentage: 19, color: '#22c55e' }
  ];
  
  // Данные для автомобилей
  const carModels = [
    { id: 'nexia', name: 'Chevrolet Nexia', stock: 76, color: '#3b82f6' },
    { id: 'cobalt', name: 'Chevrolet Cobalt', stock: 84, color: '#ef4444' },
    { id: 'gentra', name: 'Chevrolet Gentra', stock: 58, color: '#f59e0b' },
    { id: 'tracker', name: 'Chevrolet Tracker', stock: 42, color: '#22c55e' },
    { id: 'spark', name: 'Chevrolet Spark', stock: 65, color: '#8b5cf6' }
  ];
  
  // Эффект для инициализации графиков
  useEffect(() => {
    renderTrafficChart();
    renderDeviceChart();
    renderSocialChart();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Обработчик изменения размера окна
  const handleResize = () => {
    renderTrafficChart();
    renderDeviceChart();
    renderSocialChart();
  };
  
  // Функция для отрисовки графика источников трафика
  const renderTrafficChart = () => {
    if (!trafficChartRef.current) return;
    
    const container = trafficChartRef.current;
    container.innerHTML = '';
    
    const margin = { top: 30, right: 10, bottom: 50, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
      
    // Заголовок
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#374151')
      .text('Источники трафика. Январь, 2020');
      
    // Шкалы
    const x = d3.scaleBand()
      .domain(trafficData.map(d => d.source))
      .range([0, width])
      .padding(0.4);
      
    const y = d3.scaleLinear()
      .domain([0, 80])
      .range([height, 0]);
      
    // Оси
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('font-size', '12px');
      
    svg.append('g')
      .call(d3.axisLeft(y).tickFormat(d => `${d}%`));
      
    // Подпись оси Y
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left + 15)
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Доля трафика');
      
    // Создаем столбцы
    svg.selectAll('.bar')
      .data(trafficData)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.source))
      .attr('width', x.bandwidth())
      .attr('y', d => y(d.value))
      .attr('height', d => height - y(d.value))
      .attr('fill', d => d.color)
      .attr('rx', 4);
      
    // Добавляем значения
    svg.selectAll('.label')
      .data(trafficData)
      .enter().append('text')
      .attr('class', 'label')
      .attr('x', d => x(d.source) + x.bandwidth() / 2)
      .attr('y', d => y(d.value) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text(d => `${d.value}%`);
  };
  
  // Функция для отрисовки круговой диаграммы устройств
  const renderDeviceChart = () => {
    if (!deviceChartRef.current) return;
    
    const container = deviceChartRef.current;
    container.innerHTML = '';
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    const radius = Math.min(width, height) / 2 * 0.8;
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width/2},${height/2})`);
      
    // Создаем пирог
    const pie = d3.pie()
      .value(d => d.value)
      .sort(null);
      
    const arc = d3.arc()
      .innerRadius(radius * 0.5)
      .outerRadius(radius);
      
    // Создаем дуги
    const arcs = svg.selectAll('.arc')
      .data(pie(deviceData))
      .enter()
      .append('g')
      .attr('class', 'arc');
      
    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => d.data.color)
      .attr('stroke', 'white')
      .style('stroke-width', '2px')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        console.log('Selected device:', d.data.name);
      });
      
    // Добавляем метки
    arcs.append('text')
      .attr('transform', d => {
        const pos = arc.centroid(d);
        const x = pos[0] * 1.5;
        const y = pos[1] * 1.5;
        return `translate(${x},${y})`;
      })
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#374151')
      .text(d => `${d.data.name}: ${d.data.value}%`);
      
    // Заголовок
    svg.append('text')
      .attr('x', 0)
      .attr('y', -radius - 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#374151')
      .text('Устройства пользователей');
  };
  
  // Функция для отрисовки социального трафика
  const renderSocialChart = () => {
    if (!socialChartRef.current) return;
    
    const container = socialChartRef.current;
    container.innerHTML = '';
    
    const width = container.clientWidth;
    const height = 40; // Высота для одной полосы
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);
      
    // Шкала
    const x = d3.scaleLinear()
      .domain([0, 100])
      .range([0, width]);
      
    // Создаем кумулятивные позиции
    let cumulative = 0;
    const bars = socialData.map(d => {
      const bar = {
        platform: d.platform,
        visits: d.visits,
        percentage: d.percentage,
        color: d.color,
        start: cumulative,
        end: cumulative + d.percentage
      };
      cumulative += d.percentage;
      return bar;
    });
    
    // Добавляем полосы
    svg.selectAll('.bar')
      .data(bars)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.start))
      .attr('width', d => x(d.end) - x(d.start))
      .attr('y', 0)
      .attr('height', height)
      .attr('fill', d => d.color)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        console.log('Selected platform:', d.platform);
      });
  };
  
  // Обработчик клика по модели
  const handleModelClick = (model) => {
    setSelectedModel(model);
    // Тут можно добавить логику для перехода к модификации, как указано в задании
    console.log(`Clicked on model: ${model.name}`);
  };

  return (
    <div className="p-4 bg-gray-50">
      {/* Заголовок */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Аналитика склада</h1>
        <p className="text-gray-600">Обзор остатков автомобилей и статистика</p>
      </div>
      
      {/* Фильтры */}
      <div className="mb-6 flex gap-4 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center">
          <span className="text-gray-600 mr-2">Период:</span>
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1"
          >
            <option value="week">Неделя</option>
            <option value="month">Месяц</option>
            <option value="quarter">Квартал</option>
            <option value="year">Год</option>
          </select>
        </div>
        
        <div className="flex items-center">
          <span className="text-gray-600 mr-2">Склад:</span>
          <select className="border border-gray-300 rounded px-3 py-1">
            <option>Все склады</option>
            <option>Ташкент</option>
            <option>Самарканд</option>
            <option>Бухара</option>
          </select>
        </div>
      </div>
      
      {/* Основные метрики */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm mb-1">Всего автомобилей</h3>
          <p className="text-3xl font-bold text-gray-800">325</p>
          <div className="flex items-center mt-2 text-sm">
            <span className="text-green-500 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
              +12% 
            </span>
            <span className="text-gray-500 ml-2">с прошлого месяца</span>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm mb-1">Модели в наличии</h3>
          <p className="text-3xl font-bold text-gray-800">14</p>
          <div className="flex items-center mt-2 text-sm">
            <span className="text-red-500 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
              </svg>
              -3%
            </span>
            <span className="text-gray-500 ml-2">с прошлого месяца</span>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm mb-1">Средняя загруженность</h3>
          <p className="text-3xl font-bold text-gray-800">76%</p>
          <div className="flex items-center mt-2 text-sm">
            <span className="text-green-500 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
              +5%
            </span>
            <span className="text-gray-500 ml-2">с прошлого месяца</span>
          </div>
        </div>
      </div>
      
      {/* Графики */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Источники трафика</h2>
          <div ref={trafficChartRef} className="h-[300px]"></div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Устройства пользователей</h2>
          <div ref={deviceChartRef} className="h-[300px]"></div>
        </div>
      </div>
      
      {/* Социальный трафик */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-medium text-gray-800">Социальный трафик</h2>
            <p className="text-gray-500 text-sm">89,421 общих посещений</p>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>
        
        <div ref={socialChartRef} className="mb-4"></div>
        
        <div className="space-y-3">
          {socialData.map(platform => (
            <div key={platform.platform} className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="w-3 h-3 mr-2 rounded-full" style={{ backgroundColor: platform.color }}></span>
                <span>{platform.platform}</span>
              </div>
              <div className="flex space-x-8">
                <span className="text-gray-500">{platform.visits} визитов</span>
                <span className="font-medium w-12 text-right">{platform.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Остаток на складе - секция, представляющая SKLAD UROVENIDA OSTATKA */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <h2 className="text-lg font-medium text-gray-800 mb-4">ОСТАТОК НА СКЛАДЕ</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Модель</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Доступно</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Резерв</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Всего</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {carModels.map(model => (
                <tr 
                  key={model.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleModelClick(model)}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{model.name}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{model.stock - Math.floor(model.stock * 0.1)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{Math.floor(model.stock * 0.1)}</td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium">{model.stock}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      model.stock > 70 ? 'bg-green-100 text-green-800' : 
                      model.stock > 40 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {model.stock > 70 ? 'В наличии' : model.stock > 40 ? 'Ограничено' : 'Мало'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Модальное окно с деталями модели (появляется при клике на модель) */}
      {selectedModel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-800">{selectedModel.name}</h2>
              <button 
                onClick={() => setSelectedModel(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-2">Остаток по складам</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Ташкент</span>
                  <span className="font-medium">{Math.floor(selectedModel.stock * 0.4)} шт.</span>
                </div>
                <div className="flex justify-between">
                  <span>Самарканд</span>
                  <span className="font-medium">{Math.floor(selectedModel.stock * 0.3)} шт.</span>
                </div>
                <div className="flex justify-between">
                  <span>Бухара</span>
                  <span className="font-medium">{Math.floor(selectedModel.stock * 0.2)} шт.</span>
                </div>
                <div className="flex justify-between">
                  <span>Другие</span>
                  <span className="font-medium">{selectedModel.stock - Math.floor(selectedModel.stock * 0.9)} шт.</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-500 text-sm">Цвета</span>
                <div className="flex space-x-2 mt-2">
                  <span className="w-6 h-6 rounded-full bg-red-500"></span>
                  <span className="w-6 h-6 rounded-full bg-blue-500"></span>
                  <span className="w-6 h-6 rounded-full bg-gray-500"></span>
                  <span className="w-6 h-6 rounded-full bg-white border border-gray-300"></span>
                  <span className="w-6 h-6 rounded-full bg-black"></span>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-500 text-sm">Комплектации</span>
                <div className="mt-2">
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded mr-1">Базовая</span>
                  <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">Люкс</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button 
                onClick={() => setSelectedModel(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md mr-2 hover:bg-gray-300"
              >
                Отмена
              </button>
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Перейти к модификации
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseDashboard;