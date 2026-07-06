# 2026-07-06-intelligence-surface-executive-briefing — Intelligence Executive Briefing Surface

## Release ID

`2026-07-06-intelligence-surface-executive-briefing`

## Status

`candidate`

## Plain-English Summary

This release upgrades the Intelligence page from a simple advisory-board layout into a two-zone executive briefing surface. The left side is the aVa analyst conversation, backed by the existing Intelligence ask route and Claude synthesis. The right side is a deterministic executive briefing canvas with tabs for Answer, Industry Signal, Trends, Plays, and Evidence. The right side uses the selected tenant briefing section as the source of visible data and as the surface context sent to the model.

## Layer Impact

- `global-control-lane`: Changes shared Intelligence UI rendering and the Intelligence ask route trace plumbing for all authenticated clients.
- `client-data-lane`: No schema or data migration. The surface reads existing tenant briefing/context data and passes selected facts to the ask route as bounded surface context.

## Client Applicability

- All clients: Yes. The Intelligence route receives the new two-zone rendering pattern.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Rebuilt `src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx` around the executive briefing design.
- Rebuilt `src/components/intelligence-advisory/AdvisoryIntelligencePage.module.css` for the two-zone analyst/briefing layout.
- Added trace-enabled request plumbing to `src/app/api/intelligence/ask/route.ts`.
- Added the missing shared visible-output contract modules used by the universal chat route.
- Added UI regression coverage in `src/components/intelligence-advisory/__tests__/AdvisoryIntelligencePage.test.tsx`.
- Extended ask route telemetry coverage in `src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts`.
- Added direct-display surface coverage in `src/lib/agent/__tests__/display-text.test.ts`.

## QA / Validation

- Pass: `npx jest src/components/intelligence-advisory/__tests__/AdvisoryIntelligencePage.test.tsx --runInBand`
- Pass: `npx jest src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts --runInBand`
- Pass: `npx jest src/lib/agent/__tests__/display-text.test.ts --runInBand`
- Pass: `npx eslint src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx src/app/api/intelligence/ask/route.ts src/components/intelligence-advisory/__tests__/AdvisoryIntelligencePage.test.tsx src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts src/lib/agent/display-text.ts src/lib/agent/visible-answer-contract.ts src/lib/agent/__tests__/display-text.test.ts`
- Pass: `npm run release:check`
- Not run yet: signed-in Azure browser proof. Required after ACA deployment.
- Not run yet: live Claude/aVa response accuracy proof. Required after ACA deployment using signed-in tenant context.

## Rollout Plan

Deploy through the approved Azure Container Apps lane for `app.abarva.ai`: build a digest-pinned image from the exact commit SHA, update `ca-abarva-web-lab-eastus`, wait for the new revision to become healthy, move 100% ingress traffic to that revision, and run signed-in browser/API proof.

## Rollback Plan

Move ACA traffic back to the previous healthy revision. No migration rollback is required because this release does not change database schema or loaded tenant data.

## Audit Evidence

- Focused Jest and ESLint outputs in the operator log.
- Release record: `docs/releases/records/2026-07-06-intelligence-surface-executive-briefing.md`
- Post-deploy evidence to be added after Azure verification: ACA revision, image digest, signed-in screenshots, API trace snippets, Claude response/render comparison.

## Known Gaps

- The right briefing canvas is deterministic from the existing tenant briefing model. Deeper V7-derived Intelligence read-model binding remains a follow-on unless already supplied by the page view model.
- Signed-in production proof and live Claude prompt/response accuracy proof remain pending until deployment completes.
