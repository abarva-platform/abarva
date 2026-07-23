# 2026-07-23-home-knowledge-v4-offline-replay — offline replay validation for Home V4 candidates

## Release ID

`2026-07-23-home-knowledge-v4-offline-replay`

## Status

`candidate`

## Plain-English Summary

Adds an offline replay mode so a Home V4 validator or schema change can be proven against
already-generated candidate JSON **without making a single Claude call**, and fixes three
validator defects that replay immediately exposed.

Why it's needed: until now the only way to test a validator change was to pay for another
full tenant generation (~46 model calls, 45–60 minutes). That made the paid model call the
integration test. Two Meridian runs were consumed discovering problems that stored output
could have revealed for free. Replay is the missing control point.

```
npm run home:knowledge-v4:replay -- <candidate-or-bundle-path> --out-dir <dir>
```

The path may be a single `candidate-home-knowledge-v4.json`, a tenant directory, or a whole
review-bundle root (it discovers every candidate underneath). It re-runs every validator,
diffs the result against the validation stored inside the candidate, groups findings by type,
and labels each group by whether it survived the validator change — which is what separates a
validator defect from a Claude output defect. It re-renders `review.html` per tenant, prints a
greppable `HOME_V4_REPLAY_VERDICT`, and exits non-zero when any candidate is not review-ready.

### What replay found on its first run

Replayed against the five stored candidates from the 2026-07-23T17:34Z bundle
(prompt contract `...visual-enum-v2`), runtime **0.12 seconds**:

1. **Reported finding counts were truncated, silently.** `validateClosedEnums` capped its list
   at 80 with no marker, so a run reporting exactly 80 findings was *at the cap*, not at 80.
   Meridian's true count was **629**. Findings are now capped explicitly and carry a
   `findings_truncated` marker with the real total; caps raised to a non-binding 500.

2. **Every visual and classification was validated twice.** `validateClosedEnums` walked the
   whole candidate including `candidate.passes.*`, which is the raw per-call envelope whose
   `client_visible` is *also* copied into `story_architect`/`dimensions`/`use_cases`/
   `relationships`/`evidence`. Duplicates were not deduped (paths differ) and they consumed
   the entire 80-finding cap, hiding the assembled-payload findings that actually matter.
   Now walks the assembled client-visible payload only.

3. **Planning exhibits were judged by the rendered-visual contract.** `signature_visuals` come
   from the Story Architect pass, which runs before any data pass. Requiring `data_points` and
   `encoding` there asks the model to invent data it has not been given. Planning exhibits now
   carry intent only (`visual_type`, `title`, `executive_question`, `classification`,
   `empty_state`); the prompt and the validator were changed together so they agree.

4. **Containing a visual was treated as being one** — the same defect class as #5525, one level
   up. A relationship projection is a narrative object carrying a `graph_display_contract`
   child; `looksVisual` fired on the wrapper and demanded `visual_type`/`data_points`/
   `encoding` of prose, one finding per missing field per projection, while the contract child
   it holds was already well-formed.

Net effect on the same unchanged candidate JSON — Meridian `validateClosedEnums`:
**629 → 137 findings (78% were validator artifacts).**

### What the residual findings actually are

The remaining findings are real Claude output defects, but they are **two systematic
behaviours, not ~142 independent problems**:

- **`empty_state` omitted** on ~57 of Meridian's visuals — despite an explicit prompt line
  ("Do not omit empty_state even when data_points are present"). Prose instruction is not
  holding; this needs enforcement in the forced-tool-use schema.
- **`visual_type: relationship_graph` declared on a `primary_visual` that then carries chart
  fields** (5 dimensions) — the model picks the graph type and fills a chart contract.

Both are schema-enforceable. Neither is fixed here, because neither can be proven offline —
they change generation behaviour and must be validated by a **three-dimension canary**, not a
full 38-dimension run.

### Answering the question that triggered this work

PR #5525 (relationship-graph field contract) did **not** reduce the Meridian failure count.
The "80 findings" it was measured against was a truncated cap reading, and #5525 is orthogonal
to the dominant categories. That is now demonstrable in 0.12s instead of a 60-minute rerun.

## Layer Impact

- `global-control-lane`: offline validation mode + validator correctness fixes in one operator
  script, plus one npm script. No schema, no runtime read-path change, no writes.

## Client Applicability

- All clients: the validator governs every tenant's candidate pack.
- Internal only: operator/QA tooling. No client-visible surface changes.
- Feature flag: None.

## Changes Included

- `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`
  - `--validate-candidate <path>` replay mode (no Claude client, no `ANTHROPIC_API_KEY`).
  - `capFindings()` — explicit truncation marker carrying the true total; caps raised to 500.
  - `validateClosedEnums` walks `clientVisiblePayload(candidate)`, not the whole candidate.
  - `requiredPlanningVisualFields` for `signature_visuals`; prompt clause updated to match.
  - `looksVisual` no longer fires on objects that merely *contain* a `graph_display_contract`.
  - `getArg` accepts `--name value` as well as `--name=value`.
- `package.json`: adds `home:knowledge-v4:replay`.

## QA / Validation

- `pass` — `node --check scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`.
- `pass` — `npx eslint scripts/knowledge/build-home-knowledge-v4-review-pack.mjs` (exit 0).
- `pass` — Replay against all five stored candidates: 5/5 validated, 0 Claude calls, 0.12s
  wall clock, correct non-zero exit and `HOME_V4_REPLAY_VERDICT: FAILED (5/5 candidates)`.
- `pass` — Before/after on identical candidate JSON proves the validator fixes are the cause of
  the reduction (Meridian `validateClosedEnums` 629 → 137; equivalent drops on all 5 tenants:
  apex 717→149, first-capital 597→129, lakeshore 748→152, skyharbor 620→117).
- `pass` — `getArg` regression: `--out-dir <dir>` now honoured; previously fell back to the
  in-repo default silently.
- `n/a` — No migration, no runtime change, no database writes, no generation run.

## Rollout Plan

Merge + deploy through the normal ACA main lane. No operator job is required for this PR —
replay runs locally against any candidate bundle. The next paid generation should not start
until the two schema-enforceable authorship defects above are addressed and proven with a
three-dimension canary.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main deploy after merge.
- Shared runtime mutators: none — no runtime code path touched.
- Migration application: none.
- Feature/env flag update path: none.
- Live signed-in proof required: no — operator tooling only, no runtime-visible change.

## Rollback Plan

Revert the PR. Replay is additive; the validator changes revert to the prior (over-firing)
behaviour, which fails candidates more aggressively rather than less — so a revert cannot let
bad content through.

## Audit Evidence

- `replay-validation.json` + `REPLAY_VALIDATION.md` for all five tenants across three
  successive replay runs (pre-fix, post-double-walk-fix, post-wrapper-fix), showing the
  finding-count reduction attributable to each fix on unchanged input.

## Known Gaps

- The replayed corpus is contract vintage `...visual-enum-v2`; `main` has since moved to
  `...single-dimension-v1`. Finding *types* are shape-based and transfer, but the per-dimension
  batching differs. A fresh candidate from the current contract should be replayed once one
  exists.
- No Claude content is loaded or approved by this PR. Loading remains a separate governed step
  gated on `candidate_review_ready` plus human review.
- The two residual authorship defects (`empty_state`, graph-typed `primary_visual`) are
  diagnosed but not fixed — they need the tool schema tightened and a canary run.
- Fan-out/fan-in generation, fingerprinted scope caching, targeted per-dimension retry, and
  cost/call budget caps are designed but not implemented. Replay is the prerequisite control
  point for all of them; it is now in place.
