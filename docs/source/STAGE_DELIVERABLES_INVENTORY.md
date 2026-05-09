# Source · Per-stage deliverables, uploads, and capabilities inventory

The companion to `DOCUMENT_FORMAT_MAP.md`. The format map covered our
33 canonical generated artifacts. This inventory covers what's
**actually moving through each stage end-to-end**:

- **Outputs** — what the agent generates (the 33 canonical artifacts)
- **Uploads** — what the client + vendors provide (CMDB extracts,
  baseline packs, vendor proposals, signed contracts, etc.)
- **Capabilities** — what the agent *does* at each step, not just
  what it outputs (parse, normalize, score, surface gaps)
- **Interaction patterns** — multi-step lifecycles where one substrate
  row spans template-gen → vendor-fill → agent-normalize, etc.

Format alignment shorthand: **md** · **docx** · **xlsx** · **html** · **pdf** ·
**mixed** (uploaded files vary).

---

## Stage 01 · Strategy

### Outputs (agent / hybrid)
| Code | Name | Format | Author | Notes |
|---|---|---|---|---|
| d01 | Sourcing Strategy Memo | md → docx | hybrid | Why now / what / value / archetype / rigor — narrative |
| d02 | Value Target Brief | md → xlsx + docx | hybrid | Range + confidence band; xlsx makes the math auditable |
| d03 | Archetype Decision Record | md → docx | agent | Cloud / AMS / Data / Enterprise / Custom + rationale |

### Uploads expected
*(none — Strategy is internal framing; nothing comes from outside)*

### Capabilities
- Generate strategy memo from intake (trigger, owner, scope, value, baseline owner)
- Recommend archetype based on the intake + tenant profile
- Recommend rigor (standard / enhanced / strategic) based on deal size + risk profile
- Surface value-target levers tied to the archetype
- Flag missing intake fields (Steward voice)

### Interaction patterns
None complex. Linear: intake → agent draft → human edit → mark complete.

---

## Stage 02 · Scope

### Outputs (agent / hybrid)
| Code | Name | Format | Author | Notes |
|---|---|---|---|---|
| d04 | Application Inventory & Tiering | xlsx | upload + agent | CMDB extract → tier classification → signed by EA council |
| d05 | Scope Memo with Boundaries | md → docx | hybrid | In/out scope; vendor-facing once locked |
| d06 | Exclusion Log | md → xlsx | hybrid | Things explicitly NOT in scope + rationale |
| d07 | Ticket History Synthesis | xlsx → md summary | upload + agent | Raw ticket export → tier/volume/time-of-day patterns |
| d08 | Pre-mortem on Scope Risk | md → docx | agent | "What can go wrong" scenarios |

### Uploads expected
| What | From | Format | Bound to |
|---|---|---|---|
| **CMDB extract** (app inventory raw) | Client (architecture team) | xlsx / csv | Feeds d04 |
| **Ticket history export** (24-month L2/L3 incidents) | Client (ITSM owner — ServiceNow / Jira / etc.) | xlsx / csv | Feeds d07 |
| **Existing scope artifacts** (prior RFP, SOW, contract scope schedules) | Client (procurement) | docx / pdf | Reference material — agent extracts in/out scope candidates |

### Capabilities
- **Parse CMDB upload** → identify app criticality tiers (1/2/3) + ownership
- **Parse ticket history** → cluster by app + tier + time-of-day; flag stale data (>14 days old)
- **Generate scope memo** from intake + parsed app inventory + parsed ticket history
- **Surface gaps**: applications in CMDB but not in tickets; tickets for apps not in CMDB; unowned apps
- **Generate exclusion log** by inferring what's NOT mentioned in scope memo but appears in CMDB
- **Run pre-mortem** — generate scenarios where scope choice fails (informed by tier 1 apps + L2/L3 patterns)

### Interaction patterns

**App inventory lifecycle** (multi-step):
1. Agent generates **xlsx template** with required columns (app_name, tier, owner, in_scope) and a sample row showing format
2. Client downloads, fills from CMDB, uploads
3. Agent parses + validates (missing tiers, unowned apps) and surfaces gaps
4. Client iterates until clean
5. EA council signs off → status `approved`

**Ticket history lifecycle**: same pattern. Agent provides template (with required columns: ticket_id, app, tier, opened_at, resolved_at, severity, summary). Client exports + uploads. Agent synthesizes the markdown summary (d07).

---

## Stage 03 · RFP

