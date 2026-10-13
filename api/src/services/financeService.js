const db = require('../db');

async function getDashboardSummary(userId, month) {
  const budget = await getBudget(userId, month);
  const expenses = budget.id ? await db.query(
    `SELECT COALESCE(SUM(amount), 0) AS actual_spending
     FROM transactions
     WHERE user_id = $1 AND budget_id = $2 AND kind = 'expense'`,
    [userId, budget.id]
  ) : { rows: [{ actual_spending: 0 }] };
  const goals = await listGoals(userId);
  const income = Number(budget.income);
  const plannedSpending = budget.categories.reduce((sum, category) => sum + Number(category.plannedAmount), 0);
  const actualSpending = Number(expenses.rows[0].actual_spending);
  const savingsContribution = goals.reduce(
    (sum, goal) => sum + (goal.currentSaved < goal.targetAmount ? Number(goal.monthlyContribution || 0) : 0),
    0
  );
  return {
    month,
    income,
    plannedSpending,
    actualSpending,
    savingsContribution,
    remaining: income - actualSpending - savingsContribution,
    categories: budget.categories.map((category) => ({
      name: category.name,
      planned: Number(category.plannedAmount),
      actual: Number(category.actualAmount),
    })),
    goals,
  };
}

async function getBudget(userId, month) {
  const result = await db.query(
    `SELECT id, month, income FROM budgets WHERE user_id = $1 AND month = $2::date`,
    [userId, `${month}-01`]
  );
  if (!result.rows[0]) {
    return { id: null, month, income: 0, categories: [] };
  }
  const budget = result.rows[0];
  const categories = await db.query(
    `SELECT c.id, c.name, c.planned_amount,
       COALESCE(SUM(t.amount) FILTER (WHERE t.kind = 'expense'), 0) AS actual_amount
     FROM budget_categories c
     LEFT JOIN transactions t ON t.category_id = c.id
     WHERE c.budget_id = $1 AND c.user_id = $2
     GROUP BY c.id ORDER BY c.name`,
    [budget.id, userId]
  );
  return {
    id: String(budget.id),
    month: String(budget.month).slice(0, 7),
    income: Number(budget.income),
    categories: categories.rows.map((category) => ({
      id: String(category.id),
      name: category.name,
      plannedAmount: Number(category.planned_amount),
      actualAmount: Number(category.actual_amount),
    })),
  };
}

async function saveBudget(userId, { month, income, categories }) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const budgetResult = await client.query(
      `INSERT INTO budgets (user_id, month, income)
       VALUES ($1, $2::date, $3)
       ON CONFLICT (user_id, month)
       DO UPDATE SET income = EXCLUDED.income, updated_at = NOW()
       RETURNING id, month, income`,
      [userId, `${month}-01`, income]
    );
    const budgetId = budgetResult.rows[0].id;
    for (const category of categories) {
      await client.query(
        `INSERT INTO budget_categories (budget_id, user_id, name, planned_amount)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (budget_id, name)
         DO UPDATE SET planned_amount = EXCLUDED.planned_amount, updated_at = NOW()`,
        [budgetId, userId, category.name.trim(), category.plannedAmount]
      );
    }
    await client.query('COMMIT');
    return getBudget(userId, month);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function listTransactions(userId, month) {
  const result = await db.query(
    `SELECT t.id, t.budget_id, t.category_id, t.description, t.amount, t.kind, t.transaction_date,
       c.name AS category_name
     FROM transactions t
     LEFT JOIN budget_categories c ON c.id = t.category_id
     WHERE t.user_id = $1 AND t.transaction_date >= $2::date
       AND t.transaction_date < ($2::date + INTERVAL '1 month')
     ORDER BY t.transaction_date DESC, t.id DESC`,
    [userId, `${month}-01`]
  );
  return result.rows.map(serializeTransaction);
}

async function createTransaction(userId, input) {
  const result = await db.query(
    `INSERT INTO transactions (user_id, budget_id, category_id, description, amount, kind, transaction_date)
     SELECT $1, b.id, c.id, $4, $5, $6, $7::date
     FROM budgets b
     LEFT JOIN budget_categories c ON c.id = $3 AND c.budget_id = b.id AND c.user_id = b.user_id
     WHERE b.id = $2 AND b.user_id = $1
       AND b.month = date_trunc('month', $7::date)::date
       AND ($3::bigint IS NULL OR c.id IS NOT NULL)
     RETURNING id, budget_id, category_id, description, amount, kind, transaction_date`,
    [userId, input.budgetId, input.categoryId || null, input.description.trim(), input.amount, input.kind, input.date]
  );
  if (!result.rows[0]) {
    const error = new Error('Budget, month, or category not found for this account.');
    error.status = 404;
    throw error;
  }
  return serializeTransaction(result.rows[0]);
}

