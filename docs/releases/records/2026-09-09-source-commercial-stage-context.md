# 2026-09-09-source-commercial-stage-context — Governed commercial-stage context

## Release ID

`2026-09-09-source-commercial-stage-context`

## Status

`candidate`

## Plain-English Summary

Source commercial stages now reuse the normalized response evidence loaded for the active sourcing event. Evaluation, pricing, BAFO, award, and transition views no longer substitute sample vendors, fixture bids, or canned recommendations when event-specific evidence is unavailable. Missing numeric pricing and blocked score-improvement scenarios are shown as unestablished or pending evidence.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 — Products: Source event pages now project existing normalized response records consistently across downstream commercial stages.
- Layers 1-3: No intake, adapter, schema, canonical-record, or data mutation change.

## Client Applicability

- All clients: Yes, for Source event commercial-stage rendering.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Extend normalized response-context loading to evaluation, pricing, BAFO, award, selection, and transition stages.
- Replace fixture-backed pricing, award, and transition panels with fail-closed event evidence views.
- Render the existing normalized evaluation scorecard and BAFO instruction panels on their corresponding stages.
- Suppress a numeric score-uplift label when the scenario is held pending evidence.
- Add focused regression tests for event-vendor identity, absent numeric pricing, fail-closed behavior, transition guardrails, and held score scenarios.

## QA / Validation

- PASS — 27 focused Source commercial-stage component and analytics-canvas tests.
- PASS — scoped ESLint for touched TypeScript files.
- PASS — TypeScript no-emit compile with an 8 GB heap.
- PASS — release governance check.
- NOT RUN — live signed-in proof; required after the main deployment.

## Rollout Plan

Merge through a protected pull request. The repo-owned ACA main deploy workflow builds and deploys the exact merge SHA, verifies the digest-pinned runtime invariant, and shifts shared Product/Lab traffic. Then run a signed-in stage-by-stage check of Responses, Evaluation, Pricing, BAFO, Selection, and Transition.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: The repo-owned main deploy workflow only.
- Approved image digest: Recorded by the deploy workflow for the merge SHA.
- ACA runtime invariant: Web template and 100% traffic revision must match the approved digest.
- Worker image invariant: Required worker jobs must match the approved digest.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the squash-merge commit through a new pull request and allow the main deploy workflow to restore the prior component behavior. No data rollback or migration is required.

## Audit Evidence

- Pull request and merge SHA.
- Focused Jest, ESLint, TypeScript, and release-check output.
- ACA main-deploy run for the merge SHA.
- Signed-in browser proof for each affected commercial stage.

## Known Gaps

Numeric bid amounts remain unestablished until accepted pricing facts are parsed from the submitted commercial workbooks. This release deliberately exposes that evidence gap instead of filling it with sample values.
