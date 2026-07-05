// client/src/App.jsx

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

import Dashboard from './pages/Dashboard';
import AdminSettings from './pages/AdminSettings';
import Unauthorized from './pages/Unauthorized';
import InvoiceDetail from './pages/InvoiceDetail';
import CustomerLedger from './pages/CustomerLedger';
import CreateInvoice from './pages/CreateInvoice';
import TallySync from './pages/TallySync';
import Reports from './pages/Reports';
import BusinessOnboarding from './pages/BusinessOnboarding';
import DemandForecast from './pages/DemandForecast';

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden bg-slate-950">
              <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none"></div>
              <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none"></div>
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
            <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden bg-slate-950">
              <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none"></div>
              <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none"></div>
              <Register onToggleMode={() => navigate('/login')} />
            </div>
          )
        }
      />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/invoices/create" element={<CreateInvoice />} />
        <Route path="/invoices/:id" element={<InvoiceDetail />} />
        <Route path="/customers" element={<CustomerLedger />} />
        <Route path="/tally" element={<TallySync />} />
        <Route path="/forecast" element={<DemandForecast />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected + Admin Routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/settings/onboarding" element={<BusinessOnboarding />} />
          <Route path="/reports" element={<Reports />} />
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
