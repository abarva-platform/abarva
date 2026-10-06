# 2026-09-27-gate-declared-over-part-of-an-item — a gate over part of an item no longer gates all of it

## Release ID

`2026-09-27-gate-declared-over-part-of-an-item`

## Status

`candidate`

## Plain-English Summary

`scripts/exec/build-source-board.mjs` derives, for each backlog item, one *blocker* — the reason a
person rather than an agent has to move next. `scripts/exec/build-execution-queue.mjs` then removes
any item carrying a blocker from every claimable lane, because an agent must not attempt a signed-in
acceptance, apply a migration, or make an owner's decision.

That blocker is a **per-item** field, and some acceptances are written in halves. When one half needs
a human session and the other is ordinary code work, the first true sentence about the gated half
labels the whole item, and the executable half stops being visible as work at all.

Measured on the live operator documents at `912a1c593c`, over a frozen snapshot of them: one item's
derived blocker went from `null` to an owner gate and the queue's claimable count went **4 to 3**,
caused entirely by a single log line that was **correct** about the half it described. Removing that
one line from a scratch copy returned the blocker to `null`, so the line was the whole cause and the
row's own text gated nothing.

There was also no remedy available to the log. It is append-only by design, and the match runs over
an item's whole corpus, so one unvetoed sentence anywhere is enough — a later line saying the other
half is free does not move the blocker. A single badly scoped sentence therefore gated an item
permanently and by construction.

**The remedy is a declaration, not a narrower pattern.** The blocker rules are unchanged, and that is
deliberate: two earlier items each paid for their current breadth after a narrowing hid genuine
gates, and the sentence in the live case is a *correct* match that must go on matching. What is new
is that an item may declare, in its own row or in an appended log line, that the gate it carries
covers a named half:

```
**Gate scope — partial.** Gated half: <text>. Claimable half: <text>.
```

The board then records the gate as `partialGate` rather than `blocker`. The item is claimable again,
its lane row carries a `⚠ PARTLY GATED` marker naming the half nobody may take, and the queue renders
a *Partly gated* section on every run — including at zero, so an empty bucket and a generator that
stopped looking are not the same thing.

Four properties keep the change in the safe direction, each with a case that fails without it:

| property | what it refuses |
|---|---|
| declared, never inferred | with no declaration the gate covers the whole item, exactly as before |
| fails closed | both halves are required; a declaration naming only the gated one frees nothing |
| cannot invent a gate | the scope is read only after a rule has already matched, so a row *about* partial gates does not acquire one |
| the `Unclaimed` fallback is not scopable | it asserts the ABSENCE of a gate, and promoting it is the one direction these generators must never take |

## Layer Impact

Release lane: `internal-admin` — AbarVa-only operator tooling. No client-facing surface ships here.

- **Layer 4 — products:** none. No product surface, route, component, prompt or read model is
  touched.
- **Operator tooling / CI:** `scripts/exec/build-source-board.mjs`,
  `scripts/exec/build-execution-queue.mjs` and both contract suites. Both suites already run in
  `.github/workflows/execution-queue-toolchain.yml`, so the new cases execute on every pull request
  rather than only locally.

