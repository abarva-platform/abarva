# 2026-09-29 Source Ticket Step Readback

## Release ID

`2026-09-29-source-ticket-step-readback`

## Status

`candidate`

## Plain-English Summary

The Scope ticket-history step now reads the same validated, fact-backed evidence receipt as the stage evidence ledger. A stored file, unrelated evidence row, or lone numeric input cannot complete this step.

## Layer Impact

Release lane: `global-control-lane`. Layer 4 Source presentation derives step completion from an existing tenant-scoped, Layer 3-backed evidence projection. Layers 1-3, schema, and data are unchanged.

## Client Applicability

- All clients using the enrolled Source Scope workflow.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Source enrollment; no new flag.

## Changes Included

- Ticket-history task hydration requires the derived evidence receipt at its canonical minimum state with linked fact IDs.
- Other template-bound tasks retain their existing scalar-fact readback.
- Negative tests cover a lone scalar, merely uploaded file, stale receipt, wrong requirement, and unvalidated row.

## QA / Validation

- Pass: red-first test reproduced the receipt/step mismatch and false completion from one scalar.
- Pass: a deliberate generic-ID mutation failed the unvalidated-row test, then was restored.
- Pass: broad route CI-equivalent command, 63 suites / 466 tests; focused Source hydration/shell/substrate 3 suites / 60 tests; TypeScript, scoped ESLint, release check, and diff check.
- Pass: the first PR head exposed one stale route test that passed a scalar where a validated L2/L3 evidence receipt is required. The corrected test now derives the receipt from facts written by the upload route.
- Not run: PR CI/review, runtime proof, and signed-in replay.

## Rollout Plan

Open a PR after local validation; squash merge only after applicable CI and review. The repo-owned ACA main workflow is the sole shared deployment path. Verify digest-pinned web template, 100%-traffic revision, and required workers, then reload the same signed-in Scope step without re-uploading evidence.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: pending official workflow.
- ACA runtime invariant: web template and 100%-traffic revision match the approved digest.
- Worker image invariant: required delivery jobs match the approved digest.
- Feature/env flag update path: no change.
- Live signed-in proof required: exact ticket step displays captured readback and enables Continue on the prior validated upload.

## Rollback Plan

Revert through a new PR and the repo-owned main deployment workflow. Previously ingested facts and evidence remain intact; no migration or data deletion is involved.

## Audit Evidence

Red/green/mutation results and the PR/CI, official deployment, runtime, and signed-in step replay are tracked separately in the private execution ledger. No tenant-specific material is included here.

## Known Gaps

This change only addresses ticket-step readback. Other Scope inputs, artifacts, gate criteria, and stage approval remain independently required.
