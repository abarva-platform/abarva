# 2026-09-20-source-nda-artifact-type — Exact Stage 05 NDA Artifact Type

## Release ID

`2026-09-20-source-nda-artifact-type`

## Status

`candidate`

## Plain-English Summary

Stage 05 readiness now accepts only the declared executed-NDA artifact type.
Previously, any artifact type containing the three letters `nda` could be
mistaken for an NDA. A generic assessment whose type happened to contain that
letter sequence could therefore satisfy file-level NDA readiness checks.

## Layer Impact

Release lane: `global-control-lane`.

- Layer 4 Source projection: narrows NDA artifact classification to the
  declared `nda_executed` type. No canonical data, schema, or stored artifact
  changes.

## Client Applicability

- All clients: shared Source New Stage 05 readiness behavior.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/new-workspace/nda-readiness.ts`
- `src/__tests__/behaviors/nda-readiness-consumes-authority.test.ts`

## QA / Validation

Status: `pass`.

- Failure-first proof: `foundational_assessment` reproduced the false positive
  and made the behavior suite fail before the fix.
- Focused behavior suite, scoped ESLint, TypeScript, release check, and diff
  check are recorded on the PR.
- Mutation proof is the original substring implementation: restoring it makes
  the new false-positive case fail.

## Rollout Plan

Squash merge through a PR and deploy through the repo-owned ACA main workflow.
No migration, data build, feature flag, or tenant write is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: pending deploy.
- ACA runtime invariant: pending deploy.
- Worker image invariant: pending deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes for the Stage 05 card before calling the
  complete authority path live-proven.

## Rollback Plan

Revert the commit. No schema or data rollback is needed.

## Audit Evidence

Inspect the focused behavior test, PR checks, deployment runtime-invariant
artifact, and later signed-in Stage 05 acceptance.

## Known Gaps

The governed template and waiver repository remains a separately released
schema/read-path change. This release only ensures unrelated artifact types can
never stand in for an NDA.
