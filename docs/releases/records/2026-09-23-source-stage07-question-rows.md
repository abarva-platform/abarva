# 2026-09-23-source-stage07-question-rows - Accepted Response Question Identity

## Release ID

`2026-09-23-source-stage07-question-rows`

## Status

`candidate`

## Plain-English Summary

The Evaluation and BAFO review panel now shows each accepted supplier response requirement as its own question row. It preserves the parsed question identity, answer, and cited exhibit instead of displaying a section summary as if it were a question.

## Layer Impact

Release lane: `global-control-lane`. Layer 4 Source read projection only. The route reads the existing tenant and event scoped, accepted normalized response packages and passes them to the existing Stage 07 view. No intake, adapter, canonical object, or stored score changes.

## Client Applicability

- All clients: yes, when the mounted Evaluation or BAFO stage has accepted normalized response packages.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

The Source event route supplies accepted production response packages to the Stage 07 read model. The read model projects stable requirement question IDs and keeps unaccepted or mismatched rows out. Explicit synthetic demonstration profiles retain their existing section-summary behavior.

## QA / Validation

The mounted Stage 07 behavior test was red first: 6 passed, 2 failed. Two accepted requirements collapsed into one `section-1` row, and an unaccepted package still produced a pseudo-question. After the change, 8 passed, 0 failed; the test also renders the panel and checks both requirement labels and the actual answer. Replacing the new projection with the old section-summary call again failed those same 2 tests; the implementation was restored. Node 24 typecheck, scoped ESLint, and release check passed.

## Rollout Plan

Squash merge through a PR. The repo-owned ACA main deploy workflow is the only authorized path to the shared runtime. No manual deploy or traffic action is part of this change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` after merge.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the deploy workflow; not yet known.
- ACA runtime invariant: owed after deployment.
- Worker image invariant: owed after deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for an event with accepted normalized response rows.

## Rollback Plan

Revert the PR and redeploy through the repo-owned workflow. No data rollback is required.

## Audit Evidence

The focused test and PR diff show the before/after row identity and accepted-artifact filter. Merge, deployment, and signed-in acceptance are not claimed by this record.

## Known Gaps

Frozen scorecard criteria, named evaluator decisions, pricing facts, and BAFO rounds remain separately governed. This change does not create or approve any of them.
