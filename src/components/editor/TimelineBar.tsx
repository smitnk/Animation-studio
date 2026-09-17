/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * FrameForge - Professional Animation Timeline & Playback Bar
 */

import React, { useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Plus,
  Copy,
  Trash2,
  Repeat,
  Layers,
  Clock,
  Sparkles,
  Clipboard,
  Eraser,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Project, Frame } from '../../types';

interface TimelineBarProps {
  project: Project;
  currentFrameIndex: number;
  onSelectFrame: (index: number) => void;
  onAddFrame: () => void;
  onDuplicateFrame: () => void;
  onDeleteFrame: () => void;
  onCopyFrame: () => void;
  onPasteFrame: () => void;
  onClearFrame: () => void;
  onMoveFrameLeft: () => void;
  onMoveFrameRight: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  isLooping: boolean;
  onToggleLoop: () => void;
  hasCopiedFrame: boolean;
  onToggleAudioMute?: () => void;
}

export const TimelineBar: React.FC<TimelineBarProps> = ({
  project,
  currentFrameIndex,
  onSelectFrame,
  onAddFrame,
  onDuplicateFrame,
  onDeleteFrame,
  onCopyFrame,
  onPasteFrame,
  onClearFrame,
  onMoveFrameLeft,
  onMoveFrameRight,
  isPlaying,
  onTogglePlay,
  isLooping,
  onToggleLoop,
  hasCopiedFrame,
  onToggleAudioMute,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeFrameRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll active frame thumbnail into view during playback
  useEffect(() => {
    if (activeFrameRef.current) {
      activeFrameRef.current.scrollIntoView({
        behavior: isPlaying ? 'auto' : 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [currentFrameIndex, isPlaying]);

  const frames = project.frames;
  const audio = project.audioTrack;

  return (
    <div className="w-full bg-[#18181b] border-t border-white/10 flex flex-col flex-shrink-0 z-20 select-none">
      {/* 1. Playback & Timeline Controls Strip */}
      <div className="h-10 px-3 flex items-center justify-between border-b border-white/5 bg-[#141416] text-xs">
        {/* Left: Frame Navigation & Playhead */}
        <div className="flex items-center gap-1">
          {/* First Frame */}
          <button
            onClick={() => onSelectFrame(0)}
            title="First Frame (|◀)"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          {/* Prev Frame */}
          <button
            onClick={() => onSelectFrame(Math.max(0, currentFrameIndex - 1))}
            title="Previous Frame (◀)"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Play / Pause Primary Button */}
          <button
            onClick={onTogglePlay}
            title={isPlaying ? 'Pause (Space)' : 'Play Animation (Space)'}
            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold transition-all active:scale-95 ${
              isPlaying
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-white/10 hover:bg-amber-500 hover:text-black text-white'
            }`}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
            )}
          </button>

          {/* Next Frame */}
          <button
            onClick={() => onSelectFrame(Math.min(frames.length - 1, currentFrameIndex + 1))}
            title="Next Frame (▶)"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last Frame */}
          <button
            onClick={() => onSelectFrame(frames.length - 1)}
            title="Last Frame (▶|)"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Loop toggle */}
          <button
            onClick={onToggleLoop}
            title={isLooping ? 'Loop Enabled' : 'Loop Disabled'}
            className={`p-1.5 rounded-lg transition-colors ml-1 ${
              isLooping ? 'text-amber-400 bg-amber-500/10' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center: Frame Count & FPS Info */}
        <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400 bg-[#121214] px-2.5 py-1 rounded-lg border border-white/5">
          <span className="text-zinc-100 font-bold">
            {String(currentFrameIndex + 1).padStart(2, '0')}
          </span>
          <span className="text-zinc-600">/</span>
          <span>{String(frames.length).padStart(2, '0')}</span>
          <span className="text-zinc-600">|</span>
          <span className="text-amber-400 font-medium">{project.fps} FPS</span>
        </div>

        {/* Right: Frame Operations (Add, Duplicate, Delete, Copy/Paste) */}
        <div className="flex items-center gap-1">
          {/* Reorder Left */}
          <button
            onClick={onMoveFrameLeft}
            disabled={currentFrameIndex === 0}
            title="Move Frame Left"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>

          {/* Reorder Right */}
          <button
            onClick={onMoveFrameRight}
            disabled={currentFrameIndex === frames.length - 1}
            title="Move Frame Right"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-3 h-3" />
          </button>

          <div className="w-[1px] h-4 bg-white/10 mx-0.5" />

          {/* Copy Frame */}
          <button
            onClick={onCopyFrame}
            title="Copy Frame"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Paste Frame */}
          <button
            onClick={onPasteFrame}
            disabled={!hasCopiedFrame}
            title="Paste Frame"
            className={`p-1.5 rounded-lg transition-colors ${
              hasCopiedFrame
                ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
                : 'text-zinc-600 opacity-40 cursor-not-allowed'
            }`}
          >
            <Clipboard className="w-3.5 h-3.5" />
          </button>

          {/* Duplicate Frame */}
          <button
            onClick={onDuplicateFrame}
            title="Duplicate Frame"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-sky-400" />
          </button>

          {/* Delete Frame */}
          <button
            onClick={onDeleteFrame}
            disabled={frames.length <= 1}
            title="Delete Frame"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Clear Frame */}
          <button
            onClick={onClearFrame}
            title="Clear Frame Artwork"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-white/5 transition-colors"
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>

          {/* Add Frame Primary Button */}
          <button
            onClick={onAddFrame}
            title="Add Blank Frame (+ Frame)"
            className="ml-1 px-2 py-1 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-black border border-amber-500/30 text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Frame</span>
          </button>
        </div>
      </div>

      {/* 2. Optional Audio Waveform Track */}
      {audio && (
        <div className="h-6 px-3 bg-[#101012] border-b border-white/5 flex items-center gap-2">
          <button
            onClick={onToggleAudioMute}
            title={audio.isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="text-zinc-400 hover:text-white"
          >
            {audio.isMuted ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3 text-purple-400" />}
          </button>
          <span className="text-[10px] text-zinc-400 font-mono truncate max-w-[80px]">
            {audio.name}
          </span>
          {/* Mini Waveform visualization */}
          <div className="flex-1 h-3 flex items-center gap-[2px] overflow-hidden opacity-60">
            {(audio.waveform || []).slice(0, 60).map((peak, idx) => (
              <div
                key={idx}
                className="w-1 bg-purple-400 rounded-full"
                style={{ height: `${Math.max(20, peak * 100)}%` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* 3. Horizontal Frame Thumbnails Scroller */}
      <div
        ref={scrollContainerRef}
        className="h-20 px-3 py-2 flex items-center gap-2 overflow-x-auto overflow-y-hidden"
      >
        {frames.map((frame, index) => {
          const isActive = index === currentFrameIndex;

          return (
            <button
              key={frame.id}
              ref={isActive ? activeFrameRef : null}
              onClick={() => onSelectFrame(index)}
              className={`group relative h-16 w-24 rounded-xl border-2 flex-shrink-0 flex flex-col justify-between p-1 transition-all overflow-hidden cursor-pointer ${
                isActive
                  ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/20 scale-[1.03]'
                  : 'border-white/10 bg-[#121214] hover:border-white/20'
              }`}
            >
              {/* Frame Number Badge */}
              <div className="flex items-center justify-between z-10 w-full">
                <span
                  className={`text-[9px] font-mono px-1 py-0.2 rounded font-bold ${
                    isActive ? 'bg-amber-500 text-black' : 'bg-black/70 text-zinc-300'
                  }`}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>

                {/* Hold multiplier indicator if > 1 */}
                {(frame.durationMultiplier || 1) > 1 && (
                  <span className="text-[8px] font-mono px-1 rounded bg-purple-500/30 text-purple-300 border border-purple-500/40">
                    {frame.durationMultiplier}x
                  </span>
                )}
              </div>

              {/* Cached Frame Artwork Thumbnail */}
              <div className="absolute inset-0 checkerboard-bg flex items-center justify-center pointer-events-none">
                {frame.thumbnail ? (
                  <img
                    src={frame.thumbnail}
                    alt={`Frame ${index + 1}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-1 h-1 rounded-full bg-zinc-600" />
                )}
              </div>

              {/* Active Frame Underline Glow */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 z-10" />
              )}
            </button>
          );
        })}

        {/* Quick Add Frame Card at end */}
        <button
          onClick={onAddFrame}
          title="Add Frame to End"
          className="h-16 w-14 rounded-xl border border-dashed border-white/20 hover:border-amber-500/50 hover:bg-white/5 flex flex-col items-center justify-center gap-1 text-zinc-500 hover:text-amber-400 flex-shrink-0 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="text-[9px] font-semibold">New</span>
        </button>
      </div>
    </div>
  );
};
