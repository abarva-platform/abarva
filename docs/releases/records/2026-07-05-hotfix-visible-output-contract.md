# 2026-07-05-hotfix-visible-output-contract — Restore production build (undefined agent prompt constant)

## Release ID

`2026-07-05-hotfix-visible-output-contract`

## Status

`candidate`

## Plain-English Summary

The production container build (`npm run build`) is failing on `main` with `Type error: Cannot find name 'VISIBLE_MODEL_OUTPUT_CONTRACT_PROMPT'` at `src/app/api/chat/agent/route.ts:1231`. PR #4468 added that constant to the agent system-prompt composition but never defined or imported it, so every ACA deploy from `main` now fails at the image-build step. This hotfix wires the reference to the existing, defined constant `VISIBLE_ANSWER_CONTRACT_PROMPT` (the visible-answer/output self-scrub contract already used in the answer path), restoring the build and preserving the evident intent of adding an output-contract block to the agent prompt.

## Layer Impact

- `global-control-lane`: `src/app/api/chat/agent/route.ts` — the canonical agent chat system prompt. Adds the already-established visible-answer output contract block to the agent's system prompt (a safe, self-scrub instruction block). Restores the ability to build/deploy `main`.

## Client Applicability

- All clients: Yes — unblocks all deploys; the prompt block applies to all canonical agent chat turns.
- Specific clients: N/A
- Internal only: No
- Public/demo only: No
- Feature flag: None.

## Changes Included

- `src/app/api/chat/agent/route.ts`: import `VISIBLE_ANSWER_CONTRACT_PROMPT` from `@/lib/agent/visible-answer-contract`; replace the undefined `VISIBLE_MODEL_OUTPUT_CONTRACT_PROMPT` reference with it.

## QA / Validation

- Typecheck: `npx tsc --noEmit -p tsconfig.json` on a branch off current `main` → **PASS** (0 errors; the same command reproduced the failure before the fix via the build error).
- Build-break reproduction: **CONFIRMED** — `gh run view` on the failed `ACA main deploy` (run 28754627053) shows `Cannot find name 'VISIBLE_MODEL_OUTPUT_CONTRACT_PROMPT'` at the `npm run build` step.
- Runtime behavior of the prompt block: **NOT-RUN** (block is the existing visible-answer contract already validated in the answer path; no new behavior authored here).

## Known Gaps

- This preserves #4468's apparent intent by mapping to the existing constant. If #4468's author intended a distinct, separately-authored "model output contract" prompt, they should introduce it as a defined export and swap the reference; this hotfix is a build-unblock, not a new prompt authored from scratch.
- No test added; correctness is a compile-time symbol resolution restored + typecheck pass.

## Rollout Plan

Merge to `main` → ACA main deploy builds from the merged SHA → deploy to `ca-abarva-web-lab-eastus` → shift 100% traffic → verify health. This unblocks the previously-failed deploys (including the loaded-context retrieval follow-up #4467).

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy.
- Shared runtime mutators: none.
- Approved image digest: set at deploy time from merged SHA.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` serves the new revision at 100% traffic.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: Yes — successful build + healthy revision serving `app.abarva.ai`.

## Rollback Plan

Revert this one-line-plus-import commit; but note that reverting re-breaks the build, so the correct rollback is forward-fix (define the intended constant). Alternatively shift ACA traffic to the last healthy revision (pre-#4468).

## Audit Evidence

- Failed deploy run: `ACA main deploy` 28754627053 (build step error).
- PR URL: (to be filled on open).
- Typecheck output: 0 errors.
