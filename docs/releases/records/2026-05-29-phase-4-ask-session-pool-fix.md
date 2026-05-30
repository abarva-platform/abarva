# 2026-05-29-phase-4-ask-session-pool-fix — Ask Session-Mode Pool Stabilization

## Release ID

`2026-05-29-phase-4-ask-session-pool-fix`

## Status

`candidate`

## Plain-English Summary

This change reduces how many Postgres session-mode clients one Intelligence Ask request can consume. The Ask retrieval path now runs its DB-backed source retrieval steps in sequence, and the remaining direct corpus and Sentinel reasoning `pg` pools use the same small serverless-safe pool limit as the rest of the runtime data plane.

## Layer Impact

- `global-control-lane`: Changes shared Intelligence Ask runtime retrieval behavior and shared DB client lifecycle for corpus/Sentinel reads.
- `client-data-lane`: Reads the same tenant data as before, but with less concurrent pressure on the session-mode database pool.

## Client Applicability

- All clients: Intelligence Ask requests for all tenants use the safer retrieval/client lifecycle.
- Specific clients: SkyHarbor is the verifier tenant that exposed the failure.
- Internal only: Not limited to internal users; this is runtime Ask behavior.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/intelligence/ask/index.ts`: Removes top-level parallel retrieval fan-out.
- `src/lib/intelligence/ask/router.ts`: Runs general synthesis retrievers sequentially.
- `src/lib/corpus/db.ts`: Caps the corpus Postgres pool and enables short idle cleanup.
- `src/lib/agents/sentinel-reasoning/db.ts`: Caps the Sentinel reasoning Postgres pool and enables short idle cleanup.

## QA / Validation

- Pass: `npx jest src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts src/lib/intelligence/ask/retrievers/pattern.test.ts src/lib/intelligence/ask/retrievers/knowledge.test.ts src/lib/intelligence/ask/retrievers/vendor.test.ts --runInBand`
- Pass: `npx jest src/lib/__tests__/supabase-server.test.ts src/lib/data-plane/read-adapters/__tests__/azure-session.test.ts --runInBand`
- Pass: `npx eslint src/lib/agents/sentinel-reasoning/db.ts src/lib/corpus/db.ts src/lib/intelligence/ask/index.ts src/lib/intelligence/ask/router.ts`
- Pass: `git diff --check`
- Pass: `npm run release:check`
- Not run: live Phase 4 SkyHarbor smoke from this branch.

## Rollout Plan

Merge to `main` and deploy through the normal Vercel/Azure runtime release path. No migration, seed, RLS, or destructive data operation is required.

## Rollback Plan

Revert this PR to restore the previous parallel retrieval and pool defaults. No database rollback is required.

## Audit Evidence

PR URL, local validation output, CI checks, and any follow-up live Phase 4 verifier smoke should be attached to the release thread.

## Known Gaps

Live smoke has not been run from this branch yet.
