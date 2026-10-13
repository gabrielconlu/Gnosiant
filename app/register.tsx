import { Link, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AuthLayout } from '../components/AuthLayout';
import { PasswordInput } from '../components/PasswordInput';
import { colors } from '../lib/theme';
import { apiFetch } from '../lib/api';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit() {
    setMessage('');
    if (!email.trim() || !password || !confirmPassword) {
      setMessage('Please complete all fields.');
      return;
    }
    if (password.length < 6) {
      setMessage('Your password needs at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setMessage('Those passwords do not match yet.');
      return;
    }
    if (!accepted) {
      setMessage('Please accept the terms and privacy notice to continue.');
      return;
    }

    setLoading(true);
    try {
      await apiFetch<{ ok: boolean; user: { id: string; email: string } }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password, acceptedTerms: true }),
      });
      router.replace('/login');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create your account right now.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Your next chapter"
      title="Give your money a little more direction."
      description="Start with what you have. Gnosiant helps you make a plan that feels doable, then notice every bit of progress."
    >
      <Text style={styles.kicker}>A fresh start</Text>
      <Text style={styles.title}>Create your account</Text>
      <Text style={styles.subtitle}>A few details, then you are on your way.</Text>

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
        placeholder="At least 6 characters"
        placeholderTextColor="#98a198"
        autoComplete="new-password"
        style={[styles.input, styles.passwordInput]}
        containerStyle={styles.passwordField}
      />
      <Text style={styles.fieldLabel}>Confirm password</Text>
      <PasswordInput
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Enter it one more time"
        placeholderTextColor="#98a198"
        autoComplete="new-password"
        style={[styles.input, styles.passwordInput]}
        containerStyle={styles.passwordField}
      />

      <View style={styles.passwordHint}>
        <Text style={styles.hintMark}>✓</Text>
        <Text style={styles.passwordText}>Use 6 or more characters. Longer, unique passwords are safer.</Text>
      </View>

      <View style={styles.legalRow}>
        <TouchableOpacity
          style={styles.checkboxButton}
          onPress={() => setAccepted((value) => !value)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: accepted }}
          accessibilityLabel="Accept terms and privacy notice"
        >
        <View style={[styles.checkbox, accepted && styles.checkboxChecked]}><Text style={styles.checkmark}>{accepted ? '✓' : ''}</Text></View>
        </TouchableOpacity>
        <Text style={styles.legalText}>I agree to the <Link href="/terms" style={styles.inlineLink}>Terms</Link> and <Link href="/privacy" style={styles.inlineLink}>Privacy notice</Link>.</Text>
      </View>

      {message ? <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text> : null}

      <Pressable style={[styles.primaryButton, loading && styles.buttonDisabled]} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.primaryButtonText}>Create my account <Text style={styles.buttonArrow}>→</Text></Text>}
      </Pressable>
      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <Link href="/login" asChild><Text style={styles.footerLink}>Sign in</Text></Link>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.coral, textTransform: 'uppercase', fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginBottom: 9 },
  title: { color: colors.ink, fontSize: 29, fontWeight: '800', letterSpacing: -0.8 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 7, marginBottom: 23 },
  fieldLabel: { color: colors.inkSoft, fontSize: 12, fontWeight: '700', marginBottom: 7 },
  input: { backgroundColor: '#faf8f2', borderWidth: 1, borderColor: colors.border, borderRadius: 11, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: colors.ink, marginBottom: 15 },
  passwordInput: { paddingRight: 48, marginBottom: 0 },
  passwordField: { marginBottom: 15 },
  passwordHint: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', backgroundColor: colors.greenLight, padding: 12, borderRadius: 11, marginTop: 1, marginBottom: 15 },
  hintMark: { color: colors.green, fontWeight: '900' },
  passwordText: { flex: 1, color: colors.greenDark, fontSize: 12, lineHeight: 18 },
  legalRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 15 },
  checkboxButton: { paddingVertical: 4 },
  checkbox: { width: 19, height: 19, borderRadius: 6, borderWidth: 1, borderColor: '#bdc5b9', backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: colors.green, borderColor: colors.green },
  checkmark: { color: colors.surface, fontSize: 12, fontWeight: '900' },
  legalText: { color: colors.inkSoft, fontSize: 11, flex: 1 },
  inlineLink: { color: colors.green, fontWeight: '700' },
  message: { color: colors.danger, backgroundColor: colors.coralLight, padding: 10, borderRadius: 9, fontSize: 12, marginBottom: 12 },
  primaryButton: { backgroundColor: colors.greenDark, borderRadius: 11, paddingVertical: 14, alignItems: 'center', marginTop: 2 },
  buttonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: colors.surface, fontWeight: '800', fontSize: 14 },
  buttonArrow: { color: colors.gold, fontSize: 17 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 20 },
  footerText: { color: colors.muted, fontSize: 12 },
  footerLink: { color: colors.green, fontSize: 12, fontWeight: '800', paddingVertical: 5 },
});
