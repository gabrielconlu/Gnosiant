function toCents(amount) {
  return Math.round(Number(amount) * 100);
}

function calculateMonthlySummary(entries) {
  const planned = entries.reduce((sum, item) => sum + Number(item.planned || 0), 0);
  const actual = entries.reduce((sum, item) => sum + Number(item.actual || 0), 0);

  return {
    planned,
    actual,
    remaining: planned - actual,
    variance: actual - planned,
  };
}

function estimateGoalCompletion(currentSaved, target, monthlyContribution) {
  if (target <= currentSaved || monthlyContribution <= 0) {
    return null;
  }

  const remaining = target - currentSaved;
  const months = Math.ceil(remaining / monthlyContribution);
  return {
    remaining,
    months,
    estimatedCompletionDate: `in ${months} months`,
  };
}

module.exports = { toCents, calculateMonthlySummary, estimateGoalCompletion };
