import { GENERATED_GYM_REGIONS } from "./generatedGymLocations";

// Gym locations organized by region
export interface GymRegion {
  name: string;
  branches: string[];
}

export const GYM_REGIONS: GymRegion[] = GENERATED_GYM_REGIONS.length
  ? GENERATED_GYM_REGIONS
  : [
  {
    name: "Hong Kong Island",
    branches: [
      "香港仔分店 (Aberdeen)",
      "香港仔第二分店",
      "香港仔第三分店",
      "香港仔第四分店 (upcoming)",
      "堅尼地城分店 (Kennedy Town)",
      "堅尼地城第二分店",
      "炮台山分店 (Fortress Hill)",
      "北角分店 (North Point)",
      "北角第二分店",
      "銅鑼灣分店 (Causeway Bay)",
      "太古分店 (Taikoo)",
      "中環分店 (Central)",
      "中環第二分店",
      "中環第三分店 (upcoming)",
      "上環分店 (Sheung Wan)",
      "筲箕灣分店 (Shau Kei Wan)",
      "鴨脷洲分店 (Ap Lei Chau)",
      "鴨脷洲第二分店",
      "西灣河分店 (Sai Wan Ho)",
      "柴灣分店 (Chai Wan)",
      "柴灣第二分店",
      "小西灣分店 (Siu Sai Wan)",
      "灣仔分店 (Wan Chai)",
      "灣仔第二分店",
      "金鐘分店 (Admiralty)",
      "西營盤分店 (Sai Ying Pun)",
      "薄扶林分店 (Pok Fu Lam)",
      "跑馬地分店 (Happy Valley)",
      "天后分店 (Tin Hau)",
      "鰂魚涌分店 (Quarry Bay)",
      "杏花邨分店 (Heng Fa Chuen)",
    ],
  },
  {
    name: "Kowloon",
    branches: [
      "九龍灣分店 (Kowloon Bay)",
      "紅磡分店 (Hung Hom)",
      "紅磡第二分店 (upcoming)",
      "油麻地分店 (Yau Ma Tei)",
      "油麻地第二分店",
      "佐敦分店 (Jordan)",
      "尖沙咀分店 (Tsim Sha Tsui)",
      "尖沙咀第二分店 (K11)",
      "尖沙咀第三分店 (upcoming)",
      "觀塘分店 (Kwun Tong)",
      "觀塘第二分店",
      "九龍城分店 (Kowloon City)",
      "黃大仙分店 (Wong Tai Sin)",
      "旺角分店 (Mong Kok)",
      "旺角第二分店",
      "MEGA BOX 分店",
      "荔枝角分店 (Lai Chi Kok)",
      "深水埗分店 (Sham Shui Po)",
      "深水埗第二分店",
      "長沙灣分店 (Cheung Sha Wan)",
      "長沙灣第二分店",
      "土瓜灣分店 (To Kwa Wan)",
      "土瓜灣第二分店",
      "鑽石山分店 (Diamond Hill)",
      "樂富分店 (Lok Fu)",
      "彩虹分店 (Choi Hung)",
      "牛頭角分店 (Ngau Tau Kok)",
      "牛頭角第二分店",
      "藍田分店 (Lam Tin)",
      "藍田第二分店",
      "油塘分店 (Yau Tong)",
      "秀茂坪分店 (Sau Mau Ping)",
      "新蒲崗分店 (San Po Kong)",
      "太子分店 (Prince Edward)",
      "何文田分店 (Ho Man Tin)",
      "大角咀分店 (Tai Kok Tsui)",
      "大角咀第二分店",
      "美孚分店 (Mei Foo)",
      "美孚第二分店",
      "石硤尾分店 (Shek Kip Mei)",
    ],
  },
  {
    name: "New Territories",
    branches: [
      "沙田分店 (Sha Tin)",
      "大圍分店 (Tai Wai)",
      "大圍第二分店",
      "火炭分店 (Fo Tan)",
      "元朗分店 (Yuen Long)",
      "元朗第二分店",
      "元朗第三分店",
      "元朗第四分店",
      "元朗第五分店",
      "屯門分店 (Tuen Mun)",
      "屯門第二分店",
      "屯門第三分店",
      "屯門第四分店",
      "屯門第五分店 (大興花園)",
      "天水圍分店 (Tin Shui Wai)",
      "天水圍第二分店",
      "天水圍第三分店",
      "天水圍第四分店",
      "上水分店 (Sheung Shui)",
      "上水第二分店",
      "將軍澳分店 (Tseung Kwan O)",
      "將軍澳第二分店",
      "將軍澳第三分店",
      "將軍澳第四分店",
      "青衣分店 (Tsing Yi)",
      "青衣第二分店",
      "葵芳分店 (Kwai Fong)",
      "葵芳第二分店",
      "葵興分店 (Kwai Hing)",
      "荃灣分店 (Tsuen Wan)",
      "荃灣第二分店",
      "荃灣第三分店",
      "馬鞍山分店 (Ma On Shan)",
      "馬鞍山第二分店",
      "大埔分店 (Tai Po)",
      "大埔第二分店",
      "粉嶺分店 (Fanling)",
      "粉嶺第二分店",
      "大窩口分店 (Tai Wo Hau)",
      "深井分店 (Sham Tseng)",
      "洪水橋分店 (Hung Shui Kiu)",
      "落馬洲分店 (Lok Ma Chau)",
      "錦田分店 (Kam Tin)",
      "坑口分店 (Hang Hau)",
      "寶琳分店 (Po Lam)",
      "康城分店 (LOHAS Park)",
      "石門分店 (Shek Mun)",
      "第一城分店 (City One)",
      "禾輋分店 (Wo Che)",
      "大學站分店 (University)",
      "科學園分店 (Science Park)",
      "粉錦分店 (Fanling Highway)",
      "太和分店 (Tai Wo)",
      "東涌分店 (Tung Chung)",
      "東涌第二分店",
      "愉景灣分店 (Discovery Bay)",
    ],
  },
  {
    name: "Outlying Islands",
    branches: [
      "長洲分店 (Cheung Chau, upcoming)",
      "東涌分店 (Tung Chung)",
    ],
  },
  {
    name: "Other",
    branches: [
      "Other / Not at 24/7",
    ],
  },
];

