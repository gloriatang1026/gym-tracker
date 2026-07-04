import { Asset } from "expo-asset";

// Muscle group icons from Simply Fitness exercise guides
// Bundled locally so the app can render them offline and avoid runtime network requests.

export const MUSCLE_GROUP_IMAGE_ASSETS: Record<string, any> = {
  Chest: require("../assets/images/muscle-groups/chest.svg"),
  Back: require("../assets/images/muscle-groups/back.svg"),
  Shoulders: require("../assets/images/muscle-groups/shoulders.svg"),
  Biceps: require("../assets/images/muscle-groups/biceps.svg"),
  Triceps: require("../assets/images/muscle-groups/triceps.svg"),
  Abdominals: require("../assets/images/muscle-groups/abdominals.svg"),
  Legs: require("../assets/images/muscle-groups/legs.svg"),
  Calves: require("../assets/images/muscle-groups/calves.svg"),
};

export function getMuscleGroupImageUrl(groupName: string): any | undefined {
  return MUSCLE_GROUP_IMAGE_ASSETS[groupName];
}

export function isSvgImageUrl(urlOrModule: any): boolean {
  if (!urlOrModule) return false;
  if (typeof urlOrModule === "string") return /\.svg(\?|$)/i.test(urlOrModule);

  try {
    const asset = Asset.fromModule(urlOrModule);
    return typeof asset?.uri === "string" && /\.svg(\?|$)/i.test(asset.uri);
  } catch {
    return false;
  }
}
