import React from "react";
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
} from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { usePreferences } from "../contexts/PreferencesContext";
import { getThemeColors } from "../styles/theme";

interface AppThemeProviderProps {
  children: React.ReactNode;
}

const AppThemeProvider: React.FC<AppThemeProviderProps> = ({ children }) => {
  const { preferences } = usePreferences();
  const themeColors = getThemeColors(preferences);

  const muiTheme = createTheme({
    palette: {
      mode:
        preferences.theme === "dark" ||
        (preferences.theme === "auto" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
          ? "dark"
          : "light",
      primary: {
        main: themeColors.primary,
      },
      secondary: {
        main: themeColors.secondary,
      },
      background: {
        default: themeColors.background,
        paper: themeColors.surface,
      },
      text: {
        primary: themeColors.text,
        secondary: themeColors.textSecondary,
      },
      error: {
        main: themeColors.error,
      },
      warning: {
        main: themeColors.warning,
      },
      info: {
        main: themeColors.info,
      },
      success: {
        main: themeColors.success,
      },
    },
    typography: {
      fontFamily: [
        "Plus Jakarta Sans",
        "Inter",
        "Inter var",
        "-apple-system",
        "BlinkMacSystemFont",
        "Segoe UI",
        "Roboto",
        "Helvetica Neue",
        "Arial",
        "Noto Sans",
        "Apple Color Emoji",
        "Segoe UI Emoji",
      ].join(","),
      fontSize:
        preferences.fontSize === "small"
          ? 14
          : preferences.fontSize === "large"
          ? 18
          : 16,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          "html, body, #root": {
            fontFamily:
              'Plus Jakarta Sans, Inter, Inter var, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji"',
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: themeColors.surface,
            color: themeColors.text,
            border: `1px solid ${themeColors.border}`,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: themeColors.surface,
            color: themeColors.text,
          },
        },
      },
      MuiTable: {
        styleOverrides: {
          root: {
            backgroundColor: themeColors.surface,
            color: themeColors.text,
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: themeColors.surface,
            "& .MuiTableCell-root": {
              backgroundColor: themeColors.surface,
              color: themeColors.text,
              borderBottom: `1px solid ${themeColors.border}`,
            },
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            "&:hover": {
              backgroundColor: themeColors.background,
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${themeColors.border}`,
            color: themeColors.text,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              backgroundColor: themeColors.background,
              color: themeColors.text,
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            backgroundColor: themeColors.background,
            color: themeColors.text,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            color: themeColors.text,
          },
        },
      },
    },
  });

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};

export default AppThemeProvider;
