# 2026-10-10-source-response-phase-reachability - Response and evaluation navigation

## Release ID

`2026-10-10-source-response-phase-reachability`

## Status

`candidate`

## Plain-English Summary

Source New now gives Responses and Evaluation their own phases. Events at either stage open on the corresponding intake or scorecard panel instead of reporting that their current work lies beyond the workspace. Those panels no longer repeat beneath earlier phases. Future phases remain labelled previews; phases omitted by a declared journey remain off-path.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Phase navigation, file folders, historical-gap projections and preview inventories now recognize the existing canonical response and evaluation stages. The shared event reader uses the same phase vocabulary.
- Canonical model and source adapters: Unchanged. No new stage, supplier identity, score calculation, schema, load or approval is created.

## Client Applicability

- All clients: Source New and the shared Source event-reader journey.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None added.

## Changes Included

Phase resolution and file assignment; response/evaluation panel placement; matching file folders and honest previews; six-column desktop rail with the existing mobile grid; shared reader links and historical-gap evidence; remount on governed event-stage changes.

Design authority: `docs/design/source-end-to-end-redesign-brief.md:65` specifies Responses as "per-vendor MVE summary" and proposal/exhibit intake. Line 66 specifies Evaluation as "the analysis + live matrix" with explained scores and client judgment. The implementation exposes the existing intake and evaluator-authority panels; it does not claim that the complete analysis/matrix design has been delivered. `Source_End-to-End.html:212` places Responses in the universal canvas and Evaluation in a matrix variant. This slice advances the on-page intelligence, document intake and client-judgment promises; artifact generation is unchanged.

## QA / Validation

- PASS: Red-first resolver and render tests reproduced both missing current phases.
- PASS: 22 Source New suites, 319 tests; four shared event-reader, cross-phase audit and archived-surface suites, 31 tests. Historical panels remain readable after advancement, historical writes stay disabled, and unavailable reads cannot be masked by filed artifacts or certify event completion.
- PASS: Mutation proof. Restoring the null resolver fails four targeted cases; removing phase placement guards fails both render isolation cases. The restored baseline passes.
- PASS: Full TypeScript check using Node 24 with an 8 GB heap budget.
- PASS: Scoped ESLint and CI coverage census. Existing suites remain registered; no threshold or test exemption changed.
- PASS: Independent read-only review; identified history/availability issues were repaired with red-first tests and re-reviewed.
- CI correction: The broader core suite exposed an older last-phase assertion. It now pins the three-stage market/response/evaluation sequence and both current-phase mappings while retaining and extending renegotiation exclusion checks. No test was disabled or exempted.
- PASS: Local CUA desktop (1180 px) and mobile (390 px) inspection of actual workspace components with explicitly synthetic fixtures. Six-phase navigation, return-to-current-work, region-level future preview, read-only historical intake and off-path exclusion were checked. DOM measurements found no horizontal/text overflow. This isolated harness mocks shell services and is not authenticated product acceptance.
- PENDING: Final-head PR CI, deployment and signed-in navigation readback.

## Rollout Plan

Squash merge after applicable checks and review pass. The repo-owned ACA main workflow builds and deploys the shared image. No migration, seed, flag or manual database job is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Capture after deployment.
- ACA runtime invariant: Compare template, healthy 100%-traffic revision and required workers against that digest.
- Worker image invariant: Verify both required workers; worker behavior is unchanged.
- Feature/env flag update path: None.
- Live signed-in proof required: Inspect navigation and previews without writes. A response/evaluation-stage event with governed records is separately required to prove actual upload and score readback.

## Rollback Plan

Revert through a PR and the repo-owned ACA main workflow. No stored records require deletion or relabelling.

## Audit Evidence

Focused baseline and mutation outputs, full typecheck, census, PR CI/review, local viewport screenshots, deployment run, runtime digest readback and signed-in navigation observations are separate proof layers.

## Known Gaps

This is reachability, not a complete eleven-stage Source New journey. Pricing and subsequent stages remain outside this workspace's phase coverage. The existing evaluator-authority panel does not claim supplier ranking or automated baseline scoring. Persisted multi-supplier intake and scoring acceptance need governed records and a signed-in round trip. Portal submission handoff remains a separate identity/recipient-authority workstream. No event was advanced, workbook uploaded, invitation sent or database mutation performed by this slice.
