# 2026-08-17-landscape-content-hash — Content hash on landscape packs

## Release ID

`2026-08-17-landscape-content-hash`

## Status

`candidate`

## Plain-English Summary

The first write run of the landscape projector failed on a NOT NULL violation: `home_knowledge_packs`
requires `content_hash` and the projector did not supply one.

The dry-run could not have caught it, because dry-run never reaches the insert. That is an argument
for exercising the write path against a real schema earlier, not for trusting a green dry-run
further.

The hash is taken over what the pack asserts rather than over the build label, so two builds of the
same canonical input hash identically. That makes runs comparable across versions and doubles as the
idempotency key the data-build job rule requires.

## Layer Impact

**Release lane: `client-data-lane`.** One additional column on an insert the projector already made.

## Client Applicability

- Specific clients: the two active tenants
- Feature flag: none

## Changes Included

- `scripts/data-build/refresh-home-landscape.ts` — computes and inserts `content_hash`.

## QA / Validation

- Pass: dry-run unchanged — 52 dimensions, 5,553 canonical records.
- Pass: `tsc -p tsconfig.json --noEmit` — 0 errors.
- Pass: `npm run release:check`.
- The failing run is the evidence the constraint is real: execution
  `job-abarva-private-operator-eus-kdkwr42`, error 23502 on `content_hash`.

**Nothing was written.** The insert failed inside the transaction, so the rollback left no partial
pack behind — the failure mode the in-transaction design was built for, exercised for real.

## Rollout Plan

Merge, deploy, re-run the ACA Job.

## Deployment Authority

Deploys through the repo-owned ACA main deploy workflow; the build runs as an ACA Job under
`docs/ops/aca-data-build-job-rule.md`.

## Rollback Plan

Revert. No data has been written by this projector in any environment.

## Audit Evidence

- The commit and its PR.
- ACA execution `job-abarva-private-operator-eus-kdkwr42` logs showing the constraint violation.
- The successful run's execution id and proof bundle, recorded on the PR.

## Known Gaps

- **Two env-override lessons from the failed runs**, worth recording because they will recur:
  start-time `--env-vars` replaces the container's whole env array, so an override that does not
  re-supply `DATABASE_URL` as a secret reference silently strips it. The first run failed for that
  reason and not for a data reason.
- The projector still has no schema assertion of its own. It discovers a missing required column by
  failing against the real table, which worked here but only because the write is transactional.
