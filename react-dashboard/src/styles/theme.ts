import { UserPreferences } from "../types/preferences";

export interface ThemeColors {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  shadow: string;
}

export const lightTheme: ThemeColors = {
  background: "#ffffff",
  surface: "#f8f9fa",
  primary: "#007bff",
  secondary: "#6c757d",
  text: "#212529",
  textSecondary: "#6c757d",
  border: "#dee2e6",
  success: "#28a745",
  warning: "#ffc107",
  error: "#dc3545",
  info: "#17a2b8",
  shadow: "rgba(0, 0, 0, 0.1)",
};

export const darkTheme: ThemeColors = {
  background: "#121212",
  surface: "#1e1e1e",
  primary: "#0d6efd",
  secondary: "#6c757d",
  text: "#ffffff",
  textSecondary: "#adb5bd",
  border: "#495057",
  success: "#198754",
  warning: "#fd7e14",
  error: "#dc3545",
  info: "#0dcaf0",
  shadow: "rgba(0, 0, 0, 0.3)",
};

export const lightHighContrastTheme: ThemeColors = {
  background: "#ffffff",
  surface: "#ffffff",
  primary: "#0000ff",
  secondary: "#000000",
  text: "#000000",
  textSecondary: "#000000",
  border: "#000000",
  success: "#008000",
  warning: "#ff8c00",
  error: "#ff0000",
  info: "#0000ff",
  shadow: "rgba(0, 0, 0, 0.5)",
};

export const darkHighContrastTheme: ThemeColors = {
  background: "#000000",
  surface: "#000000",
  primary: "#00ffff",
  secondary: "#ffffff",
  text: "#ffffff",
  textSecondary: "#ffffff",
  border: "#ffffff",
  success: "#00ff00",
  warning: "#ffff00",
  error: "#ff0000",
  info: "#00ffff",
  shadow: "rgba(255, 255, 255, 0.5)",
};

export const getThemeColors = (preferences: UserPreferences): ThemeColors => {
  const isDark =
    preferences.theme === "dark" ||
    (preferences.theme === "auto" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  let baseTheme: ThemeColors;
  if (preferences.highContrast) {
    baseTheme = isDark ? darkHighContrastTheme : lightHighContrastTheme;
  } else {
    baseTheme = isDark ? darkTheme : lightTheme;
  }

  return baseTheme;
};

export const getThemeStyles = (preferences: UserPreferences) => {
  const colors = getThemeColors(preferences);
  const fontSize =
    preferences.fontSize === "small"
      ? "14px"
      : preferences.fontSize === "large"
      ? "18px"
      : "16px";

  return {
    colors,
    fontSize,
    spacing: {
      xs: "8px",
      sm: "12px",
      md: "16px",
      lg: "24px",
      xl: "32px",
    },
    borderRadius: "8px",
    shadows: {
      sm: `0 1px 3px ${colors.shadow}`,
      md: `0 4px 6px ${colors.shadow}`,
      lg: `0 10px 15px ${colors.shadow}`,
    },
  };
};
