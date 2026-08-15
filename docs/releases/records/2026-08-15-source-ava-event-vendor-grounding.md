# 2026-08-15-source-ava-event-vendor-grounding — Source aVa Event Vendor Grounding

## Release ID

`2026-08-15-source-ava-event-vendor-grounding`

## Status

`candidate`

## Plain-English Summary

Hardens Source aVa answers about unsupported vendor claims so they stay scoped to the vendors visible
on the active sourcing event, even after the event has moved beyond the Responses stage. The route now
honors the request stage when the UI does not send a nested view-stage field, and unsupported-claim
vendor-comparison answers use the event-visible response profiles instead of broader ambient vendor
context.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 / Source product: changes Source aVa prompt grounding and regression coverage only.
- No tenant data, canonical facts, adapters, calculations, workflow state, or persisted artifacts are
  changed.

## Client Applicability

- All clients: yes, for Source event aVa questions about vendor-response support and unsupported
  claims.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/api/chat/agent/route.ts`
- `src/app/api/chat/agent/__tests__/source-ava-polish-gate.test.ts`
- `src/lib/source/ava/__tests__/mode-grounding-phase-b.test.ts`

## QA / Validation

- PASS: `npx jest --runTestsByPath src/app/api/chat/agent/__tests__/source-ava-polish-gate.test.ts src/lib/source/ava/__tests__/mode-grounding-phase-b.test.ts --runInBand`
  (35/35 tests passed).
- PASS: `npx jest --runTestsByPath src/lib/source/ava/__tests__/mode-grounding-phase-b.test.ts src/lib/source/ava/__tests__/vendor-coverage-governed-answer.test.ts src/lib/source/ava/__tests__/mode-grounding.test.ts src/components/source/__tests__/SourcingReactivePanel.test.tsx src/lib/source/vendor-proposals/__tests__/extract-vendor-proposal-facts.test.ts 'src/app/api/v1/source/[eventId]/vendor-proposals/[vendorKey]/ingest/__tests__/route.test.ts' src/lib/source/proposal-intelligence/__tests__/proposal-intelligence.test.ts src/app/api/chat/agent/__tests__/source-ava-polish-gate.test.ts --runInBand`
  (121/121 tests passed).
- Required after deploy: signed-in Source aVa proof on a later-stage event asking which vendor claims
  are unsupported by evidence. The answer must name only the event-visible response vendors or decline
  if that substrate is absent.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps deploy workflow rolls the application code
forward. No database migration, data load, feature flag, or manual runtime action is required.

## Deployment Authority

- Repo-owned deploy workflow: required for runtime rollout.
- Shared runtime mutators: none.
- Approved image digest: captured by the ACA main deploy workflow after merge.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: required before claiming live product proof.

## Rollback Plan

Revert the PR to restore the prior stage-scoped route behavior.

## Audit Evidence

PR, targeted Jest output, broader Source aVa/proposal regression output, lint/typecheck output,
release-control output, ACA deploy run, and signed-in Source event aVa proof after deployment.

## Known Gaps

Browser-rendered chart widgets are not affected or proven by this release.
