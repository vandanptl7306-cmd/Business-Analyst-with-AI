import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getSalesReport, getProfitLossReport, getGSTLiabilityReport } from '../services/report';
import { useCurrency } from '../context/CurrencyContext';
import { ArrowLeft, TrendingUp, TrendingDown, BarChart3, Receipt, Landmark, Loader2, LayoutDashboard, Download, AlertCircle, RefreshCw } from 'lucide-react';
import { exportToCSV, exportToExcel, exportReportToPDF } from '../utils/exportUtils';

import KPICard from '../components/reports/KPICard';
import { TrendLineChart, DistributionPieChart, CategoryBarChart } from '../components/reports/ReportCharts';
import InsightPanel from '../components/reports/InsightPanel';
import ReportTable from '../components/reports/ReportTable';
import FilterBar from '../components/reports/FilterBar';

const LOADING_STAGES = [
  'Initializing dashboard...',
  'Fetching sales performance...',
  'Compiling profit and loss accounts...',
  'Calculating GST liabilities...',
  'Aggregating AI insights...',
  'Preparing visual reports...'
];

export default function Reports() {
  const { currency } = useCurrency();
  const [activeTab, setActiveTab] = useState('overview'); // overview, sales, profit, gst
  
  // Default to this month
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  const [loading, setLoading] = useState(true);
  const [loadingStageIdx, setLoadingStageIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [reportData, setReportData] = useState({
    salesTrend: [],
    topProducts: [],
    plSummary: null,
    expenses: [],
    gstLiability: null
  });

  const loadReportData = async () => {
    setLoading(true);
    setErrorMsg('');
    setLoadingStageIdx(0);
    
    // Simulate loading stages for better UX
    const interval = setInterval(() => {
      setLoadingStageIdx(prev => Math.min(prev + 1, LOADING_STAGES.length - 1));
    }, 400);

    try {
      const [salesRes, plRes, gstRes] = await Promise.all([
        getSalesReport(startDate, endDate),
        getProfitLossReport(startDate, endDate),
        getGSTLiabilityReport(startDate, endDate)
      ]);

      setReportData({
        salesTrend: salesRes?.salesTrend || [],
        topProducts: salesRes?.topProducts || [],
        plSummary: plRes?.summary || null,
        expenses: plRes?.expensesBreakdown || [],
        gstLiability: gstRes?.liability || null
      });
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to compile reports data for the selected range. Please check your connection or permissions.');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, []); // Only run on mount, updates triggered manually via Apply button

  const handleExport = (format) => {
    const ts = new Date().getTime();
    if (format === 'csv') {
      exportToCSV(reportData.topProducts, `reports_${ts}.csv`);
    } else if (format === 'excel') {
      exportToExcel(reportData.topProducts, `reports_${ts}.xlsx`);
    } else if (format === 'pdf') {
      const summary = [
        { label: 'Gross Revenue', value: reportData.plSummary?.totalRevenue || 0 },
        { label: 'Net Profit', value: reportData.plSummary?.netProfit || 0 },
        { label: 'Total GST', value: reportData.gstLiability?.totalCollected || 0 }
      ];
      const cols = [{ header: 'Product', key: '_id' }, { header: 'Qty', key: 'quantitySold' }, { header: 'Revenue', key: 'totalSalesVal' }];
      exportReportToPDF('Business Intelligence Report', summary, cols, reportData.topProducts, `reports_${ts}.pdf`);
    }
  };

  // Memoized Chart Data
  const salesChartData = useMemo(() => {
    return reportData.salesTrend.map(s => ({
      date: s._id,
      Revenue: s.revenue,
      Tax: s.tax,
      Invoices: s.salesCount
    }));
  }, [reportData.salesTrend]);

  const expenseChartData = useMemo(() => {
    return reportData.expenses.map(e => ({ name: e._id, amount: e.totalAmount }));
  }, [reportData.expenses]);

  const gstChartData = useMemo(() => {
    if (!reportData.gstLiability) return [];
    return [
      { name: 'CGST', value: reportData.gstLiability.cgst },
      { name: 'SGST', value: reportData.gstLiability.sgst },
      { name: 'IGST', value: reportData.gstLiability.igst }
    ].filter(g => g.value > 0);
  }, [reportData.gstLiability]);

  const productTableColumns = [
    { header: 'Product Description', key: '_id', sortable: true },
    { header: 'Qty Sold', key: 'quantitySold', sortable: true, align: 'center' },
    { header: 'Revenue (₹)', key: 'totalSalesVal', sortable: true, align: 'right', cell: row => row.totalSalesVal.toFixed(2) }
  ];

  // Render Skeleton Loader
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
        <p className="text-slate-600 font-medium animate-pulse">{LOADING_STAGES[loadingStageIdx]}</p>
      </div>
    );
  }

  // Render Error State
  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-red-200 shadow-sm max-w-md text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">Error Loading Reports</h2>
          <p className="text-sm text-slate-600">{errorMsg}</p>
          <button onClick={loadReportData} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-sm inline-flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const { salesTrend, topProducts, plSummary, expenses, gstLiability } = reportData;

  const totalRevenue = plSummary?.totalRevenue || 0;
  const netProfit = plSummary?.netProfit || 0;
  const margin = plSummary?.margin || 0;
  const gstCollected = gstLiability?.totalCollected || 0;
  
  // Empty State Check
  const hasData = salesTrend.length > 0 || expenses.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 animate-in fade-in duration-300">
        
        {/* Header & Back Link */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <Link to="/dashboard" className="inline-flex items-center space-x-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors group mb-2">
              <ArrowLeft className="h-3 w-3 transform group-hover:-translate-x-1 transition-transform" />
              <span>Back to Dashboard</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-indigo-600 p-1.5 bg-indigo-100 rounded-lg" />
              Business Intelligence
            </h1>
            <p className="text-sm text-slate-500">Advanced analytics, reporting, and AI insights.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={() => handleExport('csv')} className="px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5 shadow-sm">
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
            <button onClick={() => handleExport('excel')} className="px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 flex items-center gap-1.5 shadow-sm">
              <Download className="h-3.5 w-3.5" /> Excel
            </button>
            <button onClick={() => handleExport('pdf')} className="px-3 py-2 bg-indigo-600 border border-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 flex items-center gap-1.5 shadow-sm">
              <Download className="h-3.5 w-3.5" /> PDF Report
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <FilterBar 
          startDate={startDate} setStartDate={setStartDate}
          endDate={endDate} setEndDate={setEndDate}
          onApply={loadReportData}
        />

        {/* Tabs */}
        <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-hide">
          {[
            { id: 'overview', name: 'Overview', icon: LayoutDashboard },
            { id: 'sales', name: 'Sales & Products', icon: BarChart3 },
            { id: 'profit', name: 'Profit & Loss', icon: Landmark },
            { id: 'gst', name: 'GST Liability', icon: Receipt },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3.5 border-b-2 text-sm font-bold transition-all whitespace-nowrap outline-none ${
                  isActive ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon className="h-4.5 w-4.5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {!hasData ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <LayoutDashboard className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800">No Data Available</h3>
            <p className="text-slate-500 text-sm mt-1">There are no records found for the selected date range. Try selecting a different preset or custom range.</p>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <KPICard title="Gross Sales" value={`₹${totalRevenue.toFixed(2)}`} trendPercentage={12.5} trendDirection="up" comparisonText="vs last period" icon={BarChart3} />
                  <KPICard title="Net Profit" value={`₹${netProfit.toFixed(2)}`} trendPercentage={margin.toFixed(1)} trendDirection={margin > 0 ? 'up' : 'down'} comparisonText="Margin %" icon={Landmark} />
                  <KPICard title="Total Orders" value={salesTrend.reduce((acc, c) => acc + c.salesCount, 0)} trendDirection="neutral" icon={LayoutDashboard} />
                  <KPICard title="Net GST Payable" value={`₹${(gstLiability?.netPayable || 0).toFixed(2)}`} icon={Receipt} />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 h-96 flex flex-col">
                    <h3 className="text-sm font-bold text-slate-800 mb-4">Revenue & Tax Trends</h3>
                    <TrendLineChart data={salesChartData} xKey="date" lines={[{key: 'Revenue', name: 'Revenue', color: '#4f46e5'}, {key: 'Tax', name: 'Tax', color: '#10b981'}]} />
                  </div>
                  <div className="flex flex-col gap-6">
                    <InsightPanel type="sales" data={reportData} />
                    <InsightPanel type="profit" data={reportData} />
                  </div>
                </div>
              </>
            )}

            {/* SALES TAB */}
            {activeTab === 'sales' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <KPICard title="Gross Sales Revenue" value={`₹${totalRevenue.toFixed(2)}`} icon={BarChart3} />
                  <KPICard title="Total Tax Collected" value={`₹${salesTrend.reduce((acc, c) => acc + c.tax, 0).toFixed(2)}`} icon={Receipt} />
                  <KPICard title="Sales Invoices" value={salesTrend.reduce((acc, c) => acc + c.salesCount, 0)} icon={LayoutDashboard} />
                  <KPICard title="Avg Invoice Value" value={`₹${(totalRevenue / Math.max(1, salesTrend.reduce((acc, c) => acc + c.salesCount, 0))).toFixed(2)}`} icon={TrendingUp} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 h-96 flex flex-col">
                    <h3 className="text-sm font-bold text-slate-800 mb-4">Daily Sales Performance</h3>
                    <TrendLineChart data={salesChartData} xKey="date" lines={[{key: 'Revenue', name: 'Revenue', color: '#4f46e5'}]} />
                  </div>
                  <div className="lg:col-span-1">
                    <InsightPanel type="sales" data={reportData} />
                  </div>
                </div>

                <ReportTable 
                  title="Product Performance Analytics"
                  columns={productTableColumns}
                  data={topProducts}
                  searchable={true}
                  searchKey="_id"
                  itemsPerPage={10}
                />
              </>
            )}

            {/* PROFIT & LOSS TAB */}
            {activeTab === 'profit' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <KPICard title="Gross Revenue" value={`₹${totalRevenue.toFixed(2)}`} icon={BarChart3} />
                  <KPICard title="COGS" value={`₹${(plSummary?.totalCogs || 0).toFixed(2)}`} trendDirection="down" icon={TrendingDown} />
                  <KPICard title="Operating Expenses" value={`₹${(plSummary?.totalExpenses || 0).toFixed(2)}`} trendDirection="down" icon={Landmark} />
                  <KPICard title="Net Profit" value={`₹${netProfit.toFixed(2)}`} trendPercentage={margin.toFixed(1)} trendDirection={margin > 0 ? 'up' : 'down'} comparisonText="Margin %" icon={TrendingUp} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 h-96 flex flex-col">
                    <h3 className="text-sm font-bold text-slate-800 mb-4">Expenses Breakdown</h3>
                    <CategoryBarChart data={expenseChartData} xKey="name" bars={[{key: 'amount', name: 'Amount (₹)', color: '#f59e0b'}]} />
                  </div>
                  <div className="flex flex-col gap-6">
                    <InsightPanel type="profit" data={reportData} />
                  </div>
                </div>
              </>
            )}

            {/* GST TAB */}
            {activeTab === 'gst' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <KPICard title="Total GST Collected" value={`₹${gstCollected.toFixed(2)}`} icon={Receipt} />
                  <KPICard title="Input Tax Credit (ITC)" value={`₹${(gstLiability?.inputTaxCredit || 0).toFixed(2)}`} icon={Landmark} />
                  <KPICard title="Net GST Payable" value={`₹${(gstLiability?.netPayable || 0).toFixed(2)}`} icon={TrendingUp} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 h-80 flex flex-col">
                    <h3 className="text-sm font-bold text-slate-800 mb-4">Tax Distribution</h3>
                    <DistributionPieChart data={gstChartData} nameKey="name" dataKey="value" />
                  </div>
                  <div className="flex flex-col gap-6">
                    <InsightPanel type="gst" data={reportData} />
                    
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                      <h3 className="text-sm font-bold text-slate-800 mb-3">GST Filing Summary</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                          <span className="text-slate-500">CGST Collected</span>
                          <span className="font-bold text-slate-700">₹{(gstLiability?.cgst || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                          <span className="text-slate-500">SGST Collected</span>
                          <span className="font-bold text-slate-700">₹{(gstLiability?.sgst || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                          <span className="text-slate-500">IGST Collected</span>
                          <span className="font-bold text-slate-700">₹{(gstLiability?.igst || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-2">
                          <span className="font-bold text-indigo-700">Net Payable</span>
                          <span className="font-bold text-indigo-700 text-lg">₹{(gstLiability?.netPayable || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
