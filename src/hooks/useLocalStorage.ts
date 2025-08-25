import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Estado para almacenar nuestro valor
  // Se pasa la función inicial de estado a useState para que la lógica se ejecute solo una vez
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      // Obtener del localStorage local por clave
      const item = window.localStorage.getItem(key);
      // Si no hay item, devolver initialValue
      if (!item) {
        return initialValue;
      }
      // Analizar el JSON almacenado
      return JSON.parse(item);
    } catch (error) {
      // Si hay error de parsing JSON, limpiar localStorage y devolver initialValue
      console.warn(`Error parsing localStorage key "${key}":`, error);
      try {
        window.localStorage.removeItem(key);
      } catch (removeError) {
        console.warn('Error removing invalid localStorage item:', removeError);
      }
      return initialValue;
    }
  });

  // Devolver una versión envuelta de la función setter de useState que ...
  // ... persiste el nuevo valor en localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Permitir que el valor sea una función para que tengamos la misma API que useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Guardar el estado
      setStoredValue(valueToStore);
      // Guardar en localStorage local
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      // Una implementación más avanzada manejaría el caso de error
      console.log(error);
    }
  };

  const removeValue = () => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue, removeValue] as const;
}

// Hook para obtener un valor de localStorage sin estado reactivo
export function useLocalStorageValue<T>(key: string, initialValue: T): T {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const item = window.localStorage.getItem(key);
        setValue(item ? JSON.parse(item) : initialValue);
      } catch (error) {
        console.log(error);
        setValue(initialValue);
      }
    }
  }, [key, initialValue]);

  return value;
}
