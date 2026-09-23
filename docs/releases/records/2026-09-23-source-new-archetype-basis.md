# 2026-09-23-source-new-archetype-basis - Explain playbook provenance

## Release ID

`2026-09-23-source-new-archetype-basis`

## Status

`candidate`

## Plain-English Summary

The Source New Intelligence view now explains whether its playbook comes from
a recorded classifier category or from the older event-type fallback. It no
longer describes fallback resolution as an accepted category or sourcing-motion
decision. Unresolved events do not receive a false playbook explanation.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Source presentation: one explanation rendered from an existing
  governed resolution source. No classifier, category, evidence, or canonical
  data is changed.

## Client Applicability

- All clients: Source New event Intelligence view.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Source New Intelligence playbook-basis label and rendered behavior coverage.
- No schema, migration, loader, review, approval, or supplier action.

## QA / Validation

- Red-first rendered behavior test exposed the fixed category-and-motion text.
- The corrected category and event-type fallback labels pass 55 focused tests.
- Deliberately breaking the fallback branch makes the same test fail; restoring
  it passes.
- Scoped ESLint, Node 24 typecheck, and `npm run release:check` pass. Hosted
  CI remains required before merge.

## Rollout Plan

Squash merge after applicable checks pass. The repo-owned ACA main workflow
deploys the image; replay the signed-in Intelligence view and Request summary
on the same event.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: pending deployment.
- ACA runtime invariant: pending deployment.
- Worker image invariant: pending deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: category and event-type fallback descriptions.

## Rollback Plan

Revert through a PR and redeploy through the repo-owned workflow. No data
rollback is necessary.

## Audit Evidence

- PR, CI, deployed digest, and signed-in replay will be recorded separately.

## Known Gaps

An event-type fallback is not a reviewed category mapping. This change does
not promote evidence, add industry benchmarks, or advance a sourcing gate.
