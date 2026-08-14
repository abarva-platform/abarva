# 2026-08-13-line-terminator-consistency-gate — Stop inconsistent row terminators recurring

## Release ID

`2026-08-13-line-terminator-consistency-gate`

## Status

`candidate`

## Plain-English Summary

A file whose rows end inconsistently — some with a carriage return and newline, some with just a
newline — parses to a different number of rows depending on which reader opens it. One tenant carried
this. It hid a vendor, four workforce roles and 503 ticket rows from one parser while another read them
all fine, and it surfaced as four separate defects tracked independently for two waves before the
common cause was found.

Nothing prevented it recurring. This adds the check to the tenant input quality gate.

A sweep of all seven active tenants found the problem is now confined to none of them: four tenants are
consistently LF, three consistently CRLF, zero mixed. Because every tenant already passes, the check
can be strict from the outset rather than warning for a transition period.

## Layer Impact

Release lane: `client-data-lane`. A Layer 1 validation check. No tenant data, runtime, or data-plane
change.

## Client Applicability

All clients: no. Internal CI validation. Feature flag: none.

## Changes Included

- `scripts/audit/tenant-input-quality-depth.ts` — adds `mixedLineEndings` and a per-tenant failure when
  any file mixes terminators. Reports the count per tenant in the generated report.

## QA / Validation

| Check | Result |
| --- | --- |
| All seven active tenants, current state | **passes** — 0 mixed files |
| Fault injection: one CRLF changed to LF mid-file | **fails**, naming the file and count, and pointing at the repair script |
| Restored | passes |
| Cross-tenant sweep | apex, first-capital, lakeshore ×2, meridian = consistently LF; healthcare-demo-new, skyharbor = consistently CRLF |
| `npx tsc --noEmit` | clean for the changed file |
| `npm run release:check` | passed |

A trailing newline at end-of-file is deliberately not treated as a defect. It harms nothing, and
flagging it would fail every tenant for a cosmetic reason and get the check switched off.

## Rollout Plan

Merge to `main`. The check runs inside the existing `Verify canonical tenant allowlist` context, which
is already a required branch-protection check and runs on a daily schedule.

## Deployment Authority

Repo-owned deploy workflow unchanged. No runtime, image, flag or env change. Live signed-in proof
required: no.

## Rollback Plan

Revert the squash commit. The gate returns to not checking terminators.

## Audit Evidence

- `reports/canonical-tenant-inputs/latest/tenant-input-quality-depth.json` —
  `tenants[].inconsistentLineEndingFiles`.

## Known Gaps

- The check catches a file that is internally inconsistent. It does not enforce a single convention
  across the repository: four tenants are LF and three are CRLF, and both pass. Standardising on one
  is a larger change that would rewrite every tenant file for no functional gain today.
- It cannot catch a writer that emits consistently wrong output — only inconsistency within a file.
- **I over-claimed while investigating this.** An initial sweep reported "11,790 rows at risk across
  five tenants". That was wrong: it counted ordinary LF endings in Unix-formatted files, which are
  correct. The real number of affected files outside the already-repaired tenant is zero. The error was
  caught one step later by separating mixed files from consistent ones, but it is the kind of number
  that would have justified a large and entirely unnecessary migration.

## Follow-ups

1. Decide whether a single repository-wide terminator convention is worth enforcing.
2. Remaining Wave 3 work: the graph contract decision for the second tenant, connecting the three
   dimensions that have no edges, and the 90 outstanding ontology violations.
