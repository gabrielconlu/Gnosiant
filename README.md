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

Docker Compose starts PostgreSQL, the API, and a static Expo web build behind Nginx. On Windows, Docker Desktop needs WSL 2 and the Windows **Virtual Machine Platform** feature. If its installer reports that this feature is missing, either rerun the installer and choose **All-users installation**, or open PowerShell as Administrator and run `wsl --install`; restart Windows when prompted, then open Docker Desktop again. If Windows still reports that virtualization is unavailable, enable Intel VT-x or AMD SVM in the computer's UEFI/BIOS settings. Docker Desktop cannot start until virtualization is enabled.

To create the Compose environment file:

```powershell
Copy-Item .env.example .env
```

Edit `.env` and set unique values for `POSTGRES_PASSWORD` and `SESSION_SECRET`, then build and initialize the local database:

```sh
docker compose build
docker compose up -d db
docker compose run --rm api node api/scripts/migrate.js
docker compose up -d api web
```

Open `http://localhost:8080`. The web container serves the Expo web export, and Nginx forwards `/api` requests to the API on the same origin. PostgreSQL data is kept in the `gnosiant-postgres` volume. Back it up before upgrading or removing volumes. To stop without removing data, run `docker compose down`.

For a public deployment, put the web service behind a TLS-terminating reverse proxy, set `COOKIE_SECURE=true` and `TRUST_PROXY=true`, set `CORS_ORIGINS` to the exact public origin, and use a strong unique `SESSION_SECRET` and database password. The Compose web build uses the same-origin `/api` proxy. Do not expose PostgreSQL publicly. The included Compose file is a single-host deployment baseline, not a managed/high-availability production architecture.

## Deploy the website and mobile app together

The website and native Android/iOS apps use the same Expo screens and API. Deploy the web export to Vercel, the API as a Render Docker web service, and use Neon PostgreSQL for the shared database. Docker Desktop is only needed to run the Compose stack locally; Vercel and Render build and run the deployed services for you.

### 1. Deploy the API on Render

Create a **Web Service** from the repository and select **Docker** as the runtime. Leave the root directory empty and set the Dockerfile path to `Dockerfile.api`. Configure the health check path as `/api/health`.

Add these environment variables in the Render service's **Environment** page:

| Key | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | The pooled connection string copied from the Neon Console's **Connect** dialog |
| `SESSION_SECRET` | A new, private random value of at least 32 characters |
| `COOKIE_SECURE` | `true` |
| `TRUST_PROXY` | `true` |
| `CORS_ORIGINS` | `https://gnosiant.vercel.app` and any custom website origins, comma-separated |

Use the actual Vercel domain if it differs from `gnosiant.vercel.app`. Origins must include the scheme, have no trailing slash or path, and must not contain wildcards. Keep `DATABASE_URL` and `SESSION_SECRET` only in Render's environment settings; do not commit them or put them in Vercel.

Before the first API start, apply the migrations to Neon once. From PowerShell in the repository, set `DATABASE_URL` temporarily to the same Neon connection string stored in Render and run:

```powershell
$env:DATABASE_URL = "paste-the-Neon-connection-string-here"
npm run db:migrate
Remove-Item Env:DATABASE_URL
```

Do not paste the connection string into chat or commit it. Once Render finishes deploying, verify `https://<your-render-service>.onrender.com/api/ready` reports `"database":"connected"`.

### 2. Deploy the website on Vercel

Import the same GitHub repository as a Vercel project. Use the **Other** framework preset, set the build command to `npm run web:static`, and set the output directory to `dist`. In **Environment Variables**, set `EXPO_PUBLIC_API_BASE_URL` to `/api` for the Production environment, then deploy.

The included `vercel.json` rewrites API calls to `https://gnosiant-api.onrender.com` and sends browser routes to the exported app. Name the Render service `gnosiant-api` so its default public URL matches. If Render assigned a different hostname, update the API rewrite destination in `vercel.json` to `https://<your-render-service>.onrender.com/api/:path*` and redeploy the Vercel site.

The `/api` proxy keeps browser authentication cookies on the website's own origin, avoiding cross-site cookie restrictions. Add the production Vercel domain (and any custom domain) to Render's `CORS_ORIGINS`.

### 3. Build the native app against the same API

For Android/iOS builds, configure the EAS build environment variable `EXPO_PUBLIC_API_BASE_URL` to `https://<your-render-service>.onrender.com/api` (not `/api`). Build the native app with EAS after setting that variable. The Vercel website uses `/api`; native apps call Render directly. Both therefore use the same API and Neon database. Users can sign into either client with the same account.

If the Vercel link downloads a file instead of showing the website, check that the Vercel project is deploying the repository source (not an APK/IPA or a downloaded artifact), and that its output directory is `dist`. After adding `vercel.json` and the environment variable above, trigger a fresh Vercel deployment.

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
