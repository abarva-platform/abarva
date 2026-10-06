# t819-owner-only-row-is-not-offered-as-claimable — the work board recognises a row that names who may act

## Release ID

`2026-10-05-t819-owner-only-row-is-not-offered-as-claimable`

## Status

`candidate`

## Plain-English Summary

The repo-owned generator that turns the execution backlog into a work board decides, per row,
whether the row is free for an agent to take or whether it is gated on the owner. It does that by
matching phrases a row uses to declare a gate — "decision needed", "a product call", "not agent
work", and about a dozen more.

Two phrasings were missing, and a live `[P0]` row writes both of them: it says the remaining step
"is an operator action, so no agent may close this", and it carries a shouted
`DECISION AND ACTION NEEDED` headline. Neither matched. The first alternative wants `decision` and
`needed` adjacent and that headline puts two words between them; the article-based alternative
wants "a decision" or "an X decision" and a shouted headline has no article; and the existing
categorical term reads `not agent work`, which does not reach a sentence that states the same
thing as a permission instead.

So the board derived no blocker for that row, and the generated queue offered it as the only
claimable row in its lane. The cost is the one the never-claim bucket exists to prevent, and it was
paid three times before this: the operator pulse records three separate runs reaching that row,
finding it unworkable, each calling it a board defect in passing, and none filing it. A lane whose
only row is one the lane may not touch still counts as a lane with work in it, so the headline
count overstates what is takeable and the next run spends its opening on the same dead end.

This change adds the two phrasings as two terms in that same table, in the shape its existing
entries use, and the row is now filed where an agent is told not to take it.

What the row is about is deliberately not restated — not here, not in the code comment, and not in
the test fixtures. This repository is public, the defect is in the phrasing rather than in the
subject, and the fixtures carry the phrasing over a synthetic subject instead.

## Layer Impact

**Release lane: `internal-admin`.** This is an AbarVa-only operations capability — the generator for
the operator work board. No client, tenant, product surface or runtime is in scope, which is why it
is not `global-control-lane`.

- **Layer 4 — products:** none. No product surface, route, component, prompt or read model is
  touched, and no tenant data is read or written.
- **Platform tooling (outside the four layers):** `scripts/exec/build-source-board.mjs`, which is
  the generator for the operator work board and the input to the generated execution queue. The
  change is confined to one entry of its blocker-rule table.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: **yes** — operator work-board classification only
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/build-source-board.mjs` — two terms added to the single `Decision needed`
  rule in `BLOCKER_RULES`: `\bdecision\s+and\s+action\s+needed\b` and `\bno\s+agent\s+may\b`,
  with the comment the rest of that table carries, including the live measurement.
- `scripts/exec/build-source-board.test.mjs` — four behavioural cases: two that reproduce the
  defect and two guardrails that pass on unfixed code by design.

No other file changes. The article requirement on the pre-existing alternative is unchanged, for
the reason the rule's own comment gives.

## QA / Validation

**Red first, same scope.** `node scripts/exec/build-source-board.test.mjs`

- before the cases: **106 passed, 0 failed**
- with the cases, unfixed generator: **108 passed, 2 failed** — cases (a) and (b) fail; the two
  guardrails (c) and (d) pass on unfixed code by design
- with the fix: **110 passed, 0 failed**

**Mutation, four ways, each killed by exactly one case** — run against the final fixtures, each
mutation applied by a helper that refuses unless the pattern it replaces appears exactly once:

| mutation | result |
|---|---|
| drop `\bno\s+agent\s+may\b` | 109/**1** — kills (a) only |
| drop `\bdecision\s+and\s+action\s+needed\b` | 109/**1** — kills (b) only |
| replace the headline term with the lazy proximity form `\bdecision\b[^.\n]{0,40}\bneeded\b` | 109/**1** — kills (c) only |
| replace the permission term with the over-broad `\bno\s+agent\b` | 109/**1** — kills (d) only |

The last two are the point of the guardrails. The lazy form matches "The decision is taken and no
approval is needed", which is a row that must stay claimable; the over-broad form matches the noun
phrase in "no agent-owned configuration file changes" and would gate a row whose acceptance says
an agent *may* close it — the direction that hides live work, which three prior items in this same
table each paid for once.

**Blast radius on the live corpus, measured not argued.** One frozen copy of the operator root,
the `origin/main` generator and this one run over it in turn in the same checkout, `blocker` read
per item out of `source-board-summary.json` for all **668** items both times:

- items whose blocker changed: **1** — `C-577`, `null` → `Decision needed`; its rung does not move
- items that changed in the other direction (lost a gate): **0**
- items above rung 0 that moved: **0**
- generated queue, same pair of roots: claimable **11 → 10**, that lane **1 → 0**, blocked-on-owner
  **128 → 129**

The board's own exit status is **1 both before and after** — it exits non-zero while any filed id
is unplaced on the structure map, which this change does not touch.

**Whole-toolchain and repo gates.** All 17 `scripts/exec/*.test.mjs` suites: **1462 passed, 0
failed** (1458 before, same scope, +4 added cases).
`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0, judged by
exit code**. `npx eslint` over both changed files — **exit 0**.

## Rollout Plan

Merge to `main`. **No runtime rollout.** Nothing in this change is imported by the application, by
a route, by a worker job or by a CI gate's enforced set; the two files are operator tooling run on
demand. No image build is required for the change to take effect, and the next deploy carries it
only incidentally.

## Deployment Authority

Not applicable — this release cannot affect Azure Container Apps, deploy workflows, runtime images,
feature flags, environment variables, worker jobs, traffic, DNS or environment promotion.

- Repo-owned deploy workflow: not used by this change
- Shared runtime mutators: none
- Approved image digest: not applicable — no image change
- ACA runtime invariant: not applicable
- Worker image invariant: not applicable
- Feature/env flag update path: none
- Live signed-in proof required: **no** — no user-facing surface changes

## Rollback Plan

Revert the single commit. The change is two regex alternatives and four test cases in two files,
with no migration, no artifact and no runtime state; reverting restores the previous
classification exactly, and the only observable effect is that the affected row returns to the
claimable list.

## Audit Evidence

- The PR for this branch, with the before/after counts above in its body.
- `node scripts/exec/build-source-board.test.mjs` — the four `T-819` cases and their names.
- The blast-radius comparison is reproducible from any frozen copy of the operator root: run the
  `origin/main` generator and this one over the same copy and diff `blocker` per item out of
  `source-board-summary.json`.
- The code comment above the changed rule records the same measurement next to the terms it
  justifies, which is the convention every other term in that table follows.

## Known Gaps

- **The two terms are the two phrasings that were measured, not a general theory of permission
  sentences.** A row that declares an owner gate in a third form will miss again. The honest
  containment is that this table has been widened five times by five live rows and each widening
  was measured for extras in both directions; that discipline is what keeps the misses one row at
  a time rather than a class.
- **Nothing here fixes the underlying asymmetry**: a row acquires a gate from its prose, so the
  classifier's reach is bounded by how a human chose to word a sentence. A structured gate field on
  the row would remove the guessing entirely, and that is a backlog item nobody has filed.
- **The pulse's three prior sightings are not retro-corrected.** They recorded the symptom
  correctly and are audit history; this record is the first filing.
