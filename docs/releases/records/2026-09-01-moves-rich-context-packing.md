# 2026-09-01-moves-rich-context-packing - Moves Rich-Context Packing

## Release ID

`2026-09-01-moves-rich-context-packing`

## Status

`candidate`

## Plain-English Summary

Deliverable generation now retrieves evidence from the artifact's own section, exhibit, and table structure instead of a single generic query. The generation path packs whole governed evidence items into an explicit input-side token budget, reports how much context was available/retrieved/packed/dropped/cited, distinguishes no approved evidence from prompt starvation, and marks the shared prompt context for Anthropic prompt caching.

The Moves current-state Upload & Review surface now rejects canonical-backed evidence families with an actionable governed-load message instead of a generic unmapped-document failure. This is an informative guard only; it does not change auto-commit policy or route those files into canonical loaders.

## Layer Impact

Layer 4 Products: changes the Moves/Source deliverable-generation projection and run-status telemetry. It does not change canonical enterprise objects or source adapters.

Control-plane run ledger: adds a nullable JSONB telemetry field to `deliverable_runs` so coverage can be inspected after a run completes while preserving the existing scalar `retrieved_evidence` field.

## Client Applicability

- All clients: Applies to orchestrated deliverable generation once deployed.
- Specific clients: None.
- Internal only: Run-status coverage telemetry is operator/debug evidence unless surfaced by product UI.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Adds `src/lib/deliverables/orchestrator/context-budget.ts` for explicit input-side token budgeting and whole-item evidence packing.
- Adds `src/lib/deliverables/orchestrator/context-coverage.ts` for available/retrieved/packed/dropped/unreadable/cited coverage readouts, nullable no-input ratios, and structural coverage-state signaling.
- Updates `src/lib/deliverables/orchestrator/evidence-assembler.ts` to accept multiple section-derived queries, dedupe tenant-search chunks by `chunkId`, raise Move-scoped retrieval limits, and pack evidence by budget.
- Updates `src/lib/deliverables/orchestrator/generate-service.ts` to resolve the artifact brief before retrieval, derive section/exhibit/table queries, and return coverage.
- Updates `src/lib/deliverables/orchestrator/model-caller.ts` and prompt types so the shared prompt context can be sent as an Anthropic cache-control breakpoint.
- Updates the async worker, run repository, and run polling route to persist and return context coverage.
- Adds a shared current-state routing message for canonical-backed family wrong-path failures, used by the P2 bulk uploader and direct document-ingest route.
- Updates post-extract document sensitivity assessment to scan decoded extracted text as text, independent of the source archive MIME type.
- Adds migration `supabase/migrations/20260901190000_deliverable_runs_context_coverage.sql`.
- Adds live status file `docs/status/moves-rich-context/STATUS.md`.

## QA / Validation

- PASS: `npx jest src/lib/deliverables/orchestrator/__tests__/context-budget.test.ts src/lib/deliverables/orchestrator/__tests__/surface.test.ts src/lib/deliverables/orchestrator/__tests__/model-caller.test.ts src/lib/deliverables/orchestrator/__tests__/runs-repository.test.ts 'src/app/api/v1/deliverables/runs/[runId]/__tests__/route.test.ts' --runInBand` passed 5 suites / 42 tests.
- PASS: `npx jest src/lib/programs/__tests__/current-state-doc-ingest.test.ts --runInBand` passed 1 suite / 16 tests.
- PASS: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand -t "canonical-backed P2 uploads|routes P2 current-state uploads|routes airline P2 uploads"` passed 3 targeted tests.
- NOTE: Jest emitted pre-existing duplicate manual mock warnings for markdown parser mocks; the focused suites still passed.

## Rollout Plan

Open a PR to `main`, merge through the protected PR path, then let the repo-owned Azure Container Apps main deploy workflow build and deploy the digest-pinned image. Apply the additive migration through the approved database migration path before relying on persisted `context_coverage` in run polling.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared web runtime changes.
- Shared runtime mutators: None in this branch.
- Approved image digest: Not available until the repo-owned deploy workflow builds from merged `main`.
- ACA runtime invariant: Must be proven after deployment before calling this deployed.
- Worker image invariant: Must be proven after deployment because the deliverable worker writes run completion telemetry.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, before claiming `live_proven`.

## Rollback Plan

Revert the application commit to restore the previous retrieval and prompt payload behavior. The migration is additive and nullable; it can remain safely if rollback speed matters, or be removed later in a controlled migration if no rows depend on it.

## Audit Evidence

- Branch: `codex/moves-rich-context`
- Status file: `docs/status/moves-rich-context/STATUS.md`
- Local focused Jest output listed above.

## Known Gaps

Increment 0 4a routing to canonical loaders is intentionally not implemented in this follow-up. Increment 2 approval-gap behavior is intentionally not implemented because the auto-commit families and gate report/block behavior require a product-owner decision. Digest-layer work is intentionally deferred until Increment 1 has a measured before/after generation readout. This branch has not been deployed or live-proven.
