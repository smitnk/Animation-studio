/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * FrameForge - New Project Setup Modal
 */

import React, { useState } from 'react';
import { X, Plus, Sparkles, Sliders, Check, LayoutGrid } from 'lucide-react';
import { Project, BackgroundType } from '../../types';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (projectData: Partial<Project>) => void;
}

interface PresetOption {
  label: string;
  sub: string;
  width: number;
  height: number;
  aspect: string;
}

const CANVAS_PRESETS: PresetOption[] = [
  { label: 'Mobile Portrait', sub: 'TikTok / Shorts / Reels', width: 1080, height: 1920, aspect: '9:16' },
  { label: 'Full HD Landscape', sub: 'YouTube / Film / TV', width: 1920, height: 1080, aspect: '16:9' },
  { label: 'Square Canvas', sub: 'Instagram / Profile / Stickers', width: 1080, height: 1080, aspect: '1:1' },
  { label: 'HD 720p Landscape', sub: 'Lightweight / Fast rendering', width: 1280, height: 720, aspect: '16:9' },
  { label: 'HD 720p Portrait', sub: 'Mobile quick drafts', width: 720, height: 1280, aspect: '9:16' },
  { label: '2K High-Res Square', sub: 'Detailed illustration', width: 2048, height: 2048, aspect: '1:1' },
];

const FPS_PRESETS = [8, 12, 15, 24, 30];

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
}) => {
  const [name, setName] = useState('Untitled Animation');
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number | 'custom'>(0);
  const [customWidth, setCustomWidth] = useState(1080);
  const [customHeight, setCustomHeight] = useState(1920);
  const [fps, setFps] = useState(12);
  const [backgroundType, setBackgroundType] = useState<BackgroundType>('color');
  const [backgroundColor, setBackgroundColor] = useState('#18181b');

  if (!isOpen) return null;

  const handleCreate = () => {
    let width = 1080;
    let height = 1920;

    if (selectedPresetIndex === 'custom') {
      width = Math.min(2560, Math.max(200, customWidth));
      height = Math.min(2560, Math.max(200, customHeight));
    } else {
      const preset = CANVAS_PRESETS[selectedPresetIndex];
      width = preset.width;
      height = preset.height;
    }

    onCreateProject({
      name: name.trim() || 'Untitled Animation',
      width,
      height,
      fps,
      backgroundType,
      backgroundColor,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#18181b] border border-white/10 sm:rounded-2xl rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#141416]">
          <div>
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-500" />
              New Animation Project
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">Configure canvas dimensions & frame rate</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Project Title */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Character Walk Cycle"
              className="w-full px-3.5 py-2.5 bg-[#121214] border border-white/10 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-medium"
            />
          </div>

          {/* Canvas Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Canvas Format
              </label>
              <button
                type="button"
                onClick={() => setSelectedPresetIndex('custom')}
                className={`text-xs font-medium px-2 py-0.5 rounded transition-colors ${
                  selectedPresetIndex === 'custom'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                + Custom Size
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {CANVAS_PRESETS.map((preset, idx) => {
                const isSelected = selectedPresetIndex === idx;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setSelectedPresetIndex(idx)}
                    className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 shadow-sm'
                        : 'border-white/5 bg-[#121214] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-semibold text-zinc-200">{preset.label}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 font-mono">
                        {preset.aspect}
                      </span>
                    </div>
                    <div className="mt-2 text-[11px] font-mono text-zinc-400">
                      {preset.width} × {preset.height} px
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Inputs */}
            {selectedPresetIndex === 'custom' && (
              <div className="mt-3 p-3 bg-[#121214] border border-amber-500/30 rounded-xl grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Width (px)</label>
                  <input
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(Number(e.target.value))}
                    min={200}
                    max={2560}
                    className="w-full px-2.5 py-1.5 bg-[#18181b] border border-white/10 rounded-lg text-sm font-mono text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Height (px)</label>
                  <input
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(Number(e.target.value))}
                    min={200}
                    max={2560}
                    className="w-full px-2.5 py-1.5 bg-[#18181b] border border-white/10 rounded-lg text-sm font-mono text-zinc-200"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Frame Rate (FPS) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Frame Rate (Speed)
              </label>
              <span className="text-xs font-mono text-amber-400 font-semibold">{fps} FPS</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {FPS_PRESETS.map((rate) => {
                const active = fps === rate;
                return (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setFps(rate)}
                    className={`py-2 rounded-xl text-xs font-medium font-mono border transition-all ${
                      active
                        ? 'bg-amber-500 text-black border-amber-500 font-bold shadow'
                        : 'bg-[#121214] text-zinc-300 border-white/5 hover:border-white/20'
                    }`}
                  >
                    {rate}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1.5">
              {fps === 12 && '12 FPS is standard for classic 2D animation on 2s.'}
              {fps === 24 && '24 FPS produces cinematic, fluid broadcast animation.'}
              {fps === 8 && '8 FPS creates stylistic, snappy low-frame anime rhythms.'}
            </p>
          </div>

          {/* Canvas Background */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Canvas Background
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setBackgroundType('color');
                  setBackgroundColor('#18181b');
                }}
                className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                  backgroundType === 'color' && backgroundColor === '#18181b'
                    ? 'border-amber-500 bg-amber-500/10 text-white'
                    : 'border-white/5 bg-[#121214] text-zinc-400'
                }`}
              >
                <div className="w-5 h-5 rounded-md bg-[#18181b] border border-zinc-700" />
                <span className="text-xs font-medium">Dark Studio</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBackgroundType('white');
                  setBackgroundColor('#FFFFFF');
                }}
                className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                  backgroundType === 'white'
                    ? 'border-amber-500 bg-amber-500/10 text-white'
                    : 'border-white/5 bg-[#121214] text-zinc-400'
                }`}
              >
                <div className="w-5 h-5 rounded-md bg-white border border-zinc-300" />
                <span className="text-xs font-medium">Clean White</span>
              </button>

              <button
                type="button"
                onClick={() => setBackgroundType('transparent')}
                className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                  backgroundType === 'transparent'
                    ? 'border-amber-500 bg-amber-500/10 text-white'
                    : 'border-white/5 bg-[#121214] text-zinc-400'
                }`}
              >
                <div className="w-5 h-5 rounded-md checkerboard-bg border border-zinc-700" />
                <span className="text-xs font-medium">Transparent</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-white/10 bg-[#141416] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
};
