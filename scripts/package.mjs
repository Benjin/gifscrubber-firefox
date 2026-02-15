import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { zipSync } from "fflate";

const distDir = resolve("dist");
const outDir = resolve("web-ext-artifacts");
const zipPath = resolve(outDir, "gif-scrubber-0.1.0.zip");

async function collectFiles(dir) {
  const out = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await collectFiles(fullPath)));
    } else if (entry.isFile()) {
      out.push(fullPath);
    }
  }
  return out;
}

const distStats = await stat(distDir).catch(() => null);
if (!distStats?.isDirectory()) {
  throw new Error("dist directory not found. Run 'npm run build' first.");
}

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

const files = await collectFiles(distDir);
const zipInput = {};

for (const fullPath of files) {
  const relPath = relative(distDir, fullPath).replaceAll("\\", "/");
  const content = new Uint8Array(await readFile(fullPath));
  zipInput[relPath] = content;
}

const zipped = zipSync(zipInput, { level: 9 });
await writeFile(zipPath, zipped);

console.log("Packaged: web-ext-artifacts/gif-scrubber-0.1.0.zip");
