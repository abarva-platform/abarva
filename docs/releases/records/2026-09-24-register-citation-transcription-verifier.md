# 2026-09-24-register-citation-transcription-verifier — Verify the toolchain's hand-copied register citations

## Release ID

`2026-09-24-register-citation-transcription-verifier`

## Status

`released`

## Plain-English Summary

One of our internal engineering control suites proves its rules against text copied by hand out of
an operator log — a comment naming a line number, and the quoted text beside it. The copying is
deliberate: that suite must not read the operator log directly, because a check that takes its
truth from the thing it is checking cannot fail. But nothing ever confirmed that the copies still
matched, so they were unverified transcriptions of a file sitting right there.

This adds a small local verifier that answers that question, and running it for the first time
found that the copies have all gone stale together. Of 22 citations in the suite, **one** still
pointed at the line it named — and only on a weak tie-break — while **18** pointed four lines short
of their target, every one of them off by exactly the same four. A single shared offset is not
gradual decay; it is one write near the top of an append-only file shifting everything below it.

The item was filed as preventative, on an earlier hand-check of seven citations that all still
matched. Between that check and this one, every one of them moved. That correction is the main
finding of this change; the tool is what makes it discoverable next time instead of accidental.

## Layer Impact

**Release lane: `internal-admin`.** This is AbarVa-only engineering control tooling — a local CLI an
agent runs beside `--preclaim`, plus its CI-run suite. No client, demo or public surface consumes it.

- **Layer 4 — Products:** none. Nothing here is imported by the application or reachable from any
  product route.
- **Engineering control plane (not a numbered data layer):** one new local CLI plus its behavioural
  suite under `scripts/exec/`, and one new step in an existing CI workflow.

No tenant data, no canonical model object, no adapter, no intake tab is touched.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: **yes** — engineering control tooling only
- Public/demo only: no
- Feature flag: none

## Changes Included

| path | what |
|---|---|
| `scripts/exec/register-citation-check.mjs` | new local verifier: resolves each `LIVE_<n>` fixture against the operator register and reports drift |
| `scripts/exec/register-citation-check.test.mjs` | 22-case behavioural suite, entirely synthetic |
| `.github/workflows/execution-queue-toolchain.yml` | runs the suite; deliberately does **not** run the verifier |
| `docs/releases/records/2026-09-24-register-citation-transcription-verifier.md` | this record |

No file in `scripts/exec/` needed a manifest update: `toolchain-manifest.mjs` derives the toolchain
from the directory rather than from a list, so the new module is picked up by every fixture without
anyone remembering to add it.

### Three design choices worth stating, because each one was the difference between a useful report and a green one

1. **The identifier is the citation, not the comment.** Every fixture is written
   `const LIVE_<n> = "..."`, and the number in the identifier is the line it claims. The prose
   comment above says the same number in six different sentence shapes. Reading the identifier is
   one rule that cannot go stale against a seventh shape.
2. **Literal segments are scored individually.** A fixture is usually a concatenation and frequently
   an *elided* one — two spans joined across a cut that are not adjacent in the register. Matching
   the joined string finds nothing and would report a perfectly good citation as missing.
3. **`unlocatable` is its own verdict, and `--strict` refuses it.** A probe that finds nothing has
   verified nothing. Folding that into "resolves" is the one way this verifier could have reported
   green over a fully drifted corpus.

A fourth was added after the first live run: a resolve won on a **tie** now names the rival lines it
beat. The single passing citation in the live corpus is a 1-of-3 match whose rivals include the same
`+4` line as every drifted row, and a bare `ok` beside eighteen failures would have been read as the
one citation that is fine.

## QA / Validation

### Baseline, same scope, before and after

`scripts/exec/register-citation-check.test.mjs` did not exist before this change, so the honest
baseline is the suite it sits beside in the same workflow job. Measured in this worktree on
`origin/main` `1b6b811fe`:

| scope | before | after |
|---|---|---|
| `node scripts/exec/register-citation-check.test.mjs` | file absent — `ERR_MODULE_NOT_FOUND` | **22 passed, 0 failed** |
| `node scripts/exec/register-time-authority.test.mjs` | unchanged by this PR | unchanged by this PR |

### The test failed first

The suite was written and run before the module existed; it failed to load
(`ERR_MODULE_NOT_FOUND` on `register-citation-check.mjs`). One case had to be corrected before
implementation because it contradicted another: case 7 originally placed a duplicate at the cited
line and expected `ambiguous`, which case 8 requires to be `resolves`. It was rebuilt so neither
candidate is the cited line, which is the only shape in which the verifier genuinely cannot decide.

