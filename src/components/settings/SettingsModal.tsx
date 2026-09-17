/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * FrameForge - Studio Settings & Preferences Modal
 */

import React, { useState } from 'react';
import {
  X,
  Settings,
  Moon,
  Sun,
  PenTool,
  Clock,
  HardDrive,
  Info,
  Check,
  ShieldCheck,
  Database,
  Trash2,
} from 'lucide-react';
import { AppSettings } from '../../types';
import { clearAllProjects, exportAllProjectsJson } from '../../utils/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onProjectsChanged?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onProjectsChanged,
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(localSettings);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 400);
  };

  const handleBackupAll = async () => {
    try {
      const json = await exportAllProjectsJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `frameforge-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Failed to generate backup.');
    }
  };

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to delete ALL projects and drawings? This action cannot be undone.')) {
      await clearAllProjects();
      onProjectsChanged?.();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4 select-none">
      <div className="w-full max-w-md bg-[#18181b] border border-white/10 sm:rounded-2xl rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-[#141416]">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-zinc-100">Studio Preferences</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* 1. Theme */}
          <div className="p-3 bg-[#121214] rounded-xl border border-white/5 space-y-2">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-amber-400" />
              Appearance Theme
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, theme: 'dark' })}
                className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all ${
                  localSettings.theme === 'dark'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                    : 'border-white/5 bg-[#18181b] text-zinc-400'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Dark Canvas (OLED)</span>
              </button>

              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, theme: 'light' })}
                className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all ${
                  localSettings.theme === 'light'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                    : 'border-white/5 bg-[#18181b] text-zinc-400'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Light Theme</span>
              </button>
            </div>
          </div>

          {/* 2. Drawing & Stylus Gestures */}
          <div className="p-3 bg-[#121214] rounded-xl border border-white/5 space-y-3">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 flex items-center gap-1.5">
              <PenTool className="w-3.5 h-3.5 text-amber-400" />
              Stylus & Touch Hardware
            </span>

            {/* Pressure Sensitivity */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-zinc-200 block">Pressure Sensitivity</span>
                <span className="text-[10px] text-zinc-500">Vary line weight based on stylus pressure</span>
              </div>
              <input
                type="checkbox"
                checked={localSettings.pressureSensitivity}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, pressureSensitivity: e.target.checked })
                }
                className="accent-amber-500 w-4 h-4 rounded"
              />
            </div>

            {/* Palm Rejection */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-zinc-200 block">Palm Rejection</span>
                <span className="text-[10px] text-zinc-500">Ignore accidental wrist/palm contact</span>
              </div>
              <input
                type="checkbox"
                checked={localSettings.palmRejection}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, palmRejection: e.target.checked })
                }
                className="accent-amber-500 w-4 h-4 rounded"
              />
            </div>
          </div>

          {/* 3. Animation Defaults */}
          <div className="p-3 bg-[#121214] rounded-xl border border-white/5 space-y-2">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Default New Project Frame Rate
            </span>
            <div className="grid grid-cols-4 gap-2">
              {[8, 12, 15, 24].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setLocalSettings({ ...localSettings, defaultFps: f })}
                  className={`py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
                    localSettings.defaultFps === f
                      ? 'border-amber-500 bg-amber-500 text-black'
                      : 'border-white/5 bg-[#18181b] text-zinc-400'
                  }`}
                >
                  {f} FPS
                </button>
              ))}
            </div>
          </div>

          {/* 4. Local Storage & Backup */}
          <div className="p-3 bg-[#121214] rounded-xl border border-white/5 space-y-2.5">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-amber-400" />
              Offline Storage & Backup
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBackupAll}
                className="flex-1 py-1.5 px-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs text-zinc-200 border border-white/10 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Database className="w-3.5 h-3.5 text-sky-400" />
                <span>Backup All (JSON)</span>
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                className="py-1.5 px-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs border border-red-500/20 flex items-center gap-1 transition-colors"
                title="Wipe Storage"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* 5. About / Version */}
          <div className="p-3 bg-[#121214] rounded-xl border border-white/5 text-center">
            <h4 className="text-xs font-bold text-white flex items-center justify-center gap-1">
              <span>FrameForge 2D Animation Engine</span>
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            </h4>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              Version 1.0.0 (Native Android Web PWA Edition)
            </p>
            <p className="text-[10px] text-zinc-600 mt-1">
              Offline-first GPU Canvas Rendering • 60 FPS • 100% Client-Side Privacy
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 bg-[#141416] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-amber-500 text-black font-bold text-xs rounded-xl shadow flex items-center gap-1 active:scale-95 transition-transform"
          >
            {savedSuccess ? <Check className="w-3.5 h-3.5" /> : null}
            <span>Save Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
};
