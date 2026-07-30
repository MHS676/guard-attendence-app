import * as SecureStore from 'expo-secure-store';
import { AuthSession } from '../types';

const SESSION_KEY = 'attendance.session';
const REMEMBER_KEY = 'attendance.remember';

export async function getStoredSession(): Promise<AuthSession | null> {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  return raw ? JSON.parse(raw) as AuthSession : null;
}
export async function saveSession(session: AuthSession) { await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session)); }
export async function clearSession() { await SecureStore.deleteItemAsync(SESSION_KEY); }
export async function getRememberedEmail() { return SecureStore.getItemAsync(REMEMBER_KEY); }
export async function saveRememberedEmail(email: string) { await SecureStore.setItemAsync(REMEMBER_KEY, email); }
export async function clearRememberedEmail() { await SecureStore.deleteItemAsync(REMEMBER_KEY); }
