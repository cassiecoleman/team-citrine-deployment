# Security Tooling: Semgrep CE

Semgrep is a static analysis (SAST) scanner that runs on every pull request
against `main` and `staging` and on a weekly cron over `main`. It catches
the categories of bugs that AI-assisted coding (Claude Code, Codex) tends
to slip into our codebase:

- Missing input validation on server actions / API routes
- Hardcoded secrets or service-role keys
- `dangerouslySetInnerHTML` and other JSX XSS holes
- Async / `await` mistakes that swallow promise rejections
- Insecure regex, command injection sinks, prototype pollution

The workflow lives at `.github/workflows/semgrep.yml`. It runs in
Semgrep's official Docker container (no `npm install` required) and
takes 2–5 minutes per PR.

## Where findings appear

1. **Inline on the PR** — annotations on the affected lines, with a link
   to the rule that fired and a one-line "why this is risky."
2. **Repo-wide** — under the **Security → Code scanning alerts** tab on
   GitHub. The workflow uploads SARIF after every run, so even findings
   on `main` from the weekly scan show up here.
3. **(Optional) Semgrep dashboard** — if `SEMGREP_APP_TOKEN` is set as a
   repo secret, results also stream to https://semgrep.dev/ where you
   get a triage UI, suppression workflow, and trend graphs. See issue
   #86 for the signup steps. **The dashboard is optional**; the
   workflow is fully functional without it.

## How to suppress a false positive

Three options, in order of preference:

### 1. Inline `nosemgrep` comment (best for one-off cases)

```ts
// nosemgrep: typescript.react.security.audit.react-dangerouslysetinnerhtml.react-dangerouslysetinnerhtml
<div dangerouslySetInnerHTML={{ __html: trustedHtml }} />
```

Always include the rule ID after `nosemgrep:` so the suppression is
narrow. Don't bare-`nosemgrep` (it disables every rule on that line).

### 2. `.semgrepignore` (best for whole files / generated paths)

The repo's `.semgrepignore` excludes `node_modules`, `.next`,
`playwright-report`, `test-results`, AI transcripts, and the generated
Supabase types file. Add a path here only if Semgrep should never look
at it again.

### 3. Semgrep dashboard "ignore" (best when triaging on the fly)

If you have access to the dashboard (Path 2), each finding has an
**Ignore** action with reason categories (False Positive, Won't Fix,
Acceptable Risk). This is the right choice when you're triaging a long
list — it keeps the suppression context next to the finding instead of
spreading `nosemgrep` comments across files.

## How to run Semgrep locally before pushing

```bash
# One-shot scan with the same rules CI uses.
docker run --rm -v "$(pwd):/src" returntocorp/semgrep semgrep ci --config=auto

# Or point at a specific directory if you only want to scan your changes.
docker run --rm -v "$(pwd):/src" returntocorp/semgrep semgrep --config=auto ultra-web/src/features/your-feature/
```

No login required for local runs.

## What `--config=auto` means

Semgrep's `auto` config picks rule packs based on what languages are in
the repo. For Ultra today it pulls:

- `p/typescript`
- `p/react`
- `p/nextjs`
- `p/secrets`
- `p/owasp-top-ten`

If a finding looks wrong or noisy, check which pack it came from
(printed in the rule ID, e.g. `javascript.lang.security.audit...`)
before deciding whether to suppress it or fix it.

## When to expand the setup

The current workflow is "annotate, don't block." That's the right
default — Semgrep occasionally has noisy rules and we don't want to
freeze the merge queue while we triage. Consider raising the bar later
by:

- Setting the workflow as a **required status check** on `main` once the
  finding count is at zero.
- Adding a `--severity ERROR` filter to the `semgrep ci` command if we
  decide only high-severity findings should block.
- Layering in **OSV-Scanner** for dependency CVEs (separate issue).
- Adding **OWASP ZAP baseline scan** once we have a staging URL
  (separate issue).

## Troubleshooting

- **Job fails with "no rules found"** — Semgrep auto-config requires
  internet access to fetch rule packs. The runner's container should
  have egress; if it doesn't, the workflow logs will show a fetch
  error.
- **SARIF upload fails with "resource not accessible"** — the workflow
  needs `security-events: write` permissions. The current
  `permissions:` block grants this; don't remove it.
- **Dependabot PRs trigger the job and fail on read-only secret access**
  — the `if: github.actor != 'dependabot[bot]'` skip-condition handles
  this.
- **A rule keeps firing on safe code** — suppress inline with the rule
  ID, or add the file to `.semgrepignore` if it's vendored. Don't
  comment out the workflow.

## References

- Semgrep CE documentation: https://semgrep.dev/docs/
- Issue #86 (the brief that led to this setup, including the optional
  dashboard signup walkthrough).
- `MASTER_PROMPT.md` — explains why AI-assisted code in this repo
  warrants extra SAST coverage.
- `ultra-web/CLAUDE.md` — RLS rules. Semgrep doesn't audit RLS
  policies directly, but it does flag missing Zod validation and
  unauthenticated server-action paths that would amplify an RLS gap.
