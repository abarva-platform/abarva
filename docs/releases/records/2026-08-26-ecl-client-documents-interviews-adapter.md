# 2026-08-26-ecl-client-documents-interviews-adapter - ECL Client Documents and Interviews Adapter

## Release ID

`2026-08-26-ecl-client-documents-interviews-adapter`

## Status

`candidate`

## Plain-English Summary

Adds a local proof adapter for the documents/interviews intake family. The adapter maps interview answer excerpts into ECL source records, interview-note documents, extraction pointers, role/function/theme context, and interview signal measures while preserving follow-up and known-gap states.

## Layer Impact

- Affected lane: `L-CLIENT`.
- Layer 2 SOURCE ADAPTERS: adds the SP01 documents/interviews adapter.
- Layer 3 CANONICAL MODEL: emits local proof rows for `ecl_source.source_file`, `ecl_source.source_record`, `ecl_source.document`, `ecl_source.document_extraction`, `ecl_context.object`, `ecl_context.relationship`, `ecl_context.metric_definition`, and `ecl_context.measure`.
- Layer 4 PRODUCTS: updates status/proof wiring only; no product route behavior changes.

## Client Applicability

- All clients: adapter pattern is available after merge.
- Specific clients: none.
- Internal only: local proof and status tracking.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ecl/load_client_intake_documents_interviews_layer.py`
- `scripts/ecl/__tests__/run-ecl-client-intake-documents-interviews-adapter-tests.mjs`
- ECL no-stop workflow proof wiring.
- Package script wiring for the SP01 load and proof commands.
- Four-lane status writer/status artifact updates for the L-CLIENT adapter lane.

## QA / Validation

- PASS: `npm run test:ecl-client-intake-documents-interviews-adapter`
- PASS: `ECL_RECONCILE_REF=HEAD npm run test:ecl-four-lane-status`
- PASS: `npm run test:npm-script-targets`
- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

The SP01 proof uses disposable Postgres, loads the draft ECL schema, applies generated adapter SQL, validates interview excerpt, document, extraction, role, function, theme, relationship, and measure counts, confirms extraction spans are not stamped constants, confirms raw transcripts are not fabricated, and plants a broken extraction document reference to prove FKs reject unresolved document references.

## Rollout Plan

Merge through the protected PR path. This release has no ACA deploy, Azure data-build execution, route repointing, traffic shift, or shared runtime mutation.

## Deployment Authority

- Repo-owned deploy workflow: not used.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no.

## Rollback Plan

Revert the PR. Since this is local adapter/proof code only, rollback does not require data-plane cleanup.

## Audit Evidence

- Adapter: `scripts/ecl/load_client_intake_documents_interviews_layer.py`
- Proof: `scripts/ecl/__tests__/run-ecl-client-intake-documents-interviews-adapter-tests.mjs`
- Status: `docs/architecture/ecl-four-lane-completion-status.json`

## Known Gaps

The adapter intentionally maps interview-summary excerpts only. It does not fabricate raw transcript bodies, meeting recordings, employee-level records, or client attestation.
