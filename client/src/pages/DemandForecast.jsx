// client/src/pages/DemandForecast.jsx

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProductDemandForecast } from '../services/ml';
import axios from 'axios';
import { ArrowLeft, Sparkles, Sliders, Calendar, AlertTriangle, CheckCircle, ShieldAlert, Loader2, BarChart2 } from 'lucide-react';

export default function DemandForecast() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [apiError, setApiError] = useState('');
  
  // Forecast output states
  const [modelType, setModelType] = useState('');
  const [forecastList, setForecastList] = useState([]);
  const [totalPredicted, setTotalPredicted] = useState(0);

  // Mock product catalog fetcher
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/products', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setProducts(res.data.products);
          if (res.data.products.length > 0) {
            setSelectedProduct(res.data.products[0].description || res.data.products[0].name);
          }
        }
      } catch (err) {
        console.error('Failed to load products catalogs:', err.message);
        // Fallback options
        setProducts([
          { _id: '1', name: 'Premium Kirana Basmati Rice', description: 'Premium Kirana Basmati Rice' },
          { _id: '2', name: 'Refined Sunflower Oil 5L', description: 'Refined Sunflower Oil 5L' },
          { _id: '3', name: 'Organic Turmeric Powder 1kg', description: 'Organic Turmeric Powder 1kg' }
        ]);
        setSelectedProduct('Premium Kirana Basmati Rice');
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchCatalog();
  }, []);

  const handleGenerateForecast = async (e) => {
    if (e) e.preventDefault();
    if (!selectedProduct) return;

    setLoading(true);
    setApiError('');
    setForecastList([]);
    setTotalPredicted(0);

    try {
      const data = await getProductDemandForecast(selectedProduct, days);
      if (data.success) {
        setForecastList(data.forecast);
        setModelType(data.model);
        const sum = data.forecast.reduce((acc, curr) => acc + (curr.predicted_quantity || 0), 0);
        setTotalPredicted(Math.round(sum));
      }
    } catch (err) {
      setApiError(err.response?.data?.error || 'Failed to communicate with forecasting microservice.');
    } finally {
      setLoading(false);
    }
  };

  // Run automatically when product is resolved
  useEffect(() => {
    if (selectedProduct) {
      handleGenerateForecast();
    }
  }, [selectedProduct, days]);

  const maxVal = Math.max(...forecastList.map(f => f.predicted_quantity || 0), 1);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8 animate-in fade-in duration-300">
        
        {/* Navigation */}
        <Link
          to="/dashboard"
          className="inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-slate-200 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Title Header */}
        <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-slate-800">
          <div className="p-3 bg-brand-500/10 text-brand-400 rounded-2xl border border-brand-500/20">
            <Sparkles className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">AI Demand Forecasting</h1>
            <p className="text-xs text-slate-400 mt-1">Predict expected stock demand volumes per product using RandomForestRegressor time-series ML models</p>
          </div>
        </div>

        {/* Configurator Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex items-center space-x-2 text-slate-200 font-bold pb-2 border-b border-slate-850 text-sm">
            <Sliders className="h-5 w-5 text-brand-400" />
            <span>Forecasting Parameters Configuration</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            {/* Product Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Target Product Item</label>
              {loadingProducts ? (
                <div className="py-2.5 flex items-center text-slate-500 text-xs">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading products...
                </div>
              ) : (
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-350 outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                >
                  {products.map((p) => (
                    <option key={p._id} value={p.description || p.name}>
                      {p.name || p.description}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Days Slider */}
            <div className="md:col-span-2">
              <div className="flex justify-between items-center mb-1.5 text-xs">
                <label className="font-semibold text-slate-400">Forecasting Horizon Timeframe</label>
                <span className="font-mono text-brand-400 font-bold">{days} Days Ahead</span>
              </div>
              <input
                type="range"
                min="7"
                max="30"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-brand-500 border border-slate-850"
              />
              <div className="flex justify-between text-[10px] text-slate-650 mt-1 font-mono">
                <span>7 Days (Weekly)</span>
                <span>15 Days</span>
                <span>30 Days (Monthly)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Notifications */}
        {apiError && (
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm flex items-center space-x-2">
            <ShieldAlert className="h-5 w-5 flex-shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Output Dashboards */}
        {loading ? (
          <div className="py-24 flex justify-center">
            <Loader2 className="h-10 w-10 text-brand-500 animate-spin" />
          </div>
        ) : forecastList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            
            {/* Forecast details list table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 md:col-span-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-850">
                <div className="flex items-center space-x-2">
                  <BarChart2 className="h-5 w-5 text-brand-400" />
                  <h3 className="text-base font-bold text-slate-200">Daily Demand Projections</h3>
                </div>
                <span className="text-[10px] bg-slate-950 border border-slate-850 px-2.5 py-1 rounded text-slate-400 font-mono">
                  {modelType}
                </span>
              </div>

              {/* Dynamic Visual Graph Bar Charts */}
              <div className="h-44 flex items-end justify-between gap-1.5 pt-4 bg-slate-950 p-4 rounded-xl border border-slate-850">
                {forecastList.map((f, idx) => {
                  const h = ((f.predicted_quantity || 0) / maxVal) * 100;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center group relative">
                      {/* Tooltip */}
                      <span className="absolute bottom-full mb-1 bg-slate-900 border border-slate-800 text-[8px] font-mono text-slate-350 px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        {f.predicted_quantity !== null && f.predicted_quantity !== undefined ? Number(f.predicted_quantity).toFixed(1) : '0.0'}
                      </span>
                      <div
                        style={{ height: `${Math.max(h, 6)}%` }}
                        className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 rounded-sm shadow-md transition-all group-hover:from-blue-500 group-hover:to-cyan-300 cursor-pointer"
                      />
                      <span className="text-[7px] font-mono mt-1 text-slate-550">{f.date.split('-')[2]}</span>
                    </div>
                  );
                })}
              </div>

              {/* Data Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-900/50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5 text-right">Forecasted Quantity Demand</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-400 font-mono">
                    {forecastList.map((f, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/25">
                        <td className="px-4 py-2.5 flex items-center space-x-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-550" />
                          <span>{f.date}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-200">
                          {f.predicted_quantity !== null && f.predicted_quantity !== undefined ? Number(f.predicted_quantity).toFixed(2) : '0.00'} units
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* AI Action Alerts Panel */}
            <div className="space-y-6">
              
              {/* Target Summary KPI Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl text-center space-y-1.5">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Cumulative Expected Demand</span>
                <h4 className="text-3xl font-extrabold font-mono text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                  {totalPredicted} Units
                </h4>
                <p className="text-[10px] text-slate-450 mt-1">Recommended buffer stock capacity setup</p>
              </div>

              {/* Alert Conditions */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
                <div className="pb-2 border-b border-slate-850 text-xs font-bold text-slate-200">
                  Inventory Stockout & Overstock Warnings
                </div>

                {/* Stockout Risk (If total projected demand is large e.g. > 30 units) */}
                {totalPredicted > 30 ? (
                  <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs space-y-2">
                    <div className="flex items-center space-x-2 font-bold uppercase tracking-wider text-[10px]">
                      <AlertTriangle className="h-4.5 w-4.5 flex-shrink-0" />
                      <span>Stockout Risk Alert</span>
                    </div>
                    <p className="leading-relaxed">
                      Expected demand of <strong>{totalPredicted} units</strong> is high. Restock item "{selectedProduct}" to prevent sales shortfalls.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs space-y-2">
                    <div className="flex items-center space-x-2 font-bold uppercase tracking-wider text-[10px]">
                      <CheckCircle className="h-4.5 w-4.5 flex-shrink-0" />
                      <span>Stock Levels Secure</span>
                    </div>
                    <p className="leading-relaxed text-slate-400">
                      Steady demand of <strong>{totalPredicted} units</strong> matches standard inventory flows.
                    </p>
                  </div>
                )}

                {/* Overstock Warning (If total projected demand is small e.g. < 15 units) */}
                {totalPredicted < 15 && (
                  <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-500 text-xs space-y-2">
                    <div className="flex items-center space-x-2 font-bold uppercase tracking-wider text-[10px]">
                      <AlertTriangle className="h-4.5 w-4.5 flex-shrink-0" />
                      <span>Overstock Risk Alert</span>
                    </div>
                    <p className="leading-relaxed text-slate-400">
                      Expected demand is very low (<strong>{totalPredicted} units</strong>). Reduce replenishment schedules to prevent carrying costs.
                    </p>
                  </div>
                )}

              </div>
            </div>

          </div>
        ) : (
          <p className="text-xs text-slate-500 text-center py-12">No demand forecasts generated yet.</p>
        )}

      </div>
    </div>
  );
}
