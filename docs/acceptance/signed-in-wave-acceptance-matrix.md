# Signed-in wave acceptance matrix

`merged` is not `deployed`, and `deployed` is not `live-proven`. A wave reaches
`live-proven` only when somebody signs in to the deployed SHA and reads the
surface. This file is where those walks are recorded, one dated block per wave,
so that the evidence for "a person looked at this" lives in the repository
rather than in a register line that asserts it.

## How to read a row

Each row names one surface, the pull request whose behaviour it is proving, and
a verdict:

- **pass** — the behaviour the merge claims was observed on the deployed SHA.
- **fail** — the surface was reached and the claimed behaviour was not there.
  Every `fail` carries a filed item id; a `fail` with no id is an unfinished row.
- **blocked** — the surface could not be reached, or proving it would have
  required an action the walker was not authorised to take. The reason is
  stated; "blocked" is never a quiet "pass".

A walk records what was *observed*. Where a claim's enforcement lives on the
server and the walk only saw the client affordance, the row says so rather than
implying the server was exercised.

## Standing boundary for an unattended walk

A walk performs no write. It reads surfaces, changes client-side view state
(a pivot dimension, a chapter, a tab), and observes refusals **as refusals** —
a disabled control, a gate that reports a blocker, a next step that will not
open. It does not commit an action to discover whether the server refuses it,
because for a gate the failure mode under test *is* the action succeeding, and
an unattended run must not discover that by performing it. A row needing a
committed write is `blocked`, with the write named.

---

## 2026-10-05 thirteenth wave — walked on serving SHA `8bcfa6fa6f`

**Item:** U-560.
**Walked:** 2026-10-05, between 00:33:00Z and 00:45:25Z, by
`source-backlog-executor#20261005T0031Z`.
**Signed in as:** the platform-admin session on an existing browser session. No
credential was entered on any host during this walk.

