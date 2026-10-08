# Source — vendor RFP portal replayed onto main and its guards made blocking

## Release ID

2026-10-08-source-vendor-portal-rebase-and-ci-wiring

## Status

**Draft PR — not ready for review, not merged, not deployed.** This record covers slice E1 of the
Source event lifecycle brief: replay the branch, get its own suites green, open a draft. It does
**not** cover the RLS work in E3, which the measurement below shows is larger than the brief stated.

## Plain-English Summary

Stage 6 of the sourcing-event lifecycle — vendor response — was the one remaining gap meter reading
zero. The recipient portal existed only on an unmerged branch, **773 commits behind** `main`, with
no PR.

This replays those three commits onto current `main`. The rebase was clean: 20 of the 23 files are
new, and the three modified files — `src/proxy.ts`, the Nexus manual and its builder — took the
replay without conflict.

**The portal's own three suites ran in no CI job at all.** 39 tests, including
`public-surface.test.ts`, which walks every route file under the public prefix and requires each to
call `resolveVendorBySession(`. `/rfp` and `/api/v1/source/rfp` are on `PUBLIC_ROUTE_PATTERNS`, so
Clerk does not stand in front of them — being on that list is the absence of a control, and that
suite *is* the control. A guard on external attack surface that no required job runs is not a guard.

Both are now fixed: the suites are wired into the required **Routes and disclaimers** job, which is
also the job that owns route surface.

## Layer Impact

Release lane: **client-data-lane** — the change carries a migration creating four tenant-scoped
tables and adding a column, plus a new public route prefix and its API.

Layers 2–4. The migration is **authored, not applied**, and this record does not request its
application.

## Client Applicability

**Not applicable — no client receives this change.** The routes exist and the tables do not, because
the migration is unapplied, so there is no tenant for whom any behaviour differs. Nothing in an
existing surface changes.

When it does reach a client it will be **specific clients** only: a vendor portal is reachable by
the suppliers invited to one solicitation, and it must not be opened to any tenant until the two
findings below are closed.

## Changes Included

- 20 new files under `src/lib/source/vendor-portal/`, `src/app/rfp/[eventId]/` and
  `src/app/api/v1/source/rfp/[eventId]/` — carried unchanged from the original branch.
- `src/proxy.ts` — `/rfp(.*)` and `/api/v1/source/rfp(.*)` added to `PUBLIC_ROUTE_PATTERNS`, with
  the original author's comment stating plainly that this is new external attack surface.
- `supabase/migrations/20260925090000_source_vendor_rfp_portal.sql` — carried unchanged.
- `.github/workflows/integrity.yml` — **new**: the portal's suite directory wired into the required
  job, `--no-coverage`, following the Home walkthrough step directly above it and for the same
  stated reasons.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

| Check | Status |
|---|---|
| Rebase across 773 commits | PASS — clean, no conflicts |
| Portal suites, by the exact command the new CI step runs | PASS — 3 suites, 39 tests |
| TypeScript `tsc --noEmit`, by exit code | PASS — exit 0, 0 errors |
| ESLint on every portal path and `src/proxy.ts` | PASS — no output |
| Release check | PASS — 11 of 11 gates |
| CI census | PASS — `coveredTestFiles` +3, `uncoveredTestFiles` 167 → **164**, main's figure |
| Signed-in acceptance | NOT RUN |
| Migration applied | NO — authored only |

### The public-surface guard was mutation-tested before being trusted

Renaming the resolver call in the acknowledge route to `resolveVendorBySessionXX(` — the exact
typo-shaped bug the guard's own comment says it exists to catch — **failed** it:
`every vendor API route resolves a session, except sign-in itself`. Reverted.

### The CI wiring was checked by a negative control

Removing the new step and regenerating: `coveredTestFiles` 2696 → 2693, `uncoveredTestFiles` 164 →
167, and the portal directory reappears in `uncoveredDirectories`. Restoring it returns all three.
The census moves because of the step, not alongside it.

