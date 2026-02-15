import { t } from "./i18n";

export function formatUnknownError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export function showFatalError(message: string): void {
  const banner = document.createElement("div");
  banner.textContent = `${t("error.bannerPrefix")}: ${message}`;
  banner.style.cssText = [
    "position:fixed",
    "left:50%",
    "top:12px",
    "transform:translateX(-50%)",
    "padding:10px 12px",
    "border-radius:10px",
    "background:#4c1111",
    "border:1px solid #a33",
    "color:#fff",
    "font:13px ui-sans-serif, system-ui, sans-serif",
    "z-index:2147483647"
  ].join(";");
  document.body.appendChild(banner);
}
