# 2026-09-30-moves-phase-evidence-fence — Phase-bound prompt evidence

## Release ID

`2026-09-30-moves-phase-evidence-fence`

## Status

`candidate`

## Plain-English Summary

Moves deliverable generation now carries its canonical phase from enqueue through the durable
worker into prompt assembly. A phase-specific prompt can use only phase captures, reviewed
evidence, structured evidence-ledger claims, and signed-off deliverables from that phase or an
earlier phase. Records with missing or unrecognized phase metadata are excluded when a phase
boundary is active. This prevents later roadmap and investment knowledge from appearing in an
earlier discovery artifact.

## Layer Impact

**Release lane: `global-control-lane`.** The change applies to the shared Moves generation path for
all clients; it does not change schemas, tenant identity, evidence approval policy, or phase gates.

- **Layer 4 (products):** Moves generation prompt assembly is phase-bounded.
- **Worker/control path:** the durable job payload preserves the canonical phase; the worker
  resolves older payloads from the deliverable registry and blocks unknown Moves phases.
- **Layer 3 (canonical model):** no model or migration change. Existing phase metadata and the
  canonical deliverable registry are read as-is.

## Client Applicability

- All clients: all Moves deliverable generation using the updated shared runtime.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/api/v1/deliverables/generate-phase/route.ts` — persists the requested phase with each
  queued deliverable.
- `src/app/api/v1/deliverables/generate/route.ts` — resolves generic Moves requests to one canonical
  phase and refuses ambiguous or unmapped requests.
- `src/lib/programs/orchestrated-deliverable-map.ts` — resolves the canonical phase for registry
  and orchestrator deliverable keys.
- `src/lib/deliverables/orchestrator/runs-repository.ts` — types the phase in durable run payloads.
- `src/scripts/process-deliverable-queue.ts` — passes phase to generation and blocks unresolved
  legacy Moves jobs rather than assembling unscoped evidence.
- `src/lib/deliverables/orchestrator/generate-service.ts` — forwards phase to evidence assembly.
- `src/lib/deliverables/orchestrator/evidence-assembler.ts` — bounds Move captures, reviewed
  evidence, ledger claims, and approved generated-artifact context by phase.
- Focused route, worker, and assembler regression tests.

## QA / Validation

- Planted regression first failed: a P2 assembly included a P4 capture signal.
- Focused assembler, enqueue-route, phase-route, and worker suites: **60 passed**.
- The assembler regression includes P2/P4 ledger claims, reviewed evidence, and signed-off
  deliverables; P2 and prior-phase evidence remain while P4 evidence is excluded.
- Worker test proves a legacy payload resolves its phase from the canonical key, and an unmapped
  legacy Moves job is blocked before model generation.
- Mutation verification: changing the phase predicate to accept every known phase makes the
  cross-source assembler regression fail on the P4 ledger claim; restoring the predicate returns
  the suite to green.
- `npm run typecheck` — exit 0, `typecheck: clean.`
- `npx eslint` over all changed TypeScript files — exit 0.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — exit 0; release record,
  deploy authority, Azure lane, policy, and corpus/manual gates passed.
- Live signed-in verification is required after deployment; no live proof is claimed by this
  candidate record.

## Rollout Plan

Merge through a protected PR, then deploy the exact merge SHA with the repo-owned
`.github/workflows/aca-main-deploy.yml`. Verify the ACA template image, 100%-traffic healthy
revision, and required worker jobs share the approved digest. Re-test signed-in Moves generation
and inspect the resulting phase-bound evidence context before resuming the synthetic journey.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the repo-owned deployment workflow.
- Approved image digest: pending exact merge-SHA deploy.
- ACA runtime invariant: pending exact merge-SHA deploy.
- Worker image invariant: pending exact merge-SHA deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes; verify phase-specific generation and absence of later-phase
  context before claiming the fix live-proven.

## Rollback Plan

Revert the merged code commit through a PR and redeploy from `main` with the repo-owned workflow.
There is no schema migration, evidence rewrite, gate-state mutation, or data backfill to unwind.

## Audit Evidence

- Regression test proving the pre-fix P2/P4 capture leak and its corrected behavior.
- Focused CI suites and exact merge-SHA ACA deployment/runtime proof, to be linked after release.
- Signed-in product verification, to be captured after deployment.

## Known Gaps

- This fence separates P0–P5, not multiple evidence waves inside one phase. Early-P2 and P2-closure
  evidence both have phase 2; separating those waves requires an explicit wave/substage contract.
- The existing synthetic Move already contains approved P2 closure evidence, so it cannot prove a
  Package-B-only early-P2 first pass. No evidence will be relabeled or deleted to manufacture that
  proof; a fresh Move is required for the clean-room replay.
- External tenant context retrieval is not Move-phase metadata. It remains governed by its own
  tenant corpus policy and was not changed here.
