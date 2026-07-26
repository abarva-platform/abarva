# 2026-07-25-home-v4-lifecycle-cli-env-args — env-var flags for the governed operator job

## Release ID

`2026-07-25-home-v4-lifecycle-cli-env-args`

## Status

`candidate` — verified locally, not yet merged.

## Plain-English Summary

`2026-07-25-home-v4-lifecycle-cli.md` added a CLI for the reject/retire/rollback lifecycle actions,
intended to run through the governed ACA operator job. That job's wrapper
(`scripts/ops/submit-aca-operator-job.mjs`) only accepts a pinned npm script name, not ad-hoc CLI
flags — the same constraint already documented for the persist and inspect scripts, which both
already have env-var equivalents for their flags. The new lifecycle CLI didn't, so it could not
actually be invoked through the job as intended; this closes that gap the same way the other two
scripts already do.

## Layer Impact

- `internal-admin` lane: operator CLI only, same script added in the prior record — this only adds
  env-var argument sources to it, no new mutation logic.

## Client Applicability

- Internal only: this is an operator CLI argument-source fix, invoked exclusively through the
  governed ACA operator job by internal reviewers. No tenant-facing route, content, or data change.

## Changes Included

- `scripts/knowledge/manage-home-knowledge-v4-lifecycle.mjs`: `--reject`/`--retire`/`--rollback`,
  `--id`, `--tenant`, `--target-id`, `--by`, `--reason`, and `--write-db` now each also read from an
  env var (`HOME_KNOWLEDGE_V4_LIFECYCLE_MODE`/`_ID`/`_TENANT`/`_TARGET_ID`/`_BY`/`_REASON`/
  `_WRITE_DB`), matching the pattern already used by `persist-home-knowledge-v4-book.mjs` and
  `inspect-home-knowledge-v4-candidate.mjs`.

## QA / Validation

- `pass` — `node --check` and `npx eslint`, zero findings.
- `pass` — full-project `tsc --noEmit`, zero errors.
- `pass` — local dry-run invocation via env vars only (no CLI flags) confirmed the new fallback path
  parses correctly and the dry-run guard still holds.

## Rollout Plan

1. Merge to `main` → `aca-main-deploy.yml` builds the new image.
2. Run via the governed ACA operator job (env-var invocation) for the three reject actions this
   session's qualitative review calls for.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`, triggered by merge.
- Shared runtime mutators: the governed operator job executions that will use this fix afterward.
- Live signed-in proof required: no.

## Rollback Plan

Revert the PR. No schema change; CLI-flag invocation (if it were reachable outside the job) is
unaffected either way.

## Audit Evidence

- This PR's diff and CI run.
- The governed operator-job execution logs for the three reject actions this fix unblocks.

## Known Gaps

None known. This is a purely additive argument-source change to a CLI that has never been
successfully invoked through the governed job before this fix, so there is no prior behavior to
regress.
