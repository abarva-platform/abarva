# 2026-09-16 Source Opportunity Ownership

## Release ID

`2026-09-16-source-opportunity-ownership`

## Status

`candidate`

Rollout blocked pending data review and a separately approved cutover. Passing code checks does not satisfy the data precondition.

## Plain-English Summary

Source package loaders now require explicit, reciprocal per-contract opportunity ownership. One package writes canonical opportunity rows; a contributing package continues to load contract and operating evidence without writing competing opportunities for that contract. Missing or conflicting declarations stop the load before database access.

## Layer Impact

`client-data-lane`: Layer 1 package metadata declares ownership. Layer 2 adapter evidence remains intact. Layer 3 opportunity writes and readback expectations follow the declaration. No product projection or schema changes are included.

## Client Applicability

- All clients: No automatic runtime change.
- Specific clients: Only packages named in the ownership manifest; other packages retain current behavior.
- Internal only: Operator-run package loaders.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Add a per-contract ownership manifest and shared validator.
- Gate both package loaders' opportunity writes and expectations by declared ownership.
- Add focused plan-mode tests for canonical, evidence-only, missing/conflicting, and unrelated package cases.

## QA / Validation

- Focused ownership and adjacent loader tests: passed (41 tests across 4 suites). The ownership suite failed before the loader gates were added and passed after.
- Scoped ESLint and TypeScript no-emit checks: passed.
- Release check: passed.
- No database, Azure, or product-runtime mutation performed.
- Package-hash isolation test: changing only unrelated ownership declarations leaves selected and unlisted package hashes unchanged.

## Rollout Plan

Merge only after review as a separate behavior slice. **Data rollout is blocked**: the evidence-only package's Layer 3 readback requires zero `source.optimization_opportunity` rows for its exact tenant, dataset version, and declared contract, while pre-existing rows are reported in that scope. The loader skips opportunity writes but does not retire those rows. A stage change or narrative supersession alone cannot satisfy the zero-row check. This candidate does not authorize a data run or deployment.

The operator cutover must be a separate, reviewed data-plane change:

1. Resolve the tenant key, evidence-only dataset version, contract ID, and exact opportunity IDs from the approved registry, ownership declaration, and immutable package input. Preflight a read-only snapshot of matching opportunity rows, baselines/cases, all dependent rows and external references, plus the canonical writer's rows. Record counts, IDs, hashes, and a rollback/restore artifact. Confirm that no IDs or relationships outside the approved tuple are included.
2. Obtain data-owner approval for an explicit retirement method and dependency order. Preserve the historical evidence and lineage in a governed archive or equivalent approved record before any removal. Execute only in an approved operator job/transaction with predicates on tenant key, dataset version, contract ID, and enumerated opportunity IDs; abort on a changed count or unexpected reference. The package loaders must not perform this cleanup.
3. Read back zero opportunity, baseline/case, and dependent spine rows in the evidence-only tuple. Read back the unchanged canonical writer opportunities and unchanged unrelated tenant/version/contract rows. Then rerun the evidence-only package and verify that clause, ticket, pricing, spend, and Layer 2 adapter evidence remain available while the opportunity count stays zero. Capture rollback and post-run proof before considering product-level validation.

## Deployment Authority

- Repo-owned deploy workflow: Not invoked by this candidate.
- Shared runtime mutators: None authorized.
- Approved image digest: Not applicable to this code-only candidate.
- ACA runtime invariant: Not checked; no runtime claim.
- Worker image invariant: Not checked; no worker update.
- Feature/env flag update path: None.
- Live signed-in proof required: Required only after a separately approved deployment or data run.

## Rollback Plan

Revert the code and manifest before any data run. After a separately approved retirement, restore only from its reviewed archive/backup under the same exact tuple and dependency checks; code reversal alone does not restore canonical data state. Do not delete cross-dataset rows as a rollback shortcut.

## Audit Evidence

- Focused test output, TypeScript and ESLint results, release-check result, and the separate PR diff.
- Any later data run requires its own approved scope, preflight inventory, archival/restore proof, before/after readback, and independent data-owner sign-off.

## Known Gaps

- No live data reconciliation, apply-mode integration, or signed-in product proof in this code-only candidate.
- Data rollout remains blocked until the exact-scope retirement/supersession decision and readback are approved and completed. This candidate has no live-row inventory or data-owner approval.
- Cross-dataset opportunity deletion is a separate prerequisite fix; this release does not change that path.
- Calculation-state semantics are a separate follow-up and are not changed here.
