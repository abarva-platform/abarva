# 2026-10-06-amendment-declares-its-files — an amendment to a work claim declares the files it covers

## Release ID

`2026-10-06-amendment-declares-its-files`

## Status

`candidate`

## Plain-English Summary

Agents working this repository's execution backlog record what they are working on by
appending a line to an operator-side register. That line names the files the run intends
to touch, and the claim tooling refuses a second run that names any of the same files.
The protocol says that when the file list turns out to be wrong, you **append an
amendment** rather than editing the original line.

An earlier change made a line's explicit `files:` list the whole of what it locks, so that
a path merely *mentioned* in a sentence no longer froze that file for three hours. A line
that carries no such list kept the older reading — it locks whatever path its prose names.
That residual was deliberate and is still correct: measured on the live register at
`91d90ad59f`, **303 of 1327** attributed path-holding lines carry no list, and **83** of
those are amendments. They do mean to hold what they name, and freeing them would put two
runs on one file.

The defect this change fixes is upstream of that reader: **an amendment had no way to
declare its files**, because the claim helper offered no action that wrote one. So the
careful thing to do and the declarable thing to do were different things, and the ratchet
the earlier change removed for claims still ran on amendments.

The helper now has `--action amend`. It writes a head the register's ownership reader
attributes as a hold, and `--files` is **required** on it — an amendment whose declaration
were optional is the field-less line again, written from the sanctioned path.

## Layer Impact

- **Layer 4 — Products:** none. No product surface, route, prompt, projection or tenant
  object is touched, and nothing here is built into the web image or run by any Container
  Apps job.
- **Internal agent tooling only:** `scripts/exec/append-claim.mjs`, its suite, and the
  directory's README. The consumer is an agent writing a line to a register that lives
  outside this repository.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: **yes** — backlog-execution tooling
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/append-claim.mjs`
  - `ACTIONS` gains `amend`; a new `TAKING_ACTIONS` set names the actions that take
    something (`claim`, `amend`) as distinct from those that hand work back (`release`,
    `abstain`).
  - `announcementHead` writes `AMEND item <id> claim [on branch \`<b>\`]`. The id stays
    inside the head because the ownership reader finds a line's subject there; a head that
    said only `AMEND` would write a hold nobody can see.
  - `--files` is required when the action is `amend`, and the refusal says why.
  - The two message guards that already refused a claim whose body announces a release or
    an abstention now cover an amendment, whose head likewise asserts the hold stands.
  - The file-overlap half is asked for an amendment, so a path another live claim holds
    refuses it. `release` and `abstain` stay exempt (C-564).
  - An amendment is refused unless the gate answers `already-yours`, i.e. unless a live
    claim of the same identity exists on that item.
- `scripts/exec/append-claim.test.mjs` — 13 new cases (see QA).
- `scripts/exec/README.md` — a protocol section for the amend action, including the
  decision it does **not** make.

## QA / Validation

Measured over the suite that changed, same scope both sides:

| | before | after |
|---|---|---|
| `scripts/exec/append-claim.test.mjs` | 100 passed, 0 failed | 113 passed, 0 failed |
| the new cases, against unfixed code | **10 failed** | 0 failed |

**The red-first run found a fault in the tests themselves, and it is worth recording.** On
the first red run 6 of 11 cases PASSED against unfixed code. Each reads the register's last
line, and when the amend action is refused that line is the claim the amendment was meant
to extend — which, carrying a declared list of its own, satisfies "the declared field is
the lock" by itself. The fixtures were changed so the original claim declares a *different*
path, and every dependent case additionally requires the line it reads to be the amendment.
A case that cannot fail before the fix is labelled `GUARDRAIL`, not `THE ACCEPTANCE`.

**Mutation proof — 7 mutations, one per behaviour the action promises, all killed.** Each
was applied over a pinned backup with an assertion that the pattern matched exactly once,
so a mutation that silently edited nothing could not be read as a survivor:

| mutation | suite result | T-836 cases failing |
|---|---|---|
| `amend` removed from `ACTIONS` | 102 passed, 11 failed | 11 |
| the `AMEND` head branch removed | 107 passed, 6 failed | 6 |
| the required-`--files` check disabled | 111 passed, 2 failed | 2 |
| `amend` removed from `TAKING_ACTIONS` | 112 passed, 1 failed | 1 |
| `amend` exempted from the file half | 112 passed, 1 failed | 1 |
| the `already-yours` requirement disabled | 111 passed, 2 failed | 2 |
| `amend` removed from the usage text | 112 passed, 1 failed | 1 |

Restoring the backup returns 113 passed, 0 failed.

Other checks, all from the item's own worktree:

- Every suite in `scripts/exec/`: 17 suites, **1386 passed, 0 failed**.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**,
  judged by exit code, not by grepping for `error TS`.
- `npx eslint` on both changed scripts — exit 0.
- The acceptance's "declared field is read, prose is not" is asserted through the
  register's **own** `claimedPaths`, `itemSubjects`, `announcesRelease` and
  `announcesAbstention`, imported rather than restated, and again one level up through the
  CLI gate: the declared path refuses the next run and the prose path refuses nobody.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing here is served, imported by a route, or run by
a Container Apps job. The next agent invoking the helper gets the new action.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` runs on merge as it
  does for every commit; this change contributes nothing to the image.
- Shared runtime mutators: none.
- Approved image digest: not applicable — no runtime change is asserted by this record.
- ACA runtime invariant: unaffected.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: **no** — there is no product surface to walk.

## Rollback Plan

Revert the commit. The action disappears and the helper's other three actions are
untouched; no register line already written becomes unreadable, because an `AMEND`-headed
line carrying a `files:` field is read by the existing reader with no help from this change.

## Audit Evidence

- The pull request and its CI run.
- `node scripts/exec/append-claim.test.mjs` — the 13 `T-836` cases.
- The mutation table above, reproducible by re-applying each pattern over a backup.

## Known Gaps

- **A protocol decision is owed and is deliberately not made here:** whether an
  amendment's declared list REPLACES or ADDS TO the list of the claim it amends. Both lines
  are live and each contributes its own declared paths, so the effect today is ADD-TO —
  that is a description of the current reader, not a ruling. Replace is the simpler rule
  and silently frees files the original claim holds; add-to matches what amendments are
  used for. This is the gated half of the backlog row and belongs to the register's owner.
- **The prose fallback stays, and its pinning case is untouched.** It cannot be removed
  until the decision above is made, and removing it is a separate change with its own
  measurement. 303 field-less path-holding lines remain, unchanged by this release: this
  change gives future amendments a declaration, it does not retrofit one onto past lines.
- **The figure in the backlog row does not reproduce.** The row states 170 field-less
  path-holding lines, measured at `3731a69714`. Three readings of the live register at
  `91d90ad59f` give 303 (lines the register's own parser attributes), 434 (every line in
  the file) and 240 (attributed lines holding at least one `file`-kind path); none is 170.
  The register has only grown since, so the count can only have risen. The number quoted
  throughout this record is the first of those three, and the definition is stated with it.
