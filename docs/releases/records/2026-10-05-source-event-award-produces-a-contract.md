# Source — a sourcing event can produce a contract

## Release ID

2026-10-05-source-event-award-produces-a-contract

## Status

Merged — not deployed and not live-proven by this record. The migration this depends on is authored
and merged but **not applied**; see Known Gaps.

## Plain-English Summary

Until now no sourcing event could produce a contract. Every writer of `source.contract` was an
ingestion script, so every contract in the platform arrived by import and the sourcing lifecycle
stopped at the supplier panel. An event could accept candidates, release an RFx and collect
responses, and then had nowhere to put the outcome.

This adds the decision and the row it produces: a named person awards one event to one supplier the
event already accepted, and that award writes both the award decision and the canonical contract, in
one transaction.

Three things make it a decision rather than a note:

- **The supplier must already be on the panel.** The award joins candidate authority to
  `source.vendor`, so an event cannot award to a supplier it never accepted and a free-text supplier
  name has no path to a contract at all.
- **The approver comes from the signed-in session, never from the submitted form.** An unnamed
  session cannot produce an award.
- **Both rows commit together or neither does.** An award row is constrained to name the contract it
  produced, so an award that committed while its contract insert did nothing would assert a contract
  that does not exist.

The contract id is a digest of tenant, event and supplier, so the same award re-sent is the same
contract rather than a second one.

## Layer Impact

Release lane: **global-control-lane**.

Layer 3 (canonical model) gains a writer it did not have: an award decision, and a `source.contract`
row whose origin is a sourcing event instead of an import. Layer 4 gains one API route. No product
surface reads the award yet, and no projection logic changed.

The pure award-to-contract mapping was written earlier and held back, because it had no consumer and
`audit:lib-orphans` correctly refuses a test-only library. This change is that consumer, so the
mapping lands with it.

## Client Applicability

**All clients**, through the shared global control lane, with no per-client gating and no feature
flag. Behaviour is additive: nothing calls the route from any surface yet, so no existing flow
changes. No tenant data is written by this change itself.

## Changes Included

- `src/lib/source/award/contract-from-award.ts` + test — the pure mapping, previously held.
- `src/lib/source/award/write-award-decision.ts` — the transactional writer.
- `src/app/api/v1/source/[eventId]/award/route.ts` — the authenticated route.
- `src/__tests__/behaviors/source-event-award-produces-a-contract.test.ts` — writer behaviour.
- `src/__tests__/behaviors/source-event-award-route.test.ts` — route behaviour.
- `.github/workflows/unit-suites.yml` — names the co-located mapping suite so it actually runs.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

| Check | Status |
|---|---|
| New suites | PASS — 25 cases across 3 suites |
| TypeScript `tsc --noEmit`, by exit code | PASS — exit 0, 0 errors |
| Mutation — return instead of throw on a taken contract id | PASS — failed as intended |
| Mutation — write the contract as `accepted` | PASS — failed as intended |
| Mutation — accept a candidate that is not one accepted supplier | PASS — failed as intended |
| Mutation — treat a conflicted award insert as a success | PASS — failed as intended |
| Mutation — route trusts the form's approver name | PASS — failed as intended |
| ESLint on changed files | PASS |
| `audit:lib-orphans` | PASS — exit 0 |
| `audit:test-ci-coverage:check` | PASS — exit 0 after regeneration |
| Applied migration | NOT RUN — authoring only |
| Signed-in acceptance | NOT RUN |

The first local `tsc` run exited 134, which is the known local heap crash on this checkout rather
than a type error; re-run with an 8 GB heap it exited 0 with 0 errors. The exit code is the verdict,
not the absence of grep matches.

Census note, re-measured after `main` moved mid-review (#9037 regenerated the census, which took
this branch DIRTY): the regeneration moves `testFiles` from 2702 to 2710, **+8**, while this change
adds 3 test files. The other 5 are pre-existing staleness on `main`, not this change — `main`'s
committed census records 111 test files in `src/__tests__/integration/source`, a directory this
change does not touch, while `main` actually tracks 112 there. The census was regenerated from
`main`'s copy rather than hand-merged, twice: once on the original base and again on the moved one.

An earlier measurement of this delta on the pre-move base said +10 with 7 stale. That figure is
superseded, not reconciled — the moved base had already absorbed part of the drift.

The load-bearing proof is not the file counts but the directory counts: `directoriesWithTests` goes
503 to 504 and `directoriesFullyCovered` 433 to 434, and `src/lib/source/award` appears in neither
the uncovered nor the partially-covered list. That is what proves the `unit-suites.yml` line
actually wires the co-located mapping suite, rather than the census merely being refreshed around an
inert file.

## Rollout Plan

Merge to `main`; the repo-owned main deploy workflow builds and deploys. No flag and no
configuration. **The route cannot succeed until the award migration is applied** — until then it
returns `award_unavailable`, which is a refusal and not a false success.

## Deployment Authority

Repo-owned main deploy workflow only. No ad-hoc Azure command, no traffic or revision change.

## Rollback Plan

Revert the commit. The route is referenced by no surface, so reverting removes an unused endpoint.
Any award rows already written stay valid and keep their contracts; nothing reads them yet.

## Audit Evidence

- A mutation that lets the writer return rather than throw on a taken contract id fails, so an award
  cannot commit without the contract it claims to have produced.
- A mutation that writes the contract as `accepted` fails. The contract is written `unreviewed`
  deliberately: the award is named and evidenced, but the contract record derived from it has been
  reviewed by nobody, and `accepted` is the value Source projections read as confirmed.
- A mutation that makes the route prefer a form-supplied approver name over the session fails, so a
  submitted name cannot become the approver of record.

## Known Gaps

- **The migration is not applied.** `20261005140000_source_event_award_decision.sql` is merged but
  not applied to any environment, so this path cannot be exercised until an operator applies it.
  Applying it is not something this change does or claims.
- **No surface calls the route.** The award is reachable only by direct request. Wiring the decide
  step in the event workspace is a separate slice.
- The contract row carries identity, supplier, name and currency only. Commercial terms — value,
  dates, renewal — are not asserted, because the award does not evidence them.
- Award retirement has schema support and no writer, so an award cannot yet be retired through the
  product.
- Not deployed and not live-proven. No signed-in readback.
