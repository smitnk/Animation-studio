/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * FrameForge - Layers Management Modal
 */

import React, { useState } from 'react';
import {
  X,
  Plus,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  Layers as LayersIcon,
  Edit2,
  Check,
} from 'lucide-react';
import { LayerMeta, Frame } from '../../types';

interface LayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  layersMeta: LayerMeta[];
  activeLayerId: string;
  onSelectLayer: (layerId: string) => void;
  onAddLayer: () => void;
  onDeleteLayer: (layerId: string) => void;
  onDuplicateLayer: (layerId: string) => void;
  onToggleVisibility: (layerId: string) => void;
  onToggleLock: (layerId: string) => void;
  onChangeOpacity: (layerId: string, opacity: number) => void;
  onRenameLayer: (layerId: string, newName: string) => void;
  onReorderLayer: (layerId: string, direction: 'up' | 'down') => void;
  activeFrame: Frame;
}

export const LayersModal: React.FC<LayersModalProps> = ({
  isOpen,
  onClose,
  layersMeta,
  activeLayerId,
  onSelectLayer,
  onAddLayer,
  onDeleteLayer,
  onDuplicateLayer,
  onToggleVisibility,
  onToggleLock,
  onChangeOpacity,
  onRenameLayer,
  onReorderLayer,
  activeFrame,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  if (!isOpen) return null;

  const startRename = (layer: LayerMeta) => {
    setEditingId(layer.id);
    setEditName(layer.name);
  };

  const saveRename = (layerId: string) => {
    if (editName.trim()) {
      onRenameLayer(layerId, editName.trim());
    }
    setEditingId(null);
  };

  // Layers are rendered in visual stack order: top-most layer first in the UI
  const reversedLayers = [...layersMeta].reverse();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4 select-none">
      <div className="w-full max-w-md bg-[#18181b] border border-white/10 sm:rounded-2xl rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-[#141416]">
          <div className="flex items-center gap-2">
            <LayersIcon className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-zinc-100">Layer Studio</h3>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-zinc-400">
              {layersMeta.length} Layers
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onAddLayer}
              title="Add New Layer"
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-black border border-amber-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Layer</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Layers Stack List */}
        <div className="p-3 space-y-2 overflow-y-auto flex-1">
          {reversedLayers.map((layer, reverseIdx) => {
            const actualIdx = layersMeta.length - 1 - reverseIdx;
            const isActive = layer.id === activeLayerId;
            const elementCount = activeFrame.layers[layer.id]?.elements?.length || 0;
            const isEditing = editingId === layer.id;

            return (
              <div
                key={layer.id}
                onClick={() => onSelectLayer(layer.id)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? 'border-amber-500 bg-amber-500/10 shadow-sm'
                    : 'border-white/5 bg-[#121214] hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  {/* Left: Name and Element Count */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* Layer selection badge */}
                    <div
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        isActive ? 'bg-amber-500 ring-2 ring-amber-500/30' : 'bg-zinc-700'
                      }`}
                    />

                    {isEditing ? (
                      <div className="flex items-center gap-1 flex-1">
                        <input
                          autoFocus
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveRename(layer.id)}
                          className="px-2 py-0.5 bg-black border border-amber-500 text-xs text-white rounded w-full"
                        />
                        <button
                          onClick={() => saveRename(layer.id)}
                          className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-xs font-semibold text-zinc-100 truncate">
                          {layer.name}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          ({elementCount} {elementCount === 1 ? 'stroke' : 'strokes'})
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startRename(layer);
                          }}
                          className="text-zinc-500 hover:text-zinc-300 p-0.5"
                          title="Rename Layer"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right Actions: Up, Down, Visibility, Lock, Duplicate, Delete */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {/* Reorder Up (visually towards top of stack) */}
                    <button
                      onClick={() => onReorderLayer(layer.id, 'up')}
                      disabled={actualIdx === layersMeta.length - 1}
                      title="Move Layer Up"
                      className="p-1 text-zinc-400 hover:text-white disabled:opacity-20"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    {/* Reorder Down */}
                    <button
                      onClick={() => onReorderLayer(layer.id, 'down')}
                      disabled={actualIdx === 0}
                      title="Move Layer Down"
                      className="p-1 text-zinc-400 hover:text-white disabled:opacity-20"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Visibility */}
                    <button
                      onClick={() => onToggleVisibility(layer.id)}
                      title={layer.isVisible ? 'Hide Layer' : 'Show Layer'}
                      className={`p-1 rounded ${
                        layer.isVisible ? 'text-zinc-300 hover:text-white' : 'text-zinc-600'
                      }`}
                    >
                      {layer.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>

                    {/* Lock */}
                    <button
                      onClick={() => onToggleLock(layer.id)}
                      title={layer.isLocked ? 'Unlock Layer' : 'Lock Layer'}
                      className={`p-1 rounded ${
                        layer.isLocked ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {layer.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>

                    {/* Duplicate */}
                    <button
                      onClick={() => onDuplicateLayer(layer.id)}
                      title="Duplicate Layer"
                      className="p-1 text-zinc-400 hover:text-sky-400 rounded"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => onDeleteLayer(layer.id)}
                      disabled={layersMeta.length <= 1}
                      title="Delete Layer"
                      className="p-1 text-zinc-500 hover:text-red-400 disabled:opacity-20 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Layer Opacity Slider */}
                <div
                  className="mt-2 pt-2 border-t border-white/5 flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-[10px] text-zinc-400 uppercase font-mono">Opacity</span>
                  <input
                    type="range"
                    min={5}
                    max={100}
                    value={Math.round(layer.opacity * 100)}
                    onChange={(e) => onChangeOpacity(layer.id, Number(e.target.value) / 100)}
                    className="flex-1 accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-zinc-300 w-8 text-right">
                    {Math.round(layer.opacity * 100)}%
                  </span>
                </div>
              </div>
            );
          })}
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
