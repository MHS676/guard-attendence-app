import * as Location from 'expo-location';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Avatar, Button, Card, Chip, Text } from 'react-native-paper';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';

const formatTime = (iso?: string) => iso ? new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(iso)) : '';
export function DashboardScreen() {
  const { user } = useAuth(); const { activeRecord, checkIn, checkOut } = useAttendance(); const [working, setWorking] = useState(false);
  const handleCheckIn = async () => {
    setWorking(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') throw new Error('Location permission is required to verify your check-in.');
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      if (location.coords.accuracy !== null && location.coords.accuracy > 100) throw new Error('Your GPS signal is too weak. Move outdoors and try again.');
      // Send these coordinates to your API and validate the office geofence server-side before recording attendance.
      checkIn({ latitude: location.coords.latitude, longitude: location.coords.longitude, accuracy: location.coords.accuracy });
    } catch (error) { Alert.alert('Check-in unavailable', error instanceof Error ? error.message : 'Unable to get your location.'); }
    finally { setWorking(false); }
  };
  const handleAttendance = activeRecord ? checkOut : handleCheckIn;
  return <View style={styles.page}>
    <Card mode="contained" style={styles.profile}><Card.Content style={styles.profileContent}><Avatar.Text size={56} label={user?.name.split(' ').map((part) => part[0]).join('').slice(0, 2) || 'U'} /><View><Text variant="titleLarge">{user?.name}</Text><Text variant="bodyMedium">{user?.role}</Text></View></Card.Content></Card>
    <Card style={styles.attendance}><Card.Content style={styles.center}><Chip icon={activeRecord ? 'clock-check-outline' : 'calendar-outline'}>{activeRecord ? 'Currently on site' : 'Not checked in'}</Chip><Text variant="headlineSmall" style={styles.status}>{activeRecord ? `Checked in at ${formatTime(activeRecord.checkIn)}` : 'Ready to start your day?'}</Text><Text variant="bodyMedium" style={styles.muted}>{activeRecord ? 'Remember to check out when you leave.' : 'Your location will be verified before check-in.'}</Text><Button mode="contained" icon={activeRecord ? 'logout' : 'map-marker-check'} loading={working} disabled={working} onPress={handleAttendance} contentStyle={styles.action}>{activeRecord ? 'Check out' : 'Check in'}</Button></Card.Content></Card>
    <Text variant="titleMedium">Today</Text><Text variant="bodyMedium" style={styles.muted}>{activeRecord ? `GPS recorded · ±${Math.round(activeRecord.location?.accuracy ?? 0)}m accuracy` : 'No attendance record yet.'}</Text>
  </View>;
}
const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: '#F7F9FC', padding: 20, gap: 20 }, profile: { backgroundColor: '#EAF1FF' }, profileContent: { flexDirection: 'row', alignItems: 'center', gap: 14 }, attendance: { marginTop: 4 }, center: { alignItems: 'center', paddingVertical: 28, gap: 14 }, status: { textAlign: 'center', fontWeight: '700' }, muted: { color: '#65708A', textAlign: 'center' }, action: { height: 48, paddingHorizontal: 20 } });
