# 2026-09-30-source-scope-exclusions-decision — Persist Scope exclusions

## Release ID

`2026-09-30-source-scope-exclusions-decision`

## Status

`candidate`

## Plain-English Summary

The Scope exclusions step asks the authorized Event Owner to state the excluded work, its responsible owner, and the reason. A current SOW evidence source or an audited declaration that no current SOW exists is required first. The saved decision is shown as complete after reload only while that exact source or declaration remains current. It does not amend a contract or release anything externally.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 canonical model: no supplier, finance, contract, or operational fact is created or changed.
- Layer 4 Source: the event-scoped workflow stores an actor- and source-bound decision receipt and reads it back to govern step completion.

## Client Applicability

- All clients: yes, for the Scope exclusions step on active Source events.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Scope workflow-decision definition, task binding, validated answer route, source-aware readback, and in-step form.
- The decision stays outside file-upload requirements and templates; its reviewed source remains the separate current-SOW evidence requirement.
- No schema migration or data build in this release.

## QA / Validation

- Pass: red-first route, hydration, and mounted UI behavior tests; the decision requires explicit fields and authorized active-stage action.
- Pass: removing the source-revision comparison caused the stale-source test to fail, then the guard was restored.
- Pass: focused tests, TypeScript, scoped ESLint, and the measured Source canvas import-closure control.
- Pass: broad Source run had 4,348 passing tests; four unrelated pricing-parser/vendor-proposal failures reproduced identically on a pristine `origin/main` checkout.
- Not run: PR CI, official deploy, and signed-in acceptance until the release progresses through those independent gates.

## Rollout Plan

Squash-merge after applicable CI and review. Only the repository-owned ACA main workflow may deploy to the shared runtime. Verify the exact image digest on the web template, sole 100%-traffic revision, and required workers, then replay the exclusions step signed in.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none from this branch or agent session.
- Approved image digest: determined by the official main run.
- ACA runtime invariant: verify digest-pinned template and Healthy/Running 100%-traffic revision.
- Worker image invariant: both delivery job templates must match the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes; the persisted step must survive reload and reject stale source evidence.

## Rollback Plan

Revert this PR through protected main and the same deploy workflow. Existing decision receipts remain auditable but cease to hydrate the step until a compatible release is restored.

## Audit Evidence

Focused test and mutation output in the PR, then applicable CI, official ACA run, digest readback, and the private signed-in smoke ledger.

## Known Gaps

The separately authorized applicability migrations and any synthetic event decision remain independent. This release alone does not exit Scope.
