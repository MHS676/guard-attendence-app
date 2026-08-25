export type User = { id: string; name: string; email: string; role: string; avatar?: string };
export type AuthSession = { token: string; user: User };
export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE';
export type AttendanceRecord = {
  id: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: AttendanceStatus;
  location?: { latitude: number; longitude: number; accuracy: number | null };
  guardName?: string;
  guardId?: string;
  markedBy?: string;
};
