/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * FrameForge - Domain Types and Data Contracts
 */

export type ToolType =
  | 'pencil'
  | 'brush'
  | 'marker'
  | 'airbrush'
  | 'ink'
  | 'eraser'
  | 'line'
  | 'rectangle'
  | 'ellipse'
  | 'fill'
  | 'eyedropper'
  | 'lasso'
  | 'transform';

export type BrushType = 'pencil' | 'brush' | 'marker' | 'airbrush' | 'ink';

export interface Point {
  x: number;
  y: number;
  pressure?: number;
  timestamp?: number;
}

export interface StrokeElement {
  id: string;
  type: 'stroke';
  tool: ToolType;
  color: string;
  width: number;
  opacity: number;
  points: Point[];
}

export interface ShapeElement {
  id: string;
  type: 'shape';
  shapeType: 'line' | 'rectangle' | 'ellipse';
  color: string;
  fillColor?: string;
  width: number;
  opacity: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isFilled?: boolean;
}

export interface FillElement {
  id: string;
  type: 'fill';
  color: string;
  opacity: number;
  startX: number;
  startY: number;
  // Raster patch data or SVG path if computed
  fillMaskDataUrl?: string;
}

export interface ImageElement {
  id: string;
  type: 'image';
  dataUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  rotation?: number;
}

export type DrawingElement = StrokeElement | ShapeElement | FillElement | ImageElement;

export interface LayerData {
  id: string;
  elements: DrawingElement[];
}

export interface LayerMeta {
  id: string;
  name: string;
  isVisible: boolean;
  isLocked: boolean;
  opacity: number;
}

export interface Frame {
  id: string;
  frameNumber: number;
  durationMultiplier: number; // For hold frames (default 1)
  layers: Record<string, LayerData>; // layerId -> LayerData
  thumbnail?: string; // Cache data URL
}

export interface AudioTrack {
  id: string;
  name: string;
  dataUrl: string; // Base64 audio/wav or audio/mp3
  durationSeconds: number;
  volume: number;
  isMuted: boolean;
  waveform?: number[]; // Normalized peaks 0..1 for UI waveform display
}

export interface CameraKeyframe {
  frameIndex: number;
  zoom: number;
  panX: number;
  panY: number;
}

export interface CameraConfig {
  enabled: boolean;
  keyframes: CameraKeyframe[];
}

export type BackgroundType = 'transparent' | 'white' | 'color';

export interface Project {
  id: string;
  name: string;
  width: number;
  height: number;
  fps: number;
  backgroundType: BackgroundType;
  backgroundColor: string;
  createdAt: number;
  updatedAt: number;
  layersMeta: LayerMeta[];
  frames: Frame[];
  audioTrack?: AudioTrack;
  camera?: CameraConfig;
  thumbnail?: string;
  onionSkin?: OnionSkinConfig;
  palettes?: Palette[];
  referenceImage?: ReferenceImage;
}

export interface OnionSkinConfig {
  enabled: boolean;
  prevFramesCount: number; // 1 - 5
  nextFramesCount: number; // 1 - 5
  opacity: number; // 0.1 - 0.9
  prevColor: string; // Red/orange tint
  nextColor: string; // Blue/cyan tint
}

export interface Palette {
  id: string;
  name: string;
  colors: string[];
}

export interface AppSettings {
  theme: 'dark' | 'light';
  palmRejection: boolean;
  pressureSensitivity: boolean;
  defaultBrushSize: number;
  defaultOpacity: number;
  defaultBrushOpacity?: number;
  defaultFps: number;
  deviceSimMode?: 'phone' | 'tablet' | 'fullscreen';
  orientation?: 'portrait' | 'landscape';
  autoSaveIntervalSec?: number;
}

export interface TransformState {
  isActive: boolean;
  elements: DrawingElement[];
  layerId: string;
  bounds: { x: number; y: number; width: number; height: number };
  originBounds: { x: number; y: number; width: number; height: number };
  translation: { x: number; y: number };
  scale: { x: number; y: number };
  rotation: number;
}

export interface LassoState {
  isActive: boolean;
  pathPoints: Point[];
  isClosed: boolean;
}

export interface ReferenceImage {
  id: string;
  dataUrl: string;
  x: number;
  y: number;
  scale: number;
  rotation?: number;
  opacity: number;
  isLocked: boolean;
  isVisible: boolean;
}

