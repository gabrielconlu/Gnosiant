const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const authService = require('../api/src/services/authService');
const db = require('../api/src/db');

test('register rejects invalid email', async () => {
  await assert.rejects(() => authService.register({ email: 'not-an-email', password: 'StrongPass123!' }), /valid email/i);
});

test('register rejects passwords shorter than six characters', async () => {
  await assert.rejects(() => authService.register({ email: 'example@example.com', password: 'short' }), /at least 6/i);
});

test('register accepts a six-character password at credential validation', () => {
  const credentials = authService.validateCredentials({
    email: 'new@example.com',
    password: '123456',
  });
  assert.equal(credentials.password, '123456');
});

test('credential validation normalizes email addresses', () => {
  const credentials = authService.validateCredentials({
    email: ' Login@Example.com ',
    password: 'StrongPass123!',
  });
  assert.equal(credentials.email, 'login@example.com');
});

test('login stores identity on the regenerated session', async () => {
  const password = 'StrongPass123!';
  const originalQuery = db.query;
  db.query = async () => ({
    rows: [{
      id: '42',
      email: 'login@example.com',
      password_hash: await bcrypt.hash(password, 4),
      locale: 'en-US',
      currency: 'USD',
    }],
  });

  const request = {
    session: {
      regenerate(callback) {
        request.session = {};
        callback(null);
      },
    },
  };

  try {
    await authService.login({ email: 'login@example.com', password }, request);
    assert.equal(request.session.userId, '42');
    assert.equal(request.session.email, 'login@example.com');
  } finally {
    db.query = originalQuery;
  }
});
