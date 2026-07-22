# 2026-07-22-home-pack-per-tenant-rerun — per-tenant re-run for the Home pack population job

## Release ID

`2026-07-22-home-pack-per-tenant-rerun`

## Status

`candidate`

## Plain-English Summary

Adds a `HOME_PACK_TENANT` environment override so a single tenant can be regenerated through the governed ACA operator job.

Found during the first full population. The Claude layer is generated over two API calls, and the forward-looking (strategic narratives) call transiently fails; the completeness gate correctly holds those tenants at `candidate` rather than publishing an empty "New Ways of Operating". Retrying them is the normal operational path — but the operator npm script pins `--tenant=all`, so the only way to retry one tenant was to regenerate all five, which re-rolls the dice on tenants that already passed (and, because `pack_version` is derived from the source hash, the re-run hits `ON CONFLICT DO UPDATE` on the same row and can downgrade an already-approved pack back to `candidate`).

`HOME_PACK_TENANT` now takes precedence over the `--tenant` flag, so the operator job can pass `--env HOME_PACK_TENANT=<tenant>` and regenerate exactly one tenant without editing the pinned script.

## Layer Impact

- `global-control-lane`: one-line generator argument-resolution change plus comment. No schema, no runtime read-path change.

## Client Applicability

- All clients: enables targeted per-tenant regeneration during population.
- Internal only: operator tooling.
- Feature flag: None.

## Changes Included

- `scripts/knowledge/build-home-knowledge-pack-v2.mjs`: `requestedTenant` now resolves `process.env.HOME_PACK_TENANT || getArg("--tenant", "all")`.

## QA / Validation

- `pass` — `node --check` + `npx eslint` clean.
- `pass` — Override scoping: `HOME_PACK_TENANT=apex-retail ... --tenant=all` processed **only** `apex-retail`.
- `pass` — No regression to the default: with no env var, `--tenant=all` still processed all 5 tenants.
- `n/a` — No migration, no runtime change.
- `pass` — `node scripts/release-check.mjs --base origin/main --head HEAD` (run pre-push).

## Rollout Plan

Merge + deploy through the normal ACA lane. Then re-run the one remaining held tenant via the operator job with `--env HOME_PACK_TENANT=apex-retail`, and confirm it flips from `candidate` to `approved` with non-zero strategic narratives.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main deploy after merge.
- Shared runtime mutators: none in this PR; the population operator job is dispatched separately through the governed ACA-job lane.
- Migration application: none.
- Feature/env flag update path: new optional `HOME_PACK_TENANT` env var, unset by default (behaviour unchanged when absent).
- Live signed-in proof required: no runtime-visible change.

## Rollback Plan

Revert the PR. With the env var unset the behaviour is identical to today, so a revert is a no-op for existing runs.

## Audit Evidence

- First full population results (execution `sxrsgk9`) and the follow-up all-tenant re-run (`2238qzp`), showing the completeness gate holding incomplete tenants at `candidate` and recovering Lakeshore/FS Demo on retry.

## Known Gaps

- The strategic-narratives call still fails intermittently under sustained sequential load (observed roughly 1-3 of 5 tenants per full run, even with retry broadened to no-status transients). Per-tenant re-run is the mitigation; a deeper fix (pacing between tenants, or a rate-limit-aware backoff across the whole run) is worth doing if the population is run frequently.
- Apex Retail remains `candidate` pending its targeted re-run.
