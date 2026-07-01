# 2026-07-01-source-p1-vendor-response-mve-standard — Source P1 Vendor Response MVE Standard

## Release ID

`2026-07-01-source-p1-vendor-response-mve-standard`

## Status

`candidate`

## Plain-English Summary

This candidate freezes the Source P0 golden path as the baseline and defines the
Source P1 standard for realistic vendor response intelligence. It clarifies
that Source should not become generic document Q&A. Source should extract the
minimum sourcing-critical information needed to compare vendors, challenge
unsupported claims, normalize pricing, create BAFO asks, and support executive
decisions.

## Layer Impact

- `global-control-lane`: Documentation and product doctrine only. No runtime
  behavior changes in this candidate.
- `public-demo`: Establishes the demo-safe rule that synthetic vendor names
  should be neutral and not imply real legal entities.

## Client Applicability

- All clients: Applies as Source product doctrine for future Source P1 work.
- Specific clients: None.
- Internal only: Codex handoff and product execution standard.
- Public/demo only: Synthetic vendor naming guidance.
- Feature flag: None.

## Changes Included

- Added Source P0 closure note.
- Added Source P1 vendor response minimum viable extraction standard.
- Added Codex handoff prompt for Source P1 vendor response MVE.
- Updated Source board-grade deliverable blueprint.
- Updated Source vendor response/proposal intelligence strategy.

## QA / Validation

- PASS: Documentation reviewed against the supplied P1 doctrine.
- NOT RUN: Runtime tests are not required because this candidate changes docs
  only.

## Rollout Plan

Merge through PR. No Azure Container Apps deployment is required for this
documentation-only candidate.

## Deployment Authority

- Repo-owned deploy workflow: Not required.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Not required for docs-only standard.

## Rollback Plan

Revert the documentation commit if the P1 standard needs to be rewritten.

## Audit Evidence

- PR diff.
- Release record.
- Source P0 closure note.
- Source P1 MVE standard.

## Known Gaps

Implementation is explicitly out of scope for this candidate. The next runtime
slice should generate or load realistic vendor response packages, run the
minimum viable extraction, produce BAFO-ready leverage outputs, and browser-prove
aVa Source advisor responses.
