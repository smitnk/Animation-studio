/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * FrameForge - Master Application Root
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Project, AppSettings, Frame, LayerMeta } from './types';
import {
  initDatabase,
  loadAllProjects,
  loadProject,
  saveProject,
  deleteProject,
  duplicateProject,
  importProjectJson,
  loadSettings,
  saveSettings,
} from './utils/storage';
import { DeviceFrame } from './components/common/DeviceFrame';
import { HomeScreen } from './components/home/HomeScreen';
import { NewProjectModal } from './components/home/NewProjectModal';
import { AnimationEditor } from './components/editor/AnimationEditor';
import { ExportModal } from './components/editor/ExportModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [currentScreen, setCurrentScreen] = useState<'home' | 'editor'>('home');

  // Device framing & viewports
  const [deviceMode, setDeviceMode] = useState<'phone' | 'tablet' | 'fullscreen'>('phone');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // Modals
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [exportModalProject, setExportModalProject] = useState<Project | null>(null);

  // Settings
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'dark',
    defaultFps: 12,
    defaultBrushSize: 8,
    defaultOpacity: 1.0,
    pressureSensitivity: true,
    palmRejection: true,
    autoSaveIntervalSec: 5,
  });

  // Load Database & Projects on Mount
  const refreshProjectsList = useCallback(async () => {
    try {
      const all = await loadAllProjects();
      setProjects(all);
    } catch (e) {
      console.error('Failed to load projects:', e);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        await initDatabase();
        const savedSettings = await loadSettings();
        setSettings(savedSettings);
        await refreshProjectsList();
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [refreshProjectsList]);

  // Open Project in Editor
  const handleOpenProject = async (projectId: string) => {
    try {
      const proj = await loadProject(projectId);
      if (proj) {
        setActiveProject(proj);
        // Automatically switch orientation to landscape if the project aspect ratio is wide
        if (proj.width > proj.height) {
          setOrientation('landscape');
        } else {
          setOrientation('portrait');
        }
        setCurrentScreen('editor');
      }
    } catch (e) {
      console.error('Error opening project:', e);
    }
  };

  // Create Project
  const handleCreateProject = async (projectData: Partial<Project>) => {
    const newId = `project-${Date.now()}`;
    const initialLayerMeta: LayerMeta = {
      id: 'layer-1',
      name: 'Layer 1',
      opacity: 1,
      isVisible: true,
      isLocked: false,
    };

    const initialFrame: Frame = {
      id: `frame-${Date.now()}`,
      frameNumber: 1,
      layers: {
        'layer-1': {
          id: 'layer-1',
          elements: [],
        },
      },
      durationMultiplier: 1,
    };

    const newProject: Project = {
      id: newId,
      name: projectData.name || 'Untitled Animation',
      width: projectData.width || 1080,
      height: projectData.height || 1920,
      fps: projectData.fps || settings.defaultFps || 12,
      backgroundType: projectData.backgroundType || 'color',
      backgroundColor: projectData.backgroundColor || '#18181b',
      layersMeta: [initialLayerMeta],
      frames: [initialFrame],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      palettes: [
        {
          id: 'default-palette',
          name: 'Classic Animation',
          colors: ['#000000', '#FFFFFF', '#EF4444', '#3B82F6', '#10B981', '#F59E0B'],
        },
      ],
      onionSkin: {
        enabled: false,
        prevFramesCount: 2,
        nextFramesCount: 1,
        opacity: 0.35,
        prevColor: '#EF4444',
        nextColor: '#3B82F6',
      },
    };

    await saveProject(newProject);
    setShowNewProjectModal(false);
    await refreshProjectsList();
    handleOpenProject(newId);
  };

  // Duplicate Project
  const handleDuplicateProject = async (projectId: string) => {
    try {
      await duplicateProject(projectId);
      await refreshProjectsList();
    } catch (e) {
      console.error('Duplicate error:', e);
    }
  };

  // Delete Project
  const handleDeleteProject = async (projectId: string) => {
    if (confirm('Delete this project permanently?')) {
      try {
        await deleteProject(projectId);
        await refreshProjectsList();
      } catch (e) {
        console.error('Delete error:', e);
      }
    }
  };

  // Rename Project
  const handleRenameProject = async (projectId: string, newName: string) => {
    try {
      const proj = await loadProject(projectId);
      if (proj) {
        proj.name = newName;
        proj.updatedAt = Date.now();
        await saveProject(proj);
        await refreshProjectsList();
      }
    } catch (e) {
      console.error('Rename error:', e);
    }
  };

  // Import .frameforge file
  const handleImportProjectFile = async (file: File) => {
    try {
      const text = await file.text();
      const imported = await importProjectJson(text);
      await refreshProjectsList();
      handleOpenProject(imported.id);
    } catch (e) {
      console.error('Import error:', e);
      alert('Invalid .frameforge file.');
    }
  };

  // Save App Settings
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  if (isLoading) {
    return (
      <div className="w-screen h-screen bg-[#0c0c0e] flex flex-col items-center justify-center text-zinc-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="text-xs font-mono tracking-wide text-zinc-300">
          Loading FrameForge Animation Engine...
        </span>
      </div>
    );
  }

  return (
    <DeviceFrame
      orientation={orientation}
      onToggleOrientation={() =>
        setOrientation((prev) => (prev === 'portrait' ? 'landscape' : 'portrait'))
      }
      deviceMode={deviceMode}
      onChangeDeviceMode={setDeviceMode}
    >
      {currentScreen === 'home' || !activeProject ? (
        <HomeScreen
          projects={projects}
          onOpenProject={handleOpenProject}
          onNewProjectClick={() => setShowNewProjectModal(true)}
          onDuplicateProject={handleDuplicateProject}
          onDeleteProject={handleDeleteProject}
          onRenameProject={handleRenameProject}
          onExportProject={(proj) => setExportModalProject(proj)}
          onImportProjectFile={handleImportProjectFile}
          onOpenSettings={() => setShowSettingsModal(true)}
        />
      ) : (
        <AnimationEditor
          initialProject={activeProject}
          settings={settings}
          onSaveSettings={handleSaveSettings}
          onBackToHome={async () => {
            await refreshProjectsList();
            setCurrentScreen('home');
            setActiveProject(null);
          }}
        />
      )}

      {/* New Project Setup Modal */}
      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onCreateProject={handleCreateProject}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onProjectsChanged={refreshProjectsList}
      />

      {/* Quick Export from Home Modal */}
      {exportModalProject && (
        <ExportModal
          isOpen={!!exportModalProject}
          onClose={() => setExportModalProject(null)}
          project={exportModalProject}
        />
      )}
    </DeviceFrame>
  );
}
