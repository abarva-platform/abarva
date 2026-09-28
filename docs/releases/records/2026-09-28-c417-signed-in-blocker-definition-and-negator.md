# 2026-09-28-c417-signed-in-blocker-definition-and-negator — A boundary definition is not a proof debt

## Release ID

`2026-09-28-c417-signed-in-blocker-definition-and-negator`

## Status

`candidate`

## Plain-English Summary

The execution board derives, for every backlog row, whether that row is waiting on a person. One of
those derivations asks whether the row still owes a signed-in acceptance check. It did that by
looking for the negated token — the words "not signed-in" anywhere in the row.

That reads a sentence which *defines a boundary* as though it *reported a debt*. The live row this
was measured on tells an agent what the boundary of its work is: a completed job is not signed-in
acceptance, and readback, stale behavior and opposite-tenant refusal are three separate captures.
That clause distinguishes a finished job from an owner proof. It says nothing about a proof being
outstanding. No negation check could rescue it either, because for that pattern the negation *is*
the match — there was nothing left to veto.

The consequence is not cosmetic. A row with a derived owner gate goes into the queue section headed
*surface it, do not claim it*, so the work is reported and never offered. The row this gated is
authoring-only work in the lane the last three watcher runs each recorded as idle.

The rule now requires a rung-bearing participle after the token. A status verdict says the proof has
not happened — "DEPLOYED, NOT SIGNED-IN PROVEN", "NOT signed-in accepted" — and keeps its gate. A
definition predicates a noun, and that noun is deliberately excluded from the participle list.

## Layer Impact

- **Release lane: `internal-admin`.** AbarVa-only operations tooling; no client-facing surface.
- **Operator tooling only.** `scripts/exec/build-source-board.mjs` derives the board summary and the
  claimable queue read by execution agents. It renders no product surface, serves no route, and
  reads no tenant data.
