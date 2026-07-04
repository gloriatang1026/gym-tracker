import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { navigateToNewWorkout } from "../navigation/navigationService";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "./ThemedText";
import { useTheme } from "../hooks/useTheme";
import { useActiveWorkout } from "../context/ActiveWorkoutContext";
import { RootStackParamList } from "../navigation/RootStackNavigator";
import { Spacing, BorderRadius } from "../constants/theme";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function ContinueWorkoutFAB() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { showContinueButton } = useActiveWorkout();

  if (!showContinueButton) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: insets.bottom + 84 }]}
    >
      <Pressable
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: theme.primary,
            opacity: pressed ? 0.9 : 1,
            shadowColor: theme.text,
          },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          navigateToNewWorkout();
        }}
      >
        <Feather name="play" size={18} color="#fff" />
        <ThemedText style={styles.label}>Continue Workout</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    right: Spacing.lg,
    zIndex: 1000,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  label: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
