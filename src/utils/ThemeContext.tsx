'use client';
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useSpinner } from './GlobalSpinner';

interface ThemeContextType {
  isDarkMode: boolean;
  setIsDarkMode: (isDarkMode: boolean) => void;
}

interface ThemeProviderProps {
  children: ReactNode;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false; // SSR default
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? JSON.parse(savedTheme) : false;
  });
  const { setLoading } = useSpinner();

  const handleThemeChange = useCallback(() => {
    if (typeof window === 'undefined') return; // Skip SSR

    setLoading(true);

    // Remove any previous theme <link> if it exists
    const existingLink = document.getElementById('prime-theme');
    if (existingLink) {
      existingLink.remove();
    }

    // Create a new link
    const linkElement = document.createElement('link');
    linkElement.id = 'prime-theme';
    linkElement.rel = 'stylesheet';

    // Load either dark or light from a public CDN or node_modules
    linkElement.href = isDarkMode
      ? 'https://unpkg.com/primereact/resources/themes/lara-dark-indigo/theme.css'
      : 'https://unpkg.com/primereact/resources/themes/lara-light-indigo/theme.css';

    // Insert the new link
    document.head.appendChild(linkElement);

    // Set a timer to hide the loader after theme is loaded
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    // Cleanup function
    return () => {
      clearTimeout(timer);
    };
  }, [isDarkMode]); // Removed setLoading to prevent infinite loop

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Persist preference in localStorage
      localStorage.setItem('theme', JSON.stringify(isDarkMode));

      const cleanup = handleThemeChange();
      return cleanup;
    }
  }, [isDarkMode, handleThemeChange]);

  return <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode }}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
