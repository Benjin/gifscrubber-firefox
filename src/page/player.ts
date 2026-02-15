import { SHIFT_JUMP } from "./constants";
import { t } from "./i18n";
import type { Controls, LoopMode, PlayerState, SourceLoopCount } from "./types";

export class GifPlayer {
  private readonly frames: ImageData[];
  private readonly frameDelaysMs: number[];
  private readonly ctx: CanvasRenderingContext2D;
  private readonly controls: Controls;
  private readonly state: PlayerState;
  private rafId: number | null = null;
  private lastTickTs: number | null = null;
  private elapsedInFrameMs = 0;
  private sliderDragPending = false;

  constructor(
    frames: ImageData[],
    frameDelaysMs: number[],
    canvas: HTMLCanvasElement,
    controls: Controls,
    sourceLoopCount: SourceLoopCount,
    reducedMode: boolean
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas 2D context unavailable");
    }

    this.frames = frames;
    this.frameDelaysMs = frameDelaysMs;
    this.ctx = ctx;
    this.controls = controls;
    this.state = {
      totalFrames: frames.length,
      currentFrame: 0,
      isPlaying: false,
      playbackRate: 1,
      loopMode: "source",
      sourceLoopCount,
      effectiveLoopIteration: 1,
      reducedMode
    };
  }

  mount(): void {
    this.bindControls();
    this.bindKeyboard();
    this.renderCurrentFrame();
    this.syncUi();
    // Default behavior: begin playback immediately on load.
    this.play();
  }

  private bindControls(): void {
    this.controls.playPauseButton.addEventListener("click", () => {
      this.togglePlayback();
    });

    this.controls.stepBackButton.addEventListener("click", () => this.step(-1));
    this.controls.stepForwardButton.addEventListener("click", () => this.step(1));

    this.controls.loopSelect.addEventListener("change", () => {
      const mode = this.controls.loopSelect.value as LoopMode;
      if (mode !== "source" && mode !== "infinite" && mode !== "none") {
        return;
      }
      this.state.loopMode = mode;
      this.syncUi();
    });

    this.controls.speedSelect.addEventListener("change", () => {
      const nextRate = Number(this.controls.speedSelect.value);
      if (!Number.isFinite(nextRate) || nextRate <= 0) {
        return;
      }
      this.state.playbackRate = nextRate;
      this.syncUi();
    });

    this.controls.slider.addEventListener("input", () => {
      const targetFrame = Number(this.controls.slider.value);
      if (this.state.reducedMode) {
        // In reduced mode, defer expensive redraw until the drag is committed.
        this.state.currentFrame = targetFrame;
        this.sliderDragPending = true;
        this.syncUi();
        return;
      }
      this.seek(targetFrame);
    });

    this.controls.slider.addEventListener("change", () => {
      if (!this.sliderDragPending) {
        return;
      }
      this.sliderDragPending = false;
      this.seek(Number(this.controls.slider.value));
    });
  }

  private bindKeyboard(): void {
    window.addEventListener("keydown", (event) => {
      if (event.defaultPrevented) {
        return;
      }

      if (this.isEditableTarget(event.target)) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        this.togglePlayback();
        return;
      }

      if (event.code === "ArrowLeft") {
        event.preventDefault();
        this.step(event.shiftKey ? -SHIFT_JUMP : -1);
        return;
      }

      if (event.code === "ArrowRight") {
        event.preventDefault();
        this.step(event.shiftKey ? SHIFT_JUMP : 1);
      }
    });
  }

  private isEditableTarget(target: EventTarget | null): boolean {
    const element = target as HTMLElement | null;
    return Boolean(
      element &&
      (element.tagName === "INPUT" || element.tagName === "TEXTAREA" || element.isContentEditable)
    );
  }

  private togglePlayback(): void {
    this.state.isPlaying ? this.pause() : this.play();
  }

  private play(): void {
    if (this.state.totalFrames <= 1) {
      return;
    }

    if (this.state.currentFrame >= this.state.totalFrames - 1) {
      this.state.currentFrame = 0;
      this.state.effectiveLoopIteration = 1;
      this.renderCurrentFrame();
    }

    this.state.isPlaying = true;
    this.lastTickTs = null;
    this.queueTick();
    this.syncUi();
  }

  private pause(): void {
    this.state.isPlaying = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.lastTickTs = null;
    this.elapsedInFrameMs = 0;
    this.syncUi();
  }

  private queueTick(): void {
    if (!this.state.isPlaying) {
      return;
    }
    this.rafId = requestAnimationFrame((ts) => this.tick(ts));
  }

  private tick(ts: number): void {
    if (!this.state.isPlaying) {
      return;
    }

    if (this.lastTickTs === null) {
      this.lastTickTs = ts;
      this.queueTick();
      return;
    }

    this.elapsedInFrameMs += ts - this.lastTickTs;
    this.lastTickTs = ts;

    let frameDelay = this.getEffectiveDelayMs(this.state.currentFrame);

    while (this.elapsedInFrameMs >= frameDelay && this.state.isPlaying) {
      this.elapsedInFrameMs -= frameDelay;
      if (!this.advanceFrame()) {
        this.pause();
        break;
      }
      frameDelay = this.getEffectiveDelayMs(this.state.currentFrame);
    }

    if (this.state.isPlaying) {
      this.queueTick();
    }
  }

  private getEffectiveDelayMs(frameIndex: number): number {
    let delay = this.frameDelaysMs[frameIndex] ?? 100;
    if (this.state.reducedMode) {
      delay = Math.max(delay, 40);
    }
    // Higher playbackRate means shorter frame delay.
    const scaled = delay / this.state.playbackRate;
    return Math.max(5, scaled);
  }

  private advanceFrame(): boolean {
    if (this.state.currentFrame < this.state.totalFrames - 1) {
      this.state.currentFrame += 1;
      this.renderCurrentFrame();
      this.syncUi();
      return true;
    }

    if (this.state.loopMode === "none") {
      return false;
    }

    if (this.state.loopMode === "infinite" || this.state.sourceLoopCount === "infinite") {
      this.state.currentFrame = 0;
      this.state.effectiveLoopIteration += 1;
      this.renderCurrentFrame();
      this.syncUi();
      return true;
    }

    if (this.state.effectiveLoopIteration >= this.state.sourceLoopCount) {
      return false;
    }

    this.state.currentFrame = 0;
    this.state.effectiveLoopIteration += 1;
    this.renderCurrentFrame();
    this.syncUi();
    return true;
  }

  private step(delta: number): void {
    this.pause();
    this.state.currentFrame = this.clampFrameIndex(this.state.currentFrame + delta);
    this.renderCurrentFrame();
    this.syncUi();
  }

  private seek(frameIndex: number): void {
    this.pause();
    this.state.currentFrame = this.clampFrameIndex(frameIndex);
    this.renderCurrentFrame();
    this.syncUi();
  }

  private clampFrameIndex(value: number): number {
    return Math.min(this.state.totalFrames - 1, Math.max(0, value));
  }

  private renderCurrentFrame(): void {
    const frame = this.frames[this.state.currentFrame];
    this.ctx.putImageData(frame, 0, 0);
  }

  private syncUi(): void {
    this.controls.playPauseButton.textContent = this.state.isPlaying
      ? t("button.pauseSymbol")
      : t("button.playSymbol");
    this.controls.playPauseButton.setAttribute(
      "aria-label",
      this.state.isPlaying ? t("aria.pausePlayback") : t("aria.playPlayback")
    );
    this.controls.playPauseButton.title = this.state.isPlaying
      ? t("tooltip.pausePlayback")
      : t("tooltip.playPlayback");
    this.controls.slider.max = String(Math.max(this.state.totalFrames - 1, 0));
    this.controls.slider.value = String(this.state.currentFrame);
    this.controls.frameLabel.textContent = `${this.state.currentFrame + 1}/${this.state.totalFrames}`;
    this.controls.loopSelect.value = this.state.loopMode;
    this.controls.speedSelect.value = String(this.state.playbackRate);
  }
}
