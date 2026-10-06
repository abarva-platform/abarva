# 2026-09-11-source-command-action-timing-labels — Source Action Timing Labels

## Release ID

`2026-09-11-source-command-action-timing-labels`

## Status

`candidate`

## Plain-English Summary

Source action rows no longer render a generic missing-date label when the action has no governed due date. If a dated decision gate exists, Source shows the date or days remaining; if the row only carries governed timing language, Source shows that timing language instead.

## Layer Impact

Layer 4 — Products: Source presentation logic changes how action timing is labelled in the command center and selected action drawer. No source adapter, canonical model, migration, seed, or data-plane write is included.

## Client Applicability

- All clients: Yes, for Source command-center action rows.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source route/provider gates only.

## Changes Included

- Source command-center action timing label fallback.
- Browser regression coverage for action rows that have timing language but no `decision_due_date`.

## QA / Validation

- Pass — `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' --runInBand`
- Pass — `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'`
- Pass — `npx tsc --noEmit --pretty false`
- Pass — `npm run release:check`

## Rollout Plan

Merge through pull request, then allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the approved main image. No migration or private data refresh is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: Required for production.
- Shared runtime mutators: None in this change.
- Approved image digest: Captured by the deploy workflow after merge.
- ACA runtime invariant: Required before live proof.
- Worker image invariant: Required before live proof.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source command center action rows.

## Rollback Plan

Revert the product-surface commit and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required.

## Audit Evidence

Pull request, CI output, release-check output, ACA deployment summary, runtime invariant output, and signed-in Source smoke evidence.

## Known Gaps

This release does not load or enrich contract data. Rows without either a governed due date or governed timing language still render as a missing timing gate.
