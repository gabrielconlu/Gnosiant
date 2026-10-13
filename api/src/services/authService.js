const bcrypt = require('bcryptjs');
const db = require('../db');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function serviceError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function validateCredentials({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw serviceError('Please enter a valid email address.');
  }
  if (String(password || '').length < 6) {
    throw serviceError('Password must be at least 6 characters long.');
  }
  return { email: normalizedEmail, password };
}

async function register(input) {
  const { email, password } = validateCredentials(input);
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const result = await db.query(
      `INSERT INTO users (email, password_hash, accepted_terms_at)
       VALUES ($1, $2, NOW())
       RETURNING id, email, locale, currency`,
      [email, passwordHash]
    );
    return serializeUser(result.rows[0]);
  } catch (error) {
    if (error && error.code === '23505') {
      throw serviceError('An account already exists for this email address.', 409);
    }
    throw error;
  }
}

async function login(input, request) {
  const email = normalizeEmail(input.email);
  const result = await db.query(
    'SELECT id, email, password_hash, locale, currency FROM users WHERE email = $1',
    [email]
  );
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(input.password || '', user.password_hash))) {
    throw serviceError('Invalid email or password.', 401);
  }
  if (typeof request.session.regenerate === 'function') {
    await new Promise((resolve, reject) => {
      request.session.regenerate((error) => (error ? reject(error) : resolve()));
    });
  }

  request.session.userId = String(user.id);
  request.session.email = user.email;
  return serializeUser(user);
}

async function logout(session) {
  if (!session) return;
  await new Promise((resolve, reject) => {
    session.destroy((error) => (error ? reject(error) : resolve()));
  });
}

async function getSessionUser(session) {
  if (!session || !session.userId) return null;
  const result = await db.query(
    `SELECT id, email, locale, currency, privacy_preferences
     FROM users WHERE id = $1`,
    [session.userId]
  );
  return result.rows[0] ? serializeUser(result.rows[0]) : null;
}

async function getAccount(userId) {
  const result = await db.query(
    `SELECT id, email, locale, currency, privacy_preferences
     FROM users WHERE id = $1`,
    [userId]
  );
  return result.rows[0] ? serializeUser(result.rows[0]) : null;
}

async function updateAccount(userId, payload) {
  const updates = [];
  const values = [];
  const add = (column, value) => {
    values.push(value);
    updates.push(`${column} = $${values.length}`);
  };

  if (payload.email) add('email', normalizeEmail(payload.email));
  if (payload.newPassword) {
    if (!payload.currentPassword) throw serviceError('Enter your current password to choose a new one.');
    const currentResult = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (!currentResult.rows[0]) throw serviceError('Account not found.', 404);
    if (!(await bcrypt.compare(payload.currentPassword, currentResult.rows[0].password_hash))) {
      throw serviceError('Your current password is incorrect.', 401);
    }
    add('password_hash', await bcrypt.hash(payload.newPassword, 12));
  }
  if (payload.locale) add('locale', payload.locale);
  if (payload.currency) add('currency', payload.currency.toUpperCase());
  if (payload.privacyPreferences) {
    values.push(JSON.stringify(payload.privacyPreferences));
    updates.push(`privacy_preferences = privacy_preferences || $${values.length}::jsonb`);
  }
  if (updates.length === 0) return getAccount(userId);

  values.push(userId);
  try {
    const result = await db.query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${values.length}
       RETURNING id, email, locale, currency, privacy_preferences`,
      values
    );
    if (!result.rows[0]) throw serviceError('Account not found.', 404);
    return serializeUser(result.rows[0]);
  } catch (error) {
    if (error && error.code === '23505') throw serviceError('That email address is already in use.', 409);
    throw error;
  }
}

async function deleteUser(userId) {
  await db.query('DELETE FROM users WHERE id = $1', [userId]);
}

async function exportUserData(userId) {
  const [account, budgets, categories, transactions, goals, scenarios] = await Promise.all([
    db.query('SELECT id, email, locale, currency, created_at FROM users WHERE id = $1', [userId]),
    db.query('SELECT id, month, income, created_at FROM budgets WHERE user_id = $1 ORDER BY month', [userId]),
    db.query(
      `SELECT id, budget_id, name, planned_amount
       FROM budget_categories WHERE user_id = $1 ORDER BY budget_id, name`,
      [userId]
    ),
    db.query(
      `SELECT id, budget_id, category_id, description, amount, kind, transaction_date
       FROM transactions WHERE user_id = $1 ORDER BY transaction_date`,
      [userId]
    ),
    db.query(
      `SELECT id, name, target_amount, current_saved, target_date, monthly_contribution
       FROM savings_goals WHERE user_id = $1 ORDER BY created_at`,
      [userId]
    ),
    db.query(
      'SELECT id, name, description, assumptions, created_at FROM scenarios WHERE user_id = $1 ORDER BY created_at',
      [userId]
    ),
  ]);
  return {
    account: account.rows[0],
    budgets: budgets.rows,
    categories: categories.rows,
    transactions: transactions.rows,
    goals: goals.rows,
    scenarios: scenarios.rows,
  };
}

function serializeUser(user) {
  return {
    id: String(user.id),
    email: user.email,
    locale: user.locale || 'en-US',
    currency: user.currency || 'USD',
    privacyPreferences: user.privacy_preferences || { analytics: false, marketing: false },
  };
}

module.exports = {
  register,
  login,
  logout,
  getSessionUser,
  getAccount,
  updateAccount,
  deleteUser,
  exportUserData,
  validateCredentials,
};
