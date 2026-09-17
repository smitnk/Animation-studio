/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * FrameForge - Graphics & Canvas Engine
 */

import {
  DrawingElement,
  StrokeElement,
  ShapeElement,
  FillElement,
  ImageElement,
  Frame,
  LayerMeta,
  Project,
  Point,
} from '../types';

// Render a single stroke with smooth Catmull-Rom or Bézier curve interpolation
export function renderStroke(ctx: CanvasRenderingContext2D, stroke: StrokeElement): void {
  if (!stroke.points || stroke.points.length === 0) return;

  ctx.save();

  if (stroke.tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = stroke.color;
  }

  ctx.globalAlpha = stroke.opacity;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const pts = stroke.points;

  if (pts.length === 1) {
    const p = pts[0];
    const radius = Math.max(1, (stroke.width * (p.pressure ?? 1)) / 2);
    ctx.fillStyle = stroke.tool === 'eraser' ? 'rgba(0,0,0,1)' : stroke.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  // Specialized brush rendering
  if (stroke.tool === 'marker') {
    ctx.lineCap = 'square';
    ctx.globalAlpha = Math.min(1, stroke.opacity * 0.7);
    ctx.lineWidth = stroke.width;
  } else if (stroke.tool === 'airbrush') {
    ctx.lineWidth = stroke.width;
    ctx.shadowBlur = stroke.width * 0.6;
    ctx.shadowColor = stroke.color;
  } else {
    ctx.lineWidth = stroke.width;
  }

  // Smooth quadratic curves through midpoints
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);

  if (pts.length === 2) {
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.stroke();
    ctx.restore();
    return;
  }

  for (let i = 1; i < pts.length - 1; i++) {
    const midX = (pts[i].x + pts[i + 1].x) / 2;
    const midY = (pts[i].y + pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
  }

  const last = pts[pts.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();

  ctx.restore();
}

// Render geometric shapes
export function renderShape(ctx: CanvasRenderingContext2D, shape: ShapeElement): void {
  ctx.save();
  ctx.globalAlpha = shape.opacity;
  ctx.lineWidth = shape.width;
  ctx.strokeStyle = shape.color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const startX = shape.startX;
  const startY = shape.startY;
  const endX = shape.endX;
  const endY = shape.endY;

  ctx.beginPath();

  if (shape.shapeType === 'line') {
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  } else if (shape.shapeType === 'rectangle') {
    const x = Math.min(startX, endX);
    const y = Math.min(startY, endY);
    const w = Math.abs(endX - startX);
    const h = Math.abs(endY - startY);

    if (shape.isFilled && shape.fillColor) {
      ctx.fillStyle = shape.fillColor;
      ctx.fillRect(x, y, w, h);
    }
    ctx.strokeRect(x, y, w, h);
  } else if (shape.shapeType === 'ellipse') {
    const centerX = (startX + endX) / 2;
    const centerY = (startY + endY) / 2;
    const radiusX = Math.abs(endX - startX) / 2;
    const radiusY = Math.abs(endY - startY) / 2;

    ctx.ellipse(centerX, centerY, Math.max(1, radiusX), Math.max(1, radiusY), 0, 0, Math.PI * 2);
    if (shape.isFilled && shape.fillColor) {
      ctx.fillStyle = shape.fillColor;
      ctx.fill();
    }
    ctx.stroke();
  }

  ctx.restore();
}

// Render image cache for fill element
export function renderFill(ctx: CanvasRenderingContext2D, fill: FillElement): void {
  if (!fill.fillMaskDataUrl) return;
  const img = new Image();
  img.src = fill.fillMaskDataUrl;
  if (img.complete) {
    ctx.save();
    ctx.globalAlpha = fill.opacity;
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  }
}

// Render imported reference or frame image
export function renderImage(ctx: CanvasRenderingContext2D, imageEl: ImageElement): void {
  const img = new Image();
  img.src = imageEl.dataUrl;
  if (img.complete) {
    ctx.save();
    ctx.globalAlpha = imageEl.opacity;
    ctx.drawImage(img, imageEl.x, imageEl.y, imageEl.width, imageEl.height);
    ctx.restore();
  }
}

// Render a single drawing element
export function renderElement(ctx: CanvasRenderingContext2D, element: DrawingElement): void {
  switch (element.type) {
    case 'stroke':
      renderStroke(ctx, element);
      break;
    case 'shape':
      renderShape(ctx, element);
      break;
    case 'fill':
      renderFill(ctx, element);
      break;
    case 'image':
      renderImage(ctx, element);
      break;
  }
}

// Render an entire frame to an arbitrary canvas context
export function renderFrameToCanvas(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  layersMeta: LayerMeta[],
  width: number,
  height: number,
  options?: {
    drawBackground?: boolean;
    backgroundType?: 'transparent' | 'white' | 'color';
    backgroundColor?: string;
  }
): void {
  ctx.clearRect(0, 0, width, height);

  // Background
  if (options?.drawBackground) {
    if (options.backgroundType === 'white') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
    } else if (options.backgroundType === 'color' && options.backgroundColor) {
      ctx.fillStyle = options.backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }
  }

  // Iterate layers in order (bottom to top)
  for (const meta of layersMeta) {
    if (!meta.isVisible) continue;
    const layerData = frame.layers[meta.id];
    if (!layerData || !layerData.elements || layerData.elements.length === 0) continue;

    // Render layer to intermediate offscreen canvas if layer has opacity or eraser strokes
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) continue;

    for (const el of layerData.elements) {
      renderElement(offCtx, el);
    }

    ctx.save();
    ctx.globalAlpha = meta.opacity;
    ctx.drawImage(offscreen, 0, 0);
    ctx.restore();
  }
}

