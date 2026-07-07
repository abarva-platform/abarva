# AbarVa Source — Redesign: Vision & Requirements (single integrated brief for Claude Design)

**Mandate.** Redesign AbarVa **Source** — the module a client uses to run technology sourcing — into a best-in-class **sourcing decision engine**: a surface that visibly brings intelligence to every step, collaborates with the client, takes their inputs, and produces board-grade deliverables — across **two front doors** (optimize an existing contract; run a new event) and the full 11-stage journey.

Repo: `/Users/anand/Projects/nexus` (Next.js 16 App Router, React 19, TypeScript; server components + a client canvas). File map at the end — review it before designing.

---

## 1. Vision — what Source is

Source turns technology sourcing from document-hygiene into a **defensible value engine.** Audience: CPOs / sourcing leaders on $10M+ outsourcing, IT/AMS, BPO, and SaaS spend, whose savings number has to survive a CFO.

The north star: a client finishes any step thinking *"this tool clearly knows sourcing and is doing the heavy lifting with me,"* not *"I filled a form."* Every page must do four things:
1. **Show what the tool knows and found** — intelligence, *on the page*, never hidden only inside the downloadable deliverable.
2. **Collaborate** — take the client's judgment and feedback (dynamically, where the step is analytical).
3. **Take the documents** it needs.
4. **Produce the artifact** as the *output* of that — not the only place value appears.

---

## 2. Two front doors (design BOTH — today only Door 2 exists)

- **Door 1 — Optimize an existing contract** *(the wedge; most of a CPO's spend lives here, and it's leaking now).* No RFP. A short **Diagnose → Recover** loop: ingest the contract + 12 months of invoices → the engine parses to typed, cited facts and diagnoses leakage (recurring change-orders billed as enhancements, rates above current market, unclaimed SLA credits, volume-bands never applied) → quantifies a cited recoverable range → recommends the play (renegotiate with evidence-backed asks / restructure / rebid). **Escalates into Door 2** if a rebid is warranted. Target: recover ~10–20%, in weeks.
- **Door 2 — Run a new event** *(the full competitive journey).* The 11 governed stages, targeting ~20%+ of total deal value.

Same engine underneath both — playbooks → value levers → deterministic math → deliverables.

---

## 3. The portfolio home (above the single event)

Source opens not on one event but on the CPO's **book**: contracts under management, renewal clocks, events in flight, spend, value captured YTD — and **proactively surfaces work**: *"3 contracts renew in 90 days," "this rate is 12% above market," "SLA breaches trending" → optimize / start an event.* Both doors launch from here.

---

## 4. The governing page pattern — three beats on EVERY page

```
[ Intel we bring ]   +   [ Your inputs & feedback ]   →   [ Deliverable ]
```
1. **Intel we bring** — the engine's read for this step, visible on the page: what it found, benchmarks, archetype traps closed, anomalies, its recommendation. First-class — never buried in the download.
2. **Your inputs & feedback** — the tasks: **provide** (upload), **confirm** (pre-filled), **decide** (judgment) — plus **dynamic collaboration** where the step is analytical (adjust weights, resolve flags, shape requirements, react to findings).
3. **Deliverable** — generated at the gate (no Build button); its intelligence was already visible above.

Do not bifurcate stages into "dumb checklist" vs "smart workspace" — **every** stage carries all three beats. Intake stages lean on beats 2→3; analytical stages lean on beats 1→2; but the intel beat is present everywhere.

---

## 5. Universal page anatomy

- **Left:** event + 11-stage rail (Strategy…Value; **aVa/Sentinel drives stages 1–9, Atlas 10–11**) + a **Templates & deliverables** link.
- **Center:** the stage — an **intel panel** (beat 1: "what we found / what we bring") above the **task checklist** (beat 2), each task typed provide/confirm/decide with its *"where this comes from: owner · source"* line, template link, and concrete state; the **gate** (beat 3) is a sticky "Continue to gate."
- **aVa:** a **docked, collapsed "Ask aVa"** launcher (a pull-in, not a standing panel), scoped to real capabilities (§9).
- **Honesty, everywhere:** a gate item is green because the evidence reached its target state — *never* because someone clicked "mark met." Value is ranges + confidence bands, never a guaranteed %.

---

## 6. Door 2 — the 11-stage journey (per stage: intel · tasks/collaboration · gate → auto-gen)

