# 2026-09-23-t710-path-attributive-veto — The claim gate stops reading a narrated file list as a hold

## Release ID

`2026-09-23-t710-path-attributive-veto`

## Status

`candidate`

## Plain-English Summary

Two agent lanes work this repository at the same time, and the rule that keeps them
apart is one-owner-per-file. Before an agent edits anything it asks a gate whether
any other live claim already holds the files it wants. The gate reads those file
lists out of ordinary prose, because most claim records do not use a structured
list.

Reading prose has a cost, and this is one instance of it. When a lane surveys the
register before choosing what to touch, it writes down the other lanes' files in
order to say whose they are — "(`other-lane`, which lists `some/file.json`)",
"that sibling holds `some/other/file.mjs`". The gate had no way to tell that form
apart from a claim, so the surveying lane was recorded as holding files it had
just finished explaining it was staying off. The next agent to ask for one of
those files was refused, and had to go read the record by hand to discover the
refusal was spurious.

This change teaches the gate that cue. A file named right after an attributive
phrase — "which names", "which lists", "held by", "claimed by", "that sibling
holds" — is being attributed to somebody else, not claimed. A file named any
other way still counts as held, including on the same record.

The rule is deliberately narrow in one direction. Being too strict costs a reader
one unnecessary look at a named record; being too loose would free a file somebody
is genuinely editing, which is a collision. So the cue only fires when the phrase
names a third party. A record that writes the same verb about itself —
"this claim holds `x`" — still holds `x`.

## Layer Impact

**Release lane: `internal-admin`.** AbarVa-only execution tooling; no client-facing
surface, no control-plane behaviour, no data plane.

- **Layer 4 (Products):** none. No product surface, route, component or tenant
  read path is touched. Nothing under `src/` imports `scripts/exec/*`.
- **Layer 3 (Canonical model):** none. No schema, migration, read model or
  tenant data is read or written.
- **Execution toolchain (outside the four-layer model):** the pre-claim ownership
  gate used by agent lanes before they edit files. Advisory tooling only; it does
  not gate CI, deploys or product behaviour.

## Client Applicability

- All clients: none.
- Specific clients: none.
- Internal only: yes — agent execution tooling only.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/exec/register-time-authority.mjs` — adds `PATH_ATTRIBUTIVE` and the
  `attributiveReach` helper, and applies the veto inside `claimedPaths`. The path
  tokeniser (`PATH_TOKEN`) and `normalisePath` are deliberately unchanged, so the
  measured movement is attributable to the veto alone.
- `scripts/exec/register-time-authority.test.mjs` — twelve new assertions covering
  both live forms, the two fixture-only forms, the false-pass guard and the reach
  boundary.
- This record.

## QA / Validation

Measured against a clean baseline over the same scope, on the same machine.

**The suite.** `node scripts/exec/register-time-authority.test.mjs`

- Baseline on `origin/main` (`50b4abee0`): **99 passed, 0 failed**.
- With the new cases and no fix: **105 passed, 6 failed** — the six that name the
  defect.
- With the fix: **111 passed, 0 failed**.

An earlier draft of these cases passed without the fix, because the fixture
records were stamped outside the suite's fixed liveness window and were therefore
filtered out before any rule ran. The positive controls in the same block caught
it. The stamps were corrected; the numbers above are from the corrected cases.

**Sibling suites, unchanged by this work and re-run to prove it:**
`append-claim.test.mjs` 50/0, `build-execution-queue.test.mjs` 140/0,
`build-source-board.test.mjs` 23/0.

**Mutation testing — eight deliberate breaks, eight caught.** Each guard is
independently load-bearing; no guard is absorbed by another.

| # | Mutation | Result |
|---|---|---|
| M1 | veto removed entirely | 7 failed |
| M2 | relative-clause alternative (`which names`) removed | 3 failed |
| M3 | third-party-subject alternative (`sibling holds`) removed | 2 failed |
| M4 | explicit-agent alternative (`held by`) removed | 2 failed |
| M5 | `attributiveReach` made a no-op | 1 failed |
| M6 | a backticked path no longer ends the cue's reach | 1 failed |
| M7 | reach widened past the sentence boundary | 2 failed |
| M8 | third-party requirement dropped (any subject + verb) | 3 failed |

**Movement on the real register, not on a fixture.** The item asks for the
before/after count of live records read as holding a path. Measured over one
snapshot with the pre-change module and the post-change module, at the two
three-hour windows in which each known positive is live:

| Window ends | live records | records read as holding a path | record x path holds | distinct paths |
|---|---|---|---|---|
| 21:35Z | 69 | 18 -> 18 | **45 -> 44** | 35 -> 35 |
| 00:30Z | 57 | 20 -> 20 | **47 -> 46** | 38 -> 38 |

The two holds that disappear are exactly the two real known positives, one in
each window: a survey record that attributed a generated census file to another
lane, and a second that attributed this very script to a sibling run. No hold was
added. Contended-path counts are unchanged in both windows (3 -> 3 and 6 -> 6),
because other records hold those same paths legitimately — reported as measured
rather than rounded up into a headline.

**The choice between the item's two options was settled by measurement.** The
alternative repair was to read only each record's own structured list. That needs
a majority of live records to carry one; re-measured on the live register, **9 of
62 do**. A structured-list-only parser would stop reading the paths the other 53
name in prose, which is a false pass — a collision rather than a look. Option
(a) was taken on that evidence.

**Typecheck:** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty
false` — **exit 0**, judged by exit code, not by grep.
**Lint:** `npx eslint` on both changed files — exit 0, no findings.

## Rollout Plan

Merge to `main`. No runtime rollout: these are developer-side scripts and nothing
under `src/` imports them, so no image content changes and no deploy is required
for the change to take effect for the agents that run it.

## Deployment Authority

- Repo-owned deploy workflow: not exercised by this change.
- Shared runtime mutators: none. No `az` command of any kind was run.
- Approved image digest: not applicable — no runtime image content changes.
- ACA runtime invariant: not asserted and not claimed by this record.
- Worker image invariant: not asserted and not claimed by this record.
- Feature/env flag update path: none.
- Live signed-in proof required: **no**, and the reason is structural rather than
  a deferral — nothing under `src/` imports `scripts/exec/*`, so no signed-in
  surface can observe this change.

## Rollback Plan

Revert the PR. The change is two additions inside one exported function in one
script; reverting restores the previous reading exactly. No migration, no state,
nothing to unwind.

## Audit Evidence

- PR and its CI run, including the `Execution queue behavioral contract` job,
  which runs the register time-authority suite in the hosted tree.
- The before/after and mutation figures above, each reproducible by running the
  named commands against `origin/main` and against this branch.

## Known Gaps

- **Postfix attribution is not covered.** The veto inherits the backwards-looking
  reach discipline of the existing negator rule, so a record writing
  `` `a.mjs` is held by X `` — the verb *after* the path — still reads as a hold.
  Stated as a limit rather than asserted away.
- **Two of the four attributive forms are proven by fixture only.** `held by` and
  `claimed by` do not appear in front of a path anywhere in today's live window.
  They are named in the item's acceptance and are implemented and tested, but the
  evidence for them is a fixture, not an observation.
- **This does not repair the sibling defect in the item half of the gate.** That
  item is open and unclaimed; it is not touched here, so the movement measured
  above is attributable to this veto alone.
