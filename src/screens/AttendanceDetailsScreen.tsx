import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import { AttendanceRecord } from '../types';

export function AttendanceDetailsScreen() {
  const { records, fetchHistory } = useAttendance();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      await fetchHistory();
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchHistory();
    } catch (error) {
      console.error('Error refreshing attendance:', error);
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

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PRESENT':
        return '✓';
      case 'LATE':
        return '⏱';
      case 'ABSENT':
        return '✗';
      case 'LEAVE':
        return '📋';
      default:
        return '?';
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading attendance records...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance Records</Text>
        <Text style={styles.headerSubtitle}>{records.length} total records</Text>
      </View>

      {records.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No attendance records found</Text>
        </View>
      ) : (
        <View style={styles.recordsContainer}>
          {records.map((record) => (
            <AttendanceRecordCard key={record.id} record={record} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function AttendanceRecordCard({ record }: { record: AttendanceRecord }) {
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

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PRESENT':
        return '✓';
      case 'LATE':
        return '⏱';
      case 'ABSENT':
        return '✗';
      case 'LEAVE':
        return '📋';
      default:
        return '?';
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.dateSection}>
          <Text style={styles.dateText}>{record.date}</Text>
          <Text style={styles.checkInText}>{record.checkIn || 'N/A'}</Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(record.status) },
          ]}
        >
          <Text style={styles.statusIcon}>{getStatusIcon(record.status)}</Text>
          <Text style={styles.statusBadgeText}>{record.status}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        {record.guardName && (
          <DetailRow label="Guard:" value={record.guardName} />
        )}

        {record.markedBy && (
          <DetailRow label="Marked By:" value={record.markedBy} />
        )}

        {record.location && (
          <DetailRow
            label="Location:"
            value={`${record.location.latitude.toFixed(4)}, ${record.location.longitude.toFixed(
              4,
            )}`}
          />
        )}

        {record.checkOut && <DetailRow label="Check Out:" value={record.checkOut} />}
      </View>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  header: {
    backgroundColor: '#1976d2',
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#b3e5fc',
    marginTop: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  recordsContainer: {
    padding: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dateSection: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  checkInText: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusIcon: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  cardBody: {
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  detailLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
});
