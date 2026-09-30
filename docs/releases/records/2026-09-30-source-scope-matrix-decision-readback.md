# 2026-09-30-source-scope-matrix-decision-readback — Persist Scope responsibility decisions

## Release ID

`2026-09-30-source-scope-matrix-decision-readback`

## Status

`candidate`

## Plain-English Summary

The Scope responsibility step now asks the authorized Event Owner to name retained work, prospective supplier work, and the reason for the split. It stores the decision with the identities of the reviewed workforce and SLA sources. A page reload counts the step complete only while those same sources remain current. The action is not an award, supplier commitment, contract, or external release.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 canonical model: no supplier, finance, contract, or operational baseline fact is created or changed.
- Layer 4 Source: the event-scoped workflow stores the decision receipt with actor, time, rationale, and source identities, then reads it back instead of treating a browser-local click as completion.

## Client Applicability

- All clients: yes, for the Scope retained/vendor step on active Source events.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Scope decision evidence definition, task binding, validated answer route, source-aware readback, and step form.
- Keep the decision in a separate workflow-decision registry, outside file-upload checklists and templates; it is recorded in the accountable step.
- No schema migration or data build.

## QA / Validation

- Pass: red-first route, task binding, readback, and mounted UI behavior tests.
- Pass: authorization and changed-source mutations each caused their expected regression test to fail, then were restored.
- Pass: focused tests, TypeScript, scoped ESLint, release check, and diff check before PR.
- Pass: two upload-only catalog assumptions surfaced in CI; the corrected Source core, export, canvas, and facts run passes locally (182 suites/1,938 tests). Mounted Files and direct-template negatives pass.
- Not run: CI and signed-in acceptance until the PR is opened, merged, and officially deployed.

## Rollout Plan

Squash-merge after applicable CI and review. Only the repository-owned ACA main workflow may deploy to the shared runtime. Verify the exact image digest on the web template, sole 100%-traffic revision, and required workers, then replay the decision signed in.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none from this branch or agent session.
- Approved image digest: determined by the official main run.
- ACA runtime invariant: verify digest-pinned template and Healthy/Running 100%-traffic revision.
- Worker image invariant: both delivery job templates must match the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes; the persisted step must survive reload and stale source evidence must not count.

## Rollback Plan

Revert the PR through the same protected main/deploy workflow. Existing decision receipts remain auditable but will no longer hydrate the Scope step until a compatible release is restored.

## Audit Evidence

Focused test results and mutation output in the PR, followed by applicable CI, official ACA run, digest readback, and private signed-in smoke ledger.

## Known Gaps

This does not decide exclusions or apply separately pending evidence-applicability schema migrations. It does not itself exit Scope.
