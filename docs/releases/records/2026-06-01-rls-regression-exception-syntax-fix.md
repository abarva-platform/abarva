# 2026-06-01-rls-regression-exception-syntax-fix — RLS Exception Syntax Fix

## Release ID

`2026-06-01-rls-regression-exception-syntax-fix`

## Status

`candidate`

## Plain-English Summary

Fixes a PL/pgSQL syntax error in the RLS regression service-role-only classification block. The previous version used a second `EXCEPTION` keyword where PL/pgSQL requires another `WHEN` branch.

## Layer Impact

- `internal-admin` lane: Updates only the SQL security regression harness and its static contract test. No product runtime, user interface, production data, or database migration changes are included.

## Client Applicability

- All clients: The production SQL tenant-isolation check applies to all production tenant data.
- Specific clients: None.
- Internal only: Security/release operators and CI evidence consumers.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `tests/security/rls-regression.sql` changes `EXCEPTION WHEN OTHERS` to `WHEN OTHERS` inside the existing exception block.
- `tests/security/rls-regression-contract.test.ts` now checks that the service-role-only exception block uses the valid PL/pgSQL shape.

## QA / Validation

- Failed proof run `26748141966` exposed the syntax error before probes executed.
- Pass: `npx jest tests/security/rls-regression-contract.test.ts --runInBand`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Pass: `git diff --check`.

## Rollout Plan

Merge to `main`, then rerun the manual production RLS regression workflow.

## Rollback Plan

Revert the PR to restore the previous syntax, though that would make the production RLS proof fail before tenant probes execute.

## Audit Evidence

- Failed proof run showing `syntax error at or near "EXCEPTION"`: `https://github.com/anandsundaram-hash/abarva/actions/runs/26748141966`
- PR: pending.
- CI run: pending.

## Known Gaps

None known.
