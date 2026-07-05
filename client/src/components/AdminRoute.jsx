// client/src/components/AdminRoute.jsx

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-brand-500 animate-spin"></div>
        </div>
      </div>
    );
  }

  // Not authenticated? ProtectedRoute handles it, but check here just in case
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // authenticated but not Admin? Redirect to unauthorized screen
  if (user?.role !== 'Admin') {
    return <Navigate to="/unauthorized" replace />;
  }

  return children ? children : <Outlet />;
}
// 
