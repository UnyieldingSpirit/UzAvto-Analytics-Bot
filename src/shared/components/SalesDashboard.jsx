'use client';
import React, { useState } from 'react';
import { Package, Clock, Check, AlertTriangle, Filter, Truck, MapPin, Archive, ChevronLeft, BarChart3, Users, Activity, ChevronRight, Zap, Calendar, Car } from 'lucide-react';

const SalesDashboard = () => {
 const [activeTab, setActiveTab] = useState('месяц');
 const [activeDetailLevel, setActiveDetailLevel] = useState(0); // 0 = overview, 1 = status, 2 = region, 3 = dealer
 const [selectedStatus, setSelectedStatus] = useState(null);
 const [selectedRegion, setSelectedRegion] = useState(null);
 const [selectedDealer, setSelectedDealer] = useState(null);
 const [showSidebar, setShowSidebar] = useState(false);

 // Стандартные данные
 const contractData = {
   notShipped: 64,  // Распределены, но не отгружены в течение 48 часов
   inTransit: 48,   // В пути более 3 дней
   delivered: 96    // Доставлены
 };

 // Данные продаж по месяцам
 const salesData = [75, 82, 65, 90, 70, 85, 92, 78, 88, 94, 65, 75];
 const maxSales = Math.max(...salesData);
 const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

 // Данные по городам
 const cityData = [
   { name: 'Ташкент', value: 648 },
   { name: 'Самарканд', value: 472 },
   { name: 'Бухара', value: 365 },
   { name: 'Наманган', value: 275 },
   { name: 'Андижан', value: 248 }
 ];

 const maxCityValue = Math.max(...cityData.map(city => city.value));

 // Таблица автомобилей с просроченными контрактами
 const carData = [
   { model: 'Chevrolet Nexia', count: 12, days: 8 },
   { model: 'Chevrolet Cobalt', count: 8, days: 6 },
   { model: 'Ravon R4', count: 5, days: 5 }
 ];

 const totalCars = carData.reduce((sum, car) => sum + car.count, 0);

 // Данные последних заказов
 const recentOrders = [
   { id: '78912', client: 'Ахмедов А.', model: 'Chevrolet Malibu', price: 32500000, status: 'Доставлен' },
   { id: '78911', client: 'Садыков М.', model: 'Chevrolet Captiva', price: 28700000, status: 'В пути' },
   { id: '78910', client: 'Каримова С.', model: 'Chevrolet Nexia', price: 14200000, status: 'Новый' },
   { id: '78909', client: 'Рахимов Т.', model: 'Chevrolet Cobalt', price: 15600000, status: 'В пути' },
   { id: '78908', client: 'Исламов Д.', model: 'Ravon R4', price: 12900000, status: 'Новый' }
 ];

 // Данные по регионам для каждого статуса
 const regionData = {
   notShipped: [
     { name: 'Ташкент', value: 24 },
     { name: 'Самарканд', value: 18 },
     { name: 'Бухара', value: 12 },
     { name: 'Наманган', value: 6 },
     { name: 'Андижан', value: 4 }
   ],
   inTransit: [
     { name: 'Ташкент', value: 15 },
     { name: 'Самарканд', value: 14 },
     { name: 'Бухара', value: 10 },
     { name: 'Наманган', value: 5 },
     { name: 'Андижан', value: 4 }
   ]
 };

 // Данные по дилерам для каждого региона и статуса
 const dealerData = {
   notShipped: {
     'Ташкент': [
       { name: 'Автосалон Центральный', value: 10, models: [{name: "Chevrolet Nexia", count: 4}, {name: "Chevrolet Cobalt", count: 3}, {name: "Chevrolet Malibu", count: 3}] },
       { name: 'GM Premium', value: 8, models: [{name: "Chevrolet Nexia", count: 3}, {name: "Chevrolet Onix", count: 3}, {name: "Ravon R4", count: 2}] },
       { name: 'Авто-Максимум', value: 6, models: [{name: "Chevrolet Tracker", count: 2}, {name: "Chevrolet Cobalt", count: 2}, {name: "Ravon R4", count: 2}] },
     ],
     'Самарканд': [
       { name: 'GM Самарканд', value: 9, models: [{name: "Chevrolet Tracker", count: 3}, {name: "Chevrolet Nexia", count: 3}, {name: "Chevrolet Malibu", count: 3}] },
       { name: 'Авто-Самарканд', value: 6, models: [{name: "Ravon R4", count: 2}, {name: "Chevrolet Cobalt", count: 2}, {name: "Chevrolet Spark", count: 2}] },
       { name: 'Самарканд-Моторс', value: 3, models: [{name: "Chevrolet Captiva", count: 1}, {name: "Chevrolet Nexia", count: 1}, {name: "Chevrolet Cobalt", count: 1}] },
     ],
     'Бухара': [
       { name: 'Бухара-Авто', value: 7, models: [{name: "Chevrolet Nexia", count: 3}, {name: "Chevrolet Cobalt", count: 2}, {name: "Ravon R4", count: 2}] },
       { name: 'GM Бухара', value: 5, models: [{name: "Chevrolet Nexia", count: 2}, {name: "Chevrolet Malibu", count: 2}, {name: "Chevrolet Tracker", count: 1}] },
     ],
   },
   inTransit: {
     'Ташкент': [
       { name: 'Автосалон Центральный', value: 7, models: [{name: "Chevrolet Nexia", count: 3}, {name: "Chevrolet Cobalt", count: 2}, {name: "Chevrolet Malibu", count: 2}] },
       { name: 'GM Premium', value: 5, models: [{name: "Chevrolet Nexia", count: 2}, {name: "Ravon R4", count: 2}, {name: "Chevrolet Onix", count: 1}] },
       { name: 'Авто-Максимум', value: 3, models: [{name: "Chevrolet Tracker", count: 1}, {name: "Chevrolet Cobalt", count: 1}, {name: "Chevrolet Malibu", count: 1}] },
     ],
     'Самарканд': [
       { name: 'GM Самарканд', value: 6, models: [{name: "Chevrolet Tracker", count: 2}, {name: "Chevrolet Nexia", count: 2}, {name: "Chevrolet Malibu", count: 2}] },
       { name: 'Авто-Самарканд', value: 5, models: [{name: "Ravon R4", count: 2}, {name: "Chevrolet Cobalt", count: 2}, {name: "Chevrolet Nexia", count: 1}] },
       { name: 'Самарканд-Моторс', value: 3, models: [{name: "Chevrolet Captiva", count: 1}, {name: "Chevrolet Nexia", count: 1}, {name: "Chevrolet Cobalt", count: 1}] },
     ],
     'Бухара': [
       { name: 'Бухара-Авто', value: 6, models: [{name: "Chevrolet Nexia", count: 2}, {name: "Chevrolet Cobalt", count: 2}, {name: "Ravon R4", count: 2}] },
       { name: 'GM Бухара', value: 4, models: [{name: "Chevrolet Nexia", count: 2}, {name: "Chevrolet Malibu", count: 1}, {name: "Chevrolet Tracker", count: 1}] },
     ],
   }
 };

 // Обработчики для навигации по уровням детализации
 const handleStatusSelect = (status) => {
   setSelectedStatus(status);
   setActiveDetailLevel(1);
   setSelectedRegion(null);
   setSelectedDealer(null);
   setShowSidebar(true);
 };

 const handleRegionSelect = (region) => {
   setSelectedRegion(region);
   setActiveDetailLevel(2);
   setSelectedDealer(null);
 };

 const handleDealerSelect = (dealer) => {
   setSelectedDealer(dealer);
   setActiveDetailLevel(3);
 };

 const handleBack = () => {
   if (activeDetailLevel === 3) {
     setActiveDetailLevel(2);
     setSelectedDealer(null);
   } else if (activeDetailLevel === 2) {
     setActiveDetailLevel(1);
     setSelectedRegion(null);
   } else if (activeDetailLevel === 1) {
     setActiveDetailLevel(0);
     setSelectedStatus(null);
     setShowSidebar(false);
   }
 };

 // Получение максимального значения для прогрессбаров
 const getMaxValue = (dataArray) => {
   return Math.max(...dataArray.map(item => item.value));
 };

 // Рендеринг содержимого бокового окна
 const renderSidebarContent = () => {
   if (activeDetailLevel === 0 || !selectedStatus) return null;

   const statusTitle = selectedStatus === 'notShipped' ? 'Не отгружено >48ч' : 'В пути >3 дней';
   const statusColor = selectedStatus === 'notShipped' ? 'blue' : 'yellow';
   const statusIcon = selectedStatus === 'notShipped' ? <Archive size={20} /> : <Truck size={20} />;

   // Уровень 1: Список регионов
   if (activeDetailLevel === 1) {
     const regions = regionData[selectedStatus];
     const maxRegionValue = getMaxValue(regions);
     
     return (
       <div className="h-full flex flex-col">
         <div className="flex items-center gap-2 p-3 border-b border-gray-700 bg-gray-800/70">
           <div className={`text-${statusColor}-400`}>{statusIcon}</div>
           <h3 className="text-lg font-medium text-white">{statusTitle}</h3>
         </div>
         
         <div className="flex-1 overflow-y-auto p-2">
           <div className="text-sm text-gray-400 mb-3 px-2">Выберите регион для детализации:</div>
           
           <div className="space-y-2">
             {regions.map((region, index) => (
               <div 
                 key={index} 
                 className={`p-3 rounded-lg border ${selectedRegion === region.name ? `bg-${statusColor}-900/30 border-${statusColor}-700` : 'bg-gray-800/60 border-gray-700'} 
                   hover:bg-gray-700/70 cursor-pointer transition-all`}
                 onClick={() => handleRegionSelect(region.name)}
               >
                 <div className="flex justify-between items-center mb-1.5">
                   <div className="flex items-center gap-1.5">
                     <MapPin size={16} className={`text-${statusColor}-400`} />
                     <span className="text-white font-medium">{region.name}</span>
                   </div>
                   <span className={`text-xs px-2 py-1 rounded-full bg-${statusColor}-900/40 text-${statusColor}-300`}>
                     {region.value}
                   </span>
                 </div>
                 
                 <div className="flex items-center gap-2">
                   <div className="w-full bg-gray-700 rounded-full h-2">
                     <div 
                       className={`h-2 rounded-full bg-${statusColor}-600`}
                       style={{ width: `${(region.value / maxRegionValue) * 100}%` }}
                     ></div>
                   </div>
                   <span className="text-xs text-gray-400 w-12 text-right">
                     {Math.round((region.value / maxRegionValue) * 100)}%
                   </span>
                 </div>
               </div>
             ))}
           </div>
         </div>
       </div>
     );
   }
   
   // Уровень 2: Список дилеров для выбранного региона
   if (activeDetailLevel === 2 && selectedRegion) {
     const dealers = dealerData[selectedStatus][selectedRegion] || [];
     const maxDealerValue = dealers.length > 0 ? getMaxValue(dealers) : 0;
     
     return (
       <div className="h-full flex flex-col">
         <div className="flex items-center gap-2 p-3 border-b border-gray-700 bg-gray-800/70">
           <button 
             onClick={handleBack}
             className="p-1 rounded-full hover:bg-gray-700"
           >
             <ChevronLeft size={18} />
           </button>
           <h3 className="text-lg font-medium text-white">
             <span className={`text-${statusColor}-400 text-sm mr-1`}>{statusTitle}</span>
             {selectedRegion}
           </h3>
         </div>
         
         <div className="flex-1 overflow-y-auto p-2">
           <div className="text-sm text-gray-400 mb-3 px-2">Список дилеров:</div>
           
           <div className="space-y-2">
             {dealers.map((dealer, index) => (
               <div 
                 key={index} 
                 className={`p-3 rounded-lg border ${selectedDealer === dealer.name ? `bg-${statusColor}-900/30 border-${statusColor}-700` : 'bg-gray-800/60 border-gray-700'} 
                   hover:bg-gray-700/70 cursor-pointer transition-all`}
                 onClick={() => handleDealerSelect(dealer.name)}
               >
                 <div className="flex justify-between items-center mb-1.5">
                   <div className="flex items-center gap-1.5">
                     <Users size={16} className="text-gray-400" />
                     <span className="text-white font-medium">{dealer.name}</span>
                   </div>
                   <span className={`text-xs px-2 py-1 rounded-full bg-${statusColor}-900/40 text-${statusColor}-300`}>
                     {dealer.value}
                   </span>
                 </div>
                 
                 <div className="flex items-center gap-2">
                   <div className="w-full bg-gray-700 rounded-full h-2">
                     <div 
                       className={`h-2 rounded-full bg-${statusColor}-600`}
                       style={{ width: `${(dealer.value / maxDealerValue) * 100}%` }}
                     ></div>
                   </div>
                   <span className="text-xs text-gray-400 w-12 text-right">
                     {Math.round((dealer.value / maxDealerValue) * 100)}%
                   </span>
                 </div>
               </div>
             ))}
           </div>
         </div>
       </div>
     );
   }
   
   // Уровень 3: Детализация по моделям для выбранного дилера
   if (activeDetailLevel === 3 && selectedDealer && selectedRegion) {
     const dealers = dealerData[selectedStatus][selectedRegion] || [];
     const dealer = dealers.find(d => d.name === selectedDealer);
     
     if (!dealer) return null;
     
     return (
       <div className="h-full flex flex-col">
         <div className="flex items-center gap-2 p-3 border-b border-gray-700 bg-gray-800/70">
           <button 
             onClick={handleBack}
             className="p-1 rounded-full hover:bg-gray-700"
           >
             <ChevronLeft size={18} />
           </button>
           <div className="flex flex-col">
             <h3 className="text-lg font-medium text-white">{selectedDealer}</h3>
             <div className="flex items-center text-sm">
               <span className={`text-${statusColor}-400 mr-1`}>{statusTitle}</span>
               <span className="text-gray-400">• {selectedRegion}</span>
             </div>
           </div>
         </div>
         
         <div className="flex-1 overflow-y-auto p-3">
           <div className="bg-gray-800/70 rounded-lg p-4 mb-4 border border-gray-700">
             <div className="flex justify-between items-center mb-3">
               <div className="text-sm text-gray-400">Всего автомобилей:</div>
               <div className="text-2xl font-bold text-white">{dealer.value}</div>
             </div>
             
             <div className="mb-2 text-sm text-gray-400">Распределение по моделям:</div>
             
             <div className="space-y-2">
               {dealer.models.map((model, idx) => {
                 const percentage = (model.count / dealer.value) * 100;
                 
                 return (
                   <div key={idx} className="bg-gray-700/50 rounded-lg p-2 border border-gray-600/50">
                     <div className="flex justify-between items-center mb-1">
                       <div className="flex items-center gap-1.5">
                         <Car size={14} className="text-gray-400" />
                         <span className="text-white">{model.name}</span>
                       </div>
                       <span className={`text-xs px-2 py-1 rounded-full bg-${statusColor}-900/40 text-${statusColor}-300`}>
                         {model.count}
                       </span>
                     </div>
                     
                     <div className="flex items-center gap-2">
                       <div className="w-full bg-gray-700 rounded-full h-2">
                         <div 
                           className={`h-2 rounded-full bg-${statusColor}-600`}
                           style={{ width: `${percentage}%` }}
                         ></div>
                       </div>
                       <span className="text-xs text-gray-400 w-10 text-right">
                         {Math.round(percentage)}%
                       </span>
                     </div>
                   </div>
                 );
               })}
             </div>
           </div>
           
           <div className="bg-gray-800/70 rounded-lg p-4 border border-gray-700">
             <h4 className="font-medium text-white mb-3">Рекомендуемые действия:</h4>
             <ul className="space-y-2">
               <li className="flex items-start gap-2 text-sm">
                 <Clock size={16} className="text-gray-400 mt-0.5" />
                 <span className="text-gray-300">Запросить обновление статуса</span>
               </li>
               <li className="flex items-start gap-2 text-sm">
                 <AlertTriangle size={16} className="text-yellow-400 mt-0.5" />
                 <span className="text-gray-300">Проверить договоры на отложенные поставки</span>
               </li>
               <li className="flex items-start gap-2 text-sm">
                 <Zap size={16} className="text-green-400 mt-0.5" />
                 <span className="text-gray-300">Связаться с менеджером дилерского центра</span>
               </li>
             </ul>
           </div>
         </div>
       </div>
     );
   }
   
   return null;
 };

 // Общий шаблон с интерактивной боковой панелью
 return (
   <div className="bg-gradient-to-br from-gray-900 to-gray-950 p-4 font-sans text-gray-300 min-h-screen relative">
     {/* Плавающая боковая панель */}
     <div 
       className={`fixed top-0 right-0 h-full w-80 bg-gray-850 backdrop-blur-sm border-l border-gray-700 shadow-xl transform transition-transform duration-300 z-50 
       ${showSidebar ? 'translate-x-0' : 'translate-x-full'}`}
       style={{ backgroundColor: 'rgba(17, 24, 39, 0.95)' }}
     >
       {renderSidebarContent()}
       
       {showSidebar && activeDetailLevel > 0 && (
         <button 
           className="absolute top-1/2 -left-10 transform -translate-y-1/2 bg-gray-800 text-gray-400 p-2 rounded-l-lg border border-r-0 border-gray-700"
           onClick={() => setShowSidebar(false)}
         >
           <ChevronRight size={18} />
         </button>
       )}
     </div>
     
     {/* Плавающая кнопка для возврата к сайдбару */}
     {!showSidebar && activeDetailLevel > 0 && (
       <button 
         className="fixed top-1/2 right-0 transform -translate-y-1/2 bg-gray-800 text-gray-400 p-2 rounded-l-lg border border-r-0 border-gray-700 z-50"
         onClick={() => setShowSidebar(true)}
       >
         <ChevronLeft size={18} />
       </button>
     )}
     
     {/* Главная панель - обновленный дизайн */}
     <div className="">
       {/* Шапка с индикатором пути */}
       <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg p-3 mb-5 border border-gray-700/50 shadow-md flex justify-between items-center">
         <div className="flex items-center gap-2">
           <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
             <BarChart3 size={20} className="text-white" />
           </div>
           <div>
             <h1 className="text-xl font-bold text-white">Мониторинг продаж автомобилей</h1>
             <div className="text-sm text-gray-400 flex items-center gap-1">
               <span>Дилерский центр</span>
               <span>•</span>
               <span>Ташкент</span>
             </div>
           </div>
         </div>
         
         <div className="flex items-center gap-2">
           <div className="px-3 py-1.5 bg-gray-700/70 rounded-lg text-sm text-white flex items-center gap-1.5">
             <Calendar size={14} />
             <span>{new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
           </div>
         </div>
       </div>
       
       {/* Информационная панель - обновленный дизайн */}
       <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg mb-5 border border-gray-700/50 shadow-md overflow-hidden">
         <div className="flex justify-between items-center p-3 border-b border-gray-700">
           <h2 className="text-base font-medium text-white flex items-center gap-2">
             <Activity size={18} className="text-blue-400" />
             Общие показатели
           </h2>
           <span className="text-sm text-gray-400">Активные задачи: <span className="text-white font-medium">89</span>/276</span>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
           <div 
             onClick={() => handleStatusSelect('notShipped')}
             className="relative p-4 border-r border-gray-700 cursor-pointer hover:bg-gray-700/30 transition-colors group"
           >
             <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-900/30"></div>
             <div className="absolute bottom-0 left-0 h-1 bg-blue-600" 
                  style={{ width: `${(contractData.notShipped / (contractData.notShipped + contractData.inTransit + contractData.delivered)) * 100}%` }}></div>
             
             <div className="flex items-start gap-3">
               <div className="w-12 h-12 rounded-full bg-blue-900/40 flex items-center justify-center">
                 <Archive size={22} className="text-blue-400" />
               </div>
               <div className="flex-1">
                 <div className="text-2xl font-bold text-white mb-1">{contractData.notShipped}</div>
                 <div className="text-sm text-blue-300 flex items-center justify-between">
                   <span>Не отгружены 48ч</span>
                   <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                 </div>
               </div>
             </div>
           </div>
           
           <div 
             onClick={() => handleStatusSelect('inTransit')}
             className="relative p-4 border-r border-gray-700 cursor-pointer hover:bg-gray-700/30 transition-colors group"
           >
             <div className="absolute bottom-0 left-0 w-full h-1 bg-yellow-900/30"></div>
             <div className="absolute bottom-0 left-0 h-1 bg-yellow-600" 
                  style={{ width: `${(contractData.inTransit / (contractData.notShipped + contractData.inTransit + contractData.delivered)) * 100}%` }}></div>
             
             <div className="flex items-start gap-3">
               <div className="w-12 h-12 rounded-full bg-yellow-900/40 flex items-center justify-center">
                 <Truck size={22} className="text-yellow-400" />
               </div>
               <div className="flex-1">
                 <div className="text-2xl font-bold text-white mb-1">{contractData.inTransit}</div>
                 <div className="text-sm text-yellow-300 flex items-center justify-between">
                   <span>В пути 3 дней</span>
                   <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                 </div>
               </div>
             </div>
           </div>
           
           <div className="relative p-4 border-l-0 border-gray-700">
             <div className="absolute bottom-0 left-0 w-full h-1 bg-green-900/30"></div>
             <div className="absolute bottom-0 left-0 h-1 bg-green-600" 
                  style={{ width: `${(contractData.delivered / (contractData.notShipped + contractData.inTransit + contractData.delivered)) * 100}%` }}></div>
             
             <div className="flex items-start gap-3">
               <div className="w-12 h-12 rounded-full bg-green-900/40 flex items-center justify-center">
                 <Check size={22} className="text-green-400" />
               </div>
               <div>
                 <div className="text-2xl font-bold text-white mb-1">{contractData.delivered}</div>
                 <div className="text-sm text-green-300">Доставлено</div>
               </div>
             </div>
           </div>
         </div>
       </div>
       
       {/* Сетка отчетов */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
         {/* Обновленный график продаж */}
         <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg border border-gray-700/50 shadow-md overflow-hidden">
           <div className="flex justify-between items-center p-3 border-b border-gray-700">
             <h3 className="text-base font-medium text-white flex items-center gap-2">
               <BarChart3 size={18} className="text-purple-400" />
               Продажи за последние 30 дней
             </h3>
             <div className="flex items-center gap-1">
               <span className="text-xl font-bold text-white">98,546</span>
               <span className="px-2 py-0.5 bg-green-900/50 text-green-400 text-xs rounded-md border border-green-800">
                 +26.7%
               </span>
             </div>
           </div>
           
           <div className="p-4">
             <div className="relative h-48">
               <div className="absolute inset-0 flex items-end justify-between p-1">
   {salesData.map((value, index) => (
                 <div key={index} className="group relative flex flex-col items-center">
                   <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 bg-purple-800 text-white py-1 px-2 rounded text-xs whitespace-nowrap transition-opacity shadow-lg">
                     {value} заказов в {months[index]}
                   </div>
                   <div 
                     className="w-6 rounded-t-md bg-gradient-to-t from-purple-600 to-purple-400 group-hover:from-purple-500 group-hover:to-purple-300 transition-colors relative overflow-hidden"
                     style={{ height: `${(value / maxSales) * 100}%` }}
                   >
                     <div className="absolute inset-0 opacity-20 bg-grid-pattern"></div>
                   </div>
                   <div className="text-xs font-medium text-gray-400 mt-2">{months[index]}</div>
                 </div>
               ))}
               </div>
               
               {/* Сетка для фона */}
               <div className="absolute inset-0 grid grid-rows-4 pointer-events-none">
                 {[0, 1, 2, 3].map((i) => (
                   <div key={i} className="border-t border-gray-700/50 flex items-center">
                     <span className="text-xs text-gray-500 w-8">{Math.round(maxSales - (i * (maxSales / 4)))}</span>
                   </div>
                 ))}
               </div>
             </div>
             
             {/* Фильтры */}
             <div className="border-t border-gray-700 mt-4 pt-3 flex justify-between items-center">
               <div className="inline-flex rounded-md shadow-sm">
                 <button
                   className={`px-4 py-1.5 text-xs font-medium rounded-l-md ${
                     activeTab === 'месяц' 
                       ? 'bg-purple-700 text-white' 
                       : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                   }`}
                   onClick={() => setActiveTab('месяц')}
                 >
                   МЕСЯЦЫ
                 </button>
                 <button
                   className={`px-4 py-1.5 text-xs font-medium rounded-r-md ${
                     activeTab === 'год' 
                       ? 'bg-purple-700 text-white' 
                       : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                   }`}
                   onClick={() => setActiveTab('год')}
                 >
                   ГОДЫ
                 </button>
               </div>
               
               <button className="flex items-center gap-1 text-xs text-gray-400 px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600">
                 <Filter size={12} />
                 <span>Фильтры</span>
               </button>
             </div>
           </div>
         </div>
         
         {/* Обновленная таблица с контрактами */}
         <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg border border-gray-700/50 shadow-md overflow-hidden">
           <div className="flex justify-between items-center p-3 border-b border-gray-700">
             <h3 className="text-base font-medium text-white flex items-center gap-2">
               <AlertTriangle size={18} className="text-yellow-400" />
               Приостановленные контракты
             </h3>
             <div className="text-sm text-yellow-300">
               Всего: <span className="font-bold">{totalCars}</span>
             </div>
           </div>
           
           <div className="p-3">
             <div className="text-sm text-gray-300 mb-2">
               Автомобили, не забранные более 5 дней:
             </div>
             
             <div className="rounded-lg overflow-hidden border border-gray-700">
               <table className="w-full text-sm">
                 <thead className="bg-gray-900/80">
                   <tr>
                     <th className="px-3 py-2 text-left text-gray-400 font-medium">Модель</th>
                     <th className="px-3 py-2 text-center text-gray-400 font-medium">Кол-во</th>
                     <th className="px-3 py-2 text-center text-gray-400 font-medium">Дней</th>
                     <th className="px-3 py-2 text-center text-gray-400 font-medium">Действия</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-700">
                   {carData.map((car, index) => (
                     <tr key={index} className={index % 2 === 0 ? 'bg-gray-800/60' : 'bg-gray-850/70'}>
                       <td className="px-3 py-2 font-medium text-white flex items-center gap-1.5">
                         <Car size={14} className="text-gray-400" />
                         {car.model}
                       </td>
                       <td className="px-3 py-2 text-center text-gray-300">{car.count}</td>
                       <td className="px-3 py-2 text-center">
                         <span className={`inline-block px-2 py-0.5 rounded-full text-xs 
                           ${car.days > 7 ? 'bg-red-900/30 text-red-400 border border-red-800/50' : 
                              'bg-yellow-900/30 text-yellow-400 border border-yellow-800/50'}`}>
                           {car.days} дн.
                         </span>
                       </td>
                       <td className="px-3 py-2 text-center">
                         <button className="text-xs text-blue-400 hover:text-blue-300 underline">
                           Детали
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
                 <tfoot className="bg-gray-900/80">
                   <tr>
                     <td className="px-3 py-2 font-medium text-white">Всего</td>
                     <td className="px-3 py-2 text-center text-white font-bold">{totalCars}</td>
                     <td colSpan={2} className="px-3 py-2"></td>
                   </tr>
                 </tfoot>
               </table>
             </div>
             
             <div className="mt-3 grid grid-cols-2 gap-2">
               <button className="flex items-center justify-center gap-1.5 text-sm text-gray-300 border border-gray-600 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                 <Clock size={14} className="text-yellow-400" />
                 <span>История задержек</span>
               </button>
               <button className="flex items-center justify-center gap-1.5 text-sm text-gray-300 border border-gray-600 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                 <Zap size={14} className="text-green-400" />
                 <span>Автоматическое оповещение</span>
               </button>
             </div>
           </div>
         </div>
       </div>
       
       {/* Последний блок: последние заказы + города */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
         {/* Последние заказы */}
         <div className="lg:col-span-2 bg-gray-800/70 backdrop-blur-sm rounded-lg border border-gray-700/50 shadow-md overflow-hidden">
           <div className="flex justify-between items-center p-3 border-b border-gray-700">
             <h3 className="text-base font-medium text-white flex items-center gap-2">
               <Package size={18} className="text-blue-400" />
               Последние заказы
             </h3>
             <div className="text-sm text-gray-400">
               Сегодня: <span className="text-white font-medium">12</span> новых
             </div>
           </div>
           
           <div className="p-3">
             <div className="rounded-lg overflow-hidden border border-gray-700">
               <table className="w-full text-sm">
                 <thead className="bg-gray-900/80">
                   <tr>
                     <th className="px-3 py-2 text-left text-gray-400 font-medium">№ Заказа</th>
                     <th className="px-3 py-2 text-left text-gray-400 font-medium">Клиент</th>
                     <th className="px-3 py-2 text-left text-gray-400 font-medium">Модель</th>
                     <th className="px-3 py-2 text-right text-gray-400 font-medium">Сумма (UZS)</th>
                     <th className="px-3 py-2 text-center text-gray-400 font-medium">Статус</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-700">
                   {recentOrders.map((order, index) => (
                     <tr key={index} className={index % 2 === 0 ? 'bg-gray-800/60' : 'bg-gray-850/70'}>
                       <td className="px-3 py-2 font-medium text-white">{order.id}</td>
                       <td className="px-3 py-2 text-gray-300">{order.client}</td>
                       <td className="px-3 py-2 text-gray-300 flex items-center gap-1.5">
                         <Car size={14} className="text-gray-400" />
                         {order.model}
                       </td>
                       <td className="px-3 py-2 text-right text-gray-300 font-medium">{order.price.toLocaleString()}</td>
                       <td className="px-3 py-2 text-center">
                         <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                           order.status === 'Доставлен' ? 'bg-green-900/30 text-green-400 border border-green-800/50' :
                           order.status === 'В пути' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-800/50' :
                           'bg-blue-900/30 text-blue-400 border border-blue-800/50'
                         }`}>
                           {order.status}
                         </span>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
             
             <div className="mt-3 flex justify-end">
               <button className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300">
                 <span>Показать все заказы</span>
                 <ChevronRight size={16} />
               </button>
             </div>
           </div>
         </div>
         
         {/* Города */}
         <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg border border-gray-700/50 shadow-md overflow-hidden">
           <div className="flex justify-between items-center p-3 border-b border-gray-700">
             <h3 className="text-base font-medium text-white flex items-center gap-2">
               <MapPin size={18} className="text-red-400" />
               Распределение по городам
             </h3>
           </div>
           
           <div className="p-4">
             <div className="space-y-3">
               {cityData.map((city, index) => (
                 <div key={index} className="group">
                   <div className="flex justify-between text-sm mb-1">
                     <div className="flex items-center gap-1.5">
                       <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-red-500' : index === 1 ? 'bg-orange-500' : index === 2 ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                       <span className="text-white">{city.name}</span>
                     </div>
                     <span className="text-gray-400 font-medium">{city.value}</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
                       <div 
                         className={`h-2.5 rounded-full ${index === 0 ? 'bg-gradient-to-r from-red-600 to-red-400' : 
                                    index === 1 ? 'bg-gradient-to-r from-orange-600 to-orange-400' : 
                                    index === 2 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' : 
                                    'bg-gradient-to-r from-blue-600 to-blue-400'}`}
                         style={{ width: `${(city.value / maxCityValue) * 100}%` }}
                       ></div>
                     </div>
                     <span className="text-xs text-gray-400 w-10 text-right">
                       {Math.round((city.value / maxCityValue) * 100)}%
                     </span>
                   </div>
                 </div>
               ))}
             </div>
             
             <div className="mt-5 p-3 bg-gray-750/60 rounded-lg border border-gray-700">
               <div className="flex justify-between items-center mb-1">
                 <div className="text-sm text-white font-medium">Всего по регионам:</div>
                 <div className="text-xl font-bold text-white">{cityData.reduce((sum, city) => sum + city.value, 0)}</div>
               </div>
               <div className="text-xs text-gray-400">Обновлено: сегодня в 14:30</div>
             </div>
           </div>
         </div>
       </div>
     </div>
   </div>
 );
};

export default SalesDashboard;