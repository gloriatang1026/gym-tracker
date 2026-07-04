import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Modal,
  Pressable,
  TextInput,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedView } from "../components/ThemedView";
import { ThemedText } from "../components/ThemedText";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { WorkoutTypeBadge } from "../components/WorkoutTypeBadge";
import { EmptyState } from "../components/EmptyState"; // if used
import { useTheme } from "../hooks/useTheme";
import { useUser } from "../context/UserContext";
import { Spacing, BorderRadius } from "../constants/theme";
import {
  deleteWorkout,
  saveProgramLibrary,
  ProgramLibrary,
} from "../lib/storage";
import { getExerciseImageUrl } from "../lib/exerciseImages";
import { ExercisePickerThumbnail } from "../components/ExercisePickerThumbnail";
import { RootStackParamList } from "../navigation/RootStackNavigator";
import { showAlert } from "../lib/alert";

type RouteParams = RouteProp<RootStackParamList, "WorkoutDetail">;

export default function WorkoutDetailScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation();
  const route = useRoute<RouteParams>();
  const { workoutId } = route.params;
  const { currentUser, workouts, refreshWorkouts } = useUser();
  const [savePresetVisible, setSavePresetVisible] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [isSavingPreset, setIsSavingPreset] = useState(false);

  const workout = workouts.find((w) => w.id === workoutId);

  if (!workout || !currentUser) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.notFound}>
          <ThemedText>Workout not found</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const date = new Date(workout.date);
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const openSavePresetModal = () => {
    if (!workout || workout.exercises.length === 0) {
      showAlert("No Exercises", "This workout has no exercises to save as a program.");
      return;
    }
    const defaultName =
      workout.type === "Custom" && workout.customType
        ? workout.customType
        : `${workout.type} Program`;
    setPresetName(defaultName);
    setSavePresetVisible(true);
  };

  const handleSaveAsPreset = async () => {
    if (!currentUser || !workout) return;
    setIsSavingPreset(true);
    const lib: ProgramLibrary = {
      id: `lib${Date.now()}`,
      userId: currentUser.id,
      name: presetName.trim() || undefined,
      workoutType: workout.type,
      exercises: workout.exercises.map((ex) => ({
        name: ex.name,
        equipmentType: ex.equipmentType,
        machineBrand: ex.machineBrand,
      })),
    };
    await saveProgramLibrary(lib);
    setIsSavingPreset(false);
    setSavePresetVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showAlert(
      "Program Saved",
      "This workout was saved as a pre-set program. You can manage it in Profile → Pre-set Programs."
    );
  };

  const handleDelete = () => {
    showAlert(
      "Delete Workout",
      "Are you sure you want to delete this workout? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            await deleteWorkout(currentUser.id, workoutId);
            await refreshWorkouts();
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + Spacing["3xl"],
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <WorkoutTypeBadge type={workout.type} customType={workout.customType} />
          <ThemedText type="h3" style={styles.gymLocation}>
            {workout.gymLocation}
          </ThemedText>
        </View>

        <Card style={styles.metaCard}>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Feather name="calendar" size={18} color={theme.textSecondary} />
              <View>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Date
                </ThemedText>
                <ThemedText style={styles.metaValue}>{formattedDate}</ThemedText>
              </View>
            </View>
          </View>

          <View style={[styles.metaDivider, { backgroundColor: theme.border }]} />

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Feather name="clock" size={18} color={theme.textSecondary} />
              <View>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Time
                </ThemedText>
                <ThemedText style={styles.metaValue}>{formattedTime}</ThemedText>
              </View>
            </View>

            {workout.duration ? (
              <View style={styles.metaItem}>
                <Feather name="activity" size={18} color={theme.textSecondary} />
                <View>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    Duration
                  </ThemedText>
                  <ThemedText style={styles.metaValue}>
                    {Math.round(workout.duration / 60)} min
                  </ThemedText>
                </View>
              </View>
            ) : null}
          </View>
        </Card>

        <ThemedText type="h4" style={styles.sectionTitle}>
          Exercises ({workout.exercises.length})
        </ThemedText>

        {workout.exercises.map((exercise, index) => (
          <Card key={exercise.id} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseTitleRow}>
                <ExercisePickerThumbnail
                  imageUrl={getExerciseImageUrl(exercise.name)}
                  size={72}
                />
                <ThemedText type="h4" style={styles.exerciseName}>
                  {exercise.name}
                </ThemedText>
              </View>
              <View
                style={[
                  styles.equipmentBadge,
                  { backgroundColor: theme.backgroundSecondary },
                ]}
              >
                <ThemedText type="small">{exercise.equipmentType}</ThemedText>
              </View>
            </View>

            {exercise.machineBrand ? (
              <ThemedText
                type="small"
                style={[styles.machineBrand, { color: theme.textSecondary }]}
              >
                Brand: {exercise.machineBrand}
              </ThemedText>
            ) : null}

            {exercise.machineSetup ? (
              <View style={styles.machineSetupDetail}>
                {exercise.machineSetup.startingWeight != null ? (
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    Starting weight: {exercise.machineSetup.startingWeight}
                  </ThemedText>
                ) : null}
                {[
                  ["Seat height", exercise.machineSetup.seatHeight],
                  ["Backrest", exercise.machineSetup.backrest],
                  ["Handles", exercise.machineSetup.handles],
                  ["Pivot point", exercise.machineSetup.pivotPoint],
                ].map(([label, val]) =>
                  val != null ? (
                    <ThemedText
                      key={label as string}
                      type="small"
                      style={{ color: theme.textSecondary }}
                    >
                      {label}: {val}
                    </ThemedText>
                  ) : null
                )}
              </View>
            ) : null}

            <View style={styles.setsTable}>
              <View style={styles.setsHeader}>
                <ThemedText
                  type="small"
                  style={[styles.tableHeader, { color: theme.textSecondary }]}
                >
                  Set
                </ThemedText>
                <ThemedText
                  type="small"
                  style={[styles.tableHeader, styles.tableCell, { color: theme.textSecondary }]}
                >
                  Reps
                </ThemedText>
                <ThemedText
                  type="small"
                  style={[styles.tableHeader, styles.tableCell, { color: theme.textSecondary }]}
                >
                  Weight
                </ThemedText>
              </View>

              {exercise.sets.map((set, setIndex) => (
                <View key={setIndex} style={styles.setRow}>
                  <View
                    style={[
                      styles.setNumber,
                      { backgroundColor: theme.backgroundSecondary },
                    ]}
                  >
                    <ThemedText style={{ fontWeight: "600" }}>
                      {setIndex + 1}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.tableCell}>{set.reps}</ThemedText>
                  <ThemedText style={styles.tableCell}>
                    {set.weight} {set.weightUnit}
                  </ThemedText>
                </View>
              ))}
            </View>

            {exercise.notes ? (
              <View style={styles.notesSection}>
                <ThemedText
                  type="small"
                  style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}
                >
                  Notes
                </ThemedText>
                <ThemedText style={styles.notesText}>{exercise.notes}</ThemedText>
              </View>
            ) : null}
          </Card>
        ))}

        <Button
          onPress={openSavePresetModal}
          style={styles.savePresetButton}
        >
          Save as Pre-set Program
        </Button>

        <Button
          onPress={handleDelete}
          style={[styles.deleteButton, { backgroundColor: theme.error }]}
        >
          Delete Workout
        </Button>
      </ScrollView>

      <Modal
        visible={savePresetVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setSavePresetVisible(false)}
      >
        <Pressable
          style={styles.presetModalOverlay}
          onPress={() => setSavePresetVisible(false)}
        >
          <Pressable
            style={[styles.presetModalCard, { backgroundColor: theme.backgroundDefault }]}
            onPress={(e) => e.stopPropagation()}
          >
            <ThemedText type="h4" style={{ marginBottom: Spacing.sm }}>
              Save as Pre-set Program
            </ThemedText>
            <ThemedText
              type="small"
              style={{ color: theme.textSecondary, marginBottom: Spacing.lg }}
            >
              {workout.exercises.length} exercise(s) will be saved for workout type "
              {workout.type}".
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
              Program name
            </ThemedText>
            <TextInput
              style={[
                styles.presetNameInput,
                {
                  color: theme.text,
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: theme.border,
                },
              ]}
              value={presetName}
              onChangeText={setPresetName}
              placeholder="Program name"
              placeholderTextColor={theme.textSecondary}
            />
            <View style={styles.presetModalActions}>
              <Pressable
                style={[styles.presetModalBtn, { borderColor: theme.border }]}
                onPress={() => setSavePresetVisible(false)}
              >
                <ThemedText style={{ fontWeight: "600" }}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.presetModalBtn, { backgroundColor: theme.primary }]}
                onPress={handleSaveAsPreset}
                disabled={isSavingPreset}
              >
                <ThemedText style={{ fontWeight: "600", color: "#FFF" }}>
                  {isSavingPreset ? "Saving..." : "Save"}
                </ThemedText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    marginBottom: Spacing.lg,
  },
  gymLocation: {
    marginTop: Spacing.md,
  },
  metaCard: {
    padding: Spacing.lg,
    marginBottom: Spacing["2xl"],
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  metaValue: {
    fontSize: 15,
    fontWeight: "500",
  },
  metaDivider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  exerciseCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  exerciseTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginRight: Spacing.sm,
  },
  exerciseName: {
    flex: 1,
  },
  equipmentBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  machineBrand: {
    marginBottom: Spacing.sm,
  },
  machineSetupDetail: {
    marginBottom: Spacing.md,
    gap: 2,
  },
  setsTable: {
    marginTop: Spacing.md,
  },
  setsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  tableHeader: {
    width: 40,
  },
  tableCell: {
    flex: 1,
    textAlign: "center",
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  setNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  notesSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
  },
  notesText: {
    fontStyle: "italic",
  },
  savePresetButton: {
    marginTop: Spacing["2xl"],
    marginBottom: Spacing.md,
  },
  deleteButton: {
    marginBottom: Spacing.lg,
  },
  presetModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  presetModalCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  presetNameInput: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.lg,
  },
  presetModalActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  presetModalBtn: {
    flex: 1,
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});