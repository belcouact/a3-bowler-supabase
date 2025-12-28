import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { get, set } from 'idb-keyval';
import { dataService } from '../services/dataService';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { generateShortId } from '../utils/idUtils';
import {
  Bowler,
  A3Case,
  Metric,
  MetricData,
  MindMapNodeData,
  ActionPlanTaskData,
  DataAnalysisImage,
  DashboardMindmap,
  AIModelKey,
  DashboardSettings,
} from '../types';
import { getBowlerStatusColor } from '../utils/metricUtils';

export type {
  Bowler,
  A3Case,
  Metric,
  MetricData,
  MindMapNodeData,
  ActionPlanTaskData,
  DataAnalysisImage,
  DashboardMindmap,
};

interface AppContextType {
  bowlers: Bowler[];
  a3Cases: A3Case[];
  addBowler: (data: Omit<Bowler, 'id'>) => void;
  updateBowler: (bowler: Bowler) => void;
  addA3Case: (caseData: Omit<A3Case, 'id'>) => A3Case;
  updateA3Case: (a3Case: A3Case) => void;
  deleteBowler: (id: string) => void;
  deleteA3Case: (id: string) => void;
  reorderBowlers: (bowlers: Bowler[]) => void;
  reorderA3Cases: (a3Cases: A3Case[]) => void;
  isLoading: boolean;
  selectedModel: AIModelKey;
  setSelectedModel: (model: AIModelKey) => void;
  dashboardMarkdown: string;
  dashboardTitle: string;
  dashboardMindmaps: DashboardMindmap[];
  activeMindmapId: string | null;
  setActiveMindmap: (id: string) => void;
  deleteMindmap: (id: string) => void;
  updateDashboardMarkdown: (
    markdown: string,
    title?: string,
    options?: { createNew?: boolean; description?: string }
  ) => void;
  dashboardSettings: DashboardSettings;
  setDashboardSettings: (value: DashboardSettings | ((prev: DashboardSettings) => DashboardSettings)) => void;
}

// Context
const AppContext = createContext<AppContextType | undefined>(undefined);

const getValidModel = (model?: string | null): AIModelKey => {
  const fallback: AIModelKey = 'deepseek';
  if (model === 'gemini' || model === 'deepseek' || model === 'kimi' || model === 'glm') {
    return model;
  }
  return fallback;
};

