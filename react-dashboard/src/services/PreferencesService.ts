import { UserPreferences, DEFAULT_PREFERENCES } from '../types/preferences';

class PreferencesService {
  private preferences: UserPreferences = { ...DEFAULT_PREFERENCES };
  private listeners: ((preferences: UserPreferences) => void)[] = [];

  constructor() {
    this.loadPreferences();
  }

  private loadPreferences(): void {
    try {
      const stored = localStorage.getItem('vulnerability-dashboard-preferences');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.preferences = { ...DEFAULT_PREFERENCES, ...parsed };
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      this.preferences = { ...DEFAULT_PREFERENCES };
    }
  }

  private savePreferences(): void {
    try {
      localStorage.setItem('vulnerability-dashboard-preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }

  public getPreferences(): UserPreferences {
    return { ...this.preferences };
  }

  public updatePreferences(updates: Partial<UserPreferences>): void {
    this.preferences = { ...this.preferences, ...updates };
    this.savePreferences();
    this.notifyListeners();
  }

  public resetPreferences(): void {
    this.preferences = { ...DEFAULT_PREFERENCES };
    this.savePreferences();
    this.notifyListeners();
  }

  public subscribe(listener: (preferences: UserPreferences) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener({ ...this.preferences }));
  }

  // Helper methods for common operations
  public toggleTheme(): void {
    const currentTheme = this.preferences.theme;
    const newTheme = currentTheme === 'light' ? 'dark' : 
                    currentTheme === 'dark' ? 'auto' : 'light';
    this.updatePreferences({ theme: newTheme });
  }

  public toggleDarkMode(): void {
    this.updatePreferences({ theme: this.preferences.theme === 'dark' ? 'light' : 'dark' });
  }

  public toggleCompactMode(): void {
    this.updatePreferences({ compactMode: !this.preferences.compactMode });
  }

  public toggleSidebar(): void {
    this.updatePreferences({ sidebarCollapsed: !this.preferences.sidebarCollapsed });
  }
}

export const preferencesService = new PreferencesService();
