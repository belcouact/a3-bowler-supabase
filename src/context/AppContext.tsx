import { createContext, useContext, useState, ReactNode } from 'react';

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
  const [bowlers, setBowlers] = useState<Bowler[]>([
    { id: '1', name: 'Plant A - Operations' },
    { id: '2', name: 'Plant A - Safety' },
  ]);

  const [a3Cases, setA3Cases] = useState<A3Case[]>([
    { id: '1', title: 'Reduce Scrap Rate in Line 4' },
    { id: '2', title: 'Improve Delivery Time to West Coast' },
  ]);

  const addBowler = (data: Omit<Bowler, 'id'>) => {
    const newBowler = {
      id: crypto.randomUUID(),
      ...data,
    };
    setBowlers([...bowlers, newBowler]);
  };

  const updateBowler = (updatedBowler: Bowler) => {
    setBowlers(bowlers.map(b => b.id === updatedBowler.id ? updatedBowler : b));
  };

  const addA3Case = (caseData: Omit<A3Case, 'id'>) => {
    const newCase = {
      id: crypto.randomUUID(),
      ...caseData
    };
    setA3Cases([...a3Cases, newCase]);
  };

  const updateA3Case = (updatedCase: A3Case) => {
    setA3Cases(a3Cases.map(c => c.id === updatedCase.id ? updatedCase : c));
  };

  const deleteBowler = (id: string) => {
    setBowlers(bowlers.filter((b) => b.id !== id));
  };

  const deleteA3Case = (id: string) => {
    setA3Cases(a3Cases.filter((c) => c.id !== id));
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
