# Source — a supplier can be originated before it exists anywhere else

## Release ID

2026-10-07-prospective-supplier-origination

## Status

Merged — **the migration is authored and NOT applied**. Not deployed and not live-proven by this
record. The route refuses until the migration is applied; see Rollout.

## Plain-English Summary

A supplier a sourcing team wants to approach had nowhere to exist.

Every writer of `source.vendor` is a loader — the conformed vendor record, the contract-depth
package, the contact load. There is no application write path at all, measured on `main`. So a
supplier only entered the platform by import.

That is backwards for most of the suppliers a sourcing team actually wants. A supplier is created in
the ERP when it starts invoicing, which is **after** an award. Until then it still needs somewhere
to be qualified, sign an NDA and compete.

A named person can now originate one. It is written as a **potential** supplier: qualifiable,
NDA-capable, and **not payable**.

## Two populations, one table

`source_event_candidate_supplier_authority` has a foreign key to
`source.vendor(tenant_key, vendor_id)`, so a supplier that is not in that table **cannot be accepted
onto an event's panel at all**. Putting originated suppliers anywhere else would mean they could
never compete, which is the whole point of originating them.

So both populations live in one table and are told apart by a declared column rather than by
inference:

| | Where it comes from | What it can do |
|---|---|---|
| `known` | the conformed vendor record, loaded from the system that owns it | already payable |
| `potential` | originated in Source | be qualified, sign an NDA, compete — **not be paid** |

The default is `known`, so every existing row keeps exactly the meaning it had before.

## Why "not payable" is structural, not a flag

`source.vendor` has never had a banking column — no remit-to, no account, no payment terms — and
this migration adds none. A potential supplier is unpayable because **the record cannot express how
to pay it**, not because a boolean says so. Becoming payable requires the ERP onboarding request
raised at award, which sends a request and never a record.

## What it deliberately does not do

**It does not deduplicate against the loaded population.** The crosswalk's duplicate check belongs
at award, where a named person confirms it. Blocking origination on a general name match would stop
a buyer approaching a supplier because something similar was once imported.

The one case it does refuse is an exact legal-name collision with an already-**loaded** supplier,
because adopting that row would let an originated record take over a conformed one.

## Layer Impact

Release lane: **global-control-lane**.

Layer 3 gains four columns on `source.vendor`, three CHECK constraints and an index. Layer 4 gains
one library and one route. No existing row changes meaning, no loader changes, no read path changes.

## Client Applicability

**All clients**, no gating and no feature flag. No surface calls the route yet, so nothing visible
changes until it is wired.

## Changes Included

- `supabase/migrations/20261007003000_source_vendor_origination.sql` — the population column, the
  origination trio, three constraints, an index and column comments.
- `src/lib/source/candidate-suppliers/originate-prospective-supplier.ts` — the writer.
- `src/app/api/v1/source/suppliers/originate/route.ts` — the authenticated route.
- `src/__tests__/behaviors/source-prospective-supplier-origination.test.ts` — new suite.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

| Check | Status |
|---|---|
| New suite | PASS — 13 cases |
| TypeScript `tsc --noEmit`, by exit code | PASS — exit 0, 0 errors |
| Mutation — write the supplier into the payable population | PASS — failed as intended |
| Mutation — adopt a loaded supplier holding the name | PASS — failed as intended |
| Mutation — make the id depend on case and spacing | PASS — failed as intended |
| Mutation — accept a one-word origination reason | PASS — failed as intended |
| Mutation — default existing rows to `potential` | PASS — failed as intended |
| Mutation — drop the known-not-originated constraint | PASS — **after a weak assertion was fixed** |
| ESLint, `audit:lib-orphans`, census check | PASS |
| `check-migration-seals` | PASS — 1 sealed migration verified |
| Applied migration | **NOT RUN** |
| Signed-in acceptance | NOT RUN |

Two measurement notes, both caught here rather than in review:

- **The no-banking assertion was measuring its own prose.** The migration's comments explain why the
  table carries no banking column, so checking the whole file for "bank" matched the explanation.
  The check now strips `--` lines and asserts against the DDL, with a control proving the strip left
  the statements intact and the prose still present.
- **The constraint mutation initially survived.** The assertion checked that the constraint *name
  appears*, and it appears twice — in the `conname` guard and in the `ADD CONSTRAINT`. Renaming only
  the second left the check passing while the constraint was gone. It now asserts
  `ADD CONSTRAINT … CHECK`.

## Rollout Plan

Merge to `main`. **The migration must then be applied** through the repo-owned lab migration
workflow; merging it applies nothing. Until it is applied the route returns
`origination_unavailable`, which is a refusal and not a false success.

Applying it is a separately-authorised action and is not claimed by this record.

## Deployment Authority

Repo-owned workflows only. No ad-hoc Azure command, no traffic or revision change.

## Rollback Plan

Revert the commit to remove the route and writer. The columns are additive with a `known` default,
so an unreverted schema changes no existing behaviour. Rows already originated would remain as
`potential` suppliers and can be retired through `active_state`.

## Audit Evidence

- A mutation writing the supplier as `known` fails, so an originated supplier cannot enter the
  payable population by a one-word change.
- A mutation defaulting the column to `potential` fails, so existing loaded rows cannot be
  reclassified as originated by the migration itself.
- The absence of banking columns is asserted against both the new migration's DDL and the original
  `source.vendor` definition, so it is a property of the table rather than a habit of this writer.

## Known Gaps

- **The migration is not applied, so nothing can be originated yet.**
- **No surface calls the route.** Origination is reachable only by direct request; putting it on the
  vendor panel is a separate slice.
- No market-intelligence scan, no supplier self-registration, no archetype eligibility matrix. This
  is the write path only — the smallest piece that makes an originated supplier exist. The wider
  origination workstream is separately estimated.
- The award-time duplicate check against the loaded population does not exist yet, and this change
  deliberately does not stand in for it.
- A potential supplier is not yet visibly distinguished anywhere a buyer looks; the column exists
  and no read path shows it.
- Not deployed and not live-proven. No signed-in readback.
