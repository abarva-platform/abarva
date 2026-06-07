# 2026-06-07-no-supabase-runtime-proof — No-Supabase Runtime Proof

## Release ID

`2026-06-07-no-supabase-runtime-proof`

## Status

`candidate`

## Plain-English Summary

This release adds one CI-ready proof command that verifies runtime code does not
use Supabase directly. It keeps the existing import allowlist, proves production
dependencies do not include Supabase packages, checks runtime source for direct
Supabase SDK/env/host usage, confirms the one compatibility shim delegates to
Postgres, and confirms the production boot guard is wired through Next
instrumentation.

## Layer Impact

- `global-control-lane`: Adds a CI guardrail and npm audit command. There is no
  application behavior change.
- `client-data-lane`: Adds regression evidence that runtime client data access
  cannot silently reintroduce Supabase SDK/env usage.
- `internal-admin`: Gives operators and auditors a single command to cite when
  reviewing the Supabase sunset evidence pack.

## Client Applicability

- All clients: Yes, because the guard covers shared runtime source paths.
- Specific clients: None.
- Internal only: Yes, this is an engineering/CI proof command.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `scripts/audit/no-supabase-runtime-proof.mjs`.
- Adds `npm run audit:no-supabase-runtime-proof`.
- Updates `.github/workflows/production-readiness-gate.yml` to run the composite
  proof instead of the narrower import-only guard.
- Adds this release record.

## QA / Validation

- Pass: `npm run audit:no-supabase-runtime-proof`
- Pass: `node --check scripts/audit/no-supabase-runtime-proof.mjs`
- Pass: `npx eslint scripts/audit/no-supabase-runtime-proof.mjs`
- Pass: `npm run audit:runtime-supabase-imports:guard`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Pass: `git diff --check`
- Environment note: local validation required `npm ci` because `node_modules`
  was absent. `npm ci` completed with a pre-existing Node engine warning for
  `lint-staged` under Node 22 and existing npm audit findings; no dependency
  files were changed.

## Rollout Plan

Merge to `main`. The proof runs in the production-readiness workflow on future
PRs. No runtime deploy, database migration, or feature flag is required beyond
normal repository CI execution.

## Rollback Plan

Revert this PR to restore the previous production-readiness gate step that ran
only `npm run audit:runtime-supabase-imports:guard`. No data rollback is
required.

## Audit Evidence

- PR containing this release record.
- Production Readiness Gate output after merge or PR synchronization.
- Local proof output from `npm run audit:no-supabase-runtime-proof`.

## Known Gaps

- This is a static runtime proof plus boot-guard wiring check. It does not
  replace Azure runtime soak, final Supabase backup/restore evidence, pause QA,
  or deletion approval from the Supabase sunset proof pack.
