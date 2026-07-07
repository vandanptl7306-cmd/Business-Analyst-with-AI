// client/src/App.jsx

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import DashboardLayout from './components/DashboardLayout';

import Dashboard from './pages/Dashboard';
import SettingsPage from './pages/Settings';
import Unauthorized from './pages/Unauthorized';
import InvoiceDetail from './pages/InvoiceDetail';
import CustomerLedger from './pages/CustomerLedger';
import CreateInvoice from './pages/CreateInvoice';
import TallySync from './pages/TallySync';
import Reports from './pages/Reports';
import DemandForecast from './pages/DemandForecast';

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
              {/* Animated gradient orbs */}
              <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none animate-pulse-subtle"></div>
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none animate-pulse-subtle" style={{ animationDelay: '1s' }}></div>
              <div className="absolute top-1/2 right-1/3 w-72 h-72 rounded-full bg-teal-500/5 blur-3xl pointer-events-none animate-pulse-subtle" style={{ animationDelay: '2s' }}></div>
              <Login onToggleMode={() => navigate('/register')} />
            </div>
          )
        }
      />
      
      <Route
        path="/register"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
              {/* Animated gradient orbs */}
              <div className="absolute top-1/3 right-1/3 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none animate-pulse-subtle"></div>
              <div className="absolute bottom-1/3 left-1/4 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none animate-pulse-subtle" style={{ animationDelay: '1s' }}></div>
              <div className="absolute top-1/2 right-1/2 w-72 h-72 rounded-full bg-amber-500/5 blur-3xl pointer-events-none animate-pulse-subtle" style={{ animationDelay: '2s' }}></div>
              <Register onToggleMode={() => navigate('/login')} />
            </div>
          )
        }
      />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/invoices/create" element={<CreateInvoice />} />
          <Route path="/invoices/:id" element={<InvoiceDetail />} />
          <Route path="/customers" element={<CustomerLedger />} />
          <Route path="/tally" element={<TallySync />} />
          <Route path="/forecast" element={<DemandForecast />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected + Admin Routes */}
          <Route element={<AdminRoute />}>
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
        </Route>
      </Route>

      {/* Root Path Fallback */}
      <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />

      {/* Wildcard Fallback */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

export default function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-client-id.apps.googleusercontent.com';

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
