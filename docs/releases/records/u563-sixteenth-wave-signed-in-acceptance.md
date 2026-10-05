# 2026-10-05-u563-sixteenth-wave-signed-in-acceptance — Sixteenth-wave signed-in acceptance walk

## Release ID

`2026-10-05-u563-sixteenth-wave-signed-in-acceptance`

## Status

`released`

## Plain-English Summary

Four capability switches on the Moves phase-capture screen were turned on for a
single synthetic demo tenant for the first time. Until that happened, every
previous walk had looked at those features through the code paths they did *not*
change and recorded them as fine. This record is the signed-in walk of the paths
that are now actually served. It changes no product behaviour: the only files it
adds are a dated block in the signed-in wave acceptance matrix and this record.

What the walk found, in ordinary English.

Most of it works. The three-step capture screen still renders exactly as it did
before the four switches were turned on — same markers, same counts — so turning
them on regressed nothing. Each charter question now asks the person how they
know their answer and offers three honest options, and an unsupported field says
plainly that no approved evidence exists for it rather than implying any. The
paste-your-notes helper proposes a match, shows the exact sentence it used and
the words that earned it, labels anything it would insert as the person's own
assertion rather than as evidence, and writes nothing until the person inserts
it; given a passage that matches nothing, it says so instead of guessing. The
Originate screen, which had been on the older layout, now renders the new one.
The phase strip states each phase's own question count rather than repeating one
number.

**One thing does not work, and it is the reason this walk was worth doing.** A
charter-level summary — how much of the charter is backed by evidence, how much
is asserted, how many open assumptions carry forward and who owns them — was
built to appear on the hand-off recap at the end of the capture flow. That recap
cannot be reached. The only control that opens it is replaced, on every screen
where the capture flow renders, by the phase's approve-and-build panel, so the
line of code that opens the recap never runs. The summary is deployed, switched
on, and visible to nobody. A tooling audit cannot catch this, because the
component *is* imported and referenced — it is only the branch that would show
it that never executes. Filed as **U-564**.

Three claims could not be proven without writing data, and are recorded as
blocked rather than quietly passed: whether the advance gate really admits an
owned assumption without an upload, whether a field warns you when an edit
clears its basis, and whether an unsupported field is classified as an
assumption once one is actually recorded. Each needs answers saved to the server
first, which an unattended walk does not do.

A fourth merge, on the Source side, is blocked for a different reason: it covers
the request step only, and all four Source events the runtime serves are already
past it. The code behaves as specified; there is no subject to observe.

**The first pass of this walk was thrown away.** Three deploys landed in the
twenty minutes it ran, and a new revision took all traffic inside the
observation window, so none of those readings could be attributed to a named
build — and they read as clean. The walk was re-taken only after the deploy
queue was confirmed empty. That is this wave's addition to the standing rule:
when the queue is moving, wait for it to drain rather than only re-reading the
invariant afterwards.

## Layer Impact

Lane: `global-control-lane`.

- **Layer 4 — Products (Moves, Source New).** Observed only. No product code,
  flag, dataset, schema, route or configuration is changed by this release.
- **Governance/evidence.** Adds one dated acceptance block and this record, so
  that `deployed` for the nine client-visible merges in scope can be
  distinguished from `live-proven` by reading the repository rather than a
  register line. Records one `fail` with a filed successor id (U-564) and four
  `blocked` rows with the write each would have required.

## Client Applicability

- All clients: no.
- Specific clients: no.
- Internal only: yes — documentation and acceptance evidence only.
- Public/demo only: the surfaces were *observed* on the synthetic demo tenant; nothing was changed for it.
- Feature flag: none added or modified. `moves_capture_v2`, `moves_charter_basis_v1`, `moves_capture_p0_v1`, `moves_capture_composition_v1` and `moves_capture_notes_v1` were **read** from the serving SHA — all five `includeTenants: ["meridian"]`, enabled by #8992 before this walk — and left exactly as found.

## Changes Included

