# 2026-09-23-t747-path-attribution-right-governing — Claim gate reads an attribution written behind a file path

## Release ID

`2026-09-23-t747-path-attribution-right-governing`

## Status

`candidate`

## Plain-English Summary

Agents working this repository claim the files they are about to edit by appending a line to an
operator-side register, and a pre-claim gate refuses a second agent that asks for a file somebody
else is already holding. The gate reads each register line in prose, because most lines name their
files in a sentence rather than in a structured list.

That reader only looked at the words **in front of** a path. The register routinely writes the
other order — it names a file and then says, behind it, whose it is: *"it lands in `<file>`, which
`<other item>` has held since 17:43"*. Read front-first, a sentence that goes out of its way to
say the writer is **not** taking a file was recorded as taking it, and the gate then refused the
next agent that legitimately asked for it.

This change gives the path reader the missing direction: an attribution written behind a path now
hands the path to the holder it names, in the same way an attribution written in front of it
already did. It also publishes, as data the test suite recomputes, a comparison of every cue the
gate reads for the two kinds of subject it understands — item ids and file paths — so the next
asymmetry between them fails a test instead of being discovered by a refused claim.

Nothing about tenant data, product surfaces, authentication or the data plane is touched. This is
agent execution tooling only.

## Layer Impact

Release lane: `internal-admin`. This is AbarVa-only execution tooling — the gate that keeps two
agent runs off one file — and it ships no client-visible capability.

None of the four layers of the enterprise information architecture is affected. Client intake,
source adapters, the canonical model and every product surface are untouched. The change is
confined to `scripts/exec/`, the coordination tooling agents use to avoid two runs editing one
file, which is repo infrastructure rather than product code.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — agent execution tooling and its CI gate
- Public/demo only: no
- Feature flag: none; the control runs unconditionally in the
  `execution-queue-toolchain` workflow

## Changes Included

- `scripts/exec/register-time-authority.mjs`
  - New right-governing attribution veto for path mentions: `PATH_TAIL_HOLDER`,
    `PATH_TAIL_HOLDING_VERB`, `PATH_TAIL_ATTRIB_SUBJECT`, `PATH_TAIL_ATTRIB_AGENT`,
    `PATH_TAIL_ATTRIBUTION_REACH_TOKENS`, `pathAttributionTail`, `attributesPathListAway`,
    consulted by `claimedPaths`.
  - New exports `CUE_SURFACE`, `CUE_SURFACE_SUBJECTS`, `recomputeCueSurface` and
    `cueSurfaceDivergences` — the two subjects' cue comparison, as data.
  - `disclaimsPathList` (T-725), `PATH_ATTRIBUTIVE` (T-710), `negatesPathList` and the whole item
    half are unchanged, so any movement is attributable to the new veto alone.
- `scripts/exec/register-time-authority.test.mjs` — 32 new cases.
- This record.

## QA / Validation

Baseline and result over the same scope, `node scripts/exec/register-time-authority.test.mjs`:

| | suite |
|---|---|
| clean baseline on `origin/main` `f11b9d66d` | 258 passed, 0 failed |
| with the new cases and the fix | 290 passed, 0 failed |

**Red first.** With the new cases present and the veto not consulted, **11 fail**; with the fix,
**0 fail**. The red run is the one that matters: the real known positive, all seven live clause
shapes and the recomputed cue table are all among the eleven.

**Measured on the live register, not on fixtures.** Running `claimedPaths` from both the
`origin/main` module and this one over every line of the operator register: the veto frees
**8** `(line, path)` holds and creates **zero**. Each of the eight is a sentence reporting where
another lane already is; four name a file the writing run said explicitly it was not taking.

**End-to-end through the CLI, before and after, on the real register at the moment of the original
refusal** (`--now 2026-09-23T20:35:00Z`): `2 contended` → `1 contended` for the requested path.
The hold that disappears is the disclaiming sentence. The hold that REMAINS is a different line's
genuine `files:` list, and it must remain — this change removes a false holder, it does not free a
real one.

**Mutation testing — eight deliberate breaks, eight caught:**

