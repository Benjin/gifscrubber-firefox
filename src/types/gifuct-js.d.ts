declare module "gifuct-js" {
  export interface GifFrameDims {
    top: number;
    left: number;
    width: number;
    height: number;
  }

  export interface GifFrame {
    dims: GifFrameDims;
    delay: number;
    disposalType: number;
    patch: Uint8ClampedArray;
  }

  export function parseGIF(buffer: Uint8Array | ArrayBuffer): unknown;
  export function decompressFrames(gif: unknown, buildPatch: boolean): GifFrame[];
}
