import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { LegalLayout } from '../components/LegalLayout';
import { colors } from '../lib/theme';

type Preferences = { analytics: boolean; marketing: boolean };
const storageKey = 'gnosiant.cookie-preferences';
const emptyPreferences: Preferences = { analytics: false, marketing: false };

export default function PrivacySettingsPage() {
  const [initialPreferences] = useState(readInitialPreferences);
  const [preferences, setPreferences] = useState<Preferences>(initialPreferences.preferences);
  const [message, setMessage] = useState(initialPreferences.message);

  function savePreferences() {
    if (Platform.OS === 'web') {
      try {
        globalThis.localStorage?.setItem(storageKey, JSON.stringify(preferences));
      } catch {
        setMessage('Your browser could not save these preferences. Please check its storage settings and try again.');
        return;
      }
    }
    setMessage('Your cookie preferences have been saved on this device.');
  }

  function togglePreference(key: keyof Preferences) {
    setPreferences((current) => ({ ...current, [key]: !current[key] }));
    setMessage('');
  }

  return (
    <LegalLayout
      active="/privacy-settings"
      eyebrow="Your information"
      heading="Simple choices,"
      accent="at your pace."
      title="Cookies & storage"
      intro="Choose whether Gnosiant may use optional analytics or marketing storage in this browser. Optional choices start off. Essential session storage is always on so sign-in can work."
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your preferences</Text>
        <PreferenceRow
          title="Essential storage"
          description="Required for account sign-in and security. This cannot be switched off while using an account."
          enabled
          disabled
          onPress={() => undefined}
        />
        <PreferenceRow
          title="Analytics"
          description="Would allow anonymous usage measurement to help improve Gnosiant. No analytics tools are currently configured."
          enabled={preferences.analytics}
          onPress={() => togglePreference('analytics')}
        />
        <PreferenceRow
          title="Marketing"
          description="Would allow marketing measurement or personalization. No marketing trackers are currently configured."
          enabled={preferences.marketing}
          onPress={() => togglePreference('marketing')}
        />
        <Pressable style={styles.button} onPress={savePreferences} accessibilityRole="button">
          <Text style={styles.buttonText}>Save preferences</Text>
        </Pressable>
        {message ? <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text> : null}
        <Text style={styles.note}>Preferences are saved in this browser’s local storage. Gnosiant does not currently load optional analytics or marketing trackers.</Text>
      </View>
    </LegalLayout>
  );
}

function readInitialPreferences() {
  if (Platform.OS !== 'web') return { preferences: emptyPreferences, message: '' };
  try {
    const saved = globalThis.localStorage?.getItem(storageKey);
    if (!saved) return { preferences: emptyPreferences, message: '' };
    const parsed: unknown = JSON.parse(saved);
    if (typeof parsed === 'object' && parsed !== null && 'analytics' in parsed && 'marketing' in parsed
      && typeof parsed.analytics === 'boolean' && typeof parsed.marketing === 'boolean') {
      return { preferences: { analytics: parsed.analytics, marketing: parsed.marketing }, message: '' };
    }
    return { preferences: emptyPreferences, message: 'Saved cookie preferences were invalid. Please choose them again.' };
  } catch {
    return { preferences: emptyPreferences, message: 'Your saved cookie preferences could not be read. You can choose them again below.' };
  }
}

type PreferenceRowProps = {
  title: string;
  description: string;
  enabled: boolean;
  disabled?: boolean;
  onPress: () => void;
};

function PreferenceRow({ title, description, enabled, disabled = false, onPress }: PreferenceRowProps) {
  return (
    <Pressable
      style={styles.preference}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: enabled, disabled }}
      accessibilityLabel={title}
    >
      <View style={styles.preferenceText}>
        <Text style={styles.preferenceTitle}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <View style={[styles.switchTrack, enabled && styles.switchTrackOn, disabled && styles.switchTrackDisabled]}>
        <View style={[styles.switchThumb, enabled && styles.switchThumbOn]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  sectionTitle: { color: colors.greenDark, fontSize: 17, fontWeight: '700', marginBottom: 2 },
  preference: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  preferenceText: { flex: 1, gap: 5 },
  preferenceTitle: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  description: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  switchTrack: { width: 42, height: 24, borderRadius: 12, justifyContent: 'center', padding: 3, backgroundColor: '#d8dcd5' },
  switchTrackOn: { backgroundColor: colors.green },
  switchTrackDisabled: { opacity: 0.7 },
  switchThumb: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.surface },
  switchThumbOn: { alignSelf: 'flex-end' },
  button: { backgroundColor: colors.greenDark, borderRadius: 9, paddingVertical: 13, paddingHorizontal: 18, alignItems: 'center', marginTop: 8, alignSelf: 'flex-start' },
  buttonText: { color: colors.surface, fontSize: 13, fontWeight: '700' },
  message: { color: colors.green, fontSize: 13, lineHeight: 20 },
  note: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 2 },
});
