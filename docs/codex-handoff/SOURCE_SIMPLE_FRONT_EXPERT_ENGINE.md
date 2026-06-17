# Source — Simple Front, Expert Engine

**Module design doc. The product is dead simple; the sophistication hides underneath.**

> Most sourcing people have no system today — they run deals on Excel, email, and Word. Even a
> simple version of Source is a massive upgrade. So the entire design is governed by one rule, and
> every appendix exists to keep that rule true.

---

## 0 · The one rule

**If a feature adds a step for the user, it's wrong. If it removes a step — or makes the next step
obvious — it's right.** The complexity is ours to carry, never theirs. Scoring math, should-cost,
reconciliation, disclosure control: all of it runs invisibly and surfaces only as a *better answer*,
never as more work.

---

## 1 · What the user experiences (the whole product, one page)

The user does **three things, on repeat**, for the life of the event:

1. **Tell it or show it** — answer a couple of questions, or drop a file.
2. **Get the document** — it writes the memo / RFP / scorecard.
3. **Do the next thing** — it tells them the one next step.

That's the product. Everything in the appendices serves these three steps.

---

## 2 · The one-screen-per-stage spec (build to this)

Each stage is **one calm screen**, never a multi-panel console. Anatomy:

```
┌──────────────────────────────────────────────────────────────┐
│  You're on: Scope                                            │  ← where you are
│                                                              │
│  To write your Scope Memo I need 3 things:                   │  ← ask for ≤3, never 12
│    1  Your application list        [Upload]  [Just tell me]  │
│    2  Ticket volumes               [Upload]  [Just tell me]  │
│    3  Who signs off                [Just tell me]            │
│         …or  [Skip — I'll note the gap in the doc]           │
│                                                              │
│  [ Write my Scope Memo → ]                                   │  ← one action
│                                                              │
│  Next step: issue the RFP.                                   │  ← the obvious next move
└──────────────────────────────────────────────────────────────┘
```

Rules for this screen:
- **Ask for the 3 things that matter, not the full evidence list.** The archetype knows the rest;
  surface it only if the user asks "what else would help?".
- **Three ways to give each input:** upload a file · just tell me (inline answer) · skip (the doc
  gets generated with an honest gap note — never blocked).
- **One primary action** ("Write my …"), then **one next step** in plain words.
- The document that comes back is a real `.docx` (already built — AQ1/AQ1b), client-clean language
  (AQ1c), section-verified (AQ2).

### The 11 stages, in user words

| Stage | "What I need" (the ≤3) | You get | Next step |
|------|------------------------|---------|-----------|
| Strategy | Why now · what you're spending today · who sponsors it | Strategy memo | Lock the scope |
| Scope | App list · ticket volumes · who signs off | Scope memo | Issue the RFP |
| RFP | Confirm scope · the must-haves · who can bid | RFP pack | Send to vendors |
| Responses | The vendor responses (upload) | Clean, comparable bids | Set up evaluation |
| Evaluation | Score sheets from your reviewers (or score inline) | Scorecard + how they stack up | Look at pricing |
| Pricing | The vendor pricing (upload) | Apples-to-apples comparison + fair-price check | Plan the negotiation |
| BAFO | Confirm the targets | What to ask each vendor + walk-away | Run the negotiation |
| Decision | Confirm the recommendation | Decision brief for the exec | Make the award |
| Selection | Confirm the winner | Award + rejection notes | Start transition |
| Transition | The transition plan inputs | Transition plan + risk list | Track the milestones |
| Value | What "good" looks like | Value tracker | Quarterly check-ins |

This table **is** the archetype template library, in user language (see §3).

---

## 3 · Where "what I need" comes from (no template-shopping)

The user never browses a template library. **Sentinel already knows what this kind of deal needs**
and asks for it. Under the hood it resolves `archetype × event-type × stage` → the ≤3 required
inputs + the document to produce — using the **archetype framework that already exists on `main`**
(`src/lib/source/archetypes/registry.ts`: per-archetype `evidence` with `whyNeeded`/`feedsMethods`,
`deliverablePack`, `stageModel`, `gateCriteria`). See Appendix F.

- **Downloadable packets, on demand.** If the user would rather collect offline ("I have a workshop
  next week"), each input offers a simple template to download (Q&A log, app-inventory sheet, orals
  score sheet), then upload back. Optional — never the default path.
