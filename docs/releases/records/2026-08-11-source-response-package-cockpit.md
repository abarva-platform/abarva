# 2026-08-11-source-response-package-cockpit — Source Response Package Cockpit

## Release ID

`2026-08-11-source-response-package-cockpit`

## Status

`candidate`

## Plain-English Summary

Adds a compact Responses-stage cockpit that shows each vendor submission as a package, not as one undifferentiated uploaded file. The view separates main response, pricing, SLA, staffing, transition, exceptions, and evidence readiness, then produces a first-pass proposal health state so teams can see which vendors are ready to score, which need review, and which must not be scored yet. The same stage now includes a file readiness ledger that lists required, conditional, and optional file families by source system, owner role, accepted format, upload state, parse state, citation count, done state, and next action. The active step canvas now shows a compact "What Continue needs" strip with the required item, source system, owner, accepted format, current status, and next action before the forward button can unlock. It also adds a compact "Run this step" guide card that summarizes the meeting or workshop, invitees, collection target, template, and unlock condition from the stage guidebook. The Files workspace now includes a file-use readiness map so uploaded files show whether they are gate artifacts or supporting evidence, whether they are parsed, search-ready, graph-projected, and what action is needed next. A proposal intelligence brief explains what Source learned, which evidence was used, what is still missing before score lock, and where BAFO leverage exists. The challenge/leverage panel now includes a negotiation leverage cockpit that separates evidenced asks from test-only asks and shows impact signal, BAFO ask, and a value guardrail so unproven savings are not booked. The evaluation scorecard now opens with an executive decision cockpit that separates risk-adjusted lead, price benchmark, transition-risk vendor, BAFO upside, and open award conditions before detailed scoring. A forward gate makes the Continue-to-Evaluation action visibly disabled until package, evidence, intelligence, holdback, and scoring-view conditions are satisfied.

## Layer Impact

