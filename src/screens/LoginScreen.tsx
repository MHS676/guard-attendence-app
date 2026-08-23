import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

export function LoginScreen() {
  const { signIn, rememberedEmail } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  // Error States
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (rememberedEmail) {
      setUsername(rememberedEmail);
    }
  }, [rememberedEmail]);

  const validate = (): boolean => {
    let isValid = true;
    setUsernameError('');
    setPasswordError('');
    setGeneralError('');

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername) {
      setUsernameError('Employee ID or Email is required');
      isValid = false;
    }

    if (!cleanPassword) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (cleanPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await signIn(username.trim(), password.trim(), rememberMe);
    } catch (error: any) {
      const msg = error?.message || 'Invalid credentials. Please try again.';
      setGeneralError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Falcon Guard</Text>
          <Text style={styles.subtitle}>Attendance & Operations Portal</Text>
        </View>

        {!!generalError && (
          <View style={styles.generalErrorBox}>
            <Text style={styles.generalErrorText}>⚠️ {generalError}</Text>
          </View>
        )}

        <View style={styles.formContainer}>
          <Text style={styles.label}>Employee ID / Email</Text>
          <TextInput
            style={[styles.input, !!usernameError && styles.inputError]}
            placeholder="e.g. 1001 or demo@falconsecurity.com"
            placeholderTextColor="#999999"
            value={username}
            onChangeText={(val) => {
              setUsername(val);
              if (usernameError) setUsernameError('');
              if (generalError) setGeneralError('');
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {!!usernameError && <Text style={styles.fieldErrorText}>{usernameError}</Text>}

          {/* Password Input Field with Eye Icon Toggle */}
          <Text style={[styles.label, { marginTop: 14 }]}>Password</Text>
          <View style={[styles.passwordContainer, !!passwordError && styles.inputError]}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              placeholderTextColor="#999999"
              value={password}
              onChangeText={(val) => {
                setPassword(val);
                if (passwordError) setPasswordError('');
                if (generalError) setGeneralError('');
              }}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword((prev) => !prev)}
              activeOpacity={0.7}
            >
              <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '🙈'}</Text>
            </TouchableOpacity>
          </View>
          {!!passwordError && <Text style={styles.fieldErrorText}>{passwordError}</Text>}

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setRememberMe(!rememberMe)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.rememberText}>Remember User ID</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#006B3F',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  generalErrorBox: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FFCDD2',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  generalErrorText: {
    color: '#D32F2F',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#222222',
    backgroundColor: '#FAFAFA',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    paddingRight: 12,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#222222',
  },
  eyeButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: {
    fontSize: 18,
  },
  inputError: {
    borderColor: '#D32F2F',
    backgroundColor: '#FFF8F8',
  },
  fieldErrorText: {
    color: '#D32F2F',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: '#006B3F',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#006B3F',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rememberText: {
    fontSize: 14,
    color: '#555555',
  },
  button: {
    height: 50,
    backgroundColor: '#006B3F',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});