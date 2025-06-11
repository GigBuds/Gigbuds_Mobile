import { set } from 'lodash';
import React, { createContext, useContext, useState } from 'react';

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Đang tải...');

  const showLoading = (text = 'Đang tải...') => {
    setLoadingText(text);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false); // Auto hide after 5 seconds if not hidden manually
    }, 5000);
  };

  const hideLoading = () => {
    setIsLoading(false);
  };

  const value = {
    isLoading,
    loadingText,
    showLoading,
    hideLoading,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};