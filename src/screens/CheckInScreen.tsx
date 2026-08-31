import React, { useState, useMemo } from 'react';
import {
  View,
  Button,
  Text,
  Alert,
  ActivityIndicator,
  ScrollView,
  CheckBox,
  StyleSheet,
  Dimensions,
} from 'react-native';
import * as Location from 'expo-location';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import { getCurrentCoordinates } from '../utils/location';

export function CheckInScreen({ selectedPostId }: { selectedPostId: string }) {
  const { checkIn } = useAttendance();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('PRESENT');
  const [selectedGuardIds, setSelectedGuardIds] = useState<string[]>(user?.id ? [user.id] : []);

  // Determine if this user can mark for multiple guards
  const canMarkMultiple = useMemo(() => {
    return (
      user?.role === 'SECURITY_SUPERVISOR' ||
      user?.role === 'COORDINATOR' ||
      user?.role === 'SECURITY_IN_CHARGE'
    );
  }, [user?.role]);

  const handleGuardSelection = (guardId: string) => {
    if (guardId === user?.id && !canMarkMultiple) {
      // Single guard can only mark for themselves
      return;
    }

    setSelectedGuardIds((prev) => {
      if (prev.includes(guardId)) {
        return prev.filter((id) => id !== guardId);
      } else {
        return [...prev, guardId];
      }
    });
  };

  const handleAutomaticCheckIn = async () => {
    if (!user?.id || !user?.email || !selectedPostId) {
      Alert.alert('Error', 'Missing user session or selected post.');
      return;
    }

    if (selectedGuardIds.length === 0) {
      Alert.alert('Error', 'Please select at least one guard to mark attendance.');
      return;
    }

    setLoading(true);

    try {
      // 1. Get GPS coordinates automatically
      const { latitude, longitude } = await getCurrentCoordinates();

      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      // 1a. Try to reverse geocode coordinates to address
      let captureAddress = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      try {
        const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        const place = geocode[0];
        if (place) {
          captureAddress = [place.name, place.street, place.subregion, place.city]
            .filter(Boolean)
            .join(', ');
        }
      } catch (geoError) {
        console.warn('Reverse geocoding failed, using coordinates:', geoError);
      }

      // 2. Build payload - send user email for backend lookup, not numeric ID
      // Note: For now, guards can only mark for themselves, so always send their own email
      const payload = {
        userEmails: [user.email],
        postId: selectedPostId,
        date: dateStr,
        time: timeStr,
        shiftHours: 8,
        status: selectedStatus || 'PRESENT',
        captureLatitude: latitude,
        captureLongitude: longitude,
        captureAddress: captureAddress,
      };

      console.log('📤 [CheckInScreen] Submitting payload:', payload);

      // 3. Submit check-in request
      const response = await checkIn(payload);

      const guardCount = response.guardCount || 1;
      Alert.alert(
        'Success',
        `✅ Attendance marked for ${guardCount} guard(s)\n\nLocation: (${latitude.toFixed(
          4,
        )}, ${longitude.toFixed(4)})\nTime: ${timeStr}`,
      );

      // Reset selection after success
      setSelectedGuardIds(user?.id ? [user.id] : []);
    } catch (error: any) {
      console.error('❌ [CheckInScreen] Attendance failed:', error);
      Alert.alert(
        'Attendance Failed',
        error.message ||
          error.response?.data?.message ||
          'Unable to mark attendance. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Mark Attendance</Text>

        {/* Status Selection */}
        <View style={styles.statusContainer}>
          <Text style={styles.label}>Attendance Status:</Text>
          {['PRESENT', 'LATE', 'ABSENT', 'LEAVE'].map((status) => (
            <View key={status} style={styles.statusOption}>
              <CheckBox
                value={selectedStatus === status}
                onValueChange={() => setSelectedStatus(status)}
              />
              <Text style={styles.statusText}>{status}</Text>
            </View>
          ))}
        </View>

        {/* Multi-Guard Selection (if supervisor/coordinator) */}
        {canMarkMultiple && (
          <View style={styles.guardSelectionContainer}>
            <Text style={styles.label}>Select Guards:</Text>
            <Text style={styles.hint}>
              {selectedGuardIds.length} guard(s) selected
            </Text>
            {/* In a real app, fetch guards assigned to this post */}
            <View style={styles.guardCheckbox}>
              <CheckBox
                value={selectedGuardIds.includes(user?.id || '')}
                onValueChange={() => handleGuardSelection(user?.id || '')}
              />
              <Text style={styles.guardName}>{user?.name} (You)</Text>
            </View>
          </View>
        )}

        {/* Check-In Button */}
        <View style={styles.buttonContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : (
            <Button
              title={
                canMarkMultiple
                  ? `Mark Attendance (${selectedGuardIds.length})`
                  : 'Mark Attendance'
              }
              onPress={handleAutomaticCheckIn}
              disabled={selectedGuardIds.length === 0}
            />
          )}
        </View>

        {/* Info Display */}
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Role: {user?.role}</Text>
          <Text style={styles.infoLabel}>Can mark for multiple: {canMarkMultiple ? 'Yes' : 'No'}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#555',
  },
  statusContainer: {
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  statusText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
  guardSelectionContainer: {
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginBottom: 10,
  },
  guardCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  guardName: {
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
  buttonContainer: {
    marginVertical: 20,
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  infoLabel: {
    fontSize: 13,
    color: '#1976d2',
    marginVertical: 4,
  },
});