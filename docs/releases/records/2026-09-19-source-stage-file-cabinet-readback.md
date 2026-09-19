# 2026-09-19-source-stage-file-cabinet-readback - Align Stage Evidence Readback

## Release ID

`2026-09-19-source-stage-file-cabinet-readback`

## Status

`candidate`

## Plain-English Summary

Make the detailed Source event stage read uploaded evidence from the same governed File Cabinet used by Source New. A stored upload is shown as uploaded and awaiting extraction; it does not become a parsed fact, completed task, approval, or unlocked gate.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3: no schema, loader, or data mutation.
- Layer 4, Source: one additional metadata-only File Cabinet read supplies persisted upload state to the existing task hydrator.

## Client Applicability

- All clients using Source events with evidence already stored in the canonical File Cabinet receive the change when the shared Source web application is deployed.
- No client-specific logic or identifiers are introduced.

## Changes Included

- Read current event files by governed tenant key.
- Map file name, format, size, stage, and artifact type into the existing evidence hydrator.
- Preserve the distinction between stored files and parsed or accepted evidence.
- Add a route contract test preventing the detailed stage and Source New from drifting to different file stores again.

## QA / Validation

- PASS: focused route payload contract test.
- PASS: task evidence hydration behavior suite.
- PASS: Source canvas workflow suite.
- PASS: scoped ESLint and diff whitespace check.
- PASS: TypeScript with an 8 GB Node heap and release-control check.
- NOT RUN: pull-request CI; required before merge.
- NOT RUN: signed-in production proof; required after deployment.

## Rollout Plan

Squash-merge through the protected branch and deploy only through the repository-owned ACA main workflow.

## Deployment Authority

- `.github/workflows/aca-main-deploy.yml`
- No ad-hoc shared-runtime mutation.

## Rollback Plan

Revert the squash commit and redeploy through the repository-owned workflow. No database rollback is required.

## Audit Evidence

- Pull-request diff and CI checks.
- ACA revision, digest, traffic, worker, and health readback.
- Signed-in evidence-state proof on the affected stage.

## Known Gaps

- Existing files remain blocked from completion until deterministic extraction writes the required typed facts or an explicit governed evidence state meets the gate.
