# 2026-07-18-moves-docquality8-real-quality-score — Moves: Generated Deliverables Get a Real Quality Score

## Release ID

`2026-07-18-moves-docquality8-real-quality-score`

## Status

`candidate`

## Plain-English Summary

`MOVES-DOCQUALITY-8` from the Moves UX backlog: generated documents should hold to a real "concise, evidence-bound, phase-appropriate, not hallucinated" bar, not just look plausible. Investigation found the `qualityScore` and `unsupportedClaimsCount` numbers already shown in the File Cabinet (`FileCabinetPanel.tsx`) were **not measurements** — every Moves-generated artifact was persisted with `qualityScore: pass ? 96 : null` and `unsupportedClaimsCount: 0`, hardcoded regardless of what the document actually contained.

There is a real, deterministic check in this codebase already — `meetsGoldenBar()` in `golden-bar.ts`, run synchronously on every Moves artifact generation, checking rendered visuals, `[DATA GAP]` markers, required exhibits, forbidden internal language, and a minimum word count for a few artifact types. This release builds on it rather than replacing it:

1. **A concision ceiling.** The generation prompt already states a target word range per artifact (e.g. "charter: 700-1,200 words") but nothing enforced the upper bound. `maximumWordCount` is now derived from that same range and checked for every artifact type (previously only 3 of ~9 types got any word-count check at all, and only a floor). Going over the ceiling is **informational only** — it does not fail the golden bar, so it cannot newly block generation on a live Move.
2. **A real unsupported-claims signal.** `findUnsupportedQuantifiedClaims()` flags sentences with a dollar or percentage figure that carry none of the evidence-qualifying language the prompt itself already asks the model to use ("evidence supports", "remains an assumption until", "cannot be finalized until", etc.) — checking whether the model followed its own instructions, not inventing a new taxonomy.
3. **A real `qualityScore`.** Both `persist-move-generated-artifact.ts` write sites (the HTML artifact and its editable Word-equivalent) now read `result.goldenBar.qualityScore` / `.unsupportedClaimSignals.length` — deterministic values built from the checks above — instead of the fixed 96/null.

Critically, **`pass` — the value that actually blocks a generation as `blocked_quality` — is unchanged.** The two new signals (over-ceiling, unsupported claims) only affect the informational `qualityScore`, never `pass`. This was a deliberate scope decision to avoid introducing a new failure mode on the live Meridian Move's in-flight generation pipeline.

## Layer Impact

- `global-control-lane`: `golden-bar.ts`, `strategic-moves-artifact-standard.ts`, and `persist-move-generated-artifact.ts` sit in the shared Moves artifact generation path used by every tenant.

## Client Applicability

