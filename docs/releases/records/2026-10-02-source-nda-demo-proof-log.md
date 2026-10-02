# 2026-10-02-source-nda-demo-proof-log - Parse private-job key proof

## Release ID

`2026-10-02-source-nda-demo-proof-log`

## Status

`candidate`

## Plain-English Summary

The manual demo signing-key bootstrap now recognizes the Azure Container Apps CLI log envelope before validating its public-key proof. It still rejects duplicate, malformed, private, or exportable key material.

## Layer Impact

`internal-admin` release lane. Internal operations only. No client intake, canonical model, product data, or runtime signing behavior changes.

## Client Applicability

- All clients: No.
- Specific clients: None.
- Internal only: Yes, the manual demo credential bootstrap.
- Public/demo only: Demo credential setup only.
- Feature flag: None.

## Changes Included

- `scripts/ops/docusign-lab-key-bootstrap-proof.mjs`
- `scripts/ops/__tests__/docusign-lab-key-bootstrap-proof.test.mjs`

## QA / Validation

- Red-first test for the observed ACA log envelope, followed by passing parser and negative cases.
- Parsed a real failed-run audit log into a validated public-key proof without reading private key material.
- `node --test scripts/ops/__tests__/docusign-lab-key-bootstrap-proof.test.mjs` passed.

## Rollout Plan

Squash-merge the PR. The next manually authorized F0 workflow run uses the corrected parser. No data migration or runtime flag change is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` remains the only shared runtime release path.
- Shared runtime mutators: None in this change.
- Approved image digest: Unchanged by this parser change.
- ACA runtime invariant: Verify separately if the ordinary main deploy runs.
- Worker image invariant: Verify separately if the ordinary main deploy runs.
- Feature/env flag update path: None.
- Live signed-in proof required: Not for this internal parser; the later e-signature round trip remains unproven.

## Rollback Plan

Revert the parser change through a PR. The demo key, if already created, remains in Key Vault; do not delete or rotate it as a code rollback.

## Audit Evidence

The PR checks, F0 workflow run, and its validated public-key artifact. The key is non-exportable; audit output contains only public material.

## Known Gaps

This does not configure DocuSign, grant consent, store a webhook secret, or prove a signed NDA round trip.
