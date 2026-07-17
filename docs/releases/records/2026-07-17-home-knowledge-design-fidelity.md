# 2026-07-17-home-knowledge-design-fidelity — Home Knowledge Design Fidelity

## Release ID

`2026-07-17-home-knowledge-design-fidelity`

## Status

`candidate`

## Plain-English Summary

This release aligns the Meridian Home / Knowledge surface to the approved Nexus Home Knowledge HTML design contract. It restores the Home overview as a boardroom-style enterprise brief instead of a dimension-detail page, renders Claude-authored consultant-grade content from the approved design pack without renderer rewrites, adds visual-block rendering for chart/dashboard-ready content, and produces a rendered-content map for audit.

## Layer Impact

- `global-control-lane`: updates the Home / Knowledge presentation component that renders the approved design contract.
- `client-data-lane`: refreshes the Meridian approved Home Knowledge design pack with Claude-generated executive-consultant content for weak dimension summaries.
- `public-demo`: improves the demo-safe Healthcare Demo / Meridian Home Knowledge experience.
- Audit/reporting: adds prompt/response evidence and rendered-value mapping for each visible Home component.

## Client Applicability

- All clients: No.
- Specific clients: Meridian Health / Healthcare Demo Home Knowledge path.
- Internal only: No.
- Public/demo only: Demo-safe Meridian content.
- Feature flag: None.

## Changes Included

- `src/components/home/HomeKnowledgeDesignContractSurface.tsx`
- `src/lib/home/home-knowledge-design-contract.ts`
- `datasets/tenant-inputs/meridian-health/approved-content/home/design-contract-pack.json`
- `datasets/context-artifacts/approved/meridian-health/home-knowledge/approved-home-knowledge-design-contract-pack.json`
- `reports/home-knowledge-design-contract/claude-repair/`
- `reports/home-knowledge-design-contract/rendered-content-map.md`
- `reports/home-knowledge-design-contract/rendered-content-map.json`
- Home design-contract audit reports under `reports/home-knowledge-design-contract-ui-wiring/`

## QA / Validation

- `npx eslint src/components/home/HomeKnowledgeDesignContractSurface.tsx src/lib/home/home-knowledge-design-contract.ts` — passed.
- `npm run audit:home-knowledge-design-contract-ui` — passed.
- `npm run audit:home-dimension-story-claims` — passed.
- `npm run audit:home-dimension-data-tab` — passed.
- `npm run audit:home-dimension-evidence-tab` — passed.
- `npm run audit:approved-content-path-convergence` — passed.
- `git diff --check` — passed.
- TypeScript compile will be rerun after final patching before merge.

## Rollout Plan

Merge through the protected PR path. The repo-owned ACA main deploy workflow will build and deploy the resulting main SHA to `ca-abarva-web-lab-eastus`. After deploy, run the ACA runtime invariant, health check, and signed-in Meridian Home browser proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: No ad-hoc runtime mutation in this release.
- Approved image digest: Assigned by ACA main deploy workflow after merge.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Not changed.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Meridian Home / Knowledge.

## Rollback Plan

Revert the PR and redeploy the previous main revision through the ACA main deploy workflow. Since this release changes static approved content and UI rendering only, rollback does not require schema or data-plane migration rollback.

## Audit Evidence

- Claude prompt: `reports/home-knowledge-design-contract/claude-repair/meridian-content-repair-prompt.txt`
- Claude raw response: `reports/home-knowledge-design-contract/claude-repair/meridian-content-repair-raw-response.json`
- Claude parsed response: `reports/home-knowledge-design-contract/claude-repair/meridian-content-repair-response.txt`
- Rendered-value map: `reports/home-knowledge-design-contract/rendered-content-map.md`
- Design-contract proof: `reports/home-knowledge-design-contract-ui-wiring/summary.md`

## Known Gaps

Not live-proven until merged, deployed, and signed-in browser verified on `https://app.abarva.ai/home?client=meridian-health`.
