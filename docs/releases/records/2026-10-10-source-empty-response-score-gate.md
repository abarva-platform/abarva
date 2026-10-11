# 2026-10-10-source-empty-response-score-gate - Require response evidence before scoring

## Release ID

`2026-10-10-source-empty-response-score-gate`

## Status

Candidate. Local validation is recorded below; merge, deployment and signed-in acceptance are separate states.

## Plain-English Summary

The response-ingestion panel now asks the operator to load and parse response packages when none exist. It no longer interprets empty blocker counters as permission to score. A non-empty set must have every parser report ready to score and no outstanding blockers or holdbacks before the panel recommends evaluator scoring.

## Release Lane

`global-control-lane`

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 presentation only: the ingestion panel projects the existing parser report's `scoreReadiness` and missing-input states. Layer 3 report identity and stored records are unchanged. There is no new scoring model, loader, data write, approval, parser policy, migration or vendor communication.

The client remains responsible for supplying response packages and reviewing evidence. Canonical parser reports own readiness; the component owns its displayed status and next action. All conditions are deterministic; no model is invoked by this change.

## Client Applicability

- All clients: response-stage users who encounter this ingestion panel.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none; a correctness fix in the existing panel.

## Design Basis

`docs/design/source-end-to-end-redesign-brief.md`, section 5: "a gate item is green because the evidence reached its target state". Section 9 requires structured vendor-response intake before analytical response stages can run on real data.

This advances the on-page intelligence promise by making the score posture and concrete next action agree with the existing readiness reports. It changes no layout, styling, workflow authority or canonical stage mapping.

## Changes Included

- `src/components/source/canvas/responses/VendorResponseIngestionPathPanel.tsx`: require non-empty, all-ready reports and no counted score gaps for the scoring instruction; show missing-response or incomplete-evidence states otherwise.
- `src/components/source/canvas/responses/__tests__/VendorResponseIngestionPathPanel.test.tsx`: rendered regression cases for absent/empty reports, non-ready and caveated reports with no counted inputs, mixed readiness, retained blockers/holdbacks and an all-ready positive control.

## QA / Validation

- PASS: red-first regression. Five rendered assertions failed on the original implementation after the test fixture was corrected; positive controls continued to pass.
- PASS: focused suite, 11 tests. Restored baseline passes after each mutation run.
- PASS: Source canvas CI command, 62 suites / 370 tests: `npx jest src/components/source/canvas --runInBand --no-coverage --ci`.
- PASS: mutation replacing report readiness with empty gap counters: 3 regression failures.
- PASS: mutation removing the blocker/holdback condition: 1 regression failure.
- PASS: mutation restoring the original counters-only next-action branch: 5 regression failures.
- PASS: mutation ignoring holdbacks when there are no blockers: 1 regression failure. This isolated holdback case closes a gap identified by independent static review.
- PASS: focused ESLint, no diagnostics.
- PASS: Nexus manual check; no generated manual change is required.
- PASS: test-CI census matches. The existing suite is already collected by the Source canvas command in `.github/workflows/unit-suites.yml`; no new suite or workflow wiring is added.
- PASS: complete typecheck using `node scripts/quality/typecheck.mjs`, clean exit 0.
- PASS: release control, 11 of 11 gates ran and passed. The first run caught a missing lane marker in Layer Impact; the record was corrected and the complete gate list rerun.
- NOT RUN: signed-in acceptance of the new build at candidate creation. Deployment inclusion and browser proof must be recorded separately.

## Rollout Plan

Publish a PR, complete local validation and review, then squash-merge through repository governance. Only `.github/workflows/aca-main-deploy.yml` builds and promotes the shared web image. No data apply, migration, feature flag or provider-side action is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this change; no local or branch traffic/template updates.
- Approved image digest: determined by the successful main workflow, not a branch tag.
- ACA runtime invariant: prove web template and Healthy 100%-traffic revision match that digest.
- Worker image invariant: prove both required worker job images match the approved digest.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: revisit an empty response set, confirm "No response evidence" and the load/parse instruction, confirm the scoring instruction is absent and the existing forward gate stays disabled. Capture a screenshot and rendered text. Do not upload responses, change approvals or advance the event to obtain a pass.

## Rollback Plan

Revert the scoped presentation/test change in a reviewed PR and let the repo-owned main workflow redeploy. No stored data or schema rollback is needed. Restore the original code only through that controlled release path, not a runtime mutation.

## Audit Evidence

The PR diff, local command exits, test assertions, mutation failures and matching census provide candidate evidence. GitHub check, main workflow and signed-in browser captures are separate rollout evidence, not presumed from the candidate.

## Known Gaps

This does not enable missing response intake records, change evaluation criteria, reconcile other read models, certify recommendations or financial values, or prove fresh model answers/citations. The panel's decision-output readiness and other rows are outside this narrowly scoped score-gate fix.
