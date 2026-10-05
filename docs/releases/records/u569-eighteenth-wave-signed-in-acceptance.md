# 2026-10-05-u569-eighteenth-wave-signed-in-acceptance — Eighteenth-wave signed-in acceptance walk

## Release ID

`2026-10-05-u569-eighteenth-wave-signed-in-acceptance`

## Status

`released`

## Plain-English Summary

Sixteen changes that were supposed to reach real users had landed since the last
signed-in walk, and nobody had looked at any of them on the running product. This
record is that walk. It changes no product behaviour: the only files it adds are a
dated block in the signed-in wave acceptance matrix and this record.

The headline is uncomfortable and is the reason the walk was worth doing.
**Only one of the sixteen could be seen working. Thirteen reach no screen at all,
and two more are switched off.** Not one of them is broken — every suite passes,
and the code does what its author says. They simply do not arrive anywhere a
person can look.

Three things explain all thirteen, and none of them is a mistake in the changes
themselves.

**Eight of them have nothing that reads them back.** They add a way to *write*
something — record who accepted a piece of evidence, record that a file was never
virus-scanned, store an award decision, load a research dataset, run a report from
a command line — and no screen in the product displays what was written. The work
is real and the storage is correct. A person using the product cannot tell any of
it happened.

**Two of them live on a page the product redirects away from.** A routing rule
sends every address beginning `/programs/<something>` over to the Moves screens,
and for the printable program report it quietly drops the `/report` part of the
address on the way. So that report, and the reasoning "Explain" panel that shows
why a decision was reached, are served to nobody. Both changes improved exactly
those two screens. Requesting the report in a browser produces "This item is not
available for this account" and a 404.

Worth saying plainly, because it was got wrong mid-walk and then corrected: the
report page's *own* code only redirects when the address contains an id of a
particular shape, which suggested other ids would work. They do not. The routing
rule sits above the page and catches everything. The walk checked by asking the
browser rather than by reading the code, which is the only reason the error was
caught.

**Three of them are behind switches that are off for every client.** That is
deliberate and correct for work that is landing in slices. It does mean the screen
cannot be checked yet, and this record says so rather than counting an empty screen
as a success.

**The one that worked is worth describing**, because it is the kind of thing only a
walk catches. A table of per-phase approvals used to answer the question "who
approved this?" with a fixed name that was not read from anything, and used to say
a phase was "Approved" when all it actually knew was that the work had moved past
it. On screen now, every approver cell reads "Not recorded", and a phase the work
has merely advanced past reads "Gate passed" with a note explaining that this is an
inference and that no approval record was consulted. The word "Approved" appears
nowhere on that page. This was checked on two different pieces of work so that both
states — one at the beginning, one already handed off — were actually seen.

## Layer Impact

None. Layer 4 (products) was observed, not changed. No intake, adapter, canonical
model or product code is touched by this release; the two files added are
documentation.

## Client Applicability

All clients indirectly, none directly. The walk was performed on a single governed
synthetic tenant, which is not named here because this repository is public. One
finding is explicitly tenant-scoped and labelled as such in the matrix: the captured-brief review screen is superseded by the redesigned capture
flow for tenants enrolled in it, so that row is not a claim about tenants that are
not enrolled.

## Changes Included

- `docs/acceptance/signed-in-wave-acceptance-matrix.md` — one new dated block,
  `2026-10-05 eighteenth wave`, with sixteen rows, the stated limits of the walk,
  three filed residue items and two observations recorded but not filed.
- `docs/releases/records/u569-eighteenth-wave-signed-in-acceptance.md` — this
  record.

## QA / Validation

The walk itself is the validation, and it was bounded on both ends.

- **Serving SHA established from two independent sources that agree.** The
  Container App template image for `ca-abarva-web-lab-eastus` and the sole
  100%-traffic revision `--m4835f97f` both carry
  `sha256:18efa3113d726684b6c89ef31e7c95bd10ee17617b4b4eaaecf9ed8594cee70f`,
  Healthy / Running. Serving SHA `4835f97fb6`.
