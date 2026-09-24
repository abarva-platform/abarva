# 2026-09-24-home-export-marker-scope — Home Export Marker Scope Copy

## Release ID

`2026-09-24-home-export-marker-scope`

## Status

`candidate`

## Plain-English Summary

Home walkthrough exports now explain that the canonical marker is a serving-row marker, while governed facts are counted separately from the exported record families. This removes an ambiguity where the marker suffix could differ from the visible governed-fact count without explanation.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Updates Home export proof copy only.
- Canonical model: No canonical data, tenant data, schema, or governed record content changes.

## Client Applicability

- All clients: Home walkthrough export readers.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds a short marker-scope explanation to HTML and PDF Home walkthrough exports.
- Adds renderer test coverage for the marker-scope copy.

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/lib/home/export/__tests__/walkthrough-export.test.tsx`
- Pass: `npx eslint src/lib/home/export/walkthrough-export.tsx src/lib/home/export/__tests__/walkthrough-export.test.tsx`
- Pass: `npm run typecheck`
- Pass: `npm run release:check`
- Pending after deploy: live Home export smoke.

## Rollout Plan

Merge through pull request, then deploy through the repo-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None outside the repo workflow.
- Approved image digest: Produced by the main deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, verify Home export response content.

## Rollback Plan

Revert the pull request and redeploy through the same ACA main workflow. No data rollback is required.

## Audit Evidence

Audit evidence will include the pull request, validation output, deploy workflow run, ACA runtime invariant, and live export proof.

## Known Gaps

None known for marker-scope copy.
