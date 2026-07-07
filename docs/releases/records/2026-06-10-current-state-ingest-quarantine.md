# 2026-06-10-current-state-ingest-quarantine — Scan-before-write quarantine for the current-state ingest routes

## Release ID

`2026-06-10-current-state-ingest-quarantine`

## Status

`candidate`

## Plain-English Summary

The platform already quarantines suspected sensitive data (PHI / PII / regulated
financial identifiers) before it can be stored, indexed, or turned into evidence —
the `evaluateSensitiveUpload` "scan-before-write" guard (audit B5a/B5c). It is
wired into the agent-attachment, Nexus, Tower, Source-artifact, and admin
dataset/corpus/CSV upload routes, and the Moves **workspace** upload route.

Two current-state ingestion routes were missing it: the document path
(`current-state/ingest-doc`, added in `2026-06-10-current-state-doc-path`) and the
structured CSV path (`current-state/ingest`). A client who uploaded sensitive data
**by mistake** through the current-state panel would have had it parsed and landed
as `review_required` — or, for a clean KPI table, **auto-committed** — with no
automated quarantine. This change closes that gap: both routes now run the same
guard **before** parsing, the evidence write, or auto-promotion. On a hit the
upload is rejected (`sensitive_data_quarantined`, 422) and never reaches
`program_evidence_items`, `tower_*`, or the review/auto-commit ladder.

## Layer Impact

- `global-control-lane`: two current-state ingest API routes gain the existing
  sensitive-upload guard. Behavior is additive (a new pre-check); clean business
  uploads are unaffected. No schema change.

## Client Applicability

- All clients: yes (defense-in-depth on the current-state ingest path).
- Specific clients: n/a. Internal only: no. Public/demo only: no. Feature flag: none.

## Changes Included

- `src/app/api/v1/programs/[programId]/current-state/ingest-doc/route.ts` —
  `evaluateSensitiveUpload` scan-before-extract on the document buffer; quarantine
  → `sensitiveUploadRejectedResponse`.
- `src/app/api/v1/programs/[programId]/current-state/ingest/route.ts` — read the
  file once as a buffer, scan-before-commit, then decode to text.
- `src/lib/programs/__tests__/current-state-doc-ingest.test.ts` — 3 quarantine
  contract tests (declared PHI quarantined; SSN pattern quarantined; clean
  business context allowed).
- Reuses the existing, tested `src/lib/security/sensitive-upload-guard.ts` (no new
  detection logic).

## QA / Validation

- `npx tsc --noEmit` — clean.
- `npx jest current-state-doc-ingest` — 10/10 pass (incl. 3 new quarantine tests).
- `npx eslint` on changed files — clean.
- Pending: deploy to ACA lab + live re-check that a deliberately sensitive upload
  to `current-state/ingest-doc` returns `sensitive_data_quarantined` (422) and
  creates no evidence/review row.

## Rollout Plan

1. Merge to main (after surfacing).
2. Build + deploy app image to `ca-abarva-web-lab-eastus` from main; shift traffic
   after Healthy. No migration.

## Rollback Plan

- Redeploy the prior revision (`--main-85467982a`). Code-only change; reverting
  the two route edits restores prior behavior. No data or schema impact.

## Audit Evidence

- Quarantine decisions return `dataProtection` (matched rules, severity, suspected
  PHI/PII/financial flags) and are surfaced by the existing quarantine
  audit/admin flows. The guard runs before any storage, evidence, or audit write
  on these routes.

## Known Gaps

- The guard samples the first ~1MB of the upload (`SAMPLE_BYTES`) — consistent
  with the other routes; very large files are not scanned in full.
- Detection is pattern + declared-classification based (SSN, MRN/patient id, DOB,
  routing/account, card, email, phone, declared `phi`); it is a conservative
  pre-ingest filter, not a full DLP/de-identification engine. Binary office
  formats are sampled as decoded bytes, so a pattern split across the XML
  container may evade the sample — the human review gate remains the second line
  for document families.
