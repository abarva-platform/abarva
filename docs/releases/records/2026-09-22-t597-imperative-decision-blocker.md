# 2026-09-22-t597-imperative-decision-blocker — An imperative decision is still a decision

## Release ID

`2026-09-22-t597-imperative-decision-blocker`

## Status

`candidate`

## Plain-English Summary

The execution board derives, for every backlog item, a "blocker" that says whether the item is
free for an agent to pick up or is waiting on a person. The queue that agents read is built from
that verdict: an item with no owner blocker is offered as claimable work.

The detector recognised decisions written as nouns — "decision needed", "decision required",
"product call" — and exactly one imperative, the literal string "Decide first". Acceptances are
not written that way. They are written in the imperative, the way an instruction is.

One item in the backlog opens "Decide per job before pinning anything: is it still wanted?" and
closes "this item is read-only until a human decides". Neither phrasing was recognised, so the
board classified it as unclaimed and the generated queue listed it as claimable. That item asks
for a judgement about which Container Apps Jobs should be retired versus pinned, and it says in
its own text that several of the jobs involved mutate tenant data and must not be run to find
out. It is the precise category of work an agent must not guess at, and the queue was handing it
to agents as free work.

This change teaches the detector two imperative forms — a sentence that opens with "Decide", and
work explicitly deferred until a named person decides — and holds the existing narrowing in
place with its own cases.

## Layer Impact

**Release lane: `internal-admin`.** This is AbarVa-only operational tooling — the work-allocation
board and queue that agents and operators read. It ships no client-facing capability, so it is
not `global-control-lane`; it touches no tenant schema, seed, ingestion or retrieval, so it is
not `client-data-lane`; and it is neither demo-facing nor feature-gated.

No product layer changes.

- **Layer 1–4 (intake, adapters, canonical model, products):** untouched. No schema, migration,
  loader, adapter, projection, route, component or tenant data is read or written by this change.
- **Platform tooling:** `scripts/exec/build-source-board.mjs` derives one additional blocker
  classification. The generated board, summary and queue are build outputs and are not committed.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — agent work-allocation tooling
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/build-source-board.mjs` — two imperative forms added to the "Decision needed"
  rule, each anchored, with the reason for the anchoring recorded beside them.
- `scripts/exec/build-execution-queue.test.mjs` — six new behavioural cases (section 22), and
  one existing case re-pointed at the surface that owns its subject (see QA below).

## QA / Validation

All numbers below are from `node scripts/exec/build-execution-queue.test.mjs`, which runs both
generators as real child processes against synthetic operator documents.

**Clean baseline, same scope, both sides.** At `origin/main` `be925095d`, the four toolchain
files extracted to a scratch directory and run there: **107 passed, 0 failed**. On this branch:
**113 passed, 0 failed**.

**Red first, on unmodified product code.** The six new cases were written and run before
`build-source-board.mjs` was touched: **111 passed, 2 failed**. The two failures were exactly the
two cases asserting that the real item's own sentences gate the item; the four cases asserting
that descriptive and negated uses must *not* gate it already passed, which is what makes them a
narrowing control rather than decoration. After the fix: **113 passed, 0 failed**.

**The positive cases use the real item's prose, copied verbatim, not invented text.** A fixture
written to match a new pattern passes while the real item stays claimable, and proves nothing.

**Four deliberate mutations of a scratch copy, four caught, zero escapes:**

| # | Mutation | Result |
|---|---|---|
| 1 | Delete the sentence-initial imperative alternative | 112/1 — fails the "imperative opening a sentence" case |
| 2 | Delete the deferred-until-a-person-decides alternative | 112/1 — fails the "read-only until a human decides" case |
| 3 | Drop the sentence anchor, matching `Decide` anywhere | 112/1 — fails the **negated** control |
| 4 | Loosen the deferral form to the bare verb | 111/2 — fails the deferral case **and** the negated control |

Mutations 3 and 4 are the ones that matter most: they prove the anchoring is load-bearing and
that a loosened detector is caught by the narrowing controls rather than sailing through. The
scratch copy was confirmed byte-identical to the branch file afterwards.

**Measured against the real backlog, before and after, with the claim log held constant.** Both
generators were run at the same instant against the same operator root, so the only variable is
this change. Claimable count **3 → 2**. The claimable table lost exactly one id.

Six items' derived blocker changed. Every one is a genuine decision statement — there are no
false positives in the set — and only one of the six was claimable:

| id | rung before | blocker change | why it moved |
|---|---|---|---|
| T-596 | **Open** | `null` → `Decision needed` | The target. "Decide per job before pinning anything"; "read-only until a human decides". **The only id that left the claimable table.** |
| 38 | Merged | `null` → `Decision needed` | "Decide: mount the block in the shell, or move the…" — a mount-versus-move call |
| 39 | Deployed | `null` → `Decision needed` | "Decide per component: mount it, or retire the catalog entry" — a retire-versus-repair call |
| T-500 | Merged | `null` → `Decision needed` | "**Decide, and the decision is not an agent's to guess**" — says so in its own text |
| T-502 | Merged | `Blocked (see source)` → `Decision needed` | "; decide whether the page should score 84 and fix whichever side is wrong". Was already an owner blocker; only the label became more specific |
| T-011 | Merged | `null` → `Decision needed` | Triggered from a **claim line**, not the item body: the line recording that the item was claimed says the agent would decide which of two vocabularies is authoritative. That decision was made and the item merged |

The five items other than `T-596` are all at rung 5 or 6, so none of them was claimable before
this change and none is claimable after it; they move only between display buckets.

`T-011` is worth naming precisely rather than counting as clean. Its match is a true decision
statement whose decision has since been answered. The corpus the detector reads includes claim
history and has no notion of "resolved", so a decision that was taken reads the same as one that
is pending. That is a pre-existing property of every rule in the table, not something introduced
here — the same is true today of a claim line containing the words "decision needed" — and
narrowing it is a separate item rather than something to fix quietly inside this one. It is
filed below.

**One existing case was updated, with the reason, not weakened.** Section 15, "definedIn lets two
real definitions of one id stay distinct", is about *placement*: that a genuinely duplicated id
is placed by definition rather than force-fit onto one row. It proved that by counting the id's
rows in the rendered **claimable** table. That proxy only held while both definitions happened to
be claimable, and the fixture's second definition reads "Decide the non-Source product scope",
acceptance "Decide before coding" — which this change correctly classifies as a decision gate.
The row count fell to 1 while placement was still entirely correct.

The assertion was moved onto `source-board-summary.json`, which owns placement, and is now
**stronger** than the row count was: it requires two distinct definitions *and* pins them to
their two different lanes, alongside the unchanged assertions that nothing went unplaced and
nothing rendered `AMBIGUOUS`. Nothing was loosened and no case was deleted. The reason is
recorded in the test file next to the assertion, so the next reader does not re-derive it.

**Typecheck:** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`, judged
by exit code — see the PR for the recorded result. Both changed files are `.mjs` and outside the
TypeScript program, so this is a no-regression check rather than coverage of the diff.

