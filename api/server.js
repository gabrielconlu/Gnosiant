const path = require('node:path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const config = require('./src/config');
const db = require('./src/db');
const PostgreSQLSessionStore = require('./src/sessionStore');
const apiRoutes = require('./src/routes/v1.routes');

const app = express();

function isAllowedOrigin(origin) {
  if (config.corsOrigins.includes(origin)) return true;
  if (process.env.NODE_ENV === 'production') return false;
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/.test(origin);
}

app.disable('x-powered-by');
if (config.trustProxy) app.set('trust proxy', 1);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS policy'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '1mb' }));
app.use(session({
  name: 'gnosiant.sid',
  store: new PostgreSQLSessionStore(),
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    maxAge: 1000 * 60 * 60 * 8,
    path: '/',
  },
}));

app.get(['/api/health', '/api/v1/health'], (_req, res) => {
  res.json({ ok: true, service: 'gnosiant-api', timestamp: new Date().toISOString() });
});
app.get(['/api/ready', '/api/v1/ready'], async (_req, res, next) => {
  try {
    await db.query('SELECT 1');
    res.json({ ok: true, database: 'connected' });
  } catch (error) {
    next(error);
  }
});
app.use('/api', apiRoutes);
app.use('/api/v1', apiRoutes);

app.use((error, _req, res, _next) => {
  const status = Number.isInteger(error.status) ? error.status : error.name === 'ZodError' ? 400 : 500;
  if (status >= 500) console.error(error);
  const message = status >= 500
    ? 'An unexpected server error occurred.'
    : error.name === 'ZodError'
      ? 'The request contains invalid data.'
      : error.message;
  res.status(status).json({ ok: false, message });
});

async function start() {
  if (!db.pool) throw new Error('DATABASE_URL is required. See .env.example and run npm run db:migrate.');
  await db.query('SELECT 1 FROM schema_migrations LIMIT 1');
  const port = config.port;
  return app.listen(port, () => {
    console.log(`Gnosiant API listening on port ${port}`);
  });
}

if (require.main === module) {
  start().catch((error) => {
    console.error('Gnosiant API failed to start:', error);
    process.exitCode = 1;
  });
}

module.exports = { app, start };
