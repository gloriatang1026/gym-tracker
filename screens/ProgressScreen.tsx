import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootStackNavigator";
import { Feather } from "@expo/vector-icons";
import Svg, { Line, Circle, Text as SvgText, G } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { ThemedView } from "../components/ThemedView";
import { ThemedText } from "../components/ThemedText";
import { Card } from "../components/Card";
import { PickerModal } from "../components/PickerModal";
import { getMachineBrandLogoUrl } from "../lib/machineBrands";
import { NestedPickerModal } from "../components/NestedPickerModal";
import { EmptyState } from "../components/EmptyState";
import { useTheme } from "../hooks/useTheme";
import { useUser } from "../context/UserContext";
import { Spacing, BorderRadius } from "../constants/theme";
import { MUSCLE_GROUPS, getMuscleGroupExercises } from "../lib/workoutData";
import { getExerciseImageUrl } from "../lib/exerciseImages";
import { getMuscleGroupImageUrl } from "../lib/muscleGroupImages";
import {
  ExercisePickerThumbnail,
  PICKER_EXERCISE_THUMB_SIZE,
} from "../components/ExercisePickerThumbnail";
import { getCustomExercises, SavedCustomExercise } from "../lib/storage";

const CHART_WIDTH = Dimensions.get("window").width - Spacing.lg * 4;
const CHART_HEIGHT = 200;
const CHART_PADDING = 40;

interface DataPoint {
  date: string;
  weight: number;
  reps: number;
  workoutId: string;
}

function getAxisTicks(min: number, max: number, count: number): number[] {
  const range = max - min;
  const step = range / (count - 1) || 1;
  const ticks: number[] = [];
  for (let i = 0; i < count; i++) {
    ticks.push(Math.round((min + step * i) * 10) / 10);
  }
  return ticks;
}

