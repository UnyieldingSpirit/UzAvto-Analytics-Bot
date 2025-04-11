"use client";

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { D3Visualizer } from '@/src/utils/dataVisualizer';
import * as d3 from 'd3';

export default function Statistics() {
  // State variables
  const [view, setView] = useState('models');
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [chartType, setChartType] = useState('bar');
  const [data, setData] = useState({
    modelData: [],
    dealerData: [],
    salespersonData: [],
    trendData: []
  });

  // Refs for chart containers
  const modelChartRef = useRef(null);
  const modelSecondaryChartRef = useRef(null);
  const dealerChartRef = useRef(null);
  const dealerSecondaryChartRef = useRef(null);
  const salespersonChartRef = useRef(null);
  const salespersonSecondaryChartRef = useRef(null);
  const trendChartRef = useRef(null);

  // Filtered data
  const filteredDealerData = selectedModel
    ? data.dealerData.filter(d => d.modelId === selectedModel.id)
    : [];

  const filteredSalespersonData = (selectedModel && selectedDealer)
    ? data.salespersonData.filter(
        d => d.modelId === selectedModel.id && d.dealerId === selectedDealer.dealerId
      )
    : [];

  // Event handlers
  const handleModelClick = (model) => {
    setSelectedModel(model);
    setView('dealers');
  };

  const handleDealerClick = (dealer) => {
    setSelectedDealer(dealer);
    setView('salespeople');
  };

  const handleBackClick = () => {
    if (view === 'salespeople') {
      setView('dealers');
      setSelectedDealer(null);
    } else if (view === 'dealers') {
      setView('models');
      setSelectedModel(null);
    }
  };

  // Generate demo data
  const generateDemoData = () => {
    const models = [
      { id: 1, name: 'Model S', color: '#3b82f6' },
      { id: 2, name: 'Model 3', color: '#8b5cf6' },
      { id: 3, name: 'Model X', color: '#ec4899' },
      { id: 4, name: 'Model Y', color: '#10b981' },
      { id: 5, name: 'Cybertruck', color: '#f59e0b' },
    ];

    const dealers = [
      { id: 1, name: 'Premium Motors' },
      { id: 2, name: 'Luxury Auto' },
      { id: 3, name: 'Elite Cars' },
      { id: 4, name: 'City Dealership' },
    ];

    const salespeople = [
      { id: 1, name: 'Alex Johnson', dealerId: 1 },
      { id: 2, name: 'Sam Williams', dealerId: 1 },
      { id: 3, name: 'Jordan Smith', dealerId: 1 },
      { id: 4, name: 'Taylor Brown', dealerId: 2 },
      { id: 5, name: 'Casey Davis', dealerId: 2 },
      { id: 6, name: 'Morgan Wilson', dealerId: 3 },
      { id: 7, name: 'Riley Miller', dealerId: 3 },
      { id: 8, name: 'Jamie Garcia', dealerId: 4 },
      { id: 9, name: 'Quinn Thomas', dealerId: 4 },
    ];

    const modelData = models.map(model => {
      return {
        id: model.id,
        name: model.name,
        color: model.color,
        totalSales: Math.floor(Math.random() * 1000) + 200,
      };
    });

    const dealerData = [];
    models.forEach(model => {
      dealers.forEach(dealer => {
        const sales = Math.floor(Math.random() * 300) + 20;
        dealerData.push({
          modelId: model.id,
          dealerId: dealer.id,
          dealerName: dealer.name,
          modelName: model.name,
          sales: sales,
          color: model.color,
        });
      });
    });

    const salespersonData = [];
    dealerData.forEach(dealerRecord => {
      const dealerSalespeople = salespeople.filter(sp => sp.dealerId === dealerRecord.dealerId);
      
      let remainingSales = dealerRecord.sales;
      dealerSalespeople.forEach((salesperson, index) => {
        let sales;
        if (index === dealerSalespeople.length - 1) {
          sales = remainingSales;
        } else {
          sales = Math.floor(Math.random() * (remainingSales * 0.7));
          remainingSales -= sales;
        }
        
        salespersonData.push({
          modelId: dealerRecord.modelId,
          dealerId: dealerRecord.dealerId,
          salespersonId: salesperson.id,
          salespersonName: salesperson.name,
          modelName: dealerRecord.modelName,
          dealerName: dealerRecord.dealerName,
          sales: sales,
          color: dealerRecord.color,
        });
      });
    });

    // Генерация данных тренда за 12 месяцев
    const trendData = [];
    const today = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(today.getMonth() - i);
      trendData.push({
        date: date.toISOString().slice(0, 10),
        sales: Math.floor(Math.random() * 500) + 100
      });
    }

    return { modelData, dealerData, salespersonData, trendData };
  };

  // Render functions with our new D3 visualizer
  const renderModelCharts = () => {
    if (!modelChartRef.current || !modelSecondaryChartRef.current || !data.modelData.length) return;
    
    // Format data for D3 visualizer
    const chartData = data.modelData.map(model => ({
      id: model.id,
      label: model.name,
      value: model.totalSales,
      color: model.color,
      model: model
    }));
    
    // Primary chart
    if (chartType === 'bar') {
      D3Visualizer.createBarChart(chartData, {
        container: modelChartRef.current,
        title: 'Продажи по моделям',
        onClick: (item) => handleModelClick(item.model),
        height: 400
      });
    } else if (chartType === 'pie') {
      D3Visualizer.createPieChart(chartData, {
        container: modelChartRef.current,
        title: 'Доля рынка по моделям',
        onClick: (item) => handleModelClick(item.model),
        height: 400
      });
    } else if (chartType === 'stacked') {
      // Группировка данных для stacked chart
      const dealersByModel = data.dealerData.reduce((acc, dealer) => {
        const model = data.modelData.find(m => m.id === dealer.modelId);
        if (!model) return acc;
        
        if (!acc[model.name]) {
          acc[model.name] = {
            category: model.name,
            values: []
          };
        }
        
        acc[model.name].values.push({
          label: dealer.dealerName,
          value: dealer.sales
        });
        
        return acc;
      }, {});

      D3Visualizer.createStackedBarChart(Object.values(dealersByModel), {
        container: modelChartRef.current,
        title: 'Продажи по моделям и дилерам',
        onClick: (item) => {
          const model = data.modelData.find(m => m.name === item.category);
          if (model) handleModelClick(model);
        },
        height: 400
      });
    }
    
    // Secondary chart - тренд продаж
    if (trendChartRef.current && data.trendData.length) {
      D3Visualizer.createAreaChart(data.trendData.map(d => ({
        x: d.date,
        y: d.sales
      })), {
        container: trendChartRef.current,
        title: 'Тренд продаж за последние 12 месяцев',
        height: 300,
        colors: ['#10b981']
      });
    }
    
    // Вторичный график - диаграмма рассеяния цена vs продажи
    const scatterData = data.modelData.map(model => ({
      x: Math.random() * 50000 + 50000, // Примерная цена
      y: model.totalSales,
      label: model.name,
      size: model.totalSales / 50,
      group: model.name,
      model
    }));
    
    D3Visualizer.createScatterPlot(scatterData, {
      container: modelSecondaryChartRef.current,
      title: 'Соотношение цены и объема продаж',
      onClick: (item) => handleModelClick(item.model),
      height: 400,
      colors: data.modelData.map(m => m.color)
    });
  };

  const renderDealerCharts = () => {
    if (!dealerChartRef.current || !dealerSecondaryChartRef.current || !filteredDealerData.length || !selectedModel) return;
    
    // Формат данных для D3 визуализатора
    const chartData = filteredDealerData.map(dealer => ({
      id: dealer.dealerId,
      label: dealer.dealerName,
      value: dealer.sales,
      color: selectedModel.color,
      dealer
    }));
    
    // Primary chart
    if (chartType === 'bar') {
      D3Visualizer.createBarChart(chartData, {
        container: dealerChartRef.current,
        title: `Продажи ${selectedModel.name} по дилерам`,
        onClick: (item) => handleDealerClick(item.dealer),
        height: 400,
        colors: chartData.map((_, i) => {
          // Creating color variations
          const baseColor = selectedModel.color;
          const hslColor = d3.hsl(baseColor);
          hslColor.l = 0.4 + (i * 0.1);
          return hslColor.toString();
        })
      });
    } else if (chartType === 'pie') {
      D3Visualizer.createPieChart(chartData, {
        container: dealerChartRef.current,
        title: `Доля продаж ${selectedModel.name} по дилерам`,
        onClick: (item) => handleDealerClick(item.dealer),
        height: 400,
        colors: chartData.map((_, i) => {
          // Creating color variations
          const baseColor = selectedModel.color;
          const hslColor = d3.hsl(baseColor);
          hslColor.l = 0.4 + (i * 0.1);
          return hslColor.toString();
        })
      });
    }
    
    // Secondary chart - Stacked bar для продавцов по дилерам
    const dealerSalespersonData = data.salespersonData.filter(sp => sp.modelId === selectedModel.id);
    const salespeopleByDealer = dealerSalespersonData.reduce((acc, salesperson) => {
      if (!acc[salesperson.dealerName]) {
        acc[salesperson.dealerName] = {
          category: salesperson.dealerName,
          values: []
        };
      }
      
      acc[salesperson.dealerName].values.push({
        label: salesperson.salespersonName,
        value: salesperson.sales
      });
      
      return acc;
    }, {});

    D3Visualizer.createStackedBarChart(Object.values(salespeopleByDealer), {
      container: dealerSecondaryChartRef.current,
      title: `Продажи ${selectedModel.name} по продавцам`,
      onClick: (item) => {
        const dealer = filteredDealerData.find(d => d.dealerName === item.category);
        if (dealer) handleDealerClick(dealer);
      },
      height: 400
    });
  };

  const renderSalespersonCharts = () => {
    if (!salespersonChartRef.current || !salespersonSecondaryChartRef.current || !filteredSalespersonData.length || !selectedModel || !selectedDealer) return;
    
    // Формат данных для D3 визуализатора
    const chartData = filteredSalespersonData.map(salesperson => ({
      id: salesperson.salespersonId,
      label: salesperson.salespersonName,
      value: salesperson.sales,
      color: selectedModel.color,
      salesperson
    }));
    
    // Primary chart
    if (chartType === 'bar') {
      D3Visualizer.createBarChart(chartData, {
        container: salespersonChartRef.current,
        title: `Продажи ${selectedModel.name} в ${selectedDealer.dealerName}`,
        height: 400,
        colors: chartData.map((_, i) => {
          // Creating color variations
          const baseColor = selectedModel.color;
          const hslColor = d3.hsl(baseColor);
          hslColor.l = 0.4 + (i * 0.1);
          return hslColor.toString();
        })
      });
    } else if (chartType === 'pie') {
      D3Visualizer.createPieChart(chartData, {
        container: salespersonChartRef.current,
        title: `Доля продаж ${selectedModel.name} в ${selectedDealer.dealerName}`,
        height: 400,
        colors: chartData.map((_, i) => {
          // Creating color variations
          const baseColor = selectedModel.color;
          const hslColor = d3.hsl(baseColor);
          hslColor.l = 0.4 + (i * 0.1);
          return hslColor.toString();
        })
      });
    }
    
    // Generate some mock monthly performance data for each salesperson
    const monthlyData = filteredSalespersonData.flatMap(salesperson => {
      const today = new Date();
      return Array.from({ length: 6 }).map((_, i) => {
        const date = new Date();
        date.setMonth(today.getMonth() - 5 + i);
        return {
          x: date.toISOString().slice(0, 7),
          y: Math.floor(Math.random() * 30) + 10,
          group: salesperson.salespersonName
        };
      });
    });

    // Group by month for line chart
    const monthlyByPerson = {};
    monthlyData.forEach(d => {
      if (!monthlyByPerson[d.group]) {
        monthlyByPerson[d.group] = [];
      }
      monthlyByPerson[d.group].push(d);
    });

    // Secondary chart - Performance over time
    const multiLineData = Object.entries(monthlyByPerson).map(([name, values]) => ({
      name,
      values: values.map(v => ({ date: v.x, value: v.y }))
    }));

    // Custom D3 rendering for multi-line chart
    const container = salespersonSecondaryChartRef.current;
    container.innerHTML = '';
    
    const width = container.clientWidth;
    const height = 400;
    const margin = { top: 40, right: 80, bottom: 60, left: 60 };
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('background', '#1f2937')
      .style('border-radius', '0.5rem');
      
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '1.2rem')
      .style('font-weight', 'bold')
      .style('fill', '#f9fafb')
      .text(`Динамика продаж за 6 месяцев`);
      
    const x = d3.scaleTime()
      .domain(d3.extent(monthlyData, d => new Date(d.x)))
      .range([margin.left, width - margin.right]);
      
    const y = d3.scaleLinear()
      .domain([0, d3.max(monthlyData, d => d.y)])
      .nice()
      .range([height - margin.bottom, margin.top]);
      
    const colorScale = d3.scaleOrdinal()
      .domain(Object.keys(monthlyByPerson))
      .range(d3.quantize(d => {
        const baseColor = selectedModel.color;
        const hslColor = d3.hsl(baseColor);
        hslColor.h += d * 180;
        return hslColor.toString();
      }, Object.keys(monthlyByPerson).length));
      
    const line = d3.line()
      .x(d => x(new Date(d.x)))
      .y(d => y(d.y))
      .curve(d3.curveMonotoneX);
      
    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat(d => d3.timeFormat('%b %Y')(d)))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text').style('fill', '#f9fafb'));
      
    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text').style('fill', '#f9fafb'))
      .call(g => g.selectAll('.tick line')
        .attr('x2', width - margin.left - margin.right)
        .attr('stroke-opacity', 0.1));
        
  // Add lines
   Object.entries(monthlyByPerson).forEach(([name, values], i) => {
     const pathData = monthlyData.filter(d => d.group === name);
     
     // Add path
     svg.append('path')
       .datum(pathData)
       .attr('fill', 'none')
       .attr('stroke', colorScale(name))
       .attr('stroke-width', 3)
       .attr('d', line)
       .attr('opacity', 0)
       .transition()
       .duration(1000)
       .delay(i * 300)
       .attr('opacity', 0.8);

     // Add points
     svg.selectAll(`.point-${i}`)
       .data(pathData)
       .join('circle')
       .attr('class', `point-${i}`)
       .attr('cx', d => x(new Date(d.x)))
       .attr('cy', d => y(d.y))
       .attr('r', 0)
       .attr('fill', colorScale(name))
       .attr('stroke', '#1f2937')
       .attr('stroke-width', 2)
       .transition()
       .duration(500)
       .delay((d, j) => i * 300 + j * 100 + 1000)
       .attr('r', 6);
   });
   
   // Add legend
   const legend = svg.append('g')
     .attr('transform', `translate(${width - margin.right + 20}, ${margin.top + 20})`);
     
   Object.keys(monthlyByPerson).forEach((name, i) => {
     const legendRow = legend.append('g')
       .attr('transform', `translate(0, ${i * 25})`);
       
     legendRow.append('rect')
       .attr('width', 15)
       .attr('height', 3)
       .attr('fill', colorScale(name));
       
     legendRow.append('text')
       .attr('x', 25)
       .attr('y', 5)
       .text(name)
       .style('font-size', '0.8rem')
       .style('fill', '#f9fafb');
   });
 };

 // Initialize on mount and update charts when view changes
 useEffect(() => {
   setData(generateDemoData());
 }, []);

 useEffect(() => {
   if (view === 'models') {
     renderModelCharts();
   } else if (view === 'dealers' && selectedModel) {
     renderDealerCharts();
   } else if (view === 'salespeople' && selectedModel && selectedDealer) {
     renderSalespersonCharts();
   }
 }, [view, selectedModel, selectedDealer, data, chartType]);

 return (
   <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-8">
     <header className="mb-8">
       <motion.h1 
         initial={{ opacity: 0, y: -20 }}
         animate={{ opacity: 1, y: 0 }}
         className="text-3xl md:text-4xl font-bold text-white bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text"
       >
         Интерактивная панель продаж автомобилей
       </motion.h1>
       <motion.p 
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         transition={{ delay: 0.2 }}
         className="text-gray-400 mt-2"
       >
         Исследуйте данные о продажах от моделей до отдельных продавцов
       </motion.p>
     </header>
     
     <div className="bg-gray-900/60 rounded-xl p-4 md:p-6 border border-gray-700/50 shadow-xl">
       {/* Инструменты */}
       <div className="flex flex-wrap justify-between items-center mb-6">
         <div className="flex items-center space-x-2 mb-2">
           <motion.div 
             whileHover={{ scale: 1.05 }} 
             whileTap={{ scale: 0.95 }}
             className={`h-3 w-3 rounded-full cursor-pointer ${view === 'models' ? 'bg-green-500' : 'bg-gray-500'}`}
             onClick={() => setView('models')}
           />
           <div className="h-0.5 w-8 bg-gray-600"></div>
           <motion.div 
             whileHover={{ scale: 1.05 }} 
             whileTap={{ scale: 0.95 }}
             className={`h-3 w-3 rounded-full cursor-pointer ${view === 'dealers' ? 'bg-green-500' : 'bg-gray-500'}`}
             onClick={() => selectedModel && setView('dealers')}
           />
           <div className="h-0.5 w-8 bg-gray-600"></div>
           <motion.div 
             whileHover={{ scale: 1.05 }} 
             whileTap={{ scale: 0.95 }}
             className={`h-3 w-3 rounded-full cursor-pointer ${view === 'salespeople' ? 'bg-green-500' : 'bg-gray-500'}`}
             onClick={() => selectedDealer && setView('salespeople')}
           />
         </div>

         <div className="flex flex-wrap space-x-2">
           <motion.button
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={() => setChartType('bar')}
             className={`px-3 py-1.5 rounded-md text-sm ${chartType === 'bar' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
           >
             Столбцы
           </motion.button>
           <motion.button
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={() => setChartType('pie')}
             className={`px-3 py-1.5 rounded-md text-sm ${chartType === 'pie' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
           >
             Круговая
           </motion.button>
           <motion.button
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={() => setChartType('stacked')}
             className={`px-3 py-1.5 rounded-md text-sm ${chartType === 'stacked' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
           >
             Составная
           </motion.button>
         </div>
       </div>
       
       {/* Навигационный путь */}
       {(selectedModel || selectedDealer) && (
         <div className="mb-6 bg-gray-800/80 p-3 rounded-lg flex items-center flex-wrap">
           <motion.button
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={() => {
               setSelectedModel(null);
               setSelectedDealer(null);
               setView('models');
             }}
             className="text-blue-400 hover:text-blue-300 transition-colors"
           >
             Все модели
           </motion.button>
           
           {selectedModel && (
             <>
               <span className="mx-2 text-gray-500">/</span>
               <motion.button
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={() => {
                   setSelectedDealer(null);
                   setView('dealers');
                 }}
                 className="text-blue-400 hover:text-blue-300 transition-colors"
                 style={{ color: selectedModel.color }}
               >
                 {selectedModel.name}
               </motion.button>
             </>
           )}
           
           {selectedDealer && (
             <>
               <span className="mx-2 text-gray-500">/</span>
               <span className="text-gray-300">{selectedDealer.dealerName}</span>
             </>
           )}
         </div>
       )}
       
       {/* Уровень моделей */}
       {view === 'models' && (
         <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           className="mb-8"
         >
           <h2 className="text-2xl font-bold mb-6 text-white">Общие продажи по моделям</h2>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* Основной график */}
             <div className="bg-gray-800 p-4 rounded-lg shadow-md">
               <div ref={modelChartRef} className="w-full h-full"></div>
               <p className="text-center text-gray-400 mt-2">Нажмите на элемент для просмотра продаж по дилерам</p>
             </div>
             
             {/* Дополнительный график */}
             <div className="bg-gray-800 p-4 rounded-lg shadow-md">
               <div ref={modelSecondaryChartRef} className="w-full h-full"></div>
             </div>
           </div>
           
           {/* Тренд */}
           <div className="mt-6 bg-gray-800 p-4 rounded-lg shadow-md">
             <div ref={trendChartRef} className="w-full h-full"></div>
           </div>
         </motion.div>
       )}
       
       {/* Уровень дилеров */}
       {view === 'dealers' && (
         <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           className="mb-8"
         >
           <h2 className="text-2xl font-bold mb-6 text-white" style={{ color: selectedModel?.color }}>
             {selectedModel ? `${selectedModel.name} - Продажи по дилерам` : ''}
           </h2>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* Основной график */}
             <div className="bg-gray-800 p-4 rounded-lg shadow-md">
               <div ref={dealerChartRef} className="w-full h-full"></div>
               <p className="text-center text-gray-400 mt-2">Нажмите на элемент для просмотра продаж по продавцам</p>
             </div>
             
             {/* Дополнительный график */}
             <div className="bg-gray-800 p-4 rounded-lg shadow-md">
               <div ref={dealerSecondaryChartRef} className="w-full h-full"></div>
             </div>
           </div>
         </motion.div>
       )}
       
       {/* Уровень продавцов */}
       {view === 'salespeople' && (
         <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           className="mb-8"
         >
           <h2 className="text-2xl font-bold mb-6 text-white" style={{ color: selectedModel?.color }}>
             {selectedModel && selectedDealer ? 
               `${selectedModel.name} - Продажи в ${selectedDealer.dealerName}` : ''}
           </h2>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* Основной график */}
             <div className="bg-gray-800 p-4 rounded-lg shadow-md">
               <div ref={salespersonChartRef} className="w-full h-full"></div>
             </div>
             
             {/* Дополнительный график */}
             <div className="bg-gray-800 p-4 rounded-lg shadow-md">
               <div ref={salespersonSecondaryChartRef} className="w-full h-full"></div>
             </div>
           </div>
         </motion.div>
       )}
     </div>
     
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