- All clients: yes.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/deliverables/golden-bar.ts`:
  - `GoldenBarOptions.maximumWordCount` (new, optional) — informational only, does not affect `pass`.
  - `GoldenBarResult.overMaximumWordCount`, `.unsupportedClaimSignals`, `.qualityScore` (new fields).
  - `findUnsupportedQuantifiedClaims()` (new, exported) — flags $/％ sentences with no nearby evidence-qualifying language from the existing prompt vocabulary.
  - `computeQualityScore()` (new, internal) — deterministic 0-100 score: base 92 (pass) or 55 (fail), minus up to 24 points for unsupported claims, minus 6 for running over the concision ceiling.
- `src/lib/deliverables/strategic-moves-artifact-standard.ts`: `maximumWordCountForArtifact()` (new, exported) parses the existing `targetWords` range's upper bound; `premiumGoldenBarOptionsForArtifact()` now includes `maximumWordCount` for every artifact type (previously only 3 types got any word-count option at all).
- `src/lib/deliverables/persist-move-generated-artifact.ts`: both `saveMoveArtifact()` calls (HTML + editable docx) now pass `qualityScore: result.goldenBar.qualityScore` and `unsupportedClaimsCount: result.goldenBar.unsupportedClaimSignals.length` instead of the fixed `pass ? 96 : null` / `0`.
- Tests updated/added: `golden-bar.test.ts` (5 new cases covering the ceiling, the claim heuristic, and the score, plus a dedicated `findUnsupportedQuantifiedClaims` suite), `persist-move-generated-artifact.test.ts`, `programs-generate-route-azure-read.test.ts` (fixtures extended with the 3 new `GoldenBarResult` fields; one assertion updated from the old fixed `qualityScore: 96` to the real value now flowing through the mocked golden-bar result).

## QA / Validation

- Pass: `npx eslint` on all touched source and test files.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`
- Pass: `npx jest src/lib/deliverables/__tests__/golden-bar.test.ts src/lib/deliverables/__tests__/persist-move-generated-artifact.test.ts "src/app/api/v1/programs/[programId]/generate/__tests__/route.test.ts" src/__tests__/integration/programs/programs-generate-route-azure-read.test.ts src/scripts/__tests__/process-deliverable-queue.test.ts src/lib/agent/tools/__tests__/draftArtifact.test.ts` — 40/40. The integration-route test caught a real runtime break (a loosely-typed `goldenBar` mock fixture missing the new fields, which TypeScript didn't flag but Jest did with a `TypeError: Cannot read properties of undefined`) — fixed by extending that fixture, not by weakening the new code.
- Confirmed pre-existing, unrelated failures on clean `origin/main` (verified via `git stash`): `golden-regression.test.ts` (2 snapshot failures) and the Source/RFP orchestrator's `renderers.test.ts`/`persistence.test.ts`/`orchestrated-business-case.test.ts` (a "SkyHarbor Air" vs "Airline Demo" naming drift) — none touch the files changed here.
- Not run: live signed-in browser proof (no valid local Clerk session in this environment); no browser-observable UI changed by this release (it changes what number gets computed, not how `FileCabinetPanel` renders it).

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main deploy workflow. No data migration, no flag, no worker job. No change to `pass`/blocking behavior on live generation — only to the informational quality-score/claims-count values persisted alongside each artifact.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none.
- Approved image digest: produced by the ACA main deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — generate a Moves artifact on a real Move post-deploy and confirm the File Cabinet shows a quality score/unsupported-claims count that varies with actual content (not always 96/0), and confirm generation still succeeds normally (no new `blocked_quality` regressions).

## Rollback Plan

Revert this PR and redeploy through the ACA main deploy workflow. No data or schema changes to unwind; existing `move_artifacts` rows with the old fixed 96/0 values are unaffected (this only changes what new writes persist).

## Audit Evidence

- This PR's diff.
- `golden-bar.test.ts`, `persist-move-generated-artifact.test.ts`, and the 4 integration/route test suites, full pass (40/40).
- ACA main deploy run after merge.
- Post-deploy live signed-in proof (pending).

## Known Gaps

- **`review-regeneration.ts` (the review-feedback regeneration path) still hardcodes its own `qualityScore`/`unsupportedClaimsCount`.** Deliberately left untouched: that file's `body` is a markdown *review-application plan* tracking client feedback items, not the regenerated deliverable's actual content — applying the quantified-claim heuristic to it would flag the wrong text. Fixing it needs the golden bar to run on the actual regenerated HTML in that flow, which is a separate, larger change outside this release's scope.
- **The concision ceiling only checks total word count**, not per-section density or repeated boilerplate — a document could still pad with filler and stay under the ceiling. A stronger check (e.g. flagging repeated stock phrases) is future work.
- **`unsupportedClaimSignals` is a heuristic, not a citation audit** — it flags quantified claims lacking nearby evidence language; it cannot verify that a cited figure is actually correct or traceable to the underlying evidence. Deeper citation-accuracy checking is a larger, separate project.
- No maximum on `unsupportedClaimSignals`' contribution beyond the existing 8-claim cap in `computeQualityScore` — a document with many more flagged sentences won't score below the same floor a document with exactly 8 would.
