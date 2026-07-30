import { AuthSession } from '../types';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

/** Wire EXPO_PUBLIC_API_URL to your HTTPS API. The API should return { token, user }. */
export async function signInRequest(email: string, password: string): Promise<AuthSession> {
  if (!API_URL) {
    throw new Error('Set EXPO_PUBLIC_API_URL before signing in.');
  }
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(data?.message ?? 'Unable to sign in. Please check your credentials.');
  }
  return response.json() as Promise<AuthSession>;
}