- **Honest about gaps.** Skip an input and the doc still generates, with a visible note: *"Sizing is
  assumption-based — no ticket history provided."* The user trades quality knowingly.

---

## 4 · Vendor back-and-forth, made simple

Real deals are full of meetings, orals, emails, revised prices. The user gets **one button:
"Add what happened."**

```
[ + Add what happened ]
   What was it?   ◯ Meeting / oral   ◯ Email   ◯ New price   ◯ Clarification
   Which vendor?  [ Vendor A ▾ ]
   Drop the notes / file:  [ … ]
```

Then Sentinel reads it and shows the user **one simple thing**:

> *"Vendor A sent revised pricing. I re-ran the comparison — they moved from #3 to #2.
> Here's what changed.   [Looks right ✓]   [Let me look]"*

The user sees **"here's what changed, approve it."** They never see a reconciliation engine, a
version graph, or a staleness propagation. (Engine: Appendix D.)

---

## 5 · The hard stuff, shown simply

Every sophisticated capability surfaces as a plain answer with a reason — never a tool to operate:

| Underneath (the engine) | What the user sees |
|-------------------------|--------------------|
| Multi-rater weighted scoring (Appendix B) | *"Vendor A leads on capability. B is cheapest. Here's the trade-off — and the one risk."* |
| Should-cost + negotiation levers (Appendix C) | *"Vendor A is 23% over a fair price on support. Ask for this. Your walk-away is $X."* |
| Reconciliation (Appendix D) | *"You added a new price. I re-ran it — here's what moved."* |
| Disclosure / fairness control (Appendix E) | *(invisible — the system simply never leaks one vendor's data to another, and logs that every clarification went to all bidders)* |

The user always gets a **recommendation + the reason**. That's it.

---

## 6 · Build slices (simple-first — each one usable on its own)

| Slice | What ships | Why first |
|------|-----------|-----------|
| **S1** | One-screen-per-stage + the ≤3-things checklist (from the archetype library) + generate + next-step | Makes Source usable day 1 — *"it writes my docs and tells me what's next."* Beats Excel immediately. |
| **S2** | "Add what happened" capture + simple **approve-the-change** | Pulls the real-world back-and-forth in, without a console. |
| **S3** | The **"how they stack up"** vendor view (scoring shown simply) | The evaluation moment, made plain. |
| **S4** | **"What to ask"** — the should-cost → ask bridge | The unique IP, shown as a simple ask list. |
| **S5** | Auto-rerun + **"here's what changed"** diff on any update | Makes the whole thing stay true to reality. |

Each slice obeys §0: simple front, engine in the appendix. Build the front to the spec above; build
the engine to the appendix; never let the engine reach the screen.

---
---

# Appendices — the engine (the user never sees these)

These exist to keep §0–§5 simple while remaining *defensible to a CPO's legal and audit teams.*

## Appendix A · The data model (five attributes that must exist from day one)

Bake these onto every piece of evidence / every captured interaction in S1–S2. Retrofitting them
later is painful; as queries they make every later engine cheap.

| Attribute | What it carries | Powers (simply) |
|-----------|-----------------|-----------------|
| `disclosureTier` | `vendor-facing · internal · restricted` | The system never leaks (App E) |
| `provenance` + `verificationStatus` | `client-stated · vendor-asserted · third-party-verified · contractually-committed` | "A vendor's promise isn't a fact until it's in the contract" (App B) |
| `version` + `lineage` + `supersedes` | which input/interaction it came from, what it replaced | "Here's what changed" (App D) — extends the existing fact-supersession |
| `materiality` | `material · routine` | Decides what needs a human OK vs. auto-logs (App D) |
| `vendorId` + `affectsComparison` | which vendor, does it move the ranking | Cross-vendor re-level (App C/D) |

## Appendix B · Objective scoring engine ("how they stack up")

Objectivity in sourcing = **weights locked before bids open · an anchored rubric · disqualifiers ·
every score tied to evidence.** The *canon* for this already exists per archetype
(`evaluationModel.criteria` with weights, `disqualifiers`, anchored rubric text in
`scorecard-payload.ts`). The missing **engine**:
- Pull each vendor's response into the **same per-criterion fields** so reviewers score identical,
  cited things (structured extraction off the normalized responses).
- Capture **≥2 reviewer scores per criterion** (the evidence contract already requires this:
  `EVID-SRC-EVAL-RATER-SCORES` — "≥2 raters with deviation logged"), compute **inter-rater
  deviation**, flag low-consensus criteria to re-score.
- Apply the locked weights → weighted rank; auto-apply disqualifiers.
- **Surface as:** "A leads on capability, B is cheapest, here's the trade-off and the one risk." The
  reviewer just types scores against an anchored 1–5; the math is invisible.

## Appendix C · Should-cost → BAFO-ask bridge (the unique IP — "what to ask")

The real asset already on `main`: a **deterministic should-cost / pricing-normalization engine**
(`pricing-normalization.ts` — multi-year TCO, rate-escalation compounding, comparability gating,
*refuses when line items aren't comparable*). And the **negotiation-lever canon** is expert-grade
(`registry.ts` `negotiationLevers` — timing-sequenced: incumbent leverage @ pre-RFP, volume bands @
RFP, productivity glide-path @ BAFO, termination assistance @ contracting).

Today's gap: the BAFO asks are **seeded** (`bafo-negotiation-model.ts`: *"market median minus 5%"*),
not computed. The bridge to build:

```
should-cost gap (per vendor, per line)  →  matched timing-sequenced lever  →
vendor-specific, evidence-cited ask  →  computed walk-away
```

e.g. *"Vendor A's L2 rate is 23% over should-cost on 14k tickets/yr → volume-band + productivity-
glidepath → ask: rate at should-cost +8% with a 5%/yr productivity credit → walk-away $X."* Every
number cited; recomputed the instant a vendor revises (App D). **Surface as:** a plain ask list per
vendor. This is the differentiator — everyone else hands over a "negotiate harder" memo.

## Appendix D · Reconciliation engine ("here's what changed")

Driven by the "Add what happened" button (§4). The loop:

```
capture (interaction)  →  extract (Sentinel proposes tagged deltas)  →
review (materiality triage: routine auto-logs; material → one-tap human OK)  →
supersede (new version + lineage; never overwrite)  →
staleness (deliverables that used the old input are flagged via the dependency graph)  →
regen (stale docs re-draft async via the AQ3 orchestrator)  →  audit (every change traces to an interaction + an OK)
```

Principles: **vendor-stated facts never auto-commit** (they're proposals until OK'd); **versioned
with lineage** (the "why did it change" answer is always on record); **deliverables declare their
inputs** so one update cascades to exactly the right docs. Reuses: fact-supersession, the review
queue, the activity log, AQ3 async regen — all already on `main`. Net-new: the interaction model
(App A), the deliverable→input dependency graph, the extract-and-propose step. **Surface as:** one
sentence + a diff.

## Appendix E · Disclosure & fairness (invisible, non-negotiable)

- Every artifact carries `disclosureTier`; reads and generated docs respect it. **No vendor ever
  sees another vendor's data; should-cost / value target / pre-issue weights are internal-only.**
- **Equal treatment:** a clarification "issued" to one bidder is enforced + logged as issued to
  **all**, timestamped. (Public/regulated procurement requires provable equal treatment.)
- `vendor-asserted` evidence can't appear as fact in a deliverable (App A/B). **Surface as:** the
  system simply doesn't leak and the audit log proves fairness — the user does nothing.

## Appendix F · Grounding — what exists on `main` vs. net-new

| Already built (reuse) | Net-new (build) |
|-----------------------|-----------------|
| Archetype framework: evidence model, `evaluationModel` weights, `negotiationLevers`, `deliverablePack`, resolver (`archetypes/`) | The one-screen-per-stage UX (§2) keyed off it |
| Pricing-normalization / should-cost engine (`pricing-normalization.ts`) | The should-cost → ask **bridge** (App C) |
| DOCX/HTML generation + File Cabinet + section-verify (AQ1/1b/1c/2) | "Add what happened" capture (App A interaction model) |
| AQ3 async generation queue | Deliverable→input **dependency graph** (App D) |
| Fact-supersession, review queue, activity log | Multi-rater scoring **engine** (App B); disclosure-tier enforcement (App E) |
| Gate criteria + evidence requirements (canonical-specs) | Materiality classifier (App D) |

**The headline:** most of the *engine* exists. The work is (a) the **simple front** that hides it,
and (b) three bridges — should-cost→ask, interaction→reconcile, response→score. Build the front
first (S1); let each engine earn its way in behind a screen that never changes shape.
