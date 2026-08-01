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

// Import local logo from document/logo11.png
const logoImg = require('../../document/logo11.png');

export function DashboardScreen() {
  const { user } = useAuth();
  const { checkIn } = useAttendance();

  const [date, setDate] = useState('20/08/2026');
  const [time, setTime] = useState('08:30 AM');
  const [post, setPost] = useState('North Gate');
  const [designation, setDesignation] = useState('Security Officer');
  const [id, setId] = useState(user?.id || '1024');
  const [name, setName] = useState(user?.name || 'John Doe');
  const [hour, setHour] = useState('08');
  const [attendance, setAttendance] = useState('Present');
  const [loading, setLoading] = useState(false);

  const handleGoSubmit = async () => {
    setLoading(true);
    try {
      // 1. Request GPS Location Permission
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        throw new Error('Location permission is required to submit attendance.');
      }

      // 2. Fetch current GPS coordinates
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // 3. Record attendance into Context
      checkIn({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      });

      Alert.alert(
        'Attendance Recorded',
        `Guard ID: ${id}\nName: ${name}\nPost: ${post}\nLocation verified.`
      );
    } catch (error) {
      Alert.alert(
        'Attendance Failed',
        error instanceof Error ? error.message : 'Unable to verify location.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Branding with local logo */}
          <View style={styles.brandingContainer}>
            <Image source={logoImg} style={styles.logo} resizeMode="contain" />
          </View>

          {/* Form Fields */}
          <View style={styles.formCard}>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <TextInput value={date} onChangeText={setDate} placeholder="Date" placeholderTextColor="#8E8E8E" style={styles.input} />
              </View>
              <View style={styles.halfInput}>
                <TextInput value={time} onChangeText={setTime} placeholder="Time" placeholderTextColor="#8E8E8E" style={styles.input} />
              </View>
            </View>

            <View style={styles.fullInput}>
              <TextInput value={post} onChangeText={setPost} placeholder="Select Post" placeholderTextColor="#8E8E8E" style={styles.input} />
              <Text style={styles.arrow}>▾</Text>
            </View>

            <View style={styles.fullInput}>
              <TextInput value={designation} onChangeText={setDesignation} placeholder="Designation" placeholderTextColor="#8E8E8E" style={styles.input} />
              <Text style={styles.arrow}>▾</Text>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <TextInput value={id} onChangeText={setId} placeholder="ID" placeholderTextColor="#8E8E8E" keyboardType="numeric" style={styles.input} />
              </View>
              <View style={styles.halfInput}>
                <TextInput value={name} onChangeText={setName} placeholder="Name" placeholderTextColor="#8E8E8E" style={styles.input} />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <TextInput value={hour} onChangeText={setHour} placeholder="Hour" placeholderTextColor="#8E8E8E" keyboardType="numeric" style={styles.input} />
              </View>
              <View style={styles.halfInput}>
                <TextInput value={attendance} onChangeText={setAttendance} placeholder="Attendance" placeholderTextColor="#8E8E8E" style={styles.input} />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* GO Button */}
        <View style={styles.submitContainer}>
          <TouchableOpacity activeOpacity={0.85} onPress={handleGoSubmit} disabled={loading}>
            <LinearGradient colors={['#C88C2A', '#A86C1D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.outerRing}>
              <View style={styles.innerCircle}>
                <Text style={styles.buttonText}>{loading ? '...' : 'GO '}</Text>
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
  brandingTextWrap: { alignItems: 'center' },
  falconText: { fontSize: 28, fontWeight: '800', color: '#006B3F', letterSpacing: 1 },
  securityText: { fontSize: 12, fontWeight: '700', color: '#006B3F', letterSpacing: 1.2, marginTop: 2 },
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