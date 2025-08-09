'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';

export type Role = 'admin' | 'auditor' | null;

interface AuthContextType {
  role: Role;
  login: (role: 'admin' | 'auditor') => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you'd verify a token here.
    // For this prototype, we'll use localStorage.
    try {
      const storedRole = localStorage.getItem('userRole') as Role;
      if (storedRole) {
        setRole(storedRole);
      }
    } catch (error) {
        console.error("Could not access local storage", error)
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (newRole: 'admin' | 'auditor') => {
    setRole(newRole);
    try {
        localStorage.setItem('userRole', newRole);
    } catch (error) {
        console.error("Could not access local storage", error)
    }
  };

  const logout = () => {
    setRole(null);
    try {
        localStorage.removeItem('userRole');
    } catch (error) {
        console.error("Could not access local storage", error)
    }
  };

  const value = { role, login, logout, loading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
