# 2026-07-19-intelligence-ava-executive-narrative-prompt — aVa Intelligence answer voice: executive narrative over mechanical brief

## Release ID

`2026-07-19-intelligence-ava-executive-narrative-prompt`

## Status

`candidate`

## Plain-English Summary

Rewrites the two live system prompts that drive aVa's answers on the Intelligence "Ask" surface (`/intelligence`), plus the prompt that generates the three follow-up-question chips shown under an answer. The prior prompt used a mechanical "Pyramid Brief" (Answer/Proof/Move) structure that read as templated AI output rather than a senior advisor's narrative. The new prompt keeps the same underlying discipline — lead with a recommendation, ground it in tenant evidence before industry pattern, end with a next decision — but expresses it as a connected business narrative (Answer → Tension → Evidence → Implication → Move) that is explicitly told not to surface as visible labels. It adds an explicit "client-specific differentiation" rule (no answer should be copyable unchanged into another client's chat) and an evidence-provenance boundary (loaded fact vs. stakeholder signal vs. inference vs. pattern vs. missing evidence). Default answer length tightens to under 160 words unless the user asks for a deep dive. Follow-up-chip generation now omits chips for simple factual/navigational questions instead of always forcing exactly three, and for advisory questions frames the three as testing different executive decision paths (value/funding, risk/evidence, execution/ownership) rather than generic "drill deeper or pivot."

No behavior outside prompt text changed: no new imports, no signature changes, no changes to tenant-isolation enforcement, evidence-priority ordering, arithmetic/ranking guard, or lane-discipline handoff logic — those were verified byte-identical to the pre-existing (already-shipped) versions and are treated as load-bearing, not voice.

## Layer Impact

- `global-control-lane`: system prompt text in `src/lib/intelligence/ask/synthesizer.ts` (`SYSTEM_PROMPT`, `CONCISE_SYSTEM_PROMPT`) and the follow-up-generation prompt in `src/lib/intelligence/ask/followups.ts` (`generateFollowups`). No schema, route, or config changes.

## Client Applicability

- All clients: yes — every tenant's Intelligence Ask answers and follow-up chips use these prompts; no feature flag gates this path.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none (always-on prompt text).

## Changes Included

- `src/lib/intelligence/ask/synthesizer.ts` — `SYSTEM_PROMPT` and `CONCISE_SYSTEM_PROMPT` rewritten from a mechanical Pyramid Brief (Answer/Proof/Move) to an Executive Narrative voice (Answer/Tension/Evidence/Implication/Move, not surfaced as labels), with an added "client-specific differentiation" rule, an evidence-provenance boundary, a tightened default word budget (<160 words unless a deep dive is requested), and a direct instruction to generate chart-ready Markdown tables inline rather than relying on the product to reconstruct them. Existing tenant-isolation, evidence-priority, partial-evidence-wording, arithmetic-guard, and lane-discipline sections preserved verbatim.
- `src/lib/intelligence/ask/followups.ts` — `generateFollowups`'s prompt updated to (a) omit follow-up chips for simple factual/navigational questions instead of forcing exactly three, and (b) for advisory/strategic questions, frame the three chips as testing distinct executive decision paths (value/funding, risk/readiness/evidence, execution/ownership/sequencing). `buildDeterministicConciseFollowups`, `normalizeGeneratedFollowup`, and the grounding-sources threading were untouched.

## QA / Validation

- `npx eslint src/lib/intelligence/ask/synthesizer.ts src/lib/intelligence/ask/followups.ts` — clean, exit 0.
- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false --incremental false` — no errors attributed to either touched file.
- `npx jest src/lib/intelligence/ask` run in an isolated `git worktree` off `origin/main` (post-edit): 11 failed / 145 passed / 3 suites failed. Identical result confirmed on the same worktree with the edit `git stash`-ed (clean `origin/main` baseline): 11 failed / 145 passed / 3 suites failed, same failing test names (`tenant-identity-pin.test.ts` display-name drift, `ask-guardrails.test.ts`'s `isBlockingIntelligenceRepairEnabled` check) — both pre-existing and unrelated to this change. Zero regressions.
- `src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts`'s literal substring assertions on `SYSTEM_PROMPT`/`CONCISE_SYSTEM_PROMPT` (aVa identity line, "industrial holding companies", "shared services", "airlines", "industrial/shared services", "airline operations") all pass against the rewritten text.
- Live signed-in browser proof of the new answer voice not yet captured — see Known Gaps.

## Rollout Plan

Merge to `main` via PR (squash merge, no direct push). The repo-owned `.github/workflows/aca-main-deploy.yml` workflow builds and deploys automatically on merge to `main` per the canonical ACA release path — no manual `az` commands run by this change. No migration, no feature flag, no env var change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (auto-triggers on merge to `main`).
- Shared runtime mutators: none — this PR contains no `az containerapp` / `az acr` commands.
- Approved image digest: assigned by the deploy workflow at build time; not set by this PR.
- ACA runtime invariant: to be confirmed post-deploy (template image, 100%-traffic revision image, worker job images all match the new digest) before claiming live.
- Worker image invariant: unaffected — no worker code touched.
- Feature/env flag update path: n/a — no flag introduced or changed.
- Live signed-in proof required: yes — a real `/intelligence` Ask query on a signed-in session, post-deploy, to confirm the narrative voice renders correctly and no regression in tenant isolation.

## Rollback Plan

Revert the merge commit (prompt-text-only change, no migration or data mutation) and let the same `aca-main-deploy` workflow redeploy from the reverted `main`. No manual Azure intervention needed.

## Audit Evidence

- PR: (added once opened)
- Isolated-worktree test run: `npx jest src/lib/intelligence/ask` (11 failed / 145 passed / 3 suites failed, byte-identical to clean-`origin/main` baseline).
- Lint: `npx eslint src/lib/intelligence/ask/synthesizer.ts src/lib/intelligence/ask/followups.ts` (clean).

## Known Gaps

- Live signed-in browser proof of the new answer voice on `/intelligence` not yet captured — to be done post-deploy.
- The token/word-budget constants in `advisor-composer.ts` (`chooseAdvisorWordCap`, fallback 600) and `chooseSynthesisTokenBudget` were not changed — they set model-side ceilings independent of the prompt's stated word target and were already loosely coupled to the prompt's stated length before this change. Not addressed here; flagged as a possible follow-on tightening, not a regression.
