# Ultra Web — Developer Setup Guide

## Prerequisites

- **Node.js** 22+ and npm
- **Supabase CLI** — included via npx, no global install needed

## 1. Clone and Install

```bash
git clone git@github.com:ai4sd-s26-memphis/team-citrine.git
cd team-citrine/ultra-web
npm install
```

## 2. Environment Variables

Copy the example env file first, then make sure `.env.local` stays aligned with
the full variable list in `.env.local.example`:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with the values for every variable in `.env.local.example`.
Today that means Supabase credentials plus the Stripe test keys used by the
payment pages and Playwright payment specs:

| Variable | Where to Find |
|----------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard > Settings > API > Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard > Settings > API > `anon` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard > Settings > API > `service_role` key |
| `SUPABASE_DB_URL` | Supabase Dashboard > Settings > Database > Connection string (Session mode, port 5432) |
| `STRIPE_SECRET_KEY` | Stripe Dashboard > Developers > API keys > Secret key (test mode) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard > Developers > API keys > Publishable key (test mode) |

Ask Jacob for the actual values if you don't have dashboard access.

**Never commit `.env.local`** — it's gitignored.

## 3. Link Supabase CLI

You need a Supabase access token. Generate one at:
https://supabase.com/dashboard/account/tokens

Then link:

```bash
SUPABASE_ACCESS_TOKEN=your-token npx supabase link --project-ref mcxgvblnfuedzlojspba --password YOUR_DB_PASSWORD
```

## 4. Run Database Migrations

Push any pending migrations to the remote Supabase database:

```bash
SUPABASE_ACCESS_TOKEN=your-token npx supabase db push --password YOUR_DB_PASSWORD
```

## 5. Generate TypeScript Types

After any schema change, regenerate the typed `Database` interface:

```bash
npm run db:types
```

This overwrites `src/types/supabase.ts` with types matching the current remote schema. Always commit the regenerated file.

## 6. Start Development

```bash
npm run dev        # Start Next.js dev server at http://localhost:3000
```

## 7. Run Tests

```bash
npm test           # Run all Vitest unit tests (includes DB schema tests)
npm run test:watch # Watch mode
npm run test:e2e   # Run Playwright E2E tests
npm run test:e2e:ui # E2E with browser UI
```

The schema tests hit the real Supabase database, so you need valid `.env.local` credentials.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:e2e` | E2E tests (Playwright) |
| `npm run db:types` | Regenerate TypeScript types from Supabase schema |
| `npm run db:push` | Push local migrations to remote Supabase |
| `npm run db:migration:new` | Create a new migration file |

## Creating a New Migration

```bash
npm run db:migration:new -- my_migration_name
# Edit the generated file in supabase/migrations/
# Then push:
npm run db:push
# Then regenerate types:
npm run db:types
```

## Project Structure (Backend)

```
ultra-web/
├── .env.local                    # Supabase credentials (gitignored)
├── .env.local.example            # Template for env vars
├── supabase/
│   ├── config.toml               # Supabase CLI config
│   └── migrations/               # SQL migration files
│       ├── ..._create_riders_schema.sql
│       ├── ..._create_drivers_schema.sql
│       └── ..._create_rides_schema.sql
├── src/
│   ├── lib/
│   │   ├── supabase.ts           # Browser client (anon key)
│   │   └── supabase-server.ts    # Server client (service role key)
│   └── types/
│       └── supabase.ts           # Auto-generated DB types
```
