import AsyncStorage from "@react-native-async-storage/async-storage";
import { MachineSetupForm } from "./machineSetup";

const DRAFT_PREFIX = "active_workout_draft_";

export interface DraftDropSet {
  weight: string;
  reps: string;
}

export interface DraftSetData {
  reps: string;
  weight: string;
  drops: DraftDropSet[];
}

export interface DraftExerciseFormData {
  id: string;
  name: string;
  muscleGroup?: string;
  customName?: string;
  equipmentType: string;
  machineBrand?: string;
  machineSetup?: MachineSetupForm;
  sets: DraftSetData[];
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

export interface ActiveWorkoutDraft {
  userId: string;
  workoutType: string;
  customType: string;
  gymLocation: string;
  exercises: DraftExerciseFormData[];
  startTime: string;
  loadedFromPreset: boolean;
  savedAt: string;
}

export function hasDraftContent(draft: ActiveWorkoutDraft): boolean {
  if (draft.workoutType || draft.gymLocation) return true;
  return draft.exercises.some(
    (ex) =>
      ex.name ||
      ex.equipmentType ||
      ex.customName ||
      ex.sets.some(
        (s) =>
          (s.reps && s.reps.trim() !== "") ||
          (s.weight && s.weight.trim() !== "") ||
          s.drops.some(
            (d) =>
              (d.reps && d.reps.trim() !== "") ||
              (d.weight && d.weight.trim() !== "")
          )
      )
  );
}

export async function getActiveWorkoutDraft(
  userId: string
): Promise<ActiveWorkoutDraft | null> {
  try {
    const data = await AsyncStorage.getItem(DRAFT_PREFIX + userId);
    if (!data) return null;
    return JSON.parse(data) as ActiveWorkoutDraft;
  } catch (error) {
    console.error("Error loading workout draft:", error);
    return null;
  }
}

export async function saveActiveWorkoutDraft(
  draft: ActiveWorkoutDraft
): Promise<void> {
  try {
    if (!hasDraftContent(draft)) {
      await clearActiveWorkoutDraft(draft.userId);
      return;
    }
    const withTimestamp: ActiveWorkoutDraft = {
      ...draft,
      savedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(
      DRAFT_PREFIX + draft.userId,
      JSON.stringify(withTimestamp)
    );
  } catch (error) {
    console.error("Error saving workout draft:", error);
  }
}

export async function clearActiveWorkoutDraft(userId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(DRAFT_PREFIX + userId);
  } catch (error) {
    console.error("Error clearing workout draft:", error);
  }
}
