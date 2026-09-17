/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * FrameForge - Left Tools Palette
 */

import React, { useState } from 'react';
import {
  Pencil,
  Paintbrush,
  Eraser,
  PaintBucket,
  Pipette,
  Maximize2,
  Spline,
  Square,
  Circle,
  Minus,
  Highlighter,
  Wind,
  Feather,
  Lasso,
  Move,
} from 'lucide-react';
import { ToolType, BrushType } from '../../types';

interface ToolBarProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  activeBrush: BrushType;
  onSelectBrush: (brush: BrushType) => void;
  activeShape: 'line' | 'rectangle' | 'ellipse';
  onSelectShape: (shape: 'line' | 'rectangle' | 'ellipse') => void;
}

export const ToolBar: React.FC<ToolBarProps> = ({
  activeTool,
  onSelectTool,
  activeBrush,
  onSelectBrush,
  activeShape,
  onSelectShape,
}) => {
  const [brushMenuOpen, setBrushMenuOpen] = useState(false);
  const [shapeMenuOpen, setShapeMenuOpen] = useState(false);

  const isBrushActive = ['pencil', 'brush', 'marker', 'airbrush', 'ink'].includes(activeTool);
  const isShapeActive = ['line', 'rectangle', 'ellipse'].includes(activeTool);

  const getBrushIcon = () => {
    switch (activeBrush) {
      case 'pencil':
        return <Pencil className="w-4 h-4" />;
      case 'marker':
        return <Highlighter className="w-4 h-4" />;
      case 'airbrush':
        return <Wind className="w-4 h-4" />;
      case 'ink':
        return <Feather className="w-4 h-4" />;
      default:
        return <Paintbrush className="w-4 h-4" />;
    }
  };

  const getShapeIcon = () => {
    switch (activeShape) {
      case 'rectangle':
        return <Square className="w-4 h-4" />;
      case 'ellipse':
        return <Circle className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-12 bg-[#18181b] border-r border-white/10 flex flex-col items-center py-2 gap-1.5 flex-shrink-0 z-20 select-none relative">
      {/* 1. Brush / Pencil Group with Dropdown */}
      <div className="relative">
        <button
          onClick={() => {
            if (isBrushActive) {
              setBrushMenuOpen(!brushMenuOpen);
            } else {
              onSelectTool(activeBrush);
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setBrushMenuOpen(true);
          }}
          title="Brushes (Tap to select, tap again for brush menu)"
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all relative ${
            isBrushActive
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-bold'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {getBrushIcon()}
          {/* Sub-menu indicator dot */}
          <span className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-current opacity-70" />
        </button>

        {/* Brush Type Sub-palette */}
        {brushMenuOpen && (
          <div className="absolute left-11 top-0 z-40 bg-[#1f1f24] border border-white/10 rounded-2xl p-1.5 shadow-2xl flex flex-col gap-1 w-36">
            <span className="text-[10px] font-semibold text-zinc-400 px-2 py-0.5 uppercase tracking-wider">
              Brush Style
            </span>
            <button
              onClick={() => {
                onSelectBrush('pencil');
                onSelectTool('pencil');
                setBrushMenuOpen(false);
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-2 text-left transition-colors ${
                activeBrush === 'pencil' ? 'bg-amber-500 text-black font-semibold' : 'text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Pencil</span>
            </button>
            <button
              onClick={() => {
                onSelectBrush('brush');
                onSelectTool('brush');
                setBrushMenuOpen(false);
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-2 text-left transition-colors ${
                activeBrush === 'brush' ? 'bg-amber-500 text-black font-semibold' : 'text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Paintbrush className="w-3.5 h-3.5" />
              <span>Smooth Brush</span>
            </button>
            <button
              onClick={() => {
                onSelectBrush('marker');
                onSelectTool('marker');
                setBrushMenuOpen(false);
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-2 text-left transition-colors ${
                activeBrush === 'marker' ? 'bg-amber-500 text-black font-semibold' : 'text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Highlighter className="w-3.5 h-3.5" />
              <span>Marker</span>
            </button>
            <button
              onClick={() => {
                onSelectBrush('airbrush');
                onSelectTool('airbrush');
                setBrushMenuOpen(false);
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-2 text-left transition-colors ${
                activeBrush === 'airbrush' ? 'bg-amber-500 text-black font-semibold' : 'text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Wind className="w-3.5 h-3.5" />
              <span>Airbrush</span>
            </button>
            <button
              onClick={() => {
                onSelectBrush('ink');
                onSelectTool('ink');
                setBrushMenuOpen(false);
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-2 text-left transition-colors ${
                activeBrush === 'ink' ? 'bg-amber-500 text-black font-semibold' : 'text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Feather className="w-3.5 h-3.5" />
              <span>Calligraphy Ink</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Eraser */}
      <button
        onClick={() => {
          setBrushMenuOpen(false);
          setShapeMenuOpen(false);
          onSelectTool('eraser');
        }}
        title="Eraser (E)"
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
          activeTool === 'eraser'
            ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-bold'
            : 'text-zinc-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <Eraser className="w-4 h-4" />
      </button>

      {/* 3. Shapes Group with Dropdown */}
      <div className="relative">
        <button
          onClick={() => {
            if (isShapeActive) {
              setShapeMenuOpen(!shapeMenuOpen);
            } else {
              onSelectTool(activeShape);
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setShapeMenuOpen(true);
          }}
          title="Shapes (Line, Rectangle, Ellipse)"
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all relative ${
            isShapeActive
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-bold'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {getShapeIcon()}
          <span className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-current opacity-70" />
        </button>

        {shapeMenuOpen && (
          <div className="absolute left-11 top-0 z-40 bg-[#1f1f24] border border-white/10 rounded-2xl p-1.5 shadow-2xl flex flex-col gap-1 w-32">
            <span className="text-[10px] font-semibold text-zinc-400 px-2 py-0.5 uppercase tracking-wider">
              Shape Tool
            </span>
            <button
              onClick={() => {
                onSelectShape('line');
                onSelectTool('line');
                setShapeMenuOpen(false);
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-2 text-left transition-colors ${
                activeShape === 'line' && activeTool === 'line'
                  ? 'bg-amber-500 text-black font-semibold'
                  : 'text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Minus className="w-3.5 h-3.5" />
              <span>Line</span>
            </button>
            <button
              onClick={() => {
                onSelectShape('rectangle');
                onSelectTool('rectangle');
                setShapeMenuOpen(false);
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-2 text-left transition-colors ${
                activeShape === 'rectangle' && activeTool === 'rectangle'
                  ? 'bg-amber-500 text-black font-semibold'
                  : 'text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Square className="w-3.5 h-3.5" />
              <span>Rectangle</span>
            </button>
            <button
              onClick={() => {
                onSelectShape('ellipse');
                onSelectTool('ellipse');
                setShapeMenuOpen(false);
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-2 text-left transition-colors ${
                activeShape === 'ellipse' && activeTool === 'ellipse'
                  ? 'bg-amber-500 text-black font-semibold'
                  : 'text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Circle className="w-3.5 h-3.5" />
              <span>Circle / Ellipse</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. Bucket Fill */}
      <button
        onClick={() => {
          setBrushMenuOpen(false);
          setShapeMenuOpen(false);
          onSelectTool('fill');
        }}
        title="Bucket Fill (G)"
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
          activeTool === 'fill'
            ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-bold'
            : 'text-zinc-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <PaintBucket className="w-4 h-4" />
      </button>

      {/* 5. Eyedropper */}
      <button
        onClick={() => {
          setBrushMenuOpen(false);
          setShapeMenuOpen(false);
          onSelectTool('eyedropper');
        }}
        title="Eyedropper (I)"
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
          activeTool === 'eyedropper'
            ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-bold'
            : 'text-zinc-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <Pipette className="w-4 h-4" />
      </button>

      {/* 6. Lasso Selection */}
      <button
        onClick={() => {
          setBrushMenuOpen(false);
          setShapeMenuOpen(false);
          onSelectTool('lasso');
        }}
        title="Lasso Selection (L)"
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
          activeTool === 'lasso'
            ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-bold'
            : 'text-zinc-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <Lasso className="w-4 h-4" />
      </button>

      {/* 7. Transform Tool */}
      <button
        onClick={() => {
          setBrushMenuOpen(false);
          setShapeMenuOpen(false);
          onSelectTool('transform');
        }}
        title="Transform (Move / Scale / Rotate)"
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
          activeTool === 'transform'
            ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-bold'
            : 'text-zinc-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <Move className="w-4 h-4" />
      </button>
    </div>
  );
};
