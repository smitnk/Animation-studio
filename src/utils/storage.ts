/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * FrameForge - Local Offline Storage Engine (IndexedDB with Fallback)
 */

import { Project, AppSettings, Palette } from '../types';

const DB_NAME = 'FrameForgeDB';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';
const STORE_SETTINGS = 'settings';
const STORE_PALETTES = 'palettes';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORE_PALETTES)) {
        db.createObjectStore(STORE_PALETTES, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  palmRejection: true,
  pressureSensitivity: true,
  defaultBrushSize: 8,
  defaultOpacity: 1,
  defaultFps: 12,
  deviceSimMode: 'phone',
  orientation: 'portrait',
};

export const DEFAULT_PALETTES: Palette[] = [
  {
    id: 'basic-colors',
    name: 'Classic Animation',
    colors: [
      '#000000',
      '#FFFFFF',
      '#EF4444',
      '#F97316',
      '#FBBF24',
      '#22C55E',
      '#06B6D4',
      '#3B82F6',
      '#8B5CF6',
      '#EC4899',
      '#78716C',
      '#475569',
    ],
  },
  {
    id: 'skin-tones',
    name: 'Character & Skin',
    colors: [
      '#FFF0E1',
      '#FAD4B2',
      '#E9B58B',
      '#C9885C',
      '#8C5332',
      '#4E2816',
      '#E25F5F',
      '#291811',
    ],
  },
  {
    id: 'retro-synth',
    name: 'Cyberpunk & Neon',
    colors: [
      '#FF007F',
      '#00F0FF',
      '#FFE600',
      '#7928CA',
      '#10B981',
      '#1E1B4B',
      '#F43F5E',
      '#38BDF8',
    ],
  },
];

// Helper to create starter bouncing ball animation project
export function createStarterProject(): Project {
  const projectId = 'starter-bouncing-ball';
  const width = 1080;
  const height = 1920;
  const layer1Id = 'layer-bg';
  const layer2Id = 'layer-ball';

  const layersMeta = [
    { id: layer1Id, name: 'Background Floor', isVisible: true, isLocked: false, opacity: 1 },
    { id: layer2Id, name: 'Bouncing Ball', isVisible: true, isLocked: false, opacity: 1 },
  ];

  // 6 frames of a bouncing ball with squash and stretch
  const ballPositions = [
    { y: 550, rx: 65, ry: 65, squash: false },
    { y: 850, rx: 55, ry: 80, squash: false },
    { y: 1200, rx: 45, ry: 95, squash: false },
    { y: 1450, rx: 110, ry: 35, squash: true }, // Impact squash
    { y: 1150, rx: 45, ry: 95, squash: false },
    { y: 750, rx: 55, ry: 75, squash: false },
  ];

  const frames = ballPositions.map((pos, index) => {
    return {
      id: `frame-${index + 1}`,
      frameNumber: index + 1,
      durationMultiplier: 1,
      layers: {
        [layer1Id]: {
          id: layer1Id,
          elements: [
            // Floor line
            {
              id: `floor-${index}`,
              type: 'shape' as const,
              shapeType: 'line' as const,
              color: '#3f3f46',
              width: 8,
              opacity: 1,
              startX: 150,
              startY: 1480,
              endX: 930,
              endY: 1480,
            },
          ],
        },
        [layer2Id]: {
          id: layer2Id,
          elements: [
            // Ball ellipse
            {
              id: `ball-${index}`,
              type: 'shape' as const,
              shapeType: 'ellipse' as const,
              color: '#ef4444',
              fillColor: '#f97316',
              isFilled: true,
              width: 6,
              opacity: 1,
              startX: 540 - pos.rx,
              startY: pos.y - pos.ry,
              endX: 540 + pos.rx,
              endY: pos.y + pos.ry,
            },
          ],
        },
      },
    };
  });

  return {
    id: projectId,
    name: 'Bouncing Ball Demo',
    width,
    height,
    fps: 12,
    backgroundType: 'color',
    backgroundColor: '#18181b',
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now(),
    layersMeta,
    frames,
  };
}

export async function getAllProjects(): Promise<Project[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROJECTS, 'readonly');
      const store = tx.objectStore(STORE_PROJECTS);
      const request = store.getAll();

      request.onsuccess = () => {
        const result = request.result as Project[];
        if (!result || result.length === 0) {
          // Initialize starter project
          const starter = createStarterProject();
          saveProject(starter).then(() => resolve([starter]));
        } else {
          // Sort by updatedAt descending
          resolve(result.sort((a, b) => b.updatedAt - a.updatedAt));
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    // LocalStorage fallback
    const raw = localStorage.getItem('frameforge_projects');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return parsed.sort((a: Project, b: Project) => b.updatedAt - a.updatedAt);
      } catch {
        // Continue
      }
    }
    const starter = createStarterProject();
    localStorage.setItem('frameforge_projects', JSON.stringify([starter]));
    return [starter];
  }
}

