# 2026-10-08-root-cause-tree-exhibit-kind — Root-cause-tree exhibit uses a keepable kind

## Release ID

`2026-10-08-root-cause-tree-exhibit-kind`

## Status

`candidate`

## Plain-English Summary

The P2 Root Cause Worksheet reliably failed to build with "missing exhibits" for its
`root_cause_tree`. The cause was deterministic: the deliverable structure declared that exhibit's
`kind` as `"diagram"`, and the exhibit `kind` is sent to the authoring model, which then stamped its
payload `"diagram"`. But the exhibit validator keeps an exhibit only for a known payload kind (flow,
matrix/heatmap/comparison, timeline/roadmap, value_tree, or the architecture kinds) — `"diagram"`
falls through and is discarded, so the deliverable could never build. `"diagram"` was the only
declared exhibit kind the validator does not handle.

This changes that exhibit's kind to `"flow"` (a directed symptom -> cause -> evidence graph, which
the validator keeps and which fits the issue-tree logic), and adds a test that (a) pins the handled
kind set to the validator and (b) asserts every exhibit kind declared across all deliverable
structures is one the validator handles — so a future unhandled kind is caught in CI, not by a
silently blocked build.

## Layer Impact

Release lane: **global-control-lane** (shared generation behavior for all clients; not flag-gated).

- **Layer 4 (Products — deliverable generation):** the `root_cause_worksheet` structure's
  `root_cause_tree` exhibit declares a keepable kind. No change to the validator, the quality gate,
  or any phase gate.
- No change to Layers 1–3.

## Client Applicability

- All clients: yes (generation-quality fix; no flag).
- Feature flag: none.

## Changes Included

- `src/lib/deliverables/orchestrator/briefs/deliverable-structures.ts` — `root_cause_tree` exhibit
  kind `"diagram"` -> `"flow"`.
- `src/lib/deliverables/orchestrator/__tests__/deliverable-structure-exhibit-kinds.test.ts` — new:
  handled-kind set is pinned to the validator, and every declared structure exhibit kind must be
  handled.
- `docs/architecture/test-ci-coverage-census.json` — regenerated for the new test file.

## QA / Validation

- New suite: 2/2 pass. Full typecheck clean; eslint clean on touched files.
- Coverage census regenerated; no drift.
- Note: `symptom_cause_table` (kind `matrix`) was always a keepable kind; `root_cause_tree`
  (`diagram`) was the guaranteed-fail one this fixes. Residual model-variance shortfalls on other
  exhibits are out of scope.
- Live proof owed: a P2 `root_cause_worksheet` build producing `root_cause_tree` + `symptom_cause_table`.

## Rollout Plan

Merge to main (squash); active on the next ACA main deploy. No migration, no data change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none beyond the standard deploy.
- Approved image digest: assigned by the main deploy workflow on merge.
- ACA runtime invariant: must hold after deploy (template image = 100%-traffic revision = digest).
- Worker image invariant: deliverable-generation workers must serve the merged digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — a root_cause_worksheet build with both exhibits present.

## Rollback Plan

Revert the PR and redeploy. A one-line structure change plus a test; no migration or data to unwind.

## Known Gaps

- This fixes the deterministic failure (an unhandled exhibit kind). Exhibit production remains
  model-driven; a bounded regenerate/repair pass for discarded required exhibits is a separate,
  broader improvement.
- The `ExpectedExhibit.kind` type still admits semantic-only labels (`diagram`, `chart`) that are
  not validator payload kinds; the new test guards against a structure using them, but narrowing the
  type itself is left as a follow-up to avoid touching unrelated references.
- Live proof owed (above).

## Audit Evidence

- PR URL: (to be filled on open).
- CI run: required checks on the PR.
- New test output: 2/2 as above.
