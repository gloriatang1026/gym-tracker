import { Colors } from "../constants/theme";
import { useThemePreference } from "../context/ThemePreferenceContext";

export function useTheme() {
  const { preference } = useThemePreference();
  const theme = Colors[preference];
  const isDark = preference === "dark";

  return {
    theme,
    isDark,
    preference,
  };
}
