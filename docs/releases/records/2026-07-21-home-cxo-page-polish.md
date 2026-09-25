# 2026-07-21-home-cxo-page-polish — Home CXO Page Polish

## Release ID

`2026-07-21-home-cxo-page-polish`

## Status

`released`

## Plain-English Summary

Polishes the Home / Knowledge executive pages so they read more like a CXO context cockpit and less like a raw data inventory. The Enterprise Brief now leads with the boardroom read, selected traceable facts, and context concentration before lower-level exploration cards. The Use Cases page fixes a chart overflow defect that caused the Recharts visual to overlap cards and text.

## Layer Impact

- `global-control-lane`: Updates shared Home Knowledge UI rendering for approved design-contract packs.
- `public-demo`: Improves the signed-in demo experience for tenant Knowledge pages.

## Client Applicability

- All clients: Any tenant using the Home Knowledge design-contract surface receives the layout and chart containment fixes.
- Specific clients: Meridian / Healthcare Demo is the current visual proof target because the reported screenshots came from that tenant.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/home/HomeKnowledgeDesignContractSurface.tsx`
  - Reorders Enterprise Brief content toward executive narrative before exploration scaffolding.
  - Limits at-a-glance facts to selected traceable facts.
  - Constrains the Use Cases Recharts container so bars cannot overlap priority cards.
  - Makes use-case cards responsive and text-safe.

## QA / Validation

- pass — `npx eslint src/components/home/HomeKnowledgeDesignContractSurface.tsx`
- pass — `npm test -- --runTestsByPath src/components/home/__tests__/HomeSurface.test.tsx src/components/home/__tests__/buildRelationshipTopology.test.ts --runInBand` (21/21 tests passed; Jest emitted existing duplicate manual mock warnings)
- pass — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- pass — PR #5241 checks passed 21/21.
- pass — ACA main deploy run `29873867356` completed successfully for SHA `dcb827b7d9e5991df028da4242c28c33dba1f0d8`.
- pass — production health endpoint returned `ok: true` with Postgres checks green.
- pass — signed-in Meridian / Healthcare Demo Enterprise Brief screenshot captured at `proof/home-cxo-page-polish-20260721/meridian-enterprise-brief.png`.
- pass — signed-in Meridian / Healthcare Demo Use Cases screenshot captured at `proof/home-cxo-page-polish-20260721/meridian-use-cases.png`.
- pass — live DOM layout check: no horizontal overflow, no chart/card overlap, no chart/table overlap, 1 Recharts visual, 5 priority cards.

## Rollout Plan

Merged via PR #5241 to `main`, deployed through the repo-owned ACA main lane, and live-proven on `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: `acrabarvalab001.azurecr.io/abarva/web@sha256:71ad18673558a0c39b69e810a39b2368078a81f7e5b4b69f7fea6e2505da7ee9`
- ACA runtime invariant: pass — web template and 100% traffic revision `ca-abarva-web-lab-eastus--mdcb827b7` serve the approved digest.
- Worker image invariant: pass for delivery workers `job-abarva-deliv-worker` and `job-abarva-deliv-worker-event`; migration/copy/private-operator jobs are separate operator images.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Completed for Meridian / Healthcare Demo.

## Rollback Plan

Revert the PR and redeploy the previous digest through the ACA main lane if the Home page layout regresses.

## Audit Evidence

- PR URL: `https://github.com/abarva-platform/abarva/pull/5241`
- Merge SHA: `dcb827b7d9e5991df028da4242c28c33dba1f0d8`
- ACA deploy run: `https://github.com/abarva-platform/abarva/actions/runs/29873867356`
- ACA revision: `ca-abarva-web-lab-eastus--mdcb827b7`
- Image digest: `sha256:71ad18673558a0c39b69e810a39b2368078a81f7e5b4b69f7fea6e2505da7ee9`
- Live proof JSON: `proof/home-cxo-page-polish-20260721/results.json`
- Live screenshots:
  - `proof/home-cxo-page-polish-20260721/meridian-enterprise-brief.png`
  - `proof/home-cxo-page-polish-20260721/meridian-use-cases.png`

## Known Gaps

The page is no longer broken or overlapping, but the Use Cases chart remains a utilitarian bar exhibit rather than a fully art-directed consulting-style visual. A follow-up design pass should improve exhibit language, labels, and visual hierarchy across all Home tabs.
