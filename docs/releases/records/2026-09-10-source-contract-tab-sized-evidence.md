# 2026-09-10-source-contract-tab-sized-evidence — Source Contract Tab Sized Evidence

## Release ID

`2026-09-10-source-contract-tab-sized-evidence`

## Status

`candidate`

## Plain-English Summary

This release keeps Contract 360 tab intelligence from treating advisory signal-stage actions as sized evidence. The generated Optimize narrative now reads the canonical opportunity stage and amount state before describing how many action rows are priced versus still evidence-gated.

## Layer Impact

Release lane: `client-data-lane`.

Layer 3 is unchanged. Opportunity stage, amount state, confidence, and value remain owned by the canonical optimization opportunity rows.

Layer 4 changes. The Contract 360 tab-intelligence view is replaced so its summary text follows the canonical sized-versus-signal split already used by the product detail table.

## Client Applicability

- All clients: Yes, for Contract 360 tab intelligence.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `supabase/migrations/20260910233000_source_contract_tab_intelligence_sized_rows.sql`
- `scripts/source/project-contract-depth-package-layer4.ts`
- `scripts/source/__tests__/project-contract-depth-package-layer4.test.ts`

## QA / Validation

Pre-merge validation:

- PASS expected: focused Layer 4 projection test.
- PASS expected: `git diff --check`.
- PASS expected: `npm run release:check`.
- NOT RUN pre-merge: ACA schema apply through the approved operator job. This runs only after the repo-owned deploy publishes the migration.
- NOT RUN pre-merge: signed-in Contract 360 proof. This runs only after deploy and schema apply.

## Rollout Plan

Merge through pull request, let the repo-owned ACA main deploy workflow publish the new image, verify the runtime invariant, run the approved schema-apply ACA job, then smoke Contract 360 Optimize against a selected contract with both sized and signal-stage actions.

## Deployment Authority

- Repo-owned deploy workflow: Required for the web image.
- Shared runtime mutators: Not allowed outside the repo-owned workflow.
- Approved image digest: To be captured after deployment.
- ACA runtime invariant: Required before schema replay.
- Worker image invariant: Required before schema replay.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, selected Contract 360 Optimize tab after schema refresh.

## Rollback Plan

Rollback requires a forward migration or restored view definition. Reverting application code alone does not replace a database view that has already been applied.

## Audit Evidence

Inspect the pull request, migration file, targeted test output, release-check output, ACA deploy workflow run, schema-apply job logs, and signed-in Contract 360 Optimize proof.

## Known Gaps

This release does not create new opportunity rows, benchmark comparables, finance outcomes, or document page text. It only aligns tab-intelligence evidence wording with the canonical opportunity stage and amount state.
