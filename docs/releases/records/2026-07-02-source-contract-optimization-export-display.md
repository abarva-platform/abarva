# 2026-07-02-source-contract-optimization-export-display — Source Contract Optimization Export Display

## Release ID

`2026-07-02-source-contract-optimization-export-display`

## Status

`candidate`

## Plain-English Summary

This release fixes the Source AMS contract optimization route family so the DOCX, PDF, Markdown export metadata, visible aVa answers, and hidden answer context use the same client-facing identity as the live Source page: `SkyHarbor Air`, `SKYH-AMS-CONTRACT-OPT-2026`, and the AMS contract optimization title.

## Layer Impact

- `global-control-lane`: adjusts Source contract optimization export metadata and Source ask-route context assembly used by aVa answers.
- `public-demo`: keeps the SkyHarbor AMS contract optimization demo exports aligned with the signed-in Source page and aVa answers.

## Client Applicability

- All clients: no broad data or workflow change; the route-level metadata fix is shared but only applies when the contract optimization export route is available.
- Specific clients: SkyHarbor Source AMS contract optimization demo path.
- Internal only: no.
- Public/demo only: yes for the synthetic SkyHarbor proof path.
- Feature flag: none.

## Changes Included

- `src/app/api/v1/source/[eventId]/contract-optimization/brief/route.ts`: uses a client-facing contract optimization display identity for export payloads and response metadata.
- `src/app/api/v1/source/[eventId]/nexus/ask/route.ts`: normalizes the live contract optimization event detail and tenant display before assembling aVa answer context.
- `src/__tests__/integration/source/source-nexus-route-tenant-scope.test.ts`: adds regression guards that export and ask routes do not inherit the lab account display label or old RFP identity.

## QA / Validation

- Pass: Focused Jest for Source answer engine, contract optimization MVE, Source canvas render, profile panel, and tenant/export route tests (`5` suites / `99` tests before ask-route context follow-up; rerun required after follow-up).
- Pass: Scoped ESLint on touched code files; Markdown release record was ignored by ESLint configuration as expected.
- Pass: Full TypeScript check.
- Pass: `git diff --check`.
- Pending: `npm run release:check` after release-record template correction.
- Pending: Post-deploy signed-in Source proof against `https://app.abarva.ai/source/events/SKYH-AMS-CONTRACT-OPT-2026?stage=responses`, including aVa answers, DOCX/PDF/Markdown text inspection, and hidden API context scan.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main workflow, confirm 100% traffic on the merged SHA, then rerun signed-in Source proof on the SkyHarbor contract optimization event.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the approved ACA deploy workflow.
- Approved image digest: assigned by the ACA deploy workflow after merge.
- ACA runtime invariant: verify active revision, 100% traffic, image digest, and `/api/health`.
- Worker image invariant: handled by the ACA deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy through the same ACA main workflow. No schema or data-plane migration is included.

## Audit Evidence

To be added after merge/deploy: PR URL, CI run, ACA deploy run, active revision/digest, signed-in proof folder, screenshots, and exported DOCX/PDF/Markdown files.

## Known Gaps

Full visual rendering of DOCX/PDF depends on local document rendering tools. If those tools are unavailable in the operator environment, the proof should include endpoint checks plus text extraction checks and state the render limitation plainly.
