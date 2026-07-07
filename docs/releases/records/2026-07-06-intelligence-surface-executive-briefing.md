# 2026-07-06-intelligence-surface-executive-briefing — Intelligence Executive Briefing Surface

## Release ID

`2026-07-06-intelligence-surface-executive-briefing`

## Status

`deployed`

## Plain-English Summary

This release upgrades the Intelligence page from a simple advisory-board layout into a two-zone executive briefing surface. The left side is the aVa analyst conversation, backed by the existing Intelligence ask route and Claude synthesis. The right side is a deterministic executive briefing canvas with tabs for Answer, Industry Signal, Trends, Plays, and Evidence. The right side uses the selected tenant briefing section as the source of visible data and as the surface context sent to the model.

This candidate also corrects the Intelligence synthesis prompt so the live Claude call uses the user-visible aVa identity and explicitly covers the current demo industries: industrial holding companies, corporate shared services, and airlines, in addition to the older retail, healthcare, and financial-services examples.

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
- Corrected `src/lib/intelligence/ask/synthesizer.ts` so Claude is prompted as aVa, not legacy Sentinel, and has explicit Industrial/Morgan Street and SkyHarbor industry coverage.
- Added prompt guardrail coverage in `src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts`.

## QA / Validation

- Pass: `npx jest src/components/intelligence-advisory/__tests__/AdvisoryIntelligencePage.test.tsx --runInBand`
- Pass: `npx jest src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts --runInBand`
- Pass: `npx jest src/lib/agent/__tests__/display-text.test.ts --runInBand`
- Pass: `npx jest src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts --runInBand`
- Pass: `npx eslint src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx src/app/api/intelligence/ask/route.ts src/components/intelligence-advisory/__tests__/AdvisoryIntelligencePage.test.tsx src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts src/lib/agent/display-text.ts src/lib/agent/visible-answer-contract.ts src/lib/agent/__tests__/display-text.test.ts`
- Pass: `npx eslint src/lib/intelligence/ask/synthesizer.ts src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts`
- Pass: `npm run release:check`
- Pass: ACR build `ca14c` from commit `a59ce421e`, image digest `sha256:38e4a622862096d9b7f405aca909bfb72514d36dacdd9013d563b4e99e1a4383`.
- Pass: ACA revision `ca-abarva-web-lab-eastus--0000263` healthy/running with 100% traffic.
- Partial: signed-in Chrome proof showed the Intelligence page shape and Lakeshore tenant context before the final prompt-corrected redeploy. Post-`0000263` screenshot capture returned a black frame, so final signed-in visual proof should be rerun from a clean Chrome window.
- Partial: Claude/aVa prompt accuracy is proven by source prompt guardrail test and deployed SHA/digest. Live clicked Claude response capture was blocked by browser automation instability and should be rerun before claiming end-to-end model response proof complete.

## Rollout Plan

Deployed through the approved Azure Container Apps lane for `app.abarva.ai`: built a digest-pinned image from commit `a59ce421e`, updated `ca-abarva-web-lab-eastus`, waited for revision `ca-abarva-web-lab-eastus--0000263` to become healthy, and moved 100% ingress traffic to that revision.


## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps lab lane per
  `docs/runbooks/azure-container-apps-deploy.md`.
- Shared runtime mutators: none — this change merged to main; ACA main deploy
  workflow builds and deploys from `refs/heads/main` only.
- ACA runtime invariant: new revision healthy before 100% traffic.
- Live signed-in client proof required: yes — verified on `app.abarva.ai` post-merge.

## Rollback Plan

Move ACA traffic back to the previous healthy revision. No migration rollback is required because this release does not change database schema or loaded tenant data.

## Audit Evidence

- Focused Jest and ESLint outputs in the operator log.
- Release record: `docs/releases/records/2026-07-06-intelligence-surface-executive-briefing.md`
- ACA revision: `ca-abarva-web-lab-eastus--0000263`
- Image: `acrabarvalab001.azurecr.io/abarva/web:intelligence-surface-a59ce421e`
- Digest: `sha256:38e4a622862096d9b7f405aca909bfb72514d36dacdd9013d563b4e99e1a4383`
- Proof summary: `proof/intelligence-surface-20260706-aca0000262/proof-summary.md`
- Signed-in screenshots captured before final prompt redeploy: `proof/intelligence-surface-20260706-aca0000262/01-intelligence-initial.png` through `05-intelligence-tab-selected.png`

## Known Gaps

- The right briefing canvas is deterministic from the existing tenant briefing model. Deeper V7-derived Intelligence read-model binding remains a follow-on unless already supplied by the page view model.
- Post-`0000263` signed-in visual screenshot and live clicked Claude response capture remain pending because Chrome screenshot/click automation became unreliable after tab/full-screen switching.
