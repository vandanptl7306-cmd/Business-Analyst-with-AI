// client/src/components/DashboardLayout.jsx

import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LogOut,
  Settings,
  Users,
  TrendingUp,
  RefreshCw,
  BarChart2,
  Sparkles,
  Sliders,
} from 'lucide-react';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const navItemClass = (path) => {
    const active = isActive(path);
    return `flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium transition-all text-sm ${
      active
        ? 'bg-slate-800 text-white border border-slate-700/50'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
    }`;
  };

  return (
    <div className="min-h-screen dashboard-grid-layout">
      {/* Sidebar Navigation */}
      <aside className="dashboard-sidebar">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
          <div className="h-9 w-9 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/30">
            IB
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            IntellectBill AI
          </span>
        </div>

        {/* Sidebar Nav Links */}
        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">Workspace Modules</div>
          
          <Link to="/dashboard" className={navItemClass('/dashboard')}>
            <Sliders className={`h-4 w-4 ${isActive('/dashboard') ? 'text-indigo-400' : 'text-slate-500'}`} />
            <span>Dashboard</span>
          </Link>

          <Link to="/customers" className={navItemClass('/customers')}>
            <Users className={`h-4 w-4 ${isActive('/customers') ? 'text-indigo-400' : 'text-slate-500'}`} />
            <span>Customers</span>
          </Link>

          <Link to="/tally" className={navItemClass('/tally')}>
            <RefreshCw className={`h-4 w-4 ${isActive('/tally') ? 'text-indigo-400' : 'text-slate-500'}`} />
            <span>Tally Sync</span>
          </Link>

          <Link to="/forecast" className={navItemClass('/forecast')}>
            <BarChart2 className={`h-4 w-4 ${isActive('/forecast') ? 'text-indigo-400' : 'text-slate-500'}`} />
            <span>Demand Forecast</span>
          </Link>

          {user?.role === 'Admin' && (
            <>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mt-6 mb-2">Management</div>
              
              <Link to="/reports" className={navItemClass('/reports')}>
                <TrendingUp className={`h-4 w-4 ${isActive('/reports') ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span>Reports</span>
              </Link>

              <Link to="/settings" className={navItemClass('/settings')}>
                <Settings className={`h-4 w-4 ${isActive('/settings') ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span>Settings</span>
              </Link>
            </>
          )}
        </div>

        {/* User profile & Logout footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
          <div className="flex items-center space-x-3 px-2">
            <div className="h-8 w-8 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-xs uppercase">
              {user?.name?.substring(0,2)}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-slate-200 truncate">{user?.name}</div>
              <div className="text-[10px] text-slate-550 font-mono capitalize">{user?.role}</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 text-xs bg-slate-900 hover:bg-slate-850 hover:text-red-400 text-slate-400 py-2 rounded-lg border border-slate-850 transition-all"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace container */}
      <main className="dashboard-workspace">
        <Outlet />
      </main>
    </div>
  );
}
