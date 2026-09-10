# 2026-09-10-source-ava-exportable-optimization-answer - Source aVa exportable optimization answer

## Release ID

`2026-09-10-source-ava-exportable-optimization-answer`

## Status

`candidate`

## Plain-English Summary

Source aVa contract-optimization answers now use an executive answer contract: verdict, rationale, lever table, negotiation stance, and evidence caveat. The visible response keeps the evidence restrictions in the generated answer itself and presents levers in a Markdown table that can be exported or copied into a client-facing sample.

## Layer Impact

Layer 4 - Products, `global-control-lane`: Source aVa selected-contract answers are formatted for executive review. No canonical records, loader behavior, or tenant data are changed.

## Client Applicability

- All clients: Source selected-contract aVa answers that use the governed Source workspace context.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/ava/source-workspace-visual-answer.ts`
- `src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts`

## QA / Validation

- `npx jest --runInBand --testPathPatterns='src/lib/source/ava/__tests__/source-workspace-visual-answer\.test\.ts$'` - pass, 10 tests.
- Broader TypeScript, ESLint, release, and deployed smoke validation are pending for this candidate.

## Rollout Plan

Open a pull request, merge through the protected repository flow, and let the repo-owned Azure Container Apps main deploy workflow build and deploy the resulting image.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared runtime rollout.
- Shared runtime mutators: None in this change.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Pending deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source aVa selected-contract optimization prompt after deployment.

## Rollback Plan

Revert the merged commit or roll the web runtime back to the last healthy digest through the approved ACA workflow. No data rollback is required.

## Audit Evidence

- Pull request: Pending.
- CI run: Pending.
- ACA deploy run and runtime invariant proof: Pending.
- Live Source aVa smoke output: Pending.

## Known Gaps

This change formats the answer and evidence boundary. It does not add new benchmark-comparator fields, new pricing data, or new canonical opportunity dimensions.
