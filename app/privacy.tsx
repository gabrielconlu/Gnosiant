import { StyleSheet, Text, View } from 'react-native';
import { LegalLayout } from '../components/LegalLayout';
import { colors } from '../lib/theme';

const sections = [
  {
    title: '1. Information you provide',
    body: 'We store the email address and password hash used for your account, along with the budgets, transactions, savings goals, and scenarios you choose to enter.',
  },
  {
    title: '2. How information is used',
    body: 'Your information is used to authenticate you, save your planning data, calculate summaries, and respond to support requests. Gnosiant does not sell your personal or financial information.',
  },
  {
    title: '3. Storage and safeguards',
    body: 'Account and planning data is stored in the service database and associated with your account. Passwords are stored as hashes, not as readable passwords. No online service can promise absolute security, so use a unique password and avoid entering information you do not need.',
  },
  {
    title: '4. Cookies and local storage',
    body: 'The service uses an essential, HTTP-only session cookie to keep you signed in. Optional analytics and marketing cookies are not enabled by default. Your cookie choices can be reviewed on the Cookies & storage page.',
  },
  {
    title: '5. Your choices and requests',
    body: 'You can manage optional cookie preferences, update account details, export your information, or request account deletion through the account settings when those features are available in your deployment. Contact support for privacy questions.',
  },
  {
    title: '6. Contact',
    body: 'For privacy questions or requests, contact gabbyconlu@gmail.com.',
  },
];

export default function PrivacyPage() {
  return (
    <LegalLayout
      active="/privacy"
      eyebrow="Your information"
      heading="Your money, your"
      accent="information."
      title="Privacy notice"
      intro="This notice describes the information Gnosiant handles when you use the service, why it is used, and the choices available to you."
    >
      <View style={styles.sections}>
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.body}>{section.body}</Text>
          </View>
        ))}
      </View>
    </LegalLayout>
  );
}

const styles = StyleSheet.create({
  sections: { gap: 20 },
  section: { gap: 8 },
  sectionTitle: { color: colors.greenDark, fontSize: 16, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 12, lineHeight: 20 },
});
