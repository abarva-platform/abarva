# 2026-09-23-t725-disclaimed-paths — A file a line stays off is not a file a line holds

## Release ID

`2026-09-23-t725-disclaimed-paths`

## Status

`candidate`

## Plain-English Summary

The execution register is an append-only log in which agents record which files they are
about to edit, so two agents never edit one file at once. A repo-owned control reads that
log and answers whether a file is free. It decides by finding path-shaped tokens in a line
and treating each one as a claim, with two exceptions already in place: a cue in front of a
path saying the writer is staying off it, and a cue attributing the path to somebody else.

Both exceptions are anchored to a bound of forty characters that may not cross a full stop.
**Every repo path contains a full stop.** So once one path has been written, no cue in front
of the list can reach any later member of it, and `Files released: a.ts, b.ts and c.ts`
frees `a.ts` while holding the other two. Nobody chose that reading; the unit of the bound
chose it.

The cost landed on the one act that must not be blocked. Agents survey the live claims
before choosing what to touch, and they write the survey down: *"the one live sibling claim
… names `<a>`, `<b>` and `<c>` — none of which I touch."* A careful, courteous sentence, and
the control read all three as claimed. A run then came to **release** those same three files
and was refused — by a line that had gone out of its way to say it was not on them. A
release is the act that hands files back, so a false refusal there is the worst target this
control has.

This change makes the unit of decision the **list** rather than the path. Paths joined by
nothing but list punctuation are one object: the cues in front are read once at its head and
govern all of it, and a disclaimer written behind it is read too.

**The disclaimer in the real case is on the right, not the left.** The backlog item asked
for "the left-governing disclaimer the item dimension now has", and that is recorded here as
a correction rather than followed: measured on the line itself there is no negation in front
of those three paths at all — the sentence attributes them with `names` and disclaims the
whole list behind it. A purely left-governing repair passes every fixture and leaves the one
case the item was filed for exactly where it was.

## Layer Impact

Release lane: `internal-admin`.

- **Platform tooling / execution control plane.** `scripts/exec/register-time-authority.mjs`
  only. No product layer is touched: not client intake, not the source adapters, not the
  canonical model, and no product surface. The control reads an operator-owned file and
  writes nothing.

## Client Applicability

