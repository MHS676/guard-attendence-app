import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';

const logoImg = require('../../document/logo11.png');

export function DashboardScreen() {
  const { user } = useAuth();
  const { checkIn } = useAttendance();

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
  const [post, setPost] = useState('North Gate');
  const [designation, setDesignation] = useState('Security Officer');
  const [id, setId] = useState(user?.id || '1001');
  const [name, setName] = useState(user?.name || 'Demo Guard');
  const [hour, setHour] = useState('8');
  const [attendance, setAttendance] = useState('PRESENT');
  const [loading, setLoading] = useState(false);

  const handleGoSubmit = async () => {
    setLoading(true);
    try {
      let latitude = 23.8103;
      let longitude = 90.4125;

      if (Platform.OS !== 'web') {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          latitude = loc.coords.latitude;
          longitude = loc.coords.longitude;
        }
      }

      await checkIn({
        userId: id,
        markedById: user?.id || id,
        postId: post,
        date: date,
        time: time,
        shiftHours: Number(hour) || 8,
        status: attendance.toUpperCase(),
        captureLatitude: latitude,
        captureLongitude: longitude,
      });

      Alert.alert(
        'Attendance Recorded',
        `Guard ID: ${id}\nName: ${name}\nPost: ${post}\nSuccessfully logged to backend.`
      );
    } catch (error) {
      Alert.alert(
        'Attendance Failed',
        error instanceof Error ? error.message : 'Unable to log attendance to backend.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.brandingContainer}>
            <Image source={logoImg} style={styles.logo} resizeMode="contain" />
          </View>

          <View style={styles.formCard}>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <TextInput value={date} onChangeText={setDate} placeholder="Date (YYYY-MM-DD)" placeholderTextColor="#8E8E8E" style={styles.input} />
              </View>
              <View style={styles.halfInput}>
                <TextInput value={time} onChangeText={setTime} placeholder="Time" placeholderTextColor="#8E8E8E" style={styles.input} />
              </View>
            </View>

            <View style={styles.fullInput}>
              <TextInput value={post} onChangeText={setPost} placeholder="Post / Gate ID" placeholderTextColor="#8E8E8E" style={styles.input} />
              <Text style={styles.arrow}>▾</Text>
            </View>

            <View style={styles.fullInput}>
              <TextInput value={designation} onChangeText={setDesignation} placeholder="Designation" placeholderTextColor="#8E8E8E" style={styles.input} />
              <Text style={styles.arrow}>▾</Text>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <TextInput value={id} onChangeText={setId} placeholder="Guard User ID" placeholderTextColor="#8E8E8E" style={styles.input} />
              </View>
              <View style={styles.halfInput}>
                <TextInput value={name} onChangeText={setName} placeholder="Guard Name" placeholderTextColor="#8E8E8E" style={styles.input} />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <TextInput value={hour} onChangeText={setHour} placeholder="Shift Hours" placeholderTextColor="#8E8E8E" keyboardType="numeric" style={styles.input} />
              </View>
              <View style={styles.halfInput}>
                <TextInput value={attendance} onChangeText={setAttendance} placeholder="PRESENT / ABSENT" placeholderTextColor="#8E8E8E" style={styles.input} />
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.submitContainer}>
          <TouchableOpacity activeOpacity={0.85} onPress={handleGoSubmit} disabled={loading}>
            <LinearGradient colors={['#C88C2A', '#A86C1D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.outerRing}>
              <View style={styles.innerCircle}>
                <Text style={styles.buttonText}>{loading ? '...' : 'GO'}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollContent: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 140 },
  brandingContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 4, marginBottom: 22 },
  logo: { width: 120, height: 120, marginBottom: 6 },
  formCard: { gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: {
    flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 8,
    backgroundColor: '#FFFFFF', borderColor: '#D9D9D9', borderWidth: 1,
    paddingHorizontal: 12, minHeight: 50,
  },
  fullInput: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 8,
    backgroundColor: '#FFFFFF', borderColor: '#D9D9D9', borderWidth: 1,
    paddingHorizontal: 12, minHeight: 50,
  },
  input: { flex: 1, fontSize: 14, color: '#222222', paddingVertical: 12 },
  arrow: { fontSize: 18, color: '#A9A9A9', marginLeft: 8 },
  submitContainer: { position: 'absolute', bottom: 24, alignSelf: 'center' },
  outerRing: {
    width: 124, height: 124, borderRadius: 62, padding: 10,
    shadowColor: '#6F3D0A', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45, shadowRadius: 10, elevation: 12,
  },
  innerCircle: {
    flex: 1, borderRadius: 56, backgroundColor: '#006B3F',
    alignItems: 'center', justifyContent: 'center',
  },
  buttonText: { color: '#FFFFFF', fontSize: 30, fontWeight: '800', letterSpacing: 1 },
});