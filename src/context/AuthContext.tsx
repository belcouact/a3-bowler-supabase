import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { authService, User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  login: (data: any) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: (silent?: boolean) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check local storage for persisted user session if applicable
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const normalizeUser = (apiUser: any): User => {
    const { profile, ...rest } = apiUser;
    return {
      ...rest,
      ...(profile || {}),
      isPublicProfile: profile?.isPublic ?? rest.isPublicProfile ?? rest.isPublic
    };
  };

  const login = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await authService.login(data);
      // Assuming response contains user profile or we fetch it separately
      // Based on prompt: "Validates credentials and returns user profile."
      const apiUser = response.user || response; 
      const userProfile = normalizeUser(apiUser);
      setUser(userProfile);
      localStorage.setItem('user', JSON.stringify(userProfile));
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: any) => {
    setIsLoading(true);
    try {
      await authService.signup(data);
      // Auto login after signup? Or just redirect to login?
      // Let's assume we need to login after signup for now, or the UI handles it.
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    // Simply redirect to the default page without loading data or waiting for server
    setUser(null);
    localStorage.removeItem('user');
    window.location.href = 'https://study-llm.me/apps/a3-bowler/metric-bowler';
  };

  const refreshUser = async (silent: boolean = false) => {
    if (!user?.username) return;
    if (!silent) setIsLoading(true);
    try {
      const response = await authService.getUser(user.username);
      const apiUser = response.user || response;
      const updatedUser = normalizeUser(apiUser);
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Refresh user error:', error);
      throw error;
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
