import { createContext, useContext, useState, ReactNode } from 'react';

// Types
export interface Bowler {
  id: string;
  name: string;
}

export interface A3Case {
  id: string;
  title: string;
  owner?: string;
  priority?: 'Low' | 'Medium' | 'High';
  startDate?: string;
  endDate?: string;
}

interface AppContextType {
  bowlers: Bowler[];
  a3Cases: A3Case[];
  addBowler: (name: string) => void;
  addA3Case: (caseData: Omit<A3Case, 'id'>) => void;
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

  const addBowler = (name: string) => {
    const newBowler = {
      id: Date.now().toString(),
      name,
    };
    setBowlers([...bowlers, newBowler]);
  };

  const addA3Case = (caseData: Omit<A3Case, 'id'>) => {
    const newCase = {
      id: Date.now().toString(),
      ...caseData
    };
    setA3Cases([...a3Cases, newCase]);
  };

  const deleteBowler = (id: string) => {
    setBowlers(bowlers.filter((b) => b.id !== id));
  };

  const deleteA3Case = (id: string) => {
    setA3Cases(a3Cases.filter((c) => c.id !== id));
  };

  return (
    <AppContext.Provider value={{ bowlers, a3Cases, addBowler, addA3Case, deleteBowler, deleteA3Case }}>
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
