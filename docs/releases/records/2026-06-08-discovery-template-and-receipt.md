# 2026-06-08-discovery-template-and-receipt — Discovery template download + upload receipt on live surfaces

## Release ID

`2026-06-08-discovery-template-and-receipt`

## Status

`candidate`

## Plain-English Summary

Two Tier-B discovery features wired onto the live Strategic Moves surfaces. (B2) The
current-state assessment template (.xlsx) can now be downloaded from a Move's detail page — and
the discovery plan that the template needs is now embedded into the charter at Promote time, so
the existing template route no longer always 404s. (B3) When a user uploads a document to a
Move, the extraction receipt the server already produces (name-every-stage: staged → parsed →
extracted → routed → review) is now shown in the upload UI via the existing DiscoveryReceiptCard,
instead of being silently discarded. Both are gated by `discovery_intake_v2`.

## Layer Impact

Affects the **global-control-lane** app tier (Move detail view + attachment upload UI + the
promote submission path), all gated by the **experimental lane** flag `discovery_intake_v2`. No
schema or migration: the discovery plan is embedded into the existing `engagements.charter`
JSONB; the upload route already extracted/applied evidence and returned the receipt. Honest
ingestion-state reporting is preserved — the receipt names each stage and shows unmapped
evidence as evidence-only (nothing fabricated into fields).

## Client Applicability

- All clients: no change while the flag is off (download link hidden; receipt not rendered;
  plan not embedded; `discoveryShape` sent as null).
- Feature flag: `discovery_intake_v2` — active for `meridian`/`apexretail` in the Azure lab only.
- Internal only: effectively internal/lab until the flag is widened.

## Changes Included

- PR (branch `discovery-intake/template-and-receipt`).
- B2: `src/lib/programs/origination-submit.ts` — embed `planFromShape(shape)` into the charter on
  promote (flag-gated) so the template route has a plan; `src/app/(maestro)/strategic-moves/[moveId]/page.tsx`
  - `src/components/strategic-moves/StrategicMoveDetailView.tsx` — flag-gated "Download current-state
    assessment (.xlsx)" link → `/api/programs/{id}/discovery/template`.
- B3: `src/lib/programs/attachments/upload-client.ts` — surface the `discovery` receipt from the
  upload response; `src/components/strategic-moves/MoveArtifactUpload.tsx` — render `DiscoveryReceiptCard`
  on a successful upload when a receipt is present.

## QA / Validation

- `tsc --noEmit`: **passed** (0 errors in changed files).
- `eslint`: **passed** on all changed files.
- Server upload→extraction→receipt path was already live + unit-tested; this only surfaces the
  receipt client-side. DiscoveryReceiptCard has existing render tests.
- Live verification on ACA: see Audit Evidence. Charter-level DB inspection not performed from the
  workstation (private Postgres unreachable; no public firewall exception permitted). **Pass with
  that caveat.**

## Rollout Plan

Merge to `main`. Flag stays off in Vercel production (no production behavior change). Ships on the
next ACA image/revision built from `main`.

## Rollback Plan

Disable the flag (link hides, receipt stops rendering, no plan embedded), or revert this PR. No
migrations or data backfill — rollback is immediate and side-effect-free.

## Audit Evidence

- PR URL (this branch).
- ACA Move detail + attachment upload surfaces with the flag on for Meridian.
- The template route `/api/programs/{id}/discovery/template`; the upload route response `discovery`
  field; the DiscoveryReceiptCard component.

## Known Gaps

The `/strategic-moves/[moveId]/evidence` hub still has no upload affordance (upload lives on the
Move detail view). Template content reflects whatever discovery shape was captured at promote
(minimal brief → minimal plan). Charter persistence/DB-level proof not run from the workstation.
