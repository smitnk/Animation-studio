/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * FrameForge - Reference Image Modal
 */

import React from 'react';
import {
  X,
  Image as ImageIcon,
  Upload,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Sliders,
} from 'lucide-react';
import { ReferenceImage } from '../../types';

interface ReferenceImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  referenceImage: ReferenceImage | null;
  onSetReferenceImage: (img: ReferenceImage | null) => void;
}

export const ReferenceImageModal: React.FC<ReferenceImageModalProps> = ({
  isOpen,
  onClose,
  referenceImage,
  onSetReferenceImage,
}) => {
  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onSetReferenceImage({
        id: `ref-${Date.now()}`,
        dataUrl,
        x: 40,
        y: 40,
        scale: 0.8,
        rotation: 0,
        opacity: 0.5,
        isVisible: true,
        isLocked: false,
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4 select-none">
      <div className="w-full max-w-sm bg-[#18181b] border border-white/10 sm:rounded-2xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-[#141416]">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold text-zinc-100">Reference Image</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {referenceImage ? (
            /* Active Image Settings */
            <div className="p-3 bg-[#121214] rounded-2xl border border-white/5 space-y-3">
              {/* Preview Thumbnail */}
              <div className="h-28 bg-black/40 rounded-xl overflow-hidden flex items-center justify-center border border-white/5">
                <img
                  src={referenceImage.dataUrl}
                  alt="Reference thumbnail"
                  className="max-h-full max-w-full object-contain"
                  style={{ opacity: referenceImage.opacity }}
                />
              </div>

              {/* Visibility and Lock */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      onSetReferenceImage({
                        ...referenceImage,
                        isVisible: !referenceImage.isVisible,
                      })
                    }
                    className={`p-2 rounded-xl border transition-colors ${
                      referenceImage.isVisible
                        ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                        : 'bg-zinc-800/40 text-zinc-500 border-white/5'
                    }`}
                  >
                    {referenceImage.isVisible ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() =>
                      onSetReferenceImage({
                        ...referenceImage,
                        isLocked: !referenceImage.isLocked,
                      })
                    }
                    className={`p-2 rounded-xl border transition-colors ${
                      referenceImage.isLocked
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-zinc-800/40 text-zinc-500 border-white/5'
                    }`}
                  >
                    {referenceImage.isLocked ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <Unlock className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <button
                  onClick={() => onSetReferenceImage(null)}
                  className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                  title="Remove Image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Opacity Slider */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-zinc-400">Opacity</span>
                  <span className="font-mono text-sky-400 font-bold">
                    {Math.round(referenceImage.opacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={Math.round(referenceImage.opacity * 100)}
                  onChange={(e) =>
                    onSetReferenceImage({
                      ...referenceImage,
                      opacity: Number(e.target.value) / 100,
                    })
                  }
                  className="w-full accent-sky-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Scale Slider */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-zinc-400">Scale</span>
                  <span className="font-mono text-sky-400 font-bold">
                    {Math.round(referenceImage.scale * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={200}
                  value={Math.round(referenceImage.scale * 100)}
                  onChange={(e) =>
                    onSetReferenceImage({
                      ...referenceImage,
                      scale: Number(e.target.value) / 100,
                    })
                  }
                  className="w-full accent-sky-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          ) : (
            /* Upload File */
            <label className="border-2 border-dashed border-white/10 hover:border-sky-500/50 hover:bg-sky-500/5 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center">
              <div className="w-10 h-10 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-200 block">
                  Upload Reference Photo
                </span>
                <span className="text-[10px] text-zinc-500">Supports PNG, JPG, WebP</span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 bg-[#141416] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-sky-500 text-black font-bold text-xs rounded-xl shadow active:scale-95 transition-transform"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
