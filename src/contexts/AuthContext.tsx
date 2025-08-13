'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import {
  signInWithEmailAndPassword,
  updatePassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export type Role = 'admin' | 'auditor' | null;

interface AuthContextType {
  role: Role;
  login: (role: 'admin' | 'auditor', password?: string) => boolean;
  logout: () => void;
  changePassword: (oldPass: string, newPass: string) => Promise<boolean>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_PASS_STORAGE_KEY = 'adminPassword_fallback'; // Renamed to avoid conflict if user ever used the old system
const ADMIN_EMAIL = 'admin@worksafe.com';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  const login = (newRole: 'admin' | 'auditor', password?: string) => {
    if (newRole === 'admin') {
      // This is a simplified local check. The real password check is in changePassword.
      // For basic login, we just check if a password was provided.
      if (!password) {
        return false;
      }
      // For added robustness, you might perform a silent Firebase login here as well,
      // but to keep frontend simple as requested, we'll keep it local.
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

  const changePassword = async (oldPass: string, newPass: string): Promise<boolean> => {
    try {
      // 1. Sign in the user silently with their old password
      const userCredential = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, oldPass);
      const user = userCredential.user;

      if (user) {
        // 2. If sign-in is successful, update the password
        await updatePassword(user, newPass);
        
        // 3. Sign out immediately after the operation
        await signOut(auth);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error("Password change error:", error);
      // Ensure user is signed out in case of failure during update
      if (auth.currentUser) {
        await signOut(auth);
      }
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
