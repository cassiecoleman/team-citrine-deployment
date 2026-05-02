# Amplify SSR Deployment Guide

This guide explains how to deploy Ultra as a single Next.js SSR application on
AWS Amplify Hosting.

Ultra is deployed as:

- one Next.js app from `ultra-web/`
- SSR enabled through Amplify Hosting
- Supabase for auth, database, and realtime
- Stripe for payment flows

## Before you start

Make sure these are already true:

- the repo is pushed to GitHub
- the branch you want to deploy exists remotely
- `npm test` passes locally
- `npm run build` passes locally from `ultra-web/`
- you have the Supabase and Stripe keys for the target environment

Important repo files:

- [amplify.yml](/home/ccoleman/projects/team-citrine/amplify.yml)
- [SETUP.md](/home/ccoleman/projects/team-citrine/ultra-web/SETUP.md)
- [.env.local.example](/home/ccoleman/projects/team-citrine/ultra-web/.env.local.example)

## 1. Prepare environment values

You will need these environment variables in Amplify:

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_APP_URL` | Yes | Set this to the deployed app URL for the branch or production domain |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Required by current server-side actions and route handlers |
| `STRIPE_SECRET_KEY` | Yes | Stripe test or live secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Usually | Needed if Stripe webhook flows are in scope |
| `AMPLIFY_PRODUCTION_BRANCH` | Yes | Usually `main` |
| `AMPLIFY_APP_ORIGIN` | Optional | Only use if you want an explicit hosted-origin override |
| `ULTRA_ENABLE_ADMIN_LIVE_MAP_DEV_BYPASS` | Optional | Leave `false` in Amplify |

Recommended values:

- preview branch: `NEXT_PUBLIC_APP_URL=https://<preview-domain>`
- production branch: `NEXT_PUBLIC_APP_URL=https://<prod-domain>`
- `AMPLIFY_PRODUCTION_BRANCH=main`
- `ULTRA_ENABLE_ADMIN_LIVE_MAP_DEV_BYPASS=false`

## 2. Connect the repo in Amplify

In AWS Amplify:

1. Open Amplify Hosting.
2. Choose to host a web app from GitHub.
3. Connect the GitHub account that can access `ai4sd-s26-memphis/team-citrine`.
4. Select the repository.
5. Select the branch you want to deploy first.

Use a preview branch first, not `main`, if you want a safer first validation.

## 3. Use the committed Amplify build spec

This repo already includes a build spec in [amplify.yml](/home/ccoleman/projects/team-citrine/amplify.yml).

It does three important things:

- treats `ultra-web/` as the app root
- installs dependencies with `npm ci`
- builds the existing Next app with `npm run build`

You should keep Amplify pointed at the repo-root `amplify.yml` instead of
recreating the build commands manually unless Amplify forces a change.

## 4. Add environment variables in Amplify

In the Amplify app settings:

1. Open the selected branch.
2. Add the required environment variables.
3. Save them before starting the deployment.

For a preview branch, use that branch’s preview URL in `NEXT_PUBLIC_APP_URL`
after the first domain is known. If you do not know the preview domain yet, you
can deploy once, note the generated URL, then update `NEXT_PUBLIC_APP_URL` and
redeploy.

## 5. Start the first preview deployment

Deploy the feature branch first, for example:

- `feature/p6-amplify-ssr-deployment`

Wait for Amplify to finish:

- dependency install
- Next build
- SSR hosting provisioning
- branch domain assignment

If the build fails, check the Amplify logs first for:

- missing env vars
- build-time TypeScript or Next errors
- unsupported runtime behavior

## 6. Verify the deployed preview manually

After the preview URL is available, validate these flows in the browser:

1. `/login` renders
2. unauthenticated navigation to a protected route redirects correctly
3. sign-in works with Supabase auth
4. a rider page renders after sign-in
5. a server-action-backed flow still works
6. a route-handler-backed flow still works

For this project, good first checks are:

- rider login
- `/book`
- `/ride/[id]` flow if seeded data exists
- admin live-map route behavior

## 7. Run smoke tests against the preview

This repo now supports Playwright against a hosted base URL.

Example:

```bash
cd ultra-web
PLAYWRIGHT_BASE_URL=https://your-preview.amplifyapp.com npm run test:e2e -- e2e/auth-pages.spec.ts
```

When `PLAYWRIGHT_BASE_URL` is set:

- Playwright targets the hosted deployment
- it does not start the local Next dev server

Good first smoke coverage:

- auth page load
- protected route redirect
- one rider flow
- one route-handler-backed flow

## 8. Update preview env if needed

If any auth or redirect flow points at localhost, update:

- `NEXT_PUBLIC_APP_URL`

Then redeploy the branch.

This matters especially for:

- password reset redirects
- any logic that builds absolute URLs from app origin

## 9. Promote to production

Once the preview branch works:

1. merge the validated branch into `main`
2. make sure the production branch in Amplify is `main`
3. confirm production env vars are correct
4. trigger the production deployment

Before considering production done, verify:

- login works on the production URL
- protected SSR routes render correctly
- middleware redirects are correct
- Stripe configuration is correct for the intended environment

## 10. Common project-specific gotchas

### App origin

`NEXT_PUBLIC_APP_URL` must match the hosted domain you expect the app to use.
If it points at localhost, hosted redirect flows will be wrong.

### Admin live map bypass

The admin live-map route no longer bypasses auth automatically in every
non-production environment.

Only local development should use:

```bash
ULTRA_ENABLE_ADMIN_LIVE_MAP_DEV_BYPASS=true
```

Do not enable that in Amplify.

### Supabase service role usage

The current codebase still relies on `SUPABASE_SERVICE_ROLE_KEY` in several
server-side paths. That means this key must be present in Amplify branch env
vars for the current deployment model to work.

### Preview vs production

Set:

```bash
AMPLIFY_PRODUCTION_BRANCH=main
```

This allows the deployment helpers to distinguish local runs from preview and
production behavior more reliably.

## 11. Rollback plan

If a deployment is broken:

1. stop using the preview or production URL immediately
2. revert the bad merge or redeploy the last known-good branch/commit
3. re-check env vars, especially `NEXT_PUBLIC_APP_URL`
4. inspect Amplify build logs and browser auth behavior
5. rerun a small hosted smoke suite before re-promoting

## 12. Recommended checklist

Use this checklist before calling the deployment good:

- `npm test` passed locally
- `npm run build` passed locally
- Amplify build succeeded
- branch env vars were added
- `NEXT_PUBLIC_APP_URL` matches the hosted URL
- login works
- middleware redirects work
- one server-action-backed flow works
- one route-handler-backed flow works
- hosted Playwright smoke test passed

## Local command reminders

```bash
cd ultra-web
npm test
npm run build
PLAYWRIGHT_BASE_URL=https://your-preview.amplifyapp.com npm run test:e2e -- e2e/auth-pages.spec.ts
```