### Outputs (agent / hybrid)
| Code | Name | Format | Author | Notes |
|---|---|---|---|---|
| d09 | RFP Package | md → docx | hybrid | Vendor-facing flagship document |
| d10 | RFI Summary (optional) | md → docx | agent | If pre-RFI was run |
| d11 | Response Checklist | md → xlsx | agent | Sent with RFP; vendors mark items as they respond |
| d12 | Vendor Shortlist | md → xlsx | hybrid | Few rows + rationale |

### Uploads expected
| What | From | Format | Bound to |
|---|---|---|---|
| **Prior RFI responses** (if pre-RFI was run) | Client / vendors from the prior round | docx / pdf / xlsx | Feeds d10 |
| **Vendor capability docs** (websites, marketing PDFs, analyst reports) | Client research / Sentinel ingestion | mixed | Feeds d12 shortlist rationale |

### Capabilities
- **Generate RFP package** from approved upstream (d01 strategy + d05 scope + d04 app inventory + d07 ticket synthesis) — this is THE flagship generation
- **Generate response checklist** xlsx — required items vendors must address, mapped to RFP sections
- **Recommend vendor shortlist** by matching tenant profile + archetype against vendor capability database
- **Render RFP to docx** with cover, TOC, sections, signature page, appendices

### Interaction patterns

**RFP package lifecycle**:
1. Agent generates **markdown body** (the meat) — context-bound to upstream artifacts
2. Human edits in canvas
3. Agent **renders to docx** with vendor-facing styling
4. Procurement sends docx to vendors via email/portal (out of scope for now; we just produce the file)

**Response checklist lifecycle**:
1. Agent generates xlsx with three columns: requirement, page-reference, vendor-response
2. Goes to vendors as part of RFP package
3. Vendors fill column 3 + upload back at Stage 04 (d13)

---

## Stage 04 · Responses

### Outputs (agent / hybrid)
| Code | Name | Format | Author | Notes |
|---|---|---|---|---|
| d13 | Vendor Response Pack | mixed | **upload only** | Each vendor's complete submission |
| d14 | Q&A Log | md → xlsx | hybrid | Cross-vendor questions + answers |
| d15 | Response Completeness Report | md → xlsx | agent | Per-vendor checklist with completeness % |

### Uploads expected
| What | From | Format | Bound to |
|---|---|---|---|
| **Vendor proposals** (1 per vendor) | Each shortlisted vendor | docx + pdf + xlsx (mixed) | Feeds d13, d15 |
| **Filled response checklist** | Each vendor | xlsx (the template we sent) | Feeds d15 |
| **Q&A from vendors** | Each vendor (during the question window) | mixed | Feeds d14 |

### Capabilities
- **Parse multi-format vendor proposals** — text from docx/pdf, structured data from xlsx
- **Run completeness check** — match vendor checklist xlsx against original requirements; flag missing items
- **Cluster Q&A** across vendors — surface questions that ≥ 2 vendors asked (signals scope ambiguity)
- **Surface anomalies** — claims without evidence, unusually low/high pricing, capability over-claims
- **Generate response completeness report** xlsx — per-vendor row, per-requirement column, completeness % + gap list

### Interaction patterns

**Vendor response intake lifecycle**:
1. Vendor uploads docx/pdf/xlsx via vendor portal (or procurement uploads on their behalf)
2. Upload pipeline: bytes → `source-artifacts` bucket; row in `source_artifacts` registry
3. Synchronous text-parser + async vector + graph passes (already partially built)
4. d13 status flips from `not_started` → `received` per vendor
5. Once all vendors in: agent runs d14 + d15 generation

---

## Stage 05 · Evaluation

### Outputs (agent / hybrid)
| Code | Name | Format | Author | Notes |
|---|---|---|---|---|
| d16 | Evaluation Scorecard | xlsx | hybrid | Weighted scoring with rater rows + vendor columns |
| d17 | Weight Set Governance Log | md → xlsx | hybrid | Audit trail of weight changes |
| d18 | Disqualification Rationale | md → docx | hybrid | Per disqualified vendor |

### Uploads expected
| What | From | Format | Bound to |
|---|---|---|---|
| **Per-rater score sheets** | Each scorecard rater (procurement, EA, security, business) | xlsx (filled template) | Feeds d16 |
| **Reference checks** (optional) | Procurement / Sentinel | mixed | Feeds rater context |

### Capabilities
- **Generate scorecard xlsx template** with weights + rater rows + vendor columns + auto-sum formulas
- **Validate rater submissions** — deviation > 5 points flagged for re-rating
- **Run sensitivity analysis** at proposed weight changes
- **Surface evidence-citation gaps** — scores without linked evidence
- **Generate disqualification rationale** for failed-threshold vendors (with linked evidence)
- **Generate weight-set governance log** entries on every weight change

### Interaction patterns

