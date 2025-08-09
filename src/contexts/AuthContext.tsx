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
  login: (role: 'admin' | 'auditor', password?: string) => boolean;
  logout: () => void;
  changePassword: (oldPass: string, newPass: string) => boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_PASS_STORAGE_KEY = 'adminPassword';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedRole = localStorage.getItem('userRole') as Role;
      if (storedRole) {
        setRole(storedRole);
      }
      // Initialize default admin password if not set
      if (!localStorage.getItem(ADMIN_PASS_STORAGE_KEY)) {
        localStorage.setItem(ADMIN_PASS_STORAGE_KEY, 'admin');
      }
    } catch (error) {
        console.error("Could not access local storage", error)
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (newRole: 'admin' | 'auditor', password?: string) => {
    if (newRole === 'admin') {
      try {
        const adminPass = localStorage.getItem(ADMIN_PASS_STORAGE_KEY) || 'admin';
        if (password !== adminPass) {
          return false;
        }
      } catch (error) {
        console.error("Could not access local storage", error);
        return false;
      }
    }
    setRole(newRole);
    try {
        localStorage.setItem('userRole', newRole);
    } catch (error) {
        console.error("Could not access local storage", error)
    }
    return true;
  };

  const logout = () => {
    setRole(null);
    try {
        localStorage.removeItem('userRole');
    } catch (error) {
        console.error("Could not access local storage", error)
    }
  };

  const changePassword = (oldPass: string, newPass: string): boolean => {
    try {
      const currentPass = localStorage.getItem(ADMIN_PASS_STORAGE_KEY);
      if (currentPass !== oldPass) {
        return false;
      }
      localStorage.setItem(ADMIN_PASS_STORAGE_KEY, newPass);
      return true;
    } catch (error) {
      console.error("Could not access local storage", error);
      return false;
    }
  };

  const value = { role, login, logout, loading, changePassword };

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
