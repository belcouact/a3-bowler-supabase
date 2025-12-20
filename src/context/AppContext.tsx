import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { get, set } from 'idb-keyval';
import { dataService } from '../services/dataService';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { generateShortId } from '../utils/idUtils';
import { Bowler, A3Case, Metric, MetricData, MindMapNodeData, ActionPlanTaskData, DataAnalysisImage } from '../types';
import { getBowlerStatusColor } from '../utils/metricUtils';

export type { Bowler, A3Case, Metric, MetricData, MindMapNodeData, ActionPlanTaskData, DataAnalysisImage };

interface AppContextType {
  bowlers: Bowler[];
  a3Cases: A3Case[];
  addBowler: (data: Omit<Bowler, 'id'>) => void;
  updateBowler: (bowler: Bowler) => void;
  addA3Case: (caseData: Omit<A3Case, 'id'>) => void;
  updateA3Case: (a3Case: A3Case) => void;
  deleteBowler: (id: string) => void;
  deleteA3Case: (id: string) => void;
  reorderBowlers: (bowlers: Bowler[]) => void;
  reorderA3Cases: (a3Cases: A3Case[]) => void;
  isLoading: boolean;
  dashboardMarkdown: string;
  dashboardTitle: string;
  updateDashboardMarkdown: (markdown: string, title?: string) => void;
}

// Context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Default Markdown
const DEFAULT_MARKDOWN = `# A3 Bowler
## Metric Bowler
- Track KPIs
  - Safety
  - Quality
  - Delivery
  - Cost
- Monthly Targets
  - Plan
  - Actual
- Gap Analysis
  - Deviation
  - Reason
## A3 Problem Solving
- Problem Statement
  - Description
  - Impact
- Root Cause Analysis
  - 5 Whys
  - Fishbone
- Action Plan
  - What
  - Who
  - When
`;

// Provider
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { error } = useToast();
  const [bowlers, setBowlers] = useState<Bowler[]>([]);
  const [a3Cases, setA3Cases] = useState<A3Case[]>([]);
  const [dashboardMarkdown, setDashboardMarkdown] = useState<string>(DEFAULT_MARKDOWN);
  const [dashboardTitle, setDashboardTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
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

  const loadUserData = useCallback(async (username: string) => {
    if (!isMountedRef.current) return;
    setIsLoading(true);
    
    // Clear any existing timeout
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);

    // Set 30s timeout
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
    }, 30000);

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
            const markdown = data.dashboardMarkdown || DEFAULT_MARKDOWN;
            const title = data.dashboardTitle || extractTitleFromMarkdown(markdown);
            setBowlers(data.bowlers || []);
            setA3Cases(data.a3Cases || []);
            setDashboardMarkdown(markdown);
            setDashboardTitle(title);
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
            const markdown = data.dashboardMarkdown || DEFAULT_MARKDOWN;
            const title = data.dashboardTitle || extractTitleFromMarkdown(markdown);
            setBowlers(data.bowlers || []);
            setA3Cases(data.a3Cases || []);
            setDashboardMarkdown(markdown);
            setDashboardTitle(title);
            try {
                await set(localDataKey, { 
                    bowlers: data.bowlers || [], 
                    a3Cases: data.a3Cases || [],
                    dashboardMarkdown: markdown,
                    dashboardTitle: title
                });
            } catch (e) {
                console.warn("Failed to update local cache.", e);
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
        setDashboardMarkdown(DEFAULT_MARKDOWN);
        setDashboardTitle('');
    }
    return () => {
        if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, [user, loadUserData]);

  const saveToLocalCache = (newBowlers: Bowler[], newA3Cases: A3Case[], newMarkdown: string, newTitle: string) => {
    if (user) {
      // 1. Save to IndexedDB immediately (Local Cache)
      const localDataKey = `user_data_${user.username}`;
      
      set(localDataKey, { 
          bowlers: newBowlers, 
          a3Cases: newA3Cases,
          dashboardMarkdown: newMarkdown,
          dashboardTitle: newTitle
      }).catch(e => {
        console.error("Local Cache save failed", e);
      });
      // Note: Auto-save to backend is DISABLED. 
      // Saving to backend only happens when the user manually clicks the "Save" button in Layout.tsx.
    }
  };

  const updateDashboardMarkdown = (markdown: string, title?: string) => {
      const effectiveTitle = title ?? dashboardTitle;
      setDashboardMarkdown(markdown);
      setDashboardTitle(effectiveTitle);
      saveToLocalCache(bowlers, a3Cases, markdown, effectiveTitle);
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

  const addA3Case = (caseData: Omit<A3Case, 'id'>) => {
    const newCase = {
      id: generateShortId(),
      ...caseData
    };
    setA3Cases(prev => {
      const newA3Cases = [...prev, newCase];
      saveToLocalCache(bowlers, newA3Cases, dashboardMarkdown, dashboardTitle);
      return newA3Cases;
    });
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
        dashboardMarkdown,
        dashboardTitle,
        updateDashboardMarkdown
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
