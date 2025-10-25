import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserPreferences } from '../types/preferences';
import { preferencesService } from '../services/PreferencesService';

interface PreferencesContextType {
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
  toggleTheme: () => void;
  toggleDarkMode: () => void;
  toggleCompactMode: () => void;
  toggleSidebar: () => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};

interface PreferencesProviderProps {
  children: React.ReactNode;
}

export const PreferencesProvider: React.FC<PreferencesProviderProps> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(preferencesService.getPreferences());

  useEffect(() => {
    const unsubscribe = preferencesService.subscribe((newPreferences) => {
      setPreferences(newPreferences);
    });

    return unsubscribe;
  }, []);

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    preferencesService.updatePreferences(updates);
  };

  const resetPreferences = () => {
    preferencesService.resetPreferences();
  };

  const toggleTheme = () => {
    preferencesService.toggleTheme();
  };

  const toggleDarkMode = () => {
    preferencesService.toggleDarkMode();
  };

  const toggleCompactMode = () => {
    preferencesService.toggleCompactMode();
  };

  const toggleSidebar = () => {
    preferencesService.toggleSidebar();
  };

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        updatePreferences,
        resetPreferences,
        toggleTheme,
        toggleDarkMode,
        toggleCompactMode,
        toggleSidebar,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};