| # | Stage | Intel we bring (on-page) | User provides / decides | Auto-generates on gate → next |
|---|---|---|---|---|
| 01 | **Strategy** | archetype fit, value thesis, cost of inaction | *(folded into P0 approval)* sponsor 3-box confirm | Strategy Memo (`d01`) + **Scope readiness pack** |
| 02 | **Scope** | "147 apps inventoried, 4 missing owners, 2 mid-decommission flagged" | 5 tasks: app inventory · volumetrics · exclusions · retained matrix · sponsor letter | Scope Memo (`d05`) + exclusions (`d06`) + RFP draft (`d09`) |
| 03 | **RFP** | "AMS requires these 6 exhibits — all included; closed 3 traps (open-ended change-orders, weak SLA credit caps, unpriced automation); requirements benchmarked to comparable AMS events; here's what a weak RFP would miss" | shape + confirm requirements & exhibits; upload client-final if edited | Vendor response templates/portal + Responses readiness pack |
| 04 | **Responses** | "what we read from the N responses" — per-vendor MVE summary | upload vendor proposals + pricing/staffing/SLA exhibits | Typed facts → MVE profiles (`d11`) |
| 05 | **Evaluation** | **the analysis + live matrix** — flagged anomalies ("Vendor B 40% automation not priced," "Vendor A transition not milestone-based," "Vendor C excluded data migration"); a **live scorecard** the tool pre-scores from the archetype criteria + deal evidence and *explains*, the client adjusts, ranking updates live | approve clarification questions to vendors; shape weights/scores; clear integrity flags | Scorecard (`d16`) + Challenge Log (`d17`) + shortlist |
| 06 | **Pricing** | should-cost vs. bids ("$9.1M should-cost vs $8.4M low bid — transition booked as opex, flagged"); the trap log; the 3-layer commercial posture | confirm normalization; expose posture | TCO Normalization (`d19`) + trap log (`d20`) + value-lever map |
| 07 | **BAFO** | the asks the tool drafted from the gaps/levers, per finalist | run the finalist round; refine asks | BAFO Value-Capture Pack (`d22`) |
| 08 | **Decision** | the classified value case, tradeoffs, unresolved risk | review + decide | Atlas Decision Brief (`d24`) |
| 09 | **Selection** | contract protections derived from the value case | confirm award; confirm protections | Selection memo (`d27`) + protection checklist |
| 10 | **Transition** | KT/milestone plan draft, fee-at-risk | confirm plan + readiness gates | Transition Readiness Checklist (`d29`) |
| 11 | **Value** | promised value baseline | set the baseline | Value Ledger (`d31`) — promised vs realized |

