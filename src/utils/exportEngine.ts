/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * FrameForge - Export & Sharing Engine
 */

import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import JSZip from 'jszip';
import { Project, Frame } from '../types';
import { renderFrameToCanvas } from './canvasHelper';

export interface ExportOptions {
  format: 'gif' | 'png_sequence' | 'single_png' | 'frameforge' | 'video';
  scale: number; // 0.5, 0.75, 1.0
  fps: number;
  startFrame: number;
  endFrame: number;
  includeBackground: boolean;
  loop: boolean;
  quality?: 'high' | 'medium' | 'low';
}

export interface ExportProgress {
  status: string;
  percent: number;
}

export async function exportAnimation(
  project: Project,
  options: ExportOptions,
  onProgress?: (progress: ExportProgress) => void
): Promise<{ blob: Blob; filename: string; mimeType: string }> {
  const framesToExport = project.frames.slice(
    Math.max(0, options.startFrame - 1),
    Math.min(project.frames.length, options.endFrame)
  );

  if (framesToExport.length === 0) {
    throw new Error('No frames selected for export.');
  }

  const targetWidth = Math.round(project.width * options.scale);
  const targetHeight = Math.round(project.height * options.scale);

  // 1. .frameforge project file
  if (options.format === 'frameforge') {
    onProgress?.({ status: 'Packaging FrameForge project...', percent: 50 });
    const projectJson = JSON.stringify(project, null, 2);
    const blob = new Blob([projectJson], { type: 'application/json' });
    const safeName = project.name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    onProgress?.({ status: 'Done', percent: 100 });
    return {
      blob,
      filename: `${safeName}.frameforge`,
      mimeType: 'application/json',
    };
  }

  // 2. Single Frame PNG
  if (options.format === 'single_png') {
    onProgress?.({ status: 'Rendering high-resolution frame...', percent: 50 });
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create canvas context');

    const activeFrame = framesToExport[0];
    ctx.scale(options.scale, options.scale);
    renderFrameToCanvas(ctx, activeFrame, project.layersMeta, project.width, project.height, {
      drawBackground: options.includeBackground,
      backgroundType: project.backgroundType,
      backgroundColor: project.backgroundColor,
    });

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas export failed'))), 'image/png');
    });

    const safeName = project.name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    onProgress?.({ status: 'Done', percent: 100 });
    return {
      blob,
      filename: `${safeName}_frame_${activeFrame.frameNumber}.png`,
      mimeType: 'image/png',
    };
  }

  // 3. PNG Sequence ZIP
  if (options.format === 'png_sequence') {
    const zip = new JSZip();
    const folder = zip.folder('frames') || zip;
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create canvas context');

    for (let i = 0; i < framesToExport.length; i++) {
      const frame = framesToExport[i];
      const percent = Math.round(((i + 1) / framesToExport.length) * 80);
      onProgress?.({
        status: `Rendering frame ${i + 1} of ${framesToExport.length}...`,
        percent,
      });

      ctx.save();
      ctx.clearRect(0, 0, targetWidth, targetHeight);
      ctx.scale(options.scale, options.scale);
      renderFrameToCanvas(ctx, frame, project.layersMeta, project.width, project.height, {
        drawBackground: options.includeBackground,
        backgroundType: project.backgroundType,
        backgroundColor: project.backgroundColor,
      });
      ctx.restore();

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b || new Blob()), 'image/png');
      });

      const frameIdxStr = String(frame.frameNumber).padStart(4, '0');
      folder.file(`frame_${frameIdxStr}.png`, blob);
    }

    onProgress?.({ status: 'Compressing ZIP archive...', percent: 90 });
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const safeName = project.name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    onProgress?.({ status: 'Done', percent: 100 });
    return {
      blob: zipBlob,
      filename: `${safeName}_png_sequence.zip`,
      mimeType: 'application/zip',
    };
  }

  // 4. Animated GIF
  if (options.format === 'gif') {
    onProgress?.({ status: 'Initializing GIF encoder...', percent: 5 });
    const gif = GIFEncoder();
    const delay = Math.round(1000 / options.fps);

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Could not initialize canvas context for GIF');

    for (let i = 0; i < framesToExport.length; i++) {
      const frame = framesToExport[i];
      const holdCount = Math.max(1, frame.durationMultiplier || 1);

      onProgress?.({
        status: `Encoding GIF frame ${i + 1} of ${framesToExport.length}...`,
        percent: 10 + Math.round(((i + 1) / framesToExport.length) * 80),
      });

      ctx.save();
      ctx.clearRect(0, 0, targetWidth, targetHeight);
      ctx.scale(options.scale, options.scale);
      renderFrameToCanvas(ctx, frame, project.layersMeta, project.width, project.height, {
        drawBackground: options.includeBackground,
        backgroundType: project.backgroundType,
        backgroundColor: project.backgroundColor,
      });
      ctx.restore();

      const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
      const rgba = imageData.data;

      // Quantize RGBA into 256 color palette
      const palette = quantize(rgba, 256);
      const index = applyPalette(rgba, palette);

      // Write frame (repeat for hold duration)
      for (let h = 0; h < holdCount; h++) {
        gif.writeFrame(index, targetWidth, targetHeight, {
          palette,
          delay,
        });
      }
    }

    onProgress?.({ status: 'Finalizing GIF stream...', percent: 95 });
    gif.finish();
    const gifBytes = gif.bytes();
    const blob = new Blob([new Uint8Array(gifBytes)], { type: 'image/gif' });
    const safeName = project.name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    onProgress?.({ status: 'Done', percent: 100 });
    return {
      blob,
      filename: `${safeName}.gif`,
      mimeType: 'image/gif',
    };
  }

  // 5. Video Export (MP4 or WebM via MediaRecorder Canvas Stream)
  if (options.format === 'video') {
    onProgress?.({ status: 'Preparing video recording...', percent: 10 });
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not available for video');

    const mimeType = MediaRecorder.isTypeSupported('video/mp4')
      ? 'video/mp4'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';

    const stream = canvas.captureStream(options.fps);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 4_000_000,
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    const recordPromise = new Promise<{ blob: Blob; ext: string }>((resolve, reject) => {
      mediaRecorder.onstop = () => {
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const blob = new Blob(chunks, { type: mimeType });
        resolve({ blob, ext });
      };
      mediaRecorder.onerror = (err) => reject(err);
    });

    mediaRecorder.start();

    const frameDuration = 1000 / options.fps;

    // Loop through frames to record
    for (let i = 0; i < framesToExport.length; i++) {
      const frame = framesToExport[i];
      const holdCount = Math.max(1, frame.durationMultiplier || 1);

      ctx.save();
      ctx.clearRect(0, 0, targetWidth, targetHeight);
      ctx.scale(options.scale, options.scale);
      renderFrameToCanvas(ctx, frame, project.layersMeta, project.width, project.height, {
        drawBackground: true,
        backgroundType: project.backgroundType,
        backgroundColor: project.backgroundColor,
      });
      ctx.restore();

      onProgress?.({
        status: `Recording frame ${i + 1} of ${framesToExport.length}...`,
        percent: 15 + Math.round(((i + 1) / framesToExport.length) * 75),
      });

      await new Promise((res) => setTimeout(res, frameDuration * holdCount));
    }

    mediaRecorder.stop();
    const { blob, ext } = await recordPromise;
    const safeName = project.name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    onProgress?.({ status: 'Done', percent: 100 });
    return {
      blob,
      filename: `${safeName}.${ext}`,
      mimeType,
    };
  }

  throw new Error(`Unsupported export format: ${options.format}`);
}

// Android Share or file download helper
export async function shareOrDownloadFile(
  blob: Blob,
  filename: string,
  mimeType: string,
  title = 'FrameForge Export'
): Promise<{ shared: boolean; downloaded: boolean }> {
  const file = new File([blob], filename, { type: mimeType });

  // Try Native Android Web Share API if supported
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title,
        text: `Exported animation from FrameForge: ${filename}`,
        files: [file],
      });
      return { shared: true, downloaded: false };
    } catch (shareErr) {
      if ((shareErr as Error).name !== 'AbortError') {
        console.warn('Share error, falling back to download', shareErr);
      }
    }
  }

  // Fallback: Trigger direct file download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);

  return { shared: false, downloaded: true };
}