function RepsWeightChart({ data }: { data: DataPoint[] }) {
  const { theme } = useTheme();
  const [selectedPoint, setSelectedPoint] = useState<DataPoint | null>(null);

  if (data.length === 0) {
    return (
      <View
        style={[
          styles.chartPlaceholder,
          { backgroundColor: theme.backgroundSecondary },
        ]}
      >
        <ThemedText style={{ color: theme.textSecondary }}>
          No data to display
        </ThemedText>
      </View>
    );
  }

  const reps = data.map((d) => d.reps);
  const weights = data.map((d) => d.weight);
  const minReps = Math.max(0, Math.min(...reps) - 1);
  const maxReps = Math.max(...reps) + 1;
  const minWeight = Math.min(...weights) * 0.9;
  const maxWeight = Math.max(...weights) * 1.1;
  const repsRange = maxReps - minReps || 1;
  const weightRange = maxWeight - minWeight || 1;

  const chartWidth = CHART_WIDTH - CHART_PADDING * 2;
  const chartHeight = CHART_HEIGHT - CHART_PADDING * 2;

  const points = data.map((d) => {
    const x = CHART_PADDING + ((d.reps - minReps) / repsRange) * chartWidth;
    const y =
      CHART_HEIGHT -
      CHART_PADDING -
      ((d.weight - minWeight) / weightRange) * chartHeight;
    return {
      x,
      y,
      reps: d.reps,
      weight: d.weight,
      date: d.date,
      workoutId: d.workoutId,
    };
  });

  const yTicks = getAxisTicks(minWeight, maxWeight, 5);
  const xTicks = getAxisTicks(minReps, maxReps, 5);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <View style={styles.chartContainer}>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        {/* X axis line */}
        <Line
          x1={CHART_PADDING}
          y1={CHART_HEIGHT - CHART_PADDING}
          x2={CHART_WIDTH - CHART_PADDING}
          y2={CHART_HEIGHT - CHART_PADDING}
          stroke={theme.border}
          strokeWidth={1}
        />
        {/* Y axis line */}
        <Line
          x1={CHART_PADDING}
          y1={CHART_PADDING}
          x2={CHART_PADDING}
          y2={CHART_HEIGHT - CHART_PADDING}
          stroke={theme.border}
          strokeWidth={1}
        />

        {/* Y axis ticks and labels */}
        {yTicks.map((tick, i) => {
          const y =
            CHART_HEIGHT -
            CHART_PADDING -
            ((tick - minWeight) / weightRange) * chartHeight;
          return (
            <G key={`y-${i}`}>
              <Line
                x1={CHART_PADDING}
                y1={y}
                x2={CHART_PADDING - 4}
                y2={y}
                stroke={theme.border}
                strokeWidth={1}
              />
              <SvgText
                x={CHART_PADDING - 8}
                y={y + 4}
                fontSize={10}
                fill={theme.textSecondary}
                textAnchor="end"
              >
                {tick % 1 === 0 ? tick : tick.toFixed(1)}
              </SvgText>
            </G>
          );
        })}

        {/* X axis ticks and labels */}
        {xTicks.map((tick, i) => {
          const x =
            CHART_PADDING + ((tick - minReps) / repsRange) * chartWidth;
          return (
            <G key={`x-${i}`}>
              <Line
                x1={x}
                y1={CHART_HEIGHT - CHART_PADDING}
                x2={x}
                y2={CHART_HEIGHT - CHART_PADDING + 4}
                stroke={theme.border}
                strokeWidth={1}
              />
              <SvgText
                x={x}
                y={CHART_HEIGHT - CHART_PADDING + 14}
                fontSize={10}
                fill={theme.textSecondary}
                textAnchor="middle"
              >
                {tick % 1 === 0 ? tick : tick.toFixed(1)}
              </SvgText>
            </G>
          );
        })}

        {/* Axis labels */}
        <SvgText
          x={CHART_PADDING - 8}
          y={CHART_PADDING - 8}
          fontSize={11}
          fill={theme.textSecondary}
          textAnchor="end"
        >
          Weight (kg)
        </SvgText>
        <SvgText
          x={CHART_WIDTH / 2}
          y={CHART_HEIGHT - 2}
          fontSize={11}
          fill={theme.textSecondary}
          textAnchor="middle"
        >
          Reps
        </SvgText>

        {/* Scatter points */}
        {points.map((p, i) => {
          const isSelected =
            selectedPoint &&
            p.date === selectedPoint.date &&
            p.reps === selectedPoint.reps &&
            p.weight === selectedPoint.weight;
          return (
            <Circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={isSelected ? 8 : 6}
              fill={theme.primary}
              stroke={isSelected ? theme.primary : theme.backgroundRoot}
              strokeWidth={isSelected ? 3 : 2}
              onPress={() => {
                Haptics.selectionAsync();
                const isSame =
                  selectedPoint &&
                  p.date === selectedPoint.date &&
                  p.reps === selectedPoint.reps &&
                  p.weight === selectedPoint.weight;
                setSelectedPoint(
                  isSame
                    ? null
                    : {
                        date: p.date,
                        weight: p.weight,
                        reps: p.reps,
                        workoutId: p.workoutId,
                      }
                );
              }}
            />
          );
        })}
      </Svg>

      {selectedPoint ? (
        <View
          style={[
            styles.chartTooltip,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {formatDate(selectedPoint.date)}
          </ThemedText>
          <ThemedText style={{ fontWeight: "600", marginTop: 2 }}>
            {selectedPoint.weight} kg × {selectedPoint.reps} reps
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

export default function ProgressScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { workouts, currentUser } = useUser();

  const [selectedExercise, setSelectedExercise] = useState("");
  const [customExercises, setCustomExercises] = useState<SavedCustomExercise[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState("");
  const [selectedMachineBrand, setSelectedMachineBrand] = useState("");
  const [exercisePickerVisible, setExercisePickerVisible] = useState(false);
  const [equipmentPickerVisible, setEquipmentPickerVisible] = useState(false);
  const [machineBrandPickerVisible, setMachineBrandPickerVisible] = useState(false);

  const muscleGroupCategories = useMemo(
    () =>
      MUSCLE_GROUPS.map((group) => ({
        name: group.name,
        items: getMuscleGroupExercises(group.name, customExercises),
      })),
    [customExercises]
  );

  useEffect(() => {
    if (!currentUser) {
      setCustomExercises([]);
      return;
    }

    void getCustomExercises(currentUser.id).then(setCustomExercises).catch((error) => {
      console.error("Error loading custom exercises:", error);
    });
  }, [currentUser]);

  const exerciseOptions = useMemo(() => {
    const exercises = new Set<string>();
    workouts.forEach((w) => {
      w.exercises.forEach((e) => {
        exercises.add(e.name);
      });
    });
    return Array.from(exercises).sort();
  }, [workouts]);

  const equipmentOptions = useMemo(() => {
    if (!selectedExercise) return [];
    const equipment = new Set<string>();
    workouts.forEach((w) => {
      w.exercises.forEach((e) => {
        if (e.name === selectedExercise) {
          equipment.add(e.equipmentType);
        }
      });
    });
    return ["All Equipment", ...Array.from(equipment).sort()];
  }, [workouts, selectedExercise]);

  const showMachineBrandFilter =
    selectedExercise &&
    selectedEquipment &&
    selectedEquipment !== "All Equipment" &&
    ["Machine", "Cable", "Free Weight"].includes(selectedEquipment);

  const machineBrandOptions = useMemo(() => {
    if (!selectedExercise || !selectedEquipment || selectedEquipment === "All Equipment") return [];
    const brands = new Set<string>();
    workouts.forEach((w) => {
      w.exercises.forEach((e) => {
        if (
          e.name === selectedExercise &&
          e.equipmentType === selectedEquipment &&
          e.machineBrand
        ) {
          brands.add(e.machineBrand);
        }
      });
    });
    return ["All Brands", ...Array.from(brands).sort()];
  }, [workouts, selectedExercise, selectedEquipment]);

  const progressData = useMemo(() => {
    if (!selectedExercise) return [];
    const data: DataPoint[] = [];
    const sortedWorkouts = [...workouts].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const equipmentMatch =
      selectedEquipment === "All Equipment" ||
      !selectedEquipment ||
      selectedEquipment === "";

    const brandMatch =
      !showMachineBrandFilter ||
      selectedMachineBrand === "All Brands" ||
      !selectedMachineBrand ||
      selectedMachineBrand === "";

    sortedWorkouts.forEach((w) => {
      w.exercises.forEach((e) => {
        const exMatch = e.name === selectedExercise;
        const eqMatch = equipmentMatch || e.equipmentType === selectedEquipment;
        const mbMatch =
          brandMatch ||
          (selectedMachineBrand && e.machineBrand === selectedMachineBrand);
        if (exMatch && eqMatch && mbMatch) {
          const maxSet = e.sets.reduce(
            (max, set) => {
              if (set.weight > max.weight) {
                return { weight: set.weight, reps: set.reps };
              }
              return max;
            },
            { weight: 0, reps: 0 }
          );

          if (maxSet.weight > 0 || maxSet.reps > 0) {
            data.push({
              date: w.date,
              weight: maxSet.weight,
              reps: maxSet.reps,
              workoutId: w.id,
            });
          }
        }
      });
    });

    return data;
  }, [
    workouts,
    selectedExercise,
    selectedEquipment,
    selectedMachineBrand,
    showMachineBrandFilter,
  ]);

  const personalBest = useMemo(() => {
    if (progressData.length === 0) return null;
    const maxWeight = Math.max(...progressData.map((d) => d.weight));
    const maxReps = Math.max(...progressData.map((d) => d.reps));
    return { maxWeight, maxReps };
  }, [progressData]);

  const handleSelectExercise = (exercise: string) => {
    setSelectedExercise(exercise);
    setSelectedEquipment("");
    setSelectedMachineBrand("");
    Haptics.selectionAsync();
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
          exerciseOptions.length === 0 && styles.emptyContent,
        ]}
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        {exerciseOptions.length === 0 ? (
        <EmptyState
  title="No Progress Data Yet"
  message="Complete some workouts to start tracking your progress over time"
/>
        ) : (
          <>
            <ThemedText
              type="small"
              style={[styles.label, { color: theme.textSecondary }]}
            >
              Select Exercise
            </ThemedText>

            <Pressable
              style={[styles.picker, { backgroundColor: theme.backgroundDefault }]}
              onPress={() => setExercisePickerVisible(true)}
            >
              <View style={styles.exercisePickerValue}>
                {selectedExercise ? (
                  <ExercisePickerThumbnail
                    imageUrl={getExerciseImageUrl(selectedExercise)}
                    size={PICKER_EXERCISE_THUMB_SIZE}
                  />
                ) : null}
                <ThemedText
                  style={[
                    styles.exercisePickerLabel,
                    !selectedExercise ? { color: theme.textSecondary } : undefined,
                  ]}
                  numberOfLines={1}
                >
                  {selectedExercise || "Choose an exercise"}
                </ThemedText>
              </View>
              <Feather name="chevron-down" size={20} color={theme.textSecondary} />
            </Pressable>

            {selectedExercise && equipmentOptions.length > 0 ? (
              <>
                <ThemedText
                  type="small"
                  style={[styles.label, { color: theme.textSecondary }]}
                >
                  Filter by Equipment
                </ThemedText>

                <Pressable
                  style={[
                    styles.picker,
                    { backgroundColor: theme.backgroundDefault },
                  ]}
                  onPress={() => setEquipmentPickerVisible(true)}
                >
                  <ThemedText
                    style={
                      !selectedEquipment
                        ? { color: theme.textSecondary }
                        : undefined
                    }
                  >
                    {selectedEquipment || "All Equipment"}
                  </ThemedText>
                  <Feather
                    name="chevron-down"
                    size={20}
                    color={theme.textSecondary}
                  />
                </Pressable>

                {showMachineBrandFilter && machineBrandOptions.length > 0 ? (
                  <>
                    <ThemedText
                      type="small"
                      style={[styles.label, { color: theme.textSecondary }]}
                    >
                      Filter by Machine Brand
                    </ThemedText>
                    <Pressable
                      style={[
                        styles.picker,
                        { backgroundColor: theme.backgroundDefault },
                      ]}
                      onPress={() => setMachineBrandPickerVisible(true)}
                    >
                      <ThemedText
                        style={
                          !selectedMachineBrand
                            ? { color: theme.textSecondary }
                            : undefined
                        }
                      >
                        {selectedMachineBrand || "All Brands"}
                      </ThemedText>
                      <Feather
                        name="chevron-down"
                        size={20}
                        color={theme.textSecondary}
                      />
                    </Pressable>
                  </>
                ) : null}
              </>
            ) : null}

            {selectedExercise ? (
              <>
                <Card style={styles.chartCard}>
                  <ThemedText type="h4" style={styles.chartTitle}>
                    {selectedExercise} - Weight vs Reps
                  </ThemedText>

                  <RepsWeightChart data={progressData} />
                </Card>

                {personalBest ? (
                  <View style={styles.pbSection}>
                    <ThemedText type="h4" style={styles.sectionTitle}>
                      Personal Bests
                    </ThemedText>

                    <View style={styles.pbCards}>
                      <Card style={styles.pbCard}>
                        <Feather
                          name="award"
                          size={24}
                          color={theme.success}
                        />
                        <ThemedText type="h3" style={styles.pbValue}>
                          {personalBest.maxWeight}
                        </ThemedText>
                        <ThemedText
                          type="small"
                          style={{ color: theme.textSecondary }}
                        >
                          Max Weight
                        </ThemedText>
                      </Card>

                      <Card style={styles.pbCard}>
                        <Feather
                          name="trending-up"
                          size={24}
                          color={theme.primary}
                        />
                        <ThemedText type="h3" style={styles.pbValue}>
                          {personalBest.maxReps}
                        </ThemedText>
                        <ThemedText
                          type="small"
                          style={{ color: theme.textSecondary }}
                        >
                          Max Reps
                        </ThemedText>
                      </Card>
                    </View>
                  </View>
                ) : null}

                {progressData.length > 0 ? (
                  <View style={styles.historySection}>
                    <ThemedText type="h4" style={styles.sectionTitle}>
                      History ({progressData.length} sessions)
                    </ThemedText>

                    {progressData
                      .slice()
                      .reverse()
                      .slice(0, 10)
                      .map((item) => {
                        const date = new Date(item.date);
                        return (
                          <Pressable
                            key={item.workoutId}
                            style={({ pressed }) => [
                              styles.historyItem,
                              {
                                borderBottomColor: theme.border,
                                opacity: pressed ? 0.7 : 1,
                              },
                            ]}
                            onPress={() => {
                              Haptics.selectionAsync();
                              navigation.navigate("WorkoutDetail", {
                                workoutId: item.workoutId,
                              });
                            }}
                          >
                            <ThemedText>
                              {date.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </ThemedText>

                            <View style={styles.historyValues}>
                              <ThemedText style={{ fontWeight: "600" }}>
                                {item.weight} kg
                              </ThemedText>
                              <ThemedText
                                style={{ color: theme.textSecondary }}
                              >
                                x{item.reps}
                              </ThemedText>
                              <Feather
                                name="chevron-right"
                                size={18}
                                color={theme.textSecondary}
                              />
                            </View>
                          </Pressable>
                        );
                      })}
                  </View>
                ) : null}
              </>
            ) : null}
          </>
        )}
      </ScrollView>

      <NestedPickerModal
        visible={exercisePickerVisible}
        onClose={() => setExercisePickerVisible(false)}
        onSelect={handleSelectExercise}
        categories={muscleGroupCategories}
        getItemImageUrl={getExerciseImageUrl}
        getCategoryImageUrl={getMuscleGroupImageUrl}
        title="Select Muscle Group"
        categoryTitle="Muscle Groups"
        itemTitle="Exercises"
        selectedValue={selectedExercise}
        searchable
      />

      <PickerModal
        visible={equipmentPickerVisible}
        onClose={() => setEquipmentPickerVisible(false)}
        onSelect={(value) => {
          setSelectedEquipment(value);
          setSelectedMachineBrand("");
        }}
        options={equipmentOptions}
        title="Filter by Equipment"
        selectedValue={selectedEquipment}
      />

      <PickerModal
        visible={machineBrandPickerVisible}
        onClose={() => setMachineBrandPickerVisible(false)}
        onSelect={setSelectedMachineBrand}
        options={machineBrandOptions}
        title="Filter by Machine Brand"
        selectedValue={selectedMachineBrand}
        getOptionImageUrl={(option) =>
          option === "All Brands" ? undefined : getMachineBrandLogoUrl(option)
        }
      />
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
  emptyContent: {
    flexGrow: 1,
  },
  label: {
    marginBottom: Spacing.sm,
  },
  picker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: Spacing.inputHeight,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
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
  chartCard: {
    padding: Spacing.lg,
    marginBottom: Spacing["2xl"],
  },
  chartTitle: {
    marginBottom: Spacing.lg,
  },
  chartContainer: {
    alignItems: "center",
  },
  chartPlaceholder: {
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  chartTooltip: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignSelf: "stretch",
  },
  pbSection: {
    marginBottom: Spacing["2xl"],
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  pbCards: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  pbCard: {
    flex: 1,
    padding: Spacing.lg,
    alignItems: "center",
  },
  pbValue: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  historySection: {
    marginBottom: Spacing["2xl"],
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  historyValues: {
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "center",
  },
});