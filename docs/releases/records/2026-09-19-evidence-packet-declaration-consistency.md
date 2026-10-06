# 2026-09-19-evidence-packet-declaration-consistency — Report contradictory decision-packet declarations

## Release ID

`2026-09-19-evidence-packet-declaration-consistency`

## Status

`candidate`

## Plain-English Summary

An AI decision evidence packet can be declared as a brief that records no human
decision. Before this change, a packet carrying human-decision markers was correctly
treated as a decision even when a caller declared it to be a brief, but the incorrect
declaration disappeared silently. Reviewers could see that the rationale rules were
enforced without seeing that the producing surface had mislabeled its packet.

The packet now preserves the caller's declaration. Validation reports
`mislabeled_brief_declaration` when a surface declares a brief while also supplying a
decision owner, an override disposition, or a human rationale. The packet remains a
human-decision record, so the existing rationale checks still apply as well.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 4 — Products (shared control):** the shared AI decision evidence-packet
  builder preserves the caller's declaration and the shared validator reports a
  contradictory brief declaration.
- No client intake, adapter, canonical-model, schema, migration, loader, projection,
  read-model, or tenant-data change.

## Client Applicability

- All clients: yes, through the shared evidence-packet control.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/ai-liability/human-decision-controls.ts`
- `src/lib/ai-liability/__tests__/human-decision-controls.human-rationale.test.ts`
- This release record.

## QA / Validation

- Failing-first focused test: 1 failed / 7 passed before the implementation because
  the contradictory declaration produced only `insufficient_human_rationale`.
- Focused test after the implementation: 8 passed / 0 failed. The contradiction now
  reports `mislabeled_brief_declaration` and still reports the rationale failure.
- Additional TypeScript, ESLint, release-control, and broader regression results are
  recorded on the pull request before merge.

## Rollout Plan

Merge through a protected pull request. The repo-owned Azure Container Apps main
deploy workflow builds and deploys the merge SHA. No migration, data-build job, flag,
or manual runtime mutation is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned and read back after merge.
- ACA runtime invariant: prove template image, 100%-traffic revision image, and active
  revision match the approved digest.
- Worker image invariant: prove required worker jobs use the approved digest.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no rendered product behavior changes; this is a
  shared validation and audit-shape correction.

## Rollback Plan

Revert the merge commit. The change is additive and has no schema or stored-data
rollback requirement.

## Audit Evidence

- Pull-request diff and CI checks.
- Failing-first and passing focused-test output.
- TypeScript, ESLint, and release-control output.
- Repo-owned deployment run and runtime-invariant artifact.

## Known Gaps

- Existing stored packets are not rewritten. The declaration is preserved only for
  packets built after this release.
- A packet that omits the declaration remains classified conservatively from its own
  decision markers, as before.
