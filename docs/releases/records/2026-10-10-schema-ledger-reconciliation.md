# Ops — does the database contain what the migration ledger says was applied?

## Release ID

2026-10-10-schema-ledger-reconciliation

## Status

Open — not merged, not deployed. Adds a **read-only** check. No migration applied by this change.

## Plain-English Summary

A governed migration apply failed today against the live lab database. It failed on the first of
three pending migrations: the vendor portal migration ALTERs `source_event_pricing_submissions`,
and that table **is absent from the live database**.

The ledger disagrees. `schema_migrations` records
`20260508040000_source_event_pricing_submissions.sql` — the migration that creates it — as applied
on **2026-05-15**.

### The ledger over-claims, and not only here

`run-migrations.ts` supports `--mark-all-applied`, which records a migration as applied **without
running it**. Rows recorded that way carry `sha256: null`.

Measured from the ledger artifact of the read-only status run:

| | |
|---|---|
| Ledger rows | 415 |
| Rows with a recorded hash | 148 |
| **Rows with `sha256: null`** | **267** |
| Null-hash rows stamped 2026-05-15 alone | 151 |

So for **64% of the ledger, "applied" is a claim rather than evidence**, and we now have one proven
case where the claim is false. How many more objects are missing is unknown — which is exactly the
problem this change addresses.

### Why not just repair that one table and retry

Because each retry is a failed transaction against the live database, discovering one missing
object at a time, and the failing run produced **no post-failure ledger or schema readback** — so
after a failure we cannot certify what persisted. Iterating that way turns an unknown into a
sequence of production failures.

This converts it into a list, before anything mutates.

## What this adds

`src/scripts/reconcile-schema-ledger.ts`, read-only. For every migration the ledger claims, it
reads that file's own `CREATE TABLE` statements and asks the catalog whether each relation exists,
then reports the migrations whose tables are missing.

Wired into `db-migration-lab.yml` directly after the existing ledger step — whose own comment
already poses this question and cannot answer it: *"was it never applied, or did the ledger drift
from what the schema itself shows?"*

**The mode asymmetry is the point:**

| Mode | Behaviour |
|---|---|
| `status` | reports, never fails — status is the investigation tool, and a known gap must not stop someone reading the ledger |
| `apply` | **fails the run** — an apply must not begin against a schema already missing tables its own ledger claims to have created |

That gate would have stopped today's failure before it touched the database.

## Changes Included

- `src/scripts/reconcile-schema-ledger.ts` — **new**, read-only. Reads each claimed migration's own
  `CREATE TABLE` statements and checks the catalog for each relation.
- `src/scripts/__tests__/reconcile-schema-ledger.test.ts` — **new**, 11 cases over the parser.
- `package.json` — `db:schema:reconcile`.
- `.github/workflows/db-migration-lab.yml` — the reconciliation step, reporting in `status` mode and
  failing the run in `apply` mode.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## Layer Impact

Release lane: **internal-admin**. One read-only operator script, one npm entry, one workflow step.
No product surface, no schema change, no stored value changes.

## Client Applicability

**Not applicable — no client receives this change.** It is operator tooling.

## QA / Validation

| Check | Status |
|---|---|
| Parser unit suite | PASS — 11 cases |
| **Parser run over the real migration corpus** | PASS — 407 files, 219 creating tables, 758 creations, 716 distinct names |
| Attribution of the three tables this incident turns on | PASS — each resolved to its correct creating migration |
| TypeScript `tsc --noEmit`, by exit code | PASS — exit 0 |
| ESLint | PASS |
| CI census / orphan audit | PASS — no drift, no change against baseline |
| Run against the live database | **NOT RUN** — that is the next dispatch |

### The parser is the half that can be wrong silently

A parser that finds fewer tables than a migration creates reports a clean database that is not
clean. So it is tested for what it must **not** do as much as what it must:

- a commented-out `CREATE TABLE`, in either comment style, is not counted — otherwise a migration
  header documenting an earlier shape sends someone to repair a hole that does not exist;
- `ALTER TABLE` is not read as a creation — reading it that way would have hidden this very gap, by
  attributing `source_event_pricing_submissions` to the portal migration that only adds a column;
- a schema-qualified name stays qualified, and a re-runnable migration reports its table once.

Verified against the real corpus rather than fixtures alone, because a fixture cannot prove a
parser survives 407 real files.

## Rollout Plan

Merge, then dispatch `mode=status`. The reconciliation reports; the apply stays blocked until the
list is empty or each entry is explained.

## Deployment Authority

Repo-owned workflows only. This change applies no migration and mutates nothing.

## Rollback Plan

Revert. The workflow returns to reporting the ledger without checking it against the schema, and an
apply can again begin against a schema missing objects its ledger claims.

## Audit Evidence

- The ledger artifact of read-only status run 38057691682 reports 415 rows, of which **267 carry
  `sha256: null`** and 151 of those are stamped 2026-05-15 — the `--mark-all-applied` signature.
- That same ledger records `20260508040000_source_event_pricing_submissions.sql` as applied on
  2026-05-15, while apply run 38073071181 failed because the table it creates is absent.
- The parser was run over all 407 migration files and resolved
  `source_event_pricing_submissions`, `source_event_vendors` and `source.vendor` each to its
  correct creating migration.
- A case asserts `ALTER TABLE` is not read as a creation; without it this gap would have been
  attributed to the portal migration and hidden.

## Known Gaps

- **Tables only.** It does not verify columns, constraints, policies, functions or indexes. A table
  that exists with the wrong shape is a harder question and is not answered here. A clean result
  means "every table the ledger implies is present", not "the schema matches the migrations". A
  check that silently covers less than it appears to is worse than one with a stated boundary.
- **The underlying repair is not in this change.** It makes the gap visible; closing it needs a
  reviewed migration repair once the full list is known.
- **The root cause is not addressed.** Nothing here stops a future `--mark-all-applied` from
  recording migrations that never ran. Restricting or recording that flag is a separate change.
- Not run against the live database yet, so the number of missing objects is still unknown.
