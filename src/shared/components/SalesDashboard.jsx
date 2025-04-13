'use client';
import React, { useState } from 'react';
import { Package, Clock, Check, AlertTriangle, Filter } from 'lucide-react';

// Главный компонент панели мониторинга продаж автомобилей
const SalesDashboard = () => {
  const [activeTab, setActiveTab] = useState('месяц');

  // Стандартные данные
  const contractData = {
    new: 64,
    inProgress: 48,
    completed: 96
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

  return (
    <div className="bg-gray-900 p-4 font-sans text-gray-300">
      {/* Главный заголовок панели */}
      <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
        <h1 className="text-xl font-bold text-white">Панель мониторинга продаж автомобилей</h1>
        <div className="text-sm text-gray-400">Дилерский центр г. Ташкент</div>
      </div>
      
      {/* Блок общей информации */}
      <div className="bg-gray-800 rounded-lg p-4 mb-4 border border-gray-700">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-medium text-white">Общая информация</h2>
          <span className="text-sm text-gray-400">Активные задачи: 89/276</span>
        </div>
        
        <div className="flex gap-4">
          <div className="flex-1 bg-blue-900/30 rounded-lg p-3 border border-blue-800/50">
            <div className="flex items-center gap-2">
              <Package size={18} className="text-blue-400" />
              <div>
                <div className="text-lg font-bold text-white">{contractData.new}</div>
                <div className="text-xs text-blue-300">Новые</div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 bg-yellow-900/30 rounded-lg p-3 border border-yellow-800/50">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-yellow-400" />
              <div>
                <div className="text-lg font-bold text-white">{contractData.inProgress}</div>
                <div className="text-xs text-yellow-300">В процессе</div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 bg-green-900/30 rounded-lg p-3 border border-green-800/50">
            <div className="flex items-center gap-2">
              <Check size={18} className="text-green-400" />
              <div>
                <div className="text-lg font-bold text-white">{contractData.completed}</div>
                <div className="text-xs text-green-300">Доставлено</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Заголовок раздела */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-white bg-blue-900/40 rounded-lg px-4 py-2 inline-block border border-blue-800/50">
          РЕАЛИЗАЦИЯ АВТОМОБИЛЕЙ
        </h2>
      </div>
      
      {/* Блок статистики */}
      <div className="bg-gray-800 rounded-lg p-4 mb-4 border border-gray-700">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-base font-medium text-white">Заказы за последние 30 дней</h3>
            <div className="flex items-center">
              <span className="text-xl font-bold text-white">98,546</span>
              <span className="ml-2 px-2 py-0.5 bg-green-900/50 text-green-400 text-xs rounded-md border border-green-800">
                +26.7%
              </span>
            </div>
          </div>
        </div>
        
        {/* График продаж с подписями */}
        {/* <div className="relative h-32 mb-3"> */}
          {/* <div className="flex items-end justify-between h-full">
            {salesData.map((value, index) => (
              <div key={index} className="group relative flex flex-col items-center">
                <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 bg-blue-900 text-white py-1 px-2 rounded text-xs whitespace-nowrap transition-opacity">
                  {value}
                </div>
                <div 
                  className="w-6 rounded-t bg-blue-600 group-hover:bg-blue-500 transition-colors"
                  style={{ height: `${(value / maxSales) * 100}%` }}
                ></div>
                <div className="text-xs text-gray-400 mt-1">{months[index]}</div>
              </div>
            ))}
          </div> */}
        {/* </div> */}
        
        {/* Таблица последних заказов */}
        <div className="border border-gray-700 rounded-lg overflow-hidden mb-3">
          <table className="w-full text-xs">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-3 py-2 text-left text-gray-400">№ Заказа</th>
                <th className="px-3 py-2 text-left text-gray-400">Клиент</th>
                <th className="px-3 py-2 text-left text-gray-400">Модель</th>
                <th className="px-3 py-2 text-right text-gray-400">Сумма (UZS)</th>
                <th className="px-3 py-2 text-center text-gray-400">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {recentOrders.map((order, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-900'}>
                  <td className="px-3 py-2 font-medium text-white">{order.id}</td>
                  <td className="px-3 py-2 text-gray-300">{order.client}</td>
                  <td className="px-3 py-2 text-gray-300">{order.model}</td>
                  <td className="px-3 py-2 text-right text-gray-300">{order.price.toLocaleString()}</td>
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
        
        {/* Переключатель месяц/год */}
        <div className="flex justify-between items-center border-t border-gray-700 pt-3">
          <div className="inline-flex rounded-md shadow-sm">
            <button
              className={`px-4 py-1.5 text-xs font-medium rounded-l-md ${
                activeTab === 'месяц' 
                  ? 'bg-blue-700 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setActiveTab('месяц')}
            >
              МЕСЯЦЫ
            </button>
            <button
              className={`px-4 py-1.5 text-xs font-medium rounded-r-md ${
                activeTab === 'год' 
                  ? 'bg-blue-700 text-white' 
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
      
      {/* Блок с городами и контрактами */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Города Узбекистана */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-base font-medium text-white mb-3">Распределение по городам</h3>
          
          {cityData.map((city, index) => (
            <div key={index} className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white">{city.name}</span>
                <span className="text-gray-400">{city.value}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(city.value / maxCityValue) * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-400 w-8 text-right">
                  {Math.round((city.value / maxCityValue) * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Блок контрактов */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-yellow-500" />
            <h3 className="text-base font-medium text-white">Приостановленные контракты</h3>
          </div>
          
          <p className="text-xs text-gray-300 mb-3">
            Автомобили, не забранные более 5 дней:
          </p>
          
          {/* Таблица моделей автомобилей */}
          <div className="border border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-400">Модель</th>
                  <th className="px-3 py-2 text-center text-gray-400">Кол-во</th>
                  <th className="px-3 py-2 text-center text-gray-400">Дней</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {carData.map((car, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-900'}>
                    <td className="px-3 py-2 font-medium text-white">{car.model}</td>
                    <td className="px-3 py-2 text-center text-gray-300">{car.count}</td>
                    <td className="px-3 py-2 text-center text-yellow-400">{car.days}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-900">
                <tr>
                  <td className="px-3 py-2 font-medium text-white">Всего</td>
                  <td className="px-3 py-2 text-center text-white font-bold">{totalCars}</td>
                  <td className="px-3 py-2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          <div className="flex justify-between mt-3 text-xs text-gray-400">
            <div>МЕСЯЦЫ</div>
            <div>ГОДЫ</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;