- **The invariant was re-read at the end of the walk and had not moved**, so every
  reading in the block was taken on one build. The walk ran 17:55:00Z–18:00:28Z.
- **Sweep derived from the build, not from a row list.**
  `git rev-list --first-parent bbe053153e..4835f97fb6` returns 24 merges, 16 of
  them `feat(`/`fix(` on a product surface. Each candidate was checked with
  `git merge-base --is-ancestor`.
- **Every `blocked` verdict names a mechanism read out of the code or the served
  data**, and most are corroborated by an observed absence as well as by the code.
- **No test was run, weakened or changed.** No product code was executed beyond
  rendering served pages.

## Rollout Plan

Merge to `main`. The repo-owned ACA deploy workflow builds and deploys as usual.
There is nothing to roll out: no served behaviour changes.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. This release runs no `az` write command.
- Approved image digest: not applicable — this release introduces no image of its
  own. The digest observed and recorded during the walk is
  `sha256:18efa3113d726684b6c89ef31e7c95bd10ee17617b4b4eaaecf9ed8594cee70f`.
- ACA runtime invariant: read twice during this work, at 17:55:00Z and 18:00:28Z,
  and held both times — template image and sole 100%-traffic revision identical.
- Worker image invariant: not read. This release changes no worker job, and no
  claim is made about worker digests.
- Feature/env flag update path: not used. No flag was enrolled, unenrolled or read
  through any mutating path; flag state was read from the registry at the serving
  commit.
- Live signed-in proof required: **this release is itself the live signed-in
  proof** for the merges its matrix rows verdict. It owes none of its own: the two
  files it adds are documentation and change no served surface.

## Rollback Plan

Revert the commit. There are no migration constraints and no runtime effect; the
matrix would lose one dated block and the repository would lose this record.

## Audit Evidence

- The matrix block `## 2026-10-05 eighteenth wave — walked on serving SHA
  `4835f97fb6`` in `docs/acceptance/signed-in-wave-acceptance-matrix.md`, which
  carries the per-row observations verbatim.
- ACA revision and template reads for `ca-abarva-web-lab-eastus` in
  `rg-abarva-controlplane-lab-eastus`, taken at the start and end of the walk.
- Deploy run history for `aca-main-deploy.yml`: run `37344542626` (`9b2900ba0e`,
  success) and the run on `4835f97fb6` that placed the walked revision; seven
  cancelled runs between 15:37Z and 17:48Z are named in the matrix block as the
  reason the queue could not be drained.
- The claim and release lines for item `U-569` in the operator register.

## Known Gaps

- **One deploy run was outstanding at both walk start and walk end:**
  `ddbd95aabe` (#9026), queued. `git merge-base --is-ancestor` puts it on `main`,
  so it *can* shift shared web traffic — unlike the seventeenth wave's outstanding
  runs, which were on a pull-request branch. It did not shift traffic during the
  window, which is proven by the closing invariant read rather than assumed. The
  queue could not be drained: it grew during the twenty minutes spent trying.
- **`aaaeb9707d` (#9046) and `ddbd95aabe` (#9026) are not in this build** and are
  explicitly not verdicted here. They are the nineteenth wave's floor.
- **No `fail` was recorded, and that must not be read as a clean bill.** Only one
  of the sixteen reached a screen in a state where it could have failed.
- **Two rows are absences, not demonstrations.** Rows 2 and 3 are consistent with
  their feature switch being off and evidence nothing about the enabled path.
- **Row 4's finding is tenant-scoped.** The captured-brief review may render for a
  tenant not enrolled in the redesigned capture flow; no such tenant was walked.
- **Three successor items are filed from this walk and are not closed by it:**
  `U-570` (the redirected program report route, which needs a product decision —
  retire the report or give it a reachable path — and is deliberately not guessed
  here), `U-571` (every host of the reasoning Explain drawer is unreachable) and
  `U-572` (the Stage 04 vendor-readiness panel still renders on no served event,
  one wave after that gap was first settled as a data question).