async function deleteTransaction(userId, transactionId) {
  const result = await db.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id', [
    transactionId,
    userId,
  ]);
  return result.rowCount > 0;
}

async function listGoals(userId) {
  const result = await db.query(
    `SELECT id, name, target_amount, current_saved, target_date, monthly_contribution
     FROM savings_goals WHERE user_id = $1 ORDER BY created_at, id`,
    [userId]
  );
  return result.rows.map((goal) => ({
    id: String(goal.id),
    name: goal.name,
    targetAmount: Number(goal.target_amount),
    currentSaved: Number(goal.current_saved),
    targetDate: goal.target_date ? String(goal.target_date).slice(0, 10) : null,
    monthlyContribution: goal.monthly_contribution === null ? null : Number(goal.monthly_contribution),
  }));
}

async function createGoal(userId, input) {
  const result = await db.query(
    `INSERT INTO savings_goals (user_id, name, target_amount, current_saved, target_date, monthly_contribution)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, target_amount, current_saved, target_date, monthly_contribution`,
    [userId, input.name.trim(), input.targetAmount, input.currentSaved, input.targetDate || null, input.monthlyContribution ?? null]
  );
  return serializeGoal(result.rows[0]);
}

async function updateGoal(userId, goalId, input) {
  const result = await db.query(
    `UPDATE savings_goals
     SET name = COALESCE($3, name), target_amount = COALESCE($4, target_amount),
       current_saved = COALESCE($5, current_saved), target_date = CASE WHEN $6::boolean THEN $7::date ELSE target_date END,
       monthly_contribution = CASE WHEN $8::boolean THEN $9::numeric ELSE monthly_contribution END, updated_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING id, name, target_amount, current_saved, target_date, monthly_contribution`,
    [
      goalId,
      userId,
      input.name?.trim() ?? null,
      input.targetAmount ?? null,
      input.currentSaved ?? null,
      input.targetDate !== undefined,
      input.targetDate || null,
      input.monthlyContribution !== undefined,
      input.monthlyContribution ?? null,
    ]
  );
  return result.rows[0] ? serializeGoal(result.rows[0]) : null;
}

async function deleteGoal(userId, goalId) {
  const result = await db.query('DELETE FROM savings_goals WHERE id = $1 AND user_id = $2 RETURNING id', [
    goalId,
    userId,
  ]);
  return result.rowCount > 0;
}

async function listScenarios(userId) {
  const result = await db.query(
    `SELECT id, name, description, assumptions, created_at, updated_at
     FROM scenarios WHERE user_id = $1 ORDER BY created_at DESC, id DESC`,
    [userId]
  );
  return result.rows.map(serializeScenario);
}

async function createScenario(userId, input) {
  const result = await db.query(
    `INSERT INTO scenarios (user_id, name, description, assumptions)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, description, assumptions, created_at, updated_at`,
    [userId, input.name.trim(), input.description || '', JSON.stringify(input.assumptions || {})]
  );
  return serializeScenario(result.rows[0]);
}

async function updateScenario(userId, scenarioId, input) {
  const result = await db.query(
    `UPDATE scenarios SET name = COALESCE($3, name), description = COALESCE($4, description),
       assumptions = COALESCE($5::jsonb, assumptions), updated_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING id, name, description, assumptions, created_at, updated_at`,
    [
      scenarioId,
      userId,
      input.name?.trim() ?? null,
      input.description ?? null,
      input.assumptions === undefined ? null : JSON.stringify(input.assumptions),
    ]
  );
  return result.rows[0] ? serializeScenario(result.rows[0]) : null;
}

async function deleteScenario(userId, scenarioId) {
  const result = await db.query('DELETE FROM scenarios WHERE id = $1 AND user_id = $2 RETURNING id', [
    scenarioId,
    userId,
  ]);
  return result.rowCount > 0;
}

function serializeTransaction(row) {
  return {
    id: String(row.id),
    budgetId: String(row.budget_id),
    categoryId: row.category_id === null ? null : String(row.category_id),
    categoryName: row.category_name || null,
    description: row.description,
    amount: Number(row.amount),
    kind: row.kind,
    date: String(row.transaction_date).slice(0, 10),
  };
}

function serializeGoal(row) {
  return {
    id: String(row.id),
    name: row.name,
    targetAmount: Number(row.target_amount),
    currentSaved: Number(row.current_saved),
    targetDate: row.target_date ? String(row.target_date).slice(0, 10) : null,
    monthlyContribution: row.monthly_contribution === null ? null : Number(row.monthly_contribution),
  };
}

function serializeScenario(row) {
  return {
    id: String(row.id),
    name: row.name,
    description: row.description,
    assumptions: row.assumptions,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = {
  getDashboardSummary,
  getBudget,
  saveBudget,
  listTransactions,
  createTransaction,
  deleteTransaction,
  listGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  listScenarios,
  createScenario,
  updateScenario,
  deleteScenario,
};
