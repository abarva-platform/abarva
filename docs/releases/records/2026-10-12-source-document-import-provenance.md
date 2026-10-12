# 2026-10-12-source-document-import-provenance

## Release ID

`2026-10-12-source-document-import-provenance`

## Status

Candidate. No historical replay, shared data apply or signed-in acceptance.

## Plain-English Summary

The document companion loader uses the same clause classifier as the canonical term writer. It no longer fills in an extraction score, page or PDF parser when importing authored text. Genuine declared review, parser and page provenance remain intact. An authored clause points to its declared file, not a fabricated extracted span. A file name does not establish an executed agreement.

## Layer Impact

Release lane: `global-control-lane` for future document imports. Any later tenant replay or new-package apply requires a separate exact `client-data-lane` decision.

- Layer 1: no input values or documents changed.
- Layer 2: clause declarations classify as derived or extracted without manufactured defaults.
- Layer 3: document-shaped rows preserve review and extraction basis; missing page counts stay unknown. No schema or RLS change.
- Layer 4: downstream consumers receive honest provenance, not additional approved facts or financial claims. No layout change.

## Client Applicability

- All clients: future runs of the affected companion import path.
- Specific clients: none receive an automatic data mutation at merge or deploy.
- Internal only: operator document import and disposable Postgres fixtures.
- Public/demo only: no dataset load or fictional execution approval.
- Feature flag: none; no authentication or RLS weakening.

## Changes Included

- Existing clause classifier connected to document normalization and the actual extraction writer.
- Remove default confidence, neighbouring-page inference and fixed PDF-extractor version.
- Preserve genuine provided citations; label authored imports distinctly.
- Remove execution-role inference from file names.
- Existing Source CI suite includes the real Postgres writer case with explicit disposable fixture configuration.

## QA / Validation

- Red-first missing-page/authored-basis cases failed before the hook; a separate file-name case reproduced an unsupported executed-agreement role.
- 19 document cases pass, zero skips with the disposable Postgres fixture. Actual writer persistence checks page, confidence, parser, method, source kind and file page count; a repeat genuine reviewed import retains page17, confidence0.74 and its declared parser.
- Three mutations killed: page1 fallback fails three cases including actual stored file page count; PDF-method substitution fails the recorded and Postgres writer assertions; fixed parser version fails the Postgres extraction assertion. Restored before validation.
- Offline plan still validates manifest conflicts before opening a connection.
- Runtime packaging inspected: Node24 and operational scripts plus `src/lib` are copied into the runtime image. Native execution remains separate proof.

## Rollout Plan

Sequence after the canonical writer compatibility candidate. Review and squash merge with complete exact-head CI. Only the repo-owned ACA main workflow may build or promote the shared image. No importer runs automatically. Existing rows, document bodies, source selectors, approvals and financial values remain unchanged until an exact delegated write/restore plan is separately approved.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none.
- Approved image digest: not captured for this candidate.
- ACA runtime invariant: template, healthy active single100%-traffic revision and both workers must match the approved digest.
- Worker image invariant: independently verified after deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: affected document provenance and citation rendering after a separately approved import.

## Rollback Plan

Revert code through a reviewed PR and the main deploy workflow. No live data rollback is implied. A future document import must retain before-images and guarded restore, including dependent rows and shared concept declarations; it must not silently delete or rewrite other versions.

## Audit Evidence

Existing-owner prerequisite decision, red/green actual writer results, mutation results, Source CI run, controlled PR, main deployment and future private before/readback/cite-render evidence. Raw authority and native rows remain private.

## Known Gaps

No historical data downgrade or correction, new-package load, selector promotion, native import, human/client review, signature, savings, Finance confirmation, indexing/retrieval or live citation proof. Canonical records may be excluded from a currently selected projection; this change does not bypass that selection. Exact namespace binding and native schema/row before-images remain load gates.
