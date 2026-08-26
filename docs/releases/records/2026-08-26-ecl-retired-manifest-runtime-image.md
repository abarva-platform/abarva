# 2026-08-26-ecl-retired-manifest-runtime-image — Package Retired Reference Manifest

Release ID: `2026-08-26-ecl-retired-manifest-runtime-image`

Status: candidate

Lane: `global-control-lane`

## Summary

The ACA operator image now includes the retired code-reference manifest used by the retired-layer
purge gate. The purge script already reads the manifest, but the runtime image excluded it from
`docs/architecture`, so an operator dry run could not classify declared-retired references inside
the container.

## Layer Impact

- Operator packaging only.
- No schema changes.
- No product route changes.
- No data-plane mutation in this release.

## Client Applicability

Applies to shared lab/operator execution only. It does not change client-visible product behavior.

## Validation

- Pending: local retired-layer purge self-test.
- Pending: local validate-only check.
- Pending: runtime ACA dry-run proving the manifest is available inside the image.

## Rollout

Deploy through the repo-owned ACA main deploy workflow. Then run the focused retired-layer dry-run
for the intended schema and confirm the manifest is found in the emitted proof.

## Rollback

Revert this commit and redeploy the previous digest. The prior behavior is conservative: the purge
gate refuses apply when it cannot classify code references.

## Audit Evidence

The follow-up ACA dry-run proof must show `retired_code_reference_manifest.available=true` before
any apply command is considered.
