# 2026-05-31-atlas-copilot-value-surface — Atlas Copilot Usage/Value Surface Hardening

## Release ID

`2026-05-31-atlas-copilot-value-surface`

## Status

`candidate`

## Plain-English Summary

Atlas now handles CIO-style Copilot usage/value questions on a deterministic Tower-grounded path, including the common typo `copiplot`. The lagging-programs answer now ranks loaded initiatives by measured value divided by committed annual value instead of saying the value-ranking tool is missing. The Tower chat client timeout was also raised so live model turns do not falsely show a timeout while production Claude is still responding.

## Layer Impact

- `global-control-lane`: updates shared Atlas intent routing and Tower chat behavior for all tenants.
- `qa-validation-lane`: adds classifier and timeout contract tests, plus a comprehensive production harness/report for Apex Retail, Meridian Health, and SkyHarbor.
- `client-data-lane`: read-only use of existing Tower initiative/value facts; no schema, seed, or tenant data writes.

## Client Applicability

- All clients: yes.
- Specific clients: production validation covers Apex Retail, Meridian Health, and SkyHarbor.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/atlas/classifier.ts`: routes Copilot usage/value and typo variants to a scripted path.
- `src/lib/atlas/scripted-engine.ts`: adds Copilot usage/value response and real measured/commit lagging-program ranking from Tower current state.
- `src/lib/atlas/scripted-engine.ts`: removes internal tool/UUID language from CXO-facing scripted answers.
- `src/components/tower/TowerIndexPage.tsx` and `src/components/atlas/AtlasRail.tsx`: raise Atlas client timeout to 45 seconds.
- `src/lib/atlas/classifier.test.ts`, `src/components/atlas/__tests__/atlas-timeout-contract.test.ts`, and `src/lib/atlas/__tests__/scripted-cxo-language.test.ts`: regression coverage.
- `scripts/qa/atlas-prod-comprehensive-surface.ts`: production three-tenant login/question/probe/logout harness.

## QA / Validation

- Pass: `npx jest src/lib/atlas --runInBand` (213 tests passed; existing duplicate manual mock warnings remain).
- Pass: `npx tsc --noEmit --pretty false`.
- Pass: `npx eslint src/lib/atlas/classifier.ts src/lib/atlas/scripted-engine.ts src/components/tower/TowerIndexPage.tsx src/components/atlas/AtlasRail.tsx src/lib/atlas/classifier.test.ts src/components/atlas/__tests__/atlas-timeout-contract.test.ts src/lib/atlas/__tests__/scripted-cxo-language.test.ts scripts/qa/atlas-prod-comprehensive-surface.ts`.
- Pass: `git diff --check`.
- Pass: production comprehensive surface harness against `https://app.abarva.ai` after deploy settled; 45/45 turns passed across Apex Retail, Meridian Health, and SkyHarbor; 0 fallback, 0 tenant leaks, 0 timeout copy, 0 weak internal-tool language; 3/3 clean login/Tower/cross-tenant-probe/logout sessions.

## Rollout Plan

Merge to main after CI passes, allow the normal Vercel production deployment, then run the comprehensive surface harness against settled production.

## Rollback Plan

Revert the PR. This restores the previous LLM fallback path for typoed Copilot usage/value asks and the previous 18-second UI timeout.

## Audit Evidence

- PR URL and CI checks.
- Production harness raw and HTML report under `reports/2026-05-31-atlas-prod-comprehensive-surface/`.

## Known Gaps

Per-gate-risk scoring remains a separate product capability; this change improves current grounded answers and timeout behavior without inventing a new program-gates data model.
