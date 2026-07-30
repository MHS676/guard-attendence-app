import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { AuthSession, User } from '../types';
import { signInRequest } from '../services/authService';
import { clearRememberedEmail, clearSession, getRememberedEmail, getStoredSession, saveRememberedEmail, saveSession } from '../services/storage';

type AuthContextValue = {
  user: User | null; token: string | null; isLoading: boolean; rememberedEmail: string;
  signIn: (email: string, password: string, remember: boolean) => Promise<void>; signOut: () => Promise<void>;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rememberedEmail, setRememberedEmail] = useState('');
  useEffect(() => { (async () => {
    const [storedSession, email] = await Promise.all([getStoredSession(), getRememberedEmail()]);
    setSession(storedSession); setRememberedEmail(email ?? ''); setIsLoading(false);
  })(); }, []);
  const value = useMemo(() => ({
    user: session?.user ?? null, token: session?.token ?? null, isLoading, rememberedEmail,
    signIn: async (email: string, password: string, remember: boolean) => {
      const nextSession = await signInRequest(email, password);
      if (remember) { await saveSession(nextSession); await saveRememberedEmail(email); }
      else { await Promise.all([clearSession(), clearRememberedEmail()]); }
      setRememberedEmail(remember ? email : ''); setSession(nextSession);
    },
    signOut: async () => { await clearSession(); setSession(null); },
  }), [isLoading, rememberedEmail, session]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('useAuth must be within AuthProvider'); return value; }
