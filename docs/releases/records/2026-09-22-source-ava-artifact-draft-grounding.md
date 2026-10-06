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

## Post-deployment signed-in replay

**Appended 2026-09-26 (item `C-528`). Every line above is left exactly as
written: this record is audit history, and a correction to it is an addition,
never an edit.** What those lines said was true when they were written — the
record is authored before the merge, and the replay happens after the deploy.

- The signed-in post-deployment replay was run. This section is the record of
  its outcome; the line above is the state as of the candidate, not the result.
- Recorded in the execution register at `2026-09-22T02:38:54Z` by `codex-source-ava-artifact-draft-grounding`.
- What it found: a real residual, and this is the half worth reading. Repeating
  the exact signed-in readiness question showed the structured governed answer no
  longer repeats the stale artifact gap — while the primary advisor answer still
  reported an artifact as unregistered when its own cited evidence for the same
  artifact said it was a draft awaiting review.
- Residual: the primary advisor path. The next release in this family,
  [#8215](https://github.com/abarva-platform/abarva/pull/8215), targets exactly
  that path and its register line is stamped 44 minutes later. **That is a
  sequence, not a closure**: nothing records whether it settled this residual.
  Item `C-543`, filed by this correction, carries that question.
- **Scope is UNDETERMINED and is not claimed here.** The register settles the
  structured answer and names the residual; it does not enumerate what else the
  replay covered.
- No signed-in run was performed by this correction. It reconciles two existing
  accounts of one run, and the appended-to record is the durable one.
