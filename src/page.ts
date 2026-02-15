import { bootstrapGifScrubber } from "./page/main";

const marker = window as Window & { __gifScrubberPageRunning?: boolean };

if (!marker.__gifScrubberPageRunning) {
  marker.__gifScrubberPageRunning = true;
  bootstrapGifScrubber();
}
