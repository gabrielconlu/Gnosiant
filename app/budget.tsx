import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { FinanceBackLink } from '../components/FinanceBackLink';
import { apiFetch } from '../lib/api';
import { colors } from '../lib/theme';

type Category = { id?: string; name: string; plannedAmount: number; actualAmount?: number };
type Budget = { id: string | null; month: string; income: number; categories: Category[] };
type Transaction = { id: string; description: string; amount: number; kind: 'income' | 'expense'; date: string; categoryName: string | null };

const currentMonth = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};
const today = () => new Date().toISOString().slice(0, 10);

export default function BudgetPage() {
  const [month, setMonth] = useState(currentMonth());
  const [monthInput, setMonthInput] = useState(currentMonth());
  const [budget, setBudget] = useState<Budget>({ id: null, month: currentMonth(), income: 0, categories: [] });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [kind, setKind] = useState<'income' | 'expense'>('expense');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [date, setDate] = useState(today());
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      apiFetch<{ data: Budget }>(`/budgets?month=${encodeURIComponent(month)}`),
      apiFetch<{ data: Transaction[] }>(`/transactions?month=${encodeURIComponent(month)}`),
    ]).then(([budgetResponse, transactionResponse]) => {
      if (!active) return;
      setBudget(budgetResponse.data);
      setTransactions(transactionResponse.data);
    }).catch((error: unknown) => {
      if (active) setMessage(error instanceof Error ? error.message : 'Unable to load budget data.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [month]);

  const planned = budget.categories.reduce((sum, category) => sum + category.plannedAmount, 0);
  const actual = transactions.filter((transaction) => transaction.kind === 'expense').reduce((sum, transaction) => sum + transaction.amount, 0);

  function updateCategory(index: number, patch: Partial<Category>) {
    setBudget((current) => ({
      ...current,
      categories: current.categories.map((category, itemIndex) => itemIndex === index ? { ...category, ...patch } : category),
    }));
  }

  function addCategory() {
    const name = newCategory.trim();
    if (!name) return;
    if (budget.categories.some((category) => category.name.toLowerCase() === name.toLowerCase())) {
      setMessage('A category with that name already exists in this budget.');
      return;
    }
    setBudget((current) => ({ ...current, categories: [...current.categories, { name, plannedAmount: 0 }] }));
    setNewCategory('');
    setMessage('');
  }

  async function saveBudget() {
    setSaving(true);
    setMessage('');
    try {
      const response = await apiFetch<{ data: Budget }>('/budgets', {
        method: 'PUT',
        body: JSON.stringify({
          month,
          income: budget.income,
          categories: budget.categories.map(({ name, plannedAmount }) => ({ name, plannedAmount })),
        }),
      });
      setBudget(response.data);
      setMessage('Your budget was saved.');
      return response.data;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save your budget.');
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function addTransaction() {
    const numericAmount = Number(amount);
    if (!description.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setMessage('Enter a description and an amount greater than zero.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      let savedBudget = budget;
      if (!budget.id) {
        const response = await apiFetch<{ data: Budget }>('/budgets', {
          method: 'PUT',
          body: JSON.stringify({
            month,
            income: budget.income,
            categories: budget.categories.map(({ name, plannedAmount }) => ({ name, plannedAmount })),
          }),
        });
        savedBudget = response.data;
        setBudget(savedBudget);
      }
      if (!savedBudget.id) {
        setMessage('Save a budget for this month before adding transactions.');
        return;
      }
      const response = await apiFetch<{ data: Transaction }>('/transactions', {
        method: 'POST',
        body: JSON.stringify({
          budgetId: savedBudget.id,
          categoryId,
          description: description.trim(),
          amount: numericAmount,
          kind,
          date,
        }),
      });
      setTransactions((current) => [response.data, ...current]);
      setDescription('');
      setAmount('');
      setMessage('Transaction added.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to add transaction.');
    } finally {
      setSaving(false);
    }
  }

  async function removeTransaction(id: string) {
    setMessage('');
    try {
      await apiFetch(`/transactions/${id}`, { method: 'DELETE' });
      setTransactions((current) => current.filter((transaction) => transaction.id !== id));
      setMessage('Transaction deleted.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to delete transaction.');
    }
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <FinanceBackLink />
      <Text style={styles.kicker}>Budget planner</Text>
      <Text style={styles.title}>Your monthly budget</Text>
      <Text style={styles.label}>Month</Text>
      <View style={styles.monthRow}>
        <TextInput value={monthInput} onChangeText={setMonthInput} placeholder="YYYY-MM" style={[styles.input, styles.monthInput]} autoCapitalize="none" />
        <Pressable
          style={styles.secondaryButton}
          onPress={() => {
            if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(monthInput)) {
              setMessage('Enter a month in YYYY-MM format.');
              return;
            }
            setMonth(monthInput);
            setMessage('');
          }}
        >
          <Text style={styles.secondaryButtonText}>Load month</Text>
        </Pressable>
      </View>
      {loading ? <ActivityIndicator color={colors.green} style={styles.loading} /> : null}
      {message ? <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text> : null}

      {!loading ? (
        <>
          <View style={styles.summaryRow}>
            <SummaryCard label="Income" value={budget.income} />
            <SummaryCard label="Planned" value={planned} />
            <SummaryCard label="Actual spending" value={actual} />
            <SummaryCard label="Unplanned" value={planned - actual} />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Monthly plan</Text>
            <Text style={styles.label}>Monthly income</Text>
            <TextInput
              value={String(budget.income)}
              onChangeText={(value) => setBudget((current) => ({ ...current, income: Number(value) || 0 }))}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            {budget.categories.map((category, index) => (
              <View key={category.id || category.name} style={styles.categoryRow}>
                <TextInput
                  value={category.name}
                  onChangeText={(name) => updateCategory(index, { name })}
                  style={[styles.input, styles.categoryName]}
                  placeholder="Category name"
                />
                <TextInput
                  value={String(category.plannedAmount)}
                  onChangeText={(value) => updateCategory(index, { plannedAmount: Number(value) || 0 })}
                  keyboardType="decimal-pad"
                  style={[styles.input, styles.categoryAmount]}
                  accessibilityLabel={`${category.name} planned amount`}
                />
              </View>
            ))}
            <View style={styles.categoryRow}>
              <TextInput value={newCategory} onChangeText={setNewCategory} placeholder="Add a category" style={[styles.input, styles.categoryName]} />
              <Pressable style={styles.secondaryButton} onPress={addCategory}><Text style={styles.secondaryButtonText}>Add</Text></Pressable>
            </View>
            <Pressable style={styles.primaryButton} onPress={saveBudget} disabled={saving}>
              <Text style={styles.primaryButtonText}>{saving ? 'Saving…' : 'Save budget'}</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Add a transaction</Text>
            <TextInput value={description} onChangeText={setDescription} placeholder="Description" style={styles.input} />
            <TextInput value={amount} onChangeText={setAmount} placeholder="Amount" keyboardType="decimal-pad" style={styles.input} />
            <TextInput value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" style={styles.input} />
            <View style={styles.choiceRow}>
              {(['expense', 'income'] as const).map((option) => (
                <Pressable key={option} onPress={() => setKind(option)} style={[styles.choice, kind === option && styles.choiceActive]}>
                  <Text style={[styles.choiceText, kind === option && styles.choiceTextActive]}>{option === 'expense' ? 'Expense' : 'Income'}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.label}>Category (optional)</Text>
            <View style={styles.choiceRow}>
              <Pressable onPress={() => setCategoryId(null)} style={[styles.choice, categoryId === null && styles.choiceActive]}>
                <Text style={[styles.choiceText, categoryId === null && styles.choiceTextActive]}>None</Text>
              </Pressable>
              {budget.categories.filter((category) => category.id).map((category) => (
                <Pressable key={category.id} onPress={() => setCategoryId(category.id || null)} style={[styles.choice, categoryId === category.id && styles.choiceActive]}>
                  <Text style={[styles.choiceText, categoryId === category.id && styles.choiceTextActive]}>{category.name}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={styles.primaryButton} onPress={addTransaction} disabled={saving}>
              <Text style={styles.primaryButtonText}>{saving ? 'Saving…' : 'Add transaction'}</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Transactions</Text>
            {transactions.length ? transactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionRow}>
                <View style={styles.transactionDescription}>
                  <Text style={styles.transactionTitle}>{transaction.description}</Text>
                  <Text style={styles.transactionMeta}>{transaction.date}{transaction.categoryName ? ` · ${transaction.categoryName}` : ''} · {transaction.kind}</Text>
                </View>
                <Text style={styles.transactionAmount}>{transaction.kind === 'expense' ? '−' : '+'}${transaction.amount.toLocaleString()}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${transaction.description}`} onPress={() => removeTransaction(transaction.id)}>
                  <Text style={styles.deleteLink}>Delete</Text>
                </Pressable>
              </View>
            )) : <Text style={styles.emptyText}>No transactions for this month yet.</Text>}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return <View style={styles.summaryCard}><Text style={styles.summaryLabel}>{label}</Text><Text style={styles.summaryValue}>${value.toLocaleString()}</Text></View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingBottom: 40, width: '100%', maxWidth: 1080, alignSelf: 'center' },
  kicker: { color: colors.muted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },
  title: { fontSize: 34, color: colors.ink, fontWeight: '700', marginTop: 8, marginBottom: 14 },
  label: { color: colors.inkSoft, fontWeight: '600', fontSize: 13, marginBottom: 6 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 11, marginBottom: 12, color: colors.ink, minWidth: 80 },
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  monthInput: { width: 150 },
  loading: { marginVertical: 32 },
  message: { color: colors.greenDark, backgroundColor: colors.greenLight, padding: 12, borderRadius: 9, marginVertical: 12 },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 18 },
  summaryCard: { flex: 1, minWidth: 140, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 15 },
  summaryLabel: { color: colors.muted, fontWeight: '600', fontSize: 12 },
  summaryValue: { color: colors.ink, fontSize: 20, fontWeight: '700', marginTop: 8 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 18, marginBottom: 16 },
  sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: '700', marginBottom: 14 },
  categoryRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  categoryName: { flex: 1 },
  categoryAmount: { width: 140 },
  secondaryButton: { backgroundColor: colors.greenLight, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 9, marginBottom: 12 },
  secondaryButtonText: { color: colors.greenDark, fontWeight: '700' },
  primaryButton: { backgroundColor: colors.greenDark, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  primaryButtonText: { color: colors.surface, fontWeight: '700' },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  choice: { borderRadius: 999, backgroundColor: colors.surfaceMuted, paddingHorizontal: 12, paddingVertical: 8 },
  choiceActive: { backgroundColor: colors.green },
  choiceText: { color: colors.inkSoft, fontSize: 12, fontWeight: '600' },
  choiceTextActive: { color: colors.surface },
  transactionRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted },
  transactionDescription: { flex: 1, minWidth: 160 },
  transactionTitle: { color: colors.greenDark, fontWeight: '700' },
  transactionMeta: { color: colors.muted, fontSize: 12, marginTop: 4 },
  transactionAmount: { color: colors.greenDark, fontWeight: '700' },
  deleteLink: { color: colors.danger, fontSize: 12, fontWeight: '600' },
  emptyText: { color: colors.muted, fontSize: 13 },
});
