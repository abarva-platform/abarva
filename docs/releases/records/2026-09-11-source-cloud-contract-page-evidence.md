# 2026-09-11 — Source Cloud Contract Page Evidence

## Release ID

`2026-09-11-source-cloud-contract-page-evidence`

## Status

`candidate`

## Plain-English Summary

Adds the governed page-text companion lane for the synthetic cloud-consumption contract package. The six reviewed evidence documents already present in the package are now represented by six page records, allowing Evidence and Education to cite document-backed context instead of showing an empty document lane. This does not turn synthetic evidence into client truth or create finance-confirmed value.

## Layer Impact

- **Affected release lane:** `client-data-lane` for the staged governed package and `global-control-lane` for reusable loader provenance behavior.
- **Layer 1 — client intake:** the package manifest now declares the six page-text companion rows and their source-file identities.
- **Layer 2 — source adapters:** the cloud package loader includes companion page-text content in the package hash while keeping document pages separate from cloud operational adapter rows.
- **Layer 3 — canonical model:** the existing document-evidence companion loader can persist governed file, page, span, and extraction records tied to the loaded contract.
- **Layer 4 — products:** no product code changes; the existing Evidence, Contract 360, and education read paths can consume the newly loaded document records.

## Client Applicability

- All clients: reusable loader and provenance behavior.
- Specific clients: none.
- Internal only: operator validation and package QA.
- Public/demo only: the staged synthetic demo package is eligible after the governed load gate passes.
- Feature flag: none.

## Changes Included

- Six `contract_page_text.csv` rows for the staged synthetic cloud-consumption package.
- Package-manifest and governed dataset-manifest row-count updates.
- Cloud package hash update so companion page text changes the recorded source version.
- Canonical page-text facts are loaded with the cloud package so the Contract 360 projection and document lineage use the same count.
- Behavioral loader coverage for companion-row reporting and hash invalidation.

## QA / Validation

- Document-evidence plan: **PASS**, six page rows, eight clause rows, six distinct source files.
- Cloud package plan: **PASS**, 169 Layer 2 rows, six synthetic documents, six companion page rows.
- `npm run validate:context-corpus:manifests`: **PASS**.
- `git diff --check`: **PASS**.
- Focused cloud-loader and document-evidence tests: **PASS**.

## Rollout Plan

Merge through the protected pull-request path. The repo-owned ACA deploy workflow must build the merged main SHA with a digest-pinned image. After the web image is live, run the approved ACA operator jobs for the package layers and companion document-evidence load, then run the existing Layer 4 bridge refresh and signed-in Contract 360 proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: repo-owned ACA web deploy only; data mutation uses the ACA operator job rule.
- Approved image digest: record the digest produced by the merged main deploy before running the job.
- ACA runtime invariant: web template image and 100% traffic revision must match that digest.
- Worker image invariant: operator job image must be the approved digest or the current approved worker image recorded by the runbook.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, including the Evidence and Education tabs for the loaded contract.

## Rollback Plan

If the package or document projection fails validation, do not activate the overlay. Preserve the existing canonical rows, correct the package, and rerun with a new idempotency key. If the web release regresses, use the repo-owned ACA rollback workflow to the prior digest; document rows remain governed data and are not deleted as part of a UI rollback.

## Audit Evidence

- Package and governed manifest files.
- Local document-evidence plan output.
- Cloud package plan output with companion hash coverage.
- ACA operator job logs and proof bundle.
- Layer 4 readback and signed-in Evidence/Education screenshots or DOM assertions.

## Known Gaps

- The package contains synthetic markdown evidence, not restricted production PDFs.
- Cloud AP reconciliation remains a distinct financial evidence lane; no invoice-line detail is invented from it.
- The broader register/depth identity split remains separately audited and is not silently remapped by this package.
