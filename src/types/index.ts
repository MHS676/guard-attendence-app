export type User = { id: string; name: string; email: string; role: string; avatar?: string };
export type AuthSession = { token: string; user: User };
export type AttendanceStatus = 'Present' | 'Late' | 'Absent' | 'Checked Out';
export type AttendanceRecord = {
  id: string; date: string; checkIn?: string; checkOut?: string; status: AttendanceStatus;
  location?: { latitude: number; longitude: number; accuracy: number | null };
};
