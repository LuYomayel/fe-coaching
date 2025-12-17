import { createContext, useState, useContext, useEffect } from 'react';
import { useSpinner } from '../utils/GlobalSpinner';
import { ThemeContextValue, ThemeProviderProps } from '../types/contexts';
export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');

    return savedTheme ? JSON.parse(savedTheme) : true; // Por defecto: darkMode activo
  });
  const { setLoading } = useSpinner();

  const toggleTheme = () => {
    setIsDarkMode((prev: boolean) => !prev);
  };

  useEffect(() => {
    // Persist preference in localStorage
    // localStorage.setItem('theme', JSON.stringify(isDarkMode));

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

    // Cleanup: remove link and clear timer on unmount
    return () => {
      clearTimeout(timer);
    };
  }, [isDarkMode, setLoading]);

  return <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode, toggleTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
