import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, Pressable, Vibration } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "../components/ThemedText";
import { useTheme } from "../hooks/useTheme";
import { Spacing, BorderRadius } from "../constants/theme";
import { REST_TIMER_OPTIONS } from "../lib/storage";

interface RestTimerProps {
  onTimerEnd?: () => void;
}

export function RestTimer({ onTimerEnd }: RestTimerProps) {
  const { theme } = useTheme();
  const [isActive, setIsActive] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Wrap handleTimerEnd in useCallback to make it stable
  const handleTimerEnd = useCallback(() => {
    setIsActive(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Vibration.vibrate([0, 200, 100, 200, 100, 200]);
    onTimerEnd?.();
  }, [onTimerEnd]);  // only depends on onTimerEnd prop

  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      handleTimerEnd();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, timeRemaining, handleTimerEnd]);  // ← added handleTimerEnd (fixes ESLint warning)

  const startTimer = (duration: number) => {
    setSelectedDuration(duration);
    setTimeRemaining(duration);
    setIsActive(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const stopTimer = () => {
    setIsActive(false);
    setTimeRemaining(selectedDuration);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isActive) {
    return (
      <View
        style={[styles.activeContainer, { backgroundColor: theme.warning }]}
      >
        <View style={styles.timerContent}>
          <ThemedText style={styles.timerLabel} darkColor="#FFFFFF" lightColor="#FFFFFF">
            Rest Timer
          </ThemedText>
          <ThemedText style={styles.timerValue} darkColor="#FFFFFF" lightColor="#FFFFFF">
            {formatTime(timeRemaining)}
          </ThemedText>
        </View>
        <Pressable style={styles.stopButton} onPress={stopTimer}>
          <Feather name="x" size={24} color="#FFFFFF" />
        </Pressable>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}
    >
      <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}>
        Rest Timer
      </ThemedText>
      <View style={styles.buttonRow}>
        {REST_TIMER_OPTIONS.map((duration) => (
          <Pressable
            key={duration}
            style={({ pressed }) => [
              styles.durationButton,
              {
                backgroundColor: pressed
                  ? theme.primary
                  : theme.backgroundTertiary,
              },
            ]}
            onPress={() => startTimer(duration)}
          >
            <ThemedText style={styles.durationText}>
              {duration}s
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginVertical: Spacing.md,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  durationButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  durationText: {
    fontSize: 14,
    fontWeight: "600",
  },
  activeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginVertical: Spacing.md,
  },
  timerContent: {
    flex: 1,
  },
  timerLabel: {
    fontSize: 12,
    fontWeight: "500",
    opacity: 0.9,
  },
  timerValue: {
    fontSize: 22,
    fontWeight: "500",
  },
  stopButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
});