- No change to layers 1–4 of the data operating model. No intake, adapter, canonical model or
  product surface is touched.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: **yes** — internal execution tooling
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/build-source-board.mjs` — the signed-in owner-gate rule's negated alternative now
  requires a rung-bearing participle (`proven`, `proved`, `accepted`, `verified`, `confirmed`)
  after the token.
- `scripts/exec/build-source-board.test.mjs` — one case for the freed direction and two regression
  cases for the two live shapes that must keep the gate.
- Commit `be5a9506789ee8a9b80de90dd5ca06b89163ed05`.

## QA / Validation

**Suite, measured against a clean baseline over the same scope.**

| run | result |
|---|---|
| `origin/main` `04a4b7537a`, suite as it stands | 103 passed, 0 failed |
| the three new cases added, fix NOT applied | 105 passed, **1 failed** |
| fix applied | 106 passed, 0 failed |
| fix blinded (reverted, cases kept) | 105 passed, **1 failed** |

The blinded run is the decisive check: a suite that stays green when the fix is reverted has proved
nothing. The two regression cases pass on unfixed code by design — that is what makes a widening
visible if one is ever attempted on this rule.

**Live corpus, per item rather than in aggregate.** The generator was run over a frozen copy of the
operator root, before and after, and the derived `blocker` was read out of
`source-board-summary.json` for every one of the 668 items:

```
668 items before, 668 after
exactly 1 item moves: "Signed-in acceptance owed" -> "Blocked (see source)"
extras: 0, in both directions
```

The two rows that must keep their gate — a status verdict ending `PROVEN` and one ending `accepted`
— are unchanged, verified by reading their entries in both measurements rather than by a total.

**Claimable queue, regenerated from both summaries and diffed.** Apart from the generation stamp and
the generator's own absolute path in the provenance comment (the stamp is a hash, not a path, and the
hashes are identical), the whole diff is two lines:

```
- **Blocked (see source)** — 29 items      -> 30 items
- **Signed-in acceptance owed** — 214 items -> 213 items
```

Claimable count is 2 before and 2 after. **Nothing is newly offered as claimable work**, which is the
direction this rule must never move in.

**Gates.** `node scripts/exec/build-source-board.test.mjs`, `npx eslint` on both changed files, and
`node scripts/release-check.mjs --base origin/main --head HEAD` — results in the PR.

## What this change deliberately does NOT do, and the measurement that decided it

The item this closes names a second row, gated through the sentence *"no signed-in proof is owed"*.
That half is **not in this change**, and the reason is a measurement rather than a preference.

The filing diagnosed it as the veto's window opening at the match index. Measured, that is not the
mechanism: `sentenceAround` searches backwards to the previous `". "`, so the negator is inside the
window. What defeats the veto is its adjacency bound — the negator quantifies the proof noun instead
of sitting against `owed`, with a noun phrase between them.

Both remedies the item offers were built and measured:

- **Widening the adjacency bound is unsafe**, for the reason the rule above it already carries: the
  register's most common *owed* phrasing is "Not live-proven — signed-in check owed", whose negator
  belongs to `live-proven`. A window loose enough to reach the denial reaches that phrasing too and
  would remove a real gate from every row carrying it.
- **Matching the denial as its own veto term is safe in shape but out of bounds in effect.** Built
  and measured on the live corpus, it moves **99 rows**, one of them at rung 0 and therefore newly
  claimable. The item's own acceptance says a change moving more rows than can be named per item is
  not that item, and its body already describes that set as a candidate list needing a reading each.

A successor item carries that half with this measurement attached.

Separately: the row freed here does **not** reach a claimable lane on this change alone. With the
signed-in gate gone, the `blocked` rule matches a *descriptive* sentence in the same row about a data
object — it names why that object is still blocked, not why the item is. That is a third shape,
distinct from both halves the item describes, and it is filed as its own successor.

## Known Gaps

- **The item's second half is not closed here.** A row gated through "no signed-in proof is owed"
  keeps its gate. The remedy was built and measured and moves 99 rows, one of them newly claimable —
  past this item's own bound. Filed as a successor with the measurement attached; see the section
  above for the numbers and why the alternative remedy is unsafe.
- **The row freed here is still owner-gated by a different rule.** A descriptive sentence about a
  data object — naming why that object is blocked, not why the item is — is matched by the `blocked`
  rule. That is a third shape and it is filed separately; this change does not attempt it.
- **No signed-in proof, and none is owed.** Stated rather than left blank: the change alters one
  derivation in an operator script that renders nothing and reaches no tenant data.
- The per-item corpus measurement was taken over a frozen copy of the operator root at one instant.
  The operator documents are append-only and change continuously, so the *numbers* are reproducible
  only against that frozen copy; the *property* — exactly one item moves, extras zero — is
  reproducible against any root by the command in Audit Evidence.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing under `src/` imports `scripts/exec`, the change is
unreachable from any product route, and no image, flag, env var or migration is involved.

## Deployment Authority

- Repo-owned deploy workflow: not engaged — no runtime artifact changes
- Shared runtime mutators: none
- Approved image digest: not applicable
- ACA runtime invariant: not applicable — no runtime image or template change
- Worker image invariant: not applicable
- Feature/env flag update path: none
- Live signed-in proof required: **no**, and this states so rather than leaving the field blank —
  the change alters one derivation in an operator script with no product surface, no route and no
  tenant data

## Rollback Plan

Revert the commit. The generators are regenerate-on-demand and hold no state, so the previous board
and queue are reproduced by re-running them; no migration, image or flag is involved.

## Audit Evidence

- PR and CI run: linked from the PR.
- Commit `be5a9506789ee8a9b80de90dd5ca06b89163ed05`.
- Suite output for all four runs in the table above, reproducible with
  `node scripts/exec/build-source-board.test.mjs`.
- Per-item before/after blocker measurement, reproducible by running
  `node scripts/exec/build-source-board.mjs --json --operator-root <root>` at this commit and its
  parent over the same operator root and diffing the derived `blocker` per item.
