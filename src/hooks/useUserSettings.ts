import { useLocalStorage } from './useLocalStorage';
import { PropertyUnits } from '../types/shared-types';

export function useUserSettings() {
  // Configuración de tema
  const [isDarkMode, setIsDarkMode, , isDarkModeLoading] = useLocalStorage<boolean>('theme', false) as unknown as [
    boolean,
    (value: boolean | ((val: boolean) => boolean)) => void,
    () => void,
    boolean
  ];

  // Configuración de idioma
  const [locale, setLocale, , isLocaleLoading] = useLocalStorage<string>('locale', 'es') as unknown as [
    string,
    (value: string | ((val: string) => string)) => void,
    () => void,
    boolean
  ];

  // Configuración de unidades
  const [propertyUnits, setPropertyUnits, , isUnitsLoading] = useLocalStorage<PropertyUnits>('propertyUnits', {
    sets: 'sets',
    repetitions: 'repetitions',
    time: 'time',
    weight: 'weight',
    restInterval: 'restInterval',
    distance: 'distance',
    height: 'height',
    tempo: 'tempo',
    difficulty: 'difficulty',
    duration: 'duration',
    notes: 'notes',
    comments: 'comments',
    rpe: 'rpe'
  }) as unknown as [
    PropertyUnits,
    (value: PropertyUnits | ((val: PropertyUnits) => PropertyUnits)) => void,
    () => void
  ];

  // Función para actualizar el tema
  const updateTheme = (darkMode: boolean) => {
    setIsDarkMode(darkMode);
  };

  // Función para actualizar el idioma
  const updateLocale = (newLocale: string) => {
    setLocale(newLocale);
  };

  // Función para actualizar las unidades
  const updatePropertyUnits = (units: Partial<PropertyUnits>) => {
    setPropertyUnits((prev) => ({
      ...prev,
      ...units
    }));
  };

  // Función para guardar todas las configuraciones a la vez
  const saveAllSettings = (settings: { theme?: boolean; locale?: string; units?: Partial<PropertyUnits> }) => {
    if (settings.theme !== undefined) {
      setIsDarkMode(settings.theme);
    }
    if (settings.locale) {
      setLocale(settings.locale);
    }
    if (settings.units) {
      setPropertyUnits((prev) => ({
        ...prev,
        ...settings.units
      }));
    }
  };

  return {
    // Estados
    isDarkMode,
    locale,
    propertyUnits,
    isLoading: isDarkModeLoading || isLocaleLoading || isUnitsLoading,

    // Funciones
    updateTheme,
    updateLocale,
    updatePropertyUnits,
    saveAllSettings
  };
}
