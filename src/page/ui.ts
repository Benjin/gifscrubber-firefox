import { SPEED_OPTIONS } from "./constants";
import { t } from "./i18n";
import type { Controls, LoopMode } from "./types";

export function createControls(totalFrames: number): Controls {
  const root = document.createElement("div");
  root.id = "gif-scrubber-overlay";
  root.style.cssText = [
    "position:fixed",
    "left:50%",
    "bottom:16px",
    "transform:translateX(-50%)",
    "display:flex",
    "flex-direction:column",
    "gap:8px",
    "padding:10px",
    "background:rgba(16,16,16,0.8)",
    "backdrop-filter:blur(6px)",
    "border:1px solid rgba(255,255,255,0.2)",
    "border-radius:12px",
    "color:#f4f4f4",
    "font:12px/1.2 ui-sans-serif, system-ui, sans-serif",
    "z-index:2147483647",
    "opacity:0.35",
    "transition:opacity 120ms ease"
  ].join(";");
  root.addEventListener("mouseenter", () => {
    root.style.opacity = "1";
  });
  root.addEventListener("mouseleave", () => {
    root.style.opacity = "0.35";
  });

  const warning = document.createElement("div");
  warning.style.cssText = [
    "display:none",
    "padding:6px 8px",
    "background:rgba(255,170,0,0.2)",
    "border:1px solid rgba(255,170,0,0.5)",
    "border-radius:8px",
    "max-width:560px"
  ].join(";");
  root.appendChild(warning);

  const row = document.createElement("div");
  row.style.cssText = "display:flex;align-items:center;gap:6px;";

  const labeledControlStyle = "display:flex;flex-direction:column;align-items:center;gap:4px;";
  const labelStyle = "font-size:11px;opacity:0.95;color:#f4f4f4;";
  const selectStyle = [
    "padding:4px 6px",
    "border-radius:8px",
    "border:1px solid rgba(255,255,255,0.3)",
    "background:#1f1f1f",
    "color:#ffffff",
    "cursor:pointer"
  ].join(";");

  const stepBackButton = document.createElement("button");
  stepBackButton.type = "button";
  stepBackButton.textContent = t("button.stepBack");
  stepBackButton.title = t("tooltip.stepBack");
  stepBackButton.setAttribute("aria-label", t("tooltip.stepBack"));

  const playPauseButton = document.createElement("button");
  playPauseButton.type = "button";
  playPauseButton.textContent = t("button.playSymbol");
  playPauseButton.title = t("tooltip.playPlayback");
  playPauseButton.setAttribute("aria-label", t("aria.playPlayback"));

  const stepForwardButton = document.createElement("button");
  stepForwardButton.type = "button";
  stepForwardButton.textContent = t("button.stepForward");
  stepForwardButton.title = t("tooltip.stepForward");
  stepForwardButton.setAttribute("aria-label", t("tooltip.stepForward"));

  const loopWrap = document.createElement("div");
  loopWrap.style.cssText = labeledControlStyle;
  const loopText = document.createElement("span");
  loopText.textContent = t("label.loopingMode");
  loopText.style.cssText = labelStyle;
  loopText.title = t("tooltip.loopingMode.label");
  const loopSelect = document.createElement("select");
  loopSelect.style.cssText = selectStyle;
  loopSelect.title = t("tooltip.loopingMode.select");
  loopSelect.setAttribute("aria-label", t("aria.loopingMode"));

  const loopOptions: Array<{ value: LoopMode; label: string; tooltipKey: string }> = [
    { value: "source", label: t("option.loop.source"), tooltipKey: "tooltip.loopingMode.source" },
    { value: "infinite", label: t("option.loop.infinite"), tooltipKey: "tooltip.loopingMode.infinite" },
    { value: "none", label: t("option.loop.none"), tooltipKey: "tooltip.loopingMode.none" }
  ];

  for (const optionData of loopOptions) {
    const option = document.createElement("option");
    option.value = optionData.value;
    option.textContent = optionData.label;
    option.title = t(optionData.tooltipKey);
    option.style.backgroundColor = "#1f1f1f";
    option.style.color = "#ffffff";
    loopSelect.appendChild(option);
  }
  loopWrap.append(loopSelect, loopText);

  const speedWrap = document.createElement("div");
  speedWrap.style.cssText = labeledControlStyle;
  const speedText = document.createElement("span");
  speedText.textContent = t("label.playbackSpeed");
  speedText.style.cssText = labelStyle;
  speedText.title = t("tooltip.playbackSpeed.label");
  const speedSelect = document.createElement("select");
  speedSelect.style.cssText = selectStyle;
  speedSelect.title = t("tooltip.playbackSpeed.select");
  speedSelect.setAttribute("aria-label", t("aria.playbackSpeed"));

  for (const rate of SPEED_OPTIONS) {
    const option = document.createElement("option");
    option.value = String(rate);
    option.textContent = `${Math.round(rate * 100)}%`;
    const descriptor =
      rate < 1
        ? t("tooltip.playbackSpeed.descriptor.slower")
        : rate > 1
          ? t("tooltip.playbackSpeed.descriptor.faster")
          : t("tooltip.playbackSpeed.descriptor.original");
    option.title = t("tooltip.playbackSpeed.option", {
      percent: Math.round(rate * 100),
      descriptor
    });
    option.style.backgroundColor = "#1f1f1f";
    option.style.color = "#ffffff";
    if (rate === 1) {
      option.selected = true;
    }
    speedSelect.appendChild(option);
  }
  speedWrap.append(speedSelect, speedText);

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "0";
  slider.max = String(Math.max(totalFrames - 1, 0));
  slider.value = "0";
  slider.style.cssText = "width:min(60vw,520px);";
  slider.title = t("tooltip.scrubber");
  slider.setAttribute("aria-label", t("aria.frameScrubber"));

  const frameLabel = document.createElement("span");
  frameLabel.textContent = `1/${totalFrames}`;
  frameLabel.style.cssText =
    "display:inline-block;min-width:72px;text-align:center;font-variant-numeric:tabular-nums;";
  frameLabel.title = t("tooltip.frameCounter");

  for (const button of [stepBackButton, playPauseButton, stepForwardButton]) {
    button.style.cssText = [
      "padding:4px 8px",
      "border-radius:8px",
      "border:1px solid rgba(255,255,255,0.3)",
      "background:rgba(255,255,255,0.08)",
      "color:#f4f4f4",
      "cursor:pointer"
    ].join(";");
  }
  playPauseButton.style.minWidth = "40px";

  row.append(stepBackButton, playPauseButton, stepForwardButton, loopWrap, speedWrap, slider, frameLabel);
  root.appendChild(row);
  document.body.appendChild(root);

  return {
    root,
    playPauseButton,
    stepBackButton,
    stepForwardButton,
    loopSelect,
    speedSelect,
    slider,
    frameLabel,
    warning
  };
}