- `docs/acceptance/signed-in-wave-acceptance-matrix.md` — new block, *2026-10-05 sixteenth wave — walked on serving SHA `c166b73790`*.
- `docs/releases/records/u563-sixteenth-wave-signed-in-acceptance.md` — this record.
- `EXECUTION_BACKLOG_20260918.md` (operator root, not in this repository) — U-564 filed.

Merges verdicted (observed, not modified):

| Merge | PR | Verdict |
|---|---|---|
| `6600489253` | #8988 | **fail — U-564** for the rollup; `pass` for the per-field basis control, in the half that renders without a write |
| `def2eeecd0` | #8990 | pass (ON path, first observation) |
| `5794c7280d` | #8991 | blocked — the gate dialog needs seven saved answers and a cleared evidence item |
| `d4bf30f961` | #8992 | pass — the enablement is in force; it is the path rows 1, 2, 4, 5 and 6 are taken on |
| `69aacc4fb3` | #8979 | blocked — covers the request step only; no served event is at it |
| `650fa9a98d` | #8994 | blocked — the edit notice needs a recorded basis and then an edit |
| `42d5f1fa77` | #8995 | pass — behaviour-preserving; contributes to the row-1 regression check |
| `307a4a1d60` | #8998 | pass |
| `14b8ebe8ba` | #8996 | pass |

