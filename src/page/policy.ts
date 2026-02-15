import { LARGE_ESTIMATED_BYTES, LARGE_FRAME_COUNT, LARGE_PIXELS } from "./constants";
import { t } from "./i18n";
import type { PerformancePolicy } from "./types";

export function applyPerformancePolicy(
  totalFrames: number,
  width: number,
  height: number
): PerformancePolicy {
  const estimatedBytes = totalFrames * width * height * 4;
  const isLarge =
    totalFrames > LARGE_FRAME_COUNT ||
    width * height > LARGE_PIXELS ||
    estimatedBytes > LARGE_ESTIMATED_BYTES;

  if (!isLarge) {
    return {
      reducedMode: false,
      warningText: null
    };
  }

  return {
    reducedMode: true,
    warningText: t("warning.largeGifReducedMode")
  };
}
