import { useState } from 'react';
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
import { useAuth } from '../context/AuthContext';

const falconLogo = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
    <rect width="160" height="160" rx="32" fill="#F8E8D2"/>
    <path d="M95 34c-9-6-20-6-29 2-10 8-16 21-16 35 0 10 4 21 11 29 7 8 17 13 27 13 14 0 28-7 36-18 7-10 9-21 7-32-2-13-9-25-20-29-4-2-8-3-12-3-2 0-5 1-4 3z" fill="#8C4A12"/>
    <path d="M83 44c-3 1-5 3-6 6-1 3-1 6 0 9 1 3 3 5 6 7l11 6c3 2 6 3 9 3 3 0 6-2 8-4 2-2 3-6 2-9 0-3-1-6-3-8l-9-10c-2-3-5-4-8-4-3 0-6 1-10 4z" fill="#A9621B"/>
    <path d="M63 81c-4 4-6 9-6 14 0 4 2 8 5 11 3 3 8 5 13 5 7 0 14-3 19-8 3-3 4-6 4-9 0-4-2-8-5-10l-6-4c-3-2-6-3-9-3-4 0-8 2-11 4z" fill="#B96B1F"/>
    <path d="M71 57c-4 2-7 5-9 10-1 5-1 10 1 15 3 6 8 10 14 11 5 1 10-1 14-5 4-4 6-9 7-14 0-4-1-8-3-12l-7-7c-3-3-6-4-10-4-3 0-6 1-7 6z" fill="#7A3A0F"/>
    <circle cx="93" cy="62" r="6" fill="#2A1B10"/>
    <path d="M76 87c9 8 18 11 29 8" stroke="#2A1B10" stroke-width="4" stroke-linecap="round" fill="none"/>
  </svg>
`)}`;

export function LoginScreen() {
  const { signIn } = useAuth();
  const [date, setDate] = useState('20/08/2026');
  const [time, setTime] = useState('08:30 AM');
  const [post, setPost] = useState('North Gate');
  const [designation, setDesignation] = useState('Security Officer');
  const [id, setId] = useState('1024');
  const [name, setName] = useState('John Doe');
  const [hour, setHour] = useState('08');
  const [attendance, setAttendance] = useState('Present');

  const handleSubmit = async () => {
    const email = `guard-${id}@falconsecurity.com`;
    const password = `Falcon@${id}`;
    const payload = { date, time, post, designation, id, name, hour, attendance, email, password };

    console.log('Dummy Login Data', payload);

    try {
      await signIn(email, password, true);
      Alert.alert('Dummy Login Successful', `Welcome, Guard ID: ${id}`);
    } catch (error) {
      Alert.alert('Sign in failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.brandingContainer}>
            <Image source={{ uri: falconLogo }} style={styles.logo} />
            <View style={styles.brandingTextWrap}>
              <Text style={styles.falconText}>FALCON®</Text>
              <Text style={styles.securityText}>SECURITY LIMITED</Text>
            </View>
          </View>

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

        <View style={styles.submitContainer}>
          <TouchableOpacity activeOpacity={0.9} onPress={handleSubmit}>
            <LinearGradient colors={['#C88C2A', '#A86C1D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.outerRing}>
              <View style={styles.innerCircle}>
                <Text style={styles.buttonText}>GO</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 140,
  },
  brandingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 22,
  },
  logo: {
    width: 74,
    height: 74,
    marginBottom: 8,
  },
  brandingTextWrap: {
    alignItems: 'center',
  },
  falconText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#006B3F',
    letterSpacing: 1,
  },
  securityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#006B3F',
    letterSpacing: 1.2,
    marginTop: 2,
  },
  formCard: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderColor: '#D9D9D9',
    borderWidth: 1,
    paddingHorizontal: 12,
    minHeight: 50,
  },
  fullInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderColor: '#D9D9D9',
    borderWidth: 1,
    paddingHorizontal: 12,
    minHeight: 50,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#222222',
    paddingVertical: 12,
  },
  arrow: {
    fontSize: 18,
    color: '#A9A9A9',
    marginLeft: 8,
  },
  submitContainer: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
  },
  outerRing: {
    width: 124,
    height: 124,
    borderRadius: 62,
    padding: 10,
    shadowColor: '#6F3D0A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 12,
  },
  innerCircle: {
    flex: 1,
    borderRadius: 56,
    backgroundColor: '#006B3F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
