import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { zipSync } from "fflate";

const distDir = resolve("dist");
const outDir = resolve("web-ext-artifacts");
const distManifestPath = resolve(distDir, "manifest.json");
const srcManifestPath = resolve("src", "manifest.json");

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

async function readManifestVersion() {
  const manifestPath = (await stat(distManifestPath).catch(() => null))?.isFile()
    ? distManifestPath
    : srcManifestPath;
  const manifestRaw = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(manifestRaw);
  if (!manifest.version || typeof manifest.version !== "string") {
    throw new Error(`Manifest at ${manifestPath} does not contain a valid string version`);
  }
  return manifest.version;
}

const distStats = await stat(distDir).catch(() => null);
if (!distStats?.isDirectory()) {
  throw new Error("dist directory not found. Run 'npm run build' first.");
}

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

const version = await readManifestVersion();
const zipName = `gif-scrubber-${version}.zip`;
const zipPath = resolve(outDir, zipName);

const files = await collectFiles(distDir);
const zipInput = {};

for (const fullPath of files) {
  const relPath = relative(distDir, fullPath).replaceAll("\\", "/");
  const content = new Uint8Array(await readFile(fullPath));
  zipInput[relPath] = content;
}

const zipped = zipSync(zipInput, { level: 9 });
await writeFile(zipPath, zipped);

console.log(`Packaged: web-ext-artifacts/${zipName}`);
