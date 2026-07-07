# 2026-06-23-brain-contract-final-answer-proof — Score and Render Ava's Final Answer

## Release ID

`2026-06-23-brain-contract-final-answer-proof`

## Status

`candidate`

## Plain-English Summary

The deployed all-tenant gate showed First Capital still red even after Apex was fixed. The root cause was twofold: incomplete model-emitted pipe-table fragments could remain in final prose, and the proof harness was scoring transient streamed text instead of the final `AgentAnswer` rendered by Home and Intelligence. This change strips orphan table fragments from final prose and aligns the matrix/reality crawl with the final answer object users actually see.

## Layer Impact

- `global-control-lane`: Updates shared Ava answer exhibit cleanup and shared QA harnesses. No tenant-specific data, schema, auth, or feature flags change.

## Client Applicability

- All clients: Yes. Final answer cleanup and proof scoring are tenant-agnostic.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag. Existing surface rollout flags remain unchanged.

## Changes Included

- `src/lib/intelligence/answer/structured-exhibits.ts`: Removes orphan pipe-table fragments from final prose after typed exhibit extraction.
- `src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts`: Adds regression coverage for incomplete visual-table fragments.
- `scripts/qa/tenant-matrix-gate.mjs`: Scores final `AgentAnswer.prose` when present, matching the canonical renderer.
- `scripts/qa/reality-crawl.mjs`: Stores both final prose and stream prose, while scoring the final rendered answer.

## QA / Validation

- `npx jest src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/lib/intelligence/ask/response-policy.test.ts --runInBand` passed.
- ESLint, release check, CI, deploy, and signed-in tenant matrix are required before release.

## Rollout Plan

Merge to `main`; repo-owned ACA main deploy builds and shifts traffic to the new digest. After deploy, rerun the signed-in tenant matrix for all five tenants and then generate the reality-crawl report.

## Deployment Authority

- Repo-owned deploy workflow: Required, via the main ACA deploy workflow.
- Shared runtime mutators: No manual runtime mutation in this PR.
- Approved image digest: Populated by ACA deploy after merge.
- ACA runtime invariant: Template image, active revision image, and 100% traffic revision must match after deploy.
- Worker image invariant: Not changed.
- Feature/env flag update path: No new flag or env var.
- Live signed-in proof required: Yes, all five tenants through `scripts/qa/tenant-matrix-gate.mjs`; reality-crawl report follows.

## Rollback Plan

Revert this PR and allow the repo-owned ACA deploy workflow to roll forward to the reverted image. No database rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/3891.
- Focused test output: local Jest command listed above.
- Deployed tenant matrix and reality-crawl report: pending post-deploy.

## Known Gaps

This PR does not add new domain expertise or new tenant data. It ensures the canonical final answer and proof harness agree, and that incomplete table fragments are not shown as prose.
