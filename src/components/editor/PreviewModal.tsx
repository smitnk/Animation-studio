/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * FrameForge - Fullscreen Animation Preview Player
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, X, Repeat, SkipBack, SkipForward, Maximize2 } from 'lucide-react';
import { Project } from '../../types';
import { renderFrameToCanvas } from '../../utils/canvasHelper';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, project }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLooping, setIsLooping] = useState(true);
  const [fps, setFps] = useState(project.fps || 12);

  const totalFrames = project.frames.length;

  // Render frame onto player canvas
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const frame = project.frames[currentFrameIndex];
    if (!frame) return;

    renderFrameToCanvas(ctx, frame, project.layersMeta, project.width, project.height, {
      drawBackground: true,
      backgroundType: project.backgroundType,
      backgroundColor: project.backgroundColor,
    });
  }, [isOpen, currentFrameIndex, project]);

  // Animation Playback Interval
  useEffect(() => {
    if (!isOpen || !isPlaying || totalFrames <= 1) return;

    const intervalMs = 1000 / fps;
    const timer = setInterval(() => {
      setCurrentFrameIndex((prev) => {
        if (prev >= totalFrames - 1) {
          if (isLooping) return 0;
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isOpen, isPlaying, fps, totalFrames, isLooping]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between p-4 select-none animate-in fade-in duration-200">
      {/* Top Floating Control Bar */}
      <div className="w-full max-w-2xl flex items-center justify-between z-10 px-2 py-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white tracking-wide">{project.name}</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
            Preview Mode
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-colors"
          title="Exit Preview"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Fullscreen Animation Viewport */}
      <div className="flex-1 w-full flex items-center justify-center overflow-hidden p-2">
        <div
          className="relative max-w-full max-h-full aspect-auto shadow-2xl rounded-lg overflow-hidden border border-white/10"
          style={{
            aspectRatio: `${project.width} / ${project.height}`,
          }}
        >
          <canvas
            ref={canvasRef}
            width={project.width}
            height={project.height}
            className="w-full h-full object-contain pointer-events-none"
          />
        </div>
      </div>

      {/* Bottom Floating Playback Controls Bar */}
      <div className="w-full max-w-xl bg-[#18181b]/90 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex flex-col gap-2 shadow-2xl z-10">
        {/* Scrubber Slider */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-zinc-400">
            {String(currentFrameIndex + 1).padStart(2, '0')}
          </span>
          <input
            type="range"
            min={0}
            max={totalFrames - 1}
            value={currentFrameIndex}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentFrameIndex(Number(e.target.value));
            }}
            className="flex-1 accent-amber-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
          />
          <span className="text-[11px] font-mono text-zinc-400">
            {String(totalFrames).padStart(2, '0')}
          </span>
        </div>

        {/* Buttons Strip */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentFrameIndex(0)}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5"
              title="First Frame"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-9 h-9 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold flex items-center justify-center shadow active:scale-95 transition-all"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current translate-x-0.5" />
              )}
            </button>

            <button
              onClick={() => setCurrentFrameIndex(totalFrames - 1)}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5"
              title="Last Frame"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`p-1.5 rounded-lg ml-1 ${
                isLooping ? 'text-amber-400 bg-amber-500/10' : 'text-zinc-500'
              }`}
              title="Loop"
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          {/* FPS Speed Preset Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono text-zinc-500">Speed:</span>
            {[8, 12, 24].map((rate) => (
              <button
                key={rate}
                onClick={() => setFps(rate)}
                className={`px-2 py-0.5 rounded-lg text-xs font-mono font-medium border ${
                  fps === rate
                    ? 'border-amber-500 bg-amber-500 text-black font-bold'
                    : 'border-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                {rate}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
