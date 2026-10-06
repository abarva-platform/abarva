# 2026-09-24-t761-decision-gate-adjective — an owner decision qualified by an adjective is read as one

## Release ID

`2026-09-24-t761-decision-gate-adjective`

## Status

`candidate`

## Plain-English Summary

The execution board derives, for every backlog item, whether something is blocking it — and
one of those blockers means "a person has to decide this, an agent must not guess". The
generated work queue uses that field to keep such items out of the list it offers to
unattended agents as free work.

One of the phrasings it recognises is an item whose acceptance opens by naming the decision as
a noun phrase — "A decision, then the work that follows from it". That term matched the bare
words only, so putting an adjective in front of the noun defeated it. Two live items write it
exactly that way, and both were being offered as claimable: one opens "A product decision, not
a code decision", the other "A disambiguation decision precedes the code and an agent must not
guess it". Between them that was two of the nine rows the queue had to offer.

This change lets a short qualifier sit between the article and the noun. It is deliberately
bounded at two words and the anchor is untouched, so a decision merely mentioned in passing
still reads as no blocker — the same detector had to be narrowed back once before, when
re-scanning raw prose turned every descriptive use of a word into an owner gate.

Measured over the live corpus, this moves exactly one item — the second one above — out of the
claimable queue and into the bucket an agent must never claim. The first one needs a second,
independent repair that is **not** in this change, and that is recorded below and filed.

## Layer Impact

Release lane: `internal-admin` — AbarVa-only operations tooling. No client-facing surface and no
data-plane object is touched.

- Layer 4 (products): none. No byte under `src/` changed; no product surface, route, API or
  rendered output differs.
- Internal operations tooling only: `scripts/exec/build-source-board.mjs`, which derives the
  operator board and the claimable queue from operator-owned documents.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — execution-board tooling
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/build-source-board.mjs` — the decision-gate term in `BLOCKER_RULES` admits a
  bounded adjectival modifier between the article and `decision`, and `An` as well as `A`.
  One pattern changed; no other executable line.
- `scripts/exec/build-source-board.test.mjs` — five cases: two red-first over the two live
  sentences, two guardrails for the bound and the anchor, one pinning that the bare noun
  phrase still matches with the slot empty.

## QA / Validation

**Red first, then green, same command and same scope both sides.**

- Clean baseline, generator pinned at `e69788dfc`: `node scripts/exec/build-source-board.test.mjs`
  → **60 passed, 0 failed**, exit 0.
- New cases against unrepaired product code → **63 passed, 2 failed**, exit 1. The two failures
  are the two live sentences; the three guardrail/anchor cases pass on unfixed code by design.
- After the fix → **65 passed, 0 failed**, exit 0. The delta is exactly the five cases added and
  no existing expectation moved.

**Four deliberate mutations, four caught, each by the case written for it.**

| # | Mutation | Failing cases |
|---|---|---|
| 1 | revert the widening to the literal noun phrase | 2 — both live-sentence cases |
| 2 | make the adjective slot unbounded (`{0,2}` → `*`) | 1 — the bound guardrail, and only it |
| 3 | drop the sentence/bold anchor | 3 — the anchor guardrail plus two pre-existing anchor cases |
| 4 | require at least one adjective (`{0,2}` → `{1,2}`) | 2 — the empty-slot case and the U-502 case it protects |

No mutation was a no-op: each changed the suite's result.

**Live-corpus measurement, both directions, and it had to be pinned twice to be sound.** Both
generators were run against one frozen copy of the operator documents, and both generators were
taken from the same commit `e69788dfc` rather than from the moving `origin/main` ref — a first
attempt read a `origin/main` that advanced mid-measurement and attributed another change's
effect to this one.

- ids compared: **381**; present in one side only: **0**.
- blocker changed on **exactly 1** id: `D-044`, `null` → `Decision needed`. Extras **zero**.
- claimable queue rows: **9 → 8**, the removed row being `D-044`. Lane D 4 → 3.
- blocked-on-Anand: **260 → 261**.
- board exit code 0 → 0; board stdout identical apart from one collision-history line that
  reports run order, not behaviour.

**Other scopes.** Every other suite in `scripts/exec/` passes unchanged: 889 assertions across
eleven suites, 0 failures. `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit
--pretty false` exit **0** with zero diagnostics, exit code read directly rather than through a
pipe. `npx eslint` on both changed files exit **0**.

**What this does NOT close, stated rather than implied.** `C-504` keeps `blocker: null` on the
live corpus after this change, and the suite case derived from its sentence says so in its own
name. The sentence form is repaired; `C-504`'s live row has a second, independent cause —
`bodyCorpus` joins the title cell to the acceptance cell with a **space**, so nothing written at
the head of the acceptance cell sits at a sentence start at all, and `C-504` writes its gate
plain where `D-044` writes it in bold and matches on the bold anchor instead. Measured: changing
that join to a newline moves **31 items**, and 8 of those **replace** a live `Signed-in
acceptance owed` or `Blocked` gate rather than filling an empty one. That is a re-ranking of the
blocker corpus, which the generator's own comment reserves for a separate attributed change, so
it is filed as `T-762` and not done here.

## Rollout Plan

Merge to `main`. No runtime rollout: this file is an operator tool run on demand from a
checkout, it is not imported by the application, and no image or container behaviour depends on
it. The repo-owned ACA deploy workflow will build and deploy the merge commit as it does for
every merge; nothing in this change reaches the running product.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No `az` command is run by this change.
- Approved image digest: not applicable — no runtime image behaviour changes.
- ACA runtime invariant: to be recorded from the deploy run keyed to the merge SHA.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: **no**, and none is claimed. Nothing a signed-in user can
  reach differs; a signed-in lane here would be a proof with no subject.

## Known Gaps

1. **`C-504` is not closed by this change and is still offered as claimable.** Its sentence form
   is now recognised, but its live row has a second cause — the title cell and the acceptance
   cell are joined with a space, so the head of the acceptance cell is not a sentence start.
   Filed as `T-762`, measured at 31 items with 8 gate replacements, and deliberately left out of
   this change so the movement stays attributable.
2. **Markup inside the qualifier still defeats the term.** "A **product** decision" written with
   the adjective in bold does not match, because the slot admits letters and hyphens only. This
   is the same class of limit the U-502 case already records for a title ending in `.**`, it is
   not introduced here, and no live row writes it that way today.
3. **One vacuous case is reported, not repaired.** The U-502 guardrail (case 22) gives its
   fixture a body that resolves the rung, and `deriveBlocker` then reads the body alone for a
   decision gate — so the acceptance it is asserting about is never consulted. Measured by
   substituting case 21's own gate sentence into such a row: it still reads no gate and the case
   still passes. The five cases added here are written so the rule is genuinely run; rewriting
   somebody else's passing case is out of this change's scope and is named in `T-762`.
4. **Two words is a judgement, not a measurement.** The bound was chosen to cover the two live
   phrasings with one word to spare. A three-word qualifier would be missed, and nothing detects
   that except the next item filed against it.

## Rollback Plan

Revert the single commit. The change is one regular-expression term and a set of test cases in
a tool that is run on demand; reverting restores the previous derivation on the next run of the
generator, and no state, migration or deployed artifact has to be undone.

## Audit Evidence

- The pull request for this change and its check runs.
- `scripts/exec/build-source-board.test.mjs` — the five cases and the mutation table above.
- Backlog items `T-761` (this change) and `T-762` (the residual it names and does not fix).
- `EXECUTION_CLAIMS.md` claim line for `T-761`, appended through `scripts/exec/append-claim.mjs`.
