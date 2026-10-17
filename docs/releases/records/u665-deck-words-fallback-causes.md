# u665 — Name why each reference-deck slide fell back to placeholder words

## Release ID

`2026-10-17-moves-deck-words-fallback-causes`

## Status

`candidate`

## Plain-English Summary

The live walk's investment deck has been scoring near zero, with 7 to 10 of its 22 slides showing placeholder words. Only the first failing rule was reported, and a repair call that timed out failed silently, so the real causes could not be seen. This release makes every fallback explain itself, by name only and never with model text:

- The deck preview returns `X-AbarVa-Deck-Fallback-Causes`, for example `2:title_format,9:parse_failed`. It lists every fallback slide and why: the word rule that rejected it, or the call that produced no words (`parse_failed`, `model_error`, `preflight_denied`).
- The words step logs one `[reference-deck-words-repair]` line per deck. It holds each slide's first rule, how many repairs succeeded, which slides were still rejected and by which rule, and any repair call that failed (with its error name, such as a timeout).
- The live walk records the causes in `deck-fidelity.json` and in its failure line.

Nothing about the words, the rules or the slides changes. The next post-deploy walk will show which rules and calls cause the fallbacks, so the fix can be targeted.

## Layer Impact

Release lane: `global-control-lane`, behind the existing `moves_reference_deck_v1` flag.

- **Layer 4, products (reference-deck preview route and words step):** one response header and one log line. No schema, data or rendered-output change.

## Client Applicability

- **All clients:** yes, where the reference deck preview is enabled.
- **Specific clients:** none.
- **Internal only:** the header and log are diagnostics.
- **Public/demo only:** no.
- **Feature flag:** `moves_reference_deck_v1` (existing).

## Changes Included

- `src/lib/deliverables/orchestrator/reference-deck-words.ts`: `fallbackCauses`, built in slide order; the repair diagnostics log.
- `src/app/api/v1/programs/[programId]/decks/[edition]/preview/route.ts`: the `X-AbarVa-Deck-Fallback-Causes` header.
- `tests/e2e/moves-step-pages-live-walk.spec.ts`: records the causes, and checks there is one cause per fallback slide.
- Tests in `reference-deck-words.test.ts` and the preview route suite.

## QA / Validation

- Words and deck route suites: 62 / 62 pass.
- Mutation check: 7 hand mutants, all killed:
  - a parse failure mislabelled;
  - a rule cause dropped;
  - whole-deck causes left empty;
  - a call failure not logged;
  - repairs miscounted;
  - the header missing;
  - the cause order, now built in slide order by construction, so it cannot drift.
- The log was checked to carry no model prose. `npm run typecheck` clean; ESLint clean.

## Rollout Plan

Ships in the next repo-owned ACA main deploy; the post-deploy walk then records the causes.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: set by the main deploy.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: the post-deploy Moves walk shows `fallbackCauses` in `deck-fidelity.json`.

## Rollback Plan

Revert the squash commit and redeploy.

## Known Gaps

- **This names the causes; it does not fix them.** The fix follows from the first walk that records them.

## Audit Evidence

- PR URL and CI run.
- The first post-deploy walk's `deck-fidelity.json`.
