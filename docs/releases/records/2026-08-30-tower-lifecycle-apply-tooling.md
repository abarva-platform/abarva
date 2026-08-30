# Tower — tooling to apply the lifecycle migration and prove it inert

## Release ID

`2026-08-30-tower-lifecycle-apply-tooling`

## Status

`candidate`

## Plain-English Summary

The assessment-lifecycle migration is written, guarded and merged, but has never been applied to a
database. Its central claim is that it is **inert**: it adds a declaration table nothing writes to
yet, and replaces `serving.tower_active_assessment_keys()` with one whose declared branch returns
nothing while that table is empty, and whose fallback is the prior ranking verbatim.

That claim is checkable, and until it is checked it is only an argument. This adds the two things
needed to check it:

- `ops:probe-tower-active-keys` — a read-only capture of what the function resolves, one sorted
  line per tenant, plus whether the declaration table exists and how many rows it holds.
- `tower:migrate:lifecycle:dry` and `tower:migrate:lifecycle:apply` — the migration through the
  established `run-migrations.ts` runner, matching the pattern already used for the foundation-v3
  migrations.

The sequence is: capture, dry-run, apply, capture again, `diff`. If any tenant's resolved
generation moves, the migration is wrong and the diff says exactly how.

Nothing here writes a declaration. That is the step after, and it is the one that changes what a
client sees.

## Layer Impact

Lane: `internal-admin` — this lane covers AbarVa-only operations capability, and no product lane is
touched. No schema, code, or product change: one read-only script and three npm entries. Nothing
runs on its own.

## Client Applicability

**Internal only.** No client-visible behaviour. The probe reports tenant keys, assessment ids and
projection versions — identifiers, not client data or values.

## Changes Included

- `scripts/ops/probe-tower-active-keys.mjs` — read-only capture.
- `package.json` — `ops:probe-tower-active-keys`, `tower:migrate:lifecycle:dry`,
  `tower:migrate:lifecycle:apply`.

## QA / Validation

**Status: PASS.**

| Check | Result |
| --- | --- |
| `node --check` | PASS — syntax clean |
| Mutating-statement scan on the probe | PASS — zero occurrences of insert/update/delete/drop/alter/truncate |
| `package.json` parse | PASS — still valid JSON |
| Migration applied | NOT RUN — that is what this enables |

## Rollout Plan

Merge so the next `main` image carries the scripts, then, through `npm run ops:aca-job`,
digest-pinned, with `--secret-env DATABASE_URL=azure-postgres-control-database-url`:

1. `ops:probe-tower-active-keys` — capture before.
2. `tower:migrate:lifecycle:dry` — read the planned statements.
3. `tower:migrate:lifecycle:apply` — apply.
4. `ops:probe-tower-active-keys` — capture after.
5. `diff` the two captures. Expected: identical `ACTIVE_KEY` lines, and `LIFECYCLE_TABLE` moving
   from `absent` to `present` with no rows.

Any difference in the `ACTIVE_KEY` lines stops the sequence there.

## Deployment Authority

`.github/workflows/aca-main-deploy.yml` on merge to `main`. The migration itself runs through the
governed ACA Job wrapper against the lab plane. No ad-hoc `az` command mutates anything and no
shared web runtime is touched.

## Rollback Plan

For this change: delete the script and the npm entries; nothing depends on them.

For the migration it applies: the prior function body is restored by reverting the lifecycle
migration's PR and re-applying. The table can be left in place — nothing reads it while the
function is reverted.

## Known Gaps

- **Lab only.** Production has not been read at any point in this work, and applying there is a
  separate decision.
- **The loader still writes no declaration**, so the fallback governs every tenant even after this
  is applied. That is intended: it keeps the applied migration inert and observable before anything
  depends on it.
- The probe reports counts and identifiers, not a full row census of the declaration table. It does
  not need to while the table is empty, and it says whether it is.

## Audit Evidence

The lifecycle migration's own release record lists "Applied against a database — NOT RUN" as a
known gap. This is the tooling that closes it, and the diff it produces is the evidence.
