import React, { useState } from 'react';
import { View, Button, Text, Alert, ActivityIndicator } from 'react-native';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import { getCurrentCoordinates } from '../utils/location';

export function CheckInScreen({ selectedPostId }: { selectedPostId: string }) {
  const { checkIn } = useAttendance();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleAutomaticCheckIn = async () => {
    if (!user?.id || !selectedPostId) {
      Alert.alert('Error', 'Missing user session or selected post.');
      return;
    }

    setLoading(true);

    try {
      // 1. Get GPS coordinates automatically
      const { latitude, longitude } = await getCurrentCoordinates();

      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // 2. Submit check-in payload with captured coordinates
      await checkIn({
        userId: user.id,
        markedById: user.id, // Or coordinator ID
        postId: selectedPostId,
        date: dateStr,
        time: timeStr,
        shiftHours: 8,
        status: 'PRESENT',
        captureLatitude: latitude,
        captureLongitude: longitude,
      });

      Alert.alert('Success', `Attendance marked at (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
    } catch (error: any) {
      Alert.alert('Attendance Failed', error.message || 'Unable to fetch location.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button title="Mark Attendance" onPress={handleAutomaticCheckIn} />
      )}
    </View>
  );
}