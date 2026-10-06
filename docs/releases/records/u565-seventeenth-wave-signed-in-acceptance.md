# 2026-10-05-u565-seventeenth-wave-signed-in-acceptance — Seventeenth-wave signed-in acceptance walk

## Release ID

`2026-10-05-u565-seventeenth-wave-signed-in-acceptance`

## Status

`released`

## Plain-English Summary

Fourteen changes that reached real users had landed since the last signed-in walk
and none of them had been looked at by a person on the running product. This
record is that walk. It changes no product behaviour: the only files it adds are
a dated block in the signed-in wave acceptance matrix and this record.

What the walk found, in ordinary English.

**Nine of the fourteen work, and four of those nine could not have been proven
any other way.**

The biggest one is about figures that lie. Several screens showed a number glued
to a word that did not describe it — "1 of 1 criteria met", "1 answers" — or,
worse, showed a number nobody had measured. The phase strip on the capture screen
used to display a count for all six phases when the screen could only measure
one of them: it inferred that a phase the work had moved past must be finished,
and drew a tick beside it, even when the questions behind it were blank. The same
phase therefore read differently depending on which screen you stood on. It now
shows a count **only** for the phase you are looking at, and shows the plain
question total for the rest. The walk read the same strip from two different
phases on two different pieces of work and watched the measured row move with the
view. That settles an open question the previous walk had written down and
flagged as worth checking.

The new-work intake screen had two figures counting different sets on either side
of the word "of", which forced its final step to display the same position as the
step before it. The last field now reads "Step 17 of 18" and the submit step
reads "Step 18 of 18" — two distinct positions, and the last one can be reached.
The same screen used to show five invented progress figures for phases it had
never measured; all five now say "Not started" instead.

A free-text box on the capture screen had been rendering about twenty characters
wide because a style rule was missing. It now fills its column exactly.

One change is functional rather than cosmetic and it was verified against its
own author's measurement: the "Continue" button on the capture screen used to be
clickable on a step where nothing had been answered. Its release record says so
explicitly, from a signed-in check. It is now correctly disabled.

**Four of the fourteen could not be observed at all, and are recorded as blocked
rather than quietly passed.** Three of them are blocked for the same reason: the
screen the change lives on does not render on anything this product currently
serves. A new row showing who approved a sourcing strategy sits on a panel that
only appears at a stage no live sourcing event has reached — and the row that was
already there beside it is missing too, which is how we know the panel is
unreached rather than the new row broken. A set of gate figures lives in code
that no screen imports. A deliverables summary lives on a page whose address
redirects somewhere else. In each case the fix is probably right; nothing
observed contradicts it, and nothing observed evidences it either, and this
record says the second part as plainly as the first.

**Two things were filed as new work.** One is the unreached sourcing panel above.
The other is a side effect of the "Continue" fix that is nobody's defect but does
cost us something: because the step bar only moves backwards and the one forward
control is now correctly disabled on an incomplete step, the later steps of the
capture screen can no longer be reached by a check that refuses to save data. The
last three walks recorded a count across all three steps; that measurement is no
longer available and the next walk needs a different one. Recording this matters
because the alternative is a future walk reading a missing number as a
regression.

**Waiting for the deploy queue to empty cost forty-four minutes and was worth
it.** The previous walk added that rule after throwing a pass away. At the moment
this item was claimed, twelve runs were outstanding and a deploy was pending on a
merge that had landed twenty-nine seconds earlier; the live build then moved three
more times. The walk began only once no deploy was in flight, and the runtime was
read three times across the observation window and was identical each time, so
every reading here belongs to one named build.

## Layer Impact

Lane: `global-control-lane`.

- **Layer 4 — Products (Moves, Source New).** Observed only. No product code,
  flag, dataset, schema, route or configuration is changed by this release.
- **Governance/evidence.** Adds one dated acceptance block and this record, so
  that `deployed` for the fourteen client-visible merges in scope can be
  distinguished from `live-proven` by reading the repository rather than a
  register line. Records, over fifteen result rows, **eleven `pass`** — two of
  them partial, with the unobserved half named — and **four `blocked`** with the
  reason each is blocked, and no `fail`. Counted per merge instead of per row,
  the fourteen in scope divide **ten `pass`** and **four `blocked`**; the two
  counts differ because one row verdicts five merges jointly as a regression
  check, and both are stated rather than one being quoted as the other.

