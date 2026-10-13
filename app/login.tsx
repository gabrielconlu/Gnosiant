import { Link, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AuthLayout } from '../components/AuthLayout';
import { PasswordInput } from '../components/PasswordInput';
import { colors } from '../lib/theme';
import { apiFetch } from '../lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit() {
    setMessage('');
    if (!email.trim() || !password) {
      setMessage('Add your email and password to continue.');
      return;
    }
    setLoading(true);
    try {
      await apiFetch<{ ok: boolean; user: { id: string; email: string } }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });
      router.replace('/dashboard');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to log in right now.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Good to see you"
      title="Your plans are right where you left them."
      description="Pick up where you left off, check in on your goals, and keep building the money habits that work for you."
    >
      <Text style={styles.kicker}>Welcome back</Text>
      <Text style={styles.title}>Sign in</Text>
      <Text style={styles.subtitle}>Let’s take another small step forward.</Text>

      <Text style={styles.fieldLabel}>Email address</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        placeholderTextColor="#98a198"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        style={styles.input}
      />
      <Text style={styles.fieldLabel}>Password</Text>
      <PasswordInput
        value={password}
        onChangeText={setPassword}
        placeholder="Your password"
        placeholderTextColor="#98a198"
        autoComplete="current-password"
        style={[styles.input, styles.passwordInput]}
        containerStyle={styles.passwordField}
        onSubmitEditing={() => { void handleSubmit(); }}
      />

      {message ? <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text> : null}
      <Pressable style={[styles.primaryButton, loading && styles.buttonDisabled]} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.primaryButtonText}>Sign in <Text style={styles.buttonArrow}>→</Text></Text>}
      </Pressable>
      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Don’t have an account?</Text>
        <Link href="/register" asChild><Text style={styles.footerLink}>Create one</Text></Link>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.coral, textTransform: 'uppercase', fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginBottom: 9 },
  title: { color: colors.ink, fontSize: 30, fontWeight: '800', letterSpacing: -0.8 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 7, marginBottom: 23 },
  fieldLabel: { color: colors.inkSoft, fontSize: 12, fontWeight: '700', marginBottom: 7 },
  input: { backgroundColor: '#faf8f2', borderWidth: 1, borderColor: colors.border, borderRadius: 11, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: colors.ink, marginBottom: 16 },
  passwordInput: { paddingRight: 48, marginBottom: 0 },
  passwordField: { marginBottom: 16 },
  message: { color: colors.danger, backgroundColor: colors.coralLight, padding: 10, borderRadius: 9, fontSize: 12, marginBottom: 12 },
  primaryButton: { backgroundColor: colors.greenDark, borderRadius: 11, paddingVertical: 14, alignItems: 'center', marginTop: 3 },
  buttonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: colors.surface, fontWeight: '800', fontSize: 14 },
  buttonArrow: { color: colors.gold, fontSize: 17 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 22 },
  footerText: { color: colors.muted, fontSize: 12 },
  footerLink: { color: colors.green, fontSize: 12, fontWeight: '800', paddingVertical: 5 },
});
