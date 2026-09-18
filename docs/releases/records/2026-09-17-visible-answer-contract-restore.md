# 2026-09-17-visible-answer-contract-restore - Restore Four Checks To A Blocking Gate

## Release ID

`2026-09-17-visible-answer-contract-restore`

## Status

`candidate`

## Plain-English Summary

`assertVisibleAnswerContract` is a blocking gate: several answer routes return `422 visible_answer_contract_failed` when an answer violates it. On 7 July 2026 a large refactor deleted the module's body, and it was re-implemented two commits later to unbreak the build. The rewrite did not carry over four checks.

Since then an answer could reach a user while being empty, containing a raw UUID, naming an internal table, or carrying a filesystem path or stack-trace reference. The record-ID pattern that survived is uppercase-only, so it cannot match a UUID — nothing else covered that case.

This restores those four checks, with two deliberate departures from the original, both described below.

## Layer Impact

`global-control-lane`. One shared answer-validation module consumed by several answer routes. No schema, migration, adapter, projection or UI change.

## Client Applicability

- All clients: every surface whose answers pass through this gate.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/agent/visible-answer-contract.ts`: restores `blank_answer`, `raw_uuid`, `internal_table_name` and `debug_or_path`.
- `src/lib/agent/__tests__/visible-answer-contract.test.ts`: a test per restored check, plus a false-positive guard.

### Two deliberate departures from the pre-July version

1. **The original also banned the bare word "JSON".** This product advises on data platforms and vendor integrations, where "JSON" is ordinary business language. Because this gate returns 422, a false positive costs the user their answer entirely. The restored check bans internal table names only; a raw JSON blob is still caught by the existing `raw_json` check. The narrower check is named `internal_table_name` rather than the original `json_or_table_name` so the difference is visible in any audit record.
2. **The original path check could not match most paths.** It placed one `\b` in front of every alternative, including `\/Users\/` and `src\/`. A word boundary cannot sit between a space and a `/`, so those alternatives only matched when glued to a preceding word. Each alternative now carries the boundary it actually needs. Restoring it verbatim would have restored a check that did not work.

Not restored, and deliberately left alone: the singular-`row` widening and the broader internal-vocabulary list from the original. Both carry a materially higher false-positive risk on ordinary prose, and this gate blocks rather than warns.

## QA / Validation

- `visible-answer-contract`: 13 of 13 pass, including the four restored checks and a guard asserting that prose discussing vendor JSON extracts still passes.
- Consumer scopes `src/lib/agent`, `src/lib/atlas`, `src/lib/home/know` measured against a clean `origin/main` tree: **33 failing before, 33 failing after** — unchanged, with the 5 new tests passing on top. Status: **pass**, no regression.
- Full-project `tsc --noEmit`: **pass**. Scoped ESLint: **pass**.
- Signed-in acceptance: **not run** — blocked, host machine locked.

## Rollout Plan

Squash-merge after required checks pass; the repo-owned ACA main deploy workflow publishes the change. No migration and no data build.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: To be recorded after deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Confirm normal answers still render on the consuming surfaces — this gate blocks, so the risk of a restoration is refusing a good answer, not admitting a bad one. Watch for any rise in `visible_answer_contract_failed`.

## Rollback Plan

Revert through a new PR and the repo-owned deploy workflow. Nothing persisted changes.

## Audit Evidence

PR link, before/after consumer-scope counts, and CI to be added when available.

## Known Gaps

- A gate that blocks can only be as good as its false-positive rate. If `debug_or_path` proves noisy on IT advisory prose — "debug" is a plausible word in that domain — narrow that alternative rather than deleting the check.
- The same July refactor narrowed other checks in this module that are not restored here, listed above with the reason.
- No signed-in browser proof yet.
