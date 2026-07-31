# 2026-07-31-skyharbor-datasource-cleanup — Archive confirmed-stale skyharbor-air data locations

## Release ID

`2026-07-31-skyharbor-datasource-cleanup`

## Status

`candidate`

## Plain-English Summary

skyharbor-air's data was spread across more directories than were being tracked, with confusingly
similar naming (`standard-2026-07-v3`, `rich-synthetic-2026-07-v3` appearing under three different
parent paths). This removes the ones confirmed, individually, to have zero real consumers.

**Important correction to an earlier working hypothesis in this investigation**: an initial pass
concluded Tower's real mart-write job (`npm run project:tower-mart:airline-demo:write-job`) was reading
from a stale `datasets/tenant-inputs/skyharbor-air/standard-2026-07-v3/` directory instead of the
canonical `active/skyharbor-air/current/` — that would have been a serious live-data-correctness bug.
Direct `git blame` on `package.json` showed this is false: the correct path has been wired since
2026-07-24 (PR #5566, "fix tower active data path"), predating this session. Also incorrectly flagged
as "orphaned" in that same pass: `datasets/tenant-inputs/skyharbor-air/derived/relationship-graph.json`
and the design-contract-pack — both are genuinely live, read by `src/lib/home/read-derived-relationship-
graph.ts`, `home-dimension-visualization-contract.ts`, `home-knowledge-design-contract.ts`, and their
tests. Neither was touched by this release. Every directory actually removed here was independently
re-verified via exact literal-path grep (not a generic substring match) before deletion.

## Layer Impact

**Release lane: `client-data-lane`.**

- **Layer 1 (Client intake)**: removes stale Layer 1 intake directories with zero confirmed code
  consumers. No Layer 3/4 code touched, no database write.

## Client Applicability

- All clients: No.
- Specific clients: `skyharbor-air` only.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Deletes `datasets/tenant-inputs/skyharbor-air/standard-2026-07-v3/` (23 files) — confirmed zero
  literal path references anywhere in `src/`, `scripts/`, or `package.json`.
- Deletes `datasets/tenant-inputs/candidates/skyharbor-air/rich-synthetic-2026-07-v3/` (19 files) and
  `datasets/tenant-inputs/generated/skyharbor-air/rich-synthetic-2026-07-v3/` (21 files) — both
  referenced only by `scripts/knowledge/promote-active-relationship-depth.mjs`, a one-time promotion
  script already run for skyharbor-air on 2026-07-21 (its own `baselineBeforeFixRows: 77` marker is now
  obsolete — `12_relationships.csv` has 3,318 rows as of this session's other work).
- Deletes `datasets/tenant-inputs/candidates/skyharbor-air/interviews/` (1 file) — confirmed zero code
  references; content had already diverged completely from the real, actively-maintained
  `datasets/tenant-inputs/skyharbor-air/interviews/executive_interviews.csv`.
- Adds a comment to `scripts/knowledge/promote-active-relationship-depth.mjs` noting the skyharbor-air
  entry's source directories have been archived, so a future attempt to re-run it fails with a clear
  reason instead of a confusing missing-file error.

## QA / Validation

- Every removed path was verified via exact literal-path `grep` (e.g.
  `tenant-inputs/skyharbor-air/standard-2026-07-v3`, not the bare substring `standard-2026-07-v3`, which
  also matches an unrelated generic template-version label used across other tenants' tooling) —
  confirmed zero real code consumers before deletion, not inferred from a broader/fuzzier search.
- Explicitly confirmed NOT to touch `derived/relationship-graph.json` or the design-contract-pack after
  finding they're genuinely live (see Plain-English Summary).
- Explicitly confirmed the Tower mart-write-job path claim was false via `git blame` before taking any
  action on it — no `package.json` change was needed or made.
- `node scripts/release-check.mjs` — passed.

## Rollout Plan

Merge to `main` via the standard squash-merge path. No runtime rollout — repository content removal
only. Full history remains recoverable via git.

## Deployment Authority

- Repo-owned deploy workflow: Not applicable.
- Shared runtime mutators: None.
- Live signed-in proof required: No.

## Rollback Plan

Revert the merge commit; all deleted content is fully restored from git history.

## Audit Evidence

- PR (this change) — see PR description for link.
- `git blame -L 152,153 -- package.json` (proof the Tower write-job path was already correct).

## Known Gaps

- None of this release's changes affect what's actually loaded into any live product surface — that
  remains gated on the Admin Data Loader connector work (Phase 2-4 on the current roadmap).
