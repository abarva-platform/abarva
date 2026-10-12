# 2026-10-12-home-ava-record-quality - Record counts and compact advisory points

## Release ID

`2026-10-12-home-ava-record-quality`

## Status

`candidate`

## Plain-English Summary

Home answers simple visible-record count questions directly from the selected bundle, without a model call. Structured advisory points preserve their separate list layout through sanitization and the native chat renderer. Counts are explicitly record rows, not unique vendors, estate completeness or attested outcomes.

## Layer Impact

Release lane: `global-control-lane`.

- Layers 1-3: no ingestion, tenant data, canonical schema, load approval, serving selection or admission changes.
- Layer 4: Home advisor packet construction and presentation only. Existing source selection, authorization, changed-record checks and narrative coherence gates remain intact.

## Client Applicability

- All clients: Home advisor readers use their currently selected record.
- Specific clients: no tenant-specific logic or exception.
- Internal only: no new operator access.
- Public/demo only: existing synthetic and source-state labels remain unchanged.
- Feature flag: no new flag.

## Changes Included

- Deterministic visible-family row counts with cited record markers, a table and an explicit counting basis.
- Missing families remain unknown, not zero. Unique-vendor, spend, value and exposure questions do not take this row-count shortcut.
- Structured short answer points and newline-preserving sanitization; no change to aVa branding or the shared chat design.

## QA / Validation

PASS: 27 focused Home suites / 297 tests; four focused packet and UI suites / 112 tests (overlapping coverage); TypeScript, focused ESLint, all 11 release gates and all five context-corpus checks. Existing manifest warnings are unchanged. Home ratchet: 736/764 tests, 12 previously baselined suites, no movement. Packet tests cover model-free row counts, missing families, filtered counts, citation retention and separate points. The mounted dock test verifies that its markdown boundary preserves the list structure; native list rendering is NOT RUN until signed-in deployment proof. No live-readiness claim is made in this candidate record.

## Rollout Plan

Protected PR and squash merge, followed only by the repo-owned ACA main deploy workflow. No tenant data refresh or promotion is included.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: capture from the main deploy.
- ACA runtime invariant: template and 100% traffic revision match the approved digest.
- Worker image invariant: required workers match the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: record-source state, visible-row count parity and compact answer list rendering.

## Rollback Plan

Protected revert of this change through the same main workflow. No data rollback or serving-pointer change is required.

## Audit Evidence

Focused packet and mounted-render tests, current-head CI, release gates, approved main deploy, runtime digest checks and private signed-in screenshots.

## Known Gaps

This does not refresh a stored record, establish unique business-object counts, attest economic outcomes or admit new context to agents. New integrated insight versions retain their independent load, review and serving gates.
