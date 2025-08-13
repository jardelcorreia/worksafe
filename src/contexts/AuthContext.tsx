
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
        } else {
          // If a user is logged in but is not the admin, log them out to prevent inconsistent states.
          // This handles cases where an auditor user might exist in Firebase but shouldn't be managed this way.
          signOut(auth);
          setRole(null);
        }
      } else {
        // Check localStorage for auditor role if no firebase user is active
        const storedRole = localStorage.getItem('worksafe-role');
        if (storedRole === 'auditor') {
            setRole('auditor');
        } else {
            setRole(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (newRole: 'admin' | 'auditor', password?: string): Promise<boolean> => {
    setLoading(true);
    try {
      await signOut(auth); // Ensure any previous session is cleared
      localStorage.removeItem('worksafe-role');


      if (newRole === 'admin') {
        if (!password) {
          throw new Error('A senha é obrigatória para o administrador.');
        }
        await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password);
        // onAuthStateChanged will set the role
        return true;
      }

      if (newRole === 'auditor') {
        // For auditor, we don't authenticate with Firebase. We just set the role locally.
        setRole('auditor');
        setUser(null);
        localStorage.setItem('worksafe-role', 'auditor');
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
    localStorage.removeItem('worksafe-role');
    setRole(null);
    setUser(null);
  };

  const changePassword = async (oldPass: string, newPass: string): Promise<boolean> => {
    setLoading(true);
    let tempUser = auth.currentUser;
    let createdSession = false;

    try {
        if (!tempUser || tempUser.email !== ADMIN_EMAIL) {
            const userCredential = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, oldPass);
            tempUser = userCredential.user;
            createdSession = true;
        }

        if (tempUser) {
            await updatePassword(tempUser, newPass);
            if (createdSession) {
              await signOut(auth);
            }
            return true;
        }
        return false;

    } catch (error: any) {
        console.error('Password change error:', error);
        // Ensure user is signed out in case of failure during a temporary session
        if (createdSession && auth.currentUser) {
            await signOut(auth);
        }
        return false;
    } finally {
        setLoading(false);
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
