# 2026-09-23-t745-queue-omits-unplaceable-ids — the work queue's census now accounts for the ids it was never given

## Release ID

`2026-09-23-t745-queue-omits-unplaceable-ids`

## Status

`candidate`

## Plain-English Summary

The generated work queue prints a short table explaining how it arrived at the number of items
available to pick up: *"N items enter the filter; each row says what the next rule removed."* That
table was built so that a count of zero could not be confused between an empty backlog and a single
over-eager filter — two states that look identical and imply opposite next moves.

The promise was false at the very top of the table. The queue's population is assembled only from
items the structure map places on a stage or a track. An item the map does not place is dropped
**before** that population exists, so it was never one of the N, and no row in the table said a drop
had happened. Measured against the live working documents, 16 identifiers were in that state while
the table opened at 424 — a true population of 440, with none of the 16 named anywhere in the
160-line file.

The upstream generator does report them: on its error stream, and by returning a failure status.
Neither reaches the queue file, which is the one the working protocol points every operator and
agent at, closing with *"Do not ask which item is next — this file answers that."* The failure
status carries no information on its own either, because a newly filed item is unplaced from the
moment it is filed and placing it requires a code change — so that status is effectively always
failing, and an always-failing signal is read as noise.

After this change the table opens at the full population, its first row is the drop, and the ids are
named underneath with the file an operator has to edit to place them. The row renders on every run,
including when the count is zero, so it is not a branch that only ever runs in the broken case. If
the upstream generator ever stops recording that count, the row reads **not recorded** rather than
**0** — a missing measurement is not a clean one.

**Out of scope, deliberately.** Whether an unplaced identifier should *fail* the upstream generator
is an owner decision recorded elsewhere and is untouched here. Placing the current 16 is also not
this change: it would leave the defect exactly as it is, because the next filing is unplaced within
the hour and the file would go back to overstating its own coverage in silence.

## Layer Impact

**Release lane: `internal-admin`.** This is AbarVa-only delivery tooling. It is not
`global-control-lane`: no shared application or control-plane behaviour changes, and nothing a
client can reach is touched.

- **Layer 4 — Products:** none. No product surface, route, component, prompt, agent, or answer path
  is touched. No tenant-facing text changes.
- **Layer 3 — Canonical model:** none. No schema, migration, projection, read model, or tenant data.
- **Layer 2 — Source adapters:** none.
- **Layer 1 — Client intake:** none.
- **Delivery tooling (outside the four layers):** the two changed files are the internal work-queue
  generator and its behavioural suite. Their only output is a planning document for the delivery
  team; nothing reads it at runtime.

## Client Applicability

- All clients: no.
- Specific clients: none.
- Internal only: **yes** — internal delivery planning tooling only.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/exec/build-execution-queue.mjs` — the census opens at the full population the upstream
  summary describes; a first row accounts for identifiers that summary could not place; the
  identifiers are named with the file to edit; an absent count renders as `not recorded`.
- `scripts/exec/build-execution-queue.test.mjs` — five behavioural cases driving the two real
  generators over synthetic documents.

No production source file, dependency, workflow, image, environment variable, or flag changed.

## QA / Validation

**Re-verified before any edit, by executing both generators rather than reading them.** The
upstream summary recorded 16 unplaced identifiers; the queue's population was 424; the
intersection of the two was empty; the true population was 440; the string `unmapped` occurred
nowhere in the queue generator and nowhere in the rendered 160-line file.

**Baseline over the same scope, same command.** `node scripts/exec/build-execution-queue.test.mjs`
— **166 passed / 0 failed / 2 skipped** before, **171 passed / 0 failed / 2 skipped** after. The
whole delta is the five new cases. The 2 skips are pre-existing and unrelated (an empty live bucket,
counted as a skip rather than a pass).

**Red first, and the number is recorded both ways.** With the cases added and no fix:
**5 failed**. With the fix: **0 failed**.

**One case was vacuous when first written, and it is recorded rather than smoothed over.** The
clean-corpus case asserted the row's *count* and its *position* only. In a one-item fixture the
pre-existing first row removes nothing, so `0 === 0` held and the running total already equalled the
population — the case passed against the exact defect it exists to catch. Every assertion now
identifies the row by its **label**.

**Truth comes from the other program, not from the subject.** Each case reads the expected drop
count and population out of the upstream generator's own summary file and compares them with the
rendered document. Nothing asks the queue generator whether it believes its own population is
complete.

**5 deliberate breakages, 5 caught, each by the case that names it** (baseline restored to 171/0/2
after each):

| mutation | case that failed |
|---|---|
| the census opens at the population the queue assembled — the behaviour before this change | the census opens at the full population |
| an absent upstream count is treated as zero | an absent count renders as not recorded |
| the row renders only when the count is non-zero | a fully placed corpus still renders the row, at zero |
| the count renders but the identifiers are not named | the queue names the identifiers |
| the row removes the identifiers but leaves the running total unreduced | the first removal row closes the arithmetic |

**Sibling suites in the same directory, unchanged, all green:** toolchain manifest 17/0; fossil
claims 78/0/2; queue provenance 30/0; CLI entry 19/0; board generator 35/0; register time authority
258/0; claim append 50/0; id collision 70/0/0; worktree retention 22/0.

**Toolchain:** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` **exit 0**,
judged by exit status rather than by grepping output. `npx eslint` on both changed files **exit 0**.
`node scripts/release-check.mjs --base origin/main --head HEAD` run before opening the pull request.

