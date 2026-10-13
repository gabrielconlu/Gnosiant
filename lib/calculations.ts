export type BudgetEntry = {
  planned: number;
  actual: number;
};

export function toCents(value: number): number {
  return Math.round(value * 100);
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}

export function calculateMonthlySummary(entries: BudgetEntry[]) {
  const planned = entries.reduce((sum, item) => sum + item.planned, 0);
  const actual = entries.reduce((sum, item) => sum + item.actual, 0);
  return {
    planned,
    actual,
    remaining: planned - actual,
    variance: actual - planned,
  };
}
