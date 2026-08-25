import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AttendanceRecord } from '../types';
import { apiFetch } from '../services/api';
import { useAuth } from './AuthContext';

type AttendanceContextValue = {
  records: AttendanceRecord[];
  activeRecord: AttendanceRecord | undefined;
  checkIn: (payload: {
    userId?: string;
    userIds?: string[];
    postId: string;
    date: string;
    time: string;
    shiftHours?: number;
    status?: string;
    captureLatitude?: number;
    captureLongitude?: number;
    captureAddress?: string;
  }) => Promise<{ success: boolean; message: string; guardCount?: number }>;
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
        checkIn: item.checkInTime || item.time || item.createdAt || '08:00 AM',
        status: item.status || 'PRESENT',
        location: {
          latitude: item.captureLatitude ?? 0,
          longitude: item.captureLongitude ?? 0,
          accuracy: item.accuracy ?? null,
        },
        guardName: item.user?.name,
        guardId: item.userId,
        markedBy: item.markedBy?.name,
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
          console.log('📤 [AttendanceContext] Submitting check-in payload:', payload);

          // Ensure at least one of userId or userIds is provided
          if (!payload.userId && (!payload.userIds || payload.userIds.length === 0)) {
            throw new Error('Either userId or userIds must be provided');
          }

          // If only single userId, convert to userIds array for consistency
          if (payload.userId && !payload.userIds) {
            payload.userIds = [payload.userId];
            delete payload.userId;
          }

          // Pass token explicitly to ensure active in-memory token is used
          const response = await apiFetch<{
            success: boolean;
            message: string;
            data: any;
          }>('/attendance', {
            method: 'POST',
            body: JSON.stringify(payload),
            token,
          });

          console.log('✅ [AttendanceContext] Check-in successful:', response);

          // Fetch updated history
          await fetchHistory();

          return {
            success: response.success ?? true,
            message: response.message || 'Attendance marked successfully',
            guardCount: Array.isArray(response.data) ? response.data.length : 1,
          };
        } catch (error) {
          // Handle 401 Unauthorized by resetting session
          if (error instanceof Error && error.message === 'Unauthorized') {
            console.log('🔐 [AttendanceContext] checkIn 401 Unauthorized - clearing records and resetting session');
            setRecords([]); // Clear stale records before logout
            await resetSession();
            return {
              success: false,
              message: 'Session expired. Please login again.',
            };
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