## Client Applicability

- All clients: no.
- Specific clients: no.
- Internal only: yes — documentation and acceptance evidence only.
- Public/demo only: the surfaces were *observed* on the synthetic demo tenant; nothing was changed for it.
- Feature flag: none added or modified. Six flags were **read** from the serving SHA and left exactly as found — `moves_capture_v2`, `moves_charter_basis_v1`, `moves_capture_p0_v1`, `moves_capture_composition_v1` and `moves_capture_notes_v1` all enabled for the single synthetic demo tenant, and `moves_charter_assumptions_discover_v1` at `includeTenants: []`, enabled for no tenant.

## Changes Included

- `docs/acceptance/signed-in-wave-acceptance-matrix.md` — new block, *2026-10-05 seventeenth wave — walked on serving SHA `bbe053153e`*.
- `docs/releases/records/u565-seventeenth-wave-signed-in-acceptance.md` — this record.
- `EXECUTION_BACKLOG_20260918.md` (operator root, not in this repository) — U-566 and U-567 filed.

Merges verdicted (observed, not modified):

| Merge | PR | Verdict |
|---|---|---|
| `0ea9b3a561` | #9002 | pass as an absence, with the two-cause limit stated and the cause settled from configuration |
| `f0a4e63d16` | #9003 | **pass** — and it settles the sixteenth wave's open note |
| `a78b4a748c` | #9005 | pass |
| `b9af8943b8` | #9006 | pass |
| `78ffe605c5` | #9007 | pass |
| `ead3fcec28` | #9008 | pass; the discard-dialog figure was not reached (opening it risks a discard) |
| `a96869f6fc` | #9009 | blocked in the rendering half; the absent half holds on all four served events |
| `867b252de9` | #9011 | blocked — `gate-ribbon-view` has no non-test importer; the drawer's only consumer is unroutable |
| `372534eb44` | #9013 | **pass**, on the exact reading the defect produced |
| `3165e2c3aa` | #9015 | **pass** — against that merge's own recorded signed-in baseline |
| `f4b52697c1` | #9012 | pass |
| `b126af51ec` | #9014 | blocked — not reached read-only; the consuming page's route redirects |
| `97598648d8` | #9016 | pass on the notes trigger; the dock-header half blocked (`display: none` on this route) |
| `bbe053153e` | #9018 | blocked — the panel renders on no served event, and its pre-existing sibling row is absent too |

