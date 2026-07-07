# 2026-06-22-moves-architecture-diagram-polish — Architecture Diagram Text Fit

## Release ID

`2026-06-22-moves-architecture-diagram-polish`

## Status

`candidate`

## Plain-English Summary

Architecture deliverables already render the required visual exhibits, but visual QA on the SkyHarbor canary showed that the first workflow diagram could clip a long label at the left edge. This release gives timeline-style diagrams safer side gutters and wraps labels/details inside the SVG, so the executive artifact reads like a polished client deliverable instead of a technically-valid diagram with edge clipping.

## Layer Impact

- `global-control-lane`: Updates the shared architecture HTML renderer used by Moves deliverable generation. No schema, tenant data, or client-specific seed data changes are included.

## Client Applicability

- All clients: Any client receiving the Architecture visual artifact benefits from the safer SVG text layout.
- Specific clients: SkyHarbor is the canary proof client.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/visual-system/architecture-html-renderer.ts` wraps timeline labels/details with SVG `tspan` elements and increases diagram gutters/spacing.
- `src/lib/visual-system/__tests__/architecture-generation.test.ts` adds a regression assertion for the previously clipped SkyHarbor workflow label.

## QA / Validation

- PASS: `npx jest src/lib/visual-system/__tests__/architecture-generation.test.ts --runInBand`
- PASS: `npx eslint src/lib/visual-system/architecture-html-renderer.ts src/lib/visual-system/__tests__/architecture-generation.test.ts`
- Pending before release: `npm run release:check`
- Pending before release: production-lab deployment and VNet canary regeneration for the SkyHarbor architecture artifact.

## Rollout Plan

Merge to `main`, let the Azure Container Apps deploy workflow build the new image, then update the production-lab deliverable worker jobs to the same image digest as the web revision. Rerun the SkyHarbor architecture canary through the VNet-visible worker and verify the persisted artifact has the required visual exhibits with no quarantine reason.

## Deployment Authority

- Repo-owned deploy workflow: GitHub Actions deployment from `main`.
- Shared runtime mutators: Azure Container Apps web app and deliverable worker jobs.
- Approved image digest: Pending deployment.
- ACA runtime invariant: Web revision and deliverable worker jobs must use the same digest before canary proof is accepted.
- Worker image invariant: `job-abarva-deliv-worker` and `job-abarva-deliv-worker-event` updated to the active web digest.
- Feature/env flag update path: None.
- Live signed-in proof required: VNet production-lab artifact readback is required; browser signed-in proof is optional for this renderer-only fix.

## Rollback Plan

Revert this release commit and redeploy the prior ACA image. Existing generated artifacts remain as historical rows; regenerate any affected architecture artifacts after rollback only if operators need a pre-fix rendering.

## Audit Evidence

- PR: Pending.
- CI: Pending.
- Deployment revision/digest: Pending.
- Canary run/artifact: Pending.
- Visual evidence: Local screenshot from copied SkyHarbor artifact showed the clipped label before this fix; post-deploy canary must provide the replacement proof.

## Known Gaps

Native DOCX/PDF export of embedded architecture diagrams remains out of scope for this release.
