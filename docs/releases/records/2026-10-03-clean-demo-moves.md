# 2026-10-03-clean-demo-moves — Governed synthetic Move seed

## Release ID

`2026-10-03-clean-demo-moves`

## Status

`candidate`

## Plain-English Summary

Adds a governed, idempotent operator path for loading five synthetic Move
candidates. Reference charter content is distinct from captured inputs: P1
drafts are tagged for human review, capture values remain empty, evidence gaps
remain open, and no value or gate approval is fabricated. Existing matching
test records are reversibly archived; no rows are hard-deleted.

## Layer Impact

- Release lane: `public-demo`; governed operator execution: `internal-admin`.
- **Layer 3 — Canonical Enterprise Model:** adds two permitted early-state
  values to the engagement lifecycle and origin-source constraints. Existing
  rows are not changed by the migration.
- **Layer 4 — Moves projection:** the ACA data-build job writes tenant-scoped
  engagement, informational sponsor, and P1 reference-draft records that Moves
  can project. The job creates no evidence, deliverable, approval, or phase
  snapshot.
- **Operator control:** the job uses the shared digest-pinned ACA wrapper,
  explicit tenant and source bindings, a dry preflight, a hash-pinned archive
  plan, transactional validation, and Blob proof.

## Client Applicability

- All clients: no.
- Specific clients: none; the seed is available only to the registered public
  demo tenant when the governed operator job is explicitly run.
- Internal only: operator implementation and audit output.
- Public/demo only: yes.
- Feature flag: none.

## Changes Included

- `scripts/demo/clean-demo-moves.ts` and
  `scripts/demo/load-clean-demo-moves.ts`: synthetic content, real engagement
  classifications, honest values/gates, and accurate reversible-archive wording.
- `scripts/demo/clean-demo-moves-aca-job.ts`: preflight/apply job, canonical
  tenant resolution, no-clobber checks, idempotent graph-ID insertion,
  observer-only sponsor rows, empty P1 capture values, validation, and Blob
  proof.
- `supabase/migrations/20261003120000_moves_shaping_candidate_states.sql` and
  `src/lib/programs/types.db.ts`: schema/type support for `shaping` and
  `intelligence_candidate`.
- Demo loader tests, README, and this release record.

## QA / Validation

- Local validation: `PASS` — planner reviewed; 14/14 targeted tests, typecheck,
  lint, migration-seal check, test-census check, Azure-only architecture check,
  and all 11 release-check gates pass.
- Live migration, ACA job, Blob proof, database readback, and signed-in board
  verification: `NOT RUN` — pending merge/deploy and governed execution.
- Local tests do not establish that data is loaded or visible in the product.

## Rollout Plan

Merge through a protected PR. Apply the additive migration with the repo-owned
ACA migration workflow after its dry-run lists the intended pending migration.
Then use the repo-owned ACA main deploy workflow to produce the digest-pinned
operator image. Run the read-only preflight, inspect its exact archive list,
and submit apply with that list's plan hash. Confirm the Blob proof and a
separate signed-in Moves board readback.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Schema migration path: `.github/workflows/db-migration-lab.yml`, dry-run
  before apply.
- Data mutation path: `npm run ops:aca-job -- --image <digest>
  --script moves:clean-demo:load-job`, with the Azure Postgres secret and
  managed-identity Blob bindings.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest / ACA runtime invariant / worker image invariant:
  pending deployment evidence.
- Live signed-in proof required: yes, after apply.

## Rollback Plan

The transaction rolls back all row changes if any validation fails before
commit. After a successful load, do not delete rows: use a separately reviewed
governed compensating job to archive only the five loader-owned graph IDs and
restore only test records stamped with the corresponding run's archive reason
and state. Revert the additive migration only after confirming no row still
uses either newly permitted value.

## Audit Evidence

- PR URL: pending.
- Migration dry-run/apply/readback: pending.
- ACA main deploy run, exact digest, active revision, and traffic proof: pending.
- Data-build run contract, preflight list/hash, validation, quality gate, and
  Blob proof URI: pending.
- Signed-in board verification: pending.

## Known Gaps

- This job does not ingest evidence or complete P1 capture. Every evidence item
  remains open until it is supplied and approved through the product workflow.
- Rollback is a governed compensating operation, not an in-place hard delete.
