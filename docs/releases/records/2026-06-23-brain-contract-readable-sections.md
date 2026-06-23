# 2026-06-23-brain-contract-readable-sections — Ava Consultant Section Normalization

## Release ID

`2026-06-23-brain-contract-readable-sections`

## Status

`candidate`

## Plain-English Summary

Ava answers can include the right facts and tables but still read like one dense paragraph when the model emits section variants such as `Evidence — what is in your estate:` or places `Implication:` immediately after an extracted table. This change normalizes those section markers into the canonical consultant shape before Home, Intelligence, or Tower renders the answer.

## Layer Impact

- `global-control-lane`: Updates the shared intelligence answer policy used by the shared Ava answer path. The change applies to answer formatting and exhibit extraction, not tenant data or access control.

## Client Applicability

- All clients: Yes. The normalization is tenant-agnostic and applies anywhere the shared answer policy builds a final `AgentAnswer`.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag. Existing SCB/brain rollout flags still control whether a surface uses the shared engine.

## Changes Included

- `src/lib/intelligence/ask/response-policy.ts`: Normalizes inline and variant consultant section labels into readable `Read`, `Evidence`, `Implication`, and `Next move` paragraphs.
- `src/lib/intelligence/ask/response-policy.test.ts`: Adds regression coverage for live consultant section variants.
- `src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts`: Adds Apex-style inline table coverage proving tables are lifted into typed exhibits while prose remains readable.

## QA / Validation

- `npx jest src/lib/intelligence/ask/response-policy.test.ts src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/lib/intelligence/answer/__tests__/answer-safety.test.ts --runInBand` passed.
- Release check, lint, CI, deploy, and tenant matrix proof are required before this candidate can be marked released.

## Rollout Plan

Merge to `main`; repo-owned ACA main deploy builds a new digest and rolls traffic to the new revision. After deploy, run the signed-in tenant matrix against all five tenants and then the reality crawl/report workflow.

## Deployment Authority

- Repo-owned deploy workflow: Required, via the main ACA deploy workflow.
- Shared runtime mutators: No manual runtime mutation in this PR.
- Approved image digest: Populated by ACA deploy after merge.
- ACA runtime invariant: Template image, active revision image, and 100% traffic revision must match after deploy.
- Worker image invariant: Not changed.
- Feature/env flag update path: No new flag or env var.
- Live signed-in proof required: Yes, all five tenants through `scripts/qa/tenant-matrix-gate.mjs`; screenshots/report required before tracker cells turn green.

## Rollback Plan

Revert this PR and allow the repo-owned ACA deploy workflow to roll forward to the reverted image. No database or tenant-data rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/3888.
- Focused test output: local Jest command listed above.
- Deployed tenant-matrix and reality-crawl report: pending post-deploy.

## Known Gaps

This PR hardens readable consultant shaping and typed table extraction. It does not complete the full Brain Contract by itself; final all-tenant proof still requires deployed matrix, screenshots, and reality-crawl report.
