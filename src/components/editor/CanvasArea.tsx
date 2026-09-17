/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * FrameForge - High Performance Drawing & Animation Canvas Engine
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Project,
  Frame,
  ToolType,
  BrushType,
  Point,
  DrawingElement,
  StrokeElement,
  ShapeElement,
  FillElement,
  OnionSkinConfig,
  TransformState,
  LassoState,
  ReferenceImage,
} from '../../types';
import {
  renderFrameToCanvas,
  renderElement,
  renderStroke,
  renderShape,
  performFloodFill,
  isPointInPolygon,
  hexToRgb,
} from '../../utils/canvasHelper';
import {
  Check,
  X,
  FlipHorizontal,
  FlipVertical,
  RotateCw,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';

interface CanvasAreaProps {
  project: Project;
  currentFrameIndex: number;
  activeLayerId: string;
  activeTool: ToolType;
  activeBrush: BrushType;
  activeShape: 'line' | 'rectangle' | 'ellipse';
  brushSize: number;
  brushOpacity: number;
  currentColor: string;
  onionSkin: OnionSkinConfig;
  cameraEnabled: boolean;
  referenceImage: ReferenceImage | null;
  onCommitElement: (element: DrawingElement) => void;
  onPickColor: (hexColor: string) => void;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  pan: { x: number; y: number };
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  onToggleOnionSkin: () => void;
  onOpenOnionSkinConfig?: () => void;
}

export const CanvasArea: React.FC<CanvasAreaProps> = ({
  project,
  currentFrameIndex,
  activeLayerId,
  activeTool,
  activeBrush,
  activeShape,
  brushSize,
  brushOpacity,
  currentColor,
  onionSkin,
  cameraEnabled,
  referenceImage,
  onCommitElement,
  onPickColor,
  zoom,
  setZoom,
  pan,
  setPan,
  onToggleOnionSkin,
  onOpenOnionSkinConfig,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const compositeCanvasRef = useRef<HTMLCanvasElement>(null);
  const onionCanvasRef = useRef<HTMLCanvasElement>(null);
  const scratchCanvasRef = useRef<HTMLCanvasElement>(null);

  // Drawing state refs (avoiding React re-renders during active stroke)
  const isPointerDownRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const currentStrokePointsRef = useRef<Point[]>([]);
  const shapeStartPointRef = useRef<Point | null>(null);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const initialPointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());

  // Lasso & Transform state
  const [lassoState, setLassoState] = useState<LassoState>({
    isActive: false,
    pathPoints: [],
    isClosed: false,
  });

  const [transformState, setTransformState] = useState<TransformState>({
    isActive: false,
    elements: [],
    layerId: activeLayerId,
    bounds: { x: 0, y: 0, width: 0, height: 0 },
    originBounds: { x: 0, y: 0, width: 0, height: 0 },
    translation: { x: 0, y: 0 },
    scale: { x: 1, y: 1 },
    rotation: 0,
  });

  const activeFrame = project.frames[currentFrameIndex] || project.frames[0];

  // 1. Render Composite Canvas (Current frame layers)
  const redrawComposite = useCallback(() => {
    const canvas = compositeCanvasRef.current;
    if (!canvas || !activeFrame) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderFrameToCanvas(ctx, activeFrame, project.layersMeta, project.width, project.height, {
      drawBackground: false,
    });
  }, [activeFrame, project.layersMeta, project.width, project.height]);

  // 2. Render Onion Skin Canvas
  const redrawOnionSkin = useCallback(() => {
    const canvas = onionCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, project.width, project.height);
    if (!onionSkin.enabled || project.frames.length <= 1) return;

    // Previous frames
    for (let i = 1; i <= onionSkin.prevFramesCount; i++) {
      const prevIdx = currentFrameIndex - i;
      if (prevIdx >= 0) {
        const prevFrame = project.frames[prevIdx];
        const falloff = (onionSkin.prevFramesCount - i + 1) / onionSkin.prevFramesCount;
        renderTintedFrame(ctx, prevFrame, onionSkin.prevColor, onionSkin.opacity * falloff);
      }
    }

    // Next frames
    for (let i = 1; i <= onionSkin.nextFramesCount; i++) {
      const nextIdx = currentFrameIndex + i;
      if (nextIdx < project.frames.length) {
        const nextFrame = project.frames[nextIdx];
        const falloff = (onionSkin.nextFramesCount - i + 1) / onionSkin.nextFramesCount;
        renderTintedFrame(ctx, nextFrame, onionSkin.nextColor, onionSkin.opacity * falloff);
      }
    }
  }, [onionSkin, currentFrameIndex, project.frames, project.width, project.height, project.layersMeta]);

  // Tinted render for onion skinning
  const renderTintedFrame = (
    targetCtx: CanvasRenderingContext2D,
    frame: Frame,
    tintHex: string,
    alpha: number
  ) => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = project.width;
    tempCanvas.height = project.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Render frame to temporary canvas
    renderFrameToCanvas(tempCtx, frame, project.layersMeta, project.width, project.height, {
      drawBackground: false,
    });

    // Colorize using source-in
    tempCtx.save();
    tempCtx.globalCompositeOperation = 'source-in';
    tempCtx.fillStyle = tintHex;
    tempCtx.fillRect(0, 0, project.width, project.height);
    tempCtx.restore();

    // Draw tinted copy to target canvas
    targetCtx.save();
    targetCtx.globalAlpha = alpha;
    targetCtx.drawImage(tempCanvas, 0, 0);
    targetCtx.restore();
  };

  useEffect(() => {
    redrawComposite();
    redrawOnionSkin();
  }, [redrawComposite, redrawOnionSkin]);

  // Convert screen coordinates to canvas space
  const screenToCanvasCoords = (clientX: number, clientY: number): Point => {
    if (!compositeCanvasRef.current) return { x: 0, y: 0 };
    const rect = compositeCanvasRef.current.getBoundingClientRect();
    const scaleX = project.width / rect.width;
    const scaleY = project.height / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    return { x, y };
  };

  // Pointer Down (Drawing / Pan / Eyedropper / Lasso)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    initialPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Multi-touch gestures (2 fingers = pan & zoom)
    if (initialPointersRef.current.size >= 2) {
      isPointerDownRef.current = false;
      return;
    }

    if (e.button !== 0 && e.pointerType === 'mouse') return;

    const canvasPoint = screenToCanvasCoords(e.clientX, e.clientY);
    const pressure = e.pressure && e.pressure > 0 ? e.pressure : 1;
    canvasPoint.pressure = pressure;

    isPointerDownRef.current = true;
    activePointerIdRef.current = e.pointerId;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    // 1. Eyedropper tool
    if (activeTool === 'eyedropper') {
      sampleColorAt(canvasPoint.x, canvasPoint.y);
      return;
    }

    // 2. Bucket Fill tool
    if (activeTool === 'fill') {
      const compCanvas = compositeCanvasRef.current;
      if (!compCanvas) return;
      const ctx = compCanvas.getContext('2d');
      if (!ctx) return;

      const fillEl = performFloodFill(
        ctx,
        project.width,
        project.height,
        canvasPoint.x,
        canvasPoint.y,
        currentColor,
        36
      );
      if (fillEl) {
        onCommitElement(fillEl);
      }
      return;
    }

    // 3. Lasso Tool
    if (activeTool === 'lasso') {
      setLassoState({
        isActive: true,
        pathPoints: [canvasPoint],
        isClosed: false,
      });
      return;
    }

    // 4. Shape Tools
    if (['line', 'rectangle', 'ellipse'].includes(activeTool)) {
      shapeStartPointRef.current = canvasPoint;
      return;
    }

    // 5. Brushes / Eraser
    currentStrokePointsRef.current = [canvasPoint];

    // Immediate single tap preview
    const scratch = scratchCanvasRef.current;
    if (scratch) {
      const ctx = scratch.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, project.width, project.height);
        const tempStroke: StrokeElement = {
          id: 'temp',
          type: 'stroke',
          tool: activeTool,
          color: currentColor,
          width: brushSize,
          opacity: brushOpacity,
          points: [canvasPoint],
        };
        renderStroke(ctx, tempStroke);
      }
    }
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // Two-finger pan & pinch zoom
    if (initialPointersRef.current.size >= 2) {
      const ptrs = Array.from(initialPointersRef.current.values());
      const p1 = ptrs[0];
      const p2 = ptrs[1];
      if (e.pointerId === Array.from(initialPointersRef.current.keys())[0]) {
        setPan((prev) => ({
          x: prev.x + (e.clientX - p1.x) * 0.7,
          y: prev.y + (e.clientY - p1.y) * 0.7,
        }));
        initialPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }
      return;
    }

    if (!isPointerDownRef.current) return;

    const canvasPoint = screenToCanvasCoords(e.clientX, e.clientY);
    const pressure = e.pressure && e.pressure > 0 ? e.pressure : 1;
    canvasPoint.pressure = pressure;

    // Lasso path update
    if (activeTool === 'lasso' && lassoState.isActive) {
      setLassoState((prev) => ({
        ...prev,
        pathPoints: [...prev.pathPoints, canvasPoint],
      }));
      drawLassoOverlay([...lassoState.pathPoints, canvasPoint]);
      return;
    }

    // Shapes live preview
    if (['line', 'rectangle', 'ellipse'].includes(activeTool) && shapeStartPointRef.current) {
      const scratch = scratchCanvasRef.current;
      if (scratch) {
        const ctx = scratch.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, project.width, project.height);
          const tempShape: ShapeElement = {
            id: 'temp-shape',
            type: 'shape',
            shapeType: activeShape,
            color: currentColor,
            width: brushSize,
            opacity: brushOpacity,
            startX: shapeStartPointRef.current.x,
            startY: shapeStartPointRef.current.y,
            endX: canvasPoint.x,
            endY: canvasPoint.y,
          };
          renderShape(ctx, tempShape);
        }
      }
      return;
    }

    // Stroke live update
    if (['pencil', 'brush', 'marker', 'airbrush', 'ink', 'eraser'].includes(activeTool)) {
      currentStrokePointsRef.current.push(canvasPoint);

      const scratch = scratchCanvasRef.current;
      if (scratch) {
        const ctx = scratch.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, project.width, project.height);
          const tempStroke: StrokeElement = {
            id: 'temp',
            type: 'stroke',
            tool: activeTool,
            color: currentColor,
            width: brushSize,
            opacity: brushOpacity,
            points: currentStrokePointsRef.current,
          };
          renderStroke(ctx, tempStroke);
        }
      }
    }
  };

  // Pointer Up / End
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    initialPointersRef.current.delete(e.pointerId);

    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;

    // Clear scratch canvas
    const scratch = scratchCanvasRef.current;
    if (scratch) {
      const ctx = scratch.getContext('2d');
      ctx?.clearRect(0, 0, project.width, project.height);
    }

    const canvasPoint = screenToCanvasCoords(e.clientX, e.clientY);

    // Commit Lasso
    if (activeTool === 'lasso' && lassoState.isActive) {
      if (lassoState.pathPoints.length > 2) {
        setLassoState((prev) => ({ ...prev, isClosed: true }));
        initSelectionFromLasso(lassoState.pathPoints);
      }
      return;
    }

    // Commit Shape
    if (['line', 'rectangle', 'ellipse'].includes(activeTool) && shapeStartPointRef.current) {
      const shapeEl: ShapeElement = {
        id: `shape-${Date.now()}`,
        type: 'shape',
        shapeType: activeShape,
        color: currentColor,
        width: brushSize,
        opacity: brushOpacity,
        startX: shapeStartPointRef.current.x,
        startY: shapeStartPointRef.current.y,
        endX: canvasPoint.x,
        endY: canvasPoint.y,
      };
      shapeStartPointRef.current = null;
      onCommitElement(shapeEl);
      return;
    }

    // Commit Stroke
    if (
      ['pencil', 'brush', 'marker', 'airbrush', 'ink', 'eraser'].includes(activeTool) &&
      currentStrokePointsRef.current.length > 0
    ) {
      const strokeEl: StrokeElement = {
        id: `stroke-${Date.now()}`,
        type: 'stroke',
        tool: activeTool,
        color: currentColor,
        width: brushSize,
        opacity: brushOpacity,
        points: [...currentStrokePointsRef.current],
      };
      currentStrokePointsRef.current = [];
      onCommitElement(strokeEl);
    }
  };

  // Draw Lasso Overlay on scratch canvas
  const drawLassoOverlay = (points: Point[]) => {
    const scratch = scratchCanvasRef.current;
    if (!scratch || points.length < 2) return;
    const ctx = scratch.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, project.width, project.height);
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
    ctx.restore();
  };

  // Extract elements bounded by lasso polygon
  const initSelectionFromLasso = (polygon: Point[]) => {
    const activeLayer = activeFrame.layers[activeLayerId];
    if (!activeLayer || !activeLayer.elements) return;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    for (const p of polygon) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }

    const bounds = {
      x: minX,
      y: minY,
      width: Math.max(20, maxX - minX),
      height: Math.max(20, maxY - minY),
    };

    setTransformState({
      isActive: true,
      elements: [...activeLayer.elements],
      layerId: activeLayerId,
      bounds,
      originBounds: { ...bounds },
      translation: { x: 0, y: 0 },
      scale: { x: 1, y: 1 },
      rotation: 0,
    });
  };

  // Sample Color for Eyedropper
  const sampleColorAt = (x: number, y: number) => {
    const canvas = compositeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pixel = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
    if (pixel[3] > 10) {
      const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2])
        .toString(16)
        .slice(1)
        .toUpperCase()}`;
      onPickColor(hex);
    }
  };

  // Wheel to zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prev) => Math.max(0.15, Math.min(5, prev * zoomFactor)));
  };

  // Canvas background style
  const getCanvasBgClass = () => {
    if (project.backgroundType === 'white') return 'bg-white';
    if (project.backgroundType === 'color') return '';
    return 'checkerboard-bg';
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="flex-1 w-full h-full bg-[#121214] canvas-grid-pattern relative overflow-hidden flex items-center justify-center cursor-crosshair touch-none select-none"
    >
      {/* Zoom / Pan Centered Stage */}
      <div
        className="relative transition-transform duration-75 shadow-2xl flex-shrink-0"
        style={{
          width: project.width,
          height: project.height,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          backgroundColor: project.backgroundType === 'color' ? project.backgroundColor : undefined,
        }}
      >
        {/* Base Canvas Background Layer */}
        <div className={`absolute inset-0 ${getCanvasBgClass()} pointer-events-none rounded-xs`} />

        {/* Reference Image Overlay (if enabled) */}
        {referenceImage && referenceImage.isVisible && (
          <div
            className="absolute pointer-events-none z-10"
            style={{
              left: referenceImage.x,
              top: referenceImage.y,
              transform: `scale(${referenceImage.scale})`,
              transformOrigin: 'top left',
              opacity: referenceImage.opacity,
            }}
          >
            <img
              src={referenceImage.dataUrl}
              alt="Reference"
              className="max-w-none pointer-events-none shadow"
            />
          </div>
        )}

        {/* 1. Onion Skin Canvas (Underneath active frame) */}
        <canvas
          ref={onionCanvasRef}
          width={project.width}
          height={project.height}
          className="absolute inset-0 pointer-events-none z-10"
        />

        {/* 2. Main Composite Canvas (Current frame layers) */}
        <canvas
          ref={compositeCanvasRef}
          width={project.width}
          height={project.height}
          className="absolute inset-0 pointer-events-none z-20"
        />

        {/* 3. Live Scratch Canvas (In-flight strokes & shape previews) */}
        <canvas
          ref={scratchCanvasRef}
          width={project.width}
          height={project.height}
          className="absolute inset-0 pointer-events-none z-30"
        />

        {/* 4. Transform Gizmo Box */}
        {transformState.isActive && (
          <div
            className="absolute border-2 border-sky-400 bg-sky-400/10 z-40 pointer-events-auto"
            style={{
              left: transformState.bounds.x + transformState.translation.x,
              top: transformState.bounds.y + transformState.translation.y,
              width: transformState.bounds.width * transformState.scale.x,
              height: transformState.bounds.height * transformState.scale.y,
              transform: `rotate(${transformState.rotation}deg)`,
              transformOrigin: 'center center',
            }}
          >
            {/* Quick Action Floating Bar */}
            <div className="absolute -top-11 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#1f1f24] border border-white/10 rounded-xl p-1 shadow-xl text-xs text-white">
              <button
                onClick={() =>
                  setTransformState((prev) => ({
                    ...prev,
                    scale: { ...prev.scale, x: prev.scale.x * -1 },
                  }))
                }
                title="Flip Horizontal"
                className="p-1 rounded hover:bg-white/10"
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() =>
                  setTransformState((prev) => ({
                    ...prev,
                    scale: { ...prev.scale, y: prev.scale.y * -1 },
                  }))
                }
                title="Flip Vertical"
                className="p-1 rounded hover:bg-white/10"
              >
                <FlipVertical className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() =>
                  setTransformState((prev) => ({
                    ...prev,
                    rotation: (prev.rotation + 90) % 360,
                  }))
                }
                title="Rotate 90°"
                className="p-1 rounded hover:bg-white/10"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTransformState((prev) => ({ ...prev, isActive: false }))}
                title="Cancel"
                className="p-1 rounded hover:bg-red-500/20 text-red-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  // Apply transformation to layer elements
                  setTransformState((prev) => ({ ...prev, isActive: false }));
                  setLassoState({ isActive: false, pathPoints: [], isClosed: false });
                }}
                title="Confirm Transform"
                className="p-1 rounded bg-amber-500 text-black font-bold"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 5. Camera Framing Guides (Cinematic 16:9 safe zone) */}
        {cameraEnabled && (
          <div className="absolute inset-0 pointer-events-none z-50 border-2 border-amber-500/50 flex flex-col justify-between p-3">
            <div className="flex items-center justify-between text-[10px] font-mono text-amber-400/80 uppercase tracking-widest">
              <span>● REC CAM SAFE</span>
              <span>100% SCALE</span>
            </div>
            {/* Center crosshair */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-[1px] bg-amber-500/40" />
              <div className="h-6 w-[1px] bg-amber-500/40 absolute" />
            </div>
            <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500">
              <span>{project.width} × {project.height}</span>
              <span>Frame {currentFrameIndex + 1}</span>
            </div>
          </div>
        )}
      </div>

      {/* Floating Canvas UI Overlay: Onion Skin Quick Toggle */}
      <div
        id="canvas-onion-skin-overlay"
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute top-3 left-3 z-40 pointer-events-auto flex items-center gap-1.5"
      >
        <button
          id="canvas-onion-skin-toggle-btn"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleOnionSkin();
          }}
          title={
            onionSkin.enabled
              ? "Onion Skinning Active (Click to Disable, shortcut 'O')"
              : "Enable Onion Skinning (Click to Enable, shortcut 'O')"
          }
          className={`h-9 px-3 rounded-full flex items-center gap-2 text-xs font-medium transition-all shadow-lg border backdrop-blur-md ${
            onionSkin.enabled
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25 shadow-amber-500/10'
              : 'bg-[#18181b]/80 border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-[#18181b] hover:border-white/20'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
              onionSkin.enabled ? 'bg-amber-500 text-zinc-950 font-bold' : 'bg-white/10 text-zinc-400'
            }`}
          >
            <Sparkles className="w-3 h-3" />
          </div>

          <span className="font-semibold tracking-tight">Onion Skin</span>

          <span
            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
              onionSkin.enabled
                ? 'bg-amber-500/30 text-amber-200 border border-amber-500/40'
                : 'bg-white/5 text-zinc-500 border border-white/5'
            }`}
          >
            {onionSkin.enabled ? 'ON' : 'OFF'}
          </span>

          {onionSkin.enabled && (
            <div className="flex items-center gap-1.5 ml-0.5 border-l border-white/10 pl-2">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: onionSkin.prevColor }}
                title={`Previous: ${onionSkin.prevFramesCount} frame(s)`}
              />
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: onionSkin.nextColor }}
                title={`Next: ${onionSkin.nextFramesCount} frame(s)`}
              />
            </div>
          )}
        </button>

        {onOpenOnionSkinConfig && (
          <button
            id="canvas-onion-skin-tune-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenOnionSkinConfig();
            }}
            title="Configure Onion Skinning (Frames, Tint, Opacity)"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border backdrop-blur-md shadow-lg ${
              onionSkin.enabled
                ? 'bg-[#18181b]/80 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                : 'bg-[#18181b]/80 border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-[#18181b] hover:border-white/20'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        )}

        {onionSkin.enabled && project.frames.length <= 1 && (
          <div
            id="canvas-onion-skin-single-frame-tip"
            className="hidden md:flex items-center px-2.5 py-1 rounded-full text-[11px] font-mono text-zinc-400 bg-[#18181b]/75 border border-white/10 backdrop-blur-md"
          >
            Tip: Add frames on timeline to see ghost references
          </div>
        )}
      </div>
    </div>
  );
};
