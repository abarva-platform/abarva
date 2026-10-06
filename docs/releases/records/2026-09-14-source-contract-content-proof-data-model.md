# 2026-09-14 — Source Contract Content-Proof Data Model

## Release ID

`2026-09-14-source-contract-content-proof-data-model`

## Status

`candidate`

## Plain-English Summary

Adds the governed data contract needed for the redesigned Source Contract 360 content-proof view. Each contract-intelligence record now carries an honest reporting context, structured metric metadata, archetype-specific education, and explicit load lineage so the eight tab stories can be explained, audited, and rendered without inventing values.

## Layer Impact

`client-data-lane`; Layer 3 canonical/read-model interpretation and Layer 4 Source projections.

- L3: preserves the distinction between signed facts, calculations, playbook rules, judgments, and unestablished values, including reporting cutoff and completeness.
- L4: gives each contract story the context required to render supported exhibits, mappings, takeaways, Ask aVa grounding, limitations, and education without relying on generic copy.

## Client Applicability

- All clients: the typed model and validation patterns are reusable for governed contract packages.
- Specific clients: none.
- Internal only: loader, operator, and data-quality diagnostics.
- Public/demo only: synthetic validation only; no client-identifying data is included.
- Feature flag: none.

## Changes Included

- `src/lib/source/contract-intelligence/types.ts`
- `src/lib/source/contract-intelligence/build.ts`
- `src/lib/source/contract-intelligence/education.ts`
- `docs/governance/SOURCE_CONTRACT_INTELLIGENCE_DATA_MODEL.md`
- Focused contract-intelligence and projection tests

## QA / Validation

- Focused Jest suites: passed, 5 suites and 18 tests.
- TypeScript no-emit check: required before merge.
- ESLint on touched Source model and test files: required before merge.
- Release validation: required before merge.
- Content-proof review: completed against the supplied reference artifact; it is treated as a content contract, not as executable UI instructions.
- Azure schema/data apply and signed-in Source proof: required after merge and ACA deployment.

## Rollout Plan

Merge through protected `main`, deploy through the repo-owned ACA workflow, verify the digest-pinned runtime invariant, apply any pending additive schema through the digest-pinned ACA operator Job, then run only approved dense Source packages through ACA Jobs with row-count, quality-gate, and independent readback proof. Product claims remain separated into loaded, indexed, retrievable, cited, reviewed, and approved states.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: repository workflow only
- Approved image digest: captured from the ACA workflow after merge
- ACA runtime invariant: template image, 100%-traffic revision image, and required worker images must match the approved digest
- Worker image invariant: every governed operator Job records and uses the approved digest
- Feature/env flag update path: none
- Live signed-in proof required: Source portfolio and Contract 360 tab-by-tab content proof after data reload

## Rollback Plan

Revert through a new PR and redeploy the prior approved digest. Additive model fields do not require destructive data rollback. Any data correction or package replacement must use a governed ACA Job with a scoped dataset version and independent readback.

## Audit Evidence

- PR and merge SHA
- Focused test, typecheck, lint, and release-check output
- ACA deploy run, digest, revision, traffic, and runtime-invariant proof
- Schema-job migration readback
- Source package Job proof bundles, quality gates, and independent readbacks
- Signed-in tab-by-tab screenshots or DOM assertions

## Known Gaps

- The existing portfolio register and dense depth population still require authoritative identity reconciliation before the full book can claim archetype coverage.
- This change defines and builds the content-proof model; it does not classify an unknown contract or manufacture missing evidence.
- Report/email delivery is outside this release.
