export type LoopMode = "source" | "infinite" | "none";
export type SourceLoopCount = number | "infinite";

export interface PlayerState {
  totalFrames: number;
  currentFrame: number;
  isPlaying: boolean;
  playbackRate: number;
  loopMode: LoopMode;
  sourceLoopCount: SourceLoopCount;
  effectiveLoopIteration: number;
  reducedMode: boolean;
}

export interface Controls {
  root: HTMLDivElement;
  playPauseButton: HTMLButtonElement;
  stepBackButton: HTMLButtonElement;
  stepForwardButton: HTMLButtonElement;
  loopSelect: HTMLSelectElement;
  speedSelect: HTMLSelectElement;
  slider: HTMLInputElement;
  frameLabel: HTMLSpanElement;
  warning: HTMLDivElement;
}

export interface PerformancePolicy {
  reducedMode: boolean;
  warningText: string | null;
}

export interface DecodedGifData {
  frames: ImageData[];
  delaysMs: number[];
  width: number;
  height: number;
  sourceLoopCount: SourceLoopCount;
}
