/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * FrameForge - Master Animation Editor Workspace
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Project,
  Frame,
  LayerMeta,
  ToolType,
  BrushType,
  DrawingElement,
  OnionSkinConfig,
  ReferenceImage,
  AudioTrack,
  AppSettings,
  Palette,
} from '../../types';
import { saveProject } from '../../utils/storage';
import { generateFrameThumbnail } from '../../utils/canvasHelper';
import { TopBar } from './TopBar';
import { ToolBar } from './ToolBar';
import { SideControls } from './SideControls';
import { CanvasArea } from './CanvasArea';
import { TimelineBar } from './TimelineBar';

import { ColorPickerModal } from './ColorPickerModal';
import { LayersModal } from './LayersModal';
import { OnionSkinModal } from './OnionSkinModal';
import { ExportModal } from './ExportModal';
import { PreviewModal } from './PreviewModal';
import { AudioModal } from './AudioModal';
import { ReferenceImageModal } from './ReferenceImageModal';
import { SettingsModal } from '../settings/SettingsModal';

interface AnimationEditorProps {
  initialProject: Project;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onBackToHome: () => void;
}

export const AnimationEditor: React.FC<AnimationEditorProps> = ({
  initialProject,
  settings,
  onSaveSettings,
  onBackToHome,
}) => {
  const [project, setProject] = useState<Project>(initialProject);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [activeLayerId, setActiveLayerId] = useState<string>(
    initialProject.layersMeta[0]?.id || 'layer-1'
  );

  // Tools & Styling state
  const [activeTool, setActiveTool] = useState<ToolType>('brush');
  const [activeBrush, setActiveBrush] = useState<BrushType>('brush');
  const [activeShape, setActiveShape] = useState<'line' | 'rectangle' | 'ellipse'>('rectangle');
  const [brushSize, setBrushSize] = useState<number>(settings.defaultBrushSize || 8);
  const [brushOpacity, setBrushOpacity] = useState<number>(settings.defaultBrushOpacity ?? settings.defaultOpacity ?? 1.0);
  const [currentColor, setCurrentColor] = useState<string>('#000000');
  const [recentColors, setRecentColors] = useState<string[]>([
    '#000000',
    '#FFFFFF',
    '#EF4444',
    '#3B82F6',
    '#10B981',
  ]);

  // Viewport / Transform
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [cameraEnabled, setCameraEnabled] = useState(false);

  // Onion skinning
  const [onionSkin, setOnionSkin] = useState<OnionSkinConfig>(
    initialProject.onionSkin || {
      enabled: false,
      prevFramesCount: 2,
      nextFramesCount: 1,
      opacity: 0.35,
      prevColor: '#EF4444',
      nextColor: '#3B82F6',
    }
  );

  // Reference Image
  const [referenceImage, setReferenceImage] = useState<ReferenceImage | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(true);

  // Clipboard for frame copy-paste
  const [copiedFrame, setCopiedFrame] = useState<Frame | null>(null);

  // Modals
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [showOnionSkin, setShowOnionSkin] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [showReferenceImage, setShowReferenceImage] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Auto-save & History Stack
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<Frame[][]>([[...initialProject.frames]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const activeFrame = project.frames[currentFrameIndex] || project.frames[0];
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fit to screen helper
  const fitToScreen = useCallback(() => {
    setPan({ x: 0, y: 0 });
    // Calculate appropriate zoom based on screen dimensions
    const viewportW = window.innerWidth - 120;
    const viewportH = window.innerHeight - 200;
    const scaleX = viewportW / project.width;
    const scaleY = viewportH / project.height;
    const fitZoom = Math.min(1.0, Math.min(scaleX, scaleY));
    setZoom(Math.max(0.3, Math.min(2.0, fitZoom * 0.95)));
  }, [project.width, project.height]);

  useEffect(() => {
    fitToScreen();
  }, [fitToScreen]);

  // Debounced auto-save project
  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        await saveProject(project);
      } catch (err) {
        console.error('Auto-save error:', err);
      } finally {
        setTimeout(() => setIsSaving(false), 200);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [project]);

  // Audio Playback synchronization
  useEffect(() => {
    if (!project.audioTrack) {
      audioRef.current?.pause();
      return;
    }

    if (isPlaying) {
      if (!audioRef.current) {
        audioRef.current = new Audio(project.audioTrack.dataUrl);
      }
      audioRef.current.volume = project.audioTrack.isMuted ? 0 : project.audioTrack.volume;
      const frameTime = currentFrameIndex / project.fps;
      if (Math.abs(audioRef.current.currentTime - frameTime) > 0.2) {
        audioRef.current.currentTime = frameTime;
      }
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying, currentFrameIndex, project.audioTrack, project.fps]);

  // Playback timer (FPS accurate)
  useEffect(() => {
    if (!isPlaying || project.frames.length <= 1) return;

    const intervalMs = 1000 / project.fps;
    const timer = setInterval(() => {
      setCurrentFrameIndex((prev) => {
        const next = prev + 1;
        if (next >= project.frames.length) {
          if (isLooping) {
            if (audioRef.current) audioRef.current.currentTime = 0;
            return 0;
          }
          setIsPlaying(false);
          return prev;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, project.fps, project.frames.length, isLooping]);

  // Commit a newly drawn element to current layer & frame
  const handleCommitElement = (newElement: DrawingElement) => {
    const updatedFrames = project.frames.map((frame, idx) => {
      if (idx !== currentFrameIndex) return frame;

      const layerData = frame.layers[activeLayerId] || { id: activeLayerId, elements: [] };
      const updatedElements = [...(layerData.elements || []), newElement];

      const newFrame: Frame = {
        ...frame,
        layers: {
          ...frame.layers,
          [activeLayerId]: {
            ...layerData,
            elements: updatedElements,
          },
        },
      };

      // Generate cached thumbnail in background
      newFrame.thumbnail = generateFrameThumbnail(
        newFrame,
        project.layersMeta,
        project.width,
        project.height
      );

      return newFrame;
    });

    // Push snapshot to undo history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(updatedFrames);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    setProject((prev) => ({
      ...prev,
      frames: updatedFrames,
      updatedAt: Date.now(),
    }));

    // Add color to recent colors if not present
    if (currentColor && !recentColors.includes(currentColor)) {
      setRecentColors([currentColor, ...recentColors.slice(0, 15)]);
    }
  };

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      const prevFrames = history[prevIdx];
      setHistoryIndex(prevIdx);
      setProject((prev) => ({ ...prev, frames: prevFrames }));
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      const nextFrames = history[nextIdx];
      setHistoryIndex(nextIdx);
      setProject((prev) => ({ ...prev, frames: nextFrames }));
    }
  };

  // Frame Operations
  const handleAddFrame = () => {
    const newFrameId = `frame-${Date.now()}`;
    const initialLayers: Record<string, { id: string; elements: DrawingElement[] }> = {};
    project.layersMeta.forEach((meta) => {
      initialLayers[meta.id] = { id: meta.id, elements: [] };
    });

    const blankFrame: Frame = {
      id: newFrameId,
      frameNumber: currentFrameIndex + 2,
      layers: initialLayers,
      durationMultiplier: 1,
    };

    const newFrames = [...project.frames];
    newFrames.splice(currentFrameIndex + 1, 0, blankFrame);
    // Renumber frames
    newFrames.forEach((f, idx) => {
      f.frameNumber = idx + 1;
    });

    setProject((prev) => ({ ...prev, frames: newFrames }));
    setCurrentFrameIndex(currentFrameIndex + 1);

    // History update
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newFrames);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleDuplicateFrame = () => {
    const current = project.frames[currentFrameIndex];
    if (!current) return;

    // Deep clone current frame
    const duplicated: Frame = JSON.parse(JSON.stringify(current));
    duplicated.id = `frame-${Date.now()}`;
    duplicated.frameNumber = currentFrameIndex + 2;

    const newFrames = [...project.frames];
    newFrames.splice(currentFrameIndex + 1, 0, duplicated);
    newFrames.forEach((f, idx) => {
      f.frameNumber = idx + 1;
    });

    setProject((prev) => ({ ...prev, frames: newFrames }));
    setCurrentFrameIndex(currentFrameIndex + 1);

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newFrames);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleDeleteFrame = () => {
    if (project.frames.length <= 1) return;

    const newFrames = project.frames.filter((_, idx) => idx !== currentFrameIndex);
    newFrames.forEach((f, idx) => {
      f.frameNumber = idx + 1;
    });
    const nextIndex = Math.min(newFrames.length - 1, currentFrameIndex);

    setProject((prev) => ({ ...prev, frames: newFrames }));
    setCurrentFrameIndex(nextIndex);

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newFrames);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleCopyFrame = () => {
    const current = project.frames[currentFrameIndex];
    if (current) {
      setCopiedFrame(JSON.parse(JSON.stringify(current)));
    }
  };

  const handlePasteFrame = () => {
    if (!copiedFrame) return;

    const pasted: Frame = JSON.parse(JSON.stringify(copiedFrame));
    pasted.id = `frame-${Date.now()}`;
    pasted.frameNumber = currentFrameIndex + 2;

    const newFrames = [...project.frames];
    newFrames.splice(currentFrameIndex + 1, 0, pasted);
    newFrames.forEach((f, idx) => {
      f.frameNumber = idx + 1;
    });

    setProject((prev) => ({ ...prev, frames: newFrames }));
    setCurrentFrameIndex(currentFrameIndex + 1);

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newFrames);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleClearFrame = () => {
    const updatedFrames = project.frames.map((frame, idx) => {
      if (idx !== currentFrameIndex) return frame;

      const clearedLayers: Record<string, { id: string; elements: DrawingElement[] }> = {};
      project.layersMeta.forEach((meta) => {
        clearedLayers[meta.id] = { id: meta.id, elements: [] };
      });

      return {
        ...frame,
        layers: clearedLayers,
        thumbnail: undefined,
      };
    });

    setProject((prev) => ({ ...prev, frames: updatedFrames }));

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(updatedFrames);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleMoveFrameLeft = () => {
    if (currentFrameIndex === 0) return;
    const newFrames = [...project.frames];
    const temp = newFrames[currentFrameIndex];
    newFrames[currentFrameIndex] = newFrames[currentFrameIndex - 1];
    newFrames[currentFrameIndex - 1] = temp;

    setProject((prev) => ({ ...prev, frames: newFrames }));
    setCurrentFrameIndex(currentFrameIndex - 1);
  };

  const handleMoveFrameRight = () => {
    if (currentFrameIndex === project.frames.length - 1) return;
    const newFrames = [...project.frames];
    const temp = newFrames[currentFrameIndex];
    newFrames[currentFrameIndex] = newFrames[currentFrameIndex + 1];
    newFrames[currentFrameIndex + 1] = temp;

    setProject((prev) => ({ ...prev, frames: newFrames }));
    setCurrentFrameIndex(currentFrameIndex + 1);
  };

  // Layer Operations
  const handleAddLayer = () => {
    const newId = `layer-${Date.now()}`;
    const newMeta: LayerMeta = {
      id: newId,
      name: `Layer ${project.layersMeta.length + 1}`,
      opacity: 1,
      isVisible: true,
      isLocked: false,
    };

    setProject((prev) => ({
      ...prev,
      layersMeta: [...prev.layersMeta, newMeta],
    }));
    setActiveLayerId(newId);
  };

  const handleDeleteLayer = (layerId: string) => {
    if (project.layersMeta.length <= 1) return;
    const updatedMeta = project.layersMeta.filter((l) => l.id !== layerId);
    setProject((prev) => ({ ...prev, layersMeta: updatedMeta }));
    if (activeLayerId === layerId) {
      setActiveLayerId(updatedMeta[0].id);
    }
  };

  const handleDuplicateLayer = (layerId: string) => {
    const original = project.layersMeta.find((l) => l.id === layerId);
    if (!original) return;

    const newId = `layer-${Date.now()}`;
    const newMeta: LayerMeta = {
      ...original,
      id: newId,
      name: `${original.name} Copy`,
    };

    // Duplicate element contents in each frame
    const updatedFrames = project.frames.map((frame) => {
      const srcElements = frame.layers[layerId]?.elements || [];
      return {
        ...frame,
        layers: {
          ...frame.layers,
          [newId]: {
            id: newId,
            elements: JSON.parse(JSON.stringify(srcElements)),
          },
        },
      };
    });

    setProject((prev) => ({
      ...prev,
      layersMeta: [...prev.layersMeta, newMeta],
      frames: updatedFrames,
    }));
    setActiveLayerId(newId);
  };

  const handleToggleLayerVisibility = (layerId: string) => {
    setProject((prev) => ({
      ...prev,
      layersMeta: prev.layersMeta.map((l) =>
        l.id === layerId ? { ...l, isVisible: !l.isVisible } : l
      ),
    }));
  };

  const handleToggleLayerLock = (layerId: string) => {
    setProject((prev) => ({
      ...prev,
      layersMeta: prev.layersMeta.map((l) =>
        l.id === layerId ? { ...l, isLocked: !l.isLocked } : l
      ),
    }));
  };

  const handleChangeLayerOpacity = (layerId: string, opacity: number) => {
    setProject((prev) => ({
      ...prev,
      layersMeta: prev.layersMeta.map((l) => (l.id === layerId ? { ...l, opacity } : l)),
    }));
  };

  const handleRenameLayer = (layerId: string, newName: string) => {
    setProject((prev) => ({
      ...prev,
      layersMeta: prev.layersMeta.map((l) => (l.id === layerId ? { ...l, name: newName } : l)),
    }));
  };

  const handleReorderLayer = (layerId: string, direction: 'up' | 'down') => {
    const idx = project.layersMeta.findIndex((l) => l.id === layerId);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx + 1 : idx - 1;
    if (targetIdx < 0 || targetIdx >= project.layersMeta.length) return;

    const updated = [...project.layersMeta];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;

    setProject((prev) => ({ ...prev, layersMeta: updated }));
  };

  // Keyboard Shortcuts (Space, Ctrl+Z, etc.)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid hotkeys when typing in input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      // Space: Play / Pause
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }

      // Ctrl / Cmd + Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }

      // Ctrl / Cmd + Y or Ctrl+Shift+Z: Redo
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        handleRedo();
      }

      // Tool shortcuts
      if (e.key.toLowerCase() === 'b') setActiveTool(activeBrush);
      if (e.key.toLowerCase() === 'e') setActiveTool('eraser');
      if (e.key.toLowerCase() === 'g') setActiveTool('fill');
      if (e.key.toLowerCase() === 'i') setActiveTool('eyedropper');
      if (e.key.toLowerCase() === 'l') setActiveTool('lasso');
      if (e.key.toLowerCase() === 'o') {
        e.preventDefault();
        setOnionSkin((prev) => ({ ...prev, enabled: !prev.enabled }));
      }

      // Arrow navigation
      if (e.key === 'ArrowLeft') {
        setCurrentFrameIndex((prev) => Math.max(0, prev - 1));
      }
      if (e.key === 'ArrowRight') {
        setCurrentFrameIndex((prev) => Math.min(project.frames.length - 1, prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeBrush, historyIndex, history.length, project.frames.length]);

  const activeLayerMeta =
    project.layersMeta.find((l) => l.id === activeLayerId) || project.layersMeta[0];

  return (
    <div className="w-full h-full flex flex-col bg-[#121214] text-zinc-100 overflow-hidden select-none">
      {/* 1. Top Bar */}
      <TopBar
        projectName={project.name}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        isSaving={isSaving}
        onBack={onBackToHome}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenExport={() => setShowExport(true)}
        onOpenPreview={() => setShowPreview(true)}
        onOpenSettings={() => setShowSettings(true)}
        cameraEnabled={cameraEnabled}
        onToggleCamera={() => setCameraEnabled(!cameraEnabled)}
      />

      {/* 2. Middle Editor Body (Left Toolbar + Center Canvas + Right Controls) */}
      <div className="flex-1 w-full flex min-h-0 relative">
        {/* Left Drawing Tools Palette */}
        <ToolBar
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          activeBrush={activeBrush}
          onSelectBrush={setActiveBrush}
          activeShape={activeShape}
          onSelectShape={setActiveShape}
        />

        {/* Center Drawing Canvas Area */}
        <CanvasArea
          project={project}
          currentFrameIndex={currentFrameIndex}
          activeLayerId={activeLayerId}
          activeTool={activeTool}
          activeBrush={activeBrush}
          activeShape={activeShape}
          brushSize={brushSize}
          brushOpacity={brushOpacity}
          currentColor={currentColor}
          onionSkin={onionSkin}
          cameraEnabled={cameraEnabled}
          referenceImage={referenceImage}
          onCommitElement={handleCommitElement}
          onPickColor={setCurrentColor}
          zoom={zoom}
          setZoom={setZoom}
          pan={pan}
          setPan={setPan}
          onToggleOnionSkin={() => setOnionSkin((prev) => ({ ...prev, enabled: !prev.enabled }))}
          onOpenOnionSkinConfig={() => setShowOnionSkin(true)}
        />

        {/* Right Side Controls */}
        <SideControls
          brushSize={brushSize}
          onChangeBrushSize={setBrushSize}
          brushOpacity={brushOpacity}
          onChangeBrushOpacity={setBrushOpacity}
          currentColor={currentColor}
          onOpenColorPicker={() => setShowColorPicker(true)}
          onOpenLayers={() => setShowLayers(true)}
          activeLayerName={activeLayerMeta?.name || 'Layer 1'}
          layersCount={project.layersMeta.length}
          onionSkin={onionSkin}
          onToggleOnionSkin={() => setOnionSkin((prev) => ({ ...prev, enabled: !prev.enabled }))}
          onOpenOnionSkinConfig={() => setShowOnionSkin(true)}
          onOpenReferenceImage={() => setShowReferenceImage(true)}
          hasReferenceImage={!!referenceImage}
          onOpenAudio={() => setShowAudio(true)}
          hasAudioTrack={!!project.audioTrack}
          zoom={zoom}
          onResetZoom={fitToScreen}
          onZoomIn={() => setZoom((z) => Math.min(5, z * 1.25))}
          onZoomOut={() => setZoom((z) => Math.max(0.2, z * 0.8))}
        />
      </div>

      {/* 3. Bottom Timeline Bar */}
      <TimelineBar
        project={project}
        currentFrameIndex={currentFrameIndex}
        onSelectFrame={(idx) => setCurrentFrameIndex(idx)}
        onAddFrame={handleAddFrame}
        onDuplicateFrame={handleDuplicateFrame}
        onDeleteFrame={handleDeleteFrame}
        onCopyFrame={handleCopyFrame}
        onPasteFrame={handlePasteFrame}
        onClearFrame={handleClearFrame}
        onMoveFrameLeft={handleMoveFrameLeft}
        onMoveFrameRight={handleMoveFrameRight}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        isLooping={isLooping}
        onToggleLoop={() => setIsLooping(!isLooping)}
        hasCopiedFrame={!!copiedFrame}
        onToggleAudioMute={() => {
          if (project.audioTrack) {
            setProject((prev) => ({
              ...prev,
              audioTrack: prev.audioTrack
                ? { ...prev.audioTrack, isMuted: !prev.audioTrack.isMuted }
                : undefined,
            }));
          }
        }}
      />

      {/* Modal Dialogs */}
      <ColorPickerModal
        isOpen={showColorPicker}
        onClose={() => setShowColorPicker(false)}
        currentColor={currentColor}
        onSelectColor={setCurrentColor}
        recentColors={recentColors}
        palettes={project.palettes || []}
        onSavePalette={(newPalettes) =>
          setProject((prev) => ({ ...prev, palettes: newPalettes }))
        }
      />

      <LayersModal
        isOpen={showLayers}
        onClose={() => setShowLayers(false)}
        layersMeta={project.layersMeta}
        activeLayerId={activeLayerId}
        onSelectLayer={setActiveLayerId}
        onAddLayer={handleAddLayer}
        onDeleteLayer={handleDeleteLayer}
        onDuplicateLayer={handleDuplicateLayer}
        onToggleVisibility={handleToggleLayerVisibility}
        onToggleLock={handleToggleLayerLock}
        onChangeOpacity={handleChangeLayerOpacity}
        onRenameLayer={handleRenameLayer}
        onReorderLayer={handleReorderLayer}
        activeFrame={activeFrame}
      />

      <OnionSkinModal
        isOpen={showOnionSkin}
        onClose={() => setShowOnionSkin(false)}
        config={onionSkin}
        onChangeConfig={(newCfg) => {
          setOnionSkin(newCfg);
          setProject((prev) => ({ ...prev, onionSkin: newCfg }));
        }}
      />

      <ExportModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        project={project}
      />

      <PreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        project={project}
      />

      <AudioModal
        isOpen={showAudio}
        onClose={() => setShowAudio(false)}
        audioTrack={project.audioTrack}
        onSetAudioTrack={(track) => setProject((prev) => ({ ...prev, audioTrack: track }))}
      />

      <ReferenceImageModal
        isOpen={showReferenceImage}
        onClose={() => setShowReferenceImage(false)}
        referenceImage={referenceImage}
        onSetReferenceImage={setReferenceImage}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSaveSettings={onSaveSettings}
      />
    </div>
  );
};
