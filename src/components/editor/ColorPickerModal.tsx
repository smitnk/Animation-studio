/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * FrameForge - Color Picker & Palette Modal
 */

import React, { useState } from 'react';
import { X, Plus, Trash2, Check, Palette as PaletteIcon, Sparkles } from 'lucide-react';
import { Palette } from '../../types';

interface ColorPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentColor: string;
  onSelectColor: (color: string) => void;
  recentColors: string[];
  palettes: Palette[];
  onSavePalette: (palettes: Palette[]) => void;
}

const QUICK_COLORS = [
  '#000000', '#FFFFFF', '#EF4444', '#F97316', '#FBBF24',
  '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899',
  '#78716C', '#334155', '#B91C1C', '#C2410C', '#047857',
  '#0E7490', '#1D4ED8', '#6D28D9', '#BE185D', '#44403C',
];

export const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
  isOpen,
  onClose,
  currentColor,
  onSelectColor,
  recentColors,
  palettes,
  onSavePalette,
}) => {
  const [selectedHex, setSelectedHex] = useState(currentColor);
  const [activePaletteIndex, setActivePaletteIndex] = useState(0);
  const [newPaletteName, setNewPaletteName] = useState('');
  const [showNewPaletteInput, setShowNewPaletteInput] = useState(false);

  if (!isOpen) return null;

  const currentPalette = palettes[activePaletteIndex] || palettes[0];

  const handleColorChange = (hex: string) => {
    setSelectedHex(hex);
    onSelectColor(hex);
  };

  const addColorToActivePalette = () => {
    if (!currentPalette || currentPalette.colors.includes(selectedHex)) return;
    const updated = palettes.map((p, idx) =>
      idx === activePaletteIndex ? { ...p, colors: [...p.colors, selectedHex] } : p
    );
    onSavePalette(updated);
  };

  const removeColorFromPalette = (colorToRemove: string) => {
    const updated = palettes.map((p, idx) =>
      idx === activePaletteIndex
        ? { ...p, colors: p.colors.filter((c) => c !== colorToRemove) }
        : p
    );
    onSavePalette(updated);
  };

  const createPalette = () => {
    if (!newPaletteName.trim()) return;
    const newPal: Palette = {
      id: `palette-${Date.now()}`,
      name: newPaletteName.trim(),
      colors: [selectedHex],
    };
    const updated = [...palettes, newPal];
    onSavePalette(updated);
    setActivePaletteIndex(updated.length - 1);
    setNewPaletteName('');
    setShowNewPaletteInput(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-sm bg-[#18181b] border border-white/10 sm:rounded-2xl rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden select-none">
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-[#141416]">
          <div className="flex items-center gap-2">
            <PaletteIcon className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-zinc-100">Color Palette & Studio</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Active Color Preview & Hex Input */}
          <div className="flex items-center gap-3 p-3 bg-[#121214] rounded-xl border border-white/5">
            <div
              className="w-12 h-12 rounded-xl border-2 border-white/20 shadow-inner flex-shrink-0"
              style={{ backgroundColor: selectedHex }}
            />
            <div className="flex-1 min-w-0">
              <label className="block text-[10px] uppercase font-semibold text-zinc-400 mb-1">
                Selected HEX
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={selectedHex}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-24 px-2 py-1 bg-[#18181b] border border-white/10 rounded-lg text-xs font-mono font-bold text-zinc-200 focus:outline-none focus:border-amber-500"
                />
                {/* Native color picker fallback trigger */}
                <input
                  type="color"
                  value={selectedHex}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-7 h-7 rounded-lg border-0 bg-transparent cursor-pointer p-0"
                  title="Open System Color Spectrum"
                />
              </div>
            </div>
          </div>

          {/* Quick Swatches Grid */}
          <div>
            <span className="block text-[10px] uppercase font-semibold text-zinc-400 mb-1.5">
              Classic Swatches
            </span>
            <div className="grid grid-cols-10 gap-1.5">
              {QUICK_COLORS.map((color) => {
                const isSelected = selectedHex.toLowerCase() === color.toLowerCase();
                return (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className={`w-7 h-7 rounded-lg border transition-all flex items-center justify-center ${
                      isSelected
                        ? 'border-amber-500 scale-110 shadow-md ring-1 ring-amber-500'
                        : 'border-white/10 hover:border-white/40'
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {isSelected && (
                      <Check
                        className={`w-3 h-3 ${
                          color === '#FFFFFF' || color === '#FBBF24' ? 'text-black' : 'text-white'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent Colors */}
          {recentColors.length > 0 && (
            <div>
              <span className="block text-[10px] uppercase font-semibold text-zinc-400 mb-1.5">
                Recent Colors
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {recentColors.map((color, idx) => (
                  <button
                    key={`${color}-${idx}`}
                    onClick={() => handleColorChange(color)}
                    className="w-7 h-7 rounded-lg border border-white/10 flex-shrink-0 transition-transform hover:scale-105"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Custom Palettes Section */}
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-semibold text-zinc-400">
                Custom Palettes
              </span>
              <button
                onClick={() => setShowNewPaletteInput(!showNewPaletteInput)}
                className="text-[11px] font-semibold text-amber-400 hover:text-amber-300"
              >
                + New Palette
              </button>
            </div>

            {/* New palette inline creation */}
            {showNewPaletteInput && (
              <div className="flex items-center gap-1.5 mb-2.5">
                <input
                  type="text"
                  placeholder="Palette Name..."
                  value={newPaletteName}
                  onChange={(e) => setNewPaletteName(e.target.value)}
                  className="flex-1 px-2.5 py-1 bg-[#121214] border border-white/10 rounded-lg text-xs text-zinc-200"
                />
                <button
                  onClick={createPalette}
                  className="px-2.5 py-1 bg-amber-500 text-black text-xs font-bold rounded-lg"
                >
                  Add
                </button>
              </div>
            )}

            {/* Palette Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1.5">
              {palettes.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => setActivePaletteIndex(idx)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    activePaletteIndex === idx
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {/* Active Palette Color Grid */}
            {currentPalette && (
              <div className="mt-2 p-2.5 bg-[#121214] rounded-xl border border-white/5 flex flex-wrap items-center gap-1.5">
                {currentPalette.colors.map((color, idx) => (
                  <div key={`${color}-${idx}`} className="relative group">
                    <button
                      onClick={() => handleColorChange(color)}
                      className="w-7 h-7 rounded-lg border border-white/10 hover:border-amber-400 transition-colors"
                      style={{ backgroundColor: color }}
                    />
                    <button
                      onClick={() => removeColorFromPalette(color)}
                      title="Remove Color"
                      className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}

                {/* Add Current Color to Palette Button */}
                <button
                  onClick={addColorToActivePalette}
                  title="Add selected color to this palette"
                  className="w-7 h-7 rounded-lg border border-dashed border-white/20 hover:border-amber-400 hover:text-amber-400 text-zinc-500 flex items-center justify-center transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 bg-[#141416] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-500 text-black font-bold text-xs rounded-xl shadow active:scale-95 transition-transform"
          >
            Apply Color
          </button>
        </div>
      </div>
    </div>
  );
};
