import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AttendanceRecord } from '../types';
import { apiFetch } from '../services/api';
import { useAuth } from './AuthContext';

type AttendanceContextValue = {
  records: AttendanceRecord[];
  activeRecord: AttendanceRecord | undefined;
  checkIn: (payload: {
    userId: string;
    markedById: string;
    postId: string;
    date: string;
    time: string;
    shiftHours: number;
    status: string;
    captureLatitude: number;
    captureLongitude: number;
    captureAddress?: string;
  }) => Promise<void>;
  fetchHistory: () => Promise<void>;
};

const AttendanceContext = createContext<AttendanceContextValue | null>(null);

const today = () => new Date().toISOString().slice(0, 10);

export function AttendanceProvider({ children }: PropsWithChildren) {
  const { user, token, resetSession } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  const fetchHistory = useCallback(async () => {
    // Guard clause: ensure both token and user.id exist and are non-empty strings
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      console.log('⚠️ [AttendanceContext] Token is missing or invalid - skipping history fetch');
      return;
    }

    if (!user?.id || typeof user.id !== 'string' || user.id.trim().length === 0) {
      console.log('⚠️ [AttendanceContext] User ID is missing or invalid - skipping history fetch');
      return;
    }

    try {
      console.log(`📡 [AttendanceContext] Requesting history for user ID: ${user.id}`);
      // Pass token explicitly to ensure active in-memory token is used
      const data = await apiFetch<any[]>(`/attendance/user/${user.id}`, { token });
      console.log(`✅ [AttendanceContext] Received ${data?.length || 0} attendance records.`);

      if (!Array.isArray(data)) {
        console.error('❌ [AttendanceContext] Expected array from backend, got:', data);
        setRecords([]);
        return;
      }

      const mappedRecords: AttendanceRecord[] = data.map((item) => ({
        id: item.id,
        date: item.date ? new Date(item.date).toISOString().slice(0, 10) : today(),
        checkIn: item.time || item.createdAt || '08:00 AM',
        status: item.status || 'PRESENT',
        location: {
          latitude: item.captureLatitude ?? 0,
          longitude: item.captureLongitude ?? 0,
          accuracy: item.accuracy ?? null,
        },
      }));

      setRecords(mappedRecords);
    } catch (error) {
      // Handle 401 Unauthorized by resetting session
      if (error instanceof Error && error.message === 'Unauthorized') {
        console.log('🔐 [AttendanceContext] 401 Unauthorized - clearing records and resetting session');
        setRecords([]); // Clear stale records before logout
        await resetSession();
        return;
      }
      console.error('❌ [AttendanceContext] Failed to fetch history:', error);
    }
  }, [user?.id, token, resetSession]);

  useEffect(() => {
    if (user?.id && token) {
      fetchHistory();
    }
  }, [user?.id, token, fetchHistory]);

  const activeRecord = records.find((r) => r.date === today() && r.checkIn && !r.checkOut);

  const value = useMemo(
    () => ({
      records,
      activeRecord,
      checkIn: async (payload: any) => {
        try {
          // Pass token explicitly to ensure active in-memory token is used
          await apiFetch('/attendance', {
            method: 'POST',
            body: JSON.stringify(payload),
            token,
          });
          await fetchHistory();
        } catch (error) {
          // Handle 401 Unauthorized by resetting session
          if (error instanceof Error && error.message === 'Unauthorized') {
            console.log('🔐 [AttendanceContext] checkIn 401 Unauthorized - clearing records and resetting session');
            setRecords([]); // Clear stale records before logout
            await resetSession();
            return; // Don't re-throw, let session reset handle it
          }
          console.error('❌ [AttendanceContext] checkIn failed:', error);
          throw error;
        }
      },
      fetchHistory,
    }),
    [records, activeRecord, fetchHistory, token, resetSession]
  );

  return <AttendanceContext.Provider value={value}>{children}</AttendanceContext.Provider>;
}

export function useAttendance() {
  const value = useContext(AttendanceContext);
  if (!value) throw new Error('useAttendance must be within AttendanceProvider');
  return value;
}
