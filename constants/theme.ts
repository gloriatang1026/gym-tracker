import { Platform } from "react-native";

const brandPrimary = "#5cc1cb";

/** User-selectable app colour tone (Profile → Appearance). */
export type AppThemePreference = "light" | "dark";

export type ThemeColors = {
  text: string;
  textSecondary: string;
  buttonText: string;
  tabIconDefault: string;
  tabIconSelected: string;
  link: string;
  primary: string;
  success: string;
  warning: string;
  error: string;
  backgroundRoot: string;
  backgroundDefault: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  border: string;
  cardBorder: string;
};

export const Colors: Record<AppThemePreference, ThemeColors> = {
  light: {
    text: "#1A1A1A",
    textSecondary: "#A0A0A0",
    buttonText: "#FFFFFF",
    tabIconDefault: "#687076",
    tabIconSelected: brandPrimary,
    link: brandPrimary,
    primary: brandPrimary,
    success: "#4CAF50",
    warning: "#FFA726",
    error: "#E85D4C",
    backgroundRoot: "#FFFFFF",
    backgroundDefault: "#F5F5F5",
    backgroundSecondary: "#EBEBEB",
    backgroundTertiary: "#E0E0E0",
    border: "#E0E0E0",
    cardBorder: "#EBEBEB",
  },
  dark: {
    text: "#FFFFFF",
    textSecondary: "#A0A0A0",
    buttonText: "#FFFFFF",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: brandPrimary,
    link: brandPrimary,
    primary: brandPrimary,
    success: "#4CAF50",
    warning: "#FFA726",
    error: "#FF6B6B",
    backgroundRoot: "#1A1A1A",
    backgroundDefault: "#2C2C2C",
    backgroundSecondary: "#383838",
    backgroundTertiary: "#444444",
    border: "#3C3C3C",
    cardBorder: "#3C3C3C",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  display: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
  },
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const WorkoutTypeBadgeColors: Record<string, { bg: string; text: string }> = {
  "Push Day": { bg: "#E94B3C", text: "#FFFFFF" },
  "Pull Day": { bg: "#2196F3", text: "#FFFFFF" },
  "Leg Day": { bg: "#4CAF50", text: "#FFFFFF" },
  "Full Body": { bg: "#9C27B0", text: "#FFFFFF" },
  "Upper Body": { bg: "#FF9800", text: "#FFFFFF" },
  "Lower Body": { bg: "#009688", text: "#FFFFFF" },
  "Core Day": { bg: "#795548", text: "#FFFFFF" },
  "Cardio Day": { bg: "#F44336", text: "#FFFFFF" },
  "Rest/Active Recovery": { bg: "#607D8B", text: "#FFFFFF" },
  "Custom": { bg: "#3F51B5", text: "#FFFFFF" },
};
