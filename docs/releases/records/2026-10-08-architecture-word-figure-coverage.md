# 2026-10-08-architecture-word-figure-coverage — Preserve governed figures in Word export

## Release ID

`2026-10-08-architecture-word-figure-coverage`

## Status

`candidate`

## Plain-English Summary

The architecture model already contains governed diagrams, but Word export previously rendered only the document text and its separately declared exhibits. This change embeds the saved architecture diagrams using the existing document figure layout. The packaged-file quality check requires every architecture figure by key before download or generated-draft acceptance.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Products: the shared Word renderer and architecture artifact readback now preserve structured visuals. Canonical facts and source adapters do not change.

## Client Applicability

- All clients: generated architecture Word artifacts.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing architecture generation enrollment remains unchanged.

## Changes Included

- Pass the validated, persisted architecture model through Word generation, download, and draft acceptance.
- Rasterize the same governed SVGs used by the architecture preview and deck into the existing figure style, with titles, captions, decision implications, and stable figure keys.
- Fail Word quality checks when any required architecture figure is absent from the packaged file.

## QA / Validation

- PASS: 89 focused route and renderer tests, including exact packaged Word figure keys and a missing-figure negative case.
- PASS: scoped ESLint and coverage census; the committed census already matches.
- PASS: local synthetic fallback Word export rendered to seven pages in LibreOffice. All 13 diagrams were embedded; inspected pages showed no clipping or overlap. This is layout QA, not signed-in product proof.
- PASS: full typecheck, including tests.
- PASS: release check, all 11 gates.
- NOT RUN: signed-in post-deployment Word download and review.

## Rollout Plan

Squash merge the scoped PR after its prerequisite export change. The repo-owned ACA main deploy workflow builds and deploys the approved digest. Verify the web and worker runtime invariant, then download and review a generated architecture report from a signed-in session.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the deploy workflow.
- ACA runtime invariant: verify template and 100% traffic revision against the approved digest.
- Worker image invariant: verify required worker images against the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, inspect the packaged Word figures and rendered pages.

## Rollback Plan

Revert the PR and redeploy the prior approved digest through the repo-owned workflow. Stored source models and documents remain unchanged.

## Audit Evidence

PR checks, route and renderer test output, packaged figure-key inspection, local page review, ACA deploy run, runtime invariant proof, and signed-in downloaded-file inspection.

## Known Gaps

Architecture PDF overrides still use the document's declared exhibit payload. They need a separate figure-coverage check before being treated as equivalent to the Word and PowerPoint exports.
