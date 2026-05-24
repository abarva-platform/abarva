# 2026-05-24-p20-board-pack-generator — Board Pack Generator v1

## Release ID

`2026-05-24-p20-board-pack-generator`

## Status

`candidate`

## Plain-English Summary

Adds the Packet 20 foundation for generated board packs and pilot evidence packages: generated artifact persistence, a shared render engine, consistency guard, trigger mapping, and the first admin pilot-package surface.

## Layer Impact

- `evidence-ledger-lane`: generated artifacts must carry `evidence_ledger_ids`.
- `ai-egress-lane`: Gamma render attempts flow through `callModel(...)` and policy refusal is normal control flow.
- `artifact-lane`: internal fallback renderer produces evidence-locked HTML when Gamma is refused.

## Client Applicability

- Specific clients: all tenants.
- Internal only: admin pilot-package surface is internal.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Adds `generated_artifacts` schema with tenant RLS, evidence id array, egress-audit reference, quality score, blob hash, and quarantine reason.
- Adds shared `renderBoardPack(...)` engine for Move, Source, Watchlist, Dossier, and Pilot package artifact types.
- Adds consistency guard for number preservation, evidence id presence, and kernel-verdict language safety.
- Adds deterministic trigger helpers for Move insert, Source confirmation, and Watchlist high-kill-fitness events.
- Adds `/admin/pilot-package` placeholder surface so the CTA has a product home before queue/API wiring.

## QA / Validation

- PASS: `npm run smoke:p20-board-pack-generator`
- Pending before merge: targeted ESLint, TypeScript, build, release gate.

## Rollout Plan

Merge after CI is green. Apply `npm run db:migrate` before relying on persisted generated artifact rows.

## Rollback Plan

Revert the PR. The migration is additive; no existing product rows are modified.

## Audit Evidence

- `smoke:p20-board-pack-generator` asserts generated artifact schema, RLS, evidence id persistence, and egress-audit linkage.
- Smoke covers Apex Gamma-with-internal-fallback behavior under the current Layer 1 policy: confidential Gamma is refused and internal fallback publishes.
- Smoke covers Meridian Gamma refusal (`allowGamma=false`) with structured denial rather than silent artifact success.
- Consistency guard catches altered dollar values and missing evidence ids before publish.

## Known Gaps

- Queue orchestration is represented by deterministic trigger events; Azure Service Bus worker wiring is still a follow-up.
- The UI CTA is intentionally disabled until the migration and API route are deployed.
- Gamma remains blocked for confidential data by the Layer 1 egress policy until Layer 2 redaction exists.
