import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { PasswordInput } from '../components/PasswordInput';
import { colors } from '../lib/theme';
import { apiFetch } from '../lib/api';

export default function AccountPage() {
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [accountLoaded, setAccountLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    apiFetch<{ ok: boolean; user: { email: string } }>('/auth/session')
      .then((data) => {
        if (!active) return;
        setEmail(data.user.email);
        setAccountLoaded(true);
      })
      .catch((error: unknown) => { if (active) setMessage(error instanceof Error ? error.message : 'Unable to load account details.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function handleSave() {
    setMessage('');
    if (newPassword && newPassword.length < 6) {
      setMessage('Your new password needs at least 6 characters.');
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setMessage('Your new passwords do not match.');
      return;
    }
    if (newPassword && !currentPassword) {
      setMessage('Enter your current password to update it.');
      return;
    }

    setSaving(true);
    try {
      const data = await apiFetch<{ ok: boolean; user: { email: string } }>('/account', {
        method: 'PATCH',
        body: JSON.stringify({
          email,
          ...(newPassword ? { currentPassword, newPassword } : {}),
        }),
      });
      setEmail(data.user.email);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Your account details have been updated.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update account.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setMessage('');
    try {
      await apiFetch<{ ok: boolean; message: string }>('/account', { method: 'DELETE' });
      setMessage('Your account has been deleted.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to delete account.');
    }
  }

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator size="large" color={colors.green} /></View>;
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
      <View style={styles.topRow}>
        <Link href="/" asChild><Text style={styles.backLink}>← Back to Home</Text></Link>
        <Text style={styles.brand}>Gnosiant<Text style={styles.brandDot}>.</Text></Text>
      </View>
      <View style={styles.header}>
        <Text style={styles.kicker}>Your account</Text>
        <Text style={styles.title}>Keep your details up to date.</Text>
        <Text style={styles.subtitle}>Change your sign-in email or update your password whenever you need to.</Text>
      </View>

      {!accountLoaded ? (
        <View style={styles.signedOutCard}>
          <Text style={styles.signedOutTitle}>Sign in to manage your account</Text>
          <Text style={styles.signedOutCopy}>{message || 'Your account details are available after you sign in.'}</Text>
          <Link href="/login" asChild><Text style={styles.signInButton}>Go to sign in →</Text></Link>
        </View>
      ) : (
        <>
      <View style={styles.card}>
        <View style={styles.cardHeading}>
          <View style={styles.cardIcon}><Text style={styles.cardIconText}>✦</Text></View>
          <View><Text style={styles.cardTitle}>Sign-in details</Text><Text style={styles.cardSubtitle}>Manage how you access Gnosiant.</Text></View>
        </View>
        <Text style={styles.label}>Email address</Text>
        <TextInput value={email} onChangeText={setEmail} placeholder="Email address" autoCapitalize="none" autoComplete="email" keyboardType="email-address" style={styles.input} />

        <View style={styles.divider} />
        <Text style={styles.passwordTitle}>Update password</Text>
        <Text style={styles.passwordCopy}>For your security, confirm your current password before choosing a new one.</Text>
        <Text style={styles.label}>Current password</Text>
        <PasswordInput value={currentPassword} onChangeText={setCurrentPassword} placeholder="Current password" autoComplete="current-password" style={[styles.input, styles.passwordInput]} containerStyle={styles.passwordField} />
        <Text style={styles.label}>New password</Text>
        <PasswordInput value={newPassword} onChangeText={setNewPassword} placeholder="At least 6 characters" autoComplete="new-password" style={[styles.input, styles.passwordInput]} containerStyle={styles.passwordField} />
        <Text style={styles.label}>Confirm new password</Text>
        <PasswordInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Enter the new password again" autoComplete="new-password" style={[styles.input, styles.passwordInput]} containerStyle={styles.passwordField} />

        {message ? <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text> : null}
        <Pressable style={[styles.primaryButton, saving && styles.disabled]} onPress={handleSave} disabled={saving}>
          <Text style={styles.primaryButtonText}>{saving ? 'Saving…' : 'Save account details'}</Text>
        </Pressable>
      </View>

      <View style={styles.deleteCard}>
        <View style={styles.deleteCopy}>
          <Text style={styles.deleteTitle}>Ready to leave?</Text>
          <Text style={styles.deleteDescription}>Deleting your account permanently removes your saved plans and goals.</Text>
        </View>
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete account</Text>
        </Pressable>
      </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  pageContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  topRow: { width: '100%', maxWidth: 930, alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  backLink: { color: colors.green, fontWeight: '700', fontSize: 13, paddingVertical: 8 },
  brand: { color: colors.ink, fontSize: 20, fontWeight: '900' },
  brandDot: { color: colors.coral },
  header: { width: '100%', maxWidth: 680, alignSelf: 'center', marginBottom: 20 },
  kicker: { color: colors.coral, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 },
  title: { color: colors.ink, fontSize: 31, fontWeight: '900', letterSpacing: -1, lineHeight: 38 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 21, marginTop: 7 },
  signedOutCard: { width: '100%', maxWidth: 680, alignSelf: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 23 },
  signedOutTitle: { color: colors.ink, fontSize: 17, fontWeight: '900' },
  signedOutCopy: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 7 },
  signInButton: { alignSelf: 'flex-start', color: colors.surface, backgroundColor: colors.greenDark, overflow: 'hidden', borderRadius: 10, paddingHorizontal: 15, paddingVertical: 11, marginTop: 16, fontSize: 12, fontWeight: '800' },
  card: { width: '100%', maxWidth: 680, alignSelf: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 23 },
  cardHeading: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 21 },
  cardIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.goldLight, alignItems: 'center', justifyContent: 'center' },
  cardIconText: { color: colors.coral, fontSize: 18 },
  cardTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  cardSubtitle: { color: colors.muted, fontSize: 11, marginTop: 3 },
  label: { color: colors.inkSoft, fontWeight: '700', fontSize: 11, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 12, marginBottom: 14, backgroundColor: '#faf8f2', color: colors.ink, fontSize: 13 },
  passwordInput: { paddingRight: 48, marginBottom: 0 },
  passwordField: { marginBottom: 14 },
  divider: { height: 1, backgroundColor: colors.border, marginTop: 2, marginBottom: 19 },
  passwordTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  passwordCopy: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 4, marginBottom: 15 },
  message: { marginBottom: 12, color: colors.greenDark, backgroundColor: colors.greenLight, padding: 11, borderRadius: 9, fontSize: 12 },
  primaryButton: { backgroundColor: colors.greenDark, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  disabled: { opacity: 0.65 },
  primaryButtonText: { color: colors.surface, fontWeight: '800', fontSize: 13 },
  deleteCard: { width: '100%', maxWidth: 680, alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: 14, padding: 17, borderRadius: 16, backgroundColor: colors.coralLight },
  deleteCopy: { flex: 1, minWidth: 200 },
  deleteTitle: { color: colors.danger, fontWeight: '800', fontSize: 13 },
  deleteDescription: { color: '#885e51', fontSize: 11, lineHeight: 16, marginTop: 4 },
  deleteButton: { backgroundColor: colors.surface, borderRadius: 9, paddingHorizontal: 14, paddingVertical: 10 },
  deleteButtonText: { color: colors.danger, fontSize: 11, fontWeight: '800' },
});
