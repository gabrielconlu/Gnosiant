import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { FinanceBackLink } from '../components/FinanceBackLink';
import { apiFetch } from '../lib/api';
import { colors } from '../lib/theme';

type Assumptions = { incomeDelta?: number; expenseDelta?: number; savingsDelta?: number };
type Scenario = { id: string; name: string; description: string; assumptions: Assumptions };
type Draft = { name: string; incomeDelta: string; expenseDelta: string; savingsDelta: string };

const emptyDraft = (): Draft => ({ name: '', incomeDelta: '0', expenseDelta: '0', savingsDelta: '0' });

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [newDraft, setNewDraft] = useState<Draft>(emptyDraft());
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    apiFetch<{ data: Scenario[] }>('/scenarios').then((response) => {
      if (!active) return;
      setScenarios(response.data);
      setDrafts(Object.fromEntries(response.data.map((scenario) => [scenario.id, toDraft(scenario)])));
      setMessage('');
    }).catch((error: unknown) => {
      if (active) setMessage(error instanceof Error ? error.message : 'Unable to load your scenarios.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function createScenario() {
    if (!newDraft.name.trim()) {
      setMessage('Give your scenario a name before saving.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const response = await apiFetch<{ data: Scenario }>('/scenarios', {
        method: 'POST',
        body: JSON.stringify({
          name: newDraft.name.trim(),
          description,
          assumptions: toAssumptions(newDraft),
        }),
      });
      setScenarios((current) => [response.data, ...current]);
      setDrafts((current) => ({ ...current, [response.data.id]: toDraft(response.data) }));
      setNewDraft(emptyDraft());
      setDescription('');
      setMessage('Scenario saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save this scenario.');
    } finally {
      setSaving(false);
    }
  }

  async function saveScenario(scenario: Scenario) {
    const draft = drafts[scenario.id];
    if (!draft.name.trim()) {
      setMessage('Scenario name cannot be empty.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const response = await apiFetch<{ data: Scenario }>(`/scenarios/${scenario.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: draft.name.trim(), assumptions: toAssumptions(draft) }),
      });
      setScenarios((current) => current.map((item) => item.id === scenario.id ? response.data : item));
      setDrafts((current) => ({ ...current, [scenario.id]: toDraft(response.data) }));
      setMessage('Scenario updated.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update this scenario.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteScenario(id: string) {
    setMessage('');
    try {
      await apiFetch(`/scenarios/${id}`, { method: 'DELETE' });
      setScenarios((current) => current.filter((scenario) => scenario.id !== id));
      setMessage('Scenario deleted.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to delete this scenario.');
    }
  }

  function updateDraft(id: string, patch: Partial<Draft>) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <FinanceBackLink />
      <Text style={styles.kicker}>What-if planner</Text>
      <Text style={styles.title}>Explore a different path</Text>
      <Text style={styles.subtitle}>Save monthly income, spending, and savings adjustments to compare possible plans.</Text>
      {loading ? <ActivityIndicator color={colors.green} style={styles.loading} /> : null}
      {message ? <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text> : null}
      {!loading ? (
        <>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Create a scenario</Text>
            <TextInput value={newDraft.name} onChangeText={(name) => setNewDraft((current) => ({ ...current, name }))} placeholder="Scenario name" style={styles.input} />
            <TextInput value={description} onChangeText={setDescription} placeholder="What are you exploring?" style={styles.input} />
            <ScenarioInputs draft={newDraft} onChange={(patch) => setNewDraft((current) => ({ ...current, ...patch }))} />
            <Pressable style={styles.primaryButton} onPress={createScenario} disabled={saving}>
              <Text style={styles.primaryButtonText}>{saving ? 'Saving…' : 'Save scenario'}</Text>
            </Pressable>
          </View>

          {scenarios.length ? scenarios.map((scenario) => {
            const draft = drafts[scenario.id] || toDraft(scenario);
            return (
              <View key={scenario.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Saved scenario</Text>
                  <Pressable onPress={() => deleteScenario(scenario.id)} accessibilityRole="button" accessibilityLabel={`Delete ${scenario.name}`}>
                    <Text style={styles.deleteLink}>Delete</Text>
                  </Pressable>
                </View>
                {scenario.description ? <Text style={styles.description}>{scenario.description}</Text> : null}
                <TextInput value={draft.name} onChangeText={(name) => updateDraft(scenario.id, { name })} style={styles.input} accessibilityLabel="Scenario name" />
                <ScenarioInputs draft={draft} onChange={(patch) => updateDraft(scenario.id, patch)} />
                <Text style={styles.impact}>{describeImpact(draft)}</Text>
                <Pressable style={styles.secondaryButton} onPress={() => saveScenario(scenario)} disabled={saving}>
                  <Text style={styles.secondaryButtonText}>Save changes</Text>
                </Pressable>
              </View>
            );
          }) : <Text style={styles.emptyText}>No scenarios saved yet. Create a what-if plan to compare changes.</Text>}
        </>
      ) : null}
    </ScrollView>
  );
}

function ScenarioInputs({ draft, onChange }: { draft: Draft; onChange: (patch: Partial<Draft>) => void }) {
  return (
    <View style={styles.inputGrid}>
      <LabeledInput label="Monthly income change" value={draft.incomeDelta} onChange={(incomeDelta) => onChange({ incomeDelta })} />
      <LabeledInput label="Monthly expense change" value={draft.expenseDelta} onChange={(expenseDelta) => onChange({ expenseDelta })} />
      <LabeledInput label="Monthly savings change" value={draft.savingsDelta} onChange={(savingsDelta) => onChange({ savingsDelta })} />
    </View>
  );
}

function LabeledInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <View style={styles.labeledInput}>
      <Text style={styles.label}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} keyboardType="decimal-pad" style={styles.input} />
    </View>
  );
}

