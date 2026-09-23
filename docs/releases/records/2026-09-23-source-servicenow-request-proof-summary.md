# 2026-09-23-source-servicenow-request-proof-summary - Compact request import proof

## Release ID

`2026-09-23-source-servicenow-request-proof-summary`

## Status

`candidate`

## Plain-English Summary

The request import operator job now ends with a compact, deterministic proof summary. The ACA job wrapper can retain request counts, archetype coverage, gaps, input identity, mode, and write authority when a large proof archive falls outside the captured log tail. The wrapper distinguishes a summary-only extraction from a complete archive extraction.
The workflow fails if the resulting proof is absent, mismatches the dispatched input, has quality gaps, or contradicts dry-run/no-contact authority.

## Layer Impact

Release lane: `client-data-lane`.

- Layer 2 source adapter/operator: Emits an allowlisted log summary from the completed import plan and validates it in the existing ACA operator wrapper.
- Layer 3 canonical model: No schema or write-path change.
- Layer 4 products: No product surface change.

## Client Applicability

- All clients: The reusable operator mechanism applies when a client-scoped request import is separately authorized.
- Specific clients: None.
- Internal only: ACA job proof capture and audit artifact extraction.
- Public/demo only: The checked-in acceptance input is synthetic.
- Feature flag: None.

## Changes Included

- `scripts/source/load-servicenow-sourcing-requests.ts`
- `scripts/ops/submit-aca-operator-job.mjs`
- `scripts/source/validate-servicenow-request-proof.mjs`
- `.github/workflows/source-servicenow-request-import-job.yml`
- Focused loader and wrapper behavior tests.
- Workflow proof validator and behavior tests.

## QA / Validation

- Before the change, the new focused tests measured 21 passed and 3 failed: the loader ended on the archive marker, and the wrapper had no compact-summary extraction.
- After the change, the expanded focused scope measured 26 passed and 0 failed. A local operator CLI dry run passed its final log line through the wrapper's 300-line tail extraction and yielded 10 requests, 10 archetypes, zero required-fact gaps, zero missing archetypes, the exact input SHA/source version, dry-run mode, zero inserted, and committed false. The same CLI log also produced a complete archive extraction when given to the wrapper in full.
- Mutation proof: changing the emitted request count from 10 to 11 failed two focused cases; changing the wrapper to accept committed dry runs failed three focused cases. Both mutations were restored.
- PASS - Node 24 `npm run typecheck` completed with `typecheck: clean`.
- PASS - Scoped ESLint over the four changed code/test paths completed with zero diagnostics.
- PASS - `npm run release:check` passed the release record, deploy authority, and data loader gates.
- PASS - `npm run ops:aca-job -- --self-test` passed without Azure access.
- PASS - Final `git diff --check` completed without whitespace errors.
- A red-first workflow test reproduced the previous green-without-proof result. All three focused suites now pass (30 tests). The workflow runs a behavioral validator after either operator mode; it requires a succeeded, idle-verified job and proof matching the immutable dispatch. Missing proof, mismatched input, zero coverage, fact gaps, or a purported dry-run write fails validation. Removing the input-hash comparison made the mismatch test fail; the comparison was restored.
- No live ACA job, database apply, migration apply, tenant-data write, or signed-in product check was run.

## Rollout Plan

Review through a PR, then use the repository-owned ACA main deployment workflow. A new operator dry run is a separate action after the deployed digest is verified. The proof summary adds no authority to apply data.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this candidate.
- Approved image digest: Determined by the repo-owned workflow after merge.
- ACA runtime invariant: Required before any deployed claim.
- Worker image invariant: Required before a new operator execution claim.
- Feature/env flag update path: None.
- Live signed-in proof required: No product surface changes; a later approved data apply needs separate readback.

## Rollback Plan

Revert this candidate's loader and wrapper changes. Already stored request-version data is unaffected.

## Audit Evidence

- Focused test output and reversible mutation results.
- A future dry-run artifact should contain `05-source-servicenow-proof-summary.json` and `summary.json` with `proof.extracted=true`, `proof.extractionKind=source_servicenow_request_summary`, and `proof.proofBundleExtracted=false` when only the summary survives. A complete archive should retain `proof.tgz` and `proof/` as well.

## Known Gaps

- This candidate has local execution proof only. Deployment, a new ACA dry run, digest/readback verification, and independent data-plane readback remain separate actions.
