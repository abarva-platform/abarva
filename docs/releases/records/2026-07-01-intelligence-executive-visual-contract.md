# 2026-07-01-intelligence-executive-visual-contract — Intelligence Executive Visual Contract

## Release ID

`2026-07-01-intelligence-executive-visual-contract`

## Status

`candidate`

## Plain-English Summary

The Intelligence companion canvas now supports AbarVa-native executive exhibits. Claude can choose a governed `abarva-canvas` payload for sequencing, value/readiness, gate-to-value, or proof-boundary visuals; the renderer draws the exhibit consistently and hides the machine payload from the UI. Markdown-table visuals remain as a fallback.

## Layer Impact

- `global-control-lane`: Updates the shared Intelligence v2 answer contract and right-canvas renderer for all tenants using the executive canvas.

## Client Applicability

- All clients: Yes, for tenants using the Intelligence v2 canvas.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Intelligence v2 routing only; no new flag.

## Changes Included

- `src/lib/intelligence/tabbed-response.ts`: documents the governed `abarva-canvas` payload, requires one native exhibit for strategic prioritization / sequencing / gate / value-readiness questions when structured content exists, and preserves Chart tabs that contain structured canvas data.
- `src/lib/intelligence/executive-canvas-payload.ts`: adds parser/normalizer for supported executive canvas payloads.
- `src/lib/intelligence/intelligence-consultant-text-synthesis.ts`: allows the governed `abarva-canvas` payload as the only JSON exception, avoiding a prompt conflict that pushed Claude back to plain Markdown tables.
- `src/components/intelligence-v2/IntelligenceV2Surface.tsx`: renders native sequencing, value/readiness matrix, gate-to-value roadmap, and proof-boundary exhibits while hiding raw payload JSON.
- Focused parser and UI tests for payload extraction, tab preservation, native rendering, and no marker/payload leakage.

## QA / Validation

- `./node_modules/.bin/jest src/lib/intelligence/__tests__/executive-canvas-payload.test.ts src/lib/intelligence/__tests__/tabbed-response.test.ts src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx --runInBand` passed.
- `npx eslint src/lib/intelligence/executive-canvas-payload.ts src/lib/intelligence/tabbed-response.ts src/components/intelligence-v2/IntelligenceV2Surface.tsx src/lib/intelligence/__tests__/executive-canvas-payload.test.ts src/lib/intelligence/__tests__/tabbed-response.test.ts src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx` passed.

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main deploy workflow, then run signed-in SkyHarbor and Industrial/Lakeshore Intelligence smoke proof against `app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: Repo-owned ACA main deploy only.
- Approved image digest: To be captured after ACA deployment.
- ACA runtime invariant: Template image and 100% traffic revision must match the approved digest.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this UI/contract release and redeploy the prior approved ACA image. No data migration or tenant data rollback is required.

## Audit Evidence

- PR URL, CI result, ACA revision, image digest, signed-in browser proof, and screenshots to be added after rollout.

## Known Gaps

- This slice adds four native exhibit families. Additional exhibit families such as vendor concentration maps and process reinvention maps remain future extensions of the same contract.