function toDraft(scenario: Scenario): Draft {
  return {
    name: scenario.name,
    incomeDelta: String(scenario.assumptions.incomeDelta || 0),
    expenseDelta: String(scenario.assumptions.expenseDelta || 0),
    savingsDelta: String(scenario.assumptions.savingsDelta || 0),
  };
}

function toAssumptions(draft: Draft): Assumptions {
  return {
    incomeDelta: Number(draft.incomeDelta) || 0,
    expenseDelta: Number(draft.expenseDelta) || 0,
    savingsDelta: Number(draft.savingsDelta) || 0,
  };
}

function describeImpact(draft: Draft) {
  const assumptions = toAssumptions(draft);
  const monthlyChange = (assumptions.incomeDelta || 0) - (assumptions.expenseDelta || 0) - (assumptions.savingsDelta || 0);
  const amount = Math.abs(monthlyChange).toLocaleString(undefined, { maximumFractionDigits: 2 });
  return `Monthly remaining ${monthlyChange >= 0 ? 'increases' : 'decreases'} by $${amount}.`;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingBottom: 40, width: '100%', maxWidth: 940, alignSelf: 'center' },
  kicker: { color: colors.muted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },
  title: { fontSize: 34, color: colors.ink, fontWeight: '700', marginTop: 8 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 18 },
  loading: { marginVertical: 32 },
  message: { color: colors.greenDark, backgroundColor: colors.greenLight, padding: 12, borderRadius: 9, marginBottom: 14 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 18, marginBottom: 14 },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '700', marginBottom: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 10 },
  cardTitle: { color: colors.ink, fontSize: 17, fontWeight: '700' },
  description: { color: colors.muted, fontSize: 13, marginBottom: 12 },
  inputGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  labeledInput: { flex: 1, minWidth: 190 },
  label: { color: colors.inkSoft, fontWeight: '600', fontSize: 12, marginBottom: 6 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 11, marginBottom: 12, color: colors.ink, minWidth: 80 },
  primaryButton: { backgroundColor: colors.greenDark, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  primaryButtonText: { color: colors.surface, fontWeight: '700' },
  secondaryButton: { alignSelf: 'flex-start', backgroundColor: colors.greenLight, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 9 },
  secondaryButtonText: { color: colors.greenDark, fontWeight: '700' },
  impact: { color: colors.greenDark, backgroundColor: colors.surfaceMuted, padding: 12, borderRadius: 9, marginBottom: 12, fontSize: 13 },
  deleteLink: { color: colors.danger, fontWeight: '600', fontSize: 12 },
  emptyText: { color: colors.muted, fontSize: 13, marginTop: 8 },
});
