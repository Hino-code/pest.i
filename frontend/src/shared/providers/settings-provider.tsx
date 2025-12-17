import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  density: 'compact' | 'comfortable' | 'spacious';
  language: string;
  dateFormat: string;
  timeFormat: string;
}

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: AppSettings = {
  theme: 'light',
  density: 'comfortable',
  language: 'en',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12'
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('pest-i-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Error parsing saved settings:', error);
      }
    }
  }, []);

  // Apply theme changes
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      
      if (settings.theme === 'system') {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', prefersDark);
      } else {
        root.classList.toggle('dark', settings.theme === 'dark');
      }
    };

    applyTheme();

    // Listen for system theme changes if in system mode
    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.theme]);

  // Apply density changes
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing density classes
    root.classList.remove('density-compact', 'density-comfortable', 'density-spacious');
    
    // Add new density class
    root.classList.add(`density-${settings.density}`);
    
    // Update CSS custom properties based on density
    const densityMap = {
      compact: {
        spacing: '0.75rem',
        cardPadding: '1rem',
        fontSize: '14px',
        headerHeight: '3rem'
      },
      comfortable: {
        spacing: '1.5rem',
        cardPadding: '1.5rem',
        fontSize: '16px',
        headerHeight: '3.5rem'
      },
      spacious: {
        spacing: '2rem',
        cardPadding: '2rem',
        fontSize: '16px',
        headerHeight: '4rem'
      }
    };

    const densityValues = densityMap[settings.density];
    root.style.setProperty('--app-spacing', densityValues.spacing);
    root.style.setProperty('--app-card-padding', densityValues.cardPadding);
    root.style.setProperty('--app-font-size', densityValues.fontSize);
    root.style.setProperty('--app-header-height', densityValues.headerHeight);
  }, [settings.density]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('pest-i-settings', JSON.stringify(updated));
      return updated;
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.setItem('pest-i-settings', JSON.stringify(defaultSettings));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
