# Source — award decision storage contract

## Release ID

2026-10-05-source-event-award-decision-schema

## Status

Merged — **migration authored, not applied.** Not deployed and not live-proven by this record.

## Plain-English Summary

No sourcing event could produce a contract. `source.contract` is written only by ingestion scripts,
so every contract in the platform arrived by import, and the entire schema carried a single
`award_approver` column with no award entity behind it. The product could reason about award
readiness and could not record an award.

This adds `source_event_award_decision`: which accepted candidate supplier won one event, who
decided it, why, and which canonical contract the decision produced.

Three constraints carry the meaning:

- **The winner must already be an accepted candidate.** A foreign key to
  `source_event_candidate_supplier_authority` means a free-text supplier name can never become an
  award, and an event cannot award to a supplier it never put on its panel.
- **An awarded row must name everything it asserts** — approver, time, rationale, evidence, and the
  contract id, name and currency. Each is checked for content, not merely for presence, so a blank
  string cannot satisfy it.
- **One live award per event, one contract id per tenant.** A second supplier cannot be awarded the
  same event without the first being retired by a named person, and a replayed award cannot produce
  a second contract.

An awarded decision is immutable; the contract it points at is part of what is frozen. Changing it
requires explicit retirement with a named person and a reason.

## Layer Impact

Release lane: **global-control-lane**.

Schema only. The migration is authored and sealed; it has **not** been applied to any environment. No
product code reads or writes the table yet — the writer and the route are separate slices.

## Client Applicability

All clients receive this, through the shared global control lane, once the migration is applied —
there is no per-client gating and no feature flag.

No client sees any behavioural change yet: the migration is authored and unapplied, and no product
code reads or writes the table. When applied, the table is tenant-scoped with row-level security on,
reads fenced by `can_read_tenant_by_key`, and writes restricted to the service role, so one client's
award decisions are never readable by another.

## Changes Included

- `supabase/migrations/20261005140000_source_event_award_decision.sql` — new table, indexes,
  immutability trigger, RLS policies and grants.
- `src/__tests__/integration/source/source-event-award-decision-migration.test.ts` — storage contract.

## QA / Validation

| Check | Status |
|---|---|
| Storage-contract suite | PASS — 6 cases |
| ESLint on changed files | PASS — exit 0 |
| `check-migration-seals` | PASS — 1 sealed migration verified |
| Migration applied | **NOT RUN — authored only** |
| Fresh-database replay | NOT RUN locally; CI runs it on the PR |
| Signed-in acceptance | NOT RUN |

One defect was found in the test rather than the schema: a negative assertion checked that the words
"score", "shortlist" and "recommendation" were absent, and failed — because the table's own COMMENT
names those words precisely in order to say an award is none of them. The assertion now targets the
column definitions, with a control proving the slice it examines is non-empty so the loop cannot pass
vacuously.

A static text test is weaker than a replay. It pins the invariants above against the file; it cannot
prove PostgreSQL accepts them. CI's fresh-database replay is the check that does.

## Rollout Plan

Merge to `main`. The migration is **not** applied by merging. Applying it is a separate, explicitly
authorised run of the repo-owned migration workflow naming this file.

## Deployment Authority

Repo-owned main deploy workflow for code. Repo-owned migration workflow for the apply, on named
authorisation. No ad-hoc database command.

## Rollback Plan

Before apply: revert the commit; nothing has changed in any database. After apply: the table is
additive and unread by product code, so it can be left in place; a reverting migration would drop it.

## Audit Evidence

- The foreign key to candidate authority is asserted by the suite, as is the awarded-state check and
  both unique indexes.
- The immutability trigger freezes `contract_id` alongside the award's identity fields.
- `check-migration-seals` verified the file.

## Known Gaps

- **Nothing writes this table yet.** The pure mapping from an award decision to a `source.contract`
  row exists on a held branch with 8 tests and four killed mutations; it has no consumer until the
  writer and route land.
- Applying the migration is owed and not claimed here.
- Not deployed and not live-proven. No signed-in readback.
