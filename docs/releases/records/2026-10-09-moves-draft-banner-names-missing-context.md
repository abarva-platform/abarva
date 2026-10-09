# 2026-10-09 — Moves draft banner names missing context in words, not field keys

## Release ID

`2026-10-09-moves-draft-banner-names-missing-context`

## Status

`candidate`

## Plain-English Summary

When a phase deliverable is regenerated as a pre-gate review draft, the
artifact carries a banner listing what is still open. The context part of that
list came from `contextReadyForPhase`, which reports missing fields by their
TypeScript key. The banner printed those keys verbatim into the stored,
client-facing HTML — "useCase is not yet captured or approved for final use;
kpis is not yet captured ..." — and aVa's "I need more evidence before I can
draft this" reply printed the same keys.

This change adds one label owner, `SOLUTION_CONTEXT_FIELD_LABELS`, covering
every field a phase can report missing plus the P3b option approval, and both
reader-facing sentences now name the field by its label ("The confirmed use
case is not yet captured or approved for final use"). Machine values — the
409 `missing` array, the deliverable-run `blockers`, the tool's `error`
string — keep the key. An entry with no label is shown unchanged rather than
dropped.

The banner keeps the phrase "is not yet captured", so the P2 gate still reads a
draft that lists missing context as an open gap, exactly as before.

## Layer Impact

- Release lane: `global-control-lane`.
- Product projection: Moves generated-artifact draft banner and the aVa draft
  tool's recovery sentence.
- Canonical model: no schema, data or tenant change.

## Client Applicability

- All clients: yes, wherever a pre-gate draft is generated with required
  context still missing.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/programs/solution-context-labels.ts`: new label map and
  `describeMissingSolutionContext`.
- `src/lib/deliverables/generate-artifact.ts`: `formatDraftCaveatText` names
  each missing context field by its label.
- `src/lib/agent/tools/program/draftArtifact.ts`: the recovery sentence names
  missing fields by label; the `error` code keeps the keys.
- `src/lib/programs/__tests__/solution-context-labels.test.ts`: every entry the
  producers can report (derived from `PHASE_REQUIRED_CONTEXT` and
  `architectureMayProceed`, not a hand list) has a label with no camelCase key
  left in it; unknown entries pass through; the P2 banner carries labels, no
  raw key, and still the gate's "not yet captured" phrase.
- `docs/architecture/test-ci-coverage-census.json`: one new test file, covered
  by the existing `src/lib/programs/__tests__` directory sweep.

## QA / Validation

- PASS: new suite (4 cases). Mutants: banner reverted to raw key (killed),
  one label removed (killed), P3a suffix handling removed (killed), unknown
  entry dropped instead of passed through (killed). 4 of 4.
- PASS: `npx jest` on the new suite, `src/lib/deliverables/__tests__/generate-artifact.test.ts`
  and `src/lib/agent/tools/program/__tests__`.
- PASS: `tsc -p tsconfig.json --noEmit` (exit 0). ESLint and Prettier clean on
  the changed files.
- NOT RUN: signed-in walk (see Deployment Authority).

## Rollout Plan

Merge through the protected main branch; the repo-owned ACA main deploy
workflow builds and deploys the digest-pinned image. No flag, migration or data
job. Drafts generated before the deploy keep their stored banner text until
regenerated.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the workflow.
- ACA runtime invariant: verify web template and serving revision match the
  approved digest.
- Worker image invariant: verify required worker images match the approved
  digest.
- Feature/env flag update path: none.
- Live signed-in proof required: regenerate a phase deliverable as a review
  draft while that phase's required context is incomplete, and confirm the
  banner names the missing items in words.

## Rollback Plan

Revert this change through a pull request; the banner and the aVa sentence
print the field keys again.

## Audit Evidence

- Pull request and CI results.
- The mutant runs above.

## Known Gaps

- The aVa tool's recovery sentence has no dedicated test; it calls the same
  tested function.
- Drafts already stored keep the old wording until regenerated.
