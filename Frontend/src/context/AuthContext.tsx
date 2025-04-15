import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api'; // Adjust the import path if necessary

interface User {
  id: string;
  username: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => {},
  logout: async () => {},
  isLoading: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status periodically
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    const checkAuth = async () => {
      try {
        const data = await api.checkAuthStatus();
        setUser(data.isAuthenticated && data.user ? data.user : null);
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth(); // Initial check
    intervalId = setInterval(checkAuth, 30000); // Recheck every 30 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  // Login with server confirmation
  const login = async (userData: User) => {
    setIsLoading(true);
    try {
      const response = await api.login({ username: userData.username, password: 'temp' }); // Replace 'temp' with actual password logic
      if (response) {
        setUser(userData);
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout with server confirmation
  const logout = async () => {
    setIsLoading(true);
    try {
      await api.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);