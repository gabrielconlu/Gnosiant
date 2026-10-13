const isProduction = process.env.NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET || '';

if (isProduction && sessionSecret.length < 32) {
  throw new Error('SESSION_SECRET must be set to at least 32 characters in production.');
}

module.exports = {
  port: Number(process.env.PORT || 3001),
  databaseUrl: process.env.DATABASE_URL || '',
  databasePoolSize: Number(process.env.DATABASE_POOL_SIZE || 10),
  sessionSecret: sessionSecret || 'local-development-only-secret-change-me',
  cookieSecure: process.env.COOKIE_SECURE === undefined ? isProduction : process.env.COOKIE_SECURE === 'true',
  trustProxy: process.env.TRUST_PROXY === 'true',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:19006,http://localhost:3000,http://127.0.0.1:19006,http://localhost:8080')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};
