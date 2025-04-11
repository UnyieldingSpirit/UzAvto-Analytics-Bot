"use client";

import { useState, useRef, useEffect } from 'react';

// Type definitions
interface Model {
  id: number;
  name: string;
  color: string;
  totalSales: number;
}

interface Dealer {
  modelId: number;
  dealerId: number;
  dealerName: string;
  modelName: string;
  sales: number;
  color: string;
}

interface Salesperson {
  modelId: number;
  dealerId: number;
  salespersonId: number;
  salespersonName: string;
  modelName: string;
  dealerName: string;
  sales: number;
  color: string;
}

interface DashboardData {
  modelData: Model[];
  dealerData: Dealer[];
  salespersonData: Salesperson[];
}

export default function StatisticsPage() {
  // State variables
  const [view, setView] = useState<'models' | 'dealers' | 'salespeople'>('models');
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);
  const [data, setData] = useState<DashboardData>({
    modelData: [],
    dealerData: [],
    salespersonData: []
  });

  // Chart refs
  const modelBarChartRef = useRef<HTMLDivElement>(null);
  const modelPieChartRef = useRef<HTMLDivElement>(null);
  const dealerBarChartRef = useRef<HTMLDivElement>(null);
  const dealerPieChartRef = useRef<HTMLDivElement>(null);
  const salespersonBarChartRef = useRef<HTMLDivElement>(null);
  const salespersonPieChartRef = useRef<HTMLDivElement>(null);

  // Computed properties for filtered data
  const filteredDealerData = selectedModel
    ? data.dealerData.filter(d => d.modelId === selectedModel.id)
    : [];

  const filteredSalespersonData = (selectedModel && selectedDealer)
    ? data.salespersonData.filter(
        d => d.modelId === selectedModel.id && d.dealerId === selectedDealer.dealerId
      )
    : [];

  // Event handlers
  const handleModelClick = (model: Model) => {
    setSelectedModel(model);
    setView('dealers');
  };

  const handleDealerClick = (dealer: Dealer) => {
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

  // Generate demo data function
  const generateDemoData = (): DashboardData => {
    const models = [
      { id: 1, name: 'Model S', color: '#8884d8' },
      { id: 2, name: 'Model 3', color: '#83a6ed' },
      { id: 3, name: 'Model X', color: '#8dd1e1' },
      { id: 4, name: 'Model Y', color: '#82ca9d' },
      { id: 5, name: 'Cybertruck', color: '#a4de6c' },
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

    // Generate dealer-level data for each model
    const dealerData: Dealer[] = [];
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

    // Generate salesperson-level data for each dealer and model
    const salespersonData: Salesperson[] = [];
    dealerData.forEach(dealerRecord => {
      const dealerSalespeople = salespeople.filter(sp => sp.dealerId === dealerRecord.dealerId);
      
      let remainingSales = dealerRecord.sales;
      dealerSalespeople.forEach((salesperson, index) => {
        // Last salesperson gets remaining sales to ensure total matches
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

    return { modelData, dealerData, salespersonData };
  };

  // Chart rendering functions
  const renderModelCharts = () => {
    if (!modelBarChartRef.current || !modelPieChartRef.current || !data.modelData.length) return;
    
    // Clear previous charts
    modelBarChartRef.current.innerHTML = '';
    modelPieChartRef.current.innerHTML = '';
    
    // Create bar chart
    const barChartContent = document.createElement('div');
    barChartContent.className = 'flex items-end justify-around h-full';
    
    data.modelData.forEach(model => {
      const height = (model.totalSales / Math.max(...data.modelData.map(m => m.totalSales))) * 80;
      
      const barWrapper = document.createElement('div');
      barWrapper.className = 'flex flex-col items-center group cursor-pointer';
      barWrapper.addEventListener('click', () => handleModelClick(model));
      
      const bar = document.createElement('div');
      bar.className = 'w-16 rounded-t transition-all duration-300 group-hover:opacity-90';
      bar.style.height = `${height}%`;
      bar.style.backgroundColor = model.color;
      bar.setAttribute('data-model-id', model.id.toString());
      
      const label = document.createElement('div');
      label.className = 'text-xs text-gray-300 mt-2';
      label.textContent = model.name;
      
      const value = document.createElement('div');
      value.className = 'text-sm font-medium text-white mt-1';
      value.textContent = model.totalSales.toString();
      
      barWrapper.appendChild(bar);
      barWrapper.appendChild(label);
      barWrapper.appendChild(value);
      barChartContent.appendChild(barWrapper);
    });
    
    modelBarChartRef.current.appendChild(barChartContent);
    
    // Create pie chart
    const total = data.modelData.reduce((sum, model) => sum + model.totalSales, 0);
    let currentAngle = 0;
    
    const pieContainer = document.createElement('div');
    pieContainer.className = 'relative w-48 h-48 mx-auto';
    
    // Create legend
    const legend = document.createElement('div');
    legend.className = 'absolute -right-24 top-0 text-sm';
    
    data.modelData.forEach((model) => {
      const slice = document.createElement('div');
      const percentage = (model.totalSales / total) * 100;
      const angle = (percentage / 100) * 360;
      
      slice.className = 'absolute top-0 left-0 w-full h-full cursor-pointer transform origin-center';
      slice.style.clip = `rect(0px, 96px, 96px, 48px)`;
      slice.addEventListener('click', () => handleModelClick(model));
      
      const sliceInner = document.createElement('div');
      sliceInner.className = 'absolute top-0 left-0 w-full h-full transform origin-center';
      sliceInner.style.clip = `rect(0px, 48px, 96px, 0px)`;
      sliceInner.style.transform = `rotate(${currentAngle}deg)`;
      
      const sliceFill = document.createElement('div');
      sliceFill.className = 'absolute top-0 left-0 w-full h-full bg-blue-500 transform origin-center';
      sliceFill.style.backgroundColor = model.color;
      sliceFill.style.transform = angle <= 180 ? `rotate(${angle}deg)` : 'rotate(180deg)';
      
      sliceInner.appendChild(sliceFill);
      slice.appendChild(sliceInner);
      
      if (angle > 180) {
        const sliceInner2 = document.createElement('div');
        sliceInner2.className = 'absolute top-0 left-0 w-full h-full transform origin-center';
        sliceInner2.style.clip = `rect(0px, 48px, 96px, 0px)`;
        sliceInner2.style.transform = `rotate(${currentAngle + 180}deg)`;
        
        const sliceFill2 = document.createElement('div');
        sliceFill2.className = 'absolute top-0 left-0 w-full h-full transform origin-center';
        sliceFill2.style.backgroundColor = model.color;
        sliceFill2.style.transform = `rotate(${angle - 180}deg)`;
        
        sliceInner2.appendChild(sliceFill2);
        slice.appendChild(sliceInner2);
      }
      
      pieContainer.appendChild(slice);
      
      // Add to legend
      const legendItem = document.createElement('div');
      legendItem.className = 'flex items-center mb-2 cursor-pointer';
      legendItem.addEventListener('click', () => handleModelClick(model));
      
      const colorBox = document.createElement('div');
      colorBox.className = 'w-3 h-3 mr-2';
      colorBox.style.backgroundColor = model.color;
      
      const labelText = document.createElement('span');
      labelText.textContent = `${model.name}: ${percentage.toFixed(1)}%`;
      
      legendItem.appendChild(colorBox);
      legendItem.appendChild(labelText);
      legend.appendChild(legendItem);
      
      currentAngle += angle;
    });
    
    // Center circle for donut effect
    const centerCircle = document.createElement('div');
    centerCircle.className = 'absolute top-1/4 left-1/4 w-1/2 h-1/2 rounded-full bg-gray-800 flex items-center justify-center text-white';
    centerCircle.textContent = total.toString();
    
    pieContainer.appendChild(centerCircle);
    modelPieChartRef.current.appendChild(pieContainer);
    modelPieChartRef.current.appendChild(legend);
  };

  const renderDealerCharts = () => {
    if (!dealerBarChartRef.current || !dealerPieChartRef.current || !filteredDealerData.length || !selectedModel) return;
    
    // Clear previous charts
    dealerBarChartRef.current.innerHTML = '';
    dealerPieChartRef.current.innerHTML = '';
    
    // Create bar chart
    const barChartContent = document.createElement('div');
    barChartContent.className = 'flex items-end justify-around h-full';
    
    filteredDealerData.forEach(dealer => {
      const height = (dealer.sales / Math.max(...filteredDealerData.map(d => d.sales))) * 80;
      
      const barWrapper = document.createElement('div');
      barWrapper.className = 'flex flex-col items-center group cursor-pointer';
      barWrapper.addEventListener('click', () => handleDealerClick(dealer));
      
      const bar = document.createElement('div');
      bar.className = 'w-16 rounded-t transition-all duration-300 group-hover:opacity-90';
      bar.style.height = `${height}%`;
      bar.style.backgroundColor = selectedModel.color;
      bar.setAttribute('data-dealer-id', dealer.dealerId.toString());
      
      const label = document.createElement('div');
      label.className = 'text-xs text-gray-300 mt-2';
      label.textContent = dealer.dealerName;
      
      const value = document.createElement('div');
      value.className = 'text-sm font-medium text-white mt-1';
      value.textContent = dealer.sales.toString();
      
      barWrapper.appendChild(bar);
      barWrapper.appendChild(label);
      barWrapper.appendChild(value);
      barChartContent.appendChild(barWrapper);
    });
    
    dealerBarChartRef.current.appendChild(barChartContent);
    
    // Create pie chart - similar approach as model pie chart
    const total = filteredDealerData.reduce((sum, dealer) => sum + dealer.sales, 0);
    let currentAngle = 0;
    
    const pieContainer = document.createElement('div');
    pieContainer.className = 'relative w-48 h-48 mx-auto';
    
    // Create legend
    const legend = document.createElement('div');
    legend.className = 'absolute -right-24 top-0 text-sm';
    
    filteredDealerData.forEach((dealer, index) => {
      const slice = document.createElement('div');
      const percentage = (dealer.sales / total) * 100;
      const angle = (percentage / 100) * 360;
      
      // Similar pie chart implementation as in renderModelCharts
      slice.className = 'absolute top-0 left-0 w-full h-full cursor-pointer transform origin-center';
      slice.style.clip = `rect(0px, 96px, 96px, 48px)`;
      slice.addEventListener('click', () => handleDealerClick(dealer));
      
      const sliceInner = document.createElement('div');
      sliceInner.className = 'absolute top-0 left-0 w-full h-full transform origin-center';
      sliceInner.style.clip = `rect(0px, 48px, 96px, 0px)`;
      sliceInner.style.transform = `rotate(${currentAngle}deg)`;
      
      const sliceFill = document.createElement('div');
      sliceFill.className = 'absolute top-0 left-0 w-full h-full bg-blue-500 transform origin-center';
      sliceFill.style.backgroundColor = selectedModel.color;
      sliceFill.style.opacity = (0.7 + (index * 0.1)).toString();
      sliceFill.style.transform = angle <= 180 ? `rotate(${angle}deg)` : 'rotate(180deg)';
      
      sliceInner.appendChild(sliceFill);
      slice.appendChild(sliceInner);
      
      if (angle > 180) {
        const sliceInner2 = document.createElement('div');
        sliceInner2.className = 'absolute top-0 left-0 w-full h-full transform origin-center';
        sliceInner2.style.clip = `rect(0px, 48px, 96px, 0px)`;
        sliceInner2.style.transform = `rotate(${currentAngle + 180}deg)`;
        
        const sliceFill2 = document.createElement('div');
        sliceFill2.className = 'absolute top-0 left-0 w-full h-full transform origin-center';
        sliceFill2.style.backgroundColor = selectedModel.color;
        sliceFill2.style.opacity = (0.7 + (index * 0.1)).toString();
        sliceFill2.style.transform = `rotate(${angle - 180}deg)`;
        
        sliceInner2.appendChild(sliceFill2);
        slice.appendChild(sliceInner2);
      }
      
      pieContainer.appendChild(slice);
      
      // Add to legend
      const legendItem = document.createElement('div');
      legendItem.className = 'flex items-center mb-2 cursor-pointer';
      legendItem.addEventListener('click', () => handleDealerClick(dealer));
      
      const colorBox = document.createElement('div');
      colorBox.className = 'w-3 h-3 mr-2';
      colorBox.style.backgroundColor = selectedModel.color;
      colorBox.style.opacity = (0.7 + (index * 0.1)).toString();
      
      const labelText = document.createElement('span');
      labelText.textContent = `${dealer.dealerName}: ${percentage.toFixed(1)}%`;
      
      legendItem.appendChild(colorBox);
      legendItem.appendChild(labelText);
      legend.appendChild(legendItem);
      
      currentAngle += angle;
    });
    
    // Center circle for donut effect
    const centerCircle = document.createElement('div');
    centerCircle.className = 'absolute top-1/4 left-1/4 w-1/2 h-1/2 rounded-full bg-gray-800 flex items-center justify-center text-white';
    centerCircle.textContent = total.toString();
    
    pieContainer.appendChild(centerCircle);
    dealerPieChartRef.current.appendChild(pieContainer);
    dealerPieChartRef.current.appendChild(legend);
  };

  const renderSalespersonCharts = () => {
    if (!salespersonBarChartRef.current || !salespersonPieChartRef.current || !filteredSalespersonData.length || !selectedModel) return;
    
    // Clear previous charts
    salespersonBarChartRef.current.innerHTML = '';
    salespersonPieChartRef.current.innerHTML = '';
    
    // Create bar chart - similar approach as dealer bar chart but with salesperson data
    const barChartContent = document.createElement('div');
    barChartContent.className = 'flex items-end justify-around h-full';
    
    // Similar implementation for salesperson bar chart
    filteredSalespersonData.forEach(salesperson => {
      const height = (salesperson.sales / Math.max(...filteredSalespersonData.map(s => s.sales))) * 80;
      
      const barWrapper = document.createElement('div');
      barWrapper.className = 'flex flex-col items-center group';
      
      const bar = document.createElement('div');
      bar.className = 'w-16 rounded-t transition-all duration-300 group-hover:opacity-90';
      bar.style.height = `${height}%`;
      bar.style.backgroundColor = selectedModel.color;
      bar.setAttribute('data-salesperson-id', salesperson.salespersonId.toString());
      
      const label = document.createElement('div');
      label.className = 'text-xs text-gray-300 mt-2';
      label.textContent = salesperson.salespersonName;
      
      const value = document.createElement('div');
      value.className = 'text-sm font-medium text-white mt-1';
      value.textContent = salesperson.sales.toString();
      
      barWrapper.appendChild(bar);
      barWrapper.appendChild(label);
      barWrapper.appendChild(value);
      barChartContent.appendChild(barWrapper);
    });
    
    salespersonBarChartRef.current.appendChild(barChartContent);
    
    // Create pie chart - similar to dealer pie chart but with salesperson data
    const total = filteredSalespersonData.reduce((sum, salesperson) => sum + salesperson.sales, 0);
    let currentAngle = 0;
    
    const pieContainer = document.createElement('div');
    pieContainer.className = 'relative w-48 h-48 mx-auto';
    
    // Create legend
    const legend = document.createElement('div');
    legend.className = 'absolute -right-24 top-0 text-sm';
    
    // Similar implementation for salesperson pie chart
    filteredSalespersonData.forEach((salesperson, index) => {
      const slice = document.createElement('div');
      const percentage = (salesperson.sales / total) * 100;
      const angle = (percentage / 100) * 360;
      
      // Same slice implementation as before
      slice.className = 'absolute top-0 left-0 w-full h-full cursor-pointer transform origin-center';
      slice.style.clip = `rect(0px, 96px, 96px, 48px)`;
      
      const sliceInner = document.createElement('div');
      sliceInner.className = 'absolute top-0 left-0 w-full h-full transform origin-center';
      sliceInner.style.clip = `rect(0px, 48px, 96px, 0px)`;
      sliceInner.style.transform = `rotate(${currentAngle}deg)`;
      
      const sliceFill = document.createElement('div');
      sliceFill.className = 'absolute top-0 left-0 w-full h-full transform origin-center';
      sliceFill.style.backgroundColor = selectedModel.color;
      sliceFill.style.opacity = (0.6 + (index * 0.1)).toString();
      sliceFill.style.transform = angle <= 180 ? `rotate(${angle}deg)` : 'rotate(180deg)';
      
      sliceInner.appendChild(sliceFill);
      slice.appendChild(sliceInner);
      
      if (angle > 180) {
        const sliceInner2 = document.createElement('div');
        sliceInner2.className = 'absolute top-0 left-0 w-full h-full transform origin-center';
        sliceInner2.style.clip = `rect(0px, 48px, 96px, 0px)`;
        sliceInner2.style.transform = `rotate(${currentAngle + 180}deg)`;
        
        const sliceFill2 = document.createElement('div');
        sliceFill2.className = 'absolute top-0 left-0 w-full h-full transform origin-center';
        sliceFill2.style.backgroundColor = selectedModel.color;
        sliceFill2.style.opacity = (0.6 + (index * 0.1)).toString();
        sliceFill2.style.transform = `rotate(${angle - 180}deg)`;
        
        sliceInner2.appendChild(sliceFill2);
        slice.appendChild(sliceInner2);
      }
      
      pieContainer.appendChild(slice);
      
      // Add to legend
      const legendItem = document.createElement('div');
      legendItem.className = 'flex items-center mb-2';
      
      const colorBox = document.createElement('div');
      colorBox.className = 'w-3 h-3 mr-2';
      colorBox.style.backgroundColor = selectedModel.color;
      colorBox.style.opacity = (0.6 + (index * 0.1)).toString();
      
      const labelText = document.createElement('span');
      labelText.textContent = `${salesperson.salespersonName}: ${percentage.toFixed(1)}%`;
      
      legendItem.appendChild(colorBox);
      legendItem.appendChild(labelText);
      legend.appendChild(legendItem);
      
      currentAngle += angle;
    });
    
    // Center circle for donut effect
    const centerCircle = document.createElement('div');
    centerCircle.className = 'absolute top-1/4 left-1/4 w-1/2 h-1/2 rounded-full bg-gray-800 flex items-center justify-center text-white';
    centerCircle.textContent = total.toString();
    
    pieContainer.appendChild(centerCircle);
    salespersonPieChartRef.current.appendChild(pieContainer);
    salespersonPieChartRef.current.appendChild(legend);
  };

  // Initialize on mount and update charts when view changes
  useEffect(() => {
    // Generate demo data
    setData(generateDemoData());
  }, []);

  useEffect(() => {
    // Render appropriate charts based on current view
    if (view === 'models') {
      renderModelCharts();
    } else if (view === 'dealers' && selectedModel) {
      renderDealerCharts();
    } else if (view === 'salespeople' && selectedModel && selectedDealer) {
      renderSalespersonCharts();
    }
  }, [view, selectedModel, selectedDealer, data]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text">
          Interactive Car Sales Dashboard
        </h1>
        <p className="text-gray-400 mt-2">Explore sales data from model level down to individual salespeople</p>
      </header>
      
      <div className="bg-gray-900/60 rounded-xl p-4 md:p-6 border border-gray-700/50 shadow-xl">
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <div className={`h-2 w-2 rounded-full ${view === 'models' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
            <div className="h-0.5 w-8 bg-gray-600"></div>
            <div className={`h-2 w-2 rounded-full ${view === 'dealers' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
            <div className="h-0.5 w-8 bg-gray-600"></div>
            <div className={`h-2 w-2 rounded-full ${view === 'salespeople' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
          </div>
          <div className="flex text-xs text-gray-400 space-x-2">
            <div className={`w-16 ${view === 'models' ? 'text-green-400 font-medium' : ''}`}>Models</div>
            <div className="w-8"></div>
            <div className={`w-16 ${view === 'dealers' ? 'text-green-400 font-medium' : ''}`}>Dealers</div>
            <div className="w-8"></div>
            <div className={`w-16 ${view === 'salespeople' ? 'text-green-400 font-medium' : ''}`}>Salespeople</div>
          </div>
        </div>
        
        {/* Model Level View */}
        {view === 'models' && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-white">Total Sales by Model</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bar Chart */}
              <div className="bg-gray-800 p-4 rounded-lg shadow-md">
                <div ref={modelBarChartRef} className="w-full" style={{ height: 400 }}></div>
                <p className="text-center text-gray-400 mt-2">Click on a bar to see sales by dealer</p>
              </div>
              
              {/* Pie Chart */}
              <div className="bg-gray-800 p-4 rounded-lg shadow-md flex items-center">
                <div ref={modelPieChartRef} className="w-full" style={{ height: 400 }}></div>
              </div>
            </div>
          </div>
        )}
        
        {/* Dealer Level View */}
        {view === 'dealers' && (
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <button 
                onClick={handleBackClick} 
                className="mr-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors"
              >
                &larr; Back to Models
              </button>
              <h2 className="text-2xl font-bold text-white">
                {selectedModel ? selectedModel.name : ''} Sales by Dealer
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bar Chart */}
              <div className="bg-gray-800 p-4 rounded-lg shadow-md">
                <div ref={dealerBarChartRef} className="w-full" style={{ height: 400 }}></div>
                <p className="text-center text-gray-400 mt-2">Click on a bar to see sales by salesperson</p>
              </div>
              
              {/* Pie Chart */}
              <div className="bg-gray-800 p-4 rounded-lg shadow-md flex items-center">
                <div ref={dealerPieChartRef} className="w-full" style={{ height: 400 }}></div>
              </div>
            </div>
            
            {/* Dealer Table */}
            <div className="mt-8 bg-gray-800 p-4 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4 text-white">Dealer Performance Summary</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Dealer</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Units Sold</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">% of Model Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredDealerData.map(dealer => (
                      <tr
                        key={dealer.dealerId}
                        className="hover:bg-gray-700 cursor-pointer transition-colors"
                        onClick={() => handleDealerClick(dealer)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{dealer.dealerName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-300">{dealer.sales}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-300">
                          {selectedModel ? ((dealer.sales / selectedModel.totalSales) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        {/* Salesperson Level View */}
        {view === 'salespeople' && (
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <button 
                onClick={handleBackClick} 
                className="mr-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors"
              >
                &larr; Back to Dealers
              </button>
              <h2 className="text-2xl font-bold text-white">
                {selectedModel ? selectedModel.name : ''} Sales at {selectedDealer ? selectedDealer.dealerName : ''}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bar Chart */}
              <div className="bg-gray-800 p-4 rounded-lg shadow-md">
                <div ref={salespersonBarChartRef} className="w-full" style={{ height: 400 }}></div>
              </div>
              
              {/* Pie Chart */}
              <div className="bg-gray-800 p-4 rounded-lg shadow-md flex items-center">
                <div ref={salespersonPieChartRef} className="w-full" style={{ height: 400 }}></div>
              </div>
            </div>
            
            {/* Salesperson Table */}
            <div className="mt-8 bg-gray-800 p-4 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4 text-white">Salesperson Performance Details</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Salesperson</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Units Sold</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">% of Dealer Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredSalespersonData.map(salesperson => (
                      <tr
                        key={salesperson.salespersonId}
                        className="hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{salesperson.salespersonName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-300">{salesperson.sales}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-300">
                          {selectedDealer ? ((salesperson.sales / selectedDealer.sales) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
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

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}