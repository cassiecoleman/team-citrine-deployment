# P2 Prompts — Team Citrine

## Part 1: Implement the Frontend

### Cassie: Use Plan mode with Claude Haiku 4.5 to create a development plan for frontend functionality.

See P2-part1-frontend-development-planning-session-transcript.md
## Part 2: Admin Wireframes

- Update frontend routes to include an admin section under `(admin)` for drivers, requests, rides, and completed rides.
- Implement shared admin UI components: `AdminPageShell`, `AdminFilterBar`, `AdminDataTable`.
- Add admin data actions with async stubs: `fetchDrivers`, `fetchRequests`, `fetchRides`, `fetchCompletedRides`.
- Validate via unit test `ultra-web/src/features/admin-dashboard/__tests__/matching.*` and e2e tests `ultra-web/e2e/admin.spec.ts`.
