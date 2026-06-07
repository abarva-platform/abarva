# 2026-06-07-strategic-moves-azure-documents-read — Strategic Moves Azure Documents Read

## Release ID

`2026-06-07-strategic-moves-azure-documents-read`

## Status

`candidate`

## Plain-English Summary

The Strategic Moves Documents / Evidence Hub panel now reads deliverable rows
through the Azure Postgres read client instead of importing the legacy
Supabase-named compatibility helper. The panel also uses the canonical phase
label lookup, including the current P5 "Mobilize & Handoff" label.

## Layer Impact

- `global-control-lane`: changes a shared authenticated Strategic Moves runtime
  surface used by all tenants with access to Move documents.
- Data access: read-only query path changes from a Supabase-named compatibility
  helper to the Azure Postgres read client. No schema, migration, write path, or
  tenant-scope rule changes.

## Client Applicability

- All clients: Yes, for authenticated Strategic Moves document/evidence views.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/strategic-moves/PhaseDocumentsPanel.tsx`
  - Replaces the legacy `getServerSupabase` import with `azureRead.query`.
  - Reads latest deliverable content using a parameterized `LEFT JOIN LATERAL`
    query against Azure Postgres.
  - Uses `getPhaseLabel()` for user-visible phase labels.
- `src/components/strategic-moves/__tests__/moves-liability-visible-controls.test.tsx`
  - Mocks the Azure read client and asserts the Documents panel uses the latest
    version SQL read.

## QA / Validation

- PASS — `npm run audit:runtime-supabase-imports:guard`
  - Result: runtime helper matches remain limited to the single allowlisted
    compatibility shim, `src/lib/supabase-server.ts`.
- PASS — `npx jest src/components/strategic-moves/__tests__/moves-liability-visible-controls.test.tsx --no-coverage`
  - Result: 1 suite / 2 tests passed.
  - Note: Jest emitted pre-existing duplicate manual mock warnings for
    `mdast-util-from-markdown`, `mdast-util-gfm`, and
    `micromark-extension-gfm`; the focused suite still passed.
- PASS — `npm run release:check`
  - Result: Release Control Gate passed; Pilot Data Loader Gate passed.

## Rollout Plan

Merge to `main`; the Azure Container Apps main runtime is already active. The
change becomes active on the next normal app redeploy for the Strategic Moves
document/evidence views; no feature flag, runtime cutover, Supabase fallback, or
migration is required.

## Rollback Plan

Revert the PR commit to restore the previous component read path. Because this
is read-only and does not change schema or persisted data, rollback is a normal
code revert and redeploy.

## Audit Evidence

- PR diff for the component and test changes.
- Local validation output listed in this record and in the PR QA section.
- Production-readiness runtime Supabase import guard after merge.

## Known Gaps

No runtime smoke was run against a live Azure Container Apps session because the
local cloud agent does not have authenticated Clerk + tenant credentials for
the protected Strategic Moves pages. The validated scope is the code path and
guardrail: the panel no longer imports the Supabase-named helper, the latest
deliverable read is parameterized through `azureRead`, and the runtime import
guard permits only the existing compatibility shim.
