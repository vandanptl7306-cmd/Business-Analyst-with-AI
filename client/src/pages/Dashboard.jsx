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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 bg-brand-500 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-brand-500/20">
                IB
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-350">
                IntellectBill AI
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-400 hidden md:inline-block">
                Welcome, <span className="font-semibold text-slate-200">{user?.name}</span>
              </span>

              <Link
                to="/customers"
                className="flex items-center space-x-2 text-sm bg-slate-800 hover:bg-slate-750 text-slate-350 px-3.5 py-2 rounded-xl border border-slate-750 transition-all font-medium"
              >
                <Users className="h-4 w-4" />
                <span>Customers</span>
              </Link>

              <Link
                to="/tally"
                className="flex items-center space-x-2 text-sm bg-slate-800 hover:bg-slate-750 text-slate-350 px-3.5 py-2 rounded-xl border border-slate-750 transition-all font-medium"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Tally Sync</span>
              </Link>

              <Link
                to="/forecast"
                className="flex items-center space-x-2 text-sm bg-slate-800 hover:bg-slate-750 text-slate-350 px-3.5 py-2 rounded-xl border border-slate-750 transition-all font-medium"
              >
                <BarChart2 className="h-4 w-4" />
                <span>Demand Forecast</span>
              </Link>

              {user?.role === 'Admin' && (
                <>
                  <Link
                    to="/reports"
                    className="flex items-center space-x-2 text-sm bg-slate-800 hover:bg-slate-750 text-slate-350 px-3.5 py-2 rounded-xl border border-slate-750 transition-all font-medium"
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span>Reports</span>
                  </Link>

                  <Link
                    to="/settings/onboarding"
                    className="flex items-center space-x-2 text-sm bg-slate-800 hover:bg-slate-750 text-slate-350 px-3.5 py-2 rounded-xl border border-slate-750 transition-all font-medium"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Business Profile</span>
                  </Link>

                  <Link
                    to="/admin/settings"
                    className="flex items-center space-x-2 text-sm bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 px-3.5 py-2 rounded-xl border border-brand-500/20 transition-all font-medium"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Admin Panel</span>
                  </Link>
                </>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-sm bg-slate-800 hover:bg-slate-750 text-slate-300 px-3.5 py-2 rounded-xl border border-slate-750 transition-all"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Panel */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-350">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-8 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-brand-500/10 rounded-full blur-2xl"></div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl text-slate-100">
            Welcome to your Dashboard
          </h1>
          <p className="mt-2 text-slate-400 max-w-2xl text-sm leading-relaxed">
            Manage your AI-powered B2B SaaS invoicing, track profit margins, and review operational billing analytics in real-time.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Revenue', value: kpis ? `$${kpis.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : `$${invoices.reduce((acc, i) => acc + i.grandTotal, 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, icon: DollarSign, change: 'Live Revenue', color: 'from-blue-500 to-indigo-500' },
            { label: 'Net Profit', value: kpis ? `$${kpis.totalProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : `$${invoices.reduce((acc, i) => acc + (i.netProfit || 0), 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, icon: TrendingUp, change: 'Live Profit', color: 'from-emerald-500 to-teal-500' },
            { label: 'Customer Repeat Rate', value: kpis ? `${kpis.repeatCustomerRate}%` : '35.0%', icon: Users, change: 'Retention', color: 'from-purple-500 to-pink-500' },
            { label: 'Total Accounts', value: kpis ? kpis.customersAcquired.toString() : '8', icon: UserCheck, change: 'Acquired', color: 'from-orange-500 to-amber-500' },
          ].map((stat, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                <div className={`p-2.5 rounded-xl bg-gradient-to-r ${stat.color} text-white shadow-lg`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-2xl font-bold tracking-tight">{stat.value}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Profit Insights Section (Admin only) */}
        {user?.role === 'Admin' && (
          <ProfitChart invoices={invoices} />
        )}

        {/* Invoices List Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-200">GST billing & Compliance</h2>
              <p className="text-xs text-slate-400 mt-1">Review invoices and verify GSP E-invoice and E-way bill generation status</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 px-3.5 py-2.5 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Next Auto Number:</span>
                <input
                  type="text"
                  readOnly
                  value={upcomingNumber || 'Loading...'}
                  className="bg-transparent text-xs font-mono text-brand-400 font-semibold border-none outline-none w-36 select-all cursor-default"
                />
              </div>

              <Link
                to="/invoices/create"
                className="flex items-center justify-center space-x-2 text-sm font-semibold bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 px-4 py-2.5 rounded-xl transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Create Custom Bill</span>
              </Link>

              <button
                onClick={handleCreateDemoInvoice}
                disabled={creating}
                className="flex items-center justify-center space-x-2 text-sm font-semibold bg-brand-500 hover:bg-brand-400 text-white px-4 py-2.5 rounded-xl transition-all disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating Invoice...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Create Demo GST Invoice</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-10 w-10 text-brand-500 animate-spin" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-800 rounded-2xl space-y-3">
              <FileText className="h-12 w-12 text-slate-650 mx-auto" />
              <p className="text-slate-400 text-sm">No billing records found in database.</p>
              <button
                onClick={handleCreateDemoInvoice}
                className="text-xs font-semibold text-brand-400 hover:text-brand-300"
              >
                Create your first demo GST invoice
              </button>
            </div>
          ) : (
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              <table className="min-w-full divide-y divide-slate-800 text-sm">
                <thead className="bg-slate-900/50 text-slate-400 text-xs">
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
                <tbody className="divide-y divide-slate-800 text-slate-350">
                  {invoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-4 py-4 font-mono text-slate-200 font-semibold">{inv.invoiceNumber}</td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-300">{inv.buyerName}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{inv.buyerGSTIN}</div>
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-slate-250">${inv.grandTotal.toFixed(2)}</td>
                      <td className="px-4 py-4 text-center">
                        <InvoiceStatusBadge status={inv.status} />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          inv.eInvoiceStatus === 'Generated'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-slate-800 border-slate-750 text-slate-400'
                        }`}>
                          {inv.eInvoiceStatus === 'Generated' ? <FileCheck className="h-3 w-3 mr-1" /> : <FileWarning className="h-3 w-3 mr-1" />}
                          {inv.eInvoiceStatus === 'Generated' ? 'IRN Active' : 'Not Sync'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          inv.eWayBillStatus === 'Generated'
                            ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                            : 'bg-slate-800 border-slate-750 text-slate-400'
                        }`}>
                          {inv.eWayBillStatus === 'Generated' ? 'Bill Created' : 'Not Generated'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Link
                          to={`/invoices/${inv._id}`}
                          className="inline-flex items-center space-x-1.5 text-xs text-brand-400 hover:text-brand-300 font-semibold bg-brand-500/10 border border-brand-500/20 px-3 py-1.5 rounded-lg transition-all"
                        >
                          <Eye className="h-3.5 w-3.5" />
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
      </main>
    </div>
  );
}