### Seven mutations, seven caught

Each was applied to the implementation alone and the suite re-run:

| mutation | cases that failed |
|---|---|
| drop the cited-line tie-break | 4, 8, 10, 11 |
| count `unlocatable` as `resolves` | 6 |
| `MIN_SEGMENT_LENGTH` 16 → 1 | 9 |
| `nothingToVerify` hard-coded false | 14, 15 |
| `--strict` always returns 0 | 18 |
| claim a uniform delta when deltas differ | 13 |
| drop the tie-break note from the report | 11b |

No mutation survived. The suite was restored and re-run green (22/22) after each.

### The live measurement — this is the finding

`node scripts/exec/register-citation-check.mjs`, run 2026-09-24 against the operator register at
2322 lines, before this run's own claim line was appended:

```
22 citations: 1 resolve, 18 drifted, 0 ambiguous, 3 unlocatable
Every drifted citation is off by the same +4.
```

The one resolve is `LIVE_2075`, at 1 of 3 segments, won on a tie-break whose rival candidates
include `2079` — the same `+4`. So **no citation in the suite is confirmed at its cited line by a
majority of its segments.**

The three unlocatable ones (`LIVE_1737`, `LIVE_421`, `LIVE_278`) are reported as verifying nothing
rather than as passing. `LIVE_278` quotes a single 1-segment fragment; the other two quote spans
that no longer appear verbatim. Whether each has drifted or been reworded is not decidable from the
text and the verifier does not guess.

**Cause, stated as far as the evidence goes and no further:** the offset is uniform, which is
consistent with one write above the register's body rather than with independent edits. The head of
the register does show claim lines at lines 3–7 sitting above the header prose that the file's own
`Format:` section places first. The exact arithmetic of which four lines produced a net `+4` is not
established here and is not asserted.

### Not run, and why

`--strict` against the live register exits 1 by design right now, because the corpus has drifted.
That is a report, not a build failure: nothing in CI invokes the verifier.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds and deploys as usual. There is no
runtime behaviour change to roll out — no module here is imported by the application — so the deploy
is the standard pipeline rather than an activation step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unmodified by this PR
- Shared runtime mutators: none — this PR runs no `az` command and changes no Container App template
- Approved image digest: whatever the repo-owned workflow produces for the merge SHA
- ACA runtime invariant: proven from the deploy run's own `runtime-invariant-proof.json`, recorded
  in the claim register as a per-item line
- Worker image invariant: unchanged; same digest assertion as the web app
- Feature/env flag update path: not applicable
- Live signed-in proof required: **no** — and this is a deliberate statement rather than an
  omission. Nothing in this change is imported by the application or reachable from a product
  route, so a signed-in lane would manufacture a proof that does not exist.

## Rollback Plan

Revert the PR. The two new files are additive and imported by nothing else; the workflow change is
one appended step. No migration, no data, no runtime state.

## Audit Evidence

- PR and squash SHA, recorded in `EXECUTION_CLAIMS.md` against item T-718
- CI: the `verify` job of `execution-queue-toolchain.yml`, step *Run the register-citation
  transcription verifier contract*
- The live measurement above, reproducible with
  `node scripts/exec/register-citation-check.mjs` on a machine with an operator register
- Deploy run id, revision and digest, appended to the register as a per-item line

## Known Gaps

1. **The 18 drifted citations are not corrected in this change, deliberately.** Correcting them
   means renaming identifiers and rewriting comment prose in 18 places across a 3,800-line suite
   that is this toolchain's most important — a larger and riskier diff than the tool itself, in the
   exact shape ("a large diff nobody reads") that this backlog exists against. The measurement is
   now reproducible in one command, which is what the correction needs in order to be reviewable.
2. **No new backlog id was minted for that correction.** The Claude Code `T-500`–`T-599` band is
   exhausted at 0 of 100 free, and taking a number from it would collide with one already spent.
   The recommendation to extend the band is already open and is not re-filed here. The correction is
   recorded as a verdict paragraph under T-718 in the backlog instead.
3. **The verifier reads one fixture convention.** A transcription written any way other than
   `const LIVE_<n> = "…"` is invisible to it. That is a deliberate floor, not an oversight: the
   alternative is a prose cue table, which this directory already has two open items about.
4. **Nothing prevents the next write above the register's body.** This reports the consequence; it
   does not constrain the writer.
