# 2026-06-01-source-vendor-recommendation-controls — Source Vendor Recommendation Controls

## Release ID

`2026-06-01-source-vendor-recommendation-controls`

## Status

`candidate`

## Plain-English Summary

The Source Award tab now shows explicit AI-assisted vendor recommendation controls. The recommended vendor is labeled as AI-assisted decision support, shows a confidence tier and rationale, lists the evidence basis, keeps risk caveats visible, and states that award, notification, or contract commitment still requires human committee approval.

## Layer Impact

Global control lane. This changes shared Source control-plane rendering for the award recommendation surface and expands the AI surface-control audit catalog.

## Client Applicability

- All clients: Applies to Source award recommendation surfaces that render the shared Source event detail Award tab.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/source/award-decision-view.ts` adds recommendation accountability metadata for the Source award decision view model.
- `src/components/source/SourceEventDetailPage.tsx` renders AI label, confidence, evidence basis, risk caveats, and human approval boundary near the award recommendation.
- `docs/security/ai-surface-control-catalog.json` adds the Source Award tab recommendation surface to the audit catalog.
- `scripts/audit/ai-surface-control-catalog.mjs` accepts the `risk-caveat` control kind.
- `src/__tests__/integration/source/source-src46-award-decision.test.ts` covers the new model and static rendering controls.

## QA / Validation

- Pass: `npx jest src/__tests__/integration/source/source-src46-award-decision.test.ts --runInBand`
- Pass: `npm run audit:ai-surface-controls`
- Pass: `npx eslint src/components/source/SourceEventDetailPage.tsx src/lib/source/award-decision-view.ts scripts/audit/ai-surface-control-catalog.mjs`
- Pass: `./node_modules/.bin/tsc --noEmit --pretty false`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Pass: `git diff --check`

## Rollout Plan

Merge to `main`. The visible controls become active on the next Vercel deployment for Source award recommendation surfaces.

## Rollback Plan

Revert the PR to remove the Source award recommendation accountability metadata, rendering, catalog entry, and tests. No migration rollback is required.

## Audit Evidence

- PR URL: pending.
- Local validation output: focused Jest, focused ESLint, TypeScript, AI surface catalog audit, release check, and diff whitespace check passed locally on 2026-06-01.
- CI evidence: pending.

## Known Gaps

This slice covers the Source Award tab vendor recommendation surface. Broader Source recommendation surfaces, exports, and any external-action gate persistence remain separate backlog work.
