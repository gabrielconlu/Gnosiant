# Gnosiant

Gnosiant is an Expo/React Native web app for personal budgeting, transaction tracking, savings goals, and what-if planning. The Express API stores account and financial data in PostgreSQL and uses PostgreSQL-backed HTTP-only sessions.

## Local development

1. Install Node.js 22 or newer and PostgreSQL 15 or newer.
2. Copy `.env.example` to `.env`, then set `DATABASE_URL` to a database you control and replace the session secret. For example, generate a secret with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
3. Install dependencies with `npm install`.
4. Apply database migrations with `npm run db:migrate`.
5. Start the API with `npm run api`.
6. In another terminal, start the Expo web app with `npm run web`.

The API listens on port 3001 by default. The Expo web app uses `EXPO_PUBLIC_API_BASE_URL` from `.env`; local defaults send requests to `http://localhost:3001/api`.

## Docker Compose

Docker Compose starts PostgreSQL, the API, and a static Expo web build behind Nginx:

```sh
copy .env.example .env
```

Edit `.env` and set unique values for `POSTGRES_PASSWORD` and `SESSION_SECRET`, then run:

```sh
docker compose up --build -d
```

Open `http://localhost:8080`. The API container waits for PostgreSQL; run `docker compose run --rm api node api/scripts/migrate.js` once before starting the API and web containers with `docker compose up --build -d`. PostgreSQL data is kept in the `gnosiant-postgres` volume. Back it up before upgrading or removing volumes. To stop without removing data, run `docker compose down`.

For a public deployment, put the web service behind a TLS-terminating reverse proxy, set `COOKIE_SECURE=true` and `TRUST_PROXY=true`, set `CORS_ORIGINS` to the exact public origin, and use a strong unique `SESSION_SECRET` and database password. The Compose web build uses the same-origin `/api` proxy. Do not expose PostgreSQL publicly. The included Compose file is a single-host deployment baseline, not a managed/high-availability production architecture.

## Persistence and data model

Run migrations with `npm run db:migrate`. The SQL migrations create:

- `users` and persistent `sessions`
- Monthly budgets and their categories
- User-owned income and expense transactions
- Savings goals and saved progress
- What-if scenarios with JSONB assumptions

All finance API operations scope queries to the authenticated user. Deleting an account cascades through its budgets, transactions, goals, and scenarios. The API refuses to start without a configured PostgreSQL database and applied migrations; there is no in-memory fallback.

## API

The same API is available under `/api` for existing clients and `/api/v1` for versioned clients. Authenticated routes use the `gnosiant.sid` HTTP-only session cookie.

- `GET /health`, `GET /ready`
- `POST /auth/register`, `POST /auth/login`, `GET /auth/session`, `POST /auth/logout`
- `GET/PATCH/DELETE /account`, `GET /account/export`
- `GET/PATCH /account/privacy-preferences`
- `GET /dashboard/summary?month=YYYY-MM`
- `GET/PUT /budgets?month=YYYY-MM`
- `GET/POST /transactions`, `DELETE /transactions/:id`
- `GET/POST /goals`, `PATCH/DELETE /goals/:id`
- `GET/POST /scenarios`, `PATCH/DELETE /scenarios/:id`

Request bodies are validated and authentication routes are rate-limited. Passwords must be at least 6 characters when creating an account. Password changes are made in account settings and require the current password.

## Verification

```sh
npm test
npm run typecheck
npm run lint
npm run web:static
```

## Legal notice

Gnosiant is an organizational and educational tool, not financial, tax, legal, or investment advice. Review the in-app terms and privacy notice before using the service.
