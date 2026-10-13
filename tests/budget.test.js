const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateMonthlySummary, estimateGoalCompletion } = require('../api/src/services/budgetCalculations');

test('calculateMonthlySummary tracks total planned and actual spending', () => {
  const summary = calculateMonthlySummary([
    { planned: 1200, actual: 1100 },
    { planned: 450, actual: 500 },
  ]);

  assert.equal(summary.planned, 1650);
  assert.equal(summary.actual, 1600);
  assert.equal(summary.remaining, 50);
  assert.equal(summary.variance, -50);
});

test('estimateGoalCompletion returns null when not enough info exists', () => {
  assert.equal(estimateGoalCompletion(5000, 5000, 250), null);
});
