# Source — Screenshot Validation Pass

Authenticated walk of the prod demo (`nexus-vert-kappa.vercel.app`), signed in as Lynne Stratham / Apex Retail. This pass validates (or overturns) the spatial and rendered findings that code alone could only imply. **Screenshots captured for:** `/source/events`, `/source/queue`, `/source/portfolio`, event canvas (`/source/events/apex-retail-ams-outsourcing-2026`), `/source/new`.

## Headline: two findings the static pass got wrong

### ⚠️ NEW — TIER 0: the three home views show CONTRADICTORY numbers
Not just duplicated — **inconsistent**, for the same tenant, in the same session:

| Home view | Event count | Value |
|---|---|---|
| `/source/events` | **3** events ("3 active") | **$74.0M** at stake |
| `/source/portfolio` | **2** events ("2 events across 1 tenant") | **$39.0M** total value |
| `/source/queue` | "**23** decisions need your attention" | per-card ($1.12M, $680k…) |

Three independent scorecards computing the same KPIs have **drifted apart**. A CXO sees *3 events / $74M* on the Events tab and *2 events / $39M* one click away on Portfolio. This is the single most damaging thing in the surface — it converts the page-sprawl finding from "inelegant" into "**actively erodes trust in the numbers**." It is the strongest possible argument for collapsing to one canonical scorecard computed once.

### ❌ REVERSED — disclaimer stacking is REAL (I refuted it from code; the screenshots refute me)
The static pass said the "AI may produce errors / HUMAN APPROVAL REQUIRED" stacking "does not exist in Source." **It does** — the grep missed it because the strings live in the shared AgentDock, not the Source components. Rendered on **every Source surface that shows the agent rail** (events, event canvas, intake), two banners stacked at the bottom of the rail, persistently:

> **HUMAN APPROVAL REQUIRED: AGENT-SUGGESTED ACTIONS ARE PROPOSALS ONLY. A NAMED PERSON MUST APPROVE BEFORE ANY WRITE, SUBMISSION, OR EXTERNAL ACTION RUNS.**
> **AI may produce errors. You are responsible for decisions taken based on this output.**

This is textbook **wallpaper**: correct once, ignored by the 47th view — and it desensitizes the user to the *next* warning that matters. Your original hypothesis was right; my refutation was wrong. → restored to the clutter inventory as **R-banner**.

## Confirmed hypotheses (now visually verified)

| Finding | Verdict | What the screenshot showed |
|---|---|---|
| Chat rail squats on the canvas | **CONFIRMED** | Sentinel rail at **~45%** of width on events, event canvas, and intake — always open, never collapsed. |
| 11-stage rail always fully shown | **CONFIRMED** | Event at stage 07 BAFO still renders all 11 nodes (01 Strategy → 11 Value); 08–11 as empty circles. |
| Redundant status conveyance | **CONFIRMED + worse** | Event canvas context strip ("STEP BAFO · Readiness 0/1 · Artifacts 0/2 · Evidence 1 sources") duplicates the tab badges (Document 2 / Gate 0/3 / Evidence 0/1). On Events, **two** KPI scorecards stack with "$74.0M" shown twice, plus a third "PORTFOLIO WORKFLOW GUIDANCE" rail. |
| `{agent} needs` chip leak | **CONFIRMED verbatim** | "STEWARD NEEDS", "SENTINEL NEEDS", "ATLAS NEEDS" rendered in caps on intake field chips. |
| Export buttons hog the header | **CONFIRMED + worse** | Event header carries **five**: VALUE PROOF · VIEW IN DOSSIER · CXO REPORT · PPTX · DOWNLOAD DEAL PACK. |
| Buttons shown before earned | **CONFIRMED** | "MARK COMPLETE" active on a draft labelled "NOT STARTED". |
| Internal-label leaks | **CONFIRMED + new instances** | Raw filename `d01_strategy_memo-b68f21af.md` and `SOURCE_ARTIFACTS` source label on the canvas; `vendor_contracts:ven:apex:009` evidence ID on queue cards; "deterministic program hints", "system-projected", "All seeded sourcing events" on Events. |
| `/source` routing | **Codex was right** | Prod `/source` **redirects to `/source/events`** (not the Decision Queue my local branch renders → branch/prod drift, flag separately). |

## New finding: a THIRD stage vocabulary
Portfolio defaults to **Kanban** with 5 stage bands (*Discovery & Scope · Evaluation & Pricing · BAFO & Decision · Transition & Closeout · Awarded / Completed*) — a third taxonomy alongside the **11-node rail** (Strategy…Value) and the **lifecycle** labels (Active/Waiting/BAFO). One event ("AMS Outsourcing 2026") is simultaneously "BAFO · Active · 8d" (card), "07 BAFO" (rail), and "Evaluation & Pricing" (kanban band). Pick **one** stage language.

## Squint test, per page (does the eye land on one primary action?)

| Page | Squint result |
|---|---|
| `/source/queue` (Decision Queue) | **PASS** — single column of decision cards, one "Open decision →" per card. The cleanest home; this should be *the* home. |
| `/source/portfolio` | PARTIAL — clean scorecard + kanban, but no single primary action; 6 metric tiles compete. |
| `/source/new` (intake) | PARTIAL — the form is clear, but the 45% chat rail + triple progress split attention. |
| event canvas | **FAIL** — five header buttons + 11-node rail + context strip + tab row + 45% chat rail + dual disclaimers. Eye lands nowhere. |
| `/source/events` | **FAIL (worst)** — 6 competing blocks: rail, header+subline, 2 scorecards, event-card strip, mission strip, guidance rail. |

## Net effect on the audit

- **Decision Queue is the strongest home** and passes the squint test — it should become the canonical `/source` (the prod redirect currently sends `/source` to the *worst* page, Events).
- The **data-inconsistency finding (Tier 0)** is now the lead argument for consolidation — promote it above everything in the README.
- **Disclaimer stacking** is restored as a real finding; make one persistent + surface the rest contextually.
- Everything in the original delete list **held or got stronger** under real rendering. No verdict needs softening; several need hardening.
