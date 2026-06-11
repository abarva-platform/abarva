# 2026-06-11-source-upload-substrate-sync — Source upload → evidence/gate wiring fix

## Release ID

`2026-06-11-source-upload-substrate-sync`

## Status

`candidate`

## Plain-English Summary

Fixes the P0 finding from the 2026-06-11 live Source audit (SkyHarbor walkthrough): an
uploaded evidence file landed durably in Blob + the artifact registry and appeared in the
EVENT DOCUMENTS shelf, but the Evidence readiness ladder and Gate criteria on the canvas
never moved — the only readiness write was an explicitly in-memory store (per-process,
resets on restart), while the canvas reads the per-event Postgres substrate tables. This
adds the missing durable write path: an upload now matches its canonical evidence
requirement (filename + stage), upgrades `source_event_evidence_states` on the seven-state
ramp (never downgrades; links the artifact), and updates `source_event_gate_criterion_states`
(appends evidence links; auto-meets ONLY ART-\* artifact-presence criteria — HARD human
gates stay pending for a named approver). Also fixes two classification bugs that could
falsely satisfy gate criteria, and the header "Sign in" flicker while authenticated.

## Layer Impact

- `global-control-lane`: new `src/lib/source/canvas-substrate/upload-sync.ts`; the Source
  upload route now performs the durable sync (best-effort — a sync failure never loses the
  uploaded file — and surfaced in the response as `substrateSync`); artifact-family
  inference hardening; AppTopBar hydration fix. **No schema change** (substrate tables
  exist since `20260507230000`).

## Client Applicability

- All clients: yes — any Source event upload now moves the readiness/gate surfaces.

## Changes Included

- `src/lib/source/canvas-substrate/upload-sync.ts` — requirement matcher (curated,
  stage-scoped filename keywords for all canonical requirement ids) + durable sync
  (upgrade-only evidence ramp; ART-\*-only auto-met; injectable db).
- `src/app/api/v1/source/[eventId]/artifacts/upload/route.ts` — calls the sync after
  parse; returns `substrateSync` for observability.
- `src/lib/source/artifact-registry/upload-contract.ts` —
  (a) raw client evidence (contracts, inventories, telemetry, org/financial files) now
  classifies as `other` instead of stage-defaulting to a deliverable family, which could
  falsely auto-satisfy that family's ART-\* criterion (audit F2);
  (b) fixed `includes('rate')` matching st-RATE-gy, which sent every "strategy" file to
  `pricing_workbook` (pre-existing latent bug caught by the new tests).
- `src/components/shell/AppTopBar.tsx` — while Clerk is resolving the session, render
  neither the user chip nor "Sign in" (audit F4: signed-in users briefly saw "Sign in").
- Tests: `src/lib/source/canvas-substrate/__tests__/upload-sync.test.ts` (11 tests, incl.
  the exact SkyHarbor audit filenames).

## QA / Validation

- `jest upload-sync` → 11/11; existing `src/lib/source/artifact-registry` +
  `src/app/api/v1/source` suites → 35/35 still green.
- `src/components` suite: 5 failing suites are identical on clean main (pre-existing,
  unrelated — tenant-switcher/origination/connector/board-panel).
- `tsc --noEmit` clean (scoped) · `eslint` clean · `release:check` pass ·
  `audit:architecture-rules` 0 violations.
- Hard rule preserved: non-ART (human/HARD) gate criteria are never auto-met by an upload.

## Rollout Plan

Squash-merge to main → build web image from main → roll `ca-abarva-web-lab-eastus` → live
verification on the SkyHarbor audit event (re-upload evidence; confirm the Evidence ladder
moves Not Requested → Parsed/Loaded and the artifact links).

## Rollback Plan

Revert the PR (route stops calling the sync; inference + topbar revert). No schema to
unwind; substrate rows written are normal product data.

## Known Gaps

- Auto-promotion stops at Parsed/Loaded by design — 'Available'/'Usable Evidence' require
  validation (governed, human). The Evidence header counts "at usable evidence", so it may
  still read 0/2 until validation; the per-requirement chips and linked artifacts now move.
- Family inference is still filename-based (content-based classification is a follow-up).

## Audit Evidence

Live audit `~/Downloads/source-audit/SOURCE_MODULE_E2E_AUDIT.html` (finding F1/F2/F4);
uploaded artifacts dc7aaa90/7d2bf437 on event 85104cf5 used as the regression fixtures.
