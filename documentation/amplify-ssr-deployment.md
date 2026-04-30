# Amplify SSR Deployment

Ultra is prepared to deploy as a single Next.js SSR app on AWS Amplify Hosting
with minimal architectural refactoring.

## What changed

- `amplify.yml` defines the Amplify build for the `ultra-web/`
  subdirectory.
- `src/lib/app-env.ts` centralizes hosted origin and preview/local detection.
- Password reset redirects now use the shared app-origin helper instead of a
  hard-coded localhost fallback.
- The admin live-map route no longer enables its service-role demo bypass for
  every non-production run. It now requires
  `ULTRA_ENABLE_ADMIN_LIVE_MAP_DEV_BYPASS=true` and only works in local
  development mode.
- Playwright can target a deployed Amplify URL by setting
  `PLAYWRIGHT_BASE_URL`, which skips launching the local Next dev server.

## Required Amplify environment variables

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `AMPLIFY_PRODUCTION_BRANCH`

Optional:

- `AMPLIFY_APP_ORIGIN`
- `ULTRA_ENABLE_ADMIN_LIVE_MAP_DEV_BYPASS=false`

## Recommended rollout

1. Connect Amplify to `ai4sd-s26-memphis/team-citrine`.
2. Ensure Amplify uses the repo-root `amplify.yml`.
3. Add the required environment variables in the Amplify console.
4. Create a preview deployment from `feature/p6-amplify-ssr-deployment`.
5. Run smoke tests against the preview URL with `PLAYWRIGHT_BASE_URL`.
6. Promote only after verifying auth, server actions, and route handlers.
