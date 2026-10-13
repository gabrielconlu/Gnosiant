const express = require('express');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const authService = require('../services/authService');
const financeService = require('../services/financeService');

const router = express.Router();
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Too many authentication attempts. Please try again shortly.' },
});
const monthSchema = z.string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must use YYYY-MM format.')
  .refine((month) => Number(month.slice(0, 4)) > 0, 'Month must use a valid year.');
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((date) => {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}, 'Date must be a valid YYYY-MM-DD date.');
const moneySchema = z.number().finite().min(0).max(999999999)
  .refine((amount) => Math.abs(Math.round(amount * 100) - amount * 100) < 1e-7, 'Amounts may have no more than two decimal places.');

const accountSchema = z.object({
  email: z.string().trim().email().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
  locale: z.string().min(2).max(12).optional(),
  currency: z.string().length(3).regex(/^[a-z]{3}$/i).optional(),
  privacyPreferences: z.object({
    marketing: z.boolean().optional(),
    analytics: z.boolean().optional(),
  }).optional(),
}).strict();

const categorySchema = z.object({
  name: z.string().trim().min(1).max(80),
  plannedAmount: moneySchema,
});
const budgetSchema = z.object({
  month: monthSchema,
  income: moneySchema,
  categories: z.array(categorySchema).max(100),
}).strict();
const transactionSchema = z.object({
  budgetId: z.string().regex(/^\d+$/),
  categoryId: z.string().regex(/^\d+$/).nullable().optional(),
  description: z.string().trim().min(1).max(160),
  amount: moneySchema.refine((amount) => amount > 0, 'Amount must be greater than zero.'),
  kind: z.enum(['income', 'expense']),
  date: dateSchema,
}).strict();
const goalCreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  targetAmount: moneySchema.refine((amount) => amount > 0),
  currentSaved: moneySchema.default(0),
  targetDate: dateSchema.nullable().optional(),
  monthlyContribution: moneySchema.nullable().optional(),
}).strict();
const goalUpdateSchema = goalCreateSchema.partial().strict();
const scenarioCreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().max(1000).optional(),
  assumptions: z.object({
    incomeDelta: z.number().finite().min(-999999999).max(999999999).optional(),
    expenseDelta: z.number().finite().min(-999999999).max(999999999).optional(),
    savingsDelta: z.number().finite().min(-999999999).max(999999999).optional(),
  }).strict().optional(),
}).strict();
const scenarioUpdateSchema = scenarioCreateSchema.partial().strict();

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function requireUser(req, res, next) {
  authService.getSessionUser(req.session)
    .then((user) => {
      if (!user) return res.status(401).json({ ok: false, message: 'Please log in to continue.' });
      req.user = user;
      return next();
    })
    .catch(next);
}

router.post('/auth/register', authLimiter, asyncRoute(async (req, res) => {
  const payload = z.object({
    email: z.string().trim().email(),
    password: z.string().min(6),
    acceptedTerms: z.literal(true),
  }).strict().parse(req.body ?? {});
  const user = await authService.register(payload);
  res.status(201).json({ ok: true, user });
}));

router.post('/auth/login', authLimiter, asyncRoute(async (req, res) => {
  const payload = z.object({ email: z.string().trim().email(), password: z.string().min(1) }).strict().parse(req.body ?? {});
  const user = await authService.login(payload, req);
  res.json({ ok: true, user });
}));

router.post('/auth/logout', asyncRoute(async (req, res) => {
  await authService.logout(req.session);
  res.clearCookie('gnosiant.sid', { path: '/' });
  res.json({ ok: true });
}));

router.get('/auth/session', requireUser, (req, res) => res.json({ ok: true, user: req.user }));

router.get('/account', requireUser, (req, res) => res.json({ ok: true, user: req.user }));

router.patch('/account', requireUser, asyncRoute(async (req, res) => {
  const payload = accountSchema.parse(req.body ?? {});
  if (payload.currentPassword && !payload.newPassword) {
    return res.status(400).json({ ok: false, message: 'Enter a new password too.' });
  }
  const user = await authService.updateAccount(req.user.id, payload);
  res.json({ ok: true, user });
}));

router.get('/account/privacy-preferences', requireUser, (req, res) => {
  res.json({ ok: true, preferences: req.user.privacyPreferences });
});

router.patch('/account/privacy-preferences', requireUser, asyncRoute(async (req, res) => {
  const preferences = z.object({
    analytics: z.boolean().optional(),
    marketing: z.boolean().optional(),
  }).strict().parse(req.body ?? {});
  const user = await authService.updateAccount(req.user.id, { privacyPreferences: preferences });
  res.json({ ok: true, preferences: user.privacyPreferences });
}));

