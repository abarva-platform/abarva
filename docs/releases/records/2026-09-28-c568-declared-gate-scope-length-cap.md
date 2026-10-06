# 2026-09-28-c568-declared-gate-scope-length-cap — A declared partial gate is no longer discarded for being long

## Release ID

`2026-09-28-c568-declared-gate-scope-length-cap`

## Status

`candidate`

## Plain-English Summary

The execution board reads a backlog row that says "part of this item needs an owner decision, the
rest is ordinary work" and splits the row into a gated half and a claimable half. The pattern that
read that declaration also capped each half at 300 characters, and because the cap lived inside the
pattern it was a condition for matching rather than a trim: a half one character over the cap did
not shorten, the whole declaration failed to parse, and the row silently lost its split.

Measured over the live operator documents at `2026-09-28T03:44Z`, three backlog rows declare the
canonical form and only one parsed. The failure ran in both directions at once. One row overran on
its claimable half only, kept a whole-item owner gate, and so hid work its own text calls
deliverable. Another overran on both halves, had no owner gate for the parser to keep, and was
therefore offered as the single claimable row in its lane with no gate annotation anywhere in the
generated queue — while the text of its own gated half tells an executor not to touch the file it
names. That is the failure mode this toolchain exists against: a control that cannot fail, and an
agent following the queue's own instruction into work the row forbids.

The same 300-ish bound already existed a second time, twelve lines below, as a 240-character slice
applied when the halves are stored. There it truncates for display and is harmless. One bound,
written twice, once fatally. This change removes the fatal copy and keeps the harmless one.

## Layer Impact

**Release lane: `internal-admin`.** The change ships AbarVa-only execution tooling — the generator an
operator and CI run to derive the board and the claimable queue. No client-facing surface, no
control-plane behaviour shared with clients, and no feature flag.

- **Layer 4 (products):** none. No product code, route, component, prompt, or tenant data is
  touched, and no product surface reads these files.
