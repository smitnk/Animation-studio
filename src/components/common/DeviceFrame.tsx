/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * FrameForge - Android Device Shell & Ergonomic Viewport
 */

import React, { useState, useEffect } from 'react';
import { Smartphone, Tablet, Monitor, RotateCw, Sparkles, Film } from 'lucide-react';

interface DeviceFrameProps {
  children: React.ReactNode;
  orientation: 'portrait' | 'landscape';
  onToggleOrientation: () => void;
  deviceMode: 'phone' | 'tablet' | 'fullscreen';
  onChangeDeviceMode: (mode: 'phone' | 'tablet' | 'fullscreen') => void;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({
  children,
  orientation,
  onToggleOrientation,
  deviceMode,
  onChangeDeviceMode,
}) => {
  const [currentTime, setCurrentTime] = useState('09:41');

  useEffect(() => {
    const update = () => {
      const d = new Date();
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      setCurrentTime(`${h}:${m}`);
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  if (deviceMode === 'fullscreen') {
    return (
      <div className="relative w-full h-full bg-[#121214] text-slate-100 flex flex-col overflow-hidden">
        {/* Minimalist device toggle overlay */}
        <div className="absolute top-2 right-4 z-50 flex items-center gap-1.5 bg-[#1e1e24]/90 backdrop-blur-md border border-white/10 rounded-full px-2.5 py-1 text-xs shadow-lg">
          <button
            onClick={() => onChangeDeviceMode('phone')}
            title="Switch to Android Phone View"
            className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onChangeDeviceMode('tablet')}
            title="Switch to Tablet View"
            className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleOrientation}
            title="Rotate Orientation"
            className="p-1 rounded-full text-zinc-400 hover:text-amber-400 hover:bg-white/10 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="w-full h-full flex-1 relative overflow-hidden">{children}</div>
      </div>
    );
  }

  const isPhone = deviceMode === 'phone';
  const isPortrait = orientation === 'portrait';

  // Device dimensions
  let frameWidth = '390px';
  let frameHeight = '844px';

  if (isPhone) {
    frameWidth = isPortrait ? '400px' : '820px';
    frameHeight = isPortrait ? '820px' : '440px';
  } else {
    // Tablet
    frameWidth = isPortrait ? '768px' : '1024px';
    frameHeight = isPortrait ? '1024px' : '680px';
  }

  return (
    <div className="w-full h-full bg-[#0c0c0e] flex flex-col items-center justify-center p-2 sm:p-4 overflow-auto">
      {/* Top Device Control Strip */}
      <header className="mb-2.5 flex items-center justify-between w-full max-w-xl px-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold tracking-wider uppercase text-zinc-200">FrameForge</span>
            <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
              Android Studio
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-[#18181c] border border-white/10 rounded-xl p-1 shadow-sm">
          <button
            onClick={() => onChangeDeviceMode('phone')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
              isPhone ? 'bg-amber-500 text-black font-semibold shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Phone</span>
          </button>
          <button
            onClick={() => onChangeDeviceMode('tablet')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
              !isPhone ? 'bg-amber-500 text-black font-semibold shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>Tablet</span>
          </button>
          <button
            onClick={onToggleOrientation}
            title="Rotate Device"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-white/5 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onChangeDeviceMode('fullscreen')}
            title="Expand Edge-to-Edge"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Android Device Mockup Shell */}
      <div
        className="relative bg-[#18181b] rounded-[44px] p-3 shadow-2xl border-[6px] border-[#27272a] ring-1 ring-white/10 flex flex-col overflow-hidden transition-all duration-300"
        style={{ width: frameWidth, height: frameHeight, maxWidth: '100%', maxHeight: '90vh' }}
      >
        {/* Side physical button accents */}
        <div className="absolute -left-[9px] top-28 w-[3px] h-12 bg-zinc-700 rounded-l-sm" />
        <div className="absolute -left-[9px] top-44 w-[3px] h-12 bg-zinc-700 rounded-l-sm" />
        <div className="absolute -right-[9px] top-32 w-[3px] h-16 bg-zinc-700 rounded-r-sm" />

        {/* Android Screen Container */}
        <div className="relative w-full h-full bg-[#121214] rounded-[34px] flex flex-col overflow-hidden select-none border border-white/5">
          {/* Android Status Bar */}
          <div className="h-7 w-full bg-[#121214] px-5 flex items-center justify-between text-[11px] text-zinc-400 z-40 select-none flex-shrink-0">
            <span className="font-semibold font-mono tracking-tight text-zinc-300">{currentTime}</span>

            {/* Front Camera Cutout */}
            <div className="w-4 h-4 rounded-full bg-black border border-zinc-800 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-950" />
            </div>

            {/* Status Icons */}
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-medium">
              <span>5G</span>
              <div className="w-3.5 h-2 border border-zinc-500 rounded-xs flex items-center p-0.5">
                <div className="h-full w-2.5 bg-zinc-300 rounded-2xs" />
              </div>
            </div>
          </div>

          {/* Active Application Content */}
          <div className="flex-1 w-full relative overflow-hidden flex flex-col">{children}</div>

          {/* Android Gesture Bar */}
          <div className="h-4 w-full bg-[#121214] flex items-center justify-center flex-shrink-0 select-none">
            <div className="w-28 h-1 bg-zinc-600/60 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
