# 2026-10-10 — Read-only Moves UX and journey measurement

## Release ID

`2026-10-10-moves-walk-ux-quality`

## Status

`candidate`

## Plain-English Summary

The signed-in step-page walk now measures the live page at desktop and phone
widths, in light and dark. It records a seven-part UX score for each step,
phase and overall averages, and a separate read-only journey from origination
through the terminal handoff. The journey takes gate criteria from the same
evaluator used by the workspace and document status from the current artifact
cabinet. The proof includes a machine-readable JSON file, a summary table and
screenshots. No score or gate state is estimated when its read fails.

## Layer Impact

- Release lane: `experimental` for the existing demo-only step-page flag and
  its read-only acceptance workflow.
- Layer 3: no source, adapter, canonical data or schema changes. Existing
  evaluator and artifact reads remain the source of the measured states.
- Layer 4: an optional, flagged readback field on the existing phase
  intelligence route. The default response is unchanged.
- Control plane: the post-deploy read-only walk emits measured proof after the
  repo-owned deploy succeeds. It performs no product write.

## Client Applicability

- All clients: the ordinary phase intelligence response is unchanged.
- Specific clients: the synthetic demo workspace enrolled in the existing
  step-page flag can request the additional evaluator readback.
- Internal only: the automated acceptance artifact is an operator proof.
- Public/demo only: no.
- Feature flag: existing `moves_step_pages_v3`; no enrollment change.

## Changes Included

- The existing signed-in walk captures four viewport/theme variants per step,
  runs axe at both widths, records layout, copy, data and speed observations,
  and scores only dimensions that were measured.
- The walk follows an active Move only through its persisted current phase.
  Later pages are `not_reachable`, and the proof shows passed, known-gap,
  failed, unreachable and unassessed counts against all 29 registered pages.
- The phase intelligence route can return the evaluator's criterion IDs,
  severities, completion flags and open reasons only when requested under the
  existing step-page flag.
- The walk reads current generated artifacts and current-version sign-offs
  through the Move cabinet, records the six transitions separately, and writes
  `proof.json` plus `summary.md` in the uploaded artifact.
- Pure scoring and journey derivation have focused tests.

## QA / Validation

- Focused behavior and route tests: PASS, 23 tests in three suites.
- Mutation checks: PASS, four targeted scorer and reachability mutations killed.
- Typecheck and changed-file lint: PASS.
- Library orphan, route reachability and export reachability: PASS, no new gaps.
- CI test census: PASS, one new `src/` suite raised covered test files
  2,821 → 2,822; uncovered stayed 164. The additional behavior suite is
  outside the census's `src/` denominator and is named in the PR workflow.
- Tenancy fence coverage and manual currency checks: PASS.
- Playwright walk discovery: PASS, one signed-in test discovered.
- Release check: pending final run.
- Signed-in post-deploy measurement: not run for this candidate yet.

## Rollout Plan

Squash-merge after the normal PR gates. The repo-owned ACA main deploy workflow
releases the exact main commit. A successful deploy triggers the read-only
signed-in walk, which uploads its JSON, Markdown and screenshots. The progress
page may consume only that deployed artifact, with unmeasured states kept as
such.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by that workflow.
- ACA runtime invariant: verify template and 100% traffic revision against the
  approved digest before claiming deployment.
- Worker image invariant: verify required worker images against that digest.
- Feature/env flag update path: none in this release.
- Live signed-in proof required: the first post-deploy walk artifact, including
  per-view status and measured scores.

## Rollback Plan

Revert this PR through a new PR. The readback field is optional and flagged,
and no Move state or data is written by the walk.

## Audit Evidence

- This PR and its CI results.
- Post-deploy `moves-step-pages-live-walk` artifact with `proof.json`,
  `summary.md` and four screenshots per step view.
- The deploy artifact linking the serving digest to the tested main commit.

## Known Gaps

- UX rules are automated checks, not a substitute for the named design
  review. Review status belongs in the progress page separately from the score.
- Document counts describe current generated artifacts observed in the
  cabinet; they do not assert that every required deliverable was built.
- The active synthetic fixture currently reaches P3. P4 and P5 are reported
  as unreachable until a governed full-journey fixture exists. The existing
  P4 approved-estimate absence is a declared known gap when P4 is reachable.
- A post-deploy signed-in artifact does not exist for this candidate until
  the release deploys and the walk completes.