export async function getProjectById(id: string): Promise<Project | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROJECTS, 'readonly');
      const store = tx.objectStore(STORE_PROJECTS);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    const raw = localStorage.getItem('frameforge_projects');
    if (raw) {
      try {
        const list = JSON.parse(raw) as Project[];
        return list.find((p) => p.id === id) || null;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function saveProject(project: Project): Promise<void> {
  const projectToSave: Project = {
    ...project,
    updatedAt: Date.now(),
  };

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROJECTS, 'readwrite');
      const store = tx.objectStore(STORE_PROJECTS);
      const request = store.put(projectToSave);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // LocalStorage fallback
    const list = await getAllProjects();
    const index = list.findIndex((p) => p.id === projectToSave.id);
    if (index >= 0) {
      list[index] = projectToSave;
    } else {
      list.unshift(projectToSave);
    }
    localStorage.setItem('frameforge_projects', JSON.stringify(list));
  }
}

export async function deleteProject(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROJECTS, 'readwrite');
      const store = tx.objectStore(STORE_PROJECTS);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    const list = await getAllProjects();
    const filtered = list.filter((p) => p.id !== id);
    localStorage.setItem('frameforge_projects', JSON.stringify(filtered));
  }
}

export async function duplicateProject(id: string): Promise<Project | null> {
  const project = await getProjectById(id);
  if (!project) return null;

  const duplicated: Project = {
    ...JSON.parse(JSON.stringify(project)),
    id: `project-${Date.now()}`,
    name: `${project.name} (Copy)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await saveProject(duplicated);
  return duplicated;
}

export async function getAppSettings(): Promise<AppSettings> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_SETTINGS, 'readonly');
      const store = tx.objectStore(STORE_SETTINGS);
      const req = store.get('app_settings');
      req.onsuccess = () => {
        if (req.result?.value) {
          resolve({ ...DEFAULT_SETTINGS, ...req.result.value });
        } else {
          resolve(DEFAULT_SETTINGS);
        }
      };
      req.onerror = () => resolve(DEFAULT_SETTINGS);
    });
  } catch {
    const raw = localStorage.getItem('frameforge_settings');
    if (raw) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  }
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SETTINGS, 'readwrite');
      const store = tx.objectStore(STORE_SETTINGS);
      const req = store.put({ key: 'app_settings', value: settings });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    localStorage.setItem('frameforge_settings', JSON.stringify(settings));
  }
}

export async function getSavedPalettes(): Promise<Palette[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_PALETTES, 'readonly');
      const store = tx.objectStore(STORE_PALETTES);
      const req = store.getAll();
      req.onsuccess = () => {
        if (req.result && req.result.length > 0) {
          resolve(req.result);
        } else {
          resolve(DEFAULT_PALETTES);
        }
      };
      req.onerror = () => resolve(DEFAULT_PALETTES);
    });
  } catch {
    const raw = localStorage.getItem('frameforge_palettes');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return DEFAULT_PALETTES;
      }
    }
    return DEFAULT_PALETTES;
  }
}

export async function saveSavedPalettes(palettes: Palette[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_PALETTES, 'readwrite');
    const store = tx.objectStore(STORE_PALETTES);
    store.clear();
    palettes.forEach((p) => store.put(p));
  } catch {
    localStorage.setItem('frameforge_palettes', JSON.stringify(palettes));
  }
}

// Aliases and additional utility exports for app workflow
export async function initDatabase(): Promise<void> {
  try {
    await openDB();
  } catch {
    // fallback gracefully
  }
}

export const loadAllProjects = getAllProjects;
export const loadProject = getProjectById;
export const loadSettings = getAppSettings;
export const saveSettings = saveAppSettings;

export async function clearAllProjects(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_PROJECTS, 'readwrite');
    tx.objectStore(STORE_PROJECTS).clear();
  } catch {
    localStorage.removeItem('frameforge_projects');
  }
}

export async function exportAllProjectsJson(): Promise<string> {
  const projects = await getAllProjects();
  return JSON.stringify(projects, null, 2);
}

export async function importProjectJson(jsonString: string): Promise<Project> {
  const data = JSON.parse(jsonString);
  const project: Project = {
    ...data,
    id: `project-${Date.now()}`,
    updatedAt: Date.now(),
  };
  await saveProject(project);
  return project;
}

