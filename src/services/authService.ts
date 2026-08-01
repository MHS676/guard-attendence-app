import { AuthSession } from '../types';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

function buildDemoSession(email: string): AuthSession {
  return {
    token: 'demo-token',
    user: {
      id: '1001',
      name: 'Demo Guard',
      email,
      role: 'Guard',
    },
  };
}

/** Wire EXPO_PUBLIC_API_URL to your HTTPS API. The API should return { token, user }. */
export async function signInRequest(email: string, password: string): Promise<AuthSession> {
  if (!API_URL) {
    if (email.trim().toLowerCase() === 'demo@falconsecurity.com' && password === 'Falcon@2026') {
      return buildDemoSession(email);
    }

    if (email.trim() && password.trim()) {
      return buildDemoSession(email);
    }

    throw new Error('Please enter your email and password.');
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
