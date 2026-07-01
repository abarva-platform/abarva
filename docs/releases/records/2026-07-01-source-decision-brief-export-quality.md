# 2026-07-01-source-decision-brief-export-quality - Source Decision Brief Export Quality

## Release ID

`2026-07-01-source-decision-brief-export-quality`

## Status

`candidate`

## Plain-English Summary

Source P1 evaluation already showed a polished CXO-ready vendor recommendation in the live UI, but the D24 Decision Brief export could still fall back to an old generic template. This release makes the DOCX/PDF/HTML export use the same vendor evaluation intelligence as the UI, so the exported brief is authored, executive-readable, and free of old scaffold or internal agent labels.

## Layer Impact

- `global-control-lane`: updates shared Source export rendering behavior and D24 payload assembly for every environment that uses the Source export route.
- `public-demo`: improves the SkyHarbor Source P1 demo artifact export quality and proof path.

## Client Applicability

- All clients: generic narrative export metadata now uses business-facing AbarVa Source labeling instead of old internal agent labels.
- Specific clients: SkyHarbor Source AMS P1 D24 Decision Brief receives the authored evaluation export path.
- Internal only: none.
- Public/demo only: the SkyHarbor synthetic/demo event receives the vendor-evaluation authored brief body.
- Feature flag: none.

## Changes Included

- Adds a D24 Decision Brief payload builder that composes Executive Recommendation, Vendor Ranking and Readiness, Weighted Evaluation Scorecard, Normalized Vendor Comparison, BAFO scenarios, BAFO conditions, risks/gaps, decision request, and evidence note from the existing proposal-intelligence chain.
- Routes `d24_decision_brief` narrative export through that builder instead of the generic scaffold fallback.
- Updates narrative DOCX/PDF/HTML renderer metadata/footer labels from old internal agent naming to AbarVa Source.
- Adds regression tests for required sections, Vendor A/B/C presence, scaffold blocking, and forbidden internal/demo terms.

## QA / Validation

- Focused Jest for the D24 export payload: pass locally, 5 tests.
- `npm run test:behaviors -- --runInBand src/lib/source/exports/__tests__/decision-brief-payload.test.ts`: pass locally, 16 suites / 200 tests.
- Focused ESLint on touched files: pass locally.
- TypeScript check: blocked locally by pre-existing missing declaration/package issues for `js-yaml`, `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright`; no new Source D24 errors were reported before those global failures.
- `npm run release:check`: pass locally.
- Live signed-in browser/export proof against the SkyHarbor Source event after ACA deployment: not run yet.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deploy workflow, assign 100% traffic to the healthy new revision, and verify the live Source event export route in a signed-in browser session.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy workflow.
- Shared runtime mutators: none outside the approved ACA deploy lane.
- Approved image digest: recorded after deployment.
- ACA runtime invariant: verify `ca-abarva-web-lab-eastus` traffic points to the new revision.
- Worker image invariant: no worker job changes.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, including DOCX/PDF content inspection.

## Rollback Plan

Revert the PR or redeploy the previous known-good ACA image. No migrations or data-plane changes are included.

## Audit Evidence

To be attached after execution:

- PR URL.
- Commit SHA.
- CI/local validation output.
- ACA revision and image digest.
- Live proof ZIP with screenshot, DOCX text, PDF text, API/download responses, and forbidden-term scan.

## Known Gaps

None known for the D24 export quality defect. This release does not add new sourcing features.
