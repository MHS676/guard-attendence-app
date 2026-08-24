import { AuthSession } from '../types';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

function buildDemoSession(identifier: string): AuthSession {
  return {
    token: 'demo-token-12345',
    user: {
      id: '1001',
      name: 'Demo Guard',
      email: identifier.includes('@') ? identifier : 'demo@falconsecurity.com',
      role: 'Guard',
    },
  };
}

function toAuthSession(data: unknown): AuthSession {
  const response = data as {
    token?: string;
    accessToken?: string;
    access_token?: string;
    user?: AuthSession['user'];
    data?: {
      token?: string;
      accessToken?: string;
      access_token?: string;
      user?: AuthSession['user'];
    };
  };
  const payload = response?.data ?? response;
  const token = payload?.token ?? payload?.accessToken ?? payload?.access_token;
  const user = payload?.user ?? response?.user;

  if (!token || !user?.id) {
    throw new Error('The login server returned an invalid session. Expected a token and user details.');
  }

  return { token, user };
}

export async function signInRequest(usernameOrEmail: string, password: string): Promise<AuthSession> {
  const cleanIdentifier = usernameOrEmail.trim();
  const cleanPassword = password.trim();

  // If no environment API_URL is configured, use local demo fallback
  if (!API_URL) {
    console.warn('⚠️ [signInRequest] API_URL is not configured, using demo fallback');
    await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate network lag
    
    if (
      cleanIdentifier.toLowerCase() === 'demo@falconsecurity.com' || 
      cleanIdentifier === '1001'
    ) {
      if (cleanPassword === 'Falcon@2026' || cleanPassword === '123456') {
        console.log('✅ [signInRequest] Using DEMO credentials, returning demo session');
        return buildDemoSession(cleanIdentifier);
      }
    }

    if (cleanIdentifier && cleanPassword) {
      console.log('✅ [signInRequest] Using FALLBACK demo session (any credentials accepted)');
      return buildDemoSession(cleanIdentifier);
    }

    throw new Error('Please enter valid credentials.');
  }

  console.log(`📡 [signInRequest] API_URL configured: ${API_URL}, making real login request`);

  // Network request with 10s Abort Controller Timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        username: cleanIdentifier,
        email: cleanIdentifier,
        password: cleanPassword,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = Array.isArray(data?.message) 
        ? data.message.join(', ') 
        : data?.message;
      console.error(`❌ [signInRequest] Login failed with status ${response.status}: ${errorMsg}`);
      throw new Error(errorMsg || 'Unable to sign in. Please check your credentials.');
    }

    console.log('✅ [signInRequest] Login successful, token received');
    return toAuthSession(data);
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Server connection timed out (${API_URL}). Check backend status.`);
    }
    throw error;
  }
}
