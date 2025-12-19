import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
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
  updateDashboardMarkdown: (markdown: string) => void;
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
  const [isLoading, setIsLoading] = useState(false);
  
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const loadUserData = useCallback(async (username: string) => {
    if (!isMountedRef.current) return;
    setIsLoading(true);
    
    // Clear any existing timeout
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);

    // Set 15s timeout
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
    }, 15000);

    // 1. Try Local Storage first (Instant)
    const localDataKey = `user_data_${username}`;
    const localData = localStorage.getItem(localDataKey);
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        if (isMountedRef.current) {
            setBowlers(parsed.bowlers || []);
            setA3Cases(parsed.a3Cases || []);
            setDashboardMarkdown(parsed.dashboardMarkdown || DEFAULT_MARKDOWN);
        }
      } catch (e) {
        console.error("Failed to parse local data", e);
      }
    }

    // 2. Load from backend
    try {
        const data = await dataService.loadData(username);
        
        // If we are here, clear timeout
        if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
        
        if (isMountedRef.current && data.success) {
            setBowlers(data.bowlers || []);
            setA3Cases(data.a3Cases || []);
            if (data.dashboardMarkdown) {
                setDashboardMarkdown(data.dashboardMarkdown);
            }
            // Update local storage to match backend
            try {
                localStorage.setItem(localDataKey, JSON.stringify({ 
                    bowlers: data.bowlers || [], 
                    a3Cases: data.a3Cases || [],
                    dashboardMarkdown: data.dashboardMarkdown || DEFAULT_MARKDOWN
                }));
            } catch (e) {
                console.warn("Failed to update local storage cache (Quota Exceeded or disabled). App will continue to function.", e);
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
    }
    return () => {
        if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, [user, loadUserData]);

  const saveToLocalStorage = (newBowlers: Bowler[], newA3Cases: A3Case[], newMarkdown: string) => {
    if (user) {
      // 1. Save to Local Storage immediately (Local Cache)
      const localDataKey = `user_data_${user.username}`;
      try {
        localStorage.setItem(localDataKey, JSON.stringify({ 
            bowlers: newBowlers, 
            a3Cases: newA3Cases,
            dashboardMarkdown: newMarkdown
        }));
      } catch (e) {
        console.error("Local Storage save failed", e);
      }
      // Note: Auto-save to backend is DISABLED. 
      // Saving to backend only happens when the user manually clicks the "Save" button in Layout.tsx.
    }
  };

  const updateDashboardMarkdown = (markdown: string) => {
      setDashboardMarkdown(markdown);
      saveToLocalStorage(bowlers, a3Cases, markdown);
  };

  const addBowler = (data: Omit<Bowler, 'id'>) => {
    const newBowler = {
      id: generateShortId(),
      ...data,
    };
    setBowlers(prev => {
      const newBowlers = [...prev, newBowler];
      saveToLocalStorage(newBowlers, a3Cases, dashboardMarkdown);
      return newBowlers;
    });
  };

  const updateBowler = (bowler: Bowler) => {
    // Automatically calculate status color on update
    const statusColor = getBowlerStatusColor(bowler);
    const updatedBowler = { ...bowler, statusColor };

    setBowlers(prev => {
      const newBowlers = prev.map((b) => (b.id === updatedBowler.id ? updatedBowler : b));
      saveToLocalStorage(newBowlers, a3Cases, dashboardMarkdown);
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
      saveToLocalStorage(bowlers, newA3Cases, dashboardMarkdown);
      return newA3Cases;
    });
  };

  const updateA3Case = (updatedCase: A3Case) => {
    setA3Cases(prev => {
      const newA3Cases = prev.map(c => c.id === updatedCase.id ? updatedCase : c);
      saveToLocalStorage(bowlers, newA3Cases, dashboardMarkdown);
      return newA3Cases;
    });
  };

  const deleteBowler = (id: string) => {
    setBowlers(prev => {
      const newBowlers = prev.filter((b) => b.id !== id);
      saveToLocalStorage(newBowlers, a3Cases, dashboardMarkdown);
      return newBowlers;
    });
  };

  const deleteA3Case = (id: string) => {
    setA3Cases(prev => {
      const newA3Cases = prev.filter((c) => c.id !== id);
      saveToLocalStorage(bowlers, newA3Cases, dashboardMarkdown);
      return newA3Cases;
    });
  };

  const reorderBowlers = (newBowlers: Bowler[]) => {
    setBowlers(newBowlers);
    saveToLocalStorage(newBowlers, a3Cases, dashboardMarkdown);
  };

  const reorderA3Cases = (newA3Cases: A3Case[]) => {
    setA3Cases(newA3Cases);
    saveToLocalStorage(bowlers, newA3Cases, dashboardMarkdown);
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
