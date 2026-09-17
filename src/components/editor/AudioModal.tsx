/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * FrameForge - Audio Track & Sound Effects Studio
 */

import React, { useState } from 'react';
import {
  X,
  Music,
  Upload,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Trash2,
  Sparkles,
  Mic,
} from 'lucide-react';
import { AudioTrack } from '../../types';
import { processAudioFile, createSynthBeep } from '../../utils/audioEngine';

interface AudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioTrack?: AudioTrack;
  onSetAudioTrack: (track?: AudioTrack) => void;
}

export const AudioModal: React.FC<AudioModalProps> = ({
  isOpen,
  onClose,
  audioTrack,
  onSetAudioTrack,
}) => {
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const track = await processAudioFile(file);
      onSetAudioTrack(track);
    } catch (err) {
      console.error(err);
      alert('Could not decode audio file.');
    }
  };

  const handleAddBeepEffect = async (presetType: 'boing' | 'pop' | 'laser') => {
    try {
      const track = await createSynthBeep(presetType);
      onSetAudioTrack(track);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTestPlay = () => {
    if (!audioTrack) return;
    if (isPlayingTest) {
      audioElement?.pause();
      setIsPlayingTest(false);
    } else {
      const audio = new Audio(audioTrack.dataUrl);
      audio.volume = audioTrack.isMuted ? 0 : audioTrack.volume;
      audio.onended = () => setIsPlayingTest(false);
      audio.play();
      setAudioElement(audio);
      setIsPlayingTest(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4 select-none">
      <div className="w-full max-w-md bg-[#18181b] border border-white/10 sm:rounded-2xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-[#141416]">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-zinc-100">Audio Track & Voiceover</h3>
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
          {audioTrack ? (
            /* Active Track Card */
            <div className="p-3.5 bg-[#121214] rounded-2xl border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Music className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate max-w-[180px]">
                      {audioTrack.name}
                    </h4>
                    <span className="text-[10px] font-mono text-zinc-500">
                      Duration: {audioTrack.durationSeconds.toFixed(2)}s
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleTestPlay}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200"
                    title={isPlayingTest ? 'Pause' : 'Test Play'}
                  >
                    {isPlayingTest ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => onSetAudioTrack(undefined)}
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400"
                    title="Remove Audio"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Mini Waveform Display */}
              <div className="h-8 bg-black/40 rounded-xl p-1.5 flex items-center gap-[2px] overflow-hidden border border-white/5">
                {(audioTrack.waveform || []).slice(0, 70).map((peak, idx) => (
                  <div
                    key={idx}
                    className="flex-1 bg-purple-400/80 rounded-full"
                    style={{ height: `${Math.max(15, peak * 100)}%` }}
                  />
                ))}
              </div>

              {/* Volume & Mute Controls */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() =>
                    onSetAudioTrack({ ...audioTrack, isMuted: !audioTrack.isMuted })
                  }
                  className="text-zinc-400 hover:text-white"
                >
                  {audioTrack.isMuted ? (
                    <VolumeX className="w-4 h-4 text-red-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-purple-400" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={audioTrack.isMuted ? 0 : Math.round(audioTrack.volume * 100)}
                  onChange={(e) =>
                    onSetAudioTrack({
                      ...audioTrack,
                      isMuted: false,
                      volume: Number(e.target.value) / 100,
                    })
                  }
                  className="flex-1 accent-purple-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] font-mono text-zinc-400 w-8 text-right">
                  {audioTrack.isMuted ? 'Muted' : `${Math.round(audioTrack.volume * 100)}%`}
                </span>
              </div>
            </div>
          ) : (
            /* Upload / Presets Section */
            <div className="space-y-3">
              {/* File Upload Box */}
              <label className="border-2 border-dashed border-white/10 hover:border-purple-500/50 hover:bg-purple-500/5 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-200 block">Import Audio File</span>
                  <span className="text-[10px] text-zinc-500">Supports MP3, WAV, WebM, OGG</span>
                </div>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Preset Animation Sound Effects */}
              <div>
                <span className="block text-[10px] uppercase font-semibold text-zinc-400 mb-1.5">
                  Built-in Animation FX
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleAddBeepEffect('boing')}
                    className="p-2.5 rounded-xl bg-[#121214] border border-white/5 hover:border-purple-500/40 text-left transition-colors"
                  >
                    <span className="text-xs font-bold text-zinc-200 block">Boing / Bounce</span>
                    <span className="text-[10px] text-zinc-500">Squash & stretch</span>
                  </button>
                  <button
                    onClick={() => handleAddBeepEffect('pop')}
                    className="p-2.5 rounded-xl bg-[#121214] border border-white/5 hover:border-purple-500/40 text-left transition-colors"
                  >
                    <span className="text-xs font-bold text-zinc-200 block">Pop Effect</span>
                    <span className="text-[10px] text-zinc-500">Impact & puff</span>
                  </button>
                  <button
                    onClick={() => handleAddBeepEffect('laser')}
                    className="p-2.5 rounded-xl bg-[#121214] border border-white/5 hover:border-purple-500/40 text-left transition-colors"
                  >
                    <span className="text-xs font-bold text-zinc-200 block">Zap / Laser</span>
                    <span className="text-[10px] text-zinc-500">Fast action swoosh</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 bg-[#141416] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-purple-500 text-black font-bold text-xs rounded-xl shadow active:scale-95 transition-transform"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
