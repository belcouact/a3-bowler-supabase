import { createContext, useContext, useState, ReactNode } from 'react';
import { dataService } from '../services/dataService';
import { useAuth } from './AuthContext';

// Types
export interface MetricData {
  target: string;
  actual: string;
}

export interface Metric {
  id: string;
  name: string;
  definition: string;
  owner: string;
  scope: string;
  attribute: string;
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

export interface A3Case {
  id: string;
  title: string;
  description?: string;
  owner?: string;
  priority?: 'Low' | 'Medium' | 'High';
  startDate?: string;
  endDate?: string;
  status?: string;
  dataAnalysisObservations?: string;
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
  const [bowlers, setBowlers] = useState<Bowler[]>([
    { id: '1', name: 'Plant A - Operations' },
    { id: '2', name: 'Plant A - Safety' },
  ]);

  const [a3Cases, setA3Cases] = useState<A3Case[]>([
    { id: '1', title: 'Reduce Scrap Rate in Line 4' },
    { id: '2', title: 'Improve Delivery Time to West Coast' },
  ]);

  const persistData = (newBowlers: Bowler[], newA3Cases: A3Case[]) => {
    if (user) {
      dataService.saveData(newBowlers, newA3Cases, user.id).catch(err => {
        console.error("Failed to save data:", err);
      });
    }
  };

  const addBowler = (data: Omit<Bowler, 'id'>) => {
    const newBowler = {
      id: crypto.randomUUID(),
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
      id: crypto.randomUUID(),
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
