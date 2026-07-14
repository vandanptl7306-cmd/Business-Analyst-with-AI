// client/src/context/CurrencyContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoreSettings } from '../services/settings';

const CurrencyContext = createContext({ currency: '₹', setCurrency: () => {} });

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(() => {
    // Load from localStorage immediately so there's no flash
    return localStorage.getItem('businessCurrency') || '₹';
  });

  useEffect(() => {
    // Sync from backend on mount
    getStoreSettings()
      .then(res => {
        if (res?.success && res.settings?.businessCurrency) {
          const c = res.settings.businessCurrency;
          setCurrency(c);
          localStorage.setItem('businessCurrency', c);
        }
      })
      .catch(() => {});
  }, []);

  const updateCurrency = (c) => {
    setCurrency(c);
    localStorage.setItem('businessCurrency', c);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency: updateCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
