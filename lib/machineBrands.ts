export const MACHINE_BRAND_LOGOS: Record<string, string> = {
  Panatta:
    "https://media.licdn.com/dms/image/v2/D4D0BAQGmy1UHALYuKg/company-logo_200_200/B4DZdpeCXuG8AU-/0/1749821171536/panatta_logo?e=2147483647&v=beta&t=621vqsAKJHwTVJcQlzAZ8WSEqa5XUNIQLBwwgX25QWU",
  Newtech:
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQmj_KZL1bJ9cvaI-KGx36v1avqBBAeHodlaw&s",
  Gym80:
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQglkE70H9sxDIhSXQLc_GNgv5cjV1rsgjFqg&s",
  "Hammer Strength":
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRtIe5eYmFB3txCxT1BVG33_YMyW67GvmZSqg&s",
  "Life Fitness":
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGUMlaPl4zS_fKsFO3bRbA-F6WoE1Hmtsb-g&s",
};

export function getMachineBrandLogoUrl(brand: string): string | undefined {
  return MACHINE_BRAND_LOGOS[brand];
}

export function formatRecordSourceLabel(
  equipment?: string,
  brand?: string
): string {
  const parts = [equipment, brand].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "other";
}
