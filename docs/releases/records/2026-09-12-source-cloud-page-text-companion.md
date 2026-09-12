# 2026-09-12 — Source Cloud Page-Text Companion

## Release ID

`2026-09-12-source-cloud-page-text-companion`

## Status

`candidate`

## Plain-English Summary

Adds a deterministic page-text companion for the two selected cloud contract evidence sets. Each manifest document becomes one governed, searchable page record with a source-file ID, contract ID, page number, content hash, mapping state, parser version, and synthetic-data policy. This gives Contract 360 document-backed context across its tabs without inventing production documents, finance confirmation, or unsupported claims.

## Layer Impact

- **Affected release lane:** `client-data-lane` for the staged governed package and `global-control-lane` for the reusable companion builder.
- **Layer 1 — client intake:** the package now declares the page-text companion file and reconciled row counts.
- **Layer 2 — source adapters:** the existing cloud loader reads the companion file separately from operational cloud rows and includes it in the package hash.
- **Layer 3 — canonical model:** the existing canonical fact path stores page-text presence with document and source-row provenance.
- **Layer 4 — products:** the existing Evidence, Education, Contract 360, and Optimize projections can use the loaded document lineage and contract context.

## Client Applicability

- All clients: reusable deterministic companion-building and loader behavior.
- Specific clients: none.
- Internal only: package QA and operator proof.
- Public/demo only: the staged synthetic package after the governed load gate passes.
- Feature flag: none.

## Changes Included

- `scripts/source/build-contract-page-text-companion.mjs` builds page rows from the evidence manifest and its synthetic documents.
- `package.json` exposes the cloud Layer 2/3/4 and document-evidence jobs through the governed ACA operator wrapper.
- The staged cloud package includes 10 page-text rows, five for each selected contract.
- Package QA counts and the governed manifest increase from 470 to 480 declared objects.
- Focused loader coverage asserts 10 companion rows and 392 canonical fact assertions.

## QA / Validation

- Companion builder: **PASS**, 10 non-empty rows, two contracts, and one content hash per row.
- Cloud package plan: **PASS**, Layer 2 460 rows, 10 companion rows, and Layer 3 392 canonical fact assertions.
- Focused cloud-loader test: **PASS**, 4 tests.
- `npm run release:check`: **PASS**.
- `git diff --check`: **PASS**.

## Rollout Plan

Merge through the protected pull-request path. The repo-owned ACA deploy workflow builds the merged main SHA with a digest-pinned image. After the web image is live, run the approved ACA operator batch for the cloud package through Layer 2, Layer 3, and Layer 4, then run document-evidence persistence and signed-in Contract 360 proof for both selected contracts.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: repo-owned ACA web deploy only; data mutation uses the ACA operator job rule.
- Approved image digest: recorded from the merged main deploy before data jobs run.
- ACA runtime invariant: web template image and 100% traffic revision match that digest.
- Worker image invariant: operator job image is the approved digest or the current runbook-approved worker image.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, including Evidence, Education, and Optimize tabs for both loaded contracts.

## Rollback Plan

If validation fails, do not activate the new overlay. Preserve prior canonical rows, correct the package, and rerun with a new idempotency key. If the web release regresses, use the repo-owned ACA rollback workflow to the prior digest; data rows remain governed and are not deleted by a UI rollback.

## Audit Evidence

- Package manifest, QA counts, and governed dataset manifest.
- Companion-builder output and cloud-loader plan output.
- Focused test and release-gate output.
- ACA operator job proof bundles and Layer 2/3/4 readbacks.
- Signed-in Contract 360 tab assertions for both selected cloud contracts.

## Known Gaps

- The staged source evidence remains synthetic markdown, not restricted production PDFs.
- Invoice reconciliation is present as a separate financial lane; no invoice-line detail is inferred from it.
- The broader register/depth identity split remains explicitly audited and is not silently remapped.
