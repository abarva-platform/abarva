# 2026-06-29-home-v6-runtime-contract — Home V6 Runtime Contract

## Release ID

`2026-06-29-home-v6-runtime-contract`

## Status

`candidate`

## Plain-English Summary

Home KNOW now answers from the V6 dataset contract by default instead of the retired curated semantic dossier path. The release also ships the five demo tenant V6 packs and remediates their business metadata so Home can answer loaded-context, ownership, systems, vendors, spend, program, AI, risk, evidence, metric, industry-pattern, and expert-lens questions without borrowing from old layers.

## Layer Impact

- `global-control-lane`: `/api/home/know/ask` and the Home tab path through `/api/intelligence/ask` now use the V6 Home answer path. The legacy Home semantic/dossier fallback is not reachable from these production paths.
- `client-data-lane`: V6 demo dataset packs are added for Retail Demo, Financial Services Demo, Industrial Demo, Healthcare Demo, and Airline Demo.
- `public-demo`: user-visible demo tenant names and V6 evidence packs are cleaned for soft-launch/demo use.

## Client Applicability

- All clients: the Home route default runtime path changes to the V6 contract assembler.
- Specific clients: Retail Demo, Financial Services Demo, Industrial Demo, Healthcare Demo, and Airline Demo receive V6 demo packs in the repository image.
- Internal only: remediation and projection QA scripts.
- Public/demo only: generic demo tenant naming in user-visible data.
- Feature flag: none for legacy fallback. Missing V6 packs fail loud instead of silently borrowing old semantic/dossier answers.

## Changes Included

- `src/app/api/home/know/ask/route.ts`: V6-only Home route with fail-loud blocked response when the V6 contract pack is unavailable.
- `src/lib/home/know/home-know-agent-answer.ts`: streaming aVa Home panel path now uses the same V6 contract adapter instead of `home-know-engine`.
- `src/lib/home/know/v6-home-ask.ts`: deterministic V6 Home answer contract.
- `src/lib/home/know/v6-home-know-response.ts`: adapter into the existing Home renderer/API response shape.
- `src/lib/home/know/home-render-layer-shaper.ts`: preserves V6 visible sections byte-for-byte except safety flags.
- `datasets/*-synthetic-v6`: V6 demo packs for the five demo tenants.
- `datasets/enterprise-intelligence-template-pack-v6`: shared V6 template pack.
- `scripts/qa/remediate-home-v6-demo-pack.mjs`: deterministic V6 metadata remediation.
- `scripts/qa/home-v6-critical-gap-report.mjs` and `scripts/qa/home-v6-backend-correctness-projection.mjs`: visible-field old-name scanning and V6 QA gates.

## QA / Validation

- `node scripts/qa/home-v6-critical-gap-report.mjs --repoRoot /tmp/nexus-home-v6-readiness --datasetRoot /tmp/nexus-home-v6-readiness/datasets --outDir /tmp/nexus-home-v6-readiness/reports/home-v6-critical-gap-report-final-2026-06-29`
  - Result: 80 files audited, 0 high risk, 0 medium risk, 0 old-name risk, 0 money/value-not-ready.
- `node scripts/qa/home-v6-backend-correctness-projection.mjs --repoRoot /tmp/nexus-home-v6-readiness --datasetRoot /tmp/nexus-home-v6-readiness/datasets --outDir /tmp/nexus-home-v6-readiness/reports/home-v6-projection-final-2026-06-29 --questions 1000`
  - Result: 1000 projected questions, 100% projected pass, 68% decision-ready, 0 low-score, 0 strict money/value failures, 0 old-name leak risk.
- `./node_modules/.bin/jest src/lib/home/know/__tests__/v6-home-know-response.test.ts --runInBand`
  - Result: 1 suite passed, 2 tests passed.
- `./node_modules/.bin/eslint src/app/api/home/know/ask/route.ts src/app/api/intelligence/ask/route.ts src/lib/home/know/home-know-agent-answer.ts src/lib/home/know/home-know-contract.ts src/lib/home/know/home-render-layer-shaper.ts src/lib/home/know/v6-home-ask.ts src/lib/home/know/v6-home-know-response.ts src/lib/home/know/__tests__/v6-home-know-response.test.ts`
  - Result: passed.
- Runtime-shaped local sample: `answerHomeKnowFromV6 -> toHomeKnowResponseFromV6 -> shapeHomeKnowResponseForRender` for 10 Industrial Demo and 10 Airline Demo questions.
  - Result: 20 passed, 0 failed; correct generic demo tenant names; no visible legacy/raw markers; renderer preserved V6 visible sections byte-stable.
- Streaming aVa Home sample: `buildHomeKnowAgentAnswer` for the same 20 questions.
  - Result: 20 passed, 0 failed; correct generic demo tenant names; no visible legacy/raw markers.

## Rollout Plan

