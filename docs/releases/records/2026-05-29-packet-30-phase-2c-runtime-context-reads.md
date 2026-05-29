# 2026-05-29-packet-30-phase-2c-runtime-context-reads — Runtime Context Reads

## Release ID

`2026-05-29-packet-30-phase-2c-runtime-context-reads`

## Status

`candidate`

## Plain-English Summary

This release removes four direct runtime Supabase read paths and routes them
through the Packet 30 Azure read plane. The changed paths cover agent fallback
retrieval, enterprise-context chunk retrieval, evidence citation lookup, and
KPI detail/index reads.

## Layer Impact

- read-data-plane: reduces direct Supabase runtime reads in `src/lib`.
- agent-context-lane: agent fallback retrieval now uses `azureRead` for tenant
  key and enterprise-context chunk reads.
- evidence-lane: citation lookup now uses `azureRead`.
- intelligence-lane: KPI detail and index reads now use `azureRead`.
- write-data-plane: no write-path changes.
- schema/migration lane: no schema or migration changes.

## Client Applicability

- All clients: applies universally to runtime read paths.
- Specific clients: none.
- Internal only: no, these are runtime server-side reads.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/agent/retrieval.ts`
- `src/lib/enterprise-context/retrieval.ts`
- `src/lib/evidence/citations.ts`
- `src/lib/intelligence/loadKpiDetail.ts`
- `verification/packet-30-phase-2c/2c3b-runtime-context-reads-census.json`
- `verification/packet-30-phase-2c/2c3b-runtime-context-reads-parity.md`
- `verification/packet-30-phase-2c/CODEMOD_INVENTORY.json`
- `verification/packet-30-phase-2c/CODEMOD_INVENTORY.md`

## QA / Validation

- PASS: focused ESLint on the four changed runtime files.
- PASS: focused Jest, 2 suites / 8 tests.
- PASS: runtime Supabase import census in warn mode.
- PASS: `git diff --check`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.
- BLOCKED: full `npx tsc --noEmit --pretty false --skipLibCheck` remains
  blocked only by pre-existing optional dependency resolution for `@azure/*`,
  `pptxgenjs`, and `@resvg/resvg-js`.

## Rollout Plan

Merge after PR checks pass. Vercel production deploy follows the normal Git
integration. After deploy, confirm `https://app.abarva.ai/api/health` returns
HTTP 200 because this slice depends on the same `azureRead` runtime lane.

## Rollback Plan

Revert the merge commit to restore direct Supabase reads for these four files.
No database rollback is required.

## Audit Evidence

- `verification/packet-30-phase-2c/2c3b-runtime-context-reads-parity.md`
- `verification/packet-30-phase-2c/2c3b-runtime-context-reads-census.json`
- Census delta: `148/608` to `144/594` import-helper matches.

## Known Gaps

Packet 30 Phase 2C remains open. The runtime Supabase census is now
`144 files / 594 import-helper matches`; Section 3.1 acceptance still requires
all Phase 2C PRs merged, deployed, smoke green, and the ESLint allowlist count
below 30.
