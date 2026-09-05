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
    userEmails?: string[];
    postId: string;
    date: string;
    time: string;
    shiftHours?: number;
    status?: string;
    captureLatitude?: number;
    captureLongitude?: number;
    captureAddress?: string;
  }) => Promise<{ success: boolean; message: string; guardCount?: number }>;
  fetchHistory: (identifier?: string) => Promise<any[]>;
};

const AttendanceContext = createContext<AttendanceContextValue | null>(null);

const today = () => new Date().toISOString().slice(0, 10);

export function AttendanceProvider({ children }: PropsWithChildren) {
  const { user, token, resetSession } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  const fetchHistory = useCallback(async (identifierOverride?: string) => {
    // Guard clause: ensure both token and user exist
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      console.log('⚠️ [AttendanceContext] Token is missing or invalid - skipping history fetch');
      return [];
    }

    // Determine identifier to request history with: prefer provided override, then UUID `user.id`, fallback to `user.email`
    const identifier = identifierOverride || user?.id || user?.email;
    if (!identifier || typeof identifier !== 'string' || identifier.trim().length === 0) {
      console.log('⚠️ [AttendanceContext] User identifier is missing or invalid - skipping history fetch');
      return [];
    }

    try {
      console.log(`📡 [AttendanceContext] Requesting history for user identifier: ${identifier}`);
      // Pass token explicitly to ensure active in-memory token is used
      // Backend accepts either userId (UUID) or email in this route
      const data = await apiFetch<any[]>(`/attendance/user/${identifier}`, { token });
      console.log(`✅ [AttendanceContext] Received ${data?.length || 0} attendance records.`);
      console.log(`📋 [AttendanceContext] Raw records:`, JSON.stringify(data?.slice(0, 2) || [], null, 2));

      if (!Array.isArray(data)) {
        console.error('❌ [AttendanceContext] Expected array from backend, got:', typeof data, data);
        setRecords([]);
        return [];
      }

      const mappedRecords: AttendanceRecord[] = data.map((item) => {
        console.log(`📍 [AttendanceContext] Mapping record:`, item.id, 'date:', item.date);
        return {
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
        };
      });

      console.log(`✅ [AttendanceContext] Mapped ${mappedRecords.length} records`);
      setRecords(mappedRecords);
      return mappedRecords;
    } catch (error) {
      // Handle 401 Unauthorized by resetting session
      if (error instanceof Error && error.message === 'Unauthorized') {
        console.log('🔐 [AttendanceContext] 401 Unauthorized - clearing records and resetting session');
        setRecords([]); // Clear stale records before logout
        await resetSession();
        return [];
      }
      console.error('❌ [AttendanceContext] Failed to fetch history:', error);
      return [];
    }
  }, [user?.id, user?.email, token, resetSession]);

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

          // Ensure at least one of userId, userIds, or userEmails is provided
          if (!payload.userId && (!payload.userIds || payload.userIds.length === 0) && (!payload.userEmails || payload.userEmails.length === 0)) {
            throw new Error('Either userId, userIds, or userEmails must be provided');
          }

          // If only single userId, convert to userIds array for consistency
          if (payload.userId && !payload.userIds && !payload.userEmails) {
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

          // Fetch updated history in background for the affected guard(s)
          // Prefer identifier from the created attendance record (employeeId or userId) so coordinator sees the guard's history
          setTimeout(() => {
            try {
              const target = Array.isArray(response.data) && response.data.length > 0
                ? (response.data[0]?.user?.employeeId || response.data[0]?.userId || response.data[0]?.user?.id)
                : undefined;
              fetchHistory(target).catch((err) => {
                console.warn('⚠️ [AttendanceContext] Background fetchHistory failed:', err);
              });
            } catch (err) {
              console.warn('⚠️ [AttendanceContext] Unable to determine target identifier for background fetch', err);
            }
          }, 500); // 500ms delay to allow DB write to complete

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
