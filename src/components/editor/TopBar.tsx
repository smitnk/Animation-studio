/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * FrameForge - Editor Top Bar
 */

import React from 'react';
import {
  ChevronLeft,
  Undo2,
  Redo2,
  Share2,
  Play,
  Settings,
  CheckCircle2,
  RefreshCw,
  Camera,
  Layers,
} from 'lucide-react';

interface TopBarProps {
  projectName: string;
  canUndo: boolean;
  canRedo: boolean;
  isSaving: boolean;
  onBack: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onOpenExport: () => void;
  onOpenPreview: () => void;
  onOpenSettings: () => void;
  cameraEnabled: boolean;
  onToggleCamera: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  projectName,
  canUndo,
  canRedo,
  isSaving,
  onBack,
  onUndo,
  onRedo,
  onOpenExport,
  onOpenPreview,
  onOpenSettings,
  cameraEnabled,
  onToggleCamera,
}) => {
  return (
    <header className="h-11 w-full bg-[#18181b] border-b border-white/10 px-3 flex items-center justify-between flex-shrink-0 z-20 select-none">
      {/* Left Back & Title */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onBack}
          title="Back to Projects"
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-xs font-bold text-zinc-100 truncate max-w-[130px] sm:max-w-[200px]">
            {projectName}
          </h2>

          {/* Auto-save status badge */}
          <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400">
            {isSaving ? (
              <span className="flex items-center gap-1 text-amber-400">
                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                <span className="hidden sm:inline">Saving...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-400/80">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span className="hidden sm:inline">Saved</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Center History Operations */}
      <div className="flex items-center gap-1 bg-[#121214] border border-white/5 rounded-xl px-1 py-0.5 shadow-inner">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className={`p-1.5 rounded-lg transition-all ${
            canUndo
              ? 'text-zinc-200 hover:text-amber-400 hover:bg-white/10 active:scale-90'
              : 'text-zinc-600 cursor-not-allowed opacity-40'
          }`}
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className={`p-1.5 rounded-lg transition-all ${
            canRedo
              ? 'text-zinc-200 hover:text-amber-400 hover:bg-white/10 active:scale-90'
              : 'text-zinc-600 cursor-not-allowed opacity-40'
          }`}
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* Right Actions: Camera Framing, Preview, Export, Settings */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onToggleCamera}
          title={cameraEnabled ? 'Hide Camera Guide' : 'Show Camera Guide'}
          className={`p-1.5 rounded-lg border transition-all ${
            cameraEnabled
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              : 'text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-white/5'
          }`}
        >
          <Camera className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenPreview}
          title="Fullscreen Animation Preview"
          className="p-1.5 rounded-lg text-zinc-300 hover:text-amber-400 hover:bg-white/5 border border-white/5 transition-all active:scale-95"
        >
          <Play className="w-4 h-4 fill-current" />
        </button>

        <button
          onClick={onOpenExport}
          title="Export Animation (GIF, Video, PNG, Project)"
          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1 shadow-sm shadow-amber-500/20 active:scale-95 transition-all"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Export</span>
        </button>

        <button
          onClick={onOpenSettings}
          title="Project Settings"
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
