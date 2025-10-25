import React, { useState } from 'react';
import { usePreferences } from '../contexts/PreferencesContext';
import { getThemeStyles } from '../styles/theme';
import { dataService } from '../services/DataService';

interface PreferencesSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

function PreferencesSettings({ isOpen, onClose }: PreferencesSettingsProps) {
  const { preferences, updatePreferences, resetPreferences } = usePreferences();
  const [activeTab, setActiveTab] = useState<'appearance' | 'data' | 'accessibility'>('appearance');
  
  if (!isOpen) return null;

  const theme = getThemeStyles(preferences);

  const tabStyle = (isActive: boolean) => ({
    padding: theme.spacing.sm,
    backgroundColor: isActive ? theme.colors.primary : 'transparent',
    color: isActive ? '#ffffff' : theme.colors.text,
    border: 'none',
    borderRadius: theme.borderRadius,
    cursor: 'pointer',
    fontSize: theme.fontSize,
    transition: 'all 0.2s ease',
  });

  const inputStyle = {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius,
    fontSize: theme.fontSize,
    width: '100%',
    marginTop: theme.spacing.xs,
  };

  const labelStyle = {
    color: theme.colors.text,
    fontSize: theme.fontSize,
    fontWeight: '500',
    marginBottom: theme.spacing.xs,
    display: 'block',
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius,
        boxShadow: theme.shadows.lg,
        width: '90%',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: theme.spacing.lg,
          borderBottom: `1px solid ${theme.colors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{ margin: 0, color: theme.colors.text }}>⚙️ Preferences</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: theme.colors.textSecondary,
            }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: `1px solid ${theme.colors.border}`,
          backgroundColor: theme.colors.surface,
        }}>
          <button
            style={tabStyle(activeTab === 'appearance')}
            onClick={() => setActiveTab('appearance')}
          >
            🎨 Appearance
          </button>
          <button
            style={tabStyle(activeTab === 'data')}
            onClick={() => setActiveTab('data')}
          >
            📊 Data Display
          </button>
          <button
            style={tabStyle(activeTab === 'accessibility')}
            onClick={() => setActiveTab('accessibility')}
          >
            ♿ Accessibility
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: theme.spacing.lg,
          overflow: 'auto',
          flex: 1,
        }}>
          {activeTab === 'appearance' && (
            <div>
              <h3 style={{ color: theme.colors.text, marginTop: 0 }}>Theme Settings</h3>
              
              <label style={labelStyle}>
                Theme Mode
              </label>
              <select
                value={preferences.theme}
                onChange={(e) => updatePreferences({ theme: e.target.value as any })}
                style={inputStyle}
              >
                <option value="light">☀️ Light</option>
                <option value="dark">🌙 Dark</option>
                <option value="auto">🔄 Auto (System)</option>
              </select>

              <label style={labelStyle}>
                Primary Color
              </label>
              <input
                type="color"
                value={preferences.primaryColor}
                onChange={(e) => updatePreferences({ primaryColor: e.target.value })}
                style={{ ...inputStyle, height: '40px', padding: '4px' }}
              />

              <label style={labelStyle}>
                Accent Color
              </label>
              <input
                type="color"
                value={preferences.accentColor}
                onChange={(e) => updatePreferences({ accentColor: e.target.value })}
                style={{ ...inputStyle, height: '40px', padding: '4px' }}
              />

              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', marginTop: theme.spacing.md }}>
                <input
                  type="checkbox"
                  checked={preferences.compactMode}
                  onChange={(e) => updatePreferences({ compactMode: e.target.checked })}
                  style={{ marginRight: theme.spacing.sm }}
                />
                Compact Mode
              </label>
            </div>
          )}

          {activeTab === 'data' && (
            <div>
              <h3 style={{ color: theme.colors.text, marginTop: 0 }}>Data Display</h3>
              
              <label style={labelStyle}>
                Items Per Page
              </label>
              <select
                value={preferences.itemsPerPage}
                onChange={(e) => updatePreferences({ itemsPerPage: parseInt(e.target.value) })}
                style={inputStyle}
              >
                <option value={10}>10 items</option>
                <option value={20}>20 items</option>
                <option value={50}>50 items</option>
                <option value={100}>100 items</option>
              </select>

              <label style={labelStyle}>
                Date Format
              </label>
              <select
                value={preferences.dateFormat}
                onChange={(e) => updatePreferences({ dateFormat: e.target.value as any })}
                style={inputStyle}
              >
                <option value="relative">Relative (2 hours ago)</option>
                <option value="absolute">Absolute (2024-01-15)</option>
                <option value="both">Both</option>
              </select>

              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', marginTop: theme.spacing.md }}>
                <input
                  type="checkbox"
                  checked={preferences.showSeverityIcons}
                  onChange={(e) => updatePreferences({ showSeverityIcons: e.target.checked })}
                  style={{ marginRight: theme.spacing.sm }}
                />
                Show Severity Icons
              </label>

              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={preferences.showTimestamps}
                  onChange={(e) => updatePreferences({ showTimestamps: e.target.checked })}
                  style={{ marginRight: theme.spacing.sm }}
                />
                Show Timestamps
              </label>

              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={preferences.autoRefresh}
                  onChange={(e) => updatePreferences({ autoRefresh: e.target.checked })}
                  style={{ marginRight: theme.spacing.sm }}
                />
                Auto Refresh Data
              </label>
            </div>
          )}

          {activeTab === 'accessibility' && (
            <div>
              <h3 style={{ color: theme.colors.text, marginTop: 0 }}>Accessibility</h3>
              
              <label style={labelStyle}>
                Font Size
              </label>
              <select
                value={preferences.fontSize}
                onChange={(e) => updatePreferences({ fontSize: e.target.value as any })}
                style={inputStyle}
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>

              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', marginTop: theme.spacing.md }}>
                <input
                  type="checkbox"
                  checked={preferences.highContrast}
                  onChange={(e) => updatePreferences({ highContrast: e.target.checked })}
                  style={{ marginRight: theme.spacing.sm }}
                />
                High Contrast Mode
              </label>

              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={preferences.reducedMotion}
                  onChange={(e) => updatePreferences({ reducedMotion: e.target.checked })}
                  style={{ marginRight: theme.spacing.sm }}
                />
                Reduce Motion
              </label>

              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={preferences.showNotifications}
                  onChange={(e) => updatePreferences({ showNotifications: e.target.checked })}
                  style={{ marginRight: theme.spacing.sm }}
                />
                Show Notifications
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: theme.spacing.lg,
          borderTop: `1px solid ${theme.colors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', gap: theme.spacing.sm }}>
            <button
              onClick={resetPreferences}
              style={{
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                backgroundColor: theme.colors.error,
                color: '#ffffff',
                border: 'none',
                borderRadius: theme.borderRadius,
                cursor: 'pointer',
                fontSize: theme.fontSize,
              }}
            >
              Reset Settings
            </button>
            {process.env.NODE_ENV === 'development' && (
              <>
                <button
                  onClick={async () => {
                    if (window.confirm('Clear all vulnerability data? This will require re-downloading.')) {
                      await dataService.clearData();
                      window.location.reload();
                    }
                  }}
                  style={{
                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    backgroundColor: theme.colors.warning,
                    color: '#000000',
                    border: 'none',
                    borderRadius: theme.borderRadius,
                    cursor: 'pointer',
                    fontSize: theme.fontSize,
                  }}
                >
                  Clear Data (Dev)
                </button>
                <button
                  onClick={async () => {
                    await dataService.regenerateAggregates();
                    alert('Aggregates regenerated! Check console for details.');
                  }}
                  style={{
                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    backgroundColor: theme.colors.info,
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: theme.borderRadius,
                    cursor: 'pointer',
                    fontSize: theme.fontSize,
                  }}
                >
                  Regenerate Aggregates
                </button>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              backgroundColor: theme.colors.primary,
              color: '#ffffff',
              border: 'none',
              borderRadius: theme.borderRadius,
              cursor: 'pointer',
              fontSize: theme.fontSize,
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default PreferencesSettings;
