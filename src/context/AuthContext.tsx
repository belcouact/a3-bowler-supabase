import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { authService, User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  login: (data: any) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
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

  const login = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await authService.login(data);
      // Assuming response contains user profile or we fetch it separately
      // Based on prompt: "Validates credentials and returns user profile."
      const userProfile = response.user || response; 
      setUser(userProfile);
      localStorage.setItem('user', JSON.stringify(userProfile));
    } catch (error) {
      // Do not log login errors to console as they are expected (wrong password etc)
      throw error;
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
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      localStorage.removeItem('user');
      window.location.href = 'https://study-llm.me/apps/a3-bowler/metric-bowler';
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout on client side even if server fails
      setUser(null);
      localStorage.removeItem('user');
      window.location.href = 'https://study-llm.me/apps/a3-bowler/metric-bowler';
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!user?.username) return;
    setIsLoading(true);
    try {
      const updatedUser = await authService.getUser(user.username);
      // Ensure we merge with existing session info if needed, but getUser likely returns full profile
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Refresh user error:', error);
      throw error;
    } finally {
      setIsLoading(false);
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