router.get('/account/export', requireUser, asyncRoute(async (req, res) => {
  const exported = await authService.exportUserData(req.user.id);
  res.json({ ok: true, export: exported });
}));

router.delete('/account', requireUser, asyncRoute(async (req, res) => {
  await authService.deleteUser(req.user.id);
  await authService.logout(req.session);
  res.clearCookie('gnosiant.sid', { path: '/' });
  res.json({ ok: true, message: 'Account and associated financial data deleted.' });
}));

router.get('/dashboard/summary', requireUser, asyncRoute(async (req, res) => {
  const month = monthSchema.parse(req.query.month || new Date().toISOString().slice(0, 7));
  const data = await financeService.getDashboardSummary(req.user.id, month);
  res.json({ ok: true, data });
}));

router.get('/budgets', requireUser, asyncRoute(async (req, res) => {
  const month = monthSchema.parse(req.query.month || new Date().toISOString().slice(0, 7));
  res.json({ ok: true, data: await financeService.getBudget(req.user.id, month) });
}));

router.put('/budgets', requireUser, asyncRoute(async (req, res) => {
  const payload = budgetSchema.parse(req.body ?? {});
  res.json({ ok: true, data: await financeService.saveBudget(req.user.id, payload) });
}));

router.get('/transactions', requireUser, asyncRoute(async (req, res) => {
  const month = monthSchema.parse(req.query.month || new Date().toISOString().slice(0, 7));
  res.json({ ok: true, data: await financeService.listTransactions(req.user.id, month) });
}));

router.post('/transactions', requireUser, asyncRoute(async (req, res) => {
  const transaction = await financeService.createTransaction(req.user.id, transactionSchema.parse(req.body ?? {}));
  res.status(201).json({ ok: true, data: transaction });
}));

router.delete('/transactions/:id', requireUser, asyncRoute(async (req, res) => {
  const { id } = z.object({ id: z.string().regex(/^\d+$/) }).parse(req.params);
  if (!(await financeService.deleteTransaction(req.user.id, id))) {
    return res.status(404).json({ ok: false, message: 'Transaction not found.' });
  }
  return res.json({ ok: true });
}));

router.get('/goals', requireUser, asyncRoute(async (req, res) => {
  res.json({ ok: true, data: await financeService.listGoals(req.user.id) });
}));

router.post('/goals', requireUser, asyncRoute(async (req, res) => {
  const goal = await financeService.createGoal(req.user.id, goalCreateSchema.parse(req.body ?? {}));
  res.status(201).json({ ok: true, data: goal });
}));

router.patch('/goals/:id', requireUser, asyncRoute(async (req, res) => {
  const { id } = z.object({ id: z.string().regex(/^\d+$/) }).parse(req.params);
  const goal = await financeService.updateGoal(req.user.id, id, goalUpdateSchema.parse(req.body ?? {}));
  if (!goal) return res.status(404).json({ ok: false, message: 'Savings goal not found.' });
  return res.json({ ok: true, data: goal });
}));

router.delete('/goals/:id', requireUser, asyncRoute(async (req, res) => {
  const { id } = z.object({ id: z.string().regex(/^\d+$/) }).parse(req.params);
  if (!(await financeService.deleteGoal(req.user.id, id))) {
    return res.status(404).json({ ok: false, message: 'Savings goal not found.' });
  }
  return res.json({ ok: true });
}));

router.get('/scenarios', requireUser, asyncRoute(async (req, res) => {
  res.json({ ok: true, data: await financeService.listScenarios(req.user.id) });
}));

router.post('/scenarios', requireUser, asyncRoute(async (req, res) => {
  const scenario = await financeService.createScenario(req.user.id, scenarioCreateSchema.parse(req.body ?? {}));
  res.status(201).json({ ok: true, data: scenario });
}));

router.patch('/scenarios/:id', requireUser, asyncRoute(async (req, res) => {
  const { id } = z.object({ id: z.string().regex(/^\d+$/) }).parse(req.params);
  const scenario = await financeService.updateScenario(req.user.id, id, scenarioUpdateSchema.parse(req.body ?? {}));
  if (!scenario) return res.status(404).json({ ok: false, message: 'Scenario not found.' });
  return res.json({ ok: true, data: scenario });
}));

router.delete('/scenarios/:id', requireUser, asyncRoute(async (req, res) => {
  const { id } = z.object({ id: z.string().regex(/^\d+$/) }).parse(req.params);
  if (!(await financeService.deleteScenario(req.user.id, id))) {
    return res.status(404).json({ ok: false, message: 'Scenario not found.' });
  }
  return res.json({ ok: true });
}));

module.exports = router;