// Exercises organized by muscle group
export interface MuscleGroup {
  name: string;
  exercises: string[];
}

export const MUSCLE_GROUPS: MuscleGroup[] = [
  {
    name: "Chest",
    exercises: [
      "Bench Press",
      "Pec Deck",
      "Crossover",
      "Incline Bench Press",
      "Chest Fly",
      "Incline Chest Fly",
      "Chest Press Machine",
      "Declined Bench Press",
      "Push Ups",
      "Chest dips",
      "Other"
    ],
  },
  {
    name: "Back",
    exercises: [
      "Wide-Grip Pulldown",
      "Seated Cable Row",
      "Single-arm Seated Cable Row",
      "Pull Up",
      "T-Bar Rows",
      "Rope Pulldown",
      "Bent over Rows",
      "Bent Over Rows Supinated Grip",
      "Bent-Over Row (Single Arm)",
      "Reverse-Grip Pulldown",
      "Pull Up with a Supinated Grip",
      "Straight Arm Lat Pulldown",
      "Close-Grip Pulldown",
      "Pullover",
      "Other"
    ],
  },
  {
    name: "Shoulders",
    exercises: [
      "Seated Shoulder Press",
      "Lateral Raise",
      "One-Arm Lateral Raise",
      "High Cable Rear Delt Fly",
      "Face Pull",
      "Front Raise",
      "Reverse Pec Deck",
      "Upright Row",
      "Standing Shoulder Press",
      "Bent-Over Lateral Raise",
      "Push Press",
      "Single-Arm Front Raise",
      "Alternate Dumbbell Front Raise",
      "Arnold Press",
      "Other"
    ],
  },
  {
    name: "Biceps",
    exercises: [
      "Curl",
      "Alternating Dumbbell Curl",
      "Preacher Curl",
      "Hammer Curl",
      "Incline Curl",
      "Concentration Curl",
      "Single-Arm Low Pulley Cable Curl",
      "Straight Bar Low Pulley Cable Curl",
      "Other"
    ],
  },
  {
    name: "Triceps",
    exercises: [
      "Lying Triceps Extension",
      "Triceps Pressdown",
      "Rope Pushdown",
      "Overhead Triceps Extension",
      "Kickback",
      "Reverse Grip Triceps Extension",
      "Single-Arm Triceps Extension",
      "Seated French Press",
      "Parallel Dip Bar",
      "Other"
    ],
  },
  {
    name: "Abdominals",
    exercises: [
      "Rope Ab Pulldown",
      "Oblique Crunch",
      "Bent Knee Reverse Crunches",
      "Crunches",
      "Leg Raises",
      "Russian Twist",
      "Bicycle Crunch",
      "Plank",
      "Side Plank",
      "Mountain Climbers",
      "Hanging Leg Raise",
      "Ab Wheel Rollout",
      "Other"
    ],
  },
  {
    name: "Legs",
    exercises: [
      "Squat",
      "Romanian Deadlift",
      "Leg Press",
      "Leg Extension",
      "Lunge",
      "Lying Leg Curl",
      "Hack Squat",
      "Seated Leg Curl",
      "Single Leg Extension",
      "Front Squat",
      "Deadlift",
      "Bulgarian Split Squat",
      "Single Leg Deadlift",
      "Hip Thrust",
      "Cable Pull Through",
      "Step Ups",
      "Box Jumps",
      "Other"
    ],
  },
  {
    name: "Calves",
    exercises: [
      "Seated Calf Raise",
      "Standing Calf Raise",
      "Leg Press Calf Raise",
      "Donkey Calf Raise",
      "Single Leg Calf Raise",
      "Other"
    ],
  },
];

