/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * FrameForge - Onion Skin Preferences Modal
 */

import React from 'react';
import { X, Sparkles, Check } from 'lucide-react';
import { OnionSkinConfig } from '../../types';

interface OnionSkinModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: OnionSkinConfig;
  onChangeConfig: (newConfig: OnionSkinConfig) => void;
}

const TINT_PRESETS_PREV = ['#EF4444', '#F97316', '#F59E0B', '#DC2626'];
const TINT_PRESETS_NEXT = ['#3B82F6', '#06B6D4', '#10B981', '#6366F1'];

export const OnionSkinModal: React.FC<OnionSkinModalProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4 select-none">
      <div className="w-full max-w-sm bg-[#18181b] border border-white/10 sm:rounded-2xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-[#141416]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-zinc-100">Onion Skin Preferences</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 space-y-4">
          {/* Master Enable / Disable Toggle */}
          <div className="flex items-center justify-between p-3 bg-[#121214] rounded-xl border border-white/5">
            <div>
              <span className="text-xs font-bold text-zinc-100">Onion Skin Ghosting</span>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Preview preceding and following frames
              </p>
            </div>
            <button
              onClick={() => onChangeConfig({ ...config, enabled: !config.enabled })}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                config.enabled ? 'bg-amber-500' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-black shadow-md transition-transform ${
                  config.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Previous Frames Count Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-zinc-300 font-medium">Previous Frames Count</span>
              <span className="font-mono text-red-400 font-bold">{config.prevFramesCount}</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              value={config.prevFramesCount}
              onChange={(e) =>
                onChangeConfig({ ...config, prevFramesCount: Number(e.target.value) })
              }
              className="w-full accent-red-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
            />
            {/* Color Tint Presets */}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] text-zinc-500 uppercase">Tint:</span>
              {TINT_PRESETS_PREV.map((c) => (
                <button
                  key={c}
                  onClick={() => onChangeConfig({ ...config, prevColor: c })}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                    config.prevColor === c ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {config.prevColor === c && <Check className="w-3 h-3 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Next Frames Count Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-zinc-300 font-medium">Next Frames Count</span>
              <span className="font-mono text-sky-400 font-bold">{config.nextFramesCount}</span>
            </div>
            <input
              type="range"
              min={0}
              max={5}
              value={config.nextFramesCount}
              onChange={(e) =>
                onChangeConfig({ ...config, nextFramesCount: Number(e.target.value) })
              }
              className="w-full accent-sky-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
            />
            {/* Color Tint Presets */}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] text-zinc-500 uppercase">Tint:</span>
              {TINT_PRESETS_NEXT.map((c) => (
                <button
                  key={c}
                  onClick={() => onChangeConfig({ ...config, nextColor: c })}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                    config.nextColor === c ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {config.nextColor === c && <Check className="w-3 h-3 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Ghosting Opacity Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-zinc-300 font-medium">Ghosting Transparency</span>
              <span className="font-mono text-amber-400 font-bold">
                {Math.round(config.opacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={90}
              value={Math.round(config.opacity * 100)}
              onChange={(e) =>
                onChangeConfig({ ...config, opacity: Number(e.target.value) / 100 })
              }
              className="w-full accent-amber-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 bg-[#141416] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-500 text-black font-bold text-xs rounded-xl shadow active:scale-95 transition-transform"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
