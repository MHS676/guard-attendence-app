import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

// Import local logo from document/logo11.png
const logoImg = require('../../document/logo11.png');

export function LoginScreen() {
  const { signIn, rememberedEmail } = useAuth();
  const [email, setEmail] = useState(rememberedEmail || 'demo@falconsecurity.com');
  const [password, setPassword] = useState('Falcon@2026');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await signIn(email, password, true);
    } catch (error) {
      Alert.alert('Sign in failed', error instanceof Error ? error.message : 'Invalid credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        {/* Branding with local logo */}
        <View style={styles.brandingContainer}>
          <Image source={logoImg} style={styles.logo} resizeMode="contain" />
          <Text style={styles.falconText}>FALCON®</Text>
          <Text style={styles.securityText}>SECURITY LIMITED</Text>
        </View>

        {/* Login Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.title}>Sign In</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email / Employee ID</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="e.g. demo@falconsecurity.com"
              placeholderTextColor="#8E8E8E"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#8E8E8E"
              secureTextEntry
              style={styles.input}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>SIGN IN</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  brandingContainer: { alignItems: 'center', marginBottom: 28 },
  logo: { width: 90, height: 90, marginBottom: 6 },
  falconText: { fontSize: 28, fontWeight: '800', color: '#006B3F', letterSpacing: 1 },
  securityText: { fontSize: 12, fontWeight: '700', color: '#006B3F', letterSpacing: 1.2, marginTop: 2 },
  formCard: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, gap: 16,
    borderColor: '#E0E0E0', borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#222222', marginBottom: 4 },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, color: '#555555', fontWeight: '600' },
  input: {
    height: 48, backgroundColor: '#FAFAFA', borderColor: '#D9D9D9', borderWidth: 1,
    borderRadius: 8, paddingHorizontal: 12, fontSize: 14, color: '#222222',
  },
  loginButton: {
    height: 50, backgroundColor: '#006B3F', borderRadius: 8,
    justifyContent: 'center', alignItems: 'center', marginTop: 8,
  },
  loginButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 1 },
});