// Flat list of all exercises for backward compatibility
export function getAllExercises(): string[] {
  const exercises: string[] = [];
  for (const group of MUSCLE_GROUPS) {
    exercises.push(...group.exercises);
  }
  return exercises;
}

export function getMuscleGroupExercises(
  muscleGroupName: string,
  customExercises: Array<{ muscleGroup: string; name: string }> = []
): string[] {
  const group = MUSCLE_GROUPS.find((group) => group.name === muscleGroupName);
  const baseExercises = group ? [...group.exercises] : [];

  if (!customExercises.length) {
    return baseExercises;
  }

  const customItems = customExercises
    .filter((exercise) => exercise.muscleGroup === muscleGroupName && exercise.name.trim())
    .map((exercise) => exercise.name.trim());
  const baseItemsWithoutOther = baseExercises.filter(
    (exercise) => exercise.trim().toLowerCase() !== "other"
  );
  const otherItem = baseExercises.find(
    (exercise) => exercise.trim().toLowerCase() === "other"
  );

  const seen = new Set<string>();
  const merged: string[] = [];

  for (const item of [...customItems, ...baseItemsWithoutOther]) {
    const normalized = item.trim();
    if (!normalized || seen.has(normalized.toLowerCase())) continue;
    seen.add(normalized.toLowerCase());
    merged.push(normalized);
  }

  if (otherItem) {
    const normalizedOther = otherItem.trim();
    if (normalizedOther && !seen.has(normalizedOther.toLowerCase())) {
      merged.push(normalizedOther);
    }
  }

  return merged;
}

// Flat list of all gym locations for backward compatibility
export function getAllGymLocations(): string[] {
  const locations: string[] = [];
  for (const region of GYM_REGIONS) {
    locations.push(...region.branches);
  }
  return locations;
}
