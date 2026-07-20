# 2026-07-20-source-artifact-standards-export — Source Artifact Standards CSV Export

## Release ID

`2026-07-20-source-artifact-standards-export`

## Status

`candidate`

## Plain-English Summary

The Source Files workspace now lets users export the full artifact standards
matrix as CSV. The export covers every canonical Source artifact by phase,
including workshop/session outputs, prompt/model/token constraints, required
exhibits, page guidance, evidence/source-register controls, current lifecycle
state, and the governance rule that AI-prepared drafts require human review
before a client-final artifact is accepted back as the final record.

## Layer Impact

- `global-control-lane`: Adds a deterministic client-side CSV export command to
  the redesigned Source Files workspace.
- `client-data-lane`: No schema, migration, query, or write-path change. The
  CSV is generated from the same in-memory lifecycle rows already rendered in
  the Files matrix.

## Client Applicability

- All clients: Yes, for Source events using the redesigned Source Files
  workspace.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/artifact-lifecycle-matrix.ts`: exports a CSV builder for the
  canonical artifact standards matrix.
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`: adds the
  `Export standards CSV` command in the Files artifact lifecycle panel.
- Focused tests cover CSV content and UI wiring.

## QA / Validation

- PASS: `npx jest src/lib/source/__tests__/artifact-lifecycle-matrix.test.ts src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx --runInBand`.
- PASS: `npx eslint src/lib/source/artifact-lifecycle-matrix.ts src/lib/source/__tests__/artifact-lifecycle-matrix.test.ts src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx`.
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`.
- PASS: `npm run release:check`.
- PENDING: PR checks for `https://github.com/abarva-platform/abarva/pull/5117`.
- PENDING: ACA deploy and signed-in Source Files proof after merge.

## Rollout Plan

Open a PR, merge to `main`, deploy through the repo-owned Azure Container Apps
main deploy workflow, verify the ACA runtime invariant, then run signed-in
Source Files proof that the export command is visible and contains the expected
governance columns.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this release.
- Approved image digest: To be produced by the ACA main deploy workflow.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment per shared runbook.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source Files workspace.

## Rollback Plan

Revert the PR and redeploy the prior healthy main revision through the ACA main
deploy workflow. No data rollback is required.

## Audit Evidence

- PR URL: `https://github.com/abarva-platform/abarva/pull/5117`.
- Local validation: To be added before PR.
- ACA deployment run: To be added after merge.
- Signed-in screenshot: To be added after deployment.

## Known Gaps

This slice exports the artifact standards matrix. It does not add XLSX styling,
server-side audit storage for exports, or a separate artifact-generation prompt
redesign.
