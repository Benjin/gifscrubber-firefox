import { getGifElement, isStandaloneGifTab, configureCanvas, mountCanvas } from "./dom";
import { formatUnknownError, showFatalError } from "./errors";
import { decodeGif, fetchGifBytes, firstBytesHex, startsWithGifSignature } from "./gif";
import { GifPlayer } from "./player";
import { applyPerformancePolicy } from "./policy";
import { createControls } from "./ui";

export async function runGifScrubber(): Promise<void> {
  let stage = "initialization";
  let gifUrl = "";

  if (!isStandaloneGifTab()) {
    return;
  }

  try {
    stage = "finding image element";
    const img = getGifElement();

    stage = "reading tab URL";
    gifUrl = window.location.href;

    stage = "fetching gif bytes";
    const gifBytes = await fetchGifBytes(gifUrl);
    if (!startsWithGifSignature(gifBytes)) {
      throw new Error(
        `Response is not GIF data (missing GIF87a/GIF89a header). First bytes: ${firstBytesHex(gifBytes)}`
      );
    }

    stage = "decoding gif";
    const decoded = decodeGif(gifBytes);

    stage = "mounting ui";
    const policy = applyPerformancePolicy(decoded.frames.length, decoded.width, decoded.height);
    const canvas = configureCanvas(decoded.width, decoded.height);
    mountCanvas(canvas, img);
    const controls = createControls(decoded.frames.length);

    if (policy.warningText) {
      controls.warning.style.display = "block";
      controls.warning.textContent = policy.warningText;
    }

    stage = "starting player";
    const player = new GifPlayer(
      decoded.frames,
      decoded.delaysMs,
      canvas,
      controls,
      decoded.sourceLoopCount,
      policy.reducedMode
    );
    player.mount();
  } catch (error: unknown) {
    const detail = formatUnknownError(error);
    const message = `Failed during ${stage}${gifUrl ? ` for ${gifUrl}` : ""}: ${detail}`;
    console.error("[GIF Scrubber]", message, error);
    throw new Error(message);
  }
}

export function bootstrapGifScrubber(): void {
  void runGifScrubber().catch((error: unknown) => {
    const message = formatUnknownError(error);
    console.error("[GIF Scrubber] Fatal", error);
    showFatalError(message);
  });
}
