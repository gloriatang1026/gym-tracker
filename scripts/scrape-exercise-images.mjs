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

const SKIP_SLUGS = new Set([
  "workout-exercise-guides",
  "contact",
  "privacy-policy",
  "refund-policy",
]);

async function main() {
  const html = await fetch(
    "https://www.simplyfitness.com/pages/workout-exercise-guides"
  );
  const slugs = [
    ...new Set(
      [...html.matchAll(/href="\/pages\/([a-z0-9-]+)"/g)].map((m) => m[1])
    ),
  ].filter((s) => !SKIP_SLUGS.has(s));

  const bySlug = {};
  let i = 0;
  for (const slug of slugs) {
    i++;
    process.stderr.write(`\r${i}/${slugs.length} ${slug}          `);
    const page = await fetch(`https://www.simplyfitness.com/pages/${slug}`);
    const match = page.match(
      /https:\/\/cdn\.shopify\.com\/s\/files\/1\/0269\/5551\/3900\/files\/[^"\s]+_600x600[^"\s]*/i
    );
    if (match) {
      const titleMatch = page.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      bySlug[slug] = {
        imageUrl: match[0],
        title: titleMatch ? titleMatch[1].trim() : slug,
      };
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  process.stderr.write("\n");
  const outPath = join(__dirname, "simply-fitness-slugs.json");
  writeFileSync(outPath, JSON.stringify(bySlug, null, 2), "utf8");
  process.stderr.write(`Wrote ${Object.keys(bySlug).length} entries to ${outPath}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
