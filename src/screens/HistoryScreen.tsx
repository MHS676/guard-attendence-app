import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View, RefreshControl } from 'react-native';
import { Card, Chip, SegmentedButtons, Text } from 'react-native-paper';
import { useAttendance } from '../context/AttendanceContext';
import { AttendanceRecord } from '../types';

const label = (record: AttendanceRecord) =>
  new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${record.date}T12:00:00`));

const time = (iso?: string) =>
  iso
    ? new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(iso))
    : '—';

export function HistoryScreen() {
  const { records, fetchHistory } = useAttendance();
  const [filter, setFilter] = useState('month');
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    const now = new Date();
    return records.filter((r) => {
      const date = new Date(`${r.date}T12:00:00`);
      return filter === 'month'
        ? date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
        : true;
    });
  }, [filter, records]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchHistory();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PRESENT':
        return '#4caf50';
      case 'LATE':
        return '#ff9800';
      case 'ABSENT':
        return '#f44336';
      case 'LEAVE':
        return '#2196f3';
      default:
        return '#999';
    }
  };

  return (
    <View style={styles.page}>
      <Text variant="titleMedium">Attendance Records</Text>
      <SegmentedButtons
        value={filter}
        onValueChange={setFilter}
        buttons={[
          { value: 'month', label: 'This Month' },
          { value: 'all', label: 'All Time' },
        ]}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={filtered.length ? styles.list : styles.empty}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text variant="bodyLarge" style={styles.muted}>
            No attendance records for this period.
          </Text>
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.row}>
                <View style={styles.info}>
                  <Text variant="titleSmall" style={styles.date}>
                    {label(item)}
                  </Text>
                  <Text variant="bodySmall" style={styles.time}>
                    Check-in: {time(item.checkIn)}
                    {item.checkOut && ` · Check-out: ${time(item.checkOut)}`}
                  </Text>
                  {item.guardName && (
                    <Text variant="bodySmall" style={styles.guardInfo}>
                      Guard: {item.guardName}
                    </Text>
                  )}
                  {item.markedBy && item.markedBy !== item.guardName && (
                    <Text variant="bodySmall" style={styles.markedByInfo}>
                      Marked by: {item.markedBy}
                    </Text>
                  )}
                </View>
                <Chip
                  compact={true}
                  style={[
                    styles.chip,
                    { backgroundColor: getStatusColor(item.status) },
                  ]}
                  textStyle={styles.chipText}
                >
                  {item.status}
                </Chip>
              </View>
            </Card.Content>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    padding: 20,
    gap: 16,
    backgroundColor: '#F7F9FC',
  },
  list: {
    gap: 10,
    paddingBottom: 20,
  },
  empty: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
  },
  cardContent: {
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  info: {
    flex: 1,
  },
  date: {
    fontWeight: '600',
    color: '#333',
  },
  time: {
    color: '#666',
    marginTop: 4,
  },
  guardInfo: {
    color: '#1976d2',
    marginTop: 2,
  },
  markedByInfo: {
    color: '#999',
    marginTop: 2,
    fontStyle: 'italic',
  },
  chip: {
    minWidth: 80,
  },
  chipText: {
    color: '#fff',
    fontWeight: '600',
  },
  muted: {
    color: '#65708A',
    textAlign: 'center',
  },
});

