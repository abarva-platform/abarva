# 2026-09-22-source-ava-artifact-draft-grounding — Source aVa stage-completion artifact state grounding

## Release ID

`2026-09-22-source-ava-artifact-draft-grounding`

## Status

`candidate`

## Plain-English Summary

Source aVa stage-completion answers now reconcile recorded missing-input text with the artifact
registry lifecycle matrix before rendering the answer. If a recorded gap still says an artifact has
no registered file, but the registry shows that artifact exists as an AI draft awaiting human
review, aVa reports the registered draft state instead of repeating the stale missing-artifact
wording. Truly absent artifacts remain listed as missing.

## Layer Impact

- `global-control-lane`: adjusts the shared Source aVa structured-answer path for all clients using
  the governed stage-completion/evidence-readiness answer.
- `source-read-model`: reads existing Source artifact registry rows and the existing lifecycle
  matrix; no schema, artifact, approval, lifecycle, tenant-data, or data-job writes.
- `agent-answer-rendering`: changes deterministic answer text only, preserving stored/parsed/search
  proof-layer separation.

## Client Applicability

- All clients: yes, for Source stage-completion questions where recorded missing inputs reference
  artifact registration state.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/ava/evidence-readiness-governed-answer.ts`
  - Reconciles stage-context missing-input strings against `buildSourceArtifactLifecycleSummary()`.
  - Moves registered draft/final/evidence-only artifact rows into an explicit "registered artifact
    states requiring action" sentence instead of listing them as missing files.
  - Leaves genuinely unregistered artifact inputs in the missing-input sentence.
- `src/lib/source/ava/__tests__/evidence-readiness-governed-answer.test.ts`
  - Adds a public-safe Example Client regression where a registered Scope Memo draft is distinct
    from an absent Exclusion Log.

## QA / Validation

- `pass` — `npm test -- --runTestsByPath src/lib/source/ava/__tests__/evidence-readiness-governed-answer.test.ts --runInBand`
  - 1 suite, 10 tests passed.
- `pass` — mutation proof: temporarily inverted the lifecycle-state reconciliation condition and
  reran the focused suite; the new regression failed by placing the registered draft back in the
  missing-input sentence. Restored the real condition and reran the suite green.
- `pass` — `npx eslint src/lib/source/ava/evidence-readiness-governed-answer.ts src/lib/source/ava/__tests__/evidence-readiness-governed-answer.test.ts`
- Pending before merge: typecheck, release check, hosted PR checks.

## Rollout Plan

Merge through a squash PR. The repo-owned ACA main deploy workflow may build and deploy the merged
image. No migration, tenant write, approval change, lifecycle mutation, vendor contact, data job, or
manual data-plane operation is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` after merge to `main`.
- Shared runtime mutators: none from this branch.
- Approved image digest: pending repo-owned deploy workflow.
- ACA runtime invariant: required after deploy before any live claim.
- Worker image invariant: no worker change expected; verify if the deploy workflow reports worker
  image state.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, before calling the behavior live-proven. Not performed in this
  candidate record.

## Rollback Plan

Revert the squash merge. That restores the previous stage-completion answer text assembly. No
migration rollback or data correction is required.

## Audit Evidence

- PR: pending.
- Focused behavior test and mutation proof commands listed above.
- Release gate evidence: pending.
- Signed-in proof: not performed in this candidate.

## Known Gaps

- This does not prove the signed-in production path.
- This does not change Source New UI adapters, workspace rendering, artifact lifecycle records, or
  missing-input persistence.