- All clients: no
- Specific clients: no
- Internal only: **yes** — agent execution tooling only
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/register-time-authority.mjs`
  - `claimedPaths` now groups consecutive paths into a **list** via `pathOccurrences` and
    `PATH_LIST_JOINER`, evaluates the two existing front cues once at the list's head, and
    disqualifies the whole list together.
  - New `PATH_TAIL_SET_NEGATION`, `PATH_TAIL_FIRST_PERSON`, `PATH_TAIL_REACH_TOKENS`,
    `pathGovernedTail` and `disclaimsPathList`: a disclaimer written *behind* a list hands
    the list back.
  - `PATH_NEGATOR` becomes `negatesPathList` with its forty-character, no-full-stop reach
    unchanged, plus two guards that letting a cue govern a whole list makes necessary:
    `(?!-)` so a hyphenated compound is not a disclaimer, and `PATH_NEGATOR_OBJECT` so a cue
    whose object is a pronoun before a colon does not govern the list after it.
  - `PATH_ATTRIBUTIVE`, `normalisePath` and `PATH_TOKEN` are untouched, so movement is
    attributable to this change alone.
- `scripts/exec/register-time-authority.test.mjs` — 25 new behavioural cases.

## QA / Validation

Measured over the same scope on both sides; no number here is absolute.

| measurement | before | after |
|---|---|---|
| `scripts/exec/register-time-authority.test.mjs` on clean `origin/main` `64633102f` | 233 passed, 0 failed | — |
| the same suite with the 25 new cases and **no** fix | 243 passed, **15 failed** | — |
| the same suite with the fix | — | **258 passed, 0 failed** |
| `scripts/exec/append-claim.test.mjs` | 50 passed, 0 failed | 50 passed, 0 failed |
| `scripts/exec/build-execution-queue.test.mjs` | 140 passed, 0 failed | 140 passed, 0 failed |
| `scripts/exec/build-source-board.test.mjs` | 23 passed, 0 failed | 23 passed, 0 failed |
| `scripts/exec/queue-provenance.test.mjs` | 30 passed, 0 failed | 30 passed, 0 failed |
| `scripts/exec/worktree-retention.test.mjs` | 22 passed, 0 failed | 22 passed, 0 failed |
| `scripts/exec/cli-entry.test.mjs` | 17 passed, 0 failed | 17 passed, 0 failed |

**Red first, then the fix, then the fix broken on purpose.** 15 of the 25 new cases failed
before any edit to the control; the other 10 are the guardrails an over-broad fix would
break, and they pass on unfixed code by design.

**The known positive is a live register line, and the historical refusal is replayed rather
than described.** Running the control against the operator register with the clock pinned to
the instant of the original refusal, the release of the three narrated files reports **3
conflicts before this change and 0 after** — the same file, the same line, the same request.
The negative control in the same command: the line's own declared file is still refused to
another run, and the author of this change is still holding its own three files on the live
register as this is written.

**Fourteen mutations, fourteen caught.**

| # | mutation | result |
|---|---|---|
| M1 | delete the list walk, so each path is decided alone again | **caught** (8 fail) |
| M2 | delete the tail-disclaimer veto | **caught** (6 fail) |
| M3 | drop the first-person half of the tail veto | **caught** (2 fail) |
| M4 | widen the tail reach 8 → 20 tokens | **caught** (1 fail) |
| M5 | narrow the tail reach 8 → 6 tokens | **caught** (1 fail) |
| M6 | drop `(?!-)` so a hyphenated compound disclaims again | **caught** (2 fail) |
| M7 | drop the pronoun-object guard | **caught** (1 fail) |
| M8 | make the list joiner accept anything | **caught** (11 fail) |
| M9 | drop the swallowed sentence-end `trailer` | **caught** (1 fail) |
| M10 | let the tail read past a clause break | **caught** (1 fail) |
| M11 | drop `or` from the list joiner | **caught** (1 fail) |
| M12 | loosen the tail negation to a bare `none`/`neither` | **caught** (1 fail) |
| M13 | ignore the cue's forty-character reach | **caught** (2 fail) |
| M14 | ignore the cue's full-stop bound | **caught** (1 fail) |

**One branch is absent because a mutation deleting it SURVIVED.** A `cut === 0` early break
in `pathGovernedTail` was written, and removing it moved nothing: pushing a zero-length slice
and then breaking on the next line is the same output. It was unreachable rather than
untested, so it is deleted and the reason is in the code.

**Two false passes this change would otherwise have created, both found by measurement and
both repaired rather than accepted.** Letting a cue govern a whole list amplifies a wrong
head verdict, and the real register carries exactly two:

- `not an ordinary no-record state; files limited to <three paths>` — the `no` inside
  `no-record` freed the first of three genuinely claimed paths *before* this item existed.
  Hyphenated, the vocabulary is never a disclaimer: the register writes `no-op`,
  `not-found`, `--no-emit`, `--no-coverage`, `free-text` — some sixty compounds and CLI
  flags, not one of which disclaims a file. `(?!-)` costs nothing and returns that path to
  its owner.
- `… I AM NAMING THEM HERE RATHER THAN OMITTING THEM: <a> and <b>` — a run declaring two
  files it holds that its `--files` list omits. `rather than` sits 29 characters in front of
  the list, so the cue reaches, and its object is `THEM`. Before this item that cost the head
  only, which a second mention of the same path later on the line happened to repair;
  propagating the head's verdict would have freed the other file outright with its owner
  still live.

**The tail vocabulary is counted, not brainstormed.** `of which` occurs 6 times on the
register and `none of them` 26. Exactly three of those 32 disclaim a path — `none of which I
touch`, `neither of which is in my list`, `and I touch none of them` — and all three carry a
first person while the other 29 predicate something else (`none of which resolve in …`,
`none of which any workflow runs`, `Authorities, none of them my clock`). Both halves are
therefore required, and each of those three negative controls is a case in the suite. The
reach is measured the same way: the three real forms need 5, 7 and 7 tokens, and the first
text that must **not** reach sits 15 tokens behind its list, so 8 is one past the longest
real case and pinned from both sides.

**Movement on the real operator register, in both directions.** **114 occurrences held →
free and 1 free → held.** Every one of the 114 was read with its list head: 103 sit behind a
release handing files back (`Files released:`, `all four files free (`, `FILES FREE:`,
`Files now FREE:`), 9 behind an explicit disclaimer (`NOT touching`, `Still NOT claimed`,
`I will NOT touch`, and the three of the known positive), and 2 behind `excludes`. Of 2,261 paths declared in a
generated `files:` label, **zero** are freed. The single free → held movement is the
`no-record` path above, returning to the run that claimed it.

Gates: `npx eslint` on both changed files exit **0**. `NODE_OPTIONS=--max-old-space-size=6144
npx tsc --noEmit --pretty false` exit **0** with zero diagnostics, judged by exit code rather
than by grepping its output, and with `tsconfig.tsbuildinfo` removed first.

## Rollout Plan

Merge to `main` via squash. The change is a Node script used by agents from a checkout; it
has no runtime surface, no image, no migration and no flag. The repo-owned ACA deploy
workflow will build and deploy the merge commit as it does for every merge, and the runtime
invariant will be proven for that run, but no product behaviour changes.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`
- Shared runtime mutators: **none** — this change makes no Azure call
- Approved image digest: whatever the repo-owned workflow produces for the merge commit
- ACA runtime invariant: proven for the merge run as usual; unchanged by this diff
- Worker image invariant: unchanged
- Feature/env flag update path: not applicable
- Live signed-in proof required: **no** — no product surface is touched

## Rollback Plan

Revert the single commit. No migration, no data, no flag, no image pin to unwind. The
control returns to its previous verdicts immediately for any agent that pulls the revert.

## Audit Evidence

- The PR and its checks.
- The red/green/mutation numbers in the QA table above, each reproducible with
  `node scripts/exec/register-time-authority.test.mjs`.
- The before/after verdicts of `node scripts/exec/register-time-authority.mjs --preclaim
  --file <register> --files <list> --now <instant>` on the operator register, which is not in
  this repository.

## Known Gaps

- **A list joined by words rather than punctuation is still decided member by member.** The
  joiner is deliberately strict — `and my own` is not a joiner — because that strictness is
  what keeps the existing attributive guard standing. A disclaimer written across a
  parenthetical (`\`a.mjs\` (4) and \`b.mjs\` (2)`) reaches only as far as the punctuation
  allows, and the second path is then decided by the cue in front of it.
- **The front cues' reach is still measured in characters.** This change moves where they
  are anchored, not how far they reach. Forty characters that may not cross a full stop
  remains the bound, and it is still the wrong unit for the same reason the tail veto counts
  words: the length of whoever's run id sits between the cue and the file is not a property
  of the grammar.
- **The gate still reads one line at a time.** A run that claims files on one line and
  disclaims them on the next is read as holding them.
