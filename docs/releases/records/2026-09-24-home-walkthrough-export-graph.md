# 2026-09-24-home-walkthrough-export-graph — Home Walkthrough Export And Graph Synthesis

## Release ID

`2026-09-24-home-walkthrough-export-graph`

## Status

`candidate`

## Plain-English Summary

Home gains a full walkthrough export route for the rendered Home record and a deterministic relationship-path summary for cross-family executive findings. The export is explicitly scoped as a Home walkthrough, not an assistant chat transcript, and carries the same record-source label and canonical marker shown on the page.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Updates the Home product surface, rail actions, deterministic chapter depth, and export endpoint.
- Canonical model projection: Reads the existing served Home bundle and reviewed snapshot fallback; no canonical objects, tenant data, or governed data generation are changed.

## Client Applicability

- All clients: Home users receive the export action and deterministic relationship-path synthesis when the Home bundle contains the supporting record families.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Adds `/api/home/walkthrough-export` for HTML and PDF Home walkthrough exports.
- Adds server-side export rendering for Home chapters, deterministic tables, findings, evidence labels, exhibit summaries, and record-source state.
- Adds Home rail export links for HTML and PDF.
- Adds deterministic relationship-backed exposure-path tables and findings from already served Home relationship rows and exact matched endpoints.
- Adds focused tests for export scope and cross-family relationship synthesis.

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/components/home/v4/__tests__/cross-family-findings.test.ts src/lib/home/export/__tests__/walkthrough-export.test.tsx`
- Pass: `npx eslint src/components/home/v4/HomeV4App.tsx src/components/home/v4/Rail.tsx src/components/home/v4/chapter-page-content.ts src/components/home/v4/page-tables.ts src/components/home/v4/__tests__/cross-family-findings.test.ts src/lib/home/export/walkthrough-export.tsx src/lib/home/export/__tests__/walkthrough-export.test.tsx src/app/api/home/walkthrough-export/route.ts`
- Pass: `git diff --check`
- Pending: `npm run typecheck`
- Pending: `npm run release:check`
- Not run yet: signed-in production proof, required after deployment before calling the release live.

## Rollout Plan

Merge through a pull request to `main`, then deploy through the repo-owned Azure Container Apps main deploy workflow. Verify the digest-pinned runtime invariant and signed-in Home browser behavior after deployment.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Captured from the deploy workflow after merge.
- ACA runtime invariant: Required before live claim.
- Worker image invariant: Required before live claim.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for Home record-source label, rail counts, export links, export endpoint responses, and relationship-backed synthesis visibility.

## Rollback Plan

Revert the merge commit and redeploy through the repo-owned Azure Container Apps main deploy workflow. No data rollback is required because this release only changes Home rendering/export code and reads existing projection data.

## Audit Evidence

- Pull request URL and commit SHA.
- CI/check output from the pull request.
- Azure Container Apps deploy run URL, digest, and runtime invariant proof.
- Signed-in Home browser proof after deployment.
- Export endpoint proof for HTML and PDF responses.

## Known Gaps

The PDF export is optimized for a portable walkthrough and summarizes very large deterministic tables rather than embedding every possible row. The HTML export preserves the fuller walkthrough content and table details.
