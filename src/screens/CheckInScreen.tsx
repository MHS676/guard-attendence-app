import React, { useState, useMemo, useEffect } from 'react';
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
  TextInput,
  Picker,
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
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [postName, setPostName] = useState<string>('');
  const [postCode, setPostCode] = useState<string>('');
  const [guardCode, setGuardCode] = useState<string>(user?.id || '');
  const [shiftHours, setShiftHours] = useState<string>('8');

  // Auto-populate date and time on component mount
  useEffect(() => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    setDate(dateStr);
    setTime(timeStr);
  }, []);

  // Auto-populate guard code when user changes
  useEffect(() => {
    if (user?.id) {
      setGuardCode(user.id);
    }
  }, [user?.id]);

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
        postName: postName,
        postCode: postCode,
        guardCode: guardCode,
        date: date,
        time: time,
        shiftHours: parseInt(shiftHours, 10) || 8,
        status: selectedStatus || 'PRESENT',
        captureLatitude: latitude,
        captureLongitude: longitude,
        captureAddress: captureAddress,
      };

      console.log('📤 [CheckInScreen] Submitting payload:', payload);

      // 3. Submit check-in request
      const response = await checkIn(payload);

      Alert.alert(
        'Success',
        `✅ Attendance marked successfully!`,
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

        {/* Input Section - Shift Hours */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Shift Hours:</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter shift hours"
            value={shiftHours}
            onChangeText={setShiftHours}
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
        </View>

        {/* Check-In Button */}
        <View style={styles.buttonContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : (
            <Button
              title="Mark Attendance"
              onPress={handleAutomaticCheckIn}
              disabled={selectedGuardIds.length === 0}
            />
          )}
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
    marginBottom: 8,
    color: '#555',
  },
  inputSection: {
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  readOnlyInput: {
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
  readOnlyValue: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
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