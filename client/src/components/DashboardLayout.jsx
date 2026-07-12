// client/src/components/DashboardLayout.jsx

import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LogOut,
  Settings,
  TrendingUp,
  RefreshCw,
  BarChart2,
  Sliders,
  Package,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  ShoppingBag,
} from 'lucide-react';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const navItemClass = (path) => {
    const active = isActive(path);
    return `flex items-center rounded-xl font-medium transition-all text-sm ${
      sidebarOpen ? 'space-x-3 px-3 py-2.5' : 'justify-center px-0 py-2.5 w-full'
    } ${
      active
        ? 'bg-slate-800 text-white border border-slate-700/50'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
    }`;
  };

  const iconColor = (path) =>
    isActive(path) ? 'text-indigo-400' : 'text-slate-500';

  return (
    <div className="min-h-screen dashboard-grid-layout" style={{ gridTemplateColumns: sidebarOpen ? '260px 1fr' : '60px 1fr' }}>

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside
        className="dashboard-sidebar"
        style={{ width: sidebarOpen ? 260 : 60, minWidth: sidebarOpen ? 260 : 60, transition: 'width 0.22s ease, min-width 0.22s ease', overflow: 'hidden' }}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between" style={{ minHeight: 65 }}>
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="h-9 w-9 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/30 flex-shrink-0">
              IB
            </div>
            {sidebarOpen && (
              <span className="text-xl font-bold tracking-tight text-white whitespace-nowrap">
                IntellectBill AI
              </span>
            )}
          </div>

          {/* Close / Open toggle button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex-shrink-0 flex items-center justify-center h-7 w-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-all"
            title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {sidebarOpen
              ? <ChevronLeft className="h-3.5 w-3.5" />
              : <ChevronRight className="h-3.5 w-3.5" />
            }
          </button>
        </div>

        {/* Nav Links */}
        <div className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
          {sidebarOpen && (
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
              Workspace Modules
            </div>
          )}

          <Link to="/dashboard" className={navItemClass('/dashboard')} title={!sidebarOpen ? 'Dashboard' : ''}>
            <Sliders className={`h-4 w-4 flex-shrink-0 ${iconColor('/dashboard')}`} />
            {sidebarOpen && <span>Dashboard</span>}
          </Link>

          <Link to="/sales/create" className={navItemClass('/sales/create')} title={!sidebarOpen ? 'Add Sale' : ''}>
            <ShoppingCart className={`h-4 w-4 flex-shrink-0 ${iconColor('/sales/create')}`} />
            {sidebarOpen && <span>Add Sale</span>}
          </Link>

          <Link to="/purchases/create" className={navItemClass('/purchases/create')} title={!sidebarOpen ? 'Add Purchase' : ''}>
            <ShoppingBag className={`h-4 w-4 flex-shrink-0 ${iconColor('/purchases/create')}`} />
            {sidebarOpen && <span>Add Purchase</span>}
          </Link>

          <Link to="/stock" className={navItemClass('/stock')} title={!sidebarOpen ? 'Stock' : ''}>
            <Package className={`h-4 w-4 flex-shrink-0 ${iconColor('/stock')}`} />
            {sidebarOpen && <span>Stock</span>}
          </Link>

          <Link to="/tally" className={navItemClass('/tally')} title={!sidebarOpen ? 'Tally Sync' : ''}>
            <RefreshCw className={`h-4 w-4 flex-shrink-0 ${iconColor('/tally')}`} />
            {sidebarOpen && <span>Tally Sync</span>}
          </Link>

          <Link to="/forecast" className={navItemClass('/forecast')} title={!sidebarOpen ? 'Demand Forecast' : ''}>
            <BarChart2 className={`h-4 w-4 flex-shrink-0 ${iconColor('/forecast')}`} />
            {sidebarOpen && <span>Demand Forecast</span>}
          </Link>

          {user?.role === 'Admin' && (
            <>
              {sidebarOpen && (
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mt-6 mb-2">
                  Management
                </div>
              )}
              {!sidebarOpen && <div className="border-t border-slate-800 my-2" />}

              <Link to="/reports" className={navItemClass('/reports')} title={!sidebarOpen ? 'Reports' : ''}>
                <TrendingUp className={`h-4 w-4 flex-shrink-0 ${iconColor('/reports')}`} />
                {sidebarOpen && <span>Reports</span>}
              </Link>

              <Link to="/settings" className={navItemClass('/settings')} title={!sidebarOpen ? 'Settings' : ''}>
                <Settings className={`h-4 w-4 flex-shrink-0 ${iconColor('/settings')}`} />
                {sidebarOpen && <span>Settings</span>}
              </Link>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 space-y-2">
          <Link
            to="/profile"
            className="flex items-center rounded-xl px-2 py-1.5 group hover:bg-slate-900/60 transition-all"
            title={!sidebarOpen ? user?.name : ''}
          >
            <div className="h-8 w-8 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
              {user?.name?.substring(0, 2)}
            </div>
            {sidebarOpen && (
              <>
                <div className="truncate flex-1 min-w-0 ml-3">
                  <div className="text-xs font-semibold text-slate-200 truncate">{user?.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono capitalize">
                    <span>{user?.role}</span>
                  </div>
                </div>
                <UserCircle className="h-3.5 w-3.5 text-slate-600 group-hover:text-indigo-400 flex-shrink-0 transition-colors ml-2" />
              </>
            )}
          </Link>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center justify-center text-xs bg-slate-900 hover:bg-slate-800 hover:text-red-400 text-slate-400 py-2 rounded-lg border border-slate-800 transition-all ${sidebarOpen ? 'space-x-2' : ''}`}
            title={!sidebarOpen ? 'Logout' : ''}
          >
            <LogOut className="h-3.5 w-3.5 flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="dashboard-workspace">
        <Outlet />
      </main>
    </div>
  );
}
