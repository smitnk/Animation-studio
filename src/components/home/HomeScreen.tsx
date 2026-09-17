/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * FrameForge - Projects Dashboard (Home Screen)
 */

import React, { useState, useRef } from 'react';
import {
  Film,
  Plus,
  Search,
  SlidersHorizontal,
  Grid,
  List,
  MoreVertical,
  Play,
  Copy,
  Trash2,
  Share2,
  FolderOpen,
  Info,
  Clock,
  Layers,
  Upload,
  Edit2,
  Sparkles,
  Settings as SettingsIcon,
} from 'lucide-react';
import { Project } from '../../types';

interface HomeScreenProps {
  projects: Project[];
  onOpenProject: (projectId: string) => void;
  onNewProjectClick: () => void;
  onDuplicateProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onRenameProject: (projectId: string, newName: string) => void;
  onExportProject: (project: Project) => void;
  onImportProjectFile: (file: File) => void;
  onOpenSettings: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  projects,
  onOpenProject,
  onNewProjectClick,
  onDuplicateProject,
  onDeleteProject,
  onRenameProject,
  onExportProject,
  onImportProjectFile,
  onOpenSettings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'modified' | 'name' | 'frames' | 'fps'>('modified');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter & sort
  const filteredProjects = projects
    .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'modified') return b.updatedAt - a.updatedAt;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'frames') return b.frames.length - a.frames.length;
      if (sortBy === 'fps') return b.fps - a.fps;
      return 0;
    });

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const now = new Date();
    const diffHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
    if (diffHours < 48) return 'Yesterday';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const startRename = (p: Project) => {
    setRenamingId(p.id);
    setRenameInput(p.name);
    setActiveMenuId(null);
  };

  const submitRename = (id: string) => {
    if (renameInput.trim()) {
      onRenameProject(id, renameInput.trim());
    }
    setRenamingId(null);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#121214] text-zinc-100 overflow-hidden select-none">
      {/* Top Header */}
      <header className="px-4 py-3 bg-[#18181b] border-b border-white/10 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-black font-bold shadow-md shadow-amber-500/20">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              FrameForge
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                v1.0
              </span>
            </h1>
            <p className="text-[11px] text-zinc-400">Mobile 2D Animation Studio</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Import .frameforge file */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".frameforge,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onImportProjectFile(file);
                e.target.value = '';
              }
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Import .frameforge Project"
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-white/5 transition-colors"
          >
            <Upload className="w-4 h-4" />
          </button>

          {/* New Project Primary CTA */}
          <button
            onClick={onNewProjectClick}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Project</span>
          </button>
        </div>
      </header>

      {/* Filter and Search Bar */}
      <div className="px-4 py-2.5 bg-[#141417] border-b border-white/5 flex items-center gap-2 flex-shrink-0">
        <div className="flex-1 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#1a1a1e] border border-white/5 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div className="flex items-center gap-1 bg-[#1a1a1e] border border-white/5 rounded-xl p-0.5">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'grid' ? 'bg-white/10 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'list' ? 'bg-white/10 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="bg-[#1a1a1e] border border-white/5 text-zinc-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none"
        >
          <option value="modified">Recent</option>
          <option value="name">Name</option>
          <option value="frames">Frames</option>
          <option value="fps">FPS</option>
        </select>
      </div>

      {/* Main Project List Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredProjects.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-white/10 flex items-center justify-center text-zinc-500 mb-3">
              <Film className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-200">No animations found</h3>
            <p className="text-xs text-zinc-500 max-w-xs mt-1">
              Create your first 2D animation project or import an existing .frameforge file to get started.
            </p>
            <button
              onClick={onNewProjectClick}
              className="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4" />
              Start New Animation
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredProjects.map((project) => {
              const activeMenu = activeMenuId === project.id;
              const isRenaming = renamingId === project.id;
              const firstFrameThumb = project.frames[0]?.thumbnail;

              return (
                <div
                  key={project.id}
                  className="group bg-[#18181b] border border-white/5 hover:border-amber-500/40 rounded-2xl overflow-hidden flex flex-col transition-all shadow-sm hover:shadow-md relative"
                >
                  {/* Thumbnail / Click to Open */}
                  <div
                    onClick={() => onOpenProject(project.id)}
                    className="relative aspect-video w-full bg-[#141416] checkerboard-bg cursor-pointer overflow-hidden flex items-center justify-center"
                  >
                    {firstFrameThumb ? (
                      <img
                        src={firstFrameThumb}
                        alt={project.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-zinc-600 gap-1">
                        <Film className="w-6 h-6 stroke-[1.5]" />
                        <span className="text-[10px] font-mono">Frame 1</span>
                      </div>
                    )}

                    {/* Frame Count Overlay */}
                    <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[10px] font-mono text-zinc-300 border border-white/10 flex items-center gap-1">
                      <Layers className="w-2.5 h-2.5 text-amber-400" />
                      <span>{project.frames.length}f</span>
                    </div>

                    {/* FPS Overlay */}
                    <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[10px] font-mono text-amber-400 border border-white/10">
                      {project.fps} FPS
                    </div>
                  </div>

                  {/* Info Footer */}
                  <div className="p-2.5 flex-1 flex flex-col justify-between bg-[#18181b]">
                    <div className="flex items-start justify-between gap-1">
                      {isRenaming ? (
                        <input
                          autoFocus
                          type="text"
                          value={renameInput}
                          onChange={(e) => setRenameInput(e.target.value)}
                          onBlur={() => submitRename(project.id)}
                          onKeyDown={(e) => e.key === 'Enter' && submitRename(project.id)}
                          className="w-full px-1.5 py-0.5 bg-black text-xs font-semibold text-zinc-100 rounded border border-amber-500"
                        />
                      ) : (
                        <h4
                          onClick={() => onOpenProject(project.id)}
                          className="text-xs font-bold text-zinc-100 truncate cursor-pointer hover:text-amber-400 transition-colors"
                        >
                          {project.name}
                        </h4>
                      )}

                      {/* Menu trigger */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenu ? null : project.id);
                        }}
                        className="p-1 -mr-1 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                      <span>
                        {project.width}×{project.height}
                      </span>
                      <span>{formatDate(project.updatedAt)}</span>
                    </div>
                  </div>

                  {/* Context Action Menu Dropdown */}
                  {activeMenu && (
                    <div
                      className="absolute right-2 top-10 z-30 w-36 bg-[#1f1f24] border border-white/10 rounded-xl shadow-2xl py-1 text-xs text-zinc-200 divide-y divide-white/5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="py-0.5">
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            onOpenProject(project.id);
                          }}
                          className="w-full px-2.5 py-1.5 text-left hover:bg-white/10 flex items-center gap-2 text-zinc-200"
                        >
                          <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                          Open
                        </button>
                        <button
                          onClick={() => startRename(project)}
                          className="w-full px-2.5 py-1.5 text-left hover:bg-white/10 flex items-center gap-2 text-zinc-200"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Rename
                        </button>
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            onDuplicateProject(project.id);
                          }}
                          className="w-full px-2.5 py-1.5 text-left hover:bg-white/10 flex items-center gap-2 text-zinc-200"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Duplicate
                        </button>
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            onExportProject(project);
                          }}
                          className="w-full px-2.5 py-1.5 text-left hover:bg-white/10 flex items-center gap-2 text-zinc-200"
                        >
                          <Share2 className="w-3.5 h-3.5 text-sky-400" />
                          Export
                        </button>
                      </div>
                      <div className="py-0.5">
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            onDeleteProject(project.id);
                          }}
                          className="w-full px-2.5 py-1.5 text-left hover:bg-red-500/20 text-red-400 flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* List Mode */
          <div className="space-y-2">
            {filteredProjects.map((project) => {
              const activeMenu = activeMenuId === project.id;
              const firstFrameThumb = project.frames[0]?.thumbnail;

              return (
                <div
                  key={project.id}
                  onClick={() => onOpenProject(project.id)}
                  className="bg-[#18181b] border border-white/5 hover:border-amber-500/40 p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all relative"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 h-14 rounded-lg bg-[#141416] checkerboard-bg flex-shrink-0 overflow-hidden flex items-center justify-center border border-white/5">
                      {firstFrameThumb ? (
                        <img src={firstFrameThumb} alt={project.name} className="w-full h-full object-contain" />
                      ) : (
                        <Film className="w-5 h-5 text-zinc-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-zinc-100 truncate">{project.name}</h4>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500 font-mono">
                        <span>{project.width}×{project.height}</span>
                        <span>•</span>
                        <span className="text-amber-400">{project.fps} FPS</span>
                        <span>•</span>
                        <span>{project.frames.length} frames</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
                      {formatDate(project.updatedAt)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenu ? null : project.id);
                      }}
                      className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-white/5"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>

                  {activeMenu && (
                    <div
                      className="absolute right-3 top-12 z-30 w-36 bg-[#1f1f24] border border-white/10 rounded-xl shadow-2xl py-1 text-xs text-zinc-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          setActiveMenuId(null);
                          onOpenProject(project.id);
                        }}
                        className="w-full px-2.5 py-1.5 text-left hover:bg-white/10 flex items-center gap-2"
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                        Open
                      </button>
                      <button
                        onClick={() => startRename(project)}
                        className="w-full px-2.5 py-1.5 text-left hover:bg-white/10 flex items-center gap-2"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Rename
                      </button>
                      <button
                        onClick={() => {
                          setActiveMenuId(null);
                          onDuplicateProject(project.id);
                        }}
                        className="w-full px-2.5 py-1.5 text-left hover:bg-white/10 flex items-center gap-2"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Duplicate
                      </button>
                      <button
                        onClick={() => {
                          setActiveMenuId(null);
                          onExportProject(project);
                        }}
                        className="w-full px-2.5 py-1.5 text-left hover:bg-white/10 flex items-center gap-2"
                      >
                        <Share2 className="w-3.5 h-3.5 text-sky-400" />
                        Export
                      </button>
                      <button
                        onClick={() => {
                          setActiveMenuId(null);
                          onDeleteProject(project.id);
                        }}
                        className="w-full px-2.5 py-1.5 text-left hover:bg-red-500/20 text-red-400 flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Android Navigation Bar */}
      <footer className="h-12 bg-[#18181b] border-t border-white/10 px-6 flex items-center justify-around flex-shrink-0 text-xs">
        <button className="flex flex-col items-center gap-0.5 text-amber-400 font-semibold">
          <Film className="w-4 h-4" />
          <span className="text-[10px]">Projects</span>
        </button>
        <button
          onClick={onOpenSettings}
          className="flex flex-col items-center gap-0.5 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <SettingsIcon className="w-4 h-4" />
          <span className="text-[10px]">Settings</span>
        </button>
      </footer>
    </div>
  );
};
