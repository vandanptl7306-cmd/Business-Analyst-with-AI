// client/src/pages/Dashboard.jsx

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { getInvoicesList, createInvoice, getUpcomingInvoiceNumber } from '../services/invoice';
import { getDashboardAnalyticsMetrics } from '../services/analytics';
import InvoiceStatusBadge from '../components/InvoiceStatusBadge';
import ProfitChart from '../components/ProfitChart';
import {
  LogOut,
  Settings,
  DollarSign,
  Users,
  TrendingUp,
  RefreshCw,
  BarChart2,
  UserCheck,
  Sparkles,
  Plus,
  Loader2,
  FileText,
  FileCheck,
  FileWarning,
  Eye,
  Sliders,
} from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [upcomingNumber, setUpcomingNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [kpis, setKpis] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  const fetchInvoices = async () => {
    try {
      const data = await getInvoicesList();
      if (data.success) {
        setInvoices(data.invoices);
      }
      fetchUpcomingNumber();
    } catch (err) {
      console.error('Failed to load invoices:', err.message);
      setError('Could not retrieve invoices. Ensure server and database are running.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingNumber = async () => {
    try {
      const data = await getUpcomingInvoiceNumber();
      if (data.success) {
        setUpcomingNumber(data.upcomingNumber);
      }
    } catch (err) {
      console.error('Failed to load upcoming invoice number:', err.message);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const data = await getDashboardAnalyticsMetrics();
      if (data.success) {
        setKpis(data.kpis);
        setTrendData(data.trendData);
      }
    } catch (err) {
      console.error('Failed to load analytics trends:', err.message);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchAnalytics();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateDemoInvoice = async () => {
    setCreating(true);
    setError('');
    
    // Standard mock GST invoice matching format requirements
    const demoInvoice = {
      sellerName: 'IntellectBill AI Ltd',
      sellerGSTIN: '27AAAAA1111A1Z1',
      sellerPIN: '400001',
      buyerName: 'Global Enterprise Corp',
      buyerGSTIN: '27AAAAA2222B1Z3', // Valid format matching Indian GSTIN
      buyerBillingAddress: 'B-302, Cyber Tower, Bandra East, Mumbai, Maharashtra',
      buyerPIN: '400051',
      items: [
        {
          description: 'AI Cloud Platform Subscription',
          hsnCode: '998311', // IT support/Software services HSN
          quantity: 1,
          price: 2500.0,
          gstRate: 18,
        },
        {
          description: 'Database Operations Support',
          hsnCode: '998313',
          quantity: 3,
          price: 450.0,
          gstRate: 18,
        },
      ],
    };

    try {
      const response = await createInvoice(demoInvoice);
      if (response.success) {
        setInvoices([response.invoice, ...invoices]);
        fetchUpcomingNumber(); // Fetch next sequential upcoming number
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create demo invoice.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Banner with card aesthetics */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-indigo-50/5 rounded-full blur-2xl"></div>
        <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl text-slate-800">
          Welcome to your Dashboard
        </h1>
        <p className="mt-2 text-slate-500 max-w-2xl text-xs font-medium leading-relaxed">
          Manage your AI-powered B2B SaaS invoicing, track profit margins, and review operational billing analytics in real-time.
        </p>
      </div>

      {/* Stats Grid: fluid layout using card-module */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Revenue', value: kpis ? `₹${kpis.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : `₹${invoices.reduce((acc, i) => acc + i.grandTotal, 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, icon: DollarSign, change: 'Live Revenue', bgGradient: 'bg-indigo-50 text-indigo-600' },
          { label: 'Net Profit', value: kpis ? `₹${kpis.totalProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : `₹${invoices.reduce((acc, i) => acc + (i.netProfit || 0), 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, icon: TrendingUp, change: 'Live Profit', bgGradient: 'bg-emerald-50 text-emerald-600' },
          { label: 'Customer Repeat Rate', value: kpis ? `${kpis.repeatCustomerRate}%` : '35.0%', icon: Users, change: 'Retention', bgGradient: 'bg-purple-50 text-purple-600' },
          { label: 'Total Accounts', value: kpis ? kpis.customersAcquired.toString() : '8', icon: UserCheck, change: 'Acquired', bgGradient: 'bg-amber-50 text-amber-600' },
        ].map((stat, i) => (
          <div key={i} className="card-module flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
              <div className={`p-2 rounded-lg ${stat.bgGradient} flex items-center justify-center`}>
                <stat.icon className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-xl font-bold tracking-tight text-slate-800 font-mono">{stat.value}</span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Floating AI Insight Card with Glassmorphism */}
      <div className="glass-ai-panel rounded-2xl p-5 border flex items-center space-x-3.5">
        <div className="p-2.5 bg-indigo-500/10 text-indigo-600 rounded-xl">
          <Sparkles className="h-5 w-5 animate-pulse" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">AI Financial Insight</h4>
          <p className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">
            Revenue shows a strong upward trend over the past week. Profit margins are optimized at <span className="font-mono text-indigo-600 font-bold">24.5%</span>. No pending e-invoice compliance warnings.
          </p>
        </div>
      </div>

      {/* Profit Insights Section (Admin only) */}
      {user?.role === 'Admin' && (
        <ProfitChart invoices={invoices} />
      )}

      {/* Invoices List Section */}
      <div className="card-module space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">GST Billing & Compliance</h2>
            <p className="text-xs text-slate-500 leading-normal mt-0.5">Review invoices and verify GSP E-invoice and E-way bill generation status</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Next Auto Number:</span>
              <input
                type="text"
                readOnly
                value={upcomingNumber || 'Loading...'}
                className="bg-transparent text-xs font-mono text-indigo-600 font-bold border-none outline-none w-28 select-all cursor-default"
              />
            </div>

            <Link
              to="/invoices/create"
              className="flex items-center justify-center space-x-2 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 px-4 py-2.5 rounded-xl transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Custom Bill</span>
            </Link>

            <button
              onClick={handleCreateDemoInvoice}
              disabled={creating}
              className="flex items-center justify-center space-x-2 text-xs font-bold bg-indigo-650 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl transition-all disabled:opacity-50"
            >
              {creating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Creating Invoice...</span>
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create Demo GST Invoice</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-3 bg-slate-50/50">
            <FileText className="h-10 w-10 text-slate-400 mx-auto" />
            <p className="text-slate-400 text-xs font-medium">No billing records found in database.</p>
            <button
              onClick={handleCreateDemoInvoice}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-500"
            >
              Create your first demo GST invoice
            </button>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Invoice Number</th>
                  <th className="px-4 py-3 text-left">Buyer Details</th>
                  <th className="px-4 py-3 text-right">Grand Total</th>
                  <th className="px-4 py-3 text-center">Billing Status</th>
                  <th className="px-4 py-3 text-center">E-Invoice status</th>
                  <th className="px-4 py-3 text-center">E-Way Bill Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-slate-700 font-semibold">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800">{inv.buyerName}</div>
                      <div className="text-[9px] text-slate-450 font-mono mt-0.5">{inv.buyerGSTIN}</div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-800 font-mono">₹{inv.grandTotal.toFixed(2)}</td>
                    <td className="px-4 py-3.5 text-center">
                      <InvoiceStatusBadge status={inv.status} />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        inv.eInvoiceStatus === 'Generated'
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                          : 'bg-slate-100 border-slate-200 text-slate-500'
                      }`}>
                        {inv.eInvoiceStatus === 'Generated' ? <FileCheck className="h-3 w-3 mr-1" /> : <FileWarning className="h-3 w-3 mr-1" />}
                        {inv.eInvoiceStatus === 'Generated' ? 'IRN Active' : 'Not Sync'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        inv.eWayBillNo ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-slate-100 border-slate-200 text-slate-500'
                      }`}>
                        {inv.eWayBillNo ? 'Bill Created' : 'Not Generated'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <Link
                        to={`/invoices/${inv._id}`}
                        className="inline-flex items-center space-x-1 text-[11px] text-indigo-600 hover:text-indigo-550 font-bold bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg transition-all"
                      >
                        <Eye className="h-3 w-3" />
                        <span>View Detail</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
