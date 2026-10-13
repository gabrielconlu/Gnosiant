import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { apiFetch } from '../lib/api';
import { colors } from '../lib/theme';

type Summary = {
  month: string;
  income: number;
  plannedSpending: number;
  actualSpending: number;
  savingsContribution: number;
  remaining: number;
  categories: { name: string; planned: number; actual: number }[];
  goals: { id: string; name: string; targetAmount: number; currentSaved: number; targetDate: string | null }[];
};

const currency = (value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const monthOptions = getMonthOptions();
const sections = [
  { href: '/budget', title: 'Budget & transactions', detail: 'Plan spending and log activity', icon: '$' },
  { href: '/goals', title: 'Savings goals', detail: 'Track progress worth celebrating', icon: '🎯' },
  { href: '/scenarios', title: 'What-if plans', detail: 'Explore a different path', icon: '?' },
  { href: '/account', title: 'Account settings', detail: 'Update your profile and password', icon: '⚙️' },
] as const;

export default function DashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[1]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    apiFetch<{ data: Summary }>(`/dashboard/summary?month=${selectedMonth}`)
      .then((response) => { if (active) setSummary(response.data); })
      .catch((error: unknown) => {
        if (active) setMessage(error instanceof Error ? error.message : 'Unable to load your dashboard.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedMonth]);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <Link href="/" asChild>
          <Text style={styles.homeLink}>← Back to home</Text>
        </Link>
        <Text style={styles.brand}>Gnosiant<Text style={styles.brandDot}>.</Text></Text>
      </View>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>YOUR MONEY, YOUR MOMENTUM</Text>
          <Text style={styles.title}>A clearer view of your month.</Text>
          <Text style={styles.subtitle}>Small, steady steps add up. Here’s where things stand.</Text>
        </View>
        <View style={styles.pillRow}>
          {monthOptions.map((month) => (
            <Pressable
              key={month}
              accessibilityRole="button"
              accessibilityState={{ selected: month === selectedMonth }}
              onPress={() => setSelectedMonth(month)}
              style={[styles.monthPill, month === selectedMonth && styles.monthPillActive]}
            >
              <Text style={[styles.monthPillText, month === selectedMonth && styles.monthPillTextActive]}>
              {new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {loading ? <ActivityIndicator color={colors.green} style={styles.loading} /> : null}
      {message ? (
        <View style={styles.message}>
          <Text accessibilityLiveRegion="polite" style={styles.messageText}>{message}</Text>
          {message.includes('log in') ? (
            <Link href="/login" asChild><Text style={styles.messageLink}>Sign in</Text></Link>
          ) : null}
        </View>
      ) : null}
      {!loading && summary ? (
        <>
          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View style={styles.heroCopy}>
                <Text style={styles.heroEyebrow}>ROOM LEFT IN YOUR PLAN</Text>
                <Text style={styles.heroAmount}>{currency(summary.remaining)}</Text>
                <Text style={styles.heroDescription}>remaining after recorded spending and planned savings</Text>
              </View>
              <View style={styles.heroSparkle}><Text style={styles.heroSparkleText}>🗸</Text></View>
            </View>
            <View style={styles.heroProgressTrack}>
              <View style={[styles.heroProgressFill, { width: `${getPlanProgress(summary)}%` }]} />
            </View>
            <View style={styles.heroFooter}>
              <Text style={styles.heroFooterText}>{currency(summary.actualSpending)} spent of {currency(summary.plannedSpending)} planned</Text>
              <Text style={styles.heroFooterPercent}>{getPlanProgress(summary)}%</Text>
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <Metric label="Income" value={currency(summary.income)} />
            <Metric label="Planned spending" value={currency(summary.plannedSpending)} />
            <Metric label="Actual spending" value={currency(summary.actualSpending)} />
            <Metric label="Remaining" value={currency(summary.remaining)} />
          </View>

          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Your money toolkit</Text>
            <Text style={styles.sectionDescription}>Pick up where you want to make progress.</Text>
          </View>
          <View style={styles.shortcutGrid}>
            {sections.map((section) => (
              <Link key={section.href} href={section.href} asChild>
                <Pressable style={styles.shortcutCard}>
                  <View style={styles.shortcutIcon}><Text style={styles.shortcutIconText}>{section.icon}</Text></View>
                  <View style={styles.shortcutCopy}>
                    <Text style={styles.shortcutTitle}>{section.title}</Text>
                    <Text style={styles.shortcutDetail}>{section.detail}</Text>
                  </View>
                  <Text style={styles.shortcutArrow}>→</Text>
                </Pressable>
              </Link>
            ))}
          </View>

          <View style={styles.sectionRow}>
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Spending by category</Text>
              {summary.categories.length ? summary.categories.map((item) => (
                <View key={item.name} style={styles.categoryRow}>
                  <View style={styles.categoryText}>
                    <Text style={styles.categoryName}>{item.name}</Text>
                    <Text style={styles.categoryMeta}>Plan {currency(item.planned)} · Spent {currency(item.actual)}</Text>
                  </View>
                  <Text style={[styles.categoryDiff, item.actual > item.planned && styles.dangerText]}>
                    {item.actual > item.planned ? '+' : ''}{currency(item.actual - item.planned)}
                  </Text>
                </View>
              )) : <Text style={styles.emptyText}>No categories yet. Start with your monthly budget.</Text>}
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Savings goals</Text>
              {summary.goals.length ? summary.goals.map((goal) => {
                const progress = Math.min(100, goal.targetAmount ? goal.currentSaved / goal.targetAmount * 100 : 0);
                return (
                  <View key={goal.id} style={styles.goalRow}>
                    <View style={styles.goalHeader}>
                      <Text style={styles.goalName}>{goal.name}</Text>
                      <Text style={styles.goalAmount}>{currency(goal.currentSaved)} / {currency(goal.targetAmount)}</Text>
                    </View>
                    <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
                    <Text style={styles.goalMeta}>{Math.round(progress)}% funded{goal.targetDate ? ` · target ${goal.targetDate}` : ''}</Text>
                  </View>
                );
              }) : <Text style={styles.emptyText}>No savings goals yet.</Text>}
            </View>
          </View>

          <View style={styles.insightPanel}>
            <View style={styles.insightMark}><Text style={styles.insightMarkText}>✎</Text></View>
            <View style={styles.insightCopy}>
              <Text style={styles.panelTitleLight}>A small note for this month</Text>
              <Text style={styles.insightText}>You’ve planned {currency(summary.savingsContribution)} toward savings. Every intentional step helps move a goal forward.</Text>
            </View>
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <View style={styles.metricCard}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>;
}

function getMonthOptions() {
  const now = new Date();
  return [-1, 0, 1].map((offset) => {
    const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  });
}

function getPlanProgress(summary: Summary) {
  if (summary.plannedSpending <= 0) return 0;
  return Math.min(100, Math.round((summary.actualSpending / summary.plannedSpending) * 100));
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingBottom: 48, width: '100%', maxWidth: 1280, alignSelf: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  homeLink: { color: colors.green, fontSize: 13, fontWeight: '800', paddingVertical: 8, paddingRight: 12 },
  brand: { color: colors.ink, fontSize: 19, fontWeight: '900', letterSpacing: -0.5 },
  brandDot: { color: colors.coral },
  header: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 18, marginBottom: 24 },
  kicker: { color: colors.coral, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 7 },
  title: { fontSize: 34, color: colors.ink, fontWeight: '900', letterSpacing: -1.1 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 6 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  monthPill: { backgroundColor: colors.surfaceMuted, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  monthPillText: { color: colors.inkSoft, fontSize: 12, fontWeight: '700' },
  monthPillActive: { backgroundColor: colors.greenDark },
  monthPillTextActive: { color: colors.surface },
  loading: { marginVertical: 40 },
  message: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, backgroundColor: colors.coralLight, padding: 14, borderRadius: 12, marginBottom: 18 },
  messageText: { color: colors.danger, fontSize: 13, flex: 1 },
  messageLink: { color: colors.greenDark, fontSize: 13, fontWeight: '800', padding: 4 },
  heroCard: { backgroundColor: colors.greenDark, borderRadius: 23, padding: 22, marginBottom: 16 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 },
  heroCopy: { flex: 1 },
  heroEyebrow: { color: '#d9c9df', fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  heroAmount: { color: colors.surface, fontSize: 38, lineHeight: 46, fontWeight: '900', letterSpacing: -1 },
  heroDescription: { color: '#e0d5e2', fontSize: 12, lineHeight: 18, maxWidth: 430 },
  heroSparkle: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  heroSparkleText: { color: colors.greenDark, fontSize: 22 },
  heroProgressTrack: { height: 8, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden', marginTop: 20 },
  heroProgressFill: { height: '100%', borderRadius: 99, backgroundColor: colors.gold },
  heroFooter: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 9 },
  heroFooterText: { color: '#e0d5e2', fontSize: 11 },
  heroFooterPercent: { color: colors.gold, fontSize: 11, fontWeight: '900' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  metricCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, minWidth: 150, flex: 1 },
  metricLabel: { color: colors.muted, fontWeight: '700', fontSize: 12 },
  metricValue: { color: colors.ink, fontSize: 22, fontWeight: '900', marginTop: 8 },
  sectionHeading: { marginBottom: 13 },
  sectionTitle: { color: colors.ink, fontSize: 21, fontWeight: '900', letterSpacing: -0.4 },
  sectionDescription: { color: colors.muted, fontSize: 12, marginTop: 4 },
  shortcutGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 26 },
  shortcutCard: { flexDirection: 'row', alignItems: 'center', gap: 11, flex: 1, minWidth: 235, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 15, padding: 14 },
  shortcutIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' },
  shortcutIconText: { color: colors.greenDark, fontSize: 17, fontWeight: '800' },
  shortcutCopy: { flex: 1 },
  shortcutTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  shortcutDetail: { color: colors.muted, fontSize: 10, marginTop: 4 },
  shortcutArrow: { color: colors.coral, fontSize: 16, fontWeight: '900' },
  sectionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 16 },
  panel: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 18, flex: 1, minWidth: 280 },
  panelTitle: { fontSize: 19, color: colors.ink, fontWeight: '700', marginBottom: 12 },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted },
  categoryText: { flex: 1 },
  categoryName: { fontWeight: '700', color: colors.greenDark },
  categoryMeta: { color: colors.muted, marginTop: 4, fontSize: 12 },
  categoryDiff: { fontWeight: '700', color: colors.green },
  dangerText: { color: colors.danger },
  goalRow: { marginBottom: 16 },
  goalHeader: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 6, marginBottom: 8 },
  goalName: { fontWeight: '700', color: colors.greenDark },
  goalAmount: { color: colors.inkSoft, fontSize: 12, fontWeight: '600' },
  progressTrack: { height: 9, borderRadius: 999, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.coral, borderRadius: 999 },
  goalMeta: { color: colors.muted, marginTop: 7, fontSize: 12 },
  emptyText: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  insightPanel: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.goldLight, borderRadius: 17, padding: 18, marginBottom: 4 },
  insightMark: { width: 36, height: 36, borderRadius: 13, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  insightMarkText: { color: colors.greenDark, fontSize: 18 },
  insightCopy: { flex: 1 },
  panelTitleLight: { fontSize: 15, color: colors.ink, fontWeight: '900', marginBottom: 4 },
  insightText: { color: colors.inkSoft, fontSize: 12, lineHeight: 18 },
});
