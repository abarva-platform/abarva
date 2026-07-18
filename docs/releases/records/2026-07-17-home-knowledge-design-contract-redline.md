# 2026-07-17-home-knowledge-design-contract-redline — Home Knowledge Design Contract Redline

## Release ID

`2026-07-17-home-knowledge-design-contract-redline`

## Status

`candidate`

## Plain-English Summary

This release tightens Meridian Home / Knowledge so the route follows the supplied `Nexus Home Knowledge.html` design contract page by page and tab by tab. The primary Home experience is the executive Knowledge surface: Enterprise Brief, Evidence Gaps, Use Cases, Proof, Context Confidence, and dimension tabs for Overview, Data, Relationships, Gaps, and Evidence. The renderer consumes the approved Meridian design-contract pack and removes remaining off-contract visual render paths from dimension overview.

## Layer Impact

- `global-control-lane` / Product UI: Updates the Home Knowledge design-contract renderer to align with the approved executive briefing design.
- `client-data-lane` / Tenant content: Updates the approved Meridian Home design-contract packs with the design facts, KPIs, hero summary, boardroom brief, and evidence counts expected by the supplied design.
- `global-control-lane` / QA proof harness: Updates Home CXO story quality checks so they validate the design-contract surface rather than retired HomeSurface labels.

## Client Applicability

- All clients: No broad runtime behavior change.
- Specific clients: Meridian Health / Healthcare Demo Home Knowledge route when the design-contract pack is active.
- Internal only: No.
- Public/demo only: Demo-safe Meridian Home Knowledge surface.
- Feature flag: Existing Home routing and tenant pack availability determine activation; this release does not add a new flag.

## Changes Included

- `src/components/home/HomeKnowledgeDesignContractSurface.tsx`
- `datasets/tenant-inputs/meridian-health/approved-content/home/design-contract-pack.json`
- `datasets/context-artifacts/approved/meridian-health/home-knowledge/approved-home-knowledge-design-contract-pack.json`
- `scripts/audit/home-knowledge-design-contract-ui.mjs`
- `scripts/knowledge/audit-home-cxo-story-quality.ts`
- Generated proof reports under `reports/home-knowledge-design-contract-ui-wiring/` and `reports/home-cxo-story-quality/`

## QA / Validation

- `npx eslint src/components/home/HomeKnowledgeDesignContractSurface.tsx scripts/audit/home-knowledge-design-contract-ui.mjs scripts/knowledge/audit-home-cxo-story-quality.ts` — passed.
- `npm run audit:home-knowledge-design-contract-ui` — passed with 19 dimensions, 3,987 data rows, and 94 gaps.
- `npm run audit:home-cxo-story-quality` — passed with 11/11 story and 9/9 visual criteria.
- `git diff --check` — passed.

## Rollout Plan

Open a PR, squash merge to main, and let the repo-owned Azure Container Apps main deploy workflow build and deploy the exact merged SHA. After the ACA deploy completes, verify the runtime invariant, health, and a signed-in Meridian Home browser proof.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this PR.
- Approved image digest: To be captured after main deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: Not changed.
- Live signed-in proof required: Yes, Meridian Home `/home` with the Knowledge design-contract route.

## Rollback Plan

Revert the PR and redeploy the prior healthy main SHA through the repo-owned ACA main deploy workflow. No migration rollback is required because this release changes UI, approved content artifacts, and audits only.

## Audit Evidence

- `reports/home-knowledge-design-contract-ui-wiring/summary.md`
- `reports/home-knowledge-design-contract-ui-wiring/rendered-component-map.csv`
- `reports/home-cxo-story-quality/summary.md`
- `reports/home-cxo-story-quality/home-cxo-story-proof.html`
- Post-merge ACA revision, runtime invariant, health check, and signed-in screenshot proof to be added after deploy.

## Known Gaps

Not yet merged, deployed, or signed-in browser-proven at candidate time.
