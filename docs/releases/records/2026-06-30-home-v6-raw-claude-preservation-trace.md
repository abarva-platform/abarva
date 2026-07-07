# 2026-06-30-home-v6-raw-claude-preservation-trace — Home V6 Claude Preservation Trace

## Release ID

`2026-06-30-home-v6-raw-claude-preservation-trace`

## Status

`candidate`

## Plain-English Summary

Home V6 now reports Claude answer preservation accurately. The trace no longer treats hidden debug/raw trace data as proof that Claude text was not preserved. Instead, `rawClaudePreserved` means the user-visible answer matches Claude's selected text after trimming. If the answer text is intentionally sanitized for public wording, the trace reports `answerSource=sanitized_claude` and `rawClaudePreserved=false`.

## Layer Impact

- `global-control-lane`: Shared Home answer provenance for all demo clients using the Home V6 executive synthesis path.
- `public-demo`: Improves post-deploy proof clarity for client demos by separating Claude text preservation from raw trace exposure.

## Client Applicability

- All clients: All tenants using Home V6 executive synthesis.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing `HOME_V6_EXECUTIVE_SYNTHESIS_ENABLED` / `HOME_V6_EXECUTIVE_SYNTHESIS_REQUIRED` behavior is unchanged.

## Changes Included

- `src/lib/home/know/home-v6-executive-synthesis.ts`: computes `rawClaudePreserved` from the selected Claude text versus the final visible prose and emits `traceRawClaudeExposed` separately.
- `src/lib/home/know/__tests__/home-v6-executive-synthesis.test.ts`: adds coverage for raw preservation when trace exposure is disabled and sanitized Claude when wording is intentionally normalized.

## QA / Validation

- `npx jest src/lib/home/know/__tests__/home-v6-executive-synthesis.test.ts --runInBand` passed.
- `npx eslint src/lib/home/know/home-v6-executive-synthesis.ts src/lib/home/know/__tests__/home-v6-executive-synthesis.test.ts --max-warnings 0` passed.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps main deploy workflow build and deploy the exact merge SHA, then run a signed-in Home V6 smoke that confirms `answerSource`, `rawClaudePreserved`, `traceRawClaudeExposed`, and visible answer text for Industrial Demo.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: Azure Container Apps deploy workflow only.
- Approved image digest: To be produced by the main deploy workflow after merge.
- ACA runtime invariant: Must show 100% traffic on the new revision before live proof is claimed.
- Worker image invariant: No worker behavior changed.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this release commit and redeploy the prior main image through the approved ACA main deploy workflow. Runtime behavior is trace-only for successful Claude answers; no data migration or schema rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/4206
- CI / focused tests: See QA commands above.
- Live proof: Pending deployment.

## Known Gaps

Full byte-for-byte renderer verification remains a broader cross-layer gate. This change fixes Home V6 answer-source trace semantics and does not alter rendering.
