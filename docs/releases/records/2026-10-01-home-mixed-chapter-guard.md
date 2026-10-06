# 2026-10-01-home-mixed-chapter-guard - Mixed Chapter Presentation

## Release ID

`2026-10-01-home-mixed-chapter-guard`

## Status

`candidate`

## Plain-English Summary

When live serving rows and the reviewed chapter narrative are not one verified version, every chapter now opens with the current record's typed coverage and source-state labels. The prior interpretation remains accessible in a closed, dated disclosure. Missing interview rows are stated before any prior leadership interpretation can be opened. Coherent served records and selected reviewed records retain their existing presentation.

## Layer Impact

- Release lane: `global-control-lane`.
- Layers 1-3: no change to intake, adapters, canonical data, or serving projections.
- Layer 4: Home chapter presentation only; no advisor or export truth contract change.

## Client Applicability

- All clients: mixed live-row/reviewed-narrative Home chapters use the guard.
- Specific clients: none.
- Internal only: none.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Apply the mixed-state chapter frame to all eight chapters, not only the opening chapter.
- Derive chapter coverage from the same typed record families used by chapter depth; label absent families `Not served`.
- Keep chapter prose and its secondary business or perspective sections inside the dated prior-interpretation disclosure.
- State when current leadership interview rows are absent.

## QA / Validation

- PASS: 376 Home component tests across 32 suites.
- PASS: TypeScript and touched-file ESLint.
- PASS: Home ratchet, 781/809 tests with the same 12 baselined failing suites and no movement.
- NOT RUN at candidate authoring: PR CI and live signed-in proof.

## Rollout Plan

Squash-merge after PR checks pass. Deploy through the repo-owned ACA main workflow, verify digest parity across the web and required workers, then inspect all chapter openings in a signed-in browser. No data build is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this release.
- Approved image digest: determined by the main deploy workflow.
- ACA runtime invariant: verify web template, 100%-traffic revision, and required worker images.
- Feature/env flag update path: none.
- Live signed-in proof required: mixed chapters lead with current coverage; prior interpretation is closed; reviewed/coherent paths remain unchanged.

## Rollback Plan

Revert through a controlled PR and redeploy through the same workflow. No data rollback is needed.

## Audit Evidence

Focused component regression tests, Home ratchet, PR checks, ACA main deploy run, runtime digest readback, and signed-in chapter proof.

## Known Gaps

This is a presentation guard, not a current chapter writer. It does not approve partial source files, resolve missing source links, serve missing business or interview families, or make prior interpretation current. Full export retains its existing record-state warning and presentation; a separate export layout review remains open.
