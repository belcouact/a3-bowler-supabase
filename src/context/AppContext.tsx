import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { useAuth } from './AuthContext';
import { generateShortId } from '../utils/idUtils';

// Types
export interface MetricData {
  target: string;
  actual: string;
  targetNote?: string;
  actualNote?: string;
}

export interface Metric {
  id: string;
  name: string;
  definition: string;
  owner: string;
  scope: string;
  attribute: string;
  targetMeetingRule?: 'gte' | 'lte' | 'within_range';
  monthlyData?: Record<string, MetricData>;
}

export interface Bowler {
  id: string;
  name: string;
  description?: string;
  objective?: string;
  champion?: string;
  commitment?: string;
  tag?: string;
  metrics?: Metric[];
}

export interface MindMapNodeData {
  id: string;
  text: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  customWidth?: number;
  customHeight?: number;
  parentId: string | null;
  type?: 'root' | 'child';
  color?: string;
}

export interface ActionPlanTaskData {
  id: string;
  name: string;
  description?: string;
  owner: string;
  startDate: string;
  endDate: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  progress: number;
}

export interface DataAnalysisImage {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface A3Case {
  id: string;
  title: string;
  description?: string;
  owner?: string;
  priority?: 'Low' | 'Medium' | 'High';
  startDate?: string;
  endDate?: string;
  status?: string;
  problemStatement?: string;
  results?: string;
  mindMapNodes?: MindMapNodeData[];
  rootCause?: string;
  actionPlanTasks?: ActionPlanTaskData[];
  dataAnalysisObservations?: string;
  dataAnalysisImages?: DataAnalysisImage[];
  dataAnalysisCanvasHeight?: number;
  resultImages?: DataAnalysisImage[];
  resultCanvasHeight?: number;
}

interface AppContextType {
  bowlers: Bowler[];
  a3Cases: A3Case[];
  addBowler: (data: Omit<Bowler, 'id'>) => void;
  updateBowler: (bowler: Bowler) => void;
  addA3Case: (caseData: Omit<A3Case, 'id'>) => void;
  updateA3Case: (a3Case: A3Case) => void;
  deleteBowler: (id: string) => void;
  deleteA3Case: (id: string) => void;
}

// Context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [bowlers, setBowlers] = useState<Bowler[]>([]);
  const [a3Cases, setA3Cases] = useState<A3Case[]>([]);

  useEffect(() => {
    if (user) {
      // 1. Try Local Storage first to be instant
      const localDataKey = `user_data_${user.username}`;
      const localData = localStorage.getItem(localDataKey);
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          setBowlers(parsed.bowlers || []);
          setA3Cases(parsed.a3Cases || []);
        } catch (e) {
          console.error("Failed to parse local data", e);
        }
      }

      // 2. Load user data from backend (Source of Truth)
      dataService.loadData(user.username)
        .then(data => {
          if (data.success) {
            setBowlers(data.bowlers || []);
            setA3Cases(data.a3Cases || []);
            // Update local storage to match backend
            localStorage.setItem(localDataKey, JSON.stringify({ bowlers: data.bowlers || [], a3Cases: data.a3Cases || [] }));
          }
        })
        .catch(err => {
          console.error("Failed to load user data:", err);
        });
    } else {
        setBowlers([]);
        setA3Cases([]);
    }
  }, [user]);

  const persistData = (newBowlers: Bowler[], newA3Cases: A3Case[]) => {
    if (user) {
      // 1. Save to Local Storage immediately
      const localDataKey = `user_data_${user.username}`;
      try {
        localStorage.setItem(localDataKey, JSON.stringify({ bowlers: newBowlers, a3Cases: newA3Cases }));
      } catch (e) {
        console.error("Local Storage save failed", e);
      }

      // Auto-save to backend has been disabled as per request
    }
  };

  const addBowler = (data: Omit<Bowler, 'id'>) => {
    const newBowler = {
      id: generateShortId(),
      ...data,
    };
    const newBowlers = [...bowlers, newBowler];
    setBowlers(newBowlers);
    persistData(newBowlers, a3Cases);
  };

  const updateBowler = (updatedBowler: Bowler) => {
    const newBowlers = bowlers.map(b => b.id === updatedBowler.id ? updatedBowler : b);
    setBowlers(newBowlers);
    persistData(newBowlers, a3Cases);
  };

  const addA3Case = (caseData: Omit<A3Case, 'id'>) => {
    const newCase = {
      id: generateShortId(),
      ...caseData
    };
    const newA3Cases = [...a3Cases, newCase];
    setA3Cases(newA3Cases);
    persistData(bowlers, newA3Cases);
  };

  const updateA3Case = (updatedCase: A3Case) => {
    const newA3Cases = a3Cases.map(c => c.id === updatedCase.id ? updatedCase : c);
    setA3Cases(newA3Cases);
    persistData(bowlers, newA3Cases);
  };

  const deleteBowler = (id: string) => {
    const newBowlers = bowlers.filter((b) => b.id !== id);
    setBowlers(newBowlers);
    persistData(newBowlers, a3Cases);
  };

  const deleteA3Case = (id: string) => {
    const newA3Cases = a3Cases.filter((c) => c.id !== id);
    setA3Cases(newA3Cases);
    persistData(bowlers, newA3Cases);
  };

  return (
    <AppContext.Provider value={{ bowlers, a3Cases, addBowler, updateBowler, addA3Case, updateA3Case, deleteBowler, deleteA3Case }}>
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
