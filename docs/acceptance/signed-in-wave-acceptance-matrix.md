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
