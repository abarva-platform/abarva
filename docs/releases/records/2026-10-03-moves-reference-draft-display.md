# 2026-10-03-moves-reference-draft-display — Show synthetic phase guidance without granting evidence credit

## Release ID

`2026-10-03-moves-reference-draft-display`

## Status

`candidate`

## Plain-English Summary

Moves can now display a clearly labeled AbarVa reference draft next to a phase input when the
stored module is explicitly marked as synthetic reference material, requires human review, and is
not eligible for gate credit. The client's capture field remains separate and blank; the reference
text does not satisfy evidence, capture, approval, or a phase gate.

## Layer Impact

Release lane: `global-control-lane` — a shared, read-only product presentation change.

- **Layer 4 (Moves):** the phase workspace can show eligible reference text beside its matching
  capture input. No gate, phase, evidence, approval, or value calculation changes.
- **Layer 3 (canonical model):** read-only projection of existing module state; no schema, adapter,
  or data mutation.

## Client Applicability

- All clients: the rendering rule is shared; only modules carrying the explicit synthetic-reference
  provenance and non-credit markers display the callout.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/programs/phase-capture-reference-drafts.ts` — fail-closed reader for eligible reference
  drafts.
- `src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx` — passes eligible drafts
  separately from persisted capture values.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — renders a provenance-labeled
  reference callout in both phase input layouts.
- Focused helper and component regression tests.

## QA / Validation

- Targeted helper and Moves workspace suites: **105 tests passed**.
- The component regression asserts the reference is visible, the actual client capture remains blank,
  and no captured/gate-open state is shown.
- `npx eslint` and the repository typecheck: pending final pre-PR validation.
- Signed-in post-deploy verification is required; no live acceptance is claimed by this record.

## Rollout Plan

Merge through a protected pull request, then deploy only through the repository-owned ACA main deploy
workflow. Verify the exact merge SHA's workflow run, 100% traffic revision, digest-pinned web image,
and required worker image invariants before signed-in UI verification.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside that workflow.
- Approved image digest: pending workflow output.
- ACA runtime invariant: verify template image, 100%-traffic revision image, and required worker job
  images all match the approved digest.
- Worker image invariant: pending workflow output.
- Feature/env flag update path: none.
- Live signed-in proof required: yes; verify the reference callout and unchanged open evidence/gate
  state in the phase workspace.

## Rollback Plan

Revert the presentation change in a protected follow-up PR and deploy that revert through the same
ACA workflow. No data rollback is required because this change is read-only and does not alter
stored module, evidence, gate, phase, or approval state.

## Audit Evidence

- Pull request and its required checks: pending.
- Exact ACA deploy workflow run, merge SHA, revision, and digest invariant: pending.
- Signed-in phase-workspace verification: pending.

## Known Gaps

This change does not create evidence, complete capture fields, clear gates, or archive any additional
portfolio records. Any portfolio-count mismatch remains outside this presentation-only release.
