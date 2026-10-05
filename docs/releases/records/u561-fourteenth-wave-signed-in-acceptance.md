# 2026-10-05-u561-fourteenth-wave-signed-in-acceptance — Fourteenth-wave signed-in acceptance walk

## Release ID

`2026-10-05-u561-fourteenth-wave-signed-in-acceptance`

## Status

`released`

## Plain-English Summary

Three client-visible merges reached the lab runtime with nobody having signed in
and looked at them. This record is the signed-in walk that closes that gap, and
it changes no product behaviour: the only files it adds are a dated block in the
signed-in wave acceptance matrix and this record.

What the walk establishes, in ordinary English. The Moves phase-capture screen
has a redesigned three-step flow that is switched on for exactly one synthetic
demo tenant. Three separate merges edited that one shared screen, each behind its
own new switch, and every one of those new switches is off for every tenant. The
risk a flag does not remove is that touching a shared screen breaks the path that
is already switched on for somebody. So the walk signed in, opened the screen on
the tenant that has it switched on, and compared it against the readings the
previous walk recorded: same six markers, same counts, same seven input slots
across the three steps. Not regressed.

It also confirmed the three new switches are genuinely off on the running system
rather than merely off in the source — the added affordances are absent, and the
older presentation each merge claims to replace is still the one rendering. And
it recorded the P0 Originate screen as **excluded rather than passed**: its switch
is off, it still shows the older canvas, and proving the new behaviour would have
meant turning a flag on to manufacture the evidence, which is not allowed and was
not done.

Two things in this walk are worth a reader's attention more than the verdicts.

**The build changed underneath the first pass.** Every pre-walk check agreed the
serving build was `fd7dc069b6`. Mid-pass, at 01:43:34Z, a new revision took all
the traffic. The observations straddled that moment, so none of them could be
honestly attributed to a named build — and they would have read as a perfectly
clean walk, because the numbers were the same ones the second pass produced. The
pass was discarded, the serving build re-resolved, and everything re-observed.
The rule that follows is in the matrix: re-read the runtime invariant at the END
of a walk, not only before it.

**The item's list of merges was short.** U-561 named two client-visible merges. A
re-derived sweep over the walked build found three — the extra one merged after
the item was written. It got a verdict here rather than waiting for a fifteenth
wave to notice it.

## Layer Impact

- **Layer 4 — Products (Moves).** Observed only. No product code, flag, dataset,
  schema, route or configuration is changed by this release.
- **Governance/evidence.** Adds one dated acceptance block and this record, so
  that `deployed` for #8983, #8984 and #8986 can be distinguished from
  `live-proven` by reading the repository rather than a register line.

## Client Applicability

- All clients: no.
- Specific clients: no.
- Internal only: yes — documentation and acceptance evidence only.
- Public/demo only: the surfaces were *observed* on the synthetic demo tenant; nothing was changed for it.
- Feature flag: none added or modified. `moves_capture_v2` (`includeTenants: ["meridian"]`), `moves_capture_p0_v1`, `moves_capture_composition_v1` and `moves_capture_notes_v1` (all `includeTenants: []`) were **read** from the serving SHA and left exactly as found.

## Changes Included

- `docs/acceptance/signed-in-wave-acceptance-matrix.md` — new block, *2026-10-05 fourteenth wave — walked on serving SHA `786df70f82`*.
- `docs/releases/records/u561-fourteenth-wave-signed-in-acceptance.md` — this record.

Merges verdicted (observed, not modified):

| Merge | PR | Flag under test | Verdict |
|---|---|---|---|
| `8b22aa5a90` | #8984 | `moves_capture_p0_v1` | excluded — flag off, observed off (row 4); contributes to the row-1 regression check |
| `7ee02ad1c1` | #8986 | `moves_capture_composition_v1` | pass (OFF path); contributes to the row-1 regression check |
| `786df70f82` | #8983 | `moves_capture_notes_v1` | pass (OFF path) — **not named by U-561, found by the sweep** |

