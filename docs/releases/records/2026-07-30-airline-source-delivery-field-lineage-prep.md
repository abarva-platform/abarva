# 2026-07-30-airline-source-delivery-field-lineage-prep — Source Delivery and Field-Lineage Prep

## Release ID

`2026-07-30-airline-source-delivery-field-lineage-prep`

## Status

`candidate`

## Plain-English Summary

This release candidate prepares a governed, non-mutating repair path for a synthetic foundation tenant whose source package was not available inside the existing operator job image. The source landing helper can now consume an explicit source-package zip and freeze manifest, verify both by hash, and plan the operational landing set without exposing restricted evaluator material.

It also records the approved design-and-test packet for a future source-field lineage export. That packet defines the field-level disposition schema and gate-specific tests needed before any final reconciliation or product activation claim.

## Layer Impact

- Release lane: `client-data-lane`
- Layer 1 client intake: Source-package delivery is now explicit and hash-verified for the controlled source corpus package.
- Layer 2 source adapters/reconciliation: The landing helper can plan from package inputs without relying on checked-out client workspaces inside runtime images.
- Layer 3 canonical model: No canonical facts, review decisions, publications, baselines, or projections are changed.
- Internal operations: Proof ledgers and approval packets capture independent reviewer outcomes and human-only gates.

## Client Applicability

- All clients: No direct runtime or product-surface change.
- Specific clients: Synthetic foundation execution package only.
- Internal only: Yes, operator prep and proof artifacts.
- Public/demo only: No product UI or public route change.
- Feature flag: None.

## Changes Included

- `scripts/knowledge/land-airline-source-corpus.mjs`
- `scripts/knowledge/__tests__/run-airline-source-landing-tests.mjs`
- `docs/releases/records/2026-07-30-airline-source-delivery-field-lineage-prep.md`

The detailed operator proof bundle remains local/operator-held audit evidence and is intentionally excluded from public PR staging.

## QA / Validation

- Pass: `NODE_PATH=/Users/anand/Projects/nexus/node_modules node scripts/knowledge/__tests__/run-airline-source-landing-tests.mjs`
- Pass: source landing targeted suite now covers 15 cases, including explicit package zip planning, execute ACK enforcement, execute hash enforcement, freeze-manifest source ambiguity rejection across CLI order and env/CLI mixes, wrong package hash, multiple manifests, and extraction confinement.
- Pass: source zip plan from the attached package returned 48 operational files, 25 parser-visible files, and 0 evaluator-visible files.
- Pass: proof JSON files parse with `python3 -m json.tool`.
- Pass: overnight task, approval, defect, and field-lineage test-matrix CSVs parse with Python `csv.DictReader`.
- Pass: `npm run release:check`.

## Rollout Plan

Merge through pull request after review. This release does not upload source packages, execute Container Apps Jobs, mutate PostgreSQL, rebuild projections, publish domains, activate baselines, or reload Foundation V2.

After merge and normal governed image deployment, a separate human-approved operator run may use a governed Blob location and hash-pinned package inputs to run source landing in plan mode first, then execute mode only after explicit approval.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` if this candidate is merged.
- Shared runtime mutators: None in this release candidate.
- Approved image digest: Captured only after merge by the repo-owned deploy workflow.
- ACA runtime invariant: Required before any later governed operator job uses the deployed code.
- Worker image invariant: Required before any later governed operator job uses the deployed code.
- Feature/env flag update path: None.
- Live signed-in proof required: Not for this prep-only release; downstream product proof remains required after source, lineage, publication, baseline, projection, Cube, and provider gates pass.

## Rollback Plan

Revert the pull request and redeploy the previous approved image. Since this release does not mutate tenant data or runtime state, rollback is limited to code/proof rollback. Any later approved operator run must retain its own immutable run records, manifests, hashes, and reconciliation proof.

## Audit Evidence

- Local/operator-held proof bundle for source-delivery preparation and field-lineage design review.
- Independent GPT review decisions retained in the local operator proof bundle.
- Local validation outputs for targeted tests, release control, schema/proof parsing, and source-package planning.
- Pull request URL: pending.
- CI checks: pending.
- Deployment proof: not applicable until merge and governed deploy.

## Known Gaps

V1 is not certified. The open live gates still require human-approved source package upload, Container Apps Job execution, source reprocessing, field-lineage implementation, full VNet reconciliation, and downstream projection/Cube/product proof. This release does not approve review decision apply, domain publication, baseline activation, projection rebuild/cutover, Foundation V2 implementation, or Foundation V2 reload.
