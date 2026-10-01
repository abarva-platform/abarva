# 2026-09-30-home-record-state-first-screen - Home Record State First Screen

## Release ID

`2026-09-30-home-record-state-first-screen`

## Status

`candidate`

## Plain-English Summary

Home now places the record/narrative mismatch or reviewed fallback state at the top of every page, not only in its navigation rail. Source-file quality is named as quality rather than human approval. The synthetic provenance line no longer presents an internal assessment identifier as executive copy. No underlying claim, row, or review state changes.

## Layer Impact

- Release lane: `global-control-lane`.
- Layers 1-3: no change.
- Layer 4: Home presentation of existing record-source and narrative-coherence state.

## Client Applicability

- All clients: Home shows a page-level status for mixed served records and reviewed fallback records.
- Specific clients: none.
- Internal only: none.
- Public/demo only: synthetic provenance wording applies only when the bundle declares synthetic/not-attested origin.
- Feature flag: none.

## Changes Included

- Show the existing source, narrative, and source-file quality labels before page content when the record is mixed or falling back.
- Distinguish a source file's quality state from human source-set approval in the visible copy.
- Keep the status band absent when a served narrative is coherent or a reviewed snapshot is intentionally selected.
- Use plain language for a declared synthetic provenance notice while preserving the record marker in the audit data and export.

## QA / Validation

- PASS: 67 focused Home tests across four suites, including mixed state, source quality, advisor/export labels, fallback, coherent state, and provenance copy.
- PASS: TypeScript, touched-file lint, and formatting.
- PASS: Home ratchet, 771/799 with 12 baselined failing suites and no movement away from the baseline.
- PASS: release check.
- NOT RUN at candidate authoring: PR CI; required checks must pass before merge.
- NOT RUN until deployment: signed-in proof of the first-screen status and absence of the raw assessment identifier.

## Rollout Plan

Merge by PR and deploy through the repo-owned ACA main workflow. No tenant write, data-build job, or source approval is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this release.
- Approved image digest: determined by the main deploy workflow.
- ACA runtime invariant: verify web template, 100%-traffic revision, and required worker images.
- Feature/env flag update path: none.
- Live signed-in proof required: mixed-record/fallback status and provenance copy.

## Rollback Plan

Revert by a new controlled PR and deploy through the same workflow. No data rollback is needed.

## Audit Evidence

- Focused tests, Home ratchet, PR checks, main deploy run, runtime digest readback, and signed-in browser proof.

## Known Gaps

This makes a mixed record explicit but does not reconcile an older narrative to current rows, complete source links, establish a data-as-of date, or approve partial source files. It does not by itself make Home ready for an executive walkthrough.