Excluded by measurement, not by subject line (0 files under `src/app`, `src/components`, `src/lib` outside tests): `fd7dc069b6` (#8987), `62b5f135c2` (#8985).

## QA / Validation

Signed-in walk, 2026-10-05 between 01:45:10Z and 01:47:04Z, on serving SHA
`786df70f82`. An earlier pass (01:43Z–01:44Z) was discarded because the serving
revision changed mid-pass; see the matrix block.

- **Serving SHA from two independent sources.** `az acr manifest show-metadata` on the serving digest returns the single tag `main-786df70f` (written by the build); the sole 100%-traffic revision is `ca-abarva-web-lab-eastus--m786df70f` (a name the deploy wrote). They agree.
- **Ancestor sweep re-derived, not inherited.** `git merge-base --is-ancestor` confirms both named merges are ancestors of the walked build; `--merges` over `8bcfa6fa6f..786df70f82` returns 0 (squash merges), `--first-parent` returns 5, of which 3 are client-visible by file measurement.
- **Row 1 — `moves_capture_v2` ON path, not regressed.** All six discriminators the thirteenth wave recorded were re-observed with identical counts: `[data-testid="moves-capture-flow"]` ×1, `.mcf-phasebar` ×1, `.mcf-stepbar` ×1, the three step titles, footer *Step 1 of 3* ×1, `.mcf-question` ×3 on step 1. Full mount set across the three steps 3 + 2 + 2 = **7**, matching the thirteenth wave's total for this phase.
- **Row 2 — composition OFF path.** Workspace surface tabs still render as a standalone row above the content rather than inside the dock's workspace column; the legacy stage head still repeats the phase title, question, lede and progress card (`INPUTS 0/7`, `GATE 1/2 hard met`).
- **Row 3 — fill-from-notes OFF path.** 0 `capture-notes-fill`, 0 `capture-notes-open`, 0 elements carrying any `cnf*` class, at every one of the three steps.
- **Row 4 — P0 excluded.** 0 capture-flow markers of any kind, 0 occurrences of P0's step titles, no *Step n of 3* footer; 60 elements carrying a `finder*` class and the `P0 INPUTS` block — the legacy canvas.
- **No write was performed.** Stepping 1 → 2 → 3 is a client-side view change: on the serving SHA `MovesCaptureFlow`'s footer primary calls `go(view + 1)` for views 0 and 1 and reaches `onSubmitPhase()` only at view 2. The step-3 button was not pressed; no field was typed into; no flag was flipped.

Repository validation for the two added documents: `node scripts/release-check.mjs --base origin/main --head HEAD`, plus the checks required on the pull request.

## Rollout Plan

Merge to `main`. No runtime rollout: the change is two documents. The repo-owned
ACA main deploy workflow will build and deploy the merge commit as it does for
every merge, and that deploy carries no product change from this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`. Not invoked by hand for this release.
- Shared runtime mutators: **none**. Every Azure call in this walk was a read (`az containerapp show`, `az containerapp revision list`, `az acr manifest show-metadata`). No `az containerapp update`, no traffic change, no flag or env mutation.
- Approved image digest (observed, not set): `acrabarvalab001.azurecr.io/abarva/web@sha256:8424205cc0338399b1962862b4cb89c7c5f9ef1eaa42e9f8fac78f6aac4b8819`.
- ACA runtime invariant: **verified twice**, at 01:45:10Z and 01:47:04Z, unchanged. Container App template image, the sole 100%-traffic revision's image, and the approved digest are all the digest above; revision `ca-abarva-web-lab-eastus--m786df70f`, weight 100, `active`, `Healthy`, created 01:43:34Z. Deploy run `37252091902` `completed` / `success` at 01:45:56Z.
- Worker image invariant: out of scope — no worker job is touched or asserted by this release.
- Feature/env flag update path: not used. Flags were read from the serving SHA and left unchanged.
- Live signed-in proof required: **yes, and this record is it** — for the OFF paths of #8983, #8984, #8986 and for the non-regression of the `moves_capture_v2` ON path, on the synthetic demo tenant only.

## Rollback Plan

Revert the pull request. Nothing to undo at runtime: no migration, no flag, no
image, no traffic weight and no data was changed. The acceptance block and this
record would be removed and the three merges would return to `deployed,
unverdicted`.

## Audit Evidence

- The matrix block *2026-10-05 fourteenth wave — walked on serving SHA `786df70f82`*, which carries the discriminator tables, the discarded-pass account, the sweep arithmetic and the stated limits.
- Deploy runs `37252091902` (`786df70f82`), `37250355308` (`fd7dc069b6`), `37249887479` (`7ee02ad1c1`), `37248500077` (`8b22aa5a90`) — all `success`.
- ACR manifest metadata for `sha256:8424205c…8819`: single tag `main-786df70f`.
- `az containerapp show` / `revision list` output at 01:45:10Z and 01:47:04Z.
- The claim and release lines for U-561 in the operator register, which carry the pre-claim preconditions and the discarded-pass disclosure.

## Known limits, stated rather than implied

Three of the four rows are OFF-path verdicts. They prove each merge's flag-off
contract — *nothing new renders* — and prove nothing about the behaviour each
merge adds. No ON path of #8983, #8984 or #8986 has been observed by anyone, and
the first tenant enablement of any of them will need a walk that no row in the
matrix currently covers. Row 1, the regression check, is a structural comparison:
same markers, same counts, same tenant, same phase. It does not assert the
capture *behaves* identically, because no answer was typed and no phase was
submitted.

Separately, the sixth wave's merges remain unverdicted in the matrix; PR #8963
carries those verdicts and is open. This walk neither merged it nor re-walked its
merges.
