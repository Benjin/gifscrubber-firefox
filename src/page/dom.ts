export function isStandaloneGifTab(): boolean {
  if (window.top !== window) {
    return false;
  }

  if (document.contentType.toLowerCase() === "image/gif") {
    return true;
  }

  if (!/\.gif($|[?#])/i.test(window.location.href)) {
    return false;
  }

  const bodyChildren = document.body?.children.length ?? 0;
  return bodyChildren <= 1 && Boolean(document.querySelector("img"));
}

export function getGifElement(): HTMLImageElement | null {
  return document.querySelector("img");
}

export function configureCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.style.cssText = [
    "max-width:100vw",
    "max-height:100vh",
    "object-fit:contain",
    "image-rendering:auto"
  ].join(";");
  return canvas;
}

export function mountCanvas(canvas: HTMLCanvasElement, originalImage: HTMLImageElement | null): void {
  document.documentElement.style.height = "100%";
  document.body.style.margin = "0";
  document.body.style.height = "100%";
  document.body.style.display = "grid";
  document.body.style.placeItems = "center";
  document.body.style.background = "#111";
  document.body.style.overflow = "hidden";

  if (originalImage) {
    originalImage.style.display = "none";
  }
  document.body.appendChild(canvas);
}
