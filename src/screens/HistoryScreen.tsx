import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Card, Chip, SegmentedButtons, Text } from 'react-native-paper';
import { useAttendance } from '../context/AttendanceContext';
import { AttendanceRecord } from '../types';

const label = (record: AttendanceRecord) => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${record.date}T12:00:00`));
const time = (iso?: string) => iso ? new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(iso)) : '—';
export function HistoryScreen() {
  const { records } = useAttendance(); const [filter, setFilter] = useState('month');
  const filtered = useMemo(() => { const now = new Date(); return records.filter((r) => { const date = new Date(`${r.date}T12:00:00`); return filter === 'month' ? date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear() : true; }); }, [filter, records]);
  return <View style={styles.page}>
    <Text variant="titleMedium">Attendance records</Text>
    <SegmentedButtons value={filter} onValueChange={setFilter} buttons={[{ value: 'month', label: 'This month' }, { value: 'all', label: 'All time' }]} />
    <FlatList data={filtered} keyExtractor={(item) => item.id} contentContainerStyle={filtered.length ? styles.list : styles.empty} ListEmptyComponent={<Text variant="bodyLarge" style={styles.muted}>No attendance records for this period.</Text>} renderItem={({ item }) => <Card style={styles.card}><Card.Content style={styles.row}><View><Text variant="titleSmall">{label(item)}</Text><Text variant="bodyMedium">In: {time(item.checkIn)} · Out: {time(item.checkOut)}</Text></View><Chip compact={true} style={styles.chip}>{item.status}</Chip></Card.Content></Card>} />
  </View>;
}
const styles = StyleSheet.create({ page: { flex: 1, padding: 20, gap: 16, backgroundColor: '#F7F9FC' }, list: { gap: 10, paddingBottom: 20 }, empty: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' }, card: { backgroundColor: 'white' }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, chip: { backgroundColor: '#E7F6EC' }, muted: { color: '#65708A', textAlign: 'center' } });
