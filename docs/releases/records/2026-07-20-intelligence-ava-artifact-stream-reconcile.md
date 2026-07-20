# 2026-07-20-intelligence-ava-artifact-stream-reconcile — Intelligence aVa Artifact Stream Reconciliation

## Release ID

`2026-07-20-intelligence-ava-artifact-stream-reconcile`

## Status

`candidate`

## Plain-English Summary

The deployed model-owned artifact contract in PR #5144 correctly produces typed tables and charts for Intelligence aVa, but live proof found one remaining streaming leak: Claude could emit a governed `abarva-canvas` fenced payload in streamed deltas before the final clean `AvaAnswerPacket` arrived. This release extends the existing structured-fence stream filter and dock fallback so raw canvas/control syntax never appears in the visible chat rail while the final typed packet still renders the executive artifact.

This does not invent business content, rewrite Claude's recommendation, or add renderer-generated conclusions. It only keeps governed machine-readable artifact payloads out of visible prose.

## Layer Impact

- `global-control-lane`: updates the shared Intelligence/aVa streaming display path used across tenants.
- `public-demo`: improves client/investor demo fidelity by preventing raw artifact fences from appearing during chart/table answers.

## Client Applicability

- All clients: yes, for any surface using the shared aVa/AgentDock rendering path.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/intelligence/answer/structured-fence-stream-filter.ts`: treats `abarva-canvas` as a governed structured artifact fence and suppresses fenced structured payloads across chunk boundaries.
- `src/components/agent/AgentDock.tsx`: treats `abarva-canvas` fences and `canvasType` metadata as raw artifact-control fragments when governed packet artifacts are available.
- Regression tests for split `abarva-canvas` stream chunks, final packet prose cleanup, and AgentDock visible-output suppression.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/lib/intelligence/answer/__tests__/structured-fence-stream-filter.test.ts --runInBand`
- PASS: `npm test -- --runTestsByPath src/components/agent/__tests__/AgentDock.test.tsx --runInBand --testNamePattern "suppresses raw abarva-canvas|suppresses raw markdown table fragments|renders Intelligence structured artifacts"`
- PASS: `npx eslint src/lib/intelligence/answer/structured-fence-stream-filter.ts src/lib/intelligence/answer/__tests__/structured-fence-stream-filter.test.ts src/components/agent/AgentDock.tsx src/components/agent/__tests__/AgentDock.test.tsx`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`

## Rollout Plan

Merge by PR to `main`. The repo-owned ACA main deploy workflow builds and deploys the digest-pinned web image and updates worker jobs. After deploy, rerun the same FS Demo artifact smoke used after PR #5144 and confirm streamed deltas and final visible answer contain no `abarva-canvas`, `canvasType`, raw chart JSON, old boundary table, tab markers, or Markdown fences.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: assigned by the ACA main deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: n/a.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the merge commit and let the same ACA main deploy workflow redeploy the prior main image. No migration, data mutation, feature flag, or environment change is involved.

## Audit Evidence

- Pre-fix live proof after PR #5144 deploy: `/Users/anand/Projects/nexus/proof/intelligence-artifact-smoke-2026-07-20T16-21-33-076Z/summary.json`
- The pre-fix proof showed typed packet artifacts (`1` table, `3` charts, `4` artifacts) and no old `Requested Visual Boundary`, but did show a streamed `abarva-canvas` Markdown fence in visible delta text.
- Focused local tests listed above.

## Known Gaps

- This is not the full 40Q Intelligence visual/export certification. It fixes the raw structured-fence leak found by the first post-#5144 live smoke.
