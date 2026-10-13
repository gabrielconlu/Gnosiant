import { StyleSheet, Text, View } from 'react-native';
import { LegalLayout } from '../components/LegalLayout';
import { colors } from '../lib/theme';

const sections = [
  {
    title: '1. Who may use Gnosiant',
    body: 'Gnosiant is a personal budgeting and planning tool. You must be able to enter into these terms under the laws that apply to you. If you are under the age of majority where you live, use the service only with a parent or guardian’s permission and supervision.',
  },
  {
    title: '2. Your account and password',
    body: 'Provide accurate account information, keep your password confidential, and use a unique password. You are responsible for activity under your account. Contact support promptly if you suspect someone has accessed it without permission.',
  },
  {
    title: '3. Use of the service',
    body: 'Use Gnosiant lawfully and do not attempt to disrupt, probe, or gain unauthorized access to the service or another person’s account. You retain responsibility for the information you enter and should keep your own copies of important records.',
  },
  {
    title: '4. Educational information, not advice',
    body: 'Gnosiant provides organizational tools and estimates for educational purposes only. It does not provide financial, investment, tax, or legal advice, and projections are not guarantees of future results.',
  },
  {
    title: '5. Availability and changes',
    body: 'We work to keep the service useful and available, but features may change and uninterrupted availability is not guaranteed. We may update these terms as the service evolves; continued use after an update means you accept the revised terms.',
  },
  {
    title: '6. Contact',
    body: 'Questions about these terms can be sent to gabbyconlu@gmail.comt.com.',
  },
];

export default function TermsPage() {
  return (
    <LegalLayout
      active="/terms"
      eyebrow="Your information"
      heading="Clear, thoughtful"
      accent="ground rules."
      title="Terms of use"
      intro="These terms explain how to use Gnosiant, a personal budgeting and financial planning tool. By creating an account or using the service, you agree to these terms."
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