Excluded by measurement, not by subject line (0 files under `src/app`, `src/components`, `src/lib` outside tests): `36d7c9b7b7` (#8989), `0b9783eee3` (#8993), `34ecd8132b` (#8997), `590c4af209` (#8999), `c166b73790` (#9000).

## QA / Validation

Signed-in walk, 2026-10-05 between 06:08:58Z and 06:12:30Z, on serving SHA
`c166b73790`. An earlier pass (05:44Z–05:53Z) was discarded because a revision
took all traffic at 05:45:40Z, inside that window; see the matrix block.

- **Serving SHA from two independent sources.** `az acr manifest show-metadata` on the serving digest returns the single tag `main-c166b737`; the sole 100%-traffic revision is `ca-abarva-web-lab-eastus--mc166b737`. They agree.
- **Deploy queue confirmed drained before walking.** `gh run list --workflow aca-main-deploy.yml` showed no run outstanding; run `37269658565` completed `success` at 06:08:02Z.
- **Ancestor sweep re-derived, not inherited.** `git merge-base --is-ancestor` confirms `d4bf30f961`, `6600489253`, `0b9783eee3` and `14b8ebe8ba` are ancestors of the walked build. `--merges` over `786df70f82..c166b73790` returns 0 (squash merges); `--first-parent` returns 14, of which **9** are client-visible by file measurement. U-563 measured 4 and called it a floor; it was.
- **Row 1 — ON path not regressed.** All six discriminators re-observed with counts identical to the thirteenth and fourteenth waves: `[data-testid="moves-capture-flow"]` ×1, `.mcf-phasebar` ×1, `.mcf-stepbar` ×1, the three step titles, footer *Step 1 of 3* ×1, `.mcf-question` ×3 on step 1. Full mount set 3 + 2 + 2 = **7**.
- **Row 2 — basis control.** 7 of 7 charter fields render *HOW DO YOU KNOW THIS?* with three options and the *"No approved evidence for this field yet"* notice; **"evidence covered" occurs 0 times** at every step.
- **Row 3 — `fail`.** `.mcf-approve-slot` ×1 and `.mcf-btn-primary` ×0 at view 2; `mcf-handoff`, `.mcf-recap`, `charter-basis-rollup`, `charter-basis-mark` all **0**, on two separate Moves. Corroborated at source: `go(3)` has exactly one caller, which renders only when `approveSlot` is falsy, and `approveSlot` is truthy whenever the flow mounts.
- **Row 4 — fill-from-notes.** One proposal with the verbatim passage, the matched words, the *FROM YOUR NOTES · RECORDS YOUR ASSERTION* label, #8990's basis note, and *Insert* / *Dismiss* as the only controls. A non-matching paste rendered `capture-notes-empty`. Insert was not pressed.
- **Row 5 — P0 ON path.** `data-capture-p0="on"`, the redesigned flow mounted, 1 `finder*` element against the fourteenth wave's 60, 0 `P0 INPUTS`. Step 1 only was read.
- **Row 6 — phase strip.** Six distinct totals (11 / 7 / 8 / 7 / 7 / 7); no row's answered count exceeds its own total.
- **Row 7 — Source New.** All four served events fetched directly; `.snw-step-readiness` is 0 on each, and each has step 01 Request at *Recorded*.
- **No write was performed.** No basis was selected (`onChange` calls `saveCharterBasis`, a server write); no proposal was inserted; no gate, build or phase control was pressed; no capture field was typed into; no flag was flipped. The only text typed was into the fill-from-notes scratch box, which the panel discards on close.

Repository validation for the two added documents: `node scripts/release-check.mjs --base origin/main --head HEAD`, plus the checks required on the pull request.

## Rollout Plan

Merge to `main`. No runtime rollout: the change is two documents. The repo-owned
ACA main deploy workflow will build and deploy the merge commit as it does for
every merge, and that deploy carries no product change from this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`. Not invoked by hand for this release.
- Shared runtime mutators: **none**. Every Azure call in this walk was a read (`az containerapp show`, `az containerapp revision show`, `az containerapp revision list`, `az acr manifest show-metadata`). No `az containerapp update`, no traffic change, no flag or env mutation.
- Approved image digest (observed, not set): `acrabarvalab001.azurecr.io/abarva/web@sha256:29878608fd0835260c4da00857c2cfcaf6175e24e44ac8273fa720f498e6e5b1`.
- ACA runtime invariant: **verified twice**, at 06:08:17Z and 06:12:37Z, unchanged. Container App template image, the sole 100%-traffic revision's image, and the approved digest are all the digest above; revision `ca-abarva-web-lab-eastus--mc166b737`, weight 100, `Healthy` / `Running`, created 06:05:14Z. Deploy run `37269658565` `completed` / `success` at 06:08:02Z. A later run (`37270984445`, `b7eaa059b6`) began after the walk ended and had taken no traffic at the closing read.
- Worker image invariant: out of scope — no worker job is touched or asserted by this release.
- Feature/env flag update path: not used. Flags were read from the serving SHA and left unchanged.
- Live signed-in proof required: **yes, and this record is it** — for the ON paths of #8988 (in part), #8990, #8992, #8995, #8996 and #8998, and for the non-regression of the `moves_capture_v2` path, on the synthetic demo tenant only.

## Rollback Plan

Revert the pull request. Nothing to undo at runtime: no migration, no flag, no
image, no traffic weight and no data was changed. The acceptance block and this
record would be removed and the nine merges would return to `deployed,
unverdicted`. U-564 would remain filed, because the defect it names is in the
product and not in this release.

## Audit Evidence

- The matrix block *2026-10-05 sixteenth wave — walked on serving SHA `c166b73790`*, which carries the discriminator tables, the discarded-pass account, the sweep arithmetic, the full reachability argument for row 3 and the stated limits.
- Deploy runs `37269658565` (`c166b73790`), `37269389459` (`14b8ebe8ba`), `37268047476` (`590c4af209`) — all `success`.
- ACR manifest metadata for `sha256:29878608…e5b1`: single tag `main-c166b737`.
- `az containerapp show` / `revision show` output at 06:08:17Z and 06:12:37Z.
- The claim and release lines for U-563 in the operator register.
- U-564 in the operator backlog, which carries the reachability argument as its own acceptance.

## Known Gaps

Four rows are `blocked` and one is a `fail`, all named above and in the matrix
block rather than implied.

- **U-564 is open.** #8988's rollup and the recap basis marks reach no user.
- **#8991, #8994 and the assumption-classification half of #8988 have never been
  observed by anyone.** Each needs a server write an unattended walk does not
  perform; proving them needs an attended session or a seeded Move whose charter
  already carries saved answers and a recorded basis.
- **#8979 has no subject on this runtime.** Proving it needs a Source event at
  the request/intake step, of which the runtime serves none.
- **Enforcement was not exercised.** Every refusal recorded is a client
  affordance; no server-side gate was tested by attempting the action.
