import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { FinanceBackLink } from '../components/FinanceBackLink';
import { apiFetch } from '../lib/api';
import { colors } from '../lib/theme';

type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  currentSaved: number;
  targetDate: string | null;
  monthlyContribution: number | null;
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [progressValues, setProgressValues] = useState<Record<string, string>>({});
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [saved, setSaved] = useState('0');
  const [monthly, setMonthly] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    apiFetch<{ data: Goal[] }>('/goals').then((response) => {
      if (!active) return;
      setGoals(response.data);
      setProgressValues(Object.fromEntries(response.data.map((goal) => [goal.id, String(goal.currentSaved)])));
      setMessage('');
    }).catch((error: unknown) => {
      if (active) setMessage(error instanceof Error ? error.message : 'Unable to load savings goals.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function createGoal() {
    const targetAmount = Number(target);
    if (!name.trim() || !Number.isFinite(targetAmount) || targetAmount <= 0) {
      setMessage('Enter a goal name and a target amount greater than zero.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const response = await apiFetch<{ data: Goal }>('/goals', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          targetAmount,
          currentSaved: Number(saved) || 0,
          targetDate: targetDate || null,
          monthlyContribution: monthly ? Number(monthly) : null,
        }),
      });
      setGoals((current) => [...current, response.data]);
      setProgressValues((current) => ({ ...current, [response.data.id]: String(response.data.currentSaved) }));
      setName('');
      setTarget('');
      setSaved('0');
      setMonthly('');
      setTargetDate('');
      setMessage('Savings goal created.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create this goal.');
    } finally {
      setSaving(false);
    }
  }

  async function saveProgress(goal: Goal) {
    const currentSaved = Number(progressValues[goal.id]);
    if (!Number.isFinite(currentSaved) || currentSaved < 0) {
      setMessage('Saved progress must be zero or more.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const response = await apiFetch<{ data: Goal }>(`/goals/${goal.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ currentSaved }),
      });
      setGoals((current) => current.map((item) => item.id === goal.id ? response.data : item));
      setMessage('Goal progress saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update goal progress.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteGoal(id: string) {
    setMessage('');
    try {
      await apiFetch(`/goals/${id}`, { method: 'DELETE' });
      setGoals((current) => current.filter((goal) => goal.id !== id));
      setMessage('Savings goal deleted.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to delete this goal.');
    }
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <FinanceBackLink />
      <Text style={styles.kicker}>Savings goals</Text>
      <Text style={styles.title}>Every little bit counts.</Text>
      <Text style={styles.subtitle}>Give your savings a purpose. We’ll help you notice each step along the way.</Text>
      {loading ? <ActivityIndicator color={colors.green} style={styles.loading} /> : null}
      {message ? <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text> : null}
      {!loading ? (
        <>
          {goals.length ? (
            <View style={styles.momentumCard}>
              <View style={styles.momentumCopy}>
                <Text style={styles.momentumEyebrow}>YOUR SAVINGS MOMENTUM</Text>
                <Text style={styles.momentumTitle}>${goals.reduce((sum, goal) => sum + goal.currentSaved, 0).toLocaleString()} already set aside</Text>
                <Text style={styles.momentumSubtitle}>{goals.filter((goal) => goal.currentSaved >= goal.targetAmount).length} of {goals.length} goals reached. Every milestone is worth noticing.</Text>
              </View>
              <View style={styles.momentumStar}><Text style={styles.momentumStarText}>✦</Text></View>
            </View>
          ) : null}
          <View style={styles.card}>
            <View style={styles.formHeading}>
              <View style={styles.formIcon}><Text style={styles.formIconText}>＋</Text></View>
              <View><Text style={styles.sectionTitle}>Name what you’re saving for</Text><Text style={styles.formSubtitle}>Start with a dream, not a perfect number.</Text></View>
            </View>
            <TextInput value={name} onChangeText={setName} placeholder="Goal name" style={styles.input} />
            <View style={styles.formRow}>
              <TextInput value={target} onChangeText={setTarget} placeholder="Target amount" keyboardType="decimal-pad" style={[styles.input, styles.flexInput]} />
              <TextInput value={saved} onChangeText={setSaved} placeholder="Already saved" keyboardType="decimal-pad" style={[styles.input, styles.flexInput]} />
            </View>
            <View style={styles.formRow}>
              <TextInput value={monthly} onChangeText={setMonthly} placeholder="Monthly contribution (optional)" keyboardType="decimal-pad" style={[styles.input, styles.flexInput]} />
              <TextInput value={targetDate} onChangeText={setTargetDate} placeholder="Target date YYYY-MM-DD" style={[styles.input, styles.flexInput]} />
            </View>
            <Pressable style={styles.primaryButton} onPress={createGoal} disabled={saving}>
              <Text style={styles.primaryButtonText}>{saving ? 'Saving…' : 'Create goal'}</Text>
            </Pressable>
          </View>

          {goals.length ? goals.map((goal) => {
            const progress = Math.min(100, goal.targetAmount ? goal.currentSaved / goal.targetAmount * 100 : 0);
            return (
              <View key={goal.id} style={styles.card}>
                <View style={styles.goalHeader}>
                  <View style={styles.goalTitleBlock}>
                    <Text style={styles.goalName}>{goal.name}</Text>
                    <Text style={styles.goalMeta}>${goal.currentSaved.toLocaleString()} of ${goal.targetAmount.toLocaleString()} · {Math.round(progress)}% funded</Text>
                  </View>
                  <Pressable onPress={() => deleteGoal(goal.id)} accessibilityRole="button" accessibilityLabel={`Delete ${goal.name}`}>
                    <Text style={styles.deleteLink}>Delete</Text>
                  </Pressable>
                </View>
                <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
                <View style={styles.milestoneRow}>
                  {[25, 50, 75, 100].map((milestone) => {
                    const reached = progress >= milestone;
                    return (
                      <View key={milestone} style={styles.milestone}>
                        <View style={reached ? styles.milestoneDotReached : styles.milestoneDot}>
                          <Text style={reached ? styles.milestoneCheckReached : styles.milestoneCheck}>{reached ? '✓' : '·'}</Text>
                        </View>
                        <Text style={reached ? styles.milestoneLabelReached : styles.milestoneLabel}>{milestone}%</Text>
                      </View>
                    );
                  })}
                </View>
                <View style={progress >= 100 ? styles.winBanner : styles.nextStepBanner}>
                  <Text style={progress >= 100 ? styles.winText : styles.nextStepText}>
                    {progress >= 100
                      ? 'Goal reached! Take a moment to celebrate this win.'
                      : progress >= 75
                        ? `Nearly there — $${Math.max(0, goal.targetAmount - goal.currentSaved).toLocaleString()} to your goal.`
                        : `Next checkpoint: ${progress < 25 ? '25%' : progress < 50 ? '50%' : '75%'}. Keep going at your pace.`}
                  </Text>
                </View>
                <View style={styles.goalDetails}>
                  {goal.targetDate ? <Text style={styles.detail}>Target date: {goal.targetDate}</Text> : null}
                  {goal.monthlyContribution !== null ? <Text style={styles.detail}>Monthly contribution: ${goal.monthlyContribution.toLocaleString()}</Text> : null}
                </View>
                <View style={styles.progressEdit}>
                  <TextInput
                    value={progressValues[goal.id] ?? ''}
                    onChangeText={(value) => setProgressValues((current) => ({ ...current, [goal.id]: value }))}
                    keyboardType="decimal-pad"
                    placeholder="New total saved"
                    style={[styles.input, styles.progressInput]}
                    accessibilityLabel={`Saved amount for ${goal.name}`}
                  />
                  <Pressable style={styles.secondaryButton} onPress={() => saveProgress(goal)} disabled={saving}>
                    <Text style={styles.secondaryButtonText}>Update my progress</Text>
                  </Pressable>
                </View>
              </View>
            );
          }) : <Text style={styles.emptyText}>No goals yet. Create one to start tracking your progress.</Text>}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingBottom: 40, width: '100%', maxWidth: 940, alignSelf: 'center' },
  kicker: { color: colors.coral, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2, fontSize: 11 },
  title: { fontSize: 35, color: colors.ink, fontWeight: '900', letterSpacing: -1.1, marginTop: 8 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 5, marginBottom: 18 },
  loading: { marginVertical: 32 },
  message: { color: colors.greenDark, backgroundColor: colors.greenLight, padding: 12, borderRadius: 9, marginBottom: 14 },
  momentumCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 14, backgroundColor: colors.greenDark, borderRadius: 18, padding: 20, marginBottom: 14 },
  momentumCopy: { flex: 1 },
  momentumEyebrow: { color: '#d9c9df', fontSize: 9, fontWeight: '900', letterSpacing: 1.3, marginBottom: 7 },
  momentumTitle: { color: colors.surface, fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  momentumSubtitle: { color: '#e0d5e2', fontSize: 11, lineHeight: 17, marginTop: 6 },
  momentumStar: { width: 43, height: 43, borderRadius: 15, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  momentumStarText: { color: colors.greenDark, fontSize: 22 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 18, marginBottom: 14 },
  formHeading: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 14 },
  formIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.coralLight, alignItems: 'center', justifyContent: 'center' },
  formIconText: { color: colors.coral, fontSize: 19, fontWeight: '800' },
  sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  formSubtitle: { color: colors.muted, fontSize: 11, marginTop: 3 },
  input: { backgroundColor: '#faf8f2', borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 11, marginBottom: 12, color: colors.ink },
  formRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  flexInput: { flex: 1, minWidth: 180 },
  primaryButton: { backgroundColor: colors.greenDark, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 2 },
  primaryButtonText: { color: colors.surface, fontWeight: '800' },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, marginBottom: 12 },
  goalTitleBlock: { flex: 1 },
  goalName: { color: colors.ink, fontSize: 19, fontWeight: '800' },
  goalMeta: { color: colors.muted, fontSize: 12, marginTop: 5 },
  progressTrack: { height: 10, backgroundColor: colors.surfaceMuted, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.green, borderRadius: 999 },
  milestoneRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 9, marginBottom: 10 },
  milestone: { alignItems: 'center', gap: 4 },
  milestoneDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  milestoneDotReached: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.goldLight, alignItems: 'center', justifyContent: 'center' },
  milestoneCheck: { color: colors.muted, fontSize: 11 },
  milestoneCheckReached: { color: colors.greenDark, fontSize: 10, fontWeight: '900' },
  milestoneLabel: { color: colors.muted, fontSize: 9 },
  milestoneLabelReached: { color: colors.green, fontSize: 9, fontWeight: '800' },
  nextStepBanner: { backgroundColor: colors.greenLight, borderRadius: 9, padding: 10, marginBottom: 11 },
  nextStepText: { color: colors.greenDark, fontSize: 11, fontWeight: '700' },
  winBanner: { backgroundColor: colors.goldLight, borderRadius: 9, padding: 10, marginBottom: 11 },
  winText: { color: colors.greenDark, fontSize: 11, fontWeight: '800' },
  goalDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 10 },
  detail: { color: colors.muted, fontSize: 12 },
  progressEdit: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 12 },
  progressInput: { flex: 1, minWidth: 160, marginBottom: 0 },
  secondaryButton: { backgroundColor: colors.greenLight, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 9 },
  secondaryButtonText: { color: colors.greenDark, fontWeight: '800', fontSize: 12 },
  deleteLink: { color: colors.danger, fontWeight: '700', fontSize: 12 },
  emptyText: { color: colors.muted, fontSize: 13, marginTop: 8 },
});
