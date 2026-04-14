# API Error Handling + Validation Pattern (Issue #20)

This document defines the backend pattern for server action validation and error handling.

## Goals

- Consistent input validation using Zod
- Consistent action result shape for frontend consumers
- Predictable auth and error handling in server actions

## Standard Result Type

Use this result envelope for server actions:

```ts
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }
```

## Validation + Auth Flow

For every server action:

1. Parse input with a Zod schema.
2. Return `{ success: false, error }` on validation failure.
3. Check authentication/authorization.
4. Execute business logic.
5. Return `{ success: true, data }` for success.
6. Catch unexpected exceptions and map to a safe error message.

## Recommended Helper Signature

```ts
async function validateAction<TInput, TOutput>(
  schema: z.ZodSchema<TInput>,
  input: unknown,
  handler: (validated: TInput) => Promise<TOutput>
): Promise<ActionResult<TOutput>>
```

## Suggested Shared Schemas

Place common validators in `ultra-web/src/lib/validators/`:

- coordinate schema
- ride status schema
- UUID/ID schema helpers

## Rollout

- Apply this pattern to new server actions first.
- Refactor existing actions incrementally by feature.

## Notes

This file is the initial documentation deliverable for Issue #20 and should be expanded as utilities are implemented.
