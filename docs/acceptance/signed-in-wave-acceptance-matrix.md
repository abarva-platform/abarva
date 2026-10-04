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

---

## 2026-10-03/04 sixth wave — walked on deployed SHA `de09c6b806`

**Item:** C-586, claiming the definition filed under *"Added 2026-10-04T02:16Z by
the watcher (read-only pass)"*. The second `C-586` filed later the same morning
was withdrawn by its own filer as an id collision, so there is one live
definition and this block answers it.
**Walked:** 2026-10-04, between 04:27:03Z and 04:34:24Z, by
`source-backlog-executor#20261004T042206Z`.
**Signed in as:** the platform-admin session, tenant context resolved to
`Meridian Health`, shown consistently in the board header, the move header and
the event breadcrumb.

**Which SHA, and why it is not pinned.** C-586's acceptance forbids pinning a
SHA — C-635 pinned one and became unexecutable when the runtime moved past it.
This walk resolved what was serving, stamped it, and asserts ancestry instead.
The serving SHA was `de09c6b8063379d3e1712220852df2f912c81a75` (#8961), and
**every one of the eight merges C-586 names is an ancestor of it**, by
`git merge-base --is-ancestor` run in this walk's own worktree:

| Merge | SHA | Ancestor of `de09c6b806` |
|---|---|---|
| #8939 Source lab-only NDA embedded signing link | `6de543f93d` | yes |
| #8940 Moves readiness prep gated to final step | `be8bbcb2c6` | yes |
| #8915 Moves explicit evidence phase assignment | `671fb591f5` | yes |
| #8917 Moves retry incomplete charter repairs | `49e0ffa0a9` | yes |
| #8942 Source guarded demo NDA actions in Stage 05 | `f840268d25` | yes |
| #8944 Source evidenced contact review, eligible suppliers | `2dd54d1ff4` | yes |
| #8950 Moves aVa docked to the left on desktop | `d9e927f3c8` | yes |
| #8949 Moves phase stepper as a horizontal top nav | `f431ae90c7` | yes |

**The two class-(ii) merges are now behind the runtime.** C-586 filed #8949 and
#8950 as *ahead of the serving SHA and declared unproven*. They are ancestors of
`de09c6b806`, so this walk reaches them and the row's two classes collapse into
one. That is the unpinned form working as C-635's re-verification recommended.

**The digest was tied to its commit in the registry, not read off the revision
suffix.** `az acr manifest show-metadata` at 04:24:42Z returns tag
`main-de09c6b8` for
`sha256:cdc60ad95b1515eeb7ad61951f5121898196141f3ebea5403130a6ce020a2fbb`.
A held invariant says the runtime is internally consistent; only the ACR tag or
ancestry says *which commit is serving*.

**Runtime invariant, read independently with read-only `az` before the walk and
again after it, unchanged across both reads:**

| | |
|---|---|
| Container App | `ca-abarva-web-lab-eastus` (`rg-abarva-controlplane-lab-eastus`) |
| Template image | `sha256:cdc60ad95b1515eeb7ad61951f5121898196141f3ebea5403130a6ce020a2fbb` |
| 100%-traffic revision | `ca-abarva-web-lab-eastus--mde09c6b8` — **count of `weight>0` entries is 1**, not merely that one of them reads 100; Healthy / Running, created 2026-10-04T04:08:53Z |
| Revision image | identical to the template image |
| ACR tag for that digest | `main-de09c6b8` |

Read at 04:24:28Z and again at 04:34:24Z. Both returned the same digest and the
same sole revision, so no deploy landed inside the walk and no surface was
reloaded onto a different build.

### The viewport this walk could produce, stated before the rows that depend on it

Every row below was read at a CSS viewport of **1200 × 715**. That number is not
a choice. The browser window was resized to 1600, 1700, 2200 and 420 pixels wide
and the content viewport reported `1200x715` after every one of them, so this
walk had exactly one width available to it. Two of C-586's sub-claims are
defined by width — aVa's desktop dock is `@media (min-width:1281px)` and the
acceptance separately asks for a phone width — and 1200 is on the wrong side of
both. Those are recorded `blocked` with the width named, not quietly folded into
a pass at a width that cannot test them.

### Results

| # | Surface | Proving | Verdict | What was observed |
|---|---|---|---|---|
| 1a | Moves phase surface — stepper layout | #8949 | **pass** | On a P1 Charter move at 1200px the six phases render as a **horizontal strip across the top**, between the move header and the `Steps / Files & Evidence / Intelligence / Approvals` tabs, in order `Originate · Charter · Discover & Diagnose · Design Future State · Roadmap & Business Case · Mobilize & Handoff`. All three states are distinguishable and correct for this move: Originate carries a **✓** (done, `3 of 3`), Charter carries the `P1` marker and is the **underlined** viewed phase (`1 of 2`), and P2–P5 render greyed with their counts (`0 of 6`, `0 of 3`, `0 of 5`, `0 of 4`). Reachability is in the element kind, not only the styling: `Originate` and `Charter` are **links** with `href` to `/phase/0` and `/phase/1`, while `Discover & Diagnose`, `Design Future State`, `Roadmap & Business Case` and `Mobilize & Handoff` are **buttons** with no href — the disabled future phases. **No vertical phase list appears anywhere on the page**, which is the half the merge removed. |
| 1b | Moves phase surface — aVa dock at desktop width | #8950 | **blocked** — the width is unreachable in this browser | #8950 docks aVa left only at `@media (min-width:1281px)`. The walk's viewport is pinned at 1200px (see above), 81px short, so the dock's media query cannot fire and the row cannot be proven or disproven here. What *was* observed is the branch #8950 says it leaves unchanged: the floating **`Ask aVa`** FAB is present at the bottom-right of the Moves phase surface. That is consistent with the sub-1281px behaviour and is **not** evidence about the dock. Unblocking needs a client whose CSS viewport can exceed 1280px, or device-width emulation, neither of which this session's browser offers on a signed-in origin. |
| 1c | Moves phase surface — phone width | #8949 · #8950 | **blocked** — the width is unreachable in this browser | The acceptance asks for the layout at a phone width "since neither merge's own suite renders at that width". Resizing the window to 420px left the content viewport at 1200×715, so no narrow-viewport assertion was available. Related and separately unproven: #8949 says the left rail survives, relabelled `Move workspace` / `Collapse workspace rail`. At 1200px **no such control is in the accessibility tree at all** — consistent with the rail being hidden by a width rule at this size, but this walk cannot distinguish "hidden by a media query" from "gone", and does not claim either. |
| 2a | Moves Files & Evidence — explicit evidence phase | #8915 | **pass**, both halves, with no upload | The File Cabinet upload panel carries a new combobox labelled **`Evidence applies to phase`**. It offers all six phases by label — `P0 Originate` … `P5 Mobilize & Handoff` — and **defaults to the viewed phase** (`P1 Charter` selected on the P1 surface), which is the `useState(phase)` default. The second half was proven by changing client-side view state rather than by reading the source: with the selector moved to `P3 Design Future State`, the **evidence-family combobox disappeared** — the one that had been offering `Not stated` plus twelve tenant-specific families (`Current-state member-service workflow map`, `Contact center baseline KPIs`, …). That is `uploadPhase === phase` guarding the family selector and `setDeclaredFamily("")` clearing it, observed as behaviour. The selector was returned to `P1 Charter` afterwards. **No file was uploaded**; the `Upload evidence` control was never pressed. |
| 2b | Moves charter repair retry | #8917 | **blocked** — proving it requires a write | #8917 changes `src/lib/deliverables/orchestrator/orchestrator.ts` only — no route, no component. Its behaviour is a **retry of an incomplete charter repair**, which becomes observable only by causing a charter deliverable to be generated and to come back incomplete. That is a committed write on a governed surface, and the standing boundary forbids an unattended walk from performing one to find out. Named so the next walker does not re-discover it: the unblocking action is a charter generate/repair cycle on a move, run by someone authorised to write. |
| 3 | Moves readiness prep gating | #8940 | **pass** on the permissive branch · **blocked** on the restrictive one | #8940 narrows the readiness-workbook affordance from `readinessWorkbookHref` alone to `readinessWorkbookHref && (phase.phase < 3 \|\| substep.key === "approve")`. The **permissive** branch was reached and holds: on the P1 (`phase < 3`) surface, at workflow `Step 1 of 10` — which is `Charter Inputs`, **not** the `Approve & Build` substep — `Download P2 readiness workbook` is present. So the pre-P3 case still shows the workbook away from the approve step, exactly as the condition's left disjunct says. The **restrictive** branch, `phase >= 3`, could not be reached: no move in this tenant has an open phase above P1, and direct navigation to `/phase/3` is **refused by the product** — the router redirected to `/phase/1?blockedPhase=3` and rendered `P3 BLOCKED · P3 cannot begin yet · Finish the required P1 gate before opening P3`. That refusal is itself worth recording as correct behaviour, and it means the only way to test the right disjunct is to advance a move through the P1 and P2 gates — a sequence of writes this walk must not perform. |
| 4a | Source Stage 05 — guarded synthetic NDA actions | #8942 | **blocked** — a precondition the walk must not satisfy | Stage 05 NDA readiness **was reached** on the one event whose Suppliers & NDA stage is recorded, and it renders: `Accepted suppliers 4 · Covered 0 · Blocked or unknown 4`, `Readiness posture: Blocked before supplier work`, and the governing sentence #8942 rewrote — "A completed signing envelope does not grant coverage; a named reviewer must record the executed document or Legal waiver." The guarded **send** control #8942 added (`Synthetic NDA signing`, with its per-supplier template selector, its internal-test-inbox confirmation checkbox and its disabled-until-ready submit) is **not rendered**, and the reason is a product precondition rather than a defect: the component returns the template-publication fallback whenever the event has **no published NDA template version**, and this event has none — the surface says so itself, "No published NDA template version is available for this event, so no executed document can be checked against one." What renders instead is the lab-fenced publication path, `Synthetic NDA template — Lab event only. Admin publication is recorded as a synthetic test decision, not Legal approval or an executed NDA`. Publishing a template is a write (`Publish synthetic template`), so the walk stopped here. **Unblocking action, named:** publish one synthetic NDA template version on a Meridian event, then re-walk Stage 05. |
| 4b | Source Stage 05 — lab fence on the synthetic affordance | #8942 · #8939 | **pass**, narrowly, and only for what was visible | The synthetic affordance that *is* rendered is fenced to the lab tenant and says so on the surface. In code the fence is `canonicalTenantKey(clientKey) === "meridian-health"`; on the surface the panel is labelled `Lab event only` and disclaims that admin publication "is recorded as a synthetic test decision, not Legal approval or an executed NDA". The signed-in tenant is Meridian Health, so this walk observed the **permitted** side of the fence only. It did **not** observe a non-lab tenant being refused, and nothing here should be read as proving the fence excludes anyone. |
| 4c | Source — NDA embedded signing link | #8939 | **blocked** — and the reason is that no client surface can ever reach it | No embedded-signing-link affordance appeared anywhere in the Stage 05 NDA surface. This is not a walk that missed it. `#8939` ships `src/lib/source/esign/embedded-link.ts` and `POST /api/v1/source/[eventId]/nda/esign/link`, and **no component, page or client module in `src/` references `esign/link`** — the only references outside the route's own directory are its tests. So the capability has no caller: a signed-in reader cannot reach it by any sequence of clicks, and the only way to exercise it is to issue the `POST` directly, which is a write and is forbidden here. The row is `blocked` rather than `fail` because the merge claims an API capability and that capability may well be correct; what is *absent* is any client path to it. **Filed as `C-591`** so this is a tracked finding and not a verdict buried in a matrix row. |
| 5 | Source — evidenced contact review for eligible suppliers | #8944 | **blocked** — proving it requires the write it governs | #8944 changes one predicate in `src/lib/source/rfx-delivery/write-contact-approval.ts`: `supplierContactAllowed` now admits `review_required` as well as `contact_allowed`. The predicate runs **inside** `approveRfxContact`, so its behaviour is only observable by submitting a contact approval — and for an authorization change the failure mode under test *is* the write succeeding, which an unattended walk must never discover by performing it. The surrounding state was read and is consistent with the change mattering: all four accepted suppliers on the walked event print `Contact policy: review required · Contact readiness: review required`, i.e. they sit in exactly the band #8944 moved from refused to eligible, and each row carries an `Accept candidate` submit that was **not** pressed. **Unblocking action, named:** one contact approval submitted by an authorised named user against a `review_required` supplier, plus a negative control against a `do not contact` supplier. |

### What this walk adds to C-586's two classes

Class (i) — six merges inside the walked build with no verdict anywhere — now has
one: #8940 and #8915 are `pass`, #8942 and #8939 are `blocked` with their
preconditions named, #8944 and #8917 are `blocked` as writes. Class (ii) — the
two client-first layout redesigns no walk had ever rendered — is answered for
the stepper (#8949, `pass`) and remains open for the dock (#8950, `blocked` on
viewport width, not on the merge).

### Stated limits of this walk

- **One CSS width, 1200px.** Three sub-rows (1b, 1c, and the rail relabelling
  inside 1c) are blocked on that single fact. A walk from a client that can
  emulate device widths would close all three cheaply, and that is the highest-value
  unblocking action in this block.
- **Four rows are `blocked` and none is a quiet pass.** Each names the specific
  action that would unblock it and who may take it.
- **Row 4b proves the permitted side of a fence only.** A fence is proven by the
  refusal, and no refusal was observed.
- **No write was performed on any surface.** No upload, no template published,
  no candidate accepted, no NDA sent, no approval submitted, no phase advanced,
  no step saved, no file downloaded. The only interactions were navigation,
  stage selection, tab selection and one `<select>` change that was reverted —
  all client-side view state.

### Noted, not filed — because this walk cannot attribute it

On the Source event stage rail, clicking the `Suppliers & NDA` step **through its
accessibility reference** reported success three times and changed nothing,
while a click at the same label's **screen coordinates** selected the stage
immediately. Two readings fit — a stale or mis-resolved element reference in the
automation layer, or a real hit-target defect on the rail — and this walk did
not separate them. Recorded so a later reader does not take the ref-click
no-op as evidence that the stage is unreachable; it is reachable.