**Scorecard lifecycle** (multi-rater):
1. Agent generates **xlsx template** — sheet 1: weights (locked), sheet 2: rater 1, sheet 3: rater 2, ..., sheet N: aggregate
2. Each rater downloads, fills their sheet, uploads
3. Agent merges + computes aggregate + flags deviations > threshold
4. Steward reviews → signs off → status `approved`

**Weight set lifecycle**: any weight change is logged as a governance entry. Logged with prior value, new value, rationale, approver.

---

## Stage 06 · Pricing

### Outputs (agent / hybrid)
| Code | Name | Format | Author | Notes |
|---|---|---|---|---|
| d19 | Pricing Normalization Workbook | xlsx | upload + agent | Multi-step lifecycle (see below) |
| d20 | Pricing Trap Log | md → xlsx | hybrid | Traps + severity + vendor source |
| d21 | Locked Assumption Set | md → docx | hybrid | Frozen assumptions; signed |

### Uploads expected
| What | From | Format | Bound to |
|---|---|---|---|
| **Vendor pricing submissions** (1 per vendor) | Each shortlisted vendor | xlsx (filled from our template) | Feeds d19 normalization |
| **Optional vendor commercial decks** | Each vendor | pdf / pptx | Reference for trap-log entries |

### Capabilities
- **Generate empty pricing template xlsx** — line items reflect actual scope (from d05) + assumption set (from d21) + TCO horizon (3-year default, override from intake value-target)
- **Parse uploaded vendor pricing xlsx** — read line items, validate against template structure, flag extra rows / missing rows / formula breaks
- **Normalize to common assumption set** — apply assumption corrections (FTE rate, currency, escalator, term length); recompute TCO
- **Generate normalized comparison xlsx** — vendor columns, line-item rows, normalized totals + delta vs lowest
- **Surface pricing traps** — penalty fees, autoescalators, true-up clauses, pass-through markups, hidden minimums
- **Render docx for assumption set** — signed off; vendor pricing is then locked against this

### Interaction patterns — **THE PRICING LIFECYCLE** (the user's specific question)

This is the load-bearing multi-step pattern. d19 is one substrate row but spans four sub-artifacts:

1. **d19a · Pricing Template (agent → client → vendors)**
   - Agent generates **empty xlsx template** with:
     - Sheet 1 · `Cover` — event metadata, instructions, version, vendor name slot
     - Sheet 2 · `Assumption Set` (read-only) — locked assumptions from d21 (FTE rate, term length, currency, escalator, support hours, SLA tier)
     - Sheet 3 · `Pricing Detail` — line items derived from d05 scope (e.g., L2/L3 incident management for Epic CIS, MyChart, Cloverleaf — each with unit + qty + unit price slot + extended price formula)
     - Sheet 4 · `TCO Summary` (formula-driven) — Year 1 / Year 2 / Year 3 / 3-year total, computed from Sheet 3
     - Sheet 5 · `Pricing Notes` (vendor-fill) — assumptions vendor wants to challenge, alternative pricing models
   - Client downloads → procurement sends to vendors via vendor portal
   - **This template generation does NOT exist today.** This is the gap the user is pointing at.

2. **d19b · Vendor Pricing Submissions (uploads, multiple)**
   - Each vendor downloads, fills, returns
   - Procurement uploads each vendor's submission to AbarVa
   - Upload endpoint already exists (`/api/v1/source/{id}/artifacts/upload`); needs UI surface

3. **d19c · Pricing Normalization Comparison (agent → human review)**
   - Agent reads each vendor's submission, validates structure
   - Applies any assumption corrections (e.g. vendor used $200/hr FTE rate but assumption set is $185/hr → corrected)
   - Generates **comparison xlsx**: vendor columns × line-item rows × normalized totals, with delta vs lowest highlighted
   - Surfaces pricing traps (Sheet 5 narrative + numerical patterns) into d20 trap log

4. **d21 · Locked Assumption Set (md → docx)**
   - Frozen assumptions used to evaluate d19
   - Generated upfront BEFORE the pricing template; vendors price against this

**Why this matters**: without (1), there's no template for vendors to fill, so (2) is unstructured PDFs from each vendor that need manual normalization. The whole automation thesis falls apart.

---

## Stage 07 · BAFO

### Outputs (agent / hybrid)
| Code | Name | Format | Author | Notes |
|---|---|---|---|---|
| d22 | BAFO Question Pack | md → docx | agent | Round 1 + Round 2 questions per finalist |
| d23 | BAFO Round Log | md → xlsx | hybrid | Round-by-round concession log |

