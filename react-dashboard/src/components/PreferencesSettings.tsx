import { useState } from "react";
import { usePreferences } from "../contexts/PreferencesContext";
import { getThemeStyles } from "../styles/theme";
import { dataService } from "../services/DataService";
import "./PreferencesSettings.css";

interface PreferencesSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const PreferencesSettings = ({ isOpen, onClose }: PreferencesSettingsProps) => {
  const { preferences, updatePreferences, resetPreferences } = usePreferences();
  const [activeTab, setActiveTab] = useState<"theme" | "accessibility">(
    "theme"
  );

  if (!isOpen) return null;

  const theme = getThemeStyles(preferences);

  const getTabClassName = (isActive: boolean) =>
    `tab-button ${isActive ? "active" : ""}`;

  return (
    <div className="preferences-overlay">
      <div
        className="preferences-modal"
        style={{ backgroundColor: theme.colors.background }}
      >
        {/* Header */}
        <div
          className="preferences-header"
          style={{ borderBottom: `1px solid ${theme.colors.border}` }}
        >
          <h2 style={{ color: theme.colors.text }}>⚙️ Preferences</h2>
          <button
            onClick={onClose}
            className="close-button"
            style={{ color: theme.colors.textSecondary }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div
          className="preferences-tabs"
          style={{
            backgroundColor: theme.colors.surface,
            borderBottom: `1px solid ${theme.colors.border}`,
          }}
        >
          <button
            className={getTabClassName(activeTab === "theme")}
            onClick={() => setActiveTab("theme")}
          >
            🎨 Theme
          </button>
          <button
            className={getTabClassName(activeTab === "accessibility")}
            onClick={() => setActiveTab("accessibility")}
          >
            ♿ Accessibility
          </button>
        </div>

        {/* Content */}
        <div className="preferences-content">
          {activeTab === "theme" && (
            <div>
              <h3 style={{ color: theme.colors.text }}>Theme Settings</h3>

              <label className="form-label">Theme Mode</label>
              <select
                value={preferences.theme}
                onChange={(e) =>
                  updatePreferences({ theme: e.target.value as any })
                }
                className="form-input"
              >
                <option value="light">☀️ Light</option>
                <option value="dark">🌙 Dark</option>
                <option value="auto">🔄 Auto (System)</option>
              </select>
            </div>
          )}

          {activeTab === "accessibility" && (
            <div>
              <h3 style={{ color: theme.colors.text }}>Accessibility</h3>

              <label className="form-label">Font Size</label>
              <select
                value={preferences.fontSize}
                onChange={(e) =>
                  updatePreferences({ fontSize: e.target.value as any })
                }
                className="form-input"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={preferences.highContrast}
                  onChange={(e) =>
                    updatePreferences({ highContrast: e.target.checked })
                  }
                  className="checkbox-input"
                />
                High Contrast Mode
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="preferences-footer"
          style={{ borderTop: `1px solid ${theme.colors.border}` }}
        >
          <div className="footer-buttons">
            <button
              onClick={resetPreferences}
              className="footer-button reset-button"
            >
              Reset Settings
            </button>
            {process.env.NODE_ENV === "development" && (
              <>
                <button
                  onClick={async () => {
                    if (
                      window.confirm(
                        "Clear all vulnerability data? This will require re-downloading."
                      )
                    ) {
                      await dataService.clearData();
                      window.location.reload();
                    }
                  }}
                  className="footer-button clear-data-button"
                >
                  Clear Data (Dev)
                </button>
                <button
                  onClick={async () => {
                    await dataService.regenerateAggregates();
                    alert("Aggregates regenerated! Check console for details.");
                  }}
                  className="footer-button regenerate-button"
                >
                  Regenerate Aggregates
                </button>
              </>
            )}
          </div>
          <button onClick={onClose} className="footer-button done-button">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreferencesSettings;
