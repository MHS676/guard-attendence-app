import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import * as SecureStore from 'expo-secure-store';
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
  email: string;
  designation: string;
}

export function DashboardScreen() {
  const { user } = useAuth();
  const { checkIn } = useAttendance();

  // Date and Time Helpers - Memoized
  const getFormattedDate = useCallback(() => new Date().toISOString().slice(0, 10), []);
  const getFormattedTime = useCallback(
    () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    []
  );

  // Auto Fill Date & Time
  const [date, setDate] = useState(getFormattedDate());
  const [time, setTime] = useState(getFormattedTime());
  const [isManualTimeEdit, setIsManualTimeEdit] = useState(false);

  // Auto-update Date & Time every second - Optimized
  useEffect(() => {
    if (isManualTimeEdit) return;

    // Update immediately on first render
    setDate(getFormattedDate());
    setTime(getFormattedTime());

    const interval = setInterval(() => {
      setDate(getFormattedDate());
      setTime(getFormattedTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [isManualTimeEdit, getFormattedDate, getFormattedTime]);

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
  const [guardEmail, setGuardEmail] = useState(user?.email || '');
  const [designation, setDesignation] = useState('Security Guard');
  const [hour, setHour] = useState('8');
  const [attendance, setAttendance] = useState('PRESENT');
  const [currentAddress, setCurrentAddress] = useState('Fetching current location...');
  const [loading, setLoading] = useState(false);

  // Modal State
  const [activeModal, setActiveModal] = useState<'designation' | 'hour' | 'status' | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      // Get session from SecureStore (token stored as part of session object)
      const sessionRaw = await SecureStore.getItemAsync('attendance.session');
      const session = sessionRaw ? JSON.parse(sessionRaw) : null;
      const token = session?.token;
      
      if (!token) {
        console.warn('⚠️ [fetchPosts] No token found in SecureStore!');
        return;
      }
      
      const headers: any = { 'Content-Type': 'application/json' };
      headers['Authorization'] = `Bearer ${token}`;
      
      const url = `${API_URL}/posts`;
      const res = await fetch(url, { headers });
      
      if (res.ok) {
        const data = await res.json();
        console.log('📋 Fetched posts:', data?.length, 'posts');
        setPosts(data || []);
      } else {
        console.error('❌ Failed to fetch posts:', res.status);
      }
    } catch (err) {
      console.error('❌ Error fetching posts:', err);
    }
  }, []);

  const fetchGuards = useCallback(async () => {
    try {
      // Get session from SecureStore (token stored as part of session object)
      const sessionRaw = await SecureStore.getItemAsync('attendance.session');
      const session = sessionRaw ? JSON.parse(sessionRaw) : null;
      const token = session?.token;
      
      if (!token) {
        console.warn('⚠️ [fetchGuards] No token found in SecureStore!');
        return;
      }
      
      const headers: any = { 'Content-Type': 'application/json' };
      headers['Authorization'] = `Bearer ${token}`;
      
      const url = `${API_URL}/users?role=SECURITY_GUARD`;
      const res = await fetch(url, { headers });
      
      if (res.ok) {
        const data = await res.json();
        // Transform users to guard format
        const guardsData = (data || []).map((user: any) => ({
          userId: user.id,
          userCode: user.employeeId || user.id,
          name: user.name,
          email: user.email,
          designation: user.designation || 'Security Guard',
        }));
        console.log('👮 Fetched guards:', guardsData?.length, 'guards');
        setGuards(guardsData || []);
      } else {
        console.error('❌ Failed to fetch guards:', res.status);
      }
    } catch (err) {
      console.error('❌ Error fetching guards:', err);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchGuards();
    fetchCurrentLocationAddress();
  }, [fetchPosts, fetchGuards]);

  // Reverse Geocode helper with timeout - Memoized
  const fetchCurrentLocationAddress = useCallback(async () => {
    try {
      if (Platform.OS !== 'web') {
        try {
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

          // Use timeout to prevent hanging (12 seconds for initial load)
          const locPromise = Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Location timeout')), 12000)
          );

          const loc = (await Promise.race([locPromise, timeoutPromise])) as any;

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
        } catch (err) {
          // Non-critical error - don't warn, just use fallback
          setCurrentAddress('📍 Location acquired');
        }
      }
    } catch (err) {
      // Outer catch shouldn't be reached, but keep for safety
      setCurrentAddress('📍 Location acquired');
    }
  }, []);

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
  
  if (postSearch && filteredPosts.length > 0) {
    console.log('✅ Filtered posts:', filteredPosts.length, 'for search:', postSearch);
  }

  const filteredGuards = guards.filter(
    (g) => {
      const searchText = userCodeSearch.toLowerCase();
      return (
        g.userCode.toLowerCase().includes(searchText) ||
        g.name.toLowerCase().includes(searchText)
      );
    }
  );
  
  if (userCodeSearch && filteredGuards.length > 0) {
    console.log('✅ Filtered guards:', filteredGuards.length, 'for search:', userCodeSearch);
  }

  const handleSelectGuard = (guard: GuardOption) => {
    setUserCodeSearch(`${guard.name} (${guard.userCode})`);
    setGuardUserId(guard.userId);
    setGuardName(guard.name);
    setGuardEmail(guard.email);
    if (guard.designation) {
      setDesignation(guard.designation);
    }
    setShowGuardSuggestions(false);
  };

  const handleSelectPost = (p: PostOption) => {
    setSelectedPost(p);
    setPostSearch(`${p.name} (${p.code})`);
    setShowPostSuggestions(false);
  };

  const handleGoSubmit = async () => {
    if (!selectedPost) {
      Alert.alert('Validation Error', 'Please select a Post from suggestions.');
      return;
    }

    if (!guardUserId) {
      Alert.alert('Validation Error', 'Please select or enter a valid Guard User Code.');
      return;
    }

    setLoading(true);

    // Start with default/current coordinates
    let latitude = 23.8103;
    let longitude = 90.4125;
    let captureAddress = currentAddress;

    try {
      // Quick location fetch with timeout (non-blocking)
      if (Platform.OS !== 'web') {
        try {
          const isLocationEnabled = await Location.hasServicesEnabledAsync();
          if (isLocationEnabled) {
            const permission = await Location.requestForegroundPermissionsAsync();
            if (permission.status === 'granted') {
              // Try to get location with 8 second timeout
              const locPromise = Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              });
              
              const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Location timeout')), 8000)
              );
              
              try {
                const loc = (await Promise.race([locPromise, timeoutPromise])) as any;
                latitude = loc.coords.latitude;
                longitude = loc.coords.longitude;
                
                // Use current address as-is (pre-fetched), don't wait for reverse geocoding
                // This prevents the delay
              } catch (timeoutErr) {
                // Location timeout is expected - continue with defaults
                // Continue with default coordinates
              }
            }
          }
        } catch (locSetupErr) {
          console.warn('Location setup error, using defaults:', locSetupErr);
          // Continue with defaults
        }
      }

      // Quick location geocoding attempt in background (after submission)
      const doBackgroundGeocoding = async () => {
        try {
          const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
          const place = geocode[0];
          if (place) {
            const newAddress = [place.name, place.street, place.subregion, place.city]
              .filter(Boolean)
              .join(', ');
            setCurrentAddress(newAddress);
          }
        } catch (err) {
          // Silent failure for background geocoding
        }
      };

      // Submit attendance immediately without waiting for geocoding
      const payload = {
        userEmails: [guardEmail],
        postId: selectedPost?.id || postSearch,
        date: date,
        time: time,
        shiftHours: Number(hour) || 8,
        status: attendance.toUpperCase(),
        captureLatitude: latitude,
        captureLongitude: longitude,
        captureAddress: captureAddress,
      };
      
      console.log('🚀 [DashboardScreen] Submitting with payload:', JSON.stringify(payload, null, 2));
      
      const response = await checkIn(payload);

      // Start background geocoding (fire and forget)
      doBackgroundGeocoding();

      // Show success immediately
      Alert.alert(
        'Attendance Recorded',
        `Guard Code: ${userCodeSearch}\nName: ${guardName}\nPost: ${postSearch}\nAddress: ${captureAddress}\nSuccessfully logged.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form state after confirmation
              setSelectedPost(null);
              setPostSearch('');
              setUserCodeSearch('');
              setShowPostSuggestions(false);
              setShowGuardSuggestions(false);
            },
          },
        ]
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
                  placeholder="Search Post by Name or Code"
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
                  placeholder="Search by Guard Code or Name"
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
                <Text style={styles.buttonText}>{loading ? '...' : 'GO '}</Text>
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
  suggestionWrapper: { zIndex: 1000, position: 'relative' },
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
    maxHeight: 200,
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
