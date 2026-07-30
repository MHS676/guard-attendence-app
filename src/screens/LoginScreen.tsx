import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Button, Checkbox, HelperText, Text, TextInput } from 'react-native-paper';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';

const loginSchema = z.object({ email: z.string().trim().email('Enter a valid email address'), password: z.string().min(8, 'Password must be at least 8 characters') });
type LoginValues = z.infer<typeof loginSchema>;
export function LoginScreen() {
  const { signIn, rememberedEmail } = useAuth();
  const [remember, setRemember] = useState(Boolean(rememberedEmail));
  const [serverError, setServerError] = useState('');
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: rememberedEmail, password: '' } });
  const submit = async ({ email, password }: LoginValues) => { try { setServerError(''); await signIn(email, password, remember); } catch (error) { setServerError(error instanceof Error ? error.message : 'Sign in failed'); } };
  return <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={styles.content}>
      <Text variant="displaySmall" style={styles.title}>Welcome back</Text>
      <Text variant="bodyLarge" style={styles.subtitle}>Sign in to manage your attendance.</Text>
      <Controller control={control} name="email" render={({ field: { onChange, value, onBlur } }) => <><TextInput label="Work email" mode="outlined" autoCapitalize="none" keyboardType="email-address" value={value} onBlur={onBlur} onChangeText={onChange} error={!!errors.email} /><HelperText type="error" visible={!!errors.email}>{errors.email?.message}</HelperText></>} />
      <Controller control={control} name="password" render={({ field: { onChange, value, onBlur } }) => <><TextInput label="Password" mode="outlined" secureTextEntry value={value} onBlur={onBlur} onChangeText={onChange} error={!!errors.password} /><HelperText type="error" visible={!!errors.password}>{errors.password?.message}</HelperText></>} />
      <Checkbox.Item label="Remember my email" status={remember ? 'checked' : 'unchecked'} onPress={() => setRemember((v) => !v)} position="leading" style={styles.remember} />
      {!!serverError && <HelperText type="error" visible>{serverError}</HelperText>}
      <Button mode="contained" onPress={handleSubmit(submit)} loading={isSubmitting} disabled={isSubmitting} contentStyle={styles.button}>Sign in</Button>
    </View>
  </KeyboardAvoidingView>;
}
const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: '#F7F9FC', justifyContent: 'center' }, content: { padding: 24, gap: 4 }, title: { fontWeight: '700', color: '#172033' }, subtitle: { color: '#65708A', marginBottom: 28 }, remember: { paddingHorizontal: 0, marginVertical: 8 }, button: { height: 50 } });
