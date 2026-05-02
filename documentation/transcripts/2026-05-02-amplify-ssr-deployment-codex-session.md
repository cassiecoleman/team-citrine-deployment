# Codex Session Transcript

Date: 2026-05-02  
Branch: `feature/p6-amplify-ssr-deployment`

This transcript captures the user-facing conversation that produced the
Amplify SSR deployment planning, implementation slices, and deployment
documentation for Ultra.

## Transcript

### User

We need to deploy this application to AWS as per the instructions below. Please analyze the changes that need to be made and write a plan for this implementation.

### Assistant

Explored the repo and wrote an AWS deployment plan centered on a strict split
between an Amplify-hosted frontend and a Lambda/API Gateway backend.

### User

I want to learn more about the option you presented above to "take advantage of Amplify's Next.js SSR support"

### Assistant

Checked official AWS docs and explained the tradeoffs of keeping Ultra as a
single Next.js app on Amplify SSR versus splitting the backend out. Noted that
this would preserve server actions, middleware, and same-origin route handlers,
but depended on Amplify runtime compatibility.

### User

I realized the instructions I pasted earlier are not relevant here. I want you to write a plan for Amplify SSR + minimal refactoring, assuming SSR will support our version of Next.js even though it's not explicitly supported.

### Assistant

Produced a new implementation plan focused on Amplify SSR with minimal
refactoring. The plan kept the current Next.js app structure intact, emphasized
deployment-safe environment handling, preview validation, and hosted smoke
testing, and avoided a backend split.

### User

I have gotten more information on Amplify's Next.js v16 support. The current amplify-js repo supports up to 16.2.3. It seems to work well in most cases, however, with caveats around streaming, ISR, and Image Optimization. Do you see any of these features in our project?

### Assistant

Searched the codebase and confirmed that the current project does not appear to
use SSR streaming, ISR, or `next/image`, reducing the practical Amplify SSR
risk for this branch of work.

### User

OK. I want to create a Github issue for the plan that you outlined above. Then make a new branch for the project and begin refactoring accordingly.

### Assistant

Drafted a GitHub issue plan and, after execution mode resumed, created:

- local branch `feature/p6-amplify-ssr-deployment`
- GitHub issue `#91`

Then began implementation in small TDD slices.

### User

PLEASE IMPLEMENT THIS PLAN

### Assistant

Implemented the first deployment-readiness slices:

1. Added `src/lib/app-env.ts` plus tests for:
   - hosted app origin resolution
   - preview vs production detection
   - explicit local-only bypass gating
2. Updated auth password reset redirects to use the shared app origin helper.
3. Tightened the admin live-map route so the dev bypass only works when
   `ULTRA_ENABLE_ADMIN_LIVE_MAP_DEV_BYPASS=true` in local development.
4. Added `src/lib/playwright-env.ts` plus Playwright config support for
   `PLAYWRIGHT_BASE_URL`, allowing hosted smoke tests against Amplify previews.
5. Added deployment docs and repo-root `amplify.yml`.

Committed those changes as:

- `feat(deployment): add tested Amplify env resolution helpers`
- `feat(auth): centralize hosted password reset redirect origin`
- `fix(admin): require explicit local bypass for live map route`
- `docs(deployment): add Amplify SSR build and setup guidance`

### User

I ran all tests and verified that they worked. Can you write me a guide on how to deploy this project?

### Assistant

Expanded the deployment documentation into a practical Amplify SSR guide,
covering:

- required environment variables
- connecting the repo to Amplify
- using the committed `amplify.yml`
- preview deployment flow
- hosted smoke testing with `PLAYWRIGHT_BASE_URL`
- production promotion
- rollback guidance

The guide lives in:

- `documentation/amplify-ssr-deployment.md`

### User

OK, create a transcript of this conversation so far and commit it.

### Assistant

Prepared to save a transcript into `documentation/transcripts/`, then noticed
there was already an uncommitted deployment doc change in the branch.

### User

You can commit the other document as well

### Assistant

Prepared a combined commit containing:

- this transcript
- the updated Amplify SSR deployment guide

## Artifacts Produced in This Session

- GitHub issue: `#91`  
  <https://github.com/ai4sd-s26-memphis/team-citrine/issues/91>
- Deployment guide: [documentation/amplify-ssr-deployment.md](/home/ccoleman/projects/team-citrine/documentation/amplify-ssr-deployment.md)
- Transcript: this file
