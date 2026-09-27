# 2026-09-22-source-new-completion-integrity — Source New Completion Integrity

## Release ID

`2026-09-22-source-new-completion-integrity`

## Status

`candidate`

## Plain-English Summary

Source New no longer tells an operator that no action remains when a terminal event is missing governed history for one or more visible phases. The workspace identifies the incomplete record, counts the affected phases, and provides one clear route to resolve the missing evidence or record a named waiver.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: updates the Source New read-only workspace presentation and next-action contract.
- Canonical model: no schema, identity, or data changes.

## Client Applicability

- All clients: yes.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds a pure completion-integrity projection over the existing phase evidence states.
- Makes the mounted action panel fail closed when terminal history is incomplete.
- Preserves the terminal no-action state when every visible phase has governed history.

## QA / Validation

- PASS: focused phase-state and mounted workspace behavior tests.
- PASS: mutation proof that disabling the terminal-gap guard fails both the projection and mounted UI tests.
- PASS: focused ESLint and diff checks.
- PASS: TypeScript and release validation.

## Rollout Plan

Squash merge to `main`; the repo-owned Azure Container Apps main workflow builds and deploys the exact merged revision.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the workflow.
- Approved image digest: recorded after workflow completion.
- ACA runtime invariant: verify template, 100% traffic revision, and required worker images against the approved digest.
- Worker image invariant: verify after deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, on a synthetic completed event with a historical phase gap.

## Rollback Plan

Revert the squash commit and allow the repo-owned main deployment workflow to restore the prior workspace presentation. No data rollback is required.

## Audit Evidence

- Pull request and CI checks.
- Repo-owned deployment run and immutable image digest.
- Signed-in repeat of the Source New completed-event step.

## Known Gaps

This release exposes historical incompleteness; it does not create missing evidence, infer approvals, reopen events, or write waivers.

## Signed-in proof reconciliation (item C-548)

- Ran: a signed-in replay was run and is reported in the execution register at `2026-09-22T19:21:46Z`
  by `codex-cpo-source-new-smoke` against PR #8277 — the signed-in replay on the frozen completed synthetic event renders the completion-review state and exposes the resolve affordance.
- Outcome as the register states it: reported as meeting this record's acceptance. The same line is explicit about scope: the read-only fail-closed completion guard only, with no governed write.
- Provenance: this section reconciles the durable record with the operator register under item
  C-548; it is not a first-hand observation by its author, and no proof was re-executed to write
  it. The QA/Validation bullet above was accurate when this record was authored and is superseded
  here by an appended correction rather than by a restamp, per the register time-authority rule.
