import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';
import { AttendanceRecord } from '../types';

type AttendanceContextValue = { records: AttendanceRecord[]; activeRecord: AttendanceRecord | undefined; checkIn: (location: AttendanceRecord['location']) => void; checkOut: () => void; };
const AttendanceContext = createContext<AttendanceContextValue | null>(null);
const today = () => new Date().toISOString().slice(0, 10);
export function AttendanceProvider({ children }: PropsWithChildren) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const activeRecord = records.find((r) => r.date === today() && r.checkIn && !r.checkOut);
  const value = useMemo(() => ({ records, activeRecord,
    checkIn: (location: AttendanceRecord['location']) => setRecords((old) => [{ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, date: today(), checkIn: new Date().toISOString(), status: 'Present', location }, ...old]),
    checkOut: () => setRecords((old) => old.map((record) => record.id === activeRecord?.id ? { ...record, checkOut: new Date().toISOString(), status: 'Checked Out' } : record)),
  }), [records, activeRecord]);
  return <AttendanceContext.Provider value={value}>{children}</AttendanceContext.Provider>;
}
export function useAttendance() { const value = useContext(AttendanceContext); if (!value) throw new Error('useAttendance must be within AttendanceProvider'); return value; }
