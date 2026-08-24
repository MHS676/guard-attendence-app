import { clearSession, getStoredSession } from './storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.72:5000';

interface ApiOptions extends RequestInit {
  token?: string | null;
}

export async function apiFetch<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { token: explicitToken, ...fetchOptions } = options;
  
  // Use explicitly passed token first; fall back to storage read
  let authToken = explicitToken;
  if (!authToken) {
    const session = await getStoredSession();
    authToken = session?.token ?? null;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (authToken) {
    // Log token length for debugging, but don't log the full token
    const tokenLength = authToken.length;
    const tokenPreview = authToken.substring(0, 20) + (authToken.length > 20 ? '...' : '');
    console.log(`🔐 [apiFetch] Token attached (length: ${tokenLength}, preview: ${tokenPreview})`);
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const fullUrl = `${API_URL}${endpoint}`;
  console.log(
    `📡 [apiFetch Request] -> ${fullUrl} (authorization: ${authToken ? 'attached' : 'missing'})`
  );

  try {
    const response = await fetch(fullUrl, {
      ...fetchOptions,
      headers,
    });

    console.log(`✅ [apiFetch Response] status: ${response.status} from ${endpoint}`);

    if (response.status === 401) {
      console.log('🔐 [apiFetch] 401 Unauthorized - clearing session and rejecting request');
      console.log('🔍 [apiFetch] Possible causes: Invalid token, expired token, user not found in DB, JWT_SECRET mismatch');
      await clearSession();
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `Request failed with status ${response.status}`);
    }

    return (await response.json()) as Promise<T>;
  } catch (error) {
    console.error(`❌ [apiFetch Request Error] ${fullUrl}:`, error);
    throw error;
  }
}