// Provider
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { error } = useToast();
  const [bowlers, setBowlers] = useState<Bowler[]>([]);
  const [a3Cases, setA3Cases] = useState<A3Case[]>([]);
  const [dashboardMarkdown, setDashboardMarkdown] = useState<string>('');
  const [dashboardTitle, setDashboardTitle] = useState<string>('');
  const [dashboardMindmaps, setDashboardMindmaps] = useState<DashboardMindmap[]>([]);
  const [activeMindmapId, setActiveMindmapId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModelKey>('deepseek');
  const [dashboardSettings, setDashboardSettings] = useState<DashboardSettings>({ aiModel: 'deepseek' });
  
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const extractTitleFromMarkdown = (markdown: string): string => {
    const lines = markdown.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#')) {
        return trimmed.replace(/^#+\s*/, '');
      }
    }
    return '';
  };

  const handleSetSelectedModel = (model: AIModelKey) => {
    setSelectedModel(model);
    setDashboardSettings(prev => ({
      ...prev,
      aiModel: model,
    }));
  };

  const loadUserData = useCallback(async (username: string) => {
    if (!isMountedRef.current) return;
    setIsLoading(true);
    
    // Clear any existing timeout
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);

    // Set 60s timeout
    loadingTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
            setIsLoading(false);
            error("Data loading timed out", {
                duration: 0,
                action: {
                    label: "Retry",
                    onClick: () => loadUserData(username)
                }
            });
        }
    }, 60000);

    // 1. Try Local Storage / IndexedDB (Instant)
    const localDataKey = `user_data_${username}`;
    
    try {
        // Try IndexedDB first
        let localData = await get(localDataKey);
        
        // If not in IndexedDB, try localStorage (Migration)
        if (!localData) {
            const lsData = localStorage.getItem(localDataKey);
            if (lsData) {
                try {
                    localData = JSON.parse(lsData);
                    // Migrate to IndexedDB
                    await set(localDataKey, localData);
                    // Clear from localStorage to free space
                    localStorage.removeItem(localDataKey);
                } catch (e) {
                    console.error("Failed to parse/migrate localStorage data", e);
                }
            }
        }

        if (localData && isMountedRef.current) {
            const data = (typeof localData === 'string') ? JSON.parse(localData) : localData;
            const mindmaps = (data.dashboardMindmaps || []) as DashboardMindmap[];
            const cachedActiveId = (data.activeMindmapId as string | undefined) || null;
            const rawDashboardSettings = (data.dashboardSettings || {}) as DashboardSettings;
            const savedModel = rawDashboardSettings.aiModel as AIModelKey | undefined;
            const effectiveModel = getValidModel(savedModel);

            setBowlers(data.bowlers || []);
            setA3Cases(data.a3Cases || []);
            setSelectedModel(effectiveModel);
            setDashboardSettings({
              ...rawDashboardSettings,
              aiModel: effectiveModel,
            });

            if (mindmaps.length > 0) {
                const activeId = cachedActiveId && mindmaps.some(m => m.id === cachedActiveId)
                  ? cachedActiveId
                  : mindmaps[0].id;
                const active = mindmaps.find(m => m.id === activeId)!;
                setDashboardMindmaps(mindmaps);
                setActiveMindmapId(activeId);
                setDashboardMarkdown(active.markdown);
                setDashboardTitle(active.title);
            } else {
                setDashboardMindmaps([]);
                setActiveMindmapId(null);
                setDashboardMarkdown('');
                setDashboardTitle('');
            }
        }
    } catch (e) {
        console.error("Failed to load local data", e);
    }

    // 2. Load from backend
    try {
        const data = await dataService.loadData(username);
        
        // If we are here, clear timeout
        if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
        
        if (isMountedRef.current && data.success) {
            const mindmaps = (data.dashboardMindmaps || []) as DashboardMindmap[];
            const backendActiveId = (data.activeMindmapId as string | undefined) || null;
            const rawDashboardSettings = (data.dashboardSettings || {}) as DashboardSettings;
            const savedModel = rawDashboardSettings.aiModel as AIModelKey | undefined;
            const effectiveModel = getValidModel(savedModel);

            setBowlers(data.bowlers || []);
            setA3Cases(data.a3Cases || []);
            setSelectedModel(effectiveModel);
            setDashboardSettings({
              ...rawDashboardSettings,
              aiModel: effectiveModel,
            });

            if (mindmaps.length > 0) {
                const activeId = backendActiveId && mindmaps.some(m => m.id === backendActiveId)
                  ? backendActiveId
                  : mindmaps[0].id;
                const active = mindmaps.find(m => m.id === activeId)!;
                setDashboardMindmaps(mindmaps);
                setActiveMindmapId(activeId);
                setDashboardMarkdown(active.markdown);
                setDashboardTitle(active.title);
                try {
                    await set(localDataKey, { 
                        bowlers: data.bowlers || [], 
                        a3Cases: data.a3Cases || [],
                        dashboardMarkdown: active.markdown,
                        dashboardTitle: active.title,
                        dashboardMindmaps: mindmaps,
                        activeMindmapId: activeId,
                        dashboardSettings: {
                          ...rawDashboardSettings,
                          aiModel: effectiveModel,
                        }
                    });
                } catch (e) {
                    console.warn("Failed to update local cache.", e);
                }
            } else {
                setDashboardMindmaps([]);
                setActiveMindmapId(null);
                setDashboardMarkdown('');
                setDashboardTitle('');
                try {
                    await set(localDataKey, { 
                        bowlers: data.bowlers || [], 
                        a3Cases: data.a3Cases || [],
                        dashboardMarkdown: '',
                        dashboardTitle: '',
                        dashboardMindmaps: [],
                        activeMindmapId: null,
                        dashboardSettings: {
                          ...rawDashboardSettings,
                          aiModel: effectiveModel,
                        }
                    });
                } catch (e) {
                    console.warn("Failed to update local cache.", e);
                }
            }
        } else if (!data.success) {
            throw new Error(data.message || "Failed to load data");
        }
    } catch (err) {
        if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
        console.error("Failed to load user data:", err);
        if (isMountedRef.current) {
             error("Failed to load data", {
                duration: 0,
                action: {
                    label: "Retry",
                    onClick: () => loadUserData(username)
                }
            });
        }
    } finally {
        if (isMountedRef.current) setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    if (user) {
        loadUserData(user.username);
    } else {
        setBowlers([]);
        setA3Cases([]);
        setDashboardMindmaps([]);
        setActiveMindmapId(null);
        setDashboardMarkdown('');
        setDashboardTitle('');
        setSelectedModel('deepseek');
        setDashboardSettings({ aiModel: 'deepseek' });
    }
    return () => {
        if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, [user, loadUserData]);

  const saveToLocalCache = (
    newBowlers: Bowler[],
    newA3Cases: A3Case[],
    newMarkdown: string,
    newTitle: string,
    newMindmaps: DashboardMindmap[] = dashboardMindmaps,
    newActiveMindmapId: string | null = activeMindmapId
  ) => {
    if (user) {
      // 1. Save to IndexedDB immediately (Local Cache)
      const localDataKey = `user_data_${user.username}`;
      
      set(localDataKey, { 
          bowlers: newBowlers, 
          a3Cases: newA3Cases,
          dashboardMarkdown: newMarkdown,
          dashboardTitle: newTitle,
          dashboardMindmaps: newMindmaps,
          activeMindmapId: newActiveMindmapId,
          dashboardSettings,
      }).catch(e => {
        console.error("Local Cache save failed", e);
      });
      // Note: Auto-save to backend is DISABLED. 
      // Saving to backend only happens when the user manually clicks the "Save" button in Layout.tsx.
    }
  };

  const setActiveMindmap = (id: string) => {
    setDashboardMindmaps(prev => {
      if (prev.length === 0) {
        setActiveMindmapId(null);
        setDashboardMarkdown('');
        setDashboardTitle('');
        saveToLocalCache(bowlers, a3Cases, '', '', [], null);
        return prev;
      }
      const target = prev.find(m => m.id === id) || prev[0];
      setActiveMindmapId(target.id);
      setDashboardMarkdown(target.markdown);
      setDashboardTitle(target.title);
      saveToLocalCache(bowlers, a3Cases, target.markdown, target.title, prev, target.id);
      return prev;
    });
  };

  const updateDashboardMarkdown = (
    markdown: string,
    title?: string,
    options?: { createNew?: boolean; description?: string }
  ) => {
      const createNew = options?.createNew ?? false;
      const baseTitle = title ?? (extractTitleFromMarkdown(markdown) || 'Mindmap');
      const description = options?.description;

      setDashboardMindmaps(prev => {
        const now = new Date().toISOString();
        let newMindmaps: DashboardMindmap[];
        let newActiveId: string;

        if (!createNew && activeMindmapId && prev.some(m => m.id === activeMindmapId)) {
          newMindmaps = prev.map(m =>
            m.id === activeMindmapId
              ? { ...m, title: baseTitle, markdown, updatedAt: now, description: description ?? m.description }
              : m
          );
          newActiveId = activeMindmapId;
        } else {
          const id = generateShortId();
          const newEntry: DashboardMindmap = {
            id,
            title: baseTitle,
            description,
            markdown,
            createdAt: now
          };
          newMindmaps = [...prev, newEntry];
          newActiveId = id;
        }

        setActiveMindmapId(newActiveId);
        setDashboardMarkdown(markdown);
        setDashboardTitle(baseTitle);
        saveToLocalCache(bowlers, a3Cases, markdown, baseTitle, newMindmaps, newActiveId);
        return newMindmaps;
      });
  };

  const deleteMindmap = (id: string) => {
    setDashboardMindmaps(prev => {
      const newMindmaps = prev.filter(m => m.id !== id);
      let newActiveId: string | null = activeMindmapId;
      let newMarkdown = dashboardMarkdown;
      let newTitle = dashboardTitle;

      if (activeMindmapId === id) {
        if (newMindmaps.length > 0) {
          const fallback = newMindmaps[0];
          newActiveId = fallback.id;
          newMarkdown = fallback.markdown;
          newTitle = fallback.title;
        } else {
          newActiveId = null;
          newMarkdown = '';
          newTitle = '';
        }
      }

      setActiveMindmapId(newActiveId);
      setDashboardMarkdown(newMarkdown);
      setDashboardTitle(newTitle);
      saveToLocalCache(bowlers, a3Cases, newMarkdown, newTitle, newMindmaps, newActiveId);
      return newMindmaps;
    });
  };

  const addBowler = (data: Omit<Bowler, 'id'>) => {
    const newBowler = {
      id: generateShortId(),
      ...data,
    };
    setBowlers(prev => {
      const newBowlers = [...prev, newBowler];
      saveToLocalCache(newBowlers, a3Cases, dashboardMarkdown, dashboardTitle);
      return newBowlers;
    });
  };

  const updateBowler = (bowler: Bowler) => {
    // Automatically calculate status color on update
    const statusColor = getBowlerStatusColor(bowler);
    const updatedBowler = { ...bowler, statusColor };

    setBowlers(prev => {
      const newBowlers = prev.map((b) => (b.id === updatedBowler.id ? updatedBowler : b));
      saveToLocalCache(newBowlers, a3Cases, dashboardMarkdown, dashboardTitle);
      return newBowlers;
    });
  };

  const addA3Case = (caseData: Omit<A3Case, 'id'>): A3Case => {
    const newCase: A3Case = {
      id: generateShortId(),
      ...caseData
    };
    setA3Cases(prev => {
      const newA3Cases = [...prev, newCase];
      saveToLocalCache(bowlers, newA3Cases, dashboardMarkdown, dashboardTitle);
      return newA3Cases;
    });
    return newCase;
  };

  const updateA3Case = (updatedCase: A3Case) => {
    setA3Cases(prev => {
      const newA3Cases = prev.map(c => c.id === updatedCase.id ? updatedCase : c);
      saveToLocalCache(bowlers, newA3Cases, dashboardMarkdown, dashboardTitle);
      return newA3Cases;
    });
  };

  const deleteBowler = (id: string) => {
    setBowlers(prev => {
      const newBowlers = prev.filter((b) => b.id !== id);
      saveToLocalCache(newBowlers, a3Cases, dashboardMarkdown, dashboardTitle);
      return newBowlers;
    });
  };

  const deleteA3Case = (id: string) => {
    setA3Cases(prev => {
      const newA3Cases = prev.filter((c) => c.id !== id);
      saveToLocalCache(bowlers, newA3Cases, dashboardMarkdown, dashboardTitle);
      return newA3Cases;
    });
  };

  const reorderBowlers = (newBowlers: Bowler[]) => {
    setBowlers(newBowlers);
    saveToLocalCache(newBowlers, a3Cases, dashboardMarkdown, dashboardTitle);
  };

  const reorderA3Cases = (newA3Cases: A3Case[]) => {
    setA3Cases(newA3Cases);
    saveToLocalCache(bowlers, newA3Cases, dashboardMarkdown, dashboardTitle);
  };

  return (
    <AppContext.Provider
      value={{
        bowlers,
        a3Cases,
        addBowler,
        updateBowler,
        addA3Case,
        updateA3Case,
        deleteBowler,
        deleteA3Case,
        reorderBowlers,
        reorderA3Cases,
        isLoading,
        selectedModel,
        setSelectedModel: handleSetSelectedModel,
        dashboardMarkdown,
        dashboardTitle,
        dashboardMindmaps,
        activeMindmapId,
        setActiveMindmap,
        deleteMindmap,
        updateDashboardMarkdown,
        dashboardSettings,
        setDashboardSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// Hook
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
