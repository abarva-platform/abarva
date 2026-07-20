# 2026-07-20-intelligence-ava-artifact-contract — Intelligence aVa Model-Owned Artifacts

## Release ID

`2026-07-20-intelligence-ava-artifact-contract`

## Status

`candidate`

## Plain-English Summary

Intelligence aVa now treats executive exhibits as model-authored communication artifacts, not renderer-invented fallbacks. When a CXO asks for a table, chart, matrix, scorecard, ranking, or roadmap, Claude is instructed to choose the right artifact and provide the structured exhibit data itself. If Claude does not provide enough exhibit data, the renderer keeps the answer as honest prose instead of manufacturing a “Requested Visual Boundary,” “CXO Summary Table,” or source-support table.

## Layer Impact

- `global-control-lane` — Intelligence answer contract: updates the aVa response policy so Claude owns the advisory judgment, artifact type, business language, rows, caveats, and evidence boundary.
- `global-control-lane` — Intelligence structured exhibit renderer: removes prose-to-table and visual-boundary fallback generation from the answer-packet builder. The renderer still validates and displays governed `decision-table`, `chart`, Markdown table, chart, and graph artifacts when Claude or source rows provide them.
- `global-control-lane` — Agent dock test fixture: removes the old boundary artifact from the focused-mode rendering fixture so tests do not normalize the deprecated visible label.

## Client Applicability

- All clients: applies to Intelligence aVa answers across tenants.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/intelligence/ask/response-policy.ts`
- `src/lib/intelligence/answer/structured-exhibits.ts`
- `src/lib/intelligence/ask/response-policy.test.ts`
- `src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts`
- `src/components/agent/__tests__/AgentDock.test.tsx`

## QA / Validation

- `npm test -- --runTestsByPath src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/lib/intelligence/ask/response-policy.test.ts --runInBand` — passed, 67/67.
- `npx eslint src/lib/intelligence/answer/structured-exhibits.ts src/lib/intelligence/ask/response-policy.ts src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/lib/intelligence/ask/response-policy.test.ts src/components/agent/__tests__/AgentDock.test.tsx` — passed.
- Full `AgentDock.test.tsx` run was attempted with the Intelligence tests. The edited boundary-artifact fixture did not fail, but the broader suite still has unrelated current-main failures around `AI Draft`, citation-gap, `pin-top`, and structured-response rendering assertions. Those failures are not introduced by this candidate and remain out of scope.

## Rollout Plan

Merge through the protected PR lane. The change becomes active only after the repo-owned Azure Container Apps main deploy workflow builds and deploys the merged SHA, moves traffic to the healthy revision, and signed-in browser proof verifies the Intelligence page.

## Deployment Authority

- Repo-owned deploy workflow: required for shared product/lab runtime.
- Shared runtime mutators: none in this release candidate.
- Approved image digest: not available until ACA main deploy runs.
- ACA runtime invariant: required after deploy before claiming live.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes. Ask an Intelligence question that requests a ranking plus table/chart/matrix and confirm Claude-authored exhibits render without `Requested Visual Boundary`, raw JSON, debug labels, or renderer-invented summary tables.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No migrations or data-plane writes are included.

## Audit Evidence

- PR URL: pending.
- Focused Jest and ESLint output from this worktree.
- Post-merge ACA revision, image digest, traffic, and signed-in browser proof must be attached before marking released.

## Known Gaps

- Not deployed or live-proven in this candidate.
- The broader AgentDock test suite still contains unrelated current-main failures and should be cleaned up in a separate UI/test-maintenance slice.