// Generate thumbnail for a frame
export function generateFrameThumbnail(
  frame: Frame,
  layersMeta: LayerMeta[],
  projectWidth: number,
  projectHeight: number,
  thumbMaxDim = 120
): string {
  const scale = thumbMaxDim / Math.max(projectWidth, projectHeight);
  const thumbWidth = Math.max(20, Math.round(projectWidth * scale));
  const thumbHeight = Math.max(20, Math.round(projectHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = thumbWidth;
  canvas.height = thumbHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#1c1c20';
  ctx.fillRect(0, 0, thumbWidth, thumbHeight);

  ctx.save();
  ctx.scale(scale, scale);

  for (const meta of layersMeta) {
    if (!meta.isVisible) continue;
    const layerData = frame.layers[meta.id];
    if (!layerData) continue;
    for (const el of layerData.elements) {
      renderElement(ctx, el);
    }
  }

  ctx.restore();
  return canvas.toDataURL('image/webp', 0.8);
}

// High-performance flood fill (Bucket Fill) with color tolerance
export function performFloodFill(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  startX: number,
  startY: number,
  fillColorHex: string,
  tolerance = 32
): FillElement | null {
  const x0 = Math.round(startX);
  const y0 = Math.round(startY);

  if (x0 < 0 || x0 >= width || y0 < 0 || y0 >= height) return null;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const targetIdx = (y0 * width + x0) * 4;
  const tr = data[targetIdx];
  const tg = data[targetIdx + 1];
  const tb = data[targetIdx + 2];
  const ta = data[targetIdx + 3];

  // Parse fill color
  const fillRGB = hexToRgb(fillColorHex);
  if (!fillRGB) return null;

  // Check if same color
  if (
    Math.abs(tr - fillRGB.r) < 5 &&
    Math.abs(tg - fillRGB.g) < 5 &&
    Math.abs(tb - fillRGB.b) < 5 &&
    ta > 240
  ) {
    return null;
  }

  function colorMatch(idx: number): boolean {
    const dr = Math.abs(data[idx] - tr);
    const dg = Math.abs(data[idx + 1] - tg);
    const db = Math.abs(data[idx + 2] - tb);
    const da = Math.abs(data[idx + 3] - ta);
    return dr <= tolerance && dg <= tolerance && db <= tolerance && da <= tolerance;
  }

  // Create mask canvas for this fill
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = width;
  maskCanvas.height = height;
  const maskCtx = maskCanvas.getContext('2d');
  if (!maskCtx) return null;
  const maskImg = maskCtx.createImageData(width, height);
  const maskData = maskImg.data;

  // BFS Queue with TypedArray for memory efficiency
  const queue = new Int32Array(width * height);
  let qHead = 0;
  let qTail = 0;

  const visited = new Uint8Array(width * height);

  queue[qTail++] = y0 * width + x0;
  visited[y0 * width + x0] = 1;

  while (qHead < qTail) {
    const pos = queue[qHead++];
    const cx = pos % width;
    const cy = Math.floor(pos / width);
    const idx = (cy * width + cx) * 4;

    maskData[idx] = fillRGB.r;
    maskData[idx + 1] = fillRGB.g;
    maskData[idx + 2] = fillRGB.b;
    maskData[idx + 3] = 255;

    // 4 neighbors
    const neighbors = [
      cx > 0 ? pos - 1 : -1,
      cx < width - 1 ? pos + 1 : -1,
      cy > 0 ? pos - width : -1,
      cy < height - 1 ? pos + width : -1,
    ];

    for (const nPos of neighbors) {
      if (nPos !== -1 && !visited[nPos]) {
        visited[nPos] = 1;
        const nIdx = nPos * 4;
        if (colorMatch(nIdx)) {
          queue[qTail++] = nPos;
        }
      }
    }
  }

  maskCtx.putImageData(maskImg, 0, 0);

  return {
    id: `fill-${Date.now()}`,
    type: 'fill',
    color: fillColorHex,
    opacity: 1,
    startX,
    startY,
    fillMaskDataUrl: maskCanvas.toDataURL(),
  };
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  let cleaned = hex.replace('#', '');
  if (cleaned.length === 3) {
    cleaned = cleaned
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (cleaned.length !== 6) return null;
  const num = parseInt(cleaned, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// Point in polygon test for Lasso selection
export function isPointInPolygon(point: Point, vs: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i].x,
      yi = vs[i].y;
    const xj = vs[j].x,
      yj = vs[j].y;

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