- Release lane: `global-control-lane` for shared Source product UX behavior.
- Product layer: Updates the Source Responses-stage canvas, active-step workflow canvas, Guidebook handoff, and Files workspace to make response package readiness, active-step requirements, required file readiness, uploaded-file use readiness, produced intelligence, evidence use, missing inputs, negotiation leverage, executive decision posture, disabled/enabled forward movement, and scoring gates visible in the workflow.
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
- `src/components/source/canvas/responses/VendorResponseFileReadinessPanel.tsx` adds the required/conditional/optional file readiness ledger with owner, format, upload, parse, evidence, done, and next-action states.
- `src/components/source/canvas/responses/VendorResponseIntelligenceBrief.tsx` adds the produced-insights, evidence-used, missing-input, and leverage-path brief.
- `src/components/source/canvas/responses/VendorResponseForwardGate.tsx` adds the disabled/enabled Continue-to-Evaluation gate with explicit blocker checks.
- `src/components/source/canvas/responses/VendorChallengeLeveragePanel.tsx` adds the negotiation leverage cockpit inside the existing challenge/leverage surface.
- `src/components/source/canvas/responses/VendorEvaluationScorecardPanel.tsx` adds the executive decision cockpit inside the existing evaluation decision view.
- `src/components/source/canvas/responses/ResponsesStageView.tsx` inserts the cockpit, file readiness ledger, intelligence brief, and forward gate into the Responses-stage workflow before the deeper vendor intelligence panels.
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx` adds an active-step "What Continue needs" strip, compact "Run this step" guide card, and a Files-workspace file-use readiness map with gate/evidence role, parse, search, graph, readiness, and next-action states.
- `src/components/source/canvas/responses/__tests__/VendorResponsePackageCockpit.test.tsx` covers the first-pass readiness language, required-package blocking, and public-safe fixture naming.
- `src/components/source/canvas/responses/__tests__/VendorResponseFileReadinessPanel.test.tsx` covers file family clarity, required/optional states, owner roles, accepted formats, parse status, cited evidence, next action, and public-safe fixture naming.
- `src/components/source/canvas/responses/__tests__/VendorResponseIntelligenceBrief.test.tsx` covers the intelligence brief, cross-vendor evidence/missing-input sampling, BAFO leverage language, and client-proof boundary.
- `src/components/source/canvas/responses/__tests__/VendorResponseForwardGate.test.tsx` covers disabled Continue behavior and visible blocker copy.
- `src/components/source/canvas/responses/__tests__/VendorChallengeLeveragePanel.test.tsx` covers the negotiation cockpit, evidenced/test-only asks, impact signal, value guardrail, and public-safe fixture naming.
- `src/components/source/canvas/responses/__tests__/VendorEvaluationScorecardPanel.test.tsx` covers the executive decision cockpit, risk-adjusted lead, price benchmark, transition risk, BAFO upside, open award conditions, and public-safe fixture naming.
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx` covers the active-step requirement strip, Files-workspace readiness map, client-readable parse/search/graph labels, next-action copy, and current workspace navigation label.
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.guidebook.test.tsx` covers the compact active-step guide card and its handoff to the full Guidebook workspace.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/components/source/canvas/responses/__tests__/VendorResponsePackageCockpit.test.tsx --silent`
- PASS: `npm test -- --runTestsByPath src/components/source/canvas/responses/__tests__/VendorResponsePackageCockpit.test.tsx src/components/source/canvas/responses/__tests__/VendorChallengeLeveragePanel.test.tsx src/components/source/canvas/responses/__tests__/VendorBafoInstructionPackPanel.test.tsx src/components/source/canvas/responses/__tests__/VendorEvaluationScorecardPanel.test.tsx --silent`
- PASS: `npm test -- --runTestsByPath src/components/source/canvas/responses/__tests__/VendorResponseIntelligenceBrief.test.tsx src/components/source/canvas/responses/__tests__/VendorResponsePackageCockpit.test.tsx src/components/source/canvas/responses/__tests__/VendorChallengeLeveragePanel.test.tsx src/components/source/canvas/responses/__tests__/VendorBafoInstructionPackPanel.test.tsx src/components/source/canvas/responses/__tests__/VendorEvaluationScorecardPanel.test.tsx --silent`
- PASS: `npm test -- --runTestsByPath src/components/source/canvas/responses/__tests__/VendorResponseForwardGate.test.tsx src/components/source/canvas/responses/__tests__/VendorResponseIntelligenceBrief.test.tsx src/components/source/canvas/responses/__tests__/VendorResponsePackageCockpit.test.tsx src/components/source/canvas/responses/__tests__/VendorChallengeLeveragePanel.test.tsx src/components/source/canvas/responses/__tests__/VendorBafoInstructionPackPanel.test.tsx src/components/source/canvas/responses/__tests__/VendorEvaluationScorecardPanel.test.tsx --silent`
- PASS: `npm test -- --runTestsByPath src/components/source/canvas/responses/__tests__/VendorResponseFileReadinessPanel.test.tsx --silent`
- PASS: `npm test -- --runTestsByPath src/components/source/canvas/responses/__tests__/VendorResponseFileReadinessPanel.test.tsx src/components/source/canvas/responses/__tests__/VendorResponseForwardGate.test.tsx src/components/source/canvas/responses/__tests__/VendorResponseIntelligenceBrief.test.tsx src/components/source/canvas/responses/__tests__/VendorResponsePackageCockpit.test.tsx src/components/source/canvas/responses/__tests__/VendorChallengeLeveragePanel.test.tsx src/components/source/canvas/responses/__tests__/VendorBafoInstructionPackPanel.test.tsx src/components/source/canvas/responses/__tests__/VendorEvaluationScorecardPanel.test.tsx --silent`
- PASS: `npm test -- --runTestsByPath src/components/source/canvas/responses/__tests__/VendorChallengeLeveragePanel.test.tsx --silent`
- PASS: `npm test -- --runTestsByPath src/components/source/canvas/responses/__tests__/VendorEvaluationScorecardPanel.test.tsx --silent`
- PASS: `npm test -- --runTestsByPath src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx --runInBand --silent`
- PASS: `npm test -- --runTestsByPath src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.guidebook.test.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx --runInBand --silent`
- PASS: `npm test -- --runTestsByPath src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.guidebook.test.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx src/components/source/canvas/responses/__tests__/VendorResponseFileReadinessPanel.test.tsx src/components/source/canvas/responses/__tests__/VendorResponseForwardGate.test.tsx src/components/source/canvas/responses/__tests__/VendorResponseIntelligenceBrief.test.tsx src/components/source/canvas/responses/__tests__/VendorResponsePackageCockpit.test.tsx src/components/source/canvas/responses/__tests__/VendorChallengeLeveragePanel.test.tsx src/components/source/canvas/responses/__tests__/VendorBafoInstructionPackPanel.test.tsx src/components/source/canvas/responses/__tests__/VendorEvaluationScorecardPanel.test.tsx --runInBand --silent`
- PASS: `npx eslint src/components/source/canvas/responses/VendorResponsePackageCockpit.tsx src/components/source/canvas/responses/ResponsesStageView.tsx src/components/source/canvas/responses/__tests__/VendorResponsePackageCockpit.test.tsx`
- PASS: `npx eslint src/components/source/canvas/responses/VendorResponseIntelligenceBrief.tsx src/components/source/canvas/responses/ResponsesStageView.tsx src/components/source/canvas/responses/__tests__/VendorResponseIntelligenceBrief.test.tsx`
- PASS: `npx eslint src/components/source/canvas/responses/VendorResponseForwardGate.tsx src/components/source/canvas/responses/ResponsesStageView.tsx src/components/source/canvas/responses/__tests__/VendorResponseForwardGate.test.tsx`
- PASS: `npx eslint src/components/source/canvas/responses/VendorResponseFileReadinessPanel.tsx src/components/source/canvas/responses/ResponsesStageView.tsx src/components/source/canvas/responses/__tests__/VendorResponseFileReadinessPanel.test.tsx`
- PASS: `npx eslint src/components/source/canvas/responses/VendorChallengeLeveragePanel.tsx src/components/source/canvas/responses/__tests__/VendorChallengeLeveragePanel.test.tsx`
- PASS: `npx eslint src/components/source/canvas/responses/VendorEvaluationScorecardPanel.tsx src/components/source/canvas/responses/__tests__/VendorEvaluationScorecardPanel.test.tsx`
- PASS: `npx eslint src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.guidebook.test.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`
- PASS: `git diff --check`
- PASS: Local Chromium component smoke rendered the cockpit, asserted visible vendor/package/blocked-scoring copy, and captured `/Users/anand/Downloads/source-e2e-qa-20260810/source-response-package-cockpit-smoke.png`.
- PASS: Local Chromium component smoke rendered the file readiness ledger, asserted required file, open required, parse/readiness, and next-action copy, and captured `/Users/anand/Downloads/source-e2e-qa-20260810/source-response-file-readiness-smoke.png`.
- PASS: Local Chromium component smoke rendered the negotiation leverage cockpit, asserted evidenced/test-only ask, impact signal, value guardrail, and savings guardrail copy, and captured `/Users/anand/Downloads/source-e2e-qa-20260810/source-response-negotiation-leverage-smoke.png`.
- PASS: Local Chromium component smoke rendered the executive decision cockpit, asserted lead, price benchmark, transition risk, BAFO upside, do-not-award posture, and open award conditions, and captured `/Users/anand/Downloads/source-e2e-qa-20260810/source-response-executive-decision-cockpit-smoke.png`.
- PASS: Local Chromium component smoke rendered the intelligence brief, asserted evidence-used, missing-input, leverage-path, and cross-vendor coverage, and captured `/Users/anand/Downloads/source-e2e-qa-20260810/source-response-intelligence-brief-smoke.png`.
- PASS: Local Chromium component smoke rendered the forward gate, asserted disabled Continue behavior and blocker copy, and captured `/Users/anand/Downloads/source-e2e-qa-20260810/source-response-forward-gate-smoke.png`.

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

