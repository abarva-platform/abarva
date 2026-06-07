# 2026-06-07-runtime-supabase-log-redaction — Legacy Supabase runtime log redaction

## Release ID

`2026-06-07-runtime-supabase-log-redaction`

## Status

`candidate`

## Plain-English Summary

Prevents runtime and operator-script errors from printing legacy Supabase
hostnames when a database connection failure bubbles into logs. The corpus data
path and the Supabase-to-Azure drain script now redact `supabase.co` and
`pooler.supabase.com` references before errors are surfaced.

## Layer Impact

- Lane: `global-control-lane`.
- Runtime observability: adds a shared log-redaction helper for legacy database
  hostnames.
- Corpus/data-plane utility paths: sanitizes connection/fatal error output
  without changing database routing, schema, or query behavior.

## Client Applicability

- All clients: the log-redaction behavior is global anywhere these runtime
  helpers/scripts are used.
- Specific clients: none.
- Internal only: the drain script is operator-only.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/observability/runtime-log-redaction.ts`: shared helper that redacts
  legacy Supabase URLs and hostnames from log-safe text.
- `src/lib/corpus/db.ts`: corpus pool connection errors are rethrown with
  sanitized messages.
- `scripts/data-plane/drain-supabase-to-azure.ts`: fatal error logging prints
  sanitized error text instead of a raw error object.
- Tests:
  `src/lib/observability/__tests__/runtime-log-redaction.test.ts` and
  `src/lib/corpus/__tests__/db.test.ts`.

## QA / Validation

- PASS:
  `npx jest src/lib/observability/__tests__/runtime-log-redaction.test.ts src/lib/corpus/__tests__/db.test.ts --runInBand`
  (2 suites, 9 tests passed; Jest emitted pre-existing duplicate manual mock
  warnings).
- PASS:
  `npx eslint "src/lib/observability/runtime-log-redaction.ts" "src/lib/observability/__tests__/runtime-log-redaction.test.ts" "src/lib/corpus/db.ts" "src/lib/corpus/__tests__/db.test.ts" "scripts/data-plane/drain-supabase-to-azure.ts"`.
- PASS:
  `npm run release:check -- --base origin/main --head HEAD` passed after this
  record was updated with explicit validation status language. Initial run
  failed because the record used planned validation language instead of
  pass/fail status language.

## Rollout Plan

Merge via PR and deploy the app/control-lane normally. No migration, seed, data
load, or feature flag is required. Operator scripts pick up the sanitizer when
run from the updated branch/image.

## Rollback Plan

Revert this PR. Rollback only removes redaction behavior; no schema or persisted
data changes are involved.

## Audit Evidence

- PR diff and commit for the sanitizer, corpus error handling, drain script
  logging, and regression tests.
- Local Jest, ESLint, and release-check output captured on the branch.

## Known Gaps

Live Azure Container Apps log inspection is environment-dependent and should be
captured during deployment smoke. This change provides code-level protection for
the identified runtime/operator paths.
