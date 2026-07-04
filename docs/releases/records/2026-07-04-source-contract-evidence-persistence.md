# 2026-07-04-source-contract-evidence-persistence — Source Structured Contract Evidence Persistence

## Release ID

`2026-07-04-source-contract-evidence-persistence`

## Status

`candidate`

## Plain-English Summary

Adds the first structured Source evidence layer for existing-contract optimization and wires it into runtime Source surfaces. Source can now prescribe minimum viable evidence templates, import tenant-scoped evidence extracts, persist structured evidence rows and deterministic sourcing metrics, show evidence coverage in File Cabinet, and let aVa answer from persisted Source evidence. This is not a raw invoice or document browser: raw files stay in Source artifacts and Blob, while Source stores only decision-grade extracts needed for optimization, negotiation, renewal, and RFP fallback.

## Layer Impact

- `global-control-lane`: Adds shared Source library code for contract-evidence template packs, persistence payload generation, runtime read models, File Cabinet visibility, and Source aVa answer binding.
- `client-data-lane`: Adds non-destructive Postgres tables for contract evidence manifests, structured rows, and derived metrics with tenant RLS.

## Client Applicability

- All clients: Available as a shared Source capability once the migration is applied.
- Specific clients: None.
- Internal only: Smoke script writes proof output locally.
- Public/demo only: None.
- Feature flag: None in this slice.

## Changes Included

- Migration: `supabase/migrations/20260704193000_source_contract_evidence_persistence.sql`
- Library: `src/lib/source/contract-evidence/*`
- Runtime API: `src/app/api/v1/source/[eventId]/contract-evidence/import/route.ts`
- Runtime read path: Source File Cabinet artifacts API includes `structuredEvidence`.
- Runtime UI: `src/components/source/FileCabinetPanel.tsx` shows structured evidence coverage, metrics, and supported findings.
- aVa binding: `src/app/api/v1/source/[eventId]/nexus/ask/route.ts` and `src/lib/source/source-answer-engine.ts` bind persisted structured evidence into sourcing answers.
- Tests: `src/lib/source/contract-evidence/__tests__/*`
- Tests: `src/lib/source/__tests__/source-answer-engine.test.ts`
- Smoke script: `scripts/source/smoke-contract-evidence-persistence.mjs`

## QA / Validation

- `jest src/lib/source/contract-evidence/__tests__ src/lib/source/__tests__/source-answer-engine.test.ts --runInBand` — Pass, `61/61` tests. Existing duplicate manual mock warnings are unrelated to this change.
- `npx tsx scripts/source/smoke-contract-evidence-persistence.mjs` — Pass, writes a template/persistence proof bundle to Downloads.
- Touched-file ESLint covering contract evidence, Source aVa route, File Cabinet API/UI, import route, and Source answer engine — Pass.
- `npm run release:check` — Pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` — Pass. Default heap hit Node out-of-memory before reporting type errors.

## Rollout Plan

Merge to main, apply the migration through the approved Azure/Postgres migration path, deploy through ACA, and run signed-in Source proof against an event with a structured contract evidence pack. This candidate is additive: the import route is explicit, File Cabinet only renders the panel when evidence exists, and aVa falls back cleanly when no structured evidence is loaded.

## Deployment Authority

- Repo-owned deploy workflow: Required before claiming runtime UI/API use.
- Shared runtime mutators: Adds explicit authenticated Source contract-evidence import route.
- Approved image digest: Not applicable.
- ACA runtime invariant: No ACA mutation in this slice.
- Worker image invariant: No worker mutation in this slice.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Required before claiming end-user runtime availability.

## Rollback Plan

Library rollback is a normal git revert. Migration rollback would drop the three additive `source_contract_evidence_*` tables only after confirming no production evidence rows are needed.

## Audit Evidence

- Unit test output.
- Smoke output folder in Downloads containing `template-pack.json`, `persistence-payload.json`, and `summary.md`.
- Runtime answer-engine regression proving aVa can answer persisted contract-evidence questions with chart/table response parts.
- Migration file and release record.

## Known Gaps

Live migration apply, signed-in browser proof, and a real persisted runtime evidence pack are still required before claiming production availability. The code path is wired and locally validated, but not yet live-proven in Azure/Postgres in this branch.
