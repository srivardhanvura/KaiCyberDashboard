export interface UserPreferences {
  theme: "light" | "dark" | "auto";
  highContrast: boolean;
  fontSize: "small" | "medium" | "large";
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "auto",
  highContrast: false,
  fontSize: "medium",
};
