import { Link } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../lib/theme';

const pages = [
  { href: '/terms', label: 'Terms of use' },
  { href: '/privacy', label: 'Privacy notice' },
  { href: '/privacy-settings', label: 'Cookies & storage' },
  { href: '/support', label: 'Support' },
] as const;

type LegalLayoutProps = {
  active: (typeof pages)[number]['href'];
  eyebrow: string;
  heading: string;
  accent: string;
  intro: string;
  title: string;
  children: ReactNode;
};

export function LegalLayout({ active, eyebrow, heading, accent, intro, title, children }: LegalLayoutProps) {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
      <View style={styles.layout}>
        <View style={styles.sidebar}>
          <Link href="/" asChild>
            <Text style={styles.backLink}>← Back home</Text>
          </Link>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.heading}>{heading}{'\n'}<Text style={styles.accent}>{accent}</Text></Text>
          <View style={styles.sidebarRule} />
          <View style={styles.navigation}>
            {pages.map((page) => (
              <Link key={page.href} href={page.href} asChild>
                <Text style={active === page.href ? styles.navItemActive : styles.navItem}>{page.label}</Text>
              </Link>
            ))}
          </View>
          <Text style={styles.sidebarNote}>These pages explain how Gnosiant works and how to manage your information.</Text>
        </View>

        <View style={styles.document}>
          <Text style={styles.documentTitle}>{title}</Text>
          <View style={styles.documentRule} />
          <Text style={styles.intro}>{intro}</Text>
          {children}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  pageContent: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 24 },
  layout: { width: '100%', maxWidth: 1320, alignSelf: 'center', flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 28, alignItems: 'flex-start' },
  sidebar: { flexGrow: 1, flexBasis: 300, maxWidth: 390, paddingTop: 8 },
  backLink: { color: colors.green, fontSize: 14, fontWeight: '700', marginBottom: 36, paddingVertical: 8 },
  eyebrow: { color: colors.coral, fontSize: 11, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 18 },
  heading: { color: colors.ink, fontSize: 40, fontWeight: '800', lineHeight: 46, letterSpacing: -1.5 },
  accent: { color: colors.coral, fontWeight: '900' },
  sidebarRule: { height: 1, backgroundColor: colors.border, marginTop: 28, marginBottom: 10 },
  navigation: { gap: 3 },
  navItem: { color: colors.muted, fontSize: 13, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 9 },
  navItemActive: { color: colors.greenDark, backgroundColor: colors.greenLight, fontWeight: '800', fontSize: 13, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 9 },
  sidebarNote: { color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 22, maxWidth: 300 },
  document: { flexGrow: 2, flexShrink: 1, flexBasis: 440, minWidth: 0, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 22, paddingHorizontal: 34, paddingVertical: 30, marginTop: 8, marginBottom: 24, shadowColor: colors.ink, shadowOpacity: 0.04, shadowRadius: 24, shadowOffset: { width: 0, height: 10 } },
  documentTitle: { color: colors.ink, fontSize: 30, fontWeight: '800', letterSpacing: -0.8 },
  documentRule: { height: 1, backgroundColor: colors.border, marginTop: 20, marginBottom: 20 },
  intro: { color: colors.inkSoft, fontSize: 15, lineHeight: 25, marginBottom: 18 },
});
