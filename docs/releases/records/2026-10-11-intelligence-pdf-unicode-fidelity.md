# Intelligence PDF Unicode fidelity

## Release ID

`2026-10-11-intelligence-pdf-unicode-fidelity`

## Status

`candidate`

## Release Lane

`global-control-lane`

## Plain-English Summary

Intelligence PDF reports embed bundled Unicode fonts so decision text, exhibit labels and the original-response appendix retain authored characters, including arrows. Font assets and their original distribution license ship with the app; exports require no external font request.

## Layer Impact

Layer 4 in the global-control-lane: PDF presentation only. Successful model text, numeric values, exhibit protocols and stored answers are unchanged. No intake, adapter, canonical data, tenant load or model prompt changes.

## Client Applicability

- All clients: authenticated Intelligence model-authored PDF export users.
- Feature flag: existing mode boundary; no flag update.

## Changes Included

- Bundled DejaVu Sans regular and bold plus Sans Mono with original license and source attribution.
- Embedded report and appendix fonts in the model-authored renderer.

## QA / Validation

Real renderer Unicode fixture: passed. PDF extraction preserves arrows, inequality signs, accented text, Greek letters, bullets and currency in both prose and the original appendix. Rendered page inspected: passed. Changed-file ESLint: passed. Node 24 TypeScript: passed. Focused export tests: passed, 29 tests across two suites. All 11 release gates: passed.

## Rollout Plan

Squash merge through a protected PR after local validation. Use the repo-owned ACA main workflow. Verify runtime digest invariants and repeat signed-in PDF exports before reporting live proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: workflow only.
- Approved image digest: assigned by the main workflow.
- ACA runtime invariant: template and 100%-traffic revision match the approved digest.
- Worker image invariant: both required workers match that digest.
- Feature/env flag update path: none.
- Live signed-in proof required: ten-question PDF download and rendered page inspection.

## Rollback Plan

Revert this PR through a protected PR and redeploy through the same ACA workflow. No data rollback is required.

## Audit Evidence

PR diff, bundled font license, real renderer fixture, extraction assertion, rendered page, local QA, workflow runtime proof and private signed-in PDF evidence.

## Known Gaps

Fonts provide glyph coverage rather than changing or validating model claims. Final answer quality and evidence adequacy remain separately observable in the ten-question review.
