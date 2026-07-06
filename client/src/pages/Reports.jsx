// client/src/pages/Reports.jsx

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSalesReport, getProfitLossReport, getGSTLiabilityReport } from '../services/report';
import { ArrowLeft, Calendar, FileDown, TrendingUp, BarChart3, Receipt, Percent, Loader2, Landmark, CheckCircle } from 'lucide-react';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('sales'); // sales, profit, gst
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Data states
  const [salesTrend, setSalesTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [plSummary, setPlSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [gstLiability, setGstLiability] = useState(null);

  const loadReportData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      if (activeTab === 'sales') {
        const data = await getSalesReport(startDate, endDate);
        if (data.success) {
          setSalesTrend(data.salesTrend);
          setTopProducts(data.topProducts);
        }
      } else if (activeTab === 'profit') {
        const data = await getProfitLossReport(startDate, endDate);
        if (data.success) {
          setPlSummary(data.summary);
          setExpenses(data.expensesBreakdown);
        }
      } else if (activeTab === 'gst') {
        const data = await getGSTLiabilityReport(startDate, endDate);
        if (data.success) {
          setGstLiability(data.liability);
        }
      }
    } catch (err) {
      setErrorMsg('Failed to compile reports data for the selected range.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [activeTab, startDate, endDate]);

  const handleSelectPreset = (preset) => {
    const today = new Date();
    let start = new Date();
    if (preset === 'today') {
      start = today;
    } else if (preset === 'week') {
      start.setDate(today.getDate() - 7);
    } else if (preset === 'month') {
      start.setMonth(today.getMonth() - 1);
    }
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  };

  // Client-side CSV generation utility
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (activeTab === 'sales') {
      csvContent += "Date,Revenue,Tax Collected,Invoice Count\n";
      salesTrend.forEach((row) => {
        csvContent += `${row._id},${row.revenue.toFixed(2)},${row.tax.toFixed(2)},${row.salesCount}\n`;
      });
    } else if (activeTab === 'profit' && plSummary) {
      csvContent += "Category,Amount\n";
      csvContent += `Gross Revenue Account,${plSummary.totalRevenue}\n`;
      csvContent += `Cost of Goods Sold (COGS),-${plSummary.totalCogs}\n`;
      csvContent += `Gross Profit,${plSummary.grossProfit}\n`;
      expenses.forEach((exp) => {
        csvContent += `${exp._id},-${exp.totalAmount}\n`;
      });
      csvContent += `Net Profit,${plSummary.netProfit}\n`;
    } else if (activeTab === 'gst' && gstLiability) {
      csvContent += "Tax Parameter,Amount\n";
      csvContent += `CGST Collected,${gstLiability.cgst}\n`;
      csvContent += `SGST Collected,${gstLiability.sgst}\n`;
      csvContent += `IGST Collected,${gstLiability.igst}\n`;
      csvContent += `Total GST Collected,${gstLiability.totalCollected}\n`;
      csvContent += `Input Tax Credit (ITC),${gstLiability.inputTaxCredit}\n`;
      csvContent += `Net GST Payable,${gstLiability.netPayable}\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `intellectbill_${activeTab}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8 animate-in fade-in duration-300">
        
        {/* Back Link */}
        <Link
          to="/dashboard"
          className="inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-slate-200 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-800 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-brand-500/10 text-brand-400 rounded-2xl border border-brand-500/20">
              <TrendingUp className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-100">Financial Reports & Audits</h1>
              <p className="text-xs text-slate-400 mt-1">Aggregated accounting breakdowns and audit liabilities</p>
            </div>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center space-x-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-300 px-4 py-2.5 rounded-xl border border-slate-750 transition-all active:scale-[0.98]"
          >
            <FileDown className="h-4 w-4" />
            <span>Export to CSV</span>
          </button>
        </div>

        {/* Date Filter & Presets Dashboard */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-5 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-450 font-bold uppercase tracking-wider pr-2">Presets:</span>
            {['today', 'week', 'month'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-850 hover:border-slate-800 text-xs text-slate-350 rounded-lg hover:text-slate-200 transition-all font-semibold capitalize"
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-slate-500" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-slate-300 outline-none focus:ring-1 focus:ring-brand-500 font-mono"
              />
            </div>
            <span className="text-slate-600">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-slate-300 outline-none focus:ring-1 focus:ring-brand-500 font-mono"
            />
          </div>
        </div>

        {/* Reports Navigation Tabs */}
        <div className="flex border-b border-slate-800">
          {[
            { id: 'sales', name: 'Sales & Items', icon: BarChart3 },
            { id: 'profit', name: 'Profit & Loss', icon: Landmark },
            { id: 'gst', name: 'GST Tax Liability', icon: Receipt },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3.5 border-b-2 text-sm font-bold transition-all outline-none ${
                  isActive
                    ? 'border-brand-500 text-brand-400 bg-brand-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <tab.icon className="h-4.5 w-4.5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm">
            {errorMsg}
          </div>
        )}

        {/* Loading Display */}
        {loading ? (
          <div className="py-24 flex justify-center">
            <Loader2 className="h-10 w-10 text-brand-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* 1. SALES REPORT TAB CONTENT */}
            {activeTab === 'sales' && (
              <div className="space-y-8">
                {/* KPI Boxes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Gross Sales Revenue</span>
                    <h4 className="text-2xl font-bold font-mono text-slate-100">
                      ${salesTrend.reduce((acc, c) => acc + c.revenue, 0).toFixed(2)}
                    </h4>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Tax Collected</span>
                    <h4 className="text-2xl font-bold font-mono text-slate-100">
                      ${salesTrend.reduce((acc, c) => acc + c.tax, 0).toFixed(2)}
                    </h4>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Sales Invoices Issued</span>
                    <h4 className="text-2xl font-bold font-mono text-slate-100">
                      {salesTrend.reduce((acc, c) => acc + c.salesCount, 0)}
                    </h4>
                  </div>
                </div>

                {/* Top Products */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Top selling stock items table */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <h3 className="text-base font-bold text-slate-200">Top-Performing Inventory Stock</h3>
                    {topProducts.length === 0 ? (
                      <p className="text-xs text-slate-500">No stock sales recorded during this range.</p>
                    ) : (
                      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 text-xs">
                        <table className="w-full text-left">
                          <thead className="bg-slate-900/50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            <tr>
                              <th className="px-4 py-2.5">Stock Description</th>
                              <th className="px-4 py-2.5 text-center">Qty Sold</th>
                              <th className="px-4 py-2.5 text-right">Revenue</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 text-slate-400">
                            {topProducts.map((p, idx) => (
                              <tr key={idx}>
                                <td className="px-4 py-3 font-semibold text-slate-350">{p._id}</td>
                                <td className="px-4 py-3 text-center">{p.quantitySold}</td>
                                <td className="px-4 py-3 text-right font-mono text-emerald-400">${p.totalSalesVal.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Visual Graph Mock Trend Column */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
                    <h3 className="text-base font-bold text-slate-200">Sales Value Trends</h3>
                    <div className="h-44 flex items-end justify-between gap-2.5 pt-4">
                      {salesTrend.length === 0 ? (
                        <p className="text-xs text-slate-500 w-full text-center pb-12">No sales trend points to map.</p>
                      ) : (
                        salesTrend.slice(-7).map((s, idx) => {
                          const max = Math.max(...salesTrend.map(i => i.revenue), 100);
                          const h = (s.revenue / max) * 100;
                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center">
                              <div style={{ height: `${Math.max(h, 4)}%` }} className="w-full bg-gradient-to-t from-blue-600 to-indigo-400 rounded shadow-md" />
                              <span className="text-[8px] font-mono mt-1.5 text-slate-500">{s._id.split('-')[2]}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. PROFIT & LOSS TAB CONTENT */}
            {activeTab === 'profit' && plSummary && (
              <div className="space-y-8">
                {/* Balance Summary Card */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Gross Revenue</span>
                    <h4 className="text-xl font-bold font-mono text-slate-200">${(plSummary.totalRevenue || 0).toFixed(2)}</h4>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold text-red-400">COGS (Stock Cost)</span>
                    <h4 className="text-xl font-bold font-mono text-red-400">-${(plSummary.totalCogs || 0).toFixed(2)}</h4>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Operational Expense</span>
                    <h4 className="text-xl font-bold font-mono text-slate-200">-${(plSummary.totalExpenses || 0).toFixed(2)}</h4>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 bg-emerald-500/5 border-emerald-500/20 space-y-1">
                    <span className="text-[10px] text-emerald-450 uppercase font-bold">Net Profit (Margin)</span>
                    <h4 className="text-xl font-bold font-mono text-emerald-400">
                      ${(plSummary.netProfit || 0).toFixed(2)} (${(plSummary.margin || 0).toFixed(1)}%)
                    </h4>
                  </div>
                </div>

                {/* Expenses Breakdown Grid */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <h3 className="text-base font-bold text-slate-200">Operational Expenses Categorization</h3>
                  {expenses.length === 0 ? (
                    <p className="text-xs text-slate-500">No categorised operational expenses logged.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {expenses.map((exp, idx) => (
                        <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex justify-between items-center text-xs">
                          <div>
                            <span className="text-slate-500 block uppercase font-bold text-[9px]">{exp._id}</span>
                            <span className="font-semibold text-slate-250 block mt-0.5">{exp._id} Expense</span>
                          </div>
                          <span className="font-mono font-bold text-red-400">-${(exp.totalAmount || 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. GST LIABILITY TAB CONTENT */}
            {activeTab === 'gst' && gstLiability && (
              <div className="space-y-8">
                {/* Summary Liabilities */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Total GST Collected</span>
                    <h4 className="text-2xl font-bold font-mono text-slate-100">${(gstLiability.totalCollected || 0).toFixed(2)}</h4>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold text-blue-400">Input Tax Credit (ITC)</span>
                    <h4 className="text-2xl font-bold font-mono text-blue-400">${(gstLiability.inputTaxCredit || 0).toFixed(2)}</h4>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 bg-brand-500/5 border-brand-500/20 space-y-1">
                    <span className="text-[10px] text-brand-450 uppercase font-bold">Net GST Payable</span>
                    <h4 className="text-2xl font-bold font-mono text-brand-400">${(gstLiability.netPayable || 0).toFixed(2)}</h4>
                  </div>
                </div>

                {/* Splits breakdown */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <h3 className="text-base font-bold text-slate-200">GST Collected Split Breakdowns</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl text-center space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">CGST Split</span>
                      <div className="font-mono text-base font-bold text-slate-300">${(gstLiability.cgst || 0).toFixed(2)}</div>
                    </div>
                    <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl text-center space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">SGST Split</span>
                      <div className="font-mono text-base font-bold text-slate-300">${(gstLiability.sgst || 0).toFixed(2)}</div>
                    </div>
                    <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl text-center space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">IGST Split</span>
                      <div className="font-mono text-base font-bold text-slate-300">${(gstLiability.igst || 0).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
