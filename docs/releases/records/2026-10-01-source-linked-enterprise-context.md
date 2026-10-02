# 2026-10-01-source-linked-enterprise-context — Source-Linked Home Briefing

## Release ID

`2026-10-01-source-linked-enterprise-context`

## Status

`candidate`

## Plain-English Summary

Adds a deterministic enterprise context view for a source-linked Home assessment. It joins declared business segments and functions to priorities, programs, applications, spend, data, workforce, measures, and risks by stable IDs. The current-record briefing presents short, inspectable business, strategy, and operating views while keeping prior narrative separate.

## Layer Impact

- Release lane: `global-control-lane`.
- Canonical model: read only through the existing Home serving projection; no canonical write.
- Products: Home presentation and projection-to-context interpretation. No active-assessment selector changes.

## Client Applicability

- All clients: existing Home views remain unchanged unless a source-linked enterprise profile with the declared synthetic reference basis is present.
- Specific clients: no real-client activation.
- Internal only: current lab assessment path.
- Public/demo only: no new public route.
- Feature flag: none; the served record and source-link checks gate the view.

## Changes Included

- Reuses the established segment-spine calculation with declared function IDs and an explicit shared-function bucket.
- Adds concise executive, business, strategy, and operating views with source dates, record links, and visible unmatched or uncited rows.
- Preserves stable join IDs in the Home record browser so readers can follow figures to rows.
- Reuses the production serving-payload unwrap for the new context builder.

## QA / Validation

- PASS: focused Jest tests cover the versioned source fixture, wrapped serving payloads, shared functions, unmatched priorities, citation exclusion, and distinct chapter output.
- PASS: local typecheck and lint. NOT RUN: signed-in acceptance of this new panel; the source assessment is still shadowed.
- BLOCKED pending deployment: ACA runtime invariant and full live walkthrough proof.
- The release does not establish aVa parity, financial value validation, or trend evidence.

## Rollout Plan

Merge by PR and deploy through the repo ACA main workflow. Keep the shadow assessment unselected until its projection proof and signed-in acceptance are available. Recheck record-source labels, counts, chapter content, aVa, and export after any governed selection.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: record from successful main deployment.
- ACA runtime invariant: verify after deployment.
- Worker image invariant: verify required workers match the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: verify which assessment is actually on screen.

## Rollback Plan

Revert the presentation change by PR and the ACA main workflow. No canonical or tenant data is changed by this release.

## Audit Evidence

- PR checks, deterministic fixture assertions, signed-in browser proof, main deploy run, and runtime invariant output.

## Known Gaps

- Source-linked context is not a reviewed executive interpretation. Customer/channel economics, realized value, full dependency findings, aVa parity, export parity, and change over time require separate evidence and acceptance.
