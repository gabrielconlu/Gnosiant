import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../lib/theme';

const steps = ['Currency', 'Income', 'Expenses', 'Goals', 'Review'];

export default function OnboardingPage() {
  const [activeStep, setActiveStep] = useState(1);

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.card}>
        <Text style={styles.kicker}>Onboarding</Text>
        <Text style={styles.title}>Set up your first plan</Text>

        <View style={styles.stepRow}>
          {steps.map((step, index) => (
            <View key={step} style={[styles.stepDot, index === activeStep && styles.stepDotActive]}>
              <Text style={[styles.stepLabel, index === activeStep && styles.stepLabelActive]}>{index + 1}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Choose a currency and locale</Text>
        <TextInput value="USD — United States" style={styles.input} />
        <TextInput value="Monthly take-home income" style={styles.input} />
        <TextInput value="Rent, groceries, utilities" style={styles.input} />

        <View style={styles.actionRow}>
          <Pressable style={styles.secondaryButton} onPress={() => setActiveStep((p) => Math.max(0, p - 1))}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </Pressable>
          <Pressable style={styles.primaryButton} onPress={() => setActiveStep((p) => Math.min(steps.length - 1, p + 1))}>
            <Text style={styles.primaryButtonText}>Continue</Text>
          </Pressable>
        </View>

        <View style={styles.footerLinks}>
          <Link href="/dashboard" asChild>
            <Text style={styles.link}>Skip for now</Text>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: 24 },
  card: { width: '100%', maxWidth: 540, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 24, padding: 28 },
  kicker: { color: colors.coral, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },
  title: { fontSize: 34, fontWeight: '800', color: colors.ink, marginTop: 8, marginBottom: 16 },
  stepRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  stepDot: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceMuted, justifyContent: 'center', alignItems: 'center' },
  stepDotActive: { backgroundColor: colors.greenDark },
  stepLabel: { color: colors.inkSoft, fontWeight: '700' },
  stepLabelActive: { color: colors.surface },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: colors.ink, marginBottom: 12 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14, color: colors.ink },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  primaryButton: { backgroundColor: colors.greenDark, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12 },
  primaryButtonText: { color: colors.surface, fontWeight: '700' },
  secondaryButton: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12 },
  secondaryButtonText: { color: colors.greenDark, fontWeight: '700' },
  footerLinks: { marginTop: 18 },
  link: { color: colors.green, fontWeight: '700' },
});
