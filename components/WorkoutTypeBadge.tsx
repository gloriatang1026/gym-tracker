import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { WorkoutTypeBadgeColors, BorderRadius, Spacing } from "../constants/theme";

interface WorkoutTypeBadgeProps {
  type: string;
  customType?: string;
}

export function WorkoutTypeBadge({ type, customType }: WorkoutTypeBadgeProps) {
  const displayType = type === "Custom" && customType ? customType : type;
  const colors = WorkoutTypeBadgeColors[type] || WorkoutTypeBadgeColors["Custom"];

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>{displayType}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
});
