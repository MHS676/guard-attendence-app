import React, { useState, useEffect } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
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
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.72:5000';

const DESIGNATIONS = ['Security Guard', 'Security Supervisor', 'Zone Coordinator', 'In Charge', 'Manager'];
const SHIFT_HOURS = ['8', '12'];
const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'LEAVE'];

interface PostOption {
  id: string;
  name: string;
  code: string;
}

interface GuardOption {
  userId: string;
  userCode: string;
  name: string;
  designation: string;
}

export function DashboardScreen() {
  const { user } = useAuth();
  const { checkIn } = useAttendance();

  // Date and Time Helpers
  const getFormattedDate = () => new Date().toISOString().slice(0, 10);
  const getFormattedTime = () =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  // Auto Fill Date & Time
  const [date, setDate] = useState(getFormattedDate());
  const [time, setTime] = useState(getFormattedTime());
  const [isManualTimeEdit, setIsManualTimeEdit] = useState(false);

  // Auto-update Date & Time every second
  useEffect(() => {
    if (isManualTimeEdit) return;

    const interval = setInterval(() => {
      setDate(getFormattedDate());
      setTime(getFormattedTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [isManualTimeEdit]);

  // Options Data
  const [posts, setPosts] = useState<PostOption[]>([]);
  const [guards, setGuards] = useState<GuardOption[]>([]);

  // Form State
  const [selectedPost, setSelectedPost] = useState<PostOption | null>(null);
  const [postSearch, setPostSearch] = useState('');
  const [showPostSuggestions, setShowPostSuggestions] = useState(false);

  const [userCodeSearch, setUserCodeSearch] = useState('');
  const [showGuardSuggestions, setShowGuardSuggestions] = useState(false);

  const [guardUserId, setGuardUserId] = useState(user?.id || '');
  const [guardName, setGuardName] = useState(user?.name || '');
  const [designation, setDesignation] = useState('Security Guard');
  const [hour, setHour] = useState('8');
  const [attendance, setAttendance] = useState('PRESENT');
  const [currentAddress, setCurrentAddress] = useState('Fetching current location...');
  const [loading, setLoading] = useState(false);

  // Modal State
  const [activeModal, setActiveModal] = useState<'designation' | 'hour' | 'status' | null>(null);

  useEffect(() => {
    fetchPosts();
    fetchGuards();
    fetchCurrentLocationAddress();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${API_URL}/posts`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.log('Error fetching posts:', err);
    }
  };

  const fetchGuards = async () => {
    try {
      const res = await fetch(`${API_URL}/guards`);
      if (res.ok) {
        const data = await res.json();
        setGuards(data);
      }
    } catch (err) {
      console.log('Error fetching guards:', err);
    }
  };

  // Reverse Geocode helper to get address string from GPS coordinates
  const fetchCurrentLocationAddress = async () => {
    try {
      if (Platform.OS !== 'web') {
        const isEnabled = await Location.hasServicesEnabledAsync();
        if (!isEnabled) {
          setCurrentAddress('Location services disabled');
          return;
        }

        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.status !== 'granted') {
          setCurrentAddress('Location permission denied');
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const geocode = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        const place = geocode[0];
        if (place) {
          const addressParts = [
            place.name,
            place.street,
            place.subregion || place.district,
            place.city,
          ].filter(Boolean);

          setCurrentAddress(addressParts.join(', ') || 'Location acquired');
        } else {
          setCurrentAddress(`${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
        }
      }
    } catch (error) {
      // Some emulators and phones with a cold GPS have no current fix yet.
      // A last known location is still useful for the read-only address preview.
      const lastLocation = await Location.getLastKnownPositionAsync().catch(() => null);
      if (lastLocation) {
        setCurrentAddress(
          `${lastLocation.coords.latitude.toFixed(4)}, ${lastLocation.coords.longitude.toFixed(4)}`
        );
      } else {
        setCurrentAddress('Location unavailable — turn on GPS or set an emulator location');
      }
    }
  };

  // Auto-fill Guard Name and Designation on User Code match
  useEffect(() => {
    if (!userCodeSearch.trim()) return;

    const matchedGuard = guards.find(
      (g) =>
        g.userCode.toLowerCase() === userCodeSearch.trim().toLowerCase() ||
        g.userId.toLowerCase() === userCodeSearch.trim().toLowerCase()
    );

    if (matchedGuard) {
      setGuardUserId(matchedGuard.userId);
      setGuardName(matchedGuard.name);
      if (matchedGuard.designation) {
        setDesignation(matchedGuard.designation);
      }
    }
  }, [userCodeSearch, guards]);

  const filteredPosts = posts.filter(
    (p) =>
      p.name.toLowerCase().includes(postSearch.toLowerCase()) ||
      p.code.toLowerCase().includes(postSearch.toLowerCase())
  );

  const filteredGuards = guards.filter(
    (g) =>
      g.userCode.toLowerCase().includes(userCodeSearch.toLowerCase()) ||
      g.name.toLowerCase().includes(userCodeSearch.toLowerCase())
  );

  const handleSelectGuard = (guard: GuardOption) => {
    setUserCodeSearch(guard.userCode);
    setGuardUserId(guard.userId);
    setGuardName(guard.name);
    if (guard.designation) {
      setDesignation(guard.designation);
    }
    setShowGuardSuggestions(false);
  };

  const handleSelectPost = (p: PostOption) => {
    setSelectedPost(p);
    setPostSearch(p.name);
    setShowPostSuggestions(false);
  };

  const handleGoSubmit = async () => {
    if (!selectedPost && !postSearch) {
      Alert.alert('Validation Error', 'Please select or enter a Post.');
      return;
    }

    if (!guardUserId) {
      Alert.alert('Validation Error', 'Please select or enter a valid Guard User Code.');
      return;
    }

    setLoading(true);

    let latitude = 23.8103;
    let longitude = 90.4125;
    let captureAddress = currentAddress;

    try {
      if (Platform.OS !== 'web') {
        const isLocationEnabled = await Location.hasServicesEnabledAsync();
        if (!isLocationEnabled) {
          Alert.alert(
            'Location Services Disabled',
            'Please turn on GPS / Location Services in your phone settings and try again.'
          );
          setLoading(false);
          return;
        }

        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required to log attendance.');
          setLoading(false);
          return;
        }

        try {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          latitude = loc.coords.latitude;
          longitude = loc.coords.longitude;

          const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
          const place = geocode[0];
          if (place) {
            captureAddress = [place.name, place.street, place.subregion, place.city]
              .filter(Boolean)
              .join(', ');
          }
        } catch (locErr) {
          console.warn('getCurrentPositionAsync failed, trying last known position:', locErr);
          const lastLoc = await Location.getLastKnownPositionAsync();
          if (lastLoc) {
            latitude = lastLoc.coords.latitude;
            longitude = lastLoc.coords.longitude;
          }
        }
      }

      await checkIn({
        userId: guardUserId,
        markedById: user?.id || guardUserId,
        postId: selectedPost?.id || postSearch,
        date: date,
        time: time,
        shiftHours: Number(hour) || 8,
        status: attendance.toUpperCase(),
        captureLatitude: latitude,
        captureLongitude: longitude,
        captureAddress: captureAddress, // <--- Sent to backend
      });

      Alert.alert(
        'Attendance Recorded',
        `Guard Code: ${userCodeSearch}\nName: ${guardName}\nPost: ${postSearch}\nAddress: ${captureAddress}\nSuccessfully logged.`
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brandingContainer}>
            <Image source={logoImg} style={styles.logo} resizeMode="contain" />
          </View>

          <View style={styles.formCard}>
            {/* Auto Date & Time */}
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <TextInput
                  value={date}
                  onChangeText={(val) => {
                    setIsManualTimeEdit(true);
                    setDate(val);
                  }}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#8E8E8E"
                  style={styles.input}
                />
              </View>
              <View style={styles.halfInput}>
                <TextInput
                  value={time}
                  onChangeText={(val) => {
                    setIsManualTimeEdit(true);
                    setTime(val);
                  }}
                  placeholder="HH:MM"
                  placeholderTextColor="#8E8E8E"
                  style={styles.input}
                />
              </View>
            </View>

            {/* Post Auto-suggestion */}
            <View style={styles.suggestionWrapper}>
              <View style={styles.fullInput}>
                <TextInput
                  value={postSearch}
                  onChangeText={(text) => {
                    setPostSearch(text);
                    setShowPostSuggestions(true);
                  }}
                  onFocus={() => setShowPostSuggestions(true)}
                  placeholder="Post Name / Code"
                  placeholderTextColor="#8E8E8E"
                  style={styles.input}
                />
                <Text style={styles.arrow}>▾</Text>
              </View>
              {showPostSuggestions && filteredPosts.length > 0 && (
                <View style={styles.suggestionBox}>
                  {filteredPosts.slice(0, 5).map((p) => (
                    <TouchableOpacity key={p.id} style={styles.suggestionItem} onPress={() => handleSelectPost(p)}>
                      <Text style={styles.suggestionText}>
                        {p.name} ({p.code})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Location Address Display Field */}
            <View style={styles.fullInput}>
              <TextInput
                value={currentAddress}
                onChangeText={setCurrentAddress}
                placeholder="Captured Location Address"
                placeholderTextColor="#8E8E8E"
                style={styles.input}
              />
              <TouchableOpacity onPress={fetchCurrentLocationAddress}>
                <Text style={styles.locationIcon}>📍</Text>
              </TouchableOpacity>
            </View>

            {/* Designation Dropdown Modal */}
            <TouchableOpacity style={styles.fullInput} onPress={() => setActiveModal('designation')}>
              <Text style={[styles.inputText, !designation && styles.placeholderText]}>
                {designation || 'Select Designation'}
              </Text>
              <Text style={styles.arrow}>▾</Text>
            </TouchableOpacity>

            {/* Guard User Code Input */}
            <View style={styles.suggestionWrapper}>
              <View style={styles.fullInput}>
                <TextInput
                  value={userCodeSearch}
                  onChangeText={(text) => {
                    setUserCodeSearch(text);
                    setShowGuardSuggestions(true);
                  }}
                  onFocus={() => setShowGuardSuggestions(true)}
                  placeholder="Guard User Code (e.g. BO6501)"
                  placeholderTextColor="#8E8E8E"
                  style={styles.input}
                />
                <Text style={styles.arrow}>▾</Text>
              </View>
              {showGuardSuggestions && filteredGuards.length > 0 && (
                <View style={styles.suggestionBox}>
                  {filteredGuards.slice(0, 5).map((g) => (
                    <TouchableOpacity
                      key={g.userId}
                      style={styles.suggestionItem}
                      onPress={() => handleSelectGuard(g)}
                    >
                      <Text style={styles.suggestionText}>
                        {g.userCode} - {g.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Guard Name Input (Auto-filled) */}
            <View style={styles.fullInput}>
              <TextInput
                value={guardName}
                onChangeText={setGuardName}
                placeholder="Guard Name"
                placeholderTextColor="#8E8E8E"
                style={styles.input}
              />
            </View>

            {/* Shift Hours & Attendance Status Dropdowns */}
            <View style={styles.row}>
              <TouchableOpacity style={styles.halfInput} onPress={() => setActiveModal('hour')}>
                <Text style={styles.inputText}>{hour} Hours</Text>
                <Text style={styles.arrow}>▾</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.halfInput} onPress={() => setActiveModal('status')}>
                <Text style={styles.inputText}>{attendance}</Text>
                <Text style={styles.arrow}>▾</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <TouchableOpacity activeOpacity={0.85} onPress={handleGoSubmit} disabled={loading}>
            <LinearGradient
              colors={['#C88C2A', '#A86C1D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.outerRing}
            >
              <View style={styles.innerCircle}>
                <Text style={styles.buttonText}>{loading ? '...' : 'GO'}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Modals */}
        <Modal visible={activeModal !== null} transparent animationType="fade">
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setActiveModal(null)}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Option</Text>
              {activeModal === 'designation' &&
                DESIGNATIONS.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={styles.modalOption}
                    onPress={() => {
                      setDesignation(d);
                      setActiveModal(null);
                    }}
                  >
                    <Text style={styles.modalOptionText}>{d}</Text>
                  </TouchableOpacity>
                ))}
              {activeModal === 'hour' &&
                SHIFT_HOURS.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={styles.modalOption}
                    onPress={() => {
                      setHour(h);
                      setActiveModal(null);
                    }}
                  >
                    <Text style={styles.modalOptionText}>{h} Hours</Text>
                  </TouchableOpacity>
                ))}
              {activeModal === 'status' &&
                ATTENDANCE_STATUSES.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={styles.modalOption}
                    onPress={() => {
                      setAttendance(s);
                      setActiveModal(null);
                    }}
                  >
                    <Text style={styles.modalOptionText}>{s}</Text>
                  </TouchableOpacity>
                ))}
            </View>
          </TouchableOpacity>
        </Modal>
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
  suggestionWrapper: { zIndex: 10 },
  suggestionBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 8,
    marginTop: 4,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  suggestionItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  suggestionText: { fontSize: 14, color: '#222222' },
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
    justifyContent: 'space-between',
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
    justifyContent: 'space-between',
  },
  input: { flex: 1, fontSize: 14, color: '#222222', paddingVertical: 12 },
  inputText: { fontSize: 14, color: '#222222' },
  placeholderText: { color: '#8E8E8E' },
  arrow: { fontSize: 18, color: '#A9A9A9', marginLeft: 8 },
  locationIcon: { fontSize: 18, marginLeft: 8 },
  submitContainer: { position: 'absolute', bottom: 24, alignSelf: 'center' },
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
  buttonText: { color: '#FFFFFF', fontSize: 30, fontWeight: '800', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 14, color: '#222222' },
  modalOption: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEEEEE' },
  modalOptionText: { fontSize: 16, color: '#333333' },
});