**Analytical stages (Evaluation, Pricing, BAFO, Decision)** render the analysis *on the canvas* — findings, anomalies, and a live, collaborative matrix the client and the tool build together — not a flat checklist. Evaluation is the worked exemplar for this mode (four zones: *the system's read → clarifications to vendors → the live collaborative scoring matrix → the recommendation → gate*).

---

## 7. Door 1 — existing-contract Diagnose → Recover flow

Its own first-class entry point (not the 11-stage journey). Same three-beat pattern; four screens:

| Step | Intel we bring | User provides / decides | Output |
|---|---|---|---|
| **Ingest & baseline** | — | upload the contract + 12 months of invoices | parses to typed, cited facts (rate card · SLA · scope · change-order history) |
| **Diagnose leakage** | "recurring enhancements = ~14% of spend billed as change-orders · blended rate ~11% above market · volume down ~20%, price flat · ~$400k SLA credits unclaimed" | review/annotate the findings | Leakage Diagnosis |
| **Quantify** | a cited value bridge by lever, classified by value type | confirm the assumptions | Value Bridge → recoverable $ range |
| **Play** | recommended move + evidence-backed asks | choose: renegotiate · restructure · **rebid** | Contract Optimization Brief — *rebid hands off into Door 2's 11-stage flow* |

---

## 8. Gate/approval + the readiness-pack invariant

Each gate = a **3-box sponsor confirm** (the pattern already built for Strategy). On approve → auto-generate the stage's deliverables **and the NEXT phase's Readiness Pack**: purpose · the inputs checklist (each item: source · owner · format · why · target state) · fill-in templates + links · who-does-what. **Every phase's instructions are generated by the prior phase — no phase ever starts cold.**

---

## 9. aVa & analysis — role + the honest data verdict

**Real today (design FOR these):** gate-readiness + what's-blocking, next move, explain evidence, the deterministic should-cost + delivery-model engines, the archetype's evaluation criteria/disqualifiers, the inline flags, draft-a-deliverable-on-demand. aVa reads the live event state (artifact bodies, gate states, evidence states, scorecard) from the DB.

**Not real yet (design AROUND these — never render what the engine can't produce):**
- Live fetch of evidence — there's no integration to ticket systems / data catalogs / vendor portals. "Where do I get this?" is answered by the **named owner** from intake (deterministic), *not* a live pull.
- Per-evidence "why this matters" narratives.
- **The read of vendor responses** — proposal normalization currently runs over an empty set. The Evaluation analysis surface can be *designed* now, but runs on real data only once the **structured vendor-response intake** is built. Flag this as the key engineering prerequisite for stages 4–5.

aVa **complements** the on-canvas analysis; it does not replace it. The findings, matrix, and anomalies are first-class UI, and aVa is where you ask follow-ups.

---

## 10. Template & Deliverables Library

One place to browse every predefined template and deliverable across all 11 steps. Global catalog (from the Source sub-nav) + in-event index. Left-filter (stage · type · required/optional · format) + right-grid grouped by stage. **Two kinds, hard line between them:**
- **Input templates** — you fill & upload (app-inventory, exclusions-log, retained-responsibility…). Action: **Download blank.** These are exactly what the readiness pack hands you.
- **Generated deliverables** — Source produces on gate approval, never filled by hand (`d01`…`d31`). Action: **Preview / View spec**, with a live status ("Generated" / "Not yet").

Data source: `SOURCE_ARTIFACT_SPECS` in `src/lib/source/canonical-specs/artifact-specs.ts`.

---

## 11. Best-in-class capabilities to build toward

1. **Two front doors** (§2) — Door 1 as a first-class entry that escalates into Door 2.
2. **Portfolio home + proactive origination** (§3) — surface work from renewal clocks, market drift, SLA breaches.
3. **Market-grounded should-cost** — anchor "above/below market" in live rate cards + peer benchmarks, not just internal history.
4. **A closed value loop** — track promised vs. realized over the term, feeding the next event.
5. **Negotiation as a guided exercise** — BAFO with walk-away and concession modeling.

---

## 12. Constraints (non-negotiable)

- **On-system:** mount inside `AppShell` with `surface="source"` (no second nav). Tokens: `src/lib/shell/shell-tokens.ts` (Fraunces serif, Inter sans, ink `#1a1a18` / paper / mint / blue / amber) + `src/components/source/canvas/canvas-tokens.ts`. Don't invent a new visual language.
- **Honesty:** gate green = evidence-earned, not attested; value = ranges + confidence; never intelligence the engine can't produce.
- **No Build buttons:** deliverables auto-generate on gate approval (cascading). The user provides inputs and makes decisions; they never click "Build."
- **Responsive.**

---

## 13. Deliverable (what to design)

1. **Portfolio home** — the book, both doors, proactive prompts.
2. **Door 1** — the Diagnose→Recover flow (4 screens), with the rebid handoff.
3. **Door 2** — all 11 stages on the three-beat pattern; **Scope** as the intake exemplar and **Evaluation** as the analysis/collaboration exemplar (findings → vendor clarifications → live matrix → recommendation).
4. **Gate/approval** — the 3-box sponsor confirm + "generated after you approve."
5. **aVa launcher** — docked, scoped to §9.
6. **Template & Deliverables Library** — global catalog + in-event index.

On-system, honest, intelligence-forward on every page.

---

## 14. Repo file map (review these)

**Canvas & UI:** `src/components/source/canvas/UniversalCanvasShell.tsx` · `CanvasGateSidebar.tsx` · `EventWorkspace.tsx` · `workspace-tabs/{DocumentTab,EvidenceTab,GateTab,LogTab}.tsx` · `AvaBottomBar.tsx` · `src/components/source/approval/EventApprovalCard.tsx` · `src/app/(maestro)/source/events/[eventId]/{page,approval/page}.tsx`
**Data / catalogs:** `src/lib/source/constants.ts` (11 stages) · `src/lib/source/canonical-specs/{gate-criteria,evidence-requirements,artifact-specs}.ts` · `src/lib/source/stage-packs/` · `src/lib/source/canvas-substrate/{types,queries}.ts`
**aVa / generation:** `src/lib/source/source-answer-engine.ts` · `src/lib/source/context-builder.ts` · `src/lib/source/agent-generation/prompt-registry.ts` · `src/app/api/v1/source/[eventId]/nexus/ask/route.ts` · `.../artifacts/[artifactCode]/generate-from-claude/route.ts` · `.../gate-criteria/[criterionId]/state/route.ts` · `.../stage/route.ts`
**Archetype intelligence (for the "intel we bring" beat):** `src/lib/source/archetypes/{registry,types,event-archetype-resolver}.ts` (rfpDocumentStructure, pricingModel.traps, evaluationModel.criteria/disqualifiers, negotiationLevers, valueLeverRules)
**Design system:** `src/lib/shell/shell-tokens.ts` · `src/components/source/canvas/canvas-tokens.ts` · `src/components/shell/AppShell.tsx`