No canonical object, tenant fixture, migration, adapter, projection or governed bundle changes. The
generated board, summary and queue are not committed.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: **yes** — operator execution bookkeeping only
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/build-source-board.mjs`
  - `deriveBlocker` now carries `ownerGate` on the blocker it returns, so a caller can tell a stated
    gate from the `Unclaimed` fallback without re-deriving it
  - new `PARTIAL_GATE_DECLARATION`, `declaredGateScope` and `scopeBlocker`: a declared scope converts
    an owner gate into a `partialGate` and leaves `blocker` null
  - every item carries `partialGate`; the board HTML renders `partly gated — <gate> over: <half>` in
    the blocker cell rather than `—`
  - the summary gains a top-level `partialGates` roll-up, written on every run including empty, on the
    same terms as the existing residual fields
- `scripts/exec/build-execution-queue.mjs`
  - a claimable row for such an item carries a `⚠ PARTLY GATED` marker naming both halves, in the
    queue's own words rather than the row's
  - new *Partly gated — claimable, with a half you must not take* section, rendered at zero too, with
    a count that agrees with the rows it lists
  - the stdout counts line reports how many claimable rows are partly gated
- `scripts/exec/build-source-board.test.mjs` — 7 cases (a)–(g)
- `scripts/exec/build-execution-queue.test.mjs` — 8 cases across (a)–(d)
- `scripts/exec/README.md` — the declaration, the measurement, and the four properties

## QA / Validation

**Red first, on the live line rather than an invented one.** The gating sentence in both suites is
the exact text of the log line that caused the live regression, character for character, in the log's
own line shape.

| suite | before | after | scope |
|---|---|---|---|
| `build-source-board.test.mjs` | 88 passed / 3 failed | 91 passed / 0 failed | same suite, same file |
| `build-execution-queue.test.mjs` | 202 passed / 5 failed | 207 passed / 0 failed | same suite, same file |

Both baselines were measured by running the same suite on the same branch before the corresponding
generator change, not quoted from another scope. Four of the board's seven cases and three of the
queue's eight pass *before* the change by design — they are the regression guards for the direction
that must not move, and a guard that only passes after the fix cannot hold that direction shut.

One assertion was rewritten after passing for the wrong reason: the first draft of the queue's row
case asserted only that the row mentioned the gated half, and passed on unfixed code because the
declaration lives in the row and the title the queue prints already contained those words. It now
asserts on the queue's own marker, which exists nowhere in the fixture documents, and on the text
that follows it.

**Seven mutations, seven caught, each by a distinct case set.**

| mutation | caught by |
|---|---|
| ignore the declaration entirely | board (b), (c) |
| scope any blocker, including the `Unclaimed` fallback | board (f) |
| build a partial gate when no rule matched at all | board (e), (f) |
| make the claimable half optional, so the declaration fails open | board (d) |
| drop the row marker from the claimable table | queue (a) marker case |
| render the section only when it is non-empty | queue (b), (c) |
| count an undeclared whole-item gate as partly gated | queue (b), (d), plus three pre-existing owner-gate cases |

Two of the seven first produced a crash rather than a discriminating failure — a `TypeError` reached
through the missing half and the missing scope — which proves the suite goes red without proving the
case tells the two behaviours apart. Both were rewritten as non-crashing variants that fail open
instead, and the table above records the clean verdicts. Each mutation was applied by digest and
refused if it did not change the file, so a no-op mutation cannot read as a caught one.

**Measured over the real corpus, in both directions, against a frozen snapshot** — the operator
documents were copied once and both generators were run over the same bytes, because a sibling run
appended a new item to the live backlog mid-measurement and a before/after taken across that change
would have attributed its row to this one.

- **The code change alone moves nothing.** `origin/main`'s board and this branch's board over the
  same 626 ids: every derived blocker and rung identical, `partialGates` empty. The mechanism is
  inert until something declares a scope.
- **With the declaration added to the one live row, exactly one item moves, and it is named:**
  `U-406`, from `Signed-in acceptance owed` to no per-item blocker, carrying a partial gate whose
  quoted sentence is the live log line. No other id changes in either direction.
- **The queue, same bytes, same code:** without the declaration 3 claimable / 0 partly gated / 360
  blocked on Anand and `U-406` in no lane table; with it 4 claimable / 1 partly gated / 359 blocked
  on Anand, `U-406` offered in lane U with the `⚠ PARTLY GATED` marker and named in the new section
  with both halves. That is the 4-to-3 regression undone, measured rather than argued.

`npx eslint scripts/exec/` exit 0. `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit
--pretty false` exit 0 with zero diagnostics, judged on the exit code.

**No live signed-in proof is owed, and this record says so rather than leaving the field blank.**
Nothing here renders, routes, queries or prompts: two operator scripts and their suites. The signed-in
readback that `U-406`'s own gated half owes is unchanged by this release and remains owed — freeing
the other half is precisely not a claim that the gated one was done.

## Rollout Plan

Merge to `main`. No runtime rollout: no image, container app, worker job, migration, flag or
environment variable is involved. The generators run on an operator machine and in CI.

## Deployment Authority

- Repo-owned deploy workflow: not applicable — no runtime artifact ships
- Shared runtime mutators: none
- Approved image digest: not applicable
- ACA runtime invariant: not applicable
- Worker image invariant: not applicable
- Feature/env flag update path: none
- Live signed-in proof required: **no** — operator scripts only; see QA above

## Rollback Plan

Revert the pull request. Nothing persists: the board, summary and queue are regenerated from the
operator documents on every run, and a declaration left in a backlog row reads as ordinary prose to
the previous generator, which gates the item exactly as it does today. No migration, no data change.

## Audit Evidence

- The pull request and its `Execution queue toolchain` check, which runs both contract suites
- Both suites' before/after counts, reproducible by running them on this branch with and without the
  corresponding generator change
- The frozen-snapshot measurement: run `origin/main`'s board and this branch's board over one copy of
  the operator documents and diff the derived blockers; then add the declaration to the one row and
  diff again
- `scripts/exec/README.md`, which documents the declaration and the four properties

## Known Gaps

- **The declaration is a convention no gate enforces.** Nothing requires an item with a per-half
  acceptance to declare one, so an item can still be gated whole by a correct sentence about half of
  it until someone writes the declaration. Making that omission *detectable* is a separate item; this
  change gives the remedy an executable form, which it did not have at all.
- Two related shapes stay open and are not addressed here: a quoted label read as a gate, and a
  filename read as a gate. Both are filed separately, and neither is a scope question.
- The one item freed by this change still owes its own gated half, which needs a human session.
