# 2026-10-05-u560-thirteenth-wave — Thirteenth-wave signed-in acceptance

## Release ID

`2026-10-05-u560-thirteenth-wave`

## Status

`released`

## Plain-English Summary

Documentation only. This records a signed-in walk of the live lab product against
three merges that had shipped and been deployed with nobody confirming how they
behave for a person actually using the surface.

Two of them change the Moves phase-1 charter step and are both behind a feature
flag that is enabled for no tenant at all, so only their default — "nothing new
renders, the existing gate is unchanged" — is observable. The walk produced that
default and says plainly that the enabled path is still owed. It was not
manufactured by switching the flag on, which would make the evidence worthless.

The third merge changes how the sourcing workspace handles a demo signing
envelope that has ended in a terminal state. That surface renders on none of the
five sourcing events the product currently serves, for two independent reasons
the record measures rather than guesses. That row is recorded as **blocked**, not
rounded up to a pass on the strength of the merge's own tests, and the gap is
filed as its own backlog item.

The record also keeps two corrections of the walk's own method: a predecessor's
release note that nearly closed this row by mistake, and a page's inlined script
bytes that nearly got read as rendered page state.

No product code, schema, configuration or runtime behaviour changes.

## Layer Impact

- **Layer 4 (Products)** — observation only. Moves and Source surfaces were read
  signed in; nothing was written and no product behaviour changed.
- Layers 1–3 untouched.

## Client Applicability

- All clients: none — documentation only.
- Specific clients: none.
- Internal only: yes. An acceptance record used by the release lane.
- Public/demo only: no.
- Feature flag: none introduced. One existing flag was observed **off** on the
  running surface, which matches its definition naming no tenant; its on path is
  recorded as owed rather than assumed, and no flag state was changed.

## Changes Included

- `docs/acceptance/signed-in-wave-acceptance-matrix.md` — one new dated block
  recording the walk: the two-source SHA resolution, the runtime invariant read
  twice, the re-derived sweep, the runtime flag observation with its mount-point
  count, three result rows, two method corrections, the stated limits, and the
  filed residue.
- This release record.

No source, migration, workflow or script changes.

## QA / Validation

The walk itself is the validation, and it was performed against the running
product rather than against tests. No test accompanies this change and none is
owed: nothing executable changed, and no `.ts` file is touched, so there is no
typecheck exit code to judge either.

- **Serving SHA resolved at walk time, not pinned:** `8bcfa6fa6f` (#8982). It was
  also `origin/main` at walk start; it was not at walk end, and the record says so.
- **Resolved from two independent sources**, because a revision suffix is a label
  a deploy wrote: `az acr manifest show-metadata` on the serving digest returns
  the sole tag `main-8bcfa6fa`, and the revision name `--m8bcfa6fa` agrees.
- **Runtime invariant proven, read twice:** template image
  `sha256:09e0d5a0…f100`, the 100%-traffic revision's own image identical to it,
  sole traffic entry at weight 100, revision `active`/`Healthy`/`Running`. Both
  reads — 00:34:48Z before the walk and 00:43:07Z at its end — returned the same
  digest and the same sole revision, so no deploy landed inside the walk.
- **The third merge's deploy state was resolved at walk time**, as the item
  required, rather than read from the item: run `37245988466` is
  `completed`/`success`, `createdAt` 00:03:41Z → `updatedAt` 00:13:41Z.
- **Ancestor sweep re-derived, not inherited.** All three merges the item names
  were asserted ancestors of the walked build with
  `git merge-base --is-ancestor`. The population was then recomputed over
  `15de62ec41..8bcfa6fa6f`: 4 first-parent commits, 1 excluded as docs-only **by
  measurement** (0 files under `src/app`, `src/components` or `src/lib` outside
  tests), leaving 3 — the same 3 the item names. The repository squash-merges, so
  `--merges` over the same range returns 0 and the sweep must use `--first-parent`.
- **The flag was observed on the runtime, not in the registry file**, with
  discriminators that exist in one component and nowhere else, and — this is the
  part that makes an absence mean anything — **with the mount points counted on
  the same reads**: 7 of 7 phase-1 capture questions rendered, 0 basis controls
  and 0 assumption badges across all three capture steps.
- **A near-miss is recorded rather than quietly fixed.** A search of the page's
  server HTML returned 17 hits for a draft marker; the hydrated DOM returns 0.
  The 17 were the component's own source inside the inlined script payload. The
  DOM answer is the one used.
- **0 console errors** on both walked surfaces, on loads taken after console
  tracking was enabled rather than attached afterwards.
- **No write of any kind.** No product surface was written to and every `az` call
  was a read. The capture flow was advanced one step at a time, which the
  component implements as local view state with no network call; the only control
  that submits was not pressed.

## Rollout Plan

Documentation only; it ships with the merge. No flag, no migration, no job, no
staged rollout.

## Deployment Authority

The repo-owned ACA main deploy workflow, on merge to `main`. This change starts
no deploy of its own and shifts no traffic. Every `az` call made during the walk
is a read; no Azure resource was mutated.

## Rollback Plan

Revert the commit. There is no runtime effect to roll back.

## Audit Evidence

- `docs/acceptance/signed-in-wave-acceptance-matrix.md`, the
  `2026-10-05 thirteenth wave` block.
- Deploy runs for the three walked merges, read from the workflow rather than
  assumed: `37244749709` success, `37245398832` success, `37245988466` success
  (`createdAt` 00:03:41Z → `updatedAt` 00:13:41Z).
- The registry manifest for the serving digest, sole tag `main-8bcfa6fa`.
- Merge times taken from GitHub's own `mergedAt` rather than estimated:
  #8980 2026-10-04T23:42:53Z, #8948 2026-10-04T23:53:48Z,
  #8981 2026-10-05T00:01:49Z, #8982 2026-10-05T00:03:38Z.

## Known Gaps

1. **The enabled path of the charter flag is owed, and is not inferred.** This
   walk produced the **off** path, which is what every tenant gets today because
   the flag's definition names no tenant. Producing the on path needs a reviewed
   change through the governed path; it was deliberately not manufactured by
   switching a flag, which the item forbids and which would invert what proof
   means.
2. **One row is blocked and stays blocked.** The sourcing e-sign surface renders
   on none of the five events the product serves — measured three ways — so that
   merge's behaviour change is evidenced by its own tests and not by this walk.
   The precondition gap is filed as `D-519` rather than absorbed here.
3. **The gate's server-side refusal was read, not exercised.** The blocker
   sentence is composed client-side from server-supplied counts. Driving the
   server refusal means committing an advance, which is a write, and for a gate
   the failure mode under test is the action succeeding.
4. **One tenant.** Every observation is on the single synthetic demo tenant the
   signed-in session reaches. Nothing here speaks for any other tenant.
5. **One disagreement is reported unsettled rather than as a defect.** Seven
   charter answers render while the gate reports them unpersisted. The two
   quantities have different sources and can legitimately disagree; settling it
   needs a read of the server's capture-module rows that this walk had no
   read-only route to. It is attributable to neither walked merge.
6. **A fourteenth wave is already owed.** Two further merges had deploy runs
   created at 00:41:42Z and 00:42:22Z, after this walk began. They are outside
   this wave.
7. **The diff was scanned by hand for disclosure, not by a tool.** `gitleaks` is
   not on `PATH` in a worktree, so this says the scan was manual rather than
   implying a scanner ran. No tenant name, supplier legal name, person name,
   e-mail address or UUID appears in either file.
