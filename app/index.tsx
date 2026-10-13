import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { apiFetch } from '../lib/api';
import { colors } from '../lib/theme';

const features = [
  { number: '01', icon: '📝', title: 'A plan that breathes', copy: 'Give every dollar a direction, without treating real life like a spreadsheet.' },
  { number: '02', icon: '↗', title: 'Progress you can feel', copy: 'Turn a big savings goal into small milestones worth celebrating along the way.' },
  { number: '03', icon: '✓', title: 'Try before you decide', copy: 'Explore a what-if plan safely, while your everyday budget stays right where it is.' },
];

const milestones = ['First step', 'Quarter way', 'Halfway', 'You did it'];

export default function LandingPage() {
  const [signedIn, setSignedIn] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      apiFetch<{ ok: boolean }>('/auth/session')
        .then(() => { if (active) setSignedIn(true); })
        .catch(() => { if (active) setSignedIn(false); });
      return () => { active = false; };
    }, [])
  );

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
      <View style={styles.nav}>
        <Link href="/" asChild><Text style={styles.brand}>Gnosiant<Text style={styles.brandDot}>.</Text></Text></Link>
        <View style={styles.navLinks}>
          <Link href="/support" asChild><Text style={styles.navLink}>How it works</Text></Link>
          {signedIn ? (
            <Link href="/" asChild><Text style={styles.navCta}>My Account</Text></Link>
          ) : (
            <>
              <Link href="/login" asChild><Text style={styles.navLink}>Sign in</Text></Link>
              <Link href="/register" asChild><Text style={styles.navCta}>Start your plan <Text style={styles.ctaArrow}>→</Text></Text></Link>
            </>
          )}
        </View>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <View style={styles.eyebrow}><Text style={styles.eyebrowText}>A softer way to plan your money</Text></View>
          <Text style={styles.heading}>Small steps.{'\n'}<Text style={styles.headingAccent}>Brighter</Text> tomorrows.</Text>
          <Text style={styles.subheading}>Make a money plan that meets you where you are, helps you save with intention, and celebrates the progress you make along the way.</Text>
          <View style={styles.actions}>
            {signedIn ? (
              <Link href="/dashboard" asChild><Text style={styles.primaryButton}>My Plan</Text></Link>
            ) : (
              <>
                <Link href="/register" asChild><Text style={styles.primaryButton}>Build my first plan <Text style={styles.ctaArrow}>→</Text></Text></Link>
                <Link href="/login" asChild><Text style={styles.secondaryButton}>I already have an account</Text></Link>
              </>
            )}
          </View>
          <View style={styles.trustLine}>
            <Text style={styles.trustCopy}>  Your pace. Your priorities. Your progress.</Text>
          </View>
        </View>

        <View style={styles.journeyCard}>
          <View style={styles.decorCircle} />
          <View style={styles.cardTop}>
            <View><Text style={styles.cardEyebrow}>A SAVINGS JOURNEY</Text><Text style={styles.cardTitle}>Little by little</Text></View>
            <View style={styles.exampleBadge}><Text style={styles.exampleBadgeText}>EXAMPLE</Text></View>
          </View>
          <Text style={styles.goalLabel}>A weekend away</Text>
          <View style={styles.goalAmountRow}><Text style={styles.goalAmount}>$760</Text><Text style={styles.goalTarget}>of $1,000</Text></View>
          <View style={styles.progressTrack}><View style={styles.progressFill} /><View style={styles.progressSpark}><Text style={styles.spark}></Text></View></View>
          <View style={styles.progressMeta}><Text style={styles.progressPercent}>76% there</Text><Text style={styles.nextMilestone}>Next up: goal reached</Text></View>

          <View style={styles.milestones}>
            {milestones.map((milestone, index) => (
              <View key={milestone} style={styles.milestone}>
                <View style={[styles.milestoneDot, index < 3 && styles.milestoneDone]}><Text style={[styles.milestoneCheck, index < 3 && styles.milestoneCheckDone]}>{index < 3 ? '✓' : '·'}</Text></View>
                <Text style={styles.milestoneLabel}>{milestone}</Text>
              </View>
            ))}
          </View>
          <View style={styles.tipCard}>
            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Keep the streak gentle</Text>
              <Text style={styles.tipDescription}>Even a small contribution is a win. Progress beats perfect.</Text>
            </View>
            <Text style={styles.tipArrow}>🔥</Text>
          </View>
          <Text style={styles.cardFootnote}>Your goals, your milestones. No pressure, just momentum.</Text>
        </View>
      </View>

      <View style={styles.sectionIntro}>
        <Text style={styles.sectionTitle}>Money clarity, without the pressure.</Text>
        <Text style={styles.sectionCopy}>A few thoughtful tools make it easier to move from “I should” to “I did.”</Text>
      </View>
      <View style={styles.featureGrid}>
        {features.map((feature, index) => (
          <View key={feature.number} style={[styles.featureCard, index === 1 && styles.featureCardMiddle]}>
            <View style={[styles.featureIcon, index === 1 && styles.featureIconCoral]}><Text style={[styles.featureIconText, index === 1 && styles.featureIconTextCoral]}>{feature.icon}</Text></View>
            <Text style={styles.featureNumber}>{feature.number} / 03</Text>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureCopy}>{feature.copy}</Text>
          </View>
        ))}
      </View>

      <View style={styles.closingCard}>
        <View style={styles.closingCopy}>
          <Text style={styles.closingEyebrow}>THERE IS NO PERFECT TIME</Text>
          <Text style={styles.closingTitle}>Start with one small win.</Text>
          <Text style={styles.closingDescription}>Choose one thing you want your money to do for you. We’ll help you turn it into a plan.</Text>
        </View>
        <Link href="/register" asChild><Text style={styles.closingButton}>Let’s begin <Text style={styles.ctaArrow}>→</Text></Text></Link>
      </View>

      <View style={styles.footer}>
        <View><Text style={styles.footerBrand}>Gnosiant<Text style={styles.brandDot}>.</Text></Text></View>
        <View style={styles.footerLinks}>
          <Link href="/support" asChild><Text style={styles.footerLink}>Support</Text></Link>
          <Link href="/terms" asChild><Text style={styles.footerLink}>Terms</Text></Link>
          <Link href="/privacy" asChild><Text style={styles.footerLink}>Privacy</Text></Link>
          <Link href="/privacy-settings" asChild><Text style={styles.footerLink}>Cookies</Text></Link>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  pageContent: { paddingHorizontal: 28, paddingBottom: 36, width: '100%', maxWidth: 1380, alignSelf: 'center' },
  nav: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, paddingTop: 22, paddingBottom: 22 },
  brand: { fontSize: 25, fontWeight: '900', letterSpacing: -1.1, color: colors.ink },
  brandDot: { color: colors.coral },
  navLinks: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 22 },
  navLink: { color: colors.inkSoft, fontSize: 13, fontWeight: '700', paddingVertical: 8 },
  navCta: { color: colors.surface, backgroundColor: colors.greenDark, fontSize: 13, fontWeight: '800', paddingHorizontal: 17, paddingVertical: 11, borderRadius: 999 },
  ctaArrow: { color: colors.gold, fontSize: 17 },
  hero: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 44, paddingTop: 40, paddingBottom: 70 },
  heroCopy: { flex: 1, flexBasis: 400, maxWidth: 610 },
  eyebrow: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 23, backgroundColor: colors.surface },
  eyebrowDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.coral },
  eyebrowText: { color: colors.green, fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },
  heading: { color: colors.ink, fontSize: 61, lineHeight: 66, fontWeight: '900', letterSpacing: -3.2, marginBottom: 19 },
  headingAccent: { color: colors.coral },
  subheading: { color: colors.inkSoft, fontSize: 17, lineHeight: 27, maxWidth: 540, marginBottom: 26 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  primaryButton: { backgroundColor: colors.greenDark, color: colors.surface, fontWeight: '800', borderRadius: 999, paddingHorizontal: 20, paddingVertical: 14, overflow: 'hidden' },
  secondaryButton: { color: colors.green, fontWeight: '700', paddingHorizontal: 12, paddingVertical: 13 },
  trustLine: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 25 },
  avatarStack: { flexDirection: 'row' },
  avatar: { width: 28, height: 28, textAlign: 'center', textAlignVertical: 'center', borderRadius: 14, overflow: 'hidden', color: colors.greenDark, backgroundColor: colors.goldLight, borderWidth: 2, borderColor: colors.background, fontSize: 12, fontWeight: '900' },
  avatarSecond: { marginLeft: -6, color: colors.green, backgroundColor: colors.greenLight },
  avatarThird: { marginLeft: -6, color: colors.coral, backgroundColor: colors.coralLight },
  trustCopy: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  journeyCard: { flex: 1, flexBasis: 380, maxWidth: 490, overflow: 'hidden', backgroundColor: colors.greenDark, borderRadius: 28, padding: 25, shadowColor: colors.greenDark, shadowOpacity: 0.2, shadowRadius: 30, shadowOffset: { width: 0, height: 18 } },
  decorCircle: { position: 'absolute', top: -115, right: -95, width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(234,191,100,0.10)' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 27 },
  cardEyebrow: { color: '#d9c9df', fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 7 },
  cardTitle: { color: colors.surface, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  exampleBadge: { backgroundColor: 'rgba(255,255,255,0.13)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  exampleBadgeText: { color: '#eee5ef', fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  goalLabel: { color: '#e0d5e2', fontSize: 13, marginBottom: 5 },
  goalAmountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 15 },
  goalAmount: { color: colors.surface, fontSize: 39, fontWeight: '900', letterSpacing: -1.8 },
  goalTarget: { color: '#d9c9df', fontSize: 14, fontWeight: '600' },
  progressTrack: { position: 'relative', height: 12, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.16)', marginBottom: 10 },
  progressFill: { height: '100%', width: '76%', borderRadius: 999, backgroundColor: colors.gold },
  progressSpark: { position: 'absolute', left: '73%', top: -7, width: 25, height: 25, borderRadius: 13, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  spark: { color: colors.coral, fontSize: 13, fontWeight: '900' },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 22 },
  progressPercent: { color: '#f6d994', fontSize: 11, fontWeight: '800' },
  nextMilestone: { color: '#d9c9df', fontSize: 10 },
  milestones: { flexDirection: 'row', justifyContent: 'space-between', gap: 4, marginBottom: 23 },
  milestone: { alignItems: 'center', flex: 1, gap: 7 },
  milestoneDot: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center', borderRadius: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)', backgroundColor: 'rgba(255,255,255,0.08)' },
  milestoneDone: { borderColor: colors.gold, backgroundColor: colors.gold },
  milestoneCheck: { color: '#eee5ef', fontSize: 13, fontWeight: '900' },
  milestoneCheckDone: { color: colors.greenDark },
  milestoneLabel: { color: '#e0d5e2', fontSize: 9, textAlign: 'center' },
  tipCard: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.10)' },
  tipIcon: { width: 31, height: 31, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: colors.coral },
  tipIconText: { color: colors.surface, fontSize: 16 },
  tipCopy: { flex: 1 },
  tipTitle: { color: colors.surface, fontSize: 11, fontWeight: '800', marginBottom: 3 },
  tipDescription: { color: '#e0d5e2', fontSize: 10, lineHeight: 15 },
  tipArrow: { color: colors.gold, fontSize: 18, fontWeight: '800' },
  cardFootnote: { color: '#d9c9df', fontSize: 9, textAlign: 'center', marginTop: 13 },
  sectionIntro: { alignItems: 'center', marginTop: 8, marginBottom: 25 },
  sectionEyebrow: { color: colors.coral, fontSize: 10, fontWeight: '900', letterSpacing: 1.6, marginBottom: 11 },
  sectionTitle: { color: colors.ink, fontSize: 34, lineHeight: 41, fontWeight: '900', letterSpacing: -1.3, textAlign: 'center' },
  sectionCopy: { color: colors.muted, fontSize: 14, lineHeight: 22, textAlign: 'center', maxWidth: 510, marginTop: 10 },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  featureCard: { flex: 1, flexBasis: 230, minWidth: 220, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 21, padding: 22 },
  featureCardMiddle: { backgroundColor: '#f7e8dc', borderColor: '#efd3c1' },
  featureIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: colors.greenLight, marginBottom: 19 },
  featureIconCoral: { backgroundColor: '#f2cdbb' },
  featureIconText: { color: colors.green, fontSize: 22, fontWeight: '800' },
  featureIconTextCoral: { color: colors.coral },
  featureNumber: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  featureTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', letterSpacing: -0.4, marginBottom: 8 },
  featureCopy: { color: colors.inkSoft, fontSize: 12, lineHeight: 19 },
  closingCard: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 20, backgroundColor: colors.goldLight, borderRadius: 23, padding: 26, marginTop: 56, marginBottom: 34 },
  closingCopy: { flex: 1, flexBasis: 300 },
  closingEyebrow: { color: colors.coral, fontSize: 9, fontWeight: '900', letterSpacing: 1.4, marginBottom: 8 },
  closingTitle: { color: colors.ink, fontSize: 25, fontWeight: '900', letterSpacing: -0.7, marginBottom: 6 },
  closingDescription: { color: colors.inkSoft, fontSize: 12, lineHeight: 19, maxWidth: 500 },
  closingButton: { color: colors.surface, backgroundColor: colors.greenDark, fontWeight: '800', borderRadius: 999, paddingHorizontal: 19, paddingVertical: 13, overflow: 'hidden' },
  footer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 18, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 22 },
  footerBrand: { color: colors.ink, fontSize: 18, fontWeight: '900', letterSpacing: -0.7 },
  footerNote: { color: colors.muted, fontSize: 10, marginTop: 3 },
  footerLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  footerLink: { color: colors.inkSoft, fontSize: 11, fontWeight: '700', paddingVertical: 7 },
});
