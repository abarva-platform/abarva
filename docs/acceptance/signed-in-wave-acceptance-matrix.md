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
