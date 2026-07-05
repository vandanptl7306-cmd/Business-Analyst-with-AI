// client/src/context/AuthContext.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, loginUser, registerUser, loginWithGoogle, logoutUser } from '../services/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await getCurrentUser();
        if (response.success) {
          setUser(response.user);
          setToken(storedToken);
        } else {
          handleLogout();
        }
      } catch (err) {
        console.error('Session initialization error:', err.message);
        handleLogout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const handleLogin = async (credentials) => {
    setLoading(true);
    try {
      const response = await loginUser(credentials);
      if (response.success) {
        setToken(response.token);
        setUser(response.user);
      }
      return response;
    } catch (err) {
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (details) => {
    setLoading(true);
    try {
      const response = await registerUser(details);
      if (response.success) {
        setToken(response.token);
        setUser(response.user);
      }
      return response;
    } catch (err) {
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (idToken) => {
    setLoading(true);
    try {
      const response = await loginWithGoogle(idToken);
      if (response.success) {
        setToken(response.token);
        setUser(response.user);
      }
      return response;
    } catch (err) {
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setToken(null);
  };

  const value = {
    user,
    token,
    loading,
    login: handleLogin,
    register: handleRegister,
    googleLogin: handleGoogleLogin,
    logout: handleLogout,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
