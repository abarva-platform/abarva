# 2026-07-02-intelligence-mandatory-companion-canvas — Intelligence Mandatory Companion Canvas

## Release ID

`2026-07-02-intelligence-mandatory-companion-canvas`

## Status

`candidate`

## Plain-English Summary

Intelligence now treats the right-side companion canvas as part of the answer contract, not an optional embellishment. For rich-text Intelligence answers, Claude must produce a concise main answer and all five supported companion tabs: Decision, Industry Insights, Chart, Table, and Evidence. The Chart tab must include chart-ready data or a governed native `abarva-canvas` exhibit, while Evidence must surface the most relevant tenant facts and proof boundaries without exposing debug labels or raw IDs.

## Layer Impact

- `global-control-lane`: Updates shared Intelligence synthesis and companion-canvas prompting for `/api/intelligence/ask`.
- `public-demo`: Improves SkyHarbor / Airline Demo and Industrial / Morgan Street CIO demo consistency by making companion tabs mandatory and removing “when useful” softeners from demo addenda.

## Client Applicability

- All clients: Yes, for rich-text Intelligence Ask responses.
- Specific clients: Airline Demo / SkyHarbor and Industrial Demo / Lakeshore-Morgan Street benefit immediately from stronger demo canvas behavior.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/intelligence/tabbed-response.ts`
  - Changes the tab contract from optional companion cards to mandatory five-card right-canvas output.
  - Clarifies tab jobs for Decision, Industry Insights, Chart, Table, and Evidence.
- `src/lib/intelligence/ask/synthesizer.ts`
  - Makes missing-tab validation require all five supported tabs.
  - Treats prose-only output as incomplete instead of passing it through.
  - Raises synthesis budget floor to support concise answer plus mandatory tabs.
  - Strengthens active canvas rules and user prompt text.
- `src/lib/intelligence/ask/skyharbor-cto-readiness-source.ts`
  - Removes “When useful” from Airline Demo CTO prompt addendum.
- `src/lib/intelligence/ask/industrial-cio-backoffice-source.ts`
  - Removes “When useful” from Industrial / Morgan Street CIO prompt addendum.
- Targeted tests updated for mandatory canvas behavior.

## QA / Validation

- Passed: `npx jest src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts src/lib/intelligence/ask/__tests__/skyharbor-cto-readiness-source.test.ts src/lib/intelligence/ask/__tests__/industrial-cio-backoffice-source.test.ts src/lib/intelligence/__tests__/tabbed-response.test.ts --runInBand`
- Passed: `npx eslint src/lib/intelligence/ask/synthesizer.ts src/lib/intelligence/tabbed-response.ts src/lib/intelligence/ask/skyharbor-cto-readiness-source.ts src/lib/intelligence/ask/industrial-cio-backoffice-source.ts src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts src/lib/intelligence/ask/__tests__/skyharbor-cto-readiness-source.test.ts src/lib/intelligence/ask/__tests__/industrial-cio-backoffice-source.test.ts src/lib/intelligence/__tests__/tabbed-response.test.ts`
- Not run yet: Production ACA deploy and signed-in 50-question trace/browser audit. This release record will be updated or supplemented after production proof.

## Deployment Authority

`app.abarva.ai` is deployed through Azure Container Apps only. The approved production path is the Azure Container Apps runbook for `ca-abarva-web-lab-eastus` and image repository `acrabarvalab001.azurecr.io/abarva/web`. Vercel is not deployment authority for this release.

## Rollout Plan

Merge through the approved repository lane and deploy `app.abarva.ai` through Azure Container Apps. After deploy, verify active ACA revision, image digest, public health, signed-in Intelligence load, and 50-question response/canvas behavior.

## Rollback Plan

Revert this release candidate or move ACA ingress traffic back to the previous healthy revision. No database migration rollback is required.

## Audit Evidence

- Targeted tests and lint in the release branch.
- Post-deploy evidence should include ACA revision/digest, signed-in screenshots, prompt/Claude/render traces, 50-question CSV/JSON summary, and report zip.

## Context Ingestion Evidence

Not applicable. This release does not change Admin Data Loads, corpus ingestion, embeddings, search refresh, or client data-plane commits.

## Known Gaps

This record is a candidate until deployed and browser-proven. The 50-question post-deploy report must confirm tab population, native canvas presence, no raw marker leakage, no duplicate right/left answer behavior, and no tenant bleed.
