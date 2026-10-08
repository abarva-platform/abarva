# Source — the vendor portal references the canonical supplier identity

## Release ID

2026-10-08-vendor-portal-canonical-supplier-identity

## Status

Open — not merged, not deployed, not live-proven. The migration is **authored, not applied**.

## Plain-English Summary

Slice **E2**, plus the half of **E4** it turned out to depend on.

`source_event_vendors` identified a competing supplier by two free-text columns and nothing else.
The same supplier invited to two solicitations was two unconnected rows with two spellings of one
name, and no join back to the governed record in `source.vendor`.

The identity already existed and was already governed: accepting a supplier onto an event's
candidate panel writes `source_event_candidate_supplier_authority`, whose `(client_key, vendor_id)`
references `source.vendor(tenant_key, vendor_id)`. The portal now points at that instead of minting
a second identity beside it.

### E2 could not land alone, and that is a finding about the brief

The brief orders E2 before E4. But E2's deliverable is a *reference* that something has to write,
and the only thing that writes a portal vendor is an invitation — which must deliver a credential,
which is E4's email. A schema column and a resolver with no caller is an orphan: the required
`audit:lib-orphans` gate flagged exactly that, and I had removed `invitation-email.ts` one commit
earlier for the same reason.

So this lands the unit that actually works: the canonical column, the resolver, the write path, the
operator invite route, and `invitation-email.ts` reinstated **with its caller**. What stays in E4 is
the part that genuinely needs C1–C3: deriving *who* to invite from a persisted RFx package version.
This route takes an explicitly named accepted candidate.

## Layer Impact

Release lane: **client-data-lane**. Layer 2 (one migration), the data-access layer, and one new
operator API route. No existing product surface changes.

## Client Applicability

**Not applicable — no client receives this change.** The column does not exist, because the
migration is unapplied. When the portal reaches a tenant it will be **specific clients** only.

## Changes Included

- `supabase/migrations/20261008130000_source_event_vendors_canonical_identity.sql` — **new**.
  `vendor_id` column, composite FK to `source.vendor(tenant_key, vendor_id)`, a **partial unique
  index** on `(source_event_id, vendor_id)`, a lookup index, and column comments recording that the
  name columns are a display cache.
- `src/lib/source/vendor-portal/vendor-identity.ts` — **new**.
  `resolveCanonicalVendorIdentity` and `isSameGovernedSupplier`, with five named refusals.
- `src/lib/source/vendor-portal/dao.ts` — `createEventVendor`, which requires the canonical id in
  its type and refuses a blank one before any write.
- `src/app/api/v1/source/[eventId]/vendor-portal/invite/route.ts` — **new** operator route.
- `src/lib/source/vendor-portal/invitation-email.ts` — reinstated with its caller.
- Three new suites, plus the three reinstated invitation cases.

## QA / Validation

| Check | Status |
|---|---|
| Portal suites | PASS — 7 suites, 76 tests |
| TypeScript `tsc --noEmit`, by exit code | PASS — exit 0 |
| Tenancy fence census | PASS — the new route classifies **`fence: "direct"`** via `requireTenancy`; `fencedDirect` 105 → 106 |
| `audit:lib-orphans` | PASS — product-reached 2362 → **2364**, test-only unchanged at 428, "No change against the baseline" |
| CI census | PASS — three new suites covered, `uncoveredTestFiles` unchanged at **164** |
| Release check | PASS |
| Migration applied | **NO** — authored only |
| Signed-in acceptance | NOT RUN |

### The named proof

The brief's proof for E2 is "one supplier across two events resolves to one identity". Asserted
directly: two solicitations, two separate panels, two different authority rows, the supplier's name
spelled differently on each — `Northwind Systems Ltd` and `Northwind Systems Limited` — and one
`vendorId`. The display names differ in the same assertion, because each invitation shows the name
it was issued under; that is why they are kept separate from identity.

A companion case asserts the resolver **will not** answer from a name: passing the legal name as the
supplier id is refused `supplier_not_accepted_for_event`.

### Mutations — 13 of 13 killed

The eleven from the RLS slice, re-run, plus:

| Mutation | Result |
|---|---|
| the create path writes no canonical id | killed — 2 cases |
| the create path drops its blank-id guard | killed — 2 cases |

### A false kill, caught by re-running clean

`create-without-canonical-id` first reported as killed. It was not: the preceding mutation's state
had leaked through the harness, and on a clean run it **survived** — because no test covered
`createEventVendor` at all. The suite `dao-create-event-vendor.test.ts` exists because of that
re-run, and the mutation now fails two of its cases by name.

A mutation reported killed is a claim about the harness as much as about the code. Checking which
test killed it is what exposed this.

### Three instrument faults found and fixed

1. **A doc comment broke the fence slicer.** Adding `createEventVendor` with backticks in its doc
   comment shifted how the fence test pairs template literals across `dao.ts`, and
   `source_event_vendor_submissions` silently dropped from 1 statement to **0** — a slicer that
   finds fewer statements still reports every statement it found as bounded. The suite now strips
   TypeScript comments first, with its own cases. This is the second time in one file: the SQL
   assertions needed the same fix a commit earlier.
2. **A slice bounded by the next named function.** The resolver assertions sliced from
   `resolveVendorBySession` to `createSession`; inserting a function between them widened the slice
   to include a neighbour, so an assertion about the resolver's parameters started reading
   `createEventVendor`'s. Now bounded by the next top-level `export`.
3. **The fence census enumerates tracked files.** The new route was untracked, so a locally clean
   fence census did not contain it at all and would have passed while hiding a brand-new route;
   CI would have reported drift after the push. `git add` before trusting an artifact generated
   from git.

## Rollout Plan

Merge. Inert until the migration applies: `vendor_id` does not exist, so `createEventVendor` fails
its insert and the invite route returns `write_failed`. Nothing is published and nobody is invited.
Migration application is a separate authorized request and is not sought here.

## Deployment Authority

Repo-owned main deploy workflow only. No ad-hoc Azure command. No migration applied.

## Rollback Plan

Revert. The portal returns to identifying suppliers by free text, and the invite route disappears
with it. Nothing stored changes, because the column does not yet exist.

## Audit Evidence

- One supplier, two events, two spellings, one `vendorId` — asserted, with the display names
  asserted as different in the same case.
- The resolver refuses a name used as an id.
- `createEventVendor` refuses a blank and a whitespace-only id, and the test asserts **no write was
  attempted**, not merely that it returned a refusal.
- The invitation's credential is asserted present in the body and absent from `subject`, `to` and
  `metadata` — because `src/lib/email/send.ts`'s no-API-key fallback logs those three and not the
  body. Swept across every message field, so a field added later cannot carry it past the test.

## Known Gaps

- **The column is nullable.** It cannot be added `NOT NULL` safely: this file cannot prove no row
  exists on any applied database, and a failed `SET NOT NULL` would block every later migration
  behind it. The rule is enforced one layer up — no code path creates a portal vendor without a
  resolved id — and tightening the column is a follow-on once the table is known empty everywhere.
- **The invite route has no suite proving its tenancy fence** (`coverage: "none"` in the census, as
  for 139 other fenced routes). Its refusals are covered at the resolver and DAO level; a
  route-level fence test is owed.
- **E4's remainder stands:** invitations are not derived from a persisted RFx package version, so
  the recipient is named explicitly by the operator.
- **`revokeSession` is still bounded only by its token hash**, carried over from the previous slice.
- The invite route sets accept/respond deadlines at 7 and 21 days as a default rather than reading a
  governed timetable.
- Not applied, not deployed, not live-proven.
