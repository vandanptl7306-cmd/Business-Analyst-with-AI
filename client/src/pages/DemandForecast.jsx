import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getProductDemandForecast } from '../services/ml';
import axios from 'axios';
import { 
  ArrowLeft, Sparkles, Sliders, Calendar, AlertTriangle, CheckCircle, 
  ShieldAlert, Loader2, BarChart2, LineChart as LineChartIcon, 
  Download, Info, Package, TrendingUp, AlertCircle, FileText, Table
} from 'lucide-react';
import ForecastChart from '../components/charts/ForecastChart';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';

export default function DemandForecast() {
  // Config States
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [days, setDays] = useState(14);
  const [model, setModel] = useState('auto');
  const [confidence, setConfidence] = useState(0.95);
  
  // UI States
  const [chartType, setChartType] = useState('line');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [apiError, setApiError] = useState('');
  const [showXai, setShowXai] = useState(false);
  
  // Data States
  const [forecastData, setForecastData] = useState(null);

  // Fetch Catalog
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const res = await axios.get(`${apiBase}/products`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setProducts(res.data.products);
          if (res.data.products.length > 0) {
            setSelectedProduct(res.data.products[0].description || res.data.products[0].name || res.data.products[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load catalog:', err);
        setProducts([
          { _id: '1', name: 'Premium Kirana Basmati Rice', stock: 120, sku: 'RICE-001' },
          { _id: '2', name: 'Refined Sunflower Oil 5L', stock: 45, sku: 'OIL-005' },
        ]);
        setSelectedProduct('Premium Kirana Basmati Rice');
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchCatalog();
  }, []);

  // Fetch Forecast Data
  const handleGenerateForecast = async () => {
    if (!selectedProduct) return;
    setLoading(true);
    setApiError('');
    setForecastData(null);
    
    try {
      setLoadingStep('Loading historical sales...');
      await new Promise(r => setTimeout(r, 400));
      
      setLoadingStep('Preparing dataset and running AI model...');
      const data = await getProductDemandForecast(selectedProduct, days, model, confidence);
      
      setLoadingStep('Calculating inventory recommendations...');
      await new Promise(r => setTimeout(r, 400));
      
      setLoadingStep('Generating AI insights...');
      setForecastData(data);
    } catch (err) {
      setApiError(err.response?.data?.detail || err.response?.data?.error || err.message || 'Failed to fetch forecast.');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  useEffect(() => {
    if (selectedProduct) {
      const timer = setTimeout(() => {
        handleGenerateForecast();
      }, 500); // Debounce
      return () => clearTimeout(timer);
    }
  }, [selectedProduct, days, model, confidence]);

  const handleExportCSV = () => {
    if (!forecastData) return;
    exportToCSV(forecastData.forecast, `Forecast_${selectedProduct}_${days}d.csv`);
  };

  const handleExportPDF = () => {
    if (!forecastData) return;
    exportToPDF(
      forecastData.forecast, 
      forecastData.summary, 
      forecastData.inventory, 
      forecastData.insights,
      `ForecastReport_${selectedProduct}.pdf`
    );
  };

  const activeProduct = useMemo(() => products.find(p => (p.description || p.name || p._id) === selectedProduct), [products, selectedProduct]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-8 px-4 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <Link to="/dashboard" className="inline-flex items-center space-x-2 text-sm text-slate-500 hover:text-slate-800 transition-colors group mb-4">
              <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
              <span>Back to Dashboard</span>
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
              <Sparkles className="h-7 w-7 text-indigo-600" />
              AI Demand Forecasting
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              Production-ready intelligence. Predict stock demand, optimize inventory, and uncover hidden sales patterns using advanced machine learning models.
            </p>
          </div>
          
          <div className="flex gap-2">
            <button onClick={handleExportCSV} disabled={!forecastData || loading} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 transition-colors">
              <Table className="w-4 h-4" /> CSV
            </button>
            <button onClick={handleExportPDF} disabled={!forecastData || loading} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 border border-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              <Download className="w-4 h-4" /> Export Report
            </button>
          </div>
        </div>

        {apiError && (
          <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm font-semibold flex items-center space-x-2 shadow-sm">
            <ShieldAlert className="h-5 w-5 text-red-600 flex-shrink-0" />
            <span>{apiError}</span>
            <button onClick={handleGenerateForecast} className="ml-auto underline hover:text-red-900">Retry</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* LEFT: Config Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
              <div className="flex items-center space-x-2 text-slate-800 font-bold pb-3 border-b border-slate-100 text-sm">
                <Sliders className="h-4 w-4 text-indigo-600" />
                <span>Forecast Configuration</span>
              </div>

              {/* Product */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Target Product</label>
                {loadingProducts ? (
                  <div className="py-2 flex items-center text-slate-500 text-xs font-semibold">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading catalog...
                  </div>
                ) : (
                  <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer">
                    {products.map((p) => (
                      <option key={p._id} value={p.description || p.name || p._id}>{p.name || p.description}</option>
                    ))}
                  </select>
                )}
                {activeProduct && (
                  <div className="mt-2 text-[10px] text-slate-500 flex justify-between bg-slate-50 p-2 rounded">
                    <span>SKU: {activeProduct.sku || 'N/A'}</span>
                    <span>Current Stock: {activeProduct.stock || 0}</span>
                  </div>
                )}
              </div>

              {/* Horizon */}
              <div>
                <div className="flex justify-between items-center mb-1.5 text-xs">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase">Horizon ({days} Days)</label>
                </div>
                <input type="range" min="7" max="90" value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-mono font-bold">
                  <span>7D</span><span>30D</span><span>90D</span>
                </div>
              </div>

              {/* Model */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">ML Engine Model</label>
                <select value={model} onChange={(e) => setModel(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer">
                  <option value="auto">Auto (Recommended)</option>
                  <option value="prophet">Facebook Prophet (Trend/Seasonality)</option>
                  <option value="random_forest">Random Forest (Ensemble)</option>
                  <option value="arima">ARIMA (Statistical)</option>
                </select>
              </div>

              {/* Confidence */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Confidence Level</label>
                <select value={confidence} onChange={(e) => setConfidence(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer">
                  <option value={0.80}>80% (Narrower Interval)</option>
                  <option value={0.90}>90% (Standard)</option>
                  <option value={0.95}>95% (Wider Safety Margin)</option>
                </select>
              </div>
            </div>

            {/* AI Insights Panel */}
            {forecastData?.insights && (
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-5 text-white shadow-lg space-y-4 relative overflow-hidden">
                <Sparkles className="absolute top-2 right-2 text-indigo-500/20 w-24 h-24 pointer-events-none" />
                <div className="flex items-center space-x-2 font-bold pb-2 border-b border-indigo-700/50 text-sm relative z-10">
                  <Info className="h-4 w-4 text-indigo-400" />
                  <span>AI Business Insights</span>
                </div>
                <div className="space-y-3 relative z-10">
                  {forecastData.insights.map((insight, idx) => (
                    <div key={idx} className="bg-indigo-950/40 p-3 rounded-lg border border-indigo-800/50 text-xs">
                      <div className="flex items-start gap-2 mb-1.5">
                        {insight.severity === 'danger' ? <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" /> : <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />}
                        <span className="font-semibold">{insight.text}</span>
                      </div>
                      <div className="text-indigo-200 pl-6 opacity-80">{insight.recommendation}</div>
                    </div>
                  ))}
                </div>
                
                {forecastData.xai && (
                  <button onClick={() => setShowXai(!showXai)} className="w-full mt-2 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-100 text-xs font-bold rounded-lg transition-colors border border-indigo-500/30">
                    Why this Forecast? (XAI)
                  </button>
                )}
                
                {showXai && forecastData.xai && (
                  <div className="mt-3 p-3 bg-slate-950 rounded-lg text-xs space-y-2 border border-slate-700">
                    <p className="font-bold text-slate-300">Top Influencing Factors:</p>
                    {forecastData.xai.factors.map((f, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-slate-400 truncate pr-2">{f.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-indigo-500" style={{width: `${f.impact * 100}%`}}></div></div>
                          <span className="text-indigo-300 font-mono text-[10px]">{(f.impact*100).toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: Main Dash */}
          <div className="lg:col-span-3 space-y-6">
            
            {loading ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center h-full shadow-sm space-y-4">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                <div className="text-slate-500 font-semibold">{loadingStep}</div>
              </div>
            ) : !forecastData ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 flex items-center justify-center h-full shadow-sm text-slate-400 font-bold">
                Select a product to generate forecast.
              </div>
            ) : (
              <>
                {(!forecastData.summary || !forecastData.inventory) && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl shadow-sm flex flex-col gap-2 mb-4">
                    <div className="flex items-center gap-2 font-bold">
                      <AlertTriangle className="w-5 h-5" />
                      Backend Update Required
                    </div>
                    <p className="text-sm">
                      The ML Service is still running the old codebase. To see the new AI Insights, Inventory Logic, and KPI Dashboard, you <b>must</b> restart the Python server.
                    </p>
                    <p className="text-xs font-mono bg-amber-100 p-2 rounded w-fit">
                      1. Go to terminal running "python run.py"<br/>
                      2. Press Ctrl + C<br/>
                      3. Run "python run.py" again
                    </p>
                  </div>
                )}
                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Total Demand</div>
                    <div className="text-2xl font-extrabold text-slate-800 font-mono">{forecastData?.summary?.totalDemand || 'N/A'}</div>
                    <div className="text-[10px] text-slate-400 mt-1">Over next {days} days</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Available Stock</div>
                    <div className="text-2xl font-extrabold text-slate-800 font-mono">{forecastData?.inventory?.availableStock || 'N/A'}</div>
                    <div className="text-[10px] text-emerald-600 mt-1 font-semibold flex items-center gap-1"><Package className="w-3 h-3"/> Current Inventory</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Safety Stock Limit</div>
                    <div className="text-2xl font-extrabold text-slate-800 font-mono">{forecastData?.inventory?.safetyStock || 'N/A'}</div>
                    <div className="text-[10px] text-slate-400 mt-1">Buffer requirement</div>
                  </div>
                  <div className={`p-4 rounded-xl border shadow-sm ${forecastData?.inventory?.status === 'Stockout Risk' ? 'bg-red-50 border-red-200' : forecastData?.inventory?.status === 'Overstock Risk' ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                    <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${forecastData?.inventory?.status === 'Stockout Risk' ? 'text-red-600' : 'text-emerald-700'}`}>Recommended Action</div>
                    <div className={`text-xl font-extrabold font-mono ${forecastData?.inventory?.status === 'Stockout Risk' ? 'text-red-700' : 'text-emerald-800'}`}>
                      {forecastData?.inventory?.suggestedOrder > 0 ? `Order ${forecastData.inventory.suggestedOrder}` : 'Optimal'}
                    </div>
                    <div className={`text-[10px] mt-1 font-semibold truncate ${forecastData?.inventory?.status === 'Stockout Risk' ? 'text-red-500' : 'text-emerald-600'}`}>{forecastData?.inventory?.status || 'Unknown'}</div>
                  </div>
                </div>

                {/* Chart Section */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                      <BarChart2 className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-bold text-slate-800 text-sm">Demand Forecast Horizon</h3>
                      <span className="ml-2 text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200 font-mono font-semibold">{forecastData.model}</span>
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                      <button onClick={() => setChartType('line')} className={`p-1.5 rounded-md transition-colors ${chartType === 'line' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`} title="Line Chart"><LineChartIcon className="w-4 h-4" /></button>
                      <button onClick={() => setChartType('bar')} className={`p-1.5 rounded-md transition-colors ${chartType === 'bar' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`} title="Bar Chart"><BarChart2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  
                  <div className="w-full">
                    <ForecastChart data={forecastData.forecast} chartType={chartType} />
                  </div>
                  
                  {/* Accuracy Footer */}
                  {forecastData?.summary?.accuracy && forecastData.summary.accuracy.MAE > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex gap-6 text-[11px]">
                      <span className="text-slate-400 font-bold uppercase">Model Accuracy (Backtest):</span>
                      <span className="text-slate-600 font-mono">MAE: <span className="font-bold text-slate-800">{forecastData.summary.accuracy.MAE}</span></span>
                      <span className="text-slate-600 font-mono">RMSE: <span className="font-bold text-slate-800">{forecastData.summary.accuracy.RMSE}</span></span>
                      <span className="text-slate-600 font-mono">MAPE: <span className="font-bold text-slate-800">{forecastData.summary.accuracy.MAPE}%</span></span>
                    </div>
                  )}
                </div>

                {/* Data Table */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-500"/> Daily Projections Table</h3>
                    <span className="text-[10px] text-slate-500 font-semibold">{confidence * 100}% Confidence Interval</span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] sticky top-0 shadow-[0_1px_2px_rgba(0,0,0,0.05)] z-10">
                        <tr>
                          <th className="px-5 py-3">Date</th>
                          <th className="px-5 py-3 text-right text-indigo-600">Forecasted Qty</th>
                          <th className="px-5 py-3 text-right">Lower Bound</th>
                          <th className="px-5 py-3 text-right">Upper Bound</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600 font-mono font-medium">
                        {forecastData.forecast.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-2.5 font-sans font-semibold text-slate-700">{row.date}</td>
                            <td className="px-5 py-2.5 text-right font-extrabold text-indigo-700 bg-indigo-50/30">{row.predicted_quantity}</td>
                            <td className="px-5 py-2.5 text-right text-slate-400">{row.lower_confidence}</td>
                            <td className="px-5 py-2.5 text-right text-slate-400">{row.upper_confidence}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
