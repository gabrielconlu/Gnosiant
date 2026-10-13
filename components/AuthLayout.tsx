import { Link } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../lib/theme';

type AuthLayoutProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthLayout({ eyebrow, title, description, children }: AuthLayoutProps) {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent} keyboardShouldPersistTaps="handled">
      <View style={styles.topRow}>
        <Link href="/" asChild>
          <Text style={styles.backLink}>← Back to home</Text>
        </Link>
        <Text style={styles.brand}>Gnosiant<Text style={styles.brandDot}>.</Text></Text>
      </View>

      <View style={styles.layout}>
        <View style={styles.story}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.storyTitle}>{title}</Text>
          <Text style={styles.storyDescription}>{description}</Text>
          <View style={styles.storyCard}>
            <View style={styles.storyCardHeader}>
              <View style={styles.sparkle}><Text style={styles.sparkleText}>✦</Text></View>
              <Text style={styles.storyCardLabel}>A little goes a long way</Text>
            </View>
            <Text style={styles.storyCardTitle}>Make your next save a small win.</Text>
            <Text style={styles.storyCardCopy}>Build steady habits, celebrate progress, and keep your plan kind to real life.</Text>
            <View style={styles.storyPills}>
              <Text style={styles.storyPill}>Small steps</Text>
              <Text style={styles.storyPill}>Real progress</Text>
            </View>
          </View>
        </View>
        <View style={styles.formCard}>{children}</View>
      </View>
      <Text style={styles.footer}>A calmer money routine starts here.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  pageContent: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 20, paddingBottom: 26 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 1220, alignSelf: 'center', marginBottom: 26 },
  backLink: { color: colors.green, fontSize: 14, fontWeight: '700', paddingVertical: 10, paddingRight: 14 },
  brand: { color: colors.ink, fontSize: 23, fontWeight: '800', letterSpacing: -0.8 },
  brandDot: { color: colors.coral },
  layout: { width: '100%', maxWidth: 1060, flex: 1, alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 48 },
  story: { flex: 1, flexBasis: 340, maxWidth: 460, paddingVertical: 20 },
  eyebrow: { color: colors.coral, textTransform: 'uppercase', fontSize: 11, fontWeight: '800', letterSpacing: 1.6, marginBottom: 14 },
  storyTitle: { color: colors.ink, fontSize: 42, lineHeight: 48, letterSpacing: -1.6, fontWeight: '800', marginBottom: 14 },
  storyDescription: { color: colors.inkSoft, fontSize: 16, lineHeight: 25, marginBottom: 26 },
  storyCard: { backgroundColor: colors.greenDark, borderRadius: 22, padding: 22, shadowColor: colors.greenDark, shadowOpacity: 0.18, shadowRadius: 22, shadowOffset: { width: 0, height: 12 } },
  storyCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  sparkle: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  sparkleText: { color: colors.greenDark, fontSize: 17, fontWeight: '800' },
  storyCardLabel: { color: '#eee5ef', fontSize: 12, fontWeight: '700' },
  storyCardTitle: { color: colors.surface, fontSize: 21, lineHeight: 27, fontWeight: '800', marginBottom: 8 },
  storyCardCopy: { color: '#e0d5e2', fontSize: 13, lineHeight: 20 },
  storyPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  storyPill: { overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.13)', color: colors.surface, fontSize: 11, fontWeight: '700', paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999 },
  formCard: { width: '100%', maxWidth: 455, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 24, padding: 30, shadowColor: '#594b36', shadowOpacity: 0.08, shadowRadius: 26, shadowOffset: { width: 0, height: 14 } },
  footer: { width: '100%', maxWidth: 1060, alignSelf: 'center', color: colors.muted, fontSize: 12, marginTop: 20 },
});
