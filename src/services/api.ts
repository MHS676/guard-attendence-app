import { clearSession, getStoredSession } from './storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.72:5000';

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const session = await getStoredSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (session?.token) {
    headers['Authorization'] = `Bearer ${session.token}`;
  }

  const fullUrl = `${API_URL}${endpoint}`;
  console.log(`📡 [apiFetch Request] -> ${fullUrl}`);

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    console.log(`✅ [apiFetch Response] status: ${response.status} from ${endpoint}`);

    if (response.status === 401) {
      await clearSession();
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Request failed.');
    }

    return (await response.json()) as Promise<T>;
  } catch (error) {
    console.error(`❌ [apiFetch Network Error] Failed connecting to ${fullUrl}:`, error);
    throw error;
  }
}