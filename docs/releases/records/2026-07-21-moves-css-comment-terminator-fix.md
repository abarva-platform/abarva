# 2026-07-21-moves-css-comment-terminator-fix — fix broken deploy pipeline (CSS comment self-closes early)

## Release ID

`2026-07-21-moves-css-comment-terminator-fix`

## Status

`candidate` — PR open, not yet merged.

## Plain-English Summary

`main`'s deploy pipeline was broken, blocking every deploy for every team — including
unrelated, already-merged Source work waiting to go live. Root cause:
`StrategicMoves.module.css` had a block comment (added in MOVES-UI-004, PR #5209) whose own
explanatory text contained the literal character sequence `*/` mid-sentence
(`.p0*/.scaffold*/.origin*`). CSS block comments aren't nesting-aware — the parser closes the
comment at the _first_ `*/` it finds, so the comment actually ended mid-sentence, and the rest
of the sentence (`.scaffold*/.origin* selector above...`) was parsed as real CSS, which failed
with `Unexpected token Delim('*')`. Fixed by rewording the sentence to avoid embedding a
literal `*/` sequence — no CSS rule, class name, or visual behavior changed.

## Layer Impact

- `global-control-lane`: one comment in a shared stylesheet. No selectors, rules, or class
  names changed — purely a comment-text edit.

## Client Applicability

- All clients: yes, indirectly — unblocks the deploy pipeline for every team, not just Moves.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/strategic-moves/StrategicMoves.module.css`: reworded one comment sentence
  to remove the accidental `*/` sequence. No other changes.
- This release record.

## QA / Validation

- `pass` — validated directly with `lightningcss` (the same CSS parser Turbopack/Next.js uses
  under the hood) via a one-off Node script: the original file fails with the exact reported
  error (`Unexpected token Delim('*')`); the fixed file parses clean (`PARSE OK`).
- `not-run` — full `npm run build` was not run to completion in this worktree (Turbopack
  rejects a symlinked `node_modules` pointing outside the worktree with an unrelated internal
  error, and a fresh `npm install` was skipped as unnecessary for a comment-only CSS change
  already validated against the real parser that reported the original failure). The next
  `aca-main-deploy` run on this change is the full, authoritative build-level confirmation.

## Rollout Plan

Merge to `main` via the repo-owned ACA main-deploy workflow. Comment-only change — no
migration, no flag, no visual/behavioral difference.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: to be recorded after merge and deploy.
- ACA runtime invariant: to be verified after merge and deploy — this is also the real
  end-to-end confirmation that the deploy pipeline itself is unblocked.
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: no — comment-only change, nothing to observe at runtime.

## Rollback Plan

Revert the merge commit. Reverting restores the broken comment and re-blocks the deploy
pipeline — not safe to do without also reverting whatever caused the reintroduction.

## Audit Evidence

- PR: to be added once opened.
- Parser validation: see QA / Validation (script output recorded in this session's
  transcript, not committed as a file).
- The next successful `aca-main-deploy` run after merge is itself the authoritative proof the
  pipeline is unblocked.

## Known Gaps

None known — this is a narrow, mechanical comment-text fix with no behavior change.
