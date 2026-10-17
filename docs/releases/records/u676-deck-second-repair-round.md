# u676 — A second, time-budgeted repair round for reference-deck words

## Release ID

`2026-10-17-moves-deck-second-repair-round`

## Status

`candidate`

## Plain-English Summary

When a drafted slide breaks a word rule, the words step asks the model once to repair it. If that repair still breaks a rule, the slide falls back to placeholder words. The first walk with fallback causes (u665) shows the validation deck's remaining fallbacks are genuine claim catches the single repair missed:
- an unconfirmed baseline described as measured;
- owners described as agreed;
- public citations described as covering every claim.

Slides the first repair could not fix now get one more attempt. That attempt says the slide was already retried and still broke the rule, and asks for a plainer, more conservative rewrite from the evidence flags alone. It runs only while the request is under 75 seconds, so with its 15-second call limit the words still finish well inside the preview route's 120-second limit. Every repaired slide is checked by the same rules, so nothing is loosened. The repair log records the second round.

## Layer Impact

Release lane: `global-control-lane`, behind the existing `moves_reference_deck_v1` flag.

- **Layer 4, products (reference-deck words):** one more audited model call, only for slides still rejected and only inside the time budget. No schema, data or route change.

## Client Applicability

- **All clients:** yes, where the reference deck preview is enabled.
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** `moves_reference_deck_v1` (existing).

## Changes Included

- `src/lib/deliverables/orchestrator/reference-deck-words.ts`:
  - the repair step becomes one reusable round;
  - a second round runs within `SECOND_REPAIR_BUDGET_MS`;
  - the repair log adds `secondRound`;
  - egress metadata adds `repairRound`.
- Tests in `reference-deck-words.test.ts`:
  - a second round fixes what the first could not, and marks itself;
  - no second round past the time budget;
  - the existing tests now expect the extra call where a repair persists.

## QA / Validation

- Orchestrator and deck route suites: pass, 1,183 / 1,183. `npm run typecheck`: pass. ESLint: pass.
- Mutation check: 3 hand mutants, all killed (no second round; the time budget ignored; the second-round hint dropped).

## Rollout Plan

Ships in the next repo-owned ACA main deploy after the deck chain.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: set by the main deploy.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: the post-deploy walk's fallback causes and the repair log's `secondRound`.

## Rollback Plan

Revert the squash commit and redeploy.

## Known Gaps

- **A slide the second round cannot fix still falls back.** The cause header names it.

## Audit Evidence

- PR URL and CI run.
