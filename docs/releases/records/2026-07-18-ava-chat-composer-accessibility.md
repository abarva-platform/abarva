# 2026-07-18-ava-chat-composer-accessibility — Keep aVa Composer Reachable

## Release ID

`2026-07-18-ava-chat-composer-accessibility`

## Status

`released`

## Plain-English Summary

The aVa chat input must stay reachable without requiring the user to scroll after long answers, tables, charts, or suggested follow-up questions. This release tightens the shared chat dock layout so the answer transcript and suggested-question area scroll inside the panel, while the composer remains pinned at the bottom of the visible chat window.

## Layer Impact

- `global-control-lane`: Updates the shared `AgentDock` shell used by aVa-style advisor surfaces. The change is layout-only and does not alter answer generation, tenant context, model prompts, exports, or data retrieval.

## Client Applicability

- All clients: Shared aVa chat surfaces that render through `AgentDock`.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/agent/AgentDock.tsx`: clips the panel, bounds suggested questions and attachment chips to internal scroll regions, and keeps the composer sticky at the bottom of the dock.
- `src/components/agent/__tests__/AgentDock.test.tsx`: adds regression coverage for long suggested questions and updates the composer reachability assertion.

## QA / Validation

- Focused layout regression: `npx jest src/components/agent/__tests__/AgentDock.test.tsx --runInBand --runTestsByPath -t "bounds long suggested|keeps the composer sticky|panel and composer using"` passed.
- ESLint: `npx eslint src/components/agent/AgentDock.tsx src/components/agent/__tests__/AgentDock.test.tsx` passed.
- TypeScript: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` passed.
- Release gate: `npm run release:check -- --base origin/main --head HEAD` passed.
- PR checks for #5010 passed.
- ACA deploy workflow `29646653109` passed.
- Live health: `https://app.abarva.ai/api/health` returned HTTP 200 with `ok: true`.
- Live signed-in proof on `https://app.abarva.ai/intelligence` at `1366x768` passed. The composer form stayed visible at `y=704..768`, the input stayed visible at `y=717..760`, and `window.scrollY` remained `0` before, during, and after a long answer prompt.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main lane, assign 100% traffic to the healthy revision, then verify the live signed-in Intelligence chat composer is visible at desktop and shorter laptop viewports without scrolling.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: `acrabarvalab001.azurecr.io/abarva/web@sha256:5abeac3b84e9298fd85049a5f9dffee52301430462ec57092b90bdd4969b1874`
- ACA runtime invariant: Passed; template image and 100% traffic revision are on `ca-abarva-web-lab-eastus--m979bb13b`.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Complete, on `https://app.abarva.ai/intelligence`.

## Rollback Plan

Revert the PR and redeploy the previous healthy ACA image through the normal main deploy lane. No migration or data rollback is required.

## Audit Evidence

- PR: #5010, merged as `979bb13b659881af68e9911b5bc25d73f0409dcd`.
- ACA deploy: GitHub Actions run `29646653109`, successful.
- Live revision: `ca-abarva-web-lab-eastus--m979bb13b`, 100% traffic.
- Live image digest: `acrabarvalab001.azurecr.io/abarva/web@sha256:5abeac3b84e9298fd85049a5f9dffee52301430462ec57092b90bdd4969b1874`.
- Focused Jest output: passed locally in the clean worktree.
- Live proof bundle: `/Users/anand/Downloads/ava-chat-composer-accessibility-proof-2026-07-18`.

## Known Gaps

Full AgentDock test suite printed duplicate Jest manual-mock warnings and has unrelated stale assertions in this checkout. This release only changes the composer accessibility contract and its focused tests; PR #5010 and the ACA deploy both passed their required checks.
