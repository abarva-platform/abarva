# 2026-08-11-source-response-package-cockpit — Source Response Package Cockpit

## Release ID

`2026-08-11-source-response-package-cockpit`

## Status

`candidate`

## Plain-English Summary

Adds a compact Responses-stage cockpit that shows each vendor submission as a package, not as one undifferentiated uploaded file. The view separates main response, pricing, SLA, staffing, transition, exceptions, and evidence readiness, then produces a first-pass proposal health state so teams can see which vendors are ready to score, which need review, and which must not be scored yet. The same stage now includes a proposal intelligence brief that explains what Source learned, which evidence was used, what is still missing before score lock, and where BAFO leverage exists.

## Layer Impact

- Release lane: `global-control-lane` for shared Source product UX behavior.
- Product layer: Updates the Source Responses-stage canvas to make response package readiness, produced intelligence, evidence use, missing inputs, leverage path, and scoring gates visible in the workflow.
- Canonical model: No change.
- Source adapters: No change.
- Client intake: No change.

## Client Applicability

- All clients: Applies to the shared Source Responses-stage product surface after release.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None added.

## Changes Included

- `src/components/source/canvas/responses/VendorResponsePackageCockpit.tsx` adds the package readiness cockpit.
- `src/components/source/canvas/responses/VendorResponseIntelligenceBrief.tsx` adds the produced-insights, evidence-used, missing-input, and leverage-path brief.
- `src/components/source/canvas/responses/ResponsesStageView.tsx` inserts the cockpit and intelligence brief into the Responses-stage workflow before the deeper vendor intelligence panels.
- `src/components/source/canvas/responses/__tests__/VendorResponsePackageCockpit.test.tsx` covers the first-pass readiness language, required-package blocking, and public-safe fixture naming.
- `src/components/source/canvas/responses/__tests__/VendorResponseIntelligenceBrief.test.tsx` covers the intelligence brief, cross-vendor evidence/missing-input sampling, BAFO leverage language, and client-proof boundary.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/components/source/canvas/responses/__tests__/VendorResponsePackageCockpit.test.tsx --silent`
- PASS: `npm test -- --runTestsByPath src/components/source/canvas/responses/__tests__/VendorResponsePackageCockpit.test.tsx src/components/source/canvas/responses/__tests__/VendorChallengeLeveragePanel.test.tsx src/components/source/canvas/responses/__tests__/VendorBafoInstructionPackPanel.test.tsx src/components/source/canvas/responses/__tests__/VendorEvaluationScorecardPanel.test.tsx --silent`
- PASS: `npm test -- --runTestsByPath src/components/source/canvas/responses/__tests__/VendorResponseIntelligenceBrief.test.tsx src/components/source/canvas/responses/__tests__/VendorResponsePackageCockpit.test.tsx src/components/source/canvas/responses/__tests__/VendorChallengeLeveragePanel.test.tsx src/components/source/canvas/responses/__tests__/VendorBafoInstructionPackPanel.test.tsx src/components/source/canvas/responses/__tests__/VendorEvaluationScorecardPanel.test.tsx --silent`
- PASS: `npx eslint src/components/source/canvas/responses/VendorResponsePackageCockpit.tsx src/components/source/canvas/responses/ResponsesStageView.tsx src/components/source/canvas/responses/__tests__/VendorResponsePackageCockpit.test.tsx`
- PASS: `npx eslint src/components/source/canvas/responses/VendorResponseIntelligenceBrief.tsx src/components/source/canvas/responses/ResponsesStageView.tsx src/components/source/canvas/responses/__tests__/VendorResponseIntelligenceBrief.test.tsx`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`
- PASS: `git diff --check`
- PASS: Local Chromium component smoke rendered the cockpit, asserted visible vendor/package/blocked-scoring copy, and captured `/Users/anand/Downloads/source-e2e-qa-20260810/source-response-package-cockpit-smoke.png`.
- PASS: Local Chromium component smoke rendered the intelligence brief, asserted evidence-used, missing-input, leverage-path, and cross-vendor coverage, and captured `/Users/anand/Downloads/source-e2e-qa-20260810/source-response-intelligence-brief-smoke.png`.

## Rollout Plan

Merge through the normal PR path. Runtime activation requires the repo-owned Azure Container Apps main deploy workflow after merge. No migration, data load, feature flag, or manual operator job is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared runtime activation.
- Shared runtime mutators: None in this release.
- Approved image digest: Pending main deploy workflow.
- ACA runtime invariant: Required only after deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Required after deploy before claiming live-proven.

## Rollback Plan

Revert the PR to remove the cockpit and intelligence brief components, their Responses-stage insertion, the tests, and this release record. No schema rollback, tenant-data rollback, or data-plane rollback is required.

## Audit Evidence

- Local test, lint, type-check, and diff hygiene commands listed above.
- Local Chromium smoke screenshot: `/Users/anand/Downloads/source-e2e-qa-20260810/source-response-package-cockpit-smoke.png`.
- Local Chromium smoke screenshot: `/Users/anand/Downloads/source-e2e-qa-20260810/source-response-intelligence-brief-smoke.png`.
- PR review and CI evidence after publication.
- Browser smoke screenshots should be attached before release approval.

## Known Gaps

- This release does not implement long-form proposal parsing, vendor-isolated citation extraction, automated scoring math, or BAFO negotiation optimization. It makes the readiness, produced intelligence, evidence use, missing inputs, leverage path, and scoring gate honest in the workflow while those deeper capabilities are implemented.
