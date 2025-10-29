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
  background: "#F8FAFF",
  surface: "#FFFFFF",
  primary: "#6366F1",
  secondary: "#64748B",
  text: "#0F172A",
  textSecondary: "#475569",
  border: "#E2E8F0",
  success: "#16A34A",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#0EA5E9",
  shadow: "rgba(2, 6, 23, 0.08)",
};

export const darkTheme: ThemeColors = {
  background: "#0B1220",
  surface: "#111827",
  primary: "#818CF8",
  secondary: "#94A3B8",
  text: "#E5E7EB",
  textSecondary: "#9CA3AF",
  border: "#1F2937",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#F87171",
  info: "#38BDF8",
  shadow: "rgba(0, 0, 0, 0.35)",
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
