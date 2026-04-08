# P3 GitHub Issue Assignment Session Transcript

Date: 2026-04-08
Repository: `ai4sd-s26-memphis/team-citrine`

## Summary

This session covered:
- Reviewing backend module documentation on a feature branch for merge readiness
- Identifying documentation blockers in the PR
- Re-reviewing follow-up fixes
- Correcting remaining documentation inconsistencies directly in the repo
- Mapping GitHub issues to backend modules
- Assigning modules and issues across three developers
- Applying those GitHub issue assignments directly

## Transcript

### 1. Initial PR Review Request

User asked for a review of the feature branch using the git change history and requested a PR comment indicating whether the branch should be merged.

Review findings:
- The branch was docs-only and introduced backend module specifications plus an AI transcript.
- Two blockers were identified:
  - Several RLS policy examples used `FOR ALL` with `USING` but without `WITH CHECK`, which would make the examples unsafe as implementation-ready specs.
  - US03 identity verification had been dropped from the new Safety & Notifications module documentation even though it was still required by the user stories and architecture docs.

A denial-style PR comment was drafted for the user to post.

### 2. Re-Review After Follow-Up Changes

User said the comment had been posted and that changes were made to address the blockers, then asked for another review and an updated approval or denial comment.

Re-review findings:
- The original blockers had been addressed:
  - `WITH CHECK` had been added to affected RLS policies.
  - US03 PIN verification had been restored to the Safety & Notifications module.
- One new consistency issue remained:
  - The Safety docs now referenced `rides.pin_hash` and `rides.pin_attempts`, but those fields were still missing from the canonical `rides` schema docs and the booking API inputs.

A second denial-style PR comment was drafted explaining that the new PIN flow was only partially integrated into the rest of the specs.

### 3. Documentation Fix Applied Directly

User asked whether the documentation could be corrected directly based on that feedback.

The following documentation changes were made:
- Updated `documentation/backend-modules/00-database-schema.md`
  - Added `pin_hash`
  - Added `pin_attempts`
- Updated `documentation/backend-modules/02-ride-lifecycle.md`
  - Added `pin_hash` and `pin_attempts` to the SQL `rides` table
  - Updated `createRide(data)` to include `ride_pin?: string (required when is_child_safe_required = true)`

These changes were committed with:

```bash
git commit -m "docs: align ride PIN verification across schema and booking APIs"
```

Commit created:
- `c01c2b6` `docs: align ride PIN verification across schema and booking APIs`

### 4. GitHub Issues Mapped to Backend Modules

User asked whether the GitHub issues could be viewed and assigned to the documented backend modules.

Live issue data was pulled from GitHub using:

```bash
gh issue list --repo ai4sd-s26-memphis/team-citrine --limit 100
```

Issues were mapped to modules as follows.

#### Module 1: Auth & Identity
- `#10` Set up Supabase project and client utilities
- `#11` Design and create riders table schema
- `#16` Create admin users table and role system
- `#17` Set up Supabase Auth with email/password
- `#18` Implement role-based middleware and route protection
- `#19` Create login/register UI pages
- `#20` Set up API error handling and Zod validation patterns
- `#24` Rider profile and account management API (US10)
- `#35` Admin drivers table API with search/filter (US21, US25)
- `#36` Admin ride requests table API (US22, US25)
- `#37` Admin active rides and completed rides API (US23, US24, US25)

#### Module 2: Ride Lifecycle
- `#13` Design and create rides table schema
- `#21` Ride booking API — create, schedule, and cancel rides (US01, US02, US11, US12)
- `#22` Driver trip operations API (US18, US19, US20)
- `#23` Ride completion and rating API (US07, US17)

#### Module 3: Matching & Dispatch
- `#12` Design and create drivers table schema
- `#30` Ride matching engine — assign nearest available driver

#### Module 4: Real-Time & Location
- `#27` Set up Supabase Realtime for ride status updates (US13-US16)
- `#28` Live driver location broadcasting (US08)
- `#29` Integrate Leaflet maps with real geocoding

#### Module 5: Payments & Pricing
- `#14` Design and create payments and ride passes schema
- `#25` Ride pass subscription API (US05)
- `#26` Fare splitting API (US06)
- `#31` Stripe payment integration — authorize, capture, refund (US05, US06)

#### Module 6: Safety & Notifications
- `#15` Design and create safety and notifications schema
- `#32` SMS notifications via AWS SNS or Twilio (US09)
- `#33` Trusted drivers management API (US03)
- `#34` Live trip sharing with tokenized links (US04)
- `#38` Admin driver flag review and management

### 5. Module Ownership Split Across Three Developers

User asked for an even module assignment across:
- `cassiecoleman`
- `djaco6`
- `derron0325`

The ownership split chosen was:

#### `derron0325`
- Module 1: Auth & Identity
- Total issues: 11

#### `djaco6`
- Module 5: Payments & Pricing
- Module 6: Safety & Notifications
- Total issues: 9

#### `cassiecoleman`
- Module 2: Ride Lifecycle
- Module 3: Matching & Dispatch
- Module 4: Real-Time & Location
- Total issues: 9

### 6. Issue Assignments Applied on GitHub

User asked for the issue assignments to be applied directly.

Assignments were applied with `gh issue edit ... --add-assignee ...` commands.

Final issue ownership:

#### Assigned to `derron0325`
- `#10`
- `#11`
- `#16`
- `#17`
- `#18`
- `#19`
- `#20`
- `#24`
- `#35`
- `#36`
- `#37`

#### Assigned to `djaco6`
- `#14`
- `#15`
- `#25`
- `#26`
- `#31`
- `#32`
- `#33`
- `#34`
- `#38`

#### Assigned to `cassiecoleman`
- `#12`
- `#13`
- `#21`
- `#22`
- `#23`
- `#27`
- `#28`
- `#29`
- `#30`

## Outcome

This session resulted in:
- PR review feedback for backend module documentation
- Direct documentation fixes for the PIN-verification flow
- A committed documentation update
- A complete backend issue-to-module mapping
- A balanced developer ownership plan
- Live GitHub issue assignments applied in the repository