**Which SHA, and why it is not pinned.** U-560 says to resolve the serving SHA at
walk time, unpinned, because `C-635` became unexecutable by naming a literal the
runtime then moved past. The serving SHA was `8bcfa6fa6f` (#8982). It was also
`origin/main` at walk start; **it was not at walk end**, and that is recorded
below rather than smoothed over.

**The serving SHA is established from two independent sources.** A revision
suffix is a label a deploy wrote, and an overtaken run can leave one that is not
the build's; so the registry was asked first. `az acr manifest show-metadata` on
the serving digest returns exactly one tag, `main-8bcfa6fa`. The revision name
`--m8bcfa6fa` agrees with it. Two sources, one answer.

**Runtime invariant, read with read-only `az` before the walk (00:34:48Z) and
again at the walk's end (00:43:07Z), unchanged across both reads:**

| | |
|---|---|
| Container App template image | `sha256:09e0d5a0…f100` |
| 100%-traffic revision | `ca-abarva-web-lab-eastus--m8bcfa6fa`, sole entry, weight 100 |
| That revision's own image | `sha256:09e0d5a0…f100` — identical to the template |
| Revision state | `active` / `Healthy` / `Running`, created 00:11:02Z |

**#8982's deploy state was resolved here, not read from the item.** U-560 was
filed while deploy run `37245988466` was still `in_progress`. At walk time that
run reads `completed` / `success`, `createdAt` 00:03:41Z → `updatedAt`
00:13:41Z, and the digest equality above is what proves the build is serving.

### The ancestor sweep — re-derived, not inherited

The item names three merges. A wave that trusts its predecessor's list is how a
merge goes unseen, so the population was recomputed and then compared with the
item's.

- All three named merges asserted ancestors of the walked build with
  `git merge-base --is-ancestor`: `8d31c2ea52`, `3ee3df21e8`, `8bcfa6fa6f`. None
  had to be dropped.
- The repository squash-merges, so `--merges` over `15de62ec41..8bcfa6fa6f`
  returns **0** and the sweep has to be taken over `--first-parent`, which
  returns **4**.
- The fourth is `230d13cb13` (#8981), the twelfth wave's own record. It is
  excluded as docs-only **by measurement, not by its subject line**: 0 files
  under `src/app`, `src/components` or `src/lib` outside tests.
- So the item's row list and the re-derived sweep agree exactly, at 3. This is
  the first wave in this family where they did; it is stated because the check
  is what makes the agreement worth anything.

**The predecessor's digest is not its walked SHA, and nearly closed this row by
mistake.** `U-559`'s release line reports deploy proof on build `8bcfa6fa6f` —
the same build walked here. Read quickly, that says the twelfth wave already
covered this ground. It did not: the twelfth-wave block in this file records the
walk itself on serving SHA `15de62ec41`, between 23:26:07Z and 23:30:26Z, and
the `8bcfa6fa6f` digest in that line is the deploy of U-559's own docs commit,
which happened *after* its walk and verdicted nothing. A deploy digest in a
release line is where the record landed, not what the walker looked at.

### `moves_charter_basis_v1` observed on the runtime, not in `registry.ts`

A merged source default is not a serving state, so the flag was read off the
running surface. The discriminators are `data-testid="charter-basis-<section>"`
and `data-testid="charter-assumption-badge"`, both of which exist in
`CharterBasisField.tsx` and in no other component — and that component is
rendered only through `renderSectionBasis`, which `MovesPhaseStandaloneClient`
supplies only when `charterBasisEnabled && phase.phase === 1`.

**An absence only means something if the mount point was there to fill**, so
both sides were measured on the P1 Charter capture of a Move on the synthetic
demo tenant:

| Step | `.mcf-question` mount points rendered | `charter-basis-*` | `charter-assumption-badge` |
|---|---|---|---|
| 1 — Scope the bet | 3 | 0 | 0 |
| 2 — People & decisions | 2 | 0 | 0 |
| 3 — Plan the proof | 2 | 0 | 0 |
| **total** | **7 — the whole P1 Charter input set** | **0** | **0** |

Seven places for the ON-path control to appear, and it appeared in none. The
redesigned capture itself was confirmed present in the same reads
(`data-testid="moves-capture-flow"` = 1), so the host that would have mounted it
was running. **`moves_charter_basis_v1` is OFF on this runtime for this tenant.**

Stepping 1 → 2 → 3 is a client-side view change and no write: `MovesCaptureFlow`'s
footer button calls `go(view + 1)` for views 0 and 1 and touches no network. The
step-3 button, which is the one that calls `onSubmitPhase()`, was **not** pressed.

### Results

| # | Surface | Merge | Verdict | What was observed |
|---|---|---|---|---|
| 1 | Moves P1 Charter capture — per-field basis control | #8982 `8bcfa6fa6f` | **pass (OFF path only)** | 7 of 7 capture mount points rendered; 0 basis controls and 0 assumption badges. The flag-off contract is "nothing here renders", and nothing did. |
| 2 | Moves P1 Charter advance gate — minimum-viable evidence | #8980 `8d31c2ea52` | **pass (OFF path only)** | The legacy approved-evidence lock is still what the surface reports: the gate panel reads `INPUTS 0/7`, `GATE 1/2 hard met`, blocker "7 phase inputs still missing from persisted server state", and the phase-build control is `disabled` reading "Complete phase inputs before build". On a second Move the evidence half of the same legacy lock was the reported blocker instead ("1 required evidence item still need approval or coverage"), so both legs of the OFF branch were seen, not one. |
| 3 | Source New — terminal demo NDA envelopes | #8948 `3ee3df21e8` | **blocked** | The component this merge changes renders on **no event the surface serves**. Measured on all 5 events, not inferred. Reason below; filed as `D-519`. |

### Row 3's reason, stated three ways rather than as "not visible"

`SourceNewNdaCapture` returns `null` when no supplier is `not_covered`, so an
empty surface has several possible causes and the walk separated them.

1. **The surface is absent from every event.** 0 `snw-nda-suppliers` containers
   and 0 NDA-capture nodes in the server HTML of all **5** events.
2. **The demo e-sign provider is unconfigured on this runtime.**
   `/api/v1/source/<id>/nda/esign/status` returns `200` with
   `{"available":false,"fallback":"upload","suppliers":[]}` on all 5. Because
   `suppliers` is present at all, the route took its final branch — so the
   tenant check passed and `available:false` means `runtime.provider === null`.
3. **There are zero accepted candidate supplier authorities**, which is a
   different statement from "zero envelopes". `suppliers: []` comes off a query
   whose driving CTE is `accepted`, with the envelope joined by `LEFT JOIN
   LATERAL`; an empty result names the empty *driving* side. The envelope table
   is not what was measured here and no claim is made about it.

So the `voided` state note, the reworded `declined` note, the awaiting-readback
guard and the `Resend` label are all unexercised on this runtime. **The merge is
evidenced by its own tests; it is not evidenced by this walk**, and rounding row
3 up to a pass on the strength of those tests is the substitution this file
exists against.

### The ON path is owed, and was not manufactured

`moves_charter_basis_v1` reads `includeTenants: []` — no tenant — and the only
legitimate route to an ON observation is a reviewed PR through the governed
path. No flag was changed to create evidence for this walk; a walker mutating
tenant flag state to produce its own proof is the inverse of proof. The ON path
of **both** #8980 and #8982 is therefore **owed**, not inferred, and neither row
above claims it.

### A bundle string was nearly read as a rendered state

Checking whether the three filled Charter textareas were unsaved aVa drafts, the
server HTML for the page was searched for `ava-draft-` and returned **17**
occurrences — which looks like seventeen rendered draft markers. The hydrated DOM
returns **0**. The 17 are the component's own source inside the inlined script
payload, not nodes. The DOM answer is the one used, and the near-miss is recorded
because reading a page's bytes for a *rendered* state is the same mechanism that
produced earlier manufactured findings in this lane.

### Stated limits of this walk

1. **Row 2's refusal was read, not exercised.** The blocker sentence is composed
   client-side from server-supplied counts. Exercising the server-side refusal in
   `missingP1CaptureSections` means POSTing an advance, which is a write, and the
   standing boundary above forbids it: for a gate, the failure mode under test is
   the action *succeeding*.
2. **One tenant.** Every observation is on the single synthetic demo tenant the
   signed-in session reaches. Nothing here speaks for any other tenant.
3. **`main` moved during the walk.** Two further merges, `8b22aa5a90` and
   `62b5f135c2`, had deploy runs created at 00:41:42Z and 00:42:22Z — after the
   walk began. They are outside this wave and a fourteenth is already owed. The
   runtime invariant was re-read at 00:43:07Z and still showed `8bcfa6fa6f` at
   100%, so no deploy landed *inside* the walk window.
4. **No write anywhere.** No product surface was written to and every `az` call
   was a read. Three textareas held text that the gate reports as unpersisted;
   settling which side is right needs a read of the server's capture modules that
   this walk had no read-only route to, so it is reported as unsettled below
   rather than as a defect.
5. **0 console errors** on both walked surfaces, on loads taken *after* console
   tracking was enabled rather than attached afterwards.

### Residue — filed, not absorbed

- **`D-519`** — the Source New NDA e-sign surface is unexercised on every event
  the runtime serves, for two independent reasons measured above. Adjacent to
  `D-518`, which names the contactable-policy half of the same precondition; this
  one sits a layer earlier, at zero accepted candidates and an unconfigured demo
  provider.

### Noted, not filed

- **Seven P1 Charter answers render in the textareas while the gate reports
  `INPUTS 0/7` and "7 phase inputs still missing from persisted server state".**
  The displayed value is `{...phaseCaptureValues, ...avaDraftValues}` while the
  count comes from capture-module completion, so the two can legitimately
  disagree when a draft is unsaved — but no aVa draft marker renders on those
  fields. It is **not** attributable to either walked merge: the flag-off branch
  of `missingP1CaptureSections` is the legacy gate unchanged, and #8982 renders
  nothing at all. Settling it needs the server's capture-module rows for the
  Move, which is a read this walk could not make from the browser.
- **The rendered event list is a floor, again.** The hydrated page's anchors give
  **4** Source New events; the same page's server HTML gives **5**. All 5 were
  walked. This is the third wave in this family to meet the same shape, and it is
  now cheap to check: take the server list, never the rendered one.

---

## 2026-10-04 twelfth wave — walked on serving SHA `15de62ec41`

**Item:** U-559.
**Walked:** 2026-10-04, between 23:26:07Z and 23:30:26Z, by
`source-backlog-executor#20261004T2325Z`.
**Signed in as:** the platform-admin session on an existing browser session. No
credential was entered on any host during this walk.

**Which SHA, and why it is not pinned.** U-559 says to resolve the serving SHA at
walk time, unpinned, because `C-635` became unexecutable by naming a literal the
runtime then moved past. The serving SHA was `15de62ec41` (#8976), which was also
`origin/main` at walk start and still was at walk end.

**The serving SHA is established from two independent sources.** A revision
suffix is a label a deploy wrote, and an overtaken run can leave one that is not
the build's; so the registry was asked first. `az acr manifest show-metadata` on
the serving digest returns exactly one tag, `main-15de62ec`. The revision name
`--m15de62ec` agrees with it. Two sources, one answer.

**Runtime invariant, read with read-only `az` before the walk and again at
23:30:26Z, unchanged across both reads:**

| | |
|---|---|
| Container App | `ca-abarva-web-lab-eastus` |
| Template image | `sha256:c7487b6f5a9bf1022caf75c8051a058a3a30ad867c7bc2241564ef7b88a2a48b` |
| 100%-traffic revision | `ca-abarva-web-lab-eastus--m15de62ec` — sole entry, weight 100 |
| Revision image | identical to the template image |
| Revision state | `active: true`, `Healthy`, `Running`, created 23:23:29Z |
| Registry tag on that digest | `main-15de62ec`, sole tag, pushed 23:21:38Z |

Both reads returned the same digest and the same sole revision, so no deploy
landed inside the walk.

### The ancestor sweep — re-derived, and the population is not the item's three

U-559 names three merges. The sweep was re-derived anyway, because a wave that
trusts its predecessor's list is the failure this row family exists against.
Every first-parent commit between the eleventh wave's walked SHA (`6b6b2af358`)
and this one was enumerated and each checked with
`git merge-base --is-ancestor`. **The repository squash-merges, so a merge is a
first-parent commit and not a merge commit** — `--merges` over the same range
returns 0, which is why the sweep is taken over `--first-parent` instead.

**3 commits are new since the eleventh wave's build; all 3 are ancestors.** The
fourth row below is not new — it is a row the eleventh wave swept and
dispositioned, re-opened here because its disposition's ground has been
withdrawn. So this wave's population is **4**, not 3, and not the eleventh
wave's 60.

| Disposition | Count | Merges |
|---|---|---|
| **Walked here** | 3 | #8975 #8973 #8976 |
| No product surface — nothing under `src/app`, `src/components` or `src/lib` outside tests, so `deployed` is the ceiling | 1 | #8977 |

All three of `e08beb6ab5` `a45468a6de` `15de62ec41` were asserted ancestors of
the walked build, as U-559 requires. `e08beb6ab5` was separately asserted **not**
an ancestor of `6b6b2af358`, which confirms U-559's reading that it fell outside
the eleventh wave's sweep on the clock rather than through an omission in it:
it merged at 22:42:28Z and that walk ended at 22:39:49Z.

**#8977's exclusion was measured, not assumed:** it touches 2 files, this matrix
file and a release record, and no non-test file under `src/app`,
`src/components` or `src/lib`.

### Both flags were observed on the runtime, not read off `registry.ts`

This is the thing U-559 says not to get wrong, so it is recorded per flag with
the discriminator named. A merged source default is not a serving state.

| Flag | Observed | Discriminator used, and why it discriminates |
|---|---|---|
| `moves_home_v2` | **ON** | 34 distinct `mh-*` classes in the hydrated DOM, `.mh-table` ×1, `.mh-recon` ×1, `[aria-label="All moves"]` ×1, `[aria-label="Reconciliation with client inventory"]` ×1, the `mh-rail`/`mh-rail-dot` phase rail, and the *"Waiting on you"* triage. The OFF path's own discriminator is **absent**: the predecessor client's view switcher (*"View: Kanban"*) is gone. |
| `moves_capture_v2` | **ON** | `[data-testid="moves-capture-flow"]` ×1, `.mcf-phasebar` ×1, `.mcf-stepbar` ×1, the three step titles *"Scope the bet"* / *"People & decisions"* / *"Plan the proof"*, the footer *"Step 1 of 3"*, and 3 question labels on step 1. Confirmed on **three** separate moves' phase-1 pages from the server HTML before the hydrated read, so the observation is not one page's accident. |

**Two strings were rejected as discriminators rather than used.**
*"Reconciled, not merged"* is present on **both** paths — it is in
`strategic-moves/page.tsx` as well as in `MovesHome.tsx` — so it cannot
distinguish them, and it was the string the first (wrong) reading had in hand.
*"Waiting on you"* is also in `AgentRail.tsx`, so it is corroboration and not
proof; the `mh-*` classes exist in no other component and carry the verdict.

### A stale document inverted this verdict once, and the cause is datable

The first read of the Moves surface, taken at the pre-claim session check,
returned **zero** `mh-*` elements and would have been recorded as
`moves_home_v2` **off**. It was wrong, and not by a flaky render: deploy run
`37242940382` for `15de62ec41` completed at **23:26:07Z**, and that read was
taken before it. The document in the tab had been served by the predecessor
revision, so what looked like a flag state was the age of a document. A
same-origin `fetch(…, {cache:'reload'})` of the identical URL immediately
afterwards returned HTML containing `mh-table` ×2 and `mh-recon` ×8; the tab was
then reloaded and the hydrated DOM agreed with the server. **Every observation
this block's verdicts rest on was taken after 23:26:07Z**; the pre-claim check
at roughly 23:24Z is named here as the thing that was discarded, and is not
evidence for anything.

Recorded because the mechanism is general and this file has recorded its mirror
before: a reading taken across a traffic shift reports the build it was served
by, not the build the registry names, and nothing in the reading says so. The
walk window in this block's header starts at the traffic shift for that reason.

### Results

| # | Surface | Merge | Verdict | What was observed |
|---|---|---|---|---|
| 1 | Moves Home — the redesigned portfolio landing (`MovesHome`) | #8975 | **pass**, on the **ON** path | The flag-on landing renders: a *"Waiting on you"* triage ordered oldest-first with the specific ask per move, an all-moves table (`.mh-table`, `[aria-label="All moves"]`) with the six-dot phase rail, the reconciled-with-client-inventory panel (`.mh-recon`), and the headline value line *"39 of 52 moves have declared value; the rest declare in Charter."* — a sentence whose two counts come from the governed portfolio and reconciliation totals the adapter reads, not from anything the surface invents. 0 console errors across the load. |
| 2 | Moves phase capture — the 3-step capture flow (`MovesCaptureFlow`) | #8973 | **pass**, on the **ON** path — and this row's eleventh-wave exclusion is now withdrawn | The eleventh wave excluded this merge as *"flag off, and observed off rather than read off the registry"*. That ground was correct at 22:39:49Z and #8976 withdrew it at 23:12:50Z. Observed on: the 3-step bar with its three titles, the phase bar, step 1 titled *"Scope the bet"* carrying 3 questions, and the footer *"Step 1 of 3"* — on three moves, not one. 0 console errors across the load. |
| 3 | The flag enablement itself | #8976 | **pass** | #8976's only non-test product file is `src/lib/features/registry.ts`, where both flags move from `includeTenants: []` to the synthetic demo tenant. Its claimed effect is that exactly those two surfaces become reachable on exactly that tenant, and rows 1 and 2 are that effect observed on the runtime. This row is the merge's verdict; it is not independent evidence of rows 1 and 2. |

### Which path was produced, and which is owed

U-559 asks for this explicitly, because a single-sided observation of a flag
branch is how a disjunction goes half-asserted.

**Produced: the ON path of both flags**, walked on the synthetic demo tenant —
the one tenant both flags' `includeTenants` name, so it is the only tenant on
which the ON branch is observable at all.

**Owed: the OFF path of both flags**, which is the default every other tenant
gets. It was not walked, and it is not inferred from `isFeatureEnabled`'s
fail-closed shape — that would be reading the source, which is what this row
forbids. Proving it needs a signed-in session on a second tenant, and no flag
was changed to manufacture one: U-559 forbids an executor mutating tenant flag
state to create its own evidence, and #8976 already made that change the right
way, as a reviewed pull request.

### Stated limits of this walk

The eleventh wave's 52-merge inherited disposition was **not** re-verified here.
This wave re-derived its own population over `6b6b2af358..15de62ec41` and
re-opened one row by name; it does not re-assert the dispositions of merges below
its lower bound. #8963 remains open, so the six merges whose verdicts sit only in
it stay excluded on the ninth wave's ground, unchanged by this block.

Row 1's value line was read as rendered. The two counts in it were not traced to
the governed facts they are sourced from, so the row says the sentence rendered
with the counts the adapter produced, and does not assert those counts are
right.

No write was performed on any surface. No approval was submitted, no candidate
accepted, no phase advanced, no capture step saved, no move created. The
interactions were navigation and same-origin `GET` reads issued with the session
already in the browser. No Azure mutation; every `az` call is a read.

### Noted, not filed

The tenant's display name renders on the Moves surface, and it is the synthetic
fixture tenant. It is not carried into this block or into the release record,
per the public-repo discipline U-559 names; the flags, the components and the
merges are named instead, which is what a later reader needs.

## 2026-10-04 eleventh wave — walked on serving SHA `6b6b2af358`

**Item:** C-596.
**Walked:** 2026-10-04, between 22:31:41Z and 22:39:49Z, by
`source-backlog-executor#20261004T2229Z`.
**Signed in as:** the platform-admin session on an existing browser session. No
credential was entered on any host during this walk.

**Which SHA, and why it is not pinned.** C-596 says to resolve the serving SHA
at walk time and assert ancestry, which is the unpinned form `C-635` proved
necessary by becoming unexecutable when the runtime moved past the literal it
named. The serving SHA was `6b6b2af358` (#8974), which was also `origin/main` at
walk start and still was at walk end. `d756684bf6` (#8971), the merge this item
exists to verdict, is an ancestor of it, asserted with
`git merge-base --is-ancestor`.

**The serving SHA is established from the registry, not from the revision
name.** A revision suffix is a label the deploy writes, and an overtaken run can
leave one that is not the build's own; so the serving digest was resolved
independently — `az acr manifest show-metadata` on
`sha256:16716748…` returns exactly one tag, `main-6b6b2af3`. The revision name
`--m6b6b2af3` agrees with it, which is the point: two sources, one answer.

**Runtime invariant, read with read-only `az` before the walk and again after
it, unchanged across both reads:**

| | |
|---|---|
| Container App | `ca-abarva-web-lab-eastus` |
| Template image | `sha256:167167481e0b23bac257e5f7f651c3b98f512e15393a417f6790b153b3ebd49e` |
| 100%-traffic revision | `ca-abarva-web-lab-eastus--m6b6b2af3` — sole entry, weight 100 |
| Revision image | identical to the template image |
| Revision state | `active: true`, `Healthy`, `Running`, created 17:24:56Z |

Read at 22:31:41Z and again at 22:39:49Z; both reads returned the same digest
and the same sole revision, so no deploy landed inside the walk. The 17:14:57Z
digest the item quotes was **not** reused — C-596 forbids it, and these are two
fresh reads of a different digest.

### The ancestor sweep — re-derived, and six rows newer than the last one

Every first-parent merge between the oldest wave SHA this file records
(`e085442776`) and the walked SHA was enumerated with `git rev-list
--first-parent` and each checked with `git merge-base --is-ancestor`.
**60 merges; all 60 are ancestors.** The ninth wave swept 54 over the same
lower bound, so the sweep is that disposition plus the six merges that have
landed since, each dispositioned below rather than inherited.

| Disposition | Count | Merges |
|---|---|---|
| Dispositioned by the ninth wave's sweep, unchanged | 52 | the 54 it swept, less #8913 and #8914 |
| Verdicted by the tenth wave | 2 | #8913 #8914 |
| **Walked here** | 1 | #8971 |
| No product surface — nothing under `src/app`, `src/components` or `src/lib` outside tests, so `deployed` is the ceiling | 4 | #8969 #8970 #8972 #8974 |
| Product files, but the only path they add is behind a flag that is off for every tenant — **observed off on the runtime**, see below | 1 | #8973 |

**#8963 is still open** — re-read at walk time, `state: OPEN`, `mergedAt: null` —
so the six merges whose verdicts sit only in it (#8915 #8917 #8939 #8940 #8942
#8944) stay excluded on exactly the ground the ninth wave excluded them, and do
not fall back to this item. They are counted inside the 52 above.

**The four no-product-surface merges were measured, not assumed:** #8969 touches
an operator loader under `scripts/source/` and a doc; #8970 and #8972 are this
file and a release record; #8974 is `scripts/exec/` and a release record. None
touches a non-test file under `src/app`, `src/components` or `src/lib`.

### Results

| # | Surface | Merge | Verdict | What was observed |
|---|---|---|---|---|
| 1 | Source New — Stage 04 accepted-candidate panel, supplier contact readiness | #8971 | **pass**, and the differing-label result is **null**: 0 of 4 rows differ — established by unreachability, not by two counts agreeing | #8971 moves the readiness test from "some active contact in the embedded registry payload carries an e-mail" to "`activeContactCount > 0`", where the count is now a `source.vendor_contact` subquery keyed on tenant and vendor. **All five of the tenant's source events were read, not one**, because a panel with no rows and a panel whose rows all agree look alike: four serialize an accepted-candidate panel with **0** rows, and one carries **4**. On that one, per supplier row, by synthetic registry id — `SYN-SUP-AMS-001`, `-002`, `-003`, `-004` — the panel prints `Active contacts: 1` and the contact blocker *"Contact requires review before any approach."*, with contact policy *review required*, all four in the `not under contract` group. **Why no row's label can differ, which is stronger than observing that none does:** `contactReadiness` returns `review_required` on the policy check *before* it reaches the line #8971 changed, so for a `review_required` row the old and new rules are the same function. The policy value that reaches the changed branch is `contactable`, and it occurs **zero** times across the serialized payloads of **all five** events — so no row on this tenant exercises the changed line at all. A null result is a pass here, and the reason it is null is recorded rather than left as a coincidence. |
| 1a | — the same row's other client-visible half | #8971 | **pass on the after-side only**; the before-side is cited, not observed | The merge also changes the number the panel prints. Its own release record states that an independent read-only database query found four active canonical contacts while the panel still displayed **zero**. This walk observed the after-side — **1** on each of the four rows, four in total, which is the count that record names — and it cannot observe the before-side, because the runtime has moved past it. Recorded as consistent-with rather than as a measured 0 → 1 transition. |
| 2 | Moves phase capture — the 3-step capture flow | #8973 | **excluded — flag off, and observed off rather than read off the registry** | C-596 forbids treating #8973 as live-proven while `moves_capture_v2` is off. It is off: the flag is registered `policy: "tenant"` with `includeTenants: []`, and on the signed-in Moves phase page the server serializes `captureV2Enabled: false`, the live DOM carries exactly one `data-capture-v2` element whose value is `off`, and the flag-on path's own first step string *"Scope the bet"* appears **0** times. The excluded merge is therefore excluded on an observation, not on an assertion about a config file. |

### The readiness label is derived from the blocker sentence, and that is said rather than glossed

C-596 asks for "the readiness label shown". The accepted-candidate row does not
print the readiness token — it prints the blocker sentence
`contactBlockerFor` returns for it. That mapping is injective: `ready` → no
sentence, `prohibited` → *"Do not contact: …"*, `review_required` → *"Contact
requires review before any approach."*, `missing_contact` → *"No active contact
record; …"*. So the sentence determines the label uniquely and the label above
is a derivation from what the panel renders, not a reading of a token the panel
does not have. The literal tokens *ready* / *review required* / *prohibited*
**do** appear on the same page, on the `Suggested for review` rows — a different
projection, built by `buildSourceRequestSupplierSuggestions`, which #8971 does
not touch. They are not this row's evidence and are named here so a later reader
does not mistake them for it.

### Stated limits of this walk

The embedded `contacts[]` array the pre-#8971 rule read is **not serialized to
the client** — the panel row shape drops it — so the old rule's input could not
be recomputed from the surface. This is why row 1 is argued from the policy
short-circuit, which needs no access to that array, rather than from a
side-by-side of the two rules' outputs.

Four of the five events carry zero accepted candidates. That is reported as
zero driving rows, not as zero envelopes or zero contacts: an empty panel is
equally consistent with no acceptances having been recorded and with an
acceptance read that returns nothing, and this walk does not distinguish them.

No write was performed on any surface. No approval was submitted, no candidate
accepted, no phase advanced, no envelope drafted or sent, no template published,
no file saved. The only interactions were navigation, one stage-section
selection on a phase already marked `Recorded` — whose own banner states that
viewing it does not mark it complete, approve any gate, or change the current
stage — and same-origin `GET` reads issued with the session already in the
browser. No Azure mutation; both `az` calls are reads.

### The hydrated page offered four events; the server offered five

The event list was first taken from the rendered DOM — `a[href*="/source/new/"]`
returned **4** distinct events. The same page's server HTML returns **5**. The
fifth was fetched and read like the other four (zero accepted-candidate rows),
so the conclusion is unchanged, but the discrepancy is recorded because it is
the shape of error a wave walk exists to avoid: a surface's own rendered list is
a floor, and taking it for the population is how a row goes unverdicted. Read
the server's list, then read every member of it.

### Noted, not filed

The page's raw HTML could not be read through the reading tool at two offsets:
the tool returned `[BLOCKED: Cookie/query string data]` in place of the bytes
around two `data-capture-v2` occurrences. The question was then answered on the
live DOM instead, which returned the attribute value directly. Recorded because
a censored read that is mistaken for a measurement inverts a verdict, and this
file has recorded that class of near-miss before.

## 2026-10-04 tenth wave — walked on serving SHA `a69aff1552`

**Item:** C-638.
**Walked:** 2026-10-04, between 15:42:45Z and 15:50:05Z, by
`source-backlog-executor#20261004T153945Z`.
**Signed in as:** the platform-admin session on an existing browser session. No
credential was entered on any host during this walk.

**Which SHA, and why it is not pinned.** C-638's acceptance says "the
then-deployed SHA" rather than a literal, which is what makes it executable at
all — `C-635`, filed the same day, pinned `e085442776` and became unexecutable
the moment the runtime moved past it. This walk resolved what was serving,
stamped it, and asserts ancestry: the serving SHA was
`a69aff1552` (#8970), which was also `origin/main` at walk start. Both merges
C-638 names are ancestors of it, asserted with `git merge-base --is-ancestor`:
`2fe1d2f7f2` (#8913) and `9fbddbffa0` (#8914). **`origin/main` advanced to
`d756684bf6` while the walk was in progress and the serving revision did not
follow it** — both bracketing `az` reads returned the same revision — so no
deploy occurred inside the walk, which is the property the bracket exists to
establish.

**Runtime invariant, read with read-only `az` before the walk and again after.**
At 15:42:45Z and again at 15:50:05Z the Container App template image and the
sole 100%-traffic revision were the same digest,
`sha256:973c5abde5cf269a32c28e871e31b2159c3223a4300f10f2efc756ab72767b2b`, on
revision `ca-abarva-web-lab-eastus--ma69aff15`, `Healthy` / `Running`. Two
independent reads, identical, bracketing the walk.

**What this block does not cover.** The ninth wave (C-595) walked
`a756bfc0ef`, an ancestor of this SHA, 50 minutes earlier and explicitly
excluded #8913 and #8914 as "named by open item C-638, whose acceptance owns
them". Those two merges are what this block proves. Nothing here should be read
as acceptance of any other merge.

| # | Surface | Merge | Verdict | What was observed |
|---|---|---|---|---|
| 1 | Moves artifact quality signal, on the move's Files & Evidence panel | #8913 | **pass** — and held on both sides, per artifact | A *display normalisation* defect is invisible to anyone holding only one side, so both were held in the same session. **Route side:** `GET /api/v1/programs/<id>/artifacts` returned 34 artifacts, **16** carrying a score, distinct values `{80, 82, 90}` — **0** at or below 1, **0** non-integer, **0** above 100, which is the shape `qualityScoreForDisplay` exists to guarantee. **Rendered side:** the panel printed `Automated quality signal N/100` **5** times. The two were joined **per artifact** by each card's own creation stamp rather than compared as sets, because a set-wise match is satisfiable by a sibling: `12:28 PM → 82` twice, `12:21 PM → 80` twice, `12:19 PM → 90`, and the route's value for each of those three stamps is `82`, `80`, `90`. **5 of 5 agree.** |
| 2 | NDA envelope draft state | #8914 | **blocked** — on two preconditions, either of which alone is sufficient | The merge's subject is reached by an e-sign provider webhook, which no signed-in read can drive, and the state it would record does not exist to be read. Measured rather than assumed, via `GET /api/v1/source/<eventId>/nda/esign/status` across **all 5** of the tenant's source events: every one returned **HTTP 200** with `available: false` and `suppliers: []`. So (a) the provider is undispatched on this runtime, the same condition `C-635`'s acceptance permits stating, and (b) **zero supplier rows are returned**, so no envelope state is reachable to be asserted. **That second reading is deliberately narrower than "zero envelopes exist", which would be an over-claim:** the loader builds each supplier row from accepted vendor candidates and `LEFT JOIN LATERAL`s the envelope onto it, so an empty result is equally consistent with no accepted candidates and with no envelopes. This read does not distinguish the two, and does not need to — either way there is no draft state a walk can reach. **The migration is named as the acceptance requires:** `supabase/migrations/20261003160000_source_nda_esign_draft_state.sql`. Its applied state is **not established by this walk and is not asserted** — the 200 proves only that `source_nda_esign_envelopes` reads, and the loader's query selects `provider_envelope_id, status, …` and not the `document_sha256` column the migration adds, so a 200 is consistent with either state. The nearest evidence, recorded as indirect: the most recent `apply`-mode `db-migration-lab` run (37146008226, 2026-10-03T19:13Z) reports `migrationName: 20261003170000_source_nda_synthetic_admin_publication.sql` and `totalMigrationsApplied: 406`, and 170000 sorts after 160000 — suggestive of an ordered ledger having passed it, not proof of it. No envelope was drafted or sent, and none could have been. |
| 3 | Moves board — build and run identifiers on client-visible labels | #8938 | **pass** — third consecutive unchanged reading | A re-read of `U-553`, which C-638's acceptance asks for as a second reading. It is in fact the **third**: C-592 measured **0 of 8** on `031eec1f24` and the ninth wave reproduced **0 of 8** on `a756bfc0ef`. On `a69aff1552` the board carries **8** move names and **0** of them carry a build or run identifier — no `E2E` token, no `<YYYYMMDD>T<HHMMSS>Z` run stamp, no `Evidence-<MM>-<DD>T<HH>-<MM>` build vintage. Against U-553's own filing of **5 of 8** on `44b50dcd3d`, the count has gone 5 → 0 and has now stayed 0 across three SHAs. A changed count would itself have been the finding; it did not change. |
| 4 | Generated narrative on the Home cockpit | #8922 | **pass** — confirmed, with a positive control the first reading did not carry | A second re-read of `C-637`, which the fifth wave already measured as 0 across 1,112,296 characters on `aa23d2c31f`. Re-measured on `a69aff1552` over the **raw server response** for `/home` — 1,188,433 bytes, the same corpus size the item measured at 1,188,437 — **0** matches for the broken shape `/\d\.\s+\d/`, in the raw response and in rendered `innerText` alike. **A zero is worth nothing without a control that the corpus was there**, so: the same response carries **1,041** correctly-formed decimals, and each of the five strings the item named by hand appears only in its correct form and **zero** times broken — `17.4%` ×10, `9.1%` ×7, `496.4M` ×10, `4.5+` ×18, `6.4%` ×6 — with the chapter-01 and chapter-08 markers the item cites present on the page. The count has gone 4 → 0. |

### Stated limits of this walk

Row 2 is `blocked` and names both of its preconditions and the migration file;
it is not a quiet pass, and the migration's applied state is reported as
unestablished rather than inferred from a 200.

Rows 3 and 4 are re-readings of items already measured at 0 by earlier walks.
They are recorded as confirmations on a newer SHA, not as new findings, and
each cites the reading it repeats.

No write was performed on any surface. No approval was submitted, no phase
advanced, no envelope drafted or sent, no template published, no file saved to
disk. The only interactions were navigation, a workspace-tab selection, and
same-origin `GET` reads issued with the session already in the browser. No
attempt was made to learn a gate's fail-closed behaviour by performing the
write it refuses.

## 2026-10-04 ninth wave — walked on serving SHA `a756bfc0ef`

**Item:** C-595.
**Walked:** 2026-10-04, between 14:53:16Z and 15:00:24Z, by
`source-backlog-executor#20261004T144934Z`.
**Signed in as:** the platform-admin session on an existing browser session. No
credential was entered on any host during this walk.

**Which SHA, and why it is not pinned.** C-595 forbids pinning a literal SHA,
for the reason C-635 demonstrated by becoming unexecutable when the runtime
moved past the one it named. This walk resolved what was serving, stamped it,
and asserts ancestry. The serving SHA was
`a756bfc0efb4cdb6ab1108edda60debe183bd83a` (#8968), which was also `origin/main`
at walk start and still was at walk end.

**Runtime invariant, read with read-only `az` before the walk and again after
it, unchanged across both reads:**

| | |
|---|---|
| Container App | `ca-abarva-web-lab-eastus` |
| Template image | `sha256:ca854803a00764918314befae9ace1e847e7e2f0a4682f7f6a6fb830219f7a2f` |
| 100%-traffic revision | `ca-abarva-web-lab-eastus--ma756bfc0` — sole entry, weight 100 |
| Revision image | identical to the template image |
| Revision state | `active: true`, `Healthy`, `Running`, created 14:41:37Z |

Read at 14:53:16Z and again at 15:00:24Z; both reads returned the same digest
and the same sole revision, so no deploy landed inside the walk.

### The ancestor sweep — re-derived, not inherited

C-595's acceptance says to run the sweep again rather than trust its own list,
and that instruction earned its keep: the sweep now returns **54** first-parent
merges against the 51 C-592 swept. Every merge that is an ancestor of the walked
SHA and newer than the oldest wave SHA this file records (`e085442776`) was
enumerated with `git rev-list --first-parent` and each checked with
`git merge-base --is-ancestor`. **54 merges; all 54 are ancestors.**

**The three that are new since C-592's sweep add no residue, and that was
checked rather than assumed:** #8966 `071d8cd34e`, #8967 `a09b88dbbb` and #8968
`a756bfc0ef` each touch **zero** non-test files under `src/app`,
`src/components` or `src/lib`, so `deployed` is their own ceiling. The residue
is therefore still exactly the nine C-595 names, each re-confirmed to touch
product files, and none of the nine had gained a verdict row — before this block
all nine appeared in this file only inside C-592's disposition table.

**#8963 is still open** (`MERGEABLE`, `CLEAN`, `mergedAt` null, re-read at walk
time), so the six merges whose verdicts sit in it stay excluded on exactly the
ground C-592 excluded them, and do not fall back to this item.

| Disposition | Count | Merges |
|---|---|---|
| Carried a verdict row in this file before this walk | 17 | #8918 #8922 #8923 #8925 #8927 #8931 #8932 #8934 #8936 #8937 #8949 #8950 #8952 #8953 #8955 #8958 #8964 |
| No product surface — nothing under `src/app`, `src/components` or `src/lib` outside tests, so `deployed` is the ceiling | 20 | #8916 #8919 #8928 #8929 #8933 #8943 #8945 #8946 #8947 #8951 #8954 #8956 #8957 #8959 #8960 #8961 #8962 #8966 #8967 #8968 |
| Verdicts exist only in **unmerged** PR #8963 (C-586, sixth wave). Not re-walked and not claimed as covered | 6 | #8915 #8917 #8939 #8940 #8942 #8944 |
| Named by open item C-638, whose acceptance owns them | 2 | #8913 #8914 |
| **Walked here** | 7 | #8891 #8920 #8921 #8924 #8926 #8938 #8941 |
| **Blocked by construction — the crawl auth lane, see row 6** | 2 | #8930 #8935 |

### Results

| # | Surface | Proving | Verdict | What was observed |
|---|---|---|---|---|
| 1 | Home v4 enterprise-context panel | #8891 | **blocked** — the data precondition is unmet on every tenant this surface serves | #8891's client-visible half is `EnterpriseContextPanel`, mounted from `HomeV4App` behind `contextHeading && enterpriseContext`, with the `technology_data` heading additionally gated on `enterpriseContext.dependencyProof`. **It renders on no chapter of either preview tenant, and that was established from both sides rather than from one empty page.** On the tenant `/home` serves by default the record source reads `Reviewed stored record`, which is the reviewed-snapshot fallback and carries no context by design. On the other preview tenant the page reaches the live path — record source `Live governed rows`, `Source-linked: 2,910 of 2,938 record rows` — and **still** renders no panel: all seven context headings were probed by selecting each chapter in turn, **0 of 7** rendered, while the frame around them *was* mounted on all seven (`[data-home-reviewed-interpretation]` present each time), so the absence is the context and not the frame. The server payload settles it: `homeEnterpriseContext` is serialized exactly once and its value is `null`, and `dependencyProof`, `riskPaths`, `programPaths` and `projectedLinks` appear **zero** times in a 3.0 MB payload. **Why `blocked` and not `fail`:** `buildHomeEnterpriseContext` returns `null` unless it finds exactly one *cited* enterprise-profile row, at least one cited business segment, at least one cited business function, a declared business model on a synthetic-reference basis, and unique non-empty segment keys. Which of those is unmet is a projection-row question, not a surface question — a walk cannot see it. **Precondition, and who may clear it:** the data plane (lane D) must establish a source-linked enterprise context for a preview tenant; until then this panel is unreachable and no walk can promote it. Filed as residue below. |
| 2 | Home walkthrough export — the absence declaration | #8926 | **blocked** — the declaration exists only inside a generated document | #8926's change is a branch ladder that makes the export *say which absence it is* rather than silently omitting the section. The affordance is present and was read: the Home surface carries a `HOME EXPORT` block reading "Walkthrough export: chapters, tables, exhibits, evidence labels and record-source state." with `HTML` and `PDF` controls. **The declaration text itself is emitted only into the exported document**, and C-595's acceptance requires this row be taken "read-only, without performing an export", so the sentence was not observed. **Stated as a prediction, not an observation:** given row 1's finding that a serving projection *is* read on the live tenant and `homeEnterpriseContext` is `null`, the branch that tenant's export would take is `context_not_established`. Nothing here claims that was seen. Clearing this row needs either permission to generate one export, or a read-only surface that renders the declaration outside the document. |
| 3 | Source New — synthetic NDA template publication | #8921 | **pass** | Read on the one event whose `03 Suppliers & NDA` stage is `Recorded`. Opening that already-passed stage declared its own harmlessness — "This phase holds recorded work. Viewing it does not mark it complete, approve any gate, or change the current stage" — re-confirming item 20 again on a later SHA. Both halves #8921 names are present under `STAGE 05 · NDA READINESS`. **Upload:** a `TEMPLATE PDF` block with a `file` input and an `Upload PDF` submit. **Publication:** an `UPLOADED PDF` select carrying one already-uploaded option, plus `TEMPLATE VERSION`, `DISPLAY NAME`, `DECISION RATIONALE`, a `required` acknowledgement checkbox read from the DOM as `checked: false`, and a `Publish synthetic template` submit. The submit is **not** disabled — the gate is the required acknowledgement, which is a different mechanism from a disabled control and is recorded as what it is. **Lab-fenced in the product's own words:** "Lab event only. Admin publication is recorded as a synthetic test decision, not Legal approval or an executed NDA", and the readiness block states "A completed signing envelope does not grant coverage; a named reviewer must record the executed document or Legal waiver." Posture `Blocked before supplier work`, `Accepted suppliers 4 · Covered 0 · Blocked or unknown 4`, with the NDA-authority line `Not recorded` on all four. **No file was selected, nothing was uploaded and no template was published.** |
| 4 | Source New — market-package label on the phase rail | #8941 | **pass** on the unaccepted half; the accepted half is **blocked** | #8941 makes `sourceNewMarketPackageLabel` check *acceptance* rather than branch on a bare motion, returning the neutral `Market package` unless both `solicitationMotionAcceptedAt` and `solicitationMotionAcceptedByUserId` are recorded. **All four events in the walked tenant were read, not one**, because a single neutral label cannot distinguish a working guard from an absence of motions: all four serialize `solicitationMotionAcceptedAt: null` and all four render the neutral label. The strongest reading is the event sitting *at* that stage — its rail reads `04 Market package · Current` and its section heading `MARKET PACKAGE`, with **zero** visible occurrences of `RFP` anywhere on the rendered page although the server HTML for that same event contains 47, which places them in serialized data and narrative rather than in the label. **The accepted half could not be reached:** no event in this tenant has an accepted motion, and recording one is a write. The refusal state was observed; the acceptance was not performed. |
| 5 | Moves board — run-stamp stripping on client-visible labels | #8938 | **pass**, and the count is unchanged across two SHAs | A re-read of `U-553`, which C-592 measured as **0 of 8** on `031eec1f24`. On `a756bfc0ef` the board carries **8** move links and **0** of their names match #8938's own stamp pattern `\b(?:19\|20)\d{6}T?\d{6}Z?\b`; the pattern also matches **0** times anywhere in the rendered page, so no derived display code carries one either. The harness token `E2E` appears **0** times on the board, and `smoke` **0** times. The count is reproduced unchanged, which is the finding C-592's row asked for; a changed count would itself have been the finding. |
| 6 | Crawl auth lane | #8930 · #8935 | **blocked** by construction | Both merges change only `src/lib/crawl`, whose sole exercise is the crawl lane itself. That lane's Clerk secret is the dev-instance mismatch filed as `C-581` and owed as an operator secret, so no walk can exercise either merge. Recorded as blocked against `C-581` rather than omitted, exactly as C-595's acceptance requires. **Who may clear it:** the operator, by provisioning a matching Clerk secret. |
| 7 | No rendered surface | #8920 · #8924 | **not a row** — `deployed` is the ceiling | #8920 changes `src/lib/security/rls-precondition-classification.ts` and #8924 changes `src/lib/programs/types.db.ts`. Neither reaches a rendered surface, so each is disposed of with that reason stated rather than given an invented row. |

### The walk lane's own tool censors the walk's own verdict — a controlled finding

C-592 recorded that the browser tool's output redaction can manufacture a
defect, having watched a PDF filename read back as `[BLOCKED: JWT token]`
through three separate reads. **That same string reproduced here** — the
`UPLOADED PDF` option still reads back as a redaction placeholder, is 55
characters long, and recovers as an ordinary filename when the dots are
substituted. So that half is confirmed on a later SHA.

What is new, and is worse, is that the redaction keys on **the name the walker
gave the variable** and censors whatever is under it, including values that
never came from the page:

| Probe | Value returned |
|---|---|
| `authorityPresent: t.includes(<phrase>)` | `[BLOCKED: Sensitive key]` |
| `a: t.includes(<same phrase>)` | `true` |
| `harnessTokenCount: (t.split('smoke').length-1)` | `[BLOCKED: Sensitive key]` |
| `n1: (t.split('E2E').length-1)` | `0` |
| **`authorityPresent: 42`** — a literal the walker wrote, with no page input at all | `[BLOCKED: Sensitive key]` |
| **`plainNumber: 7`** — the negative control | `7` |

Same page, same expressions, different key names, different answers. The last
two rows are the control: a literal `42` is censored under a key named
`authorityPresent` while a literal `7` passes under `plainNumber`, so the
scrubber is not simply always-on and the redaction is attributable to the key
name rather than to the content. Key names containing `authority` or `token`
were the triggers observed here.

**Why this is more expensive than C-592's instance.** There the tool rewrote
what the *page* said, and a careful walker re-reading the string recovers the
truth. Here the tool rewrites what the *walker concluded*. A row written as
`authorityRecorded: false` reads back as `[BLOCKED]` and invites a `blocked`
verdict where the truth was a `fail`; the inversion runs the other way just as
easily. **Any walk that keys a result object on a page phrase should re-run the
same probe under a neutral key before writing the verdict down** — which is what
was done for every affected reading in this block.

### Stated limits of this walk

- **Rows 1 and 2 are the substance of #8891 and #8926 and neither was proven.**
  Row 1 is blocked on a data condition that no walk can clear, and row 2 is
  blocked on an action this acceptance forbids. Nothing here should be read as
  evidence that the Home enterprise-context work is live-proven; it is not.
- **Row 3 observed client affordances only.** Whether the server refuses an
  unauthorised publish was not tested, because testing it means performing the
  publish, and for a gate the failure mode under test *is* the action
  succeeding.
- **Row 4's accepted half and row 6 are blocked by a write and by an operator
  secret respectively.** Neither is a quiet pass.
- **No phone-width reading.** This walk ran at `innerWidth` 1512 throughout and
  made no attempt to resize; the 375 px row C-592 left owed is still owed and is
  not claimed here.
- **The six merges whose verdicts sit in open PR #8963 are not covered here.**
  If that PR is closed without merging, those six return to residue.

No write was performed on any surface. No upload, no template published, no
motion accepted, no NDA sent, no approval submitted, no stage advanced, no
export generated and no file downloaded. The only interactions were navigation,
chapter selection and stage selection — all client-side view state — plus
read-only DOM inspection and same-origin `GET` reads of pages already reachable
by navigation. Two gated surfaces were opened for reading and one declared that
reading it changes nothing.

### Residue — filed, not absorbed

- **The Home enterprise context is `null` on every tenant the surface serves**,
  including the one that reaches the live ECL serving projection, so #8891's
  panel and #8926's dependency-proof branch are both unreachable from any
  product surface today. This is a data-plane condition in lane D, not a UI
  defect, and it is upstream of any future attempt to live-prove either merge.
  **Filed as `D-517`**, and the id was the part that nearly went wrong. Three
  claim lines today reported that a successor could not be filed at all, because
  the regenerated queue reports the `C-500`–`C-599` **and** `T-500`–`T-599`
  bands exhausted at 0 of 100 free. That is true, and it is not the whole table:
  the `X-600` band showing 57 free C ids is **Codex's** band, not an unallocated
  one, so taking from it would re-create the precise collision the disjoint-range
  rule exists to prevent — two agents applying the same correct rule to the same
  range at the same moment. The finding is a data-plane condition and therefore a
  **lane D** item, and Claude's own `D-500`–`D-599` band reports **83 free**. The
  band table answers per lane *and* per agent; reading only its exhausted rows is
  what kept two earlier findings from being filed.

### Noted, not filed

- The default preview tenant serves the reviewed snapshot while the other serves
  live governed rows. Both are legitimate states and the surface labels each
  one, but a reader moving between them has no indication that the enterprise
  context is absent for *different reasons* in each.
- The live tenant's chapter 05 reads `Source-file quality: 0 of 14 accepted; 14
  partial` beside `Source-linked: 2,910 of 2,938 record rows`. A record that is
  97% source-linked out of files that are 0% accepted is either correct and
  uninteresting or two counters measuring different things under similar names.

---

## 2026-10-04 seventh wave — walked on serving SHA `031eec1f24`

**Item:** C-592.
**Walked:** 2026-10-04, between 13:36:58Z and 13:50:56Z, by
`source-backlog-executor#20261004T133344Z`.
**Signed in as:** the platform-admin session, tenant context resolved to the
governed healthcare reference tenant used for these walks. The tenant is named
nowhere in this block on purpose: this repository is public, and the habit of
not writing a tenant name into a public artifact is worth having before there is
a real one to protect.

**Which SHA, and why it is not pinned.** C-592 forbids pinning a literal SHA,
because C-635 pinned one and became unexecutable when the runtime moved past it.
This walk resolved what was serving, stamped it, and asserts ancestry. The
serving SHA was `031eec1f24a8daa3ae3b260a803e459a9afc5b26` (#8964), which was
also `origin/main` at walk start and still was at walk end.

| Merge | SHA | Ancestor of `031eec1f24` |
|---|---|---|
| #8949 Moves horizontal phase stepper | `f431ae90c7` | yes |
| #8950 Moves aVa docked left on desktop | `d9e927f3c8` | yes |
| #8952 Moves P3–P5 workflow actions simplified | `b4b97d79a6` | yes |
| #8953 Moves phase workspace navigation consolidated | `9f5702fe23` | yes |
| #8955 Source lab NDA upload and repeat template publication | `373a0b93a5` | yes |
| #8958 Moves P1 uploads kept out of inferred gate families | `731187eab0` | yes |
| #8964 Moves P1 capture bound to approved evidence | `031eec1f24` | yes |

**Runtime invariant, read independently with read-only `az` before the walk and
again after it, unchanged across both reads:**

| | |
|---|---|
| Container App | `ca-abarva-web-lab-eastus` |
| Template image | `sha256:1ddf77fd5d941e3186078a93efbf9453e1388363b899175d8c8eaccb5a8e37b7` |
| 100%-traffic revision | `ca-abarva-web-lab-eastus--m031eec1f` — sole entry, weight 100 |
| Revision image | identical to the template image |
| Revision state | `active: true`, `Healthy`, `Running` |

Read at 13:36:58Z and again at 13:50:56Z; both reads returned the same digest
and the same sole revision, so no deploy landed inside the walk.

### The ancestor sweep — the mechanism, not the list

C-592's acceptance asks for this and it is the reason the item exists: a wave
record that names merges as a hand-built list has left residue three times
running. So before any verdict was written, **every** merge that is an ancestor
of the walked SHA and newer than the oldest wave SHA this file records
(`e085442776`) was enumerated with `git rev-list`, and each one checked with
`git merge-base --is-ancestor`. **51 merges; all 51 are ancestors.** Every one
is accounted for below — as a row here, or as a named exclusion with its reason.

| Disposition | Count | Merges |
|---|---|---|
| Already carries a verdict row in this file | 10 | #8918 #8922 #8923 #8925 #8927 #8931 #8932 #8934 #8936 #8937 |
| No product surface — nothing under `src/app`, `src/components` or `src/lib` outside tests, so `deployed` is the ceiling | 17 | #8916 #8919 #8928 #8929 #8933 #8943 #8945 #8946 #8947 #8951 #8954 #8956 #8957 #8959 #8960 #8961 #8962 |
| **Verdicts exist only in an unmerged pull request** — #8963 (C-586, sixth wave) walked these on `de09c6b806` and is open, mergeable and green, so this file does not yet hold them. Not re-walked, and not claimed as covered | 6 | #8915 #8917 #8939 #8940 #8942 #8944 |
| Named by open item C-638, whose acceptance owns them | 2 | #8913 #8914 |
| **Walked here** | 7 | #8949 #8950 #8952 #8953 #8955 #8958 #8964 |
| **Residue — a product surface, no verdict, and no item that owns it.** Filed as **C-595** so it is not discovered a fourth time | 9 | #8891 #8920 #8921 #8924 #8926 #8930 #8935 #8938 #8941 |

The residue row is the sweep earning its keep: C-592 named four merges, and the
sweep found nine more client-visible merges that no acceptance covers at all.

**#8949 merged empty, and the sweep is how that surfaced.** `f431ae90c7` has one
parent and a zero-file diff against it — the stepper change and *both* release
records landed inside #8950's squash (`d9e927f3c8`) 21 seconds earlier. So
#8949's content is live and #8949's own commit proves nothing; row 1 settles it
from the surface instead.

### Results

| # | Surface | Proving | Verdict | What was observed |
|---|---|---|---|---|
| 1 | Moves phase surface — layout, at desktop width | #8949 · #8950 · #8953 | **pass** | Measured from the live DOM at `window.innerWidth` **1180**, `matchMedia('(min-width: 1024px)')` true. **#8953:** the collapsible left rail is gone — `document.querySelectorAll('.mxw-side')` returns **zero** elements — and the consolidated horizontal tab set renders with the four base labels `Steps`, `Files & Evidence`, `Intelligence`, `Approvals`, all four visible at y=260. The conditional half of `workspaceTabs` is real too — a flag-gated fifth tab `Risk Assessment` renders on the P2 phase and on no other — though that observation was made in the narrow window of row 2, not at this width, and is recorded here only because it belongs to the same merge. **#8949:** `.mxw-phase-stepper` is present and horizontal — 1121 px wide, 64 px tall, at y=63 — carrying six steps with state classes `done` and `current viewing`, reading `Originate 3 of 3 · Charter 1 of 7 · Discover & Diagnose 0 of 8 · Design Future State 0 of 8 · Roadmap & Business Case · Mobilize & Handoff 0 of 4`. **#8950:** `.mxw-ava-pop` is docked to the **left** edge — `x = 0`, `y = 44`, 312 × 727 — not a floating bottom-right bubble; `.mxw-ava-fab` has zero size at this width. The same left dock renders on the Source New event canvas. |
| 2 | Moves phase surface — layout, at narrow width | #8949 · #8950 · #8953 | **pass**, with the width stated | Read in a browser window whose viewport measured `innerWidth` **606**, below both the `md` (768) and `lg` (1024) breakpoints. The narrow tab bar renders instead, with the shortened labels `Stage`, `Files`, `Intel`, `Approvals`; at 1180 px that same bar is in the DOM with `visibility` false and the full-label bar is the visible one. So the responsive switch is real and was observed from both sides rather than inferred. aVa renders as the bottom-right floating control at this width, which is the complement of row 1's left dock. **Not a phone-width reading:** 606 px is the same Tailwind band as 375 px but is not 375 px — see the stated limit below. |
| 3 | Moves phase workflow actions, P1 and P2 | #8952 | **pass** on the reachable half; the P3–P5 half is **blocked** | #8952's change is `phase.phase >= 1` → `phase.phase >= 1 && phase.phase <= 2` on the capture editor, plus removing a duplicate upload panel and an evidence-count link from the later phases. The `>= 1 && <= 2` half is directly observable and holds: the capture editor renders at **P1** (`Charter Inputs → Upload Evidence → Approve & Build`, `Step 1 of 10`) and at **P2** (`Prepare → Upload & Review → Review Findings → Approve & Build`, `Step 1 of 12`). The `<= 2` half could not be reached: **no Move in the walked tenant has cleared the P1 gate** — all eight active Moves sit at P1 Charter except one at P0 Originate — and `phase/3`, `phase/4` and `phase/5` each redirect to `phase/1?blockedPhase=N` and render a stated refusal: "P3 cannot begin yet · Finish the required P1 gate before opening P3", with `REQUIRED · P1 gate approval`. Clearing that gate is a write. The refusal was observed as a refusal and the gate was not cleared. |
| 4 | Moves P1 capture bound to approved evidence | #8964 | **pass** | The newest merge on the serving SHA, found by the sweep rather than named by C-592. All seven P1 inputs render `Needs approved evidence`. Step 1 carries `EVIDENCE OPEN`, a `REQUIRED SOURCE · Evidence for this step · Open` block, and the governing sentence "Add a source and have a reviewer approve it in Files & Evidence. This step stays locked until that evidence is approved." The binding is enforced on the control, not only in prose: `Save & continue` has `disabled === true`, while `Add evidence for this step`, `Open Files & Evidence` and `Refresh approved evidence` are all enabled. Nothing was typed and nothing was saved; the disabled state was read from the DOM. |
| 5 | Moves P1 upload gate-family routing | #8958 | **pass** on the declared-family affordance; the classifier itself is **blocked** | #8958 gives a P1 upload `reviewFamilyKey: 'p1_uploaded_evidence'` and `evidenceType: 'other'` by default rather than inferring a gate family. What a walk can see is the *declared, not inferred* shape, and it is there: the Files & Evidence upload form carries `Evidence applies to phase` (P0–P5, defaulting to the current phase) and a separate `Covers required evidence` whose **selected value is the empty string, rendering as `Not stated`** — the gate family is a human statement, not a guess. The existing corpus is consistent with it: `Evidence family coverage — cost baseline: 4 · current state process: 7 · it systems landscape: 3 · kpi baseline: 8 · org workforce: 2 · other: 1`, an `other` bucket that exists and is populated. **What is not proven:** the classifier's routing of a *new* P1 upload. Establishing that needs an upload, which is a write. No file was selected and no upload was submitted. |
| 6 | Source NDA capture, Stage 05 | #8955 | **pass** | Read on the one event that has `03 Suppliers & NDA` recorded; opening that already-passed stage declared its own harmlessness — "This phase holds recorded work. Viewing it does not mark it complete, approve any gate, or change the current stage" — which re-confirms item 20 again on a later SHA. Both halves #8955 names are present. **Upload:** `TEMPLATE PDF` with a `file` input and an `Upload PDF` submit. **Repeat template publication:** an `artifactId` select listing the already-uploaded PDF, plus `Template version`, `Display name`, `Decision rationale`, and a required acknowledgement checkbox reading "I authorize this PDF as a synthetic template for this event only", ahead of a `Publish synthetic template` submit. **Lab-fenced, in the product's own words:** "Lab event only. Admin publication is recorded as a synthetic test decision, not Legal approval or an executed NDA", and the readiness block states "A completed signing envelope does not grant coverage; a named reviewer must record the executed document or Legal waiver." Posture `Blocked before supplier work`, `Accepted suppliers 4 · Covered 0 · Blocked or unknown 4`, `NDA AUTHORITY` unrecorded on all four. **No file was uploaded and no template was published.** |

### A near-miss worth recording: the walk lane's own tool can manufacture a defect

On the Stage 05 NDA capture surface the `artifactId` option read back as the
literal string `[BLOCKED: JWT token]` through three separate reads — the page
text, the control dump and the option list — which looks exactly like a
redaction placeholder leaking into a client-visible control on a governed
publish path, and would have been filed as a `fail`.

It is not a product defect. `[BLOCKED: JWT token]` is the **browser tool's own
output redaction**, applied to what it returns, not to what the page renders.
The option's real text is an ordinary 55-character PDF filename, ending
`…_v1.0.pdf` — three dot-separated segments (`…_v1` · `0` · `pdf`), which is
JWT-shaped enough to trip a secret scanner. The filename itself carries a tenant
legal-entity code and so is not reproduced here; the shape is the whole finding. It was recovered by reading the same
string with the dots substituted, which the scrubber does not match; the
substituted read and `.length` agree, and `option.text === option.textContent`.

Recorded because the failure mode is general and expensive in both directions: a
reading lane that silently rewrites what it returns can manufacture a leak that
does not exist, and can equally hide one that does. **Any walk row resting on a
read-back string should be re-read in a form the scrubber cannot match before it
is written down as a verdict.**

### Stated limits of this walk

- **No phone-width row.** C-592 asks for the Moves phase surface at a phone
  width. Row 2 was read at 606 px, which is in the same Tailwind band as 375 px
  and is not 375 px. The walk lane could not set a viewport: `resize_window`
  returned success for 1280×800, 1600×1000 and 1800×1050 and `window.innerWidth`
  stayed 606 through all three. The 1180 px reading in row 1 came from a
  different browser window, not from a successful resize. A true 375 px row is
  owed and is **not** claimed here.
- **Row 3's P3–P5 half and row 5's classifier are blocked by a write**, each
  named above. Neither is a quiet pass.
- **The walk was interrupted.** The browser extension disconnected between the
  606 px reading and the 1180 px reading, and the second half ran in a new tab.
  No surface was reloaded to turn a failing reading into a passing one; rows 1
  and 2 are different widths read in different windows, and both are stated as
  such.
- **The six merges whose verdicts sit in open PR #8963 are not covered here.**
  If that PR is closed without merging, those six return to residue.

No write was performed on any surface. No upload, no template published, no
candidate accepted, no NDA sent, no approval submitted, no phase advanced, no
step saved, no file downloaded. The only interactions were navigation, stage
selection and workspace-tab selection — all client-side view state — plus
read-only DOM inspection. Two gated surfaces were opened for reading and both
declared that reading them changes nothing.

### Noted, not filed

- The P1 stepper reads `Charter 1 of 7` while the status card on the same screen
  reads `INPUTS 0/7`. Both are defensible readings of a seven-input phase; they
  are not the same number on the same screen, and a reader comparing them has no
  way to tell which counts what.
- One Moves evidence item renders `Session file · v13 · needs review` beside
  twenty-one items reading `Evidence · vN · aligned`. A v13 session file still
  needing review is either correct and uninteresting or a stuck review; the
  surface does not say which.

---

## 2026-10-03 fifth wave — walked on deployed SHA `aa23d2c31f`

**Item:** C-641.
**Walked:** 2026-10-04, between 02:00:16Z and 02:07:45Z, by
`source-backlog-executor#20261004T015700Z`.
**Signed in as:** the platform-admin session, tenant context resolved to the
composite reference tenant, labelled on the surface `COMPOSITE REFERENCE TENANT
· DEMO · CANDIDATE · UNREVIEWED · Synthetic portfolio. Not a customer, not a
case study.`

**Which SHA, and why it is not pinned.** C-641 deliberately does not name a SHA,
because C-635 did and its acceptance became unexecutable when the runtime moved
on. This walk stamps what was serving and proves ancestry instead. The serving
SHA was `aa23d2c31fcfd494bc834ee771762578757a480c` (#8945), and **every one of
the ten merges C-641 names is an ancestor of it**, by
`git merge-base --is-ancestor`:

| Merge | SHA | Ancestor of `aa23d2c31f` |
|---|---|---|
| #8923 Home leadership-voice spread | `698b83d830` | yes |
| #8932 Moves charter input guidance | `80fb04f4fe` | yes |
| #8934 Moves one next action | `b6bcb12977` | yes |
| #8937 Moves step clarity | `bf47142a79` | yes |
| #8922 Home narrative decimal guard | `3d919c674c` | yes |
| #8925 Moves run-stamp rendering | `3dc2d655b1` | yes |
| #8918 Moves regenerated-title suffix | `ae095e2dd3` | yes |
| #8936 Source NDA send authority | `6c1e71fa24` | yes |
| #8931 Moves synthetic reference drafts | `32d6e6f624` | yes |
| #8927 Canonical tenant alias resolution | `30e0d29d18` | yes |

Ancestry is the assertion this walk makes about the merges. It cannot be
invalidated by the next deploy, which is the whole point of the unpinned form.

**Runtime invariant, read independently with read-only `az` before the walk and
again after it, unchanged across both reads:**

| | |
|---|---|
| Container App | `ca-abarva-web-lab-eastus` (`rg-abarva-controlplane-lab-eastus`) |
| Template image | `sha256:1b909a50bed3385ed898dd7d5c56b849b3a98e2f26c1015f94a0fe04b365c7dc` |
| 100%-traffic revision | `ca-abarva-web-lab-eastus--maa23d2c3` — sole entry, weight 100, Healthy / Running, created 2026-10-04T01:21:50Z |
| Revision image | identical to the template image |
| `latestReadyRevisionName` | `ca-abarva-web-lab-eastus--maa23d2c3` — the same revision that carries the traffic |
| `job-abarva-deliv-worker` | identical to the template image |
| `job-abarva-deliv-worker-event` | identical to the template image |

Read at 02:00:16Z and again at 02:07:45Z; both reads returned the same digest,
the same sole revision and the same two worker images, so no deploy landed
inside the walk and no surface was reloaded onto a different build.

**Three merges were ahead of the serving SHA and are NOT proven here.** At walk
time `origin/main` was `f431ae90c7`, three merges beyond what was serving:
#8947 `4f29addd31`, #8949 `f431ae90c7` and #8950 `d9e927f3c8`. Two of the three
are client surfaces (a horizontal phase stepper, and docking aVa to the left),
so a sixth wave is already forming. Nothing in this block should be read as
acceptance of them — and the phase rail observed in row 2 is the **vertical**
one, which is the independent confirmation that #8949 had not reached the
runtime.

### Results

| # | Surface | Proving | Verdict | What was observed |
|---|---|---|---|---|
| 1 | Home leadership-voice spread, chapter 07 | #8923 | **pass** | Full-width spread below the readout card, not in the narrow column. **The ranking is real, not decorative:** the fourteen consensus rows under "Where the interviews converged … strongest agreement first" descend monotonically — 44, 44, 44, 41, 38, 38, 36, 36, 34, 29, 23, 23, 23, 22 of 44 — matching `LeadershipVoiceFull`'s sort by proportion. **The quotes resolve from governed signals, not a placeholder:** the chapter's selector takes `signal.domains.includes("ai_value_interview_evidence")` off the `EnterpriseSignalPacket` (`ChapterPage.tsx:1724`), and what renders is tenant-specific rather than plausible prose — quotes naming `Actuarial & Underwriting Analytics Modernization`, `Epic Resolute Professional Billing` and `STARS/HEDIS Quality Mart (SQL Server On-Prem)`, each tagged with the theme it was raised under. **Every office renders, not just the most-quoted:** the metric reads `5 OFFICES QUOTED` and exactly five office blocks are present — President & CEO, CFO, Chief Data & Analytics Officer, CIO, VP Finance Operations. The counterpoints the merge added are both shown: `RAISED BY A SINGLE LEADER` with two dissent themes, and `TESTIMONY AGAINST THE RECORD · 127 of 996 responses`. No raw machine token reaches the surface — themes render as words (`Value realisation`, `Estate fragmentation`), which is the half #8923 called out. |
| 2 | Moves phase-flow surface, read as one composite | #8932 · #8934 · #8937 | **pass** | Read as one surface rather than three merges, on a P1 Charter move. **Exactly one next action exists on the page** — a single `NEXT` field reading `Complete 7 required inputs`. Measured, not eyeballed: scanning the rendered text for every next-action shape (`next`, `next step`, `next action`, `do this next`, `recommended next`) returns **one** match on the whole surface. The three same-surface changes have not produced two competing next actions. **The charter inputs say what to write** (#8932): step 1 of 10 carries "The sponsor's name, role, and email. We only record them for progress updates — sponsor sign-off is not required to complete the charter", and the control reads `Fill this in to continue.` **Step clarity holds** (#8937): the workflow strip `Charter Inputs → Upload Evidence → Approve & Build` states its own ordering rule and disclaims a visual-only affordance — "Use the left steps in order. Approve & Build remains the governed close; it is not a visual-only button." Status card is internally consistent: `INPUTS 0/7`, `EVIDENCE 1 open`, `GATE 1/2 hard met`, seven named inputs in the rail. |
| 3 | Home narrative surface, cross-cutting | #8922 | **pass** — and **C-637 moves from 4 to 0** | The whole Home body was scanned for the broken shape rather than spot-checked: **zero** matches for `/\d\. \d/` across 1,112,296 characters, which covers the embedded server payload as well as the visible text — and C-637 established the broken form was present in the raw server response, so this is the same measurement surface, not an easier one. All five figures C-637 named render **correctly and in the exact context it named them**: exhibit 01's key message reads `"Epic (17.4%) and Microsoft (9.1%) together represent more than a quarter of the $496.4M vendor spend base."`, the chapter-01 synthesis reads `MA Star Rating to 4.5+`, and the chapter-08 synthesis reads `a 6.4% error rate at 36% automation`. Probed both ways: `17.4%`, `9.1%`, `$496.4M`, `4.5+` and `6.4%` all present; `17. 4`, `9. 1`, `496. 4`, `4. 5+` and `6. 4%` all absent. C-637's acceptance says a changed count is itself the finding; the count is **0**. |
| 4 | Moves labels on the board | #8925 · #8918 | **pass**, with the limit stated | **U-553 re-read: 0 of 8 move names carry a build or run identifier**, down from 5 on each of the two previous walks. The walk separates sanitizer from corpus instead of reporting the count alone, by reading the raw record beside the rendered one. `GET /api/v1/programs` returns eight programmes, one of which is raw `"Synthetic Meridian E2E Smoke - 20260923T161431Z"` — U-553's shape (a), verbatim — and the board renders that row as `"Synthetic Meridian Health"`. So shape (a) **is genuinely sanitized on the client surface, proven against the raw record on the same row**, and no bare stamp survives it, which is the one place U-556 / U-558's question becomes observable rather than theoretical. The other seven raw names are ordinary business names. |
| 5 | Source NDA send surface | #8936 | **blocked** — undispatched, with the path named | No send was attempted and none could have been. The gate is visible and reads as an authority gate, which is what #8936 claims: on the event that has recorded Suppliers & NDA, `NDA AUTHORITY — Not recorded` on **all four** accepted suppliers, readiness posture `Blocked before supplier work`, `Accepted suppliers 4 · Covered 0 · Blocked or unknown 4`, and the governing sentence "A completed signing envelope does not grant coverage; a named reviewer must record the executed document or Legal waiver." Four concrete preconditions block the send, each stated by the product rather than inferred: (a) "No published NDA template version is available for this event, so no executed document can be checked against one"; (b) NDA authority not recorded for any supplier; (c) `Active contacts: 0` on every accepted supplier, with one carrying `Contact policy: do not contact · Contact readiness: prohibited`; (d) on the second event walked, stage 03 is not open at all — "This phase is not yet open … Before this phase can open: scope and strategy must advance, then supplier eligibility and required NDA coverage must be recorded." The surface also declares its own limit rather than overclaiming: "The published template versions were supplied by the caller, not verified against the authority register here. A wrong list changes this answer." |
| 6a | Moves synthetic phase reference drafts | #8931 | **pass** | The reference draft renders on the charter step, headed `AbarVa reference draft · Synthetic · review before use`, with a substantive body ("Listed sponsor contact: VP of Payment Integrity; CFO is an escalation contact. Sponsors are informational contacts, not approvers…"). The fence the merge needs is present and unambiguous: "Not client-provided, captured, approved, or evidence. This does not complete the input or clear a gate." So the draft is shown **and** is prevented from reading as client evidence or as gate progress — which is the whole difficulty of showing a synthetic draft on a governed surface. |
| 6b | Canonical tenant alias resolution | #8927 | **blocked** — not reachable from any signed-in surface | C-641 pairs this with #8931 in one minimum row, and the pairing does not hold. #8927 changes `scripts/demo/clean-demo-moves-aca-job.ts`, its test and its docs — **no route, component or API response**. Its code path is an ACA job, which an unattended walk must not run. What a walk *can* say is weaker and is said as such: the tenant alias resolves consistently to one canonical display name across the board header, the move header, the left rail and the breadcrumb (`Meridian Health · WORKFLOW AUTOMATION · HEALTHCARE_IDN`), with no raw alias leaking, and the tenant-scoped programmes API answered 200. That is a surface consistent with the job having run correctly; it is not proof the job's resolution logic changed, and the row is `blocked` rather than a quiet pass. |

### The part of row 4 that is NOT proven, stated rather than implied

U-553 named two shapes and this walk only exercised one. Shape (b) —
`<tenant> Synthetic Rich Evidence-<MM>-<DD>T<HH>-<MM>`, the **four** rows of the
original five — does not appear in the raw API response at all, so those rows
left the corpus rather than being sanitized. The rule's sufficiency against
shape (b) is therefore **unproven, not met**: the rows that would test it no
longer render. U-553's own acceptance asks for the rule set to be derived from
the live corpus rather than from an example, and a corpus that no longer
contains the example cannot answer that. **0 of 8 must not be read as U-553
closed.**

### Stated limits of this walk

Rows 5 and 6b are `blocked` and each names what would unblock it; neither is a
quiet pass. Row 4 is split between what was proven against the raw record and
what the corpus can no longer test.

No write was performed on any surface. No approval was submitted, no phase
advanced, no step saved, no envelope drafted or sent, no file downloaded. The
only interactions were navigation, chapter selection, stage selection and tab
selection — all client-side view state — plus two read-only `GET` requests
issued with the signed-in session. Two already-passed or not-yet-open stages
were opened for reading; both declared that doing so changes nothing
("Browsing here does not advance the event", "Viewing it does not mark it
complete, approve any gate, or change the current stage"), which is itself an
independent re-confirmation of item 20 on a much later SHA.

### Noted, not filed

Each needs a product call rather than a guess, and is recorded so a later reader
does not re-discover it as new:

- The phase status card reads "1 required evidence item still **need** approval
  or coverage" — a subject–verb disagreement on a client surface, in the same
  card as the single next action.
- On the Source New board one event's title is a truncated scope sentence used
  as a name: "Meridian Health In scope for workflow testing: L1/L2 service desk,
  endpoint management, patch orchestration, device life" — cut mid-word. This is
  the Source analogue of U-553's question about what belongs in a client-visible
  name, on a different surface and under no existing item.
- Three of the eight Moves rows share one programme code
  (`HEALTHCARE_IDN-MEMBER-2026`) across the names "Member Service Agent Assist"
  (twice, identical) and "Member Service Agent Assist Transformation". Whether
  the duplication is intended seeding or drift is not established here.
- The leadership-voice band reads `16 THEMES COUNTED` against fourteen rendered
  consensus rows. It is **not** a defect: `themeCount = consensus.length +
  dissent.length`, and two dissent themes render in the counterpoint card
  (`AI governance`, `Finance evidence`). Recorded because the arithmetic is not
  visible from the surface and a later reader would reasonably file it.

---

## 2026-10-03 wave — deployed SHA `44b50dcd3d`

**Item:** C-633.
**Walked:** 2026-10-03, between 15:21Z and 15:36Z, by `source-backlog-executor#20261003T1515Z`.
**Signed in as:** the platform-admin session, tenant context resolved to the
governed healthcare fixture tenant. Synthetic portfolio; the surface labels
itself `DEMO · CANDIDATE — UNREVIEWED · Synthetic portfolio. Not a customer, not
a case study.`

**Runtime invariant, read independently with read-only `az` before the walk and
again after it, unchanged across both reads:**

| | |
|---|---|
| Container App | `ca-abarva-web-lab-eastus` |
| Template image | `sha256:5bb19ba545a5ffd1fc81c4fde49b1ce8dfe15d48d5ba08246a25751fdee209ca` |
| 100%-traffic revision | `ca-abarva-web-lab-eastus--m44b50dcd` — sole entry, weight 100, Healthy / Running |
| Revision image | identical to the template image |
| Deploy run | `aca-main-deploy` 37131672723 on the merge SHA, `createdAt` 2026-10-03T15:00:15Z, `updatedAt` 2026-10-03T15:08:34Z, success, and the newest run of that workflow |

No deploy occurred during the walk: the second read returned the same digest and
the same sole revision as the first. No surface was reloaded to change a result.

### Results

| # | Surface | Proving | Verdict | What was observed |
|---|---|---|---|---|
| 1 | Home v4 governed chart grid | #8901 | **pass** | Exhibits render with an argument-shaped title, a key message, and an exhibit eyebrow naming the record they are drawn from — e.g. `EXHIBIT 01 · THIRD-PARTY SPEND`, "Two vendors … carry over a quarter of total vendor spend", with the two shares named in the subtitle. Counted across the briefing: 5 of 9 chapters render a plotted exhibit; 4 render none. The absence is declared rather than silent — one chapter states `EVIDENCE NOT YET SERVED` and "no rows of it reached this page. That is a gap in what was served, not a gap in the record." |
| 2 | Home v4 Technology & Data cross-dimensional pivot | #8901 | **pass** | `PIVOT BY` offers five dimensions and `MEASURE` two. Re-pivoting changes both the chart and its honesty line: Provider gives "Top 8 of 53" with "Showing the 8 largest of 53. 45 more rows are in the record and in the table below"; Criticality gives "Top 3 of 3" and "All 3 rows are shown"; switching Function from annual cost to count re-ranks the bars rather than re-labelling them. The scatter declares its own exclusion: "4 applications declare no debt score and are not plotted — counted in the table, not drawn here, so the scatter never reads a missing score as zero." |
| 3 | Moves board client surface | #8903 | **fail** — filed as **U-553** | Half the merge is live and half is not. The raw data-build stamp is gone from the portfolio header, as claimed. The move-title sanitizer is not sufficient on the real corpus: **5 of the 8 move names on the board carry a build or run identifier**, in two shapes neither of the sanitizer's rules matches — a trailing run timestamp after a mid-string token (`Synthetic <tenant> E2E Smoke - <YYYYMMDD>T<HHMMSS>Z`) and a trailing build vintage (`<tenant> Synthetic Rich Evidence-<MM>-<DD>T<HH>-<MM>`, four rows). |
| 4 | Phase transition refused for want of evidence | #8907 | **pass** | On one P1 move: `GATE 1/2 hard met`; "1 hard gate blocker remain before this phase can advance. Workbook available · acceptance required before next phase". The distinction the merge adds is visible — "Workbook review recorded · 15 accepted · 0 needs validation · 0 rejected · 0 pending · readiness 0 ready / 6 insufficient / 9 unknown", so acceptance alone does not confer readiness, and individual responses read `Required · Unknown · Accepted` and `Required · Insufficient_evidence · Accepted`. The refusal names what is missing: "What P2 Discover & Diagnose will need" lists current-state process / operating documentation, systems landscape, and KPI / metric baseline. P2–P5 are disabled in the phase rail. |

### Stated limits of row 4

The refusal was observed as a refusal. The walk did **not** attempt the
transition, so the server-side fail-closed behaviour on the gate-approval and
phase-generation routes is evidenced by that merge's own tests and not by this
walk. Proving it live needs a committed action against tenant data and is owed
as a separate, authorised step.

### Noted, not filed

Two things on the phase surface are already owned elsewhere and are recorded
here only so a later reader does not re-discover them as new: the evidence
rollup reads `Covered` while transition readiness is `0 ready / 6 insufficient`,
and a review state renders as the raw enum `Insufficient_evidence`. #8903's own
record places both in a separate workflow-correctness workstream.

---

## 2026-10-02 wave — walked on deployed SHA `e085442776`

**Item:** C-631.
**Walked:** 2026-10-03, between 16:07:25Z and 16:17:21Z, by
`source-backlog-executor#20261003T1605Z`.
**Signed in as:** the platform-admin session, tenant context resolved to the
composite reference tenant, labelled on the surface `COMPOSITE REFERENCE TENANT
· DEMO · CANDIDATE · UNREVIEWED · Synthetic portfolio. Not a customer, not a
case study.`

**Which SHA, and why it is not the wave's own SHA.** C-631 names merges from
2026-10-02. They are all ancestors of `e085442776`, which was the sole
100%-traffic revision for the whole walk, so walking the current runtime proves
them on the code that is actually serving. It does mean this walk's SHA is also
C-635's SHA: **C-635's own three merges (#8904, #8910, #8912) are not proven
here.** Nothing in this block should be read as acceptance of them.

**One correction to the item's own framing.** C-631 scopes itself to
2026-10-02T14:00Z–22:17Z and then lists #8843 inside that window. #8843's
GitHub `mergedAt` is 2026-10-02T01:24:09Z, outside it. The merge is real and is
walked below; the window in the item text is wrong, and is recorded as wrong
rather than quietly widened.

**Runtime invariant, read independently with read-only `az` before the walk and
again after it, unchanged across both reads:**

| | |
|---|---|
| Container App | `ca-abarva-web-lab-eastus` (`rg-abarva-controlplane-lab-eastus`) |
| Template image | `sha256:e57ba3580e01994fd83080efd79f54bce4fb255297101185e2f346ed9f95f89b` |
| 100%-traffic revision | `ca-abarva-web-lab-eastus--me0854427` — sole entry, weight 100, Healthy / Running |
| Revision image | identical to the template image |
| `job-abarva-deliv-worker` | identical to the template image |
| `job-abarva-deliv-worker-event` | identical to the template image |
| Deploy run | `aca-main-deploy` 37135052683 on `e085442776`, `createdAt` 2026-10-03T15:57:02Z, `updatedAt` 2026-10-03T16:06:59Z, success |

Read at 16:07:25Z and again at 16:17:21Z; both reads returned the same digest
and the same sole revision, so no deploy landed inside the walk. **The window
closed nine seconds before the next one opened:** run 37136290168 was `queued`
at 16:17:12Z for a later SHA and had shifted no traffic at the second read. A
walk recorded after that run completes is reading a different runtime.

**The walk was started only once the invariant held.** At 16:04:53Z the template
image and the 100%-traffic revision image disagreed, because run 37135052683 was
still in flight. Walking then would have put a traffic shift inside the walk.

### Results

| # | Surface | Proving | Verdict | What was observed |
|---|---|---|---|---|
| 1 | Home v4 chapter as an executive cockpit | #8887 | **pass** | All four regions the merge claims are present and populated on the executive-brief chapter: `data-home-kpi-rail` ("3 counted from the record · 4 questions for the room · 96 signals on the record · 18 governed facts" — counts with the record they are counted from, no bare figures), `data-home-chart-grid` with one exhibit card, the governed evidence region, and `data-home-cockpit-workspace` with four tabs (Insights 7 / Open items 3 / Watch 1 / Questions 4) of which exactly one is `aria-selected`. |
| 2 | Industry context band | #8890 | **pass** | Band renders under `data-home-industry-context`, grouped by the record's own kind: `INDUSTRY PATTERNS 12` and `EXPERT LENSES 9`. Measured against the merge's three negative claims rather than read for tone: **zero** currency symbols, percentages or `USD` in the band; **zero** digits anywhere in it outside the two group counts; and the raw machine kind never rendered — only the display forms `INDUSTRY PATTERN` and `EXPERT LENS`. Provenance line present and explicit: "not this enterprise's attested facts, and not a peer benchmark … the record holds no competitor or peer figure." |
| 3 | Source-linked enterprise context | #8843 | **pass** | The briefing renders scale, model, operating segments and who pays ("$25B revenue · 68,000 people"; "Hospital & Acute Delivery · Ambulatory & Physician Network · Health Plan Operations · Shared Enterprise Services"), priorities "in the order the record states them", and record drill-through. The gap half is the stronger half and it holds: a `data-home-briefing-gaps` block headed "WHAT A NEW EXECUTIVE WOULD ASK THAT THIS RECORD CANNOT ANSWER — named rather than omitted — silence here would read as 'no issue'", which calls the competitor gap "a collection gap, not a finding about the market". The page's own source date reads "Data as of not established" rather than inventing one. |
| 4 | Enterprise-context truthfulness statements | #8858 | **blocked** | Not observable on this tenant, and the two readings are not distinguishable from the client. The statements the merge changed — `Source-file quality: N of M accepted; K not reviewed`, and the functions-without-a-segment-key wording — appear **nowhere** on the page or in the HTML export: zero matches for `Source-file quality`, for `N of M accepted`, and for `not reviewed`. That is consistent with "the statements are conditional on source-file load and approval states this tenant's record does not reach" and equally consistent with "the statements no longer render at all". Settling it needs a tenant whose record carries files in the accepted-without-approval state, which this walk could not choose. |
| 5 | Ranked risk review items | #8875 | **blocked** | The chapter is reachable and coherent, but the record the ranking is built from did not reach the page, and the page says so: `ONE EVIDENCE VIEW PENDING · EVIDENCE NOT YET SERVED · Risks & controls — "This chapter is built from the risks & controls record, and no rows of it reached this page. That is a gap in what was served, not a gap in the record."` What does render is a separate deterministic set ("7 findings · 3 the record says are wrong now · 1 evidence view pending", each carrying a named owner such as Chief Information Security Officer) and a risk-concentration exhibit sourced from "Risk register · 2 governed references". The merge's negative claims hold on what is rendered — **zero** occurrences of `risk score` or any invented score. The declared-absence behaviour is working; it is what blocks the row. |
| 6 | Walkthrough export preserves enterprise context | #8846 | **fail** — filed as **U-554** | The export was read at its own endpoint (`GET /api/home/walkthrough-export?…&format=html`, 200, 38,667 bytes) with the signed-in session. Of the seven elements the merge says it preserves, **three are present** — priorities, source dates ("Data as of"), synthetic evidence labels — and **four are absent**: business scale (no `$25B`, no `68,000`), operating segments, function ownership, and attribution gaps (no `uncited`, no `unlinked`, no "cannot answer" block). All four render on the page itself, in the same session, minutes apart. |
| 7 | Workspace users are the sole Moves approvers | #8894 | **pass** (client surface) · server half **blocked** | The Approvals overview names the approver for **6 of 6** phases as `Authorized workspace user` — Originate, Charter, Diagnose, Design, Roadmap, Mobilize — with no other approver identity offered anywhere. The word `sponsor` appears **zero** times on the move surface, and there are **zero** sponsor-approval controls; the only approval affordances are two `Review & approve →` links on the reachable phases. On the board the sponsor is a contact column only. **Blocked half, with the write named:** that a workspace user *can* approve and a non-workspace user *is refused* needs a committed approval against tenant data by a second signed-in identity. This walk performs no write and holds one identity, so the server-side authorization rests on the merge's own tests. |
| 8 | Moves premium evidence readiness accounting | #8587 | **blocked** | The accounting the merge fixes is recorded on a premium artifact generation run, for succeeded and quality-blocked runs alike. Producing one is a write and a model spend, which this walk does not perform, and no surface reached displays the recorded evidence count. The nearest visible statement is a deliverable snapshot caveat — "its attached-evidence count and content may be out of date" — which is a staleness disclosure about a prior run, not this merge's accounting. |
| 9 | Lab NDA e-signature slices | #8896 · #8897 · #8898 · #8900 | **blocked** — undispatched, and measured rather than asserted | The acceptance permits an explicit statement that the lab path is still undispatched. It is, and the runtime says why: on the serving revision `SOURCE_NDA_ESIGN_PROVIDER` is set to `disabled`, and **none** of `SOURCE_NDA_ESIGN_ACCOUNT_ID`, `_INTEGRATION_KEY`, `_KEY_ID`, `_USER_ID`, `_ENVIRONMENT` or `_TEST_INBOX` is present on the container at all (read-only `az`, same read as the invariant). So the four slices cannot be exercised end to end on this runtime — not merely "not yet run". Consistent with the surface: the Source New request stage renders zero NDA affordances for this tenant. No envelope was drafted or sent, and none could have been. |
| 10 | Generated narrative on the cockpit, cross-cutting | found while walking rows 1 and 5 | **fail** — filed as **C-637** | Four decimal figures are broken by an inserted space where an executive reads them: `Epic (17. 4%)`, `Microsoft (9. 1%)` and `$496. 4M` in exhibit 01's key message, and `4. 5+` in the Insights synthesis on chapter 01; `6. 4% error rate` in the synthesis on chapter 08. Present in the **raw server response** for `/home` (1,188,437 bytes, fetched with the session), so neither a client-side transform nor an extraction artifact. The same payload writes `17.4%` correctly 9 times and `4.5+` correctly 17 times, and 680 other decimals on the page are correct, so the generator is inconsistent rather than uniformly broken. |

### Stated limits of this walk

Rows 4, 5, 8 and 9 are `blocked`, and each names what would unblock it. None is
a quiet pass. Row 7 is split deliberately: the client surface is proven, the
server authorization is not, and the row says which is which.

No write was performed on any surface. No approval was submitted, no phase
advanced, no envelope drafted or sent, no file downloaded to disk — the export
in row 6 was read as a response body in the page, not saved. The only
interactions were navigation, chapter selection and workspace-tab selection,
all client-side view state.

### A second reading of U-553, on a newer SHA

U-553 was filed from the C-633 walk on `44b50dcd3d`. Its acceptance asks for a
re-walk. Independently re-measured here on `e085442776`: **5 move names carry a
build or run identifier**, in exactly the two shapes U-553 names — one
`Synthetic <tenant> E2E Smoke - <YYYYMMDD>T<HHMMSS>Z` and four
`<tenant> Synthetic Rich Evidence-<MM>-<DD>T<HH>-<MM>`. The count and the shapes
reproduce unchanged one SHA later. This is a confirmation, not a new item.

### Noted, not filed

Each of these needs a product call rather than a guess, and is recorded so a
later reader does not re-discover it as new:

- Every move row prints an uppercase programme code (`<SEGMENT>-<SCOPE>-<YEAR>`) beneath
  its name. Unlike U-553's build stamps this may well be a reference a client
  uses on purpose, so it is not filed as a leak. Worth a decision, because
  Home's own vocabulary gate (`cxoText`) forbids machine identifiers on client
  surfaces and its `MACHINE_IDENTIFIER_RE` matches lowercase only, so a code in
  this shape would pass that gate unchanged if it ever reached a Home surface.
- The chapter-08 evidence rollup declares `EVIDENCE NOT YET SERVED` for risks &
  controls while the same chapter renders a risk-concentration exhibit sourced
  from a risk register. Both statements may be true of different records; which
  record feeds which is not established here.
