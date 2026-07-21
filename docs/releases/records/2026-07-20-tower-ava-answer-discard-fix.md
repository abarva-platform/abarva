# 2026-07-20-tower-ava-answer-discard-fix — Stop discarding well-formed Tower aVa answers

## Release ID

`2026-07-20-tower-ava-answer-discard-fix`

## Status

`candidate`

## Plain-English Summary

Anand ran a 25-question production eval of Tower aVa across three tenants (FS Demo, Healthcare Demo/Meridian, Airline Demo) and found the chat surface was table-first, never producing chart blocks even on explicit 2x2/trend/heatmap asks. Tracing the actual evidence bundle (not just the summary) found the real cause was narrower and more serious than "no chart renderer": `answerCioTowerQuestion()` in `src/lib/cio-tower/answer.ts` was discarding the *entire* well-formed model answer — including populated tables with real chart-ready numeric data, a correctly filled `visualContract` (axes/annotations/recommended visual type), and a properly reasoned narrative — and replacing it with a generic hardcoded template, whenever any one of three narrow conditions fired: (1) a table had more than 5 rows or 4 columns, regardless of whether the question legitimately needed more (e.g. "rank these 6 tools"); (2) a bare-keyword regex (`unsupported_outcome_proof_language`) matched words like "ROI", "savings", "realized value" anywhere in the text with no negation/hedging awareness — so the model correctly saying "Realized-value language is blocked until finance attestation clears" or "Measured outcome evidence is absent" got flagged as if it had made an unsupported claim; (3) the response hit the 1800-token output cap mid-JSON, producing invalid JSON the parser couldn't recover from. 9 of 25 questions in the eval hit one of these three, all having their real answer thrown away for a generic fallback.

This release fixes (1) and (3) directly, and removes (2) entirely per explicit product direction (Anand: "we need to remove that finance attestation language, not needed" — the underlying `valueClaimPolicy`/`realizedValueLanguageAllowed` data-layer gates that actually control what value claims can be made are untouched; only the narrow text-scanning keyword blocklist is removed).

## Layer Impact

- `global-control-lane`: `src/lib/cio-tower/answer.ts` — Tower aVa's answer-generation and validation pipeline, used by every tenant's Tower chat surface. No schema, route, or config changes.

## Client Applicability

- All clients: yes — this is the shared Tower aVa answer pipeline, used by every tenant.
- Feature flag: none.

## Changes Included

- `src/lib/cio-tower/answer.ts`:
  - `MAX_TOKENS`: 1800 → 5000, so a response asking for a 2x2 + 2 tables + 4 tabs + `visualContract` in one shot doesn't truncate mid-JSON.
  - `parseVisibleAnswerContract()`: table-shape validation changed from hard-reject (`throw` on >4 columns or >5 rows, discarding the whole answer) to cap-and-truncate (`MAX_TABLE_COLUMNS = 6`, `MAX_TABLE_ROWS = 8`; tables over the cap are truncated, not the trigger for discarding the entire response). Genuinely malformed rows (wrong width, empty cells) still hard-reject — that's a real structural defect, not a size issue.
  - `validateVisibleAnswer()`: removed the `unsupported_outcome_proof_language` check entirely (bare-keyword regex on "ROI"/"savings"/"achieved"/"realized value"/"measured value"/"measured outcome"/"proven value"/"delivered value"/"value captured", with no negation/hedging awareness). All other checks (raw internal IDs, visible scaffold labels, internal data-plane language, hidden chart-JSON payloads, inline markdown tables, stray "Atlas" branding) are unchanged.
- `src/lib/cio-tower/__tests__/answer.test.ts`: updated to match — the two table-shape tests now assert truncation instead of rejection (plus a new test confirming a well-formed 6-row answer, the exact FS03 regression case, survives untouched); the outcome-language test now asserts the previously-blocked phrases are allowed, with the eval finding cited inline as the reason.

## QA / Validation

- `npx eslint` on both touched files (run with fully-qualified paths from inside the worktree, confirmed via `pwd`) — clean.
- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false --incremental false` — no errors on either file.
- `npx jest src/lib/cio-tower` — 35 passed / 35 total (was 34/34 on a `git stash`-verified clean baseline before the change; net +1 is real added coverage — the FS03-shaped regression test — not a dropped assertion).
- Root-caused against the actual live eval evidence bundle (`/Users/anand/Projects/nexus/proof/tower-ava-25q-visual-export-20260720/`), not just the summary: read `results.json` directly, confirmed the totals (25/10/15/0/0, avg 9.32, 0 charts rendered) matched the report, and pulled the raw vs. served model output for 3 of the 9 `validationPassed: false` cases (FS01, MH01, AIR03) to confirm the discard-and-replace mechanism and exact trigger conditions before writing any fix.
- Live signed-in re-verification against the same 3 example questions (or a re-run of the 25-question eval) not yet done — see Known Gaps.

## Rollout Plan

Merge to `main` via PR (squash merge). The repo-owned `.github/workflows/aca-main-deploy.yml` workflow auto-deploys on merge. No migration, no feature flag, no env var change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (auto-triggers on merge to `main`).
- Shared runtime mutators: none.
- ACA runtime invariant: to be confirmed post-deploy, same pattern as prior releases today.
- Live signed-in proof required: yes — re-run a sample of the previously-failing questions (a 6-item ranking ask, a "before finance attestation" hedged sentence, a visual-heavy 2x2/heatmap ask) against a signed-in Tower session post-deploy.

## Rollback Plan

Revert the merge commit (logic-only change, no migration or data mutation) and let `aca-main-deploy` redeploy from the reverted `main`.

## Audit Evidence

- Source eval bundle (not modified by this change, referenced as root-cause evidence): `/Users/anand/Projects/nexus/proof/tower-ava-25q-visual-export-20260720/results.json`, `report.html`, `report.pdf`.
- PR: (added once opened)
- Isolated-worktree test run: `npx jest src/lib/cio-tower` (35 passed / 35 total, verified against a clean-`origin/main` baseline of 34/34).

## Known Gaps

- This fix addresses the answer-discard problem (why good answers were being thrown away); it does **not** address the original, separate finding that Tower aVa never renders governed chart blocks (0/25 in the eval) even though `visualContract` (axes, annotations, recommended visual type) is already being correctly filled in by the model in most cases. That's a distinct, larger piece of work — wiring `visualContract` output through to an actual governed chart-rendering step — not touched here.
- Live signed-in re-verification of the fix (not just the code diff and unit tests) is queued as the immediate next step after this PR deploys — ideally a re-run of the same 25-question eval to get a clean before/after comparison on `validationPassed`/fallback rate.
