# 2026-09-22-t712-claim-helper-announcement-verb — Execution register: the claim helper writes the verb its own reader parses

## Release ID

`2026-09-22-t712-claim-helper-announcement-verb`

## Status

`candidate`

## Plain-English Summary

The repository keeps an append-only register of which automated run is working on which item
and which files. Two controls read that register: one answers "may this run take this item",
the other answers "is another run already on one of these files". A helper script is the
sanctioned way to append a record, and it runs both controls before it writes anything.

Three defects meant the sanctioned path could not do its job. All three were found by running
the controls against the live register, not by reading the code.

1. **The helper asserted a word the record denied.** Every record it wrote opened with the
   literal `item <id> claimed`, regardless of what the operator's message said. The register's
   ownership grammar turns on exactly that opening word. So a record handing work back —
   "released, merged, all files free" — was still written as a claim, and the file control kept
   reporting it as the holder of files that had already been handed back. Measured on the live
   register: a request for those files was refused with **6 contended**; after this change the
   same request on the same register returns **0 contended**.

2. **The file control could not run through the helper at all.** The helper deliberately
   refuses to forward a flag that the installed control does not advertise in its own usage
   text, because an unrecognised flag is silently ignored and the check would appear to pass
   without running. The control's usage text never listed its file flag. From the moment the
   helper was wired up, one-owner-per-file was unenforced on the sanctioned path.

3. **A decision *not* to take an item was read as taking it.** The file control has skipped
   those records since it was written; the item control never did.

The fix makes the writer emit the announcement verb the reader already parses, refuses to
compose a record whose opening word contradicts its own body, and teaches the reader to see
past the one machine-generated prefix already present in records that cannot be rewritten —
the register is append-only by design.

## Layer Impact

**Release lane: `internal-admin`** — AbarVa-only operator tooling. No client-facing surface and
no data plane is involved, so neither `global-control-lane` nor `client-data-lane` applies.

- **Platform tooling / CI only.** `scripts/exec/*` are operator controls for the execution
  register. Nothing under `src/` imports them, so no product layer, tenant dataset, canonical
  model, or product surface is touched.
- Canonical model, adapters, intake and all seven product surfaces: unchanged.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: **yes** — operator tooling for the execution register
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/append-claim.mjs` — `--action claim|release|abstain`; the record's opening verb
  is composed from the action in the grammar the reader parses; an unknown action is a usage
  error rather than a silent fallback to `claim`; a message whose own opening announces a
  release or an abstention is refused under `--action claim`, naming the flag that fixes it; an
  abstention is still recorded when the control refuses, because an abstention takes nothing.
- `scripts/exec/register-time-authority.mjs` — the file flag is advertised in the `--preclaim`
  usage text; `messageField()` reads past the helper's generated prefix; abstentions are
  skipped when selecting the live records for an item.
- `scripts/exec/append-claim.test.mjs`, `scripts/exec/register-time-authority.test.mjs` — new
  behavioural coverage, listed below.
- This release record.

## QA / Validation

Baselines and results measured over the same scope, on `origin/main` `271e22007`.

| suite | before | after adding the new cases (red) | after the fix |
|---|---|---|---|
| `node scripts/exec/append-claim.test.mjs` | 26 passed / 0 failed | 31 passed / 12 failed | **50 passed / 0 failed** |
| `node scripts/exec/register-time-authority.test.mjs` | 90 passed / 0 failed | — | **99 passed / 0 failed** |

Both suites already run in CI (`.github/workflows/execution-queue-toolchain.yml`).

**Movement on the live register**, same request before and after, file control only:
**6 contended → 0 contended**.

**Mutation testing — 14 mutations, 13 caught.** Each guard was broken deliberately and the
suite re-run:

- release verb → claim verb: 3 failures
- abstention verb → claim verb: 5 failures
- file flag removed from the usage text again: 6 failures
- item control stops skipping abstentions: 2 failures
- release/claim mismatch guard removed: 3 failures
- abstention/claim mismatch guard removed: **survived at first (47/0)** — the release half was
  covered and the abstention half was not. A case was added rather than the guard deleted;
  the mutation now produces 3 failures.
- unknown action falls back to `claim`: 1 failure
- abstention no longer survives a refusal: 2 failures
- action never reaches the record: 8 failures
- prefix reader disabled: 3 failures
- prefix reader dropped from the release predicate: 2 failures
- prefix reader dropped from the abstention predicate: 1 failure
- prefix pattern's mandatory verb made optional: **survived at first** — a negative control was
  added; the mutation now produces 1 failure.
- prefix pattern's `^` anchor deleted: **SURVIVES, and is reported rather than counted as
  proven.** `String.replace` with a non-global pattern removes one match in place, so a
  mid-sentence strip leaves the preceding text standing and the result still does not *open*
  with the announcement verb. No test can distinguish the anchored form from the unanchored
  one through these predicates. The anchor is kept as a statement of intent and the limitation
  is written into the test file beside it.

Other checks: `npx tsc --noEmit` exit **0**, zero diagnostics (run with
`NODE_OPTIONS=--max-old-space-size=6144`, and judged by exit code — a bare run exits 134 on
this machine). `npx eslint scripts/exec/` exit **0**. `node scripts/release-check.mjs
--base origin/main --head HEAD` — see Audit Evidence.

## Rollout Plan

Merge to `main`. No runtime rollout: these are developer-machine and CI scripts, invoked by
operators and by the execution-queue toolchain workflow. No image build, no Container App
update, no migration, no flag.

## Deployment Authority

Not applicable — this change cannot affect Azure Container Apps, deploy workflows, runtime
images, flags, environment variables, worker jobs, traffic, DNS, or environment promotion.

- Repo-owned deploy workflow: not invoked by this change
- Shared runtime mutators: none
- Approved image digest: n/a
- ACA runtime invariant: n/a
- Worker image invariant: n/a
- Feature/env flag update path: n/a
- Live signed-in proof required: **no**, and the reason is structural rather than a judgement —
  nothing under `src/` imports `scripts/exec/*`, so no signed-in surface can exercise this code.

## Rollback Plan

Revert the squash commit. The two scripts are self-contained and have no consumers outside
`scripts/exec/` and the execution-queue toolchain workflow; reverting restores the previous
behaviour with no data or schema implications. Records already appended to the register are
plain text and are unaffected either way — the register is append-only and nothing here
rewrites it.

## Audit Evidence

- PR URL and CI run: recorded on the pull request.
- `execution-queue-toolchain` workflow — the job that runs both suites.
- The before/after contention figures above are reproducible with
  `node scripts/exec/register-time-authority.mjs --preclaim --file <register> --item <id>
  --identity <base-agent#run-id> --files <list>` on a register containing a helper-written
  release inside the three-hour window.

## Known Gaps

- The surviving `^`-anchor mutation, described under QA / Validation. Reported, not counted.
- A record that genuinely claims one item while *opening* its message with a release of a
  different item would now be read as a release. The writer refuses to compose that record, so
  the remaining route to it is an operator hand-writing a record against the protocol. The
  limit is documented in the source beside the pattern.
- A release still frees only the records of the identity that wrote it, and a release by one
  identity of another identity's item is still honoured by the item control. That asymmetry
  predates this change and is filed separately rather than widened here.
- Records already in the register keep their original text. The reader-side repair is what
  makes them behave correctly; nothing is restamped.
