declare module 'gifenc' {
  export interface GIFEncoderOptions {
    auto?: boolean;
    initialCapacity?: number;
  }

  export interface WriteFrameOptions {
    palette?: number[][];
    delay?: number;
    transparent?: boolean;
    transparentIndex?: number;
    dispose?: number;
  }

  export interface GIFEncoderInstance {
    writeFrame: (indexData: Uint8Array, width: number, height: number, opts?: WriteFrameOptions) => void;
    finish: () => void;
    bytes: () => Uint8Array;
  }

  export function GIFEncoder(options?: GIFEncoderOptions): GIFEncoderInstance;
  export function quantize(rgbaPixels: Uint8ClampedArray | Uint8Array, maxColors: number, opts?: any): number[][];
  export function applyPalette(rgbaPixels: Uint8ClampedArray | Uint8Array, palette: number[][]): Uint8Array;
}