| # | mutation | failing cases |
|---|---|---|
| 1 | holder no longer required before the verb | 3 |
| 2 | the copula made mandatory again | 4 |
| 3 | reach narrowed from 8 tokens to 6 | 1 |
| 4 | the subject pattern loses its anchor | 1 |
| 5 | the agent pattern loses its anchor | 2 |
| 6 | backticked spans no longer collapsed | 2 |
| 7 | a table cell declares coverage it does not have | 2 |
| 8 | the veto is never consulted | 12 |

**Three mutations SURVIVED and each was acted on rather than reported.** Every one was first
checked against the live register to prove it was a no-op and not a coverage gap:

- deleting `has held` from the verb list differed on **0** register lines — the auxiliary is
  already absorbed by the filler slot, so the alternative was dead vocabulary and was **removed**;
- the tail's clause-break cut and its path-ends-the-reach rule each differed on **0** lines, and
  both were **removed** as unreachable: the patterns are anchored, so the anchor was doing that
  work. The suite now pins the anchor, which mutations 4 and 5 confirm.

Item acceptance said the reach was one thing and measurement said another; measurement won and the
correction is recorded in the code. A first draft bounded the reach at 6 tokens and silently left
one genuine live attribution holding, at token 8. A sweep at 4, 5, 6, 7, 8, 9, 10, 12, 16 and 24
tokens found it; no fixture would have.

Sibling suites in the same directory, all green and unchanged: `append-claim` 50, `cli-entry` 19,
`fossil-claims` 78, `id-collision` 70, `queue-provenance` 30, `toolchain-manifest` 17,
`worktree-retention` 22, `build-execution-queue` 171, `build-source-board` 35.

`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, 0 `error TS`
(the exit code is judged, not a grep over the output).
`npx eslint` over both changed files — exit 0.
`node scripts/release-check.mjs --base origin/main --head HEAD` — see Audit Evidence.

## Rollout Plan

Merge to `main`. The control is a repo-owned Node script run by the `execution-queue-toolchain`
workflow; it takes effect for the next agent run that invokes the pre-claim gate. There is no
runtime rollout: no image, no migration, no environment variable, no feature flag, no product
surface. The Azure Container Apps deploy that main merges trigger will carry the commit as it
carries every other, but nothing in this change executes in that runtime.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged by this release
- Shared runtime mutators: none; no `az` command is run by or for this change
- Approved image digest: not applicable — no runtime code path is modified
- ACA runtime invariant: unaffected; asserted by the main deploy workflow as usual
- Worker image invariant: unaffected
- Feature/env flag update path: none
- Live signed-in proof required: **no** — nothing here renders on a product surface, and claiming
  a signed-in acceptance for a shell script would be a false proof

## Rollback Plan

Revert the commit. The control is stateless and reads an operator file it never writes, so a
revert restores the previous behaviour immediately with no migration, no cache and no data to
undo. The only consequence of reverting is that the gate resumes reporting a false holder for the
handful of register lines that attribute a file behind rather than in front of it.

## Audit Evidence

- PR: recorded on merge
- CI: `execution-queue-toolchain` workflow run on the head SHA, step
  `node scripts/exec/register-time-authority.test.mjs`
- Red-first and mutation numbers: reproduced by the commands in QA / Validation above; every one
  runs offline from a temp-directory fixture and needs no credentials
- The live-register measurements read an operator-side file that is not in this repository and is
  not available to CI; the suite therefore proves the same behaviour from a committed byte copy of
  the real line, with the source line's sha256 recorded beside it, and reports the live check as
  not-run rather than counting it as a pass when the file is absent

## Known Gaps

- The item half of the gate still has **no** right-governing attribution veto. It is not repaired
  here — the register has never written that shape for item ids, so nothing would constrain it.
  It is published as the single open cell of `CUE_SURFACE` and asserted by name, so it is a row in
  a table rather than a surprise.
- The two halves still bound their FRONT cues in different units — the item half in words, the
  path half in characters. A character bound cannot cross the full stop inside a filename, so the
  path half's front cues reach only as far as the first path of a list. Recorded in
  `CUE_SURFACE` as `unit`; repairing it moves live holds and belongs to its own item.
- A front-position `has held` is still not read. All three occurrences on the register sit behind
  the path, so widening the front cue for it would be unconstrained by any corpus.
