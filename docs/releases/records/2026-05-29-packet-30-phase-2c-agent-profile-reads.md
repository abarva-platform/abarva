# 2026-05-29-packet-30-phase-2c-agent-profile-reads — Agent/Profile Reads

## Release ID

`2026-05-29-packet-30-phase-2c-agent-profile-reads`

## Status

`candidate`

## Plain-English Summary

This release removes four small direct Supabase read helpers from agent/profile
runtime paths and routes them through `azureRead`. It covers Maestro context,
topic intelligence context, the `lookup_person` program tool, and AI egress
tenant policy lookup.

## Layer Impact

- read-data-plane: reduces direct Supabase runtime reads in `src/lib`.
- agent-lane: prompt context helpers and person lookup use `azureRead`.
- ai-egress-control-lane: tenant AI policy lookup uses `azureRead`; provider
  calls and egress policy semantics do not change.
- write-data-plane: no write-path changes.
- schema/migration lane: no schema or migration changes.

## Client Applicability

- All clients: applies universally to runtime read helpers.
- Specific clients: none.
- Internal only: no, these are runtime server-side helpers.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/agent/prompts/_shared/maestro-context.ts`
- `src/lib/agent/prompts/_shared/topic-intelligence.ts`
- `src/lib/agent/tools/program/lookupPerson.ts`
- `src/lib/integrations/ai-egress/tenant-policy.ts`
- `verification/packet-30-phase-2c/2c3c-agent-profile-reads-census.json`
- `verification/packet-30-phase-2c/2c3c-agent-profile-reads-parity.md`
- `verification/packet-30-phase-2c/CODEMOD_INVENTORY.json`
- `verification/packet-30-phase-2c/CODEMOD_INVENTORY.md`

## QA / Validation

- PASS: focused ESLint on the four changed runtime files.
- PASS: focused Jest, 1 suite / 24 tests.
- PASS: runtime Supabase import census in warn mode.
- PASS: `git diff --check`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.
- BLOCKED: full `npx tsc --noEmit --pretty false --skipLibCheck` remains
  blocked only by pre-existing optional dependency resolution for `@azure/*`,
  `pptxgenjs`, and `@resvg/resvg-js`.

## Rollout Plan

Merge after PR checks pass. Vercel production deploy follows the normal Git
integration. After deploy, confirm `https://app.abarva.ai/api/health` returns
HTTP 200.

## Rollback Plan

Revert the merge commit to restore direct Supabase reads for these four files.
No database rollback is required.

## Audit Evidence

- `verification/packet-30-phase-2c/2c3c-agent-profile-reads-parity.md`
- `verification/packet-30-phase-2c/2c3c-agent-profile-reads-census.json`
- Census delta: `144/594` to `140/582` import-helper matches.

## Known Gaps

Packet 30 Phase 2C remains open. The runtime Supabase census is now
`140 files / 582 import-helper matches`; Section 3.1 acceptance still requires
all Phase 2C PRs merged, deployed, smoke green, and the ESLint allowlist count
below 30.