Merge to `main`, build the production image through the repo-owned Azure Container Apps deploy lane, deploy to `ca-abarva-web-lab-eastus`, shift 100% ingress traffic to the healthy revision, then run live signed-in Home QA for at least Lakeshore/Industrial Demo and SkyHarbor/Airline Demo.

## Deployment Authority

- Repo-owned deploy workflow: required; use the ACA main deploy path for `app.abarva.ai`.
- Shared runtime mutators: none outside the normal ACA deploy.
- Approved image digest: captured during ACA deployment.
- ACA runtime invariant: must pass before live proof is claimed.
- Worker image invariant: no worker change expected.
- Feature/env flag update path: none for the retired legacy fallback.
- Live signed-in proof required: yes, Home API/browser proof across at least two demo tenants and 20+ questions before declaring demo-ready.

## Rollback Plan

Fast rollback is ACA traffic back to the previous healthy revision. There is no runtime flag to re-enable the retired legacy Home semantic/dossier fallback from this release candidate; the intended rollback is image-level.

## Audit Evidence

- Release PR and CI checks.
- Final V6 critical gap report under `reports/home-v6-critical-gap-report-final-2026-06-29`.
- Final 1000-question projection report under `reports/home-v6-projection-final-2026-06-29`.
- Local 20-question direct Home runtime sample under `reports/home-v6-runtime-sample-2026-06-29`.
- Local 20-question streaming aVa Home sample under `reports/home-v6-agent-sample-2026-06-29`.
- Focused Jest and ESLint output from this release candidate.
- Post-deploy ACA revision/digest/traffic proof and signed-in Home smoke evidence.

## Known Gaps

Live ACA deployment and signed-in browser/API proof are pending until this candidate lands on `main`.

## Post-Deploy Hotfix Addendum

After the first ACA deployment, signed-in Home API proof found that the production visible-answer contract rejected V6 prose containing implementation terms such as `rows`, `files`, `source file`, and raw priority metadata like `technology_budget_usd`. The hotfix changes only user-visible wording in the V6 Home answer adapter so customer-facing answers say evidence items, governed evidence areas, source evidence, and formatted business-priority values.

Additional validation for the hotfix:

- Local visible-answer contract over 20 Industrial Demo and Airline Demo questions: 20 passed, 0 failed.
- Focused ESLint for the Home V6 route/adapter/helper files: passed.
- Focused Jest for `v6-home-know-response.test.ts`: passed.

## Trace Sanitizer Boundary Addendum

The second signed-in live smoke found clean user-visible Airline Demo prose, but debug/proof fields were being demo-name sanitized, turning internal `skyharbor-air-synthetic-v6` evidence paths into `Airline Demo-air-synthetic-v6`. The sanitizer now preserves internal proof fields (`safety`, `trace`, composer traces, prompt snapshots, model params, and related metadata) while continuing to scrub user-visible answer sections.

Additional validation for the sanitizer boundary:

- Focused Jest for `home-demo-safe-response.test.ts`: must show visible fields sanitized and internal prompt trace preserved exactly.
- Live signed-in Home smoke must pass direct API and aVa Home stream checks across Industrial Demo and Airline Demo after deployment.

## Financial Services V6 Alias Addendum

The 100-question live correctness audit exposed a tenant-key contract issue for Financial Services Demo: the app canonical client key is `arcturus`, while the V6 Home dataset directory is `first-capital-financial-synthetic-v6`. The Home V6 dataset map now includes the canonical `arcturus` key and keeps the legacy `firstcapital` alias compatible, so Financial Services Demo cannot silently miss the V6 pack or fall back to retired semantic/dossier layers.

Additional validation for this alias fix:

- Focused Jest for `v6-home-know-response.test.ts`: proves `arcturus`, `firstcapital`, and `first-capital` all resolve to `Financial Services Demo` and `first-capital-financial-synthetic-v6`.
- Focused ESLint for `v6-home-ask.ts` and `v6-home-know-response.test.ts`: passed.
- The live 100-question correctness audit must use the canonical `arcturus` app key for Financial Services Demo while checking the V6 financial dataset in trace/proof fields.

## V6 Visible Detail Addendum

The first live 100-question correctness audit after deployment found two visible-answer boundary issues even though the V6 facts were selected correctly: Apex Retail data-estate prose exposed owner references such as `APX-IT-007`, and SkyHarbor source-trail tables exposed `.csv` source locations. The V6 Home composer now converts raw owner IDs, application IDs, checksums, dataset paths, and CSV locations into business-safe visible labels while preserving the raw dataset values in internal trace/evidence selection fields.

Additional validation for this visible-detail fix:

- Focused Jest for `v6-home-know-response.test.ts`: proves data-estate and source-trail visible sections contain `Technology owner reference` and `Source evidence register`, and do not contain raw owner IDs, application IDs, `.csv`, or `datasets/`.
- Focused local samples for Apex Retail data-estate, SkyHarbor source-trail, and SkyHarbor Move handoff all pass the visible quality gate.
- The live 100-question correctness audit must be rerun after deployment and should show zero visible-answer boundary failures.
