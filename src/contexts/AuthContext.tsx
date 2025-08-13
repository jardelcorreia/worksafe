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
  type User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export type Role = 'admin' | 'auditor' | null;

interface AuthContextType {
  role: Role;
  login: (role: 'admin' | 'auditor', password?: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (oldPass: string, newPass: string) => Promise<boolean>;
  loading: boolean;
  user: User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'admin@worksafe.com';
const AUDITOR_EMAIL = 'auditor@worksafe.com';
const AUDITOR_DUMMY_PASS = 'auditor-placeholder-password'; // Dummy password for auditor login

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        if (currentUser.email === ADMIN_EMAIL) {
          setRole('admin');
        } else if (currentUser.email === AUDITOR_EMAIL) {
          setRole('auditor');
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (newRole: 'admin' | 'auditor', password?: string): Promise<boolean> => {
    setLoading(true);
    try {
      await signOut(auth); // Ensure any previous session is cleared

      if (newRole === 'admin') {
        if (!password) {
          throw new Error('A senha é obrigatória para o administrador.');
        }
        await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password);
        setRole('admin');
        return true;
      }

      if (newRole === 'auditor') {
        // Since auditors don't have a password in the UI, we sign them in with a known credential.
        // Ensure this user exists in Firebase Auth.
        try {
            await signInWithEmailAndPassword(auth, AUDITOR_EMAIL, AUDITOR_DUMMY_PASS);
        } catch (error: any) {
            // Handle case where auditor user might not exist or password is wrong
            console.error("Auditor login failed. Ensure 'auditor@worksafe.com' exists with the placeholder password.", error);
            // Fallback to local-only role for auditor if Firebase login fails
            setRole('auditor');
            setUser(null); // No firebase user in this case
            return true;
        }
        setRole('auditor');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login failed:', error);
      setRole(null);
      return false;
    } finally {
      setLoading(false);
    }
  };


  const logout = async () => {
    await signOut(auth);
    setRole(null);
    setUser(null);
  };

  const changePassword = async (oldPass: string, newPass: string): Promise<boolean> => {
    try {
      if (!auth.currentUser || auth.currentUser.email !== ADMIN_EMAIL) {
        // If the current user is not the admin, we need to re-authenticate
        const userCredential = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, oldPass);
        if (userCredential.user) {
          await updatePassword(userCredential.user, newPass);
          await signOut(auth); // Sign out after password change
          return true;
        }
        return false;
      } else {
        // If the admin is already signed in, we can update the password directly
        await updatePassword(auth.currentUser, newPass);
        return true;
      }
    } catch (error) {
      console.error('Password change error:', error);
       // Ensure user is signed out in case of failure
       if (auth.currentUser) {
        await signOut(auth);
      }
      return false;
    }
  };

  const value = { role, login, logout, loading, changePassword, user };

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
