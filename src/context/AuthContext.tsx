import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthSession, User } from '../types';
import { signInRequest } from '../services/authService';
import {
  clearRememberedEmail,
  clearSession,
  getRememberedEmail,
  getStoredSession,
  saveRememberedEmail,
  saveSession,
} from '../services/storage';

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  rememberedEmail: string;
  signIn: (email: string, password: string, remember: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  resetSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rememberedEmail, setRememberedEmail] = useState('');

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [storedSession, email] = await Promise.all([
          getStoredSession(),
          getRememberedEmail(),
        ]);
        if (isMounted) {
          setSession(storedSession);
          setRememberedEmail(email ?? '');
        }
      } catch (error) {
        console.error('Failed to restore auth session:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      isLoading,
      rememberedEmail,
      signIn: async (email: string, password: string, remember: boolean) => {
        const nextSession = await signInRequest(email, password);

        // Await full persistence to SecureStore/AsyncStorage BEFORE updating state
        await saveSession(nextSession);

        if (remember) {
          await saveRememberedEmail(email);
        } else {
          await clearRememberedEmail();
        }

        setRememberedEmail(remember ? email : '');
        setSession(nextSession);
      },
      signOut: async () => {
        await clearSession();
        setSession(null);
      },
      resetSession: async () => {
        console.log('🔄 [AuthContext] Session reset triggered - user token expired or unauthorized');
        await clearSession();
        setSession(null);
      },
    }),
    [isLoading, rememberedEmail, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return value;
}