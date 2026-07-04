import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  Switch,
  Modal,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements"; // correct package
import { useNavigation, useRoute, useFocusEffect, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootStackNavigator";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "../components/ThemedText";
import { ThemedView } from "../components/ThemedView";
import { Card } from "../components/Card";
import { BrandLogo } from "../components/BrandLogo";
import { PickerModal } from "../components/PickerModal";
import { NestedPickerModal } from "../components/NestedPickerModal";
import {
  ExercisePickerThumbnail,
  PICKER_EXERCISE_THUMB_SIZE,
} from "../components/ExercisePickerThumbnail";
import { RestTimer } from "../components/RestTimer";
import { useTheme } from "../hooks/useTheme";
import { useUser } from "../context/UserContext";
import { useActiveWorkout } from "../context/ActiveWorkoutContext";
import {
  getActiveWorkoutDraft,
  hasDraftContent,
  ActiveWorkoutDraft,
} from "../lib/activeWorkoutDraft";
import { Spacing, BorderRadius } from "../constants/theme";
import {
  Workout,
  Exercise,
  ExerciseSet,
  saveWorkout,
  getLastExerciseData,
  getBestExerciseData,
  getLastExerciseDataOther,
  getBestExerciseDataOther,
  getLastMachineSetup,
  getProgramLibraries,
  getProgramLibrariesForWorkoutType,
  getLastWorkoutForTypeAndLocation,
  getMostVisitedGymLocations,
  ProgramLibrary,
  getCustomExercises,
  SavedCustomExercise,
  addCustomExercise,
  WORKOUT_TYPES,
  EQUIPMENT_TYPES,
  MACHINE_BRANDS,
} from "../lib/storage";
import { GYM_REGIONS, MUSCLE_GROUPS, getMuscleGroupExercises } from "../lib/workoutData";
import { getExerciseImageUrl } from "../lib/exerciseImages";
import { getMuscleGroupImageUrl } from "../lib/muscleGroupImages";
import { getMachineBrandLogoUrl, formatRecordSourceLabel } from "../lib/machineBrands";
import {
  EMPTY_MACHINE_SETUP,
  machineSetupFromStorage,
  machineSetupToStorage,
  MachineSetupForm,
} from "../lib/machineSetup";
import { showAlert } from "../lib/alert";

interface DropSet {
  weight: string;
  reps: string;
}

interface SetData {
  reps: string;
  weight: string;
  drops: DropSet[];
}

interface ExerciseFormData {
  id: string;
  name: string;
  muscleGroup?: string;
  customName?: string;
  equipmentType: string;
  machineBrand?: string;
  machineSetup?: MachineSetupForm;
  sets: SetData[];
  weightUnit: "kg" | "lbs";
  enableDropset: boolean;
  lastReps?: number;
  lastWeight?: number;
  bestReps?: number;
  bestWeight?: number;
  lastOtherReps?: number;
  lastOtherWeight?: number;
  lastOtherEquipment?: string;
  lastOtherBrand?: string;
  bestOtherReps?: number;
  bestOtherWeight?: number;
  bestOtherEquipment?: string;
  bestOtherBrand?: string;
}

function NumberStepper({
  value,
  onValueChange,
  step,
  minValue = 0,
  placeholder = "0",
  theme,
  allowDecimals = true,
  compact = false,
}: {
  value: string;
  onValueChange: (value: string) => void;
  step: number;
  minValue?: number;
  placeholder?: string;
  theme: any;
  allowDecimals?: boolean;
  compact?: boolean;
}) {
  const increment = () => {
    const current = parseFloat(value) || 0;
    const newValue = current + step;
    onValueChange(newValue.toString());
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const decrement = () => {
    const current = parseFloat(value) || 0;
    const newValue = Math.max(minValue, current - step);
    onValueChange(newValue.toString());
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleTextChange = (text: string) => {
    if (text === "") {
      onValueChange(text);
      return;
    }
    const regex = allowDecimals ? /^\d*\.?\d*$/ : /^\d*$/;
    if (regex.test(text)) {
      onValueChange(text);
    }
  };

  return (
    <View style={[styles.stepperContainer, compact && styles.stepperContainerCompact]}>
      <Pressable
        style={[
          styles.stepperButton,
          compact && styles.stepperButtonCompact,
          { backgroundColor: theme.backgroundSecondary },
        ]}
        onPress={decrement}
      >
        <Feather name="minus" size={compact ? 14 : 16} color={theme.primary} />
      </Pressable>
      <TextInput
        style={[
          styles.stepperInput,
          compact && styles.stepperInputCompact,
          { backgroundColor: theme.backgroundSecondary, color: theme.text },
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        keyboardType="decimal-pad"
        value={value}
        onChangeText={handleTextChange}
      />
      <Pressable
        style={[
          styles.stepperButton,
          compact && styles.stepperButtonCompact,
          { backgroundColor: theme.backgroundSecondary },
        ]}
        onPress={increment}
      >
        <Feather name="plus" size={compact ? 14 : 16} color={theme.primary} />
      </Pressable>
    </View>
  );
}

function ExerciseCard({
  exercise,
  index,
  totalCount,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  userId,
  customExercises,
  onAddCustomExercise,
  onSelectExerciseName,
}: {
  exercise: ExerciseFormData;
  index: number;
  totalCount: number;
  onUpdate: (id: string, data: Partial<ExerciseFormData>) => void;
  onRemove: (id: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  userId: string;
  customExercises: SavedCustomExercise[];
  onAddCustomExercise: (value: string, categoryName?: string) => Promise<boolean>;
  onSelectExerciseName: (exerciseId: string, value: string, categoryName?: string) => void;
}) {
  const { theme } = useTheme();
  const [namePickerVisible, setNamePickerVisible] = useState(false);
  const [equipmentPickerVisible, setEquipmentPickerVisible] = useState(false);
  const [brandPickerVisible, setBrandPickerVisible] = useState(false);
  const [machineSetupOpen, setMachineSetupOpen] = useState(false);

  const fetchLastData = useCallback(async () => {
    if (exercise.name) {
      const hasEquipment = !!exercise.equipmentType;
      const [lastData, bestData, lastOtherData, bestOtherData] = await Promise.all([
        hasEquipment ? getLastExerciseData(userId, exercise.name, exercise.equipmentType, exercise.machineBrand) : Promise.resolve(null),
        hasEquipment ? getBestExerciseData(userId, exercise.name, exercise.equipmentType, exercise.machineBrand) : Promise.resolve(null),
        getLastExerciseDataOther(userId, exercise.name, exercise.equipmentType || "", exercise.machineBrand),
        getBestExerciseDataOther(userId, exercise.name, exercise.equipmentType || "", exercise.machineBrand),
      ]);
      onUpdate(exercise.id, {
        lastReps: hasEquipment ? lastData?.reps : undefined,
        lastWeight: hasEquipment ? lastData?.weight : undefined,
        bestReps: hasEquipment ? bestData?.reps : undefined,
        bestWeight: hasEquipment ? bestData?.weight : undefined,
        lastOtherReps: lastOtherData?.reps,
        lastOtherWeight: lastOtherData?.weight,
        lastOtherEquipment: lastOtherData?.equipmentType,
        lastOtherBrand: lastOtherData?.machineBrand,
        bestOtherReps: bestOtherData?.reps,
        bestOtherWeight: bestOtherData?.weight,
        bestOtherEquipment: bestOtherData?.equipmentType,
        bestOtherBrand: bestOtherData?.machineBrand,
      });
    } else {
      onUpdate(exercise.id, {
        lastReps: undefined,
        lastWeight: undefined,
        bestReps: undefined,
        bestWeight: undefined,
        lastOtherReps: undefined,
        lastOtherWeight: undefined,
        lastOtherEquipment: undefined,
        lastOtherBrand: undefined,
        bestOtherReps: undefined,
        bestOtherWeight: undefined,
        bestOtherEquipment: undefined,
        bestOtherBrand: undefined,
      });
    }
  }, [exercise.name, exercise.equipmentType, exercise.machineBrand, userId, exercise.id, onUpdate]);

  const fetchLastMachineSetupData = useCallback(async () => {
    if (
      exercise.name &&
      exercise.equipmentType === "Machine"
    ) {
      const lastSetup = await getLastMachineSetup(
        userId,
        exercise.name,
        exercise.machineBrand
      );
      onUpdate(exercise.id, {
        machineSetup: lastSetup
          ? machineSetupFromStorage(lastSetup)
          : { ...EMPTY_MACHINE_SETUP },
      });
    }
  }, [
    exercise.name,
    exercise.equipmentType,
    exercise.machineBrand,
    userId,
    exercise.id,
    onUpdate,
  ]);

  useEffect(() => {
    fetchLastData();
  }, [fetchLastData]);

  useEffect(() => {
    if (exercise.equipmentType !== "Machine") {
      setMachineSetupOpen(false);
      return;
    }
    if (exercise.machineSetup !== undefined) return;
    void fetchLastMachineSetupData();
  }, [
    exercise.equipmentType,
    exercise.name,
    exercise.machineBrand,
    exercise.machineSetup,
    fetchLastMachineSetupData,
  ]);

  const updateMachineSetupField = (
    field: keyof MachineSetupForm,
    value: string
  ) => {
    onUpdate(exercise.id, {
      machineSetup: {
        ...(exercise.machineSetup ?? EMPTY_MACHINE_SETUP),
        [field]: value,
      },
    });
  };

  const lastOtherLabel = formatRecordSourceLabel(
    exercise.lastOtherEquipment,
    exercise.lastOtherBrand
  );
  const bestOtherLabel = formatRecordSourceLabel(
    exercise.bestOtherEquipment,
    exercise.bestOtherBrand
  );

  const addSet = () => {
    Keyboard.dismiss();
    const lastSet = exercise.sets[exercise.sets.length - 1];
    const defaultReps = lastSet?.reps ?? "";
    const defaultWeight = lastSet?.weight ?? "";
    const newSets = [...exercise.sets, { reps: defaultReps, weight: defaultWeight, drops: [] }];
    onUpdate(exercise.id, { sets: newSets });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const removeSet = (setIndex: number) => {
    if (exercise.sets.length > 1) {
      const newSets = exercise.sets.filter((_, i) => i !== setIndex);
      onUpdate(exercise.id, { sets: newSets });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const updateSet = (
    setIndex: number,
    field: "reps" | "weight",
    value: string
  ) => {
    const newSets = [...exercise.sets];
    const existingSet = newSets[setIndex] || { reps: "", weight: "", drops: [] };
    newSets[setIndex] = { ...existingSet, [field]: value };
    onUpdate(exercise.id, { sets: newSets });
  };

  const addDrop = (setIndex: number) => {
    const newSets = [...exercise.sets];
    const existingSet = newSets[setIndex] || { reps: "", weight: "", drops: [] };
    const currentDrops = existingSet.drops || [];
    newSets[setIndex] = {
      ...existingSet,
      drops: [...currentDrops, { weight: "", reps: "" }],
    };
    onUpdate(exercise.id, { sets: newSets });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const updateDrop = (
    setIndex: number,
    dropIndex: number,
    field: "reps" | "weight",
    value: string
  ) => {
    const newSets = [...exercise.sets];
    const existingSet = newSets[setIndex] || { reps: "", weight: "", drops: [] };
    const newDrops = [...(existingSet.drops || [])];
    const existingDrop = newDrops[dropIndex] || { reps: "", weight: "" };
    newDrops[dropIndex] = { ...existingDrop, [field]: value };
    newSets[setIndex] = { ...existingSet, drops: newDrops };
    onUpdate(exercise.id, { sets: newSets });
  };

  const removeDrop = (setIndex: number, dropIndex: number) => {
    const newSets = [...exercise.sets];
    const existingSet = newSets[setIndex] || { reps: "", weight: "", drops: [] };
    const newDrops = (existingSet.drops || []).filter((_, i) => i !== dropIndex);
    newSets[setIndex] = { ...existingSet, drops: newDrops };
    onUpdate(exercise.id, { sets: newSets });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const showMachineBrand = exercise.equipmentType === "Machine" || exercise.equipmentType === "Cable" || exercise.equipmentType === "Free Weight";

  const muscleGroupCategories = useMemo(
    () =>
      MUSCLE_GROUPS.map((group) => ({
        name: group.name,
        items: getMuscleGroupExercises(group.name, customExercises),
      })),
    [customExercises]
  );

  return (
    <Card style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseHeaderLeft}>
          <ThemedText type="h4">Exercise {index + 1}</ThemedText>
          <View style={styles.reorderButtons}>
            <Pressable
              onPress={onMoveUp}
              hitSlop={8}
              disabled={index === 0}
              style={{ opacity: index === 0 ? 0.4 : 1 }}
            >
              <Feather name="chevron-up" size={22} color={theme.primary} />
            </Pressable>
            <Pressable
              onPress={onMoveDown}
              hitSlop={8}
              disabled={index >= totalCount - 1}
              style={{ opacity: index >= totalCount - 1 ? 0.4 : 1 }}
            >
              <Feather name="chevron-down" size={22} color={theme.primary} />
            </Pressable>
          </View>
        </View>
        <Pressable onPress={() => onRemove(exercise.id)} hitSlop={16}>
          <Feather name="trash-2" size={20} color={theme.error} />
        </Pressable>
      </View>

      <ThemedText
        type="small"
        style={[styles.label, { color: theme.textSecondary }]}
      >
        Exercise Name
      </ThemedText>
      <Pressable
        style={[styles.picker, { backgroundColor: theme.backgroundSecondary }]}
        onPress={() => {
          Keyboard.dismiss();
          setNamePickerVisible(true);
        }}
      >
        <View style={styles.exercisePickerValue}>
          {exercise.name ? (
            <ExercisePickerThumbnail
              imageUrl={getExerciseImageUrl(exercise.name)}
              size={PICKER_EXERCISE_THUMB_SIZE}
            />
          ) : null}
          <ThemedText
            style={[
              styles.exercisePickerLabel,
              !exercise.name ? { color: theme.textSecondary } : undefined,
            ]}
            numberOfLines={1}
          >
            {exercise.name || "Select exercise"}
          </ThemedText>
        </View>
        <Feather name="chevron-down" size={20} color={theme.textSecondary} />
      </Pressable>


      <ThemedText
        type="small"
        style={[styles.label, { color: theme.textSecondary }]}
      >
        Equipment Type
      </ThemedText>
      <Pressable
        style={[styles.picker, { backgroundColor: theme.backgroundSecondary }]}
        onPress={() => {
          Keyboard.dismiss();
          setEquipmentPickerVisible(true);
        }}
      >
        <ThemedText
          style={
            !exercise.equipmentType ? { color: theme.textSecondary } : undefined
          }
        >
          {exercise.equipmentType || "Select equipment"}
        </ThemedText>
        <Feather name="chevron-down" size={20} color={theme.textSecondary} />
      </Pressable>

      {showMachineBrand ? (
        <>
          <ThemedText
            type="small"
            style={[styles.label, { color: theme.textSecondary }]}
          >
            Machine Brand
          </ThemedText>
          <Pressable
            style={[
              styles.picker,
              { backgroundColor: theme.backgroundSecondary },
            ]}
            onPress={() => {
              Keyboard.dismiss();
              setBrandPickerVisible(true);
            }}
          >
            <View style={styles.brandPickerValue}>
              {exercise.machineBrand ? (
                <BrandLogo
                  imageUrl={getMachineBrandLogoUrl(exercise.machineBrand)}
                  size={24}
                />
              ) : null}
              <ThemedText
                style={
                  !exercise.machineBrand
                    ? { color: theme.textSecondary }
                    : undefined
                }
              >
                {exercise.machineBrand || "Select brand (optional)"}
              </ThemedText>
            </View>
            <Feather name="chevron-down" size={20} color={theme.textSecondary} />
          </Pressable>
        </>
      ) : null}

      {exercise.equipmentType === "Machine" ? (
        <View style={[styles.machineSetupSection, { borderColor: theme.border }]}>
          <Pressable
            style={styles.machineSetupHeader}
            onPress={() => setMachineSetupOpen((v) => !v)}
          >
            <ThemedText style={{ fontWeight: "600" }}>Machine Setup</ThemedText>
            <Feather
              name={machineSetupOpen ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.textSecondary}
            />
          </Pressable>
          {machineSetupOpen ? (
            <View
              style={[
                styles.machineSetupBody,
                { borderTopColor: theme.border },
              ]}
            >
              <ThemedText
                type="small"
                style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}
              >
                Optional — defaults from your last Machine session with the same
                brand when available.
              </ThemedText>
              <ThemedText
                type="small"
                style={[styles.label, { color: theme.textSecondary, marginTop: 0 }]}
              >
                Starting Weight ({exercise.weightUnit})
              </ThemedText>
              <NumberStepper
                value={exercise.machineSetup?.startingWeight ?? ""}
                onValueChange={(value) =>
                  updateMachineSetupField("startingWeight", value)
                }
                step={exercise.weightUnit === "kg" ? 2.5 : 5}
                theme={theme}
              />
              <ThemedText
                type="small"
                style={[styles.label, { color: theme.textSecondary }]}
              >
                Seat Height
              </ThemedText>
              <NumberStepper
                value={exercise.machineSetup?.seatHeight ?? ""}
                onValueChange={(value) =>
                  updateMachineSetupField("seatHeight", value)
                }
                step={1}
                theme={theme}
                allowDecimals={false}
              />
              <ThemedText
                type="small"
                style={[styles.label, { color: theme.textSecondary }]}
              >
                Backrest
              </ThemedText>
              <NumberStepper
                value={exercise.machineSetup?.backrest ?? ""}
                onValueChange={(value) =>
                  updateMachineSetupField("backrest", value)
                }
                step={1}
                theme={theme}
                allowDecimals={false}
              />
              <ThemedText
                type="small"
                style={[styles.label, { color: theme.textSecondary }]}
              >
                Handles
              </ThemedText>
              <NumberStepper
                value={exercise.machineSetup?.handles ?? ""}
                onValueChange={(value) =>
                  updateMachineSetupField("handles", value)
                }
                step={1}
                theme={theme}
                allowDecimals={false}
              />
              <ThemedText
                type="small"
                style={[styles.label, { color: theme.textSecondary }]}
              >
                Pivot Point
              </ThemedText>
              <NumberStepper
                value={exercise.machineSetup?.pivotPoint ?? ""}
                onValueChange={(value) =>
                  updateMachineSetupField("pivotPoint", value)
                }
                step={1}
                theme={theme}
                allowDecimals={false}
              />
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.dropsetToggle}>
        <ThemedText style={{ color: theme.textSecondary }}>
          Enable Dropset
        </ThemedText>
        <Switch
          value={exercise.enableDropset}
          onValueChange={(value) => onUpdate(exercise.id, { enableDropset: value })}
          trackColor={{ false: theme.border, true: theme.primary }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View style={styles.setsSection}>
        <View style={styles.setsHeader}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Sets
          </ThemedText>
          <View style={styles.unitToggle}>
            <Pressable
              style={[
                styles.unitButton,
                exercise.weightUnit === "kg" && {
                  backgroundColor: theme.primary,
                },
              ]}
              onPress={() => onUpdate(exercise.id, { weightUnit: "kg" })}
            >
              <ThemedText
                style={[
                  styles.unitText,
                  exercise.weightUnit === "kg" && { color: "#FFFFFF" },
                ]}
              >
                kg
              </ThemedText>
            </Pressable>
            <Pressable
              style={[
                styles.unitButton,
                exercise.weightUnit === "lbs" && {
                  backgroundColor: theme.primary,
                },
              ]}
              onPress={() => onUpdate(exercise.id, { weightUnit: "lbs" })}
            >
              <ThemedText
                style={[
                  styles.unitText,
                  exercise.weightUnit === "lbs" && { color: "#FFFFFF" },
                ]}
              >
                lbs
              </ThemedText>
            </Pressable>
          </View>
        </View>

        {(exercise.lastReps != null || exercise.lastWeight != null || exercise.bestReps != null || exercise.bestWeight != null || exercise.lastOtherReps != null || exercise.lastOtherWeight != null || exercise.bestOtherReps != null || exercise.bestOtherWeight != null) ? (
          <View style={styles.recordSection}>
            {(exercise.lastReps != null || exercise.lastWeight != null) && (
              <ThemedText type="small" style={[styles.recordRow, { color: theme.textSecondary }]}>
                Last (same equip & brand): {exercise.lastReps ?? "—"} reps @ {exercise.lastWeight ?? "—"} {exercise.weightUnit}
              </ThemedText>
            )}
            {(exercise.bestReps != null || exercise.bestWeight != null) && (
              <ThemedText type="small" style={[styles.recordRow, { color: theme.success }]}>
                Best (same equip & brand): {exercise.bestReps ?? "—"} reps @ {exercise.bestWeight ?? "—"} {exercise.weightUnit}
              </ThemedText>
            )}
            {(exercise.lastOtherReps != null || exercise.lastOtherWeight != null) && (
              <ThemedText type="small" style={[styles.recordRow, { color: theme.textSecondary }]}>
                Last ({lastOtherLabel}): {exercise.lastOtherReps ?? "—"} reps @{" "}
                {exercise.lastOtherWeight ?? "—"} {exercise.weightUnit}
              </ThemedText>
            )}
            {(exercise.bestOtherReps != null || exercise.bestOtherWeight != null) && (
              <ThemedText type="small" style={[styles.recordRow, { color: theme.success }]}>
                Best ({bestOtherLabel}): {exercise.bestOtherReps ?? "—"} reps @{" "}
                {exercise.bestOtherWeight ?? "—"} {exercise.weightUnit}
              </ThemedText>
            )}
          </View>
        ) : null}

        {exercise.sets.map((set, setIndex) => (
          <View key={setIndex} style={styles.setContainer}>
            <View style={styles.setRow}>
              <View style={[styles.setNumber, { backgroundColor: theme.primary }]}>
                <ThemedText style={{ fontWeight: "600", color: "#FFFFFF" }}>
                  {setIndex + 1}
                </ThemedText>
              </View>
              <View style={styles.setInputGroup}>
                <ThemedText
                  type="small"
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  Reps
                </ThemedText>
                <NumberStepper
                  value={set.reps}
                  onValueChange={(value) => updateSet(setIndex, "reps", value)}
                  step={1}
                  theme={theme}
                  allowDecimals={false}
                  compact
                />
              </View>
              <View style={styles.setInputGroup}>
                <ThemedText
                  type="small"
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  Weight
                </ThemedText>
                <NumberStepper
                  value={set.weight}
                  onValueChange={(value) => updateSet(setIndex, "weight", value)}
                  step={exercise.weightUnit === "kg" ? 2.5 : 5}
                  theme={theme}
                  compact
                />
              </View>
              <Pressable
                style={styles.removeSetButton}
                onPress={() => removeSet(setIndex)}
                disabled={exercise.sets.length <= 1}
              >
                <Feather
                  name="x-circle"
                  size={22}
                  color={
                    exercise.sets.length <= 1
                      ? theme.textSecondary
                      : theme.error
                  }
                />
              </Pressable>
            </View>

            {exercise.enableDropset ? (
              <View style={styles.dropsContainer}>
                {(set.drops || []).map((drop, dropIndex) => (
                  <View key={dropIndex} style={styles.dropRow}>
                    <View style={[styles.dropIndicator, { backgroundColor: theme.primary + "40" }]}>
                      <Feather name="arrow-down" size={12} color={theme.primary} />
                    </View>
                    <View style={styles.dropInputGroup}>
                      <ThemedText
                        type="small"
                        style={[styles.inputLabel, { color: theme.textSecondary }]}
                      >
                        Reps
                      </ThemedText>
                      <NumberStepper
                        value={drop.reps}
                        onValueChange={(value) =>
                          updateDrop(setIndex, dropIndex, "reps", value)
                        }
                        step={1}
                        theme={theme}
                        allowDecimals={false}
                        compact
                      />
                    </View>
                    <View style={styles.dropInputGroup}>
                      <ThemedText
                        type="small"
                        style={[styles.inputLabel, { color: theme.textSecondary }]}
                      >
                        Weight
                      </ThemedText>
                      <NumberStepper
                        value={drop.weight}
                        onValueChange={(value) =>
                          updateDrop(setIndex, dropIndex, "weight", value)
                        }
                        step={exercise.weightUnit === "kg" ? 2.5 : 5}
                        theme={theme}
                        compact
                      />
                    </View>
                    <Pressable
                      style={styles.removeSetButton}
                      onPress={() => removeDrop(setIndex, dropIndex)}
                    >
                      <Feather name="x-circle" size={20} color={theme.error} />
                    </Pressable>
                  </View>
                ))}
                <Pressable
                  style={styles.addDropButton}
                  onPress={() => addDrop(setIndex)}
                >
                  <Feather name="plus" size={14} color={theme.primary} />
                  <ThemedText style={{ color: theme.primary, fontSize: 13 }}>
                    Add Drop
                  </ThemedText>
                </Pressable>
              </View>
            ) : null}
          </View>
        ))}

        <Pressable style={styles.addSetButton} onPress={addSet}>
          <Feather name="plus" size={18} color={theme.primary} />
          <ThemedText style={{ color: theme.primary, fontWeight: "500" }}>
            Add Set
          </ThemedText>
        </Pressable>
      </View>

      <NestedPickerModal
        visible={namePickerVisible}
        onClose={() => setNamePickerVisible(false)}
        onSelect={(value, categoryName) =>
          onSelectExerciseName(exercise.id, value, categoryName)
        }
        categories={muscleGroupCategories}
        getItemImageUrl={getExerciseImageUrl}
        getCategoryImageUrl={getMuscleGroupImageUrl}
        title="Select Muscle Group"
        categoryTitle="Muscle Groups"
        itemTitle="Exercises"
        selectedValue={exercise.name}
        searchable
        onAddCustomItem={onAddCustomExercise}
      />

      <PickerModal
        visible={equipmentPickerVisible}
        onClose={() => setEquipmentPickerVisible(false)}
        onSelect={(value) => {
          const supportsBrand = value === "Machine" || value === "Cable" || value === "Free Weight";
          onUpdate(exercise.id, {
            equipmentType: value,
            machineBrand: supportsBrand ? exercise.machineBrand : undefined,
            machineSetup: value === "Machine" ? exercise.machineSetup : undefined,
          });
        }}
        options={EQUIPMENT_TYPES}
        title="Select Equipment"
        selectedValue={exercise.equipmentType}
      />

      <PickerModal
        visible={brandPickerVisible}
        onClose={() => setBrandPickerVisible(false)}
        onSelect={(value) =>
          onUpdate(exercise.id, { machineBrand: value, machineSetup: undefined })
        }
        options={MACHINE_BRANDS}
        title="Select Brand"
        selectedValue={exercise.machineBrand}
        getOptionImageUrl={getMachineBrandLogoUrl}
      />
    </Card>
  );
}

const DEFAULT_EXERCISES: ExerciseFormData[] = [
  {
    id: "1",
    name: "",
    equipmentType: "",
    sets: [{ reps: "", weight: "", drops: [] }],
    weightUnit: "kg",
    enableDropset: false,
  },
];

export default function NewWorkoutScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "NewWorkout">>();
  const { currentUser, refreshWorkouts, workouts, isLoading } = useUser();
  const {
    setNewWorkoutScreenActive,
    updateDraftSnapshot,
    flushDraft,
    clearDraft,
    reloadDraft,
  } = useActiveWorkout();

  const [workoutType, setWorkoutType] = useState("");
  const [customType, setCustomType] = useState("");
  const [gymLocation, setGymLocation] = useState("");
  const [exercises, setExercises] = useState<ExerciseFormData[]>(DEFAULT_EXERCISES);
  const [startTime, setStartTime] = useState(new Date().toISOString());
  const [typePickerVisible, setTypePickerVisible] = useState(false);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [programSelectModalVisible, setProgramSelectModalVisible] = useState(false);
  const [programOptions, setProgramOptions] = useState<ProgramLibrary[]>([]);
  const [loadedFromPreset, setLoadedFromPreset] = useState(false);
  const [customExercises, setCustomExercises] = useState<SavedCustomExercise[]>([]);

  const handleAddCustomExercise = useCallback(async (value: string, categoryName?: string) => {
    if (!currentUser?.id || !categoryName) return false;

    const trimmedValue = value.trim();
    if (!trimmedValue) return false;

    const added = await addCustomExercise(currentUser.id, categoryName, trimmedValue);
    if (added) {
      setCustomExercises((prev) => {
        const exists = prev.some(
          (exercise) =>
            exercise.muscleGroup === categoryName &&
            exercise.name.toLowerCase() === trimmedValue.toLowerCase()
        );
        if (exists) return prev;
        return [...prev, { muscleGroup: categoryName, name: trimmedValue }];
      });
    }

    return added;
  }, [currentUser?.id]);

  const applyDraft = useCallback((draft: ActiveWorkoutDraft) => {
    setWorkoutType(draft.workoutType);
    setCustomType(draft.customType);
    setGymLocation(draft.gymLocation);
    setExercises(
      draft.exercises.length > 0 ? draft.exercises : DEFAULT_EXERCISES
    );
    setStartTime(draft.startTime);
    setLoadedFromPreset(draft.loadedFromPreset);
  }, []);


  const loadProgramExercises = useCallback((lib: ProgramLibrary) => {
    const newExercises = lib.exercises.map((ex, i) => ({
      id: Date.now().toString() + i,
      name: ex.name,
      equipmentType: ex.equipmentType ?? "",
      machineBrand: ex.machineBrand,
      sets: [{ reps: "", weight: "", drops: [] }],
      weightUnit: "kg" as const,
      enableDropset: false,
    }));
    setExercises(newExercises);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const startFromProgramLibrary = useCallback(
    (lib: ProgramLibrary) => {
      setWorkoutType(lib.workoutType);
      setCustomType("");
      setGymLocation("");
      setStartTime(new Date().toISOString());
      loadProgramExercises(lib);
      setLoadedFromPreset(true);
    },
    [loadProgramExercises]
  );

  useFocusEffect(
    useCallback(() => {
      setNewWorkoutScreenActive(true);
      void (async () => {
        if (!currentUser) return;
        const programId = route.params?.programId;
        if (programId) {
          await clearDraft();
          const libs = await getProgramLibraries(currentUser.id);
          const lib = libs.find((l) => l.id === programId);
          if (lib && lib.exercises.length > 0) {
            startFromProgramLibrary(lib);
          }
          navigation.setParams({ programId: undefined });
          return;
        }
        const stored = await getActiveWorkoutDraft(currentUser.id);
        if (stored && hasDraftContent(stored)) {
          applyDraft(stored);
        }
      })();
      return () => {
        setNewWorkoutScreenActive(false);
        void flushDraft();
      };
    }, [
      currentUser?.id,
      route.params?.programId,
      applyDraft,
      startFromProgramLibrary,
      clearDraft,
      navigation,
      setNewWorkoutScreenActive,
      flushDraft,
    ])
  );

  useEffect(() => {
    if (!currentUser) {
      setCustomExercises([]);
      return;
    }

    void getCustomExercises(currentUser.id)
      .then(setCustomExercises)
      .catch((error) => {
        console.error("Error loading custom exercises:", error);
      });
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser) return;
    updateDraftSnapshot({
      userId: currentUser.id,
      workoutType,
      customType,
      gymLocation,
      exercises,
      startTime,
      loadedFromPreset,
    });
  }, [
    currentUser,
    workoutType,
    customType,
    gymLocation,
    exercises,
    startTime,
    loadedFromPreset,
    updateDraftSnapshot,
  ]);

  const resetExercisesToDefault = useCallback(() => {
    setExercises([
      {
        id: Date.now().toString(),
        name: "",
        equipmentType: "",
        sets: [{ reps: "", weight: "", drops: [] }],
        weightUnit: "kg" as const,
        enableDropset: false,
      },
    ]);
  }, []);

  const loadFromLastWorkout = useCallback((workout: Workout) => {
    const newExercises: ExerciseFormData[] = workout.exercises.map((ex, i) => {
      const hasDrops = ex.sets.some((s) => (s.drops?.length ?? 0) > 0);
      return {
        id: Date.now().toString() + i,
        name: ex.name,
        muscleGroup: undefined,
        equipmentType: ex.equipmentType,
        machineBrand: ex.machineBrand,
        machineSetup: ex.machineSetup
          ? machineSetupFromStorage(ex.machineSetup)
          : undefined,
        sets: ex.sets.map((s) => ({
          reps: s.reps.toString(),
          weight: s.weight.toString(),
          drops: (s.drops || []).map((d) => ({
            reps: d.reps.toString(),
            weight: d.weight.toString(),
          })),
        })),
        weightUnit: (ex.sets[0]?.weightUnit as "kg" | "lbs") || "kg",
        enableDropset: hasDrops,
      };
    });
    setExercises(newExercises);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleSelectGymLocation = useCallback(
    async (value: string) => {
      setGymLocation(value);
      if (
        !loadedFromPreset &&
        workoutType &&
        value &&
        currentUser &&
        (workoutType !== "Custom" || customType.trim())
      ) {
        const last = await getLastWorkoutForTypeAndLocation(
          currentUser.id,
          workoutType,
          value,
          workoutType === "Custom" ? customType : undefined
        );
        if (last) {
          const lastDate = new Date(last.date).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
          const typeLabel = workoutType === "Custom" ? `${workoutType} (${customType})` : workoutType;
          showAlert(
            "Copy from last time?",
            `Your last ${typeLabel} at ${value} was on ${lastDate} with ${last.exercises.length} exercise(s). Copy all exercises with equipment, sets, reps and weight? You can still edit.`,
            [
              { text: "No", style: "cancel" },
              { text: "Yes", onPress: () => loadFromLastWorkout(last) },
            ]
          );
        }
      }
    },
    [loadedFromPreset, workoutType, customType, currentUser, loadFromLastWorkout]
  );

  const handleSelectWorkoutType = useCallback(
    async (value: string) => {
      const prevType = workoutType;
      setWorkoutType(value);
      if (prevType !== value) {
        resetExercisesToDefault();
        setLoadedFromPreset(false);
      }
      if (value && value !== "Custom" && currentUser) {
        const libs = await getProgramLibrariesForWorkoutType(currentUser.id, value);
        if (libs.length > 0) {
          if (libs.length === 1) {
            showAlert(
              "Use Pre-set Program?",
              `Load ${libs[0].exercises.length} exercise(s) from "${libs[0].name || value}"? You can still edit.`,
              [
                { text: "No", style: "cancel" },
                {
                  text: "Yes",
                  onPress: () => {
                    loadProgramExercises(libs[0]);
                    setLoadedFromPreset(true);
                  },
                },
              ]
            );
          } else {
            showAlert(
              "Use Pre-set Program?",
              `You have ${libs.length} programs for ${value}. Load one?`,
              [
                { text: "No", style: "cancel" },
                {
                  text: "Yes",
                  onPress: () => {
                    setProgramOptions(libs);
                    setProgramSelectModalVisible(true);
                  },
                },
              ]
            );
          }
        }
      }
    },
    [currentUser, loadProgramExercises, workoutType, resetExercisesToDefault]
  );

  const gymRegionCategories = GYM_REGIONS.map((region) => ({
    name: region.name,
    items: region.branches,
  }));

  const updateExercise = useCallback((id: string, data: Partial<ExerciseFormData>) => {
    setExercises((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...data } : e))
    );
  }, []);

  const handleExerciseNameSelection = useCallback(
    async (exerciseId: string, value: string, categoryName?: string) => {
      if (!categoryName) {
        updateExercise(exerciseId, { name: value });
        return;
      }

      updateExercise(exerciseId, { name: value, muscleGroup: categoryName });
    },
    [updateExercise]
  );

  const frequentGymLocations = useMemo(
    () => getMostVisitedGymLocations(workouts, 2),
    [workouts]
  );

  const addExercise = useCallback(() => {
    Keyboard.dismiss();
    const newExercise: ExerciseFormData = {
      id: Date.now().toString(),
      name: "",
      muscleGroup: undefined,
      equipmentType: "",
      sets: [{ reps: "", weight: "", drops: [] }],
      weightUnit: "kg",
      enableDropset: false,
    };
    setExercises((prev) => [...prev, newExercise]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const removeExercise = useCallback((id: string) => {
    setExercises((prev) => {
      if (prev.length <= 1) return prev;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return prev.filter((e) => e.id !== id);
    });
  }, []);

  const moveExerciseUp = useCallback((index: number) => {
    if (index <= 0) return;
    setExercises((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const moveExerciseDown = useCallback((index: number) => {
    setExercises((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const validateWorkout = (): boolean => {
    if (!workoutType) {
      showAlert("Missing Info", "Please select a workout type");
      return false;
    }
    if (workoutType === "Custom" && !customType.trim()) {
      showAlert("Missing Info", "Please enter a custom workout name");
      return false;
    }
    if (!gymLocation) {
      showAlert("Missing Info", "Please select a gym location");
      return false;
    }

    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      if (!ex.name) {
        showAlert("Missing Info", `Please select an exercise for Exercise ${i + 1}`);
        return false;
      }
      if (!ex.equipmentType) {
        showAlert("Missing Info", `Please select equipment for Exercise ${i + 1}`);
        return false;
      }
      const hasValidSet = ex.sets.some(
        (s) => (s.reps && s.reps.trim() !== "") || (s.weight && s.weight.trim() !== "")
      );
      if (!hasValidSet) {
        showAlert("Missing Info", `Please enter at least one set with reps or weight for Exercise ${i + 1}`);
        return false;
      }
    }

    return true;
  };

  const handleFinishWorkout = () => {
    Keyboard.dismiss?.();

    if (!validateWorkout() || !currentUser) return;

    showAlert(
      "Finish Workout?",
      "Your workout will be saved and cannot be edited afterwards. Do you want to continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Finish",
          onPress: () => void confirmFinishWorkout(),
        },
      ]
    );
  };

  const confirmFinishWorkout = async () => {
    if (!currentUser) return;

    setIsSaving(true);

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }

    const endTime = new Date().toISOString();
    const duration = Math.round(
      (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000
    );

    const workoutExercises: Exercise[] = exercises
      .map((ex) => {
        const mappedSets = ex.sets
          .filter((s) => (s.reps && s.reps.trim() !== "") || (s.weight && s.weight.trim() !== ""))
          .map((s) => {
            const baseSet: ExerciseSet = {
              reps: Math.max(0, parseInt(String(s.reps), 10) || 0),
              weight: Math.max(0, parseFloat(String(s.weight)) || 0),
              weightUnit: ex.weightUnit,
            };
            if (ex.enableDropset && s.drops && s.drops.length > 0) {
              (baseSet as any).drops = s.drops
                .filter((d) => (d.reps && d.reps.trim() !== "") || (d.weight && d.weight.trim() !== ""))
                .map((d) => ({
                  reps: Math.max(0, parseInt(String(d.reps), 10) || 0),
                  weight: Math.max(0, parseFloat(String(d.weight)) || 0),
                }));
            }
            return baseSet;
          });
        const machineSetup =
          ex.equipmentType === "Machine"
            ? machineSetupToStorage(ex.machineSetup)
            : undefined;
        return {
          id: ex.id,
          name: ex.name,
          equipmentType: ex.equipmentType,
          machineBrand: ex.machineBrand,
          ...(machineSetup ? { machineSetup } : {}),
          sets: mappedSets,
        };
      })
      .filter((ex) => ex.sets.length > 0);

    const workout: Workout = {
      id: Date.now().toString(),
      userId: currentUser.id,
      type: workoutType,
      customType: workoutType === "Custom" ? customType : undefined,
      gymLocation,
      exercises: workoutExercises,
      startTime,
      endTime,
      duration,
      date: new Date().toISOString(),
    };

    await saveWorkout(workout);
    await refreshWorkouts();
    await clearDraft();
    await reloadDraft();

    setIsSaving(false);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    navigation.goBack();
  };

  const handleCancelWorkout = () => {
    Keyboard.dismiss();
    showAlert(
      "Cancel Workout?",
      "Are you sure you want to cancel? Your progress will not be saved.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            await clearDraft();
            await reloadDraft();
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centeredContent]}>
        <ThemedText type="h4">Loading profile…</ThemedText>
        <ThemedText style={[styles.centeredMessage, { color: theme.textSecondary }]}>Preparing your workout screen.</ThemedText>
      </ThemedView>
    );
  }

  if (!currentUser) {
    return (
      <ThemedView style={[styles.container, styles.centeredContent]}>
        <Card style={styles.emptyStateCard}>
          <ThemedText type="h4">No profile selected</ThemedText>
          <ThemedText style={[styles.centeredMessage, { color: theme.textSecondary }]}>Choose a profile first to start a workout.</ThemedText>
          <Pressable
            style={[styles.finishButton, { backgroundColor: theme.primary, marginTop: Spacing.lg }]}
            onPress={() => navigation.navigate("ProfileSelection")}
          >
            <ThemedText style={{ color: "#FFF", fontWeight: "600" }}>Go to Profiles</ThemedText>
          </Pressable>
        </Card>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText
            type="small"
            style={[styles.label, { color: theme.textSecondary }]}
          >
            Workout Type *
          </ThemedText>
          <Pressable
            style={[styles.picker, { backgroundColor: theme.backgroundDefault }]}
            onPress={() => {
              Keyboard.dismiss();
              setTypePickerVisible(true);
            }}
          >
            <ThemedText
              style={!workoutType ? { color: theme.textSecondary } : undefined}
            >
              {workoutType || "Select workout type"}
            </ThemedText>
            <Feather name="chevron-down" size={20} color={theme.textSecondary} />
          </Pressable>

          {workoutType === "Custom" ? (
            <TextInput
              style={[
                styles.textInput,
                { backgroundColor: theme.backgroundDefault, color: theme.text },
              ]}
              placeholder="Enter custom workout name"
              placeholderTextColor={theme.textSecondary}
              value={customType}
              onChangeText={setCustomType}
            />
          ) : null}

          <ThemedText
            type="small"
            style={[styles.label, { color: theme.textSecondary }]}
          >
            Gym Location *
          </ThemedText>
          <Pressable
            style={[styles.picker, { backgroundColor: theme.backgroundDefault }]}
            onPress={() => {
              Keyboard.dismiss();
              setLocationPickerVisible(true);
            }}
          >
            <ThemedText
              style={!gymLocation ? { color: theme.textSecondary } : undefined}
              numberOfLines={1}
            >
              {gymLocation || "Select gym location"}
            </ThemedText>
            <Feather name="chevron-down" size={20} color={theme.textSecondary} />
          </Pressable>

          

          <View style={styles.exercisesSection}>
            <ThemedText type="h4" style={styles.exercisesTitle}>
              Exercises
            </ThemedText>

            {exercises.map((exercise, index) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                index={index}
                totalCount={exercises.length}
                onUpdate={updateExercise}
                onRemove={removeExercise}
                onMoveUp={() => moveExerciseUp(index)}
                onMoveDown={() => moveExerciseDown(index)}
                userId={currentUser.id}
                customExercises={customExercises}
                onAddCustomExercise={handleAddCustomExercise}
                onSelectExerciseName={handleExerciseNameSelection}
              />
            ))}

            <Pressable
              style={[
                styles.addExerciseButton,
                { borderColor: theme.primary },
              ]}
              onPress={addExercise}
            >
              <Feather name="plus" size={20} color={theme.primary} />
              <ThemedText style={{ color: theme.primary, fontWeight: "600" }}>
                Add Exercise
              </ThemedText>
            </Pressable>
          </View>

          <RestTimer />
          
          <Pressable
            onPress={handleFinishWorkout}
            disabled={isSaving}
            style={({ pressed }) => [
              styles.finishButton,
              {
                backgroundColor: theme.primary,
                opacity: isSaving ? 0.5 : pressed ? 0.9 : 1,
              },
            ]}
          >
            <ThemedText style={[styles.buttonText, { color: "#FFF" }]}>
              {isSaving ? "Saving..." : "Finish Workout"}
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={handleCancelWorkout}
            disabled={isSaving}
            style={({ pressed }) => [
              styles.cancelButton,
              {
                borderColor: theme.border,
                backgroundColor: pressed ? theme.backgroundSecondary : theme.backgroundDefault,
                opacity: isSaving ? 0.5 : pressed ? 0.7 : 1,
              },
            ]}
          >
            <ThemedText style={styles.buttonText}>Cancel</ThemedText>
          </Pressable>
        </ScrollView>
      </TouchableWithoutFeedback>

      <PickerModal
        visible={typePickerVisible}
        onClose={() => setTypePickerVisible(false)}
        onSelect={handleSelectWorkoutType}
        options={WORKOUT_TYPES}
        title="Select Workout Type"
        selectedValue={workoutType}
      />

      <NestedPickerModal
        visible={locationPickerVisible}
        onClose={() => setLocationPickerVisible(false)}
        onSelect={handleSelectGymLocation}
        categories={gymRegionCategories}
        directSelectItems={frequentGymLocations}
        title="Select Gym Location"
        categoryTitle="Regions"
        itemTitle="Branches"
        selectedValue={gymLocation}
        searchable
      />

      <Modal
        visible={programSelectModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setProgramSelectModalVisible(false)}
      >
        <View style={styles.programModalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setProgramSelectModalVisible(false)}
          />
          <View
            style={[
              styles.programModalContent,
              {
                backgroundColor: theme.backgroundDefault,
                paddingBottom: insets.bottom + Spacing.lg,
              },
            ]}
          >
            <View style={styles.programModalHeader}>
              <ThemedText type="h4">Select Pre-set Program</ThemedText>
              <Pressable onPress={() => setProgramSelectModalVisible(false)} hitSlop={16}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.programModalList}>
              {programOptions.map((lib) => (
                <Pressable
                  key={lib.id}
                  style={({ pressed }) => [
                    styles.programOption,
                    {
                      backgroundColor: pressed ? theme.backgroundSecondary : "transparent",
                    },
                  ]}
                  onPress={() => {
                    loadProgramExercises(lib);
                    setLoadedFromPreset(true);
                    setProgramSelectModalVisible(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{ fontWeight: "600" }}>
                      {lib.name || lib.workoutType}
                    </ThemedText>
                    <ThemedText
                      type="small"
                      style={{ color: theme.textSecondary, marginTop: 6, lineHeight: 18 }}
                    >
                      {lib.exercises.length > 0
                        ? lib.exercises.map((ex) => ex.name).join(" · ")
                        : "No exercises"}
                    </ThemedText>
                  </View>
                  <Feather name="chevron-right" size={20} color={theme.textSecondary} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centeredContent: {
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  centeredMessage: {
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  emptyStateCard: {
    width: "100%",
    maxWidth: 360,
    padding: Spacing.lg,
    alignItems: "center",
  },
  programModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  programModalContent: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    maxHeight: "60%",
  },
  programModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    zIndex: 1,
  },
  modalTitle: {
    marginBottom: Spacing.lg,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  modalButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  programModalList: {
    maxHeight: 300,
  },
  programOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  picker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: Spacing.inputHeight,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  brandPickerValue: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginRight: Spacing.sm,
  },
  machineSetupSection: {
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  machineSetupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  machineSetupBody: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  exercisePickerValue: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginRight: Spacing.sm,
  },
  exercisePickerLabel: {
    flex: 1,
  },
  textInput: {
    height: Spacing.inputHeight,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    fontSize: 16,
    marginTop: Spacing.sm,
  },
  exercisesSection: {
    marginTop: Spacing["2xl"],
  },
  exercisesTitle: {
    marginBottom: Spacing.lg,
  },
  exerciseCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  exerciseHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  reorderButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  dropsetToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  setsSection: {
    marginTop: Spacing.lg,
  },
  setsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  unitToggle: {
    flexDirection: "row",
    borderRadius: BorderRadius.xs,
    overflow: "hidden",
  },
  unitButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  unitText: {
    fontSize: 12,
    fontWeight: "600",
  },
  recordSection: {
    marginBottom: Spacing.md,
  },
  recordRow: {
    fontStyle: "italic",
    marginBottom: Spacing.xs,
  },
  setContainer: {
    marginBottom: Spacing.md,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.xs,
    width: "100%",
  },
  setNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    flexShrink: 0,
  },
  setInputGroup: {
    flex: 1,
    minWidth: 0,
  },
  inputLabel: {
    fontSize: 11,
    marginBottom: 4,
    textAlign: "center",
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  stepperContainerCompact: {
    flex: 1,
    minWidth: 0,
  },
  stepperButton: {
    width: 28,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.xs,
    flexShrink: 0,
  },
  stepperButtonCompact: {
    width: 24,
    height: 32,
  },
  stepperInput: {
    flex: 1,
    minWidth: 0,
    height: 36,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.xs,
    fontSize: 14,
    textAlign: "center",
    marginHorizontal: 2,
  },
  stepperInputCompact: {
    height: 32,
    fontSize: 13,
    paddingHorizontal: 2,
    marginHorizontal: 1,
  },
  removeSetButton: {
    width: 26,
    alignItems: "center",
    marginBottom: 4,
    flexShrink: 0,
  },
  dropsContainer: {
    marginLeft: 36,
    marginTop: Spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: "#E94B3C40",
    paddingLeft: Spacing.md,
  },
  dropRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
    width: "100%",
  },
  dropIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  dropInputGroup: {
    flex: 1,
    minWidth: 0,
  },
  addDropButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  addSetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  addExerciseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderStyle: "dashed",
  },
  finishButton: {
    marginTop: Spacing["3xl"],
    marginBottom: Spacing.md,
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  buttonText: {
    fontWeight: "600",
  },
});