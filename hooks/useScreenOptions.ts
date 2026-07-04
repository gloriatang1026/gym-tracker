import { Platform } from "react-native";
import { NativeStackNavigationOptions } from "@react-navigation/native-stack";

// ────────────────────────────────────────────────
// IMPORTANT: Comment out or remove expo-glass-effect imports in Snack
//            (uncomment only when testing in real Expo Go / dev build on iOS)
// ────────────────────────────────────────────────

// import { isLiquidGlassAvailable } from "expo-glass-effect";  ← COMMENT THIS LINE

// Fallback: always assume not available in Snack / non-iOS environments
const isLiquidGlassAvailable = () => false; // ← simple fallback function

import { Colors, ThemeColors } from "../constants/theme";
import { useTheme } from "../hooks/useTheme"; // adjust path if needed

interface UseScreenOptionsParams {
  transparent?: boolean;
}

/** iOS transparent headers use a light blur; use dark text in app dark mode. */
export function getHeaderForegroundColor(
  theme: ThemeColors,
  isDark: boolean,
  transparent = true,
): string {
  if (Platform.OS === "ios" && transparent && isDark) {
    return Colors.light.text;
  }
  return theme.text;
}

export function useScreenOptions({
  transparent = true,
}: UseScreenOptionsParams = {}): NativeStackNavigationOptions {
  const { theme, isDark } = useTheme();
  const headerForegroundColor = getHeaderForegroundColor(theme, isDark, transparent);

  return {
    headerTitleAlign: "center",

    // Only apply blur/transparent on real iOS devices (not in Snack/web)
    headerTransparent: Platform.OS === "ios" ? transparent : false,

    // ────────────────────────────────────────────────
    // Liquid Glass specific props – only for iOS 26+
    // These are safe to include but will be ignored if module not present
    // In Snack they cause crash → so we guard them
    // ────────────────────────────────────────────────
    ...(Platform.OS === "ios" && isLiquidGlassAvailable()
      ? {
          headerTransparentEffect: transparent ? "dark" : "light", // or whatever default you want
          headerBlurEffect: isDark ? "dark" : "light",
        }
      : Platform.OS === "ios"
        ? {
            headerBlurEffect: isDark ? "dark" : "light",
          }
        : {}),

    headerTintColor: headerForegroundColor,
    headerTitleStyle: {
      color: headerForegroundColor,
    },

    headerBackground: () => undefined, // or your custom component if needed

    headerStyle: {
      backgroundColor: Platform.select({
        ios: undefined, // let blur handle it on real iOS
        android: theme.backgroundRoot,
        web: theme.backgroundRoot,
      }),
    },

    gestureEnabled: true,
    gestureDirection: "horizontal",

    // Only disable full-screen gesture if Liquid Glass is actually available
    fullScreenGestureEnabled: isLiquidGlassAvailable() ? false : true,

    contentStyle: {
      backgroundColor: theme.backgroundRoot,
    },
  };
}