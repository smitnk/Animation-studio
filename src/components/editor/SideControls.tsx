/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * FrameForge - Right Side Controls
 */

import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  Image as ImageIcon,
  Music,
  ZoomIn,
  ZoomOut,
  Maximize,
  Eye,
  Sliders,
  Palette,
} from 'lucide-react';
import { OnionSkinConfig } from '../../types';

interface SideControlsProps {
  brushSize: number;
  onChangeBrushSize: (size: number) => void;
  brushOpacity: number;
  onChangeBrushOpacity: (opacity: number) => void;
  currentColor: string;
  onOpenColorPicker: () => void;
  onOpenLayers: () => void;
  activeLayerName: string;
  layersCount: number;
  onionSkin: OnionSkinConfig;
  onToggleOnionSkin: () => void;
  onOpenOnionSkinConfig: () => void;
  onOpenReferenceImage: () => void;
  hasReferenceImage: boolean;
  onOpenAudio: () => void;
  hasAudioTrack: boolean;
  zoom: number;
  onResetZoom: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export const SideControls: React.FC<SideControlsProps> = ({
  brushSize,
  onChangeBrushSize,
  brushOpacity,
  onChangeBrushOpacity,
  currentColor,
  onOpenColorPicker,
  onOpenLayers,
  activeLayerName,
  layersCount,
  onionSkin,
  onToggleOnionSkin,
  onOpenOnionSkinConfig,
  onOpenReferenceImage,
  hasReferenceImage,
  onOpenAudio,
  hasAudioTrack,
  zoom,
  onResetZoom,
  onZoomIn,
  onZoomOut,
}) => {
  const [showSizeSlider, setShowSizeSlider] = useState(false);
  const [showOpacitySlider, setShowOpacitySlider] = useState(false);

  return (
    <div className="w-12 bg-[#18181b] border-l border-white/10 flex flex-col items-center py-2 gap-2 flex-shrink-0 z-20 select-none relative">
      {/* 1. Color Chip */}
      <div className="relative">
        <button
          onClick={onOpenColorPicker}
          title="Color Palette (C)"
          className="w-8 h-8 rounded-full border-2 border-white/20 shadow-md flex items-center justify-center transition-transform active:scale-90 hover:scale-105"
          style={{ backgroundColor: currentColor }}
        >
          {/* Subtle inner ring */}
          <div className="w-3 h-3 rounded-full border border-black/30" />
        </button>
      </div>

      {/* 2. Brush Size Controller */}
      <div className="relative flex flex-col items-center">
        <button
          onClick={() => setShowSizeSlider(!showSizeSlider)}
          title={`Brush Size: ${brushSize}px`}
          className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center transition-all ${
            showSizeSlider ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {/* Visual brush size dot */}
          <div
            className="rounded-full bg-current"
            style={{
              width: Math.max(3, Math.min(18, brushSize / 4)),
              height: Math.max(3, Math.min(18, brushSize / 4)),
            }}
          />
          <span className="text-[9px] font-mono mt-0.5">{brushSize}</span>
        </button>

        {showSizeSlider && (
          <div className="absolute right-12 top-0 z-40 bg-[#1f1f24] border border-white/10 rounded-2xl p-3 shadow-2xl flex flex-col items-center gap-2 w-44">
            <div className="flex items-center justify-between w-full text-xs text-zinc-300">
              <span className="font-semibold text-zinc-400">Brush Size</span>
              <span className="font-mono text-amber-400 font-bold">{brushSize}px</span>
            </div>
            {/* Visual Dot Preview */}
            <div className="w-16 h-16 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden">
              <div
                className="rounded-full bg-amber-400"
                style={{
                  width: Math.min(56, Math.max(2, brushSize)),
                  height: Math.min(56, Math.max(2, brushSize)),
                }}
              />
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={brushSize}
              onChange={(e) => onChangeBrushSize(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-2 bg-zinc-800 rounded-lg"
            />
          </div>
        )}
      </div>

      {/* 3. Opacity Controller */}
      <div className="relative flex flex-col items-center">
        <button
          onClick={() => setShowOpacitySlider(!showOpacitySlider)}
          title={`Opacity: ${Math.round(brushOpacity * 100)}%`}
          className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center transition-all ${
            showOpacitySlider ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <div className="w-4 h-4 rounded-md border border-current flex items-center justify-center p-0.5">
            <div
              className="w-full h-full bg-current rounded-xs"
              style={{ opacity: brushOpacity }}
            />
          </div>
          <span className="text-[9px] font-mono mt-0.5">{Math.round(brushOpacity * 100)}%</span>
        </button>

        {showOpacitySlider && (
          <div className="absolute right-12 top-0 z-40 bg-[#1f1f24] border border-white/10 rounded-2xl p-3 shadow-2xl flex flex-col items-center gap-2 w-44">
            <div className="flex items-center justify-between w-full text-xs text-zinc-300">
              <span className="font-semibold text-zinc-400">Opacity</span>
              <span className="font-mono text-amber-400 font-bold">{Math.round(brushOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min={5}
              max={100}
              value={Math.round(brushOpacity * 100)}
              onChange={(e) => onChangeBrushOpacity(Number(e.target.value) / 100)}
              className="w-full accent-amber-500 cursor-pointer h-2 bg-zinc-800 rounded-lg"
            />
          </div>
        )}
      </div>

      <div className="w-6 h-[1px] bg-white/10 my-0.5" />

      {/* 4. Layers Panel Button */}
      <button
        onClick={onOpenLayers}
        title={`Layers (${layersCount}) - Active: ${activeLayerName}`}
        className="w-9 h-9 rounded-xl flex flex-col items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-all relative"
      >
        <Layers className="w-4 h-4" />
        <span className="text-[9px] font-mono text-amber-400 font-semibold">{layersCount}</span>
      </button>

      {/* 5. Onion Skin Button */}
      <div className="relative">
        <button
          onClick={onToggleOnionSkin}
          onContextMenu={(e) => {
            e.preventDefault();
            onOpenOnionSkinConfig();
          }}
          title={`Onion Skin: ${onionSkin.enabled ? 'ON' : 'OFF'} (Right-click or hold for settings)`}
          className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center transition-all ${
            onionSkin.enabled
              ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[8px] font-mono tracking-tighter uppercase">
            {onionSkin.enabled ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>

      {/* 6. Reference Image */}
      <button
        onClick={onOpenReferenceImage}
        title={hasReferenceImage ? 'Reference Image Active' : 'Add Reference Image'}
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
          hasReferenceImage
            ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
        }`}
      >
        <ImageIcon className="w-4 h-4" />
      </button>

      {/* 7. Audio Track */}
      <button
        onClick={onOpenAudio}
        title={hasAudioTrack ? 'Audio Track Attached' : 'Add Audio Track'}
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
          hasAudioTrack
            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
        }`}
      >
        <Music className="w-4 h-4" />
      </button>

      {/* Spacer to push Zoom controls to bottom */}
      <div className="flex-1" />

      {/* 8. Zoom Controls */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={onResetZoom}
          title="Fit to Screen"
          className="w-8 h-8 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-white/5 flex items-center justify-center transition-colors"
        >
          <Maximize className="w-3.5 h-3.5" />
        </button>
        <span className="text-[9px] font-mono text-zinc-500">{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
};
