import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { LegalLayout } from '../components/LegalLayout';
import { colors } from '../lib/theme';

export default function SupportPage() {
  return (
    <LegalLayout
      active="/support"
      eyebrow="Here to help"
      heading="A little help,"
      accent="when you need it."
      title="Support"
      intro="Need a hand with Gnosiant? We’re glad to help with your account, privacy choices, or how to use the planning tools."
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Get in touch</Text>
        <Text style={styles.body}>Email us at gabbyconlu@gmail.com with a brief description of what you need. Please do not include your password or sensitive financial account details in your message.</Text>
        <Text style={styles.body}>We aim to respond within 1–2 business days.</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Helpful pages</Text>
        <Link href="/terms" asChild><Text style={styles.link}>Terms of use</Text></Link>
        <Link href="/privacy" asChild><Text style={styles.link}>Privacy notice</Text></Link>
        <Link href="/privacy-settings" asChild><Text style={styles.link}>Manage cookies and storage</Text></Link>
      </View>
    </LegalLayout>
  );
}

const styles = StyleSheet.create({
  section: { gap: 9, marginBottom: 22 },
  sectionTitle: { color: colors.greenDark, fontSize: 16, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 13, lineHeight: 21 },
  link: { alignSelf: 'flex-start', color: colors.green, fontSize: 13, fontWeight: '700', paddingVertical: 4 },
});
