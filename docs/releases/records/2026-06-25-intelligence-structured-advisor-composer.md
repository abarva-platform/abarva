# 2026-06-25-intelligence-structured-advisor-composer — Structured Intelligence Advisor Composer

## Release ID

`2026-06-25-intelligence-structured-advisor-composer`

## Status

`candidate`

## Plain-English Summary

Intelligence advisor answers now assemble a structured answer packet instead of showing streamed draft fragments and then scraping prose for tables. Airline IROPS advisory questions return a clean executive answer, a real evidence table, an optional readiness chart, source citations, advisor experts, caveats, and one follow-up question.

## Layer Impact

`global-control-lane`: updates the shared `/api/intelligence/ask` answer assembly path for advisor-routed Intelligence questions. Non-advisor questions and the legacy IT-productivity reasoning branch keep their existing behavior.

## Client Applicability

- All clients: yes, for advisor-routed Intelligence questions.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none; this follows the existing advisor-route classifier.

## Changes Included

- Added `src/lib/intelligence/ask/advisor-structured-answer.ts`.
- Updated `src/lib/intelligence/ask/advisor-composer.ts` so generic investment-allocation questions route to the initiative advisory path.
- Updated `src/app/api/intelligence/ask/route.ts` to suppress draft deltas for advisor questions and emit one structured `agent-answer` plus one `followups` event.
- Updated `src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts` with a regression for stitched IROPS prose, pipe-table-in-prose, orphan sign-off, duplicate follow-up, and hardcoded routing-tail leakage.
- Follow-up polish: live browser proof caught awkward generic tenant wording (`a the tenant-specific return`, `the tenant tenant evidence`) after the tenant-purity fix; the structured IROPS composer now uses neutral labels (`this tenant`, `tenant-specific return`, `Tenant evidence`) without hardcoded client names.

## QA / Validation

- `npx jest src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts --runInBand --silent` passed: 24 tests passed.
- Focused ESLint passed for `src/lib/intelligence/ask/advisor-structured-answer.ts`.
- `npm run audit:control-plane-purity:check` passed; no new hardcoded tenant strings landed in control-plane code.
- `npm run release:check` passed before the first deploy; rerun required after this follow-up release-record update.
- First deployed browser proof on `ca-abarva-web-lab-eastus--mf07d02ac` proved the structured answer path but exposed the generic tenant wording defect addressed by this follow-up.

## Rollout Plan

Merge to `main`, build the Azure Container Apps image from the exact merged SHA, deploy to `ca-abarva-web-lab-eastus`, shift 100% traffic to the new healthy revision, then verify signed-in `/intelligence` with SkyHarbor IROPS and broader advisor questions.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: only the approved Azure Container Apps main deploy path.
- Approved image digest: pending deploy.
- ACA runtime invariant: active revision, traffic revision, and template image must match the approved main image.
- Worker image invariant: no worker change expected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Rollback the ACA web app to the previous approved main image digest/revision. No migration rollback is needed.

## Audit Evidence

- PR URL: #3967 for the structured composer; follow-up polish PR pending.
- CI run: #3967 passed all checks and deployed through ACA main deploy run `28191698442`.
- Deployed browser proof: `/Users/anand/Downloads/abarva-intelligence-composer-live-proof-20260625/skyharbor-intelligence-irops-after-ask-complete.png` and body text in the same folder.
- Composer audit report: `/Users/anand/Downloads/abarva-intelligence-composer-2026-06-25T17-59-29-3NZ/FINDINGS.md`.

## Known Gaps

The right-side Intelligence canvas can still show a stale "forming the answer" placeholder while the shared aVa dock has the completed answer; that is a UI synchronization issue outside this composer packet follow-up.
