# 2026-08-01-entity-candidate-evidence-refs — Link entity candidates to source evidence

## Release ID

`2026-08-01-entity-candidate-evidence-refs`

## Status

`candidate`

## Plain-English Summary

The Foundation V2 processing pipeline builds two kinds of review candidates from every parsed
source row: fact candidates and entity candidates. Fact candidates were correctly stamped with a
reference back to the evidence row they came from; entity candidates were not. As a result, every
entity candidate written to `working.entity_candidate` landed with no evidence lineage, and any
entity later promoted to `knowledge.entity` had no way to show which source row(s) backed it. The
write path and the candidate content-hash function were already built to expect this field — only
the candidate-construction step was missing it. This is a one-line fix that adds the missing
`evidenceRefs` reference to entity candidates, matching the pattern fact candidates already use.

## Layer Impact

- **`global-control-lane`**: `scripts/knowledge/processing/process-handlers.mjs` is shared,
  tenant-neutral pipeline code that every tenant's Foundation V2 run passes through. Entity
  candidates written to `working.entity_candidate` will now carry evidence lineage going forward,
  and any entity promoted from those candidates will be evidence-backed. No schema change — the
  column and write path already existed.

## Client Applicability

- All clients: yes — `scripts/knowledge/processing/process-handlers.mjs` is tenant-neutral shared
  pipeline code used by every tenant's Foundation V2 run.
- Specific clients: none
- Internal only: no
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/knowledge/processing/process-handlers.mjs` — `buildCandidatesForParsedRows` now sets
  `evidenceRefs: [evidenceRef]` on entity candidates (previously only set on fact candidates).

## QA / Validation

- `node scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs` — 34/34 passed.
- `node scripts/knowledge/__tests__/run-hcdn-job-runner-tests.mjs` — all 14 tenant-neutral process
  contracts passed.
- `node scripts/knowledge/__tests__/run-exploration-evidence-backfill-tests.mjs` — all passed.
- Confirmed by reading `executor-framework.mjs`'s `working.entity_candidate` INSERT that the write
  path already parameterizes `evidence_refs` from `row.evidenceRefs ?? []`, so no write-path change
  was required.
- Confirmed by reading `review-decision-policy.mjs` (`normalizeCandidate`, `candidateContentHash`)
  that entity candidates already normalize and hash an `evidenceRefs` field — this fix populates a
  field the hash function was already designed to consume.

## Rollout Plan

Merge to `main`. No runtime image, migration, or flag change — this only changes the in-process
review-candidate construction logic used the next time any tenant's processing pipeline runs.
Entity candidates already generated before this merge do not retroactively gain evidence links;
regenerating them requires a separate, tenant-scoped re-run of parse/candidate-generation, tracked
as follow-on work outside this record.

## Deployment Authority

- Repo-owned deploy workflow: not applicable — this script runs inside tenant-scoped operator jobs,
  not the shared web/runtime deploy path.
- Shared runtime mutators: none
- Approved image digest: not applicable
- ACA runtime invariant: not applicable
- Worker image invariant: not applicable
- Feature/env flag update path: not applicable
- Live signed-in proof required: no — this is pipeline logic, not a UI-visible change; correctness
  is proven by the automated test suites listed above plus a subsequent tenant-scoped
  candidate-regeneration run (follow-on work).

## Rollback Plan

Revert this commit. Because the change only adds a field to in-memory candidate objects before they
are written, rollback carries no data-migration risk; any entity candidates written with evidence
refs after this lands remain valid rows, just with a populated column, if the code is later reverted.

## Audit Evidence

- PR: (see PR opened from branch `fix/entity-candidate-evidence-refs`)
- Test output: three suites listed under QA / Validation, all green.

## Known Gaps

Entity candidates generated before this fix (across all tenants) do not retroactively gain evidence
links. Regenerating them requires a tenant-scoped re-run of parse/candidate-generation, which is
tracked as separate follow-on work and is not part of this release.