## Findings this slice produced

These are measurements, not changes. Nothing below is fixed here.

### F1 — The migration enabled no row-level security at all — **now fixed**

`20260925090000_source_vendor_rfp_portal.sql` creates four tables and adds a column. It contains
**zero** `ENABLE ROW LEVEL SECURITY` statements and **zero** policies.

Four neighbouring migrations of the same vintage, for comparison: the award decision has 1, the
RFx release authority 3, the scorecard authority 2, the intake request authority 3. So this is a
deviation from the house standard, not the house standard.

The brief's E3 slice describes the blocker as "the portal DAO runs on an elevated connection, so
policies alone would not bind". That is true and it is the smaller half. The larger half is that
there are no policies to bind. E3 is bigger than its one-hour sizing.

### F2 — Corrected: the DAO's fence is `vendor_id`, and it holds

An earlier reading of this said several statements "do not carry a `tenant_key` predicate", implying
a hole. That overstated it. Every statement in `dao.ts` is bounded, by design and in fact:

| Function | Bound |
|---|---|
| `findVendorForSignIn` | `source_event_id` **and** `username`, then a password check — the one path where no vendor is yet known |
| `resolveVendorBySession` | `session_token_hash` joined to a vendor on the **same** `source_event_id` |
| `listVendorEvents`, `countSubmissions` | `vendor_id` |
| `recordAcknowledgement` | the vendor's own `id`, and `invitation_state = 'invited'` |
| `revokeSession` | `session_token_hash`, the bearer secret itself |

`vendor_id` is **narrower** than `tenant_key`, and it is taken only from a verified session. A
tenant predicate would have been a weaker fence, not a stronger one. What was missing was not a
predicate but anything that would stop a *future* statement omitting one — now `dao-fence.test.ts`.

Every statement does run on the write client, which remains true and is why RLS cannot be the
vendor-to-vendor fence.

### F3 — The migration's timestamp sorts before ~30 already-applied migrations

`20260925090000` lands before `20260925160000` and everything after it. Read in
`src/scripts/run-migrations.ts`: pending work is selected by **name** against a `schema_migrations`
ledger, not by timestamp, so the file **will** apply rather than being skipped. It will apply out of
chronological order. Nothing in CI checks ordering — the required `New migration drift surface` job
lists added migrations and emits a warning, and has no failure path.

The portal tables reference only `source_events` and each other, plus a column added to
`source_event_pricing_submissions`, so no dependency inversion was found. The ordering is a hazard
to note, not a defect in this file.

## Rollout Plan

None requested. The PR is a **draft**. The order that follows from the findings above:

1. E3, re-scoped: enable RLS with policies on all four tables, and either move the DAO off the
   elevated connection or carry explicit tenant **and** event predicates on every statement, with a
   cross-tenant fence test whose mutation turns it red.
2. E2: replace the free-text supplier name with a reference to the accepted candidate's `vendor_id`.
3. E4: derive invitations from a persisted package version, then mark ready.
4. Migration application, as a separate authorized request.

## Deployment Authority

Repo-owned main deploy workflow only. No ad-hoc Azure command. The migration is unapplied and this
record does not request its application.

## Rollback Plan

Close the draft PR. Nothing is merged, and the branch it came from is untouched.

## Audit Evidence

- The public-surface guard fails when the session resolver call is renamed on one public route.
- The census negative control moves in both directions with the CI step.
- Four neighbouring migrations' RLS statement counts are quoted in F1 against this one's zero.

## Known Gaps

- **No RLS (F1).** The portal must not be reachable against a real tenant until F1 and F2 are
  closed. The migration being unapplied is what currently prevents that, which is not a control.
- **Not ready for review**, deliberately. A draft is the honest state of a branch whose data layer
  has no row-level security.
- The portal's e2e spec (`tests/e2e/vendor-rfp-cookie-path.spec.ts`) is carried but not run here; it
  needs Playwright browsers and a signed-in environment.
- No signed-in walk, no deployment, not live-proven.
