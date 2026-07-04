import https from "https";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function fetch(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

const GROUPS = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Abdominals",
  "Legs",
  "Calves",
];

async function main() {
  const html = await fetch(
    "https://www.simplyfitness.com/pages/workout-exercise-guides"
  );

  const urls = [...new Set(html.match(/https:\/\/cdn\.shopify\.com[^"'\\s<>]+/g) || [])];
  console.error("All CDN URLs on guides page:", urls.length);
  urls.forEach((u) => console.error(u));

  const byGroup = {};
  for (const group of GROUPS) {
    const slug = group.toLowerCase();
    const patterns = [
      new RegExp(`https://cdn\\.shopify\\.com[^"'\\s<>]*${slug}[^"'\\s<>]*\\.svg[^"'\\s<>]*`, "i"),
      new RegExp(`https://cdn\\.shopify\\.com[^"'\\s<>]*${slug}[^"'\\s<>]*\\.(png|webp|jpg)[^"'\\s<>]*`, "i"),
      new RegExp(`https://cdn\\.shopify\\.com[^"'\\s<>]*${slug}[^"'\\s<>]*`, "i"),
    ];
    for (const re of patterns) {
      const m = html.match(re);
      if (m) {
        byGroup[group] = m[0];
        break;
      }
    }
  }

  // Also try section blocks: <h2>Chest</h2> ... img src
  for (const group of GROUPS) {
    if (byGroup[group]) continue;
    const sectionRe = new RegExp(
      `${group}[\\s\\S]{0,2500}?<img[^>]+src=["'](https://cdn\\.shopify\\.com[^"']+)`,
      "i"
    );
    const m = html.match(sectionRe);
    if (m) byGroup[group] = m[1];
  }

  console.log(JSON.stringify(byGroup, null, 2));
  writeFileSync(
    join(__dirname, "muscle-group-images.json"),
    JSON.stringify(byGroup, null, 2),
    "utf8"
  );

  const tsPath = join(__dirname, "..", "lib", "muscleGroupImages.ts");
  const entries = Object.entries(byGroup)
    .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
    .join("\n");
  const ts = `// Muscle group icons from Simply Fitness exercise guides
// https://www.simplyfitness.com/pages/workout-exercise-guides
// Regenerate: node scripts/scrape-muscle-group-images.mjs

export const MUSCLE_GROUP_IMAGE_URLS: Record<string, string> = {
${entries}
};

export function getMuscleGroupImageUrl(groupName: string): string | undefined {
  return MUSCLE_GROUP_IMAGE_URLS[groupName];
}

export function isSvgImageUrl(url: string): boolean {
  return /\\.svg(\\?|$)/i.test(url);
}
`;
  writeFileSync(tsPath, ts, "utf8");
  process.stderr.write(`Wrote ${tsPath}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
