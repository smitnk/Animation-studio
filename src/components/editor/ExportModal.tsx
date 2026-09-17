/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * FrameForge - Animation Export & Android Share Modal
 */

import React, { useState } from 'react';
import {
  X,
  Share2,
  Download,
  Film,
  Image as ImageIcon,
  FileArchive,
  Video,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Project } from '../../types';
import { exportAnimation, shareOrDownloadFile, ExportOptions, ExportProgress } from '../../utils/exportEngine';
import confetti from 'canvas-confetti';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, project }) => {
  const [format, setFormat] = useState<'gif' | 'video' | 'png_sequence' | 'single_png' | 'frameforge'>('gif');
  const [scale, setScale] = useState(1.0);
  const [fps, setFps] = useState(project.fps || 12);
  const [startFrame, setStartFrame] = useState(1);
  const [endFrame, setEndFrame] = useState(project.frames.length);
  const [includeBackground, setIncludeBackground] = useState(true);
  const [loop, setLoop] = useState(true);

  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [exportResult, setExportResult] = useState<{
    blob: Blob;
    filename: string;
    mimeType: string;
    url: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetWidth = Math.round(project.width * scale);
  const targetHeight = Math.round(project.height * scale);
  const selectedFrameCount = Math.max(1, endFrame - startFrame + 1);

  const handleStartExport = async () => {
    setIsExporting(true);
    setErrorMessage(null);
    setExportResult(null);

    const options: ExportOptions = {
      format,
      scale,
      fps,
      startFrame,
      endFrame,
      includeBackground,
      loop,
    };

    try {
      const res = await exportAnimation(project, options, (p) => setProgress(p));
      const url = URL.createObjectURL(res.blob);
      setExportResult({ ...res, url });
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    } catch (err) {
      console.error(err);
      setErrorMessage((err as Error).message || 'Export failed. Please try a lower resolution or shorter duration.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareOrSave = async () => {
    if (!exportResult) return;
    await shareOrDownloadFile(exportResult.blob, exportResult.filename, exportResult.mimeType);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4 select-none">
      <div className="w-full max-w-lg bg-[#18181b] border border-white/10 sm:rounded-2xl rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-[#141416]">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-zinc-100">Export & Share Animation</h3>
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
          {exportResult ? (
            /* Success State */
            <div className="p-4 bg-[#121214] rounded-2xl border border-white/5 flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Export Generated Successfully!</h4>
                <p className="text-xs text-zinc-400 mt-1 font-mono">{exportResult.filename}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {(exportResult.blob.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>

              {/* Media Preview for GIF / Image */}
              {(format === 'gif' || format === 'single_png') && (
                <div className="max-h-48 max-w-full rounded-xl overflow-hidden border border-white/10 checkerboard-bg">
                  <img src={exportResult.url} alt="Export preview" className="h-full object-contain mx-auto" />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full pt-2">
                <button
                  onClick={() => setExportResult(null)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:bg-white/5 border border-white/10 transition-colors"
                >
                  Export Another
                </button>
                <button
                  onClick={handleShareOrSave}
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Save / Share File
                </button>
              </div>
            </div>
          ) : (
            /* Export Configuration Form */
            <>
              {/* Format Selector */}
              <div>
                <label className="block text-[10px] uppercase font-semibold text-zinc-400 mb-1.5">
                  Export Format
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormat('gif')}
                    className={`p-2.5 rounded-xl border flex flex-col text-left transition-all ${
                      format === 'gif'
                        ? 'border-amber-500 bg-amber-500/10 text-white shadow-sm'
                        : 'border-white/5 bg-[#121214] text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Film className="w-4 h-4 text-amber-400" />
                      <span className="text-[9px] font-mono px-1 rounded bg-amber-500/20 text-amber-300">
                        Popular
                      </span>
                    </div>
                    <span className="text-xs font-bold text-zinc-100 mt-1.5">Animated GIF</span>
                    <span className="text-[10px] text-zinc-500">Universal playback</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat('video')}
                    className={`p-2.5 rounded-xl border flex flex-col text-left transition-all ${
                      format === 'video'
                        ? 'border-amber-500 bg-amber-500/10 text-white shadow-sm'
                        : 'border-white/5 bg-[#121214] text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    <Video className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-zinc-100 mt-1.5">MP4 / WebM Video</span>
                    <span className="text-[10px] text-zinc-500">Video player stream</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat('png_sequence')}
                    className={`p-2.5 rounded-xl border flex flex-col text-left transition-all ${
                      format === 'png_sequence'
                        ? 'border-amber-500 bg-amber-500/10 text-white shadow-sm'
                        : 'border-white/5 bg-[#121214] text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    <FileArchive className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold text-zinc-100 mt-1.5">PNG Sequence</span>
                    <span className="text-[10px] text-zinc-500">Lossless ZIP archive</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat('single_png')}
                    className={`p-2.5 rounded-xl border flex flex-col text-left transition-all ${
                      format === 'single_png'
                        ? 'border-amber-500 bg-amber-500/10 text-white shadow-sm'
                        : 'border-white/5 bg-[#121214] text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-zinc-100 mt-1.5">Current Frame</span>
                    <span className="text-[10px] text-zinc-500">Single PNG image</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat('frameforge')}
                    className={`p-2.5 rounded-xl border flex flex-col text-left transition-all ${
                      format === 'frameforge'
                        ? 'border-amber-500 bg-amber-500/10 text-white shadow-sm'
                        : 'border-white/5 bg-[#121214] text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-zinc-100 mt-1.5">.frameforge File</span>
                    <span className="text-[10px] text-zinc-500">Full project backup</span>
                  </button>
                </div>
              </div>

              {/* Resolution Scale */}
              {format !== 'frameforge' && (
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-zinc-300 font-medium">Output Resolution</span>
                    <span className="font-mono text-amber-400 font-bold">
                      {targetWidth} × {targetHeight} px
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Half (0.5x)', val: 0.5, desc: 'Fast & lightweight' },
                      { label: 'Medium (0.75x)', val: 0.75, desc: 'Balanced mobile' },
                      { label: 'Original (1.0x)', val: 1.0, desc: 'Maximum fidelity' },
                    ].map((s) => (
                      <button
                        key={s.val}
                        type="button"
                        onClick={() => setScale(s.val)}
                        className={`p-2 rounded-xl text-left border transition-all ${
                          scale === s.val
                            ? 'border-amber-500 bg-amber-500/10 text-white'
                            : 'border-white/5 bg-[#121214] text-zinc-400 hover:border-white/20'
                        }`}
                      >
                        <div className="text-xs font-semibold text-zinc-200">{s.label}</div>
                        <div className="text-[10px] text-zinc-500">{s.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Frame Range & FPS */}
              {format !== 'single_png' && format !== 'frameforge' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">FPS</label>
                    <select
                      value={fps}
                      onChange={(e) => setFps(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-[#121214] border border-white/10 rounded-xl text-xs font-mono text-zinc-200"
                    >
                      <option value={8}>8 FPS</option>
                      <option value={12}>12 FPS</option>
                      <option value={15}>15 FPS</option>
                      <option value={24}>24 FPS</option>
                      <option value={30}>30 FPS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Frames ({selectedFrameCount} total)
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        max={endFrame}
                        value={startFrame}
                        onChange={(e) => setStartFrame(Number(e.target.value))}
                        className="w-full px-2 py-1 bg-[#121214] border border-white/10 rounded-lg text-xs font-mono text-zinc-200 text-center"
                      />
                      <span className="text-zinc-600">-</span>
                      <input
                        type="number"
                        min={startFrame}
                        max={project.frames.length}
                        value={endFrame}
                        onChange={(e) => setEndFrame(Number(e.target.value))}
                        className="w-full px-2 py-1 bg-[#121214] border border-white/10 rounded-lg text-xs font-mono text-zinc-200 text-center"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Background & Loop Options */}
              {format !== 'frameforge' && (
                <div className="flex items-center justify-between p-3 bg-[#121214] rounded-xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="bgToggle"
                      checked={includeBackground}
                      onChange={(e) => setIncludeBackground(e.target.checked)}
                      className="rounded accent-amber-500 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="bgToggle" className="text-xs text-zinc-300 cursor-pointer">
                      Include Background Layer
                    </label>
                  </div>

                  {format === 'gif' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="loopToggle"
                        checked={loop}
                        onChange={(e) => setLoop(e.target.checked)}
                        className="rounded accent-amber-500 w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="loopToggle" className="text-xs text-zinc-300 cursor-pointer">
                        Loop Forever
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* Error Warning */}
              {errorMessage && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Progress Indicator */}
              {isExporting && progress && (
                <div className="p-3 bg-[#121214] border border-amber-500/30 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-medium flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                      {progress.status}
                    </span>
                    <span className="font-mono text-amber-400 font-bold">{progress.percent}%</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all duration-150"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        {!exportResult && (
          <div className="p-4 border-t border-white/10 bg-[#141416] flex items-center justify-end gap-2.5">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleStartExport}
              disabled={isExporting}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50 transition-all"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Generate Export</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
