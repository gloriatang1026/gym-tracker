import AsyncStorage from "@react-native-async-storage/async-storage";

const PROFILES_KEY = "workout_profiles";
const LAST_USER_KEY = "last_selected_user";
const WORKOUTS_PREFIX = "workouts_";
const PROGRAM_LIBRARIES_PREFIX = "program_libraries_";

export async function forceSave(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

export async function exportAllData(): Promise<boolean> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    console.log("Exporting keys:", keys);
    if (keys.length === 0) return false;

    const entries = await AsyncStorage.multiGet(keys);
    const data: Record<string, string> = {};

    for (const [key, value] of entries) {
      data[key] = value ?? "";
      console.log(`Exported ${key}:`, value ? "OK" : "Empty");
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: "1.1",
      data,
    };

    if (typeof window === "undefined" || typeof document === "undefined") {
      return false;
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `gym-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error("Export failed:", error);
    return false;
  }
}

export async function importData(file: File): Promise<boolean> {
  try {
    const text = await file.text();
    const imported = JSON.parse(text) as { data?: Record<string, string> };

    if (!imported || typeof imported !== "object" || !imported.data || typeof imported.data !== "object") {
      throw new Error("Invalid backup file");
    }

    const entries = Object.entries(imported.data).filter(([, value]) => typeof value === "string") as [string, string][];
    const keysToRemove = Object.keys(imported.data);

    await AsyncStorage.multiRemove(keysToRemove);
    if (entries.length > 0) {
      await AsyncStorage.multiSet(entries);
    }

    return true;
  } catch (error) {
    console.error("Import failed:", error);
    return false;
  }
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  customPhotoUri?: string;
  sex?: "M" | "F";
}

export interface ProgramLibraryExercise {
  name: string;
  equipmentType?: string;
  machineBrand?: string;
}

export interface ProgramLibrary {
  id: string;
  userId: string;
  name?: string;
  workoutType: string;
  exercises: ProgramLibraryExercise[];
}

export interface DropSet {
  reps: number;
  weight: number;
}

export interface ExerciseSet {
  reps: number;
  weight: number;
  weightUnit: "kg" | "lbs";
  drops?: DropSet[];
}

export interface MachineSetup {
  startingWeight?: number;
  seatHeight?: number;
  backrest?: number;
  handles?: number;
  pivotPoint?: number;
}

export interface Exercise {
  id: string;
  name: string;
  equipmentType: string;
  machineBrand?: string;
  machineSetup?: MachineSetup;
  sets: ExerciseSet[];
  notes?: string;
}

export interface Workout {
  id: string;
  userId: string;
  type: string;
  customType?: string;
  gymLocation: string;
  exercises: Exercise[];
  startTime: string;
  endTime?: string;
  duration?: number;
  date: string;
}

const DEFAULT_PROFILES: UserProfile[] = [
  { id: "user1", name: "User 1", avatar: "fitness" },
];

export async function getProfiles(): Promise<UserProfile[]> {
  try {
    const data = await AsyncStorage.getItem(PROFILES_KEY);
    if (data) {
      return JSON.parse(data);
    }
    await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(DEFAULT_PROFILES));
    return DEFAULT_PROFILES;
  } catch (error) {
    console.error("Error getting profiles:", error);
    return DEFAULT_PROFILES;
  }
}

export async function saveProfiles(profiles: UserProfile[]): Promise<void> {
  try {
    await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch (error) {
    console.error("Error saving profiles:", error);
  }
}

export async function getLastSelectedUser(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LAST_USER_KEY);
  } catch (error) {
    console.error("Error getting last user:", error);
    return null;
  }
}

export async function setLastSelectedUser(userId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_USER_KEY, userId);
  } catch (error) {
    console.error("Error setting last user:", error);
  }
}

export async function getWorkouts(userId: string): Promise<Workout[]> {
  try {
    const data = await AsyncStorage.getItem(WORKOUTS_PREFIX + userId);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error("Error getting workouts:", error);
    return [];
  }
}

export async function saveWorkout(workout: Workout): Promise<void> {
  try {
    const workouts = await getWorkouts(workout.userId);
    workouts.unshift(workout);
    await AsyncStorage.setItem(
      WORKOUTS_PREFIX + workout.userId,
      JSON.stringify(workouts)
    );
  } catch (error) {
    console.error("Error saving workout:", error);
  }
}

export interface SavedCustomExercise {
  muscleGroup: string;
  name: string;
}

const CUSTOM_EXERCISES_PREFIX = "custom_exercises_";

export async function getCustomExercises(
  userId: string
): Promise<SavedCustomExercise[]> {
  try {
    const data = await AsyncStorage.getItem(CUSTOM_EXERCISES_PREFIX + userId);
    if (!data) return [];
    return JSON.parse(data) as SavedCustomExercise[];
  } catch (error) {
    console.error("Error getting custom exercises:", error);
    return [];
  }
}

export async function saveCustomExercises(
  userId: string,
  exercises: SavedCustomExercise[]
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      CUSTOM_EXERCISES_PREFIX + userId,
      JSON.stringify(exercises)
    );
  } catch (error) {
    console.error("Error saving custom exercises:", error);
  }
}

export async function addCustomExercise(
  userId: string,
  muscleGroup: string,
  name: string
): Promise<boolean> {
  try {
    const normalizedName = name.trim();
    if (!normalizedName || normalizedName.toLowerCase() === "other") {
      return false;
    }
    const exercises = await getCustomExercises(userId);
    const exists = exercises.some(
      (exercise) =>
        exercise.muscleGroup === muscleGroup &&
        exercise.name.toLowerCase() === normalizedName.toLowerCase()
    );
    if (exists) return false;
    exercises.push({ muscleGroup, name: normalizedName });
    await saveCustomExercises(userId, exercises);
    return true;
  } catch (error) {
    console.error("Error adding custom exercise:", error);
    return false;
  }
}

export async function deleteWorkout(
  userId: string,
  workoutId: string
): Promise<void> {
  try {
    const workouts = await getWorkouts(userId);
    const filtered = workouts.filter((w) => w.id !== workoutId);
    await AsyncStorage.setItem(
      WORKOUTS_PREFIX + userId,
      JSON.stringify(filtered)
    );
  } catch (error) {
    console.error("Error deleting workout:", error);
  }
}

/** Returns the most recent workout with same workoutType and gymLocation (and customType if Custom). */
export async function getLastWorkoutForTypeAndLocation(
  userId: string,
  workoutType: string,
  gymLocation: string,
  customType?: string
): Promise<Workout | null> {
  try {
    const workouts = await getWorkouts(userId);
    const match = workouts.find((w) => {
      if (w.type !== workoutType || w.gymLocation !== gymLocation) return false;
      if (workoutType === "Custom") {
        return (w.customType || "") === (customType || "");
      }
      return true;
    });
    return match || null;
  } catch (error) {
    console.error("Error getting last workout for type and location:", error);
    return null;
  }
}

function isSameEquipmentBrand(
  eq1: string,
  brand1: string | undefined,
  eq2: string,
  brand2: string | undefined
): boolean {
  if (eq1 !== eq2) return false;
  const b1 = brand1 || "";
  const b2 = brand2 || "";
  return b1 === b2;
}

function getBestSetByWeight(sets: { reps: number; weight: number }[]): { reps: number; weight: number } | null {
  let best: { reps: number; weight: number } | null = null;
  for (const set of sets) {
    if (set.weight > 0) {
      if (!best || set.weight > best.weight || (set.weight === best.weight && set.reps > best.reps)) {
        best = { reps: set.reps, weight: set.weight };
      }
    }
  }
  return best;
}

export async function getLastExerciseData(
  userId: string,
  exerciseName: string,
  equipmentType: string,
  machineBrand?: string
): Promise<{ reps: number; weight: number } | null> {
  try {
    const workouts = await getWorkouts(userId);
    for (const workout of workouts) {
      for (const exercise of workout.exercises) {
        if (
          exercise.name === exerciseName &&
          isSameEquipmentBrand(
            equipmentType,
            machineBrand,
            exercise.equipmentType,
            exercise.machineBrand
          )
        ) {
          const bestSet = getBestSetByWeight(exercise.sets);
          if (bestSet) return bestSet;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Error getting last exercise data:", error);
    return null;
  }
}

export async function getBestExerciseData(
  userId: string,
  exerciseName: string,
  equipmentType: string,
  machineBrand?: string
): Promise<{ reps: number; weight: number } | null> {
  try {
    const workouts = await getWorkouts(userId);
    let best: { reps: number; weight: number } | null = null;
    for (const workout of workouts) {
      for (const exercise of workout.exercises) {
        if (
          exercise.name === exerciseName &&
          isSameEquipmentBrand(
            equipmentType,
            machineBrand,
            exercise.equipmentType,
            exercise.machineBrand
          )
        ) {
          for (const set of exercise.sets) {
            if (set.weight > 0 && (!best || set.weight > best.weight)) {
              best = { reps: set.reps, weight: set.weight };
            }
          }
        }
      }
    }
    return best;
  } catch (error) {
    console.error("Error getting best exercise data:", error);
    return null;
  }
}

export type ExerciseRecordWithNote = {
  reps: number;
  weight: number;
  equipmentType: string;
  machineBrand?: string;
};

export async function getLastExerciseDataOther(
  userId: string,
  exerciseName: string,
  equipmentType: string,
  machineBrand?: string
): Promise<ExerciseRecordWithNote | null> {
  try {
    const workouts = await getWorkouts(userId);
    for (const workout of workouts) {
      for (const exercise of workout.exercises) {
        if (
          exercise.name === exerciseName &&
          !isSameEquipmentBrand(
            equipmentType,
            machineBrand,
            exercise.equipmentType,
            exercise.machineBrand
          )
        ) {
          const bestSet = getBestSetByWeight(exercise.sets);
          if (bestSet) {
            return {
              reps: bestSet.reps,
              weight: bestSet.weight,
              equipmentType: exercise.equipmentType,
              machineBrand: exercise.machineBrand,
            };
          }
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Error getting last exercise data (other):", error);
    return null;
  }
}

function hasMachineSetupValues(setup: MachineSetup): boolean {
  return (
    setup.startingWeight != null ||
    setup.seatHeight != null ||
    setup.backrest != null ||
    setup.handles != null ||
    setup.pivotPoint != null
  );
}

export async function getLastMachineSetup(
  userId: string,
  exerciseName: string,
  machineBrand?: string
): Promise<MachineSetup | null> {
  try {
    const workouts = await getWorkouts(userId);
    for (const workout of workouts) {
      for (const exercise of workout.exercises) {
        if (
          exercise.name === exerciseName &&
          exercise.equipmentType === "Machine" &&
          isSameEquipmentBrand(
            "Machine",
            machineBrand,
            exercise.equipmentType,
            exercise.machineBrand
          ) &&
          exercise.machineSetup &&
          hasMachineSetupValues(exercise.machineSetup)
        ) {
          return exercise.machineSetup;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Error getting last machine setup:", error);
    return null;
  }
}

export async function getBestExerciseDataOther(
  userId: string,
  exerciseName: string,
  equipmentType: string,
  machineBrand?: string
): Promise<ExerciseRecordWithNote | null> {
  try {
    const workouts = await getWorkouts(userId);
    let best: ExerciseRecordWithNote | null = null;
    for (const workout of workouts) {
      for (const exercise of workout.exercises) {
        if (
          exercise.name === exerciseName &&
          !isSameEquipmentBrand(
            equipmentType,
            machineBrand,
            exercise.equipmentType,
            exercise.machineBrand
          )
        ) {
          for (const set of exercise.sets) {
            if (
              set.weight > 0 &&
              (!best || set.weight > best.weight)
            ) {
              best = {
                reps: set.reps,
                weight: set.weight,
                equipmentType: exercise.equipmentType,
                machineBrand: exercise.machineBrand,
              };
            }
          }
        }
      }
    }
    return best;
  } catch (error) {
    console.error("Error getting best exercise data (other):", error);
    return null;
  }
}

export async function getProgramLibraries(userId: string): Promise<ProgramLibrary[]> {
  try {
    const data = await AsyncStorage.getItem(PROGRAM_LIBRARIES_PREFIX + userId);
    if (data) return JSON.parse(data);
    return [];
  } catch (error) {
    console.error("Error getting program libraries:", error);
    return [];
  }
}

export async function saveProgramLibrary(lib: ProgramLibrary): Promise<void> {
  try {
    const libs = await getProgramLibraries(lib.userId);
    const idx = libs.findIndex((l) => l.id === lib.id);
    const updated = idx >= 0 ? libs.map((l) => (l.id === lib.id ? lib : l)) : [...libs, lib];
    await AsyncStorage.setItem(PROGRAM_LIBRARIES_PREFIX + lib.userId, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving program library:", error);
  }
}

export async function deleteProgramLibrary(userId: string, libId: string): Promise<void> {
  try {
    const libs = (await getProgramLibraries(userId)).filter((l) => l.id !== libId);
    await AsyncStorage.setItem(PROGRAM_LIBRARIES_PREFIX + userId, JSON.stringify(libs));
  } catch (error) {
    console.error("Error deleting program library:", error);
  }
}

export async function getProgramLibrariesForWorkoutType(
  userId: string,
  workoutType: string
): Promise<ProgramLibrary[]> {
  const libs = await getProgramLibraries(userId);
  return libs.filter((l) => l.workoutType === workoutType && l.exercises.length > 0);
}

export function getWorkoutsThisWeek(workouts: Workout[]): number {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  return workouts.filter((w) => new Date(w.date) >= startOfWeek).length;
}

export function getWorkoutsThisMonth(workouts: Workout[]): number {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return workouts.filter((w) => new Date(w.date) >= startOfMonth).length;
}

/** Top gym locations by workout count (ties broken by most recent visit). */
export function getMostVisitedGymLocations(
  workouts: Workout[],
  limit = 2
): string[] {
  const counts = new Map<string, number>();
  const lastVisit = new Map<string, string>();

  for (const workout of workouts) {
    const location = workout.gymLocation?.trim();
    if (!location) continue;
    counts.set(location, (counts.get(location) ?? 0) + 1);
    const previous = lastVisit.get(location);
    if (!previous || workout.date > previous) {
      lastVisit.set(location, workout.date);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => {
      const byCount = b[1] - a[1];
      if (byCount !== 0) return byCount;
      return (lastVisit.get(b[0]) ?? "").localeCompare(lastVisit.get(a[0]) ?? "");
    })
    .slice(0, limit)
    .map(([location]) => location);
}

export const GYM_LOCATIONS = [
  "香港仔分店 (Aberdeen)",
  "香港仔第二分店",
  "香港仔第三分店",
  "香港仔第四分店 (即將開幕)",
  "堅尼地城分店 (Kennedy Town)",
  "炮台山分店 (Fortress Hill)",
  "北角分店 (North Point)",
  "銅鑼灣分店 (Causeway Bay)",
  "太古分店 (Taikoo)",
  "中環分店 (Central)",
  "中環第三分店 (即將開幕)",
  "上環分店 (Sheung Wan)",
  "筲箕灣分店 (Shau Kei Wan)",
  "鴨脷洲分店 (Ap Lei Chau)",
  "九龍灣分店 (Kowloon Bay)",
  "紅磡分店 (Hung Hom)",
  "油麻地分店 (Yau Ma Tei)",
  "佐敦分店 (Jordan)",
  "尖沙咀分店 (Tsim Sha Tsui)",
  "觀塘分店 (Kwun Tong)",
  "觀塘第二分店",
  "九龍城分店 (Kowloon City)",
  "黃大仙分店 (Wong Tai Sin)",
  "旺角分店 (Mong Kok)",
  "MEGA BOX 分店",
  "荔枝角分店",
  "沙田分店 (Sha Tin)",
  "大圍分店 (Tai Wai)",
  "大圍第二分店",
  "火炭分店 (Fo Tan)",
  "元朗分店 (Yuen Long)",
  "元朗第二分店",
  "元朗第三分店",
  "屯門分店 (Tuen Mun)",
  "屯門第五分店 (大興花園)",
  "天水圍分店 (Tin Shui Wai)",
  "上水分店 (Sheung Shui)",
  "將軍澳分店 (Tseung Kwan O)",
  "青衣分店 (Tsing Yi)",
  "葵芳第二分店 (Kwai Fong)",
  "Other / Not at 24/7",
];

export const WORKOUT_TYPES = [
  "Push Day",
  "Pull Day",
  "Leg Day",
  "Full Body",
  "Upper Body",
  "Lower Body",
  "Core Day",
  "Cardio Day",
  "Rest/Active Recovery",
  "Custom",
];

export const EXERCISE_NAMES = [
  "Squat",
  "Bench Press",
  "Deadlift",
  "Pull-up",
  "Push-up",
  "Plank",
  "Treadmill Run",
  "Leg Press",
  "Shoulder Press",
  "Rows",
  "Bicep Curls",
  "Tricep Extensions",
  "Custom Exercise",
];

export const EQUIPMENT_TYPES = [
  "Machine",
  "Barbell",
  "Free Weight",
  "Dumbbell",
  "Cable",
  "Smith machine",
  "Other",
];

export const MACHINE_BRANDS = [
  "Panatta",
  "Newtech",
  "Gym80",
  "Hammer Strength",
  "Life Fitness",
  "Other / Unknown",
];

export const REST_TIMER_OPTIONS = [30, 60, 90, 120];
