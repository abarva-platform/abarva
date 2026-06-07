# 2026-06-07-cutover-b1-gate-evidence — Cutover b1 gate run evidence

## Release ID

`2026-06-07-cutover-b1-gate-evidence`

## Status

`candidate`

## Plain-English Summary

Records evidence from running the Supabase→Azure cutover gates (b1) on the
rebuilt operator/app image: DB proof, drain-apply, and search-verify are green;
the Supabase final backup is complete; the Supabase freeze step is intentionally
deferred (it is a pause-equivalent, gated behind QA/soak). Documentation only.

## Layer Impact

- Lane: `client-data-lane` evidence (Supabase→Azure migration proof). No code,
  schema, or runtime change in this PR — proof docs only.

## Client Applicability

- Not applicable (evidence docs). The cutover affects all clients' data store but
  this PR changes no behavior.

## Changes Included

- `docs/build/cutover/AZURE_CUTOVER_PROOF_2026-06-07.md`: Step 9 gate-run results.
- `docs/build/supabase-sunset-proof-2026-06-07/README.md`: sunset proof summary.

## QA / Validation

- Gate jobs run via Azure Container Apps operator on image
  `…cutover-main-20260607-43839a41c` (digest `sha256:9c5bf5db…`):
  DB proof **passed**, drain-apply **passed** (parity), search-verify **passed**
  (all tenants match), supa-final backup **passed**; supa-final freeze step
  **failed and is deferred/blocked by guardrail**. Evidence captured from Log Analytics.
- Signed-in Claude QA + Azure-only soak: **not run** (gated).

## Rollout Plan

Docs only. No runtime rollout. The cutover itself remains gated on signed-in QA +
soak before DNS/Vercel/Supabase-freeze.

## Rollback Plan

N/A (documentation). Revert the PR to remove the evidence docs.

## Audit Evidence

- Operator job executions: `…private-operator-eus-511wfrc`,
  `…supa-drain-apply-eus-xgzl0d8`, `…a24-search-verify-eus-kn88y7p`,
  `…supa-final-eus-jb3yk3x`; Log Analytics console output.

## Known Gaps

NOT sunset-ready: signed-in Claude QA (PR #3243) and Azure-only soak are pending;
Supabase remains live/unfrozen; DNS and Vercel unchanged. Supabase freeze step
deferred by guardrail.
