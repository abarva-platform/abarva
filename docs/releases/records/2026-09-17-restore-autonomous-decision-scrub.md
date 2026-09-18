# 2026-09-17-restore-autonomous-decision-scrub - A Comment Is Not A Control

## Release ID

`2026-09-17-restore-autonomous-decision-scrub`

## Status

`candidate`

## Plain-English Summary

The universal agent route scrubs autonomous-decision language out of every agent text delta before it reaches a user, so an answer cannot claim it decided, executed or approved something on its own. That call was deleted on 7 July 2026 by a large refactor whose stated purpose was unrelated.

The repository has a control catalog precisely to stop this: `docs/security/ai-surface-control-catalog.json` declares a `human-approval-gate` control for that route, and `scripts/audit/ai-surface-control-catalog.mjs` enforces it in CI by requiring the control's name to appear in the file. Eleven days later, on 18 July, a comment containing that name was added to the file. The check matched the comment with `source.includes(token)` and went green. The control has not run since 7 July.

This restores the call, removes the placeholder comment so the code itself is the evidence, and hardens the checker so a comment can never satisfy a control requirement again.

## Layer Impact

`global-control-lane`. One API route's output sink, and the CI checker that guards the AI surface control catalog. No schema, migration, adapter, projection or UI change.

## Client Applicability

- All clients: every surface served by the universal agent route.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/api/chat/agent/route.ts`: `sanitizeAutonomousDecisionLanguage` is applied again in the `writer.write` sink — the single point every agent text delta and tool-side write passes through — and in the restricted-financial tail flush. The placeholder comment is removed and the symbol is imported and called.
- `scripts/audit/ai-surface-control-catalog.mjs`: evidence tokens are matched against source with comments blanked out. String literals are preserved, because several controls are legitimately evidenced by prompt text or a rendered label. A token found only in a comment now fails with a message that says so, rather than passing.

## QA / Validation

- AI surface control catalog checker: **pass**, 18 surfaces, with the hardened matcher.
- Mutation check: reverting the route to the comment-only state makes the checker **fail** with `evidence token "sanitizeAutonomousDecisionLanguage" appears only in a comment` — so the gate now detects the exact substitution that defeated it.
- All 18 catalog surfaces pass under the stricter matcher, so no other declared control is currently evidenced only by a comment.
- `src/lib/ai-liability` and `src/app/api/chat` scopes: 9 failing of 114 both before and after this change on a clean baseline — **no change**, none related to this control.
- Full-project `tsc --noEmit`: **pass**. Scoped ESLint: **pass**.
- **Correction, 18 Sep 2026:** the local typecheck quoted above did not run. `npx tsc --noEmit` on the authoring machine exits 134 — a V8 out-of-memory crash that emits no diagnostics — and its output was filtered for `error TS`, so the crash read as clean. The authoritative typecheck for this change is the CI job on its pull request, which passed. Re-running locally as `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit` exits 0. The ESLint and test results above were produced by commands that completed and are unaffected.
- Signed-in acceptance: **not run** — blocked, host machine locked.

## Rollout Plan

Squash-merge after required checks pass; the repo-owned ACA main deploy workflow publishes the change. No migration and no data build.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: To be recorded after deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Ask any agent surface a question whose answer would otherwise claim an autonomous action, and confirm the scrubbed wording is what renders.

## Rollback Plan

Revert through a new PR and the repo-owned deploy workflow. Nothing persisted changes.

## Audit Evidence

PR link, checker output, and the mutation result to be added when available.

## Known Gaps

- The scrub is applied per streamed chunk, as it was before July. A phrase split across chunk boundaries can still evade it. The restricted-financial path solved the same problem with a buffering streamer; the same treatment for this scrub is a follow-up, not part of restoring what was lost.
- The catalog enforces that a named token appears in executable code. It cannot tell that the token is actually reached at runtime — a call behind a disabled branch would still pass. Narrowing that gap needs a behavioral test per control, not a source scan.
- This was found by auditing one commit, not by a gate. The commit is implicated in several other control removals already fixed separately.
