import { decompressFrames, parseGIF } from "gifuct-js";
import type { GifFrame } from "gifuct-js";
import { formatUnknownError } from "./errors";
import type { DecodedGifData, SourceLoopCount } from "./types";

export async function fetchGifBytes(url: string): Promise<Uint8Array> {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    throw new Error(`Failed to fetch GIF (${response.status})`);
  }
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

export function startsWithGifSignature(bytes: Uint8Array): boolean {
  if (bytes.length < 6) {
    return false;
  }
  const sig = String.fromCharCode(
    bytes[0],
    bytes[1],
    bytes[2],
    bytes[3],
    bytes[4],
    bytes[5]
  );
  return sig === "GIF87a" || sig === "GIF89a";
}

export function firstBytesHex(bytes: Uint8Array, count = 16): string {
  return Array.from(bytes.slice(0, count))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");
}

function extractSourceLoopCount(parsedGif: unknown): SourceLoopCount {
  const gif = parsedGif as {
    appExtensions?: Array<{ iterations?: number }>;
  };
  const iterations = gif.appExtensions?.find((x) => typeof x.iterations === "number")?.iterations;
  if (iterations === undefined) {
    return 1;
  }
  return iterations === 0 ? "infinite" : iterations;
}

function deriveCanvasSize(frames: GifFrame[]): { width: number; height: number } {
  let width = 0;
  let height = 0;
  for (const frame of frames) {
    width = Math.max(width, frame.dims.left + frame.dims.width);
    height = Math.max(height, frame.dims.top + frame.dims.height);
  }
  return {
    width: Math.max(width, 1),
    height: Math.max(height, 1)
  };
}

function composeFrames(decodedFrames: GifFrame[], width: number, height: number): ImageData[] {
  const workCanvas = document.createElement("canvas");
  workCanvas.width = width;
  workCanvas.height = height;
  const workCtx = workCanvas.getContext("2d");
  if (!workCtx) {
    throw new Error("Unable to initialize composition canvas");
  }

  workCtx.clearRect(0, 0, width, height);
  const output: ImageData[] = [];

  for (let index = 0; index < decodedFrames.length; index += 1) {
    const frame = decodedFrames[index];
    // Snapshot is required for disposal mode 3 ("restore to previous").
    const snapshotBefore = workCtx.getImageData(0, 0, width, height);
    const fw = frame.dims.width;
    const fh = frame.dims.height;
    if (fw <= 0 || fh <= 0) {
      throw new Error(`Frame ${index} has invalid dimensions ${fw}x${fh}`);
    }

    const expected = fw * fh * 4;
    const normalized = new Uint8ClampedArray(expected);
    const source = frame.patch;
    const sourceLength = source.length;
    const copyLength = Math.min(expected, sourceLength);
    for (let i = 0; i < copyLength; i += 1) {
      normalized[i] = source[i];
    }

    try {
      // Rebuild patch data in-page to avoid Firefox security checks on foreign ImageData buffers.
      const patchImage = workCtx.createImageData(fw, fh);
      patchImage.data.set(normalized);
      workCtx.putImageData(patchImage, frame.dims.left, frame.dims.top);
    } catch (error: unknown) {
      const detail = formatUnknownError(error);
      throw new Error(
        `Frame ${index} composite failed (dims=${fw}x${fh}, left=${frame.dims.left}, top=${frame.dims.top}, patchLen=${sourceLength}, expected=${expected}): ${detail}`
      );
    }

    output.push(workCtx.getImageData(0, 0, width, height));

    if (frame.disposalType === 2) {
      // Disposal 2: clear the frame's drawn region before the next frame.
      workCtx.clearRect(frame.dims.left, frame.dims.top, frame.dims.width, frame.dims.height);
    } else if (frame.disposalType === 3) {
      // Disposal 3: revert to pixels from before this frame was drawn.
      workCtx.putImageData(snapshotBefore, 0, 0);
    }
  }

  return output;
}

function normalizeFrameDelays(decoded: GifFrame[]): number[] {
  return decoded.map((frame) => {
    const delayCentiseconds = Number(frame.delay);
    let delayMs = Number.isFinite(delayCentiseconds) ? delayCentiseconds * 10 : 100;
    if (delayMs <= 0) {
      delayMs = 100;
    }
    // Clamp malformed delay metadata so playback never appears frozen.
    return Math.min(Math.max(delayMs, 20), 1000);
  });
}

export function decodeGif(gifBytes: Uint8Array): DecodedGifData {
  const parsed = parseGIF(gifBytes);
  const decoded = decompressFrames(parsed, true);
  if (!decoded.length) {
    throw new Error("No GIF frames were decoded");
  }

  const { width, height } = deriveCanvasSize(decoded);
  const frames = composeFrames(decoded, width, height);
  const delaysMs = normalizeFrameDelays(decoded);
  const sourceLoopCount = extractSourceLoopCount(parsed);

  return {
    frames,
    delaysMs,
    width,
    height,
    sourceLoopCount
  };
}
