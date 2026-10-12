# 2026-10-12-tower-source-context-copy — Explain source context in Tower details

## Release ID

`2026-10-12-tower-source-context-copy`

## Status

`candidate`

## Plain-English Summary

The Tower program and AI use-case details now explain source status, work stage, and expected benefit type in everyday words. Each row also shows the exact source value, so a reader can check what the intake actually said. The wording describes a plan or reported state; it does not turn it into a verified result.

## Layer Impact

Release lane: `global-control-lane`.

- Layer 1: no intake file or source value changes.
- Layer 2: no adapter changes.
- Layer 3: no canonical object or relationship changes.
- Layer 4: presentation labels only in Tower's program and AI use-case detail drawers. The original source codes remain visible.

## Client Applicability

- All clients: the labels appear when the matching source fields are present in the Tower read model.
- Specific clients: none.
- Internal only: none.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Adds plain-English labels for declared program status and work stage, including a readable fallback for unfamiliar values.
- Adds plain-English labels for declared AI case status and expected benefit type.
- Shows the exact intake value beside each explanation and keeps missing fields as missing.
- Keeps planned benefit language separate from measured or Finance-verified value.

## QA / Validation

- Pass: focused Tower drawer tests, 17 tests across two suites, cover source-code readback, planned-benefit language, and the three registered expected-benefit types.
- Pass: focused ESLint and `git diff --check`.
- Pass: full TypeScript typecheck and all 11 release checks.
- Not run yet: protected PR CI. It is required before merge.

## Rollout Plan

Merge the protected PR to `main`. The repository-owned ACA main deploy workflow builds and deploys the exact merge commit. Confirm the healthy 100% traffic revision and required worker image parity. Check the affected drawers in a signed-in session before calling the wording live-proven.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: only that workflow.
- Approved image digest: determined by the main deploy workflow at release.
- ACA runtime invariant: web template, healthy 100% traffic revision, and required worker images must match the approved digest.
- Worker image invariant: verify both required worker jobs against the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for the program and AI case drawers.

## Rollback Plan

Revert this presentation change through a protected PR and the main ACA deploy workflow. No data rollback or selector change is needed.

## Audit Evidence

The PR diff, focused test results, release check, current-head CI, deploy run, runtime parity, and signed-in drawer observations form the release evidence. Deploy and browser evidence are pending.

## Known Gaps

Source status and expected benefit type remain declarations from intake. They do not establish approved funding, measured value, or Finance sign-off. Unfamiliar source values are spaced for readability and retained verbatim beside the label; they need owner review before a specific interpretation is added.
