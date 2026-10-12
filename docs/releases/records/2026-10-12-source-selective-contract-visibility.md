# 2026-10-12 Source Selective Visibility Review Plans

## Release ID

`2026-10-12-source-selective-contract-visibility`

## Status

`candidate`

## Plain-English Summary

Prepare a narrowly bounded review packet for recovering an existing canonical contract and its explicitly declared application scope when their load runs are outside the selected book. The packet proposes changing only two operational load-run references and inserting one new owned overlay. It preserves every business field and original before-image. This release is a planner, not an executable repair or data apply.

## Layer Impact

Release lane: `client-data-lane`, internal read-only review preparation. No client data mutation is released.

- SOURCE ADAPTERS: No new intake or adapter output.
- CANONICAL MODEL: Describe two existing rows and their exact original and proposed lineage references. The planner does not connect to or mutate the database.
- PRODUCTS: Describe the existing-schema selector needed for later visibility recovery. No view, schema, route, traffic, UI or agent-readiness change is performed.

## Client Applicability

- All clients: No automatic effect.
- Specific clients: Future proposals require a declared canonical tenant and exact contract, scope and application identifiers.
- Internal only: Read-only proposal preparation from a complete sealed native before-image.
- Public/demo only: None.
- Feature flag: No product entry point or executable mutation is enabled.

## Changes Included

- `scripts/source/selective-contract-visibility.ts`: Validate a complete bounded read-only proof, actual selector schema and key, exact tenant/contract/application identities, access controls, and unchanged business facts.
- `scripts/source/__tests__/selective-contract-visibility.test.ts`: Positive proposal and negative boundary cases.
- `.github/workflows/source-integration.yml`: Give the new script suite an explicit existing CI owner.

## QA / Validation

- Red-first missing implementation followed by 26 passing focused cases.
- Replayed the planner against a complete private native proof; it proposes exactly two lineage-only targets and keeps execution disabled. Private rows and source bytes are not committed.
- Four planted regressions are caught: enabling execution, altering a business field, dropping the application-ID check, and accepting a partial proof. Each caused a focused test failure and was restored; the final baseline passes.
- Combined focused validation passes 71 cases across three suites. Node24 TypeScript, focused lint and all11 release gates pass.
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

The mutation operator, execution binding, shared data apply, native selected-view restoration and signed-in acceptance remain separate work. The planner cannot activate an old run, rewrite global views, alter business facts, promote review states or make rows agent-ready.
