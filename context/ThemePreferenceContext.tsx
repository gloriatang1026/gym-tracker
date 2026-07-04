import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppThemePreference } from "../constants/theme";

const THEME_PREFERENCE_KEY = "app_theme_preference";

interface ThemePreferenceContextType {
  preference: AppThemePreference;
  setPreference: (value: AppThemePreference) => Promise<void>;
  isLoading: boolean;
}

const ThemePreferenceContext = createContext<
  ThemePreferenceContextType | undefined
>(undefined);

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<AppThemePreference>("light");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
        if (stored === "light" || stored === "dark") {
          setPreferenceState(stored);
        } else if (stored === "warm") {
          setPreferenceState("light");
        }
      } catch (error) {
        console.error("Error loading theme preference:", error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const setPreference = useCallback(async (value: AppThemePreference) => {
    setPreferenceState(value);
    try {
      await AsyncStorage.setItem(THEME_PREFERENCE_KEY, value);
    } catch (error) {
      console.error("Error saving theme preference:", error);
    }
  }, []);

  return (
    <ThemePreferenceContext.Provider
      value={{ preference, setPreference, isLoading }}
    >
      {children}
    </ThemePreferenceContext.Provider>
  );
}

export function useThemePreference() {
  const context = useContext(ThemePreferenceContext);
  if (context === undefined) {
    throw new Error(
      "useThemePreference must be used within ThemePreferenceProvider"
    );
  }
  return context;
}