Excluded by measurement, not by subject line (0 files under `src/app`, `src/components`, `src/lib` outside tests): `b7eaa059b6` (#9001), `10146581aa` (#9004), `28dba57f21` (#9010).

## QA / Validation

Signed-in walk, 2026-10-05 between 13:27:43Z and 13:38:14Z, on serving SHA
`bbe053153e`. No pass was discarded: the runtime was unchanged across the whole
window.

- **Serving SHA from two independent sources.** `az acr manifest show-metadata` on the serving digest returns the single tag `main-bbe05315`; the sole 100%-traffic revision is `ca-abarva-web-lab-eastus--mbbe05315`. They agree. Neither was pinned in advance — U-565 named `ead3fcec28`, four builds earlier.
- **Deploy queue drained before walking, and the exception named.** At claim time 12 runs were outstanding with an `ACA main deploy` pending. The walk began only after run `37315313004` completed `success` at 13:25:38Z with no deploy in flight. Two runs were still outstanding and are named rather than hidden: `Unit suites` and `Coverage Threshold` on `7ec02d8e4e`, which `git merge-base --is-ancestor` puts **not** on `main` — pull-request CI, which cannot shift shared web traffic under the deployment-authority rule.
- **Ancestor sweep re-derived, not inherited.** `c166b73790` is an ancestor of `bbe053153e`. `--first-parent` over `c166b73790..bbe053153e` returns **17**, each separately asserted an ancestor of the walked build; **14** are client-visible by file measurement. U-565 measured 8 against a build six merges earlier and called it a floor; it was.
- **Row 1 — ON path not regressed on the six discriminators.** `[data-testid="moves-capture-flow"]` ×1, `.mcf-phasebar` ×1, `.mcf-stepbar` ×1, the three step titles, footer *Step 1 of 3* ×1, `.mcf-question` ×3 on step 1 — all identical to the thirteenth, fourteenth and sixteenth waves. The 3 + 2 + 2 = 7 mount set is **blocked** this wave: steps `02` and `03` report `disabled: true`, the step bar moves only backwards, and the single forward control is the now-correctly-disabled Continue.
- **Row 2 — phase strip, the finding of the wave.** P1 route: `11 questions` · `0 of 7 answered` · `8 questions` · `7 questions` · `7 questions` · `7 questions`. P2 route on a different Move: `11 questions` · `7 questions` · `0 of 8 answered` · `8 questions` · `7 questions` · `7 questions` — exactly one measured row, and it follows the view. Four further Moves returned the same shape. The sixteenth wave read six measured-looking figures here.
- **Row 3 — Continue gating.** `disabled: true` on step 1 of P1 at *0 of 7 answered* and on step 1 of P2 at *0 of 8 answered*. #9015's release record records the opposite from its own signed-in baseline.
- **Row 4 — field width.** The `.mcf-input` rule is present in the component's `<style>`; three textareas at **848px**, `box-sizing: border-box`, no `cols`, in `.mcf-question` containers also at **848px**.
- **Row 5 — notes trigger.** `capture-notes-open` ×1 at `x: 301, width: 848, y: 351`; `.mcf-stepbar` at `x: 301, width: 848, y: 578`. Full-width, left-aligned, above the tab row. The dock-header half is blocked: the role label carries `white-space: nowrap`, `text-overflow: ellipsis` and a 16px height on a 15.6px line box, but the dock chrome computes `display: none` on this route at `aria-expanded="true"`.
- **Row 6 — phase stepper.** `3 of 3 gate criteria` · `1 of 2 gate criteria` · `0 of 6 gate criteria` · `0 of 3 gate criteria` · `0 of 5 gate criteria` · `0 of 4 gate criteria`. The only other `N of M` shapes on the page name their own sets (`Phase 2 of 6 · Charter`, `Step 1 of 3`).
- **Row 7 — portfolio value line.** *39 of 52 moves have declared value.* The removed defect compared the formatted string against the fallback copy, whose reading once the copy changes is `52 of 52`; `39 ≠ 52` is the discriminator.
- **Row 8 — reconciliation strip.** **38 programmes**, **52 records**, **$739.7M**, **$845.9M** — both nouns agreed, both amounts declared rather than the `—` token.
- **Row 9 — P0 intake figures.** Rail: `0 of 17 answers` then **`Not started`** ×5; the five removed literals (`0 of 5`, `0 of 5`, `0 of 4`, `0 of 4`, `0 of 4`) occur **0 times**. Promote bar: *0 of 17 answers captured — finish the remaining P0 answers.*
- **Row 10 — step position.** Last field *Complexity tier* → **`Step 17 of 18`**; submit step *Review P0 intake* → **`Step 18 of 18`**. Navigation foot: *0 of 17 answers captured · finish the required steps*.
- **Row 11 — Source New Stage 04.** All four served events read: two at `02 Define · Current`, one at `04 Market package · Current`, one at `04 Market package · Recorded`. *Solicitation motion*, *Request authority* and *Strategy authority* are each absent on all four. The panel renders only when the stage normalises to `responses`, which no served event is at.
- **Row 15 — charter carry-forward OFF state.** `[data-testid="charter-assumptions-carry-forward"]` and `.cac` are **0** at `view < 3` on a reachable P2 Discover route (two of six Moves probed reach `/phase/2`; four redirect to `/phase/1?blockedPhase=2`). The panel renders nothing both when inactive and when active with nothing assumed, so the absence alone settles nothing; `includeTenants: []` read from the serving commit settles it.
- **No write was performed.** No basis was selected, no capture field typed into, no proposal inserted, no intake submitted, no gate or phase control pressed, no flag flipped. The only state changes were client-side view changes: stepping the Originate navigation and switching an event tab.

Repository validation for the two added documents: `node scripts/release-check.mjs --base origin/main --head HEAD`, plus the checks required on the pull request.

## Rollout Plan

Merge to `main`. No runtime rollout: the change is two documents. The repo-owned
ACA main deploy workflow will build and deploy the merge commit as it does for
every merge, and that deploy carries no product change from this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`. Not invoked by hand for this release.
- Shared runtime mutators: **none**. Every Azure call in this walk was a read (`az containerapp show`, `az containerapp revision list`, `az containerapp list`, `az acr manifest show-metadata`). No `az containerapp update`, no traffic change, no flag or env mutation.
- Approved image digest (observed, not set): `acrabarvalab001.azurecr.io/abarva/web@sha256:78c09e2cbc16f84e91c6fdf08cce217a96fa5217723d12a10d7faa60edf6964d`.
- ACA runtime invariant: **verified three times**, at 13:26:36Z, 13:36:38Z and 13:38:14Z, unchanged. Container App template image, the sole 100%-traffic revision's image, and the approved digest are all the digest above; revision `ca-abarva-web-lab-eastus--mbbe05315`, weight 100, `Healthy` / `Running`, created 13:22:58Z — over four minutes before the window opened. The three other active revisions all sit at weight 0. Deploy run `37315313004` `completed` / `success` at 13:25:38Z. A later run (`37317432919`, `b7c1f7cbe2`) began at 13:33:25Z and had produced no revision by the closing read.
- Worker image invariant: out of scope — no worker job is touched or asserted by this release.
- Feature/env flag update path: not used. Flags were read from the serving SHA and left unchanged.
- Live signed-in proof required: **yes, and this record is it** — for #9003, #9005, #9006, #9007, #9008, #9012, #9013, #9015, the notes-trigger half of #9016, the OFF state of #9002, and the non-regression of the `moves_capture_v2` path on its six discriminators, on the synthetic demo tenant only. It is explicitly **not** proof for #9009, #9011, #9014, #9018 or the dock-header half of #9016.

## Rollback Plan

Revert the pull request. Nothing to undo at runtime: no migration, no flag, no
image, no traffic weight and no data was changed. The acceptance block and this
record would be removed and the fourteen merges would return to `deployed,
unverdicted`. U-566 and U-567 would remain filed, because what they name is in
the product and in the walk method, not in this release.

## Audit Evidence

- The matrix block *2026-10-05 seventeenth wave — walked on serving SHA `bbe053153e`*, which carries the sweep arithmetic, the fifteen result rows, the queue-drain account with its named exception, and the stated limits.
- Deploy runs `37315313004` (`bbe053153e`), `37313500788` (`97598648d8`), `37311673160` (`f4b52697c1`) — all `success`.
- ACR manifest metadata for `sha256:78c09e2c…6964d`: single tag `main-bbe05315`.
- `az containerapp show` and `az containerapp revision list` output at 13:26:36Z, 13:36:38Z and 13:38:14Z.
- The claim and release lines for U-565 in the operator register.
- U-566 and U-567 in the operator backlog.

## Known Gaps

Four of the fifteen result rows are `blocked` and none is a `fail`, all named
above and in the matrix block rather than implied.

- **Three client-visible merges reached no observation at all** — #9018's
  Stage 04 panel, #9011's gate figures and #9014's canvas summary — and a
  fourth, #9009, reached only one of its two halves: its negative side (supplier
  content absent off its own phase) holds on all four served events, while the
  panels it concentrates the guard inside were never rendered. For each, the
  reason is read out of the code or the served data, not guessed.
- **U-566 is open.** The Stage 04 vendor-readiness panel renders on no served
  event. It should be settled as a data question — whether a served event is
  meant to reach the Responses stage — rather than by loosening the gate.
- **U-567 is open.** The capture flow's steps 2 and 3 are unreachable to a walk
  that performs no write, correctly, as a consequence of #9015. The wave family
  needs a new discriminator for those steps; until it has one, a missing
  mount-set figure is not a regression.
- **The discard-dialog figure of #9008 was not reached**, because opening that
  dialog risks discarding the intake.
- **Enforcement was not exercised.** Every refusal recorded — the disabled
  Continue, the disabled forward steps, the blocked P2 redirect — is a client
  affordance or a route response; no server-side gate was tested by attempting
  the action.
