# 2026-10-12 Source Selective Visibility Review Plans

## Release ID

`2026-10-12-source-selective-contract-visibility`

## Status

`candidate`

## Plain-English Summary

Prepare a narrowly bounded review packet and transactional core for recovering an existing canonical contract and its explicitly declared application scope when their load runs are outside the selected book. Only two operational load-run references and one new owned overlay may change. Every business field and original before-image is preserved. The core has no CLI or product caller; a separately reviewed, execution-bound ACA wrapper is still required. This release does not apply data.

## Layer Impact

Release lane: `client-data-lane`, internal bounded repair preparation. No client data apply is performed by this candidate.

- SOURCE ADAPTERS: No new intake or adapter output.
- CANONICAL MODEL: Describe two existing rows and their exact original and proposed lineage references. A tested transaction core changes only these references and one owned selector when called by a separately authorized native wrapper. The planner itself does not connect to or mutate the database.
- PRODUCTS: Describe the existing-schema selector needed for later visibility recovery. No view, schema, route, traffic, UI or agent-readiness change is performed.

## Client Applicability

- All clients: No automatic effect.
- Specific clients: Future proposals require a declared canonical tenant and exact contract, scope and application identifiers.
- Internal only: Proposal preparation from a complete sealed native before-image, plus apply and conditional restore primitives without a command-line entry point.
- Public/demo only: None.
- Feature flag: No product entry point or executable mutation is enabled.

## Changes Included

- `scripts/source/selective-contract-visibility.ts`: Validate a complete bounded read-only proof, actual selector schema and key, exact tenant/contract/application identities, access controls, and unchanged business facts.
- `scripts/source/__tests__/selective-contract-visibility.test.ts`: Positive proposal and negative boundary cases.
- `scripts/source/selective-contract-visibility-transaction.mjs`: Exact-plan transaction, locked current full-row and selector comparisons, immutable proof acknowledgements, scoped new-run collision checks, tenant access controls, canonical collateral fingerprints, exact two-plus-one counts and selected-view readback. Restore compares the full applied rows and owned overlay before changing anything.
- `scripts/source/__tests__/selective-contract-visibility-postgres.test.mjs`: Actual disposable-Postgres apply, rollback and restore controls; a missing database fails rather than silently skipping.
- `.github/workflows/source-integration.yml`: Give the new script suite an explicit existing CI owner.

## QA / Validation

- Red-first missing implementation followed by 26 passing focused cases.
- Replayed the planner against a complete private native proof; it proposes exactly two lineage-only targets and keeps execution disabled. Private rows and source bytes are not committed.
- Four planted regressions are caught: enabling execution, altering a business field, dropping the application-ID check, and accepting a partial proof. Each caused a focused test failure and was restored; the final baseline passes.
- Combined focused validation passes 71 cases across three suites. Node24 TypeScript, focused lint and all11 release gates pass.
- The new transaction suite passes 21 cases, including the enclosing harness, with zero skips. A first run caught an ineffective test mutation of an already-empty overlay payload; the test now changes the payload and demonstrates restore refusal. Failed backup and precommit proof writes roll back; postcommit proof failure explicitly reports a committed transaction rather than claiming rollback.
- Three transaction mutations were planted and restored: bypassing collateral comparison, omitting the pre-write backup and skipping selected-contract readback. Each fails the disposable-Postgres suite; the final baseline passes. The selected-contract mutation is additionally stopped by the scope readback, demonstrating layered refusal rather than a successful corrupt commit.
- Genuine census regeneration found inherited base drift from another source suite; this candidate adds no src/Jest file and does not include that unrelated census hunk. The committed census shape remains valid. No native apply or browser acceptance is implied by these local checks.

## Rollout Plan

Normal reviewed PR and applicable full exact-head CI, then squash merge and repo-owned main packaging. Proposal construction alone has no data effect. A future operator requires its own exact reviewed execution binding, current row and selector locks, new-run collision check, private immutable backup, transactional count and side-effect guards, conditional restore, native after-readback and signed-in acceptance.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: None added by the planner.
- Approved image digest: Not established for this candidate.
- ACA runtime invariant: Verify template, healthy active 100-percent traffic revision and both workers at the approved digest before any runtime claim.
- Worker image invariant: Both delivery workers must match.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, after a separately authorized future data repair, not for this read-only planner.

## Rollback Plan

Revert this proposal helper through a reviewed PR if needed. There is no database change to roll back from this release. A future data restore must compare full applied after-images, restore only the original two lineage references, remove only its owned overlay, and refuse newer edits or selector drift.

## Audit Evidence

Inspect the focused suite, its explicit CI invocation, exact-head validation and independent release review. Native before-images, proposal hashes and delegated decisions remain in private proof storage. No financial result, source-system connection or independent human review is certified here.

## Known Gaps

The native ACA wrapper, independent execution binding, immutable Blob integration, shared data apply, native selected-view restoration and signed-in acceptance remain separate gates. The transaction core's injected proof callback is not itself storage or approval authority. The planner cannot activate an old run, rewrite global views, alter business facts, promote review states or make rows agent-ready.
