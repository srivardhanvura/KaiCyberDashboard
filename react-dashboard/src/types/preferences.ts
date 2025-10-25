export interface UserPreferences {
  // Theme preferences
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  accentColor: string;
  
  // Layout preferences
  sidebarCollapsed: boolean;
  compactMode: boolean;
  
  // Data display preferences
  itemsPerPage: number;
  showSeverityIcons: boolean;
  showTimestamps: boolean;
  dateFormat: 'relative' | 'absolute' | 'both';
  
  // Dashboard preferences
  defaultView: 'overview' | 'detailed' | 'grid';
  autoRefresh: boolean;
  refreshInterval: number; // in seconds
  
  // Notification preferences
  showNotifications: boolean;
  soundEnabled: boolean;
  
  // Accessibility preferences
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  reducedMotion: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'auto',
  primaryColor: '#007bff',
  accentColor: '#28a745',
  sidebarCollapsed: false,
  compactMode: false,
  itemsPerPage: 20,
  showSeverityIcons: true,
  showTimestamps: true,
  dateFormat: 'relative',
  defaultView: 'overview',
  autoRefresh: true,
  refreshInterval: 30,
  showNotifications: true,
  soundEnabled: false,
  highContrast: false,
  fontSize: 'medium',
  reducedMotion: false,
};
