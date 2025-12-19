import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { useAuth } from './AuthContext';
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
  const [bowlers, setBowlers] = useState<Bowler[]>([]);
  const [a3Cases, setA3Cases] = useState<A3Case[]>([]);
  const [dashboardMarkdown, setDashboardMarkdown] = useState<string>(DEFAULT_MARKDOWN);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (user) {
      setIsLoading(true);
      // 1. Try Local Storage first to be instant
      const localDataKey = `user_data_${user.username}`;
      const localData = localStorage.getItem(localDataKey);
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          if (isMounted) {
            setBowlers(parsed.bowlers || []);
            setA3Cases(parsed.a3Cases || []);
            setDashboardMarkdown(parsed.dashboardMarkdown || DEFAULT_MARKDOWN);
          }
        } catch (e) {
          console.error("Failed to parse local data", e);
        }
      }

      // 2. Load user data from backend (Source of Truth)
      dataService.loadData(user.username)
        .then(data => {
          if (isMounted && data.success) {
            setBowlers(data.bowlers || []);
            setA3Cases(data.a3Cases || []);
            if (data.dashboardMarkdown) {
                setDashboardMarkdown(data.dashboardMarkdown);
            }
            // Update local storage to match backend
            localStorage.setItem(localDataKey, JSON.stringify({ 
                bowlers: data.bowlers || [], 
                a3Cases: data.a3Cases || [],
                dashboardMarkdown: data.dashboardMarkdown || DEFAULT_MARKDOWN
            }));
          }
        })
        .catch(err => {
          console.error("Failed to load user data:", err);
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    } else {
        setBowlers([]);
        setA3Cases([]);
        setDashboardMarkdown(DEFAULT_MARKDOWN);
    }
    return () => {
      isMounted = false;
    };
  }, [user?.username]);

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