**Live measurement after the change**, against the real working documents: the rendered census opens
at **440**, its first row removes **16** leaving **424**, and all 16 identifiers are named. The
remaining rows and the resulting count of available work are byte-identical to before.

**A limitation found while measuring, named here rather than left to be discovered.** The upstream
generator only reports an identifier as unplaced if it parsed the identifier at all. Six recently
filed identifiers are absent from the structure map *and* absent from the unplaced list, because
they are written as a prose section with a status table rather than as a row of the item table, and
the parser reads item ids from rows. So an identifier can be doubly invisible. This change reports
what the upstream summary recorded and cannot invent identifiers that summary never saw — which is
the same reason an absent count renders as `not recorded`. The parser gap is the subject of a
separate item already under an active claim by another run; it is referenced, not widened here.

## Rollout Plan

Merge to `main` through the repo-owned workflow. **No runtime rollout.** The changed files are not
imported by the application, are not in any image entrypoint, and are not referenced by any
Container Apps job. The change takes effect the next time an operator regenerates the planning
document locally.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged, and the sole
  authority for shared web traffic.
- Shared runtime mutators: **none in this change.** No `az` command, no revision weight, no
  Container App template edit, no registry push.
- Approved image digest: unchanged by this release; whatever digest the merge deploy produces.
- ACA runtime invariant: to be read back from the deploy run keyed at or after the merge commit,
  and recorded as owed until it is. Not claimed by this record.
- Worker image invariant: unchanged; no worker job code or image reference is touched.
- Feature/env flag update path: not applicable; no flag or environment variable.
- Live signed-in proof required: **no.** Nothing renders on a product surface. Claiming a signed-in
  proof for a change no signed-in user can observe would be a false proof.

## Known Gaps

- **The deploy read-back is owed, not done.** This record is `candidate`. The runtime invariant for
  the merge commit is stated as owed above and must be appended once the repo-owned run settles —
  appended, never written over.
- **An identifier can be doubly invisible, and this change does not fix that half.** The upstream
  generator reports an unplaced identifier only if it parsed the identifier. Six recently filed ids
  are absent from the structure map *and* from the unplaced list, because they are written as a
  prose section with a status table rather than as an item-table row. The census here is honest
  about what the summary recorded and cannot name what the parser never saw. That parser gap sits
  with another item under an active claim by a different run.
- **The current 16 are still unplaced after this change, by choice.** Nothing here places them, and
  the census will keep reporting a non-zero first row until someone does. That is the intended
  outcome: the number is now visible in the file operators read instead of only on an error stream
  behind an always-failing status.
- **The upstream failure status is untouched.** Whether an unplaced identifier should fail that
  generator is an owner decision on record elsewhere. This change does not make that decision, and
  a reader should not take a visible census row as having settled it.
- **No signed-in or product proof exists, and none is claimed.** Nothing here renders on a product
  surface, so there is nothing a signed-in session could confirm.

## Rollback Plan

Revert the single squash commit. There is no migration, no data write, no flag, and no persisted
state, so the revert is complete on its own. The generated planning document is regenerated from
source on every run and is not committed, so an operator holding a document written by the newer
generator simply regenerates it. No rollback window or ordering constraint applies.

## Audit Evidence

- The pull request and its check run, including the before/after and mutation numbers above.
- `scripts/exec/build-execution-queue.test.mjs` — the five cases, runnable on their own with
  `node scripts/exec/build-execution-queue.test.mjs`.
- The rendered census before and after, quoted in the pull request body: `424` opening with no drop
  row, against `440` opening, `16` removed, `424` left, and the 16 identifiers named.
- `node scripts/release-check.mjs --base origin/main --head HEAD` output.
- The deploy run at or after the merge commit, and its runtime-invariant proof, recorded in the
  working register as owed until read back.