- **Tooling / operator reporting only:** `scripts/exec/build-source-board.mjs` derives the board
  summary; `scripts/exec/build-execution-queue.mjs` renders it. Only the parse of one declaration
  changes. Terminators, the blocker rules, claimability, rungs, and the `partialGates` roll-up shape
  are untouched.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — agent execution tooling and the generated operator queue
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/build-source-board.mjs` — `PARTIAL_GATE_DECLARATION`: each half's
  `[^\n]{1,300}?` becomes `[^\n]+?`. The terminators are unchanged, so what ends a half is what
  ended it before. The comment above it now records the measurement, and records that `tidy`'s
  240-character slice is the only length bound that should exist.
- `scripts/exec/build-source-board.test.mjs` — four cases, `C-568 (h)`–`(k)`.

No workflow file changed: `.github/workflows/execution-queue-toolchain.yml:55` already runs this
suite as a directory-free named file, so the new cases enter CI with the file they live in.

## QA / Validation

Baseline measured from a **separate clean checkout of the base commit** (`git archive origin/main
scripts/exec` into a scratch directory), not from a stash, so the before number is the base's own.

| scope | before | after |
|---|---|---|
| `scripts/exec/build-source-board.test.mjs` | 99 passed, 0 failed | 103 passed, 0 failed |
| the same suite carrying the new cases against unfixed source | 100 passed, **3 failed** | — |

Red first: `(h)`, `(i)` and `(j)` fail on the unfixed generator. `(k)` passes on both sides by
design and is labelled as a direction guard rather than a proof.

**Four mutations, three caught, one survived and was acted on.** Each mutation's sha256 of the
mutated file was compared before and after the edit and differed in every case — `git diff
--numstat` is useless here, because the mutated line is already modified against `HEAD` and the
insert/delete counts do not move.

| mutation | sha256 changed | result |
|---|---|---|
| restore the 300-char cap on the gated half | yes | **caught** — `(h)` fails, 102/1 |
| restore the 300-char cap on the claimable half | yes | **caught** — `(i)` and `(j)` fail, 101/2 |
| remove `tidy`'s 240-char display slice | yes | **caught** — `(j)` fails, 102/1 |
| narrow the character class from `[^\n]` to `[^\n\|]` | yes | **SURVIVED** — 103/0 |

The surviving mutation was a guard this change had briefly added, not a pre-existing one. Widening
the class back leaves every case green, because the trailing `(?:\|\|\n\|$)` alternation already
stops a half at the first surviving pipe. An unfalsifiable guard is the shape this directory exists
against, so the class narrowing was **reverted** and the change reduced to the cap alone. The
reasoning is recorded beside both the pattern and case `(k)` so it is not re-added.

Live effect, measured on a scratch copy of the operator root so nothing wrote to the register:
`partialGates` goes from **1 to 2**. The row that had overrun on its claimable half now carries both
halves and moves out of the whole-item owner-gated bucket into the queue's *Partly gated* section
with its claimable half named.

Full toolchain: all 15 `scripts/exec/*.test.mjs` suites run. 13 green. Two carry one pre-existing
failure each — `id-collision.test.mjs` (69/1) and `register-merge-coverage.test.mjs` (49/1) —
**identical in name and count on the clean base checkout**, so neither is caused by this change.
Both read `~/Downloads` and skip on a runner that cannot see it, so neither runs in CI.

`node scripts/exec/queue-provenance.mjs --register ~/Downloads/EXECUTION_CLAIMS.md` exits 0
(`repo_owned`) — the queue this item was taken from was written by the repo-owned generator.

Typecheck: `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`, judged by exit
code, not by grepping for `error TS`.

## Rollout Plan

Merge to `main`. No runtime rollout: the changed files are Node scripts an operator and CI run, and
nothing in the web image imports them. The generated board and queue are regenerated on the next
run of the toolchain.

## Deployment Authority

Not applicable to shared runtime. This change cannot affect Azure Container Apps, images, traffic,
flags, environment variables, worker jobs, or DNS.

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
- Shared runtime mutators: none
- Approved image digest: n/a — no runtime change
- ACA runtime invariant: unaffected; a deploy triggered by the merge is incidental to this change
- Worker image invariant: unaffected
- Feature/env flag update path: none
- Live signed-in proof required: **no** — no product file changed

## Rollback Plan

Revert the single commit. No migration, no data, no flag. The board and queue regenerate from
whichever generator is on disk, so a revert restores the previous parse on the next run.

## Audit Evidence

- The PR and its CI run, including the `Run the source board claim-record boundary contract` step in
  `execution-queue-toolchain.yml`, which executes the four new cases.
- The four mutation results and both baselines in the QA table above.
- `EXECUTION_PULSE_20260918.md` entry for item `C-568`.

## Known Gaps

1. **A declaration on a row with no derived owner gate still binds nothing, and warns nobody.**
   `scopeBlocker` consults the declaration only once a blocker rule has already matched, which is
   deliberate and directly tested — a row that merely *writes about* partial gates must not acquire
   one. The consequence is that the row measured above, whose own gated half forbids editing a named
   file, is still offered whole with no annotation after this fix, because it has no owner gate for
   the declaration to scope. Whether such a row should be reported, withheld, or left alone is a
   decision about that tested boundary and is **not** taken here. Filed as `C-569`.
2. **A parsed half can absorb one token of table text.** The corpus the parser reads is
   `title\n${acceptance} ${raw}`, and the whitespace before `Claimable half:` matches a newline, so
   a declaration whose halves sit in different cells of one row parses correctly on both halves and
   then picks up the row id from `raw`. Cosmetic, pre-existing, and unchanged by this release.
   Tightening it would change which rows are freed, which is wider than removing a cap. Recorded on
   the item.
3. **This suite is not a required status check.** `execution-queue-toolchain.yml` runs on every PR
   but `execution queue toolchain` is absent from `docs/ci/required-status-checks.json`, so the
   contract can go red without blocking a merge. Requiredness lives in the GitHub ruleset, which is
   an owner action, and that mirror file is held by another live claim at the time of writing.
   Reported, not changed.
4. No signed-in proof is owed and none was attempted; no product surface changed.