### Uploads expected
| What | From | Format | Bound to |
|---|---|---|---|
| **Finalist BAFO responses** (per round, per finalist) | Each finalist | xlsx + docx (concession narrative) | Feeds d23 |

### Capabilities
- **Generate BAFO question pack** — pull pricing traps (d20) + completeness gaps (d15) + scoring deviations (d16) → generate per-finalist questions
- **Compare BAFO deltas** across rounds — what improved, what didn't, what the vendor refused
- **Generate concession log entries** with vendor + round + concession-type (price, term, SLA, scope) + narrative

---

## Stage 08 · Executive Decision

### Outputs (agent / hybrid)
| Code | Name | Format | Author | Notes |
|---|---|---|---|---|
| d24 | Atlas Decision Brief | md → docx + html + pdf | hybrid | Board-ready exec packet |
| d25 | Sentinel Risk Attestation | md → docx + pdf | agent | Formally signed |
| d26 | Steward Sign-off Record | md → docx + pdf | hybrid | Formally signed |

### Uploads expected
| What | From | Format | Bound to |
|---|---|---|---|
| **Sponsor pre-read questions** (optional) | CFO / CIO | mixed | Feeds d24 prep |

### Capabilities
- **Generate decision brief** — Atlas voice, exec packet style, references all upstream substrate (scorecard, normalized pricing, BAFO log, scope, value target)
- **Generate risk attestation** — Sentinel voice, evidence-citation requirement, lists residual risks
- **Render docx + html + pdf** — docx for the deck, html embeddable, pdf signed
- **Capture digital signature** — Steward sign-off + Sentinel attestation get signed (out of scope; via DocuSign integration later)

### Interaction patterns

**Signed document lifecycle**:
1. Agent generates md draft
2. Human edits
3. Agent renders to docx + html
4. docx flows through digital-signature provider (e.g. DocuSign) — out of scope for now
5. Returned signed pdf is uploaded back; status flips to `locked`

---

## Stage 09 · Selection

### Outputs (agent / hybrid)
| Code | Name | Format | Author | Notes |
|---|---|---|---|---|
| d27 | Selection Memo | md → docx | hybrid | Awarded vendor + rationale narrative |
| d28 | Contract Record | md (metadata) + uploaded file | upload (metadata) | The actual contract is the uploaded file |

### Uploads expected
| What | From | Format | Bound to |
|---|---|---|---|
| **Final signed contract** | Awarded vendor + client legal | docx + signed pdf | Feeds d28 |
| **Optional MSA / SOW amendments** | Client legal | docx + pdf | Reference for d28 metadata |

### Capabilities
- **Generate selection memo** from decision brief + scorecard + normalized pricing
- **Extract contract metadata** from uploaded contract (effective date, end date, value, auto-renew, payment terms, SLA)
- **Cross-validate** contract metadata against d24 decision brief — flag discrepancies (e.g. brief said $11.5M, contract says $11.8M)

---

## Stage 10 · Transition

### Outputs (agent / hybrid)
| Code | Name | Format | Author | Notes |
|---|---|---|---|---|
| d29 | Transition Plan | xlsx + md | hybrid | Milestones + dates + owners |
| d30 | Checkpoint Log | md → xlsx | hybrid | Per-checkpoint pass/fail history |
| d31 | Knowledge-Transfer Evidence | mixed | upload + agent | Recordings, decks, runbooks |

### Uploads expected
| What | From | Format | Bound to |
|---|---|---|---|
| **KT recordings** | Vendor + client teams | mp4 / mkv | Feeds d31 |
| **Vendor runbooks** | Awarded vendor | docx / pdf / Confluence-export-html | Feeds d31 |
| **Joint training decks** | Client + vendor | pptx | Feeds d31 |

### Capabilities
- **Generate transition plan xlsx** with milestone columns, owner per row, RACI alignment
- **Index uploaded KT artifacts** — text extract, vector embed, graph link to checkpoints
- **Run checkpoint go/no-go check** per milestone → log decision in d30

---

## Stage 11 · Value

### Outputs (agent / hybrid)
| Code | Name | Format | Author | Notes |
|---|---|---|---|---|
| d32 | Value Ledger | xlsx + html | hybrid | Projected → committed → measuring → realized |
| d33 | Governance Review Note | md → docx | agent | Quarterly review prose |

### Uploads expected
| What | From | Format | Bound to |
|---|---|---|---|
| **Quarterly invoice statements** | Vendor / Finance | xlsx / pdf | Feeds d32 measuring → realized columns |
| **Optional KPI exports** (uptime, ticket volume, SLA breach %) | Client ITSM owner | xlsx / csv | Feeds d32 evidence column |