Revert the PR to remove the cockpit, file readiness ledger, active-step requirements strip, active-step guide card, Files-workspace file-use readiness map, intelligence brief, negotiation leverage cockpit, executive decision cockpit, and forward gate components, their Responses-stage insertion, the tests, and this release record. No schema rollback, tenant-data rollback, or data-plane rollback is required.

## Audit Evidence

- Local test, lint, type-check, and diff hygiene commands listed above.
- Local Chromium smoke screenshot: `/Users/anand/Downloads/source-e2e-qa-20260810/source-response-package-cockpit-smoke.png`.
- Local Chromium smoke screenshot: `/Users/anand/Downloads/source-e2e-qa-20260810/source-response-file-readiness-smoke.png`.
- Local Chromium smoke screenshot: `/Users/anand/Downloads/source-e2e-qa-20260810/source-response-negotiation-leverage-smoke.png`.
- Local Chromium smoke screenshot: `/Users/anand/Downloads/source-e2e-qa-20260810/source-response-executive-decision-cockpit-smoke.png`.
- Local Chromium smoke screenshot: `/Users/anand/Downloads/source-e2e-qa-20260810/source-response-intelligence-brief-smoke.png`.
- Local Chromium smoke screenshot: `/Users/anand/Downloads/source-e2e-qa-20260810/source-response-forward-gate-smoke.png`.
- PR review and CI evidence after publication.
- Browser smoke screenshots should be attached before release approval.

## Known Gaps

- This release does not implement long-form proposal parsing, vendor-isolated citation extraction, automated scoring math, or fully automated negotiation optimization. It makes the active-step requirement, active-step guide, package readiness, file readiness, uploaded-file use readiness, produced intelligence, evidence use, missing inputs, negotiation leverage, executive decision posture, forward movement, and scoring gate honest in the workflow while those deeper capabilities are implemented.
