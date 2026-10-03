# 2026-09-30-source-current-sow-applicability — Audited absence for net-new scope

## Release ID

`2026-09-30-source-current-sow-applicability`

## Status

`candidate`

## Plain-English Summary

A net-new Source event may lack a current statement of work and change-order history. The Event Owner can now declare that absence for this exact evidence requirement with an accountable reason. The declaration does not invent a current agreement, mark a record as loaded, or complete the separate exclusions decision.

## Layer Impact

- Release lane: `client-data-lane` for the additive evidence CHECK migration; `global-control-lane` for the shared Source authority and UI.
- Layer 3 evidence-state authority and Layer 4 Source projection. No contract, supplier, price, or approval fact is created.

## Client Applicability

- All clients: yes, for new sourcing events with no current SOW or change-order history.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Add the current-SOW requirement to the narrow audited-absence allowlist in application and database controls.
- Expose the decision on the relevant Scope step and evidence checklist only after applicability schema readback.
- Keep reason, actor, timestamp, `Not Requested` state, and no-linked-source conditions intact.
- Do not mark the distinct exclusions decision complete from absence alone.

## QA / Validation

- Pass: three focused suites / 53 tests; all three new behavior tests failed before the change.
- Pass: removing the new application allowlist entry after the change caused the authority, UI, and storage-alignment tests to fail; restoring it passed all focused tests.
- Pass: eight adjacent Source suites / 138 tests, TypeScript no-emit, scoped ESLint, release check, and diff whitespace check before the route-test addition.
- Pass: updated API route suite / 12 tests, including the exact current-SOW decision and wrong-stage/present-source refusals.
- Not run: CI, governed migration apply/readback, and signed-in readback. Record these independently before claiming acceptance.

## Rollout Plan

Squash merge through a PR after local validation and applicable CI. The repo-owned ACA main workflow deploys the code. The migration is **not** applied by ACA deploy; it needs a separately authorized, governed data-plane migration apply and schema readback. The action remains unavailable if schema readback lacks applicability fields.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: no ad-hoc mutator authorized.
- Approved image digest: capture from the official main deploy workflow.
- ACA runtime invariant: verify the digest-pinned web template and Healthy/Running 100%-traffic revision.
- Worker image invariant: verify both required delivery workers match the same digest.
- Feature/env flag update path: none.
- Live signed-in proof required: record a no-current-SOW decision on a controlled synthetic event and verify persisted reason, actor, timestamp, requirement and stage without claiming exclusions or Scope exit.

## Rollback Plan

Revert application behavior through a PR and the main workflow. Database CHECK tightening requires a separately reviewed additive migration; do not edit an applied migration or delete existing decisions as a rollback shortcut.

## Audit Evidence

Red-first and mutation-sensitive test output, final PR checks, official ACA run and immutable digest readback, governed migration apply/readback if authorized, then signed-in decision and stage readback.

## Known Gaps

This resolves the evidence-applicability choice only. The exclusions decision, workforce/SLA evidence, and prior-baseline migration remain separate Scope steps and controls.