## Rollout Plan

Merge to `main`. There is no runtime rollout: neither changed file is part of the application
image, is imported by application code, or runs in any Container App or worker job. The board,
summary and queue are generated locally by operators and agents and are not committed.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unmodified; it will run on
  merge as it does for any commit.
- Shared runtime mutators: none. This change issues no Azure command and alters no workflow.
- Approved image digest: unchanged by this release; whatever the main deploy publishes.
- ACA runtime invariant: to be proven on the merge SHA as standard practice, not because this
  release can affect it.
- Worker image invariant: unchanged.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no.** Nothing in this change is reachable from any signed-in
  surface. The complete behaviour is exercised by the suite named above.

## Rollback Plan

Revert the commit. The generators are stateless — the next run of
`build-source-board.mjs` / `build-execution-queue.mjs` regenerates the board and queue from the
reverted code, and `T-596` returns to the claimable table. No migration, no data, no runtime
state is involved.

## Audit Evidence

- The PR, its diff and its CI run.
- `node scripts/exec/build-execution-queue.test.mjs` — 113 passed, 0 failed; 107 at `be925095d`.
- The red-first (111/2), mutation (four caught, zero escapes) and real before/after (3 → 2
  claimable) measurements recorded above and in the append-only claim register.

## Known Gaps

- **Filed as `T-578`:** the blocker corpus includes claim history, so a decision that has already
  been taken reads identically to one that is still pending. `T-011` is the worked example. This
  predates the change here and affects the noun forms equally; it wants the corpus to distinguish
  a resolved decision from an open one, which is a change to what `deriveBlocker` is given rather
  than to the patterns it applies. `T-578` is the lowest free id in the Claude band — `T-598`
  and `T-599` are both already spent, and a spent id is not always visible in the backlog.
  **Its structure-map entry is owed, not skipped:** `scripts/exec/source-stage-map.json` is under
  a live claim by another lane at the time of writing, and one owner per file is the rule that
  keeps these two lanes from overwriting each other. Until it is mapped the board reports it as
  unplaced and the queue will not offer it, which is the mechanism working as designed.
- `T-596` itself remains open and is now correctly marked as waiting on a person. It is not
  addressed here, and no agent should take it.
- A backlog id filed by another lane (`T-599`) is not yet in the structure map, so the board
  exits non-zero on the real operator root. That is pre-existing, belongs to the lane that filed
  it, and is untouched by this change.