### Capabilities
- **Generate value ledger xlsx** seeded from d02 value-target (projected) + d24 decision brief (committed)
- **Render html dashboard view** for executive consumption
- **Parse quarterly statements** → populate measuring → realized columns
- **Flag drift** — when measuring deviates > 10% from committed, surface to Atlas governance review
- **Generate quarterly governance review** narrative — what's on track, what isn't, what changed assumptions

---

## Roll-up — every artifact actor across all stages

### What the agent generates from scratch
| | |
|---|---|
| **md → docx** narratives | d01, d03, d05, d08, d10, d22, d27, d33 (and d24, d25, d26 with template scaffolds) |
| **xlsx templates** (vendor / client to fill) | d04 (app inv template), d07 (ticket history template), **d11 (response checklist), d16 (scorecard template), d19a (pricing template)**, d29 (transition plan template) |
| **xlsx normalized comparisons** (post-vendor-upload) | **d19c (pricing normalization)**, d15 (response completeness), d16 (scorecard aggregate) |
| **md narratives derived from uploads** | d07 (ticket synth summary), d14 (Q&A log), d20 (trap log) |

### What clients upload
- CMDB extract (d04 raw)
- Ticket history export (d07 raw)
- Per-rater scorecard sheets (d16)
- Quarterly statements (d32)

### What vendors upload
- Filled response checklist (d11)
- Vendor proposals (d13 — docx/pdf/xlsx mixed)
- Filled pricing template (d19b)
- BAFO responses (d22)
- Final signed contract (d28)
- KT artifacts (d31)

---

## Format alignment — final consolidated count

The original DOCUMENT_FORMAT_MAP got the **format trajectory** right but **understated xlsx**. Once you include templates that the agent generates for vendors/clients to fill (not just the final outputs), the xlsx surface area grows.

| Format | What it covers | Total artifact-format pairs |
|---|---|---|
| md (always) | Inline body for every artifact | 33 |
| **xlsx** (templates + comparisons + ledgers) | d04 template/upload, d06, d07 template/upload, d11 template, d14, d15, **d16 template + aggregate, d17, d19 template + normalized, d20**, d23, d29 template, d30, **d32 ledger + html** | **15 distinct artifacts × ~22 xlsx surfaces** (some have both template and comparison views) |
| docx | d01, d05, d08, d09 (vendor-facing), d10, d18, d21, d22, d24, d25, d26, d27, d33 | 13 |
| html | d24 brief, d32 ledger, optional d09 web preview | 3 |
| pdf (signed/archived) | d24 brief, d25 attestation, d26 signoff, d28 contract | 4 |

**The pricing template alone (d19a) blocks the entire pricing automation flow.** Without it, vendors send unstructured PDFs that humans normalize manually — defeating the AbarVa value proposition for that stage.

---

## Build order, revised by this inventory

The original 5-slice plan in DOCUMENT_FORMAT_MAP stays correct but **Slice 3 (xlsx) needs to come before Slice 2 (docx) for any pricing-stage demo**, because:

1. Slice 1 — Markdown via Claude (all 33) — unchanged
2. **Slice 2 (REVISED) — xlsx generators, top 4** :
   - **d19 Pricing Workbook** — empty template + normalization comparison
   - **d16 Evaluation Scorecard** — template + aggregate
   - **d04 Application Inventory** — template + parsed-back form
   - **d11 Response Checklist** — template
3. **Slice 3 (REVISED) — docx renderers, top 4**:
   - d09 RFP Package
   - d24 Decision Brief
   - d05 Scope Memo
   - d27 Selection Memo
4. Slice 4 — html / pdf — unchanged
5. Slice 5 — Upload paperclip UI — moves earlier in the sequence (any xlsx-template flow needs the upload-back path to work)

**Revised effort estimate:** still ~16–22 days; the swap doesn't change cost, it changes order so the pricing demo works first.

---

## What's NOT in this inventory

To stay honest about what's still uncatalogued:

- **Cross-stage triggers** — what an upstream artifact's status flip implies for downstream artifacts (e.g. d05 lock invalidates an in-progress d09 generation; d16 disqualification flips a vendor's d22 BAFO state)
- **Vendor portal** — the surface where vendors upload responses today is procurement-mediated; a real vendor portal is a Wave 3+ feature
- **Audit / provenance for generated content** — every Claude generation should carry context-receipt metadata (which upstream artifacts were bound, which model, which prompt template version). Currently planned but not yet implemented
- **Multi-tenant content security** — generation must never bind context across tenants; today the binding logic checks `client_key`, but the test coverage is not exhaustive
- **Localization** — RFPs in non-English markets, currency conversion in the pricing workbook, regional date formats
