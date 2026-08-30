# Tower — report what a retention sweep would remove, before writing one

## Release ID

`2026-08-30-tower-retention-report`

## Status

`candidate`

## Plain-English Summary

Retiring a generation makes it unreadable through the serving views. It does not delete it:
`tower_ai_portfolio` alone holds 720 rows at projection version 1 against 55 at version 2.

Deleting them is the obvious next step and it is the one most likely to destroy data, so this is
the report that has to come first. It answers two questions, neither of which is safe to assume:

**Does a retired generation share an `assessment_id` with a live one?** The loader's existing
deletes are scoped `tenant_key AND assessment_id`, with no `projection_version`. Reusing that
predicate for a sweep would, on any assessment carrying both a live and a retired generation,
delete the live rows. The report states per table whether that condition exists.

**Which tenants are on which version?** The lab has `meridian-health` on version 2 and
`skyharbor-air` on version 1. Of the 720 rows at version 1, roughly half are SkyHarbor's live data.
A sweep keyed on "anything below the highest version" — the obvious implementation — would have
deleted a tenant's entire dataset.

It also lists every generation with per-table row counts, what a state-keyed sweep would remove,
and every **undeclared** generation, which is kept and never swept: undeclared means unknown, and
unknown is not a licence to delete.

No sweep is written here. The sweep is the next change, and this report is its precondition.

## Layer Impact

Lane: `internal-admin` — this lane covers AbarVa-only operations capability, and no product lane is
touched. Read-only; no schema, code, or product change.

## Client Applicability

**Internal only.** No client-visible behaviour. The report contains tenant keys, assessment ids,
versions and row counts — identifiers and counts, not client data.

## Changes Included

- `scripts/ops/report-retired-tower-generations.mjs` — the report.
- `package.json` — `ops:report-retired-tower-generations`.

## QA / Validation

**Status: PASS.**

| Check | Result |
| --- | --- |
| `node --check` | PASS — syntax clean |
| Mutating-statement scan | PASS — the two keyword matches are prose in the header comment; every statement is a `SELECT` |
| `package.json` parse | PASS — valid JSON |
| Run against the lab plane | PENDING — immediately after this merges |

## Rollout Plan

Merge, then run through `npm run ops:aca-job`, digest-pinned, with
`--secret-env DATABASE_URL=azure-postgres-control-database-url`. The output decides whether a sweep
can be written at all, and on what predicate.

## Deployment Authority

`.github/workflows/aca-main-deploy.yml` on merge to `main`. The report runs through the governed ACA
Job wrapper and is read-only.

## Rollback Plan

Delete the script and the npm entry. Nothing depends on it.

## Known Gaps

- **No sweep exists yet.** That is deliberate. The predicate it should use is exactly what this
  report establishes.
- **A retention window is not modelled.** Whether a generation should be deletable the moment it is
  retired, or only after a rollback window, is a decision this report informs but does not make.
- Lab only.

## Audit Evidence

The counts motivating this come from `ops:probe-tower-serving-shape` run on 2026-08-30:
`[{"projection_version":2,"rows":55,"not_in_active_view":0},{"projection_version":1,"rows":720,
"not_in_active_view":360}]`, and from `ops:probe-tower-active-keys`, which showed
`skyharbor-air` resolving to projection version 1 — establishing that half the version-1 rows are
a live tenant's data.
