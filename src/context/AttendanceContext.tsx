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
  }) => Promise<void>;
  fetchHistory: () => Promise<void>;
};

const AttendanceContext = createContext<AttendanceContextValue | null>(null);

const today = () => new Date().toISOString().slice(0, 10);

export function AttendanceProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  const fetchHistory = useCallback(async () => {
    if (!user?.id) {
      console.log('⚠️ [AttendanceContext] User ID is missing in AuthContext.');
      return;
    }

    try {
      console.log(`📡 [AttendanceContext] Requesting history for user ID: ${user.id}`);
      const data = await apiFetch<any[]>(`/attendance/user/${user.id}`);
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
        },
      }));

      setRecords(mappedRecords);
    } catch (error) {
      console.error('❌ [AttendanceContext] Failed to fetch history:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchHistory();
    }
  }, [user?.id, fetchHistory]);

  const activeRecord = records.find((r) => r.date === today() && r.checkIn && !r.checkOut);

  const value = useMemo(
    () => ({
      records,
      activeRecord,
      checkIn: async (payload: any) => {
        await apiFetch('/attendance', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        await fetchHistory();
      },
      fetchHistory,
    }),
    [records, activeRecord, fetchHistory]
  );

  return <AttendanceContext.Provider value={value}>{children}</AttendanceContext.Provider>;
}

export function useAttendance() {
  const value = useContext(AttendanceContext);
  if (!value) throw new Error('useAttendance must be within AttendanceProvider');
  return value;
}