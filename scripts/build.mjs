import { build, context } from "esbuild";
import { cp, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const watchMode = process.argv.includes("--watch");
const distDir = resolve("dist");

await mkdir(distDir, { recursive: true });

const common = {
  entryPoints: [resolve("src/content.ts"), resolve("src/page.ts")],
  bundle: true,
  outdir: resolve("dist"),
  format: "iife",
  platform: "browser",
  target: ["firefox128"],
  sourcemap: true
};

if (watchMode) {
  const ctx = await context(common);
  await ctx.watch();
  await cp(resolve("src/manifest.json"), resolve("dist/manifest.json"));
  await cp(resolve("src/icons"), resolve("dist/icons"), { recursive: true });
  console.log("Watching for changes...");
} else {
  await build(common);
  await cp(resolve("src/manifest.json"), resolve("dist/manifest.json"));
  await cp(resolve("src/icons"), resolve("dist/icons"), { recursive: true });
}
