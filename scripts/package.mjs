import { mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const outDir = resolve("web-ext-artifacts");

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

await execFileAsync("powershell", [
  "-NoProfile",
  "-Command",
  "Compress-Archive -Path dist\\* -DestinationPath web-ext-artifacts\\gif-scrubber-0.1.0.zip -Force"
]);

console.log("Packaged: web-ext-artifacts/gif-scrubber-0.1.0.zip");
